// Disk cache of vibe encodings (TZ "Server plugin": key = image hash + model + information
// extracted; a hit costs no Anlas). LRU eviction by a size limit in megabytes. One file per
// encoding plus index.json with sizes and last-use times.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export function sha256Hex(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Cache key. The browser computes the same value (SHA-256 of the base64 text) to look encodings
 * up without uploading the image again.
 * @param {{imageHash: string, model: string, informationExtracted: number, maskHash?: string}} parts
 */
export function vibeKey({ imageHash, model, informationExtracted, maskHash = '' }) {
    const ie = Math.round(Number(informationExtracted) * 100) / 100;
    return sha256Hex(`${imageHash}|${model}|${ie.toFixed(2)}|${maskHash}`);
}

export class VibeCache {
    /**
     * @param {string} dir
     * @param {number} maxBytes
     */
    constructor(dir, maxBytes) {
        this.dir = dir;
        this.maxBytes = maxBytes;
        this.indexFile = path.join(dir, 'index.json');
        fs.mkdirSync(dir, { recursive: true });
        this.index = this.loadIndex();
        this.lastStamp = Math.max(0, ...Object.values(this.index).map((e) => e.lastUsed ?? 0));
    }

    /** Strictly increasing use time, so two uses in the same millisecond keep their order. */
    stamp() {
        this.lastStamp = Math.max(Date.now(), this.lastStamp + 1);
        return this.lastStamp;
    }

    loadIndex() {
        try {
            const raw = JSON.parse(fs.readFileSync(this.indexFile, 'utf8'));
            return raw && typeof raw === 'object' ? raw : {};
        } catch {
            return {};
        }
    }

    saveIndex() {
        fs.writeFileSync(this.indexFile, JSON.stringify(this.index));
    }

    file(key) {
        if (!/^[a-f0-9]{64}$/.test(key)) throw new Error('bad cache key');
        return path.join(this.dir, `${key}.bin`);
    }

    has(key) {
        return Boolean(this.index[key]) && fs.existsSync(this.file(key));
    }

    /** @returns {Buffer | null} */
    get(key) {
        if (!this.index[key]) return null;
        try {
            const data = fs.readFileSync(this.file(key));
            this.index[key].lastUsed = this.stamp();
            this.saveIndex();
            return data;
        } catch {
            delete this.index[key];
            this.saveIndex();
            return null;
        }
    }

    /** @param {string} key @param {Buffer} data */
    set(key, data) {
        fs.writeFileSync(this.file(key), data);
        this.index[key] = { size: data.length, lastUsed: this.stamp() };
        this.evict();
        this.saveIndex();
    }

    totalBytes() {
        return Object.values(this.index).reduce((sum, entry) => sum + (entry.size ?? 0), 0);
    }

    /** Removes the least recently used encodings until the cache fits its limit. */
    evict() {
        const entries = Object.entries(this.index).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
        let total = this.totalBytes();
        for (const [key, entry] of entries) {
            if (total <= this.maxBytes) break;
            try {
                fs.rmSync(this.file(key), { force: true });
            } catch {
                // a missing file only needs its index entry removed
            }
            total -= entry.size ?? 0;
            delete this.index[key];
        }
    }

    stats() {
        return { entries: Object.keys(this.index).length, bytes: this.totalBytes(), maxBytes: this.maxBytes };
    }
}
