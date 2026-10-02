// Settings -> GenerationRequest. Unknown enum values from old or hand-edited settings fall back
// to safe defaults instead of reaching the payload.
import type { GenerationSettings } from '../../core/settings-schema';
import {
    DEFAULT_MODEL,
    defaultRequest,
    isModelId,
    NOISE_SCHEDULES,
    QUALITY_PRESETS,
    SAMPLERS,
    UC_PRESETS,
} from '../../domain';
import type {
    DatasetPrefix,
    GenerationRequest,
    NoiseSchedule,
    QualityPresetId,
    Sampler,
    UcPresetId,
} from '../../domain';

const MAX_SEED = 2 ** 32 - 1;

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
    return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function finite(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

/** Same distribution as the web client: floor(2^32 * random - 1). */
export function randomSeed(random: () => number = Math.random): number {
    return Math.max(0, Math.floor(2 ** 32 * random() - 1));
}

export function resolveSeed(seed: number, random?: () => number): number {
    return Number.isInteger(seed) && seed >= 0 && seed <= MAX_SEED ? seed : randomSeed(random);
}

export function requestFromSettings(g: GenerationSettings, seed: number): GenerationRequest {
    const model = isModelId(g.model) ? g.model : DEFAULT_MODEL;
    const base = defaultRequest(model);
    return {
        ...base,
        prompt: g.prompt,
        negativePrompt: g.negativePrompt,
        ucPreset: pick<UcPresetId>(g.ucPreset, UC_PRESETS, base.ucPreset),
        qualityPreset: pick<QualityPresetId>(g.qualityPreset, QUALITY_PRESETS, 'standard'),
        dataset: pick<DatasetPrefix>(g.dataset, ['none', 'fur', 'background'], 'none'),
        width: finite(g.width, base.width),
        height: finite(g.height, base.height),
        steps: finite(g.steps, base.steps),
        scale: finite(g.scale, base.scale),
        cfgRescale: finite(g.cfgRescale, 0),
        sampler: pick<Sampler>(g.sampler, SAMPLERS, 'k_euler_ancestral'),
        noiseSchedule: pick<NoiseSchedule>(g.noiseSchedule, NOISE_SCHEDULES, 'karras'),
        seed,
        samples: finite(g.samples, 1),
        smea: g.smea === true,
        smeaDyn: g.smeaDyn === true,
        autoSmea: g.autoSmea !== false,
        decrisper: g.decrisper === true,
        varietyBoost: g.varietyBoost === true,
        legacyUc: g.legacyUc === true,
        transparentBackground: g.transparentBackground === true,
        autoText: g.autoText !== false,
        imageFormat: g.imageFormat === 'png' ? 'png' : 'webp',
        useCoords: g.useCoords === true,
        characters: (Array.isArray(g.characters) ? g.characters : []).map((c) => ({
            prompt: String(c.prompt ?? ''),
            negative: String(c.negative ?? ''),
            center: { x: finite(c.x, 0.5), y: finite(c.y, 0.5) },
            enabled: c.enabled !== false,
        })),
    };
}
