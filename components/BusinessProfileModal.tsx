import React, { useState, useEffect } from 'react';
import { BusinessProfile, AiEngineConfig, HighTicketNicheRecommendation } from '../types';
import { 
  X, Sparkles, Globe, Briefcase, DollarSign, Target, 
  CheckCircle, RefreshCw, AlertCircle, Zap, Shield, 
  Key, Cpu, Layers, ExternalLink, Activity, ArrowRight,
  TrendingUp, Building, Check, Sliders
} from 'lucide-react';
import { analyzeBusinessProfile } from '../services/geminiService';
import { saveBusinessProfile } from '../services/storageService';
import { getAiConfig, saveAiConfig, testGroqKey } from '../services/aiProviderService';
import { DEFAULT_HIGH_TICKET_NICHES } from '../constants';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: BusinessProfile;
  onSaveProfile: (newProfile: BusinessProfile) => void;
  onSelectNicheForSearch?: (niche: HighTicketNicheRecommendation) => void;
}

const BusinessProfileModal: React.FC<BusinessProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onSelectNicheForSearch
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'high_ticket_niches' | 'ai_keys'>('profile');
  const [formData, setFormData] = useState<BusinessProfile>({
    ...profile,
    recommendedHighTicketNiches: profile.recommendedHighTicketNiches?.length ? profile.recommendedHighTicketNiches : DEFAULT_HIGH_TICKET_NICHES
  });
  const [aiConfig, setAiConfig] = useState<AiEngineConfig>(getAiConfig());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [testingKeyIndex, setTestingKeyIndex] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; latencyMs: number; error?: string }>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...profile,
        recommendedHighTicketNiches: profile.recommendedHighTicketNiches?.length ? profile.recommendedHighTicketNiches : DEFAULT_HIGH_TICKET_NICHES
      });
      setAiConfig(getAiConfig());
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleDeepAnalysis = async () => {
    if (!formData.websiteUrl && !formData.servicesDescription) {
      setAnalysisError("Informe ao menos a URL do seu site ou a descrição dos seus serviços para a IA analisar.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const enriched = await analyzeBusinessProfile(formData);
      setFormData(enriched);
      onSaveProfile(enriched);
      saveBusinessProfile(enriched);
      setActiveTab('high_ticket_niches');
    } catch (err: any) {
      setAnalysisError(err.message || "Erro ao realizar análise profunda com IA.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTestGroqKey = async (index: number) => {
    const key = aiConfig.groqKeys[index];
    if (!key || !key.trim()) {
      setTestResults(prev => ({ ...prev, [index]: { success: false, latencyMs: 0, error: "Insira uma chave válida." } }));
      return;
    }

    setTestingKeyIndex(index);
    try {
      const res = await testGroqKey(key, aiConfig.groqModel);
      setTestResults(prev => ({ ...prev, [index]: res }));
      
      // Update key status in config
      const updatedStatuses = [...(aiConfig.keyStatuses || [])];
      updatedStatuses[index] = {
        index,
        keyPreview: `${key.trim().slice(0, 6)}...${key.trim().slice(-4)}`,
        status: res.success ? 'VALID' : 'ERROR',
        lastUsed: new Date().toLocaleTimeString(),
        errorMessage: res.error,
        requestsCount: (updatedStatuses[index]?.requestsCount || 0) + (res.success ? 1 : 0)
      };

      const updatedConfig = { ...aiConfig, keyStatuses: updatedStatuses };
      setAiConfig(updatedConfig);
      saveAiConfig(updatedConfig);
    } finally {
      setTestingKeyIndex(null);
    }
  };

  const handleGroqKeyChange = (index: number, val: string) => {
    const newKeys = [...aiConfig.groqKeys] as [string, string, string];
    newKeys[index] = val;
    const updated = { ...aiConfig, groqKeys: newKeys };
    setAiConfig(updated);
    saveAiConfig(updated);
  };

  const handleSave = () => {
    onSaveProfile(formData);
    saveBusinessProfile(formData);
    saveAiConfig(aiConfig);
    onClose();
  };

  const handleUseNicheAndSearch = (niche: HighTicketNicheRecommendation) => {
    onSaveProfile(formData);
    saveBusinessProfile(formData);
    if (onSelectNicheForSearch) {
      onSelectNicheForSearch(niche);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div 
        id="business-profile-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-fade-in"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 border-b border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Inteligência Estratégica & Provedores
                </span>
                {formData.lastAnalyzedAt && (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Perfil & Nichos Vetorizados
                  </span>
                )}
                {aiConfig.groqKeys.some(k => k.trim().length > 10) && (
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Groq 3-Key Pool Ativo
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1 flex items-center gap-2">
                Central de Inteligência do Negócio & Chaves de IA
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Insira o link do seu site para a IA mapear seu negócio, sugerir nichos de alto ticket e alternar chaves Groq/Gemini sem custo.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              1. Meu Negócio & Reverse ICP
            </button>

            <button
              onClick={() => setActiveTab('high_ticket_niches')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'high_ticket_niches'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              2. Nichos de Alto Ticket & Alta Conversão ({formData.recommendedHighTicketNiches?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('ai_keys')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ai_keys'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              3. Pool de 3 Chaves Groq & IA Fallback
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 space-y-6">
          
          {analysisError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3.5 text-xs text-red-700 flex items-center gap-2 rounded-lg shadow-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          {/* TAB 1: MEU NEGÓCIO & REVERSE ICP */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in">
              {/* Site URL Hero Card */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-xl shadow-md border border-indigo-700/40 space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/30 mb-2">
                      <Sparkles className="w-3 h-3 text-indigo-300" />
                      Scanner Inteligente de Domínio & Reverse ICP
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Coloque a URL do seu site para a IA mapear seu nicho e gerar prospects de Alto Ticket
                    </h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                      Nossa IA lê sua estrutura comercial, entende tudo o que você vende (sites, automações, SDRs, CRM, etc.) e localiza automaticamente os clientes com maior poder aquisitivo.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="url"
                      value={formData.websiteUrl}
                      onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                      placeholder="https://meusite.com.br"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-indigo-500/40 rounded-lg text-sm text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                  </div>

                  <button
                    onClick={handleDeepAnalysis}
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg transition-all disabled:opacity-50 shrink-0"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Analisando Site & Nichos...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        Escanear Site & Extrair Nichos
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome da Empresa */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    Nome da Minha Empresa / Agência
                  </label>
                  <input 
                    type="text"
                    value={formData.businessName}
                    onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Ex: Nexus AI Solutions"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Ticket Médio */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                    Ticket Médio Recomendado / Cobrado
                  </label>
                  <input 
                    type="text"
                    value={formData.ticketMedio}
                    onChange={e => setFormData({ ...formData, ticketMedio: e.target.value })}
                    placeholder="Ex: R$ 8.000 a R$ 35.000 / projeto (ou R$ 3.500/mês)"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>

                {/* Descrição dos Serviços */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Todos os Serviços e Soluções que Você Entrega
                  </label>
                  <textarea 
                    rows={2}
                    value={formData.servicesDescription}
                    onChange={e => setFormData({ ...formData, servicesDescription: e.target.value })}
                    placeholder="Ex: Criação de Sites de Alta Performance, Automações de IA no WhatsApp, SDRs de Atendimento 24/7, CRM e Gestão de Tráfego"
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>

                {/* ICP Alvo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-600" />
                    Perfil de Cliente Ideal (ICP) de Alto Ticket
                  </label>
                  <input 
                    type="text"
                    value={formData.icpTarget}
                    onChange={e => setFormData({ ...formData, icpTarget: e.target.value })}
                    placeholder="Ex: Clínicas Médicas, Escritórios de Advocacia, Incorporadoras e Empresas B2B"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Extracted UVP & Vectors View */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Inteligência Estratégica Extraída pela IA
                </h4>

                {/* UVP */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-xs font-bold text-indigo-900 uppercase flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-indigo-600" />
                    Proposta Única de Valor (UVP)
                  </span>
                  <p className="text-sm text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    "{formData.uvp}"
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Dores que Resolvemos */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-red-800 uppercase flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                      Dores que Resolvemos
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {formData.solvedPains.map((pain, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 bg-red-50/50 p-1.5 rounded">
                          <span className="text-red-500 font-bold">•</span>
                          <span>{pain}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Diferenciais Competitivos */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                    <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Diferenciais Competitivos
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {formData.competitiveDifferentials.map((diff, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 bg-emerald-50/50 p-1.5 rounded">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NICHOS DE ALTO TICKET & ALTA CONVERSÃO */}
          {activeTab === 'high_ticket_niches' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    Oportunidades de Alto Ticket Mapeadas para sua Empresa
                  </h3>
                  <p className="text-xs text-indigo-800 mt-0.5">
                    A IA identificou esses nichos com capacidade de pagar 5 a 6 dígitos pelos seus projetos e com dores urgentes de atendimento digital.
                  </p>
                </div>
                <button
                  onClick={handleDeepAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  Recalcular Nichos
                </button>
              </div>

              {/* Grid of High Ticket Niches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.recommendedHighTicketNiches || DEFAULT_HIGH_TICKET_NICHES).map((nicheItem, idx) => (
                  <div 
                    key={nicheItem.id || idx}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            {nicheItem.category}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                            {nicheItem.niche}
                          </h4>
                        </div>
                        <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold shrink-0">
                          {nicheItem.tag}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-slate-800">Por que é perfeito:</strong> {nicheItem.whyGoodMatch}
                      </p>

                      <div className="space-y-1 text-xs">
                        <span className="font-bold text-red-700 text-[11px] uppercase tracking-wider">
                          Gaps Críticos Identificados:
                        </span>
                        <ul className="space-y-1 text-slate-700 pl-1">
                          {nicheItem.criticalGaps.map((gap, gIdx) => (
                            <li key={gIdx} className="flex items-start gap-1">
                              <span className="text-red-500 font-bold">•</span>
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-indigo-50/70 p-2 rounded-lg border border-indigo-100 text-xs text-indigo-900">
                        <strong>Pacote Sugerido:</strong> {nicheItem.suggestedOfferBundle}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-700">
                        {nicheItem.estimatedTicket}
                      </span>

                      <button
                        onClick={() => handleUseNicheAndSearch(nicheItem)}
                        className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-all shadow"
                      >
                        <span>Prospectar este Nicho</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: POOL DE 3 CHAVES GROQ & IA FALLBACK */}
          {activeTab === 'ai_keys' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Pool de Alta Disponibilidade: 3 Chaves de API do Groq
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Adicione até 3 chaves do Groq (gratuitas). O sistema rotaciona automaticamente se houver limite de taxa (429) e faz fallback transparente para o Gemini.
                      </p>
                    </div>
                  </div>
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-300 hover:text-indigo-200 underline font-medium"
                  >
                    <span>Criar chaves gratuitas no Groq</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Provider Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...aiConfig, activeProvider: 'auto' as const };
                    setAiConfig(updated);
                    saveAiConfig(updated);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aiConfig.activeProvider === 'auto'
                      ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Auto Inteligente (Recomendado)</span>
                    {aiConfig.activeProvider === 'auto' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Prioriza Groq 3-Key Pool e alterna para Gemini 2.5 Flash sem interrupções.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...aiConfig, activeProvider: 'groq' as const };
                    setAiConfig(updated);
                    saveAiConfig(updated);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aiConfig.activeProvider === 'groq'
                      ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Groq Pool Exclusivo</span>
                    {aiConfig.activeProvider === 'groq' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Usa Llama 3.3 70B com rotação entre as 3 chaves informadas.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...aiConfig, activeProvider: 'gemini' as const };
                    setAiConfig(updated);
                    saveAiConfig(updated);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aiConfig.activeProvider === 'gemini'
                      ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">Gemini 2.5 Flash</span>
                    {aiConfig.activeProvider === 'gemini' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Usa a infraestrutura nativa do Google AI com Maps e Search Grounding.
                  </p>
                </button>
              </div>

              {/* 3 Groq Keys Inputs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  Chaves de API do Groq (Até 3 Chaves)
                </h4>

                {[0, 1, 2].map((idx) => {
                  const keyVal = aiConfig.groqKeys[idx] || "";
                  const statusObj = aiConfig.keyStatuses?.[idx];
                  const testRes = testResults[idx];
                  const isTesting = testingKeyIndex === idx;

                  return (
                    <div 
                      key={idx}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center border border-slate-300">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Groq API Key {idx + 1}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          {statusObj?.status === 'VALID' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Válida & Pronta
                            </span>
                          ) : statusObj?.status === 'RATE_LIMITED' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Limite Atingido (Rotacionado)
                            </span>
                          ) : statusObj?.status === 'ERROR' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Erro na Chave
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                              Não testada
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input 
                          type="password"
                          value={keyVal}
                          onChange={e => handleGroqKeyChange(idx, e.target.value)}
                          placeholder="gsk_..."
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleTestGroqKey(idx)}
                          disabled={isTesting || !keyVal.trim()}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all disabled:opacity-40"
                        >
                          {isTesting ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          ) : (
                            <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          )}
                          <span>Testar</span>
                        </button>
                      </div>

                      {testRes && (
                        <div className={`text-[11px] p-2 rounded ${testRes.success ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
                          {testRes.success ? (
                            <span>✅ Chave validada com sucesso em {testRes.latencyMs}ms ({aiConfig.groqModel}).</span>
                          ) : (
                            <span>❌ Falha no teste: {testRes.error}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Model Choice */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Modelo Groq Ativo
                </label>
                <select
                  value={aiConfig.groqModel}
                  onChange={e => {
                    const updated = { ...aiConfig, groqModel: e.target.value };
                    setAiConfig(updated);
                    saveAiConfig(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recomendado - Ultra Inteligente)</option>
                  <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B 32k (Ultra Rápido)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Ultra Econômico)</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fechar
          </button>
          
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Salvar e Aplicar Configurações
          </button>
        </div>

      </div>
    </div>
  );
};

export default BusinessProfileModal;
