// Human language → NovelAI prompt with mocked SillyTavern (TZ Phase 7): when the LLM is asked at
// all, the three backends, cache, negatives, the text block, the dictionary fallback and the
// pipeline hook.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';
import { buildTagIndex } from '../../src/domain';
import type { TagRow } from '../../src/domain';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    store: new Map<string, unknown>(),
    generateRaw: null as unknown as (options: Record<string, unknown>) => Promise<unknown>,
    sendRequest: null as unknown as (...args: unknown[]) => Promise<unknown>,
    novelAiText: null as unknown as (env: unknown, request: Record<string, unknown>) => Promise<string>,
    mainApi: 'openai',
    profileApi: 'openai',
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/storage', () => ({
    store: () => ({
        getItem: async (key: string) => (state.store.has(key) ? state.store.get(key) : null),
        setItem: async (key: string, value: unknown) => void state.store.set(key, value),
        removeItem: async (key: string) => void state.store.delete(key),
    }),
}));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        mainApi: state.mainApi,
        generateRaw: (o: Record<string, unknown>) => state.generateRaw(o),
        ConnectionManagerRequestService: {
            getProfile: (id: string) => ({ id }),
            validateProfile: () => ({ selected: state.profileApi }),
            sendRequest: (...args: unknown[]) => state.sendRequest(...args),
        },
    }),
    requestHeaders: () => ({}),
}));
vi.mock('../../src/transport', () => ({
    novelAiText: (env: unknown, request: Record<string, unknown>) => state.novelAiText(env, request),
}));
vi.mock('../../src/features/vibes/vibe-library', () => ({ sha256Hex: async (text: string) => text }));

const rows: TagRow[] = [
    ['1girl', 0, 6000000],
    ['red_hair', 0, 900000],
    ['smile', 0, 3000000],
    ['reading', 0, 150000],
    ['book', 0, 500000],
    ['window', 0, 400000],
    ['rain', 0, 300000],
    ['hat', 0, 800000],
    ['glasses', 0, 900000],
    ['sign', 0, 100000],
];
const index = buildTagIndex(rows, { девушка: '1girl', 'рыжие волосы': 'red hair', шляпа: 'hat', очки: 'glasses' });
vi.mock('../../src/features/prompt-tools/tag-db', () => ({ tagIndex: async () => index }));
vi.stubGlobal('toastr', { warning: vi.fn(), info: vi.fn() });

const { interpretForModel, languageInterpreter, rememberSource } =
    await import('../../src/features/language/interpreter');

const ANSWER = {
    tags: ['1girl', 'red_hair', 'reading', 'cozy mood'],
    sentence: 'a girl reads a book by the window',
    text: '',
    negative: ['hat'],
};

beforeEach(() => {
    state.settings = defaultSettings();
    state.store.clear();
    state.mainApi = 'openai';
    state.profileApi = 'openai';
    state.generateRaw = vi.fn(async () => JSON.stringify(ANSWER));
    state.sendRequest = vi.fn(async () => ({ content: JSON.stringify(ANSWER) }));
    state.novelAiText = vi.fn(async () => JSON.stringify(ANSWER));
});

describe('interpretForModel', () => {
    it('converts Russian through the main model with a JSON schema and caches the answer', async () => {
        const first = await interpretForModel('рыжая девушка читает книгу у окна', 'nai-diffusion-4-5-full');
        expect(first).toMatchObject({
            prompt: '1girl, red hair, reading, cozy mood. A girl reads a book by the window.',
            negative: 'hat',
            cached: false,
            via: 'main',
            unmatched: ['cozy mood'],
        });
        expect(vi.mocked(state.generateRaw).mock.calls[0]![0]).toMatchObject({
            jsonSchema: { name: 'nai_image_prompt' },
        });
        const again = await interpretForModel('рыжая девушка читает книгу у окна', 'nai-diffusion-4-5-full');
        expect(again?.cached).toBe(true);
        expect(state.generateRaw).toHaveBeenCalledTimes(1);
    });

    it('gives V3 tags only and leaves tag lists and V5 prose alone in auto mode', async () => {
        expect((await interpretForModel('рыжая девушка читает', 'nai-diffusion-3'))?.prompt).toBe(
            '1girl, red hair, reading',
        );
        expect(await interpretForModel('1girl, red hair, smile', 'nai-diffusion-4-5-full')).toBeNull();
        const prose = 'a girl with red hair reading a book next to the rainy window';
        expect(await interpretForModel(prose, 'nai-diffusion-5-full')).toBeNull();
        expect(await interpretForModel(prose, 'nai-diffusion-5-full', { force: true })).not.toBeNull();
        expect(await interpretForModel(prose, 'nai-diffusion-4-5-full', { cyrillicOnly: true })).toBeNull();
        state.settings.language.mode = 'off';
        expect(await interpretForModel('рыжая девушка', 'nai-diffusion-4-5-full')).toBeNull();
    });

    it('uses a plain instruction with a prefill on Text Completion', async () => {
        state.mainApi = 'textgenerationwebui';
        state.generateRaw = vi.fn(async () => ' 1girl, smile\nSentence: She smiles.\nText:\nNegative:');
        expect((await interpretForModel('девушка улыбается', 'nai-diffusion-4-5-full'))?.prompt).toBe(
            '1girl, smile. She smiles.',
        );
        expect(vi.mocked(state.generateRaw).mock.calls[0]![0]).toMatchObject({ prefill: 'Tags:' });
    });

    it('asks a connection profile or NovelAI when chosen', async () => {
        state.settings.language.backend = 'profile';
        state.settings.language.profileId = 'p1';
        await interpretForModel('девушка у окна', 'nai-diffusion-4-5-full');
        const call = vi.mocked(state.sendRequest).mock.calls[0]!;
        expect(call[0]).toBe('p1');
        expect(call[4]).toMatchObject({ json_schema: { name: 'nai_image_prompt' } });

        state.settings.language.backend = 'novelai';
        state.settings.language.novelaiModel = 'xialong-v1';
        const result = await interpretForModel('девушка под дождём', 'nai-diffusion-4-5-full');
        expect(result?.via).toBe('novelai');
        expect(vi.mocked(state.novelAiText).mock.calls[0]![1]).toMatchObject({ model: 'xialong-v1', maxTokens: 500 });
    });

    it('keeps the text block as typed and turns negatives into tags', async () => {
        state.generateRaw = vi.fn(async () =>
            JSON.stringify({ tags: ['1girl', 'sign'], sentence: 'she holds a sign', text: '', negative: [] }),
        );
        expect((await interpretForModel('девушка держит табличку, text: OPEN', 'nai-diffusion-4-5-full'))?.prompt).toBe(
            '1girl, sign. She holds a sign. Text: OPEN',
        );
        state.generateRaw = vi.fn(async () =>
            JSON.stringify({ tags: ['glasses'], sentence: 'no hats', text: '', negative: ['hat'] }),
        );
        const negative = await interpretForModel('очки и без шляп', 'nai-diffusion-4-5-full', { negative: true });
        expect(negative).toMatchObject({ prompt: 'glasses, hat', negative: '' });
    });

    it('falls back to the dictionary when the LLM fails, and throws in strict mode', async () => {
        state.generateRaw = vi.fn(async () => {
            throw new Error('API down');
        });
        const result = await interpretForModel('девушка, рыжие волосы, книга', 'nai-diffusion-4-5-full');
        expect(result).toMatchObject({ prompt: '1girl, red hair', via: 'dictionary' });
        await expect(
            interpretForModel('девушка в очках', 'nai-diffusion-4-5-full', { strict: true }),
        ).rejects.toMatchObject({
            code: 'translation-failed',
        });
        state.generateRaw = vi.fn(async () => 'Sure! Here is your prompt: девушка');
        expect((await interpretForModel('девушка в шляпе', 'nai-diffusion-4-5-full'))?.via).toBe('dictionary');
    });
});

describe('pipeline hook', () => {
    it('passes the model and modes through and remembers hand-converted originals', async () => {
        expect(
            await languageInterpreter.interpret('smile, window', {
                model: 'nai-diffusion-4-5-full',
                cyrillicOnly: false,
            }),
        ).toBeNull();
        const result = await languageInterpreter.interpret('рыжая девушка читает', {
            model: 'nai-diffusion-3',
            cyrillicOnly: true,
        });
        expect(result).toEqual({ prompt: '1girl, red hair, reading', negative: 'hat' });
        rememberSource('red hair, smile', 'рыжая улыбается');
        expect(languageInterpreter.original?.('masterpiece, red hair, smile, best quality')).toBe('рыжая улыбается');
        expect(languageInterpreter.original?.('dog')).toBeUndefined();
    });
});
