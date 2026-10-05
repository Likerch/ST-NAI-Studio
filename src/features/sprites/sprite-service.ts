// Expressions sprite generator (TZ Phase 6, RECON §2.12, P-20). Two ways to keep the character
// consistent, both free on Opus at about 1 MP:
// - director: one neutral base sprite, then Director "emotion" on it where an emotion matches and
//   img2img from it (same seed) for the other labels;
// - seed: every sprite drawn from the appearance with one seed (V5 can make them transparent).
// Files are named `<label>.png` and uploaded with /api/sprites/upload into the character's folder;
// another character passport of the same card gets a subfolder (switch to it with /costume).
import { ctx, requestHeaders } from '../../core/context';
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import {
    DEFAULT_MODEL,
    directorBody,
    directorSize,
    directorToolCost,
    EXPRESSION_DIRECTOR,
    EXPRESSION_LABELS,
    getCapabilities,
    isModelId,
    MODE,
    passportTags,
    primaryPassport,
    spriteFileName,
    spritePrompt,
} from '../../domain';
import type { DirectorEmotion, ExpressionLabel, Passport } from '../../domain';
import type { GeneratedImage } from '../../transport';
import { avatarKey, readCharacterPrompt } from '../characters/character-prompts';
import { cardPassport, cardPassports } from '../characters/passport-store';
import { randomSeed } from '../generation/form';
import type { Pipeline } from '../generation/pipeline';
import { generationQueue } from '../generation/queue';
import { base64ToBlob, blobToBase64, toPngBlob } from '../images/image-utils';
import { unzipImages } from '../tools/tool-common';

export type SpriteStatus = 'pending' | 'running' | 'done' | 'failed';

export interface SpriteJob {
    label: string;
    status: SpriteStatus;
    how?: 'base' | 'director' | 'img2img' | 'seed';
    file?: string;
    error?: string;
}

export interface SpriteOptions {
    characterIndex: number;
    /** Character passport of the card to draw; the card's main character when absent. */
    passportId?: string;
    labels: string[];
    mode: 'director' | 'seed';
    transparent: boolean;
    model: string;
    signal?: AbortSignal;
    onProgress?: (jobs: SpriteJob[]) => void;
}

/** Character passports of a card that can get sprites (main character first). */
export function spritePassports(characterIndex: number): Passport[] {
    const character = ctx().characters[characterIndex];
    const list = cardPassports(character).filter((p) => p.kind === 'character');
    const main = primaryPassport(list, character?.name ?? '');
    return main ? [main, ...list.filter((p) => p !== main)] : list;
}

function extraPassport(characterIndex: number, passportId: string | undefined): Passport | null {
    if (!passportId) return null;
    const [main, ...rest] = spritePassports(characterIndex);
    return main?.id === passportId ? null : (rest.find((p) => p.id === passportId) ?? null);
}

let extraFolder: ((name: string) => string | null) | null = null;

/**
 * Where the sprites of another character of a card go instead of "<card>/<name>" (Doom's
 * Enhancement Suite reads characters/<name>, v0.9); null keeps the default.
 */
export function setExtraSpriteFolder(rule: ((name: string) => string | null) | null): void {
    extraFolder = rule;
}

/**
 * Folder Expressions reads for a character: its override, else the character name (RECON §2.12);
 * another character of the card gets "<folder>/<name>" (or the integration's folder).
 */
export function spriteFolder(characterIndex: number, passportId?: string): string {
    const base = cardSpriteFolder(characterIndex);
    const extra = extraPassport(characterIndex, passportId);
    const sub = extra?.name.replace(/[\\/:*?"<>|]+/g, ' ').trim();
    if (!extra || !sub) return base;
    return extraFolder?.(sub) ?? (base ? `${base}/${sub}` : sub);
}

function cardSpriteFolder(characterIndex: number): string {
    const c = ctx();
    const character = c.characters[characterIndex];
    const overrides = (c.extensionSettings as Record<string, unknown>).expressionOverrides;
    const key = avatarKey(character?.avatar);
    if (Array.isArray(overrides)) {
        const found = overrides.find((o: { name?: string; path?: string }) => o?.name === key && o.path);
        if (found) return String((found as { path: string }).path);
    }
    return character?.name ?? '';
}

/** Appearance tags: the passport when the card has one, else the character prompt, else the name. */
export function spriteAppearance(characterIndex: number, passportId?: string): string {
    const character = ctx().characters[characterIndex];
    const extra = extraPassport(characterIndex, passportId);
    if (extra) return passportTags(extra, { allowNsfw: false });
    const passport = cardPassport(character);
    if (passport) return passportTags(passport, { allowNsfw: false });
    const prompt = readCharacterPrompt(character).positive.trim();
    return prompt || character?.name || '';
}

export function spriteLabels(selected: string[]): string[] {
    return selected.length ? selected : [...EXPRESSION_LABELS];
}

async function uploadSprite(folder: string, label: string, image: GeneratedImage): Promise<string> {
    const png = await toPngBlob(base64ToBlob(image.base64, image.mime));
    const form = new FormData();
    const file = spriteFileName(label);
    form.append('name', folder);
    form.append('label', label);
    form.append('spriteName', file.replace(/\.png$/, ''));
    form.append('avatar', new File([png], file, { type: 'image/png' }));
    const response = await fetch('/api/sprites/upload', { method: 'POST', headers: requestHeaders(true), body: form });
    if (!response.ok) throw new NaiError('image-load-failed', 'none', { status: response.status });
    return file;
}

export class SpriteService {
    constructor(private readonly pipeline: Pipeline) {}

    private async draw(
        appearance: string,
        label: string,
        options: SpriteOptions,
        seed: number,
        base?: { image: string; width: number; height: number; strength: number },
    ): Promise<GeneratedImage> {
        const caps = getCapabilities(isModelId(options.model) ? options.model : DEFAULT_MODEL);
        const produced = await this.pipeline.produce({
            initiator: 'panel',
            trigger: label,
            scene: spritePrompt(appearance, label),
            mode: MODE.FREE,
            noContinuity: true,
            signal: options.signal,
            queue: { priority: 'background', kind: 'sprites' },
            overrides: {
                edit: false,
                generation: {
                    model: options.model,
                    seed,
                    samples: 1,
                    characters: [],
                    ...(base ? { width: base.width, height: base.height } : {}),
                    transparentBackground: options.transparent && caps.transparency && !base,
                },
            },
            ...(base ? { requestPatch: { mode: 'img2img' as const, image: base.image, strength: base.strength } } : {}),
        });
        const image = produced?.images[0];
        if (!image) throw new NaiError('aborted', 'none');
        return image;
    }

    private async emotion(
        base: GeneratedImage,
        emotion: DirectorEmotion,
        signal?: AbortSignal,
    ): Promise<GeneratedImage> {
        const transport = this.pipeline.studio.state.selection?.transport;
        if (!transport?.features.director || !transport.extras) {
            throw new NaiError('feature-unavailable', 'install-plugin', { feature: 'Director Tools' });
        }
        const blob = base64ToBlob(base.base64, base.mime);
        const bitmap = await createImageBitmap(blob);
        const size = directorSize(bitmap.width, bitmap.height);
        bitmap.close();
        const cost = directorToolCost('emotion', size.width, size.height, this.pipeline.studio.state.account);
        if (cost > 0) throw new NaiError('free-only-blocked', 'enable-free-only', { cost });
        const image = await blobToBase64(await toPngBlob(blob, size));
        const body = directorBody('emotion', image, size, { emotion, defry: 0, prompt: '' });
        const extras = transport.extras;
        const zip = await generationQueue.run(
            { priority: 'background', kind: 'sprites', ...(signal ? { signal } : {}) },
            (jobSignal) => extras.augment(body, { retryable: true, signal: jobSignal }),
        );
        const [first] = await unzipImages(zip);
        if (!first) throw new NaiError('invalid-response', 'none', { preview: 'empty ZIP' });
        return first;
    }

    async generate(options: SpriteOptions): Promise<SpriteJob[]> {
        const folder = spriteFolder(options.characterIndex, options.passportId);
        if (!folder) throw new NaiError('image-not-found', 'none');
        const appearance = spriteAppearance(options.characterIndex, options.passportId);
        const labels = spriteLabels(options.labels);
        const jobs: SpriteJob[] = labels.map((label) => ({ label, status: 'pending' }));
        const report = () => options.onProgress?.(jobs.map((j) => ({ ...j })));
        const seed = settings().generation.seed >= 0 ? settings().generation.seed : randomSeed();
        let base: GeneratedImage | null = null;
        // The neutral sprite is the base in director mode: draw it first.
        const order =
            options.mode === 'director'
                ? [...jobs].sort((a, b) => Number(b.label === 'neutral') - Number(a.label === 'neutral'))
                : jobs;
        report();
        for (const job of order) {
            if (options.signal?.aborted) break;
            job.status = 'running';
            report();
            try {
                let image: GeneratedImage;
                if (options.mode === 'seed') {
                    image = await this.draw(appearance, job.label, options, seed);
                    job.how = 'seed';
                } else if (!base) {
                    image = await this.draw(appearance, 'neutral', options, seed);
                    base = image;
                    job.how = 'base';
                    if (job.label !== 'neutral') {
                        image = await this.variant(base, appearance, job, options, seed);
                    }
                } else {
                    image = await this.variant(base, appearance, job, options, seed);
                }
                job.file = await uploadSprite(folder, job.label, image);
                job.status = 'done';
            } catch (error) {
                if (options.signal?.aborted) break;
                job.status = 'failed';
                job.error = (error as Error)?.message ?? String(error);
                log.warn('sprite failed', job.label, job.error);
            }
            report();
        }
        log.info('sprites', folder, jobs.filter((j) => j.status === 'done').length, 'of', jobs.length);
        return jobs;
    }

    private async variant(
        base: GeneratedImage,
        appearance: string,
        job: SpriteJob,
        options: SpriteOptions,
        seed: number,
    ): Promise<GeneratedImage> {
        const emotion = EXPRESSION_DIRECTOR[job.label as ExpressionLabel];
        if (emotion) {
            job.how = 'director';
            return await this.emotion(base, emotion, options.signal);
        }
        job.how = 'img2img';
        const png = await toPngBlob(base64ToBlob(base.base64, base.mime));
        const bitmap = await createImageBitmap(png);
        const source = { image: await blobToBase64(png), width: bitmap.width, height: bitmap.height, strength: 0.6 };
        bitmap.close();
        return await this.draw(appearance, job.label, options, seed, source);
    }
}
