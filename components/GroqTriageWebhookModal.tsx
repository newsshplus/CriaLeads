import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  GroqTriageService, 
  GroqTriageResult, 
  WebhookDataDictionaryItem 
} from '../services/groqTriageService';
import { 
  Cpu, 
  X, 
  Sparkles, 
  Check, 
  Copy, 
  MessageSquare, 
  ArrowRight, 
  Send, 
  Zap, 
  FileCode, 
  HelpCircle, 
  Table as TableIcon,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface GroqTriageWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLead: Lead | null;
}

export const GroqTriageWebhookModal: React.FC<GroqTriageWebhookModalProps> = ({
  isOpen,
  onClose,
  selectedLead
}) => {
  if (!isOpen || !selectedLead) return null;

  const [activeTab, setActiveTab] = useState<'triage_simulator' | 'webhook_payload' | 'data_dictionary'>('triage_simulator');
  const [testInboundMessage, setTestInboundMessage] = useState<string>('Olá Gonçalo, tenho interesse. Pode vir amanhã às 14h fazer a visita com o comprador?');
  const [triageResult, setTriageResult] = useState<GroqTriageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const dataDictionary = GroqTriageService.getWebhookDataDictionary();
  const webhookPayload = GroqTriageService.formatLeadToWebhookPayload(selectedLead);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleRunTriage = async () => {
    if (!testInboundMessage.trim()) return;
    setIsProcessing(true);
    try {
      const result = await GroqTriageService.classifyInboundMessage(selectedLead, testInboundMessage);
      setTriageResult(result);
    } catch {
      alert('Erro ao executar triagem');
    } finally {
      setIsProcessing(false);
    }
  };

  const presetMessages = [
    {
      label: '🔥 Interessado (Agendamento)',
      text: 'Olá Gonçalo, tenho interesse. Pode vir amanhã às 14h fazer a visita com o comprador?'
    },
    {
      label: '⚠️ Objeção Clássica',
      text: 'Não tenho interesse em imobiliárias e não pago nenhuma comissão de agência.'
    },
    {
      label: '🤔 Curioso',
      text: 'Como é que vocês conseguiram o meu número de telefone?'
    },
    {
      label: '❌ Recusado',
      text: 'Favor remover o meu número da vossa lista imediatamente, não quero contato.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/85 backdrop-blur-md flex justify-center items-center p-2 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-5xl bg-white h-full max-h-[95vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-indigo-900/40">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Cpu className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Groq Llama-3 Triage & Webhook Hub</h2>
                <span className="text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 px-2 py-0.5 rounded-full">
                  sub-400ms IA
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Classificação de mensagens em tempo real + Integração de Webhooks para Make, Zapier e CRMs.
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('triage_simulator')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'triage_simulator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Simulador de Triagem Groq (Llama-3)</span>
          </button>

          <button
            onClick={() => setActiveTab('webhook_payload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'webhook_payload'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Payload JSON do Webhook</span>
          </button>

          <button
            onClick={() => setActiveTab('data_dictionary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === 'data_dictionary'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Dicionário de Dados Completo</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          
          {/* TAB 1: TRIAGE SIMULATOR */}
          {activeTab === 'triage_simulator' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-700 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <span>Mensagem de Resposta Recebida do Lead ({selectedLead.name})</span>
                  </span>
                  <span className="text-xs font-bold text-slate-500">Selecione um exemplo ou digite:</span>
                </div>

                {/* Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {presetMessages.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTestInboundMessage(preset.text)}
                      className="p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-800 text-left transition-all"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={testInboundMessage}
                  onChange={(e) => setTestInboundMessage(e.target.value)}
                  rows={3}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Digite a mensagem recebida pelo WhatsApp ou E-mail..."
                />

                <button
                  onClick={handleRunTriage}
                  disabled={isProcessing || !testInboundMessage.trim()}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isProcessing ? 'Classificando via Groq Llama-3...' : 'Executar Triagem Instantânea (Groq sub-400ms)'}</span>
                </button>
              </div>

              {/* Triage Output */}
              {triageResult && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-3 py-1 rounded-lg border shadow-xs ${triageResult.badgeColor}`}>
                        {triageResult.categoryLabel}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {triageResult.processingTimeMs}ms
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                      Confiança: {triageResult.confidenceScore}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 block mb-0.5">Intenção Extraída:</span>
                      <p className="text-xs sm:text-sm font-bold text-slate-900">{triageResult.extractedIntent}</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-500 block mb-0.5">Impacto no Pipeline:</span>
                      <p className="text-xs sm:text-sm font-black text-emerald-700">{triageResult.pipelineImpact}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-indigo-900">
                        ⚡ Resposta Imediata Sugerida (SDR Bot):
                      </span>
                      <button
                        onClick={() => copyToClipboard(triageResult.suggestedInstantReply, 'instant-reply')}
                        className="text-indigo-700 hover:text-indigo-900 text-xs font-bold flex items-center gap-1"
                      >
                        {copiedKey === 'instant-reply' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'instant-reply' ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-indigo-950">
                      "{triageResult.suggestedInstantReply}"
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: WEBHOOK PAYLOAD */}
          {activeTab === 'webhook_payload' && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Payload JSON Pronto para Webhook</h3>
                  <p className="text-xs text-slate-500">Formato enviado nos disparos de eventos para Make, Zapier, n8n ou CRM.</p>
                </div>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(webhookPayload, null, 2), 'webhook-json')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow transition-all"
                >
                  {copiedKey === 'webhook-json' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey === 'webhook-json' ? 'Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 text-emerald-400 p-5 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-[60vh] leading-relaxed">
                {JSON.stringify(webhookPayload, null, 2)}
              </pre>
            </div>
          )}

          {/* TAB 3: DATA DICTIONARY */}
          {activeTab === 'data_dictionary' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Dicionário de Dados dos Campos do Webhook</h3>
                  <p className="text-xs text-slate-500">Guia de mapeamento de propriedades para integração no Zapier, Make e CRM.</p>
                </div>
                <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl">
                  {dataDictionary.length} Propriedades Mapeadas
                </span>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Nome do Campo</th>
                        <th className="p-3.5">Tipo de Dado</th>
                        <th className="p-3.5">O que significa? (Explicação)</th>
                        <th className="p-3.5">Exemplo Enviado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                      {dataDictionary.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-indigo-700">{item.fieldName}</td>
                          <td className="p-3.5 text-slate-500">{item.dataType}</td>
                          <td className="p-3.5 font-semibold text-slate-900">{item.meaning}</td>
                          <td className="p-3.5 font-mono text-emerald-700">{item.exampleValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default GroqTriageWebhookModal;
