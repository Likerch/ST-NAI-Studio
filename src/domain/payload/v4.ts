// Parameters for V4, V4.5 and V5 (v4_prompt models), mirroring the web client (RECON §3.5).
import type { NaiCharacterPrompt, NaiParameters } from '../../shared/nai-wire';
import type { ModelCapabilities } from '../capabilities';
import { TAG_HINT_IDS } from '../presets';
import { normalizeCharacterPrompt } from '../prompt';
import { placeOnCanvas } from '../scene';
import type { GenerationRequest } from '../types';
import type { BuildContext } from './context';
import { applySourceImage } from './images';
import { applyCharacterReferences, applyVibes } from './references';
import { applyV5Intent } from './v5';

function prepareCharacters(req: GenerationRequest, caps: ModelCapabilities, ctx: BuildContext): NaiCharacterPrompt[] {
    const active = req.characters.filter((c) => c.enabled && c.prompt.trim() !== '');
    if (active.length > caps.maxCharacters) {
        active
            .slice(caps.maxCharacters)
            .forEach((_, i) =>
                ctx.drop(`parameters.characterPrompts[${caps.maxCharacters + i}]`, 'exceeds-model-limit', true),
            );
    }
    return active.slice(0, caps.maxCharacters).map((c) => ({
        prompt: normalizeCharacterPrompt(c.prompt),
        uc: c.negative,
        center: placeOnCanvas(c.center, caps),
        enabled: true,
    }));
}

function resolveUseCoords(req: GenerationRequest, caps: ModelCapabilities, count: number, ctx: BuildContext): boolean {
    if (!req.useCoords) {
        return false;
    }
    const minimum = caps.canPositionSingleCharacter ? 1 : 2;
    if (caps.positioning === 'none' || count < minimum) {
        ctx.warn('coords-disabled', { characters: count, minimum });
        return false;
    }
    return true;
}

export function buildV4Parameters(
    req: GenerationRequest,
    caps: ModelCapabilities,
    prompt: string,
    negative: string,
    ctx: BuildContext,
): NaiParameters {
    const characters = prepareCharacters(req, caps, ctx);
    const useCoords = resolveUseCoords(req, caps, characters.length, ctx);
    const legacyUc = req.legacyUc && caps.legacyUc;
    if (req.legacyUc && !caps.legacyUc) {
        ctx.warn('legacy-uc-disabled');
    }

    // Candidate set: everything the user asked for. sanitize.ts removes what the model rejects.
    const params: NaiParameters = {
        params_version: 4,
        width: req.width,
        height: req.height,
        scale: req.scale,
        sampler: req.sampler,
        steps: req.steps,
        n_samples: req.samples,
        ucPresetId: req.ucPreset,
        qualityPresetId: req.qualityPreset,
        autoSmea: false,
        sm: req.smea,
        sm_dyn: req.smeaDyn,
        dynamic_thresholding: req.decrisper,
        controlnet_strength: 1,
        legacy: false,
        add_original_image: true,
        cfg_rescale: req.cfgRescale,
        noise_schedule: req.noiseSchedule,
        legacy_v3_extend: false,
        skip_cfg_above_sigma: req.varietyBoost ? caps.varietySigma : null,
        use_coords: useCoords,
        legacy_uc: legacyUc,
        normalize_reference_strength_multiple: req.normalizeVibeStrength,
        inpaintImg2ImgStrength: req.inpaintStrength,
        seed: req.seed,
        tag_hint_qt: TAG_HINT_IDS[req.qualityPreset],
        tag_hint_uc_preset: TAG_HINT_IDS[req.ucPreset],
        characterPrompts: characters,
        v4_prompt: {
            caption: {
                base_caption: prompt,
                char_captions: characters.map((c) => ({ char_caption: c.prompt, centers: [c.center] })),
            },
            use_coords: useCoords,
            use_order: true,
        },
        v4_negative_prompt: {
            caption: {
                base_caption: negative,
                char_captions: characters.map((c) => ({ char_caption: c.uc, centers: [c.center] })),
            },
            legacy_uc: legacyUc,
        },
        negative_prompt: negative,
    };
    applyV5Intent(params, req);
    applySourceImage(params, req, true);
    const referencesApplied = applyCharacterReferences(params, req, caps, ctx);
    applyVibes(params, req, caps, ctx, referencesApplied);
    return params;
}
