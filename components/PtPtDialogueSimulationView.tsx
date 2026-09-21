import React, { useState } from 'react';
import { 
  Check, Copy, Send, Phone, MessageSquare, Sparkles, 
  ExternalLink, ArrowRight, ShieldCheck, Flame, Layers, 
  Target, Globe, AlertCircle, RefreshCw, FileText, Share2, CheckCircle2
} from 'lucide-react';
import { Lead, PtPtSdrDialogueSimulation } from '../types';
import { 
  generateDeterministicPtPtDialogue, 
  generateLiveAiPtPtDialogue, 
  formatDialogueSimulationToMarkdown,
  CRIAHUB_FREE_AUDIT_URL,
  CRIAHUB_PACKAGES_URL 
} from '../services/ptPtDialogueSimulationService';

interface Props {
  lead: Lead;
  onUpdateLead?: (updatedLead: Lead) => void;
  compact?: boolean;
}

export const PtPtDialogueSimulationView: React.FC<Props> = ({
  lead,
  onUpdateLead,
  compact = false
}) => {
  const [simulation, setSimulation] = useState<PtPtSdrDialogueSimulation>(() => {
    if (lead.ptPtDialogueSimulation) {
      return lead.ptPtDialogueSimulation;
    }
    if (lead.realtimeSdrOutreach?.ptPtDialogueSimulation) {
      return lead.realtimeSdrOutreach.ptPtDialogueSimulation;
    }
    return generateDeterministicPtPtDialogue(lead);
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'dialogue' | 'diagnostic' | 'coldcall' | 'googleads'>('dialogue');
  
  // Ingestão manual de dados de scraping
  const [showScrapeInput, setShowScrapeInput] = useState(false);
  const [rawScrapedText, setRawScrapedText] = useState('');

  const primaryPhone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = primaryPhone.replace(/\D/g, '');
  const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 7);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleRegenerateWithAi = async () => {
    setIsRegenerating(true);
    try {
      const generated = await generateLiveAiPtPtDialogue(lead, rawScrapedText || undefined);
      setSimulation(generated);
      if (onUpdateLead) {
        onUpdateLead({
          ...lead,
          ptPtDialogueSimulation: generated
        });
      }
      setShowScrapeInput(false);
    } catch (e) {
      console.error(e);
      const fallback = generateDeterministicPtPtDialogue(lead);
      setSimulation(fallback);
    } finally {
      setIsRegenerating(false);
    }
  };

  const fullMarkdown = formatDialogueSimulationToMarkdown(simulation);

  // WhatsApp click com mensagem 1
  const waUrl = hasPhone 
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(simulation.dialogueSimulation.sdrMessage1)}`
    : null;

  return (
    <div className="flex flex-col space-y-5 text-slate-800">
      {/* Top Banner de Identidade & Status PT-PT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">🇵🇹</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Motor B2B Portugal • PT-PT Estrito
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  4 Blocos Automáticos
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {simulation.generatedAt}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Simulação de Diálogo & Auditoria Técnica do Scraping
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Empresa: <strong className="text-amber-400">{lead.name || 'Lead Analisado'}</strong> • Concelho: <strong className="text-slate-100">{lead.city || 'Portugal'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowScrapeInput(!showScrapeInput)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>{showScrapeInput ? 'Ocultar Ingestão' : 'Colar Scraping'}</span>
            </button>

            <button
              onClick={handleRegenerateWithAi}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-950 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'A processar...' : 'Atualizar com IA'}</span>
            </button>

            <button
              onClick={() => handleCopy(fullMarkdown, 'fullMarkdown')}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Copiar os 4 blocos em Markdown"
            >
              {copiedKey === 'fullMarkdown' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedKey === 'fullMarkdown' ? 'Copiado!' : 'Copiar Tudo'}</span>
            </button>
          </div>
        </div>

        {/* Campo Expansível para Injetar Dados Brutos de Scraping */}
        {showScrapeInput && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-fadeIn">
            <label className="block text-xs font-bold text-amber-300 mb-1.5">
              📥 Cole aqui os dados brutos de Scraping da empresa (Website, Nicho, Tecnologias detetadas, Erros no site):
            </label>
            <textarea
              value={rawScrapedText}
              onChange={(e) => setRawScrapedText(e.target.value)}
              placeholder="Exemplo: Empresa: Sapatos Silva, URL: www.sapatossilva.pt, Nicho: Calçado Guimarães, Techs: WooCommerce antigo, sem Pixel Meta com CAPI, tempo de carregamento no telemóvel 5.2s..."
              rows={3}
              className="w-full text-xs font-mono bg-slate-950 text-slate-200 border border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowScrapeInput(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegenerateWithAi}
                disabled={isRegenerating || !rawScrapedText.trim()}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Processar Dados de Scraping com IA
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Abas de Navegação pelos 4 Blocos */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('dialogue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'dialogue'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>2. Simulação de Conversa (WhatsApp)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('diagnostic')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'diagnostic'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>1. Ficha de Diagnóstico Rápido</span>
        </button>

        <button
          onClick={() => setActiveSubTab('coldcall')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'coldcall'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>3. Cold Call 1 Minuto</span>
        </button>

        <button
          onClick={() => setActiveSubTab('googleads')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'googleads'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          <span>4. Palavras-Chave Google Ads</span>
        </button>
      </div>

      {/* BLOCO 2: SIMULAÇÃO DA TROCA DE CONVERSA (WHATSAPP / LINKEDIN) */}
      {activeSubTab === 'dialogue' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              Transcrição Passo a Passo: SDR CriaHub vs Empresário Português
            </span>

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-transform active:scale-95"
              >
                <Send className="w-3 h-3 text-white" />
                <span>Enviar Mensagem 1 no WhatsApp</span>
              </a>
            )}
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
            {/* Mensagem 1 - SDR CriaHub */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                SDR
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <span>🇵🇹 [SDR CriaHub - Mensagem 1]:</span>
                    <span className="text-[10px] text-slate-500 font-normal">Abertura por valor & âncora local</span>
                  </span>
                  <button
                    onClick={() => handleCopy(simulation.dialogueSimulation.sdrMessage1, 'sdr1')}
                    className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Copiar mensagem"
                  >
                    {copiedKey === 'sdr1' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {simulation.dialogueSimulation.sdrMessage1}
                </p>
              </div>
            </div>

            {/* Resposta 1 - Empresário Português */}
            <div className="flex flex-col sm:flex-row gap-3 items-start pl-4 sm:pl-8">
              <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                👔
              </div>
              <div className="flex-1 bg-slate-100/90 p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    [Empresário Português - Resposta 1]: <span className="text-[10px] text-slate-500 font-normal">Objeção típica de prudência</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed font-sans">
                  "{simulation.dialogueSimulation.prospectResponse1}"
                </p>
              </div>
            </div>

            {/* Mensagem 2 - SDR CriaHub */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                SDR
              </div>
              <div className="flex-1 bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <span>🇵🇹 [SDR CriaHub - Mensagem 2]:</span>
                    <span className="text-[10px] text-slate-500 font-normal">Contorno técnico + Estudo de caso Portugal</span>
                  </span>
                  <button
                    onClick={() => handleCopy(simulation.dialogueSimulation.sdrMessage2, 'sdr2')}
                    className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Copiar mensagem"
                  >
                    {copiedKey === 'sdr2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {simulation.dialogueSimulation.sdrMessage2}
                </p>
              </div>
            </div>

            {/* Resposta 2 - Empresário Português */}
            <div className="flex flex-col sm:flex-row gap-3 items-start pl-4 sm:pl-8">
              <div className="w-8 h-8 rounded-xl bg-slate-700 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                👔
              </div>
              <div className="flex-1 bg-slate-100/90 p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800">
                    [Empresário Português - Resposta 2]: <span className="text-[10px] text-emerald-600 font-bold">Curiosidade técnica & abertura</span>
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed font-sans">
                  "{simulation.dialogueSimulation.prospectResponse2}"
                </p>
              </div>
            </div>

            {/* Mensagem 3 - SDR CriaHub (Fecho / CTA Directo) */}
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                CTA
              </div>
              <div className="flex-1 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-300 shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-emerald-200/60">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1">
                    <span>🎯 [SDR CriaHub - Mensagem 3 (Fechamento/CTA)]:</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Chamada de 10 min ou Link de Conversão</span>
                  </span>
                  <button
                    onClick={() => handleCopy(simulation.dialogueSimulation.sdrMessage3Close, 'sdr3')}
                    className="p-1 text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                    title="Copiar mensagem"
                  >
                    {copiedKey === 'sdr3' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                  {simulation.dialogueSimulation.sdrMessage3Close}
                </p>

                {/* Botões Rápidos com os links da CriaHub */}
                <div className="flex items-center gap-2 flex-wrap mt-3 pt-2.5 border-t border-emerald-200">
                  <a
                    href={CRIAHUB_FREE_AUDIT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Abrir Página de Diagnóstico Grátis</span>
                  </a>

                  <a
                    href={CRIAHUB_PACKAGES_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Consultar Pacotes CriaHub (€599+)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO 1: FICHA DE DIAGNÓSTICO RÁPIDO (DADOS DO SCRAPING) */}
      {activeSubTab === 'diagnostic' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Empresa & Localização */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Empresa & Concelho/Distrito
              </span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                {simulation.quickDiagnostic.companyAndLocation}
              </p>
              {lead.website && (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-700 hover:underline flex items-center gap-1 mt-1 font-mono"
                >
                  <Globe className="w-3 h-3" />
                  {lead.website}
                </a>
              )}
            </div>

            {/* Oferta CriaHub Ideal */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-950">
                  Oferta CriaHub Recomendada
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                  {simulation.quickDiagnostic.opportunityVerdict || 'Lead Quente'}
                </span>
              </div>
              <p className="text-sm font-black text-amber-950 mt-1">
                {simulation.quickDiagnostic.idealCriahubOffer}
              </p>
            </div>
          </div>

          {/* Pontos Fortes Identificados */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Pontos Fortes Identificados (Para Elogiar e Gerar Relação):
            </span>
            <ul className="space-y-1.5">
              {simulation.quickDiagnostic.strengths.map((str, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Gargalo Principal (A Falha) */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
            <span className="text-xs font-black uppercase tracking-wider text-rose-900 flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              Gargalo Principal (A Falha Técnica a Apontar):
            </span>
            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
              {simulation.quickDiagnostic.mainBottleneck}
            </p>
          </div>

          {/* Caso de Estudo Análogo */}
          {simulation.caseStudyAnalog && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1.5">
                <Flame className="w-4 h-4 text-amber-400" />
                Matriz de Prova Social (Caso de Sucesso Análogo em Portugal):
              </span>
              <p className="text-xs font-bold text-slate-200 mb-1">
                {simulation.caseStudyAnalog.title}
              </p>
              <p className="text-xs text-slate-400 mb-2">
                <strong>Antes:</strong> {simulation.caseStudyAnalog.beforeAfter}
              </p>
              <p className="text-xs text-emerald-300 font-bold bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <strong>Resultado alcançado:</strong> {simulation.caseStudyAnalog.result}
              </p>
            </div>
          )}
        </div>
      )}

      {/* BLOCO 3: SIMULAÇÃO DE COLD CALL DE 1 MINUTO */}
      {activeSubTab === 'coldcall' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-700" />
              Roteiro de Cold Call Executiva (1 Minuto no Ecrã)
            </span>

            {hasPhone && (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                <Phone className="w-3 h-3 text-white" />
                <span>Discar {primaryPhone}</span>
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Abertura */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1 mb-1">
                1. Abertura (Foco no Decisor em PT-PT)
              </span>
              <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {simulation.coldCall1Min.opening}
              </p>
            </div>

            {/* Gancho */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1 mb-1">
                2. Gancho (Gargalo Identificado no Sítio Web)
              </span>
              <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {simulation.coldCall1Min.hook}
              </p>
            </div>

            {/* Pitch Rápido */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1 mb-1">
                3. Pitch Rápido (Pacotes CriaHub com Foco em ROI)
              </span>
              <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                {simulation.coldCall1Min.quickPitch}
              </p>
            </div>

            {/* Fecho */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 flex items-center gap-1 mb-1">
                4. Fecho (Pedido de Agendamento de 10 Minutos)
              </span>
              <p className="text-xs sm:text-sm text-slate-800 italic leading-relaxed bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                {simulation.coldCall1Min.close}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO 4: PALAVRAS-CHAVE DE SINERGIA (GOOGLE ADS) */}
      {activeSubTab === 'googleads' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              Três Termos de Pesquisa Exata no Google Ads em Portugal:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
              {simulation.googleAdsKeywords.map((kw, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-900">
                    {kw}
                  </span>
                  <button
                    onClick={() => handleCopy(kw, `kw_${i}`)}
                    className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {copiedKey === `kw_${i}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {simulation.googleAdsAdSuggestion && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 mb-2 block">
                Ajuste Recomendado de Anúncio Google Ads (Portugal):
              </span>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <span className="text-xs text-emerald-400 font-mono">
                  https://www.criahub.global/pt/
                </span>
                <h5 className="text-sm font-bold text-amber-300">
                  {simulation.googleAdsAdSuggestion.headline}
                </h5>
                <p className="text-xs text-slate-300">
                  {simulation.googleAdsAdSuggestion.description}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
