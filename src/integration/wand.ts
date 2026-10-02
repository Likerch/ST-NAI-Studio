// Wand (extensions) menu entry with the generation modes of the built-in dropdown, plus a free
// prompt item. Uses its own container so the built-in's #sd_wand_container stays untouched.
import { ctx, libs } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError as reportError } from '../core/notify';
import { TRIGGER_WORDS, WAND_MODES } from '../domain';
import { settings } from '../core/settings';
import type { Pipeline } from '../features/generation/pipeline';
import { inlineRenderer, openGalleryWindow, setInlineVisibility } from './inline-setup';

export function installWandMenu(pipeline: Pipeline): void {
    const menu = document.querySelector('#extensionsMenu');
    if (!menu || document.querySelector('#naist_wand_container')) return;

    const container = document.createElement('div');
    container.id = 'naist_wand_container';
    container.className = 'extension_container';
    container.innerHTML = `
        <div id="naist_wand_button" class="list-group-item flex-container flexGap5 interactable" tabindex="0">
            <div class="fa-solid fa-palette extensionsMenuExtensionButton" data-i18n="[title]naist.wand.title"></div>
            <span data-i18n="naist.wand.title"></span>
        </div>`;
    menu.append(container);

    const dropdown = document.createElement('div');
    dropdown.id = 'naist_wand_dropdown';
    dropdown.className = 'naist-wand-dropdown';
    dropdown.style.display = 'none';
    const items = WAND_MODES.map(
        (mode) =>
            `<li class="list-group-item interactable" data-trigger="${TRIGGER_WORDS[mode] ?? ''}" data-i18n="naist.mode.${mode}"></li>`,
    ).join('');
    dropdown.innerHTML = `
        <ul class="list-group">
            <span data-i18n="naist.wand.heading"></span>
            ${items}
            <li class="list-group-item interactable" data-trigger="__free" data-i18n="naist.wand.free"></li>
            <li class="list-group-item interactable naist-wand-sep" data-trigger="__gallery" data-i18n="naist.wand.gallery"></li>
            <li class="list-group-item interactable" data-trigger="__toggle-images" data-i18n="naist.wand.toggleImages"></li>
            <li class="list-group-item interactable" data-trigger="__reading" data-i18n="naist.wand.readingMode"></li>
        </ul>`;
    document.body.append(dropdown);
    localize(container);
    localize(dropdown);

    const button = container.querySelector<HTMLElement>('#naist_wand_button');
    if (!button) return;
    const popper = libs().Popper.createPopper(button, dropdown, { placement: 'top' });

    const hide = () => (dropdown.style.display = 'none');
    document.addEventListener('click', (event) => {
        const target = event.target as Node;
        if (dropdown.contains(target)) return;
        if (button.contains(target) && dropdown.style.display === 'none') {
            dropdown.style.display = 'block';
            void popper.update();
        } else {
            hide();
        }
    });

    dropdown.addEventListener('click', async (event) => {
        const item = (event.target as HTMLElement).closest<HTMLElement>('[data-trigger]');
        if (!item) return;
        hide();
        let trigger = item.dataset.trigger ?? '';
        if (trigger === '__gallery') {
            void openGalleryWindow(pipeline);
            return;
        }
        if (trigger === '__toggle-images') {
            await setInlineVisibility(inlineRenderer()?.isChatHidden() ? 'show' : 'hide');
            return;
        }
        if (trigger === '__reading') {
            await setInlineVisibility(settings().inline.readingMode ? 'reading-off' : 'reading-on');
            return;
        }
        if (trigger === '__free') {
            const c = ctx();
            const value = await c.callGenericPopup(t('naist.wand.freePrompt'), c.POPUP_TYPE.INPUT, '', { rows: 4 });
            if (typeof value !== 'string' || !value.trim()) return;
            trigger = value;
        }
        try {
            await pipeline.generatePicture({
                initiator: 'wand',
                trigger,
                mode: item.dataset.trigger === '__free' ? 6 : undefined,
            });
        } catch (error) {
            reportError(error);
        }
    });
}
