// NAI Studio server plugin for SillyTavern (contract: RECON §2.7).
// Install: copy this folder to <ST>/plugins/nai-studio, set enableServerPlugins: true, restart ST.
// Optional config: <ST>/plugins/nai-studio/config.json  { "token": "pst-...", "timeoutMs": 120000, "vibeCacheMb": 200 }
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createNovelAiClient, DEFAULT_BASE_URL } from './lib/novelai.js';
import { Queue } from './lib/queue.js';
import { createTokenReader } from './lib/token.js';
import { VibeCache } from './lib/vibe-cache.js';
import { registerRoutes } from './routes.js';

export const info = {
    id: 'nai-studio',
    name: 'NAI Studio',
    description: 'NovelAI image generation proxy for the NAI Studio extension. Keeps the NovelAI token on the server.',
};

const LOG_PREFIX = '[NAI Studio plugin]';

function loadConfig() {
    try {
        const raw = fs.readFileSync(new URL('./config.json', import.meta.url), 'utf8');
        return JSON.parse(raw);
    } catch {
        return {};
    }
}

/** SillyTavern's own secrets module, two levels up from plugins/<name>/. Null outside ST. */
async function loadSecretsModule() {
    try {
        return await import(new URL('../../src/endpoints/secrets.js', import.meta.url).href);
    } catch {
        return null;
    }
}

/** ST's node-fetch honours requestProxy and the private-address filter; Node's fetch does not. */
async function loadFetch() {
    try {
        const mod = await import('node-fetch');
        return mod.default;
    } catch {
        return globalThis.fetch;
    }
}

export async function init(router) {
    const config = loadConfig();
    const secrets = await loadSecretsModule();
    const fetchImpl = await loadFetch();
    const client = createNovelAiClient({
        fetch: fetchImpl,
        baseUrl: typeof config.baseUrl === 'string' ? config.baseUrl : DEFAULT_BASE_URL,
        timeoutMs: Number(config.timeoutMs) > 0 ? Number(config.timeoutMs) : 120000,
    });
    let vibeCache = null;
    try {
        const megabytes = Number(config.vibeCacheMb) > 0 ? Number(config.vibeCacheMb) : 200;
        vibeCache = new VibeCache(fileURLToPath(new URL('./cache/vibes/', import.meta.url)), megabytes * 1024 * 1024);
    } catch (error) {
        console.warn(LOG_PREFIX, 'vibe cache unavailable:', error?.message ?? error);
    }
    registerRoutes(router, {
        client,
        vibeCache,
        queue: new Queue(1),
        readToken: createTokenReader({ secrets, config }),
        log: (...args) => console.info(LOG_PREFIX, ...args),
    });
    console.info(
        LOG_PREFIX,
        `ready (secrets: ${secrets ? 'ST' : 'unavailable'}, config token: ${config.token ? 'set' : 'not set'})`,
    );
}

export async function exit() {
    // Nothing to release: queued requests end with the process.
}
