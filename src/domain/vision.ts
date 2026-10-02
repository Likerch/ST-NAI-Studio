// Vision APIs for the multimodal modes (v0.9.1): which SillyTavern multimodal API describes the
// avatar, the secret it needs and a model to start from. Pure.

export interface VisionApi {
    /** `extension_settings.caption.multimodal_api` value. */
    id: string;
    label: string;
    /** SECRET_KEYS value in public/scripts/secrets.js. */
    secret: string;
    defaultModel: string;
}

export const VISION_APIS: readonly VisionApi[] = [
    { id: 'openrouter', label: 'OpenRouter', secret: 'api_key_openrouter', defaultModel: 'google/gemini-2.5-flash' },
    { id: 'openai', label: 'OpenAI', secret: 'api_key_openai', defaultModel: 'gpt-4o-mini' },
    { id: 'anthropic', label: 'Anthropic (Claude)', secret: 'api_key_claude', defaultModel: 'claude-haiku-4-5' },
    { id: 'google', label: 'Google AI Studio', secret: 'api_key_makersuite', defaultModel: 'gemini-2.5-flash' },
    { id: 'mistral', label: 'Mistral AI', secret: 'api_key_mistralai', defaultModel: 'pixtral-12b-latest' },
    { id: 'groq', label: 'Groq', secret: 'api_key_groq', defaultModel: 'meta-llama/llama-4-scout-17b-16e-instruct' },
    { id: 'xai', label: 'xAI', secret: 'api_key_xai', defaultModel: 'grok-2-vision-latest' },
    { id: 'cohere', label: 'Cohere', secret: 'api_key_cohere', defaultModel: 'command-a-vision-07-2025' },
];

export function visionApi(id: string): VisionApi | undefined {
    return VISION_APIS.find((api) => api.id === id);
}

/** Is a secret set? SillyTavern keeps a flag or a list of saved keys per secret. */
export function hasSecret(state: Record<string, unknown> | undefined, secret: string): boolean {
    const value = state?.[secret];
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
}

/** The model to send: the chosen one, else the API's starting model. */
export function visionModel(apiId: string, model: string): string {
    return model.trim() || visionApi(apiId)?.defaultModel || '';
}
