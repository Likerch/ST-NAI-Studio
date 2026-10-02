// Browser-side image helpers: base64 <-> Blob, size, PNG re-encoding, thumbnails. Heavy work is
// done with createImageBitmap/canvas so the UI thread only waits on promises (TZ "do not block").

export function base64ToBytes(base64: string): Uint8Array {
    const clean = base64.includes(',') ? base64.slice(base64.indexOf(',') + 1) : base64;
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
}

export function base64ToBlob(base64: string, mime: string): Blob {
    return new Blob([base64ToBytes(base64) as BlobPart], { type: mime });
}

export async function blobToBytes(blob: Blob): Promise<Uint8Array> {
    return new Uint8Array(await blob.arrayBuffer());
}

export async function blobToBase64(blob: Blob): Promise<string> {
    return bytesToBase64(await blobToBytes(blob));
}

/** MIME type from the first bytes (PNG / WebP / JPEG), defaulting to PNG. */
export function sniffMime(bytes: Uint8Array): string {
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[8] === 0x57) return 'image/webp';
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg';
    return 'image/png';
}

export async function imageSize(blob: Blob): Promise<{ width: number; height: number }> {
    const bitmap = await createImageBitmap(blob);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
}

function canvas(width: number, height: number): HTMLCanvasElement {
    const el = document.createElement('canvas');
    el.width = width;
    el.height = height;
    return el;
}

async function canvasBlob(el: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
    return await new Promise((resolve, reject) => {
        el.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('canvas export failed'))), type, quality);
    });
}

/** Re-encodes any image to PNG (drops all metadata, pixels unchanged). */
export async function toPngBlob(blob: Blob, size?: { width: number; height: number }): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const el = canvas(size?.width ?? bitmap.width, size?.height ?? bitmap.height);
    const context = el.getContext('2d');
    if (!context) throw new Error('canvas unavailable');
    context.drawImage(bitmap, 0, 0, el.width, el.height);
    bitmap.close();
    return await canvasBlob(el, 'image/png');
}

/** Small WebP preview for the gallery. */
export async function thumbnail(blob: Blob, maxSide: number): Promise<Blob> {
    const bitmap = await createImageBitmap(blob);
    const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const el = canvas(Math.max(1, Math.round(bitmap.width * ratio)), Math.max(1, Math.round(bitmap.height * ratio)));
    const context = el.getContext('2d');
    if (!context) throw new Error('canvas unavailable');
    context.drawImage(bitmap, 0, 0, el.width, el.height);
    bitmap.close();
    return await canvasBlob(el, 'image/webp', 0.8);
}

/** Inflates a zlib stream (compressed PNG text chunks). */
export async function inflate(data: Uint8Array): Promise<Uint8Array> {
    const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Triggers a browser download of a blob. */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
