// A chat's own DES portrait as a reference that does not bloat the chat metadata (v0.14). DES keeps the
// value of npcAvatars as a file path ("/user/images/des-portraits/<file>?t=<mtime>" for its own files, the
// path NAI Studio's /sd answered for the portraits it draws, "/characters/<file>" for a card import) or,
// from DES 1.10, a data URL that DES moves to a file on its next start. A data URL is saved as a file in
// /user/images/nai-studio-portraits; a file in DES's own folder is copied there too, because DES deletes
// such a file once none of its stores points at it (a sixth regeneration, a deleted character); any other
// path or URL is kept as it is. The same source gives the same file name, so a copy is made once.
import { log } from '../../core/logger';
import { isDataUrl, isDesManagedPortrait, portraitFileName } from '../../domain';
import { uploadImage } from '../../features/generation/output';
import { blobToBase64, blobToBytes, sniffMime } from '../../features/images/image-utils';

/** Folder in /user/images for the chats' copies of DES portraits. */
export const PORTRAIT_FOLDER = 'nai-studio-portraits';

function parseDataUrl(url: string): { mime: string; base64: string } | null {
    const comma = url.indexOf(',');
    const head = comma > 0 ? url.slice(5, comma) : '';
    if (!head.endsWith(';base64')) return null;
    return { mime: head.slice(0, -';base64'.length) || 'image/png', base64: url.slice(comma + 1) };
}

/**
 * What a chat records as its portrait: a path, never a data URL; undefined when there is nothing to keep
 * (no portrait, or a data URL that could not be saved).
 */
export async function portraitReference(name: string, value: string | undefined): Promise<string | undefined> {
    if (!value) return undefined;
    try {
        if (isDataUrl(value)) {
            const data = parseDataUrl(value);
            if (!data) return undefined;
            return await uploadImage(data.base64, data.mime, PORTRAIT_FOLDER, portraitFileName(name, value));
        }
        if (isDesManagedPortrait(value)) {
            const response = await fetch(value, { cache: 'no-cache' });
            if (!response.ok) return value;
            const blob = await response.blob();
            const mime = blob.type.startsWith('image/') ? blob.type : sniffMime(await blobToBytes(blob));
            return await uploadImage(await blobToBase64(blob), mime, PORTRAIT_FOLDER, portraitFileName(name, value));
        }
    } catch (error) {
        log.warn(`DES: the portrait of ${name} was not saved for this chat`, error);
        return isDataUrl(value) ? undefined : value;
    }
    return value;
}
