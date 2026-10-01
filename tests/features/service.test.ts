import { describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { accountFromSubscription, UNKNOWN_ACCOUNT } from '../../src/features/generation/account';
import { randomSeed, requestFromSettings, resolveSeed } from '../../src/features/generation/form';
import { prepareGeneration, sendPrepared } from '../../src/features/generation/service';
import { TransportError } from '../../src/transport';
import type { Transport } from '../../src/transport';
import { createNativeTransport } from '../../src/transport/st-native';

const OPUS = accountFromSubscription({
    tier: 3,
    active: true,
    trainingStepsLeft: { fixedTrainingStepsLeft: 9646, purchasedTrainingSteps: 4 },
    usage: { percent: 100, isNegative: false, timeUntilNextPercent: 7888 },
});

function fakeTransport(
    generate = vi.fn(async () => ({ images: [{ base64: 'iVBOR', mime: 'image/png' as const, index: 0 }] })),
): Transport {
    return {
        id: 'plugin',
        features: createNativeTransport({ fetch, headers: () => ({}) }).features,
        generate,
        subscription: vi.fn(),
        effectiveRequest: (body) => ({ body, lost: [] }),
    };
}

function settingsWith(patch: (s: NaiStudioSettings) => void): NaiStudioSettings {
    const s = defaultSettings();
    s.generation.prompt = 'cat';
    patch(s);
    return s;
}

describe('account', () => {
    it('sums fixed and purchased Anlas and clamps usage like the web client', () => {
        expect(OPUS).toMatchObject({ tier: 3, active: true, anlas: 9650, usagePercent: 100, usageNegative: false });
        expect(
            accountFromSubscription({
                tier: 3,
                active: true,
                usage: { percent: 140, isNegative: true, timeUntilNextPercent: 0 },
            }).usagePercent,
        ).toBe(0);
        expect(accountFromSubscription({ tier: 1, active: false }).usagePercent).toBeNull();
    });
});

describe('form', () => {
    it('resolves -1 to a random seed in range and keeps explicit seeds', () => {
        expect(resolveSeed(42)).toBe(42);
        expect(resolveSeed(-1, () => 0.5)).toBe(2 ** 31 - 1);
        expect(randomSeed(() => 0)).toBe(0);
        expect(resolveSeed(2 ** 33, () => 0.25)).toBe(2 ** 30 - 1);
    });

    it('falls back on unknown enum values from stored settings', () => {
        const g = {
            ...defaultSettings().generation,
            model: 'nai-diffusion-9',
            sampler: 'weird',
            ucPreset: 'x',
            qualityPreset: 'y',
            dataset: 'z',
            noiseSchedule: 'w',
            steps: Number.NaN,
        };
        const req = requestFromSettings(g, 1);
        expect(req).toMatchObject({
            model: 'nai-diffusion-4-5-full',
            sampler: 'k_euler_ancestral',
            ucPreset: 'heavy',
            qualityPreset: 'standard',
            dataset: 'none',
            noiseSchedule: 'karras',
            steps: 23,
        });
        const withChars = requestFromSettings(
            { ...g, characters: [{ prompt: 'a', negative: 'b', x: 0.1, y: 0.9, enabled: true }] },
            1,
        );
        expect(withChars.characters).toEqual([
            { prompt: 'a', negative: 'b', center: { x: 0.1, y: 0.9 }, enabled: true },
        ]);
    });
});

describe('prepareGeneration', () => {
    it('free request on Opus: no blockers, cost 0, retryable', async () => {
        const transport = fakeTransport();
        const prepared = prepareGeneration({
            settings: settingsWith(() => {}),
            transport,
            account: OPUS,
            random: () => 0.1,
        });
        expect(prepared.cost.total).toBe(0);
        expect(prepared.blockers).toEqual([]);
        await sendPrepared(prepared, transport, OPUS);
        expect(transport.generate).toHaveBeenCalledWith(
            prepared.body,
            expect.objectContaining({ endpoint: 'generate', retryable: true }),
        );
    });

    it('free-only clamps a paid request into the free tier', () => {
        const prepared = prepareGeneration({
            settings: settingsWith((s) => {
                s.generation.steps = 40;
                s.generation.width = 1024;
                s.generation.height = 1536;
            }),
            transport: fakeTransport(),
            account: OPUS,
        });
        expect(prepared.clampChanges.map((c) => c.kind)).toEqual(['steps', 'size']);
        expect(prepared.cost.total).toBe(0);
    });

    it('free-only never lets a paid request through (unknown balance or not Opus)', async () => {
        const transport = fakeTransport();
        const prepared = prepareGeneration({ settings: settingsWith(() => {}), transport, account: UNKNOWN_ACCOUNT });
        expect(prepared.blockers[0]).toMatchObject({ kind: 'free-only' });
        await expect(sendPrepared(prepared, transport, UNKNOWN_ACCOUNT)).rejects.toMatchObject({
            code: 'free-only-blocked',
        });
        expect(transport.generate).not.toHaveBeenCalled();
    });

    it('paid request without free-only is sent as not retryable', async () => {
        const transport = fakeTransport();
        const prepared = prepareGeneration({
            settings: settingsWith((s) => {
                s.anlas.freeOnly = false;
                s.generation.steps = 40;
            }),
            transport,
            account: OPUS,
        });
        expect(prepared.cost.total).toBeGreaterThan(0);
        await sendPrepared(prepared, transport, OPUS);
        expect(transport.generate).toHaveBeenCalledWith(prepared.body, expect.objectContaining({ retryable: false }));
    });

    it('applies raw override last and blocks invalid override JSON', async () => {
        const transport = fakeTransport();
        const ok = prepareGeneration({
            settings: settingsWith((s) => {
                s.rawOverride = { enabled: true, json: '{"parameters":{"steps":12}}' };
            }),
            transport,
            account: OPUS,
        });
        expect(ok.body.parameters.steps).toBe(12);
        expect(ok.build.body.parameters.steps).toBe(23);
        expect(ok.overridePaths).toEqual(['parameters.steps']);

        const bad = prepareGeneration({
            settings: settingsWith((s) => (s.rawOverride = { enabled: true, json: '{oops' })),
            transport,
            account: OPUS,
        });
        expect(bad.blockers[0]).toMatchObject({ kind: 'override' });
        await expect(sendPrepared(bad, transport, OPUS)).rejects.toMatchObject({ code: 'invalid-override' });
    });

    it('blocks requests above the per-image price limit', async () => {
        const transport = fakeTransport();
        const prepared = prepareGeneration({
            settings: settingsWith((s) => {
                s.anlas.freeOnly = false;
                s.generation.model = 'nai-diffusion-5-full';
                s.generation.width = 1792;
                s.generation.height = 1728;
                s.generation.steps = 50;
            }),
            transport,
            account: OPUS,
        });
        await expect(sendPrepared(prepared, transport, OPUS)).rejects.toMatchObject({ code: 'price-too-high' });
    });

    it('converts transport failures with model context', async () => {
        const transport = fakeTransport(vi.fn(async () => Promise.reject(new TransportError('http', { status: 500 }))));
        const prepared = prepareGeneration({
            settings: settingsWith((s) => (s.generation.model = 'nai-diffusion-5-full')),
            transport,
            account: OPUS,
        });
        await expect(sendPrepared(prepared, transport, OPUS)).rejects.toMatchObject({ code: 'build-error-v4' });
    });
});
