// Avatar descriptions for the multimodal modes (v0.9.1) through SillyTavern's multimodal captioning.
// The API and model chosen in NAI Studio are put into the Image Captioning settings only for the
// duration of the request (SillyTavern reads them across its own awaits) and restored after, so
// Image Captioning keeps its own choice.
import { ctx, importHost } from '../../core/context';
import { settings } from '../../core/settings';
import { hasSecret, VISION_APIS, visionModel } from '../../domain';

interface MultimodalModule {
    getMultimodalCaption(base64: string, prompt: string): Promise<string>;
}

export async function describeImage(base64: string, prompt: string): Promise<string> {
    const shared = await importHost<MultimodalModule>('/scripts/extensions/shared.js');
    const { multimodalApi: api, multimodalModel: model } = settings().modes;
    if (!api) return await shared.getMultimodalCaption(base64, prompt);
    const caption = ((ctx().extensionSettings as Record<string, unknown>).caption ??= {}) as Record<string, unknown>;
    const saved = { api: caption.multimodal_api, model: caption.multimodal_model };
    caption.multimodal_api = api;
    caption.multimodal_model = visionModel(api, model);
    try {
        return await shared.getMultimodalCaption(base64, prompt);
    } finally {
        caption.multimodal_api = saved.api;
        caption.multimodal_model = saved.model;
    }
}

export interface VisionChoice {
    id: string;
    label: string;
    hasKey: boolean;
}

/** The APIs with whether their key is saved in SillyTavern (the values are never read). */
export async function visionChoices(): Promise<{ current: string; apis: VisionChoice[] }> {
    let state: Record<string, unknown> = {};
    try {
        state = (await importHost<{ secret_state: Record<string, unknown> }>('/scripts/secrets.js')).secret_state ?? {};
    } catch {
        state = {};
    }
    const caption = (ctx().extensionSettings as Record<string, unknown>).caption as
        { multimodal_api?: string } | undefined;
    return {
        current: caption?.multimodal_api || 'openai',
        apis: VISION_APIS.map((api) => ({ id: api.id, label: api.label, hasKey: hasSecret(state, api.secret) })),
    };
}
