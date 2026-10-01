// Localization (RECON §8, decision on P-7): en-us.json is bundled as the fallback; ru-ru.json is
// loaded by SillyTavern from the manifest `i18n` field and read back through ctx().translate().
import enUs from '../i18n/en-us.json';

const EN: Record<string, string> = enUs;

type Translator = (text: string, key: string) => string;

let translator: Translator = (text) => text;

/** Wires the host translator (SillyTavern's translate). Called once on activation. */
export function setTranslator(fn: Translator): void {
    translator = fn;
}

function interpolate(text: string, params?: Record<string, string | number>): string {
    if (!params) {
        return text;
    }
    return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/** Translates `key` (naist.<module>.<key>) with `{name}` placeholders. Falls back to English, then to the key. */
export function t(key: string, params?: Record<string, string | number>): string {
    const english = EN[key] ?? key;
    return interpolate(translator(english, key), params);
}

export function hasKey(key: string): boolean {
    return Object.hasOwn(EN, key);
}

/**
 * Fills elements carrying `data-i18n` (same syntax as SillyTavern: `key`, `[attr]key`, `;`-separated).
 * Text keys may also carry params via `data-i18n-params` (JSON).
 */
export function localize(root: ParentNode): void {
    root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
        const spec = element.getAttribute('data-i18n') ?? '';
        let params: Record<string, string | number> | undefined;
        const rawParams = element.getAttribute('data-i18n-params');
        if (rawParams) {
            try {
                params = JSON.parse(rawParams) as Record<string, string | number>;
            } catch {
                params = undefined;
            }
        }
        for (const part of spec.split(';')) {
            const entry = part.trim();
            if (!entry) continue;
            const attr = entry.match(/^\[(\S+)\](.+)$/);
            if (attr?.[1] && attr[2]) {
                element.setAttribute(attr[1], t(attr[2], params));
            } else {
                element.textContent = t(entry, params);
            }
        }
    });
}
