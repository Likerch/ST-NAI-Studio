// FIFO queue with concurrency 1 (NovelAI allows one generation at a time per account).
// A task whose signal aborts while waiting is removed without running.

export class Queue {
    constructor(concurrency = 1) {
        this.concurrency = concurrency;
        this.running = 0;
        this.waiting = [];
    }

    get size() {
        return this.waiting.length;
    }

    /**
     * @template T
     * @param {(signal?: AbortSignal) => Promise<T>} task
     * @param {AbortSignal} [signal]
     * @returns {Promise<T>}
     */
    run(task, signal) {
        return new Promise((resolve, reject) => {
            const entry = { task, signal, resolve, reject, onAbort: null };
            if (signal?.aborted) {
                reject(abortError());
                return;
            }
            if (signal) {
                entry.onAbort = () => {
                    const index = this.waiting.indexOf(entry);
                    if (index !== -1) {
                        this.waiting.splice(index, 1);
                        reject(abortError());
                    }
                };
                signal.addEventListener('abort', entry.onAbort, { once: true });
            }
            this.waiting.push(entry);
            this.next();
        });
    }

    next() {
        while (this.running < this.concurrency && this.waiting.length > 0) {
            const entry = this.waiting.shift();
            if (entry.signal && entry.onAbort) {
                entry.signal.removeEventListener('abort', entry.onAbort);
            }
            this.running++;
            Promise.resolve()
                .then(() => entry.task(entry.signal))
                .then(entry.resolve, entry.reject)
                .finally(() => {
                    this.running--;
                    this.next();
                });
        }
    }
}

export function abortError() {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    return error;
}
