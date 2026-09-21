import { CustomPromptsConfig } from "../types";
import { 
  DEFAULT_ENRICHMENT_SYSTEM_PROMPT, 
  DEFAULT_SUPERVISOR_SYSTEM_PROMPT, 
  DEFAULT_COPYWRITER_PROMPT,
  DEFAULT_ICP_CLASSIFICATION_PROMPT 
} from "../constants";

const PROMPTS_STORAGE_KEY = "architect_custom_prompts_v1";

export function getCustomPrompts(): CustomPromptsConfig {
  try {
    const raw = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enrichmentSystemPrompt: parsed.enrichmentSystemPrompt || DEFAULT_ENRICHMENT_SYSTEM_PROMPT,
        supervisorSystemPrompt: parsed.supervisorSystemPrompt || DEFAULT_SUPERVISOR_SYSTEM_PROMPT,
        copywriterPrompt: parsed.copywriterPrompt || DEFAULT_COPYWRITER_PROMPT,
        icpClassificationPrompt: parsed.icpClassificationPrompt || DEFAULT_ICP_CLASSIFICATION_PROMPT
      };
    }
  } catch (e) {
    console.error("Failed to load custom prompts from storage:", e);
  }

  return {
    enrichmentSystemPrompt: DEFAULT_ENRICHMENT_SYSTEM_PROMPT,
    supervisorSystemPrompt: DEFAULT_SUPERVISOR_SYSTEM_PROMPT,
    copywriterPrompt: DEFAULT_COPYWRITER_PROMPT,
    icpClassificationPrompt: DEFAULT_ICP_CLASSIFICATION_PROMPT
  };
}

export function saveCustomPrompts(prompts: CustomPromptsConfig): void {
  try {
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(prompts));
  } catch (e) {
    console.error("Failed to save custom prompts:", e);
  }
}

export function resetDefaultPrompts(): CustomPromptsConfig {
  const defaults: CustomPromptsConfig = {
    enrichmentSystemPrompt: DEFAULT_ENRICHMENT_SYSTEM_PROMPT,
    supervisorSystemPrompt: DEFAULT_SUPERVISOR_SYSTEM_PROMPT,
    copywriterPrompt: DEFAULT_COPYWRITER_PROMPT,
    icpClassificationPrompt: DEFAULT_ICP_CLASSIFICATION_PROMPT
  };
  saveCustomPrompts(defaults);
  return defaults;
}
