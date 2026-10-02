// Phase 7 route of the server plugin against a mock NovelAI text API: chat completions are read
// from the event stream, the token stays on the server, bad requests are refused, 429 is retried.
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { chatCompletionText, createNovelAiClient } from '../../server/lib/novelai.js';
import { Queue } from '../../server/lib/queue.js';
import { createTokenReader } from '../../server/lib/token.js';
import { registerRoutes } from '../../server/routes.js';

const TOKEN = 'pst-test-token';
let server: http.Server;
let textUrl: string;
let requests: { auth?: string; body: Record<string, unknown> }[] = [];
let mode: 'stream' | 'json' | 'busy-once' | 'error' = 'stream';
let busy = 0;

function sse(parts: string[]): string {
    return [
        ...parts.map((p) => `data: ${JSON.stringify({ choices: [{ delta: { content: p } }] })}`),
        `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'thinking' } }] })}`,
        'data: [DONE]',
        '',
    ].join('\n\n');
}

beforeAll(async () => {
    server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (chunk) => (raw += chunk));
        req.on('end', () => {
            if (req.url !== '/oa/v1/chat/completions') {
                res.writeHead(404);
                return res.end();
            }
            requests.push({ auth: req.headers.authorization, body: JSON.parse(raw) });
            if (mode === 'busy-once' && busy++ === 0) {
                res.writeHead(429, { 'Content-Type': 'application/json' });
                return res.end('{"message":"Too many requests"}');
            }
            if (mode === 'error') {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ message: `bad token ${TOKEN}` }));
            }
            if (mode === 'json') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ choices: [{ message: { content: '{"tags":["cat"]}' } }] }));
            }
            res.writeHead(200, { 'Content-Type': 'text/event-stream' });
            res.end(sse(['{"tags": ["1girl",', ' "smile"], "sentence": "She smiles."}']));
        });
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    textUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
    requests = [];
    mode = 'stream';
    busy = 0;
});

type Handler = (req: unknown, res: unknown) => unknown;

async function post(body: unknown, token: string | null = TOKEN) {
    const handlers: Record<string, Handler> = {};
    registerRoutes(
        {
            get: (p: string, h: Handler) => (handlers[`GET ${p}`] = h),
            post: (p: string, h: Handler) => (handlers[`POST ${p}`] = h),
        },
        {
            client: createNovelAiClient({
                fetch: globalThis.fetch,
                baseUrl: 'http://127.0.0.1:1',
                textUrl,
                timeoutMs: 3000,
                backoffMs: 5,
            }),
            queue: new Queue(1),
            readToken: createTokenReader({ secrets: null, config: token === null ? {} : { token } }),
        },
    );
    let resolveDone!: () => void;
    const done = new Promise<void>((r) => (resolveDone = r));
    const res = {
        statusCode: 0,
        payload: undefined as unknown,
        writableEnded: false,
        set() {
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
        on() {},
    };
    void handlers['POST /text']!({ body, on: () => {} }, res);
    await done;
    return res;
}

const MESSAGES = [
    { role: 'system', content: 'Convert to tags.' },
    { role: 'user', content: 'a smiling girl' },
];

describe('plugin 0.4.0 text route', () => {
    it('collects the streamed answer and keeps the token on the server', async () => {
        const res = await post({ model: 'glm-4-6', messages: MESSAGES, max_tokens: 300 });
        expect(res.statusCode).toBe(200);
        expect(res.payload).toEqual({ content: '{"tags": ["1girl", "smile"], "sentence": "She smiles."}' });
        expect(requests[0]!.auth).toBe(`Bearer ${TOKEN}`);
        expect(requests[0]!.body).toMatchObject({
            model: 'glm-4-6',
            max_tokens: 300,
            stream: true,
            messages: MESSAGES,
        });
    });

    it('reads a plain JSON answer too and retries a busy API', async () => {
        mode = 'json';
        expect((await post({ model: 'xialong-v1', messages: MESSAGES })).payload).toEqual({
            content: '{"tags":["cat"]}',
        });
        mode = 'busy-once';
        const res = await post({ model: 'glm-4-6', messages: MESSAGES });
        expect(res.statusCode).toBe(200);
        expect(requests.length).toBe(3);
    });

    it('refuses unknown models, malformed messages and a missing token', async () => {
        expect((await post({ model: 'gpt-4', messages: MESSAGES })).statusCode).toBe(400);
        expect((await post({ model: 'glm-4-6', messages: [{ role: 'tool', content: 'x' }] })).statusCode).toBe(400);
        expect((await post({ model: 'glm-4-6', messages: [] })).statusCode).toBe(400);
        expect((await post({ model: 'glm-4-6', messages: MESSAGES }, null)).payload).toEqual({
            error: { kind: 'token-missing' },
        });
        expect(requests).toHaveLength(0);
    });

    it('answers 502 with the NovelAI status and never echoes the token', async () => {
        mode = 'error';
        const res = await post({ model: 'glm-4-6', messages: MESSAGES });
        expect(res.statusCode).toBe(502);
        expect(res.payload).toMatchObject({ error: { kind: 'http', status: 401 } });
        expect(JSON.stringify(res.payload)).not.toContain(TOKEN);
    });
});

describe('chatCompletionText', () => {
    it('joins deltas, skips reasoning and broken chunks', () => {
        expect(
            chatCompletionText(
                'data: {"choices":[{"delta":{"content":"a"}}]}\n\ndata: oops\n\ndata: {"choices":[{"delta":{"content":"b"}}]}\n\ndata: [DONE]',
            ),
        ).toBe('ab');
        expect(chatCompletionText('')).toBe('');
    });
});
