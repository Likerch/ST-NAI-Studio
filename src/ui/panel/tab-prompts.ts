// "Prompts" tab: common prefix/suffix, styles, the current character's prompt, mode templates.
import { ctx } from '../../core/context';
import { localize, t } from '../../core/i18n';
import { saveSettings, settings } from '../../core/settings';
import type { StyleSettings } from '../../core/settings-schema';
import { DEFAULT_TEMPLATES, TEMPLATE_MODES } from '../../domain';
import {
    readCharacterPrompt,
    saveCharacterPrompt,
    soloCharacterIndex,
} from '../../features/characters/character-prompts';
import { bindSettings, readFromSettings } from '../components/bind';
import { $id, escapeHtml, fillSelect, render } from '../components/dom';
import template from '../templates/tab-prompts.html?raw';

export class PromptsTab {
    private root!: HTMLElement;

    constructor(private readonly onChange: () => void) {}

    mount(container: HTMLElement): void {
        container.innerHTML = render(template);
        this.root = container;
        localize(container);
        bindSettings(container, () => this.onChange());
        this.renderStyles();
        this.renderTemplates();
        this.bindStyles();
        this.bindCharacter();
        this.refreshCharacter();
        const c = ctx();
        c.eventSource.on(c.eventTypes.CHAT_CHANGED ?? 'chat_id_changed', () => this.refreshCharacter());
    }

    /** Re-reads every control after settings changed outside of this tab. */
    refresh(): void {
        readFromSettings(this.root);
        this.renderStyles();
        this.fillTemplates();
        this.refreshCharacter();
    }

    // ---- styles ----------------------------------------------------------------------------

    private renderStyles(): void {
        const prompts = settings().prompts;
        const options = [
            { value: '', label: t('naist.prompts.styleNone') },
            ...prompts.styles.map((s) => ({ value: s.name, label: s.name })),
        ];
        fillSelect($id(this.root, 'naist_style'), options, prompts.activeStyle);
    }

    private applyStyle(style: StyleSettings | undefined): void {
        const s = settings();
        s.prompts.activeStyle = style?.name ?? '';
        if (style) {
            s.prompts.prefix = style.prefix;
            s.prompts.suffix = style.suffix;
            s.generation.negativePrompt = style.negative;
        }
        saveSettings();
        readFromSettings(this.root);
        this.onChange();
    }

    private bindStyles(): void {
        const c = ctx();
        const select = $id<HTMLSelectElement>(this.root, 'naist_style');
        select.addEventListener('change', () =>
            this.applyStyle(settings().prompts.styles.find((s) => s.name === select.value)),
        );
        $id(this.root, 'naist_style_save').addEventListener('click', async () => {
            const name = await c.callGenericPopup(
                t('naist.prompts.styleNamePrompt'),
                c.POPUP_TYPE.INPUT,
                settings().prompts.activeStyle,
            );
            if (typeof name !== 'string' || !name.trim()) return;
            const s = settings();
            const style: StyleSettings = {
                name: name.trim(),
                prefix: s.prompts.prefix,
                suffix: s.prompts.suffix,
                negative: s.generation.negativePrompt,
            };
            const index = s.prompts.styles.findIndex((x) => x.name === style.name);
            if (index >= 0) s.prompts.styles[index] = style;
            else s.prompts.styles.push(style);
            s.prompts.activeStyle = style.name;
            saveSettings();
            this.renderStyles();
        });
        $id(this.root, 'naist_style_rename').addEventListener('click', async () => {
            const s = settings();
            const style = s.prompts.styles.find((x) => x.name === s.prompts.activeStyle);
            if (!style) return;
            const name = await c.callGenericPopup(t('naist.prompts.styleNamePrompt'), c.POPUP_TYPE.INPUT, style.name);
            if (typeof name !== 'string' || !name.trim() || s.prompts.styles.some((x) => x.name === name.trim()))
                return;
            style.name = name.trim();
            s.prompts.activeStyle = style.name;
            saveSettings();
            this.renderStyles();
        });
        $id(this.root, 'naist_style_delete').addEventListener('click', async () => {
            const s = settings();
            const name = s.prompts.activeStyle;
            if (!name) return;
            const ok = await c.callGenericPopup(t('naist.prompts.styleDeleteConfirm', { name }), c.POPUP_TYPE.CONFIRM);
            if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return;
            s.prompts.styles = s.prompts.styles.filter((x) => x.name !== name);
            s.prompts.activeStyle = '';
            saveSettings();
            this.renderStyles();
        });
    }

    // ---- character prompt --------------------------------------------------------------------

    refreshCharacter(): void {
        const index = soloCharacterIndex();
        const character = index === undefined ? undefined : ctx().characters[index];
        $id(this.root, 'naist_char_prompt_block').classList.toggle('naist-hidden', !character);
        $id(this.root, 'naist_char_prompt_none').classList.toggle('naist-hidden', Boolean(character));
        if (!character) return;
        const prompt = readCharacterPrompt(character);
        $id(this.root, 'naist_char_prompt_name').textContent = character.name;
        $id<HTMLTextAreaElement>(this.root, 'naist_char_positive').value = prompt.positive;
        $id<HTMLTextAreaElement>(this.root, 'naist_char_negative').value = prompt.negative;
        $id<HTMLInputElement>(this.root, 'naist_char_share').checked = prompt.shared;
    }

    private bindCharacter(): void {
        let timer: ReturnType<typeof setTimeout> | null = null;
        const save = () => {
            const index = soloCharacterIndex();
            if (index === undefined) return;
            const value = {
                positive: $id<HTMLTextAreaElement>(this.root, 'naist_char_positive').value,
                negative: $id<HTMLTextAreaElement>(this.root, 'naist_char_negative').value,
            };
            const share = $id<HTMLInputElement>(this.root, 'naist_char_share').checked;
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => void saveCharacterPrompt(index, value, share).then(() => this.onChange()), 500);
        };
        $id(this.root, 'naist_char_positive').addEventListener('input', save);
        $id(this.root, 'naist_char_negative').addEventListener('input', save);
        $id(this.root, 'naist_char_share').addEventListener('change', save);
    }

    // ---- templates ---------------------------------------------------------------------------

    private fillTemplates(): void {
        const overrides = settings().prompts.templates;
        this.root.querySelectorAll<HTMLElement>('.naist-template').forEach((block) => {
            const key = block.dataset.mode ?? '';
            const area = block.querySelector<HTMLTextAreaElement>('.naist-template-text');
            if (area) area.value = overrides[key] ?? DEFAULT_TEMPLATES[key] ?? '';
        });
    }

    private renderTemplates(): void {
        const container = $id(this.root, 'naist_templates');
        const overrides = settings().prompts.templates;
        container.innerHTML = TEMPLATE_MODES.map((mode) => {
            const key = String(mode);
            const value = overrides[key] ?? DEFAULT_TEMPLATES[key] ?? '';
            return `<div class="naist-template" data-mode="${key}">
                <div class="naist-row"><b data-i18n="naist.mode.${key}"></b>
                <div class="menu_button fa-solid fa-rotate-left naist-template-reset" data-i18n="[title]naist.prompts.templateReset"></div></div>
                <textarea class="text_pole textarea_compact naist-template-text" rows="3">${escapeHtml(value)}</textarea>
            </div>`;
        }).join('');
        localize(container);
        container.addEventListener('input', (event) => {
            const area = event.target as HTMLTextAreaElement;
            const key = area.closest<HTMLElement>('.naist-template')?.dataset.mode;
            if (!key || !area.classList.contains('naist-template-text')) return;
            const templates = settings().prompts.templates;
            if (area.value === DEFAULT_TEMPLATES[key]) delete templates[key];
            else templates[key] = area.value;
            saveSettings();
            this.onChange();
        });
        container.addEventListener('click', (event) => {
            const button = event.target as HTMLElement;
            if (!button.classList.contains('naist-template-reset')) return;
            const block = button.closest<HTMLElement>('.naist-template');
            const key = block?.dataset.mode;
            if (!key || !block) return;
            delete settings().prompts.templates[key];
            saveSettings();
            const area = block.querySelector<HTMLTextAreaElement>('.naist-template-text');
            if (area) area.value = DEFAULT_TEMPLATES[key] ?? '';
            this.onChange();
        });
    }
}
