// @vitest-environment happy-dom
// The style editor on the Prompts tab (v0.13) together with the Generate tab: the selected style's
// prefix, suffix, undesired content, negative mode and UC preset are edited in place, "changed" shows
// what differs from the saved style, Save / Revert / New / Rename / Delete, the base negative, and the
// undesired content of the Generate tab kept in sync both ways.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultSettings } from '../../src/core/settings-schema';
import type { NaiStudioSettings, StyleSettings } from '../../src/core/settings-schema';

const state = vi.hoisted(() => ({
    settings: null as unknown as NaiStudioSettings,
    listeners: new Set<() => void>(),
    popups: [] as unknown[],
    asked: [] as string[],
}));

vi.mock('../../src/core/settings', () => ({
    settings: () => state.settings,
    saveSettings: vi.fn(),
    onExternalChange: (listener: () => void) => {
        state.listeners.add(listener);
        return () => state.listeners.delete(listener);
    },
    notifyExternalChange: () => state.listeners.forEach((listener) => listener()),
}));
vi.mock('../../src/core/i18n', () => ({
    t: (key: string, params?: Record<string, string | number>) =>
        params ? `${key}(${Object.values(params).join(',')})` : key,
    localize: vi.fn(),
}));
vi.mock('../../src/core/context', () => ({
    ctx: () => ({
        POPUP_TYPE: { TEXT: 1, CONFIRM: 2, INPUT: 3 },
        POPUP_RESULT: { AFFIRMATIVE: 1, NEGATIVE: 0 },
        callGenericPopup: async (text: string) => {
            state.asked.push(text);
            return state.popups.shift();
        },
        eventSource: { on: vi.fn() },
        eventTypes: {},
        characters: [],
    }),
    libs: () => ({
        Handlebars: { compile: (template: string) => () => template },
        DOMPurify: { sanitize: (html: string) => html },
    }),
}));
vi.mock('../../src/core/notify', () => ({ reportGenerationError: vi.fn() }));
vi.mock('../../src/features/characters/character-prompts', () => ({
    soloCharacterIndex: () => undefined,
    readCharacterPrompt: vi.fn(),
    saveCharacterPrompt: vi.fn(),
}));
vi.mock('../../src/features/language/interpreter', () => ({ interpretForModel: vi.fn() }));
vi.mock('../../src/features/takeover/takeover', () => ({ isBuiltInActive: () => false }));
vi.mock('../../src/ui/token-meter', () => ({
    createTokenMeter: () => ({ element: document.createElement('div'), update: vi.fn() }),
}));
vi.mock('../../src/ui/prompt-assist', () => ({ attachPromptAssist: vi.fn() }));
vi.mock('../../src/ui/panel/inspector', () => ({ openInspector: vi.fn() }));
vi.mock('../../src/ui/panel/tab-chat', () => ({
    ChatTab: class {
        mount(): void {}
        refresh(): void {}
        applyGuards(): void {}
    },
}));
vi.mock('../../src/ui/panel/tab-images', () => ({
    importPngFile: vi.fn(),
    ImagesTab: class {
        mount(): void {}
        refresh(): void {}
    },
}));
vi.mock('../../src/ui/panel/tab-takeover', () => ({
    TakeoverTab: class {
        mount(): void {}
        refresh(): void {}
    },
}));
vi.stubGlobal('toastr', { info: vi.fn(), warning: vi.fn(), error: vi.fn(), success: vi.fn() });

const { Panel } = await import('../../src/ui/panel/panel');
const { applyStyle } = await import('../../src/features/generation/styles');

const ink: StyleSettings = {
    name: 'Ink',
    prefix: 'ink wash',
    suffix: 'monochrome',
    negative: 'color, watermark',
    ucPreset: 'light',
    negativeMode: 'append',
};
const oil: StyleSettings = { name: 'Oil', prefix: 'oil painting', suffix: '', negative: 'anime, sketch' };
const BASE = 'lowres, bad anatomy, watermark';

function mount(): HTMLElement {
    document.body.innerHTML = '';
    const controller = {
        state: {
            selection: null,
            account: { tier: 0, anlas: 0, usagePercent: null },
            accountError: null,
            busy: false,
        },
        subscribe: vi.fn(),
        refreshTransport: vi.fn(),
    };
    const pipeline = {
        previewFree: () => {
            throw new Error('no transport');
        },
    };
    new Panel(controller as never, pipeline as never).mount(document.body);
    return document.body;
}

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const area = (id: string) => $<HTMLTextAreaElement>(id);
const hidden = (id: string) => $(id).classList.contains('naist-hidden');
const disabled = (id: string) => $(id).classList.contains('disabled');
const activate = (name: string) =>
    applyStyle(
        state.settings,
        state.settings.prompts.styles.find((style) => style.name === name)!,
    );
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function type(id: string, value: string): void {
    const el = area(id);
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
}

function choose(id: string, value: string): void {
    const el = $<HTMLSelectElement>(id);
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

async function click(id: string): Promise<void> {
    $(id).click();
    await settle();
}

beforeEach(() => {
    state.settings = defaultSettings();
    state.settings.prompts.baseNegative = BASE;
    state.settings.prompts.styles = [structuredClone(ink), structuredClone(oil)];
    state.settings.generation.negativePrompt = 'nsfw, lowres';
    state.listeners.clear();
    state.popups = [];
    state.asked = [];
});

describe('style editor', () => {
    it('without a style explains that the fields are the common ones', () => {
        mount();
        expect($('naist_style_status').textContent).toBe('naist.prompts.styleCommon');
        expect($('naist_prefix_label').textContent).toBe('naist.prompts.prefix');
        expect($('naist_style_negative_label').textContent).toBe('naist.prompts.commonNegative');
        expect(area('naist_style_negative').value).toBe('nsfw, lowres');
        expect(area('naist_base_negative').value).toBe(BASE);
        expect(hidden('naist_style_mode_box')).toBe(true);
        expect(hidden('naist_style_actions')).toBe(true);
        expect(hidden('naist_style_dirty')).toBe(true);
        expect(disabled('naist_style_rename')).toBe(true);
        expect($('naist_negative_style').textContent).toBe('');
        // Editing the common negative here changes the Generate tab's field.
        type('naist_style_negative', 'nsfw');
        expect(state.settings.generation.negativePrompt).toBe('nsfw');
        expect(area('naist_negative').value).toBe('nsfw');
    });

    it('shows the selected style with its own negative and the effective one', async () => {
        mount();
        choose('naist_style', 'Ink');
        await settle();
        expect(state.settings.prompts.activeStyle).toBe('Ink');
        expect($('naist_style_status').textContent).toBe('naist.prompts.styleEditing(Ink)');
        expect($('naist_prefix_label').textContent).toBe('naist.prompts.stylePrefix');
        expect($('naist_style_negative_label').textContent).toBe('naist.prompts.styleNegative');
        expect(area('naist_prefix').value).toBe('ink wash');
        expect(area('naist_suffix').value).toBe('monochrome');
        expect(area('naist_style_negative').value).toBe('color, watermark');
        expect($<HTMLSelectElement>('naist_style_mode').value).toBe('append');
        expect($<HTMLSelectElement>('naist_style_uc').value).toBe('light');
        expect(hidden('naist_style_effective_box')).toBe(false);
        expect($('naist_style_effective').textContent).toBe('lowres, bad anatomy, watermark, color');
        expect(hidden('naist_style_dirty')).toBe(true);
        expect(disabled('naist_style_save')).toBe(true);
        // The Generate tab shows the same undesired content and where it comes from.
        expect(area('naist_negative').value).toBe('lowres, bad anatomy, watermark, color');
        expect($<HTMLSelectElement>('naist_uc_preset').value).toBe('light');
        expect($('naist_negative_style').textContent).toBe('naist.panel.negativeStyleAppend(Ink)');
    });

    it('marks the style changed while editing, reverts and saves', async () => {
        activate('Ink');
        mount();
        type('naist_style_negative', 'color, text');
        expect(state.settings.generation.negativePrompt).toBe('lowres, bad anatomy, watermark, color, text');
        expect(area('naist_negative').value).toBe('lowres, bad anatomy, watermark, color, text');
        expect(hidden('naist_style_dirty')).toBe(false);
        expect(disabled('naist_style_save')).toBe(false);
        expect($('naist_negative_style').textContent).toBe(
            'naist.panel.negativeStyleAppend(Ink) naist.panel.negativeStyleChanged',
        );
        // Revert: the saved style again.
        await click('naist_style_revert');
        expect(area('naist_style_negative').value).toBe('color, watermark');
        expect(state.settings.generation.negativePrompt).toBe('lowres, bad anatomy, watermark, color');
        expect(hidden('naist_style_dirty')).toBe(true);
        // A prefix edit and a new negative, then Save.
        type('naist_prefix', 'ink wash, sumi-e');
        expect(hidden('naist_style_dirty')).toBe(false);
        type('naist_style_negative', 'color, photo');
        await click('naist_style_save');
        expect(state.settings.prompts.styles[0]).toEqual({
            ...ink,
            prefix: 'ink wash, sumi-e',
            negative: 'color, photo',
        });
        expect(hidden('naist_style_dirty')).toBe(true);
        expect(state.settings.prompts.styles[1]).toEqual(oil);
    });

    it('takes an edit of the Generate tab into the style', async () => {
        activate('Ink');
        mount();
        type('naist_negative', 'lowres, bad anatomy, watermark, color, blurry');
        expect(area('naist_style_negative').value).toBe('color, blurry');
        expect(hidden('naist_style_dirty')).toBe(false);
        await click('naist_style_save');
        expect(state.settings.prompts.styles[0]).toMatchObject({ negative: 'color, blurry', negativeMode: 'append' });
        expect(hidden('naist_style_dirty')).toBe(true);
        // The UC preset of the Generate tab too.
        choose('naist_uc_preset', 'heavy');
        expect($<HTMLSelectElement>('naist_style_uc').value).toBe('heavy');
        expect(hidden('naist_style_dirty')).toBe(false);
        // And the editor's UC preset goes to the Generate tab.
        choose('naist_style_uc', 'none');
        expect(state.settings.generation.ucPreset).toBe('none');
        expect($<HTMLSelectElement>('naist_uc_preset').value).toBe('none');
    });

    it('switches the negative mode and follows the base negative', async () => {
        activate('Ink');
        mount();
        type('naist_base_negative', 'jpeg artifacts');
        expect(state.settings.prompts.baseNegative).toBe('jpeg artifacts');
        expect(state.settings.generation.negativePrompt).toBe('jpeg artifacts, color, watermark');
        expect($('naist_style_effective').textContent).toBe('jpeg artifacts, color, watermark');
        expect(area('naist_negative').value).toBe('jpeg artifacts, color, watermark');
        // Still the saved style with the new base.
        expect(hidden('naist_style_dirty')).toBe(true);
        choose('naist_style_mode', 'replace');
        expect(state.settings.generation.negativePrompt).toBe('color, watermark');
        expect(hidden('naist_style_effective_box')).toBe(true);
        expect(hidden('naist_style_dirty')).toBe(false);
        expect($('naist_negative_style').textContent).toContain('naist.panel.negativeStyleReplace(Ink)');
        await click('naist_style_save');
        expect(state.settings.prompts.styles[0]).toMatchObject({
            negative: 'color, watermark',
            negativeMode: 'replace',
        });
        // A "replace" style does not follow the base.
        type('naist_base_negative', 'blurry');
        expect(state.settings.generation.negativePrompt).toBe('color, watermark');
    });

    it('asks before leaving a changed style', async () => {
        activate('Ink');
        mount();
        type('naist_suffix', 'monochrome, grain');
        state.popups = [0];
        choose('naist_style', 'Oil');
        await settle();
        expect(state.asked).toEqual(['naist.prompts.styleDiscardConfirm(Ink)']);
        expect(state.settings.prompts.activeStyle).toBe('Ink');
        expect($<HTMLSelectElement>('naist_style').value).toBe('Ink');
        expect(state.settings.prompts.suffix).toBe('monochrome, grain');
        state.popups = [1];
        choose('naist_style', 'Oil');
        await settle();
        expect(state.settings.prompts).toMatchObject({ activeStyle: 'Oil', prefix: 'oil painting', suffix: '' });
        expect(state.settings.generation.negativePrompt).toBe('anime, sketch');
        expect(area('naist_style_negative').value).toBe('anime, sketch');
        expect(hidden('naist_style_effective_box')).toBe(true);
        // No style: nothing is lost, the fields stay as the common ones.
        type('naist_prefix', 'oil');
        state.asked = [];
        choose('naist_style', '');
        await settle();
        expect(state.asked).toEqual([]);
        expect(state.settings.prompts).toMatchObject({ activeStyle: '', prefix: 'oil', negativeMode: 'replace' });
    });

    it('creates a new style from the current fields, asking before overwriting', async () => {
        activate('Ink');
        mount();
        type('naist_style_negative', 'color, text');
        state.popups = ['  Ink Text  '];
        await click('naist_style_new');
        expect(state.settings.prompts.styles.map((s) => s.name)).toEqual(['Ink', 'Oil', 'Ink Text']);
        expect(state.settings.prompts.styles[2]).toEqual({
            name: 'Ink Text',
            prefix: 'ink wash',
            suffix: 'monochrome',
            negative: 'color, text',
            ucPreset: 'light',
            negativeMode: 'append',
        });
        expect(state.settings.prompts.activeStyle).toBe('Ink Text');
        expect($<HTMLSelectElement>('naist_style').value).toBe('Ink Text');
        // The original style is untouched.
        expect(state.settings.prompts.styles[0]).toEqual(ink);
        // An existing name (any case): confirm, then overwrite.
        type('naist_prefix', 'oil, thick paint');
        state.popups = ['oil', 0];
        await click('naist_style_new');
        expect(state.asked.at(-1)).toBe('naist.prompts.styleOverwriteConfirm(Oil)');
        expect(state.settings.prompts.styles[1]).toEqual(oil);
        state.popups = ['oil', 1];
        await click('naist_style_new');
        expect(state.settings.prompts.styles).toHaveLength(3);
        expect(state.settings.prompts.styles[1]).toMatchObject({ name: 'oil', prefix: 'oil, thick paint' });
        expect(state.settings.prompts.activeStyle).toBe('oil');
        // An empty name does nothing.
        state.popups = ['  '];
        await click('naist_style_new');
        expect(state.settings.prompts.styles).toHaveLength(3);
    });

    it('renames and deletes the selected style', async () => {
        activate('Oil');
        mount();
        state.popups = ['ink'];
        await click('naist_style_rename');
        expect(state.settings.prompts.styles[1]!.name).toBe('Oil');
        state.popups = ['Oil paint'];
        await click('naist_style_rename');
        expect(state.settings.prompts.styles[1]!.name).toBe('Oil paint');
        expect(state.settings.prompts.activeStyle).toBe('Oil paint');
        expect($<HTMLSelectElement>('naist_style').value).toBe('Oil paint');
        state.popups = [1];
        await click('naist_style_delete');
        expect(state.asked.at(-1)).toBe('naist.prompts.styleDeleteConfirm(Oil paint)');
        expect(state.settings.prompts.styles.map((s) => s.name)).toEqual(['Ink']);
        expect(state.settings.prompts.activeStyle).toBe('');
        // The fields stay as the common ones.
        expect(state.settings.generation.negativePrompt).toBe('anime, sketch');
        expect($('naist_style_status').textContent).toBe('naist.prompts.styleCommon');
    });
});
