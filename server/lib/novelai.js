// Minimal NovelAI image client for the plugin: generation (JSON response, no ZIP) and subscription.
// Retries: 429 always (request was not processed); 5xx only when the caller marked it retryable
// (free request), so a paid request is never sent twice.
import { abortError } from './queue.js';

export const DEFAULT_BASE_URL = 'https://image.novelai.net';
const CORRELATION_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789';

export function correlationId() {
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += CORRELATION_ALPHABET[Math.floor(Math.random() * CORRELATION_ALPHABET.length)];
    }
    return id;
}

export class UpstreamError extends Error {
    /**
     * @param {'http'|'network'|'timeout'|'aborted'|'invalid-response'} kind
     * @param {{status?: number, message?: string, preview?: string}} [details]
     */
    constructor(kind, details = {}) {
        super(details.message ?? kind);
        this.name = 'UpstreamError';
        this.kind = kind;
        this.status = details.status;
        this.preview = details.preview;
    }
}

/** Removes the token from any text that may travel back to the browser or into logs. */
export function redact(text, token) {
    if (!text) return '';
    const value = String(text);
    return token ? value.split(token).join('<redacted>') : value;
}

function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
        if (signal?.aborted) return reject(abortError());
        const timer = setTimeout(resolve, ms);
        signal?.addEventListener(
            'abort',
            () => {
                clearTimeout(timer);
                reject(abortError());
            },
            { once: true },
        );
    });
}

function detectMime(base64) {
    if (base64.startsWith('UklGR')) return 'image/webp';
    return 'image/png';
}

/**
 * @param {object} options
 * @param {typeof fetch} options.fetch
 * @param {string} [options.baseUrl]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.maxRetries]
 * @param {number} [options.backoffMs]
 */
export function createNovelAiClient({
    fetch,
    baseUrl = DEFAULT_BASE_URL,
    timeoutMs = 120000,
    maxRetries = 3,
    backoffMs = 1000,
}) {
    async function once(path, init, token, signal) {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        signal?.addEventListener('abort', onAbort, { once: true });
        const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
        try {
            const response = await fetch(`${baseUrl}${path}`, {
                ...init,
                headers: { Authorization: `Bearer ${token}`, ...init.headers },
                signal: controller.signal,
            });
            return response;
        } catch (error) {
            if (signal?.aborted) throw new UpstreamError('aborted');
            if (controller.signal.aborted)
                throw new UpstreamError('timeout', { message: `NovelAI did not answer within ${timeoutMs} ms` });
            throw new UpstreamError('network', { message: redact(error?.message ?? String(error), token) });
        } finally {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
        }
    }

    async function failure(response, token) {
        const text = redact(await response.text(), token);
        let message = text.slice(0, 500);
        try {
            const body = JSON.parse(text);
            if (body && typeof body.message === 'string') message = body.message;
        } catch {
            // not JSON: keep the raw preview
        }
        return new UpstreamError('http', { status: response.status, message, preview: text.slice(0, 200) });
    }

    return {
        /**
         * @param {{request: object, token: string, signal?: AbortSignal, retryable?: boolean}} args
         * @returns {Promise<{images: {image: string, mime: string, seed?: number, index: number}[], correlationId: string}>}
         */
        async generateImage({ request, token, signal, retryable = false }) {
            const id = correlationId();
            for (let attempt = 0; ; attempt++) {
                const response = await once(
                    '/ai/generate-image',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'x-correlation-id': id,
                            'x-initiated-at': new Date().toISOString(),
                        },
                        body: JSON.stringify(request),
                    },
                    token,
                    signal,
                );
                if (response.ok) {
                    const text = await response.text();
                    let body;
                    try {
                        body = JSON.parse(text);
                    } catch {
                        throw new UpstreamError('invalid-response', {
                            status: response.status,
                            preview: Buffer.from(text.slice(0, 32), 'latin1').toString('hex'),
                        });
                    }
                    if (!Array.isArray(body?.images) || body.images.length === 0) {
                        throw new UpstreamError('invalid-response', {
                            status: response.status,
                            preview: text.slice(0, 200),
                        });
                    }
                    return {
                        images: body.images.map((img, i) => ({
                            image: img.image,
                            mime: detectMime(img.image),
                            seed: img.seed,
                            index: img.index ?? i,
                        })),
                        correlationId: id,
                    };
                }
                const retry =
                    (response.status === 429 || (retryable && response.status >= 500)) && attempt < maxRetries;
                if (!retry) throw await failure(response, token);
                await response.text().catch(() => '');
                await sleep(backoffMs * 2 ** attempt, signal);
            }
        },

        /** @param {{token: string, signal?: AbortSignal}} args */
        async subscription({ token, signal }) {
            const response = await once('/user/subscription', { method: 'GET', headers: {} }, token, signal);
            if (!response.ok) throw await failure(response, token);
            const body = await response.json();
            if (body && typeof body === 'object') delete body.paymentProcessorData;
            return body;
        },
    };
}
