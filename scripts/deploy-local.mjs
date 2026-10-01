#!/usr/bin/env node
// Copies the built extension and the server plugin into a local SillyTavern.
// Target: --st <dir>, or env NAIST_ST_DIR, or .dev/deploy.json {"stDir": "..."}, or ../st-local-docker.
// Works with a normal ST checkout (public/scripts/extensions/third-party, plugins/) and with the
// Docker layout used for development (./extensions and ./plugins mounted into the container).
// Never copies server/config.json (it may hold a token).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const serverOnly = args.includes('--server-only');
const extensionOnly = args.includes('--extension-only');

function resolveStDir() {
    const flag = args.indexOf('--st');
    if (flag !== -1 && args[flag + 1]) return path.resolve(args[flag + 1]);
    if (process.env.NAIST_ST_DIR) return path.resolve(process.env.NAIST_ST_DIR);
    const local = path.join(repo, '.dev', 'deploy.json');
    if (fs.existsSync(local)) {
        const { stDir } = JSON.parse(fs.readFileSync(local, 'utf8'));
        if (stDir) return path.resolve(repo, stDir);
    }
    return path.resolve(repo, '..', 'st-local-docker');
}

function targets(stDir) {
    const checkout = path.join(stDir, 'public', 'scripts', 'extensions');
    if (fs.existsSync(checkout)) {
        return { extensions: path.join(checkout, 'third-party'), plugins: path.join(stDir, 'plugins') };
    }
    if (fs.existsSync(path.join(stDir, 'extensions'))) {
        return { extensions: path.join(stDir, 'extensions'), plugins: path.join(stDir, 'plugins') };
    }
    throw new Error(`Not a SillyTavern folder: ${stDir}`);
}

function copy(from, to, skip = () => false) {
    const stat = fs.statSync(from);
    if (stat.isDirectory()) {
        fs.mkdirSync(to, { recursive: true });
        for (const entry of fs.readdirSync(from)) {
            if (skip(entry)) continue;
            copy(path.join(from, entry), path.join(to, entry), skip);
        }
    } else {
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(from, to);
    }
}

const stDir = resolveStDir();
const t = targets(stDir);

if (!serverOnly) {
    if (!fs.existsSync(path.join(repo, 'dist', 'index.js'))) {
        throw new Error('dist/index.js is missing: run npm run build first');
    }
    const dest = path.join(t.extensions, 'SillyTavern-NAI-Studio');
    fs.rmSync(dest, { recursive: true, force: true });
    copy(path.join(repo, 'manifest.json'), path.join(dest, 'manifest.json'));
    copy(path.join(repo, 'dist'), path.join(dest, 'dist'));
    copy(path.join(repo, 'src', 'i18n'), path.join(dest, 'src', 'i18n'));
    console.log(`extension -> ${dest} (reload the SillyTavern page)`);
}

if (!extensionOnly) {
    const dest = path.join(t.plugins, 'nai-studio');
    const keep = path.join(dest, 'config.json');
    const savedConfig = fs.existsSync(keep) ? fs.readFileSync(keep) : null;
    fs.rmSync(dest, { recursive: true, force: true });
    copy(path.join(repo, 'server'), dest, (name) => name === 'config.json');
    if (savedConfig) fs.writeFileSync(keep, savedConfig);
    console.log(`server plugin -> ${dest} (restart SillyTavern; enableServerPlugins must be true)`);
}
