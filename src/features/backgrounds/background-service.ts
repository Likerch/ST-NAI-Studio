// Backgrounds of places for other extensions (v0.12, NAI_STUDIO_API.generateBackground; Maestro M29). A
// prompt without people (the place's passport, the caller's tags, the time of day and the weather), one
// 16:9 image of about 1 MP through the normal pipeline with its Anlas guards (free-only mode refuses a
// request that would cost Anlas; otherwise the usual confirmation above the threshold), then the file
// goes into SillyTavern's backgrounds library the way its own upload does (POST /api/backgrounds/upload,
// multipart field "avatar"). The background itself is not set: the caller does that.
import { requestHeaders } from '../../core/context';
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import type { GenerationSettings } from '../../core/settings-schema';
import {
    BACKGROUND_NEGATIVE,
    BACKGROUND_RATIO,
    backgroundFileName,
    backgroundPrompt,
    joinTags,
    markerDimensions,
    MODE,
} from '../../domain';
import type { Passport } from '../../domain';
import { chatCardIndexes, loadCharacter, locatePassport } from '../characters/passport-store';
import type { Pipeline } from '../generation/pipeline';
import { findStyle, styleUcPreset } from '../generation/styles';
import { base64ToBlob, toPngBlob } from '../images/image-utils';
import { providedPassports } from '../scene/passport-providers';

export interface BackgroundRequest {
    /** Name of the place; also the file name part. */
    locationName: string;
    /** Tags to add (the state of the place: ruined, decorated, on fire). */
    tags?: string;
    /** A location (or world) passport of the chat or of a passport provider: its tags and negative. */
    passportId?: string;
    timeOfDay?: string;
    weather?: string;
    /** A saved style by name (it replaces the active style for this picture), else style tags. */
    style?: string;
}

/** ST's endpoint for its backgrounds library (src/endpoints/backgrounds.js, 1.19). */
export const BACKGROUND_UPLOAD_URL = '/api/backgrounds/upload';

/**
 * Uploads a PNG into SillyTavern's backgrounds library like ST's own "add background" (multipart field
 * "avatar", its file name kept); the file name the server stored.
 */
export async function uploadBackground(png: Blob, fileName: string): Promise<string> {
    const form = new FormData();
    form.append('avatar', new File([png], fileName, { type: 'image/png' }));
    const response = await fetch(BACKGROUND_UPLOAD_URL, {
        method: 'POST',
        headers: requestHeaders(true),
        body: form,
        cache: 'no-cache',
    });
    if (!response.ok) {
        throw new NaiError('unknown', 'none', { server: `background upload failed: HTTP ${response.status}` });
    }
    return (await response.text()).trim() || fileName;
}

/** The place passport with that id (the chat's view, else a passport provider's); a person does not count. */
async function placePassport(id: string): Promise<Passport | null> {
    for (const index of chatCardIndexes()) await loadCharacter(index);
    const found = locatePassport(id)?.resolved ?? (await providedPassports()).find((p) => p.id === id) ?? null;
    if (!found || found.kind === 'character') {
        log.warn(`background: no place passport "${id}"`);
        return null;
    }
    return found;
}

const join = (...parts: string[]) => parts.filter((part) => part.trim()).join(', ');

export class BackgroundService {
    constructor(
        private readonly pipeline: Pipeline,
        private readonly now: () => number = () => Date.now(),
    ) {}

    /** Draws and uploads one background; the file name in ST's library. Failures throw a NaiError. */
    async generate(request: BackgroundRequest, signal?: AbortSignal): Promise<{ file: string }> {
        const s = settings();
        const passport = request.passportId ? await placePassport(request.passportId) : null;
        let scene = backgroundPrompt({
            locationName: request.locationName,
            placeTags: passport?.tags ?? '',
            tags: request.tags ?? '',
            timeOfDay: request.timeOfDay ?? '',
            weather: request.weather ?? '',
        });
        const negative = joinTags(BACKGROUND_NEGATIVE, passport?.negative ?? '');
        // About 1 MP whatever the mode: free on Opus, like a marker of the default size.
        const generation: Partial<GenerationSettings> = {
            ...markerDimensions(BACKGROUND_RATIO, undefined, true),
            samples: 1,
            characters: [],
            transparentBackground: false,
        };
        // A saved style replaces the active one for this picture (v0.13): its prefix, suffix and
        // undesired content (with the base negative in the "append" mode) go in through the pipeline.
        const styleName = request.style?.trim();
        const style = styleName ? findStyle(s, styleName) : undefined;
        if (style) {
            const preset = styleUcPreset(style);
            if (preset) generation.ucPreset = preset;
        } else if (styleName) scene = join(styleName, scene);
        const produced = await this.pipeline.produce({
            initiator: 'panel',
            trigger: scene,
            scene,
            mode: MODE.BACKGROUND,
            // Passport tags are curated: only Russian words (a place name, a tracker's weather) are converted.
            interpret: 'cyrillic',
            noContinuity: true,
            overrides: { edit: false, negative, generation, ...(style ? { style } : {}) },
            // Maestro's backgrounds are background work: everything else draws first.
            queue: { priority: 'background', kind: 'background' },
            // Free-only mode: a request that would still cost Anlas is refused before anything is sent.
            ...(s.anlas.freeOnly ? { maxCost: 0 } : {}),
            ...(signal ? { signal } : {}),
        });
        const image = produced?.images[0];
        // Declined (the cost confirmation, the inspector): nothing was spent.
        if (!produced || !image) throw new NaiError('aborted', 'none');
        const blob = base64ToBlob(image.base64, image.mime);
        const png = s.png.stripMetadata || image.mime !== 'image/png' ? await toPngBlob(blob) : blob;
        const file = await uploadBackground(png, backgroundFileName(request.locationName, this.now()));
        log.info('background', file, `cost ${produced.prepared.cost.total}`);
        return { file };
    }
}
