import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Flame, 
  AlertTriangle, 
  Smartphone, 
  Globe, 
  Award, 
  HelpCircle,
  Copy,
  Check,
  Building,
  UserCheck
} from 'lucide-react';
import { Lead } from '../types';

interface KitAlunoPanelProps {
  lead: Lead;
  country?: string;
}

export const KitAlunoPanel: React.FC<KitAlunoPanelProps> = ({ lead, country = 'Portugal' }) => {
  const [copiedText, setCopiedText] = React.useState<string | null>(null);

  const kit = lead.kitAluno;

  if (!kit) {
    return (
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
        <p className="text-sm text-slate-500">
          Dados do Kit de Prospecção não calculados para este lead.
        </p>
      </div>
    );
  }

  const { score, marketing, aderencia, nomes, requisitos } = kit;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getClasseBadge = (classe: 'A' | 'B' | 'C' | 'D') => {
    switch (classe) {
      case 'A':
        return {
          bg: 'bg-emerald-500 text-white border-emerald-600',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'Classe A · Lead Quente',
          ring: 'ring-emerald-400'
        };
      case 'B':
        return {
          bg: 'bg-blue-600 text-white border-blue-700',
          badge: 'bg-blue-50 text-blue-800 border-blue-300',
          label: 'Classe B · Lead Bom',
          ring: 'ring-blue-400'
        };
      case 'C':
        return {
          bg: 'bg-amber-500 text-white border-amber-600',
          badge: 'bg-amber-50 text-amber-800 border-amber-300',
          label: 'Classe C · Lead Fraco',
          ring: 'ring-amber-400'
        };
      case 'D':
      default:
        return {
          bg: 'bg-rose-500 text-white border-rose-600',
          badge: 'bg-rose-50 text-rose-800 border-rose-300',
          label: 'Classe D · Descartar',
          ring: 'ring-rose-400'
        };
    }
  };

  const classeConfig = getClasseBadge(score.classificacao);

  const getOportunidadeBadge = (op: 'alta' | 'media' | 'baixa') => {
    switch (op) {
      case 'alta':
        return {
          badge: 'bg-rose-50 text-rose-800 border-rose-300',
          label: 'Oportunidade Alta',
          desc: 'Não anuncia e site possui falhas graves de conversão'
        };
      case 'media':
        return {
          badge: 'bg-amber-50 text-amber-800 border-amber-300',
          label: 'Oportunidade Média',
          desc: 'Não anuncia, site navegável — cabe tráfego pago'
        };
      case 'baixa':
      default:
        return {
          badge: 'bg-slate-100 text-slate-700 border-slate-300',
          label: 'Oportunidade Baixa',
          desc: 'Já possui pixel de anúncio ativo (Meta ou Google)'
        };
    }
  };

  const opConfig = getOportunidadeBadge(marketing.oportunidade);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* 1. Header: Régua de Score Transparente */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-5 rounded-xl border border-indigo-900/60 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg border-2 ${classeConfig.bg} ${classeConfig.ring}`}>
              {score.classificacao}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  Régua de Score Transparente
                </span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${classeConfig.badge}`}>
                  {classeConfig.label}
                </span>
              </div>
              <h3 className="text-xl font-black text-white mt-0.5">
                {score.score} <span className="text-sm font-normal text-indigo-200">/ 100 pontos</span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${opConfig.badge}`}>
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span>{opConfig.label}</span>
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-4">
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                score.score >= 75 ? 'bg-emerald-500' :
                score.score >= 50 ? 'bg-blue-500' :
                score.score >= 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>

        {/* Justificativa textual cirúrgica */}
        <p className="mt-3 text-xs text-indigo-100/90 leading-relaxed bg-indigo-950/60 p-3 rounded-lg border border-indigo-900/40">
          <span className="font-bold text-amber-300">Parecer do Score: </span>
          {score.justificativaNota}
        </p>

        {/* Alerta de Site Morto */}
        {score.siteMorto && (
          <div className="mt-3 bg-rose-950/80 border border-rose-500/60 p-3 rounded-lg flex items-start gap-2.5 text-rose-200 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-black text-white uppercase tracking-wider block">
                🚨 Site fora do ar (Gancho de Ouro)!
              </span>
              <span>
                Esta empresa cadastrou um link no Google Maps, mas o site não abre (erro de DNS/servidor). Aborde oferecendo a reconstrução e modernização imediata da presença online!
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Higienização de Nomes & Extração de Decisor (lib/nome.mjs) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Building className="w-4 h-4 text-indigo-600" />
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
            Higienização de Nome & Contato Natural ao Telefone
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              Nome Original no Google Maps:
            </span>
            <span className="text-xs font-medium text-slate-700 block line-clamp-2">
              {nomes.nomeOriginalMaps}
            </span>
          </div>

          <div className="p-3 bg-indigo-50/70 rounded-lg border border-indigo-200">
            <span className="text-[10px] font-bold text-indigo-600 uppercase block mb-1">
              Nome Limpo para Falar ao Telefone:
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-950">
                {nomes.nomeEmpresaLimpo}
              </span>
              <button
                onClick={() => handleCopy(nomes.nomeEmpresaLimpo, 'nomeLimpo')}
                className="text-xs text-indigo-600 hover:text-indigo-800 p-1"
                title="Copiar nome limpo"
              >
                {copiedText === 'nomeLimpo' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Se encontrou profissional citado (ex: Dr. / Dra.) */}
        {nomes.nomePessoaCitado && (
          <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[11px] font-bold text-emerald-900 block">
                Profissional de Autoridade Mapeado: <strong className="underline">{nomes.nomePessoaCitado}</strong>
              </span>
              <p className="text-xs text-emerald-800 mt-1">
                Sugestão de Abertura: &quot;{nomes.sugestaoAbordagem}&quot;
              </p>
            </div>
            <button
              onClick={() => handleCopy(nomes.sugestaoAbordagem, 'sugestao')}
              className="text-xs px-2 py-1 bg-white rounded border border-emerald-300 text-emerald-700 font-bold hover:bg-emerald-100 flex items-center gap-1 shrink-0"
            >
              {copiedText === 'sugestao' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>Copiar</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Tabela de Sinais Matemáticos do Score (lib/score.mjs) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Detalhamento dos 9 Sinais do Score
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Total Máximo: 100 pontos
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {Object.entries(score.sinais).map(([chave, sinal]) => {
            const rotulos: Record<string, string> = {
              site_vivo: 'Site no Ar',
              instagram: 'Instagram',
              email: 'E-mail',
              telefone: 'Telefone',
              whatsapp: 'WhatsApp',
              reputacao: 'Reputação Google (4.0+ e 10+)',
              cnpj_nif: country.toLowerCase().includes('portugal') ? 'NIF / NIPC Portugal' : 'CNPJ / Registro Fiscal',
              linkedin: 'LinkedIn',
              endereco: 'Endereço Físico'
            };

            const pesos: Record<string, number> = {
              site_vivo: 25,
              instagram: 15,
              email: 15,
              telefone: 10,
              whatsapp: 10,
              reputacao: 10,
              cnpj_nif: 5,
              linkedin: 5,
              endereco: 5
            };

            const label = rotulos[chave] || chave;
            const pesoMax = pesos[chave] || 0;

            return (
              <div 
                key={chave}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${
                  sinal.tem 
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {sinal.tem ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span className="font-semibold truncate">{label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                    sinal.tem ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {sinal.tem ? `+${sinal.pontos}` : `0 / ${pesoMax}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Diagnóstico de Marketing & Oportunidade (lib/marketing.mjs) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Sinais de Marketing & Detecção de Tráfego Pago
            </h4>
          </div>

          <a
            href={marketing.metaAdsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1 shadow-xs transition-colors"
          >
            <span>Biblioteca de Anúncios Meta</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Meta Pixel */}
          <div className={`p-2.5 rounded-lg border text-center ${
            marketing.pixelMeta ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="text-[10px] font-bold uppercase block text-slate-400">Meta Pixel</span>
            <span className="text-xs font-black mt-0.5 block">
              {marketing.pixelMeta ? '✅ Instalado' : '❌ Ausente'}
            </span>
          </div>

          {/* Google Ads */}
          <div className={`p-2.5 rounded-lg border text-center ${
            marketing.pixelGoogle ? 'bg-indigo-50 border-indigo-200 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="text-[10px] font-bold uppercase block text-slate-400">Google Ads</span>
            <span className="text-xs font-black mt-0.5 block">
              {marketing.pixelGoogle ? '✅ Tag Ativa' : '❌ Ausente'}
            </span>
          </div>

          {/* Analytics */}
          <div className={`p-2.5 rounded-lg border text-center ${
            marketing.analytics ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <span className="text-[10px] font-bold uppercase block text-slate-400">Analytics/GTM</span>
            <span className="text-xs font-black mt-0.5 block">
              {marketing.analytics ? '✅ GA4/GTM' : '❌ Não Detectado'}
            </span>
          </div>

          {/* Mobile */}
          <div className={`p-2.5 rounded-lg border text-center ${
            marketing.mobile ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <span className="text-[10px] font-bold uppercase block text-slate-400">Telemóvel / Mobile</span>
            <span className="text-xs font-black mt-0.5 block">
              {marketing.mobile ? '📱 Adaptado' : '⚠️ Não Adaptado'}
            </span>
          </div>

          {/* Botão WhatsApp */}
          <div className={`p-2.5 rounded-lg border text-center ${
            marketing.botaoWhatsapp ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <span className="text-[10px] font-bold uppercase block text-slate-400">Botão WhatsApp</span>
            <span className="text-xs font-black mt-0.5 block">
              {marketing.botaoWhatsapp ? '💬 No Site' : '⚠️ Sem Botão'}
            </span>
          </div>

          {/* Copyright */}
          <div className={`p-2.5 rounded-lg border text-center ${
            marketing.desatualizado ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <span className="text-[10px] font-bold uppercase block text-slate-400">Rodapé Copyright</span>
            <span className="text-xs font-black mt-0.5 block">
              {marketing.anoCopyright ? `© ${marketing.anoCopyright}` : 'Não Informado'}
            </span>
          </div>
        </div>

        {/* Justificativa Comercial da Oportunidade */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900">Estratégia de Venda Recomendada: </strong>
          {marketing.justificativaOportunidade}
        </div>
      </div>

      {/* 5. Aderência ao Nicho & Requisitos de Corte (lib/aderencia.mjs & lib/requisitos.mjs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Aderência */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Filtro de Aderência do Nicho
            </span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
              aderencia.veredito === 'sim' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
              aderencia.veredito === 'nao' ? 'bg-rose-50 text-rose-700 border-rose-300' :
              'bg-slate-100 text-slate-700 border-slate-300'
            }`}>
              {aderencia.veredito === 'sim' ? 'Confirmado' : aderencia.veredito === 'nao' ? 'Descartado' : 'Indefinido'}
            </span>
          </div>
          <p className="text-xs text-slate-600">
            {aderencia.motivo}
          </p>
        </div>

        {/* Requisitos de Corte */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800">
              Requisitos Eliminatórios
            </span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
              requisitos.aprovado ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
            }`}>
              {requisitos.aprovado ? 'Aprovado' : 'Reprovado'}
            </span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>
              <span className="font-semibold text-slate-700">Tipo de Linha: </span>
              {requisitos.tipoTelefone === 'telemovel' ? '📱 Telemóvel / Celular Direto' : 
               requisitos.tipoTelefone === 'fixo' ? '☎️ Telefone Fixo (Recepção)' : 'Central / Não Identificado'}
            </div>
            {requisitos.motivosReprovacao.length > 0 && (
              <div className="text-rose-600 font-medium text-[11px]">
                {requisitos.motivosReprovacao.join(' • ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitAlunoPanel;
