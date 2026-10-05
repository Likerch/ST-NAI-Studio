// Minimal generation panel (Phase 1 task 10) in the Extensions drawer.
// Model-unsupported controls are hidden; transport-unsupported ones stay visible but disabled.
import { ctx, libs } from '../../core/context';
import { NaiError, toNaiError } from '../../core/errors';
import { localize, t } from '../../core/i18n';
import { log } from '../../core/logger';
import { onExternalChange, saveSettings, settings } from '../../core/settings';
import type { CharacterSlotSettings, TransportMode } from '../../core/settings-schema';
import { convertWeights, defaultCenter, getCapabilities, isModelId, MODE, MODELS, NOISE_SCHEDULES } from '../../domain';
import type { ModelCapabilities } from '../../domain';
import type { StudioController, StudioState } from '../../features/generation/controller';
import type { Pipeline } from '../../features/generation/pipeline';
import { activeStyle, currentNegativeMode, styleChanged } from '../../features/generation/styles';
import { isBuiltInActive } from '../../features/takeover/takeover';
import type { Prepared } from '../../features/generation/service';
import type { TransportFeatures } from '../../transport';
import characterRowTemplate from '../templates/character-row.html?raw';
import panelTemplate from '../templates/panel.html?raw';
import { attachPromptAssist } from '../prompt-assist';
import { createTokenMeter } from '../token-meter';
import type { TokenMeter } from '../token-meter';
import { openInspector } from './inspector';
import { ChatTab } from './tab-chat';
import { ImagesTab, importPngFile } from './tab-images';
import type { ImageActions } from './tab-images';
import { PromptsTab } from './tab-prompts';
import { TakeoverTab } from './tab-takeover';

type FieldKey = keyof ReturnType<typeof settings>['generation'];

function render(template: string, data: unknown): string {
    const html = libs().Handlebars.compile(template)(data);
    return libs().DOMPurify.sanitize(html);
}

function $id<T extends HTMLElement = HTMLElement>(root: ParentNode, id: string): T {
    const el = root.querySelector<T>(`#${id}`);
    if (!el) throw new Error(`NAI Studio panel: missing #${id}`);
    return el;
}

function fillSelect(select: HTMLSelectElement, options: { value: string; label: string }[], current: string): void {
    select.innerHTML = '';
    for (const option of options) {
        const el = document.createElement('option');
        el.value = option.value;
        el.textContent = option.label;
        select.append(el);
    }
    select.value = options.some((o) => o.value === current) ? current : (options[0]?.value ?? '');
}

export class Panel {
    private root!: HTMLElement;
    private refreshTimer: ReturnType<typeof setTimeout> | null = null;
    private lastPrepared: Prepared | null = null;
    private promptsTab: PromptsTab | null = null;
    private chatTab: ChatTab | null = null;
    private imagesTab: ImagesTab | null = null;
    private takeoverTab: TakeoverTab | null = null;
    private tokens: TokenMeter | null = null;

    constructor(
        private readonly controller: StudioController,
        private readonly pipeline: Pipeline,
        private readonly onSettingChange: (path: string) => void = () => {},
        private readonly imageActions: ImageActions = {
            openGallery: () => {},
            setVisibility: () => {},
            chatHidden: () => false,
        },
    ) {}

    /** Dropping a NovelAI PNG/WebP anywhere on the panel fills the parameters (TZ Phase 3). */
    private installPngDrop(): void {
        const root = this.root;
        root.addEventListener('dragover', (event) => {
            if (!event.dataTransfer?.types.includes('Files')) return;
            event.preventDefault();
            event.stopPropagation();
            root.classList.add('naist-drop-active');
        });
        root.addEventListener('dragleave', (event) => {
            if (event.target === root) root.classList.remove('naist-drop-active');
        });
        root.addEventListener('drop', (event) => {
            const file = event.dataTransfer?.files?.[0];
            root.classList.remove('naist-drop-active');
            if (!file) return;
            // SillyTavern's own drop handler (chat attachments) must not see this file.
            event.preventDefault();
            event.stopPropagation();
            void importPngFile(file);
        });
    }

    mount(container: HTMLElement): void {
        const html = render(panelTemplate, { models: MODELS });
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        this.root = wrapper.firstElementChild as HTMLElement;
        container.append(this.root);
        localize(this.root);
        this.bind();
        this.mountPromptTools();
        this.syncFromSettings();
        this.mountTabs();
        this.controller.subscribe((state) => this.onState(state));
        this.onState(this.controller.state);
    }

    private tabPanel(name: string): HTMLElement {
        const panel = this.root.querySelector<HTMLElement>(`[data-tabpanel="${name}"]`);
        if (!panel) throw new Error(`NAI Studio panel: missing tab ${name}`);
        return panel;
    }

    private mountTabs(): void {
        this.promptsTab = new PromptsTab(
            () => this.scheduleRefresh(),
            () => this.syncStyleFields(),
        );
        this.promptsTab.mount(this.tabPanel('prompts'));
        this.chatTab = new ChatTab((path) => {
            this.onSettingChange(path);
            this.scheduleRefresh();
        });
        this.chatTab.mount(this.tabPanel('chat'));
        this.imagesTab = new ImagesTab(this.imageActions);
        this.imagesTab.mount(this.tabPanel('images'));
        this.installPngDrop();
        // Migration replaces the settings, which already triggers refreshAll() below.
        this.takeoverTab = new TakeoverTab(() => this.scheduleRefresh());
        this.takeoverTab.mount(this.tabPanel('takeover'));
        this.root.querySelectorAll<HTMLElement>('[data-tab]').forEach((tab) => {
            tab.addEventListener('click', () => this.showTab(tab.dataset.tab ?? 'generate'));
        });
        $id(this.root, 'naist_banner_open').addEventListener('click', () => this.showTab('takeover'));
        $id(this.root, 'naist_takeover_banner').classList.toggle('naist-hidden', !isBuiltInActive());
        onExternalChange(() => this.refreshAll());
        this.showTab('generate');
    }

    private refreshAll(): void {
        this.syncFromSettings();
        this.promptsTab?.refresh();
        this.chatTab?.refresh();
        this.imagesTab?.refresh();
        this.takeoverTab?.refresh();
        this.scheduleRefresh();
    }

    showTab(name: string): void {
        this.root.querySelectorAll<HTMLElement>('[data-tabpanel]').forEach((panel) => {
            panel.classList.toggle('naist-hidden', panel.dataset.tabpanel !== name);
        });
        this.root.querySelectorAll<HTMLElement>('[data-tab]').forEach((tab) => {
            tab.classList.toggle('naist-tab-active', tab.dataset.tab === name);
        });
        if (name === 'takeover') this.takeoverTab?.refresh();
        if (name === 'images') this.imagesTab?.refresh();
    }

    // ---- settings <-> controls -------------------------------------------------------------

    private syncFromSettings(): void {
        const s = settings();
        const g = s.generation;
        const r = this.root;
        $id<HTMLSelectElement>(r, 'naist_transport_mode').value = s.transport.mode;
        $id<HTMLSelectElement>(r, 'naist_model').value = g.model;
        $id<HTMLTextAreaElement>(r, 'naist_prompt').value = g.prompt;
        $id<HTMLTextAreaElement>(r, 'naist_negative').value = g.negativePrompt;
        $id<HTMLInputElement>(r, 'naist_width').value = String(g.width);
        $id<HTMLInputElement>(r, 'naist_height').value = String(g.height);
        $id<HTMLInputElement>(r, 'naist_steps').value = String(g.steps);
        $id<HTMLInputElement>(r, 'naist_scale').value = String(g.scale);
        $id<HTMLInputElement>(r, 'naist_cfg_rescale').value = String(g.cfgRescale);
        $id<HTMLInputElement>(r, 'naist_seed').value = String(g.seed);
        $id<HTMLInputElement>(r, 'naist_samples').value = String(g.samples);
        $id<HTMLInputElement>(r, 'naist_smea').checked = g.smea;
        $id<HTMLInputElement>(r, 'naist_smea_dyn').checked = g.smeaDyn;
        $id<HTMLInputElement>(r, 'naist_auto_smea').checked = g.autoSmea;
        $id<HTMLInputElement>(r, 'naist_decrisper').checked = g.decrisper;
        $id<HTMLInputElement>(r, 'naist_variety').checked = g.varietyBoost;
        $id<HTMLInputElement>(r, 'naist_transparent').checked = g.transparentBackground;
        $id<HTMLInputElement>(r, 'naist_legacy_uc').checked = g.legacyUc;
        $id<HTMLInputElement>(r, 'naist_use_coords').checked = g.useCoords;
        $id<HTMLInputElement>(r, 'naist_free_only').checked = s.anlas.freeOnly;
        $id<HTMLInputElement>(r, 'naist_override_enabled').checked = s.rawOverride.enabled;
        $id<HTMLTextAreaElement>(r, 'naist_override_json').value = s.rawOverride.json;
        $id<HTMLInputElement>(r, 'naist_inspect_before').checked = s.inspector.openBeforeSend;
        this.applyModel();
        this.renderCharacters();
        this.renderStyleHint();
    }

    /** The style editor changed the current undesired content or UC preset (v0.13). */
    private syncStyleFields(): void {
        const g = settings().generation;
        const negative = $id<HTMLTextAreaElement>(this.root, 'naist_negative');
        if (negative.value !== g.negativePrompt) negative.value = g.negativePrompt;
        const uc = $id<HTMLSelectElement>(this.root, 'naist_uc_preset');
        if ([...uc.options].some((o) => o.value === g.ucPreset)) uc.value = g.ucPreset;
        this.renderStyleHint();
        this.scheduleRefresh();
    }

    /** Under the undesired content: which style it comes from and whether it was changed since. */
    private renderStyleHint(): void {
        const s = settings();
        const style = activeStyle(s);
        const hint = $id(this.root, 'naist_negative_style');
        const changed = styleChanged(s, style);
        hint.classList.toggle('naist-warning', changed);
        if (!style) {
            hint.textContent = '';
            return;
        }
        const from = t(
            currentNegativeMode(s) === 'append'
                ? 'naist.panel.negativeStyleAppend'
                : 'naist.panel.negativeStyleReplace',
            { name: style.name },
        );
        hint.textContent = changed ? `${from} ${t('naist.panel.negativeStyleChanged')}` : from;
    }

    /** The undesired content or the UC preset was edited here: the style editor shows it as a change. */
    private styleFieldEdited(): void {
        this.promptsTab?.syncStyleFields();
        this.renderStyleHint();
    }

    private caps(): ModelCapabilities {
        const model = settings().generation.model;
        return getCapabilities(isModelId(model) ? model : 'nai-diffusion-4-5-full');
    }

    /** Options and visibility that depend on the selected model. */
    private applyModel(): void {
        const g = settings().generation;
        const caps = this.caps();
        const r = this.root;
        fillSelect(
            $id(r, 'naist_uc_preset'),
            caps.ucPresets.map((id) => ({ value: id, label: t(`naist.ucPreset.${id}`) })),
            g.ucPreset,
        );
        fillSelect(
            $id(r, 'naist_quality'),
            caps.qualityPresets.map((id) => ({ value: id, label: t(`naist.quality.${id}`) })),
            g.qualityPreset,
        );
        fillSelect(
            $id(r, 'naist_sampler'),
            caps.samplers.map((id) => ({ value: id, label: t(`naist.sampler.${id}`) })),
            g.sampler,
        );
        fillSelect(
            $id(r, 'naist_schedule'),
            NOISE_SCHEDULES.filter((n) => caps.noiseSchedules.includes(n)).map((id) => ({
                value: id,
                label: t(`naist.schedule.${id}`),
            })),
            g.noiseSchedule,
        );
        const presets = caps.sizePresets.map((p) => ({
            value: `${p.width}x${p.height}`,
            label: t('naist.size.preset', {
                category: t(`naist.size.${p.category}`),
                orientation: t(`naist.size.${p.orientation}`),
                width: p.width,
                height: p.height,
            }),
        }));
        presets.push({ value: 'custom', label: t('naist.size.custom') });
        const currentSize = `${g.width}x${g.height}`;
        fillSelect(
            $id(r, 'naist_size_preset'),
            presets,
            presets.some((p) => p.value === currentSize) ? currentSize : 'custom',
        );

        // Keep stored values consistent with what the selects show.
        g.ucPreset = $id<HTMLSelectElement>(r, 'naist_uc_preset').value;
        g.qualityPreset = $id<HTMLSelectElement>(r, 'naist_quality').value;
        g.sampler = $id<HTMLSelectElement>(r, 'naist_sampler').value;

        const visible: Record<string, boolean> = {
            characters: caps.maxCharacters > 0,
            noiseSchedule: caps.forcedNoiseSchedule === null && caps.noiseSchedules.length > 0,
            smea: caps.smea,
            smeaDyn: caps.smeaDyn,
            autoSmea: caps.autoSmeaThreshold !== null,
            decrisper: caps.decrisper,
            varietyBoost: caps.varietyBoost,
            transparency: caps.transparency,
            legacyUc: caps.legacyUc,
        };
        r.querySelectorAll<HTMLElement>('[data-cap]').forEach((el) => {
            el.classList.toggle('naist-hidden', visible[el.dataset.cap ?? ''] === false);
        });
        $id(r, 'naist_characters_count').textContent = t('naist.panel.charactersLimit', {
            count: g.characters.length,
            max: caps.maxCharacters,
        });
    }

    private renderCharacters(): void {
        const container = $id(this.root, 'naist_characters');
        const chars = settings().generation.characters;
        container.innerHTML = chars
            .map((c, index) => render(characterRowTemplate, { ...c, index, number: index + 1 }))
            .join('');
        localize(container);
        const caps = this.caps();
        // Slots beyond the model limit stay visible (switching back to V5 restores them) but are
        // unavailable: the builder drops them anyway (TZ Phase 4).
        container.querySelectorAll<HTMLElement>('.naist-character').forEach((row) => {
            const over = Number(row.dataset.index) >= caps.maxCharacters;
            row.classList.toggle('naist-disabled', over);
            row.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea').forEach((el) => {
                el.disabled = over;
            });
            row.title = over ? t('naist.panel.characterOverLimit', { max: caps.maxCharacters }) : '';
        });
        $id(this.root, 'naist_characters_count').textContent = t('naist.panel.charactersLimit', {
            count: chars.length,
            max: caps.maxCharacters,
        });
        $id<HTMLElement>(this.root, 'naist_add_character').classList.toggle(
            'disabled',
            chars.length >= caps.maxCharacters,
        );
    }

    private bind(): void {
        const r = this.root;
        const g = () => settings().generation;
        const changed = () => {
            saveSettings();
            this.scheduleRefresh();
        };
        const text = (id: string, key: FieldKey) =>
            $id<HTMLInputElement | HTMLTextAreaElement>(r, id).addEventListener('input', (e) => {
                (g() as unknown as Record<string, unknown>)[key] = (e.target as HTMLInputElement).value;
                changed();
            });
        const num = (id: string, key: FieldKey) =>
            $id<HTMLInputElement>(r, id).addEventListener('change', (e) => {
                const value = Number((e.target as HTMLInputElement).value);
                if (Number.isFinite(value)) (g() as unknown as Record<string, unknown>)[key] = value;
                changed();
            });
        const flag = (id: string, key: FieldKey) =>
            $id<HTMLInputElement>(r, id).addEventListener('change', (e) => {
                (g() as unknown as Record<string, unknown>)[key] = (e.target as HTMLInputElement).checked;
                changed();
            });
        const select = (id: string, key: FieldKey) =>
            $id<HTMLSelectElement>(r, id).addEventListener('change', (e) => {
                (g() as unknown as Record<string, unknown>)[key] = (e.target as HTMLSelectElement).value;
                changed();
            });

        text('naist_prompt', 'prompt');
        text('naist_negative', 'negativePrompt');
        select('naist_uc_preset', 'ucPreset');
        $id(r, 'naist_negative').addEventListener('input', () => this.styleFieldEdited());
        $id(r, 'naist_uc_preset').addEventListener('change', () => this.styleFieldEdited());
        select('naist_quality', 'qualityPreset');
        select('naist_sampler', 'sampler');
        select('naist_schedule', 'noiseSchedule');
        num('naist_width', 'width');
        num('naist_height', 'height');
        num('naist_steps', 'steps');
        num('naist_scale', 'scale');
        num('naist_cfg_rescale', 'cfgRescale');
        num('naist_seed', 'seed');
        num('naist_samples', 'samples');
        flag('naist_smea', 'smea');
        flag('naist_smea_dyn', 'smeaDyn');
        flag('naist_auto_smea', 'autoSmea');
        flag('naist_decrisper', 'decrisper');
        flag('naist_variety', 'varietyBoost');
        flag('naist_transparent', 'transparentBackground');
        flag('naist_legacy_uc', 'legacyUc');
        flag('naist_use_coords', 'useCoords');

        $id<HTMLSelectElement>(r, 'naist_model').addEventListener('change', (e) => {
            g().model = (e.target as HTMLSelectElement).value;
            this.convertWeightsFor(g().model);
            this.applyModel();
            this.renderCharacters();
            this.styleFieldEdited();
            changed();
        });
        $id<HTMLSelectElement>(r, 'naist_size_preset').addEventListener('change', (e) => {
            const value = (e.target as HTMLSelectElement).value;
            const match = value.match(/^(\d+)x(\d+)$/);
            if (match) {
                g().width = Number(match[1]);
                g().height = Number(match[2]);
                $id<HTMLInputElement>(r, 'naist_width').value = match[1] ?? '';
                $id<HTMLInputElement>(r, 'naist_height').value = match[2] ?? '';
            }
            changed();
        });
        $id<HTMLSelectElement>(r, 'naist_transport_mode').addEventListener('change', (e) => {
            settings().transport.mode = (e.target as HTMLSelectElement).value as TransportMode;
            saveSettings();
            void this.controller.refreshTransport();
        });
        $id(r, 'naist_refresh').addEventListener('click', () => void this.controller.refreshTransport());
        $id<HTMLInputElement>(r, 'naist_free_only').addEventListener('change', (e) => {
            settings().anlas.freeOnly = (e.target as HTMLInputElement).checked;
            this.chatTab?.applyGuards();
            changed();
        });
        $id<HTMLInputElement>(r, 'naist_override_enabled').addEventListener('change', (e) => {
            settings().rawOverride.enabled = (e.target as HTMLInputElement).checked;
            changed();
        });
        $id<HTMLTextAreaElement>(r, 'naist_override_json').addEventListener('input', (e) => {
            settings().rawOverride.json = (e.target as HTMLTextAreaElement).value;
            changed();
        });
        $id<HTMLInputElement>(r, 'naist_inspect_before').addEventListener('change', (e) => {
            settings().inspector.openBeforeSend = (e.target as HTMLInputElement).checked;
            saveSettings();
        });

        $id(r, 'naist_add_character').addEventListener('click', () => {
            const chars = g().characters;
            if (chars.length >= this.caps().maxCharacters) return;
            const center = defaultCenter(chars.length);
            const slot: CharacterSlotSettings = { prompt: '', negative: '', x: center.x, y: center.y, enabled: true };
            chars.push(slot);
            this.renderCharacters();
            changed();
        });
        const charContainer = $id(r, 'naist_characters');
        const charIndex = (target: EventTarget | null) =>
            Number((target as HTMLElement | null)?.closest<HTMLElement>('.naist-character')?.dataset.index ?? -1);
        charContainer.addEventListener('input', (e) => {
            const index = charIndex(e.target);
            const slot = g().characters[index];
            if (!slot) return;
            const el = e.target as HTMLInputElement;
            if (el.classList.contains('naist-char-prompt')) slot.prompt = el.value;
            if (el.classList.contains('naist-char-negative')) slot.negative = el.value;
            if (el.classList.contains('naist-char-x')) slot.x = Number(el.value);
            if (el.classList.contains('naist-char-y')) slot.y = Number(el.value);
            if (el.classList.contains('naist-char-enabled')) slot.enabled = el.checked;
            changed();
        });
        charContainer.addEventListener('change', (e) => {
            const el = e.target as HTMLInputElement;
            if (!el.classList.contains('naist-char-enabled')) return;
            const slot = g().characters[charIndex(e.target)];
            if (slot) slot.enabled = el.checked;
            changed();
        });
        charContainer.addEventListener('click', (e) => {
            if (!(e.target as HTMLElement).classList.contains('naist-char-remove')) return;
            const index = charIndex(e.target);
            if (index < 0) return;
            g().characters.splice(index, 1);
            this.renderCharacters();
            changed();
        });

        $id(r, 'naist_inspect').addEventListener('click', () => void this.inspect());
        $id(r, 'naist_generate').addEventListener('click', () => void this.generate());
        $id(r, 'naist_cancel').addEventListener('click', () => this.controller.cancel());
    }

    // ---- state ---------------------------------------------------------------------------

    private onState(state: StudioState): void {
        const r = this.root;
        const selection = state.selection;
        const badge = $id(r, 'naist_transport_badge');
        if (!selection) {
            badge.textContent = t('naist.transport.detecting');
        } else if (selection.transport.id === 'plugin') {
            badge.textContent = selection.health
                ? t('naist.transport.pluginActive', {
                      version: selection.health.version,
                      token: t(`naist.token.${selection.health.tokenSource}`),
                  })
                : t('naist.transport.pluginMissing');
        } else {
            badge.textContent = selection.degraded
                ? t('naist.transport.nativeDegraded')
                : t('naist.transport.nativeActive');
        }
        badge.classList.toggle(
            'naist-badge-warn',
            !selection || selection.degraded || (selection.transport.id === 'plugin' && !selection.health),
        );

        const account = $id(r, 'naist_account');
        if (state.accountError) {
            account.textContent = t('naist.account.unavailable', { reason: state.accountError.title });
        } else if (state.account.tier > 0 || state.account.anlas > 0) {
            const usage =
                state.account.usagePercent === null
                    ? ''
                    : t('naist.account.usage', { percent: state.account.usagePercent });
            account.textContent = t('naist.account.summary', {
                anlas: state.account.anlas,
                tier: t(`naist.tier.${state.account.tier}`),
                usage,
            });
        } else {
            account.textContent = t('naist.account.loading');
        }

        $id(r, 'naist_generate').classList.toggle('disabled', state.busy);
        $id(r, 'naist_cancel').classList.toggle('naist-hidden', !state.busy);
        if (selection) this.applyTransportFeatures(selection.transport.features);
        this.scheduleRefresh();
    }

    private applyTransportFeatures(features: TransportFeatures): void {
        this.root.querySelectorAll<HTMLElement>('[data-feature]').forEach((el) => {
            const feature = el.dataset.feature as keyof TransportFeatures;
            const supported = features[feature] !== false;
            el.classList.toggle('naist-disabled', !supported);
            el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
                'input, textarea, select',
            ).forEach((input) => {
                input.disabled = !supported;
            });
        });
        this.root.querySelectorAll<HTMLElement>('[data-hint-for]').forEach((el) => {
            const feature = el.dataset.hintFor as keyof TransportFeatures;
            el.textContent = features[feature] === false ? t('naist.transport.featureNeedsPlugin') : '';
        });
    }

    /** Token counter under the prompt fields, tag helpers on every prompt field (TZ Phase 6). */
    private mountPromptTools(): void {
        const negative = $id<HTMLTextAreaElement>(this.root, 'naist_negative');
        this.tokens = createTokenMeter();
        negative.after(this.tokens.element);
        attachPromptAssist(
            this.root,
            '#naist_prompt, #naist_negative, .naist-char-prompt, .naist-char-negative, #naist_prefix, #naist_suffix, #naist_style_negative, #naist_base_negative',
            () => settings().generation.model,
        );
    }

    /** Numeric weights cannot go to V3: convert them to braces when the model changes. */
    private convertWeightsFor(model: string): void {
        if (!settings().promptTools.convertWeights) return;
        const caps = getCapabilities(isModelId(model) ? model : 'nai-diffusion-4-5-full');
        if (caps.v4Prompt) return;
        const g = settings().generation;
        const lossy: string[] = [];
        let changed = false;
        const convert = (text: string) => {
            const result = convertWeights(text, false);
            lossy.push(...result.lossy);
            changed ||= result.changed;
            return result.text;
        };
        g.prompt = convert(g.prompt);
        g.negativePrompt = convert(g.negativePrompt);
        for (const slot of g.characters) {
            slot.prompt = convert(slot.prompt);
            slot.negative = convert(slot.negative);
        }
        if (!changed) return;
        this.syncFromSettings();
        this.promptsTab?.syncStyleFields();
        toastr.info(
            lossy.length
                ? t('naist.weights.convertedLossy', { dropped: lossy.join(', ') })
                : t('naist.weights.converted'),
            t('naist.weights.title'),
        );
    }

    private scheduleRefresh(): void {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => this.refreshPreview(), 250);
    }

    /** Recomputes cost and losses without network access. */
    private refreshPreview(): void {
        const costEl = $id(this.root, 'naist_cost');
        const lostEl = $id(this.root, 'naist_lost');
        try {
            const prepared = this.pipeline.previewFree(settings().generation.prompt);
            this.lastPrepared = prepared;
            if (settings().promptTools.counter) {
                const g = settings().generation;
                const v4 = prepared.body.parameters.v4_prompt;
                this.tokens?.update({
                    model: prepared.request.model,
                    prompt: prepared.body.input,
                    characters: v4 ? v4.caption.char_captions.map((c) => c.char_caption) : [],
                    negative: String(prepared.body.parameters.negative_prompt ?? ''),
                    raw: [g.prompt, g.negativePrompt, ...g.characters.map((c) => c.prompt)].join('\n'),
                });
            }
            this.tokens?.element.classList.toggle('naist-hidden', !settings().promptTools.counter);
            const parts: string[] = [];
            if (prepared.cost.total === 0) {
                parts.push(t('naist.cost.free'));
            } else {
                parts.push(
                    t('naist.cost.paid', {
                        total: prepared.cost.total,
                        perImage: prepared.cost.perImage,
                        billable: prepared.cost.billableSamples,
                    }),
                );
                if (prepared.cost.notFreeReasons.length) {
                    parts.push(
                        t('naist.cost.why', {
                            reasons: prepared.cost.notFreeReasons.map((r) => t(`naist.notFree.${r}`)).join(', '),
                        }),
                    );
                }
            }
            for (const change of prepared.clampChanges) {
                parts.push(t(`naist.clamp.${change.kind}`, change as unknown as Record<string, string | number>));
            }
            if (prepared.blockers.some((b) => b.kind === 'free-only')) parts.push(t('naist.cost.blockedFreeOnly'));
            costEl.textContent = parts.join(' · ');
            costEl.classList.toggle('naist-cost-paid', prepared.cost.total > 0);
            lostEl.textContent = prepared.effective.lost.length
                ? t('naist.transport.lostSummary', {
                      features: prepared.effective.lost.map((l) => t(`naist.lost.${l}`)).join(', '),
                  })
                : '';
        } catch (error) {
            this.lastPrepared = null;
            costEl.textContent = (error instanceof NaiError ? error : toNaiError(error)).text;
            lostEl.textContent = '';
        }
    }

    // ---- actions -------------------------------------------------------------------------

    private showError(error: NaiError): void {
        const box = $id(this.root, 'naist_message');
        box.innerHTML = '';
        box.className = 'naist-message naist-message-error';
        const title = document.createElement('b');
        title.textContent = error.title;
        const text = document.createElement('div');
        text.textContent = error.text;
        box.append(title, text);
        const actionKey = error.action !== 'none' ? `naist.action.${error.action}` : '';
        if (actionKey) {
            const button = document.createElement('div');
            button.className = 'menu_button';
            button.textContent = t(actionKey);
            button.addEventListener('click', () => void this.runAction(error));
            box.append(button);
        }
        toastr.error(error.text, error.title);
    }

    private showInfo(message: string): void {
        const box = $id(this.root, 'naist_message');
        box.className = 'naist-message';
        box.textContent = message;
    }

    private async runAction(error: NaiError): Promise<void> {
        const c = ctx();
        switch (error.action) {
            case 'open-inspector':
                await this.inspect();
                break;
            case 'enable-free-only':
                settings().anlas.freeOnly = true;
                $id<HTMLInputElement>(this.root, 'naist_free_only').checked = true;
                saveSettings();
                this.scheduleRefresh();
                break;
            case 'retry':
                await this.generate();
                break;
            case 'switch-to-v45':
                settings().generation.model = 'nai-diffusion-4-5-full';
                $id<HTMLSelectElement>(this.root, 'naist_model').value = 'nai-diffusion-4-5-full';
                this.applyModel();
                saveSettings();
                break;
            default:
                await c.callGenericPopup(t(`naist.help.${error.action}`), c.POPUP_TYPE.TEXT);
        }
    }

    private async inspect(): Promise<void> {
        try {
            await openInspector(this.pipeline.previewFree(settings().generation.prompt));
        } catch (error) {
            this.showError(error instanceof NaiError ? error : toNaiError(error));
        }
    }

    private async generate(): Promise<void> {
        if (this.controller.state.busy) return;
        const prompt = settings().generation.prompt;
        if (!prompt.trim()) {
            this.showInfo(t('naist.panel.emptyPrompt'));
            return;
        }
        this.showInfo(t('naist.panel.generating'));
        try {
            const result = await this.pipeline.generatePicture({
                initiator: 'panel',
                trigger: prompt,
                mode: MODE.FREE,
            });
            this.showInfo(result ? t('naist.result.posted', { count: 1 }) : t('naist.result.cancelled'));
        } catch (error) {
            const naiError = error instanceof NaiError ? error : toNaiError(error);
            if (naiError.code === 'aborted') {
                this.showInfo(t('naist.result.cancelled'));
                return;
            }
            log.warn('generation failed', naiError.code, naiError.status ?? '');
            this.showError(naiError);
        }
    }
}
