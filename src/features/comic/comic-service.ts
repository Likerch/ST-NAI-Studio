// Comic mode for V5 (TZ Phase 6, RECON P-19): one generation per panel at the panel's aspect
// ratio (free at about 1 MP), then the page is drawn on a canvas and posted as one image. The
// panels share a seed and the page style so the characters stay alike.
import { ctx } from '../../core/context';
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import { comicLayout, MODE, panelPixels, panelPrompt, panelRequestSize } from '../../domain';
import type { ComicPanel } from '../../domain';
import { randomSeed } from '../generation/form';
import { imageFolder, postToChat, saveImages } from '../generation/output';
import type { GenerationMeta } from '../generation/output';
import type { Pipeline } from '../generation/pipeline';
import { base64ToBlob, blobToBase64 } from '../images/image-utils';

export interface ComicRequest {
    layout: string;
    page: { width: number; height: number };
    gutter: number;
    style: string;
    model: string;
    panels: ComicPanel[];
    signal?: AbortSignal;
    onProgress?: (done: number, total: number) => void;
}

export interface ComicResult {
    path: string;
    messageId: number | null;
    panels: number;
}

async function drawCover(
    context: CanvasRenderingContext2D,
    base64: string,
    mime: string,
    rect: { x: number; y: number; width: number; height: number },
) {
    const bitmap = await createImageBitmap(base64ToBlob(base64, mime));
    const scale = Math.max(rect.width / bitmap.width, rect.height / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    context.save();
    context.beginPath();
    context.rect(rect.x, rect.y, rect.width, rect.height);
    context.clip();
    context.drawImage(bitmap, rect.x + (rect.width - w) / 2, rect.y + (rect.height - h) / 2, w, h);
    context.restore();
    context.lineWidth = 3;
    context.strokeStyle = '#111';
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    bitmap.close();
}

export class ComicService {
    constructor(private readonly pipeline: Pipeline) {}

    async generate(req: ComicRequest): Promise<ComicResult | null> {
        const layout = comicLayout(req.layout);
        const rects = panelPixels(layout, req.page, req.gutter);
        const panels = layout.panels.map((_, i) => req.panels[i] ?? { prompt: '', text: [] });
        if (panels.every((p) => !p.prompt.trim())) throw new NaiError('no-usable-message', 'none');
        const seed = settings().generation.seed >= 0 ? settings().generation.seed : randomSeed();
        const chatId = ctx().getCurrentChatId();
        const canvas = document.createElement('canvas');
        canvas.width = req.page.width;
        canvas.height = req.page.height;
        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        context.fillStyle = '#fff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        let done = 0;
        let cost = 0;
        req.onProgress?.(0, panels.length);
        for (const [i, panel] of panels.entries()) {
            const rect = rects[i];
            if (!rect || !panel.prompt.trim()) continue;
            const size = panelRequestSize(rect);
            const produced = await this.pipeline.produce({
                initiator: 'panel',
                trigger: panel.prompt,
                scene: panelPrompt(req.style, panel),
                mode: MODE.FREE,
                noContinuity: true,
                signal: req.signal,
                overrides: {
                    edit: false,
                    generation: {
                        model: req.model,
                        seed: seed + i,
                        width: size.width,
                        height: size.height,
                        samples: 1,
                        characters: [],
                    },
                },
            });
            const image = produced?.images[0];
            if (!image) return null;
            cost += produced.prepared.cost.total;
            await drawCover(context, image.base64, image.mime, rect);
            req.onProgress?.(++done, panels.length);
        }
        const blob = await new Promise<Blob>((resolve, reject) =>
            canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('canvas export failed'))), 'image/png'),
        );
        const saved = await saveImages(
            [{ base64: await blobToBase64(blob), mime: 'image/png', index: 0, seed }],
            imageFolder(),
        );
        const first = saved[0];
        if (!first) throw new NaiError('invalid-response', 'none', { preview: '' });
        const summary = panels
            .map((p, i) => `${i + 1}. ${p.prompt.trim()}`)
            .filter((line) => !/^\d+\. $/.test(line))
            .join('\n');
        const meta: GenerationMeta = {
            scenePrompt: summary,
            prompt: summary,
            negative: '',
            mode: MODE.FREE,
            model: req.model,
            seed,
            transport: this.pipeline.studio.state.selection?.transport.id ?? '',
            cost,
            width: req.page.width,
            height: req.page.height,
            tool: 'comic',
        };
        if (ctx().getCurrentChatId() !== chatId) return { path: first.path, messageId: null, panels: done };
        const s = settings();
        const messageId = await postToChat(saved, meta, {
            visible: s.chat.visibility.panel === true,
            author: s.chat.author,
            hidePrompt: true,
            text: summary,
        });
        log.info('comic', `${done} panel(s)`, `cost ${cost}`);
        return { path: first.path, messageId, panels: done };
    }
}
