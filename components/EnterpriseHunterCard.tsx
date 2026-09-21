import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  Phone, PhoneCall, MessageSquare, Mail, ExternalLink, Flame, 
  MapPin, Clock, TrendingDown, ShieldCheck, CheckCircle2, 
  Sparkles, Layers, DollarSign, Calendar, Copy, Check
} from 'lucide-react';

export interface EnterpriseLeadProps {
  lead: Lead;
  onStartCall?: (lead: Lead) => void;
  onSendWhatsAppBot?: (lead: Lead) => void;
  onSendEmail?: (lead: Lead) => void;
  onOpenCriahubDrawer?: (lead: Lead) => void;
  onOpenNotes?: (lead: Lead) => void;
}

export const EnterpriseHunterCard: React.FC<EnterpriseLeadProps> = ({
  lead,
  onStartCall,
  onSendWhatsAppBot,
  onSendEmail,
  onOpenCriahubDrawer,
  onOpenNotes
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = lead.phone || lead.decisionMaker?.directPhone || '';
    if (phone) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const decisionMakerName = lead.decisionMaker?.name || 'Proprietário Particular (FSBO)';
  const directPhone = lead.phone || lead.decisionMaker?.directPhone;
  const isHighPriority = lead.intentPriority === 'HIGH';

  return (
    <div className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800/90 hover:border-indigo-500/40 rounded-2xl p-5 shadow-xl transition-all duration-200">
      
      {/* Top Badges Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Transaction & FSBO Verification Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            100% VENDA FSBO
          </span>

          {/* High Priority Dispatch */}
          {isHighPriority && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-black tracking-wide animate-pulse">
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              DISPARO IMEDIATO 1H
            </span>
          )}

          {/* Price Drop Alert */}
          {lead.priceDropValue && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-black">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              BAIXOU O VALOR: {lead.priceDropValue}
            </span>
          )}
        </div>

        {/* Days on Market & Intent Score */}
        <div className="flex items-center gap-2 text-xs">
          {lead.daysOnMarket !== undefined && (
            <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <Calendar className="w-3 h-3 text-slate-400" />
              {lead.daysOnMarket} dias no mercado
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800/50 font-bold">
            Score: {lead.intentScore || 95}%
          </span>
        </div>
      </div>

      {/* Main Info */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug group-hover:text-indigo-300 transition-colors">
              {lead.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                {lead.city} {lead.district ? `(${lead.district})` : ''} - {lead.country || 'Portugal'}
              </span>
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Valor: <strong className="text-emerald-400 font-bold">{lead.estimatedRevenue || 'Consulte'}</strong>
              </span>
            </div>
          </div>

          {lead.website && (
            <a
              href={lead.website}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-800/90 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-300 border border-slate-700/80 rounded-xl transition-all shrink-0"
              title="Abrir Anúncio Original"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Identified Pain / Rationale */}
        {lead.identifiedPain && (
          <p className="mt-2.5 text-xs text-slate-300 bg-slate-800/50 p-2.5 rounded-xl border border-slate-800 line-clamp-2">
            <strong className="text-indigo-400">Ângulo SDR:</strong> {lead.identifiedPain}
          </p>
        )}
      </div>

      {/* Contact & Decision Maker Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-800/80 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-300 font-bold">
            {decisionMakerName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-slate-200">{decisionMakerName}</p>
            <p className="text-[11px] text-slate-400">{lead.decisionMaker?.role || 'Anunciante Verificado'}</p>
          </div>
        </div>

        {directPhone && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-lg">
              {directPhone}
            </span>
            <button
              onClick={handleCopyPhone}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              title="Copiar Telefone"
            >
              {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {onStartCall && (
          <button
            onClick={() => onStartCall(lead)}
            className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/40 active:scale-95 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-white" />
            <span>LIGAR AGORA (TELEPROMPTER)</span>
          </button>
        )}

        {onSendWhatsAppBot && (
          <button
            onClick={() => onSendWhatsAppBot(lead)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-emerald-950/60 text-emerald-400 border border-slate-700/80 hover:border-emerald-700/60 rounded-xl text-xs font-bold transition-all"
            title="Disparo WhatsApp Bot Anti-Ban"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        )}

        {onSendEmail && (
          <button
            onClick={() => onSendEmail(lead)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-blue-950/60 text-blue-400 border border-slate-700/80 hover:border-blue-700/60 rounded-xl text-xs font-bold transition-all"
            title="Envio de E-mail AIDA / PAS"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">E-mail</span>
          </button>
        )}

        {onOpenCriahubDrawer && (
          <button
            onClick={() => onOpenCriahubDrawer(lead)}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-indigo-950/60 text-indigo-400 border border-slate-700/80 hover:border-indigo-700/60 rounded-xl text-xs font-bold transition-all"
            title="Dossiê 360° Completo"
          >
            <Sparkles className="w-4 h-4" />
            <span>Dossiê</span>
          </button>
        )}
      </div>
    </div>
  );
};
