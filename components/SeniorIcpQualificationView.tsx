import React, { useState } from 'react';
import { 
  Target, ShieldCheck, Sparkles, Copy, Check, PhoneCall, Clock, 
  AlertTriangle, RefreshCw, CheckCircle2, Building2, Globe, Share2, 
  Phone, MapPin, Zap, Flame, ExternalLink, Info
} from 'lucide-react';
import { Lead, BusinessProfile, SeniorIcpQualification } from '../types';
import { 
  classifyLeadWithSeniorIcpPrompt, 
  generateHeuristicSeniorIcpQualification,
  formatSeniorIcpQualificationMarkdown 
} from '../services/seniorIcpQualificationService';

interface SeniorIcpQualificationViewProps {
  lead: Lead;
  businessProfile?: BusinessProfile;
  onLeadUpdated?: (lead: Lead) => void;
  onOpenTeleprompter?: (lead: Lead) => void;
}

export const SeniorIcpQualificationView: React.FC<SeniorIcpQualificationViewProps> = ({
  lead,
  businessProfile,
  onLeadUpdated,
  onOpenTeleprompter
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [hookCopied, setHookCopied] = useState<boolean>(false);

  // Inicializa ou usa a qualificação já existente no lead
  const qualification: SeniorIcpQualification = lead.seniorIcpQualification || generateHeuristicSeniorIcpQualification(lead, businessProfile);

  const sdrGuide = qualification.sdrTrainingGuide || {
    openingHook: lead.identifiedPain 
      ? `Vi que o site de ${lead.name} ainda apresenta ${lead.identifiedPain.toLowerCase()}, e preparamos uma solução direta.`
      : `Vi que a ${lead.name} tem grande atuação comercial na região, mas identifiquei pontos no fluxo de atendimento digital...`,
    verdictWhyCall: qualification.analystVerdict,
    suggestedNextStep: qualification.commercialDecision === 'LIGAR AGORA' 
      ? `Ligar no ${lead.phone || 'canal direto'} e oferecer diagnóstico de 5 min.`
      : `Nutrir contato ou mapear decisor antes de ligar.`
  };

  const handleCopyHook = () => {
    navigator.clipboard.writeText(sdrGuide.openingHook);
    setHookCopied(true);
    setTimeout(() => setHookCopied(false), 2500);
  };

  const handleRunAiQualification = async () => {
    setIsLoading(true);
    try {
      const result = await classifyLeadWithSeniorIcpPrompt(lead, businessProfile);
      const updatedLead: Lead = {
        ...lead,
        seniorIcpQualification: result,
        // Alinha o icpScore principal se necessário
        icpScore: result.finalScore
      };
      if (onLeadUpdated) {
        onLeadUpdated(updatedLead);
      }
    } catch (e) {
      console.error("Erro ao rodar qualificação de IA:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    const markdown = formatSeniorIcpQualificationMarkdown(qualification);
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Cores e badges baseados na decisão comercial
  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'LIGAR AGORA':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700',
          badgeBg: 'bg-emerald-600 text-white',
          icon: <PhoneCall className="w-5 h-5 text-emerald-600" />,
          title: 'LIGAR AGORA',
          desc: 'Aderência máxima ao ICP. O time comercial deve entrar em contato imediatamente!'
        };
      case 'AGUARDAR':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-800',
          badgeBg: 'bg-amber-600 text-white',
          icon: <Clock className="w-5 h-5 text-amber-600" />,
          title: 'AGUARDAR',
          desc: 'Potencial moderado. Mapear o decisor ou nutrir assincronamente antes da ligação direta.'
        };
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-700',
          badgeBg: 'bg-rose-600 text-white',
          icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
          title: 'DESCARTAR',
          desc: 'Fora do ICP prioritário. Não gastar tempo de outbound ativo neste momento.'
        };
    }
  };

  const decisionInfo = getDecisionBadge(qualification.commercialDecision);

  return (
    <div className="space-y-6">
      
      {/* Top Banner de Apresentação e Ações */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-amber-400" />
              Matriz Sênior 100 Pts
            </span>
            <span className="text-xs text-slate-300">Inteligência Comercial & Decisão de Outbound</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black mt-1 text-white flex items-center gap-2">
            <span>{lead.name}</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Classificação rigorosa de aderência comercial e tempo de retorno de prospecção.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleCopyMarkdown}
            className="flex-1 md:flex-initial px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            title="Copiar relatório formatado no padrão solicitado"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? "Relatório Copiado!" : "Copiar Relatório"}</span>
          </button>

          <button
            onClick={handleRunAiQualification}
            disabled={isLoading}
            className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? "Avaliando..." : "Avaliar com IA"}</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Score, Decisão Comercial & Tipo de Negócio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Score Final */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Score Final de ICP</span>
            <Target className="w-4 h-4 text-indigo-600" />
          </div>
          
          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-4xl sm:text-5xl font-black ${
              qualification.finalScore >= 75 ? 'text-emerald-600' : qualification.finalScore >= 50 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {qualification.finalScore}
            </span>
            <span className="text-sm text-slate-400 font-bold">/ 100 pts</span>
          </div>

          <div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-700 ${
                  qualification.finalScore >= 75 ? 'bg-emerald-500' : qualification.finalScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${qualification.finalScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-semibold">
              <span>0 (Descarte)</span>
              <span>50 (Régua)</span>
              <span>100 (Excelente)</span>
            </div>
          </div>
        </div>

        {/* Card 2: Decisão Comercial */}
        <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${decisionInfo.bg}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Decisão Comercial</span>
            {decisionInfo.icon}
          </div>

          <div className="my-2">
            <span className={`inline-block px-3 py-1 rounded-xl text-sm font-black tracking-wide ${decisionInfo.badgeBg}`}>
              {decisionInfo.title}
            </span>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {decisionInfo.desc}
            </p>
          </div>

          {qualification.commercialDecision === 'LIGAR AGORA' && onOpenTeleprompter && (
            <button
              onClick={() => onOpenTeleprompter(lead)}
              className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Abrir Teleprompter de Ligação</span>
            </button>
          )}
        </div>

        {/* Card 3: Tipo de Negócio & Trava de Segurança */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Negócio</span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>

          <div className="my-2">
            <span className="inline-block px-3 py-1 rounded-xl text-xs font-black bg-indigo-50 border border-indigo-200 text-indigo-900">
              {qualification.businessType}
            </span>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
              {qualification.businessType === 'Fabricante/Indústria' && 'Produz os bens internamente. Alta margem e alinhamento prioritário.'}
              {qualification.businessType === 'Distribuidor' && 'Atua em escala B2B para revendedores e clientes de volume.'}
              {qualification.businessType === 'Revendedor/Lojista' && 'Foco em varejo ou venda pontual ao consumidor final.'}
              {qualification.businessType === 'Prestador de Serviço' && 'Fornece serviços e projetos corporativos.'}
            </p>
          </div>

          {qualification.isPenalizedBySafetyRule && (
            <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Trava Ativada:</strong> Volume de dados ≠ Qualidade. Pontuação limitada em até 50/100 devido a inconsistência de canais essenciais.
              </span>
            </div>
          )}
        </div>

      </div>

      {/* GUIA RÁPIDO DE ABORDAGEM (TREINAMENTO SDR) */}
      <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border border-amber-200/90 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-amber-200/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-800">
              <Zap className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <span>Guia Rápido de Abordagem (Treinamento SDR)</span>
              </h3>
              <span className="text-[11px] text-amber-800">
                Sintetize o caminho para o sucesso da ligação com base na inteligência comercial
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyHook}
            className="px-3 py-1.5 bg-amber-100/80 hover:bg-amber-200/80 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            title="Copiar gancho de abertura da ligação"
          >
            {hookCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-amber-700" />}
            <span>{hookCopied ? "Gancho Copiado!" : "Copiar Gancho (Abertura)"}</span>
          </button>
        </div>

        {/* 1. Gancho Principal (Abertura) */}
        <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 uppercase tracking-wider mb-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Gancho Principal (Abertura da Ligação)</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-900 font-bold italic bg-amber-50/50 p-2.5 rounded-lg border-l-4 border-l-amber-500 leading-relaxed">
            "{sdrGuide.openingHook}"
          </p>
        </div>

        {/* 2 & 3: Parecer Final (Por que ligar) & Próximo Passo Sugerido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
              ⭐ Parecer Final (Por que ligar agora)
            </span>
            <p className="text-xs text-slate-800 leading-relaxed font-medium">
              {sdrGuide.verdictWhyCall}
            </p>
          </div>

          <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block mb-1">
              🎯 Próximo Passo Sugerido
            </span>
            <p className="text-xs text-slate-900 leading-relaxed font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{sdrGuide.suggestedNextStep}</span>
            </p>
          </div>
        </div>

        {/* 4. Tópicos Principais do Pitch */}
        {sdrGuide.pitchTopics && sdrGuide.pitchTopics.length > 0 && (
          <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/60 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 block mb-2">
              🎙️ 3 Tópicos Principais do Pitch (Direto ao Ponto)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {sdrGuide.pitchTopics.map((topic, i) => (
                <div key={i} className="bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 text-xs text-slate-800 font-medium">
                  <span className="font-bold text-amber-800 mr-1.5">#{i + 1}</span>
                  {topic}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Matriz Rápida de Objeções (Treinamento SDR) */}
        {sdrGuide.objections && sdrGuide.objections.length > 0 && (
          <div className="bg-white/90 p-4 rounded-xl border border-amber-300/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                Matriz Rápida de Objeções (Treinamento SDR)
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sdrGuide.objections.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-rose-700 flex items-start gap-1.5">
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-1.5 py-0.5 rounded">
                      Objeção {idx + 1}
                    </span>
                    <span>"{item.objection}"</span>
                  </div>
                  <div className="text-xs text-slate-800 bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-lg">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                      ✓ Como Contornar:
                    </span>
                    <p className="italic font-medium text-emerald-950 leading-relaxed">
                      "{item.howToOvercome}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detalhamento da Pontuação (Tabela e Critérios da Matriz 100 Pts) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>Detalhamento da Pontuação (Matriz de 8 Critérios)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Avaliação pormenorizada com nota, justificativa analítica e evidência real para cada pilar.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 self-start sm:self-auto">
            Total Avaliado: 100 pts
          </span>
        </div>

        {/* Tabela Responsiva */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Critério</th>
                <th className="py-3 px-4 text-center">Nota</th>
                <th className="py-3 px-4">Justificativa Analítica</th>
                <th className="py-3 px-4">Fonte / Evidência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {qualification.criteria.map((item, idx) => {
                const ratio = item.score / item.maxScore;
                return (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{item.criterion}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span className={`font-black text-sm ${
                          ratio >= 0.8 ? 'text-emerald-600' : ratio >= 0.5 ? 'text-amber-600' : 'text-slate-500'
                        }`}>
                          {item.score} <span className="text-slate-400 text-xs font-normal">/ {item.maxScore}</span>
                        </span>
                        <div className="w-12 bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${ratio >= 0.8 ? 'bg-emerald-500' : ratio >= 0.5 ? 'bg-amber-500' : 'bg-slate-400'}`}
                            style={{ width: `${Math.round(ratio * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 leading-relaxed max-w-xs sm:max-w-sm">
                      {item.justification}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                      {item.evidence.startsWith('http') ? (
                        <a 
                          href={item.evidence} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <span className="truncate">{item.evidence}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span>{item.evidence}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Box de Instrução da Trava de Segurança */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Regra de Segurança do ICP:</strong> O volume bruto de informações públicas na internet não infla a pontuação de leads que não atendem ao perfil de cliente ideal. Se o site for obsoleto ou se não houver canais diretos para o comercial converter, a nota final é travada automaticamente em até 50/100 para proteger o tempo do time de vendas.
        </div>
      </div>

    </div>
  );
};
