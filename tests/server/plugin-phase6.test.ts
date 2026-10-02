// Phase 6 routes of the server plugin against a mock NovelAI: tokenizer files (downloaded once,
// then from the disk cache, unknown names refused) and tag suggestions (no token involved).
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNovelAiClient } from '../../server/lib/novelai.js';
import { Queue } from '../../server/lib/queue.js';
import { FileCache } from '../../server/lib/static-files.js';
import { createTokenReader } from '../../server/lib/token.js';
import { registerRoutes } from '../../server/routes.js';

const hits: Record<string, number> = {};
const authHeaders: (string | undefined)[] = [];
let server: http.Server;
let baseUrl: string;
let cacheDir: string;

beforeAll(async () => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naist-tok-'));
    server = http.createServer((req, res) => {
        const url = req.url ?? '';
        const route = url.split('?')[0] ?? '';
        hits[route] = (hits[route] ?? 0) + 1;
        authHeaders.push(req.headers.authorization);
        if (route === '/tokenizer/compressed/t5_tokenizer.def') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            return res.end(Buffer.from([1, 2, 3, 4]));
        }
        if (route === '/ai/generate-image/suggest-tags') {
            const prompt = new URL(url, 'http://x').searchParams.get('prompt');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(
                JSON.stringify({ tags: [{ tag: `${prompt} hair`, count: 10, confidence: 0.9 }, { bad: true }] }),
            );
        }
        res.writeHead(404);
        res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(cacheDir, { recursive: true, force: true });
});

type Handler = (req: unknown, res: unknown) => unknown;

function mount() {
    const handlers: Record<string, Handler> = {};
    registerRoutes(
        {
            get: (p: string, h: Handler) => (handlers[`GET ${p}`] = h),
            post: (p: string, h: Handler) => (handlers[`POST ${p}`] = h),
        },
        {
            client: createNovelAiClient({ fetch: globalThis.fetch, baseUrl, timeoutMs: 3000, backoffMs: 5 }),
            queue: new Queue(1),
            readToken: createTokenReader({ secrets: null, config: {} }),
            fetch: globalThis.fetch,
            staticUrl: baseUrl,
            imageUrl: baseUrl,
            tokenizerCache: new FileCache(cacheDir),
        },
    );
    return async (route: string, req: { params?: Record<string, string>; query?: Record<string, string> }) => {
        let resolveDone!: () => void;
        const done = new Promise<void>((r) => (resolveDone = r));
        const res = {
            statusCode: 0,
            headers: {} as Record<string, string>,
            payload: undefined as unknown,
            body: undefined as Buffer | undefined,
            writableEnded: false,
            set(k: string, v: string) {
                this.headers[k] = v;
                return this;
            },
            status(code: number) {
                this.statusCode = code;
                return this;
            },
            send(data: Buffer) {
                this.body = data;
                this.writableEnded = true;
                resolveDone();
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
        void handlers[`GET ${route}`]!({ ...req, on: () => {} }, res);
        await done;
        return res;
    };
}

describe('plugin 0.3.0 public files', () => {
    it('downloads a tokenizer once and serves it from the disk cache afterwards', async () => {
        const call = mount();
        const first = await call('/tokenizer/:name', { params: { name: 't5_tokenizer.def' } });
        expect(first.statusCode).toBe(200);
        expect(first.headers['Content-Type']).toBe('application/octet-stream');
        expect([...(first.body ?? [])]).toEqual([1, 2, 3, 4]);
        const second = await mount()('/tokenizer/:name', { params: { name: 't5_tokenizer.def' } });
        expect([...(second.body ?? [])]).toEqual([1, 2, 3, 4]);
        expect(hits['/tokenizer/compressed/t5_tokenizer.def']).toBe(1);
        expect(fs.existsSync(path.join(cacheDir, 't5_tokenizer.def'))).toBe(true);
    });

    it('refuses names outside the three tokenizer files', async () => {
        const call = mount();
        for (const name of ['../config.json', 'gpt2_tokenizer.def', '']) {
            const res = await call('/tokenizer/:name', { params: { name } });
            expect(res.statusCode).toBe(404);
        }
    });

    it('answers 502 when NovelAI does not have the file', async () => {
        const res = await mount()('/tokenizer/:name', { params: { name: 'qwen35_tokenizer.def' } });
        expect(res.statusCode).toBe(502);
    });

    it('passes NovelAI tag suggestions through, without any token', async () => {
        const res = await mount()('/suggest-tags', { query: { model: 'nai-diffusion-4-5-full', prompt: 'red' } });
        expect(res.payload).toEqual({ tags: [{ tag: 'red hair', count: 10, confidence: 0.9 }] });
        expect(authHeaders.every((h) => h === undefined)).toBe(true);
    });
});
