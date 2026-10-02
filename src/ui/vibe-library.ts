// Vibe library window (TZ Phase 5): reference images, named sets bound to the current
// character / chat / style, per-vibe strength and information extracted, and an explicit status
// when vibes cannot be used (V5 is behind a feature flag until NovelAI ships it).
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import { saveSettings, settings } from '../core/settings';
import { defaultVibeEntry, DEFAULT_MODEL, getCapabilities, isModelId, MODELS, vibeAvailability } from '../domain';
import type { VibeSet } from '../domain';
import type { TransportFeatures } from '../transport';
import { activeVibes, addVibe, removeVibe, vibeContext, vibeItems, vibeThumb } from '../features/vibes/vibe-library';
import { escapeHtml } from './components/dom';

export async function openVibeLibrary(features: TransportFeatures | null): Promise<void> {
    const c = ctx();
    const vibes = settings().vibes;
    const urls: string[] = [];
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-vibes';

    const status = () => {
        const model = settings().generation.model;
        const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
        const availability = vibeAvailability(caps, features?.vibes === true);
        const info = MODELS.find((m) => m.id === caps.model);
        return t(`naist.vibes.status.${availability}`, { model: info ? t(info.nameKey) : caps.model });
    };

    const renderItems = () =>
        vibeItems()
            .map(
                (item) => `<div class="naist-vibe-card" data-id="${escapeHtml(item.id)}">
                <img alt="" data-thumb="${escapeHtml(item.id)}">
                <input class="text_pole naist-vibe-name" value="${escapeHtml(item.name)}">
                <div class="menu_button fa-solid fa-trash-can naist-vibe-remove" title="${escapeHtml(t('naist.vibes.remove'))}"></div>
            </div>`,
            )
            .join('') || `<div class="naist-hint">${escapeHtml(t('naist.vibes.empty'))}</div>`;

    const renderSet = (set: VibeSet, index: number) => {
        const ctxNow = vibeContext();
        const bound = (kind: 'characters' | 'chats' | 'styles', values: string[]) =>
            values.length > 0 && values.every((v) => set.bindings[kind].includes(v));
        return `<div class="naist-section naist-vibe-set" data-index="${index}">
            <div class="naist-row">
                <input class="text_pole naist-grow naist-set-name" value="${escapeHtml(set.name)}">
                <label class="checkbox_label"><input type="checkbox" class="naist-set-enabled"${set.enabled ? ' checked' : ''}><span>${escapeHtml(t('naist.vibes.enabled'))}</span></label>
                <div class="menu_button fa-solid fa-trash-can naist-set-remove" title="${escapeHtml(t('naist.vibes.removeSet'))}"></div>
            </div>
            <div class="naist-flags">
                <label class="checkbox_label"><input type="checkbox" class="naist-set-global"${set.global ? ' checked' : ''}><span>${escapeHtml(t('naist.vibes.global'))}</span></label>
                <label class="checkbox_label"><input type="checkbox" class="naist-set-bind" data-kind="characters"${bound('characters', ctxNow.characters) ? ' checked' : ''}${ctxNow.characters.length ? '' : ' disabled'}><span>${escapeHtml(t('naist.vibes.bindCharacter'))}</span></label>
                <label class="checkbox_label"><input type="checkbox" class="naist-set-bind" data-kind="chats"${bound('chats', ctxNow.chatId ? [ctxNow.chatId] : []) ? ' checked' : ''}${ctxNow.chatId ? '' : ' disabled'}><span>${escapeHtml(t('naist.vibes.bindChat'))}</span></label>
                <label class="checkbox_label"><input type="checkbox" class="naist-set-bind" data-kind="styles"${bound('styles', ctxNow.style ? [ctxNow.style] : []) ? ' checked' : ''}${ctxNow.style ? '' : ' disabled'}><span>${escapeHtml(t('naist.vibes.bindStyle'))}</span></label>
            </div>
            ${vibeItems()
                .map((item) => {
                    const entry = set.entries.find((e) => e.vibeId === item.id);
                    return `<div class="naist-row naist-set-entry" data-vibe="${escapeHtml(item.id)}">
                        <label class="checkbox_label naist-grow"><input type="checkbox" class="naist-entry-on"${entry?.enabled ? ' checked' : ''}><span>${escapeHtml(item.name)}</span></label>
                        <label>${escapeHtml(t('naist.vibes.strength'))}</label>
                        <input type="number" min="-1" max="1" step="0.05" class="text_pole naist-entry-strength" value="${entry?.strength ?? 0.6}">
                        <label>${escapeHtml(t('naist.vibes.information'))}</label>
                        <input type="number" min="0.01" max="1" step="0.05" class="text_pole naist-entry-ie" value="${entry?.informationExtracted ?? 1}">
                    </div>`;
                })
                .join('')}
        </div>`;
    };

    const render = () => {
        const active = activeVibes();
        root.innerHTML = `
            <h3>${escapeHtml(t('naist.vibes.title'))}</h3>
            <div class="naist-hint">${escapeHtml(status())}</div>
            <div class="naist-hint">${escapeHtml(t('naist.vibes.cacheHint'))}</div>
            <div class="naist-muted">${escapeHtml(t('naist.vibes.active', { count: active.length, names: active.map((a) => a.item.name).join(', ') || '—' }))}</div>
            <div class="naist-section">
                <b>${escapeHtml(t('naist.vibes.images'))}</b>
                <div class="naist-vibe-grid">${renderItems()}</div>
                <div class="naist-row">
                    <div class="menu_button naist-vibe-add">${escapeHtml(t('naist.vibes.add'))}</div>
                    <input type="file" accept="image/*" multiple class="naist-hidden naist-vibe-file">
                    <label class="checkbox_label"><input type="checkbox" class="naist-vibe-confirm"${vibes.confirmEncoding ? ' checked' : ''}><span>${escapeHtml(t('naist.vibes.confirmEncoding'))}</span></label>
                </div>
            </div>
            <b>${escapeHtml(t('naist.vibes.sets'))}</b>
            ${vibes.sets.map(renderSet).join('')}
            <div class="menu_button naist-set-add">${escapeHtml(t('naist.vibes.addSet'))}</div>`;
        root.querySelectorAll<HTMLImageElement>('img[data-thumb]').forEach((img) => {
            const item = vibeItems().find((i) => i.id === img.dataset.thumb);
            if (!item) return;
            void vibeThumb(item).then((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                urls.push(url);
                img.src = url;
            });
        });
        localize(root);
    };

    const setOf = (el: Element) => vibes.sets[Number(el.closest<HTMLElement>('.naist-vibe-set')?.dataset.index)];
    const save = () => saveSettings();

    root.addEventListener('click', (event) => {
        const el = event.target as HTMLElement;
        if (el.classList.contains('naist-vibe-add')) root.querySelector<HTMLInputElement>('.naist-vibe-file')?.click();
        else if (el.classList.contains('naist-vibe-remove')) {
            const id = el.closest<HTMLElement>('.naist-vibe-card')?.dataset.id ?? '';
            void removeVibe(id).then(render);
        } else if (el.classList.contains('naist-set-add')) {
            vibes.sets.push({
                id: c.uuidv4(),
                name: t('naist.vibes.setDefault', { n: vibes.sets.length + 1 }),
                enabled: true,
                global: false,
                entries: vibeItems().map((i) => ({ ...defaultVibeEntry(i.id), enabled: false })),
                bindings: { characters: [], chats: [], styles: [] },
            });
            save();
            render();
        } else if (el.classList.contains('naist-set-remove')) {
            vibes.sets.splice(Number(el.closest<HTMLElement>('.naist-vibe-set')?.dataset.index), 1);
            save();
            render();
        }
    });
    root.addEventListener('change', (event) => {
        const el = event.target as HTMLInputElement;
        if (el.classList.contains('naist-vibe-file')) {
            const files = [...(el.files ?? [])];
            el.value = '';
            void (async () => {
                for (const file of files) await addVibe(file, file.name.replace(/\.[^.]+$/, ''));
                render();
            })().catch(reportGenerationError);
            return;
        }
        if (el.classList.contains('naist-vibe-confirm')) vibes.confirmEncoding = el.checked;
        else if (el.classList.contains('naist-vibe-name')) {
            const item = vibeItems().find((i) => i.id === el.closest<HTMLElement>('.naist-vibe-card')?.dataset.id);
            if (item) item.name = el.value.trim() || item.name;
        } else {
            const set = setOf(el);
            if (!set) return;
            if (el.classList.contains('naist-set-name')) set.name = el.value.trim() || set.name;
            else if (el.classList.contains('naist-set-enabled')) set.enabled = el.checked;
            else if (el.classList.contains('naist-set-global')) set.global = el.checked;
            else if (el.classList.contains('naist-set-bind')) {
                const kind = el.dataset.kind as 'characters' | 'chats' | 'styles';
                const now = vibeContext();
                const values = kind === 'characters' ? now.characters : kind === 'chats' ? [now.chatId] : [now.style];
                set.bindings[kind] = el.checked
                    ? [...new Set([...set.bindings[kind], ...values.filter(Boolean)])]
                    : set.bindings[kind].filter((v) => !values.includes(v));
            } else {
                const row = el.closest<HTMLElement>('.naist-set-entry');
                const vibeId = row?.dataset.vibe ?? '';
                if (!row || !vibeId) return;
                let entry = set.entries.find((e) => e.vibeId === vibeId);
                if (!entry) {
                    entry = { ...defaultVibeEntry(vibeId), enabled: false };
                    set.entries.push(entry);
                }
                entry.enabled = row.querySelector<HTMLInputElement>('.naist-entry-on')?.checked === true;
                entry.strength = Number(row.querySelector<HTMLInputElement>('.naist-entry-strength')?.value) || 0;
                entry.informationExtracted = Number(row.querySelector<HTMLInputElement>('.naist-entry-ie')?.value) || 1;
            }
        }
        save();
        const active = root.querySelector('.naist-muted');
        const list = activeVibes();
        if (active)
            active.textContent = t('naist.vibes.active', {
                count: list.length,
                names: list.map((a) => a.item.name).join(', ') || '—',
            });
    });
    root.addEventListener('dragover', (event) => {
        if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
    });
    root.addEventListener('drop', (event) => {
        const files = [...(event.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'));
        if (!files.length) return;
        event.preventDefault();
        event.stopPropagation();
        void (async () => {
            for (const file of files) await addVibe(file, file.name.replace(/\.[^.]+$/, ''));
            render();
        })().catch(reportGenerationError);
    });

    render();
    await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, '', { wide: true, large: true, allowVerticalScrolling: true });
    for (const url of urls) URL.revokeObjectURL(url);
    saveSettings();
}
