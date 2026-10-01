// Transport through our own server plugin (/api/plugins/nai-studio). Preferred: full feature set,
// token read server-side from ST secrets, NovelAI errors passed through with their status.
import type { NaiImageRequest, NaiSubscription } from '../shared/nai-wire';
import { isAbort, TransportError } from './types';
import type {
    EffectiveRequest,
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
    stream: false,
    upscale: false,
    director: false,
    diagnostics: true,
};

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

export function createPluginTransport(env: TransportEnv): Transport {
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

    return {
        id: 'plugin',
        features: PLUGIN_FEATURES,

        async generate(body: NaiImageRequest, options: GenerateOptions): Promise<GenerateResult> {
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
