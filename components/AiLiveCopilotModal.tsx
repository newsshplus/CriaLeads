import React, { useState, useEffect, useRef } from 'react';
import { Lead, BusinessProfile, AiLiveCopilotAnalysis, LiveConversationTurn } from '../types';
import { 
  X, Mic, MicOff, Send, Sparkles, PhoneCall, MessageSquare, 
  Volume2, VolumeX, Copy, Check, Zap, AlertTriangle, ShieldCheck, 
  Flame, TrendingUp, Calendar, ArrowRight, Play, RefreshCw, Layers,
  ScreenShare, Video
} from 'lucide-react';
import { analyzeLiveConversationTurn, QUICK_AUDIO_SCENARIOS } from '../services/liveCopilotService';
import { sendLiveCallAnalysisToPitroCrm, getPitroCrmConfig } from '../services/pitroCrmService';
import { getSavedCountry, getCurrencyConfig } from '../services/countryService';

interface AiLiveCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  businessProfile?: BusinessProfile | null;
  onLeadUpdated?: (lead: Lead) => void;
}

export const AiLiveCopilotModal: React.FC<AiLiveCopilotModalProps> = ({
  isOpen,
  onClose,
  lead,
  businessProfile,
  onLeadUpdated
}) => {
  const [inputText, setInputText] = useState('');
  const [activeChannel, setActiveChannel] = useState<'audio_call' | 'whatsapp_audio' | 'whatsapp_text' | 'video_call'>('audio_call');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  
  // Realtime Analysis State
  const [currentAnalysis, setCurrentAnalysis] = useState<AiLiveCopilotAnalysis | null>(null);
  const [turnsHistory, setTurnsHistory] = useState<LiveConversationTurn[]>([]);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  // Mic & Screen Permission State (prospecção por chamada, áudio ou vídeo)
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [screenPermission, setScreenPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [permissionBusy, setPermissionBusy] = useState<'none' | 'mic' | 'screen'>('none');
  const micStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // País selecionado -> idioma de voz do copiloto (pt-PT, pt-BR, en-US, es-ES...)
  const speechLang = getCurrencyConfig(getSavedCountry()).speechLang;

  // Initialize or reset analysis on lead change or open
  useEffect(() => {
    if (isOpen && lead) {
      // Run initial default analysis with the lead's main pain point
      const initialPrompt = `Olá, estou falando com o ${lead.decisionMaker?.name || 'responsável'} da ${lead.name}. Identificamos que a empresa pode estar sofrendo com ${lead.identifiedPain}.`;
      setInputText('');
      setSyncStatus('idle');
      handleAnalyzeText(initialPrompt, false);
    }
  }, [isOpen, lead]);

  // Clean up speech recognition & media streams on close
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(t => t.stop());
        micStreamRef.current = null;
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setMicPermission('unknown');
      setScreenPermission('unknown');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechLang;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsListening(false);
      return;
    }

    // Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz em tempo real. Você pode digitar ou colar a fala do cliente na caixa de texto.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = speechLang;
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
        
        // If final result, trigger real-time AI response
        const isFinal = event.results[event.results.length - 1].isFinal;
        if (isFinal && transcript.trim().length > 5) {
          handleAnalyzeText(transcript, true);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Speech recognition startup error:", e);
      setIsListening(false);
    }
  };

  // Permissão explícita de microfone (obrigatória em chamadas/áudio/vídeo)
  const handleRequestMicPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicPermission('denied');
      alert("Seu navegador/ambiente não oferece acesso a microfone (getUserMedia). Use a digitação ou cole o áudio transcrito.");
      return;
    }
    setPermissionBusy('mic');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Mantém o stream ativo para o copiloto; libera as trilhas apenas ao fechar o modal
      if (micStreamRef.current) micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = stream;
      setMicPermission('granted');
    } catch (e: any) {
      console.warn("Microfone negado:", e?.name || e);
      setMicPermission('denied');
      if (e?.name === 'NotAllowedError') {
        alert("Permissão de microfone negada. Para o AI Live Copilot ajudar em chamadas/áudio, autorize o microfone nas configurações do navegador (ou no AI Studio).");
      }
    } finally {
      setPermissionBusy('none');
    }
  };

  // Permissão explícita de tela (prospecção por vídeo: copiloto lê a tela em tempo real)
  const handleRequestScreenPermission = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setScreenPermission('denied');
      alert("Seu navegador/ambiente não oferece compartilhamento de tela (getDisplayMedia).");
      return;
    }
    setPermissionBusy('screen');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = stream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (screenStreamRef.current === stream) screenStreamRef.current = null;
          setScreenPermission('unknown');
        };
      }
      setScreenPermission('granted');
    } catch (e: any) {
      console.warn("Compartilhamento de tela cancelado:", e?.name || e);
      setScreenPermission(e?.name === 'NotAllowedError' ? 'denied' : 'unknown');
    } finally {
      setPermissionBusy('none');
    }
  };

  const handleAnalyzeText = async (textToAnalyze: string, addToHistory: boolean = true) => {
    if (!textToAnalyze.trim()) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeLiveConversationTurn(
        textToAnalyze,
        lead,
        businessProfile,
        activeChannel
      );

      setCurrentAnalysis(analysis);

      if (addToHistory) {
        const newTurn: LiveConversationTurn = {
          id: `turn-${Date.now()}`,
          sender: 'lead',
          channel: activeChannel,
          text: textToAnalyze,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sentiment: analysis.sentiment,
          objectionDetected: analysis.detectedIntent
        };
        setTurnsHistory(prev => [newTurn, ...prev]);
      }
    } catch (error) {
      console.error("Error analyzing live conversation:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectScenario = (scenario: typeof QUICK_AUDIO_SCENARIOS[0]) => {
    setInputText(scenario.transcript);
    handleAnalyzeText(scenario.transcript, true);
  };

  const handleSyncToPitroCrm = async () => {
    if (!currentAnalysis) return;

    setSyncStatus('syncing');
    setSyncMessage('Enviando análise em tempo real para o Pitro CRM...');

    try {
      const result = await sendLiveCallAnalysisToPitroCrm(
        lead,
        currentAnalysis,
        inputText || 'Análise de conversação em tempo real'
      );

      if (result.success) {
        setSyncStatus('success');
        setSyncMessage(result.message);
      } else {
        setSyncStatus('error');
        setSyncMessage(result.message);
      }
    } catch (e: any) {
      setSyncStatus('error');
      setSyncMessage(e.message || 'Erro ao sincronizar com Pitro CRM');
    }
  };

  const config = getPitroCrmConfig();
  const cleanPhone = lead?.phone ? lead.phone.replace(/\D/g, '') : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-5 border-b border-indigo-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  AI Live Copilot & Audio Analyzer
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Tempo Real Ativo
                </span>
              </div>
              <p className="text-xs text-indigo-200/80">
                Acompanhamento inteligente de ligações e áudios de WhatsApp com respostas imediatas de alta conversão.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lead Context Bar */}
        {lead && (
          <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-indigo-950 text-sm">{lead.name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">Decisor: <strong>{lead.decisionMaker?.name || 'Diretoria'}</strong></span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">Dor Detectada: <strong>{lead.identifiedPain}</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-600 text-white font-bold rounded text-[11px]">
                ICP {lead.icpTier.replace('SCORE_', '')} ({lead.icpScore}%)
              </span>
              <span className={`px-2 py-0.5 font-bold rounded text-[11px] ${
                lead.intentPriority === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
              }`}>
                Prioridade {lead.intentPriority}
              </span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">

          {/* 0. Mic & Screen Permissions (Chamada / Áudio / Vídeo) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <Mic className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    Permissões de Microfone & Tela (Chamada, Áudio ou Vídeo)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Conceda o acesso para o copiloto escutar a chamada e ler a tela durante a prospecção ao vivo.
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                Idioma de voz: {speechLang} ({getSavedCountry()})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Microphone */}
              <button
                id="btn-copilot-perm-mic"
                onClick={handleRequestMicPermission}
                disabled={permissionBusy !== 'none'}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                  micPermission === 'granted'
                    ? 'bg-emerald-50 border-emerald-400'
                    : micPermission === 'denied'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <span className={`p-2 rounded-lg ${micPermission === 'granted' ? 'bg-emerald-100 text-emerald-700' : micPermission === 'denied' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {micPermission === 'granted' ? <Check className="w-4 h-4" /> : micPermission === 'denied' ? <AlertTriangle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-black text-slate-900">🎙️ Microfone</span>
                  <span className="block text-[11px] text-slate-500">
                    {micPermission === 'granted' ? 'Acesso concedido — pronto para escutar a chamada/áudio.' : micPermission === 'denied' ? 'Negado. Autorize nas configurações do navegador/AI Studio.' : 'Permitir acesso ao microfone da chamada.'}
                  </span>
                </span>
                {permissionBusy === 'mic' && <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />}
              </button>

              {/* Screen */}
              <button
                id="btn-copilot-perm-screen"
                onClick={handleRequestScreenPermission}
                disabled={permissionBusy !== 'none'}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                  screenPermission === 'granted'
                    ? 'bg-emerald-50 border-emerald-400'
                    : screenPermission === 'denied'
                      ? 'bg-rose-50 border-rose-300'
                      : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <span className={`p-2 rounded-lg ${screenPermission === 'granted' ? 'bg-emerald-100 text-emerald-700' : screenPermission === 'denied' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {screenPermission === 'granted' ? <Check className="w-4 h-4" /> : screenPermission === 'denied' ? <AlertTriangle className="w-4 h-4" /> : <ScreenShare className="w-4 h-4" />}
                </span>
                <span className="flex-1">
                  <span className="block text-xs font-black text-slate-900">🖥️ Ler a Tela (Vídeo/Call)</span>
                  <span className="block text-[11px] text-slate-500">
                    {screenPermission === 'granted' ? 'Tela compartilhada — copiloto pode ler a tela ao vivo.' : screenPermission === 'denied' ? 'Negado. Autorize o compartilhamento de tela.' : 'Compartilhar tela para análise durante vídeo.'}
                  </span>
                </span>
                {permissionBusy === 'screen' && <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />}
              </button>
            </div>

            <div className="text-[11px] text-slate-500 leading-relaxed bg-amber-50/60 border border-amber-200 rounded-lg p-2.5">
              <strong className="text-amber-800">🔒 Privacidade:</strong> o acesso é solicitado apenas quando você abre o Copiloto e é usado exclusivamente durante a ligação/áudio/vídeo. Nada é gravado — tudo é analisado em tempo real e encerrado ao fechar o Copiloto.
            </div>
          </div>

          {/* Audio Input & Speech Recognition Section */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-indigo-600" />
                  1. Escuta em Tempo Real ou Entrada de Áudio / Texto
                </span>
              </div>

              {/* Channel Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveChannel('audio_call')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    activeChannel === 'audio_call' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  Ligação Telefônica
                </button>
                <button
                  onClick={() => setActiveChannel('whatsapp_audio')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    activeChannel === 'whatsapp_audio' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Áudio WhatsApp
                </button>
                <button
                  onClick={() => setActiveChannel('whatsapp_text')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    activeChannel === 'whatsapp_text' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Texto WhatsApp
                </button>
                <button
                  onClick={() => {
                    setActiveChannel('video_call');
                    handleRequestScreenPermission();
                    handleRequestMicPermission();
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                    activeChannel === 'video_call' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  Vídeo Call
                </button>
              </div>
            </div>

            {/* Input Box with Mic & Action Button */}
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Fale no microfone ou digite/cole o que o cliente disse (Ex: 'Achei o preço muito alto', 'Já tenho outra agência', 'Manda por e-mail')..."
                className="w-full h-24 p-3.5 pr-28 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
              />

              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {/* Microphone Toggle Button */}
                <button
                  id="btn-copilot-mic"
                  onClick={handleToggleSpeechRecognition}
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md ${
                    isListening 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={isListening ? "Parar escuta de áudio" : "Iniciar escuta pelo microfone da chamada"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span className="text-[11px] font-bold pr-1">
                    {isListening ? 'Ouvindo...' : 'Ouvir Mic'}
                  </span>
                </button>

                {/* Analyze Button */}
                <button
                  id="btn-copilot-analyze"
                  onClick={() => handleAnalyzeText(inputText, true)}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span className="hidden sm:inline">Analisar</span>
                </button>
              </div>
            </div>

            {/* Quick Test Scenarios Bar */}
            <div>
              <span className="text-[10px] uppercase font-black text-slate-400 block mb-1.5">
                Simulações Rápidas de Objeções Comuns:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {QUICK_AUDIO_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => handleSelectScenario(sc)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 text-indigo-500" />
                    <span>{sc.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* AI Realtime Analysis & Decision Engine Panel */}
          {currentAnalysis && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Gauges & Telemetry Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* 1. Sentiment Gauge */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                    currentAnalysis.sentiment === 'interessado' || currentAnalysis.sentiment === 'positivo'
                      ? 'bg-emerald-100 text-emerald-700'
                      : currentAnalysis.sentiment === 'cético'
                        ? 'bg-amber-100 text-amber-700'
                        : currentAnalysis.sentiment === 'hostil'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-slate-100 text-slate-700'
                  }`}>
                    {currentAnalysis.sentiment === 'interessado' ? '🔥' : 
                     currentAnalysis.sentiment === 'positivo' ? '✨' : 
                     currentAnalysis.sentiment === 'cético' ? '🤨' : 
                     currentAnalysis.sentiment === 'hostil' ? '🛑' : '💬'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Sentimento / Humor</span>
                    <strong className="text-xs font-black text-slate-900 uppercase">
                      {currentAnalysis.sentiment} ({currentAnalysis.sentimentConfidence}%)
                    </strong>
                  </div>
                </div>

                {/* 2. Buying Signal Temperature Gauge */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sinal de Compra</span>
                      <strong className="text-xs font-black text-orange-600">{currentAnalysis.buyingSignalScore}%</strong>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          currentAnalysis.buyingSignalScore >= 80 ? 'bg-emerald-500' :
                          currentAnalysis.buyingSignalScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${currentAnalysis.buyingSignalScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Detected Objection Intent */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Objeção / Intenção</span>
                    <strong className="text-xs font-black text-slate-900 line-clamp-1">
                      {currentAnalysis.detectedIntent}
                    </strong>
                  </div>
                </div>

                {/* 4. Psychological Trigger */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Gatilho Persuasivo</span>
                    <strong className="text-xs font-black text-purple-900 line-clamp-1">
                      {currentAnalysis.keyPsychologicalTrigger}
                    </strong>
                  </div>
                </div>

              </div>

              {/* ACTIONABLE AI SCRIPTS (WHAT TO SAY ON THE PHONE & WHAT TO SEND ON WHATSAPP) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* 1. Live Verbal Rebuttal (Fala Imediata na Ligação) */}
                <div className="bg-white rounded-xl border-2 border-indigo-500/40 p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                          <PhoneCall className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase">
                            O que Falar na Chamada Agora (Script Verbal)
                          </h4>
                          <span className="text-[10px] text-indigo-600 font-semibold">2 a 3 frases com tom empático e assertivo</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSpeak(currentAnalysis.liveRebuttalScript)}
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            isSpeaking ? 'bg-rose-100 text-rose-700 border-rose-300' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={isSpeaking ? "Parar áudio" : "Ouvir o script com voz natural"}
                        >
                          {isSpeaking ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={() => handleCopy(currentAnalysis.liveRebuttalScript, 'live-rebuttal')}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          {copiedKey === 'live-rebuttal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'live-rebuttal' ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs font-medium text-slate-900 leading-relaxed italic">
                      "{currentAnalysis.liveRebuttalScript}"
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>💡 <strong>Dica de Postura:</strong> Não confronte a objeção, acolha e direcione para o benefício.</span>
                  </div>
                </div>

                {/* 2. WhatsApp Quick Response (Mensagem Pronta) */}
                <div className="bg-white rounded-xl border-2 border-emerald-500/40 p-5 shadow-sm space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                          <MessageSquare className="w-4 h-4" />
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase">
                            Resposta Rápida para WhatsApp (Texto Formatado)
                          </h4>
                          <span className="text-[10px] text-emerald-600 font-semibold">Baixa fricção e quebra de objeção</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(currentAnalysis.whatsappQuickResponse)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Enviar Whats</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleCopy(currentAnalysis.whatsappQuickResponse, 'wa-quick')}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          {copiedKey === 'wa-quick' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'wa-quick' ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs font-medium text-slate-900 leading-relaxed whitespace-pre-wrap">
                      {currentAnalysis.whatsappQuickResponse}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>⚡ <strong>CTA:</strong> Pergunta binária simples para aumentar taxa de resposta.</span>
                  </div>
                </div>

              </div>

              {/* Next Best Action & Closing Slots */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 uppercase">
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                    Próxima Melhor Ação Recomendada:
                  </div>
                  <p className="text-xs font-bold text-indigo-950 max-w-xl">
                    {currentAnalysis.nextBestAction}
                  </p>
                  
                  {/* Suggested times */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-slate-400">Sugestões de Horários Rápidos:</span>
                    {currentAnalysis.suggestedMeetingTimes.map((time, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleCopy(`Podemos conversar ${time.toLowerCase()}?`, `time-${idx}`)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[11px] font-medium border border-slate-200"
                        title="Clique para copiar este horário"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Sync to Pitro CRM Button */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <button
                    id="btn-sync-copilot-pitro"
                    onClick={handleSyncToPitroCrm}
                    disabled={syncStatus === 'syncing'}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center gap-2"
                  >
                    {syncStatus === 'syncing' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-300" />
                    )}
                    <span>Salvar Análise no Pitro CRM</span>
                  </button>

                  {syncStatus === 'success' && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Análise sincronizada com sucesso!
                    </span>
                  )}
                  {syncStatus === 'error' && (
                    <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> {syncMessage}
                    </span>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Pitro CRM Webhook Endpoint: <strong className="text-slate-800">{config.webhookUrl}</strong></span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
          >
            Fechar Copiloto
          </button>
        </div>

      </div>
    </div>
  );
};

export default AiLiveCopilotModal;

