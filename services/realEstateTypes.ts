export type RealEstateCountry = 'PT' | 'ES' | 'BR';

export type RealEstateTransactionType = 'SALE' | 'RENT';

export type RealEstateAdvertiserType = 'PARTICULAR' | 'AGENCY' | 'UNKNOWN';

export type RealEstatePortalSource = 
  | 'idealista' 
  | 'olx' 
  | 'fotocasa' 
  | 'pisos_com' 
  | 'zap_imoveis' 
  | 'vivareal' 
  | 'chavesnamao'
  | 'custojusto'
  | 'milanuncios'
  | 'direct_scraping';

export interface RealEstatePropertyLead {
  id: string;
  title: string;
  propertyType: 'Apartamento' | 'Moradia / Casa' | 'Terreno' | 'Comercial / Loja' | 'Quinta / Fazenda' | 'Estúdio / T0-T1' | string;
  transactionType: RealEstateTransactionType;
  price: string; // Ex: "€ 240.000" ou "R$ 450.000" ou "€ 1.200 / mês"
  priceNumeric: number;
  currency: 'EUR' | 'BRL';
  
  // Localização
  country: RealEstateCountry;
  city: string;
  zoneOrDistrict: string;
  addressSnippet?: string;
  
  // Características
  bedrooms?: string; // T1, T2, T3, 3 Quartos, etc.
  bathrooms?: number;
  areaM2?: number; // Ex: 95 m²
  condition?: 'Usado / Bom Estado' | 'A Estrear / Novo' | 'Para Recuperar / Reformar';
  
  // Anunciante / Proprietário Direto (Pessoa Física)
  advertiserType: RealEstateAdvertiserType;
  ownerName: string; // Ex: "Carlos Silva (Proprietário Direto)"
  phone: string; // Telefone do anunciante particular
  whatsappCleanPhone: string;
  email?: string;
  
  // Data e Recência
  postedDateStr: string; // Ex: "Postado há 2 horas" ou "27/08/2026"
  isRecent: boolean; // Se foi postado nas últimas 24h a 7 dias
  daysOnMarket?: number; // Ex: 1 dia, 3 dias
  
  // Origem do Portal & Link Original
  portalSource: RealEstatePortalSource;
  portalLabel: string; // Ex: "Idealista (Filtro Particular)", "OLX Direto", "Fotocasa Particular"
  originalUrl: string;
  livePortalSearchUrl?: string;
  googleDorkLiveUrl?: string;
  photoUrl?: string;
  descriptionSnippet: string;
  
  // Sinais de Captação & Dores do Proprietário
  acquisitionOpportunityScore: number; // 0-100% de probabilidade de angariação com sucesso
  urgencySignal: 'ALTA_URGENCIA' | 'NOVO_POSTADO' | 'PRECO_REDUZIDO' | 'NEGOCIACAO_DIRETA';
  estimatedCommission: string; // Ex: "€ 12.000 (5%)" ou "R$ 27.000 (6%)"
  
  // Scripts Customizados de Angariação
  outreachScripts: {
    whatsappIcebreaker: string; // Mensagem amigável focada em cliente qualificado real
    whatsappExclusivePitch: string; // Abordagem de agenciamento sem exclusividade agressiva
    coldCall30sPitch: string; // Roteiro de ligação de 30 segundos
    objectionRebuttals: {
      dontWantAgencies: string; // "Não quero imobiliárias nem intermediários"
      alreadyHaveBuyers: string; // "Já tenho pessoas interessadas"
      dontWantToPayCommission: string; // "Não pago 5% de comissão"
      justTestingTheMarket: string; // "Estou só testando o preço"
      ifYouHaveBuyerBringHim: string; // "Se você tiver cliente traz, mas não assino contrato"
    };
  };
  
  status: 'new' | 'contacted' | 'negotiating' | 'acquired' | 'rejected';
  notes?: string;
  createdAt: string;
}

export interface RealEstateScrapingSearchQuery {
  country: RealEstateCountry;
  city: string;
  zoneOrDistrict?: string;
  transactionType: RealEstateTransactionType;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyParticulars: boolean; // Forçar APENAS pessoa física (excluir imobiliárias)
  maxDaysAgo?: number; // Ex: 1 (hoje), 3 (últimos 3 dias), 7 (última semana), 30 (mês)
  targetPortals: RealEstatePortalSource[];
}

export interface RealEstatePortalScrapingTarget {
  name: string;
  portal: RealEstatePortalSource;
  country: RealEstateCountry;
  particularFilterParam: string;
  directSearchUrlGenerator: (query: RealEstateScrapingSearchQuery) => string;
  isFreeMethod: boolean;
}

export interface RealEstateSearchBatch {
  id: string;
  name: string;
  timestamp: string; // ISO date string
  formattedDate: string; // Ex: '29/08/2026 15:30'
  country: RealEstateCountry;
  countryName: string;
  city: string;
  zoneOrDistrict?: string;
  transactionType: RealEstateTransactionType;
  propertyType?: string;
  leadCount: number;
  leads: RealEstatePropertyLead[];
}
