import { Lead, BusinessProfile } from "../types";
import { DEFAULT_BUSINESS_PROFILE } from "../constants";

const CONTACTED_STORAGE_KEY = 'architect_contacted_history_v2';
const BUSINESS_PROFILE_KEY = 'architect_business_profile_v2';
const LEADS_CACHE_KEY = 'architect_leads_cache_v2';
const WEBHOOK_LOGS_KEY = 'architect_webhook_logs_v2';

interface ContactedRecord {
  date: string;
  email?: string;
  website?: string;
  phone?: string;
  name: string;
  leadId: string;
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

// --- Leads Cache Persistence ---
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

// --- Contacted History Persistence ---
export const getContactedHistory = (): ContactedRecord[] => {
  try {
    const data = localStorage.getItem(CONTACTED_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveContactedLead = (lead: Lead) => {
  const history = getContactedHistory();
  
  const record: ContactedRecord = {
    date: new Date().toISOString(),
    email: lead.email?.toLowerCase(),
    website: getDomain(lead.website) || undefined,
    phone: lead.phone?.replace(/\D/g, ''),
    name: lead.name,
    leadId: lead.id
  };

  history.push(record);
  localStorage.setItem(CONTACTED_STORAGE_KEY, JSON.stringify(history));
};

export const checkLeadStatus = (lead: Lead): { contacted: boolean, date?: string } => {
  const history = getContactedHistory();
  const leadEmail = lead.email?.toLowerCase();
  const leadDomain = getDomain(lead.website);
  const leadPhone = lead.phone?.replace(/\D/g, '');

  const match = history.find(record => {
    if (leadEmail && record.email && record.email === leadEmail) return true;
    if (leadDomain && record.website && record.website === leadDomain) return true;
    if (leadPhone && record.phone && record.phone === leadPhone) return true;
    return false;
  });

  if (match) {
    return { contacted: true, date: match.date };
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
  localStorage.setItem(WEBHOOK_LOGS_KEY, JSON.stringify(logs.slice(0, 50)));
  return newLog;
};
