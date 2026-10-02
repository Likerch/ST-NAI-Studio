import { libs } from '../../core/context';

/** Handlebars template -> sanitized HTML (SillyTavern's own Handlebars and DOMPurify). */
export function render(template: string, data: unknown = {}): string {
    const html = libs().Handlebars.compile(template)(data);
    return libs().DOMPurify.sanitize(html);
}

export function $id<T extends HTMLElement = HTMLElement>(root: ParentNode, id: string): T {
    const el = root.querySelector<T>(`#${id}`);
    if (!el) throw new Error(`NAI Studio UI: missing #${id}`);
    return el;
}

export function fillSelect(
    select: HTMLSelectElement,
    options: { value: string; label: string }[],
    current: string,
): void {
    select.innerHTML = '';
    for (const option of options) {
        const el = document.createElement('option');
        el.value = option.value;
        el.textContent = option.label;
        select.append(el);
    }
    select.value = options.some((o) => o.value === current) ? current : (options[0]?.value ?? '');
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Safe for text content and attribute values. */
export function escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}
