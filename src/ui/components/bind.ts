// Two-way binding of controls carrying data-setting="path.to.key" to the extension settings.
// checkbox -> boolean, number input or data-type="number" -> number, anything else -> string.
import { saveSettings, settings } from '../../core/settings';

type Bag = Record<string, unknown>;

function resolve(path: string): { parent: Bag; key: string } | null {
    const parts = path.split('.');
    const key = parts.pop();
    let node: unknown = settings();
    for (const part of parts) {
        if (!node || typeof node !== 'object') return null;
        node = (node as Bag)[part];
    }
    return key && node && typeof node === 'object' ? { parent: node as Bag, key } : null;
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isNumeric(el: Control): boolean {
    return (el instanceof HTMLInputElement && el.type === 'number') || el.dataset.type === 'number';
}

export function readFromSettings(root: ParentNode): void {
    root.querySelectorAll<Control>('[data-setting]').forEach((el) => {
        const target = resolve(el.dataset.setting ?? '');
        if (!target) return;
        const value = target.parent[target.key];
        if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = value === true;
        else el.value = value === undefined || value === null ? '' : String(value);
    });
}

/** Binds every [data-setting] control under `root`; `onChange` receives the changed path. */
export function bindSettings(root: ParentNode, onChange: (path: string) => void = () => {}): void {
    readFromSettings(root);
    root.querySelectorAll<Control>('[data-setting]').forEach((el) => {
        const isCheckbox = el instanceof HTMLInputElement && el.type === 'checkbox';
        const isText = !isCheckbox && !(el instanceof HTMLSelectElement) && !isNumeric(el);
        el.addEventListener(isText ? 'input' : 'change', () => {
            const path = el.dataset.setting ?? '';
            const target = resolve(path);
            if (!target) return;
            if (isCheckbox) {
                target.parent[target.key] = (el as HTMLInputElement).checked;
            } else if (isNumeric(el)) {
                const value = Number(el.value);
                if (!Number.isFinite(value)) return;
                target.parent[target.key] = value;
            } else {
                target.parent[target.key] = el.value;
            }
            saveSettings();
            onChange(path);
        });
    });
}
