import { Lead } from '../types';
import { RealEstatePropertyLead, RealEstatePortalSource } from './realEstateTypes';

const RAPIDAPI_KEY_STORAGE = 'criahub_idealista_rapidapi_key';
const IDEALISTA_RAPIDAPI_HOST = 'idealista-real-estate.p.rapidapi.com';
const IDEALISTA_RAPIDAPI_BASE = 'https://idealista-real-estate.p.rapidapi.com/v1';

export interface IdealistaSearchItem {
  propertyCode: string;
  price: number;
  priceDropValue?: number;
  size?: number;
  rooms?: number;
  bathrooms?: number;
  address?: string;
  district?: string;
  municipality?: string;
  province?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  propertyType?: string;
  operation?: string;
  url?: string;
  thumbnail?: string;
  exterior?: boolean;
  status?: string;
  hasLift?: boolean;
  parkingSpace?: { hasParkingSpace: boolean; isParkingSpaceIncludedInPrice?: boolean };
  description?: string;
  contactName?: string;
  contactPhone?: string;
  isParticular?: boolean;
  [key: string]: any;
}

export interface IdealistaSearchResponse {
  total: number;
  totalPages: number;
  actualPage: number;
  itemsPerPage: number;
  elementList: IdealistaSearchItem[];
}

export interface IdealistaPropertyDetail {
  propertyCode: string;
  price: number;
  operation: string;
  propertyType: string;
  extendedPropertyType?: string;
  homeType?: string;
  state?: string;
  country?: string;
  size?: number;
  rooms?: number;
  bathrooms?: number;
  address?: {
    streetName?: string;
    streetNumber?: string;
    postalCode?: string;
    neighborhood?: string;
    district?: string;
    municipality?: string;
    province?: string;
    country?: string;
    visibility?: string;
  };
  priceInfo?: {
    amount: number;
    currencySuffix?: string;
    drop?: {
      amount: number;
      percentage: number;
    };
  };
  contactInfo?: {
    agencyName?: string;
    commercialName?: string;
    contactName?: string;
    phone1?: {
      phoneNumber: string;
      formattedPhone?: string;
      prefix?: string;
    };
    phone2?: {
      phoneNumber: string;
      formattedPhone?: string;
      prefix?: string;
    };
    isProfessional?: boolean;
    userType?: string; // 'particular' | 'professional'
  };
  description?: {
    text: string;
    language?: string;
  };
  multimedia?: {
    images?: Array<{
      url: string;
      tag?: string;
      localizedName?: string;
    }>;
    videos?: Array<{ url: string }>;
    virtualTours?: Array<{ url: string }>;
  };
  features?: {
    hasAirConditioning?: boolean;
    hasGarden?: boolean;
    hasSwimmingPool?: boolean;
    hasTerrace?: boolean;
    hasBalcony?: boolean;
    hasLift?: boolean;
    hasBoxRoom?: boolean;
    isExterior?: boolean;
    energyCertificate?: {
      rating?: string;
    };
  };
  stats?: {
    views?: number;
    favorites?: number;
    contacts?: number;
    shares?: number;
  };
  url?: string;
  [key: string]: any;
}

// Preset location mapping for Spain, Portugal & Italy
export const IDEALISTA_LOCATION_PRESETS: Record<string, { id: string; name: string; country: 'PT' | 'ES' | 'IT' }[]> = {
  PT: [
    { id: '0-EU-PT-11', name: 'Lisboa (Distrito)', country: 'PT' },
    { id: '0-EU-PT-11-06', name: 'Lisboa (Concelho / Centro)', country: 'PT' },
    { id: '0-EU-PT-13', name: 'Porto (Distrito)', country: 'PT' },
    { id: '0-EU-PT-13-12', name: 'Porto (Concelho / Baixa)', country: 'PT' },
    { id: '0-EU-PT-11-05', name: 'Cascais', country: 'PT' },
    { id: '0-EU-PT-11-14', name: 'Sintra', country: 'PT' },
    { id: '0-EU-PT-15', name: 'Setúbal', country: 'PT' },
    { id: '0-EU-PT-08', name: 'Faro (Algarve)', country: 'PT' },
    { id: '0-EU-PT-03', name: 'Braga', country: 'PT' },
    { id: '0-EU-PT-06', name: 'Coimbra', country: 'PT' },
  ],
  ES: [
    { id: '0-EU-ES-28', name: 'Madrid (Provincia)', country: 'ES' },
    { id: '0-EU-ES-28-079', name: 'Madrid (Capital)', country: 'ES' },
    { id: '0-EU-ES-08', name: 'Barcelona (Provincia)', country: 'ES' },
    { id: '0-EU-ES-08-019', name: 'Barcelona (Capital)', country: 'ES' },
    { id: '0-EU-ES-46', name: 'Valencia', country: 'ES' },
    { id: '0-EU-ES-41', name: 'Sevilla', country: 'ES' },
    { id: '0-EU-ES-29', name: 'Málaga (Costa del Sol)', country: 'ES' },
    { id: '0-EU-ES-03', name: 'Alicante', country: 'ES' },
    { id: '0-EU-ES-07', name: 'Baleares (Mallorca / Ibiza)', country: 'ES' },
  ],
  IT: [
    { id: '0-EU-IT-58', name: 'Roma', country: 'IT' },
    { id: '0-EU-IT-15', name: 'Milano', country: 'IT' },
    { id: '0-EU-IT-63', name: 'Napoli', country: 'IT' },
    { id: '0-EU-IT-48', name: 'Firenze', country: 'IT' },
    { id: '0-EU-IT-01', name: 'Torino', country: 'IT' },
  ]
};

export function getSavedIdealistaApiKey(): string {
  try {
    return localStorage.getItem(RAPIDAPI_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function saveIdealistaApiKey(key: string): void {
  try {
    localStorage.setItem(RAPIDAPI_KEY_STORAGE, key.trim());
  } catch (e) {
    console.error('Falha ao salvar RapidAPI Key', e);
  }
}

/**
 * Helper para extrair o ID do imóvel de links como "https://www.idealista.com/inmueble/112345678/"
 */
export function extractPropertyCodeFromUrl(url: string): string | null {
  const match = url.match(/(?:inmueble|imovel|immobile)\/(\d+)/i) || url.match(/\/(\d{7,10})\/?/);
  if (match) return match[1];
  if (/^\d{7,10}$/.test(url.trim())) return url.trim();
  return null;
}

/**
 * Busca listagem de imóveis à VENDA no Idealista via RapidAPI
 */
export async function searchIdealistaListings(params: {
  apiKey?: string;
  country: 'PT' | 'ES' | 'IT';
  locationId: string;
  priceFrom?: number;
  priceTo?: number;
  maxItems?: number;
  page?: number;
  order?: 'publicationDate' | 'price' | 'priceDown' | 'size' | 'relevance';
  onlyParticulars?: boolean;
}): Promise<{ success: boolean; data?: IdealistaSearchResponse; leads?: Lead[]; propertyLeads?: RealEstatePropertyLead[]; error?: string }> {
  const key = (params.apiKey || getSavedIdealistaApiKey()).trim();

  if (!key) {
    return {
      success: false,
      error: 'RapidAPI Key não configurada. Insira sua chave para pesquisar no Idealista (Espanha, Portugal e Itália).'
    };
  }

  try {
    const url = new URL(`${IDEALISTA_RAPIDAPI_BASE}/search`);
    url.searchParams.set('operation', 'sale'); // Estritamente VENDA
    url.searchParams.set('propertyType', 'homes');
    url.searchParams.set('locationIds', `[${params.locationId}]`);
    url.searchParams.set('maxItems', String(params.maxItems || 20));
    url.searchParams.set('page', String(params.page || 1));
    url.searchParams.set('order', params.order || 'publicationDate');

    if (params.priceFrom) url.searchParams.set('priceFrom', String(params.priceFrom));
    if (params.priceTo) url.searchParams.set('priceTo', String(params.priceTo));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': IDEALISTA_RAPIDAPI_HOST,
        'X-No-Cache': 'true'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Erro no Idealista RapidAPI (HTTP ${response.status})`;
      try {
        const json = JSON.parse(errText);
        if (json.message) msg = json.message;
      } catch {
        if (errText) msg += `: ${errText}`;
      }
      return { success: false, error: msg };
    }

    const result: IdealistaSearchResponse = await response.json();
    const items = result.elementList || [];

    const leads: Lead[] = [];
    const propertyLeads: RealEstatePropertyLead[] = [];

    for (const item of items) {
      const mappedProp = mapIdealistaItemToPropertyLead(item, params.country);
      const mappedLead = mapIdealistaItemToLead(item, params.country);
      
      propertyLeads.push(mappedProp);
      leads.push(mappedLead);
    }

    return {
      success: true,
      data: result,
      leads,
      propertyLeads
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Falha na requisição da Idealista RapidAPI: ${err.message || String(err)}`
    };
  }
}

/**
 * Busca detalhe completo de um imóvel específico no Idealista via RapidAPI
 */
export async function getIdealistaPropertyDetail(
  propertyCode: string,
  apiKey?: string,
  country: 'PT' | 'ES' | 'IT' = 'PT'
): Promise<{ success: boolean; data?: IdealistaPropertyDetail; lead?: Lead; propertyLead?: RealEstatePropertyLead; error?: string }> {
  const key = (apiKey || getSavedIdealistaApiKey()).trim();

  if (!key) {
    return {
      success: false,
      error: 'RapidAPI Key não informada. Forneça sua chave para buscar detalhes.'
    };
  }

  const cleanCode = extractPropertyCodeFromUrl(propertyCode) || propertyCode.trim();

  try {
    const url = `${IDEALISTA_RAPIDAPI_BASE}/properties/${cleanCode}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': IDEALISTA_RAPIDAPI_HOST,
        'X-No-Cache': 'true'
      }
    });

    if (!response.ok) {
      if (response.status === 410) {
        return { success: false, error: `🚨 Anúncio #${cleanCode} foi desativado ou vendido no Idealista.` };
      }
      const errText = await response.text();
      return { success: false, error: `Erro no Idealista RapidAPI (${response.status}): ${errText}` };
    }

    const detail: IdealistaPropertyDetail = await response.json();
    const propertyLead = mapIdealistaDetailToPropertyLead(detail, country);
    const lead = mapIdealistaDetailToLead(detail, country);

    return {
      success: true,
      data: detail,
      lead,
      propertyLead
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Falha ao carregar detalhes do anúncio #${cleanCode}: ${err.message || String(err)}`
    };
  }
}

/**
 * Mapeadores para Schema Lead do Criahub CRM
 */
export function mapIdealistaItemToLead(item: IdealistaSearchItem, country: 'PT' | 'ES' | 'IT'): Lead {
  const currencySymbol = '€';
  const priceNum = item.price || 0;
  const formattedPrice = `${priceNum.toLocaleString('pt-PT')} ${currencySymbol}`;
  const isParticular = item.isParticular ?? true;
  const city = item.municipality || item.province || (country === 'PT' ? 'Lisboa' : country === 'ES' ? 'Madrid' : 'Roma');
  const district = item.district || item.address || 'Zona Central';
  const title = `${item.propertyType ? item.propertyType.toUpperCase() : 'IMÓVEL'} ${item.rooms ? `T${item.rooms}` : ''} - ${district}, ${city}`;

  return {
    id: `idealista_api_${item.propertyCode}`,
    name: title,
    companyName: item.contactName || (isParticular ? 'Proprietário Particular' : 'Agência Imobiliária'),
    category: 'Imobiliário (Idealista API)',
    niche: 'Venda de Imóveis / FSBO',
    city: city,
    district: district,
    state: item.province || city,
    country: country,
    address: item.address || `${district}, ${city}`,
    phone: item.contactPhone || '',
    website: item.url || `https://www.idealista.pt/imovel/${item.propertyCode}/`,
    rating: 5,
    reviewCount: 20,
    photos: item.thumbnail ? [item.thumbnail] : [],
    status: 'NOVO',
    icpScore: 97,
    icpTier: 'SCORE_A',
    estimatedRevenue: formattedPrice,
    businessSize: priceNum >= 500000 ? 'Alto Padrão' : 'Médio Padrão',
    identifiedPain: `Imóvel à VENDA publicado no Idealista por ${formattedPrice}. Potencial captação direta ou comprador investidor.`,
    decisionMaker: {
      name: item.contactName || (isParticular ? 'Proprietário Direto (FSBO)' : 'Responsável do Anúncio'),
      role: isParticular ? 'Proprietário Particular' : 'Agência',
      directPhone: item.contactPhone || undefined
    },
    isRealEstate: true,
    isFsbo: isParticular,
    daysOnMarket: 0,
    priceDropValue: item.priceDropValue ? `${item.priceDropValue.toLocaleString('pt-PT')} €` : undefined,
    intentPriority: 'HIGH',
    intentScore: 98,
    notes: `Código Idealista: ${item.propertyCode} | Área: ${item.size || 'N/A'}m² | Quartos: ${item.rooms || 'N/A'} | Casas de Banho: ${item.bathrooms || 'N/A'}`,
    createdAt: new Date().toISOString()
  };
}

export function mapIdealistaItemToPropertyLead(item: IdealistaSearchItem, country: 'PT' | 'ES' | 'IT'): RealEstatePropertyLead {
  const priceNum = item.price || 0;
  const formattedPrice = `${priceNum.toLocaleString('pt-PT')} €`;
  const city = item.municipality || item.province || (country === 'PT' ? 'Lisboa' : country === 'ES' ? 'Madrid' : 'Roma');
  const district = item.district || 'Centro';
  const isParticular = item.isParticular ?? true;

  const commission = priceNum > 0 ? `${(priceNum * 0.05).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} € (5%)` : '5% Padrão';

  return {
    id: `prop_idealista_${item.propertyCode}`,
    title: `${item.propertyType || 'Imóvel'} ${item.rooms ? `T${item.rooms}` : ''} à Venda em ${district}, ${city}`,
    propertyType: item.propertyType || 'Apartamento',
    transactionType: 'SALE',
    price: formattedPrice,
    priceNumeric: priceNum,
    currency: 'EUR',
    country: country,
    city: city,
    zoneOrDistrict: district,
    addressSnippet: item.address || `${district}, ${city}`,
    bedrooms: item.rooms ? `${item.rooms} Quartos (T${item.rooms})` : undefined,
    bathrooms: item.bathrooms,
    areaM2: item.size,
    condition: item.status || 'Bom estado',
    advertiserType: isParticular ? 'PARTICULAR' : 'AGENCY',
    ownerName: item.contactName || (isParticular ? 'Proprietário Particular' : 'Anunciante Idealista'),
    phone: item.contactPhone || '',
    whatsappCleanPhone: item.contactPhone ? item.contactPhone.replace(/[^\d+]/g, '') : '',
    postedDateStr: 'Publicado no Idealista (API)',
    isRecent: true,
    daysOnMarket: 0,
    portalSource: 'idealista',
    portalLabel: `Idealista ${country} (RapidAPI)`,
    originalUrl: item.url || `https://www.idealista.pt/imovel/${item.propertyCode}/`,
    photoUrl: item.thumbnail,
    descriptionSnippet: item.description || `Imóvel com ${item.size || ''}m² e ${item.rooms || ''} quartos à venda em ${city}.`,
    acquisitionOpportunityScore: 96,
    urgencySignal: 'NOVO_POSTADO',
    estimatedCommission: commission,
    outreachScripts: {
      whatsappIcebreaker: `Olá ${item.contactName || 'tudo bem'}! Vi o seu anúncio no Idealista do imóvel de ${item.rooms || 3} quartos em ${district}, ${city} (${formattedPrice}). Trabalho com investidores qualificados e gostaria de saber se o imóvel ainda está disponível para apresentação.`,
      whatsappExclusivePitch: `Olá! Tenho clientes compradores ativos procurando imóveis neste valor (${formattedPrice}) em ${city}. Podemos conversar rapidamente sobre como posso levar clientes sem qualquer custo antecipado?`,
      coldCall30sPitch: `Olá, falo com o responsável pelo imóvel de ${formattedPrice} anunciado no Idealista em ${city}? Meu nome é [Seu Nome], atuo na captação direta na zona e tenho um perfil de comprador compatível.`,
      objectionRebuttals: {
        dontWantAgencies: 'Compreendo perfeitamente! Não exijo contrato de exclusividade. Trago apenas o cliente qualificado e pronto.',
        alreadyHaveBuyers: 'Excelente! Caso não concretize, já deixamos a nossa carteira de investidores ciente para visita imediata.',
        dontWantToPayCommission: 'Os honorários só acontecem se o imóvel for vendido exatamente pelo valor que você concordar na escritura.',
        justTestingTheMarket: 'Ótimo, posso facultar-lhe um estudo de mercado recente dos imóveis transacionados nesta mesma rua.',
        ifYouHaveBuyerBringHim: 'Perfeito! É exatamente essa a minha metodologia. Quando seria o melhor horário para agendar?'
      }
    },
    status: 'new',
    createdAt: new Date().toISOString()
  };
}

export function mapIdealistaDetailToLead(detail: IdealistaPropertyDetail, country: 'PT' | 'ES' | 'IT'): Lead {
  const priceNum = detail.price || detail.priceInfo?.amount || 0;
  const formattedPrice = `${priceNum.toLocaleString('pt-PT')} €`;
  const isParticular = detail.contactInfo?.userType === 'particular' || !detail.contactInfo?.isProfessional;
  const city = detail.address?.municipality || detail.address?.province || (country === 'PT' ? 'Lisboa' : 'Madrid');
  const district = detail.address?.district || detail.address?.neighborhood || 'Zona Nobre';
  const phone = detail.contactInfo?.phone1?.phoneNumber || detail.contactInfo?.phone2?.phoneNumber || '';
  const ownerName = detail.contactInfo?.contactName || detail.contactInfo?.agencyName || 'Proprietário Particular';

  const images = detail.multimedia?.images?.map(img => img.url) || [];

  return {
    id: `idealista_api_${detail.propertyCode}`,
    name: `Imóvel T${detail.rooms || 2} ${detail.size ? `${detail.size}m²` : ''} - ${district}, ${city}`,
    companyName: ownerName,
    category: 'Imobiliário (Idealista API Detail)',
    niche: 'Venda de Imóveis / FSBO',
    city: city,
    district: district,
    state: detail.address?.province || city,
    country: country,
    address: `${detail.address?.streetName || ''} ${detail.address?.streetNumber || ''} - ${district}, ${city}`.trim(),
    phone: phone,
    website: detail.url || `https://www.idealista.pt/imovel/${detail.propertyCode}/`,
    rating: 5,
    reviewCount: 25,
    photos: images.length > 0 ? images : [],
    status: 'NOVO',
    icpScore: 98,
    icpTier: 'SCORE_A',
    estimatedRevenue: formattedPrice,
    businessSize: priceNum >= 600000 ? 'Luxo / Alto Padrão' : 'Médio Padrão',
    identifiedPain: `Imóvel à VENDA com detalhes oficiais da API Idealista por ${formattedPrice}. ${detail.stats ? `Tráfego: ${detail.stats.views || 0} views, ${detail.stats.favorites || 0} favoritos.` : ''}`,
    decisionMaker: {
      name: ownerName,
      role: isParticular ? 'Proprietário Direto (FSBO)' : 'Agente / Imobiliária',
      directPhone: phone || undefined
    },
    isRealEstate: true,
    isFsbo: isParticular,
    daysOnMarket: 0,
    priceDropValue: detail.priceInfo?.drop?.amount ? `${detail.priceInfo.drop.amount.toLocaleString('pt-PT')} € (-${detail.priceInfo.drop.percentage}%)` : undefined,
    intentPriority: 'HIGH',
    intentScore: 99,
    notes: `Descrição Oficial: ${detail.description?.text?.slice(0, 300) || ''}\n\nComodidades: Piscina: ${detail.features?.hasSwimmingPool ? 'Sim' : 'Não'}, Elevador: ${detail.features?.hasLift ? 'Sim' : 'Não'}, Ar Condicionado: ${detail.features?.hasAirConditioning ? 'Sim' : 'Não'}`,
    createdAt: new Date().toISOString()
  };
}

export function mapIdealistaDetailToPropertyLead(detail: IdealistaPropertyDetail, country: 'PT' | 'ES' | 'IT'): RealEstatePropertyLead {
  const priceNum = detail.price || detail.priceInfo?.amount || 0;
  const formattedPrice = `${priceNum.toLocaleString('pt-PT')} €`;
  const isParticular = detail.contactInfo?.userType === 'particular' || !detail.contactInfo?.isProfessional;
  const city = detail.address?.municipality || detail.address?.province || (country === 'PT' ? 'Lisboa' : 'Madrid');
  const district = detail.address?.district || detail.address?.neighborhood || 'Centro';
  const phone = detail.contactInfo?.phone1?.phoneNumber || detail.contactInfo?.phone2?.phoneNumber || '';
  const ownerName = detail.contactInfo?.contactName || detail.contactInfo?.agencyName || 'Proprietário Direto';
  const images = detail.multimedia?.images?.map(img => img.url) || [];

  return {
    id: `prop_idealista_${detail.propertyCode}`,
    title: `Imóvel T${detail.rooms || 2} (${detail.size || ''}m²) à Venda em ${district}, ${city}`,
    propertyType: detail.propertyType || 'Apartamento',
    transactionType: 'SALE',
    price: formattedPrice,
    priceNumeric: priceNum,
    currency: 'EUR',
    country: country,
    city: city,
    zoneOrDistrict: district,
    addressSnippet: `${detail.address?.streetName || ''}, ${district} - ${city}`,
    bedrooms: detail.rooms ? `${detail.rooms} Quartos` : undefined,
    bathrooms: detail.bathrooms,
    areaM2: detail.size,
    condition: detail.state || 'Excelente',
    advertiserType: isParticular ? 'PARTICULAR' : 'AGENCY',
    ownerName: ownerName,
    phone: phone,
    whatsappCleanPhone: phone ? phone.replace(/[^\d+]/g, '') : '',
    postedDateStr: 'Idealista API Oficial',
    isRecent: true,
    daysOnMarket: 0,
    portalSource: 'idealista',
    portalLabel: `Idealista ${country} (RapidAPI)`,
    originalUrl: detail.url || `https://www.idealista.pt/imovel/${detail.propertyCode}/`,
    photoUrl: images[0],
    descriptionSnippet: detail.description?.text?.slice(0, 280) || '',
    acquisitionOpportunityScore: 98,
    urgencySignal: 'NOVO_POSTADO',
    estimatedCommission: `${(priceNum * 0.05).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} € (5%)`,
    outreachScripts: {
      whatsappIcebreaker: `Olá ${ownerName}! Vi o seu anúncio no Idealista do imóvel T${detail.rooms || ''} em ${district} (${formattedPrice}). Trabalho com investidores qualificados à procura nesta área exata. O imóvel ainda se encontra disponível?`,
      whatsappExclusivePitch: `Olá! Tenho clientes compradores com capacidade financeira comprovada para imóveis em ${city}. Vi os detalhes do seu imóvel no Idealista e gostaria de apresentar a nossa proposta de parceria.`,
      coldCall30sPitch: `Olá, falo com o proprietário do imóvel de ${formattedPrice} anunciado no Idealista em ${district}? Tenho compradores ativos com interesse imediato neste perfil.`,
      objectionRebuttals: {
        dontWantAgencies: 'Compreendo perfeitamente! Não exijo contrato de exclusividade. Trago apenas o cliente qualificado.',
        alreadyHaveBuyers: 'Excelente! Caso não concretize, já deixamos a nossa carteira de investidores ciente para visita imediata.',
        dontWantToPayCommission: 'Os honorários só acontecem se o imóvel for vendido exatamente pelo valor acordado.',
        justTestingTheMarket: 'Ótimo, posso facultar-lhe um estudo de mercado recente dos imóveis transacionados nesta zona.',
        ifYouHaveBuyerBringHim: 'Perfeito! É exatamente essa a minha metodologia. Quando seria a melhor altura para uma visita?'
      }
    },
    status: 'new',
    createdAt: new Date().toISOString()
  };
}
