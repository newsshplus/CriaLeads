import { Lead, BusinessProfile, CadenceMaster, CadenceStep } from '../types';
import { getSavedCountry } from './countryService';
import { purifyPtPtText } from './realtimeSdrAiOutreachService';

/**
 * Omnichannel Cadence Master
 * Estrutura a régua de relacionamento e follow-up outbound de 21 dias intercalando
 * WhatsApp, Email, Chamadas Telefônicas e LinkedIn com gatilho de parada automático.
 */
export function buildCadenceMaster(lead: Partial<Lead>, myBusiness?: BusinessProfile): CadenceMaster {
  const targetCountry = lead.country || getSavedCountry();
  const isPt = targetCountry.toLowerCase().includes('portugal') || targetCountry.toLowerCase().includes('pt');

  const company = lead.name || 'Empresa';
  const contact = lead.decisionMaker?.name || (isPt ? 'Estimado(a) Gestor(a)' : 'Diretor');
  const role = lead.decisionMaker?.role || (isPt ? 'Gerência Executiva' : 'Diretor Executivo');
  const pain = lead.identifiedPain || (isPt ? 'perda de contactos qualificados e processos manuais' : 'perda de oportunidades comerciais e processos manuais');
  const myName = myBusiness?.businessName || (isPt ? 'CriaHub Portugal' : 'Nossa Empresa');
  const myUvp = myBusiness?.uvp || (isPt ? 'engenharia de captação de clientes e automação qualificada' : 'automação inteligente e aceleração de vendas B2B');
  const city = lead.city || (isPt ? 'seu concelho' : 'sua região');
  const category = lead.category || (isPt ? 'empresas de referência' : 'empresas do setor');

  const steps: CadenceStep[] = [
    // DIA 1: Quebra de Padrão WhatsApp + Email #1 (AIDA Valor Direto)
    {
      day: 1,
      stepNumber: 1,
      title: isPt ? "Dia 1: Abertura & Quebra de Padrão (WhatsApp + E-mail AIDA)" : "Dia 1: Abertura & Quebra de Padrão (WhatsApp + Email AIDA)",
      primaryChannel: 'multichannel',
      objective: isPt ? "Causar impacto imediato com seriedade corporativa e entrega de valor técnico direto." : "Causar impacto imediato quebrando o padrão de vendas tradicional e entregando valor direto.",
      strategicContext: isPt 
        ? "Abertura dupla: mensagem direta no WhatsApp e e-mail executivo fundamentado na nossa operação de 3 anos cá em Portugal."
        : "Abertura dupla simultânea: mensagem informal e direta no WhatsApp com diagnóstico real, complementada com email executivo estruturado em AIDA.",
      status: 'pending',
      messages: [
        {
          channel: 'whatsapp',
          label: 'WhatsApp #1 (Quebra de Padrão)',
          content: isPt
            ? `Viva ${contact}, com os meus cumprimentos. Notei um ponto relevante na operação da ${company} em ${city}: especificamente ${pain.toLowerCase()}. Desenvolvemos uma estrutura para resolver isto sem sobrecarregar a vossa equipa. Teria 5 minutos nesta semana para lhe demonstrar este estudo de 1 página?`
            : `Oi ${contact}, tudo bem? Notei um ponto crítico na operação da ${company} em ${city}: especificamente ${pain.toLowerCase()}. Desenvolvemos uma abordagem para resolver isso sem custo de equipe extra. Teria 5 minutos nesta semana para eu te mostrar como destravar isso?`,
          cta: isPt ? 'Demonstração rápida de 5 minutos' : 'Ver demonstração de 5 minutos',
          notes: isPt ? 'Tom sóbrio e educado (PT-PT), sem gírias ou links invasivos.' : 'Mensagem com tom conversacional, sem jargões ou links longos para evitar bloqueio.'
        },
        {
          channel: 'email',
          label: 'Email #1 (AIDA - Valor Direto)',
          subject: isPt ? `${contact}, análise executiva sobre a ${company} (${city})` : `${contact}, notei uma oportunidade na ${company}`,
          content: isPt
            ? `Viva, ${contact}.\n\nEstive a analisar o posicionamento e a operação da ${company} e identifiquei uma oportunidade clara de otimização relativa a ${pain.toLowerCase()}.\n\nNa ${myName}, estamos sediados cá em Portugal há mais de 3 anos e apoiamos empresas no eixo Lisboa / Porto a superar este gargalo através de ${myUvp.toLowerCase()}.\n\nFaz sentido enviar-lhe um resumo executivo de 1 página com o diagnóstico que preparámos para a ${company}?\n\nCom os melhores cumprimentos,\nEquipa ${myName}`
            : `Olá, ${contact}.\n\nEstava analisando o posicionamento e operação da ${company} e notei uma oportunidade clara de otimização em relação a ${pain.toLowerCase()}.\n\nNa ${myName}, ajudamos empresas do setor de ${category} a superar exatamente esse gargalo através de ${myUvp.toLowerCase()}.\n\nConsegue receber um resumo executivo de 1 página com o diagnóstico que montamos para a ${company}?\n\nAbraços,\nEquipe ${myName}`,
          cta: isPt ? 'Receber diagnóstico executivo' : 'Solicitar diagnóstico de 1 página',
          notes: 'Estrutura AIDA com chamada para ação suave de baixo atrito.'
        }
      ]
    },

    // DIA 3: Email #2 (Estudo de Caso / Prova Social no mesmo nicho)
    {
      day: 3,
      stepNumber: 2,
      title: isPt ? "Dia 3: Prova Social & Rigor Técnico (E-mail #2)" : "Dia 3: Prova Social & Estudo de Caso (Email #2)",
      primaryChannel: 'email',
      objective: "Apresentar benchmark real e métricas de sucesso de empresa similar para criar validação de mercado.",
      strategicContext: "Se o prospect não respondeu no Dia 1, prova social com números concretos reduz o ceticismo do decisor.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: 'Email #2 (Estudo de Caso / Prova Social)',
          subject: isPt ? `Como resolvemos ${pain.toLowerCase()} para empresas em Portugal` : `Como resolvemos ${pain.toLowerCase()} para empresas de ${category}`,
          content: isPt
            ? `Viva, ${contact}.\n\nRecentemente apoiámos uma operação com perfil muito similar ao da ${company} que enfrentava exatamente ${pain.toLowerCase()}.\n\nO resultado após 45 dias:\n• +38% de eficiência no fluxo de conversão\n• Atendimento no telemóvel / WhatsApp em menos de 45 segundos\n• Retorno positivo com pacotes a partir de € 599\n\nPodemos replicar essa mesma esteira técnica na ${company}. O que lhe parece uma breve conversa de 10 minutos na quinta ou sexta?\n\nCom os melhores cumprimentos,\n${myName}`
            : `Olá, ${contact}.\n\nRecentemente apoiamos uma operação com perfil muito similar ao da ${company} que enfrentava exatamente ${pain.toLowerCase()}.\n\nO resultado após 45 dias:\n• +38% de eficiência no fluxo de conversão\n• Redução drástica no tempo de resposta a novos clientes\n• ROI positivo logo no primeiro mês\n\nPodemos replicar essa mesma esteira na ${company}. O que acha de uma conversa de 10 minutos na quinta ou sexta?\n\nAtenciosamente,\n${myName}`,
          cta: isPt ? 'Agendar conversa de 10 minutos' : 'Agendar call de 10 minutos',
          notes: 'Métricas claras geram urgência competitiva sem parecer forçado.'
        }
      ]
    },

    // DIA 5: Ligação Telefônica + WhatsApp de Lembrete
    {
      day: 5,
      stepNumber: 3,
      title: isPt ? "Dia 5: Chamada Telefónica Ativa + WhatsApp Sóbrio" : "Dia 5: Ligação Ativa + WhatsApp de Lembrete Rápido",
      primaryChannel: 'multichannel',
      objective: isPt ? "Abordagem por voz direta com consultor sénior e follow-up educado por WhatsApp." : "Abordagem por voz direta com pré-vendedor e follow-up gentil por WhatsApp caso caia na caixa postal.",
      strategicContext: "Intercalar canais frios (email) com voz e mensageria instantânea aumenta a taxa de resposta em até 3x.",
      status: 'pending',
      messages: [
        {
          channel: 'call',
          label: isPt ? 'Chamada Telefónica (Pitch de 15s)' : 'Ligação Telefônica (Pitch de 15s)',
          content: isPt
            ? `"${contact}, viva, daqui fala da ${myName}. Sei que está com a agenda preenchida na ${company}, pelo que serei bastante direto: identificámos um ponto em ${pain.toLowerCase()} que está a fazer perder oportunidades todos os meses. Tenho 2 apontamentos rápidos para partilhar consigo agora ou prefere que lhe ligue às 16h?"`
            : `"${contact}, tudo bem? Sei que está ocupado com a ${company}, serei direto: identifiquei uma brecha em ${pain.toLowerCase()} que está custando clientes todo mês. Tenho 2 insights rápidos para te passar agora ou prefere que eu te ligue às 16h?"`,
          cta: 'Transição para demonstração ou agendamento',
          notes: 'Usar o tom empático do Copiloto Objection Crusher para lidar com objeções em tempo real.'
        },
        {
          channel: 'whatsapp',
          label: 'WhatsApp #2 (Lembrete de Ligação)',
          content: isPt
            ? `Viva ${contact}. Tentei ligar-lhe brevemente há pouco, mas compreendo que estivesse em reunião. É relativo à análise de ${pain.toLowerCase()} que preparámos para a ${company}. Quando tiver 3 minutos disponíveis, dê-me um sinal por aqui por favor.`
            : `Oi ${contact}! Tentei te ligar rapidinho agora há pouco, mas imagino que estivesse em reunião. É sobre a análise de ${pain.toLowerCase()} que fizemos para a ${company}. Quando tiver 3 minutinhos livres me dá um toque por aqui!`,
          cta: 'Responder no WhatsApp',
          notes: 'Mensagem empática que justifica a tentativa de contato sem pressão.'
        }
      ]
    },

    // DIA 8: Email #3 (Conteúdo Educacional / Insight Técnico de Mercado)
    {
      day: 8,
      stepNumber: 4,
      title: isPt ? "Dia 8: Diagnóstico Técnico & Estudo de Mercado (E-mail #3)" : "Dia 8: Conteúdo Educacional & Insight de Mercado (Email #3)",
      primaryChannel: 'email',
      objective: "Educar o lead compartilhando um diagnóstico técnico e visão estratégica de concorrentes.",
      strategicContext: "Muda o foco de venda direta para consultoria e autoridade técnica.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: 'Email #3 (Insight de Mercado & Falhas Técnicas)',
          subject: isPt ? `Estudo técnico sobre ${pain.toLowerCase()} para a ${company}` : `Insight estratégico sobre ${pain.toLowerCase()} para ${company}`,
          content: isPt
            ? `Viva, ${contact}.\n\nAo analisarmos operações no concelho de ${city}, mapeámos que 7 em cada 10 empresas perdem contactos simplesmente por ${pain.toLowerCase()}.\n\nEstruturámos uma síntese com os 3 pontos fundamentais para a ${company} blindar esse gargalo:\n1. Resposta automática em tempo real no sítio web e telemóvel\n2. Triagem e qualificação prévia de pedidos\n3. Régua de acompanhamento estruturada\n\nSe tiver interesse no documento executivo em PDF, basta responder a este e-mail que envio de imediato.\n\nCom os melhores cumprimentos,\n${myName}`
            : `Olá, ${contact}.\n\nAo auditar operações de ${category} em ${city}, mapeamos que 7 a cada 10 empresas perdem vendas simplesmente por ${pain.toLowerCase()}.\n\nPreparamos uma lista com os 3 pontos mais fáceis de corrigir para a ${company} blindar esse gargalo:\n1. Automação de resposta em tempo real\n2. Qualificação prévia de demanda\n3. Régua de follow-up estruturada\n\nSe quiser o playbook completo em PDF, basta me responder este e-mail com "Quero o Playbook" que te envio imediatamente.\n\nUm abraço,\n${myName}`,
          cta: 'Responder para receber o Playbook',
          notes: 'Chamada para ação de zero risco gerando abertura de conversa.'
        }
      ]
    },

    // DIA 12: WhatsApp (Pergunta Objetiva Sim/Não / Micro-áudio)
    {
      day: 12,
      stepNumber: 5,
      title: "Dia 12: Micro-Abordagem Objetiva (WhatsApp Sim/Não)",
      primaryChannel: 'whatsapp',
      objective: "Reduzir o atrito cognitivo para quase zero com uma pergunta binária de fácil resposta rápida.",
      strategicContext: "Perguntas de 'Sim/Não' no WhatsApp têm taxa de resposta 4x maior que perguntas abertas em fases avançadas da cadência.",
      status: 'pending',
      messages: [
        {
          channel: 'whatsapp',
          label: 'WhatsApp #3 (Pergunta Binária Sim/Não)',
          content: isPt
            ? `Viva ${contact}, uma questão rápida de 5 segundos: ${pain.toLowerCase()} ainda é uma prioridade na ${company} para este trimestre ou já resolveram internamente? (Pode responder apenas com "Sim" ou "Não"!)`
            : `Oi ${contact}, uma dúvida rápida de 1 segundo: ${pain.toLowerCase()} ainda é uma prioridade na ${company} para este trimestre ou vocês já resolveram internamente? (Pode responder só com "Sim" ou "Não"!)`,
          cta: 'Resposta rápida de 1 palavra',
          notes: 'Excelente para filtrar leads desinteressados ou reativar decisores ocupados.'
        }
      ]
    },

    // DIA 16: Email #4 (Última Tentativa de Alto Valor Agregado)
    {
      day: 16,
      stepNumber: 6,
      title: isPt ? "Dia 16: Proposta de Valor Agregado & Auditoria Prévia (E-mail #4)" : "Dia 16: Proposta de Valor Agregado & Auditoria Gratuita (Email #4)",
      primaryChannel: 'email',
      objective: "Oferecer entrega tangível e diagnóstico sem compromisso para incentivar a resposta.",
      strategicContext: "Última cartada com oferta irresistível de consultoria/auditoria antes do fechamento de cadência.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: isPt ? 'Email #4 (Auditoria Executiva sem Compromisso)' : 'Email #4 (Auditoria Executiva sem Custo)',
          subject: isPt ? `${contact}, preparámos um diagnóstico técnico para a ${company}` : `${contact}, preparei um diagnóstico para a ${company}`,
          content: isPt
            ? `Viva, ${contact}.\n\nComo não tivemos oportunidade de conversar anteriormente, decidimos desenhar um diagnóstico preliminar com o mapeamento das brechas de ${pain.toLowerCase()} na ${company}.\n\nPodemos fazer um alinhamento de 10 minutos sem qualquer compromisso para lhe apresentar estas conclusões?\n\nQual destas opções é mais conveniente para si:\n• Terça-feira às 10h00\n• Quarta-feira às 15h30\n\nCom os melhores cumprimentos,\n${myName}`
            : `Olá, ${contact}.\n\nComo não conseguimos nos falar anteriormente, decidi estruturar um diagnóstico preliminar com o mapeamento das brechas de ${pain.toLowerCase()} na ${company}.\n\nPodemos fazer um alinhamento de 15 minutos sem compromisso para eu te apresentar as oportunidades que encontramos?\n\nQual desses horários funciona melhor para você:\n• Terça-feira às 10h00\n• Quarta-feira às 15h30\n\nAbraços,\n${myName}`,
          cta: 'Escolher um dos horários sugeridos',
          notes: 'Técnica de fechamento com duas opções específicas para facilitar a escolha da agenda.'
        }
      ]
    },

    // DIA 21: Email de Breakup (Desconexão elegante)
    {
      day: 21,
      stepNumber: 7,
      title: isPt ? "Dia 21: E-mail de Breakup / Desconexão Elegante" : "Dia 21: Email de Breakup / Desconexão Elegante",
      primaryChannel: 'email',
      objective: "Gatilho de perda e encerramento educado. Muitas vezes gera a resposta imediata por aversão à perda.",
      strategicContext: "O breakup email sinaliza respeito ao tempo do decisor e cria um senso de urgência final.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: 'Email de Breakup (Encerramento de Contatos)',
          subject: isPt ? `${contact}, autorização para encerrar os nossos contactos?` : `${contact}, permissão para encerrar nossos contatos?`,
          content: isPt
            ? `Viva, ${contact}.\n\nComo não obtivemos retorno às mensagens anteriores, assumo que otimizar ${pain.toLowerCase()} na ${company} não seja uma prioridade para a vossa equipa neste momento — e compreendo perfeitamente.\n\nVou retirar o seu contacto da nossa esteira de acompanhamento para respeitar a sua caixa de correio.\n\nSe no futuro fizer sentido avaliar soluções de ${myUvp.toLowerCase()}, tem os nossos dados por aqui.\n\nVotos de continuação de excelente trabalho e muito sucesso para a ${company}!\n\nCom os melhores cumprimentos,\n${myName}`
            : `Olá, ${contact}.\n\nComo não tive retorno nas mensagens anteriores, imagino que otimizar ${pain.toLowerCase()} na ${company} não seja uma prioridade para vocês neste momento — e está tudo bem!\n\nEstou retirando o seu contato da nossa lista de acompanhamento para não encher a sua caixa de entrada.\n\nSe no futuro fizer sentido destravar essa área com ${myUvp.toLowerCase()}, você já tem o meu contato por aqui.\n\nDesejo muito sucesso e bons negócios para a ${company}!\n\nAtenciosamente,\n${myName}`,
          cta: 'Última oportunidade de reabertura de conversa',
          notes: 'Costuma gerar até 25% de respostas de prospects ocupados que temiam perder o contato.'
        },
        {
          channel: 'whatsapp',
          label: 'WhatsApp Breakup (Opcional - Micro Despedida)',
          content: isPt
            ? `Viva ${contact}, estou a encerrar as tentativas de contacto por aqui para não incomodar a sua rotina. Se em algum momento fizer sentido otimizar ${pain.toLowerCase()} na ${company}, estamos sempre à disposição. Votos de muito sucesso!`
            : `Oi ${contact}, estou encerrando as tentativas de contato por aqui para não te incomodar. Se um dia precisarem destravar ${pain.toLowerCase()} na ${company}, conte com a gente. Sucesso para vocês!`,
          cta: 'Encerramento amigável',
          notes: 'Mensagem de despedida curta e elegante.'
        }
      ]
    }
  ];

  // If targeting Portugal, pass all contents through purifyPtPtText to guarantee 100% cleanliness
  const sanitizedSteps = isPt
    ? steps.map(step => ({
        ...step,
        messages: step.messages.map(msg => ({
          ...msg,
          content: purifyPtPtText(msg.content),
          subject: msg.subject ? purifyPtPtText(msg.subject) : undefined
        }))
      }))
    : steps;

  const now = new Date().toISOString();

  return {
    leadId: lead.id || 'lead-id',
    leadName: contact,
    companyName: company,
    totalDays: 21,
    totalSteps: 7,
    currentDay: 1,
    activeStepIndex: 0,
    isAutomationActive: true,
    leadResponded: false,
    stopTriggerRule: isPt 
      ? "Se o lead responder em QUALQUER canal, interromper imediatamente a cadência e atribuir ao consultor sénior com a etiqueta 'LEAD RESPONDEU - ASSUMIR ATENDIMENTO'."
      : "Se o lead responder em QUALQUER canal, interromper imediatamente a automação de follow-up e criar uma tarefa no CRM com tag 'LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO'.",
    crmStopPayload: {
      event: 'LEAD_RESPONDED_STOP_CADENCE',
      leadId: lead.id || 'lead-id',
      company: company,
      contactName: contact,
      channelDetected: 'WHATSAPP_OU_EMAIL_OU_CALL',
      tag: isPt ? 'LEAD RESPONDEU - ASSUMIR ATENDIMENTO' : 'LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO',
      priority: 'URGENTE',
      assignedSdrAction: isPt ? 'Interromper cadência de follow-up imediatamente e assumir contacto direto' : 'Interromper cadência de follow-up imediatamente e assumir conversa manual',
      timestamp: now
    },
    steps: sanitizedSteps
  };
}