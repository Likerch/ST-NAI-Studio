import { getCapabilities } from './capabilities';
import type { ModelId } from './models';
import type { GenerationRequest } from './types';

/** A complete request with the web client's defaults for the given model. */
export function defaultRequest(model: ModelId): GenerationRequest {
    const caps = getCapabilities(model);
    return {
        model,
        mode: 'txt2img',
        prompt: '',
        negativePrompt: '',
        ucPreset: caps.ucPresets[0] ?? 'none',
        qualityPreset: 'standard',
        dataset: 'none',
        characters: [],
        useCoords: false,
        width: caps.defaults.width,
        height: caps.defaults.height,
        steps: caps.defaults.steps,
        scale: caps.defaults.scale,
        cfgRescale: 0,
        sampler: 'k_euler_ancestral',
        noiseSchedule: 'karras',
        seed: 0,
        samples: 1,
        smea: false,
        smeaDyn: false,
        autoSmea: caps.autoSmeaThreshold !== null,
        decrisper: false,
        varietyBoost: false,
        legacyUc: false,
        transparentBackground: false,
        imageFormat: 'webp',
        stream: 'none',
        strength: 0.7,
        noise: 0,
        inpaintStrength: 1,
        vibes: [],
        normalizeVibeStrength: true,
        characterReferences: [],
    };
}
