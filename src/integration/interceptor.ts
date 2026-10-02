// Interactive mode: a user message like "send me a picture of you" aborts the text generation and
// draws instead (built-in processTriggers). Wired through manifest.json `generate_interceptor`.
import { ctx } from '../core/context';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { settings } from '../core/settings';
import { matchInteractiveTrigger } from '../domain';
import type { Pipeline } from '../features/generation/pipeline';
import { ownsCompatSurface } from '../features/takeover/takeover';

export const INTERCEPTOR_NAME = 'NAIST_ProcessTriggers';

type Interceptor = (
    chat: STChatMessage[],
    contextSize: number,
    abort: (immediately: boolean) => void,
    type: string,
) => void;

export function installInterceptor(pipeline: Pipeline): void {
    const interceptor: Interceptor = (chat, _contextSize, abort, type) => {
        const s = settings();
        if (type === 'quiet' || !s.chat.interactive || !ownsCompatSurface()) return;
        if (s.chat.functionTool && ctx().isToolCallingSupported()) return;
        const last = chat[chat.length - 1];
        if (!last?.mes || !last.is_user) return;
        const trigger = matchInteractiveTrigger(last.mes);
        if (!trigger) return;
        log.info('interactive trigger:', trigger);
        abort(true);
        setTimeout(() => {
            pipeline.generatePicture({ initiator: 'interactive', trigger, message: last.mes }).catch((error) => {
                log.warn('interactive generation failed', error);
                reportGenerationError(error);
            });
        }, 1);
    };
    (globalThis as unknown as Record<string, Interceptor>)[INTERCEPTOR_NAME] = interceptor;
}
