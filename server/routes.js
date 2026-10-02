// HTTP routes of the plugin, mounted by SillyTavern at /api/plugins/nai-studio.
// Every handler catches its own errors: a rejected promise in an Express 4 handler would crash ST.
// Upstream failures are answered with 502 (never 401, which would reset the browser's Basic auth
// on servers with basicAuthMode) and the real NovelAI status inside the JSON body.
import { TEXT_MODELS, UpstreamError, redact } from './lib/novelai.js';
import { loadTokenizer, suggestTags } from './lib/static-files.js';
import { sha256Hex, vibeKey } from './lib/vibe-cache.js';
import { PLUGIN_VERSION } from './lib/version.js';

function send(res, status, body) {
    res.set?.('Cache-Control', 'no-store');
    res.status(status).json(body);
}

function errorBody(error, token) {
    if (error instanceof UpstreamError) {
        return {
            kind: error.kind,
            status: error.status,
            message: redact(error.message, token),
            preview: redact(error.preview, token),
        };
    }
    if (error?.name === 'AbortError') return { kind: 'aborted' };
    return { kind: 'network', message: redact(error?.message ?? String(error), token) };
}

function isImageRequest(value) {
    return (
        value &&
        typeof value === 'object' &&
        typeof value.input === 'string' &&
        typeof value.model === 'string' &&
        typeof value.action === 'string' &&
        value.parameters &&
        typeof value.parameters === 'object'
    );
}

/** Aborts when the browser goes away before the response is written. */
function clientAbortSignal(req, res) {
    const controller = new AbortController();
    const onClose = () => {
        if (!res.writableEnded) controller.abort();
    };
    (res.on ? res : req).on?.('close', onClose);
    return controller.signal;
}

/**
 * @param {{get: Function, post: Function}} router
 * @param {{client: ReturnType<import('./lib/novelai.js').createNovelAiClient>, queue: import('./lib/queue.js').Queue, readToken: Function, vibeCache?: import('./lib/vibe-cache.js').VibeCache | null, log?: Function, fetch?: Function, staticUrl?: string, imageUrl?: string, tokenizerCache?: import('./lib/static-files.js').FileCache | null}} deps
 */
export function registerRoutes(router, deps) {
    const { client, queue, readToken } = deps;
    const vibeCache = deps.vibeCache ?? null;
    const log = deps.log ?? (() => {});

    /** Common shape: token check, abort on disconnect, upstream errors as 502 / 499. */
    function handler(name, run) {
        return async (req, res) => {
            let token = null;
            try {
                ({ token } = readToken(req));
                if (!token) return send(res, 400, { error: { kind: 'token-missing' } });
                await run(req, res, token, clientAbortSignal(req, res));
            } catch (error) {
                const body = errorBody(error, token);
                log(`${name} failed`, body.kind, body.status ?? '', body.message ?? '');
                if (res.headersSent) {
                    res.write?.(`event: error\ndata: ${JSON.stringify(body)}\n\n`);
                    res.end?.();
                    return;
                }
                if (body.kind === 'aborted') return send(res, 499, { error: body });
                send(res, 502, { error: body });
            }
        };
    }

    router.get('/health', (req, res) => {
        try {
            const { source } = readToken(req);
            send(res, 200, { ok: true, version: PLUGIN_VERSION, tokenSource: source });
        } catch (error) {
            send(res, 500, { error: errorBody(error) });
        }
    });

    router.post('/generate', async (req, res) => {
        let token = null;
        try {
            const { request, endpoint = 'generate', retryable = false } = req.body ?? {};
            if (!isImageRequest(request)) {
                return send(res, 400, {
                    error: { kind: 'http', status: 400, message: 'Malformed generation request' },
                });
            }
            if (endpoint !== 'generate') {
                return send(res, 400, {
                    error: {
                        kind: 'http',
                        status: 400,
                        message: `Endpoint ${endpoint} is not supported by plugin ${PLUGIN_VERSION}`,
                    },
                });
            }
            ({ token } = readToken(req));
            if (!token) {
                return send(res, 400, { error: { kind: 'token-missing' } });
            }
            const signal = clientAbortSignal(req, res);
            const result = await queue.run(
                (s) => client.generateImage({ request, token, signal: s, retryable: retryable === true }),
                signal,
            );
            log('generate', request.model, request.action, `${result.images.length} image(s)`, result.correlationId);
            send(res, 200, result);
        } catch (error) {
            const body = errorBody(error, token);
            log('generate failed', body.kind, body.status ?? '', body.message ?? '');
            if (body.kind === 'aborted') return send(res, 499, { error: body });
            send(res, 502, { error: body });
        }
    });

    // Vibe encoding with the disk cache: a hit costs nothing (TZ Phase 5 acceptance).
    router.post(
        '/encode-vibe',
        handler('encode-vibe', async (req, res, token, signal) => {
            const { image, model, informationExtracted = 1, mask } = req.body ?? {};
            if (typeof image !== 'string' || !image || typeof model !== 'string') {
                return send(res, 400, { error: { kind: 'http', status: 400, message: 'Malformed vibe request' } });
            }
            const key = vibeKey({
                imageHash: sha256Hex(image),
                model,
                informationExtracted,
                maskHash: typeof mask === 'string' && mask ? sha256Hex(mask).slice(0, 16) : '',
            });
            const cached = vibeCache?.get(key);
            if (cached) {
                log('encode-vibe cache hit', model);
                return send(res, 200, { key, encoding: cached.toString('base64'), cached: true });
            }
            const encoding = await queue.run(
                (s) => client.encodeVibe({ image, model, informationExtracted, mask, token, signal: s }),
                signal,
            );
            vibeCache?.set(key, encoding);
            log('encode-vibe encoded', model, `${encoding.length} bytes`);
            send(res, 200, { key, encoding: encoding.toString('base64'), cached: false });
        }),
    );

    /** Cached encodings by hash, without uploading the images again. */
    router.post('/encode-vibe/lookup', (req, res) => {
        try {
            const items = Array.isArray(req.body?.items) ? req.body.items : [];
            const results = items.map((item) => {
                const key = vibeKey({
                    imageHash: String(item?.imageHash ?? ''),
                    model: String(item?.model ?? ''),
                    informationExtracted: Number(item?.informationExtracted ?? 1),
                    maskHash: String(item?.maskHash ?? ''),
                });
                const cached = vibeCache?.get(key);
                return { key, encoding: cached ? cached.toString('base64') : null };
            });
            send(res, 200, { results, cache: vibeCache?.stats() ?? null });
        } catch (error) {
            send(res, 500, { error: errorBody(error) });
        }
    });

    router.post(
        '/augment',
        handler('augment', async (req, res, token, signal) => {
            const { body, retryable = false } = req.body ?? {};
            if (
                !body ||
                typeof body !== 'object' ||
                typeof body.req_type !== 'string' ||
                typeof body.image !== 'string'
            ) {
                return send(res, 400, { error: { kind: 'http', status: 400, message: 'Malformed augment request' } });
            }
            const zip = await queue.run(
                (s) => client.augment({ body, token, signal: s, retryable: retryable === true }),
                signal,
            );
            log('augment', body.req_type);
            send(res, 200, { zip });
        }),
    );

    router.post(
        '/upscale',
        handler('upscale', async (req, res, token, signal) => {
            const { image, width, height } = req.body ?? {};
            if (typeof image !== 'string' || !image) {
                return send(res, 400, { error: { kind: 'http', status: 400, message: 'Malformed upscale request' } });
            }
            const images = await queue.run((s) => client.upscale({ image, width, height, token, signal: s }), signal);
            log('upscale', `${width}x${height}`);
            send(res, 200, { images });
        }),
    );

    // Step previews: NovelAI's SSE is passed through unbuffered (no-transform stops ST's gzip).
    router.post(
        '/generate-stream',
        handler('generate-stream', async (req, res, token, signal) => {
            const { request } = req.body ?? {};
            if (!isImageRequest(request)) {
                return send(res, 400, {
                    error: { kind: 'http', status: 400, message: 'Malformed generation request' },
                });
            }
            await queue.run(
                (s) =>
                    client.generateStream({
                        request,
                        token,
                        signal: s,
                        onChunk: (chunk) => {
                            if (!res.headersSent) {
                                res.status(200);
                                res.set('Content-Type', 'text/event-stream');
                                res.set('Cache-Control', 'no-cache, no-transform');
                                res.set('X-Accel-Buffering', 'no');
                                res.flushHeaders?.();
                            }
                            res.write(chunk);
                            res.flush?.();
                        },
                    }),
                signal,
            );
            log('generate-stream done', request.model);
            res.end();
        }),
    );

    /** Tokenizer definition for the token counter: public file from novelai.net, kept on disk. */
    router.get('/tokenizer/:name', async (req, res) => {
        try {
            const { data, cached } = await loadTokenizer({
                name: String(req.params?.name ?? ''),
                cache: deps.tokenizerCache ?? null,
                fetchImpl: deps.fetch ?? globalThis.fetch,
                baseUrl: deps.staticUrl,
                signal: clientAbortSignal(req, res),
            });
            if (!cached) log('tokenizer downloaded', req.params?.name, `${data.length} bytes`);
            res.set('Content-Type', 'application/octet-stream');
            res.set('Cache-Control', 'private, max-age=86400');
            res.status(200).send(data);
        } catch (error) {
            send(res, error?.status === 404 ? 404 : 502, { error: errorBody(error) });
        }
    });

    /** NovelAI tag suggestions for the autocomplete (no token needed). */
    router.get('/suggest-tags', async (req, res) => {
        try {
            const tags = await suggestTags({
                model: req.query?.model ?? '',
                prompt: req.query?.prompt ?? '',
                lang: req.query?.lang,
                fetchImpl: deps.fetch ?? globalThis.fetch,
                baseUrl: deps.imageUrl ?? 'https://image.novelai.net',
                signal: clientAbortSignal(req, res),
            });
            send(res, 200, { tags });
        } catch (error) {
            send(res, 502, { error: errorBody(error) });
        }
    });

    /** NovelAI text model for the human-language prompt converter (TZ Phase 7). */
    router.post(
        '/text',
        handler('text', async (req, res, token, signal) => {
            const { model, messages, max_tokens: maxTokens = 500 } = req.body ?? {};
            const valid =
                TEXT_MODELS.includes(model) &&
                Array.isArray(messages) &&
                messages.length > 0 &&
                messages.length <= 32 &&
                messages.every(
                    (m) => m && ['system', 'user', 'assistant'].includes(m.role) && typeof m.content === 'string',
                );
            if (!valid)
                return send(res, 400, { error: { kind: 'http', status: 400, message: 'Malformed text request' } });
            const limit = Math.min(4096, Math.max(16, Number(maxTokens) || 500));
            const content = await client.chat({ token, model, messages, maxTokens: limit, signal });
            log('text', model, `${content.length} chars`);
            send(res, 200, { content });
        }),
    );

    router.get('/subscription', async (req, res) => {
        let token = null;
        try {
            ({ token } = readToken(req));
            if (!token) return send(res, 400, { error: { kind: 'token-missing' } });
            const data = await client.subscription({ token, signal: clientAbortSignal(req, res) });
            send(res, 200, data);
        } catch (error) {
            send(res, 502, { error: errorBody(error, token) });
        }
    });
}
