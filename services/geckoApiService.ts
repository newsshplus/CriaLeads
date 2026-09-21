import { Lead } from '../types';
import { RealEstatePropertyLead, RealEstatePortalSource } from './realEstateTypes';

const GECKO_API_STORAGE_KEY = 'criahub_geckoapi_token';
const GECKO_API_DEFAULT_URL = 'https://api.geckoapi.com.br/v1/extract';

export type GeckoSupportedTarget = 'chavesnamao.com.br' | 'olx.com.br' | 'zapimoveis.com.br' | 'vivareal.com.br';

export interface GeckoExtractorRequest {
  target: GeckoSupportedTarget;
  type: 'pdp';
  url: string;
}

export interface GeckoGenericResponse {
  requestId?: string;
  executionId?: string;
  data?: {
    source?: string;
    type?: string;
    parser?: string;
    requestUrl?: string;
    apiUrl?: string;
    extractedAt?: string;
    data?: any; // Generic structured payload
  };
  // Fallbacks if data is top-level
  url?: string;
  title?: string;
  description?: string;
  [key: string]: any;
}

// Token Storage
export function getSavedGeckoApiToken(): string {
  try {
    return localStorage.getItem(GECKO_API_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function saveGeckoApiToken(token: string): void {
  try {
    localStorage.setItem(GECKO_API_STORAGE_KEY, token.trim());
  } catch (e) {
    console.error('Falha ao salvar GeckoAPI token', e);
  }
}

/**
 * Detecta o target da GeckoAPI baseado no domínio da URL informada
 */
export function detectGeckoTargetFromUrl(url: string): GeckoSupportedTarget | null {
  const clean = url.toLowerCase().trim();
  if (clean.includes('chavesnamao.com.br')) return 'chavesnamao.com.br';
  if (clean.includes('olx.com.br')) return 'olx.com.br';
  if (clean.includes('zapimoveis.com.br')) return 'zapimoveis.com.br';
  if (clean.includes('vivareal.com.br')) return 'vivareal.com.br';
  return null;
}

/**
 * Validação prévia de URL para garantir que é estritamente IMÓVEL À VENDA
 */
export function preValidateSaleUrl(url: string): { valid: boolean; error?: string; target?: GeckoSupportedTarget } {
  const target = detectGeckoTargetFromUrl(url);
  if (!target) {
    return {
      valid: false,
      error: 'URL não suportada pela GeckoAPI. Use links de: chavesnamao.com.br, olx.com.br, zapimoveis.com.br ou vivareal.com.br'
    };
  }

  const lower = url.toLowerCase().trim();

  // 1. Bloqueio de Não-Imóveis no OLX
  if (target === 'olx.com.br') {
    const isRealEstateUrl = lower.includes('/imoveis') || 
                            lower.includes('/apartamentos') || 
                            lower.includes('/casas') || 
                            lower.includes('/terrenos') ||
                            lower.includes('/comercial');

    const isNonRealEstate = lower.includes('/celulares') || 
                            lower.includes('/autos-e-pecas') || 
                            lower.includes('/eletronicos') || 
                            lower.includes('/moda-e-beleza') || 
                            lower.includes('/musica-e-hobbies') || 
                            lower.includes('/artigos-infantis') || 
                            lower.includes('/animais-e-acessorios') || 
                            lower.includes('/servicos');

    if (isNonRealEstate || (!isRealEstateUrl && !lower.includes('olx.com.br/d/anuncio/'))) {
      return {
        valid: false,
        error: '🚨 URL Rejeitada: O link não pertence à categoria de IMÓVEIS da OLX. Apenas imóveis são permitidos.'
      };
    }
  }

  // 2. Bloqueio Estrito de Locação / Aluguel em todos os portais
  const rentalTokens = [
    '/aluguel',
    '/aluguel-',
    '/alugueis',
    '/alugar',
    '/aluguer',
    '/locacao',
    '/locacao-',
    '/temporada',
    '/quartos',
    'tipo=aluguel',
    'transacao=locacao',
    'transacao=aluguel'
  ];

  for (const token of rentalTokens) {
    if (lower.includes(token)) {
      return {
        valid: false,
        error: `🚨 URL Rejeitada: Detectado anúncio de ALUGUEL / LOCAÇÃO ('${token}'). Apenas imóveis à VENDA são permitidos.`
      };
    }
  }

  return { valid: true, target };
}

/**
 * Executa a extração via GeckoAPI com Quádrupla Blindagem de Venda Imobiliária
 */
export async function extractGeckoProperty(
  url: string,
  apiToken?: string,
  forcedTarget?: GeckoSupportedTarget
): Promise<{ 
  success: boolean; 
  data?: any; 
  lead?: Lead; 
  propertyLead?: RealEstatePropertyLead; 
  error?: string;
  portalSource?: RealEstatePortalSource;
}> {
  const token = (apiToken || getSavedGeckoApiToken()).trim();

  if (!token) {
    return {
      success: false,
      error: 'Token da GeckoAPI não configurado. Insira seu Bearer Token para autenticar os créditos.'
    };
  }

  // Pré-validação de URL
  const preCheck = preValidateSaleUrl(url);
  if (!preCheck.valid) {
    return { success: false, error: preCheck.error };
  }

  const target = forcedTarget || preCheck.target!;

  try {
    const response = await fetch(GECKO_API_DEFAULT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: target,
        type: 'pdp',
        url: url.trim()
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = `Erro na GeckoAPI (HTTP ${response.status})`;
      try {
        const jsonErr = JSON.parse(errText);
        if (jsonErr.message || jsonErr.error) {
          msg = jsonErr.message || jsonErr.error;
        }
      } catch {
        if (errText) msg += `: ${errText}`;
      }
      return { success: false, error: msg };
    }

    const rawResult: GeckoGenericResponse = await response.json();
    const itemData = rawResult?.data?.data || rawResult?.data || rawResult;

    if (!itemData || (typeof itemData === 'object' && Object.keys(itemData).length === 0)) {
      return { success: false, error: 'A GeckoAPI retornou uma resposta sem dados de anúncio.' };
    }

    // --- AUDITORIA PÓS-EXTRAÇÃO: GARANTIR QUE É IMÓVEL À VENDA ---
    const isRentalInPayload = 
      itemData.transaction === 'RENT' || 
      itemData.transaction === 'aluguel' || 
      itemData.businessType === 'rent' || 
      itemData.businessType === 'rental' ||
      (typeof itemData.category === 'string' && itemData.category.toLowerCase().includes('aluguel')) ||
      (typeof itemData.title === 'string' && /aluga|aluguel|loca[çc][ãa]o|temporada/i.test(itemData.title));

    if (isRentalInPayload) {
      return {
        success: false,
        error: '🚨 Lead Rejeitado: O anúncio capturado é de ALUGUEL / LOCAÇÃO. O sistema aceita estritamente imóveis à VENDA.'
      };
    }

    // Validação de categoria não imobiliária (ex: se no OLX extraiu produto/carro)
    if (target === 'olx.com.br') {
      const categoryStr = (itemData.category || itemData.realtyType?.name || '').toString().toLowerCase();
      const titleStr = (itemData.title || '').toString().toLowerCase();
      const isProduct = /celular|iphone|samsung|carro|moto|ve[íi]culo|notebook|roupa|servi[çc]o/i.test(titleStr) || 
                        /celular|eletronico|veiculo|auto/i.test(categoryStr);

      if (isProduct) {
        return {
          success: false,
          error: '🚨 Lead Rejeitado: Anúncio do OLX não pertence ao segmento IMOBILIÁRIO.'
        };
      }
    }

    // Mapeamento normalizado
    const mappedLead = mapGeckoPayloadToLead(itemData, target, url);
    const mappedProperty = mapGeckoPayloadToPropertyLead(itemData, target, url);

    const portalSource: RealEstatePortalSource = 
      target === 'chavesnamao.com.br' ? 'chavesnamao' :
      target === 'olx.com.br' ? 'olx' :
      target === 'zapimoveis.com.br' ? 'zap_imoveis' :
      'vivareal';

    return {
      success: true,
      data: rawResult,
      lead: mappedLead,
      propertyLead: mappedProperty,
      portalSource
    };

  } catch (err: any) {
    return {
      success: false,
      error: `Falha na requisição da GeckoAPI: ${err.message || String(err)}`
    };
  }
}

/**
 * Helper para extrair preço numérico em qualquer formato de resposta da GeckoAPI
 */
function extractNumericPrice(item: any): number {
  if (typeof item.prices?.rawPrice === 'number') return item.prices.rawPrice;
  if (typeof item.price === 'number') return item.price;
  if (typeof item.priceNumeric === 'number') return item.priceNumeric;
  
  const priceStr = item.prices?.main || item.price || item.preco || '';
  const digits = String(priceStr).replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * Converte qualquer resposta da GeckoAPI (Chaves na Mão, OLX, Zap, VivaReal) para o Lead do Criahub CRM
 */
export function mapGeckoPayloadToLead(item: any, target: GeckoSupportedTarget, originalUrl: string): Lead {
  const rawPrice = extractNumericPrice(item);
  const formattedPrice = item.prices?.main || `R$ ${rawPrice.toLocaleString('pt-BR')}`;
  
  const advertiser = item.advertiser || item.contact || {};
  const isParticular = advertiser?.type === 'PF' || item.isParticular === true || item.advertiserType === 'PARTICULAR';
  
  const phone = advertiser?.phones?.cellphone || 
                advertiser?.phones?.commercial || 
                advertiser?.phones?.landline || 
                advertiser?.phone || 
                item.phone || 
                '';

  const cleanPhone = String(phone).replace(/[^\d+]/g, '');

  const portalLabel = 
    target === 'chavesnamao.com.br' ? 'Chaves na Mão BR' :
    target === 'olx.com.br' ? 'OLX Imóveis BR' :
    target === 'zapimoveis.com.br' ? 'ZAP Imóveis BR' :
    'VivaReal BR';

  const city = advertiser?.address?.city || 
               item.address?.city || 
               item.city || 
               'Brasil';

  const district = advertiser?.address?.neighborhood || 
                   item.address?.neighborhood || 
                   item.neighborhood || 
                   'Centro';

  const state = advertiser?.address?.state || 
                item.address?.state || 
                item.state || 
                'BR';

  const areaTotal = item.area?.total || item.area?.useful || item.areaTotal || item.usableArea || 0;
  const bedrooms = item.counts?.bedrooms?.count || item.bedrooms || item.quartos || 0;
  const suites = item.counts?.suites?.count || item.suites || 0;
  const garages = item.counts?.garages?.count || item.garages || item.vagas || 0;
  const bathrooms = item.counts?.bathrooms?.count || item.bathrooms || item.banheiros || 0;

  const title = item.title || `${item.realtyType?.name || 'Imóvel'} à Venda em ${district}, ${city}`;

  const imagesList = Array.isArray(item.images) && item.images.length > 0 
    ? item.images 
    : (Array.isArray(item.photos) && item.photos.length > 0 ? item.photos : (item.featuredImage ? [item.featuredImage] : []));

  const notesText = [
    `🏷️ Portal: ${portalLabel} | 🏢 Tipo: ${item.realtyType?.name || 'Imóvel'} | Transação: VENDA`,
    `📐 Área: ${areaTotal}m² | 🛏️ Quartos: ${bedrooms} (${suites} suítes) | 🚿 Banheiros: ${bathrooms} | 🚗 Vagas: ${garages}`,
    advertiser?.name ? `👤 Anunciante: ${advertiser.name} (${advertiser.type || (isParticular ? 'PF - Particular' : 'PJ - Imobiliária')}${advertiser.creci ? ` - CRECI: ${advertiser.creci}` : ''})` : '',
    item.reference ? `🔖 Ref: ${item.reference}` : '',
    item.privativeAmenities?.length ? `✨ Lazer Privativo: ${item.privativeAmenities.slice(0, 5).join(', ')}` : '',
    item.commonAmenities?.length ? `🏊 Condomínio: ${item.commonAmenities.slice(0, 5).join(', ')}` : ''
  ].filter(Boolean).join('\n');

  return {
    id: `gecko_${target.split('.')[0]}_${item.listingId || Math.random().toString(36).substring(2, 9)}`,
    name: title,
    companyName: advertiser?.name || title,
    category: `Imobiliário (${portalLabel})`,
    niche: `Imóveis / ${item.realtyType?.name || 'Residencial Venda'}`,
    city: city,
    district: district,
    state: state,
    country: 'BR',
    address: advertiser?.address?.street 
      ? `${advertiser.address.street}, ${advertiser.address.streetNumber || 'S/N'} - ${district}, ${city} - ${state}`
      : `${district}, ${city} - ${state}`,
    phone: phone,
    website: originalUrl || item.url,
    googleMapsUrl: item.gmb?.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${city} ${district} ${title}`)}`,
    rating: item.gmb?.rating || 4.9,
    reviewCount: item.gmb?.totalReviews || 10,
    photos: imagesList,
    
    // Status e Priorização SDR Hunter
    status: 'NOVO',
    icpScore: rawPrice >= 1000000 ? 98 : 92,
    icpTier: rawPrice >= 1000000 ? 'SCORE_A' : 'SCORE_B',
    estimatedRevenue: formattedPrice,
    businessSize: rawPrice >= 2000000 ? 'Alto Padrão / Luxo' : 'Médio / Alto Padrão',
    identifiedPain: `Imóvel à venda anunciado no ${portalLabel} por ${formattedPrice}. Oportunidade para captação comercial direta ou parceria com investidores.`,
    
    // Decisor / Proprietário
    decisionMaker: {
      name: advertiser?.name || (isParticular ? 'Proprietário Particular' : 'Responsável Comercial'),
      role: isParticular ? 'Proprietário Direto (FSBO)' : 'Corretor / Imobiliária Anunciante',
      directPhone: cleanPhone,
      email: undefined
    },

    // Flags Imobiliárias
    isRealEstate: true,
    isFsbo: isParticular,
    daysOnMarket: 0,
    priceDropValue: undefined,
    intentPriority: 'HIGH',
    intentScore: 98,
    notes: notesText,
    createdAt: item.updatedAt || new Date().toISOString()
  };
}

/**
 * Converte qualquer resposta da GeckoAPI para RealEstatePropertyLead
 */
export function mapGeckoPayloadToPropertyLead(item: any, target: GeckoSupportedTarget, originalUrl: string): RealEstatePropertyLead {
  const rawPrice = extractNumericPrice(item);
  const formattedPrice = item.prices?.main || `R$ ${rawPrice.toLocaleString('pt-BR')}`;
  const advertiser = item.advertiser || item.contact || {};
  const isParticular = advertiser?.type === 'PF' || item.isParticular === true;

  const phone = advertiser?.phones?.cellphone || 
                advertiser?.phones?.commercial || 
                advertiser?.phones?.landline || 
                advertiser?.phone || 
                item.phone || 
                '';

  const cleanPhone = String(phone).replace(/[^\d+]/g, '');
  const city = advertiser?.address?.city || item.address?.city || item.city || 'Brasil';
  const district = advertiser?.address?.neighborhood || item.address?.neighborhood || item.neighborhood || 'Centro';

  const portalSource: RealEstatePortalSource = 
    target === 'chavesnamao.com.br' ? 'chavesnamao' :
    target === 'olx.com.br' ? 'olx' :
    target === 'zapimoveis.com.br' ? 'zap_imoveis' :
    'vivareal';

  const portalLabel = 
    target === 'chavesnamao.com.br' ? 'Chaves na Mão (Brasil)' :
    target === 'olx.com.br' ? 'OLX Imóveis (Brasil)' :
    target === 'zapimoveis.com.br' ? 'ZAP Imóveis (Brasil)' :
    'VivaReal (Brasil)';

  const bedroomsCount = item.counts?.bedrooms?.count || item.bedrooms || item.quartos;
  const areaValue = item.area?.total || item.area?.useful || item.areaTotal || item.usableArea;
  const title = item.title || `Imóvel à Venda em ${district}, ${city}`;

  const commissionValue = rawPrice > 0 
    ? `R$ ${(rawPrice * 0.06).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} (6%)`
    : '6% Padrão';

  return {
    id: `prop_gecko_${target.split('.')[0]}_${item.listingId || Date.now()}`,
    title: title,
    propertyType: item.realtyType?.name || 'Imóvel Residencial',
    transactionType: 'SALE',
    price: formattedPrice,
    priceNumeric: rawPrice,
    currency: 'BRL',
    country: 'BR',
    city: city,
    zoneOrDistrict: district,
    addressSnippet: advertiser?.address?.street 
      ? `${advertiser.address.street}, ${advertiser.address.streetNumber || ''} - ${district}`
      : `${district}, ${city}`,
    bedrooms: bedroomsCount ? `${bedroomsCount} Quartos` : undefined,
    bathrooms: item.counts?.bathrooms?.count || item.bathrooms,
    areaM2: areaValue || undefined,
    condition: 'A Estrear / Novo',
    advertiserType: isParticular ? 'PARTICULAR' : 'AGENCY',
    ownerName: advertiser?.name || (isParticular ? 'Proprietário Direto' : `Anunciante ${portalLabel}`),
    phone: phone,
    whatsappCleanPhone: cleanPhone.startsWith('+') ? cleanPhone : (cleanPhone ? `+55${cleanPhone}` : ''),
    postedDateStr: 'Extraído em tempo real via GeckoAPI',
    isRecent: true,
    daysOnMarket: 0,
    portalSource: portalSource,
    portalLabel: `${portalLabel} - GeckoAPI`,
    originalUrl: originalUrl || item.url,
    photoUrl: item.featuredImage || (item.images && item.images[0]) || (item.photos && item.photos[0]),
    descriptionSnippet: (item.description || item.metaDescription || '').replace(/<[^>]+>/g, ' ').slice(0, 280),
    acquisitionOpportunityScore: 96,
    urgencySignal: 'NOVO_POSTADO',
    estimatedCommission: commissionValue,
    outreachScripts: {
      whatsappIcebreaker: `Olá ${advertiser?.name || 'tudo bem'}! Vi o anúncio do seu imóvel à venda no ${district} em ${city} (${formattedPrice}). Tenho investidores e compradores qualificados buscando exatamente este perfil na região. O imóvel segue disponível para visita e apresentação?`,
      whatsappExclusivePitch: `Olá! Trabalho com captação e clientes com crédito pré-aprovado buscando imóveis de alto padrão em ${city}. Vi seu anúncio no ${portalLabel} e gostaria de alinhar uma parceria comercial sem burocracia.`,
      coldCall30sPitch: `Olá, falo com o responsável pelo imóvel de ${formattedPrice} anunciado no ${portalLabel}? Meu nome é [Seu Nome], atuo com intermediação e captação qualificada em ${city} e tenho um comprador buscando este perfil exato.`,
      objectionRebuttals: {
        dontWantAgencies: 'Entendo perfeitamente! Não exijo exclusividade travada. Minha proposta é trazer clientes pré-aprovados diretamente para visita.',
        alreadyHaveBuyers: 'Excelente! Caso a negociação em andamento não conclua, já deixamos o cadastro alinhado com nossos investidores.',
        dontWantToPayCommission: 'A comissão só é devida se o negócio for 100% concretizado e no valor que você autorizar na mesa.',
        justTestingTheMarket: 'Ótimo, posso compartilhar com você o comparativo de preço por metro quadrado das últimas vendas realizadas no bairro.',
        ifYouHaveBuyerBringHim: 'Perfeito! É exatamente essa a proposta. Posso agendar uma visita prévia ou enviar a ficha do comprador?'
      }
    },
    status: 'new',
    createdAt: new Date().toISOString()
  };
}

// Mantém compatibilidade com chamadas anteriores do Chaves na Mão
export const extractChavesNaMaoProperty = extractGeckoProperty;
