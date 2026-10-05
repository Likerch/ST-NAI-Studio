// @vitest-environment happy-dom
// The DES portrait policy in the Chat tab (v0.13.2): a policy picked in the panel is marked as the
// user's own, so the settings migrations leave it as it is.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({ settings: null as unknown as NaiStudioSettings, saved: 0 }));

vi.mock('../../src/core/settings', () => ({
    settings: () => state.settings,
    saveSettings: () => state.saved++,
}));
vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key, localize: vi.fn() }));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({ eventSource: { on: vi.fn() }, eventTypes: {} }),
    libs: () => ({
        Handlebars: { compile: (template: string) => () => template },
        DOMPurify: { sanitize: (html: string) => html },
    }),
}));
vi.mock('../../src/core/notify', () => ({ reportGenerationError: vi.fn() }));
vi.mock('../../src/features/generation/multimodal', () => ({
    visionChoices: async () => ({ current: 'openai', apis: [] }),
}));
vi.mock('../../src/integration/des/des-integration', () => ({ desIntegration: () => null }));

const { ChatTab } = await import('../../src/ui/panel/tab-chat');

beforeEach(() => {
    state.settings = defaultSettings();
    state.saved = 0;
    document.body.innerHTML = '';
});

describe('DES portrait policy in the Chat tab', () => {
    it('shows "missing" by default and marks a picked policy as chosen', () => {
        const changed = vi.fn();
        new ChatTab(changed).mount(document.body);
        const select = document.getElementById('naist_des_policy') as HTMLSelectElement;
        expect(select.value).toBe('missing');
        expect(document.querySelector('[data-i18n="naist.des.policyHint"]')).not.toBeNull();
        expect(state.settings.des.portraitPolicyChosen).toBe(false);
        select.value = 'state';
        select.dispatchEvent(new Event('change'));
        expect(state.settings.des).toMatchObject({ portraitPolicy: 'state', portraitPolicyChosen: true });
        expect(changed).toHaveBeenCalledWith('des.portraitPolicy');
        expect(state.saved).toBe(2);
        // Already chosen: nothing more to save for the flag.
        select.value = 'missing';
        select.dispatchEvent(new Event('change'));
        expect(state.settings.des).toMatchObject({ portraitPolicy: 'missing', portraitPolicyChosen: true });
        expect(state.saved).toBe(3);
    });
});
