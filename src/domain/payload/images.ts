import type { NaiParameters } from '../../shared/nai-wire';
import type { GenerationRequest } from '../types';

/** img2img / inpaint fields shared by every model family (bundle:2952@28345-28598). */
export function applySourceImage(params: NaiParameters, req: GenerationRequest, v4Prompt: boolean): void {
    if (req.mode === 'txt2img' || !req.image) {
        return;
    }
    params.image = req.image;
    params.strength = req.strength;
    params.noise = req.noise;
    params.extra_noise_seed = req.seed > 0 ? req.seed - 1 : 0;
    if (Object.hasOwn(params, 'sm')) {
        params.sm = false;
    }
    if (Object.hasOwn(params, 'sm_dyn')) {
        params.sm_dyn = false;
    }
    if (req.mode === 'img2img') {
        params.color_correct = false;
        return;
    }
    // inpaint: the client composites the result over the original itself.
    params.mask = req.mask;
    params.add_original_image = false;
    if (v4Prompt && req.inpaintStrength !== 1) {
        params.img2img = { strength: req.inpaintStrength, color_correct: true };
    }
}
