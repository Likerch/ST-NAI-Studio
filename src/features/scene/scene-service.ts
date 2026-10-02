// Scene composer service (TZ Phase 4): candidates of the current chat (character / group members
// and the user persona) with their passports, automatic assembly from a message, and generation
// of a composed scene into a new message or inline into the last message.
import { ctx } from '../../core/context';
import { NaiError } from '../../core/errors';
import { settings } from '../../core/settings';
import {
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
    MODE,
    participantFrom,
    POSES,
    processReply,
} from '../../domain';
import type { BuiltScene, ModelCapabilities, PosePreset, SceneCandidate, SceneSpec } from '../../domain';
import { avatarKey, readCharacterPrompt } from '../characters/character-prompts';
import { cardPassport, currentPersonaKey, loadCharacter, personaPassport } from '../characters/passport-store';
import type { Pipeline, PictureResult } from '../generation/pipeline';
import type { InlineImages } from '../inline/inline-service';

export const PERSONA_PREFIX = 'persona:';

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

async function characterCandidate(index: number): Promise<SceneCandidate | null> {
    const character = await loadCharacter(index);
    if (!character) return null;
    const prompt = readCharacterPrompt(character);
    return {
        key: avatarKey(character.avatar),
        name: character.name,
        aliases: aliasesOf(character.name),
        passport: cardPassport(character),
        fallbackPrompt: prompt.positive,
        fallbackNegative: prompt.negative,
        isUser: false,
    };
}

/** Characters of the current chat (the 1:1 character or every group member) and the persona. */
export async function sceneCandidates(): Promise<SceneCandidate[]> {
    const c = ctx();
    const result: SceneCandidate[] = [];
    if (c.groupId) {
        const members = c.groups.find((g) => g.id === c.groupId)?.members ?? [];
        for (const avatar of members) {
            const index = c.characters.findIndex((ch) => ch.avatar === avatar);
            if (index < 0) continue;
            const candidate = await characterCandidate(index);
            if (candidate) result.push(candidate);
        }
    } else if (c.characterId !== undefined && c.characterId !== null && c.characterId !== '') {
        const candidate = await characterCandidate(Number(c.characterId));
        if (candidate) result.push(candidate);
    }
    const personaKey = await currentPersonaKey();
    result.push({
        key: `${PERSONA_PREFIX}${personaKey}`,
        name: c.name1,
        aliases: aliasesOf(c.name1),
        passport: personaPassport(personaKey),
        fallbackPrompt: '',
        fallbackNegative: '',
        isUser: true,
    });
    return result;
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
    async emptySpec(): Promise<{ spec: SceneSpec; candidates: SceneCandidate[] }> {
        const s = settings().scene;
        return {
            candidates: await sceneCandidates(),
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
        const found = detectParticipants(source.text, candidates, { speakerKey: source.speakerKey, max });
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
        return { spec, candidates };
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

    build(spec: SceneSpec): BuiltScene {
        return buildScene(spec, currentCaps(), { allowNsfw: settings().scene.allowNsfw, customPoses: customPoses() });
    }

    /** Overrides for the panel preview and the inspector. */
    overrides(built: BuiltScene) {
        return {
            characters: built.characters,
            useCoords: built.useCoords,
        };
    }

    /** Generates the composed scene into a new message or inline into the last message. */
    async generate(spec: SceneSpec, target: 'message' | 'inline'): Promise<PictureResult | string | null> {
        const built = this.build(spec);
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
            });
            return entry?.id ?? null;
        }
        return await this.pipeline.generatePicture({
            initiator: 'panel',
            trigger: built.prompt || 'scene',
            scene: built.prompt,
            mode: MODE.FREE,
            overrides,
        });
    }
}
