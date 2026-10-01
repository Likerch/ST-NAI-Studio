import fs from 'node:fs';
import path from 'node:path';

const CAPTURES_DIR = path.resolve(__dirname, '../../docs/captures');

export interface CaptureRecord {
    name: string;
    endpoint: string;
    requestBody: Record<string, unknown>;
    response: { status: number; [key: string]: unknown };
}

export function loadCapture(name: string): CaptureRecord {
    return JSON.parse(fs.readFileSync(path.join(CAPTURES_DIR, `${name}.json`), 'utf8')) as CaptureRecord;
}

const BASE64_PLACEHOLDER = '<base64>';

/** Replaces every long base64 string (and capture placeholders) so bodies compare structurally. */
export function normalizeImages(value: unknown): unknown {
    if (typeof value === 'string') {
        if (value.startsWith('<base64 ') || (value.length > 256 && /^[A-Za-z0-9+/=]+$/.test(value))) {
            return BASE64_PLACEHOLDER;
        }
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(normalizeImages);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, normalizeImages(v)]));
    }
    return value;
}

/** A base64 blob long enough to be normalized like a real image. */
export const FAKE_IMAGE = 'A'.repeat(400);
