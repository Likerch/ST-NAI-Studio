//#region src/core/context.ts
var MODULE_NAME = "nai_studio";
function ctx() {
	return SillyTavern.getContext();
}
function libs() {
	return SillyTavern.libs;
}
function requestHeaders(omitContentType = false) {
	return ctx().getRequestHeaders(omitContentType ? { omitContentType: true } : void 0);
}
//#endregion
//#region src/core/i18n.ts
var EN = {
	"naist.panel.title": "NAI Studio",
	"naist.panel.transport": "Transport",
	"naist.panel.refresh": "Re-detect transport and refresh balance",
	"naist.panel.model": "Model",
	"naist.panel.prompt": "Prompt",
	"naist.panel.promptPlaceholder": "English tags, e.g. 1girl, smile, cherry blossoms",
	"naist.panel.negative": "Undesired content",
	"naist.panel.ucPreset": "UC preset",
	"naist.panel.quality": "Quality tags",
	"naist.panel.characters": "Characters",
	"naist.panel.charactersLimit": "{count} / {max}",
	"naist.panel.addCharacter": "Add character",
	"naist.panel.useCoords": "Use positions (otherwise the AI places characters)",
	"naist.panel.size": "Size",
	"naist.panel.width": "Width",
	"naist.panel.height": "Height",
	"naist.panel.sampler": "Sampler",
	"naist.panel.schedule": "Noise schedule",
	"naist.panel.steps": "Steps",
	"naist.panel.scale": "Guidance",
	"naist.panel.cfgRescale": "CFG rescale",
	"naist.panel.seed": "Seed",
	"naist.panel.seedHint": "-1 = random for every generation",
	"naist.panel.samples": "Images",
	"naist.panel.smea": "SMEA",
	"naist.panel.smeaDyn": "SMEA DYN",
	"naist.panel.autoSmea": "Auto SMEA",
	"naist.panel.decrisper": "Decrisper",
	"naist.panel.variety": "Variety Boost",
	"naist.panel.transparent": "Transparent background",
	"naist.panel.legacyUc": "Legacy UC",
	"naist.panel.freeOnly": "Free generations only (never spend Anlas)",
	"naist.panel.override": "Raw override (JSON)",
	"naist.panel.overrideWarning": "Merged into the request after all checks. You are responsible for what it sends to NovelAI.",
	"naist.panel.overrideEnable": "Apply raw override",
	"naist.panel.inspectBeforeSend": "Open the inspector before every generation",
	"naist.panel.inspect": "Inspector",
	"naist.panel.generate": "Generate",
	"naist.panel.cancel": "Cancel",
	"naist.panel.generating": "Generating…",
	"naist.model.v5Full": "NAI Diffusion V5 Full",
	"naist.model.v5Curated": "NAI Diffusion V5 Curated",
	"naist.model.v45Full": "NAI Diffusion V4.5 Full",
	"naist.model.v45Curated": "NAI Diffusion V4.5 Curated",
	"naist.model.v4Full": "NAI Diffusion V4 Full",
	"naist.model.v4Curated": "NAI Diffusion V4 Curated",
	"naist.model.v3Anime": "NAI Diffusion Anime V3",
	"naist.model.v3Furry": "NAI Diffusion Furry V3",
	"naist.character.enabled": "On",
	"naist.character.remove": "Remove character",
	"naist.character.prompt": "Character tags",
	"naist.character.negative": "Character undesired content",
	"naist.character.x": "X",
	"naist.character.y": "Y",
	"naist.ucPreset.heavy": "Heavy",
	"naist.ucPreset.light": "Light",
	"naist.ucPreset.humanFocus": "Human focus",
	"naist.ucPreset.furryFocus": "Furry focus",
	"naist.ucPreset.none": "None",
	"naist.quality.standard": "On",
	"naist.quality.light": "On (light)",
	"naist.quality.none": "Off",
	"naist.sampler.k_euler_ancestral": "Euler Ancestral",
	"naist.sampler.k_euler": "Euler",
	"naist.sampler.k_dpmpp_2s_ancestral": "DPM++ 2S Ancestral",
	"naist.sampler.k_dpmpp_2m_sde": "DPM++ 2M SDE",
	"naist.sampler.k_dpmpp_2m": "DPM++ 2M",
	"naist.sampler.k_dpmpp_sde": "DPM++ SDE",
	"naist.sampler.ddim_v3": "DDIM",
	"naist.schedule.native": "Native",
	"naist.schedule.karras": "Karras",
	"naist.schedule.exponential": "Exponential",
	"naist.schedule.polyexponential": "Polyexponential",
	"naist.size.preset": "{category} {orientation} ({width}×{height})",
	"naist.size.normal": "Normal",
	"naist.size.large": "Large",
	"naist.size.wallpaper": "Wallpaper",
	"naist.size.small": "Small",
	"naist.size.portrait": "portrait",
	"naist.size.landscape": "landscape",
	"naist.size.square": "square",
	"naist.size.custom": "Custom",
	"naist.transport.auto": "Automatic",
	"naist.transport.plugin": "NAI Studio server plugin",
	"naist.transport.native": "SillyTavern built-in endpoint",
	"naist.transport.detecting": "Detecting transport…",
	"naist.transport.pluginActive": "Server plugin {version} · token: {token}",
	"naist.transport.pluginMissing": "Server plugin not found: install it into plugins/nai-studio and restart SillyTavern",
	"naist.transport.nativeActive": "SillyTavern built-in endpoint (basic generation only)",
	"naist.transport.nativeDegraded": "Plugin not found — using the SillyTavern built-in endpoint (basic generation only)",
	"naist.transport.featureNeedsPlugin": "Not available on the current transport: install the NAI Studio server plugin.",
	"naist.transport.lostSummary": "Will not reach NovelAI on this transport: {features}",
	"naist.token.st-secrets": "from SillyTavern secrets",
	"naist.token.config": "from plugin config",
	"naist.token.none": "not set",
	"naist.account.loading": "Balance: loading…",
	"naist.account.unavailable": "Balance unavailable: {reason}",
	"naist.account.summary": "Anlas: {anlas} · {tier}{usage}",
	"naist.account.usage": " · V5 limit: {percent}%",
	"naist.tier.0": "no subscription",
	"naist.tier.1": "Tablet",
	"naist.tier.2": "Scroll",
	"naist.tier.3": "Opus",
	"naist.cost.free": "Free (Opus)",
	"naist.cost.paid": "Costs {total} Anlas ({perImage} × {billable})",
	"naist.cost.why": "not free because: {reasons}",
	"naist.cost.blockedFreeOnly": "blocked by free-only mode",
	"naist.cost.confirm": "This request will spend {total} Anlas (balance: {balance}). Continue?",
	"naist.notFree.not-opus": "subscription is not Opus",
	"naist.notFree.inactive": "subscription inactive or balance unknown",
	"naist.notFree.too-many-pixels": "size above 1024×1024 pixels",
	"naist.notFree.too-many-steps": "more than 28 steps",
	"naist.notFree.character-reference": "character reference",
	"naist.notFree.v5-usage-exhausted": "V5 usage limit exhausted",
	"naist.clamp.steps": "free-only: steps {from} → {to}",
	"naist.clamp.size": "free-only: size {from} → {to}",
	"naist.clamp.samples": "free-only: images {from} → {to}",
	"naist.clamp.character-references-removed": "free-only: {count} character reference(s) removed",
	"naist.clamp.vibes-trimmed": "free-only: vibes {from} → {to}",
	"naist.lost.characters": "character prompts",
	"naist.lost.coordinates": "character positions",
	"naist.lost.samples": "more than one image",
	"naist.lost.source-image": "source image",
	"naist.lost.mask": "inpaint mask",
	"naist.lost.vibes": "vibes",
	"naist.lost.character-reference": "character reference",
	"naist.lost.cfg-rescale": "CFG rescale",
	"naist.lost.transparency": "transparent background",
	"naist.lost.legacy-uc": "legacy UC",
	"naist.lost.stream": "step preview",
	"naist.lost.mode": "img2img / inpaint mode",
	"naist.lost.override": "raw override",
	"naist.inspector.title": "Payload inspector",
	"naist.inspector.overrideApplied": "Raw override is applied: highlighted fields come from it.",
	"naist.inspector.lost": "Lost on this transport",
	"naist.inspector.copy": "Copy JSON",
	"naist.inspector.copied": "JSON copied",
	"naist.inspector.copyFailed": "Could not copy to the clipboard",
	"naist.inspector.body": "Request body",
	"naist.inspector.effectiveNative": "What SillyTavern will actually send to NovelAI",
	"naist.inspector.dropped": "Removed fields",
	"naist.inspector.nothingDropped": "Nothing was removed.",
	"naist.inspector.warnings": "Adjustments",
	"naist.inspector.noWarnings": "No adjustments.",
	"naist.inspector.send": "Send",
	"naist.inspector.cancel": "Cancel",
	"naist.inspector.close": "Close",
	"naist.drop.unsupported-by-model": "not supported by this model",
	"naist.drop.not-applicable-to-mode": "not used in this mode",
	"naist.drop.feature-flag-off": "not released by NovelAI for this model yet",
	"naist.drop.exceeds-model-limit": "over the model limit",
	"naist.drop.empty": "empty",
	"naist.drop.superseded": "replaced by character reference",
	"naist.warning.size-rounded": "Size rounded to multiples of 64: {from} → {to}",
	"naist.warning.steps-clamped": "Steps limited: {from} → {to}",
	"naist.warning.samples-clamped": "Images limited for this size: {from} → {to}",
	"naist.warning.sampler-replaced": "Sampler {from} is not available for this model, using {to}",
	"naist.warning.noise-schedule-forced": "Noise schedule {from} is not available, using {to}",
	"naist.warning.coords-disabled": "Positions need at least {minimum} character(s), got {characters}: positions disabled",
	"naist.warning.decrisper-disabled": "Decrisper is available only for V3 models",
	"naist.warning.legacy-uc-disabled": "Legacy UC is available only for V4",
	"naist.warning.inpaint-model-fallback": "Inpainting uses another model: {model}",
	"naist.error.unauthorized.title": "NovelAI rejected the token",
	"naist.error.unauthorized.text": "Check the NovelAI token in SillyTavern (API Connections → NovelAI) or in the plugin config.",
	"naist.error.token-missing.title": "NovelAI token is not set",
	"naist.error.token-missing.text": "Set the NovelAI key in SillyTavern (API Connections → NovelAI) or in plugins/nai-studio/config.json.",
	"naist.error.insufficient-anlas.title": "Not enough Anlas",
	"naist.error.insufficient-anlas.text": "The request costs {cost} Anlas, balance: {balance}. Turn on free-only mode or reduce size and steps.",
	"naist.error.forbidden.title": "Not allowed for your subscription",
	"naist.error.forbidden.text": "NovelAI refused {model} for this subscription: {server}",
	"naist.error.rate-limited.title": "Too many requests",
	"naist.error.rate-limited.text": "NovelAI asks to slow down. Wait a few seconds and retry.",
	"naist.error.build-error-v4.title": "Internal request build error",
	"naist.error.build-error-v4.text": "NovelAI answered 500 for {model}. Most often a V4/V5 prompt structure is missing: open the inspector and compare the request.",
	"naist.error.server-error.title": "NovelAI server error",
	"naist.error.server-error.text": "HTTP {status}: {server}. The API contract may have changed: compare the payload with the reference and report an issue.",
	"naist.error.unavailable.title": "NovelAI is unavailable",
	"naist.error.unavailable.text": "No answer or a gateway error (HTTP {status}). Your prompt is kept — retry later.",
	"naist.error.validation.title": "NovelAI rejected the request",
	"naist.error.validation.text": "{server}",
	"naist.error.native-opaque.title": "SillyTavern endpoint failed",
	"naist.error.native-opaque.text": "The built-in endpoint hides NovelAI's reason. See the SillyTavern server log, or install the NAI Studio plugin for exact errors.",
	"naist.error.plugin-unavailable.title": "Server plugin unavailable",
	"naist.error.plugin-unavailable.text": "Copy server/ to SillyTavern plugins/nai-studio, set enableServerPlugins: true and restart SillyTavern.",
	"naist.error.v5-usage-exhausted.title": "V5 free limit exhausted",
	"naist.error.v5-usage-exhausted.text": "Switch to V4.5 or spend {cost} Anlas.",
	"naist.error.invalid-response.title": "Unexpected response",
	"naist.error.invalid-response.text": "The answer is not an image. First bytes: {preview}",
	"naist.error.free-only-blocked.title": "Blocked by free-only mode",
	"naist.error.free-only-blocked.text": "This request would spend {cost} Anlas.",
	"naist.error.price-too-high.title": "Request too expensive",
	"naist.error.price-too-high.text": "{perImage} Anlas per image exceeds the NovelAI limit of 140. Reduce size or steps.",
	"naist.error.aborted.title": "Cancelled",
	"naist.error.aborted.text": "The generation was cancelled.",
	"naist.error.size-too-large.title": "Image too large",
	"naist.error.size-too-large.text": "{width}×{height} exceeds {max} pixels.",
	"naist.error.invalid-seed.title": "Invalid seed",
	"naist.error.invalid-seed.text": "Seed must be -1 or an integer from 0 to 4294967295.",
	"naist.error.missing-image.title": "No source image",
	"naist.error.missing-image.text": "This mode needs a source image.",
	"naist.error.missing-mask.title": "No mask",
	"naist.error.missing-mask.text": "Inpainting needs a mask.",
	"naist.error.unsupported-mode.title": "Mode not supported",
	"naist.error.unsupported-mode.text": "{model} does not support {mode}.",
	"naist.error.invalid-override.title": "Raw override is not valid JSON",
	"naist.error.invalid-override.text": "{reason}",
	"naist.error.unknown.title": "Unexpected error",
	"naist.error.unknown.text": "{server}",
	"naist.action.open-inspector": "Open inspector",
	"naist.action.open-token-help": "Where to set the token",
	"naist.action.enable-free-only": "Turn on free-only mode",
	"naist.action.retry": "Retry",
	"naist.action.switch-to-v45": "Switch to V4.5",
	"naist.action.install-plugin": "How to install the plugin",
	"naist.action.check-st-log": "What to check",
	"naist.help.open-token-help": "Open API Connections → NovelAI in SillyTavern and paste your persistent API token there. The token stays on the server and never reaches this extension.",
	"naist.help.install-plugin": "1) Copy the server folder of NAI Studio to <SillyTavern>/plugins/nai-studio. 2) Set enableServerPlugins: true in config.yaml. 3) Restart SillyTavern. See docs/DEPLOY.md.",
	"naist.help.check-st-log": "The built-in SillyTavern endpoint answers 500 for every NovelAI error. The real reason is printed in the SillyTavern server console as \"NovelAI returned an error\".",
	"naist.result.posted": "Done: {count} image(s) added to the chat.",
	"naist.result.chatChanged": "Chat changed during generation: {count} image(s) saved to the gallery but not posted.",
	"naist.result.cancelled": "Generation cancelled.",
	"naist.lifecycle.installed": "NAI Studio installed. Open Extensions → NAI Studio.",
	"naist.lifecycle.cleaned": "NAI Studio settings and stored data removed."
};
var translator = (text) => text;
/** Wires the host translator (SillyTavern's translate). Called once on activation. */
function setTranslator(fn) {
	translator = fn;
}
function interpolate(text, params) {
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (match, name) => name in params ? String(params[name]) : match);
}
/** Translates `key` (naist.<module>.<key>) with `{name}` placeholders. Falls back to English, then to the key. */
function t(key, params) {
	const english = EN[key] ?? key;
	return interpolate(translator(english, key), params);
}
/**
* Fills elements carrying `data-i18n` (same syntax as SillyTavern: `key`, `[attr]key`, `;`-separated).
* Text keys may also carry params via `data-i18n-params` (JSON).
*/
function localize(root) {
	root.querySelectorAll("[data-i18n]").forEach((element) => {
		const spec = element.getAttribute("data-i18n") ?? "";
		let params;
		const rawParams = element.getAttribute("data-i18n-params");
		if (rawParams) try {
			params = JSON.parse(rawParams);
		} catch {
			params = void 0;
		}
		for (const part of spec.split(";")) {
			const entry = part.trim();
			if (!entry) continue;
			const attr = entry.match(/^\[(\S+)\](.+)$/);
			if (attr?.[1] && attr[2]) element.setAttribute(attr[1], t(attr[2], params));
			else element.textContent = t(entry, params);
		}
	});
}
//#endregion
//#region src/core/logger.ts
var ORDER = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40
};
var PREFIX = "[NAI Studio]";
var threshold = "info";
function setLogLevel(level) {
	threshold = level;
}
function enabled(level) {
	return ORDER[level] >= ORDER[threshold];
}
/** Console logger with a fixed prefix. The NovelAI token never reaches the client, so it cannot leak here. */
var log = {
	debug: (...args) => {
		if (enabled("debug")) console.debug(PREFIX, ...args);
	},
	info: (...args) => {
		if (enabled("info")) console.info(PREFIX, ...args);
	},
	warn: (...args) => {
		if (enabled("warn")) console.warn(PREFIX, ...args);
	},
	error: (...args) => {
		if (enabled("error")) console.error(PREFIX, ...args);
	}
};
function defaultSettings() {
	return {
		schemaVersion: 1,
		transport: { mode: "auto" },
		generation: {
			model: "nai-diffusion-4-5-full",
			prompt: "",
			negativePrompt: "",
			ucPreset: "heavy",
			qualityPreset: "standard",
			dataset: "none",
			width: 832,
			height: 1216,
			steps: 23,
			scale: 5,
			cfgRescale: 0,
			sampler: "k_euler_ancestral",
			noiseSchedule: "karras",
			seed: -1,
			samples: 1,
			smea: false,
			smeaDyn: false,
			autoSmea: true,
			decrisper: false,
			varietyBoost: false,
			legacyUc: false,
			transparentBackground: false,
			imageFormat: "webp",
			useCoords: false,
			characters: []
		},
		anlas: {
			freeOnly: true,
			confirmAbove: 0
		},
		inspector: { openBeforeSend: false },
		rawOverride: {
			enabled: false,
			json: ""
		},
		output: { hiddenFromPrompt: true },
		log: { level: "info" }
	};
}
/**
* Ordered migrations. Each one is a separate function with its own test (TZ "Versioning").
* v1: first schema. Settings saved before versioning (no schemaVersion) start from here.
*/
var MIGRATIONS = [{
	to: 1,
	migrate(settings) {
		return {
			...settings,
			schemaVersion: 1
		};
	}
}];
function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Applies pending migrations, then fills missing keys from defaults (lodash.merge in the host). */
function migrateAndFill(stored, merge) {
	let raw = isObject(stored) ? structuredClone(stored) : {};
	const fromVersion = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
	if (fromVersion > 1) return {
		settings: merge(defaultSettings(), raw),
		fromVersion,
		migrated: false
	};
	for (const migration of MIGRATIONS) if (migration.to > fromVersion) raw = migration.migrate(raw);
	const settings = merge(defaultSettings(), raw);
	const storedChars = isObject(raw.generation) && Array.isArray(raw.generation.characters) ? raw.generation.characters : [];
	settings.generation.characters = storedChars;
	settings.schemaVersion = 1;
	return {
		settings,
		fromVersion,
		migrated: fromVersion !== 1
	};
}
//#endregion
//#region src/core/storage.ts
var instance = null;
function store() {
	instance ??= libs().localforage.createInstance({
		name: "NAIStudio",
		storeName: "data"
	});
	return instance;
}
var BACKUP_PREFIX = "settings-backup:";
/** Snapshot of settings taken before a migration, keyed by date. */
async function backupSettings(settings, fromVersion) {
	const key = `${BACKUP_PREFIX}v${fromVersion}:${(/* @__PURE__ */ new Date()).toISOString()}`;
	await store().setItem(key, structuredClone(settings));
	return key;
}
/** Removes everything NAI Studio stored in IndexedDB (lifecycle "clean"). */
async function clearStorage() {
	await store().clear();
}
//#endregion
//#region src/core/settings.ts
var current = defaultSettings();
/** Loads extensionSettings.nai_studio, backs it up before a migration, fills new defaults. */
async function loadSettings() {
	const root = ctx().extensionSettings;
	const stored = root[MODULE_NAME];
	const result = migrateAndFill(stored, libs().lodash.merge);
	if (result.migrated && stored && typeof stored === "object" && Object.keys(stored).length > 0) try {
		const key = await backupSettings(stored, result.fromVersion);
		log.info("settings backed up before migration", key);
	} catch (error) {
		log.warn("settings backup failed", error);
	}
	root[MODULE_NAME] = result.settings;
	current = result.settings;
	setLogLevel(current.log.level);
	if (result.migrated) ctx().saveSettingsDebounced();
	return current;
}
function settings() {
	return current;
}
function saveSettings() {
	ctx().saveSettingsDebounced();
}
/** Lifecycle "clean": drop our key from extensionSettings. */
function resetSettings() {
	const root = ctx().extensionSettings;
	delete root[MODULE_NAME];
	current = defaultSettings();
	ctx().saveSettingsDebounced();
}
//#endregion
//#region src/core/errors.ts
/** A user-facing error. `message` never contains the NovelAI token (it never reaches the client). */
var NaiError = class extends Error {
	code;
	action;
	params;
	status;
	constructor(code, action, params = {}, status) {
		super(code);
		this.name = "NaiError";
		this.code = code;
		this.action = action;
		this.params = params;
		this.status = status;
	}
	get title() {
		return t(`naist.error.${this.code}.title`, this.params);
	}
	get text() {
		return t(`naist.error.${this.code}.text`, this.params);
	}
};
var DOMAIN_CODES = [
	"size-too-large",
	"invalid-seed",
	"missing-image",
	"missing-mask",
	"unsupported-mode",
	"invalid-override"
];
function fromHttp(status, shape, context) {
	const server = shape.serverMessage ?? "";
	const params = {
		status,
		server,
		model: context.model ?? "",
		cost: context.cost ?? 0,
		balance: context.balance ?? 0
	};
	if (status === 401) return new NaiError("unauthorized", "open-token-help", params, status);
	if (status === 402 || /not enough anlas|training steps/i.test(server)) return new NaiError("insufficient-anlas", "enable-free-only", params, status);
	if (status === 403) return new NaiError("forbidden", "none", params, status);
	if (status === 429) return new NaiError("rate-limited", "retry", params, status);
	if (status === 400) return new NaiError("validation", "open-inspector", params, status);
	if (status === 500 && context.transport === "native") return new NaiError("native-opaque", "check-st-log", params, status);
	if (status === 500 && (context.family === "v4" || context.family === "v4_5" || context.family === "v5")) return new NaiError("build-error-v4", "open-inspector", params, status);
	if (status === 504 || status === 520 || status === 522 || status === 502 || status === 503) return new NaiError("unavailable", "retry", params, status);
	if (status >= 500) return new NaiError("server-error", "open-inspector", params, status);
	return new NaiError("unknown", "none", params, status);
}
/** Converts anything thrown during generation into a NaiError. */
function toNaiError(error, context = {}) {
	if (error instanceof NaiError) return error;
	const shape = typeof error === "object" && error !== null ? error : {};
	if (shape.name === "DomainError" && shape.code && DOMAIN_CODES.includes(shape.code)) return new NaiError(shape.code, shape.code === "invalid-override" ? "open-inspector" : "none", shape.params ?? {});
	if (shape.name === "TransportError") switch (shape.kind) {
		case "aborted": return new NaiError("aborted", "none");
		case "timeout":
		case "network": return new NaiError("unavailable", "retry", {
			status: 0,
			server: shape.message ?? ""
		});
		case "plugin-unavailable": return new NaiError("plugin-unavailable", "install-plugin");
		case "token-missing": return new NaiError("token-missing", "open-token-help");
		case "invalid-response": return new NaiError("invalid-response", "open-inspector", { preview: shape.bodyPreview ?? "" });
		case "http": return fromHttp(shape.status ?? 0, shape, context);
	}
	return new NaiError("unknown", "none", { server: shape.message ?? String(error) });
}
//#endregion
//#region src/transport/types.ts
/** Transport failure. `serverMessage` is NovelAI's own text; tokens never pass through the client. */
var TransportError = class extends Error {
	kind;
	status;
	serverMessage;
	bodyPreview;
	constructor(kind, options = {}) {
		super(options.message ?? `${kind}${options.status ? ` ${options.status}` : ""}`);
		this.name = "TransportError";
		this.kind = kind;
		this.status = options.status;
		this.serverMessage = options.serverMessage;
		this.bodyPreview = options.bodyPreview;
	}
};
function isAbort(error) {
	return error instanceof DOMException ? error.name === "AbortError" : error?.name === "AbortError";
}
//#endregion
//#region src/transport/st-native.ts
var NATIVE_FEATURES = {
	characters: false,
	multipleSamples: false,
	img2img: false,
	inpaint: false,
	vibes: false,
	characterReference: false,
	cfgRescale: false,
	transparency: false,
	stream: false,
	upscale: false,
	director: false,
	diagnostics: false
};
function toStNativeRequest(body) {
	const p = body.parameters;
	return {
		prompt: body.input,
		model: body.model,
		negative_prompt: p.negative_prompt,
		width: p.width,
		height: p.height,
		scale: p.scale,
		seed: p.seed,
		sampler: p.sampler,
		scheduler: typeof p.noise_schedule === "string" ? p.noise_schedule : "karras",
		steps: p.steps,
		sm: p.sm === true,
		sm_dyn: p.sm_dyn === true,
		decrisper: p.dynamic_thresholding === true,
		variety_boost: typeof p.skip_cfg_above_sigma === "number" && p.skip_cfg_above_sigma > 0,
		upscale_ratio: 1
	};
}
/** ST's own Variety Boost formula (src/endpoints/novelai.js:120-129). */
function stSkipCfg(width, height, model) {
	const magic = model.includes("nai-diffusion-4-5") ? 58 : 19;
	return Math.pow(width * height / 1011712, .5) * magic;
}
/** The exact body ST sends to image.novelai.net for a given request (verified against capture c08). */
function stEffectiveBody(req) {
	return {
		action: "generate",
		input: req.prompt,
		model: req.model,
		parameters: {
			params_version: 3,
			prefer_brownian: true,
			negative_prompt: req.negative_prompt,
			height: req.height,
			width: req.width,
			scale: req.scale,
			seed: req.seed,
			sampler: req.sampler,
			noise_schedule: req.scheduler,
			steps: req.steps,
			n_samples: 1,
			ucPreset: 0,
			qualityToggle: false,
			add_original_image: false,
			controlnet_strength: 1,
			deliberate_euler_ancestral_bug: false,
			dynamic_thresholding: req.decrisper,
			legacy: false,
			legacy_v3_extend: false,
			sm: req.sm,
			sm_dyn: req.sm_dyn,
			uncond_scale: 1,
			skip_cfg_above_sigma: req.variety_boost ? stSkipCfg(req.width, req.height, req.model) : null,
			use_coords: false,
			characterPrompts: [],
			reference_image_multiple: [],
			reference_information_extracted_multiple: [],
			reference_strength_multiple: [],
			v4_negative_prompt: { caption: {
				base_caption: req.negative_prompt,
				char_captions: []
			} },
			v4_prompt: {
				caption: {
					base_caption: req.prompt,
					char_captions: []
				},
				use_coords: false,
				use_order: true
			}
		}
	};
}
/** Requested features that ST's endpoint drops. */
function lostOnNative(body, overridePaths) {
	const p = body.parameters;
	const lost = [];
	if (body.action !== "generate") lost.push("mode");
	if (Array.isArray(p.characterPrompts) && p.characterPrompts.length > 0) lost.push("characters");
	if (p.use_coords === true) lost.push("coordinates");
	if (p.n_samples > 1) lost.push("samples");
	if (p.image) lost.push("source-image");
	if (p.mask) lost.push("mask");
	if (Array.isArray(p.reference_image_multiple) && p.reference_image_multiple.length > 0) lost.push("vibes");
	if (Array.isArray(p.director_reference_images) && p.director_reference_images.length > 0) lost.push("character-reference");
	if (typeof p.cfg_rescale === "number" && p.cfg_rescale !== 0) lost.push("cfg-rescale");
	if (p.tag_hint_transparent_background === true) lost.push("transparency");
	if (p.legacy_uc === true) lost.push("legacy-uc");
	if (p.stream) lost.push("stream");
	if (overridePaths.length > 0) lost.push("override");
	return lost;
}
var PNG_BASE64_MAGIC = "iVBORw0KGgo";
function createNativeTransport(env) {
	async function post(path, payload, signal) {
		try {
			return await env.fetch(path, {
				method: "POST",
				headers: env.headers(),
				body: JSON.stringify(payload),
				signal
			});
		} catch (error) {
			if (isAbort(error)) throw new TransportError("aborted");
			throw new TransportError("network", { message: error instanceof Error ? error.message : String(error) });
		}
	}
	return {
		id: "native",
		features: NATIVE_FEATURES,
		async generate(body, options) {
			const response = await post("/api/novelai/generate-image", toStNativeRequest(body), options.signal);
			const text = await response.text();
			if (response.status === 400) throw new TransportError("token-missing", { status: 400 });
			if (!response.ok) throw new TransportError("http", {
				status: response.status,
				bodyPreview: text.slice(0, 200)
			});
			if (!text.startsWith(PNG_BASE64_MAGIC)) throw new TransportError("invalid-response", { bodyPreview: text.slice(0, 200) });
			return { images: [{
				base64: text,
				mime: "image/png",
				seed: body.parameters.seed,
				index: 0
			}] };
		},
		async subscription(signal) {
			const response = await post("/api/novelai/status", {}, signal);
			if (response.status === 400) throw new TransportError("token-missing", { status: 400 });
			const text = await response.text();
			let data;
			try {
				data = JSON.parse(text);
			} catch {
				throw new TransportError("invalid-response", {
					status: response.status,
					bodyPreview: text.slice(0, 200)
				});
			}
			if (!response.ok || data?.error) throw new TransportError("invalid-response", {
				status: response.status,
				bodyPreview: text.slice(0, 200)
			});
			return data;
		},
		effectiveRequest(body, overridePaths) {
			return {
				body: stEffectiveBody(toStNativeRequest(body)),
				lost: lostOnNative(body, overridePaths)
			};
		}
	};
}
var PLUGIN_BASE = `/api/plugins/nai-studio`;
var PLUGIN_FEATURES = {
	characters: true,
	multipleSamples: true,
	img2img: true,
	inpaint: true,
	vibes: true,
	characterReference: true,
	cfgRescale: true,
	transparency: true,
	stream: false,
	upscale: false,
	director: false,
	diagnostics: true
};
/** Returns plugin health or null when the plugin is not installed / ST was not restarted. */
async function probePlugin(env, signal) {
	try {
		const response = await env.fetch(`${PLUGIN_BASE}/health`, {
			method: "GET",
			headers: env.headers(),
			signal
		});
		if (!response.ok) return null;
		const body = await response.json();
		if (body?.ok !== true || typeof body.version !== "string") return null;
		return {
			ok: true,
			version: body.version,
			tokenSource: body.tokenSource ?? "none"
		};
	} catch {
		return null;
	}
}
async function toTransportError(response) {
	if (response.status === 404) return new TransportError("plugin-unavailable", { status: 404 });
	let body;
	const text = await response.text();
	try {
		body = JSON.parse(text);
	} catch {
		return new TransportError("invalid-response", {
			status: response.status,
			bodyPreview: text.slice(0, 200)
		});
	}
	const kind = body.error?.kind;
	return new TransportError([
		"http",
		"network",
		"timeout",
		"aborted",
		"invalid-response",
		"token-missing"
	].find((k) => k === kind) ?? "http", {
		status: body.error?.status ?? response.status,
		serverMessage: body.error?.message,
		bodyPreview: body.error?.preview
	});
}
function createPluginTransport(env) {
	async function post(path, payload, signal) {
		try {
			return await env.fetch(`${PLUGIN_BASE}${path}`, {
				method: "POST",
				headers: env.headers(),
				body: JSON.stringify(payload),
				signal
			});
		} catch (error) {
			if (isAbort(error)) throw new TransportError("aborted");
			throw new TransportError("network", { message: error instanceof Error ? error.message : String(error) });
		}
	}
	return {
		id: "plugin",
		features: PLUGIN_FEATURES,
		async generate(body, options) {
			const response = await post("/generate", {
				request: body,
				endpoint: options.endpoint,
				retryable: options.retryable
			}, options.signal);
			if (!response.ok) throw await toTransportError(response);
			const data = await response.json();
			if (!Array.isArray(data.images) || data.images.length === 0) throw new TransportError("invalid-response", { bodyPreview: JSON.stringify(data).slice(0, 200) });
			return {
				images: data.images.map((img, i) => ({
					base64: img.image,
					mime: img.mime === "image/webp" ? "image/webp" : "image/png",
					seed: img.seed,
					index: img.index ?? i
				})),
				correlationId: data.correlationId
			};
		},
		async subscription(signal) {
			let response;
			try {
				response = await env.fetch(`${PLUGIN_BASE}/subscription`, {
					method: "GET",
					headers: env.headers(),
					signal
				});
			} catch (error) {
				if (isAbort(error)) throw new TransportError("aborted");
				throw new TransportError("network", { message: error instanceof Error ? error.message : String(error) });
			}
			if (!response.ok) throw await toTransportError(response);
			return await response.json();
		},
		effectiveRequest(body) {
			return {
				body,
				lost: []
			};
		}
	};
}
//#endregion
//#region src/transport/index.ts
async function selectTransport(preference, env, signal) {
	const health = await probePlugin(env, signal);
	if (preference === "native") return {
		transport: createNativeTransport(env),
		health,
		degraded: false
	};
	if (health) return {
		transport: createPluginTransport(env),
		health,
		degraded: false
	};
	if (preference === "plugin") return {
		transport: createPluginTransport(env),
		health: null,
		degraded: false
	};
	return {
		transport: createNativeTransport(env),
		health: null,
		degraded: true
	};
}
//#endregion
//#region src/features/generation/account.ts
/** Subscription -> what the cost guard needs (RECON §3.11). */
function accountFromSubscription(sub) {
	const steps = sub.trainingStepsLeft;
	const usage = sub.usage;
	return {
		tier: Number(sub.tier) || 0,
		active: sub.active === true,
		usageNegative: usage?.isNegative === true,
		anlas: (steps?.fixedTrainingStepsLeft ?? 0) + (steps?.purchasedTrainingSteps ?? 0),
		usagePercent: usage ? usage.isNegative ? 0 : Math.min(100, Math.max(0, usage.percent)) : null
	};
}
/** Used before the balance is known: treat as a non-Opus account so nothing is assumed free. */
var UNKNOWN_ACCOUNT = {
	tier: 0,
	active: false,
	usageNegative: false,
	anlas: 0,
	usagePercent: null
};
//#endregion
//#region src/features/generation/output.ts
function safeName(text) {
	return text.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "nai";
}
async function saveImages(images, folder) {
	const c = ctx();
	const saved = [];
	for (const image of images) {
		const format = image.mime === "image/webp" ? "webp" : "png";
		const filename = `${safeName(folder)}_${c.humanizedDateTime()}_${image.seed ?? image.index}`;
		const response = await fetch("/api/images/upload", {
			method: "POST",
			headers: requestHeaders(),
			body: JSON.stringify({
				image: image.base64,
				format,
				ch_name: folder,
				filename
			})
		});
		if (!response.ok) throw new Error(`image upload failed: HTTP ${response.status}`);
		const { path } = await response.json();
		saved.push({
			path,
			seed: image.seed
		});
	}
	return saved;
}
/** Folder in /user/images: character name in 1:1 chats, group id in groups (as the built-in does). */
function imageFolder() {
	const c = ctx();
	return c.groupId ? String(c.groupId) : c.name2 || "";
}
async function postToChat(saved, meta, hiddenFromPrompt) {
	const c = ctx();
	const message = {
		name: c.name2,
		is_user: false,
		is_system: hiddenFromPrompt,
		send_date: (/* @__PURE__ */ new Date()).toISOString(),
		mes: meta.prompt,
		extra: {
			media: saved.map((s) => ({
				url: s.path,
				type: "image",
				title: meta.prompt,
				source: "generated"
			})),
			media_display: "gallery",
			media_index: 0,
			inline_image: false,
			nai_studio: {
				model: meta.model,
				seed: meta.seed,
				seeds: saved.map((s) => s.seed),
				transport: meta.transport,
				cost: meta.cost,
				correlationId: meta.correlationId
			}
		}
	};
	c.chat.push(message);
	const id = c.chat.length - 1;
	await c.eventSource.emit(c.eventTypes.MESSAGE_RECEIVED ?? "message_received", id, "extension");
	c.addOneMessage(message);
	await c.eventSource.emit(c.eventTypes.CHARACTER_MESSAGE_RENDERED ?? "character_message_rendered", id, "extension");
	await c.saveChat();
	return id;
}
//#endregion
//#region src/domain/models.ts
var MODEL_IDS = [
	"nai-diffusion-5-full",
	"nai-diffusion-5-curated",
	"nai-diffusion-4-5-full",
	"nai-diffusion-4-5-curated",
	"nai-diffusion-4-full",
	"nai-diffusion-4-curated-preview",
	"nai-diffusion-3",
	"nai-diffusion-furry-3"
];
var MODELS = [
	{
		id: "nai-diffusion-5-full",
		family: "v5",
		nameKey: "naist.model.v5Full",
		curated: false,
		inpaintModel: "nai-diffusion-5-full-inpainting",
		inpaintFamily: "v5",
		inpaintBase: "nai-diffusion-5-full",
		legacy: false
	},
	{
		id: "nai-diffusion-5-curated",
		family: "v5",
		nameKey: "naist.model.v5Curated",
		curated: true,
		inpaintModel: "nai-diffusion-4-5-curated-inpainting",
		inpaintFamily: "v4_5",
		inpaintBase: "nai-diffusion-4-5-curated",
		legacy: false
	},
	{
		id: "nai-diffusion-4-5-full",
		family: "v4_5",
		nameKey: "naist.model.v45Full",
		curated: false,
		inpaintModel: "nai-diffusion-4-5-full-inpainting",
		inpaintFamily: "v4_5",
		inpaintBase: "nai-diffusion-4-5-full",
		legacy: true
	},
	{
		id: "nai-diffusion-4-5-curated",
		family: "v4_5",
		nameKey: "naist.model.v45Curated",
		curated: true,
		inpaintModel: "nai-diffusion-4-5-curated-inpainting",
		inpaintFamily: "v4_5",
		inpaintBase: "nai-diffusion-4-5-curated",
		legacy: true
	},
	{
		id: "nai-diffusion-4-full",
		family: "v4",
		nameKey: "naist.model.v4Full",
		curated: false,
		inpaintModel: "nai-diffusion-4-full-inpainting",
		inpaintFamily: "v4",
		inpaintBase: "nai-diffusion-4-full",
		legacy: true
	},
	{
		id: "nai-diffusion-4-curated-preview",
		family: "v4",
		nameKey: "naist.model.v4Curated",
		curated: true,
		inpaintModel: "nai-diffusion-4-curated-inpainting",
		inpaintFamily: "v4",
		inpaintBase: "nai-diffusion-4-curated-preview",
		legacy: true
	},
	{
		id: "nai-diffusion-3",
		family: "v3",
		nameKey: "naist.model.v3Anime",
		curated: false,
		inpaintModel: "nai-diffusion-3-inpainting",
		inpaintFamily: "v3",
		inpaintBase: "nai-diffusion-3",
		legacy: true
	},
	{
		id: "nai-diffusion-furry-3",
		family: "v3",
		nameKey: "naist.model.v3Furry",
		curated: false,
		inpaintModel: "nai-diffusion-furry-3-inpainting",
		inpaintFamily: "v3",
		inpaintBase: "nai-diffusion-furry-3",
		legacy: true
	}
];
var DEFAULT_MODEL = "nai-diffusion-4-5-full";
function isModelId(value) {
	return typeof value === "string" && MODEL_IDS.includes(value);
}
function getModel(id) {
	const model = MODELS.find((m) => m.id === id);
	if (!model) throw new Error(`Unknown model id: ${id}`);
	return model;
}
//#endregion
//#region src/domain/types.ts
var SAMPLERS = [
	"k_euler_ancestral",
	"k_euler",
	"k_dpmpp_2s_ancestral",
	"k_dpmpp_2m_sde",
	"k_dpmpp_2m",
	"k_dpmpp_sde",
	"ddim_v3"
];
var NOISE_SCHEDULES = [
	"native",
	"karras",
	"exponential",
	"polyexponential"
];
var UC_PRESETS = [
	"heavy",
	"light",
	"humanFocus",
	"furryFocus",
	"none"
];
var QUALITY_PRESETS = [
	"standard",
	"light",
	"none"
];
//#endregion
//#region src/domain/capabilities.ts
/**
* Features NovelAI announced for V5 but has not released yet. Flip to true once the API
* accepts them: the payload code for both already exists (vibes, director references).
*/
var FEATURE_FLAGS = {
	v5VibeTransfer: false,
	v5CharacterReference: false
};
var MODERN_SAMPLERS = [
	"k_euler_ancestral",
	"k_euler",
	"k_dpmpp_2s_ancestral",
	"k_dpmpp_2m_sde",
	"k_dpmpp_2m",
	"k_dpmpp_sde"
];
var V3_SAMPLERS = [...MODERN_SAMPLERS, "ddim_v3"];
var COMMON = {
	img2img: true,
	inpaint: true,
	cfgRescale: true,
	scaleMax: 10,
	maxSteps: 50,
	maxPixels: 3145728,
	freePixels: 1048576,
	sizePresets: [
		{
			category: "normal",
			orientation: "portrait",
			width: 832,
			height: 1216
		},
		{
			category: "normal",
			orientation: "landscape",
			width: 1216,
			height: 832
		},
		{
			category: "normal",
			orientation: "square",
			width: 1024,
			height: 1024
		},
		{
			category: "large",
			orientation: "portrait",
			width: 1024,
			height: 1536
		},
		{
			category: "large",
			orientation: "landscape",
			width: 1536,
			height: 1024
		},
		{
			category: "large",
			orientation: "square",
			width: 1472,
			height: 1472
		},
		{
			category: "wallpaper",
			orientation: "portrait",
			width: 1088,
			height: 1920
		},
		{
			category: "wallpaper",
			orientation: "landscape",
			width: 1920,
			height: 1088
		},
		{
			category: "small",
			orientation: "portrait",
			width: 512,
			height: 768
		},
		{
			category: "small",
			orientation: "landscape",
			width: 768,
			height: 512
		},
		{
			category: "small",
			orientation: "square",
			width: 640,
			height: 640
		}
	]
};
var FAMILY = {
	v5: {
		...COMMON,
		family: "v5",
		maxCharacters: 32,
		positioning: "freeform",
		canPositionSingleCharacter: true,
		v4Prompt: true,
		promptTokenLimit: 1471,
		tokenizer: "qwen",
		vibeTransfer: FEATURE_FLAGS.v5VibeTransfer,
		vibeKind: FEATURE_FLAGS.v5VibeTransfer ? "encoded" : "none",
		characterReference: FEATURE_FLAGS.v5CharacterReference,
		characterReferenceInpaint: false,
		transparency: true,
		smea: false,
		smeaDyn: false,
		autoSmeaThreshold: null,
		decrisper: false,
		varietyBoost: false,
		varietySigma: 58,
		noiseSchedules: [],
		forcedNoiseSchedule: "karras",
		samplers: MODERN_SAMPLERS,
		qualityPresets: [
			"standard",
			"light",
			"none"
		],
		legacyUc: false,
		furryMode: true,
		textInImage: true,
		usageLimit: true,
		priceMultiplier: 1.5,
		scaleDefault: 7
	},
	v4_5: {
		...COMMON,
		family: "v4_5",
		maxCharacters: 6,
		positioning: "grid",
		canPositionSingleCharacter: false,
		v4Prompt: true,
		promptTokenLimit: 512,
		tokenizer: "t5",
		vibeTransfer: true,
		vibeKind: "encoded",
		characterReference: true,
		characterReferenceInpaint: true,
		transparency: false,
		smea: false,
		smeaDyn: false,
		autoSmeaThreshold: null,
		decrisper: false,
		varietyBoost: true,
		varietySigma: 58,
		noiseSchedules: [
			"karras",
			"exponential",
			"polyexponential"
		],
		forcedNoiseSchedule: null,
		samplers: MODERN_SAMPLERS,
		qualityPresets: ["standard", "none"],
		legacyUc: false,
		furryMode: true,
		textInImage: true,
		usageLimit: false,
		priceMultiplier: 1,
		scaleDefault: 5
	},
	v4: {
		...COMMON,
		family: "v4",
		maxCharacters: 6,
		positioning: "grid",
		canPositionSingleCharacter: false,
		v4Prompt: true,
		promptTokenLimit: 512,
		tokenizer: "t5",
		vibeTransfer: true,
		vibeKind: "encoded",
		characterReference: false,
		characterReferenceInpaint: false,
		transparency: false,
		smea: false,
		smeaDyn: false,
		autoSmeaThreshold: null,
		decrisper: false,
		varietyBoost: true,
		varietySigma: 19,
		noiseSchedules: [
			"karras",
			"exponential",
			"polyexponential"
		],
		forcedNoiseSchedule: null,
		samplers: MODERN_SAMPLERS,
		qualityPresets: ["standard", "none"],
		legacyUc: true,
		furryMode: true,
		textInImage: true,
		usageLimit: false,
		priceMultiplier: 1,
		scaleDefault: 5.5
	},
	v3: {
		...COMMON,
		family: "v3",
		maxCharacters: 0,
		positioning: "none",
		canPositionSingleCharacter: false,
		v4Prompt: false,
		promptTokenLimit: 225,
		tokenizer: "clip",
		vibeTransfer: true,
		vibeKind: "raw",
		characterReference: false,
		characterReferenceInpaint: false,
		transparency: false,
		smea: true,
		smeaDyn: true,
		autoSmeaThreshold: 2166785,
		decrisper: true,
		varietyBoost: true,
		varietySigma: 19,
		noiseSchedules: [
			"native",
			"karras",
			"exponential",
			"polyexponential"
		],
		forcedNoiseSchedule: null,
		samplers: V3_SAMPLERS,
		qualityPresets: ["standard", "none"],
		legacyUc: false,
		furryMode: false,
		textInImage: false,
		usageLimit: false,
		priceMultiplier: 1,
		scaleDefault: 5
	}
};
var UC_PRESETS_BY_MODEL = {
	"nai-diffusion-5-full": [
		"heavy",
		"light",
		"furryFocus",
		"humanFocus",
		"none"
	],
	"nai-diffusion-5-curated": [
		"heavy",
		"light",
		"furryFocus",
		"humanFocus",
		"none"
	],
	"nai-diffusion-4-5-full": [
		"heavy",
		"light",
		"furryFocus",
		"humanFocus",
		"none"
	],
	"nai-diffusion-4-5-curated": [
		"heavy",
		"light",
		"humanFocus",
		"none"
	],
	"nai-diffusion-4-full": [
		"heavy",
		"light",
		"none"
	],
	"nai-diffusion-4-curated-preview": [
		"heavy",
		"light",
		"none"
	],
	"nai-diffusion-3": [
		"heavy",
		"light",
		"humanFocus",
		"none"
	],
	"nai-diffusion-furry-3": [
		"heavy",
		"light",
		"none"
	]
};
var SCALE_DEFAULT_OVERRIDE = { "nai-diffusion-furry-3": 6.2 };
var PROMPT_LIMIT_OVERRIDE = { "nai-diffusion-5-curated": 703 };
function getCapabilities(id) {
	const model = getModel(id);
	const { scaleDefault, ...family } = FAMILY[model.family];
	return {
		...family,
		model: id,
		curated: model.curated,
		inpaintModel: model.inpaintModel,
		inpaintFamily: model.inpaintFamily,
		inpaintBase: model.inpaintBase,
		ucPresets: UC_PRESETS_BY_MODEL[id],
		promptTokenLimit: PROMPT_LIMIT_OVERRIDE[id] ?? family.promptTokenLimit,
		defaults: {
			width: 832,
			height: 1216,
			steps: 23,
			scale: SCALE_DEFAULT_OVERRIDE[id] ?? scaleDefault
		}
	};
}
/** Capabilities of the model that actually serves an inpaint request (V5 Curated -> V4.5 Curated). */
function getInpaintCapabilities(id) {
	return getCapabilities(getModel(id).inpaintBase);
}
/** Samplers that take no noise schedule (the client deletes `noise_schedule` for them). */
var SAMPLERS_WITHOUT_SCHEDULE = [
	"ddim",
	"ddim_v3",
	"plms",
	"k_lms",
	"k_dpm_fast",
	"nai_smea",
	"nai_smea_dyn"
];
//#endregion
//#region src/domain/presets.ts
var V5_V45F_HEAVY = "lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page";
var FURRY_FOCUS_V45_V5 = "{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic";
var HUMAN_FOCUS_SUFFIX_V45_V5 = ", @_@, mismatched pupils, glowing eyes, bad anatomy";
var V3_HEAVY = "lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]";
var UC_TEXTS = {
	"nai-diffusion-5-full": {
		heavy: V5_V45F_HEAVY,
		light: "lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::",
		furryFocus: FURRY_FOCUS_V45_V5,
		humanFocus: V5_V45F_HEAVY + HUMAN_FOCUS_SUFFIX_V45_V5,
		none: ""
	},
	"nai-diffusion-5-curated": {
		heavy: V5_V45F_HEAVY,
		light: "lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::",
		furryFocus: FURRY_FOCUS_V45_V5,
		humanFocus: V5_V45F_HEAVY + HUMAN_FOCUS_SUFFIX_V45_V5,
		none: ""
	},
	"nai-diffusion-4-5-full": {
		heavy: V5_V45F_HEAVY,
		light: "lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page",
		furryFocus: FURRY_FOCUS_V45_V5,
		humanFocus: V5_V45F_HEAVY + HUMAN_FOCUS_SUFFIX_V45_V5,
		none: ""
	},
	"nai-diffusion-4-5-curated": {
		heavy: "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page",
		light: "blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page",
		humanFocus: "blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page",
		none: ""
	},
	"nai-diffusion-4-full": {
		heavy: "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, white blank page, blank page",
		light: "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, white blank page, blank page",
		none: ""
	},
	"nai-diffusion-4-curated-preview": {
		heavy: "blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, multiple views, gigantic breasts, white blank page, blank page",
		light: "blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, logo, dated, signature, white blank page, blank page",
		none: ""
	},
	"nai-diffusion-3": {
		heavy: V3_HEAVY,
		light: "lowres, jpeg artifacts, worst quality, watermark, blurry, very displeasing",
		humanFocus: V3_HEAVY + ", bad anatomy, bad hands, @_@, mismatched pupils, heart-shaped pupils, glowing eyes",
		none: "lowres"
	},
	"nai-diffusion-furry-3": {
		heavy: "{{worst quality}}, [displeasing], {unusual pupils}, guide lines, {{unfinished}}, {bad}, url, artist name, {{tall image}}, mosaic, {sketch page}, comic panel, impact (font), [dated], {logo}, ych, {what}, {where is your god now}, {distorted text}, repeated text, {floating head}, {1994}, {widescreen}, absolutely everyone, sequence, {compression artifacts}, hard translated, {cropped}, {commissioner name}, unknown text, high contrast",
		light: "{worst quality}, guide lines, unfinished, bad, url, tall image, widescreen, compression artifacts, unknown text",
		none: "lowres"
	}
};
var QUALITY_TEXTS = {
	"nai-diffusion-5-full": {
		standard: "very aesthetic, masterpiece, no text",
		light: "very aesthetic, amazing quality, no text"
	},
	"nai-diffusion-5-curated": {
		standard: "very aesthetic, masterpiece, no text",
		light: "very aesthetic, amazing quality, no text"
	},
	"nai-diffusion-4-5-full": { standard: "very aesthetic, masterpiece, no text" },
	"nai-diffusion-4-5-curated": { standard: "very aesthetic, masterpiece, no text, -0.8::feet::, rating:general" },
	"nai-diffusion-4-full": { standard: "no text, best quality, very aesthetic, absurdres" },
	"nai-diffusion-4-curated-preview": { standard: "rating:general, best quality, very aesthetic, absurdres" },
	"nai-diffusion-3": { standard: "best quality, amazing quality, very aesthetic, absurdres" },
	"nai-diffusion-furry-3": { standard: "{best quality}, {amazing quality}" }
};
/** Numeric ids sent as tag_hint_qt / tag_hint_uc_preset (bundle:_app@332363). */
var TAG_HINT_IDS = {
	none: 0,
	standard: 1,
	heavy: 2,
	light: 3,
	humanFocus: 4,
	furryFocus: 5
};
function getUcPresetText(model, preset) {
	return UC_TEXTS[model][preset] ?? "";
}
function getQualityText(model, preset) {
	if (preset === "none") return "";
	return QUALITY_TEXTS[model][preset] ?? QUALITY_TEXTS[model].standard ?? "";
}
//#endregion
//#region src/domain/prompt.ts
var JOINER = ", ";
var SEGMENT_SEPARATOR = "|";
/** Start of an in-image text block (bundle:_app module 46278, regex `c`). */
var TEXT_BLOCK = /(?:^|\s|[,.:[\]{}、。])text:(?!:)/i;
var TRANSPARENT_SUFFIX = "transparent background";
function joinSuffix(text, suffix) {
	if (!suffix) return text;
	return text ? `${text}${JOINER}${suffix}` : suffix;
}
/** Appends quality tags to the first `|` segment; on text-capable models, before any `text:` block. */
function applyQualityTags(prompt, caps, preset, transparentBackground) {
	let suffix = getQualityText(caps.model, preset);
	if (transparentBackground && caps.transparency) suffix = suffix ? `${TRANSPARENT_SUFFIX}${JOINER}${suffix}` : TRANSPARENT_SUFFIX;
	if (!suffix) return prompt;
	if (!caps.v4Prompt) return joinSuffix(prompt, suffix);
	const [first = "", ...rest] = prompt.split(SEGMENT_SEPARATOR);
	let head;
	if (caps.textInImage) {
		const match = first.match(TEXT_BLOCK);
		const parts = first.split(TEXT_BLOCK);
		head = match ? [joinSuffix(parts[0] ?? "", suffix), ...parts.slice(1)].join(match[0]) : joinSuffix(first, suffix);
	} else head = joinSuffix(first, suffix);
	return [head, ...rest].join(SEGMENT_SEPARATOR);
}
/** Prepends the UC preset; non-curated models also get `nsfw, ` unless the prompt mentions nsfw. */
function applyUcPreset(negative, caps, preset, prompt) {
	const presetText = getUcPresetText(caps.model, preset);
	const addNsfw = !caps.curated && preset !== "none" && presetText !== "" && !prompt.toLowerCase().includes("nsfw");
	if (caps.v4Prompt) {
		const joined = negative.split(SEGMENT_SEPARATOR).map((segment, index) => {
			if (index !== 0 || presetText === "") return segment;
			return segment === "" ? presetText : `${presetText}${JOINER}${segment}`;
		}).join(SEGMENT_SEPARATOR);
		return addNsfw ? `nsfw${JOINER}${joined}` : joined;
	}
	const presetPart = preset === "none" ? "" : presetText;
	let result = negative ? presetPart ? `${presetPart}${JOINER}${negative}` : negative : presetText;
	if (addNsfw) result = result === "" ? "nsfw" : `nsfw${JOINER}${result}`;
	return result;
}
var DATASET_TEXT = {
	fur: "fur dataset",
	background: "background dataset"
};
/** Furry/background dataset mode of V4+ models is a prompt prefix, not an API field. */
function applyDatasetPrefix(prompt, caps, dataset) {
	if (dataset === "none" || !caps.furryMode) return prompt;
	const lower = prompt.trimStart().toLowerCase();
	if (lower.startsWith("fur dataset") || lower.startsWith("background dataset")) return prompt;
	return `${DATASET_TEXT[dataset]}${JOINER}${prompt}`;
}
/** The web client rewrites the first `1girl` / `1boy` of every character prompt (bundle:5285@524931). */
function normalizeCharacterPrompt(prompt) {
	return prompt.replace(/1girl/, "girl").replace(/1boy/, "boy");
}
//#endregion
//#region src/domain/scene.ts
/** 5x5 grid of V4/V4.5 (bundle:_app@3545303). */
var GRID_STEPS = [
	.1,
	.3,
	.5,
	.7,
	.9
];
function snapAxis(value) {
	return GRID_STEPS[Math.min(4, Math.max(0, Math.floor(5 * value)))] ?? .5;
}
function round3(value) {
	return Math.round(value * 1e3) / 1e3;
}
function clamp01(value) {
	return Math.min(1, Math.max(0, value));
}
/** Grid models snap to the 5x5 grid; V5 keeps free coordinates rounded to 3 decimals. */
function placeOnCanvas(point, caps) {
	const x = clamp01(point.x);
	const y = clamp01(point.y);
	if (caps.positioning === "grid") return {
		x: snapAxis(x),
		y: snapAxis(y)
	};
	return {
		x: round3(x),
		y: round3(y)
	};
}
/** Default slot order for new characters along y = 0.5 (bundle:5285@546734). */
var DEFAULT_SLOTS_X = [
	.5,
	.3,
	.7,
	.1,
	.9
];
function defaultCenter(index) {
	const x = DEFAULT_SLOTS_X[index];
	if (x !== void 0) return {
		x,
		y: .5
	};
	const cells = [];
	for (const y of GRID_STEPS) for (const cx of GRID_STEPS) if (y !== .5) cells.push({
		x: cx,
		y
	});
	cells.sort((a, b) => Math.hypot(a.x - .5, a.y - .5) - Math.hypot(b.x - .5, b.y - .5));
	return cells[(index - DEFAULT_SLOTS_X.length) % cells.length] ?? {
		x: .5,
		y: .5
	};
}
function roundToStep(value) {
	return Math.max(64, Math.round(value / 64) * 64);
}
/** n_samples cap by pixel count (bundle:1601@55499). */
function maxSamplesForArea(width, height) {
	const pixels = width * height;
	if (pixels <= 360448) return 8;
	if (pixels <= 409600) return 6;
	return 4;
}
var FREE_MAX_PIXELS = 1048576;
var FREE_VIBES = 4;
var EXTRA_VIBE_PRICE = 2;
/** Model whose capabilities drive the price: inpaint uses the mapped inpaint model. */
function pricingCaps(req) {
	return req.mode === "inpaint" ? getInpaintCapabilities(req.model) : getCapabilities(req.model);
}
function basePricePerImage(width, height, steps, sm, smDyn, priceMultiplier, strengthFactor) {
	const pixels = width * height;
	const smeaFactor = sm && smDyn ? 1.4 : sm ? 1.2 : 1;
	const per = Math.ceil(2951823174884865e-21 * pixels + 5.753298233447344e-7 * pixels * steps) * smeaFactor * priceMultiplier;
	return Math.max(Math.ceil(per * strengthFactor), 2);
}
function freeSampleReasons(req, caps, account) {
	const reasons = [];
	if (account.tier < 3) reasons.push("not-opus");
	if (!account.active) reasons.push("inactive");
	if (req.width * req.height > 1048576) reasons.push("too-many-pixels");
	if (req.steps > 28) reasons.push("too-many-steps");
	if (req.characterReferences.length > 0) reasons.push("character-reference");
	if (caps.usageLimit && account.usageNegative) reasons.push("v5-usage-exhausted");
	return reasons;
}
/** SMEA as it ends up in the payload: auto-SMEA on V3, always off with a source image. */
function effectiveSmea(req, caps) {
	if (!caps.smea || req.mode !== "txt2img") return {
		sm: false,
		smDyn: false
	};
	const sm = req.autoSmea && caps.autoSmeaThreshold !== null ? req.width * req.height >= caps.autoSmeaThreshold : req.smea;
	return {
		sm,
		smDyn: sm && caps.smeaDyn && req.smeaDyn
	};
}
function estimateGenerationCost(req, account, options = {}) {
	const caps = pricingCaps(req);
	const { sm, smDyn } = effectiveSmea(req, caps);
	const strengthFactor = req.mode === "inpaint" ? req.inpaintStrength : req.mode === "img2img" ? req.strength : 1;
	const perImage = basePricePerImage(req.width, req.height, req.steps, sm, smDyn, caps.priceMultiplier, strengthFactor);
	const notFreeReasons = freeSampleReasons(req, caps, account);
	const freeSamples = notFreeReasons.length === 0 ? 1 : 0;
	const billableSamples = Math.max(0, req.samples - freeSamples);
	let extras = 0;
	const referencesActive = req.characterReferences.length > 0 && caps.characterReference && (req.mode !== "inpaint" || caps.characterReferenceInpaint);
	if (req.vibes.length > 0 && caps.vibeKind === "encoded" && !referencesActive && req.mode !== "inpaint") {
		extras += (options.unencodedVibes ?? 0) * 2;
		extras += Math.max(0, req.vibes.length - FREE_VIBES) * EXTRA_VIBE_PRICE;
	}
	if (referencesActive) extras += 5 * req.characterReferences.length * req.samples;
	const invalid = perImage > 140;
	return {
		perImage,
		billableSamples,
		freeSamples,
		extras,
		total: perImage * billableSamples + extras,
		invalid,
		notFreeReasons
	};
}
/** "Free only" mode: squeezes steps, size and samples into Opus free limits (TZ Phase 1, task 7). */
function clampToFree(req, account, options = {}) {
	const r = { ...req };
	const changes = [];
	if (r.steps > 28) {
		changes.push({
			kind: "steps",
			from: r.steps,
			to: 28
		});
		r.steps = 28;
	}
	if (r.width * r.height > 1048576) {
		const ratio = Math.sqrt(FREE_MAX_PIXELS / (r.width * r.height));
		let w = Math.max(64, Math.floor(r.width * ratio / 64) * 64);
		let h = Math.max(64, Math.floor(r.height * ratio / 64) * 64);
		while (w * h > FREE_MAX_PIXELS) if (w >= h) w -= 64;
		else h -= 64;
		changes.push({
			kind: "size",
			from: `${r.width}x${r.height}`,
			to: `${w}x${h}`
		});
		r.width = w;
		r.height = h;
	}
	if (r.samples > 1) {
		changes.push({
			kind: "samples",
			from: r.samples,
			to: 1
		});
		r.samples = 1;
	}
	if (r.characterReferences.length > 0) {
		changes.push({
			kind: "character-references-removed",
			count: r.characterReferences.length
		});
		r.characterReferences = [];
	}
	if (r.vibes.length > FREE_VIBES) {
		changes.push({
			kind: "vibes-trimmed",
			from: r.vibes.length,
			to: FREE_VIBES
		});
		r.vibes = r.vibes.slice(0, FREE_VIBES);
	}
	const estimate = estimateGenerationCost(r, account, options);
	const blockers = estimate.notFreeReasons;
	return {
		request: r,
		changes,
		possible: estimate.total === 0 && !estimate.invalid,
		blockers
	};
}
//#endregion
//#region src/domain/errors.ts
/** Thrown by the domain for requests that cannot be built at all. Mapped to i18n in core/errors. */
var DomainError = class extends Error {
	code;
	params;
	constructor(code, params = {}) {
		super(code);
		this.name = "DomainError";
		this.code = code;
		this.params = params;
	}
};
//#endregion
//#region src/domain/request.ts
/** A complete request with the web client's defaults for the given model. */
function defaultRequest(model) {
	const caps = getCapabilities(model);
	return {
		model,
		mode: "txt2img",
		prompt: "",
		negativePrompt: "",
		ucPreset: caps.ucPresets[0] ?? "none",
		qualityPreset: "standard",
		dataset: "none",
		characters: [],
		useCoords: false,
		width: caps.defaults.width,
		height: caps.defaults.height,
		steps: caps.defaults.steps,
		scale: caps.defaults.scale,
		cfgRescale: 0,
		sampler: "k_euler_ancestral",
		noiseSchedule: "karras",
		seed: 0,
		samples: 1,
		smea: false,
		smeaDyn: false,
		autoSmea: caps.autoSmeaThreshold !== null,
		decrisper: false,
		varietyBoost: false,
		legacyUc: false,
		transparentBackground: false,
		imageFormat: "webp",
		stream: "none",
		strength: .7,
		noise: 0,
		inpaintStrength: 1,
		vibes: [],
		normalizeVibeStrength: true,
		characterReferences: []
	};
}
//#endregion
//#region src/domain/payload/context.ts
/** Collects what the builder removed or coerced, for the payload inspector. */
var BuildContext = class {
	dropped = [];
	warnings = [];
	drop(path, reason, userSet) {
		this.dropped.push({
			path,
			reason,
			userSet
		});
	}
	warn(code, params) {
		this.warnings.push(params ? {
			code,
			params
		} : { code });
	}
};
/** Deletes `key` from `params` and records it if it was present. */
function dropParam(ctx, params, key, reason, userSet) {
	if (Object.hasOwn(params, key)) {
		delete params[key];
		ctx.drop(`parameters.${key}`, reason, userSet);
	}
}
//#endregion
//#region src/domain/payload/normalize.ts
var MAX_SEED$1 = 2 ** 32 - 1;
/** Validates and coerces a request against model limits. Returns a new object. */
function normalizeRequest(req, caps, ctx) {
	const r = { ...req };
	if (!Number.isInteger(r.seed) || r.seed < 0 || r.seed > MAX_SEED$1) throw new DomainError("invalid-seed", { seed: String(r.seed) });
	const width = roundToStep(r.width);
	const height = roundToStep(r.height);
	if (width !== r.width || height !== r.height) {
		ctx.warn("size-rounded", {
			from: `${r.width}x${r.height}`,
			to: `${width}x${height}`
		});
		r.width = width;
		r.height = height;
	}
	if (r.width * r.height > caps.maxPixels) throw new DomainError("size-too-large", {
		width: r.width,
		height: r.height,
		max: caps.maxPixels
	});
	const steps = Math.min(caps.maxSteps, Math.max(1, Math.round(r.steps)));
	if (steps !== r.steps) {
		ctx.warn("steps-clamped", {
			from: r.steps,
			to: steps
		});
		r.steps = steps;
	}
	const samples = Math.min(maxSamplesForArea(r.width, r.height), Math.max(1, Math.round(r.samples)));
	if (samples !== r.samples) {
		ctx.warn("samples-clamped", {
			from: r.samples,
			to: samples
		});
		r.samples = samples;
	}
	if (!caps.samplers.includes(r.sampler)) {
		ctx.warn("sampler-replaced", {
			from: r.sampler,
			to: "k_euler_ancestral"
		});
		r.sampler = "k_euler_ancestral";
	}
	if (!caps.ucPresets.includes(r.ucPreset)) r.ucPreset = caps.ucPresets[0] ?? "none";
	if (!caps.qualityPresets.includes(r.qualityPreset)) r.qualityPreset = "standard";
	if (r.mode !== "txt2img" && !r.image) throw new DomainError("missing-image");
	if (r.mode === "inpaint") {
		if (!r.mask) throw new DomainError("missing-mask");
		if (!caps.inpaint) throw new DomainError("unsupported-mode", {
			mode: r.mode,
			model: caps.model
		});
	}
	if (r.mode === "img2img" && !caps.img2img) throw new DomainError("unsupported-mode", {
		mode: r.mode,
		model: caps.model
	});
	return r;
}
//#endregion
//#region src/domain/payload/sanitize.ts
/** Variety Boost sigma scales with resolution (bundle:_app@1551802). */
function varietyFactor(width, height) {
	return Math.sqrt(Math.floor(width / 8) * Math.floor(height / 8) / 15808);
}
function sanitizeSchedule(p, req, caps, ctx) {
	if (caps.forcedNoiseSchedule) {
		if (req.noiseSchedule !== caps.forcedNoiseSchedule) ctx.warn("noise-schedule-forced", {
			from: req.noiseSchedule,
			to: caps.forcedNoiseSchedule
		});
		p.noise_schedule = caps.forcedNoiseSchedule;
		return;
	}
	if (SAMPLERS_WITHOUT_SCHEDULE.includes(p.sampler)) {
		dropParam(ctx, p, "noise_schedule", "not-applicable-to-mode", false);
		return;
	}
	const schedule = p.noise_schedule;
	if (!caps.noiseSchedules.includes(schedule)) {
		const fallback = "karras";
		ctx.warn("noise-schedule-forced", {
			from: schedule,
			to: fallback
		});
		p.noise_schedule = fallback;
	}
}
function sanitizeParameters(p, req, caps, action, ctx) {
	sanitizeSchedule(p, req, caps, ctx);
	if (p.sampler === "k_euler_ancestral" && p.noise_schedule !== "native") {
		p.deliberate_euler_ancestral_bug = false;
		p.prefer_brownian = true;
	}
	if (!caps.varietyBoost) dropParam(ctx, p, "skip_cfg_above_sigma", "unsupported-by-model", req.varietyBoost);
	else if (typeof p.skip_cfg_above_sigma === "number" && p.skip_cfg_above_sigma > 0) p.skip_cfg_above_sigma *= varietyFactor(p.width, p.height);
	if (!caps.smea) {
		dropParam(ctx, p, "sm", "unsupported-by-model", req.smea);
		dropParam(ctx, p, "sm_dyn", "unsupported-by-model", req.smeaDyn);
	} else if (!caps.smeaDyn) dropParam(ctx, p, "sm_dyn", "unsupported-by-model", req.smeaDyn);
	if (!caps.decrisper && p.dynamic_thresholding) {
		ctx.warn("decrisper-disabled");
		p.dynamic_thresholding = false;
	}
	if (!caps.cfgRescale) dropParam(ctx, p, "cfg_rescale", "unsupported-by-model", req.cfgRescale !== 0);
	if (!caps.transparency) {
		dropParam(ctx, p, "straight_alpha", "unsupported-by-model", false);
		dropParam(ctx, p, "tag_hint_transparent_background", "unsupported-by-model", req.transparentBackground);
	} else if (p.tag_hint_transparent_background !== true) delete p.tag_hint_transparent_background;
	if (action !== "infill") dropParam(ctx, p, "mask", "not-applicable-to-mode", false);
	if (!p.image) {
		dropParam(ctx, p, "strength", "not-applicable-to-mode", false);
		dropParam(ctx, p, "noise", "not-applicable-to-mode", false);
	}
	if (req.imageFormat === "webp") p.image_format = "webp";
	return p;
}
//#endregion
//#region src/domain/payload/images.ts
/** img2img / inpaint fields shared by every model family (bundle:2952@28345-28598). */
function applySourceImage(params, req, v4Prompt) {
	if (req.mode === "txt2img" || !req.image) return;
	params.image = req.image;
	params.strength = req.strength;
	params.noise = req.noise;
	params.extra_noise_seed = req.seed > 0 ? req.seed - 1 : 0;
	if (Object.hasOwn(params, "sm")) params.sm = false;
	if (Object.hasOwn(params, "sm_dyn")) params.sm_dyn = false;
	if (req.mode === "img2img") {
		params.color_correct = false;
		return;
	}
	params.mask = req.mask;
	params.add_original_image = false;
	if (v4Prompt && req.inpaintStrength !== 1) params.img2img = {
		strength: req.inpaintStrength,
		color_correct: true
	};
}
function normalizedStrengths(strengths, normalize) {
	const total = strengths.reduce((sum, s) => sum + Math.abs(s), 0);
	if (!normalize || strengths.length < 2 || total <= 1) return strengths;
	return strengths.map((s) => s / total);
}
function unsupportedReason(caps) {
	return caps.family === "v5" ? "feature-flag-off" : "unsupported-by-model";
}
/** Returns true when character references were applied (vibes are then suppressed). */
function applyCharacterReferences(params, req, caps, ctx) {
	const refs = req.characterReferences;
	if (refs.length === 0) return false;
	if (!caps.characterReference) {
		ctx.drop("parameters.director_reference_images", unsupportedReason(caps), true);
		return false;
	}
	if (req.mode === "inpaint" && !caps.characterReferenceInpaint) {
		ctx.drop("parameters.director_reference_images", "not-applicable-to-mode", true);
		return false;
	}
	const used = refs.slice(0, 16);
	refs.slice(16).forEach((_, i) => ctx.drop(`parameters.director_reference_images[${16 + i}]`, "exceeds-model-limit", true));
	params.director_reference_images = used.map((r) => r.image);
	params.director_reference_descriptions = used.map((r) => ({
		caption: {
			base_caption: r.description,
			char_captions: []
		},
		legacy_uc: false
	}));
	params.director_reference_information_extracted = used.map((r) => r.informationExtracted);
	params.director_reference_strength_values = used.map((r) => r.strength);
	params.director_reference_secondary_strength_values = used.map((r) => 1 - r.fidelity);
	return true;
}
function applyVibes(params, req, caps, ctx, characterReferencesApplied) {
	const vibes = req.vibes;
	if (vibes.length === 0) return;
	if (!caps.vibeTransfer || caps.vibeKind === "none") {
		ctx.drop("parameters.reference_image_multiple", unsupportedReason(caps), true);
		return;
	}
	if (req.mode === "inpaint") {
		ctx.drop("parameters.reference_image_multiple", "not-applicable-to-mode", true);
		return;
	}
	if (characterReferencesApplied) {
		ctx.drop("parameters.reference_image_multiple", "superseded", true);
		return;
	}
	const used = vibes.slice(0, 16);
	vibes.slice(16).forEach((_, i) => ctx.drop(`parameters.reference_image_multiple[${16 + i}]`, "exceeds-model-limit", true));
	params.reference_image_multiple = used.map((v) => v.data);
	if (caps.vibeKind === "raw") {
		params.reference_information_extracted_multiple = used.map((v) => v.informationExtracted);
		params.reference_strength_multiple = used.map((v) => v.strength);
	} else params.reference_strength_multiple = normalizedStrengths(used.map((v) => v.strength), req.normalizeVibeStrength);
}
//#endregion
//#region src/domain/payload/v3.ts
function resolveSmea(req, caps) {
	if (req.autoSmea && caps.autoSmeaThreshold !== null) return req.width * req.height >= caps.autoSmeaThreshold ? {
		sm: true,
		smDyn: req.smeaDyn
	} : {
		sm: false,
		smDyn: false
	};
	return {
		sm: req.smea,
		smDyn: req.smea && req.smeaDyn
	};
}
function buildV3Parameters(req, caps, negative, ctx) {
	if (req.characters.some((c) => c.enabled && c.prompt.trim() !== "")) ctx.drop("parameters.characterPrompts", "unsupported-by-model", true);
	const { sm, smDyn } = resolveSmea(req, caps);
	const params = {
		params_version: 4,
		width: req.width,
		height: req.height,
		scale: req.scale,
		sampler: req.sampler,
		steps: req.steps,
		n_samples: req.samples,
		ucPresetId: req.ucPreset,
		qualityPresetId: req.qualityPreset,
		sm,
		sm_dyn: smDyn,
		dynamic_thresholding: req.decrisper,
		controlnet_strength: 1,
		legacy: false,
		add_original_image: true,
		cfg_rescale: req.cfgRescale,
		noise_schedule: req.noiseSchedule,
		legacy_v3_extend: false,
		skip_cfg_above_sigma: req.varietyBoost ? caps.varietySigma : null,
		seed: req.seed,
		tag_hint_qt: TAG_HINT_IDS[req.qualityPreset],
		tag_hint_uc_preset: TAG_HINT_IDS[req.ucPreset],
		characterPrompts: [],
		negative_prompt: negative
	};
	if (req.characterReferences.length > 0) ctx.drop("parameters.director_reference_images", "unsupported-by-model", true);
	applySourceImage(params, req, false);
	applyVibes(params, req, caps, ctx, false);
	return params;
}
//#endregion
//#region src/domain/payload/v5.ts
/**
* Transparency intent of V5 (straight alpha output and the transparent-background tag hint).
* Added for every v4_prompt model; sanitize.ts removes it where the model has no transparency.
*/
function applyV5Intent(params, req) {
	params.straight_alpha = true;
	params.tag_hint_transparent_background = req.transparentBackground;
}
//#endregion
//#region src/domain/payload/v4.ts
function prepareCharacters(req, caps, ctx) {
	const active = req.characters.filter((c) => c.enabled && c.prompt.trim() !== "");
	if (active.length > caps.maxCharacters) active.slice(caps.maxCharacters).forEach((_, i) => ctx.drop(`parameters.characterPrompts[${caps.maxCharacters + i}]`, "exceeds-model-limit", true));
	return active.slice(0, caps.maxCharacters).map((c) => ({
		prompt: normalizeCharacterPrompt(c.prompt),
		uc: c.negative,
		center: placeOnCanvas(c.center, caps),
		enabled: true
	}));
}
function resolveUseCoords(req, caps, count, ctx) {
	if (!req.useCoords) return false;
	const minimum = caps.canPositionSingleCharacter ? 1 : 2;
	if (caps.positioning === "none" || count < minimum) {
		ctx.warn("coords-disabled", {
			characters: count,
			minimum
		});
		return false;
	}
	return true;
}
function buildV4Parameters(req, caps, prompt, negative, ctx) {
	const characters = prepareCharacters(req, caps, ctx);
	const useCoords = resolveUseCoords(req, caps, characters.length, ctx);
	const legacyUc = req.legacyUc && caps.legacyUc;
	if (req.legacyUc && !caps.legacyUc) ctx.warn("legacy-uc-disabled");
	const params = {
		params_version: 4,
		width: req.width,
		height: req.height,
		scale: req.scale,
		sampler: req.sampler,
		steps: req.steps,
		n_samples: req.samples,
		ucPresetId: req.ucPreset,
		qualityPresetId: req.qualityPreset,
		autoSmea: false,
		sm: req.smea,
		sm_dyn: req.smeaDyn,
		dynamic_thresholding: req.decrisper,
		controlnet_strength: 1,
		legacy: false,
		add_original_image: true,
		cfg_rescale: req.cfgRescale,
		noise_schedule: req.noiseSchedule,
		legacy_v3_extend: false,
		skip_cfg_above_sigma: req.varietyBoost ? caps.varietySigma : null,
		use_coords: useCoords,
		legacy_uc: legacyUc,
		normalize_reference_strength_multiple: req.normalizeVibeStrength,
		inpaintImg2ImgStrength: req.inpaintStrength,
		seed: req.seed,
		tag_hint_qt: TAG_HINT_IDS[req.qualityPreset],
		tag_hint_uc_preset: TAG_HINT_IDS[req.ucPreset],
		characterPrompts: characters,
		v4_prompt: {
			caption: {
				base_caption: prompt,
				char_captions: characters.map((c) => ({
					char_caption: c.prompt,
					centers: [c.center]
				}))
			},
			use_coords: useCoords,
			use_order: true
		},
		v4_negative_prompt: {
			caption: {
				base_caption: negative,
				char_captions: characters.map((c) => ({
					char_caption: c.uc,
					centers: [c.center]
				}))
			},
			legacy_uc: legacyUc
		},
		negative_prompt: negative
	};
	applyV5Intent(params, req);
	applySourceImage(params, req, true);
	applyVibes(params, req, caps, ctx, applyCharacterReferences(params, req, caps, ctx));
	return params;
}
//#endregion
//#region src/domain/payload/build.ts
var ACTIONS = {
	txt2img: "generate",
	img2img: "img2img",
	inpaint: "infill"
};
/** Final prompt and UC strings exactly as they go into `input` / `negative_prompt`. */
function composePrompts(req, caps) {
	const withQuality = applyQualityTags(req.prompt, caps, req.qualityPreset, req.transparentBackground);
	const negative = applyUcPreset(req.negativePrompt, caps, req.ucPreset, withQuality);
	return {
		prompt: applyDatasetPrefix(withQuality, caps, req.dataset),
		negative
	};
}
function buildPayload(input, caps) {
	if (input.model !== caps.model) throw new Error(`Capabilities of ${caps.model} passed for ${input.model}`);
	const ctx = new BuildContext();
	const req = normalizeRequest(input, caps, ctx);
	const { prompt, negative } = composePrompts(req, caps);
	const action = ACTIONS[req.mode];
	const renderCaps = req.mode === "inpaint" && caps.inpaintBase !== caps.model ? getInpaintCapabilities(caps.model) : caps;
	const params = renderCaps.v4Prompt ? buildV4Parameters(req, renderCaps, prompt, negative, ctx) : buildV3Parameters(req, renderCaps, negative, ctx);
	sanitizeParameters(params, req, renderCaps, action, ctx);
	let model = req.model;
	if (req.mode === "inpaint") {
		model = caps.inpaintModel;
		if (renderCaps !== caps) ctx.warn("inpaint-model-fallback", { model: caps.inpaintModel });
	}
	const endpoint = req.stream === "none" ? "generate" : "generate-stream";
	if (req.stream !== "none") params.stream = req.stream;
	return {
		body: {
			input: prompt,
			model,
			action,
			parameters: params,
			use_new_shared_trial: true
		},
		endpoint,
		dropped: ctx.dropped,
		warnings: ctx.warnings,
		request: req
	};
}
//#endregion
//#region src/domain/payload/override.ts
function isPlainObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Parses override text. Empty text means "no override". */
function parseOverride(text) {
	if (text.trim() === "") return null;
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch (error) {
		throw new DomainError("invalid-override", { reason: error instanceof Error ? error.message : String(error) });
	}
	if (!isPlainObject(parsed)) throw new DomainError("invalid-override", { reason: "not-an-object" });
	return parsed;
}
function mergeInto(target, source, prefix, paths) {
	for (const [key, value] of Object.entries(source)) {
		const path = prefix ? `${prefix}.${key}` : key;
		const current = target[key];
		if (isPlainObject(value) && isPlainObject(current)) mergeInto(current, value, path, paths);
		else {
			target[key] = structuredClone(value);
			paths.push(path);
		}
	}
}
function applyOverride(body, override) {
	const clone = structuredClone(body);
	const paths = [];
	if (override) mergeInto(clone, override, "", paths);
	return {
		body: clone,
		paths
	};
}
//#endregion
//#region src/features/generation/form.ts
var MAX_SEED = 2 ** 32 - 1;
function pick(value, allowed, fallback) {
	return allowed.includes(value) ? value : fallback;
}
function finite(value, fallback) {
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}
/** Same distribution as the web client: floor(2^32 * random - 1). */
function randomSeed(random = Math.random) {
	return Math.max(0, Math.floor(2 ** 32 * random() - 1));
}
function resolveSeed(seed, random) {
	return Number.isInteger(seed) && seed >= 0 && seed <= MAX_SEED ? seed : randomSeed(random);
}
function requestFromSettings(g, seed) {
	const base = defaultRequest(isModelId(g.model) ? g.model : DEFAULT_MODEL);
	return {
		...base,
		prompt: g.prompt,
		negativePrompt: g.negativePrompt,
		ucPreset: pick(g.ucPreset, UC_PRESETS, base.ucPreset),
		qualityPreset: pick(g.qualityPreset, QUALITY_PRESETS, "standard"),
		dataset: pick(g.dataset, [
			"none",
			"fur",
			"background"
		], "none"),
		width: finite(g.width, base.width),
		height: finite(g.height, base.height),
		steps: finite(g.steps, base.steps),
		scale: finite(g.scale, base.scale),
		cfgRescale: finite(g.cfgRescale, 0),
		sampler: pick(g.sampler, SAMPLERS, "k_euler_ancestral"),
		noiseSchedule: pick(g.noiseSchedule, NOISE_SCHEDULES, "karras"),
		seed,
		samples: finite(g.samples, 1),
		smea: g.smea === true,
		smeaDyn: g.smeaDyn === true,
		autoSmea: g.autoSmea !== false,
		decrisper: g.decrisper === true,
		varietyBoost: g.varietyBoost === true,
		legacyUc: g.legacyUc === true,
		transparentBackground: g.transparentBackground === true,
		imageFormat: g.imageFormat === "png" ? "png" : "webp",
		useCoords: g.useCoords === true,
		characters: (Array.isArray(g.characters) ? g.characters : []).map((c) => ({
			prompt: String(c.prompt ?? ""),
			negative: String(c.negative ?? ""),
			center: {
				x: finite(c.x, .5),
				y: finite(c.y, .5)
			},
			enabled: c.enabled !== false
		}))
	};
}
//#endregion
//#region src/features/generation/service.ts
function prepareGeneration({ settings, transport, account, random }) {
	const seed = resolveSeed(settings.generation.seed, random);
	let request = requestFromSettings(settings.generation, seed);
	const caps = getCapabilities(request.model);
	let clampChanges = [];
	if (settings.anlas.freeOnly) {
		const clamp = clampToFree(request, account);
		request = clamp.request;
		clampChanges = clamp.changes;
	}
	const build = buildPayload(request, caps);
	const blockers = [];
	let body = build.body;
	let overridePaths = [];
	if (settings.rawOverride.enabled) try {
		const result = applyOverride(build.body, parseOverride(settings.rawOverride.json));
		body = result.body;
		overridePaths = result.paths;
	} catch (error) {
		blockers.push({
			kind: "override",
			message: toNaiError(error).text
		});
	}
	const cost = estimateGenerationCost(build.request, account);
	if (cost.invalid) blockers.push({ kind: "invalid-price" });
	if (settings.anlas.freeOnly && cost.total > 0) blockers.push({
		kind: "free-only",
		reasons: cost.notFreeReasons,
		cost: cost.total
	});
	return {
		request: build.request,
		caps,
		build,
		body,
		overridePaths,
		effective: transport.effectiveRequest(body, overridePaths),
		cost,
		clampChanges,
		blockers,
		transportId: transport.id
	};
}
/** Sends a prepared request. Blocked requests never reach the transport. */
async function sendPrepared(prepared, transport, account, signal) {
	const freeOnly = prepared.blockers.find((b) => b.kind === "free-only");
	if (freeOnly) throw new NaiError("free-only-blocked", "none", { cost: freeOnly.cost });
	const overrideBlocker = prepared.blockers.find((b) => b.kind === "override");
	if (overrideBlocker) throw new NaiError("invalid-override", "open-inspector", { reason: overrideBlocker.kind === "override" ? overrideBlocker.message : "" });
	if (prepared.blockers.some((b) => b.kind === "invalid-price")) throw new NaiError("price-too-high", "none", { perImage: prepared.cost.perImage });
	if (prepared.overridePaths.length > 0) log.warn("raw override applied to this generation:", prepared.overridePaths.join(", "));
	try {
		return await transport.generate(prepared.body, {
			endpoint: prepared.build.endpoint,
			signal,
			retryable: prepared.cost.total === 0
		});
	} catch (error) {
		throw toNaiError(error, {
			model: prepared.request.model,
			family: prepared.caps.family,
			transport: transport.id,
			cost: prepared.cost.total,
			balance: account.anlas
		});
	}
}
//#endregion
//#region src/features/generation/controller.ts
var StudioController = class {
	env;
	state = {
		selection: null,
		account: UNKNOWN_ACCOUNT,
		accountError: null,
		busy: false
	};
	listeners = /* @__PURE__ */ new Set();
	abort = null;
	constructor(env) {
		this.env = env;
	}
	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
	emit() {
		for (const listener of this.listeners) listener(this.state);
	}
	async refreshTransport() {
		this.state.selection = await selectTransport(settings().transport.mode, this.env);
		log.info("transport:", this.state.selection.transport.id, this.state.selection.health ? `plugin ${this.state.selection.health.version}` : "no plugin");
		this.emit();
		await this.refreshAccount();
	}
	async refreshAccount() {
		const transport = this.state.selection?.transport;
		if (!transport) return;
		try {
			this.state.account = accountFromSubscription(await transport.subscription());
			this.state.accountError = null;
		} catch (error) {
			this.state.account = UNKNOWN_ACCOUNT;
			this.state.accountError = toNaiError(error, { transport: transport.id });
			log.warn("subscription unavailable", this.state.accountError.code);
		}
		this.emit();
	}
	/** Builds everything the inspector shows. Throws NaiError for requests that cannot be built. */
	prepare() {
		const transport = this.state.selection?.transport;
		if (!transport) throw new NaiError("plugin-unavailable", "install-plugin");
		try {
			return prepareGeneration({
				settings: settings(),
				transport,
				account: this.state.account
			});
		} catch (error) {
			throw toNaiError(error);
		}
	}
	async generate(prepared) {
		const transport = this.state.selection?.transport;
		if (!transport) throw new NaiError("plugin-unavailable", "install-plugin");
		if (this.state.busy) throw new NaiError("rate-limited", "none");
		const chatId = ctx().getCurrentChatId();
		this.abort = new AbortController();
		this.state.busy = true;
		this.emit();
		try {
			const result = await sendPrepared(prepared, transport, this.state.account, this.abort.signal);
			const saved = await saveImages(result.images, imageFolder());
			const meta = {
				prompt: prepared.body.input,
				model: prepared.body.model,
				seed: prepared.request.seed,
				transport: transport.id,
				cost: prepared.cost.total,
				correlationId: result.correlationId
			};
			if (ctx().getCurrentChatId() !== chatId) return {
				messageId: null,
				images: saved.length,
				chatChanged: true
			};
			const messageId = await postToChat(saved, meta, settings().output.hiddenFromPrompt);
			log.info("generated", meta.model, `seed ${meta.seed}`, `cost ${meta.cost}`, result.correlationId ?? "");
			return {
				messageId,
				images: saved.length,
				chatChanged: false
			};
		} finally {
			this.state.busy = false;
			this.abort = null;
			this.emit();
			this.refreshAccount();
		}
	}
	cancel() {
		this.abort?.abort();
	}
};
//#endregion
//#region src/ui/templates/character-row.html?raw
var character_row_default = "<div class=\"naist-character\" data-index=\"{{index}}\">\n    <div class=\"naist-row\">\n        <label class=\"checkbox_label\"><input type=\"checkbox\" class=\"naist-char-enabled\" {{#if enabled}}checked{{/if}}><span data-i18n=\"naist.character.enabled\"></span></label>\n        <span class=\"naist-muted\">#{{number}}</span>\n        <div class=\"menu_button fa-solid fa-trash-can naist-char-remove\" data-i18n=\"[title]naist.character.remove\"></div>\n    </div>\n    <textarea class=\"text_pole textarea_compact naist-char-prompt\" rows=\"2\" data-i18n=\"[placeholder]naist.character.prompt\">{{prompt}}</textarea>\n    <input type=\"text\" class=\"text_pole naist-char-negative\" value=\"{{negative}}\" data-i18n=\"[placeholder]naist.character.negative\">\n    <div class=\"naist-grid2 naist-char-position\">\n        <label><span data-i18n=\"naist.character.x\"></span> <input type=\"number\" class=\"text_pole naist-char-x\" min=\"0\" max=\"1\" step=\"0.1\" value=\"{{x}}\"></label>\n        <label><span data-i18n=\"naist.character.y\"></span> <input type=\"number\" class=\"text_pole naist-char-y\" min=\"0\" max=\"1\" step=\"0.1\" value=\"{{y}}\"></label>\n    </div>\n</div>\n";
//#endregion
//#region src/ui/templates/panel.html?raw
var panel_default = "<div class=\"naist-panel\" id=\"naist_panel\">\n    <div class=\"inline-drawer\">\n        <div class=\"inline-drawer-toggle inline-drawer-header\">\n            <b data-i18n=\"naist.panel.title\"></b>\n            <div class=\"inline-drawer-icon fa-solid fa-circle-chevron-down down\"></div>\n        </div>\n        <div class=\"inline-drawer-content\">\n            <div class=\"naist-content\">\n                <div class=\"naist-row naist-status\">\n                    <label for=\"naist_transport_mode\" data-i18n=\"naist.panel.transport\"></label>\n                    <select id=\"naist_transport_mode\" class=\"text_pole naist-grow\">\n                        <option value=\"auto\" data-i18n=\"naist.transport.auto\"></option>\n                        <option value=\"plugin\" data-i18n=\"naist.transport.plugin\"></option>\n                        <option value=\"native\" data-i18n=\"naist.transport.native\"></option>\n                    </select>\n                    <div\n                        id=\"naist_refresh\"\n                        class=\"menu_button fa-solid fa-rotate\"\n                        data-i18n=\"[title]naist.panel.refresh\"\n                    ></div>\n                </div>\n                <div id=\"naist_transport_badge\" class=\"naist-badge\"></div>\n                <div id=\"naist_account\" class=\"naist-account\"></div>\n\n                <label for=\"naist_model\" data-i18n=\"naist.panel.model\"></label>\n                <select id=\"naist_model\" class=\"text_pole\">\n                    {{#each models}}\n                    <option value=\"{{id}}\" data-i18n=\"{{nameKey}}\"></option>\n                    {{/each}}\n                </select>\n\n                <label for=\"naist_prompt\" data-i18n=\"naist.panel.prompt\"></label>\n                <textarea\n                    id=\"naist_prompt\"\n                    class=\"text_pole textarea_compact\"\n                    rows=\"4\"\n                    data-i18n=\"[placeholder]naist.panel.promptPlaceholder\"\n                ></textarea>\n\n                <label for=\"naist_negative\" data-i18n=\"naist.panel.negative\"></label>\n                <textarea id=\"naist_negative\" class=\"text_pole textarea_compact\" rows=\"2\"></textarea>\n\n                <div class=\"naist-grid2\">\n                    <div>\n                        <label for=\"naist_uc_preset\" data-i18n=\"naist.panel.ucPreset\"></label>\n                        <select id=\"naist_uc_preset\" class=\"text_pole\"></select>\n                    </div>\n                    <div>\n                        <label for=\"naist_quality\" data-i18n=\"naist.panel.quality\"></label>\n                        <select id=\"naist_quality\" class=\"text_pole\"></select>\n                    </div>\n                </div>\n\n                <div id=\"naist_characters_block\" class=\"naist-block\" data-cap=\"characters\" data-feature=\"characters\">\n                    <div class=\"naist-row\">\n                        <b data-i18n=\"naist.panel.characters\"></b>\n                        <span id=\"naist_characters_count\" class=\"naist-muted\"></span>\n                        <div\n                            id=\"naist_add_character\"\n                            class=\"menu_button fa-solid fa-user-plus\"\n                            data-i18n=\"[title]naist.panel.addCharacter\"\n                        ></div>\n                    </div>\n                    <label class=\"checkbox_label\"\n                        ><input type=\"checkbox\" id=\"naist_use_coords\" /><span data-i18n=\"naist.panel.useCoords\"></span\n                    ></label>\n                    <div id=\"naist_characters\"></div>\n                    <div class=\"naist-feature-hint\" data-hint-for=\"characters\"></div>\n                </div>\n\n                <label for=\"naist_size_preset\" data-i18n=\"naist.panel.size\"></label>\n                <div class=\"naist-grid3\">\n                    <select id=\"naist_size_preset\" class=\"text_pole\"></select>\n                    <input\n                        id=\"naist_width\"\n                        type=\"number\"\n                        class=\"text_pole\"\n                        step=\"64\"\n                        min=\"64\"\n                        data-i18n=\"[title]naist.panel.width\"\n                    />\n                    <input\n                        id=\"naist_height\"\n                        type=\"number\"\n                        class=\"text_pole\"\n                        step=\"64\"\n                        min=\"64\"\n                        data-i18n=\"[title]naist.panel.height\"\n                    />\n                </div>\n\n                <div class=\"naist-grid2\">\n                    <div>\n                        <label for=\"naist_sampler\" data-i18n=\"naist.panel.sampler\"></label>\n                        <select id=\"naist_sampler\" class=\"text_pole\"></select>\n                    </div>\n                    <div data-cap=\"noiseSchedule\">\n                        <label for=\"naist_schedule\" data-i18n=\"naist.panel.schedule\"></label>\n                        <select id=\"naist_schedule\" class=\"text_pole\"></select>\n                    </div>\n                </div>\n                <div class=\"naist-grid3\">\n                    <div>\n                        <label for=\"naist_steps\" data-i18n=\"naist.panel.steps\"></label>\n                        <input id=\"naist_steps\" type=\"number\" min=\"1\" max=\"50\" class=\"text_pole\" />\n                    </div>\n                    <div>\n                        <label for=\"naist_scale\" data-i18n=\"naist.panel.scale\"></label>\n                        <input id=\"naist_scale\" type=\"number\" step=\"0.1\" min=\"0\" max=\"10\" class=\"text_pole\" />\n                    </div>\n                    <div data-feature=\"cfgRescale\">\n                        <label for=\"naist_cfg_rescale\" data-i18n=\"naist.panel.cfgRescale\"></label>\n                        <input id=\"naist_cfg_rescale\" type=\"number\" step=\"0.02\" min=\"0\" max=\"1\" class=\"text_pole\" />\n                    </div>\n                </div>\n                <div class=\"naist-grid2\">\n                    <div>\n                        <label for=\"naist_seed\" data-i18n=\"naist.panel.seed\"></label>\n                        <input\n                            id=\"naist_seed\"\n                            type=\"number\"\n                            min=\"-1\"\n                            class=\"text_pole\"\n                            data-i18n=\"[title]naist.panel.seedHint\"\n                        />\n                    </div>\n                    <div data-feature=\"multipleSamples\">\n                        <label for=\"naist_samples\" data-i18n=\"naist.panel.samples\"></label>\n                        <input id=\"naist_samples\" type=\"number\" min=\"1\" max=\"8\" class=\"text_pole\" />\n                    </div>\n                </div>\n                <div class=\"naist-feature-hint\" data-hint-for=\"multipleSamples\"></div>\n\n                <div class=\"naist-flags\">\n                    <label class=\"checkbox_label\" data-cap=\"smea\"\n                        ><input type=\"checkbox\" id=\"naist_smea\" /><span data-i18n=\"naist.panel.smea\"></span\n                    ></label>\n                    <label class=\"checkbox_label\" data-cap=\"smeaDyn\"\n                        ><input type=\"checkbox\" id=\"naist_smea_dyn\" /><span data-i18n=\"naist.panel.smeaDyn\"></span\n                    ></label>\n                    <label class=\"checkbox_label\" data-cap=\"autoSmea\"\n                        ><input type=\"checkbox\" id=\"naist_auto_smea\" /><span data-i18n=\"naist.panel.autoSmea\"></span\n                    ></label>\n                    <label class=\"checkbox_label\" data-cap=\"decrisper\"\n                        ><input type=\"checkbox\" id=\"naist_decrisper\" /><span data-i18n=\"naist.panel.decrisper\"></span\n                    ></label>\n                    <label class=\"checkbox_label\" data-cap=\"varietyBoost\"\n                        ><input type=\"checkbox\" id=\"naist_variety\" /><span data-i18n=\"naist.panel.variety\"></span\n                    ></label>\n                    <label class=\"checkbox_label\" data-cap=\"transparency\" data-feature=\"transparency\"\n                        ><input type=\"checkbox\" id=\"naist_transparent\" /><span\n                            data-i18n=\"naist.panel.transparent\"\n                        ></span\n                    ></label>\n                    <label class=\"checkbox_label\" data-cap=\"legacyUc\"\n                        ><input type=\"checkbox\" id=\"naist_legacy_uc\" /><span data-i18n=\"naist.panel.legacyUc\"></span\n                    ></label>\n                </div>\n                <div class=\"naist-feature-hint\" data-hint-for=\"transparency\"></div>\n\n                <hr />\n                <label class=\"checkbox_label\"\n                    ><input type=\"checkbox\" id=\"naist_free_only\" /><span data-i18n=\"naist.panel.freeOnly\"></span\n                ></label>\n                <div id=\"naist_cost\" class=\"naist-cost\"></div>\n                <div id=\"naist_lost\" class=\"naist-hint\"></div>\n\n                <details class=\"naist-override\">\n                    <summary data-i18n=\"naist.panel.override\"></summary>\n                    <div class=\"naist-warning\" data-i18n=\"naist.panel.overrideWarning\"></div>\n                    <label class=\"checkbox_label\"\n                        ><input type=\"checkbox\" id=\"naist_override_enabled\" /><span\n                            data-i18n=\"naist.panel.overrideEnable\"\n                        ></span\n                    ></label>\n                    <textarea id=\"naist_override_json\" class=\"text_pole textarea_compact monospace\" rows=\"4\"></textarea>\n                </details>\n\n                <label class=\"checkbox_label\"\n                    ><input type=\"checkbox\" id=\"naist_inspect_before\" /><span\n                        data-i18n=\"naist.panel.inspectBeforeSend\"\n                    ></span\n                ></label>\n                <div class=\"naist-row naist-actions\">\n                    <div id=\"naist_inspect\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-magnifying-glass\"></i><span data-i18n=\"naist.panel.inspect\"></span>\n                    </div>\n                    <div id=\"naist_generate\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-paintbrush\"></i><span data-i18n=\"naist.panel.generate\"></span>\n                    </div>\n                    <div id=\"naist_cancel\" class=\"menu_button menu_button_icon naist-hidden\">\n                        <i class=\"fa-solid fa-stop\"></i><span data-i18n=\"naist.panel.cancel\"></span>\n                    </div>\n                </div>\n                <div id=\"naist_message\" class=\"naist-message\"></div>\n            </div>\n        </div>\n    </div>\n</div>\n";
//#endregion
//#region src/ui/components/json-view.ts
var BASE64_MIN = 256;
function escapeHtml$1(text) {
	return text.replace(/[&<>"']/g, (ch) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		"\"": "&quot;",
		"'": "&#39;"
	})[ch] ?? ch);
}
function renderValue(value, path, highlight, indent) {
	const pad = "  ".repeat(indent);
	let html;
	if (value === null || typeof value !== "object") {
		if (typeof value === "string" && value.length > BASE64_MIN && /^[A-Za-z0-9+/=]+$/.test(value)) html = `<span class="naist-json-b64">"&lt;base64 ${value.length}&gt;"</span>`;
		else html = `<span class="naist-json-${value === null ? "null" : typeof value}">${escapeHtml$1(JSON.stringify(value))}</span>`;
	} else if (Array.isArray(value)) {
		if (value.length === 0) html = "[]";
		else html = `[\n${value.map((item, i) => `${pad}  ${renderValue(item, `${path}[${i}]`, highlight, indent + 1)}`).join(",\n")}\n${pad}]`;
	} else {
		const entries = Object.entries(value);
		if (entries.length === 0) html = "{}";
		else html = `{\n${entries.map(([key, item]) => {
			const childPath = path ? `${path}.${key}` : key;
			return `${pad}  <span class="naist-json-key">${escapeHtml$1(JSON.stringify(key))}</span>: ${renderValue(item, childPath, highlight, indent + 1)}`;
		}).join(",\n")}\n${pad}}`;
	}
	return highlight.has(path) ? `<span class="naist-json-override">${html}</span>` : html;
}
function renderJson(value, highlightPaths = []) {
	return `<pre class="naist-json">${renderValue(value, "", new Set(highlightPaths), 0)}</pre>`;
}
//#endregion
//#region src/ui/panel/inspector.ts
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}
function droppedList(prepared) {
	if (prepared.build.dropped.length === 0) return `<p class="naist-muted" data-i18n="naist.inspector.nothingDropped"></p>`;
	return `<ul class="naist-list">${[...prepared.build.dropped].sort((a, b) => Number(b.userSet) - Number(a.userSet)).map((d) => `<li class="${d.userSet ? "naist-dropped-user" : "naist-muted"}"><code>${escapeHtml(d.path)}</code> — ${escapeHtml(t(`naist.drop.${d.reason}`))}</li>`).join("")}</ul>`;
}
function warningsList(prepared) {
	const warnings = prepared.build.warnings.map((w) => `<li>${escapeHtml(t(`naist.warning.${w.code}`, w.params))}</li>`);
	const clamps = prepared.clampChanges.map((c) => `<li>${escapeHtml(t(`naist.clamp.${c.kind}`, c))}</li>`);
	const all = [...warnings, ...clamps];
	return all.length ? `<ul class="naist-list">${all.join("")}</ul>` : `<p class="naist-muted" data-i18n="naist.inspector.noWarnings"></p>`;
}
function lostList(prepared) {
	if (prepared.effective.lost.length === 0) return "";
	return `<h4 data-i18n="naist.inspector.lost"></h4><ul class="naist-list naist-dropped-user">${prepared.effective.lost.map((l) => `<li>${escapeHtml(t(`naist.lost.${l}`))}</li>`).join("")}</ul>`;
}
/** Opens the inspector popup. Resolves true when the user chose to send (confirmSend mode). */
async function openInspector(prepared, options = { confirmSend: false }) {
	const c = ctx();
	const root = document.createElement("div");
	root.className = "naist-inspector";
	const native = prepared.transportId === "native";
	const costText = prepared.cost.total === 0 ? t("naist.cost.free") : t("naist.cost.paid", {
		total: prepared.cost.total,
		perImage: prepared.cost.perImage,
		billable: prepared.cost.billableSamples
	});
	root.innerHTML = `
        <h3 data-i18n="naist.inspector.title"></h3>
        <div class="naist-row">
            <span>${escapeHtml(t(`naist.transport.${prepared.transportId}`))}</span>
            <span class="naist-muted">${escapeHtml(prepared.body.model)} · ${escapeHtml(prepared.body.action)}</span>
            <span class="naist-cost-inline">${escapeHtml(costText)}</span>
        </div>
        ${prepared.overridePaths.length ? `<div class="naist-warning" data-i18n="naist.inspector.overrideApplied"></div>` : ""}
        ${lostList(prepared)}
        <div class="naist-row">
            <div class="menu_button menu_button_icon naist-copy"><i class="fa-solid fa-copy"></i><span data-i18n="naist.inspector.copy"></span></div>
        </div>
        <h4 data-i18n="naist.inspector.body"></h4>
        ${renderJson(prepared.body, prepared.overridePaths)}
        ${native ? `<h4 data-i18n="naist.inspector.effectiveNative"></h4>${renderJson(prepared.effective.body)}` : ""}
        <h4 data-i18n="naist.inspector.dropped"></h4>
        ${droppedList(prepared)}
        <h4 data-i18n="naist.inspector.warnings"></h4>
        ${warningsList(prepared)}
    `;
	localize(root);
	root.querySelector(".naist-copy")?.addEventListener("click", async () => {
		const json = JSON.stringify(native ? prepared.effective.body : prepared.body, null, 2);
		try {
			await navigator.clipboard.writeText(json);
			toastr.success(t("naist.inspector.copied"));
		} catch {
			toastr.error(t("naist.inspector.copyFailed"));
		}
	});
	const result = await c.callGenericPopup(root, options.confirmSend ? c.POPUP_TYPE.CONFIRM : c.POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		allowVerticalScrolling: true,
		okButton: options.confirmSend ? t("naist.inspector.send") : t("naist.inspector.close"),
		cancelButton: options.confirmSend ? t("naist.inspector.cancel") : false
	});
	return options.confirmSend && result === c.POPUP_RESULT.AFFIRMATIVE;
}
//#endregion
//#region src/ui/panel/panel.ts
function render(template, data) {
	const html = libs().Handlebars.compile(template)(data);
	return libs().DOMPurify.sanitize(html);
}
function $id(root, id) {
	const el = root.querySelector(`#${id}`);
	if (!el) throw new Error(`NAI Studio panel: missing #${id}`);
	return el;
}
function fillSelect(select, options, current) {
	select.innerHTML = "";
	for (const option of options) {
		const el = document.createElement("option");
		el.value = option.value;
		el.textContent = option.label;
		select.append(el);
	}
	select.value = options.some((o) => o.value === current) ? current : options[0]?.value ?? "";
}
var Panel = class {
	controller;
	root;
	refreshTimer = null;
	lastPrepared = null;
	constructor(controller) {
		this.controller = controller;
	}
	mount(container) {
		const html = render(panel_default, { models: MODELS });
		const wrapper = document.createElement("div");
		wrapper.innerHTML = html;
		this.root = wrapper.firstElementChild;
		container.append(this.root);
		localize(this.root);
		this.bind();
		this.syncFromSettings();
		this.controller.subscribe((state) => this.onState(state));
		this.onState(this.controller.state);
	}
	syncFromSettings() {
		const s = settings();
		const g = s.generation;
		const r = this.root;
		$id(r, "naist_transport_mode").value = s.transport.mode;
		$id(r, "naist_model").value = g.model;
		$id(r, "naist_prompt").value = g.prompt;
		$id(r, "naist_negative").value = g.negativePrompt;
		$id(r, "naist_width").value = String(g.width);
		$id(r, "naist_height").value = String(g.height);
		$id(r, "naist_steps").value = String(g.steps);
		$id(r, "naist_scale").value = String(g.scale);
		$id(r, "naist_cfg_rescale").value = String(g.cfgRescale);
		$id(r, "naist_seed").value = String(g.seed);
		$id(r, "naist_samples").value = String(g.samples);
		$id(r, "naist_smea").checked = g.smea;
		$id(r, "naist_smea_dyn").checked = g.smeaDyn;
		$id(r, "naist_auto_smea").checked = g.autoSmea;
		$id(r, "naist_decrisper").checked = g.decrisper;
		$id(r, "naist_variety").checked = g.varietyBoost;
		$id(r, "naist_transparent").checked = g.transparentBackground;
		$id(r, "naist_legacy_uc").checked = g.legacyUc;
		$id(r, "naist_use_coords").checked = g.useCoords;
		$id(r, "naist_free_only").checked = s.anlas.freeOnly;
		$id(r, "naist_override_enabled").checked = s.rawOverride.enabled;
		$id(r, "naist_override_json").value = s.rawOverride.json;
		$id(r, "naist_inspect_before").checked = s.inspector.openBeforeSend;
		this.applyModel();
		this.renderCharacters();
	}
	caps() {
		const model = settings().generation.model;
		return getCapabilities(isModelId(model) ? model : "nai-diffusion-4-5-full");
	}
	/** Options and visibility that depend on the selected model. */
	applyModel() {
		const g = settings().generation;
		const caps = this.caps();
		const r = this.root;
		fillSelect($id(r, "naist_uc_preset"), caps.ucPresets.map((id) => ({
			value: id,
			label: t(`naist.ucPreset.${id}`)
		})), g.ucPreset);
		fillSelect($id(r, "naist_quality"), caps.qualityPresets.map((id) => ({
			value: id,
			label: t(`naist.quality.${id}`)
		})), g.qualityPreset);
		fillSelect($id(r, "naist_sampler"), caps.samplers.map((id) => ({
			value: id,
			label: t(`naist.sampler.${id}`)
		})), g.sampler);
		fillSelect($id(r, "naist_schedule"), NOISE_SCHEDULES.filter((n) => caps.noiseSchedules.includes(n)).map((id) => ({
			value: id,
			label: t(`naist.schedule.${id}`)
		})), g.noiseSchedule);
		const presets = caps.sizePresets.map((p) => ({
			value: `${p.width}x${p.height}`,
			label: t("naist.size.preset", {
				category: t(`naist.size.${p.category}`),
				orientation: t(`naist.size.${p.orientation}`),
				width: p.width,
				height: p.height
			})
		}));
		presets.push({
			value: "custom",
			label: t("naist.size.custom")
		});
		const currentSize = `${g.width}x${g.height}`;
		fillSelect($id(r, "naist_size_preset"), presets, presets.some((p) => p.value === currentSize) ? currentSize : "custom");
		g.ucPreset = $id(r, "naist_uc_preset").value;
		g.qualityPreset = $id(r, "naist_quality").value;
		g.sampler = $id(r, "naist_sampler").value;
		const visible = {
			characters: caps.maxCharacters > 0,
			noiseSchedule: caps.forcedNoiseSchedule === null && caps.noiseSchedules.length > 0,
			smea: caps.smea,
			smeaDyn: caps.smeaDyn,
			autoSmea: caps.autoSmeaThreshold !== null,
			decrisper: caps.decrisper,
			varietyBoost: caps.varietyBoost,
			transparency: caps.transparency,
			legacyUc: caps.legacyUc
		};
		r.querySelectorAll("[data-cap]").forEach((el) => {
			el.classList.toggle("naist-hidden", visible[el.dataset.cap ?? ""] === false);
		});
		$id(r, "naist_characters_count").textContent = t("naist.panel.charactersLimit", {
			count: g.characters.length,
			max: caps.maxCharacters
		});
	}
	renderCharacters() {
		const container = $id(this.root, "naist_characters");
		const chars = settings().generation.characters;
		container.innerHTML = chars.map((c, index) => render(character_row_default, {
			...c,
			index,
			number: index + 1
		})).join("");
		localize(container);
		const caps = this.caps();
		$id(this.root, "naist_characters_count").textContent = t("naist.panel.charactersLimit", {
			count: chars.length,
			max: caps.maxCharacters
		});
		$id(this.root, "naist_add_character").classList.toggle("disabled", chars.length >= caps.maxCharacters);
	}
	bind() {
		const r = this.root;
		const g = () => settings().generation;
		const changed = () => {
			saveSettings();
			this.scheduleRefresh();
		};
		const text = (id, key) => $id(r, id).addEventListener("input", (e) => {
			g()[key] = e.target.value;
			changed();
		});
		const num = (id, key) => $id(r, id).addEventListener("change", (e) => {
			const value = Number(e.target.value);
			if (Number.isFinite(value)) g()[key] = value;
			changed();
		});
		const flag = (id, key) => $id(r, id).addEventListener("change", (e) => {
			g()[key] = e.target.checked;
			changed();
		});
		const select = (id, key) => $id(r, id).addEventListener("change", (e) => {
			g()[key] = e.target.value;
			changed();
		});
		text("naist_prompt", "prompt");
		text("naist_negative", "negativePrompt");
		select("naist_uc_preset", "ucPreset");
		select("naist_quality", "qualityPreset");
		select("naist_sampler", "sampler");
		select("naist_schedule", "noiseSchedule");
		num("naist_width", "width");
		num("naist_height", "height");
		num("naist_steps", "steps");
		num("naist_scale", "scale");
		num("naist_cfg_rescale", "cfgRescale");
		num("naist_seed", "seed");
		num("naist_samples", "samples");
		flag("naist_smea", "smea");
		flag("naist_smea_dyn", "smeaDyn");
		flag("naist_auto_smea", "autoSmea");
		flag("naist_decrisper", "decrisper");
		flag("naist_variety", "varietyBoost");
		flag("naist_transparent", "transparentBackground");
		flag("naist_legacy_uc", "legacyUc");
		flag("naist_use_coords", "useCoords");
		$id(r, "naist_model").addEventListener("change", (e) => {
			g().model = e.target.value;
			this.applyModel();
			this.renderCharacters();
			changed();
		});
		$id(r, "naist_size_preset").addEventListener("change", (e) => {
			const match = e.target.value.match(/^(\d+)x(\d+)$/);
			if (match) {
				g().width = Number(match[1]);
				g().height = Number(match[2]);
				$id(r, "naist_width").value = match[1] ?? "";
				$id(r, "naist_height").value = match[2] ?? "";
			}
			changed();
		});
		$id(r, "naist_transport_mode").addEventListener("change", (e) => {
			settings().transport.mode = e.target.value;
			saveSettings();
			this.controller.refreshTransport();
		});
		$id(r, "naist_refresh").addEventListener("click", () => void this.controller.refreshTransport());
		$id(r, "naist_free_only").addEventListener("change", (e) => {
			settings().anlas.freeOnly = e.target.checked;
			changed();
		});
		$id(r, "naist_override_enabled").addEventListener("change", (e) => {
			settings().rawOverride.enabled = e.target.checked;
			changed();
		});
		$id(r, "naist_override_json").addEventListener("input", (e) => {
			settings().rawOverride.json = e.target.value;
			changed();
		});
		$id(r, "naist_inspect_before").addEventListener("change", (e) => {
			settings().inspector.openBeforeSend = e.target.checked;
			saveSettings();
		});
		$id(r, "naist_add_character").addEventListener("click", () => {
			const chars = g().characters;
			if (chars.length >= this.caps().maxCharacters) return;
			const center = defaultCenter(chars.length);
			const slot = {
				prompt: "",
				negative: "",
				x: center.x,
				y: center.y,
				enabled: true
			};
			chars.push(slot);
			this.renderCharacters();
			changed();
		});
		const charContainer = $id(r, "naist_characters");
		const charIndex = (target) => Number(target?.closest(".naist-character")?.dataset.index ?? -1);
		charContainer.addEventListener("input", (e) => {
			const index = charIndex(e.target);
			const slot = g().characters[index];
			if (!slot) return;
			const el = e.target;
			if (el.classList.contains("naist-char-prompt")) slot.prompt = el.value;
			if (el.classList.contains("naist-char-negative")) slot.negative = el.value;
			if (el.classList.contains("naist-char-x")) slot.x = Number(el.value);
			if (el.classList.contains("naist-char-y")) slot.y = Number(el.value);
			if (el.classList.contains("naist-char-enabled")) slot.enabled = el.checked;
			changed();
		});
		charContainer.addEventListener("change", (e) => {
			const el = e.target;
			if (!el.classList.contains("naist-char-enabled")) return;
			const slot = g().characters[charIndex(e.target)];
			if (slot) slot.enabled = el.checked;
			changed();
		});
		charContainer.addEventListener("click", (e) => {
			if (!e.target.classList.contains("naist-char-remove")) return;
			const index = charIndex(e.target);
			if (index < 0) return;
			g().characters.splice(index, 1);
			this.renderCharacters();
			changed();
		});
		$id(r, "naist_inspect").addEventListener("click", () => void this.inspect());
		$id(r, "naist_generate").addEventListener("click", () => void this.generate());
		$id(r, "naist_cancel").addEventListener("click", () => this.controller.cancel());
	}
	onState(state) {
		const r = this.root;
		const selection = state.selection;
		const badge = $id(r, "naist_transport_badge");
		if (!selection) badge.textContent = t("naist.transport.detecting");
		else if (selection.transport.id === "plugin") badge.textContent = selection.health ? t("naist.transport.pluginActive", {
			version: selection.health.version,
			token: t(`naist.token.${selection.health.tokenSource}`)
		}) : t("naist.transport.pluginMissing");
		else badge.textContent = selection.degraded ? t("naist.transport.nativeDegraded") : t("naist.transport.nativeActive");
		badge.classList.toggle("naist-badge-warn", !selection || selection.degraded || selection.transport.id === "plugin" && !selection.health);
		const account = $id(r, "naist_account");
		if (state.accountError) account.textContent = t("naist.account.unavailable", { reason: state.accountError.title });
		else if (state.account.tier > 0 || state.account.anlas > 0) {
			const usage = state.account.usagePercent === null ? "" : t("naist.account.usage", { percent: state.account.usagePercent });
			account.textContent = t("naist.account.summary", {
				anlas: state.account.anlas,
				tier: t(`naist.tier.${state.account.tier}`),
				usage
			});
		} else account.textContent = t("naist.account.loading");
		$id(r, "naist_generate").classList.toggle("disabled", state.busy);
		$id(r, "naist_cancel").classList.toggle("naist-hidden", !state.busy);
		if (selection) this.applyTransportFeatures(selection.transport.features);
		this.scheduleRefresh();
	}
	applyTransportFeatures(features) {
		this.root.querySelectorAll("[data-feature]").forEach((el) => {
			const supported = features[el.dataset.feature] !== false;
			el.classList.toggle("naist-disabled", !supported);
			el.querySelectorAll("input, textarea, select").forEach((input) => {
				input.disabled = !supported;
			});
		});
		this.root.querySelectorAll("[data-hint-for]").forEach((el) => {
			el.textContent = features[el.dataset.hintFor] === false ? t("naist.transport.featureNeedsPlugin") : "";
		});
	}
	scheduleRefresh() {
		if (this.refreshTimer) clearTimeout(this.refreshTimer);
		this.refreshTimer = setTimeout(() => this.refreshPreview(), 250);
	}
	/** Recomputes cost and losses without network access. */
	refreshPreview() {
		const costEl = $id(this.root, "naist_cost");
		const lostEl = $id(this.root, "naist_lost");
		try {
			const prepared = this.controller.prepare();
			this.lastPrepared = prepared;
			const parts = [];
			if (prepared.cost.total === 0) parts.push(t("naist.cost.free"));
			else {
				parts.push(t("naist.cost.paid", {
					total: prepared.cost.total,
					perImage: prepared.cost.perImage,
					billable: prepared.cost.billableSamples
				}));
				if (prepared.cost.notFreeReasons.length) parts.push(t("naist.cost.why", { reasons: prepared.cost.notFreeReasons.map((r) => t(`naist.notFree.${r}`)).join(", ") }));
			}
			for (const change of prepared.clampChanges) parts.push(t(`naist.clamp.${change.kind}`, change));
			if (prepared.blockers.some((b) => b.kind === "free-only")) parts.push(t("naist.cost.blockedFreeOnly"));
			costEl.textContent = parts.join(" · ");
			costEl.classList.toggle("naist-cost-paid", prepared.cost.total > 0);
			lostEl.textContent = prepared.effective.lost.length ? t("naist.transport.lostSummary", { features: prepared.effective.lost.map((l) => t(`naist.lost.${l}`)).join(", ") }) : "";
		} catch (error) {
			this.lastPrepared = null;
			costEl.textContent = (error instanceof NaiError ? error : toNaiError(error)).text;
			lostEl.textContent = "";
		}
	}
	showError(error) {
		const box = $id(this.root, "naist_message");
		box.innerHTML = "";
		box.className = "naist-message naist-message-error";
		const title = document.createElement("b");
		title.textContent = error.title;
		const text = document.createElement("div");
		text.textContent = error.text;
		box.append(title, text);
		const actionKey = error.action !== "none" ? `naist.action.${error.action}` : "";
		if (actionKey) {
			const button = document.createElement("div");
			button.className = "menu_button";
			button.textContent = t(actionKey);
			button.addEventListener("click", () => void this.runAction(error));
			box.append(button);
		}
		toastr.error(error.text, error.title);
	}
	showInfo(message) {
		const box = $id(this.root, "naist_message");
		box.className = "naist-message";
		box.textContent = message;
	}
	async runAction(error) {
		const c = ctx();
		switch (error.action) {
			case "open-inspector":
				await this.inspect();
				break;
			case "enable-free-only":
				settings().anlas.freeOnly = true;
				$id(this.root, "naist_free_only").checked = true;
				saveSettings();
				this.scheduleRefresh();
				break;
			case "retry":
				await this.generate();
				break;
			case "switch-to-v45":
				settings().generation.model = "nai-diffusion-4-5-full";
				$id(this.root, "naist_model").value = "nai-diffusion-4-5-full";
				this.applyModel();
				saveSettings();
				break;
			default: await c.callGenericPopup(t(`naist.help.${error.action}`), c.POPUP_TYPE.TEXT);
		}
	}
	async inspect() {
		try {
			await openInspector(this.controller.prepare());
		} catch (error) {
			this.showError(error instanceof NaiError ? error : toNaiError(error));
		}
	}
	async generate() {
		if (this.controller.state.busy) return;
		let prepared;
		try {
			prepared = this.controller.prepare();
		} catch (error) {
			this.showError(error instanceof NaiError ? error : toNaiError(error));
			return;
		}
		const c = ctx();
		if (settings().inspector.openBeforeSend) {
			if (!await openInspector(prepared, { confirmSend: true })) return;
		} else if (prepared.cost.total > 0 && prepared.cost.total > settings().anlas.confirmAbove && !prepared.blockers.length) {
			if (await c.callGenericPopup(t("naist.cost.confirm", {
				total: prepared.cost.total,
				balance: this.controller.state.account.anlas
			}), c.POPUP_TYPE.CONFIRM) !== c.POPUP_RESULT.AFFIRMATIVE) return;
		}
		this.showInfo(t("naist.panel.generating"));
		try {
			const outcome = await this.controller.generate(prepared);
			this.showInfo(outcome.chatChanged ? t("naist.result.chatChanged", { count: outcome.images }) : t("naist.result.posted", { count: outcome.images }));
		} catch (error) {
			const naiError = error instanceof NaiError ? error : toNaiError(error);
			if (naiError.code === "aborted") {
				this.showInfo(t("naist.result.cancelled"));
				return;
			}
			log.warn("generation failed", naiError.code, naiError.status ?? "");
			this.showError(naiError);
		}
	}
};
//#endregion
//#region src/index.ts
var controller = null;
function mountPanel(studio) {
	const container = document.querySelector("#extensions_settings2") ?? document.querySelector("#extensions_settings");
	if (!container) {
		log.error("extensions settings container not found");
		return;
	}
	if (document.querySelector("#naist_panel")) return;
	new Panel(studio).mount(container);
}
/** hooks.activate */
async function onActivate() {
	if (controller) return;
	const c = ctx();
	setTranslator((text, key) => c.translate(text, key));
	await loadSettings();
	controller = new StudioController({
		fetch: (input, init) => fetch(input, init),
		headers: () => requestHeaders()
	});
	mountPanel(controller);
	controller.refreshTransport();
	log.info(`${MODULE_NAME} activated`);
}
/** hooks.install */
async function onInstall() {
	log.info("installed");
	toastr.info(t("naist.lifecycle.installed"));
}
/** hooks.update */
async function onUpdate() {
	log.info("updated");
}
/** hooks.enable */
async function onEnable() {
	log.info("enabled");
}
/** hooks.disable */
async function onDisable() {
	log.info("disabled");
}
/** hooks.delete */
async function onDelete() {
	log.info("deleted");
}
/** hooks.clean: removes settings and IndexedDB data. */
async function onClean() {
	resetSettings();
	try {
		await clearStorage();
	} catch (error) {
		log.warn("storage cleanup failed", error);
	}
	toastr.info(t("naist.lifecycle.cleaned"));
}
//#endregion
export { onActivate, onClean, onDelete, onDisable, onEnable, onInstall, onUpdate };

//# sourceMappingURL=index.js.map