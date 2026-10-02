import type { ModelId } from './models';

export type GenerationMode = 'txt2img' | 'img2img' | 'inpaint';

export const SAMPLERS = [
    'k_euler_ancestral',
    'k_euler',
    'k_dpmpp_2s_ancestral',
    'k_dpmpp_2m_sde',
    'k_dpmpp_2m',
    'k_dpmpp_sde',
    'ddim_v3',
] as const;
export type Sampler = (typeof SAMPLERS)[number];

export const NOISE_SCHEDULES = ['native', 'karras', 'exponential', 'polyexponential'] as const;
export type NoiseSchedule = (typeof NOISE_SCHEDULES)[number];

export const UC_PRESETS = ['heavy', 'light', 'humanFocus', 'furryFocus', 'none'] as const;
export type UcPresetId = (typeof UC_PRESETS)[number];

export const QUALITY_PRESETS = ['standard', 'light', 'none'] as const;
export type QualityPresetId = (typeof QUALITY_PRESETS)[number];

export type DatasetPrefix = 'none' | 'fur' | 'background';
export type ImageFormat = 'png' | 'webp';
export type StreamMode = 'none' | 'msgpack' | 'sse';

export interface Point {
    x: number;
    y: number;
}

export interface CharacterSlot {
    prompt: string;
    negative: string;
    center: Point;
    enabled: boolean;
}

/** A vibe reference: an encoding (V4/V4.5) or a raw 448x448 image (V3), base64. */
export interface VibeReference {
    data: string;
    strength: number;
    informationExtracted: number;
}

export type CharacterReferenceDescription = 'character' | 'style' | 'character&style';

export interface CharacterReference {
    /** Letterboxed PNG, base64 (1024x1536, 1536x1024 or 1472x1472). */
    image: string;
    description: CharacterReferenceDescription;
    strength: number;
    fidelity: number;
    informationExtracted: number;
}

/** What the user wants, in domain terms. The payload builder turns it into a NovelAI request. */
export interface GenerationRequest {
    model: ModelId;
    mode: GenerationMode;
    prompt: string;
    negativePrompt: string;
    ucPreset: UcPresetId;
    qualityPreset: QualityPresetId;
    dataset: DatasetPrefix;
    characters: CharacterSlot[];
    useCoords: boolean;
    width: number;
    height: number;
    steps: number;
    scale: number;
    cfgRescale: number;
    sampler: Sampler;
    noiseSchedule: NoiseSchedule;
    /** Must already be resolved to a concrete value (>= 0); the builder never randomizes. */
    seed: number;
    samples: number;
    smea: boolean;
    smeaDyn: boolean;
    autoSmea: boolean;
    decrisper: boolean;
    varietyBoost: boolean;
    legacyUc: boolean;
    transparentBackground: boolean;
    /** V5: quoted phrases become an in-image text block when no prompt has `text:` (web client autoText). */
    autoText?: boolean;
    imageFormat: ImageFormat;
    stream: StreamMode;
    /** img2img / inpaint source, base64 PNG already sized to width x height. */
    image?: string;
    /** inpaint mask, base64 PNG (white = repaint). */
    mask?: string;
    strength: number;
    noise: number;
    inpaintStrength: number;
    vibes: VibeReference[];
    normalizeVibeStrength: boolean;
    characterReferences: CharacterReference[];
}

export type DropReason =
    | 'unsupported-by-model'
    | 'not-applicable-to-mode'
    | 'feature-flag-off'
    | 'exceeds-model-limit'
    | 'empty'
    | 'superseded';

/** A field removed from the payload, shown in the inspector. */
export interface DroppedField {
    path: string;
    reason: DropReason;
    /** True when the user explicitly asked for the value (worth highlighting). */
    userSet: boolean;
}

export type WarningCode =
    | 'size-rounded'
    | 'steps-clamped'
    | 'samples-clamped'
    | 'sampler-replaced'
    | 'noise-schedule-forced'
    | 'coords-disabled'
    | 'decrisper-disabled'
    | 'legacy-uc-disabled'
    | 'inpaint-model-fallback';

export interface Warning {
    code: WarningCode;
    params?: Record<string, string | number>;
}
