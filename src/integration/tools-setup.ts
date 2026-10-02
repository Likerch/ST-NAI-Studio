// Phase 5 wiring: a tools button on every image in the chat (message media and inline images),
// the lightbox action, the vibe provider of the pipeline, /nai-vibes and the panel buttons.
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { settings } from '../core/settings';
import { DEFAULT_MODEL, getCapabilities, isModelId, MODELS } from '../domain';
import type { Pipeline } from '../features/generation/pipeline';
import type { InlineImages } from '../features/inline/inline-service';
import { inlineSource, mediaSource } from '../features/tools/tool-common';
import type { ImageSource } from '../features/tools/tool-common';
import { ToolsService } from '../features/tools/tools-service';
import { VibeLibraryProvider } from '../features/vibes/vibe-library';
import type { VibeNotice } from '../features/vibes/vibe-library';
import { openInpaintEditor } from '../ui/inpaint-editor';
import { registerLightboxAction } from '../ui/lightbox';
import { confirmToolCost, directorDialog, enhanceDialog, toolsMenu } from '../ui/tool-dialogs';
import type { ToolAction } from '../ui/tool-dialogs';
import { openVibeLibrary } from '../ui/vibe-library';
import { setInlineToolsHandler } from './inline-setup';

const MEDIA_BUTTON = 'naist-media-tools';

let state: { pipeline: Pipeline; inline: InlineImages; tools: ToolsService } | null = null;

function features() {
    return state?.pipeline.studio.state.selection?.transport.features ?? null;
}

/** "NAI Diffusion V4.5 Curated (nai-diffusion-4-5-curated-inpainting)" when another model inpaints. */
function fallbackName(tools: ToolsService, model: string): string | null {
    const id = tools.inpaintFallback(model);
    if (!id) return null;
    const base = MODELS.find((m) => m.id === getCapabilities(isModelId(model) ? model : DEFAULT_MODEL).inpaintBase);
    return base ? `${t(base.nameKey)} (${id})` : id;
}

async function runAction(action: ToolAction, source: ImageSource): Promise<void> {
    if (!state) return;
    const { tools, pipeline } = state;
    const meta = source.meta;
    const defaults = {
        prompt: meta?.scenePrompt ?? '',
        negative: meta?.negative ?? '',
        model: meta?.model ?? settings().generation.model,
    };
    switch (action) {
        case 'director': {
            const choice = await directorDialog(source, pipeline.studio.state.account);
            if (choice) await tools.director(source, choice.tool, choice.options);
            return;
        }
        case 'inpaint':
        case 'outpaint': {
            const result = await openInpaintEditor(source, action, (model) => fallbackName(tools, model));
            if (!result) return;
            if (result.kind === 'inpaint') await tools.inpaint(source, result);
            else
                await tools.outpaint(source, result.grow, {
                    prompt: result.prompt,
                    negative: result.negative,
                    model: result.model,
                });
            return;
        }
        case 'upscale':
            await tools.upscale(source);
            return;
        case 'enhance': {
            const choice = await enhanceDialog(source, defaults);
            if (choice) await tools.enhance(source, choice);
            return;
        }
    }
}

export async function openToolsFor(source: () => Promise<ImageSource>, action?: ToolAction): Promise<void> {
    try {
        const chosen = action ?? (await toolsMenu(features()));
        if (!chosen) return;
        await runAction(chosen, await source());
    } catch (error) {
        reportGenerationError(error);
    }
}

function mediaIndexOf(container: Element): { messageId: number; mediaIndex: number } | null {
    const messageId = Number(container.closest('.mes')?.getAttribute('mesid'));
    const index = Number(container.getAttribute('data-index'));
    if (!Number.isInteger(messageId)) return null;
    return { messageId, mediaIndex: Number.isInteger(index) ? index : 0 };
}

/** A small tools button on every media image of the chat ("any picture in the chat", TZ). */
function installMediaButtons(): void {
    const chat = document.getElementById('chat');
    if (!chat) return;
    const decorate = () => {
        chat.querySelectorAll('.mes_img_container').forEach((container) => {
            if (container.querySelector(`.${MEDIA_BUTTON}`)) return;
            const button = document.createElement('div');
            button.title = t('naist.tools.title');
            button.tabIndex = 0;
            button.setAttribute('role', 'button');
            // Into ST's own image controls when present, so it looks and hides like the native buttons.
            const controls = container.querySelector('.mes_img_controls');
            if (controls) {
                button.className = `${MEDIA_BUTTON} right_menu_button fa-lg fa-solid fa-wand-magic-sparkles interactable`;
                controls.append(button);
            } else {
                button.className = `${MEDIA_BUTTON} naist-media-tools-float fa-solid fa-wand-magic-sparkles`;
                container.append(button);
            }
        });
    };
    let pending = false;
    new MutationObserver(() => {
        if (pending) return;
        pending = true;
        setTimeout(() => {
            pending = false;
            decorate();
        }, 50);
    }).observe(chat, { childList: true, subtree: true });
    const activate = (event: Event) => {
        const button = (event.target as HTMLElement).closest(`.${MEDIA_BUTTON}`);
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const where = mediaIndexOf(button.closest('.mes_img_container') ?? button);
        if (where) void openToolsFor(() => mediaSource(where.messageId, where.mediaIndex));
    };
    chat.addEventListener('click', activate);
    chat.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') activate(event);
    });
    decorate();
}

function vibeNotice(notice: VibeNotice): void {
    switch (notice.kind) {
        case 'unavailable':
            toastr.info(t(`naist.vibes.notice.${notice.reason}`, { count: notice.count }), t('naist.vibes.title'));
            return;
        case 'skipped':
            toastr.warning(t(`naist.vibes.skipped.${notice.reason}`, { count: notice.count }), t('naist.vibes.title'));
            return;
        case 'encoded':
            toastr.info(t('naist.vibes.encoded', { count: notice.count, cost: notice.cost }), t('naist.vibes.title'));
            return;
        case 'missing-image':
            toastr.warning(t('naist.vibes.missing', { name: notice.name }), t('naist.vibes.title'));
    }
}

export function setupTools(pipeline: Pipeline, inline: InlineImages): void {
    const confirm = (cost: number, what: string) =>
        confirmToolCost(cost, what === 'vibes' ? t('naist.vibes.encoding') : what, pipeline.studio.state.account.anlas);
    const tools = new ToolsService(pipeline, inline, confirm);
    state = { pipeline, inline, tools };
    pipeline.setVibeProvider(new VibeLibraryProvider(confirm, vibeNotice));
    setInlineToolsHandler((messageId, imageId) => void openToolsFor(() => inlineSource(inline, messageId, imageId)));
    installMediaButtons();
    registerLightboxAction({
        id: 'tools',
        icon: 'fa-wand-magic-sparkles',
        labelKey: 'naist.tools.title',
        available: (item) => Boolean(item.chat),
        run: (item, close) => {
            const chat = item.chat;
            if (!chat) return;
            close();
            const source = chat.imageId
                ? () => inlineSource(inline, chat.messageId, chat.imageId!)
                : () => mediaSource(chat.messageId, chat.mediaIndex ?? 0);
            void openToolsFor(source);
        },
    });
    document.addEventListener('click', (event) => {
        if ((event.target as HTMLElement).closest('#naist_open_vibes')) void openVibeLibrary(features());
    });
    const c = ctx();
    c.eventSource.on(c.eventTypes.APP_READY ?? 'app_ready', () => {
        const { SlashCommandParser: parser, SlashCommand: Command } = ctx();
        parser.addCommandObject(
            Command.fromProps({
                name: 'nai-vibes',
                returns: '',
                helpString: t('naist.command.vibesHelp'),
                callback: async () => {
                    void openVibeLibrary(features());
                    return '';
                },
            }),
        );
        log.info('tools ready');
    });
}
