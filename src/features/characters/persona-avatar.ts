// Persona avatar from the persona's passport (v0.9.2): a free portrait drawn from the passport,
// then uploaded the way SillyTavern's own persona avatar upload does it (crop popup unless avatars
// are never resized, /api/avatars/upload with overwrite_name, cache refresh, persona list re-render).
// Since 0.15 another extension can have one drawn for any persona (NAI_STUDIO_API.generatePersonaAvatar):
// free only, through the one queue, and uploaded with ST's default crop instead of the popup.
import { ctx, importHost, requestHeaders } from '../../core/context';
import { toNaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import type { GenerationSettings } from '../../core/settings-schema';
import { FREE_MAX_STEPS, joinTags, markerDimensions, MODE, passportTags } from '../../domain';
import type { Passport } from '../../domain';
import type { GeneratedImage } from '../../transport';
import type { Pipeline, PictureRequest } from '../generation/pipeline';
import { base64ToBlob } from '../images/image-utils';

/** Framing of an avatar portrait. */
export const AVATAR_FRAMING = 'portrait, upper body, looking at viewer, simple background';

/** SillyTavern's endpoint for persona avatars (src/endpoints/avatars.js, 1.19). */
export const AVATAR_UPLOAD_URL = '/api/avatars/upload';

/**
 * Aspect of SillyTavern's avatars (1.19): its crop popup proposes 2:3 (public/scripts/popup.js) and a
 * crop with `want_resize` is covered to 512x768 (src/endpoints/characters.js applyAvatarCropResize).
 */
export const AVATAR_ASPECT = 2 / 3;

/** The `crop` query of /api/avatars/upload, as ST's crop popup fills it. */
export interface AvatarCrop {
    x: number;
    y: number;
    width: number;
    height: number;
    /** ST resizes the crop to its avatar size (512x768); its popup sets it unless avatars are never resized. */
    want_resize: boolean;
}

interface PersonasModule {
    getUserAvatars?: (doRender?: boolean, openPageAt?: string) => Promise<unknown>;
}

/** The prompt and size of an avatar portrait: the passport without its NSFW layer, the free area. */
function avatarPicture(passport: Passport): Pick<PictureRequest, 'initiator' | 'trigger' | 'scene' | 'mode'> & {
    size: { width: number; height: number };
} {
    const scene = joinTags(passportTags(passport, { allowNsfw: false }), AVATAR_FRAMING);
    // An avatar needs no more than the free area.
    const size = markerDimensions('portrait', undefined, true);
    return { initiator: 'panel', trigger: scene, scene, mode: MODE.FREE, size };
}

/** One portrait from the passport (free size on Opus); null when cancelled. */
export async function drawPersonaAvatar(pipeline: Pipeline, passport: Passport): Promise<GeneratedImage | null> {
    const { size, ...picture } = avatarPicture(passport);
    const produced = await pipeline.produce({
        ...picture,
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

/** A portrait drawn for another extension with the size NovelAI drew it at. */
export interface DrawnAvatar {
    image: GeneratedImage;
    width: number;
    height: number;
}

/**
 * One portrait that costs no Anlas (since 0.15): the free area, at most 28 steps, no vibe encoded for it,
 * and refused before anything is sent when it would still cost Anlas (`maxCost` 0 throws
 * "free-only-blocked": not Opus, unknown account, character references, too many vibes). No cost
 * question and no inspector. It waits in the one NovelAI queue as a portrait (after the pictures of a
 * reply); opening another chat does not drop it. Null when the pipeline declined it.
 */
export async function drawFreePersonaAvatar(
    pipeline: Pipeline,
    passport: Passport,
    signal?: AbortSignal,
): Promise<DrawnAvatar | null> {
    const { size, ...picture } = avatarPicture(passport);
    const generation: Partial<GenerationSettings> = {
        width: size.width,
        height: size.height,
        steps: Math.min(settings().generation.steps, FREE_MAX_STEPS),
        seed: -1,
        samples: 1,
        characters: [],
    };
    const produced = await pipeline.produce({
        ...picture,
        // Passport tags are curated: only Russian words are converted.
        interpret: 'cyrillic',
        noContinuity: true,
        overrides: { quiet: true, edit: false, negative: passport.negative, generation },
        maxCost: 0,
        skipCostConfirm: true,
        noVibeEncoding: true,
        chatless: true,
        queue: { priority: 'portrait', kind: 'portrait' },
        ...(signal ? { signal } : {}),
    });
    const image = produced?.images[0];
    if (!produced || !image) return null;
    return { image, width: produced.prepared.request.width, height: produced.prepared.request.height };
}

export const imageDataUrl = (image: GeneratedImage) => `data:${image.mime};base64,${image.base64}`;

/**
 * The crop ST's popup proposes before the user moves it (autoCropArea 1): the largest centred box of
 * ST's avatar aspect, resized by ST to its avatar size.
 */
export function centeredAvatarCrop(width: number, height: number, aspect = AVATAR_ASPECT): AvatarCrop {
    const w = Math.max(1, Math.min(width, Math.round(height * aspect)));
    const h = Math.max(1, Math.min(height, Math.round(w / aspect)));
    return {
        x: Math.floor((width - w) / 2),
        y: Math.floor((height - h) / 2),
        width: w,
        height: h,
        want_resize: true,
    };
}

export interface AvatarUploadOptions {
    /**
     * Since 0.15: the image size. No crop popup then: ST's default crop goes with the upload instead
     * (none when avatars are never resized, as ST uploads them).
     */
    size?: { width: number; height: number };
}

/** The upload URL with the crop (popup, or ST's default one for a known size); null when the popup closed. */
async function uploadUrl(image: GeneratedImage, options: AvatarUploadOptions): Promise<string | null> {
    const c = ctx();
    if (c.powerUserSettings.never_resize_avatars === true) return AVATAR_UPLOAD_URL;
    if (options.size) {
        const crop = centeredAvatarCrop(options.size.width, options.size.height);
        return `${AVATAR_UPLOAD_URL}?crop=${encodeURIComponent(JSON.stringify(crop))}`;
    }
    const popup = new c.Popup('', c.POPUP_TYPE.CROP ?? 5, '', { cropImage: imageDataUrl(image) });
    const result = await popup.show();
    if (!result) return null;
    const crop = (popup as unknown as { cropData?: unknown }).cropData;
    return crop === undefined
        ? AVATAR_UPLOAD_URL
        : `${AVATAR_UPLOAD_URL}?crop=${encodeURIComponent(JSON.stringify(crop))}`;
}

/**
 * Replaces the avatar file of a persona, the current one or any other (the file is created when the
 * persona has none yet). `file` is the persona's avatar file name (personas.js user_avatar). Returns the
 * file name the server stored, or null when the user closed the crop popup.
 */
export async function uploadPersonaAvatar(
    file: string,
    image: GeneratedImage,
    options: AvatarUploadOptions = {},
): Promise<string | null> {
    const url = await uploadUrl(image, options);
    if (url === null) return null;
    const c = ctx();
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
        // The whole persona list is rendered again, whichever persona is current; a persona file that
        // ST's settings do not know yet is added by it.
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
    return path;
}

/** What generatePersonaAvatar of the API resolves (since 0.15). */
export interface PersonaAvatarResult {
    ok: boolean;
    /** The avatar file name the server stored (the persona key). */
    path?: string;
    /** "cost", "aborted", "upload", or NAI Studio's error code of a failed generation. */
    error?: string;
}

/**
 * A new avatar for any persona from a passport (since 0.15): drawn free only (see drawFreePersonaAvatar),
 * then uploaded over that persona's avatar file with ST's default crop and no popup. A request that would
 * cost Anlas is "cost" without anything sent; an abort before the upload is "aborted".
 */
export async function generatePersonaAvatarFile(
    pipeline: Pipeline,
    personaKey: string,
    passport: Passport,
    signal?: AbortSignal,
): Promise<PersonaAvatarResult> {
    if (signal?.aborted) return { ok: false, error: 'aborted' };
    let drawn: DrawnAvatar | null;
    try {
        drawn = await drawFreePersonaAvatar(pipeline, passport, signal);
    } catch (error) {
        const code = toNaiError(error).code;
        log.warn(`persona avatar of "${personaKey}" not drawn:`, code);
        return { ok: false, error: code === 'free-only-blocked' ? 'cost' : code };
    }
    if (!drawn || signal?.aborted) return { ok: false, error: 'aborted' };
    try {
        const path = await uploadPersonaAvatar(personaKey, drawn.image, { size: drawn });
        if (!path) return { ok: false, error: 'aborted' };
        log.info(`persona avatar of "${personaKey}" set`);
        return { ok: true, path };
    } catch (error) {
        log.warn(`persona avatar of "${personaKey}" not uploaded`, error);
        return { ok: false, error: 'upload' };
    }
}
