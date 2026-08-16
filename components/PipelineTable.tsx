import React from 'react';
import { Lead, IcpTier } from '../types';
import { 
  Flame, Zap, AlertTriangle, ExternalLink, Globe, Phone, Mail, 
  MessageSquare, PhoneCall, Send, CheckCircle, User, Sparkles,
  Layers, Clock, DollarSign, ShieldAlert, Cpu, Crosshair, Calendar
} from 'lucide-react';

interface PipelineTableProps {
  leads: Lead[];
  selectedLeadIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenOmnichannel: (lead: Lead, tab?: 'pitro_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech') => void;
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onDelete: (id: string) => void;
  onOpenLiveCopilot?: (lead: Lead) => void;
}

const PipelineTable: React.FC<PipelineTableProps> = ({
  leads,
  selectedLeadIds,
  onToggleSelect,
  onToggleSelectAll,
  onOpenOmnichannel,
  onUpdateStatus,
  onDelete,
  onOpenLiveCopilot
}) => {
  const getIntentBadge = (priority?: 'HIGH' | 'MEDIUM' | 'DISQUALIFIED', score?: number) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
            <Flame className="w-3 h-3 mr-1 fill-rose-500 text-rose-600 animate-pulse" />
            DISPARO 1H ({score ?? 85}%)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 mr-1 text-amber-600" />
            FILA PADRÃO ({score ?? 65}%)
          </span>
        );
      case 'DISQUALIFIED':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-300">
            <AlertTriangle className="w-3 h-3 mr-1 text-gray-400" />
            DESQUALIFICADO ({score ?? 40}%)
          </span>
        );
    }
  };

  const getTierBadge = (tier: IcpTier) => {
    switch (tier) {
      case 'SCORE_A':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            SCORE A (Hot)
          </span>
        );
      case 'SCORE_B':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
            SCORE B (Warm)
          </span>
        );
      case 'SCORE_C':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-300">
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <th className="py-3.5 px-4 w-10">
                <input 
                  type="checkbox" 
                  checked={leads.length > 0 && selectedLeadIds.size === leads.length}
                  onChange={onToggleSelectAll}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4">Empresa & Tech Stack</th>
              <th className="py-3.5 px-4">Decisor (Authority)</th>
              <th className="py-3.5 px-4 text-center">Intent Score</th>
              <th className="py-3.5 px-4">Prioridade Disparo</th>
              <th className="py-3.5 px-4">BANT+ Diagnóstico</th>
              <th className="py-3.5 px-4 min-w-[200px]">3 Falhas / Gap Real</th>
              <th className="py-3.5 px-4 min-w-[180px]">Próxima Ação</th>
              <th className="py-3.5 px-4 text-right">Abordagem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700 font-normal">
            {leads.map((lead) => {
              const isSelected = selectedLeadIds.has(lead.id);
              const cleanPhone = lead.decisionMaker?.directPhone?.replace(/\D/g, '') || lead.phone?.replace(/\D/g, '');
              const waUrl = cleanPhone 
                ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lead.outreach?.whatsapp?.option1Curiosity || '')}` 
                : null;

              const detectedTools = lead.techStack?.detectedTools || [];
              const flaws = lead.keyFlaws || lead.bantPlus?.need?.operationalFlaws || [];

              return (
                <tr 
                  key={lead.id}
                  id={`row-lead-${lead.id}`}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isSelected ? 'bg-indigo-50/30' : ''
                  } ${lead.status === 'contacted' ? 'opacity-80 bg-slate-50/40' : ''} ${
                    lead.intentPriority === 'HIGH' ? 'border-l-4 border-l-rose-500' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3.5 px-4">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => onToggleSelect(lead.id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>

                  {/* Empresa & Tech Stack */}
                  <td className="py-3.5 px-4">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="font-bold text-gray-900 text-sm hover:text-indigo-600 cursor-pointer" 
                          onClick={() => onOpenOmnichannel(lead, 'bant')}
                        >
                          {lead.name}
                        </span>
                        {lead.status === 'contacted' && (
                          <span className="inline-flex items-center text-[9px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-semibold border border-blue-200">
                            <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                            Contactado
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span>{lead.category}</span>
                        <span>•</span>
                        <span>{lead.city}</span>
                        {lead.website ? (
                          <>
                            <span>•</span>
                            <a 
                              href={lead.website} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-indigo-600 hover:underline flex items-center gap-0.5"
                            >
                              <Globe className="w-2.5 h-2.5 text-gray-400" />
                              <span className="truncate max-w-[100px]">{new URL(lead.website).hostname.replace('www.', '')}</span>
                            </a>
                          </>
                        ) : (
                          <span className="text-amber-600 italic text-[10px]">Sem site</span>
                        )}
                      </div>

                      {/* Tech Stack Chips */}
                      {detectedTools.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          <Cpu className="w-3 h-3 text-slate-400 shrink-0" />
                          {detectedTools.slice(0, 3).map((tool, idx) => (
                            <span 
                              key={idx}
                              className="text-[9px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                            >
                              {tool}
                            </span>
                          ))}
                          {detectedTools.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-mono">+{detectedTools.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Decisor (Authority) */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-gray-800 flex items-center gap-1">
                        <User className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span className="truncate max-w-[140px]">{lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Decisor'}</span>
                      </div>
                      <div className="text-[11px] text-gray-500 truncate max-w-[140px]">
                        {lead.bantPlus?.authority?.role || lead.decisionMaker?.role || 'Diretoria'}
                      </div>
                      {(lead.decisionMaker?.directPhone || lead.phone) && (
                        <div className="text-[10px] text-gray-400 font-mono flex items-center">
                          <Phone className="w-2.5 h-2.5 mr-1" />
                          <span>{lead.decisionMaker?.directPhone || lead.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Intent Score */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="text-base font-extrabold text-gray-900">{lead.intentScore ?? lead.icpScore}%</span>
                      <div className="w-14 bg-gray-200 rounded-full h-1.5 mt-1 overflow-hidden">
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
                      {getIntentBadge(lead.intentPriority, lead.intentScore)}
                      <div className="mt-0.5">{getTierBadge(lead.icpTier)}</div>
                    </div>
                  </td>

                  {/* BANT+ Diagnóstico */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-700 font-medium">
                        <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[150px]">{lead.bantPlus?.budget?.estimatedBudget || 'Orçamento Médio'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                        <Clock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        <span className="truncate max-w-[150px]">{lead.bantPlus?.timeline?.urgencyLevel || lead.urgencyFactor || 'Urgência Média'}</span>
                      </div>
                    </div>
                  </td>

                  {/* 3 Falhas / Gap Real */}
                  <td className="py-3.5 px-4">
                    <div className="bg-red-50/70 p-2 rounded border border-red-100 text-xs font-medium text-gray-800 space-y-1">
                      {flaws.length > 0 ? (
                        flaws.slice(0, 2).map((flaw, fIdx) => (
                          <div key={fIdx} className="text-[11px] text-red-950 flex items-start gap-1">
                            <span className="text-red-500 font-bold">•</span>
                            <span className="line-clamp-1">{flaw}</span>
                          </div>
                        ))
                      ) : (
                        <span className="line-clamp-2 text-[11px]">"{lead.identifiedPain}"</span>
                      )}
                    </div>
                  </td>

                  {/* Próxima Ação */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 bg-indigo-50/80 p-1.5 rounded border border-indigo-100 text-[11px] font-medium text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="line-clamp-2">{lead.suggestedAction}</span>
                    </div>
                  </td>

                  {/* Omnichannel Triggers */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      {/* Pitro CRM & Evolution API Hub */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'pitro_crm')}
                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-300 transition-colors"
                        title="Disparar para Pitro CRM & Evolution API"
                      >
                        <Zap className="w-3.5 h-3.5 text-purple-600" />
                      </button>

                      {/* AI Live Copilot (Realtime Audio/Call Analyzer) */}
                      {onOpenLiveCopilot && (
                        <button
                          onClick={() => onOpenLiveCopilot(lead)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-300 transition-colors"
                          title="Copiloto IA ao Vivo (Escutar Ligação / Áudio WhatsApp)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        </button>
                      )}

                      {/* Cadence Master 21d */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'cadence')}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 transition-colors"
                        title="Omnichannel Cadence Master (Régua de 21 Dias)"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      </button>

                      {/* Objection Crusher (Cold Call Copilot) */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'objection_crusher')}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 transition-colors"
                        title="Elite Objection Crusher (Copiloto de Ligação)"
                      >
                        <Crosshair className="w-3.5 h-3.5 text-rose-600" />
                      </button>

                      {/* BANT & Tech Modal */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'bant')}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-colors"
                        title="Ver Diagnóstico BANT+ & Tech Stack"
                      >
                        <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      </button>

                      {/* WhatsApp Button */}
                      <button
                        onClick={() => {
                          if (waUrl) window.open(waUrl, '_blank');
                          else onOpenOmnichannel(lead, 'whatsapp');
                        }}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded border border-emerald-200 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Email Button */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'email')}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200 transition-colors"
                        title="Ver Email Outbound"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>

                      {/* Cold Call Script */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'call')}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded border border-amber-200 transition-colors"
                        title="Ver Roteiro de Ligação"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </button>

                      {/* Webhook Payload */}
                      <button
                        onClick={() => onOpenOmnichannel(lead, 'webhook')}
                        className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded border border-purple-200 transition-colors"
                        title="Payloads n8n / Webhook"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PipelineTable;
