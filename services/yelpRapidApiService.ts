/**
 * Serviço de Integração com a RapidAPI Yelp Business Reviews
 * Endpoint: GET https://yelp-business-reviews.p.rapidapi.com/search?sortBy=recommended&page=1&location=...&query=...
 * Header: x-rapidapi-host: yelp-business-reviews.p.rapidapi.com
 */

import { DEFAULT_RAPIDAPI_KEYS } from "../constants";

export const YELP_RAPIDAPI_HOST = "yelp-business-reviews.p.rapidapi.com";

export interface YelpBusinessResult {
  bizId: string;
  name: string;
  alias?: string;
  rating?: number;
  reviewCount?: number;
  categories?: string[];
  priceRange?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lon?: number;
  images?: string[];
  website?: string;
}

export interface YelpSearchResponse {
  resultCount: number;
  currentPage: number;
  totalPages: number;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  results: YelpBusinessResult[];
}

/**
 * Obtém a chave configurada para o Yelp (Slot 3 do pool)
 */
export function getYelpApiKey(): string {
  if (typeof window === 'undefined') return DEFAULT_RAPIDAPI_KEYS[2] || DEFAULT_RAPIDAPI_KEYS[0];
  try {
    const raw = localStorage.getItem('sdr_ai_engine_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.rapidApiKeys) && parsed.rapidApiKeys[2]?.trim()) {
        return parsed.rapidApiKeys[2].trim();
      }
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_RAPIDAPI_KEYS[2] || "217aaf9c57mshbeccc815a9fea34p1f3f39jsn47f97de18757";
}

/**
 * Testa a chave RapidAPI do Yelp em tempo real
 */
export async function testYelpApiKey(key: string): Promise<{ ok: boolean; latencyMs: number; error?: string; message?: string }> {
  if (!key || key.trim().length < 8) {
    return { ok: false, latencyMs: 0, error: "Chave RapidAPI Yelp vazia ou muito curta." };
  }

  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://${YELP_RAPIDAPI_HOST}/search?sortBy=recommended&page=1&location=${encodeURIComponent("Lisbon")}&query=${encodeURIComponent("Restaurant")}`;
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "x-rapidapi-host": YELP_RAPIDAPI_HOST,
        "x-rapidapi-key": key.trim()
      }
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        latencyMs: latency,
        error: `HTTP ${res.status}: ${errText.slice(0, 150) || res.statusText}`
      };
    }

    const data: YelpSearchResponse = await res.json().catch(() => ({ resultCount: 0, results: [] } as any));
    const count = data?.results?.length || data?.resultCount || 0;

    return {
      ok: true,
      latencyMs: latency,
      message: `Yelp Business Reviews Conectado (${latency}ms)! ${count} empresas verificadas disponíveis.`
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Tempo limite esgotado (>10s).' : (err.message || 'Falha ao conectar no Yelp Business Reviews')
    };
  }
}

/**
 * Busca estabelecimentos e empresas no Yelp
 */
export async function searchYelpBusinesses(queryText: string, locationText: string, explicitKey?: string): Promise<YelpBusinessResult[]> {
  const key = explicitKey?.trim() || getYelpApiKey();
  if (!key) return [];

  const loc = locationText || "Lisboa";
  const q = queryText || "Serviços";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const url = `https://${YELP_RAPIDAPI_HOST}/search?sortBy=recommended&page=1&location=${encodeURIComponent(loc)}&query=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "x-rapidapi-host": YELP_RAPIDAPI_HOST,
        "x-rapidapi-key": key
      }
    });

    clearTimeout(timeoutId);
    if (!res.ok) return [];

    const data: YelpSearchResponse = await res.json();
    return Array.isArray(data?.results) ? data.results : [];
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}
