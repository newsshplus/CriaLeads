import { Lead, DecisionMaker, TechStackAnalysis, BantPlusAnalysis, DeliverabilityGuardian } from "../types";
import { buildDeliverabilityGuardian } from "./deliverabilityService";
import { buildObjectionCrusherMatrix } from "./objectionCrusherService";
import { buildCadenceMaster } from "./cadenceService";
import { getAiConfig } from "./aiProviderService";
import { getSavedCountry } from "./countryService";

const APOLLO_DEFAULT_API_KEY = "sNS9dM7swXJiXSfNJ9XkRg";
const APOLLO_KEY_STORAGE = "architect_apollo_api_key_v1";

/**
 * Obtém a chave de API do Apollo.io (da variável de ambiente, localStorage ou padrão)
 */
export function getApolloApiKey(): string {
  try {
    const customKey = localStorage.getItem(APOLLO_KEY_STORAGE);
    if (customKey && customKey.trim()) return customKey.trim();
  } catch {}

  const config = getAiConfig();
  if (config.apolloApiKey && config.apolloApiKey.trim()) {
    return config.apolloApiKey.trim();
  }

  return (typeof process !== 'undefined' && process.env && process.env.APOLLO_API_KEY) 
    ? process.env.APOLLO_API_KEY 
    : APOLLO_DEFAULT_API_KEY;
}

export function saveApolloApiKey(key: string): void {
  try {
    localStorage.setItem(APOLLO_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error("Falha ao salvar Apollo API key:", e);
  }
}

export interface ApolloSearchParams {
  q_keywords?: string;
  person_titles?: string[];
  organization_locations?: string[];
  q_organization_domains?: string[];
  organization_num_employees_ranges?: string[];
  page?: number;
  per_page?: number;
}

export interface ApolloPersonResult {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title: string;
  email?: string;
  email_status?: string;
  photo_url?: string;
  twitter_url?: string;
  github_url?: string;
  facebook_url?: string;
  phone_numbers?: Array<{ raw_number: string; sanitized_number: string; type: string }>;
  sanitized_phone?: string;
  city?: string;
  state?: string;
  country?: string;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    linkedin_url?: string;
    logo_url?: string;
    primary_phone?: { number: string };
    estimated_num_employees?: number;
    keywords?: string[];
    industry?: string;
    short_description?: string;
    technology_names?: string[];
  };
}

export interface ApolloOrganizationResult {
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  primary_domain?: string;
  phone?: string;
  logo_url?: string;
  estimated_num_employees?: number;
  industry?: string;
  keywords?: string[];
  technology_names?: string[];
  street_address?: string;
  city?: string;
  state?: string;
  country?: string;
  short_description?: string;
}

/**
 * Busca de Decisores & Pessoas no Apollo.io (/v1/mixed_people/search)
 */
export async function searchApolloPeople(
  params: ApolloSearchParams,
  apiKeyOverride?: string
): Promise<{ people: ApolloPersonResult[]; total: number; error?: string }> {
  const apiKey = apiKeyOverride || getApolloApiKey();

  const titles = params.person_titles && params.person_titles.length > 0 
    ? params.person_titles 
    : [
        "CEO", "Founder", "Co-Founder", "Chief Executive Officer", 
        "CMO", "Chief Marketing Officer", "Marketing Director", "Diretor de Marketing", 
        "Head of Marketing", "Sales Director", "Diretor Comercial", "Gerente Comercial", 
        "Head of Sales", "Managing Director", "Sócio", "Proprietário"
      ];

  const bodyPayload: any = {
    api_key: apiKey,
    page: params.page || 1,
    per_page: params.per_page || 25,
    person_titles: titles
  };

  if (params.q_keywords) {
    bodyPayload.q_keywords = params.q_keywords;
  }
  if (params.organization_locations && params.organization_locations.length > 0) {
    bodyPayload.person_locations = params.organization_locations;
  }
  if (params.q_organization_domains && params.q_organization_domains.length > 0) {
    bodyPayload.q_organization_domains = params.q_organization_domains.join("\n");
  }

  try {
    const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson.message || errJson.error || `HTTP ${res.status}: ${res.statusText}`;
      return { people: [], total: 0, error: msg };
    }

    const data = await res.json();
    const people: ApolloPersonResult[] = (data.people || data.contacts || []).map((p: any) => ({
      id: p.id || `apollo-${Math.random().toString(36).substring(2, 9)}`,
      first_name: p.first_name || "",
      last_name: p.last_name || "",
      name: p.name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Decisor Mapeado",
      title: p.title || "Diretoria / Decisor",
      linkedin_url: p.linkedin_url || (p.linkedin_slug ? `https://www.linkedin.com/in/${p.linkedin_slug}` : undefined),
      email: p.email || (p.email_status === 'verified' ? p.email : undefined),
      email_status: p.email_status || 'unknown',
      photo_url: p.photo_url,
      twitter_url: p.twitter_url,
      github_url: p.github_url,
      phone_numbers: p.phone_numbers || [],
      sanitized_phone: p.sanitized_phone || (p.phone_numbers?.[0]?.sanitized_number),
      city: p.city || p.organization?.city,
      state: p.state || p.organization?.state,
      country: p.country || p.organization?.country,
      organization: p.organization ? {
        id: p.organization.id,
        name: p.organization.name || "Empresa",
        website_url: p.organization.website_url,
        linkedin_url: p.organization.linkedin_url,
        logo_url: p.organization.logo_url,
        primary_phone: p.organization.primary_phone,
        estimated_num_employees: p.organization.estimated_num_employees,
        keywords: p.organization.keywords || [],
        industry: p.organization.industry || "Serviços B2B",
        short_description: p.organization.short_description,
        technology_names: p.organization.technology_names || []
      } : undefined
    }));

    return {
      people,
      total: data.pagination?.total_entries || people.length
    };
  } catch (error: any) {
    console.error("Erro na busca de pessoas no Apollo.io:", error);
    return { people: [], total: 0, error: error.message || "Erro de conexão com API Apollo.io" };
  }
}

/**
 * Busca e Enriquecimento de Organizações no Apollo.io (/v1/organizations/search)
 */
export async function searchApolloOrganizations(
  params: {
    q_organization_name?: string;
    organization_locations?: string[];
    q_organization_domains_list?: string[];
    page?: number;
    per_page?: number;
  },
  apiKeyOverride?: string
): Promise<{ organizations: ApolloOrganizationResult[]; total: number; error?: string }> {
  const apiKey = apiKeyOverride || getApolloApiKey();

  const bodyPayload: any = {
    api_key: apiKey,
    page: params.page || 1,
    per_page: params.per_page || 15
  };

  if (params.q_organization_name) {
    bodyPayload.q_organization_name = params.q_organization_name;
  }
  if (params.organization_locations && params.organization_locations.length > 0) {
    bodyPayload.organization_locations = params.organization_locations;
  }

  try {
    const res = await fetch("https://api.apollo.io/v1/organizations/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { organizations: [], total: 0, error: errJson.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    const organizations: ApolloOrganizationResult[] = (data.organizations || []).map((o: any) => ({
      id: o.id || `org-${Math.random().toString(36).substring(2, 9)}`,
      name: o.name || "Empresa",
      website_url: o.website_url,
      linkedin_url: o.linkedin_url,
      primary_domain: o.primary_domain,
      phone: o.phone || o.primary_phone?.number,
      logo_url: o.logo_url,
      estimated_num_employees: o.estimated_num_employees,
      industry: o.industry || "Serviços B2B",
      keywords: o.keywords || [],
      technology_names: o.technology_names || [],
      street_address: o.street_address,
      city: o.city,
      state: o.state,
      country: o.country,
      short_description: o.short_description
    }));

    return {
      organizations,
      total: data.pagination?.total_entries || organizations.length
    };
  } catch (error: any) {
    console.error("Erro na busca de organizações no Apollo.io:", error);
    return { organizations: [], total: 0, error: error.message };
  }
}

/**
 * Converte um resultado do Apollo.io em um Lead BANT+ completo
 */
export function convertApolloPersonToLead(
  person: ApolloPersonResult,
  targetCountry: string = "Portugal",
  targetCity: string = "Lisboa"
): Lead {
  const org = person.organization;
  const companyName = org?.name || "Empresa Corporativa";
  const website = org?.website_url || (org?.name ? `https://${org.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : undefined);
  
  const contactName = person.name || "Decisor";
  const contactTitle = person.title || "Diretor Comercial / Marketing";
  const directPhone = person.sanitized_phone || person.phone_numbers?.[0]?.raw_number || org?.primary_phone?.number;
  const directEmail = person.email;

  const detectedTech = org?.technology_names || ["Google Analytics", "WordPress"];
  
  // Tech stack gaps
  const gaps: string[] = [];
  if (!detectedTech.some(t => t.toLowerCase().includes('pixel') || t.toLowerCase().includes('meta'))) {
    gaps.push("Ausência de Meta Pixel / CAPI rastreando conversões");
  }
  if (!detectedTech.some(t => t.toLowerCase().includes('hubspot') || t.toLowerCase().includes('rd') || t.toLowerCase().includes('crm'))) {
    gaps.push("Sem CRM de Vendas automatizado detectado");
  }
  if (!detectedTech.some(t => t.toLowerCase().includes('hotjar') || t.toLowerCase().includes('clarity'))) {
    gaps.push("Sem análise de mapa de calor / UX de conversão");
  }
  if (gaps.length === 0) {
    gaps.push("Funil de agendamento sem automação de triagem imediata");
  }

  const decisionMaker: DecisionMaker = {
    name: contactName,
    role: contactTitle,
    linkedin: person.linkedin_url || org?.linkedin_url,
    directEmail: directEmail,
    directPhone: directPhone
  };

  const bantPlus: BantPlusAnalysis = {
    budget: {
      estimatedBudget: org?.estimated_num_employees && org.estimated_num_employees > 50 ? "Alto (> € 15.000)" : "Médio (€ 5.000 a € 15.000)",
      companySize: org?.estimated_num_employees ? `${org.estimated_num_employees} colaboradores` : "10-50 colaboradores",
      estimatedRevenue: org?.estimated_num_employees && org.estimated_num_employees > 20 ? "€ 1.5M - € 5M / ano" : "€ 500k - € 1.5M / ano",
      rating: org?.estimated_num_employees && org.estimated_num_employees > 20 ? "Alto" : "Médio"
    },
    authority: {
      keyDecisionMaker: contactName,
      role: contactTitle,
      orgStructure: `${contactTitle} (${companyName})`,
      linkedinSearchUrl: person.linkedin_url
    },
    need: {
      operationalFlaws: [
        "Ausência de triagem e atendimento imediato com IA no WhatsApp",
        "Website institucional com baixa taxa de conversão de visitantes em reuniões",
        "Falta de rastreamento avançado de ROI nos canais digitais"
      ],
      primaryNeed: "Automação de prospecção, aceleração comercial e infraestrutura digital CriaHub",
      impactSummary: "Perda estimada de 30% a 45% dos leads quentes por atrito de contato e demora de retorno."
    },
    timeline: {
      urgencyFactor: "Expansão comercial ativa identificada no perfil do LinkedIn",
      urgencyLevel: "Médio (30 dias)",
      signals: ["Decisor ativo no LinkedIn", "Estrutura pronta para automação"]
    }
  };

  const techStack: TechStackAnalysis = {
    detectedTools: detectedTech,
    cmsOrPlatform: detectedTech.find(t => t.toLowerCase().includes('wordpress') || t.toLowerCase().includes('shopify') || t.toLowerCase().includes('webflow')) || "Custom CMS",
    analyticsAndPixels: detectedTech.filter(t => t.toLowerCase().includes('analytics') || t.toLowerCase().includes('tag') || t.toLowerCase().includes('pixel')),
    crmAndAutomation: detectedTech.filter(t => t.toLowerCase().includes('hubspot') || t.toLowerCase().includes('rd') || t.toLowerCase().includes('pipedrive')),
    vulnerabilitiesAndGaps: gaps
  };

  const leadId = `lead-apollo-${person.id || Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const partialLead: Partial<Lead> = {
    id: leadId,
    name: companyName,
    category: org?.industry || "Serviços B2B Corporativos",
    description: org?.short_description || `Empresa B2B com ${org?.estimated_num_employees || '10-50'} colaboradores.`,
    address: `${person.city || targetCity}, ${person.country || targetCountry}`,
    city: person.city || targetCity,
    district: person.state || "Distrito Central",
    country: person.country || targetCountry,
    website: website,
    phone: directPhone,
    email: directEmail,
    rating: 4.8,
    reviews: Math.floor(Math.random() * 45) + 12,
    score: 92,
    icpScore: 88,
    icpTier: 'SCORE_A',
    identifiedPain: "Processos comerciais com perda de conversão por falta de automação CriaHub",
    suggestedAction: `Abordar ${contactName} (${contactTitle}) via WhatsApp/LinkedIn com diagnóstico gratuito`,
    digitalGaps: gaps,
    budgetMaturity: 'Alta',
    decisionMaker,
    bantPlus,
    techStack,
    intentScore: 85,
    intentPriority: 'HIGH',
    urgencyFactor: 'Decisor mapeado com contato verificado no LinkedIn & Apollo',
    keyFlaws: gaps.slice(0, 3),
    status: 'new',
    source: 'apollo',
    originApi: 'apollo',
    originApiLabel: 'Apollo.io (LinkedIn B2B)',
    capturedAt: new Date().toLocaleDateString('pt-BR')
  };

  // Outreach & Deliverability com padrão Master SDR (+10 Anos de Experiência)
  const isPt = (person.country || targetCountry).toLowerCase().includes('portugal') || (person.country || targetCountry).toLowerCase().includes('pt');
  const firstName = contactName && !contactName.toLowerCase().includes('responsável') && !contactName.toLowerCase().includes('diretoria') && !contactName.toLowerCase().includes('ceo')
    ? contactName.split(' ')[0]
    : '';
  
  const greeting = isPt 
    ? (firstName ? `Viva ${firstName}, tudo bem?` : `Viva, tudo bem com a equipa da ${companyName}?`)
    : (firstName ? `Fala ${firstName}, tudo bem?` : `Olá, tudo bem com a equipe da ${companyName}?`);

  const city = person.city || targetCity;
  const signOff = isPt ? 'Um grande abraço e votos de continuação de sucesso' : 'Um abraço e parabéns pelo trabalho';

  const outreach = {
    whatsapp: {
      option1Curiosity: isPt
        ? `Viva ${firstName || contactName}, tudo bem?\n\nAcompanho com grande admiração a autoridade que a ${companyName} conquistou em ${city}. Parabéns pela liderança no setor!\n\nIdentificamos uma oportunidade excelente para unir a vossa experiência à nossa engenharia de captação da CriaHub, acelerando novos contratos de alto ticket sem custos pesados.\n\nFaria sentido batermos 5 minutos rápidos nesta semana para eu te apresentar esse desenho prático?\n\n${signOff}`
        : `Fala ${firstName || contactName}, tudo bem?\n\nAcompanho com grande admiração o trabalho de alto nível e a autoridade que a ${companyName} construiu em ${city}. Parabéns pelo posicionamento!\n\nIdentificamos uma oportunidade de ouro para unir a experiência de vocês com a nossa engenharia de captação da CriaHub, fazendo a ${companyName} dominar as buscas e contratos de alto valor da região sem custos pesados.\n\nFaria sentido batermos 5 minutos rápidos nesta semana para eu te mostrar esse mapa de expansão?\n\n${signOff}`,
      option2RoiDirect: isPt
        ? `Viva ${firstName || contactName}, como ${contactTitle} na ${companyName} (${city}), sei que preza pela excelência. Estruturámos um modelo de aceleração comercial para consolidar a sua empresa como a referência número 1 do distrito. Vale falarmos 5 minutos amanhã?`
        : `Oi ${firstName || contactName}, vi sua atuação como ${contactTitle} na ${companyName} (${city}). Estruturamos uma estratégia para consolidar a sua empresa como a maior referência da região, alavancando novos clientes qualificados no automático. Vale batermos 5 min rápidos amanhã?`
    },
    email: {
      subject: `${firstName ? firstName + ', ' : ''}Parabéns pela autoridade da ${companyName} em ${city}`,
      bodyAida: `${greeting}\n\nAcompanho com grande admiração a sua atuação como ${contactTitle} e a solidez que a ${companyName} construiu no mercado de ${city}.\n\nO mercado regional está altamente aquecido e clientes qualificados de alto padrão procuram exatamente a excelência técnica que vocês entregam.\n\nNa CriaHub, nós desenvolvemos uma engenharia de captação que une a tradição da sua empresa com tecnologia de ultra-conversão, tornando a ${companyName} a escolha incontestável da região, sem custos elevados ou riscos operacionais.\n\nFaria sentido conversarmos 10 minutos nesta quinta-feira para eu te apresentar esse estudo de expansão?\n\n${signOff},\nEquipe CriaHub`,
      bodyPas: `${greeting}\n\nEmpresas consolidadas como a ${companyName} em ${city} muitas vezes enfrentam concorrentes menores que tentam compensar a falta de qualidade com propaganda agressiva.\n\nSua excelência técnica merece estar no topo absoluto e ser a primeira escolha de todo cliente de alto valor da região.\n\nA CriaHub desenvolveu a infraestrutura ideal para posicionar vocês no topo definitivo de ${city} com máxima eficiência e sem custos pesados.\n\nPodemos alinhar 10 minutos na sua agenda nesta semana?\n\n${signOff}`
    },
    coldCall: {
      iceBreaker5s: isPt 
        ? `Viva ${contactName}, daqui fala o consultor sénior da CriaHub. Sei que não esperava a minha chamada, mas prometo ser 100% breve: tenho acompanhado a liderança da ${companyName} em ${city}.`
        : `Olá ${contactName}, aqui é o consultor sênior da CriaHub, tudo bem? Sei que você não esperava minha ligação, mas prometo ser cirúrgico: tenho acompanhado o trabalho de alto nível da ${companyName} em ${city}.`,
      anchorQuestion: `Vocês já têm uma reputação sólida em ${city}, mas o mercado local tem uma fatia enorme de clientes de alto valor procurando por ${org?.industry || 'serviços no seu segmento'}. Como está o planejamento de vocês para capturar 100% dessa demanda regional neste semestre?`,
      pitch15s: `O nosso foco não é vender ferramentas avulsas, e sim unir a experiência e reputação que a ${companyName} já tem com a nossa engenharia de captação CriaHub, garantindo que vocês sejam a escolha óbvia de qualquer cliente em ${city}, sem custos elevados.`,
      objectionTips: [
        `Se disser "Já tenho parceiro": "Excelente saber que já têm apoio, ${firstName || 'gestor'}! Nosso objetivo não é substituir ninguém, mas sim apresentar um estudo complementar de expansão em ${city} que a sua própria equipe pode usar."`,
        `Se disser "Estou sem tempo": "Imagino a correria liderando a ${companyName}, ${firstName || 'gestor'}. Respeito 100% seu tempo: só preciso de 10 minutos amanhã cedo para te entregar o mapa na tela."`,
        `Se disser "Mande por e-mail": "Com certeza! Mas como preparamos uma análise específica para o mercado de ${city}, prefiro abrir a tela 10 minutos amanhã para você ver os números reais. Fica melhor às 10h ou 14h?"`
      ]
    }
  };

  const completeLead = {
    ...partialLead,
    outreach,
    webhookPayloads: {} as any
  } as Lead;

  completeLead.guardian = buildDeliverabilityGuardian(completeLead);
  completeLead.objectionCrusher = buildObjectionCrusherMatrix(completeLead);
  completeLead.cadence = buildCadenceMaster(completeLead);

  return completeLead;
}

/**
 * Realiza teste de conexão e validação da chave do Apollo.io
 */
export async function testApolloApiKey(apiKey: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, latencyMs: 0, error: "Chave do Apollo.io vazia." };
  }

  const start = Date.now();
  try {
    const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey.trim(),
        page: 1,
        per_page: 1
      })
    });

    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { success: true, latencyMs };
    }

    const errJson = await res.json().catch(() => ({}));
    return { success: false, latencyMs, error: errJson.message || `Erro HTTP ${res.status}: ${res.statusText}` };
  } catch (e: any) {
    return { success: false, latencyMs: Date.now() - start, error: e.message || "Erro ao conectar com API Apollo.io" };
  }
}
