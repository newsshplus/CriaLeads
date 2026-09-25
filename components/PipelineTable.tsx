import React, { useState } from 'react';
import { Lead, IcpTier, BusinessProfile } from '../types';
import { 
  Flame, Zap, AlertTriangle, ExternalLink, Globe, Phone, Mail, 
  MessageSquare, PhoneCall, Send, CheckCircle, User, Sparkles,
  Layers, Clock, DollarSign, ShieldAlert, Cpu, Crosshair, Calendar,
  FileText, Edit3, Copy, Check, Compass, MapPin, ChevronDown, ChevronUp, ChevronRight,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { getWhatsAppOutreachUrl, formatLeadWhatsAppMessage } from '../services/whatsAppOutreachHelper';
import { calculateLeadRoiRecommendation, getRoiVerdictStyle } from '../services/roiRecommendationService';

interface PipelineTableProps {
  leads: Lead[];
  selectedLeadIds: Set<string>;
  businessProfile?: BusinessProfile;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenOmnichannel: (lead: Lead, tab?: 'criahub_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech') => void;
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onDelete: (id: string) => void;
  onOpenLiveCopilot?: (lead: Lead) => void;
  onOpenNotes?: (lead: Lead) => void;
  onOpenCriahubDrawer?: (lead: Lead) => void;
  onOpenHunterCall?: (lead: Lead) => void;
  onOpenCockpit?: (lead: Lead) => void;
  onOpenFocusDialer?: (lead: Lead) => void;
  onUpdateLead?: (updatedLead: Lead) => void;
}

const PipelineTable: React.FC<PipelineTableProps> = ({
  leads,
  selectedLeadIds,
  businessProfile,
  onToggleSelect,
  onToggleSelectAll,
  onOpenOmnichannel,
  onUpdateStatus,
  onDelete,
  onOpenLiveCopilot,
  onOpenNotes,
  onOpenCriahubDrawer,
  onOpenHunterCall,
  onOpenCockpit,
  onOpenFocusDialer,
  onUpdateLead
}) => {
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [copiedTextKey, setCopiedTextKey] = useState<string | null>(null);
  const [filterDailyQuotaOnly, setFilterDailyQuotaOnly] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [hideContacted, setHideContacted] = useState(false);

  // Mapeia os leads com os cálculos de ROI e avaliação de viabilidade SDR
  const leadsWithRoi = leads.map((lead, idx) => {
    const roi = lead.roiRecommendation || calculateLeadRoiRecommendation(lead, businessProfile);
    const assignedDay = lead.cadenceDay || (Math.floor(idx / 5) + 1);
    const assignedDayLabel = lead.cadenceDayLabel || (assignedDay === 1 ? 'Dia 1 (Meta de Hoje)' : assignedDay === 2 ? 'Dia 2 (Amanhã)' : `Dia ${assignedDay} (Planejado)`);
    return { 
      lead: {
        ...lead,
        cadenceDay: assignedDay,
        cadenceDayLabel: assignedDayLabel
      }, 
      roi 
    };
  });

  const dailyQuotaCandidates = leadsWithRoi.filter(item => 
    Boolean(item.roi.dailyQuotaCandidate || item.roi.verdict === 'CALL_MEETING')
  );

  const totalDaysPlanned = Math.max(1, Math.ceil(leads.length / 5));
  const alreadyContactedCount = leads.filter(l => l.status === 'contacted' || l.alreadyContactedWarning?.isContacted).length;

  const displayedItems = leadsWithRoi.filter(({ lead, roi }) => {
    if (filterDailyQuotaOnly && !roi.dailyQuotaCandidate && roi.verdict !== 'CALL_MEETING') {
      return false;
    }
    if (hideContacted && (lead.status === 'contacted' || lead.alreadyContactedWarning?.isContacted)) {
      return false;
    }
    if (selectedDay !== 'all') {
      if (lead.cadenceDay !== selectedDay) return false;
    }
    return true;
  });

  const toggleExpandLead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedLeadId(prev => prev === id ? null : id);
  };

  const handleCopyText = (text: string, key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedTextKey(key);
    setTimeout(() => setCopiedTextKey(null), 2000);
  };

  const handleQuickWhatsAppSend = (lead: Lead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const wa = getWhatsAppOutreachUrl(lead);
    if (wa?.url) {
      window.open(wa.url, '_blank', 'noopener,noreferrer');
      if (onUpdateLead) {
        onUpdateLead({
          ...lead,
          status: 'contacted',
          whatsAppStatus: 'sent',
          whatsAppSentAt: new Date().toISOString(),
          lastContactedAt: new Date().toISOString()
        });
      } else {
        onUpdateStatus(lead.id, 'contacted');
      }
    } else {
      onOpenOmnichannel(lead, 'whatsapp');
    }
  };

  const copyPhone = (phone: string, leadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedLeadId(leadId);
    setTimeout(() => setCopiedLeadId(null), 2500);
  };

  const getIntentBadge = (priority?: 'HIGH' | 'MEDIUM' | 'DISQUALIFIED', score?: number) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-100 text-rose-950 border border-rose-300 shadow-2xs">
            <Flame className="w-3 h-3 mr-1 fill-rose-500 text-rose-600 animate-pulse" />
            DISPARO 1H ({score ?? 85}%)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-amber-300">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            FILA PADRÃO ({score ?? 65}%)
          </span>
        );
      case 'DISQUALIFIED':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-gray-500" />
            DESQUALIFICADO ({score ?? 40}%)
          </span>
        );
    }
  };

  const getTierBadge = (tier: IcpTier) => {
    switch (tier) {
      case 'SCORE_A':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300">
            SCORE A (Hot)
          </span>
        );
      case 'SCORE_B':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-950 border border-blue-300">
            SCORE B (Warm)
          </span>
        );
      case 'SCORE_C':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-300">
            SCORE C (Cold)
          </span>
        );
    }
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-rose-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 🎯 Meta Diária de Prospecção & Planejamento Multi-Dias (5 Leads por Dia) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 border-b border-indigo-900/60 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shadow-sm shrink-0 ${
              leads.length >= 50 
                ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300/40' 
                : 'bg-indigo-500 text-white ring-2 ring-indigo-300/40'
            }`}>
              {leads.length >= 50 ? '🚀' : '📅'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-black tracking-tight text-white">
                  Planejamento Diário SDR • 5 Ligações por Dia
                </h4>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md border bg-emerald-500/20 text-emerald-300 border-emerald-400/40">
                  {leads.length} Leads Mapeados = {totalDaysPlanned} Dias de Prospecção Garantidos
                </span>
                {alreadyContactedCount > 0 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40">
                    ⚠️ {alreadyContactedCount} Já Contatados
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Cada dia contém exatamente 5 empresas hiper-qualificadas para contato outbound sem repetir busca.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setHideContacted(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                hideContacted 
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black' 
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Ocultar leads que já receberam ligação anterior para evitar ligar novamente"
            >
              <span>{hideContacted ? '✓' : '👁️'}</span>
              <span>Ocultar Já Contatados ({alreadyContactedCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterDailyQuotaOnly(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                filterDailyQuotaOnly 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md ring-2 ring-emerald-300/60' 
                  : 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fila Quente ({dailyQuotaCandidates.length})</span>
            </button>
          </div>
        </div>

        {/* Barra de Seleção de Dias (Dia 1 a Dia 10+) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 mr-1">Filtrar Dia:</span>
          <button
            type="button"
            onClick={() => setSelectedDay('all')}
            className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors ${
              selectedDay === 'all' 
                ? 'bg-white text-slate-950 shadow-xs font-black' 
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Todos ({leads.length})
          </button>
          {Array.from({ length: Math.min(totalDaysPlanned, 12) }, (_, i) => i + 1).map(dayNum => {
            const dayLeadsCount = leads.filter(l => (l.cadenceDay || (Math.floor(leads.indexOf(l) / 5) + 1)) === dayNum).length;
            const isToday = dayNum === 1;
            const isTomorrow = dayNum === 2;
            const label = isToday ? '🔥 Dia 1 (Hoje)' : isTomorrow ? 'Dia 2 (Amanhã)' : `Dia ${dayNum}`;
            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                  selectedDay === dayNum 
                    ? 'bg-indigo-600 text-white shadow-xs font-black ring-1 ring-indigo-400' 
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{label}</span>
                <span className="text-[10px] bg-slate-900/60 px-1 py-0.2 rounded text-slate-300">
                  {dayLeadsCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-700">
              <th className="py-3.5 px-4 w-10">
                <input 
                  type="checkbox" 
                  checked={displayedItems.length > 0 && selectedLeadIds.size === displayedItems.length}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4 min-w-[220px]">Empresa & Local</th>
              <th className="py-3.5 px-4 min-w-[240px]">Decisor & Contato Direto</th>
              <th className="py-3.5 px-4 text-center">Intent Score</th>
              <th className="py-3.5 px-4">Prioridade</th>
              <th className="py-3.5 px-4">BANT+ Diagnóstico</th>
              <th className="py-3.5 px-4 min-w-[200px]">Gaps Identificados</th>
              <th className="py-3.5 px-4 min-w-[210px]">Veredito ROI & Canal</th>
              <th className="py-3.5 px-4 text-right min-w-[260px]">Ações SDR Rápidas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {displayedItems.map(({ lead, roi: roiRec }) => {
              const isSelected = selectedLeadIds.has(lead.id);
              const directPhone = lead.decisionMaker?.directPhone || lead.phone || '';
              const cleanPhone = directPhone.replace(/\D/g, '');
              const waPitch = lead.outreach?.whatsapp?.option1Curiosity || 
                `Olá, vi o perfil da ${lead.name} e identifiquei oportunidades comerciais para vocês. Teria 2 minutos para um diagnóstico?`;
              const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waPitch)}` : null;

              const detectedTools = lead.techStack?.detectedTools || [];
              const flaws = lead.keyFlaws || lead.bantPlus?.need?.operationalFlaws || [];

              const roiStyle = getRoiVerdictStyle(roiRec.verdict);

              return (
                <React.Fragment key={lead.id}>
                  <tr 
                    id={`row-lead-${lead.id}`}
                    className={`hover:bg-slate-50 transition-colors ${
                      isSelected ? 'bg-amber-50/20' : ''
                    } ${lead.status === 'contacted' ? 'opacity-80 bg-slate-50/50' : ''} ${
                      lead.intentPriority === 'HIGH' ? 'border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                  {/* Select Checkbox & Expand Inline Toggle */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => onToggleSelect(lead.id)}
                        className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500 cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={(e) => toggleExpandLead(lead.id, e)}
                        className={`p-1 rounded-lg transition-colors ${
                          expandedLeadId === lead.id 
                            ? 'bg-amber-100 text-amber-950 border border-amber-300' 
                            : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                        title={expandedLeadId === lead.id ? "Recolher Guia e Scripts" : "Expandir Guia Rápido, Scripts e Objeções inline"}
                      >
                        {expandedLeadId === lead.id ? (
                          <ChevronDown className="w-3.5 h-3.5 text-amber-950" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Empresa & Tech Stack */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span 
                          className="font-black text-slate-900 text-sm hover:text-amber-700 cursor-pointer transition-colors" 
                          onClick={() => onOpenCriahubDrawer ? onOpenCriahubDrawer(lead) : onOpenOmnichannel(lead, 'bant')}
                        >
                          {lead.name}
                        </span>

                        {/* Origin API Badge */}
                        {(lead.originApi === 'apollo' || lead.source === 'apollo') ? (
                          <span 
                            title="Lead extraído via Apollo.io com decisor mapeado do LinkedIn" 
                            className="inline-flex items-center text-[9px] text-purple-900 bg-purple-100 px-1.5 py-0.2 rounded font-black border border-purple-300 gap-0.5"
                          >
                            <span>🟣 Apollo</span>
                          </span>
                        ) : lead.originApi === 'synthetic' || lead.source === 'synthetic' ? (
                          <span 
                            title="Lead gerado pelo motor autônomo de inteligência" 
                            className="inline-flex items-center text-[9px] text-amber-950 bg-amber-100 px-1.5 py-0.2 rounded font-black border border-amber-300 gap-0.5"
                          >
                            <span>🟠 IA Autônoma</span>
                          </span>
                        ) : (
                          <a 
                            href={lead.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.city}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Lead extraído e verificado no Google Maps (Clique para abrir perfil oficial)" 
                            className="inline-flex items-center text-[9px] text-teal-950 bg-teal-100 hover:bg-teal-200 px-1.5 py-0.5 rounded font-black border border-teal-300 gap-1 transition-colors cursor-pointer"
                          >
                            <MapPin className="w-2.5 h-2.5 text-teal-700 shrink-0" />
                            <span>Google Maps</span>
                            {lead.rating ? (
                              <span className="text-amber-800 font-black">★ {lead.rating.toFixed(1)}</span>
                            ) : null}
                          </a>
                        )}

                        {lead.status === 'contacted' && (
                          <span className="inline-flex items-center text-[9px] text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded font-bold border border-blue-200">
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                            Contactado
                          </span>
                        )}

                        {roiRec.dailyQuotaCandidate && (
                          <span 
                            title="Candidato prioritário para meta diária de 5+ ligações do SDR"
                            className="inline-flex items-center text-[9px] text-emerald-950 bg-emerald-100 px-1.5 py-0.2 rounded font-black border border-emerald-300 gap-0.5 shadow-2xs"
                          >
                            <span>🎯</span>
                            <span>LIGAR HOJE (META 5+)</span>
                          </span>
                        )}

                        {/* Cadence Day Tag */}
                        <span 
                          className="inline-flex items-center text-[9px] text-indigo-950 bg-indigo-50 px-1.5 py-0.2 rounded font-black border border-indigo-200 gap-0.5"
                          title={`Lead programado no planejamento diário para o ${lead.cadenceDayLabel || `Dia ${lead.cadenceDay}`}`}
                        >
                          <span>📅</span>
                          <span>{lead.cadenceDayLabel || `Dia ${lead.cadenceDay}`}</span>
                        </span>

                        {/* Kit Aluno Score Badge */}
                        {lead.kitAluno && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenCriahubDrawer) onOpenCriahubDrawer(lead);
                            }}
                            className={`inline-flex items-center text-[9px] font-black px-1.5 py-0.2 rounded border gap-0.5 cursor-pointer hover:opacity-80 transition-opacity ${
                              lead.kitAluno.score.classificacao === 'A' ? 'bg-emerald-100 text-emerald-950 border-emerald-300' :
                              lead.kitAluno.score.classificacao === 'B' ? 'bg-blue-100 text-blue-950 border-blue-300' :
                              lead.kitAluno.score.classificacao === 'C' ? 'bg-amber-100 text-amber-950 border-amber-300' :
                              'bg-rose-100 text-rose-950 border-rose-300'
                            }`}
                            title={lead.kitAluno.score.justificativaNota}
                          >
                            <span>🎓 Classe {lead.kitAluno.score.classificacao} ({lead.kitAluno.score.score} pts)</span>
                          </button>
                        )}

                        {/* Kit Aluno Site Morto */}
                        {lead.kitAluno?.score.siteMorto && (
                          <span 
                            className="inline-flex items-center text-[9px] text-white bg-rose-600 px-1.5 py-0.2 rounded font-black animate-pulse"
                            title="Site cadastrado no Google Maps está fora do ar!"
                          >
                            🚨 Site Fora do Ar
                          </span>
                        )}

                        {/* Meta Ads Library Link */}
                        {lead.kitAluno?.marketing.metaAdsUrl && (
                          <a
                            href={lead.kitAluno.marketing.metaAdsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center text-[9px] text-blue-800 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.2 rounded font-bold border border-blue-200 gap-0.5"
                            title="Biblioteca de Anúncios Meta"
                          >
                            <span>Meta Ads</span>
                            <ExternalLink className="w-2 h-2" />
                          </a>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-slate-600 flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="font-bold text-slate-800">{lead.category}</span>
                        <span>•</span>
                        <span>{lead.city}</span>
                        {lead.address && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 truncate max-w-[180px]" title={lead.address}>📍 {lead.address}</span>
                          </>
                        )}
                        {lead.googleMapsLink && (
                          <>
                            <span>•</span>
                            <a
                              href={lead.googleMapsLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-700 hover:text-teal-950 hover:underline flex items-center gap-0.5 font-bold text-[10px]"
                              title="Ver ficha oficial no Google Maps"
                            >
                              <ExternalLink className="w-2.5 h-2.5 text-teal-600" />
                              <span>Ficha Maps {lead.reviews ? `(${lead.reviews})` : ''}</span>
                            </a>
                          </>
                        )}
                        {lead.website ? (
                          (() => {
                            const cleanDomain = lead.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
                            return (
                              <>
                                <span>•</span>
                                <a 
                                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-0.5 max-w-[130px] font-semibold"
                                  title={`Abrir ${cleanDomain}`}
                                >
                                  <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{cleanDomain}</span>
                                </a>
                                {lead.websiteAudit?.isAuthentic && (
                                  <span 
                                    title="Site auditado e verificado por IA"
                                    className="text-[8px] font-black bg-emerald-100 text-emerald-900 px-1 rounded border border-emerald-300"
                                  >
                                    ✓
                                  </span>
                                )}
                              </>
                            );
                          })()
                        ) : (
                          <span className="text-amber-700 italic text-[10px] font-medium">Sem site</span>
                        )}
                      </div>

                      {/* Tech Stack Chips & Notes */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {lead.notes && (
                          <button
                            type="button"
                            onClick={() => onOpenNotes && onOpenNotes(lead)}
                            className="text-[9px] bg-amber-50 hover:bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300 font-bold flex items-center gap-0.5"
                            title={`Nota SDR: ${lead.notes}`}
                          >
                            <FileText className="w-2.5 h-2.5 text-amber-600" />
                            <span>Nota Salva</span>
                          </button>
                        )}
                        {detectedTools.length > 0 && (
                          <>
                            <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
                            {detectedTools.slice(0, 2).map((tool, idx) => (
                              <span 
                                key={idx}
                                className="text-[9px] font-mono bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded border border-slate-300 font-bold"
                              >
                                {tool}
                              </span>
                            ))}
                            {detectedTools.length > 2 && (
                              <span className="text-[9px] text-slate-500 font-mono font-bold">+{detectedTools.length - 2}</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* 🛑 ALERTA ANTI-QUEIMAÇÃO NA LINHA */}
                      {(lead.status === 'contacted' || lead.alreadyContactedWarning?.isContacted) && (
                        <div className="mt-2 p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-1.5 text-[10px] font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span>
                              🛑 <strong>JÁ CONTATADO:</strong> {lead.alreadyContactedWarning?.outcomeLabel || lead.contactOutcomeLabel || 'Contato Realizado'}
                              {lead.alreadyContactedWarning?.formattedDate && (
                                <span className="font-normal text-amber-800"> ({lead.alreadyContactedWarning.formattedDate})</span>
                              )}
                            </span>
                            {(lead.alreadyContactedWarning?.notes || lead.contactNotes) && (
                              <div className="font-normal italic text-[9px] text-amber-900 mt-0.5">
                                "{lead.alreadyContactedWarning?.notes || lead.contactNotes}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Decisor & Contato Direto */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate max-w-[140px]" title={lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Decisor'}>
                            {lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Decisor'}
                          </span>
                        </div>
                        {lead.decisionMaker?.roleCategory === 'DONO_CEO_SOCIO' ? (
                          <span className="text-[9px] font-black text-amber-950 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            👑 Dono
                          </span>
                        ) : lead.decisionMaker?.roleCategory === 'HEAD_COMERCIAL' ? (
                          <span className="text-[9px] font-black text-blue-950 bg-blue-100 px-1.5 py-0.2 rounded border border-blue-300">
                            📈 Vendas
                          </span>
                        ) : lead.decisionMaker?.roleCategory === 'GERENTE_DIRETOR' ? (
                          <span className="text-[9px] font-black text-purple-950 bg-purple-100 px-1.5 py-0.2 rounded border border-purple-300">
                            👔 Diretor
                          </span>
                        ) : null}
                      </div>

                      <div className="text-[11px] text-slate-600 truncate max-w-[150px] font-medium">
                        {lead.bantPlus?.authority?.role || lead.decisionMaker?.role || 'Diretoria Executiva'}
                      </div>

                      {/* 📞 Contact Pill with 1-Click Copy & Direct Dial */}
                      {directPhone ? (
                        <div className="flex items-center gap-1 bg-emerald-50/90 border border-emerald-300/80 px-2 py-1 rounded-lg text-xs">
                          <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span className="font-mono font-black text-slate-900 truncate max-w-[120px]">
                            {directPhone}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => copyPhone(directPhone, lead.id, e)}
                            className="ml-auto text-emerald-800 hover:text-emerald-950 p-0.5 rounded hover:bg-emerald-100"
                            title="Copiar telefone"
                          >
                            {copiedLeadId === lead.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="text-emerald-800 hover:text-emerald-950 p-0.5 rounded hover:bg-emerald-100"
                            title="Discar telefone"
                          >
                            <PhoneCall className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 italic">Sem telefone</div>
                      )}

                      {/* Status de WhatsApp & Desfecho de Ligação */}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {lead.whatsAppStatus === 'sent' && (
                          <span className="inline-flex items-center text-[9px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-1.5 py-0.5 rounded shadow-2xs" title="WhatsApp enviado para este lead">
                            <Check className="w-2.5 h-2.5 mr-0.5 text-emerald-700" />
                            WhatsApp Enviado
                          </span>
                        )}
                        {lead.whatsAppStatus === 'followup_pending' && (
                          <span className="inline-flex items-center text-[9px] font-black bg-amber-100 text-amber-950 border border-amber-300 px-1.5 py-0.5 rounded" title="Follow-up de WhatsApp pendente">
                            <Clock className="w-2.5 h-2.5 mr-0.5 text-amber-700" />
                            Follow-up Whats
                          </span>
                        )}
                        {lead.callOutcome === 'MEETING_BOOKED' && (
                          <span className="inline-flex items-center text-[9px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-2xs">
                            🎯 Reunião
                          </span>
                        )}
                        {lead.callOutcome === 'IN_FOLLOWUP' && (
                          <span className="inline-flex items-center text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded shadow-2xs">
                            ⏳ Follow-up Ligação
                          </span>
                        )}
                        {lead.callOutcome === 'NO_INTEREST' && (
                          <span className="inline-flex items-center text-[9px] font-black bg-slate-400 text-white px-1.5 py-0.5 rounded">
                            ⛔ Sem Interesse
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Intent Score */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-base font-black text-slate-900">{lead.intentScore ?? lead.icpScore}%</span>
                      <div className="w-14 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${getScoreBarColor(lead.intentScore ?? lead.icpScore)}`}
                          style={{ width: `${lead.intentScore ?? lead.icpScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Prioridade Disparo */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div>{getIntentBadge(lead.intentPriority, lead.intentScore ?? lead.icpScore)}</div>
                      <div>{getTierBadge(lead.icpTier)}</div>
                      {lead.seniorIcpQualification && (
                        <div>
                          <span 
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block shadow-2xs ${
                              lead.seniorIcpQualification.commercialDecision === 'LIGAR AGORA' 
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                                : lead.seniorIcpQualification.commercialDecision === 'AGUARDAR' 
                                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                                : 'bg-rose-100 text-rose-900 border-rose-300'
                            }`}
                            title={`Matriz Sênior: ${lead.seniorIcpQualification.commercialDecision} (${lead.seniorIcpQualification.finalScore}/100) - ${lead.seniorIcpQualification.businessType}`}
                          >
                            {lead.seniorIcpQualification.commercialDecision === 'LIGAR AGORA' ? '📞 LIGAR AGORA' : lead.seniorIcpQualification.commercialDecision}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* BANT+ Diagnóstico */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black uppercase text-slate-500">Budget:</span>
                        <span className="text-xs font-black text-slate-900">{lead.bantPlus?.budget?.estimatedRange || lead.budgetRange || 'A Definir'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black uppercase text-slate-500">Timing:</span>
                        <span className="text-xs font-bold text-slate-800">{lead.bantPlus?.timeline?.decisionWindow || 'Imediato'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Gaps Identificados */}
                  <td className="py-3.5 px-4">
                    <div className="bg-rose-50/90 p-2 rounded-xl border border-rose-200 text-xs font-medium text-slate-900 space-y-1">
                      {flaws.length > 0 ? (
                        flaws.slice(0, 2).map((flaw, fIdx) => (
                          <div key={fIdx} className="text-[11px] text-rose-950 font-bold flex items-start gap-1">
                            <span className="text-rose-600 font-black">•</span>
                            <span className="line-clamp-1">{flaw}</span>
                          </div>
                        ))
                      ) : (
                        <span className="line-clamp-2 text-[11px] font-bold text-rose-950">"{lead.identifiedPain}"</span>
                      )}
                    </div>
                  </td>

                  {/* Veredito ROI & Canal de Ataque */}
                  <td className="py-3.5 px-4 min-w-[220px]">
                    <div className={`p-2.5 rounded-xl border ${roiStyle.containerBg} ${roiStyle.borderAccent} space-y-1.5 shadow-2xs`}>
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded border ${roiStyle.badgeBg}`}>
                          <span>{roiStyle.emoji}</span>
                          <span>{roiRec.verdictBadge}</span>
                        </span>
                        {roiRec.worthContacting && (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${
                            roiRec.worthContacting.badgeTone === 'emerald' ? 'bg-emerald-100 text-emerald-950 border-emerald-300' :
                            roiRec.worthContacting.badgeTone === 'teal' ? 'bg-teal-100 text-teal-950 border-teal-300' :
                            roiRec.worthContacting.badgeTone === 'amber' ? 'bg-amber-100 text-amber-950 border-amber-300' :
                            'bg-rose-100 text-rose-950 border-rose-300'
                          }`} title={roiRec.worthContacting.headline}>
                            {roiRec.worthContacting.score}% Viab.
                          </span>
                        )}
                        <span className="text-[9px] font-black text-slate-800 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
                          {roiRec.recommendedChannelLabel}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-800 line-clamp-2 leading-snug" title={roiRec.primaryReason}>
                        {roiRec.primaryReason}
                      </p>

                      {/* Serviços que Servem para este Lead & Viabilidade SDR */}
                      {roiRec.offeringSynergy && (roiRec.offeringSynergy.servicesMatched?.length || 0) > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {roiRec.offeringSynergy.servicesMatched?.map((srv, sIdx) => (
                            <span key={sIdx} className="text-[9px] font-bold bg-white/95 text-indigo-950 border border-indigo-200/80 px-1.5 py-0.2 rounded shadow-2xs">
                              💼 {srv}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] font-extrabold text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                        <span className="truncate max-w-[130px]">🎯 {roiRec.expectedGoal}</span>
                        {roiRec.offeringSynergy?.targetDealSize && (
                          <span className="text-emerald-800 font-black text-[10px] shrink-0">
                            {roiRec.offeringSynergy.targetDealSize.split('(')[0]}
                          </span>
                        )}
                      </div>

                      {/* 🔄 Proposta de Mensalidade Recorrente (Retainer / MRR) */}
                      {roiRec.offeringSynergy?.recurringRetainerOffer && (
                        <div 
                          className="mt-1 p-1.5 bg-indigo-50 hover:bg-indigo-100/90 border border-indigo-200 rounded-lg text-[10px] space-y-0.5 cursor-pointer transition-colors"
                          onClick={(e) => toggleExpandLead(lead.id, e)}
                          title={`Plano Recorrente: ${roiRec.offeringSynergy.recurringRetainerOffer.planName}. Clique para ver proposta completa de mensalidade.`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-indigo-950 truncate">
                              🔄 {roiRec.offeringSynergy.recurringRetainerOffer.monthlyFee}
                            </span>
                            <span className="text-[8px] font-black text-indigo-700 bg-white px-1 py-0.2 rounded border border-indigo-200 uppercase">
                              Mensalidade
                            </span>
                          </div>
                          <div className="text-[9px] text-indigo-900 font-semibold line-clamp-1">
                            {roiRec.offeringSynergy.recurringRetainerOffer.includedDeliverables[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Ações SDR Rápidas */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* 🔥 Ligar Agora (Foco Total / Teleprompter) */}
                      <button
                        onClick={() => {
                          if (onOpenFocusDialer) onOpenFocusDialer(lead);
                          else if (onOpenHunterCall) onOpenHunterCall(lead);
                          else onOpenOmnichannel(lead, 'call');
                        }}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-black shadow-xs flex items-center gap-1 transition-all active:scale-[0.98] ${
                          roiRec.verdict === 'CALL_MEETING'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white ring-2 ring-emerald-400/40 shadow-sm'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        title={roiRec.verdict === 'CALL_MEETING' ? "Canal Recomendado: Ligar para Agendar Demonstração" : "Ligar Agora (Abrir Modo Foco Total / Teleprompter)"}
                      >
                        <PhoneCall className={`w-3.5 h-3.5 text-white ${roiRec.verdict === 'CALL_MEETING' ? 'animate-pulse' : ''}`} />
                        <span>{roiRec.verdict === 'CALL_MEETING' ? 'Ligar (Recomendado)' : 'Ligar'}</span>
                      </button>

                      {/* 💬 WhatsApp 1-Click Direto */}
                      <button
                        onClick={(e) => handleQuickWhatsAppSend(lead, e)}
                        className={`p-1.5 rounded-xl border transition-colors shadow-2xs ${
                          lead.whatsAppStatus === 'sent' 
                            ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-emerald-400' 
                            : roiRec.verdict === 'WHATSAPP_FIRST'
                            ? 'bg-teal-500 hover:bg-teal-600 text-white border-teal-600 ring-2 ring-teal-400/40'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border-emerald-300'
                        }`}
                        title={roiRec.verdict === 'WHATSAPP_FIRST' ? "Canal Recomendado: Disparar WhatsApp 1-Click" : "Disparar mensagem pronta no WhatsApp"}
                      >
                        <MessageSquare className={`w-4 h-4 ${roiRec.verdict === 'WHATSAPP_FIRST' && lead.whatsAppStatus !== 'sent' ? 'text-white' : 'text-emerald-700'}`} />
                      </button>

                      {/* 🧭 Cockpit SDR 1-a-1 */}
                      {onOpenCockpit && (
                        <button
                          onClick={() => onOpenCockpit(lead)}
                          className="px-2 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-black border border-amber-300 shadow-2xs flex items-center gap-1 transition-all"
                          title="Abrir Cockpit do SDR em Modo Foco"
                        >
                          <Compass className="w-3.5 h-3.5 text-amber-800" />
                          <span>Cockpit</span>
                        </button>
                      )}

                      {/* 💎 Dossiê High-Ticket (€599 - €997) */}
                      <button
                        onClick={() => onOpenCriahubDrawer && onOpenCriahubDrawer(lead)}
                        className="px-2 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-xl border border-indigo-200 transition-colors shadow-2xs font-bold text-xs flex items-center gap-1"
                        title="Abrir Dossiê High-Ticket, Proposta Comercial €599 e €997, Calculadora ROI e Scripts ProspecPT"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden xl:inline">Dossiê €599-€997</span>
                      </button>

                      {/* ✉️ E-mail Outbound */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'email')}
                        className={`p-1.5 rounded-xl border transition-colors shadow-2xs ${
                          roiRec.verdict === 'EMAIL_ONLY'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-400/40'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-950 border-blue-200'
                        }`}
                        title={roiRec.verdict === 'EMAIL_ONLY' ? "Canal Recomendado: Cold E-mail AIDA" : "Ver / Copiar E-mail Outbound (AIDA/PAS)"}
                      >
                        <Mail className={`w-4 h-4 ${roiRec.verdict === 'EMAIL_ONLY' ? 'text-white' : 'text-blue-700'}`} />
                      </button>

                      {/* 📝 Anotações */}
                      <button
                        type="button"
                        onClick={() => onOpenNotes && onOpenNotes(lead)}
                        className={`p-1.5 rounded-xl border transition-colors ${
                          lead.notes 
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title={lead.notes ? `Nota SDR: "${lead.notes}"` : "Adicionar Nota SDR"}
                      >
                        <FileText className="w-4 h-4 text-amber-700" />
                      </button>

                      {/* 🔽 Botão Inline Expandir / Recolher */}
                      <button
                        type="button"
                        onClick={(e) => toggleExpandLead(lead.id, e)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-0.5 ${
                          expandedLeadId === lead.id 
                            ? 'bg-amber-100 text-amber-950 border-amber-300' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title="Ver Guia de Abordagem e Objeções inline"
                      >
                        <span>{expandedLeadId === lead.id ? 'Fechar' : 'Guia'}</span>
                        {expandedLeadId === lead.id ? (
                          <ChevronUp className="w-3.5 h-3.5 text-amber-900" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                    </div>
                  </td>
                </tr>

                {/* 🎯 COMPRESSÃO DE DADOS NA LISTAGEM: CARD EXPANSÍVEL INLINE */}
                {expandedLeadId === lead.id && (
                  <tr key={`expanded-row-${lead.id}`} className="bg-amber-50/20 border-b-2 border-amber-200">
                    <td colSpan={10} className="p-3 sm:p-5">
                      <div className="bg-white rounded-2xl border border-amber-200/80 shadow-sm p-4 sm:p-5 space-y-4">
                        
                        {/* Header do Card Expandido */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 text-base">
                                {lead.name}
                              </span>
                              <span className="text-xs text-slate-500 font-medium">
                                ({lead.city || 'Sem cidade'} • {lead.category || 'Geral'})
                              </span>
                              {lead.seniorIcpQualification && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                  lead.seniorIcpQualification.commercialDecision === 'LIGAR AGORA'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                                }`}>
                                  {lead.seniorIcpQualification.commercialDecision} ({lead.seniorIcpQualification.finalScore}/100)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-600 mt-0.5">
                              Decisor: <strong className="text-slate-900">{lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Responsável Comercial'}</strong> ({lead.bantPlus?.authority?.role || lead.decisionMaker?.role || 'Diretoria'})
                            </div>
                          </div>

                          {/* Ações Rápidas no Card Expandido */}
                          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            <button
                              onClick={() => onOpenFocusDialer ? onOpenFocusDialer(lead) : onOpenHunterCall ? onOpenHunterCall(lead) : onOpenOmnichannel(lead, 'call')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition-all"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              <span>Ligar no Modo Foco Total</span>
                            </button>

                            <button
                              onClick={(e) => handleQuickWhatsAppSend(lead, e)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-1.5 shadow-2xs transition-all"
                            >
                              <Send className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Enviar WhatsApp (1-Click)</span>
                            </button>

                            {onOpenCockpit && (
                              <button
                                onClick={() => onOpenCockpit(lead)}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-950 rounded-xl text-xs font-bold border border-amber-200 flex items-center gap-1"
                              >
                                <Compass className="w-3.5 h-3.5 text-amber-700" />
                                <span>Cockpit</span>
                              </button>
                            )}

                            <button
                              onClick={() => onOpenCriahubDrawer && onOpenCriahubDrawer(lead)}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-950 rounded-xl text-xs font-bold border border-indigo-200 flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-700" />
                              <span>Dossiê 360°</span>
                            </button>
                          </div>
                        </div>

                        {/* 🔍 ANÁLISE DE VIABILIDADE: VALE A PENA TENTAR CONTATO? */}
                        {roiRec.worthContacting && (
                          <div className={`p-4 rounded-2xl border space-y-3 ${
                            roiRec.worthContacting.badgeTone === 'emerald' ? 'bg-emerald-50/70 border-emerald-300' :
                            roiRec.worthContacting.badgeTone === 'teal' ? 'bg-teal-50/70 border-teal-300' :
                            roiRec.worthContacting.badgeTone === 'amber' ? 'bg-amber-50/70 border-amber-300' :
                            'bg-rose-50/70 border-rose-300'
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                                  roiRec.worthContacting.badgeTone === 'emerald' ? 'bg-emerald-600 text-white border-emerald-700' :
                                  roiRec.worthContacting.badgeTone === 'teal' ? 'bg-teal-600 text-white border-teal-700' :
                                  roiRec.worthContacting.badgeTone === 'amber' ? 'bg-amber-500 text-slate-950 border-amber-600' :
                                  'bg-rose-600 text-white border-rose-700'
                                }`}>
                                  {roiRec.worthContacting.verdictLabel}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  Viabilidade Comercial: <strong className="font-black">{roiRec.worthContacting.score}/100</strong>
                                </span>
                                {roiRec.worthContacting.dailyQuotaCandidate && (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                                    <span>🎯</span> Meta Diária (5+ Leads para Ligar)
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Baseado em dados reais (Google Maps, Search, Apollo/LinkedIn) • Sem alucinações
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h5 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <span>💡</span>
                                <span>{roiRec.worthContacting.headline}</span>
                              </h5>
                              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                                {roiRec.worthContacting.detailedReasoning}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                              <div className="bg-white/90 border border-emerald-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
                                <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Sinais Verificados:
                                </span>
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {roiRec.worthContacting.positiveSignals.map((sig, sIdx) => (
                                    <li key={sIdx} className="flex items-start gap-1 leading-snug">
                                      <span className="text-emerald-600 font-bold mt-0.5">•</span>
                                      <span>{sig}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-white/90 border border-amber-200 rounded-xl p-3 space-y-1.5 shadow-2xs">
                                <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  Pontos de Atenção & Cuidado Anti-Spam:
                                </span>
                                <ul className="space-y-1 text-xs text-slate-700">
                                  {roiRec.worthContacting.riskFactors.map((rf, rIdx) => (
                                    <li key={rIdx} className="flex items-start gap-1 leading-snug">
                                      <span className="text-amber-600 font-bold mt-0.5">•</span>
                                      <span>{rf}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* O que podemos melhorar nela todo mês para vender mensalidades */}
                            <div className="pt-2 border-t border-slate-200/60 space-y-2">
                              <div className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                <span>O que podemos melhorar todo mês para vender nossas mensalidades:</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {roiRec.worthContacting.whatWeCanImprove.map((item, mIdx) => (
                                  <div key={mIdx} className="bg-white/95 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 space-y-1 shadow-2xs">
                                    <div className="flex items-center justify-between gap-1">
                                      <strong className="text-slate-900 font-black text-[11px] truncate">{item.flawTitle}</strong>
                                      <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                        {item.monthlyServiceName}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600">
                                      <span className="font-bold text-emerald-800">Melhoria Contínua:</span> {item.monthlyImprovement}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 💼 Sinergia com a Empresa Ofertante (Desenvolvimento & Consultoria) */}
                        {roiRec.offeringSynergy && (
                          <div className="bg-slate-900 text-white p-3.5 sm:p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-amber-400" />
                                  Diagnóstico Digital & Serviços Ofertáveis para esta Empresa
                                </span>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  Poder: {(roiRec.offeringSynergy.leadPurchasePower || 'MEDIO').replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm font-black text-emerald-400">
                                Ticket Estimado: {roiRec.offeringSynergy.targetDealSize || 'A Definir'}
                              </div>
                            </div>

                            {/* 🚨 TODAS AS FALHAS DIGITAIS DETECTADAS E SERVIÇOS OFERTÁVEIS */}
                            {(roiRec.offeringSynergy.detectedDigitalFlaws?.length || 0) > 0 && (
                              <div className="space-y-2.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                  Falhas no Meio Digital Identificadas & Nossos Serviços de Solução:
                                </span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                  {roiRec.offeringSynergy.detectedDigitalFlaws?.map((flaw, fIdx) => (
                                    <div key={fIdx} className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 space-y-1.5">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase border ${
                                          flaw.flawSeverity === 'CRITICA'
                                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                                            : flaw.flawSeverity === 'ALTA'
                                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                                            : 'bg-blue-950 text-blue-300 border-blue-700'
                                        }`}>
                                          {flaw.flawSeverity === 'CRITICA' ? '🚨 Falha Crítica' : flaw.flawSeverity === 'ALTA' ? '⚠️ Falha Alta' : 'ℹ️ Falha Média'}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">{flaw.categoryLabel}</span>
                                      </div>

                                      <div className="font-extrabold text-xs text-white">
                                        {flaw.flawTitle}
                                      </div>
                                      <div className="text-[11px] text-slate-300 font-medium">
                                        <strong className="text-slate-400">Evidência:</strong> {flaw.flawEvidence}
                                      </div>

                                      <div className="pt-1.5 border-t border-slate-700/60 flex flex-col gap-1">
                                        <div className="text-xs font-bold text-amber-300 flex items-center gap-1">
                                          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                          <span>Serviço Ofertado: {flaw.offeredService}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-300">
                                          <strong className="text-emerald-400">Impacto p/ o Lead:</strong> {flaw.serviceImpact}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 🌡️ AVALIAÇÃO DO MELHOR FORMATO DE CONTATO (QUENTE / MÉDIO / FRIO) */}
                            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                                    Avaliação Estratégica do Formato de Contato:
                                  </span>
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                                    roiRec.verdict === 'CALL_MEETING'
                                      ? 'bg-emerald-900/80 text-emerald-200 border-emerald-500'
                                      : roiRec.verdict === 'WHATSAPP_FIRST'
                                      ? 'bg-teal-900/80 text-teal-200 border-teal-500'
                                      : roiRec.verdict === 'EMAIL_ONLY'
                                      ? 'bg-amber-900/80 text-amber-200 border-amber-500'
                                      : 'bg-slate-700 text-slate-300 border-slate-600'
                                  }`}>
                                    {roiRec.verdict === 'CALL_MEETING' ? '🔥 QUENTE (Ligar com SDR)' : roiRec.verdict === 'WHATSAPP_FIRST' ? '💬 MÉDIO (WhatsApp com Cuidado Anti-Spam)' : roiRec.verdict === 'EMAIL_ONLY' ? '📩 FRIO (E-mail Seguro contra Banimento)' : '⛔ Inviável'}
                                  </span>
                                </div>
                              </div>

                              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                                {roiRec.offeringSynergy.contactFormatEvaluation?.channelJustification || roiRec.primaryReason}
                              </p>

                              {/* Alerta Anti-Spam Específico do WhatsApp para Não-Clientes */}
                              {roiRec.offeringSynergy.contactFormatEvaluation?.antiSpamWarning && (
                                <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-600/80 text-xs text-rose-200 space-y-1">
                                  <div className="font-black text-rose-300 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                                    <span>Aviso de Proteção Comercial (Anti-Spam WhatsApp):</span>
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-rose-100">
                                    {roiRec.offeringSynergy.contactFormatEvaluation.antiSpamWarning}
                                  </p>
                                </div>
                              )}

                              {/* Justificativa de Custo do SDR */}
                              <div className={`p-2.5 rounded-lg border text-xs font-medium ${
                                roiRec.offeringSynergy.sdrCostJustified
                                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                  : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
                              }`}>
                                <strong className="font-black block mb-0.5">
                                  {roiRec.offeringSynergy.sdrCostJustified
                                    ? '🔥 Viabilidade do SDR: Custo 100% justificado pelo valor das falhas'
                                    : '💡 Canal Otimizado: Preservar orçamento do SDR e focar em abordagem digital'}
                                </strong>
                                {roiRec.offeringSynergy.whySdrJustifiedOrNot}
                              </div>
                            </div>

                            {/* 🔄 PROPOSTA ESTRUTURADA DE VENDA DE MENSALIDADE RECORRENTE (MRR) */}
                            {roiRec.offeringSynergy.recurringRetainerOffer && (
                              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-4 rounded-2xl border-2 border-indigo-500/50 space-y-3 shadow-md">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-800/80 pb-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 text-indigo-400" />
                                      Proposta de Mensalidade de Serviços (MRR):
                                    </span>
                                    <span className="text-xs font-black bg-indigo-500/30 text-indigo-200 border border-indigo-400/50 px-2.5 py-0.5 rounded-full">
                                      {roiRec.offeringSynergy.recurringRetainerOffer.monthlyFee}
                                    </span>
                                  </div>
                                  <span className="text-xs font-bold text-indigo-300/90">
                                    Contrato Anual: <strong className="text-emerald-400">{roiRec.offeringSynergy.recurringRetainerOffer.annualValue}</strong>
                                  </span>
                                </div>

                                <div>
                                  <h5 className="text-sm font-black text-white flex items-center gap-1.5">
                                    <span>💼</span>
                                    <span>{roiRec.offeringSynergy.recurringRetainerOffer.planName}</span>
                                  </h5>
                                </div>

                                {/* O que podemos melhorar para ela todo mês */}
                                <div className="space-y-1.5">
                                  <span className="text-[11px] font-black uppercase text-indigo-300 tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                    O que podemos melhorar para ela continuamente (Entregáveis Inclusos):
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {roiRec.offeringSynergy.recurringRetainerOffer.includedDeliverables.map((item, idx) => (
                                      <div key={idx} className="bg-indigo-900/40 border border-indigo-800/60 rounded-xl p-2.5 text-xs text-indigo-100 flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <span className="font-medium">{item}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Pitch de Fechamento de Recorrência */}
                                <div className="bg-slate-900/90 border border-indigo-700/60 rounded-xl p-3 text-xs text-indigo-100 space-y-1">
                                  <strong className="text-amber-400 font-bold flex items-center gap-1">
                                    <span>🎯</span>
                                    <span>Argumento Comercial para Fechar Mensalidade (Sem Inventar Nada):</span>
                                  </strong>
                                  <p className="italic leading-relaxed text-slate-200">
                                    &ldquo;{roiRec.offeringSynergy.recurringRetainerOffer.closingPitchForRetainer}&rdquo;
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Gancho Principal de Abertura */}
                        {(() => {
                          const hook = lead.seniorIcpQualification?.sdrTrainingGuide?.openingHook 
                            || lead.outreach?.callScript?.opener 
                            || `Vi que a ${lead.name} tem grande volume em ${lead.city || 'sua região'}, mas identifiquei pontos no fluxo digital.`;

                          return (
                            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                                  Gancho Principal (Abertura da Ligação)
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyText(hook, `hook-${lead.id}`, e)}
                                  className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 px-2 py-0.5 rounded hover:bg-amber-100"
                                >
                                  {copiedTextKey === `hook-${lead.id}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedTextKey === `hook-${lead.id}` ? 'Copiado!' : 'Copiar Gancho'}</span>
                                </button>
                              </div>
                              <p className="text-xs sm:text-sm font-bold text-slate-900 italic leading-relaxed">
                                "{hook}"
                              </p>
                            </div>
                          );
                        })()}

                        {/* 3 Tópicos Principais do Pitch */}
                        {(() => {
                          const topics = lead.seniorIcpQualification?.sdrTrainingGuide?.pitchTopics || [
                            `Dor Central: ${lead.identifiedPain || 'Falta de agendamento automático e retenção digital'}`,
                            `Impacto Comprovado: Recuperação de até 30% dos contatos perdidos`,
                            `Fechamento: Diagnóstico rápido de 5 minutos sem custo`
                          ];

                          return (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
                                🎙️ 3 Tópicos Principais do Pitch:
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {topics.map((t, idx) => (
                                  <div key={idx} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-800 font-medium">
                                    <span className="font-bold text-amber-700 mr-1">#{idx + 1}</span>
                                    {t}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Matriz Rápida de Objeções (Treinamento SDR) */}
                        {(() => {
                          const objs = lead.seniorIcpQualification?.sdrTrainingGuide?.objections || [
                            {
                              objection: "Já temos agendamento via recepção / atendimento manual",
                              howToOvercome: "Perfeito, a maioria dos nossos clientes também tinha! O problema é que a recepção perde até 30% do tempo confirmando dados via WhatsApp. Nós automatizamos essa confirmação."
                            },
                            {
                              objection: "Não temos orçamento ou tempo agora",
                              howToOvercome: "Entendo perfeitamente. Por isso mesmo nosso diagnóstico de 5 minutos mostra como recuperar até 5 oportunidades perdidas por semana sem custo inicial."
                            }
                          ];

                          return (
                            <div className="space-y-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                Matriz Rápida de Objeções (Se o cliente hesitar):
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                {objs.map((o, idx) => (
                                  <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                                    <div className="text-xs font-bold text-rose-700 flex items-center justify-between gap-2">
                                      <span>Objeção {idx + 1}: "{o.objection}"</span>
                                      <button
                                        type="button"
                                        onClick={(e) => handleCopyText(o.howToOvercome, `obj-${lead.id}-${idx}`, e)}
                                        className="text-[10px] text-slate-500 hover:text-slate-800 p-0.5 rounded hover:bg-slate-200"
                                        title="Copiar resposta"
                                      >
                                        {copiedTextKey === `obj-${lead.id}-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                      </button>
                                    </div>
                                    <div className="text-xs text-emerald-950 bg-emerald-50/70 border border-emerald-200/70 p-2 rounded-lg italic">
                                      <span className="text-[10px] font-black text-emerald-800 not-italic block uppercase">✓ Como Contornar:</span>
                                      "{o.howToOvercome}"
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </td>
                  </tr>
                )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PipelineTable;
