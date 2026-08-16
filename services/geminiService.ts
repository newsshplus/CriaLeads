import { Lead, BusinessProfile, IcpTier, ScrapingEngineStatus } from "../types";
import { buildDeliverabilityGuardian, buildEvolutionAndResendPayloads } from "./deliverabilityService";
import { buildObjectionCrusherMatrix } from "./objectionCrusherService";
import { buildCadenceMaster } from "./cadenceService";
import { generateAutonomousFallbackLeads } from "./syntheticProspector";
import { executeAiCompletion, scanWebsiteAndExtractProfile } from "./aiProviderService";
import { getCurrencyConfig } from "./countryService";
import { RealBusiness, prioritizeRealBusinesses, searchRealBusinesses } from "./letscrapeService";

const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// Converte o placeholder de veracidade "NÃO VERIFICADO" em campo vazio, evitando contatos falsos
const cleanField = (value: any): string => {
  if (typeof value !== 'string') return value || '';
  const trimmed = value.trim();
  if (/n[ãa]o verificad[oa]/i.test(trimmed)) return '';
  return trimmed;
};

/**
 * 1. MÓDULO DE DEEP MATCHING DO MEU NEGÓCIO & REVERSE ICP EXTRACTOR
 * Analisa o site e os serviços fornecidos, extrai UVP, Dores, Objeções e recomenda 5 Nichos de Alto Ticket
 */
export async function analyzeBusinessProfile(profile: Partial<BusinessProfile>, signal?: AbortSignal): Promise<BusinessProfile> {
  const url = profile.websiteUrl || "https://meusite.com.br";
  return await scanWebsiteAndExtractProfile(url, profile, signal);
}

/**
 * Deriva termos de busca reais a partir do keyword ou dos nichos de alto ticket recomendados.
 * (Buscar "auto" na LetScrape não funciona — precisamos de termos concretos como "clínica estética".)
 */
function deriveRealSearchTerms(keyword: string, businessProfile: BusinessProfile): string[] {
  const k = (keyword || '').trim().toLowerCase();
  const isAuto = !k || k === 'auto' || k === 'alto ticket' || k === 'todos' || k === 'multi-nicho' || k === 'geral';

  if (!isAuto) {
    return [keyword.trim()];
  }

  const niches = businessProfile.recommendedHighTicketNiches || [];
  const terms = niches.map(n => {
    const name = (n.niche || n.category || '').toLowerCase();
    if (/(clínic|clinica|saude|saúde|estetic|estética|odonto|medic|hospital)/.test(name)) return "clínica estética";
    if (/(advocac|advogad|juridic|direito|tributar)/.test(name)) return "escritório de advocacia";
    if (/(imobiliar|incorporadora|loteadora|imóve|imove)/.test(name)) return "imobiliária de alto padrão";
    if (/(industri|metalurg|distribuidor|fabrica|fábrica|logistic)/.test(name)) return "indústria";
    if (/(consultor|bpo|gestao|gestão|auditori|advisory|financ)/.test(name)) return "consultoria empresarial";
    return name.split('&')[0].trim().split(/\s+/).slice(0, 3).join(' ');
  });

  const unique = [...new Set(terms.filter(Boolean))];
  return unique.length > 0 ? unique.slice(0, 4) : ["empresas B2B de alto ticket"];
}

/**
 * Constroi o prompt de ENRIQUECIMENTO — a IA recebe empresas REAIS e NÃO pode alterar identidade.
 */
function buildEnrichmentPrompt(
  businesses: RealBusiness[],
  keyword: string,
  country: string,
  locationContext: string,
  strictMode: boolean,
  businessProfile: BusinessProfile,
  currencySymbol: string,
  currencyCode: string
): string {
  const realDataJson = businesses.map((b, idx) => ({
    index: idx,
    name: b.name,
    website: b.website || "",
    phone: b.phone || "",
    email: b.email || "",
    address: b.address || "",
    city: b.city || locationContext,
    country: b.country || country,
    rating: b.rating || 0,
    reviews: b.reviews || 0,
    category: b.category || keyword,
    subtypes: b.subtypes || [],
    description: b.description || "",
    googleMapsLink: b.googleMapsLink || ""
  }));

  return `
Você é o "Deep BANT & Tech-Stack Enricher", o agente supremo de inteligência de prospecção B2B autônoma de ALTO TICKET.
Sua missão é enriquecer EMPRESAS REAIS que já foram encontradas e verificadas por uma fonte de dados real (Google Maps / OpenStreetMap / LetScrape RapidAPI), identificar falhas críticas de conversão e tecnologia, e gerar abordagens de altíssima conversão para vender TODOS os serviços do usuário.

=======================================================
CONTEXTO DO MEU NEGÓCIO (VETORES DE DEEP MATCHING):
=======================================================
- Nome do Meu Negócio: "${businessProfile.businessName}"
- Proposta Única de Valor (UVP): "${businessProfile.uvp}"
- Serviços que Vendemos: "${businessProfile.servicesDescription}"
- Ticket Médio & ICP: "${businessProfile.ticketMedio}" | "${businessProfile.icpTarget}"
- Dores que Resolvemos: ${JSON.stringify(businessProfile.solvedPains)}
- Diferenciais: ${JSON.stringify(businessProfile.competitiveDifferentials)}

=======================================================
EMPRESAS REAIS PARA ENRIQUECER (ENCONTRADAS VIA FONTE DE DADOS REAL):
=======================================================
${JSON.stringify(realDataJson)}

PARA CADA EMPRESA DO ARRAY ACIMA, EXECUTE A ANÁLISE PROFUNDA DE ENRIQUECIMENTO E DIAGNÓSTICO:

1. BANT+ ENRICHMENT:
   - Budget: Orçamento estimado com base em porte, número de funcionários e faturamento presumido EM MOEDA LOCAL DO PAÍS (${country}, ${currencyCode}): ex: "${currencySymbol} 30k - ${currencySymbol} 80k/mês em marketing/tecnologia", Rating: "Alto" | "Médio" | "Baixo".
   - Authority: Estrutura do organograma. Se NÃO souber o nome real do decisor, use "NÃO VERIFICADO".
   - Need: Mapeie 3 falhas operacionais, estéticas ou tecnológicas plausíveis para o segmento (use "sinal de", "indícios de", "potencial de" — NUNCA afirme como verdade absoluta).
   - Timeline & Fator de Urgência: Urgência: "Crítico (Imediato)", "Médio (30 dias)", "Baixo".

2. TECH STACK DETECTOR: Ferramentas plausíveis para o segmento (Pixel do Meta, GA4, WordPress, VTEX, RD Station, HubSpot, chatbots). Se não houver website analisável, use ["Sem site analisado"].

3. MATRIZ DE PRIORIZAÇÃO DE DISPARO & INTENT SCORE (0 a 100):
   - Score > 80: Prioridade Alta ("HIGH"); 50-79: "MEDIUM"; < 50: "DISQUALIFIED".

4. CLASSIFICAÇÃO ICP (SCORE_A >= 85, SCORE_B 60-84, SCORE_C < 60).

5. ENGAJAMENTO OMNICHANNEL HIPERPERSONALIZADO: WhatsApp (Opção 1 Curiosidade + Opção 2 ROI), Cold Email (Assunto + bodyAida + bodyPas), Cold Call Script.

6. PAYLOADS DE AUTOMAÇÃO (Z-API WhatsApp, Resend Email, HubSpot CRM).

=======================================================
REGRAS ABSOLUTAS DE VERACIDADE (OBRIGATÓRIAS — NÃO INVENTAR DADOS):
=======================================================
1. NUNCA altere "name", "website", "phone", "email", "address", "rating", "reviews", "googleMapsLink". Copie EXATAMENTE os valores fornecidos no array de entrada.
2. NUNCA invente telefone, e-mail ou nome de decisor. Se não tiver certeza absoluta, escreva EXATAMENTE "NÃO VERIFICADO". Um contato falso danifica a entregabilidade do e-mail e a reputação do usuário.
3. Se "website" estiver vazio no input, mantenha vazio. Se "phone"/"email" estiverem vazios, mantenha vazios.
4. NÃO crie e-mails ou telefones com cara de real (ex: "contato@empresa.com", "5511987654321").
5. A cópia (WhatsApp/e-mail/telefone) deve referenciar apenas falhas plausíveis — use "sinal de", "indícios de", "potencial de". Nunca afirme fatos específicos que você não sabe como verdade absoluta.
6. Para empresas SEM website, marque "techStack.detectedTools" como ["Sem site analisado"] e o "matchReason" deve deixar claro que o diagnóstico foi presuntivo.

RETORNO ESTRITAMENTE EM JSON ARRAY VÁLIDO (sem comentários, sem markdown), MESMA ORDEM E MESMO NÚMERO DE ITENS DO INPUT:
[
  {
    "index": 0,
    "category": "Categoria real do input (mantenha do input)",
    "description": "Resumo da empresa baseado nos dados do input",
    "icpScore": 94,
    "icpTier": "SCORE_A",
    "intentScore": 92,
    "intentPriority": "HIGH",
    "urgencyFactor": "Sinal de expansão e demanda represada no segmento",
    "keyFlaws": [
      "1. Sinal de ausência de automação no WhatsApp para captura fora do horário comercial",
      "2. Potencial de Pixel desatualizado sem eventos de conversão",
      "3. Indício de site lento no mobile"
    ],
    "identifiedPain": "Possível vazamento de leads qualificados por falta de atendimento instantâneo",
    "suggestedAction": "Disparo imediato em até 1h: WhatsApp Curiosidade + Cold Call",
    "matchReason": "Empresa com presença real verificada e potencial de gap crítico na triagem de leads",
    "digitalGaps": ["Sem chatbot", "Sem CRM visível", "Pixel sem conversão"],
    "budgetMaturity": "Alta",
    "bantPlus": {
      "budget": {
        "estimatedBudget": "${currencySymbol} 15.000 a ${currencySymbol} 40.000 / mês em aquisição",
        "companySize": "25 a 50 funcionários (presumido)",
        "estimatedRevenue": "${currencySymbol} 5M - ${currencySymbol} 12M / ano (presumido)",
        "rating": "Alto"
      },
      "authority": {
        "keyDecisionMaker": "NÃO VERIFICADO",
        "role": "Diretor Comercial (presumido)",
        "orgStructure": "Diretoria Executiva / Comercial"
      },
      "need": {
        "operationalFlaws": [
          "Sinal de fila de espera no WhatsApp",
          "Indício de formulário de lead sem integração com CRM",
          "Possível ausência de recuperação de contatos perdidos"
        ],
        "primaryNeed": "SDR autônomo com qualificação em menos de 30 segundos",
        "impactSummary": "Estimativa de 30-40% de aumento em reuniões comerciais"
      },
      "timeline": {
        "urgencyFactor": "Sinal de demanda represada e necessidade de blindagem comercial",
        "urgencyLevel": "Crítico (Imediato)",
        "signals": ["Presença ativa no Google Maps", "Alto volume de reviews", "Operação real verificada"]
      }
    },
    "techStack": {
      "detectedTools": ["WordPress", "Meta Pixel", "Google Analytics 4"],
      "cmsOrPlatform": "WordPress / Elementor (presumido)",
      "analyticsAndPixels": ["Meta Pixel (Sem CAPI)", "Google Analytics GA4"],
      "crmAndAutomation": ["Sem CRM detectado (presumido)"],
      "vulnerabilitiesAndGaps": [
        "Possível ausência de Conversions API (CAPI) do Meta",
        "Indício de ausência de automação ou chatbot no WhatsApp",
        "Potencial falta de nutrição de leads"
      ]
    },
    "decisionMaker": {
      "name": "NÃO VERIFICADO",
      "role": "NÃO VERIFICADO",
      "directEmail": "NÃO VERIFICADO",
      "directPhone": "NÃO VERIFICADO"
    },
    "outreach": {
      "whatsapp": {
        "option1Curiosity": "Olá, tudo bem? Notei que a [Empresa] tem presença ativa no mercado mas há sinais de ausência de triagem automática após o horário comercial, o que faz empresas perderem até 40% das oportunidades. Posso te mandar um vídeo de 20s mostrando como resolver isso?",
        "option2RoiDirect": "Fala! Implementamos recentemente um SDR de IA que atende em 15s e aumentou em 38% os agendamentos qualificados. Vale batermos 5 minutos nessa semana?"
      },
      "email": {
        "subject": "[Empresa] + [Meu Negócio]: ponto de melhoria no canal comercial",
        "bodyAida": "Olá,\n\nAnalisei a operação digital da [Empresa] e identifiquei sinais de falhas de conversão imediatas, especialmente a ausência de resposta imediata nos canais de anúncio...\n\nPodemos falar 10 minutos na quinta às 14h?",
        "bodyPas": "Olá,\n\nHoje, mais de 50% dos clientes buscam atendimento fora do horário comercial. Sem um fluxo autônomo, esses leads procuram o concorrente direto...\n\nNossa IA resolve isso de ponta a ponta. Faz sentido conversar?"
      },
      "coldCall": {
        "iceBreaker5s": "Olá, aqui é da [Meu Negócio]. Sei que você não esperava minha ligação, tem 30 segundos?",
        "anchorQuestion": "Vi que a operação tem presença ativa mas o retorno no WhatsApp pode demorar horas. Como vocês têm evitado perder leads que chegam à noite?",
        "pitch15s": "Nós criamos SDRs de IA que qualificam e agendam em 20 segundos 24 horas por dia. Conseguimos conversar 10 minutos amanhã às 15h?",
        "objectionTips": [
          "Se disser 'Já tenho equipe': 'O sistema apoia sua recepção cuidando da triagem inicial.'",
          "Se disser 'Sem tempo': 'Justamente por isso a conversa dura apenas 10 minutos objetivos.'"
        ]
      }
    },
    "webhookPayloads": {
      "zapiWhatsApp": {
        "phone": "",
        "message": "Texto pronto",
        "leadName": "NÃO VERIFICADO",
        "company": "[Empresa]",
        "icpScore": 94,
        "intentScore": 92
      },
      "resendEmail": {
        "to": "",
        "subject": "Assunto",
        "text": "Corpo",
        "html": "<p>Corpo</p>",
        "tags": [{"name": "source", "value": "deep_bant_enricher"}]
      },
      "hubspotCrmTask": {
        "taskName": "Prioridade Alta (1h) - [Empresa]",
        "company": "[Empresa]",
        "contactName": "NÃO VERIFICADO",
        "priority": "HIGH",
        "dealStage": "Lead Enriquecido BANT+",
        "callScriptNotes": "Script completo com ancoragem",
        "identifiedPain": "Possível vazamento de leads",
        "dueDate": "2026-08-16",
        "intentScore": 92,
        "techStack": ["WordPress", "Meta Pixel"],
        "urgencyFactor": "Demanda represada"
      }
    }
  }
]
`;
}

/**
 * Extrai o array JSON da resposta da IA (tolerante a markdown/objetos wrapper)
 */
function extractJsonArray(text: string): any[] {
  let t = text || "[]";
  const startIndex = t.indexOf('[');
  const endIndex = t.lastIndexOf(']');
  if (startIndex !== -1 && endIndex !== -1) {
    t = t.substring(startIndex, endIndex + 1);
  } else {
    t = t.replace(/```json/g, '').replace(/```/g, '').trim();
  }
  try {
    const parsed = JSON.parse(t);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.leads)) return parsed.leads;
    return [];
  } catch (e) {
    console.warn("JSON Parse Error, tentando regex...", e);
    const match = t.match(/\[\s*\{.*\}\s*\]/s);
    if (match) {
      try { return JSON.parse(match[0]); } catch (inner) {}
    }
    return [];
  }
}

/**
 * Constroi um Lead a partir de uma empresa REAL (LetScrape/OSM) + enriquecimento da IA (Groq).
 * A identidade (nome/site/telefone/endereço) vem SEMPRE da fonte real — a IA apenas complementa análise.
 */
function buildLeadFromRealBusiness(
  real: RealBusiness,
  raw: any,
  index: number,
  keyword: string,
  country: string,
  locationContext: string,
  district: string,
  currencySymbol: string,
  businessProfile: BusinessProfile
): Lead {
  const icpScore = typeof raw?.icpScore === 'number' ? Math.min(100, Math.max(0, raw.icpScore)) : 75;
  let icpTier: IcpTier = 'SCORE_B';
  if (icpScore >= 85) icpTier = 'SCORE_A';
  else if (icpScore < 60) icpTier = 'SCORE_C';

  const intentScore = typeof raw?.intentScore === 'number'
    ? Math.min(100, Math.max(0, raw.intentScore))
    : (icpTier === 'SCORE_A' ? Math.min(98, icpScore + 2) : (icpTier === 'SCORE_B' ? Math.max(55, icpScore - 5) : 40));

  let intentPriority: 'HIGH' | 'MEDIUM' | 'DISQUALIFIED' = 'MEDIUM';
  if (intentScore >= 80) intentPriority = 'HIGH';
  else if (intentScore < 50) intentPriority = 'DISQUALIFIED';

  const leadName = real.name;
  const decName = cleanField(raw?.bantPlus?.authority?.keyDecisionMaker || raw?.decisionMaker?.name) || "Responsável Comercial";
  const decRole = cleanField(raw?.bantPlus?.authority?.role || raw?.decisionMaker?.role) || "Diretor(a)";
  const decPhone = cleanField(raw?.decisionMaker?.directPhone);
  const decEmail = cleanField(raw?.decisionMaker?.directEmail);

  const defaultPain = raw?.identifiedPain || "Processos comerciais com pontos de atrito e tempo de resposta elevado";
  const urgencyFactor = raw?.urgencyFactor || raw?.bantPlus?.timeline?.urgencyFactor || "Demanda ativa com gap de atendimento digital";

  const keyFlaws: string[] = Array.isArray(raw?.keyFlaws) && raw.keyFlaws.length > 0
    ? raw.keyFlaws
    : (Array.isArray(raw?.bantPlus?.need?.operationalFlaws) && raw.bantPlus.need.operationalFlaws.length > 0
        ? raw.bantPlus.need.operationalFlaws
        : [
            "1. Sinal de ausência de triagem automatizada no WhatsApp",
            "2. Potencial de tempo de resposta aos leads superior a 60 minutos",
            "3. Indício de Pixel do Meta sem mensuração de conversão completa"
          ]);

  const defaultSuggestedAction = intentPriority === 'HIGH'
    ? "Prioridade Alta: Disparo em até 1h (WhatsApp Curiosidade + Cold Call)"
    : (intentPriority === 'MEDIUM' ? "Fila Padrão: Disparo WhatsApp Opção 2 / Email AIDA" : "Desqualificado: Não gastar recursos de envio");

  const bantPlus = {
    budget: {
      estimatedBudget: raw?.bantPlus?.budget?.estimatedBudget || (icpScore >= 85 ? `${currencySymbol} 20.000 a ${currencySymbol} 50.000 / mês` : `${currencySymbol} 5.000 a ${currencySymbol} 15.000 / mês`),
      companySize: raw?.bantPlus?.budget?.companySize || (icpScore >= 85 ? "20 a 50 funcionários" : "5 a 15 funcionários"),
      estimatedRevenue: raw?.bantPlus?.budget?.estimatedRevenue || (icpScore >= 85 ? `${currencySymbol} 4M a ${currencySymbol} 10M / ano` : `${currencySymbol} 1M a ${currencySymbol} 3M / ano`),
      rating: raw?.bantPlus?.budget?.rating || (icpScore >= 85 ? "Alto" : (icpScore >= 60 ? "Médio" : "Baixo"))
    },
    authority: {
      keyDecisionMaker: decName,
      role: decRole,
      orgStructure: raw?.bantPlus?.authority?.orgStructure || "Diretoria Comercial / Operações",
      linkedinSearchUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(leadName)}`
    },
    need: {
      operationalFlaws: keyFlaws,
      primaryNeed: raw?.bantPlus?.need?.primaryNeed || (icpScore >= 85 ? "Atendimento autônomo com IA e SLA < 30s" : "Estruturação de canal digital e CRM"),
      impactSummary: raw?.bantPlus?.need?.impactSummary || "Recuperação estimada de 30% dos leads perdidos"
    },
    timeline: {
      urgencyFactor,
      urgencyLevel: (intentPriority === 'HIGH' ? "Crítico (Imediato)" : (intentPriority === 'MEDIUM' ? "Médio (30 dias)" : "Baixo")) as any,
      signals: Array.isArray(raw?.bantPlus?.timeline?.signals) && raw.bantPlus.timeline.signals.length > 0
        ? raw.bantPlus.timeline.signals
        : ["Presença ativa no Google Maps", "Volume de avaliações reais", "Operação verificada em fonte real"]
    }
  };

  const techStack = {
    detectedTools: Array.isArray(raw?.techStack?.detectedTools) && raw.techStack.detectedTools.length > 0
      ? raw.techStack.detectedTools
      : (real.website ? ["WordPress", "Meta Pixel", "Google Analytics GA4"] : ["Sem site analisado"]),
    cmsOrPlatform: raw?.techStack?.cmsOrPlatform || (real.website ? "WordPress / Plataforma Própria" : "Não identificado"),
    analyticsAndPixels: Array.isArray(raw?.techStack?.analyticsAndPixels) && raw.techStack.analyticsAndPixels.length > 0
      ? raw.techStack.analyticsAndPixels
      : ["Meta Pixel (Padrão)", "Google Analytics 4"],
    crmAndAutomation: Array.isArray(raw?.techStack?.crmAndAutomation) && raw.techStack.crmAndAutomation.length > 0
      ? raw.techStack.crmAndAutomation
      : ["Sem CRM detectado (presumido)"],
    vulnerabilitiesAndGaps: Array.isArray(raw?.techStack?.vulnerabilitiesAndGaps) && raw.techStack.vulnerabilitiesAndGaps.length > 0
      ? raw.techStack.vulnerabilitiesAndGaps
      : [
          "Possível ausência de Conversions API (CAPI) do Meta",
          "Indício de ausência de automação ou chatbot no WhatsApp",
          "Potencial falta de nutrição de leads via email/SMS"
        ]
  };

  const decisionMaker = {
    name: decName,
    role: decRole,
    directEmail: decEmail,
    directPhone: decPhone,
    linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(leadName)}`
  };

  const outreach = {
    whatsapp: {
      option1Curiosity: raw?.outreach?.whatsapp?.option1Curiosity || `Olá ${decName}, tudo bem? Notei que a ${leadName} tem presença ativa em ${real.city || locationContext} mas há sinais de ausência de triagem automática no WhatsApp após o horário comercial, o que faz empresas perderem até 40% das oportunidades. Posso te mandar um vídeo de 20s mostrando como resolver isso?`,
      option2RoiDirect: raw?.outreach?.whatsapp?.option2RoiDirect || `Fala ${decName}! Implementamos recentemente um SDR de IA para ${real.category || 'o setor'} que atende em 15s e aumentou em 38% os agendamentos qualificados. Vale batermos 5 minutos nessa semana?`
    },
    email: {
      subject: raw?.outreach?.email?.subject || `${leadName} + ${businessProfile.businessName}: ponto de melhoria no canal comercial`,
      bodyAida: raw?.outreach?.email?.bodyAida || `Olá ${decName},\n\nAnalisei a operação digital da ${leadName} e identifiquei sinais de falhas de conversão imediatas, especialmente a ausência de resposta imediata nos canais de anúncio...\n\nPodemos falar 10 minutos na quinta às 14h?`,
      bodyPas: raw?.outreach?.email?.bodyPas || `Olá ${decName},\n\nHoje, mais de 50% dos clientes buscam atendimento fora do horário comercial. Sem um fluxo autônomo, esses leads procuram o concorrente direto...\n\nNossa IA resolve isso de ponta a ponta. Faz sentido conversar?`
    },
    coldCall: {
      iceBreaker5s: raw?.outreach?.coldCall?.iceBreaker5s || `Olá ${decName}, aqui é da ${businessProfile.businessName}. Sei que você não esperava minha ligação, tem 30 segundos?`,
      anchorQuestion: raw?.outreach?.coldCall?.anchorQuestion || `${decName}, vi que a ${leadName} tem presença ativa mas o retorno no WhatsApp pode demorar horas. Como vocês têm evitado perder os leads que chegam à noite?`,
      pitch15s: raw?.outreach?.coldCall?.pitch15s || `Nós criamos SDRs de IA que qualificam e agendam consultas em 20 segundos 24 horas por dia. Conseguimos conversar 10 minutos amanhã às 15h para eu te mostrar?`,
      objectionTips: Array.isArray(raw?.outreach?.coldCall?.objectionTips) && raw.outreach.coldCall.objectionTips.length > 0
        ? raw.outreach.coldCall.objectionTips
        : [
            "Se disser 'Já tenho equipe': 'O sistema apoia sua recepção cuidando da triagem inicial e agendamento para que eles foquem apenas em fechar negócio.'",
            "Se disser 'Sem tempo': 'Justamente por isso a conversa dura apenas 10 minutos objetivos.'"
          ]
    }
  };

  const webhookPayloads = raw?.webhookPayloads || {
    zapiWhatsApp: {
      phone: (real.phone || '').replace(/\D/g, ''),
      message: outreach.whatsapp.option1Curiosity,
      leadName: decName,
      company: leadName,
      icpScore,
      intentScore
    },
    resendEmail: {
      to: real.email || "",
      subject: outreach.email.subject,
      text: outreach.email.bodyAida,
      html: `<p>${outreach.email.bodyAida.replace(/\n/g, '<br/>')}</p>`,
      tags: [{ name: "source", value: "deep_bant_enricher" }]
    },
    hubspotCrmTask: {
      taskName: `Prioridade Alta (1h) - ${leadName}`,
      company: leadName,
      contactName: decName,
      priority: intentPriority,
      dealStage: "Lead Enriquecido BANT+",
      callScriptNotes: outreach.coldCall.anchorQuestion,
      identifiedPain: defaultPain,
      dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      intentScore,
      techStack: techStack.detectedTools,
      urgencyFactor
    }
  };

  const tempLead: Lead = {
    id: `lead-real-${Date.now()}-${index + 1}`,
    name: leadName,
    status: 'new',
    source: 'ai',
    category: raw?.category || real.category || keyword || 'B2B',
    rating: real.rating || (typeof raw?.rating === 'number' ? raw.rating : 4.5),
    reviews: real.reviews || (typeof raw?.reviews === 'number' ? raw.reviews : 0),
    address: real.address || `Região de ${locationContext}`,
    city: real.city || locationContext,
    district: district !== 'Todas' ? district : real.district,
    country: real.country || country,
    website: real.website || '',
    phone: real.phone || cleanField(raw?.phone),
    email: real.email || cleanField(raw?.email),
    googleMapsLink: real.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(leadName)}`,
    description: raw?.description || real.description || `Empresa real atuando no segmento de ${real.category || keyword || 'B2B'} em ${locationContext}.`,
    score: Math.round(icpScore * 0.5 + intentScore * 0.4 + 10),
    icpScore,
    icpTier,
    intentScore,
    intentPriority,
    urgencyFactor,
    keyFlaws,
    identifiedPain: defaultPain,
    suggestedAction: raw?.suggestedAction || defaultSuggestedAction,
    matchReason: raw?.matchReason || `Empresa real verificada com forte potencial de alinhamento com a UVP de ${businessProfile.businessName}.`,
    digitalGaps: Array.isArray(raw?.digitalGaps) ? raw.digitalGaps : ["Sem SDR IA", "Pixel sem CAPI", "Atendimento manual"],
    budgetMaturity: raw?.budgetMaturity || (icpScore >= 85 ? "Alta" : "Média"),
    bantPlus,
    techStack,
    decisionMaker,
    outreach,
    webhookPayloads,
    businessStatus: (real.businessStatus === 'OPEN' ? 'OPERATIONAL' : real.businessStatus === 'CLOSED' ? 'CLOSED_PERMANENTLY' : 'UNKNOWN')
  };

  // Enrich with Deliverability Guardian, Objection Crusher Matrix, Cadence Master & Webhook Payloads
  const guardian = buildDeliverabilityGuardian(tempLead);
  const objectionCrusher = buildObjectionCrusherMatrix(tempLead, businessProfile);
  const cadence = buildCadenceMaster(tempLead, businessProfile);
  const enhancedPayloads = buildEvolutionAndResendPayloads(tempLead, icpTier === 'SCORE_A' ? 'A' : (icpTier === 'SCORE_B' ? 'B' : 'C'));

  tempLead.guardian = guardian;
  tempLead.objectionCrusher = objectionCrusher;
  tempLead.cadence = cadence;
  tempLead.webhookPayloads = {
    ...webhookPayloads,
    evolutionApiWhatsApp: enhancedPayloads.evolutionApiWhatsApp,
    resendEmail: enhancedPayloads.resendEmail
  };

  return tempLead;
}

/**
 * 2, 3, 4 & 5: PIPELINE COMPLETO DE PROSPECÇÃO, ICP MATCH ENGINE, COPY OMNICHANNEL & PAYLOADS
 * NOVA ARQUITETURA ANTI-ALUCINAÇÃO:
 *   1) Busca EMPRESAS REAIS via LetScrape (RapidAPI) + OpenStreetMap (fallback grátis);
 *   2) Groq/Gemini apenas ENRIQUECE as empresas reais (nunca inventa nome/site/contato);
 *   3) Se nenhuma fonte real retornar, usa o motor sintético (claramente marcado).
 */
export async function searchAndScoreLeads(
  keyword: string,
  country: string,
  location: string,
  district: string,
  radius: number,
  strictMode: boolean,
  businessProfile: BusinessProfile,
  signal?: AbortSignal
): Promise<{ leads: Lead[]; engineStatus: ScrapingEngineStatus }> {
  const startTime = Date.now();

  // Moeda e contexto monetário do país de prospecção
  const cur = getCurrencyConfig(country);
  const currencySymbol = cur.symbol;

  let locationContext = location && location.trim() !== ""
    ? `${location}, ${district && district !== 'Todas' ? district + ', ' : ''}${country}`
    : (district && district !== 'Todas' ? `${district}, ${country}` : country);

  const isAuto = !keyword || keyword.trim() === "" || keyword.toLowerCase() === "auto" || keyword.toLowerCase() === "todos";

  let usedEngineName = "Groq AI Enrichment";

  // ============================================================
  // FASE 1: BUSCA DE EMPRESAS REAIS (LetScrape RapidAPI + OSM)
  // ============================================================
  const searchTerms = deriveRealSearchTerms(keyword, businessProfile);
  let realBusinesses: RealBusiness[] = [];
  let realEngineUsed = "Nenhum motor real disponível";
  let realEngineError: string | undefined;

  for (const term of searchTerms.slice(0, 4)) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    try {
      const res = await searchRealBusinesses({
        keyword: term,
        country,
        location,
        district,
        radius,
        strictMode,
        limit: 12,
        signal
      });
      realEngineUsed = res.engineUsed;
      realEngineError = res.error;
      if (res.businesses.length > 0) {
        realBusinesses = realBusinesses.concat(res.businesses);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') throw err;
      realEngineError = err.message || String(err);
    }
    if (realBusinesses.length >= 12) break;
  }

  // Remove duplicatas por nome e prioriza empresas com site/telefone/avaliação
  const seen = new Set<string>();
  realBusinesses = realBusinesses.filter(b => {
    const key = normalize(b.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  realBusinesses = prioritizeRealBusinesses(realBusinesses, strictMode).slice(0, 12);

  // ============================================================
  // FASE 2: ENRIQUECIMENTO COM IA (GROQ/GEMINI) — SEM INVENTAR
  // ============================================================
  if (realBusinesses.length > 0) {
    try {
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const prompt = buildEnrichmentPrompt(
        realBusinesses,
        keyword,
        country,
        locationContext,
        strictMode,
        businessProfile,
        currencySymbol,
        cur.code
      );

      const aiRes = await executeAiCompletion({
        prompt,
        systemPrompt: "Você é o mais avançado motor de enriquecimento e inteligência B2B de alto ticket do mundo. NUNCA invente identidade, telefone, e-mail ou decisor — enriqueça apenas as empresas reais fornecidas.",
        temperature: 0.35,
        jsonMode: true,
        signal
      });

      usedEngineName = aiRes.engineUsed;
      const latencyMs = Date.now() - startTime;
      const enrichedArray = extractJsonArray(aiRes.text);

      const enrichedByIndex: Record<number, any> = {};
      (enrichedArray || []).forEach((item: any, i: number) => {
        const idx = typeof item?.index === 'number' ? item.index : i;
        enrichedByIndex[idx] = item;
      });

      const processedLeads: Lead[] = realBusinesses.map((real, index) =>
        buildLeadFromRealBusiness(
          real,
          enrichedByIndex[index],
          index,
          keyword,
          country,
          locationContext,
          district,
          currencySymbol,
          businessProfile
        )
      );

      const engineStatus: ScrapingEngineStatus = {
        primary: { name: realEngineUsed, status: "ACTIVE" },
        secondary: { name: "OpenStreetMap Overpass (Fallback Gratuito)", status: realEngineUsed.toLowerCase().includes("openstreetmap") ? "ACTIVE" : "FALLBACK_READY" },
        tertiary: { name: `AI Enrichment (${usedEngineName})`, status: "ACTIVE" },
        activeEngine: realEngineUsed,
        lastLatencyMs: latencyMs,
        extractedCount: processedLeads.length
      };

      return { leads: processedLeads, engineStatus };

    } catch (error: any) {
      if (error.name === 'AbortError') throw error;
      console.warn("⚠️ Enriquecimento IA falhou — usando empresas reais com dados básicos:", error);

      // Mesmo sem IA, as empresas REAIS são retornadas (identidade real preservada)
      const processedLeads: Lead[] = realBusinesses.map((real, index) =>
        buildLeadFromRealBusiness(
          real,
          null,
          index,
          keyword,
          country,
          locationContext,
          district,
          currencySymbol,
          businessProfile
        )
      );

      const fallbackEngineStatus: ScrapingEngineStatus = {
        primary: { name: realEngineUsed, status: "ACTIVE" },
        secondary: { name: "OpenStreetMap Overpass (Fallback Gratuito)", status: realEngineUsed.toLowerCase().includes("openstreetmap") ? "ACTIVE" : "FALLBACK_READY" },
        tertiary: { name: "AI Enrichment (Groq)", status: "STANDBY" },
        activeEngine: realEngineUsed,
        lastLatencyMs: Date.now() - startTime,
        extractedCount: processedLeads.length
      };

      return { leads: processedLeads, engineStatus: fallbackEngineStatus };
    }
  }

  // ============================================================
  // FASE 3: FALLBACK SINTÉTICO (apenas se NENHUMA fonte real retornar)
  // ============================================================
  console.warn("⚠️ Nenhuma empresa real encontrada. Ativando Motor Autônomo de Extração Multi-Nicho...", realEngineError);

  const fallbackLeads = generateAutonomousFallbackLeads(
    keyword,
    country,
    location,
    district,
    businessProfile,
    8
  );

  const fallbackEngineStatus: ScrapingEngineStatus = {
    primary: { name: realEngineUsed, status: "STANDBY" },
    secondary: { name: "Motor Autônomo Multi-Nicho de Alto Ticket", status: "ACTIVE" },
    tertiary: { name: "LetScrape RapidAPI + OpenStreetMap", status: "READY" },
    activeEngine: "Autonomous Multi-Nicho High-Ticket Engine",
    lastLatencyMs: Date.now() - startTime,
    extractedCount: fallbackLeads.length
  };

  return { leads: fallbackLeads, engineStatus: fallbackEngineStatus };
}

/**
 * Custom Copy Generator for specific Lead on-demand
 */
export async function generatePersonalizedEmail(lead: Lead, template: string): Promise<string> {
  const prompt = `
Você é um Copywriter B2B de Elite especializado em cold email de altíssima conversão.

INFORMAÇÕES DO LEAD:
- Empresa: ${lead.name}
- Decisor: ${lead.decisionMaker?.name || 'Diretor'} (${lead.decisionMaker?.role || 'Decisão'})
- Dor Identificada: ${lead.identifiedPain}
- ICP Score: ${lead.icpScore}% (${lead.icpTier})
- Cidade: ${lead.city}
- Categoria: ${lead.category}
- Website: ${lead.website || 'Sem site'}

TEMPLATE BASE:
"${template}"

DIRETRIZES:
1. Adapte o template com tom 100% humano, zero robótico.
2. NUNCA use frases clichês como "espero que este e-mail o encontre bem".
3. Destaque a dor específica: "${lead.identifiedPain}".
4. Mantenha os placeholders devidamente preenchidos. Retorne apenas o corpo do email.
`;

  try {
    const res = await executeAiCompletion({
      prompt,
      temperature: 0.4,
      jsonMode: false
    });
    return res.text?.trim() || template;
  } catch (err) {
    console.error("Erro gerando email:", err);
    return template.replace(/{{name}}/g, lead.name).replace(/{{city}}/g, lead.city);
  }
}
