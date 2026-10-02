// Prompt field helpers (TZ Phase 6), attached by delegation to every matching field of a root:
// tag suggestions while typing (local list, Russian aliases, NovelAI's suggestions through the
// plugin), Ctrl+Up / Ctrl+Down to change the weight of the tag under the cursor in the syntax of
// the model, a warning about unknown tags and a RU -> EN button when the text has Cyrillic.
import { t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import { settings } from '../core/settings';
import {
    currentFragment,
    DEFAULT_MODEL,
    getCapabilities,
    hasCyrillic,
    insertTag,
    isModelId,
    suggestTags,
    TAG_CATEGORIES,
    unknownTags,
    adjustWeight,
} from '../domain';
import type { TagSuggestion } from '../domain';
import { readyTagIndex, remoteTagSuggestions, tagIndex } from '../features/prompt-tools/tag-db';
import { rememberOriginal, translatePrompt } from '../features/translate/translate-service';
import { escapeHtml } from './components/dom';

type Field = HTMLTextAreaElement | HTMLInputElement;

interface Item {
    name: string;
    hint: string;
    category: number;
}

let dropdown: HTMLElement | null = null;
let items: Item[] = [];
let active = 0;
let target: { field: Field; start: number } | null = null;
let remoteTimer: ReturnType<typeof setTimeout> | null = null;

const formatCount = (n: number) =>
    n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n);

function list(): HTMLElement {
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'naist-ac naist-hidden';
        dropdown.setAttribute('role', 'listbox');
        dropdown.addEventListener('mousedown', (event) => {
            const row = (event.target as HTMLElement).closest<HTMLElement>('[data-index]');
            if (!row) return;
            event.preventDefault();
            accept(Number(row.dataset.index));
        });
        document.body.append(dropdown);
    }
    return dropdown;
}

function hide(): void {
    dropdown?.classList.add('naist-hidden');
    items = [];
    target = null;
}

function render(): void {
    const el = list();
    if (!target || !items.length) {
        hide();
        return;
    }
    el.innerHTML = items
        .map(
            (
                item,
                i,
            ) => `<div class="naist-ac-item${i === active ? ' naist-ac-active' : ''} naist-ac-cat-${item.category}" data-index="${i}" role="option">
                <span>${escapeHtml(item.name)}</span><span class="naist-muted">${escapeHtml(item.hint)}</span></div>`,
        )
        .join('');
    const rect = target.field.getBoundingClientRect();
    el.style.left = `${Math.round(rect.left)}px`;
    el.style.top = `${Math.round(rect.bottom + 2)}px`;
    el.style.width = `${Math.round(Math.max(220, Math.min(rect.width, 420)))}px`;
    el.classList.remove('naist-hidden');
}

function fromLocal(suggestions: TagSuggestion[]): Item[] {
    return suggestions.map((s) => ({
        name: s.entry.name,
        hint: [
            s.via ? `← ${s.via}` : '',
            s.entry.count ? formatCount(s.entry.count) : '',
            TAG_CATEGORIES[s.entry.category] ?? '',
        ]
            .filter(Boolean)
            .join(' · '),
        category: s.entry.category,
    }));
}

function accept(index: number): void {
    const item = items[index];
    if (!item || !target) return;
    const { field, start } = target;
    const cursor = field.selectionStart ?? field.value.length;
    const result = insertTag(field.value, start, cursor, item.name);
    field.value = result.text;
    field.setSelectionRange(result.cursor, result.cursor);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    hide();
}

function modelOf(field: Field, model: () => string): string {
    return field.dataset.naistModel || model();
}

function suggest(field: Field, model: () => string): void {
    if (!settings().promptTools.autocomplete) return;
    const cursor = field.selectionStart ?? field.value.length;
    const { start, fragment } = currentFragment(field.value, cursor);
    if (fragment.length < 2 || /^\d*\.?\d*$/.test(fragment)) {
        hide();
        return;
    }
    const index = readyTagIndex();
    if (!index) {
        void tagIndex().then((loaded) => loaded && suggest(field, model));
        return;
    }
    target = { field, start };
    items = fromLocal(suggestTags(index, fragment, 8));
    active = 0;
    render();
    if (remoteTimer) clearTimeout(remoteTimer);
    if (!settings().promptTools.remoteSuggest || items.length >= 8 || hasCyrillic(fragment)) return;
    remoteTimer = setTimeout(() => {
        void remoteTagSuggestions(modelOf(field, model), fragment).then((remote) => {
            if (target?.field !== field) return;
            const known = new Set(items.map((i) => i.name));
            for (const r of remote) {
                if (items.length >= 10) break;
                if (known.has(r.tag)) continue;
                items.push({ name: r.tag, hint: `NovelAI · ${formatCount(r.count)}`, category: 0 });
            }
            render();
        });
    }, 300);
}

/** Line under the field: unknown tags and the translate button. */
function line(field: Field): HTMLElement {
    const next = field.nextElementSibling;
    if (next instanceof HTMLElement && next.classList.contains('naist-assist')) return next;
    const el = document.createElement('div');
    el.className = 'naist-assist';
    field.after(el);
    return el;
}

function refreshLine(field: Field): void {
    const el = line(field);
    const parts: string[] = [];
    if (hasCyrillic(field.value)) {
        parts.push(
            `<span class="menu_button naist-assist-translate" title="${escapeHtml(t('naist.translate.buttonHint'))}">${escapeHtml(t('naist.translate.button'))}</span>`,
        );
    }
    const index = readyTagIndex();
    if (index && settings().promptTools.warnUnknown && !hasCyrillic(field.value)) {
        const unknown = unknownTags(index, field.value).slice(0, 8);
        if (unknown.length)
            parts.push(
                `<span class="naist-muted">${escapeHtml(t('naist.tags.unknown', { tags: unknown.join(', ') }))}</span>`,
            );
    }
    el.innerHTML = parts.join(' ');
    el.classList.toggle('naist-hidden', parts.length === 0);
}

async function translateField(field: Field, button: HTMLElement): Promise<void> {
    button.classList.add('disabled');
    try {
        const original = field.value;
        const result = await translatePrompt(original);
        rememberOriginal(result.text, original);
        field.value = result.text;
        field.dispatchEvent(new Event('input', { bubbles: true }));
        toastr.info(t(result.cached ? 'naist.translate.cached' : 'naist.translate.done'), t('naist.translate.title'));
    } catch (error) {
        reportGenerationError(error);
    } finally {
        button.classList.remove('disabled');
        refreshLine(field);
    }
}

/**
 * Attaches the helpers to fields inside `root` that match `selector`. `model` gives the model the
 * field is for (a field can override it with data-naist-model).
 */
export function attachPromptAssist(root: HTMLElement, selector: string, model: () => string): void {
    const fieldOf = (el: EventTarget | null): Field | null => {
        const node = el as HTMLElement | null;
        return node?.matches?.(selector) ? (node as Field) : null;
    };
    let lineTimer: ReturnType<typeof setTimeout> | null = null;
    root.addEventListener('input', (event) => {
        const field = fieldOf(event.target);
        if (!field) return;
        suggest(field, model);
        if (lineTimer) clearTimeout(lineTimer);
        lineTimer = setTimeout(() => refreshLine(field), 400);
    });
    root.addEventListener('focusin', (event) => {
        const field = fieldOf(event.target);
        if (field) {
            void tagIndex();
            refreshLine(field);
        }
    });
    root.addEventListener('focusout', (event) => {
        if (fieldOf(event.target)) setTimeout(hide, 150);
    });
    root.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('.naist-assist-translate');
        const field = button?.parentElement?.previousElementSibling as Field | null;
        if (button && field && fieldOf(field)) void translateField(field, button);
    });
    root.addEventListener('keydown', (event) => {
        const field = fieldOf(event.target);
        if (!field) return;
        const e = event as KeyboardEvent;
        if ((e.ctrlKey || e.metaKey) && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
            e.preventDefault();
            const id = modelOf(field, model);
            const numeric = getCapabilities(isModelId(id) ? id : DEFAULT_MODEL).v4Prompt;
            const edit = adjustWeight(
                field.value,
                field.selectionStart ?? 0,
                field.selectionEnd ?? 0,
                e.key === 'ArrowUp' ? 1 : -1,
                numeric,
            );
            field.value = edit.text;
            field.setSelectionRange(edit.start, edit.end);
            field.dispatchEvent(new Event('input', { bubbles: true }));
            hide();
            return;
        }
        if (!target || target.field !== field || !items.length) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            active = (active + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
            render();
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            accept(active);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            hide();
        }
    });
}
