import { Lead, BusinessProfile, SearchBatch } from "../types";
import { RealEstatePropertyLead, RealEstateSearchBatch } from "./realEstateTypes";
import { DEFAULT_BUSINESS_PROFILE } from "../constants";

const CONTACTED_STORAGE_KEY = 'architect_contacted_history_v2';
const BUSINESS_PROFILE_KEY = 'architect_business_profile_v2';
const LEADS_CACHE_KEY = 'architect_leads_cache_v2';
const SEARCH_BATCHES_KEY = 'architect_search_batches_v1';
const ACTIVE_BATCH_ID_KEY = 'architect_active_batch_id_v1';
const REAL_ESTATE_BATCHES_KEY = 'architect_re_search_batches_v1';
const ACTIVE_RE_BATCH_ID_KEY = 'architect_active_re_batch_id_v1';
const WEBHOOK_LOGS_KEY = 'architect_webhook_logs_v2';

export interface ContactedRecord {
  date: string;
  formattedDate?: string;
  email?: string;
  website?: string;
  phone?: string;
  name: string;
  normalizedName?: string;
  leadId: string;
  outcome?: string; // Ex: 'REUNIAO_AGENDADA', 'FALOU_COM_DECISOR', 'NAO_ATENDEU', 'SEM_INTERESSE', 'WHATSAPP_ENVIADO', 'EM_NEGOCIACAO'
  outcomeLabel?: string;
  notes?: string;
  operatorName?: string;
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  type: 'ZAPI_WHATSAPP' | 'RESEND_EMAIL' | 'HUBSPOT_CRM' | 'CUSTOM_WEBHOOK';
  targetUrl?: string;
  payload: any;
  status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  response?: string;
}

// Helper to get domain from url
const getDomain = (url?: string) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace('www.', '').toLowerCase();
  } catch {
    return null;
  }
};

// --- Business Profile Persistence ---
export const getSavedBusinessProfile = (): BusinessProfile => {
  try {
    const data = localStorage.getItem(BUSINESS_PROFILE_KEY);
    return data ? JSON.parse(data) : DEFAULT_BUSINESS_PROFILE;
  } catch (e) {
    console.error("Failed to load business profile", e);
    return DEFAULT_BUSINESS_PROFILE;
  }
};

export const saveBusinessProfile = (profile: BusinessProfile) => {
  try {
    localStorage.setItem(BUSINESS_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error("Failed to save business profile", e);
  }
};

// --- Search Batches / Historical Searches Persistence ---
export const getSearchBatches = (): SearchBatch[] => {
  try {
    const data = localStorage.getItem(SEARCH_BATCHES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Auto-migration: if we have legacy leads cached in LEADS_CACHE_KEY, bundle them into a first batch
    const legacyLeads = getSavedLeads();
    if (legacyLeads && legacyLeads.length > 0) {
      const now = new Date();
      const firstBatch: SearchBatch = {
        id: `batch-legacy-${now.getTime()}`,
        name: `Lote Inicial (${legacyLeads[0]?.city || 'Prospecção'})`,
        timestamp: now.toISOString(),
        formattedDate: `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        keyword: 'Pesquisa Anterior',
        niche: legacyLeads[0]?.category || 'Multi-Nicho',
        city: legacyLeads[0]?.city || 'Geral',
        district: legacyLeads[0]?.district || 'Todas',
        country: legacyLeads[0]?.country || 'PT',
        countryName: legacyLeads[0]?.country === 'BR' ? 'Brasil' : 'Portugal',
        leadCount: legacyLeads.length,
        scoreACount: legacyLeads.filter(l => l.icpTier === 'SCORE_A').length,
        scoreBCount: legacyLeads.filter(l => l.icpTier === 'SCORE_B').length,
        leads: legacyLeads.map(l => ({ ...l, batchId: `batch-legacy-${now.getTime()}` }))
      };
      saveSearchBatches([firstBatch]);
      return [firstBatch];
    }

    return [];
  } catch (e) {
    console.error("Failed to load search batches", e);
    return [];
  }
};

export const saveSearchBatches = (batches: SearchBatch[]) => {
  try {
    localStorage.setItem(SEARCH_BATCHES_KEY, JSON.stringify(batches));
  } catch (e) {
    console.error("Failed to save search batches", e);
  }
};

export const addSearchBatch = (batch: SearchBatch): SearchBatch[] => {
  const current = getSearchBatches();
  // Coloca o novo lote no topo (mais recente primeiro)
  const updated = [batch, ...current.filter(b => b.id !== batch.id)];
  saveSearchBatches(updated);
  setActiveBatchId(batch.id);
  return updated;
};

export const deleteSearchBatch = (batchId: string): SearchBatch[] => {
  const current = getSearchBatches();
  const updated = current.filter(b => b.id !== batchId);
  saveSearchBatches(updated);
  
  // Se o lote ativo for o deletado, atualiza
  const activeId = getActiveBatchId();
  if (activeId === batchId) {
    setActiveBatchId(updated.length > 0 ? updated[0].id : null);
  }
  return updated;
};

export const clearAllSearchBatches = () => {
  try {
    localStorage.removeItem(SEARCH_BATCHES_KEY);
    localStorage.removeItem(ACTIVE_BATCH_ID_KEY);
    localStorage.removeItem(LEADS_CACHE_KEY);
  } catch (e) {
    console.error("Failed to clear batches", e);
  }
};

export interface ActiveProspectingStats {
  b2bBatchesCount: number;
  b2bLeadsCount: number;
  realEstateLeadsCount: number;
  contactedCount: number;
  totalActiveItems: number;
}

export const getActiveProspectingStats = (): ActiveProspectingStats => {
  try {
    const batches = getSearchBatches();
    const b2bBatchesCount = batches.length;
    const b2bLeadsCount = batches.reduce((acc, b) => acc + (b.leadCount || b.leads?.length || 0), 0);
    let realEstateLeadsCount = 0;
    try {
      const raw = localStorage.getItem('CRIA_SAVED_REAL_ESTATE_LEADS_V1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) realEstateLeadsCount = parsed.length;
      }
    } catch {}
    const contactedCount = getContactedHistory().length;
    return {
      b2bBatchesCount,
      b2bLeadsCount,
      realEstateLeadsCount,
      contactedCount,
      totalActiveItems: b2bLeadsCount + realEstateLeadsCount
    };
  } catch {
    return {
      b2bBatchesCount: 0,
      b2bLeadsCount: 0,
      realEstateLeadsCount: 0,
      contactedCount: 0,
      totalActiveItems: 0
    };
  }
};

/**
 * Remove completamente todos os dados ativos de prospecção salvos localmente:
 * lotes, leads B2B em cache, imóveis de particulares, histórico de contatos e logs.
 * Preserva estritamente as chaves de API, perfis da empresa e contas de usuário.
 */
export const clearAllActiveProspectingData = () => {
  try {
    localStorage.removeItem(SEARCH_BATCHES_KEY);
    localStorage.removeItem(ACTIVE_BATCH_ID_KEY);
    localStorage.removeItem(LEADS_CACHE_KEY);
    localStorage.removeItem(REAL_ESTATE_BATCHES_KEY);
    localStorage.removeItem(ACTIVE_RE_BATCH_ID_KEY);
    localStorage.removeItem('CRIA_SAVED_REAL_ESTATE_LEADS_V1');
    localStorage.removeItem(CONTACTED_STORAGE_KEY);
    localStorage.removeItem(WEBHOOK_LOGS_KEY);
    localStorage.removeItem('architect_chat_history_v1');
    localStorage.removeItem('criahub_last_search_filters');
  } catch (e) {
    console.error("Failed to clear active prospecting data", e);
  }
};

/**
 * Verifica se a URL foi acessada com instrução de inicialização limpa (?clean=1 ou ?clean=true ou ?fresh=1)
 */
export const isCleanModeRequested = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('clean') === '1' || params.get('clean') === 'true' || params.get('fresh') === '1';
  } catch {
    return false;
  }
};

export const getActiveBatchId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_BATCH_ID_KEY);
  } catch {
    return null;
  }
};

export const setActiveBatchId = (id: string | null) => {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_BATCH_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_BATCH_ID_KEY);
    }
  } catch (e) {
    console.error("Failed to set active batch id", e);
  }
};

// --- Real Estate Search Batches / Historical Searches Persistence ---
export const getRealEstateSearchBatches = (): RealEstateSearchBatch[] => {
  try {
    const data = localStorage.getItem(REAL_ESTATE_BATCHES_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    return [];
  } catch (e) {
    console.error("Failed to load real estate search batches", e);
    return [];
  }
};

export const saveRealEstateSearchBatches = (batches: RealEstateSearchBatch[]) => {
  try {
    localStorage.setItem(REAL_ESTATE_BATCHES_KEY, JSON.stringify(batches));
  } catch (e) {
    console.error("Failed to save real estate search batches", e);
  }
};

export const addRealEstateSearchBatch = (batch: RealEstateSearchBatch): RealEstateSearchBatch[] => {
  const current = getRealEstateSearchBatches();
  const updated = [batch, ...current.filter(b => b.id !== batch.id)];
  saveRealEstateSearchBatches(updated);
  setActiveRealEstateBatchId(batch.id);
  return updated;
};

export const deleteRealEstateSearchBatch = (batchId: string): RealEstateSearchBatch[] => {
  const current = getRealEstateSearchBatches();
  const updated = current.filter(b => b.id !== batchId);
  saveRealEstateSearchBatches(updated);
  
  const activeId = getActiveRealEstateBatchId();
  if (activeId === batchId) {
    setActiveRealEstateBatchId(updated.length > 0 ? updated[0].id : null);
  }
  return updated;
};

export const getActiveRealEstateBatchId = (): string | null => {
  try {
    return localStorage.getItem(ACTIVE_RE_BATCH_ID_KEY);
  } catch {
    return null;
  }
};

export const setActiveRealEstateBatchId = (id: string | null) => {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_RE_BATCH_ID_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_RE_BATCH_ID_KEY);
    }
  } catch (e) {
    console.error("Failed to set active real estate batch id", e);
  }
};

// --- Leads Cache Persistence (Legacy & Consolidated) ---
export const getSavedLeads = (): Lead[] => {
  try {
    const data = localStorage.getItem(LEADS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveLeadsCache = (leads: Lead[]) => {
  try {
    localStorage.setItem(LEADS_CACHE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error("Failed to save leads", e);
  }
};

// --- Contacted History Persistence (Anti-Queimação & Prevenção de Repetição) ---
export const getContactedHistory = (): ContactedRecord[] => {
  try {
    const data = localStorage.getItem(CONTACTED_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const normalizeStr = (str?: string): string => {
  if (!str) return '';
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

export const saveContactedLead = (
  lead: Lead,
  details?: {
    outcome?: string;
    outcomeLabel?: string;
    notes?: string;
    operatorName?: string;
  }
) => {
  const history = getContactedHistory();
  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  
  const record: ContactedRecord = {
    date: now.toISOString(),
    formattedDate: formattedDate,
    email: lead.email?.toLowerCase(),
    website: getDomain(lead.website) || undefined,
    phone: lead.phone?.replace(/\D/g, ''),
    name: lead.name,
    normalizedName: normalizeStr(lead.name),
    leadId: lead.id,
    outcome: details?.outcome || lead.contactOutcome || 'CONTATADO',
    outcomeLabel: details?.outcomeLabel || lead.contactOutcomeLabel || 'Contato Realizado',
    notes: details?.notes || lead.contactNotes || lead.notes || '',
    operatorName: details?.operatorName || 'SDR'
  };

  // Remove registro anterior da mesma empresa se já existia (atualiza o mais recente no topo)
  const filtered = history.filter(item => {
    if (record.leadId && item.leadId === record.leadId) return false;
    if (record.phone && item.phone && record.phone.length >= 8 && item.phone === record.phone) return false;
    if (record.website && item.website && record.website !== 'google.com' && item.website === record.website) return false;
    if (record.normalizedName && item.normalizedName && record.normalizedName.length >= 4 && item.normalizedName === record.normalizedName) return false;
    return true;
  });

  filtered.unshift(record);

  try {
    localStorage.setItem(CONTACTED_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to save contacted history", e);
  }

  return record;
};

export interface LeadContactStatusResult {
  contacted: boolean;
  date?: string;
  formattedDate?: string;
  outcome?: string;
  outcomeLabel?: string;
  notes?: string;
  operatorName?: string;
  warningMessage?: string;
  record?: ContactedRecord;
}

export const checkLeadStatus = (lead: Lead): LeadContactStatusResult => {
  const history = getContactedHistory();
  const leadEmail = lead.email?.toLowerCase();
  const leadDomain = getDomain(lead.website);
  const leadPhone = lead.phone?.replace(/\D/g, '');
  const leadNormName = normalizeStr(lead.name);

  const match = history.find(record => {
    if (leadEmail && record.email && record.email === leadEmail) return true;
    if (leadDomain && record.website && leadDomain !== 'google.com' && record.website === leadDomain) return true;
    if (leadPhone && record.phone && leadPhone.length >= 8 && record.phone.length >= 8) {
      // Bate os últimos 8 dígitos do telefone para evitar discrepância de código de país/DDD
      const p1 = leadPhone.slice(-8);
      const p2 = record.phone.slice(-8);
      if (p1 === p2) return true;
    }
    if (leadNormName && record.normalizedName && leadNormName.length >= 5 && record.normalizedName === leadNormName) {
      return true;
    }
    return false;
  });

  if (match) {
    const displayDate = match.formattedDate || (match.date ? new Date(match.date).toLocaleDateString('pt-BR') : 'Data não informada');
    const outcomeStr = match.outcomeLabel || match.outcome || 'Contato Realizado';
    const warning = `⚠️ JÁ CONTATADO EM ${displayDate} • OCORRÊNCIA: ${outcomeStr}${match.notes ? ` ("${match.notes.slice(0, 40)}...")` : ''}`;
    
    return {
      contacted: true,
      date: match.date,
      formattedDate: displayDate,
      outcome: match.outcome,
      outcomeLabel: match.outcomeLabel || match.outcome,
      notes: match.notes,
      operatorName: match.operatorName,
      warningMessage: warning,
      record: match
    };
  }

  return { contacted: false };
};

// --- Webhook Logs Persistence ---
export const getWebhookLogs = (): WebhookLog[] => {
  try {
    const data = localStorage.getItem(WEBHOOK_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const logWebhookDispatch = (log: Omit<WebhookLog, 'id' | 'timestamp'>) => {
  const logs = getWebhookLogs();
  const newLog: WebhookLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  // Keep last 50 logs
  try {
    localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
  } catch (e) {
    console.error("Failed to save webhook logs", e);
  }
  return newLog;
};
