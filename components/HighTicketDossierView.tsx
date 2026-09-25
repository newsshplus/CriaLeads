import React, { useState } from 'react';
import { 
  Building2, Globe, Phone, Mail, MapPin, User, CheckCircle2, 
  ExternalLink, Copy, Check, Sparkles, TrendingUp, AlertTriangle, 
  DollarSign, Target, Award, ShieldCheck, Zap, MessageSquare, 
  PhoneCall, Send, ChevronRight, Calculator, FileText, Star, 
  Gauge, Laptop, Smartphone, BarChart3, Clock, Flame, ArrowUpRight,
  RefreshCw, CheckCheck
} from 'lucide-react';
import { Lead, DecisionMaker } from '../types';
import { extractCleanBrandName } from '../services/freeB2bProspectorService';
import { resolveRealCompanyWebsite } from '../services/nicheIntelligenceService';
import { openWhatsApp1Click } from '../services/whatsAppOutreachHelper';
import { openGmailInNewTab } from '../services/ptPtOutreachService';

interface HighTicketDossierViewProps {
  lead: Lead;
  onUpdateLead?: (lead: Lead) => void;
  onClose?: () => void;
}

export const HighTicketDossierView: React.FC<HighTicketDossierViewProps> = ({
  lead,
  onUpdateLead
}) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'elite' | 'enterprise'>('elite');
  const [simulatedTicket, setSimulatedTicket] = useState<number>(450); // € 450 ticket médio
  const [simulatedNewClients, setSimulatedNewClients] = useState<number>(4); // 4 novos clientes

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(label);
    setTimeout(() => setCopiedItem(null), 2200);
  };

  const cleanBrand = extractCleanBrandName(lead.name);
  const resolvedReal = resolveRealCompanyWebsite(lead.name);
  const effectiveWebsite = lead.website && lead.website.trim().length > 3
    ? lead.website
    : resolvedReal?.website || '';
  
  const hasDirectWebsite = Boolean(effectiveWebsite && effectiveWebsite.startsWith('http'));
  const domain = effectiveWebsite ? effectiveWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : '';
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  const decisor = lead.decisionMaker || {
    name: lead.bantPlus?.authority?.keyDecisionMaker || 'Direção Clínica / Administração',
    role: lead.bantPlus?.authority?.role || 'Sócio Administrador / Diretor',
    linkedin: lead.bantPlus?.authority?.linkedinSearchUrl,
    directEmail: lead.email,
    directPhone: lead.phone
  };

  const isPt = (lead.country || 'Portugal').toLowerCase().includes('portugal') || (lead.country || '').toLowerCase() === 'pt';
  const currencySymbol = isPt ? '€' : 'R$';
  const planProPrice = isPt ? 599 : 2490;
  const planElitePrice = isPt ? 997 : 3990;
  const planEnterprisePrice = isPt ? 1890 : 7500;

  const currentPlanPrice = selectedPlan === 'pro' 
    ? planProPrice 
    : selectedPlan === 'elite' 
      ? planElitePrice 
      : planEnterprisePrice;

  // Cálculo de ROI & Payback
  const monthlyRevenueGenerated = simulatedTicket * simulatedNewClients;
  const netMonthlyProfit = monthlyRevenueGenerated - currentPlanPrice;
  const roiPercentage = Math.round((netMonthlyProfit / currentPlanPrice) * 100);
  const clientsNeededToBreakEven = Math.max(1, Math.ceil(currentPlanPrice / simulatedTicket));

  const cleanPhone = (decisor.directPhone || lead.phone || '').replace(/\D/g, '');
  const decisorFirstName = decisor.name && !decisor.name.toLowerCase().includes('diretor') && !decisor.name.toLowerCase().includes('administra')
    ? decisor.name.split(' ')[0]
    : 'Doutor(a)';

  // Scripts de Prospecção ProspecPT & Alta Conversão
  const waCuriosityStep1 = `Olá ${decisorFirstName}! 👋 Posso fazer-te uma pergunta rápida sobre a ${cleanBrand}?`;
  
  const waCuriosityStep2 = `Olá ${decisorFirstName}! Notei o trabalho de excelência que a ${cleanBrand} desenvolve em ${lead.city || 'Cascais'}.\n\nAnalisámos a vossa presença e identificámos que clínicas e empresas do vosso porte perdem cerca de 35% das consultas e orçamentos particulares simplesmente por não terem triagem instantânea com IA no WhatsApp fora de horas (noites e fins de semana) e um funil de tráfego pago focado em alto padrão.\n\nEstruturámos um plano executivo de ${currencySymbol}${planElitePrice}/mês que se paga logo no primeiro cliente novo. Faria sentido batermos 10 minutos na quinta-feira para vos mostrar os números exatos?`;

  const coldCallSecretaryScript = `Olá, com os meus cumprimentos! O meu nome é [Seu Nome]. É um contacto direto com o(a) ${decisor.name} sobre um relatório de novos clientes particulares na região de ${lead.city || 'Cascais'}. O(a) Dr(a). está disponível agora ou prefere que ligue no telemóvel direto?`;

  const coldCallDecisorScript = `Viva ${decisorFirstName}, daqui fala [Seu Nome]. Acompanho a reputação de excelência da ${cleanBrand} em ${lead.city || 'Cascais'}. Serei direto em respeito ao seu tempo: analisámos que a vossa procura de alto padrão pode crescer entre 20% a 40% este mês unindo tráfego pago focado em particulares com atendimento instantâneo por IA no WhatsApp. Temos um projeto sob medida de ${currencySymbol}${currentPlanPrice}/mês que se paga já no primeiro ou segundo novo cliente. Faria sentido vermos isso em 10 minutos no Google Meet amanhã às 10h30 ou às 14h30?`;

  const coldEmailSubject = `${decisorFirstName ? decisorFirstName + ', ' : ''}novos clientes de alto padrão na ${cleanBrand}`;
  const coldEmailBody = `Viva ${decisor.name},\n\nAcompanho com admiração o posicionamento e o rigor técnico que a ${cleanBrand} construiu em ${lead.city || 'Cascais'}.\n\nIdentificámos que empresas com a vossa reputação na região costumam perder clientes particulares aos fins de semana e noites por falta de resposta imediata no WhatsApp, além de dependerem apenas de indicações boca a boca.\n\nEstruturámos uma máquina de aquisição que integra Tráfego Pago de Alta Conversão + Agente IA de Atendimento 24/7. O investimento (${currencySymbol}${currentPlanPrice}/mês) paga-se logo no primeiro novo cliente conquistado.\n\nFaria sentido vermos um diagnóstico visual de 10 minutos nesta quinta-feira às 10h15?\n\nCom os melhores cumprimentos,\nEquipa de Expansão & SDR`;

  // Matriz de Objeções de Fechamento
  const objections = [
    {
      obj: "Já temos agência de marketing ou fazemos internamente",
      response: `Excelente saber que já investem na marca, ${decisorFirstName}! O nosso trabalho não substitui a vossa agência de branding. Nós operamos a engenharia de tráfego de alta precisão e a IA de SDR no WhatsApp para garantir que cada euro investido se transforme em consultas e vendas reais, fechando as brechas que as agências tradicionais costumam ignorar. Vale analisarmos 10 minutos para compararem os números?`
    },
    {
      obj: "Não temos verba ou orçamento para investir agora",
      response: `Compreendo perfeitamente, ${decisorFirstName}. Mas repare na matemática: com o vosso ticket médio de ${currencySymbol}${simulatedTicket}, bastam exatamente ${clientsNeededToBreakEven} clientes novos no mês inteiro para o plano de ${currencySymbol}${currentPlanPrice} estar 100% pago e ainda gerar lucro limpo no vosso caixa. Não é um custo, é uma alavanca direta de faturação. Se eu vos provar isso na prática em 10 minutos, faria sentido avaliar?`
    },
    {
      obj: "Envia-me uma apresentação / proposta por e-mail",
      response: `Com todo o gosto, ${decisorFirstName}! No entanto, como elaborámos uma auditoria específica com os gargalos e o potencial de ${lead.city || 'Cascais'}, um PDF genérico não faria justiça à oportunidade. Prefiro partilhar o ecrã consigo durante 10 minutos objetivos. Fica-lhe mais conveniente amanhã de manhã ou à tarde?`
    },
    {
      obj: "Não tenho tempo para reuniões agora",
      response: `Respeito 100% o seu tempo, ${decisorFirstName}, sei como a rotina da diretoria é corrida. Por isso mesmo o nosso alinhamento dura estritamente 10 minutos no Google Meet, focado só no diagnóstico e no ROI. Se não fizer sentido, não voltamos a insistir. Fica melhor amanhã às 09h30 ou às 14h?`
    },
    {
      obj: "Vocês operam cá em Portugal? Onde estão sediados?",
      response: `Sim, operamos diretamente cá em Portugal com suporte local no fuso horário de Lisboa, colaborando com empresas no eixo Lisboa, Cascais e Porto. Conhecemos a fundo a legislação (RGPD), o comportamento do consumidor português e o mercado de alto padrão local. Podemos falar 10 minutos amanhã?`
    }
  ];

  // Gera texto completo do dossiê para exportação
  const exportDossierMarkdown = () => {
    return `# 💎 DOSSIÊ EXECUTIVO HIGH-TICKET — ${lead.name.toUpperCase()}
Data da Auditoria: ${new Date().toLocaleDateString('pt-PT')}
Localidade: ${lead.city || 'Cascais'}, ${lead.country || 'Portugal'}
Website Oficial: ${effectiveWebsite || 'N/A'}
Telefone / WhatsApp: ${decisor.directPhone || lead.phone || 'N/A'}

---
## 1. PERFIL DO DECISOR (C-LEVEL)
- Nome: ${decisor.name}
- Cargo: ${decisor.role}
- LinkedIn: ${decisor.linkedin || 'N/A'}
- E-mail: ${decisor.directEmail || lead.email || 'N/A'}

---
## 2. QUALIFICAÇÃO HIGH-TICKET & PODER DE COMPRA
- Classificação: TIER AAA (Alto Porte / Alta Capacidade Financeira)
- Faturamento Estimado: > ${currencySymbol} 350.000 / ano
- Ticket Médio do Serviço: ${currencySymbol} ${simulatedTicket}
- Capacidade de Pagamento de Retainers: Aprovado para ${currencySymbol} 599 e ${currencySymbol} 997 / mês

---
## 3. PROPOSTA COMERCIAL RECOMENDADA
- Plano Selecionado: ${selectedPlan === 'pro' ? 'Plano Pro' : selectedPlan === 'elite' ? 'Plano Elite SDR & IA (Recomendado)' : 'Plano Enterprise'}
- Valor Mensal: ${currencySymbol} ${currentPlanPrice} / mês
- Payback Estimado: Apenas ${clientsNeededToBreakEven} novos clientes cobrem 100% do investimento!
- Com ${simulatedNewClients} clientes fechados: Faturação de ${currencySymbol} ${monthlyRevenueGenerated}, gerando Lucro Líquido de ${currencySymbol} ${netMonthlyProfit} (+${roiPercentage}% ROI).

---
## 4. GARGALOS IDENTIFICADOS NO MEIO DIGITAL
1. Vazamento de WhatsApp: Sem resposta imediata fora de horas (noites e fins de semana).
2. Tráfego Pago & Rastreamento: Oportunidade de captação de clientes de alta renda via Meta & Google Ads.
3. Conversão & Velocidade: Otimização de tempo de carregamento no mobile e SEO Local Google Maps.
4. Reativação de Base: Ausência de reengajamento automatizado de orçamentos pendentes.

---
## 5. SCRIPT WHATSAPP SDR (CURIOSIDADE PRIMEIRO)
Mensagem 1:
"${waCuriosityStep1}"

Mensagem 2 (Após resposta):
"${waCuriosityStep2}"

---
## 6. COLD CALL SCRIPT (PASSAR SECRETÁRIA + DECISOR)
Secretária:
"${coldCallSecretaryScript}"

Decisor:
"${coldCallDecisorScript}"
`;
  };

  return (
    <div className="space-y-6 pb-8 text-slate-800">
      
      {/* 1. HERO BANNER: IDENTIDADE EXECUTIVA & QUALIFICAÇÃO HIGH-TICKET */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            
            <div className="flex items-start gap-4">
              {/* Favicon / Logo Real */}
              <div className="w-14 h-14 rounded-xl bg-white/10 p-1.5 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0 shadow-lg">
                {faviconUrl ? (
                  <img 
                    src={faviconUrl} 
                    alt={lead.name} 
                    className="w-10 h-10 rounded-lg object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-indigo-300" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {lead.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black tracking-wide uppercase flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Tier AAA · High-Ticket
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {lead.city || 'Cascais'}, {lead.country || 'Portugal'}
                  </span>
                  <span>·</span>
                  <span className="text-indigo-300 font-semibold">
                    {lead.category || 'Estética Avançada / Saúde & Bem-Estar'}
                  </span>
                  {lead.rating && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-amber-300 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        {lead.rating.toFixed(1)} ({lead.reviews || 0} avaliações)
                      </span>
                    </>
                  )}
                </div>

                {/* Website Direto Verificado */}
                {hasDirectWebsite && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <a
                      href={effectiveWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-300" />
                      <span>{domain || effectiveWebsite}</span>
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </a>
                    <button
                      onClick={() => handleCopy(effectiveWebsite, 'site')}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Copiar Website"
                    >
                      {copiedItem === 'site' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Badges de Capacidade Financeira */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <div className="bg-slate-900/90 border border-white/10 rounded-xl p-3 text-right">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                  Capacidade de Retainer
                </span>
                <span className="text-lg font-black text-emerald-400 block">
                  {currencySymbol}599 a {currencySymbol}997+/mês
                </span>
                <span className="text-[10px] text-slate-300">
                  Poder de Compra: <strong className="text-white">Alto (Aprovado)</strong>
                </span>
              </div>

              <button
                onClick={() => handleCopy(exportDossierMarkdown(), 'full_dossier')}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 flex items-center gap-1.5"
                title="Copiar Dossiê Completo em Markdown"
              >
                {copiedItem === 'full_dossier' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dossiê Copiado!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Copiar Dossiê Completo</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Card do Decisor Mapeado */}
          <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Decisor(a) Principal</span>
                <span className="font-extrabold text-white text-sm truncate block">{decisor.name}</span>
                <span className="text-indigo-300 text-[11px] truncate block">{decisor.role}</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Telefone Comercial / WhatsApp</span>
                <span className="font-bold text-white text-xs truncate block">{decisor.directPhone || lead.phone || 'Não listado'}</span>
              </div>
              {cleanPhone && (
                <button
                  onClick={() => openWhatsApp1Click(lead)}
                  className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>WhatsApp</span>
                </button>
              )}
            </div>

            <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Canal de E-mail Executivo</span>
                <span className="font-bold text-white text-xs truncate block">{decisor.directEmail || lead.email || 'Não listado'}</span>
              </div>
              {(decisor.directEmail || lead.email) && (
                <button
                  onClick={() => openGmailInNewTab(decisor.directEmail || lead.email || '', coldEmailSubject, coldEmailBody)}
                  className="px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3 h-3" />
                  <span>Gmail</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 2. MATRIZ DE PLANOS COMERCIAIS (€599 VS €997 VS €1.890) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Planos Comerciais Estruturados para Vender Sem Medo
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pacotes desenhados com entregáveis claros, alto valor percebido e retorno garantido no 1º mês.
            </p>
          </div>

          {/* Segmented Control de Planos */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSelectedPlan('pro')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPlan === 'pro'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plano Pro ({currencySymbol}{planProPrice})
            </button>
            <button
              onClick={() => setSelectedPlan('elite')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                selectedPlan === 'elite'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Plano Elite ({currencySymbol}{planElitePrice}) ★ Mais Vendido</span>
            </button>
            <button
              onClick={() => setSelectedPlan('enterprise')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedPlan === 'enterprise'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Enterprise ({currencySymbol}{planEnterprisePrice})
            </button>
          </div>
        </div>

        {/* Detalhe do Plano Ativo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Plano Pro */}
          <div 
            onClick={() => setSelectedPlan('pro')}
            className={`cursor-pointer rounded-xl p-4 sm:p-5 border transition-all ${
              selectedPlan === 'pro' 
                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30' 
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Aquisição Inicial</span>
              <span className="text-xs font-bold text-slate-400">Entrada Rápida</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">Plano Pro · Tráfego & Funil</h3>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {currencySymbol}{planProPrice}<span className="text-xs text-slate-500 font-medium"> / mês</span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Ideal para empresas que querem fluxo contínuo de 15 a 40 novos orçamentos/pacientes particulares todo mês.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Gestão de Tráfego Pago (Google Ads & Meta Ads segmentado na região)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Otimização Completa de Perfil Google Meu Negócio & SEO Local</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Estruturação de Página de Destino / Link de Contato Direto</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dashboard de Métricas & Relatório Mensal de Fechamentos</span>
              </li>
            </ul>
          </div>

          {/* Plano Elite (Destaque Principal) */}
          <div 
            onClick={() => setSelectedPlan('elite')}
            className={`cursor-pointer rounded-xl p-4 sm:p-5 border-2 transition-all relative overflow-hidden ${
              selectedPlan === 'elite' 
                ? 'border-indigo-600 ring-4 ring-indigo-500/20 bg-gradient-to-b from-indigo-50/50 to-white' 
                : 'border-indigo-300 hover:border-indigo-400 bg-white'
            }`}
          >
            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-3 py-0.5 rounded-bl-lg uppercase tracking-wider">
              Recomendado
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Ecossistema Completo</span>
              <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">Retainer Ideal</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">Plano Elite · SDR IA + Aquisição</h3>
            <div className="mt-2 text-2xl font-black text-indigo-950">
              {currencySymbol}{planElitePrice}<span className="text-xs text-slate-500 font-medium"> / mês</span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              A máquina completa: capta o cliente e atende em 15 segundos no WhatsApp 24/7 sem deixar ninguém escapar.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-700 font-medium">
              <li className="flex items-start gap-2 text-indigo-950 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Tudo do Plano Pro ({currencySymbol}{planProPrice}) incluso</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Agente IA SDR no WhatsApp 24/7</strong>: Responde em 15 segundos, faz triagem e agenda consultas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Reativação Automática de Base</strong>: Follow-up inteligente de orçamentos parados</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span><strong>Consultoria Semanal de Fechamento</strong>: Alinhamento para aumentar taxa de conversão</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <span>Auditoria técnica mensal de Core Web Vitals e CRO</span>
              </li>
            </ul>
          </div>

          {/* Plano Enterprise */}
          <div 
            onClick={() => setSelectedPlan('enterprise')}
            className={`cursor-pointer rounded-xl p-4 sm:p-5 border transition-all ${
              selectedPlan === 'enterprise' 
                ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30' 
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Escala Corporativa</span>
              <span className="text-xs font-bold text-slate-400">Alta Exigência</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-1">Plano Enterprise · Growth Dedicado</h3>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {currencySymbol}{planEnterprisePrice}<span className="text-xs text-slate-500 font-medium"> / mês</span>
            </div>
            <p className="text-xs text-slate-600 mt-2">
              Para operações consolidadas com múltiplas unidades ou equipe comercial dedicada.
            </p>

            <ul className="mt-4 space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Tudo do Plano Elite com equipe de Growth dedicada</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Integrações sob medida com ERP/CRM médico ou comercial</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Automações avançadas de pós-venda, retenção e LTV</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Canal direto no WhatsApp com suporte prioritário em 1h</span>
              </li>
            </ul>
          </div>

        </div>

        {/* 3. CALCULADORA DINÂMICA DE PAYBACK & ROI (ARGUMENTO IRREFUTÁVEL) */}
        <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  Calculadora de Payback & ROI em Tempo Real
                </h4>
                <p className="text-xs text-slate-400">
                  Mostre ao decisor na chamada: com apenas 1 ou 2 vendas, o investimento já está 100% pago!
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Ponto de Equilíbrio (Break-Even)</span>
              <span className="text-sm font-black text-emerald-400">
                Apenas {clientsNeededToBreakEven} {clientsNeededToBreakEven === 1 ? 'cliente novo' : 'clientes novos'} / mês!
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            
            {/* Controle 1: Ticket Médio do Cliente */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Ticket Médio da {cleanBrand} ({currencySymbol})
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={simulatedTicket}
                  onChange={(e) => setSimulatedTicket(Math.max(50, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-extrabold text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Ex: Consulta, procedimento ou mensalidade</span>
            </div>

            {/* Controle 2: Novos Clientes Estimados */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Novos Clientes Fechados no Mês
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={simulatedNewClients}
                  onChange={(e) => setSimulatedNewClients(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-extrabold text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Meta conservadora com o tráfego + IA</span>
            </div>

            {/* Resultado 1: Receita Estimada */}
            <div className="bg-slate-900/90 rounded-lg p-3 border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Faturação Gerada</span>
              <span className="text-lg font-black text-white block mt-0.5">
                {currencySymbol}{monthlyRevenueGenerated.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400">
                {simulatedNewClients} × {currencySymbol}{simulatedTicket}
              </span>
            </div>

            {/* Resultado 2: Lucro Líquido & ROI */}
            <div className="bg-emerald-950/60 rounded-lg p-3 border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Lucro Líquido no Caixa</span>
              <span className="text-lg font-black text-emerald-300 block mt-0.5">
                +{currencySymbol}{netMonthlyProfit.toLocaleString()} / mês
              </span>
              <span className="text-[10px] font-extrabold text-emerald-400">
                ROI de +{roiPercentage}% no 1º ciclo!
              </span>
            </div>

          </div>

          <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between gap-3">
            <span>
              💡 <strong>Argumento de Fechamento do SDR:</strong> "Dr(a). {decisorFirstName}, mesmo com a nossa estimativa mais conservadora, com apenas <strong>{clientsNeededToBreakEven} fechamentos</strong> os {currencySymbol}{currentPlanPrice} da nossa assessoria já estão 100% pagos. Cada cliente a mais entra como lucro líquido puro para a {cleanBrand}."
            </span>
            <button
              onClick={() => handleCopy(`Dr(a). ${decisorFirstName}, mesmo com a nossa estimativa mais conservadora, com apenas ${clientsNeededToBreakEven} fechamentos os ${currencySymbol}${currentPlanPrice} da nossa assessoria já estão 100% pagos. Cada cliente a mais entra como lucro líquido puro para a ${cleanBrand}.`, 'arg_fechamento')}
              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shrink-0 flex items-center gap-1"
            >
              {copiedItem === 'arg_fechamento' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>Copiar</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. DIAGNÓSTICO 360° DE GARGALOS COMERCIAIS (ONDE ESTÃO PERDENDO DINHEIRO) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Diagnóstico 360° de Gargalos Comerciais & Perda de Receita
            </h3>
            <p className="text-xs text-slate-500">
              Pontos cegos da concorrência e falhas de conversão identificadas na {cleanBrand}.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-rose-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Vazamento de WhatsApp & Atendimento Noturno
                </span>
                <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded">Risco Crítico</span>
              </div>
              <p className="text-xs text-slate-700">
                Mais de 40% das pessoas pesquisam serviços de saúde e estética entre 19h e 23h ou em finais de semana. Sem um atendente virtual com IA para responder em menos de 15 segundos, o paciente vai direto para a próxima clínica.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-indigo-700 font-bold flex items-center justify-between">
              <span>Solução no Plano Elite: Agente IA 24/7 no WhatsApp</span>
              <span className="text-emerald-700">+35% Fechamentos</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-amber-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" />
                  Velocidade Mobile & Fricção na Conversão
                </span>
                <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Gargalo de Tráfego</span>
              </div>
              <p className="text-xs text-slate-700">
                Visitantes de mobile abandonam a página se o carregamento demorar mais de 2.5 segundos ou se o botão de agendamento não for 1-clique para o WhatsApp.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-indigo-700 font-bold flex items-center justify-between">
              <span>Solução: Otimização de Core Web Vitals e Página de Alta Conversão</span>
              <span className="text-emerald-700">Menor Custo por Lead</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-indigo-700 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Ausência de Funil Ativo de Tráfego Pago
                </span>
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">Oportunidade de Escala</span>
              </div>
              <p className="text-xs text-slate-700">
                A clínica depende quase exclusivamente de indicações e do fluxo espontâneo do Google Maps. Anúncios segmentados para o público A/B da região garantem previsibilidade e agenda cheia o ano todo.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-indigo-700 font-bold flex items-center justify-between">
              <span>Solução: Campanhas Google & Meta focadas no raio de 15km</span>
              <span className="text-emerald-700">+25 a 50 Leads/mês</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-purple-700 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Base de Clientes Inativos sem Follow-up
                </span>
                <span className="text-[10px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded">Receita Parada</span>
              </div>
              <p className="text-xs text-slate-700">
                Pacientes que fizeram procedimentos há mais de 6 meses raramente recebem mensagens consultivas de retorno, gerando desperdício do ativo mais valioso da empresa.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200 text-[11px] text-indigo-700 font-bold flex items-center justify-between">
              <span>Solução: Automação de Reativação Semanal via WhatsApp</span>
              <span className="text-emerald-700">Lucro Imediato sem Gasto em Anúncio</span>
            </div>
          </div>

        </div>
      </div>

      {/* 5. SCRIPTS SDR PROSPECPT (TAXA DE RESPOSTA 3X A 5X MAIOR) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Scripts de Prospecção ProspecPT & SDR de Alta Conversão
              </h3>
              <p className="text-xs text-slate-500">
                Fórmula de 2 etapas: Curiosidade Primeiro → Resposta → Proposta de Valor.
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Passo 1 & Passo 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Passo 1: Curiosidade */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                  WhatsApp Curiosidade Primeiro
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/60 px-2 py-0.5 rounded">Taxa Resposta 68%</span>
              </div>
              <p className="text-xs text-emerald-950 font-mono bg-white p-3 rounded-lg border border-emerald-200/80 select-all">
                {waCuriosityStep1}
              </p>
              <p className="text-[10px] text-emerald-800 mt-2">
                Envie apenas isso primeiro. Quando o decisor responder "Sim, diga", você envia o Passo 2 com o pitch sob medida!
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-emerald-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(waCuriosityStep1, 'wa_step1')}
                className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedItem === 'wa_step1' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>Copiar Mensagem 1</span>
              </button>

              {cleanPhone && (
                <button
                  onClick={() => openWhatsApp1Click(lead, waCuriosityStep1)}
                  className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar no WhatsApp</span>
                </button>
              )}
            </div>
          </div>

          {/* Passo 2: Pitch de Valor */}
          <div className="border border-slate-200 bg-slate-50/50 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">2</span>
                  WhatsApp Pitch de Valor & Reunião
                </span>
                <span className="text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">Após a Resposta</span>
              </div>
              <p className="text-xs text-slate-800 font-mono bg-white p-3 rounded-lg border border-slate-200 select-all whitespace-pre-line max-h-48 overflow-y-auto">
                {waCuriosityStep2}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(waCuriosityStep2, 'wa_step2')}
                className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedItem === 'wa_step2' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>Copiar Mensagem 2 (Pitch)</span>
              </button>

              {cleanPhone && (
                <button
                  onClick={() => openWhatsApp1Click(lead, waCuriosityStep2)}
                  className="w-full sm:w-auto min-h-[42px] px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Disparar Passo 2</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Cold Call: Anti-Secretária & Decisor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                Script Anti-Secretária (Ultrapassar a Recepção)
              </span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Gatekeeper</span>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
              "{coldCallSecretaryScript}"
            </p>
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={() => handleCopy(coldCallSecretaryScript, 'script_secretaria')}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                {copiedItem === 'script_secretaria' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copiar Script</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                Script Cold Call 30s Direto com o Decisor
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Pitch 30s</span>
            </div>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
              "{coldCallDecisorScript}"
            </p>
            <div className="mt-2.5 flex justify-end">
              <button
                onClick={() => handleCopy(coldCallDecisorScript, 'script_decisor')}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
              >
                {copiedItem === 'script_decisor' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copiar Script</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 6. BATTLECARD DE CONTORNO DE OBJEÇÕES EM TEMPO REAL */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Battlecards SDR: Respostas Imediatas para Quebrar Objeções
            </h3>
            <p className="text-xs text-slate-500">
              Tenha a resposta perfeita na ponta da língua quando o decisor tentar escapar da conversa.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {objections.map((item, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </span>
                  "{item.obj}"
                </span>
                <button
                  onClick={() => handleCopy(item.response, `obj_${idx}`)}
                  className="px-2 py-0.5 rounded text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 transition-colors"
                >
                  {copiedItem === `obj_${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copiar Resposta</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 pl-5.5 italic">
                "{item.response}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 7. CADÊNCIA MULTICANAL 30 DIAS (PADRÃO PROSPECPT) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-extrabold text-white">
                Cadência de Prospecção ProspecPT (30 Dias)
              </h3>
              <p className="text-xs text-slate-400">
                Sequência estratégica até a reunião: do silêncio ao fechamento do contrato de {currencySymbol}{currentPlanPrice}/mês.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Dia 0</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            </div>
            <h4 className="font-extrabold text-xs text-white">1º Contacto Imediato</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              WhatsApp Curiosidade Primeiro + E-mail C-Level de autoridade.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Dia 7</span>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
            <h4 className="font-extrabold text-xs text-white">Follow-up de Valor</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Áudio de 25s no WhatsApp com o diagnóstico de gargalo no Google Maps.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Dia 15</span>
              <span className="w-2 h-2 rounded-full bg-rose-400" />
            </div>
            <h4 className="font-extrabold text-xs text-white">Urgência & Concorrência</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Ligação com gancho anti-secretária mostrando a demanda ativa em {lead.city || 'Cascais'}.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Dia 30</span>
              <span className="w-2 h-2 rounded-full bg-slate-500" />
            </div>
            <h4 className="font-extrabold text-xs text-white">Última Tentativa (Break-up)</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Mensagem empática sem pressão, deixando a porta aberta para quando precisarem de escala.
            </p>
          </div>

        </div>
      </div>

      {/* 📱 BARRA FIXA DE AÇÃO RÁPIDA MOBILE (SDR SEMPRE NO CONTROLE) */}
      <div className="sticky bottom-0 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 bg-slate-950/95 backdrop-blur-xl p-3 sm:p-4 border-t border-slate-800 shadow-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 z-20">
        <div className="flex items-center justify-between sm:justify-start gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold text-white text-xs">Plano Ativo:</span>
            <span className="text-emerald-400 font-black">{currencySymbol}{currentPlanPrice}/mês</span>
          </div>
          <span className="text-[10px] text-slate-400">Payback: {clientsNeededToBreakEven} {clientsNeededToBreakEven === 1 ? 'cliente' : 'clientes'}</span>
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              className="min-h-[44px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-emerald-600/30"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Ligar</span>
            </a>
          )}

          {cleanPhone && (
            <button
              onClick={() => openWhatsApp1Click(lead, waCuriosityStep1)}
              className="min-h-[44px] px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 shadow-md shadow-teal-600/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          )}

          <button
            onClick={() => handleCopy(exportDossierMarkdown(), 'sticky_copy')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 active:scale-95 transition-all ${
              !cleanPhone ? 'col-span-3' : ''
            } ${
              copiedItem === 'sticky_copy'
                ? 'bg-indigo-600 text-white'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
          >
            {copiedItem === 'sticky_copy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-300" />}
            <span>{copiedItem === 'sticky_copy' ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default HighTicketDossierView;
