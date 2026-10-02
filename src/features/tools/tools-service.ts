// Phase 5 tools on any chat image: Director Tools, inpaint, outpaint, upscale, Enhance. Results
// become new swipes of the same image; the original is never lost.
import { ctx } from '../../core/context';
import { NaiError, toNaiError } from '../../core/errors';
import { t } from '../../core/i18n';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import {
    canUpscale,
    DEFAULT_MODEL,
    directorBody,
    directorSize,
    directorToolCost,
    enhanceSize,
    fitArea,
    FREE_MAX_PIXELS,
    getCapabilities,
    isModelId,
    MAX_REQUEST_PIXELS,
    MODE,
    planOutpaint,
    roundToStep,
    upscaleCost,
} from '../../domain';
import type { DirectorOptions, DirectorTool, ModeId } from '../../domain';
import type { Transport, TransportFeatures } from '../../transport';
import { base64ToBlob, blobToBase64, toPngBlob } from '../images/image-utils';
import type { CallOverrides, Pipeline, ProducedImages } from '../generation/pipeline';
import type { InlineImages } from '../inline/inline-service';
import { deliver, generatedSize, guardCost, sourcePng, toolMeta, unzipImages } from './tool-common';
import type { CostConfirm, ImageSource } from './tool-common';

export interface InpaintOptions {
    /** White = repaint, black = keep; base64 PNG of the source size. */
    mask: string;
    prompt: string;
    negative: string;
    strength: number;
    keepOriginal: boolean;
    /** Recorded in the result meta (outpaint goes through inpaint). */
    tool?: string;
    model: string;
}

function canvasOf(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas unavailable');
    return [canvas, context];
}

async function canvasPng(canvas: HTMLCanvasElement): Promise<string> {
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas export failed'))), 'image/png'),
    );
    return await blobToBase64(blob);
}

/** Keeps the original outside the mask (the web client composites inpaint results itself). */
async function composite(original: Blob, result: string, mask: string, offset = { x: 0, y: 0 }): Promise<string> {
    const resultBitmap = await createImageBitmap(base64ToBlob(result, 'image/png'));
    const [out, outContext] = canvasOf(resultBitmap.width, resultBitmap.height);
    outContext.drawImage(resultBitmap, 0, 0);
    const maskBitmap = await createImageBitmap(base64ToBlob(mask, 'image/png'));
    const [alpha, alphaContext] = canvasOf(maskBitmap.width, maskBitmap.height);
    alphaContext.drawImage(maskBitmap, 0, 0);
    const pixels = alphaContext.getImageData(0, 0, alpha.width, alpha.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
        pixels.data[i + 3] = pixels.data[i] ?? 0;
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 0;
    }
    alphaContext.putImageData(pixels, 0, 0);
    const originalBitmap = await createImageBitmap(original);
    const [keep, keepContext] = canvasOf(resultBitmap.width, resultBitmap.height);
    keepContext.drawImage(originalBitmap, offset.x, offset.y);
    keepContext.globalCompositeOperation = 'destination-out';
    keepContext.drawImage(alpha, 0, 0, keep.width, keep.height);
    outContext.drawImage(keep, 0, 0);
    [resultBitmap, maskBitmap, originalBitmap].forEach((b) => b.close());
    return await canvasPng(out);
}

export class ToolsService {
    constructor(
        private readonly pipeline: Pipeline,
        private readonly inline: InlineImages,
        private readonly confirm: CostConfirm,
    ) {}

    private transport(feature: keyof TransportFeatures, needsExtras: boolean): Transport {
        const transport = this.pipeline.studio.state.selection?.transport;
        if (!transport) throw new NaiError('plugin-unavailable', 'install-plugin');
        if (!transport.features[feature] || (needsExtras && !transport.extras)) {
            throw new NaiError('feature-unavailable', 'install-plugin', { feature: t(`naist.tool.${feature}`) });
        }
        return transport;
    }

    private async withLoader<T>(message: string, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
        const abort = new AbortController();
        const loader = ctx().loader?.show({
            blocking: false,
            slug: 'nai-studio-tool',
            title: t('naist.loader.title'),
            message,
            onStop: () => abort.abort(),
        });
        try {
            return await task(abort.signal);
        } catch (error) {
            throw toNaiError(error);
        } finally {
            await loader?.hide();
            void this.pipeline.studio.refreshAccount();
        }
    }

    private chatId(): string | undefined {
        return ctx().getCurrentChatId();
    }

    /** Lineart, sketch, colorize, emotion, declutter, declutter-keep-bubbles, background removal. */
    async director(source: ImageSource, tool: DirectorTool, options: DirectorOptions): Promise<void> {
        const transport = this.transport('director', true);
        const size = directorSize(source.width, source.height);
        const cost = directorToolCost(tool, size.width, size.height, this.pipeline.studio.state.account);
        await guardCost(cost, t(`naist.director.${tool}`), this.confirm);
        const image = await sourcePng(source, size);
        const body = directorBody(tool, image, size, options);
        await this.withLoader(t('naist.director.running', { tool: t(`naist.director.${tool}`) }), async (signal) => {
            const zip = await transport.extras!.augment(body, { retryable: cost === 0, signal });
            const images = await unzipImages(zip);
            const produced: ProducedImages = {
                images: images.map((img) => ({ ...img, seed: source.meta?.seed })),
                meta: toolMeta(source, {
                    requestType: 'director',
                    tool,
                    cost,
                    width: size.width,
                    height: size.height,
                    transport: transport.id,
                }),
                mode: (source.meta?.mode ?? MODE.FREE) as ModeId,
                chatId: this.chatId(),
            };
            await deliver(source, produced, { inline: this.inline, pipeline: this.pipeline });
            log.info('director', tool, `${images.length} image(s)`, `cost ${cost}`);
        });
    }

    /** Size an image is sent at: multiples of 64, and within the free area in free-only mode. */
    private requestSize(width: number, height: number): { width: number; height: number } {
        const rounded = { width: roundToStep(width), height: roundToStep(height) };
        return settings().anlas.freeOnly ? fitArea(rounded.width, rounded.height, FREE_MAX_PIXELS) : rounded;
    }

    private overrides(
        source: ImageSource,
        size: { width: number; height: number },
        model: string,
        negative: string,
        seed = -1,
    ): CallOverrides {
        const m = source.meta;
        return {
            edit: false,
            negative,
            generation: {
                model,
                width: size.width,
                height: size.height,
                seed,
                ...(m ? { steps: m.steps, scale: m.scale, sampler: m.sampler, noiseSchedule: m.noiseSchedule } : {}),
            },
        };
    }

    /** True when the model inpaints with another model (V5 Curated -> V4.5 Curated inpainting). */
    inpaintFallback(model: string): string | null {
        const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
        return caps.inpaintBase !== caps.model ? caps.inpaintModel : null;
    }

    async inpaint(
        source: ImageSource,
        options: InpaintOptions,
        overrideImage?: { image: Blob; offset: { x: number; y: number } },
    ): Promise<void> {
        this.transport('inpaint', false);
        const size = this.requestSize(source.width, source.height);
        const image = overrideImage
            ? await blobToBase64(await toPngBlob(overrideImage.image, size))
            : await sourcePng(source, size);
        const mask = await blobToBase64(await toPngBlob(base64ToBlob(options.mask, 'image/png'), size));
        const produced = await this.pipeline.produce({
            initiator: 'message',
            trigger: options.prompt || 'inpaint',
            scene: options.prompt,
            mode: (source.meta?.mode ?? MODE.FREE) as ModeId,
            overrides: this.overrides(source, size, options.model, options.negative),
            requestPatch: {
                mode: 'inpaint',
                image,
                mask,
                inpaintStrength: Math.min(1, Math.max(0.01, options.strength)),
            },
        });
        if (!produced) return;
        if (options.keepOriginal) {
            const original = overrideImage?.image ?? (await source.blob());
            const scaledOriginal = await toPngBlob(original, size);
            for (const img of produced.images) {
                img.base64 = await composite(scaledOriginal, img.base64, mask);
                img.mime = 'image/png';
            }
        }
        produced.meta = { ...produced.meta, requestType: 'inpaint', tool: options.tool ?? 'inpaint' };
        await deliver(source, produced, { inline: this.inline, pipeline: this.pipeline });
    }

    /** Grows the canvas and inpaints the new areas (mask built from the margins). */
    async outpaint(
        source: ImageSource,
        grow: { left: number; right: number; top: number; bottom: number },
        options: Omit<InpaintOptions, 'mask' | 'keepOriginal' | 'strength'>,
    ): Promise<void> {
        const plan = planOutpaint(source.width, source.height, grow);
        if (plan.tooLarge)
            throw new NaiError('size-too-large', 'none', {
                width: plan.width,
                height: plan.height,
                max: MAX_REQUEST_PIXELS,
            });
        // In free-only mode inpaint() scales the grown canvas down to 1 MP (requestSize).
        const original = await createImageBitmap(await source.blob(), {
            resizeWidth: source.width,
            resizeHeight: source.height,
        });
        const [canvas, context] = canvasOf(plan.width, plan.height);
        context.fillStyle = '#808080';
        context.fillRect(0, 0, plan.width, plan.height);
        context.drawImage(original, plan.offsetX, plan.offsetY);
        original.close();
        const [maskCanvas, maskContext] = canvasOf(plan.width, plan.height);
        maskContext.fillStyle = '#000';
        maskContext.fillRect(0, 0, plan.width, plan.height);
        maskContext.fillStyle = '#fff';
        for (const r of plan.maskRects) maskContext.fillRect(r.x, r.y, r.w, r.h);
        const expanded = base64ToBlob(await canvasPng(canvas), 'image/png');
        const grown: ImageSource = { ...source, width: plan.width, height: plan.height, blob: async () => expanded };
        await this.inpaint(grown, {
            ...options,
            mask: await canvasPng(maskCanvas),
            strength: 1,
            keepOriginal: true,
            tool: 'outpaint',
        });
    }

    /** Upscale x2 through NovelAI (always paid, 1-4 Anlas). */
    async upscale(source: ImageSource): Promise<void> {
        const transport = this.transport('upscale', true);
        if (!canUpscale(source.width, source.height)) {
            throw new NaiError('size-too-large', 'none', {
                width: source.width,
                height: source.height,
                max: MAX_REQUEST_PIXELS,
            });
        }
        const cost = upscaleCost(source.width, source.height) ?? 0;
        await guardCost(cost, t('naist.tool.upscale'), this.confirm);
        const image = await sourcePng(source);
        await this.withLoader(t('naist.tool.upscaling'), async (signal) => {
            const images = await transport.extras!.upscale(
                { image, width: source.width, height: source.height },
                signal,
            );
            const first = images[0];
            const size = first ? await generatedSize(first) : { width: source.width * 2, height: source.height * 2 };
            const produced: ProducedImages = {
                images: images.map((img) => ({ ...img, seed: source.meta?.seed })),
                meta: toolMeta(source, {
                    requestType: 'upscale',
                    tool: 'upscale',
                    cost,
                    ...size,
                    transport: transport.id,
                }),
                mode: (source.meta?.mode ?? MODE.FREE) as ModeId,
                chatId: this.chatId(),
            };
            await deliver(source, produced, { inline: this.inline, pipeline: this.pipeline });
        });
    }

    /** Enhance: the image scaled up and redrawn with img2img (strength and noise adjustable). */
    async enhance(
        source: ImageSource,
        options: { scale: number; strength: number; noise: number; prompt: string; negative: string; model: string },
    ): Promise<{ width: number; height: number }> {
        this.transport('img2img', false);
        const target = enhanceSize(source.width, source.height, options.scale);
        const size = settings().anlas.freeOnly ? fitArea(target.width, target.height, FREE_MAX_PIXELS) : target;
        const image = await sourcePng(source, size);
        const produced = await this.pipeline.produce({
            initiator: 'message',
            trigger: options.prompt || 'enhance',
            scene: options.prompt,
            mode: (source.meta?.mode ?? MODE.FREE) as ModeId,
            overrides: this.overrides(source, size, options.model, options.negative, source.meta?.seed ?? -1),
            requestPatch: { mode: 'img2img', image, strength: options.strength, noise: options.noise },
        });
        if (produced) {
            produced.meta = { ...produced.meta, requestType: 'img2img', tool: 'enhance' };
            await deliver(source, produced, { inline: this.inline, pipeline: this.pipeline });
        }
        return size;
    }
}
