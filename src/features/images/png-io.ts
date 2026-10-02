// PNG metadata in and out (TZ Phase 3): read parameters from any NovelAI PNG/WebP dropped into the
// panel; write NovelAI-format metadata when saving, or strip it when the user asked for that.
import { saveSettings, settings, notifyExternalChange } from '../../core/settings';
import type { CharacterSlotSettings } from '../../core/settings-schema';
import {
    buildNovelAIText,
    getCapabilities,
    isModelId,
    isPng,
    isWebp,
    parseNovelAIMetadata,
    readPngText,
    readWebpText,
    stripPngMetadata,
    writePngText,
} from '../../domain';
import type { ImportedParams, InlineGenerationMeta } from '../../domain';
import { blobToBytes, inflate, sniffMime, toPngBlob } from './image-utils';

/** NovelAI text map of a PNG or WebP (compressed PNG chunks inflated). Empty for other files. */
export async function readMetadataText(bytes: Uint8Array): Promise<Record<string, string>> {
    if (isPng(bytes)) {
        const { text, compressed } = readPngText(bytes);
        for (const entry of compressed) {
            try {
                text[entry.keyword] = new TextDecoder().decode(await inflate(entry.data));
            } catch {
                // a broken chunk must not stop the import
            }
        }
        return text;
    }
    if (isWebp(bytes)) return readWebpText(bytes);
    return {};
}

export async function readImportedParams(file: Blob): Promise<ImportedParams | null> {
    const bytes = await blobToBytes(file);
    const model = settings().generation.model;
    return parseNovelAIMetadata(await readMetadataText(bytes), isModelId(model) ? model : undefined);
}

/** Field names that were applied, for the toast. */
export function applyImportedParams(params: ImportedParams): string[] {
    const g = settings().generation;
    const applied: string[] = [];
    const set = <K extends keyof typeof g>(key: K, value: (typeof g)[K] | undefined) => {
        if (value === undefined) return;
        g[key] = value;
        applied.push(String(key));
    };
    set('model', params.model);
    set('prompt', params.prompt);
    set('negativePrompt', params.negative);
    set('qualityPreset', params.qualityPreset);
    if (params.ucPreset && params.model && getCapabilities(params.model).ucPresets.includes(params.ucPreset)) {
        set('ucPreset', params.ucPreset);
    }
    set('seed', params.seed);
    set('steps', params.steps);
    set('scale', params.scale);
    set('cfgRescale', params.cfgRescale);
    set('width', params.width);
    set('height', params.height);
    set('sampler', params.sampler);
    set('noiseSchedule', params.noiseSchedule);
    set('smea', params.smea);
    set('smeaDyn', params.smeaDyn);
    if (params.smea !== undefined) g.autoSmea = false;
    set('varietyBoost', params.varietyBoost);
    set('useCoords', params.useCoords);
    const characters: CharacterSlotSettings[] = params.characters.map((c) => ({
        prompt: c.prompt,
        negative: c.negative,
        x: c.x,
        y: c.y,
        enabled: true,
    }));
    g.characters = characters;
    applied.push('characters');
    saveSettings();
    notifyExternalChange();
    return applied;
}

/**
 * Bytes to write to disk or to the server. PNG/WebP straight from NovelAI already carry their
 * metadata; other cases get it written in the NovelAI layout. With `strip`, everything is removed.
 */
export async function exportImage(
    blob: Blob,
    meta: InlineGenerationMeta | undefined,
    options: { strip: boolean; format: 'png' | 'original' },
): Promise<Blob> {
    const bytes = await blobToBytes(blob);
    const mime = sniffMime(bytes);
    if (options.strip) {
        if (mime === 'image/png') return new Blob([stripPngMetadata(bytes) as BlobPart], { type: 'image/png' });
        return await toPngBlob(blob);
    }
    if (options.format === 'original' && mime !== 'image/png') return blob;
    const ownText = await readMetadataText(bytes);
    const text = ownText.Comment
        ? ownText
        : meta
          ? buildNovelAIText({ ...meta, requestType: requestTypeName(meta) })
          : {};
    const png = mime === 'image/png' ? bytes : await blobToBytes(await toPngBlob(blob));
    const written = Object.keys(text).length ? writePngText(png, text) : png;
    return new Blob([written as BlobPart], { type: 'image/png' });
}

function requestTypeName(meta: InlineGenerationMeta): string {
    switch (meta.requestType) {
        case 'img2img':
            return 'Img2ImgRequest';
        case 'inpaint':
            return 'NativeInfillingRequest';
        default:
            return 'PromptGenerateRequest';
    }
}
