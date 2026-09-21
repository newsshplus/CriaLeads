import React, { useState, useEffect, useRef } from 'react';
import { Lead } from '../types';
import { 
  PhoneCall, 
  X, 
  Sparkles, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  Check, 
  Copy, 
  MessageSquare, 
  ExternalLink, 
  ChevronRight, 
  Flame, 
  Zap, 
  AlertTriangle, 
  User, 
  Building2, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight,
  Send,
  HelpCircle,
  Volume2
} from 'lucide-react';
import { executeAiCompletion } from '../services/aiProviderService';
import { 
  generateDeterministicNicheOutreach, 
  generateLiveAiNicheOutreach, 
  RealtimeSdrOutreach 
} from '../services/realtimeSdrAiOutreachService';

interface ColdCallHunterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  selectedLead?: Lead | null;
  onUpdateStatus?: (leadId: string, status: Lead['status']) => void;
  onMarkContacted?: (leadId: string) => void;
  onSaveNotes?: (leadId: string, notes: string) => void;
}

export const ColdCallHunterModal: React.FC<ColdCallHunterModalProps> = ({
  isOpen,
  onClose,
  lead: leadProp,
  selectedLead: selectedLeadProp,
  onUpdateStatus,
  onMarkContacted,
  onSaveNotes
}) => {
  const lead = leadProp || selectedLeadProp;
  if (!isOpen || !lead) return null;

  const isRealEstate = lead.isRealEstate || lead.category?.toLowerCase().includes('imóve') || lead.category?.toLowerCase().includes('proprietário');
  const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || (isRealEstate ? 'Carlos Silva' : 'Dr. Carlos Silveira');
  const decisorRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || (isRealEstate ? 'Proprietário Direto' : 'Sócio-Diretor');
  const phone = lead.decisionMaker?.directPhone || lead.phone || '+351912345678';
  const cleanPhone = phone.replace(/\D/g, '');
  const priceFormatted = lead.estimatedRevenue || '245.000 €';
  const district = lead.district || lead.city || 'Parque das Nações';
  const city = lead.city || 'Lisboa';
  const daysOnMarket = lead.daysOnMarket || 48;
  const priceDrop = lead.priceDropValue || '15.000 €';

  // Stopwatch state (30 seconds)
  const [seconds, setSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // B2B Stage switcher: 1 = Gatekeeper / Secretária, 2 = Decisor
  const [b2bStage, setB2bStage] = useState<1 | 2>(1);

  // Active Objection Tab
  const [activeObjection, setActiveObjection] = useState<string>('obj1');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customObjectionInput, setCustomObjectionInput] = useState<string>('');
  const [customRebuttal, setCustomRebuttal] = useState<string | null>(null);
  const [isLoadingAiRebuttal, setIsLoadingAiRebuttal] = useState<boolean>(false);
  const [callNotes, setCallNotes] = useState<string>(lead.notes || '');

  // Real-time zero-cliché outreach state
  const [liveOutreach, setLiveOutreach] = useState<RealtimeSdrOutreach>(() => 
    lead.realtimeSdrOutreach || generateDeterministicNicheOutreach(lead)
  );
  const [isGeneratingAiOutreach, setIsGeneratingAiOutreach] = useState<boolean>(false);

  useEffect(() => {
    setSeconds(0);
    setIsTimerRunning(false);
    setB2bStage(1);
    setActiveObjection('obj1');
    setCustomRebuttal(null);
    setCustomObjectionInput('');
    setCallNotes(lead.notes || '');
    setLiveOutreach(lead.realtimeSdrOutreach || generateDeterministicNicheOutreach(lead));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [lead.id]);

  const handleRegenerateWithAi = async () => {
    setIsGeneratingAiOutreach(true);
    try {
      const generated = await generateLiveAiNicheOutreach(lead, 'GAP_TRIGGER');
      setLiveOutreach(generated);
    } catch (e) {
      console.error("Erro ao gerar abordagem IA:", e);
    } finally {
      setIsGeneratingAiOutreach(false);
    }
  };

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => {
          if (prev >= 30) {
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => {
    setIsTimerRunning(false);
    setSeconds(0);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Determine current active speaking phase
  const getActivePhase = () => {
    if (seconds <= 6) return { phase: 1, label: 'Fase 1: Abertura de Autoridade (00-06s)', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    if (seconds <= 16) return { phase: 2, label: 'Fase 2: Ancoragem de Comprador / GAP (06-16s)', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (seconds <= 24) return { phase: 3, label: 'Fase 3: Fechamento Alternativo de Agenda (16-24s)', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    return { phase: 4, label: 'Fase 4: Confirmação & Alinhamento (24-30s)', color: 'text-purple-600 bg-purple-50 border-purple-200' };
  };

  const currentPhase = getActivePhase();

  // Custom AI Rebuttal Generator with Groq sub-300ms
  const handleGenerateAiRebuttal = async () => {
    if (!customObjectionInput.trim()) return;
    setIsLoadingAiRebuttal(true);
    try {
      const response = await executeAiCompletion({
        systemInstruction: "Você é um mestre em quebra de objeções em cold call. Gere uma resposta cirúrgica de no máximo 2 frases para o SDR falar imediatamente.",
        userPrompt: `O prospecto (${decisorName}, ${lead.name}) acabou de dizer a seguinte objeção ao telefone: "${customObjectionInput}". O que o SDR deve responder agora para manter o controle e agendar a reunião/visita?`,
        temperature: 0.2
      });
      setCustomRebuttal(response.trim());
    } catch {
      setCustomRebuttal(`Compreendo perfeitamente a sua posição, ${decisorName}. Não pretendemos tomar o seu tempo — apenas validar em 3 minutos se o nosso comprador qualificado pode avançar com a proposta.`);
    } finally {
      setIsLoadingAiRebuttal(false);
    }
  };

  // Quick Outcome Handlers
  const handleRecordOutcome = (outcome: 'MEETING_BOOKED' | 'WHATSAPP_PROPOSAL' | 'RESCHEDULE' | 'REJECTED') => {
    let status: Lead['status'] = 'contacted';
    let noteText = '';

    if (outcome === 'MEETING_BOOKED') {
      status = 'qualified';
      noteText = `[COLD CALL - SUCESSO] Agendou reunião/visita presencial com ${decisorName}.`;
    } else if (outcome === 'WHATSAPP_PROPOSAL') {
      status = 'contacted';
      noteText = `[COLD CALL] Solicitou envio de proposta resumida no WhatsApp.`;
      if (cleanPhone) {
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Olá ${decisorName}, conforme combinamos na nossa ligação, envio aqui o resumo para alinharmos os próximos passos.`)}`, '_blank');
      }
    } else if (outcome === 'RESCHEDULE') {
      status = 'contacted';
      noteText = `[COLD CALL] Não atendeu ou pediu para ligar mais tarde.`;
    } else {
      status = 'ignored';
      noteText = `[COLD CALL] Lead recusou ou demonstrou desinteresse total.`;
    }

    if (onUpdateStatus) {
      onUpdateStatus(lead.id, status);
    }
    if (onMarkContacted) {
      onMarkContacted(lead.id);
    }
    if (onSaveNotes) {
      onSaveNotes(lead.id, `${callNotes}\n${new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}: ${noteText}`);
    }
    onClose();
  };

  // FSBO Objections
  const fsboObjections = [
    {
      id: 'obj1',
      title: '🚫 "Não quero imobiliárias!"',
      script: `Compreendo perfeitamente, ${decisorName}. Eu também não quero angariar o seu imóvel para o deixar anunciado na internet. Eu tenho o cliente comprador pronto com carta de crédito aprovada. Se ele pagar o seu valor limpo de ${priceFormatted}, você recusa a venda? Posso levar o cliente amanhã às 14h?`,
      psychology: 'Retira a postura de corretor tradicional e foca exclusivamente no comprador com dinheiro pronto.'
    },
    {
      id: 'obj2',
      title: '💸 "Não pago comissão!"',
      script: `Sem problema nenhum, ${decisorName}. O valor que o senhor quer no bolso são os ${priceFormatted} líquidos, correto? O nosso acordo de honorários é tratado diretamente com a carteira do comprador. O que importa é você receber exatamente o seu valor anunciado.`,
      psychology: 'Elimina o atrito financeiro e transfere a responsabilidade para o comprador investidor.'
    },
    {
      id: 'obj3',
      title: '⏳ "Já tenho visitas agendadas."',
      script: `Ótimo saber que o imóvel tem procura em ${district}! O nosso cliente tem urgência de compra nesta semana porque vendeu o apartamento dele recente. Se as outras visitas não fecharem proposta, posso passar consigo amanhã às 17h30?`,
      psychology: 'Cria senso de urgência e posiciona como plano A com liquidez imediata.'
    },
    {
      id: 'obj4',
      title: '📄 "Mande por WhatsApp primeiro."',
      script: `Claro, envio já a ficha do perfil do comprador! Mas como ele só tem disponibilidade de visita esta semana em ${district}, prefere que passe amanhã às 10h30 ou às 16h? Leva apenas 10 minutos.`,
      psychology: 'Concorda com o canal digital mas mantém o fechamento do compromisso presencial.'
    }
  ];

  // B2B Objections
  const b2bObjections = [
    {
      id: 'b2b_obj1',
      title: '⏰ "Não tenho tempo, mande por e-mail"',
      script: `Compreendo perfeitamente o seu ritmo de trabalho, ${decisorName}. Um e-mail longo demora 10 minutos a ser analisado. Eu só preciso de 3 minutos objetivos no ecrã na quinta às 14h para lhe demonstrar o ponto exato que está a fazer a ${lead.name} perder contactos no WhatsApp. Se não fizer sentido, não voltamos a contactar. Fica-lhe melhor quinta ou sexta?`,
      psychology: 'Compara o custo de tempo do e-mail com a velocidade de uma demonstração de 3 minutos.'
    },
    {
      id: 'b2b_obj2',
      title: '🤝 "Já temos agência / parceiro atual"',
      script: `Excelente saber que já contam com esse apoio, ${decisorName}! O nosso propósito não é concorrer nem substituir ninguém, mas sim integrar uma esteira ágil para garantir que 100% dos contactos que chegam sejam atendidos em menos de 45 segundos. Posso mostrar-lhe os dados numa breve demonstração de 5 minutos?`,
      psychology: 'Evita confronto com o parceiro atual e foca em maximizar o retorno do investimento existente.'
    },
    {
      id: 'b2b_obj_portugal',
      title: '🇵🇹 "Vocês operam cá em Portugal? Onde estão sediados?"',
      script: `Estamos sediados e a operar diretamente cá em Portugal há mais de 3 anos, com suporte local no fuso horário de Lisboa e trabalho prestado a empresas no eixo Lisboa / Porto. A nossa entrega é estruturada rigorosamente para o mercado português e europeu. Teria 5 minutos amanhã para conhecer a nossa operação?`,
      psychology: 'Abrasileiramento Reverso: neutraliza preconceito, reforça 3 anos de residência e rigor corporativo europeu.'
    },
    {
      id: 'b2b_obj3',
      title: '💰 "Não temos orçamento agora"',
      script: `Compreendo perfeitamente, ${decisorName}, a gestão prudente de tesouraria é fundamental. É precisamente por isso que a nossa estrutura se paga com a recuperação das primeiras oportunidades perdidas no canal direto, com pacotes a partir de € 599. Conseguimos validar os números na quinta às 10h?`,
      psychology: 'Transforma custo em recuperação de faturação líquida.'
    },
    {
      id: 'b2b_obj4',
      title: '🔍 "Como conseguiu este número direto?"',
      script: `A nossa equipa de inteligência de mercado mapeou as principais referências de ${city} no segmento de ${lead.category || 'serviços de topo'} e identificou que a sua liderança é o ponto focal para esta decisão. Leva apenas 3 minutos, faz sentido validarmos nesta quinta?`,
      psychology: 'Elogia a autoridade e posicionamento da empresa, neutralizando a desconfiança.'
    }
  ];

  // Objections formatted for the detected niche
  const nicheFormattedObjections = (liveOutreach.objectionMatrix && liveOutreach.objectionMatrix.length > 0)
    ? liveOutreach.objectionMatrix.map((obj, i) => ({
        id: `niche_obj_${i}`,
        title: `🛡️ "${obj.objection}"`,
        script: obj.rebuttal,
        psychology: obj.psychology
      }))
    : b2bObjections;

  const currentObjections = isRealEstate ? fsboObjections : nicheFormattedObjections;
  const selectedObjectionData = currentObjections.find(o => o.id === activeObjection) || currentObjections[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-2 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-5xl bg-white h-full max-h-[96vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400/30">
              <PhoneCall className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>Teleprompter de Cold Call • Hunter</span>
                  <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    🔒 100% Auditado
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                <span className="font-bold text-white">{lead.name}</span>
                <span>•</span>
                <span className="text-amber-300 font-bold">{decisorName} ({decisorRole})</span>
                <span>•</span>
                <span className="text-slate-300">{district}, {city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={`tel:${phone}`}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95"
              title="Discar diretamente"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Ligar: {phone}</span>
            </a>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Stopwatch & Speaking Phases Progress Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between gap-4 flex-wrap">
          {/* Timer Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 font-mono text-base font-black text-emerald-400">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>00:{seconds < 10 ? `0${seconds}` : seconds}</span>
              <span className="text-xs text-slate-400 font-normal">/ 00:30</span>
            </div>

            <button
              onClick={toggleTimer}
              className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                isTimerRunning 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30' 
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              }`}
            >
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isTimerRunning ? 'Pausar' : 'Iniciar 30s'}</span>
            </button>

            <button
              onClick={resetTimer}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs"
              title="Reiniciar Cronômetro"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Current Phase Badge */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-black px-3 py-1 rounded-lg border ${currentPhase.color}`}>
              {currentPhase.label}
            </span>
          </div>

          {/* B2B Stage Switcher if B2B */}
          {!isRealEstate && (
            <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setB2bStage(1)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  b2bStage === 1 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Secretária / Gatekeeper
              </button>
              <button
                onClick={() => setB2bStage(2)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  b2bStage === 2 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Com o Decisor ({decisorName})
              </button>
            </div>
          )}
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
          
          {/* Left Column: The 30-Second Dynamic Script */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Quick Context & Angle Box */}
            <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-black text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>🎯 Âncora de Nicho ({liveOutreach.detectedNicheLabel})</span>
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateWithAi}
                  disabled={isGeneratingAiOutreach}
                  className="text-xs font-bold text-amber-950 bg-amber-200/90 hover:bg-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Regenerar abordagem cirúrgica em tempo real via IA"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-700 ${isGeneratingAiOutreach ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAiOutreach ? 'Gerando IA...' : '⚡ IA Tempo Real'}</span>
                </button>
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">
                {liveOutreach.callAnchor20s || lead.callAngleSuggestion}
              </p>
              <div className="text-[11px] text-amber-900/80 font-medium pt-1 border-t border-amber-200/60 flex items-center justify-between">
                <span>GAP do Nicho: {liveOutreach.nicheCorePain}</span>
                <span className="font-bold text-amber-950">Zero Frases Clichês</span>
              </div>
            </div>

            {/* Script Box by Vertical */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-6 space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                  <span>Roteiro Cirúrgico de 30 Segundos (Fale com Naturalidade)</span>
                </span>
                
                <button
                  onClick={() => {
                    const fullText = isRealEstate 
                      ? `Olá, ${decisorName}? O meu nome é Gonçalo e sou Gestor de Compradores aqui na zona. Estou a ligar especificamente por causa do seu anúncio do ${lead.name} em ${district} anunciado por ${priceFormatted}. Eu tenho dois clientes com crédito pré-aprovado que procuram exatamente essa tipologia nessa rua esta semana. O imóvel ainda está disponível para fazermos uma visita amanhã às 14h? Eu não quero colocar o seu imóvel na internet, eu quero trazer o comprador.`
                      : b2bStage === 1
                        ? `Olá, bom dia! Por gentileza, a mesa da ${decisorName}? Daqui fala Gonçalo da Criahub, ela está à minha espera para validar o relatório técnico do Meta Pixel do projeto de ${city}. Obrigado.`
                        : `${liveOutreach.coldCallScript.opening} ${liveOutreach.coldCallScript.gapPresentation} ${liveOutreach.coldCallScript.closingCall}`;
                    copyToClipboard(fullText, 'full-script');
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedKey === 'full-script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'full-script' ? 'Copiado!' : 'Copiar Roteiro'}</span>
                </button>
              </div>

              {/* Real Estate FSBO Script */}
              {isRealEstate ? (
                <div className="space-y-4 text-sm sm:text-base leading-relaxed">
                  <div className={`p-3 rounded-xl transition-colors ${seconds <= 6 ? 'bg-blue-50/80 border-l-4 border-blue-600 text-slate-900 font-semibold' : 'text-slate-700'}`}>
                    <span className="text-xs font-black uppercase text-blue-700 block mb-0.5">[00-06s] ABERTURA & CONTATO</span>
                    "Olá, <strong>{decisorName}</strong>? Aqui é o Gonçalo, sou Gestor de Compradores na zona de <strong>{district}</strong>. Estou a ligar referente ao seu anúncio de <strong>{priceFormatted}</strong>."
                  </div>

                  <div className={`p-3 rounded-xl transition-colors ${seconds > 6 && seconds <= 16 ? 'bg-amber-50/80 border-l-4 border-amber-600 text-slate-900 font-semibold' : 'text-slate-700'}`}>
                    <span className="text-xs font-black uppercase text-amber-700 block mb-0.5">[06-16s] ANCORAGEM DO COMPRADOR QUALIFICADO</span>
                    "Liguei diretamente porque tenho dois clientes com <strong>crédito bancário pré-aprovado</strong> que procuram exatamente essa tipologia nesta rua e querem visitar esta semana."
                  </div>

                  <div className={`p-3 rounded-xl transition-colors ${seconds > 16 && seconds <= 24 ? 'bg-emerald-50/80 border-l-4 border-emerald-600 text-slate-900 font-semibold' : 'text-slate-700'}`}>
                    <span className="text-xs font-black uppercase text-emerald-700 block mb-0.5">[16-24s] FECHAMENTO ALTERNATIVO DE VISITA</span>
                    "O imóvel continua disponível? Para si fica mais conveniente recebermos a visita <strong>amanhã às 14h30</strong> ou <strong>quinta às 17h</strong>?"
                  </div>

                  <div className={`p-3 rounded-xl transition-colors ${seconds > 24 ? 'bg-purple-50/80 border-l-4 border-purple-600 text-slate-900 font-semibold' : 'text-slate-700'}`}>
                    <span className="text-xs font-black uppercase text-purple-700 block mb-0.5">[24-30s] BLINDAGEM ANTI-IMOBILIÁRIA</span>
                    "Eu não quero angariar o seu imóvel para colocar na internet, <strong>eu quero trazer o comprador direto</strong>."
                  </div>
                </div>
              ) : (
                /* B2B Script */
                <div className="space-y-4 text-sm sm:text-base leading-relaxed">
                  {b2bStage === 1 ? (
                    /* Gatekeeper Stage */
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/80 rounded-xl border border-indigo-200">
                        <span className="text-xs font-black uppercase text-indigo-700 block mb-1">Passo 1: Falar com a Recepção / Secretária</span>
                        <p className="text-slate-900 font-bold">
                          "Olá, bom dia! Por gentileza, a mesa da <strong>{decisorName}</strong>? Daqui fala o Gonçalo da Criahub, ela pediu para retornar referente ao projeto de automação em <strong>{city}</strong>. Obrigado!"
                        </p>
                      </div>

                      <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block">Se a secretária perguntar "Qual é o assunto?":</span>
                        <p>"É sobre o alinhamento de expansão e resposta de clientes no WhatsApp que enviámos ontem. Ela está no ramal agora?"</p>
                      </div>

                      <button
                        onClick={() => setB2bStage(2)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow"
                      >
                        <span>Atendeu o Decisor! Ir para Passo 2</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* Decision Maker Stage */
                    <div className="space-y-4">
                      <div className={`p-3 rounded-xl transition-colors ${seconds <= 8 ? 'bg-blue-50/80 border-l-4 border-blue-600 text-slate-900 font-semibold' : 'text-slate-700'}`}>
                        <span className="text-xs font-black uppercase text-blue-700 block mb-0.5">[00-08s] QUEBRA DE GELO DIRETA ({liveOutreach.detectedNicheLabel})</span>
                        "{liveOutreach.coldCallScript.opening || `Olá, ${decisorName}, tudo bem? Daqui fala o Gonçalo. Liguei rapidamente porque identifiquei uma oportunidade clara na ${lead.name}.`}"
                      </div>

                      <div className={`p-3 rounded-xl transition-colors ${seconds > 8 && seconds <= 20 ? 'bg-amber-50/80 border-l-4 border-amber-600 text-slate-900 font-semibold' : 'text-slate-700'}`}>
                        <span className="text-xs font-black uppercase text-amber-700 block mb-0.5">[08-20s] APRESENTAÇÃO DO GAP DE ALTO IMPACTO (SEM CLICHÊ)</span>
                        "{liveOutreach.coldCallScript.gapPresentation || `Notámos que empresas em ${city} perdem até 35% das consultas por demorarem mais de 2 horas a responder no WhatsApp. Nós implantamos um SDR Bot IA que qualifica e agenda em 45 segundos.`}"
                      </div>

                      <div className={`p-3 rounded-xl transition-colors ${seconds > 20 ? 'bg-emerald-50/80 border-l-4 border-emerald-600 text-slate-900 font-semibold' : 'text-slate-700'}`}>
                        <span className="text-xs font-black uppercase text-emerald-700 block mb-0.5">[20-30s] FECHAMENTO DE REUNIÃO DE 8 MINUTOS</span>
                        "{liveOutreach.coldCallScript.closingCall || `Consigo mostrar-lhe a demonstração na tela em 8 minutos nesta quinta às 14h ou sexta às 10h?`}"
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Call Result Action Buttons */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Registrar Resultado Imediato da Chamada:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleRecordOutcome('MEETING_BOOKED')}
                    className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Agendou Visita</span>
                  </button>

                  <button
                    onClick={() => handleRecordOutcome('WHATSAPP_PROPOSAL')}
                    className="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleRecordOutcome('RESCHEDULE')}
                    className="py-2.5 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1 shadow-sm transition-all active:scale-95"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Remarcar</span>
                  </button>

                  <button
                    onClick={() => handleRecordOutcome('REJECTED')}
                    className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <X className="w-4 h-4" />
                    <span>Recusou</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Live Objection Matrix & AI Assistant */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Objection Matrix Box */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>Quebra de Objeções ao Vivo (1 Clique)</span>
                  </span>
                </div>

                {/* Objection Pills */}
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {currentObjections.map((obj) => (
                    <button
                      key={obj.id}
                      onClick={() => setActiveObjection(obj.id)}
                      className={`text-left p-2 rounded-xl text-xs font-black transition-all border ${
                        activeObjection === obj.id
                          ? 'bg-rose-50 border-rose-400 text-rose-950 ring-2 ring-rose-300/60 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {obj.title}
                    </button>
                  ))}
                </div>

                {/* Selected Objection Script */}
                <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-3.5 space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-900 uppercase">
                      Resposta Recomendada para Falar Agora:
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedObjectionData.script, 'obj-script')}
                      className="text-slate-400 hover:text-rose-700 text-xs flex items-center gap-1"
                    >
                      {copiedKey === 'obj-script' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-sm font-bold text-slate-950 leading-relaxed">
                    "{selectedObjectionData.script}"
                  </p>
                  <p className="text-xs text-rose-800 italic pt-1 border-t border-rose-200/60">
                    💡 <strong>Ângulo Psicológico:</strong> {selectedObjectionData.psychology}
                  </p>
                </div>
              </div>

              {/* Groq AI Live Rebuttal Input */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Objeção Inédita? Peça à IA Groq (sub-300ms):</span>
                </span>
                
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customObjectionInput}
                    onChange={(e) => setCustomObjectionInput(e.target.value)}
                    placeholder="Ex: 'O meu sócio faleceu', 'Só vendo no fim do ano'..."
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiRebuttal()}
                  />
                  <button
                    onClick={handleGenerateAiRebuttal}
                    disabled={isLoadingAiRebuttal || !customObjectionInput.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    {isLoadingAiRebuttal ? 'Gerando...' : 'Gerar'}
                  </button>
                </div>

                {customRebuttal && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 font-semibold animate-fadeIn">
                    <span className="font-bold text-indigo-700 block mb-0.5">Réplica Imediata Sugerida:</span>
                    "{customRebuttal}"
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default ColdCallHunterModal;
