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
import { getRapidApiToken, saveRapidApiToken } from '../services/letscrapeService';
import { DEFAULT_HIGH_TICKET_NICHES, GEMINI_MODELS, GROQ_MODELS } from '../constants';
import { getSavedCountry, getCurrencyConfig } from '../services/countryService';

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
  const [activeTab, setActiveTab] = useState<'profile' | 'high_ticket_niches' | 'ai_keys' | 'rgpd_identity'>('profile');
  const [formData, setFormData] = useState<BusinessProfile>({
    ...profile,
    senderName: profile.senderName || 'Nivaldo Freitas',
    senderRole: profile.senderRole || 'Estrategista Digital & Consultoria Digital Independente',
    useGenericSenderOnFirstContact: profile.useGenericSenderOnFirstContact ?? true,
    rgpdOptOutNotice: profile.rgpdOptOutNotice || 'Aviso de Privacidade & RGPD: Esta comunicação destina-se estritamente ao âmbito profissional B2B. Caso não pretenda receber futuros contactos ou pretenda a eliminação imediata dos seus dados, responda a esta mensagem com a palavra "STOP". O seu endereço será automaticamente bloqueado no nosso sistema.',
    recommendedHighTicketNiches: profile.recommendedHighTicketNiches?.length ? profile.recommendedHighTicketNiches : DEFAULT_HIGH_TICKET_NICHES
  });
  const [aiConfig, setAiConfig] = useState<AiEngineConfig>(getAiConfig());
  const [rapidApiToken, setRapidApiToken] = useState<string>(getRapidApiToken());
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
      setRapidApiToken(getRapidApiToken());
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

            <button
              onClick={() => setActiveTab('rgpd_identity')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'rgpd_identity'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-rose-300" />
              4. Identidade de Contacto & RGPD (STOP)
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
                    placeholder={`Ex: ${getCurrencyConfig(getSavedCountry()).symbol} 8.000 a ${getCurrencyConfig(getSavedCountry()).symbol} 35.000 / projeto (ou ${getCurrencyConfig(getSavedCountry()).symbol} 3.500/mês) — moeda de ${getSavedCountry()}`}
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
                    placeholder="Ex: Clínicas Médicas, Energia Solar, Incorporadoras, Veículos Premium e Empresas B2B"
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
                    Prioriza Groq 3-Key Pool e alterna para Gemini (auto-fallback) sem interrupções.
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
                    <span className="text-xs font-bold text-slate-900">Gemini (Google AI)</span>
                    {aiConfig.activeProvider === 'gemini' && <Check className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Usa a infraestrutura nativa do Google AI com o modelo selecionado abaixo.
                  </p>
                </button>
              </div>

              {/* RapidAPI LetScrape Token (fonte de leads reais) */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    Token RapidAPI — LetScrape (Leads Reais)
                  </label>
                  {rapidApiToken.trim().length > 10 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Configurada
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                      Necessária p/ leads reais
                    </span>
                  )}
                </div>
                <input
                  type="password"
                  value={rapidApiToken}
                  onChange={e => {
                    setRapidApiToken(e.target.value);
                    saveRapidApiToken(e.target.value);
                  }}
                  placeholder="Cole sua RapidAPI Key (local-business-data)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  Fonte primária de prospecção: retorna <strong>empresas reais</strong> do Google Maps
                  (nome, site que abre, telefone, avaliações). Fallback gratuito: OpenStreetMap. A IA
                  (Groq/Gemini) apenas <strong>enriquece</strong> essas empresas — nunca inventa dados.
                </p>
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
                  value={aiConfig.groqModel || 'llama-3.3-70b-versatile'}
                  onChange={e => {
                    const updated = { ...aiConfig, groqModel: e.target.value };
                    setAiConfig(updated);
                    saveAiConfig(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {GROQ_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  {GROQ_MODELS.find(m => m.id === (aiConfig.groqModel || 'llama-3.3-70b-versatile'))?.note || '100% Gratuito no console.groq.com'}
                </p>
              </div>

              {/* Gemini Model Choice */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                  Modelo Gemini Ativo
                </label>
                <select
                  value={aiConfig.geminiModel || 'gemini-3.6-flash'}
                  onChange={e => {
                    const updated = { ...aiConfig, geminiModel: e.target.value };
                    setAiConfig(updated);
                    saveAiConfig(updated);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {GEMINI_MODELS.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  {GEMINI_MODELS.find(m => m.id === (aiConfig.geminiModel || 'gemini-3.6-flash'))?.note}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: IDENTIDADE DE CONTACTO & RGPD (STOP) */}
          {activeTab === 'rgpd_identity' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white p-5 rounded-xl shadow-md border border-rose-800/40 space-y-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/40">
                  <Shield className="w-3.5 h-3.5 text-rose-400" />
                  Proteção Jurídica RGPD / LGPD & Abordagem Humanizada
                </div>
                <h3 className="text-base font-bold text-white">
                  Identidade do Primeiro Contacto & Cláusula de Opt-Out "STOP"
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Para evitar multas de proteção de dados e aumentar a taxa de resposta, o primeiro contacto por e-mail e WhatsApp é enviado de forma <strong>genérica e consultiva</strong>, assinado exclusivamente pelo seu nome pessoal como estrategista independente, sem citar nome de agência. No rodapé, o destinatário pode responder <strong>"STOP"</strong> para ser bloqueado permanentemente.
                </p>
              </div>

              {/* Form Fields */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-2xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome do Remetente */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Nome do Remetente (Assinatura do 1º Contacto)
                    </label>
                    <input
                      type="text"
                      value={formData.senderName || ''}
                      onChange={e => setFormData({ ...formData, senderName: e.target.value })}
                      placeholder="Nivaldo Freitas"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-slate-800"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Nome que aparecerá na assinatura do Gmail e na abertura do WhatsApp.
                    </p>
                  </div>

                  {/* Cargo / Especialidade */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Título / Especialidade Profissional
                    </label>
                    <input
                      type="text"
                      value={formData.senderRole || ''}
                      onChange={e => setFormData({ ...formData, senderRole: e.target.value })}
                      placeholder="Estrategista Digital & Consultoria Digital Independente"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none font-semibold text-slate-800"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Posicionamento neutro e de alta autoridade para o primeiro contato.
                    </p>
                  </div>
                </div>

                {/* Switch: Não citar agência no 1º contato */}
                <div className="flex items-start gap-3 p-3.5 bg-rose-50/50 rounded-xl border border-rose-200">
                  <input
                    type="checkbox"
                    id="useGenericSenderOnFirstContact"
                    checked={formData.useGenericSenderOnFirstContact ?? true}
                    onChange={e => setFormData({ ...formData, useGenericSenderOnFirstContact: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                  />
                  <label htmlFor="useGenericSenderOnFirstContact" className="cursor-pointer text-xs text-slate-700">
                    <strong className="text-slate-900 block font-bold">
                      Modo Genérico Ativo no 1º Contacto (Recomendado)
                    </strong>
                    Não citar o nome da agência/empresa no primeiro contacto por e-mail ou WhatsApp. A abordagem é realizada estritamente pelo consultor/estrategista independente ({formData.senderName || 'Nivaldo Freitas'}), gerando muito mais proximidade e conformidade com o RGPD.
                  </label>
                </div>

                {/* Texto do Aviso de Opt-Out RGPD */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>Aviso Legal de Privacidade & Instrução "STOP" (Rodapé do E-mail)</span>
                    <span className="text-[10px] text-rose-600 font-normal">Conforme RGPD Art. 17º e 21º</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.rgpdOptOutNotice || ''}
                    onChange={e => setFormData({ ...formData, rgpdOptOutNotice: e.target.value })}
                    placeholder="Aviso de Privacidade & RGPD: Esta comunicação destina-se estritamente ao âmbito profissional B2B. Caso não pretenda receber futuros contactos ou pretenda a eliminação imediata dos seus dados, responda a esta mensagem com a palavra 'STOP'. O seu endereço será automaticamente bloqueado no nosso sistema."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none leading-relaxed text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Este texto é anexado no final de todas as abordagens diretas. Se o destinatário responder "STOP", o sistema bloqueia novos envios para sempre.
                  </p>
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Exemplo de Assinatura Automática no Gmail & WhatsApp:
                </span>
                <div className="font-mono text-[11px] bg-slate-950 p-3 rounded-lg border border-slate-800 text-slate-300 whitespace-pre-wrap leading-relaxed">
{`Com os melhores cumprimentos,

${formData.senderName || 'Nivaldo Freitas'}
${formData.senderRole || 'Estrategista Digital & Consultoria Digital Independente'}

---
${formData.rgpdOptOutNotice || 'Aviso de Privacidade & RGPD: Esta comunicação destina-se estritamente ao âmbito profissional B2B. Caso não pretenda receber futuros contactos ou pretenda a eliminação imediata dos seus dados, responda com a palavra "STOP".'}`}
                </div>
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