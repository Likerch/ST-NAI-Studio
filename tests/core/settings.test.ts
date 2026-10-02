import merge from 'lodash/merge';
import { describe, expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, defaultSettings, MIGRATIONS, migrateAndFill } from '../../src/core/settings-schema';

describe('settings schema', () => {
    it('fresh install gets defaults with free-only on and no token field anywhere', () => {
        const { settings, migrated, fromVersion } = migrateAndFill(undefined, merge);
        expect(settings).toEqual(defaultSettings());
        expect(settings.anlas.freeOnly).toBe(true);
        expect(fromVersion).toBe(0);
        expect(migrated).toBe(true);
        expect(JSON.stringify(settings)).not.toMatch(/token|pst-/i);
    });

    it('fills keys added in newer versions without touching user values', () => {
        const stored = {
            schemaVersion: CURRENT_SCHEMA_VERSION,
            generation: { prompt: 'cat', steps: 28 },
            anlas: { freeOnly: false },
        };
        const { settings, migrated } = migrateAndFill(stored, merge);
        expect(migrated).toBe(false);
        expect(settings.generation.prompt).toBe('cat');
        expect(settings.generation.steps).toBe(28);
        expect(settings.generation.sampler).toBe('k_euler_ancestral');
        expect(settings.anlas.freeOnly).toBe(false);
        expect(settings.anlas.confirmAbove).toBe(0);
    });

    it('v10 gives existing settings the undesired content of explicit scenes, a user value stays', () => {
        const old = migrateAndFill({ schemaVersion: 9, scene: { allowNsfw: true } }, merge).settings;
        expect(old.schemaVersion).toBe(10);
        expect(old.scene.allowNsfw).toBe(true);
        expect(old.scene.explicitNegative).toBe('child, loli, shota, underage');
        const own = migrateAndFill(
            { schemaVersion: 10, scene: { explicitNegative: 'loli, shota, flat chest' } },
            merge,
        );
        expect(own.settings.scene.explicitNegative).toBe('loli, shota, flat chest');
    });

    it('keeps the stored characters array as is (no index-wise merge)', () => {
        const chars = [{ prompt: 'a', negative: '', x: 0.3, y: 0.5, enabled: true }];
        const { settings } = migrateAndFill({ schemaVersion: 1, generation: { characters: chars } }, merge);
        expect(settings.generation.characters).toEqual(chars);
    });

    it('does not mutate the stored object', () => {
        const stored = { generation: { prompt: 'x' } };
        migrateAndFill(stored, merge);
        expect(stored).toEqual({ generation: { prompt: 'x' } });
    });

    it('leaves settings from a newer version unmigrated (no downgrade)', () => {
        const { settings, migrated, fromVersion } = migrateAndFill(
            { schemaVersion: CURRENT_SCHEMA_VERSION + 1, generation: { prompt: 'future' } },
            merge,
        );
        expect(migrated).toBe(false);
        expect(fromVersion).toBe(CURRENT_SCHEMA_VERSION + 1);
        expect(settings.generation.prompt).toBe('future');
    });

    it('treats non-object input as empty', () => {
        expect(migrateAndFill('garbage', merge).settings).toEqual(defaultSettings());
    });

    describe('migrations', () => {
        it('are ordered and end at the current schema version', () => {
            const versions = MIGRATIONS.map((m) => m.to);
            expect(versions).toEqual([...versions].sort((a, b) => a - b));
            expect(versions.at(-1)).toBe(CURRENT_SCHEMA_VERSION);
        });

        it('v1: stamps the schema version on pre-versioned settings', () => {
            const v1 = MIGRATIONS.find((m) => m.to === 1)!;
            expect(v1.migrate({ generation: { prompt: 'p' } })).toEqual({
                generation: { prompt: 'p' },
                schemaVersion: 1,
            });
        });

        it('v2: moves output.hiddenFromPrompt=false into chat.visibility.panel', () => {
            const { settings, migrated, fromVersion } = migrateAndFill(
                { schemaVersion: 1, output: { hiddenFromPrompt: false }, generation: { prompt: 'p' } },
                merge,
            );
            expect(migrated).toBe(true);
            expect(fromVersion).toBe(1);
            expect(settings.chat.visibility.panel).toBe(true);
            expect(settings.chat.visibility.command).toBe(false);
            expect(settings).not.toHaveProperty('output');
            expect(settings.generation.prompt).toBe('p');
        });

        it('v2: hidden panel output stays hidden and v2 sections get defaults', () => {
            const { settings } = migrateAndFill({ schemaVersion: 1, output: { hiddenFromPrompt: true } }, merge);
            expect(settings.chat.visibility.panel).toBe(false);
            expect(settings.auto.enabled).toBe(false);
            expect(settings.auto.allowPaid).toBe(false);
            expect(settings.prompts.styles).toEqual([]);
            expect(settings.takeover.migratedAt).toBeNull();
        });

        it('v3: adds inline, gallery and PNG sections without touching older values', () => {
            const { settings, migrated, fromVersion } = migrateAndFill(
                { schemaVersion: 2, prompts: { prefix: 'p' }, anlas: { freeOnly: false } },
                merge,
            );
            expect(migrated).toBe(true);
            expect(fromVersion).toBe(2);
            expect(settings.prompts.prefix).toBe('p');
            expect(settings.anlas.freeOnly).toBe(false);
            expect(settings.inline.saveToServer).toBe(true);
            expect(settings.inline.llmText).toBe('describe');
            expect(settings.gallery.enabled).toBe(true);
            expect(settings.png.stripMetadata).toBe(false);
        });

        it('v4: adds pose library and scene sections; stored pose arrays are kept as they are', () => {
            const custom = [{ id: 'c1', category: 'standing', tags: 't', keywords: [], name: 'Mine' }];
            const { settings, fromVersion } = migrateAndFill(
                { schemaVersion: 3, poses: { custom, favorites: ['sitting'] }, inline: { defaultWidth: 40 } },
                merge,
            );
            expect(fromVersion).toBe(3);
            expect(settings.poses.custom).toEqual(custom);
            expect(settings.poses.favorites).toEqual(['sitting']);
            expect(settings.inline.defaultWidth).toBe(40);
            expect(settings.scene.allowNsfw).toBe(false);
            expect(settings.scene.target).toBe('message');
        });

        it('v5: adds vibe library, streaming and tool defaults; stored vibe arrays are kept', () => {
            const sets = [
                {
                    id: 's',
                    name: 'S',
                    enabled: true,
                    global: true,
                    entries: [],
                    bindings: { characters: [], chats: [], styles: [] },
                },
            ];
            const { settings } = migrateAndFill({ schemaVersion: 4, vibes: { sets } }, merge);
            expect(settings.vibes.sets).toEqual(sets);
            expect(settings.vibes.items).toEqual([]);
            expect(settings.vibes.confirmEncoding).toBe(true);
            expect(settings.stream.enabled).toBe(true);
            expect(settings.tools.keepOriginal).toBe(true);
        });

        it('keeps stored styles and the migration report arrays as they are', () => {
            const styles = [{ name: 'a', prefix: 'p', suffix: '', negative: '' }];
            const { settings } = migrateAndFill(
                {
                    schemaVersion: 2,
                    prompts: { styles },
                    takeover: { migratedAt: '2026-01-01T00:00:00.000Z', migrationReport: ['x'] },
                },
                merge,
            );
            expect(settings.prompts.styles).toEqual(styles);
            expect(settings.takeover.migrationReport).toEqual(['x']);
        });
    });
});
