// "Chat" tab: result visibility, prompt generation switches, LLM integration, auto generation and
// image markers in replies (TZ Phase 7).
import { ctx } from '../../core/context';
import { localize, t } from '../../core/i18n';
import { saveSettings, settings } from '../../core/settings';
import { MARKER_TEMPLATES, markerInstruction, WAND_MODES } from '../../domain';
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
        this.applyGuards();
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
        this.root.querySelector('.naist-markers-options')?.classList.toggle('naist-disabled', !s.markers.enabled);
    }
}
