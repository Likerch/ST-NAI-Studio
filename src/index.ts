// Entry point loaded by SillyTavern as <script type="module">. Lifecycle hooks are the exported
// functions named in manifest.json `hooks`; ST calls them without arguments (RECON §2.14).
// No side effects at module top level: ST imports this module even for the `enable` hook.
import './ui/style.css';
import { ctx, MODULE_NAME, requestHeaders } from './core/context';
import { setTranslator, t } from './core/i18n';
import { log } from './core/logger';
import { loadSettings, resetSettings } from './core/settings';
import { clearStorage } from './core/storage';
import { AutoGenerator } from './features/auto/auto-generation';
import { recordGeneration } from './features/gallery/gallery-store';
import { StudioController } from './features/generation/controller';
import { Pipeline } from './features/generation/pipeline';
import { InlineImages } from './features/inline/inline-service';
import { SceneService } from './features/scene/scene-service';
import { needsMigration, ownsCompatSurface, runMigration } from './features/takeover/takeover';
import { inlineRenderer, openGalleryWindow, setInlineVisibility, setupInline } from './integration/inline-setup';
import { desIntegration, setupDes } from './integration/des/des-integration';
import { onMarkerSettingChange, setupMarkers } from './integration/markers-setup';
import { setupScenes } from './integration/scene-setup';
import { setupPhase6 } from './integration/phase6-setup';
import { setupTools } from './integration/tools-setup';
import { setupIntegrations } from './integration/setup';
import { installPublicApi, uninstallPublicApi } from './integration/public-api';
import { stopPlaceFollowing } from './features/continuity/continuity-service';
import { syncFunctionTool } from './integration/tools';
import { Panel } from './ui/panel/panel';
import { createPipelineUi } from './ui/panel/pipeline-ui';
import { showReport } from './ui/panel/tab-takeover';

/** SECRET_KEYS.NOVEL in public/scripts/secrets.js. */
const NOVEL_SECRET_KEY = 'api_key_novel';

let controller: StudioController | null = null;

function mountPanel(studio: StudioController, pipeline: Pipeline): void {
    const container =
        document.querySelector<HTMLElement>('#extensions_settings2') ??
        document.querySelector<HTMLElement>('#extensions_settings');
    if (!container) {
        log.error('extensions settings container not found');
        return;
    }
    if (document.querySelector('#naist_panel')) return;
    const onSettingChange = (path: string) => {
        onMarkerSettingChange(path);
        if (path.startsWith('des.')) desIntegration()?.settingsChanged();
        if (
            path.startsWith('chat.functionTool') ||
            path.startsWith('chat.toolCooldown') ||
            path.startsWith('prompts.templates')
        ) {
            syncFunctionTool(pipeline, ownsCompatSurface());
        }
    };
    new Panel(studio, pipeline, onSettingChange, {
        openGallery: () => void openGalleryWindow(pipeline),
        setVisibility: (state) => setInlineVisibility(state),
        chatHidden: () => inlineRenderer()?.isChatHidden() ?? false,
    }).mount(container);
}

/** hooks.activate */
export async function onActivate(): Promise<void> {
    if (controller) return;
    const c = ctx();
    setTranslator((text, key) => c.translate(text, key));
    await loadSettings();
    const studio = new StudioController({
        fetch: (input, init) => fetch(input, init),
        headers: () => requestHeaders(),
    });
    controller = studio;
    const pipeline = new Pipeline(
        studio,
        createPipelineUi(() => studio.state.account.anlas),
    );
    pipeline.onGenerated(recordGeneration);
    mountPanel(studio, pipeline);
    setupIntegrations(pipeline);
    const inline = new InlineImages(pipeline);
    setupInline(pipeline, inline);
    const scenes = new SceneService(pipeline, inline);
    setupScenes(pipeline, scenes);
    setupTools(pipeline, inline);
    setupPhase6(pipeline, scenes);
    const markers = setupMarkers(pipeline, inline, scenes);
    setupDes(markers);
    new AutoGenerator(studio, pipeline).attach();
    // NAI_STUDIO_API for other extensions (Maestro): passports, events, scene providers (v0.10).
    installPublicApi();
    // Network probing must not hold the 5 s activation window.
    void studio.refreshTransport();
    // A NovelAI key written, deleted or rotated in SillyTavern changes the token source and balance.
    for (const name of ['SECRET_WRITTEN', 'SECRET_DELETED', 'SECRET_ROTATED']) {
        const event = c.eventTypes[name];
        if (!event) continue;
        c.eventSource.on(event, (key) => {
            if (key === NOVEL_SECRET_KEY) void studio.refreshTransport();
        });
    }
    // One-time migration from the built-in Image Generation, with a report (TZ Phase 2, task 9).
    if (needsMigration()) {
        c.eventSource.on(c.eventTypes.APP_READY ?? 'app_ready', () => {
            void runMigration()
                .then((report) => showReport(report))
                .catch((error) => log.warn('migration failed', error));
        });
    }
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
    // Enabled again without a page reload: the API comes back with the running extension.
    if (controller) installPublicApi();
    log.info('enabled');
}

/** hooks.disable */
export async function onDisable(): Promise<void> {
    uninstallPublicApi();
    stopPlaceFollowing();
    log.info('disabled');
}

/** hooks.delete */
export async function onDelete(): Promise<void> {
    uninstallPublicApi();
    stopPlaceFollowing();
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
