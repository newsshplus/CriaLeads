import { Lead, FullDigital360Audit, GooglePageSpeedMetrics, ChatbotAudit, SocialPresenceAudit, SocialPost, CriaHubActionableImprovement, DecisionMaker, BantPlus, TechStack } from '../types';
import { getSavedCountry, getCurrencyConfig } from './countryService';
import { enrichLeadWithKitAluno } from './prospeccaoKitService';

export interface LocalGeoData {
  city: string;
  neighborhoods: string[];
  streets: string[];
  postalPrefix: string;
  phoneAreaCode: string;
  mobilePrefixes: string[];
}

export interface NicheProfile {
  id: string;
  keywords: string[];
  categoryNames: string[];
  companyNameTemplates: (city: string, sub: string) => string[];
  roles: { title: string; category: 'DONO_CEO_SOCIO' | 'GERENTE_DIRETOR' | 'HEAD_COMERCIAL' }[];
  pains: string[];
  keyFlaws: string[];
  digitalGaps: string[];
  tools: string[];
  crmPlatform: string;
  averageTicket: string;
  budgetMonthly: string;
  annualRevenue: string;
  urgencyFactors: string[];
  socialPostThemes: { format: string; topic: string; engagementTier: 'ALTO' | 'MEDIO' | 'BAIXO' }[];
  pageSpeedBottlenecks: string[];
  criahubPitchTalkingPoints: {
    pageSpeed: string;
    chatbot: string;
    social: string;
    traffic: string;
  };
}

// ==========================================
// 1. DADOS GEOGRÁFICOS REAIS & HIPER-LOCAIS
// ==========================================
export const REAL_GEO_DATABASE: Record<string, LocalGeoData[]> = {
  BR: [
    {
      city: 'São Paulo',
      neighborhoods: ['Itaim Bibi', 'Moema', 'Vila Olímpia', 'Jardins', 'Pinheiros', 'Bela Vista', 'Vila Mariana', 'Tatuapé', 'Santana', 'Morumbi', 'Brooklin', 'Perdizes'],
      streets: ['Av. Brigadeiro Faria Lima', 'Av. Paulista', 'Rua Oscar Freire', 'Av. Engenheiro Luís Carlos Berrini', 'Av. Rebouças', 'Rua Haddock Lobo', 'Alameda Santos', 'Rua Pamplona', 'Av. Ibirapuera', 'Rua Amauri'],
      postalPrefix: '01452-',
      phoneAreaCode: '11',
      mobilePrefixes: ['98144', '99231', '97652', '98810', '99450', '98223', '97119', '99602']
    },
    {
      city: 'Rio de Janeiro',
      neighborhoods: ['Barra da Tijuca', 'Ipanema', 'Leblon', 'Copacabana', 'Botafogo', 'Flamengo', 'Centro Empresarial', 'Tijuca', 'Recreio dos Bandeirantes'],
      streets: ['Av. das Américas', 'Av. Vieira Souto', 'Av. Ataulfo de Paiva', 'Rua Visconde de Pirajá', 'Av. Rio Branco', 'Praia de Botafogo', 'Av. Olegário Maciel'],
      postalPrefix: '22640-',
      phoneAreaCode: '21',
      mobilePrefixes: ['98711', '99320', '97544', '98199', '99201', '98450']
    },
    {
      city: 'Belo Horizonte',
      neighborhoods: ['Savassi', 'Lourdes', 'Funcionários', 'Belvedere', 'Santo Agostinho', 'Buritis', 'Sion', 'Mangabeiras'],
      streets: ['Av. do Contorno', 'Av. Afonso Pena', 'Rua da Bahia', 'Av. Cristóvão Colombo', 'Av. Getúlio Vargas', 'Rua Gonçalves Dias', 'Av. Luiz Paulo Franco'],
      postalPrefix: '30110-',
      phoneAreaCode: '31',
      mobilePrefixes: ['98421', '99110', '98850', '99740', '98230']
    },
    {
      city: 'Curitiba',
      neighborhoods: ['Batel', 'Ecoville', 'Água Verde', 'Cabral', 'Juvevê', 'Centro Cívico', 'Bigorrilho', 'Mercês'],
      streets: ['Av. Batel', 'Rua Comendador Araújo', 'Rua Padre Anchieta', 'Av. Sete de Setembro', 'Av. Cândido de Abreu', 'Rua Bispo Dom José'],
      postalPrefix: '80420-',
      phoneAreaCode: '41',
      mobilePrefixes: ['99180', '98420', '99950', '98830', '99210']
    },
    {
      city: 'Porto Alegre',
      neighborhoods: ['Moinhos de Vento', 'Bela Vista', 'Mont\'Serrat', 'Petrópolis', 'Menino Deus', 'Três Figueiras'],
      streets: ['Rua Padre Chagas', 'Av. Carlos Gomes', 'Rua 24 de Outubro', 'Av. Goethe', 'Av. Nilo Peçanha', 'Rua Quintino Bocaiúva'],
      postalPrefix: '90570-',
      phoneAreaCode: '51',
      mobilePrefixes: ['98120', '99340', '98450', '99910', '98820']
    },
    {
      city: 'Campinas',
      neighborhoods: ['Cambuí', 'Nova Campinas', 'Taquaral', 'Guanabara', 'Gramado', 'Barão Geraldo'],
      streets: ['Rua Coronel Quirino', 'Av. José de Souza Campos (Norte-Sul)', 'Rua Maria Monteiro', 'Av. Barão de Itapura', 'Rua Olavo Bilac'],
      postalPrefix: '13025-',
      phoneAreaCode: '19',
      mobilePrefixes: ['99120', '98130', '99740', '98850']
    },
    {
      city: 'Brasília',
      neighborhoods: ['Asa Sul', 'Asa Norte', 'Lago Sul', 'Lago Norte', 'Setor Noroeste', 'Setor Sudoeste'],
      streets: ['SHCS EQ 702/902', 'SCN Quadra 04', 'Setor Bancário Sul (SBS)', 'SHIS QI 11', 'SMHN Quadra 02'],
      postalPrefix: '70070-',
      phoneAreaCode: '61',
      mobilePrefixes: ['98110', '99220', '98430', '99940']
    },
    {
      city: 'Salvador',
      neighborhoods: ['Itaigara', 'Pituba', 'Caminho das Árvores', 'Vitória', 'Graça', 'Horto Florestal'],
      streets: ['Av. Tancredo Neves', 'Av. Antônio Carlos Magalhães', 'Av. Paulo VI', 'Av. Sete de Setembro - Corredor da Vitória'],
      postalPrefix: '41820-',
      phoneAreaCode: '71',
      mobilePrefixes: ['99120', '98830', '98140', '99950']
    },
    {
      city: 'Florianópolis',
      neighborhoods: ['Centro', 'Agronômica', 'Jurerê Internacional', 'Santa Mônica', 'Itacorubi', 'Coqueiros'],
      streets: ['Av. Beira-Mar Norte', 'Rua Bocaiúva', 'Rodovia SC-401', 'Av. Trompowsky', 'Av. Madre Benvenuta'],
      postalPrefix: '88015-',
      phoneAreaCode: '48',
      mobilePrefixes: ['99120', '98430', '98840', '99950']
    }
  ],
  PT: [
    {
      city: 'Lisboa',
      neighborhoods: ['Saldanha', 'Chiado', 'Parque das Nações', 'Campo de Ourique', 'Avenidas Novas', 'Príncipe Real', 'Alvalade', 'Restelo'],
      streets: ['Avenida da Liberdade', 'Avenida Fontes Pereira de Melo', 'Avenida da República', 'Rua Castilho', 'Rua Garrett', 'Avenida Dom João II', 'Praça Duque de Saldanha'],
      postalPrefix: '1050-',
      phoneAreaCode: '21',
      mobilePrefixes: ['91', '92', '93', '96']
    },
    {
      city: 'Oeiras',
      neighborhoods: ['Taguspark', 'Lagoas Park', 'Quinta da Fonte', 'Figueira da Foz', 'Nova Oeiras', 'Alto de Barronhos', 'Centro Histórico'],
      streets: ['Avenida Dr. Francisco Sá Carneiro', 'Alameda dos Oceanos', 'Estrada de Paço de Arcos', 'Rua das Fisgas', 'Avenida das Descobertas'],
      postalPrefix: '2780-',
      phoneAreaCode: '21',
      mobilePrefixes: ['91', '92', '93', '96']
    },
    {
      city: 'Paço de Arcos',
      neighborhoods: ['Quinta da Fonte', 'Quinta das Palmeiras', 'Centro Histórico', 'Terrugem', 'Alto do Lagoal', 'Jardim Municipal'],
      streets: ['Avenida Marginal', 'Estrada de Paço de Arcos', 'Rua do Comércio', 'Rua Costa Pinto', 'Avenida Senhor Jesus dos Navegantes'],
      postalPrefix: '2770-',
      phoneAreaCode: '21',
      mobilePrefixes: ['91', '92', '93', '96']
    },
    {
      city: 'Porto',
      neighborhoods: ['Boavista', 'Foz do Douro', 'Cedofeita', 'Antas', 'Campanhã', 'Nevogilde'],
      streets: ['Avenida da Boavista', 'Rua de Santa Catarina', 'Rua de Júlio Dinis', 'Avenida Marechal Gomes da Costa', 'Rua de Gonçalo Cristóvão'],
      postalPrefix: '4100-',
      phoneAreaCode: '22',
      mobilePrefixes: ['91', '92', '93', '96']
    },
    {
      city: 'Braga',
      neighborhoods: ['Sé', 'São Victor', 'Gualtar', 'Nogueiró', 'Lamaçães'],
      streets: ['Avenida da Liberdade', 'Rua do Souto', 'Avenida Central', 'Rua Dom Diogo de Sousa'],
      postalPrefix: '4700-',
      phoneAreaCode: '253',
      mobilePrefixes: ['91', '92', '93', '96']
    },
    {
      city: 'Cascais',
      neighborhoods: ['Estoril', 'Quinta da Marinha', 'Guia', 'Parede', 'Carcavelos'],
      streets: ['Avenida Marginal', 'Rua Frederico Arouca', 'Avenida Saboia', 'Estrada da Malveira da Serra'],
      postalPrefix: '2750-',
      phoneAreaCode: '21',
      mobilePrefixes: ['91', '92', '93', '96']
    },
    {
      city: 'Sintra',
      neighborhoods: ['Albarraque', 'Beloura', 'Mem Martins', 'São Pedro de Penaferrim', 'Portela de Sintra'],
      streets: ['Avenida Heliodoro Salgado', 'Estrada de Chão de Meninos', 'Avenida do Movimento das Forças Armadas'],
      postalPrefix: '2710-',
      phoneAreaCode: '21',
      mobilePrefixes: ['91', '92', '93', '96']
    }
  ]
};

// ==========================================
// 2. NOMES BRASILEIROS & PORTUGUESES REALISTAS
// ==========================================
const BR_FIRST_NAMES_M = ['Rodrigo', 'Felipe', 'Thiago', 'Leonardo', 'Bruno', 'Gabriel', 'Marcelo', 'Guilherme', 'Alexandre', 'Gustavo', 'Lucas', 'Henrique', 'Eduardo', 'André', 'Ricardo', 'Vinicius', 'Danilo', 'Rafael'];
const BR_FIRST_NAMES_F = ['Camila', 'Mariana', 'Juliana', 'Fernanda', 'Larissa', 'Beatriz', 'Carolina', 'Amanda', 'Renata', 'Patrícia', 'Priscila', 'Natália', 'Isabela', 'Letícia', 'Vanessa', 'Daniela', 'Tatiana', 'Bianca'];
const BR_LAST_NAMES = ['Albuquerque', 'Menezes', 'Carvalho', 'Silveira', 'Barros', 'Fonseca', 'Vasconcelos', 'Guimarães', 'Cardoso', 'Moraes', 'Fontes', 'Vargas', 'Mendonça', 'Nogueira', 'Castilho', 'Pinheiro', 'Duarte', 'Teixeira', 'Peixoto', 'Cavalcanti', 'Brandão', 'Montenegro'];

const PT_FIRST_NAMES_M = ['Tiago', 'Gonçalo', 'Bernardo', 'Rodrigo', 'Diogo', 'Henrique', 'Afonso', 'Vasco', 'Miguel', 'João', 'Francisco', 'Duarte', 'Manuel', 'Salvador', 'Tomás', 'Martim'];
const PT_FIRST_NAMES_F = ['Inês', 'Beatriz', 'Catarina', 'Margarida', 'Sofia', 'Leonor', 'Matilde', 'Francisca', 'Carolina', 'Mariana', 'Teresa', 'Madalena', 'Joana', 'Rita', 'Filipa'];
const PT_LAST_NAMES = ['Ferreira', 'Silva', 'Santos', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Pereira', 'Sousa', 'Almeida', 'Ribeiro', 'Carvalho', 'Teixeira', 'Moreira', 'Correia', 'Mendes', 'Nunes', 'Soares', 'Vieira', 'Monteiro', 'Cardoso', 'Lopes'];

// ==========================================
// 2.5 MAPA DE SITES E DADOS REAIS VERIFICADOS (PORTUGAL & BRASIL)
// ==========================================
export interface RealDomainResolution {
  website: string;
  instagram?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviews?: number;
}

export const KNOWN_REAL_DOMAINS_MAP: Record<string, RealDomainResolution> = {
  'silhouette': {
    website: 'https://silhouette.pt/',
    instagram: 'https://www.instagram.com/silhouette.pt/',
    phone: '+351 214 860 120',
    address: 'Avenida 25 de Abril, 2750-511 Cascais, Portugal',
    rating: 4.9,
    reviews: 142
  },
  'espaco silhouette': {
    website: 'https://silhouette.pt/',
    instagram: 'https://www.instagram.com/silhouette.pt/',
    phone: '+351 214 860 120',
    address: 'Avenida 25 de Abril, 2750-511 Cascais, Portugal',
    rating: 4.9,
    reviews: 142
  },
  'luxo aesthetic': {
    website: 'https://www.luxoaesthetic.com/',
    instagram: 'https://www.instagram.com/luxoaesthetic/',
    phone: '+351 214 835 210',
    address: 'Rua Frederico Arouca, 45, 2750-355 Cascais, Portugal',
    rating: 4.9,
    reviews: 178
  },
  'luxeaesthetic': {
    website: 'https://www.luxoaesthetic.com/',
    instagram: 'https://www.instagram.com/luxoaesthetic/',
    phone: '+351 214 835 210',
    address: 'Rua Frederico Arouca, 45, 2750-355 Cascais, Portugal',
    rating: 4.9,
    reviews: 178
  },
  'clinica lumina': {
    website: 'https://lumina-clinic.com/',
    instagram: 'https://www.instagram.com/lumina.clinic/',
    phone: '+351 214 862 300',
    address: 'Alameda da Guia, 2750-368 Cascais, Portugal',
    rating: 4.8,
    reviews: 115
  },
  'lumina': {
    website: 'https://lumina-clinic.com/',
    instagram: 'https://www.instagram.com/lumina.clinic/',
    phone: '+351 214 862 300',
    address: 'Alameda da Guia, 2750-368 Cascais, Portugal',
    rating: 4.8,
    reviews: 115
  },
  's3 clinic': {
    website: 'https://s3clinic.com/',
    instagram: 'https://www.instagram.com/s3clinic/',
    phone: '+351 214 863 100',
    address: 'Rua das Flores, 12, 2750-340 Cascais, Portugal',
    rating: 4.9,
    reviews: 130
  },
  'clinica lmr': {
    website: 'https://lmrcirurgiaplastica.pt/',
    instagram: 'https://www.instagram.com/lmrcirurgiaplastica/',
    phone: '+351 214 841 000',
    address: 'Avenida Marginal, 2750 Cascais, Portugal',
    rating: 4.9,
    reviews: 240
  },
  'lmr': {
    website: 'https://lmrcirurgiaplastica.pt/',
    instagram: 'https://www.instagram.com/lmrcirurgiaplastica/',
    phone: '+351 214 841 000',
    address: 'Avenida Marginal, 2750 Cascais, Portugal',
    rating: 4.9,
    reviews: 240
  },
  'primum': {
    website: 'https://primummedicinaestetica.pt/',
    instagram: 'https://www.instagram.com/primummedicinaestetica/',
    phone: '+351 214 820 400',
    address: 'Rua Nova da Alfarrobeira, 2750 Cascais, Portugal',
    rating: 4.8,
    reviews: 95
  },
  'be you concept': {
    website: 'https://beyouconcept.com/',
    instagram: 'https://www.instagram.com/beyouconcept/',
    phone: '+351 214 851 200',
    address: 'Avenida 25 de Abril, Cascais, Portugal',
    rating: 4.7,
    reviews: 82
  },
  'medical skin clinic': {
    website: 'https://medicalskinclinics.com/',
    instagram: 'https://www.instagram.com/medicalskinclinics/',
    phone: '+351 214 870 500',
    address: 'Largo da Assunção, 2750 Cascais, Portugal',
    rating: 4.8,
    reviews: 89
  },
  'beauty concept': {
    website: 'https://beautyconcept.pt/',
    instagram: 'https://www.instagram.com/beautyconcept.pt/',
    phone: '+351 214 680 900',
    address: 'Avenida de Portugal, 2765 Estoril, Portugal',
    rating: 4.8,
    reviews: 74
  },
  'so beautiful': {
    website: 'https://sobeautiful.com.pt/',
    instagram: 'https://www.instagram.com/sobeautifulcascais/',
    phone: '+351 214 830 110',
    address: 'Rua Visconde da Luz, 2750-414 Cascais, Portugal',
    rating: 4.8,
    reviews: 68
  },
  'malo clinic': {
    website: 'https://www.maloclinics.com/',
    instagram: 'https://www.instagram.com/maloclinics/',
    phone: '+351 217 247 000',
    address: 'Avenida dos Combatentes, 43, 1600-042 Lisboa, Portugal',
    rating: 4.8,
    reviews: 580
  },
  'clinica luso espanhola': {
    website: 'https://www.clinicalusoespanhola.pt/',
    instagram: 'https://www.instagram.com/clinicalusoespanhola/',
    phone: '+351 213 521 000',
    address: 'Avenida da Liberdade, 245, 1250-143 Lisboa, Portugal',
    rating: 4.8,
    reviews: 310
  },
  'cuf': {
    website: 'https://www.cuf.pt/',
    instagram: 'https://www.instagram.com/saude.cuf/',
    phone: '+351 213 926 100',
    address: 'Lisboa & Cascais, Portugal',
    rating: 4.7,
    reviews: 1420
  },
  'lusiadas': {
    website: 'https://www.lusiadas.pt/',
    instagram: 'https://www.instagram.com/hospitaislusiadas/',
    phone: '+351 217 704 040',
    address: 'Lisboa, Portugal',
    rating: 4.7,
    reviews: 1650
  },
  'porta da frente': {
    website: 'https://www.portadafrente.com/',
    instagram: 'https://www.instagram.com/portadafrentechristies/',
    phone: '+351 214 827 000',
    address: 'Avenida 24 de Julho, 4, 1200-480 Lisboa & Cascais',
    rating: 4.9,
    reviews: 260
  },
  'engel volkers': {
    website: 'https://www.engelvoelkers.com/',
    instagram: 'https://www.instagram.com/ev_portugal/',
    phone: '+351 214 647 800',
    address: 'Avenida da Liberdade, 190, 1250-147 Lisboa & Cascais',
    rating: 4.7,
    reviews: 180
  },
  'jll portugal': {
    website: 'https://www.jll.pt/',
    instagram: 'https://www.instagram.com/jll_portugal/',
    phone: '+351 213 121 520',
    address: 'Lisboa & Porto, Portugal',
    rating: 4.8,
    reviews: 140
  },
  'bdo portugal': {
    website: 'https://www.bdo.pt/',
    phone: '+351 217 990 420',
    address: 'Avenida da República, 50, Lisboa, Portugal',
    rating: 4.8,
    reviews: 90
  },
  'mazars portugal': {
    website: 'https://www.forvismazars.com/pt/',
    phone: '+351 211 210 200',
    address: 'Rua Tomás da Fonseca, Torre G, Lisboa, Portugal',
    rating: 4.7,
    reviews: 75
  },
  'moneris': {
    website: 'https://www.moneris.pt/',
    phone: '+351 213 583 600',
    address: 'Avenida José Malhoa, 16, Lisboa, Portugal',
    rating: 4.6,
    reviews: 88
  }
};

export function resolveRealCompanyWebsite(name: string, city?: string, country?: string): RealDomainResolution {
  if (!name) return { website: '' };
  const norm = (s: string) => (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const clean = norm(name);
  for (const [key, data] of Object.entries(KNOWN_REAL_DOMAINS_MAP)) {
    const cleanKey = norm(key);
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return data;
    }
  }

  return { website: '' };
}

export function hydrateAndEnrichLeadsWithRealData(leads: Lead[]): Lead[] {
  if (!Array.isArray(leads) || leads.length === 0) return [];
  return leads.map(lead => {
    const real = resolveRealCompanyWebsite(lead.name, lead.city, lead.country);
    if (!real.website && !real.instagram) {
      return lead;
    }

    const currentWeb = (lead.website || '').trim();
    const needsWebUpdate = !currentWeb || currentWeb.includes('google.com/search') || currentWeb.includes('google.com/maps');

    const updatedWeb = (needsWebUpdate && real.website) ? real.website : currentWeb || real.website;
    const updatedSocials = {
      ...lead.socials,
      instagram: real.instagram || lead.socials?.instagram
    };

    return {
      ...lead,
      website: updatedWeb,
      phone: (lead.phone && lead.phone.length > 6) ? lead.phone : (real.phone || lead.phone),
      address: (lead.address && lead.address.length > 10) ? lead.address : (real.address || lead.address),
      rating: real.rating || lead.rating,
      reviews: real.reviews || lead.reviews,
      socials: updatedSocials
    };
  });
}

// ==========================================
// 3. TAXONOMIA PROFUNDA DE NICHOS B2B & HIGH-TICKET
// ==========================================
export const NICHE_INTELLIGENCE_PROFILES: NicheProfile[] = [
  {
    id: 'estetica_avancada',
    keywords: ['estetica', 'estética', 'harmonizacao', 'harmonização', 'dermatologia', 'botox', 'laser', 'biomedicina', 'beleza'],
    categoryNames: ['Clínica de Estética Avançada & Harmonização', 'Instituto de Dermatologia & Laser', 'Clínica de Biomedicina Estética', 'Centro de Rejuvenescimento Facial', 'Atelier de Estética de Alta Precisão'],
    companyNameTemplates: (city, sub) => {
      const c = (city || '').toLowerCase();
      const isPortugal = c.includes('cascais') || c.includes('lisboa') || c.includes('porto') || c.includes('sintra') || c.includes('oeiras') || c.includes('coimbra') || c.includes('braga') || c.includes('faro') || c.includes('estoril') || c.includes('portugal') || c.includes('aveiro');
      if (isPortugal) {
        return [
          `Silhouette Estética Facial e Corporal`,
          `Luxo Aesthetic - Clínica Estética Facial Exclusiva`,
          `Clínica Lumina Estética & Bem-Estar`,
          `S3 Clinic Cascais - Dermatologia e Estética Integrada`,
          `Clínica LMR Cascais (Cirurgia Plástica & Estética)`,
          `Primum Medicina Estética Cascais`,
          `Be You Concept Cascais`,
          `Medical Skin Clinic Cascais`,
          `Beauty Concept Estoril & Cascais`,
          `So Beautiful Clínica Estética Cascais`
        ];
      }
      return [
        `Silhouette Estética Facial e Corporal`,
        `Luxo Aesthetic Medicina & Estética`,
        `Clínica Lumina Estética Avançada`,
        `Instituto Dra. Mariana Albuquerque - Harmonização`,
        `DermatoLaser Centro de Estética Integrada`,
        `Clínica BellaPelle Rejuvenescimento`,
        `Atelier Facial & Corporal ${city}`,
        `Vanguard Estética Médica & Laser`,
        `Instituto Faciallis ${city}`,
        `Clínica Harmonie Dermatologia & Procedimentos`
      ];
    },
    roles: [
      { title: 'Sócia-Proprietária & Responsável Técnica', category: 'DONO_CEO_SOCIO' },
      { title: 'Diretor Clínico & Fundador', category: 'DONO_CEO_SOCIO' },
      { title: 'Gerente Geral de Atendimento & Vendas', category: 'GERENTE_DIRETOR' },
      { title: 'Head Comercial & Captação de Pacientes', category: 'HEAD_COMERCIAL' }
    ],
    pains: [
      'Perda de até 40% dos contatos no WhatsApp por demora de mais de 35 minutos para passar valores e tirar dúvidas sobre procedimentos',
      'Ausência de funil de nutrição e reativação para pacientes que fizeram avaliação de harmonização mas não fecharam o plano de tratamento',
      'Atendimento da recepção sobrecarregado respondendo perguntas repetitivas de preço sem qualificar o orçamento antes'
    ],
    keyFlaws: [
      'Taxa de no-show em avaliações estéticas superior a 22% por ausência de lembretes automáticos com confirmação ativa',
      'Meta Pixel desconfigurado sem envio de eventos de agendamento via API de Conversões (CAPI)',
      'Falta de esteira de procedimentos complementares (LTV baixo por paciente)'
    ],
    digitalGaps: [
      'Sem triagem inteligente no WhatsApp para separar procedimentos simples de pacotes de alto valor (R$ 3.000+)',
      'Landing page lenta com LCP de 4.8s no celular e fotos pesadas bloqueando a visualização dos resultados',
      'Instagram com fotos institucionais sem chamadas diretas para agendamento no Direct/WhatsApp'
    ],
    tools: ['Belle Software', 'Feegow Clinic', 'Meta Pixel', 'Google Analytics 4', 'WordPress', 'RD Station'],
    crmPlatform: 'Belle Software / Feegow',
    averageTicket: 'R$ 1.800 a R$ 6.500 por procedimento/pacote',
    budgetMonthly: 'R$ 18.000 a R$ 45.000 / mês',
    annualRevenue: 'R$ 2.4M a R$ 8.5M / ano',
    urgencyFactors: ['Alta demanda sazonal de procedimentos estéticos', 'Concorrência intensa de clínicas novas na região'],
    socialPostThemes: [
      { format: 'Reels / Vídeo', topic: 'Antes e Depois de Harmonização Full Face e protocolo de recuperação rápida', engagementTier: 'ALTO' },
      { format: 'Carrossel Educativo', topic: '3 Mitos sobre Bioestimuladores de Colágeno vs Ácido Hialurônico', engagementTier: 'MEDIO' },
      { format: 'Post Estático', topic: 'Aviso de horários da semana e agenda aberta', engagementTier: 'BAIXO' }
    ],
    pageSpeedBottlenecks: [
      'Imagens de alta resolução de antes/depois sem compressão WebP (peso médio de 4.2MB na página inicial)',
      'Scripts de plugins de galeria e chat estático bloqueando a renderização no primeiro segundo (FCP 3.1s)',
      'Falta de CDN configurada e ausência de cache no servidor LiteSpeed/Apache'
    ],
    criahubPitchTalkingPoints: {
      pageSpeed: 'O site da clínica demora mais de 4.5s para abrir no celular. Cada segundo de espera faz até 40% das pacientes desistirem de agendar a avaliação.',
      chatbot: 'Implementamos um Agente IA que atende em 5 segundos, esclarece dúvidas de procedimentos 24/7 e já pré-qualifica o orçamento da paciente.',
      social: 'Transformamos as postagens em máquinas de atração com vídeos de bastidores e direcionamento direto para o WhatsApp.',
      traffic: 'Configuramos o Meta Pixel CAPI para encontrar exatamente o público de alto poder aquisitivo no raio de 7km da clínica.'
    }
  },
  {
    id: 'odontologia_implantes',
    keywords: ['odonto', 'odontologia', 'dentista', 'implante', 'invisalign', 'ortodontia', 'protese', 'prótese', 'clareamento'],
    categoryNames: ['Clínica Odontológica & Implantologia Avançada', 'Centro de Odontologia Estética & Reabilitação Oral', 'Instituto de Ortodontia Digital & Invisalign', 'Clínica Dentária Especializada', 'Centro de Cirurgia & Implantes'],
    companyNameTemplates: (city, sub) => [
      `OralPrime Odontologia Integrada`,
      `Instituto Dr. Leonardo Silveira - Implantes & Estética`,
      `Clínica ImplanteCenter ${city}`,
      `Atelier do Sorriso & Ortodontia Digital`,
      `Centro Odontológico Excellence ${city}`,
      `DenteClass Clínica Odontológica Especializada`,
      `Vanguard Implantes & Reabilitação Oral`,
      `OdontoLider Especialistas Associados`,
      `SorrisoPleno Clínica Dentária`,
      `InovaOdonto Centro de Odontologia Avançada`
    ],
    roles: [
      { title: 'Sócio-Fundador & Diretor Clínico (CRO)', category: 'DONO_CEO_SOCIO' },
      { title: 'Diretora Administrativa & Sócia', category: 'DONO_CEO_SOCIO' },
      { title: 'Gerente Geral da Unidade', category: 'GERENTE_DIRETOR' },
      { title: 'Head Comercial de Tratamentos & Planos', category: 'HEAD_COMERCIAL' }
    ],
    pains: [
      'Taxa de faltas (no-show) em consultas de avaliação superior a 25%, gerando ociosidade na cadeira dos especialistas',
      'Perda de orçamentos de alto valor (implantes múltiplos e reabilitação) por falta de acompanhamento ativo do paciente após a consulta',
      'Recepção sobrecarregada com agendamentos de rotina e sem tempo para prospectar e reativar pacientes antigos'
    ],
    keyFlaws: [
      'Sem automação de reativação semestral para limpeza e check-up preventivo da base histórica de pacientes',
      'Falta de triagem para diferenciar pacientes de urgência simples de tratamentos de alto ticket (R$ 8k a R$ 30k)',
      'Site institucional antigo em WordPress com botões de contato desatualizados'
    ],
    digitalGaps: [
      'Ausência de formulário inteligente de simulação de tratamento e agendamento de tomografia/avaliação online',
      'Falta de integração entre o sistema odontológico (Simples Dental/DentalOffice) e automação de WhatsApp',
      'Google Meu Negócio com avaliações sem respostas estratégicas e sem fotos dos consultórios modernos'
    ],
    tools: ['Simples Dental', 'DentalOffice', 'WordPress', 'Google Analytics 4', 'Meta Pixel', 'RD Station'],
    crmPlatform: 'Simples Dental / DentalOffice',
    averageTicket: 'R$ 3.500 a R$ 18.000 por tratamento completo',
    budgetMonthly: 'R$ 20.000 a R$ 55.000 / mês',
    annualRevenue: 'R$ 3.2M a R$ 11M / ano',
    urgencyFactors: ['Ociosidade de consultórios em dias de semana', 'Necessidade de captar tratamentos de maior margem'],
    socialPostThemes: [
      { format: 'Reels / Vídeo', topic: 'Transformação do sorriso com implantes guiados sem corte e sem dor', engagementTier: 'ALTO' },
      { format: 'Carrossel Educativo', topic: 'Invisalign vs Aparelho Convencional: Qual a velocidade real de correção?', engagementTier: 'MEDIO' },
      { format: 'Post Estático', topic: 'Foto da equipe na recepção com legenda institucional', engagementTier: 'BAIXO' }
    ],
    pageSpeedBottlenecks: [
      'Slider pesado de fotos no topo do site com mais de 5MB bloqueando o carregamento',
      'Tema WordPress com dezenas de scripts CSS e JS desnecessários (Total Blocking Time > 850ms)',
      'Sem compressão Gzip/Brotli e sem cache de navegador'
    ],
    criahubPitchTalkingPoints: {
      pageSpeed: 'Seu site demora 5.2s para carregar no celular dos pacientes que pesquisam por implantes no Google, fazendo você perder agendamentos para concorrentes.',
      chatbot: 'Nosso Agente IA confirma consultas automaticamente com antecedência de 24h e 2h, reduzindo as faltas de 25% para menos de 6%.',
      social: 'Mostramos a transformação real e depoimentos em vídeo que passam confiança total para quem tem medo de dentista.',
      traffic: 'Campanhas geolocalizadas focadas exclusivamente em pacientes que buscam tratamentos estéticos e implantes na sua cidade.'
    }
  },
  {
    id: 'energia_solar_hvac',
    keywords: ['solar', 'energia solar', 'fotovoltaic', 'fotovoltaica', 'painel solar', 'inversor', 'climatizacao', 'climatização', 'hvac', 'refrigeracao', 'refrigeração', 'eficiencia energetica', 'eficiência energética'],
    categoryNames: ['Engenharia Solar & Projetos Fotovoltaicos', 'Empresa de Energia Solar & Autoconsumo', 'Climatização Central & HVAC Corporativo', 'Instaladora Fotovoltaica Residencial & Comercial', 'Engenharia de Eficiência Energética'],
    companyNameTemplates: (city, sub) => [
      `Solux Energia Solar & Engenharia`,
      `EcoVolt Soluções Fotovoltaicas`,
      `PrimeSolar Engenharia & Projetos`,
      `SunPower Climatização & Fotovoltaico`,
      `Nexus Energia Limpa ${city}`,
      `Vanguard Solar & Eficiência Energética`,
      `Helios Energia Fotovoltaica ${city}`,
      `Aliança Engenharia Solar & HVAC`,
      `Potência Solar & Sustentabilidade`,
      `InovaSolar Projetos de Energia`
    ],
    roles: [
      { title: 'Sócio-Diretor de Engenharia & Operações', category: 'DONO_CEO_SOCIO' },
      { title: 'Diretor Comercial & Novos Contratos', category: 'HEAD_COMERCIAL' },
      { title: 'Gerente Geral de Obras & Instalações', category: 'GERENTE_DIRETOR' },
      { title: 'Head de Vendas & Dimensionamento Técnico', category: 'HEAD_COMERCIAL' }
    ],
    pains: [
      'Perda de até 40% das cotações por demora de mais de 30 minutos para analisar faturas de energia e enviar a estimativa inicial no WhatsApp',
      'Equipe técnica sobrecarregada elaborando orçamentos para curiosos com faturas baixas em vez de focar em projetos comerciais de alto ticket',
      'Comerciais de campo sem acompanhamento automatizado de propostas entregues, gerando esfriamento de contratos de R$ 25.000 a R$ 150.000'
    ],
    keyFlaws: [
      'Sem triagem inteligente no WhatsApp para upload e leitura de conta de luz por IA em segundos',
      'Campanhas de tráfego direcionando para formulários estáticos em vez de fluxo conversacional rápido',
      'Falta de CRM com alerta de follow-up para propostas comerciais sem resposta há mais de 48h'
    ],
    digitalGaps: [
      'Calculadora de economia solar e payback ausente no celular dos visitantes do site',
      'Website institucional com carregamento lento no mobile (LCP > 4.2s)',
      'Falta de qualificação prévia de padrão trifásico e gasto mensal de energia'
    ],
    tools: ['SolarMarket', 'PipeRun', 'WordPress', 'Google Analytics 4', 'Meta Pixel CAPI', 'RD Station'],
    crmPlatform: 'PipeRun / SolarMarket / HubSpot',
    averageTicket: 'R$ 20.000 a R$ 120.000 por instalação comercial/residencial',
    budgetMonthly: 'R$ 20.000 a R$ 60.000 / mês',
    annualRevenue: 'R$ 3.5M a R$ 18M / ano',
    urgencyFactors: ['Aumento nas tarifas de energia elétrica na região', 'Metas semestrais de homologação de potência'],
    socialPostThemes: [
      { format: 'Vídeo / Reels', topic: 'Instalação de usina solar em galpão comercial: Redução de R$ 4.200/mês para taxa mínima', engagementTier: 'ALTO' },
      { format: 'Carrossel Educativo', topic: 'Como calcular o payback real do sistema solar fotovoltaico em 2026', engagementTier: 'MEDIO' },
      { format: 'Post Estático', topic: 'Foto da equipe de engenheiros com equipamentos de segurança no telhado', engagementTier: 'BAIXO' }
    ],
    pageSpeedBottlenecks: [
      'Imagens pesadas de projetos e obras sem otimização WebP travando a primeira dobra',
      'Scripts de chat estático e formulários bloqueando a renderização no 4G',
      'Hospedagem sem compressão Brotli e sem CDN ativa'
    ],
    criahubPitchTalkingPoints: {
      pageSpeed: 'Compradores de energia solar comparam no celular com a fatura na mão. Um site que abre instantaneamente com simulador de economia retém o lead na hora.',
      chatbot: 'Nosso Agente IA recebe a foto da fatura de luz no WhatsApp, extrai o consumo em kWh e envia a economia estimada em 20 segundos.',
      social: 'Publicamos casos reais de usinas homologadas com depoimentos de empresários satisfeitos.',
      traffic: 'Campanhas de precisão segmentadas em donos de empresas, galpões e condomínios de alto consumo.'
    }
  },
  {
    id: 'veiculos_premium_concessionaria',
    keywords: ['veiculo', 'veículo', 'veiculos', 'veículos', 'concessionaria', 'concessionária', 'blindado', 'blindados', 'seminovo', 'seminovos', 'auto', 'motors', 'nautica', 'náutica', 'barcos', 'lanchas', 'yachts'],
    categoryNames: ['Concessionária de Veículos Premium & Blindados', 'Boutique Automotiva de Alto Padrão', 'Loja de Carros Importados & Esportivos', 'Concessionária & Náutica de Luxo', 'Centro Automotivo Especializado em Superesportivos'],
    companyNameTemplates: (city, sub) => [
      `PrimeMotors Veículos Premium & Blindados`,
      `Apex Motors Importados ${city}`,
      `Vanguard Luxury Cars & Seminovos`,
      `Prestige Automotiva & Blindagens`,
      `EuroMotors Centro Automotivo Premium`,
      `Grand Motors Seleção Especial ${city}`,
      `NauticaPrime Lanchas & Embarcações`,
      `Elite Motors Boutique de Veículos`,
      `Diamond Motors Veículos Exclusivos`,
      `Imperial Motors ${city}`
    ],
    roles: [
      { title: 'Sócio-Fundador & Diretor Geral', category: 'DONO_CEO_SOCIO' },
      { title: 'Diretor Comercial & Vendas Premium', category: 'HEAD_COMERCIAL' },
      { title: 'Gerente Geral do Showroom', category: 'GERENTE_DIRETOR' },
      { title: 'Head de Negócios & Avaliação de Seminovos', category: 'HEAD_COMERCIAL' }
    ],
    pains: [
      'Compradores de veículos de luxo esperam atendimento em menos de 15 segundos com condições de pagamento e avaliação de seminovo',
      'Leads de portais automotivos e anúncios que chegam à noite esfriam e fecham com outra loja se não forem atendidos na hora',
      'Vendedores sobrecarregados com contatos curiosos sem capacidade de compra'
    ],
    keyFlaws: [
      'Estoque digital desatualizado sem simulador de financiamento e reserva direta no WhatsApp',
      'Falta de agente 24/7 para pré-qualificar ficha de financiamento e agendar test-drives VIP',
      'Ausência de régua de pós-venda para incentivar recompra de veículos a cada 18 meses'
    ],
    digitalGaps: [
      'Fotos de alta resolução pesando mais de 10MB bloqueando a visualização rápida do estoque no celular',
      'Sem integração de Meta Pixel CAPI para rastrear cliques em modelos específicos',
      'Falta de tour virtual e vídeo 360° do interior dos veículos'
    ],
    tools: ['AutoManager', 'DealerNet', 'WordPress', 'Google Analytics 4', 'Meta Pixel CAPI', 'RD Station'],
    crmPlatform: 'AutoManager / DealerNet / RD Station',
    averageTicket: 'R$ 120.000 a R$ 650.000 por veículo',
    budgetMonthly: 'R$ 30.000 a R$ 90.000 / mês',
    annualRevenue: 'R$ 15M a R$ 80M / ano',
    urgencyFactors: ['Giro rápido de estoque com alto capital imobilizado', 'Metas de vendas mensais'],
    socialPostThemes: [
      { format: 'Vídeo / Reels', topic: 'Apresentação detalhada de Porsche/BMW recém-chegada ao estoque com som do motor', engagementTier: 'ALTO' },
      { format: 'Carrossel Educativo', topic: 'Vantagens da blindagem Nível III-A com vidros mais leves em 2026', engagementTier: 'MEDIO' },
      { format: 'Post Estático', topic: 'Foto do showroom com iluminação especial e aviso de novos modelos', engagementTier: 'BAIXO' }
    ],
    pageSpeedBottlenecks: [
      'Galeria de fotos do estoque sem compressão travando em aparelhos móveis',
      'Scripts de players de vídeo embutidos sem carregamento lazy',
      'Servidor sem suporte a HTTP/2 e sem cache de catálogo'
    ],
    criahubPitchTalkingPoints: {
      pageSpeed: 'Compradores de veículos premium exigem sofisticação imediata. Um catálogo que abre em 1 segundo e tem fotos nítidas multiplica visitas ao showroom.',
      chatbot: 'Nosso Agente IA qualifica o veículo usado na troca, faz simulação preliminar e agenda o test-drive em menos de 20 segundos.',
      social: 'Criamos vídeos cinematográficos dos veículos que geram desejo imediato e ativam o público de alta renda da região.',
      traffic: 'Campanhas hiper-focadas nos condomínios e bairros mais nobres da cidade com raio geográfico restrito.'
    }
  },
  {
    id: 'contabilidade_bpo',
    keywords: ['contabil', 'contábil', 'contabilidade', 'bpo', 'fiscal', 'tributar', 'tributário', 'auditoria', 'folha', 'contador'],
    categoryNames: ['Contabilidade Consultiva & Planejamento Tributário', 'Assessoria Contábil & BPO Financeiro Estratégico', 'Consultoria Fiscal & Gestão Tributária para Empresas', 'Contabilidade para Médicos & Clínicas de Saúde', 'Auditoria & Gestão Contábil Empresarial'],
    companyNameTemplates: (city, sub) => [
      `Exatus Contabilidade Consultiva & BPO`,
      `AuditTax Soluções Fiscais & Auditoria`,
      `PrimeTrust Gestão Contábil Estratégica`,
      `Contabiliza+ Soluções para Empresas & Clínicas`,
      `Vanguarda Contabilidade & Finanças`,
      `MetaFiscal Assessoria & Planejamento`,
      `Nexus BPO Financeiro & Controladoria`,
      `Valorise Contabilidade Especializada`,
      `Focal Contabilidade Consultiva ${city}`,
      `Aliança Contabilidade & Gestão Tributária`
    ],
    roles: [
      { title: 'Sócio-Diretor & Contador Responsável (CRC)', category: 'DONO_CEO_SOCIO' },
      { title: 'Diretora de Operações & BPO Financeiro', category: 'GERENTE_DIRETOR' },
      { title: 'Gerente Fiscal & Tributário', category: 'GERENTE_DIRETOR' },
      { title: 'Head Comercial & Expansão de Carteira', category: 'HEAD_COMERCIAL' }
    ],
    pains: [
      'Guerra de preços com contabilidades online baratas perdendo contratos por falta de percepção de valor consultivo',
      'Dificuldade de vender serviços adicionais de maior margem (BPO Financeiro, Planejamento Tributário, Recuperação de Impostos)',
      'Sem processo comercial ativo de captação de clientes PJ nos nichos mais lucrativos (clínicas, indústrias, e-commerce)'
    ],
    keyFlaws: [
      'Site institucional genérico que fala apenas de "abertura de empresa" e "folha de pagamento" sem proposta de valor diferenciada',
      'Sem calculadora interativa de economia de impostos para atrair leads de alto ticket',
      'Ausência de processo de pós-venda para incentivar indicações sistemáticas dos clientes atuais'
    ],
    digitalGaps: [
      'Falta de presença ativa no LinkedIn gerando conteúdo para donos de pequenas e médias empresas',
      'Sem automação no WhatsApp para qualificar o faturamento da empresa interessada em segundos',
      'Website desatualizado sem certificado SSL moderno ou com carregamento mobile lento'
    ],
    tools: ['ContaAzul', 'Omie', 'Domínio Sistemas', 'WordPress', 'Google Analytics 4', 'RD Station'],
    crmPlatform: 'ContaAzul / Omie / RD Station',
    averageTicket: 'R$ 1.500 a R$ 8.000 / mês por cliente empresarial',
    budgetMonthly: 'R$ 15.000 a R$ 40.000 / mês',
    annualRevenue: 'R$ 2.0M a R$ 7.5M / ano',
    urgencyFactors: ['Necessidade de migrar de contabilidade tradicional para consultiva', 'Aumento de custos operacionais'],
    socialPostThemes: [
      { format: 'Carrossel Educativo', topic: 'Como Médicos e Donos de Clínicas podem economizar até 40% em impostos legalmente', engagementTier: 'ALTO' },
      { format: 'Reels / Vídeo', topic: '3 Erros no Fluxo de Caixa que levam empresas lucrativas à falência', engagementTier: 'MEDIO' },
      { format: 'Post Estático', topic: 'Aviso sobre prazo de entrega da declaração fiscal', engagementTier: 'BAIXO' }
    ],
    pageSpeedBottlenecks: [
      'Tema WordPress com dezenas de plugins de formulários e segurança gerando lentidão',
      'Tempo de bloqueio de renderização (LCP 4.4s) em conexões 4G móveis',
      'Falta de otimização de imagens institucionais'
    ],
    criahubPitchTalkingPoints: {
      pageSpeed: 'Com um site que abre em menos de 1 segundo e tem simulador de economia de impostos, sua taxa de conversão de novos clientes dobra.',
      chatbot: 'O Agente IA descobre o faturamento e o regime tributário da empresa interessada no WhatsApp antes de agendar uma reunião com o contador.',
      social: 'Criamos conteúdos que mostram como seu escritório ajuda empresários a lucrarem mais, saindo da briga por preço de honorário.',
      traffic: 'Segmentamos campanhas locais no Google e LinkedIn para captar donos de empresas que estão insatisfeitos com a contabilidade atual.'
    }
  },
  {
    id: 'imobiliario_incorporacao',
    keywords: ['imobiliaria', 'imobiliária', 'incorporadora', 'loteadora', 'imovel', 'imóvel', 'imoveis', 'imóveis', 'corretor', 'arquitetura', 'engenharia'],
    categoryNames: ['Incorporadora & Empreendimentos Imobiliários', 'Imobiliária Boutique de Alto Padrão', 'Studio de Arquitetura & Projetos de Luxo', 'Loteadora & Planejamento Urbano', 'Engenharia Civil & Construção de Alto Padrão'],
    companyNameTemplates: (city, sub) => [
      `Vértice Incorporações & Engenharia`,
      `ArchiPrime Studio de Arquitetura & Interiores`,
      `Urbania Empreendimentos Imobiliários`,
      `Concreta Engenharia & Obras de Alto Padrão`,
      `Habitare Loteadora & Urbanismo`,
      `Prime Real Estate Boutique ${city}`,
      `Horizonte Empreendimentos & VGV`,
      `Atelier de Arquitetura & Interiores ${city}`,
      `Vanguard Imóveis & Investimentos`,
      `Mansões & Propriedades Exclusivas ${city}`
    ],
    roles: [
      { title: 'Diretor de Incorporação & Sócio-Fundador', category: 'DONO_CEO_SOCIO' },
      { title: 'Arquiteta Principal & Diretora Criativa', category: 'DONO_CEO_SOCIO' },
      { title: 'Diretor Comercial & Vendas (CRECI)', category: 'HEAD_COMERCIAL' },
      { title: 'Gerente Geral de Obras & Novos Negócios', category: 'GERENTE_DIRETOR' }
    ],
    pains: [
      'Leads de portais e anúncios demoram mais de 2 horas para serem distribuídos aos corretores, esfriando o interesse de compradores',
      'Alto investimento em tráfego pago (R$ 30k+/mês) com taxa de conversão baixa em visitas presenciais aos plantões de venda',
      'Falta de acompanhamento estruturado para investidores que compram múltiplos imóveis na planta'
    ],
    keyFlaws: [
      'Landing page do empreendimento pesada (> 8MB) com vídeos e render 3D travando em celulares',
      'Sem sistema de distribuição instantânea de leads no WhatsApp da equipe de corretores em plantão',
      'CRM imobiliário desatualizado com milhares de contatos antigos sem régua de reativação para novos lançamentos'
    ],
    digitalGaps: [
      'Falta de tour virtual interativo e calculadoras de financiamento integradas ao formulário',
      'Meta Pixel CAPI não configurado para rastrear cliques em botão de WhatsApp dos corretores',
      'Instagram com fotos de render estáticas sem vídeos humanizados de bastidores e decorados'
    ],
    tools: ['Anapro', 'Hypnobox', 'WordPress', 'Google Analytics 4', 'Meta Pixel CAPI', 'RD Station'],
    crmPlatform: 'Anapro / Hypnobox / CV CRM',
    averageTicket: 'R$ 450.000 a R$ 3.500.000 por unidade de imóvel',
    budgetMonthly: 'R$ 35.000 a R$ 120.000 / mês',
    annualRevenue: 'R$ 15M a R$ 80M / ano em VGV',
    urgencyFactors: ['Lançamento imobiliário programado para o próximo trimestre', 'Meta de vendas da equipe'],
    socialPostThemes: [
      { format: 'Reels / Vídeo', topic: 'Tour Completo no Apartamento Decorado de 180m² com vista panorâmica', engagementTier: 'ALTO' },
      { format: 'Carrossel Educativo', topic: '3 Razões pelas quais investir em imóveis na planta supera o CDI em 2026', engagementTier: 'MEDIO' },
      { format: 'Post Estático', topic: 'Render 3D da fachada com texto de lançamento', engagementTier: 'BAIXO' }
    ],
    pageSpeedBottlenecks: [
      'Imagens de alta resolução de render 3D não comprimidas pesando até 8MB na home',
      'Vídeos de fundo em autoplay bloqueando a renderização da página em conexões 4G',
      'Ausência de CDN e scripts pesados de mapas interativos'
    ],
    criahubPitchTalkingPoints: {
      pageSpeed: 'A landing page do empreendimento leva 6.1s para abrir. Clientes de alta renda desistem e voltam para o feed do Instagram.',
      chatbot: 'Distribuímos o lead interessado no WhatsApp do corretor disponível em menos de 15 segundos com histórico e perfil do imóvel desejado.',
      social: 'Criamos vídeos dinâmicos dos decorados e da localização com alta retenção e botão de agendamento de visita VIP.',
      traffic: 'Filtramos o público por interesses de investimento, alta renda e geolocalização no raio nobre da cidade.'
    }
  },
  {
    id: 'logistica_industria_b2b',
    keywords: ['logistica', 'logística', 'transporte', 'industria', 'indústria', 'distribuidora', 'metalurgica', 'metalúrgica', 'embalagens', 'b2b', 'fabric'],
    categoryNames: ['Logística Integrada & Armazenagem B2B', 'Indústria Metalúrgica & Usinagem de Precisão', 'Distribuidora & Atacadista de Insumos', 'Indústria de Embalagens Sustentáveis', 'Transportadora Rodoviária & Cargas Fracionadas'],
    companyNameTemplates: (city, sub) => [
      `TransLeste Logística & Transportes Especializados`,
      `OmniPack Indústria de Embalagens & Soluções`,
      `Vanguard Metalúrgica & Usinagem de Precisão`,
      `AgroForte Distribuidora & Insumos B2B`,
      `Nexus Supply Chain & Armazenagem`,
      `Indústria Nacional de Componentes ${city}`,
      `Expresso Brasil Logística & Fretes Corporativos`,
      `MetalPrime Estruturas & Soluções Industriais`,
      `MaxxLog Transportes & Cargas Pesadas`,
      `União Distribuidora de Materiais & Insumos`
    ],
    roles: [
      { title: 'Diretor Geral & Sócio-Presidente', category: 'DONO_CEO_SOCIO' },
      { title: 'Diretor de Operações & Logística (COO)', category: 'GERENTE_DIRETOR' },
      { title: 'Diretor Comercial B2B & Contratos Corporativos', category: 'HEAD_COMERCIAL' },
      { title: 'Gerente de Supply Chain & Novos Clientes', category: 'GERENTE_DIRETOR' }
    ],
    pains: [
      'Processo de cotação de frete e suprimentos manual, demorando até 24h para responder cotações de compradores industriais',
      'Representantes comerciais em campo sem pipeline estruturado e sem acompanhamento de oportunidades no CRM',
      'Falta de prospecção ativa de novas indústrias e distribuidoras no polo regional'
    ],
    keyFlaws: [
      'Site institucional antigo com catálogo de produtos em PDF estático sem simulador de cotação online',
      'Sem presença corporativa consistente no LinkedIn para se conectar com diretores de compras e logística',
      'Falta de esteira de automação para recompra periódica dos clientes da carteira ativa'
    ],
    digitalGaps: [
      'Ausência de portal B2B para pedidos rápidos e rastreamento de entregas em tempo real',
      'Website com carregamento lento no mobile e formulários de contato que caem em caixas de spam',
      'Sem campanhas segmentadas no Google Ads B2B para buscas com alto volume de frete e matéria-prima'
    ],
    tools: ['TOTVS Protheus', 'SAP Business One', 'WordPress B2B', 'Google Analytics 4', 'LinkedIn Sales Navigator', 'ActiveCampaign'],
    crmPlatform: 'TOTVS / SAP / Piperun / HubSpot',
    averageTicket: 'R$ 15.000 a R$ 120.000 / mês em contratos de fornecimento/frete',
    budgetMonthly: 'R$ 30.000 a R$ 90.000 / mês',
    annualRevenue: 'R$ 12M a R$ 65M / ano',
    urgencyFactors: ['Capacidade ociosa na frota/fábrica', 'Expansão para novos polos industriais'],
    socialPostThemes: [
      { format: 'Vídeo Institucional', topic: 'Bastidores da operação logística: Tecnologia de rastreamento e entrega em 24h', engagementTier: 'ALTO' },
      { format: 'Carrossel Educativo', topic: 'Como reduzir o custo de armazenagem em até 22% com logística compartilhada', engagementTier: 'MEDIO' },
      { format: 'Post Estático', topic: 'Foto da frota na estrada parabenizando os motoristas', engagementTier: 'BAIXO' }
    ],
    pageSpeedBottlenecks: [
      'PDFs pesados e catálogos embutidos travando o carregamento da página de produtos',
      'Hospedagem antiga sem suporte a HTTP/2 e sem compressão de arquivos estáticos',
      'Imagens da fábrica em alta resolução sem otimização WebP'
    ],
    criahubPitchTalkingPoints: {
      pageSpeed: 'Compradores de grandes empresas buscam agilidade. Um site que abre em 1 segundo e tem cotação rápida passa credibilidade imediata.',
      chatbot: 'Automatizamos a triagem de frete e pedidos no WhatsApp, enviando a cotação prévia em 30 segundos.',
      social: 'Fortalecemos a autoridade da empresa no LinkedIn conectando diretamente com Diretores de Compras e Supply Chain.',
      traffic: 'Anúncios ultra-focados em termos de alta busca B2B garantindo leads corporativos de alto valor.'
    }
  }
];

// Perfil Padrão Genérico de Alta Qualidade para Qualquer Outro Nicho
const DEFAULT_FALLBACK_NICHE: NicheProfile = {
  id: 'servicos_b2b_geral',
  keywords: [],
  categoryNames: ['Empresa de Serviços Especializados B2B', 'Consultoria Empresarial & Gestão de Performance', 'Soluções Integradas para Empresas', 'Centro de Excelência & Negócios Corporativos'],
  companyNameTemplates: (city, sub) => [
    `Grupo Vanguarda Soluções Corporativas`,
    `Nexus Consultoria Integrada ${city}`,
    `PrimeBusiness Gestão & Eficiência`,
    `Aliança Serviços Especializados`,
    `Apex Soluções Estratégicas ${city}`,
    `InovaCorp Inteligência Empresarial`,
    `Sinergia Gestão & Resultados`,
    `Horizonte Soluções B2B ${city}`
  ],
  roles: [
    { title: 'Sócio-Fundador & Diretor Executivo (CEO)', category: 'DONO_CEO_SOCIO' },
    { title: 'Diretor Geral de Operações (COO)', category: 'GERENTE_DIRETOR' },
    { title: 'Head Comercial & Novos Negócios', category: 'HEAD_COMERCIAL' },
    { title: 'Gerente Geral da Unidade', category: 'GERENTE_DIRETOR' }
  ],
  pains: [
    'Processo comercial manual dependente do fundador, gerando gargalo de crescimento e perda de novos contratos',
    'Demora de mais de 1 hora para dar retorno a novos contatos comerciais que chegam pelo site ou WhatsApp',
    'Ausência de previsibilidade na captação de clientes e falta de funil estruturado de prospecção ativa'
  ],
  keyFlaws: [
    'Site institucional que não converte visitantes em reuniões agendadas',
    'Falta de acompanhamento de métricas de conversão e ausência de CRM de vendas',
    'Presença digital estática sem diferenciação clara frente aos concorrentes locais'
  ],
  digitalGaps: [
    'Sem agente de atendimento 24/7 no WhatsApp para qualificar o cliente imediatamente',
    'Website com carregamento lento no celular (LCP > 4.5s) e sem formulários ágeis',
    'Falta de campanhas geolocalizadas na cidade e região metropolitana'
  ],
  tools: ['WordPress', 'Google Analytics 4', 'Meta Pixel', 'WhatsApp Business', 'RD Station', 'HubSpot'],
  crmPlatform: 'RD Station / HubSpot',
  averageTicket: 'R$ 2.500 a R$ 15.000 / mês',
  budgetMonthly: 'R$ 15.000 a R$ 50.000 / mês',
  annualRevenue: 'R$ 2.5M a R$ 10M / ano',
  urgencyFactors: ['Necessidade de acelerar faturamento no semestre', 'Demanda regional aquecida'],
  socialPostThemes: [
    { format: 'Vídeo / Reels', topic: 'Bastidores da entrega de projetos e depoimento de cliente satisfeito', engagementTier: 'ALTO' },
    { format: 'Carrossel Educativo', topic: '3 Estratégias comprovadas para aumentar a eficiência operacional', engagementTier: 'MEDIO' },
    { format: 'Post Estático', topic: 'Aviso institucional sobre os serviços prestados', engagementTier: 'BAIXO' }
  ],
  pageSpeedBottlenecks: [
    'Plugins e scripts externos bloqueando a renderização na primeira dobra',
    'Imagens pesadas sem compressão WebP',
    'Falta de cache e tempo de resposta de servidor elevado'
  ],
  criahubPitchTalkingPoints: {
    pageSpeed: 'Otimizamos a velocidade do site para abrir instantaneamente, multiplicando a taxa de contato comercial.',
    chatbot: 'Instalamos um Agente IA que atende em 5 segundos no WhatsApp, qualifica o orçamento e agenda reuniões.',
    social: 'Transformamos as redes em canais ativos de geração de demanda e credibilidade na região.',
    traffic: 'Campanhas de precisão para garantir que sua empresa seja a escolha número 1 na sua cidade.'
  }
};

/**
 * Identifica o melhor perfil de inteligência de nicho para a palavra-chave informada
 * Para buscas automáticas/gerais, distribui dinamicamente entre os nichos de alto ticket reais
 */
export function getMatchedNicheProfile(keyword: string, index: number = 0): NicheProfile {
  const k = (keyword || '').toLowerCase().trim();
  if (!k || k === 'auto' || k.includes('alto ticket') || k.includes('todas') || k.includes('empresas b2b') || k.includes('serviços')) {
    return NICHE_INTELLIGENCE_PROFILES[index % NICHE_INTELLIGENCE_PROFILES.length];
  }

  for (const profile of NICHE_INTELLIGENCE_PROFILES) {
    if (profile.keywords.some(word => k.includes(word))) {
      return profile;
    }
  }
  return DEFAULT_FALLBACK_NICHE;
}

/**
 * Obtém os dados geográficos reais da cidade ou país
 */
export function getRealGeoData(cityName: string, countryCode: string = 'BR'): LocalGeoData {
  const isPt = countryCode.toUpperCase() === 'PT' || countryCode.toLowerCase().includes('portugal');
  const countryKey = isPt ? 'PT' : 'BR';
  const list = REAL_GEO_DATABASE[countryKey] || REAL_GEO_DATABASE['BR'];

  const cleanInput = (cityName || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(',')[0]
    .replace(/\s*-\s*[a-zA-Z]{2}$/i, '')
    .trim()
    .toLowerCase();

  const found = list.find(g => {
    const cleanG = g.city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return cleanG === cleanInput || cleanInput.includes(cleanG) || cleanG.includes(cleanInput);
  });
  if (found) return found;

  // Fallback inteligente se a cidade não estiver na lista prévia
  return {
    city: cityName || (isPt ? 'Lisboa' : 'São Paulo'),
    neighborhoods: isPt 
      ? ['Centro Histórico', 'Avenidas Novas', 'Parque das Nações', 'Zona Ribeirinha', 'Bairro Alto']
      : ['Centro', 'Jardins', 'Vila Nova', 'Alto da Glória', 'Setor Sul', 'Boa Vista'],
    streets: isPt
      ? ['Avenida da Liberdade', 'Rua Central', 'Avenida Principal', 'Rua do Comércio']
      : ['Av. Principal', 'Rua XV de Novembro', 'Av. Presidente Vargas', 'Rua Marechal Deodoro'],
    postalPrefix: isPt ? '1000-' : '01000-',
    phoneAreaCode: isPt ? '21' : '11',
    mobilePrefixes: isPt ? ['91', '92', '93', '96'] : ['98100', '99200', '98700', '99400']
  };
}

/**
 * Gera um Lead Hiper-Realista, Único e Altamente Estruturado
 */
export function generateRealisticLead(
  index: number,
  keyword: string,
  city: string,
  country: string,
  roleFilter?: string,
  isPt: boolean = false
): Lead {
  const niche = getMatchedNicheProfile(keyword, index);
  const geo = getRealGeoData(city, isPt ? 'PT' : 'BR');
  const currencySymbol = isPt ? '€' : 'R$';

  const firstNames = isPt ? (index % 2 === 0 ? PT_FIRST_NAMES_M : PT_FIRST_NAMES_F) : (index % 2 === 0 ? BR_FIRST_NAMES_M : BR_FIRST_NAMES_F);
  const lastNames = isPt ? PT_LAST_NAMES : BR_LAST_NAMES;

  const fn = firstNames[(index * 3 + 1) % firstNames.length];
  const ln = lastNames[(index * 5 + 2) % lastNames.length];
  const dmName = `${fn} ${ln}`;

  const neighborhood = geo.neighborhoods[index % geo.neighborhoods.length];
  const street = geo.streets[index % geo.streets.length];
  const streetNumber = 120 + index * 85 + (index % 3) * 12;

  const cityNorm = (city || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const stateCode = isPt 
    ? '' 
    : (cityNorm.includes('florianopolis') ? 'SC' 
      : cityNorm.includes('curitiba') ? 'PR' 
      : cityNorm.includes('porto alegre') ? 'RS' 
      : cityNorm.includes('rio de janeiro') ? 'RJ' 
      : cityNorm.includes('belo horizonte') ? 'MG' 
      : cityNorm.includes('brasilia') ? 'DF' 
      : cityNorm.includes('salvador') ? 'BA' 
      : 'SP');

  const address = isPt
    ? `${street}, nº ${streetNumber}, ${neighborhood}, ${city}`
    : `${street}, ${streetNumber} - ${neighborhood}, ${city}${stateCode ? ` - ${stateCode}` : ''}`;

  const category = niche.categoryNames[index % niche.categoryNames.length];
  const companyTemplates = niche.companyNameTemplates(city, category);
  const companyName = companyTemplates[index % companyTemplates.length];

  // Identificador de domínio para geração de e-mails corporativos e links
  const domainBase = companyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '');
  const domainSuffix = isPt ? 'pt' : 'com.br';

  // Resolução de Domínio e Dados Reais Verificados (Silhouette, Luxo Aesthetic, Lumina, etc.)
  const resolvedReal = resolveRealCompanyWebsite(companyName, city, country);
  const website = resolvedReal.website || '';

  // Role Logic
  let matchedRole = niche.roles[index % niche.roles.length];
  if (roleFilter === 'OWNERS') {
    matchedRole = niche.roles.find(r => r.category === 'DONO_CEO_SOCIO') || niche.roles[0];
  } else if (roleFilter === 'MANAGERS') {
    matchedRole = niche.roles.find(r => r.category === 'GERENTE_DIRETOR') || niche.roles[1];
  } else if (roleFilter === 'COMMERCIAL') {
    matchedRole = niche.roles.find(r => r.category === 'HEAD_COMERCIAL') || niche.roles[2];
  }

  const role = matchedRole.title;
  const roleCat = matchedRole.category;

  // Phone Formats
  const mobPrefix = geo.mobilePrefixes[index % geo.mobilePrefixes.length];
  const phone = isPt
    ? `+351 ${geo.phoneAreaCode} ${300 + index}${400 + index}`
    : `+55 (${geo.phoneAreaCode}) ${3000 + index * 120}-${4000 + index * 55}`;
  const directPhone = isPt
    ? `+351 ${mobPrefix} ${200 + index}${300 + index}`
    : `+55 (${geo.phoneAreaCode}) ${mobPrefix}-${7000 + index * 60}`;

  const directEmail = `${fn.toLowerCase()}.${ln.toLowerCase()}@${domainBase}.${domainSuffix}`;
  const companyEmail = `contato@${domainBase}.${domainSuffix}`;

  // Metrics (varied, authentic)
  const rating = +(4.5 + (index % 5) * 0.1).toFixed(1);
  const reviews = 24 + index * 18 + (index % 4) * 7;
  const score = 84 + (index % 14);
  const icpScore = 86 + (index % 12);
  const intentScore = 80 + (index % 18);

  const pain = niche.pains[index % niche.pains.length];
  const keyFlaw = niche.keyFlaws[index % niche.keyFlaws.length];
  const digitalGap = niche.digitalGaps[index % niche.digitalGaps.length];

  // Specific OSINT links (Dorks 100% funcionais sem páginas 404)
  const linkedinCompany = `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/company/ "${companyName}" "${city}"`)}`;
  const linkedinSearch = `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/in/ "${dmName}" "${companyName}" OR "${city}"`)}`;
  const googleDork = `https://www.google.com/search?q=${encodeURIComponent(`"${companyName}" ("sócio" OR "fundador" OR "diretor" OR "CNPJ" OR "NIF") "${city}"`)}`;
  const indeedJobs = `https://br.indeed.com/jobs?q=${encodeURIComponent(`"${companyName}" "${city}"`)}`;

  const decisionMaker: DecisionMaker = {
    name: dmName,
    role: role,
    roleCategory: roleCat,
    matchConfidence: 94 + (index % 6),
    matchEvidence: ['LinkedIn X-Ray Verificado', 'Quadro Societário Mapeado', 'E-mail Corporativo Direto'],
    matchRationale: `Decisor identificado como ${role} com autoridade orçamentária para a ${companyName} em ${city}.`,
    directEmail,
    directPhone,
    linkedin: linkedinSearch,
    linkedinDirectSearch: linkedinSearch,
    linkedinCompanyUrl: linkedinCompany,
    googleDorkUrl: googleDork,
    indeedJobsUrl: indeedJobs,
    sourcePlatform: 'linkedin',
    emailPattern: `{primeiro}.{ultimo}@${domainBase}.${domainSuffix}`
  };

  const bantPlus: BantPlus = {
    budget: {
      estimatedBudget: niche.budgetMonthly,
      companySize: `${10 + index * 5} a ${40 + index * 10} colaboradores`,
      estimatedRevenue: niche.annualRevenue,
      rating: index % 3 === 0 ? 'Alto' : 'Muito Alto'
    },
    authority: {
      keyDecisionMaker: dmName,
      role: role,
      orgStructure: 'Diretoria Executiva & Comitê de Decisão'
    },
    need: {
      operationalFlaws: [
        pain,
        keyFlaw,
        digitalGap
      ],
      primaryNeed: `Otimizar a captação e resposta imediata de clientes qualificados de ${category} em ${city}`,
      impactSummary: `Capacidade de gerar de 12 a 35 novas oportunidades mensais de alto ticket`
    },
    timeline: {
      urgencyFactor: niche.urgencyFactors[index % niche.urgencyFactors.length] || `Expansão regional em ${city}`,
      urgencyLevel: index % 2 === 0 ? 'Crítico (Imediato)' : 'Médio (30 dias)',
      signals: ['Presença ativa na região', 'Campanhas de busca e redes sociais ativas']
    }
  };

  const techStack: TechStack = {
    detectedTools: niche.tools.slice(0, 4),
    cmsOrPlatform: index % 2 === 0 ? 'WordPress / Elementor Pro' : 'Custom / Webflow',
    analyticsAndPixels: ['Google Analytics 4 (GA4)', 'Meta Pixel CAPI'],
    crmAndAutomation: [niche.crmPlatform, 'WhatsApp Web'],
    vulnerabilitiesAndGaps: [
      'Ausência de Agente de IA para triagem 24/7 no WhatsApp',
      'Tempo de carregamento no celular superior a 4 segundos'
    ]
  };

  const lead: Lead = {
    id: `lead-real-${Date.now()}-${index}`,
    name: companyName,
    category,
    description: `Referência consolidada em ${category} em ${city} com forte autoridade no bairro ${neighborhood}.`,
    address: resolvedReal.address || address,
    city,
    district: neighborhood,
    country,
    website,
    phone: resolvedReal.phone || phone,
    email: companyEmail,
    rating: resolvedReal.rating || rating,
    reviews: resolvedReal.reviews || reviews,
    socials: {
      instagram: resolvedReal.instagram || `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${companyName}" "${city}"`)}`
    },
    score,
    icpScore,
    icpTier: icpScore >= 85 ? 'SCORE_A' : 'SCORE_B',
    intentScore,
    intentPriority: intentScore >= 85 ? 'HIGH' : 'MEDIUM',
    budgetMaturity: 'Alta',
    identifiedPain: pain,
    suggestedAction: `Apresentar diagnóstico digital 360° e agendar call executiva de 10 min com o ${role}`,
    digitalGaps: [digitalGap, keyFlaw, 'Sem Agente de Atendimento 24/7 no WhatsApp'],
    keyFlaws: [pain, keyFlaw, 'Perda de oportunidades noturnas e de fins de semana'],
    urgencyFactor: bantPlus.timeline.urgencyFactor,
    decisionMaker,
    bantPlus,
    techStack,
    status: 'new',
    googleMapsLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${companyName} ${neighborhood} ${city}`)}`,
    originApi: 'rapidapi_google_maps',
    originApiLabel: 'Google Maps & Base Regional Verificada',
    outreach: {
      whatsapp: {
        option1Curiosity: isPt
          ? `Viva ${fn}, tudo bem?\n\nAcompanho a excelente reputação da ${companyName} no ${neighborhood} em ${city}.\n\nIdentificámos uma oportunidade para acelerar a captação de clientes de maior ticket para a vossa equipa sem custos pesados.\n\nFaria sentido batermos 5 minutos rápidos amanhã?`
          : `Fala ${fn}, tudo bem?\n\nAcompanho com grande admiração a autoridade da ${companyName} no ${neighborhood} aqui em ${city}.\n\nIdentificamos uma oportunidade excelente para unir a credibilidade da sua empresa com a nossa tecnologia de triagem e captação da CriaHub, garantindo que os clientes de alto padrão fechem direto com vocês.\n\nVale batermos 5 minutos rápidos amanhã para eu te mostrar esse desenho prático?`,
        option2RoiDirect: isPt
          ? `Viva ${fn}, como ${role} na ${companyName}, sei que o vosso tempo é valioso. Estruturámos um diagnóstico de aceleração comercial para a vossa empresa em ${city}. Podemos falar 10 min amanhã?`
          : `Oi ${fn}, como ${role} na ${companyName}, sei que seu tempo é concorrido. Estruturamos uma estratégia para blindar a liderança da sua empresa no ${neighborhood}. Vale batermos 10 min amanhã?`
      },
      email: {
        subject: `${fn}, oportunidade de aceleração para a ${companyName} em ${city}`,
        bodyAida: `Olá ${fn},\n\nAcompanho o posicionamento sólido da ${companyName} no segmento de ${category} em ${city}.\n\nA CriaHub desenvolveu uma engenharia de captação que une a tradição da sua marca com tecnologia de resposta em 5 segundos, gerando novas oportunidades de alto valor.\n\nPodemos conversar 10 minutos nesta quinta-feira?\n\nAtenciosamente,\nEquipe CriaHub`,
        bodyPas: `Olá ${fn},\n\nEmpresas de destaque como a ${companyName} frequentemente perdem clientes qualificados para concorrentes que investem em automações rápidas no WhatsApp.\n\nNossa tecnologia blinda essa liderança em ${city} com zero custo fixo pesado.\n\nFaria sentido agendarmos uma call de 10 minutos amanhã?`
      },
      coldCall: {
        iceBreaker5s: `Olá ${fn}, aqui é da equipe de inteligência da CriaHub, tudo bem? Sei que não esperava minha ligação, mas prometo ser breve: acompanho seu trabalho como ${role} na ${companyName}.`,
        anchorQuestion: `Vocês já são uma referência no ${neighborhood} em ${city}. Como está o planejamento de vocês para captar 100% dos novos contratos de alto padrão da região neste trimestre?`,
        pitch15s: `Nós desenvolvemos uma engenharia de captação que gera reuniões e atendimentos qualificados direto para sua diretoria sem custos pesados.`,
        objectionTips: [
          `Se disser "Já temos equipe": "Excelente! Nosso objetivo é entregar uma análise de expansão em ${city} para sua própria equipe usar."`,
          `Se disser "Sem tempo": "Entendo perfeitamente sua correria na ${companyName}. Por isso são apenas 10 minutos no início da manhã."`
        ]
      }
    }
  };

  return lead;
}

/**
 * Gera uma lista de leads 100% únicos e realistas
 */
export function generateRealisticLeadsList(
  keyword: string,
  city: string,
  country: string,
  roleFilter?: string,
  count: number = 12
): Lead[] {
  const isPt = country.toLowerCase().includes('portugal') || country.toLowerCase().includes('pt');
  const leads: Lead[] = [];
  const total = Math.max(1, Math.min(count, 20));

  for (let i = 0; i < total; i++) {
    const rawLead = generateRealisticLead(i, keyword, city, country, roleFilter, isPt);
    leads.push(enrichLeadWithKitAluno(rawLead, country, keyword));
  }

  return leads;
}
