import { Lead, SdrOutreachTone, RealtimeSdrOutreach, PtPtSdrDialogueSimulation } from '../types';
import { executeAiCompletion } from './aiProviderService';
import { generateDeterministicPtPtDialogue } from './ptPtDialogueSimulationService';

export interface NicheOutreachBlueprint {
  nicheId: string;
  nicheLabel: string;
  typicalDecisor: string;
  corePain: string;
  specificGaps: string[];
  tones: Record<SdrOutreachTone, {
    toneLabel: string;
    callAnchor20s: (company: string, contact: string, city: string, gap: string, price?: string) => string;
    whatsappIcebreaker: (company: string, contact: string, city: string, gap: string, price?: string) => string;
    whatsappFollowup24h: (company: string, contact: string, city: string) => string;
    coldCallTeleprompter: (company: string, contact: string, city: string, gap: string) => string;
    objectionKiller: (contact: string, company: string) => string;
    nichePainDiagnosis: string;
  }>;
}

/**
 * REGRAS DE OURO DO "ABRASILEIRAMENTO REVERSO" E RIGOR PT-PT:
 * 1. Zero gírias brasileiras (proibido "legal", "trampo", "bacana", "beleza").
 * 2. Substituições obrigatórias:
 *    - "equipe" -> "equipa"
 *    - "fazer um site" -> "desenvolver um sítio web" ou "criar uma página web"
 *    - "celular" -> "telemóvel"
 *    - "loja virtual" -> "loja online"
 *    - "frete" -> "portes / envios"
 *    - "print" -> "captura de ecrã" ou "demonstração de 1 minuto"
 * 3. O gancho da proximidade local (3 anos em Portugal, fuso horário de Lisboa, eixo Lisboa/Porto).
 * 4. Foco no problema técnico e no ROI em Euros (€599+), sem atitude de "banho-maria" ou "vendedor de pechincha".
 * 5. Não pedir desculpas nem justificar nacionalidade — foco na excelência de entrega e autoridade técnica.
 */
export const PORTUGAL_B2B_VOCABULARY_RULES = [
  { br: 'equipe', pt: 'equipa' },
  { br: 'fazer um site', pt: 'desenvolver um sítio web' },
  { br: 'site', pt: 'sítio web' },
  { br: 'celular', pt: 'telemóvel' },
  { br: 'loja virtual', pt: 'loja online' },
  { br: 'frete', pt: 'portes' },
  { br: 'bacana', pt: 'interessante / relevante' },
  { br: 'legal', pt: 'ótimo / excelente' },
  { br: 'trampo', pt: 'trabalho / projeto' },
  { br: 'beleza', pt: 'perfeito / combinado' },
  { br: 'print', pt: 'demonstração rápida / captura' }
];

export const PORTUGAL_LOCAL_HOOK = (city: string) => 
  `Estou baseado aqui em Portugal (a colaborar com empresas no eixo ${city || 'Lisboa / Porto'} há mais de 3 anos no fuso de Lisboa)`;

export const PORTUGAL_ANTI_BIAS_REBUTTAL = 
  `"Estamos sediados e a operar diretamente cá em Portugal há mais de 3 anos, com suporte local no fuso de Lisboa e clientes no mercado nacional. A nossa estrutura é desenhada para responder às exigências fiscais e comerciais do mercado europeu. O nosso foco é a eficácia técnica e o retorno direto para a vossa empresa."`;

/**
 * Matriz Cirúrgica de Nichos em PT-PT Rigoroso (Abrasileiramento Reverso)
 * Roteiros que NUNCA usam jargões vazios de vendedores tradicionais,
 * atacando exatamente o vocabulário, dores e métricas de cada segmento em Portugal.
 */
export const NICHE_OUTREACH_BLUEPRINTS: Record<string, NicheOutreachBlueprint> = {
  // 1. ODONTOLOGIA, MEDICINA DENTÁRIA & IMPLANTOLOGIA
  odonto: {
    nicheId: 'odonto',
    nicheLabel: 'Clínica Dentária & Implantologia',
    typicalDecisor: 'Dr(a). Diretor(a) Clínico(a)',
    corePain: 'Taxa de faltas (no-show) acima de 25% e planos de tratamento e implantes parados no WhatsApp sem acompanhamento regular da receção.',
    specificGaps: [
      'Ausência de confirmação ativa e automática de consultas 24h e 2h antes via WhatsApp',
      'Orçamentos de reabilitação e implantes (€ 1.500 a € 7.500) sem régua de acompanhamento estruturada',
      'Sítio web lento sem triagem prévia de procedimentos de alto valor para a cadeira clínica'
    ],
    tones: {
      executivo_ceo: {
        toneLabel: 'Direto ao Diretor Clínico / Sócio',
        callAnchor20s: (company, contact, city) => 
          `"Dr. ${contact}, viva. Daqui fala o Gonçalo da CriaHub. Estou baseado cá em Portugal há 3 anos e sei da sua azáfama entre consultas na ${company}. Serei cirúrgico: clínicas dentárias em ${city} perdem em média 3 a 5 cadeiras por semana por falta de confirmação prévia no WhatsApp. Nós blindamos essa agenda sem sobrecarregar a receção. Consegue ouvir-me 60 segundos?"`,
        whatsappIcebreaker: (company, contact, city) =>
          `Dr. ${contact}, viva. Tudo bem?\n\nEstou baseado cá em Portugal e notei um ponto crítico comum em clínicas no distrito de ${city}: orçamentos de implantes e tratamentos de maior valor que a receção não consegue acompanhar com constância no WhatsApp.\n\nEstruturámos um fluxo automático de reativação que recuperou mais de € 8.400 em tratamentos pendentes numa clínica parceira no último mês.\n\nFaria sentido enviar-lhe uma demonstração rápida de 1 minuto de como funciona na prática?\n\nCom os melhores cumprimentos,\nGonçalo | CriaHub Portugal`,
        whatsappFollowup24h: (company, contact, city) =>
          `Dr. ${contact}, compreendo perfeitamente que o dia clínico esteja intenso. Caso queira ver como reduzir as faltas de consultas para menos de 5% na ${company}, deixe-me uma mensagem por aqui quando tiver 2 minutos. Continuação de excelente trabalho!`,
        coldCallTeleprompter: (company, contact, city) =>
          `"Viva Dr. ${contact}! É o responsável clínico da ${company}? Perfeito. Estou a ligar rapidamente porque identifiquei que a agenda de avaliações da clínica em ${city} está com quebras de comparência. Nós automatizamos a confirmação e a reativação de orçamentos antigos diretamente pelo WhatsApp no fuso de Lisboa. Teria 5 minutos na quinta-feira para lhe mostrar como preencher essas cadeiras ociosas?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, Dr. ${contact}. Não pretendo tomar o seu tempo de consultório. Apenas validar se recuperar 4 a 6 orçamentos já avaliados faz sentido para a faturação da clínica este mês."`,
        nichePainDiagnosis: 'Ociosidade na cadeira clínica por no-show de pacientes e falta de tempo da receção para reativar orçamentos abertos.'
      },
      gatilho_gap: {
        toneLabel: 'Gatilho de GAP Operacional Técnico',
        callAnchor20s: (company, contact, city) =>
          `"Dr. ${contact}, viva. Ao analisar o canal de atendimento da ${company}, notei que o tempo de resposta aos novos pacientes no WhatsApp ultrapassa os 40 minutos em horários de pico. Nesse intervalo, o paciente que pesquisou no Google já agendou com outro consultório em ${city}. Desenhámos a solução exata para isso."`,
        whatsappIcebreaker: (company, contact, city) =>
          `Dr. ${contact}, viva. Testei o canal de marcação da ${company} e verifiquei que a resposta demora a acontecer fora do horário da receção.\n\nPacientes que procuram implantes ou alinhadores ao fim do dia costumam fechar com a primeira clínica que responde em menos de 2 minutos.\n\nIntegrámos uma solução inteligente que qualifica o procedimento e agenda na hora 24/7. Vale uma análise rápida de 2 minutos?`,
        whatsappFollowup24h: (company, contact) =>
          `Dr. ${contact}, passando só para saber se teve oportunidade de avaliar o ponto de melhoria no atendimento da ${company}. Se preferir, envio uma breve nota de voz de 30 segundos.`,
        coldCallTeleprompter: (company, contact) =>
          `"Dr. ${contact}, reparei que na ${company} o paciente que solicita informações pelo sítio web não recebe triagem imediata. Nós eliminamos essa perda ligando um assistente que identifica logo se é implante, ortodontia ou rotina antes de passar à receção. Fica-lhe melhor falarmos amanhã às 11h ou às 15h?"`,
        objectionKiller: (contact) =>
          `"Precisamente por a vossa receção já ser muito solicitada, Dr. ${contact}! O nosso sistema retira 80% das dúvidas repetitivas, permitindo que a equipa se concentre no fecho de planos de tratamento de maior valor."`,
        nichePainDiagnosis: 'Falta de atendimento instantâneo (resposta > 40 min) faz pacientes migrarem para concorrentes locais no Google Maps.'
      },
      estudo_caso: {
        toneLabel: 'Estudo de Caso & Benchmark Nacional',
        callAnchor20s: (company, contact, city) =>
          `"Dr. ${contact}, viva. Recentemente apoiámos uma clínica em ${city} com o mesmo perfil da ${company} a recuperar 31 pacientes que tinham feito plano de tratamento e não avançaram no trimestre passado. Gerou mais de € 14.500 em procedimentos adicionais. Gostaria de ver o formato exato que utilizámos?"`,
        whatsappIcebreaker: (company, contact, city) =>
          `Dr. ${contact}, boa tarde. Um indicador concreto do seu setor em ${city}:\n\nUma clínica dentária parceira estava com 24% de faltas nas primeiras consultas. Em 30 dias de fluxo estruturado, o no-show caiu para 5.8% e 19 pacientes antigos regressaram para concluir tratamentos de reabilitação.\n\nConsigo apresentar-lhe a estrutura em 5 minutos no ecrã esta semana?`,
        whatsappFollowup24h: (company, contact) =>
          `Dr. ${contact}, viva. Separei o resumo em PDF com as métricas da clínica parceira. Se fizer sentido analisar, é só indicar-me por aqui!`,
        coldCallTeleprompter: (company, contact, city) =>
          `"Dr. ${contact}, não se trata de promessas de marketing digital: são números reais de consultório. Aplicámos uma metodologia em clínicas em ${city} que aumentou em 38% o comparecimento nas avaliações. Só preciso de 3 minutos para julgar se faz sentido para a ${company}."`,
        objectionKiller: (contact) =>
          `"Compreendo que já tenha feito experiências anteriores, Dr. ${contact}. A diferença é que não geramos contactos curiosos — trabalhamos exclusivamente a base que já visitou a vossa clínica e não concluiu o plano."`,
        nichePainDiagnosis: 'Base histórica de centenas de fichas de pacientes inativa sem uma estratégia ativa de acompanhamento.'
      },
      quebra_padrao: {
        toneLabel: 'Quebra de Padrão (Sem Rodeios)',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Serei muito direto porque sei que os médicos dentistas dispensam chamadas de televendas. Não lhe vou pedir meia hora de reunião: identifiquei uma quebra concreta de faturação na ${company} e quero apenas partilhar a solução numa demonstração rápida de 1 minuto. Se não fizer sentido, não voltamos a contactar. Pode ser?"`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, direto ao ponto: não somos uma agência a tentar vender publicações genéricas para redes sociais.\n\nIdentifiquei uma oportunidade real na conversão de novos pacientes da ${company} que está a custar consultas todos os meses.\n\nSe lhe enviar uma demonstração de 40 segundos a mostrar o ponto exato, teria oportunidade de ver?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Apenas uma confirmação antes de encerrar o contacto por aqui: o ponto de melhoria no sítio web continua ativo. Se pretender otimizar, estarei por aqui. Continuação de bom trabalho!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, poupo-lhe tempo: identifiquei exatamente onde os vossos pacientes de tratamentos de valor mais elevado estão a desistir antes de sentarem na cadeira da ${company}. Mostro-lhe em 2 minutos na quinta ou prefere na sexta?"`,
        objectionKiller: (contact) =>
          `"Sem qualquer problema, ${contact}. Se já estiver com a agenda a 100% e 0% de faltas, de facto a nossa intervenção não é necessária!"`,
        nichePainDiagnosis: 'Ceticismo com agências de fora que não entendem o dia a dia da clínica nem as normas da Ordem dos Médicos Dentistas.'
      }
    }
  },

  // 2. ADVOCACIA, SOCIEDADES DE ADVOGADOS & JURÍDICO
  advocacia: {
    nicheId: 'advocacia',
    nicheLabel: 'Sociedade de Advogados & Direito Empresarial',
    typicalDecisor: 'Dr(a). Sócio(a)-Gerente / Sócio(a) Administrador(a) (OA)',
    corePain: 'Captação de clientes corporativos dependente exclusivamente de recomendações pessoais e ausência de canal sistemático para aceder a administradores e CFOs de médias empresas.',
    specificGaps: [
      'Ausência de prospeção ativa B2B focada em administradores e CFOs de empresas no eixo Lisboa / Porto',
      'Sítio web institucional estático sem páginas dedicadas a teses fiscais, societárias e laborais de alta conversão',
      'Falta de esteira de qualificação para avenças jurídicas corporativas superiores a € 1.500/mês'
    ],
    tones: {
      executivo_ceo: {
        toneLabel: 'Executivo para Sócio-Gerente',
        callAnchor20s: (company, contact, city) =>
          `"Dr. ${contact}, viva. Falo com o sócio-gerente da ${company}? Estou baseado cá em Portugal há 3 anos e serei muito objetivo: sociedades de advogados em ${city} costumam depender 100% de referências esporádicas. Estruturámos uma esteira que mapeia e aborda diretamente CFOs e administradores de médias empresas com teses fiscais e societárias estruturadas. Gostaria de perceber se têm capacidade para acolher novas avenças corporativas."`,
        whatsappIcebreaker: (company, contact, city) =>
          `Dr. ${contact}, boa tarde.\n\nEstou sediado aqui em Portugal e, ao analisar o posicionamento da ${company} em ${city}, notei que a sociedade possui forte competência societária e fiscal, mas sem um canal ativo focado em CFOs e diretores industriais da região.\n\nEstruturámos um mecanismo consultivo que gerou 8 reuniões qualificadas com empresas de faturação superior a € 3M para uma sociedade parceira.\n\nFaria sentido receber um resumo executivo de 1 página sobre como aplicar na ${company}?\n\nCom os melhores cumprimentos,\nGonçalo | CriaHub Portugal`,
        whatsappFollowup24h: (company, contact) =>
          `Dr. ${contact}, compreendo perfeitamente os prazos e audiências do foro. Guardei o resumo executivo; se considerar oportuno avaliar quando tiver 3 minutos, terei todo o gosto em partilhar.`,
        coldCallTeleprompter: (company, contact, city) =>
          `"Dr. ${contact}, não pretendo ocupar o seu tempo de trabalho forense. Identifiquei cerca de 35 empresas industriais e comerciais em ${city} com perfil adequado para assessoria jurídica preventiva que estão desacompanhadas. Como avalia a expansão de clientes com avença fixa na ${company} este semestre?"`,
        objectionKiller: (contact) =>
          `"Totalmente de acordo, Dr. ${contact}. A deontologia e as normas da Ordem dos Advogados são estritamente respeitadas: não se trata de publicidade mercantilista, mas sim de abordagem institucional B2B baseada em autoridade técnica e rigor corporativo."`,
        nichePainDiagnosis: 'Dependência exclusiva do networking pessoal dos sócios sem previsibilidade de novas avenças empresariais.'
      },
      gatilho_gap: {
        toneLabel: 'Gatilho de GAP Técnico & SEO Local',
        callAnchor20s: (company, contact, city) =>
          `"Dr. ${contact}, viva. Notei que o sítio web da ${company} não dispõe de páginas indexadas para as recentes atualizações no regime fiscal e societário, que é a maior preocupação atual dos gestores em ${city}. Estão a deixar de receber pedidos diretos de administradores de empresas."`,
        whatsappIcebreaker: (company, contact, city) =>
          `Dr. ${contact}, viva. Ao analisar a presença digital da ${company}, verifiquei que gestores e investidores que procuram apoio societário, fiscal ou reestruturação patrimonial em ${city} não encontram a sociedade nas posições de topo das pesquisas corporativas.\n\nOtimizar este ponto costuma gerar de 2 a 4 consultas empresariais qualificadas por mês.\n\nPodemos falar 3 minutos na quinta-feira?`,
        whatsappFollowup24h: (company, contact) =>
          `Dr. ${contact}, viva. Apenas um toque breve: elaborei uma análise sumária da visibilidade corporativa das sociedades na região de ${company}. Deseja receber em PDF?`,
        coldCallTeleprompter: (company, contact) =>
          `"Dr. ${contact}, identifiquei que a vossa sociedade tem capacidade técnica muito superior à dos concorrentes que dominam atualmente as pesquisas corporativas na região. Vale 5 minutos para ver como assegurar essa presença de topo?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, Dr. ${contact}. Se a carteira atual já absorve a capacidade total e não procuram clientes de maior valor de avença, compreendo que queiram manter o rumo atual."`,
        nichePainDiagnosis: 'Concorrentes com menor solidez técnica a captar clientes empresariais por terem uma presença web e SEO mais dinâmicos.'
      },
      estudo_caso: {
        toneLabel: 'Estudo de Caso & Prova Social Jurídica',
        callAnchor20s: (company, contact, city) =>
          `"Dr. ${contact}, viva. Apoiámos recentemente uma sociedade de direito comercial em ${city} a fechar 4 novos contratos de avença jurídica preventiva em 60 dias abordando diretores de operações pelo LinkedIn. Gostaria de ver o formato exato das mensagens?"`,
        whatsappIcebreaker: (company, contact, city) =>
          `Dr. ${contact}, como está? Um dado concreto do vosso mercado em ${city}:\n\nApoiei recentemente uma sociedade focada em direito dos negócios que contratualizou mais de € 7.500 em avenças mensais recorrentes em 45 dias, através de uma régua estritamente consultiva e sóbria via LinkedIn e contacto corporativo.\n\nConsigo mostrar-lhe a abordagem em 5 minutos nesta quinta-feira?`,
        whatsappFollowup24h: (company, contact) =>
          `Dr. ${contact}, caso pretenda consultar o resumo sobre as avenças corporativas, disponha por aqui. Uma excelente semana de trabalho!`,
        coldCallTeleprompter: (company, contact, city) =>
          `"Dr. ${contact}, é um contacto breve entre profissionais: temos um modelo validado que aproxima sociedades a decisores de médias empresas em ${city}. Fica-lhe melhor conversarmos na quarta às 14h ou sexta às 10h?"`,
        objectionKiller: (contact) =>
          `"Completamente de acordo, Dr. ${contact}. Os serviços jurídicos fecham-se na confiança e na reputação. O nosso papel é unicamente colocá-lo em contacto com quem tem poder de decisão na empresa."`,
        nichePainDiagnosis: 'Dificuldade em abrir portas em empresas de média dimensão sem indicação prévia.'
      },
      quebra_padrao: {
        toneLabel: 'Quebra de Padrão (Sem Enrolação)',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Sei que os advogados têm pouca tolerância para promessas fáceis de agências. Não lhe vou falar de publicidade nas redes: identifiquei uma brecha clara na captação de clientes corporativos da ${company}. Mostro-lhe em 90 segundos. Se considerar desadequado, encerramos de imediato."`,
        whatsappIcebreaker: (company, contact) =>
          `Dr. ${contact}, serei muito direto: a vossa sociedade não necessita de seguidores em redes sociais, necessita de avenças corporativas sólidas de € 1.500+ por mês.\n\nMapeei 18 empresas na sua região com necessidades de apoio legal regular sem assessoria fixa. Deseja que lhe remeta essa listagem?`,
        whatsappFollowup24h: (company, contact) =>
          `Dr. ${contact}, a listagem de empresas com o perfil pretendido continua disponível. Se tiver interesse em consultar, basta responder-me por aqui.`,
        coldCallTeleprompter: (company, contact) =>
          `"Dr. ${contact}, não somos intermediários de contactos genéricos. Identificámos necessidades societárias em empresas da sua área geográfica que a vossa sociedade pode absorver. Vale 3 minutos de conversa ou prefere que encerre o assunto?"`,
        objectionKiller: (contact) =>
          `"Com certeza, Dr. ${contact}. Se a sociedade não tiver interesse em expandir a carteira de empresas de momento, agradeço a atenção e votos de sucesso!"`,
        nichePainDiagnosis: 'Aversão justificada a contactos de marketing agressivo que ignoram a sobriedade da advocacia.'
      }
    }
  },

  // 3. CONTABILIDADE, FISCALIDADE & BPO FINANCEIRO
  contabilidade: {
    nicheId: 'contabilidade',
    nicheLabel: 'Contabilidade Consultiva & BPO Financeiro',
    typicalDecisor: 'Contabilista Certificado(a) (OCC) / Sócio(a)-Gerente',
    corePain: 'Pressão constante nos honorários de contabilidade básica (€ 150 a € 350) e dificuldade em vender serviços de valor acrescentado como BPO Financeiro, consultoria de gestão e planeamento fiscal (€ 1.200 a € 3.500/mês).',
    specificGaps: [
      'Sítio web focado em obrigações declarativas (IVA, IRC, SAF-T) sem destacar otimização fiscal e apoio à gestão',
      'Falta de simulador interativo de benefícios fiscais (RFAI, SIFIDE, DLRR) para atrair PMEs com maior volume de negócios',
      'Ausência de triagem automática no WhatsApp que filtre empresas com faturação superior a € 500k/ano'
    ],
    tones: {
      executivo_ceo: {
        toneLabel: 'Foco em Margem & Avenças de Gestão',
        callAnchor20s: (company, contact, city) =>
          `"${contact}, viva. Falo com o sócio-gerente da ${company}? Estou baseado cá em Portugal há 3 anos e serei muito direto: a maioria dos gabinetes de contabilidade em ${city} enfrenta uma pressão contínua nas avenças baixas. Apoiamos gabinetes a captar PMEs com contratos de BPO Financeiro e consultoria de gestão de € 1.200 a € 3.000/mês. Gostaria de perceber se essa é uma prioridade para a ${company}."`,
        whatsappIcebreaker: (company, contact, city) =>
          `Olá ${contact}, viva. Tudo bem?\n\nEstou baseado aqui em Portugal e notei que a ${company} dispõe de uma excelente estrutura em ${city}, mas o mercado da contabilidade tradicional está cada vez mais comprimido por honorários reduzidos.\n\nEstruturámos um funil focado especificamente em atrair PMEs e médias empresas que procuram BPO Financeiro, apoio à tesouraria e planeamento de IRC.\n\nTeria 5 minutos nesta quinta-feira para lhe apresentar o modelo de captação?\n\nCumprimentos,\nGonçalo | CriaHub Portugal`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Sei bem como a época de fecho de IVA e obrigações declarativas é exigente. Quando tiver uma janela de 2 minutos e quiser ver como valorizar o valor médio das avenças na ${company}, deixe-me uma mensagem por aqui.`,
        coldCallTeleprompter: (company, contact, city) =>
          `"${contact}, estou a ligar porque verifiquei que o vosso gabinete apoia empresas no concelho de ${city}. Desenvolvemos um mecanismo que atrai gestores que procuram mudar de contabilista antes do início do próximo ano fiscal. Vale 3 minutos de conversa na quinta às 15h?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, ${contact}. A sua equipa não necessita de se preocupar com tarefas comerciais: entregamos a reunião já agendada com o empresário qualificado pela faturação e dimensão da empresa."`,
        nichePainDiagnosis: 'Sobrecarga da equipa de contabilidade com clientes que pagam pouco e exigem suporte constante.'
      },
      gatilho_gap: {
        toneLabel: 'Gatilho de GAP do Sítio Web e Triagem',
        callAnchor20s: (company, contact, city) =>
          `"${contact}, viva. Analisei o formulário de contacto da ${company} e verifiquei que não pergunta o volume de negócios nem o número de trabalhadores da empresa interessada. Isso atrai clientes que procuram apenas preços mínimos e faz com que o gabinete perca tempo precioso."`,
        whatsappIcebreaker: (company, contact, city) =>
          `Olá ${contact}, viva. Ao analisar o canal de entrada da ${company}, constatei que uma microempresa sem movimento cai exatamente no mesmo canal que uma PME de elevado valor.\n\nImplementámos uma triagem inteligente que qualifica faturação, setor de atividade e necessidades em 30 segundos no WhatsApp antes de passar para a vossa equipa.\n\nPodemos ver uma demonstração rápida em 3 minutos?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Passando apenas para saber se teve oportunidade de verificar a triagem para gabinetes de contabilidade. Se desejar, partilho um vídeo sumário de 1 minuto.`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, serei prático: a sua equipa está a despender tempo em propostas que raramente fecham. Nós filtramos os contactos para falar apenas com empresas com faturação superior a € 300.000/ano. Fica-lhe melhor conversarmos amanhã ou na quinta?"`,
        objectionKiller: (contact) =>
          `"Precisamente por isso, ${contact}! Sendo o seu tempo escasso, só faz sentido reunir com empresários com capacidade para pagar os honorários que a vossa competência técnica merece."`,
        nichePainDiagnosis: 'Perda de tempo de contabilistas sénior em reuniões com contactos sem orçamento.'
      },
      estudo_caso: {
        toneLabel: 'Estudo de Caso & Prova Social de Gabinetes',
        callAnchor20s: (company, contact, city) =>
          `"${contact}, viva. No mês passado apoiámos um gabinete de contabilidade em ${city} a contratualizar 6 novas avenças de BPO e assessoria de gestão com valor médio de € 1.450/mês. Gostaria de conhecer o processo exato que utilizaram?"`,
        whatsappIcebreaker: (company, contact, city) =>
          `${contact}, boa tarde. Um exemplo prático do seu setor em Portugal:\n\nUm gabinete parceiro migrou 12 clientes tradicionais para uma avença alargada de BPO Financeiro e captou mais 4 novas PMEs em 60 dias, aumentando a receita recorrente em mais de € 9.500/mês.\n\nTeria 5 minutos para ver como estruturámos esse modelo?`,
        whatsappFollowup24h: (company, contact) =>
          `${contact}, viva. Tenho disponível a síntese do caso de sucesso com a estrutura de BPO. Se quiser consultar, basta confirmar-me!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, não são teorias: mostramos no ecrã os contratos celebrados por gabinetes da mesma dimensão da ${company}. Posso mostrar-lhe em 3 minutos na quinta. Seria conveniente?"`,
        objectionKiller: (contact) =>
          `"Com certeza, ${contact}. Sabemos que um contabilista não se orienta por promessas vagas, mas sim por balancetes, rácios e resultados demonstráveis. É precisamente isso que pretendo partilhar."`,
        nichePainDiagnosis: 'Dificuldade em demonstrar o valor tangível da contabilidade como ferramenta de apoio à decisão do empresário.'
      },
      quebra_padrao: {
        toneLabel: 'Quebra de Padrão (Sem Rodeios)',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Serei muito rápido: sei que os contabilistas dispensam chamadas de vendas a meio do trabalho. Estou a contactá-lo unicamente porque identifiquei 22 médias empresas no concelho de ${company} que pretendem rever o apoio contabilístico este trimestre. Vale falar 2 minutos?"`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, sem rodeios: cansa ver gabinetes competentes a competir por avenças de € 150.\n\nTenho um mapeamento de 14 PMEs na sua região com necessidade de assessoria de gestão e apoio fiscal qualificado. Deseja ver a relação?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}, último contacto por aqui: se ainda pretender consultar a listagem de empresas no distrito de ${company}, diga-me. Continuação de bom trabalho!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, 2 minutos ao telefone: se o que lhe disser não for um atalho efetivo para elevar a rentabilidade média das avenças da ${company}, encerramos a chamada de imediato. De acordo?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, ${contact}. Se o vosso gabinete já atingiu a capacidade máxima sem necessidade de novas contas, votos de contínuo sucesso!"`,
        nichePainDiagnosis: 'Saturação de mensagens de agências que desconhecem as obrigações fiscais da Autoridade Tributária portuguesa.'
      }
    }
  },

  // 4. IMÓVEIS & PROPRIETÁRIOS PARTICULARES (FSBO DIRECT OWNER)
  fsbo_realestate: {
    nicheId: 'fsbo_realestate',
    nicheLabel: 'Imóveis de Particulares (FSBO Direct Owner)',
    typicalDecisor: 'Proprietário Particular',
    corePain: 'Cansado de receber chamadas diárias de dezenas de consultores imobiliários a pedir angariação em exclusividade sem terem cliente comprador concreto.',
    specificGaps: [
      'Anúncio ativo há semanas/meses com visitas desqualificadas de curiosos sem crédito habitação pré-aprovado',
      'Proprietário a receber contactos intrusivos sem qualquer proposta líquida e firme',
      'Risco de atrasos no processo de escritura por questões de documentação ou aprovação bancária'
    ],
    tones: {
      executivo_ceo: {
        toneLabel: 'Comprador Pré-Qualificado Direto',
        callAnchor20s: (company, contact, city, gap, price) =>
          `"${contact}, viva. Estou a ligar sobre o anúncio particular do seu imóvel em ${city}. Não pretendo propor contratos de exclusividade nem colocar placas. Trabalho com uma carteira de investidores e compradores qualificados com crédito habitação já aprovado pela banca portuguesa à procura desta tipologia. Se for respeitado o seu valor líquido de ${price || 'anunciado'}, tem disponibilidade para visita amanhã?"`,
        whatsappIcebreaker: (company, contact, city, gap, price) =>
          `Olá ${contact}, boa tarde. Vi o anúncio particular do seu imóvel em ${city}.\n\nNão pretendo propor angariações nem exclusividades. Acompanho compradores qualificados com capacidade financeira validada à procura exatamente desta tipologia no concelho.\n\nO imóvel mantém-se disponível pelo valor de ${price || 'anunciado'}? Se sim, gostaria de validar a disponibilidade para uma visita com o interessado esta semana.`,
        whatsappFollowup24h: (company, contact, city) =>
          `Olá ${contact}! O nosso comprador tem disponibilidade de visitas em ${city} até ao final da semana. Caso o imóvel continue disponível, deixe-me uma confirmação para organizar a rota de visitas.`,
        coldCallTeleprompter: (company, contact, city, gap, price) =>
          `"Olá ${contact}, viva! Contacto pelo anúncio do seu imóvel. Sei que deve receber dezenas de chamadas idênticas de imobiliárias. Vou direto ao ponto: tenho comprador pré-aprovado a pretender comprar no concelho de ${city}. Se o seu valor líquido de ${price || 'venda'} for salvaguardado, posso passar consigo amanhã às 14h30?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, ${contact}. Não tem de assinar qualquer regime de exclusividade. O meu compromisso é muito claro: trago o comprador que já validámos previamente. Se houver negócio, o senhor recebe integralmente o valor anunciado pretendido."`,
        nichePainDiagnosis: 'Proprietário saturado de contactos de consultores amadores que não trazem compradores com capital aprovado.'
      },
      gatilho_gap: {
        toneLabel: 'Gatilho de Desgaste e Tempo em Portal',
        callAnchor20s: (company, contact, city, gap, price) =>
          `"${contact}, reparei que o seu anúncio particular em ${city} já está publicado há algum tempo e calculo que já tenha recebido muitos contactos de curiosos sem poder de compra. Só encaminhamos clientes com aprovação bancária em mão. Vale a pena agendarmos?"`,
        whatsappIcebreaker: (company, contact, city, gap, price) =>
          `Olá ${contact}, viva. Notei que o seu imóvel em ${city} está anunciado e sei como é desgastante receber mensagens de pessoas sem crédito bancário aprovado.\n\nFiltramos antecipadamente a capacidade financeira dos compradores antes de marcar qualquer visita.\n\nTem abertura para apresentar o imóvel se levarmos um cliente com perfil 100% aprovado?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Conseguimos um encaixe de visita com o cliente interessado na zona de ${company}. Se ainda estiver recetivo a compradores qualificados, confirme-me, por favor.`,
        coldCallTeleprompter: (company, contact, city) =>
          `"${contact}, a maioria das visitas de particulares não resulta em escritura porque o interessado não obtém o crédito habitação no banco. Nós apenas levamos quem já tem a carta de aprovação. Podemos agendar para esta semana?"`,
        objectionKiller: (contact) =>
          `"Sem qualquer problema, ${contact}! Continua a vender de forma particular sem entraves. Apenas ganha uma via rápida caso o nosso comprador decida avançar com proposta formal primeiro."`,
        nichePainDiagnosis: 'Desgaste emocional de abrir a porta de casa a estranhos sem capacidade real de financiamento.'
      },
      estudo_caso: {
        toneLabel: 'Liquidez Rápida sem Burocracia',
        callAnchor20s: (company, contact, city, gap, price) =>
          `"${contact}, na semana passada concluímos a transação de um imóvel muito semelhante ao seu em ${city} em menos de 3 semanas, com comprador direto. Gostaria de perceber se tem urgência na concretização do negócio."`,
        whatsappIcebreaker: (company, contact, city, gap, price) =>
          `${contact}, boa tarde. Concluímos recentemente a venda de um imóvel na mesma zona em ${city} com valor líquido assegurado para o proprietário em menos de 20 dias.\n\nTemos 2 compradores que não ficaram com esse imóvel e procuram exatamente a área e tipologia do seu.\n\nPodemos combinar uma visita breve?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Os compradores estão a tomar a decisão final esta semana. Se quiser que o seu imóvel seja avaliado nesta ronda, confirme-me se ainda se encontra disponível.`,
        coldCallTeleprompter: (company, contact, city) =>
          `"${contact}, temos procura qualificada para ${city}. Em vez de deixar o anúncio perder força nos portais, podemos apresentar o imóvel a quem tem pressa em escriturar. Fica-lhe melhor uma visita de manhã ou de tarde?"`,
        objectionKiller: (contact) =>
          `"Compreendo a sua preocupação, ${contact}. O que verdadeiramente releva é o valor líquido que entra na sua conta bancária. Se a proposta satisfizer exatamente o montante que pretende, todos saem a ganhar."`,
        nichePainDiagnosis: 'Imóvel parado a perder valor de mercado nos portais e a acumular custos fixos de condomínio e IMI.'
      },
      quebra_padrao: {
        toneLabel: 'Quebra de Padrão (Sem Conversa Fiada)',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Sei perfeitamente que não aguenta mais consultores a ligar-lhe a prometer mundos e fundos. Mas tenho um cliente concreto com aprovação bancária e interesse no seu imóvel. Dê-me 15 segundos para lhe explicar ou pode desligar de imediato."`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}! Prometo que não sou mais um consultor a ligar para pedir exclusividades ou falar do mercado.\n\nTenho um comprador concreto com crédito aprovado para comprar no concelho de ${company} esta semana. Se a proposta corresponder ao seu valor justo, tem abertura para vender?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Apenas para não insistir sem necessidade: se o imóvel já estiver vendido ou se não pretender compradores qualificados, avise-me que cancelo os contactos. Continuação de bom dia!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, sem rodeios: tenho o cliente, tem os fundos aprovados e o seu imóvel preenche os requisitos dele. Deseja receber uma proposta formal ou prefere manter o anúncio a aguardar no portal?"`,
        objectionKiller: (contact) =>
          `"Com certeza, ${contact}. Se já não pretende vender o imóvel, compreendo perfeitamente e retiro o contacto da nossa base!"`,
        nichePainDiagnosis: 'Exaustão provocada por abordagens insistentes de intermediários sem clientes reais.'
      }
    }
  },

  // 5. SAAS, SOFTWARE & B2B TECH
  saas_tech: {
    nicheId: 'saas_tech',
    nicheLabel: 'SaaS, Software & B2B Tech',
    typicalDecisor: 'Head of Sales / Diretor Comercial / CEO',
    corePain: 'Pedidos de demonstração e contactos no sítio web demoram mais de 45 minutos a ter resposta, gerando perdas elevadas de oportunidades para concorrentes.',
    specificGaps: [
      'Velocidade de primeiro contacto (Speed-to-Lead) superior a 45 minutos em horários críticos',
      'SDRs humanos sobrecarregados com qualificação manual em formulários longos e estáticos',
      'Quebra acentuada entre leads recebidas (MQL) e reuniões agendadas com a equipa de vendas'
    ],
    tones: {
      executivo_ceo: {
        toneLabel: 'Foco em Speed-to-Lead & CAC',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Falo com o responsável comercial da ${company}? Sei que a sua equipa investe de forma significativa em aquisição para gerar oportunidades. O desafio é que a maioria dos compradores B2B fecha com o fornecedor que responde nos primeiros 2 minutos. Ligámos uma esteira que aborda o contacto em 30 segundos no fuso europeu. Vale 3 minutos de conversa?"`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, viva. Tudo bem?\n\nAcompanho a ${company} e conheço o desafio de manter o tempo de resposta da equipa comercial abaixo dos 5 minutos em horários de maior fluxo.\n\nImplementámos um SDR autónomo com inteligência artificial que contacta e agenda reuniões no calendário da equipa em 45 segundos, reduzindo o CAC em mais de 30% em operações tecnológicas.\n\nTeria 5 minutos para ver uma demonstração prática no WhatsApp esta semana?\n\nCumprimentos,\nGonçalo | CriaHub Portugal`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Sei como a gestão de pipeline é intensa. Se quiser ver como bater as metas de demonstrações sem necessidade de recrutar mais SDRs juniores, deixe-me uma nota por aqui.`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, contacto-o porque o tempo de resposta aos formulários da ${company} pode estar a drenar até um terço das vossas oportunidades qualificadas. Mostro-lhe os dados em 3 minutos na quinta. Seria oportuno?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente que já disponham de equipa de vendas, ${contact}! O nosso sistema não substitui os vossos profissionais: assegura a triagem imediata no primeiro minuto para que os comerciais apenas reúnam com quem tem orçamento e poder de decisão."`,
        nichePainDiagnosis: 'Custo de Aquisição de Clientes (CAC) excessivo decorrente da lentidão no acompanhamento imediato de oportunidades inbound.'
      },
      gatilho_gap: {
        toneLabel: 'Gatilho de Fricção no Sítio Web & Mobile',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Reparei que os formulários no sítio web da ${company} solicitam muitos campos antes de permitir o agendamento da demonstração. Isso reduz a conversão em mais de 35% no telemóvel. Temos a arquitetura pronta para desbloquear esse fluxo."`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, viva. Ao analisar o vosso fluxo de conversão, notei um atrito relevante entre o clique na campanha e o agendamento de reunião.\n\nSubstituímos formulários estáticos por conversas fluidas com IA no WhatsApp que qualificam e sincronizam no CRM em segundos.\n\nDeseja ver um exemplo prático de 1 minuto?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Caso queira consultar o comparativo de conversão entre formulários convencionais vs fluxo conversacional, partilho um gráfico sumário por aqui.`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, serei muito claro: se diminuir a fricção de entrada dos contactos no telemóvel, o volume de reuniões agendadas duplica logo no primeiro mês. Mostro-lhe os dados amanhã às 14h?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, ${contact}. A integração com o vosso CRM é nativa e rápida, rodando em paralelo sem interferir na infraestrutura atual."`,
        nichePainDiagnosis: 'Formulários extensos a provocar abandono de decisores empresariais com pouco tempo disponível.'
      },
      estudo_caso: {
        toneLabel: 'Estudo de Caso SaaS & Tech',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Apoiámos uma tecnológica com perfil similar à ${company} a passar de 28 para 74 reuniões mensais de demonstração ao reduzir o tempo de resposta de 50 minutos para 20 segundos. Gostaria de ver a estrutura?"`,
        whatsappIcebreaker: (company, contact) =>
          `${contact}, boa tarde. Um exemplo do ecossistema tecnológico:\n\nUma empresa de software parceira reduziu as perdas de contactos em 58% e aumentou substancialmente as demonstrações realizadas no primeiro mês, sem custos adicionais de contratação de equipa.\n\nTeria 5 minutos esta semana para conhecer os bastidores deste fluxo?`,
        whatsappFollowup24h: (company, contact) =>
          `${contact}, viva. O documento com os indicadores do projeto está disponível. Se considerar útil analisar, avise-me!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, é uma chamada rápida entre profissionais comerciais: temos o processo validado que desbloqueou o pipeline de empresas da vossa dimensão. Fica-lhe melhor conversarmos na quinta às 10h ou na sexta às 16h?"`,
        objectionKiller: (contact) =>
          `"Com certeza, ${contact}. Sabemos que cada solução tecnológica tem particularidades técnicas. O assistente é configurado especificamente com a base de conhecimento e respostas da vossa solução."`,
        nichePainDiagnosis: 'Dificuldade em escalar reuniões sem inflacionar os custos fixos de equipa comercial.'
      },
      quebra_padrao: {
        toneLabel: 'Quebra de Padrão (Direto ao Assunto)',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Sei que o seu perfil no LinkedIn recebe dezenas de abordagens todos os dias. Não lhe vou pedir cafés virtuais: detetei uma fuga concreta no vosso funil de entrada e quero entregar-lhe a análise num vídeo de 30 segundos. Faz sentido?"`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, sem mensagens corporativas longas:\n\nTestei o formulário de contacto da ${company} e cronometrei o tempo até obter resposta. Estão a perder contactos qualificados para concorrentes.\n\nSe lhe partilhar um vídeo de 30 segundos com o teste realizado, tem oportunidade de ver?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Apenas a confirmar antes de arquivar o diagnóstico por aqui: o ponto identificado continua ativo. Deseja ver ou prefere descartar?`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, 30 segundos: identifiquei onde os vossos potenciais clientes estão a desistir no processo de marcação. Posso mostrar-lhe o ajuste em 2 minutos na quinta. Funciona?"`,
        objectionKiller: (contact) =>
          `"Compreendo a 100%, ${contact}. Se o vosso pipeline já estiver no limite da capacidade e sem necessidade de novas contas, não mexa em nada!"`,
        nichePainDiagnosis: 'Fadiga provocada por sequências de mensagens genéricas automatizadas sem relevância técnica.'
      }
    }
  },

  // 6. COMÉRCIO, RETALHO & LOJAS ONLINE (NOVO NICHO ESPECIALIZADO)
  ecom_retalho: {
    nicheId: 'ecom_retalho',
    nicheLabel: 'Comércio, Retalho & Loja Online',
    typicalDecisor: 'Gerente / Diretor(a) de E-commerce',
    corePain: 'Abandono de carrinhos acima de 70%, dúvidas sobre portes e métodos de pagamento portugueses (Multibanco e MB WAY) sem resposta no telemóvel.',
    specificGaps: [
      'Ausência de recuperação ativa de carrinhos abandonados via WhatsApp em menos de 15 minutos',
      'Falta de clarificação imediata sobre prazos de entrega e portes para Portugal Continental e Ilhas',
      'Sítio web e loja online sem suporte direto por WhatsApp para fechar encomendas de valor mais elevado'
    ],
    tones: {
      executivo_ceo: {
        toneLabel: 'Foco em Vendas & Recuperação de Carrinhos',
        callAnchor20s: (company, contact, city) =>
          `"${contact}, viva. Falo com o responsável da loja online da ${company}? Estou sediado cá em Portugal há 3 anos e serei breve: lojas online em Portugal perdem até 70% das encomendas por dúvidas simples de portes e prazos. Estruturámos um assistente que responde e recupera encomendas no WhatsApp em minutos. Gostaria de ver os números em 3 minutos?"`,
        whatsappIcebreaker: (company, contact, city) =>
          `Olá ${contact}, viva. Tudo bem?\n\nEstou baseado cá em Portugal e notei que a loja online da ${company} tem excelente catálogo, mas muitos utilizadores abandonam a encomenda por dúvidas sobre envios ou pagamentos por MB WAY e Multibanco.\n\nImplementámos um recuperador automático por WhatsApp que recupera entre 18% e 32% dos carrinhos abandonados no próprio dia.\n\nFaria sentido enviar-lhe uma demonstração rápida de 1 minuto de como funciona na prática?\n\nCumprimentos,\nGonçalo | CriaHub Portugal`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Caso queira ver como recuperar encomendas que ficaram pelo caminho na loja da ${company}, deixe-me uma mensagem rápida por aqui. Boa semana!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, viva! Estou a ligar porque identifiquei uma oportunidade clara de aumentar as vendas da vossa loja online sem gastar mais em publicidade. Nós recuperamos encomendas abandonadas diretamente pelo WhatsApp. Fica-lhe melhor vermos amanhã às 10h ou às 15h?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, ${contact}. A nossa solução integra-se facilmente na vossa loja online (Shopify, WooCommerce, etc.) e o retorno cobre o investimento logo nas primeiras encomendas recuperadas."`,
        nichePainDiagnosis: 'Perda de receitas diárias por carrinhos abandonados sem acompanhamento ágil no telemóvel do consumidor português.'
      },
      gatilho_gap: {
        toneLabel: 'Gatilho de Fricção no Checkout',
        callAnchor20s: (company, contact) =>
          `"${contact}, testei a experiência de compra na loja da ${company} pelo telemóvel e verifiquei que o cálculo de portes só surge no último passo. Isso faz o cliente recuar e procurar concorrentes. Desenhámos a correção ideal."`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, viva. Fiz um teste de compra na loja da ${company} e reparei que fora do horário de atendimento as dúvidas sobre produtos de maior valor ficam sem resposta.\n\nCriámos um assistente para lojas online que tira dúvidas técnicas e gera referência Multibanco / MB WAY no WhatsApp na hora.\n\nPodemos ver uma prévia rápida?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Passando só para saber se conseguiu avaliar o gap de conversão na loja da ${company}. Se preferir, envio uma breve gravação de ecrã.`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, a sua loja online está a perder clientes no telemóvel. Nós resolvemos esse atrito em menos de 48 horas. Vale 3 minutos de conversa?"`,
        objectionKiller: (contact) =>
          `"Precisamente por isso, ${contact}! O sistema funciona 24 horas por dia, inclusive aos fins de semana quando os portugueses mais fazem compras online."`,
        nichePainDiagnosis: 'Consumidores móveis que desistem de comprar por falta de resposta rápida sobre prazos de entrega e portes.'
      },
      estudo_caso: {
        toneLabel: 'Estudo de Caso E-commerce Nacional',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Apoiámos uma marca portuguesa de retalho que aumentou o volume de encomendas em 27% no primeiro mês apenas ativando o canal de apoio rápido no WhatsApp. Gostaria de ver os dados?"`,
        whatsappIcebreaker: (company, contact) =>
          `${contact}, boa tarde. Um dado prático do comércio eletrónico em Portugal:\n\nUma loja online parceira recuperou mais de € 4.800 em encomendas no primeiro mês após ativarmos a resposta rápida a dúvidas de portes e devoluções.\n\nTeria 5 minutos para ver como estruturámos esse fluxo?`,
        whatsappFollowup24h: (company, contact) =>
          `${contact}, tenho o resumo com os resultados da loja parceira. Se quiser dar uma vista de olhos, avise-me!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, é uma conversa rápida orientada a faturação de loja online. Fica-lhe melhor na quinta às 11h ou na sexta às 15h?"`,
        objectionKiller: (contact) =>
          `"Com certeza, ${contact}. Não são promessas teóricas: mostramos as encomendas faturadas e as conversões comprovadas."`,
        nichePainDiagnosis: 'Insegurança em testar novas abordagens sem ter garantias de aumento líquido de encomendas.'
      },
      quebra_padrao: {
        toneLabel: 'Quebra de Padrão (Sem Rodeios)',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Serei muito direto: identifiquei um ponto exato onde a loja online da ${company} está a perder encomendas todos os dias. Mostro-lhe em 60 segundos. Topa?"`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, sem discursos de vendas: identifiquei um gargalo no vosso processo de encomenda que está a custar vendas todas as semanas.\n\nSe lhe enviar um vídeo de 40 segundos a mostrar o ponto exato, tem oportunidade de ver?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}, última confirmação por aqui. Se não tiver interesse, tudo bem e continuação de boas vendas!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, serei breve: identifiquei uma fuga clara de clientes na vossa loja online. Mostro-lhe em 2 minutos. Fica melhor hoje ou amanhã?"`,
        objectionKiller: (contact) =>
          `"Sem problema, ${contact}. Se a vossa conversão já estiver perfeita e sem qualquer abandono de encomendas, não há motivo para falarmos!"`,
        nichePainDiagnosis: 'Cansaço com contactos comerciais genéricos que não entendem a logística de envios em Portugal.'
      }
    }
  },

  // 7. PADRÃO UNIVERSAL CORPORATIVO (B2B GERAL EM PORTUGAL)
  b2b_geral: {
    nicheId: 'b2b_geral',
    nicheLabel: 'Empresas Corporativas B2B & Serviços Especializados',
    typicalDecisor: 'Diretor-Geral / Sócio-Gerente',
    corePain: 'Captação comercial lenta e dependente de recomendações, com perda de cotações por falta de resposta imediata no WhatsApp e no sítio web corporativo.',
    specificGaps: [
      'Tempo de resposta a pedidos de proposta no canal direto superior a 2 horas',
      'Ausência de triagem automática e qualificação do volume de negócio antes da reunião',
      'Sítio web corporativo estático sem canal de conversão ágil no telemóvel'
    ],
    tones: {
      executivo_ceo: {
        toneLabel: 'Executivo & Foco em ROI Direto',
        callAnchor20s: (company, contact, city, gap) =>
          `"${contact}, viva. Falo com o sócio-gerente da ${company}? Estou baseado cá em Portugal há 3 anos e serei muito breve: identificámos que empresas do seu setor em ${city} perdem até 35% dos pedidos de cotação por falta de resposta imediata no canal direto. Desenvolvemos uma estrutura que qualifica e agenda reuniões em segundos. Gostaria de lhe apresentar em 3 minutos."`,
        whatsappIcebreaker: (company, contact, city, gap) =>
          `Olá ${contact}, viva. Tudo bem?\n\nEstou sediado aqui em Portugal e, ao analisar a operação e posicionamento da ${company} em ${city}, notei um ponto crítico de otimização: ${gap || 'a velocidade de resposta a novos contactos comerciais no canal direto'}.\n\nEstruturámos um mecanismo que reduz esse atendimento para menos de 45 segundos, triando quem tem real poder de decisão e capacidade de investimento.\n\nTeria 5 minutos nesta semana para lhe mostrar como desbloquear esse canal?\n\nCom os melhores cumprimentos,\nGonçalo | CriaHub Portugal`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Sei como a agenda da gerência é preenchida. Preparei um resumo executivo de 1 página focado na ${company}. Se considerar oportuno consultar, avise-me por aqui. Continuação de excelente semana!`,
        coldCallTeleprompter: (company, contact, city, gap) =>
          `"${contact}, estou a contactá-lo porque identifiquei uma oportunidade clara de otimização no fluxo de novos negócios da ${company} em ${city}. Fica-lhe mais conveniente falarmos amanhã às 10h30 ou às 15h?"`,
        objectionKiller: (contact) =>
          `"Compreendo perfeitamente, ${contact}. O nosso propósito não é sobrecarregar a sua equipa, mas sim assegurar que nenhuma oportunidade comercial qualificada fique sem resposta em tempo útil."`,
        nichePainDiagnosis: 'Lentidão no processo de contacto inicial gerando evasão de potenciais clientes com intenção imediata de compra.'
      },
      gatilho_gap: {
        toneLabel: 'Gatilho de GAP Operacional Técnico',
        callAnchor20s: (company, contact, city, gap) =>
          `"${contact}, viva. Notei que a ${company} possui uma excelente reputação em ${city}, mas o canal de entrada no sítio web e WhatsApp não dispõe de triagem rápida fora do horário de expediente. Isso afasta clientes corporativos de maior valor."`,
        whatsappIcebreaker: (company, contact, city, gap) =>
          `Olá ${contact}, viva. Efetuei um teste no canal de contacto da ${company} e verifiquei que clientes empresariais que procuram a sua empresa ao fim do dia ou fins de semana ficam sem resposta imediata.\n\nImplementámos um assistente inteligente que opera 24/7 e qualifica a dimensão do pedido no primeiro minuto.\n\nPodemos ver uma demonstração de 2 minutos?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}! Apenas para saber se teve oportunidade de verificar o ponto de contacto da ${company}. Se preferir, envio uma breve nota explicativa.`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, a sua área comercial está a deixar passar oportunidades ao não responder aos pedidos no primeiro minuto. Resolvemos essa questão em menos de 48 horas. Vale 3 minutos de alinhamento?"`,
        objectionKiller: (contact) =>
          `"Compreendo, ${contact}. A inteligência entra precisamente para assegurar a cobertura em períodos de pico e fora de horas, sem necessidade de aumentar a folha de vencimentos."`,
        nichePainDiagnosis: 'Perda de clientes em momentos em que a equipa não está disponível para responder.'
      },
      estudo_caso: {
        toneLabel: 'Estudo de Caso & Validação em Portugal',
        callAnchor20s: (company, contact, city) =>
          `"${contact}, viva. Apoiámos recentemente uma operação B2B com perfil muito próximo ao da ${company} em ${city} que aumentou a conversão de novos clientes em 38% apenas acelerando o primeiro contacto. Gostaria de perceber como foi concretizado?"`,
        whatsappIcebreaker: (company, contact, city) =>
          `${contact}, boa tarde. Um exemplo prático do seu setor em Portugal:\n\nUma empresa parceira registava quebras no canal direto. Em 30 dias de implementação do atendimento ágil, o tempo de resposta baixou para 30 segundos e a taxa de fecho de propostas cresceu 42%.\n\nConsigo apresentar-lhe a estrutura em 5 minutos na quinta-feira?`,
        whatsappFollowup24h: (company, contact) =>
          `${contact}, tenho o relatório sumário com as conclusões pronto. Se tiver interesse em consultar, avise-me!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, é uma conversa objetiva apoiada em dados reais de empresas da vossa dimensão. Fica-lhe melhor quinta às 11h ou sexta às 15h?"`,
        objectionKiller: (contact) =>
          `"Com certeza, ${contact}. Não trabalhamos com teorias: apresentamos unicamente metodologias testadas e com métricas comprovadas no mercado nacional."`,
        nichePainDiagnosis: 'Receio de alocar tempo em abordagens que não tragam retorno claro e mensurável.'
      },
      quebra_padrao: {
        toneLabel: 'Quebra de Padrão (Direto ao Assunto)',
        callAnchor20s: (company, contact) =>
          `"${contact}, viva. Vou poupar-lhe tempo: sei que recebe abordagens comerciais repetitivas com frequência. Serei direto: identifiquei um ponto concreto onde a ${company} está a perder clientes todos os meses. Mostro-lhe em 60 segundos. O que lhe parece?"`,
        whatsappIcebreaker: (company, contact) =>
          `Olá ${contact}, sem discursos corporativos convencionais: identifiquei um ponto no fluxo comercial da ${company} que está a custar oportunidades todos os meses.\n\nSe lhe partilhar um vídeo de 40 segundos a demonstrar o ponto exato, tem oportunidade de ver?`,
        whatsappFollowup24h: (company, contact) =>
          `Olá ${contact}, último contacto por aqui. Se não tiver interesse, compreendo perfeitamente e votos de excelente trabalho!`,
        coldCallTeleprompter: (company, contact) =>
          `"${contact}, serei breve: identifiquei uma falha clara na captação de clientes da ${company}. Mostro-lhe em 2 minutos. Fica-lhe melhor hoje ou amanhã?"`,
        objectionKiller: (contact) =>
          `"Sem problema, ${contact}. Se a vossa operação já estiver impecável e sem qualquer ponto de atrito, de facto não faz sentido conversarmos!"`,
        nichePainDiagnosis: 'Resistência justificada a abordagens comerciais vazias que não trazem valor imediato.'
      }
    }
  }
};

/**
 * Validador e Purificador de PT-PT (Abrasileiramento Reverso)
 * Garante que nenhuma gíria ou termo brasileiro passe para a copy final.
 */
export function purifyPtPtText(text: string): string {
  if (!text) return '';
  let clean = text;

  // Substituições de palavras e expressões
  const map: [RegExp, string][] = [
    [/\bequipe\b/gi, 'equipa'],
    [/\bequipes\b/gi, 'equipas'],
    [/\bfazer um site\b/gi, 'desenvolver um sítio web'],
    [/\bfazer o site\b/gi, 'desenvolver o sítio web'],
    [/\bcriar um site\b/gi, 'criar um sítio web'],
    [/\bsite\b/gi, 'sítio web'],
    [/\bcelular\b/gi, 'telemóvel'],
    [/\bcelulares\b/gi, 'telemóveis'],
    [/\bloja virtual\b/gi, 'loja online'],
    [/\blojas virtuais\b/gi, 'lojas online'],
    [/\bfrete\b/gi, 'portes'],
    [/\bfretes\b/gi, 'portes'],
    [/\bbacana\b/gi, 'interessante'],
    [/\blegal\b/gi, 'ótimo'],
    [/\btrampo\b/gi, 'trabalho'],
    [/\bbeleza\b/gi, 'combinado'],
    [/\bprint\b/gi, 'demonstração rápida'],
    [/\bchamar no whats\b/gi, 'enviar mensagem no WhatsApp'],
    [/\bme dá um toque\b/gi, 'deixe-me uma mensagem'],
    [/\bme avisa\b/gi, 'avise-me'],
    [/\bte ligo\b/gi, 'ligo-lhe'],
    [/\bte mostrar\b/gi, 'mostrar-lhe'],
    [/\bte mandar\b/gi, 'enviar-lhe'],
    [/\bte enviar\b/gi, 'enviar-lhe'],
    [/\bte dar\b/gi, 'dar-lhe'],
    [/\bte procurei\b/gi, 'procurei-o'],
    [/\bR\$\s*[\d\.,]+/gi, '€ 599+'],
    [/\breais\b/gi, 'euros'],
    [/\boab\b/gi, 'Ordem dos Advogados'],
    [/\bcrc\b/gi, 'Ordem dos Contabilistas Certificados (OCC)']
  ];

  for (const [pattern, replacement] of map) {
    clean = clean.replace(pattern, replacement);
  }

  return clean;
}

/**
 * Detecta o nicho exato do lead a partir de palavras-chave, categoria e metadados
 */
export function detectLeadNiche(lead: Lead): NicheOutreachBlueprint {
  const text = `${lead.category || ''} ${lead.name || ''} ${lead.description || ''} ${lead.notes || ''}`.toLowerCase();

  if (lead.isRealEstate || text.includes('imóve') || text.includes('proprietário') || text.includes('fsbo') || text.includes('arrendamento') || text.includes('moradia') || text.includes('apartamento') || text.includes('t1') || text.includes('t2') || text.includes('t3')) {
    return NICHE_OUTREACH_BLUEPRINTS.fsbo_realestate;
  }

  if (text.includes('odonto') || text.includes('dentista') || text.includes('dentária') || text.includes('implante') || text.includes('invisalign') || text.includes('ortodont') || text.includes('sorriso') || text.includes('clínica dentária')) {
    return NICHE_OUTREACH_BLUEPRINTS.odonto;
  }

  if (text.includes('advoc') || text.includes('advogad') || text.includes('jurídic') || text.includes('juridic') || text.includes('direito') || text.includes('tributár') || text.includes('societár') || text.includes('ordem dos advogados')) {
    return NICHE_OUTREACH_BLUEPRINTS.advocacia;
  }

  if (text.includes('contab') || text.includes('bpo') || text.includes('fiscal') || text.includes('tributos') || text.includes('auditoria') || text.includes('occ') || text.includes('irc') || text.includes('iva')) {
    return NICHE_OUTREACH_BLUEPRINTS.contabilidade;
  }

  if (text.includes('loja') || text.includes('ecom') || text.includes('retalho') || text.includes('roupa') || text.includes('calcado') || text.includes('shopify') || text.includes('woocommerce') || text.includes('comércio')) {
    return NICHE_OUTREACH_BLUEPRINTS.ecom_retalho;
  }

  if (text.includes('software') || text.includes('saas') || text.includes('tech') || text.includes('tecnologia') || text.includes('startup') || text.includes('app') || text.includes('sistema') || text.includes('plataforma')) {
    return NICHE_OUTREACH_BLUEPRINTS.saas_tech;
  }

  return NICHE_OUTREACH_BLUEPRINTS.b2b_geral;
}

/**
 * Gera a abordagem determinística e cirúrgica para o lead (Zero Clichê + Portugal B2B garantido)
 */
export function generateDeterministicNicheOutreach(
  lead: Lead,
  tone: SdrOutreachTone = 'executivo_ceo'
): RealtimeSdrOutreach {
  const blueprint = detectLeadNiche(lead);
  const toneConfig = blueprint.tones[tone] || blueprint.tones.executivo_ceo;

  const company = lead.name || 'Empresa';
  const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || blueprint.typicalDecisor;
  const city = lead.district ? `${lead.district}, ${lead.city || ''}` : (lead.city || 'Portugal');
  const gap = (lead.keyFlaws && lead.keyFlaws.length > 0 ? lead.keyFlaws[0] : blueprint.specificGaps[0]) || blueprint.corePain;
  const price = lead.estimatedRevenue || lead.priceDropValue || '€ 599';

  const localHook = PORTUGAL_LOCAL_HOOK(city);
  const antiBias = PORTUGAL_ANTI_BIAS_REBUTTAL;

  return {
    tone,
    toneLabel: toneConfig.toneLabel,
    nicheDetected: blueprint.nicheLabel,
    callAnchor20s: purifyPtPtText(toneConfig.callAnchor20s(company, decisorName, city, gap, price)),
    whatsappIcebreaker: purifyPtPtText(toneConfig.whatsappIcebreaker(company, decisorName, city, gap, price)),
    whatsappFollowup24h: purifyPtPtText(toneConfig.whatsappFollowup24h(company, decisorName, city)),
    coldCallTeleprompter: purifyPtPtText(toneConfig.coldCallTeleprompter(company, decisorName, city, gap)),
    objectionKiller: purifyPtPtText(toneConfig.objectionKiller(decisorName, company)),
    nichePainDiagnosis: purifyPtPtText(toneConfig.nichePainDiagnosis),
    generatedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    aiEngineUsed: 'Motor Especialista de Nicho Portugal B2B (PT-PT Puro)',
    portugalLocalHook: localHook,
    antiBiasRebuttal: antiBias,
    ptPtVerified: true,
    ptPtDialogueSimulation: generateDeterministicPtPtDialogue(lead)
  };
}

/**
 * Geração de Abordagem em Tempo Real com IA (Groq Cloud Llama 3.3 70B ou Google Gemini)
 * Calibrada com as Leis de Ouro do "Abrasileiramento Reverso" e Blindagem de Confiança em Portugal.
 */
export async function generateLiveAiNicheOutreach(
  lead: Lead,
  tone: SdrOutreachTone = 'executivo_ceo',
  customInstructions?: string
): Promise<RealtimeSdrOutreach> {
  const blueprint = detectLeadNiche(lead);
  const company = lead.name || 'Empresa';
  const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || blueprint.typicalDecisor;
  const decisorRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Sócio-Gerente / Diretor';
  const city = lead.city || 'Portugal';
  const district = lead.district || '';
  const location = district ? `${district}, ${city}` : city;
  const techTools = lead.techStack?.detectedTools?.join(', ') || 'WordPress, WhatsApp';
  const flaws = lead.keyFlaws?.join('; ') || blueprint.corePain;
  const isRealEstate = Boolean(lead.isRealEstate || blueprint.nicheId === 'fsbo_realestate');
  const price = lead.estimatedRevenue || '€ 599+';

  const systemPrompt = `Você é um Consultor Sénior de Crescimento B2B e SDR Hunter de Elite que RESIDE E OPERA EM PORTUGAL HÁ MAIS DE 3 ANOS.
Você conhece profundamente a psicologia, o rigor, a cultura e a seriedade do empresário português.

LEI MÁXIMA E INQUEBRÁVEL: "ABRASILEIRAMENTO REVERSO" & RIGOR PT-PT ABSOLUTO:
1. ZERO GÍRIAS OU MANEIRISMOS BRASILEIROS:
   - É ESTRITAMENTE PROIBIDO usar palavras como: "legal", "trampo", "bacana", "beleza", "equipe", "fazer um site", "celular", "loja virtual", "frete", "orçamento" pechinchado.
   - Use ESTRITAMENTE os termos corporativos portugueses:
     * "equipa" (NUNCA equipe)
     * "sítio web" ou "página web" (NUNCA site / fazer um site)
     * "telemóvel" (NUNCA celular)
     * "loja online" (NUNCA loja virtual)
     * "portes / envios" (NUNCA frete)
     * "faturação / avença mensal" (NUNCA honorários baratos em R$)
     * "demonstração de 1 minuto" (NUNCA print / mandar um print)
2. O GANCHO DA PROXIMIDADE LOCAL (ÂNCORA DE 3 ANOS):
   - Elimine instantaneamente qualquer desconfiança de "falsa agência operando do Brasil".
   - Ancore a presença local em Portugal: "Estou baseado cá em Portugal (a colaborar com empresas no eixo Lisboa / Porto há 3 anos no fuso de Lisboa)..."
3. FOQUE NO PROBLEMA TÉCNICO, NÃO NO PREÇO BARATO:
   - O empresário português tem aversão a "vendedor de banho-maria" ou soluções baratas suspeitas.
   - Demonstre autoridade técnica, domínio de SEO local europeu, velocidade de resposta (Speed-to-Lead < 45s) e processos com retorno comprovado.
   - Preços/pacotes sempre em Euros (€599+ por solução; avenças de €1.200 a €3.500/mês).
4. ZERO JUSTIFICATIVA DE NACIONALIDADE:
   - Nunca peça desculpas ou justifique ser brasileiro. Foque 100% na competência técnica, agilidade e resultados concretos da CriaHub Portugal.
5. ZERO CLICHÊS DE TELEMARKETING:
   - Proibido: "Espero que este e-mail o encontre bem", "Somos especialistas", "Solução inovadora", "Parceria de sucesso".

RETORNE ESTRITAMENTE UM JSON VÁLIDO no seguinte formato, sem blocos markdown extras fora do JSON:
{
  "callAnchor20s": "Texto exato que o SDR vai falar nos primeiros 20 segundos da chamada, direto ao assunto, com o gancho de proximidade local em Portugal.",
  "whatsappIcebreaker": "Mensagem formatada para WhatsApp em PT-PT rigoroso, espaçada, sem links invasivos, terminando com pergunta de baixo atrito.",
  "whatsappFollowup24h": "Mensagem curta de follow-up pós-24h se o decisor visualizar e não responder.",
  "coldCallTeleprompter": "Roteiro completo de 30 a 45 segundos para o teleprompter da chamada em PT-PT.",
  "objectionKiller": "Resposta cirúrgica de 2 frases para a principal objeção deste nicho em Portugal.",
  "nichePainDiagnosis": "Diagnóstico do gargalo técnico mais crítico do nicho no mercado português.",
  "portugalLocalHook": "Frase curta de ancoragem de 3 anos de residência e suporte local no fuso de Lisboa.",
  "antiBiasRebuttal": "Resposta firme e profissional para desarmar qualquer desconfiança sobre presença local ou agências de fora."
}`;

  const userPrompt = `Prospecto a ser abordado em Portugal:
- Empresa: ${company}
- Nicho Detectado: ${blueprint.nicheLabel}
- Decisor: ${decisorName} (${decisorRole})
- Localização: ${location}
- Tipo de Negócio: ${isRealEstate ? 'Imóvel Particular (FSBO)' : 'Empresa B2B / Serviço Especializado'}
- Moeda: Euros (€)
- Valor/Ticket de Referência: ${price}
- Stack Tecnológica Identificada: ${techTools}
- Gaps Operacionais e Dores Mapeadas: ${flaws}
- Tom Selecionado: ${tone}
${customInstructions ? `- Instrução Adicional do SDR: "${customInstructions}"` : ''}

Gere o JSON da abordagem com rigor PT-PT (Abrasileiramento Reverso) agora:`;

  try {
    const aiResult = await executeAiCompletion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.25,
      jsonMode: true
    });

    let parsed: any = null;
    const cleanText = aiResult.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      parsed = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
    }

    if (parsed && parsed.callAnchor20s && parsed.whatsappIcebreaker) {
      const toneLabels: Record<SdrOutreachTone, string> = {
        executivo_ceo: 'Direto ao Sócio / CEO',
        gatilho_gap: 'Gatilho de GAP Operacional',
        estudo_caso: 'Estudo de Caso & Prova Social',
        quebra_padrao: 'Quebra de Padrão (Sem Rodeios)'
      };

      return {
        tone,
        toneLabel: toneLabels[tone] || 'Personalizado',
        nicheDetected: blueprint.nicheLabel,
        callAnchor20s: purifyPtPtText(parsed.callAnchor20s),
        whatsappIcebreaker: purifyPtPtText(parsed.whatsappIcebreaker),
        whatsappFollowup24h: purifyPtPtText(parsed.whatsappFollowup24h || `Olá ${decisorName}, viva. Passando para saber se teve oportunidade de ver a mensagem anterior. Cumprimentos!`),
        coldCallTeleprompter: purifyPtPtText(parsed.coldCallTeleprompter || parsed.callAnchor20s),
        objectionKiller: purifyPtPtText(parsed.objectionKiller || 'Compreendo perfeitamente. O meu objetivo é unicamente assegurar que não haja perda de oportunidades comerciais na mesa.'),
        nichePainDiagnosis: purifyPtPtText(parsed.nichePainDiagnosis || blueprint.corePain),
        generatedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        aiEngineUsed: aiResult.engineUsed ? `${aiResult.engineUsed} (PT-PT Calibrado)` : 'Groq / Gemini AI (Portugal B2B)',
        portugalLocalHook: purifyPtPtText(parsed.portugalLocalHook || PORTUGAL_LOCAL_HOOK(city)),
        antiBiasRebuttal: purifyPtPtText(parsed.antiBiasRebuttal || PORTUGAL_ANTI_BIAS_REBUTTAL),
        ptPtVerified: true,
        ptPtDialogueSimulation: generateDeterministicPtPtDialogue(lead)
      };
    }
  } catch (error: any) {
    console.warn('⚠️ IA Online indisponível ou em fallback, ativando Motor Determinístico Portugal B2B:', error?.message);
  }

  // Fallback determinístico garantido com PT-PT puro
  return generateDeterministicNicheOutreach(lead, tone);
}
