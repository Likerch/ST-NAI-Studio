// Phase 6 features with mocked SillyTavern: RU -> EN translation (glossary, structured output on
// Chat Completion, instruction elsewhere, cache, failures) and settings import on a
// clean install (migration, backup, vibe images).
import merge from 'lodash/merge';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CURRENT_SCHEMA_VERSION, defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { buildSettingsExport } from '../../src/domain';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    store: new Map<string, unknown>(),
    images: new Map<string, unknown>(),
    generateRaw: null as unknown as (options: Record<string, unknown>) => Promise<string>,
    mainApi: 'openai',
    replaced: null as unknown,
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
    replaceSettings: (next: unknown) => {
        state.replaced = next;
    },
}));
vi.mock('../../src/core/storage', () => ({
    store: () => memoryStore(state.store),
    imageStore: () => memoryStore(state.images),
    backupSettings: async (settings: unknown, version: number) => {
        state.store.set(`backup:v${version}`, settings);
        return `backup:v${version}`;
    },
}));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({ mainApi: state.mainApi, generateRaw: (o: Record<string, unknown>) => state.generateRaw(o) }),
    libs: () => ({ lodash: { merge } }),
    importHost: vi.fn(),
    requestHeaders: () => ({}),
}));
vi.mock('../../src/features/images/image-utils', () => ({
    blobToBase64: async (blob: Blob) => btoa(await blob.text()),
    base64ToBlob: (b64: string) => new Blob([atob(b64)]),
    downloadBlob: vi.fn(),
    toPngBlob: async (blob: Blob) => blob,
    thumbnail: async (blob: Blob) => blob,
}));

const { translatePrompt } = await import('../../src/features/translate/translate-service');
const { importSettingsText } = await import('../../src/features/settings-io/settings-io');

const RU_GIRL = 'девушка';
const RU_RED_HAIR = 'рыжие волосы';

beforeEach(() => {
    state.settings = defaultSettings();
    state.store.clear();
    state.images.clear();
    state.mainApi = 'openai';
    state.replaced = null;
});

describe('translatePrompt', () => {
    it('leaves English alone and uses only the glossary when it covers everything', async () => {
        state.generateRaw = vi.fn();
        expect(await translatePrompt('girl, smile')).toEqual({ text: 'girl, smile', cached: false });
        state.settings.translate.glossary = [{ from: RU_GIRL, to: '1girl' }];
        expect(await translatePrompt(`${RU_GIRL}, smile`)).toEqual({ text: '1girl, smile', cached: false });
        expect(state.generateRaw).not.toHaveBeenCalled();
    });

    it('asks the LLM with a JSON schema on Chat Completion and caches the answer', async () => {
        const generateRaw = vi.fn<(options: Record<string, unknown>) => Promise<string>>(
            async () => '{"prompt":"1girl, red hair"}',
        );
        state.generateRaw = generateRaw;
        const first = await translatePrompt(`${RU_GIRL}, ${RU_RED_HAIR}`);
        expect(first).toEqual({ text: '1girl, red hair', cached: false });
        expect(generateRaw.mock.calls[0]![0]).toMatchObject({ jsonSchema: { name: 'nai_prompt_translation' } });
        expect(await translatePrompt(`${RU_GIRL}, ${RU_RED_HAIR}`)).toEqual({ text: '1girl, red hair', cached: true });
        expect(generateRaw).toHaveBeenCalledTimes(1);
    });

    it('uses a plain instruction on other APIs and reads loose JSON', async () => {
        state.mainApi = 'novel';
        const generateRaw = vi.fn<(options: Record<string, unknown>) => Promise<string>>(
            async () => 'Here: {"prompt": "red hair"}',
        );
        state.generateRaw = generateRaw;
        expect((await translatePrompt(RU_RED_HAIR)).text).toBe('red hair');
        expect(generateRaw.mock.calls[0]![0]).not.toHaveProperty('jsonSchema');
    });

    it('fails clearly when the answer is not usable or still Russian', async () => {
        state.generateRaw = async () => 'no json here';
        await expect(translatePrompt(RU_GIRL)).rejects.toMatchObject({ code: 'translation-failed' });
        state.generateRaw = async () => `{"prompt":"${RU_GIRL}"}`;
        await expect(translatePrompt(`${RU_GIRL} 2`)).rejects.toMatchObject({ code: 'translation-failed' });
        state.generateRaw = async () => {
            throw new Error('API down');
        };
        await expect(translatePrompt(`${RU_GIRL} 3`)).rejects.toMatchObject({ code: 'translation-failed' });
    });
});

describe('importSettingsText on a clean install', () => {
    it('restores the exported settings, backs up the current ones and writes vibe images', async () => {
        const source = defaultSettings();
        source.generation.prompt = 'cat in a hat';
        source.prompts.styles = [{ name: 'Ink', prefix: 'ink', suffix: '', negative: '' }];
        source.poses.custom = [{ id: 'p1', name: 'Wave', category: 'standing', tags: 'waving', keywords: [] }] as never;
        source.translate.glossary = [{ from: RU_GIRL, to: '1girl' }];
        source.vibes.items = [
            { id: 'v1', name: 'v', imageHash: 'h', imageKey: 'vibe:v1', thumbKey: 'vibethumb:v1', createdAt: '' },
        ];
        const file = JSON.stringify(
            buildSettingsExport(source as unknown as Record<string, unknown>, CURRENT_SCHEMA_VERSION, '0.6.0', {
                'vibe:v1': btoa('PNGDATA'),
            }),
        );
        const result = await importSettingsText(file);
        expect(result).toEqual({ fromVersion: CURRENT_SCHEMA_VERSION, images: 1 });
        expect(state.replaced).toEqual(source);
        expect(state.store.has(`backup:v${CURRENT_SCHEMA_VERSION}`)).toBe(true);
        expect(await (state.images.get('vibe:v1') as Blob).text()).toBe('PNGDATA');
    });

    it('migrates an older file and refuses a newer one', async () => {
        const old = { format: 'nai-studio-settings', schemaVersion: 4, settings: { generation: { prompt: 'x' } } };
        await importSettingsText(JSON.stringify(old));
        expect((state.replaced as NaiStudioSettings).generation.prompt).toBe('x');
        expect((state.replaced as NaiStudioSettings).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
        const newer = { ...old, schemaVersion: CURRENT_SCHEMA_VERSION + 1 };
        await expect(importSettingsText(JSON.stringify(newer))).rejects.toMatchObject({ code: 'import-failed' });
    });
});
