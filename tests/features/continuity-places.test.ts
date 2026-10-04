// Location continuity by Maestro place id (v0.10) with mocked SillyTavern and a MAESTRO_PLACES
// double: references go under "place:<id>", references bound under a name are still found and move
// to the id key on the next save, the place the story enters becomes current; without
// MAESTRO_PLACES the name keys of before are used.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    meta: {} as Record<string, unknown>,
    chatId: 'chat-1' as string | undefined,
    fetched: [] as string[],
    removedVibes: [] as string[],
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings, saveSettings: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        chatMetadata: state.meta,
        saveMetadata: vi.fn(async () => undefined),
        getCurrentChatId: () => state.chatId,
    }),
}));
vi.mock('../../src/features/vibes/vibe-library', () => ({
    addVibe: vi.fn(async () => ({ id: 'vibe-new' })),
    removeVibe: vi.fn(async (id: string) => void state.removedVibes.push(id)),
}));
vi.mock('../../src/features/images/image-utils', () => ({
    blobToBase64: async () => 'BASE64',
    toPngBlob: async (blob: Blob) => blob,
}));

const continuity = await import('../../src/features/continuity/continuity-service');
const places = await import('../../src/features/continuity/places');

interface FakePlace {
    id: string;
    name: string;
    aliases: string[];
    parent: string | null;
}

const TAVERN: FakePlace = { id: 'pl1', name: 'Rusty Tavern', aliases: ['tavern', 'таверна'], parent: null };
const HARBOR: FakePlace = { id: 'pl2', name: 'Harbor', aliases: [], parent: null };

function installPlaces(list: FakePlace[] = [TAVERN, HARBOR]) {
    const listeners = new Set<(place: unknown, previous: unknown) => void>();
    const api = {
        version: 1,
        current: () => null,
        resolve: (label: string) =>
            list.find((p) => [p.name, ...p.aliases].some((n) => n.toLowerCase() === label.trim().toLowerCase())) ??
            null,
        list: () => list,
        onEnter: (listener: (place: unknown, previous: unknown) => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
    (globalThis as Record<string, unknown>).MAESTRO_PLACES = api;
    return { api, enter: (place: FakePlace | null) => listeners.forEach((l) => l(place, null)), listeners };
}

const data = () => continuity.continuityData();
const ref = {
    filePath: '/user/images/a.png',
    width: 832,
    height: 1216,
    model: 'nai-diffusion-4-5-full',
    seed: 1,
    prompt: 'p',
};

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.continuity.enabled = true;
    state.meta = {};
    state.chatId = 'chat-1';
    state.fetched = [];
    state.removedVibes = [];
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
            state.fetched.push(url);
            return { ok: true, blob: async () => new Blob(['img']) };
        }),
    );
});

afterEach(() => {
    places.unfollowPlaces();
    delete (globalThis as Record<string, unknown>).MAESTRO_PLACES;
    vi.unstubAllGlobals();
});

describe('continuity without MAESTRO_PLACES', () => {
    it('keeps the name keys of before', async () => {
        await continuity.setCurrentLocation('The Tavern');
        await continuity.bindLocation('The Tavern', ref);
        expect(data()).toEqual({
            current: 'The Tavern',
            locations: { 'the tavern': expect.objectContaining({ name: 'The Tavern', filePath: ref.filePath }) },
        });
        expect(data().locations['the tavern']).not.toHaveProperty('placeId');
        const service = new continuity.ContinuityService();
        expect(await service.prepare({ text: 'x', size: { width: 64, height: 64 }, caps: {} as never })).toEqual({
            image: 'BASE64',
            strength: 0.6,
        });
        expect(state.fetched).toEqual([ref.filePath]);
        await continuity.forgetLocation('The Tavern');
        expect(data()).toEqual({ current: '', locations: {} });
    });
});

describe('continuity with MAESTRO_PLACES', () => {
    it('binds references to the place id and finds them by any name of the place', async () => {
        installPlaces();
        await continuity.setCurrentLocation('таверна');
        expect(data()).toMatchObject({ current: 'таверна', currentPlace: 'pl1' });
        await continuity.bindLocation('таверна', ref);
        expect(Object.keys(data().locations)).toEqual(['place:pl1']);
        expect(data().locations['place:pl1']).toMatchObject({ placeId: 'pl1', name: 'таверна' });
        await continuity.setCurrentLocation('Rusty Tavern');
        expect(continuity.currentReference()?.filePath).toBe(ref.filePath);
        await continuity.setCurrentLocation('Harbor');
        expect(continuity.currentReference()).toBeNull();
    });

    it('still finds a reference bound under a name, and moves it to the id key on the next save', async () => {
        state.meta = {
            nai_studio: {
                continuity: {
                    current: 'Tavern',
                    locations: { tavern: { ...ref, name: 'Tavern', updatedAt: 'x' } },
                },
            },
        };
        installPlaces();
        // Found by the old name key before anything is saved.
        expect(continuity.currentReference()?.name).toBe('Tavern');
        await continuity.setCurrentLocation('Rusty Tavern');
        expect(Object.keys(data().locations)).toEqual(['place:pl1']);
        expect(data().locations['place:pl1']).toMatchObject({ name: 'Tavern', placeId: 'pl1' });
        expect(continuity.currentReference()?.filePath).toBe(ref.filePath);
    });

    it('drops the old name keys of a place when a new reference is bound, with their vibes', async () => {
        state.settings.continuity.mode = 'vibe';
        state.meta = {
            nai_studio: {
                continuity: {
                    current: '',
                    locations: {
                        'rusty tavern': { ...ref, name: 'Rusty Tavern', updatedAt: 'x', vibeId: 'vibe-old' },
                        harbor: { ...ref, name: 'Harbor', updatedAt: 'x' },
                    },
                },
            },
        };
        installPlaces();
        await continuity.bindLocation('Rusty Tavern', ref);
        expect(Object.keys(data().locations).sort()).toEqual(['harbor', 'place:pl1']);
        expect(data().locations['place:pl1']).toMatchObject({ vibeId: 'vibe-new', placeId: 'pl1' });
        expect(data()).toMatchObject({ current: 'Rusty Tavern', currentPlace: 'pl1' });
        expect(state.removedVibes).toEqual(['vibe-old']);
        await continuity.forgetLocation('Rusty Tavern');
        expect(Object.keys(data().locations)).toEqual(['harbor']);
        expect(state.removedVibes).toEqual(['vibe-old', 'vibe-new']);
    });

    it('follows the place the story enters, once per registry', async () => {
        const places1 = installPlaces();
        continuity.startPlaceFollowing();
        continuity.startPlaceFollowing();
        expect(places1.listeners.size).toBe(1);
        places1.enter(HARBOR);
        await vi.waitFor(() => expect(data()).toMatchObject({ current: 'Harbor', currentPlace: 'pl2' }));
        places1.enter(null);
        state.settings.continuity.enabled = false;
        places1.enter(TAVERN);
        await Promise.resolve();
        expect(data().current).toBe('Harbor');
        // A new registry object (Maestro reloaded) is followed instead of the old one.
        const places2 = installPlaces();
        continuity.startPlaceFollowing();
        expect(places1.listeners.size).toBe(0);
        expect(places2.listeners.size).toBe(1);
        continuity.stopPlaceFollowing();
        expect(places2.listeners.size).toBe(0);
    });

    it('takes a place id from a scene provider even for a name the registry does not know', async () => {
        await continuity.setCurrentLocation('Secret Cove', 'pl9');
        expect(data()).toMatchObject({ current: 'Secret Cove', currentPlace: 'pl9' });
        const service = new continuity.ContinuityService();
        service.observe(
            {
                images: [],
                meta: { requestType: 'txt2img', width: 1, height: 1, model: 'm', seed: 2, scenePrompt: 's' },
                mode: 0,
                chatId: 'chat-1',
            } as never,
            { target: 'message', paths: ['/user/images/b.png'] },
        );
        await vi.waitFor(() => expect(Object.keys(data().locations)).toEqual(['place:pl9']));
        // Text that names a stored location switches to it, with its place id.
        await continuity.setCurrentLocation('Elsewhere');
        expect(data().currentPlace).toBeUndefined();
        await service.prepare({
            text: 'They sail back to Secret Cove.',
            size: { width: 8, height: 8 },
            caps: {} as never,
        });
        expect(data()).toMatchObject({ current: 'Secret Cove', currentPlace: 'pl9' });
    });

    it('ignores a registry of another version or without its methods', () => {
        (globalThis as Record<string, unknown>).MAESTRO_PLACES = {
            version: 2,
            current() {},
            resolve() {},
            list() {},
            onEnter() {},
        };
        expect(places.maestroPlaces()).toBeNull();
        (globalThis as Record<string, unknown>).MAESTRO_PLACES = { version: 1, current() {} };
        expect(places.maestroPlaces()).toBeNull();
        expect(places.resolvePlace('Harbor')).toBeNull();
        expect(places.placeById('pl1')).toBeNull();
        (globalThis as Record<string, unknown>).MAESTRO_PLACES = {
            version: 1,
            current: () => null,
            resolve: () => {
                throw new Error('boom');
            },
            list: () => 'junk',
            onEnter: () => undefined,
        };
        expect(places.resolvePlace('Harbor')).toBeNull();
        expect(places.placeById('pl1')).toBeNull();
    });
});
