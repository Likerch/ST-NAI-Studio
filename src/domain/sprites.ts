// Expressions sprite set (TZ Phase 6, RECON §2.12, P-20): the 28 default labels of the built-in
// Expressions extension, file names it picks up without renaming (`<label>.png`), the emotion
// tags of each label and the Director emotion where one corresponds.
import type { DirectorEmotion } from './advanced';

/** Default Expressions labels in its own order (expressions/index.js:46-75). */
export const EXPRESSION_LABELS = [
    'admiration',
    'amusement',
    'anger',
    'annoyance',
    'approval',
    'caring',
    'confusion',
    'curiosity',
    'desire',
    'disappointment',
    'disapproval',
    'disgust',
    'embarrassment',
    'excitement',
    'fear',
    'gratitude',
    'grief',
    'joy',
    'love',
    'nervousness',
    'optimism',
    'pride',
    'realization',
    'relief',
    'remorse',
    'sadness',
    'surprise',
    'neutral',
] as const;

export type ExpressionLabel = (typeof EXPRESSION_LABELS)[number];

export const EXPRESSION_TAGS: Record<ExpressionLabel, string> = {
    admiration: 'admiration, sparkling eyes, smile, blush',
    amusement: 'amused, laughing, closed eyes, open mouth, smile',
    anger: 'angry, frown, clenched teeth, v-shaped eyebrows',
    annoyance: 'annoyed, frown, pout, half-closed eyes',
    approval: 'smile, closed mouth, nodding, thumbs up',
    caring: 'gentle smile, soft expression, kind eyes',
    confusion: 'confused, head tilt, raised eyebrow',
    curiosity: 'curious, head tilt, wide eyes, leaning forward',
    desire: 'longing, half-closed eyes, blush, parted lips',
    disappointment: 'disappointed, frown, looking down, sigh',
    disapproval: 'disapproving, frown, crossed arms, narrowed eyes',
    disgust: 'disgust, grimace, wrinkled nose',
    embarrassment: 'embarrassed, blush, looking away, nervous smile',
    excitement: 'excited, wide smile, sparkling eyes, open mouth',
    fear: 'scared, wide eyes, trembling, sweat',
    gratitude: 'grateful, warm smile, closed eyes, hand on own chest',
    grief: 'crying, tears, sad, closed eyes',
    joy: 'happy, smile, open mouth, closed eyes',
    love: 'in love, heart-shaped pupils, blush, smile',
    nervousness: 'nervous, sweatdrop, nervous smile',
    optimism: 'optimistic, confident smile, looking up',
    pride: 'smug, proud, hand on own hip, smile',
    realization: 'surprised, raised eyebrows, open mouth, light bulb',
    relief: 'relieved, sigh, smile, closed eyes',
    remorse: 'remorseful, sad, looking down',
    sadness: 'sad, frown, teary eyes',
    surprise: 'surprised, wide eyes, open mouth',
    neutral: 'expressionless, closed mouth',
};

/** Labels with a matching Director emotion (the rest is drawn from the emotion tags). */
export const EXPRESSION_DIRECTOR: Partial<Record<ExpressionLabel, DirectorEmotion>> = {
    amusement: 'laughing',
    anger: 'angry',
    annoyance: 'irritated',
    confusion: 'confused',
    disgust: 'disgusted',
    embarrassment: 'embarrassed',
    excitement: 'excited',
    fear: 'scared',
    grief: 'hurt',
    joy: 'happy',
    love: 'love',
    nervousness: 'nervous',
    pride: 'smug',
    remorse: 'worried',
    sadness: 'sad',
    surprise: 'surprised',
    neutral: 'neutral',
};

/** Expressions takes the label from the file name up to the first `-` or `.`. */
export function spriteFileName(label: string): string {
    return `${label.toLowerCase().replace(/[^a-z0-9_]/g, '')}.png`;
}

export function labelFromFileName(file: string): string {
    return file.toLowerCase().split(/[-.]/)[0] ?? '';
}

export const SPRITE_FRAMING = 'solo, upper body, looking at viewer, simple background';

/** Sprite prompt: appearance + emotion + framing (custom labels use the label itself as the tag). */
export function spritePrompt(appearance: string, label: string): string {
    const emotion = (EXPRESSION_TAGS as Record<string, string>)[label] ?? label.replace(/[-_]/g, ' ');
    return [appearance.trim().replace(/[\s,]+$/, ''), emotion, SPRITE_FRAMING].filter(Boolean).join(', ');
}
