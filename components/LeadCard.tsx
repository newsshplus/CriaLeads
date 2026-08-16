import React from 'react';
import { Lead, IcpTier } from '../types';
import { 
  Globe, Phone, MapPin, Star, ExternalLink, Trash2, Mail, 
  AlertTriangle, CheckCircle, MessageSquare, PhoneCall, Zap, 
  Send, Sparkles, User, ShieldCheck, Flame, Cpu, Clock, DollarSign, Layers, Crosshair, Calendar
} from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onDelete: (id: string) => void;
  onOpenOmnichannel: (lead: Lead, tab?: 'criahub_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech') => void;
  onOpenLiveCopilot?: (lead: Lead) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  isSelected, 
  onSelect, 
  onUpdateStatus, 
  onDelete,
  onOpenOmnichannel,
  onOpenLiveCopilot
}) => {
  const getIntentBadge = (priority?: 'HIGH' | 'MEDIUM' | 'DISQUALIFIED') => {
    switch (priority) {
      case 'HIGH':
        return {
          label: 'DISPARO 1H (URGENTE)',
          badgeStyle: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-300',
          icon: <Flame className="w-3.5 h-3.5 mr-1 text-rose-600 fill-rose-500 animate-pulse" />
        };
      case 'MEDIUM':
        return {
          label: 'FILA PADRÃO',
          badgeStyle: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
        };
      case 'DISQUALIFIED':
      default:
        return {
          label: 'DESQUALIFICADO',
          badgeStyle: 'bg-gray-50 text-gray-600 border-gray-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 text-gray-400" />
        };
    }
  };

  const getIcpBadge = (tier: IcpTier) => {
    switch (tier) {
      case 'SCORE_A':
        return {
          label: 'SCORE A (HOT)',
          badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: <Flame className="w-3 h-3 mr-0.5 text-emerald-600 fill-emerald-500" />
        };
      case 'SCORE_B':
        return {
          label: 'SCORE B (WARM)',
          badgeStyle: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: <Zap className="w-3 h-3 mr-0.5 text-blue-600 fill-blue-400" />
        };
      case 'SCORE_C':
      default:
        return {
          label: 'SCORE C (COLD)',
          badgeStyle: 'bg-gray-50 text-gray-700 border-gray-300',
          icon: <AlertTriangle className="w-3 h-3 mr-0.5 text-gray-500" />
        };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-emerald-100 text-emerald-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  const intentBadge = getIntentBadge(lead.intentPriority);
  const icpBadge = getIcpBadge(lead.icpTier);
  const isContacted = lead.status === 'contacted';
  const cleanPhone = lead.decisionMaker?.directPhone?.replace(/\D/g, '') || lead.phone?.replace(/\D/g, '') || '';
  const waMessage = encodeURIComponent(lead.outreach?.whatsapp?.option1Curiosity || '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waMessage}` : null;
  const detectedTools = lead.techStack?.detectedTools || [];
  const flaws = lead.keyFlaws || lead.bantPlus?.need?.operationalFlaws || [];

  return (
    <div 
      id={`lead-card-${lead.id}`}
      className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between h-full relative group ${
        isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' : 'border-gray-200'
      } ${isContacted ? 'bg-slate-50/80' : ''} ${lead.intentPriority === 'HIGH' ? 'border-t-4 border-t-rose-500' : ''}`}
    >
      {/* Header with Selection, Intent Priority and Score */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {onSelect ? (
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={() => onSelect(lead.id)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
          ) : isContacted ? (
            <div className="bg-blue-100 text-blue-700 p-1 rounded-full" title="Já contactado">
              <CheckCircle className="w-4 h-4" />
            </div>
          ) : null}

          <span className={`inline-flex items-center text-[10px] font-extrabold px-2 py-0.5 rounded border ${intentBadge.badgeStyle}`}>
            {intentBadge.icon}
            {intentBadge.label}
          </span>

          <span className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded border ${icpBadge.badgeStyle}`}>
            {icpBadge.icon}
            {icpBadge.label}
          </span>
        </div>

        {/* Intent Score */}
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-xl font-extrabold text-gray-900">{lead.intentScore ?? lead.icpScore}%</span>
            <span className="text-[9px] uppercase font-semibold text-gray-400">Intent</span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div>
        <div className="pr-1">
          <h3 
            className="font-bold text-gray-900 text-base leading-snug line-clamp-1 hover:text-indigo-600 cursor-pointer" 
            title={lead.name}
            onClick={() => onOpenOmnichannel(lead, 'bant')}
          >
            {lead.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span>{lead.category} • {lead.city}</span>
            {lead.source === 'synthetic' && (
              <span 
                title="Lead gerado pelo motor de fallback (empresa plausível, dados não verificados)"
                className="inline-flex items-center text-[9px] text-slate-600 bg-slate-100 px-1 py-0.2 rounded font-semibold border border-slate-300"
              >
                Simulado
              </span>
            )}
          </p>
        </div>

        {/* Tech Stack Chips */}
        {detectedTools.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-2">
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

        {/* Decision Maker (Authority) */}
        <div className="mt-2.5 bg-slate-50 rounded-lg p-2.5 border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span className="truncate max-w-[140px]">{lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Decisor Comercial'}</span>
            </div>
            {lead.bantPlus?.budget?.rating && (
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Budget: {lead.bantPlus.budget.rating}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 truncate pl-5">
            {lead.bantPlus?.authority?.role || lead.decisionMaker?.role || 'Diretoria / Gestão'}
          </p>
        </div>

        {/* 3 Falhas Operacionais / Need */}
        <div className="mt-2.5">
          <div className="text-[10px] uppercase tracking-wider font-bold text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Gaps Críticos Identificados
          </div>
          <div className="mt-1 bg-red-50/60 p-2 rounded border border-red-100 space-y-1">
            {flaws.slice(0, 2).map((flaw, fIdx) => (
              <p key={fIdx} className="text-[11px] text-red-950 line-clamp-1 font-medium flex items-start gap-1">
                <span className="text-red-500 font-bold">•</span>
                <span>{flaw}</span>
              </p>
            ))}
          </div>
        </div>

        {/* Suggested Next Action */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-900 bg-indigo-50/80 px-2 py-1 rounded font-medium border border-indigo-100">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          <span className="truncate text-[11px]">{lead.suggestedAction}</span>
        </div>

        {/* Contact details */}
        <div className="mt-2.5 space-y-1.5 text-xs text-gray-600 border-t border-gray-100 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
              <span className="font-bold text-gray-800">{lead.rating}</span>
              <span className="text-gray-400 text-[11px] ml-1">({lead.reviews} revs)</span>
            </div>

            {lead.bantPlus?.timeline?.urgencyLevel && (
              <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {lead.bantPlus.timeline.urgencyLevel}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center truncate max-w-[150px]">
              <Globe className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0" />
              {lead.website ? (
                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                  {new URL(lead.website).hostname.replace('www.', '')}
                </a>
              ) : (
                <span className="text-amber-600 font-medium italic">Sem website</span>
              )}
            </div>

            {lead.phone && (
              <div className="flex items-center text-gray-500 font-mono text-[10px]">
                <Phone className="w-2.5 h-2.5 mr-1 text-gray-400" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Omnichannel Quick Action Triggers */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-col gap-2">
        <div className="grid grid-cols-4 gap-1">
          {/* Criahub CRM Sync */}
          <button 
            id={`btn-criahub-${lead.id}`}
            onClick={() => onOpenOmnichannel(lead, 'criahub_crm')}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded border border-purple-300 transition-colors text-[9px] font-black"
            title="Sincronizar com Criahub CRM & CriahubADS"
          >
            <Zap className="w-3 h-3 text-purple-600 mb-0.5" />
            <span>Criahub CRM</span>
          </button>

          {/* AI Live Copilot */}
          {onOpenLiveCopilot ? (
            <button 
              id={`btn-copilot-${lead.id}`}
              onClick={() => onOpenLiveCopilot(lead)}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded border border-indigo-300 transition-colors text-[9px] font-black"
              title="Copiloto IA ao Vivo (Escutar Chamada / Whats)"
            >
              <Sparkles className="w-3 h-3 text-indigo-600 mb-0.5" />
              <span>Copiloto</span>
            </button>
          ) : (
            <button 
              id={`btn-cadence-${lead.id}`}
              onClick={() => onOpenOmnichannel(lead, 'cadence')}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded border border-amber-300 transition-colors text-[9px] font-black"
              title="Omnichannel Cadence Master (Régua de 21 Dias)"
            >
              <Calendar className="w-3 h-3 text-amber-600 mb-0.5" />
              <span>21 Dias</span>
            </button>
          )}

          {/* Objection Crusher (Cold Call Copilot) */}
          <button 
            id={`btn-crusher-${lead.id}`}
            onClick={() => onOpenOmnichannel(lead, 'objection_crusher')}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded border border-rose-200 transition-colors text-[9px] font-extrabold"
            title="Elite Objection Crusher (Copiloto de Ligação)"
          >
            <Crosshair className="w-3 h-3 text-rose-600 mb-0.5" />
            <span>Crusher</span>
          </button>

          {/* BANT & Tech Stack View */}
          <button 
            onClick={() => onOpenOmnichannel(lead, 'bant')}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 transition-colors text-[9px] font-bold"
            title="Diagnóstico BANT+ e Tech Stack"
          >
            <Layers className="w-3 h-3 text-indigo-600 mb-0.5" />
            <span>BANT+</span>
          </button>

          {/* WhatsApp Action */}
          <button 
            id={`btn-wa-${lead.id}`}
            onClick={() => {
              if (waUrl) {
                window.open(waUrl, '_blank');
              } else {
                onOpenOmnichannel(lead, 'whatsapp');
              }
            }}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded border border-emerald-200 transition-colors text-[9px] font-bold"
            title="Abrir WhatsApp com Copy Hiperpersonalizada"
          >
            <MessageSquare className="w-3 h-3 text-emerald-600 mb-0.5" />
            <span>WhatsApp</span>
          </button>

          {/* Email Action */}
          <button 
            id={`btn-email-${lead.id}`}
            onClick={() => onOpenOmnichannel(lead, 'email')}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded border border-blue-200 transition-colors text-[9px] font-bold"
            title="Ver Email Outbound (AIDA / PAS)"
          >
            <Mail className="w-3 h-3 text-blue-600 mb-0.5" />
            <span>Email</span>
          </button>

          {/* Cold Call Action */}
          <button 
            id={`btn-call-${lead.id}`}
            onClick={() => onOpenOmnichannel(lead, 'call')}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 transition-colors text-[9px] font-bold"
            title="Roteiro de Ligação (5s Quebra de Gelo + Pitch)"
          >
            <PhoneCall className="w-3 h-3 text-amber-600 mb-0.5" />
            <span>Call</span>
          </button>

          {/* Webhook Payload Action */}
          <button 
            id={`btn-webhook-${lead.id}`}
            onClick={() => onOpenOmnichannel(lead, 'webhook')}
            className="flex flex-col items-center justify-center py-1.5 px-0.5 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded border border-purple-200 transition-colors text-[9px] font-bold"
            title="Payloads n8n / Make / Webhooks"
          >
            <Send className="w-3 h-3 text-purple-600 mb-0.5" />
            <span>n8n</span>
          </button>
        </div>

        {/* Bottom Status dropdown and external links */}
        <div className="flex items-center justify-between mt-0.5">
          <select 
            value={lead.status}
            onChange={(e) => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
            className={`text-[9px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded cursor-pointer border-0 ring-1 ring-inset focus:ring-2 outline-none ${getStatusColor(lead.status)}`}
          >
            <option value="new">Novo</option>
            <option value="contacted">Contactado</option>
            <option value="qualified">Qualificado</option>
            <option value="ignored">Ignorado</option>
          </select>

          <div className="flex items-center space-x-1">
            {lead.googleMapsLink && (
              <a href={lead.googleMapsLink} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors" title="Google Maps">
                <MapPin className="w-3 h-3" />
              </a>
            )}
            {lead.website && (
              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors" title="Abrir Site">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button onClick={() => onDelete(lead.id)} className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors" title="Remover">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
