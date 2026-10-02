// Live token counter (TZ Phase 6): bars up to the model limit for the prompt (base + characters on
// V4+) and the undesired content, the V5 in-image text separately, and the T5 warning about
// characters it cannot read. Counts the final strings that go to NovelAI.
import { t } from '../core/i18n';
import { countPromptTokens, DEFAULT_MODEL, isModelId, t5UnsupportedChars, tokenizerKind, tokenLimit } from '../domain';
import type { ModelId, TokenCounter } from '../domain';
import { APPROXIMATE, loadTokenizer, readyTokenizer } from '../features/prompt-tools/tokenizers';
import { escapeHtml } from './components/dom';

export interface TokenInput {
    model: string;
    prompt: string;
    characters: string[];
    negative: string;
    /** Text as the user typed it (for the T5 character warning). */
    raw: string;
}

export interface TokenMeter {
    update(input: TokenInput): void;
    element: HTMLElement;
}

function bar(label: string, used: number, limit: number, approx: boolean): string {
    const ratio = Math.min(1, used / limit);
    const state = used > limit ? ' naist-tokens-over' : ratio > 0.9 ? ' naist-tokens-near' : '';
    return `<div class="naist-tokens-row${state}">
        <span class="naist-tokens-label">${escapeHtml(label)}</span>
        <span class="naist-tokens-bar"><span style="width:${Math.round(ratio * 100)}%"></span></span>
        <span class="naist-tokens-count">${approx ? '≈' : ''}${used} / ${limit}</span>
    </div>`;
}

export function createTokenMeter(): TokenMeter {
    const element = document.createElement('div');
    element.className = 'naist-tokens';
    let last: TokenInput | null = null;

    const render = (input: TokenInput) => {
        const model: ModelId = isModelId(input.model) ? input.model : DEFAULT_MODEL;
        const kind = tokenizerKind(model);
        let counter: TokenCounter | null = readyTokenizer(kind);
        if (!counter) {
            void loadTokenizer(kind).then((loaded) => {
                if (loaded && last) render(last);
            });
        }
        const approx = !counter;
        counter ??= APPROXIMATE;
        const prompt = countPromptTokens(counter, model, input.prompt, input.characters);
        const negative = countPromptTokens(counter, model, input.negative, []);
        const parts = [bar(t('naist.tokens.prompt'), prompt.total, prompt.limit, approx)];
        if (prompt.text !== null)
            parts.push(`<div class="naist-hint">${escapeHtml(t('naist.tokens.text', { count: prompt.text }))}</div>`);
        parts.push(bar(t('naist.tokens.negative'), negative.total, tokenLimit(model), approx));
        if (prompt.over)
            parts.push(
                `<div class="naist-warning">${escapeHtml(t('naist.tokens.over', { limit: prompt.limit }))}</div>`,
            );
        if (kind === 't5') {
            const bad = t5UnsupportedChars(input.raw);
            if (bad.length)
                parts.push(
                    `<div class="naist-warning">${escapeHtml(t('naist.tokens.t5Unicode', { chars: bad.slice(0, 12).join(' ') }))}</div>`,
                );
        }
        if (approx) parts.push(`<div class="naist-hint">${escapeHtml(t('naist.tokens.approximate'))}</div>`);
        element.innerHTML = parts.join('');
    };

    return {
        element,
        update(input) {
            last = input;
            render(input);
        },
    };
}
