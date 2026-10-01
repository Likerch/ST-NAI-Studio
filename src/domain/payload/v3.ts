// Parameters for Anime V3 / Furry V3 (no v4_prompt, SMEA, decrisper). Mirrors RECON capture c12.
import type { NaiParameters } from '../../shared/nai-wire';
import type { ModelCapabilities } from '../capabilities';
import { TAG_HINT_IDS } from '../presets';
import type { GenerationRequest } from '../types';
import type { BuildContext } from './context';
import { applySourceImage } from './images';
import { applyVibes } from './references';

function resolveSmea(req: GenerationRequest, caps: ModelCapabilities): { sm: boolean; smDyn: boolean } {
    if (req.autoSmea && caps.autoSmeaThreshold !== null) {
        const on = req.width * req.height >= caps.autoSmeaThreshold;
        return on ? { sm: true, smDyn: req.smeaDyn } : { sm: false, smDyn: false };
    }
    return { sm: req.smea, smDyn: req.smea && req.smeaDyn };
}

export function buildV3Parameters(
    req: GenerationRequest,
    caps: ModelCapabilities,
    negative: string,
    ctx: BuildContext,
): NaiParameters {
    if (req.characters.some((c) => c.enabled && c.prompt.trim() !== '')) {
        ctx.drop('parameters.characterPrompts', 'unsupported-by-model', true);
    }
    const { sm, smDyn } = resolveSmea(req, caps);
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
        sm,
        sm_dyn: smDyn,
        dynamic_thresholding: req.decrisper,
        controlnet_strength: 1,
        legacy: false,
        add_original_image: true,
        cfg_rescale: req.cfgRescale,
        noise_schedule: req.noiseSchedule,
        legacy_v3_extend: false,
        skip_cfg_above_sigma: req.varietyBoost ? caps.varietySigma : null,
        seed: req.seed,
        tag_hint_qt: TAG_HINT_IDS[req.qualityPreset],
        tag_hint_uc_preset: TAG_HINT_IDS[req.ucPreset],
        characterPrompts: [],
        negative_prompt: negative,
    };
    if (req.characterReferences.length > 0) {
        ctx.drop('parameters.director_reference_images', 'unsupported-by-model', true);
    }
    applySourceImage(params, req, false);
    applyVibes(params, req, caps, ctx, false);
    return params;
}
