import { Lead, BusinessProfile, AiLiveCopilotAnalysis } from '../types';

/**
 * Intelligent Real-time Sales Objection & Live Conversation Copilot Engine.
 * Analyzes audio transcripts from phone calls, WhatsApp voice notes, or live incoming text messages.
 */
export async function analyzeLiveConversationTurn(
  transcript: string,
  lead?: Lead | null,
  businessProfile?: BusinessProfile | null,
  channel: 'audio_call' | 'whatsapp_audio' | 'whatsapp_text' | 'video_call' = 'audio_call'
): Promise<AiLiveCopilotAnalysis> {
  const cleanText = transcript.trim().toLowerCase();

  // 1. Heuristic & Semantic Classification
  let sentiment: AiLiveCopilotAnalysis['sentiment'] = 'neutro';
  let sentimentConfidence = 85;
  let buyingSignalScore = 50;
  let detectedIntent = 'Dúvida Geral sobre a Solução';
  let identifiedObjectionCategory: AiLiveCopilotAnalysis['identifiedObjectionCategory'] = 'OUTROS';
  let keyPsychologicalTrigger = 'Prova Social de Autoridade';
  let nextBestAction = 'Validar a prioridade atual e propor demonstração de 15 minutos';
  let isReadyForClosing = false;

  const leadName = lead?.name || 'Cliente';
  const contactName = lead?.decisionMaker?.name || 'Decisor';
  const category = lead?.category || 'Empresa';
  const identifiedPain = lead?.identifiedPain || 'perda de oportunidades comerciais';
  const uvp = businessProfile?.uvp || 'estruturar captação de clientes qualificados e previsibilidade de receita';

  // Keyword Matrix & Semantic Matching
  if (
    cleanText.includes('caro') || 
    cleanText.includes('preço') || 
    cleanText.includes('orçamento') || 
    cleanText.includes('valor') ||
    cleanText.includes('sem verba') ||
    cleanText.includes('muito alto') ||
    cleanText.includes('desconto')
  ) {
    sentiment = 'cético';
    sentimentConfidence = 92;
    buyingSignalScore = 65; // Price objections mean they are considering the purchase!
    detectedIntent = 'Objeção Financeira / Custo x Retorno';
    identifiedObjectionCategory = 'PREÇO';
    keyPsychologicalTrigger = 'Ancoragem de Custo de Inação & ROI';
    nextBestAction = 'Desviar o foco de custo para o retorno financeiro e o prejuízo de continuar com o gap atual';
  } else if (
    cleanText.includes('tempo') || 
    cleanText.includes('ocupado') || 
    cleanText.includes('depois') || 
    cleanText.includes('semana que vem') ||
    cleanText.includes('mês que vem') ||
    cleanText.includes('sem tempo') ||
    cleanText.includes('reunião agora')
  ) {
    sentiment = 'neutro';
    sentimentConfidence = 88;
    buyingSignalScore = 40;
    detectedIntent = 'Objeção de Timing / Falta de Tempo';
    identifiedObjectionCategory = 'TEMPO';
    keyPsychologicalTrigger = 'Micro-Compromisso de Baixa Fricção (10 min)';
    nextBestAction = 'Pedir apenas 10 minutos pontuais em horário de menor movimento';
  } else if (
    cleanText.includes('já tenho') || 
    cleanText.includes('já temos') || 
    cleanText.includes('outra agência') || 
    cleanText.includes('concorrente') ||
    cleanText.includes('fornecedor') ||
    cleanText.includes('equipe interna')
  ) {
    sentiment = 'cético';
    sentimentConfidence = 90;
    buyingSignalScore = 55;
    detectedIntent = 'Objeção de Concorrência / Fornecedor Atual';
    identifiedObjectionCategory = 'CONCORRENTE';
    keyPsychologicalTrigger = 'Auditoria Comparativa sem Conflito';
    nextBestAction = 'Não criticar o parceiro atual, mas propor um comparativo técnico complementar';
  } else if (
    cleanText.includes('apresentação') || 
    cleanText.includes('manda por email') || 
    cleanText.includes('manda no whats') || 
    cleanText.includes('envia material') ||
    cleanText.includes('proposta')
  ) {
    sentiment = 'neutro';
    sentimentConfidence = 84;
    buyingSignalScore = 58;
    detectedIntent = 'Solicitação de Material / Descarte Suave';
    identifiedObjectionCategory = 'OUTROS';
    keyPsychologicalTrigger = 'Condicionamento de Envio a Diagnóstico Personalizado';
    nextBestAction = 'Concordar com o envio, mas fazer 1 pergunta crucial de diagnóstico antes';
  } else if (
    cleanText.includes('interessante') || 
    cleanText.includes('como funciona') || 
    cleanText.includes('gostei') || 
    cleanText.includes('quero saber mais') ||
    cleanText.includes('pode agendar') ||
    cleanText.includes('vamos conversar') ||
    cleanText.includes('qual o próximo passo')
  ) {
    sentiment = 'interessado';
    sentimentConfidence = 96;
    buyingSignalScore = 90;
    detectedIntent = 'Alto Interesse de Compra / Sinal Verde';
    identifiedObjectionCategory = 'OUTROS';
    keyPsychologicalTrigger = 'Fechamento Assuntivo Direto';
    nextBestAction = 'Travar data e hora exatas imediatamente na agenda';
    isReadyForClosing = true;
  } else if (
    cleanText.includes('não quero') || 
    cleanText.includes('tira da lista') || 
    cleanText.includes('golpe') || 
    cleanText.includes('não me ligue') ||
    cleanText.includes('desliga')
  ) {
    sentiment = 'hostil';
    sentimentConfidence = 95;
    buyingSignalScore = 10;
    detectedIntent = 'Rejeição Forte / Quebra de Rapport';
    identifiedObjectionCategory = 'CONFIANÇA';
    keyPsychologicalTrigger = 'Desarme Empático & Desconexão Imediata';
    nextBestAction = 'Pedir desculpas cordialmente e registrar status ignorado/desqualificado';
  } else if (
    cleanText.includes('quem é você') || 
    cleanText.includes('quem indicou') || 
    cleanText.includes('garantia') || 
    cleanText.includes('funciona mesmo') ||
    cleanText.includes('qual a segurança')
  ) {
    sentiment = 'cético';
    sentimentConfidence = 89;
    buyingSignalScore = 60;
    detectedIntent = 'Objeção de Confiança / Prova Social';
    identifiedObjectionCategory = 'CONFIANÇA';
    keyPsychologicalTrigger = 'Prova Social com Dados Concretos do Nicho';
    nextBestAction = 'Citar case semelhante do mesmo segmento e demonstrar segurança';
  }

  // 2. Generate Real-time Verbal Rebuttal & WhatsApp Text Scripts
  let liveRebuttalScript = '';
  let whatsappQuickResponse = '';

  switch (identifiedObjectionCategory) {
    case 'PREÇO':
      liveRebuttalScript = `Entendo perfeitamente, ${contactName}. Justamente por isso nosso foco não é gerar mais um custo fixo, e sim estancar a ${identifiedPain} que hoje drena o faturamento da ${leadName}. Se eu te provar em 15 minutos como o retorno cobre o investimento logo no primeiro ciclo, faria sentido dar uma olhada rápida?`;
      whatsappQuickResponse = `Entendo 100%, ${contactName}! Nosso objetivo não é virar mais um custo, e sim estancar a ${identifiedPain} da *${leadName}*. Se eu te mandar um raio-x de 2 minutos mostrando o retorno estimado para o seu segmento, você prefere dar uma olhada hoje à tarde ou amanhã?`;
      break;

    case 'TEMPO':
      liveRebuttalScript = `Imagino sua correria, ${contactName}! Prometo ser cirúrgico: preciso de apenas 10 minutos no início da manhã de amanhã ou quinta-feira para te mostrar exatamente onde a ${leadName} está perdendo clientes para a concorrência. Qual horário fica menos pesado para você?`;
      whatsappQuickResponse = `Super entendo sua correria, ${contactName}! Não quero tomar seu tempo. Posso te enviar um áudio de 40 segundos com os 2 pontos de melhoria que identifiquei na *${leadName}*, ou prefere bater um papo rápido de 10 min amanhã às 10h?`;
      break;

    case 'CONCORRENTE':
      liveRebuttalScript = `Excelente que vocês já têm essa iniciativa, ${contactName}! Nosso objetivo não é substituir ninguém de imediato, mas sim rodar um diagnóstico comparativo gratuito de 15 minutos para ver se há oportunidades ocultas que eles não estão cobrindo na ${leadName}. Amanhã às 14h você estaria livre?`;
      whatsappQuickResponse = `Muito bom saber que já olham para isso, ${contactName}! A ideia não é trocar de parceiro agora, mas te apresentar uma auditoria complementar sem compromisso sobre as oportunidades da *${leadName}*. Posso te mandar o PDF ou conversamos 10 min amanhã?`;
      break;

    case 'CONFIANÇA':
      liveRebuttalScript = `${contactName}, você tem toda razão em querer segurança. Implementamos essa mesma estrutura em outras empresas de ${category} e conseguimos gerar previsibilidade em menos de 30 dias. Por isso não peço decisão alguma por telefone, apenas uma conversa de 15 minutos para você ver os dados na tela.`;
      whatsappQuickResponse = `Faz total sentido seu cuidado, ${contactName}. Geramos resultados expressivos em empresas de ${category} resolvendo exatamente a ${identifiedPain}. Dá uma olhada nesses números rápidos e me diz se faz sentido avaliarmos juntos: [Link do Case de Sucesso]`;
      break;

    default:
      if (isReadyForClosing) {
        liveRebuttalScript = `Perfeito, ${contactName}! Para customizar a proposta da ${leadName}, tenho disponível amanhã às 10h30 ou às 15h00. Qual desses dois horários encaixa melhor na sua agenda?`;
        whatsappQuickResponse = `Sensacional, ${contactName}! Vamos avançar sim. Para alinharmos os detalhes práticos da *${leadName}*, qual horário fica melhor para você amanhã: 10h30 ou 15h00?`;
      } else {
        liveRebuttalScript = `Com certeza, ${contactName}! Mando o material com o maior prazer. Mas para que eu não te mande um PDF genérico que não sirva para nada, me diga: a sua prioridade hoje na ${leadName} é mais ${identifiedPain} ou acelerar a captação de novos clientes?`;
        whatsappQuickResponse = `Com certeza, ${contactName}! Posso mandar sim. Só me confirme uma coisa rápida para eu customizar para a *${leadName}*: a maior dor hoje é a ${identifiedPain} ou o volume de leads qualificados?`;
      }
      break;
  }

  // 3. Recommended Tomorrow/Next Days Quick Meeting Slots
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

  const suggestedMeetingTimes = [
    `Amanhã (${dateStr}) às 10h00`,
    `Amanhã (${dateStr}) às 14h30`,
    `Quinta-feira às 11h00`
  ];

  const criahubCrmNote = `[AI LIVE COPILOT] Sentimento: ${sentiment.toUpperCase()} (${sentimentConfidence}%) | Sinal de Compra: ${buyingSignalScore}% | Objeção Detectada: ${detectedIntent} | Gatilho: ${keyPsychologicalTrigger} | Próxima Ação: ${nextBestAction}`;

  return {
    timestamp: new Date().toISOString(),
    leadId: lead?.id,
    leadName: lead?.name,
    companyName: lead?.name,
    sentiment,
    sentimentConfidence,
    buyingSignalScore,
    detectedIntent,
    identifiedObjectionCategory,
    liveRebuttalScript,
    whatsappQuickResponse,
    keyPsychologicalTrigger,
    nextBestAction,
    suggestedMeetingTimes,
    isReadyForClosing,
    criahubCrmNote
  };
}

/**
 * Pre-built common audio/text simulations for quick SDR training or testing.
 */
export const QUICK_AUDIO_SCENARIOS = [
  {
    id: 'sc-preco',
    label: '💰 "Achei o preço muito alto / Não tenho verba agora"',
    transcript: 'Olha, eu até gostei da proposta que você me falou, mas agora no momento achei muito caro e a nossa empresa está sem orçamento para novos investimentos.',
    category: 'PREÇO'
  },
  {
    id: 'sc-tempo',
    label: '⏳ "Estou sem tempo, me liga outro mês"',
    transcript: 'Estou entrando em reunião agora e nossa equipe está atolada de projetos. Não tenho como ver isso agora, me procura no mês que vem.',
    category: 'TEMPO'
  },
  {
    id: 'sc-concorrente',
    label: '🏢 "Já temos uma agência / fornecedor que cuida disso"',
    transcript: 'Agradeço o contato, mas nós já contratamos uma empresa terceirizada há seis meses que faz exatamente esse serviço de marketing e tecnologia para nós.',
    category: 'CONCORRENTE'
  },
  {
    id: 'sc-email',
    label: '📄 "Manda uma apresentação / PDF por e-mail"',
    transcript: 'Pode me mandar um material institucional e a apresentação com a tabela de valores no meu e-mail que depois eu dou uma olhada e te respondo se for o caso.',
    category: 'OUTROS'
  },
  {
    id: 'sc-fechamento',
    label: '🔥 "Gostei muito, como funciona para agendarmos?"',
    transcript: 'Achei super interessante o que você apontou sobre o nosso site e captação de clientes. Como a gente faz para ver uma demonstração prática disso funcionando?',
    category: 'FECHAMENTO'
  }
];
