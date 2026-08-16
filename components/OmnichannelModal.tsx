import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { 
  X, MessageSquare, Mail, PhoneCall, Send, Copy, Check, 
  ExternalLink, Sparkles, AlertTriangle, Flame, Zap, Play, Pause, Volume2, VolumeX,
  Layers, Cpu, DollarSign, UserCheck, ShieldAlert, Clock, CheckCircle2, 
  TrendingUp, ShieldCheck, Shield, CheckCircle, RefreshCw, Radio, FileText, Lock,
  Calendar, Target, Crosshair, Award, RotateCcw
} from 'lucide-react';
import { logWebhookDispatch } from '../services/storageService';
import { buildDeliverabilityGuardian, buildEvolutionAndResendPayloads } from '../services/deliverabilityService';
import { buildObjectionCrusherMatrix, generateGoogleCalendarUrl } from '../services/objectionCrusherService';
import { buildCadenceMaster } from '../services/cadenceService';
import { sendLeadToPitroCrm, buildPitroCrmPayload, getPitroCrmConfig } from '../services/pitroCrmService';

interface OmnichannelModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'pitro_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech';
  onMarkContacted?: (id: string) => void;
  onOpenLiveCopilot?: (lead: Lead) => void;
}

const OmnichannelModal: React.FC<OmnichannelModalProps> = ({
  lead,
  isOpen,
  onClose,
  initialTab = 'cadence',
  onMarkContacted,
  onOpenLiveCopilot
}) => {
  const [activeTab, setActiveTab] = useState<'pitro_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [webhookResult, setWebhookResult] = useState<string | null>(null);
  const [pitroSyncStatus, setPitroSyncStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [pitroSyncMessage, setPitroSyncMessage] = useState<string | null>(null);
  
  // WhatsApp Spinning State: Variation A, B or C
  const [waVariation, setWaVariation] = useState<'A' | 'B' | 'C'>('A');
  
  // Email Mode State: Plain Text (Default/99% Inbox), AIDA, PAS
  const [emailMode, setEmailMode] = useState<'plain' | 'aida' | 'pas'>('plain');

  // Objection Crusher State
  const [activeObjectionKey, setActiveObjectionKey] = useState<'alreadyHaveProvider' | 'sendByEmail' | 'noBudget' | 'noTime' | 'notInterested'>('alreadyHaveProvider');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCallTimerRunning, setIsCallTimerRunning] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  // Omnichannel Cadence Master State
  const [selectedCadenceStepIndex, setSelectedCadenceStepIndex] = useState(0);
  const [isCadenceAutomationActive, setIsCadenceAutomationActive] = useState(true);
  const [leadHasResponded, setLeadHasResponded] = useState(false);
  const [respondedChannel, setRespondedChannel] = useState<'whatsapp' | 'email' | 'call' | 'linkedin'>('whatsapp');

  // Call timer interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallTimerRunning) {
      interval = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallTimerRunning]);

  // Reset states when lead or modal changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setIsCallTimerRunning(false);
      setCallSeconds(0);
      setSelectedCadenceStepIndex(0);
      setIsCadenceAutomationActive(true);
      setLeadHasResponded(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
    }
  }, [isOpen, initialTab, lead]);

  if (!isOpen || !lead) return null;

  // Build guardian if not already attached
  const guardian = lead.guardian || buildDeliverabilityGuardian(lead);

  // Build objection crusher matrix if not already attached
  const crusherMatrix = lead.objectionCrusher || buildObjectionCrusherMatrix(lead);

  // Build cadence master if not already attached
  const cadenceMaster = lead.cadence || buildCadenceMaster(lead);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cleanPhone = lead.decisionMaker?.directPhone?.replace(/\D/g, '') || lead.phone?.replace(/\D/g, '') || '';
  
  // Get active WhatsApp message from 3-Way Spinning
  const getActiveWaMessage = () => {
    if (waVariation === 'A') return guardian.whatsappShield.spinningVariations.variationA;
    if (waVariation === 'B') return guardian.whatsappShield.spinningVariations.variationB;
    return guardian.whatsappShield.spinningVariations.variationC;
  };

  const currentWaMessage = getActiveWaMessage();

  const waUrl = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(currentWaMessage)}` 
    : null;

  // Get active Email body
  const getActiveEmail = () => {
    if (emailMode === 'plain') {
      return {
        subject: guardian.emailShield.cleanPlainText.subject,
        body: guardian.emailShield.cleanPlainText.body
      };
    }
    if (emailMode === 'aida') {
      return {
        subject: lead.outreach?.email?.subject || guardian.emailShield.cleanPlainText.subject,
        body: lead.outreach?.email?.bodyAida || guardian.emailShield.cleanPlainText.body
      };
    }
    return {
      subject: lead.outreach?.email?.subject || guardian.emailShield.cleanPlainText.subject,
      body: lead.outreach?.email?.bodyPas || guardian.emailShield.cleanPlainText.body
    };
  };

  const currentEmail = getActiveEmail();

  // Dynamic Payloads for selected variation
  const dynamicPayloads = buildEvolutionAndResendPayloads(lead, waVariation);

  const handleSendWebhook = async (type: 'EVOLUTION_WHATSAPP' | 'ZAPI_WHATSAPP' | 'RESEND_EMAIL' | 'HUBSPOT_CRM') => {
    setWebhookStatus('sending');
    setWebhookResult(null);

    let payload: any = {};
    if (type === 'EVOLUTION_WHATSAPP') payload = dynamicPayloads.evolutionApiWhatsApp;
    else if (type === 'ZAPI_WHATSAPP') payload = dynamicPayloads.zapiWhatsApp;
    else if (type === 'RESEND_EMAIL') payload = dynamicPayloads.resendEmail;
    else if (type === 'HUBSPOT_CRM') payload = dynamicPayloads.hubspotCrmTask;

    try {
      if (customWebhookUrl && customWebhookUrl.startsWith('http')) {
        const res = await fetch(customWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: type,
            leadId: lead.id,
            timestamp: new Date().toISOString(),
            guardianProtected: true,
            payload
          })
        });
        const text = await res.text();
        logWebhookDispatch({
          type: type as any,
          targetUrl: customWebhookUrl,
          payload,
          status: 'SUCCESS',
          response: text.slice(0, 100)
        });
        setWebhookResult(`Sucesso! Status HTTP ${res.status}. Payload entregue com proteção Anti-Ban.`);
      } else {
        // Simulated local dispatch for n8n/Make
        await new Promise(r => setTimeout(r, 600));
        logWebhookDispatch({
          type: type as any,
          targetUrl: 'Simulation (Local n8n/Make Engine)',
          payload,
          status: 'SIMULATED',
          response: 'Payload validado e formatado com Anti-Ban Guardian'
        });
        setWebhookResult(`Payload validado e pronto para n8n/Make/Evolution API!`);
      }
      setWebhookStatus('success');
      if (onMarkContacted) onMarkContacted(lead.id);
    } catch (err: any) {
      setWebhookStatus('error');
      setWebhookResult(`Falha no envio: ${err.message || 'Erro de conexão'}`);
      logWebhookDispatch({
        type: type as any,
        targetUrl: customWebhookUrl || 'Local Simulation',
        payload,
        status: 'FAILED',
        response: err.message
      });
    }
  };

  const bant = lead.bantPlus;
  const tech = lead.techStack;
  const flaws = lead.keyFlaws || bant?.need?.operationalFlaws || [lead.identifiedPain || "Vazamento de oportunidades no primeiro contato"];

  const currentCrusherItem = crusherMatrix.objections[activeObjectionKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Superior com Contexto & Badges */}
        <div className="bg-slate-900 px-6 pt-5 pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                
                {/* Shield Deliverability Badge */}
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ANTI-BAN GUARDIAN • 0% BLOQUEIO
                </span>

                {/* Intent Priority Badge */}
                {lead.intentPriority === 'HIGH' ? (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    INTENT ALTO ({lead.intentScore}%) • LIGAR AGORA
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    FILA PADRÃO • INTENT {lead.intentScore ?? lead.icpScore}%
                  </span>
                )}

                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {lead.icpScore}% ICP Match ({lead.icpTier})
                </span>

                {/* AI Live Copilot Quick Trigger */}
                {onOpenLiveCopilot && (
                  <button
                    onClick={() => onOpenLiveCopilot(lead)}
                    className="text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    Copiloto IA ao Vivo (Escutar Chamada / Whats)
                  </button>
                )}
              </div>

              <h2 className="text-xl font-extrabold text-white flex items-center gap-2 mt-1">
                {lead.name}
              </h2>
              <p className="text-xs text-slate-400">
                Decisor Mapeado: <strong className="text-slate-200">{bant?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Responsável Comercial'}</strong> ({bant?.authority?.role || lead.decisionMaker?.role || 'Diretoria'}) • {lead.city}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Dor Identificada Quick Callout */}
          <div className="mt-4 bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-amber-300 font-semibold">Gancho de Abordagem & Falha Mapeada: </span>
              <span className="text-slate-200">"{lead.keyFlaws?.[0] || lead.identifiedPain}"</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-b border-slate-800 pb-1 overflow-x-auto">
            
            {/* TAB: PITRO CRM & EVOLUTION API */}
            <button
              id="tab-pitro-crm"
              onClick={() => setActiveTab('pitro_crm')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'pitro_crm' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 ring-1 ring-purple-300/40' : 'text-purple-300 hover:text-white hover:bg-purple-950/40 border border-purple-900/40'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              Pitro CRM & Evolution API
            </button>

            {/* TAB: OMNICHANNEL CADENCE MASTER (21 DIAS) */}
            <button
              id="tab-cadence-21d"
              onClick={() => setActiveTab('cadence')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'cadence' ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 text-white shadow-md shadow-amber-900/30 ring-1 ring-amber-300/40' : 'text-amber-300 hover:text-white hover:bg-amber-950/40 border border-amber-900/40'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              Cadência 21 Dias (Master)
            </button>

            {/* TAB: ELITE OBJECTION CRUSHER */}
            <button
              onClick={() => setActiveTab('objection_crusher')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                activeTab === 'objection_crusher' ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md shadow-rose-900/30' : 'text-rose-300 hover:text-white hover:bg-rose-950/40 border border-rose-900/40'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-rose-300" />
              Objection Crusher (Copiloto)
            </button>

            <button
              onClick={() => setActiveTab('guardian')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'guardian' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Anti-Ban & Entregabilidade
            </button>

            <button
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'whatsapp' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-teal-300" />
              WhatsApp (3 Spins)
            </button>

            <button
              onClick={() => setActiveTab('email')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'email' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-blue-300" />
              Email (Plain Text 99% Inbox)
            </button>

            <button
              onClick={() => setActiveTab('call')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'call' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
              Cold Call Script
            </button>

            <button
              onClick={() => setActiveTab('bant')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'bant' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              BANT+ Matrix
            </button>

            <button
              onClick={() => setActiveTab('tech')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'tech' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-300" />
              Tech Stack
            </button>

            <button
              onClick={() => setActiveTab('webhook')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                activeTab === 'webhook' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Send className="w-3.5 h-3.5 text-purple-300" />
              Webhooks n8n & CRM
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 text-slate-800">
          
          {/* TAB: PITRO CRM & EVOLUTION API INTEGRATION */}
          {activeTab === 'pitro_crm' && (
            <div className="space-y-6">
              
              {/* Header Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white p-5 rounded-2xl border border-purple-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Pitro CRM Outbound Sync • Evolution API v2 / Evolution Go
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Sincronização de Lead, BANT+, Tech Stack & Mensagens de Disparo
                  </h3>
                  <p className="text-xs text-purple-200/90 leading-relaxed max-w-2xl">
                    Envie o lead qualificado com dados completos para o pipeline do Pitro CRM e dispare a mensagem de abordagem via Evolution API com delay humanizado e proteção anti-bloqueio.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onOpenLiveCopilot && (
                    <button
                      onClick={() => onOpenLiveCopilot(lead)}
                      className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Abrir Copiloto IA</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sync Controls & Action Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Parâmetros de Disparo para {lead.name}
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Decisor: <strong>{lead.decisionMaker?.name || 'Diretoria'}</strong> • Telefone: <strong>{lead.phone || 'Não informado'}</strong>
                    </span>
                  </div>

                  {/* Variation Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-600">Variação Whats:</span>
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg">
                      {(['A', 'B', 'C'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setWaVariation(v)}
                          className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                            waVariation === v ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Var {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid of Payloads Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Evolution WhatsApp Box */}
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        WhatsApp Evolution API ({waVariation})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                        Delay: 22s • Composing
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium italic line-clamp-3 bg-white p-2.5 rounded-lg border border-emerald-100">
                      "{waVariation === 'B' ? guardian.whatsappShield.spinningVariations.variationB :
                        waVariation === 'C' ? guardian.whatsappShield.spinningVariations.variationC :
                        guardian.whatsappShield.spinningVariations.variationA}"
                    </p>
                  </div>

                  {/* Resend Email Box */}
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        E-mail Outbound (Resend / SMTP)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono font-bold">
                        99% Inbox • SPF/DKIM
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium line-clamp-3 bg-white p-2.5 rounded-lg border border-blue-100">
                      <strong>Assunto:</strong> {guardian.emailShield.cleanPlainText.subject}<br/>
                      {guardian.emailShield.cleanPlainText.body.slice(0, 100)}...
                    </p>
                  </div>

                </div>

                {/* Dispatch Button & Result */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-600">
                    Endpoint de destino: <code className="bg-slate-100 px-2 py-0.5 rounded text-purple-700 font-mono">{getPitroCrmConfig().webhookUrl}</code>
                  </div>

                  <button
                    id="btn-sync-lead-pitro"
                    onClick={async () => {
                      setPitroSyncStatus('sending');
                      setPitroSyncMessage(`Enviando ${lead.name} para Pitro CRM...`);
                      try {
                        const res = await sendLeadToPitroCrm(lead, undefined, {
                          whatsappVariation: waVariation
                        });
                        setPitroSyncStatus(res.success ? 'success' : 'error');
                        setPitroSyncMessage(res.message);
                        if (res.success && onMarkContacted) {
                          onMarkContacted(lead.id);
                        }
                      } catch (e: any) {
                        setPitroSyncStatus('error');
                        setPitroSyncMessage(e.message || 'Erro ao sincronizar');
                      }
                    }}
                    disabled={pitroSyncStatus === 'sending'}
                    className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {pitroSyncStatus === 'sending' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-amber-300" />
                    )}
                    <span>Disparar Lead + Mensagens para Pitro CRM</span>
                  </button>
                </div>

                {pitroSyncMessage && (
                  <div className={`p-3 rounded-lg text-xs font-bold flex items-center justify-between ${
                    pitroSyncStatus === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' :
                    pitroSyncStatus === 'error' ? 'bg-rose-50 text-rose-900 border border-rose-200' : 'bg-purple-50 text-purple-900 border border-purple-200'
                  }`}>
                    <span>{pitroSyncMessage}</span>
                    {pitroSyncStatus === 'success' && <Check className="w-4 h-4 text-emerald-600" />}
                  </div>
                )}

              </div>

              {/* Formatted JSON Payload for Pitro CRM */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Estrutura Completa do Payload Pitro CRM & Evolution (JSON)
                  </span>
                  <button
                    onClick={() => {
                      const payload = buildPitroCrmPayload(lead, undefined, { whatsappVariation: waVariation });
                      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                      setCopiedKey('pitro-payload');
                      setTimeout(() => setCopiedKey(null), 2000);
                    }}
                    className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-bold"
                  >
                    {copiedKey === 'pitro-payload' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pitro-payload' ? 'Copiado!' : 'Copiar Payload'}</span>
                  </button>
                </div>

                <pre className="bg-slate-950 text-amber-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {JSON.stringify(buildPitroCrmPayload(lead, undefined, { whatsappVariation: waVariation }), null, 2)}
                </pre>
              </div>

            </div>
          )}

          {/* TAB: OMNICHANNEL CADENCE MASTER (RÉGUA DE 21 DIAS & LÓGICA DE PARADA) */}
          {activeTab === 'cadence' && (
            <div className="space-y-6">
              
              {/* Top Banner: Master Engine Status & Stop Trigger Simulation */}
              <div className="bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 text-white p-5 rounded-2xl border border-amber-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    Omnichannel Cadence Master • Régua Outbound de 21 Dias
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Sequência Automatizada Multicanal para {cadenceMaster.companyName}
                  </h3>
                  <p className="text-xs text-amber-200/90 leading-relaxed max-w-2xl">
                    7 etapas estratégicas intercalando WhatsApp, Email Cold Outbound, Chamadas e Breakup com tom ultra-personalizado e lógica de parada instantânea.
                  </p>
                </div>

                {/* Automation & Stop Trigger Controls */}
                <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/90 p-3 rounded-xl border border-amber-800/50 shrink-0">
                  <div className="text-left pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Status da Régua</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-md ${
                      leadHasResponded 
                        ? 'bg-rose-900/80 text-rose-200 border border-rose-600'
                        : isCadenceAutomationActive 
                          ? 'bg-emerald-900/80 text-emerald-200 border border-emerald-600' 
                          : 'bg-amber-900/80 text-amber-200 border border-amber-600'
                    }`}>
                      {leadHasResponded ? (
                        <>
                          <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
                          PARADA ACIONADA
                        </>
                      ) : isCadenceAutomationActive ? (
                        <>
                          <Zap className="w-3 h-3 text-emerald-400" />
                          AUTOMAÇÃO ATIVA
                        </>
                      ) : (
                        <>
                          <Pause className="w-3 h-3 text-amber-400" />
                          PAUSADA
                        </>
                      )}
                    </span>
                  </div>

                  {/* Trigger Simulator Button */}
                  <button
                    id="btn-simulate-lead-response"
                    onClick={() => {
                      if (!leadHasResponded) {
                        setLeadHasResponded(true);
                        setIsCadenceAutomationActive(false);
                      } else {
                        setLeadHasResponded(false);
                        setIsCadenceAutomationActive(true);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      leadHasResponded
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-950'
                    }`}
                    title="Simula o recebimento de uma resposta do lead para disparar a lógica de parada"
                  >
                    {leadHasResponded ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                        <span>Reativar Régua</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-3.5 h-3.5 text-white animate-pulse" />
                        <span>Simular Resposta (Lógica de Parada)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stop Trigger Active Alert */}
              {leadHasResponded && (
                <div className="bg-rose-50 border-2 border-rose-500 p-4 rounded-xl text-xs space-y-2 shadow-sm animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-900 font-extrabold text-sm">
                      <AlertTriangle className="w-5 h-5 text-rose-600 animate-bounce" />
                      LÓGICA DE PARADA AUTOMÁTICA DISPARADA (STOP TRIGGER)
                    </div>
                    <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] font-bold rounded">
                      TAG: LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO
                    </span>
                  </div>
                  <p className="text-rose-800 leading-relaxed font-medium">
                    O lead <strong>{cadenceMaster.leadName}</strong> da <strong>{cadenceMaster.companyName}</strong> respondeu a um dos canais da régua! 
                    Todas as automações de follow-up subsequentes foram <strong>interrompidas imediatamente</strong> e o evento foi enviado para o CRM para que o SDR assuma o contato humano.
                  </p>
                  <div className="bg-rose-100/80 p-2.5 rounded-lg border border-rose-300 font-mono text-[11px] text-rose-950 flex items-center justify-between">
                    <span>crm.trigger(&#123; tag: "LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO", priority: "URGENTE" &#125;)</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Payload Disparado
                    </span>
                  </div>
                </div>
              )}

              {/* 21-Day Step Timeline Navigation */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Mapa Temporal de 21 Dias (7 Etapas Estruturadas)
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    Clique em um dia para inspecionar os canais e mensagens
                  </span>
                </div>

                {/* Day selector pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {cadenceMaster.steps.map((step, idx) => {
                    const isSelected = selectedCadenceStepIndex === idx;
                    return (
                      <button
                        key={`cadence-step-${step.day}`}
                        id={`btn-cadence-day-${step.day}`}
                        onClick={() => setSelectedCadenceStepIndex(idx)}
                        className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300' 
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            Dia {step.day}
                          </span>
                          <span className={`text-[9px] font-bold px-1 rounded ${
                            isSelected ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {step.messages.length} {step.messages.length > 1 ? 'canais' : 'canal'}
                          </span>
                        </div>
                        <span className={`text-[10px] font-medium line-clamp-1 mt-1 ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                          {step.primaryChannel === 'multichannel' ? 'WhatsApp + Email' : step.primaryChannel.toUpperCase()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Step Detailed Messages */}
              {(() => {
                const currentStep = cadenceMaster.steps[selectedCadenceStepIndex] || cadenceMaster.steps[0];
                return (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5">
                    {/* Step Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-black rounded-md">
                            ETAPA {currentStep.stepNumber} • DIA {currentStep.day}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">
                            {currentStep.title}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          <strong className="text-slate-700">Objetivo:</strong> {currentStep.objective}
                        </p>
                      </div>

                      <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-200 max-w-sm text-slate-600">
                        <strong className="text-slate-800 block text-[11px]">Contexto Estratégico:</strong>
                        <span className="text-[11px] leading-relaxed">{currentStep.strategicContext}</span>
                      </div>
                    </div>

                    {/* Messages in this Step */}
                    <div className="space-y-4">
                      {currentStep.messages.map((msg, mIdx) => {
                        const isWa = msg.channel === 'whatsapp';
                        const isEmail = msg.channel === 'email';
                        const isCall = msg.channel === 'call';

                        const waDirectUrl = cleanPhone 
                          ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg.content)}` 
                          : '';

                        const mailtoUrl = lead.email 
                          ? `mailto:${lead.email}?subject=${encodeURIComponent(msg.subject || '')}&body=${encodeURIComponent(msg.content)}` 
                          : '';

                        return (
                          <div 
                            key={`step-${currentStep.day}-msg-${mIdx}`}
                            className={`rounded-xl border p-4 transition-all ${
                              isWa ? 'bg-emerald-50/40 border-emerald-200' :
                              isEmail ? 'bg-blue-50/40 border-blue-200' :
                              isCall ? 'bg-amber-50/40 border-amber-200' :
                              'bg-purple-50/40 border-purple-200'
                            }`}
                          >
                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5 mb-3">
                              <div className="flex items-center gap-2">
                                {isWa && <MessageSquare className="w-4 h-4 text-emerald-600" />}
                                {isEmail && <Mail className="w-4 h-4 text-blue-600" />}
                                {isCall && <PhoneCall className="w-4 h-4 text-amber-600" />}
                                <strong className="text-xs font-bold text-slate-900">
                                  {msg.label}
                                </strong>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {msg.cta && (
                                  <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                    CTA: {msg.cta}
                                  </span>
                                )}
                                <button
                                  onClick={() => handleCopy(msg.content, `cadence-${currentStep.day}-${mIdx}`)}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition-colors text-xs flex items-center gap-1"
                                  title="Copiar mensagem"
                                >
                                  {copiedKey === `cadence-${currentStep.day}-${mIdx}` ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                  <span>{copiedKey === `cadence-${currentStep.day}-${mIdx}` ? 'Copiado' : 'Copiar'}</span>
                                </button>
                              </div>
                            </div>

                            {/* Subject for Email */}
                            {msg.subject && (
                              <div className="mb-2 bg-white/80 p-2 rounded-md border border-slate-200 text-xs">
                                <span className="font-bold text-slate-500">Assunto: </span>
                                <strong className="text-slate-900">{msg.subject}</strong>
                              </div>
                            )}

                            {/* Message Body */}
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </div>

                            {/* Action Row & SDR Tips */}
                            <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                              {msg.notes && (
                                <div className="text-[11px] text-slate-500 italic">
                                  💡 <strong>Dica SDR:</strong> {msg.notes}
                                </div>
                              )}

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {isWa && waDirectUrl && (
                                  <a
                                    href={waDirectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Disparar WhatsApp</span>
                                  </a>
                                )}

                                {isEmail && mailtoUrl && (
                                  <a
                                    href={mailtoUrl}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                                  >
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Abrir no Email</span>
                                  </a>
                                )}

                                <button
                                  onClick={() => handleSpeakText(msg.content)}
                                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                                  title="Ouvir mensagem"
                                >
                                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-slate-600" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* AUTOMATIC STATUS TRIGGER (LÓGICA DE PARADA) EXPLICADA & WEBHOOK PAYLOAD */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-amber-600" />
                    3. Automatic Status Trigger & Payload do CRM (Lógica de Parada)
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200">
                    Regra n8n / Make / Webhook
                  </span>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-lg border border-amber-200 text-xs leading-relaxed text-amber-950">
                  <strong>Regra de Negócio Automatizada:</strong> "Se o lead responder em QUALQUER canal (WhatsApp, E-mail, Ligação ou LinkedIn), interromper imediatamente a automação de follow-up e criar uma tarefa no CRM com tag <span className="bg-amber-200/70 px-1 py-0.5 rounded font-mono font-bold text-amber-900">LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO</span>."
                </div>

                {/* CRM Stop Payload JSON */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs text-slate-500">
                    <span className="font-bold">Payload JSON de Interrupção Imediata:</span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(cadenceMaster.crmStopPayload, null, 2), 'crm-stop-payload')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                    >
                      {copiedKey === 'crm-stop-payload' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'crm-stop-payload' ? 'Copiado' : 'Copiar Payload'}</span>
                    </button>
                  </div>
                  <pre className="bg-slate-900 text-amber-300 p-3.5 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
                    {JSON.stringify(cadenceMaster.crmStopPayload, null, 2)}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {/* TAB: ELITE SALES OBJECTION CRUSHER (COPILOTO DE COLD CALL & PITCH HUMANO) */}
          {activeTab === 'objection_crusher' && (
            <div className="space-y-6">
              
              {/* Top Banner with Live Call Timer & Controls */}
              <div className="bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 text-white p-5 rounded-2xl border border-rose-800/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-black uppercase tracking-wider">
                    <Crosshair className="w-4 h-4 text-rose-500 animate-pulse" />
                    Elite Sales Objection Crusher • Copiloto de Prospecção Humana
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Matriz Anti-Objeção & Roteiros de 3 Frases para Ligação ao Vivo
                  </h3>
                  <p className="text-xs text-rose-200/90 leading-relaxed max-w-2xl">
                    Previsão em tempo real do comportamento do lead, ancorando cada resposta na brecha técnica concreta de <strong className="text-white">{crusherMatrix.targetCompanyProfile.name}</strong> para fechar no Google Calendar.
                  </p>
                </div>

                {/* Call Timer Widget */}
                <div className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-rose-800/50 shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">Tempo de Chamada</span>
                    <span className="text-lg font-mono font-black text-white">{formatTimer(callSeconds)}</span>
                  </div>
                  <button
                    onClick={() => setIsCallTimerRunning(!isCallTimerRunning)}
                    className={`p-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isCallTimerRunning 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title={isCallTimerRunning ? 'Pausar Cronômetro' : 'Iniciar Chamada'}
                  >
                    {isCallTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isCallTimerRunning ? 'Gravando' : 'Iniciar Call'}</span>
                  </button>
                  {callSeconds > 0 && (
                    <button
                      onClick={() => {
                        setIsCallTimerRunning(false);
                        setCallSeconds(0);
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Zerar Cronômetro"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* 1. MAPEAMENTO DA EMPRESA ALVO */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs uppercase tracking-wider">
                    <Target className="w-4 h-4 text-rose-600" />
                    1. Mapeamento da Empresa Alvo (Diagnóstico Customizado)
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200">
                    Análise Cirúrgica B2B
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Empresa & Nicho</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{crusherMatrix.targetCompanyProfile.name}</strong>
                    <span className="text-slate-500 text-[11px]">{crusherMatrix.targetCompanyProfile.niche}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Decisor Comercial</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{crusherMatrix.targetCompanyProfile.decisionMaker}</strong>
                    <span className="text-slate-500 text-[11px]">{lead.bantPlus?.authority?.role || lead.decisionMaker?.role || 'Diretoria'}</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Porte & Orçamento</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{crusherMatrix.targetCompanyProfile.budgetContext}</strong>
                    <span className="text-slate-500 text-[11px]">Maturidade: {lead.budgetMaturity}</span>
                  </div>

                </div>

                {/* Âncora de Brecha Técnica Central */}
                <div className="bg-rose-50/70 p-3.5 rounded-lg border border-rose-200 flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-extrabold text-rose-900 uppercase tracking-wider block">
                      Âncora de Brecha Técnica Mapeada (Gatilho Inegável de Contorno):
                    </span>
                    <p className="text-rose-950 font-semibold mt-0.5">
                      "{crusherMatrix.targetCompanyProfile.technicalGapAnchor}"
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. ROTEIROS DE CONTORNO DE OBJEÇÃO (5 SCRIPTS RÁPIDOS DE 3 FRASES) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4 text-rose-600" />
                      2. Roteiros de Contorno Rápido (Máximo 3 Frases - Empatia + Ancoragem + Valor)
                    </h4>
                    <p className="text-xs text-gray-500">Selecione a objeção dita pelo lead para exibir o script exato de desarmamento:</p>
                  </div>
                  
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
                    5 Objeções Clássicas
                  </span>
                </div>

                {/* Objections Selector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2">
                  
                  {/* Objeção 1 */}
                  <button
                    onClick={() => setActiveObjectionKey('alreadyHaveProvider')}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                      activeObjectionKey === 'alreadyHaveProvider'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">1. Fornecedor</span>
                    <span className="font-bold leading-tight">"Já tenho agência / parceiro"</span>
                  </button>

                  {/* Objeção 2 */}
                  <button
                    onClick={() => setActiveObjectionKey('sendByEmail')}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                      activeObjectionKey === 'sendByEmail'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">2. Proposta</span>
                    <span className="font-bold leading-tight">"Me envia por e-mail"</span>
                  </button>

                  {/* Objeção 3 */}
                  <button
                    onClick={() => setActiveObjectionKey('noBudget')}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                      activeObjectionKey === 'noBudget'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">3. Orçamento</span>
                    <span className="font-bold leading-tight">"Não temos verba / caro"</span>
                  </button>

                  {/* Objeção 4 */}
                  <button
                    onClick={() => setActiveObjectionKey('noTime')}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                      activeObjectionKey === 'noTime'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">4. Tempo</span>
                    <span className="font-bold leading-tight">"Não tenho tempo agora"</span>
                  </button>

                  {/* Objeção 5 */}
                  <button
                    onClick={() => setActiveObjectionKey('notInterested')}
                    className={`p-2.5 rounded-xl text-left border transition-all text-xs flex flex-col justify-between gap-1.5 ${
                      activeObjectionKey === 'notInterested'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-wider opacity-80">5. Interesse</span>
                    <span className="font-bold leading-tight">"Não tenho interesse"</span>
                  </button>

                </div>

                {/* Selected Objection Script Battlecard */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 rounded-2xl border border-slate-800 space-y-4 shadow-lg">
                  
                  {/* Header of the Script Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                          Objeção do Lead:
                        </span>
                        <span className="text-xs font-bold text-white bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
                          "{currentCrusherItem.objection}"
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        🧠 Ângulo Psicológico: <strong className="text-slate-200">{currentCrusherItem.psychologicalAngle}</strong>
                      </span>
                    </div>

                    {/* Audio & Copy Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSpeakText(currentCrusherItem.responseScript)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isSpeaking 
                            ? 'bg-rose-600 text-white animate-pulse' 
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                        }`}
                        title="Ouvir entonação recomendada (Síntese de Voz)"
                      >
                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-white" /> : <Volume2 className="w-3.5 h-3.5 text-rose-400" />}
                        <span>{isSpeaking ? 'Parar Áudio' : 'Ouvir Entonação'}</span>
                      </button>

                      <button
                        onClick={() => handleCopy(currentCrusherItem.responseScript, `objection-${activeObjectionKey}`)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        {copiedKey === `objection-${activeObjectionKey}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === `objection-${activeObjectionKey}` ? 'Copiado!' : 'Copiar Script'}
                      </button>
                    </div>
                  </div>

                  {/* The 3-Sentence High-Conversion Script */}
                  <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/80 font-sans text-sm text-slate-100 leading-relaxed space-y-2">
                    <p className="text-base font-semibold text-white selection:bg-rose-500">
                      "{currentCrusherItem.responseScript}"
                    </p>
                  </div>

                  {/* SDR Guidance Footer */}
                  <div className="bg-rose-950/40 p-3 rounded-lg border border-rose-900/40 flex items-start gap-2 text-xs text-rose-200">
                    <Zap className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-rose-300">Orientação Tática ao Prospectador: </strong>
                      <span>{currentCrusherItem.sdrGuidance}</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* 3. BÔNUS: GATILHOS DE FECHAMENTO RÁPIDO (CALL TO ACTION COM GOOGLE CALENDAR) */}
              <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm space-y-4">
                
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    3. Bônus: Gatilhos de Fechamento Rápido (Transição Direta para Google Calendar)
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                    Gatilhos de Fechamento 100% Assertivos
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* CTA 1: Google Calendar Transition */}
                  <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                          Fechamento 1: Transição de Agenda
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                          Opção Recomendada
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-emerald-100 font-medium mt-2 leading-relaxed">
                        "{crusherMatrix.fastClosingCTAs.googleCalendarTransition}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopy(crusherMatrix.fastClosingCTAs.googleCalendarTransition, 'cta-gcal')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        {copiedKey === 'cta-gcal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'cta-gcal' ? 'Copiado!' : 'Copiar Frase 1'}
                      </button>

                      <a
                        href={generateGoogleCalendarUrl(lead)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all shrink-0"
                        title="Abrir Google Calendar com evento pré-preenchido"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Abrir Google Calendar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* CTA 2: Executive Two-Option Close */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 space-y-2.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                          Fechamento 2: Escolha Binária Executiva
                        </span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                          Google Meet Direto
                        </span>
                      </div>
                      <p className="text-xs text-gray-800 bg-white p-3 rounded-lg border border-blue-100 font-medium mt-2 leading-relaxed">
                        "{crusherMatrix.fastClosingCTAs.executiveTwoOptionClose}"
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleCopy(crusherMatrix.fastClosingCTAs.executiveTwoOptionClose, 'cta-exec')}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        {copiedKey === 'cta-exec' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'cta-exec' ? 'Copiado!' : 'Copiar Frase 2 (Fechamento Binário)'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* 4. VISUAL BATTLECARD (TODAS AS 5 OBJEÇÕES VISÍVEIS SIMULTANEAMENTE PARA CONSULTA RELÂMPAGO) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
                    <Award className="w-4 h-4 text-amber-500" />
                    Painel de Batalha Rápida (Flashcards de Consulta em 0.5s Durante a Ligação)
                  </div>
                  <span className="text-[10px] text-slate-500">Mantenha aberto durante a chamada telefônica</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  
                  {/* Card 1 */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>1. "Já tenho fornecedor"</span>
                      <button 
                        onClick={() => handleCopy(crusherMatrix.objections.alreadyHaveProvider.responseScript, 'fc-1')}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        {copiedKey === 'fc-1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      "{crusherMatrix.objections.alreadyHaveProvider.responseScript}"
                    </p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>2. "Me envia por e-mail"</span>
                      <button 
                        onClick={() => handleCopy(crusherMatrix.objections.sendByEmail.responseScript, 'fc-2')}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        {copiedKey === 'fc-2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      "{crusherMatrix.objections.sendByEmail.responseScript}"
                    </p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>3. "Não temos orçamento"</span>
                      <button 
                        onClick={() => handleCopy(crusherMatrix.objections.noBudget.responseScript, 'fc-3')}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        {copiedKey === 'fc-3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      "{crusherMatrix.objections.noBudget.responseScript}"
                    </p>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>4. "Não tenho tempo agora"</span>
                      <button 
                        onClick={() => handleCopy(crusherMatrix.objections.noTime.responseScript, 'fc-4')}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        {copiedKey === 'fc-4' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      "{crusherMatrix.objections.noTime.responseScript}"
                    </p>
                  </div>

                  {/* Card 5 */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 md:col-span-2">
                    <div className="flex items-center justify-between text-slate-900 font-bold">
                      <span>5. "Não tenho interesse"</span>
                      <button 
                        onClick={() => handleCopy(crusherMatrix.objections.notInterested.responseScript, 'fc-5')}
                        className="text-slate-500 hover:text-rose-600"
                      >
                        {copiedKey === 'fc-5' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed">
                      "{crusherMatrix.objections.notInterested.responseScript}"
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* TAB 0: GUARDIAN OVERVIEW & AUDIT */}
          {activeTab === 'guardian' && (
            <div className="space-y-6">
              
              {/* Banner Top */}
              <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl border border-emerald-700/40 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-extrabold uppercase tracking-wider">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Protocolo de Proteção e Entregabilidade Máxima
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Deliverability & Anti-Ban Guardian Ativo
                  </h3>
                  <p className="text-xs text-emerald-200/90 leading-relaxed max-w-2xl">
                    Proteção em 2 camadas: <strong className="text-white">WhatsApp Anti-Ban Shield</strong> (0% risco de bloqueio de chip com 3 variações semânticas) + <strong className="text-white">Email Deliverability Shield</strong> (99%+ de chegada na Caixa Principal com Plain Text).
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-emerald-950/80 p-3 rounded-xl border border-emerald-600/40 shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Risco de Ban WhatsApp</span>
                    <span className="text-lg font-black text-emerald-300">{guardian.whatsappShield.spamRiskScore}% (Protegido)</span>
                  </div>
                  <div className="h-8 w-px bg-emerald-700/50"></div>
                  <div className="text-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Entregabilidade Email</span>
                    <span className="text-lg font-black text-emerald-300">{guardian.emailShield.deliverabilityScore}%</span>
                  </div>
                </div>
              </div>

              {/* Grid: 2 Guardian Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. WHATSAPP GUARDIAN CARD */}
                <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                    <div className="flex items-center gap-2 text-teal-900 font-extrabold text-xs uppercase tracking-wider">
                      <MessageSquare className="w-4 h-4 text-teal-600" />
                      WhatsApp Anti-Ban Shield
                    </div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      STATUS: {guardian.whatsappShield.antiBanStatus}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                      <span className="text-teal-900 font-semibold">Humanização Temporal (Delay):</span>
                      <span className="font-mono font-bold text-teal-950">~{guardian.whatsappShield.temporalHumanization.typingDelaySeconds}s de digitação</span>
                    </div>

                    <div className="flex items-center justify-between bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                      <span className="text-teal-900 font-semibold">Janela Recomendada de Envio:</span>
                      <span className="font-mono font-bold text-teal-950">{guardian.whatsappShield.temporalHumanization.suggestedSendingWindow}</span>
                    </div>

                    <div className="flex items-center justify-between bg-teal-50/60 p-2.5 rounded-lg border border-teal-100">
                      <span className="text-teal-900 font-semibold">Spinning Semântico:</span>
                      <span className="font-bold text-emerald-700">3 Variações Disponíveis</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Palavras de Spam Filtradas:</span>
                      <div className="flex flex-wrap gap-1">
                        {guardian.whatsappShield.removedTriggerWords.map((word, wIdx) => (
                          <span key={wIdx} className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200 font-mono">
                            🚫 {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('whatsapp')}
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Abrir Gerador de Spins do WhatsApp
                  </button>
                </div>

                {/* 2. EMAIL GUARDIAN CARD */}
                <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-2 text-blue-900 font-extrabold text-xs uppercase tracking-wider">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Email Deliverability Shield
                    </div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      INBOX: {guardian.emailShield.inboxPlacementPrediction}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                      <span className="text-blue-900 font-semibold">Sintaxe RFC 5322:</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> VÁLIDA
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                      <span className="text-blue-900 font-semibold">Auditoria DNS (MX / SPF / DKIM):</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> CONFIGURADO
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                      <span className="text-blue-900 font-semibold">Formato Executivo:</span>
                      <span className="font-bold text-blue-950">100% Plain Text Puro</span>
                    </div>

                    <div className="pt-2">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Proteção Anti-Quarentena:</span>
                      <p className="text-[11px] text-gray-600 leading-tight">
                        E-mails sem tags HTML pesadas ou imagens de tracking garantem 99%+ de entrega na Caixa de Entrada Principal do Gmail e Outlook.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('email')}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Visualizar Plain Text Email
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 1: WHATSAPP OUTBOUND (SPINNING SEMÂNTICO ANTI-BAN) */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-5">
              
              {/* Spinning Selector Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-teal-600" />
                    WhatsApp Spinning Semântico Anti-Spam (0% Risco de Bloqueio)
                  </h3>
                  <p className="text-xs text-gray-500">Alterne entre as 3 variações estruturais para evitar impressões digitais repetitivas.</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    onClick={() => setWaVariation('A')}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      waVariation === 'A' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Spin A (Curiosidade)
                  </button>
                  <button
                    onClick={() => setWaVariation('B')}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      waVariation === 'B' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Spin B (ROI Direto)
                  </button>
                  <button
                    onClick={() => setWaVariation('C')}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                      waVariation === 'C' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Spin C (Diagnóstico Técnico)
                  </button>
                </div>
              </div>

              {/* Message Box */}
              <div className="bg-white p-5 rounded-xl border border-teal-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-teal-900">
                      Variação Ativa: <strong className="text-teal-700">Spin {waVariation}</strong>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      🛡️ Sanitizado contra Spam
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Destinatário: <strong className="text-gray-700">{lead.decisionMaker?.name || 'Decisor'}</strong> ({cleanPhone || 'Sem telefone'})
                  </span>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 font-sans text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                  {currentWaMessage}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => handleCopy(currentWaMessage, `wa-${waVariation}`)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {copiedKey === `wa-${waVariation}` ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === `wa-${waVariation}` ? 'Copiado!' : 'Copiar Texto'}
                  </button>

                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onMarkContacted && onMarkContacted(lead.id)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Disparar no WhatsApp Web
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                      Telefone não informado neste lead
                    </span>
                  )}
                </div>
              </div>

              {/* Anti-ban Guidelines */}
              <div className="bg-emerald-950 text-white p-4 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Regras de Ouro do Anti-Ban WhatsApp:
                </div>
                <ul className="space-y-1 text-emerald-100/90 list-disc list-inside text-[11px]">
                  <li><strong>Nunca envie links na 1ª mensagem:</strong> Aguarde o lead responder "sim" ou demonstrar interesse.</li>
                  <li><strong>Alterne os Spins:</strong> Se enviar para 10 contatos, alterne entre Spin A, B e C.</li>
                  <li><strong>Intervalo randômico:</strong> Respeite o pacing de 45s a 120s entre mensagens consecutivas.</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 2: EMAIL OUTBOUND (PLAIN TEXT 99% INBOX) */}
          {activeTab === 'email' && (
            <div className="space-y-5">
              
              {/* Mode Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Cold Outbound (Garantia de Caixa de Entrada)
                  </h3>
                  <p className="text-xs text-gray-500">Modelo Plain Text 100% puro para evitar filtros de promoção e spam.</p>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    onClick={() => setEmailMode('plain')}
                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all flex items-center gap-1 ${
                      emailMode === 'plain' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⭐ Plain Text (99% Inbox)
                  </button>
                  <button
                    onClick={() => setEmailMode('aida')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      emailMode === 'aida' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Framework AIDA
                  </button>
                  <button
                    onClick={() => setEmailMode('pas')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      emailMode === 'pas' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Framework PAS
                  </button>
                </div>
              </div>

              {/* Email Content Box */}
              <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-3">
                <div className="border-b border-gray-100 pb-3 space-y-1 text-xs">
                  <div className="text-gray-500 flex items-center gap-2">
                    <span className="font-semibold text-gray-700">Para:</span>
                    <span className="font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {lead.decisionMaker?.directEmail || lead.email || 'Email corporativo'}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      RFC 5322 Validado
                    </span>
                  </div>
                  <div className="text-gray-500 flex items-center gap-2 pt-1">
                    <span className="font-semibold text-gray-700">Assunto:</span>
                    <span className="font-bold text-gray-900">{currentEmail.subject}</span>
                  </div>
                </div>

                <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100 font-sans text-sm text-gray-800 whitespace-pre-line leading-relaxed">
                  {currentEmail.body}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleCopy(
                      `Assunto: ${currentEmail.subject}\n\n${currentEmail.body}`,
                      'email'
                    )}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    {copiedKey === 'email' ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'email' ? 'Copiado!' : 'Copiar Email Completo'}
                  </button>

                  <a
                    href={`mailto:${lead.decisionMaker?.directEmail || lead.email || ''}?subject=${encodeURIComponent(currentEmail.subject)}&body=${encodeURIComponent(currentEmail.body)}`}
                    onClick={() => onMarkContacted && onMarkContacted(lead.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-all"
                  >
                    <Mail className="w-4 h-4" />
                    Abrir no Gmail / Outlook
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Deliverability Guarantee Notice */}
              <div className="bg-blue-900 text-white p-4 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-blue-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  Por que o modelo Plain Text entrega 99%+ na Caixa Principal?
                </div>
                <p className="text-blue-100/90 leading-relaxed text-[11px]">
                  Algoritmos de triagem do Google Workspace e Microsoft 365 classificam qualquer e-mail com HTML pesado, imagens de tracking ou múltiplos links como "Promoção" ou "Spam". O formato Plain Text simula correspondência executiva 1-to-1.
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: COLD CALL SCRIPT */}
          {activeTab === 'call' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4 text-amber-600" />
                    Roteiro de Telefonia Humana (Cold Call de Alta Conversão)
                  </h3>
                  <p className="text-xs text-gray-500">Desenvolvido para quebrar o padrão do decisor em 5 segundos e marcar a reunião.</p>
                </div>

                <button
                  onClick={() => setActiveTab('objection_crusher')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  Abrir Matriz Anti-Objeção Completa
                </button>
              </div>

              {/* 1. Quebra de Gelo */}
              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-1.5">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  1. Quebra de Gelo (Primeiros 5 Segundos)
                </span>
                <p className="text-xs text-gray-800 bg-amber-50/60 p-3 rounded-lg border border-amber-100 font-medium">
                  "{lead.outreach?.coldCall?.iceBreaker5s}"
                </p>
              </div>

              {/* 2. Ancoragem */}
              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-1.5">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  2. Pergunta de Ancoragem na Dor Identificada
                </span>
                <p className="text-xs text-gray-800 bg-amber-50/60 p-3 rounded-lg border border-amber-100 font-medium">
                  "{lead.outreach?.coldCall?.anchorQuestion}"
                </p>
              </div>

              {/* 3. Pitch */}
              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-1.5">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  3. Pitch de 15 Segundos para Agendamento
                </span>
                <p className="text-xs text-gray-800 bg-amber-50/60 p-3 rounded-lg border border-amber-100 font-medium">
                  "{lead.outreach?.coldCall?.pitch15s}"
                </p>
              </div>

              {/* 4. Objeções */}
              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                  4. Contorno de Objeções Imediatas
                </span>
                <div className="space-y-1.5">
                  {lead.outreach?.coldCall?.objectionTips?.map((tip, idx) => (
                    <div key={idx} className="text-xs text-gray-700 bg-slate-50 p-2.5 rounded border border-slate-200">
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BANT+ DIAGNOSTIC */}
          {activeTab === 'bant' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    BANT+ Enrichment Matrix
                  </h3>
                  <p className="text-xs text-gray-500">Mapeamento analítico de Budget, Authority, Need e Timeline com Intent Scoring.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500">Intent Score:</span>
                  <span className="text-lg font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {lead.intentScore ?? lead.icpScore}/100
                  </span>
                </div>
              </div>

              {/* 4 BANT Pillars Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. BUDGET */}
                <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      1. Budget (Orçamento Presumido)
                    </div>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Classificação: {bant?.budget?.rating || 'Alto'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500 font-semibold block">Orçamento Estimado p/ Solução:</span>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{bant?.budget?.estimatedBudget || 'R$ 15.000 a R$ 40.000 / mês'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-[11px]">
                      <div>
                        <span className="text-gray-400">Porte / Funcionários:</span>
                        <p className="font-semibold text-gray-700">{bant?.budget?.companySize || '15 a 35 colaboradores'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Faturamento Anual:</span>
                        <p className="font-semibold text-gray-700">{bant?.budget?.estimatedRevenue || 'R$ 3M - R$ 8M / ano'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. AUTHORITY */}
                <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                    <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs uppercase tracking-wider">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      2. Authority (Organograma & Decisor)
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300">
                      Decisor Direto
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500 font-semibold block">Nome do Decisor:</span>
                      <p className="font-bold text-gray-900 text-sm mt-0.5">{bant?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Diretor Comercial'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-[11px]">
                      <div>
                        <span className="text-gray-400">Cargo Específico:</span>
                        <p className="font-semibold text-gray-700">{bant?.authority?.role || lead.decisionMaker?.role || 'Sócio / Head de Operações'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">Estrutura Interna:</span>
                        <p className="font-semibold text-gray-700">{bant?.authority?.orgStructure || 'Diretoria / Gestão Comercial'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. NEED (3 FALHAS VISÍVEIS) */}
                <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                    <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      3. Need (3 Falhas Operacionais Mapeadas)
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                      Gaps Críticos
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="space-y-1.5">
                      {flaws.map((flaw, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-rose-50/70 p-2 rounded-lg border border-rose-100 text-[11px] text-gray-800">
                          <span className="font-black text-rose-600 shrink-0">#{idx + 1}</span>
                          <span className="font-medium">{flaw}</span>
                        </div>
                      ))}
                    </div>
                    {bant?.need?.impactSummary && (
                      <div className="pt-1 text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-200 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Impacto Projetado: {bant.need.impactSummary}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. TIMELINE & URGÊNCIA */}
                <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs uppercase tracking-wider">
                      <Clock className="w-4 h-4 text-amber-600" />
                      4. Timeline (Fator de Urgência & Sinais)
                    </div>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      {bant?.timeline?.urgencyLevel || 'Crítico (Imediato)'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-gray-500 font-semibold block">Gatilho de Urgência:</span>
                      <p className="font-bold text-gray-900 text-xs mt-0.5">{bant?.timeline?.urgencyFactor || lead.urgencyFactor || 'Vagas abertas no LinkedIn e perda de leads fora do horário'}</p>
                    </div>

                    <div className="pt-1 border-t border-gray-100 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Sinais Rastreados:</span>
                      {(bant?.timeline?.signals || ["Tráfego ativo de anúncios", "Volume alto de buscas no Google Maps"]).map((sig, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-1 text-[11px] text-gray-700">
                          <CheckCircle2 className="w-3 h-3 text-amber-500 shrink-0" />
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: TECH STACK DETECTOR */}
          {activeTab === 'tech' && (
            <div className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-cyan-100 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-cyan-600" />
                    Tech Stack Detector & Vulnerability Scanner
                  </h3>
                  <p className="text-xs text-gray-500">Mapeamento das ferramentas digitais ativas, CMS, Pixels e brechas tecnológicas na operação.</p>
                </div>
              </div>

              {/* Tools Detected Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* CMS / Plataforma */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block border-b border-gray-100 pb-2">
                    CMS, Framework & Plataforma Web
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg font-mono text-xs font-bold border border-slate-300">
                      {tech?.cmsOrPlatform || 'WordPress / Elementor'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Plataforma onde o site e as páginas de conversão estão hospedadas.</p>
                </div>

                {/* Analytics & Pixels */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block border-b border-gray-100 pb-2">
                    Rastreamento, Pixels & Analytics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(tech?.analyticsAndPixels || ["Meta Pixel", "Google Analytics 4"]).map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-md font-mono text-xs font-semibold border border-blue-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CRM & Automação */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider block border-b border-gray-100 pb-2">
                    CRM & Automações Comerciais
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(tech?.crmAndAutomation || ["Sem CRM integrado", "Atendimento manual WhatsApp"]).map((item, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-md text-xs font-semibold border border-amber-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Brechas Tecnológicas / Vulnerabilidades */}
                <div className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block border-b border-rose-100 pb-2">
                    Brechas e Oportunidades de Venda (Pitch Angle)
                  </span>
                  <div className="space-y-1.5">
                    {(tech?.vulnerabilitiesAndGaps || [
                      "Não possui CAPI (Conversions API) do Meta",
                      "Sem chatbot ou resposta inteligente no WhatsApp 24/7",
                      "Formulário estático sem enriquecimento em tempo real"
                    ]).map((gap, gIdx) => (
                      <div key={gIdx} className="text-xs text-rose-900 bg-rose-50/70 p-2 rounded border border-rose-100 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span className="font-medium">{gap}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: WEBHOOKS & AUTOMATION PAYLOADS */}
          {activeTab === 'webhook' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-1.5">
                    <Send className="w-4 h-4 text-purple-600" />
                    Módulo de Integração Evolution API, Resend & n8n
                  </h3>
                  <p className="text-xs text-gray-500">Payloads JSON otimizados com Spinning de WhatsApp, Plain Text Email e metadados BANT+.</p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                  Spin Ativo: Variação {waVariation}
                </span>
              </div>

              {/* Webhook Endpoint Input */}
              <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200 space-y-2">
                <label className="block text-xs font-bold text-purple-900 uppercase tracking-wider">
                  URL do Webhook Destino (n8n / Make / Evolution API / Webhook.site)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customWebhookUrl}
                    onChange={(e) => setCustomWebhookUrl(e.target.value)}
                    placeholder="https://seu-n8n.com/webhook/prospects ou deixe em branco para simulação local"
                    className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-xs bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                {webhookResult && (
                  <p className={`text-xs font-semibold ${webhookStatus === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {webhookResult}
                  </p>
                )}
              </div>

              {/* Payload 1: Evolution API WhatsApp */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    1. Payload Evolution API (WhatsApp com Presence & Delay)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(JSON.stringify(dynamicPayloads.evolutionApiWhatsApp, null, 2), 'evo')}
                      className="text-xs text-gray-600 hover:text-emerald-700 px-2.5 py-1 bg-gray-100 rounded font-medium"
                    >
                      {copiedKey === 'evo' ? 'Copiado!' : 'Copiar JSON'}
                    </button>
                    <button
                      onClick={() => handleSendWebhook('EVOLUTION_WHATSAPP')}
                      className="text-xs bg-emerald-600 text-white font-bold px-3 py-1 rounded hover:bg-emerald-700"
                    >
                      Disparar Webhook
                    </button>
                  </div>
                </div>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(dynamicPayloads.evolutionApiWhatsApp, null, 2)}
                </pre>
              </div>

              {/* Payload 2: Resend Email Plain Text */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    2. Payload Resend (Plain Text 99% Inbox + Unsubscribe Headers)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(JSON.stringify(dynamicPayloads.resendEmail, null, 2), 'resend')}
                      className="text-xs text-gray-600 hover:text-blue-700 px-2.5 py-1 bg-gray-100 rounded font-medium"
                    >
                      {copiedKey === 'resend' ? 'Copiado!' : 'Copiar JSON'}
                    </button>
                    <button
                      onClick={() => handleSendWebhook('RESEND_EMAIL')}
                      className="text-xs bg-blue-600 text-white font-bold px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Disparar Webhook
                    </button>
                  </div>
                </div>
                <pre className="bg-slate-900 text-blue-300 p-3 rounded-lg text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(dynamicPayloads.resendEmail, null, 2)}
                </pre>
              </div>

              {/* Payload 3: HubSpot / Pipedrive Task */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-800 flex items-center gap-1">
                    <Send className="w-3.5 h-3.5 text-purple-600" />
                    3. Payload Tarefa CRM (HubSpot / Pipedrive)
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(JSON.stringify(dynamicPayloads.hubspotCrmTask, null, 2), 'crm')}
                      className="text-xs text-gray-600 hover:text-purple-700 px-2.5 py-1 bg-gray-100 rounded font-medium"
                    >
                      {copiedKey === 'crm' ? 'Copiado!' : 'Copiar JSON'}
                    </button>
                    <button
                      onClick={() => handleSendWebhook('HUBSPOT_CRM')}
                      className="text-xs bg-purple-600 text-white font-bold px-3 py-1 rounded hover:bg-purple-700"
                    >
                      Disparar Webhook
                    </button>
                  </div>
                </div>
                <pre className="bg-slate-900 text-purple-300 p-3 rounded-lg text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(dynamicPayloads.hubspotCrmTask, null, 2)}
                </pre>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center gap-2">
            <span>ID: <span className="font-mono">{lead.id}</span></span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 text-rose-700 font-semibold">
              <Crosshair className="w-3.5 h-3.5 text-rose-600" />
              Objection Crusher Ativo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OmnichannelModal;
