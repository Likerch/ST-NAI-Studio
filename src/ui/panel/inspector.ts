// Payload inspector: final JSON, what was dropped and why, override highlighted, transport losses.
// The main diagnostic tool: compare this JSON with a request from the NovelAI web client.
import { ctx } from '../../core/context';
import { localize, t } from '../../core/i18n';
import type { Prepared } from '../../features/generation/service';
import { renderJson } from '../components/json-view';

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function droppedList(prepared: Prepared): string {
    if (prepared.build.dropped.length === 0) {
        return `<p class="naist-muted" data-i18n="naist.inspector.nothingDropped"></p>`;
    }
    const sorted = [...prepared.build.dropped].sort((a, b) => Number(b.userSet) - Number(a.userSet));
    const items = sorted
        .map(
            (d) =>
                `<li class="${d.userSet ? 'naist-dropped-user' : 'naist-muted'}"><code>${escapeHtml(d.path)}</code> — ${escapeHtml(t(`naist.drop.${d.reason}`))}</li>`,
        )
        .join('');
    return `<ul class="naist-list">${items}</ul>`;
}

function warningsList(prepared: Prepared): string {
    const warnings = prepared.build.warnings.map(
        (w) => `<li>${escapeHtml(t(`naist.warning.${w.code}`, w.params))}</li>`,
    );
    const clamps = prepared.clampChanges.map(
        (c) => `<li>${escapeHtml(t(`naist.clamp.${c.kind}`, c as unknown as Record<string, string | number>))}</li>`,
    );
    const all = [...warnings, ...clamps];
    return all.length
        ? `<ul class="naist-list">${all.join('')}</ul>`
        : `<p class="naist-muted" data-i18n="naist.inspector.noWarnings"></p>`;
}

function lostList(prepared: Prepared): string {
    if (prepared.effective.lost.length === 0) return '';
    const items = prepared.effective.lost.map((l) => `<li>${escapeHtml(t(`naist.lost.${l}`))}</li>`).join('');
    return `<h4 data-i18n="naist.inspector.lost"></h4><ul class="naist-list naist-dropped-user">${items}</ul>`;
}

export interface InspectorOptions {
    /** Show a "Send" button and resolve true when pressed. */
    confirmSend: boolean;
}

/** Opens the inspector popup. Resolves true when the user chose to send (confirmSend mode). */
export async function openInspector(
    prepared: Prepared,
    options: InspectorOptions = { confirmSend: false },
): Promise<boolean> {
    const c = ctx();
    const root = document.createElement('div');
    root.className = 'naist-inspector';
    const native = prepared.transportId === 'native';
    const costText =
        prepared.cost.total === 0
            ? t('naist.cost.free')
            : t('naist.cost.paid', {
                  total: prepared.cost.total,
                  perImage: prepared.cost.perImage,
                  billable: prepared.cost.billableSamples,
              });

    root.innerHTML = `
        <h3 data-i18n="naist.inspector.title"></h3>
        <div class="naist-row">
            <span>${escapeHtml(t(`naist.transport.${prepared.transportId}`))}</span>
            <span class="naist-muted">${escapeHtml(prepared.body.model)} · ${escapeHtml(prepared.body.action)}</span>
            <span class="naist-cost-inline">${escapeHtml(costText)}</span>
        </div>
        ${prepared.overridePaths.length ? `<div class="naist-warning" data-i18n="naist.inspector.overrideApplied"></div>` : ''}
        ${lostList(prepared)}
        <div class="naist-row">
            <div class="menu_button menu_button_icon naist-copy"><i class="fa-solid fa-copy"></i><span data-i18n="naist.inspector.copy"></span></div>
        </div>
        <h4 data-i18n="naist.inspector.body"></h4>
        ${renderJson(prepared.body, prepared.overridePaths)}
        ${native ? `<h4 data-i18n="naist.inspector.effectiveNative"></h4>${renderJson(prepared.effective.body)}` : ''}
        <h4 data-i18n="naist.inspector.dropped"></h4>
        ${droppedList(prepared)}
        <h4 data-i18n="naist.inspector.warnings"></h4>
        ${warningsList(prepared)}
    `;
    localize(root);
    root.querySelector('.naist-copy')?.addEventListener('click', async () => {
        const json = JSON.stringify(native ? prepared.effective.body : prepared.body, null, 2);
        try {
            await navigator.clipboard.writeText(json);
            toastr.success(t('naist.inspector.copied'));
        } catch {
            toastr.error(t('naist.inspector.copyFailed'));
        }
    });

    const result = await c.callGenericPopup(root, options.confirmSend ? c.POPUP_TYPE.CONFIRM : c.POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
        okButton: options.confirmSend ? t('naist.inspector.send') : t('naist.inspector.close'),
        cancelButton: options.confirmSend ? t('naist.inspector.cancel') : false,
    });
    return options.confirmSend && result === c.POPUP_RESULT.AFFIRMATIVE;
}
