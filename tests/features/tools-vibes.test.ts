// Phase 5 features with mocked SillyTavern: the Anlas guard of paid tools and the vibe provider
// (re-using a vibe never pays twice: browser cache, then plugin cache, then a paid encode).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { getCapabilities } from '../../src/domain';
import type { Transport, TransportExtras } from '../../src/transport';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    store: new Map<string, unknown>(),
    images: new Map<string, unknown>(),
}));

function memoryStore(map: Map<string, unknown>) {
    return {
        getItem: async (key: string) => (map.has(key) ? map.get(key) : null),
        setItem: async (key: string, value: unknown) => void map.set(key, value),
        removeItem: async (key: string) => void map.delete(key),
        keys: async () => [...map.keys()],
    };
}

vi.mock('../../src/core/settings', () => ({
    settings: () => state.settings,
    saveSettings: vi.fn(),
}));
vi.mock('../../src/core/storage', () => ({
    store: () => memoryStore(state.store),
    imageStore: () => memoryStore(state.images),
}));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        groupId: null,
        characterId: '0',
        characters: [{ avatar: 'lyra.png' }],
        groups: [],
        getCurrentChatId: () => 'chat-1',
        uuidv4: () => 'id-1',
    }),
    importHost: vi.fn(),
}));
vi.mock('../../src/features/images/image-utils', () => ({
    blobToBase64: async (blob: Blob) => btoa(await blob.text()),
    toPngBlob: async (blob: Blob) => blob,
    thumbnail: async (blob: Blob) => blob,
}));

const { guardCost } = await import('../../src/features/tools/tool-common');
const { addVibe, ENCODE_PRICE, VibeLibraryProvider } = await import('../../src/features/vibes/vibe-library');

function transportWith(extras: Partial<TransportExtras> | undefined, vibes = true): Transport {
    return {
        id: 'plugin',
        features: { vibes } as Transport['features'],
        generate: vi.fn(),
        subscription: vi.fn(),
        effectiveRequest: (body) => ({ body, lost: [] }),
        extras: extras as TransportExtras | undefined,
    };
}

async function oneGlobalVibe(): Promise<void> {
    const item = await addVibe(new Blob(['reference-image']), 'forest');
    state.settings.vibes.sets.push({
        id: 'set-1',
        name: 'Set',
        enabled: true,
        global: true,
        entries: [{ vibeId: item.id, strength: 0.6, informationExtracted: 1, enabled: true }],
        bindings: { characters: [], chats: [], styles: [] },
    });
}

beforeEach(() => {
    state.settings = defaultSettings();
    state.store.clear();
    state.images.clear();
});

describe('guardCost', () => {
    it('lets free calls through without asking', async () => {
        const confirm = vi.fn(async () => true);
        await expect(guardCost(0, 'x', confirm)).resolves.toBeUndefined();
        expect(confirm).not.toHaveBeenCalled();
    });

    it('blocks every paid call in free-only mode (the default)', async () => {
        expect(state.settings.anlas.freeOnly).toBe(true);
        await expect(
            guardCost(
                2,
                'upscale',
                vi.fn(async () => true),
            ),
        ).rejects.toMatchObject({
            code: 'free-only-blocked',
        });
    });

    it('asks above the threshold and aborts when declined', async () => {
        state.settings.anlas.freeOnly = false;
        state.settings.anlas.confirmAbove = 0;
        await expect(
            guardCost(
                65,
                'bg',
                vi.fn(async () => false),
            ),
        ).rejects.toMatchObject({ code: 'aborted' });
        const confirm = vi.fn(async () => true);
        await guardCost(65, 'bg', confirm);
        expect(confirm).toHaveBeenCalledWith(65, 'bg');
        state.settings.anlas.confirmAbove = 100;
        const silent = vi.fn(async () => true);
        await guardCost(65, 'bg', silent);
        expect(silent).not.toHaveBeenCalled();
    });
});

describe('VibeLibraryProvider', () => {
    const v45 = getCapabilities('nai-diffusion-4-5-full');

    it('pays for the first use only; the second use comes from the browser cache', async () => {
        state.settings.anlas.freeOnly = false;
        await oneGlobalVibe();
        const encodeVibe = vi.fn<TransportExtras['encodeVibe']>(async () => ({ encoding: 'ENC', cached: false }));
        const lookupVibes = vi.fn(async () => [null]);
        const confirm = vi.fn(async () => true);
        const notify = vi.fn();
        const provider = new VibeLibraryProvider(confirm, notify);
        const transport = transportWith({ encodeVibe, lookupVibes });

        const first = await provider.prepare(v45, transport);
        expect(first).toEqual([{ data: 'ENC', strength: 0.6, informationExtracted: 1 }]);
        expect(confirm).toHaveBeenCalledWith(ENCODE_PRICE, 'vibes');
        expect(encodeVibe).toHaveBeenCalledTimes(1);
        // The stored PNG is sent unchanged, so the plugin hashes the same bytes as the lookup.
        expect(encodeVibe.mock.calls[0]![0]).toMatchObject({ image: btoa('reference-image') });
        expect(notify).toHaveBeenCalledWith({ kind: 'encoded', count: 1, cost: ENCODE_PRICE });

        const second = await provider.prepare(v45, transport);
        expect(second).toEqual(first);
        expect(encodeVibe).toHaveBeenCalledTimes(1);
        expect(lookupVibes).toHaveBeenCalledTimes(1);
    });

    it('takes the encoding from the plugin cache without paying', async () => {
        state.settings.anlas.freeOnly = false;
        await oneGlobalVibe();
        const encodeVibe = vi.fn();
        const provider = new VibeLibraryProvider(vi.fn(), vi.fn());
        const refs = await provider.prepare(v45, transportWith({ encodeVibe, lookupVibes: async () => ['DISK'] }));
        expect(refs[0]?.data).toBe('DISK');
        expect(encodeVibe).not.toHaveBeenCalled();
        expect([...state.store.values()]).toContain('DISK');
    });

    it('skips paid encoding in free-only mode and when declined', async () => {
        await oneGlobalVibe();
        const encodeVibe = vi.fn();
        const notify = vi.fn();
        const transport = transportWith({ encodeVibe, lookupVibes: async () => [null] });
        expect(await new VibeLibraryProvider(vi.fn(), notify).prepare(v45, transport)).toEqual([]);
        expect(notify).toHaveBeenCalledWith({ kind: 'skipped', count: 1, reason: 'free-only' });

        state.settings.anlas.freeOnly = false;
        expect(await new VibeLibraryProvider(async () => false, notify).prepare(v45, transport)).toEqual([]);
        expect(notify).toHaveBeenCalledWith({ kind: 'skipped', count: 1, reason: 'declined' });
        expect(encodeVibe).not.toHaveBeenCalled();
    });

    it('leaves out vibes not encoded yet when a request must stay free (0.15), using encoded ones', async () => {
        state.settings.anlas.freeOnly = false;
        state.settings.vibes.confirmEncoding = false;
        await oneGlobalVibe();
        const encodeVibe = vi.fn();
        const confirm = vi.fn(async () => true);
        const notify = vi.fn();
        const provider = new VibeLibraryProvider(confirm, notify);
        const missing = transportWith({ encodeVibe, lookupVibes: async () => [null] });
        expect(await provider.prepare(v45, missing, undefined, [], {}, { encode: false })).toEqual([]);
        expect(encodeVibe).not.toHaveBeenCalled();
        expect(confirm).not.toHaveBeenCalled();
        expect(notify).not.toHaveBeenCalled();
        // An encoding the plugin already keeps costs nothing and is used.
        const disk = transportWith({ encodeVibe, lookupVibes: async () => ['DISK'] });
        const refs = await provider.prepare(v45, disk, undefined, [], {}, { encode: false });
        expect(refs[0]?.data).toBe('DISK');
        expect(encodeVibe).not.toHaveBeenCalled();
    });

    it('does not count a plugin-side cache hit as spent Anlas', async () => {
        state.settings.anlas.freeOnly = false;
        await oneGlobalVibe();
        const notify = vi.fn();
        const provider = new VibeLibraryProvider(async () => true, notify);
        await provider.prepare(
            v45,
            transportWith({
                encodeVibe: async () => ({ encoding: 'E', cached: true }),
                lookupVibes: async () => [null],
            }),
        );
        expect(notify).not.toHaveBeenCalledWith(expect.objectContaining({ kind: 'encoded' }));
    });

    it('says once that V5 vibes are behind the feature flag, and sends none', async () => {
        await oneGlobalVibe();
        const notify = vi.fn();
        const provider = new VibeLibraryProvider(vi.fn(), notify);
        const v5 = getCapabilities('nai-diffusion-5-full');
        expect(await provider.prepare(v5, transportWith({}))).toEqual([]);
        expect(await provider.prepare(v5, transportWith({}))).toEqual([]);
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith({ kind: 'unavailable', reason: 'feature-flag-off', count: 1 });
    });

    it('sends V3 vibes as raw 448x448 images without encoding', async () => {
        await oneGlobalVibe();
        const refs = await new VibeLibraryProvider(vi.fn(), vi.fn()).prepare(
            getCapabilities('nai-diffusion-3'),
            transportWith(undefined),
        );
        expect(refs).toEqual([{ data: btoa('reference-image'), strength: 0.6, informationExtracted: 1 }]);
    });
});
