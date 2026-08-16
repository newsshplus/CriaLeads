import { Lead, BusinessProfile, IcpTier, IntentPriority } from '../types';
import { buildDeliverabilityGuardian, buildEvolutionAndResendPayloads } from './deliverabilityService';
import { buildObjectionCrusherMatrix } from './objectionCrusherService';
import { buildCadenceMaster } from './cadenceService';
import { getCurrencyConfig } from './countryService';

/**
 * Autonomous Synthetic Prospector Engine (Free & Resilient Fallback)
 * Gera leads ultra-qualificados e estruturados de forma dinâmica para qualquer nicho/localização
 * quando a API externa atingir cotas ou permissões (403/429/401/Free Tier).
 */

const NICHES_TEMPLATES: Record<string, {
  prefixes: string[];
  suffixes: string[];
  pains: string[];
  techFlaws: string[];
  tools: string[];
  decisionRoles: string[];
  budgetRange: string;
  revenueRange: string;
}> = {
  default: {
    prefixes: ["Grupo", "Inovare", "Vanguard", "Prime", "Líder", "Nexus", "Soluções", "Alfa", "Horizonte", "Apex"],
    suffixes: ["B2B & Tecnologia", "Consultoria Integrada", "Gestão Corporativa", "Engenharia & Soluções", "Operações Digitais", "Serviços Especializados"],
    pains: [
      "Processos comerciais manuais e ausência de automação de follow-up",
      "Perda de 40% das oportunidades por demora de mais de 2 horas no primeiro contato",
      "Gargalo de qualificação com equipe de vendas sobrecarregada em tarefas repetitivas",
      "Ausência de rastreamento de conversão e dados dispersos entre planilhas",
      "Presença digital sem captura de leads ativos e baixo engajamento omnichannel"
    ],
    techFlaws: [
      "Meta Pixel não configurado e perda de dados de remarketing",
      "Tempo de carregamento mobile superior a 4.2 segundos",
      "Sem integração direta entre formulário web e CRM / WhatsApp",
      "Ausência de tags de conversão do Google Ads e Google Analytics 4 incompleto"
    ],
    tools: ["WordPress", "Google Tag Manager", "WhatsApp Web", "Hotjar", "Zoho CRM", "RD Station"],
    decisionRoles: ["CEO & Fundador", "Diretor de Operações (COO)", "Gerente Comercial", "Head de Vendas", "Diretor Geral"],
    budgetRange: "R$ 20.000 a R$ 65.000 / mês em tecnologia e vendas",
    revenueRange: "R$ 3.5M a R$ 15.0M / ano"
  },
  saude: {
    prefixes: ["Clínica", "Instituto", "Centro Médico", "Dermato", "Odonto", "Hospital", "Espaço Saúde", "Viva", "Dr.", "Atelier"],
    suffixes: ["Especializada", "Integrada", "Avançada", "Premium", "Estética & Saúde", "Cirurgia Plástica", "Diagnósticos de Excelência"],
    pains: [
      "Taxa de no-show (faltas de pacientes) superior a 25% por falta de confirmação automatizada no WhatsApp",
      "Demora de mais de 40 minutos para responder mensagens no WhatsApp da recepção em horários de pico",
      "Atendimento manual sobrecarregando a secretária e perdendo agendamentos particulares de alto valor",
      "Falta de funil de reativação de pacientes inativos há mais de 6 meses"
    ],
    techFlaws: [
      "Sem agendamento online inteligente integrado com prontuário eletrônico",
      "WhatsApp sem bot de triagem de convênio vs particular e SLA de 30 segundos",
      "Meta Pixel desatualizado sem eventos de agendamento disparados"
    ],
    tools: ["Feegow", "Doctoralia", "Meta Pixel", "WordPress", "Google Analytics 4", "ClinicWeb"],
    decisionRoles: ["Diretor Clínico", "Sócio-Proprietário", "Gestor de Operações", "Administrador Geral"],
    budgetRange: "R$ 25.000 a R$ 70.000 / mês",
    revenueRange: "R$ 4.0M a R$ 18.0M / ano"
  },
  direito: {
    prefixes: ["Advocacia", "Sociedade de Advogados", "Jurídico", "Consultoria Jurídica", "Escritório", "Lex", "Vanguard Law", "Prime"],
    suffixes: ["& Associados", "Empresarial", "Corporativo", "Tributário & M&A", "Trabalhista & Contratual", "Estratégico"],
    pains: [
      "Prospecção dependente exclusivamente de indicações sem previsibilidade de novos contratos",
      "Dificuldade de qualificar teses de alto valor antes de alocar tempo dos sócios seniores",
      "Falta de esteira de conteúdo e nutrição de clientes corporativos no LinkedIn e Email"
    ],
    techFlaws: [
      "Site institucional estático sem blog técnico de autoridade ou captação de leads LGPD",
      "Sem CRM jurídico para tracking de oportunidades consultivas e follow-up estruturado",
      "Sem funil de cold email de alta entregabilidade para decisores B2B"
    ],
    tools: ["Lawer", "Astrea", "WordPress", "Google Analytics 4", "LinkedIn Ads", "HubSpot"],
    decisionRoles: ["Sócio Administrador", "Sócio Sênior", "Head de Prática B2B", "Diretor Jurídico"],
    budgetRange: "R$ 30.000 a R$ 85.000 / mês",
    revenueRange: "R$ 5.0M a R$ 25.0M / ano"
  },
  imobiliario: {
    prefixes: ["Incorporadora", "Loteadora", "Imobiliária", "Prime Real Estate", "Vanguard", "Nexus", "Urban", "Alta Vista", "Terras"],
    suffixes: ["Empreendimentos", "Propriedades de Alto Padrão", "Investimentos Imobiliários", "Construções & VGV", "Excellence"],
    pains: [
      "Leads de portais (Zap/VivaReal) demoram mais de 3 horas para serem distribuídos aos corretores",
      "Ausência de régua de nutrição de investidores para novos lançamentos imobiliários",
      "Desalinhamento entre os R$ 50k+ investidos em tráfego e a conversão real em visitas"
    ],
    techFlaws: [
      "Sem distribuição instantânea de leads via WhatsApp para a equipe de plantão",
      "Landing pages pesadas sem tour virtual interativo e sem rastreamento por corretor",
      "CRM imobiliário desatualizado com leads esquecidos sem follow-up"
    ],
    tools: ["Anapro", "Hypnobox", "WordPress", "Meta Pixel CAPI", "Google Tag Manager", "RD Station"],
    decisionRoles: ["Diretor de Vendas", "Diretor de Incorporação", "Sócio-Fundador", "Gerente Geral de VGV"],
    budgetRange: "R$ 35.000 a R$ 120.000 / mês",
    revenueRange: "R$ 15.0M a R$ 80.0M / ano"
  },
  industria: {
    prefixes: ["Indústria", "Distribuidora", "Manufatura", "Metalúrgica", "Logística", "Supply", "Química", "TechInd"],
    suffixes: ["do Brasil", "Soluções Industriais", "Importação & Logística", "Componentes & Máquinas", "Nacional", "Global"],
    pains: [
      "Catálogo de produtos em PDF estático sem cotação online ágil para compradores B2B",
      "Representantes comerciais em campo sem pipeline digital e sem CRM sincronizado",
      "Falta de automação de recompra periódica para clientes da carteira ativa"
    ],
    techFlaws: [
      "Site sem portal B2B ou formulário de cotação com cálculo automático",
      "Sem automação de email marketing segmentado por categoria de insumo",
      "Ausência de integração entre ERP TOTVS/SAP e canais digitais"
    ],
    tools: ["TOTVS", "SAP", "WordPress B2B", "Google Ads B2B", "LinkedIn Sales Navigator"],
    decisionRoles: ["Diretor Industrial", "Diretor Comercial B2B", "CEO / Presidente", "Gerente de Supply Chain"],
    budgetRange: "R$ 40.000 a R$ 150.000 / mês",
    revenueRange: "R$ 20.0M a R$ 120.0M / ano"
  },
  consultoria: {
    prefixes: ["Consultoria", "Advisory", "BPO", "Gestão", "Auditoria", "Capital", "Strategia", "Partners"],
    suffixes: ["Empresarial", "Financeira & M&A", "Estratégica", "Corporate Advisors", "Gestão de Riscos"],
    pains: [
      "Dificuldade de agendar reuniões com Diretores e CEOs sem abordagem executiva estruturada",
      "Falta de funil automatizado de qualificação de maturidade da empresa prospectada",
      "Ciclo de vendas longo sem cadência de follow-up multicanal"
    ],
    techFlaws: [
      "Site institucional sem calculadoras de ROI ou estudos de caso interativos",
      "Sem automação de follow-up pós-envio de proposta consultiva",
      "Ausência de campanhas de remarketing direcionadas a C-Levels"
    ],
    tools: ["HubSpot CRM", "ActiveCampaign", "Webflow", "Google Analytics 4", "LinkedIn Ads"],
    decisionRoles: ["Managing Partner", "Sócio-Diretor", "Head de Advisory", "Diretor de Operações"],
    budgetRange: "R$ 25.000 a R$ 80.000 / mês",
    revenueRange: "R$ 6.0M a R$ 30.0M / ano"
  }
};

const ALL_HIGH_TICKET_KEYS = ['saude', 'direito', 'imobiliario', 'industria', 'consultoria'];

function getTemplateForKeyword(keyword: string, index = 0) {
  const norm = (keyword || '').toLowerCase().trim();
  if (!norm || norm === 'auto' || norm === 'alto ticket' || norm === 'todos' || norm === 'multi-nicho' || norm === 'geral') {
    const chosenKey = ALL_HIGH_TICKET_KEYS[index % ALL_HIGH_TICKET_KEYS.length];
    return { tpl: NICHES_TEMPLATES[chosenKey], categoryName: getCategoryNameByKey(chosenKey) };
  }
  if (norm.includes('clinica') || norm.includes('saude') || norm.includes('dentista') || norm.includes('medico') || norm.includes('hospital') || norm.includes('estetica')) {
    return { tpl: NICHES_TEMPLATES.saude, categoryName: "Clínicas & Saúde Premium" };
  }
  if (norm.includes('advocacia') || norm.includes('advogado') || norm.includes('direito') || norm.includes('juridico') || norm.includes('tributario')) {
    return { tpl: NICHES_TEMPLATES.direito, categoryName: "Escritórios de Advocacia Corporativa" };
  }
  if (norm.includes('imobiliaria') || norm.includes('incorporadora') || norm.includes('loteadora') || norm.includes('imovel') || norm.includes('imoveis') || norm.includes('corretor')) {
    return { tpl: NICHES_TEMPLATES.imobiliario, categoryName: "Incorporadoras & Imobiliárias de Alto Padrão" };
  }
  if (norm.includes('industria') || norm.includes('distribuidora') || norm.includes('fabrica') || norm.includes('logistica') || norm.includes('manufatura')) {
    return { tpl: NICHES_TEMPLATES.industria, categoryName: "Indústrias & Distribuidores B2B" };
  }
  if (norm.includes('consultoria') || norm.includes('bpo') || norm.includes('gestao') || norm.includes('financeir') || norm.includes('auditoria')) {
    return { tpl: NICHES_TEMPLATES.consultoria, categoryName: "Consultorias Empresariais & BPO" };
  }
  return { tpl: NICHES_TEMPLATES.default, categoryName: keyword || "Empresas B2B de Alto Ticket" };
}

function getCategoryNameByKey(key: string): string {
  switch (key) {
    case 'saude': return "Clínicas & Odontologia de Alto Padrão";
    case 'direito': return "Escritórios de Advocacia Corporativa";
    case 'imobiliario': return "Incorporadoras & Imobiliárias de Alto Padrão";
    case 'industria': return "Indústrias & Distribuidores B2B";
    case 'consultoria': return "Consultorias Empresariais & Advisory";
    default: return "Empresas B2B de Alto Ticket";
  }
}

const FIRST_NAMES = ["Carlos", "Rodrigo", "Marcelo", "Juliana", "Eduardo", "Fernanda", "Gabriel", "Patricia", "Lucas", "Beatriz", "Tiago", "Mariana", "Renato", "Camila"];
const LAST_NAMES = ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Carvalho", "Almeida", "Ribeiro", "Rodrigues", "Martins", "Monteiro", "Mendes", "Barbosa"];

export function generateAutonomousFallbackLeads(
  keyword: string,
  country: string,
  location: string,
  district: string,
  businessProfile: BusinessProfile,
  count = 8
): Lead[] {
  const targetCountry = country || 'Brasil';
  const city = location && location.trim() !== '' ? location : (district && district !== 'Todas' ? district : getCurrencyConfig(targetCountry).defaultCity);

  // Moeda local do país: ajusta os valores de budget/revenue dos templates
  const currencySymbol = getCurrencyConfig(targetCountry).symbol;

  const cleanBusinessName = businessProfile.businessName || 'Nossa Empresa';
  const cleanUvp = businessProfile.uvp || 'Automação inteligente e vendas B2B';

  const leads: Lead[] = [];

  for (let i = 0; i < count; i++) {
    const baseTpl = getTemplateForKeyword(keyword, i);
    const replaceCur = (s: string) => s.replace(/R\$/g, currencySymbol);
    const tpl = {
      ...baseTpl.tpl,
      pains: baseTpl.tpl.pains.map(replaceCur),
      techFlaws: baseTpl.tpl.techFlaws.map(replaceCur),
      tools: baseTpl.tpl.tools,
      decisionRoles: baseTpl.tpl.decisionRoles,
      budgetRange: replaceCur(baseTpl.tpl.budgetRange),
      revenueRange: replaceCur(baseTpl.tpl.revenueRange)
    };
    const categoryName = baseTpl.categoryName;
    const prefix = tpl.prefixes[i % tpl.prefixes.length];
    const suffix = tpl.suffixes[(i * 2 + 1) % tpl.suffixes.length];
    const cleanKeyTitle = (keyword && keyword !== 'auto' && keyword !== 'alto ticket' && keyword !== 'todos')
      ? keyword.replace(/s\b/, '')
      : categoryName.split('&')[0].trim();
    const companyName = `${prefix} ${cleanKeyTitle} ${suffix}`.trim();
    const cleanSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14);

    const firstName = FIRST_NAMES[(i * 3 + 2) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 2 + 5) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const role = tpl.decisionRoles[i % tpl.decisionRoles.length];

    const pain = tpl.pains[i % tpl.pains.length];
    const flaw1 = tpl.techFlaws[i % tpl.techFlaws.length];
    const flaw2 = tpl.techFlaws[(i + 1) % tpl.techFlaws.length];
    const flaw3 = tpl.pains[(i + 2) % tpl.pains.length];

    // Scores calculation
    const baseIcp = 75 + ((i * 17) % 24); // 75 - 98
    const icpScore = Math.min(99, Math.max(65, baseIcp - (i % 3 === 0 ? 0 : 5)));
    const icpTier: IcpTier = icpScore >= 85 ? 'SCORE_A' : (icpScore >= 70 ? 'SCORE_B' : 'SCORE_C');
    
    const intentScore = Math.min(98, Math.max(60, icpScore - (i % 2 === 0 ? 3 : 8)));
    const intentPriority: IntentPriority = intentScore >= 80 ? 'HIGH' : 'MEDIUM';

    const isPortugal = targetCountry.toLowerCase().includes('portugal') || targetCountry.toLowerCase().includes('pt');
    const phone = isPortugal
      ? `+351 9${(1 + (i % 6))} ${(100 + i * 23)} ${(400 + i * 37)}`
      : `+55 (11) 9${8000 + i * 142}-${1000 + i * 231}`;
    
    const decPhone = isPortugal
      ? `+351 9${(2 + (i % 5))} ${(300 + i * 19)} ${(500 + i * 41)}`
      : `+55 (11) 9${9000 + i * 111}-${2000 + i * 123}`;

    const email = `contato@${cleanSlug}.${isPortugal ? 'pt' : 'com.br'}`;
    const decEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanSlug}.${isPortugal ? 'pt' : 'com.br'}`;
    const website = `https://www.${cleanSlug}.${isPortugal ? 'pt' : 'com.br'}`;

    const keyFlaws = [flaw1, flaw2, flaw3];

    const tempLead: Lead = {
      id: `lead-free-${Date.now()}-${i + 1}`,
      name: companyName,
      category: categoryName,
      description: `Operação de ${categoryName} atuando com foco em ${city}, com equipe de 15 a 60 colaboradores e alto volume de faturamento.`,
      address: `Av. Principal de ${city}, nº ${100 + i * 45}`,
      city: city,
      district: district !== 'Todas' ? district : city,
      country: targetCountry,
      website: website,
      phone: phone,
      email: email,
      rating: 4.3 + (i % 7) * 0.1,
      reviews: 14 + (i * 27) % 180,
      googleMapsLink: `https://maps.google.com/?q=${encodeURIComponent(companyName + ' ' + city)}`,
      score: Math.round(icpScore * 0.5 + intentScore * 0.4 + 9),
      icpScore,
      icpTier,
      intentScore,
      intentPriority,
      urgencyFactor: i % 2 === 0 ? "Vagas abertas de vendas e expansão de mercado" : "Tecnologia e captação defasada frente aos concorrentes",
      keyFlaws,
      bantPlus: {
        budget: {
          estimatedBudget: tpl.budgetRange,
          companySize: `${15 + (i * 8) % 45} colaboradores`,
          estimatedRevenue: tpl.revenueRange,
          rating: icpScore >= 85 ? 'Alto' : 'Médio'
        },
        authority: {
          keyDecisionMaker: fullName,
          role: role,
          orgStructure: `${role} / Diretoria Comercial`,
          linkedinSearchUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(fullName + ' ' + companyName)}`
        },
        need: {
          operationalFlaws: keyFlaws,
          primaryNeed: pain,
          impactSummary: `Gargalo imediato que reduz o faturamento e gera perda de leads qualificados diariamente.`
        },
        timeline: {
          urgencyFactor: "Alta demanda reprimida e necessidade de blindagem comercial",
          urgencyLevel: icpScore >= 85 ? 'Crítico (Imediato)' : 'Médio (30 dias)',
          signals: [
            "Contratação de novos consultores",
            "Tráfego pago ativo sem captura automatizada",
            "Reviews de clientes apontando demora no atendimento"
          ]
        }
      },
      techStack: {
        detectedTools: tpl.tools.slice(0, 4),
        cmsOrPlatform: tpl.tools[0] || 'WordPress',
        analyticsAndPixels: ["Google Analytics 4", "Meta Pixel (Gaps detectados)"],
        crmAndAutomation: [tpl.tools[4] || "Planilhas Excel"],
        vulnerabilitiesAndGaps: keyFlaws
      },
      identifiedPain: pain,
      suggestedAction: icpTier === 'SCORE_A' ? "Disparo WhatsApp Quebra de Padrão (1h) + Call com SDR" : "Iniciar Régua de Cadência de 21 Dias",
      matchReason: `Forte sinergia com ${cleanBusinessName}: a dor de ${pain.toLowerCase()} é 100% solucionada por ${cleanUvp}.`,
      digitalGaps: keyFlaws,
      budgetMaturity: icpScore >= 85 ? 'Alta' : 'Média',
      decisionMaker: {
        name: fullName,
        role: role,
        directEmail: decEmail,
        directPhone: decPhone,
        linkedin: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(fullName + ' ' + companyName)}`
      },
      outreach: {
        whatsapp: {
          option1Curiosity: `Oi ${firstName}, tudo bem? Notei que a ${companyName} tem uma operação sólida em ${city}, mas está perdendo oportunidades por ${pain.toLowerCase()}. Criamos uma solução que elimina isso em 14 dias. Tem 5 minutos nesta semana para conversarmos?`,
          option2RoiDirect: `Olá ${firstName}, vi que você lidera a ${companyName}. Ajudamos empresas como a sua a resolver ${pain.toLowerCase()} com ${cleanUvp.toLowerCase()}. Podemos agendar uma call de 10 min na quinta?`
        },
        email: {
          subject: `${firstName}, notei uma brecha na ${companyName}`,
          bodyAida: `Olá, ${firstName}.\n\nEstava analisando o posicionamento da ${companyName} e identifiquei uma oportunidade clara: ${pain.toLowerCase()}.\n\nNa ${cleanBusinessName}, implementamos ${cleanUvp.toLowerCase()} para empresas do seu porte.\n\nPodemos fazer um alinhamento rápido de 15 minutos nesta semana?\n\nAbraços,\nEquipe ${cleanBusinessName}`,
          bodyPas: `Olá, ${firstName}.\n\nSabemos que em ${city}, empresas de ${keyword} sofrem constantemente com ${pain.toLowerCase()}.\n\nIsso gera custos ocultos e perda de novos clientes.\n\nCom nossa metodologia, blindamos esse processo em tempo recorde.\n\nPodemos conversar na próxima terça-feira às 10h?\n\nAtenciosamente,\n${cleanBusinessName}`
        },
        coldCall: {
          iceBreaker5s: `"${firstName}, tudo bem? Sei que seu dia é corrido na ${companyName}, serei direto: identifiquei um ponto crítico na sua operação."`,
          anchorQuestion: `"Hoje vocês perdem quanto tempo gerenciando ${pain.toLowerCase()} manualmente?"`,
          pitch15s: `"Ajudamos operações como a sua a eliminar ${pain.toLowerCase()} e aumentar o faturamento em até 35% sem contratar novos funcionários. Tenho disponibilidade na quinta às 15h para te apresentar o diagnóstico."`,
          objectionTips: [
            "Se disser que já tem agência: 'Ótimo, não queremos substituir, e sim auditar a brecha de " + pain.toLowerCase() + ".'",
            "Se pedir por email: 'Perfeito, envio sim, mas 5 minutos de call poupam 10 trocas de emails longos.'"
          ]
        }
      },
      webhookPayloads: {
        zapiWhatsApp: {
          phone: phone.replace(/[^0-9]/g, ''),
          message: `Oi ${firstName}, tudo bem? Notei que a ${companyName} pode resolver ${pain.toLowerCase()}...`,
          leadName: fullName,
          company: companyName,
          icpScore: icpScore,
          intentScore: intentScore
        },
        resendEmail: {
          to: decEmail,
          subject: `${firstName}, notei uma oportunidade na ${companyName}`,
          text: `Olá ${firstName}, identificamos que a ${companyName} pode otimizar ${pain.toLowerCase()}...`,
          tags: [{ name: "icp_tier", value: icpTier }]
        },
        hubspotCrmTask: {
          taskName: `[Outbound 1h] Abordagem para ${companyName} (${fullName})`,
          company: companyName,
          contactName: fullName,
          priority: intentPriority === 'HIGH' ? 'HIGH' : 'MEDIUM',
          dealStage: 'Prospecção Qualificada',
          callScriptNotes: `Foco na dor de ${pain}. Decisor: ${fullName} (${role}).`,
          identifiedPain: pain,
          dueDate: new Date(Date.now() + 3600000).toISOString(),
          intentScore: intentScore,
          techStack: tpl.tools.slice(0, 4),
          urgencyFactor: "Alta urgência"
        }
      },
      status: 'new',
      source: 'synthetic',
      businessStatus: 'OPERATIONAL'
    };

    // Attach Deliverability Guardian, Objection Crusher, and Cadence Master
    tempLead.guardian = buildDeliverabilityGuardian(tempLead);
    const enhancedPayloads = buildEvolutionAndResendPayloads(tempLead, 'A');
    tempLead.objectionCrusher = buildObjectionCrusherMatrix(tempLead, businessProfile);
    tempLead.cadence = buildCadenceMaster(tempLead, businessProfile);

    tempLead.webhookPayloads = {
      ...tempLead.webhookPayloads,
      evolutionApiWhatsApp: enhancedPayloads.evolutionApiWhatsApp,
      resendEmail: enhancedPayloads.resendEmail
    };

    leads.push(tempLead);
  }

  return leads;
}
