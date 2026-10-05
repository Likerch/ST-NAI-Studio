// Doom's Enhancement Suite integration (v0.9, docs/research/des-integration.md). With DES on:
// - scenes and image markers get the tracker's people (current look over their passport) and the
//   scene (time of day, weather, indoors / outdoors, location); in separate / external mode marker
//   images wait for the tracker of their reply;
// - a new character of the tracker gets a passport (found in the cards of the chat, else written
//   from the tracker) and the passport becomes its DES "Portrait prompt";
// - NAI Studio draws the DES portraits: DES's own auto portraits are off meanwhile, NAI Studio decides
//   when (missing / state changed / every reply) and calls DES's regeneration, whose /sd call it
//   recognises by the appearance line and enriches (passport, current look, framing, stable seed);
// - NAI Studio items in the DES portrait menu, "Illustrate" on scene banners, a Workshop button.
// Since v0.10 passports are the chat's view of them (chat overrides, passports of the chat itself).
// Since v0.11 automatic portraits wait for the quality gates' verdict on the reply of the tracker.
// Since v0.12 a character a passport provider knows (Maestro's lore entry) uses that passport instead of
// getting a new one written into the card; the cards and the chat still win.
// Since v0.12.1 a tracker look that a passport outfit recorded (Outfit.looks, Maestro's wardrobe) draws
// that outfit instead of the look.
import { ctx } from '../../core/context';
import { t } from '../../core/i18n';
import { log } from '../../core/logger';
import { reportGenerationError } from '../../core/notify';
import { notifyExternalChange, saveSettings, settings } from '../../core/settings';
import {
    defaultPassport,
    hasCyrillic,
    joinTags,
    markerDimensions,
    mentionIndex,
    outfitForLook,
    passportTags,
    resolveChatPassport,
    trackerFromSwipe,
    trackerFromText,
    withoutCountTags,
} from '../../domain';
import type { DesCharacter, DesTracker, MarkerParams, Passport, SceneCandidate } from '../../domain';
import { generateTrackerPassport } from '../../features/characters/passport-generator';
import { interpretForModel } from '../../features/language/interpreter';
import {
    chatCardIndexes,
    chatPassportData,
    loadCharacter,
    locatePassport,
    onPassportsSaved,
    resolvedCardPassports,
    saveCardPassport,
} from '../../features/characters/passport-store';
import { onStudioEvent } from '../../features/events/studio-events';
import { setCurrentLocation } from '../../features/continuity/continuity-service';
import type { MarkerService } from '../../features/markers/marker-service';
import { qualityGatesActive, replyVerdict } from '../../features/quality/quality-gate';
import type { QualityVerdict } from '../../features/quality/quality-gate';
import { providedPassports } from '../../features/scene/passport-providers';
import { setSceneProvider } from '../../features/scene/scene-service';
import type { SceneQuery } from '../../features/scene/scene-service';
import { setExtraSpriteFolder } from '../../features/sprites/sprite-service';
import { editPassport } from '../../ui/passport-editor';
import { editLocatedPassport } from '../../ui/passport-scope';
import { setPortraitHook } from '../commands';
import type { PortraitPlan } from '../commands';
import { editPersonaPassport, openEmotions } from '../scene-setup';
import { connectDes } from './des-adapter';
import type { DesApi } from './des-adapter';

interface Found {
    /** Card of the passport; null for a passport of the chat itself. */
    cardIndex: number | null;
    /** As the current chat sees it. */
    passport: Passport;
}

export interface DesStatus {
    state: 'searching' | 'absent' | 'connected';
    version: string | null;
    verified: boolean;
    mode: string;
    enabled: boolean;
}

const TRACKER_EVENT = 'dooms_tracker_update_complete';
const TRACKER_WAIT_MS = 120000;

/** Letters and digits only: DES cleans /sd prompts (quotes, pipes, commas) before sending them. */
const normalizeLine = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

const sameName = (a: string, b: string) => mentionIndex(a, [b]) >= 0 || mentionIndex(b, [a]) >= 0;

/** One seed per character name: the same face across regenerated portraits. */
function stableSeed(name: string): number {
    let hash = 5381;
    for (const ch of name.toLowerCase()) hash = ((hash << 5) + hash + ch.codePointAt(0)!) >>> 0;
    return hash % 4294967295;
}

function hashOf(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = (Math.imul(31, hash) + text.charCodeAt(i)) | 0;
    return (hash >>> 0).toString(16);
}

export class DesIntegration {
    private api: DesApi | null = null;
    private state: DesStatus['state'] = 'searching';
    /** Normalised appearance line written to DES → character name. */
    private readonly lines = new Map<string, string>();
    private readonly passportJobs = new Map<string, Promise<Found | null>>();
    private readonly failed = new Set<string>();
    /**
     * DES portraits are asked one by one and in order; each one's NovelAI request then waits in the
     * one queue of the extension behind the pictures of the reply (priority "portrait", v0.13.1).
     */
    private portraitQueue: Promise<unknown> = Promise.resolve();
    /** Portraits asked for from the menu: the user's own requests in the NovelAI queue. */
    private readonly manualPortraits = new Set<string>();
    private lastLocation = '';
    private timer: ReturnType<typeof setTimeout> | null = null;
    private readonly listeners = new Set<() => void>();
    /** Russian tracker looks converted to tags (kept apart from the passport tags they join). */
    private readonly looks = new Map<string, Promise<string>>();

    constructor(private readonly markers: MarkerService) {}

    // ---- status ---------------------------------------------------------------------------

    status(): DesStatus {
        return {
            state: this.state,
            version: this.api?.version ?? null,
            verified: this.api?.verified ?? false,
            mode: this.api?.mode() ?? '',
            enabled: this.api?.enabled() ?? false,
        };
    }

    onStatus(listener: () => void): void {
        this.listeners.add(listener);
    }

    private changed(): void {
        for (const listener of this.listeners) listener();
        // The panel re-reads its controls (the status line of the DES section).
        notifyExternalChange();
    }

    active(): boolean {
        return !!this.api && this.api.enabled() && settings().des.enabled;
    }

    async start(): Promise<void> {
        this.api = await connectDes();
        this.state = this.api ? 'connected' : 'absent';
        if (this.api) {
            log.info(`Doom's Enhancement Suite ${this.api.version ?? '?'} connected (${this.api.mode()})`);
            if (!this.api.verified) log.warn(`DES ${this.api.version}: integration checked on 2.6.0 only`);
            this.install();
        }
        this.changed();
    }

    /** Settings of the integration changed in the panel. */
    settingsChanged(): void {
        if (!this.api) return;
        this.applyPortraitMode();
        if (this.active()) this.schedule(false);
        this.changed();
    }

    // ---- wiring ---------------------------------------------------------------------------

    private install(): void {
        const c = ctx();
        setSceneProvider({
            candidates: (query) => this.candidates(query),
            setting: (query) => this.setting(query),
        });
        this.markers.setGate({
            holdEarlyStart: () => this.active() && this.api!.mode() !== 'together',
            wait: (messageId, signal) => this.waitForTracker(messageId, signal),
        });
        setPortraitHook((prompt) => this.portraitPlan(prompt));
        setExtraSpriteFolder((name) => (this.active() && settings().des.emotionsToDes ? name : null));
        onPassportsSaved((index, passports) => this.syncCard(index, passports));
        // A passport changed for this chat only: the appearance lines follow it.
        onStudioEvent('passportsSaved', (detail) => {
            if (detail.scope === 'chat') this.schedule(false);
        });
        const received = c.eventTypes.MESSAGE_RECEIVED;
        const after = (_id: unknown, type: unknown) => {
            if (type !== 'quiet' && type !== 'impersonate') this.schedule(true);
        };
        // After DES's own MESSAGE_RECEIVED handler (it parses the tracker there in together mode).
        const source = c.eventSource as STEventSource & {
            makeLast?: (e: string, l: (...a: unknown[]) => unknown) => void;
        };
        if (received && source.makeLast) source.makeLast(received, after);
        else if (received) c.eventSource.on(received, after);
        c.eventSource.on(TRACKER_EVENT, () => this.schedule(true));
        if (c.eventTypes.MESSAGE_SWIPED) c.eventSource.on(c.eventTypes.MESSAGE_SWIPED, () => this.schedule(false));
        if (c.eventTypes.CHAT_CHANGED)
            c.eventSource.on(c.eventTypes.CHAT_CHANGED, () => {
                this.lastLocation = '';
                this.schedule(false);
            });
        this.applyPortraitMode();
        this.installMenu();
        this.installBanners();
        this.installWorkshop();
        this.schedule(false);
    }

    /** NAI Studio draws the portraits: DES's auto portraits are off meanwhile and come back after. */
    private applyPortraitMode(): void {
        if (!this.api) return;
        const d = settings().des;
        const des = this.api.settings;
        const want = this.active() && d.portraits;
        if (want && !d.saved) {
            d.saved = {
                autoPortraitMode: String(des.autoPortraitMode ?? 'only_missing'),
                autoGenerateAvatars: des.autoGenerateAvatars === true,
            };
            des.autoPortraitMode = 'off';
            des.autoGenerateAvatars = false;
        } else if (!want && d.saved) {
            des.autoPortraitMode = d.saved.autoPortraitMode;
            des.autoGenerateAvatars = d.saved.autoGenerateAvatars;
            d.saved = null;
        } else return;
        this.api.save();
        saveSettings();
    }

    // ---- tracker --------------------------------------------------------------------------

    private trackerOf(messageId: number): DesTracker | null {
        const m = ctx().chat[messageId];
        if (!m || m.is_user || m.is_system) return null;
        return (
            trackerFromSwipe(m.extra, Number(m.swipe_id ?? 0)) ??
            (this.api?.mode() === 'together' ? trackerFromText(m.mes) : null)
        );
    }

    private latestTracker(): DesTracker | null {
        return this.latestTrackerAt()?.tracker ?? null;
    }

    /** The newest tracker and the reply it belongs to. */
    private latestTrackerAt(): { tracker: DesTracker; messageId: number } | null {
        const chat = ctx().chat;
        for (let i = chat.length - 1; i >= 0; i--) {
            const tracker = this.trackerOf(i);
            if (tracker) return { tracker, messageId: i };
        }
        return null;
    }

    /** The tracker of a reply: in its text (together mode, before DES parses it), saved, or the latest. */
    private trackerFor(query: SceneQuery): DesTracker | null {
        if (query.text && this.api?.mode() === 'together') {
            const inText = trackerFromText(query.text);
            if (inText) return inText;
        }
        if (query.messageId !== undefined) {
            const saved = this.trackerOf(query.messageId);
            if (saved) return saved;
        }
        return this.latestTracker();
    }

    private async waitForTracker(messageId: number, signal?: AbortSignal): Promise<void> {
        if (!this.active() || this.api!.mode() === 'together') return;
        const started = Date.now();
        while (Date.now() - started < TRACKER_WAIT_MS && !signal?.aborted) {
            const m = ctx().chat[messageId];
            if (!m || trackerFromSwipe(m.extra, Number(m.swipe_id ?? 0))) return;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        log.warn('DES: no tracker for the reply, marker images use the latest one');
    }

    private isUserName(name: string): boolean {
        return sameName(name, ctx().name1);
    }

    private aliasesOf(name: string): string[] {
        const store = this.api?.settings.characterAliases;
        const list = store?.[name];
        return Array.isArray(list) ? list.filter((a): a is string => typeof a === 'string') : [];
    }

    /**
     * A tracker look as tags: converted on its own, so the passport tags it joins are not sent
     * through the converter again. English is used as written.
     */
    private lookTags(look: string): Promise<string> {
        if (!look.trim() || !hasCyrillic(look)) return Promise.resolve(look);
        let converted = this.looks.get(look);
        if (!converted) {
            converted = interpretForModel(look, settings().generation.model, { force: true })
                .then((result) => withoutCountTags(result?.prompt ?? look))
                .catch(() => look);
            if (this.looks.size > 200) this.looks.clear();
            this.looks.set(look, converted);
        }
        return converted;
    }

    private async candidates(query: SceneQuery): Promise<SceneCandidate[]> {
        if (!this.active() || !settings().des.characters) return [];
        const tracker = this.trackerFor(query);
        if (!tracker) return [];
        const people = tracker.characters.filter((ch) => !this.isUserName(ch.name));
        return await Promise.all(
            people.map(async (ch) => {
                const look = await this.lookTags(ch.look);
                return {
                    key: `des:${ch.name}`,
                    name: ch.name,
                    aliases: this.aliasesOf(ch.name),
                    passport: null,
                    fallbackPrompt: '',
                    fallbackNegative: '',
                    isUser: false,
                    ...(look ? { currentLook: look, currentLookText: ch.look.trim() } : {}),
                };
            }),
        );
    }

    private async setting(query: SceneQuery): Promise<{ tags: string[]; location: string }> {
        if (!this.active() || !settings().des.sceneTags) return { tags: [], location: '' };
        const scene = this.trackerFor(query)?.scene;
        return { tags: scene?.tags ?? [], location: scene?.location ?? '' };
    }

    private schedule(portraits: boolean): void {
        if (this.timer) clearTimeout(this.timer);
        const withPortraits = portraits;
        this.timer = setTimeout(() => {
            this.timer = null;
            void this.handleTracker(withPortraits).catch((error) => log.warn('DES tracker handling failed', error));
        }, 400);
    }

    /** After a tracker update: location, passports of new characters, appearance lines, portraits. */
    private async handleTracker(portraits: boolean): Promise<void> {
        if (!this.active()) return;
        const latest = this.latestTrackerAt();
        if (!latest) return;
        const { tracker, messageId } = latest;
        const d = settings().des;
        // Automatic portraits wait for the quality gates' verdict on the reply of the tracker (asked once).
        let verdict: Promise<QualityVerdict> | undefined;
        const approval = () => {
            if (!qualityGatesActive()) return undefined;
            const streaming = this.markers.generating === true && messageId === ctx().chat.length - 1;
            return (verdict ??= replyVerdict(messageId, { streaming }));
        };
        const location = tracker.scene?.location ?? '';
        if (d.sceneTags && location && location !== this.lastLocation) {
            this.lastLocation = location;
            if (settings().continuity.enabled) await setCurrentLocation(location).catch(() => undefined);
        }
        for (const character of tracker.characters) {
            if (this.isUserName(character.name)) continue;
            const found =
                (await this.findPassport(character.name, { provided: { messageId } })) ??
                (d.autoPassports ? await this.createPassport(character) : null);
            this.syncLine(character.name, found?.passport ?? null, character.look);
            if (portraits && d.portraits) this.maybePortrait(character, found, approval);
        }
    }

    // ---- passports ------------------------------------------------------------------------

    private chatCards(): number[] {
        return chatCardIndexes();
    }

    /** Card new passports go to: the 1:1 character, in a group the speaker of the last reply. */
    private targetCard(): number | null {
        const c = ctx();
        const cards = this.chatCards();
        if (cards.length <= 1) return cards[0] ?? null;
        const last = [...c.chat].reverse().find((m) => !m.is_user && !m.is_system);
        const avatar = typeof last?.original_avatar === 'string' ? last.original_avatar : '';
        const speaker = c.characters.findIndex((ch) => ch.avatar === avatar);
        return speaker >= 0 ? speaker : (cards[0] ?? null);
    }

    private isCardCharacter(name: string): boolean {
        return this.chatCards().some((i) => sameName(ctx().characters[i]?.name ?? '', name));
    }

    /**
     * The character passport of a name in the cards of the chat (name, aliases, sound), then among the
     * passports of the chat itself; as the chat sees it. With `provided` (v0.12) then among the passports
     * of the passport providers for that scene (stored nowhere: `cardIndex` null).
     */
    async findPassport(name: string, options: { provided?: SceneQuery } = {}): Promise<Found | null> {
        const chat = chatPassportData();
        const matches = (passport: Passport, own: string) =>
            passport.kind === 'character' &&
            (mentionIndex(name, [own, ...passport.aliases]) >= 0 || mentionIndex(own, [name]) >= 0);
        for (const cardIndex of this.chatCards()) {
            const card = await loadCharacter(cardIndex);
            for (const passport of resolvedCardPassports(card, chat)) {
                if (matches(passport, passport.name || card?.name || '')) return { cardIndex, passport };
            }
        }
        const own = chat.extra.find((passport) => passport.name && matches(passport, passport.name));
        if (own) return { cardIndex: null, passport: own };
        if (!options.provided) return null;
        const provided = (await providedPassports(options.provided)).find((passport) =>
            matches(passport, passport.name),
        );
        return provided ? { cardIndex: null, passport: provided } : null;
    }

    /** A passport written from the tracker for a character the cards do not know yet. */
    private createPassport(character: DesCharacter): Promise<Found | null> {
        const key = character.name.toLowerCase();
        if (this.failed.has(key)) return Promise.resolve(null);
        const running = this.passportJobs.get(key);
        if (running) return running;
        const job = (async (): Promise<Found | null> => {
            const cardIndex = this.targetCard();
            if (cardIndex === null) return null;
            try {
                const passport = await generateTrackerPassport(character.name, character.look, cardIndex);
                passport.aliases = [...new Set([...passport.aliases, ...this.aliasesOf(character.name)])];
                await saveCardPassport(cardIndex, passport);
                toastr.info(t('naist.des.passportCreated', { name: character.name }), t('naist.des.title'));
                return { cardIndex, passport };
            } catch (error) {
                this.failed.add(key);
                log.warn(`DES: passport for ${character.name} not written`, error);
                return null;
            } finally {
                this.passportJobs.delete(key);
            }
        })();
        this.passportJobs.set(key, job);
        return job;
    }

    /** The passport as the DES "Portrait prompt" of the character (or the current look without one). */
    private syncLine(name: string, passport: Passport | null, look = ''): void {
        if (!this.api) return;
        const line = passport ? passportTags(passport, { allowNsfw: false }) : look.trim();
        if (!line) return;
        this.lines.set(normalizeLine(line), name);
        const store = (this.api.settings.characterAppearance ??= {});
        if (store[name] === line) return;
        store[name] = line;
        this.api.save();
    }

    private syncCard(index: number, passports: Passport[]): void {
        if (!this.active()) return;
        const card = ctx().characters[index];
        const cardName = card?.name ?? '';
        // A card of this chat: its passports as the chat sees them.
        const chat = this.chatCards().includes(index) ? chatPassportData() : null;
        for (const stored of passports) {
            const passport = chat ? resolveChatPassport(stored, card?.avatar, chat) : stored;
            if (passport.kind === 'character') this.syncLine(passport.name || cardName, passport);
        }
    }

    // ---- portraits ------------------------------------------------------------------------

    private portraitRecords(): Record<string, string> {
        const meta = (ctx().chatMetadata.nai_studio ??= {}) as { desPortraits?: Record<string, string> };
        return (meta.desPortraits ??= {});
    }

    private maybePortrait(
        character: DesCharacter,
        found: Found | null,
        approval?: () => Promise<QualityVerdict> | undefined,
    ): void {
        const api = this.api;
        if (!api || this.isCardCharacter(character.name)) return;
        const name = character.name;
        const existing = api.settings.npcAvatars?.[name];
        const records = this.portraitRecords();
        // A portrait the user uploaded (DES did not generate it, nor did we): never replaced.
        if (existing && !records[name] && !api.settings.generatedPortraits?.[name]) return;
        const line = found ? passportTags(found.passport, { allowNsfw: false }) : character.look;
        if (!line.trim()) return;
        const hash = hashOf(`${found?.passport.id ?? ''}|${line}|${character.look}`);
        const policy = settings().des.portraitPolicy;
        const due = !existing || policy === 'every' || (policy === 'state' && records[name] !== hash);
        if (!due) return;
        const verdict = approval?.();
        this.portraitQueue = this.portraitQueue.then(async () => {
            if (verdict && (await verdict) !== 'draw') {
                log.info(`DES: portrait of ${name} skipped by the quality gate`);
                return;
            }
            try {
                const url = await api.regeneratePortrait(name);
                if (url) {
                    records[name] = hash;
                    await ctx().saveMetadata();
                    api.refreshPortraits();
                }
            } catch (error) {
                log.warn(`DES: portrait of ${name} failed`, error);
            }
        });
    }

    /** DES's /sd call for an appearance line NAI Studio wrote: the full portrait request. */
    private async portraitPlan(prompt: string): Promise<PortraitPlan | null> {
        if (!this.active()) return null;
        const name = this.lines.get(normalizeLine(prompt));
        if (!name) return null;
        const found = await this.findPassport(name, { provided: {} });
        const raw = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? '';
        // A look the passport knows as an outfit draws that outfit; any other look replaces the clothing.
        let outfit = found ? outfitForLook(found.passport, raw) : '';
        let look = outfit ? '' : await this.lookTags(raw);
        if (found && !outfit && look !== raw) {
            outfit = outfitForLook(found.passport, look);
            if (outfit) look = '';
        }
        const s = settings();
        const identity = found
            ? passportTags(
                  found.passport,
                  outfit ? { allowNsfw: false, outfit } : { allowNsfw: false, withoutClothing: Boolean(look) },
              )
            : '';
        const size = markerDimensions('portrait', undefined, s.anlas.freeOnly);
        return {
            scene: joinTags(identity, look, s.des.portraitTags),
            ...(found?.passport.negative ? { negative: found.passport.negative } : {}),
            generation: { width: size.width, height: size.height, seed: stableSeed(name), characters: [] },
            priority: this.manualPortraits.has(normalizeLine(name)) ? 'user' : 'portrait',
        };
    }

    // ---- interface in DES -----------------------------------------------------------------

    private lastReplyId(): number {
        const chat = ctx().chat;
        for (let i = chat.length - 1; i >= 0; i--) if (!chat[i]?.is_user && !chat[i]?.is_system) return i;
        return chat.length - 1;
    }

    private async openPassport(name: string): Promise<void> {
        let found = await this.findPassport(name);
        if (!found) {
            const look = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? '';
            found = look ? await this.createPassport({ name, look }) : null;
        }
        if (!found) {
            const cardIndex = this.targetCard();
            if (cardIndex === null) return;
            found = { cardIndex, passport: defaultPassport('character', name) };
        }
        const cardIndex = found.cardIndex;
        const cardName = cardIndex === null ? name : (ctx().characters[cardIndex]?.name ?? name);
        // A saved passport: where it lives, with "Card / This chat" (v0.10).
        const located = locatePassport(found.passport.id, cardIndex === null ? {} : { index: cardIndex });
        if (located && (cardIndex !== null || located.owner.type === 'chat')) {
            await editLocatedPassport(cardName, located, { identity: true });
            return;
        }
        if (cardIndex === null) return;
        const edited = await editPassport(cardName, found.passport, { identity: true });
        if (!edited) return;
        await saveCardPassport(cardIndex, edited);
        toastr.success(t('naist.passport.saved', { name: edited.name || cardName }));
    }

    private async ensureFound(name: string): Promise<Found | null> {
        const found = await this.findPassport(name);
        if (found) return found;
        const look = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? '';
        return await this.createPassport({ name, look });
    }

    private async menuAction(action: string, name: string, isUser: boolean): Promise<void> {
        if (!name) return;
        if (action === 'passport') {
            if (isUser) await editPersonaPassport();
            else await this.openPassport(name);
        } else if (action === 'emotions') {
            const found = await this.ensureFound(name);
            // Emotion sprites belong to a card: a passport of the chat itself has none.
            if (found && found.cardIndex !== null) openEmotions(found.cardIndex, found.passport.id);
            else toastr.warning(t('naist.des.noPassport', { name }));
        } else if (action === 'portrait' && this.api) {
            const found = (await this.findPassport(name, { provided: {} })) ?? (await this.ensureFound(name));
            const look = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? '';
            this.syncLine(name, found?.passport ?? null, look);
            toastr.info(t('naist.des.portraitStarted', { name }), t('naist.des.title'));
            this.manualPortraits.add(normalizeLine(name));
            try {
                const url = await this.api.regeneratePortrait(name);
                if (url) this.api.refreshPortraits();
            } finally {
                this.manualPortraits.delete(normalizeLine(name));
            }
        } else if (action === 'scene') {
            const params: MarkerParams = { prompt: name, chars: [{ name }], ratio: 'portrait' };
            await this.markers.illustrate(this.lastReplyId(), params);
        }
    }

    private installMenu(): void {
        const items: [action: string, icon: string, key: string][] = [
            ['passport', 'fa-id-card', 'naist.des.menuPassport'],
            ['emotions', 'fa-masks-theater', 'naist.des.menuEmotions'],
            ['portrait', 'fa-image-portrait', 'naist.des.menuPortrait'],
            ['scene', 'fa-image', 'naist.des.menuScene'],
        ];
        const add = () => {
            const menu = document.querySelector('#dooms-pb-context-menu');
            if (!menu || menu.querySelector('.naist-des-ctx')) return;
            const divider = document.createElement('div');
            divider.className = 'dooms-pb-ctx-divider naist-des-ctx';
            menu.append(divider);
            for (const [action, icon, key] of items) {
                const item = document.createElement('div');
                item.className = 'dooms-pb-ctx-item naist-des-ctx';
                item.dataset.naistDes = action;
                item.innerHTML = `<i class="fa-solid ${icon}"></i> `;
                item.append(document.createTextNode(t(key)));
                menu.append(item);
            }
        };
        add();
        new MutationObserver(() => {
            if (settings().des.menu && this.active()) add();
        }).observe(document.body, { childList: true });
        document.addEventListener(
            'click',
            (event) => {
                const item = (event.target as HTMLElement).closest<HTMLElement>('.naist-des-ctx[data-naist-des]');
                if (!item) return;
                event.preventDefault();
                event.stopPropagation();
                const $ = (window as unknown as { jQuery?: (s: string) => JQueryLike }).jQuery;
                const menu = $?.('#dooms-pb-context-menu');
                const name = String(menu?.data('character') ?? '');
                const isUser = menu?.data('isUser') === true;
                menu?.hide();
                void this.menuAction(item.dataset.naistDes ?? '', name, isUser).catch(reportGenerationError);
            },
            true,
        );
        document.addEventListener(
            'contextmenu',
            () => {
                const visible = settings().des.menu && this.active();
                document.querySelectorAll<HTMLElement>('.naist-des-ctx').forEach((el) => {
                    el.style.display = visible ? '' : 'none';
                });
            },
            true,
        );
    }

    private installBanners(): void {
        const chat = document.getElementById('chat');
        if (!chat) return;
        let pending = false;
        const decorate = () => {
            pending = false;
            if (!settings().des.banners || !this.active()) return;
            chat.querySelectorAll<HTMLElement>(':scope > .dooms-info-banner, :scope > .dooms-scene-transition').forEach(
                (el) => {
                    if (el.querySelector('.naist-des-illustrate')) return;
                    const button = document.createElement('div');
                    button.className = 'menu_button fa-solid fa-image naist-des-illustrate';
                    button.title = t('naist.des.illustrate');
                    el.append(button);
                },
            );
        };
        new MutationObserver(() => {
            if (pending) return;
            pending = true;
            setTimeout(decorate, 300);
        }).observe(chat, { childList: true });
        chat.addEventListener('click', (event) => {
            const button = (event.target as HTMLElement).closest<HTMLElement>('.naist-des-illustrate');
            if (!button) return;
            event.preventDefault();
            event.stopPropagation();
            const host = button.parentElement;
            if (!host) return;
            // A banner follows the last reply; a transition card stands before the reply that changed the scene.
            let mes: Element | null = host;
            const forward = host.classList.contains('dooms-scene-transition');
            do mes = forward ? mes.nextElementSibling : mes.previousElementSibling;
            while (mes && !mes.classList.contains('mes'));
            const messageId = Number(mes?.getAttribute('mesid'));
            if (!Number.isInteger(messageId)) return;
            const scene = this.trackerOf(messageId)?.scene ?? this.latestTracker()?.scene;
            const prompt =
                [scene?.location, scene?.time, scene?.weather].filter(Boolean).join(', ') ||
                (host.textContent ?? '').replace(/\s+/g, ' ').trim();
            if (!prompt) return;
            void this.markers.illustrate(messageId, { prompt, ratio: 'landscape' }).catch(reportGenerationError);
        });
        decorate();
    }

    private installWorkshop(): void {
        const add = () => {
            const header = document.querySelector('#character-workshop-popup header h3');
            if (!header || header.querySelector('#naist-des-workshop')) return;
            const button = document.createElement('span');
            button.id = 'naist-des-workshop';
            button.className = 'menu_button fa-solid fa-id-card naist-des-workshop';
            button.title = t('naist.des.workshopPassport');
            header.append(button);
            button.addEventListener('click', () => {
                const name = document.querySelector('#cw-char-title')?.textContent?.trim() ?? '';
                const isUser = !(document.querySelector('#cw-user-badge') as HTMLElement | null)?.hidden;
                void this.menuAction('passport', name, isUser).catch(reportGenerationError);
            });
        };
        add();
        new MutationObserver(() => {
            if (settings().des.menu && this.active()) add();
        }).observe(document.body, { childList: true });
    }

    /** Passports for every character of the latest tracker that has none (the panel button). */
    async passportsForTracker(): Promise<number> {
        const tracker = this.latestTracker();
        let created = 0;
        for (const character of tracker?.characters ?? []) {
            if (this.isUserName(character.name) || (await this.findPassport(character.name))) continue;
            this.failed.delete(character.name.toLowerCase());
            const found = await this.createPassport(character);
            if (found) {
                created++;
                this.syncLine(character.name, found.passport);
            }
        }
        return created;
    }
}

interface JQueryLike {
    data(key: string): unknown;
    hide(): void;
}

let instance: DesIntegration | null = null;

export function desIntegration(): DesIntegration | null {
    return instance;
}

/** Started after APP_READY: DES initialises asynchronously and late. */
export function setupDes(markers: MarkerService): DesIntegration {
    instance = new DesIntegration(markers);
    const c = ctx();
    const begin = () => void instance!.start().catch((error) => log.warn('DES integration failed to start', error));
    if (document.readyState === 'complete' && document.querySelector('#rpg-extension-enabled')) begin();
    else c.eventSource.on(c.eventTypes.APP_READY ?? 'app_ready', begin);
    return instance;
}
