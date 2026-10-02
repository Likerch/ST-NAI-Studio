// "Generate with NAI Studio" item in the character card's "More..." menu. SillyTavern emits
// CHARACTER_MANAGEMENT_DROPDOWN with the option id for options it does not handle itself.
import { ctx } from '../core/context';
import { t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import type { Pipeline } from '../features/generation/pipeline';

const OPTIONS: [id: string, trigger: string, key: string][] = [
    ['naist_char_portrait', 'you', 'naist.card.portrait'],
    ['naist_char_face', 'face', 'naist.card.face'],
];

export function installCharacterCardMenu(pipeline: Pipeline): void {
    const select = document.querySelector('#char-management-dropdown');
    if (select && !select.querySelector('#naist_char_portrait')) {
        for (const [id, , key] of OPTIONS) {
            const option = document.createElement('option');
            option.id = id;
            option.setAttribute('data-i18n', key);
            option.textContent = t(key);
            select.append(option);
        }
    }
    const c = ctx();
    c.eventSource.on(c.eventTypes.CHARACTER_MANAGEMENT_DROPDOWN ?? 'charManagementDropdown', (target) => {
        const option = OPTIONS.find(([id]) => id === target);
        if (!option) return;
        pipeline.generatePicture({ initiator: 'wand', trigger: option[1] }).catch(reportGenerationError);
    });
}
