import { Lead, BusinessProfile, ObjectionCrusherMatrix, ObjectionCrusherItem } from '../types';
import { getSavedCountry } from './countryService';

/**
 * MASTER SDR SALES OBJECTION CRUSHER & LIVE CALL MATRIX (+10 Anos de Experiência)
 * 
 * Psicologia de vendas de alto nível:
 * Validação de Autoridade -> Elogio à Excelência da Empresa -> Ancoragem em Expansão Local -> Fechamento Suave sem Atrito.
 */
export function buildObjectionCrusherMatrix(
  lead: Lead,
  myBusiness?: BusinessProfile | null
): ObjectionCrusherMatrix {
  const targetCountry = lead.country || getSavedCountry();
  const isPt = targetCountry.toLowerCase().includes('portugal') || targetCountry.toLowerCase().includes('pt');

  const companyName = lead.name || 'sua empresa';
  const decisionMakerName = lead.bantPlus?.authority?.keyDecisionMaker || lead.decisionMaker?.name || 'Diretoria';
  const firstName = decisionMakerName && !['Responsável', 'Diretoria', 'Responsável Comercial', 'CEO'].includes(decisionMakerName)
    ? decisionMakerName.split(' ')[0]
    : (isPt ? 'colega' : 'gestor');
  
  const niche = lead.category || 'empresas do seu segmento';
  const city = lead.city || 'sua cidade';
  const district = lead.address ? lead.address.split(',')[0] : (lead.city || 'sua região');
  
  // Contexto financeiro
  const budgetContext = lead.bantPlus?.budget?.estimatedRevenue 
    ? `${lead.bantPlus.budget.estimatedRevenue} (Porte: ${lead.bantPlus.budget.companySize || 'Médio'})`
    : 'Porte Comercial Ativo';

  // Objeção 1: "Já tenho uma agência/fornecedor que faz isso."
  const alreadyHaveProvider: ObjectionCrusherItem = {
    objection: isPt ? 'Já temos uma agência / equipa que cuida disso.' : 'Já tenho uma agência / fornecedor que faz isso.',
    psychologicalAngle: 'Validação e Elogio ao Parceiro Atual & Proposta de Somar com Mapa Regional',
    keyKeywords: ['agência', 'fornecedor', 'já temos', 'equipe interna', 'parceiro', 'equipa'],
    sdrGuidance: 'Parabenize a empresa por já investir e posicione-se como um consultor sênior trazendo um mapa de oportunidades locais que a própria equipe deles pode executar.',
    responseScript: isPt
      ? `Excelente saber que já têm esse apoio, ${firstName}! Isso demonstra a visão estratégica da ${companyName}. O motivo do meu contato não é concorrer com ninguém que já vos atende, mas sim entregar uma análise de demanda de alto ticket no distrito de ${city} que a sua própria equipa pode colocar em prática para consolidar vocês no topo absoluto. Vale batermos 10 minutos amanhã para eu vos apresentar esses dados?`
      : `Excelente saber que vocês já contam com parceiros, ${firstName}! Isso reflete o profissionalismo da ${companyName}. Meu objetivo não é de forma alguma substituir quem já te atende, mas sim somar com uma análise de expansão regional de ${city} que sua própria equipe interna pode usar para acelerar novos clientes de alto valor. Vale batermos 10 minutos rápidos amanhã para você ver esses dados?`
  };

  // Objeção 2: "Me envia uma proposta por e-mail."
  const sendByEmail: ObjectionCrusherItem = {
    objection: isPt ? 'Envie-me uma proposta / apresentação por e-mail.' : 'Me envia uma proposta por e-mail / WhatsApp.',
    psychologicalAngle: 'Personalização do Projeto Local & Ineficácia de Documentos Genéricos',
    keyKeywords: ['por email', 'manda apresentação', 'envia proposta', 'manda no zap', 'material', 'pdf'],
    sdrGuidance: 'Não envie PDFs estáticos que serão ignorados. Demonstre respeito explicando que a análise da cidade foi feita sob medida para eles.',
    responseScript: isPt
      ? `Com todo o gosto envio o material, ${firstName}, mas como desenhámos um estudo específico para a liderança da ${companyName} no concelho de ${city}, mandar um PDF genérico não faria justiça ao potencial da vossa empresa. Prefiro partilhar a tela convosco por apenas 10 minutos para verem o mapa de oportunidades ao vivo. Fica-lhe melhor amanhã às 10h15 ou às 14h30?`
      : `Com certeza posso te mandar, ${firstName}, mas como preparamos uma análise estratégica sob medida para a liderança da ${companyName} em ${city}, enviar um PDF genérico não mostraria o real valor. Prefiro compartilhar a tela com você por apenas 10 minutos para te mostrar os dados e as oportunidades da região. Fica melhor para você amanhã às 10h15 ou às 14h30?`
  };

  // Objeção 3: "Não temos orçamento no momento."
  const noBudget: ObjectionCrusherItem = {
    objection: isPt ? 'Não temos orçamento / verba no momento.' : 'Não temos orçamento / verba no momento.',
    psychologicalAngle: 'Engenharia Sem Custos Elevados & Payback Rápido no Mercado Regional',
    keyKeywords: ['sem verba', 'sem orçamento', 'muito caro', 'crise', 'cortando custos', 'sem dinheiro'],
    sdrGuidance: 'Mostre que a estratégia não é um custo fixo pesado, mas sim uma alavancagem cirúrgica desenhada para se pagar rapidamente.',
    responseScript: isPt
      ? `Compreendo perfeitamente a vossa cautela financeira, ${firstName}, e é justamente por isso que estamos a falar. A nossa metodologia na CriaHub não é um custo fixo pesado, mas sim uma engenharia de captação que se autofinancia com os primeiros contratos de alto ticket fechados aqui em ${city}. Se eu lhe demonstrar em 10 minutos como isso funciona sem risco financeiro, faria sentido avaliar?`
      : `Faz total sentido sua cautela financeira, ${firstName}, e é justamente por isso que te procurei. O modelo da CriaHub não é um custo fixo pesado, mas sim uma engenharia cirúrgica desenhada para se pagar logo no primeiro ciclo com os novos clientes capturados em ${city}. Se eu te provar em 10 minutos como o retorno é rápido e sem risco, você toparia dar uma olhada amanhã?`
  };

  // Objeção 4: "Não tenho tempo para falar agora."
  const noTime: ObjectionCrusherItem = {
    objection: isPt ? 'Não tenho tempo agora / Estou com muita azáfama.' : 'Não tenho tempo para falar agora / Estou na correria.',
    psychologicalAngle: 'Respeito Imediato ao Tempo do Empresário & Agendamento Cirúrgico',
    keyKeywords: ['sem tempo', 'ocupado', 'em reunião', 'liga depois', 'dirigindo', 'corrido', 'azáfama'],
    sdrGuidance: 'Reconheça a intensidade de gerenciar uma empresa líder, prometa brevidade de 10 segundos e marque um horário rápido.',
    responseScript: isPt
      ? `Imagino perfeitamente a azáfama a liderar a ${companyName}, ${firstName}! Respeito a 100% o seu tempo: só preciso de 10 minutos cirúrgicos amanhã de manhã para lhe entregar o estudo de expansão de ${city}. Fica-lhe melhor às 09h15 ou às 11h00?`
      : `Imagino sua correria tocando a operação da ${companyName}, ${firstName}! Respeito 100% seu tempo: só preciso de 10 minutos rápidos amanhã cedo para te entregar o mapa de oportunidades de ${city}. Fica melhor às 09h15 ou às 11h00?`
  };

  // Objeção 5: "Não tenho interesse."
  const notInterested: ObjectionCrusherItem = {
    objection: isPt ? 'Não temos interesse.' : 'Não tenho interesse.',
    psychologicalAngle: 'Desarme Empático com Foco no Domínio de Mercado Regional',
    keyKeywords: ['sem interesse', 'não quero', 'não preciso', 'obrigado', 'já estamos satisfeitos'],
    sdrGuidance: 'Agradeça com classe e faça uma pergunta sutil sobre a consolidação da liderança na cidade.',
    responseScript: isPt
      ? `Totalmente compreensível, ${firstName}, até porque a ${companyName} já tem uma posição de prestígio em ${city}. Se hoje vocês já capturam 100% dos clientes de topo da região sem deixar nada para a concorrência, faz todo sentido. Mas se houver interesse em blindar essa liderança sem custos pesados, valeria batermos 10 minutos amanhã?`
      : `Totalmente justo, ${firstName}, até porque a ${companyName} já é muito respeitada em ${city}. Se hoje vocês já absorvem todas as melhores oportunidades da região sem concorrência, realmente não faz sentido. Mas se você quiser ver como consolidar essa liderança número 1 sem custos pesados, me daria 10 minutos para tirarmos a dúvida na prática?`
  };

  // Objeção 6: "Vocês operam cá em Portugal? Onde estão sediados / são do Brasil?"
  const portugalLocalTrust: ObjectionCrusherItem = {
    objection: isPt ? 'Onde estão sediados? Vocês operam cá em Portugal?' : 'Onde fica a sede de vocês?',
    psychologicalAngle: 'Abrasileiramento Reverso: 3 Anos de Residência em Portugal & Foco em Rigor Corporativo Europeu',
    keyKeywords: ['portugal', 'sediados', 'brasil', 'onde ficam', 'escritório', 'local'],
    sdrGuidance: 'Afirme imediatamente os 3 anos de residência e operação direta em Portugal, suporte no fuso de Lisboa e rigor corporativo europeu, sem tom defensivo.',
    responseScript: isPt
      ? `Estamos sediados e a operar diretamente cá em Portugal há mais de 3 anos, ${firstName}, com suporte no fuso horário de Lisboa e trabalho prestado a empresas no eixo Lisboa / Porto. A nossa entrega é desenhada exclusivamente para as exigências fiscais e para o perfil rigoroso do mercado português. O nosso objetivo é eficiência técnica e retorno direto. Faria sentido vermos a estrutura amanhã em 10 minutos?`
      : `Estamos sediados e operando com estrutura corporativa completa, ${firstName}, atendendo diretamente o seu segmento com suporte dedicado e foco em ROI comprovado. Faria sentido vermos a estrutura amanhã em 10 minutos?`
  };

  // Bônus: Gatilhos de Fechamento Rápido (CTAs diretos para Google Calendar)
  const directEmail = lead.decisionMaker?.directEmail || lead.email || 'seu e-mail corporativo';
  
  const googleCalendarTransition = isPt
    ? `Perfeito, ${firstName}. Vou abrir a minha agenda aqui agora: tenho disponibilidade amanhã às 10h15 ou às 14h30 — qual desses horários lhe fica mais conveniente?`
    : `Perfeito, ${firstName}. Vou abrir minha agenda do Google Calendar aqui agora: tenho uma janela livre amanhã às 10h15 ou às 14h30 — qual desses dois horários fica melhor no seu dia?`;
  
  const executiveTwoOptionClose = isPt
    ? `Excelente. Já estou a preparar o convite do Google Meet para o seu e-mail (${directEmail}) para conversarmos 10 minutos focados. Prefere amanhã pela manhã ou à tarde?`
    : `Excelente. Já estou abrindo o Google Calendar para disparar o convite do Google Meet direto no seu e-mail (${directEmail}) para travarmos 10 minutos focados. Você prefere amanhã pela manhã ou à tarde?`;

  return {
    targetCompanyProfile: {
      name: companyName,
      decisionMaker: decisionMakerName,
      niche,
      mappedPain: `Expansão e liderança de mercado em ${city}`,
      technicalGapAnchor: `Posicionamento e captação de alto valor em ${city}`,
      budgetContext
    },
    objections: {
      alreadyHaveProvider,
      sendByEmail,
      noBudget,
      noTime,
      notInterested,
      portugalLocalTrust
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
  const decisionMaker = lead.decisionMaker?.name || 'Diretoria';
  const guestEmail = lead.decisionMaker?.directEmail || lead.email || '';
  const city = lead.city || 'Região';
  
  const eventTitle = encodeURIComponent(title || `Alinhamento Estratégico: ${companyName} x CriaHub (${city})`);
  
  const eventDetails = encodeURIComponent(
    details || `Reunião de Alinhamento Estratégico & Apresentação do Mapa de Expansão para ${companyName}.\n\n` +
    `Decisor: ${decisionMaker}\n` +
    `Cidade / Região: ${city}\n` +
    `Objetivo: Consolidar a liderança de mercado e captação de clientes qualificados sem custos pesados.\n\n` +
    `Sala de Reunião: Google Meet (gerada automaticamente).`
  );

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);
  
  const isoStart = tomorrow.toISOString().replace(/-|:|\.\d+/g, '');
  tomorrow.setMinutes(tomorrow.getMinutes() + 15);
  const isoEnd = tomorrow.toISOString().replace(/-|:|\.\d+/g, '');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${isoStart}/${isoEnd}&details=${eventDetails}&add=${encodeURIComponent(guestEmail)}`;
}
