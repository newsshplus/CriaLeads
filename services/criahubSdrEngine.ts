import { Lead, DecisionMaker } from "../types";
import { executeAiCompletion } from "./aiProviderService";
import { getSavedCountry, getCurrencyConfig } from "./countryService";

export interface CriahubDiagnosis {
  companyName: string;
  websiteUrl?: string;
  decisionMakerName: string;
  decisionMakerRole: string;
  city: string;
  districtOrNeighborhood: string;
  country: string;
  
  // Elogio Genuíno e Reconhecimento da Força Atual
  praiseAndReputation: {
    recognizedStrengths: string;
    localAuthorityRating: 'Referência Consolidada na Região' | 'Em Forte Crescimento' | 'Destaque no Segmento';
    marketRespectAnchor: string;
  };

  // Contexto Local & Mercado Regional
  localMarketContext: {
    cityOrDistrict: string;
    regionalDemandOpportunity: string;
    competitiveAdvantage: string;
  };

  // Plano de Alavancagem e Expansão (Sem custos elevados)
  expansionRoadmap: {
    actionItem1: string;
    actionItem2: string;
    actionItem3: string;
  };

  // Estimativa de Crescimento de Pipeline
  estimatedPipelineGrowth: string;

  // Resumo Executivo Consultivo de 10 Anos de Experiência
  executiveDiagnosisSummary: string;
  auditedAt: string;
}

export interface LiveQuickRebuttal {
  situation: string;
  sdrResponse: string;
}

export interface VideoPitchScript {
  title: string;
  durationSeconds: number;
  step1Hook0to10s: string;
  step2Opportunity10to30s: string;
  step3Solution30to45s: string;
  step4Cta45to60s: string;
  fullTranscript: string;
}

export interface CriahubOutreachScripts {
  // A. Mensagem para WhatsApp (Consultivo, Natural, Elogioso, Direto e Nativo do País)
  whatsapp: {
    hook: string; 
    bridge: string; 
    criahubSolution: string; 
    lowFrictionCta: string; 
    fullMessageText: string; 
    audioNoteScript?: string; // Roteiro de áudio de 30 segundos no WhatsApp
  };

  // B. Cold E-mail para o Decisor (Estrutura AIDA, PAS e Plain Text Direto)
  coldEmail: {
    subject: string;
    subjectOptions: string[];
    bodyAida: string;
    bodyPas: string;
    plainText: string;
  };

  // C. Abordagem no LinkedIn
  linkedin: {
    connectionNote: string; 
    followUpPitch: string; 
  };

  // D. Roteiro Rápido de Ligação ao Vivo (Master SDR 10 Anos - Respostas Imediatas)
  coldCall: {
    warmLocalIceBreaker: string; // Abertura calorosa falando do bairro/cidade e elogiando
    masterHookQuestion: string; // Pergunta de maestria sobre a liderança na região
    visionPitch30s: string; // Proposta de unir a autoridade deles com a técnica da CriaHub
    fastClosingMeeting: string; // Fechamento direto de agenda com 2 opções
    liveQuickRebuttals: LiveQuickRebuttal[]; // Respostas prontas para disparar na hora da ligação
  };

  // E. Vídeo Loom / Cold Video Pitch (Gravação de Tela de 60 Segundos)
  videoLoomPitch: VideoPitchScript;
}

export interface CriahubLeadAnalysis {
  leadId: string;
  diagnosis: CriahubDiagnosis;
  scripts: CriahubOutreachScripts;
  generatedWithAi: boolean;
}

/**
 * Retorna as saudações e gírias/expressões naturais baseadas no país
 */
export function getLocalizedSdrNuances(countryName: string): {
  greeting: string;
  informalGreeting: string;
  regionTerm: string;
  callOpening: string;
  signOff: string;
  culturePraise: string;
} {
  const c = countryName.toLowerCase();

  if (c.includes('portugal') || c.includes('pt')) {
    return {
      greeting: 'Viva',
      informalGreeting: 'Olá',
      regionTerm: 'distrito e concelho',
      callOpening: 'Viva, com os meus cumprimentos. Daqui fala da CriaHub Portugal. Estamos sediados cá no país há mais de 3 anos a colaborar diretamente com empresas no eixo Lisboa / Porto e estive a analisar o vosso posicionamento...',
      signOff: 'Com os melhores cumprimentos e votos de excelente trabalho',
      culturePraise: 'uma das operações com maior rigor técnico e reputação no concelho'
    };
  }

  if (c.includes('espanha') || c.includes('spain') || c.includes('méxico') || c.includes('chile') || c.includes('colômbia')) {
    return {
      greeting: 'Hola',
      informalGreeting: 'Un gusto saludarte',
      regionTerm: 'ciudad y zona',
      callOpening: 'Hola, un gusto saludarte. Te habla el consultor estratégico de CriaHub. Estuve analizando el excelente posicionamiento que han construido en la zona...',
      signOff: 'Un cordial saludo y muchos éxitos',
      culturePraise: 'un referente absoluto y respetado en el mercado local'
    };
  }

  if (c.includes('reino unido') || c.includes('uk') || c.includes('estados unidos') || c.includes('usa')) {
    return {
      greeting: 'Hi',
      informalGreeting: 'Hello',
      regionTerm: 'city and district',
      callOpening: 'Hi there, Senior Growth Consultant at CriaHub here. I have been following the outstanding reputation your company built in the area...',
      signOff: 'Best regards and continued success',
      culturePraise: 'one of the most trusted and solid authorities in the region'
    };
  }

  // Padrão Brasil (BR)
  return {
    greeting: 'Fala',
    informalGreeting: 'Olá',
    regionTerm: 'cidade e bairro',
    callOpening: 'Fala, tudo bem por aí? Aqui é o consultor de expansão da CriaHub. Estive acompanhando o trabalho de alto nível que vocês construíram aqui na região...',
    signOff: 'Um abraço e parabéns pelo trabalho impecável',
    culturePraise: 'uma das maiores referências e com melhor reputação da cidade'
  };
}

/**
 * Gera diagnóstico inteligente de expansão e posicionamento de autoridade
 */
export async function auditAndDiagnoseLeadForCriahub(
  lead: Lead,
  signal?: AbortSignal
): Promise<CriahubDiagnosis> {
  const targetCountry = lead.country || getSavedCountry();
  const currencySymbol = getCurrencyConfig(targetCountry).symbol;
  const decisionMakerName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || "Diretoria";
  const decisionMakerRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || "CEO / Sócio Fundador";
  const companyName = lead.name || "Empresa";
  const website = lead.website || "Sem website mapeado";
  const city = lead.city || "Principal";
  const districtOrNeighborhood = lead.address ? lead.address.split(',')[0] : (lead.city || "Região Central");
  const category = lead.category || "Serviços Especializados";

  const nuances = getLocalizedSdrNuances(targetCountry);

  const systemPrompt = `
Você é o "Master SDR & Senior Growth Consultant da CriaHub", um negociador executivo com mais de 10 anos de experiência internacional em vendas B2B consultivas de alto valor.

SEUS PRINCÍPIOS FUNDAMENTAIS INEGOCIÁVEIS:
1. VOCÊ NUNCA É CRÍTICO OU ARROGANTE: Não diga "seu site é lento", "você não tem chatbot", "sua presença digital é fraca".
2. ELOGIE E VALIDE A AUTORIDADE ATUAL: Reconheça a excelência, reputação e trabalho sério que a empresa já construiu na sua cidade e bairro.
3. VISÃO DE ALAVANCAGEM: Mostre como unir a solidez e os anos de experiência da empresa do lead com a infraestrutura de captação da CriaHub para torná-la a MAIOR REFERÊNCIA INCONTESTÁVEL da cidade/distrito.
4. SEM CUSTOS ELEVADOS: Tudo é feito através de engenharia precisa, sem gastos desnecessários.
5. LINGUAGEM 100% NATIVA: Use as expressões, gírias e tom corporativo autêntico do país (${targetCountry}).
`;

  const prompt = `
DADOS DA EMPRESA:
- Empresa: ${companyName}
- Nicho/Setor: ${category}
- Decisor: ${decisionMakerName} (${decisionMakerRole})
- Cidade: ${city}
- Bairro/Distrito: ${districtOrNeighborhood}
- País: ${targetCountry}
- Moeda: ${currencySymbol}
- Website: ${website}

Gere o diagnóstico consultivo em JSON rigorosamente neste formato:
{
  "praiseAndReputation": {
    "recognizedStrengths": "Forte autoridade no setor de ${category}, excelente histórico de entregas e posicionamento de destaque em ${city}.",
    "localAuthorityRating": "Referência Consolidada na Região",
    "marketRespectAnchor": "Uma das marcas mais respeitadas de ${category} em ${city} e arredores."
  },
  "localMarketContext": {
    "cityOrDistrict": "${city} (${districtOrNeighborhood})",
    "regionalDemandOpportunity": "Grande volume de clientes de alto ticket procurando por ${category} na região de ${city}, prontos para fechar com a principal autoridade local.",
    "competitiveAdvantage": "A união da qualidade técnica comprovada da ${companyName} com um funil de agendamento automático."
  },
  "expansionRoadmap": {
    "actionItem1": "Canal de Atendimento Imediato: Receber o lead interessado em segundos e direcionar para conversa consultiva de alto valor.",
    "actionItem2": "Dominância Local no Bairro e Cidade: Posicionar a ${companyName} como a escolha óbvia sobre qualquer concorrente da região.",
    "actionItem3": "Filtro de Qualificação de Alto Ticket: Garantir que a diretoria só fale com prospects prontos para fechar contratos lucrativos."
  },
  "estimatedPipelineGrowth": "+${currencySymbol} 15.000 a ${currencySymbol} 60.000 / mês em novos contratos alavancados",
  "executiveDiagnosisSummary": "A ${companyName} já é uma das maiores referências de ${category} em ${city}. Com ajustes cirúrgicos no funil de captação e resposta imediata da CriaHub, tem todas as condições de monopolizar a demanda de alto valor da região sem custos pesados."
}
`;

  try {
    const aiResult = await executeAiCompletion({
      prompt,
      systemPrompt,
      temperature: 0.25,
      jsonMode: true,
      signal
    });

    let raw = aiResult.text.trim();
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s !== -1 && e !== -1) raw = raw.substring(s, e + 1);

    const parsed = JSON.parse(raw);

    return {
      companyName,
      websiteUrl: lead.website,
      decisionMakerName,
      decisionMakerRole,
      city,
      districtOrNeighborhood,
      country: targetCountry,
      praiseAndReputation: parsed.praiseAndReputation || {
        recognizedStrengths: `Excelente reputação e tradição no segmento de ${category} na região de ${city}.`,
        localAuthorityRating: 'Referência Consolidada na Região',
        marketRespectAnchor: `Operação sólida e reconhecida em ${city}.`
      },
      localMarketContext: parsed.localMarketContext || {
        cityOrDistrict: `${city} (${districtOrNeighborhood})`,
        regionalDemandOpportunity: `Demanda constante por serviços de alto padrão em ${city}.`,
        competitiveAdvantage: `Autoridade comprovada somada à agilidade tecnológica.`
      },
      expansionRoadmap: parsed.expansionRoadmap || {
        actionItem1: `Engenharia de captura instantânea de interessados em ${city}.`,
        actionItem2: `Filtro de triagem para prospects de alto ticket.`,
        actionItem3: `Automação de agenda conectada diretamente à diretoria.`
      },
      estimatedPipelineGrowth: parsed.estimatedPipelineGrowth || `+${currencySymbol} 20.000 a ${currencySymbol} 50.000 / mês`,
      executiveDiagnosisSummary: parsed.executiveDiagnosisSummary || `A ${companyName} possui forte reconhecimento em ${city}. Ao somar essa experiência à infraestrutura da CriaHub, consolidamos a liderança absoluta no mercado local.`,
      auditedAt: new Date().toLocaleDateString('pt-BR')
    };
  } catch (err) {
    console.warn("Fallback local para auditoria CriaHub Master SDR:", err);

    return {
      companyName,
      websiteUrl: lead.website,
      decisionMakerName,
      decisionMakerRole,
      city,
      districtOrNeighborhood,
      country: targetCountry,
      praiseAndReputation: {
        recognizedStrengths: `Reconhecida competência técnica e forte autoridade em ${category} em ${city}.`,
        localAuthorityRating: 'Referência Consolidada na Região',
        marketRespectAnchor: `Uma das marcas mais respeitadas de ${city} no seu segmento.`
      },
      localMarketContext: {
        cityOrDistrict: `${city} (${districtOrNeighborhood})`,
        regionalDemandOpportunity: `Crescimento contínuo de clientes procurando soluções de referência na região de ${city}.`,
        competitiveAdvantage: `Posicionamento premium que se destaca frente aos concorrentes locais.`
      },
      expansionRoadmap: {
        actionItem1: `Triagem imediata e qualificação automática de novas oportunidades.`,
        actionItem2: `Otimização do fluxo de agendamentos com decisores locais.`,
        actionItem3: `Blindagem de mercado para consolidar a marca como líder número 1 da cidade.`
      },
      estimatedPipelineGrowth: `+${currencySymbol} 15.000 a ${currencySymbol} 45.000 / mês`,
      executiveDiagnosisSummary: `A ${companyName} já tem excelente autoridade em ${city}. Unindo os anos de tradição da empresa com as ferramentas de alta conversão da CriaHub, garantimos o domínio da demanda local sem custos elevados.`,
      auditedAt: new Date().toLocaleDateString('pt-BR')
    };
  }
}

/**
 * Gerador de Copys e Roteiros de Ligação do Master SDR (+10 Anos de Experiência)
 */
export async function generateCriahubHighConversionOutreach(
  lead: Lead,
  diagnosis: CriahubDiagnosis,
  signal?: AbortSignal
): Promise<CriahubOutreachScripts> {
  const targetCountry = diagnosis.country || lead.country || getSavedCountry();
  const currencySymbol = getCurrencyConfig(targetCountry).symbol;
  const decisionMakerName = diagnosis.decisionMakerName;
  const firstName = decisionMakerName && !['Diretoria', 'Responsável', 'CEO'].includes(decisionMakerName)
    ? decisionMakerName.split(' ')[0]
    : '';
  const decisionMakerRole = diagnosis.decisionMakerRole;
  const companyName = diagnosis.companyName;
  const city = diagnosis.city;
  const district = diagnosis.districtOrNeighborhood;
  const category = lead.category || "sua área de atuação";

  const nuances = getLocalizedSdrNuances(targetCountry);

  const systemPrompt = `
Você é o MAIOR E MAIS RESPEITADO MASTER SDR DO PLANETA (10+ anos de experiência fechando negócios com donos de empresas, diretores e CEOs).
Você está gerando abordagens e scripts de ligação para a CriaHub.

REGRAS DE OURO DO MASTER SDR:
1. VOCÊ É O CARA QUE OLHA NOS OLHOS E CONVENCE PELO PROFISSIONALISMO, RESPEITO E CONFIANÇA.
2. NUNCA CRITIQUE OU FALE MAL DA EMPRESA: Elogie o trabalho de excelência, a autoridade e a reputação que a ${companyName} já tem em ${city} e no bairro ${district}.
3. PROPOSTA DE VALOR: Unir a sólida experiência da ${companyName} com a infraestrutura de captação da CriaHub para torná-los a MAIOR E MAIS LUCRATIVA REFERÊNCIA DA CIDADE.
4. SEM CUSTOS ELEVADOS: Deixe claro que são ajustes técnicos e precisão, sem investimentos arriscados.
5. VOCABULÁRIO NATIVO DE ${targetCountry.toUpperCase()}:
   - Se Portugal: Use "Viva ${firstName || 'caro colega'}", "estive a analisar o vosso posicionamento", "distrito de ${city}", "freguesia/concelho de ${district}", "fazer sentido batermos um papo de 5 minutos", "abraço".
   - Se Brasil: Use "Fala ${firstName || 'amigo'}, tudo bem?", "acompanho a autoridade de vocês aqui em ${city}", "bairro ${district}", "bora bater um papo rápido de 5 minutos", "um abraço".
   - Se Espanha/Latam/UK/EUA: Use as saudações e termos perfeitos de negócios.
6. NA LIGAÇÃO: Respostas ultra-rápidas, naturais, zero robóticas, parecendo um papo de alto nível entre dois empresários de sucesso.
`;

  const prompt = `
DADOS DO LEAD:
- Empresa: ${companyName}
- Decisor: ${decisionMakerName} (${decisionMakerRole})
- Cidade: ${city}
- Bairro/Distrito: ${district}
- Nicho: ${category}
- País: ${targetCountry}
- Moeda: ${currencySymbol}

Gere o conjunto completo de abordagens e o ROTEIRO RÁPIDO DE LIGAÇÃO AO VIVO em JSON rigoroso:
{
  "whatsapp": {
    "hook": "${nuances.greeting} ${firstName || decisionMakerName}, tudo bem? Estive a acompanhar o excelente trabalho e a reputação que a ${companyName} construiu em ${city}.",
    "bridge": "Vocês já são uma das referências mais respeitadas no setor aqui na região, e vejo um potencial enorme de transformar essa autoridade em domínio absoluto do mercado local.",
    "criahubSolution": "Na CriaHub unimos os anos de experiência da sua empresa com a nossa infraestrutura de captação qualificada, acelerando novos fechamentos sem custos pesados.",
    "lowFrictionCta": "Faria sentido batermos um papo rápido de 5 minutos nesta semana para eu te mostrar como pretendemos posicionar a ${companyName} no topo absoluto de ${city}?",
    "fullMessageText": "${nuances.greeting} ${firstName || decisionMakerName}, tudo bem?\\n\\nAcompanho a autoridade que a ${companyName} conquistou no segmento de ${category} em ${city} e no ${district}. Parabéns pelo trabalho impecável!\\n\\nIdentificamos uma oportunidade excelente para unir a vossa experiência com a nossa engenharia de captação da CriaHub, garantindo que os clientes de maior ticket da cidade fechem diretamente com vocês, sem custos elevados.\\n\\nFaria sentido batermos 5 minutos rápidos nesta semana para eu te apresentar esse desenho prático?\\n\\n${nuances.signOff}",
    "audioNoteScript": "Fala ${firstName || decisionMakerName}, tudo bem? Aqui é o consultor de expansão da CriaHub. Passei só para parabenizar pelo trabalho que vocês fazem em ${city} — a reputação da ${companyName} é fantástica! Estive a desenhar uma estratégia para consolidar vocês como a maior referência da região e gostaria de te apresentar em 5 minutos. Me avisa se podemos falar amanhã!"
  },
  "coldEmail": {
    "subject": "${firstName ? firstName + ', ' : ''}Parabéns pela autoridade da ${companyName} em ${city}",
    "subjectOptions": [
      "${firstName ? firstName + ', ' : ''}Parabéns pela autoridade da ${companyName} em ${city}",
      "Expansão e liderança de mercado da ${companyName} (${city})",
      "${companyName} como a referência número 1 de ${category} em ${city}"
    ],
    "bodyAida": "${nuances.greeting} ${firstName || decisionMakerName},\\n\\nAcompanho com grande admiração o trabalho e a solidez que a ${companyName} construiu no setor de ${category} aqui em ${city}.\\n\\nO mercado da nossa região está altamente aquecido e clientes de alto padrão buscam exatamente a qualidade que vocês oferecem.\\n\\nNa CriaHub, desenvolvemos uma engenharia de captação que une a credibilidade da sua empresa com tecnologia de ponta, tornando a ${companyName} a escolha incontestável de ${city}, sem investimentos arriscados.\\n\\nFaria sentido conversarmos por 10 minutos nesta quinta-feira para eu te mostrar esse mapa de expansão?\\n\\n${nuances.signOff},\\nEquipe CriaHub",
    "bodyPas": "${nuances.greeting} ${firstName || decisionMakerName},\\n\\nEmpresas com a reputação da ${companyName} em ${city} frequentemente enfrentam a concorrência desleal de players menores que investem pesado em marketing agressivo.\\n\\nSua excelência técnica merece estar no topo das buscas e ser a primeira opção de todo cliente de alto valor do ${district} e de ${city}.\\n\\nA CriaHub estrutura essa alavancagem para posicionar vocês no topo definitivo da região com máxima eficiência e sem custos pesados.\\n\\nPodemos alinhar 10 minutos na sua agenda nesta semana?\\n\\n${nuances.signOff}",
    "plainText": "${nuances.greeting} ${firstName || decisionMakerName},\\n\\nNotei a forte autoridade da ${companyName} em ${city}.\\n\\nPreparamos um plano objetivo para alavancar ainda mais a vossa presença e consolidar a liderança no mercado regional sem custos elevados.\\n\\nVale batermos 5 minutos rápidos nesta quinta às 10h30?\\n\\n${nuances.signOff}"
  },
  "linkedin": {
    "connectionNote": "${nuances.greeting} ${firstName || decisionMakerName}, acompanho a liderança da ${companyName} em ${city}. Gostaria de me conectar para trocar ideias sobre o mercado de ${category} na região!",
    "followUpPitch": "Obrigado por aceitar a conexão, ${firstName || decisionMakerName}! Admiramos muito o trabalho da ${companyName} em ${city}. Estruturamos um mapa de expansão para consolidar vocês como a maior referência da região. Faria sentido batermos 5 minutos?"
  },
  "coldCall": {
    "warmLocalIceBreaker": "${nuances.callOpening}",
    "masterHookQuestion": "Vocês já têm uma reputação impecável em ${city}, mas sabemos que o mercado local tem uma fatia enorme de clientes de alto valor procurando por ${category}. Como está o plano de vocês para capturar 100% dessa demanda neste semestre?",
    "visionPitch30s": "O nosso objetivo não é vender ferramentas avulsas, e sim unir a experiência e solidez que a ${companyName} já tem com a nossa engenharia de captação CriaHub, garantindo que vocês sejam a escolha óbvia de qualquer cliente em ${city}, sem custos pesados.",
    "fastClosingMeeting": "Para eu te mostrar esse plano desenhado na prática em 10 minutos no Google Meet, fica melhor para você amanhã às 10h15 ou às 14h30?",
    "liveQuickRebuttals": [
      {
        "situation": "Já temos parceiro / agência que cuida disso",
        "sdrResponse": "Excelente saber que já contam com apoio estruturado, ${firstName || 'caro gestor'}! O meu objetivo não é concorrer com ninguém, mas somar com uma análise de expansão regional para ${city} que a vossa própria equipa pode aproveitar. Vale vermos 10 minutos para analisar estes dados?"
      },
      {
        "situation": "Onde estão sediados? Vocês operam cá em Portugal?",
        "sdrResponse": "Estamos sediados e a operar diretamente cá em Portugal há mais de 3 anos, com suporte local no fuso horário de Lisboa e trabalho com empresas no eixo Lisboa / Porto. A nossa entrega é desenhada especificamente para o mercado português e europeu. Teria 10 minutos amanhã para ver a estrutura?"
      },
      {
        "situation": "Me manda por e-mail / WhatsApp",
        "sdrResponse": "Com todo o gosto, ${firstName || 'caro gestor'}! Mas como preparámos uma análise sob medida para o mercado de ${city} e não um documento genérico, o e-mail não faria justiça ao projeto. Prefiro partilhar o ecrã consigo durante 10 minutos amanhã. Qual o período mais conveniente?"
      },
      {
        "situation": "Estou muito ocupado / sem tempo agora",
        "sdrResponse": "Compreendo perfeitamente o ritmo exigente da operação em ${city}, ${firstName || 'caro gestor'}! Respeito 100% o seu tempo: só preciso de 10 minutos objetivos no início do dia para lhe entregar este mapa. Fica-lhe melhor às 09h30 ou às 14h30?"
      },
      {
        "situation": "Não temos verba / orçamento agora",
        "sdrResponse": "Compreendo perfeitamente, ${firstName || 'caro gestor'}. Precisamente por isso a nossa engenharia é desenhada para se pagar logo no primeiro ciclo com as oportunidades recuperadas em ${city}, sem custos fixos pesados. Se lhe demonstrar isso na prática em 10 minutos, faria sentido avaliar?"
      }
    ]
  },
  "videoLoomPitch": {
    "title": "Vídeo Loom / Gravação de Tela 60s (${companyName})",
    "durationSeconds": 60,
    "step1Hook0to10s": "Mostre a aba do Google Maps ou Site da ${companyName}. 'Fala ${firstName || decisionMakerName}, tudo bem? Aqui é da CriaHub. Gravei este vídeo de 1 minuto para te parabenizar pela excelente autoridade que vocês construíram em ${city}.'",
    "step2Opportunity10to30s": "Aponte na tela o fluxo de conversão. 'Notei que vocês recebem uma procura alta no Google, mas parte dos clientes de alto padrão acaba demorando para ter resposta ou vai para concorrentes menores com anúncios.'",
    "step3Solution30to45s": "Mostre o blueprint CriaHub. 'Desenhamos uma infraestrutura que tria e agenda reuniões automáticas no WhatsApp para seu time, sem que você precise gastar rios de dinheiro.'",
    "step4Cta45to60s": "'Se fizer sentido batermos 5 minutos rápidos no Google Meet para eu te entregar esse desenho sem compromisso, me avisa por aqui!'",
    "fullTranscript": "Fala ${firstName || decisionMakerName}, tudo bem? Aqui é o consultor de expansão da CriaHub. Gravei este vídeo rápido de 60 segundos porque estive a analisar a presença da ${companyName} em ${city} e a vossa autoridade é fantástica. Notei uma oportunidade de ouro para reter os clientes de alto padrão que chegam pelo Google Maps e direcioná-los para agendamentos imediatos no WhatsApp. Desenhámos essa solução para rodar sem custos pesados. Vale batermos 5 minutos rápidos nesta semana para eu vos mostrar? Um abraço!"
  }
}
`;

  try {
    const res = await executeAiCompletion({
      prompt,
      systemPrompt,
      temperature: 0.3,
      jsonMode: true,
      signal
    });

    let raw = res.text.trim();
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    if (s !== -1 && e !== -1) raw = raw.substring(s, e + 1);

    const parsed = JSON.parse(raw);

    const wa = parsed.whatsapp || {};
    const coldCall = parsed.coldCall || {};
    const video = parsed.videoLoomPitch || {};

    return {
      whatsapp: {
        hook: wa.hook || `${nuances.greeting} ${firstName || decisionMakerName}, tudo bem? Acompanho a grande autoridade da ${companyName} em ${city}.`,
        bridge: wa.bridge || `Vocês já são uma das marcas mais respeitadas na região e vejo uma oportunidade enorme de consolidar ainda mais a liderança local.`,
        criahubSolution: wa.criahubSolution || `Na CriaHub unimos sua experiência ao nosso sistema de captação de alta conversão sem custos pesados.`,
        lowFrictionCta: wa.lowFrictionCta || `Faria sentido batermos 5 minutos rápidos nesta semana?`,
        fullMessageText: wa.fullMessageText || `${nuances.greeting} ${firstName || decisionMakerName}, tudo bem?\n\nAcompanho a autoridade que a ${companyName} conquistou no segmento de ${category} em ${city} e no ${district}. Parabéns pelo trabalho impecável!\n\nIdentificamos uma oportunidade excelente para unir a vossa experiência com a nossa engenharia de captação da CriaHub, garantindo que os clientes de maior ticket da cidade fechem diretamente com vocês, sem custos elevados.\n\nFaria sentido batermos 5 minutos rápidos nesta semana para eu te apresentar esse desenho prático?\n\n${nuances.signOff}`,
        audioNoteScript: wa.audioNoteScript || `Fala ${firstName || decisionMakerName}, tudo bem? Aqui é o consultor de expansão da CriaHub. Parabéns pela liderança em ${city}! Gostaria de te mostrar um plano rápido de 5 minutos para alavancar ainda mais a vossa presença regional. Me avisa quando pudermos falar!`
      },
      coldEmail: parsed.coldEmail || {
        subject: `${firstName ? firstName + ', ' : ''}Parabéns pela autoridade da ${companyName} em ${city}`,
        subjectOptions: [
          `${firstName ? firstName + ', ' : ''}Parabéns pela autoridade da ${companyName} em ${city}`,
          `Expansão e liderança de mercado da ${companyName} (${city})`,
          `${companyName} como a referência número 1 de ${category} em ${city}`
        ],
        bodyAida: `${nuances.greeting} ${firstName || decisionMakerName},\n\nAcompanho com grande admiração o trabalho e a solidez que a ${companyName} construiu no setor de ${category} aqui em ${city}.\n\nO mercado da nossa região está altamente aquecido e clientes de alto padrão buscam exatamente a qualidade que vocês oferecem.\n\nNa CriaHub, desenvolvemos uma engenharia de captação que une a credibilidade da sua empresa com tecnologia de ponta, tornando a ${companyName} a escolha incontestável de ${city}, sem investimentos arriscados.\n\nFaria sentido conversarmos por 10 minutos nesta quinta-feira para eu te mostrar esse mapa de expansão?\n\n${nuances.signOff},\nEquipe CriaHub`,
        bodyPas: `${nuances.greeting} ${firstName || decisionMakerName},\n\nEmpresas com a reputação da ${companyName} em ${city} frequentemente enfrentam concorrentes que tentam ganhar mercado apenas com propaganda agressiva.\n\nSua excelência técnica merece estar no topo das buscas e ser a primeira opção de todo cliente de alto valor do ${district} e de ${city}.\n\nA CriaHub estrutura essa alavancagem para posicionar vocês no topo definitivo da região com máxima eficiência e sem custos pesados.\n\nPodemos alinhar 10 minutos na sua agenda nesta semana?\n\n${nuances.signOff}`,
        plainText: `${nuances.greeting} ${firstName || decisionMakerName},\n\nNotei a forte autoridade da ${companyName} em ${city}.\n\nPreparamos um plano objetivo para alavancar ainda mais a vossa presença e consolidar a liderança no mercado regional sem custos elevados.\n\nVale batermos 5 minutos rápidos nesta quinta às 10h30?\n\n${nuances.signOff}`
      },
      linkedin: parsed.linkedin || {
        connectionNote: `${nuances.greeting} ${firstName || decisionMakerName}, acompanho a liderança da ${companyName} em ${city}. Gostaria de me conectar para trocar ideias sobre o mercado na região!`,
        followUpPitch: `Obrigado por aceitar a conexão, ${firstName || decisionMakerName}! Admiramos muito o trabalho da ${companyName} em ${city}. Preparamos uma análise de expansão regional, posso compartilhar contigo em 5 minutos?`
      },
      coldCall: {
        warmLocalIceBreaker: coldCall.warmLocalIceBreaker || nuances.callOpening,
        masterHookQuestion: coldCall.masterHookQuestion || `Vocês já têm uma reputação sólida em ${city}, mas o mercado local tem uma fatia enorme de clientes de alto valor. Como está o plano de vocês para capturar essa demanda?`,
        visionPitch30s: coldCall.visionPitch30s || `Nosso objetivo é unir a tradição da ${companyName} com a nossa engenharia de captação CriaHub, tornando vocês a referência incontestável de ${city} sem custos pesados.`,
        fastClosingMeeting: coldCall.fastClosingMeeting || `Para eu te mostrar esse plano em 10 minutos no Google Meet, fica melhor amanhã às 10h15 ou às 14h30?`,
        liveQuickRebuttals: Array.isArray(coldCall.liveQuickRebuttals) && coldCall.liveQuickRebuttals.length > 0 
          ? coldCall.liveQuickRebuttals
          : [
            {
              situation: "Já temos parceiro / agência",
              sdrResponse: `Excelente saber que já têm apoio, ${firstName || 'gestor'}! Nosso objetivo não é substituir ninguém, mas sim apresentar um diagnóstico de oportunidades em ${city} que complemente sua equipe. Vale vermos 10 minutos amanhã?`
            },
            {
              situation: "Manda por e-mail",
              sdrResponse: `Com certeza, ${firstName || 'gestor'}! Mas como preparamos uma análise específica para ${city}, prefiro abrir a tela por 10 minutos para você ver os números reais. Amanhã às 10h fica bom?`
            },
            {
              situation: "Estou sem tempo",
              sdrResponse: `Respeito 100% seu tempo na ${companyName}, ${firstName || 'gestor'}. Preciso de apenas 10 minutos na quinta-feira cedo para te entregar o mapa. Prefere às 09h ou às 11h?`
            },
            {
              situation: "Sem orçamento",
              sdrResponse: `Totalmente compreensível, ${firstName || 'gestor'}. Por isso mesmo nossa solução não é custo fixo, e sim um acelerador que se paga com novos negócios em ${city}. Vale avaliar em 10 minutos?`
            }
          ]
      },
      videoLoomPitch: {
        title: video.title || `Vídeo Loom 60s - ${companyName}`,
        durationSeconds: 60,
        step1Hook0to10s: video.step1Hook0to10s || `Mostre a tela no Maps. "Fala ${firstName || decisionMakerName}, tudo bem? Gravei este vídeo de 1 minuto para parabenizar a ${companyName} pela autoridade aqui em ${city}."`,
        step2Opportunity10to30s: video.step2Opportunity10to30s || `Aponte a oportunidade: "Vi que muitos clientes encontram vocês, mas há espaço para acelerar a resposta comercial imediata no WhatsApp."`,
        step3Solution30to45s: video.step3Solution30to45s || `Apresente a solução: "Na CriaHub criamos a esteira que qualifica e agenda contatos sem custos pesados."`,
        step4Cta45to60s: video.step4Cta45to60s || `Convite: "Vale batermos 5 minutos rápidos no Meet amanhã para eu te mostrar?"`,
        fullTranscript: video.fullTranscript || `Fala ${firstName || decisionMakerName}, tudo bem? Aqui é o consultor de expansão da CriaHub. Parabéns pela excelência da ${companyName} em ${city}! Desenhamos uma estratégia para capturar 100% dos clientes de alto padrão da região e gostaria de te mostrar em 5 minutos no Meet. Me avisa quando puder falar!`
      }
    };
  } catch (err) {
    console.warn("Fallback offline para scripts Master SDR:", err);

    return {
      whatsapp: {
        hook: `${nuances.greeting} ${firstName || decisionMakerName}, tudo bem? Acompanho a grande autoridade da ${companyName} em ${city}.`,
        bridge: `Vocês já são uma das marcas mais respeitadas na região e vejo uma oportunidade enorme de consolidar ainda mais a liderança local.`,
        criahubSolution: `Na CriaHub unimos sua experiência ao nosso sistema de captação de alta conversão sem custos pesados.`,
        lowFrictionCta: `Faria sentido batermos 5 minutos rápidos nesta semana?`,
        fullMessageText: `${nuances.greeting} ${firstName || decisionMakerName}, tudo bem?\n\nAcompanho a autoridade que a ${companyName} conquistou no segmento de ${category} em ${city} e no ${district}. Parabéns pelo trabalho impecável!\n\nIdentificamos uma oportunidade excelente para unir a vossa experiência com a nossa engenharia de captação da CriaHub, garantindo que os clientes de maior ticket da cidade fechem diretamente com vocês, sem custos elevados.\n\nFaria sentido batermos 5 minutos rápidos nesta semana para eu te apresentar esse desenho prático?\n\n${nuances.signOff}`,
        audioNoteScript: `Fala ${firstName || decisionMakerName}, tudo bem? Aqui é o consultor de expansão da CriaHub. Parabéns pela liderança em ${city}! Gostaria de te mostrar um plano rápido de 5 minutos para alavancar ainda mais a vossa presença regional. Me avisa quando pudermos falar!`
      },
      coldEmail: {
        subject: `${firstName ? firstName + ', ' : ''}Parabéns pela autoridade da ${companyName} em ${city}`,
        subjectOptions: [
          `${firstName ? firstName + ', ' : ''}Parabéns pela autoridade da ${companyName} em ${city}`,
          `Expansão e liderança de mercado da ${companyName} (${city})`,
          `${companyName} como a referência número 1 de ${category} em ${city}`
        ],
        bodyAida: `${nuances.greeting} ${firstName || decisionMakerName},\n\nAcompanho com grande admiração o trabalho e a solidez que a ${companyName} construiu no setor de ${category} aqui em ${city}.\n\nO mercado da nossa região está altamente aquecido e clientes de alto padrão buscam exatamente a qualidade que vocês oferecem.\n\nNa CriaHub, desenvolvemos uma engenharia de captação que une a credibilidade da sua empresa com tecnologia de ponta, tornando a ${companyName} a escolha incontestável de ${city}, sem investimentos arriscados.\n\nFaria sentido conversarmos por 10 minutos nesta quinta-feira para eu te mostrar esse mapa de expansão?\n\n${nuances.signOff},\nEquipe CriaHub`,
        bodyPas: `${nuances.greeting} ${firstName || decisionMakerName},\n\nEmpresas com a reputação da ${companyName} em ${city} frequentemente enfrentam concorrentes que tentam ganhar mercado apenas com propaganda agressiva.\n\nSua excelência técnica merece estar no topo das buscas e ser a primeira opção de todo cliente de alto valor do ${district} e de ${city}.\n\nA CriaHub estrutura essa alavancagem para posicionar vocês no topo definitivo da região com máxima eficiência e sem custos pesados.\n\nPodemos alinhar 10 minutos na sua agenda nesta semana?\n\n${nuances.signOff}`,
        plainText: `${nuances.greeting} ${firstName || decisionMakerName},\n\nNotei a forte autoridade da ${companyName} em ${city}.\n\nPreparamos um plano objetivo para alavancar ainda mais a vossa presença e consolidar a liderança no mercado regional sem custos elevados.\n\nVale batermos 5 minutos rápidos nesta quinta às 10h30?\n\n${nuances.signOff}`
      },
      linkedin: {
        connectionNote: `${nuances.greeting} ${firstName || decisionMakerName}, acompanho a liderança da ${companyName} em ${city}. Gostaria de me conectar para trocar ideias sobre o mercado na região!`,
        followUpPitch: `Obrigado por aceitar a conexão, ${firstName || decisionMakerName}! Admiramos muito o trabalho da ${companyName} em ${city}. Preparamos uma análise de expansão regional, posso compartilhar contigo em 5 minutos?`
      },
      coldCall: {
        warmLocalIceBreaker: nuances.callOpening,
        masterHookQuestion: `Vocês já têm uma reputação sólida em ${city}, mas o mercado local tem uma fatia enorme de clientes de alto valor. Como está o plano de vocês para capturar essa demanda?`,
        visionPitch30s: `Nosso objetivo é unir a tradição da ${companyName} com a nossa engenharia de captação CriaHub, tornando vocês a referência incontestável de ${city} sem custos pesados.`,
        fastClosingMeeting: `Para eu te mostrar esse plano em 10 minutos no Google Meet, fica melhor amanhã às 10h15 ou às 14h30?`,
        liveQuickRebuttals: [
          {
            situation: "Já temos parceiro / agência",
            sdrResponse: `Excelente saber que já têm apoio, ${firstName || 'gestor'}! Nosso objetivo não é substituir ninguém, mas sim apresentar um diagnóstico de oportunidades em ${city} que complemente sua equipe. Vale vermos 10 minutos amanhã?`
          },
          {
            situation: "Manda por e-mail",
            sdrResponse: `Com certeza, ${firstName || 'gestor'}! Mas como preparamos uma análise específica para ${city}, prefiro abrir a tela por 10 minutos para você ver os números reais. Amanhã às 10h fica bom?`
          },
          {
            situation: "Estou sem tempo",
            sdrResponse: `Respeito 100% seu tempo na ${companyName}, ${firstName || 'gestor'}. Preciso de apenas 10 minutos na quinta-feira cedo para te entregar o mapa. Prefere às 09h ou às 11h?`
          },
          {
            situation: "Sem orçamento",
            sdrResponse: `Totalmente compreensível, ${firstName || 'gestor'}. Por isso mesmo nossa solução não é custo fixo, e sim um acelerador que se paga com novos negócios em ${city}. Vale avaliar em 10 minutos?`
          }
        ]
      },
      videoLoomPitch: {
        title: `Vídeo Loom 60s - ${companyName}`,
        durationSeconds: 60,
        step1Hook0to10s: `Mostre a tela no Maps. "Fala ${firstName || decisionMakerName}, tudo bem? Gravei este vídeo de 1 minuto para parabenizar a ${companyName} pela autoridade aqui em ${city}."`,
        step2Opportunity10to30s: `Aponte a oportunidade: "Vi que muitos clientes encontram vocês, mas há espaço para acelerar a resposta comercial imediata no WhatsApp."`,
        step3Solution30to45s: `Apresente a solução: "Na CriaHub criamos a esteira que qualifica e agenda contatos sem custos pesados."`,
        step4Cta45to60s: `Convite: "Vale batermos 5 minutos rápidos no Meet amanhã para eu te mostrar?"`,
        fullTranscript: `Fala ${firstName || decisionMakerName}, tudo bem? Aqui é o consultor de expansão da CriaHub. Parabéns pela excelência da ${companyName} em ${city}! Desenhamos uma estratégia para capturar 100% dos clientes de alto padrão da região e gostaria de te mostrar em 5 minutos no Meet. Me avisa quando puder falar!`
      }
    };
  }
}
