// GenerationRequest -> NovelAI request body. Pure: no fetch, no DOM, no SillyTavern.
import type { NaiAction, NaiImageRequest } from '../../shared/nai-wire';
import { getInpaintCapabilities } from '../capabilities';
import type { ModelCapabilities } from '../capabilities';
import { applyDatasetPrefix, applyQualityTags, applyUcPreset } from '../prompt';
import { applyAutoText } from '../text-block';
import type { DroppedField, GenerationMode, GenerationRequest, Warning } from '../types';
import { BuildContext } from './context';
import { normalizeRequest } from './normalize';
import { sanitizeParameters } from './sanitize';
import { buildV3Parameters } from './v3';
import { buildV4Parameters } from './v4';

export interface BuildResult {
    body: NaiImageRequest;
    /** Which endpoint the body is meant for. */
    endpoint: 'generate' | 'generate-stream';
    dropped: DroppedField[];
    warnings: Warning[];
    /** The request after normalization (rounded size, clamped steps, ...). */
    request: GenerationRequest;
}

const ACTIONS: Record<GenerationMode, NaiAction> = {
    txt2img: 'generate',
    img2img: 'img2img',
    inpaint: 'infill',
};

/** Final prompt and UC strings exactly as they go into `input` / `negative_prompt`. */
export function composePrompts(req: GenerationRequest, caps: ModelCapabilities): { prompt: string; negative: string } {
    const withQuality = applyQualityTags(req.prompt, caps, req.qualityPreset, req.transparentBackground);
    const negative = applyUcPreset(req.negativePrompt, caps, req.ucPreset, withQuality);
    // V5 autoText after the quality tags, so the text block stays the last part (RECON P-50).
    const withText =
        caps.family === 'v5' && req.autoText !== false
            ? applyAutoText(withQuality, req.characters, req.useCoords)
            : withQuality;
    const prompt = applyDatasetPrefix(withText, caps, req.dataset);
    return { prompt, negative };
}

export function buildPayload(input: GenerationRequest, caps: ModelCapabilities): BuildResult {
    if (input.model !== caps.model) {
        throw new Error(`Capabilities of ${caps.model} passed for ${input.model}`);
    }
    const ctx = new BuildContext();
    const req = normalizeRequest(input, caps, ctx);
    const { prompt, negative } = composePrompts(req, caps);
    const action = ACTIONS[req.mode];

    // Prompt strings follow the selected model; parameters follow the model that renders them.
    const renderCaps =
        req.mode === 'inpaint' && caps.inpaintBase !== caps.model ? getInpaintCapabilities(caps.model) : caps;
    const params = renderCaps.v4Prompt
        ? buildV4Parameters(req, renderCaps, prompt, negative, ctx)
        : buildV3Parameters(req, renderCaps, negative, ctx);
    sanitizeParameters(params, req, renderCaps, action, ctx);

    let model: string = req.model;
    if (req.mode === 'inpaint') {
        model = caps.inpaintModel;
        if (renderCaps !== caps) {
            ctx.warn('inpaint-model-fallback', { model: caps.inpaintModel });
        }
    }

    const endpoint = req.stream === 'none' ? 'generate' : 'generate-stream';
    if (req.stream !== 'none') {
        params.stream = req.stream;
    }

    return {
        body: { input: prompt, model, action, parameters: params, use_new_shared_trial: true },
        endpoint,
        dropped: ctx.dropped,
        warnings: ctx.warnings,
        request: req,
    };
}
