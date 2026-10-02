// Inline placeholders are rewritten for the prompt without losing what other interceptors set on the message:
// ST leaves a message out of the prompt by a symbol key in `extra` (Qvink Memory removes summarized ones so).
import { describe, expect, it } from 'vitest';
import { placeholder } from '../../src/domain';
import { stripPlaceholders } from '../../src/integration/interceptor';

const IGNORE = Symbol('ignore');

function message(mes: string, extra: Record<PropertyKey, unknown> = {}): STChatMessage {
    return { name: 'Lyra', is_user: false, is_system: false, send_date: '', mes, extra } as STChatMessage;
}

describe('stripPlaceholders', () => {
    it('keeps the ignore flag another interceptor set, and the chat message itself untouched', () => {
        const original = message(`We ate. ${placeholder('abcdef12')} Then rain.`, { [IGNORE]: true });
        const plain = message('No images here.');
        const chat = [original, plain];

        stripPlaceholders(chat, 'remove');

        expect(chat[0]).not.toBe(original);
        expect(chat[0]?.mes).toBe('We ate. Then rain.');
        expect((chat[0]?.extra as Record<PropertyKey, unknown>)[IGNORE]).toBe(true);
        expect(original.mes).toContain('[nai:img:abcdef12]');
        expect(chat[1]).toBe(plain);
    });
});
