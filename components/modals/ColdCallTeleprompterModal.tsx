// components/modals/ColdCallTeleprompterModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  Phone, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw, 
  MessageSquare, 
  Flame, 
  Check, 
  Copy,
  Clock,
  Sparkles
} from 'lucide-react';

export interface TeleprompterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    vertical: 'FSBO' | 'B2B';
    title: string;
    decisionMakerName: string;
    decisionMakerRole: string;
    phone: string;
    priceFormatted: string;
    district: string;
    daysOnMarket?: number;
    callAngleSuggestion: string;
  } | null;
  onScheduleMeeting?: (leadId: string) => void;
  onMarkUnqualified?: (leadId: string) => void;
}

export const ColdCallTeleprompterModal: React.FC<TeleprompterModalProps> = ({ 
  isOpen, 
  onClose, 
  lead,
  onScheduleMeeting,
  onMarkUnqualified
}) => {
  const [activeObjection, setActiveObjection] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !lead) return null;

  // Matriz Dinâmica de Objeções carregada instantaneamente com base na vertical
  const objecoes = lead.vertical === 'FSBO' 
    ? [
        { 
          id: 'obj1', 
          label: '❌ "Não quero imobiliárias"', 
          script: `"${lead.decisionMakerName}, eu entendo perfeitamente. Eu também não quero angariar o seu imóvel para o deixar parado na internet. Eu sou Gestor de Compradores e tenho um cliente específico com crédito pré-aprovado para o ${lead.district}. Se eu lhe trouxer o comprador esta semana, você aceita fazer o negócio?"` 
        },
        { 
          id: 'obj2', 
          label: '💰 "Não pago comissão"', 
          script: `"Sem problema nenhum, ${lead.decisionMakerName}. O meu cliente sabe que está a comprar direto a um particular e a minha taxa de sucesso está salvaguardada do lado dele. O valor que definiu de ${lead.priceFormatted} é o valor limpo que quer receber na sua conta, correto? Então vamos agendar a visita."` 
        },
        { 
          id: 'obj3', 
          label: '🤝 "Se tiver cliente traga..."', 
          script: `"Exatamente por isso é que estou a ligar. Eu não assino papéis de exclusividade antes de o cliente ver o imóvel. Preciso apenas de 15 minutos amanhã para fazer a validação física ou virtual para o meu investidor emitir o CPCV. Qual é o melhor horário para si?"` 
        }
      ]
    : [
        { 
          id: 'obj1', 
          label: '⏳ "Não tenho tempo / Manda e-mail"', 
          script: `"Perfeito, ${lead.decisionMakerName}, eu sei que a vossa agenda na ${lead.title} é corrida. Mas um e-mail com PDFs vai direto para a pasta de spam. Preciso apenas de 180 segundos na próxima quinta-feira às 10h para lhe mostrar na tela como o seu concorrente direto está a capturar 4x mais clientes devido ao gap do vosso Meta Pixel. Quinta às 10h ou sexta às 14h?"` 
        },
        { 
          id: 'obj2', 
          label: '🤝 "Já temos fornecedor disso"', 
          script: `"Fico muito feliz por ouvir isso, significa que vocês valorizam esta área. A maioria dos nossos clientes atuais também tinha um fornecedor ativo. O que nós fazemos não é substituir, é auditoria de performance. Se eu lhe provar em 5 minutos que estamos a gerar leads a metade do custo atual, você daria uma oportunidade à nossa solução?"` 
        },
        { 
          id: 'obj3', 
          label: '🚫 "A diretoria não aprova gastos"', 
          script: `"Compreendo perfeitamente, a conjuntura exige cautela. No entanto, a nossa solução não é um 'gasto', é um motor de receita auto-financiável. Nós só faturamos com base no lucro real que injetamos na ${lead.title}. Vamos agendar uma breve apresentação para ver como blindamos o risco da operação?"` 
        }
      ];

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(lead.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMeetingBooked = () => {
    if (onScheduleMeeting) onScheduleMeeting(lead.id);
    onClose();
  };

  const handleUnqualified = () => {
    if (onMarkUnqualified) onMarkUnqualified(lead.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      
      {/* Container Principal do Modal */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[92vh] md:h-auto max-h-[660px]">
        
        {/* COLUNA ESQUERDA: O Teleprompter de Leitura Dinâmica (60% da tela) */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 overflow-y-auto">
          
          {/* Topo: Dados do Decisor e Linha Ativa */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/25 rounded-full text-xs font-black text-rose-400">
                <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                CHAMADA EM CURSO
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {lead.id}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {lead.decisionMakerName}
            </h2>
            <div className="flex items-center gap-2 mt-1 mb-4 flex-wrap">
              <span className="text-xs text-indigo-400 font-bold">
                {lead.decisionMakerRole}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 font-bold">
                {lead.title}
              </span>
              <span className="text-slate-600">•</span>
              <button 
                onClick={handleCopyPhone}
                className="inline-flex items-center gap-1 font-mono text-xs text-emerald-400 hover:text-emerald-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-emerald-500/50 transition-colors"
                title="Clique para copiar o telefone"
              >
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>{lead.phone}</span>
                {copied ? <Check className="w-3 h-3 text-emerald-400 ml-1" /> : <Copy className="w-3 h-3 text-slate-500 ml-1" />}
              </button>
            </div>

            {/* O TEXTO DO TELEPROMPTER - Fonte Grande para leitura rápida sem desviar os olhos */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-inner my-2">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-2.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> 
                <span>Roteiro de Abertura Sugerido (Groq Llama-3 sub-400ms):</span>
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed tracking-wide font-sans select-all">
                {lead.callAngleSuggestion}
              </p>
            </div>
          </div>

          {/* Rodapé da Coluna Esquerda: Selo de Confiança */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 mt-4 text-[11px] text-emerald-400 font-mono flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>DADOS AUDITADOS POR 3 AGENTES • 99% ACCURACY CONFIRMADA</span>
            </div>
            {lead.daysOnMarket && (
              <span className="text-slate-400">
                {lead.daysOnMarket} dias no mercado
              </span>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: O Teclado de Objeções ao Vivo / Battlecards (40% da tela) */}
        <div className="w-full md:w-[360px] bg-slate-950 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Quebra de Objeções ao Vivo
              </h3>
              <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-slate-900 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
              Se o cliente lançar uma barreira ao telefone, clique no botão correspondente abaixo para mudar o roteiro instantaneamente:
            </p>

            {/* Lista de Botões de Objeção */}
            <div className="space-y-2">
              {objecoes.map((obj) => (
                <button
                  key={obj.id}
                  onClick={() => setActiveObjection(activeObjection === obj.id ? null : obj.id)}
                  className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between ${
                    activeObjection === obj.id
                      ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="truncate pr-2">{obj.label}</span>
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 opacity-70 ${activeObjection === obj.id ? 'animate-spin text-amber-400' : ''}`} />
                </button>
              ))}
            </div>

            {/* Tela Dinâmica da Resposta de Contra-Argumento */}
            {activeObjection && (
              <div className="mt-3.5 p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl animate-fadeIn shadow-inner">
                <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded mb-2 inline-block">
                  FALE ISTO AGORA:
                </span>
                <p className="text-xs font-medium text-amber-100 leading-relaxed italic">
                  {objecoes.find(o => o.id === activeObjection)?.script}
                </p>
              </div>
            )}
          </div>

          {/* Ações Finais do Fechamento da Chamada */}
          <div className="pt-4 border-t border-slate-800/60 mt-4 grid grid-cols-2 gap-2">
            <button 
              onClick={handleMeetingBooked}
              className="py-3 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl text-center shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              🚀 REUNIÃO AGENDADA
            </button>
            <button 
              onClick={handleUnqualified}
              className="py-3 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold text-xs rounded-xl text-center transition-colors active:scale-95"
            >
              Sem Interesse / Lixo
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ColdCallTeleprompterModal;
