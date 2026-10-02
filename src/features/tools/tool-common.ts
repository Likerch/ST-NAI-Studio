// Shared parts of the Phase 5 tools (Director Tools, inpaint, outpaint, upscale, Enhance): the
// image a tool works on (inline image or a message's media), the Anlas guard, unzipping NovelAI's
// ZIP answers with SillyTavern's JSZip (RECON P-4), and delivering results as a new swipe.
import { ctx, importHost } from '../../core/context';
import { NaiError } from '../../core/errors';
import { settings } from '../../core/settings';
import { activeSwipe, readEntries } from '../../domain';
import type { InlineGenerationMeta } from '../../domain';
import type { GeneratedImage } from '../../transport';
import { base64ToBytes, blobToBase64, imageSize, sniffMime, toPngBlob } from '../images/image-utils';
import { appendToMessage, imageFolder, saveImages } from '../generation/output';
import type { GenerationMeta } from '../generation/output';
import type { Pipeline, ProducedImages } from '../generation/pipeline';
import type { InlineImages } from '../inline/inline-service';

export type ImageTarget =
    { kind: 'inline'; messageId: number; imageId: string } | { kind: 'media'; messageId: number; mediaIndex: number };

export interface ImageSource {
    target: ImageTarget;
    width: number;
    height: number;
    /** Parameters of the source when NAI Studio made it (prompt for inpaint, model, …). */
    meta?: InlineGenerationMeta;
    blob(): Promise<Blob>;
}

/** Asks the user before spending Anlas (injected: features must not import UI). */
export type CostConfirm = (cost: number, what: string) => Promise<boolean>;

/** Free-only blocks every paid tool call; otherwise a paid call above the threshold is confirmed. */
export async function guardCost(cost: number, what: string, confirm: CostConfirm): Promise<void> {
    const s = settings().anlas;
    if (cost <= 0) return;
    if (s.freeOnly) throw new NaiError('free-only-blocked', 'enable-free-only', { cost });
    if (cost > s.confirmAbove && !(await confirm(cost, what))) throw new NaiError('aborted', 'none');
}

/** The source as a base64 PNG of exactly width x height (NovelAI wants PNG of the request size). */
export async function sourcePng(source: ImageSource, size?: { width: number; height: number }): Promise<string> {
    const blob = await source.blob();
    return await blobToBase64(await toPngBlob(blob, size ?? { width: source.width, height: source.height }));
}

interface MediaLike {
    url: string;
    title?: string;
    width?: number;
    height?: number;
    nai_studio?: { seed?: number; model?: string; prompt?: string };
}

/** Image source for an inline image of a message. */
export async function inlineSource(inline: InlineImages, messageId: number, imageId: string): Promise<ImageSource> {
    const entry = readEntries(ctx().chat[messageId]?.extra).find((e) => e.id === imageId);
    const swipe = entry ? activeSwipe(entry) : undefined;
    if (!entry || !swipe) throw new NaiError('image-not-found', 'none');
    const blob = await inline.sourceBlob(swipe);
    const size =
        swipe.meta.width && swipe.meta.height
            ? { width: swipe.meta.width, height: swipe.meta.height }
            : await imageSize(blob);
    return { target: { kind: 'inline', messageId, imageId }, ...size, meta: swipe.meta, blob: async () => blob };
}

/** Image source for a media attachment of a message (generated or uploaded by the user). */
export async function mediaSource(messageId: number, mediaIndex: number): Promise<ImageSource> {
    const message = ctx().chat[messageId];
    const media = (message?.extra?.media ?? []) as MediaLike[];
    const attachment = media[mediaIndex];
    if (!attachment?.url) throw new NaiError('image-not-found', 'none');
    const response = await fetch(attachment.url);
    if (!response.ok) throw new NaiError('image-load-failed', 'none');
    const blob = await response.blob();
    const size = await imageSize(blob);
    return {
        target: { kind: 'media', messageId, mediaIndex },
        ...size,
        meta: attachment.title ? metaFromMedia(attachment, size) : undefined,
        blob: async () => blob,
    };
}

function metaFromMedia(attachment: MediaLike, size: { width: number; height: number }): InlineGenerationMeta {
    return {
        scenePrompt: attachment.title ?? '',
        prompt: attachment.nai_studio?.prompt ?? attachment.title ?? '',
        negativePrompt: '',
        negative: '',
        mode: 6,
        model: attachment.nai_studio?.model ?? settings().generation.model,
        seed: attachment.nai_studio?.seed ?? 0,
        width: size.width,
        height: size.height,
        steps: settings().generation.steps,
        scale: settings().generation.scale,
        cfgRescale: 0,
        sampler: settings().generation.sampler,
        noiseSchedule: settings().generation.noiseSchedule,
        ucPreset: settings().generation.ucPreset,
        qualityPreset: settings().generation.qualityPreset,
        requestType: 'txt2img',
        characters: [],
        transport: '',
        cost: 0,
        createdAt: new Date().toISOString(),
    };
}

interface JsZipFile {
    async(type: 'base64'): Promise<string>;
}
interface JsZipInstance {
    files: Record<string, JsZipFile & { dir: boolean; name: string }>;
}
interface JsZipStatic {
    loadAsync(data: Uint8Array): Promise<JsZipInstance>;
}

/** Images of a NovelAI ZIP answer, in file-name order (image_0, image_1, …). */
export async function unzipImages(zipBase64: string): Promise<GeneratedImage[]> {
    await importHost('/lib/jszip.min.js');
    const JSZip = (globalThis as unknown as { JSZip?: JsZipStatic }).JSZip;
    if (!JSZip) throw new NaiError('invalid-response', 'none', { preview: 'JSZip unavailable' });
    const zip = await JSZip.loadAsync(base64ToBytes(zipBase64));
    const files = Object.values(zip.files)
        .filter((f) => !f.dir && /\.(png|webp|jpe?g)$/i.test(f.name))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const images: GeneratedImage[] = [];
    for (const [index, file] of files.entries()) {
        const base64 = await file.async('base64');
        const mime = sniffMime(base64ToBytes(base64.slice(0, 32)));
        images.push({ base64, mime: mime === 'image/webp' ? 'image/webp' : 'image/png', index });
    }
    if (!images.length) throw new NaiError('invalid-response', 'none', { preview: 'empty ZIP' });
    return images;
}

function legacyMeta(meta: InlineGenerationMeta): GenerationMeta {
    return {
        scenePrompt: meta.scenePrompt,
        prompt: meta.prompt,
        negative: meta.negative,
        mode: meta.mode,
        model: meta.model,
        seed: meta.seed,
        transport: meta.transport,
        cost: meta.cost,
        width: meta.width,
        height: meta.height,
        ...(meta.tool ? { tool: meta.tool } : {}),
    };
}

/** Adds tool results as new swipes of the source image (the original is kept). */
export async function deliver(
    source: ImageSource,
    produced: ProducedImages,
    services: { inline: InlineImages; pipeline: Pipeline },
): Promise<void> {
    if (source.target.kind === 'inline') {
        await services.inline.addProducedSwipe(source.target.messageId, source.target.imageId, produced);
        return;
    }
    const folder = imageFolder();
    const saved = await saveImages(produced.images, folder);
    await appendToMessage(source.target.messageId, saved, legacyMeta(produced.meta));
    services.pipeline.notify(produced, { target: 'message', paths: saved.map((s) => s.path) });
}

/** Meta of a tool result derived from the source (Director Tools, upscale keep its prompt). */
export function toolMeta(source: ImageSource, patch: Partial<InlineGenerationMeta>): InlineGenerationMeta {
    const base: InlineGenerationMeta =
        source.meta ?? metaFromMedia({ url: '' }, { width: source.width, height: source.height });
    return { ...base, createdAt: new Date().toISOString(), ...patch };
}

/** Dimensions of a generated image (results of tools may differ from the request size). */
export async function generatedSize(image: GeneratedImage): Promise<{ width: number; height: number }> {
    return await imageSize(new Blob([base64ToBytes(image.base64) as BlobPart], { type: image.mime }));
}
