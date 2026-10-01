// Entry point loaded by SillyTavern as <script type="module">. Lifecycle hooks are the exported
// functions named in manifest.json `hooks`; ST calls them without arguments (RECON §2.14).
// No side effects at module top level: ST imports this module even for the `enable` hook.
import './ui/style.css';
import { ctx, MODULE_NAME, requestHeaders } from './core/context';
import { setTranslator, t } from './core/i18n';
import { log } from './core/logger';
import { loadSettings, resetSettings } from './core/settings';
import { clearStorage } from './core/storage';
import { StudioController } from './features/generation/controller';
import { Panel } from './ui/panel/panel';

let controller: StudioController | null = null;

function mountPanel(studio: StudioController): void {
    const container =
        document.querySelector<HTMLElement>('#extensions_settings2') ??
        document.querySelector<HTMLElement>('#extensions_settings');
    if (!container) {
        log.error('extensions settings container not found');
        return;
    }
    if (document.querySelector('#naist_panel')) return;
    new Panel(studio).mount(container);
}

/** hooks.activate */
export async function onActivate(): Promise<void> {
    if (controller) return;
    const c = ctx();
    setTranslator((text, key) => c.translate(text, key));
    await loadSettings();
    controller = new StudioController({
        fetch: (input, init) => fetch(input, init),
        headers: () => requestHeaders(),
    });
    mountPanel(controller);
    // Network probing must not hold the 5 s activation window.
    void controller.refreshTransport();
    log.info(`${MODULE_NAME} activated`);
}

/** hooks.install */
export async function onInstall(): Promise<void> {
    log.info('installed');
    toastr.info(t('naist.lifecycle.installed'));
}

/** hooks.update */
export async function onUpdate(): Promise<void> {
    log.info('updated');
}

/** hooks.enable */
export async function onEnable(): Promise<void> {
    log.info('enabled');
}

/** hooks.disable */
export async function onDisable(): Promise<void> {
    log.info('disabled');
}

/** hooks.delete */
export async function onDelete(): Promise<void> {
    log.info('deleted');
}

/** hooks.clean: removes settings and IndexedDB data. */
export async function onClean(): Promise<void> {
    resetSettings();
    try {
        await clearStorage();
    } catch (error) {
        log.warn('storage cleanup failed', error);
    }
    toastr.info(t('naist.lifecycle.cleaned'));
}
