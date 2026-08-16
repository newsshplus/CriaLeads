import { Lead, BusinessProfile, CadenceMaster, CadenceStep } from '../types';

/**
 * Omnichannel Cadence Master
 * Estrutura a régua de relacionamento e follow-up outbound de 21 dias intercalando
 * WhatsApp, Email, Chamadas Telefônicas e LinkedIn com gatilho de parada automático.
 */
export function buildCadenceMaster(lead: Partial<Lead>, myBusiness?: BusinessProfile): CadenceMaster {
  const company = lead.name || 'Empresa';
  const contact = lead.decisionMaker?.name || 'Diretor';
  const role = lead.decisionMaker?.role || 'Diretor Executivo';
  const pain = lead.identifiedPain || 'perda de oportunidades comerciais e processos manuais';
  const myName = myBusiness?.businessName || 'Nossa Empresa';
  const myUvp = myBusiness?.uvp || 'automação inteligente e aceleração de vendas B2B';
  const city = lead.city || 'sua região';
  const category = lead.category || 'empresas do setor';

  const steps: CadenceStep[] = [
    // DIA 1: Quebra de Padrão WhatsApp + Email #1 (AIDA Valor Direto)
    {
      day: 1,
      stepNumber: 1,
      title: "Dia 1: Abertura & Quebra de Padrão (WhatsApp + Email AIDA)",
      primaryChannel: 'multichannel',
      objective: "Causar impacto imediato quebrando o padrão de vendas tradicional e entregando valor direto.",
      strategicContext: "Abertura dupla simultânea: mensagem informal e direta no WhatsApp com diagnóstico real, complementada com email executivo estruturado em AIDA.",
      status: 'pending',
      messages: [
        {
          channel: 'whatsapp',
          label: 'WhatsApp #1 (Quebra de Padrão)',
          content: `Oi ${contact}, tudo bem? Notei um ponto crítico na operação da ${company} em ${city}: especificamente ${pain.toLowerCase()}. Desenvolvemos uma abordagem para resolver isso sem custo de equipe extra. Teria 5 minutos nesta semana para eu te mostrar como destravar isso?`,
          cta: 'Ver demonstração de 5 minutos',
          notes: 'Mensagem com tom conversacional, sem jargões ou links longos para evitar bloqueio.'
        },
        {
          channel: 'email',
          label: 'Email #1 (AIDA - Valor Direto)',
          subject: `${contact}, notei uma oportunidade na ${company}`,
          content: `Olá, ${contact}.\n\nEstava analisando o posicionamento e operação da ${company} e notei uma oportunidade clara de otimização em relação a ${pain.toLowerCase()}.\n\nNa ${myName}, ajudamos empresas do setor de ${category} a superar exatamente esse gargalo através de ${myUvp.toLowerCase()}.\n\nConsegue receber um resumo executivo de 1 página com o diagnóstico que montamos para a ${company}?\n\nAbraços,\nEquipe ${myName}`,
          cta: 'Solicitar diagnóstico de 1 página',
          notes: 'Estrutura AIDA com chamada para ação suave de baixo atrito.'
        }
      ]
    },

    // DIA 3: Email #2 (Estudo de Caso / Prova Social no mesmo nicho)
    {
      day: 3,
      stepNumber: 2,
      title: "Dia 3: Prova Social & Estudo de Caso (Email #2)",
      primaryChannel: 'email',
      objective: "Apresentar benchmark real e métricas de sucesso de empresa similar para criar validação de mercado.",
      strategicContext: "Se o prospect não respondeu no Dia 1, prova social com números concretos reduz o ceticismo do decisor.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: 'Email #2 (Estudo de Caso / Prova Social)',
          subject: `Como resolvemos ${pain.toLowerCase()} para empresas de ${category}`,
          content: `Olá, ${contact}.\n\nRecentemente apoiamos uma operação com perfil muito similar ao da ${company} que enfrentava exatamente ${pain.toLowerCase()}.\n\nO resultado após 45 dias:\n• +38% de eficiência no fluxo de conversão\n• Redução drástica no tempo de resposta a novos clientes\n• ROI positivo logo no primeiro mês\n\nPodemos replicar essa mesma esteira na ${company}. O que acha de uma conversa de 10 minutos na quinta ou sexta?\n\nAtenciosamente,\n${myName}`,
          cta: 'Agendar call de 10 minutos',
          notes: 'Métricas claras geram urgência competitiva sem parecer forçado.'
        }
      ]
    },

    // DIA 5: Ligação Telefônica + WhatsApp de Lembrete
    {
      day: 5,
      stepNumber: 3,
      title: "Dia 5: Ligação Ativa + WhatsApp de Lembrete Rápido",
      primaryChannel: 'multichannel',
      objective: "Abordagem por voz direta com pré-vendedor e follow-up gentil por WhatsApp caso caia na caixa postal.",
      strategicContext: "Intercalar canais frios (email) com voz e mensageria instantânea aumenta a taxa de resposta em até 3x.",
      status: 'pending',
      messages: [
        {
          channel: 'call',
          label: 'Ligação Telefônica (Pitch de 15s)',
          content: `"${contact}, tudo bem? Sei que está ocupado com a ${company}, serei direto: identifiquei uma brecha em ${pain.toLowerCase()} que está custando clientes todo mês. Tenho 2 insights rápidos para te passar agora ou prefere que eu te ligue às 16h?"`,
          cta: 'Transição para demonstração ou agendamento',
          notes: 'Usar o tom empático do Copiloto Objection Crusher para lidar com objeções em tempo real.'
        },
        {
          channel: 'whatsapp',
          label: 'WhatsApp #2 (Lembrete de Ligação)',
          content: `Oi ${contact}! Tentei te ligar rapidinho agora há pouco, mas imagino que estivesse em reunião. É sobre a análise de ${pain.toLowerCase()} que fizemos para a ${company}. Quando tiver 3 minutinhos livres me dá um toque por aqui!`,
          cta: 'Responder no WhatsApp',
          notes: 'Mensagem empática que justifica a tentativa de contato sem pressão.'
        }
      ]
    },

    // DIA 8: Email #3 (Conteúdo Educacional / Insight Técnico de Mercado)
    {
      day: 8,
      stepNumber: 4,
      title: "Dia 8: Conteúdo Educacional & Insight de Mercado (Email #3)",
      primaryChannel: 'email',
      objective: "Educar o lead compartilhando um diagnóstico técnico e visão estratégica de concorrentes.",
      strategicContext: "Muda o foco de venda direta para consultoria e autoridade técnica.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: 'Email #3 (Insight de Mercado & Falhas Técnicas)',
          subject: `Insight estratégico sobre ${pain.toLowerCase()} para ${company}`,
          content: `Olá, ${contact}.\n\nAo auditar operações de ${category} em ${city}, mapeamos que 7 a cada 10 empresas perdem vendas simplesmente por ${pain.toLowerCase()}.\n\nPreparamos uma lista com os 3 pontos mais fáceis de corrigir para a ${company} blindar esse gargalo:\n1. Automação de resposta em tempo real\n2. Qualificação prévia de demanda\n3. Régua de follow-up estruturada\n\nSe quiser o playbook completo em PDF, basta me responder este e-mail com "Quero o Playbook" que te envio imediatamente.\n\nUm abraço,\n${myName}`,
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
          content: `Oi ${contact}, uma dúvida rápida de 1 segundo: ${pain.toLowerCase()} ainda é uma prioridade na ${company} para este trimestre ou vocês já resolveram internamente? (Pode responder só com "Sim" ou "Não"!)`,
          cta: 'Resposta rápida de 1 palavra',
          notes: 'Excelente para filtrar leads desinteressados ou reativar decisores ocupados.'
        }
      ]
    },

    // DIA 16: Email #4 (Última Tentativa de Alto Valor Agregado)
    {
      day: 16,
      stepNumber: 6,
      title: "Dia 16: Proposta de Valor Agregado & Auditoria Gratuita (Email #4)",
      primaryChannel: 'email',
      objective: "Oferecer entrega tangível e diagnóstico sem compromisso para incentivar a resposta.",
      strategicContext: "Última cartada com oferta irresistível de consultoria/auditoria antes do fechamento de cadência.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: 'Email #4 (Auditoria Executiva sem Custo)',
          subject: `${contact}, preparei um diagnóstico para a ${company}`,
          content: `Olá, ${contact}.\n\nComo não conseguimos nos falar anteriormente, decidi estruturar um diagnóstico preliminar com o mapeamento das brechas de ${pain.toLowerCase()} na ${company}.\n\nPodemos fazer um alinhamento de 15 minutos sem compromisso para eu te apresentar as oportunidades que encontramos?\n\nQual desses horários funciona melhor para você:\n• Terça-feira às 10h00\n• Quarta-feira às 15h30\n\nAbraços,\n${myName}`,
          cta: 'Escolher um dos horários sugeridos',
          notes: 'Técnica de fechamento com duas opções específicas para facilitar a escolha da agenda.'
        }
      ]
    },

    // DIA 21: Email de Breakup (Desconexão elegante)
    {
      day: 21,
      stepNumber: 7,
      title: "Dia 21: Email de Breakup / Desconexão Elegante",
      primaryChannel: 'email',
      objective: "Gatilho de perda e encerramento educado. Muitas vezes gera a resposta imediata por aversão à perda.",
      strategicContext: "O breakup email sinaliza respeito ao tempo do decisor e cria um senso de urgência final.",
      status: 'pending',
      messages: [
        {
          channel: 'email',
          label: 'Email de Breakup (Encerramento de Contatos)',
          subject: `${contact}, permissão para encerrar nossos contatos?`,
          content: `Olá, ${contact}.\n\nComo não tive retorno nas mensagens anteriores, imagino que otimizar ${pain.toLowerCase()} na ${company} não seja uma prioridade para vocês neste momento — e está tudo bem!\n\nEstou retirando o seu contato da nossa lista de acompanhamento para não encher a sua caixa de entrada.\n\nSe no futuro fizer sentido destravar essa área com ${myUvp.toLowerCase()}, você já tem o meu contato por aqui.\n\nDesejo muito sucesso e bons negócios para a ${company}!\n\nAtenciosamente,\n${myName}`,
          cta: 'Última oportunidade de reabertura de conversa',
          notes: 'Costuma gerar até 25% de respostas de prospects ocupados que temiam perder o contato.'
        },
        {
          channel: 'whatsapp',
          label: 'WhatsApp Breakup (Opcional - Micro Despedida)',
          content: `Oi ${contact}, estou encerrando as tentativas de contato por aqui para não te incomodar. Se um dia precisarem destravar ${pain.toLowerCase()} na ${company}, conte com a gente. Sucesso para vocês!`,
          cta: 'Encerramento amigável',
          notes: 'Mensagem de despedida curta e elegante.'
        }
      ]
    }
  ];

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
    stopTriggerRule: "Se o lead responder em QUALQUER canal, interromper imediatamente a automação de follow-up e criar uma tarefa no CRM com tag 'LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO'.",
    crmStopPayload: {
      event: 'LEAD_RESPONDED_STOP_CADENCE',
      leadId: lead.id || 'lead-id',
      company: company,
      contactName: contact,
      channelDetected: 'WHATSAPP_OU_EMAIL_OU_CALL',
      tag: 'LEAD RESPONDEU - ASSUMIR ATENDIMENTO HUMANO',
      priority: 'URGENTE',
      assignedSdrAction: 'Interromper cadência de follow-up imediatamente e assumir conversa manual',
      timestamp: now
    },
    steps
  };
}
