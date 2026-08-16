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
    id: "niche-advocacia-corp",
    niche: "Escritórios de Advocacia Corporativa & Tributária",
    category: "Serviços Jurídicos B2B",
    tag: "💎 R$ 15k a R$ 60k",
    whyGoodMatch: "Honorários consultivos de 5 a 6 dígitos; precisam qualificar teses de clientes antes de alocar tempo dos sócios.",
    estimatedTicket: "R$ 15.000 a R$ 60.000",
    criticalGaps: [
      "Prospecção passiva 100% dependente de indicações",
      "Sites estáticos sem conversão nem captura LGPD",
      "Sem qualificação automática de causas e teses"
    ],
    suggestedOfferBundle: "Automação de Triagem de Teses B2B + Outbound Automatizado + Landing Page Institucional de Alta Autoridade"
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
      id: "pt-niche-advocacia-corp",
      niche: "Escritórios de Advocacia Corporativa & Fiscal",
      category: "Serviços Jurídicos B2B",
      tag: "💎 €8k a €25k",
      whyGoodMatch: "Honorários consultivos de 5 dígitos; sócios precisam qualificar teses e arrancar de processos manuais e indicações esporádicas.",
      estimatedTicket: "€8.000 a €25.000",
      criticalGaps: [
        "Prospeção passiva 100% dependente de indicações",
        "Sites institucionais sem conversão nem captura RGPD",
        "Sem qualificação automática de causas e teses"
      ],
      suggestedOfferBundle: "Automação de Triagem de Teses B2B + Outbound Automatizado + Landing Page de Alta Autoridade"
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
      id: "es-niche-abogados",
      niche: "Despachos de Abogados Corporativos & Fiscales",
      category: "Servicios Jurídicos B2B",
      tag: "💎 €9k a €28k",
      whyGoodMatch: "Honorarios consultivos altos; necesitan cualificar tesis y dejar de depender solo de referidos.",
      estimatedTicket: "€9.000 a €28.000",
      criticalGaps: [
        "Prospección pasiva dependiente de referidos",
        "Sitios sin conversión ni captura RGPD",
        "Sin cualificación automática de causas"
      ],
      suggestedOfferBundle: "Automatización de Triaje de Tesis B2B + Outbound Automatizado + Landing de Autoridad"
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
      id: "uk-niche-law",
      niche: "Corporate & Tax Law Firms",
      category: "Legal Services B2B",
      tag: "💎 £15k a £50k",
      whyGoodMatch: "5-to-6 figure retainers; firms need to qualify cases before allocating partner time.",
      estimatedTicket: "£15,000 to £50,000",
      criticalGaps: [
        "Passive prospecting dependent on referrals",
        "Static websites without conversion",
        "No automated case qualification"
      ],
      suggestedOfferBundle: "B2B Case Triage Automation + Outbound Engine + Authority Landing Pages"
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
  customGeminiApiKey: "",
  geminiKeyStatus: { status: "UNTESTED" },
  useGroundingTools: false, // Previne 403 PERMISSION_DENIED em chaves gratuitas do Google AI Studio
  geminiModel: "gemini-3.6-flash"
};

export const GEMINI_MODELS = [
  { id: "gemini-3.6-flash", label: "Gemini 3.6 Flash (Recomendado - Rápido & Atual)", note: "GA • melhor custo/desempenho" },
  { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", note: "GA • alta inteligência" },
  { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash-Lite", note: "GA • mais econômico" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (Legado)", note: "Descontinuado em 16/10/2026" }
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
  icpTarget: "Empresas com ticket médio elevado (Clínicas Premium, Escritórios de Advocacia, Incorporadoras, Indústrias B2B, Consultorias) que precisam modernizar sua presença digital e atendimento automatizado para fechar mais vendas.",
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
    "Integração nativa com WhatsApp Oficial, HubSpot, Pitro CRM, Evolution API e ERPs",
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
  "Agências de Marketing e Publicidade",
  "Consultorias Empresariais e Financeiras",
  "Escritórios de Advocacia B2B",
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
  intentPriority: 'all'
} as const;

export const COUNTRY_CITIES: Record<string, string[]> = {
  "Brasil": [
    "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", 
    "Florianópolis", "Brasília", "Salvador", "Fortaleza", "Recife", "Goiânia", 
    "Campinas", "Ribeirão Preto", "Santos", "Joinville", "Londrina", "Vitória"
  ],
  "Portugal": [
    "Lisboa", "Porto", "Braga", "Coimbra", "Aveiro", "Faro", "Funchal", 
    "Guimarães", "Leiria", "Setúbal", "Cascais", "Sintra", "Viseu", "Oeiras"
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
