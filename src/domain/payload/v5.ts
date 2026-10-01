import type { NaiParameters } from '../../shared/nai-wire';
import type { GenerationRequest } from '../types';

/**
 * Transparency intent of V5 (straight alpha output and the transparent-background tag hint).
 * Added for every v4_prompt model; sanitize.ts removes it where the model has no transparency.
 */
export function applyV5Intent(params: NaiParameters, req: GenerationRequest): void {
    params.straight_alpha = true;
    params.tag_hint_transparent_background = req.transparentBackground;
}
