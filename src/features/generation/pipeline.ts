// The full generation flow of the built-in Image Generation, re-implemented for NovelAI
// (RECON §2.1): mode -> scene prompt (LLM / raw / free / multimodal) -> optional edit ->
// SD_PROMPT_PROCESSING hook -> mode dimensions -> prefix/suffix/character prompt -> cost guard ->
// transport -> save -> new message, media swipe or chat background.
import { ctx, importHost } from '../../core/context';
import { NaiError, toNaiError } from '../../core/errors';
import { t } from '../../core/i18n';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import type { GenerationSettings, Initiator } from '../../core/settings-schema';
import {
    applyFreeModeCharacter,
    assemblePrompt,
    combinePrefixes,
    DEFAULT_MODEL,
    DEFAULT_TEMPLATES,
    getCapabilities,
    isModelId,
    isMultimodal,
    MODE,
    modeDimensions,
    processReply,
    quietPromptFor,
    rawLastPrompt,
    resolveMode,
    usesCharacterPrefix,
} from '../../domain';
import type { GenerationRequest, InlineGenerationMeta, ModelCapabilities, ModeId, VibeReference } from '../../domain';
import type { GeneratedImage, StreamFrame, Transport } from '../../transport';
import {
    avatarKey,
    currentCharacterPrompt,
    lastSpeakerPrompt,
    soloCharacterIndex,
} from '../characters/character-prompts';
import type { StudioController } from './controller';
import { appendToMessage, imageFolder, messageText, postToChat, saveImages } from './output';
import type { GenerationMeta, MediaAttachmentData } from './output';
import type { Prepared } from './service';

/** Per-call options coming from slash command arguments. */
export interface CallOverrides {
    quiet?: boolean;
    gallery?: boolean;
    negative?: string;
    extend?: boolean;
    edit?: boolean;
    multimodal?: boolean;
    snap?: boolean;
    minimalProcessing?: boolean;
    generation?: Partial<GenerationSettings>;
}

export interface PictureRequest {
    /** Request-level fields settings cannot express (img2img source, mask, vibes, references). */
    requestPatch?: Partial<GenerationRequest>;
    /**
     * Use this scene prompt as is (regeneration of a stored image): no mode resolution, no LLM.
     * `mode` still decides dimensions and the character prefix.
     */
    scene?: string;
    initiator: Initiator;
    /** Trigger word ("you", "face", ...) or free text. */
    trigger: string;
    /** Chat message the request is about (raw last message, interactive trigger). */
    message?: string;
    /** Force a mode instead of resolving it from the trigger (the panel always uses FREE). */
    mode?: ModeId;
    overrides?: CallOverrides;
    /** Regenerate into an existing message as a new media swipe. */
    swipe?: { messageId: number; attachment?: MediaAttachmentData; text?: string };
    signal?: AbortSignal;
    /** Auto generation with allowPaid: the user agreed to spend in advance. */
    skipCostConfirm?: boolean;
    /** Hard spending cap; a more expensive request is refused before it is sent. */
    maxCost?: number;
}

export interface PictureResult {
    path: string;
    messageId: number | null;
    cost: number;
}

/** Finished images with their parameters (generation, Director Tools, upscale, inpaint). */
export interface ProducedImages {
    images: GeneratedImage[];
    meta: InlineGenerationMeta;
    mode: ModeId;
    chatId: string | undefined;
}

/** Images and everything known about how they were made; nothing is saved or posted yet. */
export interface Produced extends ProducedImages {
    legacy: GenerationMeta;
    prepared: Prepared;
}

/** Vibes applied to generations (TZ Phase 5); encoding happens before the request is built. */
export interface VibeProvider {
    prepare(caps: ModelCapabilities, transport: Transport, signal?: AbortSignal): Promise<VibeReference[]>;
}

/** Progress display: step previews on the plugin, an estimate elsewhere. */
export interface ProgressUi {
    start(info: { steps: number; streaming: boolean; transport: string }): void;
    frame(frame: StreamFrame): void;
    end(): void;
}

export interface GenerationOutcome {
    target: 'message' | 'inline' | 'panel' | 'other';
    paths: string[];
    blobKeys?: string[];
    inlineId?: string;
}

/** Observer of every finished generation (the gallery records them). */
export type GenerationObserver = (produced: ProducedImages, outcome: GenerationOutcome) => void;

export interface RefineResult {
    prompt: string;
    negative?: string;
    useSavedResolution: boolean;
}

/** UI services the pipeline needs; injected because features must not import UI. */
export interface PipelineUi {
    refine(prompt: string, options: { negative?: string; resolution?: string }): Promise<RefineResult | null>;
    confirmCost(prepared: Prepared): Promise<boolean>;
    inspect(prepared: Prepared): Promise<boolean>;
    progress?: ProgressUi;
}

interface MultimodalModule {
    getMultimodalCaption(base64: string, prompt: string): Promise<string>;
}

interface PersonasModule {
    user_avatar: string;
}

function templates(): Record<string, string> {
    return { ...DEFAULT_TEMPLATES, ...settings().prompts.templates };
}

function lastUsableMessage(): STChatMessage {
    const chat = ctx().chat;
    for (let i = chat.length - 1; i >= 0; i--) {
        const message = chat[i];
        if (message && !message.is_system) return message;
    }
    throw new NaiError('no-usable-message', 'none');
}

async function blobToBase64(blob: Blob): Promise<string> {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

async function avatarUrl(mode: ModeId): Promise<string> {
    const c = ctx();
    if (mode === MODE.USER_MULTIMODAL) {
        const personas = await importHost<PersonasModule>('/scripts/personas.js');
        return `/User Avatars/${encodeURIComponent(personas.user_avatar)}`;
    }
    if (c.groupId) {
        const members = c.groups.find((g) => g.id === c.groupId)?.members ?? [];
        const last = [...c.chat].reverse().find((m) => !m.is_system && !m.is_user)?.original_avatar;
        const avatar = typeof last === 'string' ? last : members[Math.floor(Math.random() * members.length)];
        return `/characters/${encodeURIComponent(String(avatar ?? ''))}`;
    }
    const index = soloCharacterIndex();
    return `/characters/${encodeURIComponent(index === undefined ? '' : (c.characters[index]?.avatar ?? ''))}`;
}

/** Full parameter record of a prepared request (lightbox, gallery, PNG metadata, "repeat"). */
export function metaFromPrepared(
    prepared: Prepared,
    extra: { scenePrompt: string; negative: string; mode: number; tool?: string },
): InlineGenerationMeta {
    const r = prepared.request;
    const meta: InlineGenerationMeta = {
        scenePrompt: extra.scenePrompt,
        prompt: prepared.body.input,
        negativePrompt: String(prepared.body.parameters.negative_prompt ?? ''),
        negative: extra.negative,
        mode: extra.mode,
        model: prepared.body.model,
        seed: r.seed,
        width: r.width,
        height: r.height,
        steps: r.steps,
        scale: r.scale,
        cfgRescale: r.cfgRescale,
        sampler: r.sampler,
        noiseSchedule: r.noiseSchedule,
        ucPreset: r.ucPreset,
        qualityPreset: r.qualityPreset,
        requestType: r.mode,
        characters: r.characters
            .filter((c) => c.enabled && c.prompt.trim())
            .map((c) => ({ prompt: c.prompt, negative: c.negative, x: c.center.x, y: c.center.y })),
        transport: prepared.transportId,
        cost: prepared.cost.total,
        createdAt: new Date().toISOString(),
    };
    if (extra.tool) meta.tool = extra.tool;
    return meta;
}

export class Pipeline {
    private readonly observers = new Set<GenerationObserver>();
    private vibes: VibeProvider | null = null;

    constructor(
        private readonly controller: StudioController,
        private readonly ui: PipelineUi,
    ) {}

    onGenerated(observer: GenerationObserver): void {
        this.observers.add(observer);
    }

    setVibeProvider(provider: VibeProvider): void {
        this.vibes = provider;
    }

    notify(produced: ProducedImages, outcome: GenerationOutcome): void {
        for (const observer of this.observers) {
            try {
                observer(produced, outcome);
            } catch (error) {
                log.warn('generation observer failed', error);
            }
        }
    }

    get studio(): StudioController {
        return this.controller;
    }

    /** Scene prompt for a mode (before prefix/suffix and character prompt). */
    private async scenePrompt(
        mode: ModeId,
        trigger: string,
        message: string | undefined,
        minimal: boolean,
        addNegative: (neg: string) => void,
    ): Promise<string> {
        const c = ctx();
        if (mode === MODE.RAW_LAST) {
            if (message) return message;
            const last = lastUsableMessage();
            const character = c.groupId
                ? c.characters.find((ch) => ch.avatar === last.original_avatar)
                : c.characters[soloCharacterIndex() ?? -1];
            return rawLastPrompt(
                last.mes,
                character ? { scenario: character.scenario, description: character.description } : undefined,
            );
        }
        if (mode === MODE.FREE) {
            const free = applyFreeModeCharacter(trigger, lastSpeakerPrompt());
            if (free.negative) addNegative(free.negative);
            return free.prompt;
        }
        const quietPrompt = quietPromptFor(mode, trigger, templates());
        if (isMultimodal(mode)) {
            const response = await fetch(await avatarUrl(mode));
            if (!response.ok) throw new NaiError('multimodal-failed', 'none');
            const base64 = await blobToBase64(await response.blob());
            const shared = await importHost<MultimodalModule>('/scripts/extensions/shared.js');
            const caption = await shared.getMultimodalCaption(base64, quietPrompt);
            if (!caption) throw new NaiError('multimodal-failed', 'none');
            return caption;
        }
        const reply = await c.generateQuietPrompt({ quietPrompt });
        let prompt = processReply(reply, minimal);
        if (!prompt) throw new NaiError('prompt-generation-failed', 'none');
        if (mode === MODE.FREE_EXTENDED) {
            const free = applyFreeModeCharacter(prompt.trim(), lastSpeakerPrompt());
            if (free.negative) addNegative(free.negative);
            prompt = free.prompt;
        }
        return prompt;
    }

    /**
     * Synchronous FREE-mode preparation for the panel preview and inspector: the exact body the
     * panel's Generate button will send (minus the random seed).
     */
    previewFree(trigger: string): Prepared {
        const assembled = this.assemble(MODE.FREE, trigger, '', { isSwipe: false, expanded: false });
        return this.controller.prepare(assembled.overrides);
    }

    /** Composed scene (TZ Phase 4) as the inspector will see it. */
    previewScene(scene: string, generation: Partial<GenerationSettings>): Prepared {
        const assembled = this.assemble(MODE.FREE, scene, '', { isSwipe: false, expanded: true }, { generation });
        return this.controller.prepare(assembled.overrides);
    }

    private assemble(
        mode: ModeId,
        scene: string,
        additionalNegative: string,
        /**
         * isSwipe: built-in media swipe rule (character prefix always on in 1:1 chats).
         * expanded: the scene already went through free-mode "char" expansion (stored prompt).
         */
        flags: { isSwipe: boolean; expanded: boolean },
        overrides: CallOverrides = {},
        forcedSize?: { width: number; height: number },
    ) {
        const s = settings();
        const c = ctx();
        const g = { ...s.generation, ...overrides.generation };
        const caps = getCapabilities(isModelId(g.model) ? g.model : DEFAULT_MODEL);
        const dims =
            forcedSize ?? modeDimensions(mode, g.width, g.height, overrides.snap ?? s.modes.snap, caps.sizePresets);
        let negativeExtra = additionalNegative;
        let sceneText = scene;
        if (mode === MODE.FREE && !flags.isSwipe && !flags.expanded) {
            const free = applyFreeModeCharacter(scene, lastSpeakerPrompt());
            sceneText = free.prompt;
            if (free.negative) negativeExtra = combinePrefixes(negativeExtra, free.negative);
        }
        const character = currentCharacterPrompt();
        const assembled = assemblePrompt({
            scene: sceneText,
            prefix: s.prompts.prefix,
            suffix: s.prompts.suffix,
            negative: g.negativePrompt,
            characterPositive: character.positive,
            characterNegative: character.negative,
            additionalNegative: negativeExtra,
            useCharacterPrefix: usesCharacterPrefix(mode, flags.isSwipe, soloCharacterIndex() !== undefined),
        });
        const generation: Partial<GenerationSettings> = {
            ...overrides.generation,
            prompt: c.substituteParams(assembled.prompt),
            negativePrompt: c.substituteParams(assembled.negative),
            width: dims.width,
            height: dims.height,
        };
        return { overrides: generation, sceneText, negativeExtra, dims };
    }

    /**
     * Everything up to the images: mode, scene prompt (LLM / raw / free / multimodal), optional
     * edit, SD_PROMPT_PROCESSING, assembly, cost guard, transport. Returns null when cancelled.
     */
    async produce(req: PictureRequest): Promise<Produced | null> {
        const s = settings();
        const c = ctx();
        const o = req.overrides ?? {};
        const trigger = req.trigger.trim();
        if (!trigger && !req.swipe && req.scene === undefined) return null;

        const refine = o.edit ?? s.modes.refine;
        const minimal = o.minimalProcessing ?? s.modes.minimalProcessing;
        let mode: ModeId;
        let scene: string;
        let additionalNegative = o.negative ?? '';
        let forcedSize: { width: number; height: number } | undefined;
        const isSwipe = Boolean(req.swipe);

        if (req.scene !== undefined) {
            mode = req.mode ?? MODE.FREE;
            scene = req.scene;
            if (refine) {
                const edited = await this.ui.refine(scene, { negative: additionalNegative });
                if (!edited) return null;
                scene = edited.prompt;
                additionalNegative = edited.negative ?? additionalNegative;
            }
            // A composed scene may carry everything in its character prompts.
            const hasCharacters = (o.generation?.characters ?? []).some((ch) => ch.enabled && ch.prompt.trim());
            if (!scene.trim() && !hasCharacters) return null;
        } else if (req.swipe) {
            const attachment = req.swipe.attachment;
            mode = (attachment?.generation_type ?? MODE.FREE) as ModeId;
            scene = attachment?.title ?? req.swipe.text ?? '';
            additionalNegative = attachment?.negative ?? additionalNegative;
            const saved =
                attachment?.width && attachment?.height
                    ? { width: attachment.width, height: attachment.height }
                    : undefined;
            if (refine) {
                const edited = await this.ui.refine(scene, {
                    negative: additionalNegative,
                    resolution: saved ? `${saved.width}x${saved.height}` : undefined,
                });
                if (!edited) return null;
                scene = edited.prompt;
                additionalNegative = edited.negative ?? additionalNegative;
                forcedSize = edited.useSavedResolution ? saved : undefined;
            } else {
                forcedSize = saved;
            }
            if (!scene.trim()) return null;
        } else {
            mode =
                req.mode ??
                resolveMode(trigger, {
                    multimodal: o.multimodal ?? s.modes.multimodal,
                    freeExtend: o.extend ?? s.modes.freeExtend,
                });
            scene =
                mode === MODE.FREE
                    ? trigger
                    : await this.scenePrompt(
                          mode,
                          trigger,
                          req.message,
                          minimal,
                          (neg) => (additionalNegative = combinePrefixes(additionalNegative, neg)),
                      );
            if (mode !== MODE.FREE && refine) {
                const edited = await this.ui.refine(scene, {});
                if (!edited) return null;
                scene = edited.prompt;
            }
        }

        // Extension hook kept from the built-in so other extensions can still rewrite the prompt.
        const eventData = { prompt: scene, generationType: mode, message: req.message, trigger };
        await c.eventSource.emit(c.eventTypes.SD_PROMPT_PROCESSING ?? 'sd_prompt_processing', eventData);
        scene = eventData.prompt;

        // A stored scene prompt is already final: free-mode "char" expansion must not run twice,
        // and it keeps the character-prefix rule of its mode (not the media-swipe rule).
        const assembled = this.assemble(
            mode,
            scene,
            additionalNegative,
            { isSwipe, expanded: req.scene !== undefined },
            o,
            forcedSize,
        );
        // An image swipe with a fixed seed gets a random one, like the built-in.
        if (isSwipe && assembled.overrides.seed === undefined && s.generation.seed >= 0) assembled.overrides.seed = -1;
        const patch: Partial<GenerationRequest> = { ...req.requestPatch };
        const transport = this.controller.state.selection?.transport;
        const model = String(assembled.overrides.model ?? s.generation.model);
        const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
        if (patch.vibes === undefined && this.vibes && transport && patch.mode !== 'inpaint') {
            const vibes = await this.vibes.prepare(caps, transport, req.signal);
            if (vibes.length) patch.vibes = vibes;
        }
        // Step previews on the plugin for V4+ (TZ Phase 5); a spinner with an estimate elsewhere.
        const streaming = s.stream.enabled && transport?.features.stream === true && caps.family !== 'v3';
        if (streaming && patch.stream === undefined) patch.stream = 'sse';
        const prepared = this.controller.prepare(assembled.overrides, patch);
        if (req.maxCost !== undefined && prepared.cost.total > req.maxCost) {
            throw new NaiError('free-only-blocked', 'none', { cost: prepared.cost.total });
        }

        if (s.inspector.openBeforeSend) {
            if (!(await this.ui.inspect(prepared))) return null;
        } else if (
            !req.skipCostConfirm &&
            prepared.blockers.length === 0 &&
            prepared.cost.total > 0 &&
            prepared.cost.total > s.anlas.confirmAbove
        ) {
            if (!(await this.ui.confirmCost(prepared))) return null;
        }

        const abort = new AbortController();
        req.signal?.addEventListener('abort', () => abort.abort(), { once: true });
        const loader = c.loader?.show({
            blocking: false,
            slug: 'nai-studio-generation',
            title: t('naist.loader.title'),
            message: t('naist.loader.message'),
            onStop: () => abort.abort(),
        });
        try {
            const chatId = c.getCurrentChatId();
            this.ui.progress?.start({
                steps: prepared.request.steps,
                streaming: prepared.build.endpoint === 'generate-stream',
                transport: prepared.transportId,
            });
            const result = await this.controller
                .send(prepared, abort.signal, (frame) => this.ui.progress?.frame(frame))
                .finally(() => this.ui.progress?.end());
            if (!result.images.length) throw new NaiError('invalid-response', 'none', { preview: '' });
            const generation = o.generation ?? {};
            const legacy: GenerationMeta = {
                scenePrompt: assembled.sceneText,
                prompt: prepared.body.input,
                negative: assembled.negativeExtra,
                mode,
                model: prepared.body.model,
                seed: prepared.request.seed,
                transport: prepared.transportId,
                cost: prepared.cost.total,
                correlationId: result.correlationId,
                ...(forcedSize ?? (generation.width && generation.height ? assembled.dims : {})),
            };
            const meta = metaFromPrepared(prepared, {
                scenePrompt: assembled.sceneText,
                negative: assembled.negativeExtra,
                mode,
            });
            log.info('picture', req.initiator, `mode ${mode}`, prepared.body.model, `cost ${prepared.cost.total}`);
            return { images: result.images, meta, legacy, prepared, mode, chatId };
        } catch (error) {
            throw toNaiError(error, {
                model: prepared.request.model,
                family: prepared.caps.family,
                transport: prepared.transportId,
            });
        } finally {
            await loader?.hide();
        }
    }

    async generatePicture(req: PictureRequest): Promise<PictureResult | null> {
        const s = settings();
        const c = ctx();
        const o = req.overrides ?? {};
        const produced = await this.produce(req);
        if (!produced) return null;
        const { legacy: meta, mode, chatId } = produced;
        const cost = produced.prepared.cost.total;
        try {
            const folder = o.gallery === false ? '' : imageFolder();
            const saved = await saveImages(produced.images, folder);
            const first = saved[0];
            if (!first) throw new NaiError('invalid-response', 'none', { preview: '' });
            this.notify(produced, { target: o.quiet ? 'other' : 'message', paths: saved.map((x) => x.path) });
            if (ctx().getCurrentChatId() !== chatId) {
                // The built-in discards the image; we keep the file but do not post into another chat.
                toastr.warning(t('naist.result.chatChanged', { count: saved.length }));
                return { path: first.path, messageId: null, cost };
            }
            let messageId: number | null = null;
            if (!o.quiet) {
                if (req.swipe) {
                    await appendToMessage(req.swipe.messageId, saved, meta);
                    messageId = req.swipe.messageId;
                } else {
                    if (mode === MODE.BACKGROUND) {
                        await c.eventSource.emit(c.eventTypes.FORCE_SET_BACKGROUND ?? 'force_set_background', {
                            url: `url("${encodeURI(first.path)}")`,
                            path: first.path,
                        });
                    }
                    messageId = await postToChat(saved, meta, {
                        visible: s.chat.visibility[req.initiator] === true,
                        author: s.chat.author,
                        hidePrompt: s.chat.hidePrompt,
                        text: messageText(templates()[String(MODE.MESSAGE)] ?? '{{prompt}}', meta.scenePrompt),
                    });
                }
            }
            return { path: first.path, messageId, cost };
        } catch (error) {
            throw toNaiError(error, {
                model: produced.prepared.request.model,
                transport: produced.prepared.transportId,
            });
        }
    }
}

/** Avatar key of the character a 1:1 chat is with, for UI that edits character prompts. */
export function currentAvatarKey(): string {
    const index = soloCharacterIndex();
    return index === undefined ? '' : avatarKey(ctx().characters[index]?.avatar);
}
