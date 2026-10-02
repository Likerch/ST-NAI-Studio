// Inline images and gallery wiring (TZ Phase 3): insert buttons (message menu and edit mode),
// reconciliation on edits / swipes / deletions, lightbox, gallery, slash commands.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { saveSettings, settings } from '../core/settings';
import { activeSwipe, insertPlaceholder, MODE } from '../domain';
import type { GalleryRecord, InlineImage, ModeId } from '../domain';
import { fullBlob } from '../features/gallery/gallery-store';
import type { Pipeline } from '../features/generation/pipeline';
import type { InlineImages } from '../features/inline/inline-service';
import { collectGarbage } from '../features/inline/inline-store';
import { openGallery } from '../ui/gallery';
import { confirmDelete, displayDialog, editDialog, insertDialog } from '../ui/inline-dialogs';
import { openLightbox } from '../ui/lightbox';
import { InlineRenderer } from './inline-render';

const INSERT_CLASS = 'naist-inline-insert';
const EDIT_INSERT_CLASS = 'naist-inline-insert-edit';

let renderer: InlineRenderer | null = null;
let toolsHandler: (messageId: number, imageId: string) => void = () => {};

/** Phase 5 tools register here (avoids an import cycle with tools-setup). */
export function setInlineToolsHandler(handler: (messageId: number, imageId: string) => void): void {
    toolsHandler = handler;
}

export function inlineRenderer(): InlineRenderer | null {
    return renderer;
}

function button(className: string, iconClass: string, titleKey: string): HTMLElement {
    const node = document.createElement('div');
    node.className = `mes_button ${className} fa-solid ${iconClass}`;
    node.setAttribute('data-i18n', `[title]${titleKey}`);
    node.title = t(titleKey);
    return node;
}

function addButtons(): void {
    const add = (container: Element | null, className: string, iconClass: string, titleKey: string) => {
        if (container && !container.querySelector(`.${className}`))
            container.prepend(button(className, iconClass, titleKey));
    };
    add(document.querySelector('#message_template .extraMesButtons'), INSERT_CLASS, 'fa-image', 'naist.inline.insert');
    document
        .querySelectorAll('#chat .mes .extraMesButtons')
        .forEach((c) => add(c, INSERT_CLASS, 'fa-image', 'naist.inline.insert'));
    add(
        document.querySelector('#message_template .mes_edit_buttons'),
        EDIT_INSERT_CLASS,
        'fa-image',
        'naist.inline.insertHere',
    );
    document
        .querySelectorAll('#chat .mes .mes_edit_buttons')
        .forEach((c) => add(c, EDIT_INSERT_CLASS, 'fa-image', 'naist.inline.insertHere'));
    const template = document.querySelector('#message_template');
    if (template) localize(template);
}

function messageIdOf(element: Element): number | null {
    const id = Number(element.closest('.mes')?.getAttribute('mesid'));
    return Number.isInteger(id) ? id : null;
}

/** Offset after the selected text when the selection lies inside this message, else the end. */
function selectionOffset(messageId: number): { offset: number | undefined; text: string } {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? '';
    const anchor = selection?.anchorNode?.parentElement;
    if (!text || !anchor || messageIdOf(anchor) !== messageId) return { offset: undefined, text: '' };
    const mes = ctx().chat[messageId]?.mes ?? '';
    const index = mes.indexOf(text);
    return { offset: index >= 0 ? index + text.length : undefined, text };
}

function lightboxFor(service: InlineImages, messageId: number, entry: InlineImage, url: string) {
    const swipe = activeSwipe(entry);
    if (!swipe) return null;
    return {
        url,
        meta: swipe.meta,
        position: entry.swipes.length > 1 ? `${entry.activeSwipe + 1}/${entry.swipes.length}` : undefined,
        blob: () => service.sourceBlob(swipe),
        ensureFile: () => service.ensureFile(messageId, entry.id),
        chat: { messageId, imageId: entry.id },
    };
}

export function setupInline(pipeline: Pipeline, service: InlineImages): void {
    const c = ctx();
    renderer = new InlineRenderer(service, {
        lightbox: (messageId, imageId) => {
            const entry = service.entries(messageId).find((e) => e.id === imageId);
            const swipe = entry ? activeSwipe(entry) : undefined;
            if (!entry || !swipe || !renderer) return;
            void renderer.urlFor(swipe).then((url) => {
                const item = lightboxFor(service, messageId, entry, url);
                if (item) void openLightbox(item);
            });
        },
        edit: (messageId, imageId) => {
            const entry = service.entries(messageId).find((e) => e.id === imageId);
            const swipe = entry ? activeSwipe(entry) : undefined;
            if (!swipe) return;
            void editDialog(swipe.meta).then((params) => {
                if (params)
                    void renderer?.run(messageId, imageId, () => service.editAndRegenerate(messageId, imageId, params));
            });
        },
        display: (messageId, imageId) => {
            const entry = service.entries(messageId).find((e) => e.id === imageId);
            if (!entry) return;
            void displayDialog(entry.display).then((display) => {
                if (display) void service.updateDisplay(messageId, imageId, display).catch(reportGenerationError);
            });
        },
        tools: (messageId, imageId) => toolsHandler(messageId, imageId),
        confirmDelete,
    });
    renderer.install();
    (globalThis as Record<string, unknown>).NAIST_inlineDebug = () => renderer?.debugState();
    addButtons();

    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const insert = target.closest(`.${INSERT_CLASS}`);
        const editInsert = target.closest(`.${EDIT_INSERT_CLASS}`);
        if (insert) void insertFromMenu(service, insert);
        else if (editInsert) void insertInEditMode(service, editInsert);
        else if (target.closest('.mes_edit_cancel')) {
            const id = messageIdOf(target);
            if (id !== null) setTimeout(() => void service.reconcileMessage(id).then(() => collectGarbage()), 50);
        }
    });

    const on = (name: string, handler: (...args: unknown[]) => unknown) => {
        const event = c.eventTypes[name];
        if (event) c.eventSource.on(event, handler);
    };
    // MESSAGE_EDITED fires before ST re-renders: fix the text so the render already uses it.
    on('MESSAGE_EDITED', (id) => void service.reconcileMessage(Number(id), false).then(() => collectGarbage()));
    for (const name of ['MESSAGE_UPDATED', 'MESSAGE_SWIPED', 'MESSAGE_RECEIVED']) {
        on(name, (id) => void service.reconcileMessage(Number(id)).then(() => collectGarbage()));
    }
    for (const name of ['MESSAGE_DELETED', 'MESSAGE_SWIPE_DELETED']) on(name, () => void collectGarbage());
    on('CHAT_CHANGED', () => {
        renderer?.reset();
        renderer?.applyVisibility();
        renderer?.renderAll();
        void service.reconcileChat();
    });
    on('MORE_MESSAGES_LOADED', () => renderer?.renderAll());
    on('APP_READY', () => registerInlineCommands(pipeline, service));
}

async function insertFromMenu(service: InlineImages, buttonEl: Element): Promise<void> {
    const messageId = messageIdOf(buttonEl);
    if (messageId === null) return;
    const { offset, text } = selectionOffset(messageId);
    const request = await insertDialog(text);
    if (!request) return;
    try {
        await service.insert(messageId, request, offset);
    } catch (error) {
        reportGenerationError(error);
    }
}

/** Edit mode: the placeholder goes into the textarea at the cursor; ST saves it with the text. */
async function insertInEditMode(service: InlineImages, buttonEl: Element): Promise<void> {
    const messageId = messageIdOf(buttonEl);
    const textarea = buttonEl.closest('.mes')?.querySelector<HTMLTextAreaElement>('.edit_textarea');
    if (messageId === null || !textarea) return;
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? start;
    const selected = textarea.value.slice(start, end).trim();
    const request = await insertDialog(selected);
    if (!request) return;
    try {
        const entry = await service.create(messageId, request);
        if (!entry) return;
        textarea.value = insertPlaceholder(textarea.value, entry.id, end);
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        await service.saveCreated(messageId, entry);
        toastr.info(t('naist.inline.insertedInEdit'));
    } catch (error) {
        reportGenerationError(error);
    }
}

export async function openGalleryWindow(pipeline: Pipeline): Promise<void> {
    await openGallery({
        open: (record: GalleryRecord) => {
            void (async () => {
                const blob = await fullBlob(record);
                const url = blob ? URL.createObjectURL(blob) : encodeURI(record.filePath);
                await openLightbox({
                    url,
                    meta: record.meta,
                    blob: async () => {
                        const full = blob ?? (await fullBlob(record));
                        if (!full) throw new Error('image unavailable');
                        return full;
                    },
                    ensureFile: async () => record.filePath,
                });
                if (blob) URL.revokeObjectURL(url);
            })();
        },
        repeat: async (record: GalleryRecord) => {
            const params = await editDialog(record.meta);
            if (!params) return;
            try {
                await pipeline.generatePicture({
                    initiator: 'panel',
                    trigger: params.scene,
                    scene: params.scene,
                    mode: (record.meta.mode ?? MODE.FREE) as ModeId,
                    overrides: {
                        negative: params.negative,
                        generation: {
                            model: params.model,
                            seed: params.seed,
                            width: params.width,
                            height: params.height,
                            steps: params.steps,
                            scale: params.scale,
                            sampler: record.meta.sampler,
                            noiseSchedule: record.meta.noiseSchedule,
                            cfgRescale: record.meta.cfgRescale,
                        },
                    },
                });
            } catch (error) {
                reportGenerationError(error);
            }
        },
    });
}

/** Hide/show the images of this chat; reading mode hides them everywhere. */
export async function setInlineVisibility(state: 'show' | 'hide' | 'reading-on' | 'reading-off'): Promise<void> {
    if (!renderer) return;
    if (state === 'show' || state === 'hide') {
        await renderer.setChatHidden(state === 'hide');
        return;
    }
    settings().inline.readingMode = state === 'reading-on';
    saveSettings();
    renderer.applyVisibility();
}

function registerInlineCommands(pipeline: Pipeline, service: InlineImages): void {
    const {
        SlashCommandParser: parser,
        SlashCommand: Command,
        SlashCommandArgument: Arg,
        SlashCommandNamedArgument: Named,
        ARGUMENT_TYPE: T,
    } = ctx();
    parser.addCommandObject(
        Command.fromProps({
            name: 'nai-insert',
            returns: t('naist.command.insertReturns'),
            helpString: t('naist.command.insertHelp'),
            namedArgumentList: [
                Named.fromProps({
                    name: 'message',
                    description: t('naist.command.arg.message'),
                    typeList: [T.NUMBER ?? 'number'],
                    isRequired: false,
                }),
                Named.fromProps({
                    name: 'at',
                    description: t('naist.command.arg.at'),
                    typeList: [T.NUMBER ?? 'number'],
                    isRequired: false,
                }),
            ],
            unnamedArgumentList: [
                Arg.fromProps({
                    description: t('naist.command.trigger'),
                    typeList: [T.STRING ?? 'string'],
                    isRequired: true,
                }),
            ],
            callback: async (args: Record<string, unknown>, value: unknown) => {
                const chat = ctx().chat;
                const messageId =
                    args.message !== undefined && args.message !== '' ? Number(args.message) : chat.length - 1;
                const trigger = String(value ?? '').trim();
                if (!trigger || !chat[messageId]) return '';
                const at = args.at !== undefined && args.at !== '' ? Number(args.at) : undefined;
                try {
                    const entry = await service.insert(messageId, { trigger, mode: MODE.FREE }, at);
                    return entry?.id ?? '';
                } catch (error) {
                    reportGenerationError(error);
                    return '';
                }
            },
        }),
    );
    parser.addCommandObject(
        Command.fromProps({
            name: 'nai-images',
            returns: t('naist.command.imagesReturns'),
            helpString: t('naist.command.imagesHelp'),
            unnamedArgumentList: [
                Arg.fromProps({
                    description: t('naist.command.imagesArg'),
                    typeList: [T.STRING ?? 'string'],
                    isRequired: false,
                    enumList: ['show', 'hide', 'toggle', 'reading-on', 'reading-off'],
                }),
            ],
            callback: async (_args: Record<string, unknown>, value: unknown) => {
                const action = String(value ?? '').trim();
                const hidden = renderer?.isChatHidden() ?? false;
                if (action === 'toggle') await setInlineVisibility(hidden ? 'show' : 'hide');
                else if (['show', 'hide', 'reading-on', 'reading-off'].includes(action))
                    await setInlineVisibility(action as 'show');
                const reading = settings().inline.readingMode;
                return reading ? 'reading' : renderer?.isChatHidden() ? 'hidden' : 'shown';
            },
        }),
    );
    parser.addCommandObject(
        Command.fromProps({
            name: 'nai-gallery',
            returns: '',
            helpString: t('naist.command.galleryHelp'),
            callback: async () => {
                void openGalleryWindow(pipeline);
                return '';
            },
        }),
    );
    log.info('inline image commands registered');
}
