// Phase 5 routes of the server plugin against a mock NovelAI: vibe encoding with the disk cache
// (a repeat costs nothing), Director Tools ZIP pass-through, upscale, SSE streaming, cancellation.
import fs from 'node:fs';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createNovelAiClient } from '../../server/lib/novelai.js';
import { Queue } from '../../server/lib/queue.js';
import { createTokenReader } from '../../server/lib/token.js';
import { sha256Hex, VibeCache, vibeKey } from '../../server/lib/vibe-cache.js';
import { registerRoutes } from '../../server/routes.js';

const TOKEN = 'pst-test-token-not-real-1111111111111111111111111111111111111111';
const PNG_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const hits: Record<string, number> = {};
const bodies: Record<string, unknown> = {};
let server: http.Server;
let baseUrl: string;
let cacheDir: string;

function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => (data += chunk));
        req.on('end', () => resolve(data ? JSON.parse(data) : {}));
    });
}

beforeAll(async () => {
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naist-vibes-'));
    server = http.createServer(async (req, res) => {
        const url = req.url ?? '';
        hits[url] = (hits[url] ?? 0) + 1;
        const body = await readJson(req);
        bodies[url] = body;
        if (url === '/ai/encode-vibe') {
            if (body.image === 'fail') {
                res.writeHead(402, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ statusCode: 402, message: 'Not enough Anlas' }));
            }
            res.writeHead(200, { 'Content-Type': 'application/binary' });
            return res.end(Buffer.from(`encoding-of-${String(body.image).slice(0, 8)}-${body.information_extracted}`));
        }
        if (url === '/ai/augment-image') {
            res.writeHead(200, { 'Content-Type': 'binary/octet-stream' });
            return res.end(Buffer.from('PK\u0003\u0004zip-bytes', 'latin1'));
        }
        if (url === '/ai/upscale') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ images: [{ image: PNG_B64, index: 0 }] }));
        }
        if (url === '/ai/generate-image-stream') {
            if (body.input === 'bad') {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ statusCode: 400, message: 'Validation error' }));
            }
            res.writeHead(200, { 'Content-Type': 'text/event-stream' });
            let step = 0;
            const timer = setInterval(
                () => {
                    step++;
                    if (step <= 3) {
                        res.write(
                            `event: intermediate\ndata: ${JSON.stringify({ event_type: 'intermediate', step_ix: step, image: 'x' })}\n\n`,
                        );
                    } else {
                        res.write(`event: final\ndata: ${JSON.stringify({ event_type: 'final', image: PNG_B64 })}\n\n`);
                        clearInterval(timer);
                        res.end();
                    }
                },
                body.input === 'slow' ? 200 : 5,
            );
            req.on('close', () => clearInterval(timer));
            return;
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

function mount(cache: VibeCache | null) {
    const handlers: Record<string, Handler> = {};
    registerRoutes(
        {
            get: (p: string, h: Handler) => (handlers[`GET ${p}`] = h),
            post: (p: string, h: Handler) => (handlers[`POST ${p}`] = h),
        },
        {
            client: createNovelAiClient({ fetch: globalThis.fetch, baseUrl, timeoutMs: 3000, backoffMs: 5 }),
            queue: new Queue(1),
            readToken: createTokenReader({ secrets: null, config: { token: TOKEN } }),
            vibeCache: cache,
        },
    );
    return async (p: string, body: unknown, closeAfterMs?: number) => {
        let resolveDone!: () => void;
        const done = new Promise<void>((r) => (resolveDone = r));
        const closeListeners: (() => void)[] = [];
        const res = {
            statusCode: 0,
            headersSent: false,
            payload: undefined as unknown,
            chunks: [] as string[],
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
            flushHeaders() {
                this.headersSent = true;
            },
            write(chunk: Buffer | string) {
                this.headersSent = true;
                this.chunks.push(chunk.toString());
                return true;
            },
            end() {
                this.writableEnded = true;
                resolveDone();
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
        };
        void handlers[`POST ${p}`]!({ body, user: { directories: { root: 'x' } }, on: () => {} }, res);
        if (closeAfterMs !== undefined) setTimeout(() => closeListeners.forEach((l) => l()), closeAfterMs);
        await done;
        return res;
    };
}

describe('vibe cache', () => {
    it('evicts the least recently used encodings beyond the size limit and survives a restart', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'naist-lru-'));
        const cache = new VibeCache(dir, 10);
        const a = vibeKey({ imageHash: 'a', model: 'm', informationExtracted: 1 });
        const b = vibeKey({ imageHash: 'b', model: 'm', informationExtracted: 1 });
        const c = vibeKey({ imageHash: 'c', model: 'm', informationExtracted: 1 });
        cache.set(a, Buffer.from('12345'));
        cache.set(b, Buffer.from('12345'));
        cache.get(a);
        cache.set(c, Buffer.from('12345'));
        expect(cache.has(a)).toBe(true);
        expect(cache.has(b)).toBe(false);
        expect(cache.has(c)).toBe(true);
        expect(new VibeCache(dir, 10).get(c)?.toString()).toBe('12345');
        expect(() => cache.get('../../etc')).not.toThrow();
        expect(() => cache.set('../evil', Buffer.from('x'))).toThrow();
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('keys depend on the image, the model, information extracted and the mask', () => {
        const base = { imageHash: sha256Hex('img'), model: 'nai-diffusion-4-5-full', informationExtracted: 1 };
        expect(vibeKey(base)).toBe(vibeKey({ ...base, informationExtracted: 1.0 }));
        expect(vibeKey(base)).not.toBe(vibeKey({ ...base, informationExtracted: 0.7 }));
        expect(vibeKey(base)).not.toBe(vibeKey({ ...base, model: 'nai-diffusion-4-full' }));
        expect(vibeKey(base)).not.toBe(vibeKey({ ...base, maskHash: 'm' }));
    });
});

describe('Phase 5 routes', () => {
    it('encodes a vibe once; the second use comes from the disk cache without calling NovelAI', async () => {
        const call = mount(new VibeCache(cacheDir, 1024 * 1024));
        const request = { image: 'IMAGEDATA123', model: 'nai-diffusion-4-5-full', informationExtracted: 0.7 };
        const first = await call('/encode-vibe', request);
        expect(first.payload).toMatchObject({ cached: false });
        expect(hits['/ai/encode-vibe']).toBe(1);
        expect(bodies['/ai/encode-vibe']).toEqual({
            image: 'IMAGEDATA123',
            model: 'nai-diffusion-4-5-full',
            information_extracted: 0.7,
        });
        const second = await call('/encode-vibe', request);
        expect(second.payload).toMatchObject({ cached: true });
        expect((second.payload as { encoding: string }).encoding).toBe(
            (first.payload as { encoding: string }).encoding,
        );
        expect(hits['/ai/encode-vibe']).toBe(1);
        const lookup = await call('/encode-vibe/lookup', {
            items: [
                { imageHash: sha256Hex('IMAGEDATA123'), model: 'nai-diffusion-4-5-full', informationExtracted: 0.7 },
                { imageHash: sha256Hex('other'), model: 'nai-diffusion-4-5-full', informationExtracted: 0.7 },
            ],
        });
        const results = (lookup.payload as { results: { encoding: string | null }[] }).results;
        expect(results[0]?.encoding).toBe((first.payload as { encoding: string }).encoding);
        expect(results[1]?.encoding).toBeNull();
    });

    it('passes NovelAI errors of a paid encoding through and never retries them', async () => {
        const call = mount(null);
        const res = await call('/encode-vibe', { image: 'fail', model: 'nai-diffusion-4-5-full' });
        expect(res.statusCode).toBe(502);
        expect(res.payload).toMatchObject({ error: { status: 402, message: 'Not enough Anlas' } });
        expect((await call('/encode-vibe', { model: 'x' })).statusCode).toBe(400);
    });

    it('returns the Director Tools ZIP as base64 for the browser to unzip', async () => {
        const call = mount(null);
        const res = await call('/augment', {
            body: { req_type: 'lineart', image: PNG_B64, width: 64, height: 64, use_new_shared_trial: true },
        });
        expect(res.statusCode).toBe(200);
        expect(
            Buffer.from((res.payload as { zip: string }).zip, 'base64')
                .subarray(0, 2)
                .toString(),
        ).toBe('PK');
        expect(bodies['/ai/augment-image']).toMatchObject({ req_type: 'lineart' });
        expect((await call('/augment', { body: { image: 'x' } })).statusCode).toBe(400);
    });

    it('upscales through the new endpoint', async () => {
        const call = mount(null);
        const res = await call('/upscale', { image: PNG_B64, width: 64, height: 64 });
        expect(res.payload).toMatchObject({ images: [{ image: PNG_B64, mime: 'image/png' }] });
        expect(bodies['/ai/upscale']).toMatchObject({ model: 'nai-diffusion-5-curated', declared_blur_sigma: 0 });
    });

    it('streams SSE frames unbuffered and ends with the final image', async () => {
        const call = mount(null);
        const res = await call('/generate-stream', {
            request: {
                input: 'ok',
                model: 'nai-diffusion-4-5-full',
                action: 'generate',
                parameters: { stream: 'sse' },
            },
        });
        expect(res.statusCode).toBe(200);
        expect(res.headers['Content-Type']).toBe('text/event-stream');
        expect(res.headers['Cache-Control']).toBe('no-cache, no-transform');
        const text = res.chunks.join('');
        expect(text.match(/event: intermediate/g)).toHaveLength(3);
        expect(text).toContain('event: final');
    });

    it('answers upstream errors as JSON before the stream starts and stops the stream on disconnect', async () => {
        const call = mount(null);
        const bad = await call('/generate-stream', {
            request: { input: 'bad', model: 'nai-diffusion-4-5-full', action: 'generate', parameters: {} },
        });
        expect(bad.statusCode).toBe(502);
        expect(bad.payload).toMatchObject({ error: { status: 400 } });
        const cut = await call(
            '/generate-stream',
            { request: { input: 'slow', model: 'nai-diffusion-4-5-full', action: 'generate', parameters: {} } },
            300,
        );
        expect(cut.chunks.join('')).not.toContain('event: final');
        expect(cut.chunks.join('')).toContain('event: error');
    });
});
