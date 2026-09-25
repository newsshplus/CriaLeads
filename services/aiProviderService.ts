import { GoogleGenAI } from "@google/genai";
import { AiEngineConfig, BusinessProfile, GroqKeyStatus, GeminiKeyStatus, RapidApiKeyStatus, HighTicketNicheRecommendation } from "../types";
import { DEFAULT_AI_ENGINE_CONFIG, DEFAULT_HIGH_TICKET_NICHES, DEFAULT_RAPIDAPI_KEYS } from "../constants";
import { getSavedCountry, getCurrencyConfig } from "./countryService";
import { getRapidApiKeysPool, saveRapidApiKeysPool, getRapidApiRotationMode, saveRapidApiRotationMode, getActiveRapidApiKeyIndex, setActiveRapidApiKeyIndex } from "./letscrapeService";
import { getCustomPrompts, saveCustomPrompts } from "./promptConfigService";

const AI_CONFIG_KEY = "architect_ai_engine_config_v2";

/**
 * Storage Helpers for AI Config
 */
export function getAiConfig(): AiEngineConfig {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(AI_CONFIG_KEY) : null;
    const customPrompts = getCustomPrompts();
    const rapidKeys = getRapidApiKeysPool();
    const rapidMode = getRapidApiRotationMode();
    const rapidIdx = getActiveRapidApiKeyIndex();

    if (!raw) {
      return {
        ...DEFAULT_AI_ENGINE_CONFIG,
        rapidApiKeys: rapidKeys,
        rapidApiRotationMode: rapidMode,
        activeRapidApiKeyIndex: rapidIdx,
        customPrompts
      };
    }
    const parsed = JSON.parse(raw);
    
    // Auto-migra modelos descontinuados pelo Groq para o modelo recomendado
    let groqModel = parsed.groqModel || DEFAULT_AI_ENGINE_CONFIG.groqModel;
    if (groqModel === 'llama-3.1-70b-versatile' || groqModel === 'mixtral-8x7b-32768' || groqModel.includes('mixtral')) {
      groqModel = 'llama-3.3-70b-versatile';
    }

    let supervisorModel = parsed.supervisorModel || DEFAULT_AI_ENGINE_CONFIG.supervisorModel;
    if (supervisorModel === 'llama-3.1-70b-versatile' || supervisorModel === 'mixtral-8x7b-32768' || supervisorModel.includes('mixtral')) {
      supervisorModel = 'llama-3.3-70b-versatile';
    }

    // Auto-migra modelos de Gemini para versões suportadas no @google/genai
    let geminiModel = parsed.geminiModel || DEFAULT_AI_ENGINE_CONFIG.geminiModel;
    if (!geminiModel || geminiModel === 'gemini-3.6-flash' || geminiModel === 'gemini-3.5-flash' || geminiModel.includes('1.5') || geminiModel.includes('2.0') || geminiModel.includes('3.6')) {
      geminiModel = 'gemini-3.7-flash';
    }

    return {
      ...DEFAULT_AI_ENGINE_CONFIG,
      ...parsed,
      groqModel,
      groqKeys: Array.isArray(parsed.groqKeys) ? [parsed.groqKeys[0] || "", parsed.groqKeys[1] || "", parsed.groqKeys[2] || ""] : ["", "", ""],
      keyStatuses: Array.isArray(parsed.keyStatuses) ? parsed.keyStatuses : DEFAULT_AI_ENGINE_CONFIG.keyStatuses,
      rapidApiKeys: Array.isArray(parsed.rapidApiKeys) && parsed.rapidApiKeys.length >= 3 ? parsed.rapidApiKeys : rapidKeys,
      rapidApiRotationMode: parsed.rapidApiRotationMode || rapidMode,
      activeRapidApiKeyIndex: typeof parsed.activeRapidApiKeyIndex === 'number' ? parsed.activeRapidApiKeyIndex : rapidIdx,
      rapidApiKeyStatuses: Array.isArray(parsed.rapidApiKeyStatuses) ? parsed.rapidApiKeyStatuses : DEFAULT_AI_ENGINE_CONFIG.rapidApiKeyStatuses,
      supervisorAiEnabled: parsed.supervisorAiEnabled !== false,
      supervisorModel,
      customPrompts: parsed.customPrompts || customPrompts,
      customGeminiApiKey: parsed.customGeminiApiKey || "",
      geminiKeyStatus: parsed.geminiKeyStatus || { status: 'UNTESTED' },
      useGroundingTools: parsed.useGroundingTools || false,
      geminiModel
    };
  } catch (e) {
    console.error("Failed to load AI config from storage", e);
    return DEFAULT_AI_ENGINE_CONFIG;
  }
}

export function saveAiConfig(config: AiEngineConfig): void {
  try {
    // Generate key statuses previews
    const updatedStatuses: GroqKeyStatus[] = config.groqKeys.map((k, idx) => {
      const prev = config.keyStatuses?.[idx];
      const trimmed = k.trim();
      const preview = trimmed.length > 8 ? `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}` : trimmed ? 'Chave curta' : 'Não configurada';
      return {
        index: idx,
        keyPreview: preview,
        status: trimmed ? (prev?.status || 'UNTESTED') : 'UNTESTED',
        lastUsed: prev?.lastUsed,
        requestsCount: prev?.requestsCount || 0,
        errorMessage: prev?.errorMessage
      };
    });

    const updatedRapidStatuses: RapidApiKeyStatus[] = (config.rapidApiKeys || DEFAULT_RAPIDAPI_KEYS).map((k, idx) => {
      const prev = config.rapidApiKeyStatuses?.[idx];
      const trimmed = (k || '').trim();
      const preview = trimmed.length > 8 ? `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}` : trimmed ? 'Chave curta' : 'Não configurada';
      return {
        index: idx,
        keyPreview: preview,
        status: trimmed ? (prev?.status || 'VALID') : 'UNTESTED',
        lastUsed: prev?.lastUsed,
        errorMessage: prev?.errorMessage,
        latencyMs: prev?.latencyMs
      };
    });

    const toSave: AiEngineConfig = {
      ...config,
      keyStatuses: updatedStatuses,
      rapidApiKeyStatuses: updatedRapidStatuses
    };

    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(toSave));

    // Sync sub-stores
    if (config.rapidApiKeys) {
      saveRapidApiKeysPool(config.rapidApiKeys);
    }
    if (config.rapidApiRotationMode) {
      saveRapidApiRotationMode(config.rapidApiRotationMode);
    }
    if (typeof config.activeRapidApiKeyIndex === 'number') {
      setActiveRapidApiKeyIndex(config.activeRapidApiKeyIndex);
    }
    if (config.customPrompts) {
      saveCustomPrompts(config.customPrompts);
    }
  } catch (e) {
    console.error("Failed to save AI config", e);
  }
}

/**
 * Helper to get a GoogleGenAI instance with the active key (Custom or Env)
 */
export function getGeminiClient(customKey?: string): GoogleGenAI {
  const config = getAiConfig();
  const envKey = (typeof process !== 'undefined' && process.env) ? (process.env.API_KEY || process.env.GEMINI_API_KEY) : undefined;
  const keyToUse = customKey?.trim() || config.customGeminiApiKey?.trim() || envKey || "";
  return new GoogleGenAI({ apiKey: keyToUse });
}

/**
 * Test a Gemini API Key (100% Free Key from Google AI Studio)
 */
export async function testGeminiApiKey(key: string, model?: string): Promise<{ success: boolean; latencyMs: number; error?: string }> {
  if (!key || !key.trim()) {
    return { success: false, latencyMs: 0, error: "Chave do Gemini vazia. Obtenha uma chave gratuita em aistudio.google.com" };
  }

  const start = Date.now();
  const activeModel = model || getAiConfig().geminiModel || 'gemini-3.7-flash';
  try {
    const testAi = new GoogleGenAI({ apiKey: key.trim() });
    const res = await Promise.race([
      testAi.models.generateContent({
        model: activeModel,
        contents: "Responda apenas: OK",
        config: {
          temperature: 0.1
        }
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Tempo limite de 15s excedido no teste do Gemini.")), 15000))
    ]);

    const latencyMs = Date.now() - start;
    if (res && res.text) {
      return { success: true, latencyMs };
    }
    return { success: true, latencyMs };
  } catch (e: any) {
    const latencyMs = Date.now() - start;
    const msg = e.message || "Erro desconhecido ao testar chave do Gemini.";
    if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
      return { 
        success: false, 
        latencyMs, 
        error: "Permissão negada (403). Verifique se a chave do Google AI Studio está correta ou gere uma nova gratuitamente em aistudio.google.com/app/apikey" 
      };
    }
    return { success: false, latencyMs, error: msg };
  }
}

export const GROQ_CANDIDATE_MODELS = [
  "llama-3.3-70b-versatile",
  "groq/compound",
  "groq/compound-mini",
  "llama-3.1-8b-instant",
  "deepseek-r1-distill-llama-70b",
  "llama3-70b-8192",
  "llama3-8b-8192",
  "gemma2-9b-it",
  "qwen-2.5-32b",
  "qwen-qwq-32b"
];

/**
 * Consulta a API do Groq ao vivo para listar todos os modelos ativos disponíveis na conta
 */
export async function fetchGroqAvailableModels(key: string): Promise<Array<{ id: string; label: string; note?: string }>> {
  if (!key || !key.trim()) return [];
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key.trim()}`
      }
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.data)) {
      return data.data
        .filter((m: any) => m.active !== false && !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('guard'))
        .map((m: any) => ({
          id: m.id,
          label: m.id === "llama-3.3-70b-versatile" 
            ? "Llama 3.3 70B Versatile (Recomendado)"
            : m.id === "groq/compound" 
            ? "GroqCompound (450 T/s - Sistema Composto)" 
            : m.id === "groq/compound-mini" 
            ? "GroqCompound Mini (450 T/s - Leve)"
            : m.id === "deepseek-r1-distill-llama-70b"
            ? "DeepSeek R1 Distill 70B (Raciocínio)"
            : m.id,
          note: m.owned_by ? `Proprietário: ${m.owned_by} • Contexto: ${m.context_window ? Math.round(m.context_window / 1024) + 'k' : '128k'}` : 'Ativo e Gratuito no Groq'
        }))
        .sort((a: any, b: any) => {
          if (a.id.includes('3.3-70b')) return -1;
          if (b.id.includes('3.3-70b')) return 1;
          if (a.id.includes('compound')) return -1;
          if (b.id.includes('compound')) return 1;
          return a.id.localeCompare(b.id);
        });
    }
  } catch (e) {
    console.warn("Não foi possível listar modelos dinâmicos do Groq:", e);
  }
  return [];
}

/**
 * Test a single Groq API Key (100% Free from console.groq.com)
 */
export async function testGroqKey(key: string, preferredModel: string = "llama-3.3-70b-versatile"): Promise<{ success: boolean; latencyMs: number; error?: string; modelUsed: string }> {
  if (!key || !key.trim()) {
    return { success: false, latencyMs: 0, error: "Chave do Groq vazia. Obtenha uma chave gratuita em console.groq.com/keys", modelUsed: preferredModel };
  }

  const modelsToTry = [
    preferredModel,
    ...GROQ_CANDIDATE_MODELS.filter(m => m !== preferredModel)
  ];

  let lastError = "";
  const start = Date.now();

  for (const model of modelsToTry) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key.trim()}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: "You are a fast API test responder." },
            { role: "user", content: "Responda apenas 'OK'." }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      const latencyMs = Date.now() - start;
      if (res.ok) {
        // Se o modelo original não era suportado mas outro funcionou, salva no config
        if (model !== preferredModel) {
          const cfg = getAiConfig();
          cfg.groqModel = model;
          saveAiConfig(cfg);
        }
        return { success: true, latencyMs, modelUsed: model };
      }

      const errData = await res.json().catch(() => ({}));
      const msg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
      lastError = msg;

      // Se o erro não for de modelo inexistente (ex: chave inválida ou rate limit), interrompe
      if (!msg.toLowerCase().includes("does not exist") && !msg.toLowerCase().includes("do not have access") && !msg.toLowerCase().includes("model_not_found")) {
        return { success: false, latencyMs, error: msg, modelUsed: model };
      }
    } catch (e: any) {
      lastError = e.message || "Erro de conexão com a API do Groq.";
    }
  }

  return { 
    success: false, 
    latencyMs: Date.now() - start, 
    error: lastError || "Nenhum modelo Groq disponível para esta chave.", 
    modelUsed: preferredModel 
  };
}

/**
 * Executes chat completion on Groq with specific key and automatic model fallback
 */
async function callGroqDirect(key: string, preferredModel: string, prompt: string, systemPrompt?: string, temperature = 0.35, jsonMode = true) {
  const messages: any[] = [];
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  const modelsToTry = [
    preferredModel || "llama-3.3-70b-versatile",
    ...GROQ_CANDIDATE_MODELS.filter(m => m !== preferredModel)
  ];

  let lastErr: any = null;

  for (const model of modelsToTry) {
    const body: any = {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: 4096
    };

    if (jsonMode) {
      body.response_format = { type: "json_object" };
    }

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key.trim()}`
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices?.[0]?.message?.content || "";
      }

      const errorBody = await res.json().catch(() => ({}));
      const errMsg = errorBody.error?.message || `Groq API error HTTP ${res.status}`;
      const err = new Error(errMsg);
      (err as any).status = res.status;
      lastErr = err;

      // Se não for erro de modelo inexistente, não tenta outros modelos
      if (!errMsg.toLowerCase().includes("does not exist") && !errMsg.toLowerCase().includes("do not have access") && !errMsg.toLowerCase().includes("model_not_found")) {
        throw err;
      }
    } catch (e: any) {
      lastErr = e;
      if (e.status && e.status !== 404 && e.status !== 400) {
        throw e;
      }
    }
  }

  throw lastErr || new Error("Falha em todos os modelos Groq disponíveis.");
}

/**
 * Universal Multi-Engine Execution with 3-Key Groq Rotation & Gemini Fallback
 */
export async function executeAiCompletion(
  promptOrOptions: string | {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    tools?: any[];
    jsonMode?: boolean;
    signal?: AbortSignal;
  },
  systemPrompt?: string,
  temperature?: number,
  signal?: AbortSignal
): Promise<{ text: string; engineUsed: string }> {
  let options: {
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    tools?: any[];
    jsonMode?: boolean;
    signal?: AbortSignal;
  };

  if (typeof promptOrOptions === "string") {
    options = {
      prompt: promptOrOptions,
      systemPrompt,
      temperature,
      signal
    };
  } else {
    options = promptOrOptions;
  }

  const config = getAiConfig();
  const validGroqKeys = config.groqKeys
    .map((k, index) => ({ key: k.trim(), index }))
    .filter(item => item.key.length > 10);

  // If user selected 100% Free Autonomous Mode, throw immediately to use the local High-Ticket engine
  if (config.activeProvider === 'free_autonomous') {
    throw new Error("MODO_AUTONOMO_FREE_ATIVO");
  }

  const hasGroq = validGroqKeys.length > 0;
  const shouldTryGroq = (config.activeProvider === 'groq' || config.activeProvider === 'auto') && hasGroq;

  // 1. Try Groq Pool if configured (100% Free & Ultra Fast)
  if (shouldTryGroq) {
    let keyIndexInList = 0;
    const foundStart = validGroqKeys.findIndex(item => item.index === config.activeKeyIndex);
    if (foundStart >= 0) keyIndexInList = foundStart;

    let attempts = 0;
    const maxAttempts = validGroqKeys.length;

    while (attempts < maxAttempts) {
      const currentItem = validGroqKeys[keyIndexInList];
      try {
        if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

        const textResult = await Promise.race([
          callGroqDirect(
            currentItem.key,
            config.groqModel || "llama-3.3-70b-versatile",
            options.prompt,
            options.systemPrompt,
            options.temperature ?? config.temperature,
            options.jsonMode !== false
          ),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout Groq")), 45000))
        ]);

        // Update key status to valid
        config.activeKeyIndex = currentItem.index;
        if (config.keyStatuses[currentItem.index]) {
          config.keyStatuses[currentItem.index].status = 'VALID';
          config.keyStatuses[currentItem.index].lastUsed = new Date().toLocaleTimeString();
          config.keyStatuses[currentItem.index].requestsCount = (config.keyStatuses[currentItem.index].requestsCount || 0) + 1;
        }
        saveAiConfig(config);

        return {
          text: textResult,
          engineUsed: `Groq Cloud Free (${config.groqModel} • Key #${currentItem.index + 1})`
        };

      } catch (err: any) {
        console.warn(`⚠️ Groq Key #${currentItem.index + 1} falhou:`, err.message);
        
        // Mark key status
        if (config.keyStatuses[currentItem.index]) {
          const is429 = err.status === 429 || err.message?.includes('429') || err.message?.includes('rate');
          config.keyStatuses[currentItem.index].status = is429 ? 'RATE_LIMITED' : 'ERROR';
          config.keyStatuses[currentItem.index].errorMessage = err.message;
        }
        saveAiConfig(config);

        // Rotate to next key
        keyIndexInList = (keyIndexInList + 1) % validGroqKeys.length;
        attempts++;
      }
    }
  }

  // 2. Try Gemini (Google AI Studio Free Tier or Custom Key)
  try {
    if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const geminiAi = getGeminiClient();
    const fullPrompt = options.systemPrompt ? `${options.systemPrompt}\n\n${options.prompt}` : options.prompt;
    const activeModel = (config.geminiModel && config.geminiModel !== 'gemini-3.6-flash' && config.geminiModel !== 'gemini-3.5-flash') ? config.geminiModel : 'gemini-3.7-flash';
    
    // CRITICAL ANTI-403 FIX: Only pass tools if explicitly enabled and requested
    // (Free Google AI Studio keys throw 403 Permission Denied if googleMaps/googleSearch tools are attached)
    const activeTools = config.useGroundingTools && options.tools && options.tools.length > 0 
      ? options.tools 
      : undefined;

    const geminiRes: any = await Promise.race([
      geminiAi.models.generateContent({
        model: activeModel,
        contents: fullPrompt,
        config: {
          tools: activeTools,
          temperature: options.temperature ?? config.temperature
        }
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout Gemini (75s)")), 75000))
    ]);

    return {
      text: geminiRes.text || "",
      engineUsed: `Google Gemini (${activeModel})`
    };
  } catch (geminiError: any) {
    if (options.signal?.aborted) throw geminiError;
    console.warn("⚠️ Gemini primário falhou, tentando fallback resiliente:", geminiError?.message || geminiError);

    // If Groq is available and was not tried yet (e.g. activeProvider was 'gemini')
    if (hasGroq && config.activeProvider === 'gemini') {
      try {
        const textResult = await callGroqDirect(
          validGroqKeys[0].key,
          config.groqModel || "llama-3.3-70b-versatile",
          options.prompt,
          options.systemPrompt,
          options.temperature ?? config.temperature,
          options.jsonMode !== false
        );
        return {
          text: textResult,
          engineUsed: "Groq Cloud Fallback (Llama 3.3 70B)"
        };
      } catch (fallbackGroqErr) {
        console.warn("Fallback Groq também falhou:", fallbackGroqErr);
      }
    }

    // Re-throw to allow searchAndScoreLeads to engage the Autonomous Deep BANT+ Engine
    throw geminiError;
  }
}

/**
 * REVERSE ICP EXTRACTOR & WEBSITE SCANNER
 * Analisa qualquer URL de site fornecida pelo usuário, extrai o negócio, serviços,
 * tickets recomendados, UVP e sugere os 5 melhores nichos de alto ticket para prospecção.
 * 100% Gratuito, sem dependência de ferramentas pagas do Google Maps/Search.
 */
export async function scanWebsiteAndExtractProfile(
  websiteUrl: string,
  existingProfile?: Partial<BusinessProfile>,
  signal?: AbortSignal
): Promise<BusinessProfile> {
  const cleanUrl = websiteUrl.trim().startsWith("http") ? websiteUrl.trim() : `https://${websiteUrl.trim()}`;

  // Moeda do país selecionado pelo usuário (padrão: Portugal / Euro)
  const currencySymbol = getCurrencyConfig(getSavedCountry()).symbol;
  
  const systemPrompt = `
Você é o "Architect Reverse-ICP Scanner & Business Intelligence Extractor", especialista em análise de negócios, posicionamento de mercado e identificação de nichos de alto ticket para vendas B2B.
Sua missão é analisar o site e o domínio da empresa do usuário, descobrir exatamente o que ela faz e entregar um perfil completo e altamente estratégico.
`;

  const prompt = `
URL DO SITE DO USUÁRIO: ${cleanUrl}
${existingProfile?.businessName ? `Nome Informado: ${existingProfile.businessName}` : ''}
${existingProfile?.servicesDescription ? `Detalhes Adicionais: ${existingProfile.servicesDescription}` : ''}

INSTRUÇÕES DE ANÁLISE:
1. Identifique o nome comercial mais provável da empresa e seu posicionamento.
2. Liste todos os serviços, produtos e soluções que essa empresa entrega (sites, automações de IA, tráfego, CRM, consultoria, software, design, etc.).
3. Formule uma Proposta Única de Valor (UVP) assertiva e de alto impacto que eles podem apresentar a novos clientes.
4. Defina a faixa ideal de Ticket Médio na moeda do país do usuário (${getSavedCountry()}, símbolo "${currencySymbol}") (ex: "${currencySymbol} 8.000 a ${currencySymbol} 35.000 / projeto ou MRR de ${currencySymbol} 4.500/mês").
5. Identifique as 4 principais dores de mercado que essa empresa resolve.
6. Identifique 4 diferenciais competitivos fortes.
7. O MAIS IMPORTANTE: Elabore 5 "Nichos de Alto Ticket & Alta Conversão" ideais para essa empresa prospectar e vender todos os seus serviços com facilidade.
   Para cada nicho, forneça:
   - niche: Nome do nicho (ex: "Clínicas Médicas & Cirurgia Plástica de Alto Padrão")
   - category: Categoria geral
   - tag: Tag de destaque (ex: "🔥 ${currencySymbol} 10k-35k", "💎 Alta Conversão", "🏢 B2B Enterprise")
   - whyGoodMatch: Por que esse nicho tem alto poder aquisitivo e precisa urgentemente de todos os serviços do usuário.
   - estimatedTicket: Faixa de valor (em ${getSavedCountry()}) que esse nicho paga com facilidade.
   - criticalGaps: 3 dores ou falhas crônicas que esse nicho tem na presença digital e atendimento.
   - suggestedOfferBundle: O pacote de serviços exato para vender para eles (ex: "Site 3.0 + SDR IA no WhatsApp + Automação de Agendamento").

RETORNE ESTRITAMENTE EM JSON FORMATO:
{
  "businessName": "Nome da Empresa",
  "servicesDescription": "Descrição detalhada dos serviços oferecidos",
  "ticketMedio": "${currencySymbol} 8.000 a ${currencySymbol} 35.000 / projeto",
  "icpTarget": "Descrição do Perfil de Cliente Ideal de Alto Ticket",
  "uvp": "Proposta Única de Valor",
  "solvedPains": ["Dor 1", "Dor 2", "Dor 3", "Dor 4"],
  "commonObjections": ["Objeção 1", "Objeção 2", "Objeção 3", "Objeção 4"],
  "competitiveDifferentials": ["Diferencial 1", "Diferencial 2", "Diferencial 3", "Diferencial 4"],
  "comparisonVectors": ["Vetor 1", "Vetor 2", "Vetor 3", "Vetor 4"],
  "recommendedHighTicketNiches": [
    {
      "id": "niche-1",
      "niche": "Nome do Nicho de Alto Ticket 1",
      "category": "Categoria",
      "tag": "🔥 ${currencySymbol} 15k a ${currencySymbol} 40k",
      "whyGoodMatch": "Motivo estratégico da correlação",
      "estimatedTicket": "${currencySymbol} 15.000 a ${currencySymbol} 40.000",
      "criticalGaps": ["Gap 1", "Gap 2", "Gap 3"],
      "suggestedOfferBundle": "Pacote Completo de Soluções"
    }
  ]
}
`;

  try {
    // We execute without paid grounding tools so free keys NEVER fail with 403 Permission Denied
    const result = await executeAiCompletion({
      prompt,
      systemPrompt,
      temperature: 0.3,
      jsonMode: true,
      signal
    });

    let rawText = result.text.trim();
    const startIndex = rawText.indexOf("{");
    const endIndex = rawText.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1) {
      rawText = rawText.substring(startIndex, endIndex + 1);
    }

    const parsed = JSON.parse(rawText);

    // Ensure niches have IDs
    const niches: HighTicketNicheRecommendation[] = Array.isArray(parsed.recommendedHighTicketNiches) && parsed.recommendedHighTicketNiches.length > 0
      ? parsed.recommendedHighTicketNiches.map((n: any, idx: number) => ({
          id: n.id || `niche-extracted-${idx + 1}`,
          niche: n.niche || "Nicho de Alto Ticket",
          category: n.category || "B2B Corporativo",
          tag: n.tag || "🔥 Alto Ticket",
          whyGoodMatch: n.whyGoodMatch || "Alta capacidade de investimento e necessidade direta de automação e novos canais.",
          estimatedTicket: n.estimatedTicket || `${currencySymbol} 10.000 a ${currencySymbol} 30.000`,
          criticalGaps: Array.isArray(n.criticalGaps) ? n.criticalGaps : ["Processos manuais", "Demora no atendimento", "Presença digital defasada"],
          suggestedOfferBundle: n.suggestedOfferBundle || "Implementação Completa: Presença Digital + Automação IA + CRM"
        }))
      : DEFAULT_HIGH_TICKET_NICHES;

    return {
      websiteUrl: cleanUrl,
      businessName: parsed.businessName || existingProfile?.businessName || "Meu Negócio Digital",
      servicesDescription: parsed.servicesDescription || existingProfile?.servicesDescription || "Criação de Sites, Automações de IA, CRM e Vendas B2B",
      ticketMedio: parsed.ticketMedio || existingProfile?.ticketMedio || `${currencySymbol} 8.000 a ${currencySymbol} 35.000 / projeto`,
      icpTarget: parsed.icpTarget || existingProfile?.icpTarget || "Empresas de Alto Ticket com necessidade de modernização digital e processos de vendas",
      uvp: parsed.uvp || "Aceleramos as vendas e modernizamos a operação de empresas de alto ticket com sites de alta performance e automações com IA.",
      solvedPains: Array.isArray(parsed.solvedPains) && parsed.solvedPains.length > 0 ? parsed.solvedPains : [
        "Demora para responder leads qualificados no WhatsApp",
        "Perda de clientes para concorrentes por processos antiquados",
        "Presença digital que não transmite autoridade de alto padrão",
        "Equipe comercial sobrecarregada com tarefas repetitivas"
      ],
      commonObjections: Array.isArray(parsed.commonObjections) && parsed.commonObjections.length > 0 ? parsed.commonObjections : [
        "Já temos quem faça isso",
        "Sem tempo para implantar novas tecnologias",
        "Dúvida sobre o retorno financeiro"
      ],
      competitiveDifferentials: Array.isArray(parsed.competitiveDifferentials) && parsed.competitiveDifferentials.length > 0 ? parsed.competitiveDifferentials : [
        "Entrega turnkey rápida com integrações oficiais",
        "Agentes de IA hiper-humanizados",
        "Foco em geração real de receita"
      ],
      comparisonVectors: Array.isArray(parsed.comparisonVectors) && parsed.comparisonVectors.length > 0 ? parsed.comparisonVectors : [
        "Presença digital e velocidade de resposta",
        "Gaps críticos no funil de vendas",
        "Capacidade de investimento"
      ],
      recommendedHighTicketNiches: niches,
      lastAnalyzedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.warn("⚠️ Scanner AI em modo autônomo offline para o domínio:", cleanUrl);
    
    // Extract a clean domain name as fallback
    let domainName = "Meu Negócio";
    try {
      domainName = new URL(cleanUrl).hostname.replace("www.", "").split(".")[0];
      domainName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
    } catch {}

    return {
      websiteUrl: cleanUrl,
      businessName: existingProfile?.businessName || domainName,
      servicesDescription: existingProfile?.servicesDescription || "Criação de Sites Modernos, Automações de IA, SDRs de WhatsApp e Otimização Comercial",
      ticketMedio: existingProfile?.ticketMedio || `${currencySymbol} 8.000 - ${currencySymbol} 35.000 / projeto`,
      icpTarget: existingProfile?.icpTarget || "Empresas com ticket elevado e alto volume de clientes que precisam modernizar sua operação de vendas",
      uvp: "Implementamos infraestrutura completa de presença digital, automações e IA para converter prospects em clientes de alto ticket.",
      solvedPains: [
        "Demora de atendimento e perda de leads qualificados",
        "Processos comerciais manuais e falta de follow-up",
        "Presença digital sem autoridade para clientes premium"
      ],
      commonObjections: [
        "Já temos equipe interna",
        "Sem tempo para novas ferramentas"
      ],
      competitiveDifferentials: [
        "Implementação turnkey completa em tempo recorde",
        "IA com conhecimento profundo do seu negócio"
      ],
      comparisonVectors: [
        "Velocidade de atendimento",
        "Gaps na presença digital"
      ],
      recommendedHighTicketNiches: DEFAULT_HIGH_TICKET_NICHES,
      lastAnalyzedAt: new Date().toISOString()
    };
  }
}