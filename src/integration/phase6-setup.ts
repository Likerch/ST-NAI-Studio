// Phase 6 wiring: RU -> EN translation and scene continuity in the pipeline, the glossary editor,
// continuity controls, the sprite and comic dialogs, settings export / import, the structured
// function tool, slash commands and the "Expressions sprites" item of the character menu.
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { onExternalChange, saveSettings, settings } from '../core/settings';
import { activeSwipe, locationKey, readEntries } from '../domain';
import { ComicService } from '../features/comic/comic-service';
import {
    bindLocation,
    ContinuityService,
    continuityData,
    forgetLocation,
    setCurrentLocation,
} from '../features/continuity/continuity-service';
import type { Pipeline } from '../features/generation/pipeline';
import type { SceneService } from '../features/scene/scene-service';
import { exportSettingsFile, importSettingsText } from '../features/settings-io/settings-io';
import { SpriteService } from '../features/sprites/sprite-service';
import { autoTranslator, translatePrompt } from '../features/translate/translate-service';
import { setExtraVibes } from '../features/vibes/vibe-library';
import { openComicDialog } from '../ui/comic-dialog';
import { openSpritesDialog } from '../ui/sprites-dialog';
import { editedCharacterIndex } from './scene-setup';
import { setToolScenes } from './tools';

const SPRITES_OPTION = 'naist_char_sprites';

let sprites: SpriteService | null = null;
let comic: ComicService | null = null;

// ---- glossary --------------------------------------------------------------------------

function glossaryText(): string {
    return settings()
        .translate.glossary.map((g) => `${g.from} = ${g.to}`)
        .join('\n');
}

function parseGlossary(text: string) {
    return text
        .split('\n')
        .map((line) => line.split('='))
        .filter((parts) => parts.length >= 2)
        .map(([from, ...rest]) => ({ from: (from ?? '').trim(), to: rest.join('=').trim() }))
        .filter((g) => g.from && g.to);
}

function fillGlossary(): void {
    const field = document.getElementById('naist_glossary') as HTMLTextAreaElement | null;
    if (field && document.activeElement !== field) field.value = glossaryText();
}

// ---- continuity ------------------------------------------------------------------------

/** The newest image of the chat: message media or the active variant of an inline image. */
function lastChatImage(): {
    filePath: string;
    width: number;
    height: number;
    model: string;
    seed: number;
    prompt: string;
} | null {
    const chat = ctx().chat;
    for (let i = chat.length - 1; i >= 0; i--) {
        const extra = chat[i]?.extra as Record<string, unknown> | undefined;
        const inline = readEntries(extra)
            .map(activeSwipe)
            .filter((s) => s?.filePath);
        const swipe = inline.at(-1);
        if (swipe) {
            return {
                filePath: swipe.filePath,
                width: swipe.meta.width,
                height: swipe.meta.height,
                model: swipe.meta.model,
                seed: swipe.meta.seed,
                prompt: swipe.meta.scenePrompt,
            };
        }
        const media = Array.isArray(extra?.media) ? (extra.media as Record<string, unknown>[]) : [];
        const index = typeof extra?.media_index === 'number' ? extra.media_index : media.length - 1;
        const item = media[index] ?? media.at(-1);
        if (item && typeof item.url === 'string') {
            const naist = (item.nai_studio ?? {}) as { model?: string; seed?: number; prompt?: string };
            return {
                filePath: item.url,
                width: Number(item.width) || 0,
                height: Number(item.height) || 0,
                model: naist.model ?? '',
                seed: naist.seed ?? 0,
                prompt: typeof item.title === 'string' ? item.title : (naist.prompt ?? ''),
            };
        }
    }
    return null;
}

function refreshContinuity(): void {
    const input = document.getElementById('naist_cont_current') as HTMLInputElement | null;
    if (!input) return;
    const data = ctx().getCurrentChatId() ? continuityData() : { current: '', locations: {} };
    if (document.activeElement !== input) input.value = data.current;
    const list = document.getElementById('naist_cont_locations');
    if (list) {
        list.innerHTML = '';
        for (const location of Object.values(data.locations)) {
            const option = document.createElement('option');
            option.value = location.name;
            list.append(option);
        }
    }
    const info = document.getElementById('naist_cont_info');
    if (info) {
        const ref = data.locations[locationKey(data.current)];
        const names = Object.values(data.locations).map((l) => l.name);
        info.textContent = [
            ref
                ? t('naist.continuity.boundTo', { path: ref.filePath })
                : data.current
                  ? t('naist.continuity.unbound')
                  : '',
            names.length ? t('naist.continuity.known', { names: names.join(', ') }) : '',
        ]
            .filter(Boolean)
            .join(' · ');
    }
}

async function bindCurrent(): Promise<void> {
    const input = document.getElementById('naist_cont_current') as HTMLInputElement | null;
    const name = input?.value.trim() || continuityData().current;
    if (!name) {
        toastr.info(t('naist.continuity.needName'));
        return;
    }
    const image = lastChatImage();
    if (!image) {
        toastr.info(t('naist.continuity.noImage'));
        return;
    }
    await bindLocation(name, image);
    await setCurrentLocation(name);
    toastr.success(t('naist.continuity.bound', { name }), t('naist.continuity.title'));
    refreshContinuity();
}

// ---- dialogs ---------------------------------------------------------------------------

function openSprites(index: number | null = editedCharacterIndex()): void {
    if (!sprites) return;
    if (index === null || ctx().groupId) {
        toastr.info(t('naist.sprites.noCharacter'));
        return;
    }
    void openSpritesDialog(sprites, index).catch(reportGenerationError);
}

function openComic(): void {
    if (comic) void openComicDialog(comic).catch(reportGenerationError);
}

// ---- commands --------------------------------------------------------------------------

function registerCommands(): void {
    const { SlashCommandParser: parser, SlashCommand: Command, SlashCommandArgument: Arg, ARGUMENT_TYPE: T } = ctx();
    const text = (description: string) => [
        Arg.fromProps({ description, typeList: [T.STRING ?? 'string'], isRequired: false }),
    ];
    parser.addCommandObject(
        Command.fromProps({
            name: 'nai-translate',
            returns: t('naist.command.translateReturns'),
            helpString: t('naist.command.translateHelp'),
            unnamedArgumentList: text(t('naist.command.arg.translateText')),
            callback: async (_args: Record<string, unknown>, value: unknown) => {
                try {
                    return (await translatePrompt(String(value ?? ''))).text;
                } catch (error) {
                    reportGenerationError(error);
                    return '';
                }
            },
        }),
    );
    parser.addCommandObject(
        Command.fromProps({
            name: 'nai-location',
            returns: t('naist.command.locationReturns'),
            helpString: t('naist.command.locationHelp'),
            unnamedArgumentList: text(t('naist.command.arg.locationName')),
            callback: async (_args: Record<string, unknown>, value: unknown) => {
                const name = String(value ?? '').trim();
                if (name) {
                    await setCurrentLocation(name);
                    refreshContinuity();
                }
                return continuityData().current;
            },
        }),
    );
    for (const [name, help, open] of [
        ['nai-sprites', 'naist.command.spritesHelp', () => openSprites()],
        ['nai-comic', 'naist.command.comicHelp', () => openComic()],
    ] as const) {
        parser.addCommandObject(
            Command.fromProps({
                name,
                returns: '',
                helpString: t(help),
                callback: async () => {
                    open();
                    return '';
                },
            }),
        );
    }
}

function installMenuOption(): void {
    const select = document.querySelector('#char-management-dropdown');
    if (select && !select.querySelector(`#${SPRITES_OPTION}`)) {
        const option = document.createElement('option');
        option.id = SPRITES_OPTION;
        option.setAttribute('data-i18n', 'naist.card.sprites');
        option.textContent = t('naist.card.sprites');
        select.append(option);
    }
}

export function setupPhase6(pipeline: Pipeline, scenes: SceneService): void {
    pipeline.setTranslator(autoTranslator);
    const continuity = new ContinuityService();
    pipeline.setContinuityProvider(continuity);
    pipeline.onGenerated(continuity.observe);
    setExtraVibes(() => continuity.vibes());
    setToolScenes(scenes);
    sprites = new SpriteService(pipeline);
    comic = new ComicService(pipeline);

    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('#naist_open_sprites')) openSprites();
        else if (target.closest('#naist_open_comic')) openComic();
        else if (target.closest('#naist_cont_bind')) void bindCurrent().catch(reportGenerationError);
        else if (target.closest('#naist_cont_forget')) {
            const name = (document.getElementById('naist_cont_current') as HTMLInputElement | null)?.value.trim();
            if (name) void forgetLocation(name).then(refreshContinuity).catch(reportGenerationError);
        } else if (target.closest('#naist_settings_export')) {
            const images =
                (document.getElementById('naist_settings_images') as HTMLInputElement | null)?.checked !== false;
            void exportSettingsFile(images)
                .then((file) => toastr.success(t('naist.io.exported', { file }), t('naist.io.title')))
                .catch(reportGenerationError);
        } else if (target.closest('#naist_settings_import')) {
            (document.getElementById('naist_settings_file') as HTMLInputElement | null)?.click();
        }
    });
    document.addEventListener('change', (event) => {
        const target = event.target as HTMLElement;
        if (target.id === 'naist_cont_current') {
            void setCurrentLocation((target as HTMLInputElement).value).then(refreshContinuity);
        } else if (target.id === 'naist_settings_file') {
            const input = target as HTMLInputElement;
            const file = input.files?.[0];
            input.value = '';
            if (!file) return;
            void (async () => {
                const c = ctx();
                const ok = await c.callGenericPopup(
                    t('naist.io.confirmImport', { file: file.name }),
                    c.POPUP_TYPE.CONFIRM,
                );
                if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return;
                const result = await importSettingsText(await file.text());
                toastr.success(
                    t('naist.io.imported', { version: result.fromVersion, images: result.images }),
                    t('naist.io.title'),
                );
            })().catch(reportGenerationError);
        }
    });
    document.addEventListener('input', (event) => {
        const target = event.target as HTMLElement;
        if (target.id !== 'naist_glossary') return;
        settings().translate.glossary = parseGlossary((target as HTMLTextAreaElement).value);
        saveSettings();
    });
    document.addEventListener('focusin', (event) => {
        const id = (event.target as HTMLElement).id;
        if (id === 'naist_cont_current') refreshContinuity();
    });
    onExternalChange(() => {
        fillGlossary();
        refreshContinuity();
    });

    const c = ctx();
    c.eventSource.on(c.eventTypes.CHAT_CHANGED ?? 'chat_id_changed', () => refreshContinuity());
    c.eventSource.on(c.eventTypes.CHARACTER_MANAGEMENT_DROPDOWN ?? 'charManagementDropdown', (target: unknown) => {
        if (target === SPRITES_OPTION) openSprites();
    });
    c.eventSource.on(c.eventTypes.APP_READY ?? 'app_ready', () => {
        installMenuOption();
        registerCommands();
        fillGlossary();
        refreshContinuity();
        log.info('phase 6 tools ready');
    });
}
