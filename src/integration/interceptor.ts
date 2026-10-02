// Interactive mode: a user message like "send me a picture of you" aborts the text generation and
// draws instead (built-in processTriggers). Wired through manifest.json `generate_interceptor`.
// Also rewrites inline image placeholders for every generation, quiet ones included.
import { ctx } from '../core/context';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { settings } from '../core/settings';
import { matchInteractiveTrigger, readEntries, textForPrompt } from '../domain';
import type { Pipeline } from '../features/generation/pipeline';
import { ownsCompatSurface } from '../features/takeover/takeover';

export const INTERCEPTOR_NAME = 'NAIST_ProcessTriggers';

type Interceptor = (
    chat: STChatMessage[],
    contextSize: number,
    abort: (immediately: boolean) => void,
    type: string,
) => void;

/**
 * Inline image placeholders never reach the LLM as raw markers (RECON §2.3 item 8). The prompt array
 * is ST's own copy, so replacing an element with a copy leaves the chat untouched. The copy is shallow on
 * purpose: `structuredClone` drops symbol keys, and ST leaves a message out of the prompt by
 * `extra[symbols.ignore]` — Qvink Memory removes summarized messages this way before our interceptor runs.
 */
export function stripPlaceholders(chat: STChatMessage[], mode: 'describe' | 'remove'): void {
    for (let i = 0; i < chat.length; i++) {
        const message = chat[i];
        if (!message?.mes?.includes('[nai:img:')) continue;
        chat[i] = { ...message, mes: textForPrompt(message.mes, readEntries(message.extra), mode) };
    }
}

export function installInterceptor(pipeline: Pipeline): void {
    const interceptor: Interceptor = (chat, _contextSize, abort, type) => {
        const s = settings();
        stripPlaceholders(chat, s.inline.llmText);
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
