import { CountryEconomicProfile, HighTicketNicheRecommendation } from '../types';

export const COUNTRY_PROFILES: Record<string, CountryEconomicProfile> = {
  "Brasil": {
    name: "Brasil",
    code: "BR",
    currencyCode: "BRL",
    currencySymbol: "R$",
    currencyName: "Real Brasileiro",
    flag: "🇧🇷",
    phonePrefix: "+55",
    locale: "pt-BR",
    purchasingPowerIndex: 1.0,
    averageTicketExample: "R$ 8.000 a R$ 35.000 / projeto",
    regionsOrDistricts: [
      "Todas", "São Paulo (SP)", "Rio de Janeiro (RJ)", "Minas Gerais (MG)", 
      "Paraná (PR)", "Santa Catarina (SC)", "Rio Grande do Sul (RS)", 
      "Bahia (BA)", "Ceará (CE)", "Distrito Federal (DF)", "Goiás (GO)", 
      "Pernambuco (PE)", "Espírito Santo (ES)", "Mato Grosso (MT)", "Amazonas (AM)"
    ],
    cities: [
      "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", 
      "Florianópolis", "Brasília", "Salvador", "Fortaleza", "Recife", "Goiânia", 
      "Campinas", "Ribeirão Preto", "Santos", "Joinville", "Londrina", "Vitória"
    ]
  },
  "Portugal": {
    name: "Portugal",
    code: "PT",
    currencyCode: "EUR",
    currencySymbol: "€",
    currencyName: "Euro",
    flag: "🇵🇹",
    phonePrefix: "+351",
    locale: "pt-PT",
    purchasingPowerIndex: 0.22,
    averageTicketExample: "€ 1.800 a € 7.500 / projeto",
    regionsOrDistricts: [
      "Todas", "Lisboa", "Porto", "Braga", "Aveiro", "Coimbra", "Faro", "Leiria", 
      "Setúbal", "Viseu", "Viana do Castelo", "Santarém", "Évora", "Madeira", "Açores"
    ],
    cities: [
      "Lisboa", "Porto", "Braga", "Coimbra", "Aveiro", "Faro", "Funchal", 
      "Guimarães", "Leiria", "Setúbal", "Cascais", "Sintra", "Viseu", "Oeiras", "Vila Nova de Gaia"
    ]
  },
  "Espanha": {
    name: "Espanha",
    code: "ES",
    currencyCode: "EUR",
    currencySymbol: "€",
    currencyName: "Euro",
    flag: "🇪🇸",
    phonePrefix: "+34",
    locale: "es-ES",
    purchasingPowerIndex: 0.24,
    averageTicketExample: "€ 2.000 a € 8.500 / proyecto",
    regionsOrDistricts: [
      "Todas", "Comunidad de Madrid", "Cataluña", "Andalucía", "Comunidad Valenciana", 
      "País Vasco", "Galicia", "Castilla y León", "Canarias", "Baleares"
    ],
    cities: [
      "Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga", "Bilbao", "Zaragoza", 
      "Alicante", "Palma de Mallorca", "Murcia", "Las Palmas", "San Sebastián"
    ]
  },
  "Suíça": {
    name: "Suíça",
    code: "CH",
    currencyCode: "CHF",
    currencySymbol: "CHF",
    currencyName: "Franco Suíço",
    flag: "🇨🇭",
    phonePrefix: "+41",
    locale: "de-CH",
    purchasingPowerIndex: 0.38,
    averageTicketExample: "3.500 CHF a 15.000 CHF / projekt",
    regionsOrDistricts: [
      "Todas", "Zürich", "Geneva", "Bern", "Vaud", "Basel-Stadt", "Lucerne", "Ticino", "St. Gallen", "Valais"
    ],
    cities: [
      "Zürich", "Geneva", "Basel", "Bern", "Lausanne", "Winterthur", "Lucerne", "St. Gallen", "Lugano", "Biel/Bienne"
    ]
  },
  "Estados Unidos": {
    name: "Estados Unidos",
    code: "US",
    currencyCode: "USD",
    currencySymbol: "$",
    currencyName: "Dólar Americano",
    flag: "🇺🇸",
    phonePrefix: "+1",
    locale: "en-US",
    purchasingPowerIndex: 0.28,
    averageTicketExample: "$ 2,500 to $ 10,000 / project",
    regionsOrDistricts: [
      "Todas", "California (CA)", "Florida (FL)", "New York (NY)", "Texas (TX)", 
      "Illinois (IL)", "Washington (WA)", "Massachusetts (MA)", "Georgia (GA)", "Colorado (CO)"
    ],
    cities: [
      "New York", "Miami", "San Francisco", "Austin", "Los Angeles", "Chicago", "Boston", 
      "Seattle", "Atlanta", "Dallas", "Houston", "Denver", "San Diego", "Orlando"
    ]
  },
  "Reino Unido": {
    name: "Reino Unido",
    code: "GB",
    currencyCode: "GBP",
    currencySymbol: "£",
    currencyName: "Libra Esterlina",
    flag: "🇬🇧",
    phonePrefix: "+44",
    locale: "en-GB",
    purchasingPowerIndex: 0.22,
    averageTicketExample: "£ 2,000 to £ 8,000 / project",
    regionsOrDistricts: [
      "Todas", "Greater London", "Greater Manchester", "West Midlands", "Scotland", "Yorkshire", "South East", "Wales"
    ],
    cities: [
      "London", "Manchester", "Birmingham", "Edinburgh", "Bristol", "Leeds", "Glasgow", "Liverpool", "Cambridge", "Oxford"
    ]
  },
  "França": {
    name: "França",
    code: "FR",
    currencyCode: "EUR",
    currencySymbol: "€",
    currencyName: "Euro",
    flag: "🇫🇷",
    phonePrefix: "+33",
    locale: "fr-FR",
    purchasingPowerIndex: 0.25,
    averageTicketExample: "€ 2.200 à € 9.000 / projet",
    regionsOrDistricts: [
      "Todas", "Île-de-France", "Auvergne-Rhône-Alpes", "Provence-Alpes-Côte d'Azur", "Occitanie", "Nouvelle-Aquitaine"
    ],
    cities: [
      "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Bordeaux", "Lille", "Strasbourg", "Montpellier"
    ]
  },
  "Alemanha": {
    name: "Alemanha",
    code: "DE",
    currencyCode: "EUR",
    currencySymbol: "€",
    currencyName: "Euro",
    flag: "🇩🇪",
    phonePrefix: "+49",
    locale: "de-DE",
    purchasingPowerIndex: 0.26,
    averageTicketExample: "€ 2.500 bis € 10.000 / Projekt",
    regionsOrDistricts: [
      "Todas", "Bayern", "Baden-Württemberg", "Nordrhein-Westfalen", "Hessen", "Berlin", "Hamburg"
    ],
    cities: [
      "Berlin", "München", "Frankfurt", "Hamburg", "Köln", "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Nürnberg"
    ]
  },
  "Itália": {
    name: "Itália",
    code: "IT",
    currencyCode: "EUR",
    currencySymbol: "€",
    currencyName: "Euro",
    flag: "🇮🇹",
    phonePrefix: "+39",
    locale: "it-IT",
    purchasingPowerIndex: 0.23,
    averageTicketExample: "€ 1.800 a € 7.500 / progetto",
    regionsOrDistricts: [
      "Todas", "Lombardia", "Lazio", "Veneto", "Emilia-Romagna", "Piemonte", "Toscana", "Campania"
    ],
    cities: [
      "Milano", "Roma", "Torino", "Bologna", "Firenze", "Napoli", "Venezia", "Verona", "Genova", "Bari"
    ]
  },
  "Países Baixos": {
    name: "Países Baixos",
    code: "NL",
    currencyCode: "EUR",
    currencySymbol: "€",
    currencyName: "Euro",
    flag: "🇳🇱",
    phonePrefix: "+31",
    locale: "nl-NL",
    purchasingPowerIndex: 0.26,
    averageTicketExample: "€ 2.200 tot € 9.500 / project",
    regionsOrDistricts: [
      "Todas", "North Holland", "South Holland", "Utrecht", "North Brabant", "Gelderland"
    ],
    cities: [
      "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Breda"
    ]
  },
  "México": {
    name: "México",
    code: "MX",
    currencyCode: "MXN",
    currencySymbol: "$",
    currencyName: "Peso Mexicano",
    flag: "🇲🇽",
    phonePrefix: "+52",
    locale: "es-MX",
    purchasingPowerIndex: 4.8,
    averageTicketExample: "$ 40,000 a $ 160,000 MXN / proyecto",
    regionsOrDistricts: [
      "Todas", "CDMX", "Nuevo León", "Jalisco", "Estado de México", "Puebla", "Querétaro", "Yucatán"
    ],
    cities: [
      "Ciudad de México", "Monterrey", "Guadalajara", "Puebla", "Querétaro", "Cancún", "Mérida", "Tijuana", "León"
    ]
  },
  "Chile": {
    name: "Chile",
    code: "CL",
    currencyCode: "CLP",
    currencySymbol: "$",
    currencyName: "Peso Chileno",
    flag: "🇨🇱",
    phonePrefix: "+56",
    locale: "es-CL",
    purchasingPowerIndex: 220.0,
    averageTicketExample: "$ 2.000.000 a $ 8.500.000 CLP / proyecto",
    regionsOrDistricts: [
      "Todas", "Región Metropolitana", "Valparaíso", "Biobío", "Antofagasta", "Coquimbo"
    ],
    cities: [
      "Santiago", "Valparaíso", "Viña del Mar", "Concepción", "Antofagasta", "La Serena", "Temuco", "Puerto Montt"
    ]
  },
  "Colômbia": {
    name: "Colômbia",
    code: "CO",
    currencyCode: "COP",
    currencySymbol: "$",
    currencyName: "Peso Colombiano",
    flag: "🇨🇴",
    phonePrefix: "+57",
    locale: "es-CO",
    purchasingPowerIndex: 950.0,
    averageTicketExample: "$ 9.000.000 a $ 38.000.000 COP / proyecto",
    regionsOrDistricts: [
      "Todas", "Bogotá D.C.", "Antioquia", "Valle del Cauca", "Atlántico", "Santander"
    ],
    cities: [
      "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira", "Santa Marta"
    ]
  },
  "Canadá": {
    name: "Canadá",
    code: "CA",
    currencyCode: "CAD",
    currencySymbol: "CA$",
    currencyName: "Dólar Canadense",
    flag: "🇨🇦",
    phonePrefix: "+1",
    locale: "en-CA",
    purchasingPowerIndex: 0.35,
    averageTicketExample: "CA$ 3,000 to CA$ 12,000 / project",
    regionsOrDistricts: [
      "Todas", "Ontario (ON)", "Quebec (QC)", "British Columbia (BC)", "Alberta (AB)"
    ],
    cities: [
      "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton", "Quebec City", "Winnipeg"
    ]
  },
  "Austrália": {
    name: "Austrália",
    code: "AU",
    currencyCode: "AUD",
    currencySymbol: "A$",
    currencyName: "Dólar Australiano",
    flag: "🇦🇺",
    phonePrefix: "+61",
    locale: "en-AU",
    purchasingPowerIndex: 0.36,
    averageTicketExample: "A$ 3,000 to A$ 12,500 / project",
    regionsOrDistricts: [
      "Todas", "New South Wales (NSW)", "Victoria (VIC)", "Queensland (QLD)", "Western Australia (WA)"
    ],
    cities: [
      "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra"
    ]
  },
  "Emirados Árabes": {
    name: "Emirados Árabes",
    code: "AE",
    currencyCode: "AED",
    currencySymbol: "AED",
    currencyName: "Dirham dos EAU",
    flag: "🇦🇪",
    phonePrefix: "+971",
    locale: "ar-AE",
    purchasingPowerIndex: 0.95,
    averageTicketExample: "8,000 AED to 35,000 AED / project",
    regionsOrDistricts: [
      "Todas", "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah"
    ],
    cities: [
      "Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah"
    ]
  }
};

/**
 * Retorna os dados econômicos e de moeda do país pesquisado
 */
export function getCountryProfile(countryName?: string): CountryEconomicProfile {
  if (!countryName) return COUNTRY_PROFILES["Portugal"];
  
  const clean = countryName.trim();
  if (COUNTRY_PROFILES[clean]) return COUNTRY_PROFILES[clean];

  const lower = clean.toLowerCase();
  for (const [key, profile] of Object.entries(COUNTRY_PROFILES)) {
    if (
      key.toLowerCase() === lower ||
      lower.includes(key.toLowerCase()) ||
      profile.code.toLowerCase() === lower ||
      (lower.includes('portugal') && key === 'Portugal') ||
      (lower.includes('espanha') && key === 'Espanha') ||
      (lower.includes('spain') && key === 'Espanha') ||
      (lower.includes('suíça') && key === 'Suíça') ||
      (lower.includes('suica') && key === 'Suíça') ||
      (lower.includes('switzerland') && key === 'Suíça') ||
      (lower.includes('estados unidos') && key === 'Estados Unidos') ||
      (lower.includes('usa') && key === 'Estados Unidos') ||
      (lower.includes('reino unido') && key === 'Reino Unido') ||
      (lower.includes('uk') && key === 'Reino Unido') ||
      (lower.includes('frança') && key === 'França') ||
      (lower.includes('franca') && key === 'França') ||
      (lower.includes('alemanha') && key === 'Alemanha') ||
      (lower.includes('germany') && key === 'Alemanha') ||
      (lower.includes('itália') && key === 'Itália') ||
      (lower.includes('italia') && key === 'Itália') ||
      (lower.includes('holanda') && key === 'Países Baixos') ||
      (lower.includes('países baixos') && key === 'Países Baixos')
    ) {
      return profile;
    }
  }

  return COUNTRY_PROFILES["Portugal"];
}

/**
 * Formata um valor numérico na moeda exata do país selecionado
 */
export function formatCurrencyAmount(amount: number, countryName?: string): string {
  const profile = getCountryProfile(countryName);
  try {
    return new Intl.NumberFormat(profile.locale, {
      style: 'currency',
      currency: profile.currencyCode,
      maximumFractionDigits: 0
    }).format(amount);
  } catch (e) {
    return `${profile.currencySymbol} ${amount.toLocaleString()}`;
  }
}

/**
 * Converte e localiza uma string de ticket médio para a moeda e poder de compra daquele país
 * Exemplo: Se o usuário tem no site "R$ 10.000 a R$ 35.000" e pesquisa "Portugal",
 * converte automaticamente para "€ 2.000 a € 7.500 / projeto (ou € 900/mês)"
 * Se for "Suíça", converte para "3.800 CHF a 14.000 CHF / projeto"
 */
export function localizeTicketRange(originalTicket: string, targetCountry: string): string {
  if (!originalTicket) return getCountryProfile(targetCountry).averageTicketExample;

  const profile = getCountryProfile(targetCountry);
  const multiplier = profile.purchasingPowerIndex;

  // Extrair números da string de ticket original (ex: 8000, 35000)
  const numbers = originalTicket.match(/\d[\d.,]*/g);
  
  if (!numbers || numbers.length === 0) {
    return `${profile.currencySymbol} ${originalTicket}`;
  }

  const parsedNumbers = numbers.map(n => {
    // Limpar separadores de milhar
    const cleanStr = n.replace(/\./g, '').replace(/,/g, '');
    const val = parseFloat(cleanStr);
    return isNaN(val) ? 0 : val;
  }).filter(v => v > 0);

  if (parsedNumbers.length === 0) {
    return profile.averageTicketExample;
  }

  // Se o país for o Brasil (base), manter formatação BRL
  if (profile.code === "BR") {
    if (parsedNumbers.length >= 2) {
      return `R$ ${parsedNumbers[0].toLocaleString('pt-BR')} a R$ ${parsedNumbers[1].toLocaleString('pt-BR')} / projeto`;
    }
    return `R$ ${parsedNumbers[0].toLocaleString('pt-BR')} / projeto`;
  }

  // Converte os valores para a moeda alvo
  const converted = parsedNumbers.map(val => {
    let convertedVal = Math.round(val * multiplier);
    
    // Arredondamento elegante para tickets (múltiplos de 50 ou 100)
    if (convertedVal > 1000) {
      convertedVal = Math.round(convertedVal / 100) * 100;
    } else if (convertedVal > 100) {
      convertedVal = Math.round(convertedVal / 50) * 50;
    }
    return convertedVal;
  });

  if (profile.currencyCode === 'CHF') {
    if (converted.length >= 2) {
      return `${converted[0].toLocaleString(profile.locale)} CHF a ${converted[1].toLocaleString(profile.locale)} CHF / projeto`;
    }
    return `${converted[0].toLocaleString(profile.locale)} CHF / projeto`;
  }

  if (converted.length >= 2) {
    return `${profile.currencySymbol} ${converted[0].toLocaleString(profile.locale)} a ${profile.currencySymbol} ${converted[1].toLocaleString(profile.locale)} / projeto`;
  }

  return `${profile.currencySymbol} ${converted[0].toLocaleString(profile.locale)} / projeto`;
}

/**
 * Localiza um card/nicho de alto ticket para a moeda do país selecionado
 */
export function localizeNicheRecommendation(
  niche: HighTicketNicheRecommendation, 
  countryName: string
): HighTicketNicheRecommendation {
  const profile = getCountryProfile(countryName);
  const localizedTicket = localizeTicketRange(niche.estimatedTicket, countryName);
  
  // Extrair faixa curta para a tag (ex: "🔥 € 2k-7.5k" ou "🔥 3.5k-14k CHF" ou "🔥 R$ 10k-35k")
  let tagShort = niche.tag;
  if (profile.code !== 'BR') {
    const sym = profile.currencySymbol;
    if (profile.currencyCode === 'CHF') {
      tagShort = `🔥 ${localizedTicket.split('/')[0].trim()} CHF`;
    } else if (profile.currencyCode === 'EUR') {
      tagShort = `🔥 ${sym} ${localizedTicket.replace('projeto', '').replace('/', '').trim()}`;
    } else {
      tagShort = `🔥 ${sym} ${localizedTicket.split('/')[0].trim()}`;
    }
  }

  return {
    ...niche,
    estimatedTicket: localizedTicket,
    tag: tagShort
  };
}

/**
 * Calcula e formata o valor total estimado do pipeline de leads no país atual
 */
export function calculateLocalizedPipeline(scoreACount: number, scoreBCount: number, countryName: string): string {
  const profile = getCountryProfile(countryName);
  
  // Em BRL: Score A = R$ 14.000, Score B = R$ 7.500
  // Para outros países, aplica o índice de poder de compra
  const baseValueA = 14000 * profile.purchasingPowerIndex;
  const baseValueB = 7500 * profile.purchasingPowerIndex;
  
  const totalPipeline = Math.round((scoreACount * baseValueA) + (scoreBCount * baseValueB));
  
  return formatCurrencyAmount(totalPipeline, countryName);
}
