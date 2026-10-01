// Thin wrapper over SillyTavern.getContext(). getContext() builds a fresh object on every call
// (and chatMetadata is reassigned on chat load), so never cache its result.

export const MODULE_NAME = 'nai_studio';
export const CSS_PREFIX = 'naist-';

export function ctx(): STContext {
    return SillyTavern.getContext();
}

export function libs(): STLibs {
    return SillyTavern.libs;
}

export function requestHeaders(omitContentType = false): Record<string, string> {
    return ctx().getRequestHeaders(omitContentType ? { omitContentType: true } : undefined);
}

/**
 * Folder of this extension under /scripts/extensions/third-party/, derived from the bundle URL
 * (works for global and per-user installs because both use the same URL; RECON §2.14).
 */
export function extensionFolder(moduleUrl: string = import.meta.url): string {
    const match = moduleUrl.match(/\/scripts\/extensions\/third-party\/([^/]+)\//);
    return match?.[1] ?? 'SillyTavern-NAI-Studio';
}

export function extensionBaseUrl(moduleUrl?: string): string {
    return `/scripts/extensions/third-party/${extensionFolder(moduleUrl)}`;
}
