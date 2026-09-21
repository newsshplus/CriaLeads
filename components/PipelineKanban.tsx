import React, { useState } from 'react';
import { 
  Lead, 
  BusinessProfile 
} from '../types';
import { calculateLeadRoiRecommendation, getRoiVerdictStyle } from '../services/roiRecommendationService';
import { 
  Flame, 
  Zap, 
  Clock, 
  AlertTriangle, 
  MessageSquare, 
  PhoneCall, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  User, 
  Building2, 
  ExternalLink, 
  DollarSign, 
  CheckCircle2, 
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Filter,
  Phone,
  Copy,
  Check,
  Compass
} from 'lucide-react';

interface PipelineKanbanProps {
  leads: Lead[];
  businessProfile?: BusinessProfile;
  onUpdateStatus: (leadId: string, status: Lead['status']) => void;
  onOpenCriahubDrawer: (lead: Lead) => void;
  onOpenOmnichannel: (lead: Lead, tab: any) => void;
  onOpenLiveCopilot?: (lead: Lead) => void;
  onOpenNotes?: (lead: Lead) => void;
  onOpenCockpit?: (lead: Lead) => void;
  onOpenHunterCall?: (lead: Lead) => void;
}

interface ColumnConfig {
  id: Lead['status'];
  title: string;
  badgeColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
}

const COLUMNS: ColumnConfig[] = [
  {
    id: 'new',
    title: 'Novos Mapeados',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    borderColor: 'border-t-indigo-500',
    icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
    description: 'Prontos para primeiro contato'
  },
  {
    id: 'contacted',
    title: 'Em Cadência / Contactados',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
    borderColor: 'border-t-blue-500',
    icon: <MessageSquare className="w-4 h-4 text-blue-600" />,
    description: 'WhatsApp ou E-mail disparado'
  },
  {
    id: 'qualified',
    title: 'Em Conversa / Qualificados',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    borderColor: 'border-t-emerald-500',
    icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
    description: 'Interesse confirmado / Em negociação'
  },
  {
    id: 'ignored',
    title: 'Standby / Desqualificados',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    borderColor: 'border-t-slate-400',
    icon: <AlertTriangle className="w-4 h-4 text-slate-500" />,
    description: 'Sem fit ou retorno futuro'
  }
];

export const PipelineKanban: React.FC<PipelineKanbanProps> = ({
  leads,
  businessProfile,
  onUpdateStatus,
  onOpenCriahubDrawer,
  onOpenOmnichannel,
  onOpenLiveCopilot,
  onOpenNotes,
  onOpenCockpit,
  onOpenHunterCall
}) => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);

  const copyPhone = (phoneStr: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!phoneStr) return;
    navigator.clipboard.writeText(phoneStr);
    setCopiedLeadId(id);
    setTimeout(() => setCopiedLeadId(null), 2500);
  };

  const getLeadsByStatus = (status: Lead['status']) => {
    return leads.filter(lead => (lead.status || 'new') === status);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Lead['status']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    if (leadId) {
      onUpdateStatus(leadId, status);
    }
    setDraggedLeadId(null);
  };

  const moveStatus = (leadId: string, currentStatus: Lead['status'], direction: 'next' | 'prev') => {
    const statuses: Lead['status'][] = ['new', 'contacted', 'qualified', 'ignored'];
    const currentIndex = statuses.indexOf(currentStatus || 'new');
    if (direction === 'next' && currentIndex < statuses.length - 1) {
      onUpdateStatus(leadId, statuses[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      onUpdateStatus(leadId, statuses[currentIndex - 1]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Kanban Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Funil Visual de Prospecção (Kanban do SDR)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Arraste os cards ou use as setas para avançar os leads na esteira de prospecção e fechamento.
          </p>
        </div>

        {onOpenCockpit && leads.length > 0 && (
          <button
            onClick={() => onOpenCockpit(leads[0])}
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Abrir Modo Cockpit (Foco 1-a-1)</span>
          </button>
        )}
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
        {COLUMNS.map(col => {
          const colLeads = getLeadsByStatus(col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`bg-slate-100/80 rounded-2xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col min-h-[550px] shadow-2xs ${col.borderColor} border-t-4 transition-colors`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">{col.title}</h3>
                    <span className="text-[11px] text-slate-500 block leading-tight">{col.description}</span>
                  </div>
                </div>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border shadow-2xs ${col.badgeColor}`}>
                  {colLeads.length}
                </span>
              </div>

              {/* Column Lead Cards */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[750px] pr-1">
                {colLeads.length === 0 ? (
                  <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-slate-400">
                    <p className="text-xs font-medium">Nenhum lead nesta etapa</p>
                    <p className="text-[10px] mt-1 text-slate-400">Arraste um lead para cá</p>
                  </div>
                ) : (
                  colLeads.map(lead => {
                    const phone = lead.decisionMaker?.directPhone || lead.phone;
                    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
                    const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor';
                    const customMessage = lead.outreach?.whatsapp?.option1Curiosity || 
                      `Olá ${decisorName}, tudo bem? Vi a ${lead.name} e notei uma oportunidade rápida para otimizar seus atendimentos e captação de clientes. Podemos falar 2 minutos?`;

                    const roiRec = lead.roiRecommendation || calculateLeadRoiRecommendation(lead, businessProfile);
                    const roiStyle = getRoiVerdictStyle(roiRec.verdict);

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead.id)}
                        className={`bg-white rounded-xl border border-slate-200/90 hover:border-indigo-400 p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing group relative ${roiStyle.borderAccent}`}
                      >
                        {/* Top: Score & Intent */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            lead.intentPriority === 'HIGH' 
                              ? 'bg-rose-100 text-rose-900 border-rose-300' 
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}>
                            {lead.intentPriority === 'HIGH' ? '🔥 URGENTE 1H' : '⚡ HOT ICP'}
                          </span>

                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            <span className="text-xs font-black text-slate-900">{lead.intentScore ?? lead.icpScore}%</span>
                            <span className="text-[9px] uppercase font-bold text-indigo-600">Match</span>
                          </div>
                        </div>

                        {/* ROI Verdict Badge & Formato de Contato */}
                        <div className="mb-2 space-y-1">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded border ${roiStyle.badgeBg}`}>
                              <span>{roiStyle.emoji}</span>
                              <span>{roiRec.verdictBadge}</span>
                            </span>
                          </div>

                          {/* Chips de Falhas Digitais e Serviços Ofertáveis */}
                          {(roiRec.offeringSynergy?.detectedDigitalFlaws?.length || 0) > 0 ? (
                            <div className="flex items-center gap-1 flex-wrap pt-0.5">
                              <span className="text-[9px] font-bold bg-rose-50 text-rose-900 border border-rose-200 px-1.5 py-0.2 rounded">
                                🚨 {roiRec.offeringSynergy?.detectedDigitalFlaws?.length} Falha(s) no Meio Digital
                              </span>
                              {roiRec.offeringSynergy?.servicesMatched?.[0] && (
                                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 px-1.5 py-0.2 rounded truncate max-w-[170px]" title={`Serviço Ofertado: ${roiRec.offeringSynergy.servicesMatched[0]}`}>
                                  💼 {roiRec.offeringSynergy.servicesMatched[0]}
                                </span>
                              )}
                            </div>
                          ) : null}

                          {/* Aviso Anti-Spam no Card do Kanban quando o canal for WhatsApp */}
                          {roiRec.verdict === 'WHATSAPP_FIRST' && (
                            <div className="text-[9px] font-extrabold text-teal-900 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <span>⚠️ Abordagem 1-a-1 (Evite Spam/Ban)</span>
                            </div>
                          )}
                        </div>

                        {/* Title & Decisor */}
                        <h4 
                          onClick={() => onOpenCriahubDrawer(lead)}
                          className="font-extrabold text-slate-900 text-sm leading-snug hover:text-indigo-600 cursor-pointer line-clamp-1"
                          title={lead.name}
                        >
                          {lead.name}
                        </h4>

                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                          <span>{lead.category}</span>
                          <span>•</span>
                          <span>{lead.city}</span>
                        </div>

                        {/* Decisor summary */}
                        <div className="mt-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/90 text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 font-black text-slate-900 min-w-0">
                              <User className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span className="truncate">{decisorName}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold block truncate shrink-0">
                              {lead.decisionMaker?.role || 'Diretoria'}
                            </span>
                          </div>

                          {/* Contact Phone with 1-Click Copy */}
                          {phone ? (
                            <div className="flex items-center justify-between gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 text-[11px]">
                              <div className="flex items-center gap-1 font-mono font-bold text-slate-900 truncate">
                                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{phone}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => copyPhone(phone, lead.id, e)}
                                  className="text-slate-500 hover:text-slate-800 p-0.5 rounded"
                                  title="Copiar telefone"
                                >
                                  {copiedLeadId === lead.id ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                                {cleanPhone && (
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded"
                                    title="Discar telefone"
                                  >
                                    <PhoneCall className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : null}
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-slate-100">
                          {/* WhatsApp */}
                          <button
                            onClick={() => {
                              if (cleanPhone) {
                                window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customMessage)}`, '_blank');
                                onUpdateStatus(lead.id, 'contacted');
                              } else {
                                onOpenOmnichannel(lead, 'whatsapp');
                              }
                            }}
                            className="flex items-center justify-center gap-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-xl border border-emerald-300 text-[11px] font-black transition-colors shadow-2xs"
                            title="Disparar WhatsApp com Abordagem"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Whats</span>
                          </button>

                          {/* Cold Call / Teleprompter */}
                          <button
                            onClick={() => onOpenHunterCall ? onOpenHunterCall(lead) : onOpenOmnichannel(lead, 'call')}
                            className="flex items-center justify-center gap-1 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-[11px] font-black transition-colors shadow-2xs"
                            title="Ligar Agora (Abrir Teleprompter Hunter)"
                          >
                            <PhoneCall className="w-3.5 h-3.5 text-white" />
                            <span>Ligar</span>
                          </button>

                          {/* Cockpit SDR or 360 Drawer */}
                          {onOpenCockpit ? (
                            <button
                              onClick={() => onOpenCockpit(lead)}
                              className="flex items-center justify-center gap-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl border border-amber-300 text-[11px] font-black transition-colors shadow-2xs"
                              title="Abrir Cockpit SDR 1-a-1"
                            >
                              <Compass className="w-3.5 h-3.5 text-amber-800" />
                              <span>Cockpit</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenCriahubDrawer(lead)}
                              className="flex items-center justify-center gap-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-xl border border-indigo-200 text-[11px] font-black transition-colors shadow-2xs"
                              title="Abrir Análise 360°"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                              <span>Dossiê</span>
                            </button>
                          )}
                        </div>

                        {/* Stage Moving Controls */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                          <button
                            onClick={() => moveStatus(lead.id, lead.status || 'new', 'prev')}
                            disabled={(lead.status || 'new') === 'new'}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para etapa anterior"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          {onOpenNotes && (
                            <button
                              onClick={() => onOpenNotes(lead)}
                              className="text-[10px] text-slate-500 hover:text-indigo-600 font-bold flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              {lead.notes ? 'Ver Notas' : '+ Nota'}
                            </button>
                          )}

                          <button
                            onClick={() => moveStatus(lead.id, lead.status || 'new', 'next')}
                            disabled={(lead.status || 'new') === 'ignored'}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Avançar para próxima etapa"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineKanban;
