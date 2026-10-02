// "Chat" tab: result visibility, prompt generation switches, LLM integration, auto generation and
// image markers in replies (TZ Phase 7) and the Doom's Enhancement Suite integration (v0.9).
import { ctx } from '../../core/context';
import { localize, t } from '../../core/i18n';
import { saveSettings, settings } from '../../core/settings';
import { reportGenerationError } from '../../core/notify';
import { MARKER_TEMPLATES, markerInstruction, visionApi, visionModel, WAND_MODES } from '../../domain';
import { visionChoices } from '../../features/generation/multimodal';
import { desIntegration } from '../../integration/des/des-integration';
import { bindSettings, readFromSettings } from '../components/bind';
import { $id, escapeHtml, fillSelect, render } from '../components/dom';
import template from '../templates/tab-chat.html?raw';

export class ChatTab {
    private root!: HTMLElement;

    constructor(private readonly onChange: (path: string) => void) {}

    mount(container: HTMLElement): void {
        container.innerHTML = render(template);
        this.root = container;
        fillSelect(
            $id(container, 'naist_auto_mode'),
            WAND_MODES.map((mode) => ({ value: String(mode), label: t(`naist.mode.${mode}`) })),
            String(settings().auto.mode),
        );
        localize(container);
        bindSettings(container, (path) => {
            this.applyGuards();
            this.onChange(path);
        });
        this.bindMarkers();
        this.bindDes();
        void this.fillVision();
        this.applyGuards();
    }

    private visionKeys = new Map<string, boolean>();
    private visionCurrent = '';

    /** Vision APIs with their key state; the select is filled once, the hint follows the choice. */
    private async fillVision(): Promise<void> {
        const { current, apis } = await visionChoices();
        this.visionCurrent = current;
        this.visionKeys = new Map(apis.map((a) => [a.id, a.hasKey]));
        const select = $id<HTMLSelectElement>(this.root, 'naist_mm_api');
        const keyNote = (has: boolean) => (has ? t('naist.multimodal.keySet') : t('naist.multimodal.keyMissing'));
        fillSelect(
            select,
            [
                { value: '', label: t('naist.multimodal.apiCaptioning', { api: current }) },
                ...apis.map((a) => ({ value: a.id, label: `${a.label} — ${keyNote(a.hasKey)}` })),
            ],
            settings().modes.multimodalApi,
        );
        this.applyGuards();
    }

    private bindDes(): void {
        const button = $id(this.root, 'naist_des_passports');
        button.addEventListener('click', () => {
            const des = desIntegration();
            if (!des?.active() || button.classList.contains('disabled')) return;
            button.classList.add('disabled');
            void des
                .passportsForTracker()
                .then((count) => toastr.info(t('naist.des.passportsDone', { count }), t('naist.des.title')))
                .catch(reportGenerationError)
                .finally(() => button.classList.remove('disabled'));
        });
    }

    private desStatusText(): string {
        const status = desIntegration()?.status();
        if (!status || status.state === 'searching') return t('naist.des.statusSearching');
        if (status.state === 'absent') return t('naist.des.statusAbsent');
        const base = t('naist.des.statusConnected', { version: status.version ?? '?', mode: status.mode });
        const notes = [
            status.enabled ? '' : t('naist.des.statusOff'),
            status.verified ? '' : t('naist.des.statusUnverified'),
        ].filter(Boolean);
        return [base, ...notes].join(' ');
    }

    private bindMarkers(): void {
        $id(this.root, 'naist_markers_template_default').addEventListener('click', () => {
            settings().markers.template = MARKER_TEMPLATES.natural;
            saveSettings();
            readFromSettings(this.root);
            this.onChange('markers.template');
        });
        $id(this.root, 'naist_markers_preview').addEventListener('click', () => {
            const m = settings().markers;
            const text = markerInstruction(m.preset, m.template, {
                min: m.min,
                max: m.max,
                captionLanguage: m.captionLanguage,
                chars: [t('naist.markers.previewChars')],
            });
            void ctx().callGenericPopup(
                `<div class="naist-hint">${escapeHtml(t('naist.markers.previewHint'))}</div><pre class="naist-pre">${escapeHtml(text)}</pre>`,
                ctx().POPUP_TYPE.TEXT,
                '',
                { wide: true, allowVerticalScrolling: true },
            );
        });
    }

    /** Re-reads every control after settings changed outside of this tab. */
    refresh(): void {
        readFromSettings(this.root);
        this.applyGuards();
    }

    /** Paid auto generation is meaningless while free-only is on: show it disabled. */
    applyGuards(): void {
        const s = settings();
        for (const id of ['naist_auto_allow_paid', 'naist_markers_allow_paid', 'naist_markers_max_cost']) {
            const control = $id<HTMLInputElement>(this.root, id);
            control.disabled = s.anlas.freeOnly;
            control.closest('label')?.classList.toggle('naist-disabled', control.disabled);
        }
        $id(this.root, 'naist_markers_custom').classList.toggle('naist-hidden', s.markers.preset !== 'custom');
        $id(this.root, 'naist_des_status').textContent = this.desStatusText();
        const api = s.modes.multimodalApi;
        const model = $id<HTMLInputElement>(this.root, 'naist_mm_model');
        model.disabled = !api;
        model.placeholder = api ? visionModel(api, '') : t('naist.multimodal.modelCaptioning');
        const chosen = api || this.visionCurrent;
        const missing = chosen && this.visionKeys.size > 0 && this.visionKeys.get(chosen) === false;
        $id(this.root, 'naist_mm_hint').textContent = missing
            ? t('naist.multimodal.noKey', { api: visionApi(chosen)?.label ?? chosen })
            : t('naist.multimodal.hint');
        this.root.querySelector('.naist-mm-source')?.classList.toggle('naist-disabled', !s.modes.multimodal);
        const connected = desIntegration()?.status().state === 'connected';
        this.root.querySelector('.naist-des-options')?.classList.toggle('naist-disabled', !connected || !s.des.enabled);
        this.root.querySelector('.naist-markers-options')?.classList.toggle('naist-disabled', !s.markers.enabled);
    }
}
