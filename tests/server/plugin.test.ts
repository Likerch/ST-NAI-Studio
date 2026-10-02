// Integration tests of the server plugin against a mock NovelAI server (TZ "Integration tests").
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNovelAiClient, redact } from '../../server/lib/novelai.js';
import { Queue } from '../../server/lib/queue.js';
import { createTokenReader } from '../../server/lib/token.js';
import { registerRoutes } from '../../server/routes.js';

const TOKEN = 'pst-test-token-not-real-0000000000000000000000000000000000000000';
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

interface MockState {
    hits: Record<string, number>;
    authHeaders: string[];
    accepts: string[];
}

const state: MockState = { hits: {}, authHeaders: [], accepts: [] };
let server: http.Server;
let baseUrl: string;

function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data ? JSON.parse(data) : {}));
    });
}

beforeAll(async () => {
    server = http.createServer(async (req, res) => {
        state.authHeaders.push(String(req.headers.authorization));
        state.accepts.push(String(req.headers.accept));
        if (req.url === '/user/subscription') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
                JSON.stringify({
                    tier: 3,
                    active: true,
                    paymentProcessorData: { secret: 1 },
                    trainingStepsLeft: { fixedTrainingStepsLeft: 10, purchasedTrainingSteps: 0 },
                }),
            );
            return;
        }
        const body = await readJson(req);
        const scenario = String(body.input);
        state.hits[scenario] = (state.hits[scenario] ?? 0) + 1;
        const send = (status: number, payload: unknown, type = 'application/json') => {
            res.writeHead(status, { 'Content-Type': type });
            res.end(typeof payload === 'string' ? payload : JSON.stringify(payload));
        };
        switch (scenario) {
            case 'ok':
                return send(200, { images: [{ image: PNG_B64, index: 0, seed: 7 }] });
            case 'v500':
                return send(500, { statusCode: 500, message: 'Internal Server Error' });
            case 'validation':
                return send(400, { statusCode: 400, message: 'Validation error: model x does not exist' });
            case 'unauthorized':
                return send(401, { statusCode: 401, message: `Unauthorized ${TOKEN}` });
            case 'rate-then-ok':
                return state.hits[scenario]! < 2
                    ? send(429, { statusCode: 429, message: 'Too many' })
                    : send(200, { images: [{ image: PNG_B64, index: 0 }] });
            case 'flaky':
                return state.hits[scenario]! < 2
                    ? send(503, { statusCode: 503, message: 'busy' })
                    : send(200, { images: [{ image: PNG_B64, index: 0 }] });
            case 'zip':
                return send(200, 'PK\u0003\u0004binary', 'binary/octet-stream');
            case 'slow':
                setTimeout(() => send(200, { images: [{ image: PNG_B64, index: 0 }] }), 400);
                return;
            default:
                return send(404, { statusCode: 404, message: 'unknown scenario' });
        }
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

type Handler = (req: unknown, res: unknown) => unknown;

function mountPlugin(options: { token?: string | null; secretsToken?: string | null; timeoutMs?: number } = {}) {
    const handlers: Record<string, Handler> = {};
    const router = {
        get: (path: string, handler: Handler) => (handlers[`GET ${path}`] = handler),
        post: (path: string, handler: Handler) => (handlers[`POST ${path}`] = handler),
    };
    const secrets = options.secretsToken === undefined ? null : { readSecret: () => options.secretsToken };
    registerRoutes(router, {
        client: createNovelAiClient({
            fetch: globalThis.fetch,
            baseUrl,
            timeoutMs: options.timeoutMs ?? 2000,
            backoffMs: 5,
        }),
        queue: new Queue(1),
        readToken: createTokenReader({
            secrets,
            config: options.token === null ? {} : { token: options.token ?? TOKEN },
        }),
    });
    return async (method: 'GET' | 'POST', path: string, body?: unknown) => {
        let resolveDone!: () => void;
        const done = new Promise<void>((r) => (resolveDone = r));
        const closeListeners: (() => void)[] = [];
        const res = {
            statusCode: 0,
            payload: undefined as unknown,
            headers: {} as Record<string, string>,
            writableEnded: false,
            set(k: string, v: string) {
                this.headers[k] = v;
                return this;
            },
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            json(payload: unknown) {
                this.payload = payload;
                this.writableEnded = true;
                resolveDone();
                return this;
            },
            on(event: string, listener: () => void) {
                if (event === 'close') closeListeners.push(listener);
            },
            close: () => closeListeners.forEach((l) => l()),
        };
        const req = { body, user: { directories: { root: 'x' } }, on: () => {} };
        void handlers[`${method} ${path}`]!(req, res);
        return { res, done };
    };
}

async function call(plugin: ReturnType<typeof mountPlugin>, method: 'GET' | 'POST', path: string, body?: unknown) {
    const { res, done } = await plugin(method, path, body);
    await done;
    return res;
}

const request = (input: string) => ({
    request: { input, model: 'nai-diffusion-4-5-full', action: 'generate', parameters: { width: 64, height: 64 } },
    endpoint: 'generate',
});

describe('NAI Studio server plugin', () => {
    it('health reports version and token source, never the token', async () => {
        const res = await call(mountPlugin(), 'GET', '/health');
        expect(res.payload).toEqual({ ok: true, version: '0.2.0', tokenSource: 'config' });
        expect(JSON.stringify(res.payload)).not.toContain(TOKEN);
        expect(res.headers['Cache-Control']).toBe('no-store');
        expect(
            (await call(mountPlugin({ token: null, secretsToken: 'pst-from-st' }), 'GET', '/health')).payload,
        ).toMatchObject({ tokenSource: 'st-secrets' });
        expect((await call(mountPlugin({ token: null }), 'GET', '/health')).payload).toMatchObject({
            tokenSource: 'none',
        });
    });

    it('generates with JSON response (no ZIP) and the bearer token', async () => {
        const res = await call(mountPlugin(), 'POST', '/generate', request('ok'));
        expect(res.statusCode).toBe(200);
        expect(res.payload).toMatchObject({ images: [{ image: PNG_B64, mime: 'image/png', seed: 7, index: 0 }] });
        expect((res.payload as { correlationId: string }).correlationId).toMatch(/^[A-Za-z1-9]{6}$/);
        expect(state.authHeaders.at(-1)).toBe(`Bearer ${TOKEN}`);
        expect(state.accepts.at(-1)).toBe('application/json');
    });

    it('prefers the ST secret over the config token', async () => {
        await call(mountPlugin({ secretsToken: 'pst-from-st-secrets' }), 'POST', '/generate', request('ok'));
        expect(state.authHeaders.at(-1)).toBe('Bearer pst-from-st-secrets');
    });

    it('passes NovelAI status and message through with HTTP 502 (never 401)', async () => {
        const v500 = await call(mountPlugin(), 'POST', '/generate', request('v500'));
        expect(v500.statusCode).toBe(502);
        expect(v500.payload).toMatchObject({ error: { kind: 'http', status: 500, message: 'Internal Server Error' } });
        const validation = await call(mountPlugin(), 'POST', '/generate', request('validation'));
        expect(validation.payload).toMatchObject({
            error: { status: 400, message: 'Validation error: model x does not exist' },
        });
        const unauthorized = await call(mountPlugin(), 'POST', '/generate', request('unauthorized'));
        expect(unauthorized.statusCode).toBe(502);
        expect(unauthorized.payload).toMatchObject({ error: { status: 401 } });
        expect(JSON.stringify(unauthorized.payload)).not.toContain(TOKEN);
        expect(JSON.stringify(unauthorized.payload)).toContain('<redacted>');
    });

    it('retries 429 always and 5xx only for retryable (free) requests', async () => {
        const rate = await call(mountPlugin(), 'POST', '/generate', request('rate-then-ok'));
        expect(rate.statusCode).toBe(200);
        expect(state.hits['rate-then-ok']).toBe(2);

        const notRetried = await call(mountPlugin(), 'POST', '/generate', { ...request('flaky'), retryable: false });
        expect(notRetried.statusCode).toBe(502);
        expect(state.hits.flaky).toBe(1);
        const retried = await call(mountPlugin(), 'POST', '/generate', { ...request('flaky'), retryable: true });
        expect(retried.statusCode).toBe(200);
        expect(state.hits.flaky).toBe(2);
    });

    it('reports a non-JSON answer with its first bytes', async () => {
        const res = await call(mountPlugin(), 'POST', '/generate', request('zip'));
        expect(res.payload).toMatchObject({ error: { kind: 'invalid-response' } });
        expect((res.payload as { error: { preview: string } }).error.preview.startsWith('504b0304')).toBe(true);
    });

    it('cancels when the browser disconnects, and times out slow answers', async () => {
        const plugin = mountPlugin();
        const { res, done } = await plugin('POST', '/generate', request('slow'));
        setTimeout(() => res.close(), 50);
        await done;
        expect(res.statusCode).toBe(499);
        expect(res.payload).toMatchObject({ error: { kind: 'aborted' } });

        const timedOut = await call(mountPlugin({ timeoutMs: 100 }), 'POST', '/generate', request('slow'));
        expect(timedOut.payload).toMatchObject({ error: { kind: 'timeout' } });
    });

    it('rejects malformed requests, unsupported endpoints and a missing token', async () => {
        expect((await call(mountPlugin(), 'POST', '/generate', { request: { input: 1 } })).statusCode).toBe(400);
        expect(
            (await call(mountPlugin(), 'POST', '/generate', { ...request('ok'), endpoint: 'generate-stream' }))
                .statusCode,
        ).toBe(400);
        const noToken = await call(mountPlugin({ token: null }), 'POST', '/generate', request('ok'));
        expect(noToken.payload).toEqual({ error: { kind: 'token-missing' } });
    });

    it('serves the subscription without payment data', async () => {
        const res = await call(mountPlugin(), 'GET', '/subscription');
        expect(res.payload).toMatchObject({ tier: 3, trainingStepsLeft: { fixedTrainingStepsLeft: 10 } });
        expect(res.payload).not.toHaveProperty('paymentProcessorData');
        expect((await call(mountPlugin({ token: null }), 'GET', '/subscription')).payload).toEqual({
            error: { kind: 'token-missing' },
        });
    });

    it('runs one generation at a time', async () => {
        const queue = new Queue(1);
        const order: string[] = [];
        const task = (name: string, ms: number) => () =>
            new Promise<void>((r) => setTimeout(() => (order.push(name), r()), ms));
        await Promise.all([queue.run(task('a', 30)), queue.run(task('b', 1))]);
        expect(order).toEqual(['a', 'b']);
        const controller = new AbortController();
        const blocker = queue.run(task('c', 30));
        const waiting = queue.run(task('d', 1), controller.signal);
        controller.abort();
        await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
        await blocker;
        await expect(queue.run(task('e', 1), controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('redacts the token from any text', () => {
        expect(redact(`a ${TOKEN} b`, TOKEN)).toBe('a <redacted> b');
        expect(redact('', TOKEN)).toBe('');
        expect(redact('x', null)).toBe('x');
    });
});
