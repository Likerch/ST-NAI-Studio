// Raw override: user JSON deep-merged into the body LAST, after sanitize (TZ "Raw-override").
import type { NaiImageRequest } from '../../shared/nai-wire';
import { DomainError } from '../errors';

export interface OverrideResult {
    body: NaiImageRequest;
    /** Dot paths of every leaf the override set, for highlighting in the inspector. */
    paths: string[];
}

type JsonObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Parses override text. Empty text means "no override". */
export function parseOverride(text: string): JsonObject | null {
    if (text.trim() === '') {
        return null;
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch (error) {
        throw new DomainError('invalid-override', { reason: error instanceof Error ? error.message : String(error) });
    }
    if (!isPlainObject(parsed)) {
        throw new DomainError('invalid-override', { reason: 'not-an-object' });
    }
    return parsed;
}

function mergeInto(target: JsonObject, source: JsonObject, prefix: string, paths: string[]): void {
    for (const [key, value] of Object.entries(source)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const current = target[key];
        if (isPlainObject(value) && isPlainObject(current)) {
            mergeInto(current, value, path, paths);
        } else {
            // Arrays and primitives replace the target value wholesale.
            target[key] = structuredClone(value);
            paths.push(path);
        }
    }
}

export function applyOverride(body: NaiImageRequest, override: JsonObject | null): OverrideResult {
    const clone = structuredClone(body);
    const paths: string[] = [];
    if (override) {
        mergeInto(clone as JsonObject, override, '', paths);
    }
    return { body: clone, paths };
}
