import { describe, expect, it } from 'vitest';
import {
    basePricePerImage,
    clampToFree,
    defaultRequest,
    directorToolCost,
    estimateGenerationCost,
    upscaleCost,
} from '../../src/domain';
import type { AccountState, GenerationRequest, ModelId } from '../../src/domain';

const OPUS: AccountState = { tier: 3, active: true, usageNegative: false, anlas: 9646 };
const SCROLL: AccountState = { tier: 2, active: true, usageNegative: false, anlas: 1000 };

function req(model: ModelId, patch: Partial<GenerationRequest> = {}): GenerationRequest {
    return { ...defaultRequest(model), prompt: 'x', seed: 1, ...patch };
}

describe('price per image (bundle:1601@42569, RECON §3.10 table)', () => {
    it.each([
        ['nai-diffusion-4-5-full', 832, 1216, 23, 17],
        ['nai-diffusion-5-full', 832, 1216, 23, 26],
        ['nai-diffusion-4-5-full', 832, 1216, 28, 20],
        ['nai-diffusion-5-full', 832, 1216, 28, 30],
        ['nai-diffusion-4-5-full', 1024, 1536, 28, 30],
        ['nai-diffusion-5-full', 1024, 1536, 28, 45],
    ] as const)('%s %ix%i %i steps = %i', (model, width, height, steps, expected) => {
        const estimate = estimateGenerationCost(req(model, { width, height, steps }), SCROLL);
        expect(estimate.perImage).toBe(expected);
        expect(estimate.total).toBe(expected);
    });

    it('applies the SMEA factors on V3', () => {
        expect(basePricePerImage(832, 1216, 23, true, false, 1, 1)).toBe(21);
        expect(basePricePerImage(832, 1216, 23, true, true, 1, 1)).toBe(24);
        expect(estimateGenerationCost(req('nai-diffusion-3', { smea: true, autoSmea: false }), SCROLL).perImage).toBe(
            21,
        );
        expect(
            estimateGenerationCost(req('nai-diffusion-3', { width: 1536, height: 1472, steps: 23 }), SCROLL).perImage,
        ).toBe(basePricePerImage(1536, 1472, 23, true, false, 1, 1));
    });

    it('scales by img2img strength and never goes below 2', () => {
        expect(
            estimateGenerationCost(req('nai-diffusion-5-full', { mode: 'img2img', strength: 0.7 }), SCROLL).perImage,
        ).toBe(18);
        expect(basePricePerImage(64, 64, 1, false, false, 1, 0.01)).toBe(2);
    });

    it('prices V5 Curated inpaint as V4.5 (mapped inpaint model)', () => {
        const estimate = estimateGenerationCost(
            req('nai-diffusion-5-curated', { mode: 'inpaint', inpaintStrength: 1 }),
            SCROLL,
        );
        expect(estimate.perImage).toBe(17);
    });

    it('flags requests above 140 Anlas per image as invalid', () => {
        expect(
            estimateGenerationCost(req('nai-diffusion-5-full', { width: 1792, height: 1728, steps: 50 }), SCROLL)
                .invalid,
        ).toBe(true);
    });
});

describe('Opus free sample', () => {
    it('one sample is free at <= 1 MP and <= 28 steps', () => {
        const estimate = estimateGenerationCost(req('nai-diffusion-4-5-full', { steps: 28 }), OPUS);
        expect(estimate).toMatchObject({ total: 0, freeSamples: 1, notFreeReasons: [] });
        const two = estimateGenerationCost(req('nai-diffusion-4-5-full', { samples: 2 }), OPUS);
        expect(two.total).toBe(17);
    });

    it('lists every reason that blocks the free sample', () => {
        const estimate = estimateGenerationCost(
            req('nai-diffusion-5-full', {
                width: 1024,
                height: 1536,
                steps: 29,
                characterReferences: [
                    { image: 'x', description: 'character', strength: 1, fidelity: 1, informationExtracted: 1 },
                ],
            }),
            { tier: 1, active: false, usageNegative: true, anlas: 0 },
        );
        expect(estimate.notFreeReasons).toEqual([
            'not-opus',
            'inactive',
            'too-many-pixels',
            'too-many-steps',
            'character-reference',
            'v5-usage-exhausted',
        ]);
    });

    it('V5 needs the usage limit not exhausted, V4.5 does not', () => {
        const exhausted = { ...OPUS, usageNegative: true };
        expect(estimateGenerationCost(req('nai-diffusion-5-full'), exhausted).total).toBe(26);
        expect(estimateGenerationCost(req('nai-diffusion-4-5-full'), exhausted).total).toBe(0);
    });

    it('adds vibe and character reference extras', () => {
        const vibes = Array.from({ length: 6 }, () => ({ data: 'x', strength: 0.5, informationExtracted: 1 }));
        expect(
            estimateGenerationCost(req('nai-diffusion-4-5-full', { vibes }), OPUS, { unencodedVibes: 2 }).extras,
        ).toBe(4 + 4);
        const ref = {
            image: 'x',
            description: 'character' as const,
            strength: 1,
            fidelity: 1,
            informationExtracted: 1,
        };
        // Client formula: no free sample with a reference + 5 per reference per sample (server charged 5 in p4).
        expect(
            estimateGenerationCost(
                req('nai-diffusion-4-5-full', { width: 512, height: 768, characterReferences: [ref] }),
                OPUS,
            ).total,
        ).toBe(12);
        expect(estimateGenerationCost(req('nai-diffusion-3', { vibes }), OPUS, { unencodedVibes: 2 }).extras).toBe(0);
    });
});

describe('other endpoints (verified live in Phase 0)', () => {
    it('upscale: 1 Anlas for 832x1216 (p1), null when too large', () => {
        expect(upscaleCost(832, 1216)).toBe(1);
        expect(upscaleCost(1024, 1536)).toBe(2);
        expect(upscaleCost(1472, 1472)).toBe(3);
        expect(upscaleCost(1536, 2048)).toBe(4);
        expect(upscaleCost(2048, 2048)).toBeNull();
        expect(upscaleCost(0, 0)).toBeNull();
    });

    it('director tools: free for Opus at 1 MP, bg-removal 65 (p5)', () => {
        expect(directorToolCost('lineart', 832, 1216, OPUS)).toBe(0);
        expect(directorToolCost('lineart', 832, 1216, SCROLL)).toBe(20);
        expect(directorToolCost('bg-removal', 832, 1216, OPUS)).toBe(65);
    });
});

describe('free-only mode', () => {
    it('clamps steps, size and samples into free limits', () => {
        const result = clampToFree(
            req('nai-diffusion-4-5-full', { width: 1024, height: 1536, steps: 40, samples: 3 }),
            OPUS,
        );
        expect(result.request).toMatchObject({ steps: 28, samples: 1 });
        expect(result.request.width * result.request.height).toBeLessThanOrEqual(1048576);
        expect(result.request.width % 64).toBe(0);
        expect(result.possible).toBe(true);
        expect(result.changes.map((c) => c.kind)).toEqual(['steps', 'size', 'samples']);
    });

    it('removes character references and trims vibes', () => {
        const ref = {
            image: 'x',
            description: 'character' as const,
            strength: 1,
            fidelity: 1,
            informationExtracted: 1,
        };
        const vibes = Array.from({ length: 6 }, () => ({ data: 'x', strength: 0.5, informationExtracted: 1 }));
        const result = clampToFree(req('nai-diffusion-4-5-full', { characterReferences: [ref], vibes }), OPUS);
        expect(result.request.characterReferences).toEqual([]);
        expect(result.request.vibes).toHaveLength(4);
        expect(result.possible).toBe(true);
    });

    it('reports impossible when the account cannot get free images', () => {
        expect(clampToFree(req('nai-diffusion-4-5-full'), SCROLL)).toMatchObject({
            possible: false,
            blockers: ['not-opus'],
        });
        expect(clampToFree(req('nai-diffusion-5-full'), { ...OPUS, usageNegative: true })).toMatchObject({
            possible: false,
            blockers: ['v5-usage-exhausted'],
        });
    });

    it('keeps a free request unchanged', () => {
        const result = clampToFree(req('nai-diffusion-4-5-full'), OPUS);
        expect(result.changes).toEqual([]);
        expect(result.possible).toBe(true);
    });
});
