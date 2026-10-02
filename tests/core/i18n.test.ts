// Localization quality gates (TZ "Localization"): key sync, no Cyrillic literals in code,
// every key used statically or dynamically exists, ST-compatible data-i18n handling.
// @vitest-environment happy-dom
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { localize, setTranslator, t } from '../../src/core/i18n';
import type { NaiErrorCode } from '../../src/core/errors';
import {
    CAMERA_ANGLES,
    DISTANCES,
    FRAMINGS,
    MODELS,
    NOISE_SCHEDULES,
    PAIR_POSES,
    PASSPORT_SLOTS,
    POSE_CATEGORIES,
    POSES,
    QUALITY_PRESETS,
    SAMPLERS,
    STATE_PRESETS,
    TEMPLATE_MODES,
    UC_PRESETS,
    WAND_MODES,
} from '../../src/domain';
import type { DropReason, NotFreeReason, WarningCode } from '../../src/domain';
import type { MigrationKey } from '../../src/features/takeover/migration';
import { IGNORED_ARGS } from '../../src/integration/command-args';
import type { LostFeature } from '../../src/transport';
import en from '../../src/i18n/en-us.json';
import ru from '../../src/i18n/ru-ru.json';

const ROOT = path.resolve(__dirname, '../..');
const EN = en as Record<string, string>;
const RU = ru as Record<string, string>;

function walk(dir: string, exts: string[]): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) return walk(full, exts);
        return exts.some((e) => entry.name.endsWith(e)) ? [full] : [];
    });
}

afterEach(() => setTranslator((text) => text));

describe('locale files', () => {
    it('ru-ru and en-us have the same keys', () => {
        expect(Object.keys(RU).sort()).toEqual(Object.keys(EN).sort());
    });

    it('all keys follow naist.<module>.<key> and no value is empty', () => {
        for (const [key, value] of Object.entries(EN)) {
            expect(key).toMatch(/^naist\.[\w-]+\.[\w.-]+$/);
            expect(value.trim()).not.toBe('');
        }
        for (const value of Object.values(RU)) expect(value.trim()).not.toBe('');
    });

    it('placeholders match between locales', () => {
        const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
        for (const key of Object.keys(EN)) {
            expect(names(RU[key] ?? ''), key).toEqual(names(EN[key] ?? ''));
        }
    });
});

describe('source code', () => {
    it('contains no Cyrillic string literals outside locale files', () => {
        const files = walk(path.join(ROOT, 'src'), ['.ts', '.html', '.css']).concat(
            walk(path.join(ROOT, 'server'), ['.js']),
        );
        const offenders = files.filter((file) => /[Ѐ-ӿ]/.test(fs.readFileSync(file, 'utf8')));
        expect(offenders.map((f) => path.relative(ROOT, f))).toEqual([]);
    });

    it('every static t() key and data-i18n key exists', () => {
        const files = walk(path.join(ROOT, 'src'), ['.ts', '.html']);
        const missing: string[] = [];
        for (const file of files) {
            const text = fs.readFileSync(file, 'utf8');
            for (const m of text.matchAll(/\bt\(\s*'(naist\.[^'$]+)'/g)) if (!(m[1]! in EN)) missing.push(m[1]!);
            for (const m of text.matchAll(/data-i18n="([^"{]+)"/g)) {
                for (const part of m[1]!.split(';')) {
                    const key = part.replace(/^\[[^\]]+\]/, '').trim();
                    if (key && !(key in EN)) missing.push(key);
                }
            }
        }
        expect(missing).toEqual([]);
    });

    it('every dynamically built key exists', () => {
        const errorCodes: NaiErrorCode[] = [
            'unauthorized',
            'token-missing',
            'insufficient-anlas',
            'forbidden',
            'rate-limited',
            'build-error-v4',
            'server-error',
            'unavailable',
            'validation',
            'native-opaque',
            'plugin-unavailable',
            'v5-usage-exhausted',
            'invalid-response',
            'free-only-blocked',
            'price-too-high',
            'busy',
            'no-usable-message',
            'multimodal-failed',
            'prompt-generation-failed',
            'aborted',
            'size-too-large',
            'invalid-seed',
            'missing-image',
            'missing-mask',
            'unsupported-mode',
            'invalid-override',
            'image-not-found',
            'image-load-failed',
            'feature-unavailable',
            'unknown',
        ];
        const drops: DropReason[] = [
            'unsupported-by-model',
            'not-applicable-to-mode',
            'feature-flag-off',
            'exceeds-model-limit',
            'empty',
            'superseded',
        ];
        const warnings: WarningCode[] = [
            'size-rounded',
            'steps-clamped',
            'samples-clamped',
            'sampler-replaced',
            'noise-schedule-forced',
            'coords-disabled',
            'decrisper-disabled',
            'legacy-uc-disabled',
            'inpaint-model-fallback',
        ];
        const notFree: NotFreeReason[] = [
            'not-opus',
            'inactive',
            'too-many-pixels',
            'too-many-steps',
            'character-reference',
            'v5-usage-exhausted',
        ];
        const lost: LostFeature[] = [
            'characters',
            'coordinates',
            'samples',
            'source-image',
            'mask',
            'vibes',
            'character-reference',
            'cfg-rescale',
            'transparency',
            'legacy-uc',
            'stream',
            'mode',
            'override',
        ];
        const migration: MigrationKey[] = [
            'nothing',
            'prefix-moved',
            'prefix-kept',
            'prefix-default-skipped',
            'negative-moved',
            'negative-kept',
            'negative-default-skipped',
            'styles-moved',
            'character-prompts-moved',
            'character-prompts-kept',
            'card-prompts-moved',
            'templates-moved',
            'behaviour-moved',
            'generation-moved',
            'generation-kept',
            'free-only-kept',
            'upscale-not-moved',
            'generation-other-source',
        ];
        // Named /imagine arguments are declared in commands.ts; read their names from the source.
        const commandsSource = fs.readFileSync(path.join(ROOT, 'src/integration/commands.ts'), 'utf8');
        const commandArgs = [...commandsSource.matchAll(/named\('([\w.-]+)'/g)].map((m) => m[1]!).concat(IGNORED_ARGS);
        expect(commandArgs.length).toBeGreaterThan(IGNORED_ARGS.length);
        const keys = [
            ...POSES.map((p) => `naist.pose.${p.id}`),
            ...POSE_CATEGORIES.map((c) => `naist.poseCat.${c}`),
            ...FRAMINGS.map((f) => `naist.framing.${f.id}`),
            ...CAMERA_ANGLES.map((f) => `naist.camera.${f.id}`),
            ...DISTANCES.map((f) => `naist.distance.${f.id}`),
            ...PAIR_POSES.map((p) => `naist.pair.${p.id}`),
            ...Object.keys(STATE_PRESETS).map((s) => `naist.state.${s}`),
            ...PASSPORT_SLOTS.map((s) => `naist.slot.${s}`),
            ...['gridHint', 'freeHint', 'noPositions'].map((k) => `naist.composer.${k}`),
            ...[...TEMPLATE_MODES, ...WAND_MODES].map((m) => `naist.mode.${m}`),
            ...migration.map((k) => `naist.migration.${k}`),
            ...commandArgs.map((a) => `naist.command.arg.${a}`),
            ...errorCodes.flatMap((c) => [`naist.error.${c}.title`, `naist.error.${c}.text`]),
            ...drops.map((d) => `naist.drop.${d}`),
            ...warnings.map((w) => `naist.warning.${w}`),
            ...notFree.map((n) => `naist.notFree.${n}`),
            ...lost.map((l) => `naist.lost.${l}`),
            ...UC_PRESETS.map((u) => `naist.ucPreset.${u}`),
            ...QUALITY_PRESETS.map((q) => `naist.quality.${q}`),
            ...SAMPLERS.map((s) => `naist.sampler.${s}`),
            ...NOISE_SCHEDULES.map((n) => `naist.schedule.${n}`),
            ...MODELS.map((m) => m.nameKey),
            ...['steps', 'size', 'samples', 'character-references-removed', 'vibes-trimmed'].map(
                (k) => `naist.clamp.${k}`,
            ),
            ...[
                'open-inspector',
                'open-token-help',
                'enable-free-only',
                'retry',
                'switch-to-v45',
                'install-plugin',
                'check-st-log',
            ].map((a) => `naist.action.${a}`),
            ...['open-token-help', 'install-plugin', 'check-st-log'].map((a) => `naist.help.${a}`),
            ...['st-secrets', 'config', 'none'].map((s) => `naist.token.${s}`),
            ...[0, 1, 2, 3].map((n) => `naist.tier.${n}`),
            ...['normal', 'large', 'wallpaper', 'small', 'portrait', 'landscape', 'square', 'custom'].map(
                (s) => `naist.size.${s}`,
            ),
            ...['plugin', 'native'].map((s) => `naist.transport.${s}`),
        ];
        expect(keys.filter((k) => !(k in EN))).toEqual([]);
    });
});

describe('t() and localize()', () => {
    it('falls back to English, then to the key, and interpolates', () => {
        expect(t('naist.cost.paid', { total: 30, perImage: 30, billable: 1 })).toBe('Costs 30 Anlas (30 × 1)');
        expect(t('naist.no.such')).toBe('naist.no.such');
        expect(t('naist.panel.charactersLimit', { count: 1 })).toBe('1 / {max}');
    });

    it('uses the host translator (SillyTavern locale data) when it has the key', () => {
        setTranslator((text, key) => RU[key] ?? text);
        expect(t('naist.panel.generate')).toBe(RU['naist.panel.generate']);
    });

    it('fills text and attributes like SillyTavern data-i18n', () => {
        document.body.innerHTML = `<div id="r"><b data-i18n="naist.panel.title"></b><input data-i18n="[placeholder]naist.panel.promptPlaceholder;[title]naist.panel.prompt"><span data-i18n="naist.panel.charactersLimit" data-i18n-params='{"count":2,"max":6}'></span><i data-i18n="naist.panel.title" data-i18n-params="{bad"></i></div>`;
        const root = document.getElementById('r')!;
        localize(root);
        expect(root.querySelector('b')!.textContent).toBe('NAI Studio');
        expect(root.querySelector('input')!.getAttribute('placeholder')).toBe(EN['naist.panel.promptPlaceholder']);
        expect(root.querySelector('input')!.getAttribute('title')).toBe(EN['naist.panel.prompt']);
        expect(root.querySelector('span')!.textContent).toBe('2 / 6');
        expect(root.querySelector('i')!.textContent).toBe('NAI Studio');
    });
});
