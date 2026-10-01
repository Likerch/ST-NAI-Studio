// Renders JSON as HTML with optional highlighting of override paths. Long base64 strings are
// abbreviated for display only; copying uses the full object.

const BASE64_MIN = 256;

function escapeHtml(text: string): string {
    return text.replace(
        /[&<>"']/g,
        (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] ?? ch,
    );
}

function renderValue(value: unknown, path: string, highlight: Set<string>, indent: number): string {
    const pad = '  '.repeat(indent);
    let html: string;
    if (value === null || typeof value !== 'object') {
        if (typeof value === 'string' && value.length > BASE64_MIN && /^[A-Za-z0-9+/=]+$/.test(value)) {
            html = `<span class="naist-json-b64">"&lt;base64 ${value.length}&gt;"</span>`;
        } else {
            html = `<span class="naist-json-${value === null ? 'null' : typeof value}">${escapeHtml(JSON.stringify(value))}</span>`;
        }
    } else if (Array.isArray(value)) {
        if (value.length === 0) {
            html = '[]';
        } else {
            const items = value.map(
                (item, i) => `${pad}  ${renderValue(item, `${path}[${i}]`, highlight, indent + 1)}`,
            );
            html = `[\n${items.join(',\n')}\n${pad}]`;
        }
    } else {
        const entries = Object.entries(value);
        if (entries.length === 0) {
            html = '{}';
        } else {
            const items = entries.map(([key, item]) => {
                const childPath = path ? `${path}.${key}` : key;
                return `${pad}  <span class="naist-json-key">${escapeHtml(JSON.stringify(key))}</span>: ${renderValue(item, childPath, highlight, indent + 1)}`;
            });
            html = `{\n${items.join(',\n')}\n${pad}}`;
        }
    }
    return highlight.has(path) ? `<span class="naist-json-override">${html}</span>` : html;
}

export function renderJson(value: unknown, highlightPaths: string[] = []): string {
    return `<pre class="naist-json">${renderValue(value, '', new Set(highlightPaths), 0)}</pre>`;
}
