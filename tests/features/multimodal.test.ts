// Avatar descriptions (v0.9.1): the API chosen in NAI Studio goes into the Image Captioning settings
// only while the request runs; without a choice the settings of Image Captioning are used.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    caption: {} as Record<string, unknown>,
    seen: [] as unknown[],
}));

vi.mock('../../src/core/settings', () => ({ settings: () => state.settings }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({ extensionSettings: { caption: state.caption } }),
    importHost: async (path: string) =>
        path.endsWith('secrets.js')
            ? { secret_state: { api_key_openrouter: true, api_key_openai: false } }
            : {
                  getMultimodalCaption: async () => {
                      state.seen.push({ ...state.caption });
                      if (state.caption.multimodal_api === 'openai') throw new Error('OpenAI API key is not set.');
                      return 'a girl with red hair';
                  },
              },
}));

const { describeImage, visionChoices } = await import('../../src/features/generation/multimodal');

beforeEach(() => {
    state.settings = defaultSettings();
    state.caption = { multimodal_api: 'openai', multimodal_model: 'gpt-4-turbo' };
    state.seen = [];
});

describe('describeImage', () => {
    it('uses the chosen API and model during the request and restores Image Captioning after', async () => {
        state.settings.modes.multimodalApi = 'openrouter';
        expect(await describeImage('b64', 'describe')).toBe('a girl with red hair');
        expect(state.seen).toEqual([{ multimodal_api: 'openrouter', multimodal_model: 'google/gemini-2.5-flash' }]);
        expect(state.caption).toEqual({ multimodal_api: 'openai', multimodal_model: 'gpt-4-turbo' });
    });

    it('keeps Image Captioning as it is without a choice, and restores it after a failure', async () => {
        await expect(describeImage('b64', 'describe')).rejects.toThrow('OpenAI API key is not set.');
        state.settings.modes.multimodalApi = 'openai';
        await expect(describeImage('b64', 'describe')).rejects.toThrow();
        expect(state.caption).toEqual({ multimodal_api: 'openai', multimodal_model: 'gpt-4-turbo' });
    });

    it('lists the APIs with their key state', async () => {
        const { current, apis } = await visionChoices();
        expect(current).toBe('openai');
        expect(apis.find((a) => a.id === 'openrouter')?.hasKey).toBe(true);
        expect(apis.find((a) => a.id === 'openai')?.hasKey).toBe(false);
    });
});
