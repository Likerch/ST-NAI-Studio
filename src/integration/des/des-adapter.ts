// Doom's Enhancement Suite adapter (v0.9): the only place that knows where DES lives and which of
// its modules and exports NAI Studio uses. DES is found by its manifest; its ES modules are imported
// from the same address as DES's own script (one instance, live objects). Checked on DES 2.6.0.
import { ctx, importHost } from '../../core/context';
import { log } from '../../core/logger';

export const DES_REPO = 'dangerdaza/dooms-enhancement-suite';
export const DES_VERIFIED = ['2.6.0'];

const MODULES = {
    state: { path: 'src/core/state.js', exports: { extensionSettings: 'object' } },
    persistence: { path: 'src/core/persistence.js', exports: { saveSettings: 'function' } },
    avatars: { path: 'src/systems/features/avatarGenerator.js', exports: { regenerateAvatar: 'function' } },
    portraitBar: { path: 'src/systems/ui/portraitBar.js', exports: { updatePortraitBar: 'function' } },
} as const;

type DesSettings = Record<string, unknown> & {
    enabled?: boolean;
    generationMode?: string;
    autoPortraitMode?: string;
    autoGenerateAvatars?: boolean;
    portraitEnhancementMode?: string;
    npcAvatars?: Record<string, string>;
    generatedPortraits?: Record<string, unknown>;
    characterAppearance?: Record<string, string>;
    characterAliases?: Record<string, string[]>;
};

export interface DesApi {
    /** Internal extension name ("third-party/<folder>"). */
    name: string;
    version: string | null;
    verified: boolean;
    /** DES's live settings object. */
    settings: DesSettings;
    /** DES is on (its own switch) and not disabled in ST. */
    enabled(): boolean;
    mode(): 'together' | 'separate' | 'external';
    save(): void;
    /** DES's own regeneration: old portrait to history, /sd with the Workshop appearance line, stored by DES. */
    regeneratePortrait(name: string): Promise<string | null>;
    refreshPortraits(): void;
}

interface Manifest {
    js?: string;
    version?: string;
    homePage?: string;
    display_name?: string;
}

async function extensionNames(): Promise<string[]> {
    try {
        const module = await importHost<{ extensionNames?: string[] }>('/scripts/extensions.js');
        if (Array.isArray(module.extensionNames) && module.extensionNames.length) return module.extensionNames;
    } catch (error) {
        log.warn('DES: extension list not available', error);
    }
    return ['third-party/Dooms-Enhancement-Suite'];
}

async function manifestOf(name: string): Promise<Manifest | null> {
    try {
        const response = await fetch(`/scripts/extensions/${name}/manifest.json`, { cache: 'no-store' });
        return response.ok ? ((await response.json()) as Manifest) : null;
    } catch {
        return null;
    }
}

const isDes = (manifest: Manifest | null): boolean =>
    !!manifest &&
    (String(manifest.homePage ?? '')
        .toLowerCase()
        .includes(DES_REPO) ||
        manifest.display_name === "Doom's Enhancement Suite");

/** DES's own module script on the page: its address is the base for importing DES modules. */
function scriptOf(name: string, manifest: Manifest): string | null {
    const suffix = `/scripts/extensions/${name}/${manifest.js || 'index.js'}`;
    for (const script of document.querySelectorAll<HTMLScriptElement>('script[type="module"][src]')) {
        try {
            if (decodeURIComponent(new URL(script.src, location.href).pathname).endsWith(suffix)) return script.src;
        } catch {
            // a broken src of someone else's script
        }
    }
    return null;
}

/** The imported settings are DES's live object (or share its nested objects before its first save). */
function isLive(settings: unknown, saved: unknown): boolean {
    if (!settings || typeof settings !== 'object') return false;
    if (!saved || typeof saved !== 'object') return true;
    if (settings === saved) return true;
    return Object.entries(saved as Record<string, unknown>).some(
        ([key, value]) => value && typeof value === 'object' && (settings as Record<string, unknown>)[key] === value,
    );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Finds DES and connects to it; null when DES is not installed, disabled in ST, or its modules
 * do not have what NAI Studio uses. Waits for DES's asynchronous start (up to `timeoutMs`).
 */
export async function connectDes(timeoutMs = 60000): Promise<DesApi | null> {
    let found: { name: string; manifest: Manifest } | null = null;
    for (const name of await extensionNames()) {
        if (!name.startsWith('third-party/')) continue;
        const manifest = await manifestOf(name);
        if (isDes(manifest)) {
            found = { name, manifest: manifest! };
            break;
        }
    }
    if (!found) return null;

    const c = ctx();
    const disabled = c.extensionSettings.disabledExtensions;
    if (Array.isArray(disabled) && disabled.includes(found.name)) return null;
    // DES's script appears once ST loads it; its settings are ready when its drawer toggle exists.
    const started = Date.now();
    let script: string | null = null;
    while (Date.now() - started < timeoutMs) {
        script = scriptOf(found.name, found.manifest);
        if (script && document.querySelector('#rpg-extension-enabled')) break;
        await wait(500);
    }
    if (!script) return null;
    const namespaces: Record<string, Record<string, unknown>> = {};
    for (const [key, spec] of Object.entries(MODULES)) {
        try {
            const namespace = (await import(/* @vite-ignore */ new URL(spec.path, script).href)) as Record<
                string,
                unknown
            >;
            for (const [exportName, type] of Object.entries(spec.exports)) {
                if (typeof namespace[exportName] !== type || namespace[exportName] === null) {
                    log.warn(`DES: ${spec.path} has no ${exportName}`);
                    return null;
                }
            }
            namespaces[key] = namespace;
        } catch (error) {
            log.warn(`DES: ${spec.path} did not load`, error);
            return null;
        }
    }
    const settings = namespaces.state!.extensionSettings as DesSettings;
    if (!isLive(settings, c.extensionSettings[found.name])) {
        log.warn('DES: the settings object is not the live one');
        return null;
    }
    const version = found.manifest.version ?? null;
    const name = found.name;
    return {
        name,
        version,
        verified: version !== null && DES_VERIFIED.includes(version),
        settings,
        enabled: () => settings.enabled !== false,
        mode: () =>
            settings.generationMode === 'separate' || settings.generationMode === 'external'
                ? settings.generationMode
                : 'together',
        save: () => (namespaces.persistence!.saveSettings as () => void)(),
        regeneratePortrait: async (character: string) =>
            (await (namespaces.avatars!.regenerateAvatar as (n: string) => Promise<string | null>)(character)) ?? null,
        refreshPortraits: () => {
            try {
                (namespaces.portraitBar!.updatePortraitBar as () => void)();
            } catch (error) {
                log.warn('DES: portrait bar refresh failed', error);
            }
        },
    };
}
