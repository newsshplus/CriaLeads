import React, { useState } from 'react';
import { Lead, IcpTier, BusinessProfile } from '../types';
import { 
  Globe, Phone, MapPin, ExternalLink, Trash2, Mail, 
  AlertTriangle, CheckCircle, MessageSquare, PhoneCall, Zap, 
  Sparkles, User, ShieldCheck, Flame, Cpu, Clock, Layers, Target,
  FileText, Edit3, ChevronRight, Copy, Check, Compass
} from 'lucide-react';
import { generateDeterministicNicheOutreach } from '../services/realtimeSdrAiOutreachService';
import { RealtimeSdrOutreachPanel } from './RealtimeSdrOutreachPanel';
import { openWhatsApp1Click } from '../services/whatsAppOutreachHelper';
import { calculateLeadRoiRecommendation, getRoiVerdictStyle } from '../services/roiRecommendationService';

interface LeadCardProps {
  lead: Lead;
  isSelected?: boolean;
  businessProfile?: BusinessProfile;
  onSelect?: (id: string) => void;
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onDelete: (id: string) => void;
  onOpenOmnichannel: (lead: Lead, tab?: 'criahub_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech') => void;
  onOpenLiveCopilot?: (lead: Lead) => void;
  onOpenNotes?: (lead: Lead) => void;
  onOpenCriahubDrawer?: (lead: Lead) => void;
  onOpenHunterCall?: (lead: Lead) => void;
  onOpenFocusDialer?: (lead: Lead) => void;
  onUpdateLead?: (lead: Lead) => void;
  onOpenGroqTriage?: (lead: Lead) => void;
  onOpenCockpit?: (lead: Lead) => void;
}

type CardSubStep = 'pitch' | 'diagnosis' | 'dossier';

const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  isSelected, 
  businessProfile,
  onSelect, 
  onUpdateStatus, 
  onDelete,
  onOpenOmnichannel,
  onOpenLiveCopilot,
  onOpenNotes,
  onOpenCriahubDrawer,
  onOpenHunterCall,
  onOpenFocusDialer,
  onUpdateLead,
  onOpenGroqTriage,
  onOpenCockpit
}) => {
  const [subStep, setSubStep] = useState<CardSubStep>('pitch');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAiOutreachModal, setShowAiOutreachModal] = useState<boolean>(false);

  const copyToClipboard = (text: string, fieldId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'contacted': return 'bg-blue-100 text-blue-900 border-blue-300 font-extrabold';
      case 'qualified': return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold';
      case 'ignored': return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
      default: return 'bg-indigo-100 text-indigo-950 border-indigo-300 font-extrabold';
    }
  };

  const isContacted = lead.status === 'contacted';

  // Resolução dos dados do contato
  const primaryPhone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = primaryPhone.replace(/\D/g, '');
  const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 7);
  const isDirectDecisorPhone = Boolean(lead.decisionMaker?.directPhone);

  const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor Comercial';
  const decisorRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Diretoria / Gestão';

  // Gancho e abordagem personalizada sem clichê
  const deterministicOutreach = generateDeterministicNicheOutreach(lead);
  const activeOutreach = lead.realtimeSdrOutreach || deterministicOutreach;
  const callAngleText = activeOutreach.callAnchor20s || lead.callAngleSuggestion || 'Identificamos oportunidade de acelerar conversão digital e atendimento com IA.';

  // Recomendação de Investimento de Tempo / ROI SDR & Canal de Ataque
  const roiRec = lead.roiRecommendation || calculateLeadRoiRecommendation(lead, businessProfile);
  const roiStyle = getRoiVerdictStyle(roiRec.verdict);

  const detectedTools = lead.techStack?.detectedTools || [];
  const flaws = lead.keyFlaws || lead.bantPlus?.need?.operationalFlaws || [];

  const handleStartCall = () => {
    if (onOpenFocusDialer) {
      onOpenFocusDialer(lead);
    } else if (onOpenHunterCall) {
      onOpenHunterCall(lead);
    } else {
      onOpenOmnichannel(lead, 'call');
    }
  };

  const handleWhatsApp1Click = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const success = openWhatsApp1Click(lead);
    if (success && onUpdateLead) {
      onUpdateLead({
        ...lead,
        status: 'contacted',
        whatsAppStatus: 'sent'
      });
    } else if (!success) {
      onOpenOmnichannel(lead, 'whatsapp');
    }
  };

  return (
    <div 
      id={`lead-card-${lead.id}`}
      className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between relative group ${
        isSelected ? 'border-amber-500 ring-2 ring-amber-400/30 bg-amber-50/10' : 'border-slate-200/90'
      } ${isContacted ? 'bg-slate-50/80 border-slate-300/80' : ''}`}
    >
      {/* 1. CABEÇALHO COMPACTO & DIRETO */}
      <div>
        <div className="flex items-start justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {onSelect && (
              <input 
                type="checkbox" 
                checked={isSelected}
                onChange={() => onSelect(lead.id)}
                className="w-4 h-4 mt-1 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 
                  className="font-black text-slate-900 text-base sm:text-lg leading-snug hover:text-amber-700 cursor-pointer transition-colors truncate" 
                  title={lead.name}
                  onClick={() => onOpenCriahubDrawer ? onOpenCriahubDrawer(lead) : onOpenOmnichannel(lead, 'bant')}
                >
                  {lead.name}
                </h3>

                {/* Badge de Veredito de Investimento do SDR */}
                <span 
                  className={`inline-flex items-center text-xs font-black px-2 py-0.5 rounded-md border gap-1 shadow-2xs ${roiStyle.badgeBg}`}
                  title={`${roiRec.investmentWorthLabel}: ${roiRec.primaryReason}`}
                >
                  <span>{roiStyle.emoji}</span>
                  <span>{roiRec.verdictBadge}</span>
                </span>

                {/* Badge de Dia Planejado da Cadência (5/dia) */}
                {lead.cadenceDay && (
                  <span 
                    className="inline-flex items-center text-[11px] font-black px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 gap-1"
                    title={`Lead programado no planejamento para ${lead.cadenceDayLabel || `Dia ${lead.cadenceDay}`}`}
                  >
                    <span>📅</span>
                    <span>{lead.cadenceDayLabel || `Dia ${lead.cadenceDay}`}</span>
                  </span>
                )}
              </div>

              <div className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap font-medium">
                <span className="font-extrabold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {lead.category}
                </span>
                <span className="flex items-center gap-1 text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {lead.city}, {lead.country || 'Brasil'}
                </span>
                {lead.rating ? (
                  <span className="text-amber-800 font-black text-xs">
                    ★ {lead.rating.toFixed(1)} {lead.reviews ? `(${lead.reviews})` : ''}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Match Score */}
          <div className="text-right shrink-0 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <span className="text-base font-black text-slate-900">{lead.intentScore ?? lead.icpScore}%</span>
            <span className="text-[11px] block font-extrabold text-amber-700 uppercase">Match</span>
          </div>
        </div>

        {/* 🛑 ALERTA ANTI-QUEIMAÇÃO NO CARD */}
        {(lead.status === 'contacted' || lead.alreadyContactedWarning?.isContacted) && (
          <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="font-black flex items-center gap-1.5 flex-wrap">
                <span>🛑 JÁ CONTATADO ANTERIORMENTE</span>
                {lead.alreadyContactedWarning?.formattedDate && (
                  <span className="font-bold text-[10px] text-amber-800">em {lead.alreadyContactedWarning.formattedDate}</span>
                )}
              </div>
              <div className="text-[11px] text-amber-900 mt-0.5">
                <strong>Ocorrência:</strong> {lead.alreadyContactedWarning?.outcomeLabel || lead.contactOutcomeLabel || 'Contato Realizado'}
                {(lead.alreadyContactedWarning?.notes || lead.contactNotes) && (
                  <span> • <em>"{lead.alreadyContactedWarning?.notes || lead.contactNotes}"</em></span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. NAVEGAÇÃO EM SUBETAPAS (TABS COMPACTAS) */}
        <div className="flex items-center gap-1.5 mt-3 p-1 bg-slate-100/90 rounded-xl border border-slate-200 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => setSubStep('pitch')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subStep === 'pitch'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <PhoneCall className={`w-3.5 h-3.5 ${subStep === 'pitch' ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span>1. Contato & Pitch</span>
          </button>

          <button
            type="button"
            onClick={() => setSubStep('diagnosis')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subStep === 'diagnosis'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Target className={`w-3.5 h-3.5 ${subStep === 'diagnosis' ? 'text-amber-600' : 'text-slate-500'}`} />
            <span>2. Diagnóstico & ICP</span>
          </button>

          <button
            type="button"
            onClick={() => setSubStep('dossier')}
            className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              subStep === 'dossier'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${subStep === 'dossier' ? 'text-purple-600' : 'text-slate-500'}`} />
            <span>3. Dossiê & Notas</span>
          </button>
        </div>

        {/* 3. CONTEÚDO DAS SUBETAPAS */}
        <div className="mt-3 min-h-[145px] flex flex-col justify-between">
          {/* SUBETAPA 1: CONTATO & PITCH (DIRETO AO PONTO) */}
          {subStep === 'pitch' && (
            <div className="space-y-2.5 animate-fadeIn">
              {/* BLOCO DE RECOMENDAÇÃO DE INVESTIMENTO & CANAL DE ATAQUE */}
              <div className={`p-2.5 rounded-xl border ${roiStyle.containerBg} ${roiStyle.borderAccent} space-y-2 shadow-2xs`}>
                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                    <span>{roiStyle.emoji}</span>
                    <span className="text-slate-800">{roiRec.investmentWorthLabel}</span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border shadow-2xs ${
                    roiRec.verdict === 'CALL_MEETING'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      : roiRec.verdict === 'WHATSAPP_FIRST'
                      ? 'bg-teal-100 text-teal-950 border-teal-300'
                      : roiRec.verdict === 'EMAIL_ONLY'
                      ? 'bg-amber-100 text-amber-950 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {roiRec.verdict === 'CALL_MEETING' ? '🔥 QUENTE (Ligar SDR)' : roiRec.verdict === 'WHATSAPP_FIRST' ? '💬 MÉDIO (WhatsApp)' : roiRec.verdict === 'EMAIL_ONLY' ? '📩 FRIO (E-mail Seguro)' : '⛔ Inviável'}
                  </span>
                </div>

                <p className="text-xs text-slate-800 font-medium leading-snug">
                  {roiRec.primaryReason}
                </p>

                {/* Aviso Anti-Spam Exclusivo para WhatsApp em Não-Clientes */}
                {roiRec.offeringSynergy?.contactFormatEvaluation?.antiSpamWarning && (
                  <div className="p-2 rounded-lg bg-rose-100/90 border border-rose-300 text-[11px] text-rose-950 space-y-0.5">
                    <div className="font-black flex items-center gap-1 text-rose-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>Risco Anti-Spam: Não envie mensagens em massa!</span>
                    </div>
                    <p className="text-[10px] leading-snug text-rose-800 font-medium">
                      O envio frio para não-clientes pode causar banimento imediato no WhatsApp. Aborde 1-a-1 citando a falha específica.
                    </p>
                  </div>
                )}

                {/* Falhas Digitais & Nossos Serviços que Servem para a Empresa */}
                {roiRec.offeringSynergy && (
                  <div className="bg-white/90 rounded-lg p-2 border border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Falhas no Meio Digital & Serviços Ofertáveis:
                      </span>
                      {roiRec.offeringSynergy.targetDealSize && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-300">
                          {roiRec.offeringSynergy.targetDealSize.split('(')[0]}
                        </span>
                      )}
                    </div>

                    {(roiRec.offeringSynergy.detectedDigitalFlaws?.length || 0) > 0 ? (
                      <div className="space-y-1">
                        {roiRec.offeringSynergy.detectedDigitalFlaws?.slice(0, 2).map((flaw, fIdx) => (
                          <div key={fIdx} className="bg-slate-50 border border-slate-200 rounded p-1.5 space-y-0.5">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold text-rose-900 flex items-center gap-1">
                                <span className="text-rose-600 font-black">•</span> {flaw.flawTitle}
                              </span>
                              <span className="text-[9px] text-slate-500 font-semibold">{flaw.categoryLabel}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-indigo-900 flex items-center gap-1">
                              <span>💼 Solução:</span> <span className="font-black text-indigo-950">{flaw.offeredService}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (roiRec.offeringSynergy.servicesMatched?.length || 0) > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {roiRec.offeringSynergy.servicesMatched?.map((srv, sIdx) => (
                          <span key={sIdx} className="text-[10px] font-bold bg-indigo-50 text-indigo-950 border border-indigo-200 px-1.5 py-0.5 rounded">
                            💼 {srv}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-600 italic">
                        {roiRec.offeringSynergy.leadNeedMatchExplanation}
                      </div>
                    )}

                    <div className={`mt-1 text-[10px] font-medium p-1.5 rounded ${
                      roiRec.offeringSynergy.sdrCostJustified 
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      <strong className="font-black">Viabilidade do SDR:</strong> {roiRec.offeringSynergy.whySdrJustifiedOrNot}
                    </div>
                  </div>
                )}

                {/* Sinais em chips rápidos e meta */}
                <div className="flex items-center justify-between gap-2 pt-0.5 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded font-bold border ${roiRec.dataSignals.hasDirectDecisor ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                      {roiRec.dataSignals.hasDirectDecisor ? '✓ Decisor Mapeado' : 'Recepção / Geral'}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded font-bold border ${roiRec.dataSignals.phoneType === 'direct_mobile' ? 'bg-teal-100 text-teal-950 border-teal-300' : roiRec.dataSignals.hasValidPhone ? 'bg-blue-100 text-blue-950 border-blue-300' : 'bg-rose-100 text-rose-950 border-rose-300'}`}>
                      {roiRec.dataSignals.phoneType === 'direct_mobile' ? '📱 Celular / WhatsApp' : roiRec.dataSignals.hasValidPhone ? '☎️ Fixo Geral' : 'Sem Telefone'}
                    </span>
                    {roiRec.dataSignals.hasCtaLeak && (
                      <span className="px-1.5 py-0.5 rounded font-bold bg-amber-100 text-amber-950 border border-amber-300">
                        ⚠️ Gargalo de Atendimento
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-slate-700">
                    🎯 {roiRec.expectedGoal}
                  </span>
                </div>
              </div>

              {/* Linha do Decisor e Telefone */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-900 shrink-0 font-black">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-900 font-black text-xs sm:text-sm truncate">
                        {decisorName}
                      </span>
                      {lead.decisionMaker?.linkedin && (
                        <a
                          href={lead.decisionMaker.linkedin.startsWith('http') ? lead.decisionMaker.linkedin : `https://${lead.decisionMaker.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-700 hover:text-blue-900 ml-1 shrink-0"
                          title="LinkedIn do Decisor"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-slate-600 font-medium block truncate">
                      {decisorRole}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {hasPhone ? (
                    <>
                      <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200">
                        {primaryPhone}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => copyToClipboard(primaryPhone, 'phone', e)}
                        className="p-1 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors"
                        title="Copiar telefone"
                      >
                        {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 italic">Sem telefone listado</span>
                  )}
                </div>
              </div>

              {/* Gancho Sub-30s com 1-Click Copy */}
              <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-1">
                <div className="flex items-center justify-between text-xs font-extrabold text-amber-950">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Gancho de Abertura Sub-30s:</span>
                  </span>
                  <button
                    type="button"
                    onClick={(e) => copyToClipboard(callAngleText, 'anchor', e)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'anchor' ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'anchor' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-900 font-medium leading-snug line-clamp-2">
                  &ldquo;{callAngleText}&rdquo;
                </p>
              </div>

              {/* CTAs Diretos de Abordagem Adaptados ao Veredito Comercial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {roiRec.verdict === 'CALL_MEETING' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer ring-2 ring-emerald-400/30"
                      title="Ligar agora para tentar agendar demonstração/reunião"
                    >
                      <PhoneCall className="w-4 h-4 text-white shrink-0 animate-pulse" />
                      <span>LIGAR AGORA: AGENDAR REUNIÃO</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsApp1Click}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all active:scale-[0.99] cursor-pointer ${
                        lead.whatsAppStatus === 'sent'
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-300'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                      }`}
                      title="Disparar WhatsApp complementar"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{lead.whatsAppStatus === 'sent' ? '✓ WHATSAPP ENVIADO' : 'WHATSAPP 1-CLICK'}</span>
                    </button>
                  </>
                ) : roiRec.verdict === 'WHATSAPP_FIRST' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleWhatsApp1Click}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer ring-2 ring-teal-400/30"
                      title="Mandar mensagem direta de 1-Click pelo WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4 text-white shrink-0 animate-pulse" />
                      <span>{lead.whatsAppStatus === 'sent' ? '✓ WHATSAPP ENVIADO' : 'MANDAR WHATSAPP (1-CLICK)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                      title="Ligar pelo discador hunter"
                    >
                      <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>LIGAR PELO SDR</span>
                    </button>
                  </>
                ) : roiRec.verdict === 'EMAIL_ONLY' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onOpenOmnichannel(lead, 'email')}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer ring-2 ring-amber-400/30"
                      title="Disparar e-mail AIDA para não queimar tempo do SDR em ligação fria"
                    >
                      <Mail className="w-4 h-4 text-white shrink-0" />
                      <span>MANDAR E-MAIL (SEM PERDER TEMPO)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleWhatsApp1Click}
                      className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                      title="Testar WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4 text-teal-600 shrink-0" />
                      <span>WHATSAPP ALTERNATIVO</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onUpdateStatus(lead.id, 'ignored')}
                      className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-300 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                      title="Descartar este lead para poupar o tempo da equipe"
                    >
                      <Trash2 className="w-4 h-4 text-rose-700 shrink-0" />
                      <span>DESCARTAR LEAD (POUPAR TEMPO)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenCriahubDrawer ? onOpenCriahubDrawer(lead) : onOpenOmnichannel(lead, 'bant')}
                      className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                      title="Ver dossiê completo"
                    >
                      <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>VER DOSSIÊ / REAVALIAR</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* SUBETAPA 2: DIAGNÓSTICO & ICP */}
          {subStep === 'diagnosis' && (
            <div className="space-y-2.5 animate-fadeIn">
              {/* Avaliação de Investimento de Tempo / ROI */}
              <div className={`p-2.5 rounded-xl border ${roiStyle.containerBg} ${roiStyle.borderAccent} text-xs space-y-1.5`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>{roiStyle.emoji}</span>
                    <span>Análise de Investimento de Tempo:</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded font-black text-[11px] border ${roiStyle.badgeBg}`}>
                    {roiRec.verdictBadge}
                  </span>
                </div>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {roiRec.primaryReason}
                </p>
                <div className="p-2 bg-white/90 rounded-lg border border-slate-200/80 text-[11px] space-y-1">
                  <div className="font-black text-slate-900 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Dica Tática para o SDR:</span>
                  </div>
                  <p className="text-slate-700 leading-snug">
                    {roiRec.sdrActionTip}
                  </p>
                </div>
              </div>

              {/* Matriz ICP & Decisão */}
              {lead.seniorIcpQualification ? (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-600 block text-[11px] font-semibold">Decisão da Matriz Sênior:</span>
                    <span className="font-bold text-slate-900">{lead.seniorIcpQualification.businessType}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-slate-900">{lead.seniorIcpQualification.finalScore}/100</span>
                    <span className="text-[10px] block font-bold text-slate-500 uppercase">Pontos ICP</span>
                  </div>
                </div>
              ) : null}

              {/* Gaps e Dores */}
              <div className="p-2.5 bg-rose-50/90 rounded-xl border border-rose-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-950">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>Gaps & Oportunidades Identificadas:</span>
                </div>
                {flaws.length > 0 ? (
                  flaws.slice(0, 2).map((flaw, idx) => (
                    <div key={idx} className="text-xs text-rose-950 font-medium flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span className="leading-snug">{flaw}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-rose-900">Ausência de automação de conversão e atendimento 24/7.</p>
                )}
              </div>

              {/* Links e Tecnologias */}
              <div className="flex items-center justify-between gap-2 pt-1 text-xs text-slate-700 flex-wrap">
                <div className="flex items-center gap-1.5">
                  {detectedTools.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px]">
                        {detectedTools.slice(0, 3).join(', ')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-500">Techs em validação</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {lead.website && (
                    <a
                      href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 hover:underline"
                    >
                      <Globe className="w-3 h-3" />
                      <span>Site</span>
                    </a>
                  )}
                  {lead.googleMapsLink && (
                    <a
                      href={lead.googleMapsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 hover:underline"
                    >
                      <MapPin className="w-3 h-3" />
                      <span>Google Maps</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUBETAPA 3: DOSSIÊ & NOTAS */}
          {subStep === 'dossier' && (
            <div className="space-y-2.5 animate-fadeIn">
              {/* Bloco de Anotações */}
              <div 
                onClick={() => onOpenNotes && onOpenNotes(lead)}
                className="p-2.5 bg-amber-50 hover:bg-amber-100/70 border border-amber-200 rounded-xl text-xs text-amber-950 cursor-pointer transition-colors"
                title="Clique para editar as anotações do lead"
              >
                <div className="flex items-center justify-between font-bold text-xs text-amber-900 mb-1">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span>Anotações SDR</span>
                  </span>
                  <span className="text-[11px] text-amber-700 underline flex items-center gap-1 font-semibold">
                    <Edit3 className="w-3 h-3" /> Editar
                  </span>
                </div>
                <p className="text-xs text-slate-800 font-medium whitespace-pre-line leading-relaxed line-clamp-2">
                  {lead.notes || 'Nenhuma anotação registrada ainda. Clique para adicionar notas da ligação.'}
                </p>
              </div>

              {/* Ações Aprofundadas: Dossiê 360° e Cockpit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenCriahubDrawer && onOpenCriahubDrawer(lead)}
                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Abrir Auditoria 360°, PageSpeed e Scripts de Alta Conversão"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Auditoria 360° Completa</span>
                </button>

                {onOpenCockpit && (
                  <button
                    type="button"
                    onClick={() => onOpenCockpit(lead)}
                    className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Abrir Cockpit 1-a-1 focado neste lead"
                  >
                    <Compass className="w-3.5 h-3.5 text-amber-200" />
                    <span>Cockpit SDR 1-a-1</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. RODAPÉ DE STATUS E OPERAÇÃO */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Status:</span>
          <select 
            value={lead.status}
            onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
            className={`text-xs uppercase font-black px-2.5 py-1 rounded-lg cursor-pointer border ring-1 ring-inset focus:ring-2 outline-none shadow-2xs ${getStatusColor(lead.status)}`}
          >
            <option value="new">📥 Novo</option>
            <option value="contacted">💬 Contactado</option>
            <option value="qualified">🤝 Qualificado</option>
            <option value="ignored">🚫 Desqualificado</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button 
            type="button"
            onClick={() => onOpenOmnichannel(lead, 'email')}
            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="E-mail AIDA/PAS"
          >
            <Mail className="w-4 h-4" />
          </button>

          {onOpenGroqTriage && (
            <button 
              type="button"
              onClick={() => onOpenGroqTriage(lead)}
              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
              title="Triagem Llama-3 & Webhook"
            >
              <Cpu className="w-4 h-4" />
            </button>
          )}

          <button 
            type="button"
            onClick={() => onDelete(lead.id)} 
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
            title="Remover Lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de Abordagem IA em Tempo Real (opcional) */}
      {showAiOutreachModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 sm:p-6">
            <RealtimeSdrOutreachPanel 
              lead={lead} 
              onClose={() => setShowAiOutreachModal(false)}
              compact={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadCard;
