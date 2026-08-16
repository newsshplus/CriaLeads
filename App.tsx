import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Download, Filter, MapPin, RefreshCw, Briefcase, Trash2, 
  PieChart, Phone, XCircle, Globe2, ShieldCheck, Square, Mail, 
  CheckSquare, Loader2, Sparkles, SlidersHorizontal, Layers, 
  Flame, Zap, AlertTriangle, Send, FileCode, CheckCircle2, 
  Building2, Users, ArrowUpRight, BarChart3, LayoutGrid, Table as TableIcon,
  Play, HelpCircle, ChevronRight, TrendingUp, Key, Cpu
} from 'lucide-react';
import { 
  Lead, SearchParams, FilterState, SortOption, DashboardStats, 
  BusinessProfile, ScrapingEngineStatus, IcpTier, HighTicketNicheRecommendation 
} from './types';
import { 
  DEFAULT_BUSINESS_PROFILE, SUPPORTED_COUNTRIES, BRAZIL_STATES, 
  PORTUGAL_DISTRICTS, BUSINESS_CATEGORIES, DEFAULT_FILTERS,
  DEFAULT_HIGH_TICKET_NICHES
} from './constants';
import { searchAndScoreLeads } from './services/geminiService';
import { 
  getSavedBusinessProfile, saveBusinessProfile, 
  getSavedLeads, saveLeadsCache, checkLeadStatus, 
  saveContactedLead 
} from './services/storageService';
import { getAiConfig } from './services/aiProviderService';

import LeadCard from './components/LeadCard';
import PipelineTable from './components/PipelineTable';
import CitySelector from './components/CitySelector';
import OmnichannelModal from './components/OmnichannelModal';
import BusinessProfileModal from './components/BusinessProfileModal';
import WebhookAutomationModal from './components/WebhookAutomationModal';
import JsonViewerModal from './components/JsonViewerModal';
import ScrapingPipelineBanner from './components/ScrapingPipelineBanner';
import AiLiveCopilotModal from './components/AiLiveCopilotModal';

export function App() {
  // Business Profile & Matching State
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const saved = getSavedBusinessProfile();
    if (!saved.recommendedHighTicketNiches || saved.recommendedHighTicketNiches.length === 0) {
      saved.recommendedHighTicketNiches = DEFAULT_HIGH_TICKET_NICHES;
    }
    return saved;
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Search State
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: '', // Empty by default -> Auto-Discovery Mode (High Ticket Multi-Nicho)
    country: 'Brasil',
    city: 'São Paulo',
    district: 'Todas',
    radius: 15,
    strictMode: true,
    tierFilter: 'ALL'
  });

  // Leads State
  const [leads, setLeads] = useState<Lead[]>(() => {
    const cached = getSavedLeads();
    return cached.length > 0 ? cached : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<ScrapingEngineStatus>({
    primary: { name: "AI Core Multi-Engine (Groq 3-Key Pool + Gemini)", status: "ACTIVE" },
    secondary: { name: "DuckDuckGo + Playwright Headless", status: "FALLBACK_READY" },
    tertiary: { name: "Google & Bing Web Search Free API Layer", status: "READY" },
    activeEngine: "AI Multi-Engine (Auto Fallback)",
    lastLatencyMs: 1250,
    extractedCount: leads.length
  });

  // View & UI Modals State
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');
  const [selectedLeadForOmnichannel, setSelectedLeadForOmnichannel] = useState<Lead | null>(null);
  const [omnichannelInitialTab, setOmnichannelInitialTab] = useState<'pitro_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech'>('cadence');
  const [isOmnichannelOpen, setIsOmnichannelOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // AI Live Copilot State
  const [selectedLeadForLiveCopilot, setSelectedLeadForLiveCopilot] = useState<Lead | null>(null);
  const [isLiveCopilotOpen, setIsLiveCopilotOpen] = useState(false);

  // Selection & Batch Action State
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Filter and Sorting State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortOption, setSortOption] = useState<SortOption>('icp_score_desc');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync leads cache
  useEffect(() => {
    if (leads.length > 0) {
      saveLeadsCache(leads);
    }
  }, [leads]);

  // Execute Prospecting Pipeline
  const handleSearch = async (e?: React.FormEvent, customKeyword?: string) => {
    if (e) e.preventDefault();
    
    const targetKeyword = customKeyword !== undefined ? customKeyword : searchParams.keyword;

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

    try {
      setTimeout(() => {
        if (isLoading) setLoadingStep('2/4 Mapeando Decisores, WhatsApp Direto & Falhas de Tecnologia...');
      }, 2500);

      setTimeout(() => {
        if (isLoading) setLoadingStep('3/4 Calculando Intent Score e Deep Matching com suas soluções...');
      }, 5000);

      setTimeout(() => {
        if (isLoading) setLoadingStep('4/4 Gerando Roteiros Omnichannel e Payloads Pitro CRM / Z-API...');
      }, 7500);

      const result = await searchAndScoreLeads(
        targetKeyword,
        searchParams.country,
        searchParams.city,
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

      setLeads(processed);
      setEngineStatus(result.engineStatus);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setError(err.message || 'Erro durante o processo de prospecção autônoma.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleSelectNicheFromModal = (niche: HighTicketNicheRecommendation) => {
    setSearchParams(prev => ({ ...prev, keyword: niche.niche }));
    handleSearch(undefined, niche.niche);
  };

  // Lead Actions
  const handleUpdateStatus = (id: string, status: Lead['status']) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const handleDeleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleOpenOmnichannel = (lead: Lead, tab: 'pitro_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech' = 'cadence') => {
    setSelectedLeadForOmnichannel(lead);
    setOmnichannelInitialTab(tab);
    setIsOmnichannelOpen(true);
  };

  const handleOpenLiveCopilot = (lead: Lead) => {
    setSelectedLeadForLiveCopilot(lead);
    setIsLiveCopilotOpen(true);
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

        // Website filter
        if (filters.hasWebsite === 'yes' && !lead.website) return false;
        if (filters.hasWebsite === 'no' && lead.website) return false;

        // Phone filter
        if (filters.hasPhone === 'yes' && !lead.phone && !lead.decisionMaker?.directPhone) return false;
        if (filters.hasPhone === 'no' && (lead.phone || lead.decisionMaker?.directPhone)) return false;

        // Email filter
        if (filters.hasEmail === 'yes' && !lead.email && !lead.decisionMaker?.directEmail) return false;
        if (filters.hasEmail === 'no' && (lead.email || lead.decisionMaker?.directEmail)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'icp_score_desc') return b.icpScore - a.icpScore;
        if (sortOption === 'rating_desc') return b.rating - a.rating;
        if (sortOption === 'reviews_desc') return b.reviews - a.reviews;
        if (sortOption === 'no_website') return (a.website ? 1 : 0) - (b.website ? 1 : 0);
        return b.score - a.score;
      });
  }, [leads, filters, sortOption]);

  // Dashboard Stats
  const stats: DashboardStats = useMemo(() => {
    const total = leads.length;
    if (total === 0) {
      return {
        totalLeads: 0,
        avgScore: 0,
        avgIcpScore: 0,
        scoreACount: 0,
        scoreBCount: 0,
        scoreCCount: 0,
        leadsWithWebsite: 0,
        leadsWithoutWebsite: 0,
        leadsWithPhone: 0,
        leadsWithEmail: 0,
        estimatedPipelineValue: "R$ 0"
      };
    }

    const scoreA = leads.filter(l => l.icpTier === 'SCORE_A').length;
    const scoreB = leads.filter(l => l.icpTier === 'SCORE_B').length;
    const scoreC = leads.filter(l => l.icpTier === 'SCORE_C').length;
    const withWeb = leads.filter(l => !!l.website).length;
    const withPhone = leads.filter(l => !!l.phone || !!l.decisionMaker?.directPhone).length;
    const withEmail = leads.filter(l => !!l.email || !!l.decisionMaker?.directEmail).length;
    const avgIcp = Math.round(leads.reduce((acc, l) => acc + l.icpScore, 0) / total);

    // Approximate pipeline value calculation (Score A * 14.000 + Score B * 7.500)
    const pipelineVal = (scoreA * 14000) + (scoreB * 7500);
    const formattedPipeline = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(pipelineVal);

    return {
      totalLeads: total,
      avgScore: Math.round(leads.reduce((acc, l) => acc + l.score, 0) / total),
      avgIcpScore: avgIcp,
      scoreACount: scoreA,
      scoreBCount: scoreB,
      scoreCCount: scoreC,
      leadsWithWebsite: withWeb,
      leadsWithoutWebsite: total - withWeb,
      leadsWithPhone: withPhone,
      leadsWithEmail: withEmail,
      estimatedPipelineValue: formattedPipeline
    };
  }, [leads]);

  const highTicketNiches = businessProfile.recommendedHighTicketNiches?.length 
    ? businessProfile.recommendedHighTicketNiches 
    : DEFAULT_HIGH_TICKET_NICHES;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      
      {/* 1. Global Navigation Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg text-white tracking-tight">Architect-Prospector AI</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    Auto-Discovery & Pitro CRM
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Prospecção de Alto Ticket Sem Nicho Fixo • 3 Groq Keys Pool • Copilot ao Vivo</p>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="flex items-center gap-2">
              {/* Business Profile / Deep Matching Button */}
              <button
                id="btn-open-profile"
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Configurar Site, Nichos de Alto Ticket e Chaves Groq"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Meu Site & Nichos</span>
              </button>

              {/* Webhooks & n8n Automation */}
              <button
                id="btn-open-webhooks"
                onClick={() => setIsWebhookModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/50 transition-colors"
                title="Central de Automação Pitro CRM, Webhooks e n8n"
              >
                <Send className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden sm:inline">Pitro CRM & Webhook</span>
              </button>

              {/* Raw JSON Export */}
              <button
                id="btn-open-json"
                onClick={() => setIsJsonModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                title="Visualizar e Baixar JSON Estruturado"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">JSON</span>
              </button>

              {/* CSV Download */}
              <button
                id="btn-export-csv"
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                title="Exportar dados para Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. Scraping Pipeline Redundancy Banner */}
      <ScrapingPipelineBanner status={engineStatus} />

      {/* 3. Deep Matching Active Business Banner */}
      <div className="bg-indigo-950/90 text-indigo-100 border-b border-indigo-900/60 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-white uppercase text-[10px] bg-indigo-800 px-2 py-0.5 rounded tracking-wider">
              Meu Negócio:
            </span>
            <strong className="text-indigo-200">{businessProfile.businessName}</strong>
            <span className="text-indigo-300 hidden md:inline">({businessProfile.websiteUrl || 'Site mapeado'})</span>
            <span className="text-indigo-400 hidden lg:inline">• UVP: "{businessProfile.uvp.slice(0, 60)}..."</span>
          </div>

          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="text-xs font-semibold text-indigo-300 hover:text-white underline hover:no-underline shrink-0"
          >
            Configurar Chaves Groq & Nichos de Alto Ticket
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">

        {/* 4. Search & Prospecting Control Center */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 space-y-4">
          
          {/* Header of Search with Auto-Discovery Badge */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Radar de Prospecção Inteligente & Auto-Discovery
                </h3>
                <p className="text-xs text-slate-500">
                  Não é obrigatório digitar um nicho. Deixe em branco ou selecione um nicho recomendado para prospectar automaticamente clientes de alto ticket.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchParams({ ...searchParams, keyword: '' });
                handleSearch(undefined, '');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-extrabold shadow-sm hover:opacity-95 transition-opacity"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Modo Auto-Discovery (Todos de Alto Ticket)</span>
            </button>
          </div>

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
                    className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar Busca
                  </button>
                ) : (
                  <button
                    type="submit"
                    id="btn-start-prospecting"
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
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

              <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

        {/* 5. Metrics & ICP Distribution Dashboard */}
        {leads.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            {/* Total Leads */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Leads</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-gray-900">{stats.totalLeads}</span>
                <span className="text-xs text-gray-400 font-medium">mapeados</span>
              </div>
            </div>

            {/* Score A (Hot Match) */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-sm flex flex-col justify-between bg-emerald-50/20">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-600" />
                Score A (Hot)
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-emerald-700">{stats.scoreACount}</span>
                <span className="text-xs text-emerald-600 font-semibold">({Math.round((stats.scoreACount / stats.totalLeads) * 100)}%)</span>
              </div>
            </div>

            {/* Score B (Warm Match) */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between bg-amber-50/20">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-600" />
                Score B (Warm)
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-amber-700">{stats.scoreBCount}</span>
                <span className="text-xs text-amber-600 font-semibold">({Math.round((stats.scoreBCount / stats.totalLeads) * 100)}%)</span>
              </div>
            </div>

            {/* Decisores / Telefone */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3 text-indigo-500" />
                Com Telefone
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-gray-900">{stats.leadsWithPhone}</span>
                <span className="text-xs text-gray-400 font-medium">({Math.round((stats.leadsWithPhone / stats.totalLeads) * 100)}%)</span>
              </div>
            </div>

            {/* Média ICP Match */}
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Média Match</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-indigo-600">{stats.avgIcpScore}%</span>
                <span className="text-xs text-gray-400 font-medium">qualidade</span>
              </div>
            </div>

            {/* Pipeline Estimado */}
            <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-between bg-purple-50/20">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Pipeline Est.</span>
              <div className="mt-1">
                <span className="text-lg font-black text-purple-900 truncate block" title={stats.estimatedPipelineValue}>
                  {stats.estimatedPipelineValue}
                </span>
              </div>
            </div>

          </div>
        )}

        {/* 6. Filter Toolbar & View Mode Switcher */}
        {leads.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Left Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                
                {/* ICP Tier Filter Tabs */}
                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setFilters({ ...filters, icpTier: 'all' })}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      filters.icpTier === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    Todos ({leads.length})
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

              {/* Right: View Mode Toggle & Counter */}
              <div className="flex items-center justify-between md:justify-end gap-3 text-xs">
                <span className="text-gray-500 font-medium">
                  Exibindo <strong>{filteredLeads.length}</strong> de {leads.length} leads
                </span>

                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${
                      viewMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'
                    }`}
                    title="Visão Tabela de Pipeline"
                  >
                    <TableIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Tabela</span>
                  </button>

                  <button
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-md transition-all flex items-center gap-1 text-xs font-bold ${
                      viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600'
                    }`}
                    title="Visão Cards / Dossiê"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Cards</span>
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
                    Disparar p/ Pitro CRM / n8n
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
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onOpenOmnichannel={handleOpenOmnichannel}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDeleteLead}
            onOpenLiveCopilot={handleOpenLiveCopilot}
          />
        ) : (
          /* Card View with Omnichannel triggers */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLeads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                isSelected={selectedLeadIds.has(lead.id)}
                onSelect={handleToggleSelect}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteLead}
                onOpenOmnichannel={handleOpenOmnichannel}
                onOpenLiveCopilot={handleOpenLiveCopilot}
              />
            ))}
          </div>
        )}

      </main>

      {/* 8. Modals */}
      
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
          setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
        }}
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

    </div>
  );
}

export default App;
