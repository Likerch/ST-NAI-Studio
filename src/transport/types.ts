import type { NaiImageRequest, NaiSubscription } from '../shared/nai-wire';

export type TransportId = 'plugin' | 'native';

export type Endpoint = 'generate' | 'generate-stream';

export interface GeneratedImage {
    base64: string;
    mime: 'image/png' | 'image/webp';
    seed?: number;
    index: number;
}

export interface GenerateResult {
    images: GeneratedImage[];
    correlationId?: string;
}

export interface GenerateOptions {
    endpoint: Endpoint;
    signal?: AbortSignal;
    /** The request is free, so the plugin may retry it on 5xx without risking a double charge. */
    retryable: boolean;
}

/** Features the transport can deliver to NovelAI. Unsupported ones stay visible but disabled. */
export interface TransportFeatures {
    characters: boolean;
    multipleSamples: boolean;
    img2img: boolean;
    inpaint: boolean;
    vibes: boolean;
    characterReference: boolean;
    cfgRescale: boolean;
    transparency: boolean;
    stream: boolean;
    upscale: boolean;
    director: boolean;
    diagnostics: boolean;
}

/** What NovelAI actually receives on this transport and which requested features get lost. */
export interface EffectiveRequest {
    body: unknown;
    lost: LostFeature[];
}

export type LostFeature =
    | 'characters'
    | 'coordinates'
    | 'samples'
    | 'source-image'
    | 'mask'
    | 'vibes'
    | 'character-reference'
    | 'cfg-rescale'
    | 'transparency'
    | 'legacy-uc'
    | 'stream'
    | 'mode'
    | 'override';

export interface Transport {
    readonly id: TransportId;
    readonly features: TransportFeatures;
    generate(body: NaiImageRequest, options: GenerateOptions): Promise<GenerateResult>;
    subscription(signal?: AbortSignal): Promise<NaiSubscription>;
    effectiveRequest(body: NaiImageRequest, overridePaths: string[]): EffectiveRequest;
}

export type TransportErrorKind =
    'http' | 'network' | 'timeout' | 'aborted' | 'invalid-response' | 'plugin-unavailable' | 'token-missing';

/** Transport failure. `serverMessage` is NovelAI's own text; tokens never pass through the client. */
export class TransportError extends Error {
    readonly kind: TransportErrorKind;
    readonly status: number | undefined;
    readonly serverMessage: string | undefined;
    readonly bodyPreview: string | undefined;

    constructor(
        kind: TransportErrorKind,
        options: { status?: number; serverMessage?: string; bodyPreview?: string; message?: string } = {},
    ) {
        super(options.message ?? `${kind}${options.status ? ` ${options.status}` : ''}`);
        this.name = 'TransportError';
        this.kind = kind;
        this.status = options.status;
        this.serverMessage = options.serverMessage;
        this.bodyPreview = options.bodyPreview;
    }
}

/** Host services the transports need; injected so tests can mock them. */
export interface TransportEnv {
    fetch: typeof fetch;
    headers(): Record<string, string>;
}

export function isAbort(error: unknown): boolean {
    return error instanceof DOMException
        ? error.name === 'AbortError'
        : (error as { name?: string })?.name === 'AbortError';
}
