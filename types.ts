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

export interface DecisionMakerCandidate {
  id: string;
  name: string;
  role: string;
  roleCategory?: 'DONO_CEO_SOCIO' | 'GERENTE_DIRETOR' | 'HEAD_COMERCIAL' | 'OUTROS';
  matchConfidence: number; // 0 a 100% (ex: 96%)
  isRecommended: boolean;
  evidenceTags: string[]; // ex: ["Sócio / QSA RFB", "Diretor Clínico", "Localidade Alinhada", "Tomador de Decisão"]
  rationale: string; // ex: "Sócio Administrador registrado na base fiscal e Diretor Clínico com autoridade máxima sobre contratações."
  linkedinUrl?: string;
  directSearchUrl?: string;
  directEmail?: string;
  directPhone?: string;
  sourceType: 'qsa_fiscal' | 'linkedin_osint' | 'website_team' | 'apollo' | 'ai_inference';
}

export interface ExecutiveSolutionOffer {
  solutionName: string;
  category: string;
  coreBenefit: string;
  implementationDetail: string;
  estimatedRoi: string;
  suggestedPitchLine: string;
}

export interface ExecutiveSummaryReport {
  companyOverview: string;
  digitalMaturityGrade: 'A' | 'B' | 'C' | 'D';
  identifiedCoreProblem: string;
  topDecisionMaker: DecisionMakerCandidate;
  candidatesList: DecisionMakerCandidate[];
  tailoredOffers: ExecutiveSolutionOffer[];
  readyProposalPitch: string;
  costSavingNote: string; // Ex: "Enriquecido 100% via Fontes Gratuitas (Economia de tokens/créditos)"
}

export interface DecisionMaker {
  name: string;
  role: string;
  roleCategory?: 'DONO_CEO_SOCIO' | 'GERENTE_DIRETOR' | 'HEAD_COMERCIAL' | 'OUTROS';
  matchConfidence?: number; // 0-100% de probabilidade de ser o decisor real
  matchEvidence?: string[]; // Tags de evidência (ex: ["Confirmado via QSA", "Diretor Clínico"])
  matchRationale?: string; // Explicação da IA para a escolha
  candidates?: DecisionMakerCandidate[]; // Lista de candidatos identificados para conferência rápida
  linkedin?: string;
  linkedinDirectSearch?: string; // Link direto para busca nativa do LinkedIn
  linkedinCompanyUrl?: string; // Link para busca da Company Page
  directEmail?: string;
  directPhone?: string;
  googleDorkUrl?: string; // Link direto para Google Dork do decisor e sócios
  indeedJobsUrl?: string; // Link para vagas da empresa no Indeed
  sourcePlatform?: 'linkedin' | 'google' | 'indeed' | 'apollo' | 'multi' | string;
  emailPattern?: string; // Ex: {primeiro}.{ultimo}@{dominio}
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
    portugalLocalTrust?: ObjectionCrusherItem; // 6. "Vocês operam cá em Portugal? Onde estão sediados?"
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

export interface SupervisorAudit {
  verified: boolean;
  reliabilityScore: number; // 0-100% (Veracidade & Credibilidade dos dados reais)
  verificationNotes: string; // Parecer do Supervisor IA sobre a empresa
  dataQualityRating: 'ALTA_CONFIABILIDADE' | 'MEDIA_CONFIABILIDADE' | 'ATENCAO_DADOS_LIMITADOS';
  recommendedStrategy: string; // Recomendação tática do Supervisor para fechamento
  auditedAt: string;
}

export interface CustomPromptsConfig {
  enrichmentSystemPrompt: string;
  supervisorSystemPrompt: string;
  copywriterPrompt: string;
  icpClassificationPrompt?: string;
}

export type BusinessTypeCategory = 
  | 'Fabricante/Indústria'
  | 'Distribuidor'
  | 'Revendedor/Lojista'
  | 'Prestador de Serviço';

export type CommercialDecision = 'LIGAR AGORA' | 'AGUARDAR' | 'DESCARTAR';

export type SdrRoiVerdict = 
  | 'CALL_MEETING'     // "LIGAR AGORA (SDR): Agendar Demonstração / Reunião"
  | 'WHATSAPP_FIRST'   // "MANDAR WHATSAPP: Abordagem Direta 1-Click"
  | 'EMAIL_ONLY'       // "MANDAR APENAS E-MAIL: Nutrição Fria (Não queimar tempo de ligação)"
  | 'DISQUALIFIED';    // "NÃO PERDER TEMPO: Descartar Lead"

/**
 * Falha detectada no meio digital da empresa lead e o serviço correspondente
 * que a empresa ofertante pode vender para solucionar o problema.
 */
export interface DigitalFlawOpportunity {
  id: string;
  category: 'website' | 'atendimento_whatsapp' | 'dados_crm' | 'midia_seo' | 'conversao_vendas';
  categoryLabel: string;
  flawTitle: string;
  flawSeverity: 'CRITICA' | 'ALTA' | 'MEDIA';
  flawEvidence: string; // Evidência real (ex: "PageSpeed Mobile: 34", "Chatbot ausente", "Sem Pixel")
  offeredService: string; // Serviço da empresa ofertante que resolve esta falha
  serviceImpact: string; // O benefício tangível para a empresa lead cliente
  recommendedPitchSnippet: string; // Gancho consultivo que o SDR/E-mail pode usar
}

export interface OfferingServiceSynergy {
  offeringCompanyName: string; // Nome da empresa que está buscando o lead / ofertando os serviços
  offeringServicesSummary: string; // Resumo dos serviços da empresa ofertante (Desenvolvimento, Consultoria, Automação IA)
  servicesMatched: string[]; // Serviços específicos que servem para este lead (ex: "Desenvolvimento Web 3.0", "Consultoria de Processos", "Agente IA WhatsApp")
  leadPurchasePower: 'ALTO_PODEROSO' | 'MEDIO' | 'BAIXO_MICRO' | 'SEM_BUDGET'; // Poder de compra estimado do lead para contratar desenvolvimento/consultoria
  leadNeedMatchExplanation: string; // Explicação de por que os serviços da empresa ofertante servem (ou não servem) para o lead
  targetDealSize: string; // Ticket esperado do projeto (ex: "R$ 15.000 a R$ 35.000" ou "€5.000 a €15.000")
  sdrCostJustified: boolean; // Se a matemática fecha para pagar o custo alto de um SDR tentar agendar a call com o time de desenvolvimento/consultoria
  whySdrJustifiedOrNot: string; // Justificativa financeira detalhada para a decisão do SDR
  // Novos campos estruturados orientados a falhas digitais e segurança de canais:
  detectedDigitalFlaws?: DigitalFlawOpportunity[]; // Todos os meios de serviços falhos e o que podemos ofertar
export interface RetainerMonthlyPlan {
  planName: string; // Nome do plano de mensalidade (ex: "Retainer Mensal: Otimização Contínua & Agente IA")
  monthlyFee: string; // Valor da mensalidade recorrente (ex: "R$ 2.400 / mês" ou "€750 / mês")
  annualValue: string; // Valor anualizado (ex: "R$ 28.800 / ano")
  includedDeliverables: string[]; // Itens inclusos na mensalidade recorrente
  closingPitchForRetainer: string; // Argumento de valor para vender a mensalidade em vez de apenas projeto único
}

export interface WorthContactingImprovementItem {
  flawTitle: string;
  flawEvidence: string;
  monthlyImprovement: string;
  monthlyServiceName: string;
  expectedBusinessImpact: string;
}

export interface WorthContactingAnalysis {
  isWorthContacting: boolean;
  verdictLabel: 'VALE MUITO A PENA' | 'VALE A PENA COM CAUTELA' | 'NÃO VALE A PENA';
  badgeTone: 'emerald' | 'teal' | 'amber' | 'rose';
  score: number; // 0-100 (Índice de Viabilidade Comercial)
  headline: string; // Resumo cirúrgico sem inventar dados
  positiveSignals: string[]; // Sinais positivos verificados
  riskFactors: string[]; // Riscos evitados ou pontos de atenção
  detailedReasoning: string; // Justificativa completa com base em dados reais
  recommendedAction: string; // Próximo passo do SDR
  whatWeCanImprove: WorthContactingImprovementItem[]; // O que podemos melhorar todo mês
  monthlyRetainerOffer: RetainerMonthlyPlan; // Proposta de mensalidade estruturada
  dailyQuotaCandidate: boolean; // Se se qualifica para a meta dos 5+ leads do dia para ligar
}

export interface OfferingServiceSynergy {
  offeringCompanyName: string; // Nome da empresa que está buscando o lead / ofertando os serviços
  offeringServicesSummary: string; // Resumo dos serviços da empresa ofertante (Desenvolvimento, Consultoria, Automação IA)
  servicesMatched: string[]; // Serviços específicos que servem para este lead (ex: "Desenvolvimento Web 3.0", "Consultoria de Processos", "Agente IA WhatsApp")
  leadPurchasePower: 'ALTO_PODEROSO' | 'MEDIO' | 'BAIXO_MICRO' | 'SEM_BUDGET'; // Poder de compra estimado do lead para contratar desenvolvimento/consultoria
  leadNeedMatchExplanation: string; // Explicação de por que os serviços da empresa ofertante servem (ou não servem) para o lead
  targetDealSize: string; // Ticket esperado do projeto (ex: "R$ 15.000 a R$ 35.000" ou "€5.000 a €15.000")
  sdrCostJustified: boolean; // Se a matemática fecha para pagar o custo alto de um SDR tentar agendar a call com o time de desenvolvimento/consultoria
  whySdrJustifiedOrNot: string; // Justificativa financeira detalhada para a decisão do SDR
  // Novos campos estruturados orientados a falhas digitais e segurança de canais:
  detectedDigitalFlaws?: DigitalFlawOpportunity[]; // Todos os meios de serviços falhos e o que podemos ofertar
  recurringRetainerOffer?: RetainerMonthlyPlan;
  contactFormatEvaluation?: {
    format: 'call' | 'whatsapp' | 'email' | 'none';
    temperature: 'QUENTE_SDR' | 'MEDIO_WHATSAPP' | 'FRIO_EMAIL' | 'INVIAVEL';
    temperatureLabel: string; // "🔥 Quente (Ligar com SDR)", "💬 Médio (WhatsApp com Cuidado Anti-Spam)", "📩 Frio (E-mail Seguro contra Banimento)"
    channelJustification: string;
    antiSpamWarning?: string; // Alerta específico sobre risco de denúncia no WhatsApp para não clientes
  };
}

export interface LeadRoiRecommendation {
  verdict: SdrRoiVerdict;
  verdictBadge: string; // Ex: "LIGAR AGORA (SDR)", "MANDAR WHATSAPP", "APENAS E-MAIL", "NÃO PERDER TEMPO"
  verdictTone: 'emerald' | 'teal' | 'amber' | 'rose' | 'slate';
  investmentWorth: 'ALTO_VALOR_INVESTIR' | 'CONTATO_RAPIDO_WHATSAPP' | 'NUTRICAO_PASSIVA_EMAIL' | 'SEM_RETORNO_DESCARTAR';
  investmentWorthLabel: string; // Ex: "🔥 Vale a pena investir tempo do SDR", "⚡ Vale contato ágil via WhatsApp", "📩 Vale apenas disparo de E-mail", "⛔ Não vale a pena perder tempo"
  recommendedChannel: 'call' | 'whatsapp' | 'email' | 'none';
  recommendedChannelLabel: string; // "Ligação do SDR para Agendar Reunião", "WhatsApp 1-Click Direto", "E-mail Frio (Cold Mail AIDA)", "Nenhum (Descarte)"
  expectedGoal: string; // Ex: "Agendar Reunião de Demonstração (15 min)", "Iniciar conversa e qualificar dor", "Nutrir passivamente sem esforço manual"
  confidenceScore: number; // 0 a 100%
  primaryReason: string; // 1-2 frases explicando exatamente o porquê com base nos dados reais coletados
  dailyQuotaCandidate?: boolean; // Se faz parte da meta diária de prospecção (Top leads para ligar hoje)
  worthContacting?: WorthContactingAnalysis; // Análise definitiva: Saber realmente se vale a pena tentar contato
  dataSignals: {
    hasDirectDecisor: boolean;
    decisorNameAndRole?: string;
    hasValidPhone: boolean;
    phoneType: 'direct_mobile' | 'landline_reception' | 'none';
    hasWebsite: boolean;
    websiteStatus: 'active' | 'slow_or_flawed' | 'offline_or_none';
    hasIdentifiedFlawOrPain: boolean;
    keyPainSummary: string;
    hasActiveSocials: boolean;
    hasCtaLeak: boolean;
  };
  sdrActionTip: string; // Dica prática direta para o operador
  offeringSynergy?: OfferingServiceSynergy; // Análise de sinergia entre o que a empresa ofertante vende e o que o lead precisa/pode pagar
}

export interface IcpCriterionScore {
  criterion: string;
  criterionKey: 'manufacturer' | 'size' | 'segment' | 'website' | 'socials' | 'pain' | 'contact' | 'location';
  maxScore: number;
  score: number;
  justification: string;
  evidence: string;
}

export interface IcpObjectionPair {
  objection: string; // Ex: "Já temos agendamento via recepção"
  howToOvercome: string; // Ex: "Perfeito, a maioria dos nossos clientes também tinha..."
}

export interface SdrTrainingGuide {
  openingHook: string; // Gancho Principal (Abertura)
  verdictWhyCall: string; // Parecer Final (Por que ligar)
  suggestedNextStep: string; // Próximo Passo Sugerido
  pitchTopics?: string[]; // 3 Tópicos Principais do Pitch
  objections?: IcpObjectionPair[]; // 2 Objeções Prováveis & Como Contornar
}

export interface SeniorIcpQualification {
  companyName: string;
  businessType: BusinessTypeCategory;
  finalScore: number; // 0 a 100
  commercialDecision: CommercialDecision;
  isPenalizedBySafetyRule: boolean;
  penalizationReason?: string;
  criteria: IcpCriterionScore[];
  analystVerdict: string;
  sdrTrainingGuide?: SdrTrainingGuide;
  rawMarkdownReport: string;
  evaluatedAt: string;
}

export interface SocialPost {
  date: string; // Ex: "Há 3 dias (23/08/2026)"
  format: 'Reels / Vídeo' | 'Carrossel Educativo' | 'Post Estático' | 'Story / Destaque' | 'Artigo / Imagem';
  captionSnippet: string; // Resumo do conteúdo publicado
  engagement: string; // Ex: "Baixo (4 curtidas, 0 comentários) - Sem CTA de conversão"
  likesCount?: number;
  commentsCount?: number;
  hasCtaToWhatsApp: boolean;
  link?: string;
}

export interface SocialPresenceAudit {
  platform: 'Instagram' | 'Facebook' | 'LinkedIn' | 'TikTok' | 'YouTube' | 'Twitter/X';
  handle?: string;
  url: string;
  exists: boolean;
  activityStatus: 'ATIVA' | 'MODERADA' | 'INATIVA' | 'NAO_ENCONTRADA';
  activityLabel: string; // Ex: "Ativa (3-5 posts/semana)" ou "Inativa (+4 meses sem postar)"
  lastPostDate?: string; // Ex: "23 de Agosto de 2026"
  estimatedFollowers?: string; // Ex: "1.8k seguidores"
  postingCadenceRating: 'Alta Frequência' | 'Moderada' | 'Esporádica / Abandonada' | 'Sem Presença';
  last3Posts?: SocialPost[];
  identifiedOpportunity: string; // Oportunidade comercial de melhoria
}

export interface GooglePageSpeedMetrics {
  mobileScore: number; // 0 a 100 (ex: 42)
  desktopScore: number; // 0 a 100 (ex: 78)
  performanceRating: 'RAPIDO' | 'MEDIO' | 'LENTO';
  lcp: string; // Largest Contentful Paint (ex: "4.8s - Lento")
  fcp: string; // First Contentful Paint (ex: "2.4s")
  cls: string; // Cumulative Layout Shift (ex: "0.15")
  fidOrInp: string; // Interaction to Next Paint / FID (ex: "240ms")
  officialPageSpeedUrl: string; // https://pagespeed.web.dev/analysis?url=...
  speedFlaws: string[]; // Lista de falhas técnicas (imagens pesadas, render-blocking scripts, etc.)
  mobileUsability: 'RESPONSIVO_OTIMIZADO' | 'ELEMENTOS_MUITO_PROXIMOS' | 'NAO_RESPONSIVO';
}

export interface ChatbotAudit {
  hasChatbot: boolean;
  botType: 'CHATBOT_IA' | 'WIDGET_ESTATICO_WHATSAPP' | 'FORMULARIO_PADRAO' | 'SEM_ATENDIMENTO_ONLINE';
  botLabel: string; // Ex: "Sem Chatbot IA (Apenas Link WhatsApp Estático)"
  hasIntelligentTriage247: boolean;
  estimatedLeadResponseTime: string; // Ex: "> 45 minutos (Perda de leads fora de horário comercial)"
  triageGaps: string[]; // Gaps no atendimento (ex: sem qualificação automática, sem resposta 24/7)
  conversionLeakRisk: 'ALTO_RISCO' | 'MEDIO_RISCO' | 'BAIXO_RISCO';
}

export interface CriaHubActionableImprovement {
  id: string;
  serviceCategory: 'WEBSITE_SPEED' | 'CHATBOT_AI' | 'SOCIAL_MEDIA' | 'PAID_TRAFFIC_PIXEL' | 'CRM_CADENCE';
  serviceCategoryLabel: string; // Ex: "Website & Google PageSpeed", "Chatbot IA & Triagem 24/7"
  title: string; // Ex: "Otimização & Reconstrução de Landing Page Ultrarrápida"
  currentProblemFound: string; // Ex: "Site mobile pontua 42 no PageSpeed e demora 4.8s para abrir, perdendo até 50% do tráfego."
  proposedSolution: string; // Ex: "Desenvolver Landing Page otimizada com PageSpeed 95+, CDN global e carregamento instantâneo."
  expectedBusinessImpact: string; // Ex: "+40% a +70% de conversão de visitantes em agendamentos reais."
  estimatedRoiMultiplier: string; // Ex: "4x a 6x ROI em 60 dias"
  pitchTalkingPoint: string; // Argumento de venda direto e empático para o SDR/closer
}

export interface FullDigital360Audit {
  website: {
    hasWebsite: boolean;
    url: string;
    domain: string;
    ssl: boolean;
    mobileResponsive: boolean;
    cmsOrTech: string[];
    isLive: boolean;
  };
  pageSpeed: GooglePageSpeedMetrics;
  chatbot: ChatbotAudit;
  socialsAudit: {
    hasAnySocial: boolean;
    overallActivityStatus: 'ATIVA' | 'MODERADA' | 'INATIVA' | 'SEM_REDES';
    summary: string;
    channels: SocialPresenceAudit[];
    primaryChannelName: string;
    primaryChannelPosts: SocialPost[];
  };
  actionableImprovements: CriaHubActionableImprovement[];
  commercialPitchSummary: string; // Pitch pronto e empático para o SDR/closer
  auditedAt: string;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  tiktok?: string;
  twitter?: string;
  youtube?: string;
  whatsappDirect?: string;
  sourceUrl?: string;
  foundCount?: number;
}

export interface ScrapedPhoto {
  url: string;
  thumbnail?: string;
  caption?: string;
  isHighRes?: boolean;
}

export interface FiscalPartner {
  name: string;
  role: string;
  entryDate?: string;
  ageRange?: string;
  legalRepresentative?: boolean;
}

export interface FiscalRegistryData {
  country: 'BR' | 'PT' | 'ES' | 'US' | 'OTHER' | string;
  taxIdLabel: string; // "CNPJ" para Brasil, "NIF / NIPC" para Portugal, "CIF / NIF" para Espanha
  taxId: string; // ex: "34.567.890/0001-23" ou "509123456" ou "B-87654321"
  legalName: string; // Razão Social Oficial / Denominação Social
  tradeName?: string; // Nome Fantasia
  status: 'ATIVA' | 'INAPTA' | 'SUSPENSA' | 'BAIXADA' | 'REGULAR' | 'ENCERRADA';
  statusDescription?: string;
  openedDate?: string; // Data de Abertura / Constituição
  yearsInBusiness?: number; // Anos de Mercado
  shareCapital?: string; // Capital Social (ex: "R$ 250.000,00" ou "€ 50.000,00")
  activityCode?: string; // CNAE Principal ou CAE
  activityDescription?: string;
  secondaryActivities?: string[];
  partners?: FiscalPartner[]; // Quadro de Sócios e Administradores (QSA)
  fiscalAddress?: string; // Endereço Fiscal Oficial
  publicConsultationUrls: {
    casaDosDadosUrl?: string;
    receitaFederalUrl?: string;
    redesimUrl?: string;
    nifPtUrl?: string;
    raciusUrl?: string;
    einformaUrl?: string;
    bormeUrl?: string;
    informaEsUrl?: string;
    googleDorkFiscalUrl?: string;
  };
  enrichedAt?: string;
}

export interface MatchingDiagnostics {
  matchedBy: 'domain' | 'phone' | 'fuzzy_name_city' | 'tax_id' | 'direct_maps_apollo';
  similarityScore: number; // 0-100%
  mapsDataIntegrated: boolean;
  apolloDataIntegrated: boolean;
  fiscalDataIntegrated: boolean;
  socialEnriched: boolean;
  matchDetails: {
    domainMatched: boolean;
    phoneNormalizedMatched: boolean;
    fuzzyNameRatio: number;
    cityExactMatch: boolean;
  };
}

export interface WebsiteAuditResult {
  url: string;
  isAuthentic: boolean;
  liveStatus: 'ONLINE_VERIFIED' | 'ONLINE_SLOW' | 'SUSPICIOUS' | 'NO_WEBSITE' | 'UNREACHABLE';
  domainName: string;
  reliabilityScore: number;
  sslActive: boolean;
  mobileResponsive: boolean;
  detectedTech: string[];
  pixelStatus: 'INSTALLED_ACTIVE' | 'NOT_DETECTED' | 'WITHOUT_CAPI';
  whatsappWidgetPresent: boolean;
  conversionFlaws: string[];
  salesIceBreaker: string;
  aiDiagnosticSummary: string;
  auditedAt: string;
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

  // Web Scraping & Social Discovery Enriquecido:
  socials?: SocialLinks;
  photos?: ScrapedPhoto[];

  // Fiscal & Corporate Registry (CNPJ, NIF, CIF, QSA Sócios):
  fiscalRegistry?: FiscalRegistryData;

  // Matching Engine (Maps + Apollo Cross-reference):
  matchingDiagnostics?: MatchingDiagnostics;
  
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

  // Supervisor IA (Auditoria de Veracidade e Qualidade):
  supervisorAudit?: SupervisorAudit;

  // Matriz Sênior de Classificação e Qualificação ICP (0 a 100 pts):
  seniorIcpQualification?: SeniorIcpQualification;

  // Análise de Investimento de Tempo / ROI SDR & Canal de Ataque:
  roiRecommendation?: LeadRoiRecommendation;

  // Auditoria de Website & Veracidade com IA:
  websiteAudit?: WebsiteAuditResult;

  // Auditoria Digital 360° Completa (PageSpeed, Chatbot, Redes Sociais, Últimos 3 Posts & Melhorias):
  digital360Audit?: FullDigital360Audit;

  // Deliverability & Anti-Ban Guardian:
  guardian?: DeliverabilityGuardian;

  // Resumo Executivo & Match de Soluções Personalizadas (Nicho / CriaHub):
  executiveSummary?: ExecutiveSummaryReport;

  // Elite Sales Objection Crusher (Cold Call & Live Pitch Copilot):
  objectionCrusher?: ObjectionCrusherMatrix;

  // Omnichannel Cadence Master (21-day Outbound Follow-up Engine):
  cadence?: CadenceMaster;

  status: 'new' | 'contacted' | 'qualified' | 'ignored';
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY' | 'UNKNOWN';
  lastContactedAt?: string;
  notes?: string;

  // Fast-Dialer & Outreach 1-Click Status:
  whatsAppStatus?: 'not_sent' | 'sent' | 'followup_pending';
  whatsAppSentAt?: string;
  callOutcome?: 'MEETING_BOOKED' | 'IN_FOLLOWUP' | 'NO_INTEREST';
  callOutcomeAt?: string;
  contactOutcome?: string;
  contactOutcomeLabel?: string;
  contactNotes?: string;
  source?: 'ai' | 'synthetic' | 'apollo';
  originApi?: 'apollo' | 'rapidapi_google_maps' | 'google_search' | 'synthetic' | string;
  originApiLabel?: string;

  // 🎯 Planejamento de Prospecção Diária (Meta de 5 Leads/Dia):
  cadenceDay?: number; // 1, 2, 3... (Dia do cronograma)
  cadenceDayLabel?: string; // Ex: "Dia 1 (Meta de Hoje)", "Dia 2 (Amanhã)"
  cadenceTargetDate?: string; // Ex: "Hoje (20/09)", "D+1 (21/09)"

  // ⚠️ Histórico e Alerta Anti-Queimação (Evita ligar novamente por engano):
  alreadyContactedWarning?: {
    isContacted: boolean;
    contactedAt?: string;
    formattedDate?: string;
    outcome?: string;
    outcomeLabel?: string;
    notes?: string;
    operatorName?: string;
  };

  // Lote / Sessão de Pesquisa:
  batchId?: string;
  batchName?: string;
  capturedAt?: string;

  // OmniAssertive & Real Estate / B2B Audit Extensions:
  isRealEstate?: boolean;
  estimatedRevenue?: string;
  priceDropValue?: string;
  daysOnMarket?: number;
  isTripleAudited?: boolean;
  auditConfidenceScore?: number;
  callAngleSuggestion?: string;
  auditDetails?: {
    status: string;
    score: number;
    verdicts: {
      agent1_redirect_http: string;
      agent2_data_matching: string;
      agent3_ghost_hunter_osint: string;
    };
    auditedAt: string;
  };

  // Real-time AI Niche-Specific SDR Outreach Engine:
  realtimeSdrOutreach?: RealtimeSdrOutreach;

  // Módulo de Prospecção, Scraping e Simulação de Diálogos PT-PT (4 Blocos):
  ptPtDialogueSimulation?: PtPtSdrDialogueSimulation;
}

export type SdrOutreachTone = 'executivo_ceo' | 'gatilho_gap' | 'estudo_caso' | 'quebra_padrao';

export interface PtPtSdrDialogueSimulation {
  // Bloco 1: Ficha de Diagnóstico Rápido (Dados do Scraping)
  quickDiagnostic: {
    companyAndLocation: string; // Empresa & Concelho/Distrito
    strengths: string[]; // 1 a 2 elogios reais sobre a marca/site
    mainBottleneck: string; // Gargalo Principal (A Falha: tracking, UX telemóvel, WhatsApp, etc.)
    idealCriahubOffer: string; // Oferta CriaHub Ideal: Pacote de €599+, E-commerce, Tráfego Pago ou Diagnóstico Grátis
    opportunityVerdict?: 'Lead Quente' | 'Lead Morno' | 'Lead Frio';
  };
  // Bloco 2: Simulação da Troca de Conversa (WhatsApp / LinkedIn)
  dialogueSimulation: {
    sdrMessage1: string; // Abordagem inicial com âncora de proximidade local, elogio sincero e falha técnica
    prospectResponse1: string; // Objeção típica (Já temos agência / Sem tempo / De onde contactam / Envie por e-mail)
    sdrMessage2: string; // Contorno com autoridade técnica + caso análogo de nicho em Portugal + Diagnóstico Grátis
    prospectResponse2: string; // Demonstração de abertura / curiosidade técnica ("Como funciona?" / "Quanto custa?")
    sdrMessage3Close: string; // Fechamento/CTA direto para landing page (https://www.criahub.global/pt/plano-digital-gratis/ ou /store/pacotes/) ou call de 10 min
  };
  // Bloco 3: Simulação de Script de Chamada Telefónica (Cold Call de 1 Minuto)
  coldCall1Min: {
    opening: string; // Foco no decisor em PT-PT
    hook: string; // Pergunta sobre o gargalo identificado no site
    quickPitch: string; // Apresentação dos pacotes da CriaHub com foco em ROI (€599+)
    close: string; // Pedido de agendamento de 10 minutos
  };
  // Bloco 4: Palavras-Chave de Sinergia (Google Ads)
  googleAdsKeywords: string[]; // 3 termos de pesquisa exata no Google Ads em Portugal
  googleAdsAdSuggestion?: {
    headline: string;
    description: string;
  };
  // Metadados de Sucesso do Nicho em Portugal:
  caseStudyAnalog?: {
    title: string;
    beforeAfter: string;
    result: string;
  };
  landingPageLinks?: {
    freePlanUrl: string;
    packagesUrl: string;
  };
  generatedAt: string;
  engineUsed?: string;
}

export interface RealtimeSdrOutreach {
  tone: SdrOutreachTone;
  toneLabel: string;
  nicheDetected: string;
  callAnchor20s: string; // Pitch verbal de abertura da ligação (15 a 20s) com gancho local em Portugal
  whatsappIcebreaker: string; // Mensagem 1 de WhatsApp anti-clichê em PT-PT rigoroso
  whatsappFollowup24h: string; // Mensagem 2 de follow-up pós-24h
  coldCallTeleprompter: string; // Roteiro completo de cold call para teleprompter
  objectionKiller: string; // Resposta cirúrgica à principal objeção do nicho
  nichePainDiagnosis: string; // Diagnóstico do gargalo invisível do nicho
  generatedAt: string;
  aiEngineUsed: string; // 'Groq Cloud' | 'Google Gemini' | 'Motor de Nicho Cirúrgico'
  // Pilares Portugal B2B & Abrasileiramento Reverso:
  portugalLocalHook?: string; // Gancho de proximidade local (baseado em Portugal há 3 anos no fuso de Lisboa)
  antiBiasRebuttal?: string; // Resposta segura para quebrar desconfiança de falsas agências / operação de fora
  ptPtVerified?: boolean; // Conformidade estrita PT-PT (equipa, telemóvel, sítio web, loja online, portes, €)
  // Simulação de Diálogo Completo Integrada:
  ptPtDialogueSimulation?: PtPtSdrDialogueSimulation;
}

export interface SearchBatch {
  id: string;
  name: string;
  timestamp: string; // ISO date string
  formattedDate: string; // Ex: '17/08/2026 14:30'
  keyword: string; // Palavra-chave buscada ou Auto-Discovery
  niche: string; // Nicho correspondente
  city: string; // Cidade pesquisada
  district?: string; // Distrito / Estado
  country: string; // Código do país (ex: PT, BR)
  countryName: string; // Nome do país (ex: Portugal, Brasil)
  leadCount: number;
  scoreACount: number;
  scoreBCount: number;
  leads: Lead[];
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

export interface RapidApiKeyStatus {
  index: number;
  keyPreview: string;
  status: 'VALID' | 'ERROR' | 'UNTESTED';
  lastUsed?: string;
  errorMessage?: string;
  latencyMs?: number;
}

export interface AiEngineConfig {
  activeProvider: 'auto' | 'gemini' | 'groq' | 'free_autonomous';
  groqKeys: [string, string, string]; // Pool de até 3 API keys do Groq (100% Gratuito)
  groqModel: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' | 'groq/compound' | 'groq/compound-mini' | 'deepseek-r1-distill-llama-70b' | 'llama3-70b-8192' | 'llama3-8b-8192' | 'gemma2-9b-it' | 'qwen-2.5-32b' | string;
  temperature: number;
  autoFallbackToGemini: boolean;
  autoRotateOnRateLimit: boolean;
  activeKeyIndex: number;
  keyStatuses: GroqKeyStatus[];
  
  // RapidAPI Multi-Key Pool & Rotation (para raspagem real de Google Maps/LetScrape)
  rapidApiKeys: [string, string, string];
  rapidApiRotationMode: 'sequential' | 'random';
  activeRapidApiKeyIndex: number;
  rapidApiKeyStatuses: RapidApiKeyStatus[];

  // Supervisor IA (Validação, Veracidade e Garantia de Qualidade Anti-Alucinação)
  supervisorAiEnabled: boolean;
  supervisorModel?: string; // ex: llama-3.3-70b-versatile ou gemini-3.6-flash

  // Custom Prompts
  customPrompts?: CustomPromptsConfig;

  // Disparo de Email e Mensageria
  resendApiKey?: string;
  senderEmail?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  zapiToken?: string;
  criahubWebhookUrl?: string;
  apolloApiKey?: string; // Chave de API Apollo.io para enriquecimento e busca de decisores B2B

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
  originApi: 'all' | 'apollo' | 'rapidapi_google_maps' | 'synthetic';
  roleCategory?: 'all' | 'owners' | 'managers' | 'commercial';
  roiVerdict?: 'all' | 'CALL_MEETING' | 'WHATSAPP_FIRST' | 'EMAIL_ONLY' | 'DISQUALIFIED';
  searchQuery?: string;
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
  apolloCount: number;
  googleMapsCount: number;
  syntheticCount: number;
  estimatedPipelineValue: string;
}
