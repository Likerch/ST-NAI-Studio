// Removes or coerces fields the selected model does not accept, mirroring the web client's
// request sanitizer (bundle:_app@1549913-1552423). Every removal is recorded for the inspector.
import type { NaiAction, NaiParameters } from '../../shared/nai-wire';
import { SAMPLERS_WITHOUT_SCHEDULE } from '../capabilities';
import type { ModelCapabilities } from '../capabilities';
import type { GenerationRequest, NoiseSchedule } from '../types';
import { dropParam } from './context';
import type { BuildContext } from './context';

/** Variety Boost sigma scales with resolution (bundle:_app@1551802). */
export function varietyFactor(width: number, height: number): number {
    return Math.sqrt((Math.floor(width / 8) * Math.floor(height / 8)) / (104 * 152));
}

function sanitizeSchedule(p: NaiParameters, req: GenerationRequest, caps: ModelCapabilities, ctx: BuildContext): void {
    if (caps.forcedNoiseSchedule) {
        if (req.noiseSchedule !== caps.forcedNoiseSchedule) {
            ctx.warn('noise-schedule-forced', { from: req.noiseSchedule, to: caps.forcedNoiseSchedule });
        }
        p.noise_schedule = caps.forcedNoiseSchedule;
        return;
    }
    if (SAMPLERS_WITHOUT_SCHEDULE.includes(p.sampler)) {
        dropParam(ctx, p, 'noise_schedule', 'not-applicable-to-mode', false);
        return;
    }
    const schedule = p.noise_schedule as NoiseSchedule;
    if (!caps.noiseSchedules.includes(schedule)) {
        const fallback: NoiseSchedule = 'karras';
        ctx.warn('noise-schedule-forced', { from: schedule, to: fallback });
        p.noise_schedule = fallback;
    }
}

export function sanitizeParameters(
    p: NaiParameters,
    req: GenerationRequest,
    caps: ModelCapabilities,
    action: NaiAction,
    ctx: BuildContext,
): NaiParameters {
    sanitizeSchedule(p, req, caps, ctx);

    // Euler Ancestral on a non-native schedule needs the post-summer-sampler flags.
    if (p.sampler === 'k_euler_ancestral' && p.noise_schedule !== 'native') {
        p.deliberate_euler_ancestral_bug = false;
        p.prefer_brownian = true;
    }

    if (!caps.varietyBoost) {
        dropParam(ctx, p, 'skip_cfg_above_sigma', 'unsupported-by-model', req.varietyBoost);
    } else if (typeof p.skip_cfg_above_sigma === 'number' && p.skip_cfg_above_sigma > 0) {
        p.skip_cfg_above_sigma *= varietyFactor(p.width, p.height);
    }

    if (!caps.smea) {
        dropParam(ctx, p, 'sm', 'unsupported-by-model', req.smea);
        dropParam(ctx, p, 'sm_dyn', 'unsupported-by-model', req.smeaDyn);
    } else if (!caps.smeaDyn) {
        dropParam(ctx, p, 'sm_dyn', 'unsupported-by-model', req.smeaDyn);
    }

    if (!caps.decrisper && p.dynamic_thresholding) {
        ctx.warn('decrisper-disabled');
        p.dynamic_thresholding = false;
    }

    if (!caps.cfgRescale) {
        dropParam(ctx, p, 'cfg_rescale', 'unsupported-by-model', req.cfgRescale !== 0);
    }

    if (!caps.transparency) {
        dropParam(ctx, p, 'straight_alpha', 'unsupported-by-model', false);
        dropParam(ctx, p, 'tag_hint_transparent_background', 'unsupported-by-model', req.transparentBackground);
    } else if (p.tag_hint_transparent_background !== true) {
        // The client only sends the hint when it is true.
        delete p.tag_hint_transparent_background;
    }

    if (action !== 'infill') {
        dropParam(ctx, p, 'mask', 'not-applicable-to-mode', false);
    }
    if (!p.image) {
        dropParam(ctx, p, 'strength', 'not-applicable-to-mode', false);
        dropParam(ctx, p, 'noise', 'not-applicable-to-mode', false);
    }

    if (req.imageFormat === 'webp') {
        p.image_format = 'webp';
    }
    return p;
}
