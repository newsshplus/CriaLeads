import { 
  AdminMenuConfig, 
  MenuItem, 
  MenuItemId, 
  RolePermission, 
  UserPermissions,
  DEFAULT_ADMIN_CONFIG,
  DEFAULT_MENU_ITEMS,
  DEFAULT_ROLES
} from '../types';

const ADMIN_CONFIG_KEY = 'admin_menu_config_v1';
const USER_PERMISSIONS_KEY = 'user_permissions_v1';
const CURRENT_USER_ROLE_KEY = 'current_user_role_v1';

/* ============================================================
   DEFAULT CONFIGURATION
   ============================================================ */

// Get default config
export function getDefaultAdminConfig(): AdminMenuConfig {
  return {
    ...DEFAULT_ADMIN_CONFIG,
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };
}

/* ============================================================
   ADMIN CONFIG MANAGEMENT
   ============================================================ */

export function getAdminConfig(): AdminMenuConfig {
  try {
    const raw = localStorage.getItem(ADMIN_CONFIG_KEY);
    if (raw) {
      const config = JSON.parse(raw);
      // Merge with defaults to ensure new menu items are added
      return mergeWithDefaults(config);
    }
  } catch (e) {
    console.error('Error loading admin config:', e);
  }
  return getDefaultAdminConfig();
}

export function saveAdminConfig(config: AdminMenuConfig): AdminMenuConfig {
  const updatedConfig = {
    ...config,
    version: (config.version || 0) + 1,
    updatedAt: new Date().toISOString(),
    updatedBy: getCurrentUserId(),
  };
  try {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(updatedConfig));
  } catch (e) {
    console.error('Error saving admin config:', e);
  }
  return updatedConfig;
}

function mergeWithDefaults(config: AdminMenuConfig): AdminMenuConfig {
  // Ensure all default menu items exist
  const defaultIds = new Set(DEFAULT_MENU_ITEMS.flatMap(item => 
    [item.id].concat(item.children?.map(c => c.id) || [])
  ));
  
  const existingIds = new Set(config.menuItems.flatMap(item => 
    [item.id].concat(item.children?.map(c => c.id) || [])
  ));

  // Add missing default items
  for (const defaultItem of DEFAULT_MENU_ITEMS) {
    const exists = config.menuItems.find(m => m.id === defaultItem.id);
    if (!exists) {
      config.menuItems.push({ ...defaultItem });
    } else {
      // Check children
      if (defaultItem.children) {
        for (const child of defaultItem.children) {
          const childExists = config.menuItems.flatMap(m => m.children || []).find(c => c.id === child.id);
          if (!childExists) {
            if (!exists.children) exists.children = [];
            exists.children.push({ ...child });
          }
        }
      }
    }
  }

  // Ensure all default roles exist
  for (const defaultRole of DEFAULT_ROLES) {
    if (!config.roles.find(r => r.roleId === defaultRole.roleId)) {
      config.roles.push({ ...defaultRole });
    }
  }

  return config;
}

/* ============================================================
   USER ROLE & PERMISSIONS
   ============================================================ */

export function getCurrentUserRole(): string {
  try {
    const role = localStorage.getItem(CURRENT_USER_ROLE_KEY);
    if (role) return role;
  } catch (e) {
    console.error('Error loading user role:', e);
  }
  // Default to 'sdr' for new users
  return 'sdr';
}

export function setCurrentUserRole(roleId: string): void {
  try {
    localStorage.setItem(CURRENT_USER_ROLE_KEY, roleId);
  } catch (e) {
    console.error('Error saving user role:', e);
  }
}

export function getCurrentUserId(): string {
  try {
    const id = localStorage.getItem('current_user_id');
    if (id) return id;
  } catch (e) {}
  return 'current_user';
}

export function setCurrentUserId(userId: string): void {
  try {
    localStorage.setItem('current_user_id', userId);
  } catch (e) {
    console.error('Error saving user id:', e);
  }
}

export function getUserPermissions(): UserPermissions {
  const roleId = getCurrentUserRole();

  try {
    const raw = localStorage.getItem(USER_PERMISSIONS_KEY);
    if (raw) {
      const custom = JSON.parse(raw) as UserPermissions;
      return {
        userId: getCurrentUserId(),
        roleId: custom.roleId || roleId,
        customPermissions: custom.customPermissions,
      };
    }
  } catch (e) {
    console.error('Error loading user permissions:', e);
  }
  return {
    userId: getCurrentUserId(),
    roleId,
  };
}

export function getEffectivePermissions(): Record<MenuItemId, boolean> {
  const config = getAdminConfig();
  const userPerms = getUserPermissions();
  const role = config.roles.find(r => r.roleId === userPerms.roleId) || config.roles[0];
  
  const permissions: Record<string, boolean> = { ...role.permissions };
  
  // Apply custom user overrides
  if (userPerms.customPermissions) {
    for (const [key, value] of Object.entries(userPerms.customPermissions)) {
      permissions[key] = value;
    }
  }
  
  return permissions as Record<MenuItemId, boolean>;
}

/* ============================================================
   MENU VISIBILITY HELPERS
   ============================================================ */

export function isMenuItemVisible(menuItemId: MenuItemId): boolean {
  const permissions = getEffectivePermissions();
  const config = getAdminConfig();
  const menuItem = findMenuItem(config.menuItems, menuItemId);
  
  if (!menuItem) return false;
  if (!menuItem.visible) return false;
  if (menuItem.parentId && !isMenuItemVisible(menuItem.parentId)) return false;
  
  return permissions[menuItemId] === true;
}

export function getVisibleMenuItems(): MenuItem[] {
  const config = getAdminConfig();
  const permissions = getEffectivePermissions();
  
  return config.menuItems
    .filter(item => item.visible && permissions[item.id])
    .map(item => ({
      ...item,
      children: item.children?.filter(child => 
        child.visible && permissions[child.id] && isMenuItemVisible(child.id)
      ) || [],
    }));
}

export function findMenuItem(menuItems: MenuItem[], id: MenuItemId): MenuItem | undefined {
  for (const item of menuItems) {
    if (item.id === id) return item;
    if (item.children) {
      const found = findMenuItem(item.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/* ============================================================
   ADMIN PANEL OPERATIONS (Menu Management)
   ============================================================ */

export function updateMenuItemVisibility(
  menuItemId: MenuItemId, 
  visible: boolean, 
  updatedBy: string = 'admin'
): AdminMenuConfig {
  const config = getAdminConfig();
  const item = findMenuItem(config.menuItems, menuItemId);
  
  if (item) {
    item.visible = visible;
    // If hiding parent, hide all children
    if (!visible && item.children) {
      for (const child of item.children) {
        child.visible = false;
      }
    }
    // If showing child, ensure parent is visible
    if (visible && item.parentId) {
      const parent = findMenuItem(config.menuItems, item.parentId);
      if (parent) parent.visible = true;
    }
    
    return saveAdminConfig(config);
  }
  return getAdminConfig();
}

export function updateMenuItem(
  menuItemId: MenuItemId, 
  updates: Partial<MenuItem>,
  updatedBy: string = 'admin'
): AdminMenuConfig {
  const config = getAdminConfig();
  const item = findMenuItem(config.menuItems, menuItemId);
  
  if (item) {
    Object.assign(item, updates);
    return saveAdminConfig(config);
  }
  return getAdminConfig();
}

export function addMenuItem(
  parentId: MenuItemId | null,
  newItem: Omit<MenuItem, 'id'> & { id: MenuItemId },
  updatedBy: string = 'admin'
): AdminMenuConfig {
  const config = getAdminConfig();
  
  if (parentId) {
    const parent = findMenuItem(config.menuItems, parentId);
    if (parent) {
      if (!parent.children) parent.children = [];
      parent.children.push(newItem as MenuItem);
    }
  } else {
    config.menuItems.push(newItem as MenuItem);
  }
  
  // Sort by order
  sortMenuItems(config.menuItems);
  
  return saveAdminConfig(config);
}

export function removeMenuItem(menuItemId: MenuItemId, updatedBy: string = 'admin'): AdminMenuConfig {
  const config = getAdminConfig();
  removeItemRecursive(config.menuItems, menuItemId);
  return saveAdminConfig(config);
}

function removeItemRecursive(items: MenuItem[], id: MenuItemId): boolean {
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    items.splice(index, 1);
    return true;
  }
  for (const item of items) {
    if (item.children && removeItemRecursive(item.children, id)) {
      return true;
    }
  }
  return false;
}

function sortMenuItems(items: MenuItem[]): void {
  items.sort((a, b) => a.order - b.order);
  for (const item of items) {
    if (item.children) {
      item.children.sort((a, b) => a.order - b.order);
    }
  }
}

/* ============================================================
   ROLE PERMISSIONS MANAGEMENT
   ============================================================ */

export function updateRolePermissions(
  roleId: string,
  permissions: Record<MenuItemId, boolean>,
  updatedBy: string = 'admin'
): AdminMenuConfig {
  const config = getAdminConfig();
  const roleIndex = config.roles.findIndex(r => r.roleId === roleId);
  
  if (roleIndex !== -1) {
    config.roles[roleIndex].permissions = permissions;
    return saveAdminConfig(config);
  }
  return getAdminConfig();
}

export function createRole(
  roleId: string,
  roleName: string,
  permissions: Record<MenuItemId, boolean>,
  updatedBy: string = 'admin'
): AdminMenuConfig {
  const config = getAdminConfig();
  config.roles.push({
    roleId,
    roleName,
    permissions,
  });
  return saveAdminConfig(config);
}

export function deleteRole(roleId: string, updatedBy: string = 'admin'): AdminMenuConfig {
  const config = getAdminConfig();
  // Prevent deleting system roles
  if (['super_admin', 'admin', 'manager', 'sdr', 'viewer'].includes(roleId)) {
    throw new Error('Cannot delete system roles');
  }
  config.roles = config.roles.filter(r => r.roleId !== roleId);
  return saveAdminConfig(config);
}

export function getAvailableRoles(): RolePermission[] {
  const config = getAdminConfig();
  return config.roles;
}

/* ============================================================
   USER ROLE ASSIGNMENT
   ============================================================ */

export function assignUserRole(userId: string, roleId: string): void {
  const config = getAdminConfig();
  const role = config.roles.find(r => r.roleId === roleId);
  if (!role) throw new Error(`Role ${roleId} not found`);
  
  try {
    const raw = localStorage.getItem('user_roles_v1') || '{}';
    const roles = JSON.parse(raw);
    roles[userId] = roleId;
    localStorage.setItem('user_roles_v1', JSON.stringify(roles));
  } catch (e) {
    console.error('Error assigning user role:', e);
  }
}

export function getUserRole(userId: string): string {
  try {
    const raw = localStorage.getItem('user_roles_v1') || '{}';
    const roles = JSON.parse(raw);
    return roles[userId] || getCurrentUserRole();
  } catch (e) {
    return getCurrentUserRole();
  }
}

/* ============================================================
   UTILITY
   ============================================================ */

export function resetAdminConfig(): AdminMenuConfig {
  localStorage.removeItem(ADMIN_CONFIG_KEY);
  localStorage.removeItem(USER_PERMISSIONS_KEY);
  return getDefaultAdminConfig();
}

export function exportAdminConfig(): string {
  const config = getAdminConfig();
  return JSON.stringify(config, null, 2);
}

export function importAdminConfig(json: string, updatedBy: string = 'admin'): AdminMenuConfig {
  try {
    const config = JSON.parse(json);
    const merged = mergeWithDefaults(config);
    return saveAdminConfig({ ...merged, updatedBy });
  } catch (e) {
    console.error('Error importing admin config:', e);
    throw new Error('Invalid admin config format');
  }
}

export { DEFAULT_ROLES, DEFAULT_MENU_ITEMS, DEFAULT_ADMIN_CONFIG };