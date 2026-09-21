import { Lead } from '../types';
import { RealEstatePropertyLead } from './realEstateTypes';

const APIFY_TOKEN_STORAGE_KEY = 'criahub_apify_token';
const DEFAULT_IDEALISTA_ACTOR_ID = '0qnMmz76dLymEDVGf';

export interface ApifyIdealistaInput {
  country?: 'es' | 'pt' | 'it';
  operation?: 'sale' | 'rent';
  endpoint?: 'listhomes' | 'details' | string;
  searchUrl?: string;
  polygonUrl?: string;
  deepSingleUrl?: string;
  deepFieldSet?: 'extended' | 'basic';
  locationId?: string;
  locationName?: string;
  numPages?: number;
  order?: 'mostrecent' | 'price' | 'pricedown' | 'size' | 'relevance';
  language?: 'es' | 'pt' | 'en' | 'it';
  furnished?: string;
  sinceDate?: string;
  center?: string;
  maxItems?: number;
}

export function getSavedApifyToken(): string {
  try {
    return localStorage.getItem(APIFY_TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveApifyToken(token: string): void {
  try {
    localStorage.setItem(APIFY_TOKEN_STORAGE_KEY, token.trim());
  } catch (e) {
    console.error('Falha ao salvar Apify Token', e);
  }
}

/**
 * Executa o Actor do Idealista no Apify via API REST nativa (compatível 100% com browser)
 */
export async function runApifyIdealistaActor(
  params: {
    token?: string;
    actorId?: string;
    country: 'es' | 'pt' | 'it';
    operation?: 'sale' | 'rent';
    searchUrl?: string;
    deepSingleUrl?: string;
    locationId?: string;
    locationName?: string;
    numPages?: number;
    order?: 'mostrecent' | 'price' | 'pricedown' | 'size' | 'relevance';
    maxItems?: number;
  }
): Promise<{
  success: boolean;
  items?: any[];
  leads?: Lead[];
  propertyLeads?: RealEstatePropertyLead[];
  runId?: string;
  datasetId?: string;
  error?: string;
}> {
  const token = (params.token || getSavedApifyToken()).trim();

  if (!token) {
    return {
      success: false,
      error: 'Token do Apify não configurado. Insira seu Personal API Token do Apify para executar o Actor.'
    };
  }

  try {
    const actorId = params.actorId || DEFAULT_IDEALISTA_ACTOR_ID;
    const op = params.operation || 'sale';

    // Monta o payload do Actor
    const input: ApifyIdealistaInput = {
      country: params.country || 'es',
      operation: op,
      endpoint: params.deepSingleUrl ? 'details' : 'listhomes',
      deepFieldSet: 'extended',
      language: params.country === 'pt' ? 'pt' : params.country === 'es' ? 'es' : 'en',
      order: params.order || 'mostrecent',
      numPages: params.numPages || 1,
    };

    if (params.searchUrl) {
      input.searchUrl = params.searchUrl.trim();
    }
    if (params.deepSingleUrl) {
      input.deepSingleUrl = params.deepSingleUrl.trim();
    }
    if (params.locationId) {
      input.locationId = params.locationId.trim();
    }
    if (params.locationName) {
      input.locationName = params.locationName.trim();
    }

    // Dispara a execução do Actor via Apify REST API
    const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(input)
    });

    if (!runRes.ok) {
      const errBody = await runRes.text();
      return {
        success: false,
        error: `Falha ao iniciar o Actor no Apify (${runRes.status}): ${errBody}`
      };
    }

    const runData = await runRes.json();
    const run = runData?.data;

    if (!run || !run.id || !run.defaultDatasetId) {
      return {
        success: false,
        error: 'O Actor foi acionado, mas o Apify não retornou run ID ou datasetId válido.'
      };
    }

    const runId = run.id;
    const datasetId = run.defaultDatasetId;

    // Aguarda conclusão (polling simples até 30s)
    let isFinished = false;
    let attempts = 0;
    while (!isFinished && attempts < 15) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;

      try {
        const checkRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const status = checkData?.data?.status;
          if (status === 'SUCCEEDED' || status === 'FAILED' || status === 'TIMED-OUT' || status === 'ABORTED') {
            isFinished = true;
          }
        }
      } catch {}
    }

    // Busca os resultados do dataset do Apify
    const maxItems = params.maxItems || 40;
    const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&limit=${maxItems}&format=json`);
    
    if (!datasetRes.ok) {
      return {
        success: false,
        error: `O Actor rodou (Run: ${runId}), mas houve erro ao baixar os itens do dataset.`
      };
    }

    const items = await datasetRes.json();
    const itemsList = Array.isArray(items) ? items : [];

    const leads: Lead[] = [];
    const propertyLeads: RealEstatePropertyLead[] = [];

    const countryCode: 'PT' | 'ES' | 'BR' = 
      params.country === 'pt' ? 'PT' : 
      params.country === 'es' ? 'ES' : 'ES';

    for (const raw of itemsList) {
      const propLead = mapApifyItemToPropertyLead(raw, countryCode);
      const lead = mapApifyItemToLead(raw, countryCode);
      
      propertyLeads.push(propLead);
      leads.push(lead);
    }

    return {
      success: true,
      items: itemsList,
      leads: leads,
      propertyLeads: propertyLeads,
      runId: runId,
      datasetId: datasetId
    };

  } catch (err: any) {
    return {
      success: false,
      error: `Erro na execução do Apify REST: ${err.message || String(err)}`
    };
  }
}

/**
 * Converte item do Dataset do Apify Idealista para Lead CRM
 */
export function mapApifyItemToLead(item: any, country: 'PT' | 'ES' | 'BR'): Lead {
  const priceNum = item.price || item.priceInfo?.amount || item.rawPrice || 0;
  const currencySymbol = country === 'BR' ? 'R$' : '€';
  const formattedPrice = item.priceFormatted || `${priceNum.toLocaleString('pt-PT')} ${currencySymbol}`;
  
  const isParticular = item.isParticular ?? (item.userType === 'particular' || item.advertiserType === 'PARTICULAR' || !item.agencyName);
  const city = item.municipality || item.city || item.province || (country === 'PT' ? 'Lisboa' : 'Madrid');
  const district = item.district || item.neighborhood || item.address || 'Centro';
  const title = item.title || item.name || `${item.propertyType || 'Imóvel'} ${item.rooms ? `T${item.rooms}` : ''} - ${district}, ${city}`;

  const phone = item.contactPhone || item.phone || item.contactInfo?.phone1?.phoneNumber || item.phone1 || '';
  const ownerName = item.contactName || item.agencyName || item.advertiserName || (isParticular ? 'Proprietário Direto (FSBO)' : 'Anunciante Idealista');

  const photos = Array.isArray(item.images) && item.images.length > 0 
    ? item.images.map((img: any) => typeof img === 'string' ? img : img.url)
    : (item.thumbnail ? [item.thumbnail] : (item.photos ? item.photos : []));

  return {
    id: `apify_${item.propertyCode || item.id || Math.random().toString(36).substring(2, 9)}`,
    name: title,
    companyName: ownerName,
    category: 'Imobiliário (Apify Idealista)',
    niche: 'Venda de Imóveis / FSBO',
    city: city,
    district: district,
    state: item.province || city,
    country: country,
    address: item.address || `${district}, ${city}`,
    phone: phone,
    website: item.url || (item.propertyCode ? `https://www.idealista.com/inmueble/${item.propertyCode}/` : ''),
    rating: 5,
    reviewCount: 25,
    photos: photos,
    status: 'NOVO',
    icpScore: 98,
    icpTier: 'SCORE_A',
    estimatedRevenue: formattedPrice,
    businessSize: priceNum >= 500000 ? 'Alto Padrão / Luxo' : 'Médio Padrão',
    identifiedPain: `Imóvel à VENDA capturado via Apify Actor (${DEFAULT_IDEALISTA_ACTOR_ID}) por ${formattedPrice}.`,
    decisionMaker: {
      name: ownerName,
      role: isParticular ? 'Proprietário Direto (FSBO)' : 'Agente / Imobiliária',
      directPhone: phone ? phone.replace(/[^\d+]/g, '') : undefined
    },
    isRealEstate: true,
    isFsbo: isParticular,
    daysOnMarket: 0,
    priceDropValue: item.priceDropValue ? `${item.priceDropValue} €` : undefined,
    intentPriority: 'HIGH',
    intentScore: 99,
    notes: `Extração Apify Dataset | Cód: ${item.propertyCode || 'N/A'}\nÁrea: ${item.size || item.area || 'N/A'}m² | Quartos: ${item.rooms || 'N/A'} | Banheiros: ${item.bathrooms || 'N/A'}\n\nDescrição: ${item.description || item.text || ''}`,
    createdAt: new Date().toISOString()
  };
}

/**
 * Converte item do Dataset do Apify Idealista para RealEstatePropertyLead
 */
export function mapApifyItemToPropertyLead(item: any, country: 'PT' | 'ES' | 'BR'): RealEstatePropertyLead {
  const priceNum = item.price || item.priceInfo?.amount || item.rawPrice || 0;
  const currencySymbol = country === 'BR' ? 'R$' : '€';
  const formattedPrice = item.priceFormatted || `${priceNum.toLocaleString('pt-PT')} ${currencySymbol}`;
  const isParticular = item.isParticular ?? (item.userType === 'particular' || item.advertiserType === 'PARTICULAR' || !item.agencyName);
  const city = item.municipality || item.city || item.province || (country === 'PT' ? 'Lisboa' : 'Madrid');
  const district = item.district || item.neighborhood || 'Centro';
  const phone = item.contactPhone || item.phone || item.contactInfo?.phone1?.phoneNumber || item.phone1 || '';
  const ownerName = item.contactName || item.agencyName || item.advertiserName || (isParticular ? 'Proprietário Particular' : 'Anunciante Idealista');

  const photos = Array.isArray(item.images) && item.images.length > 0 
    ? item.images.map((img: any) => typeof img === 'string' ? img : img.url)
    : (item.thumbnail ? [item.thumbnail] : []);

  const commission = priceNum > 0 ? `${(priceNum * 0.05).toLocaleString('pt-PT', { maximumFractionDigits: 0 })} € (5%)` : '5% Padrão';

  return {
    id: `prop_apify_${item.propertyCode || item.id || Date.now()}`,
    title: item.title || `${item.propertyType || 'Imóvel'} ${item.rooms ? `T${item.rooms}` : ''} à Venda em ${district}, ${city}`,
    propertyType: item.propertyType || 'Apartamento',
    transactionType: 'SALE',
    price: formattedPrice,
    priceNumeric: priceNum,
    currency: country === 'BR' ? 'BRL' : 'EUR',
    country: country,
    city: city,
    zoneOrDistrict: district,
    addressSnippet: item.address || `${district}, ${city}`,
    bedrooms: item.rooms ? `${item.rooms} Quartos` : undefined,
    bathrooms: item.bathrooms,
    areaM2: item.size || item.area,
    condition: item.status || 'Bom estado',
    advertiserType: isParticular ? 'PARTICULAR' : 'AGENCY',
    ownerName: ownerName,
    phone: phone,
    whatsappCleanPhone: phone ? phone.replace(/[^\d+]/g, '') : '',
    postedDateStr: 'Extraído via Apify Idealista Actor',
    isRecent: true,
    daysOnMarket: 0,
    portalSource: 'idealista',
    portalLabel: `Idealista Apify (${country})`,
    originalUrl: item.url || (item.propertyCode ? `https://www.idealista.com/inmueble/${item.propertyCode}/` : ''),
    photoUrl: photos[0],
    descriptionSnippet: item.description || item.text || `Imóvel à venda em ${city} com ${item.size || ''}m².`,
    acquisitionOpportunityScore: 97,
    urgencySignal: 'NOVO_POSTADO',
    estimatedCommission: commission,
    outreachScripts: {
      whatsappIcebreaker: `Olá ${ownerName}! Vi o seu anúncio no Idealista do imóvel em ${district}, ${city} (${formattedPrice}). Trabalho com clientes compradores ativos com crédito pré-aprovado nesta localização. O imóvel ainda se encontra disponível para visita?`,
      whatsappExclusivePitch: `Olá! Tenho clientes prontos para compra rápida de imóveis de ${formattedPrice} na zona de ${city}. Gostaria de agendar uma rápida conversa para apresentar um interessado.`,
      coldCall30sPitch: `Olá, falo com o responsável pelo imóvel de ${formattedPrice} anunciado no Idealista? Meu nome é [Seu Nome], atuo na captação direta na zona e tenho um cliente buscando esse perfil.`,
      objectionRebuttals: {
        dontWantAgencies: 'Compreendo perfeitamente! Não exijo exclusividade, apenas trago o cliente qualificado diretamente.',
        alreadyHaveBuyers: 'Excelente! Caso a negociação não feche, já deixamos a nossa carteira pronta para visita imediata.',
        dontWantToPayCommission: 'Os honorários só incidem com venda 100% concretizada no valor que você autorizar.',
        justTestingTheMarket: 'Ótimo, posso disponibilizar o valor médio transacionado por m² na sua rua nos últimos 90 dias.',
        ifYouHaveBuyerBringHim: 'Perfeito! É exatamente este o meu modelo de trabalho. Quando podemos agendar a visita?'
      }
    },
    status: 'new',
    createdAt: new Date().toISOString()
  };
}
