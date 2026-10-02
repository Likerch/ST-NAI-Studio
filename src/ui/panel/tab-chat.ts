// "Chat" tab: result visibility, prompt generation switches, LLM integration and auto generation.
import { localize, t } from '../../core/i18n';
import { settings } from '../../core/settings';
import { WAND_MODES } from '../../domain';
import { bindSettings, readFromSettings } from '../components/bind';
import { $id, fillSelect, render } from '../components/dom';
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
        this.applyGuards();
    }

    /** Re-reads every control after settings changed outside of this tab. */
    refresh(): void {
        readFromSettings(this.root);
        this.applyGuards();
    }

    /** Paid auto generation is meaningless while free-only is on: show it disabled. */
    applyGuards(): void {
        const allowPaid = $id<HTMLInputElement>(this.root, 'naist_auto_allow_paid');
        allowPaid.disabled = settings().anlas.freeOnly;
        allowPaid.closest('label')?.classList.toggle('naist-disabled', allowPaid.disabled);
    }
}
