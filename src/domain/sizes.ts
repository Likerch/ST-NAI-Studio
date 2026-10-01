// Size rules (RECON §3.4): multiples of 64, area limits, sample caps by area.

export const SIZE_STEP = 64;
export const MIN_SIDE = 64;

export function roundToStep(value: number): number {
    return Math.max(MIN_SIDE, Math.round(value / SIZE_STEP) * SIZE_STEP);
}

/** Largest size with the same aspect ratio, multiples of 64, whose area does not exceed `maxPixels`. */
export function fitArea(width: number, height: number, maxPixels: number): { width: number; height: number } {
    if (width * height <= maxPixels) {
        return { width, height };
    }
    const ratio = Math.sqrt(maxPixels / (width * height));
    let w = Math.max(MIN_SIDE, Math.floor((width * ratio) / SIZE_STEP) * SIZE_STEP);
    let h = Math.max(MIN_SIDE, Math.floor((height * ratio) / SIZE_STEP) * SIZE_STEP);
    while (w * h > maxPixels) {
        if (w >= h && w > MIN_SIDE) {
            w -= SIZE_STEP;
        } else if (h > MIN_SIDE) {
            h -= SIZE_STEP;
        } else {
            break;
        }
    }
    return { width: w, height: h };
}

/** n_samples cap by pixel count (bundle:1601@55499). */
export function maxSamplesForArea(width: number, height: number): number {
    const pixels = width * height;
    if (pixels <= 360448) {
        return 8;
    }
    if (pixels <= 409600) {
        return 6;
    }
    return 4;
}
