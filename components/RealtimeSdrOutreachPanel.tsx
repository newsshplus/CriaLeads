import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Phone, 
  RefreshCw, 
  MessageSquare, 
  ShieldAlert, 
  Zap, 
  Briefcase, 
  Target, 
  Flame, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sliders,
  MapPin,
  ShieldCheck,
  Globe,
  Layers,
  X
} from 'lucide-react';
import { Lead, SdrOutreachTone, RealtimeSdrOutreach } from '../types';
import { 
  generateDeterministicNicheOutreach, 
  generateLiveAiNicheOutreach,
  detectLeadNiche 
} from '../services/realtimeSdrAiOutreachService';
import { PtPtDialogueSimulationView } from './PtPtDialogueSimulationView';

interface Props {
  lead: Lead;
  onUpdateLead?: (updatedLead: Lead) => void;
  onClose?: () => void;
  compact?: boolean;
}

export const RealtimeSdrOutreachPanel: React.FC<Props> = ({
  lead,
  onUpdateLead,
  onClose,
  compact = false
}) => {
  const [activeMainTab, setActiveMainTab] = useState<'simulation' | 'cockpit'>('simulation');
  const [selectedTone, setSelectedTone] = useState<SdrOutreachTone>('executivo_ceo');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customDirective, setCustomDirective] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Current outreach state
  const [outreach, setOutreach] = useState<RealtimeSdrOutreach>(() => {
    if (lead.realtimeSdrOutreach) {
      return lead.realtimeSdrOutreach;
    }
    return generateDeterministicNicheOutreach(lead, 'executivo_ceo');
  });

  // Editable text state
  const [editableWa, setEditableWa] = useState(outreach.whatsappIcebreaker);
  const [editableAnchor, setEditableAnchor] = useState(outreach.callAnchor20s);
  const [editableFollowup, setEditableFollowup] = useState(outreach.whatsappFollowup24h);

  useEffect(() => {
    setEditableWa(outreach.whatsappIcebreaker);
    setEditableAnchor(outreach.callAnchor20s);
    setEditableFollowup(outreach.whatsappFollowup24h);
  }, [outreach]);

  // Detected niche blueprint
  const detectedBlueprint = detectLeadNiche(lead);

  // Resolution of phone number
  const primaryPhone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = primaryPhone.replace(/\D/g, '');
  const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 7);
  const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor';

  // Handle tone change
  const handleToneChange = async (newTone: SdrOutreachTone) => {
    setSelectedTone(newTone);
    setIsGenerating(true);
    try {
      const generated = await generateLiveAiNicheOutreach(lead, newTone, customDirective);
      setOutreach(generated);
      if (onUpdateLead) {
        onUpdateLead({
          ...lead,
          realtimeSdrOutreach: generated
        });
      }
    } catch (e) {
      const fallback = generateDeterministicNicheOutreach(lead, newTone);
      setOutreach(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger manual live AI regeneration
  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateLiveAiNicheOutreach(lead, selectedTone, customDirective);
      setOutreach(generated);
      if (onUpdateLead) {
        onUpdateLead({
          ...lead,
          realtimeSdrOutreach: generated
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  // WhatsApp click handler
  const waUrl = hasPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(editableWa)}` : null;

  return (
    <div className={`flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-lg overflow-hidden ${compact ? 'p-4' : 'p-6 sm:p-8'}`}>
      {/* Top Banner: Niche & AI Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-900 border border-amber-300/60">
              <Target className="w-3.5 h-3.5 text-amber-700" />
              Nicho: {outreach.nicheDetected}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
              {outreach.aiEngineUsed}
            </span>

            <span className="text-[11px] text-slate-500 font-mono">
              Gerado às {outreach.generatedAt}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Abordagem Cirúrgica Anti-Clichê SDR
          </h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Prospectando <strong className="text-slate-900">{lead.name}</strong> • Decisor: <strong className="text-slate-900">{decisorName}</strong>
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-950 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Criando Abordagem...' : 'Atualizar com IA'}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Selector: 4 Blocos PT-PT vs Cockpit Rápido */}
      <div className="flex items-center gap-2 mt-5 p-1.5 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setActiveMainTab('simulation')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'simulation'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="text-base">🇵🇹</span>
          <span>Simulação de Diálogo & 4 Blocos PT-PT</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
            Recomendado
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab('cockpit')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMainTab === 'cockpit'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-600" />
          <span>Cockpit Rápido SDR & 4 Tons</span>
        </button>
      </div>

      {/* ABA 1: SIMULAÇÃO DE DIÁLOGO E OS 4 BLOCOS PT-PT */}
      {activeMainTab === 'simulation' && (
        <div className="mt-5 animate-fadeIn">
          <PtPtDialogueSimulationView 
            lead={lead} 
            onUpdateLead={onUpdateLead} 
            compact={compact} 
          />
        </div>
      )}

      {/* ABA 2: COCKPIT SDR RÁPIDO COM GATILHOS DE TOM E PROXIMIDADE */}
      {activeMainTab === 'cockpit' && (
        <div className="animate-fadeIn">
      {/* Portugal B2B Trust Shield & Abrasileiramento Reverso */}
      <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-base">🇵🇹</span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Blindagem Portugal B2B: Abrasileiramento Reverso Ativo
              </h4>
              <p className="text-[11px] text-slate-400">
                Zero gírias brasileiras • Sítio web, equipa, telemóvel • Foco em ROI técnico e pacotes a partir de €599
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Check className="w-3 h-3" />
            PT-PT Impecável
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {/* Gancho de Proximidade Local */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" />
                  Âncora Local (3 Anos em Portugal)
                </span>
                <button
                  onClick={() => handleCopy(outreach.portugalLocalHook || 'Estou baseado cá em Portugal (a colaborar com empresas no eixo Lisboa / Porto há 3 anos no fuso de Lisboa)', 'localHook')}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedKey === 'localHook' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "{outreach.portugalLocalHook || 'Estou baseado cá em Portugal (a colaborar com empresas no eixo Lisboa / Porto há 3 anos no fuso de Lisboa)'}"
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">
              💡 Use na abertura para eliminar a sensação de aventureiro digital operando de fora.
            </span>
          </div>

          {/* Quebra de Preconceito / Desconfiança */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  Se perguntar: "Vocês são de fora / do Brasil?"
                </span>
                <button
                  onClick={() => handleCopy(outreach.antiBiasRebuttal || 'Estamos sediados e a operar diretamente cá em Portugal há mais de 3 anos, com suporte local no fuso horário de Lisboa e trabalho com empresas nacionais. A nossa entrega é focada nas exigências fiscais e no perfil do consumidor português. O nosso foco é a eficácia técnica e o retorno direto da vossa empresa.', 'antiBias')}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                >
                  {copiedKey === 'antiBias' ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-3">
                "{outreach.antiBiasRebuttal || 'Estamos sediados e a operar diretamente cá em Portugal há mais de 3 anos, com suporte local no fuso horário de Lisboa...'}"
              </p>
            </div>
            <span className="text-[10px] text-slate-400 mt-2">
              💡 Resposta firme e segura: sem pedir desculpas, foco em rigor corporativo e entrega.
            </span>
          </div>
        </div>

        {/* Vocabulário Filtrado */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <span className="text-slate-400 font-medium">Terminologia rigorosa aplicada:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[10px]">Equipa (não equipe)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[10px]">Sítio Web (não site)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[10px]">Telemóvel (não celular)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[10px]">Loja Online (não loja virtual)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 font-mono text-[10px]">Portes (não frete)</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[10px]">Moeda: Euros (€)</span>
          </div>
        </div>
      </div>

      {/* Tone Selection Tabs */}
      <div className="mt-5">
        <label className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2.5">
          <Sliders className="w-3.5 h-3.5 text-amber-700" />
          Selecione o Ângulo Psicológico de Abordagem:
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            {
              id: 'executivo_ceo',
              label: 'Direto ao Sócio / CEO',
              desc: 'Foco em tempo & margem',
              icon: Briefcase
            },
            {
              id: 'gatilho_gap',
              label: 'Gatilho de GAP Operacional',
              desc: 'Aponta o furo no site/canal',
              icon: Zap
            },
            {
              id: 'estudo_caso',
              label: 'Estudo de Caso & Prova',
              desc: 'Métricas reais do nicho',
              icon: Flame
            },
            {
              id: 'quebra_padrao',
              label: 'Quebra de Padrão',
              desc: 'Sem enrolação, anti-vendedor',
              icon: Target
            }
          ].map((tone) => {
            const Icon = tone.icon;
            const isSelected = selectedTone === tone.id;
            return (
              <button
                key={tone.id}
                onClick={() => handleToneChange(tone.id as SdrOutreachTone)}
                disabled={isGenerating}
                className={`flex flex-col p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30 text-slate-900 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-700' : 'text-slate-500'}`} />
                  <span className={`text-xs font-black leading-tight ${isSelected ? 'text-amber-950' : 'text-slate-800'}`}>
                    {tone.label}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 leading-tight">
                  {tone.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: WhatsApp + Phone Pitch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
        {/* Left Column (7 cols): WhatsApp Ready-to-Send Icebreaker */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Mensagem de WhatsApp (Anti-Bloqueio)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sem links invasivos ou palavras de spam • Foco em micro-resposta
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(editableWa, 'wa')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  title="Copiar texto"
                >
                  {copiedKey === 'wa' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Editable WhatsApp Box */}
            <div className="relative">
              <textarea
                value={editableWa}
                onChange={(e) => setEditableWa(e.target.value)}
                rows={7}
                className="w-full text-xs sm:text-sm font-sans text-slate-800 bg-white border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y leading-relaxed shadow-inner"
                placeholder="Carregando mensagem personalizada..."
              />
              <div className="flex justify-between items-center text-[11px] text-slate-600 mt-1 px-1">
                <span>{editableWa.length} caracteres • Pronto para disparo</span>
                <span>Alvo: {primaryPhone || 'Telefone não detectado'}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-200">
            <span className="text-xs text-slate-600 font-medium hidden sm:inline">
              CTA com baixo atrito emocional
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {waUrl ? (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                  <span>Disparar no WhatsApp</span>
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 text-slate-500 font-bold text-xs rounded-xl cursor-not-allowed"
                >
                  <span>Sem Telefone Cadastrado</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Call Anchor & 24h Followup */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Cold Call Anchor Box */}
          <div className="bg-amber-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-200/80 text-amber-950 flex items-center justify-center font-bold">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    Âncora Verbal da Ligação (20 Segundos)
                  </h4>
                </div>

                <button
                  onClick={() => handleCopy(editableAnchor, 'anchor')}
                  className="p-1.5 bg-white/80 hover:bg-white text-slate-700 rounded-md border border-amber-200 transition-colors cursor-pointer"
                  title="Copiar âncora"
                >
                  {copiedKey === 'anchor' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <p className="text-xs sm:text-sm font-medium text-slate-800 italic leading-relaxed bg-white/80 p-3 rounded-xl border border-amber-200/60 shadow-2xs">
                {editableAnchor}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between">
              <span className="text-[11px] text-amber-900 font-bold">
                Objetivo: Desarmar em 15s
              </span>
              {hasPhone && (
                <a
                  href={`tel:${cleanPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  <span>Ligar {primaryPhone}</span>
                </a>
              )}
            </div>
          </div>

          {/* 24h Followup Snippet */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Follow-up se não responder (24h)
                </h5>
              </div>
              <button
                onClick={() => handleCopy(editableFollowup, 'followup')}
                className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Copiar follow-up"
              >
                {copiedKey === 'followup' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
              {editableFollowup}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Objection Killer & Niche Diagnosis */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Objection Killer */}
        <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h5 className="text-xs font-black uppercase tracking-wider text-rose-950">
                Resposta Cirúrgica à Objeção #1 do Nicho
              </h5>
            </div>
            <button
              onClick={() => handleCopy(outreach.objectionKiller, 'obj')}
              className="p-1 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
              title="Copiar resposta"
            >
              {copiedKey === 'obj' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white/90 p-3 rounded-xl border border-rose-200/60">
            {outreach.objectionKiller}
          </p>
        </div>

        {/* Niche Pain Diagnosis */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Target className="w-4 h-4 text-blue-700" />
            <h5 className="text-xs font-black uppercase tracking-wider text-blue-950">
              Diagnóstico do Gargalo Invisível ({outreach.nicheDetected})
            </h5>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed bg-white/90 p-3 rounded-xl border border-blue-200/60">
            {outreach.nichePainDiagnosis}
          </p>
        </div>
      </div>

      {/* Custom Refinement Bar with AI */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2.5">
        <input
          type="text"
          value={customDirective}
          onChange={(e) => setCustomDirective(e.target.value)}
          placeholder="Pedir ajuste à IA (ex: 'Deixar ainda mais informal' ou 'Citar que temos cliente pronto esta semana')..."
          className="flex-1 w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRegenerate();
          }}
        />
        <button
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Refinar com IA</span>
        </button>
      </div>
        </div>
      )}
    </div>
  );
};
