import React, { useState, useEffect, useCallback } from 'react';
import { Lead } from '../types';
import { 
  X, Phone, PhoneCall, MessageSquare, Send, Check, Copy, 
  Sparkles, CheckCircle2, Clock, AlertTriangle, ChevronDown, 
  ChevronUp, ArrowRight, ArrowLeft, Flame, Zap, AlertCircle, 
  Calendar, ShieldCheck, CornerDownRight, Volume2
} from 'lucide-react';
import { getWhatsAppOutreachUrl, formatLeadWhatsAppMessage } from '../services/whatsAppOutreachHelper';

interface FastDialerFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  activeLeadId: string | null;
  onSelectLead: (leadId: string) => void;
  onUpdateLead: (updatedLead: Lead) => void;
  onOpenOmnichannel?: (lead: Lead) => void;
}

export const FastDialerFocusModal: React.FC<FastDialerFocusModalProps> = ({
  isOpen,
  onClose,
  leads,
  activeLeadId,
  onSelectLead,
  onUpdateLead,
  onOpenOmnichannel
}) => {
  const [copiedPhone, setCopiedPhone] = useState<boolean>(false);
  const [activeObjectionIndex, setActiveObjectionIndex] = useState<number | null>(null);
  const [lastOutcomeFeedback, setLastOutcomeFeedback] = useState<string | null>(null);

  // Determina o lead atual e seu índice
  const currentIndex = Math.max(0, leads.findIndex(l => l.id === activeLeadId));
  const lead = leads[currentIndex] || null;

  // Próximo e Anterior
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < leads.length - 1;

  const goToNextLead = useCallback(() => {
    if (hasNext) {
      onSelectLead(leads[currentIndex + 1].id);
      setActiveObjectionIndex(null);
    }
  }, [hasNext, currentIndex, leads, onSelectLead]);

  const goToPrevLead = useCallback(() => {
    if (hasPrev) {
      onSelectLead(leads[currentIndex - 1].id);
      setActiveObjectionIndex(null);
    }
  }, [hasPrev, currentIndex, leads, onSelectLead]);

  // Função para discar
  const handleDialNumber = useCallback(() => {
    if (!lead) return;
    const phone = lead.decisionMaker?.directPhone || lead.phone || '';
    const clean = phone.replace(/\D/g, '');
    if (clean) {
      window.location.href = `tel:${clean}`;
    }
  }, [lead]);

  // Função para abrir WhatsApp 1-Click
  const handleSendWhatsApp = useCallback(() => {
    if (!lead) return;
    const wa = getWhatsAppOutreachUrl(lead);
    if (wa?.url) {
      window.open(wa.url, '_blank', 'noopener,noreferrer');
      // Atualiza marcador de envio no lead
      onUpdateLead({
        ...lead,
        status: 'contacted',
        whatsAppStatus: 'sent',
        whatsAppSentAt: new Date().toISOString(),
        lastContactedAt: new Date().toISOString()
      });
    }
  }, [lead, onUpdateLead]);

  // Grava desfecho da chamada e avança para o próximo lead
  const handleRecordOutcome = useCallback((outcome: 'MEETING_BOOKED' | 'IN_FOLLOWUP' | 'NO_INTEREST') => {
    if (!lead) return;
    const nowIso = new Date().toISOString();

    let newStatus: Lead['status'] = 'contacted';
    let outcomeLabel = '';

    if (outcome === 'MEETING_BOOKED') {
      newStatus = 'qualified';
      outcomeLabel = 'Reunião Agendada 🎯';
    } else if (outcome === 'IN_FOLLOWUP') {
      newStatus = 'contacted';
      outcomeLabel = 'Em Acompanhamento ⏳';
    } else {
      newStatus = 'ignored';
      outcomeLabel = 'Sem Interesse ⛔';
    }

    const updatedLead: Lead = {
      ...lead,
      status: newStatus,
      callOutcome: outcome,
      callOutcomeAt: nowIso,
      lastContactedAt: nowIso,
      whatsAppStatus: lead.whatsAppStatus || 'followup_pending'
    };

    onUpdateLead(updatedLead);
    setLastOutcomeFeedback(`Gravado: ${outcomeLabel}`);
    setTimeout(() => setLastOutcomeFeedback(null), 2500);

    // Se houver próximo lead, avança automaticamente
    if (hasNext) {
      setTimeout(() => {
        goToNextLead();
      }, 400);
    }
  }, [lead, hasNext, onUpdateLead, goToNextLead]);

  // Listener de Atalhos de Teclado (Fast-Dialer)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se o foco estiver em campo de texto
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;

      // Esc: Fecha o foco
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Seta para Cima: Lead anterior
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevLead();
        return;
      }

      // Seta para Baixo: Próximo lead
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextLead();
        return;
      }

      // Alt + C ou Espaço: Inicia a chamada (Discar)
      if ((e.key === ' ' || e.code === 'Space' || (e.altKey && (e.key === 'c' || e.key === 'C')))) {
        e.preventDefault();
        handleDialNumber();
        return;
      }

      // Alt + W: Abre WhatsApp
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        handleSendWhatsApp();
        return;
      }

      // Teclas 1, 2, 3 para desfechos rápidos
      if (e.key === '1') {
        e.preventDefault();
        handleRecordOutcome('MEETING_BOOKED');
        return;
      }
      if (e.key === '2') {
        e.preventDefault();
        handleRecordOutcome('IN_FOLLOWUP');
        return;
      }
      if (e.key === '3') {
        e.preventDefault();
        handleRecordOutcome('NO_INTEREST');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevLead, goToNextLead, handleDialNumber, handleSendWhatsApp, handleRecordOutcome]);

  if (!isOpen || !lead) return null;

  const decisor = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor / Proprietário';
  const role = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Responsável Comercial';
  const phone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = phone.replace(/\D/g, '');

  const guide = lead.seniorIcpQualification?.sdrTrainingGuide;
  const openingHook = guide?.openingHook 
    || lead.outreach?.callScript?.opener 
    || (lead.identifiedPain 
        ? `Vi que a ${lead.name} tem grande volume na região, mas ainda apresenta ${lead.identifiedPain.toLowerCase()}.`
        : `Vi o crescimento da ${lead.name} e identifiquei uma oportunidade direta de otimização comercial.`);

  const pitchTopics = guide?.pitchTopics || [
    `Dor Central: ${lead.identifiedPain || 'Falta de automação no atendimento digital'}`,
    `Impacto Comprovado: Recuperação de até 30% das oportunidades perdidas no WhatsApp`,
    `Fechamento: Diagnóstico comparativo de 5 minutos sem custo`
  ];

  const objections = guide?.objections || [
    {
      objection: "Já temos recepção / atendimento cuidando disso",
      howToOvercome: "Perfeito, a maioria dos nossos clientes também tinha! O problema é que a equipe perde até 30% do tempo confirmando dados. Nós automatizamos essa etapa."
    },
    {
      objection: "Não temos orçamento agora",
      howToOvercome: "Entendo perfeitamente. Por isso nosso teste de 5 min demonstra o retorno direto antes de qualquer investimento."
    }
  ];

  const handleCopyPhone = () => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const decisionBadge = lead.seniorIcpQualification?.commercialDecision || (lead.icpScore && lead.icpScore >= 75 ? 'LIGAR AGORA' : 'AGUARDAR');
  const finalScore = lead.seniorIcpQualification?.finalScore ?? lead.icpScore ?? 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      {/* Container Foco Total - Estilo Dark Neutral Limpo */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* BARRA SUPERIOR: Navegação, Decisor e Atalhos */}
        <div className="p-4 sm:px-6 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
          
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-black tracking-wide flex items-center gap-1.5 animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              <span>MODO FOCO TOTAL</span>
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold">
              Lead {currentIndex + 1} de {leads.length}
            </span>
          </div>

          {/* Atalhos Rápidos Visíveis (Treinamento SDR de Alta Performance) */}
          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Espaço / Alt+C: Discar</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Alt+W: WhatsApp</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">↑ / ↓: Trocar Lead</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 text-slate-300">Esc: Sair</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            title="Fechar Modo Foco (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FEEDBACK DE DESFECHO (TOAST INLINE) */}
        {lastOutcomeFeedback && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-6 py-2 text-xs font-bold text-emerald-300 text-center flex items-center justify-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{lastOutcomeFeedback}</span>
          </div>
        )}

        {/* CORPO DO TELEPROMPTER (Zero Distrações na Ligação) */}
        <div className="flex-1 p-5 sm:p-7 overflow-y-auto space-y-5">
          
          {/* IDENTIFICAÇÃO DO DECISOR & EMPRESA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {decisor}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold">
                  {role}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-black border ${
                  decisionBadge === 'LIGAR AGORA' 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : decisionBadge === 'AGUARDAR' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {decisionBadge} ({finalScore}/100)
                </span>
              </div>
              <p className="text-sm text-slate-400 font-medium mt-1">
                {lead.name} {lead.city ? `• ${lead.city}` : ''} {lead.category ? `• ${lead.category}` : ''}
              </p>
            </div>

            {/* BOTÕES DIRETOS DE CONTATO: LIGAR / WHATSAPP */}
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={handleDialNumber}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
                title="Discar para o telefone principal (Espaço ou Alt+C)"
              >
                <PhoneCall className="w-4 h-4 text-white" />
                <span>{phone ? `Discar ${phone}` : 'Discar'}</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                className="px-3.5 py-2.5 bg-slate-800 hover:bg-emerald-950/80 text-emerald-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                title="Abrir WhatsApp com mensagem pronta (Alt+W)"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
                {lead.whatsAppStatus === 'sent' && (
                  <Check className="w-3.5 h-3.5 text-emerald-400 ml-1" />
                )}
              </button>

              <button
                onClick={handleCopyPhone}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors"
                title="Copiar Telefone"
              >
                {copiedPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* TELEPROMPTER PRINCIPAL: FRASE DE ABERTURA (GANCHO) - FONTE GRANDE */}
          <div className="bg-slate-950 border-2 border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-inner relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                FALE ESTE GANCHO DE ABERTURA AGORA:
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Sub-30s Pitch Rule
              </span>
            </div>

            <p className="text-lg sm:text-2xl font-black text-slate-50 leading-relaxed tracking-wide select-all font-sans">
              "{openingHook}"
            </p>
          </div>

          {/* 3 TÓPICOS PRINCIPAIS DO PITCH (Guia Rápido de Apoio) */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              3 Tópicos Principais do Pitch (Não se perca na conversa):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {pitchTopics.map((topic, i) => (
                <div key={i} className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl text-xs text-slate-200">
                  <span className="text-amber-400 font-black mr-1.5">#{i + 1}</span>
                  <span className="font-medium">{topic}</span>
                </div>
              ))}
            </div>
          </div>

          {/* MATRIZ RÁPIDA DE OBJEÇÕES (TREINAMENTO SDR) */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Se o cliente lançar uma objeção, responda na hora:
              </span>
              <span className="text-[11px] text-slate-500">Clique para expandir resposta</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {objections.map((item, idx) => {
                const isActive = activeObjectionIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className={`rounded-2xl border transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-500/5' 
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                    onClick={() => setActiveObjectionIndex(isActive ? null : idx)}
                  >
                    <div className="p-3.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Objeção {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          "{item.objection}"
                        </span>
                      </div>
                      {isActive ? <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />}
                    </div>

                    {isActive && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-800/80 text-xs text-amber-100 italic bg-amber-500/5 leading-relaxed rounded-b-2xl">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block not-italic mb-1">
                          COMO CONTORNAR AGORA:
                        </span>
                        "{item.howToOvercome}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* BARRA INFERIOR: 3 BOTÕES GRANDES DE DESFECHO & NAVEGAÇÃO */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Navegação entre Leads */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={goToPrevLead}
              disabled={!hasPrev}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
              title="Lead Anterior (Seta Cima)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              onClick={goToNextLead}
              disabled={!hasNext}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors"
              title="Próximo Lead (Seta Baixo)"
            >
              <span>Próximo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 BOTÕES GRANDES DE DESFECHO COM ATALHO 1, 2, 3 */}
          <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
            
            <button
              onClick={() => handleRecordOutcome('MEETING_BOOKED')}
              className="py-3 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl text-center shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              title="Atalho: Tecla 1"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Reunião Agendada 🎯</span>
            </button>

            <button
              onClick={() => handleRecordOutcome('IN_FOLLOWUP')}
              className="py-3 px-3 sm:px-4 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm rounded-xl text-center shadow-lg shadow-amber-600/30 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              title="Atalho: Tecla 2"
            >
              <Clock className="w-4 h-4 text-amber-200" />
              <span>Em Acompanhamento ⏳</span>
            </button>

            <button
              onClick={() => handleRecordOutcome('NO_INTEREST')}
              className="py-3 px-3 sm:px-4 bg-slate-800 hover:bg-rose-900/80 hover:text-rose-200 text-slate-300 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-1.5"
              title="Atalho: Tecla 3"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Sem Interesse ⛔</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default FastDialerFocusModal;
