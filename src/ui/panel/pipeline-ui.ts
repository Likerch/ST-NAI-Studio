// UI services injected into the generation pipeline: prompt editing, cost confirmation, inspector.
import { ctx } from '../../core/context';
import { localize, t } from '../../core/i18n';
import type { PipelineUi, RefineResult } from '../../features/generation/pipeline';
import { openInspector } from './inspector';

async function refine(
    prompt: string,
    options: { negative?: string; resolution?: string },
): Promise<RefineResult | null> {
    const c = ctx();
    const root = document.createElement('div');
    root.className = 'naist-refine';
    root.innerHTML = `
        <h3 data-i18n="naist.refine.title"></h3>
        <div class="naist-hint" data-i18n="naist.refine.hint"></div>
        <textarea class="text_pole naist-refine-prompt" rows="8"></textarea>
        ${options.negative !== undefined ? '<label data-i18n="naist.refine.negative"></label><textarea class="text_pole naist-refine-negative" rows="4"></textarea>' : ''}
        ${options.resolution ? '<label class="checkbox_label"><input type="checkbox" class="naist-refine-resolution" checked><span data-i18n="naist.refine.resolution"></span></label>' : ''}`;
    localize(root);
    const promptArea = root.querySelector<HTMLTextAreaElement>('.naist-refine-prompt');
    const negativeArea = root.querySelector<HTMLTextAreaElement>('.naist-refine-negative');
    const resolution = root.querySelector<HTMLInputElement>('.naist-refine-resolution');
    if (promptArea) promptArea.value = prompt.trim();
    if (negativeArea) negativeArea.value = options.negative ?? '';
    const resolutionLabel = resolution?.nextElementSibling;
    if (resolutionLabel)
        resolutionLabel.textContent = t('naist.refine.resolution', { resolution: options.resolution ?? '' });
    const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.refine.continue'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
    });
    if (result !== c.POPUP_RESULT.AFFIRMATIVE || !promptArea?.value.trim()) return null;
    return {
        prompt: promptArea.value,
        negative: negativeArea ? negativeArea.value.trim() : undefined,
        useSavedResolution: resolution ? resolution.checked : false,
    };
}

export function createPipelineUi(balance: () => number): PipelineUi {
    return {
        refine,
        confirmCost: async (prepared) => {
            const c = ctx();
            const result = await c.callGenericPopup(
                t('naist.cost.confirm', { total: prepared.cost.total, balance: balance() }),
                c.POPUP_TYPE.CONFIRM,
            );
            return result === c.POPUP_RESULT.AFFIRMATIVE;
        },
        inspect: (prepared) => openInspector(prepared, { confirmSend: true }),
    };
}
