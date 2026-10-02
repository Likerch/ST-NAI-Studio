// Pose library, framing, camera angle, distance and pair poses (TZ Phase 4). Names are localized
// as naist.pose.<id> etc.; tags are Danbooru-style English. Keywords (en/ru) let the scene
// assembler guess a pose from the message text. Pair poses use NovelAI V4 interaction prefixes
// (source# / target# / mutual#) in character prompts and fall back to plain tags without them.
import keywordData from '../data/pose-keywords.json';
import type { Point } from './types';

/** Non-English keywords live in a data file (source files stay free of non-ASCII UI text). */
const EXTRA_KEYWORDS = keywordData as { poses: Record<string, string[]>; pairs: Record<string, string[]> };

export const POSE_CATEGORIES = ['standing', 'sitting', 'lying', 'kneeling', 'back', 'gaze', 'arms', 'action'] as const;
export type PoseCategory = (typeof POSE_CATEGORIES)[number];

export interface PosePreset {
    id: string;
    category: PoseCategory;
    tags: string;
    /** Lower-case words or phrases (English and Russian) that suggest this pose. */
    keywords: string[];
}

const BASE_POSES: readonly PosePreset[] = [
    { id: 'standing', category: 'standing', tags: 'standing', keywords: ['stands', 'standing'] },
    { id: 'contrapposto', category: 'standing', tags: 'standing, contrapposto', keywords: [] },
    {
        id: 'hands_on_hips',
        category: 'standing',
        tags: 'standing, hands on hips',
        keywords: ['hands on her hips', 'hands on his hips'],
    },
    {
        id: 'leaning_wall',
        category: 'standing',
        tags: 'standing, against wall, leaning back',
        keywords: ['leans against'],
    },
    { id: 'walking', category: 'standing', tags: 'walking', keywords: ['walks', 'walking'] },
    {
        id: 'sitting',
        category: 'sitting',
        tags: 'sitting',
        keywords: ['sits', 'sitting', 'sat down'],
    },
    {
        id: 'sitting_chair',
        category: 'sitting',
        tags: 'sitting, on chair',
        keywords: ['on a chair', 'in a chair'],
    },
    { id: 'sitting_floor', category: 'sitting', tags: 'sitting, on floor', keywords: ['on the floor'] },
    {
        id: 'crossed_legs',
        category: 'sitting',
        tags: 'sitting, crossed legs',
        keywords: ['crosses her legs', 'crossed legs'],
    },
    { id: 'seiza', category: 'sitting', tags: 'seiza', keywords: ['seiza'] },
    {
        id: 'squatting',
        category: 'sitting',
        tags: 'squatting',
        keywords: ['squats', 'squatting'],
    },
    { id: 'lying', category: 'lying', tags: 'lying', keywords: ['lies', 'lying'] },
    { id: 'on_back', category: 'lying', tags: 'lying, on back', keywords: ['on her back', 'on his back'] },
    {
        id: 'on_stomach',
        category: 'lying',
        tags: 'lying, on stomach',
        keywords: ['on her stomach', 'on his stomach'],
    },
    { id: 'on_side', category: 'lying', tags: 'lying, on side', keywords: ['on her side', 'on his side'] },
    {
        id: 'sleeping',
        category: 'lying',
        tags: 'sleeping, closed eyes',
        keywords: ['sleeps', 'asleep', 'sleeping'],
    },
    { id: 'kneeling', category: 'kneeling', tags: 'kneeling', keywords: ['kneels', 'kneeling'] },
    { id: 'on_one_knee', category: 'kneeling', tags: 'on one knee', keywords: ['one knee'] },
    {
        id: 'from_behind',
        category: 'back',
        tags: 'from behind',
        keywords: ['turns away', 'turned away'],
    },
    {
        id: 'looking_back',
        category: 'back',
        tags: 'from behind, looking back',
        keywords: ['looks back', 'over her shoulder', 'over his shoulder'],
    },
    {
        id: 'looking_at_viewer',
        category: 'gaze',
        tags: 'looking at viewer',
        keywords: ['looks at you', 'looking at you'],
    },
    {
        id: 'looking_away',
        category: 'gaze',
        tags: 'looking away',
        keywords: ['looks away'],
    },
    {
        id: 'looking_up',
        category: 'gaze',
        tags: 'looking up',
        keywords: ['looks up'],
    },
    {
        id: 'looking_down',
        category: 'gaze',
        tags: 'looking down',
        keywords: ['looks down'],
    },
    {
        id: 'crossed_arms',
        category: 'arms',
        tags: 'crossed arms',
        keywords: ['crosses her arms', 'crosses his arms', 'arms crossed'],
    },
    {
        id: 'arms_up',
        category: 'arms',
        tags: 'arms up',
        keywords: ['raises her arms', 'raises his arms'],
    },
    {
        id: 'arms_behind_back',
        category: 'arms',
        tags: 'arms behind back',
        keywords: ['hands behind her back'],
    },
    {
        id: 'hand_on_chin',
        category: 'arms',
        tags: 'hand on own chin',
        keywords: ['hand on her chin'],
    },
    { id: 'waving', category: 'arms', tags: 'waving', keywords: ['waves', 'waving'] },
    { id: 'peace_sign', category: 'arms', tags: 'v', keywords: ['peace sign'] },
    { id: 'running', category: 'action', tags: 'running', keywords: ['runs', 'running'] },
    { id: 'jumping', category: 'action', tags: 'jumping', keywords: ['jumps', 'jumping'] },
    {
        id: 'leaning_forward',
        category: 'action',
        tags: 'leaning forward',
        keywords: ['leans forward', 'leans closer'],
    },
    { id: 'stretching', category: 'action', tags: 'stretching', keywords: ['stretches'] },
    { id: 'reading', category: 'action', tags: 'reading, holding book', keywords: ['reads', 'reading'] },
    { id: 'eating', category: 'action', tags: 'eating', keywords: ['eats', 'eating'] },
    {
        id: 'drinking',
        category: 'action',
        tags: 'drinking, holding cup',
        keywords: ['drinks', 'sips'],
    },
    {
        id: 'fighting_stance',
        category: 'action',
        tags: 'fighting stance',
        keywords: ['fighting stance'],
    },
];

export const POSES: readonly PosePreset[] = BASE_POSES.map((pose) => ({
    ...pose,
    keywords: [...pose.keywords, ...(EXTRA_KEYWORDS.poses[pose.id] ?? [])],
}));

export interface FramingOption {
    id: string;
    tags: string;
}

export const FRAMINGS: readonly FramingOption[] = [
    { id: 'auto', tags: '' },
    { id: 'portrait', tags: 'portrait' },
    { id: 'upper_body', tags: 'upper body' },
    { id: 'cowboy_shot', tags: 'cowboy shot' },
    { id: 'full_body', tags: 'full body' },
];

export const CAMERA_ANGLES: readonly FramingOption[] = [
    { id: 'auto', tags: '' },
    { id: 'from_above', tags: 'from above' },
    { id: 'from_below', tags: 'from below' },
    { id: 'from_side', tags: 'from side' },
    { id: 'straight_on', tags: 'straight-on' },
    { id: 'dutch_angle', tags: 'dutch angle' },
    { id: 'pov', tags: 'pov' },
];

export const DISTANCES: readonly FramingOption[] = [
    { id: 'auto', tags: '' },
    { id: 'close_up', tags: 'close-up' },
    { id: 'wide_shot', tags: 'wide shot' },
    { id: 'very_wide_shot', tags: 'very wide shot' },
];

export interface PairPose {
    id: string;
    /** Tag of the action; roles get source#/target#/mutual# + tag. */
    tag: string;
    kind: 'directed' | 'mutual';
    /** Canvas positions of the first and the second participant. */
    layout: [Point, Point];
    keywords: string[];
}

const BASE_PAIR_POSES: readonly PairPose[] = [
    {
        id: 'hug',
        tag: 'hug',
        kind: 'directed',
        layout: [
            { x: 0.4, y: 0.5 },
            { x: 0.6, y: 0.5 },
        ],
        keywords: ['hugs', 'embraces'],
    },
    {
        id: 'hug_from_behind',
        tag: 'hug from behind',
        kind: 'directed',
        layout: [
            { x: 0.5, y: 0.5 },
            { x: 0.5, y: 0.5 },
        ],
        keywords: ['hugs her from behind', 'hugs him from behind'],
    },
    {
        id: 'holding_hands',
        tag: 'holding hands',
        kind: 'mutual',
        layout: [
            { x: 0.3, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ],
        keywords: ['holding hands', 'takes her hand', 'takes his hand'],
    },
    {
        id: 'back_to_back',
        tag: 'back-to-back',
        kind: 'mutual',
        layout: [
            { x: 0.3, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ],
        keywords: ['back to back'],
    },
    {
        id: 'princess_carry',
        tag: 'princess carry',
        kind: 'directed',
        layout: [
            { x: 0.5, y: 0.5 },
            { x: 0.5, y: 0.3 },
        ],
        keywords: ['carries her', 'on his arms'],
    },
    {
        id: 'piggyback',
        tag: 'piggyback',
        kind: 'directed',
        layout: [
            { x: 0.5, y: 0.7 },
            { x: 0.5, y: 0.3 },
        ],
        keywords: ['piggyback'],
    },
    {
        id: 'headpat',
        tag: 'headpat',
        kind: 'directed',
        layout: [
            { x: 0.3, y: 0.3 },
            { x: 0.7, y: 0.5 },
        ],
        keywords: ['pats her head', 'pats his head'],
    },
    {
        id: 'high_five',
        tag: 'high five',
        kind: 'mutual',
        layout: [
            { x: 0.3, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ],
        keywords: ['high five'],
    },
    {
        id: 'face_to_face',
        tag: 'face-to-face',
        kind: 'mutual',
        layout: [
            { x: 0.3, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ],
        keywords: ['face to face'],
    },
    {
        id: 'eye_contact',
        tag: 'eye contact',
        kind: 'mutual',
        layout: [
            { x: 0.3, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ],
        keywords: ['eyes meet'],
    },
    {
        id: 'sitting_on_lap',
        tag: 'sitting on lap',
        kind: 'directed',
        layout: [
            { x: 0.5, y: 0.3 },
            { x: 0.5, y: 0.7 },
        ],
        keywords: ['on his lap', 'on her lap'],
    },
    {
        id: 'dancing',
        tag: 'dancing',
        kind: 'mutual',
        layout: [
            { x: 0.4, y: 0.5 },
            { x: 0.6, y: 0.5 },
        ],
        keywords: ['dance together', 'dancing with'],
    },
    {
        id: 'fighting',
        tag: 'fighting',
        kind: 'mutual',
        layout: [
            { x: 0.3, y: 0.5 },
            { x: 0.7, y: 0.5 },
        ],
        keywords: ['fight each other'],
    },
];

export const PAIR_POSES: readonly PairPose[] = BASE_PAIR_POSES.map((pose) => ({
    ...pose,
    keywords: [...pose.keywords, ...(EXTRA_KEYWORDS.pairs[pose.id] ?? [])],
}));

export function findPose(id: string, custom: readonly PosePreset[] = []): PosePreset | undefined {
    return custom.find((p) => p.id === id) ?? POSES.find((p) => p.id === id);
}

export function findPairPose(id: string): PairPose | undefined {
    return PAIR_POSES.find((p) => p.id === id);
}

function containsKeyword(text: string, keywords: readonly string[]): number {
    const lower = ` ${text.toLowerCase()} `;
    let best = -1;
    for (const keyword of keywords) {
        const index = lower.indexOf(keyword.toLowerCase());
        if (index >= 0 && (best < 0 || index < best)) best = index;
    }
    return best;
}

/** First pose whose keyword appears in the text (earliest mention wins). */
export function detectPose(text: string, library: readonly PosePreset[] = POSES): PosePreset | null {
    let found: PosePreset | null = null;
    let at = Number.POSITIVE_INFINITY;
    for (const pose of library) {
        const index = containsKeyword(text, pose.keywords);
        if (index >= 0 && index < at) {
            at = index;
            found = pose;
        }
    }
    return found;
}

export function detectPairPose(text: string): PairPose | null {
    let found: PairPose | null = null;
    let at = Number.POSITIVE_INFINITY;
    for (const pose of PAIR_POSES) {
        const index = containsKeyword(text, pose.keywords);
        if (index >= 0 && index < at) {
            at = index;
            found = pose;
        }
    }
    return found;
}

/**
 * Per-participant tags of a pair pose. With interaction support (V4+ character prompts) the first
 * participant is the source, the second the target; otherwise both get the plain tag.
 */
export function pairPoseTags(pose: PairPose, interactions: boolean): [string, string] {
    if (!interactions) return [pose.tag, pose.tag];
    if (pose.kind === 'mutual') return [`mutual#${pose.tag}`, `mutual#${pose.tag}`];
    return [`source#${pose.tag}`, `target#${pose.tag}`];
}

export function optionTags(options: readonly FramingOption[], id: string): string {
    return options.find((o) => o.id === id)?.tags ?? '';
}

/** Library search for the composer (localized names are matched by the UI). */
export function posesByCategory(library: readonly PosePreset[]): Map<PoseCategory, PosePreset[]> {
    const map = new Map<PoseCategory, PosePreset[]>();
    for (const category of POSE_CATEGORIES) map.set(category, []);
    for (const pose of library) map.get(pose.category)?.push(pose);
    return map;
}
