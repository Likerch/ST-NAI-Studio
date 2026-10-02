// Saves generated images to /user/images (ST's standard place) and puts them into the chat as
// media attachments, the shape the built-in Image Generation uses in 1.19 (RECON §2.1.5, §2.3).
import { ctx, requestHeaders } from '../../core/context';
import { settings } from '../../core/settings';
import { base64ToBlob, blobToBase64 } from '../images/image-utils';
import { exportImage } from '../images/png-io';
import type { GeneratedImage } from '../../transport';

export interface GenerationMeta {
    /** Scene prompt (before prefix/suffix); kept as the attachment title for regeneration. */
    scenePrompt: string;
    /** Final positive prompt sent to NovelAI. */
    prompt: string;
    negative: string;
    mode: number;
    model: string;
    seed: number;
    transport: string;
    cost: number;
    correlationId?: string;
    /** Tool that produced the image (lineart, inpaint, upscale, ...); absent for plain generations. */
    tool?: string;
    /** Saved when the size was forced for this image (slash command width/height). */
    width?: number;
    height?: number;
}

export interface SavedImage {
    path: string;
    seed?: number;
}

export interface MediaAttachmentData extends STMediaAttachment {
    generation_type?: number;
    negative?: string;
    nai_studio?: {
        seed?: number;
        model: string;
        prompt: string;
        transport: string;
        cost: number;
        correlationId?: string;
        tool?: string;
    };
}

function safeName(text: string): string {
    return text.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40) || 'nai';
}

/** Uploads one image to /user/images; with "strip metadata" on it goes up as a clean PNG. */
export async function uploadImage(base64: string, mime: string, folder: string, filename: string): Promise<string> {
    let data = base64;
    let format = mime === 'image/webp' ? 'webp' : mime === 'image/jpeg' ? 'jpg' : 'png';
    if (settings().png.stripMetadata) {
        const clean = await exportImage(base64ToBlob(base64, mime), undefined, { strip: true, format: 'png' });
        data = await blobToBase64(clean);
        format = 'png';
    }
    const response = await fetch('/api/images/upload', {
        method: 'POST',
        headers: requestHeaders(),
        body: JSON.stringify({ image: data, format, ch_name: folder, filename }),
    });
    if (!response.ok) {
        throw new Error(`image upload failed: HTTP ${response.status}`);
    }
    const { path } = (await response.json()) as { path: string };
    return path;
}

export function imageFileName(folder: string, suffix: string | number): string {
    const base = folder ? `${safeName(folder)}_` : '';
    return `${base}${ctx().humanizedDateTime()}_${suffix}`;
}

export async function saveImages(images: GeneratedImage[], folder: string): Promise<SavedImage[]> {
    const saved: SavedImage[] = [];
    for (const image of images) {
        const path = await uploadImage(
            image.base64,
            image.mime,
            folder,
            imageFileName(folder, image.seed ?? image.index),
        );
        saved.push({ path, seed: image.seed });
    }
    return saved;
}

/** systemUserName of script.js: the built-in posts images in group chats under this name. */
export const SYSTEM_USER_NAME = 'SillyTavern System';

/** Author of a result message and {{char}} of its text: the character, or the system user in groups. */
export function resultAuthorName(): string {
    const c = ctx();
    return c.groupId ? SYSTEM_USER_NAME : c.name2;
}

/** Folder in /user/images: character name in 1:1 chats, group id in groups (as the built-in does). */
export function imageFolder(): string {
    const c = ctx();
    return c.groupId ? String(c.groupId) : c.name2 || '';
}

export function toAttachments(saved: SavedImage[], meta: GenerationMeta): MediaAttachmentData[] {
    return saved.map((s) => ({
        url: s.path,
        type: 'image',
        title: meta.scenePrompt,
        source: 'generated',
        generation_type: meta.mode,
        negative: meta.negative,
        ...(meta.width && meta.height ? { width: meta.width, height: meta.height } : {}),
        nai_studio: {
            seed: s.seed ?? meta.seed,
            model: meta.model,
            prompt: meta.prompt,
            transport: meta.transport,
            cost: meta.cost,
            correlationId: meta.correlationId,
            ...(meta.tool ? { tool: meta.tool } : {}),
        },
    }));
}

export interface PostOptions {
    /** Visible to the LLM (normal message) or a system message hidden from the prompt. */
    visible: boolean;
    author: 'character' | 'user';
    /** Show only the image, hide the text. */
    hidePrompt: boolean;
    text: string;
}

export async function postToChat(saved: SavedImage[], meta: GenerationMeta, options: PostOptions): Promise<number> {
    const c = ctx();
    const asUser = options.visible && options.author === 'user';
    const message: STChatMessage = {
        name: asUser ? c.name1 : resultAuthorName(),
        is_user: asUser,
        is_system: !options.visible,
        send_date: new Date().toISOString(),
        mes: options.text,
        extra: {
            media: toAttachments(saved, meta),
            media_display: 'gallery',
            media_index: 0,
            inline_image: !options.hidePrompt,
            nai_studio: {
                model: meta.model,
                seed: meta.seed,
                mode: meta.mode,
                transport: meta.transport,
                cost: meta.cost,
            },
        },
    };
    c.chat.push(message);
    const id = c.chat.length - 1;
    const sentEvent = asUser ? c.eventTypes.MESSAGE_SENT : c.eventTypes.MESSAGE_RECEIVED;
    await c.eventSource.emit(sentEvent ?? 'message_received', id, 'extension');
    c.addOneMessage(message);
    const renderedEvent = asUser ? c.eventTypes.USER_MESSAGE_RENDERED : c.eventTypes.CHARACTER_MESSAGE_RENDERED;
    await c.eventSource.emit(renderedEvent ?? 'character_message_rendered', id, 'extension');
    await c.saveChat();
    return id;
}

/** Adds images as new swipes of a message's media gallery (paintbrush / image overswipe). */
export async function appendToMessage(messageId: number, saved: SavedImage[], meta: GenerationMeta): Promise<void> {
    const c = ctx();
    const message = c.chat[messageId];
    if (!message) return;
    message.extra ??= {};
    const extra = message.extra;
    const media = Array.isArray(extra.media) ? extra.media : [];
    const hadMedia = media.length > 0;
    if (!hadMedia && !extra.media_display) extra.media_display = 'gallery';
    // Same rule as the built-in: a message that already shows its text next to images keeps it.
    extra.inline_image = !(hadMedia && !extra.inline_image);
    media.push(...toAttachments(saved, meta));
    extra.media = media;
    extra.media_index = media.length - 1;
    const element = jQuery(`#chat .mes[mesid="${messageId}"]`);
    if (element.length) c.appendMediaToMessage(message, element, 'keep');
    await c.saveChat();
}

/** Text of the result message from the MESSAGE template ({{prompt}} plus ST macros). */
export function messageText(template: string, scenePrompt: string): string {
    const token = '\u0000NAIST_PROMPT\u0000';
    const withToken = template.split('{{prompt}}').join(token);
    // The positional name2 override of substituteParams is ignored by the 1.19 macro engine.
    return ctx().substituteParamsExtended(withToken, { char: resultAuthorName() }).split(token).join(scenePrompt);
}
