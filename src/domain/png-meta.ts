// NovelAI image metadata (TZ Phase 3, RECON §3.2): PNG tEXt/iTXt chunks (Title, Description,
// Software, Source, Comment = JSON of the applied parameters) and WebP EXIF UserComment (JSON with
// the same keys). Pure byte handling; compressed chunks are returned for the caller to inflate.
import { getCapabilities } from './capabilities';
import { isModelId } from './models';
import type { ModelId } from './models';
import { getQualityText, getUcPresetText } from './presets';
import type { QualityPresetId, UcPresetId } from './types';

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const TEXT_CHUNKS = new Set(['tEXt', 'iTXt', 'zTXt']);
const METADATA_CHUNKS = new Set(['tEXt', 'iTXt', 'zTXt', 'eXIf', 'tIME']);

let crcTable: Uint32Array | null = null;

export function crc32(bytes: Uint8Array): number {
    if (!crcTable) {
        crcTable = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            crcTable[n] = c >>> 0;
        }
    }
    let crc = 0xffffffff;
    for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

export function isPng(bytes: Uint8Array): boolean {
    return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}

export function isWebp(bytes: Uint8Array): boolean {
    return ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP';
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
    let out = '';
    for (let i = start; i < start + length && i < bytes.length; i++) out += String.fromCharCode(bytes[i] ?? 0);
    return out;
}

function u32be(bytes: Uint8Array, at: number): number {
    return (
        (((bytes[at] ?? 0) << 24) |
            ((bytes[at + 1] ?? 0) << 16) |
            ((bytes[at + 2] ?? 0) << 8) |
            (bytes[at + 3] ?? 0)) >>>
        0
    );
}

export interface PngChunk {
    type: string;
    data: Uint8Array;
}

export function readPngChunks(bytes: Uint8Array): PngChunk[] {
    if (!isPng(bytes)) throw new Error('not a PNG');
    const chunks: PngChunk[] = [];
    let at = 8;
    while (at + 12 <= bytes.length) {
        const length = u32be(bytes, at);
        const type = ascii(bytes, at + 4, 4);
        const end = at + 12 + length;
        if (end > bytes.length) break;
        chunks.push({ type, data: bytes.subarray(at + 8, at + 8 + length) });
        at = end;
        if (type === 'IEND') break;
    }
    return chunks;
}

export function writePngChunks(chunks: readonly PngChunk[]): Uint8Array {
    const total = 8 + chunks.reduce((sum, c) => sum + 12 + c.data.length, 0);
    const out = new Uint8Array(total);
    out.set(PNG_SIGNATURE, 0);
    let at = 8;
    for (const chunk of chunks) {
        const view = new DataView(out.buffer, out.byteOffset + at);
        view.setUint32(0, chunk.data.length);
        const typeAndData = new Uint8Array(4 + chunk.data.length);
        for (let i = 0; i < 4; i++) typeAndData[i] = chunk.type.charCodeAt(i);
        typeAndData.set(chunk.data, 4);
        out.set(typeAndData, at + 4);
        view.setUint32(8 + chunk.data.length, crc32(typeAndData));
        at += 12 + chunk.data.length;
    }
    return out;
}

const utf8 = new TextDecoder('utf-8', { fatal: true });
const latin1 = new TextDecoder('latin1');
const encoder = new TextEncoder();

function decodeText(bytes: Uint8Array): string {
    try {
        return utf8.decode(bytes);
    } catch {
        return latin1.decode(bytes);
    }
}

export interface CompressedText {
    keyword: string;
    /** zlib stream (zTXt or compressed iTXt). */
    data: Uint8Array;
}

export interface PngText {
    text: Record<string, string>;
    compressed: CompressedText[];
}

/** tEXt and uncompressed iTXt are decoded; compressed entries are returned for async inflating. */
export function readPngText(bytes: Uint8Array): PngText {
    const text: Record<string, string> = {};
    const compressed: CompressedText[] = [];
    for (const chunk of readPngChunks(bytes)) {
        if (!TEXT_CHUNKS.has(chunk.type)) continue;
        const zero = chunk.data.indexOf(0);
        if (zero <= 0) continue;
        const keyword = latin1.decode(chunk.data.subarray(0, zero));
        if (chunk.type === 'tEXt') {
            text[keyword] = decodeText(chunk.data.subarray(zero + 1));
        } else if (chunk.type === 'zTXt') {
            compressed.push({ keyword, data: chunk.data.subarray(zero + 2) });
        } else {
            const flag = chunk.data[zero + 1];
            let at = zero + 3;
            const langEnd = chunk.data.indexOf(0, at);
            if (langEnd < 0) continue;
            const translatedEnd = chunk.data.indexOf(0, langEnd + 1);
            if (translatedEnd < 0) continue;
            at = translatedEnd + 1;
            if (flag === 1) compressed.push({ keyword, data: chunk.data.subarray(at) });
            else text[keyword] = decodeText(chunk.data.subarray(at));
        }
    }
    return { text, compressed };
}

function isLatin1(value: string): boolean {
    for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) > 0xff) return false;
    return true;
}

function textChunk(keyword: string, value: string): PngChunk {
    const key = Array.from(keyword, (ch) => ch.charCodeAt(0) & 0xff);
    if (isLatin1(value)) {
        const data = new Uint8Array(key.length + 1 + value.length);
        data.set(key, 0);
        for (let i = 0; i < value.length; i++) data[key.length + 1 + i] = value.charCodeAt(i);
        return { type: 'tEXt', data };
    }
    // iTXt: keyword \0 compression-flag compression-method language \0 translated \0 text (UTF-8)
    const body = encoder.encode(value);
    const data = new Uint8Array(key.length + 5 + body.length);
    data.set(key, 0);
    data.set(body, key.length + 5);
    return { type: 'iTXt', data };
}

/** Replaces (or adds) text chunks before IEND; other chunks stay byte-identical. */
export function writePngText(bytes: Uint8Array, entries: Record<string, string>): Uint8Array {
    const keywords = new Set(Object.keys(entries));
    const chunks = readPngChunks(bytes).filter((chunk) => {
        if (!TEXT_CHUNKS.has(chunk.type)) return true;
        const zero = chunk.data.indexOf(0);
        return !keywords.has(latin1.decode(chunk.data.subarray(0, Math.max(0, zero))));
    });
    const iend = chunks.findIndex((c) => c.type === 'IEND');
    const added = Object.entries(entries).map(([k, v]) => textChunk(k, v));
    chunks.splice(iend < 0 ? chunks.length : iend, 0, ...added);
    return writePngChunks(chunks);
}

/** Drops every metadata chunk (text, EXIF, time). Pixel data is untouched. */
export function stripPngMetadata(bytes: Uint8Array): Uint8Array {
    return writePngChunks(readPngChunks(bytes).filter((c) => !METADATA_CHUNKS.has(c.type)));
}

// ---- WebP (RIFF) EXIF ----------------------------------------------------------------------

function exifPayload(bytes: Uint8Array): Uint8Array | null {
    if (!isWebp(bytes)) return null;
    let at = 12;
    while (at + 8 <= bytes.length) {
        const fourcc = ascii(bytes, at, 4);
        const size = new DataView(bytes.buffer, bytes.byteOffset + at + 4, 4).getUint32(0, true);
        if (fourcc === 'EXIF') {
            const data = bytes.subarray(at + 8, at + 8 + size);
            return ascii(data, 0, 6) === 'Exif\0\0' ? data.subarray(6) : data;
        }
        at += 8 + size + (size % 2);
    }
    return null;
}

/** Reads EXIF UserComment (0x9286) from a TIFF block; falls back to the first JSON object. */
export function readExifUserComment(tiff: Uint8Array): string | null {
    const order = ascii(tiff, 0, 2);
    if (order !== 'II' && order !== 'MM') return null;
    const little = order === 'II';
    const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
    const u16 = (at: number) => view.getUint16(at, little);
    const u32 = (at: number) => view.getUint32(at, little);
    const entries = (ifd: number) => {
        if (ifd + 2 > tiff.length) return [];
        const count = u16(ifd);
        const list: { tag: number; type: number; count: number; valueAt: number }[] = [];
        for (let i = 0; i < count; i++) {
            const at = ifd + 2 + i * 12;
            if (at + 12 > tiff.length) break;
            const typeSize = [0, 1, 1, 2, 4, 8, 1, 1, 2, 4, 8, 4, 8][u16(at + 2)] ?? 1;
            const n = u32(at + 4);
            list.push({ tag: u16(at), type: u16(at + 2), count: n, valueAt: n * typeSize > 4 ? u32(at + 8) : at + 8 });
        }
        return list;
    };
    try {
        const ifd0 = entries(u32(4));
        const exifPointer = ifd0.find((e) => e.tag === 0x8769);
        const candidates = exifPointer ? [...entries(u32(exifPointer.valueAt)), ...ifd0] : ifd0;
        const comment = candidates.find((e) => e.tag === 0x9286) ?? candidates.find((e) => e.tag === 0x010e);
        if (comment) {
            const raw = tiff.subarray(comment.valueAt, comment.valueAt + comment.count);
            const header = ascii(raw, 0, 8);
            if (comment.tag === 0x9286 && header.startsWith('UNICODE')) {
                return new TextDecoder(little ? 'utf-16le' : 'utf-16be').decode(raw.subarray(8)).replace(/\0+$/, '');
            }
            const body = comment.tag === 0x9286 && /^(ASCII|JIS|\0)/.test(header) ? raw.subarray(8) : raw;
            return decodeText(body).replace(/\0+$/, '');
        }
    } catch {
        // fall through to the raw search
    }
    const text = latin1.decode(tiff);
    const start = text.indexOf('{"');
    const end = text.lastIndexOf('}');
    return start >= 0 && end > start ? decodeText(tiff.subarray(start, end + 1)) : null;
}

/**
 * NovelAI WebP metadata as a text map with the PNG keyword names (Comment, Source, …).
 * Returns an empty map when the file carries none.
 */
export function readWebpText(bytes: Uint8Array): Record<string, string> {
    const tiff = exifPayload(bytes);
    if (!tiff) return {};
    const comment = readExifUserComment(tiff);
    if (!comment) return {};
    try {
        const parsed = JSON.parse(comment) as unknown;
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const result: Record<string, string> = {};
            for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
                result[key] = typeof value === 'string' ? value : JSON.stringify(value);
            }
            // A bare parameter object (no wrapper) is the Comment itself.
            if (!('Comment' in result) && ('prompt' in result || 'steps' in result)) return { Comment: comment };
            return result;
        }
    } catch {
        // not JSON
    }
    return { Comment: comment };
}

// ---- NovelAI parameters ----------------------------------------------------------------------

export interface ImportedCharacter {
    prompt: string;
    negative: string;
    x: number;
    y: number;
}

export interface ImportedParams {
    /** User prompt with the client-added quality tags removed. */
    prompt: string;
    /** User undesired content with the UC preset (and `nsfw, `) removed. */
    negative: string;
    model?: ModelId;
    qualityPreset?: QualityPresetId;
    ucPreset?: UcPresetId;
    seed?: number;
    steps?: number;
    scale?: number;
    cfgRescale?: number;
    sampler?: string;
    noiseSchedule?: string;
    width?: number;
    height?: number;
    smea?: boolean;
    smeaDyn?: boolean;
    varietyBoost?: boolean;
    useCoords?: boolean;
    characters: ImportedCharacter[];
    requestType?: string;
    source?: string;
    software?: string;
}

const V5_FULL_HASHES = ['657484A5', '0ADF9AB7'];

/** Model from the `Source` text (RECON §3.2, §3.3); unknown hashes fall back to the Full variant. */
export function modelFromSource(source: string | undefined): ModelId | undefined {
    if (!source) return undefined;
    const hash = source.trim().split(/\s+/).pop()?.toUpperCase() ?? '';
    if (/Diffusion V5/i.test(source))
        return V5_FULL_HASHES.includes(hash) ? 'nai-diffusion-5-full' : 'nai-diffusion-5-curated';
    if (/Diffusion V4\.5/i.test(source))
        return /curated/i.test(source) ? 'nai-diffusion-4-5-curated' : 'nai-diffusion-4-5-full';
    if (/Diffusion V4\b/i.test(source))
        return /curated/i.test(source) ? 'nai-diffusion-4-curated-preview' : 'nai-diffusion-4-full';
    if (/furry/i.test(source)) return 'nai-diffusion-furry-3';
    if (/Stable Diffusion XL|Diffusion V3/i.test(source)) return 'nai-diffusion-3';
    return undefined;
}

function num(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function str(value: unknown): string {
    return typeof value === 'string' ? value : '';
}

function obj(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

/** Removes the quality suffix the client appended to the first `|` segment. */
export function splitQualityTags(prompt: string, model: ModelId): { prompt: string; preset: QualityPresetId } {
    const [first = '', ...rest] = prompt.split('|');
    for (const preset of ['standard', 'light'] as const) {
        const suffix = getQualityText(model, preset);
        if (!suffix) continue;
        for (const tail of [`, ${suffix}`, suffix]) {
            const trimmed = first.trimEnd();
            if (trimmed.endsWith(tail)) {
                const head = trimmed.slice(0, trimmed.length - tail.length);
                return { prompt: [head, ...rest].join('|'), preset };
            }
        }
    }
    return { prompt, preset: 'none' };
}

/** Removes `nsfw, ` and the UC preset the client prepended. */
export function splitUcPreset(negative: string, model: ModelId): { negative: string; preset: UcPresetId } {
    const caps = getCapabilities(model);
    let text = negative.trimStart();
    if (text.startsWith('nsfw, ')) text = text.slice(6);
    for (const preset of caps.ucPresets) {
        const presetText = getUcPresetText(model, preset);
        if (!presetText || !text.startsWith(presetText)) continue;
        const rest = text.slice(presetText.length).replace(/^,\s*/, '');
        return { negative: rest, preset };
    }
    return { negative, preset: 'none' };
}

/** Parses NovelAI metadata (PNG text map or the WebP equivalent). Null when it is not NovelAI. */
export function parseNovelAIMetadata(text: Record<string, string>, fallbackModel?: ModelId): ImportedParams | null {
    const raw = text.Comment;
    if (!raw) return null;
    let comment: Record<string, unknown>;
    try {
        comment = obj(JSON.parse(raw));
    } catch {
        return null;
    }
    if (!('prompt' in comment) && !('v4_prompt' in comment) && !('steps' in comment)) return null;
    const detected = modelFromSource(text.Source);
    const model = detected ?? (isModelId(fallbackModel) ? fallbackModel : undefined);
    const v4 = obj(comment.v4_prompt);
    const v4Caption = obj(v4.caption);
    const v4Negative = obj(obj(comment.v4_negative_prompt).caption);
    const basePrompt = str(v4Caption.base_caption) || str(comment.prompt) || str(text.Description);
    const baseNegative = str(v4Negative.base_caption) || str(comment.uc);
    const quality = model ? splitQualityTags(basePrompt, model) : { prompt: basePrompt, preset: undefined };
    const uc = model ? splitUcPreset(baseNegative, model) : { negative: baseNegative, preset: undefined };

    const charCaptions = Array.isArray(v4Caption.char_captions) ? v4Caption.char_captions.map(obj) : [];
    const charNegatives = Array.isArray(v4Negative.char_captions) ? v4Negative.char_captions.map(obj) : [];
    const characters: ImportedCharacter[] = charCaptions.map((caption, i) => {
        const center = obj(Array.isArray(caption.centers) ? caption.centers[0] : undefined);
        return {
            prompt: str(caption.char_caption),
            negative: str(charNegatives[i]?.char_caption),
            x: num(center.x) ?? 0.5,
            y: num(center.y) ?? 0.5,
        };
    });

    const result: ImportedParams = {
        prompt: quality.prompt,
        negative: uc.negative,
        characters,
        source: text.Source,
        software: text.Software,
    };
    if (model) result.model = model;
    if (quality.preset) result.qualityPreset = quality.preset;
    if (uc.preset) result.ucPreset = uc.preset;
    const assign = <K extends keyof ImportedParams>(key: K, value: ImportedParams[K] | undefined) => {
        if (value !== undefined) result[key] = value;
    };
    assign('seed', num(comment.seed));
    assign('steps', num(comment.steps));
    assign('scale', num(comment.scale));
    assign('cfgRescale', num(comment.cfg_rescale));
    assign('width', num(comment.width));
    assign('height', num(comment.height));
    assign('sampler', str(comment.sampler) || undefined);
    assign('noiseSchedule', str(comment.noise_schedule) || undefined);
    if (typeof comment.sm === 'boolean') result.smea = comment.sm;
    if (typeof comment.sm_dyn === 'boolean') result.smeaDyn = comment.sm_dyn;
    if ('skip_cfg_above_sigma' in comment) result.varietyBoost = comment.skip_cfg_above_sigma !== null;
    if (typeof v4.use_coords === 'boolean') result.useCoords = v4.use_coords;
    assign('requestType', str(comment.request_type) || undefined);
    return result;
}

export interface MetadataSource {
    prompt: string;
    negativePrompt: string;
    model: string;
    seed: number;
    width: number;
    height: number;
    steps: number;
    scale: number;
    cfgRescale: number;
    sampler: string;
    noiseSchedule: string;
    characters: { prompt: string; negative: string; x: number; y: number }[];
    requestType: string;
}

const SOURCE_NAMES: Partial<Record<string, string>> = {
    'nai-diffusion-5-full': 'NovelAI Diffusion V5 0ADF9AB7',
    'nai-diffusion-5-curated': 'NovelAI Diffusion V5',
    'nai-diffusion-4-5-full': 'NovelAI Diffusion V4.5 4BDE2A90',
    'nai-diffusion-4-5-curated': 'NovelAI Diffusion V4.5 Curated',
    'nai-diffusion-4-full': 'NovelAI Diffusion V4',
    'nai-diffusion-4-curated-preview': 'NovelAI Diffusion V4 Curated',
    'nai-diffusion-3': 'Stable Diffusion XL 7BCCAA2C',
    'nai-diffusion-furry-3': 'Stable Diffusion XL Furry',
};

/**
 * Text chunks in the NovelAI layout for images whose own metadata was lost (e.g. re-encoded).
 * Only fields NAI Studio really sent are written.
 */
export function buildNovelAIText(meta: MetadataSource): Record<string, string> {
    const v4 = meta.model.startsWith('nai-diffusion-4') || meta.model.startsWith('nai-diffusion-5');
    const comment: Record<string, unknown> = {
        prompt: meta.prompt,
        steps: meta.steps,
        height: meta.height,
        width: meta.width,
        scale: meta.scale,
        seed: meta.seed,
        sampler: meta.sampler,
        noise_schedule: meta.noiseSchedule,
        cfg_rescale: meta.cfgRescale,
        n_samples: 1,
        uc: meta.negativePrompt,
        request_type: meta.requestType,
    };
    if (v4) {
        comment.v4_prompt = {
            caption: {
                base_caption: meta.prompt,
                char_captions: meta.characters.map((c) => ({ char_caption: c.prompt, centers: [{ x: c.x, y: c.y }] })),
            },
            use_coords: meta.characters.length > 0,
            use_order: true,
        };
        comment.v4_negative_prompt = {
            caption: {
                base_caption: meta.negativePrompt,
                char_captions: meta.characters.map((c) => ({
                    char_caption: c.negative,
                    centers: [{ x: c.x, y: c.y }],
                })),
            },
        };
    }
    return {
        Title: 'AI generated image',
        Description: meta.prompt,
        Software: 'NovelAI',
        Source: SOURCE_NAMES[meta.model] ?? meta.model,
        Comment: JSON.stringify(comment),
    };
}

/** Text of the chunks as base64 helpers would need it (exported for tests). */
export function encodeUtf8(value: string): Uint8Array {
    return encoder.encode(value);
}
