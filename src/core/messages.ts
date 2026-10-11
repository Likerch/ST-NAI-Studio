// Showing a message again after NAI Studio changed it (its picture placeholders, an image entry, a marker status).
//
// SillyTavern's own message editor ends with updateMessageBlock-style rendering followed by MESSAGE_UPDATED
// (script.js messageEditDone / messageEditCancel, ST 1.19), and the extensions that decorate the rendered text redo
// their work on that event. Re-rendering without it leaves them behind: Doom's Enhancement Suite keeps its
// "bubbles applied" attribute on .mes_text (the element outlives .html()), so the reply stays without its speaker
// cards and inline thoughts; Silly Sim Tracker cards vanish the same way - until the user opens and closes the
// editor. MESSAGE_EDITED is deliberately not sent: the story text did not change (only placeholders), and that event
// makes Qvink summarise the message again and Maestro forget what it knew about the reply.
import { ctx } from './context';
import { log } from './logger';

/** The message has a block in the chat on screen (not above "Show more messages", not another chat). */
function isRendered(messageId: number): boolean {
    if (typeof document === 'undefined') return false;
    return document.querySelector(`#chat .mes[mesid="${messageId}"]`) !== null;
}

/** Re-renders a message and, when it is on screen, tells the other extensions with MESSAGE_UPDATED. */
export async function rerenderMessage(messageId: number, message: STChatMessage): Promise<void> {
    const c = ctx();
    c.updateMessageBlock(messageId, message);
    const event = c.eventTypes?.MESSAGE_UPDATED;
    if (!event || !isRendered(messageId)) return;
    try {
        await c.eventSource.emit(event, messageId);
    } catch (error) {
        log.warn('MESSAGE_UPDATED listeners failed', error);
    }
}
