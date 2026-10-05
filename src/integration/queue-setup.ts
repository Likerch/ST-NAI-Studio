// The one NovelAI queue (v0.13.1) follows the chat: another chat drops the waiting requests of the
// old one, deleted or swiped messages drop the requests drawn for them. A request already in flight
// finishes (its result is discarded where it no longer belongs).
import { ctx } from '../core/context';
import { generationQueue } from '../features/generation/queue';

export function setupGenerationQueue(): void {
    const c = ctx();
    const on = (name: string, handler: () => void) => {
        const event = c.eventTypes[name];
        if (event) c.eventSource.on(event, handler);
    };
    on('CHAT_CHANGED', () => void generationQueue.dropOtherChats(ctx().getCurrentChatId()));
    for (const name of ['MESSAGE_DELETED', 'MESSAGE_SWIPED', 'MESSAGE_SWIPE_DELETED']) {
        on(name, () => void generationQueue.revalidate());
    }
}
