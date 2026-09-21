import React, { useState } from 'react';
import { Lead } from '../types';
import { 
  X, Send, CheckCircle, AlertCircle, RefreshCw, Copy, Check, 
  ExternalLink, Layers, MessageSquare, Mail, Briefcase, Clock,
  Zap, Sparkles, ShieldCheck, Server, Settings, CheckCheck
} from 'lucide-react';
import { getWebhookLogs, logWebhookDispatch, WebhookLog } from '../services/storageService';
import { 
  getCriahubCrmConfig, 
  saveCriahubCrmConfig, 
  sendLeadToCriahubCrm, 
  buildCriahubCrmPayload 
} from '../services/criahubCrmService';

interface WebhookAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  selectedLeadIds: Set<string>;
}

export const WebhookAutomationModal: React.FC<WebhookAutomationModalProps> = ({
  isOpen,
  onClose,
  leads,
  selectedLeadIds
}) => {
  const [config, setConfig] = useState(getCriahubCrmConfig());
  const [targetChannel, setTargetChannel] = useState<'CRIAHUB_CRM' | 'EVOLUTION_API' | 'RESEND_EMAIL' | 'UNIVERSAL_N8N'>('CRIAHUB_CRM');
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState<WebhookLog[]>(getWebhookLogs());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<string | null>(null);
  const [progressCount, setProgressCount] = useState(0);

  if (!isOpen) return null;

  const targetLeads = selectedLeadIds.size > 0 
    ? leads.filter(l => selectedLeadIds.has(l.id))
    : leads.filter(l => l.icpTier === 'SCORE_A' || l.icpTier === 'SCORE_B');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveConfigField = (field: string, value: any) => {
    const updated = saveCriahubCrmConfig({ [field]: value });
    setConfig(updated);
  };

  const handleTestSingleLead = async () => {
    if (targetLeads.length === 0) {
      alert("Nenhum lead selecionado para teste.");
      return;
    }

    const testLead = targetLeads[0];
    setIsSending(true);
    setDispatchStatus(`Testando envio do lead "${testLead.name}" para ${config.webhookUrl || 'CriahubCRM'}...`);

    try {
      const result = await sendLeadToCriahubCrm(testLead, undefined, {
        channelPriority: targetChannel === 'EVOLUTION_API' ? 'WHATSAPP' : targetChannel === 'RESEND_EMAIL' ? 'EMAIL' : 'OMNICHANNEL'
      });

      setLogs(getWebhookLogs());
      if (result.success) {
        setDispatchStatus(` Sucesso: ${result.message}`);
      } else {
        setDispatchStatus(`⚠️ Atenção: ${result.message}`);
      }
    } catch (e: any) {
      setDispatchStatus(`Erro no teste: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleBatchDispatch = async () => {
    if (targetLeads.length === 0) {
      alert("Nenhum lead elegível para envio.");
      return;
    }

    setIsSending(true);
    setProgressCount(0);
    setDispatchStatus(`Processando envio em lote de ${targetLeads.length} leads...`);

    let successCount = 0;
    let failedCount = 0;

    try {
      for (let i = 0; i < targetLeads.length; i++) {
        const lead = targetLeads[i];
        setProgressCount(i + 1);

        const result = await sendLeadToCriahubCrm(lead, undefined, {
          channelPriority: targetChannel === 'EVOLUTION_API' ? 'WHATSAPP' : targetChannel === 'RESEND_EMAIL' ? 'EMAIL' : 'OMNICHANNEL'
        });

        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }

        // Small pacing delay
        await new Promise(r => setTimeout(r, 100));
      }

      setLogs(getWebhookLogs());
      setDispatchStatus(`Disparo Concluído! ${successCount} leads enviados com sucesso (${failedCount} falhas/simulações).`);
    } catch (err: any) {
      setDispatchStatus(`Erro durante o lote: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Preview payload for current selection
  const sampleLead = targetLeads[0] || leads[0];
  const samplePayload = sampleLead ? buildCriahubCrmPayload(sampleLead) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div 
        id="webhook-automation-modal"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white p-6 border-b border-purple-900/40">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Módulo 5: CriahubCRM & Outbound Webhook Hub
                </span>
                <span className="text-[10px] font-mono bg-slate-800 text-emerald-300 px-2 py-0.5 rounded border border-slate-700">
                  Evolution API v2 • Evolution Go • Resend
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">
                Integração CriahubCRM & Disparador de Mensagens
              </h2>
              <p className="text-xs text-purple-200/80 max-w-2xl">
                Sincronize leads qualificados, diagnósticos BANT+, Tech Stack e gatilhos de WhatsApp (Evolution API / Go) e E-mail diretamente para o CriahubCRM ou seu Webhook no n8n/Make.
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50 space-y-6">
          
          {/* Engine & Credentials Settings */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-purple-600" />
                1. Configurações de Conexão com o CriahubCRM & Evolution API
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Salvo automaticamente</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Webhook Endpoint */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Webhook URL de Entrada do CriahubCRM / n8n / Make
                </label>
                <input
                  type="url"
                  value={config.webhookUrl}
                  onChange={e => handleSaveConfigField('webhookUrl', e.target.value)}
                  placeholder="https://xcgphxriuopvqohvidfi.supabase.co/functions/v1/webhook-handler ou seu n8n"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Target Preset Engine */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Perfil de Envio
                </label>
                <select
                  value={targetChannel}
                  onChange={e => setTargetChannel(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="CRIAHUB_CRM">CriahubCRM (Leads + WhatsApp + Email)</option>
                  <option value="EVOLUTION_API">Evolution API (Apenas WhatsApp v2 / Go)</option>
                  <option value="RESEND_EMAIL">Resend / SES (Apenas E-mail Outbound)</option>
                  <option value="UNIVERSAL_N8N">Webhook Universal (n8n / Make / Chatwoot)</option>
                </select>
              </div>

              {/* Evolution API Instance */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Instância Evolution API / Go
                </label>
                <input
                  type="text"
                  value={config.evolutionInstanceName || ''}
                  onChange={e => handleSaveConfigField('evolutionInstanceName', e.target.value)}
                  placeholder="ex: prospector-sdr-01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* API Token / Bearer */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  API Token / Secret Key (Opcional)
                </label>
                <input
                  type="password"
                  value={config.apiToken || ''}
                  onChange={e => handleSaveConfigField('apiToken', e.target.value)}
                  placeholder="Bearer Token do CriahubCRM / Evolution"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Default Pipeline Stage */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1">
                  Estágio Inicial no Pipeline
                </label>
                <select
                  value={config.defaultPipelineStage}
                  onChange={e => handleSaveConfigField('defaultPipelineStage', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Prospecção Fria">Prospecção Fria</option>
                  <option value="Qualificação BANT+">Qualificação BANT+</option>
                  <option value="Demonstração Agendada">Demonstração Agendada</option>
                  <option value="Proposta Enviada">Proposta Enviada</option>
                </select>
              </div>

            </div>

            {/* Action Buttons: Single Test & Batch Dispatch */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-600">
                Alvo Selecionado: <strong>{targetLeads.length} leads qualificados</strong> {selectedLeadIds.size > 0 ? '(Seleção manual)' : '(Score A e B)'}
              </div>

              <div className="flex items-center gap-2">
                {/* Single Test Button */}
                <button
                  id="btn-test-single-lead"
                  onClick={handleTestSingleLead}
                  disabled={isSending || targetLeads.length === 0}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all border border-slate-300 flex items-center gap-1.5 disabled:opacity-50"
                  title="Envia apenas o primeiro lead para validar a conexão"
                >
                  <Server className="w-3.5 h-3.5 text-purple-600" />
                  <span>Testar 1 Lead</span>
                </button>

                {/* Batch Dispatch Button */}
                <button
                  id="btn-batch-dispatch-leads"
                  onClick={handleBatchDispatch}
                  disabled={isSending || targetLeads.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg text-xs font-extrabold shadow transition-all disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando ({progressCount}/{targetLeads.length})...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Disparar {targetLeads.length} Leads para CriahubCRM</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Status Message */}
            {dispatchStatus && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-xs font-semibold text-purple-950 flex items-center justify-between">
                <span>{dispatchStatus}</span>
                {progressCount > 0 && isSending && (
                  <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-mono font-bold">
                    {Math.round((progressCount / targetLeads.length) * 100)}%
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sample Payload Preview formatted for CriahubCRM & Evolution API */}
          {samplePayload && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  2. Exemplo do Payload Formatado para CriahubCRM & Evolution API (JSON)
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(samplePayload, null, 2), 'sample')}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  {copiedKey === 'sample' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'sample' ? 'Copiado!' : 'Copiar Payload'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 text-amber-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800">
                {JSON.stringify(samplePayload, null, 2)}
              </pre>
            </div>
          )}

          {/* Recent Webhook Logs */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              3. Histórico de Disparos Webhook ({logs.length})
            </h4>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Nenhum disparo registrado ainda.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.status === 'SUCCESS' ? 'bg-emerald-500' : log.status === 'SIMULATED' ? 'bg-indigo-500' : 'bg-red-500'
                      }`} />
                      <strong className="font-mono text-slate-800">{log.type}</strong>
                      <span className="text-slate-500 truncate max-w-xs">{log.targetUrl}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>CriahubCRM Ready • Evolution API v2 • Resend SMTP</span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

export default WebhookAutomationModal;