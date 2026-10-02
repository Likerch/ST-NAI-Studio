// Expressions sprite generator dialog (TZ Phase 6): mode, labels (the 28 defaults plus the user's
// custom Expressions labels), model, transparency on V5, live progress; closing stops after the
// current sprite.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { reportGenerationError } from '../core/notify';
import { saveSettings, settings } from '../core/settings';
import { DEFAULT_MODEL, EXPRESSION_LABELS, getCapabilities, isModelId, MODELS } from '../domain';
import { spriteAppearance, spriteFolder, spriteLabels } from '../features/sprites/sprite-service';
import type { SpriteJob, SpriteService } from '../features/sprites/sprite-service';
import { escapeHtml } from './components/dom';

const STATUS_ICON: Record<SpriteJob['status'], string> = {
    pending: 'fa-regular fa-clock',
    running: 'fa-solid fa-spinner fa-spin',
    done: 'fa-solid fa-check',
    failed: 'fa-solid fa-triangle-exclamation',
};

function customLabels(): string[] {
    const expressions = (ctx().extensionSettings as Record<string, unknown>).expressions as
        { custom?: unknown } | undefined;
    return Array.isArray(expressions?.custom)
        ? expressions.custom.filter((l): l is string => typeof l === 'string')
        : [];
}

export async function openSpritesDialog(service: SpriteService, characterIndex: number): Promise<void> {
    const c = ctx();
    const s = settings().sprites;
    const character = c.characters[characterIndex];
    if (!character) {
        toastr.warning(t('naist.sprites.noCharacter'));
        return;
    }
    const all = [
        ...EXPRESSION_LABELS,
        ...customLabels().filter((l) => !(EXPRESSION_LABELS as readonly string[]).includes(l)),
    ];
    const selected = new Set(spriteLabels(s.labels));
    const model = settings().generation.model;
    const root = document.createElement('div');
    root.className = 'naist-dialog naist-sprites';
    root.innerHTML = `
        <h3>${escapeHtml(t('naist.sprites.title'))}</h3>
        <div class="naist-hint">${escapeHtml(t('naist.sprites.target', { name: character.name, folder: spriteFolder(characterIndex) }))}</div>
        <div class="naist-muted naist-sprites-appearance">${escapeHtml(t('naist.sprites.appearance', { tags: spriteAppearance(characterIndex) || '—' }))}</div>
        <div class="naist-row">
            <label class="checkbox_label"><input type="radio" name="naist_sprite_mode" value="director"${s.mode === 'director' ? ' checked' : ''}><span>${escapeHtml(t('naist.sprites.modeDirector'))}</span></label>
            <label class="checkbox_label"><input type="radio" name="naist_sprite_mode" value="seed"${s.mode === 'seed' ? ' checked' : ''}><span>${escapeHtml(t('naist.sprites.modeSeed'))}</span></label>
        </div>
        <div class="naist-hint naist-sprites-mode-hint"></div>
        <div class="naist-grid2">
            <div><label>${escapeHtml(t('naist.panel.model'))}</label>
            <select class="text_pole naist-sprite-model">${MODELS.map((m) => `<option value="${m.id}"${m.id === model ? ' selected' : ''}>${escapeHtml(t(m.nameKey))}</option>`).join('')}</select></div>
            <div><label class="checkbox_label"><input type="checkbox" class="naist-sprite-transparent"${s.transparent ? ' checked' : ''}><span>${escapeHtml(t('naist.sprites.transparent'))}</span></label></div>
        </div>
        <div class="naist-row">
            <b class="naist-grow">${escapeHtml(t('naist.sprites.labels'))}</b>
            <div class="menu_button naist-sprite-all">${escapeHtml(t('naist.sprites.all'))}</div>
            <div class="menu_button naist-sprite-none">${escapeHtml(t('naist.sprites.none'))}</div>
        </div>
        <div class="naist-sprite-labels">${all
            .map(
                (label) =>
                    `<label class="checkbox_label"><input type="checkbox" value="${escapeHtml(label)}"${selected.has(label) ? ' checked' : ''}><span>${escapeHtml(label)}</span></label>`,
            )
            .join('')}</div>
        <div class="naist-row">
            <div class="menu_button naist-sprite-run">${escapeHtml(t('naist.sprites.run'))}</div>
            <span class="naist-muted naist-sprite-summary"></span>
        </div>
        <div class="naist-sprite-progress"></div>`;

    const modelSelect = root.querySelector('.naist-sprite-model') as HTMLSelectElement;
    const transparent = root.querySelector('.naist-sprite-transparent') as HTMLInputElement;
    const mode = () =>
        root.querySelector<HTMLInputElement>('input[name="naist_sprite_mode"]:checked')?.value === 'seed'
            ? 'seed'
            : 'director';
    const updateMode = () => {
        const id = modelSelect.value;
        const caps = getCapabilities(isModelId(id) ? id : DEFAULT_MODEL);
        transparent.disabled = !caps.transparency || mode() !== 'seed';
        const hint = root.querySelector('.naist-sprites-mode-hint');
        if (hint)
            hint.textContent = t(mode() === 'seed' ? 'naist.sprites.modeSeedHint' : 'naist.sprites.modeDirectorHint');
    };
    const labels = () =>
        [...root.querySelectorAll<HTMLInputElement>('.naist-sprite-labels input:checked')].map((i) => i.value);
    const summary = () => {
        const el = root.querySelector('.naist-sprite-summary');
        if (el) el.textContent = t('naist.sprites.count', { count: labels().length });
    };
    const renderJobs = (jobs: SpriteJob[]) => {
        const el = root.querySelector('.naist-sprite-progress');
        if (!el) return;
        el.innerHTML = jobs
            .map(
                (
                    j,
                ) => `<div class="naist-sprite-job naist-sprite-${j.status}"><i class="${STATUS_ICON[j.status]}"></i> <b>${escapeHtml(j.label)}</b>
                <span class="naist-muted">${escapeHtml(j.how ? t(`naist.sprites.how.${j.how}`) : '')}${j.file ? ` → ${escapeHtml(j.file)}` : ''}${j.error ? ` — ${escapeHtml(j.error)}` : ''}</span></div>`,
            )
            .join('');
    };

    const abort = new AbortController();
    let running = false;
    root.addEventListener('change', () => {
        updateMode();
        summary();
    });
    root.addEventListener('click', (event) => {
        const el = event.target as HTMLElement;
        if (el.classList.contains('naist-sprite-all') || el.classList.contains('naist-sprite-none')) {
            const on = el.classList.contains('naist-sprite-all');
            root.querySelectorAll<HTMLInputElement>('.naist-sprite-labels input').forEach((i) => (i.checked = on));
            summary();
        } else if (el.classList.contains('naist-sprite-run') && !running) {
            const chosen = labels();
            if (!chosen.length) return;
            running = true;
            el.classList.add('disabled');
            s.mode = mode();
            s.transparent = transparent.checked;
            s.labels =
                chosen.length === EXPRESSION_LABELS.length && chosen.every((l, i) => l === EXPRESSION_LABELS[i])
                    ? []
                    : chosen;
            saveSettings();
            void service
                .generate({
                    characterIndex,
                    labels: chosen,
                    mode: s.mode,
                    transparent: s.transparent,
                    model: modelSelect.value,
                    signal: abort.signal,
                    onProgress: renderJobs,
                })
                .then((jobs) => {
                    const done = jobs.filter((j) => j.status === 'done').length;
                    toastr.success(
                        t('naist.sprites.finished', { done, total: jobs.length, folder: spriteFolder(characterIndex) }),
                        t('naist.sprites.title'),
                    );
                })
                .catch(reportGenerationError)
                .finally(() => {
                    running = false;
                    el.classList.remove('disabled');
                });
        }
    });
    updateMode();
    summary();
    localize(root);
    await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, '', {
        wide: true,
        large: true,
        allowVerticalScrolling: true,
        okButton: t('naist.sprites.close'),
    });
    abort.abort();
}
