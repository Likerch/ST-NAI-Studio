// Minimal NovelAI image client for the plugin: generation (JSON response, no ZIP), streaming,
// vibe encoding, Director Tools (ZIP passed to the browser as base64; the browser unzips it with
// SillyTavern's JSZip, RECON P-4), upscale and subscription; chat completions of NovelAI's text
// models (GLM-4.6, Xialong) for the human-language prompt converter (TZ Phase 7).
// Retries: 429 always (request was not processed), after NovelAI's Retry-After when it sends one;
// 5xx only when the caller marked it retryable (free request), so a paid request is never sent twice.
import { abortError } from './queue.js';

export const DEFAULT_BASE_URL = 'https://image.novelai.net';
export const DEFAULT_TEXT_URL = 'https://text.novelai.net';
export const TEXT_MODELS = ['glm-4-6', 'xialong-v1'];

/**
 * Text of an OpenAI-style chat completion answer: a server-sent event stream of deltas (NovelAI
 * streams even when asked not to) or one JSON body. Reasoning deltas are not part of the answer.
 */
export function chatCompletionText(raw) {
    const text = String(raw ?? '').trim();
    if (text.startsWith('{')) {
        try {
            const body = JSON.parse(text);
            return String(body?.choices?.[0]?.message?.content ?? body?.choices?.[0]?.text ?? '');
        } catch {
            // fall through to the event stream reader
        }
    }
    let out = '';
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') continue;
        try {
            const chunk = JSON.parse(data);
            const choice = chunk?.choices?.[0];
            out += String(choice?.delta?.content ?? choice?.text ?? choice?.message?.content ?? '');
        } catch {
            // a broken chunk is skipped
        }
    }
    return out;
}
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
     * @param {{status?: number, message?: string, preview?: string, retryAfter?: number}} [details]
     */
    constructor(kind, details = {}) {
        super(details.message ?? kind);
        this.name = 'UpstreamError';
        this.kind = kind;
        this.status = details.status;
        this.preview = details.preview;
        this.retryAfter = details.retryAfter;
    }
}

/** Longest wait a Retry-After may ask for before the next attempt. */
const MAX_RETRY_AFTER_MS = 30000;

/**
 * Seconds of a Retry-After header (a number of seconds or an HTTP date); undefined without one.
 * @param {Response} response
 */
export function retryAfterSeconds(response, now = Date.now()) {
    const raw = response.headers?.get?.('retry-after');
    if (!raw) return undefined;
    const seconds = Number(raw);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds;
    const date = Date.parse(raw);
    return Number.isFinite(date) ? Math.max(0, Math.ceil((date - now) / 1000)) : undefined;
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
 * @param {string} [options.textUrl]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.maxRetries]
 * @param {number} [options.backoffMs]
 */
export function createNovelAiClient({
    fetch,
    baseUrl = DEFAULT_BASE_URL,
    textUrl = DEFAULT_TEXT_URL,
    timeoutMs = 120000,
    maxRetries = 3,
    backoffMs = 1000,
}) {
    async function once(path, init, token, signal, base = baseUrl) {
        const controller = new AbortController();
        const onAbort = () => controller.abort();
        signal?.addEventListener('abort', onAbort, { once: true });
        const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
        try {
            const response = await fetch(`${base}${path}`, {
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
        const retryAfter = retryAfterSeconds(response);
        return new UpstreamError('http', {
            status: response.status,
            message,
            preview: text.slice(0, 200),
            ...(retryAfter !== undefined ? { retryAfter } : {}),
        });
    }

    /** Wait before the next attempt: the backoff, or longer when NovelAI asked (Retry-After). */
    function retryWait(response, attempt) {
        const asked = response.status === 429 ? retryAfterSeconds(response) : undefined;
        const backoff = backoffMs * 2 ** attempt;
        return asked === undefined ? backoff : Math.max(backoff, Math.min(asked * 1000, MAX_RETRY_AFTER_MS));
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
                const wait = retryWait(response, attempt);
                await response.text().catch(() => '');
                await sleep(wait, signal);
            }
        },

        /**
         * Binary POST (encode-vibe, augment-image). Retries 429 always and 5xx only when retryable.
         * @returns {Promise<Buffer>}
         */
        async postBinary({ path, body, token, signal, retryable = false }) {
            for (let attempt = 0; ; attempt++) {
                const response = await once(
                    path,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-correlation-id': correlationId(),
                            'x-initiated-at': new Date().toISOString(),
                        },
                        body: JSON.stringify(body),
                    },
                    token,
                    signal,
                );
                if (response.ok) return Buffer.from(await response.arrayBuffer());
                const retry =
                    (response.status === 429 || (retryable && response.status >= 500)) && attempt < maxRetries;
                if (!retry) throw await failure(response, token);
                const wait = retryWait(response, attempt);
                await response.text().catch(() => '');
                await sleep(wait, signal);
            }
        },

        /** Vibe encoding (V4/V4.5): always paid, never retried on 5xx. */
        async encodeVibe({ image, model, informationExtracted, mask, token, signal }) {
            const body = { image, model, information_extracted: informationExtracted };
            if (mask) body.mask = mask;
            return await this.postBinary({ path: '/ai/encode-vibe', body, token, signal, retryable: false });
        },

        /** Director Tools: returns the ZIP as base64 (the browser unzips it). */
        async augment({ body, token, signal, retryable = false }) {
            const zip = await this.postBinary({ path: '/ai/augment-image', body, token, signal, retryable });
            return zip.toString('base64');
        },

        /** Upscale x2 through the new endpoint (RECON §3.14), JSON response. Always paid. */
        async upscale({ image, width, height, token, signal }) {
            const response = await once(
                '/ai/upscale',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                    body: JSON.stringify({
                        image,
                        width,
                        height,
                        model: 'nai-diffusion-5-curated',
                        declared_blur_sigma: 0,
                    }),
                },
                token,
                signal,
            );
            if (!response.ok) throw await failure(response, token);
            const text = await response.text();
            let parsed;
            try {
                parsed = JSON.parse(text);
            } catch {
                throw new UpstreamError('invalid-response', {
                    status: response.status,
                    preview: Buffer.from(text.slice(0, 32), 'latin1').toString('hex'),
                });
            }
            const images = Array.isArray(parsed?.images) ? parsed.images : [];
            if (!images.length) throw new UpstreamError('invalid-response', { preview: text.slice(0, 200) });
            return images.map((img, i) => ({ image: img.image, mime: detectMime(img.image), index: img.index ?? i }));
        },

        /**
         * Generation with step previews: NovelAI answers text/event-stream (stream: "sse"); every
         * chunk is handed to onChunk as it arrives. Throws before the first chunk on HTTP errors;
         * 429 (another generation of the account still running) is retried before anything is sent.
         */
        async generateStream({ request, token, signal, onChunk }) {
            let response;
            for (let attempt = 0; ; attempt++) {
                response = await once(
                    '/ai/generate-image-stream',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-correlation-id': correlationId(),
                            'x-initiated-at': new Date().toISOString(),
                        },
                        body: JSON.stringify(request),
                    },
                    token,
                    signal,
                );
                if (response.ok) break;
                if (response.status !== 429 || attempt >= maxRetries) throw await failure(response, token);
                const wait = retryWait(response, attempt);
                await response.text().catch(() => '');
                await sleep(wait, signal);
            }
            const body = response.body;
            // The request signal no longer covers the body once headers arrived: stop reading
            // (and close the upstream connection) when the browser goes away.
            let cancel = () => {};
            const onAbort = () => cancel();
            signal?.addEventListener('abort', onAbort, { once: true });
            try {
                if (body && typeof body.getReader === 'function') {
                    const reader = body.getReader();
                    cancel = () => void reader.cancel().catch(() => {});
                    for (;;) {
                        const { done, value } = await reader.read();
                        if (signal?.aborted) throw new UpstreamError('aborted');
                        if (done) break;
                        onChunk(Buffer.from(value));
                    }
                } else if (body && typeof body[Symbol.asyncIterator] === 'function') {
                    cancel = () => body.destroy?.();
                    for await (const chunk of body) {
                        if (signal?.aborted) throw new UpstreamError('aborted');
                        onChunk(Buffer.from(chunk));
                    }
                } else {
                    onChunk(Buffer.from(await response.arrayBuffer()));
                }
                if (signal?.aborted) throw new UpstreamError('aborted');
            } catch (error) {
                if (signal?.aborted) throw new UpstreamError('aborted');
                throw error;
            } finally {
                signal?.removeEventListener('abort', onAbort);
            }
        },

        /**
         * NovelAI text model answer (subscription, no Anlas). 429 is retried like image requests.
         * @param {{token: string, model: string, messages: {role: string, content: string}[], maxTokens: number, signal?: AbortSignal}} args
         */
        async chat({ token, model, messages, maxTokens, signal }) {
            for (let attempt = 0; ; attempt++) {
                const response = await once(
                    '/oa/v1/chat/completions',
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
                        body: JSON.stringify({
                            model,
                            messages,
                            max_tokens: maxTokens,
                            temperature: 0.3,
                            stream: true,
                        }),
                    },
                    token,
                    signal,
                    textUrl,
                );
                if (response.ok) return chatCompletionText(await response.text());
                if (response.status === 429 && attempt < maxRetries) {
                    const wait = retryWait(response, attempt);
                    await response.text().catch(() => '');
                    await sleep(wait, signal);
                    continue;
                }
                throw await failure(response, token);
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
