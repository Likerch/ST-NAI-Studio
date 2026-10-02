// Transport through our own server plugin (/api/plugins/nai-studio). Preferred: full feature set,
// token read server-side from ST secrets, NovelAI errors passed through with their status.
import type { NaiImageRequest, NaiSubscription } from '../shared/nai-wire';
import { SseParser, toFrame } from './sse';
import { isAbort, TransportError } from './types';
import type {
    EffectiveRequest,
    GeneratedImage,
    GenerateOptions,
    GenerateResult,
    Transport,
    TransportEnv,
    TransportFeatures,
} from './types';

export const PLUGIN_ID = 'nai-studio';
export const PLUGIN_BASE = `/api/plugins/${PLUGIN_ID}`;

export interface PluginHealth {
    ok: boolean;
    version: string;
    tokenSource: 'st-secrets' | 'config' | 'none';
}

export const PLUGIN_FEATURES: TransportFeatures = {
    characters: true,
    multipleSamples: true,
    img2img: true,
    inpaint: true,
    vibes: true,
    characterReference: true,
    cfgRescale: true,
    transparency: true,
    stream: true,
    upscale: true,
    director: true,
    diagnostics: true,
};

/** Routes added in plugin 0.2.0: streaming, vibe encoding, Director Tools, upscale. */
export const PHASE5_PLUGIN_VERSION = '0.2.0';
/** Route added in plugin 0.4.0: NovelAI text models for the human-language converter. */
export const TEXT_PLUGIN_VERSION = '0.4.0';

export function versionAtLeast(version: string, minimum: string): boolean {
    const a = version.split('.').map((n) => Number.parseInt(n, 10) || 0);
    const b = minimum.split('.').map((n) => Number.parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const x = a[i] ?? 0;
        const y = b[i] ?? 0;
        if (x !== y) return x > y;
    }
    return true;
}

/** Features of an installed plugin: an older plugin keeps generation but loses the new routes. */
export function pluginFeatures(version: string | null): TransportFeatures {
    if (version === null || versionAtLeast(version, PHASE5_PLUGIN_VERSION)) return PLUGIN_FEATURES;
    return { ...PLUGIN_FEATURES, stream: false, upscale: false, director: false, vibes: false };
}

interface PluginErrorBody {
    error?: { kind?: string; status?: number; message?: string; preview?: string };
}

interface PluginImagesBody {
    images?: { image: string; mime?: string; seed?: number; index?: number }[];
    correlationId?: string;
}

/** Returns plugin health or null when the plugin is not installed / ST was not restarted. */
export async function probePlugin(env: TransportEnv, signal?: AbortSignal): Promise<PluginHealth | null> {
    try {
        const response = await env.fetch(`${PLUGIN_BASE}/health`, { method: 'GET', headers: env.headers(), signal });
        if (!response.ok) return null;
        const body = (await response.json()) as Partial<PluginHealth>;
        if (body?.ok !== true || typeof body.version !== 'string') return null;
        return { ok: true, version: body.version, tokenSource: body.tokenSource ?? 'none' };
    } catch {
        return null;
    }
}

async function toTransportError(response: Response): Promise<TransportError> {
    if (response.status === 404) {
        return new TransportError('plugin-unavailable', { status: 404 });
    }
    let body: PluginErrorBody;
    const text = await response.text();
    try {
        body = JSON.parse(text) as PluginErrorBody;
    } catch {
        return new TransportError('invalid-response', { status: response.status, bodyPreview: text.slice(0, 200) });
    }
    const kind = body.error?.kind;
    const known = ['http', 'network', 'timeout', 'aborted', 'invalid-response', 'token-missing'] as const;
    const resolved = known.find((k) => k === kind) ?? 'http';
    return new TransportError(resolved, {
        status: body.error?.status ?? response.status,
        serverMessage: body.error?.message,
        bodyPreview: body.error?.preview,
    });
}

export function createPluginTransport(env: TransportEnv, version: string | null = null): Transport {
    const features = pluginFeatures(version);
    async function post(path: string, payload: unknown, signal?: AbortSignal): Promise<Response> {
        try {
            return await env.fetch(`${PLUGIN_BASE}${path}`, {
                method: 'POST',
                headers: env.headers(),
                body: JSON.stringify(payload),
                signal,
            });
        } catch (error) {
            if (isAbort(error)) throw new TransportError('aborted');
            throw new TransportError('network', { message: error instanceof Error ? error.message : String(error) });
        }
    }

    const mime = (base64: string): GeneratedImage['mime'] => (base64.startsWith('UklGR') ? 'image/webp' : 'image/png');

    /** SSE from /generate-stream: previews go to onProgress, final images are the result. */
    async function generateStream(body: NaiImageRequest, options: GenerateOptions): Promise<GenerateResult> {
        const response = await post(
            '/generate-stream',
            { request: body, retryable: options.retryable },
            options.signal,
        );
        if (!response.ok || !response.body) throw await toTransportError(response);
        const parser = new SseParser();
        const decoder = new TextDecoder();
        const finals = new Map<number, string>();
        const reader = response.body.getReader();
        const seed = Number(body.parameters.seed) || 0;
        const handle = (events: ReturnType<SseParser['feed']>) => {
            for (const event of events) {
                const frame = toFrame(event);
                if (!frame) continue;
                if (frame.kind === 'error') throw new TransportError('http', { serverMessage: frame.message });
                if (frame.kind === 'final' && frame.image) finals.set(frame.sampleIndex, frame.image);
                options.onProgress?.(frame);
            }
        };
        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                handle(parser.feed(decoder.decode(value, { stream: true })));
            }
            handle(parser.flush());
        } catch (error) {
            if (isAbort(error)) throw new TransportError('aborted');
            throw error;
        }
        if (!finals.size)
            throw new TransportError('invalid-response', { bodyPreview: 'stream ended without a final image' });
        return {
            images: [...finals.entries()]
                .sort((a, b) => a[0] - b[0])
                .map(([index, image]) => ({ base64: image, mime: mime(image), seed: seed + index, index })),
        };
    }

    return {
        id: 'plugin',
        features,

        extras: {
            async encodeVibe(request, signal) {
                const response = await post('/encode-vibe', request, signal);
                if (!response.ok) throw await toTransportError(response);
                const data = (await response.json()) as { encoding?: string; cached?: boolean };
                if (typeof data.encoding !== 'string') throw new TransportError('invalid-response');
                return { encoding: data.encoding, cached: data.cached === true };
            },
            async lookupVibes(items, signal) {
                const response = await post('/encode-vibe/lookup', { items }, signal);
                if (!response.ok) throw await toTransportError(response);
                const data = (await response.json()) as { results?: { encoding: string | null }[] };
                return (data.results ?? []).map((r) => r.encoding ?? null);
            },
            async augment(body, options) {
                const response = await post('/augment', { body, retryable: options.retryable }, options.signal);
                if (!response.ok) throw await toTransportError(response);
                const data = (await response.json()) as { zip?: string };
                if (typeof data.zip !== 'string') throw new TransportError('invalid-response');
                return data.zip;
            },
            async upscale(request, signal) {
                const response = await post('/upscale', request, signal);
                if (!response.ok) throw await toTransportError(response);
                const data = (await response.json()) as PluginImagesBody;
                return (data.images ?? []).map((img, i) => ({
                    base64: img.image,
                    mime: mime(img.image),
                    index: img.index ?? i,
                }));
            },
        },

        async generate(body: NaiImageRequest, options: GenerateOptions): Promise<GenerateResult> {
            if (options.endpoint === 'generate-stream') return await generateStream(body, options);
            const response = await post(
                '/generate',
                { request: body, endpoint: options.endpoint, retryable: options.retryable },
                options.signal,
            );
            if (!response.ok) throw await toTransportError(response);
            const data = (await response.json()) as PluginImagesBody;
            if (!Array.isArray(data.images) || data.images.length === 0) {
                throw new TransportError('invalid-response', { bodyPreview: JSON.stringify(data).slice(0, 200) });
            }
            return {
                images: data.images.map((img, i) => ({
                    base64: img.image,
                    mime: img.mime === 'image/webp' ? 'image/webp' : 'image/png',
                    seed: img.seed,
                    index: img.index ?? i,
                })),
                correlationId: data.correlationId,
            };
        },

        async subscription(signal?: AbortSignal): Promise<NaiSubscription> {
            let response: Response;
            try {
                response = await env.fetch(`${PLUGIN_BASE}/subscription`, {
                    method: 'GET',
                    headers: env.headers(),
                    signal,
                });
            } catch (error) {
                if (isAbort(error)) throw new TransportError('aborted');
                throw new TransportError('network', {
                    message: error instanceof Error ? error.message : String(error),
                });
            }
            if (!response.ok) throw await toTransportError(response);
            return (await response.json()) as NaiSubscription;
        },

        effectiveRequest(body: NaiImageRequest): EffectiveRequest {
            // The plugin forwards the body unchanged, override included.
            return { body, lost: [] };
        },
    };
}
