import React, { useState, useEffect } from 'react';
import { 
  X, Save, FileText, User, Phone, Mail, Globe, MapPin, 
  Tag, CheckCircle2, Sparkles, Building, Clock, Calendar, 
  AlertTriangle, MessageSquare, Flame 
} from 'lucide-react';
import { Lead } from '../types';

interface LeadNotesModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveLead: (updatedLead: Lead) => void;
}

const QUICK_TAGS = [
  '🎯 Reunião Agendada',
  '📞 Retornar Ligação',
  '🤝 Proposta em Análise',
  '💬 Em Conversa no WhatsApp',
  '💎 Decisor Validado',
  '💰 Orçamento Confirmado',
  '⚠️ Objeção Mapeada',
  '📋 Follow-up em 24h',
  '🚀 Fechamento Iminente'
];

export const LeadNotesModal: React.FC<LeadNotesModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSaveLead
}) => {
  const [notes, setNotes] = useState<string>('');
  const [decisionMakerName, setDecisionMakerName] = useState<string>('');
  const [decisionMakerRole, setDecisionMakerRole] = useState<string>('');
  const [directPhone, setDirectPhone] = useState<string>('');
  const [directEmail, setDirectEmail] = useState<string>('');
  const [status, setStatus] = useState<Lead['status']>('new');
  const [customTag, setCustomTag] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (lead) {
      setNotes(lead.notes || '');
      setDecisionMakerName(lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || '');
      setDecisionMakerRole(lead.bantPlus?.authority?.role || lead.decisionMaker?.role || '');
      setDirectPhone(lead.decisionMaker?.directPhone || lead.phone || '');
      setDirectEmail(lead.decisionMaker?.directEmail || lead.email || '');
      setStatus(lead.status || 'new');
      setIsSaved(false);
    }
  }, [lead, isOpen]);

  if (!isOpen || !lead) return null;

  const handleAddTag = (tag: string) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const tagText = `[${tag} - ${time}] `;
    if (!notes.includes(tag)) {
      setNotes(prev => (prev ? `${prev}\n${tagText}` : tagText));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    const updatedLead: Lead = {
      ...lead,
      notes: notes.trim(),
      status: status,
      decisionMaker: {
        ...(lead.decisionMaker || { name: '', role: '' }),
        name: decisionMakerName.trim() || lead.decisionMaker?.name || '',
        role: decisionMakerRole.trim() || lead.decisionMaker?.role || '',
        directPhone: directPhone.trim() || lead.decisionMaker?.directPhone,
        directEmail: directEmail.trim() || lead.decisionMaker?.directEmail
      },
      phone: directPhone.trim() || lead.phone,
      email: directEmail.trim() || lead.email,
      bantPlus: lead.bantPlus ? {
        ...lead.bantPlus,
        authority: {
          ...lead.bantPlus.authority,
          keyDecisionMaker: decisionMakerName.trim() || lead.bantPlus.authority?.keyDecisionMaker || '',
          role: decisionMakerRole.trim() || lead.bantPlus.authority?.role || ''
        }
      } : undefined
    };

    onSaveLead(updatedLead);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scale-in">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white">{lead.name}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  lead.icpTier === 'SCORE_A' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  lead.icpTier === 'SCORE_B' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                  'bg-slate-700 text-slate-300'
                }`}>
                  {lead.icpTier} ({lead.icpScore}%)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lead.category} • {lead.city}, {lead.country || 'PT'} {lead.capturedAt ? `• Pesquisado em ${lead.capturedAt}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Status & Quick Tags */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                Tags Rápidas de Qualificação / Status
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Status do Lead:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Lead['status'])}
                  className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="new">NOVO</option>
                  <option value="contacted">CONTACTADO</option>
                  <option value="qualified">QUALIFICADO</option>
                  <option value="ignored">IGNORADO</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_TAGS.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Notes Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Anotações do SDR / Histórico de Negociação
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                Fica salvo automaticamente neste lote de pesquisa
              </span>
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Falei com o Carlos no WhatsApp. Ele tem interesse em reformular o site e automatizar o atendimento. Marcou reunião para quinta-feira às 14h..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all focus:outline-none"
            />
          </div>

          {/* Contact Details (Decisor, Cargo, Telefone, Email) */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              Dados de Decisão & Contato Direto
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nome do Decisor:</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={decisionMakerName}
                    onChange={(e) => setDecisionMakerName(e.target.value)}
                    placeholder="Ex: Carlos Mendes"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Cargo / Função:</label>
                <input
                  type="text"
                  value={decisionMakerRole}
                  onChange={(e) => setDecisionMakerRole(e.target.value)}
                  placeholder="Ex: Sócio Diretor / CEO"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Telefone / WhatsApp Direto:</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={directPhone}
                    onChange={(e) => setDirectPhone(e.target.value)}
                    placeholder="Ex: +351 912 345 678"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-mono font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Email Direto:</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={directEmail}
                    onChange={(e) => setDirectEmail(e.target.value)}
                    placeholder="Ex: carlos@empresa.pt"
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              {isSaved ? (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Salvo no Lote de Pesquisa!
                </span>
              ) : (
                <span>As alterações são preservadas permanentemente no lote selecionado.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Informações</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
