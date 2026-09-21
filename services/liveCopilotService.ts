import { Lead, BusinessProfile, AiLiveCopilotAnalysis } from '../types';
import { getSavedCountry } from './countryService';

/**
 * MASTER SDR LIVE COPILOT & REAL-TIME REBUTTAL ENGINE (+10 Anos de Experiência)
 * 
 * Analisa transcrições de voz ao vivo durante ligações ou WhatsApp e entrega
 * respostas instantâneas, naturais, empáticas e altamente persuasivas para o SDR fechar a reunião.
 */
export async function analyzeLiveConversationTurn(
  transcript: string,
  lead?: Lead | null,
  businessProfile?: BusinessProfile | null,
  channel: 'audio_call' | 'whatsapp_audio' | 'whatsapp_text' | 'video_call' = 'audio_call'
): Promise<AiLiveCopilotAnalysis> {
  const cleanText = transcript.trim().toLowerCase();
  const country = lead?.country || getSavedCountry();
  const isPt = country.toLowerCase().includes('portugal') || country.toLowerCase().includes('pt');

  // 1. Heuristic & Semantic Classification
  let sentiment: AiLiveCopilotAnalysis['sentiment'] = 'neutro';
  let sentimentConfidence = 85;
  let buyingSignalScore = 50;
  let detectedIntent = 'Dúvida Geral / Alinhamento de Expansão';
  let identifiedObjectionCategory: AiLiveCopilotAnalysis['identifiedObjectionCategory'] = 'OUTROS';
  let keyPsychologicalTrigger = 'Reconhecimento de Autoridade & Alavancagem Local';
  let nextBestAction = 'Elogiar a operação atual e propor alinhamento estratégico de 10 minutos';
  let isReadyForClosing = false;

  const leadName = lead?.name || 'sua empresa';
  const rawContact = lead?.decisionMaker?.name || lead?.bantPlus?.authority?.keyDecisionMaker || '';
  const contactName = rawContact && !['Diretoria', 'Responsável', 'CEO'].includes(rawContact)
    ? rawContact.split(' ')[0]
    : (isPt ? 'colega' : 'amigo');
  
  const category = lead?.category || 'seu segmento';
  const city = lead?.city || 'sua cidade';
  const district = lead?.address ? lead.address.split(',')[0] : (lead?.city || 'sua região');

  // Keyword Matrix & Semantic Matching
  if (
    cleanText.includes('caro') || 
    cleanText.includes('preço') || 
    cleanText.includes('orçamento') || 
    cleanText.includes('valor') ||
    cleanText.includes('sem verba') ||
    cleanText.includes('muito alto') ||
    cleanText.includes('desconto') ||
    cleanText.includes('sem dinheiro')
  ) {
    sentiment = 'cético';
    sentimentConfidence = 92;
    buyingSignalScore = 65;
    detectedIntent = 'Preocupação com Orçamento / Custo vs Retorno';
    identifiedObjectionCategory = 'PREÇO';
    keyPsychologicalTrigger = 'Engenharia de Alavancagem Sem Custos Altos & Retorno Imediato';
    nextBestAction = 'Mostrar que não é custo fixo, e sim mecanismo que se paga no primeiro ciclo com os clientes da cidade';
  } else if (
    cleanText.includes('tempo') || 
    cleanText.includes('ocupado') || 
    cleanText.includes('depois') || 
    cleanText.includes('semana que vem') ||
    cleanText.includes('mês que vem') ||
    cleanText.includes('sem tempo') ||
    cleanText.includes('reunião agora') ||
    cleanText.includes('correria')
  ) {
    sentiment = 'neutro';
    sentimentConfidence = 88;
    buyingSignalScore = 40;
    detectedIntent = 'Falta de Tempo / Correria Operacional';
    identifiedObjectionCategory = 'TEMPO';
    keyPsychologicalTrigger = 'Respeito Absoluto ao Tempo do Empresário & Micro-Compromisso de 10 min';
    nextBestAction = 'Validar a correria da operação e pedir apenas 10 minutos no início da manhã';
  } else if (
    cleanText.includes('já tenho') || 
    cleanText.includes('já temos') || 
    cleanText.includes('outra agência') || 
    cleanText.includes('concorrente') ||
    cleanText.includes('fornecedor') ||
    cleanText.includes('equipe interna') ||
    cleanText.includes('já fazemos')
  ) {
    sentiment = 'cético';
    sentimentConfidence = 90;
    buyingSignalScore = 55;
    detectedIntent = 'Parceiro Existente / Equipe Interna';
    identifiedObjectionCategory = 'CONCORRENTE';
    keyPsychologicalTrigger = 'Elogio ao Parceiro Atual & Proposta de Somar com Diagnóstico Regional';
    nextBestAction = 'Não rivalizar com quem já atende, mas oferecer mapa estratégico complementar para a região';
  } else if (
    cleanText.includes('apresentação') || 
    cleanText.includes('manda por email') || 
    cleanText.includes('manda no whats') || 
    cleanText.includes('envia material') ||
    cleanText.includes('proposta') ||
    cleanText.includes('pdf')
  ) {
    sentiment = 'neutro';
    sentimentConfidence = 84;
    buyingSignalScore = 58;
    detectedIntent = 'Pedido de E-mail / Descarte Cordial';
    identifiedObjectionCategory = 'OUTROS';
    keyPsychologicalTrigger = 'Customização da Análise Local x Ineficácia de PDF Genérico';
    nextBestAction = 'Concordar gentilmente, mas justificar que uma rápida demonstração visual de 10 min é muito mais valiosa';
  } else if (
    cleanText.includes('interessante') || 
    cleanText.includes('como funciona') || 
    cleanText.includes('gostei') || 
    cleanText.includes('quero saber mais') ||
    cleanText.includes('pode agendar') ||
    cleanText.includes('vamos conversar') ||
    cleanText.includes('qual o próximo passo') ||
    cleanText.includes('vamos marcar')
  ) {
    sentiment = 'interessado';
    sentimentConfidence = 96;
    buyingSignalScore = 92;
    detectedIntent = 'Interesse Claro / Sinal Verde de Fechamento';
    identifiedObjectionCategory = 'OUTROS';
    keyPsychologicalTrigger = 'Fechamento Assuntivo Direto (Dois Horários Alternativos)';
    nextBestAction = 'Travar dia e horário no Google Meet imediatamente';
    isReadyForClosing = true;
  } else if (
    cleanText.includes('não quero') || 
    cleanText.includes('tira da lista') || 
    cleanText.includes('não me ligue') ||
    cleanText.includes('desliga')
  ) {
    sentiment = 'hostil';
    sentimentConfidence = 95;
    buyingSignalScore = 10;
    detectedIntent = 'Rejeição / Quebra de Rapport';
    identifiedObjectionCategory = 'CONFIANÇA';
    keyPsychologicalTrigger = 'Elegância Executiva & Desconexão Imediata';
    nextBestAction = 'Agradecer com máxima classe e desejar sucesso à operação';
  } else if (
    cleanText.includes('quem é você') || 
    cleanText.includes('quem indicou') || 
    cleanText.includes('garantia') || 
    cleanText.includes('funciona mesmo') ||
    cleanText.includes('qual a segurança') ||
    cleanText.includes('como você achou')
  ) {
    sentiment = 'cético';
    sentimentConfidence = 89;
    buyingSignalScore = 60;
    detectedIntent = 'Validação de Autoridade & Confiança';
    identifiedObjectionCategory = 'CONFIANÇA';
    keyPsychologicalTrigger = 'Autoridade CriaHub & Foco na Liderança de Mercado em ' + city;
    nextBestAction = 'Explicar a missão de selecionar a empresa de maior potencial da cidade para consolidar no topo';
  }

  // 2. Generate Real-time Verbal Rebuttal & WhatsApp Text Scripts
  let liveRebuttalScript = '';
  let whatsappQuickResponse = '';

  switch (identifiedObjectionCategory) {
    case 'PREÇO':
      if (isPt) {
        liveRebuttalScript = `Compreendo perfeitamente a vossa cautela, ${contactName}. E é exatamente por isso que estamos a conversar: a nossa engenharia na CriaHub é desenhada para não ser um custo fixo pesado, mas sim para se autofinanciar com novos clientes de alto ticket aqui no distrito de ${city}. Se eu lhe mostrar em 10 minutos como isso funciona na prática, faria sentido dar uma vista de olhos amanhã?`;
        whatsappQuickResponse = `Compreendo a 100%, ${contactName}! O nosso objetivo não é gerar custos pesados, mas sim alavancar os clientes de maior valor de *${city}* para a *${leadName}*. Se eu lhe enviar um áudio de 40 segundos com a estimativa prática, prefere ouvir hoje ou amanhã?`;
      } else {
        liveRebuttalScript = `Entendo perfeitamente sua cautela com custos, ${contactName}. E é justamente por isso que te liguei: o nosso modelo na CriaHub não é um gasto fixo pesado, mas sim uma engenharia cirúrgica que se paga logo no primeiro ciclo com os clientes de alto valor de ${city}. Se eu te provar isso na prática em 10 minutos, faria sentido dar uma olhada amanhã?`;
        whatsappQuickResponse = `Entendo 100%, ${contactName}! Nosso objetivo não é virar custo fixo, e sim fazer a *${leadName}* capturar os melhores clientes de *${city}* no automático. Vale batermos 5 minutos rápidos amanhã para eu te mostrar os números?`;
      }
      break;

    case 'TEMPO':
      if (isPt) {
        liveRebuttalScript = `Imagino perfeitamente a vossa azáfama com a operação, ${contactName}! Respeito 100% o seu tempo: só preciso de 10 minutos cirúrgicos no início da manhã de amanhã ou quinta-feira para lhe apresentar o mapa de expansão para a ${leadName} em ${city}. Qual horário lhe é mais conveniente?`;
        whatsappQuickResponse = `Compreendo a correria, ${contactName}! Não quero roubar o seu tempo. Posso enviar um resumo objetivo de 1 minuto sobre as oportunidades para a *${leadName}* em *${city}*, ou prefere falarmos 5 minutos amanhã às 10h?`;
      } else {
        liveRebuttalScript = `Imagino sua correria tocando a operação da ${leadName}, ${contactName}! Respeito 100% seu tempo: só preciso de 10 minutos cirúrgicos amanhã no início do dia para te entregar o mapa de alavancagem em ${city}. Fica melhor às 09h15 ou às 11h?`;
        whatsappQuickResponse = `Super entendo sua correria, ${contactName}! Não quero tomar seu tempo. Posso te mandar os 3 pontos de expansão que desenhamos para a *${leadName}* aqui na região, ou prefere falarmos 5 minutos amanhã cedo?`;
      }
      break;

    case 'CONCORRENTE':
      if (isPt) {
        liveRebuttalScript = `Excelente saber que já têm parceiros de apoio, ${contactName}! Parabéns pela visão. O meu intuito não é substituir ninguém que já vos atende, mas sim apresentar uma auditoria estratégica do mercado de ${city} que a sua própria equipa pode aproveitar para consolidar a ${leadName} no topo. Vale falarmos 10 minutos amanhã?`;
        whatsappQuickResponse = `Excelente saber que já têm essa frente ativa, ${contactName}! A ideia não é concorrer com ninguém, mas sim partilhar convosco uma análise de mercado de *${city}* que vai acelerar os vossos resultados. Podemos falar 10 minutos amanhã?`;
      } else {
        liveRebuttalScript = `Excelente saber que vocês já contam com parceiros, ${contactName}! Isso mostra a seriedade da ${leadName}. Nosso objetivo não é substituir ninguém, mas sim somar com uma análise de demanda regional de ${city} que sua própria equipe pode colocar em prática. Vale batermos 10 minutos rápidos amanhã?`;
        whatsappQuickResponse = `Muito bom saber que já têm parceiros, ${contactName}! Nosso foco não é substituir quem já te atende, e sim te entregar uma análise estratégica de expansão em *${city}*. Fica melhor batermos 10 min amanhã pela manhã ou à tarde?`;
      }
      break;

    case 'CONFIANÇA':
      if (isPt) {
        liveRebuttalScript = `${contactName}, tem toda a razão em querer máxima solidez. Acompanhamos de perto o mercado de ${category} em ${city} e sabemos que a ${leadName} é a empresa com maior prestígio técnico da região. É exatamente por isso que queremos unir a vossa experiência à nossa engenharia. Não peço qualquer decisão agora, apenas 10 minutos para lhe mostrar o projeto na tela.`;
        whatsappQuickResponse = `Faz todo o sentido a sua cautela, ${contactName}. Selecionamos apenas a empresa de maior prestígio de *${city}* para este projeto de consolidação. Dê uma olhada nos nossos cases e diga-me se faz sentido falarmos 10 min: [Link do Case]`;
      } else {
        liveRebuttalScript = `${contactName}, você tem toda razão em priorizar segurança. Acompanhamos o mercado de ${category} em ${city} e mapeamos que a ${leadName} é a operação mais séria e qualificada da região. Por isso mesmo escolhemos vocês para apresentar esse plano. Não peço decisão alguma hoje, apenas 10 minutos para você ver os números na tela.`;
        whatsappQuickResponse = `Faz total sentido seu cuidado, ${contactName}! Mapeamos a *${leadName}* como a principal autoridade de ${category} em *${city}*. Vale darmos uma olhada rápida de 10 min amanhã sem compromisso algum?`;
      }
      break;

    default:
      if (isReadyForClosing) {
        if (isPt) {
          liveRebuttalScript = `Perfeito, ${contactName}! Para customizarmos o plano de expansão da ${leadName} em ${city}, tenho disponibilidade amanhã às 10h15 ou às 14h30. Qual desses dois horários encaixa melhor na sua agenda?`;
          whatsappQuickResponse = `Excelente, ${contactName}! Vamos avançar sim. Para alinharmos os detalhes da *${leadName}*, qual horário lhe fica mais conveniente amanhã: 10h15 ou 14h30?`;
        } else {
          liveRebuttalScript = `Perfeito, ${contactName}! Para customizarmos o plano de expansão da ${leadName} em ${city}, tenho disponível amanhã às 10h15 ou às 14h30. Qual desses dois horários fica melhor para você?`;
          whatsappQuickResponse = `Sensacional, ${contactName}! Vamos avançar sim. Para alinharmos os detalhes da *${leadName}*, qual horário encaixa melhor para você amanhã: 10h15 ou 14h30?`;
        }
      } else {
        if (isPt) {
          liveRebuttalScript = `Com todo o gosto, ${contactName}! Envio o material sim. Mas para que não receba um documento genérico, diga-me: hoje a vossa maior prioridade na ${leadName} é consolidar a liderança no distrito de ${city} ou atrair clientes com tickets mais elevados?`;
          whatsappQuickResponse = `Com certeza, ${contactName}! Posso enviar sim. Só para que eu personalize para a realidade da *${leadName}* em *${city}*: a vossa prioridade é aumentar a autoridade regional ou fechar contratos de ticket maior?`;
        } else {
          liveRebuttalScript = `Com certeza, ${contactName}! Mando o material com o maior prazer. Mas para que eu não te mande um PDF genérico que não sirva para nada, me diga: a prioridade hoje na ${leadName} é acelerar os clientes de alto valor aqui em ${city} ou otimizar a velocidade de fechamento?`;
          whatsappQuickResponse = `Com certeza, ${contactName}! Mando sim. Só me confirme uma coisa para eu customizar para a *${leadName}*: o foco atual é capturar mais clientes de alto ticket em *${city}* ou acelerar as reuniões da diretoria?`;
        }
      }
      break;
  }

  // 3. Next Days Quick Meeting Slots
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString(isPt ? 'pt-PT' : 'pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });

  const suggestedMeetingTimes = [
    `Amanhã (${dateStr}) às 10h15`,
    `Amanhã (${dateStr}) às 14h30`,
    `Quinta-feira às 11h00`
  ];

  const criahubCrmNote = `[MASTER SDR COPILOT] Sentimento: ${sentiment.toUpperCase()} (${sentimentConfidence}%) | Sinal de Compra: ${buyingSignalScore}% | Objeção: ${detectedIntent} | Gatilho: ${keyPsychologicalTrigger} | Próxima Ação: ${nextBestAction}`;

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
    id: 'sc-concorrente',
    label: '🏢 "Já temos uma agência / equipe interna que cuida disso"',
    transcript: 'Agradeço o contato, mas nós já temos uma equipe interna e uma empresa terceirizada há bastante tempo que faz todo esse trabalho para nós.',
    category: 'CONCORRENTE'
  },
  {
    id: 'sc-tempo',
    label: '⏳ "Estou em correria / sem tempo agora"',
    transcript: 'Estou entrando em reunião com a diretoria agora e nossa semana está atolada de projetos. Não consigo ver isso no momento.',
    category: 'TEMPO'
  },
  {
    id: 'sc-preco',
    label: '💰 "Não temos verba / orçamento para novos custos agora"',
    transcript: 'Gostei do que você falou sobre o mercado, mas agora a nossa empresa está enxugando custos e sem verba para novos investimentos.',
    category: 'PREÇO'
  },
  {
    id: 'sc-email',
    label: '📄 "Manda uma proposta / apresentação por e-mail"',
    transcript: 'Pode me mandar o material com as informações no meu e-mail que depois eu dou uma olhada com calma e se fizer sentido eu retorno.',
    category: 'OUTROS'
  },
  {
    id: 'sc-fechamento',
    label: '🔥 "Gostei muito da visão, como fazemos para marcar?"',
    transcript: 'Achei muito interessante o posicionamento que você trouxe sobre a nossa cidade e a expansão da empresa. Como funciona para vermos essa apresentação?',
    category: 'FECHAMENTO'
  }
];
