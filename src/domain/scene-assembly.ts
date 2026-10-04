// Automatic scene assembly (TZ Phase 4): who is in the frame (from the message text), each
// participant's passport, pose, position and personal UC, framing and camera, pair poses, and the
// resulting base prompt + character prompts. Pure; the composer shows the result for editing.
import type { ModelCapabilities } from './capabilities';
import { joinTags, passportTags, splitTags, isFutanari } from './passport';
import type { Passport } from './passport';
import {
    CAMERA_ANGLES,
    detectPairPose,
    DISTANCES,
    findPairPose,
    findPose,
    FRAMINGS,
    optionTags,
    pairPoseTags,
} from './poses';
import type { PosePreset } from './poses';
import { placeOnCanvas } from './scene';
import type { Point } from './types';

export interface SceneCandidate {
    /** Avatar key (card) or "persona:<avatar>". */
    key: string;
    name: string;
    aliases: string[];
    passport: Passport | null;
    /** Used when there is no passport (Phase 2 character prompt or nothing). */
    fallbackPrompt: string;
    fallbackNegative: string;
    isUser: boolean;
    /** What they wear and how they are right now (a scene tracker); replaces the passport's clothing. */
    currentLook?: string;
    /** Present in the scene by another extension's scene hint (v0.10). */
    present?: boolean;
}

export interface SceneParticipant {
    key: string;
    name: string;
    enabled: boolean;
    passport: Passport | null;
    fallbackPrompt: string;
    fallbackNegative: string;
    /** Outfit override ('' = the passport's active outfit). */
    outfit: string;
    /** State ids switched on for this scene in addition to the passport. */
    states: string[];
    /** Pose preset id ('' = none) and extra pose tags. */
    pose: string;
    poseTags: string;
    position: Point;
    /** Extra undesired content for this scene. */
    negative: string;
    /** Current look from a scene tracker (see SceneCandidate.currentLook). */
    currentLook?: string;
}

export interface SceneSpec {
    /** Location, action, mood — the shared part of the prompt. */
    base: string;
    framing: string;
    camera: string;
    distance: string;
    /** Pair pose between two participants (indices in `participants`). */
    pair: { pose: string; a: number; b: number } | null;
    participants: SceneParticipant[];
    useCoords: boolean;
}

function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Earliest whole-word mention of a name or alias (Unicode letters), -1 when absent. */
export function mentionIndex(text: string, names: readonly string[]): number {
    let best = -1;
    for (const name of names) {
        const trimmed = name.trim();
        if (trimmed.length < 2) continue;
        const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(trimmed)}(?=$|[^\\p{L}\\p{N}])`, 'iu');
        const match = pattern.exec(text);
        if (match && (best < 0 || match.index < best)) best = match.index;
    }
    return best >= 0 ? best : soundMentionIndex(text, names);
}

/** Latin letters of the Russian alphabet from U+0430 (a) to U+044F (ya); U+0451 (yo) is "e". */
const RU_LATIN = [
    'a',
    'b',
    'v',
    'g',
    'd',
    'e',
    'zh',
    'z',
    'i',
    'y',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'r',
    's',
    't',
    'u',
    'f',
    'kh',
    'ts',
    'ch',
    'sh',
    'sch',
    '',
    'y',
    '',
    'e',
    'yu',
    'ya',
];

/** How a name sounds in Latin letters, loosely: "Lyra" and the Russian spelling give "lira". */
export function nameSound(word: string): string {
    let latin = '';
    for (const ch of word.toLowerCase()) {
        const code = ch.codePointAt(0) ?? 0;
        if (code >= 0x430 && code <= 0x44f) latin += RU_LATIN[code - 0x430];
        else if (code === 0x451) latin += 'e';
        else latin += ch;
    }
    return latin
        .replace(/kh/g, 'h')
        .replace(/ph/g, 'f')
        .replace(/ck/g, 'k')
        .replace(/w/g, 'v')
        .replace(/x/g, 'ks')
        .replace(/y/g, 'i')
        .replace(/[^a-z]/g, '')
        .replace(/(.)\1+/g, '$1');
}

/** Russian case endings after a final vowel (Lira, Liry, Lire, Liru, Liroi) or a consonant (Brom, Broma, Bromom). */
const AFTER_VOWEL = ['a', 'i', 'e', 'u', 'o', 'oi', 'oiu', 'ei', 'eiu'];
const AFTER_CONSONANT = ['', 'a', 'u', 'e', 'i', 'om', 'em', 'ov', 'ami', 'ah', 'am', 'oi', 'oiu', 'ei', 'eiu'];

/** Every declined form of a name, as sounds. */
function nameForms(name: string): string[] {
    const sound = nameSound(name);
    if (sound.length < 3) return [];
    if (/[aeiou]$/.test(sound)) return [sound, ...AFTER_VOWEL.map((e) => sound.slice(0, -1) + e)];
    return AFTER_CONSONANT.map((e) => sound + e);
}

/**
 * A looser sound for names spelled after their pronunciation in the other alphabet (v0.9.7): a soft
 * "c" is "s", "ch" is "sh", a silent final "e" after a consonant goes ("Florence" and its Russian
 * spelling give "florens", "Charlotte" gives "sharlot" and the Russian spelling its case form "sharlota").
 */
export function looseNameSound(word: string): string {
    return nameSound(word)
        .replace(/ch/g, 'sh')
        .replace(/c(?=[ei])/g, 's')
        .replace(/c/g, 'k')
        .replace(/(.)\1+/g, '$1')
        .replace(/(?<=..[^aeiou])e$/, '');
}

/** Case forms of the loose sound; a final "a" may also be missing in the other spelling. */
function looseForms(name: string): string[] {
    const sound = looseNameSound(name);
    if (sound.length < 4) return [];
    if (!/[aeiou]$/.test(sound)) return AFTER_CONSONANT.map((e) => sound + e);
    const stem = sound.slice(0, -1);
    return [sound, ...AFTER_VOWEL.map((e) => stem + e), ...(sound.endsWith('a') && stem.length >= 5 ? [stem] : [])];
}

/**
 * Names written in another alphabet or declined (a Latin card name in a Russian text: "Brom" in
 * the Russian "Broma", "Lyra" in "Liru"): a word whose sound is one of the name's case forms.
 * One-word names only; exact forms, so "Anna" does not catch words that merely start alike.
 */
function soundMentionIndex(text: string, names: readonly string[]): number {
    const single = names.map((n) => n.trim()).filter((n) => n && !/\s/.test(n));
    const forms = new Set(single.flatMap((n) => nameForms(n)));
    const loose = new Set(single.flatMap((n) => looseForms(n)));
    if (!forms.size && !loose.size) return -1;
    for (const match of text.matchAll(/[\p{L}]+/gu)) {
        if (forms.has(nameSound(match[0])) || loose.has(looseNameSound(match[0]))) return match.index ?? -1;
    }
    return -1;
}

/**
 * Candidates mentioned in the message, in order of first mention. When nobody is named, the
 * speaker of the message is in the frame. Capped by the model's character limit.
 */
export function detectParticipants(
    message: string,
    candidates: readonly SceneCandidate[],
    options: { speakerKey?: string; max: number },
): SceneCandidate[] {
    const mentioned = candidates
        .map((c) => ({ c, at: mentionIndex(message, [c.name, ...c.aliases]) }))
        .filter((m) => m.at >= 0)
        .sort((a, b) => a.at - b.at)
        .map((m) => m.c);
    const list = mentioned.length ? mentioned : candidates.filter((c) => c.key === options.speakerKey).slice(0, 1);
    return list.slice(0, Math.max(0, options.max));
}

/**
 * Evenly spread positions: one row of up to five, then more rows (V5 holds up to 32).
 * Locked positions are kept; grid models snap to the 5x5 grid.
 */
export function autoLayout(
    count: number,
    caps: Pick<ModelCapabilities, 'positioning'>,
    locked: readonly (Point | null)[] = [],
): Point[] {
    const perRow = Math.min(5, Math.max(1, count));
    const rows = Math.ceil(count / perRow);
    const result: Point[] = [];
    for (let i = 0; i < count; i++) {
        const fixed = locked[i];
        if (fixed) {
            result.push(placeOnCanvas(fixed, caps));
            continue;
        }
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, count - row * perRow);
        const col = i % perRow;
        const x = (col + 1) / (inRow + 1);
        const y = rows === 1 ? 0.5 : (row + 1) / (rows + 1);
        result.push(placeOnCanvas({ x, y }, caps));
    }
    return result;
}

export function participantFrom(
    candidate: SceneCandidate,
    position: Point,
    pose?: PosePreset | null,
): SceneParticipant {
    return {
        key: candidate.key,
        name: candidate.name,
        enabled: true,
        passport: candidate.passport,
        fallbackPrompt: candidate.fallbackPrompt,
        fallbackNegative: candidate.fallbackNegative,
        outfit: '',
        states: [],
        ...(candidate.currentLook ? { currentLook: candidate.currentLook } : {}),
        pose: pose?.id ?? candidate.passport?.pose.preset ?? '',
        poseTags: candidate.passport?.pose.custom ?? '',
        position,
        negative: '',
    };
}

type Gender = 'girl' | 'boy' | 'other';

function genderOf(tags: string): Gender | null {
    const list = splitTags(tags).map((t) => t.toLowerCase());
    if (list.some((t) => /^(1)?girl$|^woman$|^female$/.test(t))) return 'girl';
    if (list.some((t) => /^(1)?boy$|^man$|^male$/.test(t))) return 'boy';
    if (list.some((t) => /^(1)?other$/.test(t))) return 'other';
    return null;
}

/** Count tags for the base prompt ("2girls, 1boy"), from each participant's base tags. */
export function countTags(tagsPerParticipant: readonly string[]): string {
    const counts: Record<Gender, number> = { girl: 0, boy: 0, other: 0 };
    let known = 0;
    for (const tags of tagsPerParticipant) {
        const gender = genderOf(tags);
        if (gender) {
            counts[gender]++;
            known++;
        }
    }
    if (!known) return '';
    const parts: string[] = [];
    if (counts.girl) parts.push(counts.girl === 1 ? '1girl' : `${Math.min(counts.girl, 6)}girls`);
    if (counts.boy) parts.push(counts.boy === 1 ? '1boy' : `${Math.min(counts.boy, 6)}boys`);
    if (counts.other) parts.push(counts.other === 1 ? '1other' : `${Math.min(counts.other, 6)}others`);
    return parts.join(', ');
}

/**
 * "futa with female / male / futa" for an explicit scene with a futanari (NSFW layer on) and a
 * partner: the composition tag of Danbooru, by the partner's base tags.
 */
function futaPairing(participants: readonly SceneParticipant[]): string {
    const futa = (p: SceneParticipant) => Boolean(p.passport && p.passport.nsfw.enabled && isFutanari(p.passport));
    const futas = participants.filter(futa);
    if (!futas.length || participants.length < 2) return '';
    const tags = new Set<string>();
    for (const other of participants) {
        if (futas.length === 1 && other === futas[0]) continue;
        if (futa(other) && futas.length > 1) tags.add('futa with futa');
        else if (!futa(other)) {
            const gender = genderOf(other.passport ? other.passport.slots.base : other.fallbackPrompt);
            if (gender === 'girl') tags.add('futa with female');
            else if (gender === 'boy') tags.add('futa with male');
        }
    }
    return [...tags].join(', ');
}

export interface BuiltScene {
    /** Base prompt (count tags, scene, framing). */
    prompt: string;
    characters: { prompt: string; negative: string; x: number; y: number; enabled: boolean }[];
    useCoords: boolean;
    /** Names of participants without a passport (shown in the composer, generation still works). */
    withoutPassport: string[];
    /** Participants beyond the model's limit (dropped). */
    dropped: string[];
    /** Ids of the passports drawn (v0.10, reported to other extensions with the image). */
    passportIds: string[];
}

/** Turns the composer state into the base prompt and character slots for the request. */
export function buildScene(
    spec: SceneSpec,
    caps: Pick<ModelCapabilities, 'maxCharacters' | 'positioning' | 'canPositionSingleCharacter' | 'v4Prompt'>,
    options: {
        allowNsfw: boolean;
        customPoses?: readonly PosePreset[];
        /** Count tags ("1girl, 1boy") in the base prompt; off when others may be in the picture too. */
        counts?: boolean;
    },
): BuiltScene {
    const active = spec.participants.filter((p) => p.enabled);
    const capacity = caps.maxCharacters;
    const kept = capacity > 0 ? active.slice(0, capacity) : active;
    const dropped = capacity > 0 ? active.slice(capacity).map((p) => p.name) : [];
    const passportIds = [...new Set(kept.flatMap((p) => (p.passport ? [p.passport.id] : [])))];
    const pair = spec.pair ? findPairPose(spec.pair.pose) : undefined;
    const pairTags = pair ? pairPoseTags(pair, caps.v4Prompt && capacity > 0) : null;

    const characterTags = kept.map((p) => {
        // A current look (scene tracker) replaces the clothing of the passport, unless an outfit is chosen.
        const look = p.outfit ? '' : (p.currentLook ?? '');
        // A futanari shows a bulge under clothes in ordinary scenes; explicit ones get the NSFW layer.
        const bulge = p.passport && !options.allowNsfw && isFutanari(p.passport) ? 'bulge' : '';
        const identity = p.passport
            ? joinTags(
                  passportTags(p.passport, {
                      outfit: p.outfit || undefined,
                      states: p.states,
                      allowNsfw: options.allowNsfw,
                      withoutClothing: Boolean(look),
                  }),
                  look,
                  bulge,
              )
            : joinTags(p.fallbackPrompt, look);
        const pose = p.pose ? (findPose(p.pose, options.customPoses)?.tags ?? '') : '';
        const index = spec.participants.indexOf(p);
        const pairTag =
            pairTags && spec.pair
                ? index === spec.pair.a
                    ? pairTags[0]
                    : index === spec.pair.b
                      ? pairTags[1]
                      : ''
                : '';
        return {
            p,
            prompt: joinTags(identity, pose, p.poseTags, pairTag),
            negative: joinTags(p.passport?.negative ?? p.fallbackNegative, p.negative),
        };
    });

    const counts =
        options.counts === false
            ? ''
            : countTags(kept.map((p) => (p.passport ? p.passport.slots.base : p.fallbackPrompt)));
    const pairing = options.allowNsfw ? futaPairing(kept) : '';
    const framing = joinTags(
        optionTags(FRAMINGS, spec.framing),
        optionTags(CAMERA_ANGLES, spec.camera),
        optionTags(DISTANCES, spec.distance),
    );

    if (capacity === 0) {
        // V3: no character prompts; everything goes into one prompt.
        return {
            prompt: joinTags(counts, pairing, spec.base, ...characterTags.map((c) => c.prompt), framing),
            characters: [],
            useCoords: false,
            withoutPassport: kept.filter((p) => !p.passport).map((p) => p.name),
            dropped,
            passportIds,
        };
    }

    const canPosition =
        caps.positioning !== 'none' && (kept.length > 1 || caps.canPositionSingleCharacter) && spec.useCoords;
    return {
        prompt: joinTags(counts, pairing, spec.base, framing),
        characters: characterTags.map(({ p, prompt, negative }) => {
            const point = placeOnCanvas(p.position, caps);
            return { prompt, negative, x: point.x, y: point.y, enabled: true };
        }),
        useCoords: canPosition,
        withoutPassport: kept.filter((p) => !p.passport).map((p) => p.name),
        dropped,
        passportIds,
    };
}

/** Sentences of a message (split after . ! ? … and at line breaks). */
export function sentences(text: string): string[] {
    return text
        .split(/(?<=[.!?…])\s+|\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Pair pose from the text: the sentence with the action decides the participants — the first
 * one named there is the source ("Seraphina hugs Lyra": Seraphina hugs), the second the target.
 */
export function detectPairInText(
    text: string,
    participants: readonly { name: string; aliases?: string[] }[],
): { pose: string; a: number; b: number } | null {
    if (participants.length < 2) return null;
    for (const sentence of sentences(text)) {
        const pose = detectPairPose(sentence);
        if (!pose) continue;
        const named = participants
            .map((p, i) => ({ i, at: mentionIndex(sentence, [p.name, ...(p.aliases ?? [])]) }))
            .filter((m) => m.at >= 0)
            .sort((x, y) => x.at - y.at);
        const [first, second] = named;
        if (first && second) return { pose: pose.id, a: first.i, b: second.i };
        if (first && participants.length === 2) return { pose: pose.id, a: first.i, b: first.i === 0 ? 1 : 0 };
    }
    const pose = detectPairPose(text);
    return pose ? { pose: pose.id, a: 0, b: 1 } : null;
}

/** Applies a pair pose's canvas layout to its two participants. */
export function applyPairLayout(spec: SceneSpec, caps: Pick<ModelCapabilities, 'positioning'>): SceneSpec {
    if (!spec.pair) return spec;
    const pose = findPairPose(spec.pair.pose);
    const a = spec.participants[spec.pair.a];
    const b = spec.participants[spec.pair.b];
    if (!pose || !a || !b) return spec;
    a.position = placeOnCanvas(pose.layout[0], caps);
    b.position = placeOnCanvas(pose.layout[1], caps);
    resolveOverlaps(spec, caps, new Set([spec.pair.a, spec.pair.b]));
    return spec;
}

const pointKey = (p: Point) => `${p.x},${p.y}`;

/**
 * Moves participants that share a spot with an earlier (or fixed) one to the nearest free spot:
 * a 5x5 grid cell, or the same cells used as a free-positioning raster on V5.
 */
export function resolveOverlaps(
    spec: SceneSpec,
    caps: Pick<ModelCapabilities, 'positioning'>,
    fixed: ReadonlySet<number> = new Set(),
): SceneSpec {
    const cells: Point[] = [];
    for (const y of [0.1, 0.3, 0.5, 0.7, 0.9])
        for (const x of [0.1, 0.3, 0.5, 0.7, 0.9]) cells.push(placeOnCanvas({ x, y }, caps));
    const occupied = new Set<string>();
    spec.participants.forEach((p, i) => {
        if (fixed.has(i) && p.enabled) occupied.add(pointKey(p.position));
    });
    spec.participants.forEach((p, i) => {
        if (fixed.has(i) || !p.enabled) return;
        if (!occupied.has(pointKey(p.position))) {
            occupied.add(pointKey(p.position));
            return;
        }
        const from = p.position;
        const free = cells
            .filter((cell) => !occupied.has(pointKey(cell)))
            .sort(
                (x, y) => Math.hypot(x.x - from.x, (x.y - from.y) * 2) - Math.hypot(y.x - from.x, (y.y - from.y) * 2),
            )[0];
        if (free) {
            p.position = free;
            occupied.add(pointKey(free));
        }
    });
    return spec;
}
