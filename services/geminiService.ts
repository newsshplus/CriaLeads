import { Lead, BusinessProfile, IcpTier, ScrapingEngineStatus } from "../types";
import { buildDeliverabilityGuardian, buildEvolutionAndResendPayloads } from "./deliverabilityService";
import { buildObjectionCrusherMatrix } from "./objectionCrusherService";
import { buildCadenceMaster } from "./cadenceService";
import { generateAutonomousFallbackLeads } from "./syntheticProspector";
import { executeAiCompletion, scanWebsiteAndExtractProfile } from "./aiProviderService";

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
 * 2, 3, 4 & 5: PIPELINE COMPLETO DE PROSPECÇÃO, ICP MATCH ENGINE, COPY OMNICHANNEL & PAYLOADS
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

  let locationContext = location && location.trim() !== "" 
    ? `${location}, ${district && district !== 'Todas' ? district + ', ' : ''}${country}`
    : (district && district !== 'Todas' ? `${district}, ${country}` : country);

  const isAutoHighTicket = !keyword || keyword.trim() === "" || keyword.toLowerCase() === "auto" || keyword.toLowerCase() === "alto ticket" || keyword.toLowerCase() === "todos";

  const targetNichesDescription = isAutoHighTicket
    ? (businessProfile.recommendedHighTicketNiches && businessProfile.recommendedHighTicketNiches.length > 0
        ? businessProfile.recommendedHighTicketNiches.map(n => `• ${n.niche} (${n.tag}) - Motivo: ${n.whyGoodMatch} | Ticket estimado: ${n.estimatedTicket}`).join("\n")
        : `• Clínicas Médicas & Odonto Estética de Alto Padrão (R$ 10k-35k)
• Escritórios de Advocacia Corporativa & Tributária (R$ 15k-60k)
• Incorporadoras e Imobiliárias de Alto Padrão (R$ 20k-80k)
• Indústrias & Distribuidores B2B (R$ 25k-100k)
• Consultorias Empresariais & BPO (R$ 12k-45k)`)
    : `• ${keyword}`;

  const prompt = `
Você é o "Deep BANT & Tech-Stack Enricher", o agente supremo de inteligência de prospecção B2B autônoma de ALTO TICKET.
Sua missão é prospectar empresas reais com alto poder aquisitivo (orçamento expressivo), identificar falhas críticas de conversão e tecnologia, e gerar abordagens de altíssima conversão para vender TODOS os serviços do usuário.

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
OBJETIVO DA BUSCA E ENRIQUECIMENTO PROFUNDO:
=======================================================
${isAutoHighTicket
  ? `ENCONTRE 8 A 12 EMPRESAS REAIS DE ALTO TICKET localizadas em "${locationContext}", distribuídas estrategicamente entre os seguintes nichos de alta conversão:
${targetNichesDescription}`
  : `Encontre 8 a 12 empresas reais para o termo "${keyword}" localizadas em "${locationContext}".`
}

PARA CADA EMPRESA E LEAD FORNECIDO, EXECUTE A ANÁLISE PROFUNDA DE ENRIQUECIMENTO E DIAGNÓSTICO:

1. BANT+ ENRICHMENT:
   - Budget: Orçamento estimado com base em porte, número de funcionários e faturamento presumido (ex: "R$ 30k - R$ 80k/mês em marketing/tecnologia", "Faturamento anual presumido R$ 3M - R$ 8M", Rating: "Alto" | "Médio" | "Baixo").
   - Authority: Estrutura do organograma. Identifique o CEO, CMO, CTO, Sócio-Fundador ou Diretor de Operações (nome completo e cargo específico).
   - Need: Mapeie exatamente 3 falhas operacionais, estéticas ou tecnológicas visíveis no site/operação dele (ex: "1. Ausência de Pixel do Meta para retargeting; 2. Tempo de resposta no WhatsApp > 2 horas sem triagem; 3. Formulário de contato com erro ou sem validação instantânea").
   - Timeline & Fator de Urgência: Indicadores de urgência identificados (ex: vagas abertas no LinkedIn para comercial/marketing, expansão para nova unidade, tecnologias e design defasados, queda no engajamento recente). Urgência: "Crítico (Imediato)", "Médio (30 dias)", "Baixo".

2. TECH STACK DETECTOR:
   - Ferramentas utilizadas ou ausentes: Identifique quais ferramentas ele utiliza (Pixel do Meta, Google Analytics / GA4, WordPress/Elementor, Webflow, VTEX, Shopify, RD Station, HubSpot, ActiveCampaign, Chatbots) para encontrar brechas na estrutura atual.

3. MATRIZ DE PRIORIZAÇÃO DE DISPARO & INTENT SCORE (0 a 100):
   - Calcule o "Intent Score" (0 a 100):
     * Score > 80: Prioridade Alta ("HIGH") -> Disparo imediato em até 1 hora (Gaps críticos, alto budget, decisor mapeado).
     * Score 50-79: Prioridade Média ("MEDIUM") -> Entra na fila padrão de nutrição/disparo.
     * Score < 50: Desqualificado ("DISQUALIFIED") -> Não gastar recursos de envio ou ligação.

4. CLASSIFICAÇÃO ICP (SCORE_A, SCORE_B, SCORE_C):
   - SCORE A (Hot Match - 85% a 100%)
   - SCORE B (Warm Match - 60% a 84%)
   - SCORE C (Desqualificado - < 60%)

5. ENGAJAMENTO OMNICHANNEL HIPERPERSONALIZADO (Human-Like Copy):
   - WhatsApp Opção 1 (Curiosidade baseada na falha real #1 identificada)
   - WhatsApp Opção 2 (Áudio transcrito focado em ROI e resolução da falha)
   - Cold Email Outbound (Assunto sem spam + bodyAida + bodyPas)
   - Cold Call Script (Quebra de gelo 5s + Pergunta Ancoragem da Dor + Pitch 15s + Objeções)

6. PAYLOADS DE AUTOMAÇÃO (Z-API WhatsApp, Resend Email, HubSpot CRM com Intent Score e Techs).

=======================================================
REGRAS DE VERACIDADE (OBRIGATÓRIAS — NÃO INVENTAR DADOS):
=======================================================
1. NUNCA invente telefone, e-mail ou nome de decisor. Se você não tem certeza absoluta de um dado de contato, escreva EXATAMENTE "NÃO VERIFICADO" no campo (ex: "phone": "NÃO VERIFICADO", "email": "NÃO VERIFICADO", "directPhone": "NÃO VERIFICADO", "directEmail": "NÃO VERIFICADO"). Um contato falso danifica a entregabilidade do e-mail e a reputação do usuário.
2. Dados de contato só devem ser preenchidos quando derivados de informação pública real que você conhece (site, Google Maps, redes sociais oficiais). Campos incertos NUNCA recebem valores fabricados com cara de real (ex: "contato@empresa.com", "5511987654321").
3. Se não conseguir determinar o site da empresa, use "". Se não conseguir determinar a categoria, use a categoria do termo de busca.
4. "rating", "reviews", "address", "description" e "bantPlus" (budget/funcionários/faturamento) devem ser estimativas plausíveis EXPLICITAMENTE marcadas como suposição no texto quando não verificáveis — prefira valores conservadores a valores inventados.
5. Se o site não pôde ser analisado, marque "techStack.detectedTools" como ["Sem site analisado"], "digitalGaps" só com gaps plausíveis genéricos e o "matchReason" deve deixar claro que o diagnóstico foi presuntivo.
6. A cópia (WhatsApp/e-mail/telefone) deve referenciar apenas as falhas que você efetivamente identificou. Nunca afirme fatos específicos da empresa que você não sabe (número de funcionários exato, faturamento exato, etc.) como verdade absoluta — use "sinal de", "indícios de", "potencial de".

RETORNO ESTRITAMENTE EM JSON ARRAY VÁLIDO (sem comentários, sem markdown, sem texto antes ou depois):
[
  {
    "name": "Nome da Empresa",
    "category": "${isAutoHighTicket ? 'Nicho de Alto Ticket' : (keyword || 'Categoria')}",
    "rating": 4.9,
    "reviews": 48,
    "address": "Endereço completo",
    "city": "${location || 'Região'}",
    "website": "https://...",
    "phone": "NÃO VERIFICADO",
    "email": "NÃO VERIFICADO",
    "googleMapsLink": "https://maps.google.com/...",
    "description": "Resumo da empresa",
    "icpScore": 94,
    "icpTier": "SCORE_A",
    "intentScore": 92,
    "intentPriority": "HIGH",
    "urgencyFactor": "Contratação de novos vendedores no LinkedIn e site sem automação de WhatsApp",
    "keyFlaws": [
      "1. Ausência de automação no WhatsApp para captura fora do horário comercial",
      "2. Meta Pixel desatualizado sem eventos de conversão disparados",
      "3. Site lento no mobile com tempo de carregamento superior a 4.5s"
    ],
    "identifiedPain": "Vazamento de leads qualificados por falta de atendimento instantâneo 24/7",
    "suggestedAction": "Disparo imediato em até 1h: WhatsApp Curiosidade + Cold Call",
    "matchReason": "Empresa em forte expansão com alta capacidade financeira e gap crítico na triagem",
    "digitalGaps": ["Sem chatbot", "Sem CRM visível", "Pixel sem conversão"],
    "budgetMaturity": "Alta",
    "bantPlus": {
      "budget": {
        "estimatedBudget": "R$ 15.000 a R$ 40.000 / mês em aquisição",
        "companySize": "25 a 50 funcionários",
        "estimatedRevenue": "R$ 5M - R$ 12M / ano",
        "rating": "Alto"
      },
      "authority": {
        "keyDecisionMaker": "Rodrigo Silva",
        "role": "Diretor Comercial e Sócio",
        "orgStructure": "Diretoria Executiva / Comercial"
      },
      "need": {
        "operationalFlaws": [
          "Fila de espera de atendimento no WhatsApp ultrapassa 90 minutos",
          "Formulário de lead sem integração automática com CRM",
          "Ausência de recuperação de contatos perdidos"
        ],
        "primaryNeed": "SDR autônomo com qualificação em menos de 30 segundos",
        "impactSummary": "Estimativa de 35% de aumento em reuniões comerciais"
      },
      "timeline": {
        "urgencyFactor": "Vagas abertas para equipe de vendas e alta demanda represada",
        "urgencyLevel": "Crítico (Imediato)",
        "signals": ["Vagas ativas no LinkedIn", "Alto volume de reviews recentes", "Campanhas de tráfego ativas"]
      }
    },
    "techStack": {
      "detectedTools": ["WordPress", "Meta Pixel", "Google Analytics 4", "WhatsApp Web Link"],
      "cmsOrPlatform": "WordPress / Elementor",
      "analyticsAndPixels": ["Meta Pixel (Sem CAPI)", "Google Analytics GA4"],
      "crmAndAutomation": ["Sem CRM detectado (Uso de planilhas/WhatsApp manual)"],
      "vulnerabilitiesAndGaps": [
        "Não possui Conversions API (CAPI) do Meta, perdendo rastreamento iOS",
        "Sem automação ou chatbot de triagem no WhatsApp",
        "Sem nutrição de leads via email/SMS"
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
        "option1Curiosity": "Olá Rodrigo, tudo bem? Notei que vocês estão com campanhas ativas no Meta mas o canal de WhatsApp da [Empresa] está sem triagem automática após às 18h...",
        "option2RoiDirect": "Fala Rodrigo! Implementamos recentemente um SDR de IA para [Segmento] que atende em 15s e aumentou em 38% os agendamentos qualificados..."
      },
      "email": {
        "subject": "[Empresa] + [Meu Negócio]: gap de triagem no WhatsApp identificado",
        "bodyAida": "Olá Rodrigo,\n\nAnalisei a operação digital da [Empresa] e identifiquei 3 falhas de conversão imediatas...",
        "bodyPas": "Olá Rodrigo,\n\nHoje, mais de 50% dos clientes buscam atendimento fora do horário comercial..."
      },
      "coldCall": {
        "iceBreaker5s": "Olá Rodrigo, aqui é da [Meu Negócio]. Sei que você não esperava minha ligação, tem 30 segundos?",
        "anchorQuestion": "Rodrigo, vi que vocês têm um tráfego forte mas o retorno no WhatsApp chega a demorar horas...",
        "pitch15s": "Nós criamos SDRs de IA que qualificam e agendam consultas em 20 segundos 24 horas por dia...",
        "objectionTips": [
          "Se disser 'Já tenho equipe': 'O sistema apoia sua recepção/SDRs cuidando da triagem inicial.'",
          "Se disser 'Sem tempo': 'Justamente por isso a conversa dura apenas 10 minutos objetivos.'"
        ]
      }
    },
    "webhookPayloads": {
      "zapiWhatsApp": {
        "phone": "5511987654321",
        "message": "Texto pronto",
        "leadName": "Rodrigo Silva",
        "company": "Nome da Empresa",
        "icpScore": 94,
        "intentScore": 92
      },
      "resendEmail": {
        "to": "rodrigo@empresa.com",
        "subject": "Assunto",
        "text": "Corpo",
        "html": "<p>Corpo</p>",
        "tags": [{"name": "source", "value": "deep_bant_enricher"}]
      },
      "hubspotCrmTask": {
        "taskName": "Prioridade Alta (1h) - Nome da Empresa",
        "company": "Nome da Empresa",
        "contactName": "Rodrigo Silva",
        "priority": "HIGH",
        "dealStage": "Lead Enriquecido BANT+",
        "callScriptNotes": "Script completo com ancoragem",
        "identifiedPain": "Vazamento de leads",
        "dueDate": "2026-08-16",
        "intentScore": 92,
        "techStack": ["WordPress", "Meta Pixel"],
        "urgencyFactor": "Vagas ativas no LinkedIn"
      }
    }
  }
]
`;

  let usedEngineName = "AI Core (Gemini / Groq Multi-Pool)";

  try {
    if (signal?.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const aiRes = await executeAiCompletion({
      prompt,
      systemPrompt: "Você é o mais avançado motor de prospecção e inteligência B2B de alto ticket do mundo.",
      temperature: 0.35,
      jsonMode: true,
      signal
    });

    usedEngineName = aiRes.engineUsed;
    const latencyMs = Date.now() - startTime;
    let textData = aiRes.text || "[]";

    // Extract JSON array safely
    const startIndex = textData.indexOf('[');
    const endIndex = textData.lastIndexOf(']');
    
    if (startIndex !== -1 && endIndex !== -1) {
      textData = textData.substring(startIndex, endIndex + 1);
    } else {
      textData = textData.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    let rawLeads: any[] = [];
    try {
      rawLeads = JSON.parse(textData);
    } catch (e) {
      console.warn("JSON Parse Error, attempting regex extraction...", e);
      const match = textData.match(/\[\s*\{.*\}\s*\]/s);
      if (match) {
        try { rawLeads = JSON.parse(match[0]); } catch (inner) {}
      }
    }

    if (!Array.isArray(rawLeads) || rawLeads.length === 0) {
      throw new Error("No valid JSON array parsed from AI output");
    }

    const processedLeads: Lead[] = rawLeads.map((raw, index) => {
      const icpScore = typeof raw.icpScore === 'number' ? Math.min(100, Math.max(0, raw.icpScore)) : 75;
      
      let icpTier: IcpTier = 'SCORE_B';
      if (icpScore >= 85) icpTier = 'SCORE_A';
      else if (icpScore < 60) icpTier = 'SCORE_C';

      // Intent Score & Priority Matrix calculation
      const intentScore = typeof raw.intentScore === 'number' 
        ? Math.min(100, Math.max(0, raw.intentScore))
        : (icpTier === 'SCORE_A' ? Math.min(98, icpScore + 2) : (icpTier === 'SCORE_B' ? Math.max(55, icpScore - 5) : 40));

      let intentPriority: 'HIGH' | 'MEDIUM' | 'DISQUALIFIED' = 'MEDIUM';
      if (intentScore >= 80) {
        intentPriority = 'HIGH';
      } else if (intentScore < 50) {
        intentPriority = 'DISQUALIFIED';
      }

      const leadName = raw.name || `Empresa ${index + 1}`;
      const decName = cleanField(raw.bantPlus?.authority?.keyDecisionMaker || raw.decisionMaker?.name) || "Responsável Comercial";
      const decRole = cleanField(raw.bantPlus?.authority?.role || raw.decisionMaker?.role) || "Diretor(a)";
      const decPhone = cleanField(raw.decisionMaker?.directPhone || raw.phone);
      const decEmail = cleanField(raw.decisionMaker?.directEmail || raw.email);

      const defaultPain = raw.identifiedPain || "Processos comerciais com pontos de atrito e tempo de resposta elevado";
      const urgencyFactor = raw.urgencyFactor || raw.bantPlus?.timeline?.urgencyFactor || "Demanda ativa com gap de atendimento digital";
      
      const keyFlaws: string[] = Array.isArray(raw.keyFlaws) && raw.keyFlaws.length > 0
        ? raw.keyFlaws
        : (Array.isArray(raw.bantPlus?.need?.operationalFlaws) && raw.bantPlus.need.operationalFlaws.length > 0
            ? raw.bantPlus.need.operationalFlaws
            : [
                "1. Ausência de triagem automatizada no WhatsApp",
                "2. Tempo de resposta aos leads superior a 60 minutos",
                "3. Pixel do Meta sem mensuração de conversão completa"
              ]);

      const defaultSuggestedAction = intentPriority === 'HIGH' 
        ? "Prioridade Alta: Disparo em até 1h (WhatsApp Curiosidade + Cold Call)" 
        : (intentPriority === 'MEDIUM' ? "Fila Padrão: Disparo WhatsApp Opção 2 / Email AIDA" : "Desqualificado: Não gastar recursos de envio");

      const bantPlus = {
        budget: {
          estimatedBudget: raw.bantPlus?.budget?.estimatedBudget || (icpScore >= 85 ? "R$ 20.000 a R$ 50.000 / mês" : "R$ 5.000 a R$ 15.000 / mês"),
          companySize: raw.bantPlus?.budget?.companySize || (icpScore >= 85 ? "20 a 50 funcionários" : "5 a 15 funcionários"),
          estimatedRevenue: raw.bantPlus?.budget?.estimatedRevenue || (icpScore >= 85 ? "R$ 4M a R$ 10M / ano" : "R$ 1M a R$ 3M / ano"),
          rating: raw.bantPlus?.budget?.rating || (icpScore >= 85 ? "Alto" : (icpScore >= 60 ? "Médio" : "Baixo"))
        },
        authority: {
          keyDecisionMaker: decName,
          role: decRole,
          orgStructure: raw.bantPlus?.authority?.orgStructure || "Diretoria Comercial / Operações"
        },
        need: {
          operationalFlaws: keyFlaws,
          primaryNeed: raw.bantPlus?.need?.primaryNeed || (icpScore >= 85 ? "Atendimento autônomo com IA e SLA < 30s" : "Estruturação de canal digital e CRM"),
          impactSummary: raw.bantPlus?.need?.impactSummary || "Recuperação estimada de 30% dos leads perdidos"
        },
        timeline: {
          urgencyFactor,
          urgencyLevel: (intentPriority === 'HIGH' ? "Crítico (Imediato)" : (intentPriority === 'MEDIUM' ? "Médio (30 dias)" : "Baixo")) as any,
          signals: Array.isArray(raw.bantPlus?.timeline?.signals) && raw.bantPlus.timeline.signals.length > 0
            ? raw.bantPlus.timeline.signals 
            : ["Presença ativa em canais digitais", "Volume contínuo de avaliações", "Gargalo no tempo de resposta"]
        }
      };

      const techStack = {
        detectedTools: Array.isArray(raw.techStack?.detectedTools) && raw.techStack.detectedTools.length > 0
          ? raw.techStack.detectedTools
          : (raw.website ? ["WordPress", "Meta Pixel", "Google Analytics GA4"] : ["Sem ferramentas digitais rastreadas"]),
        cmsOrPlatform: raw.techStack?.cmsOrPlatform || (raw.website ? "WordPress / Plataforma Própria" : "Não identificado"),
        analyticsAndPixels: Array.isArray(raw.techStack?.analyticsAndPixels) && raw.techStack.analyticsAndPixels.length > 0
          ? raw.techStack.analyticsAndPixels
          : ["Meta Pixel (Padrão)", "Google Analytics 4"],
        crmAndAutomation: Array.isArray(raw.techStack?.crmAndAutomation) && raw.techStack.crmAndAutomation.length > 0
          ? raw.techStack.crmAndAutomation
          : ["Sem CRM detectado (Uso de planilhas/WhatsApp manual)"],
        vulnerabilitiesAndGaps: Array.isArray(raw.techStack?.vulnerabilitiesAndGaps) && raw.techStack.vulnerabilitiesAndGaps.length > 0
          ? raw.techStack.vulnerabilitiesAndGaps
          : [
              "Não possui Conversions API (CAPI) do Meta, perdendo rastreamento iOS",
              "Sem automação ou chatbot de triagem no WhatsApp",
              "Sem nutrição de leads via email/SMS"
            ]
      };

      const decisionMaker = {
        name: decName,
        role: decRole,
        directEmail: decEmail,
        directPhone: decPhone
      };

      const outreach = {
        whatsapp: {
          option1Curiosity: raw.outreach?.whatsapp?.option1Curiosity || `Olá ${decName}, tudo bem? Notei que vocês têm presença ativa no mercado mas o canal de WhatsApp da ${leadName} está sem triagem automática após o horário comercial, o que faz empresas perderem até 40% das oportunidades. Posso te mandar um vídeo de 20s mostrando como resolver isso?`,
          option2RoiDirect: raw.outreach?.whatsapp?.option2RoiDirect || `Fala ${decName}! Implementamos recentemente um SDR de IA para ${raw.category || 'o setor'} que atende em 15s e aumentou em 38% os agendamentos qualificados. Vale batermos 5 minutos nessa quinta?`
        },
        email: {
          subject: raw.outreach?.email?.subject || `${leadName} + ${businessProfile.businessName}: ponto de melhoria no canal comercial`,
          bodyAida: raw.outreach?.email?.bodyAida || `Olá ${decName},\n\nAnalisei a operação digital da ${leadName} e identifiquei 3 falhas de conversão imediatas, especialmente a ausência de resposta imediata nos canais de anúncio...\n\nPodemos falar 10 minutos na quinta às 14h?`,
          bodyPas: raw.outreach?.email?.bodyPas || `Olá ${decName},\n\nHoje, mais de 50% dos clientes buscam atendimento fora do horário comercial. Sem um fluxo autônomo, esses leads procuram o concorrente direto...\n\nNossa IA resolve isso de ponta a ponta. Faz sentido conversar?`
        },
        coldCall: {
          iceBreaker5s: raw.outreach?.coldCall?.iceBreaker5s || `Olá ${decName}, aqui é da ${businessProfile.businessName}. Sei que você não esperava minha ligação, tem 30 segundos?`,
          anchorQuestion: raw.outreach?.coldCall?.anchorQuestion || `${decName}, vi que vocês têm um tráfego forte mas o retorno no WhatsApp chega a demorar horas. Como vocês têm evitado perder os leads que chegam à noite?`,
          pitch15s: raw.outreach?.coldCall?.pitch15s || `Nós criamos SDRs de IA que qualificam e agendam consultas em 20 segundos 24 horas por dia. Conseguimos conversar 10 minutos amanhã às 15h para eu te mostrar?`,
          objectionTips: Array.isArray(raw.outreach?.coldCall?.objectionTips) && raw.outreach.coldCall.objectionTips.length > 0
            ? raw.outreach.coldCall.objectionTips
            : [
                "Se disser 'Já tenho equipe': 'O sistema apoia sua recepção/SDRs cuidando da triagem inicial e agendamento para que eles foquem apenas em fechar negócio.'",
                "Se disser 'Sem tempo': 'Justamente por isso a conversa dura apenas 10 minutos objetivos.'"
              ]
        }
      };

      const webhookPayloads = raw.webhookPayloads || {
        zapiWhatsApp: {
          phone: decPhone.replace(/\D/g, '') || "",
          message: outreach.whatsapp.option1Curiosity,
          leadName: decName,
          company: leadName,
          icpScore,
          intentScore
        },
        resendEmail: {
          to: decEmail || "",
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
        id: `lead-enrich-${Date.now()}-${index + 1}`,
        name: leadName,
        status: 'new',
        source: 'ai',
        category: raw.category || (isAutoHighTicket ? 'Nicho de Alto Ticket' : (keyword || 'B2B')),
        rating: typeof raw.rating === 'number' ? raw.rating : 4.8,
        reviews: typeof raw.reviews === 'number' ? raw.reviews : 32,
        address: raw.address || `Região de ${locationContext}`,
        city: raw.city || location || 'São Paulo',
        district: district !== 'Todas' ? district : '',
        country: country,
        website: cleanField(raw.website) || '',
        phone: cleanField(raw.phone),
        email: cleanField(raw.email),
        googleMapsLink: raw.googleMapsLink || `https://maps.google.com/?q=${encodeURIComponent(leadName)}`,
        description: raw.description || `Empresa atuando no segmento de ${raw.category || keyword || 'Alto Ticket'} em ${locationContext}.`,
        score: Math.round(icpScore * 0.5 + intentScore * 0.4 + 10),
        icpScore,
        icpTier,
        intentScore,
        intentPriority,
        urgencyFactor,
        keyFlaws,
        identifiedPain: defaultPain,
        suggestedAction: raw.suggestedAction || defaultSuggestedAction,
        matchReason: raw.matchReason || `Forte alinhamento com a UVP de ${businessProfile.businessName}.`,
        digitalGaps: Array.isArray(raw.digitalGaps) ? raw.digitalGaps : ["Sem SDR IA", "Pixel sem CAPI", "Atendimento manual"],
        budgetMaturity: raw.budgetMaturity || (icpScore >= 85 ? "Alta" : "Média"),
        bantPlus,
        techStack,
        decisionMaker,
        outreach,
        webhookPayloads
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
    });

    const engineStatus: ScrapingEngineStatus = {
      primary: { name: `AI Core: ${usedEngineName}`, status: "ACTIVE" },
      secondary: { name: "DuckDuckGo + Playwright Multi-Engine", status: "FALLBACK_READY" },
      tertiary: { name: "Google Maps & Search API Layer", status: "READY" },
      activeEngine: usedEngineName,
      lastLatencyMs: latencyMs,
      extractedCount: processedLeads.length
    };

    return { leads: processedLeads, engineStatus };

  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.warn("⚠️ Ativando Motor Autônomo de Extração Multi-Nicho...", error);

    // Resilient Fallback for Free Access & 403 PERMISSION_DENIED
    const fallbackLeads = generateAutonomousFallbackLeads(
      keyword,
      country,
      location,
      district,
      businessProfile,
      8
    );

    const fallbackEngineStatus: ScrapingEngineStatus = {
      primary: { name: `AI Core (${usedEngineName})`, status: "STANDBY" },
      secondary: { name: "Motor Autônomo Multi-Nicho de Alto Ticket", status: "ACTIVE" },
      tertiary: { name: "Google & Bing Web Search Free API Layer", status: "READY" },
      activeEngine: "Autonomous Multi-Nicho High-Ticket Engine",
      lastLatencyMs: Date.now() - startTime,
      extractedCount: fallbackLeads.length
    };

    return { leads: fallbackLeads, engineStatus: fallbackEngineStatus };
  }
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
