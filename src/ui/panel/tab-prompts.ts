// "Prompts" tab: the style editor (prefix, suffix, undesired content and UC preset of the selected
// style or the common fields, v0.13), the current character's prompt, mode templates and the
// human-language converter (TZ Phase 7).
import { ctx } from '../../core/context';
import { localize, t } from '../../core/i18n';
import { saveSettings, settings, notifyExternalChange } from '../../core/settings';
import {
    activeStyle,
    applyStyle,
    currentNegativeMode,
    currentOwnNegative,
    findStyle,
    setBaseNegative,
    setNegativeMode,
    setOwnNegative,
    styleChanged,
    styleFromSettings,
} from '../../features/generation/styles';
import { reportGenerationError } from '../../core/notify';
import {
    combinePrefixes,
    DEFAULT_MODEL,
    DEFAULT_TEMPLATES,
    getCapabilities,
    isModelId,
    negativeMode,
    TEMPLATE_MODES,
} from '../../domain';
import {
    readCharacterPrompt,
    saveCharacterPrompt,
    soloCharacterIndex,
} from '../../features/characters/character-prompts';
import { interpretForModel } from '../../features/language/interpreter';
import { bindSettings, readFromSettings } from '../components/bind';
import { $id, escapeHtml, fillSelect, render } from '../components/dom';
import template from '../templates/tab-prompts.html?raw';
import { createTokenMeter } from '../token-meter';
import type { TokenMeter } from '../token-meter';

export class PromptsTab {
    private root!: HTMLElement;
    private styleTokens: TokenMeter | null = null;

    /**
     * `onChange`: something that affects the preview changed. `onFields`: the style editor changed the
     * current undesired content or UC preset, which the Generate tab shows too.
     */
    constructor(
        private readonly onChange: () => void,
        private readonly onFields: () => void = () => {},
    ) {}

    mount(container: HTMLElement): void {
        container.innerHTML = render(template);
        this.root = container;
        localize(container);
        this.fillProfiles();
        bindSettings(container, (path) => {
            this.applyLanguage();
            if (path === 'prompts.prefix' || path === 'prompts.suffix') {
                this.updateStyleStatus();
                this.onFields();
            }
            this.onChange();
        });
        this.bindLanguage();
        this.applyLanguage();
        this.bindStyles();
        this.renderStyles();
        this.renderTemplates();
        this.bindCharacter();
        this.refreshCharacter();
        const c = ctx();
        c.eventSource.on(c.eventTypes.CHAT_CHANGED ?? 'chat_id_changed', () => this.refreshCharacter());
    }

    /** Re-reads every control after settings changed outside of this tab. */
    refresh(): void {
        this.fillProfiles();
        readFromSettings(this.root);
        this.applyLanguage();
        this.renderStyles();
        this.fillTemplates();
        this.refreshCharacter();
    }

    // ---- human language --------------------------------------------------------------------

    /** Connection profiles that can answer a request (Connection Manager, ST 1.19). */
    private fillProfiles(): void {
        let profiles: { id: string; name?: string }[];
        try {
            profiles = ctx().ConnectionManagerRequestService.getSupportedProfiles();
        } catch {
            profiles = [];
        }
        const current = settings().language.profileId;
        const options = [
            { value: '', label: t('naist.language.profileNone') },
            ...profiles.map((p) => ({ value: p.id, label: p.name || p.id })),
        ];
        if (current && !profiles.some((p) => p.id === current)) options.push({ value: current, label: current });
        fillSelect($id(this.root, 'naist_language_profile'), options, current);
    }

    private applyLanguage(): void {
        const backend = settings().language.backend;
        $id(this.root, 'naist_language_profile_row').classList.toggle('naist-hidden', backend !== 'profile');
        $id(this.root, 'naist_language_novelai_row').classList.toggle('naist-hidden', backend !== 'novelai');
    }

    private bindLanguage(): void {
        const button = $id(this.root, 'naist_language_test_run');
        const output = $id(this.root, 'naist_language_test_result');
        button.addEventListener('click', async () => {
            const text = $id<HTMLTextAreaElement>(this.root, 'naist_language_test').value;
            if (!text.trim() || button.classList.contains('disabled')) return;
            button.classList.add('disabled');
            try {
                const result = await interpretForModel(text, settings().generation.model, {
                    force: true,
                    strict: true,
                });
                const lines = result
                    ? [result.prompt, result.negative ? `${t('naist.language.testNegative')} ${result.negative}` : '']
                    : [t('naist.interpret.already')];
                if (result?.unmatched.length)
                    lines.push(t('naist.interpret.unmatched', { tags: result.unmatched.join(', ') }));
                output.textContent = lines.filter(Boolean).join('\n');
                output.classList.remove('naist-hidden');
            } catch (error) {
                reportGenerationError(error);
            } finally {
                button.classList.remove('disabled');
            }
        });
    }

    // ---- styles ----------------------------------------------------------------------------
    // The editor edits the current fields (what every picture uses); the selected style is what
    // "Save style" writes them into and "Revert" brings back. Without a style they are the common fields.

    private renderStyles(): void {
        const prompts = settings().prompts;
        const options = [
            { value: '', label: t('naist.prompts.styleNone') },
            ...prompts.styles.map((s) => ({ value: s.name, label: s.name })),
        ];
        fillSelect($id(this.root, 'naist_style'), options, activeStyle(settings())?.name ?? '');
        this.renderStyleEditor();
    }

    /** Re-reads the editor after the current fields changed elsewhere (the Generate tab, a command). */
    syncStyleFields(): void {
        this.renderStyleEditor();
    }

    private renderStyleEditor(): void {
        const s = settings();
        const r = this.root;
        const style = activeStyle(s);
        const own = $id<HTMLTextAreaElement>(r, 'naist_style_negative');
        own.value = currentOwnNegative(s, own.value);
        $id<HTMLSelectElement>(r, 'naist_style_mode').value = currentNegativeMode(s);
        const model = s.generation.model;
        fillSelect(
            $id(r, 'naist_style_uc'),
            getCapabilities(isModelId(model) ? model : DEFAULT_MODEL).ucPresets.map((id) => ({
                value: id,
                label: t(`naist.ucPreset.${id}`),
            })),
            s.generation.ucPreset,
        );
        const base = $id<HTMLTextAreaElement>(r, 'naist_base_negative');
        if (base.value !== s.prompts.baseNegative) base.value = s.prompts.baseNegative;
        const label = (id: string, key: string) => {
            const el = $id(r, id);
            el.setAttribute('data-i18n', key);
            el.textContent = t(key);
        };
        label('naist_prefix_label', style ? 'naist.prompts.stylePrefix' : 'naist.prompts.prefix');
        label('naist_suffix_label', style ? 'naist.prompts.styleSuffix' : 'naist.prompts.suffix');
        label('naist_style_negative_label', style ? 'naist.prompts.styleNegative' : 'naist.prompts.commonNegative');
        label('naist_style_uc_label', style ? 'naist.prompts.styleUc' : 'naist.panel.ucPreset');
        $id(r, 'naist_style_mode_box').classList.toggle('naist-hidden', !style);
        $id(r, 'naist_style_actions').classList.toggle('naist-hidden', !style);
        $id(r, 'naist_style_rename').classList.toggle('disabled', !style);
        $id(r, 'naist_style_delete').classList.toggle('disabled', !style);
        $id(r, 'naist_style_status').textContent = style
            ? t('naist.prompts.styleEditing', { name: style.name })
            : t('naist.prompts.styleCommon');
        this.updateStyleStatus();
    }

    /** The "changed" badge, the buttons, the effective undesired content and the token counter. */
    private updateStyleStatus(): void {
        const s = settings();
        const r = this.root;
        const style = activeStyle(s);
        const changed = styleChanged(s, style);
        $id(r, 'naist_style_dirty').classList.toggle('naist-hidden', !changed);
        $id(r, 'naist_style_save').classList.toggle('disabled', !changed);
        $id(r, 'naist_style_revert').classList.toggle('disabled', !changed);
        const append = Boolean(style) && currentNegativeMode(s) === 'append';
        $id(r, 'naist_style_effective_box').classList.toggle('naist-hidden', !append);
        $id(r, 'naist_style_effective').textContent = s.generation.negativePrompt.trim()
            ? s.generation.negativePrompt
            : t('naist.prompts.effectiveEmpty');
        const counter = s.promptTools.counter;
        this.styleTokens?.element.classList.toggle('naist-hidden', !counter);
        if (counter) {
            this.styleTokens?.update({
                model: s.generation.model,
                prompt: combinePrefixes(s.prompts.prefix, s.prompts.suffix),
                characters: [],
                negative: s.generation.negativePrompt,
                raw: [s.prompts.prefix, s.prompts.suffix, s.generation.negativePrompt].join('\n'),
            });
        }
    }

    /** A field of the editor changed the current fields: save, show it here and on the Generate tab. */
    private styleFieldsChanged(): void {
        saveSettings();
        this.updateStyleStatus();
        this.onFields();
        this.onChange();
    }

    /** A style replaced the current fields: every tab re-reads its controls. */
    private styleApplied(): void {
        saveSettings();
        readFromSettings(this.root);
        this.renderStyles();
        this.onChange();
        // The undesired content and the UC preset are on the Generate tab too.
        notifyExternalChange();
    }

    private async confirm(text: string): Promise<boolean> {
        const c = ctx();
        return (await c.callGenericPopup(text, c.POPUP_TYPE.CONFIRM)) === c.POPUP_RESULT.AFFIRMATIVE;
    }

    private async selectStyle(name: string): Promise<void> {
        const s = settings();
        const current = activeStyle(s);
        // Switching to another style loses unsaved edits; without a style they stay as the common fields.
        if (
            name &&
            current &&
            current.name !== name &&
            styleChanged(s, current) &&
            !(await this.confirm(t('naist.prompts.styleDiscardConfirm', { name: current.name })))
        ) {
            $id<HTMLSelectElement>(this.root, 'naist_style').value = current.name;
            return;
        }
        const style = s.prompts.styles.find((x) => x.name === name);
        if (style) {
            $id<HTMLTextAreaElement>(this.root, 'naist_style_negative').value = style.negative;
            applyStyle(s, style);
        } else {
            s.prompts.activeStyle = '';
            s.prompts.negativeMode = 'replace';
        }
        this.styleApplied();
    }

    private bindStyles(): void {
        const c = ctx();
        const r = this.root;
        const select = $id<HTMLSelectElement>(r, 'naist_style');
        const own = $id<HTMLTextAreaElement>(r, 'naist_style_negative');
        const mode = $id<HTMLSelectElement>(r, 'naist_style_mode');
        this.styleTokens = createTokenMeter();
        $id(r, 'naist_style_effective_box').after(this.styleTokens.element);
        select.addEventListener('change', () => void this.selectStyle(select.value));
        own.addEventListener('input', () => {
            setOwnNegative(settings(), own.value);
            this.styleFieldsChanged();
        });
        mode.addEventListener('change', () => {
            setNegativeMode(settings(), negativeMode(mode.value), own.value);
            this.styleFieldsChanged();
        });
        $id<HTMLSelectElement>(r, 'naist_style_uc').addEventListener('change', (event) => {
            settings().generation.ucPreset = (event.target as HTMLSelectElement).value;
            this.styleFieldsChanged();
        });
        $id<HTMLTextAreaElement>(r, 'naist_base_negative').addEventListener('input', (event) => {
            setBaseNegative(settings(), (event.target as HTMLTextAreaElement).value, own.value);
            this.styleFieldsChanged();
        });
        $id(r, 'naist_style_save').addEventListener('click', () => {
            const s = settings();
            const style = activeStyle(s);
            if (!style || !styleChanged(s, style)) return;
            const saved = styleFromSettings(s, style.name, own.value);
            s.prompts.styles = s.prompts.styles.map((x) => (x === style ? saved : x));
            own.value = saved.negative;
            applyStyle(s, saved);
            this.styleApplied();
        });
        $id(r, 'naist_style_revert').addEventListener('click', () => {
            const s = settings();
            const style = activeStyle(s);
            if (!style) return;
            own.value = style.negative;
            applyStyle(s, style);
            this.styleApplied();
        });
        $id(r, 'naist_style_new').addEventListener('click', async () => {
            const input = await c.callGenericPopup(t('naist.prompts.styleNamePrompt'), c.POPUP_TYPE.INPUT, '');
            const name = typeof input === 'string' ? input.trim() : '';
            if (!name) return;
            const s = settings();
            const existing = findStyle(s, name);
            if (existing && !(await this.confirm(t('naist.prompts.styleOverwriteConfirm', { name: existing.name }))))
                return;
            const style = styleFromSettings(s, name, own.value);
            if (existing) s.prompts.styles = s.prompts.styles.map((x) => (x === existing ? style : x));
            else s.prompts.styles.push(style);
            own.value = style.negative;
            applyStyle(s, style);
            this.styleApplied();
        });
        $id(r, 'naist_style_rename').addEventListener('click', async () => {
            const s = settings();
            const style = activeStyle(s);
            if (!style) return;
            const input = await c.callGenericPopup(t('naist.prompts.styleNamePrompt'), c.POPUP_TYPE.INPUT, style.name);
            const name = typeof input === 'string' ? input.trim() : '';
            if (!name || name === style.name) return;
            const taken = findStyle(s, name);
            if (taken && taken !== style) {
                toastr.warning(t('naist.prompts.styleNameTaken', { name: taken.name }));
                return;
            }
            style.name = name;
            s.prompts.activeStyle = name;
            saveSettings();
            this.renderStyles();
        });
        $id(r, 'naist_style_delete').addEventListener('click', async () => {
            const s = settings();
            const style = activeStyle(s);
            if (!style) return;
            if (!(await this.confirm(t('naist.prompts.styleDeleteConfirm', { name: style.name })))) return;
            // The fields stay as they are and become the common ones.
            s.prompts.styles = s.prompts.styles.filter((x) => x !== style);
            s.prompts.activeStyle = '';
            s.prompts.negativeMode = 'replace';
            this.styleApplied();
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
