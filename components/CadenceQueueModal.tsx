import React, { useState } from 'react';
import { 
  Lead, 
  BusinessProfile 
} from '../types';
import { 
  X, 
  Sparkles, 
  MessageSquare, 
  Mail, 
  PhoneCall, 
  Send, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  Flame, 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  Zap,
  Sliders,
  Filter
} from 'lucide-react';
import { buildCadenceMaster } from '../services/cadenceService';

interface CadenceQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  businessProfile: BusinessProfile;
  onUpdateStatus: (leadId: string, status: Lead['status']) => void;
  onOpenCriahubDrawer?: (lead: Lead) => void;
}

export const CadenceQueueModal: React.FC<CadenceQueueModalProps> = ({
  isOpen,
  onClose,
  leads,
  businessProfile,
  onUpdateStatus,
  onOpenCriahubDrawer
}) => {
  if (!isOpen) return null;

  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'whatsapp' | 'email' | 'call'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [antiBanDelay, setAntiBanDelay] = useState<number>(45); // seconds
  const [selectedSpintax, setSelectedSpintax] = useState<'A' | 'B' | 'C'>('A');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate Cadence for all leads
  const cadenceItems = leads.map(lead => {
    const cadence = lead.cadence || buildCadenceMaster(lead, businessProfile);
    const phone = lead.decisionMaker?.directPhone || lead.phone;
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor Comercial';

    // WhatsApp Text
    const whatsText = selectedSpintax === 'A' 
      ? cadence.step1Whatsapp.message.text
      : selectedSpintax === 'B' 
        ? lead.guardian?.whatsappShield.spinningVariations.variationB || cadence.step1Whatsapp.message.text
        : lead.guardian?.whatsappShield.spinningVariations.variationC || cadence.step1Whatsapp.message.text;

    return {
      lead,
      cadence,
      phone: cleanPhone,
      decisorName,
      whatsText,
      emailSubject: cadence.step2Email.email.subject,
      emailBody: cadence.step2Email.email.body
    };
  });

  const filteredItems = cadenceItems.filter(item => {
    if (selectedChannel === 'whatsapp') return Boolean(item.phone);
    if (selectedChannel === 'email') return Boolean(item.lead.decisionMaker?.directEmail || item.lead.email);
    if (selectedChannel === 'call') return Boolean(item.phone);
    return true;
  });

  const handleExportWebhookQueue = () => {
    const payload = filteredItems.map(item => ({
      leadId: item.lead.id,
      companyName: item.lead.name,
      phone: item.phone,
      contactName: item.decisorName,
      category: item.lead.category,
      city: item.lead.city,
      whatsappMessage: item.whatsText,
      emailSubject: item.emailSubject,
      emailBody: item.emailBody,
      antiBanDelaySeconds: antiBanDelay,
      scheduledSequence: "21_DAY_MULTI_TOUCH"
    }));

    copyToClipboard(JSON.stringify(payload, null, 2), 'webhook_payload');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 animate-fadeIn">
      <div className="w-full max-w-5xl bg-white h-full max-h-[90vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Fila de Disparos & Cadência Multicanal</h2>
                <span className="text-xs font-black bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-2 py-0.5 rounded-full">
                  {filteredItems.length} Leads na Fila
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 hidden sm:block">
                Sequência estratégica de 21 dias com proteção anti-bloqueio, spintax e automações.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Protection & Anti-Ban Controls Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Anti-Ban Config */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-700">Delay Anti-Ban:</span>
              <select
                value={antiBanDelay}
                onChange={(e) => setAntiBanDelay(Number(e.target.value))}
                className="bg-transparent font-black text-slate-900 outline-none cursor-pointer"
              >
                <option value={30}>30s (Rápido)</option>
                <option value={45}>45s (Recomendado)</option>
                <option value={60}>60s (Seguro)</option>
                <option value={90}>90s (Ultra Seguro)</option>
              </select>
            </div>

            {/* Spintax Variation */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-2xs">
              <span className="font-bold text-slate-700">Spintax WhatsApp:</span>
              {(['A', 'B', 'C'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setSelectedSpintax(v)}
                  className={`px-2 py-0.5 rounded text-xs font-black transition-colors ${
                    selectedSpintax === v 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Var {v}
                </button>
              ))}
            </div>
          </div>

          {/* Export Payload for n8n / Z-API / Evolution */}
          <button
            onClick={handleExportWebhookQueue}
            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 px-3.5 py-1.5 rounded-xl font-bold border border-indigo-200 shadow-2xs transition-colors"
          >
            {copiedKey === 'webhook_payload' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-indigo-600" />}
            <span>{copiedKey === 'webhook_payload' ? 'Fila Copiada para n8n/Make!' : 'Copiar Fila JSON (n8n/Evolution API)'}</span>
          </button>
        </div>

        {/* Channel Filter Selector */}
        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-500">Filtrar Canal:</span>
          <button
            onClick={() => setSelectedChannel('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-colors ${
              selectedChannel === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({cadenceItems.length})
          </button>
          <button
            onClick={() => setSelectedChannel('whatsapp')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-colors ${
              selectedChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            WhatsApp
          </button>
          <button
            onClick={() => setSelectedChannel('email')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-colors ${
              selectedChannel === 'email' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            E-mails
          </button>
          <button
            onClick={() => setSelectedChannel('call')}
            className={`px-3 py-1 rounded-lg text-xs font-black transition-colors ${
              selectedChannel === 'call' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Ligações
          </button>
        </div>

        {/* Queue List Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-slate-50/50">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold">Nenhum lead encontrado para este canal na fila.</p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              return (
                <div
                  key={item.lead.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Lead & Decisor Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                      <h4 className="font-extrabold text-slate-900 text-base leading-tight truncate">
                        {item.lead.name}
                      </h4>
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {item.lead.category}
                      </span>
                      <span className="text-xs text-slate-500">• {item.lead.city}</span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-3 pt-1">
                      <span><strong>Decisor:</strong> {item.decisorName}</span>
                      {item.phone && (
                        <span><strong>Whats:</strong> <span className="font-mono">{item.phone}</span></span>
                      )}
                    </div>

                    {/* Preview Message */}
                    <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-800 line-clamp-2">
                      <strong className="text-emerald-800 mr-1">[Whats Dia 1]:</strong>
                      {item.whatsText}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.phone && (
                      <button
                        onClick={() => {
                          window.open(`https://api.whatsapp.com/send?phone=${item.phone}&text=${encodeURIComponent(item.whatsText)}`, '_blank');
                          onUpdateStatus(item.lead.id, 'contacted');
                        }}
                        className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
                        title="Disparar no WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Disparar WhatsApp</span>
                      </button>
                    )}

                    <button
                      onClick={() => copyToClipboard(item.whatsText, `copy_${item.lead.id}`)}
                      className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      title="Copiar Mensagem"
                    >
                      {copiedKey === `copy_${item.lead.id}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>

                    {onOpenCriahubDrawer && (
                      <button
                        onClick={() => onOpenCriahubDrawer(item.lead)}
                        className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-black transition-colors"
                        title="Ver Análise 360°"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-white p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>Sequência Master: Dia 1 WhatsApp ➔ Dia 3 E-mail AIDA ➔ Dia 6 Ligação ➔ Dia 10 Proposta ➔ Dia 18 Break-up</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default CadenceQueueModal;
