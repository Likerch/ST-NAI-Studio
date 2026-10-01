// Degraded transport through SillyTavern's own /api/novelai/generate-image (RECON §2.2).
// ST rebuilds the NovelAI body itself from a fixed whitelist, so we compute that body exactly
// (for the inspector) and report every requested feature that cannot pass through.
import type { NaiImageRequest, NaiSubscription } from '../shared/nai-wire';
import { isAbort, TransportError } from './types';
import type {
    EffectiveRequest,
    GenerateOptions,
    GenerateResult,
    LostFeature,
    Transport,
    TransportEnv,
    TransportFeatures,
} from './types';

export const NATIVE_FEATURES: TransportFeatures = {
    characters: false,
    multipleSamples: false,
    img2img: false,
    inpaint: false,
    vibes: false,
    characterReference: false,
    cfgRescale: false,
    transparency: false,
    stream: false,
    upscale: false,
    director: false,
    diagnostics: false,
};

/** Fields ST's endpoint accepts (src/endpoints/novelai.js:321-376). */
export interface StNativeRequest {
    prompt: string;
    model: string;
    negative_prompt: string;
    width: number;
    height: number;
    scale: number;
    seed: number;
    sampler: string;
    scheduler: string;
    steps: number;
    sm: boolean;
    sm_dyn: boolean;
    decrisper: boolean;
    variety_boost: boolean;
    upscale_ratio: number;
}

export function toStNativeRequest(body: NaiImageRequest): StNativeRequest {
    const p = body.parameters;
    return {
        prompt: body.input,
        model: body.model,
        negative_prompt: p.negative_prompt,
        width: p.width,
        height: p.height,
        scale: p.scale,
        seed: p.seed,
        sampler: p.sampler,
        scheduler: typeof p.noise_schedule === 'string' ? p.noise_schedule : 'karras',
        steps: p.steps,
        sm: p.sm === true,
        sm_dyn: p.sm_dyn === true,
        decrisper: p.dynamic_thresholding === true,
        variety_boost: typeof p.skip_cfg_above_sigma === 'number' && p.skip_cfg_above_sigma > 0,
        upscale_ratio: 1,
    };
}

/** ST's own Variety Boost formula (src/endpoints/novelai.js:120-129). */
function stSkipCfg(width: number, height: number, model: string): number {
    const magic = model.includes('nai-diffusion-4-5') ? 58 : 19;
    return Math.pow((width * height) / 1011712, 0.5) * magic;
}

/** The exact body ST sends to image.novelai.net for a given request (verified against capture c08). */
export function stEffectiveBody(req: StNativeRequest): Record<string, unknown> {
    return {
        action: 'generate',
        input: req.prompt,
        model: req.model,
        parameters: {
            params_version: 3,
            prefer_brownian: true,
            negative_prompt: req.negative_prompt,
            height: req.height,
            width: req.width,
            scale: req.scale,
            seed: req.seed,
            sampler: req.sampler,
            noise_schedule: req.scheduler,
            steps: req.steps,
            n_samples: 1,
            ucPreset: 0,
            qualityToggle: false,
            add_original_image: false,
            controlnet_strength: 1,
            deliberate_euler_ancestral_bug: false,
            dynamic_thresholding: req.decrisper,
            legacy: false,
            legacy_v3_extend: false,
            sm: req.sm,
            sm_dyn: req.sm_dyn,
            uncond_scale: 1,
            skip_cfg_above_sigma: req.variety_boost ? stSkipCfg(req.width, req.height, req.model) : null,
            use_coords: false,
            characterPrompts: [],
            reference_image_multiple: [],
            reference_information_extracted_multiple: [],
            reference_strength_multiple: [],
            v4_negative_prompt: { caption: { base_caption: req.negative_prompt, char_captions: [] } },
            v4_prompt: { caption: { base_caption: req.prompt, char_captions: [] }, use_coords: false, use_order: true },
        },
    };
}

/** Requested features that ST's endpoint drops. */
export function lostOnNative(body: NaiImageRequest, overridePaths: string[]): LostFeature[] {
    const p = body.parameters;
    const lost: LostFeature[] = [];
    if (body.action !== 'generate') lost.push('mode');
    if (Array.isArray(p.characterPrompts) && p.characterPrompts.length > 0) lost.push('characters');
    if (p.use_coords === true) lost.push('coordinates');
    if (p.n_samples > 1) lost.push('samples');
    if (p.image) lost.push('source-image');
    if (p.mask) lost.push('mask');
    if (Array.isArray(p.reference_image_multiple) && p.reference_image_multiple.length > 0) lost.push('vibes');
    if (Array.isArray(p.director_reference_images) && p.director_reference_images.length > 0)
        lost.push('character-reference');
    if (typeof p.cfg_rescale === 'number' && p.cfg_rescale !== 0) lost.push('cfg-rescale');
    if (p.tag_hint_transparent_background === true) lost.push('transparency');
    if (p.legacy_uc === true) lost.push('legacy-uc');
    if (p.stream) lost.push('stream');
    if (overridePaths.length > 0) lost.push('override');
    return lost;
}

const PNG_BASE64_MAGIC = 'iVBORw0KGgo';

export function createNativeTransport(env: TransportEnv): Transport {
    async function post(path: string, payload: unknown, signal?: AbortSignal): Promise<Response> {
        try {
            return await env.fetch(path, {
                method: 'POST',
                headers: env.headers(),
                body: JSON.stringify(payload),
                signal,
            });
        } catch (error) {
            if (isAbort(error)) throw new TransportError('aborted');
            throw new TransportError('network', { message: error instanceof Error ? error.message : String(error) });
        }
    }

    return {
        id: 'native',
        features: NATIVE_FEATURES,

        async generate(body: NaiImageRequest, options: GenerateOptions): Promise<GenerateResult> {
            const response = await post('/api/novelai/generate-image', toStNativeRequest(body), options.signal);
            const text = await response.text();
            if (response.status === 400) {
                // ST answers 400 only when the NovelAI key is missing from its secrets.
                throw new TransportError('token-missing', { status: 400 });
            }
            if (!response.ok) {
                // ST hides NovelAI's real status and body behind a bare 500 (RECON t2).
                throw new TransportError('http', { status: response.status, bodyPreview: text.slice(0, 200) });
            }
            if (!text.startsWith(PNG_BASE64_MAGIC)) {
                throw new TransportError('invalid-response', { bodyPreview: text.slice(0, 200) });
            }
            return { images: [{ base64: text, mime: 'image/png', seed: body.parameters.seed, index: 0 }] };
        },

        async subscription(signal?: AbortSignal): Promise<NaiSubscription> {
            const response = await post('/api/novelai/status', {}, signal);
            if (response.status === 400) throw new TransportError('token-missing', { status: 400 });
            const text = await response.text();
            let data: unknown;
            try {
                data = JSON.parse(text);
            } catch {
                throw new TransportError('invalid-response', {
                    status: response.status,
                    bodyPreview: text.slice(0, 200),
                });
            }
            if (!response.ok || (data as { error?: boolean })?.error) {
                throw new TransportError('invalid-response', {
                    status: response.status,
                    bodyPreview: text.slice(0, 200),
                });
            }
            return data as NaiSubscription;
        },

        effectiveRequest(body: NaiImageRequest, overridePaths: string[]): EffectiveRequest {
            return { body: stEffectiveBody(toStNativeRequest(body)), lost: lostOnNative(body, overridePaths) };
        },
    };
}
