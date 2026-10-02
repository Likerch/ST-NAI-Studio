// Inline images (TZ Phase 3): generate into a message at a position, image-level swipes,
// regenerate / variation / edit-and-regenerate, display options, moving between messages, and
// keeping text and entries consistent after edits, swipes and deletions. Images asked for by a
// marker (TZ Phase 7) start as pending entries and get their swipes when the generation ends, even
// if the message was swiped meanwhile.
import { ctx } from '../../core/context';
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import {
    addSwipe,
    activeSwipe,
    createInlineImage,
    defaultDisplay,
    entryBlobKeys,
    insertPlaceholder,
    MODE,
    movePlaceholder,
    readEntries,
    reconcile,
    removePlaceholder,
    removeSwipe,
    setActiveSwipe,
} from '../../domain';
import type { DisplayOptions, InlineGenerationMeta, InlineImage, InlineSwipe, ModeId } from '../../domain';
import type { GeneratedImage } from '../../transport';
import { imageFileName, imageFolder, uploadImage } from '../generation/output';
import type { CallOverrides, Pipeline, ProducedImages } from '../generation/pipeline';
import { base64ToBlob, blobToBase64, toPngBlob } from '../images/image-utils';
import { collectGarbage, getBlob, newBlobKey, putBlob, removeBlobs, settle } from './inline-store';

export interface InlineRequest {
    /** Free text or a trigger word ("you", "face", …). */
    trigger: string;
    mode?: ModeId;
    /** Use this scene prompt as is (no mode resolution, no LLM). */
    scene?: string;
    overrides?: CallOverrides;
    display?: Partial<DisplayOptions>;
}

export interface EditParams {
    scene: string;
    negative: string;
    seed: number;
    width: number;
    height: number;
    model: string;
    steps: number;
    scale: number;
}

type Listener = (messageId: number) => void;

function message(messageId: number): STChatMessage {
    const found = ctx().chat[messageId];
    if (!found) throw new NaiError('image-not-found', 'none');
    return found;
}

function entriesOf(m: STChatMessage): InlineImage[] {
    m.extra ??= {};
    const entries = readEntries(m.extra);
    m.extra.nai_images = entries;
    return entries;
}

function findEntry(messageId: number, imageId: string): { m: STChatMessage; entry: InlineImage } {
    const m = message(messageId);
    const entry = entriesOf(m).find((e) => e.id === imageId);
    if (!entry) throw new NaiError('image-not-found', 'none');
    return { m, entry };
}

/** Keeps the active swipe copy of the message in sync, saves the chat and re-renders. */
async function commit(messageId: number, rerender = true): Promise<void> {
    const c = ctx();
    const m = c.chat[messageId];
    if (!m) return;
    const swipeId = m.swipe_id;
    if (Array.isArray(m.swipes) && typeof swipeId === 'number' && swipeId < m.swipes.length) {
        (m.swipes as string[])[swipeId] = m.mes;
        const info = Array.isArray(m.swipe_info) ? (m.swipe_info as { extra?: unknown }[])[swipeId] : undefined;
        if (info && typeof info === 'object') info.extra = structuredClone(m.extra);
    }
    await c.saveChat();
    if (rerender) c.updateMessageBlock(messageId, m);
}

export class InlineImages {
    private readonly listeners = new Set<Listener>();

    constructor(private readonly pipeline: Pipeline) {}

    /** The renderer subscribes to re-mount a message after a change it did not cause. */
    onChange(listener: Listener): void {
        this.listeners.add(listener);
    }

    private changed(messageId: number): void {
        for (const listener of this.listeners) listener(messageId);
    }

    entries(messageId: number): InlineImage[] {
        const m = ctx().chat[messageId];
        return m ? readEntries(m.extra) : [];
    }

    displayDefaults(partial: Partial<DisplayOptions> = {}): DisplayOptions {
        const s = settings().inline;
        return defaultDisplay({
            width: s.defaultWidth,
            widthUnit: s.defaultWidthUnit,
            align: s.defaultAlign,
            radius: s.defaultRadius,
            layout: s.defaultLayout,
            ...partial,
        });
    }

    /** Saves one generated image (browser copy and/or server file) as a swipe. */
    private async storeImage(imageId: string, image: GeneratedImage, meta: InlineGenerationMeta): Promise<InlineSwipe> {
        const s = settings().inline;
        const swipeMeta: InlineGenerationMeta = { ...meta, seed: image.seed ?? meta.seed };
        let blobKey = '';
        if (s.keepBrowserCopy) {
            blobKey = newBlobKey(imageId);
            await putBlob(blobKey, base64ToBlob(image.base64, image.mime));
        }
        let filePath = '';
        if (s.saveToServer || !blobKey) {
            const folder = imageFolder();
            filePath = await uploadImage(image.base64, image.mime, folder, imageFileName(folder, swipeMeta.seed));
        }
        return { blobKey, filePath, mime: image.mime, meta: swipeMeta };
    }

    private record(produced: ProducedImages, swipes: InlineSwipe[], inlineId: string): void {
        this.pipeline.notify(produced, {
            target: 'inline',
            paths: swipes.map((s) => s.filePath),
            blobKeys: swipes.map((s) => s.blobKey),
            inlineId,
        });
    }

    /** Generates a new image entry for a message (text untouched). Null when cancelled. */
    async create(messageId: number, req: InlineRequest): Promise<InlineImage | null> {
        message(messageId);
        const produced = await this.pipeline.produce({
            initiator: 'message',
            trigger: req.trigger,
            mode: req.mode,
            scene: req.scene,
            overrides: req.overrides,
        });
        if (!produced) return null;
        const m = message(messageId);
        const id = ctx().uuidv4();
        const swipes: InlineSwipe[] = [];
        for (const image of produced.images) swipes.push(await this.storeImage(id, image, produced.meta));
        const [first, ...rest] = swipes;
        if (!first) throw new NaiError('invalid-response', 'none', { preview: '' });
        const entry = createInlineImage(id, first, this.displayDefaults(req.display));
        for (const swipe of rest) addSwipe(entry, swipe);
        if (rest.length) setActiveSwipe(entry, 0);
        entriesOf(m).push(entry);
        this.record(produced, swipes, id);
        return entry;
    }

    /** Generates and inserts at a character offset of the message text (end by default). */
    async insert(messageId: number, req: InlineRequest, offset?: number): Promise<InlineImage | null> {
        const entry = await this.create(messageId, req);
        if (!entry) return null;
        const m = message(messageId);
        m.mes = insertPlaceholder(m.mes, entry.id, offset ?? m.mes.length);
        await commit(messageId);
        settle(entryBlobKeys(entry));
        return entry;
    }

    /** A finished reply: raw markers replaced with placeholders, pending entries added. */
    async addPending(messageId: number, text: string, entries: InlineImage[]): Promise<void> {
        const m = message(messageId);
        m.mes = text;
        entriesOf(m).push(...entries);
        await commit(messageId);
    }

    /**
     * Where an image lives now: the active text of a message (the hint first, messages may shift)
     * or a swipe of it that is not shown. Null when it is gone (deleted, other chat).
     */
    private locate(imageId: string, hint: number): { messageId: number; entry: InlineImage; active: boolean } | null {
        const chat = ctx().chat;
        const order = [hint, ...chat.keys()].filter((i, n, all) => i >= 0 && i < chat.length && all.indexOf(i) === n);
        for (const i of order) {
            const m = chat[i]!;
            const entry = readEntries(m.extra).find((e) => e.id === imageId);
            if (entry) return { messageId: i, entry, active: true };
            const infos = Array.isArray(m.swipe_info) ? (m.swipe_info as { extra?: unknown }[]) : [];
            for (const info of infos) {
                const other = readEntries(info?.extra).find((e) => e.id === imageId);
                if (other) return { messageId: i, entry: other, active: false };
            }
        }
        return null;
    }

    private async commitLocated(found: { messageId: number; active: boolean }): Promise<void> {
        if (found.active) await commit(found.messageId);
        else await ctx().saveChat();
    }

    /** The generation of a pending image finished: its images become the swipes. */
    async completePending(hint: number, imageId: string, produced: ProducedImages): Promise<boolean> {
        const found = this.locate(imageId, hint);
        if (!found) return false;
        const { entry } = found;
        const swipes: InlineSwipe[] = [];
        for (const image of produced.images) swipes.push(await this.storeImage(imageId, image, produced.meta));
        if (!swipes.length) throw new NaiError('invalid-response', 'none', { preview: '' });
        const first = entry.swipes.length;
        for (const swipe of swipes) addSwipe(entry, swipe);
        setActiveSwipe(entry, first);
        if (entry.marker) {
            entry.marker.status = 'done';
            delete entry.marker.error;
        }
        await this.commitLocated(found);
        settle(swipes.map((sw) => sw.blobKey));
        this.record(produced, swipes, imageId);
        return true;
    }

    /** Status of a marker image (pending again for a retry, error with the reason). */
    async setMarkerStatus(
        hint: number,
        imageId: string,
        status: 'pending' | 'error',
        error?: string,
    ): Promise<boolean> {
        const found = this.locate(imageId, hint);
        if (!found?.entry.marker) return false;
        found.entry.marker.status = status;
        if (error) found.entry.marker.error = error;
        else delete found.entry.marker.error;
        await this.commitLocated(found);
        return true;
    }

    /** After an edit-mode insertion the placeholder lives in the textarea until ST saves it. */
    async saveCreated(messageId: number, entry: InlineImage): Promise<void> {
        await commit(messageId, false);
        settle(entryBlobKeys(entry));
    }

    private async addGeneratedSwipe(
        messageId: number,
        imageId: string,
        produced: ProducedImages | null,
    ): Promise<boolean> {
        if (!produced) return false;
        const { entry } = findEntry(messageId, imageId);
        const swipes: InlineSwipe[] = [];
        for (const image of produced.images) swipes.push(await this.storeImage(imageId, image, produced.meta));
        for (const swipe of swipes) addSwipe(entry, swipe);
        await commit(messageId);
        settle(swipes.map((s) => s.blobKey));
        this.record(produced, swipes, imageId);
        return true;
    }

    private overridesFrom(meta: InlineGenerationMeta, seed: number): CallOverrides {
        return {
            negative: meta.negative,
            generation: {
                model: meta.model,
                width: meta.width,
                height: meta.height,
                steps: meta.steps,
                scale: meta.scale,
                cfgRescale: meta.cfgRescale,
                sampler: meta.sampler,
                noiseSchedule: meta.noiseSchedule,
                seed,
            },
        };
    }

    /** Same parameters, new seed; kept at the same position as a new swipe. */
    async regenerate(messageId: number, imageId: string): Promise<boolean> {
        const { entry } = findEntry(messageId, imageId);
        const meta = activeSwipe(entry)?.meta ?? entry.meta;
        const produced = await this.pipeline.produce({
            initiator: 'message',
            trigger: meta.scenePrompt,
            scene: meta.scenePrompt,
            mode: meta.mode as ModeId,
            overrides: this.overridesFrom(meta, -1),
        });
        return await this.addGeneratedSwipe(messageId, imageId, produced);
    }

    /** Same seed plus noise: img2img from the current image (plugin transport only). */
    async variation(messageId: number, imageId: string): Promise<boolean> {
        const transport = this.pipeline.studio.state.selection?.transport;
        if (!transport?.features.img2img) {
            throw new NaiError('feature-unavailable', 'install-plugin', { feature: 'img2img' });
        }
        const { entry } = findEntry(messageId, imageId);
        const swipe = activeSwipe(entry);
        if (!swipe) throw new NaiError('image-not-found', 'none');
        const source = await this.sourceBlob(swipe);
        const image = await blobToBase64(
            await toPngBlob(source, { width: swipe.meta.width, height: swipe.meta.height }),
        );
        const s = settings().inline;
        const produced = await this.pipeline.produce({
            initiator: 'message',
            trigger: swipe.meta.scenePrompt,
            scene: swipe.meta.scenePrompt,
            mode: swipe.meta.mode as ModeId,
            overrides: this.overridesFrom(swipe.meta, swipe.meta.seed),
            requestPatch: { mode: 'img2img', image, strength: s.variationStrength, noise: s.variationNoise },
        });
        return await this.addGeneratedSwipe(messageId, imageId, produced);
    }

    /** "Redo with an edited prompt": parameters from the popup, result as a new swipe. */
    async editAndRegenerate(messageId: number, imageId: string, params: EditParams): Promise<boolean> {
        const { entry } = findEntry(messageId, imageId);
        const meta = activeSwipe(entry)?.meta ?? entry.meta;
        const overrides = this.overridesFrom(
            {
                ...meta,
                model: params.model,
                width: params.width,
                height: params.height,
                steps: params.steps,
                scale: params.scale,
            },
            params.seed,
        );
        overrides.negative = params.negative;
        const produced = await this.pipeline.produce({
            initiator: 'message',
            trigger: params.scene,
            scene: params.scene,
            mode: (meta.mode === MODE.FREE ? MODE.FREE : meta.mode) as ModeId,
            overrides,
        });
        return await this.addGeneratedSwipe(messageId, imageId, produced);
    }

    /** Adds an externally produced image (Director Tools, upscale, inpaint) as a new swipe. */
    async addProducedSwipe(messageId: number, imageId: string, produced: ProducedImages): Promise<boolean> {
        return await this.addGeneratedSwipe(messageId, imageId, produced);
    }

    async setActive(messageId: number, imageId: string, index: number): Promise<void> {
        const { entry } = findEntry(messageId, imageId);
        setActiveSwipe(entry, index);
        await commit(messageId);
    }

    /** Removes the active swipe (the last remaining one deletes the whole image). */
    async deleteSwipe(messageId: number, imageId: string): Promise<void> {
        const { entry } = findEntry(messageId, imageId);
        if (entry.swipes.length <= 1) {
            await this.remove(messageId, imageId);
            return;
        }
        removeSwipe(entry, entry.activeSwipe);
        await commit(messageId);
        await collectGarbage();
    }

    async remove(messageId: number, imageId: string): Promise<void> {
        const m = message(messageId);
        m.mes = removePlaceholder(m.mes, imageId);
        m.extra ??= {};
        m.extra.nai_images = entriesOf(m).filter((e) => e.id !== imageId);
        await commit(messageId);
        await collectGarbage();
    }

    async updateDisplay(messageId: number, imageId: string, display: Partial<DisplayOptions>): Promise<void> {
        const { entry } = findEntry(messageId, imageId);
        entry.display = { ...entry.display, ...display };
        await commit(messageId);
    }

    /** Moves an image inside a message or to another message (before `beforeId`, or to the end). */
    async move(fromId: number, imageId: string, toId: number, beforeId: string | null): Promise<void> {
        if (fromId === toId) {
            const m = message(fromId);
            m.mes = movePlaceholder(m.mes, imageId, beforeId);
            await commit(fromId);
            return;
        }
        const { m: from, entry } = findEntry(fromId, imageId);
        const to = message(toId);
        from.mes = removePlaceholder(from.mes, imageId);
        from.extra ??= {};
        from.extra.nai_images = entriesOf(from).filter((e) => e.id !== imageId);
        const target = beforeId ? readEntries(to.extra).some((e) => e.id === beforeId) : false;
        const offset = target ? to.mes.indexOf(`[nai:img:${beforeId}]`) : to.mes.length;
        to.mes = insertPlaceholder(to.mes, imageId, offset);
        entriesOf(to).push(entry);
        await commit(fromId);
        await commit(toId);
    }

    /**
     * Text and entries of one message after an edit, swipe or regeneration. Returns true when
     * something was removed. Blobs of other swipes are untouched (they keep their own copies).
     */
    async reconcileMessage(messageId: number, rerender = true): Promise<boolean> {
        const m = ctx().chat[messageId];
        if (!m) return false;
        const entries = readEntries(m.extra);
        if (!entries.length && !m.mes.includes('[nai:img:')) return false;
        const result = reconcile(m.mes, entries);
        if (!result.removedEntries.length && !result.removedPlaceholders.length) return false;
        m.mes = result.text;
        m.extra ??= {};
        m.extra.nai_images = result.entries;
        await commit(messageId, rerender);
        log.info(
            `inline images reconciled in message ${messageId}:`,
            `${result.removedEntries.length} entries, ${result.removedPlaceholders.length} placeholders removed`,
        );
        return true;
    }

    async reconcileChat(): Promise<void> {
        const chat = ctx().chat;
        let changed = false;
        for (let i = 0; i < chat.length; i++) changed = (await this.reconcileMessage(i)) || changed;
        await collectGarbage();
        if (changed) log.info('inline images reconciled');
    }

    /** Full image of a swipe: browser copy first, then the server file. */
    async sourceBlob(swipe: InlineSwipe): Promise<Blob> {
        const local = await getBlob(swipe.blobKey);
        if (local) return local;
        if (swipe.filePath) {
            const response = await fetch(swipe.filePath);
            if (response.ok) return await response.blob();
        }
        throw new NaiError('image-load-failed', 'none');
    }

    /** Makes sure the active swipe has a file in /user/images (backgrounds, avatars need one). */
    async ensureFile(messageId: number, imageId: string): Promise<string> {
        const { entry } = findEntry(messageId, imageId);
        const swipe = activeSwipe(entry);
        if (!swipe) throw new NaiError('image-not-found', 'none');
        if (swipe.filePath) return swipe.filePath;
        const blob = await this.sourceBlob(swipe);
        const folder = imageFolder();
        swipe.filePath = await uploadImage(
            await blobToBase64(blob),
            blob.type || swipe.mime,
            folder,
            imageFileName(folder, swipe.meta.seed),
        );
        setActiveSwipe(entry, entry.activeSwipe);
        await commit(messageId, false);
        this.changed(messageId);
        return swipe.filePath;
    }

    /** Lifecycle "clean" and the gallery's mass delete free blobs through here. */
    async freeBlobs(keys: string[]): Promise<void> {
        await removeBlobs(keys);
    }
}
