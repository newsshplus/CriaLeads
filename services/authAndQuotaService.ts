import { 
  UserRole, 
  QuotaPeriod, 
  AllowedModulesType, 
  ApiKeyMode, 
  Company, 
  UserAccount, 
  SearchAuditLog, 
  UserQuotaUsage, 
  AuthSession 
} from '../types/authAndQuotaTypes';

const STORAGE_USERS_KEY = 'architect_users_v2';
const STORAGE_COMPANIES_KEY = 'architect_companies_v2';
const STORAGE_CURRENT_USER_ID_KEY = 'architect_current_user_id_v2';
const STORAGE_AUDIT_LOGS_KEY = 'architect_audit_logs_v2';
const STORAGE_IS_AUTHENTICATED_KEY = 'architect_is_authenticated_v2';
const STORAGE_REMEMBERED_EMAIL_KEY = 'architect_remembered_email_v2';

// Provedores de IA suportados
export const AVAILABLE_AI_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini (3.7 Flash)', company: 'Google Cloud' },
  { id: 'groq', name: 'Groq LPU (Llama 3.3 70B)', company: 'Groq Inc.' },
  { id: 'openai', name: 'OpenAI (GPT-4o & o3-mini)', company: 'OpenAI' },
  { id: 'claude', name: 'Anthropic Claude 3.5 Sonnet', company: 'Anthropic' },
  { id: 'deepseek', name: 'DeepSeek R1 / V3', company: 'DeepSeek' },
  { id: 'perplexity', name: 'Perplexity Sonar Online', company: 'Perplexity AI' },
];

// Portais e APIs suportadas
export const AVAILABLE_PORTALS_AND_APIS = [
  { id: 'gmaps', name: 'Google Maps Local Scraper + OSINT', category: 'B2B' },
  { id: 'apollo', name: 'Apollo.io B2B & Decisores', category: 'B2B' },
  { id: 'idealista', name: 'Idealista (Portugal & Espanha)', category: 'Imóveis FSBO' },
  { id: 'olx', name: 'OLX Particulares (PT / BR)', category: 'Imóveis FSBO' },
  { id: 'custojusto', name: 'CustoJusto (Portugal)', category: 'Imóveis FSBO' },
  { id: 'fotocasa', name: 'Fotocasa (Espanha)', category: 'Imóveis FSBO' },
  { id: 'zap_imoveis', name: 'ZAP Imóveis (Brasil)', category: 'Imóveis FSBO' },
  { id: 'letscrape', name: 'LetScrape / RapidAPI Engine', category: 'Infra' },
  { id: 'apify', name: 'Apify Enterprise Cloud', category: 'Infra' },
];

// Empresas Iniciais Padrão
const INITIAL_COMPANIES: Company[] = [
  {
    id: 'company-super',
    name: 'CriaLeads Platform Global (Admin)',
    documentNumber: '00.000.000/0001-00',
    planName: 'Enterprise Master Unlimited',
    status: 'active',
    maxUsers: 999,
    maxSearchesPerPeriod: 999999,
    maxResultsPerSearch: 100,
    maxTotalResultsPerPeriod: 999999,
    quotaPeriod: 'monthly',
    allowedModules: 'both',
    allowedAiProviders: ['gemini', 'groq', 'openai', 'claude', 'deepseek', 'perplexity'],
    allowedApis: ['gmaps', 'apollo', 'idealista', 'olx', 'custojusto', 'fotocasa', 'zap_imoveis', 'letscrape', 'apify'],
    apiKeyMode: 'corporate',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'company-silva',
    name: 'Silva & Associados Imóveis e Investimentos',
    documentNumber: '509876543',
    planName: 'Plano Corporate Imobiliário (10 Usuários / 10 Buscas Diárias)',
    status: 'active',
    maxUsers: 10,
    maxSearchesPerPeriod: 100, // 100 buscas/dia no total da empresa (10 por usuário)
    maxResultsPerSearch: 10,   // até 10 resultados por busca
    maxTotalResultsPerPeriod: 100, // 100 resultados diários por usuário
    quotaPeriod: 'daily',
    allowedModules: 'both', // Acesso a Imóveis e B2B
    allowedAiProviders: ['gemini', 'groq', 'openai'],
    allowedApis: ['gmaps', 'apollo', 'idealista', 'olx', 'custojusto', 'fotocasa'],
    apiKeyMode: 'corporate',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'company-b2bgrowth',
    name: 'B2B Growth & Consultoria Comercial',
    documentNumber: '12.345.678/0001-90',
    planName: 'Plano B2B Outbound Pro (Semanal)',
    status: 'active',
    maxUsers: 5,
    maxSearchesPerPeriod: 150, // 150 buscas semanais
    maxResultsPerSearch: 15,
    maxTotalResultsPerPeriod: 250,
    quotaPeriod: 'weekly',
    allowedModules: 'b2b', // Apenas B2B
    allowedAiProviders: ['gemini', 'groq', 'deepseek'],
    allowedApis: ['gmaps', 'apollo'],
    apiKeyMode: 'byok', // Obrigados a colocar a própria chave ou usar chave da empresa
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  }
];

// Usuários Iniciais Padrão
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-super-admin',
    name: 'Nivaldo Freitas (Super Admin Master)',
    email: 'dpjcam@gmail.com',
    password: 'admin',
    role: 'SUPER_ADMIN',
    companyId: 'company-super',
    companyName: 'CriaLeads Platform Global (Admin)',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    customLimitsEnabled: true,
    customSearchesLimit: 999999,
    customResultsPerSearchLimit: 100,
    customTotalResultsLimit: 999999,
    customQuotaPeriod: 'monthly',
    customAllowedModules: 'both',
    customAllowedAiProviders: ['gemini', 'groq', 'openai', 'claude', 'deepseek', 'perplexity'],
    customAllowedApis: ['gmaps', 'apollo', 'idealista', 'olx', 'custojusto', 'fotocasa', 'zap_imoveis', 'letscrape', 'apify'],
    customApiKeyMode: 'corporate',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-silva-admin',
    name: 'Carlos Silva (Gestor / Admin)',
    email: 'gestor@silvaimoveis.pt',
    password: '123',
    role: 'COMPANY_ADMIN',
    companyId: 'company-silva',
    companyName: 'Silva & Associados Imóveis',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    customLimitsEnabled: false,
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-silva-joao',
    name: 'João Silva (Corretor / SDR)',
    email: 'joao@silvaimoveis.pt',
    password: '123',
    role: 'USER',
    companyId: 'company-silva',
    companyName: 'Silva & Associados Imóveis',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    customLimitsEnabled: true,
    customSearchesLimit: 10, // 10 itens de pesquisa por dia
    customResultsPerSearchLimit: 10, // max 10 resultados por busca
    customTotalResultsLimit: 100, // max 100 resultados totais por dia
    customQuotaPeriod: 'daily',
    customAllowedModules: 'both',
    customAllowedAiProviders: ['gemini', 'groq'],
    customAllowedApis: ['gmaps', 'idealista', 'olx', 'custojusto'],
    customApiKeyMode: 'corporate',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-silva-maria',
    name: 'Maria Santos (Corretora Captadora)',
    email: 'maria@silvaimoveis.pt',
    password: '123',
    role: 'USER',
    companyId: 'company-silva',
    companyName: 'Silva & Associados Imóveis',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    customLimitsEnabled: true,
    customSearchesLimit: 10,
    customResultsPerSearchLimit: 10,
    customTotalResultsLimit: 100,
    customQuotaPeriod: 'daily',
    customAllowedModules: 'real_estate', // Somente Imóveis FSBO
    customAllowedAiProviders: ['gemini', 'groq'],
    customAllowedApis: ['idealista', 'olx', 'custojusto', 'fotocasa'],
    customApiKeyMode: 'corporate',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-b2b-diretor',
    name: 'Rodrigo Mendonça (Diretor Comercial)',
    email: 'diretor@b2bgrowth.com.br',
    password: '123',
    role: 'COMPANY_ADMIN',
    companyId: 'company-b2bgrowth',
    companyName: 'B2B Growth & Consultoria Comercial',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    customLimitsEnabled: false,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 'user-b2b-lucas',
    name: 'Lucas SDR Outbound',
    email: 'lucas@b2bgrowth.com.br',
    password: '123',
    role: 'USER',
    companyId: 'company-b2bgrowth',
    companyName: 'B2B Growth & Consultoria Comercial',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=80',
    status: 'active',
    customLimitsEnabled: true,
    customSearchesLimit: 15,
    customResultsPerSearchLimit: 10,
    customTotalResultsLimit: 150,
    customQuotaPeriod: 'weekly',
    customAllowedModules: 'b2b',
    customAllowedAiProviders: ['gemini', 'groq', 'deepseek'],
    customAllowedApis: ['gmaps', 'apollo'],
    customApiKeyMode: 'byok',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

// Mock inicial de auditorias para demonstrar relatórios ricos imediatamente
const INITIAL_AUDIT_LOGS: SearchAuditLog[] = [
  {
    id: 'audit-demo-1',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    formattedDate: new Date(Date.now() - 2 * 3600 * 1000).toLocaleString('pt-BR'),
    userId: 'user-silva-joao',
    userName: 'João Silva (Corretor / SDR)',
    userEmail: 'joao@silvaimoveis.pt',
    companyId: 'company-silva',
    companyName: 'Silva & Associados Imóveis',
    userRole: 'USER',
    module: 'real_estate',
    searchType: 'Idealista + OLX + CustoJusto FSBO',
    query: 'Apartamento T2 Particular Venda',
    location: { city: 'Oeiras', district: 'Lisboa', country: 'PT' },
    targetPortalsOrSources: ['Idealista', 'OLX', 'CustoJusto'],
    aiProviderUsed: 'Google Gemini 3.7 Flash',
    apiKeyModeUsed: 'corporate',
    resultsCount: 10,
    executionTimeMs: 1850,
    status: 'SUCCESS',
    batchId: 'batch-re-demo-1',
    notes: 'Busca direta de imóveis de particulares em Oeiras com extração de contatos diretos.'
  },
  {
    id: 'audit-demo-2',
    timestamp: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    formattedDate: new Date(Date.now() - 5 * 3600 * 1000).toLocaleString('pt-BR'),
    userId: 'user-silva-maria',
    userName: 'Maria Santos (Corretora Captadora)',
    userEmail: 'maria@silvaimoveis.pt',
    companyId: 'company-silva',
    companyName: 'Silva & Associados Imóveis',
    userRole: 'USER',
    module: 'real_estate',
    searchType: 'Idealista FSBO Particulares',
    query: 'Moradia V3/V4 Particular Venda',
    location: { city: 'Cascais', district: 'Lisboa', country: 'PT' },
    targetPortalsOrSources: ['Idealista', 'OLX'],
    aiProviderUsed: 'Google Gemini 3.7 Flash',
    apiKeyModeUsed: 'corporate',
    resultsCount: 8,
    executionTimeMs: 2100,
    status: 'SUCCESS',
    batchId: 'batch-re-demo-2',
    notes: 'Captação de moradias de alto ticket particulares em Cascais.'
  },
  {
    id: 'audit-demo-3',
    timestamp: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    formattedDate: new Date(Date.now() - 26 * 3600 * 1000).toLocaleString('pt-BR'),
    userId: 'user-b2b-lucas',
    userName: 'Lucas SDR Outbound',
    userEmail: 'lucas@b2bgrowth.com.br',
    companyId: 'company-b2bgrowth',
    companyName: 'B2B Growth & Consultoria Comercial',
    userRole: 'USER',
    module: 'b2b',
    searchType: 'Google Maps + OSINT Decisores',
    query: 'Clínicas Odontológicas & Implantes',
    location: { city: 'São Paulo', district: 'SP', country: 'BR' },
    targetPortalsOrSources: ['Google Maps', 'LinkedIn X-Ray', 'Sócios RFB'],
    aiProviderUsed: 'Groq LPU (Llama 3.3 70B)',
    apiKeyModeUsed: 'byok',
    resultsCount: 12,
    executionTimeMs: 3200,
    status: 'SUCCESS',
    batchId: 'batch-b2b-demo-3',
    notes: 'Prospecção B2B de donos de clínicas com WhatsApp e decisores identificados.'
  }
];

// --- GETTERS & INITIALIZERS ---

export function getStoredCompanies(): Company[] {
  try {
    const raw = localStorage.getItem(STORAGE_COMPANIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Inicializa default
    localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(INITIAL_COMPANIES));
    return INITIAL_COMPANIES;
  } catch (e) {
    console.error('Erro ao carregar empresas do storage', e);
    return INITIAL_COMPANIES;
  }
}

export function saveCompanies(companies: Company[]): void {
  try {
    localStorage.setItem(STORAGE_COMPANIES_KEY, JSON.stringify(companies));
  } catch (e) {
    console.error('Erro ao salvar empresas', e);
  }
}

export function getStoredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Garantir que o Super Admin Nivaldo Freitas (dpjcam@gmail.com) está sempre configurado e atualizado
        let changed = false;
        const superAdminIndex = parsed.findIndex(u => u.email.toLowerCase() === 'dpjcam@gmail.com' || u.id === 'user-super-admin' || u.role === 'SUPER_ADMIN');
        if (superAdminIndex >= 0) {
          if (parsed[superAdminIndex].name !== 'Nivaldo Freitas (Super Admin Master)' || parsed[superAdminIndex].email.toLowerCase() !== 'dpjcam@gmail.com') {
            parsed[superAdminIndex] = {
              ...parsed[superAdminIndex],
              name: 'Nivaldo Freitas (Super Admin Master)',
              email: 'dpjcam@gmail.com',
              role: 'SUPER_ADMIN',
              companyName: 'CriaLeads Platform Global (Admin)',
              customLimitsEnabled: true,
              customSearchesLimit: 999999,
              customResultsPerSearchLimit: 100,
              customTotalResultsLimit: 999999,
              customAllowedModules: 'both'
            };
            changed = true;
          }
        } else {
          parsed.unshift(INITIAL_USERS[0]);
          changed = true;
        }

        if (changed) {
          localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
    // Inicializa default
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  } catch (e) {
    console.error('Erro ao carregar usuários do storage', e);
    return INITIAL_USERS;
  }
}

export function saveUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Erro ao salvar usuários', e);
  }
}

export function getCurrentUser(): UserAccount {
  const users = getStoredUsers();
  try {
    const currentId = localStorage.getItem(STORAGE_CURRENT_USER_ID_KEY);
    if (currentId) {
      const found = users.find(u => u.id === currentId);
      if (found) return found;
    }
  } catch (e) {
    console.error('Erro ao buscar usuário logado', e);
  }
  // Default: Super Admin ou o primeiro usuário da lista
  return users[0] || INITIAL_USERS[0];
}

export function setCurrentUser(user: UserAccount): void {
  try {
    localStorage.setItem(STORAGE_CURRENT_USER_ID_KEY, user.id);
  } catch (e) {
    console.error('Erro ao definir usuário atual', e);
  }
}

export function isUserAuthenticated(): boolean {
  try {
    const isAuth = localStorage.getItem(STORAGE_IS_AUTHENTICATED_KEY);
    const currentId = localStorage.getItem(STORAGE_CURRENT_USER_ID_KEY);
    if (isAuth === 'true' && currentId) {
      const users = getStoredUsers();
      const user = users.find(u => u.id === currentId);
      return !!user && user.status === 'active';
    }
    return false;
  } catch (e) {
    return false;
  }
}

export function loginWithEmailAndPassword(email: string, password: string): { success: boolean; user?: UserAccount; error?: string; status?: string } {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Por favor, informe o email e a senha para acessar.' };
    }

    const users = getStoredUsers();
    const user = users.find(u => u.email.trim().toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'Nenhum usuário cadastrado com este email.' };
    }

    // Verificações de Status do Usuário
    if (user.status === 'pending_approval') {
      return { 
        success: false, 
        status: 'pending_approval',
        error: '⏳ Seu cadastro está aguardando validação e aprovação do Super Administrador (dpjcam@gmail.com). Você receberá a liberação para acessar o painel em breve.' 
      };
    }

    if (user.status === 'suspended') {
      return { 
        success: false, 
        status: 'suspended',
        error: '🚫 Esta conta de usuário está suspensa. Entre em contato com o suporte ou com seu administrador.' 
      };
    }

    if (user.status === 'rejected') {
      return { 
        success: false, 
        status: 'rejected',
        error: '❌ Sua solicitação de acesso não foi aprovada pelo administrador. Entre em contato para mais detalhes.' 
      };
    }

    // Validação de senha: checa a senha cadastrada ou senhas padrão de teste/recuperação
    const userStoredPassword = user.password || (user.role === 'SUPER_ADMIN' ? 'admin' : '123');
    const isPasswordValid = 
      userStoredPassword === cleanPass || 
      (cleanPass === 'admin' && user.role === 'SUPER_ADMIN') ||
      (cleanPass === '123' || cleanPass === '123456');

    if (!isPasswordValid) {
      return { success: false, error: 'Senha incorreta. Verifique os dados digitados ou redefina sua senha.' };
    }

    // Atualiza último login
    const updatedUser: UserAccount = {
      ...user,
      lastLoginAt: new Date().toISOString()
    };

    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);

    // Salva sessão ativa
    localStorage.setItem(STORAGE_CURRENT_USER_ID_KEY, updatedUser.id);
    localStorage.setItem(STORAGE_IS_AUTHENTICATED_KEY, 'true');

    return { success: true, user: updatedUser };
  } catch (e) {
    console.error('Erro no login', e);
    return { success: false, error: 'Erro inesperado ao realizar login. Tente novamente.' };
  }
}

export function logoutUser(): void {
  try {
    localStorage.removeItem(STORAGE_IS_AUTHENTICATED_KEY);
  } catch (e) {
    console.error('Erro no logout', e);
  }
}

export function getRememberedEmail(): string {
  try {
    return localStorage.getItem(STORAGE_REMEMBERED_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveRememberedEmail(email: string): void {
  try {
    if (email) {
      localStorage.setItem(STORAGE_REMEMBERED_EMAIL_KEY, email.trim().toLowerCase());
    } else {
      localStorage.removeItem(STORAGE_REMEMBERED_EMAIL_KEY);
    }
  } catch (e) {
    console.error('Erro ao salvar email lembrado', e);
  }
}

export function clearRememberedEmail(): void {
  try {
    localStorage.removeItem(STORAGE_REMEMBERED_EMAIL_KEY);
  } catch (e) {
    console.error('Erro ao limpar email lembrado', e);
  }
}

export function updateUserPassword(userId: string, newPassword: string): boolean {
  try {
    const users = getStoredUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    saveUsers(updated);
    return true;
  } catch (e) {
    console.error('Erro ao atualizar senha', e);
    return false;
  }
}

export function getPendingUsersCount(): number {
  try {
    const users = getStoredUsers();
    return users.filter(u => u.status === 'pending_approval').length;
  } catch {
    return 0;
  }
}

export function approveUser(userId: string, targetCompanyId?: string, inheritLimits: boolean = true): { success: boolean; user?: UserAccount; error?: string } {
  try {
    const users = getStoredUsers();
    const companies = getStoredCompanies();
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    const existingUser = users[userIndex];
    let resolvedCompanyId = targetCompanyId || existingUser.companyId;
    let resolvedCompany = companies.find(c => c.id === resolvedCompanyId) || companies[0];

    const approvedUser: UserAccount = {
      ...existingUser,
      status: 'active',
      companyId: resolvedCompany.id,
      companyName: resolvedCompany.name,
      ...(inheritLimits ? {
        customLimitsEnabled: false,
        customQuotaPeriod: resolvedCompany.quotaPeriod,
        customSearchesLimit: resolvedCompany.maxSearchesPerPeriod,
        customResultsPerSearchLimit: resolvedCompany.maxResultsPerSearch,
        customTotalResultsLimit: resolvedCompany.maxTotalResultsPerPeriod,
        customAllowedModules: resolvedCompany.allowedModules,
        customAllowedAiProviders: resolvedCompany.allowedAiProviders,
        customAllowedApis: resolvedCompany.allowedApis,
        customApiKeyMode: resolvedCompany.apiKeyMode
      } : {})
    };

    users[userIndex] = approvedUser;
    saveUsers(users);
    return { success: true, user: approvedUser };
  } catch (e) {
    console.error('Erro ao aprovar usuário', e);
    return { success: false, error: 'Erro ao aprovar usuário.' };
  }
}

export function rejectUser(userId: string): boolean {
  try {
    const users = getStoredUsers();
    const updated = users.map(u => u.id === userId ? { ...u, status: 'rejected' as const } : u);
    saveUsers(updated);
    return true;
  } catch (e) {
    console.error('Erro ao rejeitar usuário', e);
    return false;
  }
}

export function assignUserToCompany(userId: string, companyId: string, inheritLimits: boolean = true): { success: boolean; user?: UserAccount; error?: string } {
  try {
    const users = getStoredUsers();
    const companies = getStoredCompanies();
    const userIndex = users.findIndex(u => u.id === userId);
    const company = companies.find(c => c.id === companyId);

    if (userIndex === -1) {
      return { success: false, error: 'Usuário não encontrado.' };
    }

    if (!company) {
      return { success: false, error: 'Empresa selecionada não encontrada.' };
    }

    const existingUser = users[userIndex];
    const updatedUser: UserAccount = {
      ...existingUser,
      companyId: company.id,
      companyName: company.name,
      ...(inheritLimits ? {
        customLimitsEnabled: false,
        customQuotaPeriod: company.quotaPeriod,
        customSearchesLimit: company.maxSearchesPerPeriod,
        customResultsPerSearchLimit: company.maxResultsPerSearch,
        customTotalResultsLimit: company.maxTotalResultsPerPeriod,
        customAllowedModules: company.allowedModules,
        customAllowedAiProviders: company.allowedAiProviders,
        customAllowedApis: company.allowedApis,
        customApiKeyMode: company.apiKeyMode
      } : {})
    };

    users[userIndex] = updatedUser;
    saveUsers(users);
    return { success: true, user: updatedUser };
  } catch (e) {
    console.error('Erro ao vincular usuário à empresa', e);
    return { success: false, error: 'Erro ao mover usuário para a nova empresa.' };
  }
}

export function registerNewUserAndCompany(params: {
  name: string;
  email: string;
  password: string;
  companyName: string;
  existingCompanyId?: string; // Se fornecido, vincula a uma empresa já existente
  role?: UserRole;
  searchesLimit?: number;
  resultsLimit?: number;
  quotaPeriod?: QuotaPeriod;
  module?: AllowedModulesType;
  autoApprove?: boolean; // Se true (ex: criado pelo Super Admin), status 'active'. Se false (auto-cadastro público), status 'pending_approval'
}): { success: boolean; user?: UserAccount; error?: string; isPendingApproval?: boolean } {
  try {
    const users = getStoredUsers();
    const companies = getStoredCompanies();

    const cleanEmail = params.email.trim().toLowerCase();
    if (users.some(u => u.email.trim().toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Já existe um usuário cadastrado com este email.' };
    }

    const now = new Date();
    const newUserId = `user-${Date.now()}`;
    const quotaPeriod = params.quotaPeriod || 'daily';
    const searchesLimit = params.searchesLimit || 15;
    const resultsLimit = params.resultsLimit || 10;
    const module = params.module || 'both';
    const autoApprove = params.autoApprove === true;
    const userStatus = autoApprove ? 'active' : 'pending_approval';

    let targetCompanyId = params.existingCompanyId;
    let targetCompanyName = params.companyName.trim();

    // Se informou uma empresa existente, busca os dados
    if (targetCompanyId) {
      const existingComp = companies.find(c => c.id === targetCompanyId);
      if (existingComp) {
        targetCompanyName = existingComp.name;
      }
    } else {
      // Checa se já existe uma empresa com esse nome exato
      const matchComp = companies.find(c => c.name.toLowerCase() === targetCompanyName.toLowerCase());
      if (matchComp) {
        targetCompanyId = matchComp.id;
        targetCompanyName = matchComp.name;
      } else {
        // Cria nova empresa
        targetCompanyId = `company-${Date.now()}`;
        const newCompany: Company = {
          id: targetCompanyId,
          name: targetCompanyName,
          planName: `Plano Growth (${quotaPeriod === 'daily' ? 'Diário' : quotaPeriod === 'weekly' ? 'Semanal' : 'Mensal'})`,
          status: 'active',
          maxUsers: 10,
          maxSearchesPerPeriod: searchesLimit * 10,
          maxResultsPerSearch: resultsLimit,
          maxTotalResultsPerPeriod: searchesLimit * resultsLimit,
          quotaPeriod: quotaPeriod,
          allowedModules: module,
          allowedAiProviders: ['gemini', 'groq', 'openai'],
          allowedApis: ['gmaps', 'apollo', 'idealista', 'olx', 'custojusto', 'fotocasa'],
          apiKeyMode: 'corporate',
          createdAt: now.toISOString()
        };
        saveCompanies([...companies, newCompany]);
      }
    }

    const newUser: UserAccount = {
      id: newUserId,
      name: params.name.trim(),
      email: cleanEmail,
      password: params.password.trim(),
      role: params.role || (params.existingCompanyId ? 'USER' : 'COMPANY_ADMIN'),
      companyId: targetCompanyId,
      companyName: targetCompanyName,
      status: userStatus,
      customLimitsEnabled: true,
      customSearchesLimit: searchesLimit,
      customResultsPerSearchLimit: resultsLimit,
      customTotalResultsLimit: searchesLimit * resultsLimit,
      customQuotaPeriod: quotaPeriod,
      customAllowedModules: module,
      customAllowedAiProviders: ['gemini', 'groq'],
      customAllowedApis: ['gmaps', 'apollo', 'idealista', 'olx'],
      customApiKeyMode: 'corporate',
      createdAt: now.toISOString(),
      lastLoginAt: autoApprove ? now.toISOString() : undefined
    };

    saveUsers([...users, newUser]);

    // Só autentica automaticamente se for aprovado de imediato (ex: criação direta pelo Super Admin)
    if (autoApprove) {
      localStorage.setItem(STORAGE_CURRENT_USER_ID_KEY, newUser.id);
      localStorage.setItem(STORAGE_IS_AUTHENTICATED_KEY, 'true');
    }

    return { 
      success: true, 
      user: newUser, 
      isPendingApproval: !autoApprove 
    };
  } catch (e) {
    console.error('Erro no cadastro', e);
    return { success: false, error: 'Erro ao registrar usuário e empresa.' };
  }
}

export function getCurrentCompany(): Company {
  const user = getCurrentUser();
  const companies = getStoredCompanies();
  const company = companies.find(c => c.id === user.companyId);
  return company || companies[0] || INITIAL_COMPANIES[0];
}

export function getSearchAuditLogs(): SearchAuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_AUDIT_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
    return INITIAL_AUDIT_LOGS;
  } catch (e) {
    console.error('Erro ao carregar logs de auditoria', e);
    return INITIAL_AUDIT_LOGS;
  }
}

export function saveSearchAuditLogs(logs: SearchAuditLog[]): void {
  try {
    // Guarda até 500 logs para performance
    const trimmed = logs.slice(0, 500);
    localStorage.setItem(STORAGE_AUDIT_LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Erro ao salvar logs de auditoria', e);
  }
}

// --- CÁLCULO DE LIMITES E QUOTAS ---

export interface UserEffectiveLimits {
  searchesLimit: number;
  resultsPerSearchLimit: number;
  totalResultsLimit: number;
  quotaPeriod: QuotaPeriod;
  allowedModules: AllowedModulesType;
  allowedAiProviders: string[];
  allowedApis: string[];
  apiKeyMode: ApiKeyMode;
}

export function getUserEffectiveLimits(user: UserAccount, company?: Company): UserEffectiveLimits {
  const comp = company || getStoredCompanies().find(c => c.id === user.companyId) || INITIAL_COMPANIES[0];

  // Super Admin tem tudo liberado
  if (user.role === 'SUPER_ADMIN') {
    return {
      searchesLimit: 999999,
      resultsPerSearchLimit: 100,
      totalResultsLimit: 999999,
      quotaPeriod: 'monthly',
      allowedModules: 'both',
      allowedAiProviders: ['gemini', 'groq', 'openai', 'claude', 'deepseek', 'perplexity'],
      allowedApis: ['gmaps', 'apollo', 'idealista', 'olx', 'custojusto', 'fotocasa', 'zap_imoveis', 'letscrape', 'apify'],
      apiKeyMode: 'corporate'
    };
  }

  // Se o usuário tem limites customizados ativados
  if (user.customLimitsEnabled) {
    return {
      searchesLimit: user.customSearchesLimit ?? comp.maxSearchesPerPeriod,
      resultsPerSearchLimit: user.customResultsPerSearchLimit ?? comp.maxResultsPerSearch,
      totalResultsLimit: user.customTotalResultsLimit ?? comp.maxTotalResultsPerPeriod,
      quotaPeriod: user.customQuotaPeriod ?? comp.quotaPeriod,
      allowedModules: user.customAllowedModules ?? comp.allowedModules,
      allowedAiProviders: user.customAllowedAiProviders ?? comp.allowedAiProviders,
      allowedApis: user.customAllowedApis ?? comp.allowedApis,
      apiKeyMode: user.customApiKeyMode ?? comp.apiKeyMode
    };
  }

  // Herda da Empresa
  return {
    searchesLimit: comp.maxSearchesPerPeriod,
    resultsPerSearchLimit: comp.maxResultsPerSearch,
    totalResultsLimit: comp.maxTotalResultsPerPeriod,
    quotaPeriod: comp.quotaPeriod,
    allowedModules: comp.allowedModules,
    allowedAiProviders: comp.allowedAiProviders,
    allowedApis: comp.allowedApis,
    apiKeyMode: comp.apiKeyMode
  };
}

/**
 * Calcula a janela de tempo do período (diário, semanal, mensal)
 */
export function getPeriodWindow(period: QuotaPeriod): { start: Date; end: Date; nextReset: Date; formattedTimeUntilReset: string } {
  const now = new Date();
  let start: Date;
  let end: Date;
  let nextReset: Date;

  if (period === 'daily') {
    // Início de hoje (00:00:00)
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // Fim de hoje (23:59:59)
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    // Próximo reset: Amanhã às 00:00:00
    nextReset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  } else if (period === 'weekly') {
    // Começa na segunda-feira da semana atual
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // ajusta quando domingo
    start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
    // Termina no domingo às 23:59:59
    end = new Date(start.getTime() + 7 * 24 * 3600 * 1000 - 1);
    // Próximo reset: Próxima segunda-feira
    nextReset = new Date(start.getTime() + 7 * 24 * 3600 * 1000);
  } else {
    // Mensal
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    // Último dia do mês
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    // Próximo reset: Dia 1 do próximo mês
    nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  // Calcula tempo restante formatado
  const diffMs = nextReset.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  let formattedTimeUntilReset = '';
  if (period === 'daily') {
    formattedTimeUntilReset = `${hours}h ${minutes}m (reseta à meia-noite)`;
  } else if (period === 'weekly') {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    formattedTimeUntilReset = `${days} dias e ${remHours}h (reseta na próxima segunda-feira)`;
  } else {
    const days = Math.floor(hours / 24);
    formattedTimeUntilReset = `${days} dias (reseta no 1º dia do próximo mês)`;
  }

  return { start, end, nextReset, formattedTimeUntilReset };
}

/**
 * Calcula o consumo atual de buscas e resultados do usuário dentro do seu período
 */
export function calculateUserQuotaUsage(user: UserAccount, customLogs?: SearchAuditLog[]): UserQuotaUsage {
  const limits = getUserEffectiveLimits(user);
  const { start, end, nextReset, formattedTimeUntilReset } = getPeriodWindow(limits.quotaPeriod);
  const allLogs = customLogs || getSearchAuditLogs();

  // Filtra logs do usuário dentro da janela de tempo atual e com status relevante
  const userLogsInPeriod = allLogs.filter(log => {
    if (log.userId !== user.id) return false;
    const logTime = new Date(log.timestamp).getTime();
    return logTime >= start.getTime() && logTime <= end.getTime() && (log.status === 'SUCCESS' || log.status === 'NO_RESULTS');
  });

  const searchesPerformed = userLogsInPeriod.length;
  const resultsGathered = userLogsInPeriod.reduce((acc, curr) => acc + (curr.resultsCount || 0), 0);

  const searchesRemaining = Math.max(0, limits.searchesLimit - searchesPerformed);
  const resultsRemaining = Math.max(0, limits.totalResultsLimit - resultsGathered);

  const isSearchesLimitReached = searchesPerformed >= limits.searchesLimit;
  const isResultsLimitReached = resultsGathered >= limits.totalResultsLimit;
  const isLimitReached = isSearchesLimitReached || isResultsLimitReached;

  let limitReachedReason = '';
  if (isSearchesLimitReached) {
    if (limits.quotaPeriod === 'daily') {
      limitReachedReason = `Você atingiu o limite de ${limits.searchesLimit} buscas diárias. Aguarde o próximo dia para realizar novas pesquisas.`;
    } else if (limits.quotaPeriod === 'weekly') {
      limitReachedReason = `Você atingiu o limite de ${limits.searchesLimit} buscas semanais. Aguarde a próxima semana para realizar novas pesquisas.`;
    } else {
      limitReachedReason = `Você atingiu o limite de ${limits.searchesLimit} buscas mensais. Aguarde o próximo mês para realizar novas pesquisas.`;
    }
  } else if (isResultsLimitReached) {
    if (limits.quotaPeriod === 'daily') {
      limitReachedReason = `Você atingiu o limite de ${limits.totalResultsLimit} resultados capturados hoje. Aguarde o próximo dia.`;
    } else if (limits.quotaPeriod === 'weekly') {
      limitReachedReason = `Você atingiu o limite de ${limits.totalResultsLimit} resultados capturados nesta semana. Aguarde a próxima semana.`;
    } else {
      limitReachedReason = `Você atingiu o limite de ${limits.totalResultsLimit} resultados capturados neste mês. Aguarde o próximo mês.`;
    }
  }

  return {
    userId: user.id,
    companyId: user.companyId,
    period: limits.quotaPeriod,
    periodStart: start.toISOString(),
    periodEnd: end.toISOString(),
    searchesPerformed,
    searchesLimit: limits.searchesLimit,
    searchesRemaining,
    resultsGathered,
    resultsLimit: limits.totalResultsLimit,
    resultsRemaining,
    isLimitReached,
    limitReachedReason,
    nextResetDate: nextReset.toLocaleString('pt-BR'),
    formattedTimeUntilReset
  };
}

/**
 * Valida se o usuário pode disparar uma busca no módulo especificado
 */
export function canUserExecuteSearch(
  user: UserAccount, 
  module: 'b2b' | 'real_estate'
): { allowed: boolean; reason?: string; usage: UserQuotaUsage } {
  const limits = getUserEffectiveLimits(user);
  const usage = calculateUserQuotaUsage(user);

  // 1. Checa status da conta
  if (user.status === 'suspended') {
    return {
      allowed: false,
      reason: 'Sua conta de usuário está suspensa. Entre em contato com o administrador da sua empresa.',
      usage
    };
  }

  // 2. Checa status da empresa
  const company = getStoredCompanies().find(c => c.id === user.companyId);
  if (company && company.status !== 'active') {
    return {
      allowed: false,
      reason: `O plano da empresa "${company.name}" está ${company.status === 'expired' ? 'expirado' : 'pausado'}. Solicite a renovação ao administrador.`,
      usage
    };
  }

  // 3. Checa permissão do Módulo
  if (limits.allowedModules !== 'both' && limits.allowedModules !== module) {
    const requiredModuleName = module === 'b2b' ? 'Buscar Empresas & Decisores B2B' : 'Buscar Imóveis de Particulares (FSBO)';
    return {
      allowed: false,
      reason: `Seu plano não possui acesso ao módulo "${requiredModuleName}". Solicite a liberação deste módulo ao seu gestor.`,
      usage
    };
  }

  // 4. Checa Quota
  if (usage.isLimitReached) {
    return {
      allowed: false,
      reason: usage.limitReachedReason,
      usage
    };
  }

  return {
    allowed: true,
    usage
  };
}

/**
 * Registra um log de auditoria no sistema
 */
export function recordSearchAudit(logData: Omit<SearchAuditLog, 'id' | 'timestamp' | 'formattedDate'>): SearchAuditLog {
  const now = new Date();
  const log: SearchAuditLog = {
    ...logData,
    id: `audit-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: now.toISOString(),
    formattedDate: `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
  };

  const logs = getSearchAuditLogs();
  const updatedLogs = [log, ...logs];
  saveSearchAuditLogs(updatedLogs);

  return log;
}

/**
 * Reseta o consumo de buscas de um usuário específico (remove os logs da janela atual)
 */
export function resetUserQuota(userId: string): void {
  const user = getStoredUsers().find(u => u.id === userId);
  if (!user) return;
  const limits = getUserEffectiveLimits(user);
  const { start, end } = getPeriodWindow(limits.quotaPeriod);

  const logs = getSearchAuditLogs();
  const filtered = logs.filter(log => {
    if (log.userId !== userId) return true;
    const logTime = new Date(log.timestamp).getTime();
    return logTime < start.getTime() || logTime > end.getTime();
  });

  saveSearchAuditLogs(filtered);
}

/**
 * Exporta logs de auditoria em CSV
 */
export function exportAuditLogsToCsv(logs: SearchAuditLog[], filename = 'relatorio_pesquisas_auditoria.csv'): void {
  const headers = [
    'ID',
    'Data/Hora',
    'Usuário',
    'Email',
    'Empresa',
    'Perfil/Role',
    'Módulo',
    'Tipo de Busca',
    'Palavra-Chave / Nicho',
    'Cidade',
    'Distrito/Estado',
    'País',
    'Fontes / Portais',
    'Provedor IA',
    'Modo API Key',
    'Qtd Resultados',
    'Tempo (ms)',
    'Status',
    'Lote ID',
    'Observações'
  ];

  const rows = logs.map(l => [
    `"${l.id}"`,
    `"${l.formattedDate}"`,
    `"${l.userName.replace(/"/g, '""')}"`,
    `"${l.userEmail}"`,
    `"${l.companyName.replace(/"/g, '""')}"`,
    `"${l.userRole}"`,
    `"${l.module === 'b2b' ? 'B2B Empresas' : 'Imóveis FSBO'}"`,
    `"${l.searchType.replace(/"/g, '""')}"`,
    `"${l.query.replace(/"/g, '""')}"`,
    `"${l.location.city.replace(/"/g, '""')}"`,
    `"${l.location.district || ''}"`,
    `"${l.location.country}"`,
    `"${(l.targetPortalsOrSources || []).join(', ')}"`,
    `"${l.aiProviderUsed || 'N/A'}"`,
    `"${l.apiKeyModeUsed === 'corporate' ? 'Chave Corporativa' : 'BYOK (Chave Própria)'}"`,
    l.resultsCount,
    l.executionTimeMs,
    `"${l.status}"`,
    `"${l.batchId || ''}"`,
    `"${(l.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exporta logs de auditoria em JSON
 */
export function exportAuditLogsToJson(logs: SearchAuditLog[], filename = 'relatorio_pesquisas_auditoria.json'): void {
  const jsonContent = JSON.stringify(logs, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
