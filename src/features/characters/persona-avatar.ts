// Persona avatar from the persona's passport (v0.9.2): a free portrait drawn from the passport,
// then uploaded the way SillyTavern's own persona avatar upload does it (crop popup unless avatars
// are never resized, /api/avatars/upload with overwrite_name, cache refresh, persona list re-render).
import { ctx, importHost, requestHeaders } from '../../core/context';
import { joinTags, markerDimensions, MODE, passportTags } from '../../domain';
import type { Passport } from '../../domain';
import type { GeneratedImage } from '../../transport';
import type { Pipeline } from '../generation/pipeline';
import { base64ToBlob } from '../images/image-utils';

/** Framing of an avatar portrait. */
export const AVATAR_FRAMING = 'portrait, upper body, looking at viewer, simple background';

interface PersonasModule {
    getUserAvatars?: (doRender?: boolean, openPageAt?: string) => Promise<unknown>;
}

/** One portrait from the passport (free size on Opus); null when cancelled. */
export async function drawPersonaAvatar(pipeline: Pipeline, passport: Passport): Promise<GeneratedImage | null> {
    const scene = joinTags(passportTags(passport, { allowNsfw: false }), AVATAR_FRAMING);
    // An avatar needs no more than the free area.
    const size = markerDimensions('portrait', undefined, true);
    const produced = await pipeline.produce({
        initiator: 'panel',
        trigger: scene,
        scene,
        mode: MODE.FREE,
        interpret: 'auto',
        noContinuity: true,
        overrides: {
            quiet: true,
            edit: false,
            negative: passport.negative,
            generation: { width: size.width, height: size.height, seed: -1, samples: 1, characters: [] },
        },
    });
    return produced?.images[0] ?? null;
}

export const imageDataUrl = (image: GeneratedImage) => `data:${image.mime};base64,${image.base64}`;

/**
 * Replaces the avatar file of a persona. Returns false when the user closed the crop popup.
 * `file` is the persona's avatar file name (personas.js user_avatar).
 */
export async function uploadPersonaAvatar(file: string, image: GeneratedImage): Promise<boolean> {
    const c = ctx();
    let url = '/api/avatars/upload';
    if (c.powerUserSettings.never_resize_avatars !== true) {
        const popup = new c.Popup('', c.POPUP_TYPE.CROP ?? 5, '', { cropImage: imageDataUrl(image) });
        const result = await popup.show();
        if (!result) return false;
        const crop = (popup as unknown as { cropData?: unknown }).cropData;
        if (crop !== undefined) url += `?crop=${encodeURIComponent(JSON.stringify(crop))}`;
    }
    const form = new FormData();
    const extension = image.mime === 'image/webp' ? 'webp' : 'png';
    form.append(
        'avatar',
        new File([base64ToBlob(image.base64, image.mime)], `avatar.${extension}`, { type: image.mime }),
    );
    form.append('overwrite_name', file);
    const response = await fetch(url, { method: 'POST', headers: requestHeaders(true), cache: 'no-cache', body: form });
    if (!response.ok) throw new Error(`persona avatar upload failed: HTTP ${response.status}`);
    const { path = file } = ((await response.json().catch(() => ({}))) as { path?: string }) ?? {};
    const avatarUrl = `/User Avatars/${encodeURIComponent(path)}`;
    const thumbnailUrl = c.getThumbnailUrl('persona', path);
    await fetch(avatarUrl, { cache: 'reload' }).catch(() => null);
    await fetch(thumbnailUrl, { cache: 'reload' }).catch(() => null);
    try {
        const personas = await importHost<PersonasModule>('/scripts/personas.js');
        await personas.getUserAvatars?.(true, path);
    } catch {
        // the list refreshes on its next render
    }
    // Avatars already on the page (chat messages, persona panel) load the new file.
    const encoded = encodeURIComponent(path);
    document.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
        const src = img.getAttribute('src') ?? '';
        if (!src.includes(encoded) && !src.includes(path)) return;
        img.src = '';
        img.src = src;
    });
    return true;
}
