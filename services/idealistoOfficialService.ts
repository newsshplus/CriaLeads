/**
 * Idealisto Official API & OAuth2 Integration Service
 * Based on the Idealista API architecture (https://github.com/hmeleiro/idealisto)
 * Implements the OAuth2 Client Credentials flow, coordinate radius search, 
 * and property detail endpoints.
 */

import { Lead } from '../types';
import { RealEstatePropertyLead } from './realEstateTypes';

const IDEALISTO_KEY_STORAGE = 'criahub_idealisto_api_key';
const IDEALISTO_SECRET_STORAGE = 'criahub_idealisto_api_secret';
const IDEALISTO_TOKEN_STORAGE = 'criahub_idealisto_bearer_token';

export interface IdealistoOAuthCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface IdealistoSearchParams {
  country: 'es' | 'pt' | 'it';
  operation: 'sale' | 'rent';
  propertyType: 'homes' | 'offices' | 'premises' | 'garages';
  center?: string; // "lat,lng" e.g. "40.416775,-3.703790" (Madrid) ou "38.722252,-9.139337" (Lisboa)
  distance?: number; // meters e.g. 5000
  locationId?: string; // e.g. "0-EU-ES-28-07"
  maxPrice?: number;
  minPrice?: number;
  minSize?: number;
  maxSize?: number;
  bedrooms?: string; // e.g. "1,2,3,4"
  bathrooms?: string;
  hasMultimedia?: boolean;
  sinceDate?: 'W' | 'M' | 'T' | 'Y'; // Week, Month, Three months, Year
  order?: 'publicationDate' | 'price' | 'priceDown' | 'distance';
  sort?: 'asc' | 'desc';
  numPage?: number;
  maxItems?: number;
}

export function getSavedIdealistoCredentials(): { apiKey: string; apiSecret: string } {
  try {
    return {
      apiKey: localStorage.getItem(IDEALISTO_KEY_STORAGE) || '',
      apiSecret: localStorage.getItem(IDEALISTO_SECRET_STORAGE) || ''
    };
  } catch {
    return { apiKey: '', apiSecret: '' };
  }
}

export function saveIdealistoCredentials(apiKey: string, apiSecret: string): void {
  try {
    localStorage.setItem(IDEALISTO_KEY_STORAGE, apiKey.trim());
    localStorage.setItem(IDEALISTO_SECRET_STORAGE, apiSecret.trim());
  } catch (e) {
    console.error('Falha ao salvar credenciais do Idealista OAuth2', e);
  }
}

/**
 * Obtém ou renova o Bearer Token OAuth2 da API Oficial do Idealista
 * Fluxo: POST https://api.idealista.com/oauth/token (grant_type=client_credentials)
 * Auth Header: Basic base64(apiKey:apiSecret)
 */
export async function getIdealistoOAuthToken(
  apiKey: string,
  apiSecret: string,
  forceRefresh = false
): Promise<{ success: boolean; token?: string; error?: string }> {
  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(IDEALISTO_TOKEN_STORAGE);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.expiresAt > Date.now()) {
          return { success: true, token: parsed.token };
        }
      }
    } catch {}
  }

  if (!apiKey || !apiSecret) {
    return {
      success: false,
      error: 'API Key e API Secret da Idealista Developers são obrigatórios para autenticação OAuth2.'
    };
  }

  try {
    // Codificação Basic Auth RFC 7617
    const basicAuth = btoa(`${apiKey.trim()}:${apiSecret.trim()}`);
    
    // Tenta chamada direta ou via proxy de desenvolvimento
    const response = await fetch('https://api.idealista.com/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: 'grant_type=client_credentials&scope=read'
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        error: `Falha na autenticação OAuth2 do Idealista (${response.status}): ${errText || response.statusText}`
      };
    }

    const data = await response.json();
    const token = data.access_token;
    const expiresIn = data.expires_in || 3600;

    sessionStorage.setItem(IDEALISTO_TOKEN_STORAGE, JSON.stringify({
      token: token,
      expiresAt: Date.now() + (expiresIn - 60) * 1000
    }));

    return { success: true, token };
  } catch (err: any) {
    return {
      success: false,
      error: `Erro ao autenticar com o servidor OAuth2 do Idealista: ${err.message || String(err)}`
    };
  }
}

/**
 * Realiza a busca no endpoint oficial 3.5 do Idealista
 * POST/GET https://api.idealista.com/3.5/{country}/search
 */
export async function searchIdealistoOfficial(
  params: IdealistoSearchParams,
  credentials?: IdealistoOAuthCredentials
): Promise<{
  success: boolean;
  elementList?: any[];
  propertyLeads?: RealEstatePropertyLead[];
  leads?: Lead[];
  total?: number;
  totalPages?: number;
  actualPage?: number;
  isMockDemo?: boolean;
  error?: string;
}> {
  const creds = credentials || getSavedIdealistoCredentials();

  // Se não houver credenciais oficiais ou em caso de CORS no browser, 
  // oferecemos a execução com dados estruturados do padrão idealisto + fallback inteligente
  let token = '';
  if (creds.apiKey && creds.apiSecret) {
    const authRes = await getIdealistoOAuthToken(creds.apiKey, creds.apiSecret);
    if (authRes.success && authRes.token) {
      token = authRes.token;
    }
  }

  const country = params.country || 'es';
  const queryParams = new URLSearchParams();
  queryParams.append('operation', params.operation || 'sale');
  queryParams.append('propertyType', params.propertyType || 'homes');
  
  if (params.center) queryParams.append('center', params.center);
  if (params.distance) queryParams.append('distance', String(params.distance));
  if (params.locationId) queryParams.append('locationId', params.locationId);
  if (params.maxPrice) queryParams.append('maxPrice', String(params.maxPrice));
  if (params.minPrice) queryParams.append('minPrice', String(params.minPrice));
  if (params.minSize) queryParams.append('minSize', String(params.minSize));
  if (params.maxSize) queryParams.append('maxSize', String(params.maxSize));
  if (params.bedrooms) queryParams.append('bedrooms', params.bedrooms);
  if (params.bathrooms) queryParams.append('bathrooms', params.bathrooms);
  if (params.sinceDate) queryParams.append('sinceDate', params.sinceDate);
  if (params.order) queryParams.append('order', params.order);
  if (params.numPage) queryParams.append('numPage', String(params.numPage));
  if (params.maxItems) queryParams.append('maxItems', String(params.maxItems || 20));

  if (token) {
    try {
      const response = await fetch(`https://api.idealista.com/3.5/${country}/search?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const elementList = data.elementList || [];
        const leads: Lead[] = [];
        const propertyLeads: RealEstatePropertyLead[] = [];
        const countryCode = country.toUpperCase() as 'PT' | 'ES';

        for (const item of elementList) {
          const pLead = mapIdealistoElementToPropertyLead(item, countryCode);
          const cLead = mapIdealistoElementToLead(item, countryCode);
          propertyLeads.push(pLead);
          leads.push(cLead);
        }

        return {
          success: true,
          elementList: elementList,
          propertyLeads: propertyLeads,
          leads: leads,
          total: data.total,
          totalPages: data.totalPages,
          actualPage: data.actualPage,
          isMockDemo: false
        };
      }
    } catch (err) {
      console.warn('Requisição direta Idealista 3.5 bloqueada por CORS/Rede, ativando Sandbox Engine...', err);
    }
  }

  // Se não houver credenciais oficiais ou em caso de CORS no browser, 
  // retornamos indicando que não há credenciais ativas para não poluir buscas reais com dados estáticos.
  return {
    success: false,
    elementList: [],
    propertyLeads: [],
    leads: [],
    total: 0,
    totalPages: 0,
    actualPage: 0,
    isMockDemo: true,
    error: 'Credenciais da API Oficial do Idealista não configuradas.'
  };
}

/**
 * Converte elemento retornado pela API Idealista 3.5 para Lead
 */
export function mapIdealistoElementToLead(item: any, country: 'PT' | 'ES'): Lead {
  const price = item.price || 0;
  const currency = country === 'PT' ? '€' : '€';
  const formattedPrice = `${price.toLocaleString('pt-PT')} ${currency}`;
  const isParticular = item.userType === 'particular' || !item.agencyIsABrand;
  const city = item.municipality || item.province || (country === 'PT' ? 'Lisboa' : 'Madrid');
  const district = item.district || item.neighborhood || 'Centro';
  const owner = isParticular ? 'Proprietário Direto (FSBO)' : (item.advertiserName || 'Agência Imobiliária');
  const phone = item.contactInfo?.phone1?.phoneNumber || item.phone || '';

  return {
    id: `idealisto_${item.propertyCode || Math.random().toString(36).substring(2, 9)}`,
    name: item.suggestedTexts?.title || `${item.propertyType || 'Imóvel'} T${item.rooms || 2} em ${district}`,
    companyName: owner,
    category: 'Imobiliário (Idealista OAuth2)',
    niche: 'Venda de Imóveis / FSBO',
    city: city,
    district: district,
    state: item.province || city,
    country: country,
    address: item.address || `${district}, ${city}`,
    phone: phone,
    website: item.url || `https://www.idealista.${country === 'PT' ? 'pt' : 'com'}/imovel/${item.propertyCode}/`,
    rating: 5,
    reviewCount: 18,
    photos: item.multimedia?.images?.map((img: any) => img.url) || [item.thumbnail],
    status: 'NOVO',
    icpScore: 99,
    icpTier: 'SCORE_A',
    estimatedRevenue: formattedPrice,
    businessSize: price >= 500000 ? 'Alto Padrão / Premium' : 'Médio Padrão',
    identifiedPain: `Imóvel à VENDA capturado via Idealisto API (${item.size || 'N/A'}m², ${item.rooms || 'N/A'} qtos).`,
    decisionMaker: {
      name: owner,
      role: isParticular ? 'Proprietário Direto (FSBO)' : 'Agente Imobiliário',
      directPhone: phone ? phone.replace(/[^\d+]/g, '') : undefined
    },
    isRealEstate: true,
    isFsbo: isParticular,
    daysOnMarket: 0,
    intentPriority: 'HIGH',
    intentScore: 98,
    notes: `Capturado via Idealisto Engine (API 3.5)\nCódigo: ${item.propertyCode}\nPreço m²: ${item.priceByArea ? `${item.priceByArea} €/m²` : 'N/A'}\nAndar: ${item.floor || 'N/A'} | Elevador: ${item.hasLift ? 'Sim' : 'Não'}`,
    createdAt: new Date().toISOString()
  };
}

/**
 * Converte elemento para RealEstatePropertyLead
 */
export function mapIdealistoElementToPropertyLead(item: any, country: 'PT' | 'ES'): RealEstatePropertyLead {
  const price = item.price || 0;
  const currency = 'EUR';
  const formattedPrice = `${price.toLocaleString('pt-PT')} €`;
  const isParticular = item.userType === 'particular' || !item.agencyIsABrand;
  const city = item.municipality || item.province || (country === 'PT' ? 'Lisboa' : 'Madrid');
  const district = item.district || item.neighborhood || 'Centro';
  const owner = isParticular ? 'Proprietário Particular' : (item.advertiserName || 'Anunciante');
  const phone = item.contactInfo?.phone1?.phoneNumber || item.phone || '+351 912 345 678';
  const commission = `${(price * 0.05).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} € (5%)`;

  const photo = item.thumbnail || (item.multimedia?.images && item.multimedia.images[0]?.url) || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80';

  return {
    id: `prop_idealisto_${item.propertyCode || Date.now()}`,
    title: item.suggestedTexts?.title || `${item.propertyType || 'Apartamento'} T${item.rooms || 2} à Venda em ${district}, ${city}`,
    propertyType: item.propertyType || 'Apartamento',
    transactionType: 'SALE',
    price: formattedPrice,
    priceNumeric: price,
    currency: currency,
    country: country,
    city: city,
    zoneOrDistrict: district,
    addressSnippet: item.address || `${district}, ${city}`,
    bedrooms: item.rooms ? `${item.rooms} Quartos` : '2 Quartos',
    bathrooms: item.bathrooms || 2,
    areaM2: item.size || 95,
    condition: item.status || 'Excelente estado',
    advertiserType: isParticular ? 'PARTICULAR' : 'AGENCY',
    ownerName: owner,
    phone: phone,
    whatsappCleanPhone: phone.replace(/[^\d+]/g, ''),
    postedDateStr: 'Extraído via Idealisto OAuth2 Engine',
    isRecent: true,
    daysOnMarket: 0,
    portalSource: 'idealista',
    portalLabel: `Idealista 3.5 API (${country})`,
    originalUrl: item.url || `https://www.idealista.${country === 'PT' ? 'pt' : 'com'}/imovel/${item.propertyCode}/`,
    photoUrl: photo,
    descriptionSnippet: `Imóvel à venda no distrito de ${district}. Área útil de ${item.size || 95}m², ${item.rooms || 2} quartos, ${item.bathrooms || 2} banheiros.`,
    acquisitionOpportunityScore: 99,
    urgencySignal: 'NOVO_POSTADO',
    estimatedCommission: commission,
    outreachScripts: {
      whatsappIcebreaker: `Olá ${owner}! Vi o seu imóvel anunciado no Idealista em ${district} (${formattedPrice}). Tenho compradores ativos qualificados para esta tipologia. O imóvel ainda se encontra disponível para venda?`,
      whatsappExclusivePitch: `Boa tarde! Trabalho com compradores qualificados com capital aprovado para a região de ${city}. Gostaria de entender a disponibilidade para agendar uma visita ao imóvel de ${formattedPrice}.`,
      coldCall30sPitch: `Olá! Falo com o proprietário do imóvel de ${formattedPrice} anunciado no Idealista em ${district}? Aqui é [Seu Nome], atuo na captação direta na região.`,
      objectionRebuttals: {
        dontWantAgencies: 'Entendo perfeitamente! Não exijo contrato de exclusividade prévio, só agendo com cliente comprador já qualificado.',
        alreadyHaveBuyers: 'Excelente! Caso o negócio atual não se concretize, já temos outro perfil pronto para visita.',
        dontWantToPayCommission: 'Os honorários de captação só são devidos mediante venda 100% efetivada no valor acordado.',
        justTestingTheMarket: 'Perfeito, posso lhe enviar o relatório de m² transacionado na sua rua nos últimos 90 dias.',
        ifYouHaveBuyerBringHim: 'Excelente! É exatamente esse o meu objetivo. Qual o melhor dia desta semana para visitarmos?'
      }
    },
    status: 'new',
    createdAt: new Date().toISOString()
  };
}

/**
 * Gera dados simulados realistas para teste do ecossistema hmeleiro/idealisto
 */
function generateIdealistoSandboxResults(params: IdealistoSearchParams): {
  elementList: any[];
  propertyLeads: RealEstatePropertyLead[];
  leads: Lead[];
} {
  const isPt = params.country === 'pt';
  const cities = isPt 
    ? [{ city: 'Lisboa', district: 'Avenidas Novas', lat: 38.7369, lng: -9.1427 }, { city: 'Cascais', district: 'Estoril', lat: 38.7057, lng: -9.3980 }, { city: 'Porto', district: 'Foz do Douro', lat: 41.1517, lng: -8.6750 }]
    : [{ city: 'Madrid', district: 'Salamanca', lat: 40.4297, lng: -3.6797 }, { city: 'Madrid', district: 'Chamberí', lat: 40.4340, lng: -3.7038 }, { city: 'Barcelona', district: 'Eixample', lat: 41.3887, lng: 2.1589 }];

  const baseProps = [
    {
      code: '98452101',
      title: isPt ? 'Apartamento T3 Renovado com Terraço Privativo' : 'Piso Exclusivo Reformado de 3 Dormitorios con Terraza',
      price: 495000,
      size: 135,
      rooms: 3,
      bathrooms: 2,
      floor: '3º com elevador',
      userType: 'particular',
      phone: isPt ? '+351 919 845 201' : '+34 612 845 201',
      photo: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    },
    {
      code: '98452102',
      title: isPt ? 'Moradia T4 Contemporânea com Piscina e Jardim' : 'Chalet Independiente de Lujo con Piscina y Jardín',
      price: 820000,
      size: 260,
      rooms: 4,
      bathrooms: 4,
      floor: 'Moradia Unifamiliar',
      userType: 'particular',
      phone: isPt ? '+351 925 110 442' : '+34 655 110 442',
      photo: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
    },
    {
      code: '98452103',
      title: isPt ? 'Apartamento T2 Novo em Condomínio Fechado com Garagem' : 'Ático Dúplex de 2 Dormitorios con Vistas Panorámicas',
      price: 340000,
      size: 88,
      rooms: 2,
      bathrooms: 2,
      floor: '5º com elevador',
      userType: 'particular',
      phone: isPt ? '+351 933 778 901' : '+34 688 778 901',
      photo: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const elementList: any[] = [];
  const propertyLeads: RealEstatePropertyLead[] = [];
  const leads: Lead[] = [];
  const countryCode = isPt ? 'PT' : 'ES';

  baseProps.forEach((p, idx) => {
    const loc = cities[idx % cities.length];
    const raw = {
      propertyCode: p.code,
      thumbnail: p.photo,
      floor: p.floor,
      price: p.price,
      priceByArea: Math.round(p.price / p.size),
      propertyType: 'homes',
      operation: 'sale',
      size: p.size,
      exterior: true,
      rooms: p.rooms,
      bathrooms: p.bathrooms,
      address: `${loc.district}, ${loc.city}`,
      province: loc.city,
      municipality: loc.city,
      district: loc.district,
      neighborhood: loc.district,
      latitude: loc.lat,
      longitude: loc.lng,
      hasLift: true,
      userType: p.userType,
      phone: p.phone,
      suggestedTexts: {
        title: p.title,
        subtitle: `${p.size}m² - ${p.rooms} qtos - ${loc.district}`
      },
      url: `https://www.idealista.${isPt ? 'pt' : 'com'}/imovel/${p.code}/`
    };

    elementList.push(raw);
    propertyLeads.push(mapIdealistoElementToPropertyLead(raw, countryCode));
    leads.push(mapIdealistoElementToLead(raw, countryCode));
  });

  return { elementList, propertyLeads, leads };
}
