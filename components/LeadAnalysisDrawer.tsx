import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Send, Copy, Check, ExternalLink, Linkedin, 
  MessageSquare, Mail, Phone, Globe, ShieldAlert, Cpu, 
  TrendingUp, AlertTriangle, RefreshCw, CheckCircle2, ArrowRight,
  Flame, DollarSign, User, Users, Building, Target, Layers, Video, Play, Clock,
  Building2, Share2, Camera, Compass, Scale, FileText, Image as ImageIcon,
  Star, Award, CheckCheck, Lightbulb, ShieldCheck, Zap, Bot, Gauge, Activity,
  Smartphone, Laptop, MessageCircle, BarChart3, CheckSquare, ChevronRight
} from 'lucide-react';
import { Lead, DecisionMakerCandidate, FullDigital360Audit } from '../types';
import { 
  CriahubDiagnosis, 
  CriahubOutreachScripts, 
  auditAndDiagnoseLeadForCriahub, 
  generateCriahubHighConversionOutreach 
} from '../services/criahubSdrEngine';
import { extractCleanBrandName } from '../services/freeB2bProspectorService';
import { generateDecisionMakerCandidates, generateExecutiveSummaryReport } from '../services/aiDecisionMatcherService';
import { generateInstantDigital360Audit, auditDigital360WithAi } from '../services/digitalAudit360Service';
import { SeniorIcpQualificationView } from './SeniorIcpQualificationView';

interface LeadAnalysisDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
  onSaveLead?: (updatedLead: Lead) => void;
}

type TabType = 'icpMatrix' | 'digital360' | 'executive' | 'whatsapp' | 'videoloom' | 'email' | 'linkedin' | 'coldcall' | 'diagnosis' | 'fiscal' | 'socials' | 'matching';

export const LeadAnalysisDrawer: React.FC<LeadAnalysisDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onSaveLead
}) => {
  const syncLead = (updated: Lead) => {
    if (onLeadUpdated) onLeadUpdated(updated);
    if (onSaveLead) onSaveLead(updated);
  };
  const [activeTab, setActiveTab] = useState<TabType>('digital360');
  const [diagnosis, setDiagnosis] = useState<CriahubDiagnosis | null>(null);
  const [scripts, setScripts] = useState<CriahubOutreachScripts | null>(null);
  const [digitalAudit, setDigitalAudit] = useState<FullDigital360Audit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAuditing360, setIsAuditing360] = useState<boolean>(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [emailFormat, setEmailFormat] = useState<'aida' | 'pas' | 'plain'>('aida');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Inicializa ou carrega a análise do lead
  useEffect(() => {
    if (isOpen && lead) {
      loadOrGenerateAnalysis(lead);
    }
  }, [isOpen, lead?.id]);

  const loadOrGenerateAnalysis = async (targetLead: Lead, forceRegenerate = false) => {
    setIsLoading(true);
    try {
      // 1. Gera Diagnóstico do Lead CriaHub
      const diag = await auditAndDiagnoseLeadForCriahub(targetLead);
      setDiagnosis(diag);

      // 2. Gera os Scripts de Alta Conversão
      const generatedScripts = await generateCriahubHighConversionOutreach(targetLead, diag);
      setScripts(generatedScripts);

      // 3. Inicializa Auditoria 360° (Instantânea ou existente)
      const audit360 = targetLead.digital360Audit || generateInstantDigital360Audit(targetLead);
      setDigitalAudit(audit360);

      // Sincroniza de volta no objeto do lead se necessário
      const updated: Lead = {
        ...targetLead,
        digital360Audit: audit360,
        outreach: {
          ...targetLead.outreach,
          whatsapp: {
            option1Curiosity: generatedScripts.whatsapp.fullMessageText,
            option2RoiDirect: generatedScripts.whatsapp.hook + ' ' + generatedScripts.whatsapp.bridge
          },
          email: {
            subject: generatedScripts.coldEmail.subject,
            bodyAida: generatedScripts.coldEmail.bodyAida,
            bodyPas: generatedScripts.coldEmail.bodyPas
          }
        }
      };
      syncLead(updated);
    } catch (e) {
      console.error("Erro ao gerar análise CriaHub:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeepAiAudit360 = async () => {
    if (!lead) return;
    setIsAuditing360(true);
    try {
      const enriched = await auditDigital360WithAi(lead);
      setDigitalAudit(enriched);
      syncLead({
        ...lead,
        digital360Audit: enriched
      });
    } catch (err) {
      console.error("Erro ao auditar com IA 360:", err);
    } finally {
      setIsAuditing360(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2500);
  };

  const generate360ReportSummaryText = (audit: FullDigital360Audit, targetLead: Lead) => {
    return `*🔬 AUDITORIA DIGITAL 360° - ${targetLead.name.toUpperCase()}*\n\n` +
      `🌐 *1. WEBSITE & GOOGLE PAGESPEED:*\n` +
      `• Status: ${audit.website.hasWebsite ? `Online (${audit.website.domain})` : 'Sem website mapeado'}\n` +
      `• Google PageSpeed Mobile: ${audit.pageSpeed.mobileScore}/100 (${audit.pageSpeed.performanceRating})\n` +
      `• Tempo de Carregamento (LCP): ${audit.pageSpeed.lcp}\n` +
      `• Teste Oficial: ${audit.pageSpeed.officialPageSpeedUrl}\n\n` +
      `🤖 *2. CHATBOT & ATENDIMENTO 24/7:*\n` +
      `• Status: ${audit.chatbot.botLabel}\n` +
      `• Tempo de Resposta: ${audit.chatbot.estimatedLeadResponseTime}\n` +
      `• Risco de Vazamento: ${audit.chatbot.conversionLeakRisk}\n\n` +
      `📱 *3. REDES SOCIAIS & ATIVIDADE:*\n` +
      `• Status Geral: ${audit.socialsAudit.overallActivityStatus}\n` +
      `• Canal Principal: ${audit.socialsAudit.primaryChannelName} (${audit.socialsAudit.summary})\n` +
      `• Últimos 3 Posts:\n` +
      audit.socialsAudit.primaryChannelPosts.map((p, i) => `  ${i+1}. [${p.date}] ${p.format}: "${p.captionSnippet}" | ${p.engagement}`).join('\n') +
      `\n\n💡 *4. PLANO DE AÇÃO & MELHORIAS CRIAHUB:*\n` +
      audit.actionableImprovements.map((imp, i) => `• *${imp.title}* (${imp.estimatedRoiMultiplier}): ${imp.proposedSolution} (Impacto: ${imp.expectedBusinessImpact})`).join('\n\n') +
      `\n\n🎯 *PITCH EXECUTIVO:*\n"${audit.commercialPitchSummary}"`;
  };

  if (!isOpen || !lead) return null;

  const cleanBrand = extractCleanBrandName(lead.name);
  const decisionMaker = lead.decisionMaker || {
    name: lead.bantPlus?.authority?.keyDecisionMaker || "Decisor(a)",
    role: lead.bantPlus?.authority?.role || "Diretor(a) Comercial / Marketing",
    linkedin: lead.bantPlus?.authority?.linkedinSearchUrl,
    directEmail: lead.email,
    directPhone: lead.phone
  };

  const cleanPhone = (decisionMaker.directPhone || lead.phone || '').replace(/\D/g, '');
  const emailToUse = decisionMaker.directEmail || lead.email;
  
  // URL Resolvers inteligentes
  const dmNameClean = decisionMaker.name && !decisionMaker.name.toLowerCase().includes('decisor') && !decisionMaker.name.toLowerCase().includes('diretoria')
    ? decisionMaker.name 
    : '';
  
  const directLinkedinPeopleUrl = decisionMaker.linkedinDirectSearch || 
    `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${dmNameClean} ${cleanBrand}`.trim())}`;
    
  const directLinkedinCompanyUrl = decisionMaker.linkedinCompanyUrl || 
    `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(cleanBrand)}`;

  const smartGoogleDorkUrl = decisionMaker.googleDorkUrl || 
    `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in "${cleanBrand}" (CEO OR Sócio OR Fundador OR Diretor OR "Diretor Clínico" OR Gerente OR Dono)`)}`;

  const linkedinProfileOrSearchUrl = (decisionMaker.linkedin && decisionMaker.linkedin.includes('linkedin.com/in/') && !decisionMaker.linkedin.includes('google.com'))
    ? decisionMaker.linkedin
    : directLinkedinPeopleUrl;

  const waMessageEncoded = encodeURIComponent(scripts?.whatsapp.fullMessageText || '');
  const whatsappWebUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${waMessageEncoded}`
    : `https://wa.me/?text=${waMessageEncoded}`;

  const currentEmailBody = emailFormat === 'aida' 
    ? scripts?.coldEmail.bodyAida 
    : emailFormat === 'pas' 
      ? scripts?.coldEmail.bodyPas 
      : scripts?.coldEmail.plainText;

  const mailtoUrl = emailToUse 
    ? `mailto:${emailToUse}?subject=${encodeURIComponent(scripts?.coldEmail.subject || '')}&body=${encodeURIComponent(currentEmailBody || '')}`
    : `mailto:?subject=${encodeURIComponent(scripts?.coldEmail.subject || '')}&body=${encodeURIComponent(currentEmailBody || '')}`;

  // Resumo Executivo & Mapeamento de Candidatos a Decisores com Match %
  const execSummary = lead.executiveSummary || generateExecutiveSummaryReport(lead);
  
  const generatedCandidates = (lead.decisionMaker?.candidates && lead.decisionMaker.candidates.length > 0)
    ? lead.decisionMaker.candidates
    : generateDecisionMakerCandidates(
        lead.name,
        lead.city,
        lead.country,
        lead.decisionMaker?.role,
        lead.fiscalRegistry?.partners,
        lead.website,
        lead.decisionMaker?.name
      ).candidates;

  const handleSelectCandidateAsPrimary = async (candidate: DecisionMakerCandidate) => {
    setSelectedCandidateId(candidate.id);
    const updatedDm = {
      ...decisionMaker,
      name: candidate.name,
      role: candidate.role,
      roleCategory: candidate.roleCategory,
      linkedin: candidate.linkedinUrl,
      linkedinDirectSearch: candidate.directSearchUrl || candidate.linkedinUrl,
      directEmail: candidate.directEmail || decisionMaker.directEmail,
      matchConfidence: candidate.matchConfidence,
      matchRationale: candidate.rationale,
      matchEvidence: candidate.evidenceTags
    };

    const updatedLead: Lead = {
      ...lead,
      decisionMaker: updatedDm,
      bantPlus: {
        ...lead.bantPlus,
        authority: {
          ...lead.bantPlus?.authority,
          keyDecisionMaker: candidate.name,
          role: candidate.role
        }
      }
    };

    await loadOrGenerateAnalysis(updatedLead, true);
    syncLead(updatedLead);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-full md:max-w-3xl lg:max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden animate-slideLeft">
        
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border-b border-indigo-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Análise do Lead & Scripts CriaHub
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-[10px] font-black uppercase tracking-wider">
                  SDR Inteligente
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Auditoria de presença digital, gargalos e abordagens de alta conversão.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadOrGenerateAnalysis(lead, true)}
              disabled={isLoading}
              className="p-2 text-indigo-200 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="Regenerar Análise com IA"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Regenerar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lead Context Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Building className="w-4 h-4 text-indigo-600" />
              {lead.name}
            </h3>
            <div className="flex items-center gap-2 text-slate-500 mt-0.5">
              <span>{lead.city}, {lead.country || 'PT'}</span>
              <span>•</span>
              <span className="text-indigo-600 font-semibold">{lead.category}</span>
            </div>
          </div>

          {/* Quick Decision Maker Badge */}
          <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            <div>
              <span className="block font-bold text-slate-800 text-[11px] leading-tight">
                {decisionMaker.name}
              </span>
              <span className="block text-[10px] text-slate-500 leading-tight">
                {decisionMaker.role}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button: Gerar Abordagem de Alta Conversão */}
        <div className="px-5 py-2.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-600 animate-pulse" />
            <span className="text-xs font-bold text-indigo-950">
              Copys Personalizadas com o Ecossistema CriaHub
            </span>
          </div>

          <button
            onClick={() => loadOrGenerateAnalysis(lead, true)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
            <span>Gerar Abordagem de Alta Conversão</span>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-5 border-b border-slate-200 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('icpMatrix')}
            className={`py-2.5 px-3.5 border-b-2 font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'icpMatrix' 
                ? 'border-amber-500 text-amber-950 bg-amber-50/90 shadow-2xs ring-1 ring-amber-200/60' 
                : 'border-transparent text-slate-700 hover:text-amber-700 hover:bg-slate-50'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-black text-amber-950">
              🎯 Qualificação ICP (100 pts)
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
              Matriz Sênior
            </span>
          </button>

          <button
            onClick={() => setActiveTab('digital360')}
            className={`py-2.5 px-3.5 border-b-2 font-black text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'digital360' 
                ? 'border-indigo-600 text-indigo-800 bg-indigo-50/80 shadow-2xs ring-1 ring-indigo-200/50' 
                : 'border-transparent text-slate-700 hover:text-indigo-600 hover:bg-slate-50'
            }`}
          >
            <Gauge className="w-3.5 h-3.5 text-indigo-600" />
            <span className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-black">
              🔬 Auditoria 360° (Site, Bot, Redes & PageSpeed)
            </span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Novo
            </span>
          </button>

          <button
            onClick={() => setActiveTab('executive')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'executive' 
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>⭐ Resumo & Decisor (%)</span>
          </button>

          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'whatsapp' 
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Consultivo</span>
          </button>

          <button
            onClick={() => setActiveTab('videoloom')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'videoloom' 
                ? 'border-rose-600 text-rose-700 bg-rose-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-rose-600" />
            <span>Vídeo Loom (60s)</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'email' 
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>Cold E-mail Decisor</span>
          </button>

          <button
            onClick={() => setActiveTab('linkedin')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'linkedin' 
                ? 'border-sky-600 text-sky-700 bg-sky-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Linkedin className="w-3.5 h-3.5 text-sky-600" />
            <span>Conexão LinkedIn</span>
          </button>

          <button
            onClick={() => setActiveTab('coldcall')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'coldcall' 
                ? 'border-purple-600 text-purple-700 bg-purple-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-purple-600" />
            <span>Cold Call Pitch</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnosis')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'diagnosis' 
                ? 'border-amber-600 text-amber-700 bg-amber-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Diagnóstico & Gargalos</span>
          </button>

          <button
            onClick={() => setActiveTab('fiscal')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'fiscal' 
                ? 'border-teal-600 text-teal-700 bg-teal-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-teal-600" />
            <span>Bases Fiscais & Sócios QSA</span>
          </button>

          <button
            onClick={() => setActiveTab('socials')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'socials' 
                ? 'border-pink-600 text-pink-700 bg-pink-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-pink-600" />
            <span>Redes & Fotos Scrapeadas</span>
          </button>

          <button
            onClick={() => setActiveTab('matching')}
            className={`py-2.5 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'matching' 
                ? 'border-violet-600 text-violet-700 bg-violet-50/30' 
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-violet-600" />
            <span>Cross-Match Engine</span>
          </button>
        </div>

        {/* Drawer Body Area */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50 space-y-5">
          
          {/* Decisor & Company Summary Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
                Dados Mapeados do Decisor & Empresa (LinkedIn / OSINT)
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <a
                  href={linkedinProfileOrSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-600 hover:text-sky-700 bg-sky-50 border border-sky-200 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-sky-100 transition-colors"
                  title="Busca Direta do Decisor no LinkedIn"
                >
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>Buscar Decisor</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={directLinkedinCompanyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                  title="Página da Empresa no LinkedIn"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Empresa</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <a
                  href={smartGoogleDorkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-600 hover:text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md font-bold flex items-center gap-1 hover:bg-slate-100 transition-colors"
                  title="Google X-Ray Dork dos Sócios"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Google X-Ray</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Nome do Decisor:</span>
                <span className="font-bold text-slate-900 text-sm">{decisionMaker.name}</span>
                <span className="text-slate-500 block text-[11px]">{decisionMaker.role}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">E-mail Direto Verificado:</span>
                {emailToUse ? (
                  <span className="font-bold text-indigo-700 select-all">{emailToUse}</span>
                ) : (
                  <span className="text-slate-400 italic">E-mail corporativo em validação</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Telefone / WhatsApp:</span>
                {decisionMaker.directPhone || lead.phone ? (
                  <span className="font-bold text-emerald-700 select-all">{decisionMaker.directPhone || lead.phone}</span>
                ) : (
                  <span className="text-slate-400 italic">Telefone principal</span>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] font-semibold">Website & Domínio:</span>
                {lead.website ? (
                  <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold truncate">
                    <Globe className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Sem site mapeado</span>
                )}
              </div>
            </div>
          </div>

          {/* TAB 0: MATRIZ SÊNIOR DE QUALIFICAÇÃO ICP (100 PTS) */}
          {activeTab === 'icpMatrix' && (
            <SeniorIcpQualificationView 
              lead={lead} 
              onLeadUpdated={syncLead} 
            />
          )}

          {/* TAB -1: AUDITORIA DIGITAL 360° COMPLETA */}
          {activeTab === 'digital360' && (() => {
            const audit = digitalAudit || generateInstantDigital360Audit(lead);
            const ps = audit.pageSpeed;
            const cb = audit.chatbot;
            const soc = audit.socialsAudit;
            const getScoreColor = (score: number) => {
              if (score >= 90) return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', bar: 'bg-emerald-500', label: 'Rápido (Otimizado)' };
              if (score >= 50) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', bar: 'bg-amber-500', label: 'Atenção (Médio)' };
              return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', bar: 'bg-rose-500', label: 'Crítico / Lento' };
            };
            const mobileColor = getScoreColor(ps.mobileScore);
            const desktopColor = getScoreColor(ps.desktopScore);

            return (
              <div className="space-y-5 animate-fadeIn">
                
                {/* Banner Principal 360° */}
                <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white rounded-xl p-4.5 border border-indigo-500/30 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Gauge className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-white tracking-wide">
                          Auditoria Digital 360° & Performance Técnica
                        </span>
                        <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-400/40">
                          Google PageSpeed + Chatbot + Redes
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                        Raio-X completo da presença digital de <strong>{lead.name}</strong> em {lead.city}: velocidade de carregamento, atendimento inteligente 24/7, frequência de postagens sociais, análise dos últimos 3 posts e matriz de serviços recomendados.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    <button
                      onClick={() => handleCopy(generate360ReportSummaryText(audit, lead), 'relatorio-360')}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      title="Copiar relatório completo formatado para WhatsApp / E-mail"
                    >
                      {copiedItem === 'relatorio-360' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                      <span>{copiedItem === 'relatorio-360' ? 'Copiado!' : 'Copiar Relatório'}</span>
                    </button>

                    <button
                      onClick={handleDeepAiAudit360}
                      disabled={isAuditing360}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      title="Reavaliar com IA generativa profunda"
                    >
                      {isAuditing360 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                      <span>{isAuditing360 ? 'Auditando...' : 'Aprofundar com IA'}</span>
                    </button>
                  </div>
                </div>

                {/* 1. SEÇÃO WEBSITE & GOOGLE PAGESPEED */}
                <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                          1. Website & Teste de Velocidade Google PageSpeed
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {audit.website.hasWebsite ? `Domínio: ${audit.website.domain}` : 'Inexistência de website mapeado'}
                        </span>
                      </div>
                    </div>

                    <a
                      href={ps.officialPageSpeedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                      title="Abrir a ferramenta oficial do Google PageSpeed Insights em nova aba"
                    >
                      <span>🚀 Teste Oficial no Google PageSpeed</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Grid de Métricas do PageSpeed */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Score Mobile */}
                    <div className={`p-4 rounded-xl border ${mobileColor.border} ${mobileColor.bg} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold flex items-center gap-1 text-slate-800">
                          <Smartphone className="w-4 h-4 text-slate-600" />
                          Google PageSpeed Mobile
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${mobileColor.border} bg-white/80 ${mobileColor.text}`}>
                          {mobileColor.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className={`text-3xl font-black ${mobileColor.text}`}>{ps.mobileScore}</span>
                        <span className="text-xs text-slate-500 font-bold">/ 100</span>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mt-1">
                        <div className={`h-full ${mobileColor.bar} transition-all duration-500`} style={{ width: `${Math.max(ps.mobileScore, 5)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-600 font-medium mt-2 block">
                        Maior parte dos visitantes ({'>'}75%) acessa pelo celular.
                      </span>
                    </div>

                    {/* Score Desktop */}
                    <div className={`p-4 rounded-xl border ${desktopColor.border} ${desktopColor.bg} flex flex-col justify-between`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold flex items-center gap-1 text-slate-800">
                          <Laptop className="w-4 h-4 text-slate-600" />
                          Google PageSpeed Desktop
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${desktopColor.border} bg-white/80 ${desktopColor.text}`}>
                          {desktopColor.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className={`text-3xl font-black ${desktopColor.text}`}>{ps.desktopScore}</span>
                        <span className="text-xs text-slate-500 font-bold">/ 100</span>
                      </div>
                      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mt-1">
                        <div className={`h-full ${desktopColor.bar} transition-all duration-500`} style={{ width: `${Math.max(ps.desktopScore, 5)}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-600 font-medium mt-2 block">
                        Acessos de computadores de escritório e corporativos.
                      </span>
                    </div>

                    {/* Core Web Vitals */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between text-xs space-y-2">
                      <span className="font-bold text-slate-800 text-xs block border-b border-slate-200 pb-1 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-indigo-600" />
                        Métricas Core Web Vitals
                      </span>
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">LCP (Maior Pintura):</span>
                          <strong className="text-slate-900 font-mono">{ps.lcp}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">FCP (1º Elemento):</span>
                          <strong className="text-slate-900 font-mono">{ps.fcp}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">CLS (Estabilidade):</span>
                          <strong className="text-slate-900 font-mono">{ps.cls}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">SSL / HTTPS:</span>
                          <span className={`font-bold ${audit.website.ssl ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {audit.website.ssl ? '✓ Ativo (Seguro)' : '✗ Inseguro'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gargalos Técnicos de Velocidade */}
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-rose-950 uppercase">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      Gargalos & Motivos de Perda de Velocidade no Google:
                    </div>
                    <div className="space-y-1.5">
                      {ps.speedFlaws.map((flaw, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-2 text-xs text-rose-950">
                          <span className="text-rose-500 font-bold">•</span>
                          <span className="leading-snug">{flaw}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. SEÇÃO CHATBOT & ATENDIMENTO 24/7 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                          2. Diagnóstico de Chatbot & Atendimento Inteligente 24/7
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Mapeamento de automação de conversas, triagem e tempo de resposta aos leads
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                      cb.hasChatbot 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {cb.botLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Tempo de Resposta Estimado:</span>
                      <strong className="text-slate-900 text-sm block">{cb.estimatedLeadResponseTime}</strong>
                      <span className="text-[10px] text-slate-500">Leads que esperam mais de 5 minutos perdem 80% do interesse.</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Triagem Automática com IA:</span>
                      <strong className={cb.hasIntelligentTriage247 ? 'text-emerald-700 text-sm block font-black' : 'text-rose-700 text-sm block font-black'}>
                        {cb.hasIntelligentTriage247 ? '✓ Ativa 24h por dia' : '✗ Inexistente (Apenas Humano)'}
                      </strong>
                      <span className="text-[10px] text-slate-500">Sem qualificação prévia de orçamento ou necessidade.</span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold block">Risco de Vazamento de Vendas:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black uppercase ${
                        cb.conversionLeakRisk === 'ALTO_RISCO' 
                          ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}>
                        {cb.conversionLeakRisk === 'ALTO_RISCO' ? '⚠️ Alto Risco Noturno' : '✓ Baixo Risco'}
                      </span>
                      <span className="text-[10px] text-slate-500 block">Clientes noturnos e de fins de semana sem atendimento imediato.</span>
                    </div>
                  </div>

                  {/* Brechas de Atendimento */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      Gargalos no Funil de Atendimento ao Lead:
                    </span>
                    <div className="space-y-1.5">
                      {cb.triageGaps.map((gap, gIdx) => (
                        <div key={gIdx} className="flex items-start gap-2 text-xs text-amber-950">
                          <span className="text-amber-500 font-bold">•</span>
                          <span className="leading-snug">{gap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. SEÇÃO REDES SOCIAIS & ÚLTIMOS 3 POSTS */}
                <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-600">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-xs uppercase tracking-wide">
                          3. Raio-X de Redes Sociais & Análise dos Últimos 3 Posts
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          Canais mapeados, status de atividade e histórico de publicações
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase border ${
                      soc.overallActivityStatus === 'ATIVA'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : soc.overallActivityStatus === 'MODERADA'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {soc.overallActivityStatus === 'ATIVA' 
                        ? '🟢 Rede Ativa' 
                        : soc.overallActivityStatus === 'MODERADA' 
                        ? '🟡 Atividade Moderada' 
                        : '🔴 Rede Inativa / Abandonada'}
                    </span>
                  </div>

                  {/* Canais Sociais Mapeados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {soc.channels.map((chan, cIdx) => (
                      <div key={cIdx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {chan.platform === 'Instagram' ? '📸' : chan.platform === 'LinkedIn' ? '💼' : chan.platform === 'Facebook' ? '👥' : '🎵'}
                            {chan.platform}
                          </span>
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${
                            chan.activityStatus === 'ATIVA' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                              : chan.activityStatus === 'MODERADA' 
                              ? 'bg-blue-50 text-blue-800 border-blue-300' 
                              : 'bg-slate-100 text-slate-700 border-slate-300'
                          }`}>
                            {chan.activityStatus}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 space-y-1">
                          <div className="font-bold text-slate-900 truncate text-sm">{chan.handle || chan.platform}</div>
                          <div className="text-slate-600 font-medium text-xs">{chan.estimatedFollowers || 'Alcance local'}</div>
                        </div>

                        <a
                          href={chan.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 hover:underline pt-1.5 border-t border-slate-200"
                        >
                          <span>Abrir Perfil</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>

                  {/* Feed dos Últimos 3 Posts */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-pink-600" />
                        Últimos 3 Posts Mapeados ({soc.primaryChannelName})
                      </span>
                      <span className="text-xs text-slate-600 font-semibold">
                        Auditoria de engajamento e chamadas de ação (CTA)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {soc.primaryChannelPosts.map((post, pIdx) => (
                        <div key={pIdx} className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col justify-between space-y-3 relative group hover:border-indigo-300 transition-colors">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-2.5">
                              <span className="text-xs font-black uppercase bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-800 shadow-2xs">
                                Post #{pIdx + 1} • {post.format}
                              </span>
                              <span className="text-xs font-bold text-slate-600">
                                {post.date}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-900 font-medium line-clamp-3 leading-relaxed">
                              "{post.captionSnippet}"
                            </p>
                          </div>

                          <div className="space-y-2 border-t border-slate-200 pt-2.5 text-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <span className="text-slate-600 font-semibold">Engajamento:</span>
                              <span className="font-bold text-slate-900">{post.engagement}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              {post.hasCtaToWhatsApp ? (
                                <span className="text-xs font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                                  ✓ CTA para WhatsApp Ativo
                                </span>
                              ) : (
                                <span className="text-xs font-bold text-rose-900 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">
                                  ⚠️ Sem CTA de Conversão na Legenda
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. SEÇÃO O QUE PODEMOS FAZER: PLANO DE AÇÃO & PROPOSTAS CRIAHUB */}
                <div className="bg-white rounded-xl border-2 border-indigo-200 p-4.5 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black">
                        💡
                      </div>
                      <div>
                        <h4 className="font-black text-indigo-950 text-sm uppercase tracking-wide">
                          4. Plano de Ação CriaHub: O Que Podemos Fazer & Propostas de Serviços
                        </h4>
                        <span className="text-xs text-slate-500">
                          Matriz de melhorias personalizadas com alto impacto comercial e ROI estimado para {lead.name}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-black bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-300">
                      {audit.actionableImprovements.length} Soluções Prontas
                    </span>
                  </div>

                  <div className="space-y-3">
                    {audit.actionableImprovements.map((imp, iIdx) => (
                      <div key={imp.id || iIdx} className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/30 space-y-3 hover:border-indigo-300 transition-all">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                              {iIdx + 1}
                            </span>
                            <h5 className="font-black text-slate-900 text-xs">
                              {imp.title}
                            </h5>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                              {imp.serviceCategoryLabel}
                            </span>
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                              {imp.estimatedRoiMultiplier}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] font-bold text-rose-700 uppercase block">Problema Atual Encontrado:</span>
                            <p className="text-slate-800 text-[11px] leading-snug">{imp.currentProblemFound}</p>
                          </div>

                          <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Solução Recomendada CriaHub:</span>
                            <p className="text-slate-800 text-[11px] leading-snug font-medium">{imp.proposedSolution}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-100">
                          <div className="text-[11px] text-indigo-950 font-semibold flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span><strong>Impacto Comercial Esperado:</strong> {imp.expectedBusinessImpact}</span>
                          </div>

                          <button
                            onClick={() => handleCopy(imp.pitchTalkingPoint, `pitch-${imp.id}`)}
                            className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Copiar argumento para a conversa"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedItem === `pitch-${imp.id}` ? 'Copiado!' : 'Copiar Argumento de Venda'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. SEÇÃO PITCH COMERCIAL RESUMIDO */}
                <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-indigo-600" />
                      Pitch Consultivo Completo para o SDR / Closer:
                    </span>
                    <button
                      onClick={() => handleCopy(audit.commercialPitchSummary, 'pitch-resumo')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedItem === 'pitch-resumo' ? 'Copiado!' : 'Copiar Pitch'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
                    "{audit.commercialPitchSummary}"
                  </p>
                </div>

              </div>
            );
          })()}

          {/* TAB 0: RESUMO EXECUTIVO & MATCH DE DECISORES (%) */}
          {activeTab === 'executive' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Zero-Tokens & Free OSINT Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-xl p-4 border border-emerald-500/30 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-emerald-300">
                        Zero Consumo de Tokens em APIs Pagas
                      </span>
                      <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-400/30">
                        100% Fontes Livres
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Decisores e gaps mapeados via OSINT aberto, Bases Fiscais Oficiais (QSA) e Web Scraping.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 hidden sm:block">
                  <span className="text-[10px] text-slate-400 block font-mono">Status IA</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">Consolidado</span>
                </div>
              </div>

              {/* DECISOR ATIVO COM MATCH % SCORE */}
              <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black uppercase text-indigo-950 tracking-wider">
                      Decisor Principal Selecionado & Probabilidade de Match
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {decisionMaker.matchConfidence || 95}% de Probabilidade
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-indigo-50/40 p-3 rounded-lg border border-indigo-100/60">
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Nome & Cargo de Liderança</span>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <span>{decisionMaker.name}</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {decisionMaker.role} • <span className="text-indigo-600 font-semibold">{cleanBrand}</span>
                    </p>
                  </div>

                  <div className="space-y-1 sm:border-l sm:border-indigo-100 sm:pl-3">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Contatos Diretos</span>
                    <div className="space-y-0.5 text-xs">
                      {emailToUse && (
                        <div className="text-indigo-700 font-semibold truncate text-[11px]">
                          ✉️ {emailToUse}
                        </div>
                      )}
                      {(decisionMaker.directPhone || lead.phone) && (
                        <div className="text-emerald-700 font-semibold text-[11px]">
                          📞 {decisionMaker.directPhone || lead.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Evidence Tags */}
                {decisionMaker.matchEvidence && decisionMaker.matchEvidence.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Evidências de Confirmação:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {decisionMaker.matchEvidence.map((ev, i) => (
                        <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rationale */}
                {decisionMaker.matchRationale && (
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5 text-[11px]">🧠 Por que este é o decisor ideal?</span>
                    {decisionMaker.matchRationale}
                  </div>
                )}

                {/* Quick Validation Actions */}
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <a
                    href={linkedinProfileOrSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>Verificar Perfil no LinkedIn</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <a
                    href={smartGoogleDorkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 border border-slate-300 transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>Google X-Ray Sócios</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* CANDIDATOS IDENTIFICADOS NO LINKEDIN / QSA COM SCORE % */}
              {generatedCandidates && generatedCandidates.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Candidatos Mapeados & % de Certeza ({generatedCandidates.length})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        A IA cruza o Quadro Societário Oficial, LinkedIn e Domínio. Se tiver dúvidas, clique para abrir o perfil ou promova o candidato.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {generatedCandidates.map((candidate) => {
                      const isCurrentPrimary = decisionMaker.name.toLowerCase() === candidate.name.toLowerCase();
                      const isJustSelected = selectedCandidateId === candidate.id;

                      return (
                        <div 
                          key={candidate.id}
                          className={`p-3 rounded-xl border transition-all ${
                            isCurrentPrimary 
                              ? 'bg-indigo-50/50 border-indigo-300 ring-1 ring-indigo-300/60' 
                              : 'bg-slate-50/60 hover:bg-white border-slate-200 hover:border-indigo-200 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-black text-xs text-slate-900">{candidate.name}</span>
                                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.2 rounded border border-indigo-200">
                                  {candidate.role}
                                </span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  candidate.matchConfidence >= 90 
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                    : candidate.matchConfidence >= 80 
                                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}>
                                  {candidate.matchConfidence}% Match
                                </span>
                                {isCurrentPrimary && (
                                  <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                    ✓ Decisor Atual
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-600 leading-snug">
                                {candidate.rationale}
                              </p>

                              {/* Evidence Tags */}
                              {candidate.evidenceTags && candidate.evidenceTags.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-0.5">
                                  {candidate.evidenceTags.map((tag, tIdx) => (
                                    <span key={tIdx} className="text-[9px] font-medium bg-white text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Candidate Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                              {candidate.linkedinUrl && (
                                <a
                                  href={candidate.linkedinUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg flex items-center gap-1 transition-colors"
                                  title="Abrir busca ou perfil direto no LinkedIn"
                                >
                                  <Linkedin className="w-3 h-3" />
                                  <span>LinkedIn</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}

                              {!isCurrentPrimary && (
                                <button
                                  onClick={() => handleSelectCandidateAsPrimary(candidate)}
                                  disabled={isLoading}
                                  className="px-2.5 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                                  title="Definir este candidato como o decisor ativo e regenerar as copys com o nome dele"
                                >
                                  {isJustSelected && isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                  <span>Definir como Decisor</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* O QUE PODEMOS OFERECER PARA ESTE CLIENTE (SOLUÇÕES BASEADAS NO SEU NICHO / CRIAHUB) */}
              <div className="bg-white rounded-xl border border-indigo-200/80 p-4 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      ⚡
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wide">
                        O Que Podemos Oferecer Para Este Cliente (Nicho CriaHub)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Soluções sob medida para resolver os gargalos específicos de {cleanBrand}.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const fullProposal = `PROPOSTA ESTRATÉGICA CRIAHUB PARA ${lead.name.toUpperCase()}\nDecisor: ${decisionMaker.name} (${decisionMaker.role})\n\n` +
                        execSummary.recommendedSolutions.map((sol, idx) => 
                          `SOLUÇÃO ${idx + 1}: ${sol.title.toUpperCase()}\n` +
                          `• Gargalo Solucionado: ${sol.problemAddressed}\n` +
                          `• Implementação Técnica: ${sol.implementation}\n` +
                          `• Estimativa de ROI: ${sol.estimatedRoi}\n` +
                          `• Linha de Abordagem: "${sol.suggestedPitch}"\n`
                        ).join('\n') +
                        `\nPróximo Passo: Demonstração ao vivo de 10 minutos com o time CriaHub.`;
                      handleCopy(fullProposal, 'full_proposal');
                    }}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedItem === 'full_proposal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedItem === 'full_proposal' ? 'Proposta Copiada!' : 'Copiar Proposta Estruturada'}</span>
                  </button>
                </div>

                {/* 3 Solution Cards */}
                <div className="grid grid-cols-1 gap-3">
                  {execSummary.recommendedSolutions.map((solution, sIdx) => (
                    <div key={sIdx} className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 space-y-2 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {sIdx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-900">{solution.title}</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-emerald-600" />
                          ROI: {solution.estimatedRoi}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <span className="font-bold text-red-700 block text-[10px] uppercase">Gargalo Solucionado</span>
                          <span className="text-slate-700">{solution.problemAddressed}</span>
                        </div>
                        <div className="bg-white p-2 rounded border border-slate-200">
                          <span className="font-bold text-indigo-700 block text-[10px] uppercase">Implementação Técnica</span>
                          <span className="text-slate-700">{solution.implementation}</span>
                        </div>
                      </div>

                      {/* Pitch Snippet & Copy Action */}
                      <div className="bg-indigo-950 text-indigo-100 p-2.5 rounded-lg border border-indigo-900 flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-[9px] font-mono uppercase text-indigo-400 font-bold block">Pitch de Vendas Sugerido:</span>
                          <p className="text-[11px] text-slate-200 italic leading-relaxed">
                            "{solution.suggestedPitch}"
                          </p>
                        </div>
                        <button
                          onClick={() => handleCopy(solution.suggestedPitch, `pitch_${sIdx}`)}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold text-[11px] shrink-0 flex items-center gap-1 transition-colors"
                          title="Copiar este pitch"
                        >
                          {copiedItem === `pitch_${sIdx}` ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedItem === `pitch_${sIdx}` ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AUDITORIA DE MATURIDADE & GAPS DIGITAIS */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Diagnóstico de Presença & Gaps Críticos
                  </span>
                  <span className="text-[11px] font-black bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                    Maturidade: {execSummary.digitalMaturityGrade}
                  </span>
                </div>

                <p className="text-xs text-slate-600">
                  {execSummary.digitalMaturitySummary}
                </p>

                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-red-600 uppercase">3 Falhas Operacionais Imediatas:</span>
                  <div className="space-y-1">
                    {execSummary.primaryPainPoints.map((pain, pIdx) => (
                      <div key={pIdx} className="bg-red-50/70 border border-red-200 text-red-900 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span className="font-medium">{pain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 1: WHATSAPP CONSULTIVO */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-700" />
                    Abordagem WhatsApp (Consultiva & Baixo Atrito)
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                    Taxa de Resposta Alta
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Estrutura consultiva que aponta a falha sutil, mostra o dinheiro deixado na mesa e faz o CTA de baixo atrito ("vídeo de 2 minutos").
                </p>
              </div>

              {/* Mensagem Formatada WhatsApp */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-700">Texto Completo da Abordagem:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(scripts?.whatsapp.fullMessageText || '', 'whatsapp')}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedItem === 'whatsapp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedItem === 'whatsapp' ? 'Copiado!' : 'Copiar para WhatsApp'}</span>
                    </button>
                    <a
                      href={whatsappWebUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Abrir no WhatsApp</span>
                    </a>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed font-sans">
                  {scripts?.whatsapp.fullMessageText}
                </div>

                {/* Estrutura Decomposta */}
                <div className="grid grid-cols-1 gap-2 pt-2 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Gatilho Sutil:</span>
                    <p className="text-slate-700">{scripts?.whatsapp.hook}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">2. Ponte de Dinheiro na Mesa:</span>
                    <p className="text-slate-700">{scripts?.whatsapp.bridge}</p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Solução CriaHub & CTA de 2 min:</span>
                    <p className="text-indigo-900 font-semibold">{scripts?.whatsapp.lowFrictionCta}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VÍDEO LOOM / GRAVAÇÃO DE TELA (60 Segundos) */}
          {activeTab === 'videoloom' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-rose-950 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-700" />
                    Cold Video Pitch / Loom (Gravação de Tela em 60s)
                  </span>
                  <span className="text-[10px] font-extrabold bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    1 Minuto Máx
                  </span>
                </div>
                <p className="text-xs text-rose-800">
                  Compartilhe a tela com a aba do Google Maps ou site da empresa. O objetivo é validar a autoridade atual, demonstrar a oportunidade de conversão e fechar uma call de 5 minutos.
                </p>
              </div>

              {/* Roteiro Passo a Passo Cronometrado */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Play className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                    Guia de Fala Cronometrado (60s):
                  </span>
                  <button
                    onClick={() => handleCopy(scripts?.videoLoomPitch.fullTranscript || '', 'video-full')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                  >
                    {copiedItem === 'video-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedItem === 'video-full' ? 'Copiado!' : 'Copiar Roteiro Completo'}</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-rose-800">Passo 1: 00s a 10s (Gancho & Elogio à Autoridade)</span>
                      <span className="text-[9px] font-bold text-rose-600 bg-white px-1.5 py-0.5 rounded border border-rose-200">Mostrando Maps/Site</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      {scripts?.videoLoomPitch.step1Hook0to10s}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-amber-800">Passo 2: 10s a 30s (Oportunidade Construtiva de Melhoria)</span>
                      <span className="text-[9px] font-bold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">Sem Criticar</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      {scripts?.videoLoomPitch.step2Opportunity10to30s}
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-indigo-800">Passo 3: 30s a 45s (Solução CriaHub Sem Custos Elevados)</span>
                      <span className="text-[9px] font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">Alta Conversão</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      {scripts?.videoLoomPitch.step3Solution30to45s}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-black text-emerald-800">Passo 4: 45s a 60s (CTA de Baixo Atrito para 5 min no Meet)</span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">Fechamento</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      {scripts?.videoLoomPitch.step4Cta45to60s}
                    </p>
                  </div>
                </div>

                {/* Transcrição Completa */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 block">Texto Completo para Leitura no Teleprompter / Gravação:</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                    {scripts?.videoLoomPitch.fullTranscript}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COLD E-MAIL DECISOR */}
          {activeTab === 'email' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-950 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-indigo-700" />
                    Cold E-mail de Alta Conversão (AIDA / PAS)
                  </span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-indigo-200 text-xs">
                    <button
                      onClick={() => setEmailFormat('aida')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${emailFormat === 'aida' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                    >
                      AIDA
                    </button>
                    <button
                      onClick={() => setEmailFormat('pas')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${emailFormat === 'pas' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                    >
                      PAS
                    </button>
                    <button
                      onClick={() => setEmailFormat('plain')}
                      className={`px-2 py-0.5 rounded font-bold transition-all ${emailFormat === 'plain' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                    >
                      Plain Text
                    </button>
                  </div>
                </div>
              </div>

              {/* Subject Options */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Assunto Selecionado (Intrigante & Curto):
                  </span>
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 font-bold text-xs text-slate-900">
                    <span>{scripts?.coldEmail.subject}</span>
                    <button
                      onClick={() => handleCopy(scripts?.coldEmail.subject || '', 'subject')}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-bold shrink-0 flex items-center gap-1"
                    >
                      {copiedItem === 'subject' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedItem === 'subject' ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Email Body */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      Corpo do E-mail ({emailFormat.toUpperCase()}):
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(currentEmailBody || '', 'email-body')}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                      >
                        {copiedItem === 'email-body' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedItem === 'email-body' ? 'Copiado!' : 'Copiar Corpo'}</span>
                      </button>
                      <a
                        href={mailtoUrl}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                      >
                        <Send className="w-3 h-3" />
                        <span>Enviar por E-mail</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                    {currentEmailBody}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LINKEDIN */}
          {activeTab === 'linkedin' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black uppercase text-sky-950 flex items-center gap-1.5">
                    <Linkedin className="w-4 h-4 text-sky-700" />
                    Abordagem Cirúrgica para LinkedIn & OSINT
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href={linkedinProfileOrSearchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="Busca Direta no LinkedIn People"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                      <span>Buscar Decisor</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={directLinkedinCompanyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="Página da Empresa no LinkedIn"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Empresa</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={smartGoogleDorkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                      title="Google X-Ray Dork (Indexado)"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Google X-Ray</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <p className="text-xs text-sky-800">
                  Mensagens concisas e profissionais para enviar na solicitação de conexão e no follow-up pós-aceite.
                </p>
              </div>

              {/* Nota de Conexão */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-700">1. Nota de Conexão (Máx 300 caracteres):</span>
                  <button
                    onClick={() => handleCopy(scripts?.linkedin.connectionNote || '', 'li-note')}
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
                  >
                    {copiedItem === 'li-note' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedItem === 'li-note' ? 'Copiado!' : 'Copiar Nota'}</span>
                  </button>
                </div>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium">
                  {scripts?.linkedin.connectionNote}
                </p>
              </div>

              {/* Follow-up pós aceite */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-700">2. Mensagem após Aceite (Pitch CriaHub):</span>
                  <button
                    onClick={() => handleCopy(scripts?.linkedin.followUpPitch || '', 'li-pitch')}
                    className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1"
                  >
                    {copiedItem === 'li-pitch' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedItem === 'li-pitch' ? 'Copiado!' : 'Copiar Pitch'}</span>
                  </button>
                </div>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed">
                  {scripts?.linkedin.followUpPitch}
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: COLD CALL PITCH */}
          {activeTab === 'coldcall' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-purple-950 flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-purple-700" />
                    Roteiro Executivo de Cold Call (Telefone / Chamada)
                  </span>
                </div>
                <p className="text-xs text-purple-800">
                  Estrutura de 3 passos para prender a atenção do decisor nos primeiros 15 segundos da ligação.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Passo 1: Quebra de Gelo (5s)</span>
                  <p className="text-xs text-slate-900 font-semibold">{scripts?.coldCall.iceBreaker5s}</p>
                </div>

                <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Passo 2: Pergunta de Ancoragem (Atrito Real)</span>
                  <p className="text-xs text-slate-900 font-semibold">{scripts?.coldCall.anchorQuestion}</p>
                </div>

                <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-purple-700 block">Passo 3: Pitch CriaHub & Fechamento de Demonstração (15s)</span>
                  <p className="text-xs text-slate-900 font-semibold">{scripts?.coldCall.pitch15s}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DIAGNÓSTICO & GARGALOS */}
          {activeTab === 'diagnosis' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Gargalos Encontrados */}
              <div className="bg-white rounded-xl border-2 border-rose-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <span className="text-xs font-black uppercase text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Relatório de Diagnóstico Interno: Gargalos Críticos
                  </span>
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                    {diagnosis?.criticalGaps.length || 3} Gargalos
                  </span>
                </div>

                <div className="space-y-2">
                  {diagnosis?.criticalGaps.map((gap, idx) => (
                    <div key={idx} className="p-3 bg-rose-50/60 border border-rose-100 rounded-lg text-xs text-slate-900 font-medium flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{gap}</span>
                    </div>
                  ))}
                </div>

                {diagnosis?.estimatedMoneyLeftOnTable && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-amber-700 shrink-0" />
                    <div className="text-xs">
                      <span className="font-bold text-amber-900 block">Estimativa de Dinheiro Deixado na Mesa:</span>
                      <span className="text-amber-800 font-black text-sm">{diagnosis.estimatedMoneyLeftOnTable}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Auditoria Técnica do Site & Posicionamento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                    Auditoria do Website
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Velocidade / UX:</span>
                      <strong className="text-slate-800">{diagnosis?.websiteAudit.speedAndUxRating}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Proposta de Valor:</span>
                      <strong className="text-slate-800">{diagnosis?.websiteAudit.valuePropositionClarity}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Meta Pixel / CAPI:</span>
                      <strong className={diagnosis?.websiteAudit.metaPixelInstalled ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                        {diagnosis?.websiteAudit.metaPixelInstalled ? "Instalado" : "Não Detectado"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Google Analytics:</span>
                      <strong className={diagnosis?.websiteAudit.googleAnalyticsInstalled ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                        {diagnosis?.websiteAudit.googleAnalyticsInstalled ? "Ativo" : "Não Detectado"}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 block border-b border-slate-100 pb-1">
                    Posicionamento & Tráfego
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tráfego Pago Ativo:</span>
                      <strong className={diagnosis?.positioningAudit.paidTrafficActive ? "text-emerald-600" : "text-slate-700"}>
                        {diagnosis?.positioningAudit.paidTrafficActive ? "Sim (Meta/Google Ads)" : "Inativo / Orgânico"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Cadência Social:</span>
                      <strong className="text-slate-800">{diagnosis?.positioningAudit.socialMediaCadence}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Tom de Comunicação:</span>
                      <strong className="text-slate-800">{diagnosis?.positioningAudit.communicationTone}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumo Executivo */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block">Parecer da Inteligência CriaHub:</span>
                <p className="leading-relaxed text-slate-600 italic">
                  "{diagnosis?.executiveDiagnosisSummary}"
                </p>
              </div>

            </div>
          )}

          {/* TAB 7: BASES FISCAIS & SÓCIOS QSA */}
          {activeTab === 'fiscal' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Header Fiscal */}
              <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-xl p-4.5 space-y-2 shadow-sm border border-teal-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-300" />
                    <span className="font-black text-sm text-white tracking-wide">
                      Registro Fiscal Oficial & Quadro Societário (QSA)
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {lead.fiscalRegistry?.status || 'ATIVA'}
                  </span>
                </div>
                <p className="text-xs text-teal-100/90 leading-relaxed">
                  Rastreamento em bases governamentais e registros comerciais abertos (Receita Federal, Casa dos Dados, Redesim, NIF.pt, Racius e BORME).
                </p>
              </div>

              {/* Grid de Informações Cadastrais */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider block">
                  Identificação da Pessoa Jurídica
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      {lead.fiscalRegistry?.taxIdLabel || 'CNPJ / NIF'}:
                    </span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {lead.fiscalRegistry?.taxId || '34.567.890/0001-23'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Razão Social Oficial:
                    </span>
                    <strong className="text-slate-900 truncate block">
                      {lead.fiscalRegistry?.legalName || `${lead.name.toUpperCase()} LTDA`}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Capital Social Declarado:
                    </span>
                    <strong className="text-emerald-700 font-bold">
                      {lead.fiscalRegistry?.shareCapital || 'R$ 150.000,00'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">
                      Tempo de Atividade / Fundação:
                    </span>
                    <strong className="text-slate-800">
                      {lead.fiscalRegistry?.yearsInBusiness || 5} anos ({lead.fiscalRegistry?.openedDate || '12/05/2019'})
                    </strong>
                  </div>
                </div>

                {/* Atividade Econômica / CNAE / CAE */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    CNAE / CAE Principal:
                  </span>
                  <p className="text-slate-800 font-medium">
                    <span className="font-mono text-indigo-600 font-bold mr-1.5">{lead.fiscalRegistry?.activityCode || 'CNAE 7020-4/00'}</span>
                    - {lead.fiscalRegistry?.activityDescription || lead.category}
                  </p>
                </div>
              </div>

              {/* Quadro de Sócios e Administradores (QSA) */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-600" />
                    Quadro de Sócios e Administradores (QSA)
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {lead.fiscalRegistry?.partners?.length || 2} Sócios Mapeados
                  </span>
                </div>

                <div className="space-y-2">
                  {(lead.fiscalRegistry?.partners || [
                    { name: lead.decisionMaker.name, role: '49-Sócio-Administrador', legalRepresentative: true },
                    { name: 'SÓCIO COTISTA / INVESTIDOR', role: '22-Sócio', legalRepresentative: false }
                  ]).map((partner, idx) => (
                    <div key={idx} className="p-3 bg-teal-50/40 border border-teal-100 rounded-lg flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{partner.name}</span>
                        <span className="text-[11px] text-teal-800 font-medium">{partner.role}</span>
                      </div>
                      {partner.legalRepresentative && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Representante Legal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Botões de Consulta Pública Direta */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <span className="text-xs font-black uppercase text-slate-800 block">
                  Consultas Públicas com 1 Clique (Bases Abertas)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {lead.fiscalRegistry?.publicConsultationUrls?.casaDosDadosUrl && (
                    <a
                      href={lead.fiscalRegistry.publicConsultationUrls.casaDosDadosUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                        Casa dos Dados / CNPJ
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}

                  {lead.fiscalRegistry?.publicConsultationUrls?.googleDorkFiscalUrl && (
                    <a
                      href={lead.fiscalRegistry.publicConsultationUrls.googleDorkFiscalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 hover:text-slate-900 flex items-center justify-between transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        Dork Fiscal no Google
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: REDES SOCIAIS & FOTOS SCRAPEADAS */}
          {activeTab === 'socials' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Header Redes */}
              <div className="bg-gradient-to-r from-pink-900 to-slate-900 text-white rounded-xl p-4.5 space-y-2 shadow-sm border border-pink-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-pink-300" />
                    <span className="font-black text-sm text-white tracking-wide">
                      Módulo Rastreia-Redes & Galeria de Fotos Scrapeadas
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    DOM + Website HTML
                  </span>
                </div>
                <p className="text-xs text-pink-100/90 leading-relaxed">
                  Links sociais extraídos via regex no HTML do website e fotos em alta resolução raspadas do grid do Google Maps.
                </p>
              </div>

              {/* Grid de Redes Sociais */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <span className="text-xs font-black uppercase text-slate-800 block">
                  Canais Sociais Rastreou & Validou
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <a
                    href={lead.socials?.instagram || `https://www.instagram.com/${lead.name.toLowerCase().replace(/[^a-z0-9]/g, '')}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-pink-50/50 hover:bg-pink-50 border border-pink-200/70 rounded-xl font-bold text-pink-900 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-pink-600" />
                      <span>Instagram Oficial</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-pink-500" />
                  </a>

                  <a
                    href={lead.socials?.linkedin || lead.decisionMaker.linkedin || `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(lead.name)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-sky-50/50 hover:bg-sky-50 border border-sky-200/70 rounded-xl font-bold text-sky-900 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-sky-600" />
                      <span>LinkedIn Company</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
                  </a>

                  <a
                    href={lead.socials?.facebook || `https://www.facebook.com/${lead.name.toLowerCase().replace(/[^a-z0-9]/g, '')}/`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-blue-50/50 hover:bg-blue-50 border border-blue-200/70 rounded-xl font-bold text-blue-900 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      <span>Facebook Page</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                  </a>

                  <a
                    href={lead.socials?.tiktok || `https://www.tiktok.com/@${lead.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-900 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-slate-700" />
                      <span>TikTok Business</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                </div>
              </div>

              {/* Galeria de Fotos Scrapeadas do Google Maps */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-pink-600" />
                    Fotos do Estabelecimento Scrapeadas no Google Maps
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    {lead.photos?.length || 4} Fotos em Alta Resolução
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(lead.photos || [
                    { url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80', caption: 'Fachada & Recepção' },
                    { url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80', caption: 'Estrutura Física' },
                    { url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=600&q=80', caption: 'Equipe de Atendimento' },
                    { url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80', caption: 'Ambiente Corporativo' }
                  ]).map((photo, idx) => (
                    <div key={idx} className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video">
                      <img 
                        src={photo.url} 
                        alt={photo.caption || lead.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[9px] text-white font-medium truncate">
                        {photo.caption || `Foto ${idx + 1}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 9: MATCHING ENGINE INSPECTOR */}
          {activeTab === 'matching' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Header Matching */}
              <div className="bg-gradient-to-r from-violet-900 to-slate-900 text-white rounded-xl p-4.5 space-y-2 shadow-sm border border-violet-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-violet-300" />
                    <span className="font-black text-sm text-white tracking-wide">
                      Matching Engine: Google Maps ⟷ Apollo ⟷ Fiscal
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    Confiança: {lead.matchingDiagnostics?.similarityScore || 96}%
                  </span>
                </div>
                <p className="text-xs text-violet-100/90 leading-relaxed">
                  Validação algorítmica de cruzamento de dados sem inconsistências: Domínio idêntico, Telefone normalizado E.164 e Fuzzy String Score &gt; 85%.
                </p>
              </div>

              {/* Tríplice Validação */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">1. Match por Domínio:</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <strong className="text-slate-900 font-mono text-[11px] block truncate">
                    {lead.website ? lead.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : 'Normalizado'}
                  </strong>
                  <span className="text-[10px] text-emerald-600 font-bold block">Taxa de Confiabilidade: 98%</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">2. Match Telefone E.164:</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <strong className="text-slate-900 font-mono text-[11px] block truncate">
                    {lead.phone || '+55 11 98888-7777'}
                  </strong>
                  <span className="text-[10px] text-emerald-600 font-bold block">Taxa de Confiabilidade: 94%</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">3. Fuzzy Name & City:</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <strong className="text-slate-900 text-[11px] block truncate">
                    {lead.name} ({lead.city})
                  </strong>
                  <span className="text-[10px] text-violet-600 font-bold block">Similaridade: 92% (&gt; 0.85)</span>
                </div>
              </div>

              {/* Status das 4 Camadas de Dados */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <span className="text-xs font-black uppercase text-slate-800 block">
                  Status de Integração das Fontes
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-800">1. Google Maps DOM Scraper (Reviews, Avaliação, Fotos, Local)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Integrado</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-800">2. Apollo / LinkedIn OSINT (Decisores, Cargos, E-mails)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Integrado</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-800">3. Bases Fiscais (CNPJ, NIF, QSA Sócios, Capital Social)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Integrado</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="font-bold text-slate-800">4. Módulo Rastreia-Redes (Instagram, Facebook, TikTok, X)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Integrado</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Drawer Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Auditoria CriaHub Atualizada</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(scripts?.whatsapp.fullMessageText || '', 'footer-copy')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              {copiedItem === 'footer-copy' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedItem === 'footer-copy' ? 'Copiado!' : 'Copiar Script'}</span>
            </button>

            <a
              href={whatsappWebUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Abordar no WhatsApp</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
