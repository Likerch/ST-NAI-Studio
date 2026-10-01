// HTTP routes of the plugin, mounted by SillyTavern at /api/plugins/nai-studio.
// Every handler catches its own errors: a rejected promise in an Express 4 handler would crash ST.
// Upstream failures are answered with 502 (never 401, which would reset the browser's Basic auth
// on servers with basicAuthMode) and the real NovelAI status inside the JSON body.
import { UpstreamError, redact } from './lib/novelai.js';
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
 * @param {{client: ReturnType<import('./lib/novelai.js').createNovelAiClient>, queue: import('./lib/queue.js').Queue, readToken: Function, log?: Function}} deps
 */
export function registerRoutes(router, deps) {
    const { client, queue, readToken } = deps;
    const log = deps.log ?? (() => {});

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
