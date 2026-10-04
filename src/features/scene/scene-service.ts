// Scene composer service (TZ Phase 4): candidates of the current chat (character / group members
// and the user persona) with their passports, automatic assembly from a message, and generation
// of a composed scene into a new message or inline into the last message. Since v0.10 passports are
// the chat's view of them (chat overrides, passports of the chat itself), and scene providers of
// other extensions (registerSceneHintProvider) name the place, setting tags and who is present.
import { ctx } from '../../core/context';
import { NaiError } from '../../core/errors';
import { log } from '../../core/logger';
import { settings } from '../../core/settings';
import {
    isExplicitScene,
    applyPairLayout,
    autoLayout,
    buildScene,
    DEFAULT_MODEL,
    DEFAULT_TEMPLATES,
    detectPairInText,
    detectParticipants,
    detectPose,
    getCapabilities,
    isModelId,
    isPassportEmpty,
    joinTags,
    MODE,
    markerPosition,
    mentionIndex,
    participantFrom,
    POSES,
    primaryPassport,
    processReply,
} from '../../domain';
import type {
    BuiltScene,
    ChatPassports,
    MarkerCharacter,
    ModelCapabilities,
    Passport,
    PosePreset,
    SceneCandidate,
    SceneSpec,
} from '../../domain';
import { avatarKey, readCharacterPrompt } from '../characters/character-prompts';
import {
    chatCardIndexes,
    chatPassportData,
    currentPersonaKey,
    loadCharacter,
    PERSONA_OWNER_PREFIX,
    resolvedCardPassports,
    resolvedPersonaPassport,
} from '../characters/passport-store';
import { placeById } from '../continuity/places';
import type { Pipeline, PictureResult } from '../generation/pipeline';
import type { InlineImages } from '../inline/inline-service';
import { sceneHint } from './scene-providers';

export const PERSONA_PREFIX = PERSONA_OWNER_PREFIX;
/** Key prefix of the candidates of passports that exist only in the chat ("chat#<passport id>"). */
export const CHAT_PASSPORT_PREFIX = 'chat#';

export function customPoses(): PosePreset[] {
    return settings().poses.custom.map((p) => ({
        id: p.id,
        category: (p.category as PosePreset['category']) || 'standing',
        tags: p.tags,
        keywords: p.keywords,
    }));
}

export function poseLibrary(): PosePreset[] {
    const custom = customPoses();
    return [...custom, ...POSES.filter((p) => !custom.some((c) => c.id === p.id))];
}

export function currentCaps(): ModelCapabilities {
    const model = settings().generation.model;
    return getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
}

function aliasesOf(name: string): string[] {
    const first = name.trim().split(/\s+/)[0] ?? '';
    return first && first !== name.trim() ? [first] : [];
}

/** Which reply a scene is about: the tracker of that reply when an integration has one. */
export interface SceneQuery {
    messageId?: number;
    /** Text of the reply (a tracker may sit in it before it is parsed). */
    text?: string;
}

/** Extra people and setting from another extension (Doom's Enhancement Suite, v0.9). */
export interface SceneProvider {
    /** People of the scene: merged into the candidates by name (current look, aliases), new ones added. */
    candidates(query: SceneQuery): Promise<SceneCandidate[]>;
    /** Setting tags and the current location name. */
    setting(query: SceneQuery): Promise<{ tags: string[]; location: string }>;
}

let provider: SceneProvider | null = null;

export function setSceneProvider(next: SceneProvider | null): void {
    provider = next;
}

const sameCandidate = (a: SceneCandidate, b: SceneCandidate): boolean =>
    mentionIndex(a.name, [b.name, ...b.aliases]) >= 0 || mentionIndex(b.name, [a.name, ...a.aliases]) >= 0;

/** Candidates of the cards and the persona, with the provider's people merged in. */
async function withProvided(base: SceneCandidate[], query: SceneQuery): Promise<SceneCandidate[]> {
    if (!provider) return base;
    let extra: SceneCandidate[] = [];
    try {
        extra = await provider.candidates(query);
    } catch (error) {
        log.warn('scene provider: people not available', error);
    }
    for (const person of extra) {
        const known = base.find((c) => !c.isUser && sameCandidate(c, person));
        if (known) {
            if (person.currentLook) known.currentLook = person.currentLook;
            known.aliases = [...new Set([...known.aliases, ...person.aliases])];
        } else base.push(person);
    }
    return base;
}

/** Separator between the card key and a passport id in candidate keys ("<avatar>#<passport>"). */
export const PASSPORT_KEY_SEPARATOR = '#';

/**
 * The people of a card: one candidate per character passport (the main one keeps the card key);
 * a card without character passports is one candidate with its character prompt, unless it is a
 * scenario (then nobody is drawn for the card itself).
 */
async function characterCandidates(index: number, chat: ChatPassports): Promise<SceneCandidate[]> {
    const character = await loadCharacter(index);
    if (!character) return [];
    const prompt = readCharacterPrompt(character);
    const key = avatarKey(character.avatar);
    const list = resolvedCardPassports(character, chat);
    const people = list.filter((p) => p.kind === 'character' && !isPassportEmpty(p));
    if (people.length) {
        const main = primaryPassport(people, character.name);
        return people.map((passport) => {
            const isMain = passport === main;
            const name = passport.name || character.name;
            return {
                key: isMain ? key : `${key}${PASSPORT_KEY_SEPARATOR}${passport.id}`,
                name,
                aliases: [...new Set([...passport.aliases, ...aliasesOf(name)])],
                passport,
                fallbackPrompt: isMain ? prompt.positive : '',
                fallbackNegative: isMain ? prompt.negative : '',
                isUser: false,
            };
        });
    }
    if (list.some((p) => p.kind === 'scenario')) return [];
    return [
        {
            key,
            name: character.name,
            aliases: aliasesOf(character.name),
            passport: null,
            fallbackPrompt: prompt.positive,
            fallbackNegative: prompt.negative,
            isUser: false,
        },
    ];
}

/** Named character passports that exist only in this chat (another extension wrote them). */
function chatOnlyCandidates(chat: ChatPassports): SceneCandidate[] {
    return chat.extra
        .filter((p) => p.kind === 'character' && p.name.trim() && !isPassportEmpty(p))
        .map((passport) => ({
            key: `${CHAT_PASSPORT_PREFIX}${passport.id}`,
            name: passport.name,
            aliases: [...new Set([...passport.aliases, ...aliasesOf(passport.name)])],
            passport,
            fallbackPrompt: '',
            fallbackNegative: '',
            isUser: false,
        }));
}

const namesOne = (name: string, candidate: SceneCandidate): boolean =>
    mentionIndex(name, [candidate.name, ...candidate.aliases]) >= 0 || mentionIndex(candidate.name, [name]) >= 0;

/** Candidates a scene provider says are present get `present` (the automatic scene falls back to them). */
function markPresent(list: SceneCandidate[], names: readonly string[] | undefined): SceneCandidate[] {
    if (!names?.length) return list;
    for (const candidate of list) if (names.some((name) => namesOne(name, candidate))) candidate.present = true;
    return list;
}

export interface SceneLocation {
    name: string;
    aliases: string[];
    tags: string;
}

/**
 * Setting of the chat: world and scenario tags and named locations of its cards, plus the setting
 * tags and the current location of a provider (a scene tracker).
 */
export async function sceneSetting(
    query: SceneQuery = {},
): Promise<{ world: string; locations: SceneLocation[]; location: string; locationId?: string }> {
    const world: string[] = [];
    const locations: SceneLocation[] = [];
    const chat = chatPassportData();
    const collect = (passport: Passport) => {
        if (passport.kind === 'world' || passport.kind === 'scenario') world.push(passport.tags);
        else if (passport.kind === 'location' && passport.name && passport.tags.trim())
            locations.push({ name: passport.name, aliases: passport.aliases, tags: passport.tags });
    };
    for (const index of chatCardIndexes()) {
        for (const passport of resolvedCardPassports(await loadCharacter(index), chat)) collect(passport);
    }
    for (const passport of chat.extra) collect(passport);
    // Scene providers of other extensions first, field by field; then the tracker integration.
    const hint = await sceneHint(query);
    let tracked = { tags: [] as string[], location: '' };
    if (provider && (hint.tags === undefined || hint.locationName === undefined)) {
        try {
            tracked = await provider.setting(query);
        } catch (error) {
            log.warn('scene provider: setting not available', error);
        }
    }
    const tags = hint.tags ?? tracked.tags.join(', ');
    const location =
        hint.locationName ?? (hint.locationId ? placeById(hint.locationId)?.name : undefined) ?? tracked.location;
    return {
        world: joinTags(...world, tags),
        locations,
        location,
        ...(hint.locationId ? { locationId: hint.locationId } : {}),
    };
}

/** Tags of the locations a text names (whole-word name or alias). */
export function mentionedLocationTags(text: string, locations: readonly SceneLocation[]): string {
    return joinTags(...locations.filter((l) => mentionIndex(text, [l.name, ...l.aliases]) >= 0).map((l) => l.tags));
}

/** Characters of the current chat (the 1:1 character or every group member) and the persona. */
export async function sceneCandidates(query: SceneQuery = {}): Promise<SceneCandidate[]> {
    const c = ctx();
    const chat = chatPassportData();
    const result: SceneCandidate[] = [];
    for (const index of chatCardIndexes()) result.push(...(await characterCandidates(index, chat)));
    result.push(...chatOnlyCandidates(chat));
    const personaKey = await currentPersonaKey();
    result.push({
        key: `${PERSONA_PREFIX}${personaKey}`,
        name: c.name1,
        aliases: aliasesOf(c.name1),
        passport: resolvedPersonaPassport(personaKey, chat),
        fallbackPrompt: '',
        fallbackNegative: '',
        isUser: true,
    });
    const merged = await withProvided(result, query);
    return markPresent(merged, (await sceneHint(query)).characters);
}

function sentencesMentioning(text: string, candidate: SceneCandidate): string {
    const names = [candidate.name, ...candidate.aliases].map((n) => n.toLowerCase()).filter((n) => n.length > 1);
    return text
        .split(/(?<=[.!?…])\s+|\n+/)
        .filter((sentence) => names.some((n) => sentence.toLowerCase().includes(n)))
        .join(' ');
}

function lastMessage(): { text: string; speakerKey: string | undefined } {
    const chat = ctx().chat;
    for (let i = chat.length - 1; i >= 0; i--) {
        const message = chat[i];
        if (!message || message.is_system) continue;
        const avatar = typeof message.original_avatar === 'string' ? message.original_avatar : undefined;
        const c = ctx();
        const speakerKey = message.is_user
            ? undefined
            : avatar
              ? avatarKey(avatar)
              : c.characterId !== undefined
                ? avatarKey(c.characters[Number(c.characterId)]?.avatar)
                : undefined;
        return { text: message.mes.replace(/\[nai:img:[^\]]+\]/g, ''), speakerKey };
    }
    return { text: '', speakerKey: undefined };
}

export class SceneService {
    constructor(
        private readonly pipeline: Pipeline,
        private readonly inline: InlineImages,
    ) {}

    /** An empty scene with every candidate available (the composer starts from this). */
    async emptySpec(query: SceneQuery = {}): Promise<{ spec: SceneSpec; candidates: SceneCandidate[] }> {
        const s = settings().scene;
        return {
            candidates: await sceneCandidates(query),
            spec: {
                base: '',
                framing: s.framing,
                camera: s.camera,
                distance: s.distance,
                pair: null,
                participants: [],
                useCoords: s.useCoords,
            },
        };
    }

    /**
     * Automatic assembly from the last message (or a given text): who is in the frame, their
     * poses (from the sentences that mention them, else the passport default), a pair pose,
     * positions, and optionally an LLM-written location for the base prompt.
     */
    async autoSpec(text?: string): Promise<{ spec: SceneSpec; candidates: SceneCandidate[] }> {
        const { spec, candidates } = await this.emptySpec();
        const source = text !== undefined ? { text, speakerKey: undefined } : lastMessage();
        const caps = currentCaps();
        const max = caps.maxCharacters > 0 ? caps.maxCharacters : 3;
        let found = detectParticipants(source.text, candidates, { speakerKey: source.speakerKey, max });
        // Nobody named in the text: the people a scene provider says are present, before the speaker.
        const present = candidates.filter((c) => c.present);
        if (present.length && !candidates.some((c) => mentionIndex(source.text, [c.name, ...c.aliases]) >= 0))
            found = present.slice(0, max);
        const library = poseLibrary();
        const positions = autoLayout(
            found.length,
            caps,
            found.map((c) => c.passport?.position ?? null),
        );
        spec.participants = found.map((candidate, i) => {
            const own = sentencesMentioning(source.text, candidate);
            const pose = detectPose(own || (found.length === 1 ? source.text : ''), library);
            return participantFrom(candidate, positions[i] ?? { x: 0.5, y: 0.5 }, pose);
        });
        const pair = detectPairInText(source.text, found);
        if (pair) {
            spec.pair = pair;
            applyPairLayout(spec, caps);
        }
        if (settings().scene.llmBase && source.text.trim()) {
            spec.base = await this.describeLocation();
        }
        const setting = await sceneSetting();
        spec.base = joinTags(
            spec.base,
            mentionedLocationTags(`${setting.location} ${source.text}`, setting.locations),
            setting.world,
        );
        return { spec, candidates };
    }

    /**
     * Characters named by an image marker (TZ Phase 7): passports by name or alias, positions and
     * poses from the marker, the marker prompt as the shared part. A name without a passport or a
     * character prompt adds nothing; null when no name is usable.
     */
    /**
     * `counts`: false when the characters were found by name in the description rather than listed
     * by the LLM; someone without a passport may be in the picture too, so no "1girl, 1boy".
     */
    async markerScene(
        prompt: string,
        chars: MarkerCharacter[],
        query: SceneQuery = {},
        options: { counts?: boolean } = {},
    ): Promise<BuiltScene | null> {
        const { spec, candidates } = await this.emptySpec(query);
        const caps = currentCaps();
        const max = caps.maxCharacters > 0 ? caps.maxCharacters : 3;
        const picked: { candidate: SceneCandidate; ch: MarkerCharacter }[] = [];
        for (const ch of chars) {
            if (picked.length >= max) break;
            const candidate = candidates.find(
                (c) =>
                    (c.passport !== null || c.fallbackPrompt.trim() !== '' || Boolean(c.currentLook?.trim())) &&
                    !picked.some((p) => p.candidate.key === c.key) &&
                    mentionIndex(ch.name, [c.name, ...c.aliases]) >= 0,
            );
            if (candidate) picked.push({ candidate, ch });
            else if (ch.look?.trim()) {
                // Nobody known by that name: the marker's own description is their character prompt.
                picked.push({
                    candidate: {
                        key: `marker:${ch.name.toLowerCase()}`,
                        name: ch.name,
                        aliases: [],
                        passport: null,
                        fallbackPrompt: ch.look.trim(),
                        fallbackNegative: '',
                        isUser: false,
                    },
                    ch: { ...ch, look: undefined },
                });
            }
        }
        if (!picked.length) return null;
        const wanted = picked.map(({ ch }) => markerPosition(ch.pos));
        const positions = autoLayout(
            picked.length,
            caps,
            picked.map(({ candidate }, i) => wanted[i] ?? candidate.passport?.position ?? null),
        );
        const library = poseLibrary();
        spec.participants = picked.map(({ candidate, ch }, i) => {
            const pose = detectPose(`${ch.pose ?? ''} ${ch.action ?? ''}`, library);
            const participant = participantFrom(candidate, positions[i] ?? { x: 0.5, y: 0.5 }, pose);
            // What a known character wears in this picture replaces the passport's clothes.
            if (ch.look?.trim()) participant.currentLook = ch.look.trim();
            const extra = [pose ? '' : (ch.pose ?? ''), ch.action ?? ''].filter((x) => x.trim()).join(', ');
            if (extra) participant.poseTags = [participant.poseTags, extra].filter((x) => x.trim()).join(', ');
            return participant;
        });
        spec.base = prompt;
        if (wanted.some(Boolean)) spec.useCoords = true;
        return this.build(spec, { auto: true, counts: options.counts });
    }

    /** Location tags written by the LLM with the built-in "background" template. */
    async describeLocation(): Promise<string> {
        const template =
            settings().prompts.templates[String(MODE.BACKGROUND)] ?? DEFAULT_TEMPLATES[String(MODE.BACKGROUND)] ?? '';
        try {
            const reply = await ctx().generateQuietPrompt({ quietPrompt: template });
            return processReply(reply, false).replace(/^background,\s*/i, '');
        } catch {
            return '';
        }
    }

    /**
     * `auto`: a scene nobody composed by hand (markers, the LLM tool) gets the NSFW layer of the
     * passports only when the scene itself is explicit.
     */
    build(spec: SceneSpec, options: { auto?: boolean; counts?: boolean } = {}): BuiltScene {
        const text = [spec.base, ...spec.participants.map((p) => p.poseTags)].join(', ');
        const allowNsfw = settings().scene.allowNsfw && (!options.auto || isExplicitScene(text));
        return buildScene(spec, currentCaps(), { allowNsfw, customPoses: customPoses(), counts: options.counts });
    }

    /** Overrides for the panel preview and the inspector. */
    overrides(built: BuiltScene) {
        return {
            characters: built.characters,
            useCoords: built.useCoords,
        };
    }

    /** Generates the composed scene into a new message or inline into the last message. */
    async generate(
        spec: SceneSpec,
        target: 'message' | 'inline',
        options: { auto?: boolean } = {},
    ): Promise<PictureResult | string | null> {
        const built = this.build(spec, options);
        if (!built.prompt.trim() && !built.characters.some((c) => c.prompt.trim())) {
            throw new NaiError('no-usable-message', 'none');
        }
        // The composer is the edit step: no second prompt popup.
        const overrides = { edit: false, generation: this.overrides(built) };
        if (target === 'inline') {
            const chat = ctx().chat;
            let messageId = chat.length - 1;
            while (messageId >= 0 && chat[messageId]?.is_system) messageId--;
            if (messageId < 0) throw new NaiError('no-usable-message', 'none');
            const entry = await this.inline.insert(messageId, {
                trigger: built.prompt,
                scene: built.prompt,
                mode: MODE.FREE,
                overrides,
                passportIds: built.passportIds,
            });
            return entry?.id ?? null;
        }
        return await this.pipeline.generatePicture({
            initiator: 'panel',
            trigger: built.prompt || 'scene',
            scene: built.prompt,
            mode: MODE.FREE,
            overrides,
            passportIds: built.passportIds,
        });
    }
}
