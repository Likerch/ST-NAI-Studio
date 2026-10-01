import type { ModelCapabilities } from '../capabilities';
import { DomainError } from '../errors';
import { maxSamplesForArea, roundToStep } from '../sizes';
import type { GenerationRequest } from '../types';
import type { BuildContext } from './context';

const MAX_SEED = 2 ** 32 - 1;

/** Validates and coerces a request against model limits. Returns a new object. */
export function normalizeRequest(
    req: GenerationRequest,
    caps: ModelCapabilities,
    ctx: BuildContext,
): GenerationRequest {
    const r: GenerationRequest = { ...req };

    if (!Number.isInteger(r.seed) || r.seed < 0 || r.seed > MAX_SEED) {
        throw new DomainError('invalid-seed', { seed: String(r.seed) });
    }

    const width = roundToStep(r.width);
    const height = roundToStep(r.height);
    if (width !== r.width || height !== r.height) {
        ctx.warn('size-rounded', { from: `${r.width}x${r.height}`, to: `${width}x${height}` });
        r.width = width;
        r.height = height;
    }
    if (r.width * r.height > caps.maxPixels) {
        throw new DomainError('size-too-large', { width: r.width, height: r.height, max: caps.maxPixels });
    }

    const steps = Math.min(caps.maxSteps, Math.max(1, Math.round(r.steps)));
    if (steps !== r.steps) {
        ctx.warn('steps-clamped', { from: r.steps, to: steps });
        r.steps = steps;
    }

    const samples = Math.min(maxSamplesForArea(r.width, r.height), Math.max(1, Math.round(r.samples)));
    if (samples !== r.samples) {
        ctx.warn('samples-clamped', { from: r.samples, to: samples });
        r.samples = samples;
    }

    if (!caps.samplers.includes(r.sampler)) {
        ctx.warn('sampler-replaced', { from: r.sampler, to: 'k_euler_ancestral' });
        r.sampler = 'k_euler_ancestral';
    }
    if (!caps.ucPresets.includes(r.ucPreset)) {
        r.ucPreset = caps.ucPresets[0] ?? 'none';
    }
    if (!caps.qualityPresets.includes(r.qualityPreset)) {
        r.qualityPreset = 'standard';
    }

    if (r.mode !== 'txt2img' && !r.image) {
        throw new DomainError('missing-image');
    }
    if (r.mode === 'inpaint') {
        if (!r.mask) {
            throw new DomainError('missing-mask');
        }
        if (!caps.inpaint) {
            throw new DomainError('unsupported-mode', { mode: r.mode, model: caps.model });
        }
    }
    if (r.mode === 'img2img' && !caps.img2img) {
        throw new DomainError('unsupported-mode', { mode: r.mode, model: caps.model });
    }

    return r;
}
