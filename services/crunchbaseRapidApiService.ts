/**
 * Serviço de Integração com a RapidAPI Crunchbase 4
 * Endpoint: POST https://crunchbase4.p.rapidapi.com/company
 * Header: x-rapidapi-host: crunchbase4.p.rapidapi.com
 */

import { DEFAULT_RAPIDAPI_KEYS } from "../constants";

export const CRUNCHBASE_RAPIDAPI_HOST = "crunchbase4.p.rapidapi.com";

export interface CrunchbaseCompanyData {
  about?: string | null;
  founded_year?: number | null;
  funding?: string | null;
  industries?: string[] | string | null;
  location?: string | null;
  long_description?: string | null;
  employees_count?: string | null;
  website?: string | null;
  name?: string | null;
}

/**
 * Obtém a chave configurada para o Crunchbase (Slot 2 do pool)
 */
export function getCrunchbaseApiKey(): string {
  if (typeof window === 'undefined') return DEFAULT_RAPIDAPI_KEYS[1] || DEFAULT_RAPIDAPI_KEYS[0];
  try {
    const raw = localStorage.getItem('sdr_ai_engine_config');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.rapidApiKeys) && parsed.rapidApiKeys[1]?.trim()) {
        return parsed.rapidApiKeys[1].trim();
      }
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_RAPIDAPI_KEYS[1] || "217aaf9c57mshbeccc815a9fea34p1f3f39jsn47f97de18757";
}

/**
 * Limpa o domínio a partir de uma URL ou string
 */
export function extractCleanDomain(rawUrlOrDomain: string): string {
  if (!rawUrlOrDomain) return "";
  let d = rawUrlOrDomain.trim().toLowerCase();
  try {
    if (!d.startsWith('http://') && !d.startsWith('https://')) {
      d = 'https://' + d;
    }
    const urlObj = new URL(d);
    let hostname = urlObj.hostname;
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch {
    return rawUrlOrDomain.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].trim();
  }
}

/**
 * Testa a chave de API do Crunchbase em tempo real
 */
export async function testCrunchbaseApiKey(key: string): Promise<{ ok: boolean; latencyMs: number; error?: string; message?: string }> {
  if (!key || key.trim().length < 8) {
    return { ok: false, latencyMs: 0, error: "Chave RapidAPI Crunchbase vazia ou muito curta." };
  }

  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch("https://crunchbase4.p.rapidapi.com/company", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": CRUNCHBASE_RAPIDAPI_HOST,
        "x-rapidapi-key": key.trim()
      },
      body: JSON.stringify({ company_domain: "apple.com" })
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

    const data = await res.json().catch(() => ({}));
    const hasCompany = Boolean(data && (data.company || data.name || data.about));

    return {
      ok: true,
      latencyMs: latency,
      message: `Crunchbase 4 Conectado com Sucesso (${latency}ms)! Dados de inteligência B2B ativos.`
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err.name === 'AbortError' ? 'Tempo limite esgotado (>12s).' : (err.message || 'Falha ao conectar no Crunchbase')
    };
  }
}

/**
 * Consulta dados enriquecidos de uma empresa pelo domínio
 */
export async function fetchCrunchbaseCompany(domainOrUrl: string, explicitKey?: string): Promise<CrunchbaseCompanyData | null> {
  const domain = extractCleanDomain(domainOrUrl);
  if (!domain || domain.includes('google.com') || domain.includes('facebook.com') || domain.includes('instagram.com')) {
    return null;
  }

  const key = explicitKey?.trim() || getCrunchbaseApiKey();
  if (!key) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch("https://crunchbase4.p.rapidapi.com/company", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-host": CRUNCHBASE_RAPIDAPI_HOST,
        "x-rapidapi-key": key
      },
      body: JSON.stringify({ company_domain: domain })
    });

    clearTimeout(timeoutId);
    if (!res.ok) return null;

    const json = await res.json();
    const c = json?.company || json;
    if (!c || (!c.about && !c.long_description && !c.funding)) return null;

    return {
      about: c.about || null,
      founded_year: c.founded_year ? Number(c.founded_year) : null,
      funding: c.funding || null,
      industries: c.industries || null,
      location: c.location || null,
      long_description: c.long_description || null,
      employees_count: c.employees_count || c.num_employees || null,
      website: domain,
      name: c.name || null
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
