import { BusinessProfile, HighTicketNicheRecommendation, AiEngineConfig } from "./types";

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

export const SUPPORTED_COUNTRIES = [
  "Brasil", "Portugal", "Espanha", "Estados Unidos", "Reino Unido", 
  "França", "Alemanha", "Itália", "Países Baixos", "México", "Chile", "Colômbia"
];

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
