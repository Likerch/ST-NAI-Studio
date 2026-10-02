// Lightbox (TZ Phase 3): the full image with every parameter and the actions: copy prompt / seed,
// chat background, character avatar, save to disk. Later phases register more actions
// (Director Tools, inpaint, upscale) through `registerLightboxAction`.
import { ctx, requestHeaders } from '../core/context';
import { t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { settings } from '../core/settings';
import type { InlineGenerationMeta } from '../domain';
import { downloadBlob } from '../features/images/image-utils';
import { exportImage } from '../features/images/png-io';
import { escapeHtml } from './components/dom';

export interface LightboxItem {
    /** Full image. */
    blob(): Promise<Blob>;
    /** URL to show (object URL or /user/images path). */
    url: string;
    meta: InlineGenerationMeta;
    /** "2/4" for inline swipes. */
    position?: string;
    /** Server path; created on demand for actions that need one. */
    ensureFile(): Promise<string>;
    /** Present for images inside a chat message (inline images, message media). */
    chat?: { messageId: number; imageId?: string; mediaIndex?: number };
}

export interface LightboxAction {
    id: string;
    icon: string;
    labelKey: string;
    available(item: LightboxItem): boolean;
    run(item: LightboxItem, close: () => void): Promise<void> | void;
}

const actions: LightboxAction[] = [];

export function registerLightboxAction(action: LightboxAction): void {
    const index = actions.findIndex((a) => a.id === action.id);
    if (index >= 0) actions.splice(index, 1, action);
    else actions.push(action);
}

async function copy(text: string, doneKey: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
        toastr.success(t(doneKey));
    } catch {
        toastr.error(t('naist.lightbox.copyFailed'));
    }
}

async function setBackground(item: LightboxItem): Promise<void> {
    const c = ctx();
    const path = await item.ensureFile();
    await c.eventSource.emit(c.eventTypes.FORCE_SET_BACKGROUND ?? 'force_set_background', {
        url: `url("${encodeURI(path)}")`,
        path,
    });
    toastr.success(t('naist.lightbox.backgroundDone'));
}

/** Same flow as SillyTavern's own avatar upload (multipart `avatar` + `avatar_url`, cache bust). */
async function setAvatar(item: LightboxItem): Promise<void> {
    const c = ctx();
    if (c.groupId || c.characterId === undefined) {
        toastr.warning(t('naist.lightbox.avatarNoCharacter'));
        return;
    }
    const character = c.characters[Number(c.characterId)];
    if (!character) return;
    const ok = await c.callGenericPopup(
        t('naist.lightbox.avatarConfirm', { name: character.name }),
        c.POPUP_TYPE.CONFIRM,
    );
    if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return;
    const form = new FormData();
    form.append(
        'avatar',
        await exportImage(await item.blob(), item.meta, { strip: true, format: 'png' }),
        'avatar.png',
    );
    form.append('avatar_url', character.avatar);
    const response = await fetch('/api/characters/edit-avatar', {
        method: 'POST',
        headers: requestHeaders(true),
        body: form,
    });
    if (!response.ok) throw new Error(`avatar upload failed: HTTP ${response.status}`);
    const thumbnailUrl = c.getThumbnailUrl('avatar', character.avatar);
    await fetch(thumbnailUrl, { cache: 'reload' }).catch(() => null);
    await fetch(`/characters/${encodeURIComponent(character.avatar)}`, { cache: 'reload' }).catch(() => null);
    document.querySelectorAll<HTMLImageElement>(`img[src^="${thumbnailUrl}"]`).forEach((img) => {
        const src = img.src;
        img.src = '';
        img.src = src;
    });
    toastr.success(t('naist.lightbox.avatarDone', { name: character.name }));
}

async function saveToDisk(item: LightboxItem): Promise<void> {
    const blob = await exportImage(await item.blob(), item.meta, {
        strip: settings().png.stripMetadata,
        format: 'png',
    });
    downloadBlob(blob, `nai-${item.meta.seed}.png`);
}

function metaRows(meta: InlineGenerationMeta): string {
    const rows: [string, string][] = [
        ['naist.meta.scenePrompt', meta.scenePrompt],
        ['naist.meta.prompt', meta.prompt],
        ['naist.meta.negative', meta.negativePrompt],
        ['naist.meta.sourcePrompt', meta.sourcePrompt ?? ''],
        ['naist.meta.model', meta.model],
        ['naist.meta.seed', String(meta.seed)],
        ['naist.meta.size', `${meta.width}×${meta.height}`],
        ['naist.meta.steps', String(meta.steps)],
        ['naist.meta.scale', String(meta.scale)],
        ['naist.meta.cfgRescale', String(meta.cfgRescale)],
        ['naist.meta.sampler', `${meta.sampler} / ${meta.noiseSchedule}`],
        ['naist.meta.presets', `${meta.qualityPreset} / ${meta.ucPreset}`],
        ['naist.meta.requestType', meta.tool ? `${meta.requestType} (${meta.tool})` : meta.requestType],
        ['naist.meta.cost', String(meta.cost)],
        ['naist.meta.created', meta.createdAt ? new Date(meta.createdAt).toLocaleString() : ''],
    ];
    const characters = meta.characters
        .map(
            (c, i) =>
                `<div class="naist-meta-char"><b>${i + 1}.</b> ${escapeHtml(c.prompt)}${c.negative ? ` <i>(− ${escapeHtml(c.negative)})</i>` : ''} <span class="naist-muted">[${c.x}, ${c.y}]</span></div>`,
        )
        .join('');
    return (
        rows
            .filter(([, v]) => v !== '')
            .map(([k, v]) => `<tr><th>${escapeHtml(t(k))}</th><td>${escapeHtml(v)}</td></tr>`)
            .join('') +
        (characters ? `<tr><th>${escapeHtml(t('naist.meta.characters'))}</th><td>${characters}</td></tr>` : '')
    );
}

export async function openLightbox(item: LightboxItem): Promise<void> {
    const c = ctx();
    const root = document.createElement('div');
    root.className = 'naist-lightbox';
    const builtIn: LightboxAction[] = [
        {
            id: 'copy-prompt',
            icon: 'fa-copy',
            labelKey: 'naist.lightbox.copyPrompt',
            available: () => true,
            run: (i) => copy(i.meta.prompt, 'naist.lightbox.copied'),
        },
        {
            id: 'copy-seed',
            icon: 'fa-seedling',
            labelKey: 'naist.lightbox.copySeed',
            available: () => true,
            run: (i) => copy(String(i.meta.seed), 'naist.lightbox.copied'),
        },
        {
            id: 'background',
            icon: 'fa-panorama',
            labelKey: 'naist.lightbox.background',
            available: () => Boolean(ctx().getCurrentChatId()),
            run: (i) => setBackground(i),
        },
        {
            id: 'avatar',
            icon: 'fa-user-pen',
            labelKey: 'naist.lightbox.avatar',
            available: () => !ctx().groupId && ctx().characterId !== undefined,
            run: (i) => setAvatar(i),
        },
        {
            id: 'save',
            icon: 'fa-download',
            labelKey: 'naist.lightbox.save',
            available: () => true,
            run: (i) => saveToDisk(i),
        },
    ];
    const list = [...builtIn, ...actions].filter((a) => {
        try {
            return a.available(item);
        } catch {
            return false;
        }
    });
    root.innerHTML = `
        <div class="naist-lightbox-image"><img alt="" src="${escapeHtml(item.url)}"></div>
        <div class="naist-lightbox-side">
            ${item.position ? `<div class="naist-muted">${escapeHtml(item.position)}</div>` : ''}
            <div class="naist-lightbox-actions">${list
                .map(
                    (a) =>
                        `<div class="menu_button" data-naist-lb="${escapeHtml(a.id)}" title="${escapeHtml(t(a.labelKey))}"><i class="fa-solid ${escapeHtml(a.icon)}"></i> ${escapeHtml(t(a.labelKey))}</div>`,
                )
                .join('')}</div>
            <table class="naist-meta-table">${metaRows(item.meta)}</table>
        </div>`;
    const popup = new c.Popup(root, c.POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
        okButton: t('naist.lightbox.close'),
    });
    const close = () => {
        popup.dlg.close();
    };
    root.addEventListener('click', (event) => {
        const button = (event.target as HTMLElement).closest<HTMLElement>('[data-naist-lb]');
        const action = list.find((a) => a.id === button?.dataset.naistLb);
        if (!action || !button) return;
        button.classList.add('disabled');
        void Promise.resolve()
            .then(() => action.run(item, close))
            .catch((error: unknown) => {
                log.warn('lightbox action failed', action.id, error);
                reportGenerationError(error);
            })
            .finally(() => button.classList.remove('disabled'));
    });
    await popup.show();
}
