import { 
  Lead, 
  LeadRoiRecommendation, 
  SdrRoiVerdict, 
  OfferingServiceSynergy, 
  BusinessProfile,
  DigitalFlawOpportunity,
  WorthContactingAnalysis,
  RetainerMonthlyPlan,
  WorthContactingImprovementItem
} from '../types';
import { getSavedBusinessProfile } from './storageService';
import { getCurrencyConfig, getSavedCountry } from './countryService';

/**
 * Categorias e palavras-chave de micro-negócios e comércios de rua locais
 * que NÃO possuem fluxo de caixa ou estrutura para contratar pacotes de
 * desenvolvimento de software ou consultoria digital de alto valor.
 * Pagar um SDR para tentar agendar reunião com esses perfis é queimar dinheiro!
 */
const MICRO_LOCAL_KEYWORDS = [
  'lanchonete', 'pastelaria', 'padaria de bairro', 'padaria simples', 'hamburgueria simples',
  'bar de esquina', 'boteco', 'botequim', 'mercadinho', 'mercearia', 'quitanda', 'açougue de rua',
  'barbearia simples', 'barbearia de rua', 'cabeleireiro simples', 'lava jato', 'lava-jato',
  'borracharia', 'chaveiro', 'costura', 'pequeno comércio', 'bazar de bairro', 'papelaria de bairro',
  'quiosque', 'sorveteria de bairro', 'pesqueiro', 'lan house', 'depósito de bebidas simples'
];

/**
 * Categorias de Alto Ticket e Negócios Estruturados com alto poder de compra
 * e forte demanda por desenvolvimento de software, automação de IA e consultoria digital.
 */
const HIGH_TICKET_POWER_KEYWORDS = [
  // Saúde e Estética Avançada
  'clínica médica', 'clinica medica', 'cirurgia plástica', 'cirurgia plastica', 'dermatologia',
  'odontologia', 'implantes', 'harmonização', 'harmonizacao', 'oftalmologia', 'reprodução assistida',
  'ortopedia', 'hospital', 'laboratório', 'laboratorio', 'saúde integrada', 'estética avançada',
  // Jurídico e Compliance
  'advocacia', 'advogado', 'direito empresarial', 'tributário', 'tributario', 'contencioso',
  'societário', 'societario', 'jurídico', 'juridico', 'compliance',
  // Imobiliário e Construção
  'incorporadora', 'loteadora', 'imobiliária', 'imobiliaria', 'construtora', 'engenharia',
  'empreendimentos', 'arquitetura corporativa', 'condomínio fechado',
  // Indústria, Manufatura e Logística B2B
  'indústria', 'industria', 'metalúrgica', 'metalurgica', 'distribuidor', 'fábrica', 'fabrica',
  'logística', 'logistica', 'transportadora', 'embalagens', 'máquinas', 'maquinas', 'química', 'quimica',
  // Consultoria e BPO
  'consultoria', 'gestão empresarial', 'auditoria', 'advisory', 'bpo', 'assessoria financeira',
  'investimentos', 'family office', 'crédito corporativo', 'contabilidade consultiva',
  // Tecnologia, Educação e Serviços Premium
  'software', 'tecnologia', 'saas', 'faculdade', 'colégio particular', 'concessionária', 'locadora de frotas'
];

/**
 * Avalia a capacidade financeira e porte do Lead para verificar se ele
 * tem capacidade de investimento para contratar projetos de Desenvolvimento e Consultoria Digital.
 */
export function evaluateLeadPurchasePower(lead: Lead): 'ALTO_PODEROSO' | 'MEDIO' | 'BAIXO_MICRO' | 'SEM_BUDGET' {
  const textCorpus = `${lead.name} ${lead.category || ''} ${lead.description || ''} ${lead.address || ''}`.toLowerCase();

  // 1. Checa se é micro-comércio de baixo ticket
  const isMicro = MICRO_LOCAL_KEYWORDS.some(kw => textCorpus.includes(kw));
  if (isMicro) {
    if (lead.reviews && lead.reviews > 150) {
      return 'MEDIO';
    }
    return 'BAIXO_MICRO';
  }

  // 2. Checa se pertence a nichos consolidados de alto ticket
  const isHighTicketSegment = HIGH_TICKET_POWER_KEYWORDS.some(kw => textCorpus.includes(kw));
  if (isHighTicketSegment) {
    return 'ALTO_PODEROSO';
  }

  // 3. Checa sinais de escala e porte corporativo
  const isCorporateByReviews = (lead.reviews || 0) >= 30 && (lead.rating || 0) >= 4.0;
  const isHighBudgetBant = lead.bantPlus?.budget?.rating === 'Alto' || (lead.budgetMaturity === 'Alta');
  const hasMultiplePartners = (lead.fiscalRegistry?.partners?.length || 0) >= 2;
  const hasHighShareCapital = typeof lead.fiscalRegistry?.shareCapital === 'string' && !lead.fiscalRegistry.shareCapital.includes('1.000');

  if (isCorporateByReviews || isHighBudgetBant || hasMultiplePartners || hasHighShareCapital) {
    return 'ALTO_PODEROSO';
  }

  // 4. Se tiver website próprio e telefone comercial válido com volume mediano de avaliações
  if (lead.website && (lead.reviews || 0) >= 8) {
    return 'MEDIO';
  }

  // 5. Sem website e poucas avaliações geralmente é micro
  if (!lead.website && (lead.reviews || 0) < 5) {
    return 'SEM_BUDGET';
  }

  return 'MEDIO';
}

/**
 * Extrai TODAS as falhas no meio digital da empresa lead e mapeia quais
 * serviços da empresa ofertante (desenvolvimento, consultoria, automação de IA)
 * resolvem cada um desses gargalos.
 */
export function extractLeadDigitalFlawsAndServices(
  lead: Lead,
  offeringProfile?: BusinessProfile
): DigitalFlawOpportunity[] {
  const flaws: DigitalFlawOpportunity[] = [];
  const rawFlaws = lead.keyFlaws || lead.bantPlus?.need?.operationalFlaws || [];
  const textCorpus = `${lead.name} ${lead.category || ''} ${lead.description || ''} ${rawFlaws.join(' ')}`.toLowerCase();
  const techTools = lead.techStack?.detectedTools || [];

  // 1. Falha: Presença Web & Website
  const hasWebsite = Boolean(lead.website && lead.website.trim().length > 3);
  if (!hasWebsite) {
    flaws.push({
      id: 'flaw_no_website',
      category: 'website',
      categoryLabel: 'Presença Web & Google',
      flawTitle: 'Ausência de Website ou Domínio Próprio',
      flawSeverity: 'CRITICA',
      flawEvidence: 'Nenhum site corporativo indexado nas buscas do Google ou Maps.',
      offeredService: 'Desenvolvimento Web 3.0 & Landing Page de Alta Conversão',
      serviceImpact: 'Construção de autoridade imediata, presença no Google e canal próprio de captura de clientes.',
      recommendedPitchSnippet: 'Notamos que sua empresa ainda não possui um portal web indexado no Google, perdendo clientes de alto valor da região para concorrentes.'
    });
  } else {
    // Se tem site, verifica performance e carregamento mobile
    const pageSpeed = lead.digital360Audit?.pageSpeed;
    const isSlow = pageSpeed?.performanceRating === 'LENTO' || (pageSpeed?.mobileScore && pageSpeed.mobileScore < 60);
    if (isSlow || rawFlaws.some(f => /lento|carregamento|mobile|velocidade/i.test(f))) {
      const scoreText = pageSpeed?.mobileScore ? `Score Mobile: ${pageSpeed.mobileScore}/100` : 'Carregamento lento detectado';
      flaws.push({
        id: 'flaw_slow_website',
        category: 'website',
        categoryLabel: 'Performance Web',
        flawTitle: 'Website com Lentidão Crítica no Mobile (PageSpeed Baixo)',
        flawSeverity: 'ALTA',
        flawEvidence: `${scoreText}. Tempo de carregamento superior a 3.5s.`,
        offeredService: 'Reconstrução de Performance Web (PageSpeed 95+ & Mobile Ready)',
        serviceImpact: 'Redução de até 60% na taxa de desistência de visitantes e melhoria orgânica no ranking do Google.',
        recommendedPitchSnippet: 'Avaliamos a velocidade do seu site no celular e constatamos lentidão que faz mais de metade dos visitantes desistirem antes de pedir orçamento.'
      });
    }
  }

  // 2. Falha: Ausência de Triagem Automática / Agente IA 24/7 no WhatsApp
  const hasChatbot = Boolean(lead.digital360Audit?.chatbot?.hasChatbot);
  const mentionsWhatsappPain = rawFlaws.some(f => /whatsapp|atendimento|demora|fora do hor|espera/i.test(f));
  if (!hasChatbot || mentionsWhatsappPain) {
    flaws.push({
      id: 'flaw_no_ai_sdr',
      category: 'atendimento_whatsapp',
      categoryLabel: 'Atendimento & Triagem',
      flawTitle: 'Ausência de Triagem Automática e Agente IA 24/7 no WhatsApp',
      flawSeverity: 'ALTA',
      flawEvidence: 'Sem fluxo inteligente de auto-atendimento ou triagem imediata mapeado.',
      offeredService: 'Implantação de Agente SDR IA no WhatsApp Comercial 24/7',
      serviceImpact: 'Resposta em menos de 10 segundos, qualificação instantânea de clientes e zero perda de leads à noite/fins de semana.',
      recommendedPitchSnippet: 'Identificamos que contatos que procuram sua empresa fora do expediente ficam sem atendimento imediato, migrando para concorrentes.'
    });
  }

  // 3. Falha: Infraestrutura de Dados, Rastreamento de Conversão e CRM
  const hasPixel = techTools.some(t => /pixel|meta|gtm|tag manager|analytics/i.test(t));
  const hasCrm = techTools.some(t => /crm|hubspot|rd station|pipedrive|salesforce/i.test(t));
  if (!hasPixel || !hasCrm || rawFlaws.some(f => /pixel|crm|rastreamento|perda de lead/i.test(f))) {
    flaws.push({
      id: 'flaw_no_crm_tracking',
      category: 'dados_crm',
      categoryLabel: 'Gestão de Vendas & CRM',
      flawTitle: 'Falta de Rastreamento de Conversão (Pixel/GTM) e CRM Integrado',
      flawSeverity: 'MEDIA',
      flawEvidence: 'Ausência de tags de mensuração de ROI e plataforma de CRM no ecossistema digital.',
      offeredService: 'Consultoria Digital de Processos Comerciais & Setup de CRM Automatizado',
      serviceImpact: 'Visibilidade total do funil comercial, histórico centralizado e automação de follow-up para evitar perda de propostas.',
      recommendedPitchSnippet: 'Identificamos falta de infraestrutura de dados e CRM, o que dificulta saber o retorno exato de cada ação comercial e o acompanhamento de orçamentos.'
    });
  }

  // 4. Falha: Vazamento de Tráfego nas Redes Sociais sem CTA de Vendas
  const socials = lead.digital360Audit?.socialsAudit;
  const hasCtaLeak = socials?.primaryChannelPosts?.some(p => !p.hasCtaToWhatsApp) ||
    rawFlaws.some(f => /social|instagram|cta|engajamento|link/i.test(f));
  if (hasCtaLeak || lead.socials?.instagram) {
    flaws.push({
      id: 'flaw_social_cta_leak',
      category: 'conversao_vendas',
      categoryLabel: 'Conversão & Funil',
      flawTitle: 'Vazamento de Tráfego Social: Perfis sem Funil Direto para WhatsApp',
      flawSeverity: 'MEDIA',
      flawEvidence: 'Publicações ou bio sem direcionamento estratégico de call-to-action para fechamento comercial.',
      offeredService: 'Consultoria de Funil Omnichannel & Automação de Agendamentos Sociais',
      serviceImpact: 'Transformação do público que visualiza a marca nas redes sociais em reuniões e cotações reais no WhatsApp.',
      recommendedPitchSnippet: 'Suas redes atraem interesse, mas não possuem um funil de conversão automático para direcionar o interessado para fechar negócio rapidamente.'
    });
  }

  // 5. Falha B2B: Processo Manual de Cotação em Indústrias/Distribuidores
  const isB2bIndustry = /ind[uú]stri|distribuidor|fabric|metal[uú]rgic|qu[ií]mic|maquin/i.test(textCorpus);
  if (isB2bIndustry) {
    flaws.push({
      id: 'flaw_b2b_manual_quote',
      category: 'conversao_vendas',
      categoryLabel: 'Processos B2B',
      flawTitle: 'Vendas Corporativas com Cotação Manual (PDF/E-mail sem Portal Ágil)',
      flawSeverity: 'ALTA',
      flawEvidence: 'Processo comercial dependente de envio manual de planilhas e catálogos estáticos.',
      offeredService: 'Desenvolvimento de Portal B2B de Auto-Cotação & Consultoria de Funil',
      serviceImpact: 'Redução do ciclo de fechamento B2B de dias para minutos e aumento de recompras recorrentes.',
      recommendedPitchSnippet: 'Podemos digitalizar seu catálogo em um portal corporativo de auto-cotação, acelerando o tempo de resposta da sua equipe para clientes B2B.'
    });
  }

  // 6. Falha: SEO Local e Reputação Google
  const seoAudit = lead.digital360Audit?.seoAudit;
  if (seoAudit?.metaDescriptionQuality === 'RUIM' || (lead.reviews || 0) < 10) {
    flaws.push({
      id: 'flaw_seo_reputation',
      category: 'midia_seo',
      categoryLabel: 'SEO & Visibilidade',
      flawTitle: 'Baixa Otimização para Buscas Orgânicas Locais no Google',
      flawSeverity: 'MEDIA',
      flawEvidence: 'Metadados desconfigurados ou volume de avaliações insuficiente para dominar o topo das buscas.',
      offeredService: 'Otimização SEO Local & Gestão de Reputação no Google Meu Negócio',
      serviceImpact: 'Domínio das três primeiras posições na busca local do Google, captando clientes no momento exato da intenção.',
      recommendedPitchSnippet: 'Notamos oportunidades para colocar sua empresa no topo das buscas do Google na sua região sem precisar pagar anúncio por clique.'
    });
  }

  return flaws;
}

/**
 * Mapeia quais serviços da Empresa Ofertante (Desenvolvimento e Consultoria Digital)
 * servem especificamente para sanar os problemas e gargalos do Lead analisado.
 */
function matchOfferingServicesWithLead(
  lead: Lead,
  offeringProfile: BusinessProfile,
  leadPower: 'ALTO_PODEROSO' | 'MEDIO' | 'BAIXO_MICRO' | 'SEM_BUDGET',
  detectedFlaws: DigitalFlawOpportunity[]
): {
  servicesMatched: string[];
  needMatchExplanation: string;
  targetDealSize: string;
} {
  const currency = getCurrencyConfig(getSavedCountry());

  // Se for micro ou sem budget, os serviços da empresa ofertante não servem economicamente para o lead
  if (leadPower === 'BAIXO_MICRO' || leadPower === 'SEM_BUDGET') {
    return {
      servicesMatched: [],
      needMatchExplanation: 'Sem sinergia econômica: O porte e fluxo de caixa de um micro-negócio local não comportam o valor de contratação dos serviços de desenvolvimento de software e consultoria digital da sua empresa.',
      targetDealSize: `${currency.symbol} 0 (Inviável)`
    };
  }

  // Coleta os serviços únicos associados às falhas detectadas
  const servicesFromFlaws = Array.from(new Set(detectedFlaws.map(f => f.offeredService)));

  // Fallback se nenhuma falha específica foi detectada mas o lead é poderoso
  if (servicesFromFlaws.length === 0) {
    servicesFromFlaws.push('Consultoria Digital & Modernização de Sistemas');
  }

  const explanations = detectedFlaws.slice(0, 3).map(f => `${f.flawTitle} -> Solução: ${f.offeredService}`);

  // Faixa de ticket estimada com base no perfil da empresa ofertante
  const targetDealSize = leadPower === 'ALTO_PODEROSO'
    ? `${currency.symbol} 15.000 a ${currency.symbol} 45.000 (Projeto Completo + Retainer)`
    : `${currency.symbol} 6.000 a ${currency.symbol} 18.000 (Módulo de Entrada)`;

  return {
    servicesMatched: servicesFromFlaws.slice(0, 4),
    needMatchExplanation: explanations.length > 0 
      ? `Serviços aplicáveis para sanar as falhas do lead: ${explanations.join('; ')}.`
      : `O lead possui alto alinhamento com a proposta de "${offeringProfile?.uvp || 'Desenvolvimento e Consultoria Digital'}".`,
    targetDealSize
  };
}

/**
 * Gera proposta realista e estruturada de Venda de Mensalidade Recorrente (Retainer / MRR).
 * Baseado puramente em fatos reais: poder de compra do lead e falhas técnicas detectadas.
 */
function generateRecurringRetainerOffer(
  leadPower: 'ALTO_PODEROSO' | 'MEDIO' | 'BAIXO_MICRO' | 'SEM_BUDGET',
  detectedFlaws: DigitalFlawOpportunity[],
  currencySymbol: string
): OfferingServiceSynergy['recurringRetainerOffer'] {
  if (leadPower === 'BAIXO_MICRO' || leadPower === 'SEM_BUDGET') {
    return undefined;
  }

  const isEuro = currencySymbol === '€';

  if (leadPower === 'ALTO_PODEROSO') {
    const feeValue = isEuro ? '€ 1.200' : 'R$ 3.800';
    const annualValue = isEuro ? '€ 14.400' : 'R$ 45.600';
    return {
      planName: 'Retainer Enterprise: Gestão Contínua, Agente IA 24/7 & Evolução Web',
      monthlyFee: `${feeValue} / mês`,
      annualValue: `${annualValue} / ano`,
      includedDeliverables: [
        'Evolução contínua de software, portais e integrações (até 20h dev/mês)',
        'Operação, retreino e monitoramento ativo de Agente IA no WhatsApp 24/7',
        'Auditoria técnica mensal de PageSpeed, SEO Local e infraestrutura',
        'Otimização contínua de taxa de conversão (CRO) e captura de leads'
      ],
      closingPitchForRetainer: 'Contratação como time técnico terceirizado contínuo: elimina custos de contratação CLT fixa, garante que a empresa nunca fique com sistemas desatualizados e converte clientes no WhatsApp 24h por dia.'
    };
  }

  // leadPower === 'MEDIO'
  const feeValue = isEuro ? '€ 490' : 'R$ 1.650';
  const annualValue = isEuro ? '€ 5.880' : 'R$ 19.800';
  return {
    planName: 'Plano Recorrente: Suporte Web, Agente IA & Manutenção Ativa',
    monthlyFee: `${feeValue} / mês`,
    annualValue: `${annualValue} / ano`,
    includedDeliverables: [
      'Hospedagem de alta performance e monitoramento de uptime 24/7',
      'Atendente Virtual IA no WhatsApp para triagem automática de leads',
      'Banco de 6h/mês para ajustes técnicos e melhorias no site',
      'Gestão da reputação Google Maps e atualização de SEO local'
    ],
    closingPitchForRetainer: 'Evita que o investimento inicial se perca com sites abandonados. Garante atendimento instantâneo para quem chama no WhatsApp mesmo fora do horário comercial.'
  };
}

/**
 * Constrói a análise definitiva de viabilidade comercial ("Saber se vale a pena tentar contato")
 * Sem inventar dados: cruza canais reais, falhas técnicas comprovadas, poder de compra e riscos.
 */
export function buildWorthContactingAnalysis(
  lead: Lead,
  verdict: SdrRoiVerdict,
  leadPurchasePower: 'ALTO_PODEROSO' | 'MEDIO' | 'BAIXO_MICRO' | 'SEM_BUDGET',
  detectedDigitalFlaws: DigitalFlawOpportunity[],
  dataSignals: any,
  finalScore: number,
  currencySymbol: string,
  recurringRetainerOffer?: RetainerMonthlyPlan
): WorthContactingAnalysis {
  const isHotCall = verdict === 'CALL_MEETING';
  const isCaution = verdict === 'WHATSAPP_FIRST' || verdict === 'EMAIL_ONLY';
  const isWorthContacting = isHotCall || isCaution;

  let verdictLabel: 'VALE MUITO A PENA' | 'VALE A PENA COM CAUTELA' | 'NÃO VALE A PENA' = 'NÃO VALE A PENA';
  let badgeTone: 'emerald' | 'teal' | 'amber' | 'rose' = 'rose';

  if (isHotCall) {
    verdictLabel = 'VALE MUITO A PENA';
    badgeTone = 'emerald';
  } else if (isCaution) {
    verdictLabel = 'VALE A PENA COM CAUTELA';
    badgeTone = verdict === 'WHATSAPP_FIRST' ? 'teal' : 'amber';
  } else {
    verdictLabel = 'NÃO VALE A PENA';
    badgeTone = 'rose';
  }

  // Sinais Positivos Concretos (Sem inventar nada)
  const positiveSignals: string[] = [];
  if (dataSignals.hasDirectDecisor) {
    positiveSignals.push(`Decisor mapeado nominalmente: ${dataSignals.decisorNameAndRole || 'Diretoria'}`);
  }
  if (dataSignals.hasValidPhone) {
    positiveSignals.push(`Telefone ativo verificado (${dataSignals.phoneType === 'direct_mobile' ? 'Celular/WhatsApp' : 'Linha Fixa Comercial'})`);
  }
  if (dataSignals.hasWebsite) {
    positiveSignals.push(`Presença web ativa no domínio (${lead.website})`);
  }
  if (lead.rating && lead.rating >= 4.0) {
    positiveSignals.push(`Reputação Google Maps sólida: ${lead.rating}⭐ com ${lead.reviews || 0} avaliações reais`);
  }
  if (leadPurchasePower === 'ALTO_PODEROSO') {
    positiveSignals.push('Porte corporativo estruturado com capacidade de caixa para contratos de desenvolvimento e mensalidades');
  } else if (leadPurchasePower === 'MEDIO') {
    positiveSignals.push('Porte intermediário com budget suficiente para planos recorrentes de suporte e IA');
  }

  // Riscos e Fatores de Atenção
  const riskFactors: string[] = [];
  if (dataSignals.phoneType === 'landline_reception') {
    riskFactors.push('Telefone fixo cai na recepção/secretária (gatekeeper); necessário e-mail ou LinkedIn para ultrapassar barreiras');
  }
  if (verdict === 'WHATSAPP_FIRST') {
    riskFactors.push('Risco de denúncia de spam no WhatsApp se mensagem for fria e genérica; indispensável abordagem 1-a-1 consultiva');
  }
  if (leadPurchasePower === 'BAIXO_MICRO' || leadPurchasePower === 'SEM_BUDGET') {
    riskFactors.push('Micro-comércio de rua com baixo faturamento: retorno financeiro negativo para serviços de tecnologia');
  }
  if (detectedDigitalFlaws.length === 0) {
    riskFactors.push('Nenhuma falha técnica evidente identificada para ancoragem imediata');
  }

  // O Que Podemos Melhorar Todo Mês para Vender Nossas Mensalidades
  const whatWeCanImprove: WorthContactingImprovementItem[] = detectedDigitalFlaws.map(flaw => {
    let monthlyImprovement = '';
    let monthlyServiceName = flaw.offeredService;
    let expectedImpact = flaw.serviceImpact;

    if (flaw.category === 'website') {
      monthlyImprovement = 'Otimização contínua de performance, monitoramento ativo de uptime e atualizações de segurança.';
      monthlyServiceName = 'Retainer de Performance Web & Infraestrutura';
      expectedImpact = 'Mantém carregamento abaixo de 2s e converte até 40% mais visitantes em orçamentos.';
    } else if (flaw.category === 'atendimento_whatsapp') {
      monthlyImprovement = 'Operação de Agente IA no WhatsApp 24/7 com triagem automática de novos clientes e agendamento.';
      monthlyServiceName = 'Retainer de Automação & Atendimento IA 24/7';
      expectedImpact = 'Capta 100% das mensagens fora do horário comercial sem custo de equipe extra.';
    } else if (flaw.category === 'midia_seo') {
      monthlyImprovement = 'Gestão técnica de Meta Pixel, GA4 com API de Conversões (CAPI) e auditoria de SEO Local.';
      monthlyServiceName = 'Retainer de Rastreamento & Inteligência de Tráfego';
      expectedImpact = 'Garante que os anúncios tragam leads qualificados com dados exatos de conversão.';
    } else {
      monthlyImprovement = 'Manutenção mensal de landing pages, otimização de conversão (CRO) e funis de vendas.';
      monthlyServiceName = 'Retainer de Otimização Contínua de Conversão';
      expectedImpact = 'Elimina gargalos no funil de vendas e aumenta taxa de fechamento.';
    }

    return {
      flawTitle: flaw.flawTitle,
      flawEvidence: flaw.flawEvidence,
      monthlyImprovement,
      monthlyServiceName,
      expectedBusinessImpact: expectedImpact
    };
  });

  // Se não houver falhas digitais detectadas, cria itens padrão de melhoria de valor
  if (whatWeCanImprove.length === 0 && (leadPurchasePower === 'ALTO_PODEROSO' || leadPurchasePower === 'MEDIO')) {
    whatWeCanImprove.push({
      flawTitle: 'Atendimento Manual no WhatsApp com Perda de Oportunidades Fora do Horário',
      flawEvidence: 'Sem agente inteligente de resposta instantânea para responder clientes à noite e fins de semana.',
      monthlyImprovement: 'Implementação e supervisão contínua de Agente IA 24/7 integrado ao CRM.',
      monthlyServiceName: 'Retainer de Atendimento & Agente IA 24/7',
      expectedBusinessImpact: 'Qualifica e agenda reuniões no WhatsApp automaticamente em menos de 10 segundos.'
    });
    whatWeCanImprove.push({
      flawTitle: 'Ausência de Rastreamento Avançado de Conversões (CAPI / GA4)',
      flawEvidence: 'Tráfego sem mensuração exata de retorno sobre investimento publicitário.',
      monthlyImprovement: 'Auditoria mensal de tags, disparos de eventos e relatórios executivos de aquisição.',
      monthlyServiceName: 'Retainer de Inteligência de Dados & Conversão',
      expectedBusinessImpact: 'Permite saber exatamente de onde vêm os clientes que mais pagam.'
    });
  }

  // Headline e Raciocínio
  let headline = '';
  let detailedReasoning = '';
  let recommendedAction = '';

  if (isHotCall) {
    headline = 'Empresa com alto fit comercial, falhas técnicas comprovadas e decisor acessível: Ligar Agora!';
    detailedReasoning = `Esta empresa possui porte estruturado para contratar desenvolvimento e planos mensais. Identificamos ${detectedDigitalFlaws.length} falha(s) que a empresa não resolve internamente. O custo de discagem do SDR é amplamente compensado pelo ticket do projeto e da mensalidade recorrente.`;
    recommendedAction = 'Discar no modo foco imediatamente. Abrir a conversa citando a evidência da falha real identificada para gerar autoridade e agendar 15 min de demonstração.';
  } else if (verdict === 'WHATSAPP_FIRST') {
    headline = 'Vale contato consultivo via WhatsApp 1-a-1 com atenção rigorosa anti-spam.';
    detailedReasoning = `O prospect possui número móvel/WhatsApp e oportunidades claras de melhoria. No entanto, o envio em massa para não-clientes acarreta alto risco de banimento de chip por denúncia de spam. A abordagem precisa ser estritamente individual e consultiva, focada na dor técnica identificada.`;
    recommendedAction = 'Enviar mensagem personalizada 1-a-1 apontando a falha específica e oferecendo auditoria gratuita de 5 minutos.';
  } else if (verdict === 'EMAIL_ONLY') {
    headline = 'Vale envio seguro de auditoria digital por e-mail para transpor recepção.';
    detailedReasoning = `O número encontrado cai na recepção ou o canal é frio. O e-mail frio com auditoria anexa protege sua linha de WhatsApp contra banimento por spam e apresenta o diagnóstico completo à diretoria.`;
    recommendedAction = 'Enviar e-mail executivo com a auditoria técnica das falhas anexa. Acompanhar taxa de abertura antes de ligar.';
  } else {
    headline = 'Não vale a pena tentar contato: Descarte Inteligente.';
    detailedReasoning = `Empresa sem canais ativos válidos, inativa ou com porte financeiro insuficiente para investir em serviços de tecnologia e mensalidades recorrentes.`;
    recommendedAction = 'Descartar lead para manter o foco da equipe nos contatos de alto retorno.';
  }

  const isEuro = currencySymbol === '€';
  const defaultRetainer: RetainerMonthlyPlan = recurringRetainerOffer || {
    planName: leadPurchasePower === 'ALTO_PODEROSO'
      ? 'Retainer Enterprise: Gestão Contínua, Agente IA 24/7 & Evolução Web'
      : 'Plano Recorrente: Suporte Web, Agente IA & Manutenção Ativa',
    monthlyFee: leadPurchasePower === 'ALTO_PODEROSO'
      ? (isEuro ? '€ 1.200 / mês' : 'R$ 3.800 / mês')
      : (isEuro ? '€ 490 / mês' : 'R$ 1.650 / mês'),
    annualValue: leadPurchasePower === 'ALTO_PODEROSO'
      ? (isEuro ? '€ 14.400 / ano' : 'R$ 45.600 / ano')
      : (isEuro ? '€ 5.880 / ano' : 'R$ 19.800 / ano'),
    includedDeliverables: [
      'Monitoramento contínuo de uptime, infraestrutura e segurança',
      'Operação de Agente IA no WhatsApp para atendimento 24/7',
      'Banco de horas técnicas para melhorias contínuas no site e sistemas'
    ],
    closingPitchForRetainer: 'Evita a depreciação dos sistemas da empresa e garante que nenhum cliente seja perdido no WhatsApp por falta de resposta imediata.'
  };

  const isDailyCandidate = isHotCall || (verdict === 'WHATSAPP_FIRST' && finalScore >= 75 && Boolean(dataSignals.hasValidPhone));

  return {
    isWorthContacting,
    verdictLabel,
    badgeTone,
    score: Math.min(100, Math.max(15, finalScore)),
    headline,
    positiveSignals,
    riskFactors,
    detailedReasoning,
    recommendedAction,
    whatWeCanImprove,
    monthlyRetainerOffer: defaultRetainer,
    dailyQuotaCandidate: isDailyCandidate
  };
}

/**
 * Ponto de entrada público para o cálculo de recomendação de ROI e Formato de Contato.
 */
export function calculateLeadRoiRecommendation(
  lead: Lead,
  customOfferingProfile?: BusinessProfile
): LeadRoiRecommendation {
  try {
    return internalCalculateLeadRoi(lead, customOfferingProfile);
  } catch (error) {
    console.error('Erro seguro ao calcular ROI do Lead:', error);
    // Fallback garantido para nunca quebrar a interface
    return {
      verdict: 'WHATSAPP_FIRST',
      verdictBadge: '💬 WHATSAPP 1-A-1 (ANTI-SPAM)',
      verdictTone: 'teal',
      investmentWorth: 'CONTATO_RAPIDO_WHATSAPP',
      investmentWorthLabel: '⚡ Contato ágil via WhatsApp',
      recommendedChannel: 'whatsapp',
      recommendedChannelLabel: 'WhatsApp 1-a-1 Consultivo',
      expectedGoal: 'Apresentar diagnóstico de falhas com cuidado anti-spam',
      confidenceScore: 75,
      primaryReason: `Lead com oportunidades identificadas no meio digital.`,
      dataSignals: {
        hasDirectDecisor: Boolean(lead?.decisionMaker?.name),
        phoneType: lead?.phone ? 'direct_mobile' : 'none',
        websiteStatus: lead?.website ? 'active' : 'offline_or_none',
        hasValidPhone: Boolean(lead?.phone),
        hasWebsite: Boolean(lead?.website),
        hasIdentifiedFlawOrPain: true,
        keyPainSummary: 'Qualificação comercial',
        hasActiveSocials: false,
        hasCtaLeak: false
      },
      sdrActionTip: 'Abordar via WhatsApp 1-a-1 com o diagnóstico para evitar denúncias de spam.',
      offeringSynergy: {
        offeringCompanyName: customOfferingProfile?.businessName || 'Minha Empresa',
        offeringServicesSummary: 'Desenvolvimento e Consultoria Digital',
        servicesMatched: ['Consultoria Digital & Desenvolvimento Web'],
        leadPurchasePower: 'MEDIO',
        leadNeedMatchExplanation: 'Alinhamento com serviços de modernização digital.',
        targetDealSize: 'R$ 8.000 a R$ 18.000',
        sdrCostJustified: false,
        whySdrJustifiedOrNot: 'Contato digital consultivo recomendado para validar abertura.'
      }
    };
  }
}

/**
 * Motor Central de Decisão baseado na regra solicitada:
 * 1. Análise detalhada das FALHAS DA EMPRESA NO MEIO DIGITAL;
 * 2. Mapeamento de QUAIS SERVIÇOS NOSSOS PODEMOS OFERTAR para sanar essas falhas;
 * 3. Avaliação do MELHOR FORMATO DE CONTATO com base na temperatura e risco:
 *    - FRIO (E-mail): Para não-clientes onde o WhatsApp traria risco de banimento de chip por denúncia de spam, ou contatos frios sem telefone direto.
 *    - MÉDIO (WhatsApp): Quando há canal móvel/WhatsApp, mas com ALERTA ANTI-SPAM mandatório (abordagem 1-a-1 baseada na dor real, nunca spam em massa).
 *    - QUENTE (Ligar com SDR): Para leads com falhas críticas evidentes onde a nossa solução tem alto valor (alto ticket), e o SDR liga munido do dossiê das falhas para agendar a reunião com o time de desenvolvimento/consultoria!
 */
function internalCalculateLeadRoi(
  lead: Lead,
  customOfferingProfile?: BusinessProfile
): LeadRoiRecommendation {
  const offeringProfile: BusinessProfile = customOfferingProfile || getSavedBusinessProfile();
  const offeringCompanyName = offeringProfile?.businessName || 'Minha Empresa de Desenvolvimento & Consultoria';
  const offeringServicesSummary = offeringProfile?.servicesDescription || 'Desenvolvimento de Software, Web 3.0, Automações de IA e Consultoria Digital';

  // Canais de contato reais do lead
  const primaryPhone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = primaryPhone.replace(/\D/g, '');
  const hasValidPhone = cleanPhone.length >= 7;

  // Detecção de tipo de telefone (Celular/WhatsApp Direto vs Fixo de Recepção)
  let phoneType: 'direct_mobile' | 'landline_reception' | 'none' = 'none';
  if (hasValidPhone) {
    if (lead.decisionMaker?.directPhone) {
      phoneType = 'direct_mobile';
    } else if (cleanPhone.length === 11 && cleanPhone[2] === '9') {
      phoneType = 'direct_mobile'; // Celular Brasil
    } else if (cleanPhone.length === 9 && cleanPhone.startsWith('9')) {
      phoneType = 'direct_mobile'; // Telemóvel Portugal
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('55') && cleanPhone[4] === '9') {
      phoneType = 'direct_mobile';
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('351') && cleanPhone[5] === '9') {
      phoneType = 'direct_mobile';
    } else if (cleanPhone.length === 10 || cleanPhone.length === 8 || cleanPhone.length === 11) {
      phoneType = 'landline_reception';
    } else {
      phoneType = 'direct_mobile';
    }
  }

  // Avaliação de Decisor
  const rawDecisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || '';
  const isGenericDecisor = !rawDecisorName || 
    rawDecisorName.toLowerCase().includes('decisor comercial') || 
    rawDecisorName.toLowerCase().includes('não identificado') ||
    rawDecisorName.toLowerCase().includes('proprietário comercial');

  const hasDirectDecisor = !isGenericDecisor && rawDecisorName.trim().length > 2;
  const decisorRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Diretoria Executiva';
  const decisorNameAndRole = hasDirectDecisor ? `${rawDecisorName} (${decisorRole})` : undefined;

  // Avaliação do Website
  const hasWebsite = Boolean(lead.website && lead.website.trim().length > 3);
  const websiteStatus: 'active' | 'slow_or_flawed' | 'offline_or_none' = !hasWebsite 
    ? 'offline_or_none'
    : ((lead.digital360Audit?.pageSpeed?.performanceRating === 'LENTO') || Boolean(lead.digital360Audit?.pageSpeed?.mobileScore && lead.digital360Audit.pageSpeed.mobileScore < 50))
    ? 'slow_or_flawed'
    : 'active';

  // Redes Sociais
  const hasActiveSocials = Boolean(
    lead.socials?.instagram || 
    lead.socials?.linkedin || 
    lead.socials?.facebook ||
    lead.digital360Audit?.socialsAudit?.hasAnySocial
  );

  // Pontuação Geral
  const seniorScore = lead.seniorIcpQualification?.finalScore;
  const generalScore = lead.score ?? lead.icpScore ?? 60;
  const finalEffectiveScore = seniorScore ?? generalScore;

  const isBusinessClosed = lead.businessStatus === 'CLOSED_PERMANENTLY' || lead.businessStatus === 'CLOSED_TEMPORARILY';
  const hasEmail = Boolean((lead.email && lead.email.includes('@')) || (lead.decisionMaker?.directEmail && lead.decisionMaker.directEmail.includes('@')));

  // =========================================================================
  // PASSO 1: DETECÇÃO DE TODAS AS FALHAS NO MEIO DIGITAL E SERVIÇOS OFERTÁVEIS
  // =========================================================================
  const detectedDigitalFlaws = extractLeadDigitalFlawsAndServices(lead, offeringProfile);
  const criticalOrHighFlaws = detectedDigitalFlaws.filter(f => f.flawSeverity === 'CRITICA' || f.flawSeverity === 'ALTA');
  const hasCriticalOrHighFlaws = criticalOrHighFlaws.length > 0;

  // =========================================================================
  // PASSO 2: PODER DE COMPRA E SINERGIA COM OS NOSSOS SERVIÇOS
  // =========================================================================
  const leadPurchasePower = evaluateLeadPurchasePower(lead);
  const { servicesMatched, needMatchExplanation, targetDealSize } = matchOfferingServicesWithLead(
    lead,
    offeringProfile,
    leadPurchasePower,
    detectedDigitalFlaws
  );
  const leadNeedMatchExplanation = needMatchExplanation;
  const currency = getCurrencyConfig(getSavedCountry());
  const recurringRetainerOffer = generateRecurringRetainerOffer(
    leadPurchasePower,
    detectedDigitalFlaws,
    currency.symbol
  );

  // Dados de Sinais
  const dataSignals = {
    hasDirectDecisor,
    decisorNameAndRole,
    hasValidPhone,
    phoneType,
    hasWebsite,
    websiteStatus,
    hasIdentifiedFlawOrPain: detectedDigitalFlaws.length > 0,
    keyPainSummary: detectedDigitalFlaws[0]?.flawTitle || 'Sem falha crítica detectada',
    hasActiveSocials,
    hasCtaLeak: detectedDigitalFlaws.some(f => f.id === 'flaw_social_cta_leak')
  };

  // =========================================================================
  // PASSO 3: DECISÃO DE DESCARTE (QUANDO NÃO HÁ FALHAS OU NÃO HÁ FIT ECONÔMICO)
  // =========================================================================
  if (
    isBusinessClosed ||
    leadPurchasePower === 'BAIXO_MICRO' ||
    leadPurchasePower === 'SEM_BUDGET' ||
    (!hasValidPhone && !hasEmail) ||
    finalEffectiveScore < 40 ||
    lead.status === 'ignored'
  ) {
    const primaryReason = isBusinessClosed 
      ? 'Empresa inativa ou encerrada no registro cadastral oficial.'
      : (leadPurchasePower === 'BAIXO_MICRO' || leadPurchasePower === 'SEM_BUDGET')
      ? `Micro-negócio sem faturamento para projetos de desenvolvimento e consultoria digital de ${offeringCompanyName}. Mesmo com falhas digitais, o retorno financeiro é inviável.`
      : !hasValidPhone && !hasEmail
      ? 'Ausência total de canais de contato verificados (sem telefone e sem e-mail).'
      : `Score de aderência muito baixo (${finalEffectiveScore}/100). Contratação de desenvolvimento improváve.`;

    const offeringSynergy: OfferingServiceSynergy = {
      offeringCompanyName,
      offeringServicesSummary,
      servicesMatched: [],
      leadPurchasePower,
      leadNeedMatchExplanation,
      targetDealSize: 'R$ 0 (Inviável)',
      sdrCostJustified: false,
      whySdrJustifiedOrNot: 'O lead não possui viabilidade financeira para contratar nossos serviços de desenvolvimento e consultoria.',
      detectedDigitalFlaws,
      recurringRetainerOffer: undefined,
      contactFormatEvaluation: {
        format: 'none',
        temperature: 'INVIAVEL',
        temperatureLabel: '⛔ Inviável (Descarte)',
        channelJustification: 'Incompatibilidade de ticket e perfil financeiro.'
      }
    };

    const defaultDisqualifiedRetainer: RetainerMonthlyPlan = {
      planName: 'Plano Básico de Manutenção Web',
      monthlyFee: currency.symbol === '€' ? '€ 290 / mês' : 'R$ 950 / mês',
      annualValue: currency.symbol === '€' ? '€ 3.480 / ano' : 'R$ 11.400 / ano',
      includedDeliverables: ['Monitoramento de servidor', 'Atualizações essenciais'],
      closingPitchForRetainer: 'Manutenção mínima para preservar canais digitais.'
    };

    const disqRec: LeadRoiRecommendation = {
      verdict: 'DISQUALIFIED',
      verdictBadge: 'NÃO PERDER TEMPO (DESCARTAR)',
      verdictTone: 'rose',
      investmentWorth: 'SEM_RETORNO_DESCARTAR',
      investmentWorthLabel: '⛔ Não vale a pena perder tempo',
      recommendedChannel: 'none',
      recommendedChannelLabel: 'Nenhum (Descarte do Pipeline)',
      expectedGoal: 'Poupar recursos e focar o time comercial em leads qualificados',
      confidenceScore: 95,
      primaryReason,
      dailyQuotaCandidate: false,
      dataSignals,
      sdrActionTip: 'Não gaste tempo nem canais com este perfil. Mantenha arquivado.',
      offeringSynergy
    };

    disqRec.worthContacting = buildWorthContactingAnalysis(
      lead,
      'DISQUALIFIED',
      leadPurchasePower,
      detectedDigitalFlaws,
      dataSignals,
      finalEffectiveScore,
      currency.symbol,
      defaultDisqualifiedRetainer
    );

    return disqRec;
  }

  // =========================================================================
  // PASSO 4: AVALIAÇÃO DO MELHOR FORMATO DE CONTATO
  // AVALIAÇÃO ESTRATÉGICA SOLICITADA PELO USUÁRIO:
  // - QUENTE: Ligar com SDR quando há falha grave de alto valor + decisor/canal direto
  // - MÉDIO: WhatsApp quando há número móvel, COM ALERTA ANTI-SPAM (risco de banimento em não-clientes!)
  // - FRIO: E-mail quando o contato é frio, para blindar contra denúncias e enviar o dossiê das falhas
  // =========================================================================

  let calculatedRec: LeadRoiRecommendation;

  // 1. CRITÉRIOS PARA LIGAR COM SDR (CONTATO QUENTE / ALTO IMPACTO)
  const isHighPower = leadPurchasePower === 'ALTO_PODEROSO';
  const hasDirectChannel = hasDirectDecisor || (phoneType === 'direct_mobile' && finalEffectiveScore >= 65);
  const isHotSdrCall = hasCriticalOrHighFlaws && hasDirectChannel && (isHighPower || finalEffectiveScore >= 70) && hasValidPhone;

  if (isHotSdrCall) {
    const mainFlaw = criticalOrHighFlaws[0] || detectedDigitalFlaws[0];
    const topServices = servicesMatched.slice(0, 2).join(' e ');

    const offeringSynergy: OfferingServiceSynergy = {
      offeringCompanyName,
      offeringServicesSummary,
      servicesMatched,
      leadPurchasePower,
      leadNeedMatchExplanation,
      targetDealSize,
      sdrCostJustified: true,
      whySdrJustifiedOrNot: `O SDR está amplamente justificado pelas falhas críticas detectadas (${mainFlaw.flawTitle}). O ticket estimado de ${targetDealSize} para ${topServices} fecha a conta com grande margem de lucro.`,
      detectedDigitalFlaws,
      recurringRetainerOffer,
      contactFormatEvaluation: {
        format: 'call',
        temperature: 'QUENTE_SDR',
        temperatureLabel: '🔥 Quente (Ligar com SDR)',
        channelJustification: `Lead poderoso com falhas digitais graves identificadas (${mainFlaw.flawTitle}). O SDR liga com argumento técnico e dossiê em mãos para agendar demonstração com o time de desenvolvimento/consultoria.`
      }
    };

    calculatedRec = {
      verdict: 'CALL_MEETING',
      verdictBadge: '🔥 QUENTE: LIGAR SDR (FALHAS GRAVES)',
      verdictTone: 'emerald',
      investmentWorth: 'ALTO_VALOR_INVESTIR',
      investmentWorthLabel: '🔥 Vale a pena ligar pelo SDR',
      recommendedChannel: 'call',
      recommendedChannelLabel: 'Ligação do SDR com Dossiê Técnico',
      expectedGoal: 'Demonstrar as falhas detectadas e agendar call com time de desenvolvimento',
      confidenceScore: Math.min(99, Math.max(88, finalEffectiveScore)),
      primaryReason: `Detectamos falhas digitais graves no lead (${mainFlaw.flawTitle}). A empresa possui alto poder de compra para ${topServices} e canal direto mapeado (${hasDirectDecisor ? decisorNameAndRole : 'telefone direto'}). O SDR possui munição técnica sólida para abrir a call e agendar a reunião.`,
      dailyQuotaCandidate: true,
      dataSignals,
      sdrActionTip: `Acione o modo de ligação. Abra citando a falha específica: "${mainFlaw.recommendedPitchSnippet}". Conduza para agendar 15 min com o especialista de desenvolvimento.`,
      offeringSynergy
    };
  } else {
    // 2. CRITÉRIOS PARA WHATSAPP (MÉDIO / CUIDADO ANTI-SPAM RIGOROSO)
    const hasMobileNumber = hasValidPhone && (phoneType === 'direct_mobile' || hasActiveSocials);
    const isMediumRiskWhatsApp = hasMobileNumber && detectedDigitalFlaws.length > 0;

    if (isMediumRiskWhatsApp) {
      const mainFlaw = detectedDigitalFlaws[0];
      const antiSpamWarning = '⚠️ Cuidado Anti-Spam Obrigatório: Não envie disparos em massa nem mensagens padronizadas genéricas para este prospect. Envio frio para não-clientes sem contexto pode gerar denúncia de spam e banimento imediato do chip da sua empresa! Envie uma mensagem consultiva 1-a-1 citando a falha real identificada.';

      const offeringSynergy: OfferingServiceSynergy = {
        offeringCompanyName,
        offeringServicesSummary,
        servicesMatched,
        leadPurchasePower,
        leadNeedMatchExplanation,
        targetDealSize,
        sdrCostJustified: false,
        whySdrJustifiedOrNot: `Canal de WhatsApp com temperatura média. Requer abordagem 1-a-1 cuidadosa baseada na falha "${mainFlaw.flawTitle}" para prevenir denúncias e banimento de linha.`,
        detectedDigitalFlaws,
        recurringRetainerOffer,
        contactFormatEvaluation: {
          format: 'whatsapp',
          temperature: 'MEDIO_WHATSAPP',
          temperatureLabel: '💬 Médio (WhatsApp com Cuidado Anti-Spam)',
          channelJustification: `Possui número móvel/WhatsApp ativo. Abordagem 1-a-1 recomendada apontando a falha de ${mainFlaw.flawTitle}, sempre com cautela contra denúncia de spam.`,
          antiSpamWarning
        }
      };

      calculatedRec = {
        verdict: 'WHATSAPP_FIRST',
        verdictBadge: '💬 MÉDIO: WHATSAPP (CUIDADO ANTI-SPAM)',
        verdictTone: 'teal',
        investmentWorth: 'CONTATO_RAPIDO_WHATSAPP',
        investmentWorthLabel: '⚡ Contato ágil via WhatsApp 1-a-1',
        recommendedChannel: 'whatsapp',
        recommendedChannelLabel: 'WhatsApp 1-a-1 Consultivo (Anti-Spam)',
        expectedGoal: 'Apresentar a falha identificada em tom consultivo sem gerar denúncia de spam',
        confidenceScore: Math.min(88, Math.max(72, finalEffectiveScore)),
        primaryReason: `Número de celular/WhatsApp detectado (${primaryPhone}). O lead tem falha em "${mainFlaw.flawTitle}" solucionável por "${mainFlaw.offeredService}". A abordagem direta pelo WhatsApp deve ser estritamente 1-a-1 para evitar risco de denúncia por spam de não-clientes.`,
        dailyQuotaCandidate: Boolean(hasValidPhone && finalEffectiveScore >= 75),
        dataSignals,
        sdrActionTip: `Use o roteiro 1-Click mas personalize citando a dor técnica. ${antiSpamWarning}`,
        offeringSynergy
      };
    } else {
      // 3. CRITÉRIOS PARA E-MAIL (FRIO / 100% SEGURO CONTRA BANIMENTO)
      const isLandline = phoneType === 'landline_reception';
      const mainFlaw = detectedDigitalFlaws[0] || {
        flawTitle: 'Oportunidades de Modernização Digital',
        offeredService: servicesMatched[0] || 'Consultoria de Desenvolvimento'
      };

      const offeringSynergy: OfferingServiceSynergy = {
        offeringCompanyName,
        offeringServicesSummary,
        servicesMatched,
        leadPurchasePower,
        leadNeedMatchExplanation,
        targetDealSize,
        sdrCostJustified: false,
        whySdrJustifiedOrNot: isLandline
          ? 'Telefone fixo cai em recepção geral (gatekeeper). O e-mail frio com auditoria técnica anexa atinge o decisor com segurança sem queimar tempo de discagem.'
          : 'Contato inicial frio. O e-mail corporativo é 100% seguro contra denúncias de spam e permite enviar o dossiê completo de falhas digitais.',
        detectedDigitalFlaws,
        recurringRetainerOffer,
        contactFormatEvaluation: {
          format: 'email',
          temperature: 'FRIO_EMAIL',
          temperatureLabel: '📩 Frio (E-mail Seguro contra Banimento)',
          channelJustification: 'O e-mail frio protege seu número de WhatsApp contra banimento de spam e permite entregar a auditoria técnica das falhas de forma elegante e não-invasiva.'
        }
      };

      calculatedRec = {
        verdict: 'EMAIL_ONLY',
        verdictBadge: '📩 FRIO: E-MAIL SEGURO (ZERO RISCO DE BAN)',
        verdictTone: 'amber',
        investmentWorth: 'NUTRICAO_PASSIVA_EMAIL',
        investmentWorthLabel: '📩 Envio de Auditoria por E-mail',
        recommendedChannel: 'email',
        recommendedChannelLabel: 'E-mail Consultivo (Auditoria Anexa)',
        expectedGoal: 'Enviar dossiê das falhas digitais sem risco de denúncia de spam no WhatsApp',
        confidenceScore: 72,
        primaryReason: isLandline
          ? `Telefone fixo cai na recepção geral. O canal mais seguro é o e-mail consultivo apresentando o diagnóstico de "${mainFlaw.flawTitle}" diretamente à diretoria.`
          : `Canal frio seguro contra banimento de WhatsApp. Envie o diagnóstico completo das falhas digitais por e-mail para nutrir o prospect com credibilidade técnica.`,
        dailyQuotaCandidate: false,
        dataSignals,
        sdrActionTip: 'Envie a cadência de Cold Mail com o dossiê das falhas digitais anexo. Se o lead interagir ou abrir, acione o contato telefônico.',
        offeringSynergy
      };
    }
  }

  calculatedRec.worthContacting = buildWorthContactingAnalysis(
    lead,
    calculatedRec.verdict,
    leadPurchasePower,
    detectedDigitalFlaws,
    dataSignals,
    finalEffectiveScore,
    currency.symbol,
    recurringRetainerOffer
  );

  if (calculatedRec.worthContacting.dailyQuotaCandidate) {
    calculatedRec.dailyQuotaCandidate = true;
  }

  return calculatedRec;
}

/**
 * Retorna as classes de estilo Tailwind para o badge e containers de recomendação
 */
export function getRoiVerdictStyle(verdict: SdrRoiVerdict) {
  switch (verdict) {
    case 'CALL_MEETING':
      return {
        badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        containerBg: 'bg-emerald-50/80 border-emerald-200',
        iconColor: 'text-emerald-700',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        borderAccent: 'border-l-4 border-l-emerald-600',
        emoji: '🔥',
        temperatureBadge: 'QUENTE (LIGAR SDR)',
        temperatureColor: 'text-emerald-800 bg-emerald-100 border-emerald-300',
        label: 'QUENTE: LIGAR SDR (FALHAS GRAVES)'
      };
    case 'WHATSAPP_FIRST':
      return {
        badgeBg: 'bg-teal-100 text-teal-950 border-teal-300',
        containerBg: 'bg-teal-50/80 border-teal-200',
        iconColor: 'text-teal-700',
        buttonBg: 'bg-teal-600 hover:bg-teal-700 text-white',
        borderAccent: 'border-l-4 border-l-teal-600',
        emoji: '💬',
        temperatureBadge: 'MÉDIO (CUIDADO ANTI-SPAM)',
        temperatureColor: 'text-teal-800 bg-teal-100 border-teal-300',
        label: 'MÉDIO: WHATSAPP (1-A-1 ANTI-SPAM)'
      };
    case 'EMAIL_ONLY':
      return {
        badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
        containerBg: 'bg-amber-50/80 border-amber-200',
        iconColor: 'text-amber-700',
        buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        borderAccent: 'border-l-4 border-l-amber-500',
        emoji: '📩',
        temperatureBadge: 'FRIO (E-MAIL SEGURO)',
        temperatureColor: 'text-amber-800 bg-amber-100 border-amber-300',
        label: 'FRIO: E-MAIL SEGURO (ZERO BAN)'
      };
    case 'DISQUALIFIED':
    default:
      return {
        badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
        containerBg: 'bg-slate-50 border-slate-200',
        iconColor: 'text-slate-500',
        buttonBg: 'bg-slate-200 hover:bg-slate-300 text-slate-800',
        borderAccent: 'border-l-4 border-l-slate-400',
        emoji: '⛔',
        temperatureBadge: 'INVIÁVEL',
        temperatureColor: 'text-slate-700 bg-slate-100 border-slate-300',
        label: 'NÃO PERDER TEMPO (DESCARTAR)'
      };
  }
}
