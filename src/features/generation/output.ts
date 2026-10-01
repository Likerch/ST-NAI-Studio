// Saves generated images to /user/images (ST's standard place) and posts them to the chat as a
// media message, the same shape the built-in Image Generation uses in 1.19 (RECON §2.1.5, §2.3).
import { ctx, requestHeaders } from '../../core/context';
import type { GeneratedImage } from '../../transport';

export interface GenerationMeta {
    prompt: string;
    model: string;
    seed: number;
    transport: string;
    cost: number;
    correlationId?: string;
}

export interface SavedImage {
    path: string;
    seed?: number;
}

function safeName(text: string): string {
    return text.replace(/[^\p{L}\p{N}_-]+/gu, '_').slice(0, 40) || 'nai';
}

export async function saveImages(images: GeneratedImage[], folder: string): Promise<SavedImage[]> {
    const c = ctx();
    const saved: SavedImage[] = [];
    for (const image of images) {
        const format = image.mime === 'image/webp' ? 'webp' : 'png';
        const filename = `${safeName(folder)}_${c.humanizedDateTime()}_${image.seed ?? image.index}`;
        const response = await fetch('/api/images/upload', {
            method: 'POST',
            headers: requestHeaders(),
            body: JSON.stringify({ image: image.base64, format, ch_name: folder, filename }),
        });
        if (!response.ok) {
            throw new Error(`image upload failed: HTTP ${response.status}`);
        }
        const { path } = (await response.json()) as { path: string };
        saved.push({ path, seed: image.seed });
    }
    return saved;
}

/** Folder in /user/images: character name in 1:1 chats, group id in groups (as the built-in does). */
export function imageFolder(): string {
    const c = ctx();
    return c.groupId ? String(c.groupId) : c.name2 || '';
}

export async function postToChat(
    saved: SavedImage[],
    meta: GenerationMeta,
    hiddenFromPrompt: boolean,
): Promise<number> {
    const c = ctx();
    const message: STChatMessage = {
        name: c.name2,
        is_user: false,
        is_system: hiddenFromPrompt,
        send_date: new Date().toISOString(),
        mes: meta.prompt,
        extra: {
            media: saved.map((s) => ({
                url: s.path,
                type: 'image' as const,
                title: meta.prompt,
                source: 'generated' as const,
            })),
            media_display: 'gallery',
            media_index: 0,
            inline_image: false,
            nai_studio: {
                model: meta.model,
                seed: meta.seed,
                seeds: saved.map((s) => s.seed),
                transport: meta.transport,
                cost: meta.cost,
                correlationId: meta.correlationId,
            },
        },
    };
    c.chat.push(message);
    const id = c.chat.length - 1;
    await c.eventSource.emit(c.eventTypes.MESSAGE_RECEIVED ?? 'message_received', id, 'extension');
    c.addOneMessage(message);
    await c.eventSource.emit(c.eventTypes.CHARACTER_MESSAGE_RENDERED ?? 'character_message_rendered', id, 'extension');
    await c.saveChat();
    return id;
}
