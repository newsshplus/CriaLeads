import { Lead, BusinessProfile, ObjectionCrusherMatrix, ObjectionCrusherItem } from '../types';

/**
 * ELITE SALES OBJECTION CRUSHER & LIVE COLD CALL COPILOT ENGINE
 * 
 * Previsão analítica e geração de scripts de contorno em tempo real (máximo 3 frases)
 * com psicologia de vendas: Empatia -> Ancoragem em Brecha Real -> Quebra de Padrão & Fechamento.
 */

export function buildObjectionCrusherMatrix(
  lead: Lead,
  myBusiness?: BusinessProfile | null
): ObjectionCrusherMatrix {
  const companyName = lead.name || 'sua empresa';
  const decisionMakerName = lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Responsável';
  const firstName = decisionMakerName && !['Responsável', 'Diretoria', 'Responsável Comercial'].includes(decisionMakerName)
    ? decisionMakerName.split(' ')[0]
    : 'gestor';
  
  const niche = lead.category || 'empresas do seu segmento';
  
  // Brecha técnica concreta detectada
  const technicalGapAnchor = lead.keyFlaws?.[0] 
    || lead.bantPlus?.need?.operationalFlaws?.[0] 
    || lead.techStack?.vulnerabilitiesAndGaps?.[0]
    || lead.identifiedPain 
    || 'tempo de resposta elevado no primeiro contato e vazamento de leads no funil';
  
  const cleanTechnicalGap = technicalGapAnchor.replace(/^[0-9]\.\s*/, '').trim();

  // Dor mapeada principal
  const mappedPain = lead.identifiedPain || 'perda de oportunidades comerciais na triagem de leads';
  
  // Contexto financeiro
  const budgetContext = lead.bantPlus?.budget?.estimatedRevenue 
    ? `${lead.bantPlus.budget.estimatedRevenue} (Porte: ${lead.bantPlus.budget.companySize || 'Médio'})`
    : 'Porte Comercial Ativo';

  // Objeção 1: "Já tenho uma agência/fornecedor que faz isso."
  const alreadyHaveProvider: ObjectionCrusherItem = {
    objection: 'Já tenho uma agência / fornecedor que faz isso.',
    psychologicalAngle: 'Ancoragem em Brecha Técnica & Não-Conflito com Fornecedor Atual',
    keyKeywords: ['agência', 'fornecedor', 'já temos', 'equipe interna', 'parceiro'],
    sdrGuidance: 'Valide a existência do fornecedor e posicione-se como um auditor cirúrgico, não como concorrente.',
    responseScript: `Entendo perfeitamente, ${firstName}, e é ótimo saber que vocês já têm parceiros cuidando dessa área. O motivo do meu contato não é substituir quem já te atende, mas sim porque identifiquei uma brecha técnica em ${cleanTechnicalGap} na ${companyName} que pode estar vazando contatos qualificados. Vale batermos 10 minutos rápidos para eu te mostrar esse diagnóstico técnico e você mesmo repassar para sua equipe ajustar?`
  };

  // Objeção 2: "Me envia uma proposta por e-mail."
  const sendByEmail: ObjectionCrusherItem = {
    objection: 'Me envia uma proposta por e-mail.',
    psychologicalAngle: 'Quebra de Padrão do Descarte & Travamento de Agenda ao Vivo',
    keyKeywords: ['por email', 'manda apresentação', 'envia proposta', 'manda no zap', 'material'],
    sdrGuidance: 'Não envie PDF genérico. Desarme o pedido educadamente e proponha uma análise visual de 10 minutos.',
    responseScript: `Com certeza posso te enviar, ${firstName}, mas como nosso trabalho não é uma tabela de preços genérica e sim um diagnóstico sob medida para ${cleanTechnicalGap}, mandar um PDF agora só vai lotar sua caixa de entrada sem resolver o problema. Prefiro compartilhar a tela com você por apenas 10 minutos para te mostrar exatamente onde estão os gargalos operacionais da ${companyName}. Fica melhor para você nesta quinta às 10h15 ou às 14h30?`
  };

  // Objeção 3: "Não temos orçamento no momento."
  const noBudget: ObjectionCrusherItem = {
    objection: 'Não temos orçamento / verba no momento.',
    psychologicalAngle: 'Corte de Desperdício Operacional & Payback Imediato (ROI)',
    keyKeywords: ['sem verba', 'sem orçamento', 'muito caro', 'crise', 'cortando custos', 'sem dinheiro'],
    sdrGuidance: 'Mostre que a inação custa mais caro do que a solução e que o projeto se autofinancia com o estancamento de perdas.',
    responseScript: `Faz total sentido sua cautela financeira, ${firstName}, e é justamente por isso que estamos conversando. Nossa solução não é um custo fixo adicional, mas sim um mecanismo projetado para estancar perdas imediatas em ${cleanTechnicalGap} e se pagar logo nas primeiras semanas com as vendas recuperadas. Se eu te provar em 10 minutos com números reais que o retorno é rápido e sem risco, você toparia avaliar a demonstração?`
  };

  // Objeção 4: "Não tenho tempo para falar agora."
  const noTime: ObjectionCrusherItem = {
    objection: 'Não tenho tempo para falar agora / Estou ocupado.',
    psychologicalAngle: 'Micro-Pitch Cirúrgico de 10 Segundos & Respeito ao Tempo do Decisor',
    keyKeywords: ['sem tempo', 'ocupado', 'em reunião', 'liga depois', 'dirigindo', 'corrido'],
    sdrGuidance: 'Prometa brevidade absoluta de 10 segundos, solte a dor central e peça uma janela futura.',
    responseScript: `Prometo ser 100% cirúrgico: só preciso de 10 segundos para te dizer que mapeamos um gargalo pontual em ${cleanTechnicalGap} na ${companyName} que está custando clientes todo dia para vocês. Não quero atrapalhar sua rotina agora, só quero agendar 10 minutos na quinta-feira para te entregar esse mapa resolvido. O início da manhã ou após o almoço funciona melhor para você?`
  };

  // Objeção 5: "Não tenho interesse."
  const notInterested: ObjectionCrusherItem = {
    objection: 'Não tenho interesse.',
    psychologicalAngle: 'Desarmamento do Decisor com Pergunta Provocativa & Ponto Cego',
    keyKeywords: ['sem interesse', 'não quero', 'não preciso', 'obrigado', 'já estamos satisfeitos'],
    sdrGuidance: 'Aceite o desinteresse inicial e devolva uma pergunta técnica que exponha a vulnerabilidade da operação dele.',
    responseScript: `Totalmente justo, ${firstName}, até porque você ainda não viu o que descobrimos na análise operacional da ${companyName}. Se hoje vocês já conseguem capturar 100% das demandas sem perder nenhum lead qualificado por ${cleanTechnicalGap}, realmente não faz sentido avançarmos. Mas se você desconfia que pode haver dinheiro ficando na mesa nesse ponto cego, me daria 10 minutos para tirarmos a dúvida na prática?`
  };

  // Bônus: Gatilhos de Fechamento Rápido (CTAs diretos para Google Calendar)
  const directEmail = lead.decisionMaker?.directEmail || lead.email || 'seu e-mail principal';
  
  const googleCalendarTransition = `Perfeito, ${firstName}. Vou abrir minha agenda do Google Calendar aqui agora: tenho uma janela livre nesta quinta-feira às 10h15 ou na sexta-feira às 14h30 — qual desses dois horários encaixa melhor no seu dia?`;
  
  const executiveTwoOptionClose = `Excelente. Já estou abrindo o Google Calendar para disparar o convite do Google Meet direto no seu e-mail (${directEmail}) para travarmos 15 minutos focados. Você prefere que eu confirme para quinta pela manhã ou sexta à tarde?`;

  return {
    targetCompanyProfile: {
      name: companyName,
      decisionMaker: decisionMakerName,
      niche,
      mappedPain,
      technicalGapAnchor: cleanTechnicalGap,
      budgetContext
    },
    objections: {
      alreadyHaveProvider,
      sendByEmail,
      noBudget,
      noTime,
      notInterested
    },
    fastClosingCTAs: {
      googleCalendarTransition,
      executiveTwoOptionClose
    }
  };
}

/**
 * Gera URL de agendamento rápido do Google Calendar com parâmetros pré-preenchidos
 */
export function generateGoogleCalendarUrl(
  lead: Lead,
  title?: string,
  details?: string
): string {
  const companyName = lead.name || 'Lead';
  const decisionMaker = lead.decisionMaker?.name || 'Responsável';
  const guestEmail = lead.decisionMaker?.directEmail || lead.email || '';
  
  const eventTitle = encodeURIComponent(title || `Diagnóstico Estratégico: ${companyName} x Reunião de Alinhamento`);
  
  const eventDetails = encodeURIComponent(
    details || `Reunião de Diagnóstico Técnico & Apresentação de Solução para ${companyName}.\n\n` +
    `Decisor: ${decisionMaker}\n` +
    `Dor Central Mapeada: ${lead.identifiedPain || 'Otimização de Conversão e Automação'}\n` +
    `Gaps Identificados: ${(lead.keyFlaws || []).join('; ')}\n\n` +
    `Link da Sala: Reunião via Google Meet gerada automaticamente.`
  );

  // Calcula data padrão: próximo dia útil às 10:00 AM (1 hora de duração)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(10, 0, 0, 0);
  
  const endHour = new Date(tomorrow);
  endHour.setHours(10, 30, 0, 0);

  const formatIsoForGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d+/g, '');
  const dates = `${formatIsoForGCal(tomorrow)}/${formatIsoForGCal(endHour)}`;

  let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&details=${eventDetails}&dates=${dates}`;
  if (guestEmail && guestEmail.includes('@')) {
    url += `&add=${encodeURIComponent(guestEmail)}`;
  }

  return url;
}
