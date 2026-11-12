// Who writes the image markers (v0.16, domain/illustrator.ts). Another extension registers an illustrator
// (NAI_STUDIO_API.registerIllustrator: Maestro's illustrator agent while it is on); only then does the setting
// `markers.writer` count — without one the chat model writes the markers as before, so turning the agent off
// brings them back. In the illustrator mode the rules leave the chat model's prompt: NAI Studio does not inject
// its instruction, and a rules block of the preset (`<images>…</images>` around a `data-nai` example) is cut out
// of the chat completion prompt of a real generation. The rules last seen in a prompt are kept for the
// illustrator (`markerRules`), else NAI Studio's own instruction.
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { findRulesBlocks, isMarkerWriter, stripRulesBlocks } from '../../domain';
import type { MarkerWriter } from '../../domain';

const illustrators = new Map<string, number>();
const listeners = new Set<() => void>();
let seq = 0;
/** The rules blocks of the last real prompt that had any (substituted macros and all). */
let lastRules = '';

function changed(): void {
    for (const listener of [...listeners]) {
        try {
            listener();
        } catch (error) {
            log.warn('illustrator listener failed', error);
        }
    }
}

/** An illustrator is on (another extension writes markers); returns the unregistration. */
export function registerIllustrator(id: string): () => void {
    const token = ++seq;
    const had = illustrators.size > 0;
    illustrators.set(id, token);
    if (!had) changed();
    return () => {
        if (illustrators.get(id) !== token) return;
        illustrators.delete(id);
        if (!illustrators.size) changed();
    };
}

export function illustratorRegistered(): boolean {
    return illustrators.size > 0;
}

/** Registered illustrators came or went (the instruction is rebuilt). */
export function onIllustratorsChange(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/** The setting as stored ("main" when unknown). */
export function writerSetting(): MarkerWriter {
    const value = settings().markers.writer;
    return isMarkerWriter(value) ? value : 'main';
}

/** Who writes the markers now: the setting while markers are on and an illustrator is registered, else "main". */
export function effectiveWriter(): MarkerWriter {
    if (!settings().markers.enabled || !illustratorRegistered()) return 'main';
    return writerSetting();
}

/** Forgets the rules seen (tests; another chat keeps them: they belong to the preset). */
export function resetIllustrator(): void {
    illustrators.clear();
    listeners.clear();
    lastRules = '';
}

export function capturedRules(): string {
    return lastRules;
}

interface PromptMessage {
    role?: string;
    content?: unknown;
}

/**
 * CHAT_COMPLETION_PROMPT_READY of a real generation: the rules blocks are remembered, and cut out in the
 * illustrator mode (a message left empty goes too). Returns how many blocks were cut.
 */
export function handlePrompt(messages: PromptMessage[], options: { strip: boolean }): number {
    const seen: string[] = [];
    let cut = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (!message || typeof message.content !== 'string' || !message.content.includes('data-nai')) continue;
        const blocks = findRulesBlocks(message.content);
        if (!blocks.length) continue;
        seen.unshift(...blocks.map((block) => block.text));
        if (!options.strip) continue;
        const rest = stripRulesBlocks(message.content, blocks);
        cut += blocks.length;
        if (rest.trim()) message.content = rest;
        else messages.splice(i, 1);
    }
    if (seen.length) lastRules = seen.join('\n\n');
    return cut;
}
