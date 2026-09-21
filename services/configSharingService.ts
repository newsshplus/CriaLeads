import { AiEngineConfig, BusinessProfile, CriahubCrmConfig, CustomPromptsConfig } from "../types";
import { getAiConfig, saveAiConfig } from "./aiProviderService";
import { getApolloApiKey, saveApolloApiKey } from "./apolloService";
import { getRapidApiKeysPool, saveRapidApiKeysPool, getRapidApiRotationMode, saveRapidApiRotationMode } from "./letscrapeService";
import { getCustomPrompts, saveCustomPrompts } from "./promptConfigService";
import { getSavedBusinessProfile, saveBusinessProfile, clearAllActiveProspectingData } from "./storageService";
import { getCriahubCrmConfig, saveCriahubCrmConfig } from "./criahubCrmService";

export interface SharedWorkspaceConfig {
  version: number;
  timestamp: string;
  label?: string;
  // AI & Scraper APIs
  groqKeys?: string[];
  groqModel?: string;
  apolloApiKey?: string;
  rapidApiKeys?: string[];
  rapidApiRotationMode?: 'sequential' | 'fallback' | 'round-robin';
  customGeminiApiKey?: string;
  geminiModel?: string;
  supervisorAiEnabled?: boolean;
  supervisorModel?: string;
  temperature?: number;
  useGroundingTools?: boolean;
  // Prompts
  prompts?: Partial<CustomPromptsConfig>;
  // Business Profile
  businessProfile?: Partial<BusinessProfile>;
  // CRM / Dispatches
  criahubCrm?: Partial<CriahubCrmConfig>;
}

// UTF-8 Safe Base64 Helpers
function safeBtoa(str: string): string {
  try {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    )
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error("Base64 encode error:", e);
    return "";
  }
}

function safeAtob(b64: string): string {
  try {
    let str = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    const binary = atob(str);
    return decodeURIComponent(
      Array.from(binary)
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  } catch (e) {
    console.error("Base64 decode error:", e);
    return "";
  }
}

/**
 * Exporta a configuração atual completa do usuário em um objeto estruturado
 */
export function exportCurrentWorkspaceConfig(options?: {
  includeGroq?: boolean;
  includeApollo?: boolean;
  includeRapid?: boolean;
  includeGemini?: boolean;
  includePrompts?: boolean;
  includeProfile?: boolean;
  includeCrm?: boolean;
}): SharedWorkspaceConfig {
  const ai = getAiConfig();
  const apollo = getApolloApiKey();
  const rapidPool = getRapidApiKeysPool();
  const rapidMode = getRapidApiRotationMode();
  const prompts = getCustomPrompts();
  const profile = getSavedBusinessProfile();
  const crm = getCriahubCrmConfig();

  const includeGroq = options?.includeGroq !== false;
  const includeApollo = options?.includeApollo !== false;
  const includeRapid = options?.includeRapid !== false;
  const includeGemini = options?.includeGemini !== false;
  const includePrompts = options?.includePrompts !== false;
  const includeProfile = options?.includeProfile !== false;
  const includeCrm = options?.includeCrm !== false;

  const validGroqKeys = (ai.groqKeys || []).filter(k => k && k.trim());
  const validRapidKeys = (rapidPool || []).filter(k => k && k.trim());

  return {
    version: 2,
    timestamp: new Date().toISOString(),
    label: 'Configuração Sincronizada de APIs & IA',
    groqKeys: includeGroq && validGroqKeys.length > 0 ? validGroqKeys : undefined,
    groqModel: ai.groqModel,
    apolloApiKey: includeApollo && apollo && apollo.trim() ? apollo.trim() : undefined,
    rapidApiKeys: includeRapid && validRapidKeys.length > 0 ? validRapidKeys : undefined,
    rapidApiRotationMode: rapidMode,
    customGeminiApiKey: includeGemini && ai.customGeminiApiKey && ai.customGeminiApiKey.trim() ? ai.customGeminiApiKey.trim() : undefined,
    geminiModel: ai.geminiModel,
    supervisorAiEnabled: ai.supervisorAiEnabled,
    supervisorModel: ai.supervisorModel,
    temperature: ai.temperature,
    useGroundingTools: ai.useGroundingTools,
    prompts: includePrompts ? prompts : undefined,
    businessProfile: includeProfile ? profile : undefined,
    criahubCrm: includeCrm ? crm : undefined,
  };
}

/**
 * Codifica o objeto em token string seguro para URL
 */
export function encodeConfigToken(config: SharedWorkspaceConfig): string {
  try {
    const json = JSON.stringify(config);
    return safeBtoa(json);
  } catch (e) {
    console.error("Erro ao codificar token de configuração:", e);
    return "";
  }
}

/**
 * Decodifica o token string seguro de volta para objeto
 */
export function decodeConfigToken(token: string): Partial<SharedWorkspaceConfig> | null {
  try {
    const json = safeAtob(token.trim());
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
    return null;
  } catch (e) {
    console.error("Erro ao decodificar token de configuração:", e);
    return null;
  }
}

/**
 * Importa e grava todas as chaves e configurações no storage do navegador atual
 */
export function importWorkspaceConfig(config: Partial<SharedWorkspaceConfig>): {
  success: boolean;
  importedItems: string[];
  count: number;
} {
  const importedItems: string[] = [];

  try {
    const currentAi = getAiConfig();

    let updatedAi: AiEngineConfig = { ...currentAi };

    // 1. Groq Keys
    if (Array.isArray(config.groqKeys) && config.groqKeys.length > 0) {
      const keys = config.groqKeys.filter(k => typeof k === 'string' && k.trim());
      if (keys.length > 0) {
        updatedAi.groqKeys = [
          keys[0] || "",
          keys[1] || "",
          keys[2] || ""
        ];
        importedItems.push(`Groq (${keys.length} chave${keys.length > 1 ? 's' : ''})`);
      }
    }

    if (config.groqModel) {
      updatedAi.groqModel = config.groqModel;
    }

    if (typeof config.supervisorAiEnabled === 'boolean') {
      updatedAi.supervisorAiEnabled = config.supervisorAiEnabled;
    }

    if (config.supervisorModel) {
      updatedAi.supervisorModel = config.supervisorModel;
    }

    if (typeof config.temperature === 'number') {
      updatedAi.temperature = config.temperature;
    }

    // 2. Apollo API Key
    if (config.apolloApiKey && typeof config.apolloApiKey === 'string' && config.apolloApiKey.trim()) {
      saveApolloApiKey(config.apolloApiKey.trim());
      updatedAi.apolloApiKey = config.apolloApiKey.trim();
      importedItems.push('Apollo.io API Key');
    }

    // 3. RapidAPI Keys
    if (Array.isArray(config.rapidApiKeys) && config.rapidApiKeys.length > 0) {
      const rapidKeys = config.rapidApiKeys.filter(k => typeof k === 'string' && k.trim());
      if (rapidKeys.length > 0) {
        const pool: [string, string, string] = [
          rapidKeys[0] || "",
          rapidKeys[1] || "",
          rapidKeys[2] || ""
        ];
        saveRapidApiKeysPool(pool);
        updatedAi.rapidApiKeys = pool;
        importedItems.push(`RapidAPI Google Maps (${rapidKeys.length} chave${rapidKeys.length > 1 ? 's' : ''})`);
      }
    }

    if (config.rapidApiRotationMode) {
      saveRapidApiRotationMode(config.rapidApiRotationMode);
      updatedAi.rapidApiRotationMode = config.rapidApiRotationMode;
    }

    // 4. Gemini API Key
    if (config.customGeminiApiKey && typeof config.customGeminiApiKey === 'string' && config.customGeminiApiKey.trim()) {
      updatedAi.customGeminiApiKey = config.customGeminiApiKey.trim();
      importedItems.push('Gemini AI API Key');
    }

    if (config.geminiModel) {
      updatedAi.geminiModel = config.geminiModel;
    }

    if (typeof config.useGroundingTools === 'boolean') {
      updatedAi.useGroundingTools = config.useGroundingTools;
    }

    // Save consolidated AI Config
    saveAiConfig(updatedAi);

    // 5. Prompts
    if (config.prompts && typeof config.prompts === 'object') {
      const currentPrompts = getCustomPrompts();
      saveCustomPrompts({
        enrichmentSystemPrompt: config.prompts.enrichmentSystemPrompt || currentPrompts.enrichmentSystemPrompt,
        supervisorSystemPrompt: config.prompts.supervisorSystemPrompt || currentPrompts.supervisorSystemPrompt,
        copywriterPrompt: config.prompts.copywriterPrompt || currentPrompts.copywriterPrompt,
      });
      importedItems.push('Prompts Customizados');
    }

    // 6. Business Profile
    if (config.businessProfile && typeof config.businessProfile === 'object') {
      const currentProfile = getSavedBusinessProfile();
      saveBusinessProfile({
        ...currentProfile,
        ...config.businessProfile
      });
      importedItems.push('Perfil da Empresa & Nichos');
    }

    // 7. Criahub CRM & Dispatches
    if (config.criahubCrm && typeof config.criahubCrm === 'object') {
      saveCriahubCrmConfig(config.criahubCrm);
      importedItems.push('Canais de Disparo & Webhook');
    }

    return {
      success: importedItems.length > 0,
      importedItems,
      count: importedItems.length
    };
  } catch (e) {
    console.error("Erro ao importar configuração:", e);
    return {
      success: false,
      importedItems,
      count: 0
    };
  }
}

/**
 * Gera URL compartilhável com todos os parâmetros ou token de autenticação
 * Por padrão, inclui clean=1 para garantir que quem receber o link inicie em um ambiente limpo
 * sem conter leads, lotes ou pesquisas ativas salvas.
 */
export function generateShareableLink(params?: {
  config?: SharedWorkspaceConfig;
  country?: string;
  city?: string;
  niche?: string;
  tenant?: string;
  embed?: boolean;
  hideHeader?: boolean;
  clean?: boolean; // Padrão: true (não compartilha leads/lotes salvos)
  mode?: 'token' | 'query' | 'embed';
}): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const base = `${origin}${path}`;
  const searchParams = new URLSearchParams();

  const cfg = params?.config || exportCurrentWorkspaceConfig();
  const mode = params?.mode || 'token';

  // Por segurança e privacidade estrita, o link compartilhado força inicialização limpa (sem dados ativos residuais)
  if (params?.clean !== false) {
    searchParams.set('clean', '1');
  }

  if (params?.country) searchParams.set('country', params.country);
  if (params?.city) searchParams.set('city', params.city);
  if (params?.niche) searchParams.set('niche', params.niche);
  if (params?.tenant) searchParams.set('tenant', params.tenant);
  if (params?.embed) searchParams.set('embed', 'true');
  if (params?.hideHeader) searchParams.set('hideHeader', 'true');

  if (mode === 'token' || mode === 'embed') {
    const token = encodeConfigToken(cfg);
    if (token) {
      searchParams.set('cfg', token);
    }
  } else if (mode === 'query') {
    // Parâmetros explícitos legíveis
    if (cfg.groqKeys?.[0]) searchParams.set('groq_key', cfg.groqKeys[0]);
    if (cfg.apolloApiKey) searchParams.set('apollo_key', cfg.apolloApiKey);
    if (cfg.rapidApiKeys?.[0]) searchParams.set('rapid_key', cfg.rapidApiKeys[0]);
    if (cfg.customGeminiApiKey) searchParams.set('gemini_key', cfg.customGeminiApiKey);
  }

  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Detecta e hidrata credenciais passadas via URL na inicialização do App
 * Também executa limpeza de dados ativos caso solicitado (?clean=1 ou ?clean=true ou ?fresh=1)
 */
export function autoHydrateFromUrl(): {
  hydrated: boolean;
  importedItems: string[];
  cleanRequested: boolean;
} {
  if (typeof window === 'undefined') {
    return { hydrated: false, importedItems: [], cleanRequested: false };
  }

  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
    const hash = window.location.hash;

    // Detecta solicitação de limpeza de dados ativos (?clean=1 ou ?clean=true ou ?fresh=1)
    const isCleanParam = searchParams.get('clean') === '1' || searchParams.get('clean') === 'true' || searchParams.get('fresh') === '1';
    if (isCleanParam) {
      clearAllActiveProspectingData();
      searchParams.delete('clean');
      searchParams.delete('fresh');
      const cleanSearch = searchParams.toString();
      const newUrl = `${url.pathname}${cleanSearch ? '?' + cleanSearch : ''}`;
      window.history.replaceState({}, document.title, newUrl);
    }

    let configToImport: Partial<SharedWorkspaceConfig> | null = null;

    // 1. Check for token in search params (?cfg=...)
    const cfgParam = searchParams.get('cfg') || searchParams.get('config') || searchParams.get('auth_token');
    if (cfgParam) {
      configToImport = decodeConfigToken(cfgParam);
    }

    // 2. Check for token in hash (#config=... or #cfg=...)
    if (!configToImport && hash) {
      const cleanHash = hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(cleanHash);
      const hashToken = hashParams.get('config') || hashParams.get('cfg');
      if (hashToken) {
        configToImport = decodeConfigToken(hashToken);
      } else if (cleanHash.length > 20 && !cleanHash.includes('=')) {
        // Direct hash token
        configToImport = decodeConfigToken(cleanHash);
      }
    }

    // 3. Check for direct query parameters (?groq_key=...&apollo_key=...)
    const groqKeyParam = searchParams.get('groq_key') || searchParams.get('groq');
    const apolloKeyParam = searchParams.get('apollo_key') || searchParams.get('apollo');
    const rapidKeyParam = searchParams.get('rapid_key') || searchParams.get('rapidapi_key') || searchParams.get('rapidapi');
    const geminiKeyParam = searchParams.get('gemini_key') || searchParams.get('gemini');

    if (groqKeyParam || apolloKeyParam || rapidKeyParam || geminiKeyParam) {
      configToImport = {
        ...(configToImport || {}),
        groqKeys: groqKeyParam ? [groqKeyParam] : configToImport?.groqKeys,
        apolloApiKey: apolloKeyParam || configToImport?.apolloApiKey,
        rapidApiKeys: rapidKeyParam ? [rapidKeyParam] : configToImport?.rapidApiKeys,
        customGeminiApiKey: geminiKeyParam || configToImport?.customGeminiApiKey,
      };
    }

    if (configToImport) {
      const result = importWorkspaceConfig(configToImport);
      if (result.success) {
        // Limpa silenciosamente os parâmetros de credenciais da URL para proteção sem recarregar
        searchParams.delete('cfg');
        searchParams.delete('config');
        searchParams.delete('auth_token');
        searchParams.delete('groq_key');
        searchParams.delete('groq');
        searchParams.delete('apollo_key');
        searchParams.delete('apollo');
        searchParams.delete('rapid_key');
        searchParams.delete('rapidapi_key');
        searchParams.delete('rapidapi');
        searchParams.delete('gemini_key');
        searchParams.delete('gemini');

        const cleanSearch = searchParams.toString();
        const newUrl = `${url.pathname}${cleanSearch ? '?' + cleanSearch : ''}`;
        window.history.replaceState({}, document.title, newUrl);

        return {
          hydrated: true,
          importedItems: result.importedItems,
          cleanRequested: isCleanParam
        };
      }
    }

    return {
      hydrated: false,
      importedItems: [],
      cleanRequested: isCleanParam
    };
  } catch (e) {
    console.error("Erro na auto-hidratação de configuração pela URL:", e);
  }

  return { hydrated: false, importedItems: [], cleanRequested: false };
}

/**
 * Faz download do arquivo de backup de configuração (.json)
 */
export function downloadWorkspaceConfigJson(config?: SharedWorkspaceConfig): void {
  try {
    const cfg = config || exportCurrentWorkspaceConfig();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cfg, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `criahub_workspace_apis_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (e) {
    console.error("Erro ao baixar backup:", e);
  }
}

/**
 * Lê e importa arquivo de backup JSON carregado pelo usuário
 */
export async function importConfigFromJsonFile(file: File): Promise<{
  success: boolean;
  importedItems: string[];
  error?: string;
}> {
  return new Promise((resolve) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          if (!content) {
            resolve({ success: false, importedItems: [], error: 'Arquivo vazio' });
            return;
          }
          const parsed = JSON.parse(content);
          const result = importWorkspaceConfig(parsed);
          resolve({
            success: result.success,
            importedItems: result.importedItems,
            error: result.success ? undefined : 'Nenhuma chave válida encontrada no arquivo'
          });
        } catch (err) {
          resolve({ success: false, importedItems: [], error: 'Formato JSON inválido' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, importedItems: [], error: 'Falha ao ler arquivo' });
      };
      reader.readAsText(file);
    } catch (e) {
      resolve({ success: false, importedItems: [], error: 'Erro inesperado' });
    }
  });
}
