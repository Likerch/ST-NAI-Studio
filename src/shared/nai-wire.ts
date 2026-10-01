// Wire format of the NovelAI image API as confirmed in docs/RECON.md §3.
// Types only: shared by the domain (which builds requests) and the transport (which sends them).

export interface NaiPoint {
    x: number;
    y: number;
}

export interface NaiCharCaption {
    char_caption: string;
    centers: NaiPoint[];
}

export interface NaiV4Caption {
    base_caption: string;
    char_captions: NaiCharCaption[];
}

export interface NaiV4Prompt {
    caption: NaiV4Caption;
    use_coords: boolean;
    use_order: boolean;
}

export interface NaiV4NegativePrompt {
    caption: NaiV4Caption;
    legacy_uc: boolean;
}

export interface NaiCharacterPrompt {
    prompt: string;
    uc: string;
    center: NaiPoint;
    enabled: boolean;
}

export interface NaiDirectorReferenceDescription {
    caption: { base_caption: string; char_captions: NaiCharCaption[] };
    legacy_uc: boolean;
}

export type NaiAction = 'generate' | 'img2img' | 'infill';

/** `parameters` of POST /ai/generate-image. Open-ended because raw-override may add anything. */
export interface NaiParameters {
    width: number;
    height: number;
    seed: number;
    n_samples: number;
    steps: number;
    scale: number;
    sampler: string;
    negative_prompt: string;
    noise_schedule?: string;
    sm?: boolean;
    sm_dyn?: boolean;
    dynamic_thresholding?: boolean;
    skip_cfg_above_sigma?: number | null;
    cfg_rescale?: number;
    image?: string;
    mask?: string;
    strength?: number;
    noise?: number;
    image_format?: 'webp' | 'png';
    stream?: 'msgpack' | 'sse';
    characterPrompts?: NaiCharacterPrompt[];
    v4_prompt?: NaiV4Prompt;
    v4_negative_prompt?: NaiV4NegativePrompt;
    [key: string]: unknown;
}

export interface NaiImageRequest {
    input: string;
    model: string;
    action: NaiAction;
    parameters: NaiParameters;
    use_new_shared_trial: boolean;
    [key: string]: unknown;
}

/** GET /user/subscription (image.novelai.net), fields we rely on. */
export interface NaiSubscription {
    tier: number;
    active: boolean;
    expiresAt?: number;
    trainingStepsLeft?: {
        fixedTrainingStepsLeft: number;
        purchasedTrainingSteps: number;
    };
    usage?: {
        percent: number;
        isNegative: boolean;
        timeUntilNextPercent: number;
    };
    perks?: Record<string, unknown>;
}

/** Error body returned by NovelAI: `{statusCode, message}`. */
export interface NaiErrorBody {
    statusCode?: number;
    message?: string;
    details?: unknown;
}
