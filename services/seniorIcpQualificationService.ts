import { 
  Lead, 
  BusinessProfile, 
  SeniorIcpQualification, 
  BusinessTypeCategory, 
  CommercialDecision, 
  IcpCriterionScore,
  SdrTrainingGuide 
} from "../types";
import { executeAiCompletion } from "./aiProviderService";
import { getCustomPrompts } from "./promptConfigService";
import { DEFAULT_ICP_CLASSIFICATION_PROMPT } from "../constants";

/**
 * Avalia e qualifica o lead utilizando a Matriz Sênior de Inteligência Comercial (0 a 100 pontos).
 */
export async function classifyLeadWithSeniorIcpPrompt(
  lead: Lead,
  businessProfile?: BusinessProfile,
  signal?: AbortSignal
): Promise<SeniorIcpQualification> {
  const customPrompts = getCustomPrompts();
  const systemPromptTemplate = customPrompts.icpClassificationPrompt || DEFAULT_ICP_CLASSIFICATION_PROMPT;
  
  // Interpola o nome da empresa
  const basePrompt = systemPromptTemplate.replace(/\[NOME DA EMPRESA\]/g, lead.name);

  const contextData = `
========================================
DADOS COLETADOS DA EMPRESA ALVO:
========================================
- Nome da Empresa: ${lead.name}
- Categoria / Nicho: ${lead.category || "Não especificado"}
- Localização: ${lead.address || lead.city || "Não especificado"} (Cidade: ${lead.city || ""}, País: ${lead.country || "Brasil"})
- Website: ${lead.website || "Nenhum website informado"}
- Telefone / WhatsApp: ${lead.phone || lead.decisionMaker?.directPhone || "Nenhum telefone informado"}
- E-mail: ${lead.email || lead.decisionMaker?.email || "Nenhum e-mail informado"}
- Avaliação Google Maps: ${lead.rating ? `${lead.rating} estrelas (${lead.reviews} avaliações)` : "Não avaliado"}
- Redes Sociais Mapeadas: ${lead.socials ? JSON.stringify(lead.socials) : "Nenhuma rede social confirmada"}
- Decisor Mapeado: ${lead.decisionMaker?.name ? `${lead.decisionMaker.name} (${lead.decisionMaker.role})` : "Decisor não identificado"}
- Dados Fiscais / CNPJ: ${lead.fiscalRegistry?.cnpj ? `CNPJ ${lead.fiscalRegistry.cnpj}, Razão Social: ${lead.fiscalRegistry.razaoSocial}, Situação: ${lead.fiscalRegistry.status}, Capital Social: ${lead.fiscalRegistry.capitalSocial}` : "Sem dados fiscais adicionais"}
- Dores & Gaps Mapeados: ${lead.identifiedPain || (lead.digitalGaps && lead.digitalGaps.join(", ")) || "Não especificado"}
- Tecnologias / Tech Stack: ${lead.techStack?.detectedTools?.join(", ") || "Não mapeada"}
- Empresa que está prospectando (Nosso Negócio): ${businessProfile ? `Nome: ${businessProfile.businessName}, Serviços: ${businessProfile.servicesDescription}, UVP: ${businessProfile.uvp}` : "Consultoria de Soluções e Expansão Comercial B2B"}
========================================

INSTRUÇÕES ADICIONAIS OBRIGATÓRIAS:
1. Responda em Português gerando o relatório estritamente no formato Markdown solicitado nas seções 1, 2 e 3 do prompt (incluindo o RESUMO DA QUALIFICAÇÃO ICP, DETALHAMENTO DA PONTUAÇÃO e GUIA RÁPIDO DE ABORDAGEM).
2. Ao final da sua resposta, adicione OBRIGATORIAMENTE um bloco de código JSON com a chave delimitadora \`\`\`json contendo a representação estruturada exata dos dados:
\`\`\`json
{
  "companyName": "${lead.name}",
  "businessType": "Fabricante/Indústria" | "Distribuidor" | "Revendedor/Lojista" | "Prestador de Serviço",
  "finalScore": 0 a 100,
  "commercialDecision": "LIGAR AGORA" | "AGUARDAR" | "DESCARTAR",
  "isPenalizedBySafetyRule": true | false,
  "penalizationReason": "Motivo se a trava de 50 pts foi acionada ou vazio",
  "criteria": [
    { "criterionKey": "manufacturer", "criterion": "Fabricante Confirmado", "score": 0 a 15, "maxScore": 15, "justification": "...", "evidence": "..." },
    { "criterionKey": "size", "criterion": "Porte Compatível", "score": 0 a 15, "maxScore": 15, "justification": "...", "evidence": "..." },
    { "criterionKey": "segment", "criterion": "Segmento/Potencial", "score": 0 a 10, "maxScore": 10, "justification": "...", "evidence": "..." },
    { "criterionKey": "website", "criterion": "Qualidade do Site", "score": 0 a 15, "maxScore": 15, "justification": "...", "evidence": "..." },
    { "criterionKey": "socials", "criterion": "Redes Sociais", "score": 0 a 10, "maxScore": 10, "justification": "...", "evidence": "..." },
    { "criterionKey": "pain", "criterion": "Sinais de Necessidade", "score": 0 a 15, "maxScore": 15, "justification": "...", "evidence": "..." },
    { "criterionKey": "contact", "criterion": "Facilidade de Contato", "score": 0 a 10, "maxScore": 10, "justification": "...", "evidence": "..." },
    { "criterionKey": "location", "criterion": "Localização/Dados", "score": 0 a 10, "maxScore": 10, "justification": "...", "evidence": "..." }
  ],
  "analystVerdict": "Parágrafo curto explicando a viabilidade da chamada agora.",
  "sdrTrainingGuide": {
    "openingHook": "Frase de abertura personalizada citando a empresa e a dor identificada",
    "verdictWhyCall": "Por que ligar agora",
    "suggestedNextStep": "Próximo passo sugerido (ex: Ligar e oferecer diagnóstico de 5 min)",
    "pitchTopics": [
      "Tópico 1: Dor principal identificada no atendimento/canais",
      "Tópico 2: Ganho quantificável imediato",
      "Tópico 3: Pergunta de fechamento para diagnóstico de 5 minutos"
    ],
    "objections": [
      {
        "objection": "Já temos equipe/recepção cuidando disso",
        "howToOvercome": "Perfeito, a maioria dos nossos clientes também tinha! O problema é que a equipe perde até 30% do tempo confirmando dados via WhatsApp. Nós automatizamos essa confirmação."
      },
      {
        "objection": "Não temos orçamento agora",
        "howToOvercome": "Entendo perfeitamente. Por isso mesmo nosso diagnóstico de 5 minutos mostra como recuperar oportunidades perdidas sem custo inicial."
      }
    ]
  }
}
\`\`\`
`;

  try {
    const aiResponse = await executeAiCompletion(
      contextData,
      basePrompt,
      0.25, // Temperatura baixa para consistência analítica rigorosa
      signal
    );

    const rawText = aiResponse.text.trim();
    const parsedResult = parseAiQualificationOutput(rawText, lead);
    return parsedResult;
  } catch (err) {
    console.warn("Erro ou timeout na execução da IA para Matriz ICP Sênior, utilizando avaliação heurística:", err);
    return generateHeuristicSeniorIcpQualification(lead, businessProfile);
  }
}

/**
 * Converte o texto retornado pelo LLM em um objeto estruturado SeniorIcpQualification
 */
function parseAiQualificationOutput(rawText: string, lead: Lead): SeniorIcpQualification {
  const nowIso = new Date().toISOString();

  // Tenta extrair o bloco JSON
  let extractedJson: any = null;
  try {
    if (rawText.includes("```json")) {
      const jsonStr = rawText.split("```json")[1].split("```")[0].trim();
      extractedJson = JSON.parse(jsonStr);
    } else if (rawText.includes("```")) {
      const parts = rawText.split("```");
      for (let i = 1; i < parts.length; i += 2) {
        try {
          const attempt = JSON.parse(parts[i].trim());
          if (attempt && attempt.finalScore !== undefined) {
            extractedJson = attempt;
            break;
          }
        } catch {
          // continua
        }
      }
    }
  } catch (e) {
    console.warn("Não foi possível parsear bloco JSON direto da resposta:", e);
  }

  if (extractedJson && typeof extractedJson.finalScore === 'number') {
    // Normaliza os valores
    const finalScore = Math.min(100, Math.max(0, extractedJson.finalScore));
    let commercialDecision: CommercialDecision = 'AGUARDAR';
    const decStr = (extractedJson.commercialDecision || '').toUpperCase();
    if (decStr.includes('LIGAR') || finalScore >= 75) {
      commercialDecision = 'LIGAR AGORA';
    } else if (decStr.includes('DESCARTAR') || finalScore < 50) {
      commercialDecision = 'DESCARTAR';
    }

    let bType: BusinessTypeCategory = 'Fabricante/Indústria';
    const rawBType = (extractedJson.businessType || '').toLowerCase();
    if (rawBType.includes('distribuidor')) bType = 'Distribuidor';
    else if (rawBType.includes('revendedor') || rawBType.includes('lojista') || rawBType.includes('varejo')) bType = 'Revendedor/Lojista';
    else if (rawBType.includes('prestador') || rawBType.includes('serviço')) bType = 'Prestador de Serviço';

    const criteriaList: IcpCriterionScore[] = Array.isArray(extractedJson.criteria) && extractedJson.criteria.length >= 8
      ? extractedJson.criteria
      : generateDefaultCriteriaList(lead);

    const sdrGuide: SdrTrainingGuide = extractedJson.sdrTrainingGuide || parseSdrGuideFromMarkdown(rawText, lead);

    return {
      companyName: lead.name,
      businessType: bType,
      finalScore,
      commercialDecision,
      isPenalizedBySafetyRule: extractedJson.isPenalizedBySafetyRule || (finalScore <= 50 && (rawBType.includes('revendedor') || !lead.website)),
      penalizationReason: extractedJson.penalizationReason || (finalScore <= 50 ? "Trava de segurança ativada: perfil incompatível ou ausência de canais modernos de conversão." : ""),
      criteria: criteriaList,
      analystVerdict: extractedJson.analystVerdict || sdrGuide.verdictWhyCall || "Avaliação de inteligência comercial concluída.",
      sdrTrainingGuide: sdrGuide,
      rawMarkdownReport: rawText,
      evaluatedAt: nowIso
    };
  }

  // Fallback: Parse Regex do Markdown puro
  return parseMarkdownFallback(rawText, lead, nowIso);
}

/**
 * Parser de fallback baseado no texto markdown caso o JSON tenha falhado
 */
function parseMarkdownFallback(text: string, lead: Lead, nowIso: string): SeniorIcpQualification {
  let score = 70;
  const scoreMatch = text.match(/(?:Score ICP|SCORE FINAL).*?(\d+)\s*\/\s*100/i);
  if (scoreMatch) {
    score = parseInt(scoreMatch[1], 10);
  }

  let decision: CommercialDecision = score >= 75 ? 'LIGAR AGORA' : score >= 50 ? 'AGUARDAR' : 'DESCARTAR';
  if (/Decisão.*?LIGAR AGORA/i.test(text)) decision = 'LIGAR AGORA';
  else if (/Decisão.*?DESCARTAR/i.test(text)) decision = 'DESCARTAR';
  else if (/Decisão.*?AGUARDAR/i.test(text)) decision = 'AGUARDAR';

  let businessType: BusinessTypeCategory = 'Fabricante/Indústria';
  if (/(?:Tipo|Tipo de Negócio).*?(Distribuidor)/i.test(text)) businessType = 'Distribuidor';
  else if (/(?:Tipo|Tipo de Negócio).*?(Revendedor|Lojista)/i.test(text)) businessType = 'Revendedor/Lojista';
  else if (/(?:Tipo|Tipo de Negócio).*?(Prestador)/i.test(text)) businessType = 'Prestador de Serviço';

  const sdrGuide = parseSdrGuideFromMarkdown(text, lead);

  return {
    companyName: lead.name,
    businessType,
    finalScore: score,
    commercialDecision: decision,
    isPenalizedBySafetyRule: score <= 50,
    penalizationReason: score <= 50 ? "Penalizado por regra de segurança do ICP." : "",
    criteria: generateDefaultCriteriaList(lead),
    analystVerdict: sdrGuide.verdictWhyCall,
    sdrTrainingGuide: sdrGuide,
    rawMarkdownReport: text,
    evaluatedAt: nowIso
  };
}

/**
 * Extrai o Guia Rápido de Abordagem SDR e a Matriz de Objeções a partir do texto markdown
 */
function parseSdrGuideFromMarkdown(text: string, lead: Lead): SdrTrainingGuide {
  let hook = `Vi que o perfil da ${lead.name} possui forte atuação comercial, mas identifiquei pontos de otimização no fluxo digital.`;
  const hookMatch = text.match(/Gancho Principal.*?:?\s*([^\n\r*]+)/i);
  if (hookMatch && hookMatch[1].trim()) {
    hook = hookMatch[1].trim();
  }

  let verdict = "Vale a pena o contato direto para validar os gaps operacionais e apresentar soluções de automação.";
  const verdictMatch = text.match(/Parecer Final.*?:?\s*([^\n\r*]+)/i);
  if (verdictMatch && verdictMatch[1].trim()) {
    verdict = verdictMatch[1].trim();
  }

  let nextStep = "Ligar no canal direto e propor um diagnóstico de 5 minutos.";
  const nextStepMatch = text.match(/Próximo Passo Sugerido.*?:?\s*([^\n\r*]+)/i);
  if (nextStepMatch && nextStepMatch[1].trim()) {
    nextStep = nextStepMatch[1].trim();
  }

  // Extrai Tópicos de Pitch
  const pitchTopics: string[] = [
    `Dor Primária: ${lead.identifiedPain || 'Falta de automação e canais modernos de conversão'}`,
    `Ganho Imediato: Recuperação de até 30% do tempo da equipe e aumento nas conversões`,
    `Pergunta de Fechamento: Diagnóstico rápido de 5 minutos sem custo`
  ];

  // Extrai as 2 Objeções Rápidas
  const objections: IcpObjectionPair[] = [];
  const obj1Match = text.match(/Objeção Provável 1:?\s*\*?\*?\s*([^\n\r]+)/i);
  const contorn1Match = text.match(/Como Contornar:?\s*\*?\*?\s*([^\n\r]+)/i);
  if (obj1Match && contorn1Match) {
    objections.push({
      objection: obj1Match[1].replace(/^[\["]+|[\]"]+$/g, '').trim(),
      howToOvercome: contorn1Match[1].replace(/^[\["]+|[\]"]+$/g, '').trim()
    });
  }

  const obj2Match = text.match(/Objeção Provável 2:?\s*\*?\*?\s*([^\n\r]+)/i);
  // Match do segundo "Como Contornar"
  const allContornar = [...text.matchAll(/Como Contornar:?\s*\*?\*?\s*([^\n\r]+)/gi)];
  if (obj2Match && allContornar.length >= 2) {
    objections.push({
      objection: obj2Match[1].replace(/^[\["]+|[\]"]+$/g, '').trim(),
      howToOvercome: allContornar[1][1].replace(/^[\["]+|[\]"]+$/g, '').trim()
    });
  }

  // Se não extraiu via regex, usa matriz padrão contextualizada
  if (objections.length === 0) {
    objections.push(
      {
        objection: "Já temos agendamento via recepção / atendimento manual",
        howToOvercome: "Perfeito, a maioria dos nossos clientes também tinha! O problema é que a recepção perde até 30% do tempo confirmando dados via WhatsApp. Nós automatizamos essa confirmação."
      },
      {
        objection: "Não temos orçamento ou tempo agora",
        howToOvercome: "Entendo perfeitamente. Por isso mesmo nosso diagnóstico de 5 minutos mostra como recuperar até 5 oportunidades perdidas por semana sem custo inicial."
      }
    );
  }

  return {
    openingHook: hook,
    verdictWhyCall: verdict,
    suggestedNextStep: nextStep,
    pitchTopics,
    objections
  };
}

/**
 * Cria lista padrão dos 8 critérios da matriz com base nos dados do lead
 */
function generateDefaultCriteriaList(lead: Lead): IcpCriterionScore[] {
  const cat = (lead.category || '').toLowerCase();
  const isMfg = cat.includes('indústria') || cat.includes('fabric') || cat.includes('metalúrgica') || cat.includes('manufatura') || cat.includes('distribuidora');
  const hasWeb = !!lead.website;
  const hasPhone = !!lead.phone || !!lead.decisionMaker?.directPhone;
  const hasSocials = !!lead.socials?.instagram || !!lead.socials?.linkedin;
  const hasReviews = (lead.reviews || 0) > 10;

  return [
    {
      criterionKey: 'manufacturer',
      criterion: 'Fabricante Confirmado',
      maxScore: 15,
      score: isMfg ? 15 : 8,
      justification: isMfg ? "Atividade primária compatível com produção e distribuição em escala." : "Perfil comercial misto ou atuação intermediária.",
      evidence: lead.category || "Segmento comercial"
    },
    {
      criterionKey: 'size',
      criterion: 'Porte Compatível',
      maxScore: 15,
      score: hasReviews ? 13 : 9,
      justification: hasReviews ? `Presença operacional consolidada (${lead.reviews} avaliações registradas).` : "Porte operacional de médio ou pequeno alcance.",
      evidence: `${lead.reviews || 0} avaliações / Google Maps`
    },
    {
      criterionKey: 'segment',
      criterion: 'Segmento/Potencial',
      maxScore: 10,
      score: 9,
      justification: "Nicho comercial com demanda ativa e margem para serviços B2B de alto ticket.",
      evidence: lead.category || "Mercado B2B"
    },
    {
      criterionKey: 'website',
      criterion: 'Qualidade do Site',
      maxScore: 15,
      score: hasWeb ? 12 : 2,
      justification: hasWeb ? "Site próprio ativo mapeado com domínio corporativo." : "Ausência de website institucional moderno mapeado.",
      evidence: lead.website || "Sem site"
    },
    {
      criterionKey: 'socials',
      criterion: 'Redes Sociais',
      maxScore: 10,
      score: hasSocials ? 8 : 4,
      justification: hasSocials ? "Perfis ativos identificados em canais sociais corporativos." : "Baixa presença institucional ou perfis desatualizados.",
      evidence: lead.socials?.instagram || lead.socials?.linkedin || "Não mapeado"
    },
    {
      criterionKey: 'pain',
      criterion: 'Sinais de Necessidade',
      maxScore: 15,
      score: lead.identifiedPain ? 14 : 10,
      justification: lead.identifiedPain || "Falta de automação no funil de atendimento e dependência de canais manuais.",
      evidence: lead.identifiedPain || "Diagnóstico de Gaps"
    },
    {
      criterionKey: 'contact',
      criterion: 'Facilidade de Contato',
      maxScore: 10,
      score: hasPhone ? 10 : 3,
      justification: hasPhone ? `Linha direta / WhatsApp acessível (${lead.phone || 'disponível'}).` : "Canais de contato direto limitados.",
      evidence: lead.phone || "Sem telefone direto"
    },
    {
      criterionKey: 'location',
      criterion: 'Localização/Dados',
      maxScore: 10,
      score: lead.address ? 10 : 7,
      justification: `Empresa com endereço físico ativo confirmado em ${lead.city || 'região atendida'}.`,
      evidence: lead.address || lead.city
    }
  ];
}

/**
 * Gera uma avaliação heurística imediata caso a IA esteja indisponível
 */
export function generateHeuristicSeniorIcpQualification(
  lead: Lead,
  businessProfile?: BusinessProfile
): SeniorIcpQualification {
  const criteria = generateDefaultCriteriaList(lead);
  const totalScore = criteria.reduce((sum, c) => sum + c.score, 0);

  // Aplica trava de segurança: se não tem site ou não tem telefone, pontuação é limitada a 50
  const hasCriticalData = !!lead.website && (!!lead.phone || !!lead.decisionMaker?.directPhone);
  const isPenalized = !hasCriticalData && totalScore > 50;
  const finalScore = isPenalized ? 48 : totalScore;

  let commercialDecision: CommercialDecision = 'AGUARDAR';
  if (finalScore >= 75) commercialDecision = 'LIGAR AGORA';
  else if (finalScore < 50) commercialDecision = 'DESCARTAR';

  const cat = (lead.category || '').toLowerCase();
  let businessType: BusinessTypeCategory = 'Fabricante/Indústria';
  if (cat.includes('distribuid')) businessType = 'Distribuidor';
  else if (cat.includes('loja') || cat.includes('varejo') || cat.includes('comércio')) businessType = 'Revendedor/Lojista';
  else if (cat.includes('serviço') || cat.includes('consultoria') || cat.includes('agência')) businessType = 'Prestador de Serviço';

  const nowIso = new Date().toISOString();

  const decisionEmoji = commercialDecision === 'LIGAR AGORA' ? '📞 LIGAR AGORA' : commercialDecision === 'AGUARDAR' ? '⏳ AGUARDAR' : '⛔ DESCARTAR';

  const defaultObjections: IcpObjectionPair[] = [
    {
      objection: "Já temos agendamento via recepção / equipe atual",
      howToOvercome: "Perfeito, a maioria dos nossos clientes também tinha! O problema é que a recepção perde até 30% do tempo confirmando dados via WhatsApp. Nós automatizamos essa confirmação."
    },
    {
      objection: "Não temos orçamento agora",
      howToOvercome: "Entendo perfeitamente. Por isso mesmo nosso diagnóstico de 5 minutos mostra como recuperar até 5 cadeiras vazias/oportunidades por semana sem custo inicial."
    }
  ];

  const defaultPitchTopics = [
    `Dor Central: ${lead.identifiedPain || 'Ausência de agendamento automático e retenção digital de clientes'}`,
    `Impacto Comprovado: Recuperação média de 25% a 35% de leads perdidos sem custo de equipe`,
    `Chamada para Ação: Teste de diagnóstico comparativo de 5 minutos`
  ];

  const sdrGuide: SdrTrainingGuide = {
    openingHook: lead.identifiedPain 
      ? `Vi que o site de ${lead.name} ainda apresenta ${lead.identifiedPain.toLowerCase()}, e preparamos uma solução direta.`
      : `Vi que a ${lead.name} tem grande volume em ${lead.city || 'sua região'}, mas ainda não possui agendamento digital no WhatsApp...`,
    verdictWhyCall: commercialDecision === 'LIGAR AGORA'
      ? `A empresa possui excelente aderência comercial (${finalScore}/100), canal direto confirmado e demanda clara por modernização comercial.`
      : commercialDecision === 'AGUARDAR'
      ? `Potencial interessante, mas recomenda-se mapear o decisor de compras antes da ligação fria.`
      : `Empresa abaixo do padrão de corte do ICP. Não priorizar chamada ativa neste momento.`,
    suggestedNextStep: commercialDecision === 'LIGAR AGORA'
      ? `Ligar no ${lead.phone || 'canal direto'} e oferecer um diagnóstico consultivo de 5 minutos.`
      : commercialDecision === 'AGUARDAR'
      ? `Nutrir via e-mail ou aguardar confirmação de decisor.`
      : `Arquivar ou colocar em régua passiva.`,
    pitchTopics: defaultPitchTopics,
    objections: defaultObjections
  };

  const markdown = `**RESUMO DA QUALIFICAÇÃO ICP**
* **Empresa:** ${lead.name}
* **Tipo:** ${businessType}
* **Score ICP:** ${finalScore} / 100
* **Decisão:** ${decisionEmoji}

---

### DETALHAMENTO DA PONTUAÇÃO
| Critério | Nota | Justificativa Analítica | Fonte/Evidência |
| :--- | :--- | :--- | :--- |
${criteria.map(c => `| ${c.criterion} | ${c.score}/${c.maxScore} | ${c.justification} | ${c.evidence} |`).join('\n')}

---

### GUIA RÁPIDO DE ABORDAGEM (TREINAMENTO SDR)
*Com base na análise, sintetize o caminho para o sucesso da ligação.*

* **Gancho Principal (Abertura):** ${sdrGuide.openingHook}
* **Parecer Final (Por que ligar):** ${sdrGuide.verdictWhyCall}
* **Próximo Passo Sugerido:** ${sdrGuide.suggestedNextStep}

---

### MATRIZ RÁPIDA DE OBJEÇÕES (TREINAMENTO SDR)
Identifique as 2 objeções mais prováveis que este lead específico fará e dê a resposta ideal:

1. **Objeção Provável 1:** "${defaultObjections[0].objection}"
   * **Como Contornar:** "${defaultObjections[0].howToOvercome}"

2. **Objeção Provável 2:** "${defaultObjections[1].objection}"
   * **Como Contornar:** "${defaultObjections[1].howToOvercome}"`;

  return {
    companyName: lead.name,
    businessType,
    finalScore,
    commercialDecision,
    isPenalizedBySafetyRule: isPenalized,
    penalizationReason: isPenalized ? "Trava de segurança: volume de dados insuficiente ou ausência de canais diretos de contato." : undefined,
    criteria,
    analystVerdict: sdrGuide.verdictWhyCall,
    sdrTrainingGuide: sdrGuide,
    rawMarkdownReport: markdown,
    evaluatedAt: nowIso
  };
}

/**
 * Formata um objeto SeniorIcpQualification para Markdown rigorosamente de acordo com o padrão do usuário
 */
export function formatSeniorIcpQualificationMarkdown(qualification: SeniorIcpQualification): string {
  if (qualification.rawMarkdownReport) return qualification.rawMarkdownReport;

  const decisionEmoji = qualification.commercialDecision === 'LIGAR AGORA' 
    ? '📞 LIGAR AGORA' 
    : qualification.commercialDecision === 'AGUARDAR' 
    ? '⏳ AGUARDAR' 
    : '⛔ DESCARTAR';

  const defaultObjs: IcpObjectionPair[] = qualification.sdrTrainingGuide?.objections || [
    {
      objection: "Já temos agendamento via recepção / processo atual",
      howToOvercome: "Perfeito, a maioria dos nossos clientes também tinha! O problema é que a equipe perde tempo em confirmações manuais. Nós automatizamos 100% disso."
    },
    {
      objection: "Não temos orçamento agora",
      howToOvercome: "Entendo perfeitamente. Por isso mesmo nosso diagnóstico de 5 minutos mostra como recuperar oportunidades perdidas sem custo inicial."
    }
  ];

  const sdrGuide = qualification.sdrTrainingGuide || {
    openingHook: `Vi o perfil da ${qualification.companyName} e identifiquei oportunidades no atendimento comercial.`,
    verdictWhyCall: qualification.analystVerdict,
    suggestedNextStep: "Ligar e oferecer diagnóstico de 5 minutos.",
    objections: defaultObjs
  };

  return `**RESUMO DA QUALIFICAÇÃO ICP**
* **Empresa:** ${qualification.companyName}
* **Tipo:** ${qualification.businessType}
* **Score ICP:** ${qualification.finalScore} / 100
* **Decisão:** ${decisionEmoji}

---

### DETALHAMENTO DA PONTUAÇÃO
| Critério | Nota | Justificativa Analítica | Fonte/Evidência |
| :--- | :--- | :--- | :--- |
${qualification.criteria.map(c => `| ${c.criterion} | ${c.score}/${c.maxScore} | ${c.justification} | ${c.evidence} |`).join('\n')}

---

### GUIA RÁPIDO DE ABORDAGEM (TREINAMENTO SDR)
*Com base na análise, sintetize o caminho para o sucesso da ligação.*

* **Gancho Principal (Abertura):** ${sdrGuide.openingHook}
* **Parecer Final (Por que ligar):** ${sdrGuide.verdictWhyCall}
* **Próximo Passo Sugerido:** ${sdrGuide.suggestedNextStep}

---

### MATRIZ RÁPIDA DE OBJEÇÕES (TREINAMENTO SDR)
Identifique as 2 objeções mais prováveis que este lead específico fará e dê a resposta ideal:

1. **Objeção Provável 1:** "${defaultObjs[0]?.objection || 'Já temos solução'}"
   * **Como Contornar:** "${defaultObjs[0]?.howToOvercome || 'Entendo perfeitamente...'}"

2. **Objeção Provável 2:** "${defaultObjs[1]?.objection || 'Sem orçamento'}"
   * **Como Contornar:** "${defaultObjs[1]?.howToOvercome || 'Nosso modelo é focado em retorno rápido...'}"`;
}

