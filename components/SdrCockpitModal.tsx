import React, { useState, useEffect } from 'react';
import { 
  Lead, 
  BusinessProfile, 
  ObjectionCrusherMatrix 
} from '../types';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  Copy, 
  Check, 
  User, 
  Building2, 
  ExternalLink, 
  Flame, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Send,
  HelpCircle,
  Phone,
  CheckCircle2,
  PhoneForwarded,
  CalendarCheck,
  PhoneOff,
  UserX
} from 'lucide-react';
import { buildObjectionCrusherMatrix } from '../services/objectionCrusherService';
import { buildCadenceMaster } from '../services/cadenceService';
import { RealtimeSdrOutreachPanel } from './RealtimeSdrOutreachPanel';
import { calculateLeadRoiRecommendation, getRoiVerdictStyle } from '../services/roiRecommendationService';
import { checkLeadStatus, saveContactedLead } from '../services/storageService';

interface SdrCockpitModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  currentLeadIndex: number;
  onNavigateLead: (index: number) => void;
  onUpdateStatus: (leadId: string, status: Lead['status']) => void;
  onSaveLead: (updatedLead: Lead) => void;
  businessProfile: BusinessProfile;
  onOpenCriahubDrawer?: (lead: Lead) => void;
  onOpenHunterCall?: (lead: Lead) => void;
}

export const SdrCockpitModal: React.FC<SdrCockpitModalProps> = ({
  isOpen,
  onClose,
  leads,
  currentLeadIndex,
  onNavigateLead,
  onUpdateStatus,
  onSaveLead,
  businessProfile,
  onOpenCriahubDrawer,
  onOpenHunterCall
}) => {
  if (!isOpen || leads.length === 0) return null;

  const lead = leads[currentLeadIndex] || leads[0];
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState(lead.notes || '');
  const [selectedSpintax, setSelectedSpintax] = useState<'A' | 'B' | 'C'>('A');
  const [activeObjectionTab, setActiveObjectionTab] = useState<'alreadyHave' | 'sendEmail' | 'noBudget' | 'noTime' | 'notInterested'>('alreadyHave');

  const roiRec = lead.roiRecommendation || calculateLeadRoiRecommendation(lead, businessProfile);
  const roiStyle = getRoiVerdictStyle(roiRec.verdict);
  const retainerOffer = roiRec.offeringSynergy?.recurringRetainerOffer;
  const worthAnalysis = roiRec.worthContacting;

  const [activeRightTab, setActiveRightTab] = useState<'worth_analysis' | 'retainer_mrr' | 'niche_ai' | 'whatsapp_spintax' | 'objections' | 'teleprompter'>('worth_analysis');

  useEffect(() => {
    setLocalNotes(lead.notes || '');
    setActiveRightTab('worth_analysis');
  }, [lead.id]);

  const contactStatus = checkLeadStatus(lead);
  const isAlreadyContacted = Boolean(
    lead.status === 'contacted' || 
    contactStatus.contacted || 
    lead.alreadyContactedWarning?.isContacted
  );

  const [occurrenceOutcome, setOccurrenceOutcome] = useState<string>('REUNIAO_AGENDADA');
  const [occurrenceNotes, setOccurrenceNotes] = useState<string>('');
  const [occurrenceSavedMsg, setOccurrenceSavedMsg] = useState<string | null>(null);

  const handleSaveOccurrence = (outcomeToSave?: string) => {
    const outcome = outcomeToSave || occurrenceOutcome;
    const outcomeLabels: Record<string, string> = {
      'REUNIAO_AGENDADA': 'Reunião / Demonstração Agendada',
      'FALOU_COM_DECISOR': 'Falou com Decisor (Em Negociação)',
      'CHAMOU_SEM_RESPOSTA': 'Chamou e Não Atendeu / Caixa Postal',
      'SEM_INTERESSE': 'Sem Interesse (Não Ligar Mais)',
      'WHATSAPP_ENVIADO': 'WhatsApp Enviado (Aguardando Resposta)'
    };
    const outcomeLabel = outcomeLabels[outcome] || outcome;
    
    saveContactedLead(lead, {
      outcome,
      outcomeLabel,
      notes: occurrenceNotes || localNotes,
      operatorName: 'SDR'
    });

    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

    onUpdateStatus(lead.id, 'contacted');
    onSaveLead({
      ...lead,
      status: 'contacted',
      lastContactedAt: now.toISOString(),
      contactOutcome: outcome,
      contactOutcomeLabel: outcomeLabel,
      contactNotes: occurrenceNotes || localNotes,
      alreadyContactedWarning: {
        isContacted: true,
        contactedAt: now.toISOString(),
        formattedDate,
        outcome,
        outcomeLabel,
        notes: occurrenceNotes || localNotes,
        operatorName: 'SDR'
      }
    });

    setOccurrenceSavedMsg(`✅ Ocorrência registrada: "${outcomeLabel}"`);
    setTimeout(() => setOccurrenceSavedMsg(null), 3500);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleNotesChange = (text: string) => {
    setLocalNotes(text);
    onSaveLead({
      ...lead,
      notes: text
    });
  };

  const phone = lead.decisionMaker?.directPhone || lead.phone;
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
  const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor Comercial';
  const decisorRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Diretoria Executiva';

  // Objections Matrix
  const objectionMatrix: ObjectionCrusherMatrix = lead.objectionCrusher || buildObjectionCrusherMatrix(lead, businessProfile);
  const cadence = lead.cadence || buildCadenceMaster(lead, businessProfile);

  // Spintax Options for WhatsApp
  const whatsVariations = {
    A: lead.guardian?.whatsappShield.spinningVariations.variationA || 
       `Olá ${decisorName}, tudo bem? Notei que na ${lead.name} vocês têm grande potencial de otimização em captação de clientes. Teria 2 minutos para ver um diagnóstico rápido?`,
    B: lead.guardian?.whatsappShield.spinningVariations.variationB || 
       `Fala ${decisorName}, acompanhando o mercado de ${lead.category} vi que vocês possuem alta reputação (${lead.rating || 5.0}⭐). Preparamos uma análise de gargalos operacionais pronta para você. Posso enviar?`,
    C: lead.guardian?.whatsappShield.spinningVariations.variationC || 
       `Olá ${decisorName}, vi sua liderança na ${lead.name}. Identificamos 3 melhorias práticas para acelerar o retorno comercial de vocês sem aumentar custos de anúncios. Me avisa se fizer sentido trocar uma ideia!`
  };

  const currentWhatsMessage = whatsVariations[selectedSpintax];

  const handleOpenWhatsApp = () => {
    if (cleanPhone) {
      window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(currentWhatsMessage)}`, '_blank');
      onUpdateStatus(lead.id, 'contacted');
    }
  };

  const handleNext = () => {
    if (currentLeadIndex < leads.length - 1) {
      onNavigateLead(currentLeadIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentLeadIndex > 0) {
      onNavigateLead(currentLeadIndex - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-6xl bg-white h-full max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Top Header Cockpit Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Cockpit do SDR • Modo Foco 1-a-1</h2>
                <span className="text-xs font-black bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 px-2 py-0.5 rounded-full">
                  Lead {currentLeadIndex + 1} de {leads.length}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 hidden sm:block">
                Interface de alta produtividade para prospecção outbound, ligações e quebra de objeções.
              </p>
            </div>
          </div>

          {/* Navigation Controls & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 rounded-xl border border-slate-700/80 p-1">
              <button
                onClick={handlePrev}
                disabled={currentLeadIndex === 0}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Lead Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-3 text-xs font-bold text-slate-300">
                {currentLeadIndex + 1} / {leads.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentLeadIndex === leads.length - 1}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Próximo Lead"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Fechar Cockpit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 🛑 ALERTA ANTI-QUEIMAÇÃO (Aviso se já foi contatado anteriormente) */}
        {isAlreadyContacted && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2.5 flex items-center justify-between gap-3 border-b border-amber-600/40 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-black">
              <AlertTriangle className="w-5 h-5 text-slate-950 shrink-0 animate-pulse" />
              <span>🛑 ALERTA ANTI-QUEIMAÇÃO: Esta empresa já foi contatada!</span>
              <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono">
                {contactStatus.formattedDate || lead.alreadyContactedWarning?.formattedDate || 'Histórico Registrado'}
              </span>
              <span className="font-extrabold text-slate-900">
                Ocorrência: {contactStatus.outcomeLabel || lead.alreadyContactedWarning?.outcomeLabel || lead.contactOutcomeLabel || 'Contato Realizado'}
              </span>
              {(contactStatus.notes || lead.alreadyContactedWarning?.notes || lead.contactNotes) && (
                <span className="italic font-medium text-slate-900 hidden lg:inline">
                  — "{contactStatus.notes || lead.alreadyContactedWarning?.notes || lead.contactNotes}"
                </span>
              )}
            </div>
            <div className="text-[11px] font-black bg-slate-950/10 px-2.5 py-1 rounded text-slate-950 border border-slate-950/20 shrink-0">
              ⚠️ Não ligar repetidamente para evitar desgaste
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* Left Column: Lead Dossier & Decisor Info (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Registrar Ocorrência do Contato (Histórico Anti-Queimação) */}
            <div className="bg-white rounded-2xl border border-indigo-200/90 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PhoneForwarded className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Registrar Ocorrência da Ligação
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Histórico Anti-Queimação
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveOccurrence('REUNIAO_AGENDADA')}
                  className="p-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Reunião Agendada</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveOccurrence('FALOU_COM_DECISOR')}
                  className="p-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Falou c/ Decisor</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveOccurrence('CHAMOU_SEM_RESPOSTA')}
                  className="p-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors"
                >
                  <PhoneOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Não Atendeu / Caixa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveOccurrence('SEM_INTERESSE')}
                  className="p-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 transition-colors"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-600" />
                  <span>Sem Interesse</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600">
                  O que ocorreu na ligação / anotações da conversa:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={occurrenceNotes}
                    onChange={(e) => setOccurrenceNotes(e.target.value)}
                    placeholder="Ex: Falei com o sócio Marcos, pediu para ligar na quinta às 14h..."
                    className="flex-1 text-xs p-2 rounded-lg border border-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveOccurrence()}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-lg shrink-0 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </div>

              {occurrenceSavedMsg && (
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-bold border border-emerald-300 animate-fadeIn flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{occurrenceSavedMsg}</span>
                </div>
              )}
            </div>
            
            {/* Company & Decisor Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight">{lead.name}</h3>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {lead.category}
                    </span>
                    <span>{lead.city}, {lead.country || 'Brasil'}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
                  <span className="text-xl font-black text-slate-900">{lead.intentScore ?? lead.icpScore}%</span>
                  <span className="text-[10px] uppercase font-black text-indigo-600 block">Match</span>
                </div>
              </div>

              {/* Decisor Profile */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/40 p-4 rounded-xl border border-indigo-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-sm">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight">{decisorName}</h4>
                      <span className="text-xs text-indigo-900 font-semibold">{decisorRole}</span>
                    </div>
                  </div>
                  
                  {lead.decisionMaker?.roleCategory === 'DONO_CEO_SOCIO' && (
                    <span className="text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                      👑 Dono / Sócio
                    </span>
                  )}
                </div>

                {/* Direct Contact Details */}
                <div className="pt-2.5 border-t border-indigo-200/60 space-y-2 text-xs text-slate-700">
                  {phone ? (
                    <div className="flex items-center justify-between gap-2 bg-white/80 p-2 rounded-xl border border-indigo-200/80">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono font-black text-slate-900 text-xs truncate">{phone}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopy(phone, 'cockpit_phone')}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                          title="Copiar telefone"
                        >
                          {copiedKey === 'cockpit_phone' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`tel:${cleanPhone}`}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                          title="Discar telefone"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>Ligar</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic text-xs">Telefone não listado</div>
                  )}

                  {lead.website && (
                    <div className="flex items-center justify-between bg-white/60 p-1.5 rounded-lg border border-slate-200/60">
                      <span className="text-slate-500 font-bold text-[11px]">Website:</span>
                      <a 
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-indigo-700 font-bold hover:underline truncate max-w-[200px] text-[11px] flex items-center gap-1"
                      >
                        <span>{lead.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                  {lead.fiscalRegistry?.taxId && (
                    <div className="flex items-center justify-between bg-white/60 p-1.5 rounded-lg border border-slate-200/60">
                      <span className="text-slate-500 font-bold text-[11px]">{lead.fiscalRegistry.taxIdLabel || 'CNPJ'}:</span>
                      <span className="font-mono font-black text-teal-900 text-[11px]">{lead.fiscalRegistry.taxId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 🎯 Badge Meta Diária de Prospecção & Retainer Box */}
              {roiRec.dailyQuotaCandidate && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎯</span>
                    <div>
                      <strong className="font-black text-emerald-950 text-xs block">Meta Diária: Ligar Hoje</strong>
                      <span className="text-emerald-800 text-[10px]">Lead qualificado para cota diária de 5+ contatos</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-600 text-white rounded-md shrink-0">
                    Prioritário
                  </span>
                </div>
              )}

              {retainerOffer && (
                <div className="bg-gradient-to-br from-indigo-950 to-purple-950 text-white p-3.5 rounded-xl border border-indigo-700/80 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      Mensalidade Sugerida
                    </span>
                    <span className="text-xs font-black text-amber-300 bg-black/40 px-2 py-0.5 rounded-full border border-amber-400/30">
                      {retainerOffer.monthlyFee}
                    </span>
                  </div>
                  <p className="text-xs font-black text-white">{retainerOffer.planName}</p>
                  <div className="text-[11px] text-indigo-200 font-medium line-clamp-1">
                    Foco: {retainerOffer.includedDeliverables[0]}
                  </div>
                </div>
              )}

              {/* Status Selector & Drawer Trigger */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700">Status no Funil:</span>
                  <select
                    value={lead.status || 'new'}
                    onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
                    className="text-xs font-black uppercase px-3 py-1.5 rounded-xl border border-slate-300 bg-white shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="new">📥 Novo Mapeado</option>
                    <option value="contacted">💬 Em Cadência / Contactado</option>
                    <option value="qualified">🤝 Qualificado / Em Conversa</option>
                    <option value="ignored">🚫 Desqualificado</option>
                  </select>
                </div>

                {onOpenCriahubDrawer && (
                  <button
                    onClick={() => onOpenCriahubDrawer(lead)}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Ver Auditoria 360° & Diagnóstico BANT+ Completo</span>
                  </button>
                )}
              </div>
            </div>

            {/* SDR Notes Pad */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-amber-600" />
                  Anotações Rápidas do SDR (Salva Automático)
                </label>
              </div>
              <textarea
                value={localNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Ex: Liguei e falou para retornar terça às 14h. Pediu para mandar modelo no WhatsApp do sócio..."
                rows={3}
                className="w-full text-xs font-medium text-slate-800 p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-slate-50/50"
              />
            </div>
          </div>

          {/* Right Column: Active Outreach, WhatsApp Anti-Ban & Instant Objection Battlecards (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Top SDR Mode Switcher Bar */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'worth_analysis', label: '🔍 Vale a Pena Ligar? (Diagnóstico Real)', highlight: true },
                ...(retainerOffer ? [{ id: 'retainer_mrr', label: '🔄 Venda de Mensalidade (MRR)', highlight: false }] : []),
                { id: 'niche_ai', label: '⚡ IA Nicho Tempo Real (Zero Clichê)' },
                { id: 'whatsapp_spintax', label: '💬 WhatsApp Anti-Ban' },
                { id: 'objections', label: '🛡️ Battlecards Objeções' },
                { id: 'teleprompter', label: '📞 Teleprompter 60s' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    activeRightTab === tab.id
                      ? tab.highlight 
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-sm ring-1 ring-amber-400' 
                        : 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB: Análise Cirúrgica de Viabilidade (Vale a Pena Tentar Contato?) */}
            {activeRightTab === 'worth_analysis' && worthAnalysis && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                {/* Header do Veredito Real */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${
                      worthAnalysis.badgeTone === 'emerald' ? 'bg-emerald-100 text-emerald-800' :
                      worthAnalysis.badgeTone === 'teal' ? 'bg-teal-100 text-teal-800' :
                      worthAnalysis.badgeTone === 'amber' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {worthAnalysis.badgeTone === 'emerald' ? '🔥' :
                       worthAnalysis.badgeTone === 'teal' ? '💬' :
                       worthAnalysis.badgeTone === 'amber' ? '📩' : '⛔'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                          worthAnalysis.badgeTone === 'emerald' ? 'bg-emerald-50 text-emerald-950 border-emerald-300' :
                          worthAnalysis.badgeTone === 'teal' ? 'bg-teal-50 text-teal-950 border-teal-300' :
                          worthAnalysis.badgeTone === 'amber' ? 'bg-amber-50 text-amber-950 border-amber-300' :
                          'bg-rose-50 text-rose-950 border-rose-300'
                        }`}>
                          {worthAnalysis.verdictLabel}
                        </span>
                        {worthAnalysis.dailyQuotaCandidate && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                            <span>🎯</span> Meta Diária (Top 5+ Ligar Hoje)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cruzamento de dados reais: Google Maps, Google Search, LinkedIn / Apollo e canais verificados
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-black text-slate-400 block">Viabilidade</span>
                      <span className="text-sm font-black text-slate-900">{worthAnalysis.score}/100</span>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center font-black text-xs text-indigo-700 bg-indigo-50">
                      {worthAnalysis.score}%
                    </div>
                  </div>
                </div>

                {/* Headline e Raciocínio Completo (Sem inventar nada) */}
                <div className={`p-4 rounded-xl border ${
                  worthAnalysis.badgeTone === 'emerald' ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' :
                  worthAnalysis.badgeTone === 'teal' ? 'bg-teal-50/70 border-teal-200 text-teal-950' :
                  worthAnalysis.badgeTone === 'amber' ? 'bg-amber-50/70 border-amber-200 text-amber-950' :
                  'bg-rose-50/70 border-rose-200 text-rose-950'
                }`}>
                  <h4 className="font-black text-sm mb-1.5 flex items-center gap-2">
                    <span>💡</span>
                    <span>{worthAnalysis.headline}</span>
                  </h4>
                  <p className="text-xs font-medium leading-relaxed opacity-90">
                    {worthAnalysis.detailedReasoning}
                  </p>
                </div>

                {/* Grid: Fatos Reais Comprovados vs Riscos / Cuidados */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Sinais Positivos Concretos */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Fatos Reais Verificados (Sem Inventar):</span>
                    </h5>
                    <ul className="space-y-1.5">
                      {worthAnalysis.positiveSignals.map((sig, sIdx) => (
                        <li key={sIdx} className="text-xs text-slate-700 flex items-start gap-1.5 leading-snug">
                          <span className="text-emerald-600 font-bold mt-0.5">•</span>
                          <span>{sig}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Fatores de Atenção & Proteção de Canais */}
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                    <h5 className="text-xs font-black uppercase text-amber-900 tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Pontos de Atenção & Cuidado Anti-Spam:</span>
                    </h5>
                    <ul className="space-y-1.5">
                      {worthAnalysis.riskFactors.map((rf, rIdx) => (
                        <li key={rIdx} className="text-xs text-amber-950 flex items-start gap-1.5 leading-snug">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span>{rf}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* O Que Podemos Melhorar Todo Mês (Para Vender Nossas Mensalidades) */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>O que podemos melhorar nela para vender nossas mensalidades:</span>
                    </h5>
                    <button
                      onClick={() => setActiveRightTab('retainer_mrr')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                    >
                      <span>Ver Proposta MRR Detalhada</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {worthAnalysis.whatWeCanImprove.map((item, iIdx) => (
                      <div key={iIdx} className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:border-indigo-300 transition-colors">
                        <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0">✕</span>
                            {item.flawTitle}
                          </span>
                          <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                            {item.monthlyServiceName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 italic mb-1.5 pl-5">
                          Evidência: {item.flawEvidence}
                        </p>
                        <div className="bg-emerald-50/60 border border-emerald-200/70 rounded-lg p-2 pl-3 ml-2 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div>
                            <strong className="font-black text-emerald-900">Melhoria Mensal: </strong>
                            <span>{item.monthlyImprovement}</span>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 shrink-0">
                            Impacto: {item.expectedBusinessImpact}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ação Imediata Recomendada */}
                <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                      Ação Recomendada para o Operador Comercial
                    </span>
                    <p className="text-xs font-bold text-slate-100 mt-0.5">
                      {worthAnalysis.recommendedAction}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {phone && (
                      <a
                        href={`tel:${cleanPhone}`}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Ligar Agora</span>
                      </a>
                    )}
                    <button
                      onClick={() => setActiveRightTab('retainer_mrr')}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Plano Mensal ({worthAnalysis.monthlyRetainerOffer.monthlyFee})</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Venda de Mensalidades Recorrentes (Retainer / MRR) */}
            {activeRightTab === 'retainer_mrr' && retainerOffer && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">
                        Proposta Estruturada de Mensalidade de Serviços (MRR)
                      </h4>
                      <span className="text-xs text-slate-500">
                        Foco em fechar contratos de longo prazo ancorados nas falhas digitais reais
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg">
                      {retainerOffer.monthlyFee}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      Anual: {retainerOffer.annualValue}
                    </span>
                  </div>
                </div>

                {/* Nome do Plano e Foco */}
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                      Plano Recomendado para o Perfil:
                    </span>
                    <span className="text-xs font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded">
                      Sem inventar nada • Baseado em dados reais
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    {retainerOffer.planName}
                  </h3>
                </div>

                {/* O que podemos melhorar para ela continuamente (Entregáveis Inclusos) */}
                <div className="space-y-2">
                  <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    O que vamos melhorar para ela todo mês (Entregáveis Contínuos):
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {retainerOffer.includedDeliverables.map((deliverable, dIdx) => (
                      <div key={dIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {dIdx + 1}
                        </span>
                        <span className="font-semibold leading-snug">{deliverable}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Falhas Digitais Reais que Justificam o Retainer */}
                {(roiRec.offeringSynergy?.detectedDigitalFlaws?.length || 0) > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      Falhas Concretas Identificadas (Base da Negociação):
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {roiRec.offeringSynergy?.detectedDigitalFlaws?.map((flaw, fIdx) => (
                        <div key={fIdx} className="bg-rose-50/60 border border-rose-200 rounded-xl p-2.5 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-950">{flaw.flawTitle}</span>
                            <span className="text-[9px] font-black uppercase px-1 rounded bg-rose-200 text-rose-900">
                              {flaw.flawSeverity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 font-medium">
                            {flaw.flawEvidence}
                          </p>
                          <div className="text-[11px] font-bold text-indigo-900 pt-1 border-t border-rose-200/60">
                            🛠️ Solução Mensal: {flaw.offeredService}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Argumento Matador para Fechar Mensalidade */}
                <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                      <span>🎯</span>
                      <span>Pitch do SDR para Fechar a Mensalidade (Zero Clichê):</span>
                    </strong>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(retainerOffer.closingPitchForRetainer, 'retainer_pitch')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-200 px-2.5 py-1 rounded-lg border border-amber-300 transition-colors"
                    >
                      {copiedKey === 'retainer_pitch' ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'retainer_pitch' ? 'Copiado!' : 'Copiar Argumento'}</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-900 font-medium italic leading-relaxed bg-white p-3 rounded-lg border border-amber-200/70">
                    &ldquo;{retainerOffer.closingPitchForRetainer}&rdquo;
                  </p>
                  <div className="text-[11px] text-amber-900 font-semibold flex items-center gap-1">
                    <span>💡</span>
                    <span>Explique que uma contratação CLT custaria mais que o dobro, enquanto a nossa mensalidade entrega especialistas dedicados desde o dia 1.</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: Real-time AI Niche Outreach Panel */}
            {activeRightTab === 'niche_ai' && (
              <RealtimeSdrOutreachPanel 
                lead={lead} 
                onUpdateLead={onSaveLead} 
                compact={false}
              />
            )}

            {/* TAB 2: WhatsApp Outbound with Anti-Ban Spintax */}
            {activeRightTab === 'whatsapp_spintax' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Disparo de WhatsApp (Proteção Anti-Ban)</h4>
                      <span className="text-xs text-slate-500">Selecione uma variação de spintax para evitar bloqueios</span>
                    </div>
                  </div>

                  {/* Spintax Selector Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    {(['A', 'B', 'C'] as const).map(v => (
                      <button
                        key={v}
                        onClick={() => setSelectedSpintax(v)}
                        className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                          selectedSpintax === v 
                            ? 'bg-white text-emerald-800 shadow-xs border border-slate-200' 
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Var {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Box */}
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
                  <p className="text-xs sm:text-sm text-emerald-950 font-medium whitespace-pre-line leading-relaxed">
                    {currentWhatsMessage}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200/60 text-xs">
                    <span className="text-emerald-800 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Filtro Anti-Spam Ativo • Delay sugerido: 35s - 90s
                    </span>

                    <button
                      onClick={() => copyToClipboard(currentWhatsMessage, 'whats_cockpit')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900 hover:text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-300 shadow-2xs transition-colors"
                    >
                      {copiedKey === 'whats_cockpit' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'whats_cockpit' ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleOpenWhatsApp}
                    disabled={!cleanPhone}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Abrir WhatsApp com Mensagem Pronta</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: Instant Objection Crusher Battlecards */}
            {activeRightTab === 'objections' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Battlecards de Objeções Instantâneas</h4>
                      <span className="text-xs text-slate-500">Respostas prontas com ancoragem psicológica em 1 clique</span>
                    </div>
                  </div>
                </div>

                {/* Objections Quick Selector */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100 p-1.5 rounded-xl">
                  {[
                    { key: 'alreadyHave', label: 'Já Tenho Agência' },
                    { key: 'sendEmail', label: 'Manda por E-mail' },
                    { key: 'noBudget', label: 'Sem Orçamento' },
                    { key: 'noTime', label: 'Sem Tempo Agora' },
                    { key: 'notInterested', label: 'Não Tenho Interesse' }
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setActiveObjectionTab(item.key as any)}
                      className={`py-2 px-1 text-center rounded-lg text-xs font-black transition-all truncate ${
                        activeObjectionTab === item.key
                          ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Selected Objection Card Content */}
                {(() => {
                  const getActiveItem = () => {
                    switch (activeObjectionTab) {
                      case 'alreadyHave': return objectionMatrix.objections.alreadyHaveProvider;
                      case 'sendEmail': return objectionMatrix.objections.sendByEmail;
                      case 'noBudget': return objectionMatrix.objections.noBudget;
                      case 'noTime': return objectionMatrix.objections.noTime;
                      case 'notInterested': return objectionMatrix.objections.notInterested;
                      default: return objectionMatrix.objections.alreadyHaveProvider;
                    }
                  };

                  const currentObj = getActiveItem();

                  return (
                    <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/90 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-900 uppercase">
                          Objeção: &ldquo;{currentObj.objection}&rdquo;
                        </span>
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                          Ângulo: {currentObj.psychologicalAngle}
                        </span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-2xs space-y-2">
                        <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed">
                          &ldquo;{currentObj.responseScript}&rdquo;
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <span className="text-slate-500 font-medium italic">
                            💡 Dica SDR: {currentObj.sdrGuidance}
                          </span>

                          <button
                            onClick={() => copyToClipboard(currentObj.responseScript, 'obj_rebuttal')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                          >
                            {copiedKey === 'obj_rebuttal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'obj_rebuttal' ? 'Copiado!' : 'Copiar Resposta'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* TAB 4: Cold Call Teleprompter Script */}
            {activeRightTab === 'teleprompter' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">Teleprompter de Cold Call (Ligação 60s)</h4>
                      <span className="text-xs text-slate-500">Roteiro direto para prender a atenção nos primeiros 5 segundos</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenHunterCall && (
                      <button
                        type="button"
                        onClick={() => onOpenHunterCall(lead)}
                        className="inline-flex items-center gap-1 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-3 py-1.5 rounded-lg shadow-sm transition-all"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-white" />
                        <span>Abrir Teleprompter Hunter</span>
                      </button>
                    )}

                    <button
                      onClick={() => copyToClipboard(
                        `[Quebra Gelo]: ${cadence.step3Call.script.icebreaker}\n[Problema]: ${cadence.step3Call.script.anchorQuestion}\n[Pitch]: ${cadence.step3Call.script.pitch}`,
                        'teleprompter_script'
                      )}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                    >
                      {copiedKey === 'teleprompter_script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copiar Roteiro</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="text-indigo-900 block font-bold mb-0.5">1. Quebra de Gelo (5 Segundos):</strong>
                    <p className="text-slate-800">{cadence.step3Call.script.icebreaker}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="text-indigo-900 block font-bold mb-0.5">2. Pergunta de Ancoragem (Dor Mapeada):</strong>
                    <p className="text-slate-800">{cadence.step3Call.script.anchorQuestion}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <strong className="text-indigo-900 block font-bold mb-0.5">3. Pitch Direto (15 Segundos):</strong>
                    <p className="text-slate-800">{cadence.step3Call.script.pitch}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Bottom Cockpit Footer Bar */}
        <div className="bg-white p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span>Dica de Velocidade:</span>
            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">Dispare pelo WhatsApp e avance com o botão Próximo</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onUpdateStatus(lead.id, 'qualified');
                handleNext();
              }}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Marcar Qualificado & Próximo</span>
            </button>

            <button
              onClick={handleNext}
              disabled={currentLeadIndex === leads.length - 1}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <span>Avançar para Próximo Lead</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SdrCockpitModal;
