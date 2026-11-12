// A card's avatar from its passport (v0.16, NAI_STUDIO_API.generateCardAvatar; Maestro's portraitist agent asks
// the user first, because it changes the card). Drawn the way a persona avatar is — free only, through the one
// queue as a portrait, ST's default crop — and set through SillyTavern's own `/api/characters/edit-avatar`, which
// keeps the card's data in the new image. The previous image (with the card's data, so it can be imported back)
// is saved first into /user/images/avatar-backups; no backup, no change.
import { ctx, requestHeaders } from '../../core/context';
import { toNaiError } from '../../core/errors';
import { log } from '../../core/logger';
import type { Passport } from '../../domain';
import type { Pipeline } from '../generation/pipeline';
import { base64ToBlob, blobToBase64 } from '../images/image-utils';
import { centeredAvatarCrop, drawFreePersonaAvatar } from './persona-avatar';
import type { DrawnAvatar } from './persona-avatar';

/** SillyTavern's endpoint that replaces a card's image and keeps its data (src/endpoints/characters.js, 1.19). */
export const CARD_AVATAR_URL = '/api/characters/edit-avatar';
/** Folder of /user/images the previous card images go to. */
export const AVATAR_BACKUP_FOLDER = 'avatar-backups';

/** What generateCardAvatar of the API resolves. */
export interface CardAvatarResult {
    ok: boolean;
    /** Path in /user/images of the previous card image (a PNG with the card's data). */
    backup?: string;
    /** "cost", "aborted", "no-card", "no-passport", "backup", "upload", or NAI Studio's error code. */
    error?: string;
}

/** The card's own passport (the card itself, else its first person) as the chat sees it. */
export function cardMainPassport(passports: readonly Passport[]): Passport | null {
    const people = passports.filter((p) => p.kind === 'character');
    return people.find((p) => !p.name.trim()) ?? people[0] ?? null;
}

function stamp(): string {
    return ctx()
        .humanizedDateTime()
        .replace(/[^\w-]+/g, '_');
}

/** The card's current image saved as it is (card data kept) into /user/images; its path. */
async function backupCard(avatar: string): Promise<string> {
    const response = await fetch(`/characters/${encodeURIComponent(avatar)}`, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`card image not read: HTTP ${response.status}`);
    const image = await blobToBase64(await response.blob());
    const name =
        avatar
            .replace(/\.png$/i, '')
            .replace(/[^\p{L}\p{N}_-]+/gu, '_')
            .slice(0, 40) || 'card';
    const saved = await fetch('/api/images/upload', {
        method: 'POST',
        headers: requestHeaders(),
        body: JSON.stringify({ image, format: 'png', ch_name: AVATAR_BACKUP_FOLDER, filename: `${name}_${stamp()}` }),
    });
    if (!saved.ok) throw new Error(`card image not saved: HTTP ${saved.status}`);
    const { path } = (await saved.json()) as { path: string };
    return path;
}

async function uploadCardAvatar(avatar: string, drawn: DrawnAvatar): Promise<void> {
    const c = ctx();
    const crop =
        c.powerUserSettings.never_resize_avatars === true ? null : centeredAvatarCrop(drawn.width, drawn.height);
    const url = crop ? `${CARD_AVATAR_URL}?crop=${encodeURIComponent(JSON.stringify(crop))}` : CARD_AVATAR_URL;
    const form = new FormData();
    form.append('avatar', base64ToBlob(drawn.image.base64, drawn.image.mime), 'avatar.png');
    form.append('avatar_url', avatar);
    const response = await fetch(url, { method: 'POST', headers: requestHeaders(true), body: form });
    if (!response.ok) throw new Error(`card avatar upload failed: HTTP ${response.status}`);
    const thumbnail = c.getThumbnailUrl('avatar', avatar);
    await fetch(thumbnail, { cache: 'reload' }).catch(() => null);
    await fetch(`/characters/${encodeURIComponent(avatar)}`, { cache: 'reload' }).catch(() => null);
    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        const src = img.getAttribute('src') ?? '';
        if (!src.includes(thumbnail) && !src.includes(encodeURIComponent(avatar))) return;
        img.src = '';
        img.src = src;
    });
}

/** Draws a free portrait from the passport, backs the card image up and sets the portrait as the card's image. */
export async function generateCardAvatarFile(
    pipeline: Pipeline,
    avatar: string,
    passport: Passport,
    signal?: AbortSignal,
): Promise<CardAvatarResult> {
    if (signal?.aborted) return { ok: false, error: 'aborted' };
    let drawn: DrawnAvatar | null;
    try {
        drawn = await drawFreePersonaAvatar(pipeline, passport, signal);
    } catch (error) {
        const code = toNaiError(error).code;
        log.warn(`card avatar of "${avatar}" not drawn:`, code);
        return { ok: false, error: code === 'free-only-blocked' ? 'cost' : code };
    }
    if (!drawn || signal?.aborted) return { ok: false, error: 'aborted' };
    let backup: string;
    try {
        backup = await backupCard(avatar);
    } catch (error) {
        log.warn(`card avatar of "${avatar}": the previous image was not saved, nothing changed`, error);
        return { ok: false, error: 'backup' };
    }
    try {
        await uploadCardAvatar(avatar, drawn);
        log.info(`card avatar of "${avatar}" set (previous image: ${backup})`);
        return { ok: true, backup };
    } catch (error) {
        log.warn(`card avatar of "${avatar}" not uploaded`, error);
        return { ok: false, error: 'upload', backup };
    }
}
