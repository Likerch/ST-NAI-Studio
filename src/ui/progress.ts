// Generation progress (TZ Phase 5): step previews from the plugin's stream; on other transports a
// bar estimated from the step count, and a one-time hint about what the plugin adds.
import { t } from '../core/i18n';
import { saveSettings, settings } from '../core/settings';
import type { ProgressUi } from '../features/generation/pipeline';
import type { StreamFrame } from '../transport';

function mimeOf(base64: string): string {
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('UklGR')) return 'image/webp';
    return 'image/png';
}

export function createProgressUi(): ProgressUi {
    let root: HTMLElement | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let steps = 0;
    let started = 0;

    const elements = () => {
        if (!root) {
            root = document.createElement('div');
            root.id = 'naist_progress';
            root.className = 'naist-progress naist-hidden';
            root.innerHTML = `
                <div class="naist-progress-head"><b></b><span class="naist-progress-step"></span></div>
                <div class="naist-progress-bar"><span></span></div>
                <img class="naist-progress-preview naist-hidden" alt="">`;
            document.body.append(root);
        }
        return {
            root,
            title: root.querySelector('b') as HTMLElement,
            step: root.querySelector('.naist-progress-step') as HTMLElement,
            bar: root.querySelector('.naist-progress-bar span') as HTMLElement,
            preview: root.querySelector('.naist-progress-preview') as HTMLImageElement,
        };
    };

    const setBar = (fraction: number) => {
        elements().bar.style.width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
    };

    return {
        start({ steps: total, streaming, transport }) {
            const el = elements();
            steps = Math.max(1, total);
            started = Date.now();
            el.title.textContent = t(streaming ? 'naist.progress.streaming' : 'naist.progress.estimating');
            el.step.textContent = '';
            el.preview.classList.add('naist-hidden');
            el.preview.removeAttribute('src');
            el.root.classList.remove('naist-hidden');
            setBar(0);
            if (timer) clearInterval(timer);
            timer = null;
            if (!streaming) {
                // NovelAI takes roughly 1.5 s plus ~0.12 s per step; the bar stops at 95 %.
                const expected = 1500 + steps * 120;
                timer = setInterval(() => setBar(Math.min(0.95, (Date.now() - started) / expected)), 200);
                const s = settings().stream;
                if (transport !== 'plugin' && !s.hintShown) {
                    s.hintShown = true;
                    saveSettings();
                    toastr.info(t('naist.progress.pluginHint'), t('naist.panel.title'), { timeOut: 10000 });
                }
            }
        },
        frame(frame: StreamFrame) {
            const el = elements();
            if (frame.kind === 'intermediate') {
                if (frame.step !== undefined) {
                    el.step.textContent = t('naist.progress.step', { step: frame.step + 1, steps });
                    setBar((frame.step + 1) / steps);
                }
                if (frame.image) {
                    el.preview.src = `data:${mimeOf(frame.image)};base64,${frame.image}`;
                    el.preview.classList.remove('naist-hidden');
                }
            } else if (frame.kind === 'final') {
                setBar(1);
            }
        },
        end() {
            if (timer) clearInterval(timer);
            timer = null;
            setBar(1);
            const el = elements();
            setTimeout(() => el.root.classList.add('naist-hidden'), 400);
        },
    };
}
