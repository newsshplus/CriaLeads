/**
 * Matching Engine Service
 * Cruza dados raspados do Google Maps com bases B2B (Apollo / OSINT / Bases Fiscais)
 * Utiliza Match por Domínio, Telefone Normalizado e Fuzzy String Matching (Nome + Cidade)
 */

export interface LeadMapsRaw {
  name: string;
  city: string;
  country?: string;
  website?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  photos?: string[];
  category?: string;
}

export interface LeadApolloRaw {
  companyName?: string;
  name?: string;
  city?: string;
  country?: string;
  domain?: string;
  website?: string;
  phone?: string;
  decisionMaker?: {
    name?: string;
    role?: string;
    email?: string;
    linkedin?: string;
  };
  industry?: string;
  employeeCount?: number | string;
}

export interface MatchResult {
  isMatch: boolean;
  confidenceScore: number; // 0 a 100
  matchedBy: 'domain' | 'phone' | 'fuzzy_name_city' | 'tax_id' | 'direct_maps_apollo';
  domainMatched: boolean;
  phoneNormalizedMatched: boolean;
  fuzzyNameRatio: number;
  cityExactMatch: boolean;
  notes: string;
}

/**
 * Normaliza e limpa domínios para comparação estrita
 * Ex: "https://www.clinicaalvorada.com.br/contato?ref=1" -> "clinicaalvorada.com.br"
 */
export function extractCleanDomain(urlOrDomain?: string): string {
  if (!urlOrDomain) return '';
  let clean = urlOrDomain.toLowerCase().trim();
  clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
  clean = clean.split('/')[0];
  clean = clean.split('?')[0];
  clean = clean.split('#')[0];
  clean = clean.split(':')[0]; // remove porta
  return clean;
}

/**
 * Normaliza telefones para formato internacional limpo E.164
 * Ex: "(11) 98765-4321" -> "5511987654321", "+351 912 345 678" -> "351912345678"
 */
export function normalizePhone(rawPhone?: string, country: string = 'Brasil'): string {
  if (!rawPhone) return '';
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const isPt = country.toLowerCase().includes('portugal') || country.toLowerCase().includes('pt');
  const isEs = country.toLowerCase().includes('espanha') || country.toLowerCase().includes('spain') || country.toLowerCase().includes('es');

  if (isPt) {
    if (digitsOnly.startsWith('351') && digitsOnly.length >= 12) return digitsOnly;
    if (digitsOnly.length === 9) return `351${digitsOnly}`;
    return digitsOnly;
  }

  if (isEs) {
    if (digitsOnly.startsWith('34') && digitsOnly.length >= 11) return digitsOnly;
    if (digitsOnly.length === 9) return `34${digitsOnly}`;
    return digitsOnly;
  }

  // Brasil (padrão)
  if (digitsOnly.startsWith('55') && (digitsOnly.length === 12 || digitsOnly.length === 13)) {
    return digitsOnly;
  }
  if (digitsOnly.length === 10 || digitsOnly.length === 11) {
    return `55${digitsOnly}`;
  }

  return digitsOnly;
}

/**
 * Algoritmo Levenshtein Distance & Similarity Ratio
 * Retorna valor entre 0.0 (totalmente diferente) e 1.0 (exatamente idêntico)
 */
export function calculateFuzzySimilarity(strA: string, strB: string): number {
  if (!strA || !strB) return 0;
  const s1 = strA.toLowerCase().trim().replace(/[^a-z0-9à-ÿ]/g, '');
  const s2 = strB.toLowerCase().trim().replace(/[^a-z0-9à-ÿ]/g, '');

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Se uma string contém a outra e tem tamanho relevante
  if (s1.includes(s2) && s2.length > 5) return 0.92;
  if (s2.includes(s1) && s1.length > 5) return 0.92;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));

  for (let i = 0; i <= s1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator, // substitution
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.max(0, 1 - distance / maxLength);
}

/**
 * Engine Principal de Cruzamento de Dados (Matching Key Engine)
 * Implementa exatamente a regra:
 * 1. Match por Domínio
 * 2. Match por Telefone Normalizado (+55..., +351...)
 * 3. Match por Fuzzy String (Nome + Cidade > 0.85)
 */
export function crossMatchLeadRecords(
  leadMaps: LeadMapsRaw,
  leadApollo: LeadApolloRaw,
  country: string = 'Brasil'
): MatchResult {
  const mapsDomain = extractCleanDomain(leadMaps.website);
  const apolloDomain = extractCleanDomain(leadApollo.domain || leadApollo.website);

  const mapsPhone = normalizePhone(leadMaps.phone, country);
  const apolloPhone = normalizePhone(leadApollo.phone, country);

  const mapsName = leadMaps.name || '';
  const apolloName = leadApollo.companyName || leadApollo.name || '';

  const mapsCity = (leadMaps.city || '').toLowerCase().trim();
  const apolloCity = (leadApollo.city || '').toLowerCase().trim();

  // 1. Match por Domínio
  const domainMatched = Boolean(mapsDomain && apolloDomain && mapsDomain === apolloDomain);
  if (domainMatched) {
    return {
      isMatch: true,
      confidenceScore: 98,
      matchedBy: 'domain',
      domainMatched: true,
      phoneNormalizedMatched: mapsPhone === apolloPhone && Boolean(mapsPhone),
      fuzzyNameRatio: calculateFuzzySimilarity(mapsName, apolloName),
      cityExactMatch: mapsCity === apolloCity,
      notes: `Match 100% confiável por Domínio Corporativo idêntico (${mapsDomain})`
    };
  }

  // 2. Match por Telefone Normalizado (+55..., +351...)
  const phoneMatched = Boolean(mapsPhone && apolloPhone && mapsPhone === apolloPhone && mapsPhone.length >= 8);
  if (phoneMatched) {
    return {
      isMatch: true,
      confidenceScore: 94,
      matchedBy: 'phone',
      domainMatched: false,
      phoneNormalizedMatched: true,
      fuzzyNameRatio: calculateFuzzySimilarity(mapsName, apolloName),
      cityExactMatch: mapsCity === apolloCity,
      notes: `Match de alta precisão por Telefone Normalizado (${mapsPhone})`
    };
  }

  // 3. Match por Fuzzy String (Nome + Cidade)
  const fuzzyScore = calculateFuzzySimilarity(mapsName, apolloName);
  const cityMatch = !mapsCity || !apolloCity || mapsCity === apolloCity || mapsCity.includes(apolloCity) || apolloCity.includes(mapsCity);

  if (fuzzyScore >= 0.85 && cityMatch) {
    return {
      isMatch: true,
      confidenceScore: Math.round(fuzzyScore * 90),
      matchedBy: 'fuzzy_name_city',
      domainMatched: false,
      phoneNormalizedMatched: false,
      fuzzyNameRatio: fuzzyScore,
      cityExactMatch: cityMatch,
      notes: `Match por Similaridade de Nome (${(fuzzyScore * 100).toFixed(0)}%) e Cidade alinhada (${leadMaps.city})`
    };
  }

  // Se não atingir o threshold mínimo
  return {
    isMatch: false,
    confidenceScore: Math.round(fuzzyScore * 50),
    matchedBy: 'direct_maps_apollo',
    domainMatched: false,
    phoneNormalizedMatched: false,
    fuzzyNameRatio: fuzzyScore,
    cityExactMatch: cityMatch,
    notes: 'Registros divergentes (Domínio/Telefone/Similaridade abaixo do limiar de 85%)'
  };
}
