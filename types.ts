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
  criahubCrmSync?: {
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

export interface CriahubCrmConfig {
  webhookUrl: string;
  organizationId?: string;
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
  criahubCrmNote: string; // Nota gerada pela IA para sincronizar no Criahub CRM
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

/* ============================================================
   MENU / NAVIGATION PERMISSION SYSTEM (Admin Panel)
   ============================================================ */

export type MenuItemId = 
  | 'dashboard'
  | 'prospector'
  | 'prospector.search'
  | 'prospector.auto_discovery'
  | 'prospector.pipeline'
  | 'prospector.leads'
  | 'prospector.filters'
  | 'prospector.export'
  | 'crm'
  | 'crm.criahub'
  | 'crm.webhooks'
  | 'crm.pipeline'
  | 'crm.contacts'
  | 'copilot'
  | 'copilot.live'
  | 'copilot.history'
  | 'outreach'
  | 'outreach.whatsapp'
  | 'outreach.email'
  | 'outreach.cadence'
  | 'outreach.objections'
  | 'outreach.deliverability'
  | 'analytics'
  | 'analytics.dashboard'
  | 'analytics.funnel'
  | 'analytics.roi'
  | 'settings'
  | 'settings.profile'
  | 'settings.ai_keys'
  | 'settings.integrations'
  | 'settings.country'
  | 'settings.team'
  | 'settings.billing'
  | 'admin'
  | 'admin.users'
  | 'admin.roles'
  | 'admin.permissions'
  | 'admin.logs'
  | 'admin.audit';

export interface MenuItem {
  id: MenuItemId;
  label: string;
  icon?: string; // lucide-react icon name
  path?: string; // optional route path
  parentId?: MenuItemId; // for submenus
  order: number;
  visible: boolean; // global visibility (can be overridden by permissions)
  requiredPermission?: string; // custom permission string
  badge?: string; // optional badge (e.g., "Novo", count)
  children?: MenuItem[];
}

export interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: Record<MenuItemId, boolean>; // true = visible, false = hidden
}

export interface UserPermissions {
  userId: string;
  roleId: string;
  customPermissions?: Record<MenuItemId, boolean>; // override role permissions
}

export interface AdminMenuConfig {
  version: number;
  updatedAt: string;
  updatedBy: string;
  menuItems: MenuItem[];
  roles: RolePermission[];
  defaultRoleId: string;
}

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Dashboard
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/', order: 1, visible: true },
  
  // Prospector (Prospecção)
  { id: 'prospector', label: 'Prospecção', icon: 'Target', order: 10, visible: true, children: [
    { id: 'prospector.search', label: 'Busca & Descoberta', icon: 'Search', path: '/prospector/search', order: 1, visible: true },
    { id: 'prospector.auto_discovery', label: 'Auto-Discovery Alto Ticket', icon: 'Zap', path: '/prospector/auto', order: 2, visible: true },
    { id: 'prospector.pipeline', label: 'Pipeline de Leads', icon: 'Pipeline', path: '/prospector/pipeline', order: 3, visible: true },
    { id: 'prospector.leads', label: 'Lista de Leads', icon: 'List', path: '/prospector/leads', order: 4, visible: true },
    { id: 'prospector.filters', label: 'Filtros Avançados', icon: 'Filter', path: '/prospector/filters', order: 5, visible: true },
    { id: 'prospector.export', label: 'Exportar Leads', icon: 'Download', path: '/prospector/export', order: 6, visible: true },
  ]},
  
  // CRM
  { id: 'crm', label: 'CRM & Automação', icon: 'Building2', order: 20, visible: true, children: [
    { id: 'crm.criahub', label: 'Criahub CRM', icon: 'Building2', path: '/crm/criahub', order: 1, visible: true },
    { id: 'crm.webhooks', label: 'Webhooks & n8n', icon: 'Webhook', path: '/crm/webhooks', order: 2, visible: true },
    { id: 'crm.pipeline', label: 'Pipeline CRM', icon: 'Pipeline', path: '/crm/pipeline', order: 3, visible: true },
    { id: 'crm.contacts', label: 'Contatos & Sync', icon: 'Users', path: '/crm/contacts', order: 4, visible: true },
  ]},
  
  // Copilot
  { id: 'copilot', label: 'Copilot IA', icon: 'Brain', order: 30, visible: true, children: [
    { id: 'copilot.live', label: 'Copilot Ao Vivo', icon: 'Mic', path: '/copilot/live', order: 1, visible: true },
    { id: 'copilot.history', label: 'Histórico & Análises', icon: 'History', path: '/copilot/history', order: 2, visible: true },
  ]},
  
  // Outreach (Omnichannel)
  { id: 'outreach', label: 'Outreach Omnichannel', icon: 'MessageSquare', order: 40, visible: true, children: [
    { id: 'outreach.whatsapp', label: 'WhatsApp & Evolution', icon: 'MessageSquare', path: '/outreach/whatsapp', order: 1, visible: true },
    { id: 'outreach.email', label: 'Email & Deliverability', icon: 'Mail', path: '/outreach/email', order: 2, visible: true },
    { id: 'outreach.cadence', label: 'Cadência 21 Dias', icon: 'Calendar', path: '/outreach/cadence', order: 3, visible: true },
    { id: 'outreach.objections', label: 'Objection Crusher', icon: 'ShieldAlert', path: '/outreach/objections', order: 4, visible: true },
    { id: 'outreach.deliverability', label: 'Deliverability Guardian', icon: 'ShieldCheck', path: '/outreach/deliverability', order: 5, visible: true },
  ]},
  
  // Analytics
  { id: 'analytics', label: 'Analytics & ROI', icon: 'BarChart3', order: 50, visible: true, children: [
    { id: 'analytics.dashboard', label: 'Dashboard Executivo', icon: 'LayoutDashboard', path: '/analytics', order: 1, visible: true },
    { id: 'analytics.funnel', label: 'Funil de Conversão', icon: 'Funnel', path: '/analytics/funnel', order: 2, visible: true },
    { id: 'analytics.roi', label: 'ROI & Pipeline Value', icon: 'TrendingUp', path: '/analytics/roi', order: 3, visible: true },
  ]},
  
  // Settings
  { id: 'settings', label: 'Configurações', icon: 'Settings', order: 60, visible: true, children: [
    { id: 'settings.profile', label: 'Perfil & Site', icon: 'Briefcase', path: '/settings/profile', order: 1, visible: true },
    { id: 'settings.ai_keys', label: 'Chaves IA (Groq/Gemini)', icon: 'Key', path: '/settings/ai-keys', order: 2, visible: true },
    { id: 'settings.integrations', label: 'Integrações (CRM, n8n)', icon: 'Link2', path: '/settings/integrations', order: 3, visible: true },
    { id: 'settings.country', label: 'País & Moeda', icon: 'Globe', path: '/settings/country', order: 4, visible: true },
    { id: 'settings.team', label: 'Equipe & Acessos', icon: 'Users', path: '/settings/team', order: 5, visible: true },
    { id: 'settings.billing', label: 'Faturamento', icon: 'CreditCard', path: '/settings/billing', order: 6, visible: true },
  ]},
  
  // Admin
  { id: 'admin', label: 'Painel Admin', icon: 'Shield', order: 90, visible: true, children: [
    { id: 'admin.users', label: 'Usuários', icon: 'Users', path: '/admin/users', order: 1, visible: true },
    { id: 'admin.roles', label: 'Roles & Permissões', icon: 'Shield', path: '/admin/roles', order: 2, visible: true },
    { id: 'admin.permissions', label: 'Permissões de Menu', icon: 'Lock', path: '/admin/permissions', order: 3, visible: true, badge: 'Novo' },
    { id: 'admin.logs', label: 'Logs & Auditoria', icon: 'FileText', path: '/admin/logs', order: 4, visible: true },
    { id: 'admin.audit', label: 'Trilha de Auditoria', icon: 'ShieldAlert', path: '/admin/audit', order: 5, visible: true },
  ]},
];

export const DEFAULT_ROLES: RolePermission[] = [
  {
    roleId: 'super_admin',
    roleName: 'Super Admin',
    permissions: Object.fromEntries(
      DEFAULT_MENU_ITEMS.flatMap(item => {
        const entries: [MenuItemId, boolean][] = [[item.id, true]];
        if (item.children) {
          item.children.forEach(c => entries.push([c.id, true]));
        }
        return entries;
      })
    ) as Record<MenuItemId, boolean>,
  },
  {
    roleId: 'admin',
    roleName: 'Admin da Empresa',
    permissions: {
      dashboard: true,
      prospector: true,
      'prospector.search': true,
      'prospector.auto_discovery': true,
      'prospector.pipeline': true,
      'prospector.leads': true,
      'prospector.filters': true,
      'prospector.export': true,
      crm: true,
      'crm.criahub': true,
      'crm.webhooks': true,
      'crm.pipeline': true,
      'crm.contacts': true,
      copilot: true,
      'copilot.live': true,
      'copilot.history': true,
      outreach: true,
      'outreach.whatsapp': true,
      'outreach.email': true,
      'outreach.cadence': true,
      'outreach.objections': true,
      'outreach.deliverability': true,
      analytics: true,
      'analytics.dashboard': true,
      'analytics.funnel': true,
      'analytics.roi': true,
      settings: true,
      'settings.profile': true,
      'settings.ai_keys': true,
      'settings.integrations': true,
      'settings.country': true,
      'settings.team': true,
      'settings.billing': false,
      admin: true,
      'admin.users': true,
      'admin.roles': true,
      'admin.permissions': true,
      'admin.logs': true,
      'admin.audit': true,
    } as Record<MenuItemId, boolean>,
  },
  {
    roleId: 'manager',
    roleName: 'Gerente de Vendas',
    permissions: {
      dashboard: true,
      prospector: true,
      'prospector.search': true,
      'prospector.auto_discovery': true,
      'prospector.pipeline': true,
      'prospector.leads': true,
      'prospector.filters': true,
      'prospector.export': true,
      crm: true,
      'crm.criahub': true,
      'crm.webhooks': true,
      'crm.pipeline': true,
      'crm.contacts': true,
      copilot: true,
      'copilot.live': true,
      'copilot.history': true,
      outreach: true,
      'outreach.whatsapp': true,
      'outreach.email': true,
      'outreach.cadence': true,
      'outreach.objections': true,
      'outreach.deliverability': true,
      analytics: true,
      'analytics.dashboard': true,
      'analytics.funnel': true,
      'analytics.roi': true,
      settings: true,
      'settings.profile': true,
      'settings.ai_keys': false,
      'settings.integrations': false,
      'settings.country': true,
      'settings.team': false,
      'settings.billing': false,
      admin: false,
      'admin.users': false,
      'admin.roles': false,
      'admin.permissions': false,
      'admin.logs': false,
      'admin.audit': false,
    } as Record<MenuItemId, boolean>,
  },
  {
    roleId: 'sdr',
    roleName: 'SDR / Pré-Vendas',
    permissions: {
      dashboard: true,
      prospector: true,
      'prospector.search': true,
      'prospector.auto_discovery': true,
      'prospector.pipeline': true,
      'prospector.leads': true,
      'prospector.filters': false,
      'prospector.export': false,
      crm: true,
      'crm.criahub': true,
      'crm.webhooks': false,
      'crm.pipeline': true,
      'crm.contacts': true,
      copilot: true,
      'copilot.live': true,
      'copilot.history': false,
      outreach: true,
      'outreach.whatsapp': true,
      'outreach.email': true,
      'outreach.cadence': true,
      'outreach.objections': true,
      'outreach.deliverability': false,
      analytics: true,
      'analytics.dashboard': true,
      'analytics.funnel': true,
      'analytics.roi': false,
      settings: true,
      'settings.profile': true,
      'settings.ai_keys': false,
      'settings.integrations': false,
      'settings.country': true,
      'settings.team': false,
      'settings.billing': false,
      admin: false,
      'admin.users': false,
      'admin.roles': false,
      'admin.permissions': false,
      'admin.logs': false,
      'admin.audit': false,
    } as Record<MenuItemId, boolean>,
  },
  {
    roleId: 'viewer',
    roleName: 'Visualizador (Somente Leitura)',
    permissions: {
      dashboard: true,
      prospector: true,
      'prospector.search': true,
      'prospector.auto_discovery': true,
      'prospector.pipeline': true,
      'prospector.leads': true,
      'prospector.filters': false,
      'prospector.export': false,
      crm: true,
      'crm.criahub': false,
      'crm.webhooks': false,
      'crm.pipeline': true,
      'crm.contacts': true,
      copilot: false,
      'copilot.live': false,
      'copilot.history': false,
      outreach: true,
      'outreach.whatsapp': false,
      'outreach.email': false,
      'outreach.cadence': false,
      'outreach.objections': false,
      'outreach.deliverability': false,
      analytics: true,
      'analytics.dashboard': true,
      'analytics.funnel': false,
      'analytics.roi': false,
      settings: true,
      'settings.profile': true,
      'settings.ai_keys': false,
      'settings.integrations': false,
      'settings.country': false,
      'settings.team': false,
      'settings.billing': false,
      admin: false,
      'admin.users': false,
      'admin.roles': false,
      'admin.permissions': false,
      'admin.logs': false,
      'admin.audit': false,
    } as Record<MenuItemId, boolean>,
  },
];

export const DEFAULT_ADMIN_CONFIG: AdminMenuConfig = {
  version: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
  menuItems: DEFAULT_MENU_ITEMS,
  roles: DEFAULT_ROLES,
  defaultRoleId: 'sdr',
};
