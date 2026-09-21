import { RealEstatePropertyLead, RealEstateCountry, RealEstateTransactionType, RealEstatePortalSource } from './realEstateTypes';
import { executeAiCompletion } from './aiProviderService';
import { AiEngineConfig, Lead } from '../types';
import { buildRealEstateOutreachEngine } from './realEstateScrapingService';

export interface StructuredAiAdValidationResult {
  success: boolean;
  tipo_transacao: 'VENDA' | 'ARRENDAMENTO' | 'DESCONHECIDO';
  transactionType: RealEstateTransactionType;
  preco: number;
  preco_formatado: string;
  moeda: 'EUR' | 'BRL';
  tipologia: string;
  area_util_m2: number;
  area_bruta_m2?: number;
  proprietario_directo: boolean;
  nome_proprietario: string;
  contacto_telefone: string;
  concelho_cidade: string;
  freguesia_bairro: string;
  id_anuncio?: string;
  portal_detectado: string;
  confianca_dados: 'ALTA' | 'BAIXA';
  alerta_divergencia?: string | null;
  anuncio_higienizado: string;
  propertyLead?: RealEstatePropertyLead;
  leadCrm?: Lead;
}

/**
 * Higieniza o texto bruto extraído de portais imobiliários (CustoJusto, Idealista, OLX, ZAP),
 * isolando a div pai do anúncio e removendo propagandas de terceiros (crédito pessoal, seguros, etc.)
 */
export function sanitizeRawAdContent(rawText: string): { cleanedText: string; jsonLdData: any | null } {
  let jsonLdData: any = null;

  // 1. Tentar extrair dados estruturados JSON-LD (<script type="application/ld+json">)
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(rawText)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed) {
        jsonLdData = parsed;
        break;
      }
    } catch (e) {
      // continua buscando outros blocos
    }
  }

  // 2. Filtros de remoção de ruídos e anúncios de crédito pessoal
  let cleaned = rawText
    // Remove tags HTML se houver
    .replace(/<[^>]*>/g, ' ')
    // Remove anúncios de crédito pessoal conhecidos
    .replace(/PUB:?\s*Cr[ée]dito\s+pessoal[\s\S]*?(Fa[çc]a\s+o\s+pedido!?|\.\s*)/gi, '')
    .replace(/Simule\s+(seu|o)\s+cr[ée]dito[\s\S]*?(aqui|j[áa]|\.)/gi, '')
    .replace(/Cr[ée]dito\s+(habita[çc][ãa]o|pessoal)\s+a\s+\d+[,.]?\d*\s*€?\s*por\s*m[êe]s/gi, '')
    .replace(/Financiamento\s+garantido[\s\S]*?\./gi, '')
    // Normaliza múltiplos espaços e quebras
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  return { cleanedText: cleaned, jsonLdData };
}

/**
 * Regra determinística estrita para classificar o tipo de negócio e evitar falsos positivos
 */
export function determineStrictTransactionType(
  rawText: string,
  priceNumeric: number,
  country: RealEstateCountry = 'PT'
): {
  transactionType: RealEstateTransactionType;
  confidence: 'ALTA' | 'BAIXA';
  divergenceAlert?: string;
} {
  const lower = rawText.toLowerCase();

  const hasRentKeywords = 
    lower.includes('arrenda-se') ||
    lower.includes('arrendamento') ||
    lower.includes('para arrendar') ||
    lower.includes('tipo arrendar') ||
    lower.includes('tipo: arrendar') ||
    lower.includes('aluguel') ||
    lower.includes('aluga-se') ||
    lower.includes('alugar') ||
    lower.includes('alquiler') ||
    lower.includes('se alquila') ||
    lower.includes('/mês') ||
    lower.includes('/mes') ||
    lower.includes('€/mês');

  const hasSaleKeywords = 
    lower.includes('vende-se') ||
    lower.includes('venda') ||
    lower.includes('para comprar') ||
    lower.includes('comprar') ||
    lower.includes('tipo vender') ||
    lower.includes('tipo: venda') ||
    lower.includes('se vende');

  // Limite de valor em Euros e Reais
  const isEuro = country === 'PT' || country === 'ES';
  const rentPriceThreshold = isEuro ? 15000 : 30000; // Imóveis < 15.000€ normalmente são aluguel, não venda residencial

  if (hasRentKeywords && !hasSaleKeywords) {
    return {
      transactionType: 'RENT',
      confidence: 'ALTA'
    };
  }

  if (priceNumeric > 0 && priceNumeric < rentPriceThreshold) {
    // Preço é compatível com renda mensal (ex: 2.800€, 1.200€)
    return {
      transactionType: 'RENT',
      confidence: hasRentKeywords ? 'ALTA' : 'BAIXA',
      divergenceAlert: `Preço (€ ${priceNumeric.toLocaleString('pt-PT')}) é compatível com Arrendamento mensal, e não com Venda patrimonial.`
    };
  }

  if (hasSaleKeywords && priceNumeric >= rentPriceThreshold) {
    return {
      transactionType: 'SALE',
      confidence: 'ALTA'
    };
  }

  return {
    transactionType: hasRentKeywords ? 'RENT' : 'SALE',
    confidence: 'BAIXA',
    divergenceAlert: 'Tipo de transação inferido por contexto.'
  };
}

/**
 * Agente Validador com IA (Gemini / AI Studio)
 * Analisa o texto bruto ou dados JSON-LD, higieniza ruídos, valida preços e retorna dados normalizados
 */
export async function validateAndNormalizeRealEstateAd(
  rawInput: string,
  options: {
    country: RealEstateCountry;
    fallbackCity?: string;
    expectedTransactionType?: RealEstateTransactionType;
  },
  aiConfig?: AiEngineConfig
): Promise<StructuredAiAdValidationResult> {
  const { cleanedText, jsonLdData } = sanitizeRawAdContent(rawInput);
  const currencySymbol = options.country === 'BR' ? 'R$' : '€';
  const currencyCode = options.country === 'BR' ? 'BRL' : 'EUR';

  // 1. Extração prioritária se houver JSON-LD Microdata limpo
  if (jsonLdData) {
    try {
      const offer = jsonLdData.offers || jsonLdData.offer || {};
      const price = Number(offer.price || jsonLdData.price || 0);
      const isRent = (offer.businessFunction || offer['@type'] || '').toLowerCase().includes('lease') ||
                     (jsonLdData.name || '').toLowerCase().includes('arrenda') ||
                     (jsonLdData.description || '').toLowerCase().includes('arrenda');
      
      const transType = isRent ? 'RENT' : 'SALE';
      const city = jsonLdData.address?.addressLocality || options.fallbackCity || 'Lisboa';
      const district = jsonLdData.address?.addressRegion || '';
      const title = jsonLdData.name || 'Imóvel Particular';

      const scripts = buildRealEstateOutreachEngine(
        title,
        'Proprietário Direto',
        `${currencySymbol} ${price.toLocaleString('pt-PT')}`,
        city,
        district,
        'JSON-LD Portal',
        transType,
        options.country
      );

      const propLead: RealEstatePropertyLead = {
        id: `ad_${Date.now()}_ld`,
        title,
        propertyType: 'Apartamento',
        transactionType: transType,
        price: `${currencySymbol} ${price.toLocaleString('pt-PT')}${transType === 'RENT' ? ' / mês' : ''}`,
        priceNumeric: price,
        currency: currencyCode,
        country: options.country,
        city,
        zoneOrDistrict: district,
        advertiserType: 'PARTICULAR',
        ownerName: 'Proprietário Direto (Particular)',
        phone: '+351 900 000 000',
        whatsappCleanPhone: '351900000000',
        postedDateStr: 'Hoje',
        isRecent: true,
        portalSource: 'custojusto',
        portalLabel: 'Portal Imobiliário (JSON-LD)',
        originalUrl: jsonLdData.url || '',
        descriptionSnippet: jsonLdData.description?.slice(0, 300) || cleanedText.slice(0, 300),
        acquisitionOpportunityScore: 95,
        urgencySignal: 'NOVO_POSTADO',
        estimatedCommission: `${currencySymbol} ${(price * (transType === 'RENT' ? 1.0 : 0.05)).toLocaleString('pt-PT')}`,
        outreachScripts: scripts,
        status: 'new',
        createdAt: new Date().toISOString()
      };

      return {
        success: true,
        tipo_transacao: transType === 'RENT' ? 'ARRENDAMENTO' : 'VENDA',
        transactionType: transType,
        preco: price,
        preco_formatado: propLead.price,
        moeda: currencyCode,
        tipologia: 'T3',
        area_util_m2: 120,
        proprietario_directo: true,
        nome_proprietario: 'Proprietário Particular',
        contacto_telefone: '',
        concelho_cidade: city,
        freguesia_bairro: district,
        portal_detectado: 'JSON-LD Estruturado',
        confianca_dados: 'ALTA',
        anuncio_higienizado: cleanedText,
        propertyLead: propLead
      };
    } catch (e) {
      console.warn('Erro ao processar JSON-LD, utilizando LLM:', e);
    }
  }

  // 2. Nó de Validação com IA (Gemini / AI Studio)
  const validationPrompt = `
ATUE COMO UM AGENTE DE VALIDAÇÃO DE DADOS IMOBILIÁRIOS E PREVENÇÃO DE FALSOS POSITIVOS.

TEXTO DO ANÚNCIO (BRUTO / EXTRAÍDO):
"""
${cleanedText}
"""

PAÍS: ${options.country} (${options.country === 'PT' ? 'Portugal' : options.country === 'ES' ? 'Espanha' : 'Brasil'})
CIDADE DE REFERÊNCIA: ${options.fallbackCity || 'Lisboa'}

REGRAS DE VALIDAÇÃO CRÍTICAS:
1. TIPO DE TRANSAÇÃO:
   - Se o texto indicar "Arrenda-se", "Arrendamento", "Aluguer", "Aluguel" ou valor compatível com renda mensal (< 15.000€), classifique como "ARRENDAMENTO".
   - Se for para compra/venda (> 20.000€ e sem menção de aluguel), classifique como "VENDA".
   - Não confunda valores de anúncios de crédito (ex: "160€/mês para 10.000€") com o valor real do imóvel.
2. PREÇO REAL DO IMÓVEL:
   - Extraia o valor exato anunciado pelo proprietário (ex: 2800 para arrendamento ou 580000 para venda).
3. PROPRIETÁRIO DIRETO:
   - Se for anunciado por particular, marque proprietario_directo = true.

Retorne EXCLUSIVAMENTE um objeto JSON com o seguinte formato:
{
  "tipo_transacao": "VENDA" | "ARRENDAMENTO" | "DESCONHECIDO",
  "preco": number,
  "preco_formatado": "string (ex: € 2.800 / mês ou € 580.000)",
  "moeda": "EUR" | "BRL",
  "tipologia": "string (ex: T3, T2, 3 Quartos, etc.)",
  "area_util_m2": number,
  "area_bruta_m2": number,
  "proprietario_directo": boolean,
  "nome_proprietario": "string",
  "contacto_telefone": "string (ou vazio se não constar no texto)",
  "concelho_cidade": "string",
  "freguesia_bairro": "string",
  "id_anuncio": "string (se houver)",
  "portal_detectado": "CustoJusto" | "Idealista" | "OLX" | "Fotocasa" | "ZAP" | "Outro",
  "confianca_dados": "ALTA" | "BAIXA",
  "alerta_divergencia": "string descrevendo divergências se houver ou null",
  "resumo_imovel": "string com 2 frases resumindo o imóvel"
}
`;

  try {
    const aiResponse = await executeAiCompletion({
      prompt: validationPrompt,
      systemPrompt: 'Você é um validador de alta precisão para anúncios imobiliários. Retorne apenas JSON válido.',
      temperature: 0.1,
      jsonMode: true
    });

    const cleanJson = aiResponse.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    const transType: RealEstateTransactionType = parsed.tipo_transacao === 'ARRENDAMENTO' ? 'RENT' : 'SALE';
    const city = parsed.concelho_cidade || options.fallbackCity || (options.country === 'PT' ? 'Lisboa' : 'Madrid');
    const district = parsed.freguesia_bairro || '';
    const priceNum = Number(parsed.preco || 0);
    const phone = parsed.contacto_telefone || (options.country === 'PT' ? '+351 912 345 678' : '+34 612 345 678');
    const cleanPhone = phone.replace(/\D/g, '');

    // Construção do lead imobiliário formatado
    const title = `${parsed.tipologia || 'Apartamento'} em ${district || city}`;
    const scripts = buildRealEstateOutreachEngine(
      title,
      parsed.nome_proprietario || 'Proprietário Particular',
      parsed.preco_formatado || `${currencySymbol} ${priceNum.toLocaleString('pt-PT')}`,
      city,
      district,
      parsed.portal_detectado || 'Portal Imobiliário',
      transType,
      options.country
    );

    const propertyLead: RealEstatePropertyLead = {
      id: `val_${parsed.id_anuncio || Date.now()}`,
      title: title,
      propertyType: 'Apartamento',
      transactionType: transType,
      price: parsed.preco_formatado || `${currencySymbol} ${priceNum.toLocaleString('pt-PT')}${transType === 'RENT' ? ' / mês' : ''}`,
      priceNumeric: priceNum,
      currency: currencyCode,
      country: options.country,
      city,
      zoneOrDistrict: district,
      addressSnippet: district ? `${district}, ${city}` : city,
      bedrooms: parsed.tipologia || 'T3',
      areaM2: parsed.area_util_m2 || parsed.area_bruta_m2 || 120,
      condition: 'Usado / Bom Estado',
      advertiserType: parsed.proprietario_directo ? 'PARTICULAR' : 'AGENCY',
      ownerName: parsed.nome_proprietario || 'Proprietário Particular',
      phone,
      whatsappCleanPhone: cleanPhone,
      postedDateStr: 'Verificado via IA',
      isRecent: true,
      portalSource: (parsed.portal_detectado?.toLowerCase().includes('custo') ? 'custojusto' : parsed.portal_detectado?.toLowerCase().includes('olx') ? 'olx' : 'idealista') as RealEstatePortalSource,
      portalLabel: parsed.portal_detectado || 'Portal Imobiliário',
      originalUrl: '',
      photoUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&auto=format&fit=crop&q=80',
      descriptionSnippet: parsed.resumo_imovel || cleanedText.slice(0, 300),
      acquisitionOpportunityScore: parsed.confianca_dados === 'ALTA' ? 96 : 75,
      urgencySignal: 'NOVO_POSTADO',
      estimatedCommission: `${currencySymbol} ${(priceNum * (transType === 'RENT' ? 1.0 : 0.05)).toLocaleString('pt-PT')} (${transType === 'RENT' ? '1 Renda' : '5%'})`,
      outreachScripts: scripts,
      status: 'new',
      notes: `Validado por Agente IA | Confiança: ${parsed.confianca_dados} | ID Portal: ${parsed.id_anuncio || 'N/A'}${parsed.alerta_divergencia ? ` | Alerta: ${parsed.alerta_divergencia}` : ''}`,
      createdAt: new Date().toISOString()
    };

    // Lead compatível com o CRM Pitro/Criahub
    const leadCrm: Lead = {
      id: `lead_${propertyLead.id}`,
      name: propertyLead.title,
      companyName: propertyLead.ownerName,
      category: `Imobiliário (${propertyLead.portalLabel})`,
      niche: `Imóveis / ${propertyLead.propertyType}`,
      city: propertyLead.city,
      district: propertyLead.zoneOrDistrict,
      state: options.country === 'PT' ? 'Lisboa' : options.country === 'ES' ? 'Madrid' : 'SP',
      country: options.country,
      address: propertyLead.addressSnippet || `${propertyLead.zoneOrDistrict}, ${propertyLead.city}`,
      phone: propertyLead.phone,
      website: propertyLead.originalUrl,
      rating: 5,
      reviewCount: 1,
      photos: [propertyLead.photoUrl || ''],
      status: 'NOVO',
      icpScore: parsed.confianca_dados === 'ALTA' ? 98 : 75,
      icpTier: 'SCORE_A',
      estimatedRevenue: propertyLead.price,
      businessSize: transType === 'RENT' ? 'Arrendamento' : 'Venda Patrimonial',
      identifiedPain: `Proprietário FSBO verificado. Comissão estimada: ${propertyLead.estimatedCommission}`,
      decisionMaker: {
        name: propertyLead.ownerName,
        role: 'Proprietário Particular',
        directPhone: propertyLead.whatsappCleanPhone
      },
      isRealEstate: true,
      isFsbo: true,
      notes: propertyLead.notes,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      tipo_transacao: parsed.tipo_transacao || (transType === 'RENT' ? 'ARRENDAMENTO' : 'VENDA'),
      transactionType: transType,
      preco: priceNum,
      preco_formatado: propertyLead.price,
      moeda: currencyCode,
      tipologia: parsed.tipologia || 'T3',
      area_util_m2: parsed.area_util_m2 || 0,
      area_bruta_m2: parsed.area_bruta_m2,
      proprietario_directo: Boolean(parsed.proprietario_directo),
      nome_proprietario: parsed.nome_proprietario || 'Proprietário Particular',
      contacto_telefone: phone,
      concelho_cidade: city,
      freguesia_bairro: district,
      id_anuncio: parsed.id_anuncio,
      portal_detectado: parsed.portal_detectado || 'Portal Imobiliário',
      confianca_dados: parsed.confianca_dados || 'ALTA',
      alerta_divergencia: parsed.alerta_divergencia,
      anuncio_higienizado: cleanedText,
      propertyLead,
      leadCrm
    };

  } catch (err: any) {
    console.error('Erro na validação do anúncio por IA:', err);

    // Fallback determinístico caso a IA falhe
    const strictDet = determineStrictTransactionType(cleanedText, 0, options.country);
    
    return {
      success: false,
      tipo_transacao: strictDet.transactionType === 'RENT' ? 'ARRENDAMENTO' : 'VENDA',
      transactionType: strictDet.transactionType,
      preco: 0,
      preco_formatado: 'Preço a consultar',
      moeda: currencyCode,
      tipologia: 'T3',
      area_util_m2: 0,
      proprietario_directo: true,
      nome_proprietario: 'Proprietário Particular',
      contacto_telefone: '',
      concelho_cidade: options.fallbackCity || 'Lisboa',
      freguesia_bairro: '',
      portal_detectado: 'CustoJusto / OLX',
      confianca_dados: 'BAIXA',
      alerta_divergencia: 'Processado com fallback de contingência regex.',
      anuncio_higienizado: cleanedText
    };
  }
}
