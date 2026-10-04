// Image markers in chat replies (TZ Phase 7, docs/research §4-5). The chat model writes a marker
// (<img data-nai='{...}'>, the old microservice URL, sillyimages, Auto Illustrator comments) with
// a description in human language; generation starts as soon as the marker is complete while the
// reply still streams, and when the reply is finished the markers become inline images. One
// generation runs at a time (NovelAI refuses parallel requests on most plans). With a quality gate
// (Maestro, v0.11) the drawings of a reply wait for its verdict: markers found while the reply streams
// are still collected, but their requests are held until the reply is complete and the gates answered.
import { ctx } from '../../core/context';
import { toNaiError } from '../../core/errors';
import { t } from '../../core/i18n';
import { log } from '../../core/logger';
import type { GenerationSettings } from '../../core/settings-schema';
import { settings } from '../../core/settings';
import { styleUcPreset } from '../generation/styles';
import {
    activeSwipe,
    createPendingImage,
    DEFAULT_MODEL,
    detectParticipants,
    findMarkers,
    getCapabilities,
    isModelId,
    joinTags,
    limitMarkers,
    markerDimensions,
    markerDisplay,
    markerGenerationKey,
    markerModel,
    MODE,
    readEntries,
    replaceMarkers,
    replyExcerpt,
    UC_PRESETS,
} from '../../domain';
import type { GenerationRequest, InlineImage, MarkerMatch, MarkerParams, PlannedVibe, UcPresetId } from '../../domain';
import { setCurrentLocation } from '../continuity/continuity-service';
import type { CallOverrides, Pipeline, ProducedImages } from '../generation/pipeline';
import { blobToBase64, toPngBlob } from '../images/image-utils';
import type { InlineImages } from '../inline/inline-service';
import { qualityGatesActive, replyAbandoned, replyComplete, replyVerdict } from '../quality/quality-gate';
import type { QualityVerdict } from '../quality/quality-gate';
import type { SceneService } from '../scene/scene-service';
import { mentionedLocationTags, sceneCandidates, sceneSetting } from '../scene/scene-service';
import type { SceneQuery } from '../scene/scene-service';
import { vibeItems } from '../vibes/vibe-library';

interface Job {
    promise: Promise<ProducedImages | null>;
    abort: AbortController;
    /** The quality gates' verdict on the reply while the drawing waits for it (v0.11). */
    verdict?: Promise<QualityVerdict>;
    /** The gates held the drawing back: the reply is redone (skip) or was swiped / deleted (cancelled). */
    held?: Exclude<QualityVerdict, 'draw'>;
}

interface StartOptions {
    /** An automatic drawing of the reply: it waits for the quality gates. */
    gated?: boolean;
    /** The reply still streams: the gates are asked once it is complete. */
    streaming?: boolean;
}

/** The value of a promise, or undefined as soon as the signal aborts. */
function untilAborted<T>(promise: Promise<T>, signal: AbortSignal): Promise<T | undefined> {
    if (signal.aborted) return Promise.resolve(undefined);
    return new Promise((resolve) => {
        const onAbort = () => resolve(undefined);
        signal.addEventListener('abort', onAbort, { once: true });
        promise.then(
            (value) => {
                signal.removeEventListener('abort', onAbort);
                resolve(value);
            },
            () => resolve(undefined),
        );
    });
}

/**
 * Holds generations until an integration has its data for the reply (Doom's Enhancement Suite in
 * separate / external mode writes its tracker after the reply, v0.9).
 */
export interface MarkerGate {
    /** No generation while the reply streams. */
    holdEarlyStart(): boolean;
    /** Resolves when the data for this message is there (or after a time limit). */
    wait(messageId: number, signal?: AbortSignal): Promise<void>;
}

/** Generation types that never carry markers to illustrate. */
const SKIPPED_TYPES = new Set(['impersonate', 'quiet']);
/** Replies that may be illustrated automatically (not image messages, greetings, commands). */
const AUTO_FILL_TYPES = new Set(['normal', 'swipe', 'regenerate']);

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export class MarkerService {
    /** Jobs started while the current reply streams, by ordinal + generation key. */
    private early = new Map<string, Job>();
    private generationType = '';
    private queue: Promise<unknown> = Promise.resolve();
    /** Images with a generation in flight (the renderer shows a spinner, not "interrupted"). */
    private readonly running = new Set<string>();
    /** Images whose drawing waits for the quality gates' verdict. */
    private readonly waiting = new Set<string>();
    private readonly listeners = new Set<(imageId: string) => void>();
    private lastScan = 0;
    private gate: MarkerGate | null = null;
    /** Messages already illustrated automatically during this generation. */
    private readonly filled = new Set<string>();
    /** A reply is being generated (the formatter hides a marker that is still being written). */
    generating = false;

    constructor(
        private readonly pipeline: Pipeline,
        private readonly inline: InlineImages,
        private readonly scenes: SceneService,
    ) {}

    setGate(gate: MarkerGate | null): void {
        this.gate = gate;
    }

    isRunning(imageId: string): boolean {
        return this.running.has(imageId);
    }

    /** The drawing of this image waits for the quality gates (v0.11). */
    isWaiting(imageId: string): boolean {
        return this.waiting.has(imageId);
    }

    onRunningChange(listener: (imageId: string) => void): void {
        this.listeners.add(listener);
    }

    private setRunning(imageId: string, on: boolean): void {
        if (on) this.running.add(imageId);
        else this.running.delete(imageId);
        for (const listener of this.listeners) listener(imageId);
    }

    private setWaiting(imageId: string, on: boolean): void {
        if (on) this.waiting.add(imageId);
        else this.waiting.delete(imageId);
        for (const listener of this.listeners) listener(imageId);
    }

    /** Markers of a text that this configuration accepts. */
    markersIn(text: string): MarkerMatch[] {
        const all = findMarkers(text);
        return settings().markers.legacy ? all : all.filter((m) => m.format === 'nai');
    }

    // ---- lifecycle ------------------------------------------------------------------------

    generationStarted(type: string, dryRun: boolean): void {
        // Quiet generations (summaries, other extensions) do not touch the reply in progress.
        if (dryRun || type === 'quiet') return;
        this.generationType = type || 'normal';
        this.generating = true;
        this.filled.clear();
        this.dropEarly();
    }

    get currentType(): string {
        return this.generationType;
    }

    /** Generation ended or stopped: a reply that never got MESSAGE_RECEIVED is finalized here. */
    async generationEnded(): Promise<void> {
        if (!this.generating) return;
        this.generating = false;
        const chat = ctx().chat;
        const last = chat.length - 1;
        const m = chat[last];
        const reply = Boolean(m && !m.is_user && !m.is_system);
        if (reply && this.markersIn(m!.mes).length) await this.finalize(last);
        else {
            this.dropEarly();
            // Drawings that waited for the end of this reply (DES portraits) ask the quality gates now.
            if (reply) replyComplete(last);
            else replyAbandoned();
        }
    }

    chatChanged(): void {
        this.dropEarly();
    }

    private dropEarly(): void {
        for (const job of this.early.values()) job.abort.abort();
        this.early.clear();
    }

    /** Streaming progress: start generating every complete marker of the reply so far. */
    streamProgress(): void {
        const s = settings().markers;
        if (!s.enabled || !s.earlyStart || SKIPPED_TYPES.has(this.generationType) || this.gate?.holdEarlyStart())
            return;
        const now = Date.now();
        if (now - this.lastScan < 250) return;
        this.lastScan = now;
        const chat = ctx().chat;
        const m = chat[chat.length - 1];
        if (!m || m.is_user || m.is_system) return;
        const markers = this.markersIn(m.mes);
        const allowed = Math.max(0, s.max - this.existingMarkers(m));
        markers.slice(0, allowed).forEach((match, i) => {
            const key = `${i}:${markerGenerationKey(match.params)}`;
            if (!this.early.has(key)) {
                log.info('marker complete while streaming, generation queued');
                const query = { messageId: chat.length - 1, text: m.mes };
                this.early.set(key, this.start(match.params, query, { gated: true, streaming: true }));
            }
        });
    }

    /** Marker images already in a continued message count against the per-reply limit. */
    private existingMarkers(m: STChatMessage): number {
        return this.generationType === 'continue' ? readEntries(m.extra).filter((e) => e.marker).length : 0;
    }

    /** A finished reply: markers become pending inline images, generations are delivered. */
    async finalize(messageId: number, type?: string): Promise<void> {
        const s = settings().markers;
        const kind = type || this.generationType || 'normal';
        const early = this.early;
        this.early = new Map();
        const c = ctx();
        const m = c.chat[messageId];
        if (!s.enabled || SKIPPED_TYPES.has(kind) || !m || m.is_user || m.is_system) {
            for (const job of early.values()) job.abort.abort();
            replyAbandoned(messageId);
            return;
        }
        // Markers found while it streamed waited for the end of the reply: the quality gates are asked now.
        replyComplete(messageId);
        const markers = this.markersIn(m.mes);
        // The reply as written: a tracker at its start describes the scene of these markers.
        const query: SceneQuery = { messageId, text: m.mes };
        const existing = kind === 'continue' ? readEntries(m.extra).filter((e) => e.marker).length : 0;
        const { keep, drop } = limitMarkers(markers, Math.max(0, s.max - existing));
        if (markers.length) {
            const ids = keep.map(() => c.uuidv4());
            const entries = keep.map((match, i) =>
                createPendingImage(ids[i]!, match.params, this.inline.displayDefaults(markerDisplay(match.params))),
            );
            const text = replaceMarkers(m.mes, markers, (_match, i) => (i < keep.length ? `[nai:img:${ids[i]}]` : ''));
            await this.inline.addPending(messageId, text, entries);
            keep.forEach((match, i) => {
                const key = `${i}:${markerGenerationKey(match.params)}`;
                const job = early.get(key) ?? this.start(match.params, query, { gated: true });
                early.delete(key);
                void this.deliver(messageId, ids[i]!, job);
            });
            if (drop.length) log.info(`${drop.length} marker(s) over the limit of ${s.max} removed`);
        }
        // Markers that changed while streaming: their early generations are not needed.
        for (const job of early.values()) job.abort.abort();
        const count = keep.length + existing;
        const filledKey = `${messageId}:${m.swipe_id ?? 0}`;
        if (s.autoFill && count < s.min && AUTO_FILL_TYPES.has(kind) && !this.filled.has(filledKey)) {
            this.filled.add(filledKey);
            await this.autoFill(messageId, s.min - count);
        }
    }

    /** Fewer markers than the minimum: illustrations of the reply itself, appended at its end. */
    private async autoFill(messageId: number, missing: number): Promise<void> {
        // A reply that is redone gets no illustrations appended (its own markers stay placeholders).
        if (qualityGatesActive()) {
            const verdict = await replyVerdict(messageId);
            if (verdict !== 'draw') {
                log.info(`automatic illustration of reply ${messageId} skipped by the quality gate (${verdict})`);
                return;
            }
        }
        const m = ctx().chat[messageId];
        const excerpt = m ? replyExcerpt(m.mes) : '';
        if (!m || !excerpt) return;
        const query: SceneQuery = { messageId, text: m.mes };
        // The characters are found by name in the excerpt when the picture is made (no "chars": the
        // text may also be about people without a passport, so no count tags either).
        const params: MarkerParams = { prompt: excerpt };
        const c = ctx();
        const ids = Array.from({ length: Math.min(missing, 3) }, () => c.uuidv4());
        const entries = ids.map((id) =>
            createPendingImage(id, params, this.inline.displayDefaults(markerDisplay(params))),
        );
        await this.inline.addPending(messageId, `${m.mes}\n${ids.map((id) => `[nai:img:${id}]`).join('\n')}`, entries);
        for (const id of ids) void this.deliver(messageId, id, this.start(params, query));
    }

    /** One picture asked for from outside the reply (a menu, a scene banner), appended to a message. */
    async illustrate(messageId: number, params: MarkerParams): Promise<void> {
        const m = ctx().chat[messageId];
        if (!m) return;
        const id = ctx().uuidv4();
        const entry = createPendingImage(id, params, this.inline.displayDefaults(markerDisplay(params)));
        await this.inline.addPending(messageId, `${m.mes}\n[nai:img:${id}]`, [entry]);
        await this.deliver(messageId, id, this.start(params, { messageId, text: m.mes }));
    }

    /** Generates a marker image again (after an error or an interrupted generation). */
    async retry(messageId: number, imageId: string): Promise<void> {
        const entry = this.inline.entries(messageId).find((e) => e.id === imageId);
        if (!entry?.marker || this.running.has(imageId)) return;
        await this.inline.setMarkerStatus(messageId, imageId, 'pending');
        const text = ctx().chat[messageId]?.mes;
        await this.deliver(messageId, imageId, this.start(entry.marker.params, { messageId, text }));
    }

    // ---- generation -----------------------------------------------------------------------

    private enqueue<T>(task: () => Promise<T>): Promise<T> {
        const run = this.queue.then(task, task);
        this.queue = run.catch(() => undefined);
        return run;
    }

    private start(params: MarkerParams, query: SceneQuery = {}, options: StartOptions = {}): Job {
        const abort = new AbortController();
        const gate = this.gate;
        const messageId = query.messageId;
        // Asked now, so the verdict is for the reply swipe this drawing belongs to.
        const verdict =
            options.gated && messageId !== undefined && qualityGatesActive()
                ? replyVerdict(messageId, { streaming: options.streaming === true })
                : undefined;
        const job: Job = { promise: Promise.resolve(null), abort, ...(verdict ? { verdict } : {}) };
        job.promise = (async () => {
            if (gate && messageId !== undefined) await gate.wait(messageId, abort.signal);
            if (verdict) {
                // Nothing goes to NovelAI before the verdict; a dropped job stops waiting.
                const answer = await untilAborted(verdict, abort.signal);
                if (answer === undefined) return null;
                if (answer !== 'draw') {
                    job.held = answer;
                    return null;
                }
            }
            return await this.enqueue(async () =>
                abort.signal.aborted ? null : await this.produce(params, abort.signal, query),
            );
        })();
        // An early job that is dropped must not end as an unhandled rejection.
        job.promise.catch(() => undefined);
        return job;
    }

    private async deliver(hint: number, imageId: string, job: Job): Promise<void> {
        const chatId = ctx().getCurrentChatId();
        this.setRunning(imageId, true);
        if (job.verdict) {
            this.setWaiting(imageId, true);
            void job.verdict.then(() => this.setWaiting(imageId, false));
        }
        try {
            const produced = await job.promise;
            if (ctx().getCurrentChatId() !== chatId) return;
            if (produced) await this.inline.completePending(hint, imageId, produced);
            else if (job.held) {
                // Held by the quality gate: the placeholder stays, "Retry" (or a new swipe) draws it.
                const reason = job.held === 'skip' ? 'naist.markers.qualitySkipped' : 'naist.markers.qualityCancelled';
                await this.inline.setMarkerStatus(hint, imageId, 'pending', t(reason));
            } else await this.inline.setMarkerStatus(hint, imageId, 'error', t('naist.markers.cancelled'));
        } catch (error) {
            const naiError = toNaiError(error);
            log.warn('marker image failed:', naiError.code);
            if (ctx().getCurrentChatId() === chatId) {
                await this.inline.setMarkerStatus(
                    hint,
                    imageId,
                    'error',
                    naiError.code === 'aborted' ? t('naist.markers.cancelled') : naiError.text,
                );
            }
        } finally {
            this.setRunning(imageId, false);
        }
    }

    /** One marker as a generation request: every parameter it may carry. */
    async produce(params: MarkerParams, signal?: AbortSignal, query: SceneQuery = {}): Promise<ProducedImages | null> {
        const s = settings();
        const freeOnly = s.anlas.freeOnly || !s.markers.allowPaid;
        const model = markerModel(params.model) ?? s.generation.model;
        const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
        const dims = markerDimensions(params.ratio, params.size, freeOnly);
        // No character slots of the panel: a marker's characters come from its own description.
        const generation: Partial<GenerationSettings> = {
            model,
            width: dims.width,
            height: dims.height,
            characters: [],
        };
        if (params.seed !== undefined) generation.seed = params.seed;
        if (params.steps !== undefined) generation.steps = clamp(Math.round(params.steps), 1, freeOnly ? 28 : 50);
        if (params.scale !== undefined) generation.scale = clamp(params.scale, 0, 10);
        if (params.sampler) generation.sampler = params.sampler;
        if (params.rescale !== undefined) generation.cfgRescale = clamp(params.rescale, 0, 1);
        if (params.variety !== undefined) generation.varietyBoost = params.variety;
        if (params.quality !== undefined) {
            const current = s.generation.qualityPreset;
            generation.qualityPreset = params.quality ? (current === 'none' ? 'standard' : current) : 'none';
        }
        if (params.uc && (UC_PRESETS as readonly string[]).includes(params.uc))
            generation.ucPreset = params.uc as UcPresetId;
        if (params.transparent !== undefined) generation.transparentBackground = params.transparent;
        generation.samples = freeOnly ? 1 : clamp(Math.round(params.count ?? 1), 1, 4);

        let scene = params.prompt;
        let negative = params.negative ?? '';
        const style = params.style?.trim();
        if (style) {
            const saved = s.prompts.styles.find((st) => st.name.trim().toLowerCase() === style.toLowerCase());
            const join = (...parts: string[]) => parts.filter((p) => p.trim()).join(', ');
            if (saved) {
                scene = join(saved.prefix, scene, saved.suffix);
                negative = join(negative, saved.negative);
                const preset = styleUcPreset(saved);
                if (preset && !params.uc) generation.ucPreset = preset;
            } else scene = join(style, scene);
        }
        // Characters with a passport named in the description take part without "chars" too. Only the
        // description counts: a caption often names who is looked at ("winks at Arthur"), not who is drawn.
        let chars = params.chars;
        let passportIds: string[] = [];
        const declared = Boolean(chars?.length);
        if (!declared) {
            const known = (await sceneCandidates(query)).filter(
                (cand) =>
                    cand.passport !== null || cand.fallbackPrompt.trim() !== '' || Boolean(cand.currentLook?.trim()),
            );
            const named = detectParticipants(params.prompt, known, { max: 4 });
            if (named.length) chars = named.map((cand) => ({ name: cand.name }));
        }
        if (chars?.length) {
            const built = await this.scenes.markerScene(scene, chars, query, { counts: declared });
            if (built) {
                scene = built.prompt;
                generation.characters = built.characters;
                generation.useCoords = built.useCoords;
                passportIds = built.passportIds ?? [];
            } else {
                // Nobody known by that name: what they do still describes the picture.
                const actions = chars.map((ch) => [ch.pose, ch.action].filter(Boolean).join(' ')).filter(Boolean);
                scene = [scene, ...actions].join(', ');
            }
        }
        // Setting of the chat: world / scenario tags, the locations and (v0.12) the objects the marker names.
        const setting = await sceneSetting(query);
        const place = mentionedLocationTags(
            `${params.location ?? ''} ${setting.location} ${params.prompt}`,
            setting.locations,
        );
        const things = mentionedLocationTags(params.prompt, setting.objects ?? []);
        if (place || things || setting.world) scene = joinTags(scene, place, things, setting.world);
        if (params.text && caps.family !== 'v3') scene = `${scene}, text: ${params.text}`;
        const where = params.location || setting.location;
        // The place id of a scene provider belongs to its own location, not to the marker's.
        const placeId = params.location ? undefined : setting.locationId;
        if (where && s.continuity.enabled) await setCurrentLocation(where, placeId).catch(() => undefined);

        const requestPatch = params.ref ? await this.refPatch(params.ref, dims) : undefined;
        const vibes = params.vibe ? this.namedVibe(params.vibe) : undefined;
        const overrides: CallOverrides = { edit: false, negative, generation };
        return await this.pipeline.produce({
            initiator: 'message',
            trigger: scene,
            scene,
            mode: MODE.FREE,
            interpret: 'auto',
            // Character prompts come from passports: curated tags, converted only when Russian.
            interpretCharacters: 'cyrillic',
            overrides,
            ...(requestPatch ? { requestPatch, noContinuity: true } : {}),
            ...(vibes?.length ? { vibes } : {}),
            signal,
            skipCostConfirm: true,
            maxCost: freeOnly ? 0 : s.markers.maxCost,
            ...(passportIds.length ? { passportIds } : {}),
        });
    }

    /** "ref": an earlier image of the chat (marker id or image id) as the img2img base. */
    private async refPatch(
        ref: string,
        size: { width: number; height: number },
    ): Promise<Partial<GenerationRequest> | undefined> {
        if (!this.pipeline.studio.state.selection?.transport?.features.img2img) return undefined;
        const chat = ctx().chat;
        for (let i = chat.length - 1; i >= 0; i--) {
            const entry: InlineImage | undefined = readEntries(chat[i]?.extra).find(
                (e) => e.id === ref || e.marker?.params.id === ref,
            );
            const swipe = entry ? activeSwipe(entry) : undefined;
            if (!swipe) continue;
            try {
                const image = await blobToBase64(await toPngBlob(await this.inline.sourceBlob(swipe), size));
                return { mode: 'img2img', image, strength: settings().continuity.strength };
            } catch (error) {
                log.warn('marker ref image not available:', error);
                return undefined;
            }
        }
        return undefined;
    }

    private namedVibe(name: string): PlannedVibe[] {
        const wanted = name.trim().toLowerCase();
        const item = vibeItems().find((v) => v.name.trim().toLowerCase() === wanted);
        return item ? [{ item, strength: 0.6, informationExtracted: 1 }] : [];
    }
}
