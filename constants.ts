import { BusinessProfile, HighTicketNicheRecommendation, AiEngineConfig, CurrencyConfig } from "./types";

export const DEFAULT_COUNTRY = 'Portugal';

export const CURRENCIES: Record<string, CurrencyConfig> = {
  "Brasil": { code: "BRL", symbol: "R$", locale: "pt-BR", speechLang: "pt-BR", defaultCity: "São Paulo", flag: "🇧🇷", label: "Brasil", pipelineScale: 1.0 },
  "Portugal": { code: "EUR", symbol: "€", locale: "pt-PT", speechLang: "pt-PT", defaultCity: "Lisboa", flag: "🇵🇹", label: "Portugal", pipelineScale: 0.45 },
  "Espanha": { code: "EUR", symbol: "€", locale: "es-ES", speechLang: "es-ES", defaultCity: "Madrid", flag: "🇪🇸", label: "Espanha", pipelineScale: 0.45 },
  "Estados Unidos": { code: "USD", symbol: "US$", locale: "en-US", speechLang: "en-US", defaultCity: "New York", flag: "🇺🇸", label: "Estados Unidos", pipelineScale: 1.25 },
  "Reino Unido": { code: "GBP", symbol: "£", locale: "en-GB", speechLang: "en-GB", defaultCity: "London", flag: "🇬🇧", label: "Reino Unido", pipelineScale: 0.85 },
  "França": { code: "EUR", symbol: "€", locale: "fr-FR", speechLang: "fr-FR", defaultCity: "Paris", flag: "🇫🇷", label: "França", pipelineScale: 0.45 },
  "Alemanha": { code: "EUR", symbol: "€", locale: "de-DE", speechLang: "de-DE", defaultCity: "Berlin", flag: "🇩🇪", label: "Alemanha", pipelineScale: 0.45 },
  "Itália": { code: "EUR", symbol: "€", locale: "it-IT", speechLang: "it-IT", defaultCity: "Roma", flag: "🇮🇹", label: "Itália", pipelineScale: 0.45 },
  "Países Baixos": { code: "EUR", symbol: "€", locale: "nl-NL", speechLang: "nl-NL", defaultCity: "Amsterdã", flag: "🇳🇱", label: "Países Baixos", pipelineScale: 0.45 },
  "México": { code: "MXN", symbol: "$", locale: "es-MX", speechLang: "es-MX", defaultCity: "Cidade do México", flag: "🇲🇽", label: "México", pipelineScale: 0.55 },
  "Chile": { code: "CLP", symbol: "$", locale: "es-CL", speechLang: "es-CL", defaultCity: "Santiago", flag: "🇨🇱", label: "Chile", pipelineScale: 0.35 },
  "Colômbia": { code: "COP", symbol: "$", locale: "es-CO", speechLang: "es-CO", defaultCity: "Bogotá", flag: "🇨🇴", label: "Colômbia", pipelineScale: 0.12 }
};

export const SUPPORTED_COUNTRIES = [
  "Portugal", "Brasil", "Espanha", "Estados Unidos", "Reino Unido",
  "França", "Alemanha", "Itália", "Países Baixos", "México", "Chile", "Colômbia"
];

export const DEFAULT_HIGH_TICKET_NICHES: HighTicketNicheRecommendation[] = [
  {
    id: "niche-clinicas-luxo",
    niche: "Clínicas Médicas & Odontologia de Alto Padrão",
    category: "Saúde & Estética Premium",
    tag: "🔥 R$ 10k a R$ 35k",
    whyGoodMatch: "Alto fluxo de pacientes particulares, margens de 60%+ e alto custo de secretárias que perdem agendamentos no WhatsApp.",
    estimatedTicket: "R$ 10.000 a R$ 35.000 (ou R$ 3.500/mês)",
    criticalGaps: [
      "Taxa de no-show > 20% sem confirmação de consulta por IA",
      "Demora de mais de 30 min no WhatsApp da recepção",
      "Sem funil de reativação de pacientes antigos"
    ],
    suggestedOfferBundle: "SDR IA no WhatsApp 24/7 + Confirmação Inteligente de Agendamento + Site 3.0"
  },
  {
    id: "niche-solar-climatizacao",
    niche: "Energia Solar, Fotovoltaico & Climatização HVAC",
    category: "Energia Renovável & Engenharia",
    tag: "☀️ R$ 25k a R$ 90k",
    whyGoodMatch: "Projetos de alto valor agregado onde 1 única venda paga meses de agência; alto volume de leads no WhatsApp que exigem cálculo de economia e dimensionamento rápido.",
    estimatedTicket: "R$ 25.000 a R$ 90.000 (ou R$ 3.500/mês)",
    criticalGaps: [
      "Perda de 40% das cotações por demora de mais de 25 min no WhatsApp da equipe técnica",
      "Falta de triagem automática com upload e leitura de conta de luz por IA",
      "Anúncios no Meta/Google sem rastreamento de lead qualificado via CAPI"
    ],
    suggestedOfferBundle: "SDR IA de Qualificação de Fatura Solar 24/7 + Gestão de Tráfego de Alta Conversão + CRM de Obras"
  },
  {
    id: "niche-construcao-reformas",
    niche: "Construção Civil & Reformas de Alto Padrão",
    category: "Construção & Engenharia de Luxo",
    tag: "🏗️ R$ 50k a R$ 300k",
    whyGoodMatch: "Reformas completas e obras com margens elevadas; clientes de alto poder aquisitivo que exigem atendimento ágil com portfólio visual no WhatsApp.",
    estimatedTicket: "R$ 50.000 a R$ 300.000",
    criticalGaps: [
      "Site lento e sem portfólio de fotos de obras no celular",
      "Demora para agendar visitas técnicas presenciais",
      "Falta de pré-qualificação de orçamento do cliente"
    ],
    suggestedOfferBundle: "Página de Portfólio de Alta Conversão + SDR IA para Triagem de Obras + Campanhas Meta/Google"
  },
  {
    id: "niche-imobiliarias-luxo",
    niche: "Incorporadoras, Loteadoras & Imobiliárias de Alto Padrão",
    category: "Mercado Imobiliário",
    tag: "🏢 R$ 20k a R$ 80k",
    whyGoodMatch: "VGV milionário; um único imóvel vendido paga dezenas de vezes o projeto de automação, site e CRM.",
    estimatedTicket: "R$ 20.000 a R$ 80.000",
    criticalGaps: [
      "Leads de portais demoram horas para serem distribuídos aos corretores",
      "Falta de nutrição de investidores com novos lançamentos",
      "Desalinhamento entre campanhas de tráfego e CRM"
    ],
    suggestedOfferBundle: "Distribuição Instantânea de Leads via IA + Tour Virtual Interativo + Integração Completa de CRM"
  },
  {
    id: "niche-industrias-b2b",
    niche: "Indústrias, Distribuidores & Logística B2B",
    category: "Indústria & Supply Chain",
    tag: "⚡ R$ 25k a R$ 100k",
    whyGoodMatch: "Orçamentos anuais vultosos; processos comerciais antiquados feitos por telefone e planilhas.",
    estimatedTicket: "R$ 25.000 a R$ 100.000",
    criticalGaps: [
      "Catálogo em PDF desatualizado e sem cotação online ágil",
      "Representantes comerciais sem pipeline digital estruturado",
      "Falta de automação de recompra periódica"
    ],
    suggestedOfferBundle: "Portal B2B de Auto-Cotação + Automação de Recompra por IA + Sistema de Prospecção Outbound"
  },
  {
    id: "niche-consultorias-bpo",
    niche: "Consultorias Empresariais, Financeiras & BPO",
    category: "Serviços Corporativos",
    tag: "🚀 R$ 12k a R$ 45k",
    whyGoodMatch: "Venda consultiva complexa que exige autoridade, demonstração de ROI e reuniões com CEOs.",
    estimatedTicket: "R$ 12.000 a R$ 45.000",
    criticalGaps: [
      "Dificuldade de agendar reuniões com Diretores e CEOs",
      "Falta de funil automatizado de qualificação de maturidade",
      "Pouca cadência de follow-up pós-proposta"
    ],
    suggestedOfferBundle: "Máquina de Agendamento Executivo (Cold Outbound) + Régua Omnichannel 21d + CRM Integrado"
  }
];

export const HIGH_TICKET_NICHES_BY_COUNTRY: Record<string, HighTicketNicheRecommendation[]> = {
  "Portugal": [
    {
      id: "pt-niche-clinicas-luxo",
      niche: "Clínicas de Estética & Odontologia de Alto Padrão",
      category: "Saúde & Estética Premium",
      tag: "🔥 €5k a €15k",
      whyGoodMatch: "Alto fluxo de pacientes particulares e turismo de saúde em Lisboa/Porto/Algarve; margens elevadas e secretárias que perdem agendamentos no WhatsApp.",
      estimatedTicket: "€5.000 a €15.000 (ou €1.800/mês)",
      criticalGaps: [
        "Taxa de no-show > 20% sem confirmação de consulta por IA",
        "Demora de mais de 30 min no WhatsApp da recepção",
        "Sem funil de reativação de pacientes antigos"
      ],
      suggestedOfferBundle: "SDR IA no WhatsApp 24/7 + Confirmação Inteligente de Agendamento + Site 3.0"
    },
    {
      id: "pt-niche-solar-climatizacao",
      niche: "Empresas de Energia Solar & Climatização HVAC",
      category: "Energia Renovável & Engenharia",
      tag: "☀️ €6k a €28k",
      whyGoodMatch: "Forte incentivo comunitário e procura de particulares e PMEs por redução de custos elétricos; ticket médio elevado onde um único fecho cobre 6 meses de agência e SDR.",
      estimatedTicket: "€6.000 a €28.000 (ou €1.500/mês)",
      criticalGaps: [
        "Perda de leads de particulares por demora na triagem da fatura no WhatsApp",
        "Campanhas digitais sem funil de retorno e sem simulação de poupança imediata",
        "Comerciais de terreno sem cadência de follow-up pós-orçamento"
      ],
      suggestedOfferBundle: "SDR IA no WhatsApp com Leitura de Fatura + Tráfego Pago de Alta Precisão + CRM Integrado"
    },
    {
      id: "pt-niche-construcao-remodelacoes",
      niche: "Construção Civil & Remodelações de Alto Padrão",
      category: "Construção & Engenharia de Luxo",
      tag: "🏗️ €20k a €120k",
      whyGoodMatch: "Mercado imobiliário premium em Lisboa, Cascais, Porto e Algarve; obras de remodelação completa com margens expressivas e clientes exigentes que valorizam apresentação digital impecável.",
      estimatedTicket: "€20.000 a €120.000",
      criticalGaps: [
        "Sites pesados sem portfólio visual ágil no telemóvel (LCP > 4s)",
        "Falta de canal direto para agendar visitas técnicas pelo WhatsApp",
        "Sem qualificação prévia de orçamento do cliente (filtros de ticket mínimo)"
      ],
      suggestedOfferBundle: "Página de Portfólio de Alta Conversão + SDR de Triagem de Obras + Campanhas Meta/Google Ads"
    },
    {
      id: "pt-niche-imobiliarias-luxo",
      niche: "Imobiliárias, Promotoras & Gestoras de Alojamento Local de Alto Padrão",
      category: "Mercado Imobiliário & Turismo",
      tag: "🏢 €12k a €45k",
      whyGoodMatch: "VGV alto em Lisboa, Porto e Algarve; um único imóvel vendido ou uma temporada de AL paga dezenas de vezes o projeto.",
      estimatedTicket: "€12.000 a €45.000",
      criticalGaps: [
        "Leads de portais demoram horas para chegar aos agentes",
        "Falta de nutrição de investidores estrangeiros",
        "Gestão manual de reservas e no-shows no Alojamento Local"
      ],
      suggestedOfferBundle: "Distribuição Instantânea de Leads via IA + Automação de Reservas AL + Integração Completa de CRM"
    },
    {
      id: "pt-niche-industrias-b2b",
      niche: "Indústrias, Distribuidores & Logística B2B",
      category: "Indústria & Supply Chain",
      tag: "⚡ €15k a €60k",
      whyGoodMatch: "Orçamentos anuais vultosos; processos comerciais antiquados feitos por telefone e folhas de cálculo.",
      estimatedTicket: "€15.000 a €60.000",
      criticalGaps: [
        "Catálogo em PDF desatualizado e sem cotação online ágil",
        "Representantes comerciais sem pipeline digital estruturado",
        "Falta de automação de recompra periódica"
      ],
      suggestedOfferBundle: "Portal B2B de Auto-Cotação + Automação de Recompra por IA + Sistema de Prospeção Outbound"
    },
    {
      id: "pt-niche-consultorias-bpo",
      niche: "Consultorias Empresariais, Financeiras & BPO",
      category: "Serviços Corporativos",
      tag: "🚀 €7k a €18k",
      whyGoodMatch: "Venda consultiva complexa que exige autoridade, demonstração de ROI e reuniões com CEOs/CFOs.",
      estimatedTicket: "€7.000 a €18.000",
      criticalGaps: [
        "Dificuldade de agendar reuniões com Diretores e CEOs",
        "Falta de funil automatizado de qualificação de maturidade",
        "Pouca cadência de follow-up pós-proposta"
      ],
      suggestedOfferBundle: "Máquina de Agendamento Executivo (Cold Outbound) + Régua Omnichannel 21d + CRM Integrado"
    }
  ],
  "Espanha": [
    {
      id: "es-niche-clinicas-luxo",
      niche: "Clínicas de Estética & Odontología de Alto Nivel",
      category: "Salud & Estética Premium",
      tag: "🔥 €6k a €18k",
      whyGoodMatch: "Gran flujo de pacientes privados; márgenes altos y recepción que pierde citas por WhatsApp.",
      estimatedTicket: "€6.000 a €18.000 (o €2.000/mes)",
      criticalGaps: [
        "No-show > 20% sin confirmación automática de cita",
        "Respuesta lenta en WhatsApp de recepción",
        "Sin embudo de reactivación de pacientes"
      ],
      suggestedOfferBundle: "SDR IA en WhatsApp 24/7 + Confirmación Inteligente de Citas + Web 3.0"
    },
    {
      id: "es-niche-energia-solar",
      niche: "Empresas de Energía Solar & Climatización",
      category: "Energía Renovable & Ingeniería",
      tag: "☀️ €7k a €30k",
      whyGoodMatch: "Alto crecimiento en autoconsumo residencial e industrial; un solo contrato de instalación cubre meses de agencia y SDR.",
      estimatedTicket: "€7.000 a €30.000",
      criticalGaps: [
        "Pérdida de contactos en WhatsApp por demora técnica en presupuesto",
        "Campañas de Google/Meta sin triaje automático de factura de luz",
        "Sin seguimiento automatizado de presupuestos entregados"
      ],
      suggestedOfferBundle: "SDR IA en WhatsApp para Facturas Solares + Meta Ads de Alta Precisión + CRM"
    },
    {
      id: "es-niche-inmobiliarias",
      niche: "Inmobiliarias y Promotoras Premium",
      category: "Mercado Inmobiliario",
      tag: "🏢 €15k a €50k",
      whyGoodMatch: "VGV elevado en Madrid y Costa del Sol; un inmueble vendido paga de sobra el proyecto.",
      estimatedTicket: "€15.000 a €50.000",
      criticalGaps: [
        "Leads de portales llegan tarde a los agentes",
        "Sin nutrición de inversores internacionales",
        "Desalineación entre campañas y CRM"
      ],
      suggestedOfferBundle: "Distribución Instantánea de Leads con IA + Tour Virtual Interactivo + CRM Integrado"
    },
    {
      id: "es-niche-industria",
      niche: "Industria, Distribuidores & Logística B2B",
      category: "Industria & Supply Chain",
      tag: "⚡ €18k a €65k",
      whyGoodMatch: "Presupuestos anuales altos; procesos comerciales obsoletos por teléfono y hojas de cálculo.",
      estimatedTicket: "€18.000 a €65.000",
      criticalGaps: [
        "Catálogo en PDF desactualizado sin cotización online",
        "Comerciales sin pipeline digital estructurado",
        "Falta de automatización de recompra"
      ],
      suggestedOfferBundle: "Portal B2B de Auto-Cotización + Automatización de Recompra + Outbound System"
    },
    {
      id: "es-niche-consultorias",
      niche: "Consultorías Empresariales, Financieras & BPO",
      category: "Servicios Corporativos",
      tag: "🚀 €8k a €20k",
      whyGoodMatch: "Venta consultiva compleja que exige autoridad y reuniones con directivos.",
      estimatedTicket: "€8.000 a €20.000",
      criticalGaps: [
        "Dificultad para agendar reuniones con directivos",
        "Sin embudo automatizado de madurez",
        "Poca cadencia de follow-up post-propuesta"
      ],
      suggestedOfferBundle: "Máquina de Agendamiento Ejecutivo + Régua Omnichannel 21d + CRM Integrado"
    }
  ],
  "Estados Unidos": [
    {
      id: "us-niche-clinics",
      niche: "Premium Medical & Aesthetic Clinics",
      category: "Healthcare & Aesthetics",
      tag: "🔥 $15k a $45k",
      whyGoodMatch: "High volume of private-pay patients; 60%+ margins and reception teams that lose bookings on text/phone.",
      estimatedTicket: "$15,000 to $45,000 (or $5,000/mo)",
      criticalGaps: [
        "No-show rate > 20% without automated appointment confirmation",
        "Slow response time to text/web leads",
        "No reactivation funnel for past patients"
      ],
      suggestedOfferBundle: "AI SDR on SMS/WhatsApp 24/7 + Smart Booking Confirmation + High-Converting Website"
    },
    {
      id: "us-niche-law",
      niche: "Corporate & Tax Law Firms",
      category: "Legal Services B2B",
      tag: "💎 $20k a $70k",
      whyGoodMatch: "5-to-6 figure consulting retainers; need to qualify cases before allocating partner time.",
      estimatedTicket: "$20,000 to $70,000",
      criticalGaps: [
        "Passive prospecting relying on referrals",
        "Static websites without conversion or compliance capture",
        "No automated case qualification"
      ],
      suggestedOfferBundle: "B2B Case Triage Automation + Outbound Engine + Authority Landing Pages"
    },
    {
      id: "us-niche-realestate",
      niche: "Luxury Real Estate & Property Developers",
      category: "Real Estate",
      tag: "🏢 $25k a $80k",
      whyGoodMatch: "High GMV; a single closed property pays for the entire automation, site and CRM project many times over.",
      estimatedTicket: "$25,000 to $80,000",
      criticalGaps: [
        "Portal leads take hours to reach agents",
        "No investor nurturing with new launches",
        "Misalignment between ad campaigns and CRM"
      ],
      suggestedOfferBundle: "Instant AI Lead Distribution + Interactive Virtual Tours + Full CRM Integration"
    },
    {
      id: "us-niche-industry",
      niche: "B2B Manufacturers, Distributors & Logistics",
      category: "Industry & Supply Chain",
      tag: "⚡ $30k a $100k",
      whyGoodMatch: "Large annual budgets; outdated sales processes run by phone and spreadsheets.",
      estimatedTicket: "$30,000 to $100,000",
      criticalGaps: [
        "Outdated PDF catalogs without agile online quoting",
        "Sales reps without structured digital pipelines",
        "No recurring reorder automation"
      ],
      suggestedOfferBundle: "B2B Self-Service Quoting Portal + AI Reorder Automation + Outbound Prospecting"
    },
    {
      id: "us-niche-consulting",
      niche: "Consulting Firms, Financial Advisors & BPO",
      category: "Professional Services",
      tag: "🚀 $15k a $50k",
      whyGoodMatch: "Complex consultative sale requiring authority, ROI proof and C-level meetings.",
      estimatedTicket: "$15,000 to $50,000",
      criticalGaps: [
        "Hard to book meetings with Directors and CEOs",
        "No automated maturity-qualification funnel",
        "Weak post-proposal follow-up cadence"
      ],
      suggestedOfferBundle: "Executive Meeting Machine (Cold Outbound) + 21-Day Omnichannel Cadence + CRM"
    }
  ],
  "Reino Unido": [
    {
      id: "uk-niche-clinics",
      niche: "Premium Aesthetic & Dental Clinics",
      category: "Health & Aesthetics",
      tag: "🔥 £10k a £35k",
      whyGoodMatch: "High private-pay patient volume and margins; reception that loses bookings over WhatsApp/phone.",
      estimatedTicket: "£10,000 to £35,000 (or £3,500/mo)",
      criticalGaps: [
        "No-show rate > 20% without automated confirmation",
        "Slow WhatsApp response from reception",
        "No reactivation funnel for old patients"
      ],
      suggestedOfferBundle: "AI SDR on WhatsApp 24/7 + Smart Booking Confirmation + Website 3.0"
    },
    {
      id: "uk-niche-solar",
      niche: "Commercial Solar Energy & HVAC Engineering",
      category: "Renewable Energy & Engineering",
      tag: "☀️ £15k to £60k",
      whyGoodMatch: "High capital investments where a single corporate contract covers annual marketing retainers; fast technical WhatsApp qualification drives sales.",
      estimatedTicket: "£15,000 to £60,000",
      criticalGaps: [
        "Inbound commercial leads wait hours for manual bill analysis",
        "Technical engineers spending time on unqualified inquiries",
        "Weak follow-up on outstanding project proposals"
      ],
      suggestedOfferBundle: "AI SDR with Automated Bill Extraction + High-Converting Landing Pages + CRM Pipeline"
    },
    {
      id: "uk-niche-realestate",
      niche: "Premium Real Estate & Property Developers",
      category: "Real Estate",
      tag: "🏢 £18k a £60k",
      whyGoodMatch: "High GMV in London; a single closed deal pays for the project many times over.",
      estimatedTicket: "£18,000 to £60,000",
      criticalGaps: [
        "Portal leads take hours to reach agents",
        "No investor nurturing with new launches",
        "Misalignment between campaigns and CRM"
      ],
      suggestedOfferBundle: "Instant AI Lead Distribution + Interactive Virtual Tours + Full CRM Integration"
    },
    {
      id: "uk-niche-industry",
      niche: "B2B Manufacturers, Distributors & Logistics",
      category: "Industry & Supply Chain",
      tag: "⚡ £25k a £80k",
      whyGoodMatch: "Large annual budgets; outdated sales processes run by phone and spreadsheets.",
      estimatedTicket: "£25,000 to £80,000",
      criticalGaps: [
        "Outdated PDF catalogs without agile online quoting",
        "Sales reps without structured digital pipelines",
        "No recurring reorder automation"
      ],
      suggestedOfferBundle: "B2B Self-Service Quoting Portal + AI Reorder Automation + Outbound Prospecting"
    },
    {
      id: "uk-niche-consulting",
      niche: "Consulting Firms, Financial Advisors & BPO",
      category: "Professional Services",
      tag: "🚀 £12k a £40k",
      whyGoodMatch: "Complex consultative sale requiring authority, ROI proof and C-level meetings.",
      estimatedTicket: "£12,000 to £40,000",
      criticalGaps: [
        "Hard to book meetings with Directors and CEOs",
        "No automated maturity-qualification funnel",
        "Weak post-proposal follow-up cadence"
      ],
      suggestedOfferBundle: "Executive Meeting Machine (Cold Outbound) + 21-Day Omnichannel Cadence + CRM"
    }
  ]
};

export const DEFAULT_RAPIDAPI_KEYS: [string, string, string] = [
  "f3fd7938b2msh23224581e117040p1d9903jsn150fc303f653",
  "217aaf9c57mshbeccc815a9fea34p1f3f39jsn47f97de18757",
  "217aaf9c57mshbeccc815a9fea34p1f3f39jsn47f97de18757"
];

export const DEFAULT_ENRICHMENT_SYSTEM_PROMPT = `Você é o "Deep BANT & Tech-Stack Enricher", o agente supremo de inteligência de prospecção B2B autônoma de ALTO TICKET.
Sua missão é enriquecer EMPRESAS REAIS que já foram encontradas e verificadas por uma fonte de dados real (Google Maps / LetScrape RapidAPI / OpenStreetMap).
Identifique falhas críticas de conversão, maturidade digital, tech stack plausível e gere abordagens comerciais de altíssima conversão.
NUNCA invente ou altere a identidade real (nome, website, telefone, e-mail, endereço, avaliações) da empresa fornecida.`;

export const DEFAULT_SUPERVISOR_SYSTEM_PROMPT = `Você é o "Supervisor de Qualidade & Auditor de Veracidade B2B".
Sua função é realizar uma auditoria rigorosa sobre os leads reais raspados e enriquecidos, avaliando:
1. Veracidade & Consistência: Os dados de contato e endereço condizem com uma empresa real em atividade? O site/domínio é plausível?
2. Aderência Comercial: O diagnóstico de dores e falhas operacionais faz sentido para o setor/porte da empresa?
3. Calculo do Reliability Score (0 a 100%): Quão confiável e pronto para disparo este lead está?
4. Recomendação Tática: Qual o melhor ângulo de ataque para o SDR abordar esta empresa sem soar genérico?
Seja objetivo, criterioso e focado em proteger a reputação do usuário e a taxa de resposta.`;

export const DEFAULT_COPYWRITER_PROMPT = `Você é um Copywriter B2B de Elite especializado em outbound de altíssima conversão.
Crie comunicações hiper-personalizadas (WhatsApp de curiosidade, Cold Email AIDA/PAS, Script de Ligação) sem clichês, focando nas falhas e dores reais da empresa.`;

export const DEFAULT_ICP_CLASSIFICATION_PROMPT = `# PROMPT DE CLASSIFICAÇÃO E QUALIFICAÇÃO DE LEADS (ICP) - MATRIZ SÊNIOR

## OBJETIVO
Você é um Analista de Inteligência Comercial Sênior e Treinador de SDRs. Sua missão é analisar a empresa [NOME DA EMPRESA] e determinar de forma objetiva e criteriosa se vale a pena o time de vendas gastar tempo entrando em contato com ela **agora**.

---

## 1. IDENTIFICAÇÃO E TIPO DE NEGÓCIO
Classifique a empresa em APENAS uma das categorias abaixo, baseada na evidência principal:
- **Fabricante/Indústria**
- **Distribuidor**
- **Revendedor/Lojista**
- **Prestador de Serviço**

---

## 2. MATRIZ DE CRITÉRIOS E PONTUAÇÃO (Total: 0 a 100 pontos)

Avalie cada critério rigorosamente. **Para cada item, você deve obrigatoriamente fornecer: [Nota] | [Justificativa Analítica] | [Fonte/Evidência encontrada].**

### A. Perfil Comercial e Porte (Peso Alto - Até 40 pts)
* **Perfil de Fabricante Confirmado (0 a 15 pts):** A empresa é comprovadamente fabricante ou distribuidora do segmento alvo?
* **Porte e Capacidade Compatível (0 a 15 pts):** Número de funcionários, faturamento estimado ou volume de operações condizem com o ICP?
* **Segmento e Potencial de Mercado (0 a 10 pts):** O setor de atuação é altamente lucrativo/prioritário?

### B. Presença Digital e Maturidade (Peso Médio - Até 25 pts)
* **Qualidade do Site (0 a 15 pts):** O site é moderno, rápido e profissional? (Analise UX, catálogo, HTTPS).
* **Atividade nas Redes Sociais (0 a 10 pts):** Possui perfis ativos e com postagens recentes (últimos 30 dias)?

### C. Oportunidade e Contato (Peso Alto - Até 35 pts)
* **Sinais de Necessidade / Dor (0 a 15 pts):** Há indícios claros de que precisam dos nossos serviços? (Ex: site obsoleto, falta de agendamento digital).
* **Facilidade de Contato (0 a 10 pts):** Existem canais diretos visíveis (e-mail decisor, telefone direto, WhatsApp comercial)?
* **Localização e Dados Atualizados (0 a 10 pts):** A empresa está na região geográfica atendida e os dados cadastrais são confiáveis?

### REGRA DE PENALIZAÇÃO (TRAVA DE SEGURANÇA)
Se a empresa possui volume de dados públicos (ex: CNPJ antigo), mas o site é obsoleto, as redes sociais são inativas ou faltam canais diretos de conversão, a pontuação final **NÃO PODE** ultrapassar 50/100, independente dos outros critérios.

---

## 3. FORMATO DA RESPOSTA (SAÍDA ESPERADA)

Use exatamente o formato abaixo para garantir a integração limpa na interface.

**RESUMO DA QUALIFICAÇÃO ICP**
* **Empresa:** [Nome]
* **Tipo:** [Categoria Definida]
* **Score ICP:** [X / 100]
* **Decisão:** [📞 LIGAR AGORA / ⏳ AGUARDAR / ⛔ DESCARTAR]

---

### DETALHAMENTO DA PONTUAÇÃO
| Critério | Nota | Justificativa Analítica | Fonte/Evidência |
| :--- | :--- | :--- | :--- |
| Fabricante Confirmado | X/15 | ... | ... |
| Porte Compatível | X/15 | ... | ... |
| Segmento/Potencial | X/10 | ... | ... |
| Qualidade do Site | X/15 | ... | ... |
| Redes Sociais | X/10 | ... | ... |
| Sinais de Necessidade | X/15 | ... | ... |
| Facilidade de Contato | X/10 | ... | ... |
| Localização/Dados | X/10 | ... | ... |

---

### GUIA RÁPIDO DE ABORDAGEM (TREINAMENTO SDR)
*Com base na análise, sintetize o caminho para o sucesso da ligação.*

* **Gancho Principal (Abertura):** [Crie UMA frase de abertura personalizada citando a empresa e a dor identificada, ex: "Vi que o site de [EMPRESA] ainda não tem agendamento online..."]
* **Parecer Final (Por que ligar):** [Um parágrafo curto explicando a viabilidade da chamada agora]
* **Próximo Passo Sugerido:** [Ex: Ligar e oferecer diagnóstico de 5 min]

---

### MATRIZ RÁPIDA DE OBJEÇÕES (TREINAMENTO SDR)
Identifique as 2 objeções mais prováveis que este lead específico fará e dê a resposta ideal:

1. **Objeção Provável 1:** [Ex: "Já temos agendamento via recepção"]
   * **Como Contornar:** [Ex: "Perfeito, a maioria dos nossos clientes também tinha! O problema é que a recepção perde até 30% do tempo confirmando dados via WhatsApp. Nós automatizamos essa confirmação."]

2. **Objeção Provável 2:** [Ex: "Não temos orçamento agora"]
   * **Como Contornar:** [Ex: "Entendo perfeitamente. Por isso mesmo nosso diagnóstico de 5 minutos mostra como recuperar até 5 cadeiras vazias por semana sem custo inicial."]`;

export const DEFAULT_AI_ENGINE_CONFIG: AiEngineConfig = {
  activeProvider: "auto",
  groqKeys: ["", "", ""],
  groqModel: "llama-3.3-70b-versatile",
  temperature: 0.35,
  autoFallbackToGemini: true,
  autoRotateOnRateLimit: true,
  activeKeyIndex: 0,
  keyStatuses: [
    { index: 0, keyPreview: "Não configurada", status: "UNTESTED" },
    { index: 1, keyPreview: "Não configurada", status: "UNTESTED" },
    { index: 2, keyPreview: "Não configurada", status: "UNTESTED" }
  ],
  rapidApiKeys: DEFAULT_RAPIDAPI_KEYS,
  rapidApiRotationMode: "sequential",
  activeRapidApiKeyIndex: 0,
  rapidApiKeyStatuses: [
    { index: 0, keyPreview: "f3fd79...653", status: "VALID" },
    { index: 1, keyPreview: "Não configurada", status: "UNTESTED" },
    { index: 2, keyPreview: "Não configurada", status: "UNTESTED" }
  ],
  supervisorAiEnabled: true,
  supervisorModel: "llama-3.3-70b-versatile",
  customPrompts: {
    enrichmentSystemPrompt: DEFAULT_ENRICHMENT_SYSTEM_PROMPT,
    supervisorSystemPrompt: DEFAULT_SUPERVISOR_SYSTEM_PROMPT,
    copywriterPrompt: DEFAULT_COPYWRITER_PROMPT,
    icpClassificationPrompt: DEFAULT_ICP_CLASSIFICATION_PROMPT
  },
  customGeminiApiKey: "",
  geminiKeyStatus: { status: "UNTESTED" },
  useGroundingTools: false, // Previne 403 PERMISSION_DENIED em chaves gratuitas do Google AI Studio
  geminiModel: "gemini-3.7-flash"
};

export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile (Recomendado - Mais Inteligente)", note: "128k contexto • Alta precisão e raciocínio B2B" },
  { id: "groq/compound", label: "GroqCompound (450 T/s - Sistema Composto)", note: "131k contexto • 200 RPM Free • Ultra-rápido" },
  { id: "groq/compound-mini", label: "GroqCompound Mini (450 T/s - Leve)", note: "131k contexto • 200 RPM Free • Baixa latência" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Ultra-Rápido)", note: "128k contexto • Respostas instantâneas" },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill Llama 70B (Raciocínio Avançado)", note: "128k contexto • Cadeia de pensamento para análise profunda" },
  { id: "llama3-70b-8192", label: "Meta Llama 3 70B (8k)", note: "8k contexto • Alta capacidade analítica" },
  { id: "llama3-8b-8192", label: "Meta Llama 3 8B (8k)", note: "8k contexto • Eficiente e leve" },
  { id: "gemma2-9b-it", label: "Google Gemma 2 9B IT", note: "8k contexto • Modelo Google otimizado para instruções" },
  { id: "qwen-2.5-32b", label: "Qwen 2.5 32B", note: "128k contexto • Excelente em código e estruturação de dados" },
  { id: "qwen-qwq-32b", label: "Qwen QwQ 32B (Raciocínio)", note: "32k contexto • Raciocínio matemático e lógico" }
];

export const GEMINI_MODELS = [
  { id: "gemini-3.7-flash", label: "Gemini 3.7 Flash (Recomendado - Mais Rápido & Inteligente)", note: "GA • melhor para B2B e IA de Alta Performance" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", note: "GA • ultra estável" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", note: "GA • ultra leve e econômico" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", note: "Raciocínio complexo" }
];

export const COMPANY_EMAIL_TEMPLATE = `Olá {{name}},

Estava analisando a operação digital de empresas em {{city}} e identifiquei oportunidades claras de melhoria na captação de clientes.

Na nossa agência, estruturamos automações de IA, sites de alta conversão e SDRs de WhatsApp que destravam o funil comercial sem aumentar o headcount.

Consegue 10 minutos nesta semana para eu te mostrar um diagnóstico personalizado para o seu negócio?

Abraços,
Equipe Comercial`;

export const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  websiteUrl: "https://meusite.com.br",
  businessName: "Nexus AI Automation & B2B Solutions",
  servicesDescription: "Agência de Automação de Inteligência Artificial, Criação de Sites Modernos 3.0, SDRs Autônomos de WhatsApp/Email, Integrações n8n/Make, CRM e Otimização de Processos de Vendas para empresas de Alto Ticket.",
  ticketMedio: "R$ 8.000 - R$ 35.000 / projeto (ou MRR de R$ 4.500/mês)",
  icpTarget: "Empresas com ticket médio elevado (Clínicas Médicas & Estética Avançada, Construtoras & Incorporadoras de Alto Padrão, Energia Solar & Climatização, Concessionárias & Veículos Premium, Indústrias B2B e Consultorias) que utilizam o meio digital positivamente e precisam de automação de SDR e gestão de presença digital mensal para fechar mais contratos.",
  senderName: "Nivaldo Freitas",
  senderRole: "Estrategista Digital & Consultoria Digital Independente",
  useGenericSenderOnFirstContact: true,
  rgpdOptOutNotice: "Aviso de Privacidade & RGPD: Esta comunicação destina-se estritamente ao âmbito profissional B2B. Caso não pretenda receber futuros contactos ou pretenda a eliminação imediata dos seus dados, responda a esta mensagem com a palavra 'STOP'. O seu endereço será automaticamente bloqueado no nosso sistema.",
  uvp: "Implementamos infraestrutura completa de presença digital moderna, automações inteligentes e agentes de IA no WhatsApp que multiplicam a conversão comercial sem aumentar o headcount.",
  solvedPains: [
    "Demora de horas para responder leads no WhatsApp e formulários, perdendo negócios para concorrentes",
    "Equipe comercial perdendo tempo com tarefas manuais em vez de fechar contratos",
    "Presença digital desatualizada que não transmite autoridade para clientes de alto ticket",
    "Falta de follow-up estruturado e leads esquecidos no pipeline",
    "Ausência de integração entre canais de marketing, WhatsApp e CRM centralizado"
  ],
  commonObjections: [
    "Já temos uma agência ou fornecedor que cuida do nosso marketing",
    "Não temos tempo para implementar novas ferramentas agora",
    "Temos receio de que automações fiquem robotizadas ou sem empatia",
    "Qual é a garantia real de retorno sobre o investimento (ROI)?"
  ],
  competitiveDifferentials: [
    "Agentes de IA hiper-humanizados que entendem o contexto completo do cliente e agendam reuniões em segundos",
    "Entrega turnkey completa (Site de Alta Performance + Automações + CRM + Roteiros de Vendas)",
    "Integração nativa com WhatsApp Oficial, HubSpot, CriahubCRM, Evolution API e ERPs",
    "Foco obstinado em ROI mensurável e aumento direto da receita do cliente"
  ],
  comparisonVectors: [
    "Presença de canal de atendimento digital lento ou inexistente",
    "Site antigo, lento ou sem call-to-action otimizado para conversão",
    "Maturidade comercial e capacidade de investimento do prospect",
    "Gaps críticos na captura de leads (sem pixel, sem chatbot, sem automação)"
  ],
  recommendedHighTicketNiches: DEFAULT_HIGH_TICKET_NICHES
};

export const BRAZIL_STATES = [
  "Todas", "São Paulo (SP)", "Rio de Janeiro (RJ)", "Minas Gerais (MG)", 
  "Paraná (PR)", "Santa Catarina (SC)", "Rio Grande do Sul (RS)", 
  "Bahia (BA)", "Ceará (CE)", "Distrito Federal (DF)", "Goiás (GO)", 
  "Pernambuco (PE)", "Espírito Santo (ES)", "Mato Grosso (MT)", "Amazonas (AM)"
];

export const PORTUGAL_DISTRICTS = [
  "Todas", "Aveiro", "Beja", "Braga", "Bragança", "Castelo Branco", "Coimbra", "Évora", 
  "Faro", "Guarda", "Leiria", "Lisboa", "Portalegre", "Porto", "Santarém", 
  "Setúbal", "Viana do Castelo", "Vila Real", "Viseu", "Madeira", "Açores"
];

export const BUSINESS_CATEGORIES = [
  "Clínicas Médicas e Odontológicas",
  "Imobiliárias e Incorporadoras",
  "Energia Solar, Fotovoltaico & Climatização",
  "Concessionárias & Veículos Premium",
  "Agências de Marketing e Publicidade",
  "Consultorias Empresariais e Financeiras",
  "Empresas de Tecnologia e SaaS",
  "Logística e Transportes",
  "Indústrias e Manufatura",
  "Engenharia e Construção Civil",
  "Contabilidade e Auditoria",
  "Distribuidoras e Atacadistas",
  "Educação e Treinamentos Corporativos"
];

export const DEFAULT_FILTERS = {
  minRating: 0.0,
  maxReviews: 10000,
  hasWebsite: 'any',
  hasPhone: 'any',
  hasEmail: 'any',
  minScore: 0,
  status: 'all',
  businessStatus: 'open_only',
  icpTier: 'all',
  intentPriority: 'all',
  originApi: 'all',
  roiVerdict: 'all',
  highTicketOnly: false,
  searchQuery: ''
} as const;

export const COUNTRY_CITIES: Record<string, string[]> = {
  "Brasil": [
    "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", 
    "Florianópolis", "Brasília", "Salvador", "Fortaleza", "Recife", "Goiânia", 
    "Campinas", "Ribeirão Preto", "Santos", "Joinville", "Londrina", "Vitória"
  ],
  "Portugal": [
    "Lisboa", "Oeiras", "Paço de Arcos", "Cascais", "Sintra", "Porto", "Braga", 
    "Coimbra", "Aveiro", "Faro", "Funchal", "Guimarães", "Leiria", "Setúbal", "Viseu"
  ],
  "Espanha": [
    "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Bilbao", "Zaragoza"
  ],
  "Estados Unidos": [
    "New York", "Miami", "San Francisco", "Austin", "Los Angeles", "Chicago", "Boston"
  ],
  "Reino Unido": [
    "London", "Manchester", "Birmingham", "Edinburgh", "Bristol", "Leeds"
  ]
};
