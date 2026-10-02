// Scene composer (TZ Phase 4): participants with their passports, outfits, states, poses and
// personal UC; a 5x5 canvas (free on V5) with draggable markers; pair poses; framing and camera;
// a live preview of the prompts; inspector and generation. Automatic assembly fills it in,
// the user decides.
import { ctx } from '../core/context';
import { localize, t } from '../core/i18n';
import { log } from '../core/logger';
import { reportGenerationError } from '../core/notify';
import { saveSettings, settings } from '../core/settings';
import {
    applyPairLayout,
    autoLayout,
    CAMERA_ANGLES,
    DISTANCES,
    FRAMINGS,
    GRID_STEPS,
    PAIR_POSES,
    participantFrom,
    placeOnCanvas,
    STATE_PRESETS,
} from '../domain';
import type { SceneCandidate, SceneSpec } from '../domain';
import { saveCardPassport, savePersonaPassport } from '../features/characters/passport-store';
import type { Pipeline } from '../features/generation/pipeline';
import { currentCaps, PERSONA_PREFIX } from '../features/scene/scene-service';
import type { SceneService } from '../features/scene/scene-service';
import { escapeHtml } from './components/dom';
import { openInspector } from './panel/inspector';
import { editPassport } from './passport-editor';
import { poseSelectOptions } from './pose-helpers';

const COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4dd0e1', '#f06292', '#aed581'];

function options(list: readonly { id: string }[], prefix: string, current: string): string {
    return list
        .map(
            (o) =>
                `<option value="${o.id}"${o.id === current ? ' selected' : ''}>${escapeHtml(t(`${prefix}.${o.id}`))}</option>`,
        )
        .join('');
}

export interface ComposerOptions {
    /** Start from automatic assembly of the last message (default) or an empty scene. */
    auto: boolean;
    /** Candidate key to add first (character card button). */
    focusKey?: string;
}

export async function openComposer(service: SceneService, pipeline: Pipeline, opts: ComposerOptions): Promise<void> {
    const c = ctx();
    const loaded = opts.auto ? await service.autoSpec() : await service.emptySpec();
    let candidates: SceneCandidate[] = loaded.candidates;
    const spec: SceneSpec = loaded.spec;
    if (opts.focusKey && !spec.participants.some((p) => p.key === opts.focusKey)) {
        const candidate = candidates.find((x) => x.key === opts.focusKey);
        if (candidate) spec.participants.unshift(participantFrom(candidate, { x: 0.5, y: 0.5 }));
        relayout();
    }
    let target: 'message' | 'inline' = settings().scene.target;

    const root = document.createElement('div');
    root.className = 'naist-dialog naist-composer';

    function relayout(keepPositions = false): void {
        const caps = currentCaps();
        const locked = spec.participants.map((p) => (keepPositions ? p.position : (p.passport?.position ?? null)));
        const positions = autoLayout(spec.participants.length, caps, locked);
        spec.participants.forEach((p, i) => (p.position = positions[i] ?? p.position));
        applyPairLayout(spec, caps);
    }

    const caps = () => currentCaps();

    const over = (index: number) =>
        caps().maxCharacters > 0 &&
        spec.participants.filter((p, i) => p.enabled && i <= index).length > caps().maxCharacters;

    const renderSlots = () =>
        spec.participants
            .map((p, i) => {
                const outfits = p.passport?.outfits ?? [];
                const states =
                    p.passport?.states ?? Object.keys(STATE_PRESETS).map((id) => ({ id, tags: '', enabled: false }));
                return `
            <div class="naist-slot${over(i) ? ' naist-disabled' : ''}" data-index="${i}" style="border-left-color:${COLORS[i % COLORS.length]}">
                <div class="naist-row">
                    <b class="naist-grow">${i + 1}. ${escapeHtml(p.name)}</b>
                    ${p.passport ? '' : `<span class="naist-badge naist-badge-warn">${escapeHtml(t('naist.composer.noPassport'))}</span>`}
                    ${over(i) ? `<span class="naist-badge naist-badge-warn">${escapeHtml(t('naist.composer.overLimit'))}</span>` : ''}
                    <label class="checkbox_label"><input type="checkbox" class="naist-slot-on"${p.enabled ? ' checked' : ''}><span>${escapeHtml(t('naist.composer.inFrame'))}</span></label>
                    <div class="menu_button fa-solid fa-arrow-up naist-slot-up" title="${escapeHtml(t('naist.composer.up'))}"></div>
                    <div class="menu_button fa-solid fa-arrow-down naist-slot-down" title="${escapeHtml(t('naist.composer.down'))}"></div>
                    <div class="menu_button fa-solid fa-id-card naist-slot-passport" title="${escapeHtml(t('naist.composer.editPassport'))}"></div>
                    <div class="menu_button fa-solid fa-xmark naist-slot-remove" title="${escapeHtml(t('naist.composer.remove'))}"></div>
                </div>
                <div class="naist-grid3">
                    <div><label>${escapeHtml(t('naist.composer.pose'))}</label><select class="text_pole naist-slot-pose">${poseSelectOptions(p.pose)}</select></div>
                    <div><label>${escapeHtml(t('naist.composer.poseTags'))}</label><input class="text_pole naist-slot-pose-tags" value="${escapeHtml(p.poseTags)}"></div>
                    <div><label>${escapeHtml(t('naist.composer.outfit'))}</label><select class="text_pole naist-slot-outfit"${outfits.length ? '' : ' disabled'}>
                        <option value="">${escapeHtml(t('naist.composer.outfitDefault'))}</option>
                        ${outfits.map((o) => `<option value="${escapeHtml(o.name)}"${o.name === p.outfit ? ' selected' : ''}>${escapeHtml(o.name)}</option>`).join('')}
                    </select></div>
                </div>
                <div class="naist-flags naist-slot-states">${states
                    .map((s) => {
                        const on = s.enabled || p.states.includes(s.id);
                        const label = s.id in STATE_PRESETS ? t(`naist.state.${s.id}`) : s.id;
                        return `<label class="checkbox_label"><input type="checkbox" data-state="${escapeHtml(s.id)}"${on ? ' checked' : ''}${s.enabled ? ' disabled' : ''}><span>${escapeHtml(label)}</span></label>`;
                    })
                    .join('')}</div>
                <input class="text_pole naist-slot-negative" placeholder="${escapeHtml(t('naist.composer.negative'))}" value="${escapeHtml(p.negative)}">
            </div>`;
            })
            .join('');

    const renderCanvas = () => {
        const grid = caps().positioning === 'grid';
        const lines = grid
            ? GRID_STEPS.map(
                  (v) =>
                      `<span class="naist-canvas-cell" style="left:${(v - 0.1) * 100}%;top:0;width:20%;height:100%"></span>`,
              ).join('') +
              GRID_STEPS.map(
                  (v) =>
                      `<span class="naist-canvas-cell" style="top:${(v - 0.1) * 100}%;left:0;height:20%;width:100%"></span>`,
              ).join('')
            : '';
        const markers = spec.participants
            .map((p, i) =>
                p.enabled
                    ? `<span class="naist-marker" data-index="${i}" style="left:${p.position.x * 100}%;top:${p.position.y * 100}%;background:${COLORS[i % COLORS.length]}" title="${escapeHtml(p.name)}">${i + 1}</span>`
                    : '',
            )
            .join('');
        return `<div class="naist-canvas${grid ? ' naist-canvas-grid' : ''}">${lines}${markers}</div>`;
    };

    const renderPair = () => {
        const names = spec.participants
            .map((p, i) => `<option value="${i}">${i + 1}. ${escapeHtml(p.name)}</option>`)
            .join('');
        return `
            <select class="text_pole naist-pair-pose">
                <option value="">${escapeHtml(t('naist.composer.noPair'))}</option>
                ${PAIR_POSES.map((p) => `<option value="${p.id}"${spec.pair?.pose === p.id ? ' selected' : ''}>${escapeHtml(t(`naist.pair.${p.id}`))}</option>`).join('')}
            </select>
            <select class="text_pole naist-pair-a">${names}</select>
            <select class="text_pole naist-pair-b">${names}</select>`;
    };

    const renderPreview = () => {
        const built = service.build(spec);
        const lines = [
            `${t('naist.composer.basePrompt')}: ${built.prompt || '—'}`,
            ...built.characters.map(
                (ch, i) =>
                    `${i + 1}. ${ch.prompt}${ch.negative ? `  [−] ${ch.negative}` : ''}${built.useCoords ? `  @ (${ch.x}, ${ch.y})` : ''}`,
            ),
        ];
        const warnings = [
            built.withoutPassport.length
                ? t('naist.composer.warnNoPassport', { names: built.withoutPassport.join(', ') })
                : '',
            built.dropped.length
                ? t('naist.composer.warnDropped', { names: built.dropped.join(', '), max: caps().maxCharacters })
                : '',
        ].filter(Boolean);
        return `<pre class="naist-composer-preview">${escapeHtml(lines.join('\n'))}</pre>${warnings.map((w) => `<div class="naist-warning">${escapeHtml(w)}</div>`).join('')}`;
    };

    const available = () => candidates.filter((x) => !spec.participants.some((p) => p.key === x.key));

    const render = () => {
        const max = caps().maxCharacters;
        const full = max > 0 && spec.participants.length >= max;
        root.innerHTML = `
            <h3>${escapeHtml(t('naist.composer.title'))}</h3>
            <div class="naist-row">
                <div class="menu_button naist-c-auto"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml(t('naist.composer.auto'))}</div>
                <select class="text_pole naist-c-add"${full || !available().length ? ' disabled' : ''}>
                    <option value="">${escapeHtml(full ? t('naist.composer.full', { max }) : t('naist.composer.add'))}</option>
                    ${available()
                        .map(
                            (x) =>
                                `<option value="${escapeHtml(x.key)}">${escapeHtml(x.name)}${x.isUser ? ` (${escapeHtml(t('naist.composer.persona'))})` : ''}</option>`,
                        )
                        .join('')}
                </select>
                <div class="menu_button naist-c-layout" title="${escapeHtml(t('naist.composer.relayout'))}"><i class="fa-solid fa-table-cells"></i></div>
                <span class="naist-muted">${escapeHtml(t('naist.composer.limit', { count: spec.participants.length, max: max || 0 }))}</span>
            </div>
            <label>${escapeHtml(t('naist.composer.base'))}</label>
            <div class="naist-row"><textarea class="text_pole naist-grow naist-c-base" rows="2" placeholder="${escapeHtml(t('naist.composer.basePlaceholder'))}">${escapeHtml(spec.base)}</textarea>
                <div class="menu_button fa-solid fa-mountain-sun naist-c-llm" title="${escapeHtml(t('naist.composer.llmBase'))}"></div></div>
            <div class="naist-grid3">
                <div><label>${escapeHtml(t('naist.composer.framing'))}</label><select class="text_pole naist-c-framing">${options(FRAMINGS, 'naist.framing', spec.framing)}</select></div>
                <div><label>${escapeHtml(t('naist.composer.camera'))}</label><select class="text_pole naist-c-camera">${options(CAMERA_ANGLES, 'naist.camera', spec.camera)}</select></div>
                <div><label>${escapeHtml(t('naist.composer.distance'))}</label><select class="text_pole naist-c-distance">${options(DISTANCES, 'naist.distance', spec.distance)}</select></div>
            </div>
            <div class="naist-composer-body">
                <div class="naist-composer-left">
                    ${renderCanvas()}
                    <label class="checkbox_label"><input type="checkbox" class="naist-c-coords"${spec.useCoords ? ' checked' : ''}><span>${escapeHtml(t('naist.composer.useCoords'))}</span></label>
                    <div class="naist-hint">${escapeHtml(t(caps().positioning === 'grid' ? 'naist.composer.gridHint' : caps().positioning === 'none' ? 'naist.composer.noPositions' : 'naist.composer.freeHint'))}</div>
                </div>
                <div class="naist-composer-slots">${renderSlots() || `<div class="naist-hint">${escapeHtml(t('naist.composer.empty'))}</div>`}</div>
            </div>
            <div class="naist-section"><b>${escapeHtml(t('naist.composer.pair'))}</b><div class="naist-row naist-c-pair">${renderPair()}</div></div>
            <div class="naist-row">
                <label>${escapeHtml(t('naist.composer.target'))}</label>
                <select class="text_pole naist-c-target">
                    <option value="message"${target === 'message' ? ' selected' : ''}>${escapeHtml(t('naist.composer.targetMessage'))}</option>
                    <option value="inline"${target === 'inline' ? ' selected' : ''}>${escapeHtml(t('naist.composer.targetInline'))}</option>
                </select>
                <label class="checkbox_label"><input type="checkbox" class="naist-c-nsfw"${settings().scene.allowNsfw ? ' checked' : ''}><span>${escapeHtml(t('naist.composer.allowNsfw'))}</span></label>
                <div class="menu_button naist-c-inspect"><i class="fa-solid fa-magnifying-glass"></i> ${escapeHtml(t('naist.panel.inspect'))}</div>
            </div>
            <div class="naist-c-preview">${renderPreview()}</div>`;
        const pairA = root.querySelector<HTMLSelectElement>('.naist-pair-a');
        const pairB = root.querySelector<HTMLSelectElement>('.naist-pair-b');
        if (pairA) pairA.value = String(spec.pair?.a ?? 0);
        if (pairB) pairB.value = String(spec.pair?.b ?? Math.min(1, Math.max(0, spec.participants.length - 1)));
        localize(root);
    };

    const refreshPreview = () => {
        const box = root.querySelector('.naist-c-preview');
        if (box) box.innerHTML = renderPreview();
    };

    const slotOf = (el: Element) => spec.participants[Number(el.closest<HTMLElement>('.naist-slot')?.dataset.index)];

    root.addEventListener('input', (event) => {
        const target2 = event.target as HTMLInputElement;
        if (target2.classList.contains('naist-c-base')) spec.base = target2.value;
        else if (target2.classList.contains('naist-slot-pose-tags')) {
            const p = slotOf(target2);
            if (p) p.poseTags = target2.value;
        } else if (target2.classList.contains('naist-slot-negative')) {
            const p = slotOf(target2);
            if (p) p.negative = target2.value;
        } else return;
        refreshPreview();
    });

    root.addEventListener('change', (event) => {
        const el = event.target as HTMLInputElement & HTMLSelectElement;
        const p = slotOf(el);
        if (el.classList.contains('naist-c-framing')) spec.framing = el.value;
        else if (el.classList.contains('naist-c-camera')) spec.camera = el.value;
        else if (el.classList.contains('naist-c-distance')) spec.distance = el.value;
        else if (el.classList.contains('naist-c-coords')) spec.useCoords = el.checked;
        else if (el.classList.contains('naist-c-target')) target = el.value === 'inline' ? 'inline' : 'message';
        else if (el.classList.contains('naist-c-nsfw')) {
            settings().scene.allowNsfw = el.checked;
            saveSettings();
        } else if (el.classList.contains('naist-slot-on') && p) {
            p.enabled = el.checked;
            render();
            return;
        } else if (el.classList.contains('naist-slot-pose') && p) p.pose = el.value;
        else if (el.classList.contains('naist-slot-outfit') && p) p.outfit = el.value;
        else if (el.dataset.state && p) {
            const id = el.dataset.state;
            p.states = el.checked ? [...new Set([...p.states, id])] : p.states.filter((s) => s !== id);
        } else if (el.classList.contains('naist-c-add') && el.value) {
            const candidate = candidates.find((x) => x.key === el.value);
            if (candidate) {
                spec.participants.push(participantFrom(candidate, { x: 0.5, y: 0.5 }));
                relayout(true);
                const last = spec.participants.at(-1);
                if (last) last.position = autoLayout(spec.participants.length, caps()).at(-1) ?? last.position;
            }
            render();
            return;
        } else if (
            el.classList.contains('naist-pair-pose') ||
            el.classList.contains('naist-pair-a') ||
            el.classList.contains('naist-pair-b')
        ) {
            const pose = root.querySelector<HTMLSelectElement>('.naist-pair-pose')?.value ?? '';
            const a = Number(root.querySelector<HTMLSelectElement>('.naist-pair-a')?.value ?? 0);
            const b = Number(root.querySelector<HTMLSelectElement>('.naist-pair-b')?.value ?? 1);
            spec.pair = pose && a !== b ? { pose, a, b } : null;
            applyPairLayout(spec, caps());
            render();
            return;
        } else return;
        refreshPreview();
    });

    root.addEventListener('click', (event) => {
        const el = event.target as HTMLElement;
        const index = Number(el.closest<HTMLElement>('.naist-slot')?.dataset.index);
        if (el.closest('.naist-c-auto')) {
            void service
                .autoSpec()
                .then((next) => {
                    candidates = next.candidates;
                    Object.assign(spec, next.spec);
                    render();
                })
                .catch(reportGenerationError);
        } else if (el.closest('.naist-c-layout')) {
            relayout();
            render();
        } else if (el.closest('.naist-c-llm')) {
            void service.describeLocation().then((text) => {
                if (text) spec.base = text;
                render();
            });
        } else if (el.closest('.naist-c-inspect')) {
            const built = service.build(spec);
            try {
                void openInspector(pipeline.previewScene(built.prompt, service.overrides(built)), {
                    confirmSend: false,
                });
            } catch (error) {
                reportGenerationError(error);
            }
        } else if (el.classList.contains('naist-slot-up') && index > 0) {
            const [moved] = spec.participants.splice(index, 1);
            if (moved) spec.participants.splice(index - 1, 0, moved);
            spec.pair = null;
            render();
        } else if (el.classList.contains('naist-slot-down') && index < spec.participants.length - 1) {
            const [moved] = spec.participants.splice(index, 1);
            if (moved) spec.participants.splice(index + 1, 0, moved);
            spec.pair = null;
            render();
        } else if (el.classList.contains('naist-slot-remove')) {
            spec.participants.splice(index, 1);
            spec.pair = null;
            render();
        } else if (el.classList.contains('naist-slot-passport')) {
            const p = spec.participants[index];
            if (!p) return;
            void editPassport(p.name, p.passport).then(async (passport) => {
                if (!passport) return;
                if (p.key.startsWith(PERSONA_PREFIX)) savePersonaPassport(p.key.slice(PERSONA_PREFIX.length), passport);
                else {
                    const charIndex = c.characters.findIndex((ch) => ch.avatar.replace(/\.[^/.]+$/, '') === p.key);
                    if (charIndex >= 0) await saveCardPassport(charIndex, passport);
                }
                p.passport = passport;
                const candidate = candidates.find((x) => x.key === p.key);
                if (candidate) candidate.passport = passport;
                render();
            });
        }
    });

    // Dragging a marker on the canvas moves the participant (snapped on grid models).
    root.addEventListener('pointerdown', (event) => {
        const marker = (event.target as HTMLElement).closest<HTMLElement>('.naist-marker');
        const canvas = marker?.closest<HTMLElement>('.naist-canvas');
        if (!marker || !canvas) return;
        event.preventDefault();
        const p = spec.participants[Number(marker.dataset.index)];
        if (!p) return;
        const move = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            const point = placeOnCanvas(
                { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height },
                caps(),
            );
            p.position = point;
            marker.style.left = `${point.x * 100}%`;
            marker.style.top = `${point.y * 100}%`;
        };
        const up = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            spec.useCoords = true;
            const coords = root.querySelector<HTMLInputElement>('.naist-c-coords');
            if (coords) coords.checked = true;
            refreshPreview();
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
    });

    render();
    const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, '', {
        okButton: t('naist.composer.generate'),
        cancelButton: t('naist.inspector.cancel'),
        wide: true,
        large: true,
        allowVerticalScrolling: true,
    });
    const s = settings().scene;
    s.framing = spec.framing;
    s.camera = spec.camera;
    s.distance = spec.distance;
    s.useCoords = spec.useCoords;
    s.target = target;
    saveSettings();
    if (result !== c.POPUP_RESULT.AFFIRMATIVE) return;
    try {
        await service.generate(spec, target);
    } catch (error) {
        log.warn('scene generation failed', error);
        reportGenerationError(error);
    }
}
