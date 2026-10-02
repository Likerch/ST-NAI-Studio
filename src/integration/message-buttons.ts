// Per-message "brush" button (built-in .sd_message_gen parity) and image overswipe generation.
// The button is added to ST's message template, so every rendered message gets it.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import type { MediaAttachmentData } from '../features/generation/output';
import type { Pipeline } from '../features/generation/pipeline';
import { ownsCompatSurface } from '../features/takeover/takeover';

const BUTTON_CLASS = 'naist-message-gen';
const IDLE = 'fa-palette';
const BUSY = 'fa-hourglass';

function buttonElement(): HTMLElement {
    const button = document.createElement('div');
    button.className = `mes_button ${BUTTON_CLASS} fa-solid ${IDLE}`;
    button.setAttribute('data-i18n', '[title]naist.message.generate');
    button.title = t('naist.message.generate');
    return button;
}

function addToContainer(container: Element | null): void {
    if (container && !container.querySelector(`.${BUTTON_CLASS}`)) container.prepend(buttonElement());
}

const running = new WeakMap<HTMLElement, AbortController>();

async function regenerate(pipeline: Pipeline, button: HTMLElement, animate: boolean): Promise<void> {
    const existing = running.get(button);
    if (existing) {
        existing.abort();
        return;
    }
    const messageElement = button.closest<HTMLElement>('.mes');
    const messageId = Number(messageElement?.getAttribute('mesid'));
    const message = ctx().chat[messageId];
    if (!message) return;
    const media = (Array.isArray(message.extra?.media) ? message.extra?.media : []) as MediaAttachmentData[];
    const attachment = media.length
        ? (media[message.extra?.media_index ?? media.length - 1] ?? media[media.length - 1])
        : undefined;
    const controller = new AbortController();
    running.set(button, controller);
    button.classList.replace(IDLE, BUSY);
    const image = animate ? messageElement?.querySelector('.mes_img') : null;
    image?.classList.add('fa-fade');
    try {
        await pipeline.generatePicture({
            initiator: 'message',
            trigger: '',
            swipe: { messageId, attachment, text: attachment ? undefined : message.mes },
            signal: controller.signal,
        });
    } catch (error) {
        reportGenerationError(error);
    } finally {
        running.delete(button);
        button.classList.replace(BUSY, IDLE);
        image?.classList.remove('fa-fade');
    }
}

export function installMessageButtons(pipeline: Pipeline): void {
    addToContainer(document.querySelector('#message_template .extraMesButtons'));
    document.querySelectorAll('#chat .mes .extraMesButtons').forEach(addToContainer);
    const template = document.querySelector('#message_template');
    if (template) localize(template);

    document.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>(`.${BUTTON_CLASS}`);
        if (button) void regenerate(pipeline, button, false);
    });

    // Image overswipe (power_user.image_overswipe === "generate") was handled by the built-in.
    const c = ctx();
    c.eventSource.on(c.eventTypes.IMAGE_SWIPED ?? 'image_swiped', (payload) => {
        if (!ownsCompatSurface()) return;
        const { message, element, direction } = (payload ?? {}) as {
            message?: STChatMessage;
            element?: { get(i: number): HTMLElement | undefined };
            direction?: string;
        };
        if (!message || direction !== 'right' || ctx().powerUserSettings.image_overswipe !== 'generate') return;
        const media = message.extra?.media;
        if (!Array.isArray(media) || media.length === 0 || message.extra?.media_index !== media.length - 1) return;
        const button = element?.get(0)?.querySelector<HTMLElement>(`.${BUTTON_CLASS}`);
        if (button) void regenerate(pipeline, button, true);
    });
}
