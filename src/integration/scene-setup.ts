// Scene composer wiring (TZ Phase 4): a button in the character card, "More…" menu items,
// panel buttons, the wand item and /nai-scene. Since v0.8 the card also has "Passports" and
// "Emotions" buttons, and the persona panel a passport button.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { avatarKey } from '../features/characters/character-prompts';
import { generatePersonaPassport } from '../features/characters/passport-generator';
import { currentPersonaKey, personaPassport, savePersonaPassport } from '../features/characters/passport-store';
import type { Pipeline } from '../features/generation/pipeline';
import type { SceneService } from '../features/scene/scene-service';
import { openComposer } from '../ui/composer';
import { editPassport } from '../ui/passport-editor';
import { openPassportManager } from '../ui/passport-manager';
import { openPoseLibrary } from '../ui/pose-library';

const MENU_OPTIONS: [id: string, key: string][] = [
    ['naist_char_composer', 'naist.card.composer'],
    ['naist_char_passport', 'naist.card.passport'],
];

let state: { service: SceneService; pipeline: Pipeline } | null = null;
let emotionsHandler: (index: number, passportId?: string) => void = () => {};

/** The sprite generator registers itself here (it lives with the Phase 6 tools). */
export function setEmotionsHandler(handler: (index: number, passportId?: string) => void): void {
    emotionsHandler = handler;
}

export async function openSceneComposer(auto = true, focusKey?: string): Promise<void> {
    if (!state) return;
    try {
        await openComposer(state.service, state.pipeline, { auto, focusKey });
    } catch (error) {
        reportGenerationError(error);
    }
}

export function editedCharacterIndex(): number | null {
    const c = ctx();
    if (c.characterId === undefined || c.characterId === null || c.characterId === '') return null;
    const index = Number(c.characterId);
    return Number.isInteger(index) && c.characters[index] ? index : null;
}

/** The passports of a card: characters, world, locations, scenario, objects. */
export async function editCharacterPassport(index: number): Promise<void> {
    await openPassportManager(index, { emotions: (i, passportId) => emotionsHandler(i, passportId) });
}

export async function editPersonaPassport(): Promise<void> {
    const key = await currentPersonaKey();
    const passport = await editPassport(ctx().name1, personaPassport(key), { generate: generatePersonaPassport });
    if (!passport) return;
    savePersonaPassport(key, passport);
    toastr.success(t('naist.passport.saved', { name: ctx().name1 }));
}

function cardButton(id: string, icon: string, titleKey: string, onClick: () => void): HTMLElement {
    const button = document.createElement('div');
    button.id = id;
    button.className = `menu_button fa-solid ${icon}`;
    button.setAttribute('data-i18n', `[title]${titleKey}`);
    button.title = t(titleKey);
    button.addEventListener('click', onClick);
    return button;
}

function withEditedCharacter(run: (index: number) => void): void {
    const index = editedCharacterIndex();
    if (index === null || ctx().groupId) toastr.info(t('naist.prompts.characterNone'));
    else run(index);
}

function installCardButton(): void {
    const block = document.querySelector('#avatar_controls .form_create_bottom_buttons_block');
    if (!block || block.querySelector('#naist_card_button')) return;
    const button = document.createElement('div');
    button.id = 'naist_card_button';
    button.className = 'menu_button fa-solid fa-palette';
    button.setAttribute('data-i18n', '[title]naist.card.button');
    button.title = t('naist.card.button');
    const exportButton = block.querySelector('#export_button');
    if (exportButton) exportButton.after(button);
    else block.append(button);
    button.addEventListener('click', () => {
        const index = editedCharacterIndex();
        const key = index === null ? undefined : avatarKey(ctx().characters[index]?.avatar);
        void openSceneComposer(false, key);
    });
    const passports = cardButton('naist_passport_button', 'fa-id-card', 'naist.card.passports', () =>
        withEditedCharacter((index) => void editCharacterPassport(index).catch(reportGenerationError)),
    );
    const emotions = cardButton('naist_emotions_button', 'fa-masks-theater', 'naist.card.emotions', () =>
        withEditedCharacter((index) => emotionsHandler(index)),
    );
    button.after(passports, emotions);
}

/** Passport button among the persona panel's buttons. */
function installPersonaButton(): void {
    const block = document.querySelector('#persona_controls .persona_controls_buttons_block');
    if (!block || block.querySelector('#naist_persona_passport')) return;
    const button = cardButton('naist_persona_passport', 'fa-id-card', 'naist.card.personaPassport', () => {
        void editPersonaPassport().catch(reportGenerationError);
    });
    const anchor = block.querySelector('#persona_lore_button');
    if (anchor) anchor.after(button);
    else block.prepend(button);
}

function installMenuOptions(): void {
    const select = document.querySelector('#char-management-dropdown');
    if (select && !select.querySelector('#naist_char_composer')) {
        for (const [id, key] of MENU_OPTIONS) {
            const option = document.createElement('option');
            option.id = id;
            option.setAttribute('data-i18n', key);
            option.textContent = t(key);
            select.append(option);
        }
    }
    const c = ctx();
    c.eventSource.on(c.eventTypes.CHARACTER_MANAGEMENT_DROPDOWN ?? 'charManagementDropdown', (target) => {
        const index = editedCharacterIndex();
        if (target === 'naist_char_composer') {
            void openSceneComposer(false, index === null ? undefined : avatarKey(ctx().characters[index]?.avatar));
        } else if (target === 'naist_char_passport' && index !== null) {
            void editCharacterPassport(index).catch(reportGenerationError);
        }
    });
}

function registerSceneCommand(): void {
    const {
        SlashCommandParser: parser,
        SlashCommand: Command,
        SlashCommandArgument: Arg,
        SlashCommandNamedArgument: Named,
        ARGUMENT_TYPE: T,
    } = ctx();
    parser.addCommandObject(
        Command.fromProps({
            name: 'nai-scene',
            returns: t('naist.command.sceneReturns'),
            helpString: t('naist.command.sceneHelp'),
            namedArgumentList: [
                Named.fromProps({
                    name: 'edit',
                    description: t('naist.command.arg.sceneEdit'),
                    typeList: [T.BOOLEAN ?? 'bool'],
                    defaultValue: 'true',
                    isRequired: false,
                }),
                Named.fromProps({
                    name: 'target',
                    description: t('naist.command.arg.sceneTarget'),
                    typeList: [T.STRING ?? 'string'],
                    enumList: ['message', 'inline'],
                    isRequired: false,
                }),
            ],
            unnamedArgumentList: [
                Arg.fromProps({
                    description: t('naist.command.arg.sceneText'),
                    typeList: [T.STRING ?? 'string'],
                    isRequired: false,
                }),
            ],
            callback: async (args: Record<string, unknown>, value: unknown) => {
                if (!state) return '';
                const edit = String(args.edit ?? 'true').toLowerCase() !== 'false';
                if (edit) {
                    void openSceneComposer(true);
                    return '';
                }
                try {
                    const text = String(value ?? '').trim();
                    const { spec } = await state.service.autoSpec(text || undefined);
                    const target = String(args.target ?? '') === 'inline' ? 'inline' : 'message';
                    const result = await state.service.generate(spec, target);
                    return typeof result === 'string' ? result : (result?.path ?? '');
                } catch (error) {
                    reportGenerationError(error);
                    return '';
                }
            },
        }),
    );
}

export function setupScenes(pipeline: Pipeline, service: SceneService): void {
    state = { service, pipeline };
    installCardButton();
    installPersonaButton();
    installMenuOptions();
    document.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.closest('#naist_open_composer')) void openSceneComposer(true);
        else if (target.closest('#naist_edit_char_passport')) {
            withEditedCharacter((index) => void editCharacterPassport(index).catch(reportGenerationError));
        } else if (target.closest('#naist_edit_persona_passport'))
            void editPersonaPassport().catch(reportGenerationError);
        else if (target.closest('#naist_open_pose_library')) void openPoseLibrary();
    });
    const c = ctx();
    c.eventSource.on(c.eventTypes.APP_READY ?? 'app_ready', () => {
        installCardButton();
        installPersonaButton();
        registerSceneCommand();
        for (const selector of ['#avatar_controls', '#persona_controls']) {
            const block = document.querySelector(selector);
            if (block) localize(block);
        }
        log.info('scene composer ready');
    });
}
