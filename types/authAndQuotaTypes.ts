export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER';
export type QuotaPeriod = 'daily' | 'weekly' | 'monthly';
export type AllowedModulesType = 'b2b' | 'real_estate' | 'both';
export type ApiKeyMode = 'corporate' | 'byok'; // 'corporate' = chave compartilhada pela empresa/admin; 'byok' = chave própria do usuário

export interface Company {
  id: string;
  name: string;
  documentNumber?: string; // CNPJ, NIF, etc.
  planName: string;
  status: 'active' | 'paused' | 'expired';
  maxUsers: number; // ex: 10 usuários
  maxSearchesPerPeriod: number; // ex: 100 buscas por período para a empresa
  maxResultsPerSearch: number; // ex: 10 resultados máximos por busca
  maxTotalResultsPerPeriod: number; // ex: 100 resultados totais por dia/mês
  quotaPeriod: QuotaPeriod;
  allowedModules: AllowedModulesType;
  allowedAiProviders: string[]; // ex: ['gemini', 'groq', 'openai', 'claude', 'deepseek', 'perplexity']
  allowedApis: string[]; // ex: ['gmaps', 'apollo', 'idealista', 'olx', 'letscrape', 'fotocasa']
  apiKeyMode: ApiKeyMode;
  corporateApiKeys?: {
    gemini?: string;
    groq?: string[];
    rapidApi?: string[];
    apollo?: string;
    openai?: string;
    claude?: string;
  };
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string; // Senha ou PIN
  role: UserRole;
  companyId: string;
  companyName: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'pending_approval' | 'rejected';
  
  // Limites customizados individuais (se undefined, herda os limites da Company)
  customLimitsEnabled?: boolean;
  customSearchesLimit?: number; // ex: 10 buscas/dia
  customResultsPerSearchLimit?: number; // ex: 10 resultados por busca
  customTotalResultsLimit?: number; // ex: 100 resultados no total
  customQuotaPeriod?: QuotaPeriod;
  customAllowedModules?: AllowedModulesType;
  customAllowedAiProviders?: string[];
  customAllowedApis?: string[];
  customApiKeyMode?: ApiKeyMode;
  userApiKeys?: {
    gemini?: string;
    groq?: string[];
    rapidApi?: string[];
    apollo?: string;
    openai?: string;
    claude?: string;
  };

  lastLoginAt?: string;
  createdAt: string;
}

export interface SearchAuditLog {
  id: string;
  timestamp: string; // ISO
  formattedDate: string;
  userId: string;
  userName: string;
  userEmail: string;
  companyId: string;
  companyName: string;
  userRole: UserRole;
  module: 'b2b' | 'real_estate';
  searchType: string; // ex: 'Google Maps + OSINT Decisores', 'Gemini B2B', 'Idealista + OLX FSBO'
  query: string; // ex: 'Clínicas Odontológicas' ou 'T2 Particular Venda'
  location: {
    city: string;
    district?: string;
    country: string;
  };
  targetPortalsOrSources: string[];
  aiProviderUsed?: string;
  apiKeyModeUsed: ApiKeyMode;
  resultsCount: number; // Quantidade de leads/imóveis encontrados
  executionTimeMs: number;
  status: 'SUCCESS' | 'NO_RESULTS' | 'QUOTA_EXCEEDED' | 'ERROR';
  batchId?: string;
  notes?: string;
}

export interface UserQuotaUsage {
  userId: string;
  companyId: string;
  period: QuotaPeriod;
  periodStart: string;
  periodEnd: string;
  searchesPerformed: number;
  searchesLimit: number;
  searchesRemaining: number;
  resultsGathered: number;
  resultsLimit: number;
  resultsRemaining: number;
  isLimitReached: boolean;
  limitReachedReason?: string;
  nextResetDate: string;
  formattedTimeUntilReset: string;
}

export interface AuthSession {
  currentUser: UserAccount;
  currentCompany: Company;
  token: string;
}
