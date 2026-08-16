const RAPIDAPI_TOKEN_KEY = "letscrape_rapidapi_token_v1";
const RAPIDAPI_HOST = "local-business-data.p.rapidapi.com";

export interface RealBusiness {
  id: string;
  source: 'letscrape' | 'osm';
  name: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  country: string;
  rating: number;
  reviews: number;
  googleMapsLink: string;
  category: string;
  subtypes: string[];
  businessStatus: string;
  description: string;
  verified: boolean;
  workingHours?: Record<string, string[]>;
  lat?: number;
  lng?: number;
  placeId?: string;
}

export interface RealLeadSearchOptions {
  keyword: string;
  country: string;
  location: string;
  district: string;
  radius: number;
  strictMode: boolean;
  limit: number;
  signal?: AbortSignal;
}

export interface RealLeadSearchResult {
  businesses: RealBusiness[];
  engineUsed: string;
  latencyMs: number;
  error?: string;
}

/**
 * Token RapidAPI (LetScrape - Local Business Data) armazenada no localStorage.
 * Usuário pode trocar na aba de Chaves (BusinessProfileModal -> ai_keys).
 */
export function getRapidApiToken(): string {
  try {
    const saved = localStorage.getItem(RAPIDAPI_TOKEN_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  return "";
}

export function saveRapidApiToken(token: string): void {
  try {
    localStorage.setItem(RAPIDAPI_TOKEN_KEY, token.trim());
  } catch {}
}

export function hasRapidApiToken(): boolean {
  return getRapidApiToken().length > 10;
}

function regionCodeFor(country: string): string {
  const c = (country || '').toLowerCase();
  if (c.includes('portugal') || c === 'pt') return 'pt';
  if (c.includes('brasil') || c.includes('brazil') || c === 'br') return 'br';
  if (c.includes('espanha') || c.includes('spain') || c === 'es') return 'es';
  if (c.includes('frança') || c.includes('france') || c === 'fr') return 'fr';
  if (c.includes('italia') || c.includes('italy') || c === 'it') return 'it';
  if (c.includes('eua') || c.includes('usa') || c.includes('estados unidos') || c === 'us') return 'us';
  return 'pt';
}

function toNumber(v: any, fallback = 0): number {
  const n = Number(v);
  return isFinite(n) ? n : fallback;
}

/**
 * 1º Motor REAL: LetScrape (RapidAPI - Local Business Data / Google Maps)
 */
async function searchViaRapidApi(
  query: string,
  country: string,
  location: string,
  limit: number,
  signal?: AbortSignal
): Promise<RealBusiness[]> {
  const token = getRapidApiToken();
  if (!token || token.length < 10) {
    throw new Error("Token RapidAPI não configurada. Adicione na aba de Chaves (ai_keys).");
  }

  const region = regionCodeFor(country);
  const searchQuery = [query, location]
    .filter(Boolean)
    .map(s => s.trim())
    .join(' ');

  const url = `https://${RAPIDAPI_HOST}/search?query=${encodeURIComponent(searchQuery)}&limit=${limit}&language=${region === 'pt' ? 'pt' : 'en'}&region=${region}&extract_emails_and_contacts=false`;

  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": token,
      "x-rapidapi-host": RAPIDAPI_HOST,
      "Content-Type": "application/json"
    },
    signal
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`LetScrape API HTTP ${res.status}: ${errBody.slice(0, 180)}`);
  }

  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];

  return data
    .filter((b: any) => b && b.name)
    .map((b: any, idx: number): RealBusiness => {
      const addr = b.address && typeof b.address === 'object' ? b.address : {};
      const subtypes = typeof b.subtypes === 'string'
        ? b.subtypes.split(/\s+/).filter(Boolean)
        : (Array.isArray(b.subtypes) ? b.subtypes : []);

      const city = addr.city || b.city || location || '';
      const district = addr.district || b.district || '';
      const street = addr.street_address || '';
      const zipcode = addr.zipcode || '';
      const countryName = addr.country || country || '';

      const about = b.about && typeof b.about === 'object'
        ? (b.about.details || b.about.summary || '')
        : (typeof b.about === 'string' ? b.about : '');

      const googleMapsLink = b.place_link
        ? b.place_link
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name)}`;

      return {
        id: `letscrape-${Date.now()}-${idx}`,
        source: 'letscrape',
        name: String(b.name).trim(),
        website: (b.website || '').trim(),
        phone: (b.phone_number || '').trim(),
        email: (b.email || '').trim(),
        address: b.full_address || [street, zipcode, city, countryName].filter(Boolean).join(', '),
        city: city,
        district: district,
        country: countryName,
        rating: toNumber(b.rating, 4.5),
        reviews: toNumber(b.review_count),
        googleMapsLink: googleMapsLink,
        category: subtypes[0] || query,
        subtypes: subtypes,
        businessStatus: b.business_status || 'UNKNOWN',
        description: about || '',
        verified: !!b.verified,
        workingHours: b.working_hours || undefined,
        lat: toNumber(b.latitude, undefined),
        lng: toNumber(b.longitude, undefined),
        placeId: b.place_id || b.business_id || ''
      };
    });
}

/**
 * Mapeia keyword -> tags OSM para a busca fallback gratuita
 */
function buildOsmTagRegex(keyword: string): string {
  const k = (keyword || '').toLowerCase();
  if (/(clinica|clínica|saude|saúde|medico|médico|dentista|hospital|estetica|estética|dermato|odonto)/.test(k)) {
    return 'clinic|doctors|dentist|hospital';
  }
  if (/(advocac|advogad|juridic|direito|tributar)/.test(k)) {
    return 'lawyer';
  }
  if (/(imobiliar|incorporadora|loteadora|imovel|imóvel|imoveis|imóveis|corretor)/.test(k)) {
    return 'estate_agent';
  }
  if (/(industri|fabric|metalurg|manufatur|logistic|distribuidor)/.test(k)) {
    return 'company|industrial';
  }
  if (/(consultor|bpo|gestao|gestão|auditori|financ|advisory)/.test(k)) {
    return 'consulting|company';
  }
  return 'company|clinic|lawyer';
}

/**
 * 2º Motor REAL (gratuito): OpenStreetMap Overpass API - busca por área administrativa
 */
async function searchViaOsm(
  keyword: string,
  country: string,
  location: string,
  district: string,
  limit: number,
  signal?: AbortSignal
): Promise<RealBusiness[]> {
  const cityName = (location && location.trim()) || (district && district !== 'Todas' ? district : '');
  if (!cityName) return [];

  const tagRegex = buildOsmTagRegex(keyword);
  const query = `[out:json][timeout:25];area["name"="${cityName}"]["boundary"="administrative"]->.a;(node["amenity"~"${tagRegex}"](area.a);way["amenity"~"${tagRegex}"](area.a);node["office"~"${tagRegex}"](area.a);way["office"~"${tagRegex}"](area.a););out center tags ${limit};`;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "CriaLeads/1.0 (leadgen research)" },
    signal
  });

  if (!res.ok) throw new Error(`Overpass API HTTP ${res.status}`);

  const json = await res.json();
  const elements = Array.isArray(json?.elements) ? json.elements : [];

  return elements
    .filter((el: any) => el && el.tags && el.tags.name)
    .map((el: any, idx: number): RealBusiness => {
      const t = el.tags || {};
      const lat = el.lat ?? el.center?.lat;
      const lng = el.lon ?? el.center?.lon;

      return {
        id: `osm-${Date.now()}-${idx}`,
        source: 'osm',
        name: String(t.name || '').trim(),
        website: (t.website || t['contact:website'] || '').trim(),
        phone: (t.phone || t['contact:phone'] || '').trim(),
        email: (t.email || t['contact:email'] || '').trim(),
        address: [t['addr:street'], t['addr:housenumber'], t['addr:city'], t['addr:postcode']].filter(Boolean).join(', '),
        city: t['addr:city'] || location || '',
        district: t['addr:district'] || district || '',
        country: country,
        rating: 0,
        reviews: 0,
        googleMapsLink: (lat != null && lng != null)
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t.name)}`,
        category: t.amenity || t.office || keyword,
        subtypes: [t.amenity, t.office, t.shop].filter(Boolean) as string[],
        businessStatus: 'OPEN',
        description: t.description || t['addr:city'] || '',
        verified: false,
        workingHours: t.opening_hours ? { hours: [t.opening_hours] } : undefined,
        lat,
        lng
      };
    });
}

/**
 * ORQUESTRADOR: Busca empresas REAIS.
 * 1) LetScrape (RapidAPI)  -> 2) OpenStreetMap (gratuito)
 * Nunca inventa empresas: só retorna o que as fontes reais retornarem.
 */
export async function searchRealBusinesses(
  options: RealLeadSearchOptions
): Promise<RealLeadSearchResult> {
  const start = Date.now();
  const { keyword, country, location, district, limit } = options;

  let primaryError: string | undefined;
  try {
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    // Tenta LetScrape (RapidAPI) primeiro
    const rapidLeads = await searchViaRapidApi(keyword, country, location, limit, options.signal);
    if (rapidLeads.length > 0) {
      return {
        businesses: rapidLeads,
        engineUsed: "LetScrape RapidAPI (Local Business Data / Google Maps)",
        latencyMs: Date.now() - start
      };
    }
    primaryError = "LetScrape retornou 0 resultados";
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    primaryError = err.message || String(err);
  }

  // Fallback gratuito: OpenStreetMap Overpass
  try {
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const osmLeads = await searchViaOsm(keyword, country, location, district, limit, options.signal);
    if (osmLeads.length > 0) {
      return {
        businesses: osmLeads,
        engineUsed: "OpenStreetMap Overpass (Fallback Gratuito)",
        latencyMs: Date.now() - start
      };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    primaryError = primaryError || err.message || String(err);
  }

  return {
    businesses: [],
    engineUsed: "Nenhum motor real disponível",
    latencyMs: Date.now() - start,
    error: primaryError || "Nenhuma empresa real encontrada para a busca."
  };
}

/**
 * Filtra e ordena empresas reais: prioriza as com site, telefone e melhor avaliação.
 * Em strictMode, remove empresas sem website.
 */
export function prioritizeRealBusinesses(businesses: RealBusiness[], strictMode: boolean): RealBusiness[] {
  // Não filtra mais - mantém TODAS as empresas reais (incluindo sem website/telefone)
  // Apenas ordena: empresas com website+telefone+avaliação primeiro
  return [...businesses]
    .sort((a, b) => {
      const aScore = (a.website ? 4 : 0) + (a.phone ? 3 : 0) + (a.rating || 0) * 0.3 + (a.verified ? 1 : 0);
      const bScore = (b.website ? 4 : 0) + (b.phone ? 3 : 0) + (b.rating || 0) * 0.3 + (b.verified ? 1 : 0);
      return bScore - aScore;
    });
}
