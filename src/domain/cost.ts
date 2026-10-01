// Anlas pricing exactly as the NovelAI web client computes it (RECON §3.10, bundle:1601@42569).
// Verified live: 24 free generations cost 0; upscale 1, encode-vibe 2, bg-removal 65 matched.
// Known deviation: the server charges character references less than this formula (RECON P-25),
// so estimates for them err on the safe (higher) side.
import { getCapabilities, getInpaintCapabilities } from './capabilities';
import type { ModelCapabilities } from './capabilities';
import type { GenerationRequest } from './types';

export const OPUS_TIER = 3;
export const FREE_MAX_PIXELS = 1048576;
export const FREE_MAX_STEPS = 28;
export const MAX_PRICE_PER_IMAGE = 140;
export const ENCODE_VIBE_PRICE = 2;
export const CHARACTER_REFERENCE_PRICE = 5;
const FREE_VIBES = 4;
const EXTRA_VIBE_PRICE = 2;

export interface AccountState {
    tier: number;
    active: boolean;
    /** Opus V5 usage limit is exhausted. */
    usageNegative: boolean;
    /** fixedTrainingStepsLeft + purchasedTrainingSteps. */
    anlas: number;
}

export interface CostEstimate {
    /** Anlas per billable image. */
    perImage: number;
    billableSamples: number;
    freeSamples: number;
    /** Vibe encodings and character references. */
    extras: number;
    total: number;
    /** NovelAI rejects requests above 140 Anlas per image. */
    invalid: boolean;
    /** Why the free sample was not granted (empty when it was). */
    notFreeReasons: NotFreeReason[];
}

export type NotFreeReason =
    'not-opus' | 'inactive' | 'too-many-pixels' | 'too-many-steps' | 'character-reference' | 'v5-usage-exhausted';

export interface PricingOptions {
    /** Vibes that still need encoding (each costs 2). */
    unencodedVibes?: number;
}

/** Model whose capabilities drive the price: inpaint uses the mapped inpaint model. */
function pricingCaps(req: Pick<GenerationRequest, 'model' | 'mode'>): ModelCapabilities {
    return req.mode === 'inpaint' ? getInpaintCapabilities(req.model) : getCapabilities(req.model);
}

export function basePricePerImage(
    width: number,
    height: number,
    steps: number,
    sm: boolean,
    smDyn: boolean,
    priceMultiplier: number,
    strengthFactor: number,
): number {
    const pixels = width * height;
    const smeaFactor = sm && smDyn ? 1.4 : sm ? 1.2 : 1;
    const per =
        Math.ceil(2.951823174884865e-6 * pixels + 5.753298233447344e-7 * pixels * steps) * smeaFactor * priceMultiplier;
    return Math.max(Math.ceil(per * strengthFactor), 2);
}

export function freeSampleReasons(
    req: Pick<GenerationRequest, 'width' | 'height' | 'steps' | 'characterReferences'>,
    caps: Pick<ModelCapabilities, 'usageLimit'>,
    account: AccountState,
): NotFreeReason[] {
    const reasons: NotFreeReason[] = [];
    if (account.tier < OPUS_TIER) reasons.push('not-opus');
    if (!account.active) reasons.push('inactive');
    if (req.width * req.height > FREE_MAX_PIXELS) reasons.push('too-many-pixels');
    if (req.steps > FREE_MAX_STEPS) reasons.push('too-many-steps');
    if (req.characterReferences.length > 0) reasons.push('character-reference');
    if (caps.usageLimit && account.usageNegative) reasons.push('v5-usage-exhausted');
    return reasons;
}

/** SMEA as it ends up in the payload: auto-SMEA on V3, always off with a source image. */
function effectiveSmea(req: GenerationRequest, caps: ModelCapabilities): { sm: boolean; smDyn: boolean } {
    if (!caps.smea || req.mode !== 'txt2img') {
        return { sm: false, smDyn: false };
    }
    const sm =
        req.autoSmea && caps.autoSmeaThreshold !== null ? req.width * req.height >= caps.autoSmeaThreshold : req.smea;
    return { sm, smDyn: sm && caps.smeaDyn && req.smeaDyn };
}

export function estimateGenerationCost(
    req: GenerationRequest,
    account: AccountState,
    options: PricingOptions = {},
): CostEstimate {
    const caps = pricingCaps(req);
    const { sm, smDyn } = effectiveSmea(req, caps);
    const strengthFactor = req.mode === 'inpaint' ? req.inpaintStrength : req.mode === 'img2img' ? req.strength : 1;
    const perImage = basePricePerImage(
        req.width,
        req.height,
        req.steps,
        sm,
        smDyn,
        caps.priceMultiplier,
        strengthFactor,
    );
    const notFreeReasons = freeSampleReasons(req, caps, account);
    const freeSamples = notFreeReasons.length === 0 ? 1 : 0;
    const billableSamples = Math.max(0, req.samples - freeSamples);

    let extras = 0;
    const referencesActive =
        req.characterReferences.length > 0 &&
        caps.characterReference &&
        (req.mode !== 'inpaint' || caps.characterReferenceInpaint);
    if (req.vibes.length > 0 && caps.vibeKind === 'encoded' && !referencesActive && req.mode !== 'inpaint') {
        extras += (options.unencodedVibes ?? 0) * ENCODE_VIBE_PRICE;
        extras += Math.max(0, req.vibes.length - FREE_VIBES) * EXTRA_VIBE_PRICE;
    }
    if (referencesActive) {
        extras += CHARACTER_REFERENCE_PRICE * req.characterReferences.length * req.samples;
    }

    const invalid = perImage > MAX_PRICE_PER_IMAGE;
    return {
        perImage,
        billableSamples,
        freeSamples,
        extras,
        total: perImage * billableSamples + extras,
        invalid,
        notFreeReasons,
    };
}

/** Upscale price by source area (bundle:1601@43991). Null = source too large. No free mode. */
export function upscaleCost(width: number, height: number): number | null {
    const pixels = width * height;
    const tiers: [number, number][] = [
        [1048576, 1],
        [1747627, 2],
        [2446678, 3],
        [3145728, 4],
    ];
    for (const [limit, price] of tiers) {
        if (pixels > 0 && pixels <= limit) return price;
    }
    return null;
}

export type DirectorTool =
    'lineart' | 'sketch' | 'colorize' | 'emotion' | 'declutter' | 'declutter-keep-bubbles' | 'bg-removal';

/** Director tools are priced as Anime V3 at 28 steps; bg-removal is 3x + 5 and never free. */
export function directorToolCost(tool: DirectorTool, width: number, height: number, account: AccountState): number {
    const base = basePricePerImage(width, height, 28, false, false, 1, 1);
    if (tool === 'bg-removal') {
        return 3 * base + 5;
    }
    const free = account.tier >= OPUS_TIER && account.active && width * height <= FREE_MAX_PIXELS;
    return free ? 0 : base;
}

export interface FreeClampResult {
    request: GenerationRequest;
    changes: FreeClampChange[];
    /** False when no adjustment can make the request free (e.g. not Opus, V5 usage exhausted). */
    possible: boolean;
    blockers: NotFreeReason[];
}

export type FreeClampChange =
    | { kind: 'steps'; from: number; to: number }
    | { kind: 'size'; from: string; to: string }
    | { kind: 'samples'; from: number; to: number }
    | { kind: 'character-references-removed'; count: number }
    | { kind: 'vibes-trimmed'; from: number; to: number };

/** "Free only" mode: squeezes steps, size and samples into Opus free limits (TZ Phase 1, task 7). */
export function clampToFree(
    req: GenerationRequest,
    account: AccountState,
    options: PricingOptions = {},
): FreeClampResult {
    const r: GenerationRequest = { ...req };
    const changes: FreeClampChange[] = [];

    if (r.steps > FREE_MAX_STEPS) {
        changes.push({ kind: 'steps', from: r.steps, to: FREE_MAX_STEPS });
        r.steps = FREE_MAX_STEPS;
    }
    if (r.width * r.height > FREE_MAX_PIXELS) {
        const ratio = Math.sqrt(FREE_MAX_PIXELS / (r.width * r.height));
        let w = Math.max(64, Math.floor((r.width * ratio) / 64) * 64);
        let h = Math.max(64, Math.floor((r.height * ratio) / 64) * 64);
        while (w * h > FREE_MAX_PIXELS) {
            if (w >= h) w -= 64;
            else h -= 64;
        }
        changes.push({ kind: 'size', from: `${r.width}x${r.height}`, to: `${w}x${h}` });
        r.width = w;
        r.height = h;
    }
    if (r.samples > 1) {
        changes.push({ kind: 'samples', from: r.samples, to: 1 });
        r.samples = 1;
    }
    if (r.characterReferences.length > 0) {
        changes.push({ kind: 'character-references-removed', count: r.characterReferences.length });
        r.characterReferences = [];
    }
    if (r.vibes.length > FREE_VIBES) {
        changes.push({ kind: 'vibes-trimmed', from: r.vibes.length, to: FREE_VIBES });
        r.vibes = r.vibes.slice(0, FREE_VIBES);
    }

    const estimate = estimateGenerationCost(r, account, options);
    const blockers = estimate.notFreeReasons;
    const possible = estimate.total === 0 && !estimate.invalid;
    return { request: r, changes, possible, blockers };
}
