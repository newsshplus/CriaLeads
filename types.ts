export type IcpTier = 'SCORE_A' | 'SCORE_B' | 'SCORE_C';
export type IntentPriority = 'HIGH' | 'MEDIUM' | 'DISQUALIFIED';

export interface BantPlusAnalysis {
  budget: {
    estimatedBudget: string;
    companySize: string;
    estimatedRevenue: string;
    rating: 'Alto' | 'Médio' | 'Baixo';
  };
  authority: {
    keyDecisionMaker: string;
    role: string;
    orgStructure: string; // Ex: CEO, CMO, CTO, Diretor de Operações
    linkedinSearchUrl?: string;
  };
  need: {
    operationalFlaws: string[]; // Mapeamento de 3 falhas operacionais, estéticas ou tecnológicas visíveis
    primaryNeed: string;
    impactSummary: string;
  };
  timeline: {
    urgencyFactor: string; // Indicador de urgência (vagas abertas LinkedIn, expansão recente, techs defasadas)
    urgencyLevel: 'Crítico (Imediato)' | 'Médio (30 dias)' | 'Baixo';
    signals: string[];
  };
}

export interface TechStackAnalysis {
  detectedTools: string[]; // Ex: Meta Pixel, Google Analytics, WordPress, HubSpot, RD Station, Hotjar, etc.
  cmsOrPlatform: string;
  analyticsAndPixels: string[];
  crmAndAutomation: string[];
  vulnerabilitiesAndGaps: string[]; // Brechas na estrutura atual
}

export interface DecisionMaker {
  name: string;
  role: string;
  linkedin?: string;
  directEmail?: string;
  directPhone?: string;
}

export interface OmnichannelOutreach {
  whatsapp: {
    option1Curiosity: string; // Abertura de Curiosidade baseada em falha real
    option2RoiDirect: string; // Áudio Transcrito / Texto curto focado em ROI direto
  };
  email: {
    subject: string;
    bodyAida: string; // Estrutura AIDA hiper-específica
    bodyPas: string;  // Estrutura PAS (Problem-Agitate-Solve)
  };
  coldCall: {
    iceBreaker5s: string;       // Quebra de gelo de 5 segundos
    anchorQuestion: string;     // Pergunta de ancoragem sobre o problema
    pitch15s: string;           // Pitch de 15s para agendamento
    objectionTips?: string[];   // Dicas rápidas de contorno de objeções
  };
}

export interface DeliverabilityGuardian {
  whatsappShield: {
    antiBanStatus: 'PROTECTED' | 'OPTIMIZED' | 'WARNING';
    spamRiskScore: number; // 0 a 100 (0 = risco zero, protegido)
    spinningVariations: {
      variationA: string; // Variação 1: Curiosidade & Abordagem Suave
      variationB: string; // Variação 2: Foco em Eficiência & ROI Direto
      variationC: string; // Variação 3: Diagnóstico Técnico & Pergunta Rápida
    };
    removedTriggerWords: string[]; // Palavras de spam filtradas (ex: "promoção", "ganhe dinheiro")
    temporalHumanization: {
      typingDelaySeconds: number; // Intervalo de digitação simulada (ex: 22s)
      presenceState: 'composing' | 'recording';
      suggestedSendingWindow: string; // Janela ideal (ex: 09:30 - 11:30 ou 14:15 - 16:30)
      pacingRecommendation: string;
    };
  };
  emailShield: {
    syntaxStatus: 'VALID' | 'SUSPICIOUS' | 'INVALID';
    domainHealth: {
      mxRecord: boolean;
      spfConfigured: boolean;
      dkimReady: boolean;
      dmarcStatus: 'PASS' | 'ALIGNMENT_OK' | 'SIMULATED_PASS';
    };
    deliverabilityScore: number; // 99%+
    inboxPlacementPrediction: 'CAIXA_PRINCIPAL' | 'SPAM_RISK';
    cleanPlainText: {
      subject: string;
      body: string; // Plain Text 100% puro para garantir chegada na caixa primária
    };
    spamWordsFiltered: string[];
  };
}

export interface ObjectionCrusherItem {
  objection: string;
  responseScript: string; // Máximo 3 frases com tom empático, assertivo e focado em valor
  psychologicalAngle: string;
  keyKeywords: string[];
  sdrGuidance: string;
}

export interface ObjectionCrusherMatrix {
  targetCompanyProfile: {
    name: string;
    decisionMaker: string;
    niche: string;
    mappedPain: string;
    technicalGapAnchor: string;
    budgetContext: string;
  };
  objections: {
    alreadyHaveProvider: ObjectionCrusherItem; // 1. "Já tenho uma agência/fornecedor que faz isso."
    sendByEmail: ObjectionCrusherItem;         // 2. "Me envia uma proposta por e-mail."
    noBudget: ObjectionCrusherItem;            // 3. "Não temos orçamento no momento."
    noTime: ObjectionCrusherItem;              // 4. "Não tenho tempo para falar agora."
    notInterested: ObjectionCrusherItem;       // 5. "Não tenho interesse."
  };
  fastClosingCTAs: {
    googleCalendarTransition: string; // Fechamento 1: Transição direta para Google Calendar
    executiveTwoOptionClose: string;  // Fechamento 2: Opção binária de horário executivo
  };
}

export interface CadenceMessage {
  channel: 'whatsapp' | 'email' | 'call' | 'linkedin';
  label: string;
  subject?: string;
  content: string;
  notes?: string;
  cta?: string;
}

export interface CadenceStep {
  day: number; // 1, 3, 5, 8, 12, 16, 21
  stepNumber: number; // 1 to 7
  title: string;
  primaryChannel: 'whatsapp' | 'email' | 'call' | 'linkedin' | 'multichannel';
  objective: string;
  strategicContext: string;
  messages: CadenceMessage[];
  status: 'pending' | 'sent' | 'skipped' | 'stopped';
  sentAt?: string;
}

export interface CadenceMaster {
  leadId: string;
  leadName: string;
  companyName: string;
  totalDays: number;
  totalSteps: number;
  currentDay: number;
  activeStepIndex: number;
  isAutomationActive: boolean;
  leadResponded: boolean;
  responseChannel?: 'whatsapp' | 'email' | 'call' | 'linkedin';
  respondedAt?: string;
  stopTriggerRule: string; // "Se o lead responder em QUALQUER canal, interromper imediatamente a automação de follow-up e criar uma tarefa no CRM com tag 'LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO'."
  crmStopPayload: {
    event: string;
    leadId: string;
    company: string;
    contactName: string;
    channelDetected?: string;
    tag: string;
    priority: string;
    assignedSdrAction: string;
    timestamp: string;
  };
  steps: CadenceStep[];
}

export interface WebhookPayloads {
  evolutionApiWhatsApp?: {
    number: string;
    text: string;
    delay: number;
    presence: 'composing' | 'recording';
    variationUsed: 'A' | 'B' | 'C';
    leadName: string;
    company: string;
  };
  pitroCrmSync?: {
    leadId: string;
    companyName: string;
    contactName: string;
    phone: string;
    email: string;
    icpTier: IcpTier;
    icpScore: number;
    intentScore: number;
    intentPriority: IntentPriority;
    status: string;
    pipelineStage: string;
    evolutionPayload: {
      number: string;
      message: string;
      delaySeconds: number;
      presence: 'composing' | 'recording';
      instance: string;
    };
    emailPayload: {
      to: string;
      subject: string;
      plainText: string;
      aidaHtml?: string;
    };
    bantPlusSummary: {
      budgetRating: string;
      estimatedBudget: string;
      keyDecisionMaker: string;
      urgencyLevel: string;
      operationalFlaws: string[];
    };
    techStackSummary: {
      cms: string;
      detectedTools: string[];
      brechas: string[];
    };
    cadence21d: {
      currentStep: number;
      totalSteps: number;
      status: string;
      stopTriggerTag: string;
    };
    aiSalesCopilotNotes: {
      iceBreaker: string;
      anchorQuestion: string;
      pitch15s: string;
      topObjections: { objection: string; responseScript: string }[];
    };
  };
  zapiWhatsApp: {
    phone: string;
    message: string;
    leadName: string;
    company: string;
    icpScore: number;
    intentScore?: number;
  };
  resendEmail: {
    to: string;
    subject: string;
    text: string;
    html?: string;
    headers?: Record<string, string>;
    tags: { name: string; value: string }[];
  };
  hubspotCrmTask: {
    taskName: string;
    company: string;
    contactName: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dealStage: string;
    callScriptNotes: string;
    identifiedPain: string;
    dueDate: string;
    intentScore?: number;
    techStack?: string[];
    urgencyFactor?: string;
  };
}

export interface PitroCrmConfig {
  webhookUrl: string;
  apiToken?: string;
  evolutionInstanceName?: string;
  evolutionApiUrl?: string;
  resendApiKey?: string;
  senderEmail?: string;
  autoSyncOnContacted: boolean;
  defaultPipelineStage: 'Prospecção Fria' | 'Qualificação BANT+' | 'Demonstração Agendada' | 'Proposta Enviada';
}

export interface LiveConversationTurn {
  id: string;
  sender: 'lead' | 'agent' | 'system';
  channel: 'audio_call' | 'whatsapp_audio' | 'whatsapp_text' | 'video_call';
  text: string;
  timestamp: string;
  sentiment?: 'positivo' | 'neutro' | 'cético' | 'hostil' | 'interessado';
  objectionDetected?: string;
}

export interface AiLiveCopilotAnalysis {
  timestamp: string;
  leadId?: string;
  leadName?: string;
  companyName?: string;
  sentiment: 'positivo' | 'neutro' | 'cético' | 'hostil' | 'interessado';
  sentimentConfidence: number; // 0-100%
  buyingSignalScore: number; // 0-100% (Temperatura de fechamento)
  detectedIntent: string; // Ex: 'Dúvida sobre Preço', 'Comparando com Concorrência', 'Falta de Tempo'
  identifiedObjectionCategory?: 'PREÇO' | 'TEMPO' | 'AUTORIDADE' | 'CONFIANÇA' | 'CONCORRENTE' | 'OUTROS';
  
  // Real-time Actionable AI Recommendations:
  liveRebuttalScript: string; // Script de fala imediata para o agente falar na chamada (2-3 frases assertivas)
  whatsappQuickResponse: string; // Resposta formatada para WhatsApp com quebra de objeção e CTA de baixa fricção
  keyPsychologicalTrigger: string; // Ex: "Ancoragem de Custo de Inação", "Prova Social de Autoridade"
  nextBestAction: string; // Ex: "Propor micro-compromisso de 10 min", "Mandar caso de sucesso pelo WhatsApp"
  suggestedMeetingTimes: string[]; // Sugestões de horários rápidos (ex: "Amanhã às 10h30 ou 14h")
  isReadyForClosing: boolean;
  pitroCrmNote: string; // Nota gerada pela IA para sincronizar no CRM
}

export interface Lead {
  id: string;
  name: string;
  category: string;
  description?: string;
  address: string;
  city: string;
  district?: string;
  country?: string;
  website?: string;
  phone?: string;
  email?: string;
  rating: number;
  reviews: number;
  googleMapsLink?: string;
  score: number; // General opportunity score (0-100)
  
  // Architect-Prospector Engine:
  icpScore: number; // 0-100%
  icpTier: IcpTier; // SCORE_A (85-100%), SCORE_B (60-84%), SCORE_C (<60%)
  identifiedPain: string; // Dor operacional / técnica detectada
  suggestedAction: string; // Próxima Ação recomendada
  matchReason?: string; // Motivo da correlação com o UVP do negócio
  digitalGaps: string[]; // Gaps
  budgetMaturity: 'Alta' | 'Média' | 'Baixa';
  decisionMaker: DecisionMaker;
  outreach: OmnichannelOutreach;
  webhookPayloads: WebhookPayloads;

  // Deep BANT+ & Tech-Stack Enricher:
  bantPlus?: BantPlusAnalysis;
  techStack?: TechStackAnalysis;
  intentScore: number; // 0-100
  intentPriority: IntentPriority; // Score >80: HIGH (até 1h), 50-79: MEDIUM (fila padrão), <50: DISQUALIFIED
  urgencyFactor: string; // Fator de urgência sintetizado
  keyFlaws: string[]; // 3 falhas principais mapeadas

  // Deliverability & Anti-Ban Guardian:
  guardian?: DeliverabilityGuardian;

  // Elite Sales Objection Crusher (Cold Call & Live Pitch Copilot):
  objectionCrusher?: ObjectionCrusherMatrix;

  // Omnichannel Cadence Master (21-day Outbound Follow-up Engine):
  cadence?: CadenceMaster;

  status: 'new' | 'contacted' | 'qualified' | 'ignored';
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | 'UNKNOWN';
  lastContactedAt?: string;
  notes?: string;
  source?: 'ai' | 'synthetic';
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  speechLang: string;
  defaultCity: string;
  flag: string;
  label: string;
  pipelineScale: number;
}

export interface HighTicketNicheRecommendation {
  id: string;
  niche: string;
  category: string;
  tag: string; // Ex: '🔥 R$ 10k-35k', '💎 Ultra Conversão', '🏢 B2B Enterprise'
  whyGoodMatch: string; // Por que combina com os seus serviços
  estimatedTicket: string; // Ex: 'R$ 8.000 a R$ 25.000'
  criticalGaps: string[]; // Dores crônicas desse nicho
  suggestedOfferBundle: string; // O que você pode vender para eles
}

export interface GroqKeyStatus {
  index: number;
  keyPreview: string;
  status: 'VALID' | 'RATE_LIMITED' | 'ERROR' | 'UNTESTED';
  lastUsed?: string;
  requestsCount?: number;
  errorMessage?: string;
}

export interface GeminiKeyStatus {
  status: 'VALID' | 'ERROR' | 'UNTESTED';
  keyPreview?: string;
  lastUsed?: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface AiEngineConfig {
  activeProvider: 'auto' | 'gemini' | 'groq' | 'free_autonomous';
  groqKeys: [string, string, string]; // Pool de até 3 API keys do Groq (100% Gratuito)
  groqModel: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' | 'mixtral-8x7b-32768';
  temperature: number;
  autoFallbackToGemini: boolean;
  autoRotateOnRateLimit: boolean;
  activeKeyIndex: number;
  keyStatuses: GroqKeyStatus[];
  customGeminiApiKey?: string; // Chave gratuita do Google AI Studio (aistudio.google.com)
  geminiKeyStatus?: GeminiKeyStatus;
  useGroundingTools?: boolean; // Se falso, não anexa ferramentas pagas (previne 403 Permission Denied)
  geminiModel?: string; // Modelo ativo do Gemini (ex: gemini-3.6-flash)
}

export interface BusinessProfile {
  websiteUrl: string;
  businessName: string;
  servicesDescription: string;
  ticketMedio: string;
  icpTarget: string; // Perfil de Cliente Ideal
  // AI Extracted metrics:
  uvp: string; // Proposta Única de Valor
  solvedPains: string[]; // Dores que resolvemos
  commonObjections: string[]; // Objeções comuns
  competitiveDifferentials: string[]; // Diferenciais competitivos
  comparisonVectors: string[]; // Vetores de comparação
  recommendedHighTicketNiches?: HighTicketNicheRecommendation[]; // Nichos de alto ticket gerados automaticamente
  extractedKeywords?: string[];
  lastAnalyzedAt?: string;
}

export interface ScrapingEngineStatus {
  primary: { name: string; status: 'ACTIVE' | 'IDLE' | 'LIMIT_REACHED' | 'STANDBY' };
  secondary: { name: string; status: 'STANDBY' | 'ACTIVE' | 'FALLBACK_READY' };
  tertiary: { name: string; status: 'STANDBY' | 'ACTIVE' | 'READY' };
  activeEngine: string;
  lastLatencyMs: number;
  extractedCount: number;
  aiEngineActive?: string;
}

export interface SearchParams {
  keyword: string;
  searchMode?: 'auto_high_ticket' | 'custom_niche';
  selectedHighTicketNiches?: string[];
  country: string;
  city: string;
  district: string;
  radius: number;
  strictMode: boolean;
  minIcpScore?: number;
  tierFilter?: 'ALL' | 'SCORE_A_B' | 'SCORE_A_ONLY';
}

export interface FilterState {
  minRating: number;
  maxReviews: number;
  hasWebsite: 'any' | 'yes' | 'no';
  hasPhone: 'any' | 'yes' | 'no';
  hasEmail: 'any' | 'yes' | 'no';
  minScore: number;
  status: 'all' | 'new' | 'contacted' | 'qualified' | 'ignored';
  businessStatus: 'all' | 'open_only';
  icpTier: 'all' | 'SCORE_A' | 'SCORE_B' | 'SCORE_C' | 'HOT_WARM';
  intentPriority: 'all' | 'HIGH' | 'MEDIUM' | 'DISQUALIFIED' | 'QUALIFIED_ONLY';
}

export type SortOption = 
  | 'intent_score_desc'
  | 'icp_score_desc' 
  | 'opportunity_score' 
  | 'low_competition' 
  | 'no_website' 
  | 'rating_desc' 
  | 'reviews_desc';

export interface DashboardStats {
  totalLeads: number;
  avgScore: number;
  avgIcpScore: number;
  avgIntentScore: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  disqualifiedCount: number;
  scoreACount: number;
  scoreBCount: number;
  scoreCCount: number;
  leadsWithWebsite: number;
  leadsWithoutWebsite: number;
  leadsWithPhone: number;
  leadsWithEmail: number;
  estimatedPipelineValue: string;
}
