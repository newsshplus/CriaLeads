import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Key, Sliders, Sparkles, CheckCircle2, AlertTriangle, 
  RotateCw, Shield, Send, Terminal, Mail, MessageSquare, 
  Database, RefreshCw, Cpu, Check, Layers, ExternalLink, HelpCircle,
  Code, Globe, Copy, Share2, Eye, Download, Upload, Link, CheckCheck, Lock,
  Trash2, ShieldCheck
} from 'lucide-react';
import { AiEngineConfig, CustomPromptsConfig } from '../types';
import { getAiConfig, saveAiConfig, testGroqKey, testGeminiApiKey, fetchGroqAvailableModels } from '../services/aiProviderService';
import { testRapidApiKey } from '../services/letscrapeService';
import { getCustomPrompts, saveCustomPrompts, resetDefaultPrompts } from '../services/promptConfigService';
import { GEMINI_MODELS, DEFAULT_RAPIDAPI_KEYS, GROQ_MODELS } from '../constants';
import { getApolloApiKey, saveApolloApiKey, testApolloApiKey } from '../services/apolloService';
import { 
  exportCurrentWorkspaceConfig, 
  generateShareableLink, 
  downloadWorkspaceConfigJson, 
  importConfigFromJsonFile, 
  importWorkspaceConfig 
} from '../services/configSharingService';
import { 
  getActiveProspectingStats, 
  clearAllActiveProspectingData,
  ActiveProspectingStats 
} from '../services/storageService';
import { WebhookSettings } from './admin/WebhookSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  onClearAllActiveData?: () => void;
  initialTab?: TabType;
}

export type TabType = 'share' | 'apollo' | 'rapidapi' | 'groq' | 'gemini' | 'prompts' | 'dispatches' | 'webhook_admin' | 'embed';

export default function SettingsModal({ isOpen, onClose, onSaved, onClearAllActiveData, initialTab = 'share' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [config, setConfig] = useState<AiEngineConfig>(() => getAiConfig());
  const [prompts, setPrompts] = useState<CustomPromptsConfig>(() => getCustomPrompts());

  // Active Prospecting Data Stats & Wipe state
  const [activeStats, setActiveStats] = useState<ActiveProspectingStats>(() => getActiveProspectingStats());
  const [clearActiveSuccess, setClearActiveSuccess] = useState<string | null>(null);

  // Recarrega stats sempre que o modal abre
  useEffect(() => {
    if (isOpen) {
      setActiveStats(getActiveProspectingStats());
      setClearActiveSuccess(null);
    }
  }, [isOpen]);

  const handleClearActiveDataNow = () => {
    clearAllActiveProspectingData();
    if (onClearAllActiveData) {
      onClearAllActiveData();
    }
    setActiveStats(getActiveProspectingStats());
    setClearActiveSuccess('Todos os lotes, leads e históricos ativos foram zerados com sucesso! O sistema está 100% limpo.');
    setTimeout(() => {
      setClearActiveSuccess(null);
    }, 4000);
  };

  // Share & Link Sync State
  const [shareIncludeGroq, setShareIncludeGroq] = useState(true);
  const [shareIncludeApollo, setShareIncludeApollo] = useState(true);
  const [shareIncludeRapid, setShareIncludeRapid] = useState(true);
  const [shareIncludeGemini, setShareIncludeGemini] = useState(true);
  const [shareIncludePrompts, setShareIncludePrompts] = useState(true);
  const [shareIncludeProfile, setShareIncludeProfile] = useState(true);
  const [shareIncludeCrm, setShareIncludeCrm] = useState(true);
  const [copiedShareLink, setCopiedShareLink] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Embed configurator state
  const [embedTenantId, setEmbedTenantId] = useState<string>('app_client_01');
  const [embedCountry, setEmbedCountry] = useState<string>('BR');
  const [embedCity, setEmbedCity] = useState<string>('São Paulo');
  const [embedNiche, setEmbedNiche] = useState<string>('');
  const [embedHideHeader, setEmbedHideHeader] = useState<boolean>(false);
  const [embedHeight, setEmbedHeight] = useState<string>('780px');
  const [embedCopied, setEmbedCopied] = useState<string | null>(null);

  // Test states
  const [testingGroqIdx, setTestingGroqIdx] = useState<number | null>(null);
  const [testingRapidIdx, setTestingRapidIdx] = useState<number | null>(null);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingApollo, setTestingApollo] = useState(false);
  const [apolloKeyInput, setApolloKeyInput] = useState<string>(() => getApolloApiKey());
  const [testFeedback, setTestFeedback] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [groqModelsList, setGroqModelsList] = useState<Array<{ id: string; label: string; note?: string }>>(GROQ_MODELS);
  const [isRefreshingModels, setIsRefreshingModels] = useState(false);

  const refreshLiveGroqModels = async (keyOverride?: string) => {
    const keyToUse = keyOverride || config.groqKeys.find(k => k && k.trim());
    if (!keyToUse) return;
    setIsRefreshingModels(true);
    try {
      const live = await fetchGroqAvailableModels(keyToUse);
      if (live.length > 0) {
        // Merge com o fallback conhecido mantendo os nomes amigáveis
        const merged = [...live];
        GROQ_MODELS.forEach(def => {
          if (!merged.some(m => m.id === def.id)) {
            merged.push(def);
          }
        });
        setGroqModelsList(merged);
        setTestFeedback(`✅ ${live.length} modelos ativos carregados diretamente da API Groq!`);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsRefreshingModels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setConfig(getAiConfig());
      setPrompts(getCustomPrompts());
      setSaveSuccess(false);
      setTestFeedback(null);
      const activeKey = getAiConfig().groqKeys.find(k => k && k.trim());
      if (activeKey) {
        refreshLiveGroqModels(activeKey);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = () => {
    saveCustomPrompts(prompts);
    saveApolloApiKey(apolloKeyInput);
    const updatedConfig: AiEngineConfig = {
      ...config,
      apolloApiKey: apolloKeyInput.trim(),
      customPrompts: prompts
    };
    saveAiConfig(updatedConfig);
    setSaveSuccess(true);
    if (onSaved) onSaved();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestApolloKey = async () => {
    if (!apolloKeyInput.trim()) {
      setTestFeedback("Chave de API do Apollo.io está vazia.");
      return;
    }
    setTestingApollo(true);
    setTestFeedback(null);
    const res = await testApolloApiKey(apolloKeyInput);
    setTestingApollo(false);
    if (res.success) {
      setTestFeedback(`✅ Conexão com Apollo.io bem-sucedida (${res.latencyMs}ms)!`);
    } else {
      setTestFeedback(`❌ Erro no Apollo.io: ${res.error}`);
    }
  };

  const handleTestGroqKey = async (index: number) => {
    const key = config.groqKeys[index];
    if (!key || !key.trim()) {
      setTestFeedback(`A Chave #${index + 1} do Groq está vazia.`);
      return;
    }
    setTestingGroqIdx(index);
    setTestFeedback(null);

    const result = await testGroqKey(key, config.groqModel);
    setTestingGroqIdx(null);

    // Se o teste passou, atualiza os modelos dinâmicos ao vivo da conta Groq
    if (result.success) {
      refreshLiveGroqModels(key);
    }

    const updatedKeyStatuses = [...config.keyStatuses];
    updatedKeyStatuses[index] = {
      index,
      keyPreview: `${key.slice(0, 6)}...${key.slice(-4)}`,
      status: result.success ? 'VALID' : 'ERROR',
      lastUsed: new Date().toLocaleTimeString(),
      errorMessage: result.error
    };

    setConfig(prev => ({
      ...prev,
      keyStatuses: updatedKeyStatuses
    }));

    if (result.success) {
      setTestFeedback(`Groq Key #${index + 1} verificada com sucesso (${result.latencyMs}ms)!`);
    } else {
      setTestFeedback(`Erro na Groq Key #${index + 1}: ${result.error}`);
    }
  };

  const handleTestRapidApiKey = async (index: number) => {
    const key = config.rapidApiKeys[index];
    if (!key || !key.trim()) {
      setTestFeedback(`A Chave #${index + 1} da RapidAPI está vazia.`);
      return;
    }
    setTestingRapidIdx(index);
    setTestFeedback(null);

    const result = await testRapidApiKey(key, index);
    setTestingRapidIdx(null);

    const updatedRapidStatuses = [...(config.rapidApiKeyStatuses || [])];
    updatedRapidStatuses[index] = {
      index,
      keyPreview: `${key.slice(0, 6)}...${key.slice(-4)}`,
      status: result.ok ? 'VALID' : 'ERROR',
      lastUsed: new Date().toLocaleTimeString(),
      errorMessage: result.error,
      latencyMs: result.latencyMs
    };

    setConfig(prev => ({
      ...prev,
      rapidApiKeyStatuses: updatedRapidStatuses
    }));

    if (result.ok) {
      const apiName = index === 0 ? 'LetScrape Google Maps' : index === 1 ? 'Crunchbase 4' : 'Yelp Business Reviews';
      setTestFeedback(`${apiName} (Slot #${index + 1}) conectada (${result.latencyMs}ms)!`);
    } else {
      setTestFeedback(`Erro RapidAPI Slot #${index + 1}: ${result.error}`);
    }
  };

  const handleTestGeminiKey = async () => {
    const key = config.customGeminiApiKey;
    setTestingGemini(true);
    setTestFeedback(null);

    const result = await testGeminiApiKey(key || '', config.geminiModel);
    setTestingGemini(false);

    setConfig(prev => ({
      ...prev,
      geminiKeyStatus: {
        status: result.success ? 'VALID' : 'ERROR',
        lastUsed: new Date().toLocaleTimeString(),
        errorMessage: result.error,
        latencyMs: result.latencyMs
      }
    }));

    if (result.success) {
      setTestFeedback(`Chave Gemini testada com sucesso (${result.latencyMs}ms)!`);
    } else {
      setTestFeedback(`Erro Gemini: ${result.error}`);
    }
  };

  const handleResetPrompts = () => {
    if (confirm("Deseja restaurar todos os prompts da IA e Supervisor para os padrões originais de alta conversão?")) {
      const defs = resetDefaultPrompts();
      setPrompts(defs);
      setTestFeedback("Prompts restaurados para os padrões com sucesso.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100 ring-1 ring-white/10">
        
        {/* Header Superior */}
        <div className="px-6 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10 shrink-0">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Painel de Configurações de APIs & Inteligência Artificial
                </h2>
                <span className="hidden sm:inline-block text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-extrabold uppercase tracking-wider">
                  Multi-Engine Real Data
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configure provedores de IA gratuita (Groq), Apollo.io, RapidAPI LetScrape, Gemini, Prompts SDR e canais de disparo.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {testFeedback && (
          <div className={`px-6 py-2 text-xs flex items-center justify-between shrink-0 font-medium ${
            testFeedback.includes('sucesso') || testFeedback.includes('conectada') || testFeedback.includes('verificada') || testFeedback.includes('✅')
              ? 'bg-emerald-950/90 text-emerald-300 border-b border-emerald-800'
              : 'bg-rose-950/90 text-rose-300 border-b border-rose-800'
          }`}>
            <span className="truncate mr-2">{testFeedback}</span>
            <button onClick={() => setTestFeedback(null)} className="underline text-[11px] shrink-0 font-bold">Fechar aviso</button>
          </div>
        )}

        {/* Split Layout: Sidebar Navigation (Left) + Content Area (Right) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* =========================================================================
             SIDEBAR LATERAL ESQUERDA
             ========================================================================= */}
          <aside className="w-full md:w-72 lg:w-80 bg-slate-950/90 border-b md:border-b-0 md:border-r border-slate-800 p-3 sm:p-4 flex flex-col justify-between overflow-y-auto shrink-0 space-y-4">
            
            <div className="space-y-4">
              
              {/* Categoria 1: Sincronização & Compartilhamento */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Share2 className="w-3 h-3 text-amber-400" />
                  <span>Sincronização & Acesso</span>
                </div>
                
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('share')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'share'
                        ? 'bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-amber-200 border border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'share' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                        <Link className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Link de Acesso com APIs</div>
                        <div className="text-[10px] text-slate-400 truncate">Sincronizar entre computadores</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded uppercase shrink-0">
                      Sync
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('embed')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'embed'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'embed' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                        <Code className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Incorporar / Iframe</div>
                        <div className="text-[10px] text-slate-400 truncate">Rodar no seu site ou SaaS</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[9px] font-black rounded uppercase shrink-0">
                      SaaS
                    </span>
                  </button>
                </div>
              </div>

              {/* Categoria 2: Provedores de Inteligência Artificial */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  <span>Motores de Inteligência Artificial</span>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('groq')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'groq'
                        ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'groq' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                        <Cpu className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Groq Pool (Llama 3.3)</div>
                        <div className="text-[10px] text-slate-400 truncate">100% Gratuito & Ultra-Rápido</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded shrink-0">
                      {config.groqKeys.filter(k => k && k.trim()).length}/3
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('gemini')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'gemini'
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'gemini' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-purple-400'}`}>
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Google Gemini AI</div>
                        <div className="text-[10px] text-slate-400 truncate">Fallback & Raciocínio</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('prompts')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'prompts'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'prompts' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-400'}`}>
                        <Terminal className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Supervisor IA & Prompts</div>
                        <div className="text-[10px] text-slate-400 truncate">Roteiros SDR & Auditoria ICP</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Categoria 3: Prospecção & Dados Reais */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span>Prospecção & Dados Reais</span>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('apollo')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'apollo'
                        ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'apollo' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                        <Sparkles className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Apollo.io API Oficial</div>
                        <div className="text-[10px] text-slate-400 truncate">Decisores, Emails & LinkedIn</div>
                      </div>
                    </div>
                    {apolloKeyInput.trim() && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('rapidapi')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'rapidapi'
                        ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'rapidapi' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'}`}>
                        <Database className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">RapidAPI LetScrape</div>
                        <div className="text-[10px] text-slate-400 truncate">Google Maps Live Scraper</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded shrink-0">
                      {config.rapidApiKeys.filter(k => k && k.trim()).length}
                    </span>
                  </button>
                </div>
              </div>

              {/* Categoria 4: Disparos & Canais */}
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                  <Send className="w-3 h-3 text-sky-400" />
                  <span>Omnichannel & Outreach</span>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('webhook_admin')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'webhook_admin'
                        ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'webhook_admin' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400'}`}>
                        <Lock className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Painel Webhook Admin</div>
                        <div className="text-[10px] text-slate-400 truncate">Integração FSBO + B2B & HMAC</div>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-black rounded uppercase shrink-0">
                      Admin
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('dispatches')}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      activeTab === 'dispatches'
                        ? 'bg-sky-500/20 text-sky-200 border border-sky-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 ${activeTab === 'dispatches' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-sky-400'}`}>
                        <Send className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">Disparos & Canais</div>
                        <div className="text-[10px] text-slate-400 truncate">Email SMTP, WhatsApp & APIs</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

            </div>

            {/* Quick Status Info Footer in Sidebar */}
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Motor Principal:</span>
                <strong className="text-indigo-300 font-mono">Groq Llama 3.3</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Apollo Decisores:</span>
                <strong className={apolloKeyInput.trim() ? "text-emerald-400" : "text-amber-400"}>
                  {apolloKeyInput.trim() ? "Conectado" : "Free Search"}
                </strong>
              </div>
            </div>

          </aside>

          {/* =========================================================================
             CONTENT AREA PRINCIPAL (DIREITA)
             ========================================================================= */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-7 md:p-8 space-y-6 bg-slate-900/70">
          
          {/* TAB: COMPARTILHAR LINK COM APIS & BACKUP */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              
              {/* Header Hero Banner */}
              <div className="bg-gradient-to-r from-amber-950/70 via-indigo-950/70 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-xl">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Share2 className="w-5 h-5 text-amber-400" />
                      Sincronização & Compartilhamento via Link
                    </h3>
                    <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
                      Gere um link com suas chaves de API (Groq, Apollo, RapidAPI, Gemini) e configurações pré-carregadas. 
                      Ao abrir esse link em qualquer computador, navegador ou dispositivo móvel, o sistema sincronizará tudo automaticamente!
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Auto-Sincronização Ativa
                    </span>
                  </div>
                </div>
              </div>

              {/* Status das Chaves Configuradas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block">Chaves Groq</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-indigo-300">
                      {config.groqKeys.filter(k => k && k.trim()).length} de 3
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.groqKeys.some(k => k.trim()) ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                      {config.groqKeys.some(k => k.trim()) ? 'Pronto' : 'Pendente'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block">Apollo.io API</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-amber-300">
                      {apolloKeyInput.trim() ? 'Configurado' : 'Vazio'}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${apolloKeyInput.trim() ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                      {apolloKeyInput.trim() ? 'Ativo' : 'Opcional'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block">RapidAPI Maps</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-emerald-300">
                      {(config.rapidApiKeys || []).filter(k => k && k.trim()).length} de 3
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(config.rapidApiKeys || []).some(k => k && k.trim()) ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                      {(config.rapidApiKeys || []).some(k => k && k.trim()) ? 'Pronto' : 'Pendente'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block">Gemini / IA</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm font-bold text-purple-300">
                      {config.customGeminiApiKey?.trim() ? 'Customizado' : 'Padrão'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      Disponível
                    </span>
                  </div>
                </div>
              </div>

              {/* Banner de Garantia de Privacidade e Limpeza de Dados Ativos */}
              <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/40 border border-emerald-500/40 rounded-2xl p-4.5 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs font-bold text-emerald-200">
                          Garantia de Link 100% Limpo & Seguro
                        </h4>
                        <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                          Zero Vazamento de Dados
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        Ao enviar o link gerado, ele <strong>NÃO contém seus leads, lotes salvos, contatos ou histórico de pesquisas</strong>.
                        O destinatário abre a plataforma em um ambiente completamente limpo, apenas com as configurações e chaves autorizadas.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleClearActiveDataNow}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-rose-900/40"
                      title="Apaga os lotes e leads salvos no seu navegador para deixar a sua tela atual também completamente limpa"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Zerar Dados Ativos Agora</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>Dados ativos na sua sessão local:</span>
                    <span className="font-semibold text-slate-200 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {activeStats.b2bLeadsCount} leads ({activeStats.b2bBatchesCount} lotes B2B) • {activeStats.realEstateLeadsCount} imóveis
                    </span>
                  </div>

                  {clearActiveSuccess && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                      <CheckCheck className="w-3.5 h-3.5" />
                      {clearActiveSuccess}
                    </span>
                  )}
                </div>
              </div>

              {/* Gerador de Link */}
              {(() => {
                const currentExport = exportCurrentWorkspaceConfig({
                  includeGroq: shareIncludeGroq,
                  includeApollo: shareIncludeApollo,
                  includeRapid: shareIncludeRapid,
                  includeGemini: shareIncludeGemini,
                  includePrompts: shareIncludePrompts,
                  includeProfile: shareIncludeProfile,
                  includeCrm: shareIncludeCrm
                });
                // Injeta chave do input do Apollo
                if (shareIncludeApollo && apolloKeyInput.trim()) {
                  currentExport.apolloApiKey = apolloKeyInput.trim();
                }

                const generatedUrl = generateShareableLink({
                  config: currentExport,
                  mode: 'token'
                });

                const embedWithApisUrl = generateShareableLink({
                  config: currentExport,
                  embed: true,
                  mode: 'embed'
                });

                return (
                  <div className="space-y-4">
                    
                    {/* Link Principal com 1 Clique */}
                    <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-lg">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <label className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                          <Link className="w-4 h-4 text-indigo-400" />
                          Link Completo de Acesso com Suas APIs
                        </label>
                        <span className="text-[10px] font-mono bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800 text-indigo-300">
                          Token Seguro Criptografado
                        </span>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all leading-relaxed max-h-24 overflow-y-auto">
                        {generatedUrl}
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                        <button
                          onClick={() => {
                            // Salva antes para garantir
                            handleSaveAll();
                            navigator.clipboard.writeText(generatedUrl);
                            setCopiedShareLink('full');
                            setTimeout(() => setCopiedShareLink(null), 3000);
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          {copiedShareLink === 'full' ? (
                            <>
                              <CheckCheck className="w-4 h-4 text-emerald-300" />
                              <span>Link Copiado com Sucesso!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar Link com Minhas APIs</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            handleSaveAll();
                            navigator.clipboard.writeText(embedWithApisUrl);
                            setCopiedShareLink('embed');
                            setTimeout(() => setCopiedShareLink(null), 3000);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                          title="Copiar URL para usar no Iframe com as APIs já ativas"
                        >
                          {copiedShareLink === 'embed' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>URL de Iframe Copiada!</span>
                            </>
                          ) : (
                            <>
                              <Code className="w-3.5 h-3.5" />
                              <span>Copiar URL para Iframe</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const cleanDirectUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?clean=1` : '';
                            navigator.clipboard.writeText(cleanDirectUrl);
                            setCopiedShareLink('clean_direct');
                            setTimeout(() => setCopiedShareLink(null), 3000);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-600/50 transition-colors cursor-pointer"
                          title="Link limpo para um novo usuário configurar do zero sem nenhum dado prévio"
                        >
                          {copiedShareLink === 'clean_direct' ? (
                            <>
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Link Limpo Copiado!</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Copiar Link Limpo (Sem Dados)</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Opções de Inclusão no Link */}
                      <div className="pt-3 border-t border-slate-800/80">
                        <span className="text-[11px] font-bold text-slate-400 block mb-2">
                          Selecione o que deseja incluir no Link Compartilhável:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={shareIncludeGroq}
                              onChange={e => setShareIncludeGroq(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span>Chaves Groq ({config.groqKeys.filter(k => k.trim()).length})</span>
                          </label>

                          <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={shareIncludeApollo}
                              onChange={e => setShareIncludeApollo(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                            />
                            <span>Apollo.io API</span>
                          </label>

                          <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={shareIncludeRapid}
                              onChange={e => setShareIncludeRapid(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span>RapidAPI Maps</span>
                          </label>

                          <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={shareIncludeGemini}
                              onChange={e => setShareIncludeGemini(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                            />
                            <span>Gemini / IA</span>
                          </label>

                          <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={shareIncludePrompts}
                              onChange={e => setShareIncludePrompts(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                            />
                            <span>Prompts IA</span>
                          </label>

                          <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={shareIncludeProfile}
                              onChange={e => setShareIncludeProfile(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span>Perfil da Empresa</span>
                          </label>

                          <label className="flex items-center gap-2 text-slate-300 cursor-pointer bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                            <input
                              type="checkbox"
                              checked={shareIncludeCrm}
                              onChange={e => setShareIncludeCrm(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
                            />
                            <span>Canais CRM/Webhook</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Backup & Importação de Arquivo JSON */}
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-400" />
                          Backup & Restauração de Arquivo de Configuração (.json)
                        </span>
                        {importStatus && (
                          <span className="text-xs text-emerald-400 font-semibold">{importStatus}</span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Você também pode exportar suas chaves para um arquivo seguro <code className="text-indigo-300">.json</code> ou importar em qualquer computador.
                      </p>

                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => downloadWorkspaceConfigJson(currentExport)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Baixar Backup (.json)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold border border-slate-700 transition-colors"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Importar Arquivo (.json)</span>
                        </button>

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const res = await importConfigFromJsonFile(file);
                              if (res.success) {
                                setImportStatus(`✅ Importado: ${res.importedItems.join(', ')}`);
                                setConfig(getAiConfig());
                                setPrompts(getCustomPrompts());
                                setApolloKeyInput(getApolloApiKey());
                                setTimeout(() => setImportStatus(null), 4000);
                              } else {
                                setImportStatus(`❌ Erro: ${res.error || 'Falha ao importar'}`);
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Dica de Segurança */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] text-slate-300 leading-relaxed">
                        <strong className="text-amber-300">Como funciona a segurança do link:</strong> O link carrega o token comprimido. 
                        Quando a outra pessoa ou dispositivo abre o link, o sistema grava automaticamente as chaves no armazenamento do navegador dela 
                        e remove o token da barra de endereço para que a URL fique limpa.
                      </div>
                    </div>

                  </div>
                );
              })()}

            </div>
          )}
          
          {/* TAB 0: APOLLO.IO SDR ENGINE */}
          {activeTab === 'apollo' && (
            <div className="space-y-6">
              <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Integração Apollo.io (Decisores B2B, LinkedIn & Enriquecimento CriaHub)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Conecta diretamente aos endpoints <code className="text-indigo-300">/v1/mixed_people/search</code> e <code className="text-indigo-300">/v1/organizations/search</code> do Apollo.io para extrair CEOs, Diretores, E-mails diretos verificados, LinkedIn e Tech Stack das empresas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Apollo API Key Input */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Chave de API Apollo.io (APOLLO_API_KEY)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Chave oficial fornecida para enriquecimento instantâneo de decisores.
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    Ativa & Pronta
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={apolloKeyInput}
                      onChange={e => setApolloKeyInput(e.target.value)}
                      placeholder="Insira sua APOLLO_API_KEY..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleTestApolloKey}
                    disabled={testingApollo}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20"
                  >
                    {testingApollo ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Testar Conexão Apollo</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                  <span className="font-bold text-slate-300 block">Recursos Habilitados com esta Chave:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Extração de Decisores (Nome, Cargo, LinkedIn URL, E-mail direto, Telefone/WhatsApp).</li>
                    <li>Dados da Empresa (Domínio, LinkedIn Page, Tamanho/Colaboradores, Setor, Tecnologias).</li>
                    <li>Geração de Scripts de Alta Conversão CriaHub com diagnóstico de 2 a 3 falhas críticas.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: RAPIDAPI LETSCRAPE */}
          {activeTab === 'rapidapi' && (
            <div className="space-y-6">
              <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Motor de Raspagem de Empresas Reais (Google Maps via LetScrape)
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Esta chave busca empresas REAIS com sites, telefones, avaliações e endereços verificados no Google Maps.
                      Você pode configurar até 3 chaves com rotação sequencial ou randômica para contornar limites de requisições.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rotação mode */}
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200">Modo de Rotação do Pool de Chaves RapidAPI</label>
                  <p className="text-[11px] text-slate-400">Escolha como o sistema alterna entre as chaves em buscas intensivas.</p>
                </div>
                <select
                  value={config.rapidApiRotationMode || 'sequential'}
                  onChange={e => setConfig(prev => ({ ...prev, rapidApiRotationMode: e.target.value as any }))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="sequential">Sequencial (Chave 1 ➔ Chave 2 ➔ Chave 3)</option>
                  <option value="random">Randômico (Distribui aleatoriamente)</option>
                </select>
              </div>

              {/* RapidAPI Keys Inputs */}
              <div className="space-y-4">
                {([0, 1, 2] as const).map((idx) => {
                  const key = config.rapidApiKeys[idx] || '';
                  const status = config.rapidApiKeyStatuses?.[idx];
                  const isTesting = testingRapidIdx === idx;
                  const isPrimary = idx === 0;

                  const slotMeta = [
                    {
                      name: "RapidAPI #1 — Google Maps / LetScrape",
                      host: "local-business-data.p.rapidapi.com",
                      placeholder: "Chave RapidAPI LetScrape (Busca local, endereços, avaliações)...",
                      desc: "Motor principal de raspagem de empresas, telefones e websites reais no Google Maps."
                    },
                    {
                      name: "RapidAPI #2 — Crunchbase 4 Company Data",
                      host: "crunchbase4.p.rapidapi.com",
                      placeholder: "Chave RapidAPI Crunchbase 4 (POST /company com domain)...",
                      desc: "Inteligência corporativa B2B: financiamento, porte, ano de fundação e setor."
                    },
                    {
                      name: "RapidAPI #3 — Yelp Business Reviews & Locais",
                      host: "yelp-business-reviews.p.rapidapi.com",
                      placeholder: "Chave RapidAPI Yelp Business Reviews (GET /search)...",
                      desc: "Busca de estabelecimentos reais, avaliações, categorias e contatos verificados."
                    }
                  ][idx];

                  return (
                    <div key={idx} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white">{slotMeta.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700">
                            {slotMeta.host}
                          </span>
                          {isPrimary && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                              Chave Padrão
                            </span>
                          )}
                          {status?.status === 'VALID' && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1 font-semibold">
                              <Check className="w-3 h-3" /> Conectada ({status.latencyMs}ms)
                            </span>
                          )}
                          {status?.status === 'ERROR' && (
                            <span className="text-[10px] bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1 font-semibold" title={status.errorMessage}>
                              <AlertTriangle className="w-3 h-3" /> Falhou
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTestRapidApiKey(idx)}
                          disabled={isTesting || !key.trim()}
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                        >
                          {isTesting ? (
                            <>
                              <RotateCw className="w-3 h-3 animate-spin" />
                              Testando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Testar Conexão Real
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-tight">{slotMeta.desc}</p>

                      <input
                        type="password"
                        value={key}
                        placeholder={slotMeta.placeholder}
                        onChange={e => {
                          const updatedKeys: [string, string, string] = [...config.rapidApiKeys];
                          updatedKeys[idx] = e.target.value;
                          setConfig(prev => ({ ...prev, rapidApiKeys: updatedKeys }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: GROQ POOL */}
          {activeTab === 'groq' && (
            <div className="space-y-6">
              <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Pool de Chaves Groq (100% Gratuito & Ultra-Rápido)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  O Groq processa o enriquecimento analítico com Llama 3.3 70B sem custo.
                  Com 3 chaves configuradas, o sistema alterna automaticamente caso ocorra rate-limit.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
                  >
                    Gerar chaves gratuitas no console.groq.com <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Model & Temp Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-200 block">Modelo Ativo no Groq (100% Free)</label>
                    <button
                      type="button"
                      onClick={() => refreshLiveGroqModels()}
                      disabled={isRefreshingModels || !config.groqKeys.some(k => k && k.trim())}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold disabled:opacity-40"
                      title="Consultar lista de modelos ativos na API do Groq"
                    >
                      <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingModels ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingModels ? 'Buscando...' : 'Sincronizar Modelos'}</span>
                    </button>
                  </div>
                  <select
                    value={config.groqModel || 'llama-3.3-70b-versatile'}
                    onChange={e => setConfig(prev => ({ ...prev, groqModel: e.target.value as any }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {groqModelsList.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {groqModelsList.find(m => m.id === (config.groqModel || 'llama-3.3-70b-versatile'))?.note || 'Modelo gratuito de alta velocidade no Groq'}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-200">Temperatura (Criatividade vs Precisão)</label>
                    <span className="text-xs font-mono text-indigo-400 font-bold">{config.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="0.8"
                    step="0.05"
                    value={config.temperature}
                    onChange={e => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500 mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Mais Analítico (0.1)</span>
                    <span>Equilibrado (0.35)</span>
                    <span>Criativo (0.8)</span>
                  </div>
                </div>
              </div>

              {/* Tabela de Especificações dos Modelos Gratuitos Groq */}
              <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                    Modelos Gratuitos Disponíveis no Groq Developer Plan (Zero Custo)
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-semibold">
                    100% Free Tier
                  </span>
                </div>

                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left text-slate-300 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-1.5 px-2">Model ID</th>
                        <th className="py-1.5 px-2">Velocidade</th>
                        <th className="py-1.5 px-2">Contexto</th>
                        <th className="py-1.5 px-2">Rate Limits</th>
                        <th className="py-1.5 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[10px]">
                      <tr className={config.groqModel === 'llama-3.3-70b-versatile' ? 'bg-indigo-950/40 text-indigo-200' : ''}>
                        <td className="py-1.5 px-2 font-bold font-sans flex items-center gap-1">
                          llama-3.3-70b-versatile
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded">Recomendado</span>
                        </td>
                        <td className="py-1.5 px-2 text-emerald-400">~280 T/s</td>
                        <td className="py-1.5 px-2">128k tokens</td>
                        <td className="py-1.5 px-2">6k TPM / 30 RPM</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-sans font-bold">✓ Ativo</td>
                      </tr>
                      <tr className={config.groqModel === 'groq/compound' ? 'bg-indigo-950/40 text-indigo-200' : ''}>
                        <td className="py-1.5 px-2 font-bold font-sans">groq/compound</td>
                        <td className="py-1.5 px-2 text-emerald-400">~450 T/s</td>
                        <td className="py-1.5 px-2">131k tokens</td>
                        <td className="py-1.5 px-2">200k TPM / 200 RPM</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-sans font-bold">✓ Ativo</td>
                      </tr>
                      <tr className={config.groqModel === 'groq/compound-mini' ? 'bg-indigo-950/40 text-indigo-200' : ''}>
                        <td className="py-1.5 px-2 font-bold font-sans">groq/compound-mini</td>
                        <td className="py-1.5 px-2 text-emerald-400">~450 T/s</td>
                        <td className="py-1.5 px-2">131k tokens</td>
                        <td className="py-1.5 px-2">200k TPM / 200 RPM</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-sans font-bold">✓ Ativo</td>
                      </tr>
                      <tr className={config.groqModel === 'llama-3.1-8b-instant' ? 'bg-indigo-950/40 text-indigo-200' : ''}>
                        <td className="py-1.5 px-2 font-bold font-sans">llama-3.1-8b-instant</td>
                        <td className="py-1.5 px-2 text-emerald-400">~560 T/s</td>
                        <td className="py-1.5 px-2">128k tokens</td>
                        <td className="py-1.5 px-2">20k TPM / 30 RPM</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-sans font-bold">✓ Ativo</td>
                      </tr>
                      <tr className={config.groqModel === 'deepseek-r1-distill-llama-70b' ? 'bg-indigo-950/40 text-indigo-200' : ''}>
                        <td className="py-1.5 px-2 font-bold font-sans">deepseek-r1-distill-llama-70b</td>
                        <td className="py-1.5 px-2 text-emerald-400">~250 T/s</td>
                        <td className="py-1.5 px-2">128k tokens</td>
                        <td className="py-1.5 px-2">6k TPM / 30 RPM</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-sans font-bold">✓ Ativo</td>
                      </tr>
                      <tr className={config.groqModel === 'qwen-2.5-32b' ? 'bg-indigo-950/40 text-indigo-200' : ''}>
                        <td className="py-1.5 px-2 font-bold font-sans">qwen-2.5-32b</td>
                        <td className="py-1.5 px-2 text-emerald-400">~380 T/s</td>
                        <td className="py-1.5 px-2">128k tokens</td>
                        <td className="py-1.5 px-2">6k TPM / 30 RPM</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-sans font-bold">✓ Ativo</td>
                      </tr>
                      <tr className={config.groqModel === 'gemma2-9b-it' ? 'bg-indigo-950/40 text-indigo-200' : ''}>
                        <td className="py-1.5 px-2 font-bold font-sans">gemma2-9b-it</td>
                        <td className="py-1.5 px-2 text-emerald-400">~400 T/s</td>
                        <td className="py-1.5 px-2">8k tokens</td>
                        <td className="py-1.5 px-2">15k TPM / 30 RPM</td>
                        <td className="py-1.5 px-2 text-emerald-400 font-sans font-bold">✓ Ativo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3 Groq Keys Inputs */}
              <div className="space-y-4">
                {([0, 1, 2] as const).map((idx) => {
                  const key = config.groqKeys[idx] || '';
                  const status = config.keyStatuses?.[idx];
                  const isTesting = testingGroqIdx === idx;

                  return (
                    <div key={idx} className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">Chave Groq #{idx + 1} (gsk_...)</span>
                          {status?.status === 'VALID' && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1 font-semibold">
                              <Check className="w-3 h-3" /> Verificada
                            </span>
                          )}
                          {status?.status === 'RATE_LIMITED' && (
                            <span className="text-[10px] bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1 font-semibold">
                              <RotateCw className="w-3 h-3" /> Em Rotação
                            </span>
                          )}
                          {status?.status === 'ERROR' && (
                            <span className="text-[10px] bg-rose-950 text-rose-400 px-2 py-0.5 rounded border border-rose-800 flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Inválida
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleTestGroqKey(idx)}
                          disabled={isTesting || !key.trim()}
                          className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold disabled:opacity-40 transition-colors"
                        >
                          {isTesting ? (
                            <>
                              <RotateCw className="w-3 h-3 animate-spin" />
                              Testando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              Testar Chave
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        type="password"
                        value={key}
                        placeholder={`Cole a chave Groq #${idx + 1} (gsk_...)...`}
                        onChange={e => {
                          const updatedKeys: [string, string, string] = [...config.groqKeys];
                          updatedKeys[idx] = e.target.value;
                          setConfig(prev => ({ ...prev, groqKeys: updatedKeys }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: GEMINI & FALLBACK */}
          {activeTab === 'gemini' && (
            <div className="space-y-6">
              <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Google Gemini (Fallback e Análise Cognitiva)
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Usado como redundância ou provedor principal. Utilize sua chave gratuita gerada no Google AI Studio (aistudio.google.com).
                </p>
              </div>

              {/* Provider Strategy Selector */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-3">
                <label className="text-xs font-bold text-slate-200 block">Estratégia de Provedor de IA</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, activeProvider: 'auto' }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.activeProvider === 'auto'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs">Auto (Recomendado)</div>
                    <div className="text-[11px] mt-1 text-slate-300">Groq gratuito 1º com fallback automático para Gemini</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, activeProvider: 'groq' }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.activeProvider === 'groq'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs">Groq Exclusivo</div>
                    <div className="text-[11px] mt-1 text-slate-300">Economia máxima de tokens do Google Gemini</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, activeProvider: 'gemini' }))}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      config.activeProvider === 'gemini'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500'
                        : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-bold text-xs">Gemini Exclusivo</div>
                    <div className="text-[11px] mt-1 text-slate-300">Google Gemini como motor cognitivo exclusivo</div>
                  </button>
                </div>
              </div>

              {/* Gemini Model & Custom Key */}
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">Modelo do Gemini</label>
                  <select
                    value={config.geminiModel || 'gemini-3.7-flash'}
                    onChange={e => setConfig(prev => ({ ...prev, geminiModel: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {GEMINI_MODELS.map(m => (
                      <option key={m.id} value={m.id}>{m.label} ({m.note})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-200">Chave Google AI Studio Customizada (Opcional)</label>
                    <button
                      type="button"
                      onClick={handleTestGeminiKey}
                      disabled={testingGemini || !config.customGeminiApiKey?.trim()}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold disabled:opacity-40"
                    >
                      {testingGemini ? <RotateCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      Testar Chave Gemini
                    </button>
                  </div>
                  <input
                    type="password"
                    value={config.customGeminiApiKey || ''}
                    placeholder="Cole sua chave gratuita do Google AI Studio (AIzaSy...)..."
                    onChange={e => setConfig(prev => ({ ...prev, customGeminiApiKey: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Se vazio, o app utilizará a chave gerenciada no container ou fallback local.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SUPERVISOR IA & PROMPTS */}
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              
              {/* Supervisor Control Banner */}
              <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Agente Supervisor de IA (Auditoria de Veracidade & Anti-Alucinação)
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    O Supervisor atua como uma segunda camada de auditoria que valida se os dados da empresa são genuínos, atribui o Reliability Score e corrige eventuais divergências.
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-900 px-3 py-2 rounded-xl border border-slate-700 shrink-0">
                  <input
                    type="checkbox"
                    checked={config.supervisorAiEnabled !== false}
                    onChange={e => setConfig(prev => ({ ...prev, supervisorAiEnabled: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                  />
                  <span className="text-xs font-bold text-white">Supervisor Ativo</span>
                </label>
              </div>

              {/* Prompt Reset Button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetPrompts}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Restaurar Prompts para os Padrões
                </button>
              </div>

              {/* Prompts Editors */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    1. Prompt de Enriquecimento (Groq / Gemini)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Instruções dadas à IA para diagnosticar as empresas reais, preencher BANT+ e mapear falhas de tecnologia.
                  </p>
                  <textarea
                    rows={6}
                    value={prompts.enrichmentSystemPrompt}
                    onChange={e => setPrompts(prev => ({ ...prev, enrichmentSystemPrompt: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    2. Prompt do Agente Supervisor de IA (Auditoria de Veracidade)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Instruções do Supervisor para checar consistência, calcular o Reliability Score (0-100%) e emitir recomendações táticas.
                  </p>
                  <textarea
                    rows={6}
                    value={prompts.supervisorSystemPrompt}
                    onChange={e => setPrompts(prev => ({ ...prev, supervisorSystemPrompt: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    3. Prompt do Motor de Copywriting & Outbound
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Diretrizes para geração dos roteiros de WhatsApp, Cold Email e Pitch Telefônico de alta conversão.
                  </p>
                  <textarea
                    rows={4}
                    value={prompts.copywriterPrompt}
                    onChange={e => setPrompts(prev => ({ ...prev, copywriterPrompt: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1">
                    4. Prompt de Classificação e Qualificação de Leads (ICP - Matriz 100 Pts)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Matriz Sênior de inteligência comercial: avaliação rigorosa de 8 critérios (0 a 100 pts), tipo de negócio, trava de segurança e parecer final.
                  </p>
                  <textarea
                    rows={8}
                    value={prompts.icpClassificationPrompt || ''}
                    onChange={e => setPrompts(prev => ({ ...prev, icpClassificationPrompt: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: DISPAROS & CANAIS */}
          {activeTab === 'dispatches' && (
            <div className="space-y-6">
              <div className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-4">
                <h3 className="text-sm font-bold text-sky-300 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Integrações de Disparo Omnichannel & Webhooks
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Configure os tokens para disparo direto de Cold Emails (Resend), WhatsApp (Evolution API / Z-API) e Webhook Criahub CRM.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Resend Email */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Mail className="w-4 h-4 text-sky-400" />
                    Resend API (Disparo de Cold Email)
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">API Key do Resend (re_...)</label>
                    <input
                      type="password"
                      value={config.resendApiKey || ''}
                      placeholder="re_123456789..."
                      onChange={e => setConfig(prev => ({ ...prev, resendApiKey: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Email Remetente Verificado</label>
                    <input
                      type="text"
                      value={config.senderEmail || ''}
                      placeholder="comercial@suaempresa.com"
                      onChange={e => setConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Evolution / Z-API WhatsApp */}
                <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    WhatsApp API (Evolution / Z-API)
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Evolution API Instance URL</label>
                    <input
                      type="text"
                      value={config.evolutionApiUrl || ''}
                      placeholder="https://sua-instancia.evolution-api.com"
                      onChange={e => setConfig(prev => ({ ...prev, evolutionApiUrl: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">API Key / Token Z-API</label>
                    <input
                      type="password"
                      value={config.evolutionApiKey || config.zapiToken || ''}
                      placeholder="Token de autenticação..."
                      onChange={e => setConfig(prev => ({ ...prev, evolutionApiKey: e.target.value, zapiToken: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Criahub CRM Webhook */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <label className="text-xs font-bold text-white block">
                  URL do Webhook Criahub CRM / n8n / Make
                </label>
                <p className="text-[11px] text-slate-400">
                  Ao clicar em "Disparar para Criahub CRM", o payload completo com BANT+, Tech Stack e Roteiro de IA é enviado para esta URL.
                </p>
                <input
                  type="text"
                  value={config.criahubWebhookUrl || ''}
                  placeholder="https://seu-n8n.com/webhook/criahub-crm-leads"
                  onChange={e => setConfig(prev => ({ ...prev, criahubWebhookUrl: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

            </div>
          )}

          {/* TAB: WEBHOOK SETTINGS ADMIN PANEL */}
          {activeTab === 'webhook_admin' && (
            <div className="space-y-6">
              <WebhookSettings />
            </div>
          )}

          {/* TAB 6: EMBED & IFRAME GENERATOR */}
          {activeTab === 'embed' && (
            <div className="space-y-6">
              
              <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Code className="w-4 h-4 text-amber-400" />
                      Gerador de Iframe & Integração Externa
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Incorpore o prospector de leads completo com IA, OSINT e SDR diretamente no seu site, sistema ou CRM de clientes.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded uppercase">
                    Modo Iframe Ativo
                  </span>
                </div>
              </div>

              {/* Parametros do Iframe */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Customização do Link & Parâmetros
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">País Padrão Inicial</label>
                    <select
                      value={embedCountry}
                      onChange={e => setEmbedCountry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="BR">Brasil (BRL / CNPJ / QSA)</option>
                      <option value="PT">Portugal (EUR / NIF / Racius)</option>
                      <option value="US">Estados Unidos (USD / Apollo)</option>
                      <option value="ES">Espanha (EUR / CIF)</option>
                      <option value="UK">Reino Unido (GBP / Companies House)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Cidade Padrão Inicial</label>
                    <input
                      type="text"
                      value={embedCity}
                      onChange={e => setEmbedCity(e.target.value)}
                      placeholder="Ex: São Paulo, Lisboa, etc."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Nicho / Palavra-Chave Opcional</label>
                    <input
                      type="text"
                      value={embedNiche}
                      onChange={e => setEmbedNiche(e.target.value)}
                      placeholder="Ex: Clínicas Odontológicas"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">ID do Cliente / Usuário (Isolamento de Dados)</label>
                    <input
                      type="text"
                      value={embedTenantId}
                      onChange={e => setEmbedTenantId(e.target.value)}
                      placeholder="Ex: user_123 ou tenant_empresa_a"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 block mb-1">Altura do Iframe (CSS)</label>
                    <input
                      type="text"
                      value={embedHeight}
                      onChange={e => setEmbedHeight(e.target.value)}
                      placeholder="Ex: 800px ou 100vh"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={embedHideHeader}
                        onChange={e => setEmbedHideHeader(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                      />
                      <span className="text-xs text-slate-300 font-semibold">Ocultar cabeçalho superior (Modo Compacto)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Snippets Gerados */}
              {(() => {
                const origin = typeof window !== 'undefined' ? window.location.origin : '';
                const path = typeof window !== 'undefined' ? window.location.pathname : '';
                const base = `${origin}${path}`;
                const params = new URLSearchParams();
                params.set('embed', 'true');
                if (embedCountry) params.set('country', embedCountry);
                if (embedCity) params.set('city', embedCity);
                if (embedNiche) params.set('niche', embedNiche);
                if (embedTenantId) params.set('tenant', embedTenantId);
                if (embedHideHeader) params.set('hideHeader', 'true');

                const embedUrl = `${base}?${params.toString()}`;
                const htmlSnippet = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="${embedHeight}"\n  style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"\n  allow="clipboard-read; clipboard-write"\n  loading="lazy"\n  title="Criahub B2B Prospector"\n></iframe>`;
                
                const reactSnippet = `export function B2BProspectorEmbed() {\n  return (\n    <iframe\n      src="${embedUrl}"\n      className="w-full h-[${embedHeight}] rounded-xl border-0 shadow-lg"\n      allow="clipboard-read; clipboard-write"\n      title="Criahub B2B Prospector"\n    />\n  );\n}`;

                return (
                  <div className="space-y-4">
                    
                    {/* Direct URL */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" />
                          Link Direto Standalone / URL para Iframe
                        </label>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(embedUrl);
                            setEmbedCopied('url');
                            setTimeout(() => setEmbedCopied(null), 2500);
                          }}
                          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded transition-colors"
                        >
                          {embedCopied === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{embedCopied === 'url' ? 'URL Copiada!' : 'Copiar URL'}</span>
                        </button>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 break-all select-all">
                        {embedUrl}
                      </div>
                    </div>

                    {/* HTML Iframe Snippet */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5" />
                          Código HTML para incorporar no seu Site (WordPress / Webflow / HTML)
                        </label>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(htmlSnippet);
                            setEmbedCopied('html');
                            setTimeout(() => setEmbedCopied(null), 2500);
                          }}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-1 rounded transition-colors"
                        >
                          {embedCopied === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{embedCopied === 'html' ? 'HTML Copiado!' : 'Copiar Código HTML'}</span>
                        </button>
                      </div>
                      <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto select-all leading-relaxed">
                        {htmlSnippet}
                      </pre>
                    </div>

                    {/* React JSX Snippet */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5" />
                          Componente React / Next.js
                        </label>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(reactSnippet);
                            setEmbedCopied('react');
                            setTimeout(() => setEmbedCopied(null), 2500);
                          }}
                          className="text-[11px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded transition-colors"
                        >
                          {embedCopied === 'react' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{embedCopied === 'react' ? 'React Copiado!' : 'Copiar Componente React'}</span>
                        </button>
                      </div>
                      <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-purple-300 overflow-x-auto select-all leading-relaxed">
                        {reactSnippet}
                      </pre>
                    </div>

                    {/* How It Works Explanations */}
                    <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl p-4 space-y-2 text-xs text-slate-300">
                      <span className="font-bold text-white block text-[11px] uppercase">💡 Recursos Suportados no Modo Iframe:</span>
                      <ul className="space-y-1 text-[11px] text-slate-400 list-disc pl-4">
                        <li><strong className="text-slate-200">Isolamento Multi-Tenant:</strong> Ao mudar o parâmetro <code className="text-amber-400 font-mono">tenant=SEU_ID</code>, cada usuário do seu sistema terá seus próprios leads e lotes sem misturar com outros.</li>
                        <li><strong className="text-slate-200">Zero Bloqueios de Iframe:</strong> O prospector roda como SPA client-side sem restrições de X-Frame-Options, funcionando perfeitamente em qualquer domínio externo.</li>
                        <li><strong className="text-slate-200">Pré-preenchimento:</strong> Pode definir a cidade, país e nicho na URL para já carregar os leads ideais para o nicho daquele cliente.</li>
                      </ul>
                    </div>

                  </div>
                );
              })()}

            </div>
          )}

          </main>
        </div>

        {/* Footer with Actions */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Configurações salvas e aplicadas com sucesso!
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Check className="w-4 h-4" />
              Salvar Todas as Configurações
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
