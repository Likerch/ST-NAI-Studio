// Prompt / undesired-content assembly exactly as the NovelAI web client does it (RECON §3.5, §3.7).
import type { ModelCapabilities } from './capabilities';
import { getQualityText, getUcPresetText } from './presets';
import type { DatasetPrefix, QualityPresetId, UcPresetId } from './types';

const JOINER = ', ';
const SEGMENT_SEPARATOR = '|';
/** Start of an in-image text block (bundle:_app module 46278, regex `c`). */
const TEXT_BLOCK = /(?:^|\s|[,.:[\]{}、。])text:(?!:)/i;
const TRANSPARENT_SUFFIX = 'transparent background';

function joinSuffix(text: string, suffix: string): string {
    if (!suffix) {
        return text;
    }
    return text ? `${text}${JOINER}${suffix}` : suffix;
}

/** Appends quality tags to the first `|` segment; on text-capable models, before any `text:` block. */
export function applyQualityTags(
    prompt: string,
    caps: Pick<ModelCapabilities, 'model' | 'v4Prompt' | 'textInImage' | 'transparency'>,
    preset: QualityPresetId,
    transparentBackground: boolean,
): string {
    let suffix = getQualityText(caps.model, preset);
    if (transparentBackground && caps.transparency) {
        suffix = suffix ? `${TRANSPARENT_SUFFIX}${JOINER}${suffix}` : TRANSPARENT_SUFFIX;
    }
    if (!suffix) {
        return prompt;
    }
    if (!caps.v4Prompt) {
        return joinSuffix(prompt, suffix);
    }
    const [first = '', ...rest] = prompt.split(SEGMENT_SEPARATOR);
    let head: string;
    if (caps.textInImage) {
        const match = first.match(TEXT_BLOCK);
        const parts = first.split(TEXT_BLOCK);
        head = match
            ? [joinSuffix(parts[0] ?? '', suffix), ...parts.slice(1)].join(match[0])
            : joinSuffix(first, suffix);
    } else {
        head = joinSuffix(first, suffix);
    }
    return [head, ...rest].join(SEGMENT_SEPARATOR);
}

/** Prepends the UC preset; non-curated models also get `nsfw, ` unless the prompt mentions nsfw. */
export function applyUcPreset(
    negative: string,
    caps: Pick<ModelCapabilities, 'model' | 'v4Prompt' | 'curated'>,
    preset: UcPresetId,
    prompt: string,
): string {
    const presetText = getUcPresetText(caps.model, preset);
    const addNsfw = !caps.curated && preset !== 'none' && presetText !== '' && !prompt.toLowerCase().includes('nsfw');
    if (caps.v4Prompt) {
        const segments = negative.split(SEGMENT_SEPARATOR).map((segment, index) => {
            if (index !== 0 || presetText === '') {
                return segment;
            }
            return segment === '' ? presetText : `${presetText}${JOINER}${segment}`;
        });
        const joined = segments.join(SEGMENT_SEPARATOR);
        return addNsfw ? `nsfw${JOINER}${joined}` : joined;
    }
    const presetPart = preset === 'none' ? '' : presetText;
    let result = negative ? (presetPart ? `${presetPart}${JOINER}${negative}` : negative) : presetText;
    if (addNsfw) {
        result = result === '' ? 'nsfw' : `nsfw${JOINER}${result}`;
    }
    return result;
}

const DATASET_TEXT: Record<Exclude<DatasetPrefix, 'none'>, string> = {
    fur: 'fur dataset',
    background: 'background dataset',
};

/** Furry/background dataset mode of V4+ models is a prompt prefix, not an API field. */
export function applyDatasetPrefix(
    prompt: string,
    caps: Pick<ModelCapabilities, 'furryMode'>,
    dataset: DatasetPrefix,
): string {
    if (dataset === 'none' || !caps.furryMode) {
        return prompt;
    }
    const lower = prompt.trimStart().toLowerCase();
    if (lower.startsWith('fur dataset') || lower.startsWith('background dataset')) {
        return prompt;
    }
    return `${DATASET_TEXT[dataset]}${JOINER}${prompt}`;
}

/** The web client rewrites the first `1girl` / `1boy` of every character prompt (bundle:5285@524931). */
export function normalizeCharacterPrompt(prompt: string): string {
    return prompt.replace(/1girl/, 'girl').replace(/1boy/, 'boy');
}
