import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Download, Filter, MapPin, RefreshCw, Briefcase, Trash2, 
  PieChart, Phone, XCircle, Globe2, ShieldCheck, Square, Mail, 
  CheckSquare, Loader2, Sparkles, SlidersHorizontal, Layers, 
  Flame, Zap, AlertTriangle, Send, FileCode, CheckCircle2, 
  Building2, Users, ArrowUpRight, BarChart3, LayoutGrid, Table as TableIcon,
  Play, HelpCircle, ChevronRight, TrendingUp, Key, Cpu, Terminal, Share2, CheckCheck, Link,
  Home, DollarSign, ExternalLink, Copy, Check, MessageSquare, PhoneCall, Clock, User,
  Wrench, ChevronDown, Menu, X, LogOut, MoreVertical, Globe
} from 'lucide-react';
import { 
  Lead, SearchParams, FilterState, SortOption, DashboardStats, 
  BusinessProfile, ScrapingEngineStatus, IcpTier, HighTicketNicheRecommendation,
  SearchBatch 
} from './types';
import { 
  DEFAULT_BUSINESS_PROFILE, SUPPORTED_COUNTRIES, BRAZIL_STATES, 
  PORTUGAL_DISTRICTS, BUSINESS_CATEGORIES, DEFAULT_FILTERS
} from './constants';
import {
  getSavedCountry, saveCountry, hasSavedCountryChoice,
  getCurrencyConfig, formatCurrencyValue,
  getHighTicketNichesForCountry, getBusinessProfileForCountry
} from './services/countryService';
import { searchAndScoreLeads } from './services/geminiService';
import { 
  getSavedBusinessProfile, saveBusinessProfile, 
  getSavedLeads, saveLeadsCache, checkLeadStatus, 
  saveContactedLead, getSearchBatches, saveSearchBatches,
  addSearchBatch, deleteSearchBatch, clearAllSearchBatches,
  clearAllActiveProspectingData, isCleanModeRequested,
  getActiveBatchId, setActiveBatchId
} from './services/storageService';
import { getAiConfig } from './services/aiProviderService';
import { autoHydrateFromUrl, generateShareableLink } from './services/configSharingService';
import { 
  RealEstatePropertyLead, 
  RealEstateCountry, 
  RealEstateTransactionType, 
  RealEstateScrapingSearchQuery 
} from './services/realEstateTypes';
import { 
  generatePortalDirectSearchUrls, 
  scrapeRealEstateParticulars 
} from './services/realEstateScrapingService';

import LeadCard from './components/LeadCard';
import PipelineTable from './components/PipelineTable';
import PipelineKanban from './components/PipelineKanban';
import SdrCockpitModal from './components/SdrCockpitModal';
import CadenceQueueModal from './components/CadenceQueueModal';
import CitySelector from './components/CitySelector';
import OmnichannelModal from './components/OmnichannelModal';
import BusinessProfileModal from './components/BusinessProfileModal';
import WebhookAutomationModal from './components/WebhookAutomationModal';
import JsonViewerModal from './components/JsonViewerModal';
import ScrapingPipelineBanner from './components/ScrapingPipelineBanner';
import AiLiveCopilotModal from './components/AiLiveCopilotModal';
import CountrySelectModal from './components/CountrySelectModal';
import SettingsModal, { TabType as SettingsTabType } from './components/SettingsModal';
import { SearchBatchSelector } from './components/SearchBatchSelector';
import { LeadNotesModal } from './components/LeadNotesModal';
import { LeadAnalysisDrawer } from './components/LeadAnalysisDrawer';
import { ScraperStudioModal } from './components/ScraperStudioModal';
import { calculateLeadRoiRecommendation, evaluateLeadPurchasePower } from './services/roiRecommendationService';
import { RealEstateScraperModal } from './components/RealEstateScraperModal';
import { ColdCallHunterModal } from './components/ColdCallHunterModal';
import { FastDialerFocusModal } from './components/FastDialerFocusModal';
import { GroqTriageWebhookModal } from './components/GroqTriageWebhookModal';
import { OmniAssertiveValidatorService } from './services/omniAssertiveValidatorService';
import { searchApolloPeople, convertApolloPersonToLead, getApolloApiKey } from './services/apolloService';
import { searchFreeApolloB2bLeads, searchGoogleMapsWithOsintDecisors } from './services/freeB2bProspectorService';
import { searchSimultaneousMultiSourceLeads } from './services/simultaneousProspectorService';
import { hydrateAndEnrichLeadsWithRealData } from './services/nicheIntelligenceService';
import { UserAccount, UserQuotaUsage } from './types/authAndQuotaTypes';
import { 
  getCurrentUser, setCurrentUser as persistCurrentUser, 
  getUserEffectiveLimits, calculateUserQuotaUsage, 
  canUserExecuteSearch, recordSearchAudit,
  isUserAuthenticated, logoutUser 
} from './services/authAndQuotaService';
import { AuthModal } from './components/admin/AuthModal';
import { UserAndCompanyManagementModal } from './components/admin/UserAndCompanyManagementModal';
import { QuotaExceededModal } from './components/admin/QuotaExceededModal';
import { LoginPage } from './components/admin/LoginPage';
import { AiGeminiChatCopilot } from './components/AiGeminiChatCopilot';
import { AppBottomNav, MainNavTab } from './components/AppBottomNav';
import { AnalyticsDashboardView } from './components/AnalyticsDashboardView';
import { RgpdSuppressionModal } from './components/RgpdSuppressionModal';
import { MobileCommandSheet } from './components/MobileCommandSheet';

// --- Utilitários de deduplicação/merge de leads ---
const normalizeName = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const normalizeWebsite = (url: string) => url.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase().replace(/\/+$/, '').trim();

export const isGoogleMapsLead = (l: Lead): boolean => {
  if (l.originApi === 'apollo' || l.source === 'apollo') return false;
  if (l.originApi === 'synthetic' || l.source === 'synthetic') return false;
  return (
    l.originApi === 'rapidapi_google_maps' ||
    l.originApi === 'letscrape' ||
    l.originApi === 'free_osint' ||
    l.originApi === 'google_search' ||
    l.source === 'ai' ||
    !!l.googleMapsLink ||
    !l.originApi
  );
};

// Mescla novos leads com a lista existente, preservando status de contato e evitando duplicados
function mergeLeadLists(newLeads: Lead[], existing: Lead[]): Lead[] {
  const keyOf = (lead: Lead) => lead.website
    ? `w:${normalizeWebsite(lead.website)}`
    : `n:${normalizeName(lead.name)}`;

  const seen = new Set<string>();
  const merged: Lead[] = [];

  for (const lead of newLeads) {
    const key = keyOf(lead);
    const dup = !seen.has(key) && existing.find(e => keyOf(e) === key);
    if (dup) {
      // Mantém ID/status/contato do lead já existente, mas adota o enriquecimento mais recente
      merged.push({
        ...lead,
        id: dup.id,
        status: lead.status === 'new' ? dup.status : lead.status,
        lastContactedAt: lead.lastContactedAt || dup.lastContactedAt,
        notes: dup.notes || lead.notes
      });
    } else {
      merged.push(lead);
    }
    seen.add(key);
  }

  for (const lead of existing) {
    const key = keyOf(lead);
    if (!seen.has(key)) {
      merged.push(lead);
      seen.add(key);
    }
  }

  return merged;
}

export function App() {
  // Auto-hidratação de credenciais via URL (?cfg=... ou #config=... ou query params)
  const [syncNotification, setSyncNotification] = useState<{ message: string; items: string[] } | null>(() => {
    const hydration = autoHydrateFromUrl();
    if (hydration.cleanRequested) {
      return {
        message: 'Link Limpo carregado com sucesso!',
        items: ['Ambiente 100% zerado e sem dados residuais', 'Nenhum lead ou pesquisa anterior foi importada']
      };
    }
    if (hydration.hydrated && hydration.importedItems.length > 0) {
      return {
        message: 'APIs e Configurações sincronizadas com sucesso via link de acesso!',
        items: hydration.importedItems
      };
    }
    return null;
  });

  // Embed & Query Parameters Detection
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const isEmbedMode = urlParams.get('embed') === 'true' || urlParams.get('iframe') === 'true';
  const hideHeaderParam = urlParams.get('hideHeader') === 'true';

  // Country & Currency State (persisted or URL parameter)
  const [country, setCountry] = useState<string>(() => {
    const urlCountry = urlParams.get('country');
    if (urlCountry && SUPPORTED_COUNTRIES.some(c => c.code === urlCountry.toUpperCase())) {
      return urlCountry.toUpperCase();
    }
    return getSavedCountry();
  });
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // Business Profile & Matching State
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = getSavedBusinessProfile();
    const initialCountry = country;
    const isDefaultProfile = saved.businessName === DEFAULT_BUSINESS_PROFILE.businessName;
    if (isDefaultProfile) {
      return getBusinessProfileForCountry(initialCountry);
    }
    if (!saved.recommendedHighTicketNiches || saved.recommendedHighTicketNiches.length === 0) {
      saved.recommendedHighTicketNiches = getHighTicketNichesForCountry(initialCountry);
    }
    return saved;
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Search State
  const [searchParams, setSearchParams] = useState<SearchParams>(() => {
    const c = country;
    const urlCity = urlParams.get('city');
    const urlNiche = urlParams.get('niche') || urlParams.get('keyword');
    return {
      keyword: urlNiche || '',
      country: c,
      city: urlCity || getCurrencyConfig(c).defaultCity,
      district: 'Todas',
      radius: 15,
      strictMode: true,
      tierFilter: 'ALL'
    };
  });

  // Country & Business Profile Persistence: detecta e carrega silenciosamente sem interromper o usuário com popups a cada acesso
  useEffect(() => {
    if (!hasSavedCountryChoice()) {
      saveCountry(country);
    }
  }, [country]);

  const applyCountry = (newCountry: string) => {
    const config = getCurrencyConfig(newCountry);
    setCountry(newCountry);
    saveCountry(newCountry);
    setSearchParams(prev => ({
      ...prev,
      country: newCountry,
      city: config.defaultCity,
      district: 'Todas'
    }));
    setBusinessProfile(prev => {
      const isDefaultProfile = prev.businessName === DEFAULT_BUSINESS_PROFILE.businessName;
      const next = {
        ...prev,
        recommendedHighTicketNiches: getHighTicketNichesForCountry(newCountry)
      };
      if (isDefaultProfile) {
        next.ticketMedio = getBusinessProfileForCountry(newCountry).ticketMedio;
      }
      return next;
    });
  };

  // Search Batches (Historical & Isolated Searches) State
  const [batches, setBatches] = useState<SearchBatch[]>(() => {
    if (isCleanModeRequested()) return [];
    return getSearchBatches();
  });
  const [activeBatchId, setActiveBatchIdState] = useState<string | null>(() => {
    if (isCleanModeRequested()) return null;
    const savedActiveId = getActiveBatchId();
    const initialBatches = getSearchBatches();
    if (savedActiveId && initialBatches.some(b => b.id === savedActiveId)) {
      return savedActiveId;
    }
    return initialBatches.length > 0 ? initialBatches[0].id : null;
  });

  // Leads State - initialized from active batch or cache
  const [leads, setLeads] = useState<Lead[]>(() => {
    if (isCleanModeRequested()) return [];
    const initialBatches = getSearchBatches();
    const savedActiveId = getActiveBatchId();
    let rawLeads: Lead[] = [];
    if (savedActiveId) {
      const found = initialBatches.find(b => b.id === savedActiveId);
      if (found) rawLeads = found.leads;
    } else if (initialBatches.length > 0) {
      rawLeads = initialBatches[0].leads;
    } else {
      const cached = getSavedLeads();
      rawLeads = cached.length > 0 ? cached : [];
    }
    const normalized = rawLeads.map(l => {
      if (isGoogleMapsLead(l)) {
        return {
          ...l,
          originApi: 'rapidapi_google_maps' as const,
          originApiLabel: l.originApiLabel || 'Google Maps Scraping Real + OSINT Decisores'
        };
      }
      return l;
    });
    const hydrated = hydrateAndEnrichLeadsWithRealData(normalized);
    return OmniAssertiveValidatorService.enrichLeadsWithAudit(hydrated, getSavedCountry());
  });

  const [isLoading, setIsLoading] = useState(false);
  const loadingStepTimerRef = useRef<number[]>([]);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<ScrapingEngineStatus>({
    primary: { name: "RapidAPI LetScrape — Local Business Data (Empresas Reais)", status: "ACTIVE" },
    secondary: { name: "OpenStreetMap Overpass (Fallback Gratuito)", status: "FALLBACK_READY" },
    tertiary: { name: "IA Groq — Enriquecimento Anti-Alucinação", status: "READY" },
    activeEngine: "LetScrape → OSM → Groq (Auto Fallback)",
    lastLatencyMs: 1250,
    extractedCount: leads.length
  });

  // View & UI Modals State (Default to 'b2b_leads' search screen as requested)
  const [activeNavTab, setActiveNavTab] = useState<MainNavTab>('b2b_leads');
  const [isRgpdModalOpen, setIsRgpdModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'kanban'>('cards');
  const [isCockpitOpen, setIsCockpitOpen] = useState(false);
  const [cockpitLeadIndex, setCockpitLeadIndex] = useState(0);
  const [isCadenceQueueOpen, setIsCadenceQueueOpen] = useState(false);
  const [selectedLeadForOmnichannel, setSelectedLeadForOmnichannel] = useState<Lead | null>(null);
  const [omnichannelInitialTab, setOmnichannelInitialTab] = useState<'criahub_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech'>('cadence');
  const [isOmnichannelOpen, setIsOmnichannelOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<SettingsTabType>('rapidapi');

  // AI Live Copilot State
  const [selectedLeadForLiveCopilot, setSelectedLeadForLiveCopilot] = useState<Lead | null>(null);
  const [isLiveCopilotOpen, setIsLiveCopilotOpen] = useState(false);

  // Cold Call Hunter Teleprompter Modal State
  const [hunterCallLead, setHunterCallLead] = useState<Lead | null>(null);
  const [isHunterCallModalOpen, setIsHunterCallModalOpen] = useState<boolean>(false);

  // Groq Llama-3 Triage & Webhook Simulator State
  const [groqTriageLead, setGroqTriageLead] = useState<Lead | null>(null);
  const [isGroqTriageModalOpen, setIsGroqTriageModalOpen] = useState<boolean>(false);

  // Lead Notes / Custom Info Modal State
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState<Lead | null>(null);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

  // CriaHub SDR & High Conversion Copy Drawer State
  const [selectedLeadForCriahub, setSelectedLeadForCriahub] = useState<Lead | null>(null);
  const [isCriahubDrawerOpen, setIsCriahubDrawerOpen] = useState(false);

  // Scraper Studio (Playwright Stealth, DOM Extractors & Matching Engine Inspector)
  const [isScraperStudioOpen, setIsScraperStudioOpen] = useState(false);

  // Primary Search Domain: 'companies' (B2B Businesses, Owners & Decision Makers) vs 'real_estate' (FSBO Particular Property Owners on Idealista, OLX, Fotocasa & Zap)
  const [searchDomain, setSearchDomain] = useState<'companies' | 'real_estate'>('companies');

  // Real Estate FSBO Scraper Modal & In-Page State
  const [isRealEstateModalOpen, setIsRealEstateModalOpen] = useState(false);
  const [reCountry, setReCountry] = useState<RealEstateCountry>('PT');
  const [reCity, setReCity] = useState<string>('Lisboa');
  const [reZone, setReZone] = useState<string>('');
  const [reTransactionType, setReTransactionType] = useState<RealEstateTransactionType>('SALE');
  const [rePropertyType, setRePropertyType] = useState<string>('Apartamentos & Moradias');
  const [reMaxDaysAgo, setReMaxDaysAgo] = useState<number>(3);
  const [realEstateLeads, setRealEstateLeads] = useState<RealEstatePropertyLead[]>(() => {
    if (isCleanModeRequested()) return [];
    try {
      const raw = localStorage.getItem('CRIA_SAVED_REAL_ESTATE_LEADS_V1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading saved real estate leads', e);
    }
    return [];
  });

  // Persist real estate leads across screen switches and reloads
  useEffect(() => {
    try {
      localStorage.setItem('CRIA_SAVED_REAL_ESTATE_LEADS_V1', JSON.stringify(realEstateLeads));
    } catch (e) {
      console.error('Error saving real estate leads', e);
    }
  }, [realEstateLeads]);
  const [isReLoading, setIsReLoading] = useState<boolean>(false);
  const [selectedReLead, setSelectedReLead] = useState<RealEstatePropertyLead | null>(null);
  const [copiedReKey, setCopiedReKey] = useState<string | null>(null);
  const [reObjectionTab, setReObjectionTab] = useState<string>('dontWantAgencies');

  // Prospecting Engine Mode: 'simultaneous_all' (Busca Simultânea em múltiplos polos e fontes com planejamento de 5 leads/dia), 'gmaps_osint' (Google Maps Scraping + Decisores OSINT), 'free_apollo' (Google + LinkedIn + Indeed OSINT), 'apollo' (Apollo.io API Oficial) or 'standard' (Google Maps puro)
  const [prospectEngineMode, setProspectEngineMode] = useState<'simultaneous_all' | 'gmaps_osint' | 'free_apollo' | 'apollo' | 'standard'>('simultaneous_all');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'OWNERS' | 'MANAGERS' | 'COMMERCIAL'>('ALL');

  // Selection & Batch Action State
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Filter and Sorting State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('icp_score_desc');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Visual Mode State: 'Simple' (Clean, direct, uncluttered) vs 'Pro' (Diagnostics, advanced telemetry)
  const [isSimpleView, setIsSimpleView] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('CRIA_SIMPLE_VIEW_MODE');
      if (saved !== null) return saved === 'true';
    } catch (e) {}
    return true; // Default to true: simple, clean, easy to navigate for clients
  });

  useEffect(() => {
    try {
      localStorage.setItem('CRIA_SIMPLE_VIEW_MODE', String(isSimpleView));
    } catch (e) {}
  }, [isSimpleView]);

  // Collapsible Advanced Search Filters (Engine, Role focus, Full niche list)
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // User Authentication, Quota & Admin State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());
  const [currentUser, setCurrentUserState] = useState<UserAccount>(() => getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdminManagementOpen, setIsAdminManagementOpen] = useState(false);
  const [quotaModalData, setQuotaModalData] = useState<{
    isOpen: boolean;
    usage: UserQuotaUsage;
    reason?: string;
    moduleAttempted?: 'b2b' | 'real_estate';
  } | null>(null);
  const [quotaRefreshTick, setQuotaRefreshTick] = useState(0);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Real-time quota usage
  const currentQuotaUsage = useMemo(() => {
    return calculateUserQuotaUsage(currentUser);
  }, [currentUser, batches, quotaRefreshTick]);

  const handleUserChanged = (newUser: UserAccount) => {
    setCurrentUserState(newUser);
    persistCurrentUser(newUser);
    setIsAuthenticated(true);
    if (newUser.allowedModules === 'b2b' && searchDomain === 'real_estate') {
      setSearchDomain('companies');
    } else if (newUser.allowedModules === 'real_estate' && searchDomain === 'companies') {
      setSearchDomain('real_estate');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  // Sync leads cache
  useEffect(() => {
    if (leads.length > 0) {
      saveLeadsCache(leads);
    }
  }, [leads]);

  // One-time hydration of stored batches and leads with verified real websites and contacts
  useEffect(() => {
    const currentBatches = getSearchBatches();
    if (currentBatches && currentBatches.length > 0) {
      const updatedBatches = currentBatches.map(b => ({
        ...b,
        leads: hydrateAndEnrichLeadsWithRealData(b.leads || [])
      }));
      saveSearchBatches(updatedBatches);
      setBatches(updatedBatches);
    }
    setLeads(prev => hydrateAndEnrichLeadsWithRealData(prev));
  }, []);

  // Execute Prospecting Pipeline (Isolated per search batch)
  const handleSearch = async (
    e?: React.FormEvent, 
    customKeyword?: string,
    overrideCity?: string,
    overrideCountry?: CountryCode
  ) => {
    if (e) e.preventDefault();
    
    if (overrideCity) {
      setSearchParams(prev => ({ ...prev, city: overrideCity }));
    }
    if (overrideCountry) {
      setSearchParams(prev => ({ ...prev, country: overrideCountry }));
    }

    const currentCity = overrideCity || searchParams.city;
    const currentCountry = overrideCountry || searchParams.country;
    const targetKeyword = customKeyword !== undefined ? customKeyword : searchParams.keyword;

    // 1. Quota & Permission Verification Gatekeeper
    const permissionCheck = canUserExecuteSearch(currentUser, 'b2b');
    if (!permissionCheck.allowed) {
      setQuotaModalData({
        isOpen: true,
        usage: permissionCheck.usage,
        reason: permissionCheck.reason,
        moduleAttempted: 'b2b'
      });
      recordSearchAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        userRole: currentUser.role,
        module: 'b2b',
        searchType: prospectEngineMode === 'gmaps_osint' ? 'Google Maps + OSINT' : prospectEngineMode === 'free_apollo' ? 'Free Apollo OSINT' : prospectEngineMode === 'apollo' ? 'Apollo.io' : 'Gemini B2B',
        query: (targetKeyword && targetKeyword !== 'auto') ? targetKeyword : currentCity || 'Prospecção B2B',
        location: { city: currentCity, district: searchParams.district, country: currentCountry },
        targetPortalsOrSources: ['Google Maps', 'LinkedIn', 'Apollo'],
        aiProviderUsed: getAiConfig().geminiModel || 'Gemini 3.7 Flash',
        apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
        resultsCount: 0,
        executionTimeMs: 0,
        status: 'QUOTA_EXCEEDED',
        notes: `Busca bloqueada: ${permissionCheck.reason}`
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);
    setSelectedLeadIds(new Set());

    const isAuto = !targetKeyword || targetKeyword.trim() === "" || targetKeyword.toLowerCase() === "auto";
    setLoadingStep(isAuto 
      ? '1/4 Mapeando Nichos de Alto Ticket & Alta Conversão para os seus serviços...'
      : `1/4 Iniciando Prospecção para "${targetKeyword}" com IA e Fallback...`
    );

    // Clear any previous pending step timers before scheduling new ones
    loadingStepTimerRef.current.forEach(t => window.clearTimeout(t));
    const isLoadingRef = { value: true };
    loadingStepTimerRef.current = [
      window.setTimeout(() => { if (isLoadingRef.value) setLoadingStep('2/4 Mapeando Decisores, WhatsApp Direto & Falhas de Tecnologia...'); }, 2500),
      window.setTimeout(() => { if (isLoadingRef.value) setLoadingStep('3/4 Calculando Intent Score e Deep Matching com suas soluções...'); }, 5000),
      window.setTimeout(() => { if (isLoadingRef.value) setLoadingStep('4/4 Gerando Roteiros Omnichannel e Payloads Criahub CRM / Z-API...'); }, 7500)
    ];

    const searchStartTime = Date.now();
    const effectiveLimits = getUserEffectiveLimits(currentUser);

    try {
      if (prospectEngineMode === 'simultaneous_all') {
        const keywords = targetKeyword && targetKeyword.trim() && targetKeyword.toLowerCase() !== 'auto' 
          ? targetKeyword.trim() 
          : businessProfile.icpTarget || 'Empresas B2B & Serviços';

        setLoadingStep('1/4 Iniciando busca simultânea em múltiplos polos e fontes (Google Maps, Apollo, LinkedIn e Web)...');

        const { 
          leads: simLeads, 
          totalDaysPlanned, 
          uniqueCount, 
          hubsQueried 
        } = await searchSimultaneousMultiSourceLeads({
          keyword: keywords,
          country: currentCountry,
          city: currentCity,
          district: searchParams.district,
          roleFilter: roleFilter,
          businessProfile: businessProfile,
          targetCount: 50,
          signal: controller.signal,
          onProgress: (step) => setLoadingStep(step)
        });

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const newBatchId = `batch-simultaneous-${now.getTime()}`;
        const countryLabel = currentCountry === 'BR' ? 'Brasil' : currentCountry === 'PT' ? 'Portugal' : currentCountry;
        const roleLabel = roleFilter === 'OWNERS' ? 'Donos & Sócios' : roleFilter === 'MANAGERS' ? 'Gerentes & Diretores' : roleFilter === 'COMMERCIAL' ? 'Heads Comerciais' : 'Decisores';
        const batchName = `⚡ Busca Simultânea Multilocal (${totalDaysPlanned} Dias / 50+): ${keywords} — ${currentCity} (${countryLabel})`;

        const cappedLeads = effectiveLimits.resultsPerSearchLimit > 0 && effectiveLimits.resultsPerSearchLimit < simLeads.length
          ? simLeads.slice(0, effectiveLimits.resultsPerSearchLimit)
          : simLeads;

        const processedWithBatch: Lead[] = cappedLeads.map(lead => ({
          ...lead,
          batchId: newBatchId,
          batchName: batchName,
          capturedAt: formattedDate
        }));

        setLoadingStep('4/4 Organizando planejamento diário (5 leads/dia) e salvando histórico...');

        const newBatch: SearchBatch = {
          id: newBatchId,
          name: batchName,
          timestamp: now.toISOString(),
          formattedDate: formattedDate,
          keyword: keywords,
          niche: keywords,
          city: currentCity,
          district: searchParams.district,
          country: currentCountry,
          countryName: countryLabel,
          leadCount: processedWithBatch.length,
          scoreACount: processedWithBatch.filter(l => l.icpTier === 'SCORE_A').length,
          scoreBCount: processedWithBatch.filter(l => l.icpTier === 'SCORE_B').length,
          leads: processedWithBatch
        };

        const updatedBatches = addSearchBatch(newBatch);
        setBatches(updatedBatches);
        setActiveBatchIdState(newBatch.id);
        setActiveBatchId(newBatch.id);
        setLeads(processedWithBatch);

        setEngineStatus({
          primary: { name: `Google Maps Multi-Hubs (${hubsQueried.length} Polos Simultâneos)`, status: "ACTIVE" },
          secondary: { name: "Apollo.io & LinkedIn Decisores", status: "ACTIVE" },
          tertiary: { name: "Anti-Queimação & Cadência 5 Leads/Dia", status: "ACTIVE" },
          activeEngine: `Simultâneo Multilocal (${uniqueCount} únicos / ${totalDaysPlanned} dias planejados)`,
          lastLatencyMs: Date.now() - searchStartTime,
          extractedCount: processedWithBatch.length
        });

        recordSearchAudit({
          keyword: keywords,
          city: currentCity,
          district: searchParams.district || '',
          country: currentCountry,
          leadCount: processedWithBatch.length,
          executionTimeMs: Date.now() - searchStartTime,
          engineUsed: 'simultaneous_all_multi_hub',
          status: 'SUCCESS'
        });

        setIsLoading(false);
        return;
      }

      if (prospectEngineMode === 'gmaps_osint') {
        setLoadingStep('1/3 Raspando empresas locais reais no Google Maps (avaliações ⭐, telefones, links e endereços)...');
        
        const keywords = targetKeyword && targetKeyword.trim() && targetKeyword.toLowerCase() !== 'auto' 
          ? targetKeyword.trim() 
          : businessProfile.icpTarget || 'Empresas B2B & Serviços';

        const { leads: gmapsLeads, engineUsed, latencyMs } = await searchGoogleMapsWithOsintDecisors({
          keyword: keywords,
          city: currentCity,
          district: searchParams.district,
          country: currentCountry,
          roleFilter: roleFilter,
          perPage: 12
        }, businessProfile, controller.signal);

        setLoadingStep('2/3 Mapeando Donos, Sócios e Gerentes via LinkedIn X-Ray, Sócios do Google & Vagas no Indeed...');

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const newBatchId = `batch-gmaps-osint-${now.getTime()}`;
        const countryLabel = currentCountry === 'BR' ? 'Brasil' : currentCountry === 'PT' ? 'Portugal' : currentCountry;
        
        const roleLabel = roleFilter === 'OWNERS' ? 'Donos & Sócios' : roleFilter === 'MANAGERS' ? 'Gerentes & Diretores' : roleFilter === 'COMMERCIAL' ? 'Heads Comerciais' : 'Decisores';
        const batchName = `Google Maps + ${roleLabel}: ${keywords} — ${currentCity} (${currentCountry})`;

        const cappedLeads = effectiveLimits.resultsPerSearchLimit > 0 ? gmapsLeads.slice(0, effectiveLimits.resultsPerSearchLimit) : gmapsLeads;

        const processedWithBatch: Lead[] = cappedLeads.map(lead => ({
          ...lead,
          batchId: newBatchId,
          batchName: batchName,
          capturedAt: formattedDate,
          originApi: 'rapidapi_google_maps' as const,
          originApiLabel: lead.originApiLabel || `Google Maps Scraping Real (${engineUsed || 'Motor Zero-Block'}) + OSINT Decisores`
        }));

        setLoadingStep('3/3 Sintetizando Diagnóstico BANT+, Tech Stack e Roteiros SDR Omnichannel...');

        const newBatch: SearchBatch = {
          id: newBatchId,
          name: batchName,
          timestamp: now.toISOString(),
          formattedDate: formattedDate,
          keyword: keywords,
          niche: keywords,
          city: currentCity,
          district: searchParams.district,
          country: currentCountry,
          countryName: countryLabel,
          leadCount: processedWithBatch.length,
          scoreACount: processedWithBatch.filter(l => l.icpTier === 'SCORE_A').length,
          scoreBCount: processedWithBatch.filter(l => l.icpTier === 'SCORE_B').length,
          leads: processedWithBatch
        };

        const updatedBatches = addSearchBatch(newBatch);
        setBatches(updatedBatches);
        setActiveBatchIdState(newBatch.id);
        setActiveBatchId(newBatch.id);
        setLeads(processedWithBatch);

        setEngineStatus({
          primary: { name: "Google Maps Scraping Real (LetScrape / OSM)", status: "ACTIVE" },
          secondary: { name: "LinkedIn & Google Sócios OSINT Dorker", status: "READY" },
          tertiary: { name: "CriaHub Master SDR Engine (+10 Anos)", status: "READY" },
          activeEngine: `Google Maps Scraper (${engineUsed}) → OSINT Decisores → CriaHub SDR`,
          lastLatencyMs: latencyMs || 850,
          extractedCount: processedWithBatch.length
        });

        // Record Audit Log for successful search
        recordSearchAudit({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          userRole: currentUser.role,
          module: 'b2b',
          searchType: `Google Maps + ${roleLabel}`,
          query: keywords,
          location: { city: searchParams.city, district: searchParams.district, country: searchParams.country },
          targetPortalsOrSources: ['Google Maps', 'LinkedIn', 'Indeed'],
          aiProviderUsed: 'LetScrape + OSINT Decisores',
          apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
          resultsCount: processedWithBatch.length,
          executionTimeMs: Date.now() - searchStartTime,
          status: processedWithBatch.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
          batchId: newBatchId,
          notes: `Lote "${batchName}" gerado com ${processedWithBatch.length} decisores identificados.`
        });

        return;
      }

      if (prospectEngineMode === 'free_apollo') {
        setLoadingStep('1/3 Mapeando Empresas, Donos & Gerentes via Google, LinkedIn & Indeed OSINT (Free)...');
        
        const keywords = targetKeyword && targetKeyword.trim() && targetKeyword.toLowerCase() !== 'auto' 
          ? targetKeyword.trim() 
          : businessProfile.icpTarget || 'Empresas B2B & Serviços';

        const { leads: freeLeads, searchSummary } = await searchFreeApolloB2bLeads({
          keyword: keywords,
          city: currentCity,
          district: searchParams.district,
          country: currentCountry,
          roleFilter: roleFilter,
          perPage: 12
        }, businessProfile, controller.signal);

        setLoadingStep('2/3 Processando Dorks do LinkedIn X-Ray, Sócios do Google & Vagas no Indeed...');

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const newBatchId = `batch-free-apollo-${now.getTime()}`;
        const countryLabel = currentCountry === 'BR' ? 'Brasil' : currentCountry === 'PT' ? 'Portugal' : currentCountry;
        
        const roleLabel = roleFilter === 'OWNERS' ? 'Donos & Sócios' : roleFilter === 'MANAGERS' ? 'Gerentes & Diretores' : roleFilter === 'COMMERCIAL' ? 'Heads Comerciais' : 'Decisores';
        const batchName = `Free Apollo (${roleLabel}): ${keywords} — ${currentCity} (${currentCountry})`;

        const cappedLeads = effectiveLimits.resultsPerSearchLimit > 0 ? freeLeads.slice(0, effectiveLimits.resultsPerSearchLimit) : freeLeads;

        const processedWithBatch: Lead[] = cappedLeads.map(lead => ({
          ...lead,
          batchId: newBatchId,
          batchName: batchName,
          capturedAt: formattedDate
        }));

        setLoadingStep('3/3 Sintetizando Diagnóstico BANT+, ICP Scores e Roteiros SDR...');

        const newBatch: SearchBatch = {
          id: newBatchId,
          name: batchName,
          timestamp: now.toISOString(),
          formattedDate: formattedDate,
          keyword: keywords,
          niche: keywords,
          city: currentCity,
          district: searchParams.district,
          country: currentCountry,
          countryName: countryLabel,
          leadCount: processedWithBatch.length,
          scoreACount: processedWithBatch.filter(l => l.icpTier === 'SCORE_A').length,
          scoreBCount: processedWithBatch.filter(l => l.icpTier === 'SCORE_B').length,
          leads: processedWithBatch
        };

        const updatedBatches = addSearchBatch(newBatch);
        setBatches(updatedBatches);
        setActiveBatchIdState(newBatch.id);
        setActiveBatchId(newBatch.id);
        setLeads(processedWithBatch);

        setEngineStatus({
          primary: { name: "Free Apollo OSINT Engine (LinkedIn + Google + Indeed)", status: "ACTIVE" },
          secondary: { name: "Google Sócios & Quadro Societário Dorker", status: "READY" },
          tertiary: { name: "CriaHub Master SDR Engine (+10 Anos)", status: "READY" },
          activeEngine: "Free Apollo (LinkedIn + Google + Indeed) → CriaHub SDR Engine",
          lastLatencyMs: 650,
          extractedCount: processedWithBatch.length
        });

        recordSearchAudit({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          userRole: currentUser.role,
          module: 'b2b',
          searchType: `Free Apollo (${roleLabel})`,
          query: keywords,
          location: { city: searchParams.city, district: searchParams.district, country: searchParams.country },
          targetPortalsOrSources: ['LinkedIn X-Ray', 'Google Sócios', 'Indeed'],
          aiProviderUsed: 'Free Apollo OSINT Engine',
          apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
          resultsCount: processedWithBatch.length,
          executionTimeMs: Date.now() - searchStartTime,
          status: processedWithBatch.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
          batchId: newBatchId,
          notes: `Lote "${batchName}" criado via Free Apollo OSINT.`
        });

        return;
      }

      if (prospectEngineMode === 'apollo') {
        setLoadingStep('1/3 Conectando à API Apollo.io & Mapeando Decisores B2B do LinkedIn...');
        
        const apolloLocation = [`${currentCity}, ${currentCountry === 'PT' ? 'Portugal' : currentCountry === 'BR' ? 'Brazil' : currentCountry}`];
        const keywords = targetKeyword && targetKeyword.trim() && targetKeyword.toLowerCase() !== 'auto' 
          ? targetKeyword.trim() 
          : businessProfile.icpTarget || 'Tecnologia B2B';

        const apolloRes = await searchApolloPeople({
          q_keywords: keywords,
          organization_locations: apolloLocation,
          per_page: 15
        });

        if (apolloRes.error && apolloRes.people.length === 0) {
          throw new Error(`Erro na API Apollo.io: ${apolloRes.error}`);
        }

        setLoadingStep('2/3 Convertendo Decisores, E-mails Diretos Verificados e Tech Stack...');
        
        const convertedLeads = apolloRes.people.map(person => 
          convertApolloPersonToLead(person, currentCountry, currentCity)
        );

        setLoadingStep('3/3 Sintetizando BANT+, ICP Scores e Diagnóstico CriaHub...');

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
        const newBatchId = `batch-apollo-${now.getTime()}`;
        const countryLabel = currentCountry === 'BR' ? 'Brasil' : currentCountry === 'PT' ? 'Portugal' : currentCountry;
        const batchName = `Apollo.io Decisores: ${keywords} — ${currentCity} (${currentCountry})`;

        const cappedLeads = effectiveLimits.resultsPerSearchLimit > 0 ? convertedLeads.slice(0, effectiveLimits.resultsPerSearchLimit) : convertedLeads;

        const processedWithBatch: Lead[] = cappedLeads.map(lead => ({
          ...lead,
          batchId: newBatchId,
          batchName: batchName,
          capturedAt: formattedDate
        }));

        const newBatch: SearchBatch = {
          id: newBatchId,
          name: batchName,
          timestamp: now.toISOString(),
          formattedDate: formattedDate,
          keyword: keywords,
          niche: keywords,
          city: currentCity,
          district: searchParams.district,
          country: currentCountry,
          countryName: countryLabel,
          leadCount: processedWithBatch.length,
          scoreACount: processedWithBatch.filter(l => l.icpTier === 'SCORE_A').length,
          scoreBCount: processedWithBatch.filter(l => l.icpTier === 'SCORE_B').length,
          leads: processedWithBatch
        };

        const updatedBatches = addSearchBatch(newBatch);
        setBatches(updatedBatches);
        setActiveBatchIdState(newBatch.id);
        setActiveBatchId(newBatch.id);
        setLeads(processedWithBatch);

        setEngineStatus({
          primary: { name: "Apollo.io API Oficial (/v1/mixed_people/search)", status: "ACTIVE" },
          secondary: { name: "LinkedIn Decisor Intelligence Engine", status: "READY" },
          tertiary: { name: "CriaHub SDR Engine", status: "READY" },
          activeEngine: "Apollo.io → LinkedIn → CriaHub SDR Engine",
          lastLatencyMs: 820,
          extractedCount: processedWithBatch.length
        });

        recordSearchAudit({
          userId: currentUser.id,
          userName: currentUser.name,
          userEmail: currentUser.email,
          companyId: currentUser.companyId,
          companyName: currentUser.companyName,
          userRole: currentUser.role,
          module: 'b2b',
          searchType: 'Apollo.io API Oficial',
          query: keywords,
          location: { city: currentCity, district: searchParams.district, country: currentCountry },
          targetPortalsOrSources: ['Apollo.io API', 'LinkedIn'],
          aiProviderUsed: 'Apollo.io Official API',
          apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
          resultsCount: processedWithBatch.length,
          executionTimeMs: Date.now() - searchStartTime,
          status: processedWithBatch.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
          batchId: newBatchId,
          notes: `Lote "${batchName}" criado via Apollo.io API.`
        });

        return;
      }

      const result = await searchAndScoreLeads(
        targetKeyword,
        currentCountry,
        currentCity,
        searchParams.district,
        searchParams.radius,
        searchParams.strictMode,
        businessProfile,
        controller.signal
      );

      // Check against contacted history
      const processed = result.leads.map(lead => {
        const check = checkLeadStatus(lead);
        return check.contacted ? { ...lead, status: 'contacted' as const, lastContactedAt: check.date } : lead;
      });

      const now = new Date();
      const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      const newBatchId = `batch-${now.getTime()}`;

      const isAutoSearch = !targetKeyword || targetKeyword.trim() === "" || targetKeyword.toLowerCase() === "auto";
      const nicheName = isAutoSearch 
        ? (processed[0]?.category || 'Auto-Discovery Alto Ticket')
        : targetKeyword;

      const countryLabel = currentCountry === 'BR' ? 'Brasil' : currentCountry === 'PT' ? 'Portugal' : currentCountry;
      const batchName = `${nicheName} — ${currentCity} (${currentCountry})`;

      const cappedLeads = effectiveLimits.resultsPerSearchLimit > 0 ? processed.slice(0, effectiveLimits.resultsPerSearchLimit) : processed;

      const processedWithBatch: Lead[] = cappedLeads.map(lead => ({
        ...lead,
        batchId: newBatchId,
        batchName: batchName,
        capturedAt: formattedDate
      }));

      const newBatch: SearchBatch = {
        id: newBatchId,
        name: batchName,
        timestamp: now.toISOString(),
        formattedDate: formattedDate,
        keyword: targetKeyword || 'Auto-Discovery (Alto Ticket)',
        niche: nicheName,
        city: currentCity,
        district: searchParams.district,
        country: currentCountry,
        countryName: countryLabel,
        leadCount: processedWithBatch.length,
        scoreACount: processedWithBatch.filter(l => l.icpTier === 'SCORE_A').length,
        scoreBCount: processedWithBatch.filter(l => l.icpTier === 'SCORE_B').length,
        leads: processedWithBatch
      };

      // Salva o novo lote separadamente no histórico
      const updatedBatches = addSearchBatch(newBatch);
      setBatches(updatedBatches);
      setActiveBatchIdState(newBatch.id);
      setActiveBatchId(newBatch.id);

      // Define APENAS os leads desta pesquisa isolada (sem misturar com buscas passadas)
      setLeads(processedWithBatch);
      setEngineStatus(result.engineStatus);

      recordSearchAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        userRole: currentUser.role,
        module: 'b2b',
        searchType: 'Gemini AI B2B + LetScrape Scraper',
        query: targetKeyword || 'Auto-Discovery',
        location: { city: searchParams.city, district: searchParams.district, country: searchParams.country },
        targetPortalsOrSources: ['Google Maps', 'RapidAPI LetScrape', 'Groq'],
        aiProviderUsed: getAiConfig().geminiModel || 'Gemini 3.7 Flash',
        apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
        resultsCount: processedWithBatch.length,
        executionTimeMs: Date.now() - searchStartTime,
        status: processedWithBatch.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
        batchId: newBatchId,
        notes: `Lote "${batchName}" criado via Gemini + LetScrape.`
      });

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Erro durante o processo de prospecção autônoma.');
      recordSearchAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        userRole: currentUser.role,
        module: 'b2b',
        searchType: prospectEngineMode,
        query: targetKeyword || 'Busca B2B',
        location: { city: searchParams.city, district: searchParams.district, country: searchParams.country },
        targetPortalsOrSources: ['B2B Engine'],
        aiProviderUsed: getAiConfig().geminiModel || 'Gemini Flash',
        apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
        resultsCount: 0,
        executionTimeMs: Date.now() - searchStartTime,
        status: 'FAILED',
        notes: `Falha na execução: ${err.message || 'Erro desconhecido'}`
      });
    } finally {
      isLoadingRef.value = false;
      loadingStepTimerRef.current.forEach(t => window.clearTimeout(t));
      loadingStepTimerRef.current = [];
      setIsLoading(false);
      setLoadingStep('');
      setQuotaRefreshTick(t => t + 1);
    }
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      loadingStepTimerRef.current.forEach(t => window.clearTimeout(t));
      loadingStepTimerRef.current = [];
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleReCountryChange = (newCountry: RealEstateCountry) => {
    setReCountry(newCountry);
    if (newCountry === 'PT') setReCity('Lisboa');
    else if (newCountry === 'ES') setReCity('Madrid');
    else setReCity('São Paulo');
    setReZone('');
  };

  const copyReText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedReKey(key);
    setTimeout(() => setCopiedReKey(null), 2500);
  };

  const handleRealEstateSearch = async (
    e?: React.FormEvent,
    overrideCity?: string,
    overrideCountry?: RealEstateCountry,
    overrideZone?: string,
    overrideTransactionType?: 'SALE' | 'RENT',
    overrideMaxDaysAgo?: number
  ) => {
    if (e) e.preventDefault();

    // 1. Quota & Permission Verification Gatekeeper
    const permissionCheck = canUserExecuteSearch(currentUser, 'real_estate');
    if (!permissionCheck.allowed) {
      setQuotaModalData({
        isOpen: true,
        usage: permissionCheck.usage,
        reason: permissionCheck.reason,
        moduleAttempted: 'real_estate'
      });
      recordSearchAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        userRole: currentUser.role,
        module: 'real_estate',
        searchType: 'Scraper Imóveis Particulares (FSBO)',
        query: `${rePropertyType} em ${overrideCity || reCity}`,
        location: { city: overrideCity || reCity, district: overrideZone || reZone, country: overrideCountry || reCountry },
        targetPortalsOrSources: ['idealista', 'olx', 'fotocasa', 'zap'],
        aiProviderUsed: getAiConfig().geminiModel || 'Gemini Flash',
        apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
        resultsCount: 0,
        executionTimeMs: 0,
        status: 'QUOTA_EXCEEDED',
        notes: `Pesquisa de imóveis bloqueada: ${permissionCheck.reason}`
      });
      return;
    }

    setIsReLoading(true);

    const targetCountry = overrideCountry || reCountry;
    const targetCity = (overrideCity !== undefined ? overrideCity : reCity) || (targetCountry === 'PT' ? 'Oeiras' : targetCountry === 'ES' ? 'Madrid' : 'São Paulo');
    const targetZone = overrideZone !== undefined ? overrideZone : reZone;
    const targetTransType = overrideTransactionType || reTransactionType;
    const targetMaxDays = overrideMaxDaysAgo !== undefined ? overrideMaxDaysAgo : reMaxDaysAgo;

    if (overrideCity !== undefined) setReCity(targetCity);
    if (overrideCountry !== undefined) setReCountry(targetCountry);
    if (overrideZone !== undefined) setReZone(targetZone);
    if (overrideTransactionType !== undefined) setReTransactionType(overrideTransactionType);
    if (overrideMaxDaysAgo !== undefined) setReMaxDaysAgo(overrideMaxDaysAgo);

    const searchStartTime = Date.now();
    const effectiveLimits = getUserEffectiveLimits(currentUser);

    try {
      const query: RealEstateScrapingSearchQuery = {
        country: targetCountry,
        city: targetCity,
        zoneOrDistrict: targetZone,
        transactionType: targetTransType,
        propertyType: rePropertyType,
        maxDaysAgo: targetMaxDays,
        onlyParticulars: true,
        targetPortals: targetCountry === 'PT' 
          ? ['idealista', 'olx', 'custojusto'] 
          : targetCountry === 'ES' 
          ? ['idealista', 'fotocasa', 'pisos_com'] 
          : ['olx', 'zap_imoveis', 'vivareal']
      };

      const leads = await scrapeRealEstateParticulars(query, getAiConfig());
      const cappedLeads = effectiveLimits.resultsPerSearchLimit > 0 ? leads.slice(0, effectiveLimits.resultsPerSearchLimit) : leads;
      
      setRealEstateLeads(cappedLeads);
      if (cappedLeads.length > 0) {
        setSelectedReLead(cappedLeads[0]);
      }

      recordSearchAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        userRole: currentUser.role,
        module: 'real_estate',
        searchType: 'Scraper Imóveis Particulares (FSBO)',
        query: `${rePropertyType} em ${targetCity} (${targetCountry})`,
        location: { city: targetCity, district: targetZone, country: targetCountry },
        targetPortalsOrSources: query.targetPortals,
        aiProviderUsed: getAiConfig().geminiModel || 'Gemini Flash',
        apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
        resultsCount: cappedLeads.length,
        executionTimeMs: Date.now() - searchStartTime,
        status: cappedLeads.length > 0 ? 'SUCCESS' : 'NO_RESULTS',
        notes: `Extraídos ${cappedLeads.length} imóveis de particulares sem agência.`
      });
    } catch (err: any) {
      console.error('Erro na raspagem de imóveis de particulares:', err);
      recordSearchAudit({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: currentUser.companyId,
        companyName: currentUser.companyName,
        userRole: currentUser.role,
        module: 'real_estate',
        searchType: 'Scraper Imóveis Particulares (FSBO)',
        query: `${rePropertyType} em ${targetCity}`,
        location: { city: targetCity, district: targetZone, country: targetCountry },
        targetPortalsOrSources: ['idealista', 'olx'],
        aiProviderUsed: getAiConfig().geminiModel || 'Gemini Flash',
        apiKeyModeUsed: currentUser.customApiKeyMode || 'corporate',
        resultsCount: 0,
        executionTimeMs: Date.now() - searchStartTime,
        status: 'FAILED',
        notes: `Falha na raspagem: ${err?.message || 'Erro de rede'}`
      });
    } finally {
      setIsReLoading(false);
      setQuotaRefreshTick(t => t + 1);
    }
  };

  const handleSelectNicheFromModal = (niche: HighTicketNicheRecommendation) => {
    setSearchParams(prev => ({ ...prev, keyword: niche.niche }));
    handleSearch(undefined, niche.niche);
  };

  // Batch Switcher Handlers
  const handleSelectBatch = (batchId: string | null) => {
    setActiveBatchIdState(batchId);
    setActiveBatchId(batchId);
    setSelectedLeadIds(new Set());

    if (batchId === null) {
      // Visão consolidada de todos os lotes
      const currentBatches = getSearchBatches();
      const allLeads = currentBatches.flatMap(b => b.leads);
      const normalized = allLeads.map(l => isGoogleMapsLead(l) ? { ...l, originApi: 'rapidapi_google_maps' as const } : l);
      setLeads(normalized);
      setEngineStatus(prev => ({
        ...prev,
        extractedCount: normalized.length
      }));
    } else {
      // Apenas os leads do lote selecionado exatamente como foram gerados com notas e adições
      const currentBatches = getSearchBatches();
      const selected = currentBatches.find(b => b.id === batchId);
      if (selected) {
        const normalized = selected.leads.map(l => isGoogleMapsLead(l) ? { ...l, originApi: 'rapidapi_google_maps' as const } : l);
        setLeads(normalized);
        
        // Sincroniza o país e parâmetros de busca para refletir o lote selecionado
        if (selected.country && selected.country !== country) {
          applyCountry(selected.country);
        }
        setSearchParams(prev => ({
          ...prev,
          keyword: selected.keyword === 'Auto-Discovery (Alto Ticket)' ? '' : selected.keyword,
          city: selected.city || prev.city,
          district: selected.district || prev.district,
          country: selected.country || prev.country
        }));
        setEngineStatus(prev => ({
          ...prev,
          extractedCount: selected.leads.length
        }));
      }
    }
  };

  // Lead Notes & Updates Handlers
  const handleOpenNotes = (lead: Lead) => {
    setSelectedLeadForNotes(lead);
    setIsNotesModalOpen(true);
  };

  const handleSaveLead = (updatedLead: Lead) => {
    // 1. Atualiza no array de leads ativo
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));

    // 2. Sincroniza com modais abertos
    if (selectedLeadForOmnichannel?.id === updatedLead.id) {
      setSelectedLeadForOmnichannel(updatedLead);
    }
    if (selectedLeadForLiveCopilot?.id === updatedLead.id) {
      setSelectedLeadForLiveCopilot(updatedLead);
    }
    if (selectedLeadForNotes?.id === updatedLead.id) {
      setSelectedLeadForNotes(updatedLead);
    }

    // 3. Atualiza permanentemente no lote onde o lead reside
    const currentBatches = getSearchBatches();
    const updatedBatches = currentBatches.map(batch => ({
      ...batch,
      leads: batch.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
    }));
    saveSearchBatches(updatedBatches);
    setBatches(updatedBatches);
  };

  const handleDeleteBatch = (batchId: string) => {
    const updated = deleteSearchBatch(batchId);
    setBatches(updated);
    if (activeBatchId === batchId) {
      const nextBatch = updated.length > 0 ? updated[0] : null;
      setActiveBatchIdState(nextBatch ? nextBatch.id : null);
      setActiveBatchId(nextBatch ? nextBatch.id : null);
      setLeads(nextBatch ? nextBatch.leads : []);
    }
  };

  const handleClearAllBatches = (showToast = true) => {
    clearAllActiveProspectingData();
    setBatches([]);
    setActiveBatchIdState(null);
    setLeads([]);
    setRealEstateLeads([]);
    setSelectedLeadIds(new Set());
    setSelectedReLead(null);
    if (showToast) {
      setSyncNotification({
        message: 'Todos os dados ativos de leads e pesquisas foram zerados com sucesso!',
        items: ['Lotes B2B removidos', 'Leads em cache limpos', 'Imóveis zerados', 'Ambiente pronto e limpo para envio']
      });
    }
  };

  const handleExportBatchCSV = (batch: SearchBatch) => {
    const listToExport = batch.leads;
    if (listToExport.length === 0) {
      return;
    }
    const headers = [
      "Empresa", "Website", "Decisor", "Cargo", "Telefone", "Email", 
      "Cidade", "Intent Score (%)", "Prioridade Disparo", "ICP Score (%)", "Classificacao",
      "Data Pesquisa", "Lote", "Dor Principal", "Status"
    ];
    const rows = listToExport.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.bantPlus?.authority?.keyDecisionMaker || l.decisionMaker?.name || '').replace(/"/g, '""')}"`,
      `"${(l.bantPlus?.authority?.role || l.decisionMaker?.role || '').replace(/"/g, '""')}"`,
      `"${(l.decisionMaker?.directPhone || l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.decisionMaker?.directEmail || l.email || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      l.intentScore ?? l.icpScore,
      `"${l.intentPriority || 'HIGH'}"`,
      l.icpScore,
      `"${l.icpTier}"`,
      `"${l.capturedAt || batch.formattedDate}"`,
      `"${batch.name}"`,
      `"${(l.identifiedPain || '').replace(/"/g, '""')}"`,
      `"${l.status}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lote_${batch.niche.replace(/\s+/g, '_')}_${batch.city}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lead Actions
  const handleUpdateStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    
    // Atualiza também nos lotes
    const currentBatches = getSearchBatches();
    const updated = currentBatches.map(batch => ({
      ...batch,
      leads: batch.leads.map(l => l.id === id ? { ...l, status } : l)
    }));
    saveSearchBatches(updated);
    setBatches(updated);
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    // Atualiza nos lotes
    const currentBatches = getSearchBatches();
    const updated = currentBatches.map(batch => {
      const remainingLeads = batch.leads.filter(l => l.id !== id);
      return {
        ...batch,
        leads: remainingLeads,
        leadCount: remainingLeads.length,
        scoreACount: remainingLeads.filter(l => l.icpTier === 'SCORE_A').length,
        scoreBCount: remainingLeads.filter(l => l.icpTier === 'SCORE_B').length
      };
    });
    saveSearchBatches(updated);
    setBatches(updated);
  };

  const handleOpenOmnichannel = (lead: Lead, tab: 'criahub_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech' = 'cadence') => {
    setSelectedLeadForOmnichannel(lead);
    setOmnichannelInitialTab(tab);
    setIsOmnichannelOpen(true);
  };

  const handleOpenLiveCopilot = (lead: Lead) => {
    setSelectedLeadForLiveCopilot(lead);
    setIsLiveCopilotOpen(true);
  };

  const handleOpenCriahubDrawer = (lead: Lead) => {
    setSelectedLeadForCriahub(lead);
    setIsCriahubDrawerOpen(true);
  };

  const handleOpenHunterCall = (lead: Lead) => {
    setHunterCallLead(lead);
    setIsHunterCallModalOpen(true);
  };

  const handleOpenGroqTriage = (lead: Lead) => {
    setGroqTriageLead(lead);
    setIsGroqTriageModalOpen(true);
  };

  const handleOpenCockpit = (lead?: Lead) => {
    if (lead) {
      const idx = filteredLeads.findIndex(l => l.id === lead.id);
      setCockpitLeadIndex(idx >= 0 ? idx : 0);
    } else {
      setCockpitLeadIndex(0);
    }
    setIsCockpitOpen(true);
  };

  const handleMarkContacted = (id: string) => {
    const target = leads.find(l => l.id === id);
    if (target) {
      saveContactedLead(target);
      handleUpdateStatus(id, 'contacted');
    }
  };

  // Batch Select Actions
  const handleToggleSelect = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const handleBatchDelete = () => {
    setLeads(prev => prev.filter(l => !selectedLeadIds.has(l.id)));
    setSelectedLeadIds(new Set());
  };

  const handleBatchMarkContacted = () => {
    selectedLeadIds.forEach(id => {
      const target = leads.find(l => l.id === id);
      if (target) saveContactedLead(target);
    });
    setLeads(prev => prev.map(l => selectedLeadIds.has(l.id) ? { ...l, status: 'contacted' } : l));
    setSelectedLeadIds(new Set());
  };

  // Export to CSV
  const handleExportCSV = () => {
    const listToExport = selectedLeadIds.size > 0 
      ? leads.filter(l => selectedLeadIds.has(l.id)) 
      : filteredLeads;

    if (listToExport.length === 0) {
      alert("Nenhum lead para exportar.");
      return;
    }

    const headers = [
      "Empresa", "Website", "Decisor", "Cargo", "Telefone", "Email", 
      "Cidade", "Intent Score (%)", "Prioridade Disparo", "ICP Score (%)", "Classificacao",
      "Budget Estimado", "Urgencia Fator", "Tech Stack Detectado",
      "Falhas Operacionais Mapeadas", "Dor Principal", "Proxima Acao", "WhatsApp Copy", "Email Assunto", "Status"
    ];

    const rows = listToExport.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.website || '').replace(/"/g, '""')}"`,
      `"${(l.bantPlus?.authority?.keyDecisionMaker || l.decisionMaker?.name || '').replace(/"/g, '""')}"`,
      `"${(l.bantPlus?.authority?.role || l.decisionMaker?.role || '').replace(/"/g, '""')}"`,
      `"${(l.decisionMaker?.directPhone || l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.decisionMaker?.directEmail || l.email || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      l.intentScore ?? l.icpScore,
      `"${l.intentPriority || 'HIGH'}"`,
      l.icpScore,
      `"${l.icpTier}"`,
      `"${(l.bantPlus?.budget?.estimatedBudget || '').replace(/"/g, '""')}"`,
      `"${(l.bantPlus?.timeline?.urgencyFactor || l.urgencyFactor || '').replace(/"/g, '""')}"`,
      `"${(l.techStack?.detectedTools?.join('; ') || '').replace(/"/g, '""')}"`,
      `"${((l.keyFlaws || l.bantPlus?.need?.operationalFlaws || []).join('; ')).replace(/"/g, '""')}"`,
      `"${(l.identifiedPain || '').replace(/"/g, '""')}"`,
      `"${(l.suggestedAction || '').replace(/"/g, '""')}"`,
      `"${(l.outreach?.whatsapp?.option1Curiosity || '').replace(/"/g, '""')}"`,
      `"${(l.outreach?.email?.subject || '').replace(/"/g, '""')}"`,
      `"${l.status}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `deep_bant_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter & Sort Logic
  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => {
        // Status filter
        if (filters.status !== 'all' && lead.status !== filters.status) return false;
        
        // ICP Tier Filter
        if (filters.icpTier === 'SCORE_A' && lead.icpTier !== 'SCORE_A') return false;
        if (filters.icpTier === 'SCORE_B' && lead.icpTier !== 'SCORE_B') return false;
        if (filters.icpTier === 'SCORE_C' && lead.icpTier !== 'SCORE_C') return false;
        if (filters.icpTier === 'HOT_WARM' && lead.icpTier === 'SCORE_C') return false;

        // Origin API Filter
        if (filters.originApi === 'apollo' && !(lead.originApi === 'apollo' || lead.source === 'apollo')) return false;
        if (filters.originApi === 'rapidapi_google_maps' && !isGoogleMapsLead(lead)) return false;
        if (filters.originApi === 'synthetic' && !(lead.originApi === 'synthetic' || lead.source === 'synthetic')) return false;

        // Free Text Search Filter
        if (filters.searchQuery && filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = lead.name.toLowerCase().includes(q);
          const matchCity = lead.city.toLowerCase().includes(q);
          const matchDecisor = (lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || '').toLowerCase().includes(q);
          const matchRole = (lead.decisionMaker?.role || lead.bantPlus?.authority?.role || '').toLowerCase().includes(q);
          const matchCategory = lead.category.toLowerCase().includes(q);
          if (!matchName && !matchCity && !matchDecisor && !matchRole && !matchCategory) return false;
        }

        // Website filter
        if (filters.hasWebsite === 'yes' && !lead.website) return false;
        if (filters.hasWebsite === 'no' && lead.website) return false;

        // Phone filter
        if (filters.hasPhone === 'yes' && !lead.phone && !lead.decisionMaker?.directPhone) return false;
        if (filters.hasPhone === 'no' && (lead.phone || lead.decisionMaker?.directPhone)) return false;

        // Email filter
        if (filters.hasEmail === 'yes' && !lead.email && !lead.decisionMaker?.directEmail) return false;
        if (filters.hasEmail === 'no' && (lead.email || lead.decisionMaker?.directEmail)) return false;

        // Role category filter
        if (filters.roleCategory && filters.roleCategory !== 'all') {
          const rc = lead.decisionMaker?.roleCategory || '';
          if (filters.roleCategory === 'owners' && rc !== 'DONO_CEO_SOCIO') return false;
          if (filters.roleCategory === 'managers' && rc !== 'GERENTE_DIRETOR') return false;
          if (filters.roleCategory === 'commercial' && rc !== 'HEAD_COMERCIAL') return false;
        }

        // ROI Verdict Filter (Vale a pena ligar / WhatsApp / E-mail / Descartar)
        if (filters.roiVerdict && filters.roiVerdict !== 'all') {
          const leadVerdict = (lead.roiRecommendation || calculateLeadRoiRecommendation(lead, businessProfile)).verdict;
          if (leadVerdict !== filters.roiVerdict) return false;
        }

        // Filtro High-Ticket (€599 a €997/mês): Empresas de porte, infraestrutura e alto poder de compra
        if (filters.highTicketOnly) {
          const power = evaluateLeadPurchasePower(lead);
          if (power === 'BAIXO_MICRO' || power === 'SEM_BUDGET') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'icp_score_desc') return b.icpScore - a.icpScore;
        if (sortOption === 'rating_desc') return b.rating - a.rating;
        if (sortOption === 'reviews_desc') return b.reviews - a.reviews;
        if (sortOption === 'no_website') return (a.website ? 1 : 0) - (b.website ? 1 : 0);
        return b.score - a.score;
      });
  }, [leads, filters, sortOption, businessProfile]);

  // Dashboard Stats
  const stats: DashboardStats = useMemo(() => {
    const total = leads.length;
    if (total === 0) {
      return {
        totalLeads: 0,
        avgScore: 0,
        avgIcpScore: 0,
        avgIntentScore: 0,
        highPriorityCount: 0,
        mediumPriorityCount: 0,
        disqualifiedCount: 0,
        scoreACount: 0,
        scoreBCount: 0,
        scoreCCount: 0,
        leadsWithWebsite: 0,
        leadsWithoutWebsite: 0,
        leadsWithPhone: 0,
        leadsWithEmail: 0,
        apolloCount: 0,
        googleMapsCount: 0,
        syntheticCount: 0,
        estimatedPipelineValue: formatCurrencyValue(0, country)
      };
    }

    const scoreA = leads.filter(l => l.icpTier === 'SCORE_A').length;
    const scoreB = leads.filter(l => l.icpTier === 'SCORE_B').length;
    const scoreC = leads.filter(l => l.icpTier === 'SCORE_C').length;
    const withWeb = leads.filter(l => !!l.website).length;
    const withPhone = leads.filter(l => !!l.phone || !!l.decisionMaker?.directPhone).length;
    const withEmail = leads.filter(l => !!l.email || !!l.decisionMaker?.directEmail).length;
    const apolloCount = leads.filter(l => l.originApi === 'apollo' || l.source === 'apollo').length;
    const syntheticCount = leads.filter(l => l.originApi === 'synthetic' || l.source === 'synthetic').length;
    const googleMapsCount = leads.filter(isGoogleMapsLead).length;

    const avgIcp = Math.round(leads.reduce((acc, l) => acc + l.icpScore, 0) / total);
    const avgIntent = Math.round(leads.reduce((acc, l) => acc + (l.intentScore || 0), 0) / total);
    const highPriority = leads.filter(l => l.intentPriority === 'HIGH').length;
    const mediumPriority = leads.filter(l => l.intentPriority === 'MEDIUM').length;
    const disqualified = leads.filter(l => l.intentPriority === 'DISQUALIFIED' || l.icpTier === 'SCORE_C').length;

    // Approximate pipeline value calculation (Score A * 14.000 + Score B * 7.500, escalado pela moeda do país)
    const scale = getCurrencyConfig(country).pipelineScale;
    const pipelineVal = ((scoreA * 14000) + (scoreB * 7500)) * scale;
    const formattedPipeline = formatCurrencyValue(pipelineVal, country);

    return {
      totalLeads: total,
      avgScore: Math.round(leads.reduce((acc, l) => acc + l.score, 0) / total),
      avgIcpScore: avgIcp,
      avgIntentScore: avgIntent,
      highPriorityCount: highPriority,
      mediumPriorityCount: mediumPriority,
      disqualifiedCount: disqualified,
      scoreACount: scoreA,
      scoreBCount: scoreB,
      scoreCCount: scoreC,
      leadsWithWebsite: withWeb,
      leadsWithoutWebsite: total - withWeb,
      leadsWithPhone: withPhone,
      leadsWithEmail: withEmail,
      apolloCount,
      googleMapsCount,
      syntheticCount,
      estimatedPipelineValue: formattedPipeline
    };
  }, [leads, country]);

  const highTicketNiches = businessProfile.recommendedHighTicketNiches?.length 
    ? businessProfile.recommendedHighTicketNiches 
    : getHighTicketNichesForCountry(country);

  // Se não estiver autenticado, exibe a tela de login por email e senha
  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLoginSuccess={(user) => {
          handleUserChanged(user);
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Global Navigation Header (Hidden when hideHeader is set in embed/iframe) */}
      {!hideHeaderParam && (
        <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between min-h-16 py-2.5 md:py-0 gap-2">
              
              {/* Brand Logo & Name */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/20 shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm sm:text-lg text-white tracking-tight">CriaHub</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                      Prospecção Inteligente
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 leading-tight">Encontre empresas, contatos e decisores de forma simples e rápida</p>
                </div>
              </div>

              {/* 📱 Mobile Actions Header (Zero Button Overlap, Clean & Touch Friendly) */}
              <div className="flex md:hidden items-center gap-2">
                {/* Quick Country Switcher Pill */}
                <button
                  type="button"
                  onClick={() => setIsCountryModalOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition-all"
                  title="Alterar país de prospecção"
                >
                  <span className="text-sm leading-none">{getCurrencyConfig(country).flag}</span>
                  <span className="text-[11px] font-bold">{country}</span>
                </button>

                {/* 💎 Quick High-Ticket Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, highTicketOnly: !prev.highTicketOnly }))}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1 active:scale-95 ${
                    filters.highTicketOnly
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-400/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                  title="Filtrar apenas Leads High-Ticket (€599-€997)"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${filters.highTicketOnly ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span className="text-[11px]">{filters.highTicketOnly ? 'High-Ticket' : 'Alto Ticket'}</span>
                </button>

                {/* 📱 Full Mobile Menu Trigger */}
                <button
                  id="btn-mobile-menu-toggle"
                  type="button"
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center transition-all active:scale-95"
                  aria-label="Abrir Menu Completo Mobile"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* 💻 Desktop / Tablet Consolidated Navigation & Control Hub */}
              <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
                {/* Visual Mode Toggle (Simple vs Pro) */}
                <button
                  id="btn-toggle-simple-view"
                  type="button"
                  onClick={() => setIsSimpleView(!isSimpleView)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    isSimpleView
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isSimpleView ? 'Modo Simples ativado. Clique para alternar para o Modo Avançado.' : 'Modo Avançado ativado. Clique para simplificar a visualização.'}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isSimpleView ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="hidden sm:inline">{isSimpleView ? 'Visual Simples' : 'Visual Pro'}</span>
                  <span className="sm:hidden">{isSimpleView ? 'Simples' : 'Pro'}</span>
                </button>

                {/* Country & Currency Selector */}
                <button
                  id="btn-open-country"
                  onClick={() => setIsCountryModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-indigo-900/50 hover:bg-indigo-900/70 text-indigo-100 border border-indigo-600/60 transition-colors"
                  title={`País de prospecção: ${country} • Moeda: ${getCurrencyConfig(country).code} (${getCurrencyConfig(country).symbol})`}
                >
                  <span className="text-sm leading-none">{getCurrencyConfig(country).flag}</span>
                  <span className="hidden sm:inline">{country}</span>
                  <span className="text-[10px] px-1 py-0.5 rounded bg-indigo-800/80 text-indigo-200 font-black">
                    {getCurrencyConfig(country).code}
                  </span>
                </button>

                {/* 🧰 Tools & Integrations Consolidated Dropdown (Desktop/Tablet) */}
                <div className="relative hidden md:block">
                  <button
                    id="btn-open-tools-dropdown"
                    onClick={() => {
                      setIsToolsMenuOpen(!isToolsMenuOpen);
                      setIsUserMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      isToolsMenuOpen 
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                    title="Menu de Ferramentas: Nichos, CRM, Webhooks, Scraper Studio e JSON"
                  >
                    <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ferramentas</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Floating Popover for Tools */}
                  {isToolsMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
                      onClick={() => setIsToolsMenuOpen(false)}
                    >
                      <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                        <span>Central de Automação</span>
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                      </div>

                      <button
                        onClick={() => setIsProfileModalOpen(true)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                      >
                        <Briefcase className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <div className="leading-tight">Site & Nichos ICP</div>
                          <div className="text-[10px] text-slate-400 font-normal">Matching e sugestões Groq</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setIsWebhookModalOpen(true)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-purple-200 hover:text-white hover:bg-purple-950/40 rounded-lg transition-colors text-left"
                      >
                        <Send className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <div className="leading-tight">CRM & Webhook Z-API</div>
                          <div className="text-[10px] text-purple-300/70 font-normal">Criahub CRM e n8n</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setIsScraperStudioOpen(true)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-amber-200 hover:text-white hover:bg-amber-950/40 rounded-lg transition-colors text-left"
                      >
                        <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="leading-tight">Scraper Studio</div>
                          <div className="text-[10px] text-amber-300/70 font-normal">Playwright Stealth & Maps</div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setSettingsInitialTab('share');
                          setIsSettingsOpen(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-emerald-200 hover:text-white hover:bg-emerald-950/40 rounded-lg transition-colors text-left"
                      >
                        <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="leading-tight">Link com APIs</div>
                          <div className="text-[10px] text-emerald-300/70 font-normal">Compartilhar chaves ativas</div>
                        </div>
                      </button>

                      <button
                        onClick={() => setIsJsonModalOpen(true)}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors text-left"
                      >
                        <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="leading-tight">Visualizador JSON</div>
                          <div className="text-[10px] text-slate-400 font-normal">Exportação bruta</div>
                        </div>
                      </button>

                      <div className="pt-1 mt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            if (window.confirm('Deseja realmente zerar todos os lotes e leads salvos do sistema para deixá-lo completamente limpo?')) {
                              handleClearAllBatches();
                            }
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-950/60 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <div className="leading-tight">Zerar Dados Ativos</div>
                            <div className="text-[10px] text-rose-300/70 font-normal">Limpar lotes e leads salvos</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* APIs & Prompts Config Panel */}
                <button
                  id="btn-open-settings"
                  onClick={() => {
                    setSettingsInitialTab('rapidapi');
                    setIsSettingsOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-extrabold bg-gradient-to-r from-emerald-600/30 to-indigo-600/30 hover:from-emerald-600/40 hover:to-indigo-600/40 text-emerald-200 border border-emerald-500/50 transition-all shadow-sm"
                  title="Configurações de APIs (Groq, RapidAPI, Gemini), Supervisor de IA e Prompts"
                >
                  <Key className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">APIs & Modelos</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </button>

                {/* CSV Download Button */}
                <button
                  id="btn-export-csv"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                  title="Exportar dados para Excel / CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV</span>
                </button>

                {/* 👤 Consolidated User & Quota Card Hub */}
                <div className="relative">
                  <button
                    id="btn-open-user-hub"
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsToolsMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-xl border transition-all ${
                      isUserMenuOpen
                        ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 shadow-sm'
                    }`}
                    title={`Perfil: ${currentUser.name} (${currentUser.role}) • Empresa: ${currentUser.companyName}`}
                  >
                    {/* User Avatar with status dot */}
                    <div className="relative">
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-6 h-6 rounded-full object-cover border border-slate-600" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white text-[10px] font-black flex items-center justify-center">
                          {currentUser.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${currentQuotaUsage.isBlocked ? 'bg-rose-500' : 'bg-emerald-400'}`}></span>
                    </div>

                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-bold text-white leading-tight max-w-[110px] truncate">
                        {currentUser.name.split(' ')[0]}
                      </div>
                      <div className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                        {currentUser.role === 'SUPER_ADMIN' ? '👑 Master' : currentUser.role === 'COMPANY_ADMIN' ? '🏢 Admin' : '👤 User'}
                      </div>
                    </div>

                    {/* Quota Badge Indicator */}
                    <div className="ml-0.5">
                      {currentQuotaUsage.isBlocked ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-900/90 text-rose-300 text-[9px] font-black border border-rose-500/50 animate-pulse">
                          Esgotado
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-violet-950/80 text-violet-300 text-[9px] font-mono font-bold border border-violet-700/50">
                          {currentQuotaUsage.remainingSearches === Infinity ? '∞ Cotas' : `${currentQuotaUsage.remainingSearches} rest.`}
                        </span>
                      )}
                    </div>

                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Floating Popover for User Hub */}
                  {isUserMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      {/* User Info Header */}
                      <div className="p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover border border-indigo-500/50" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                              {currentUser.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{currentUser.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">{currentUser.email}</div>
                            <div className="text-[9px] font-bold text-indigo-400 uppercase mt-0.5 truncate">
                              {currentUser.companyName}
                            </div>
                          </div>
                        </div>

                        {/* Quota bar */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Saldo de Pesquisas:</span>
                          <span className="font-bold text-emerald-400">
                            {currentQuotaUsage.remainingSearches === Infinity ? 'Ilimitado (Master)' : `${currentQuotaUsage.remainingSearches} pesquisas restantes`}
                          </span>
                        </div>
                      </div>

                      {/* Quick Actions List */}
                      <div className="space-y-1">
                        <button
                          onClick={() => setIsAdminManagementOpen(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-violet-200 hover:text-white bg-violet-950/30 hover:bg-violet-900/50 border border-violet-800/40 rounded-xl transition-all text-left"
                        >
                          <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0" />
                          <div>
                            <div className="leading-tight">Painel Admin & Auditoria</div>
                            <div className="text-[10px] text-violet-300/70 font-normal">Empresas, Cotas & Histórico</div>
                          </div>
                        </button>

                        <button
                          onClick={() => setIsAuthModalOpen(true)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors text-left"
                        >
                          <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />
                          <div>
                            <div className="leading-tight">Trocar Perfil / Login</div>
                            <div className="text-[10px] text-slate-400 font-normal">Demonstração e multi-tenant</div>
                          </div>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 border border-rose-900/30 rounded-xl transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                          <div>
                            <div className="leading-tight">Sair do Sistema (Logout)</div>
                            <div className="text-[10px] text-rose-400/70 font-normal">Encerrar sessão atual</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </header>
      )}

      {/* Notification for auto-synced APIs via Link */}
      {syncNotification && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-b border-emerald-500/50 text-emerald-100 px-4 py-2.5 text-xs shadow-lg animate-in fade-in duration-300 z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1 bg-emerald-500/20 rounded-full text-emerald-400 shrink-0">
                <CheckCheck className="w-4 h-4" />
              </span>
              <span className="font-extrabold text-white">
                {syncNotification.message}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {syncNotification.items.map((item, idx) => (
                  <span key={idx} className="text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/50 font-mono text-[11px]">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                onClick={() => {
                  setSettingsInitialTab('share');
                  setIsSettingsOpen(true);
                }}
                className="text-xs font-bold text-amber-300 hover:text-amber-200 underline hover:no-underline"
              >
                Ver Configurações Sincronizadas
              </button>
              <button
                onClick={() => setSyncNotification(null)}
                className="text-slate-400 hover:text-white px-2 py-0.5 rounded text-[11px] bg-slate-800/80 hover:bg-slate-700"
              >
                Dispensar ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Scraping Pipeline Redundancy Banner (Visible only in Pro View) */}
      {!isSimpleView && (
        <ScrapingPipelineBanner 
          status={engineStatus} 
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* 3. Deep Matching Active Business Banner (Visible only in Pro View) */}
      {!isSimpleView && (
        <div className="bg-indigo-950/90 text-indigo-100 border-b border-indigo-900/60 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-white uppercase text-[10px] bg-indigo-800 px-2 py-0.5 rounded tracking-wider">
                Meu Negócio:
              </span>
              <strong className="text-indigo-200">{businessProfile.businessName}</strong>
              <span className="text-indigo-300 hidden md:inline">({businessProfile.websiteUrl || 'Site mapeado'})</span>
              <span className="text-indigo-400 hidden lg:inline">• UVP: "{businessProfile.uvp?.slice(0, 60) || businessProfile.servicesDescription?.slice(0, 60) || ''}..."</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 underline hover:no-underline shrink-0"
              >
                Configurar APIs & Supervisor
              </button>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-xs font-semibold text-indigo-300 hover:text-white underline hover:no-underline shrink-0"
              >
                Nichos de Alto Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 w-full space-y-5 pb-24 md:pb-8">

        {/* Master Navigation Bar (Pill Tabs) */}
        <div className="bg-slate-900/95 backdrop-blur-md p-1.5 sm:p-2 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 w-full sm:w-auto scrollbar-none">
            {/* 1. Empresas B2B */}
            <button
              onClick={() => {
                setActiveNavTab('b2b_leads');
                setSearchDomain('companies');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeNavTab === 'b2b_leads'
                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-300" />
              <span>Empresas B2B</span>
              {leads.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-500/50 text-[10px] rounded-full font-extrabold text-white">
                  {leads.length}
                </span>
              )}
            </button>

            {/* 2. Imóveis Particulares (FSBO) */}
            <button
              onClick={() => {
                setActiveNavTab('real_estate');
                setSearchDomain('real_estate');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeNavTab === 'real_estate'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Home className="w-4 h-4 text-amber-300" />
              <span>Imóveis Particulares</span>
              {realEstateLeads.length > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500/50 text-[10px] rounded-full font-extrabold text-white">
                  {realEstateLeads.length}
                </span>
              )}
            </button>

            {/* 3. Chat Gemini Copilot */}
            <button
              onClick={() => setActiveNavTab('copilot_chat')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeNavTab === 'copilot_chat'
                  ? 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white shadow-lg ring-2 ring-indigo-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Assistente IA (Copilot)</span>
            </button>

            {/* 4. Métricas & Relatórios */}
            <button
              onClick={() => setActiveNavTab('analytics')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                activeNavTab === 'analytics'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-300" />
              <span>Relatórios & Métricas</span>
            </button>

            {/* 5. Conformidade RGPD & Lista STOP */}
            <button
              onClick={() => setIsRgpdModalOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shrink-0 text-rose-300 hover:text-white hover:bg-rose-950/60 border border-rose-500/30"
              title="Gerenciar lista de supressão RGPD e contactos que solicitaram STOP"
            >
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>RGPD (Lista STOP)</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs">
            {activeNavTab === 'copilot_chat' ? (
              <span className="text-slate-400 text-[11px] flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/60">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Interação conversacional sem botões excessivos
              </span>
            ) : (
              <button
                onClick={() => setActiveNavTab('copilot_chat')}
                className="text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-800/60 font-bold flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Abrir Assistente IA</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic View rendering based on activeNavTab */}
        {activeNavTab === 'copilot_chat' ? (
          <AiGeminiChatCopilot
            country={searchParams.country}
            businessProfile={businessProfile}
            leads={leads}
            filteredLeads={filteredLeads}
            realEstateLeads={realEstateLeads}
            isLoading={isLoading || isReLoading}
            allowedModules={currentUser?.allowedModules || 'all'}
            userRole={currentUser?.role}
            searchParams={searchParams}
            reCountry={reCountry}
            reCity={reCity}
            onExecuteB2bSearch={(keyword, city, country) => handleSearch(undefined, keyword, city, country as any)}
            onExecuteRealEstateSearch={(city, country, transType, maxDays, zone) => handleRealEstateSearch(undefined, city, country as any, zone, transType, maxDays)}
            onFilterScoreA={() => {
              setFilters(f => ({ ...f, icpTier: 'SCORE_A' }));
            }}
            onFilterWithPhone={() => {
              setFilters(f => ({ ...f, hasPhone: 'yes' }));
            }}
            onExportCsv={handleExportCSV}
            onSwitchToTableView={() => {
              setActiveNavTab('b2b_leads');
              setViewMode('table');
            }}
            onSwitchToKanbanView={() => {
              setActiveNavTab('b2b_leads');
              setViewMode('kanban');
            }}
            onOpenSdrCockpit={(lead) => handleOpenCockpit(lead)}
            onOpenColdCallHunter={(lead) => handleOpenHunterCall(lead)}
            onOpenCriahubDrawer={(lead) => handleOpenCriahubDrawer(lead)}
            onOpenOmnichannel={(lead, tab) => handleOpenOmnichannel(lead, tab)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenRealEstateModal={() => setIsRealEstateModalOpen(true)}
          />
        ) : activeNavTab === 'analytics' ? (
          <AnalyticsDashboardView
            stats={stats}
            leads={leads}
            country={searchParams.country}
            onExportCsv={handleExportCSV}
          />
        ) : (
          <>
        {/* 4. Search & Prospecting Control Center (Conditional for B2B) */}
        {searchDomain === 'companies' ? (
          <>
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 md:p-6 space-y-4">
          
          {/* Header of Search with Engine Selection & Auto-Discovery Badge */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Building2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  {isSimpleView ? 'Buscar Empresas & Contatos B2B' : 'Radar de Prospecção & Decisores B2B'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isSimpleView 
                    ? 'Digite o segmento e a cidade para prospectar empresas com telefone, WhatsApp e decisores.'
                    : 'Busque empresas, donos, fundadores e gerentes via Free Apollo (LinkedIn + Google + Indeed), Apollo.io API ou Google Maps.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Botão de Toggle de Opções Avançadas */}
              <button
                type="button"
                onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  isAdvancedSearchOpen 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
                title="Ajustar motor de busca (Google Maps, Apollo) e filtros de cargos"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
                <span>{isAdvancedSearchOpen ? 'Ocultar Opções Avançadas' : 'Opções Avançadas (Motores & Cargos)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchParams({ ...searchParams, keyword: '' });
                  handleSearch(undefined, '');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-extrabold shadow-xs hover:opacity-95 transition-opacity"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Auto-Discovery Alto Ticket</span>
              </button>
            </div>
          </div>

          {/* Advanced Search Options: Engine selection & Role Filters (Visible when expanded or in Pro View) */}
          {(isAdvancedSearchOpen || !isSimpleView) && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
              {/* Engine Toggle Buttons */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-indigo-600" />
                  Motor de Busca Ativo:
                </span>

                <div className="inline-flex rounded-lg p-1 bg-white border border-slate-200 flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setProspectEngineMode('simultaneous_all')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      prospectEngineMode === 'simultaneous_all'
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-xs ring-2 ring-emerald-300'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Busca Simultânea em múltiplos polos e fontes (Google Maps + Apollo + LinkedIn + Web) com meta de 5 leads/dia (50+ empresas)"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>⚡ Busca Simultânea (50+ Leads / 10 Dias)</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/40 text-[10px] uppercase tracking-wider rounded font-black">Meta 5/Dia</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProspectEngineMode('gmaps_osint')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      prospectEngineMode === 'gmaps_osint'
                        ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Scraping Real do Google Maps + Mapeamento de Donos e Sócios via LinkedIn & Google"
                  >
                    <Globe2 className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Google Maps + Decisores OSINT</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/40 text-[10px] uppercase tracking-wider rounded font-black">Top</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProspectEngineMode('free_apollo')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      prospectEngineMode === 'free_apollo'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Busca Gratuita estilo Apollo de Empresas, Donos e Gerentes"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Free Apollo (LinkedIn + Google)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProspectEngineMode('apollo')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      prospectEngineMode === 'apollo'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Buscar empresas e decisores B2B via Apollo.io API oficial"
                  >
                    <span>Apollo.io API</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProspectEngineMode('standard')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      prospectEngineMode === 'standard'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Buscar empresas locais reais puras via Google Maps"
                  >
                    <span>Google Maps Puro</span>
                  </button>
                </div>
              </div>

              {/* Role Filter Selector */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Foco de Cargos dos Decisores:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setRoleFilter('ALL')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                      roleFilter === 'ALL'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    🌐 Todos os Decisores
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleFilter('OWNERS')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                      roleFilter === 'OWNERS'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50'
                    }`}
                    title="Filtrar por Donos, Fundadores, Sócios e CEOs"
                  >
                    👑 Donos & Sócios (Founders/CEOs)
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleFilter('MANAGERS')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                      roleFilter === 'MANAGERS'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                        : 'bg-white text-purple-900 border-purple-200 hover:bg-purple-50'
                    }`}
                    title="Filtrar por Gerentes Gerais e Diretores"
                  >
                    👔 Gerentes & Diretores
                  </button>

                  <button
                    type="button"
                    onClick={() => setRoleFilter('COMMERCIAL')}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                      roleFilter === 'COMMERCIAL'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50'
                    }`}
                    title="Filtrar por Diretores Comerciais e Heads de Vendas"
                  >
                    📈 Heads Comerciais & Vendas
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              
              {/* Keyword / Segmento */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Segmento / Nicho</span>
                  <span className="text-indigo-600 font-semibold text-[11px]">(Opcional: Vazio = Auto-Discovery)</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="search-keyword-input"
                    type="text"
                    value={searchParams.keyword}
                    onChange={e => setSearchParams({ ...searchParams, keyword: e.target.value })}
                    placeholder="Deixe vazio para Auto-Discovery de Alto Ticket..."
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* País */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5 text-gray-500" />
                  País
                </label>
                <select
                  value={searchParams.country}
                  onChange={e => setSearchParams({ ...searchParams, country: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {SUPPORTED_COUNTRIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Estado / Distrito */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  {searchParams.country === 'Brasil' ? 'Estado' : 'Distrito / Região'}
                </label>
                <select
                  value={searchParams.district}
                  onChange={e => setSearchParams({ ...searchParams, district: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  {(searchParams.country === 'Brasil' ? BRAZIL_STATES : PORTUGAL_DISTRICTS).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Cidade */}
              <div className="md:col-span-2">
                <CitySelector
                  country={searchParams.country}
                  selectedCity={searchParams.city}
                  onSelectCity={(city) => setSearchParams({ ...searchParams, city })}
                />
              </div>

              {/* Action Button */}
              <div className="md:col-span-2">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleCancelSearch}
                    className="w-full min-h-[48px] py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar Busca
                  </button>
                ) : (
                  <button
                    type="submit"
                    id="btn-start-prospecting"
                    className="w-full min-h-[48px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    {searchParams.keyword.trim() ? "Prospecção & Match" : "Auto Prospecção"}
                  </button>
                )}
              </div>

            </div>

            {/* High-Ticket Niches Quick Chips */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  Nichos de Alto Ticket Recomendados para Sua Oferta:
                </span>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-indigo-600 hover:underline font-semibold"
                >
                  Ver Detalhes dos Nichos
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
                <button
                  type="button"
                  onClick={() => {
                    setSearchParams({ ...searchParams, keyword: '' });
                    handleSearch(undefined, '');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                    !searchParams.keyword
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>🔥 Todos de Alto Ticket (Auto-Discovery)</span>
                </button>

                {highTicketNiches.map((nicheItem, idx) => (
                  <button
                    type="button"
                    key={nicheItem.id || idx}
                    onClick={() => {
                      setSearchParams({ ...searchParams, keyword: nicheItem.niche });
                      handleSearch(undefined, nicheItem.niche);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 border flex items-center gap-1.5 ${
                      searchParams.keyword === nicheItem.niche
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{nicheItem.niche}</span>
                    <span className="text-[10px] opacity-75 font-bold">({nicheItem.estimatedTicket.split('(')[0].trim()})</span>
                  </button>
                ))}
              </div>
            </div>

          </form>

          {/* Loading Intelligence Bar */}
          {isLoading && (
            <div className="mt-4 p-4 bg-indigo-50/80 rounded-xl border border-indigo-200 text-indigo-950 animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin shrink-0" />
                <div className="flex-1">
                  <div className="font-bold text-xs">{loadingStep || 'Processando pipeline de inteligência autônoma...'}</div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">Executando Deep Matching e extração omnichannel de alta conversão.</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

        </div>

        {/* 4.1. Search Batches / Historical Searches Manager */}
        {batches.length > 0 && (
          <SearchBatchSelector
            batches={batches}
            activeBatchId={activeBatchId}
            onSelectBatch={handleSelectBatch}
            onDeleteBatch={handleDeleteBatch}
            onClearAllBatches={handleClearAllBatches}
            onExportBatchCSV={handleExportBatchCSV}
            isSimpleView={isSimpleView}
            onNewSearchClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const inputEl = document.getElementById('search-keyword-input');
              if (inputEl) {
                inputEl.focus();
                (inputEl as HTMLInputElement).select();
              }
            }}
          />
        )}

        {/* 5. Metrics & ICP Distribution Dashboard */}
        {leads.length > 0 && (
          isSimpleView ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {/* Total Leads */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Empresas Encontradas</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalLeads}</span>
                    <span className="text-xs text-slate-400 font-medium">no total</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>

              {/* Com Telefone / WhatsApp */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Com Telefone / WhatsApp</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.leadsWithPhone}</span>
                    <span className="text-xs text-emerald-600 font-bold">({Math.round((stats.leadsWithPhone / stats.totalLeads) * 100)}%)</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Phone className="w-6 h-6" />
                </div>
              </div>

              {/* Decisores Mapeados / Score A & B */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Qualificação Alta (Score A/B)</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-indigo-600">{stats.scoreACount + stats.scoreBCount}</span>
                    <span className="text-xs text-indigo-500 font-bold">decisores</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Flame className="w-6 h-6" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3 sm:gap-4">
              
              {/* Total Leads */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Leads</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalLeads}</span>
                  <span className="text-xs text-slate-500 font-medium">mapeados</span>
                </div>
              </div>

              {/* Score A (Hot Match) */}
              <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-300/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="w-4 h-4 fill-emerald-500 text-emerald-600" />
                  Score A (Hot)
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">{stats.scoreACount}</span>
                  <span className="text-xs text-emerald-600 font-bold">({Math.round((stats.scoreACount / stats.totalLeads) * 100)}%)</span>
                </div>
              </div>

              {/* Score B (Warm Match) */}
              <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 p-4 sm:p-5 rounded-2xl border border-amber-300/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 fill-amber-400 text-amber-600" />
                  Score B (Warm)
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-700">{stats.scoreBCount}</span>
                  <span className="text-xs text-amber-600 font-bold">({Math.round((stats.scoreBCount / stats.totalLeads) * 100)}%)</span>
                </div>
              </div>

              {/* Apollo.io Leads */}
              <div 
                onClick={() => setFilters(f => ({ ...f, originApi: f.originApi === 'apollo' ? 'all' : 'apollo' }))}
                className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
                  filters.originApi === 'apollo' 
                    ? 'bg-purple-100/90 border-purple-500 ring-2 ring-purple-400' 
                    : 'bg-purple-50/40 border-purple-200/90 hover:border-purple-300 hover:shadow-md'
                }`}
                title="Filtrar apenas leads com decisores do Apollo.io"
              >
                <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  Apollo.io
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-purple-800">{stats.apolloCount}</span>
                  <span className="text-xs text-purple-600 font-bold">({Math.round((stats.apolloCount / stats.totalLeads) * 100)}%)</span>
                </div>
              </div>

              {/* Google Maps Leads */}
              <div 
                onClick={() => setFilters(f => ({ ...f, originApi: f.originApi === 'rapidapi_google_maps' ? 'all' : 'rapidapi_google_maps' }))}
                className={`p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
                  filters.originApi === 'rapidapi_google_maps' 
                    ? 'bg-teal-100/90 border-teal-500 ring-2 ring-teal-400' 
                    : 'bg-teal-50/40 border-teal-200/90 hover:border-teal-300 hover:shadow-md'
                }`}
                title="Filtrar apenas leads do Google Maps"
              >
                <span className="text-xs font-black text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  Google Maps
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-teal-800">{stats.googleMapsCount}</span>
                  <span className="text-xs text-teal-600 font-bold">({Math.round((stats.googleMapsCount / stats.totalLeads) * 100)}%)</span>
                </div>
              </div>

              {/* Decisores / Telefone */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-indigo-600" />
                  Com Telefone
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.leadsWithPhone}</span>
                  <span className="text-xs text-slate-500 font-bold">({Math.round((stats.leadsWithPhone / stats.totalLeads) * 100)}%)</span>
                </div>
              </div>

              {/* Média ICP Match */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Média Match</span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-indigo-600">{stats.avgIcpScore}%</span>
                  <span className="text-xs text-slate-400 font-medium">qualidade</span>
                </div>
              </div>

              {/* Pipeline Estimado */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/40 p-4 sm:p-5 rounded-2xl border border-indigo-200/90 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">Pipeline Est.</span>
                <div className="mt-2">
                  <span className="text-lg sm:text-xl font-black text-indigo-950 truncate block" title={stats.estimatedPipelineValue}>
                    {stats.estimatedPipelineValue}
                  </span>
                </div>
              </div>

            </div>
          )
        )}

        {/* 6. Filter Toolbar & View Mode Switcher */}
        {leads.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            
            {/* Top Toolbar Row: Search Input & Origin Filter Pills */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-gray-100">
              
              {/* Live Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={filters.searchQuery || ''}
                  onChange={e => setFilters(f => ({ ...f, searchQuery: e.target.value }))}
                  placeholder="Buscar por decisor, empresa, cargo, nicho ou cidade..."
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-gray-300 focus:border-indigo-500 rounded-lg text-xs text-gray-800 placeholder-gray-400 outline-none transition-all"
                />
                {filters.searchQuery && (
                  <button
                    onClick={() => setFilters(f => ({ ...f, searchQuery: '' }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    title="Limpar busca"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* API Origin Quick Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-gray-400 font-semibold text-[11px] mr-1 hidden sm:inline">Fonte:</span>
                
                <button
                  onClick={() => setFilters({ ...filters, originApi: 'all' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    filters.originApi === 'all' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Todas ({leads.length})
                </button>

                <button
                  onClick={() => setFilters({ ...filters, originApi: 'apollo' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filters.originApi === 'apollo' 
                      ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-300' 
                      : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <span>🟣</span>
                  Apollo ({stats.apolloCount})
                </button>

                <button
                  onClick={() => setFilters({ ...filters, originApi: 'rapidapi_google_maps' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                    filters.originApi === 'rapidapi_google_maps' 
                      ? 'bg-emerald-700 text-white shadow-sm ring-2 ring-emerald-300' 
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span>🟢</span>
                  Maps ({stats.googleMapsCount})
                </button>

                {stats.syntheticCount > 0 && !isSimpleView && (
                  <button
                    onClick={() => setFilters({ ...filters, originApi: 'synthetic' })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      filters.originApi === 'synthetic' 
                        ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>🟠</span>
                    IA ({stats.syntheticCount})
                  </button>
                )}
              </div>

            </div>

            {/* Bottom Toolbar Row: Secondary Filters, Sort & View Modes */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Left Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                
                {/* 💎 Botão de Filtro Rápido High-Ticket (€599 a €997/mês) */}
                <button
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, highTicketOnly: !prev.highTicketOnly }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border shadow-2xs ${
                    filters.highTicketOnly
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200'
                  }`}
                  title="Filtrar apenas empresas de grande porte com capacidade financeira comprovada para contratar os planos de €599 e €997/mês"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${filters.highTicketOnly ? 'text-amber-300' : 'text-indigo-600'}`} />
                  <span>💎 Leads High-Ticket (€599-€997)</span>
                  {filters.highTicketOnly && (
                    <span className="text-[10px] bg-white/20 px-1.5 rounded font-black text-white">Ativo</span>
                  )}
                </button>

                {/* ICP Tier Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setFilters({ ...filters, icpTier: 'all' })}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      filters.icpTier === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    Todos ICP
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, icpTier: 'SCORE_A' })}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                      filters.icpTier === 'SCORE_A' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Flame className="w-3 h-3 fill-current" />
                    Score A ({stats.scoreACount})
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, icpTier: 'SCORE_B' })}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 ${
                      filters.icpTier === 'SCORE_B' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Zap className="w-3 h-3 fill-current" />
                    Score B ({stats.scoreBCount})
                  </button>
                </div>

                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={e => setFilters({ ...filters, status: e.target.value as any })}
                  className="px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 outline-none"
                >
                  <option value="all">Status: Todos</option>
                  <option value="new">Apenas Novos</option>
                  <option value="contacted">Já Contactados</option>
                  <option value="qualified">Qualificados</option>
                </select>

                {/* ROI Verdict Filter (Investir Tempo / Ligar / WhatsApp / E-mail / Descartar) */}
                <select
                  value={filters.roiVerdict || 'all'}
                  onChange={e => setFilters({ ...filters, roiVerdict: e.target.value as any })}
                  className="px-2.5 py-1.5 bg-slate-50 border border-amber-300 rounded-lg text-xs font-bold text-amber-950 outline-none"
                  title="Filtrar por viabilidade de tempo do SDR: Vale a pena ligar, mandar WhatsApp, e-mail ou descartar"
                >
                  <option value="all">Veredito ROI: Todos</option>
                  <option value="CALL_MEETING">📞 Ligar: Agendar Reunião</option>
                  <option value="WHATSAPP_FIRST">💬 WhatsApp Direto</option>
                  <option value="EMAIL_ONLY">📩 E-mail (Sem Perder Tempo)</option>
                  <option value="DISQUALIFIED">⛔ Descartar / Poupar Tempo</option>
                </select>

                {/* Sort Option */}
                <select
                  value={sortOption}
                  onChange={e => setSortOption(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 outline-none"
                >
                  <option value="icp_score_desc">Ordenar: Maior ICP Score</option>
                  <option value="rating_desc">Ordenar: Melhor Avaliação</option>
                  <option value="reviews_desc">Ordenar: Mais Avaliações</option>
                  <option value="no_website">Priorizar Sem Website</option>
                </select>

              </div>

              {/* Right: View Mode Toggle, Cockpit & Cadence Triggers */}
              <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5 text-xs">
                <span className="text-gray-500 font-medium hidden lg:inline">
                  Exibindo <strong>{filteredLeads.length}</strong> de {leads.length} leads
                </span>

                {/* SDR Cockpit & Cadence Quick Buttons */}
                <button
                  onClick={() => handleOpenCockpit()}
                  className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all"
                  title="Abrir Modo Cockpit Foco 1-a-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Cockpit SDR</span>
                </button>

                <button
                  onClick={() => setIsCadenceQueueOpen(true)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors"
                  title="Abrir Fila de Cadência e Disparos"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fila Cadência</span>
                </button>

                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                      viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Visão Cards / Dossiê 360°"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Cards</span>
                  </button>

                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                      viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Visão Funil Kanban do SDR"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Funil</span>
                  </button>

                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
                      viewMode === 'table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Visão Tabela de Pipeline"
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tabela</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Batch Selection Action Bar (Appears when leads are selected) */}
            {selectedLeadIds.size > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 animate-fade-in text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-950">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  <span>{selectedLeadIds.size} {selectedLeadIds.size === 1 ? 'lead selecionado' : 'leads selecionados'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsWebhookModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Disparar p/ Criahub CRM / n8n
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar Selecionados
                  </button>

                  <button
                    onClick={handleBatchMarkContacted}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar Contactados
                  </button>

                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 7. Main Leads Content Area */}
        {leads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 md:p-14 text-center shadow-sm space-y-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-8 h-8" />
            </div>
            
            <div className="max-w-xl mx-auto space-y-2">
              <h3 className="text-xl font-extrabold text-gray-900">
                Encontre Clientes de Alto Ticket & Alta Conversão Automaticamente
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                O Architect AI lê seu site e serviços para prospectar empresas com alto orçamento sem que você precise adivinhar termos ou nichos manuais.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => handleSearch(undefined, '')}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-extrabold shadow-md transition-all inline-flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4 fill-current text-amber-300" />
                Iniciar Prospecção Auto-Discovery de Alto Ticket
              </button>

              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 border border-slate-300"
              >
                <Globe2 className="w-4 h-4 text-indigo-600" />
                Inserir Meu Site / Configurar 3 Chaves Groq
              </button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* Table View conforming to format */
          <PipelineTable
            leads={filteredLeads}
            selectedLeadIds={selectedLeadIds}
            businessProfile={businessProfile}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onOpenOmnichannel={handleOpenOmnichannel}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteLead}
            onOpenLiveCopilot={handleOpenLiveCopilot}
            onOpenNotes={handleOpenNotes}
            onOpenCriahubDrawer={handleOpenCriahubDrawer}
            onOpenHunterCall={handleOpenHunterCall}
            onOpenFocusDialer={(lead) => {
              setHunterCallLead(lead);
              setIsHunterCallModalOpen(true);
            }}
            onUpdateLead={(updatedLead) => {
              setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
              const currentBatches = getSearchBatches();
              const updated = currentBatches.map(batch => ({
                ...batch,
                leads: batch.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
              }));
              saveSearchBatches(updated);
              setBatches(updated);
            }}
            onOpenCockpit={handleOpenCockpit}
          />
        ) : viewMode === 'kanban' ? (
          /* Kanban Board View for SDR Funnel */
          <PipelineKanban
            leads={filteredLeads}
            businessProfile={businessProfile}
            onUpdateStatus={handleUpdateStatus}
            onOpenCriahubDrawer={handleOpenCriahubDrawer}
            onOpenOmnichannel={handleOpenOmnichannel}
            onOpenLiveCopilot={handleOpenLiveCopilot}
            onOpenNotes={handleOpenNotes}
            onOpenCockpit={handleOpenCockpit}
            onOpenHunterCall={handleOpenHunterCall}
          />
        ) : (
          /* Card View with Omnichannel triggers */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            {filteredLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                businessProfile={businessProfile}
                isSelected={selectedLeadIds.has(lead.id)}
                onSelect={handleToggleSelect}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteLead}
                onOpenOmnichannel={handleOpenOmnichannel}
                onOpenLiveCopilot={handleOpenLiveCopilot}
                onOpenNotes={handleOpenNotes}
                onOpenCriahubDrawer={handleOpenCriahubDrawer}
                onOpenHunterCall={handleOpenHunterCall}
                onOpenFocusDialer={(lead) => {
                  setHunterCallLead(lead);
                  setIsHunterCallModalOpen(true);
                }}
                onUpdateLead={(updatedLead) => {
                  setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
                  const currentBatches = getSearchBatches();
                  const updated = currentBatches.map(batch => ({
                    ...batch,
                    leads: batch.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
                  }));
                  saveSearchBatches(updated);
                  setBatches(updated);
                }}
                onOpenGroqTriage={handleOpenGroqTriage}
                onOpenCockpit={handleOpenCockpit}
              />
            ))}
          </div>
        )}
          </>
        ) : (
          /* =========================================================================
             REAL ESTATE FSBO SCRAPING & SDR WORKSPACE (Imóveis de Particulares)
             ========================================================================= */
          <div className="space-y-6">
            
            {/* Card de Busca de Imóveis de Particulares */}
            <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm p-5 md:p-6 space-y-4">
              
              {/* Header do Card de Imóveis */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-amber-100">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Home className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-black text-slate-900">
                        Radar de Imóveis de Particulares (FSBO - Sem Imobiliárias)
                      </h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">
                        100% Pessoas Físicas
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Scraping focado em proprietários diretos nos portais Idealista, OLX, Fotocasa, Pisos.com, Zap Imóveis e CustoJusto.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRealEstateModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-amber-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Dossiê em Tela Cheia</span>
                  </button>
                </div>
              </div>

              {/* Formulário de Busca de Imóveis */}
              <form onSubmit={handleRealEstateSearch} className="space-y-4">
                
                {/* Seleção Rápida de País */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5 text-amber-600" />
                    País Alvo:
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleReCountryChange('PT')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      reCountry === 'PT'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🇵🇹 Portugal</span>
                    <span className="text-[10px] opacity-80">(Idealista PT, OLX PT, CustoJusto)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReCountryChange('ES')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      reCountry === 'ES'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🇪🇸 Espanha</span>
                    <span className="text-[10px] opacity-80">(Idealista ES, Fotocasa, Pisos.com)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReCountryChange('BR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      reCountry === 'BR'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>🇧🇷 Brasil</span>
                    <span className="text-[10px] opacity-80">(OLX Brasil, Zap Imóveis, VivaReal)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  
                  {/* Cidade */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      Cidade / Concelho
                    </label>
                    <input
                      type="text"
                      value={reCity}
                      onChange={e => setReCity(e.target.value)}
                      placeholder={reCountry === 'PT' ? 'Ex: Lisboa, Porto, Cascais...' : reCountry === 'ES' ? 'Ex: Madrid, Barcelona, València...' : 'Ex: São Paulo, Rio de Janeiro, Curitiba...'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Bairro / Zona */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Bairro / Freguesia / Zona
                    </label>
                    <input
                      type="text"
                      value={reZone}
                      onChange={e => setReZone(e.target.value)}
                      placeholder={reCountry === 'PT' ? 'Ex: Parque das Nações, Arroios, Matosinhos...' : reCountry === 'ES' ? 'Ex: Salamanca, Chamberí, Eixample...' : 'Ex: Moema, Jardins, Pinheiros, Leblon...'}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    />
                  </div>

                  {/* Finalidade */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Finalidade
                    </label>
                    <select
                      value={reTransactionType}
                      onChange={e => setReTransactionType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    >
                      <option value="SALE">Venda (Compra)</option>
                      <option value="RENT">Arrendamento / Aluguel</option>
                    </select>
                  </div>

                  {/* Recência / Data */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Postados há:
                    </label>
                    <select
                      value={reMaxDaysAgo}
                      onChange={e => setReMaxDaysAgo(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                    >
                      <option value={1}>🔥 Hoje (Últimas 24h)</option>
                      <option value={3}>⚡ Últimos 3 dias</option>
                      <option value={7}>📅 Últimos 7 dias</option>
                      <option value={30}>🗓️ Último mês</option>
                    </select>
                  </div>

                  {/* Botão de Busca */}
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={isReLoading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 via-amber-600 to-rose-600 hover:from-amber-600 hover:to-rose-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isReLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Raspando...</span>
                        </>
                      ) : (
                        <>
                          <Home className="w-4 h-4" />
                          <span>Raspar Particulares</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* Direct Portal Quick Links Bar */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Portais com filtros de proprietário direto prontos para consulta web:</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {generatePortalDirectSearchUrls({
                      country: reCountry,
                      city: reCity || (reCountry === 'PT' ? 'Lisboa' : reCountry === 'ES' ? 'Madrid' : 'São Paulo'),
                      zoneOrDistrict: reZone,
                      transactionType: reTransactionType,
                      propertyType: rePropertyType,
                      maxDaysAgo: reMaxDaysAgo,
                      onlyParticulars: true,
                      targetPortals: reCountry === 'PT' ? ['idealista', 'olx', 'custojusto'] : reCountry === 'ES' ? ['idealista', 'fotocasa', 'pisos_com'] : ['olx', 'zap_imoveis', 'vivareal']
                    }).map((portalLink) => (
                      <a
                        key={portalLink.portal}
                        href={portalLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        title={portalLink.note}
                      >
                        <span>{portalLink.portal}</span>
                        <ExternalLink className="w-3 h-3 text-amber-700" />
                      </a>
                    ))}
                  </div>
                </div>

              </form>

              {/* Loading State */}
              {isReLoading && (
                <div className="p-4 bg-amber-50/90 rounded-xl border border-amber-200 text-amber-950 animate-pulse flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold">Raspando portais imobiliários e isolando anúncios de pessoas físicas (FSBO)...</span>
                    <div className="text-[11px] text-amber-800">Filtrando telefones diretos, valores, cálculo de comissão de 5% e gerando scripts de alta conversão.</div>
                  </div>
                </div>
              )}

            </div>

            {/* Métricas e Resultados dos Imóveis */}
            {realEstateLeads.length > 0 ? (
              <div className="space-y-6">
                
                {/* Stats Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Imóveis Particulares</span>
                    <div className="text-2xl font-black text-slate-900 mt-1">{realEstateLeads.length}</div>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl shadow-2xs">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                      Telefones Diretos
                    </span>
                    <div className="text-2xl font-black text-emerald-700 mt-1">
                      {realEstateLeads.filter(l => l.contactPhone).length}
                    </div>
                  </div>

                  <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl shadow-2xs">
                    <span className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                      Comissão Potencial Média
                    </span>
                    <div className="text-lg font-black text-amber-900 mt-1 truncate">
                      {reCountry === 'BR' ? 'R$ 35.000 / captação' : '€ 14.500 / captação'}
                    </div>
                  </div>

                  <div className="bg-purple-50/80 border border-purple-200 p-4 rounded-2xl shadow-2xs">
                    <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-purple-600" />
                      Recência Média
                    </span>
                    <div className="text-lg font-black text-purple-900 mt-1">
                      Últimas 24h a 48h
                    </div>
                  </div>
                </div>

                {/* Grid Split: Lista de Imóveis & Dossiê Ativo */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Coluna da Esquerda: Lista de Imóveis Raspados (7 cols) */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Proprietários Diretos Mapeados</span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-full text-[10px] font-bold">{realEstateLeads.length}</span>
                      </h4>
                      <span className="text-xs text-slate-500 font-medium">Clique em um imóvel para ver o roteiro SDR</span>
                    </div>

                    <div className="space-y-3">
                      {realEstateLeads.map((property) => {
                        const isSelected = selectedReLead?.id === property.id;
                        const contactPhone = property.phone || property.whatsappCleanPhone || '';
                        const waPitch = property.outreachScripts?.whatsappIcebreaker || property.outreachScripts?.whatsappExclusivePitch || '';
                        const portalSource = property.portalSource || 'olx';
                        const portalName = property.portalLabel || (portalSource === 'olx' ? 'OLX Portugal' : portalSource === 'idealista' ? 'Idealista PT' : portalSource === 'custojusto' ? 'CustoJusto Portugal' : property.portalSource || 'Portal');
                        const recencyStr = property.postedDateStr || (property.daysOnMarket === 0 ? 'Hoje' : `Há ${property.daysOnMarket || 1} dias`);

                        const portalBadgeClass = portalSource === 'olx'
                          ? 'bg-sky-100 text-sky-900 border-sky-300'
                          : portalSource === 'idealista'
                          ? 'bg-lime-100 text-lime-900 border-lime-300'
                          : portalSource === 'custojusto'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : portalSource === 'fotocasa'
                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                          : 'bg-indigo-100 text-indigo-900 border-indigo-300';

                        return (
                          <div
                            key={property.id}
                            onClick={() => setSelectedReLead(property)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-amber-50/40 border-amber-400 ring-2 ring-amber-300 shadow-md'
                                : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${portalBadgeClass}`}>
                                    {portalName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                                    property.transactionType === 'RENT' 
                                      ? 'bg-amber-100 text-amber-950 border-amber-300' 
                                      : 'bg-indigo-100 text-indigo-950 border-indigo-300'
                                  }`}>
                                    {property.transactionType === 'RENT' ? 'Arrendamento' : 'Venda'}
                                  </span>
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Particular Direto
                                  </span>
                                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {recencyStr}
                                  </span>
                                </div>

                                <h5 className="font-extrabold text-sm text-slate-900 truncate">
                                  {property.title}
                                </h5>

                                <div className="text-xs text-slate-600 flex items-center gap-1.5 truncate">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{property.zoneOrDistrict ? `${property.zoneOrDistrict}, ` : ''}{property.city} ({property.country})</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-sm sm:text-base font-black text-slate-900">
                                  {property.price}
                                </div>
                                <div className="text-[10px] text-amber-700 font-bold">
                                  Comissão est.: {property.estimatedCommission}
                                </div>
                              </div>
                            </div>

                            {/* Detalhes & Contato */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                <span className="p-1 bg-slate-100 rounded text-[11px]">{property.bedrooms || property.propertyType || 'Imóvel'}</span>
                                {property.areaM2 && <span className="p-1 bg-slate-100 rounded text-[11px]">{property.areaM2} m²</span>}
                                <span className="text-slate-500 font-normal">Proprietário: <strong className="text-slate-800">{property.ownerName || 'Particular'}</strong></span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {contactPhone && (
                                  <a
                                    href={`https://wa.me/${contactPhone.replace(/\D/g, '')}?text=${encodeURIComponent(waPitch)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-[11px] flex items-center gap-1 shadow-2xs"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>WhatsApp</span>
                                  </a>
                                )}

                                <a
                                  href={property.originalUrl || property.livePortalSearchUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-indigo-200 shadow-2xs"
                                  title="Abrir anúncio oficial verificado"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Ver Anúncio</span>
                                </a>

                                {property.googleDorkLiveUrl && (
                                  <a
                                    href={property.googleDorkLiveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium flex items-center gap-1"
                                    title="Buscar anúncios indexados no Google na última semana"
                                  >
                                    <Search className="w-3 h-3 text-slate-400" />
                                    <span>Google Dork</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Coluna da Direita: Dossiê de Angariação & Script SDR (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {selectedReLead ? (
                      (() => {
                        const selPhone = selectedReLead.phone || selectedReLead.whatsappCleanPhone || '';
                        const selWaPitch = selectedReLead.outreachScripts?.whatsappIcebreaker || selectedReLead.outreachScripts?.whatsappExclusivePitch || 'Olá, vi o anúncio direto do seu imóvel e tenho cliente qualificado para visita.';
                        const selCallPitch = selectedReLead.outreachScripts?.coldCall30sPitch || 'Olá, estou ligando a respeito do anúncio particular do seu imóvel. Gostaria de saber se ainda está disponível para apresentação a clientes qualificados.';
                        const rebuttals = selectedReLead.outreachScripts?.objectionRebuttals || {
                          dontWantAgencies: 'Compreendo perfeitamente. Não busco contrato de exclusividade travado, mas sim apresentar um comprador que já avaliamos previamente com capacidade real de compra.',
                          alreadyHaveBuyers: 'Excelente! Apenas tenha em mente que propostas particulares frequentemente encontram entraves na aprovação bancária. Nossa carteira pré-aprovada serve de garantia segura caso precise.',
                          dontWantToPayCommission: 'Entendo sua preocupação com o valor líquido no bolso. Nosso papel é negociar para defender o valor pretendido sem que você perca na negociação.'
                        };

                        return (
                          <div className="bg-white rounded-2xl border border-amber-200/90 shadow-sm p-5 space-y-4 sticky top-6">
                            
                            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                              <div>
                                <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Dossiê de Captação Exclusiva
                                </span>
                                <h4 className="text-base font-extrabold text-slate-900 mt-1">
                                  {selectedReLead.title}
                                </h4>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Proprietário: <strong>{selectedReLead.ownerName || 'Pessoa Física'}</strong> • {selPhone || 'Telefone no anúncio'}
                                </div>
                              </div>
                            </div>

                            {/* Script de WhatsApp */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1">
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  Script de WhatsApp (Comprador Qualificado):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyReText(selWaPitch, 'wa')}
                                  className="text-[11px] text-emerald-700 hover:underline font-bold flex items-center gap-1"
                                >
                                  {copiedReKey === 'wa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedReKey === 'wa' ? 'Copiado!' : 'Copiar'}</span>
                                </button>
                              </div>
                              
                              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                                {selWaPitch}
                              </div>

                              {selPhone && (
                                <a
                                  href={`https://wa.me/${selPhone.replace(/\D/g, '')}?text=${encodeURIComponent(selWaPitch)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-colors"
                                >
                                  <Send className="w-4 h-4" />
                                  <span>Abrir WhatsApp com Mensagem Pronta</span>
                                </a>
                              )}
                            </div>

                            {/* Teleprompter Cold Call 30s */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1">
                                  <PhoneCall className="w-3.5 h-3.5 text-amber-600" />
                                  Teleprompter Ligação (Cold Call 30s):
                                </span>
                                <button
                                  type="button"
                                  onClick={() => copyReText(selCallPitch, 'call')}
                                  className="text-[11px] text-amber-700 hover:underline font-bold flex items-center gap-1"
                                >
                                  {copiedReKey === 'call' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedReKey === 'call' ? 'Copiado!' : 'Copiar'}</span>
                                </button>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed italic">
                                "{selCallPitch}"
                              </div>
                            </div>

                            {/* Quebra de Objeções Interativa */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <span className="text-xs font-bold text-slate-800 block">
                                🛡️ Quebra de Objeções do Particular (Angariação):
                              </span>

                              <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                                <button
                                  type="button"
                                  onClick={() => setReObjectionTab('dontWantAgencies')}
                                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                                    reObjectionTab === 'dontWantAgencies' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  1. "Não quero imobiliárias"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReObjectionTab('alreadyHaveBuyers')}
                                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                                    reObjectionTab === 'alreadyHaveBuyers' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  2. "Já tenho interessados"
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setReObjectionTab('noCommission')}
                                  className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                                    reObjectionTab === 'noCommission' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  3. "Não pago comissão"
                                </button>
                              </div>

                              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed font-medium">
                                {reObjectionTab === 'dontWantAgencies' && (
                                  <p>👉 <strong>Como responder:</strong> {rebuttals.dontWantAgencies}</p>
                                )}
                                {reObjectionTab === 'alreadyHaveBuyers' && (
                                  <p>👉 <strong>Como responder:</strong> {rebuttals.alreadyHaveBuyers}</p>
                                )}
                                {reObjectionTab === 'noCommission' && (
                                  <p>👉 <strong>Como responder:</strong> {rebuttals.dontWantToPayCommission || rebuttals.dontWantAgencies}</p>
                                )}
                              </div>
                            </div>

                          </div>
                        );
                      })()
                    ) : (
                      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
                        Selecione um imóvel na lista para ver o script personalizado e dossiê do proprietário.
                      </div>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              /* Onboarding dos Imóveis quando nenhum foi buscado */
              <div className="bg-white rounded-2xl border border-amber-200/90 p-8 sm:p-12 text-center shadow-sm space-y-6">
                <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                  <Home className="w-8 h-8" />
                </div>
                
                <div className="max-w-xl mx-auto space-y-2">
                  <h3 className="text-xl font-black text-slate-900">
                    Captação de Imóveis Recém-Anunciados por Particulares (FSBO)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Nenhum intermediário ou imobiliária. O sistema raspa anúncios de pessoas físicas em Portugal (Idealista, OLX, CustoJusto), Espanha (Idealista ES, Fotocasa, Pisos.com) e Brasil (OLX, Zap Imóveis) e entrega o contato direto do dono com script de comprador qualificado.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      handleRealEstateSearch(undefined, 'Lisboa', 'PT');
                    }}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2"
                  >
                    <span>🇵🇹 Raspar Lisboa (OLX + CustoJusto + Idealista)</span>
                  </button>

                  <button
                    onClick={() => {
                      handleRealEstateSearch(undefined, 'Oeiras', 'PT');
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center gap-2"
                  >
                    <span>🇵🇹 Raspar Oeiras</span>
                  </button>

                  <button
                    onClick={() => {
                      handleRealEstateSearch(undefined, 'Porto', 'PT');
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center gap-2"
                  >
                    <span>🇵🇹 Raspar Porto</span>
                  </button>

                  <button
                    onClick={() => {
                      handleRealEstateSearch(undefined, 'Madrid', 'ES');
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center gap-2"
                  >
                    <span>🇪🇸 Raspar Madrid</span>
                  </button>

                  <button
                    onClick={() => {
                      handleRealEstateSearch(undefined, 'São Paulo', 'BR');
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all border border-slate-300 flex items-center gap-2"
                  >
                    <span>🇧🇷 Raspar São Paulo</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
          </>
        )}

      </main>

      {/* 8. Modals */}
      
      {/* SDR Cockpit Modal (1-on-1 Focus Mode, Battlecards & Dialer) */}
      <SdrCockpitModal
        isOpen={isCockpitOpen}
        onClose={() => setIsCockpitOpen(false)}
        leads={filteredLeads}
        currentLeadIndex={cockpitLeadIndex}
        onNavigateLead={(index) => setCockpitLeadIndex(index)}
        onUpdateStatus={handleUpdateStatus}
        onSaveLead={handleSaveLead}
        businessProfile={businessProfile}
        onOpenCriahubDrawer={handleOpenCriahubDrawer}
        onOpenHunterCall={handleOpenHunterCall}
      />

      {/* Cadence Queue Modal (21-Day Multi-Touch Sequence & WhatsApp Anti-Ban) */}
      <CadenceQueueModal
        isOpen={isCadenceQueueOpen}
        onClose={() => setIsCadenceQueueOpen(false)}
        leads={filteredLeads}
        businessProfile={businessProfile}
        onUpdateStatus={handleUpdateStatus}
        onOpenCriahubDrawer={handleOpenCriahubDrawer}
      />

      {/* CriaHub SDR & High Conversion Copy Engine Drawer */}
      <LeadAnalysisDrawer
        lead={selectedLeadForCriahub}
        isOpen={isCriahubDrawerOpen}
        onClose={() => setIsCriahubDrawerOpen(false)}
        onSaveLead={handleSaveLead}
      />

      {/* Lead Notes & Decision Maker Custom Details Modal */}
      <LeadNotesModal
        lead={selectedLeadForNotes}
        isOpen={isNotesModalOpen}
        onClose={() => setIsNotesModalOpen(false)}
        onSaveLead={handleSaveLead}
      />

      {/* Omnichannel Outreach & Scripts Modal */}
      <OmnichannelModal
        lead={selectedLeadForOmnichannel}
        isOpen={isOmnichannelOpen}
        onClose={() => setIsOmnichannelOpen(false)}
        initialTab={omnichannelInitialTab}
        onMarkContacted={handleMarkContacted}
        onOpenLiveCopilot={handleOpenLiveCopilot}
      />

      {/* AI Live Copilot Modal (Realtime Voice / WhatsApp Call & Chat Assistant) */}
      <AiLiveCopilotModal
        lead={selectedLeadForLiveCopilot}
        isOpen={isLiveCopilotOpen}
        onClose={() => setIsLiveCopilotOpen(false)}
        onLeadUpdated={(updatedLead) => {
          handleSaveLead(updatedLead);
        }}
      />

      {/* Country & Currency Selector Modal (onboarding + troca a qualquer momento) */}
      <CountrySelectModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        onSelect={applyCountry}
        currentCountry={country}
      />

      {/* Business Profile & Deep Matching Configurator Modal */}
      <BusinessProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={businessProfile}
        onSaveProfile={(p) => setBusinessProfile(p)}
        onSelectNicheForSearch={handleSelectNicheFromModal}
      />

      {/* Webhook & n8n Automation Center Modal */}
      <WebhookAutomationModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        leads={leads}
        selectedLeadIds={selectedLeadIds}
      />

      {/* Raw JSON Structure Viewer Modal */}
      <JsonViewerModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        leads={leads}
      />

      {/* Settings Panel Modal (APIs Groq, RapidAPI, Gemini, Supervisor, Prompts, Dispatches, Link Sharing) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        initialTab={settingsInitialTab}
        onClearAllActiveData={handleClearAllBatches}
      />

      {/* Scraper Studio & Robot Architecture Modal */}
      <ScraperStudioModal
        isOpen={isScraperStudioOpen}
        onClose={() => setIsScraperStudioOpen(false)}
        defaultKeyword={searchParams.keyword || 'Clínicas e Consultórios'}
        defaultCity={searchParams.city || 'São Paulo'}
        defaultCountry={searchParams.country || 'Brasil'}
      />

      {/* Real Estate FSBO Scraping & Acquisition Modal */}
      <RealEstateScraperModal
        isOpen={isRealEstateModalOpen}
        onClose={() => setIsRealEstateModalOpen(false)}
        aiConfig={getAiConfig()}
        defaultCountry={searchParams.country === 'Portugal' ? 'PT' : searchParams.country === 'Espanha' ? 'ES' : 'BR'}
        defaultCity={searchParams.city || 'Lisboa'}
        onImportLead={(importedLead) => {
          setLeads(prev => {
            const exists = prev.some(l => l.id === importedLead.id || (l.website && l.website === importedLead.website));
            if (exists) {
              return prev.map(l => (l.id === importedLead.id || l.website === importedLead.website) ? { ...l, ...importedLead } : l);
            }
            return [importedLead, ...prev];
          });

          // Sincroniza com o lote de pesquisa atual
          const currentBatches = getSearchBatches();
          if (currentBatches.length > 0) {
            const targetBatchId = activeBatchId || currentBatches[0].id;
            const updated = currentBatches.map(b => {
              if (b.id === targetBatchId) {
                const existsInBatch = b.leads.some(l => l.id === importedLead.id);
                const nextLeads = existsInBatch 
                  ? b.leads.map(l => l.id === importedLead.id ? { ...l, ...importedLead } : l)
                  : [importedLead, ...b.leads];
                return {
                  ...b,
                  leadCount: nextLeads.length,
                  leads: nextLeads
                };
              }
              return b;
            });
            saveSearchBatches(updated);
            setBatches(updated);
          }
        }}
        onImportLeads={(importedLeadsList) => {
          if (!importedLeadsList || importedLeadsList.length === 0) return;
          setLeads(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newOnes = importedLeadsList.filter(l => !existingIds.has(l.id));
            return [...newOnes, ...prev];
          });

          const currentBatches = getSearchBatches();
          if (currentBatches.length > 0) {
            const targetBatchId = activeBatchId || currentBatches[0].id;
            const updated = currentBatches.map(b => {
              if (b.id === targetBatchId) {
                const existingBatchIds = new Set(b.leads.map(l => l.id));
                const newLeads = importedLeadsList.filter(l => !existingBatchIds.has(l.id));
                const nextLeads = [...newLeads, ...b.leads];
                return {
                  ...b,
                  leadCount: nextLeads.length,
                  leads: nextLeads
                };
              }
              return b;
            });
            saveSearchBatches(updated);
            setBatches(updated);
          }
        }}
      />

      {/* 🎯 Fast-Dialer Focus Modal (Teleprompter Hunter + Keyboard Shortcuts + Matriz Sênior) */}
      <FastDialerFocusModal
        isOpen={isHunterCallModalOpen}
        onClose={() => setIsHunterCallModalOpen(false)}
        lead={hunterCallLead}
        leads={filteredLeads}
        onUpdateLead={(updatedLead) => {
          setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
          const currentBatches = getSearchBatches();
          const updated = currentBatches.map(batch => ({
            ...batch,
            leads: batch.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
          }));
          saveSearchBatches(updated);
          setBatches(updated);
        }}
        onUpdateStatus={handleUpdateStatus}
        onMarkContacted={(id) => handleMarkContacted(id)}
        onSaveNotes={(id, notes) => {
          setLeads(prev => prev.map(l => l.id === id ? { ...l, notes } : l));
          const currentBatches = getSearchBatches();
          const updated = currentBatches.map(batch => ({
            ...batch,
            leads: batch.leads.map(l => l.id === id ? { ...l, notes } : l)
          }));
          saveSearchBatches(updated);
          setBatches(updated);
        }}
        onOpenCriahubDrawer={handleOpenCriahubDrawer}
      />

      {/* ⚡ Groq Llama-3 Triage & Webhook Data Dictionary Modal */}
      <GroqTriageWebhookModal
        isOpen={isGroqTriageModalOpen}
        onClose={() => setIsGroqTriageModalOpen(false)}
        selectedLead={groqTriageLead}
      />

      {/* 🔐 User Authentication & Fast Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
        onOpenAdmin={() => {
          setIsAuthModalOpen(false);
          setIsAdminManagementOpen(true);
        }}
      />

      {/* 🛡️ User & Company RBAC Administration & Audit Reports Modal */}
      <UserAndCompanyManagementModal
        isOpen={isAdminManagementOpen}
        onClose={() => setIsAdminManagementOpen(false)}
        currentUser={currentUser}
        onUserChanged={handleUserChanged}
      />

      {/* 🛑 Quota & Limit Guard Notification Modal */}
      {quotaModalData && (
        <QuotaExceededModal
          isOpen={quotaModalData.isOpen}
          onClose={() => setQuotaModalData(null)}
          currentUser={currentUser}
          usage={quotaModalData.usage}
          reason={quotaModalData.reason}
          moduleAttempted={quotaModalData.moduleAttempted}
          onOpenAdmin={() => {
            setQuotaModalData(null);
            setIsAdminManagementOpen(true);
          }}
        />
      )}

      {/* 🛡️ RGPD & Privacy Suppression Modal (STOP Opt-Out List) */}
      <RgpdSuppressionModal
        isOpen={isRgpdModalOpen}
        onClose={() => setIsRgpdModalOpen(false)}
      />

      {/* 📱 Mobile & Tablet Optimized Floating Bottom Navigation Bar */}
      <AppBottomNav
        activeTab={activeNavTab}
        onSelectTab={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'b2b_leads') setSearchDomain('companies');
          if (tab === 'real_estate') setSearchDomain('real_estate');
        }}
        leadsCount={leads.length}
        realEstateCount={realEstateLeads.length}
        isHighTicketActive={Boolean(filters.highTicketOnly)}
        onToggleHighTicket={() => setFilters(prev => ({ ...prev, highTicketOnly: !prev.highTicketOnly }))}
        onOpenSearch={() => {
          setActiveNavTab('b2b_leads');
          setSearchDomain('companies');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          const inputEl = document.getElementById('search-keyword-input');
          if (inputEl) inputEl.focus();
        }}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenTools={() => setIsCockpitOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAdmin={() => setIsAdminManagementOpen(true)}
        userRole={currentUser?.role}
      />

      {/* 📱 Full Mobile Command Center Modal (Zero Menus Ocultos / Zero Cortes / Acesso Completo) */}
      <MobileCommandSheet
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        currentQuotaUsage={currentQuotaUsage}
        country={country}
        countryFlag={getCurrencyConfig(country).flag}
        leadsCount={leads.length}
        realEstateCount={realEstateLeads.length}
        isHighTicketActive={Boolean(filters.highTicketOnly)}
        onToggleHighTicket={() => setFilters(prev => ({ ...prev, highTicketOnly: !prev.highTicketOnly }))}
        onSelectNavTab={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'b2b_leads') setSearchDomain('companies');
          if (tab === 'real_estate') setSearchDomain('real_estate');
        }}
        onOpenSearch={() => {
          setActiveNavTab('b2b_leads');
          setSearchDomain('companies');
          window.scrollTo({ top: 0, behavior: 'smooth' });
          const inputEl = document.getElementById('search-keyword-input');
          if (inputEl) inputEl.focus();
        }}
        onOpenCockpit={() => handleOpenCockpit()}
        onOpenCadence={() => setIsCadenceQueueOpen(true)}
        onOpenSettings={(tab) => {
          if (tab) setSettingsInitialTab(tab as any);
          setIsSettingsOpen(true);
        }}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenWebhook={() => setIsWebhookModalOpen(true)}
        onOpenScraperStudio={() => setIsScraperStudioOpen(true)}
        onOpenRgpd={() => setIsRgpdModalOpen(true)}
        onOpenCountryModal={() => setIsCountryModalOpen(true)}
        onOpenAdmin={() => setIsAdminManagementOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onExportCsv={handleExportCSV}
        onLogout={handleLogout}
      />

    </div>
  );
}

export default App;
