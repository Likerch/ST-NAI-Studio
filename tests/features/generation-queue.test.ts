// The one NovelAI queue (v0.13.1): strictly one request in flight, priorities (user > reply >
// portrait > background) and first come first served within one, transparent retries of a busy
// NovelAI (429) with backoff and Retry-After, the error after three retries, nothing retried for the
// account's own errors, cancellation (abort, chat change, deleted message, "Clear the queue").
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { NaiError } from '../../src/core/errors';
import { GenerationQueue, isBusyAnswer, retryAfterSeconds } from '../../src/features/generation/queue';
import type { QueueJob, QueueStatus } from '../../src/features/generation/queue';
import { TransportError } from '../../src/transport';

vi.mock('../../src/core/i18n', () => ({ t: (key: string) => key }));

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function deferred<T = string>() {
    let resolve!: (value: T) => void;
    let reject!: (error: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

/** A queue whose retry waits are recorded and pass at once. */
function queue(options: { random?: () => number } = {}) {
    const waits: number[] = [];
    const q = new GenerationQueue({
        random: options.random ?? (() => 0.5),
        sleep: async (ms, signal) => {
            waits.push(ms);
            await settle();
            if (signal.aborted) throw new NaiError('aborted', 'none');
        },
    });
    return { q, waits };
}

const busy = () => new TransportError('http', { status: 429, serverMessage: 'Concurrent generation is locked' });

describe('one request at a time', () => {
    it('runs strictly one request at a time, the most urgent first, in arrival order within a priority', async () => {
        const { q } = queue();
        const order: string[] = [];
        let inFlight = 0;
        let most = 0;
        const first = deferred();
        const job = (name: string, wait?: Promise<string>) => async () => {
            inFlight++;
            most = Math.max(most, inFlight);
            order.push(name);
            if (wait) await wait;
            await settle();
            inFlight--;
            return name;
        };
        const runs = [q.run({ priority: 'reply', kind: 'marker' }, job('marker 1', first.promise))];
        await settle();
        expect(q.busy).toBe(true);
        runs.push(
            q.run({ priority: 'background', kind: 'comic' }, job('comic')),
            q.run({ priority: 'portrait', kind: 'portrait' }, job('portrait')),
            q.run({ priority: 'reply', kind: 'marker' }, job('marker 2')),
            q.run({ priority: 'user' }, job('composer')),
            q.run({ priority: 'reply', kind: 'marker' }, job('marker 3')),
            q.run({}, job('panel')),
        );
        expect(q.snapshot()).toMatchObject({
            running: { kind: 'marker', priority: 'reply', retryIn: null },
            waiting: [
                { priority: 'user', kind: 'picture' },
                { priority: 'user', kind: 'picture' },
                { priority: 'reply' },
                { priority: 'reply' },
                { priority: 'portrait' },
                { priority: 'background' },
            ],
        });
        first.resolve('done');
        expect(await Promise.all(runs)).toEqual([
            'marker 1',
            'comic',
            'portrait',
            'marker 2',
            'composer',
            'marker 3',
            'panel',
        ]);
        expect(order).toEqual(['marker 1', 'composer', 'panel', 'marker 2', 'marker 3', 'portrait', 'comic']);
        expect(most).toBe(1);
        expect(q.busy).toBe(false);
        expect(q.snapshot()).toEqual({ running: null, waiting: [] });
    });

    it('tells every request where it waits', async () => {
        const { q } = queue();
        const first = deferred();
        const statuses: QueueStatus[][] = [[], []];
        const one = q.run({ onStatus: (s) => statuses[0]!.push(s) }, () => first.promise);
        const two = q.run({ priority: 'portrait', onStatus: (s) => statuses[1]!.push(s) }, async () => 'two');
        await settle();
        expect(statuses[0]).toEqual([{ state: 'running' }]);
        expect(statuses[1]!.at(-1)).toEqual({ state: 'queued', ahead: 1 });
        const listener = vi.fn();
        const off = q.subscribe(listener);
        first.resolve('one');
        expect(await Promise.all([one, two])).toEqual(['one', 'two']);
        expect(statuses[0]!.at(-1)).toEqual({ state: 'done' });
        expect(statuses[1]).toContainEqual({ state: 'running' });
        expect(listener).toHaveBeenCalled();
        off();
    });
});

describe('a busy NovelAI', () => {
    it('sends the request again after a 429, keeping its turn', async () => {
        const { q, waits } = queue();
        const statuses: QueueStatus[] = [];
        const task = vi.fn().mockRejectedValueOnce(busy()).mockResolvedValueOnce('picture');
        const after = vi.fn(async () => 'next');
        const result = q.run({ onStatus: (s) => statuses.push(s) }, task);
        const next = q.run({ priority: 'user' }, after);
        expect(await result).toBe('picture');
        expect(task).toHaveBeenCalledTimes(2);
        expect(waits).toEqual([2000]);
        expect(statuses).toContainEqual({ state: 'retry', seconds: 2, attempt: 1 });
        // The next request waited for the retry instead of overtaking it.
        expect(after.mock.invocationCallOrder[0]!).toBeGreaterThan(task.mock.invocationCallOrder[1]!);
        expect(await next).toBe('next');
    });

    it('waits about 2, 5 and 12 s, then shows the error', async () => {
        const { q, waits } = queue({ random: () => 0 });
        const error = new NaiError('rate-limited', 'retry', { status: 429 }, 429);
        const task = vi.fn(async () => {
            throw error;
        });
        await expect(q.run({}, task)).rejects.toBe(error);
        expect(task).toHaveBeenCalledTimes(4);
        // Jitter of -20 %.
        expect(waits).toEqual([1600, 4000, 9600]);
    });

    it('waits as long as the server asks (Retry-After), within a minute', async () => {
        const { q, waits } = queue();
        const task = vi
            .fn()
            .mockRejectedValueOnce(new TransportError('http', { status: 429, retryAfter: 9 }))
            .mockRejectedValueOnce(new NaiError('rate-limited', 'retry', { status: 429, retryAfter: 600 }, 429))
            .mockResolvedValueOnce('ok');
        expect(await q.run({}, task)).toBe('ok');
        expect(waits).toEqual([9000, 60000]);
    });

    it('never retries the account own errors or aborted requests', async () => {
        const { q, waits } = queue();
        for (const error of [
            new NaiError('unauthorized', 'open-token-help', { status: 401 }, 401),
            new NaiError('insufficient-anlas', 'enable-free-only', { status: 402 }, 402),
            new NaiError('validation', 'open-inspector', { status: 400 }, 400),
            new TransportError('aborted'),
            new Error('boom'),
        ]) {
            const task = vi.fn(async () => {
                throw error;
            });
            await expect(q.run({}, task)).rejects.toBe(error);
            expect(task).toHaveBeenCalledTimes(1);
        }
        expect(waits).toEqual([]);
    });

    it('recognises busy answers', () => {
        expect(isBusyAnswer(busy())).toBe(true);
        expect(isBusyAnswer(new NaiError('rate-limited', 'retry', { status: 429 }, 429))).toBe(true);
        expect(isBusyAnswer(new TransportError('http', { status: 500, bodyPreview: 'Too Many Requests' }))).toBe(true);
        expect(isBusyAnswer(new NaiError('unknown', 'none', { server: 'concurrent generation is locked' }))).toBe(true);
        expect(isBusyAnswer(new NaiError('unauthorized', 'none', { server: 'too many requests' }, 401))).toBe(false);
        expect(isBusyAnswer(new NaiError('unavailable', 'retry', { status: 503 }, 503))).toBe(false);
        expect(isBusyAnswer(null)).toBe(false);
        expect(isBusyAnswer('429')).toBe(false);
        expect(retryAfterSeconds(new TransportError('http', { status: 429, retryAfter: 3 }))).toBe(3);
        expect(retryAfterSeconds(new NaiError('rate-limited', 'retry', { retryAfter: 'x' }))).toBeUndefined();
        expect(retryAfterSeconds(undefined)).toBeUndefined();
    });

    it('shows the countdown to the retry in the snapshot', async () => {
        let now = 1000;
        const gate = deferred<void>();
        const q = new GenerationQueue({ now: () => now, random: () => 0.5, sleep: () => gate.promise });
        const task = vi.fn().mockRejectedValueOnce(busy()).mockResolvedValueOnce('ok');
        const run = q.run({ kind: 'marker' }, task);
        await settle();
        expect(q.snapshot().running).toMatchObject({ kind: 'marker', retryIn: 2 });
        now += 1500;
        expect(q.snapshot().running?.retryIn).toBe(1);
        gate.resolve();
        expect(await run).toBe('ok');
    });
});

describe('cancellation', () => {
    async function blocked(q: GenerationQueue) {
        const first = deferred();
        const running = q.run({ chatId: 'a' }, () => first.promise);
        await settle();
        return { first, running };
    }

    it('drops a waiting request whose signal aborts, and aborts the running one', async () => {
        const { q } = queue();
        const { first, running } = await blocked(q);
        const abort = new AbortController();
        const task = vi.fn(async () => 'never');
        const waiting = q.run({ signal: abort.signal }, task);
        abort.abort();
        await expect(waiting).rejects.toMatchObject({ code: 'aborted' });
        expect(q.size).toBe(0);
        first.resolve('first');
        expect(await running).toBe('first');
        expect(task).not.toHaveBeenCalled();

        // Already aborted: refused at once.
        await expect(q.run({ signal: abort.signal }, task)).rejects.toMatchObject({ code: 'aborted' });

        // The running request gets the abort through its signal.
        const own = new AbortController();
        const seen: AbortSignal[] = [];
        const inFlight = q.run(
            { signal: own.signal },
            (signal) =>
                new Promise((_, reject) => {
                    seen.push(signal);
                    signal.addEventListener('abort', () => reject(new TransportError('aborted')));
                }),
        );
        await settle();
        own.abort();
        await expect(inFlight).rejects.toMatchObject({ kind: 'aborted' });
        expect(seen[0]!.aborted).toBe(true);
    });

    it('stops waiting for a retry when aborted', async () => {
        const q = new GenerationQueue({ random: () => 0.5 });
        const abort = new AbortController();
        const task = vi.fn(async () => {
            throw busy();
        });
        const run = q.run({ signal: abort.signal }, task);
        await settle();
        expect(q.snapshot().running?.retryIn).toBe(2);
        abort.abort();
        await expect(run).rejects.toMatchObject({ code: 'aborted' });
        expect(task).toHaveBeenCalledTimes(1);
        expect(q.busy).toBe(false);
    });

    it('drops the requests of another chat and of deleted messages, the running one finishes', async () => {
        const { q } = queue();
        const { first, running } = await blocked(q);
        let deleted = false;
        const jobs: [QueueJob, () => Promise<string>][] = [
            [{ chatId: 'a' }, vi.fn(async () => 'a')],
            [{ chatId: 'b' }, vi.fn(async () => 'b')],
            [{}, vi.fn(async () => 'no chat')],
            [{ chatId: 'b', stale: () => deleted }, vi.fn(async () => 'deleted')],
            [
                {
                    chatId: 'b',
                    stale: () => {
                        throw new Error('broken check');
                    },
                },
                vi.fn(async () => 'kept'),
            ],
        ];
        const runs = jobs.map(([job, task]) => q.run(job, task).catch((error: NaiError) => error.code));
        expect(q.dropOtherChats('b')).toBe(1);
        deleted = true;
        expect(q.revalidate()).toBe(1);
        expect(q.size).toBe(3);
        first.resolve('first');
        expect(await running).toBe('first');
        expect(await Promise.all(runs)).toEqual(['aborted', 'b', 'no chat', 'aborted', 'kept']);
    });

    it('drops a request whose message went away before its turn', async () => {
        const { q } = queue();
        const { first } = await blocked(q);
        let gone = false;
        const task = vi.fn(async () => 'late');
        const run = q.run({ stale: () => gone }, task);
        const next = q.run({}, async () => 'next');
        gone = true;
        first.resolve('first');
        await expect(run).rejects.toMatchObject({ code: 'aborted' });
        expect(await next).toBe('next');
        expect(task).not.toHaveBeenCalled();
    });

    it('clears the waiting requests and cancels the running one', async () => {
        const { q } = queue();
        const statuses: QueueStatus[] = [];
        const running = q.run(
            {},
            (signal) =>
                new Promise((_, reject) =>
                    signal.addEventListener('abort', () => reject(new TransportError('aborted'))),
                ),
        );
        const waiting = [q.run({ onStatus: (s) => statuses.push(s) }, async () => 'x'), q.run({}, async () => 'y')];
        expect(q.clear()).toBe(2);
        expect(q.clear()).toBe(0);
        for (const run of waiting) await expect(run).rejects.toMatchObject({ code: 'aborted' });
        expect(statuses.at(-1)).toEqual({ state: 'done' });
        q.cancelRunning();
        await expect(running).rejects.toMatchObject({ kind: 'aborted' });
        q.cancelRunning();
    });
});

describe('every NovelAI image request goes through the queue', () => {
    const ROOT = path.resolve(__dirname, '../..');
    const sources = (dir: string): string[] =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) return sources(full);
            return entry.name.endsWith('.ts') ? [full] : [];
        });

    it('sends generations, Director Tools, upscales and vibe encodings only from inside the queue', () => {
        const outside: string[] = [];
        const files = sources(path.join(ROOT, 'src')).filter((f) => !f.includes(`${path.sep}transport${path.sep}`));
        for (const file of files) {
            const lines = fs.readFileSync(file, 'utf8').split('\n');
            lines.forEach((line, i) => {
                const request =
                    /extras!?\.(augment|upscale|encodeVibe)\(/.test(line) ||
                    (/\bsendPrepared\(/.test(line) && !/export async function sendPrepared/.test(line));
                if (!request) return;
                const before = lines.slice(Math.max(0, i - 5), i + 1).join('\n');
                if (!/(generationQueue|this\.queue)\.run\(/.test(before))
                    outside.push(`${path.relative(ROOT, file)}:${i + 1}`);
            });
        }
        expect(outside).toEqual([]);
        // The transport's own generate() is called by sendPrepared alone.
        const callers = files.filter((f) => /transport\.generate\(/.test(fs.readFileSync(f, 'utf8')));
        expect(callers.map((f) => path.relative(ROOT, f).split(path.sep).join('/'))).toEqual([
            'src/features/generation/service.ts',
        ]);
    });
});
