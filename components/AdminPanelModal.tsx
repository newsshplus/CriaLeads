import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Settings, Shield, Users, Key, Lock, Unlock, Eye, EyeOff, 
  Plus, Trash2, Edit3, Save, RefreshCw, ChevronDown, ChevronRight,
  ChevronLeft, Menu, XCircle, Check, AlertTriangle, Info,
  ArrowUp, ArrowDown, GripVertical, Search, AlertCircle,
  UserPlus, UserMinus, UserCheck, ShieldCheck, FileText,
  Download, Upload, RotateCcw, HelpCircle,
  LayoutDashboard, Target, Zap, GitBranch, List, Filter,
  Building2, GitMerge, Brain, Mic, History, MessageSquare, Mail,
  Calendar, BarChart3, Funnel, TrendingUp,
  Link2, Globe, CreditCard, Sparkles, Send, FileCode, CheckSquare, Square,
} from 'lucide-react';
import { 
  AdminMenuConfig, 
  MenuItem, 
  MenuItemId, 
  RolePermission, 
  DEFAULT_MENU_ITEMS,
  DEFAULT_ROLES,
  DEFAULT_ADMIN_CONFIG 
} from '../types';
import { 
  getAdminConfig, 
  saveAdminConfig, 
  getAvailableRoles, 
  updateMenuItemVisibility,
  updateMenuItem,
  addMenuItem,
  removeMenuItem,
  getAvailableRoles as getRoles,
  updateRolePermissions,
  createRole,
  deleteRole,
  getEffectivePermissions,
  getAdminConfig as getConfig,
  exportAdminConfig,
  importAdminConfig,
  resetAdminConfig,
} from '../services/adminPanelService';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, any> = {
  LayoutDashboard,
  Target,
  Search,
  Zap,
  GitBranch,
  List,
  Filter,
  Download,
  Building2,
  GitMerge,
  Users,
  Brain,
  Mic,
  History,
  MessageSquare,
  Mail,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  BarChart3,
  Funnel,
  TrendingUp,
  Settings,
  Briefcase: Building2,
  Key,
  Link2,
  Globe,
  CreditCard,
  Shield,
  Lock,
  FileText,
  Sparkles,
  Send,
  FileCode,
  CheckSquare,
  HelpCircle,
  AlertCircle,
  Info,
  Square,
};

const GetIcon: React.FC<{ name: string }> = ({ name }) => {
  const Icon = iconMap[name] || Square;
  return <Icon className="w-4 h-4" />;
};

interface MenuTreeProps {
  items: any[];
  level?: number;
  onToggle: (id: string, visible: boolean) => void;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
  permissions: Record<string, boolean>;
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  dragItem?: any;
  onDragStart?: (item: any) => void;
  onDragOver?: (e: React.DragEvent, targetId: string) => void;
  onDrop?: (e: React.DragEvent, targetId: string) => void;
}

const MenuTree: React.FC<MenuTreeProps> = ({
  items,
  level = 0,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  permissions,
  expanded,
  toggleExpand,
  dragItem,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const isExpanded = (id: string) => expanded.has(id);

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isVisible = item.visible !== false;
        const hasPermission = true; // permissions[item.id] !== false;
        const isExpandedState = isExpanded(item.id);
        const hasChildren = item.children && item.children.length > 0;
        const isParent = level === 0;
        
        return (
          <li key={item.id} className={`relative ${level > 0 ? 'ml-8 border-l border-slate-200 pl-4' : ''}`}>
            <div 
              className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                isParent ? 'bg-slate-50 border border-slate-200' : 'bg-white border border-slate-100'
              }`}
              draggable
              onDragStart={(e) => onDragStart?.(item)}
              onDragOver={(e) => onDragOver?.(e, item.id)}
              onDrop={(e) => onDrop?.(e, item.id)}
            >
              {/* Drag handle */}
              <GripVertical className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing" />
              
              {/* Expand/collapse */}
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(item.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {expanded.has(item.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}

              {/* Icon */}
              {item.icon && (
                <span className="text-slate-400" style={{ width: 20 }}>
                  <GetIcon name={item.icon} />
                </span>
              )}

              {/* Visibility toggle */}
              <button
                onClick={() => onToggle(item.id, !item.visible)}
                className={`p-1.5 rounded transition-colors ${item.visible ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                title={item.visible ? 'Ocultar menu' : 'Mostrar menu'}
              >
                {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Label */}
              <div className="flex-1 min-w-0" style={{ paddingLeft: level * 16 }}>
                <span className={`font-medium truncate ${item.visible ? '' : 'line-through text-slate-400'}`}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                    {item.badge}
                  </span>
                )}
                {item.requiredPermission && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-600 rounded">
                    {item.requiredPermission}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(item)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                  title="Editar"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {level === 0 && (
                  <button
                    onClick={() => onAddChild(item.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="Adicionar submenu"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {hasChildren && isExpanded(item.id) ? (
              <MenuTree
                items={item.children || []}
                level={level + 1}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
                permissions={permissions}
                expanded={expanded}
                toggleExpand={toggleExpand}
                dragItem={dragItem}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'menus' | 'roles' | 'users' | 'import'>('menus');
  const [config, setConfig] = useState<any>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['prospector', 'crm', 'copilot', 'outreach', 'analytics', 'settings', 'admin']));
  const [dragItem, setDragItem] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newRoleName, setNewRoleName] = useState('');
  const [importJson, setImportJson] = useState('');
  const [showImportError, setShowImportError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const permissions = useMemo(() => getEffectivePermissions(), []);
  const roles = useMemo(() => getRoles(), []);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      const config = getConfig();
      setConfig(config);
    } catch (e) {
      console.error('Error loading config:', e);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggle = (id: string, visible: boolean) => {
    try {
      updateMenuItemVisibility(id as MenuItemId, visible);
      loadConfig();
      showToast(`${visible ? 'Mostrando' : 'Ocultando'} menu`, 'success');
    } catch (e) {
      showToast('Erro ao atualizar visibilidade', 'error');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        removeMenuItem(id as MenuItemId);
        loadConfig();
        showToast('Item removido', 'success');
      } catch (e) {
        showToast('Erro ao excluir', 'error');
      }
    }
  };

  const handleAddChild = (parentId: string) => {
    const newId = `custom_${Date.now()}`;
    addMenuItem(parentId as MenuItemId, {
      id: newId as MenuItemId,
      label: 'Novo Submenu',
      icon: 'Square',
      order: 99,
      visible: true,
    });
    loadConfig();
    showToast('Submenu adicionado', 'success');
  }

  const handleSaveEdit = () => {
    if (editingItem) {
      updateMenuItem(editingItem.id, editingItem);
      loadConfig();
      setEditingItem(null);
      showToast('Salvo com sucesso', 'success');
    }
  };

  const handleDragStart = (item: any) => {
    setDragItem(item);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (dragItem && dragItem.id !== targetId) {
      // TODO: Implement reorder logic
      showToast('Reordenação não implementada ainda', 'error');
    }
    setDragItem(null);
  };

  const handleRolePermissionChange = (roleId: string, menuId: string, checked: boolean) => {
    const roles = getRoles();
    const role = roles.find(r => r.roleId === roleId);
    if (!role) return;

    const newPermissions = { ...role.permissions, [menuId]: checked };
    updateRolePermissions(role.roleId, newPermissions);
    loadConfig();
    showToast(`Permissão ${checked ? 'concedida' : 'revogada'}`, 'success');
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) return;
    const roleId = `custom_${Date.now()}`;
    try {
      createRole(`custom_${Date.now()}`, newRoleName.trim(), {} as Record<MenuItemId, boolean>);
      setNewRoleName('');
      loadConfig();
      showToast('Role criada', 'success');
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDeleteRole = (roleId: string) => {
    if (window.confirm('Tem certeza? Esta ação não pode ser desfeita.')) {
      try {
        deleteRole(roleId);
        loadConfig();
        showToast('Role excluída', 'success');
      } catch (e: any) {
        showToast(e.message, 'error');
      }
    }
  };

  const handleExport = () => {
    const json = exportAdminConfig();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Configuração exportada', 'success');
  };

  const handleImport = () => {
    try {
      importAdminConfig(importJson);
      setImportJson('');
      loadConfig();
      showToast('Configuração importada', 'success');
    } catch (e: any) {
      setShowImportError(e.message);
    }
  };

  const handleReset = () => {
    if (window.confirm('Isso vai resetar TODAS as configurações para o padrão. Tem certeza?')) {
      resetAdminConfig();
      loadConfig();
      showToast('Configuração resetada', 'success');
    }
  };

  const menuItems = config?.menuItems || [];
  const rolesList = getRoles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white p-6 border-b border-purple-900/40">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-400" />
                  Painel de Administração - Menus & Permissões
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700">
                  v{config?.version || 1}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Gerenciamento de Menus, Roles & Permissões
              </h2>
              <p className="text-xs text-purple-200/80 max-w-2xl">
                Configure quais menus e submenus cada role pode ver. Arraste para reordenar (em desenvolvimento).
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-4 right-4 z-60 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-slideIn ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6">
          {[
            { id: 'menus', label: 'Menus & Visibilidade', icon: Menu },
            { id: 'roles', label: 'Roles & Permissões', icon: Shield },
            { id: 'users', label: 'Usuários & Roles', icon: Users },
            { id: 'import', label: 'Importar/Exportar', icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-600 bg-indigo-50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Menus Tab */}
          {activeTab === 'menus' && config && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Estrutura de Menus</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newId = `custom_${Date.now()}` as any;
                      addMenuItem(null, {
                        id: `custom_${Date.now()}` as any,
                        label: 'Novo Menu Principal',
                        icon: 'Square',
                        order: 999,
                        visible: true,
                      });
                      loadConfig();
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Novo Menu Principal
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <MenuTree
                  items={config.menuItems}
                  onToggle={handleToggle}
                  onEdit={setEditingItem}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  permissions={getEffectivePermissions()}
                  expanded={expanded}
                  toggleExpand={(id) => setExpanded(prev => {
                    const next = new Set(prev);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    return next;
                  })}
                />
              </div>
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Roles & Permissões</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    placeholder="Nome da nova role"
                    className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={handleCreateRole}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Criar Role
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
<tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left p-3 font-semibold text-slate-700 w-48">Role</th>
                        {DEFAULT_MENU_ITEMS.flatMap((item): React.ReactNode[] => [
                          <th key={item.id} className="text-center p-2 font-medium text-slate-600 uppercase text-[10px] cursor-pointer" title={item.label}>
                            {item.label}
                          </th>,
                          ...(item.children || []).map(child => 
                            <th key={child.id} className="text-center p-2 font-medium text-slate-600 uppercase text-[9px] cursor-pointer" title={child.label}>
                              {child.label}
                            </th>
                          )
                        ]).flat()}
                      </tr>
                  </thead>
                  <tbody>
                    {getRoles().map(role => (
                      <tr key={role.roleId} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="p-3 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{role.roleName}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">{role.roleId}</span>
                            {role.roleId !== 'super_admin' && role.roleId !== 'admin' && (
                              <button
                                onClick={() => handleDeleteRole(role.roleId)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Excluir role customizada"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        {DEFAULT_MENU_ITEMS.flatMap((item): React.ReactNode[] => [
                          <td key={item.id} className="text-center p-2">
                            <input
                              type="checkbox"
                              checked={getRoles().find(r => r.roleId === 'super_admin')?.permissions[item.id] || false}
                              onChange={e => handleRolePermissionChange('super_admin', item.id, e.target.checked)}
                              disabled
                              className="w-4 h-4 text-indigo-600 rounded"
                            />
                          </td>,
                          ...(item.children || []).map(child => 
                            <td key={child.id} className="text-center p-2">
                              <input
                                type="checkbox"
                                checked={getRoles().find(r => r.roleId === 'super_admin')?.permissions[child.id] || false}
                                onChange={e => handleRolePermissionChange('super_admin', child.id, e.target.checked)}
                                disabled
                                className="w-4 h-4 text-indigo-600 rounded"
                              />
                            </td>
                          )
                        ]).flat()}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Permission Matrix for other roles */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-semibold text-slate-900 mb-4">Matriz de Permissões por Role</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left p-2 font-medium text-slate-700 w-48">Menu / Submenu</th>
                        {roles.filter(r => r.roleId !== 'super_admin').map(role => 
                          <th key={role.roleId} className="text-center p-2 font-medium text-slate-600 uppercase text-[10px]">
                            {role.roleName}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {DEFAULT_MENU_ITEMS.map(item => (
                        <React.Fragment key={item.id}>
                          <tr className="bg-slate-100/50 border-b border-slate-200">
                            <td className="p-2 font-semibold text-slate-900">{item.label}</td>
                            {roles.filter(r => r.roleId !== 'super_admin').map(role => (
                              <td key={role.roleId + item.id} className="text-center p-2">
                                <input
                                  type="checkbox"
                                  checked={role.permissions[item.id] || false}
                                  onChange={e => handleRolePermissionChange(role.roleId, item.id, e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 rounded"
                                />
                              </td>
                            ))}
                          </tr>
                          {item.children?.map(child => (
                            <tr key={child.id} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="p-2 pl-8 text-slate-700">{child.label}</td>
                              {roles.filter(r => r.roleId !== 'super_admin').map(role => (
                                <td key={role.roleId + child.id} className="text-center p-2">
                                  <input
                                    type="checkbox"
                                    checked={role.permissions[child.id] || false}
                                    onChange={e => handleRolePermissionChange(role.roleId, child.id, e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Gerenciamento de Usuários</h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-600 mb-4">
                  Atribua roles aos usuários. O sistema usa localStorage para armazenar as roles por userId.
                </p>
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h4 className="font-semibold mb-3">Usuários Cadastrados</h4>
                  <div className="space-y-2">
                    {(() => {
                      try {
                        const raw = localStorage.getItem('user_roles_v1') || '{}';
                        const roles = JSON.parse(raw);
                        return Object.entries(roles).map(([userId, roleId]) => (
                          <div key={userId} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                            <span className="font-mono text-sm">{userId}</span>
                          <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                            {String(getRoles().find(r => r.roleId === roles[userId])?.roleName || roleId)}
                          </span>
                          </div>
                        ));
                      } catch (e) {
                        return <span className="text-slate-500 text-sm">Nenhum usuário cadastrado</span>;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Import/Export Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-600" />
                    Exportar Configuração
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Baixe um arquivo JSON com toda a configuração de menus, roles e permissões.
                  </p>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar JSON
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    Importar Configuração
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Cole um JSON de configuração exportado anteriormente.
                  </p>
                  <textarea
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                    placeholder="Cole o JSON aqui..."
                    className="w-full h-48 font-mono text-xs bg-slate-950 text-slate-100 rounded-lg p-3 resize-none focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  {showImportError && (
                    <p className="text-red-600 text-sm mt-2">{showImportError}</p>
                  )}
                  <button
                    onClick={handleImport}
                    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Importar JSON
                  </button>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Zona de Perigo
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Estas ações são irreversíveis. Use com extrema cautela.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Resetar para Padrão
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Última atualização: {config?.updatedAt ? new Date(config.updatedAt).toLocaleString('pt-BR') : 'N/A'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminPanelModal;