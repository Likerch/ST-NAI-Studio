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
/**
* Folder of this extension under /scripts/extensions/third-party/, derived from the bundle URL
* (works for global and per-user installs because both use the same URL; RECON §2.14).
*/
function extensionFolder(moduleUrl = import.meta.url) {
	return moduleUrl.match(/\/scripts\/extensions\/third-party\/([^/]+)\//)?.[1] ?? "SillyTavern-NAI-Studio";
}
/**
* Imports a SillyTavern module by URL for the few APIs missing from getContext() (TZ rule 3 allows
* direct imports only then). The URL is kept opaque to the bundler.
*/
async function importHost(path) {
	return await import(
		/* @vite-ignore */
		new URL(path, window.location.origin).href
);
}
function extensionBaseUrl(moduleUrl) {
	return `/scripts/extensions/third-party/${extensionFolder(moduleUrl)}`;
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
	"naist.panel.queued": "Another picture is being drawn: this one waits for its turn…",
	"naist.queue.title": "NovelAI queue",
	"naist.queue.running": "Drawing: {kind}",
	"naist.queue.waiting": "In the queue: {count}",
	"naist.queue.waitingCount": "waiting: {count}",
	"naist.queue.retryIn": "NovelAI is busy, retry in {seconds} s",
	"naist.queue.clear": "Clear the queue",
	"naist.queue.cleared": "Removed from the queue: {count}",
	"naist.queue.kind.picture": "picture",
	"naist.queue.kind.marker": "image marker",
	"naist.queue.kind.auto": "automatic picture",
	"naist.queue.kind.portrait": "DES portrait",
	"naist.queue.kind.sprites": "sprites",
	"naist.queue.kind.comic": "comic",
	"naist.queue.kind.background": "background",
	"naist.queue.kind.tools": "image tool",
	"naist.queue.kind.vibe": "vibe encoding",
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
	"naist.lifecycle.cleaned": "NAI Studio settings and stored data removed.",
	"naist.error.busy.title": "A generation is already running",
	"naist.error.busy.text": "Wait for it to finish or cancel it.",
	"naist.error.no-usable-message.title": "No usable message",
	"naist.error.no-usable-message.text": "The chat has no non-system message to draw from.",
	"naist.error.multimodal-failed.title": "Multimodal captioning failed",
	"naist.error.multimodal-failed.text": "Could not describe the avatar. Check the Image Captioning extension settings, or turn multimodal mode off.",
	"naist.error.prompt-generation-failed.title": "The LLM returned no prompt",
	"naist.error.prompt-generation-failed.text": "Prompt generation produced no text. Check the connected API and the instruct template, then retry.",
	"naist.loader.title": "NAI Studio",
	"naist.loader.message": "Generating an image…",
	"naist.panel.emptyPrompt": "Type a prompt first.",
	"naist.tab.generate": "Generate",
	"naist.tab.prompts": "Prompts",
	"naist.tab.chat": "Chat",
	"naist.tab.takeover": "Replace built-in",
	"naist.takeover.banner": "The built-in Image Generation is enabled: /sd and /imagine still belong to it.",
	"naist.takeover.bannerAction": "Replace",
	"naist.takeover.status": "Built-in Image Generation",
	"naist.takeover.builtInActive": "Enabled. NAI Studio answers only to /nai and its own buttons.",
	"naist.takeover.builtInDisabled": "Disabled. NAI Studio has replaced it.",
	"naist.takeover.commandsBuiltIn": "/sd, /imagine, {{charPrefix}}, the GenerateImage tool, interactive mode and image overswipe stay with the built-in.",
	"naist.takeover.commandsOurs": "/sd, /imagine, /img, /image, {{charPrefix}}, the GenerateImage tool, interactive mode and image overswipe are handled by NAI Studio.",
	"naist.takeover.disable": "Disable built-in and reload",
	"naist.takeover.enable": "Bring the built-in back",
	"naist.takeover.disableConfirm": "The built-in Image Generation will be disabled (it can be enabled again in Manage extensions) and the page will reload. Its settings are migrated first if that has not happened yet. Continue?",
	"naist.takeover.disableOk": "Disable and reload",
	"naist.takeover.enableConfirm": "Enable the built-in Image Generation again? The page will reload and /sd will go back to it.",
	"naist.takeover.migration": "Settings migration",
	"naist.takeover.migrate": "Migrate now",
	"naist.takeover.migratedAt": "Migrated: {date}",
	"naist.takeover.notMigrated": "Not migrated yet.",
	"naist.takeover.reportTitle": "Migration from Image Generation",
	"naist.migration.nothing": "Nothing to migrate.",
	"naist.migration.prefix-moved": "Common prompt prefix moved.",
	"naist.migration.prefix-kept": "Common prefix not moved: NAI Studio already has one.",
	"naist.migration.prefix-default-skipped": "Default Stable Diffusion prefix skipped: NovelAI adds its own quality tags.",
	"naist.migration.negative-moved": "Common negative prompt moved.",
	"naist.migration.negative-kept": "Negative prompt not moved: NAI Studio already has one.",
	"naist.migration.negative-default-skipped": "Default Stable Diffusion negative skipped: NovelAI has its own UC presets.",
	"naist.migration.styles-moved": "Styles moved: {count}.",
	"naist.migration.character-prompts-moved": "Character prompts moved: {count}.",
	"naist.migration.character-prompts-kept": "Character prompts kept as they were in NAI Studio: {count}.",
	"naist.migration.card-prompts-moved": "Character prompts taken from cards: {count}.",
	"naist.migration.templates-moved": "Edited prompt templates moved: {count}.",
	"naist.migration.behaviour-moved": "Switches moved: {names}.",
	"naist.migration.generation-moved": "NovelAI generation settings moved (model {model}).",
	"naist.migration.generation-kept": "Generation settings not moved: NAI Studio already has its own.",
	"naist.migration.free-only-kept": "The built-in Anlas guard was off; NAI Studio keeps free-only mode on.",
	"naist.migration.upscale-not-moved": "\"Upscale by {ratio}\" was not moved: upscaling arrives in a later phase.",
	"naist.migration.generation-other-source": "Generation settings not moved: the built-in used \"{source}\", not NovelAI.",
	"naist.prompts.prefix": "Common prefix",
	"naist.prompts.suffix": "Common suffix",
	"naist.prompts.prefixHint": "Put {prompt} into the prefix to place the scene prompt inside it. SillyTavern macros work.",
	"naist.prompts.styles": "Styles",
	"naist.prompts.styleNone": "— no style —",
	"naist.prompts.styleSave": "Save style",
	"naist.prompts.styleRename": "Rename style",
	"naist.prompts.styleDelete": "Delete style",
	"naist.prompts.stylesHint": "Choosing a style puts its prefix, suffix, undesired content and UC preset into the fields; the Generate tab shows the same undesired content. A style named in an image marker or by Maestro is used instead of the active one for that picture only.",
	"naist.prompts.styleNamePrompt": "Style name:",
	"naist.prompts.styleDeleteConfirm": "Delete style \"{name}\"?",
	"naist.prompts.characterPrompt": "Character prompt",
	"naist.prompts.characterPositive": "Tags added for this character",
	"naist.prompts.characterNegative": "Undesired content for this character",
	"naist.prompts.characterShare": "Store in the character card (travels with export)",
	"naist.prompts.characterNone": "Open a 1:1 chat to edit the character prompt.",
	"naist.prompts.templates": "Prompt templates by mode",
	"naist.prompts.templatesHint": "Instructions sent to the LLM to write an image prompt for each mode. {0} is the trigger text.",
	"naist.prompts.templateReset": "Restore default",
	"naist.prompts.styleNew": "New style from the current fields",
	"naist.prompts.styleRevert": "Revert",
	"naist.prompts.styleChanged": "changed",
	"naist.prompts.styleCommon": "No style is selected: these are the common fields every picture uses. \"New style\" (+) saves them as a style.",
	"naist.prompts.styleEditing": "Fields of the style \"{name}\". Edits apply to pictures right away; \"Save style\" writes them into the style, \"Revert\" brings back the saved ones.",
	"naist.prompts.stylePrefix": "Style prefix",
	"naist.prompts.styleSuffix": "Style suffix",
	"naist.prompts.commonNegative": "Undesired content",
	"naist.prompts.styleNegative": "Undesired content of the style",
	"naist.prompts.negativeMode": "How the undesired content works",
	"naist.prompts.negativeModeReplace": "Replaces the undesired content",
	"naist.prompts.negativeModeAppend": "Added to the base negative",
	"naist.prompts.styleUc": "UC preset of the style",
	"naist.prompts.effectiveNegative": "Undesired content sent to NovelAI",
	"naist.prompts.effectiveEmpty": "(empty)",
	"naist.prompts.baseNegative": "Base negative for all styles",
	"naist.prompts.baseNegativeHint": "Styles in the \"Added to the base negative\" mode put their undesired content after these tags; repeated tags are dropped. Styles that replace the undesired content and the fields without a style do not use it.",
	"naist.prompts.styleDiscardConfirm": "The style \"{name}\" has unsaved changes. Switch anyway and lose them?",
	"naist.prompts.styleOverwriteConfirm": "The style \"{name}\" already exists. Overwrite it with the current fields?",
	"naist.prompts.styleNameTaken": "A style named \"{name}\" already exists.",
	"naist.panel.negativeStyleReplace": "From the style \"{name}\".",
	"naist.panel.negativeStyleAppend": "Base negative + the style \"{name}\".",
	"naist.panel.negativeStyleChanged": "Changed: save the style on the Prompts tab.",
	"naist.mode.-2": "Function tool prompt description",
	"naist.mode.-1": "Chat message template",
	"naist.mode.0": "Character (\"Yourself\")",
	"naist.mode.1": "User (\"Me\")",
	"naist.mode.2": "Scenario (\"The whole story\")",
	"naist.mode.3": "Raw last message",
	"naist.mode.4": "Last message",
	"naist.mode.5": "Portrait (\"Your face\")",
	"naist.mode.7": "Background",
	"naist.mode.8": "Character (multimodal)",
	"naist.mode.9": "User (multimodal)",
	"naist.mode.10": "Portrait (multimodal)",
	"naist.mode.11": "Free mode (LLM-extended)",
	"naist.chat.visibility": "Who sees the result",
	"naist.chat.visibilityHint": "Checked: the image message is visible to the LLM. Unchecked: system message, hidden from the prompt.",
	"naist.initiator.panel": "Panel",
	"naist.initiator.command": "Commands",
	"naist.initiator.wand": "Wand menu",
	"naist.initiator.interactive": "Interactive",
	"naist.initiator.tool": "Function tool",
	"naist.initiator.auto": "Auto generation",
	"naist.chat.author": "Author of visible messages",
	"naist.chat.authorCharacter": "Character",
	"naist.chat.authorUser": "User",
	"naist.chat.confirmAbove": "Ask before spending more than (Anlas)",
	"naist.chat.hidePrompt": "Hide the prompt text, show only the image",
	"naist.chat.prompting": "Prompt generation",
	"naist.chat.refine": "Edit the prompt before every generation",
	"naist.chat.multimodal": "Describe avatars with the multimodal model (\"you\", \"me\", \"face\")",
	"naist.chat.freeExtend": "Let the LLM extend free prompts",
	"naist.chat.snap": "Keep the pixel count when a mode changes the aspect ratio",
	"naist.chat.minimalProcessing": "Minimal processing of LLM replies (keep JSON and punctuation)",
	"naist.chat.llm": "LLM integration",
	"naist.chat.llmHint": "Interactive mode and the function tool work after the built-in Image Generation is replaced.",
	"naist.chat.interactive": "Interactive mode (\"send me a picture of …\")",
	"naist.chat.functionTool": "GenerateImage function tool for the LLM",
	"naist.chat.toolCooldown": "Tool cooldown (seconds)",
	"naist.auto.enabled": "Automatic generation",
	"naist.auto.guardHint": "Never spends Anlas in free-only mode. Paid auto generation needs the switch below and free-only off.",
	"naist.auto.mode": "What to draw",
	"naist.auto.everyMessages": "Every N AI messages (0 = off)",
	"naist.auto.cooldownMessages": "At least N messages apart",
	"naist.auto.keywords": "Keywords (comma-separated)",
	"naist.auto.sceneChange": "On scene change (markers below)",
	"naist.auto.sceneMarkers": "Scene change markers, comma-separated",
	"naist.auto.cooldownSeconds": "At least N seconds apart",
	"naist.auto.allowPaid": "Allow auto generation to spend Anlas",
	"naist.wand.title": "NAI Studio",
	"naist.wand.heading": "Send me a picture of:",
	"naist.wand.free": "Free prompt…",
	"naist.wand.freePrompt": "Image prompt:",
	"naist.message.generate": "Generate an image (NAI Studio)",
	"naist.card.portrait": "NAI Studio: full-body portrait",
	"naist.card.face": "NAI Studio: face portrait",
	"naist.command.trigger": "you, me, scene, last, raw_last, face, background — or free text",
	"naist.command.returns": "path of the generated image, or an empty string on failure",
	"naist.command.help": "Generates an image with NovelAI (NAI Studio) and posts it to the chat unless quiet=true. Accepts the built-in /sd arguments and NovelAI-specific ones.",
	"naist.command.invalidArgs": "NAI Studio ignored invalid arguments: {args}",
	"naist.command.styleMissing": "Style \"{name}\" not found",
	"naist.command.styleReturns": "name of the active style",
	"naist.command.styleName": "style name",
	"naist.command.styleHelp": "Selects a NAI Studio style; without an argument returns the active one.",
	"naist.command.sourceFixed": "NAI Studio always generates with NovelAI.",
	"naist.command.sourceReturns": "always \"novel\"",
	"naist.command.sourceName": "ignored",
	"naist.command.sourceHelp": "Kept for script compatibility: the source is always NovelAI.",
	"naist.command.arg.quiet": "do not post the image to the chat",
	"naist.command.arg.gallery": "save into the character gallery folder",
	"naist.command.arg.negative": "additional undesired content",
	"naist.command.arg.extend": "let the LLM extend a free prompt",
	"naist.command.arg.edit": "edit the prompt before generating",
	"naist.command.arg.multimodal": "describe the avatar with the multimodal model",
	"naist.command.arg.snap": "keep the pixel count for portrait/landscape modes",
	"naist.command.arg.processing": "LLM reply processing: standard or minimal",
	"naist.command.arg.seed": "seed (-1 = random)",
	"naist.command.arg.width": "width",
	"naist.command.arg.height": "height",
	"naist.command.arg.steps": "steps",
	"naist.command.arg.cfg": "guidance",
	"naist.command.arg.cfgrescale": "CFG rescale",
	"naist.command.arg.samples": "number of images",
	"naist.command.arg.model": "model id or alias (v5, v5-curated, v4.5, v4, v3, furry)",
	"naist.command.arg.sampler": "sampler",
	"naist.command.arg.scheduler": "noise schedule",
	"naist.command.arg.uc": "UC preset",
	"naist.command.arg.quality": "quality tags preset",
	"naist.command.arg.smea": "SMEA (V3)",
	"naist.command.arg.dyn": "SMEA DYN (V3)",
	"naist.command.arg.variety": "Variety Boost",
	"naist.command.arg.decrisper": "Decrisper (V3)",
	"naist.command.arg.transparent": "transparent background (V5)",
	"naist.command.arg.skip": "ignored (CLIP skip has no meaning for NovelAI)",
	"naist.command.arg.vae": "ignored (not applicable to NovelAI)",
	"naist.command.arg.upscaler": "ignored (not applicable to NovelAI)",
	"naist.command.arg.hires": "ignored (not applicable to NovelAI)",
	"naist.command.arg.scale": "ignored (upscaling comes in a later phase)",
	"naist.command.arg.denoise": "ignored (not applicable to NovelAI)",
	"naist.command.arg.2ndpass": "ignored (not applicable to NovelAI)",
	"naist.command.arg.faces": "ignored (not applicable to NovelAI)",
	"naist.tool.displayName": "Generate Image (NAI Studio)",
	"naist.tool.running": "Generating an image with NovelAI…",
	"naist.macro.charPrefix": "Character's positive image prompt prefix (NAI Studio)",
	"naist.macro.charNegativePrefix": "Character's negative image prompt prefix (NAI Studio)",
	"naist.refine.title": "Review and edit the prompt",
	"naist.refine.hint": "Cancel stops the generation.",
	"naist.refine.negative": "Additional undesired content",
	"naist.refine.resolution": "Use the saved resolution ({resolution})",
	"naist.refine.continue": "Continue",
	"naist.command.arg.at": "character offset in the message text (default: end)",
	"naist.command.arg.message": "message id (default: last message)",
	"naist.command.insertHelp": "Generates an image and inserts it inline into a message at a position.",
	"naist.command.insertReturns": "id of the inserted image, or an empty string",
	"naist.command.imagesHelp": "Shows or hides inline images of this chat; reading mode hides them everywhere.",
	"naist.command.imagesArg": "show, hide, toggle, reading-on, reading-off",
	"naist.command.imagesReturns": "shown, hidden or reading",
	"naist.command.galleryHelp": "Opens the NAI Studio gallery.",
	"naist.error.image-not-found.title": "Image not found",
	"naist.error.image-not-found.text": "The image or its message no longer exists. Reload the chat.",
	"naist.error.image-load-failed.title": "Image could not be loaded",
	"naist.error.image-load-failed.text": "Neither the browser copy nor the server file is available.",
	"naist.error.feature-unavailable.title": "Not available on this transport",
	"naist.error.feature-unavailable.text": "\"{feature}\" needs the NAI Studio server plugin. Install it and restart SillyTavern.",
	"naist.gallery.search": "Search prompt, tags, seed…",
	"naist.gallery.allModels": "All models",
	"naist.gallery.allCharacters": "All characters",
	"naist.gallery.allChats": "All chats",
	"naist.gallery.from": "From",
	"naist.gallery.to": "To",
	"naist.gallery.newest": "Newest first",
	"naist.gallery.oldest": "Oldest first",
	"naist.gallery.favoritesOnly": "Favorites only",
	"naist.gallery.selectAll": "Select all",
	"naist.gallery.compare": "Compare two",
	"naist.gallery.compareHint": "Select exactly two images to compare.",
	"naist.gallery.delete": "Delete selected",
	"naist.gallery.deleteConfirm": "Delete {count} image(s) from the gallery?",
	"naist.gallery.deleteFiles": "Also delete their files on the server (images in chats keep their browser copy)",
	"naist.gallery.deleted": "Deleted: {count}, server files: {files}",
	"naist.gallery.favorite": "Favorite",
	"naist.gallery.repeat": "Repeat with a change",
	"naist.gallery.count": "{shown} of {total}, selected {selected}",
	"naist.gallery.usage": "Browser storage: {used} of {quota}",
	"naist.images.inline": "Images in messages",
	"naist.images.inlineHint": "Inline images are inserted with the image button of a message (or in edit mode at the cursor). The text keeps a [nai:img:…] marker, so editing never breaks them.",
	"naist.images.saveToServer": "Also save to /user/images (needed for chat export and other devices)",
	"naist.images.keepBrowserCopy": "Keep a copy in the browser (IndexedDB)",
	"naist.images.llmText": "Images in the LLM prompt",
	"naist.images.llmDescribe": "Short description: [image: …]",
	"naist.images.llmRemove": "Remove",
	"naist.images.variationStrength": "Variation strength",
	"naist.images.variationNoise": "Variation noise",
	"naist.images.hideChat": "Hide images in this chat",
	"naist.images.showChat": "Show images in this chat",
	"naist.images.readingMode": "Reading mode (no images anywhere)",
	"naist.images.gallery": "Gallery",
	"naist.images.galleryEnabled": "Record every generation in the gallery",
	"naist.images.openGallery": "Open gallery",
	"naist.images.png": "PNG metadata",
	"naist.images.pngHint": "Drop a NovelAI PNG or WebP onto this panel to load its parameters.",
	"naist.images.stripMetadata": "Strip metadata when saving (server and disk)",
	"naist.images.importPng": "Load parameters from PNG…",
	"naist.images.importNone": "No NovelAI parameters found in this file.",
	"naist.images.importDone": "Parameters loaded ({count} fields, model {model}).",
	"naist.inline.insert": "Insert an image into this message (NAI Studio)",
	"naist.inline.insertHere": "Insert an image at the cursor (NAI Studio)",
	"naist.inline.insertTitle": "Insert an image",
	"naist.inline.insertOk": "Generate and insert",
	"naist.inline.insertedInEdit": "Image inserted. Save the message to keep it.",
	"naist.inline.mode": "What to draw",
	"naist.inline.modeFree": "My prompt",
	"naist.inline.modeText": "From the text (LLM writes the prompt)",
	"naist.inline.prompt": "Prompt",
	"naist.inline.promptHint": "Selected text is pre-filled. For trigger modes the prompt is not needed.",
	"naist.inline.width": "Width",
	"naist.inline.unit": "Unit",
	"naist.inline.align": "Alignment",
	"naist.inline.alignCenter": "Center",
	"naist.inline.alignLeft": "Left",
	"naist.inline.alignRight": "Right",
	"naist.inline.radius": "Corner radius (px)",
	"naist.inline.layout": "Several images in a row",
	"naist.inline.layoutGrid": "Grid",
	"naist.inline.layoutCarousel": "Carousel",
	"naist.inline.layoutList": "List",
	"naist.inline.wrap": "Text wraps around",
	"naist.inline.border": "Border",
	"naist.inline.spoilerOption": "Spoiler (blurred until clicked)",
	"naist.inline.caption": "Caption",
	"naist.inline.altText": "Alt text",
	"naist.inline.alt": "Generated image",
	"naist.inline.displayTitle": "Display options",
	"naist.inline.displayOk": "Apply",
	"naist.inline.editTitle": "Redo with an edited prompt",
	"naist.inline.editOk": "Generate",
	"naist.inline.randomSeed": "Random seed",
	"naist.inline.missing": "[image missing]",
	"naist.inline.spoiler": "Spoiler — click to show",
	"naist.inline.hiddenChip": "image hidden",
	"naist.inline.prev": "Previous version",
	"naist.inline.next": "Next version",
	"naist.inline.regenerate": "Regenerate here (new seed)",
	"naist.inline.variation": "Variation (same seed + noise)",
	"naist.inline.edit": "Redo with an edited prompt",
	"naist.inline.display": "Display options",
	"naist.inline.lightbox": "Open with all parameters",
	"naist.inline.delete": "Delete this version",
	"naist.inline.deleteConfirm": "Delete this image version? The last version removes the image from the message.",
	"naist.lightbox.copyPrompt": "Copy prompt",
	"naist.lightbox.copySeed": "Copy seed",
	"naist.lightbox.copied": "Copied",
	"naist.lightbox.copyFailed": "Could not copy to the clipboard",
	"naist.lightbox.background": "Chat background",
	"naist.lightbox.backgroundDone": "Set as the background of this chat.",
	"naist.lightbox.avatar": "Character avatar",
	"naist.lightbox.avatarConfirm": "Replace the avatar of {name} with this image? The old avatar file is overwritten.",
	"naist.lightbox.avatarDone": "Avatar of {name} updated.",
	"naist.lightbox.avatarNoCharacter": "Open a 1:1 chat with the character first.",
	"naist.lightbox.save": "Save to disk",
	"naist.lightbox.close": "Close",
	"naist.meta.scenePrompt": "Scene prompt",
	"naist.meta.prompt": "Sent prompt",
	"naist.meta.negative": "Undesired content",
	"naist.meta.sourcePrompt": "Original prompt",
	"naist.meta.model": "Model",
	"naist.meta.seed": "Seed",
	"naist.meta.size": "Size",
	"naist.meta.steps": "Steps",
	"naist.meta.scale": "Guidance",
	"naist.meta.cfgRescale": "CFG rescale",
	"naist.meta.sampler": "Sampler / schedule",
	"naist.meta.presets": "Quality / UC preset",
	"naist.meta.requestType": "Request",
	"naist.meta.cost": "Anlas",
	"naist.meta.created": "Created",
	"naist.meta.characters": "Characters",
	"naist.tab.images": "Images",
	"naist.wand.gallery": "Gallery",
	"naist.wand.toggleImages": "Show / hide images in this chat",
	"naist.wand.readingMode": "Reading mode (no images)",
	"naist.card.button": "NAI Studio: passport and scene",
	"naist.card.composer": "NAI Studio: scene with this character",
	"naist.card.passport": "NAI Studio: appearance passport",
	"naist.command.sceneHelp": "Assembles a scene from the last message (who is in the frame, poses, positions) and opens the composer; edit=false generates right away.",
	"naist.command.sceneReturns": "image path or inline image id, or an empty string",
	"naist.command.arg.sceneEdit": "open the composer before generating (default true)",
	"naist.command.arg.sceneTarget": "message (new message) or inline (into the last message)",
	"naist.command.arg.sceneText": "text to analyze instead of the last message",
	"naist.scene.title": "Scenes and characters",
	"naist.scene.hint": "The passport is a character's permanent tags (kept in the card). The composer assembles a scene: who is in the frame, poses, positions, personal undesired content.",
	"naist.scene.openComposer": "Scene composer",
	"naist.scene.charPassport": "Character passport",
	"naist.scene.personaPassport": "My persona passport",
	"naist.scene.poseLibrary": "Pose library",
	"naist.scene.llmBase": "Automatic scene: the LLM describes the location",
	"naist.wand.scene": "Scene (composer)…",
	"naist.composer.title": "Scene composer",
	"naist.composer.auto": "From the last message",
	"naist.composer.add": "Add to the scene…",
	"naist.composer.full": "Model limit: {max} characters",
	"naist.composer.persona": "you",
	"naist.composer.relayout": "Arrange automatically",
	"naist.composer.limit": "{count} of {max}",
	"naist.composer.base": "Scene (location, action, mood)",
	"naist.composer.basePlaceholder": "tavern, night, warm lighting",
	"naist.composer.llmBase": "Let the LLM describe the location",
	"naist.composer.framing": "Framing",
	"naist.composer.camera": "Camera angle",
	"naist.composer.distance": "Distance",
	"naist.composer.useCoords": "Use positions",
	"naist.composer.gridHint": "V4/V4.5: positions snap to the 5×5 grid. Drag the numbers.",
	"naist.composer.freeHint": "V5: free positions. Drag the numbers.",
	"naist.composer.noPositions": "This model has no character positions; everyone goes into one prompt.",
	"naist.composer.empty": "Nobody in the scene yet: use \"From the last message\" or add characters.",
	"naist.composer.noPassport": "no passport",
	"naist.composer.inFrame": "in frame",
	"naist.composer.up": "Move up",
	"naist.composer.down": "Move down",
	"naist.composer.editPassport": "Edit passport",
	"naist.composer.remove": "Remove from the scene",
	"naist.composer.pose": "Pose",
	"naist.composer.poseTags": "Extra pose tags",
	"naist.composer.outfit": "Outfit",
	"naist.composer.outfitDefault": "From the passport",
	"naist.composer.negative": "Extra undesired content for this scene",
	"naist.composer.pair": "Pair pose",
	"naist.composer.noPair": "No pair pose",
	"naist.composer.target": "Result",
	"naist.composer.targetMessage": "New message",
	"naist.composer.targetInline": "Into the last message",
	"naist.composer.allowNsfw": "Allow the NSFW layer of passports",
	"naist.composer.basePrompt": "Base",
	"naist.composer.warnNoPassport": "Without a passport (character prompt is used): {names}",
	"naist.composer.warnDropped": "Not sent, over the model limit of {max}: {names}",
	"naist.composer.generate": "Generate",
	"naist.passport.title": "Appearance passport: {name}",
	"naist.passport.hint": "Danbooru tags in English. Kept in the character card and travels with export.",
	"naist.passport.outfits": "Outfits",
	"naist.passport.outfitsHint": "Named outfits replace the clothing slot when chosen.",
	"naist.passport.outfitName": "Name",
	"naist.passport.outfitTags": "Tags",
	"naist.passport.outfitDefault": "Outfit {n}",
	"naist.passport.addOutfit": "Add outfit",
	"naist.passport.activeOutfit": "Active outfit",
	"naist.passport.clothingSlot": "Clothing slot",
	"naist.passport.states": "States",
	"naist.passport.newState": "Custom state name",
	"naist.passport.addState": "Add",
	"naist.passport.nsfw": "NSFW layer",
	"naist.passport.nsfwHint": "Used only when \"Allow the NSFW layer\" is on in the composer.",
	"naist.passport.negative": "Personal undesired content",
	"naist.passport.pose": "Default pose",
	"naist.passport.poseTags": "Extra pose tags",
	"naist.passport.noPose": "No pose",
	"naist.passport.position": "Default position (x, y from 0 to 1)",
	"naist.passport.remove": "Remove",
	"naist.passport.save": "Save",
	"naist.passport.saved": "Passport of {name} saved.",
	"naist.poseLib.title": "Pose library",
	"naist.poseLib.favoritesHint": "Checked poses are shown first as favorites.",
	"naist.poseLib.custom": "My poses",
	"naist.poseLib.customHint": "Keywords (comma-separated, any language) let the automatic scene pick the pose from the text.",
	"naist.poseLib.name": "Name",
	"naist.poseLib.tags": "Tags",
	"naist.poseLib.keywords": "Keywords",
	"naist.poseLib.add": "Add pose",
	"naist.poseLib.done": "Done",
	"naist.pose.favorites": "Favorites",
	"naist.slot.base": "Base (gender, age, species, race)",
	"naist.slot.hair": "Hair",
	"naist.slot.eyes": "Eyes",
	"naist.slot.body": "Body",
	"naist.slot.skin": "Skin and marks",
	"naist.slot.clothing": "Clothing",
	"naist.slot.accessories": "Accessories",
	"naist.slot.style": "Art style",
	"naist.state.wet": "Wet",
	"naist.state.messy": "Disheveled",
	"naist.state.tears": "In tears",
	"naist.state.blush": "Embarrassed",
	"naist.state.injured": "Injured",
	"naist.state.sleepy": "Sleepy",
	"naist.state.angry": "Angry",
	"naist.state.happy": "Happy",
	"naist.poseCat.standing": "Standing",
	"naist.poseCat.sitting": "Sitting",
	"naist.poseCat.lying": "Lying",
	"naist.poseCat.kneeling": "Kneeling",
	"naist.poseCat.back": "From behind",
	"naist.poseCat.gaze": "Gaze",
	"naist.poseCat.arms": "Arms and hands",
	"naist.poseCat.action": "Action",
	"naist.pose.standing": "Standing",
	"naist.pose.contrapposto": "Contrapposto",
	"naist.pose.hands_on_hips": "Hands on hips",
	"naist.pose.leaning_wall": "Leaning against a wall",
	"naist.pose.walking": "Walking",
	"naist.pose.sitting": "Sitting",
	"naist.pose.sitting_chair": "Sitting on a chair",
	"naist.pose.sitting_floor": "Sitting on the floor",
	"naist.pose.crossed_legs": "Legs crossed",
	"naist.pose.seiza": "Seiza",
	"naist.pose.squatting": "Squatting",
	"naist.pose.lying": "Lying",
	"naist.pose.on_back": "On the back",
	"naist.pose.on_stomach": "On the stomach",
	"naist.pose.on_side": "On the side",
	"naist.pose.sleeping": "Sleeping",
	"naist.pose.kneeling": "Kneeling",
	"naist.pose.on_one_knee": "On one knee",
	"naist.pose.from_behind": "From behind",
	"naist.pose.looking_back": "Looking back",
	"naist.pose.looking_at_viewer": "Looking at the viewer",
	"naist.pose.looking_away": "Looking away",
	"naist.pose.looking_up": "Looking up",
	"naist.pose.looking_down": "Looking down",
	"naist.pose.crossed_arms": "Arms crossed",
	"naist.pose.arms_up": "Arms up",
	"naist.pose.arms_behind_back": "Arms behind the back",
	"naist.pose.hand_on_chin": "Hand on chin",
	"naist.pose.waving": "Waving",
	"naist.pose.peace_sign": "Peace sign",
	"naist.pose.running": "Running",
	"naist.pose.jumping": "Jumping",
	"naist.pose.leaning_forward": "Leaning forward",
	"naist.pose.stretching": "Stretching",
	"naist.pose.reading": "Reading",
	"naist.pose.eating": "Eating",
	"naist.pose.drinking": "Drinking",
	"naist.pose.fighting_stance": "Fighting stance",
	"naist.framing.auto": "Automatic",
	"naist.framing.portrait": "Portrait",
	"naist.framing.upper_body": "Upper body",
	"naist.framing.cowboy_shot": "Cowboy shot (to the thighs)",
	"naist.framing.full_body": "Full body",
	"naist.camera.auto": "Automatic",
	"naist.camera.from_above": "From above",
	"naist.camera.from_below": "From below",
	"naist.camera.from_side": "From the side",
	"naist.camera.straight_on": "Straight on",
	"naist.camera.dutch_angle": "Dutch angle",
	"naist.camera.pov": "POV",
	"naist.distance.auto": "Automatic",
	"naist.distance.close_up": "Close-up",
	"naist.distance.wide_shot": "Wide shot",
	"naist.distance.very_wide_shot": "Very wide shot",
	"naist.pair.hug": "Hug (1 hugs 2)",
	"naist.pair.hug_from_behind": "Hug from behind",
	"naist.pair.holding_hands": "Holding hands",
	"naist.pair.back_to_back": "Back to back",
	"naist.pair.princess_carry": "Princess carry (1 carries 2)",
	"naist.pair.piggyback": "Piggyback (1 carries 2)",
	"naist.pair.headpat": "Headpat (1 pats 2)",
	"naist.pair.high_five": "High five",
	"naist.pair.face_to_face": "Face to face",
	"naist.pair.eye_contact": "Eye contact",
	"naist.pair.sitting_on_lap": "Sitting on the lap (1 on 2)",
	"naist.pair.dancing": "Dancing together",
	"naist.pair.fighting": "Fighting",
	"naist.panel.characterOverLimit": "Over the model limit ({max}): this slot is not sent. Switch to V5 for up to 32 characters.",
	"naist.composer.overLimit": "over the model limit",
	"naist.command.vibesHelp": "Opens the vibe library (reference images and sets).",
	"naist.tool.director": "Director Tools",
	"naist.tool.inpaint": "Inpaint",
	"naist.tool.img2img": "Enhance (img2img)",
	"naist.tool.upscale": "Upscale ×2",
	"naist.tool.upscaling": "Upscaling with NovelAI…",
	"naist.tools.title": "Image tools",
	"naist.tools.director": "Director Tools",
	"naist.tools.directorHint": "Line art, sketch, colorize, emotion, declutter, background removal.",
	"naist.tools.inpaint": "Inpaint",
	"naist.tools.inpaintHint": "Paint a mask and redraw only that part.",
	"naist.tools.outpaint": "Outpaint",
	"naist.tools.outpaintHint": "Grow the canvas and let NovelAI fill the new areas.",
	"naist.tools.upscale": "Upscale ×2",
	"naist.tools.upscaleHint": "NovelAI upscaler; always paid (1–4 Anlas).",
	"naist.tools.enhance": "Enhance",
	"naist.tools.enhanceHint": "Scale up and redraw with img2img: more detail, same composition.",
	"naist.tools.needsPlugin": "needs the server plugin",
	"naist.tools.confirmCost": "{what} will spend {cost} Anlas (balance: {balance}). Continue?",
	"naist.director.title": "Director Tools",
	"naist.director.hint": "The image is sent as {width}×{height}. The result becomes a new swipe; the original stays.",
	"naist.director.lineart": "Line art",
	"naist.director.lineartHint": "Clean line art from the picture.",
	"naist.director.sketch": "Sketch",
	"naist.director.sketchHint": "A pencil sketch of the picture.",
	"naist.director.colorize": "Colorize",
	"naist.director.colorizeHint": "Colors a sketch or line art; a prompt guides the palette.",
	"naist.director.emotion": "Emotion",
	"naist.director.emotionHint": "Changes the facial expression and keeps the rest.",
	"naist.director.declutter": "Declutter",
	"naist.director.declutterHint": "Removes text, speech bubbles and overlays.",
	"naist.director.declutter-keep-bubbles": "Declutter (keep bubbles)",
	"naist.director.declutter-keep-bubblesHint": "Removes text and overlays but keeps empty speech bubbles.",
	"naist.director.bg-removal": "Background removal",
	"naist.director.bg-removalHint": "Transparent background; the only paid Director tool.",
	"naist.director.costPaid": "{cost} Anlas",
	"naist.director.costFree": "free on Opus",
	"naist.director.prompt": "Extra prompt (optional)",
	"naist.director.promptPlaceholder": "e.g. blue dress, sunset light",
	"naist.director.defry": "Defry (keeps more of the original)",
	"naist.director.run": "Apply",
	"naist.director.running": "{tool}: working…",
	"naist.emotion.neutral": "Neutral",
	"naist.emotion.happy": "Happy",
	"naist.emotion.sad": "Sad",
	"naist.emotion.angry": "Angry",
	"naist.emotion.scared": "Scared",
	"naist.emotion.surprised": "Surprised",
	"naist.emotion.tired": "Tired",
	"naist.emotion.excited": "Excited",
	"naist.emotion.nervous": "Nervous",
	"naist.emotion.thinking": "Thinking",
	"naist.emotion.confused": "Confused",
	"naist.emotion.shy": "Shy",
	"naist.emotion.disgusted": "Disgusted",
	"naist.emotion.smug": "Smug",
	"naist.emotion.bored": "Bored",
	"naist.emotion.laughing": "Laughing",
	"naist.emotion.irritated": "Irritated",
	"naist.emotion.aroused": "Aroused",
	"naist.emotion.embarrassed": "Embarrassed",
	"naist.emotion.worried": "Worried",
	"naist.emotion.love": "Love",
	"naist.emotion.determined": "Determined",
	"naist.emotion.hurt": "Hurt",
	"naist.emotion.playful": "Playful",
	"naist.enhance.title": "Enhance",
	"naist.enhance.hint": "The image is scaled up and redrawn with img2img. Low strength keeps the composition; noise adds new detail.",
	"naist.enhance.scale": "Scale",
	"naist.enhance.strength": "Strength",
	"naist.enhance.noise": "Noise",
	"naist.enhance.size": "{from} → {to}",
	"naist.enhance.freeNote": "With \"free only\" the size is reduced to 1 MP so Opus stays free.",
	"naist.enhance.run": "Enhance",
	"naist.inpaint.title": "Inpaint and outpaint",
	"naist.inpaint.brush": "Brush",
	"naist.inpaint.eraser": "Eraser",
	"naist.inpaint.size": "Size",
	"naist.inpaint.invert": "Invert",
	"naist.inpaint.clear": "Clear",
	"naist.inpaint.hint": "Paint over what should be redrawn. Describe the new content in the prompt.",
	"naist.inpaint.strength": "Strength",
	"naist.inpaint.keepOriginal": "Keep the original outside the mask",
	"naist.inpaint.fallback": "This model has no inpainting; {model} will do the work.",
	"naist.inpaint.run": "Generate",
	"naist.inpaint.emptyMask": "The mask is empty: paint the area to redraw.",
	"naist.outpaint.hint": "Pixels to add on each side (rounded to 64). The new areas are masked automatically.",
	"naist.outpaint.left": "Left",
	"naist.outpaint.right": "Right",
	"naist.outpaint.top": "Top",
	"naist.outpaint.bottom": "Bottom",
	"naist.outpaint.size": "New size: {width}×{height}",
	"naist.outpaint.tooLarge": "{width}×{height} is larger than NovelAI accepts.",
	"naist.progress.streaming": "Generating (live preview)",
	"naist.progress.estimating": "Generating…",
	"naist.progress.step": "Step {step} of {steps}",
	"naist.progress.pluginHint": "Install the NAI Studio server plugin to see the image appear step by step.",
	"naist.progress.enable": "Live preview while generating (plugin)",
	"naist.vibes.title": "Vibe library",
	"naist.vibes.open": "Vibe library…",
	"naist.vibes.panelHint": "Reference images that pass their style and mood into generations. Sets can be bound to a character, chat or style.",
	"naist.vibes.status.ok": "Vibes work for {model}.",
	"naist.vibes.status.feature-flag-off": "{model}: NovelAI has not enabled vibes for this model yet. They will be skipped until it does.",
	"naist.vibes.status.not-supported": "{model} does not support vibes.",
	"naist.vibes.status.transport": "{model}: vibes need the NAI Studio server plugin.",
	"naist.vibes.cacheHint": "V4/V4.5 encode each image once per model and strength of information (2 Anlas); the result is cached and reused for free.",
	"naist.vibes.active": "Active now: {count} ({names})",
	"naist.vibes.images": "Images",
	"naist.vibes.add": "Add images…",
	"naist.vibes.empty": "No images yet. Add files or drop them here.",
	"naist.vibes.remove": "Remove",
	"naist.vibes.confirmEncoding": "Ask before paid encoding",
	"naist.vibes.sets": "Sets",
	"naist.vibes.addSet": "Add a set",
	"naist.vibes.setDefault": "Set {n}",
	"naist.vibes.removeSet": "Remove the set",
	"naist.vibes.enabled": "On",
	"naist.vibes.global": "Everywhere",
	"naist.vibes.bindCharacter": "This character",
	"naist.vibes.bindChat": "This chat",
	"naist.vibes.bindStyle": "Current style",
	"naist.vibes.strength": "Strength",
	"naist.vibes.information": "Information",
	"naist.vibes.encoding": "Vibe encoding",
	"naist.vibes.encoded": "Encoded {count} vibe(s) for {cost} Anlas; next time they are free.",
	"naist.vibes.missing": "The image of vibe \"{name}\" is missing; it was skipped.",
	"naist.vibes.notice.feature-flag-off": "{count} vibe(s) skipped: NovelAI has not enabled vibes for this model yet.",
	"naist.vibes.notice.not-supported": "{count} vibe(s) skipped: this model does not support vibes.",
	"naist.vibes.notice.transport": "{count} vibe(s) skipped: vibes need the server plugin.",
	"naist.vibes.notice.ok": "Vibes are active.",
	"naist.vibes.skipped.free-only": "{count} vibe(s) skipped: encoding is paid and \"free only\" is on.",
	"naist.vibes.skipped.declined": "{count} vibe(s) skipped: encoding was declined.",
	"naist.vibes.skipped.no-plugin": "{count} vibe(s) skipped: encoding needs the server plugin.",
	"naist.outpaint.freeSize": "(free only: sent as {width}×{height})",
	"naist.card.sprites": "NAI Studio: Expressions sprites",
	"naist.command.translateHelp": "Translates a Russian prompt to English tags with your current LLM (glossary and cache applied).",
	"naist.command.translateReturns": "the English prompt",
	"naist.command.arg.translateText": "text to translate",
	"naist.command.locationHelp": "Sets the current location for scene continuity; without a name returns the current one.",
	"naist.command.locationReturns": "the current location",
	"naist.command.arg.locationName": "location name",
	"naist.command.spritesHelp": "Opens the Expressions sprite generator for the current character.",
	"naist.command.comicHelp": "Opens the comic page builder (V5).",
	"naist.error.translation-failed.title": "Translation failed",
	"naist.error.translation-failed.text": "The LLM did not return a usable English prompt: {message}",
	"naist.error.import-failed.title": "Import failed",
	"naist.error.import-failed.text": "{reason}",
	"naist.translate.glossary": "Glossary",
	"naist.translate.glossaryPlaceholder": "one per line: russian = english",
	"naist.translate.glossaryHint": "Glossary terms are replaced before the LLM sees the text and are always translated the same way.",
	"naist.tags.title": "Prompt helpers",
	"naist.tags.autocomplete": "Tag suggestions while typing",
	"naist.tags.remote": "Also ask NovelAI's tag suggestions (plugin)",
	"naist.tags.warnUnknown": "Warn about unknown tags",
	"naist.tags.unknown": "Unknown tags: {tags}",
	"naist.tokens.enable": "Token counter",
	"naist.tokens.prompt": "Prompt",
	"naist.tokens.negative": "Undesired",
	"naist.tokens.text": "Text in the image: {count} tokens (part of the prompt)",
	"naist.tokens.over": "Longer than {limit} tokens: NovelAI will cut the rest off.",
	"naist.tokens.t5Unicode": "V4/V4.5 (T5) cannot read these characters: {chars}",
	"naist.tokens.approximate": "Approximate: the tokenizer file needs the plugin 0.3.0 or the CORS proxy.",
	"naist.tokens.autoText": "V5: quoted phrases become text in the image (as on the NovelAI site)",
	"naist.weights.title": "Weights",
	"naist.weights.auto": "Convert numeric weights to braces when switching to V3",
	"naist.weights.hint": "Ctrl+↑ / Ctrl+↓ in a prompt field changes the weight of the tag under the cursor: 1.05::tag:: on V4+, curly or square brackets on V3.",
	"naist.weights.converted": "Numeric weights were converted to braces for V3.",
	"naist.weights.convertedLossy": "Weights converted for V3; V3 cannot express these and they were removed: {dropped}",
	"naist.continuity.title": "Scene continuity",
	"naist.continuity.hint": "The last picture of a location becomes the base (img2img) or a vibe of the next one there, so the place stays the same. Locations are stored in the chat.",
	"naist.continuity.enabled": "Use the location image",
	"naist.continuity.mode": "As",
	"naist.continuity.modeImg2img": "img2img base (free)",
	"naist.continuity.modeVibe": "vibe (V4/V4.5 encoding costs 2 Anlas once)",
	"naist.continuity.strength": "img2img strength",
	"naist.continuity.autoBind": "New pictures update the location",
	"naist.continuity.current": "Current location",
	"naist.continuity.currentPlaceholder": "e.g. tavern",
	"naist.continuity.bind": "Bind the last image",
	"naist.continuity.forget": "Forget the location",
	"naist.continuity.bound": "\"{name}\" now uses the last image of the chat.",
	"naist.continuity.boundTo": "Reference: {path}",
	"naist.continuity.unbound": "No image bound yet",
	"naist.continuity.known": "Locations: {names}",
	"naist.continuity.needName": "Type the location name first.",
	"naist.continuity.noImage": "There is no image in this chat yet.",
	"naist.sprites.title": "Expressions sprites",
	"naist.sprites.panelHint": "A full emotion set for the built-in Expressions extension: files named as it expects, uploaded to the character folder.",
	"naist.sprites.open": "Sprite generator…",
	"naist.sprites.noCharacter": "Open a chat with one character first.",
	"naist.sprites.target": "Character: {name} · folder: {folder}",
	"naist.sprites.appearance": "Appearance: {tags}",
	"naist.sprites.modeDirector": "One base + Director emotions",
	"naist.sprites.modeSeed": "Every sprite with one seed",
	"naist.sprites.modeDirectorHint": "The most consistent: a neutral sprite first, then Director \"emotion\" on it where an emotion matches and img2img from it for the rest. Free on Opus.",
	"naist.sprites.modeSeedHint": "Each sprite is drawn from the appearance with the same seed; on V5 it can have a transparent background.",
	"naist.sprites.transparent": "Transparent background (V5, one-seed mode)",
	"naist.sprites.labels": "Emotions",
	"naist.sprites.all": "All",
	"naist.sprites.none": "None",
	"naist.sprites.count": "{count} selected",
	"naist.sprites.run": "Generate and upload",
	"naist.sprites.close": "Close",
	"naist.sprites.finished": "{done} of {total} sprites uploaded to \"{folder}\".",
	"naist.sprites.how.base": "base sprite",
	"naist.sprites.how.director": "Director emotion",
	"naist.sprites.how.img2img": "img2img from the base",
	"naist.sprites.how.seed": "same seed",
	"naist.comic.title": "Comic page (V5)",
	"naist.comic.panelHint": "Panels with their own prompts and speech, drawn one by one and assembled into a page.",
	"naist.comic.open": "Comic builder…",
	"naist.comic.hint": "NovelAI has no multi-panel mode: every panel is its own generation (free at about 1 MP) at the panel shape. Text lines go to the V5 text block and are counted separately.",
	"naist.comic.pageWidth": "Page width",
	"naist.comic.pageHeight": "Page height",
	"naist.comic.gutter": "Gutter",
	"naist.comic.style": "Page style",
	"naist.comic.panel": "Panel {n}",
	"naist.comic.promptPlaceholder": "what is in the panel: characters, action, place",
	"naist.comic.textPlaceholder": "text in the image, one line each (speech, captions, sounds)",
	"naist.comic.tokens": "text: {text} tokens · panel: {total} / {limit}",
	"naist.comic.run": "Draw the page",
	"naist.comic.progress": "Panel {done} of {total}",
	"naist.comic.done": "Comic page with {count} panels posted.",
	"naist.comic.layout.single": "One panel",
	"naist.comic.layout.two-rows": "Two rows",
	"naist.comic.layout.two-columns": "Two columns",
	"naist.comic.layout.four-koma": "4-koma",
	"naist.comic.layout.grid-4": "2 × 2",
	"naist.comic.layout.hero-top": "Large panel on top",
	"naist.comic.layout.grid-6": "2 × 3",
	"naist.io.title": "Export and import",
	"naist.io.hint": "All settings, presets, styles, poses, the glossary and vibe sets in one JSON file with the schema version.",
	"naist.io.includeImages": "Include vibe images",
	"naist.io.export": "Export settings",
	"naist.io.import": "Import settings…",
	"naist.io.exported": "Saved {file}.",
	"naist.io.confirmImport": "Replace all NAI Studio settings with {file}? The current ones are backed up first.",
	"naist.io.imported": "Settings imported (schema {version}, {images} image(s)).",
	"naist.io.reason.not-json": "The file is not JSON.",
	"naist.io.reason.wrong-format": "This is not a NAI Studio settings file.",
	"naist.io.reason.newer-schema": "The file is from a newer NAI Studio (schema {version}, this one knows {current}). Update the extension first.",
	"naist.io.reason.invalid": "The file is damaged: no settings or schema version.",
	"naist.interpret.title": "Human language → prompt",
	"naist.interpret.button": "→ Prompt",
	"naist.interpret.buttonHint": "Turn this description (Russian or English) into tags for the selected model",
	"naist.interpret.already": "This is already a tag prompt.",
	"naist.interpret.done": "Converted.",
	"naist.interpret.cached": "Converted (from the cache).",
	"naist.interpret.unmatched": "Not known tags, kept as phrases: {tags}",
	"naist.interpret.fallback": "The language model did not answer usefully: the prompt was assembled from the tag dictionary.",
	"naist.command.promptHelp": "Turns a description in human language (Russian or English) into a NovelAI prompt for the current model.",
	"naist.command.promptReturns": "the NovelAI prompt",
	"naist.command.arg.promptText": "description of the picture",
	"naist.markers.title": "Image markers in replies",
	"naist.markers.hint": "The chat model writes an <img data-nai=...> marker with a description where a picture fits; NAI Studio generates it right in the message, already while the reply is streaming. Older formats (your microservice URL, sillyimages, Auto Illustrator) are understood too.",
	"naist.markers.enabled": "Generate images from markers in replies",
	"naist.markers.inject": "Add the instruction about markers to the prompt",
	"naist.markers.preset": "Instruction",
	"naist.markers.presetNatural": "Plain-language descriptions",
	"naist.markers.presetTags": "Danbooru tags",
	"naist.markers.presetCustom": "My own text",
	"naist.markers.captionLanguage": "Caption language",
	"naist.markers.template": "Instruction text",
	"naist.markers.templateHint": "Variables: {{count}} (how many pictures), {{min}}, {{max}}, {{captionLanguage}}, {{chars}} (characters with passports), {{charsHint}}.",
	"naist.markers.templateDefault": "Start from the standard text",
	"naist.markers.min": "Pictures per reply: at least",
	"naist.markers.max": "at most",
	"naist.markers.depth": "Instruction depth",
	"naist.markers.role": "Instruction role",
	"naist.markers.roleSystem": "System",
	"naist.markers.roleUser": "User",
	"naist.markers.roleAssistant": "Assistant",
	"naist.markers.earlyStart": "Start generating while the reply is still streaming",
	"naist.markers.autoFill": "Fewer markers than the minimum: illustrate the reply automatically",
	"naist.markers.legacy": "Understand older marker formats (microservice URL, sillyimages, Auto Illustrator)",
	"naist.markers.regexCompat": "Show images to display regexes as <img> (keeps HTML widgets working)",
	"naist.markers.allowPaid": "Allow paid marker images, Anlas each at most",
	"naist.markers.maxCost": "Maximum Anlas per image",
	"naist.markers.preview": "Show the instruction",
	"naist.markers.previewHint": "This is what the chat model receives (character names are an example).",
	"naist.markers.previewChars": "Alice, Bob",
	"naist.markers.generating": "Generating the picture…",
	"naist.markers.failed": "The picture was not generated",
	"naist.markers.interrupted": "Generation was interrupted",
	"naist.markers.cancelled": "Cancelled.",
	"naist.markers.qualityWaiting": "Waiting for the quality check…",
	"naist.markers.qualitySkipped": "Not drawn: the reply is being redone after the quality check. \"Try again\" draws it anyway.",
	"naist.markers.qualityCancelled": "Not drawn: the reply was swiped or deleted during the quality check.",
	"naist.markers.retry": "Try again",
	"naist.language.title": "Human language",
	"naist.language.hint": "Write prompts the way you would describe a picture, in Russian or English: before generation the description becomes tags (and short sentences for V4.5 / V5) for the selected model. Automatically: Russian always, English prose on every model except V5 (it reads prose itself). Tag prompts are used as they are; text after \"text:\" stays as typed.",
	"naist.language.mode": "Convert",
	"naist.language.modeAuto": "Automatically",
	"naist.language.modeAlways": "Everything that is not tags",
	"naist.language.modeOff": "Off",
	"naist.language.backend": "Converted by",
	"naist.language.backendMain": "The current chat model",
	"naist.language.backendProfile": "A connection profile",
	"naist.language.backendNovelai": "NovelAI text model (plugin)",
	"naist.language.profile": "Connection profile",
	"naist.language.profileHint": "A separate, cheap model keeps the chat model free (Connection Manager profiles).",
	"naist.language.profileNone": "(choose a profile)",
	"naist.language.novelaiModel": "NovelAI model",
	"naist.language.novelaiHint": "Part of the subscription, no Anlas. Needs the plugin 0.4.0; Xialong needs Opus.",
	"naist.language.russianOnV5": "Send Russian to V5 as is (experimental: V5 officially reads English and Japanese)",
	"naist.language.test": "Try it",
	"naist.language.testPlaceholder": "e.g. a red-haired girl reads a book by a rainy window",
	"naist.language.testRun": "Convert",
	"naist.language.testNegative": "Negative:",
	"naist.markers.retryHint": "Click to generate this picture again",
	"naist.card.passports": "Passports: characters, world, places of this card",
	"naist.card.emotions": "Emotions: generate Expressions sprites one by one",
	"naist.card.personaPassport": "NAI Studio: persona passport",
	"naist.passport.name": "Name",
	"naist.passport.kind": "Kind",
	"naist.passport.kind.character": "Character",
	"naist.passport.kind.world": "World",
	"naist.passport.kind.location": "Location",
	"naist.passport.kind.scenario": "Scenario",
	"naist.passport.kind.object": "Object",
	"naist.passport.aliases": "Other names",
	"naist.passport.aliasesHint": "comma separated: nicknames, short names, names in other languages",
	"naist.passport.tags": "Visual tags",
	"naist.passport.tagsHint": "World and scenario tags join every scene of this chat; a location joins when it is named; an object is for your notes and the tools.",
	"naist.passport.generateOne": "Fill from the description",
	"naist.passport.generateHint": "The language model of \"Human language\" reads the persona description; empty fields are filled, nothing is saved until you press Save.",
	"naist.passport.generated": "The passport was filled from the description.",
	"naist.passports.title": "Passports: {name}",
	"naist.passports.hint": "A card can describe several characters, a world, places, a scenario. Characters take part in scenes and markers by name (their looks are added automatically); world and scenario tags join every scene of the chat; a location joins when it is named.",
	"naist.passports.generate": "Generate from the description",
	"naist.passports.generateHint": "Reads the description, personality, scenario and first message with the language model of \"Human language\".",
	"naist.passports.none": "No passports yet: add one or generate them.",
	"naist.passports.main": "main",
	"naist.passports.empty": "(empty)",
	"naist.passports.emotions": "Emotions of this character",
	"naist.passports.edit": "Edit",
	"naist.passports.add": "Add",
	"naist.passports.mergeQuestion": "The card already has passports. Add only the new ones (by name), or replace all of them?",
	"naist.passports.mergeAdd": "Add new",
	"naist.passports.mergeReplace": "Replace all",
	"naist.passports.generated": "Passports generated: {count}. Check them and press Save.",
	"naist.passport.scope": "Applies to:",
	"naist.passport.scopeCard": "Card",
	"naist.passport.scopePersona": "Persona",
	"naist.passport.scopeChat": "This chat",
	"naist.passport.scopeReset": "Back to the card",
	"naist.passport.scopeCardHint": "Saved into the card: every chat with it sees the change.",
	"naist.passport.scopeChatHint": "Only this chat sees the change; it is kept over the card and the card stays as it is. \"Back to the card\" and Save drop the changes of this chat.",
	"naist.passport.scopeChatOnly": "This passport exists only in this chat.",
	"naist.passport.savedChat": "The passport of {name} is saved for this chat.",
	"naist.passports.chatOverride": "changed in this chat",
	"naist.sprites.who": "For",
	"naist.sprites.costume": "own folder",
	"naist.macro.characters": "Characters of the chat with a NAI Studio passport (name them in an image marker, their looks are added).",
	"naist.des.title": "Doom's Enhancement Suite",
	"naist.des.hint": "When DES is installed, NAI Studio takes its scene and characters for pictures, keeps passports for its characters and draws its portraits.",
	"naist.des.statusSearching": "Looking for DES…",
	"naist.des.statusAbsent": "DES is not installed or is disabled in SillyTavern.",
	"naist.des.statusConnected": "DES {version} connected, tracker mode: {mode}.",
	"naist.des.statusOff": "DES itself is switched off.",
	"naist.des.statusUnverified": "Checked on DES 2.6.0; this version may differ.",
	"naist.des.enabled": "Integrate with DES",
	"naist.des.sceneTags": "Scene from the tracker: time of day, weather, indoors / outdoors, location",
	"naist.des.characters": "Characters of the tracker in pictures, with their current look",
	"naist.des.autoPassports": "New character without a passport: write one from the tracker (saved in the card)",
	"naist.des.portraits": "NAI Studio draws the DES portraits (DES's own auto portraits are off meanwhile)",
	"naist.des.policy": "Draw a portrait",
	"naist.des.policyMissing": "when there is none",
	"naist.des.policyState": "when the look changes (passport, outfit, states)",
	"naist.des.policyEvery": "every reply",
	"naist.des.policyHint": "By default a portrait is drawn once. \"When the look changes\" redraws it only when the passport, its active outfit or states change (for a character without a passport: when the tracker describes a clearly different look); the same look in other words keeps the portrait. \"NAI Studio: new portrait\" in the DES portrait menu always draws a new one.",
	"naist.des.framing": "Portrait framing tags",
	"naist.des.emotionsToDes": "Emotions of other characters of a card go to characters/<name>, where DES looks",
	"naist.des.menu": "NAI Studio items in the DES portrait menu and the Workshop",
	"naist.des.banners": "\"Illustrate\" button on DES scene banners",
	"naist.des.passportsButton": "Passports for the characters of the tracker",
	"naist.des.passportsDone": "Passports written: {count}.",
	"naist.des.passportCreated": "Passport written for {name} (saved in the card).",
	"naist.des.noPassport": "No passport for {name}: nothing to draw from.",
	"naist.des.portraitStarted": "Drawing the portrait of {name}…",
	"naist.des.menuPassport": "NAI Studio: passport",
	"naist.des.menuEmotions": "NAI Studio: emotions",
	"naist.des.menuPortrait": "NAI Studio: new portrait",
	"naist.des.menuScene": "NAI Studio: picture with this character",
	"naist.des.illustrate": "Illustrate this scene (NAI Studio)",
	"naist.des.workshopPassport": "NAI Studio passport",
	"naist.multimodal.title": "Multimodal mode",
	"naist.multimodal.fallback": "The avatar could not be described by the vision model ({reason}). The picture is made from the chat model's description instead. Set up Image Captioning (multimodal API with a key) or turn the multimodal mode off on the Chat tab.",
	"naist.multimodal.api": "Avatar described by",
	"naist.multimodal.model": "Vision model",
	"naist.multimodal.apiCaptioning": "As in Image Captioning (now: {api})",
	"naist.multimodal.keySet": "key saved",
	"naist.multimodal.keyMissing": "no key",
	"naist.multimodal.modelCaptioning": "from Image Captioning",
	"naist.multimodal.hint": "Multimodal modes (\"you\", \"face\", \"me\") first describe the avatar with a vision model; the key is the one saved in SillyTavern (API Connections) for that API.",
	"naist.multimodal.noKey": "No {api} key is saved in SillyTavern: choose an API with a key (e.g. OpenRouter) or save the key in API Connections.",
	"naist.card.personaAvatar": "NAI Studio: avatar from the persona passport",
	"naist.personaAvatar.title": "Persona avatar",
	"naist.personaAvatar.noPassport": "The persona has no passport yet: fill it in (or from the description), then draw the avatar.",
	"naist.personaAvatar.drawing": "Drawing an avatar from the passport…",
	"naist.personaAvatar.heading": "New avatar for {name}",
	"naist.personaAvatar.set": "Set as avatar",
	"naist.personaAvatar.again": "Another one",
	"naist.personaAvatar.done": "Avatar of {name} updated.",
	"naist.scene.explicitNegative": "Undesired content of explicit scenes",
	"naist.scene.explicitNegativeHint": "Added to the undesired content only in explicit scenes (when NSFW is allowed, the prompt also gets \"nsfw\"). Tags the undesired content already has are not repeated.",
	"naist.quality.title": "Wait for the quality check (Maestro)",
	"naist.quality.hint": "Another extension (Maestro) checks every reply. Pictures NAI Studio draws on its own for a reply (image markers, automatic illustrations and generation, DES portraits) wait for its answer: a reply it redoes is not drawn. With no answer in time they are drawn as usual. Manual generation does not wait.",
	"naist.quality.timeout": "Wait at most, seconds (from the end of the reply)",
	"naist.background.failed": "The background for “{name}” was not made: {reason}"
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
var PREFIX$1 = "[NAI Studio]";
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
		if (enabled("debug")) console.debug(PREFIX$1, ...args);
	},
	info: (...args) => {
		if (enabled("info")) console.info(PREFIX$1, ...args);
	},
	warn: (...args) => {
		if (enabled("warn")) console.warn(PREFIX$1, ...args);
	},
	error: (...args) => {
		if (enabled("error")) console.error(PREFIX$1, ...args);
	}
};
function defaultGeneration() {
	return {
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
		autoText: true,
		imageFormat: "webp",
		useCoords: false,
		characters: []
	};
}
function defaultSettings() {
	return {
		schemaVersion: 12,
		transport: { mode: "auto" },
		generation: defaultGeneration(),
		prompts: {
			prefix: "",
			suffix: "",
			templates: {},
			styles: [],
			activeStyle: "",
			baseNegative: "",
			negativeMode: "replace",
			characterPrompts: {}
		},
		modes: {
			refine: false,
			multimodal: false,
			multimodalApi: "",
			multimodalModel: "",
			freeExtend: false,
			snap: false,
			minimalProcessing: false
		},
		chat: {
			visibility: {
				panel: false,
				command: false,
				wand: false,
				interactive: false,
				tool: false,
				auto: false,
				message: false
			},
			author: "character",
			hidePrompt: true,
			interactive: false,
			functionTool: false,
			toolCooldownSeconds: 30
		},
		auto: {
			enabled: false,
			mode: 4,
			everyMessages: 0,
			keywords: "",
			sceneChange: false,
			sceneMarkers: "***, ---, ⁂",
			cooldownMessages: 3,
			cooldownSeconds: 60,
			allowPaid: false
		},
		takeover: {
			migratedAt: null,
			migrationReport: []
		},
		anlas: {
			freeOnly: true,
			confirmAbove: 0
		},
		inline: {
			saveToServer: true,
			keepBrowserCopy: true,
			defaultWidth: 60,
			defaultWidthUnit: "%",
			defaultAlign: "center",
			defaultRadius: 8,
			defaultLayout: "grid",
			llmText: "describe",
			readingMode: false,
			variationStrength: .5,
			variationNoise: .1,
			insertMode: "free",
			regexCompat: true
		},
		markers: {
			enabled: false,
			inject: true,
			preset: "natural",
			template: "",
			depth: 1,
			role: "system",
			min: 1,
			max: 3,
			earlyStart: true,
			captionLanguage: "Russian",
			legacy: true,
			autoFill: false,
			allowPaid: false,
			maxCost: 5
		},
		language: {
			mode: "auto",
			backend: "main",
			profileId: "",
			novelaiModel: "glm-4-6",
			russianOnV5: false
		},
		des: {
			enabled: true,
			sceneTags: true,
			characters: true,
			autoPassports: true,
			portraits: true,
			portraitPolicy: "missing",
			portraitPolicyChosen: false,
			portraitTags: "portrait, upper body, looking at viewer",
			emotionsToDes: true,
			menu: true,
			banners: true,
			saved: null
		},
		quality: { gateTimeoutMs: 2e4 },
		gallery: {
			enabled: true,
			thumbSize: 256
		},
		png: { stripMetadata: false },
		poses: {
			custom: [],
			favorites: []
		},
		vibes: {
			items: [],
			sets: [],
			confirmEncoding: true
		},
		stream: {
			enabled: true,
			hintShown: false
		},
		tools: {
			defry: 0,
			emotion: "happy",
			inpaintStrength: 1,
			keepOriginal: true,
			brushSize: 40,
			enhanceScale: 1.5,
			enhanceStrength: .45,
			enhanceNoise: 0
		},
		translate: {
			auto: false,
			glossary: []
		},
		promptTools: {
			autocomplete: true,
			remoteSuggest: true,
			warnUnknown: true,
			counter: true,
			convertWeights: true
		},
		sprites: {
			mode: "director",
			transparent: true,
			labels: []
		},
		comic: {
			layout: "grid-4",
			pageWidth: 1024,
			pageHeight: 1536,
			gutter: 16,
			style: "comic, manga style"
		},
		continuity: {
			enabled: false,
			mode: "img2img",
			strength: .6,
			autoBind: true
		},
		scene: {
			framing: "auto",
			camera: "auto",
			distance: "auto",
			allowNsfw: false,
			explicitNegative: "child, loli, shota, underage",
			llmBase: false,
			useCoords: true,
			target: "message",
			personaPassports: {}
		},
		inspector: { openBeforeSend: false },
		rawOverride: {
			enabled: false,
			json: ""
		},
		log: { level: "info" }
	};
}
function isObject$3(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Ordered migrations. Each one is a separate function with its own test (TZ "Versioning").
* v1: first schema. Settings saved before versioning (no schemaVersion) start from here.
* v2: `output.hiddenFromPrompt` became the per-initiator visibility map `chat.visibility`.
*/
var MIGRATIONS = [
	{
		to: 1,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 1
			};
		}
	},
	{
		to: 2,
		migrate(settings) {
			const { output, ...rest } = settings;
			const next = {
				...rest,
				schemaVersion: 2
			};
			if (isObject$3(output) && output.hiddenFromPrompt === false) {
				const chat = isObject$3(rest.chat) ? rest.chat : {};
				next.chat = {
					...chat,
					visibility: {
						...isObject$3(chat.visibility) ? chat.visibility : {},
						panel: true
					}
				};
			}
			return next;
		}
	},
	{
		to: 3,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 3
			};
		}
	},
	{
		to: 4,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 4
			};
		}
	},
	{
		to: 5,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 5
			};
		}
	},
	{
		to: 6,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 6
			};
		}
	},
	{
		to: 7,
		migrate(settings) {
			const translate = isObject$3(settings.translate) ? settings.translate : {};
			const language = isObject$3(settings.language) ? settings.language : {};
			const next = {
				...settings,
				schemaVersion: 7
			};
			if (translate.auto === true && language.mode === void 0) next.language = {
				...language,
				mode: "auto"
			};
			return next;
		}
	},
	{
		to: 8,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 8
			};
		}
	},
	{
		to: 9,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 9
			};
		}
	},
	{
		to: 10,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 10
			};
		}
	},
	{
		to: 11,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 11
			};
		}
	},
	{
		to: 12,
		migrate(settings) {
			const next = {
				...settings,
				schemaVersion: 12
			};
			const des = isObject$3(settings.des) ? settings.des : null;
			if (des && des.portraitPolicy === "state" && des.portraitPolicyChosen === void 0) next.des = {
				...des,
				portraitPolicy: "missing"
			};
			return next;
		}
	}
];
/** Applies pending migrations, then fills missing keys from defaults (lodash.merge in the host). */
function migrateAndFill(stored, merge) {
	let raw = isObject$3(stored) ? structuredClone(stored) : {};
	const fromVersion = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
	if (fromVersion > 12) return {
		settings: merge(defaultSettings(), raw),
		fromVersion,
		migrated: false
	};
	for (const migration of MIGRATIONS) if (migration.to > fromVersion) raw = migration.migrate(raw);
	const settings = merge(defaultSettings(), raw);
	const generation = isObject$3(raw.generation) ? raw.generation : {};
	settings.generation.characters = Array.isArray(generation.characters) ? generation.characters : [];
	const prompts = isObject$3(raw.prompts) ? raw.prompts : {};
	settings.prompts.styles = Array.isArray(prompts.styles) ? prompts.styles : [];
	const poses = isObject$3(raw.poses) ? raw.poses : {};
	settings.poses.custom = Array.isArray(poses.custom) ? poses.custom : [];
	settings.poses.favorites = Array.isArray(poses.favorites) ? poses.favorites : [];
	const vibes = isObject$3(raw.vibes) ? raw.vibes : {};
	settings.vibes.items = Array.isArray(vibes.items) ? vibes.items : [];
	settings.vibes.sets = Array.isArray(vibes.sets) ? vibes.sets : [];
	const translate = isObject$3(raw.translate) ? raw.translate : {};
	settings.translate.glossary = Array.isArray(translate.glossary) ? translate.glossary : [];
	const sprites = isObject$3(raw.sprites) ? raw.sprites : {};
	if (Array.isArray(sprites.labels)) settings.sprites.labels = sprites.labels;
	const takeover = isObject$3(raw.takeover) ? raw.takeover : {};
	settings.takeover.migrationReport = Array.isArray(takeover.migrationReport) ? takeover.migrationReport : [];
	settings.schemaVersion = 12;
	return {
		settings,
		fromVersion,
		migrated: fromVersion !== 12
	};
}
//#endregion
//#region src/core/storage.ts
var instances = /* @__PURE__ */ new Map();
function instance$1(storeName) {
	let found = instances.get(storeName);
	if (!found) {
		found = libs().localforage.createInstance({
			name: "NAIStudio",
			storeName
		});
		instances.set(storeName, found);
	}
	return found;
}
/** Settings backups and small caches. */
function store() {
	return instance$1("data");
}
/** Full images and thumbnails (Blob values). */
function imageStore() {
	return instance$1("images");
}
/** Gallery records (one per generated image). */
function galleryStore() {
	return instance$1("gallery");
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
	await Promise.all([
		store().clear(),
		imageStore().clear(),
		galleryStore().clear()
	]);
}
//#endregion
//#region src/core/settings.ts
var current = defaultSettings();
var externalListeners = /* @__PURE__ */ new Set();
/** The panel re-reads its controls when settings change outside of it (slash commands, migration). */
function onExternalChange(listener) {
	externalListeners.add(listener);
	return () => externalListeners.delete(listener);
}
function notifyExternalChange() {
	for (const listener of externalListeners) listener();
}
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
/** Replaces the settings in place (the object referenced by extensionSettings stays the same). */
function replaceSettings(next) {
	for (const key of Object.keys(current)) delete current[key];
	Object.assign(current, structuredClone(next));
	ctx().saveSettingsDebounced();
	notifyExternalChange();
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
		balance: context.balance ?? 0,
		...shape.retryAfter ? { retryAfter: shape.retryAfter } : {}
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
//#region src/core/notify.ts
/** Shows a localized error toast; a user-initiated abort is not an error. */
function reportGenerationError(error) {
	const naiError = error instanceof NaiError ? error : toNaiError(error);
	if (naiError.code !== "aborted") toastr.error(naiError.text, naiError.title);
	return naiError;
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
var TEXT_BLOCK$1 = /(?:^|\s|[,.:[\]{}、。])text:(?!:)/i;
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
		const match = first.match(TEXT_BLOCK$1);
		const parts = first.split(TEXT_BLOCK$1);
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
/** Largest size with the same aspect ratio, multiples of 64, whose area does not exceed `maxPixels`. */
function fitArea(width, height, maxPixels) {
	if (width * height <= maxPixels) return {
		width,
		height
	};
	const ratio = Math.sqrt(maxPixels / (width * height));
	let w = Math.max(64, Math.floor(width * ratio / 64) * 64);
	let h = Math.max(64, Math.floor(height * ratio / 64) * 64);
	while (w * h > maxPixels) if (w >= h && w > 64) w -= 64;
	else if (h > 64) h -= 64;
	else break;
	const aspect = Math.log(width / height);
	let best = {
		width: w,
		height: h
	};
	for (const [dw, dh] of [
		[64, 0],
		[0, 64],
		[64, 64]
	]) {
		const candidate = {
			width: w + dw,
			height: h + dh
		};
		if (candidate.width * candidate.height > maxPixels) continue;
		const error = Math.abs(Math.log(candidate.width / candidate.height) - aspect);
		const bestError = Math.abs(Math.log(best.width / best.height) - aspect);
		if (error < bestError - 1e-9 || Math.abs(error - bestError) <= 1e-9 && candidate.width * candidate.height > best.width * best.height) best = candidate;
	}
	return best;
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
/** Upscale price by source area (bundle:1601@43991). Null = source too large. No free mode. */
function upscaleCost(width, height) {
	const pixels = width * height;
	for (const [limit, price] of [
		[1048576, 1],
		[1747627, 2],
		[2446678, 3],
		[3145728, 4]
	]) if (pixels > 0 && pixels <= limit) return price;
	return null;
}
/** Director tools are priced as Anime V3 at 28 steps; bg-removal is 3x + 5 and never free. */
function directorToolCost(tool, width, height, account) {
	const base = basePricePerImage(width, height, 28, false, false, 1, 1);
	if (tool === "bg-removal") return 3 * base + 5;
	return account.tier >= 3 && account.active && width * height <= 1048576 ? 0 : base;
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
//#region src/domain/text-block.ts
var SEGMENT = "|";
var RANDOM = "||";
var TEXT_BLOCK = /(?:^|\s|[,.:[\]{}、。])text:(?!:)/i;
var AUTO_TEXT = "teXt:";
var QUOTES = {
	"\"": "\"",
	"“": "”",
	"「": "」",
	"'": "'",
	"‘": "’"
};
var CJK = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFF9F\u4E00-\u9FAF\u3400-\u4DBF]/gu;
/** `|` segments, keeping `||a|b||` random choices intact; at most six (the rest stays in the last). */
function promptSegments(prompt) {
	const RANDOM_MARK = "𐎹";
	const PIPE_MARK = "𒄷";
	const parts = prompt.split(RANDOM).map((part, i) => i % 2 === 1 ? part.split(SEGMENT).join(RANDOM_MARK) : part).join(PIPE_MARK).split(SEGMENT);
	const segments = parts.slice(0, 5);
	if (parts.length > 5) segments.push(parts.slice(5).join(SEGMENT));
	return segments.map((s) => s.replaceAll(RANDOM_MARK, SEGMENT).replaceAll(PIPE_MARK, RANDOM));
}
var isWordChar = (c) => c !== void 0 && /[\p{L}\p{N}]/u.test(c);
var isBoundary = (c) => c === void 0 || /[\s,.]/.test(c);
/** Phrases in quotes; an apostrophe opens a quote only after a space, comma, period or the start. */
function quotedPhrases(text) {
	const found = [];
	let i = 0;
	while (i < text.length) {
		const close = QUOTES[text[i]];
		if (close === void 0 || text[i] === "'" && !isBoundary(text[i - 1])) {
			i++;
			continue;
		}
		const apostrophe = close === "'" || close === "’";
		let j = i + 1;
		while (j < text.length && (text[j] !== close || apostrophe && isWordChar(text[j + 1]))) j++;
		if (j >= text.length) {
			i++;
			continue;
		}
		const phrase = text.slice(i + 1, j).trim();
		if (phrase) found.push(phrase);
		i = j + 1;
	}
	return found;
}
/** Reading order of positioned characters: rows split at the largest vertical gaps, then x. */
function readingOrder(characters) {
	const rows = (list) => {
		if (list.length <= 1) return [list];
		const spread = list.at(-1).center.y - list[0].center.y;
		let at = 1;
		let gap = -1;
		for (let i = 1; i < list.length; i++) {
			const d = list[i].center.y - list[i - 1].center.y;
			if (d > gap) {
				gap = d;
				at = i;
			}
		}
		return spread <= .15 && gap <= .1 ? [list] : [...rows(list.slice(0, at)), ...rows(list.slice(at))];
	};
	return rows([...characters].sort((a, b) => a.center.y - b.center.y)).flatMap((row) => row.sort((a, b) => a.center.x - b.center.x));
}
function phrasesOf(base, characters, useCoords) {
	const active = characters.filter((c) => (c.enabled ?? true) && c.prompt.length > 0);
	const ordered = useCoords ? readingOrder(active) : active;
	const lists = [quotedPhrases(base), ...ordered.map((c) => quotedPhrases(c.prompt))];
	const all = lists.flat().join("");
	const cjk = all.match(CJK)?.length ?? 0;
	if (cjk && cjk / all.length > .3) lists.forEach((l) => l.reverse());
	return lists.flat();
}
function hasTextBlock(text) {
	return TEXT_BLOCK.test(text);
}
/** Adds the automatic text block (unchanged when any prompt already has `text:` or nothing is quoted). */
function applyAutoText(prompt, characters, useCoords) {
	const active = characters.filter((c) => (c.enabled ?? true) && c.prompt.length > 0);
	if (hasTextBlock(prompt) || active.some((c) => hasTextBlock(c.prompt))) return prompt;
	const segments = promptSegments(prompt);
	const phrases = phrasesOf(segments[0] ?? "", active, useCoords);
	if (!phrases.length) return prompt;
	const block = `${AUTO_TEXT} ${phrases.join("\n\n")}`;
	const head = (segments[0] ?? "").replace(/[\s,]+$/, "");
	segments[0] = head ? `${head}, ${block}` : block;
	return segments.join(SEGMENT);
}
/**
* Puts tags before the `text:` block of the first segment, which must stay last (everything after
* `text:` is drawn as text); null when the prompt has no block there.
*/
function insertBeforeTextBlock(prompt, tags) {
	const segments = promptSegments(prompt);
	const first = segments[0] ?? "";
	const match = first.match(TEXT_BLOCK);
	if (match?.index === void 0) return null;
	const start = match.index + match[0].length - 5;
	const head = first.slice(0, start).replace(/[\s,]+$/, "");
	segments[0] = `${head ? `${head}, ` : ""}${tags}, ${first.slice(start)}`;
	return segments.join(SEGMENT);
}
/** The in-image text of a prompt (after the first `text:` of the first segment), or null. */
function textBlockOf(prompt) {
	const first = promptSegments(prompt)[0] ?? "";
	const match = first.match(TEXT_BLOCK);
	if (match?.index === void 0) return null;
	return first.slice(match.index + match[0].length).trim();
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
var ACTIONS$1 = {
	txt2img: "generate",
	img2img: "img2img",
	inpaint: "infill"
};
/** Final prompt and UC strings exactly as they go into `input` / `negative_prompt`. */
function composePrompts(req, caps) {
	const withQuality = applyQualityTags(req.prompt, caps, req.qualityPreset, req.transparentBackground);
	const negative = applyUcPreset(req.negativePrompt, caps, req.ucPreset, withQuality);
	return {
		prompt: applyDatasetPrefix(caps.family === "v5" && req.autoText !== false ? applyAutoText(withQuality, req.characters, req.useCoords) : withQuality, caps, req.dataset),
		negative
	};
}
function buildPayload(input, caps) {
	if (input.model !== caps.model) throw new Error(`Capabilities of ${caps.model} passed for ${input.model}`);
	const ctx = new BuildContext();
	const req = normalizeRequest(input, caps, ctx);
	const { prompt, negative } = composePrompts(req, caps);
	const action = ACTIONS$1[req.mode];
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
//#region src/domain/modes.ts
var MODE = {
	TOOL: -2,
	MESSAGE: -1,
	CHARACTER: 0,
	USER: 1,
	SCENARIO: 2,
	RAW_LAST: 3,
	NOW: 4,
	FACE: 5,
	FREE: 6,
	BACKGROUND: 7,
	CHARACTER_MULTIMODAL: 8,
	USER_MULTIMODAL: 9,
	FACE_MULTIMODAL: 10,
	FREE_EXTENDED: 11
};
/** Modes that have an editable template (everything except FREE). */
var TEMPLATE_MODES = [
	MODE.MESSAGE,
	MODE.TOOL,
	MODE.CHARACTER,
	MODE.FACE,
	MODE.USER,
	MODE.SCENARIO,
	MODE.NOW,
	MODE.RAW_LAST,
	MODE.BACKGROUND,
	MODE.CHARACTER_MULTIMODAL,
	MODE.FACE_MULTIMODAL,
	MODE.USER_MULTIMODAL,
	MODE.FREE_EXTENDED
];
/** Modes offered in the wand menu, with the trigger word each one answers to. */
var TRIGGER_WORDS = {
	[MODE.CHARACTER]: "you",
	[MODE.USER]: "me",
	[MODE.SCENARIO]: "scene",
	[MODE.RAW_LAST]: "raw_last",
	[MODE.NOW]: "last",
	[MODE.FACE]: "face",
	[MODE.BACKGROUND]: "background"
};
var WAND_MODES = [
	MODE.CHARACTER,
	MODE.FACE,
	MODE.USER,
	MODE.SCENARIO,
	MODE.NOW,
	MODE.RAW_LAST,
	MODE.BACKGROUND
];
var MULTIMODAL = {
	[MODE.CHARACTER]: MODE.CHARACTER_MULTIMODAL,
	[MODE.USER]: MODE.USER_MULTIMODAL,
	[MODE.FACE]: MODE.FACE_MULTIMODAL
};
/** Trigger text -> mode, as `/sd` resolves it (exact trigger word, case-insensitive; otherwise FREE). */
function resolveMode(trigger, options) {
	const word = trigger.trim().toLowerCase();
	let mode = MODE.FREE;
	for (const [id, value] of Object.entries(TRIGGER_WORDS)) if (value === word) {
		mode = Number(id);
		break;
	}
	const multimodal = MULTIMODAL[mode];
	if (options.multimodal && multimodal !== void 0) mode = multimodal;
	if (mode === MODE.FREE && options.freeExtend) mode = MODE.FREE_EXTENDED;
	return mode;
}
/** The text mode a multimodal mode stands for (character, user, face); other modes unchanged. */
function textModeOf(mode) {
	const entry = Object.entries(MULTIMODAL).find(([, multimodal]) => multimodal === mode);
	return entry ? Number(entry[0]) : mode;
}
function isMultimodal(mode) {
	return mode === MODE.CHARACTER_MULTIMODAL || mode === MODE.USER_MULTIMODAL || mode === MODE.FACE_MULTIMODAL;
}
/** Interactive mode trigger ("send me a picture of ..."), built-in regex. */
var ACTIVATION = /\b(send|mail|imagine|generate|make|create|draw|paint|render|show)\b.{0,10}\b(pic|picture|image|drawing|painting|photo|photograph)\b(?:\s+of)?(?:\s+(?:a|an|the|this|that|those|your)?\s+)?(.+)/i;
var SPECIAL_CASES = [
	[MODE.CHARACTER, ["you", "yourself"]],
	[MODE.USER, ["me", "myself"]],
	[MODE.SCENARIO, [
		"story",
		"scenario",
		"whole story"
	]],
	[MODE.NOW, ["last message"]],
	[MODE.FACE, [
		"face",
		"portrait",
		"selfie"
	]],
	[MODE.BACKGROUND, [
		"background",
		"scene background",
		"scene",
		"scenery",
		"surroundings",
		"environment"
	]]
];
/** Returns the trigger for a user message in interactive mode, or null when it does not ask for a picture. */
function matchInteractiveTrigger(message) {
	const subject = message.toLowerCase().match(ACTIVATION)?.[3]?.trim();
	if (!subject) return null;
	for (const [mode, phrases] of SPECIAL_CASES) if (phrases.includes(subject)) return TRIGGER_WORDS[mode] ?? subject;
	return subject;
}
/** Modes that skip the character prompt prefix (except image swipes in 1:1 chats). */
var NO_CHARACTER_PREFIX = [
	MODE.FREE,
	MODE.BACKGROUND,
	MODE.USER,
	MODE.USER_MULTIMODAL,
	MODE.FREE_EXTENDED
];
function usesCharacterPrefix(mode, isSwipe, isCharacterChat) {
	if (isSwipe && isCharacterChat) return true;
	return !NO_CHARACTER_PREFIX.includes(mode);
}
/**
* Faces are forced to portrait and backgrounds to landscape; with `snap` the pixel count is kept.
* Mirrors setTypeSpecificDimensions() of the built-in extension.
*/
function modeDimensions(mode, width, height, snap, presets = []) {
	let w = width;
	let h = height;
	const aspect = width / height;
	if ((mode === MODE.FACE || mode === MODE.FACE_MULTIMODAL) && aspect >= 1) h = Math.round(w * 1.5 / 64) * 64;
	else if (mode === MODE.BACKGROUND && aspect <= 1) w = Math.round(h * 1.8 / 64) * 64;
	if (snap && w * h !== width * height) {
		const ratio = Math.sqrt(width * height / (w * h));
		w = Math.round(w * ratio / 64) * 64;
		h = Math.round(h * ratio / 64) * 64;
		const target = w / h;
		let best = null;
		for (const preset of presets) if (!best || Math.abs(preset.width / preset.height - target) < Math.abs(best.width / best.height - target)) best = preset;
		if (best) {
			w = best.width;
			h = best.height;
		}
	}
	return {
		width: w,
		height: h
	};
}
/** Default prompt templates by mode (keys are mode ids as strings, like the built-in settings). */
var DEFAULT_TEMPLATES = {
	[MODE.MESSAGE]: "[{{char}} sends a picture that contains: {{prompt}}].",
	[MODE.TOOL]: "The text prompt used to generate the image. Must represent an exhaustive description of the desired image that will allow an artist or a photographer to perfectly recreate it.",
	[MODE.CHARACTER]: "In the next response I want you to provide only a detailed comma-delimited list of keywords and phrases which describe {{char}}. The list must include all of the following items in this order: name, species and race, gender, age, clothing, occupation, physical features and appearances. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'full body portrait,'",
	[MODE.FACE]: "In the next response I want you to provide only a detailed comma-delimited list of keywords and phrases which describe {{char}}. The list must include all of the following items in this order: name, species and race, gender, age, facial features and expressions, occupation, hair and hair accessories (if any), what they are wearing on their upper body (if anything). Do not describe anything below their neck. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'close up facial portrait,'",
	[MODE.USER]: "Ignore previous instructions and provide a detailed description of {{user}}'s physical appearance from the perspective of {{char}} in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: name, species and race, gender, age, clothing, occupation, physical features and appearances. Do not include descriptions of non-visual qualities such as personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'full body portrait,'. Ignore the rest of the story when crafting this description. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.",
	[MODE.SCENARIO]: "Ignore previous instructions and provide a detailed description for all of the following: a brief recap of recent events in the story, {{char}}'s appearance, and {{char}}'s surroundings. Do not reply as {{char}} while writing this description.",
	[MODE.NOW]: `Ignore previous instructions. Your next response must be formatted as a single comma-delimited list of concise keywords.  The list will describe of the visual details included in the last chat message.

    Only mention characters by using pronouns ('he','his','she','her','it','its') or neutral nouns ('male', 'the man', 'female', 'the woman').

    Ignore non-visible things such as feelings, personality traits, thoughts, and spoken dialog.

    Add keywords in this precise order:
    a keyword to describe the location of the scene,
    a keyword to mention how many characters of each gender or type are present in the scene (minimum of two characters:
    {{user}} and {{char}}, example: '2 men ' or '1 man 1 woman ', '1 man 3 robots'),

    keywords to describe the relative physical positioning of the characters to each other (if a commonly known term for the positioning is known use it instead of describing the positioning in detail) + 'POV',

    a single keyword or phrase to describe the primary act taking place in the last chat message,

    keywords to describe {{char}}'s physical appearance and facial expression,
    keywords to describe {{char}}'s actions,
    keywords to describe {{user}}'s physical appearance and actions.

    If character actions involve direct physical interaction with another character, mention specifically which body parts interacting and how.

    A correctly formatted example response would be:
    '(location),(character list by gender),(primary action), (relative character position) POV, (character 1's description and actions), (character 2's description and actions)'`,
	[MODE.RAW_LAST]: "Ignore previous instructions and provide ONLY the last chat message string back to me verbatim. Do not write anything after the string. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.",
	[MODE.BACKGROUND]: "Ignore previous instructions and provide a detailed description of {{char}}'s surroundings in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: location, time of day, weather, lighting, and any other relevant details. Do not include descriptions of characters and non-visual qualities such as names, personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'background,'. Ignore the rest of the story when crafting this description. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.",
	[MODE.FACE_MULTIMODAL]: "Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with \"close-up portrait\".",
	[MODE.CHARACTER_MULTIMODAL]: "Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with \"full body portrait\".",
	[MODE.USER_MULTIMODAL]: "Provide an exhaustive comma-separated list of tags describing the appearance of the character on this image in great detail. Start with \"full body portrait\".",
	[MODE.FREE_EXTENDED]: "Ignore previous instructions and provide an exhaustive comma-separated list of tags describing the appearance of \"{0}\" in great detail. Start with {{charPrefix}} (sic) if the subject is associated with {{char}}."
};
/** Fills `{0}` with the trigger like the built-in stringFormat(); FREE returns the trigger itself. */
function quietPromptFor(mode, trigger, templates) {
	if (mode === MODE.FREE) return trigger;
	return (templates[String(mode)] ?? DEFAULT_TEMPLATES[String(mode)] ?? "").replace(/\{0\}/g, trigger);
}
//#endregion
//#region src/domain/prompt-assembly.ts
/** Trims spaces and edge commas, joins with ", " or replaces `macro` in the first string. */
function combinePrefixes(first, second, macro = "") {
	const clean = (s) => s.trim().replace(/^,|,$/g, "").trim();
	if (!second) return first;
	const a = clean(first);
	const b = clean(second);
	return clean(macro && a.includes(macro) ? a.replace(macro, b) : `${a}, ${b},`);
}
/**
* Chat-template tokens some models leak into replies (`<|eot_id|>`, `<|response_…|…>`). Not in the
* built-in: their `|` would split the NovelAI prompt into segments, so they are always removed.
*/
var SPECIAL_TOKENS = /<\|[^>]*>/g;
/** Cleans an LLM reply into a tag list (standard) or just collapses whitespace (minimal). */
function processReply(text, minimal) {
	if (!text) return "";
	const cleaned = text.replace(SPECIAL_TOKENS, " ");
	if (minimal) return cleaned.normalize("NFD").replace(/\s+/g, " ").trim();
	return cleaned.replaceAll("\"", "").replaceAll("“", "").replaceAll("\n", ", ").normalize("NFD").replace(/[^a-zA-Z0-9.,:_(){}<>[\]/\-'|#]+/g, " ").replace(/\s+/g, " ").trim().split(",").map((part) => part.trim()).filter((part) => part).join(", ");
}
/** RAW_LAST without an LLM: the last message weighted above scenario and description. */
function rawLastPrompt(message, character) {
	const mes = processReply(message, false);
	if (!character) return mes;
	return `((${mes})), (${processReply(character.scenario ?? "", false)}:0.7), (${processReply(character.description ?? "", false)}:0.5)`;
}
/**
* Free mode: a leading `char ` / `char,` or `{{charPrefix}}` is replaced by the character prompt.
* Returns the prompt and the character negative that has to be added to the negatives.
*/
function applyFreeModeCharacter(trigger, character) {
	let negative = "";
	return {
		prompt: trigger.replace(/^char(\s|,)|{{charPrefix}}/gi, (_match, suffix) => {
			const value = character.positive.trim();
			if (character.negative.trim()) negative = character.negative.trim();
			return value ? combinePrefixes(value, suffix ?? "") : "";
		}),
		negative
	};
}
/**
* Final positive and negative strings before UC presets and quality tags are added by the payload
* builder: prefix (+ character prefix) with `{prompt}` support, then suffix (before an in-image
* `text:` block, which must stay last); negatives combined.
*/
function assemblePrompt(input) {
	const withScene = combinePrefixes(input.useCharacterPrefix ? combinePrefixes(input.prefix, input.characterPositive) : input.prefix, input.scene, "{prompt}");
	const suffix = input.suffix.trim().replace(/^,|,$/g, "").trim();
	const prompt = suffix && insertBeforeTextBlock(withScene, suffix) || combinePrefixes(withScene, suffix);
	const commonNegative = input.useCharacterPrefix ? combinePrefixes(input.negative, input.characterNegative) : input.negative;
	return {
		prompt,
		negative: combinePrefixes(input.additionalNegative, commonNegative)
	};
}
//#endregion
//#region src/domain/autogen.ts
function list$3(text) {
	return text.split(",").map((s) => s.trim()).filter(Boolean);
}
function escapeRegExp$4(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function matchesKeyword(message, keywords) {
	return list$3(keywords).some((word) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp$4(word)}($|[^\\p{L}\\p{N}])`, "iu").test(message));
}
function isSceneChange(message, markers) {
	return list$3(markers).some((marker) => {
		return (/^[\p{L}\p{N}]/u.test(marker) ? new RegExp(`(^|\\n)\\s*${escapeRegExp$4(marker)}\\b`, "iu") : new RegExp(escapeRegExp$4(marker))).test(message);
	});
}
/** Called for every new AI message. Returns the decision and the updated counters. */
function evaluateAuto(rules, state, message, now) {
	const next = {
		messagesSince: state.messagesSince + 1,
		lastAt: state.lastAt
	};
	if (!rules.enabled) return {
		fire: false,
		state: next
	};
	let reason;
	if (rules.everyMessages > 0 && next.messagesSince >= rules.everyMessages) reason = "every-messages";
	else if (rules.keywords.trim() && matchesKeyword(message, rules.keywords)) reason = "keyword";
	else if (rules.sceneChange && isSceneChange(message, rules.sceneMarkers)) reason = "scene-change";
	if (!reason) return {
		fire: false,
		state: next
	};
	if (state.lastAt > 0 && next.messagesSince < Math.max(1, rules.cooldownMessages)) return {
		fire: false,
		reason,
		blockedBy: "cooldown-messages",
		state: next
	};
	if (state.lastAt > 0 && now - state.lastAt < rules.cooldownSeconds * 1e3) return {
		fire: false,
		reason,
		blockedBy: "cooldown-seconds",
		state: next
	};
	return {
		fire: true,
		reason,
		state: {
			messagesSince: 0,
			lastAt: now
		}
	};
}
/**
* Maximum Anlas an automatic generation may spend. Free-only mode always means 0, and paid
* auto generation additionally needs an explicit opt-in (TZ Phase 2 acceptance).
*/
function autoBudget(freeOnly, allowPaid) {
	return !freeOnly && allowPaid ? Number.POSITIVE_INFINITY : 0;
}
//#endregion
//#region src/domain/inline.ts
var PLACEHOLDER_PATTERN = /\[nai:img:([0-9a-zA-Z-]{6,64})\]/g;
function placeholder(id) {
	return `[nai:img:${id}]`;
}
function findPlaceholders(text) {
	const result = [];
	for (const match of text.matchAll(new RegExp(PLACEHOLDER_PATTERN.source, "g"))) result.push({
		id: match[1] ?? "",
		index: match.index ?? 0,
		length: match[0].length
	});
	return result;
}
function placeholderIds(text) {
	return findPlaceholders(text).map((m) => m.id);
}
/**
* Inserts a placeholder at a character offset. A placeholder directly followed by "(" would
* become a Markdown link, so a space is added in that case; the offset is clamped to the text.
*/
function insertPlaceholder(text, id, offset = text.length) {
	const at = Math.max(0, Math.min(text.length, Math.round(offset)));
	const before = text.slice(0, at);
	const after = text.slice(at);
	for (const match of findPlaceholders(text)) if (at > match.index && at < match.index + match.length) return insertPlaceholder(text, id, match.index + match.length);
	const lead = before === "" || /\s$/.test(before) ? "" : " ";
	const trail = after === "" ? "" : after.startsWith("(") || !/^\s/.test(after) ? " " : "";
	return `${before}${lead}${placeholder(id)}${trail}${after}`;
}
/** Removes every occurrence of the placeholder and the spaces it leaves doubled. */
function removePlaceholder(text, id) {
	const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const pattern = new RegExp(`([ \\t]*)\\[nai:img:${escaped}\\]([ \\t]*)`, "g");
	return text.replace(pattern, (match, lead, trail, offset, whole) => {
		const end = offset + match.length;
		const atLineStart = offset === 0 || whole[offset - 1] === "\n";
		const atLineEnd = end === whole.length || whole[end] === "\n";
		if (atLineStart || atLineEnd) return "";
		return lead || trail ? " " : "";
	});
}
/** Moves a placeholder before another one (or to the end) inside the same text. */
function movePlaceholder(text, id, beforeId) {
	if (id === beforeId || !placeholderIds(text).includes(id)) return text;
	const without = removePlaceholder(text, id);
	if (beforeId === null) return insertPlaceholder(without, id, without.length);
	const target = findPlaceholders(without).find((m) => m.id === beforeId);
	return target ? insertPlaceholder(without, id, target.index) : insertPlaceholder(without, id);
}
/**
* Keeps text and entries consistent after an edit, a swipe or a regeneration: entries without a
* placeholder are dropped, orphaned placeholders are removed from the text (TZ Phase 3).
*/
function reconcile(text, entries) {
	const ids = new Set(placeholderIds(text));
	const known = new Set(entries.map((e) => e.id));
	const kept = [];
	const removedEntries = [];
	for (const entry of entries) if (ids.has(entry.id)) kept.push(entry);
	else removedEntries.push(entry);
	const removedPlaceholders = [...ids].filter((id) => !known.has(id));
	let cleaned = text;
	for (const id of removedPlaceholders) cleaned = removePlaceholder(cleaned, id);
	return {
		text: cleaned,
		entries: kept,
		removedEntries,
		removedPlaceholders
	};
}
/** How placeholders reach the LLM prompt: a short description, or nothing (RECON §2.3 item 8). */
function textForPrompt(text, entries, mode) {
	if (!findPlaceholders(text).length) return text;
	const byId = new Map(entries.map((e) => [e.id, e]));
	return text.replace(new RegExp(PLACEHOLDER_PATTERN.source, "g"), (_m, id) => {
		if (mode === "remove") return "";
		const entry = byId.get(id);
		const caption = entry?.display.caption.trim() || entry?.meta?.scenePrompt?.trim() || entry?.marker?.params.prompt.trim() || "";
		return caption ? `[image: ${caption}]` : "";
	}).replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function defaultDisplay(partial = {}) {
	return {
		width: 60,
		widthUnit: "%",
		align: "center",
		wrap: false,
		caption: "",
		alt: "",
		border: false,
		radius: 8,
		spoiler: false,
		layout: "grid",
		...partial
	};
}
function activeSwipe(entry) {
	return entry.swipes[entry.activeSwipe] ?? entry.swipes[entry.swipes.length - 1];
}
function mirror(entry) {
	const swipe = activeSwipe(entry);
	if (!swipe) return entry;
	entry.blobKey = swipe.blobKey;
	entry.meta = swipe.meta;
	if (swipe.filePath) entry.filePath = swipe.filePath;
	else delete entry.filePath;
	return entry;
}
function createInlineImage(id, swipe, display) {
	return mirror({
		id,
		blobKey: "",
		meta: swipe.meta,
		swipes: [swipe],
		activeSwipe: 0,
		display
	});
}
/** Meta of an image that is not generated yet (only the scene prompt is known). */
function pendingMeta(scenePrompt, now = /* @__PURE__ */ new Date()) {
	return {
		scenePrompt,
		prompt: "",
		negativePrompt: "",
		negative: "",
		mode: 0,
		model: "",
		seed: 0,
		width: 0,
		height: 0,
		steps: 0,
		scale: 0,
		cfgRescale: 0,
		sampler: "",
		noiseSchedule: "",
		ucPreset: "",
		qualityPreset: "",
		requestType: "txt2img",
		characters: [],
		transport: "",
		cost: 0,
		createdAt: now.toISOString()
	};
}
/** An image a marker asked for: no swipes until the generation finishes. */
function createPendingImage(id, params, display) {
	return {
		id,
		blobKey: "",
		meta: pendingMeta(params.prompt),
		swipes: [],
		activeSwipe: 0,
		display,
		marker: {
			params,
			status: "pending"
		}
	};
}
/** Adds an alternative generation and makes it active. */
function addSwipe(entry, swipe) {
	entry.swipes.push(swipe);
	entry.activeSwipe = entry.swipes.length - 1;
	return mirror(entry);
}
function setActiveSwipe(entry, index) {
	const count = entry.swipes.length;
	if (count === 0) return entry;
	entry.activeSwipe = (index % count + count) % count;
	return mirror(entry);
}
/** Removes one swipe; returns it so its blob can be freed. The last swipe cannot be removed. */
function removeSwipe(entry, index) {
	if (entry.swipes.length <= 1 || index < 0 || index >= entry.swipes.length) return null;
	const [removed] = entry.swipes.splice(index, 1);
	if (entry.activeSwipe >= entry.swipes.length) entry.activeSwipe = entry.swipes.length - 1;
	else if (index < entry.activeSwipe) entry.activeSwipe -= 1;
	mirror(entry);
	return removed ?? null;
}
/** All blob keys an entry references (every swipe). */
function entryBlobKeys(entry) {
	return entry.swipes.map((s) => s.blobKey).filter(Boolean);
}
/** Reads `extra.nai_images` defensively (hand-edited or older chats). */
function readEntries(extra) {
	const list = extra?.nai_images;
	if (!Array.isArray(list)) return [];
	return list.filter((e) => typeof e === "object" && e !== null && typeof e.id === "string" && Array.isArray(e.swipes) && (e.swipes.length > 0 || typeof e.marker === "object"));
}
/** Inline CSS for the image container from its display options. */
function displayStyle(display) {
	const width = Math.max(1, display.width);
	const style = {
		width: `${display.widthUnit === "%" ? Math.min(100, width) : width}${display.widthUnit}`,
		"border-radius": `${Math.max(0, display.radius)}px`
	};
	if (display.wrap && display.align !== "center") {
		style.float = display.align;
		style.margin = display.align === "left" ? "0 12px 8px 0" : "0 0 8px 12px";
	} else if (display.align === "center") {
		style["margin-left"] = "auto";
		style["margin-right"] = "auto";
	} else if (display.align === "right") style["margin-left"] = "auto";
	return style;
}
//#endregion
//#region src/domain/png-meta.ts
var PNG_SIGNATURE = [
	137,
	80,
	78,
	71,
	13,
	10,
	26,
	10
];
var TEXT_CHUNKS = /* @__PURE__ */ new Set([
	"tEXt",
	"iTXt",
	"zTXt"
]);
var METADATA_CHUNKS = /* @__PURE__ */ new Set([
	"tEXt",
	"iTXt",
	"zTXt",
	"eXIf",
	"tIME"
]);
var crcTable = null;
function crc32(bytes) {
	if (!crcTable) {
		crcTable = /* @__PURE__ */ new Uint32Array(256);
		for (let n = 0; n < 256; n++) {
			let c = n;
			for (let k = 0; k < 8; k++) c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
			crcTable[n] = c >>> 0;
		}
	}
	let crc = 4294967295;
	for (const byte of bytes) crc = (crcTable[(crc ^ byte) & 255] ?? 0) ^ crc >>> 8;
	return (crc ^ 4294967295) >>> 0;
}
function isPng(bytes) {
	return PNG_SIGNATURE.every((b, i) => bytes[i] === b);
}
function isWebp(bytes) {
	return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP";
}
function ascii(bytes, start, length) {
	let out = "";
	for (let i = start; i < start + length && i < bytes.length; i++) out += String.fromCharCode(bytes[i] ?? 0);
	return out;
}
function u32be(bytes, at) {
	return ((bytes[at] ?? 0) << 24 | (bytes[at + 1] ?? 0) << 16 | (bytes[at + 2] ?? 0) << 8 | (bytes[at + 3] ?? 0)) >>> 0;
}
function readPngChunks(bytes) {
	if (!isPng(bytes)) throw new Error("not a PNG");
	const chunks = [];
	let at = 8;
	while (at + 12 <= bytes.length) {
		const length = u32be(bytes, at);
		const type = ascii(bytes, at + 4, 4);
		const end = at + 12 + length;
		if (end > bytes.length) break;
		chunks.push({
			type,
			data: bytes.subarray(at + 8, at + 8 + length)
		});
		at = end;
		if (type === "IEND") break;
	}
	return chunks;
}
function writePngChunks(chunks) {
	const total = 8 + chunks.reduce((sum, c) => sum + 12 + c.data.length, 0);
	const out = new Uint8Array(total);
	out.set(PNG_SIGNATURE, 0);
	let at = 8;
	for (const chunk of chunks) {
		const view = new DataView(out.buffer, out.byteOffset + at);
		view.setUint32(0, chunk.data.length);
		const typeAndData = new Uint8Array(4 + chunk.data.length);
		for (let i = 0; i < 4; i++) typeAndData[i] = chunk.type.charCodeAt(i);
		typeAndData.set(chunk.data, 4);
		out.set(typeAndData, at + 4);
		view.setUint32(8 + chunk.data.length, crc32(typeAndData));
		at += 12 + chunk.data.length;
	}
	return out;
}
var utf8 = new TextDecoder("utf-8", { fatal: true });
var latin1 = new TextDecoder("latin1");
var encoder = new TextEncoder();
function decodeText(bytes) {
	try {
		return utf8.decode(bytes);
	} catch {
		return latin1.decode(bytes);
	}
}
/** tEXt and uncompressed iTXt are decoded; compressed entries are returned for async inflating. */
function readPngText(bytes) {
	const text = {};
	const compressed = [];
	for (const chunk of readPngChunks(bytes)) {
		if (!TEXT_CHUNKS.has(chunk.type)) continue;
		const zero = chunk.data.indexOf(0);
		if (zero <= 0) continue;
		const keyword = latin1.decode(chunk.data.subarray(0, zero));
		if (chunk.type === "tEXt") text[keyword] = decodeText(chunk.data.subarray(zero + 1));
		else if (chunk.type === "zTXt") compressed.push({
			keyword,
			data: chunk.data.subarray(zero + 2)
		});
		else {
			const flag = chunk.data[zero + 1];
			let at = zero + 3;
			const langEnd = chunk.data.indexOf(0, at);
			if (langEnd < 0) continue;
			const translatedEnd = chunk.data.indexOf(0, langEnd + 1);
			if (translatedEnd < 0) continue;
			at = translatedEnd + 1;
			if (flag === 1) compressed.push({
				keyword,
				data: chunk.data.subarray(at)
			});
			else text[keyword] = decodeText(chunk.data.subarray(at));
		}
	}
	return {
		text,
		compressed
	};
}
function isLatin1(value) {
	for (let i = 0; i < value.length; i++) if (value.charCodeAt(i) > 255) return false;
	return true;
}
function textChunk(keyword, value) {
	const key = Array.from(keyword, (ch) => ch.charCodeAt(0) & 255);
	if (isLatin1(value)) {
		const data = new Uint8Array(key.length + 1 + value.length);
		data.set(key, 0);
		for (let i = 0; i < value.length; i++) data[key.length + 1 + i] = value.charCodeAt(i);
		return {
			type: "tEXt",
			data
		};
	}
	const body = encoder.encode(value);
	const data = new Uint8Array(key.length + 5 + body.length);
	data.set(key, 0);
	data.set(body, key.length + 5);
	return {
		type: "iTXt",
		data
	};
}
/** Replaces (or adds) text chunks before IEND; other chunks stay byte-identical. */
function writePngText(bytes, entries) {
	const keywords = new Set(Object.keys(entries));
	const chunks = readPngChunks(bytes).filter((chunk) => {
		if (!TEXT_CHUNKS.has(chunk.type)) return true;
		const zero = chunk.data.indexOf(0);
		return !keywords.has(latin1.decode(chunk.data.subarray(0, Math.max(0, zero))));
	});
	const iend = chunks.findIndex((c) => c.type === "IEND");
	const added = Object.entries(entries).map(([k, v]) => textChunk(k, v));
	chunks.splice(iend < 0 ? chunks.length : iend, 0, ...added);
	return writePngChunks(chunks);
}
/** Drops every metadata chunk (text, EXIF, time). Pixel data is untouched. */
function stripPngMetadata(bytes) {
	return writePngChunks(readPngChunks(bytes).filter((c) => !METADATA_CHUNKS.has(c.type)));
}
function exifPayload(bytes) {
	if (!isWebp(bytes)) return null;
	let at = 12;
	while (at + 8 <= bytes.length) {
		const fourcc = ascii(bytes, at, 4);
		const size = new DataView(bytes.buffer, bytes.byteOffset + at + 4, 4).getUint32(0, true);
		if (fourcc === "EXIF") {
			const data = bytes.subarray(at + 8, at + 8 + size);
			return ascii(data, 0, 6) === "Exif\0\0" ? data.subarray(6) : data;
		}
		at += 8 + size + size % 2;
	}
	return null;
}
/** Reads EXIF UserComment (0x9286) from a TIFF block; falls back to the first JSON object. */
function readExifUserComment(tiff) {
	const order = ascii(tiff, 0, 2);
	if (order !== "II" && order !== "MM") return null;
	const little = order === "II";
	const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
	const u16 = (at) => view.getUint16(at, little);
	const u32 = (at) => view.getUint32(at, little);
	const entries = (ifd) => {
		if (ifd + 2 > tiff.length) return [];
		const count = u16(ifd);
		const list = [];
		for (let i = 0; i < count; i++) {
			const at = ifd + 2 + i * 12;
			if (at + 12 > tiff.length) break;
			const typeSize = [
				0,
				1,
				1,
				2,
				4,
				8,
				1,
				1,
				2,
				4,
				8,
				4,
				8
			][u16(at + 2)] ?? 1;
			const n = u32(at + 4);
			list.push({
				tag: u16(at),
				type: u16(at + 2),
				count: n,
				valueAt: n * typeSize > 4 ? u32(at + 8) : at + 8
			});
		}
		return list;
	};
	try {
		const ifd0 = entries(u32(4));
		const exifPointer = ifd0.find((e) => e.tag === 34665);
		const candidates = exifPointer ? [...entries(u32(exifPointer.valueAt)), ...ifd0] : ifd0;
		const comment = candidates.find((e) => e.tag === 37510) ?? candidates.find((e) => e.tag === 270);
		if (comment) {
			const raw = tiff.subarray(comment.valueAt, comment.valueAt + comment.count);
			const header = ascii(raw, 0, 8);
			if (comment.tag === 37510 && header.startsWith("UNICODE")) return new TextDecoder(little ? "utf-16le" : "utf-16be").decode(raw.subarray(8)).replace(/\0+$/, "");
			return decodeText(comment.tag === 37510 && /^(ASCII|JIS|\0)/.test(header) ? raw.subarray(8) : raw).replace(/\0+$/, "");
		}
	} catch {}
	const text = latin1.decode(tiff);
	const start = text.indexOf("{\"");
	const end = text.lastIndexOf("}");
	return start >= 0 && end > start ? decodeText(tiff.subarray(start, end + 1)) : null;
}
/**
* NovelAI WebP metadata as a text map with the PNG keyword names (Comment, Source, …).
* Returns an empty map when the file carries none.
*/
function readWebpText(bytes) {
	const tiff = exifPayload(bytes);
	if (!tiff) return {};
	const comment = readExifUserComment(tiff);
	if (!comment) return {};
	try {
		const parsed = JSON.parse(comment);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			const result = {};
			for (const [key, value] of Object.entries(parsed)) result[key] = typeof value === "string" ? value : JSON.stringify(value);
			if (!("Comment" in result) && ("prompt" in result || "steps" in result)) return { Comment: comment };
			return result;
		}
	} catch {}
	return { Comment: comment };
}
var V5_FULL_HASHES = ["657484A5", "0ADF9AB7"];
/** Model from the `Source` text (RECON §3.2, §3.3); unknown hashes fall back to the Full variant. */
function modelFromSource(source) {
	if (!source) return void 0;
	const hash = source.trim().split(/\s+/).pop()?.toUpperCase() ?? "";
	if (/Diffusion V5/i.test(source)) return V5_FULL_HASHES.includes(hash) ? "nai-diffusion-5-full" : "nai-diffusion-5-curated";
	if (/Diffusion V4\.5/i.test(source)) return /curated/i.test(source) ? "nai-diffusion-4-5-curated" : "nai-diffusion-4-5-full";
	if (/Diffusion V4\b/i.test(source)) return /curated/i.test(source) ? "nai-diffusion-4-curated-preview" : "nai-diffusion-4-full";
	if (/furry/i.test(source)) return "nai-diffusion-furry-3";
	if (/Stable Diffusion XL|Diffusion V3/i.test(source)) return "nai-diffusion-3";
}
function num$2(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function str$4(value) {
	return typeof value === "string" ? value : "";
}
function obj$2(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
/** Removes the quality suffix the client appended to the first `|` segment. */
function splitQualityTags(prompt, model) {
	const [first = "", ...rest] = prompt.split("|");
	for (const preset of ["standard", "light"]) {
		const suffix = getQualityText(model, preset);
		if (!suffix) continue;
		for (const tail of [`, ${suffix}`, suffix]) {
			const trimmed = first.trimEnd();
			if (trimmed.endsWith(tail)) return {
				prompt: [trimmed.slice(0, trimmed.length - tail.length), ...rest].join("|"),
				preset
			};
		}
	}
	return {
		prompt,
		preset: "none"
	};
}
/** Removes `nsfw, ` and the UC preset the client prepended. */
function splitUcPreset(negative, model) {
	const caps = getCapabilities(model);
	let text = negative.trimStart();
	if (text.startsWith("nsfw, ")) text = text.slice(6);
	for (const preset of caps.ucPresets) {
		const presetText = getUcPresetText(model, preset);
		if (!presetText || !text.startsWith(presetText)) continue;
		return {
			negative: text.slice(presetText.length).replace(/^,\s*/, ""),
			preset
		};
	}
	return {
		negative,
		preset: "none"
	};
}
/** Parses NovelAI metadata (PNG text map or the WebP equivalent). Null when it is not NovelAI. */
function parseNovelAIMetadata(text, fallbackModel) {
	const raw = text.Comment;
	if (!raw) return null;
	let comment;
	try {
		comment = obj$2(JSON.parse(raw));
	} catch {
		return null;
	}
	if (!("prompt" in comment) && !("v4_prompt" in comment) && !("steps" in comment)) return null;
	const model = modelFromSource(text.Source) ?? (isModelId(fallbackModel) ? fallbackModel : void 0);
	const v4 = obj$2(comment.v4_prompt);
	const v4Caption = obj$2(v4.caption);
	const v4Negative = obj$2(obj$2(comment.v4_negative_prompt).caption);
	const basePrompt = str$4(v4Caption.base_caption) || str$4(comment.prompt) || str$4(text.Description);
	const baseNegative = str$4(v4Negative.base_caption) || str$4(comment.uc);
	const quality = model ? splitQualityTags(basePrompt, model) : {
		prompt: basePrompt,
		preset: void 0
	};
	const uc = model ? splitUcPreset(baseNegative, model) : {
		negative: baseNegative,
		preset: void 0
	};
	const charCaptions = Array.isArray(v4Caption.char_captions) ? v4Caption.char_captions.map(obj$2) : [];
	const charNegatives = Array.isArray(v4Negative.char_captions) ? v4Negative.char_captions.map(obj$2) : [];
	const characters = charCaptions.map((caption, i) => {
		const center = obj$2(Array.isArray(caption.centers) ? caption.centers[0] : void 0);
		return {
			prompt: str$4(caption.char_caption),
			negative: str$4(charNegatives[i]?.char_caption),
			x: num$2(center.x) ?? .5,
			y: num$2(center.y) ?? .5
		};
	});
	const result = {
		prompt: quality.prompt,
		negative: uc.negative,
		characters,
		source: text.Source,
		software: text.Software
	};
	if (model) result.model = model;
	if (quality.preset) result.qualityPreset = quality.preset;
	if (uc.preset) result.ucPreset = uc.preset;
	const assign = (key, value) => {
		if (value !== void 0) result[key] = value;
	};
	assign("seed", num$2(comment.seed));
	assign("steps", num$2(comment.steps));
	assign("scale", num$2(comment.scale));
	assign("cfgRescale", num$2(comment.cfg_rescale));
	assign("width", num$2(comment.width));
	assign("height", num$2(comment.height));
	assign("sampler", str$4(comment.sampler) || void 0);
	assign("noiseSchedule", str$4(comment.noise_schedule) || void 0);
	if (typeof comment.sm === "boolean") result.smea = comment.sm;
	if (typeof comment.sm_dyn === "boolean") result.smeaDyn = comment.sm_dyn;
	if ("skip_cfg_above_sigma" in comment) result.varietyBoost = comment.skip_cfg_above_sigma !== null;
	if (typeof v4.use_coords === "boolean") result.useCoords = v4.use_coords;
	assign("requestType", str$4(comment.request_type) || void 0);
	return result;
}
var SOURCE_NAMES = {
	"nai-diffusion-5-full": "NovelAI Diffusion V5 0ADF9AB7",
	"nai-diffusion-5-curated": "NovelAI Diffusion V5",
	"nai-diffusion-4-5-full": "NovelAI Diffusion V4.5 4BDE2A90",
	"nai-diffusion-4-5-curated": "NovelAI Diffusion V4.5 Curated",
	"nai-diffusion-4-full": "NovelAI Diffusion V4",
	"nai-diffusion-4-curated-preview": "NovelAI Diffusion V4 Curated",
	"nai-diffusion-3": "Stable Diffusion XL 7BCCAA2C",
	"nai-diffusion-furry-3": "Stable Diffusion XL Furry"
};
/**
* Text chunks in the NovelAI layout for images whose own metadata was lost (e.g. re-encoded).
* Only fields NAI Studio really sent are written.
*/
function buildNovelAIText(meta) {
	const v4 = meta.model.startsWith("nai-diffusion-4") || meta.model.startsWith("nai-diffusion-5");
	const comment = {
		prompt: meta.prompt,
		steps: meta.steps,
		height: meta.height,
		width: meta.width,
		scale: meta.scale,
		seed: meta.seed,
		sampler: meta.sampler,
		noise_schedule: meta.noiseSchedule,
		cfg_rescale: meta.cfgRescale,
		n_samples: 1,
		uc: meta.negativePrompt,
		request_type: meta.requestType
	};
	if (v4) {
		comment.v4_prompt = {
			caption: {
				base_caption: meta.prompt,
				char_captions: meta.characters.map((c) => ({
					char_caption: c.prompt,
					centers: [{
						x: c.x,
						y: c.y
					}]
				}))
			},
			use_coords: meta.characters.length > 0,
			use_order: true
		};
		comment.v4_negative_prompt = { caption: {
			base_caption: meta.negativePrompt,
			char_captions: meta.characters.map((c) => ({
				char_caption: c.negative,
				centers: [{
					x: c.x,
					y: c.y
				}]
			}))
		} };
	}
	return {
		Title: "AI generated image",
		Description: meta.prompt,
		Software: "NovelAI",
		Source: SOURCE_NAMES[meta.model] ?? meta.model,
		Comment: JSON.stringify(comment)
	};
}
//#endregion
//#region src/domain/gallery.ts
function emptyQuery() {
	return {
		text: "",
		model: "",
		character: "",
		chatId: "",
		from: "",
		to: "",
		favoritesOnly: false,
		sort: "newest"
	};
}
/** Prompt tags (comma-separated, weights and braces removed) for search and the tag filter. */
function promptTags(prompt) {
	return prompt.split(/[,|\n]/).map((t) => t.replace(/-?\d+(\.\d+)?::/g, "").replace(/::/g, "").replace(/[{}[\]()]/g, "").trim().replace(/:\s*[\d.]+$/, "").toLowerCase()).filter(Boolean);
}
function haystack(record) {
	const m = record.meta;
	return [
		m.scenePrompt,
		m.prompt,
		m.sourcePrompt ?? "",
		m.negative,
		record.characterName,
		record.tags.join(" "),
		String(m.seed),
		m.model,
		m.tool ?? ""
	].join("\n").toLowerCase();
}
/** Every word of the query must appear somewhere (prompt, tags, seed, character, model). */
function matchesQuery(record, query) {
	if (query.favoritesOnly && !record.favorite) return false;
	if (query.model && record.meta.model !== query.model) return false;
	if (query.character && record.characterName !== query.character) return false;
	if (query.chatId && record.chatId !== query.chatId) return false;
	const day = record.createdAt.slice(0, 10);
	if (query.from && day < query.from) return false;
	if (query.to && day > query.to) return false;
	const words = query.text.toLowerCase().split(/\s+/).filter(Boolean);
	if (!words.length) return true;
	const text = haystack(record);
	return words.every((w) => text.includes(w));
}
function filterRecords(records, query) {
	const list = records.filter((r) => matchesQuery(r, query));
	list.sort((a, b) => (query.sort === "oldest" ? 1 : -1) * a.createdAt.localeCompare(b.createdAt));
	return list;
}
/** Distinct values for the filter dropdowns. */
function facets(records) {
	const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
	return {
		models: unique(records.map((r) => r.meta.model)),
		characters: unique(records.map((r) => r.characterName)),
		chats: unique(records.map((r) => r.chatId))
	};
}
/** Field-by-field differences of two generations, for the side-by-side comparison. */
function compareMeta(a, b) {
	return [
		"model",
		"seed",
		"width",
		"height",
		"steps",
		"scale",
		"cfgRescale",
		"sampler",
		"noiseSchedule",
		"ucPreset",
		"qualityPreset",
		"prompt",
		"negativePrompt"
	].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
}
//#endregion
//#region src/domain/passport.ts
var PASSPORT_SLOTS = [
	"base",
	"hair",
	"eyes",
	"body",
	"skin",
	"clothing",
	"accessories",
	"style"
];
/** What a passport describes; only characters take part in scenes, the rest add setting tags. */
var PASSPORT_KINDS = [
	"character",
	"world",
	"location",
	"scenario",
	"object"
];
/** Built-in state modifiers (names are localized as naist.state.<id>). */
var STATE_PRESETS = {
	wet: "wet, wet hair, wet clothes",
	messy: "messy hair, disheveled",
	tears: "tears, crying",
	blush: "blush, embarrassed",
	injured: "injury, bandages, bruise",
	sleepy: "sleepy, half-closed eyes",
	angry: "angry, frown",
	happy: "smile, happy"
};
function newPassportId() {
	return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
function defaultPassport(kind = "character", name = "", id = newPassportId()) {
	return {
		version: 1,
		id,
		kind,
		name,
		aliases: [],
		tags: "",
		slots: {
			base: "",
			hair: "",
			eyes: "",
			body: "",
			skin: "",
			clothing: "",
			accessories: "",
			style: ""
		},
		nsfw: {
			enabled: false,
			tags: ""
		},
		outfits: [],
		activeOutfit: "",
		states: Object.entries(STATE_PRESETS).map(([id, tags]) => ({
			id,
			tags,
			enabled: false
		})),
		negative: "",
		pose: {
			preset: "",
			custom: ""
		},
		position: null
	};
}
function str$3(value) {
	return typeof value === "string" ? value : "";
}
function obj$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
function unit(value, fallback) {
	const n = Number(value);
	return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
}
/** The Cyrillic "yo" and "ye" (U+0451, U+0435): a tracker writes either. */
var YO = new RegExp(String.fromCharCode(1105), "g");
var YE = String.fromCharCode(1077);
/**
* A wording reduced for comparison: lower case, "yo" as "ye", punctuation (quotes, dashes, Russian
* ones too) and runs of spaces as one space.
*/
function lookKey(text) {
	return text.normalize("NFKC").toLowerCase().replace(YO, YE).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
/** Defensive parse of an outfit's tracker wordings: strings, trimmed, cut, no duplicates, the newest kept. */
function normalizeOutfitLooks(raw) {
	if (!Array.isArray(raw)) return [];
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const item of raw) {
		if (typeof item !== "string") continue;
		const look = item.trim().slice(0, 300).trim();
		const key = lookKey(look);
		if (!key || seen.has(key)) continue;
		seen.add(key);
		result.push(look);
	}
	return result.slice(-12);
}
/** Defensive parse of a stored outfit; `looks` only when there are some. */
function normalizeOutfit(raw) {
	const source = obj$1(raw);
	const looks = normalizeOutfitLooks(source.looks);
	return {
		name: str$3(source.name).trim(),
		tags: str$3(source.tags),
		...looks.length ? { looks } : {}
	};
}
/** Words of a reduced wording (two letters or more). */
function lookWords(key) {
	return new Set(key.split(" ").filter((word) => [...word].length >= 2));
}
function jaccard(a, b) {
	if (!a.size || !b.size) return 0;
	let common = 0;
	for (const item of a) if (b.has(item)) common++;
	return common / (a.size + b.size - common);
}
/**
* The outfit a current look of a scene tracker stands for (v0.12.1): the outfit whose recorded wordings
* (`looks`) say the same, exactly after lookKey first, else by word sets (Jaccard >= 0.75). A tracker
* joins several fields into one look ("appearance; outfit; status"), so the look and each of its parts
* are compared. '' when none fits, or for a passport that is not a character.
*/
function outfitForLook(passport, look) {
	if (!passport || passport.kind !== "character" || typeof look !== "string" || !look.trim()) return "";
	const outfits = passport.outfits.filter((o) => o.name && o.looks?.length);
	if (!outfits.length) return "";
	const parts = look.split(/[;\n]+/);
	const keys = [...new Set([look, ...parts.length > 1 ? parts : []].map(lookKey).filter(Boolean))];
	for (const outfit of outfits) {
		const recorded = new Set((outfit.looks ?? []).map(lookKey));
		if (keys.some((key) => recorded.has(key))) return outfit.name;
	}
	const words = keys.map(lookWords);
	let best = "";
	let bestScore = 0;
	for (const outfit of outfits) for (const wording of outfit.looks ?? []) {
		const recorded = lookWords(lookKey(wording));
		for (const set of words) {
			const score = jaccard(set, recorded);
			if (score >= .75 && score > bestScore) {
				best = outfit.name;
				bestScore = score;
			}
		}
	}
	return best;
}
/** Defensive parse of a stored passport (hand-edited cards, older versions). Null when absent. */
function normalizePassport(raw) {
	if (raw === null || raw === void 0 || typeof raw !== "object" || Array.isArray(raw)) return null;
	const source = obj$1(raw);
	const result = defaultPassport(PASSPORT_KINDS.includes(str$3(source.kind)) ? source.kind : "character", str$3(source.name).trim(), str$3(source.id).trim() || "main");
	result.aliases = (Array.isArray(source.aliases) ? source.aliases.map(str$3) : str$3(source.aliases).split(",")).map((a) => a.trim()).filter(Boolean);
	result.tags = str$3(source.tags);
	const slots = obj$1(source.slots);
	for (const slot of PASSPORT_SLOTS) result.slots[slot] = str$3(slots[slot]);
	const nsfw = obj$1(source.nsfw);
	result.nsfw = {
		enabled: nsfw.enabled === true,
		tags: str$3(nsfw.tags)
	};
	result.outfits = (Array.isArray(source.outfits) ? source.outfits : []).map(normalizeOutfit).filter((o) => o.name);
	result.activeOutfit = result.outfits.some((o) => o.name === str$3(source.activeOutfit)) ? str$3(source.activeOutfit) : "";
	if (Array.isArray(source.states)) {
		const stored = source.states.map(obj$1).map((s) => ({
			id: str$3(s.id).trim(),
			tags: str$3(s.tags),
			enabled: s.enabled === true
		}));
		const byId = new Map(stored.filter((s) => s.id).map((s) => [s.id, s]));
		result.states = [...result.states.map((preset) => byId.get(preset.id) ?? preset), ...stored.filter((s) => s.id && !(s.id in STATE_PRESETS))];
	}
	result.negative = str$3(source.negative);
	const pose = obj$1(source.pose);
	result.pose = {
		preset: str$3(pose.preset),
		custom: str$3(pose.custom)
	};
	const position = obj$1(source.position);
	result.position = source.position && typeof source.position === "object" ? {
		x: unit(position.x, .5),
		y: unit(position.y, .5)
	} : null;
	return result;
}
/**
* The passports of a card: the list (v0.8) or the single legacy passport. Ids are made unique so
* every passport can be addressed.
*/
function normalizePassportList(list, legacy) {
	const raw = Array.isArray(list) ? list : legacy !== void 0 && legacy !== null ? [legacy] : [];
	const result = [];
	const ids = /* @__PURE__ */ new Set();
	for (const item of raw) {
		const passport = normalizePassport(item);
		if (!passport) continue;
		let id = passport.id;
		for (let n = 2; ids.has(id); n++) id = `${passport.id}-${n}`;
		passport.id = id;
		ids.add(id);
		result.push(passport);
	}
	return result;
}
/** The passport that stands for the card itself: unnamed or named like the card, else the first character. */
function primaryPassport(list, cardName) {
	const people = list.filter((p) => p.kind === "character");
	const name = cardName.trim().toLowerCase();
	return people.find((p) => !p.name || p.name.trim().toLowerCase() === name) ?? people[0] ?? null;
}
/** Splits a tag string, trims, drops empties and case-insensitive duplicates (first wins). */
function splitTags(text) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const raw of text.split(/,|\n/)) {
		const tag = raw.trim();
		const key = tag.toLowerCase();
		if (!tag || seen.has(key)) continue;
		seen.add(key);
		result.push(tag);
	}
	return result;
}
function joinTags(...parts) {
	return splitTags(parts.filter(Boolean).join(", ")).join(", ");
}
/** Explicit anatomy (v0.9.8): it belongs to the NSFW layer and stays out of other scenes. */
var EXPLICIT_ANATOMY = /(^|\s)(futanari|futa|dickgirl|penis|testicles?|erection|flaccid|foreskin|pussy|vagina|clitoris|nipples?|areolae?|pubic hair)(\s|$)/i;
function isExplicitAnatomy(tag) {
	return EXPLICIT_ANATOMY.test(tag);
}
/** A futanari: the tag in the NSFW layer or in any slot. */
function isFutanari(passport) {
	return splitTags([passport.nsfw.tags, ...PASSPORT_SLOTS.map((slot) => passport.slots[slot])].join(", ")).some((tag) => /^(futanari|futa|dickgirl)$/i.test(tag));
}
/** Moves explicit anatomy from the slots and outfits into the NSFW layer. */
function moveExplicitAnatomy(passport) {
	const moved = [];
	const keep = (text) => splitTags(text).filter((tag) => isExplicitAnatomy(tag) ? (moved.push(tag), false) : true).join(", ");
	for (const slot of PASSPORT_SLOTS) if (slot !== "style") passport.slots[slot] = keep(passport.slots[slot]);
	passport.outfits = passport.outfits.map((o) => ({
		...o,
		tags: keep(o.tags)
	}));
	if (moved.length) passport.nsfw = {
		...passport.nsfw,
		tags: joinTags(passport.nsfw.tags, ...moved)
	};
}
/** Tags of the clothing slot or the chosen outfit. */
function clothingTags(passport, outfit) {
	const name = outfit ?? passport.activeOutfit;
	const found = passport.outfits.find((o) => o.name === name);
	return found ? found.tags : passport.slots.clothing;
}
/**
* The passport as one tag list in a stable order: base, hair, eyes, body, skin, clothing/outfit,
* accessories, states, NSFW layer, art style.
*/
function passportTags(passport, options) {
	if (passport.kind !== "character") return joinTags(passport.tags);
	const states = passport.states.filter((s) => s.enabled || options.states?.includes(s.id)).map((s) => s.tags);
	const layer = options.allowNsfw && passport.nsfw.enabled;
	const nsfw = layer ? passport.nsfw.tags : "";
	const tags = joinTags(passport.slots.base, passport.slots.hair, passport.slots.eyes, passport.slots.body, passport.slots.skin, options.withoutClothing ? "" : clothingTags(passport, options.outfit), passport.slots.accessories, ...states, nsfw, passport.slots.style);
	return layer ? tags : splitTags(tags).filter((tag) => !isExplicitAnatomy(tag)).join(", ");
}
function isPassportEmpty(passport) {
	if (!passport) return true;
	if (passport.kind !== "character") return !passport.tags.trim();
	return PASSPORT_SLOTS.every((slot) => !passport.slots[slot].trim()) && !passport.outfits.length && !passport.nsfw.tags.trim();
}
//#endregion
//#region src/domain/passport-overrides.ts
function emptyChatPassports() {
	return {
		overrides: {},
		extra: []
	};
}
function obj(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
}
var isString = (value) => typeof value === "string";
var sameStrings = (a, b) => a.length === b.length && a.every((item, i) => item === b[i]);
var sameOutfits = (a, b) => a.length === b.length && a.every((o, i) => o.name === b[i]?.name && o.tags === b[i]?.tags && sameStrings(o.looks ?? [], b[i]?.looks ?? []));
/** A copy of an outfit (its tracker wordings too, v0.12.1). */
var outfitCopy = (o) => ({
	...o,
	...o.looks ? { looks: [...o.looks] } : {}
});
var samePosition = (a, b) => a === null || b === null ? a === b : a.x === b.x && a.y === b.y;
/** The fields of `edited` that differ from `base` (an empty object when nothing changed). */
function passportDiff(base, edited) {
	const diff = {};
	if (edited.name !== base.name) diff.name = edited.name;
	if (edited.kind !== base.kind) diff.kind = edited.kind;
	if (!sameStrings(edited.aliases, base.aliases)) diff.aliases = [...edited.aliases];
	if (edited.tags !== base.tags) diff.tags = edited.tags;
	const slots = {};
	for (const slot of PASSPORT_SLOTS) if (edited.slots[slot] !== base.slots[slot]) slots[slot] = edited.slots[slot];
	if (Object.keys(slots).length) diff.slots = slots;
	const nsfw = {};
	if (edited.nsfw.enabled !== base.nsfw.enabled) nsfw.enabled = edited.nsfw.enabled;
	if (edited.nsfw.tags !== base.nsfw.tags) nsfw.tags = edited.nsfw.tags;
	if (Object.keys(nsfw).length) diff.nsfw = nsfw;
	if (!sameOutfits(edited.outfits, base.outfits)) diff.outfits = edited.outfits.map(outfitCopy);
	if (edited.activeOutfit !== base.activeOutfit) diff.activeOutfit = edited.activeOutfit;
	const states = edited.states.filter((state) => {
		const original = base.states.find((s) => s.id === state.id);
		return !original || original.tags !== state.tags || original.enabled !== state.enabled;
	});
	if (states.length) diff.states = states.map((s) => ({ ...s }));
	if (edited.negative !== base.negative) diff.negative = edited.negative;
	if (edited.pose.preset !== base.pose.preset || edited.pose.custom !== base.pose.custom) diff.pose = { ...edited.pose };
	if (!samePosition(edited.position, base.position)) diff.position = edited.position ? { ...edited.position } : null;
	return diff;
}
/** No field is overridden (the owner alone does not count). */
function isOverrideEmpty(override) {
	return !override || Object.keys(override).every((key) => key === "owner");
}
/** The passport as the chat sees it: a new copy, the base untouched. */
function applyPassportOverride(base, override) {
	if (isOverrideEmpty(override)) return normalizePassport(base) ?? base;
	const o = override;
	const states = base.states.map((s) => ({ ...s }));
	for (const state of o.states ?? []) {
		const at = states.findIndex((s) => s.id === state.id);
		if (at >= 0) states[at] = { ...state };
		else states.push({ ...state });
	}
	const result = normalizePassport({
		...base,
		name: o.name ?? base.name,
		kind: o.kind ?? base.kind,
		aliases: o.aliases ?? base.aliases,
		tags: o.tags ?? base.tags,
		slots: {
			...base.slots,
			...o.slots
		},
		nsfw: {
			...base.nsfw,
			...o.nsfw
		},
		outfits: o.outfits ?? base.outfits,
		activeOutfit: o.activeOutfit ?? base.activeOutfit,
		states,
		negative: o.negative ?? base.negative,
		pose: o.pose ?? base.pose,
		position: "position" in o ? o.position ?? null : base.position
	}) ?? base;
	result.id = base.id;
	return result;
}
/** Defensive parse of a stored override (hand-edited metadata, newer versions); null when unusable. */
function normalizeOverride(raw) {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
	const source = obj(raw);
	const result = {};
	if (isString(source.owner) && source.owner.trim()) result.owner = source.owner.trim();
	if (isString(source.name)) result.name = source.name;
	if (PASSPORT_KINDS.includes(source.kind)) result.kind = source.kind;
	if (Array.isArray(source.aliases)) result.aliases = source.aliases.filter(isString);
	if (isString(source.tags)) result.tags = source.tags;
	const slots = {};
	const rawSlots = obj(source.slots);
	for (const slot of PASSPORT_SLOTS) if (isString(rawSlots[slot])) slots[slot] = rawSlots[slot];
	if (Object.keys(slots).length) result.slots = slots;
	const rawNsfw = obj(source.nsfw);
	const nsfw = {};
	if (typeof rawNsfw.enabled === "boolean") nsfw.enabled = rawNsfw.enabled;
	if (isString(rawNsfw.tags)) nsfw.tags = rawNsfw.tags;
	if (Object.keys(nsfw).length) result.nsfw = nsfw;
	if (Array.isArray(source.outfits)) result.outfits = source.outfits.map(normalizeOutfit).filter((o) => o.name);
	if (isString(source.activeOutfit)) result.activeOutfit = source.activeOutfit;
	if (Array.isArray(source.states)) {
		const states = source.states.map(obj).filter((s) => isString(s.id) && s.id.trim()).map((s) => ({
			id: String(s.id).trim(),
			tags: isString(s.tags) ? s.tags : "",
			enabled: s.enabled === true
		}));
		if (states.length) result.states = states;
	}
	if (isString(source.negative)) result.negative = source.negative;
	if (typeof source.pose === "object" && source.pose !== null) {
		const pose = obj(source.pose);
		result.pose = {
			preset: isString(pose.preset) ? pose.preset : "",
			custom: isString(pose.custom) ? pose.custom : ""
		};
	}
	if ("position" in source) {
		const position = obj(source.position);
		const x = Number(position.x);
		const y = Number(position.y);
		result.position = source.position && Number.isFinite(x) && Number.isFinite(y) ? {
			x: Math.min(1, Math.max(0, x)),
			y: Math.min(1, Math.max(0, y))
		} : null;
	}
	return result;
}
/** Defensive parse of chat_metadata.nai_studio.passports. */
function normalizeChatPassports(raw) {
	const source = obj(raw);
	const overrides = {};
	for (const [id, value] of Object.entries(obj(source.overrides))) {
		const override = normalizeOverride(value);
		if (id.trim() && override && !isOverrideEmpty(override)) overrides[id] = override;
	}
	return {
		overrides,
		extra: normalizePassportList(source.extra)
	};
}
/**
* The passport with the chat's override applied, when the override is for it (same id and, when the
* override names one, the same owner). The base itself when there is none.
*/
function resolveChatPassport(passport, owner, data) {
	const override = Object.prototype.hasOwnProperty.call(data.overrides, passport.id) ? data.overrides[passport.id] : void 0;
	if (!override || override.owner && owner && override.owner !== owner) return passport;
	return applyPassportOverride(passport, override);
}
//#endregion
//#region src/domain/scene-hints.ts
var HINT_FIELDS = [
	"locationId",
	"locationName",
	"tags",
	"characters"
];
function text$2(value) {
	if (typeof value !== "string") return void 0;
	return value.trim() || void 0;
}
/** Defensive parse of what a provider returned; null when it says nothing usable. */
function normalizeSceneHint(raw) {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
	const source = raw;
	const hint = {};
	const locationId = text$2(source.locationId);
	if (locationId) hint.locationId = locationId;
	const locationName = text$2(source.locationName);
	if (locationName) hint.locationName = locationName;
	const tags = Array.isArray(source.tags) ? text$2(source.tags.filter((t) => typeof t === "string").join(", ")) : text$2(source.tags);
	if (tags) hint.tags = tags;
	if (Array.isArray(source.characters)) {
		const seen = /* @__PURE__ */ new Set();
		const names = source.characters.map(text$2).filter((name) => {
			if (!name || seen.has(name.toLowerCase())) return false;
			seen.add(name.toLowerCase());
			return true;
		});
		if (names.length) hint.characters = names;
	}
	return HINT_FIELDS.some((field) => hint[field] !== void 0) ? hint : null;
}
/** Hints in priority order (best first): each field from the first hint that has it. */
function mergeSceneHints(ordered) {
	const result = {};
	for (const hint of ordered) {
		if (!hint) continue;
		if (result.locationId === void 0 && hint.locationId) result.locationId = hint.locationId;
		if (result.locationName === void 0 && hint.locationName) result.locationName = hint.locationName;
		if (result.tags === void 0 && hint.tags) result.tags = hint.tags;
		if (result.characters === void 0 && hint.characters?.length) result.characters = [...hint.characters];
	}
	return result;
}
/** Providers sorted by priority, highest first; equal priorities keep their registration order. */
function byPriority(providers) {
	return providers.map((provider, index) => ({
		provider,
		index
	})).sort((a, b) => b.provider.priority - a.provider.priority || a.index - b.index).map(({ provider }) => provider);
}
//#endregion
//#region src/domain/poses.ts
/** Non-English keywords live in a data file (source files stay free of non-ASCII UI text). */
var EXTRA_KEYWORDS = {
	poses: {
		"standing": ["стоит", "стоя"],
		"hands_on_hips": ["руки в боки"],
		"leaning_wall": ["прислонил"],
		"walking": [
			"идёт",
			"идет",
			"шагает"
		],
		"sitting": [
			"сидит",
			"сидя",
			"села",
			"сел "
		],
		"sitting_chair": ["на стул", "в кресл"],
		"sitting_floor": ["на полу"],
		"crossed_legs": ["закинув ногу"],
		"squatting": [
			"на корточк",
			"присела",
			"присел"
		],
		"lying": [
			"лежит",
			"лёжа",
			"лежа"
		],
		"on_back": ["на спине"],
		"on_stomach": ["на животе"],
		"on_side": ["на боку"],
		"sleeping": ["спит", "уснул"],
		"kneeling": ["на колен"],
		"on_one_knee": ["на одно колено"],
		"from_behind": ["спиной", "отвернул"],
		"looking_back": ["через плечо", "оглядыва"],
		"looking_at_viewer": ["смотрит на тебя", "смотрит на вас"],
		"looking_away": ["отводит взгляд", "отвела взгляд"],
		"looking_up": ["поднимает взгляд", "смотрит вверх"],
		"looking_down": ["опускает взгляд", "смотрит вниз"],
		"crossed_arms": ["скрестил"],
		"arms_up": ["поднимает руки"],
		"arms_behind_back": ["руки за спин"],
		"hand_on_chin": ["подпирает подбородок"],
		"waving": ["машет"],
		"running": ["бежит", "бегут"],
		"jumping": ["прыга"],
		"leaning_forward": ["наклоняется", "наклонилась"],
		"stretching": ["потягива"],
		"reading": ["читает"],
		"eating": ["ест ", "кушает"],
		"drinking": [
			"пьёт",
			"пьет",
			"отпивает"
		],
		"fighting_stance": ["боевую стойку", "боевой стойке"]
	},
	pairs: {
		"auto": [
			"обнимает",
			"обняла",
			"обнял"
		],
		"hug_from_behind": ["обнимает сзади"],
		"holding_hands": ["за руку", "держатся за руки"],
		"back_to_back": ["спиной к спине"],
		"princess_carry": ["несёт на руках", "несет на руках"],
		"piggyback": ["на спине несёт", "на закорках"],
		"headpat": ["гладит по голове"],
		"high_five": ["дай пять"],
		"face_to_face": ["лицом к лицу"],
		"eye_contact": ["встречаются взглядами"],
		"sitting_on_lap": ["на коленях у"],
		"dancing": ["танцуют"],
		"fighting": ["сражаются", "дерутся"]
	}
};
var POSE_CATEGORIES = [
	"standing",
	"sitting",
	"lying",
	"kneeling",
	"back",
	"gaze",
	"arms",
	"action"
];
var POSES = [
	{
		id: "standing",
		category: "standing",
		tags: "standing",
		keywords: ["stands", "standing"]
	},
	{
		id: "contrapposto",
		category: "standing",
		tags: "standing, contrapposto",
		keywords: []
	},
	{
		id: "hands_on_hips",
		category: "standing",
		tags: "standing, hands on hips",
		keywords: ["hands on her hips", "hands on his hips"]
	},
	{
		id: "leaning_wall",
		category: "standing",
		tags: "standing, against wall, leaning back",
		keywords: ["leans against"]
	},
	{
		id: "walking",
		category: "standing",
		tags: "walking",
		keywords: ["walks", "walking"]
	},
	{
		id: "sitting",
		category: "sitting",
		tags: "sitting",
		keywords: [
			"sits",
			"sitting",
			"sat down"
		]
	},
	{
		id: "sitting_chair",
		category: "sitting",
		tags: "sitting, on chair",
		keywords: ["on a chair", "in a chair"]
	},
	{
		id: "sitting_floor",
		category: "sitting",
		tags: "sitting, on floor",
		keywords: ["on the floor"]
	},
	{
		id: "crossed_legs",
		category: "sitting",
		tags: "sitting, crossed legs",
		keywords: ["crosses her legs", "crossed legs"]
	},
	{
		id: "seiza",
		category: "sitting",
		tags: "seiza",
		keywords: ["seiza"]
	},
	{
		id: "squatting",
		category: "sitting",
		tags: "squatting",
		keywords: ["squats", "squatting"]
	},
	{
		id: "lying",
		category: "lying",
		tags: "lying",
		keywords: ["lies", "lying"]
	},
	{
		id: "on_back",
		category: "lying",
		tags: "lying, on back",
		keywords: ["on her back", "on his back"]
	},
	{
		id: "on_stomach",
		category: "lying",
		tags: "lying, on stomach",
		keywords: ["on her stomach", "on his stomach"]
	},
	{
		id: "on_side",
		category: "lying",
		tags: "lying, on side",
		keywords: ["on her side", "on his side"]
	},
	{
		id: "sleeping",
		category: "lying",
		tags: "sleeping, closed eyes",
		keywords: [
			"sleeps",
			"asleep",
			"sleeping"
		]
	},
	{
		id: "kneeling",
		category: "kneeling",
		tags: "kneeling",
		keywords: ["kneels", "kneeling"]
	},
	{
		id: "on_one_knee",
		category: "kneeling",
		tags: "on one knee",
		keywords: ["one knee"]
	},
	{
		id: "from_behind",
		category: "back",
		tags: "from behind",
		keywords: ["turns away", "turned away"]
	},
	{
		id: "looking_back",
		category: "back",
		tags: "from behind, looking back",
		keywords: [
			"looks back",
			"over her shoulder",
			"over his shoulder"
		]
	},
	{
		id: "looking_at_viewer",
		category: "gaze",
		tags: "looking at viewer",
		keywords: ["looks at you", "looking at you"]
	},
	{
		id: "looking_away",
		category: "gaze",
		tags: "looking away",
		keywords: ["looks away"]
	},
	{
		id: "looking_up",
		category: "gaze",
		tags: "looking up",
		keywords: ["looks up"]
	},
	{
		id: "looking_down",
		category: "gaze",
		tags: "looking down",
		keywords: ["looks down"]
	},
	{
		id: "crossed_arms",
		category: "arms",
		tags: "crossed arms",
		keywords: [
			"crosses her arms",
			"crosses his arms",
			"arms crossed"
		]
	},
	{
		id: "arms_up",
		category: "arms",
		tags: "arms up",
		keywords: ["raises her arms", "raises his arms"]
	},
	{
		id: "arms_behind_back",
		category: "arms",
		tags: "arms behind back",
		keywords: ["hands behind her back"]
	},
	{
		id: "hand_on_chin",
		category: "arms",
		tags: "hand on own chin",
		keywords: ["hand on her chin"]
	},
	{
		id: "waving",
		category: "arms",
		tags: "waving",
		keywords: ["waves", "waving"]
	},
	{
		id: "peace_sign",
		category: "arms",
		tags: "v",
		keywords: ["peace sign"]
	},
	{
		id: "running",
		category: "action",
		tags: "running",
		keywords: ["runs", "running"]
	},
	{
		id: "jumping",
		category: "action",
		tags: "jumping",
		keywords: ["jumps", "jumping"]
	},
	{
		id: "leaning_forward",
		category: "action",
		tags: "leaning forward",
		keywords: ["leans forward", "leans closer"]
	},
	{
		id: "stretching",
		category: "action",
		tags: "stretching",
		keywords: ["stretches"]
	},
	{
		id: "reading",
		category: "action",
		tags: "reading, holding book",
		keywords: ["reads", "reading"]
	},
	{
		id: "eating",
		category: "action",
		tags: "eating",
		keywords: ["eats", "eating"]
	},
	{
		id: "drinking",
		category: "action",
		tags: "drinking, holding cup",
		keywords: ["drinks", "sips"]
	},
	{
		id: "fighting_stance",
		category: "action",
		tags: "fighting stance",
		keywords: ["fighting stance"]
	}
].map((pose) => ({
	...pose,
	keywords: [...pose.keywords, ...EXTRA_KEYWORDS.poses[pose.id] ?? []]
}));
var FRAMINGS = [
	{
		id: "auto",
		tags: ""
	},
	{
		id: "portrait",
		tags: "portrait"
	},
	{
		id: "upper_body",
		tags: "upper body"
	},
	{
		id: "cowboy_shot",
		tags: "cowboy shot"
	},
	{
		id: "full_body",
		tags: "full body"
	}
];
var CAMERA_ANGLES = [
	{
		id: "auto",
		tags: ""
	},
	{
		id: "from_above",
		tags: "from above"
	},
	{
		id: "from_below",
		tags: "from below"
	},
	{
		id: "from_side",
		tags: "from side"
	},
	{
		id: "straight_on",
		tags: "straight-on"
	},
	{
		id: "dutch_angle",
		tags: "dutch angle"
	},
	{
		id: "pov",
		tags: "pov"
	}
];
var DISTANCES = [
	{
		id: "auto",
		tags: ""
	},
	{
		id: "close_up",
		tags: "close-up"
	},
	{
		id: "wide_shot",
		tags: "wide shot"
	},
	{
		id: "very_wide_shot",
		tags: "very wide shot"
	}
];
var PAIR_POSES = [
	{
		id: "hug",
		tag: "hug",
		kind: "directed",
		layout: [{
			x: .4,
			y: .5
		}, {
			x: .6,
			y: .5
		}],
		keywords: ["hugs", "embraces"]
	},
	{
		id: "hug_from_behind",
		tag: "hug from behind",
		kind: "directed",
		layout: [{
			x: .5,
			y: .5
		}, {
			x: .5,
			y: .5
		}],
		keywords: ["hugs her from behind", "hugs him from behind"]
	},
	{
		id: "holding_hands",
		tag: "holding hands",
		kind: "mutual",
		layout: [{
			x: .3,
			y: .5
		}, {
			x: .7,
			y: .5
		}],
		keywords: [
			"holding hands",
			"takes her hand",
			"takes his hand"
		]
	},
	{
		id: "back_to_back",
		tag: "back-to-back",
		kind: "mutual",
		layout: [{
			x: .3,
			y: .5
		}, {
			x: .7,
			y: .5
		}],
		keywords: ["back to back"]
	},
	{
		id: "princess_carry",
		tag: "princess carry",
		kind: "directed",
		layout: [{
			x: .5,
			y: .5
		}, {
			x: .5,
			y: .3
		}],
		keywords: ["carries her", "on his arms"]
	},
	{
		id: "piggyback",
		tag: "piggyback",
		kind: "directed",
		layout: [{
			x: .5,
			y: .7
		}, {
			x: .5,
			y: .3
		}],
		keywords: ["piggyback"]
	},
	{
		id: "headpat",
		tag: "headpat",
		kind: "directed",
		layout: [{
			x: .3,
			y: .3
		}, {
			x: .7,
			y: .5
		}],
		keywords: ["pats her head", "pats his head"]
	},
	{
		id: "high_five",
		tag: "high five",
		kind: "mutual",
		layout: [{
			x: .3,
			y: .5
		}, {
			x: .7,
			y: .5
		}],
		keywords: ["high five"]
	},
	{
		id: "face_to_face",
		tag: "face-to-face",
		kind: "mutual",
		layout: [{
			x: .3,
			y: .5
		}, {
			x: .7,
			y: .5
		}],
		keywords: ["face to face"]
	},
	{
		id: "eye_contact",
		tag: "eye contact",
		kind: "mutual",
		layout: [{
			x: .3,
			y: .5
		}, {
			x: .7,
			y: .5
		}],
		keywords: ["eyes meet"]
	},
	{
		id: "sitting_on_lap",
		tag: "sitting on lap",
		kind: "directed",
		layout: [{
			x: .5,
			y: .3
		}, {
			x: .5,
			y: .7
		}],
		keywords: ["on his lap", "on her lap"]
	},
	{
		id: "dancing",
		tag: "dancing",
		kind: "mutual",
		layout: [{
			x: .4,
			y: .5
		}, {
			x: .6,
			y: .5
		}],
		keywords: ["dance together", "dancing with"]
	},
	{
		id: "fighting",
		tag: "fighting",
		kind: "mutual",
		layout: [{
			x: .3,
			y: .5
		}, {
			x: .7,
			y: .5
		}],
		keywords: ["fight each other"]
	}
].map((pose) => ({
	...pose,
	keywords: [...pose.keywords, ...EXTRA_KEYWORDS.pairs[pose.id] ?? []]
}));
function findPose(id, custom = []) {
	return custom.find((p) => p.id === id) ?? POSES.find((p) => p.id === id);
}
function findPairPose(id) {
	return PAIR_POSES.find((p) => p.id === id);
}
function containsKeyword(text, keywords) {
	const lower = ` ${text.toLowerCase()} `;
	let best = -1;
	for (const keyword of keywords) {
		const index = lower.indexOf(keyword.toLowerCase());
		if (index >= 0 && (best < 0 || index < best)) best = index;
	}
	return best;
}
/** First pose whose keyword appears in the text (earliest mention wins). */
function detectPose(text, library = POSES) {
	let found = null;
	let at = Number.POSITIVE_INFINITY;
	for (const pose of library) {
		const index = containsKeyword(text, pose.keywords);
		if (index >= 0 && index < at) {
			at = index;
			found = pose;
		}
	}
	return found;
}
function detectPairPose(text) {
	let found = null;
	let at = Number.POSITIVE_INFINITY;
	for (const pose of PAIR_POSES) {
		const index = containsKeyword(text, pose.keywords);
		if (index >= 0 && index < at) {
			at = index;
			found = pose;
		}
	}
	return found;
}
/**
* Per-participant tags of a pair pose. With interaction support (V4+ character prompts) the first
* participant is the source, the second the target; otherwise both get the plain tag.
*/
function pairPoseTags(pose, interactions) {
	if (!interactions) return [pose.tag, pose.tag];
	if (pose.kind === "mutual") return [`mutual#${pose.tag}`, `mutual#${pose.tag}`];
	return [`source#${pose.tag}`, `target#${pose.tag}`];
}
function optionTags(options, id) {
	return options.find((o) => o.id === id)?.tags ?? "";
}
//#endregion
//#region src/domain/scene-assembly.ts
function escapeRegExp$3(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
/** Earliest whole-word mention of a name or alias (Unicode letters), -1 when absent. */
function mentionIndex(text, names) {
	let best = -1;
	for (const name of names) {
		const trimmed = name.trim();
		if (trimmed.length < 2) continue;
		const match = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp$3(trimmed)}(?=$|[^\\p{L}\\p{N}])`, "iu").exec(text);
		if (match && (best < 0 || match.index < best)) best = match.index;
	}
	return best >= 0 ? best : soundMentionIndex(text, names);
}
/** Latin letters of the Russian alphabet from U+0430 (a) to U+044F (ya); U+0451 (yo) is "e". */
var RU_LATIN = [
	"a",
	"b",
	"v",
	"g",
	"d",
	"e",
	"zh",
	"z",
	"i",
	"y",
	"k",
	"l",
	"m",
	"n",
	"o",
	"p",
	"r",
	"s",
	"t",
	"u",
	"f",
	"kh",
	"ts",
	"ch",
	"sh",
	"sch",
	"",
	"y",
	"",
	"e",
	"yu",
	"ya"
];
/** A text in lower case with Russian letters written in Latin ones; other characters stay. */
function latinLetters(text) {
	let latin = "";
	for (const ch of text.toLowerCase()) {
		const code = ch.codePointAt(0) ?? 0;
		if (code >= 1072 && code <= 1103) latin += RU_LATIN[code - 1072];
		else if (code === 1105) latin += "e";
		else latin += ch;
	}
	return latin;
}
/** How a name sounds in Latin letters, loosely: "Lyra" and the Russian spelling give "lira". */
function nameSound(word) {
	return latinLetters(word).replace(/kh/g, "h").replace(/ph/g, "f").replace(/ck/g, "k").replace(/w/g, "v").replace(/x/g, "ks").replace(/y/g, "i").replace(/[^a-z]/g, "").replace(/(.)\1+/g, "$1");
}
/** Russian case endings after a final vowel (Lira, Liry, Lire, Liru, Liroi) or a consonant (Brom, Broma, Bromom). */
var AFTER_VOWEL = [
	"a",
	"i",
	"e",
	"u",
	"o",
	"oi",
	"oiu",
	"ei",
	"eiu"
];
var AFTER_CONSONANT = [
	"",
	"a",
	"u",
	"e",
	"i",
	"om",
	"em",
	"ov",
	"ami",
	"ah",
	"am",
	"oi",
	"oiu",
	"ei",
	"eiu"
];
/** Every declined form of a name, as sounds. */
function nameForms(name) {
	const sound = nameSound(name);
	if (sound.length < 3) return [];
	if (/[aeiou]$/.test(sound)) return [sound, ...AFTER_VOWEL.map((e) => sound.slice(0, -1) + e)];
	return AFTER_CONSONANT.map((e) => sound + e);
}
/**
* A looser sound for names spelled after their pronunciation in the other alphabet (v0.9.7): a soft
* "c" is "s", "ch" is "sh", a silent final "e" after a consonant goes ("Florence" and its Russian
* spelling give "florens", "Charlotte" gives "sharlot" and the Russian spelling its case form "sharlota").
*/
function looseNameSound(word) {
	return nameSound(word).replace(/ch/g, "sh").replace(/c(?=[ei])/g, "s").replace(/c/g, "k").replace(/(.)\1+/g, "$1").replace(/(?<=..[^aeiou])e$/, "");
}
/** Case forms of the loose sound; a final "a" may also be missing in the other spelling. */
function looseForms(name) {
	const sound = looseNameSound(name);
	if (sound.length < 4) return [];
	if (!/[aeiou]$/.test(sound)) return AFTER_CONSONANT.map((e) => sound + e);
	const stem = sound.slice(0, -1);
	return [
		sound,
		...AFTER_VOWEL.map((e) => stem + e),
		...sound.endsWith("a") && stem.length >= 5 ? [stem] : []
	];
}
/**
* Names written in another alphabet or declined (a Latin card name in a Russian text: "Brom" in
* the Russian "Broma", "Lyra" in "Liru"): a word whose sound is one of the name's case forms.
* One-word names only; exact forms, so "Anna" does not catch words that merely start alike.
*/
function soundMentionIndex(text, names) {
	const single = names.map((n) => n.trim()).filter((n) => n && !/\s/.test(n));
	const forms = new Set(single.flatMap((n) => nameForms(n)));
	const loose = new Set(single.flatMap((n) => looseForms(n)));
	if (!forms.size && !loose.size) return -1;
	for (const match of text.matchAll(/[\p{L}]+/gu)) if (forms.has(nameSound(match[0])) || loose.has(looseNameSound(match[0]))) return match.index ?? -1;
	return -1;
}
/**
* Candidates mentioned in the message, in order of first mention. When nobody is named, the
* speaker of the message is in the frame. Capped by the model's character limit.
*/
function detectParticipants(message, candidates, options) {
	const mentioned = candidates.map((c) => ({
		c,
		at: mentionIndex(message, [c.name, ...c.aliases])
	})).filter((m) => m.at >= 0).sort((a, b) => a.at - b.at).map((m) => m.c);
	return (mentioned.length ? mentioned : candidates.filter((c) => c.key === options.speakerKey).slice(0, 1)).slice(0, Math.max(0, options.max));
}
/**
* Evenly spread positions: one row of up to five, then more rows (V5 holds up to 32).
* Locked positions are kept; grid models snap to the 5x5 grid.
*/
function autoLayout(count, caps, locked = []) {
	const perRow = Math.min(5, Math.max(1, count));
	const rows = Math.ceil(count / perRow);
	const result = [];
	for (let i = 0; i < count; i++) {
		const fixed = locked[i];
		if (fixed) {
			result.push(placeOnCanvas(fixed, caps));
			continue;
		}
		const row = Math.floor(i / perRow);
		const inRow = Math.min(perRow, count - row * perRow);
		const x = (i % perRow + 1) / (inRow + 1);
		const y = rows === 1 ? .5 : (row + 1) / (rows + 1);
		result.push(placeOnCanvas({
			x,
			y
		}, caps));
	}
	return result;
}
function participantFrom(candidate, position, pose) {
	return {
		key: candidate.key,
		name: candidate.name,
		enabled: true,
		passport: candidate.passport,
		fallbackPrompt: candidate.fallbackPrompt,
		fallbackNegative: candidate.fallbackNegative,
		outfit: "",
		states: [],
		...candidate.currentLook ? { currentLook: candidate.currentLook } : {},
		...candidate.currentLookText ? { currentLookText: candidate.currentLookText } : {},
		pose: pose?.id ?? candidate.passport?.pose.preset ?? "",
		poseTags: candidate.passport?.pose.custom ?? "",
		position,
		negative: ""
	};
}
function genderOf(tags) {
	const list = splitTags(tags).map((t) => t.toLowerCase());
	if (list.some((t) => /^(1)?girl$|^woman$|^female$/.test(t))) return "girl";
	if (list.some((t) => /^(1)?boy$|^man$|^male$/.test(t))) return "boy";
	if (list.some((t) => /^(1)?other$/.test(t))) return "other";
	return null;
}
/** Count tags for the base prompt ("2girls, 1boy"), from each participant's base tags. */
function countTags(tagsPerParticipant) {
	const counts = {
		girl: 0,
		boy: 0,
		other: 0
	};
	let known = 0;
	for (const tags of tagsPerParticipant) {
		const gender = genderOf(tags);
		if (gender) {
			counts[gender]++;
			known++;
		}
	}
	if (!known) return "";
	const parts = [];
	if (counts.girl) parts.push(counts.girl === 1 ? "1girl" : `${Math.min(counts.girl, 6)}girls`);
	if (counts.boy) parts.push(counts.boy === 1 ? "1boy" : `${Math.min(counts.boy, 6)}boys`);
	if (counts.other) parts.push(counts.other === 1 ? "1other" : `${Math.min(counts.other, 6)}others`);
	return parts.join(", ");
}
/**
* "futa with female / male / futa" for an explicit scene with a futanari (NSFW layer on) and a
* partner: the composition tag of Danbooru, by the partner's base tags.
*/
function futaPairing(participants) {
	const futa = (p) => Boolean(p.passport && p.passport.nsfw.enabled && isFutanari(p.passport));
	const futas = participants.filter(futa);
	if (!futas.length || participants.length < 2) return "";
	const tags = /* @__PURE__ */ new Set();
	for (const other of participants) {
		if (futas.length === 1 && other === futas[0]) continue;
		if (futa(other) && futas.length > 1) tags.add("futa with futa");
		else if (!futa(other)) {
			const gender = genderOf(other.passport ? other.passport.slots.base : other.fallbackPrompt);
			if (gender === "girl") tags.add("futa with female");
			else if (gender === "boy") tags.add("futa with male");
		}
	}
	return [...tags].join(", ");
}
/**
* The passport outfit a participant's current look stands for (v0.12.1): by the tracker's own wording
* first, then by the look as given. '' without a passport, a look or a recorded wording that fits.
*/
function lookOutfit(p) {
	if (!p.passport) return "";
	return outfitForLook(p.passport, p.currentLookText) || outfitForLook(p.passport, p.currentLook);
}
/** Turns the composer state into the base prompt and character slots for the request. */
function buildScene(spec, caps, options) {
	const active = spec.participants.filter((p) => p.enabled);
	const capacity = caps.maxCharacters;
	const kept = capacity > 0 ? active.slice(0, capacity) : active;
	const dropped = capacity > 0 ? active.slice(capacity).map((p) => p.name) : [];
	const passportIds = [...new Set(kept.flatMap((p) => p.passport ? [p.passport.id] : []))];
	const pair = spec.pair ? findPairPose(spec.pair.pose) : void 0;
	const pairTags = pair ? pairPoseTags(pair, caps.v4Prompt && capacity > 0) : null;
	const characterTags = kept.map((p) => {
		const outfit = p.outfit || lookOutfit(p);
		const look = outfit ? "" : p.currentLook ?? "";
		const bulge = p.passport && !options.allowNsfw && isFutanari(p.passport) ? "bulge" : "";
		const identity = p.passport ? joinTags(passportTags(p.passport, {
			outfit: outfit || void 0,
			states: p.states,
			allowNsfw: options.allowNsfw,
			withoutClothing: Boolean(look)
		}), look, bulge) : joinTags(p.fallbackPrompt, look);
		const pose = p.pose ? findPose(p.pose, options.customPoses)?.tags ?? "" : "";
		const index = spec.participants.indexOf(p);
		const pairTag = pairTags && spec.pair ? index === spec.pair.a ? pairTags[0] : index === spec.pair.b ? pairTags[1] : "" : "";
		return {
			p,
			prompt: joinTags(identity, pose, p.poseTags, pairTag),
			negative: joinTags(p.passport?.negative ?? p.fallbackNegative, p.negative)
		};
	});
	const counts = options.counts === false ? "" : countTags(kept.map((p) => p.passport ? p.passport.slots.base : p.fallbackPrompt));
	const pairing = options.allowNsfw ? futaPairing(kept) : "";
	const framing = joinTags(optionTags(FRAMINGS, spec.framing), optionTags(CAMERA_ANGLES, spec.camera), optionTags(DISTANCES, spec.distance));
	if (capacity === 0) return {
		prompt: joinTags(counts, pairing, spec.base, ...characterTags.map((c) => c.prompt), framing),
		characters: [],
		useCoords: false,
		withoutPassport: kept.filter((p) => !p.passport).map((p) => p.name),
		dropped,
		passportIds
	};
	const canPosition = caps.positioning !== "none" && (kept.length > 1 || caps.canPositionSingleCharacter) && spec.useCoords;
	return {
		prompt: joinTags(counts, pairing, spec.base, framing),
		characters: characterTags.map(({ p, prompt, negative }) => {
			const point = placeOnCanvas(p.position, caps);
			return {
				prompt,
				negative,
				x: point.x,
				y: point.y,
				enabled: true
			};
		}),
		useCoords: canPosition,
		withoutPassport: kept.filter((p) => !p.passport).map((p) => p.name),
		dropped,
		passportIds
	};
}
/** Sentences of a message (split after . ! ? … and at line breaks). */
function sentences(text) {
	return text.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
}
/**
* Pair pose from the text: the sentence with the action decides the participants — the first
* one named there is the source ("Seraphina hugs Lyra": Seraphina hugs), the second the target.
*/
function detectPairInText(text, participants) {
	if (participants.length < 2) return null;
	for (const sentence of sentences(text)) {
		const pose = detectPairPose(sentence);
		if (!pose) continue;
		const [first, second] = participants.map((p, i) => ({
			i,
			at: mentionIndex(sentence, [p.name, ...p.aliases ?? []])
		})).filter((m) => m.at >= 0).sort((x, y) => x.at - y.at);
		if (first && second) return {
			pose: pose.id,
			a: first.i,
			b: second.i
		};
		if (first && participants.length === 2) return {
			pose: pose.id,
			a: first.i,
			b: first.i === 0 ? 1 : 0
		};
	}
	const pose = detectPairPose(text);
	return pose ? {
		pose: pose.id,
		a: 0,
		b: 1
	} : null;
}
/** Applies a pair pose's canvas layout to its two participants. */
function applyPairLayout(spec, caps) {
	if (!spec.pair) return spec;
	const pose = findPairPose(spec.pair.pose);
	const a = spec.participants[spec.pair.a];
	const b = spec.participants[spec.pair.b];
	if (!pose || !a || !b) return spec;
	a.position = placeOnCanvas(pose.layout[0], caps);
	b.position = placeOnCanvas(pose.layout[1], caps);
	resolveOverlaps(spec, caps, /* @__PURE__ */ new Set([spec.pair.a, spec.pair.b]));
	return spec;
}
var pointKey = (p) => `${p.x},${p.y}`;
/**
* Moves participants that share a spot with an earlier (or fixed) one to the nearest free spot:
* a 5x5 grid cell, or the same cells used as a free-positioning raster on V5.
*/
function resolveOverlaps(spec, caps, fixed = /* @__PURE__ */ new Set()) {
	const cells = [];
	for (const y of [
		.1,
		.3,
		.5,
		.7,
		.9
	]) for (const x of [
		.1,
		.3,
		.5,
		.7,
		.9
	]) cells.push(placeOnCanvas({
		x,
		y
	}, caps));
	const occupied = /* @__PURE__ */ new Set();
	spec.participants.forEach((p, i) => {
		if (fixed.has(i) && p.enabled) occupied.add(pointKey(p.position));
	});
	spec.participants.forEach((p, i) => {
		if (fixed.has(i) || !p.enabled) return;
		if (!occupied.has(pointKey(p.position))) {
			occupied.add(pointKey(p.position));
			return;
		}
		const from = p.position;
		const free = cells.filter((cell) => !occupied.has(pointKey(cell))).sort((x, y) => Math.hypot(x.x - from.x, (x.y - from.y) * 2) - Math.hypot(y.x - from.x, (y.y - from.y) * 2))[0];
		if (free) {
			p.position = free;
			occupied.add(pointKey(free));
		}
	});
	return spec;
}
//#endregion
//#region src/domain/advanced.ts
/** Largest request area NovelAI accepts (RECON §3.4). */
var MAX_REQUEST_PIXELS = 3145728;
var ceilToStep = (value) => Math.ceil(value / 64) * 64;
/** Named outputs of a tool's ZIP, in order (web client bundle:_app module 36882). */
var DIRECTOR_OUTPUTS = { "bg-removal": [
	"masked",
	"generated",
	"blend"
] };
var DIRECTOR_TOOLS = [
	"lineart",
	"sketch",
	"colorize",
	"emotion",
	"declutter",
	"declutter-keep-bubbles",
	"bg-removal"
];
/** Emotions of the emotion tool (bundle:266@100814); names are localized as naist.emotion.<id>. */
var DIRECTOR_EMOTIONS = [
	"neutral",
	"happy",
	"sad",
	"angry",
	"scared",
	"surprised",
	"tired",
	"excited",
	"nervous",
	"thinking",
	"confused",
	"shy",
	"disgusted",
	"smug",
	"bored",
	"laughing",
	"irritated",
	"aroused",
	"embarrassed",
	"worried",
	"love",
	"determined",
	"hurt",
	"playful"
];
/** Tools that take a prompt and the "defry" strength (0-5). */
function toolTakesPrompt(tool) {
	return tool === "colorize" || tool === "emotion";
}
var DIRECTOR_MAX_PIXELS = 3143728;
var DIRECTOR_MIN_PIXELS = 1011712;
/**
* Size the image is sent at: scaled down to fit 3145728-2000 px, scaled up to ~1 MP when smaller
* than 1011712 px (bundle:_app@1563250, bundle:266@109900). Integer sides, aspect kept.
*/
function directorSize(width, height) {
	const area = width * height;
	if (area <= 0) return {
		width: 0,
		height: 0
	};
	let scale = 1;
	if (area > DIRECTOR_MAX_PIXELS) scale = Math.sqrt(DIRECTOR_MAX_PIXELS / area);
	else if (area < DIRECTOR_MIN_PIXELS) scale = Math.sqrt(DIRECTOR_MIN_PIXELS / area);
	let w = Math.max(1, Math.floor(width * scale));
	let h = Math.max(1, Math.floor(height * scale));
	while (w * h > DIRECTOR_MAX_PIXELS) {
		w--;
		h = Math.max(1, Math.floor(w * height / width));
	}
	return {
		width: w,
		height: h
	};
}
/** Body of POST /ai/augment-image (image already resized to `size`). */
function directorBody(tool, image, size, options = {}) {
	const body = {
		req_type: tool,
		use_new_shared_trial: true,
		width: size.width,
		height: size.height,
		image
	};
	if (toolTakesPrompt(tool)) {
		const extra = (options.prompt ?? "").trim();
		body.prompt = tool === "emotion" ? `${options.emotion ?? "neutral"};;${extra}` : extra;
		body.defry = Math.min(5, Math.max(0, Math.round(options.defry ?? 0)));
	}
	return body;
}
/**
* Outpaint: grows the canvas by the given margins (rounded to 64 so the request size is valid)
* and masks the new areas, plus `overlap` pixels into the original for a seamless join.
*/
function planOutpaint(width, height, grow, overlap = 16) {
	const clean = (v) => Math.max(0, Math.round(v));
	const left = clean(grow.left);
	let right = clean(grow.right);
	const top = clean(grow.top);
	let bottom = clean(grow.bottom);
	const extraW = ceilToStep(width + left + right) - (width + left + right);
	const extraH = ceilToStep(height + top + bottom) - (height + top + bottom);
	if (extraW > 0) right += extraW;
	if (extraH > 0) bottom += extraH;
	const newWidth = width + left + right;
	const newHeight = height + top + bottom;
	const rects = [];
	const o = Math.max(0, overlap);
	if (left) rects.push({
		x: 0,
		y: 0,
		w: left + o,
		h: newHeight
	});
	if (right) rects.push({
		x: newWidth - right - o,
		y: 0,
		w: right + o,
		h: newHeight
	});
	if (top) rects.push({
		x: 0,
		y: 0,
		w: newWidth,
		h: top + o
	});
	if (bottom) rects.push({
		x: 0,
		y: newHeight - bottom - o,
		w: newWidth,
		h: bottom + o
	});
	return {
		width: newWidth,
		height: newHeight,
		offsetX: left,
		offsetY: top,
		maskRects: rects,
		tooLarge: newWidth * newHeight > MAX_REQUEST_PIXELS
	};
}
/** Enhance target: the source scaled up, multiples of 64, capped by the maximum request area. */
function enhanceSize(width, height, scale) {
	return fitArea(roundToStep(width * scale), roundToStep(height * scale), MAX_REQUEST_PIXELS);
}
/** The web client upscales sources up to 1536x2048 (RECON §3.14). */
function canUpscale(width, height) {
	return width * height > 0 && width * height <= 3145728;
}
//#endregion
//#region src/domain/vibes.ts
/** Defaults of the web client (RECON §3.12): strength 0.6, information extracted 1 (0.7 on V4.5 Full). */
function defaultVibeEntry(vibeId, model) {
	return {
		vibeId,
		strength: .6,
		informationExtracted: model === "nai-diffusion-4-5-full" ? .7 : 1,
		enabled: true
	};
}
function setApplies(set, ctx) {
	if (!set.enabled) return false;
	if (set.global) return true;
	return set.bindings.characters.some((c) => ctx.characters.includes(c)) || ctx.chatId !== "" && set.bindings.chats.includes(ctx.chatId) || ctx.style !== "" && set.bindings.styles.includes(ctx.style);
}
/**
* Vibes for a generation: enabled entries of every applicable set, first occurrence of a vibe
* wins, capped at 16 (the web client's maximum).
*/
function planVibes(sets, items, ctx) {
	const byId = new Map(items.map((i) => [i.id, i]));
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const set of sets) {
		if (!setApplies(set, ctx)) continue;
		for (const entry of set.entries) {
			const item = byId.get(entry.vibeId);
			if (!entry.enabled || !item || seen.has(item.id)) continue;
			seen.add(item.id);
			result.push({
				item,
				strength: clamp$1(entry.strength, -1, 1),
				informationExtracted: clamp$1(entry.informationExtracted, .01, 1)
			});
		}
	}
	return result.slice(0, 16);
}
function clamp$1(value, min, max) {
	const n = Number(value);
	return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : max;
}
function vibeAvailability(caps, transportSupportsVibes) {
	if (caps.family === "v5") return caps.vibeTransfer ? transportSupportsVibes ? "ok" : "transport" : "feature-flag-off";
	if (!caps.vibeTransfer || caps.vibeKind === "none") return "not-supported";
	return transportSupportsVibes ? "ok" : "transport";
}
/** Client-side encoding cache key (the plugin keeps its own disk cache with a hashed key). */
function encodingCacheKey(imageHash, model, informationExtracted) {
	return `vibeenc:${imageHash}:${model}:${(Math.round(informationExtracted * 100) / 100).toFixed(2)}`;
}
//#endregion
//#region src/domain/token-count.ts
function tokenizerKind(model) {
	const family = getCapabilities(model).family;
	if (family === "v5") return "qwen";
	if (family === "v4" || family === "v4_5") return "t5";
	return "clip";
}
var TOKENIZER_FILES = {
	qwen: "qwen35_tokenizer.def",
	t5: "t5_tokenizer.def",
	clip: "clip_tokenizer.def"
};
function tokenLimit(model) {
	if (model === "nai-diffusion-5-full") return 1471;
	if (model === "nai-diffusion-5-curated") return 703;
	return tokenizerKind(model) === "t5" ? 512 : 225;
}
function countPromptTokens(counter, model, prompt, characters = []) {
	const caps = getCapabilities(model);
	const limit = tokenLimit(model);
	const segments = promptSegments(prompt).map((s) => counter.count(s));
	if (!caps.v4Prompt) {
		const total = segments.length ? Math.max(...segments) : 0;
		return {
			total,
			limit,
			base: total,
			characters: [],
			segments,
			text: null,
			over: total > limit
		};
	}
	const base = segments.reduce((sum, n) => sum + n, 0);
	const chars = characters.filter((c) => c.trim()).map((c) => counter.count(c));
	const total = base + chars.reduce((sum, n) => sum + n, 0);
	const block = caps.family === "v5" ? textBlockOf(prompt) : null;
	return {
		total,
		limit,
		base,
		characters: chars,
		segments: [],
		text: block === null ? null : counter.count(block),
		over: total > limit
	};
}
/** Characters T5 cannot represent (V4.x): Cyrillic, CJK, emoji and other non-Latin scripts. */
function t5UnsupportedChars(text) {
	const found = /* @__PURE__ */ new Set();
	for (const ch of text) if (/\p{Extended_Pictographic}/u.test(ch) || /[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u.test(ch)) found.add(ch);
	return [...found];
}
/** Rough count when the tokenizer file is not available (no plugin, no proxy): ~4 characters a token. */
function approximateTokens(text) {
	return text.trim() ? Math.ceil(text.trim().length / 4) : 0;
}
//#endregion
//#region src/domain/weights.ts
var BRACE_FACTOR = 1.05;
var NUMERIC = /(-?\d*\.?\d+)::([\s\S]*?)(?:::|(?=\|)|$)/g;
function hasNumericWeights(prompt) {
	NUMERIC.lastIndex = 0;
	return NUMERIC.test(prompt);
}
/** Nearest number of brace levels for a weight: positive = `{}`, negative = `[]`. */
function braceLevels(weight) {
	return Math.round(Math.log(weight) / Math.log(BRACE_FACTOR));
}
function numericToBraces(prompt) {
	const lossy = [];
	let changed = false;
	const text = prompt.replace(NUMERIC, (_whole, weightText, content) => {
		changed = true;
		const weight = Number(weightText);
		const body = content.trim();
		if (!(weight > 0)) {
			if (body) lossy.push(`${weightText}::${body}`);
			return "";
		}
		const levels = braceLevels(weight);
		if (levels === 0) return body;
		return levels > 0 ? `${"{".repeat(levels)}${body}${"}".repeat(levels)}` : `${"[".repeat(-levels)}${body}${"]".repeat(-levels)}`;
	});
	return {
		text: changed ? text.replace(/,(\s*,)+/g, ",").replace(/^\s*,\s*|\s*,\s*$/g, "") : prompt,
		lossy,
		changed
	};
}
/** Converts a prompt for the target model family (only V4+ → V3 needs it). */
function convertWeights(prompt, targetSupportsNumeric) {
	if (targetSupportsNumeric || !hasNumericWeights(prompt)) return {
		text: prompt,
		lossy: [],
		changed: false
	};
	return numericToBraces(prompt);
}
var round2 = (n) => Math.round(n * 100) / 100;
/** The tag around the cursor: text between the nearest commas, `|` or line breaks, trimmed. */
function tagRange(text, start, end) {
	if (end > start) {
		let s = start;
		let e = end;
		while (s < e && /\s/.test(text[s])) s++;
		while (e > s && /\s/.test(text[e - 1])) e--;
		return {
			start: s,
			end: e
		};
	}
	const isStop = (c) => c === void 0 || c === "," || c === "|" || c === "\n";
	let s = start;
	while (!isStop(text[s - 1])) s--;
	let e = start;
	while (!isStop(text[e])) e++;
	while (s < e && /\s/.test(text[s])) s++;
	while (e > s && /\s/.test(text[e - 1])) e--;
	return {
		start: s,
		end: e
	};
}
/**
* Raises or lowers the weight of the selection (or the tag under the cursor). Numeric syntax on
* V4+ (steps of 0.05, the wrapper disappears at 1.0), braces on V3 (one level per step).
*/
function adjustWeight(text, start, end, step, numeric) {
	let { start: s, end: e } = tagRange(text, start, end);
	if (s >= e) return {
		text,
		start,
		end
	};
	let inner = text.slice(s, e);
	const wrapped = inner.match(/^(-?\d*\.?\d+)::([\s\S]*)::$/);
	if (numeric && wrapped) {
		s += wrapped[1].length + 2;
		e -= 2;
		inner = wrapped[2];
	}
	if (numeric) {
		const before = text.slice(0, s).match(/(-?\d*\.?\d+)::$/);
		const closes = text.slice(e).startsWith("::");
		if (before && closes) {
			const weight = round2(Number(before[1]) + step * .05);
			const head = text.slice(0, s - before[0].length);
			const tail = text.slice(e + 2);
			if (weight === 1) return {
				text: head + inner + tail,
				start: head.length,
				end: head.length + inner.length
			};
			const prefix = `${weight}::`;
			return {
				text: `${head}${prefix}${inner}::${tail}`,
				start: head.length + prefix.length,
				end: head.length + prefix.length + inner.length
			};
		}
		const prefix = `${round2(1 + step * .05)}::`;
		return {
			text: `${text.slice(0, s)}${prefix}${inner}::${text.slice(e)}`,
			start: s + prefix.length,
			end: s + prefix.length + inner.length
		};
	}
	const open = step > 0 ? "{" : "[";
	const opposite = step > 0 ? ["[", "]"] : ["{", "}"];
	if (text[s - 1] === opposite[0] && text[e] === opposite[1]) return {
		text: text.slice(0, s - 1) + inner + text.slice(e + 1),
		start: s - 1,
		end: e - 1
	};
	if (inner.startsWith(opposite[0]) && inner.endsWith(opposite[1])) {
		const unwrapped = inner.slice(1, -1);
		return {
			text: text.slice(0, s) + unwrapped + text.slice(e),
			start: s,
			end: s + unwrapped.length
		};
	}
	const close = step > 0 ? "}" : "]";
	return {
		text: `${text.slice(0, s)}${open}${inner}${close}${text.slice(e)}`,
		start: s + 1,
		end: e + 1
	};
}
//#endregion
//#region src/domain/tags.ts
var TAG_CATEGORIES = {
	0: "general",
	1: "artist",
	3: "copyright",
	4: "character",
	5: "meta"
};
/** NovelAI's own quality, aesthetic and dataset tags (not Danbooru tags, but known to the models). */
var NOVELAI_TAGS = [
	"masterpiece",
	"best quality",
	"amazing quality",
	"great quality",
	"good quality",
	"normal quality",
	"bad quality",
	"worst quality",
	"very aesthetic",
	"aesthetic",
	"displeasing",
	"very displeasing",
	"no text",
	"detailed",
	"detailed background",
	"location",
	"fur dataset",
	"background dataset",
	"artistic error",
	"jpeg artifacts",
	"lowres",
	"bad anatomy",
	"bad hands",
	"white haze",
	"sepia"
];
var EMOTICON = /^[^a-z0-9]*[a-z0-9]?_[a-z0-9]?[^a-z0-9]*$/i;
function tagName(raw) {
	const lower = raw.trim().toLowerCase();
	return lower.length <= 4 && EMOTICON.test(lower) ? lower : lower.replace(/_/g, " ");
}
var key = (text) => tagName(text).replace(/\s+/g, " ");
function buildTagIndex(rows, russian = {}, known = NOVELAI_TAGS) {
	const entries = rows.map(([name, category, count, aliases]) => ({
		name: tagName(name),
		category,
		count,
		aliases: aliases ? aliases.split(",").map((a) => a.trim()).filter(Boolean) : []
	}));
	const byName = new Map(entries.map((e) => [e.name, e]));
	const ensure = (name) => {
		const k = key(name);
		let entry = byName.get(k);
		if (!entry) {
			entry = {
				name: k,
				category: 0,
				count: 0,
				aliases: []
			};
			byName.set(k, entry);
		}
		return entry;
	};
	known.forEach(ensure);
	const byAlias = /* @__PURE__ */ new Map();
	for (const entry of entries) for (const alias of entry.aliases) {
		const k = key(alias.replace(/^\//, ""));
		if (k && !byName.has(k) && !byAlias.has(k)) byAlias.set(k, entry);
	}
	const ru = [];
	for (const [word, target] of Object.entries(russian)) {
		const entry = ensure(target);
		ru.push({
			word: word.toLowerCase(),
			entry
		});
		byAlias.set(word.toLowerCase(), entry);
	}
	return {
		entries,
		byName,
		byAlias,
		russian: ru
	};
}
/** Prefix matches by post count: names first, then aliases and Russian words. */
function suggestTags(index, query, limit = 8) {
	const q = key(query);
	if (q.length < 2) return [];
	const out = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (entry, via) => {
		if (seen.has(entry.name) || out.length >= limit) return;
		seen.add(entry.name);
		out.push(via ? {
			entry,
			via
		} : { entry });
	};
	for (const entry of index.entries) {
		if (entry.name.startsWith(q)) add(entry);
		if (out.length >= limit) return out;
	}
	for (const r of index.russian) if (r.word.startsWith(q)) add(r.entry, r.word);
	for (const entry of index.entries) {
		if (out.length >= limit) break;
		const alias = entry.aliases.find((a) => key(a.replace(/^\//, "")).startsWith(q));
		if (alias) add(entry, alias);
	}
	if (out.length < limit && q.length >= 3) for (const entry of index.entries) {
		if (out.length >= limit) break;
		if (entry.name.includes(q)) add(entry);
	}
	return out;
}
/** The word being typed at the cursor (from the last comma, `|`, newline or brace). */
function currentFragment(text, cursor) {
	let start = cursor;
	const stop = (i) => /[,|\n{}[\]]/.test(text[i]) || text[i] === ":" && text[i - 1] === ":";
	while (start > 0 && !stop(start - 1)) start--;
	const raw = text.slice(start, cursor);
	const lead = raw.length - raw.trimStart().length;
	return {
		start: start + lead,
		fragment: raw.trimStart()
	};
}
/** Plain tags of a prompt: weights, braces, `text:` blocks and quoted phrases removed. */
function tagsOfPrompt(prompt) {
	return prompt.replace(/(?:^|[\s,])te?xt:[\s\S]*$/i, "").split(/[,|\n]/).map((t) => t.replace(/-?\d*\.?\d+::/g, "").replace(/::/g, "").replace(/[{}[\]]/g, "").replace(/"[^"]*"/g, "").trim()).filter(Boolean);
}
/** Tags that are neither in the list nor aliases; sentences and `artist:`-style prefixes are skipped. */
function unknownTags(index, prompt) {
	const unknown = /* @__PURE__ */ new Set();
	for (const tag of tagsOfPrompt(prompt)) {
		const k = key(tag);
		if (k.split(" ").length > 4) continue;
		if (/^[a-z]+:/.test(k)) continue;
		if (/^\d+(girl|boy|other)s?$/.test(k) || /^year \d{4}$/.test(k)) continue;
		if (index.byName.has(k) || index.byAlias.has(k)) continue;
		unknown.add(tag);
	}
	return [...unknown];
}
/** Replaces the fragment at the cursor with a tag and a separator; returns the new text and cursor. */
function insertTag(text, start, cursor, tag) {
	const after = text.slice(cursor);
	const insert = /^\s*[,|]/.test(after) ? tag : `${tag}, `;
	return {
		text: text.slice(0, start) + insert + after.replace(/^[^\s,|{}[\]:]*/, ""),
		cursor: start + insert.length
	};
}
//#endregion
//#region src/data/translate-examples.json
var translate_examples_default = [
	{
		"ru": "рыжая девушка, улыбка, смотрит на зрителя",
		"en": "1girl, red hair, smile, looking at viewer"
	},
	{
		"ru": "рыцарь в доспехах верхом на коне, закат, горы",
		"en": "knight, armor, horseback riding, sunset, mountains"
	},
	{
		"ru": "две девушки держатся за руки в парке, 1.2::цветущая сакура::, text: Привет",
		"en": "2girls, holding hands, park, 1.2::cherry blossoms::, text: Привет"
	}
];
//#endregion
//#region src/domain/translate.ts
var CYRILLIC = /[\u0400-\u04FF]/;
function hasCyrillic(text) {
	return CYRILLIC.test(text);
}
/** The prompt without its `text:` blocks (in-image text is kept in the language it was typed in). */
function withoutTextBlocks(text) {
	return text.split("|").map((segment) => segment.replace(/(^|[\s,.])te?xt:[\s\S]*$/i, "$1")).join("|");
}
/** True when the prompt has Russian outside its in-image text. */
function needsTranslation(text) {
	return hasCyrillic(withoutTextBlocks(text));
}
var TRANSLATION_EXAMPLES = translate_examples_default;
var escapeRegExp$2 = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Whole-word, case-insensitive replacement; longer phrases first so they win over their parts. */
function applyGlossary(text, glossary) {
	const entries = glossary.filter((g) => g.from.trim() && g.to.trim()).sort((a, b) => b.from.length - a.from.length);
	let result = text;
	for (const { from, to } of entries) {
		const pattern = new RegExp(`(^|[^\\p{L}\\p{N}_])${escapeRegExp$2(from.trim())}(?=$|[^\\p{L}\\p{N}_])`, "giu");
		result = result.replace(pattern, (_m, lead) => `${lead}${to.trim()}`);
	}
	return result;
}
var TRANSLATION_SCHEMA = {
	name: "nai_prompt_translation",
	description: "English image prompt translated from the user text",
	strict: true,
	value: {
		type: "object",
		properties: { prompt: {
			type: "string",
			description: "The translated prompt"
		} },
		required: ["prompt"],
		additionalProperties: false
	}
};
function translationPrompt(text, glossary) {
	const used = glossary.filter((g) => g.from.trim() && g.to.trim() && text.toLowerCase().includes(g.from.trim().toLowerCase()));
	return {
		system: "You translate prompts for the NovelAI image generator from Russian to English. Output comma-separated English Danbooru-style tags and short phrases. Keep English words, numbers, names, weight syntax ({ }, [ ], 1.2::...::), \"|\" and \"text:\" blocks unchanged. Do not add anything that is not in the input. Answer only with JSON: {\"prompt\": \"...\"}." + (used.length ? `\nAlways use these translations:\n${used.map((g) => `- ${g.from} => ${g.to}`).join("\n")}` : ""),
		prompt: `Translate this prompt:\n${text}`
	};
}
/**
* Few-shot continuation for text completion models. Sent as a system message (no user name
* prefix) with "English:" as the prefill; the instruction sits in `{ }` so NovelAI's instruction
* wrapping leaves the examples as they are.
*/
function completionPrompt(text, glossary) {
	const used = glossary.filter((g) => g.from.trim() && g.to.trim() && text.toLowerCase().includes(g.from.trim().toLowerCase()));
	const pair = (ru, en) => `Russian: ${ru}\nEnglish: ${en}`;
	return [
		"{ Translate Russian image prompts into English Danbooru tags for NovelAI. Keep weights, \"|\" and text: blocks as they are. }",
		...TRANSLATION_EXAMPLES.map((e) => pair(e.ru, e.en)),
		...used.map((g) => pair(g.from.trim(), g.to.trim())),
		`Russian: ${text.replace(/\s*\n\s*/g, " ").trim()}`
	].join("\n");
}
var COMPLETION_PREFILL = "English:";
/** An answer that talks about the task instead of doing it ("I would like to translate..."). */
function looksLikeChatter(result, source) {
	const talk = /\b(translat\w*|russian|english|sure|here is|i would|i will|i can)\b/i;
	return talk.test(result) && !talk.test(source);
}
/** Takes `{"prompt": ...}` from a model answer; tolerates code fences and text around the JSON. */
function parseTranslation(raw) {
	if (raw && typeof raw === "object" && typeof raw.prompt === "string") return raw.prompt.trim() || null;
	if (typeof raw !== "string") return null;
	const text = raw.trim();
	const candidates = [
		text,
		text.replace(/^```(?:json)?\s*|\s*```$/g, ""),
		text.match(/\{[\s\S]*\}/)?.[0] ?? ""
	];
	for (const candidate of candidates) try {
		const value = JSON.parse(candidate);
		if (typeof value.prompt === "string" && value.prompt.trim()) return value.prompt.trim();
	} catch {}
	const loose = text.match(/"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
	if (loose?.[1]) return loose[1].replace(/\\"/g, "\"").replace(/\\n/g, "\n").trim();
	return null;
}
/** The continuation answer: the first non-empty line, without a repeated "English:" label or quotes. */
function parseCompletion(raw) {
	if (typeof raw !== "string") return null;
	const json = raw.includes("\"prompt\"") ? parseTranslation(raw) : null;
	if (json) return json;
	const line = raw.split("\n").map((l) => l.trim()).find(Boolean);
	if (!line) return null;
	return line.replace(/^english\s*:\s*/i, "").replace(/^["'\u201c]|["'\u201d]$/g, "").trim() || null;
}
/** Cache key material: the text and the glossary (a changed glossary must not reuse old results). */
function translationKeySource(text, glossary) {
	const terms = glossary.filter((g) => g.from.trim() && g.to.trim()).map((g) => `${g.from.trim().toLowerCase()}=${g.to.trim()}`).sort().join(";");
	return `${text.trim()}\u0000${terms}`;
}
//#endregion
//#region src/domain/sprites.ts
/** Default Expressions labels in its own order (expressions/index.js:46-75). */
var EXPRESSION_LABELS = [
	"admiration",
	"amusement",
	"anger",
	"annoyance",
	"approval",
	"caring",
	"confusion",
	"curiosity",
	"desire",
	"disappointment",
	"disapproval",
	"disgust",
	"embarrassment",
	"excitement",
	"fear",
	"gratitude",
	"grief",
	"joy",
	"love",
	"nervousness",
	"optimism",
	"pride",
	"realization",
	"relief",
	"remorse",
	"sadness",
	"surprise",
	"neutral"
];
var EXPRESSION_TAGS = {
	admiration: "admiration, sparkling eyes, smile, blush",
	amusement: "amused, laughing, closed eyes, open mouth, smile",
	anger: "angry, frown, clenched teeth, v-shaped eyebrows",
	annoyance: "annoyed, frown, pout, half-closed eyes",
	approval: "smile, closed mouth, nodding, thumbs up",
	caring: "gentle smile, soft expression, kind eyes",
	confusion: "confused, head tilt, raised eyebrow",
	curiosity: "curious, head tilt, wide eyes, leaning forward",
	desire: "longing, half-closed eyes, blush, parted lips",
	disappointment: "disappointed, frown, looking down, sigh",
	disapproval: "disapproving, frown, crossed arms, narrowed eyes",
	disgust: "disgust, grimace, wrinkled nose",
	embarrassment: "embarrassed, blush, looking away, nervous smile",
	excitement: "excited, wide smile, sparkling eyes, open mouth",
	fear: "scared, wide eyes, trembling, sweat",
	gratitude: "grateful, warm smile, closed eyes, hand on own chest",
	grief: "crying, tears, sad, closed eyes",
	joy: "happy, smile, open mouth, closed eyes",
	love: "in love, heart-shaped pupils, blush, smile",
	nervousness: "nervous, sweatdrop, nervous smile",
	optimism: "optimistic, confident smile, looking up",
	pride: "smug, proud, hand on own hip, smile",
	realization: "surprised, raised eyebrows, open mouth, light bulb",
	relief: "relieved, sigh, smile, closed eyes",
	remorse: "remorseful, sad, looking down",
	sadness: "sad, frown, teary eyes",
	surprise: "surprised, wide eyes, open mouth",
	neutral: "expressionless, closed mouth"
};
/** Labels with a matching Director emotion (the rest is drawn from the emotion tags). */
var EXPRESSION_DIRECTOR = {
	amusement: "laughing",
	anger: "angry",
	annoyance: "irritated",
	confusion: "confused",
	disgust: "disgusted",
	embarrassment: "embarrassed",
	excitement: "excited",
	fear: "scared",
	grief: "hurt",
	joy: "happy",
	love: "love",
	nervousness: "nervous",
	pride: "smug",
	remorse: "worried",
	sadness: "sad",
	surprise: "surprised",
	neutral: "neutral"
};
/** Expressions takes the label from the file name up to the first `-` or `.`. */
function spriteFileName(label) {
	return `${label.toLowerCase().replace(/[^a-z0-9_]/g, "")}.png`;
}
var SPRITE_FRAMING = "solo, upper body, looking at viewer, simple background";
/** Sprite prompt: appearance + emotion + framing (custom labels use the label itself as the tag). */
function spritePrompt(appearance, label) {
	const emotion = EXPRESSION_TAGS[label] ?? label.replace(/[-_]/g, " ");
	return [
		appearance.trim().replace(/[\s,]+$/, ""),
		emotion,
		SPRITE_FRAMING
	].filter(Boolean).join(", ");
}
//#endregion
//#region src/domain/comic.ts
var row = (y, h, cols) => Array.from({ length: cols }, (_, i) => ({
	x: i / cols,
	y,
	w: 1 / cols,
	h
}));
var COMIC_LAYOUTS = [
	{
		id: "single",
		panels: [{
			x: 0,
			y: 0,
			w: 1,
			h: 1
		}]
	},
	{
		id: "two-rows",
		panels: [...row(0, .5, 1), ...row(.5, .5, 1)]
	},
	{
		id: "two-columns",
		panels: row(0, 1, 2)
	},
	{
		id: "four-koma",
		panels: [
			0,
			1,
			2,
			3
		].flatMap((i) => row(i / 4, 1 / 4, 1))
	},
	{
		id: "grid-4",
		panels: [...row(0, .5, 2), ...row(.5, .5, 2)]
	},
	{
		id: "hero-top",
		panels: [...row(0, .55, 1), ...row(.55, .45, 2)]
	},
	{
		id: "grid-6",
		panels: [
			...row(0, 1 / 3, 2),
			...row(1 / 3, 1 / 3, 2),
			...row(2 / 3, 1 / 3, 2)
		]
	}
];
function comicLayout(id) {
	return COMIC_LAYOUTS.find((l) => l.id === id) ?? COMIC_LAYOUTS[4];
}
/** Panel rectangles on the page in pixels, with `gutter` px between panels and around the page. */
function panelPixels(layout, page, gutter) {
	return layout.panels.map((p) => {
		const x0 = Math.round(p.x * page.width + gutter * (p.x === 0 ? 1 : .5));
		const y0 = Math.round(p.y * page.height + gutter * (p.y === 0 ? 1 : .5));
		const x1 = Math.round((p.x + p.w) * page.width - gutter * (p.x + p.w >= .999 ? 1 : .5));
		const y1 = Math.round((p.y + p.h) * page.height - gutter * (p.y + p.h >= .999 ? 1 : .5));
		return {
			x: x0,
			y: y0,
			width: Math.max(1, x1 - x0),
			height: Math.max(1, y1 - y0)
		};
	});
}
/** Request size of a panel: its aspect ratio, multiples of 64, as large as `maxPixels` allows. */
function panelRequestSize(panel, maxPixels = FREE_MAX_PIXELS) {
	const aspect = panel.width / panel.height;
	const height = Math.sqrt(maxPixels / aspect) * 1.5;
	const big = {
		width: Math.round(height * aspect / 64) * 64,
		height: Math.round(height / 64) * 64
	};
	const fitted = fitArea(Math.max(64, big.width), Math.max(64, big.height), maxPixels);
	return {
		width: Math.max(64, fitted.width),
		height: Math.max(64, fitted.height)
	};
}
function panelTextBlock(panel) {
	return panel.text.map((t) => t.trim()).filter(Boolean).join("\n\n");
}
/** Panel prompt: page style, panel content, then the `text:` block (which must stay last). */
function panelPrompt(style, panel) {
	const body = [style, panel.prompt].map((p) => p.trim().replace(/[\s,]+$/, "")).filter(Boolean).join(", ");
	const text = panelTextBlock(panel);
	return text ? `${body}${body ? ", " : ""}text: ${text}` : body;
}
//#endregion
//#region src/domain/continuity.ts
function locationKey(name) {
	return name.trim().toLowerCase().replace(/\s+/g, " ");
}
var escapeRegExp$1 = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** The known location named in the text (whole words, case-insensitive; the longest name wins). */
function detectLocation(text, names) {
	const sorted = [...names].filter((n) => n.trim()).sort((a, b) => b.length - a.length);
	for (const name of sorted) if (new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp$1(name.trim())}($|[^\\p{L}\\p{N}])`, "iu").test(text)) return name;
	return null;
}
/** Prefix of the continuity keys of places with a stable id (Maestro places, v0.10). */
var PLACE_KEY_PREFIX = "place:";
function placeKey(id) {
	return `${PLACE_KEY_PREFIX}${id.trim()}`;
}
/** Defensive parse of a place another extension returned; null when it has no id. */
function normalizePlace(raw) {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
	const source = raw;
	const id = typeof source.id === "string" ? source.id.trim() : "";
	if (!id) return null;
	return {
		id,
		name: typeof source.name === "string" ? source.name.trim() : "",
		aliases: Array.isArray(source.aliases) ? source.aliases.filter((a) => typeof a === "string" && a.trim() !== "").map((a) => a.trim()) : [],
		parent: typeof source.parent === "string" && source.parent ? source.parent : null
	};
}
/**
* Keys under which the reference of a location may be stored, best first: the place id, then the
* name keys of the label, the place's name and its aliases (references bound before place ids).
* Without a place: the name key of the label only (the behaviour before v0.10).
*/
function locationKeys(label, place) {
	const keys = place ? [placeKey(place.id), ...[
		label,
		place.name,
		...place.aliases
	].map(locationKey)] : [locationKey(label)];
	return [...new Set(keys.filter(Boolean))];
}
/** Strength for img2img continuity: low keeps the place, high follows the new prompt. */
function clampContinuityStrength(value) {
	return Number.isFinite(value) ? Math.min(.95, Math.max(.1, value)) : .6;
}
//#endregion
//#region src/domain/settings-io.ts
var SETTINGS_FORMAT = "nai-studio-settings";
function buildSettingsExport(settings, schemaVersion, appVersion, images = {}, now = /* @__PURE__ */ new Date()) {
	return {
		format: SETTINGS_FORMAT,
		schemaVersion,
		appVersion,
		exportedAt: now.toISOString(),
		settings: JSON.parse(JSON.stringify(settings)),
		...Object.keys(images).length ? { images } : {}
	};
}
var isObject$2 = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function checkSettingsImport(text, currentSchema) {
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return {
			ok: false,
			reason: "not-json"
		};
	}
	if (!isObject$2(data) || data.format !== "nai-studio-settings") return {
		ok: false,
		reason: "wrong-format"
	};
	const schemaVersion = Number(data.schemaVersion);
	if (!Number.isInteger(schemaVersion) || schemaVersion < 1 || !isObject$2(data.settings)) return {
		ok: false,
		reason: "invalid"
	};
	if (schemaVersion > currentSchema) return {
		ok: false,
		reason: "newer-schema",
		schemaVersion
	};
	const images = {};
	if (isObject$2(data.images)) {
		for (const [key, value] of Object.entries(data.images)) if (typeof value === "string" && /^vibe(thumb)?:/.test(key)) images[key] = value;
	}
	return {
		ok: true,
		schemaVersion,
		settings: {
			...data.settings,
			schemaVersion
		},
		images
	};
}
//#endregion
//#region src/domain/tokenizers/bpe.ts
/** GPT-2 `bytes_to_unicode`: printable stand-ins for every byte value. */
function byteToCharTable() {
	const printable = [];
	const push = (from, to) => {
		for (let b = from; b <= to; b++) printable.push(b);
	};
	push(33, 126);
	push(161, 172);
	push(174, 255);
	const table = new Array(256);
	let extra = 0;
	for (let b = 0; b < 256; b++) table[b] = printable.includes(b) ? String.fromCodePoint(b) : String.fromCodePoint(256 + extra++);
	return table;
}
var escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var ByteBpeTokenizer = class {
	ranks = /* @__PURE__ */ new Map();
	vocab;
	byteToChar = byteToCharTable();
	encoder = new TextEncoder();
	cache = /* @__PURE__ */ new Map();
	special;
	split;
	normalization;
	ignoreMerges;
	constructor(data) {
		this.vocab = data.vocab;
		data.merges.forEach(([left, right], rank) => this.ranks.set(`${left}\u0000${right}`, rank));
		const specials = [...data.specialTokens].sort((a, b) => b.length - a.length);
		this.special = specials.length ? new RegExp(`(${specials.map(escapeRegExp).join("|")})`) : null;
		this.split = new RegExp(data.config?.splitRegex ?? "'s|'t|'re|'ve|'m|'ll|'d| ?\\p{L}+| ?\\p{N}+| ?[^\\s\\p{L}\\p{N}]+|\\s+", "gu");
		this.normalization = data.config?.normalization;
		this.ignoreMerges = data.config?.ignoreMerges === true;
	}
	wordTokens(word) {
		const cached = this.cache.get(word);
		if (cached !== void 0) return cached;
		const mapped = [...this.encoder.encode(word)].map((b) => this.byteToChar[b]).join("");
		let count;
		if (this.ignoreMerges && this.vocab[mapped] !== void 0) count = 1;
		else {
			let parts = [...mapped];
			for (;;) {
				let best = Infinity;
				let at = -1;
				for (let i = 0; i < parts.length - 1; i++) {
					const rank = this.ranks.get(`${parts[i]}\u0000${parts[i + 1]}`);
					if (rank !== void 0 && rank < best) {
						best = rank;
						at = i;
					}
				}
				if (at < 0) break;
				const left = parts[at];
				const right = parts[at + 1];
				const merged = [];
				for (let i = 0; i < parts.length; i++) if (parts[i] === left && parts[i + 1] === right) {
					merged.push(left + right);
					i++;
				} else merged.push(parts[i]);
				parts = merged;
				if (parts.length === 1) break;
			}
			count = parts.filter((p) => this.vocab[p] !== void 0).length;
		}
		this.cache.set(word, count);
		return count;
	}
	count(text) {
		const normalized = this.normalization ? text.normalize(this.normalization) : text;
		const chunks = this.special ? normalized.split(this.special) : [normalized];
		let total = 0;
		chunks.forEach((chunk, i) => {
			if (!chunk) return;
			if (this.special && i % 2 === 1) {
				total += 1;
				return;
			}
			for (const match of chunk.matchAll(this.split)) total += this.wordTokens(match[0]);
		});
		return total;
	}
};
//#endregion
//#region src/domain/tokenizers/clip.ts
var WORD = /<\|startoftext\|>|<\|endoftext\|>|'s|'t|'re|'ve|'m|'ll|'d|[\p{L}]+|[\p{N}]|[^\s\p{L}\p{N}]+/giu;
var NAMED_ENTITIES = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: "\"",
	apos: "'",
	nbsp: "\xA0"
};
/** The few HTML entities a prompt can realistically contain (the web client uses a full decoder). */
function decodeEntities(text) {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
		if (body[0] === "#") {
			const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
			return Number.isFinite(code) && code <= 1114111 ? String.fromCodePoint(code) : whole;
		}
		return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
	});
}
var ClipTokenizer = class {
	ranks = /* @__PURE__ */ new Map();
	byteToChar = byteToCharTable();
	encoder = new TextEncoder();
	cache = /* @__PURE__ */ new Map();
	/** `mergesText` is the `text` field of the .def file: a version line, then one merge per line. */
	constructor(mergesText) {
		mergesText.split("\n").slice(1, 48895).forEach((line, rank) => {
			const [left, right] = line.split(" ");
			if (left !== void 0 && right !== void 0) this.ranks.set(`${left}\u0000${right}`, rank);
		});
	}
	wordTokens(word) {
		const cached = this.cache.get(word);
		if (cached !== void 0) return cached;
		const chars = [...word];
		let parts = [...chars.slice(0, -1), `${chars.at(-1) ?? ""}</w>`];
		while (parts.length > 1) {
			let best = Infinity;
			let at = -1;
			for (let i = 0; i < parts.length - 1; i++) {
				const rank = this.ranks.get(`${parts[i]}\u0000${parts[i + 1]}`);
				if (rank !== void 0 && rank < best) {
					best = rank;
					at = i;
				}
			}
			if (at < 0) break;
			const left = parts[at];
			const right = parts[at + 1];
			const merged = [];
			for (let i = 0; i < parts.length; i++) if (parts[i] === left && parts[i + 1] === right) {
				merged.push(left + right);
				i++;
			} else merged.push(parts[i]);
			parts = merged;
		}
		this.cache.set(word, parts.length);
		return parts.length;
	}
	count(text) {
		const cleaned = decodeEntities(decodeEntities(text.replace(/[[\]{}]/g, " ").trim()).trim()).replace(/\s+/g, " ").trim().toLowerCase();
		let total = 0;
		for (const match of cleaned.matchAll(WORD)) {
			const word = [...this.encoder.encode(match[0])].map((b) => this.byteToChar[b]).join("");
			total += this.wordTokens(word);
		}
		return total;
	}
};
//#endregion
//#region src/domain/tokenizers/t5.ts
var METASPACE = "▁";
var T5Tokenizer = class {
	root = {
		end: -1,
		children: /* @__PURE__ */ new Map()
	};
	scores;
	unkScore;
	cache = /* @__PURE__ */ new Map();
	constructor(data) {
		const vocab = data.model.vocab;
		this.scores = vocab.map(([, score]) => score);
		const min = vocab.reduce((m, [, score]) => Math.min(m, score), 1e6);
		this.unkScore = min - 10;
		this.scores[data.model.unk_id] = this.unkScore;
		vocab.forEach(([piece], id) => {
			if (/[\uD800-\uDFFF]/.test(piece)) return;
			let node = this.root;
			for (const unit of piece) {
				let next = node.children.get(unit);
				if (!next) {
					next = {
						end: -1,
						children: /* @__PURE__ */ new Map()
					};
					node.children.set(unit, next);
				}
				node = next;
			}
			node.end = id;
		});
	}
	/** Number of pieces on the best (Viterbi) segmentation of one pre-tokenized word. */
	wordTokens(word) {
		const cached = this.cache.get(word);
		if (cached !== void 0) return cached;
		const n = word.length;
		const best = new Array(n + 1).fill(-Infinity);
		const pieces = new Array(n + 1).fill(0);
		best[0] = 0;
		for (let pos = 0; pos < n; pos++) {
			const base = best[pos];
			if (base === -Infinity) continue;
			let node = this.root;
			let singleChar = false;
			for (let end = pos; end < n && node; end++) {
				node = node.children.get(word[end]);
				if (!node) break;
				if (node.end >= 0) {
					if (end - pos + 1 === 1) singleChar = true;
					const score = base + this.scores[node.end];
					if (score > best[end + 1]) {
						best[end + 1] = score;
						pieces[end + 1] = pieces[pos] + 1;
					}
				}
			}
			if (!singleChar) {
				const score = base + this.unkScore;
				if (score > best[pos + 1]) {
					best[pos + 1] = score;
					pieces[pos + 1] = pieces[pos] + 1;
				}
			}
		}
		const count = pieces[n];
		this.cache.set(word, count);
		return count;
	}
	count(text) {
		if (!text) return 1;
		const cleaned = text.replace(/[[\]{}]/g, "").replace(/-?\d*\.?\d*::/g, "");
		let total = 0;
		for (const word of cleaned.split(/\s+/)) {
			const piece = word.startsWith(METASPACE) ? word : METASPACE + word;
			total += this.wordTokens(piece);
		}
		return total + 1;
	}
};
//#endregion
//#region src/domain/markers.ts
var ENTITIES = {
	quot: "\"",
	apos: "'",
	amp: "&",
	lt: "<",
	gt: ">",
	nbsp: " "
};
function decodeHtmlEntities(text) {
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body) => {
		if (body[0] === "#") {
			const code = body[1] === "x" || body[1] === "X" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
			return Number.isFinite(code) && code > 0 && code <= 1114111 ? String.fromCodePoint(code) : whole;
		}
		return ENTITIES[body.toLowerCase()] ?? whole;
	});
}
/** End index (exclusive) of an HTML tag starting at `start` (`<`), quotes respected; -1 if unfinished. */
function tagEnd(text, start) {
	let quote = "";
	for (let i = start + 1; i < text.length; i++) {
		const c = text[i];
		if (quote) {
			if (c === quote) quote = "";
		} else if (c === "\"" || c === "'") quote = c;
		else if (c === ">") return i + 1;
		else if (c === "<") return -1;
	}
	return -1;
}
/** Attributes of a tag: name → raw value (entities decoded), lenient about quotes. */
function parseAttributes(tag) {
	const attrs = {};
	const body = tag.replace(/^<\s*[\w-]+/, "").replace(/\/?>$/, "");
	for (const m of body.matchAll(/([^\s=/>]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
		const name = m[1].toLowerCase();
		attrs[name] = decodeHtmlEntities(m[3] ?? m[4] ?? m[5] ?? "");
	}
	return attrs;
}
/** JSON as models write it: strict first, then with single quotes and trailing commas fixed, then key: value scanning. */
function parseLooseJson(text) {
	const source = decodeHtmlEntities(text.trim());
	const attempts = [
		source,
		source.replace(/,\s*([}\]])/g, "$1"),
		source.replace(/'/g, "\"").replace(/,\s*([}\]])/g, "$1")
	];
	for (const attempt of attempts) try {
		const value = JSON.parse(attempt);
		if (value && typeof value === "object" && !Array.isArray(value)) return value;
	} catch {}
	const out = {};
	for (const m of source.matchAll(/["']?([A-Za-z_][\w-]*)["']?\s*:\s*("((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(-?\d+(?:\.\d+)?)|(true|false)|(\[[^\]]*\]))/g)) {
		const key = m[1];
		if (m[3] !== void 0 || m[4] !== void 0) out[key] = (m[3] ?? m[4] ?? "").replace(/\\(["'\\])/g, "$1");
		else if (m[5] !== void 0) out[key] = Number(m[5]);
		else if (m[6] !== void 0) out[key] = m[6] === "true";
		else if (m[7] !== void 0) try {
			out[key] = JSON.parse(m[7].replace(/'/g, "\""));
		} catch {
			out[key] = m[7].slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, ""));
		}
	}
	return Object.keys(out).length ? out : null;
}
var str$2 = (v) => typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : void 0;
var num$1 = (v) => {
	const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
	return Number.isFinite(n) ? n : void 0;
};
var bool = (v) => typeof v === "boolean" ? v : v === "true" || v === "1" ? true : v === "false" || v === "0" ? false : void 0;
var pick$1 = (o, ...keys) => keys.map((k) => o[k]).find((v) => v !== void 0 && v !== null && v !== "");
function characters(value) {
	const list = typeof value === "string" ? value.split(/[,;]/) : Array.isArray(value) ? value : [];
	const out = [];
	for (const item of list) if (typeof item === "string" && item.trim()) out.push({ name: item.trim() });
	else if (item && typeof item === "object") {
		const o = item;
		const name = str$2(pick$1(o, "name", "who", "character"));
		if (!name) continue;
		const ch = { name };
		const pos = str$2(pick$1(o, "pos", "position"));
		const pose = str$2(o.pose);
		const action = str$2(o.action);
		const look = str$2(pick$1(o, "look", "appearance", "tags", "prompt", "desc", "description"));
		if (pos) ch.pos = pos;
		if (pose) ch.pose = pose;
		if (action) ch.action = action;
		if (look) ch.look = look;
		out.push(ch);
	}
	return out.length ? out : void 0;
}
/** Marker parameters from any key spelling models use; unknown keys are ignored. */
function normalizeParams(o) {
	const prompt = str$2(pick$1(o, "prompt", "description", "desc", "scene", "image"));
	if (!prompt) return null;
	const p = { prompt };
	const set = (key, value) => {
		if (value !== void 0) p[key] = value;
	};
	set("negative", str$2(pick$1(o, "negative", "neg", "uc", "undesired")));
	set("chars", characters(pick$1(o, "chars", "characters", "who")));
	set("ratio", str$2(pick$1(o, "ratio", "aspect", "aspect_ratio", "aspectRatio", "orientation")));
	set("size", str$2(pick$1(o, "size", "image_size", "imageSize", "resolution")));
	set("model", str$2(o.model));
	set("style", str$2(pick$1(o, "style", "preset")));
	set("text", str$2(pick$1(o, "text", "text_in_image", "sign")));
	set("caption", str$2(pick$1(o, "caption", "title", "figcaption")));
	set("spoiler", bool(o.spoiler));
	set("align", str$2(o.align));
	set("width", num$1(o.width));
	set("seed", num$1(o.seed));
	set("steps", num$1(o.steps));
	set("scale", num$1(pick$1(o, "scale", "guidance", "cfg")));
	set("sampler", str$2(o.sampler));
	set("rescale", num$1(pick$1(o, "rescale", "cfg_rescale")));
	set("variety", bool(pick$1(o, "variety", "variety_boost")));
	set("quality", bool(pick$1(o, "quality", "quality_tags")));
	set("uc", str$2(pick$1(o, "uc_preset", "ucPreset")));
	set("transparent", bool(pick$1(o, "transparent", "transparency")));
	set("location", str$2(pick$1(o, "location", "place")));
	set("ref", str$2(pick$1(o, "ref", "base", "from")));
	set("vibe", str$2(o.vibe));
	set("count", num$1(pick$1(o, "count", "n", "variants")));
	set("id", str$2(o.id));
	return p;
}
/** Underscored URL tags (`white_hair,golden_eyes`) back to NovelAI's spelling (`white hair, golden eyes`). */
function urlTags(text) {
	return text.split(",").map((t) => t.trim().replace(/_/g, " ")).filter(Boolean).join(", ");
}
function fromLegacyUrl(src) {
	const q = src.indexOf("?");
	if (q < 0 || !/\/gen$/.test(src.slice(0, q).replace(/\/+$/, ""))) return null;
	const query = new URLSearchParams(src.slice(q + 1));
	const prompt = query.get("prompt");
	if (!prompt) return null;
	const style = query.get("style");
	const o = { prompt: urlTags(prompt) };
	if (style) o.style = urlTags(style);
	for (const key of [
		"negative",
		"model",
		"ratio",
		"size",
		"seed",
		"steps",
		"scale"
	]) {
		const v = query.get(key);
		if (v) o[key] = key === "negative" ? urlTags(v) : v;
	}
	return normalizeParams(o);
}
/** `<figure>` that wraps [start, end) with only whitespace between; its range and figcaption text. */
function figureAround(text, start, end) {
	const open = text.slice(0, start).match(/<figure\b[^>]*>\s*$/i);
	if (!open || open.index === void 0) return null;
	const close = text.slice(end).match(/^\s*(?:<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>\s*)?<\/figure>/i);
	if (!close) return null;
	const caption = close[1] ? decodeHtmlEntities(close[1].replace(/<[^>]+>/g, "")).trim() : void 0;
	return {
		start: open.index,
		end: end + close[0].length,
		...caption ? { caption } : {}
	};
}
function withFigure(text, match) {
	const figure = figureAround(text, match.start, match.end);
	if (!figure) return match;
	const params = figure.caption && !match.params.caption ? {
		...match.params,
		caption: figure.caption
	} : match.params;
	return {
		...match,
		start: figure.start,
		end: figure.end,
		params
	};
}
/** Every complete marker in the text, in order. Plain `<img>` tags that are not markers are left alone. */
function findMarkers(text) {
	const found = [];
	const imgTag = /<img\b/gi;
	for (let m = imgTag.exec(text); m; m = imgTag.exec(text)) {
		const end = tagEnd(text, m.index);
		if (end < 0) continue;
		const attrs = parseAttributes(text.slice(m.index, end));
		let params = null;
		let format = null;
		if ("data-nai" in attrs) {
			const json = parseLooseJson(attrs["data-nai"]);
			params = json ? normalizeParams(json) : normalizeParams({ prompt: attrs["data-nai"] });
			format = "nai";
		} else if ("data-iig-instruction" in attrs) {
			const json = parseLooseJson(attrs["data-iig-instruction"]);
			params = json ? normalizeParams(json) : null;
			format = "iig";
		} else if (attrs.src && /\/gen\?/.test(attrs.src)) {
			params = fromLegacyUrl(attrs.src);
			format = "legacy-url";
		}
		if (params && format) found.push(withFigure(text, {
			start: m.index,
			end,
			format,
			params
		}));
		imgTag.lastIndex = end;
	}
	for (let i = text.indexOf("[IMG:GEN:"); i >= 0; i = text.indexOf("[IMG:GEN:", i + 1)) {
		const open = i + 9;
		if (text[open] !== "{") continue;
		let depth = 0;
		let quote = "";
		let close = -1;
		for (let j = open; j < text.length; j++) {
			const c = text[j];
			if (quote) {
				if (c === "\\") j++;
				else if (c === quote) quote = "";
			} else if (c === "\"") quote = c;
			else if (c === "{") depth++;
			else if (c === "}" && --depth === 0) {
				close = j;
				break;
			}
		}
		if (close < 0 || text[close + 1] !== "]") continue;
		const json = parseLooseJson(text.slice(open, close + 1));
		const params = json ? normalizeParams(json) : null;
		if (params) found.push({
			start: i,
			end: close + 2,
			format: "iig",
			params
		});
	}
	for (const m of text.matchAll(/<!--\s*img-prompt="((?:[^"\\]|\\.)*)"\s*-->/g)) {
		const prompt = m[1].replace(/\\"/g, "\"");
		if (prompt.trim() && m.index !== void 0) found.push(withFigure(text, {
			start: m.index,
			end: m.index + m[0].length,
			format: "comment",
			params: { prompt: prompt.trim() }
		}));
	}
	found.sort((a, b) => a.start - b.start);
	return found.filter((f, i) => i === 0 || f.start >= found[i - 1].end);
}
/**
* Where an unfinished marker begins at the end of a streaming text (so it can be hidden until it
* is complete), or -1: an open <figure>, an unclosed <img or comment, an unbalanced [IMG:GEN:,
* or the first letters of one of them at the very end.
*/
function partialMarkerStart(text) {
	const starts = [];
	const lastFigure = text.toLowerCase().lastIndexOf("<figure");
	if (lastFigure >= 0 && !/<\/figure>/i.test(text.slice(lastFigure))) starts.push(lastFigure);
	const lastImg = text.toLowerCase().lastIndexOf("<img");
	if (lastImg >= 0 && tagEnd(text, lastImg) < 0) starts.push(lastImg);
	const lastComment = text.lastIndexOf("<!--");
	if (lastComment >= 0 && !text.includes("-->", lastComment)) starts.push(lastComment);
	const lastGen = text.lastIndexOf("[IMG:GEN:");
	if (lastGen >= 0 && !findMarkers(text.slice(lastGen)).some((m) => m.start === 0)) starts.push(lastGen);
	const tail = text.match(/(?:<|<i|<im|<f|<fi|<fig|<figu|<figur|<!|<!-|\[|\[I|\[IM|\[IMG|\[IMG:[A-Z:]*)$/i);
	if (tail?.index !== void 0) starts.push(tail.index);
	return starts.length ? Math.min(...starts) : -1;
}
/** Replaces marker ranges right to left (so earlier indices stay valid). */
function replaceMarkers(text, markers, replacement) {
	let out = text;
	for (let i = markers.length - 1; i >= 0; i--) {
		const m = markers[i];
		out = out.slice(0, m.start) + replacement(m, i) + out.slice(m.end);
	}
	return out;
}
var MODEL_ALIASES$1 = {
	v5: "nai-diffusion-5-full",
	"v5-full": "nai-diffusion-5-full",
	v5c: "nai-diffusion-5-curated",
	"v5-curated": "nai-diffusion-5-curated",
	"v4.5": "nai-diffusion-4-5-full",
	v45: "nai-diffusion-4-5-full",
	"v4.5-full": "nai-diffusion-4-5-full",
	"v4.5c": "nai-diffusion-4-5-curated",
	"v4.5-curated": "nai-diffusion-4-5-curated",
	v4: "nai-diffusion-4-full",
	"v4-full": "nai-diffusion-4-full",
	v4c: "nai-diffusion-4-curated-preview",
	"v4-curated": "nai-diffusion-4-curated-preview",
	v3: "nai-diffusion-3",
	anime: "nai-diffusion-3",
	furry: "nai-diffusion-furry-3"
};
function markerModel(value) {
	if (!value) return void 0;
	const v = value.trim().toLowerCase();
	if (isModelId(v)) return v;
	return MODEL_ALIASES$1[v];
}
var RATIO_ALIASES = {
	portrait: [2, 3],
	vertical: [2, 3],
	landscape: [3, 2],
	horizontal: [3, 2],
	square: [1, 1],
	wide: [16, 9],
	tall: [9, 16]
};
function parseRatio(value) {
	const v = (value ?? "").trim().toLowerCase();
	const alias = RATIO_ALIASES[v];
	if (alias) return alias;
	const m = v.match(/^(\d+(?:\.\d+)?)\s*[:x/]\s*(\d+(?:\.\d+)?)$/);
	const a = m ? Number(m[1]) : 0;
	const b = m ? Number(m[2]) : 0;
	return a > 0 && b > 0 ? [a, b] : [2, 3];
}
/** Pixel budget of a size: 1K ≈ 1 MP (free on Opus), 2K ≈ 2 MP, 3K/4K = NovelAI's maximum. */
function sizeArea(value) {
	const v = (value ?? "").trim().toUpperCase();
	if (!v || v === "1K" || v === "FREE" || v === "NORMAL") return FREE_MAX_PIXELS;
	if (v === "2K" || v === "LARGE") return 2097152;
	if (v === "3K" || v === "4K" || v === "WALLPAPER" || v === "MAX") return 3145728;
	const dims = v.match(/^(\d+)\s*[X×*]\s*(\d+)$/);
	if (dims) return {
		width: Number(dims[1]),
		height: Number(dims[2])
	};
	const edge = Number(v);
	if (Number.isFinite(edge) && edge >= 64) return Math.min(3145728, edge * edge);
	return FREE_MAX_PIXELS;
}
/**
* Request size for a marker: the ratio within the size's pixel budget, multiples of 64, never above
* 1 MP in free-only mode (rounded down, unlike the old microservice which could overshoot).
*/
function markerDimensions(ratio, size, freeOnly) {
	const area = sizeArea(size);
	const limit = freeOnly ? FREE_MAX_PIXELS : 3145728;
	if (typeof area === "object") {
		const round = (n) => Math.max(64, Math.round(n / 64) * 64);
		const w = round(area.width);
		const h = round(area.height);
		return w * h <= limit ? {
			width: w,
			height: h
		} : fitArea(w, h, limit);
	}
	const [a, b] = parseRatio(ratio);
	return fitArea(Math.round(a * 4096), Math.round(b * 4096), Math.min(area, limit));
}
/** At most `max` markers per reply (the rest are dropped from the text). */
function limitMarkers(markers, max) {
	const n = Math.max(0, Math.floor(max));
	return {
		keep: markers.slice(0, n),
		drop: markers.slice(n)
	};
}
var AXIS = {
	"far left": { x: .1 },
	left: { x: .3 },
	center: { x: .5 },
	centre: { x: .5 },
	middle: { x: .5 },
	right: { x: .7 },
	"far right": { x: .9 },
	top: { y: .3 },
	upper: { y: .3 },
	bottom: { y: .7 },
	lower: { y: .7 }
};
/**
* A character position written in a marker: the NovelAI grid ("C3": columns A-E, rows 1-5),
* words ("left", "top right", "far left") or "x,y" between 0 and 1. Null when not understood.
*/
function markerPosition(pos) {
	const v = (pos ?? "").trim().toLowerCase();
	if (!v) return null;
	const grid = v.match(/^([a-e])\s*([1-5])$/);
	if (grid) return {
		x: .1 + .2 * (grid[1].charCodeAt(0) - 97),
		y: .1 + .2 * (Number(grid[2]) - 1)
	};
	const xy = v.match(/^(0(?:\.\d+)?|1(?:\.0+)?)\s*[,;\s]\s*(0(?:\.\d+)?|1(?:\.0+)?)$/);
	if (xy) return {
		x: Number(xy[1]),
		y: Number(xy[2])
	};
	const point = {
		x: .5,
		y: .5
	};
	let known = false;
	let rest = v.replace(/[-_]/g, " ");
	for (const word of Object.keys(AXIS).sort((a, b) => b.length - a.length)) {
		if (!new RegExp(`(^|\\s)${word}(\\s|$)`).test(rest)) continue;
		Object.assign(point, AXIS[word]);
		rest = rest.replace(word, " ");
		known = true;
	}
	return known ? {
		x: Math.round(point.x * 10) / 10,
		y: Math.round(point.y * 10) / 10
	} : null;
}
/** Parameters that only change how an image is shown (not what is generated). */
var DISPLAY_KEYS = /* @__PURE__ */ new Set([
	"caption",
	"spoiler",
	"align",
	"width",
	"id"
]);
/**
* Identity of what a marker generates: while a reply streams, a marker can grow (a figcaption
* arrives after the <img>), and that must not start a second generation.
*/
function markerGenerationKey(params) {
	const record = params;
	return JSON.stringify(Object.keys(record).filter((k) => !DISPLAY_KEYS.has(k) && record[k] !== void 0).sort().map((k) => [k, record[k]]));
}
/** Display options a marker asks for (caption, spoiler, alignment, width in % up to 100, else px). */
function markerDisplay(params) {
	const display = {};
	if (params.caption) display.caption = params.caption;
	display.alt = (params.caption || params.prompt).slice(0, 200);
	if (params.spoiler) display.spoiler = true;
	const align = params.align?.trim().toLowerCase();
	if (align === "left" || align === "right" || align === "center") display.align = align;
	if (params.width !== void 0 && params.width > 0) {
		if (params.width <= 100) {
			display.width = params.width;
			display.widthUnit = "%";
		} else {
			display.width = Math.min(Math.round(params.width), 2048);
			display.widthUnit = "px";
		}
	}
	return display;
}
/** Plain text of a reply for an automatic illustration: no HTML, placeholders or markers, cut to `max`. */
function replyExcerpt(text, max = 800) {
	const plain = replaceMarkers(text, findMarkers(text), () => " ").replace(/\[nai:img:[^\]]+\]/g, " ").replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/[*_~`#>]+/g, " ").replace(/\s+/g, " ").trim();
	if (plain.length <= max) return plain;
	const cut = plain.slice(0, max);
	const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
	return (end > max / 2 ? cut.slice(0, end + 1) : cut).trim();
}
//#endregion
//#region src/data/interpret-examples.json
var interpret_examples_default = [
	{
		"description": "рыжая девушка читает книгу у окна, на улице дождь, без очков",
		"tags": "1girl, solo, red hair, reading, holding book, window, rain, indoors",
		"sentence": "A red-haired girl reads a book by a rainy window.",
		"text": "",
		"negative": "glasses"
	},
	{
		"description": "Two knights cross swords on a bridge at sunset, view from below",
		"tags": "2boys, knight, armor, sword, fighting, bridge, sunset, from below",
		"sentence": "Two armored knights clash with their swords on a stone bridge at sunset.",
		"text": "",
		"negative": ""
	},
	{
		"description": "вывеска кафе с надписью «Открыто», вечер, неоновый свет",
		"tags": "no humans, cafe, storefront, sign, evening, neon lights, text, english text",
		"sentence": "A cafe storefront glows with neon light in the evening.",
		"text": "OPEN",
		"negative": ""
	}
];
//#endregion
//#region src/domain/interpret.ts
var INTERPRET_SCHEMA = {
	name: "nai_image_prompt",
	description: "NovelAI image prompt extracted from a description",
	strict: true,
	value: {
		type: "object",
		properties: {
			tags: {
				type: "array",
				items: { type: "string" },
				description: "English Danbooru tags"
			},
			sentence: {
				type: "string",
				description: "One to three short plain English sentences"
			},
			text: {
				type: "string",
				description: "Exact words written in the picture, or empty"
			},
			negative: {
				type: "array",
				items: { type: "string" },
				description: "Things that must not appear"
			}
		},
		required: [
			"tags",
			"sentence",
			"text",
			"negative"
		],
		additionalProperties: false
	}
};
var RULES = [
	"Convert an image description (Russian or English, prose or tags) into a NovelAI image prompt.",
	"tags: English Danbooru tags in lowercase with spaces (not underscores): subject count (1girl, 2boys, 1boy 1girl, no humans), appearance, clothing, expression, pose and action, place, time and light, camera and framing; keep tags the user already wrote.",
	"Count people by gender: a woman, girl, witch, queen or princess is a girl, a man or boy is a boy, unless the description says otherwise.",
	"sentence: one to three short plain English sentences only for what tags cannot say (who is where, interactions, mood).",
	"text: the exact words written in the picture (signs, speech), empty if none.",
	"negative: things that must not appear (from \"no\", \"without\", \"без\", \"не\").",
	"What must not appear goes only to negative, never to tags (no \"no ...\" tags for it).",
	"Do not invent details. Do not add quality or style tags. Do not use names of original characters; use a Danbooru character tag only for well-known characters."
].join("\n");
function interpretMessages(description, glossary) {
	const used = glossary.filter((g) => g.from.trim() && g.to.trim() && description.toLowerCase().includes(g.from.trim().toLowerCase()));
	return {
		system: `${RULES}${used.length ? `\nAlways translate these terms this way:\n${used.map((g) => `- ${g.from} => ${g.to}`).join("\n")}` : ""}\nAnswer only with JSON: {"tags": [...], "sentence": "...", "text": "...", "negative": [...]}`,
		prompt: description
	};
}
/** Few-shot continuation for text completion models (no JSON schema there). */
function interpretCompletion(description, glossary) {
	const shot = (e) => `Description: ${e.description}\nTags: ${e.tags}\nSentence: ${e.sentence}\nText: ${e.text}\nNegative: ${e.negative}`;
	const used = glossary.filter((g) => g.from.trim() && g.to.trim() && description.toLowerCase().includes(g.from.trim().toLowerCase()));
	return [
		"{ Convert image descriptions into NovelAI prompts: English Danbooru tags, a short English sentence, in-image text and things to avoid. }",
		...interpret_examples_default.map(shot),
		...used.map((g) => `Description: ${g.from.trim()}\nTags: ${g.to.trim()}\nSentence:\nText:\nNegative:`),
		`Description: ${description.replace(/\s*\n\s*/g, " ").trim()}`
	].join("\n");
}
var COMPLETION_INTERPRET_PREFILL = "Tags:";
var list$2 = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : []).map((x) => String(x).trim()).filter(Boolean);
/** Reads either the JSON answer or the "Tags: / Sentence: / Text: / Negative:" lines. */
function parseInterpretation(raw) {
	let source = raw;
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		const json = trimmed.match(/\{[\s\S]*\}/)?.[0];
		if (json) try {
			source = JSON.parse(json);
		} catch {
			source = trimmed;
		}
	}
	if (source && typeof source === "object") {
		const o = source;
		const tags = list$2(o.tags);
		if (!tags.length && !String(o.sentence ?? "").trim()) return null;
		return {
			tags,
			sentence: String(o.sentence ?? "").trim(),
			text: String(o.text ?? "").trim(),
			negative: list$2(o.negative)
		};
	}
	if (typeof source !== "string") return null;
	const text = /^\s*tags\s*:/i.test(source) ? source : `Tags: ${source}`;
	const field = (name) => {
		return (text.match(new RegExp(`^\\s*${name}\\s*:[ \\t]*(.*)$`, "im"))?.[1] ?? "").trim();
	};
	const cut = text.split(/\n\s*description\s*:/i)[0];
	const tags = list$2(cut.match(/^\s*tags\s*:[ \t]*(.*)$/im)?.[1] ?? "");
	if (!tags.length) return null;
	return {
		tags,
		sentence: field("sentence"),
		text: field("text"),
		negative: list$2(field("negative"))
	};
}
var normalize = (t) => tagName(t).replace(/\s+/g, " ").trim();
function lookup(index, candidate) {
	return index.byName.get(candidate) ?? index.byAlias.get(candidate);
}
/** Simple English word forms: plurals, -ing, -ed (smiling → smile, holding → hold, boots → boot). */
function wordForms(word) {
	const forms = /* @__PURE__ */ new Set();
	if (word.endsWith("ies")) forms.add(`${word.slice(0, -3)}y`);
	if (word.endsWith("es")) forms.add(word.slice(0, -2));
	if (word.endsWith("s") && !word.endsWith("ss")) forms.add(word.slice(0, -1));
	if (word.endsWith("ing")) {
		const stem = word.slice(0, -3);
		forms.add(stem);
		forms.add(`${stem}e`);
		if (/(.)\1$/.test(stem)) forms.add(stem.slice(0, -1));
	}
	if (word.endsWith("ed")) {
		forms.add(word.slice(0, -2));
		forms.add(word.slice(0, -1));
	}
	return [...forms];
}
function editDistance(a, b, limit) {
	if (Math.abs(a.length - b.length) > limit) return limit + 1;
	let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const row = [i];
		let best = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
			row.push(value);
			best = Math.min(best, value);
		}
		if (best > limit) return limit + 1;
		prev = row;
	}
	return prev[b.length];
}
/** The known tag for a candidate, or null. Weighted or braced tags are passed through untouched. */
function matchTag(index, raw) {
	const candidate = normalize(raw);
	if (!candidate) return null;
	if (/::|[{}[\]]/.test(raw) || /^\d+(girl|boy|other)s?$/.test(candidate) || /^[a-z]+:/.test(candidate)) return {
		tag: raw.trim(),
		kind: "exact"
	};
	const direct = index.byName.get(candidate);
	if (direct) return {
		tag: direct.name,
		kind: "exact"
	};
	const alias = index.byAlias.get(candidate);
	if (alias) return {
		tag: alias.name,
		kind: "alias"
	};
	const words = candidate.split(" ");
	const last = words.at(-1);
	for (const form of wordForms(last)) {
		const hit = lookup(index, [...words.slice(0, -1), form].join(" "));
		if (hit) return {
			tag: hit.name,
			kind: "form"
		};
	}
	for (let i = 1; i < words.length; i++) {
		const hit = lookup(index, words.slice(i).join(" "));
		if (hit) return {
			tag: hit.name,
			kind: "part",
			rest: words.slice(0, i).join(" ")
		};
	}
	if (candidate.length >= 7 && !hasCyrillic(candidate)) {
		const limit = candidate.length >= 10 ? 2 : 1;
		let best = null;
		for (const entry of index.entries) {
			if (entry.name[0] !== candidate[0] || Math.abs(entry.name.length - candidate.length) > limit) continue;
			if (editDistance(entry.name, candidate, limit) <= limit && (!best || entry.count > best.count)) best = entry;
		}
		if (best) return {
			tag: best.name,
			kind: "fuzzy"
		};
	}
	return null;
}
/**
* A Danbooru alias that is the tag plus more words ("red apple" -> apple): the extra words are
* lost in the tag, so the phrase is kept as well (V4+ reads it).
*/
function aliasAddsWords(raw, tag) {
	if (hasCyrillic(raw)) return false;
	const words = tagName(raw).split(/\s+/).filter(Boolean);
	const tagWords = tag.split(/\s+/);
	return words.length > tagWords.length && tagWords.every((w) => words.includes(w));
}
function matchTags(index, candidates) {
	const tags = [];
	const unmatched = [];
	const seen = /* @__PURE__ */ new Set();
	for (const raw of candidates) {
		const hit = matchTag(index, raw);
		if (!hit) {
			if (raw.trim()) unmatched.push(raw.trim());
			continue;
		}
		if (!seen.has(hit.tag)) {
			seen.add(hit.tag);
			tags.push(hit.tag);
		}
		if (hit.rest) unmatched.push(`${hit.rest} ${hit.tag}`);
		else if (hit.kind === "alias" && aliasAddsWords(raw, hit.tag)) unmatched.push(tagName(raw));
	}
	return {
		tags,
		unmatched
	};
}
/**
* Tags that contradict the negative: the negated thing itself and "no X" / "without X" for it.
* Real tags like "no humans" stay unless their subject is in the negative.
*/
function withoutNegated(matched, negative) {
	const banned = new Set(negative.map((n) => tagName(n)).filter(Boolean));
	if (!banned.size) return matched;
	const keep = (tag) => {
		const name = tagName(tag);
		const subject = name.match(/^(?:no|without)\s+(.+)$/)?.[1];
		return !banned.has(name) && !(subject && banned.has(subject));
	};
	return {
		tags: matched.tags.filter(keep),
		unmatched: matched.unmatched.filter(keep)
	};
}
var sentenceCase = (s) => {
	const t = s.trim();
	if (!t) return "";
	const capital = t[0].toUpperCase() + t.slice(1);
	return /[.!?]$/.test(capital) ? capital : `${capital}.`;
};
/** The prompt for one model family; the in-image text block goes last. */
function assembleInterpretation(p, matched, family) {
	const tags = [...matched.tags];
	if (family === "v3") return tags.join(", ");
	const phrases = matched.unmatched.filter((u) => !hasCyrillic(u));
	const head = [...tags, ...phrases].join(", ");
	const sentence = sentenceCase(p.sentence);
	let prompt = sentence ? head ? `${head}. ${sentence}` : sentence : head;
	if (p.text) prompt = prompt ? `${/[.!?]$/.test(prompt) ? prompt : `${prompt}.`} Text: ${p.text}` : `Text: ${p.text}`;
	return prompt;
}
/** True when the text is already a tag list the model reads as is (no LLM needed). */
function looksLikeTags(index, text) {
	if (hasCyrillic(text)) return false;
	const pieces = text.split(/[,|\n]/).map((t) => t.replace(/-?\d*\.?\d+::|::|[{}[\]]/g, "").trim()).filter(Boolean);
	if (!pieces.length) return true;
	if (pieces.some((p) => p.split(/\s+/).length > 5)) return false;
	if (!index) return pieces.every((p) => p.split(/\s+/).length <= 3);
	return pieces.filter((p) => matchTag(index, p)?.kind === "exact" || matchTag(index, p)?.kind === "alias").length / pieces.length >= .6;
}
/**
* Whether a text should go through the interpreter: Russian always (V4.x cannot read it, V5 does not
* officially support it, unless the user allows Russian on V5); English prose on V3 and V4.x (tags
* work better there); English prose on V5 is sent as is in auto mode.
*/
function needsInterpretation(text, family, mode, index, russianOnV5 = false) {
	if (mode === "off" || !text.trim()) return false;
	const tags = looksLikeTags(index, text);
	if (mode === "always") return !tags;
	if (hasCyrillic(text)) return !(family === "v5" && russianOnV5);
	if (tags) return false;
	return family !== "v5";
}
function interpretCacheSource(text, family, glossary) {
	const terms = glossary.filter((g) => g.from.trim() && g.to.trim()).map((g) => `${g.from.trim().toLowerCase()}=${g.to.trim()}`).sort().join(";");
	return `${family}\u0000${text.trim()}\u0000${terms}`;
}
//#endregion
//#region src/domain/marker-instructions.ts
var COMMON_TAIL = `- "caption": a few words in {{captionLanguage}} shown under the picture.
- "chars": one entry per person in the picture (up to 4): {"name":"...","look":"...","action":"...","pos":"left|center|right"}. "look" is that one person only: "1girl" / "1boy" / "1other" first, then hair, eyes, body, clothes. Each person gets their own prompt, so looks of different people never mix: never describe people in "prompt".
- Characters whose looks are known{{charsHint}}: their name in "chars" is enough — their appearance is added automatically; "look" only for what they wear differently now.
- Optional keys: "ratio": "portrait", "landscape", "square", "wide" or "tall"; "negative": what must not be in the picture; "text": words written in the picture; "id": a short name for the picture and "ref": the id of an earlier picture to continue its scene; "spoiler": true for a picture that gives too much away.
- Write the marker exactly in this form, inside the reply where the picture belongs. Never write image links or file names, and do not talk about the markers.`;
var MARKER_TEMPLATES = {
	natural: `[Illustrations]
You can show pictures inside your reply. Where a picture really adds something (a new place, an important moment, how someone looks), put an image marker on its own line:
<img data-nai='{"prompt":"what the picture shows, in plain words","caption":"short caption"}'>
- {{count}}
- "prompt": describe the picture in plain words, in any language: how many people and what they do together, the place, the light, the mood and the camera angle. The looks of each person go to "chars". No tag lists, no quality words.
${COMMON_TAIL}`,
	tags: `[Illustrations]
You can show pictures inside your reply. Where a picture really adds something (a new place, an important moment, how someone looks), put an image marker on its own line:
<img data-nai='{"prompt":"1girl, red hair, school uniform, sitting, classroom, evening light","caption":"short caption"}'>
- {{count}}
- "prompt": Danbooru-style tags in English separated by commas (count of people, what they do together, place, light, camera), optionally followed by one short sentence. The looks of each person go to "chars".
${COMMON_TAIL}`
};
function countRule(min, max) {
	const lo = Math.max(0, Math.floor(min));
	const hi = Math.max(lo, Math.floor(max));
	if (hi <= 0) return "Do not add pictures.";
	if (lo === 0) return `Use at most ${hi} ${hi === 1 ? "picture" : "pictures"} per reply, none when nothing fits.`;
	if (lo === hi) return `Use exactly ${hi} ${hi === 1 ? "picture" : "pictures"} per reply.`;
	return `Use ${lo} to ${hi} pictures per reply.`;
}
/** The instruction text for a preset; an empty custom text falls back to "natural". */
function markerInstruction(preset, custom, vars) {
	const template = preset === "custom" && custom.trim() ? custom : MARKER_TEMPLATES[preset === "tags" ? "tags" : "natural"];
	const names = vars.chars.map((n) => n.trim()).filter(Boolean);
	const values = {
		count: countRule(vars.min, vars.max),
		min: String(vars.min),
		max: String(vars.max),
		captionLanguage: vars.captionLanguage.trim() || "the language of the reply",
		chars: names.join(", "),
		charsHint: names.length ? ` (known characters: ${names.join(", ")})` : ""
	};
	return template.replace(/\{\{(\w+)\}\}/g, (whole, key) => values[key] ?? whole).trim();
}
//#endregion
//#region src/data/species-words.json
var species_words_default = [
	{
		"evidence": [
			"elf",
			"elv",
			"эльф",
			"остроух"
		],
		"tags": [
			"elf",
			"elves",
			"dark elf",
			"high elf",
			"wood elf",
			"half-elf",
			"half elf",
			"pointy ears"
		]
	},
	{
		"evidence": [
			"demon",
			"devil",
			"демон",
			"дьявол",
			"бес"
		],
		"tags": [
			"demon",
			"demon girl",
			"demon boy",
			"devil"
		]
	},
	{
		"evidence": ["succub", "суккуб"],
		"tags": ["succubus"]
	},
	{
		"evidence": ["angel", "ангел"],
		"tags": ["angel"]
	},
	{
		"evidence": ["vampir", "вампир"],
		"tags": ["vampire"]
	},
	{
		"evidence": [
			"orc",
			"ork",
			"орк"
		],
		"tags": ["orc"]
	},
	{
		"evidence": ["goblin", "гоблин"],
		"tags": ["goblin"]
	},
	{
		"evidence": [
			"dwar",
			"гном",
			"дварф"
		],
		"tags": ["dwarf"]
	},
	{
		"evidence": [
			"fair",
			"фея",
			"фей"
		],
		"tags": ["fairy"]
	},
	{
		"evidence": [
			"kitsune",
			"fox",
			"кицунэ",
			"лис"
		],
		"tags": [
			"kitsune",
			"fox girl",
			"fox boy"
		]
	},
	{
		"evidence": [
			"cat",
			"neko",
			"кош",
			"кот",
			"неко",
			"нэко"
		],
		"tags": [
			"cat girl",
			"catgirl",
			"cat boy",
			"nekomimi"
		]
	},
	{
		"evidence": [
			"wolf",
			"wolv",
			"волк",
			"волч"
		],
		"tags": ["wolf girl", "wolf boy"]
	},
	{
		"evidence": ["dragon", "дракон"],
		"tags": ["dragon girl", "dragon boy"]
	},
	{
		"evidence": [
			"slime",
			"слайм",
			"слиз"
		],
		"tags": ["slime girl"]
	},
	{
		"evidence": ["lamia", "ламия"],
		"tags": ["lamia"]
	},
	{
		"evidence": [
			"mermaid",
			"merman",
			"русал"
		],
		"tags": ["mermaid", "merman"]
	},
	{
		"evidence": [
			"android",
			"robot",
			"cyborg",
			"андроид",
			"робот",
			"киборг"
		],
		"tags": [
			"android",
			"robot",
			"cyborg",
			"robot girl"
		]
	},
	{
		"evidence": [
			"ghost",
			"spirit",
			"призрак",
			"дух"
		],
		"tags": ["ghost", "ghost girl"]
	}
];
//#endregion
//#region src/domain/passport-gen.ts
var LIMITS = {
	description: 6e3,
	personality: 1500,
	scenario: 1500,
	firstMessage: 2500
};
var FIELDS = [
	"base",
	"hair",
	"eyes",
	"body",
	"skin",
	"clothing",
	"accessories"
];
var SYSTEM_CARD = [
	"You read a roleplay character card and write visual \"passports\" for an image generator (NovelAI, Danbooru tags).",
	"Answer only with JSON: {\"passports\": [...]}, one entry per thing that can be drawn:",
	"- kind \"character\": every person or creature whose appearance the text describes (the main character and the others). Fields: name, aliases (short names, nicknames, and the name written in Cyrillic as a Russian text would spell it), base (count tag and what they are: \"1girl, elf, adult\", \"1boy, demon\", \"1other, slime girl\"), hair, eyes, body (build, height, figure, notable features), skin, clothing (usual outfit), accessories, outfits (other named outfits as {\"name\",\"tags\"}), nsfw (explicit body details only if the text gives them), negative (what must never be drawn for them).",
	"- kind \"world\": the setting as a whole (era, technology, magic, overall look) in \"tags\".",
	"- kind \"location\": a recurring named place, how it looks, in \"tags\".",
	"- kind \"scenario\": only when the card is a scenario or a narrator rather than one character; the visual tags of the situation in \"tags\".",
	"- kind \"object\": an important item or vehicle, how it looks, in \"tags\".",
	"Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the text says or clearly implies, never invent (a species or race only when the text names it, never from a name, a title or the setting); leave a field empty when unknown. Explicit anatomy (genitals, nipples, the penis of a futanari) goes only to \"nsfw\"; a futanari is \"1girl\" in base and \"futanari, penis\" in nsfw. Keep names as written in the card. No quality, art style or colour palette tags (pastel colors, vibrant colors, muted colors, monochrome). clothing is ONE default outfit (what they wear most): one item per body part, one colour per item, never alternatives (\"blue or grey coat\"); every other outfit of the text goes to \"outfits\"."
].join("\n");
var SYSTEM_PERSONA = [
	"You read the description of the player's persona in a roleplay and write one visual passport for an image generator (NovelAI, Danbooru tags).",
	"Answer only with JSON: {\"passports\": [ one entry of kind \"character\" ]} with the fields name, aliases, base (count tag and what they are: \"1girl, adult\", \"1boy, elf\"), hair, eyes, body, skin, clothing, accessories, outfits ({\"name\",\"tags\"}), nsfw (explicit body details only if given), negative.",
	"Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the text says or clearly implies, never invent (a species or race only when the text names it, never from a name, a title or the setting); leave a field empty when unknown. Explicit anatomy (genitals, nipples, the penis of a futanari) goes only to \"nsfw\"; a futanari is \"1girl\" in base and \"futanari, penis\" in nsfw. No quality, art style or colour palette tags (pastel colors, vibrant colors, muted colors, monochrome). clothing is ONE default outfit (what they wear most): one item per body part, one colour per item, never alternatives (\"blue or grey coat\"); every other outfit of the text goes to \"outfits\"."
].join("\n");
var SYSTEM_NPC = [
	"You read how a roleplay scene tracker describes a character right now, and the story card they come from, and write one visual passport for an image generator (NovelAI, Danbooru tags).",
	"Answer only with JSON: {\"passports\": [ one entry of kind \"character\" ]} with the fields name, aliases, base (count tag and what they are: \"1girl, elf, adult\", \"1boy, orc\"), hair, eyes, body, skin, clothing (what they wear in the tracker), accessories, outfits, nsfw (explicit body details only if given), negative.",
	"Permanent features (species, body, face, hair, eyes, skin) go to their fields; temporary states (wet, wounded, blushing) are left out.",
	"The story card describes the world and other characters: take from it only what it says about this character by name, never the traits of anyone else (race, hair, clothes).",
	"Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the texts say or clearly imply about this character, never invent (a species or race only when the text names it, never from a name, a title or the setting); leave a field empty when unknown. Explicit anatomy (genitals, nipples, the penis of a futanari) goes only to \"nsfw\"; a futanari is \"1girl\" in base and \"futanari, penis\" in nsfw. No quality, art style or colour palette tags (pastel colors, vibrant colors, muted colors, monochrome). clothing is ONE default outfit (what they wear most): one item per body part, one colour per item, never alternatives (\"blue or grey coat\"); every other outfit of the text goes to \"outfits\"."
].join("\n");
/** Kinds another extension can have a passport written for (v0.12, generatePassport). */
var ENTRY_PASSPORT_KINDS = [
	"character",
	"location",
	"object",
	"world"
];
var ENTRY_THING = {
	character: "one person or creature",
	location: "one place",
	object: "one item or vehicle",
	world: "the world of the story as a whole"
};
var ENTRY_FIELDS = {
	character: "one entry of kind \"character\" with the fields name, aliases, base (count tag and what they are: \"1girl, elf, adult\", \"1boy, orc\", \"1other, dragon\"), hair, eyes, body, skin, clothing, accessories, outfits ({\"name\",\"tags\"}), nsfw (explicit body details only if given), negative",
	location: "one entry of kind \"location\" with the fields name, aliases, tags (how the place looks: architecture or landscape, interior, materials, light, notable details; never people), negative",
	object: "one entry of kind \"object\" with the fields name, aliases, tags (how it looks: shape, material, colours, notable details), negative",
	world: "one entry of kind \"world\" with the fields name, aliases, tags (the setting as a whole: era, technology, magic, overall look), negative"
};
var LANGUAGE_NAMES = {
	ru: "Russian",
	en: "English",
	uk: "Ukrainian",
	be: "Belarusian",
	de: "German",
	fr: "French",
	es: "Spanish",
	it: "Italian",
	pt: "Portuguese",
	pl: "Polish",
	ja: "Japanese",
	zh: "Chinese",
	ko: "Korean"
};
/** A language code ("ru", "ru-RU") as its English name; anything else as given. */
function languageName(language) {
	const value = language.trim();
	return LANGUAGE_NAMES[value.toLowerCase().split(/[-_]/)[0] ?? ""] ?? value;
}
/** System prompt for one passport of a lorebook entry (a person, place, item or the world). */
function entrySystem(kind, language) {
	const spelled = language ? `the name as a ${languageName(language)} text spells it` : "the name written in Cyrillic as a Russian text would spell it";
	const character = kind === "character";
	return [
		`You read a lorebook entry of a roleplay about ${ENTRY_THING[kind]} and write one visual passport for an image generator (NovelAI, Danbooru tags).`,
		`Answer only with JSON: {"passports": [ ${ENTRY_FIELDS[kind]} ]}.`,
		`aliases: short names, nicknames and ${spelled}.`,
		character ? "Permanent features go to their fields; temporary states (wet, wounded, blushing) are left out. Explicit anatomy (genitals, nipples, the penis of a futanari) goes only to \"nsfw\"; a futanari is \"1girl\" in base and \"futanari, penis\" in nsfw. clothing is ONE default outfit (what they wear most): one item per body part, one colour per item, never alternatives; every other outfit of the text goes to \"outfits\"." : "Only what can be seen in a still picture: no names, history, sounds or smells.",
		"Rules: English Danbooru tags, lowercase, comma separated, spaces instead of underscores. Only what the text says or clearly implies, never invent (a species or race only when the text names it, never from a name, a title or the setting); leave a field empty when unknown. No quality, art style or colour palette tags (pastel colors, vibrant colors, muted colors, monochrome)."
	].join("\n");
}
var str$1 = { type: "string" };
var PASSPORT_GEN_SCHEMA = {
	name: "nai_passports",
	description: "Visual passports of the characters, world, locations, scenario and objects of a card",
	strict: false,
	value: {
		type: "object",
		properties: { passports: {
			type: "array",
			items: {
				type: "object",
				properties: {
					kind: {
						type: "string",
						enum: [...PASSPORT_KINDS]
					},
					name: str$1,
					aliases: {
						type: "array",
						items: str$1
					},
					...Object.fromEntries(FIELDS.map((f) => [f, str$1])),
					outfits: {
						type: "array",
						items: {
							type: "object",
							properties: {
								name: str$1,
								tags: str$1
							},
							required: ["name", "tags"]
						}
					},
					nsfw: str$1,
					negative: str$1,
					tags: str$1
				},
				required: ["kind", "name"]
			}
		} },
		required: ["passports"]
	}
};
function clip(text, max) {
	const value = (text ?? "").trim();
	return value.length > max ? `${value.slice(0, max)}…` : value;
}
var SYSTEMS = {
	card: SYSTEM_CARD,
	persona: SYSTEM_PERSONA,
	npc: SYSTEM_NPC
};
var LABELS = {
	card: "Card",
	persona: "Persona",
	npc: "Character",
	entry: "Entry"
};
/** System and user messages for a card, a persona, one character of a scene tracker or a lorebook entry. */
function passportGenMessages(source, target, options = {}) {
	const system = target === "entry" ? entrySystem(options.kind ?? "character", options.language) : SYSTEMS[target];
	const parts = [`${LABELS[target]}: ${source.name}`, `${target === "npc" ? "Tracker" : "Description"}:\n${clip(source.description, LIMITS.description)}`];
	if (source.personality?.trim()) parts.push(`Personality:\n${clip(source.personality, LIMITS.personality)}`);
	if (source.scenario?.trim()) parts.push(`${target === "npc" ? "Story card" : "Scenario"}:\n${clip(source.scenario, target === "npc" ? LIMITS.description : LIMITS.scenario)}`);
	if (source.firstMessage?.trim()) parts.push(`First message:\n${clip(source.firstMessage, LIMITS.firstMessage)}`);
	if (target === "entry" && options.language?.trim()) parts.push(`Story language: ${languageName(options.language)}`);
	return {
		system,
		user: parts.join("\n\n")
	};
}
/** The first JSON value in a text (code fences, chatter around it). */
function extractJson(text) {
	const cleaned = text.replace(/```(?:json)?/gi, "").trim();
	try {
		return JSON.parse(cleaned);
	} catch {}
	const start = cleaned.search(/[[{]/);
	if (start < 0) return null;
	const close = cleaned[start] === "{" ? "}" : "]";
	const end = cleaned.lastIndexOf(close);
	if (end <= start) return null;
	try {
		return JSON.parse(cleaned.slice(start, end + 1));
	} catch {
		return null;
	}
}
var asText$1 = (value) => typeof value === "string" ? value : Array.isArray(value) ? value.filter((v) => typeof v === "string").join(", ") : "";
/** Palette and quality words that belong to the art style, not to a passport. */
var STYLE_TAG = /^(?:(?:pastel|vibrant|muted|vivid|bright|dark|soft|warm|cool|earth|neutral|light) colou?rs?|colou?rful|monochrome|limited palette|masterpiece|best quality|high quality|amazing quality|very aesthetic|absurdres|highres)$/i;
/** Danbooru tags as NovelAI reads them: spaces, not underscores; duplicates and style words dropped. */
function tags$1(value) {
	return joinTags(splitTags(asText$1(value).replace(/_/g, " ")).filter((tag) => !STYLE_TAG.test(tag)).join(", "));
}
/**
* Passports from the answer; entries without a name or anything visual are dropped. An entry without a
* known kind is `defaultKind`; the fallback name goes to an unnamed entry of that kind.
*/
function parseGeneratedPassports(raw, fallbackName = "", defaultKind = "character") {
	const data = typeof raw === "string" ? extractJson(raw) : raw;
	const list = Array.isArray(data) ? data : data && typeof data === "object" && Array.isArray(data.passports) ? data.passports : [];
	const result = [];
	for (const item of list) {
		if (!item || typeof item !== "object") continue;
		const o = item;
		const kind = PASSPORT_KINDS.includes(String(o.kind)) ? o.kind : defaultKind;
		const name = asText$1(o.name).trim() || (kind === defaultKind ? fallbackName : "");
		if (!name) continue;
		const passport = defaultPassport(kind, name, newPassportId());
		passport.aliases = (Array.isArray(o.aliases) ? o.aliases.map(asText$1) : asText$1(o.aliases).split(",")).map((a) => a.trim()).filter((a) => a && a.toLowerCase() !== name.toLowerCase());
		if (kind === "character") {
			for (const field of FIELDS) passport.slots[field] = tags$1(o[field]);
			passport.outfits = (Array.isArray(o.outfits) ? o.outfits : []).filter((x) => !!x && typeof x === "object").map((x) => ({
				name: asText$1(x.name).trim(),
				tags: tags$1(x.tags)
			})).filter((x) => x.name && x.tags);
			passport.nsfw = {
				enabled: false,
				tags: tags$1(o.nsfw)
			};
			moveExplicitAnatomy(passport);
			if (isFutanari(passport)) passport.nsfw.enabled = true;
			if (!passport.slots.clothing && passport.outfits[0]) passport.activeOutfit = passport.outfits[0].name;
		} else passport.tags = tags$1(o.tags);
		passport.negative = tags$1(o.negative);
		if (kind === "character" ? PASSPORT_SLOTS.some((slot) => passport.slots[slot]) || passport.outfits.length > 0 : passport.tags !== "") result.push(passport);
	}
	return result;
}
/** Sentences of a text that name a character (any spelling the name matcher accepts), joined. */
function sentencesNaming(text, names) {
	return text.split(/(?<=[.!?…])\s+|\n+/).filter((sentence) => sentence.trim() && mentionIndex(sentence, names) >= 0).join(" ").trim();
}
var escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/**
* Species tags the source text never mentions (v0.9.7): a language model sometimes makes a noble
* of a fantasy-sounding country an elf. Tags of a species stay when the text names it anywhere.
*/
function withoutUnstatedSpecies(passports, sourceText) {
	const unstated = /* @__PURE__ */ new Set();
	for (const entry of species_words_default) if (!new RegExp(`(^|[^\\p{L}])(${entry.evidence.map(escapeRe).join("|")})`, "iu").test(sourceText)) for (const tag of entry.tags) unstated.add(tag);
	const keep = (text) => splitTags(text).filter((tag) => !unstated.has(tag.toLowerCase())).join(", ");
	for (const passport of passports) {
		if (passport.kind !== "character") continue;
		for (const slot of PASSPORT_SLOTS) passport.slots[slot] = keep(passport.slots[slot]);
		passport.outfits = passport.outfits.map((o) => ({
			...o,
			tags: keep(o.tags)
		}));
	}
	return passports;
}
//#endregion
//#region src/domain/provided-passports.ts
function passportGroup(kind) {
	return kind === "world" || kind === "scenario" ? "setting" : kind;
}
/**
* The same one under two entries: one name (or alias) is a whole word of the other's name, also in a
* declined Russian form (the matcher of scene participants). Nameless entries are never the same.
*/
function sameNamed(a, b) {
	if (!a.name.trim() || !b.name.trim()) return false;
	return mentionIndex(a.name, [b.name, ...b.aliases]) >= 0 || mentionIndex(b.name, [a.name, ...a.aliases]) >= 0;
}
/**
* A provider's answer as passports: junk, empty passports and nameless ones (except a world or a
* scenario) are left out; a passport without an id gets a stable one from the provider, kind and name.
*/
function normalizeProvidedPassports(raw, providerId) {
	if (!Array.isArray(raw)) return [];
	const result = [];
	for (const item of raw) {
		const passport = normalizePassport(item);
		if (!passport || isPassportEmpty(passport)) continue;
		if (!passport.name && passportGroup(passport.kind) !== "setting") continue;
		const id = item.id;
		if (typeof id !== "string" || !id.trim()) passport.id = `${providerId}:${passport.kind}:${passport.name.toLowerCase() || result.length}`;
		result.push(passport);
	}
	return result;
}
/**
* Provider passports (best first) NAI Studio does not have yet: one named like a known entry or like an
* earlier provider passport is left out. Pass passports and known entries of one group.
*/
function unknownPassports(provided, known) {
	const kept = [];
	for (const passport of provided) {
		const same = (other) => sameNamed(passport, other);
		if (known.some(same) || kept.some(same)) continue;
		kept.push(passport);
	}
	return kept;
}
var des_words_default = {
	time: {
		"dawn": [
			"dawn",
			"daybreak",
			"sunrise",
			"рассвет",
			"заря",
			"зари",
			"восход"
		],
		"morning": [
			"morning",
			"утро",
			"утра",
			"утром",
			"утрен"
		],
		"day": [
			"noon",
			"midday",
			"afternoon",
			"daytime",
			"день",
			"дня",
			"днём",
			"днем",
			"полдень",
			"полдня",
			"дневн"
		],
		"sunset": [
			"sunset",
			"dusk",
			"twilight",
			"закат",
			"сумерк",
			"смеркается"
		],
		"evening": [
			"evening",
			"вечер",
			"вечером",
			"вечерн"
		],
		"night": [
			"night",
			"midnight",
			"ночь",
			"ночи",
			"ночью",
			"ночн",
			"полночь",
			"полуночи"
		]
	},
	weather: {
		"storm": [
			"storm",
			"thunder",
			"lightning",
			"гроза",
			"грозы",
			"шторм",
			"буря",
			"бури",
			"молни",
			"гром"
		],
		"snow": [
			"snow",
			"blizzard",
			"flurr",
			"снег",
			"снеж",
			"метель",
			"вьюг",
			"пурга"
		],
		"rain": [
			"rain",
			"drizzle",
			"shower",
			"downpour",
			"дожд",
			"ливень",
			"ливн",
			"морос"
		],
		"fog": [
			"fog",
			"mist",
			"haze",
			"туман",
			"дымк",
			"мгла"
		],
		"cloudy": [
			"cloud",
			"overcast",
			"облач",
			"пасмур",
			"тучи",
			"туч"
		],
		"wind": [
			"wind",
			"gale",
			"ветер",
			"ветр",
			"ветрен"
		],
		"clear": [
			"clear",
			"sunny",
			"ясно",
			"ясн",
			"солнеч",
			"безоблач"
		]
	},
	indoors: [
		"indoor",
		"inside",
		"interior",
		"в помещении",
		"внутри",
		"помещени",
		"в доме",
		"в комнате",
		"в здании",
		"hall",
		"room",
		"corridor",
		"kitchen",
		"library",
		"office",
		"lobby",
		"foyer",
		"chamber",
		"basement",
		"attic",
		"tavern",
		"холл",
		"зал ",
		"зала",
		"зале",
		"залы",
		"залу",
		"гостин",
		"спальн",
		"кухн",
		"кабинет",
		"коридор",
		"библиотек",
		"столов",
		"ванн",
		"комнат",
		"таверн",
		"трактир",
		"подвал",
		"чердак",
		"фойе",
		"вестибюл",
		"прихож",
		"лобби",
		"кают",
		"аудитори"
	],
	outdoors: [
		"outdoor",
		"outside",
		"на улице",
		"снаружи",
		"под открытым небом"
	],
	appearanceKeys: [
		"appearance",
		"look",
		"outfit",
		"cloth",
		"attire",
		"wear",
		"dress",
		"equipment",
		"equipement",
		"внешн",
		"облик",
		"одежд",
		"наряд",
		"экипир",
		"vneshn",
		"odezhd",
		"naryad"
	],
	stateKeys: [
		"effect",
		"status",
		"condition",
		"injur",
		"состоян",
		"эффект",
		"ранени",
		"sostoyan"
	]
};
//#endregion
//#region src/domain/des.ts
var isObject$1 = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
function text$1(value) {
	if (typeof value === "string") return value.trim();
	if (typeof value === "number") return String(value);
	if (isObject$1(value)) {
		for (const key of [
			"value",
			"forecast",
			"text",
			"content",
			"name"
		]) if (typeof value[key] === "string" && value[key]) return value[key].trim();
	}
	return "";
}
/** JSON as DES's models write it: tolerate trailing commas. */
function parseLoose(json) {
	try {
		return JSON.parse(json);
	} catch {
		try {
			return JSON.parse(json.replace(/,\s*([}\]])/g, "$1"));
		} catch {
			return null;
		}
	}
}
/** Balanced top-level {…} of a text (strings respected), like DES's own scanner. */
function jsonObjectsIn(source, limit = 5e4) {
	const found = [];
	const end = Math.min(source.length, limit);
	let i = 0;
	while (i < end) {
		if (source[i] !== "{") {
			i++;
			continue;
		}
		let depth = 1;
		let j = i + 1;
		let inString = false;
		let escape = false;
		while (j < end && depth > 0) {
			const ch = source[j];
			if (escape) escape = false;
			else if (ch === "\\") escape = true;
			else if (ch === "\"") inString = !inString;
			else if (!inString) {
				if (ch === "{") depth++;
				else if (ch === "}") depth--;
			}
			j++;
		}
		if (depth === 0) {
			found.push(source.slice(i, j));
			i = j;
		} else i++;
	}
	return found;
}
/** The DES tracker object in a reply text (the first object with quests, infoBox or characters). */
function trackerFromText(reply) {
	const cleaned = reply.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, "");
	for (const json of jsonObjectsIn(cleaned)) {
		const data = parseLoose(json);
		if (isObject$1(data) && ("infoBox" in data || "characters" in data || "quests" in data)) return normalizeTracker(data.infoBox, data.characters);
	}
	return null;
}
/** The tracker DES saved for a message swipe (`extra.dooms_tracker_swipes`, JSON strings). */
function trackerFromSwipe(extra, swipeId = 0) {
	const store = isObject$1(extra) ? extra.dooms_tracker_swipes : void 0;
	const entry = Array.isArray(store) ? store[swipeId] : isObject$1(store) ? store[String(swipeId)] : void 0;
	if (!isObject$1(entry)) return null;
	const read = (value) => typeof value === "string" ? parseLoose(value) : value;
	const infoBox = read(entry.infoBox);
	const thoughts = read(entry.characterThoughts);
	if (!infoBox && !thoughts) return null;
	return normalizeTracker(infoBox, thoughts);
}
function normalizeTracker(infoBox, characters) {
	const list = Array.isArray(characters) ? characters : isObject$1(characters) && Array.isArray(characters.characters) ? characters.characters : [];
	const box = isObject$1(infoBox) && isObject$1(infoBox.infoBox) ? infoBox.infoBox : infoBox;
	return {
		scene: isObject$1(box) ? sceneFromInfoBox(box) : null,
		characters: list.map(characterOf).filter(Boolean)
	};
}
var has = (haystack, stems) => stems.some((stem) => haystack.includes(stem));
function characterOf(raw) {
	if (!isObject$1(raw)) return null;
	const name = text$1(raw.name);
	if (!name) return null;
	const details = isObject$1(raw.details) ? raw.details : {};
	const fields = [...Object.entries(details).map(([k, v]) => [k.toLowerCase(), text$1(v)]), ...[
		"appearance",
		"outfit",
		"clothing",
		"status",
		"effects"
	].map((k) => [k, text$1(raw[k])])];
	const pick = (stems) => fields.filter(([k, v]) => v && has(k, stems)).map(([, v]) => v);
	return {
		name,
		look: [.../* @__PURE__ */ new Set([...pick(des_words_default.appearanceKeys), ...pick(des_words_default.stateKeys)])].join("; ")
	};
}
/** Hour of a time text ("14:20", "Evening, 19:40"), or null. */
function hourOf(time) {
	const match = time.match(/(\d{1,2})[:.](\d{2})/);
	if (!match) return null;
	const hour = Number(match[1]);
	return hour >= 0 && hour < 24 ? hour : null;
}
function timeOfDay(time) {
	const lower = time.toLowerCase();
	for (const [part, stems] of Object.entries(des_words_default.time)) if (has(lower, stems)) return part;
	const hour = hourOf(time);
	if (hour === null) return "";
	if (hour >= 4 && hour < 6) return "dawn";
	if (hour >= 6 && hour < 11) return "morning";
	if (hour >= 11 && hour < 17) return "day";
	if (hour >= 17 && hour < 21) return "evening";
	return "night";
}
var TIME_TAGS = {
	dawn: ["sunrise"],
	morning: ["morning"],
	day: ["day"],
	sunset: ["sunset"],
	evening: ["evening"],
	night: ["night"]
};
var EMOJI_WEATHER = [
	[/⛈|🌩/u, "storm"],
	[/❄|🌨|☃/u, "snow"],
	[/🌧|☔|🌦/u, "rain"],
	[/🌫/u, "fog"],
	[/☁|🌥/u, "cloudy"],
	[/🌬/u, "wind"],
	[/☀|🌤/u, "clear"]
];
function weatherOf(forecast, emoji) {
	const lower = forecast.toLowerCase();
	for (const [kind, stems] of Object.entries(des_words_default.weather)) if (has(lower, stems)) return kind;
	for (const [pattern, kind] of EMOJI_WEATHER) if (pattern.test(emoji)) return kind;
	return "";
}
/** Image tags of a time of day as a tracker writes it ("late evening", "Evening, 19:40", Russian words too); empty when unknown. */
function timeTags(time) {
	return [...TIME_TAGS[timeOfDay(time)] ?? []];
}
/**
* Image tags of the weather as a tracker writes it (words or an emoji); empty when unknown. A clear sky
* needs the time of day (`time`): blue by day, a night sky in the evening and at night.
*/
function weatherTags(forecast, emoji = "", time = "") {
	const kind = weatherOf(forecast, emoji);
	if (kind === "storm") return ["storm", "lightning"];
	if (kind === "snow") return ["snow", "snowing"];
	if (kind === "rain" || kind === "fog" || kind === "wind") return [kind];
	if (kind === "cloudy") return ["cloudy sky"];
	const part = timeOfDay(time);
	if (kind === "clear" && part) return [part === "night" || part === "evening" ? "night sky" : "blue sky"];
	return [];
}
/** Scene of a DES info box with its image tags. */
function sceneFromInfoBox(box) {
	const location = text$1(box.location);
	const timeRaw = box.time;
	const time = isObject$1(timeRaw) ? text$1(timeRaw.end) || text$1(timeRaw.start) || text$1(timeRaw) : text$1(timeRaw);
	const weatherRaw = box.weather;
	const weather = text$1(weatherRaw);
	const emoji = isObject$1(weatherRaw) ? text$1(weatherRaw.emoji) : "";
	const context = [
		weather,
		location,
		text$1(box.conditions),
		text$1(box.terrain)
	].join(" ").toLowerCase();
	const indoors = has(context, des_words_default.indoors);
	const outdoors = !indoors && has(context, des_words_default.outdoors);
	const tags = timeTags(time);
	if (indoors) tags.push("indoors");
	else {
		if (outdoors) tags.push("outdoors");
		tags.push(...weatherTags(weather, emoji, time));
	}
	return {
		location,
		time,
		weather,
		tags: [...new Set(tags)]
	};
}
var COUNT_TAG = /^(?:\d+\+?\s?(?:girls?|boys?|others?)|solo|solo focus|multiple (?:girls|boys|others)|no humans)$/i;
/**
* A converted look without subject-count tags ("1girl", "solo"): who the character is comes from
* their passport; a converter guessing the count from a clothing description is often wrong.
*/
function withoutCountTags(prompt) {
	const cut = prompt.search(/\.\s/);
	const head = cut >= 0 ? prompt.slice(0, cut) : prompt;
	const tail = cut >= 0 ? prompt.slice(cut) : "";
	return `${head.split(",").map((tag) => tag.trim()).filter((tag) => tag && !COUNT_TAG.test(tag)).join(", ")}${tail}`.trim();
}
//#endregion
//#region src/domain/backgrounds.ts
/** Undesired content of every background: nobody in the picture. */
var BACKGROUND_NEGATIVE = "1girl, 1boy, multiple girls, multiple boys, people, crowd";
/** Background ratio (16:9); within the free pixel budget it is 1344×768, free on Opus. */
var BACKGROUND_RATIO = "wide";
/** Tags of a time of day as a tracker writes it ("late evening", "19:40", Russian words too); unknown words as given. */
function timeOfDayTags(value) {
	const text = value.trim();
	return text ? joinTags(...timeTags(text)) || text : "";
}
/**
* Tags of the weather as a tracker writes it ("rain", "clear", Russian words too); unknown words as given. A clear sky is
* blue unless the time of day says evening or night.
*/
function backgroundWeatherTags(value, timeOfDay = "") {
	const text = value.trim();
	return text ? joinTags(...weatherTags(text, "", timeOfDay.trim() || "noon")) || text : "";
}
/** Positive prompt of a background: scenery without people, how the place looks, the time and weather. */
function backgroundPrompt(input) {
	const looks = joinTags(input.placeTags ?? "", input.tags ?? "");
	const time = input.timeOfDay ?? "";
	return joinTags("no humans", "scenery", looks || input.locationName.trim(), timeOfDayTags(time), backgroundWeatherTags(input.weather ?? "", time));
}
/** A place name as a file name part: Latin letters and digits joined by "-", at most 40 characters. */
function backgroundSlug(name) {
	return latinLetters(name).normalize("NFKD").replace(/\p{M}+/gu, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").slice(0, 40).replace(/-+$/, "") || "place";
}
/** File name of a background in SillyTavern's library: `maestro-<slug>-<timestamp>.png`. */
function backgroundFileName(locationName, timestamp) {
	return `maestro-${backgroundSlug(locationName)}-${Math.max(0, Math.floor(timestamp))}.png`;
}
var look_words_default = {
	stop: {
		"en": [
			"a",
			"an",
			"the",
			"and",
			"or",
			"but",
			"with",
			"without",
			"of",
			"in",
			"on",
			"at",
			"to",
			"for",
			"from",
			"by",
			"as",
			"into",
			"onto",
			"her",
			"hers",
			"his",
			"him",
			"their",
			"its",
			"she",
			"he",
			"they",
			"it",
			"is",
			"are",
			"was",
			"were",
			"be",
			"been",
			"has",
			"have",
			"had",
			"this",
			"that",
			"these",
			"those",
			"which",
			"who",
			"while",
			"also",
			"still",
			"now",
			"currently",
			"very",
			"quite",
			"rather",
			"slightly",
			"somewhat",
			"bit",
			"little",
			"some",
			"wearing",
			"wears",
			"worn",
			"dressed",
			"looks",
			"looking",
			"appears",
			"seems"
		],
		"ru": [
			"и",
			"а",
			"но",
			"или",
			"да",
			"же",
			"ли",
			"не",
			"ни",
			"в",
			"во",
			"на",
			"с",
			"со",
			"к",
			"ко",
			"у",
			"о",
			"об",
			"обо",
			"от",
			"до",
			"по",
			"за",
			"из",
			"без",
			"для",
			"под",
			"над",
			"при",
			"про",
			"через",
			"её",
			"его",
			"их",
			"она",
			"он",
			"они",
			"оно",
			"это",
			"этот",
			"эта",
			"эти",
			"тот",
			"та",
			"те",
			"свой",
			"своя",
			"своё",
			"свои",
			"своей",
			"своим",
			"своими",
			"своих",
			"который",
			"которая",
			"которые",
			"как",
			"так",
			"что",
			"уже",
			"ещё",
			"сейчас",
			"теперь",
			"тоже",
			"также",
			"всё",
			"все",
			"весь",
			"вся",
			"очень",
			"слегка",
			"немного",
			"чуть",
			"довольно",
			"был",
			"была",
			"было",
			"были",
			"есть",
			"одет",
			"одета",
			"одето",
			"одеты",
			"носит",
			"выглядит",
			"кажется"
		]
	},
	endings: { "ru": [
		"ями",
		"ами",
		"ого",
		"его",
		"ому",
		"ему",
		"ыми",
		"ими",
		"ая",
		"яя",
		"ое",
		"ее",
		"ые",
		"ие",
		"ый",
		"ий",
		"ой",
		"ей",
		"ом",
		"ем",
		"ым",
		"им",
		"ую",
		"юю",
		"ах",
		"ях",
		"ов",
		"ев",
		"а",
		"я",
		"о",
		"е",
		"ы",
		"и",
		"у",
		"ю",
		"ь"
	] }
};
//#endregion
//#region src/domain/des-portraits.ts
/** Word-set similarity (Jaccard) below which a look without a passport counts as a new look. */
var PORTRAIT_LOOK_THRESHOLD = .6;
/** Words are cut to this many letters (after the ending): the wording changes word forms. */
var STEM_LENGTH = 5;
/** An ending is taken off only when this many letters stay. */
var MIN_STEM = 3;
/** A stored look longer than this is cut. */
var MAX_STORED_LOOK = 1e3;
var STOP_WORDS = new Set([...look_words_default.stop.en, ...look_words_default.stop.ru].map(lookKey));
/** Russian endings of adjectives, nouns and participles, longest first. */
var RU_ENDINGS = look_words_default.endings.ru.map(lookKey).sort((a, b) => b.length - a.length);
/** A word without its ending (a Russian case ending, an English plural "s"), cut to a stem. */
function stem(word) {
	let base = word;
	if (hasCyrillic(word)) {
		const ending = RU_ENDINGS.find((end) => word.endsWith(end) && [...word].length - [...end].length >= MIN_STEM);
		if (ending) base = word.slice(0, -ending.length);
	} else if (/^[a-z]{4,}$/.test(word) && /[^su]s$/.test(word)) base = word.slice(0, -1);
	return [...base].slice(0, STEM_LENGTH).join("");
}
function textHash(text) {
	let hash = 0;
	for (let i = 0; i < text.length; i++) hash = Math.imul(31, hash) + text.charCodeAt(i) | 0;
	return (hash >>> 0).toString(16);
}
/** The normalised words of a look: no stop words, stems, no duplicates, sorted. */
function lookTokens(look) {
	const tokens = /* @__PURE__ */ new Set();
	for (const word of lookKey(look).split(" ")) {
		if ([...word].length < 2 || STOP_WORDS.has(word)) continue;
		tokens.add(stem(word));
	}
	return [...tokens].sort();
}
/** Similarity of two looks by their normalised words (Jaccard); two empty looks are the same. */
function lookSimilarity(a, b) {
	const x = new Set(lookTokens(a));
	const y = new Set(lookTokens(b));
	if (!x.size && !y.size) return 1;
	let common = 0;
	for (const token of x) if (y.has(token)) common++;
	return common / (x.size + y.size - common);
}
/** A look changed enough for a new portrait of a character without a passport. */
function lookChanged(before, now) {
	return lookSimilarity(before, now) < PORTRAIT_LOOK_THRESHOLD;
}
/** The identity a portrait is drawn from: the passport part, or only "look" without a passport. */
function portraitIdentity(passport) {
	if (!passport) return "look";
	const states = passport.states.filter((state) => state.enabled).map((state) => state.id).sort().join(",");
	return [
		"passport",
		passport.id,
		passportTags(passport, { allowNsfw: false }),
		passport.activeOutfit,
		states
	].join("|");
}
/** The record of a portrait drawn now. */
function portraitRecord(passport, look) {
	return {
		hash: textHash(portraitIdentity(passport)),
		look: look.trim().slice(0, MAX_STORED_LOOK)
	};
}
/** A stored record; null for none and for records written before 0.13.2 (a bare hash string). */
function readPortraitRecord(raw) {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
	const source = raw;
	if (typeof source.hash !== "string") return null;
	return {
		hash: source.hash,
		...typeof source.look === "string" ? { look: source.look } : {}
	};
}
/** Whether an automatic portrait is due (the menu's "new portrait" always draws). */
function portraitDecision(check) {
	if (!check.exists || check.policy === "every") return "draw";
	if (check.policy !== "state") return "keep";
	const before = readPortraitRecord(check.stored);
	if (!before) return "adopt";
	if (before.hash !== check.current.hash) return "draw";
	if (check.passport) return "keep";
	if (before.look === void 0) return "adopt";
	return lookChanged(before.look, check.current.look ?? "") ? "draw" : "keep";
}
//#endregion
//#region src/domain/vision.ts
var VISION_APIS = [
	{
		id: "openrouter",
		label: "OpenRouter",
		secret: "api_key_openrouter",
		defaultModel: "google/gemini-2.5-flash"
	},
	{
		id: "openai",
		label: "OpenAI",
		secret: "api_key_openai",
		defaultModel: "gpt-4o-mini"
	},
	{
		id: "anthropic",
		label: "Anthropic (Claude)",
		secret: "api_key_claude",
		defaultModel: "claude-haiku-4-5"
	},
	{
		id: "google",
		label: "Google AI Studio",
		secret: "api_key_makersuite",
		defaultModel: "gemini-2.5-flash"
	},
	{
		id: "mistral",
		label: "Mistral AI",
		secret: "api_key_mistralai",
		defaultModel: "pixtral-12b-latest"
	},
	{
		id: "groq",
		label: "Groq",
		secret: "api_key_groq",
		defaultModel: "meta-llama/llama-4-scout-17b-16e-instruct"
	},
	{
		id: "xai",
		label: "xAI",
		secret: "api_key_xai",
		defaultModel: "grok-2-vision-latest"
	},
	{
		id: "cohere",
		label: "Cohere",
		secret: "api_key_cohere",
		defaultModel: "command-a-vision-07-2025"
	}
];
function visionApi(id) {
	return VISION_APIS.find((api) => api.id === id);
}
/** Is a secret set? SillyTavern keeps a flag or a list of saved keys per secret. */
function hasSecret(state, secret) {
	const value = state?.[secret];
	return Array.isArray(value) ? value.length > 0 : Boolean(value);
}
/** The model to send: the chosen one, else the API's starting model. */
function visionModel(apiId, model) {
	return model.trim() || visionApi(apiId)?.defaultModel || "";
}
var explicit_words_default = {
	tags: [
		"nsfw",
		"explicit",
		"nude",
		"nudity",
		"naked",
		"topless",
		"bottomless",
		"sex",
		"hetero",
		"yuri",
		"yaoi",
		"penis",
		"erection",
		"testicles",
		"pussy",
		"vagina",
		"vaginal",
		"anal",
		"clitoris",
		"nipples",
		"areolae",
		"breasts out",
		"cum",
		"ejaculation",
		"fellatio",
		"blowjob",
		"oral",
		"handjob",
		"paizuri",
		"cunnilingus",
		"masturbation",
		"fingering",
		"orgasm",
		"penetration",
		"missionary",
		"doggystyle",
		"cowgirl position",
		"spread legs",
		"genitals",
		"lewd",
		"hentai",
		"no panties",
		"no bra",
		"undressing",
		"секс",
		"сексом",
		"сексе",
		"секса",
		"голая",
		"голый",
		"голые",
		"голой",
		"голую",
		"голым",
		"голых",
		"нагая",
		"нагой",
		"нагие",
		"нагишом",
		"соски",
		"сосков"
	],
	stems: [
		"обнажен",
		"обнажён",
		"раздет",
		"минет",
		"оргазм",
		"пенис",
		"эрекц",
		"вагин",
		"мастурб"
	]
};
//#endregion
//#region src/domain/explicit.ts
var escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
var WHOLE = new RegExp(`(^|[^\\p{L}\\p{N}])(${explicit_words_default.tags.map(escape).join("|")})(?=$|[^\\p{L}\\p{N}])`, "iu");
var STEMS = new RegExp(`(^|[^\\p{L}\\p{N}])(${explicit_words_default.stems.map(escape).join("|")})`, "iu");
/** True when the text of a scene asks for nudity or sex. */
function isExplicitScene(text) {
	const normalized = text.replace(/_/g, " ");
	return WHOLE.test(normalized) || STEMS.test(normalized);
}
/**
* An explicit scene (v0.9.8) gets "nsfw" in its prompt, so NovelAI's UC preset leaves it out of the
* undesired content as the website does. `extraNegative` (the setting for explicit scenes, v0.9.9)
* joins the undesired content without the tags `undesired` already has. Null for other scenes.
*/
function explicitScene(scene, characterPrompts, extraNegative = "", undesired = "") {
	if (!isExplicitScene([scene, ...characterPrompts].join(", "))) return null;
	const hasTag = /(^|[^a-z])nsfw([^a-z]|$)/i.test(scene);
	const tagsOf = (text) => text.split(/[,\n]/).map((tag) => tag.trim()).filter(Boolean);
	const present = new Set(tagsOf(undesired).map((tag) => tag.toLowerCase()));
	const negative = tagsOf(extraNegative).filter((tag) => {
		const key = tag.toLowerCase();
		if (present.has(key)) return false;
		present.add(key);
		return true;
	});
	return {
		scene: hasTag ? scene : scene.trim() ? `nsfw, ${scene}` : "nsfw",
		negative: negative.join(", ")
	};
}
//#endregion
//#region src/domain/negatives.ts
/** A stored mode; anything else (absent in styles saved before v0.13) is "replace". */
function negativeMode(value) {
	return value === "append" ? "append" : "replace";
}
var OPEN = /* @__PURE__ */ new Set([
	"{",
	"[",
	"("
]);
var CLOSE = /* @__PURE__ */ new Set([
	"}",
	"]",
	")"
]);
/** Comma or newline separated parts of a negative, trimmed, empty ones dropped, duplicates kept. */
function negativeTags(text) {
	const tags = [];
	let depth = 0;
	let weighted = false;
	let start = 0;
	const push = (end) => {
		const tag = text.slice(start, end).trim();
		if (tag) tags.push(tag);
	};
	for (let i = 0; i < text.length; i++) {
		const ch = text[i];
		if (OPEN.has(ch)) depth++;
		else if (CLOSE.has(ch)) depth = Math.max(0, depth - 1);
		else if (ch === ":" && text[i + 1] === ":") {
			weighted = !weighted;
			i++;
		} else if ((ch === "," || ch === "\n") && depth === 0 && !weighted) {
			push(i);
			start = i + 1;
		}
	}
	push(text.length);
	return tags;
}
var tagKey = (tag) => tag.toLowerCase().replace(/\s+/g, " ");
/** Joins negatives in order; a tag already there is dropped (first wins). */
function mergeNegatives(...parts) {
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const tag of parts.flatMap(negativeTags)) {
		const key = tagKey(tag);
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(tag);
	}
	return result.join(", ");
}
/** The tags of `text` that `remove` does not have, in order. */
function subtractNegatives(text, remove) {
	const removed = new Set(negativeTags(remove).map(tagKey));
	return negativeTags(text).filter((tag) => !removed.has(tagKey(tag))).join(", ");
}
/** The same tags in the same order, ignoring case, spaces and separators. */
function sameNegative(a, b) {
	const left = negativeTags(a).map(tagKey);
	const right = negativeTags(b).map(tagKey);
	return left.length === right.length && left.every((tag, i) => tag === right[i]);
}
/** The undesired content a style's own negative makes: itself, or the base and then itself. */
function effectiveNegative(base, own, mode) {
	return mode === "append" ? mergeNegatives(base, own) : own;
}
/**
* The style's own part of an effective negative: all of it for "replace"; for "append" the first
* candidate that gives exactly this effective negative (what the user typed, the saved style), else
* the tags the base does not have.
*/
function ownNegative(effective, base, mode, candidates = []) {
	if (mode !== "append") return effective;
	for (const own of candidates) if (own !== void 0 && sameNegative(mergeNegatives(base, own), effective)) return own;
	return subtractNegatives(effective, base);
}
//#endregion
//#region src/features/quality/quality-gate.ts
var DEFAULT_GATE_TIMEOUT_MS = 2e4;
var MIN_GATE_TIMEOUT_MS = 1e3;
var MAX_GATE_TIMEOUT_MS = 6e5;
/** Settled verdicts kept for later drawings of the same reply (DES trackers come late). */
var MAX_ENTRIES = 64;
var gates = /* @__PURE__ */ new Set();
var listeners$1 = /* @__PURE__ */ new Set();
var entries = /* @__PURE__ */ new Map();
/** The time limit in range: 1 s … 10 min, 20 s when unset. */
function clampGateTimeout(ms) {
	const value = Number(ms);
	if (!Number.isFinite(value) || value <= 0) return DEFAULT_GATE_TIMEOUT_MS;
	return Math.min(MAX_GATE_TIMEOUT_MS, Math.max(MIN_GATE_TIMEOUT_MS, Math.round(value)));
}
function gateTimeout() {
	return clampGateTimeout(settings().quality?.gateTimeoutMs);
}
var swipeOf = (message) => {
	const id = Number(message.swipe_id ?? 0);
	return Number.isInteger(id) && id >= 0 ? id : 0;
};
var chatIdNow = () => String(ctx().getCurrentChatId() ?? "");
function changed() {
	for (const listener of listeners$1) try {
		listener();
	} catch (error) {
		log.warn("quality gate listener failed", error);
	}
}
/** Registers a gate; returns its unregistration. Pending verdicts stop waiting for a gate that goes. */
function registerQualityGate(gate) {
	const registration = { gate };
	gates.add(registration);
	changed();
	return () => {
		if (!gates.delete(registration)) return;
		for (const entry of [...entries.values()]) if (entry.phase === "asking" && entry.waiting.has(registration)) vote(entry, registration, true);
		changed();
	};
}
/** A gate is registered: automatic drawings of a reply wait for its verdict. */
function qualityGatesActive() {
	return gates.size > 0;
}
/** Gates registered or removed (the settings panel shows its section only with a gate). */
function onQualityGatesChange(listener) {
	listeners$1.add(listener);
	return () => listeners$1.delete(listener);
}
function isCurrent(entry) {
	const c = ctx();
	return chatIdNow() === entry.chatId && c.chat[entry.messageIndex] === entry.message && swipeOf(entry.message) === entry.swipeId;
}
function forget(entry) {
	if (entries.get(entry.key) === entry) entries.delete(entry.key);
}
function settle$1(entry, verdict) {
	if (entry.phase === "settled") return;
	entry.phase = "settled";
	if (entry.timer) clearTimeout(entry.timer);
	entry.timer = null;
	entry.waiting.clear();
	const final = verdict !== "cancelled" && !isCurrent(entry) ? "cancelled" : verdict;
	if (final === "cancelled") forget(entry);
	entry.resolve(final);
}
function vote(entry, registration, ok) {
	if (entry.phase !== "asking") return;
	if (!ok) {
		log.info(`quality gate: reply ${entry.messageIndex} (swipe ${entry.swipeId}) is redone, its pictures wait`);
		settle$1(entry, "skip");
		return;
	}
	entry.waiting.delete(registration);
	if (!entry.waiting.size) settle$1(entry, "draw");
}
/** Every gate at once; the time limit runs from now (the end of the reply). */
function ask$3(entry) {
	entry.phase = "asking";
	entry.waiting = new Set(gates);
	if (!entry.waiting.size) {
		settle$1(entry, "draw");
		return;
	}
	const limit = gateTimeout();
	entry.timer = setTimeout(() => {
		log.info(`quality gate: no answer for reply ${entry.messageIndex} in ${limit} ms, drawing`);
		settle$1(entry, "draw");
	}, limit);
	const detail = {
		messageIndex: entry.messageIndex,
		swipeId: entry.swipeId
	};
	for (const registration of [...entry.waiting]) {
		let answer;
		try {
			answer = registration.gate({ ...detail });
		} catch (error) {
			log.warn("quality gate failed, counted as \"ok\"", error);
			vote(entry, registration, true);
			continue;
		}
		Promise.resolve(answer).then((ok) => vote(entry, registration, ok !== false), (error) => {
			log.warn("quality gate failed, counted as \"ok\"", error);
			vote(entry, registration, true);
		});
	}
}
/** Old settled verdicts go first when there are too many. */
function prune() {
	if (entries.size <= MAX_ENTRIES) return;
	for (const entry of [...entries.values()]) {
		if (entries.size <= MAX_ENTRIES) return;
		if (entry.phase === "settled") forget(entry);
	}
}
/**
* The verdict for the automatic drawings of a reply (its current swipe). Without gates: "draw" at once.
* `streaming`: the reply is still being written, the gates are asked when replyComplete() is called;
* a later request without it means the reply is complete.
*/
function replyVerdict(messageIndex, options = {}) {
	if (!gates.size) return Promise.resolve("draw");
	const message = ctx().chat[messageIndex];
	if (!message) return Promise.resolve("cancelled");
	const chatId = chatIdNow();
	const swipeId = swipeOf(message);
	const key = `${chatId}\u0000${messageIndex}\u0000${swipeId}`;
	let entry = entries.get(key);
	if (entry && entry.message !== message) {
		settle$1(entry, "cancelled");
		forget(entry);
		entry = void 0;
	}
	if (!entry) {
		let resolve;
		const promise = new Promise((r) => resolve = r);
		entry = {
			key,
			chatId,
			messageIndex,
			swipeId,
			message,
			phase: "deferred",
			waiting: /* @__PURE__ */ new Set(),
			timer: null,
			promise,
			resolve
		};
		entries.set(key, entry);
		prune();
	}
	if (entry.phase === "deferred" && !options.streaming) ask$3(entry);
	return entry.promise;
}
/** The reply is complete: verdicts that waited for it ask the gates now (the time limit starts here). */
function replyComplete(messageIndex) {
	for (const entry of [...entries.values()]) if (entry.phase === "deferred" && entry.messageIndex === messageIndex) {
		if (isCurrent(entry)) ask$3(entry);
		else settle$1(entry, "cancelled");
	}
}
/** A reply that will not be drawn (stopped, markers off): its waiting verdicts are cancelled. */
function replyAbandoned(messageIndex) {
	for (const entry of [...entries.values()]) if (entry.phase === "deferred" && (messageIndex === void 0 || entry.messageIndex === messageIndex)) settle$1(entry, "cancelled");
}
/** Swipes, deletions, another chat: verdicts of a reply swipe no longer shown are cancelled. */
function revalidateVerdicts() {
	for (const entry of [...entries.values()]) {
		if (isCurrent(entry)) continue;
		if (entry.phase === "settled") forget(entry);
		else settle$1(entry, "cancelled");
	}
}
/**
* A new generation: settled verdicts are forgotten (a continued reply is checked again) and verdicts of
* a reply that never completed are cancelled. Verdicts being asked keep waiting for their reply.
*/
function qualityGenerationStarted() {
	for (const entry of [...entries.values()]) if (entry.phase === "settled") forget(entry);
	else if (entry.phase === "deferred") settle$1(entry, "cancelled");
}
//#endregion
//#region src/features/auto/auto-generation.ts
var SKIPPED_TYPES$1 = /* @__PURE__ */ new Set([
	"extension",
	"command",
	"first_message",
	"impersonate",
	"quiet"
]);
var GUARD_CODES = /* @__PURE__ */ new Set([
	"free-only-blocked",
	"price-too-high",
	"busy"
]);
function chatState() {
	const metadata = ctx().chatMetadata;
	const existing = metadata.nai_studio;
	if (existing && typeof existing === "object") return existing;
	const created = {};
	metadata.nai_studio = created;
	return created;
}
var AutoGenerator = class {
	controller;
	pipeline;
	constructor(controller, pipeline) {
		this.controller = controller;
		this.pipeline = pipeline;
	}
	attach() {
		const c = ctx();
		c.eventSource.on(c.eventTypes.CHARACTER_MESSAGE_RENDERED ?? "character_message_rendered", (id, type) => {
			this.onMessage(Number(id), String(type ?? ""));
		});
	}
	async onMessage(id, type) {
		const rules = settings().auto;
		if (!rules.enabled || SKIPPED_TYPES$1.has(type)) return;
		const message = ctx().chat[id];
		if (!message || message.is_user || message.is_system || message.extra?.nai_studio) return;
		const meta = chatState();
		const previous = meta.auto ?? {
			messagesSince: 0,
			lastAt: 0
		};
		const decision = evaluateAuto(rules, previous, message.mes, Date.now());
		meta.auto = decision.fire ? {
			messagesSince: previous.messagesSince + 1,
			lastAt: previous.lastAt
		} : decision.state;
		ctx().saveMetadata();
		if (!decision.fire) {
			if (decision.blockedBy) log.debug("auto generation held by", decision.blockedBy);
			return;
		}
		const budget = autoBudget(settings().anlas.freeOnly, rules.allowPaid);
		try {
			const preview = this.controller.prepare();
			if (preview.cost.total > budget) {
				log.info(`auto generation skipped: would cost ${preview.cost.total} Anlas (budget ${budget})`);
				return;
			}
		} catch (error) {
			log.warn("auto generation skipped:", toNaiError(error).code);
			return;
		}
		if (qualityGatesActive()) {
			const verdict = await replyVerdict(id);
			if (verdict !== "draw") {
				log.info(`auto generation skipped by the quality gate (${verdict})`);
				return;
			}
		}
		meta.auto = decision.state;
		ctx().saveMetadata();
		const mode = rules.mode;
		const trigger = TRIGGER_WORDS[mode] ?? TRIGGER_WORDS[MODE.NOW] ?? "last";
		try {
			await this.pipeline.generatePicture({
				initiator: "auto",
				trigger,
				message: mode === MODE.RAW_LAST ? message.mes : void 0,
				maxCost: budget,
				skipCostConfirm: true,
				queue: {
					priority: "reply",
					kind: "auto"
				}
			});
			log.info("auto generation fired by", decision.reason);
		} catch (error) {
			const naiError = toNaiError(error);
			log.warn("auto generation failed:", naiError.code);
			if (!GUARD_CODES.has(naiError.code)) reportGenerationError(naiError);
		}
	}
};
//#endregion
//#region src/features/events/studio-events.ts
var STUDIO_EVENTS = [
	"passportsSaved",
	"imageReady",
	"requestFailed"
];
var listeners = {
	passportsSaved: /* @__PURE__ */ new Set(),
	imageReady: /* @__PURE__ */ new Set(),
	requestFailed: /* @__PURE__ */ new Set()
};
function onStudioEvent(event, listener) {
	const set = listeners[event];
	set.add(listener);
	return () => {
		set.delete(listener);
	};
}
function emitStudioEvent(event, detail) {
	for (const listener of [...listeners[event]]) try {
		const result = listener(structuredClone(detail));
		if (result instanceof Promise) result.catch((error) => log.warn(`${event} listener failed`, error));
	} catch (error) {
		log.warn(`${event} listener failed`, error);
	}
}
/** An image was attached to a message (after the chat was saved). */
function imageReady(messageIndex, kind, passportIds = []) {
	emitStudioEvent("imageReady", {
		messageIndex,
		kind,
		passportIds: [...passportIds]
	});
}
//#endregion
//#region src/features/characters/character-prompts.ts
var CARD_FIELD = "nai_studio";
/** Card field the built-in writes when its "Shareable" box is checked (RECON §2.1.7). */
var BUILTIN_CARD_FIELD = "sd_character_prompt";
var EMPTY = {
	positive: "",
	negative: ""
};
/** Avatar file name without extension: the key the built-in uses (getCharaFilename). */
function avatarKey(avatar) {
	return (avatar ?? "").replace(/\.[^/.]+$/, "");
}
/** Index of the character of a 1:1 chat, undefined in groups or with no character selected. */
function soloCharacterIndex() {
	const c = ctx();
	if (c.groupId || c.characterId === void 0 || c.characterId === null || c.characterId === "") return void 0;
	const index = Number(c.characterId);
	return Number.isInteger(index) && c.characters[index] ? index : void 0;
}
function asPrompt(value) {
	if (!value || typeof value !== "object") return null;
	const prompt = value;
	return {
		positive: String(prompt.positive ?? ""),
		negative: String(prompt.negative ?? "")
	};
}
/** The card's shared prompt: ours first, then the built-in's. `own` = stored in our field. */
function cardPrompt(character) {
	const extensions = character?.data?.extensions;
	const own = asPrompt((extensions?.[CARD_FIELD])?.characterPrompt);
	if (own) return {
		prompt: own,
		own: true
	};
	const builtIn = asPrompt(extensions?.[BUILTIN_CARD_FIELD]);
	return builtIn ? {
		prompt: builtIn,
		own: false
	} : null;
}
/** Local values win; empty local values fall back to the card (same precedence as the built-in). */
function readCharacterPrompt(character) {
	if (!character) return {
		...EMPTY,
		shared: false
	};
	const local = settings().prompts.characterPrompts[avatarKey(character.avatar)] ?? EMPTY;
	const card = cardPrompt(character);
	return {
		positive: local.positive || card?.prompt.positive || "",
		negative: local.negative || card?.prompt.negative || "",
		shared: card?.own === true
	};
}
/** Prompt of the current 1:1 character (empty in groups, like the built-in). */
function currentCharacterPrompt() {
	const index = soloCharacterIndex();
	return index === void 0 ? EMPTY : readCharacterPrompt(ctx().characters[index]);
}
/** Free mode `char` prefix: current character, or in groups the last character who spoke. */
function lastSpeakerPrompt() {
	const c = ctx();
	const index = soloCharacterIndex();
	if (index !== void 0) return readCharacterPrompt(c.characters[index]);
	for (let i = c.chat.length - 1; i >= 0; i--) {
		const message = c.chat[i];
		const avatar = message?.original_avatar;
		if (message && !message.is_user && !message.is_system && typeof avatar === "string") return readCharacterPrompt(c.characters.find((ch) => ch.avatar === avatar));
	}
	return EMPTY;
}
async function saveCharacterPrompt(index, value, share) {
	const c = ctx();
	const character = c.characters[index];
	if (!character) return;
	settings().prompts.characterPrompts[avatarKey(character.avatar)] = { ...value };
	saveSettings();
	const existing = character.data?.extensions?.["nai_studio"] ?? {};
	if (share) await c.writeExtensionField(index, CARD_FIELD, {
		...existing,
		characterPrompt: { ...value }
	});
	else if (existing.characterPrompt) await c.writeExtensionField(index, CARD_FIELD, {
		...existing,
		characterPrompt: null
	});
}
//#endregion
//#region src/features/characters/passport-store.ts
/** Key of chat_metadata where NAI Studio keeps its chat data. */
var META_KEY$1 = "nai_studio";
/** Prefix of the owner of a persona passport ("persona:<avatar>"), also the persona candidate key. */
var PERSONA_OWNER_PREFIX = "persona:";
var savedListeners = /* @__PURE__ */ new Set();
/** Called after the passports of a card are saved (integrations keep their copies in sync). */
function onPassportsSaved(listener) {
	savedListeners.add(listener);
}
function cardField(character) {
	return character?.data?.extensions?.[CARD_FIELD];
}
/** Every passport of the card (characters, world, locations, scenario, objects), as stored. */
function cardPassports(character) {
	const field = cardField(character);
	return normalizePassportList(field?.passports, field?.passport);
}
/** The passport of the card's own character (the composer, sprites and tools use it). */
function cardPassport(character) {
	return primaryPassport(cardPassports(character), character?.name ?? "");
}
/** Lazily loaded cards (shallow) have no extensions until unshallowed. */
async function loadCharacter(index) {
	const c = ctx();
	if (c.characters[index]?.shallow) await c.unshallowCharacter(index);
	return ctx().characters[index];
}
/** Card indexes of the current chat: the 1:1 character or every group member. */
function chatCardIndexes() {
	const c = ctx();
	if (c.groupId) return (c.groups?.find((g) => g.id === c.groupId)?.members ?? []).map((avatar) => c.characters.findIndex((ch) => ch.avatar === avatar)).filter((i) => i >= 0);
	if (c.characterId !== void 0 && c.characterId !== null && c.characterId !== "") {
		const index = Number(c.characterId);
		return Number.isInteger(index) && c.characters[index] ? [index] : [];
	}
	return [];
}
/** Index of a card by its avatar file, with or without the extension; -1 when absent. */
function cardIndexByAvatar(avatar) {
	const characters = ctx().characters;
	const exact = characters.findIndex((ch) => ch.avatar === avatar);
	return exact >= 0 ? exact : characters.findIndex((ch) => avatarKey(ch.avatar) === avatarKey(avatar));
}
async function saveCardPassports(index, passports) {
	const c = ctx();
	const character = await loadCharacter(index);
	if (!character) return;
	const existing = character.data?.extensions?.["nai_studio"] ?? {};
	const main = primaryPassport(passports, character.name);
	await c.writeExtensionField(index, CARD_FIELD, {
		...existing,
		passports,
		passport: main ?? void 0
	});
	for (const listener of savedListeners) try {
		listener(index, passports);
	} catch {}
	emitStudioEvent("passportsSaved", {
		ids: passports.map((p) => p.id),
		scope: "card",
		avatar: character.avatar
	});
}
/** Replaces one passport of the card by id (or adds it). */
async function saveCardPassport(index, passport) {
	const list = cardPassports(await loadCharacter(index));
	const at = list.findIndex((p) => p.id === passport.id);
	if (at >= 0) list[at] = passport;
	else list.push(passport);
	await saveCardPassports(index, list);
}
var personas = null;
async function currentPersonaKey() {
	try {
		personas ??= await importHost("/scripts/personas.js");
		return personas.user_avatar || "default";
	} catch {
		return "default";
	}
}
/** The current persona without waiting: its module is loaded once (`user_avatar` is a live binding). */
function knownPersonaKey() {
	return personas?.user_avatar || "default";
}
function personaPassport(key) {
	return normalizePassport(settings().scene.personaPassports[key]);
}
function savePersonaPassport(key, passport) {
	settings().scene.personaPassports[key] = passport;
	saveSettings();
	emitStudioEvent("passportsSaved", {
		ids: [passport.id],
		scope: "card",
		persona: true
	});
}
function personaOwner(key) {
	return `${PERSONA_OWNER_PREFIX}${key}`;
}
/** A chat is open (chat-scope passports can be saved). */
function chatOpen() {
	try {
		return Boolean(ctx().getCurrentChatId?.());
	} catch {
		return false;
	}
}
/** Overrides and passports of the current chat (a copy; empty without a chat). */
function chatPassportData() {
	const root = ctx().chatMetadata?.[META_KEY$1];
	return root?.passports ? normalizeChatPassports(root.passports) : emptyChatPassports();
}
async function writeChatPassports(data) {
	const c = ctx();
	const root = c.chatMetadata[META_KEY$1] ??= {};
	if (!Object.keys(data.overrides).length && !data.extra.length) delete root.passports;
	else root.passports = data;
	await c.saveMetadata();
}
function requireChat() {
	if (!chatOpen()) throw new Error("NAI Studio: no chat is open");
}
/** The passports of a card as the current chat sees them. */
function resolvedCardPassports(character, data = chatPassportData()) {
	const owner = character?.avatar;
	return cardPassports(character).map((p) => resolveChatPassport(p, owner, data));
}
/** The persona passport as the current chat sees it. */
function resolvedPersonaPassport(key, data = chatPassportData()) {
	const passport = personaPassport(key);
	return passport ? resolveChatPassport(passport, personaOwner(key), data) : null;
}
/**
* Saves a passport for this chat only: over a card or persona passport (`base`) as the fields that
* differ (no difference removes the override), or as a passport of the chat itself (`base` null).
*/
async function saveChatPassport(base, edited, owner) {
	requireChat();
	const data = chatPassportData();
	if (base) {
		const diff = passportDiff(base, {
			...edited,
			id: base.id
		});
		if (isOverrideEmpty(diff)) delete data.overrides[base.id];
		else data.overrides[base.id] = owner ? {
			owner,
			...diff
		} : diff;
	} else {
		const at = data.extra.findIndex((p) => p.id === edited.id);
		if (at >= 0) data.extra[at] = edited;
		else data.extra.push(edited);
	}
	await writeChatPassports(data);
	emitStudioEvent("passportsSaved", {
		ids: [base?.id ?? edited.id],
		scope: "chat"
	});
}
/**
* Drops the chat's override of a passport (the card value comes back) and a passport of the chat
* itself with that id. False when there was nothing to drop.
*/
async function clearChatOverride(id) {
	requireChat();
	const data = chatPassportData();
	if (!(Object.prototype.hasOwnProperty.call(data.overrides, id) || data.extra.some((p) => p.id === id))) return false;
	delete data.overrides[id];
	data.extra = data.extra.filter((p) => p.id !== id);
	await writeChatPassports(data);
	emitStudioEvent("passportsSaved", {
		ids: [id],
		scope: "chat"
	});
	return true;
}
/** The chat has an override for this passport of this owner. */
function hasChatOverride(id, owner, data = chatPassportData()) {
	const override = Object.prototype.hasOwnProperty.call(data.overrides, id) ? data.overrides[id] : void 0;
	return Boolean(override && !(override.owner && owner && override.owner !== owner));
}
function ownerId(owner) {
	if (owner.type === "card") return owner.avatar;
	return owner.type === "persona" ? personaOwner(owner.key) : void 0;
}
/**
* Finds a passport by id: in the given card or persona, else in the cards of the chat, the current
* persona and the passports of the chat itself. Synchronous: lazily loaded cards that were never
* opened have no passports yet.
*/
function locatePassport(id, where = {}, data = chatPassportData()) {
	const c = ctx();
	const inCard = (index) => {
		const character = c.characters[index];
		const base = cardPassports(character).find((p) => p.id === id);
		if (!character || !base) return null;
		return {
			owner: {
				type: "card",
				index,
				avatar: character.avatar
			},
			base,
			resolved: resolveChatPassport(base, character.avatar, data),
			overridden: hasChatOverride(id, character.avatar, data)
		};
	};
	const inPersona = (key) => {
		const base = personaPassport(key);
		if (!base || base.id !== id) return null;
		return {
			owner: {
				type: "persona",
				key
			},
			base,
			resolved: resolveChatPassport(base, personaOwner(key), data),
			overridden: hasChatOverride(id, personaOwner(key), data)
		};
	};
	if (where.persona !== void 0) return inPersona(where.persona);
	if (where.index !== void 0) return inCard(where.index);
	for (const index of chatCardIndexes()) {
		const found = inCard(index);
		if (found) return found;
	}
	const persona = inPersona(knownPersonaKey());
	if (persona) return persona;
	const own = data.extra.find((p) => p.id === id);
	return own ? {
		owner: { type: "chat" },
		base: null,
		resolved: own,
		overridden: true
	} : null;
}
/** Saves an edited passport where it lives ("card": the card or persona settings) or for this chat. */
async function savePassportIn(located, edited, scope) {
	const passport = {
		...edited,
		id: located.base?.id ?? located.resolved.id
	};
	if (scope === "chat") {
		await saveChatPassport(located.base, passport, ownerId(located.owner));
		return;
	}
	const owner = located.owner;
	if (owner.type === "card") await saveCardPassport(owner.index, passport);
	else if (owner.type === "persona") savePersonaPassport(owner.key, passport);
	else throw new Error("NAI Studio: a passport of the chat has no card");
}
/** The chat's view of a passport after a save (an override of the card applied again). */
function resolvedAfterSave(located, saved, scope) {
	if (scope === "chat" || !located.base) return saved;
	const data = chatPassportData();
	return resolveChatPassport(saved, ownerId(located.owner), data);
}
//#endregion
//#region src/features/generation/styles.ts
/** The style's UC preset when it is a known one. */
function styleUcPreset(style) {
	const preset = style.ucPreset;
	return preset && UC_PRESETS.includes(preset) ? preset : void 0;
}
/** A saved style by name, ignoring case and spaces around it. */
function findStyle(s, name) {
	const wanted = name.trim().toLowerCase();
	return wanted ? s.prompts.styles.find((style) => style.name.trim().toLowerCase() === wanted) : void 0;
}
/** The active style, if it still exists. */
function activeStyle(s) {
	const name = s.prompts.activeStyle;
	if (!name) return void 0;
	return s.prompts.styles.find((style) => style.name === name) ?? findStyle(s, name);
}
/** How the style's negative works ("replace" for styles saved before v0.13). */
function styleNegativeMode(style) {
	return negativeMode(style.negativeMode);
}
/** The undesired content a style gives: its negative, or the base negative and then its negative. */
function styleNegative(s, style) {
	return effectiveNegative(s.prompts.baseNegative, style.negative, styleNegativeMode(style));
}
/** Negative mode of the current fields: the editor's with an active style, else "replace". */
function currentNegativeMode(s) {
	return activeStyle(s) ? negativeMode(s.prompts.negativeMode) : "replace";
}
/** The style's own part of the current undesired content (`typed`: what the editor shows). */
function currentOwnNegative(s, typed) {
	return ownNegative(s.generation.negativePrompt, s.prompts.baseNegative, currentNegativeMode(s), [typed, activeStyle(s)?.negative]);
}
/** Sets the style's own negative of the current fields; the undesired content follows its mode. */
function setOwnNegative(s, own) {
	s.generation.negativePrompt = effectiveNegative(s.prompts.baseNegative, own, currentNegativeMode(s));
}
/** Switches the negative mode of the current fields, keeping the style's own negative. */
function setNegativeMode(s, mode, own = currentOwnNegative(s)) {
	s.prompts.negativeMode = mode;
	setOwnNegative(s, own);
}
/** Changes the base negative; the undesired content of an active "append" style follows it. */
function setBaseNegative(s, base, own = currentOwnNegative(s)) {
	s.prompts.baseNegative = base;
	if (currentNegativeMode(s) === "append") setOwnNegative(s, own);
}
/** Puts a style into the fields it fills and makes it the active one. */
function applyStyle(s, style) {
	s.prompts.activeStyle = style.name;
	s.prompts.prefix = style.prefix;
	s.prompts.suffix = style.suffix;
	s.prompts.negativeMode = styleNegativeMode(style);
	s.generation.negativePrompt = styleNegative(s, style);
	const preset = styleUcPreset(style);
	if (preset) s.generation.ucPreset = preset;
}
/** The current fields as a style under this name (`typed`: the own negative the editor shows). */
function styleFromSettings(s, name, typed) {
	return {
		name,
		prefix: s.prompts.prefix,
		suffix: s.prompts.suffix,
		negative: currentOwnNegative(s, typed),
		ucPreset: s.generation.ucPreset,
		negativeMode: currentNegativeMode(s)
	};
}
/**
* The current fields differ from the saved style: prefix, suffix, negative mode, the undesired content
* it gives, or its UC preset (when it has one the current model offers).
*/
function styleChanged(s, style = activeStyle(s)) {
	if (!style) return false;
	if (s.prompts.prefix !== style.prefix || s.prompts.suffix !== style.suffix) return true;
	if (negativeMode(s.prompts.negativeMode) !== styleNegativeMode(style)) return true;
	if (!sameNegative(s.generation.negativePrompt, styleNegative(s, style))) return true;
	const preset = styleUcPreset(style);
	if (!preset || preset === s.generation.ucPreset) return false;
	const model = s.generation.model;
	return getCapabilities(isModelId(model) ? model : DEFAULT_MODEL).ucPresets.includes(preset);
}
//#endregion
//#region src/features/images/image-utils.ts
function base64ToBytes(base64) {
	const clean = base64.includes(",") ? base64.slice(base64.indexOf(",") + 1) : base64;
	const binary = atob(clean);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes;
}
function bytesToBase64(bytes) {
	let binary = "";
	const chunk = 32768;
	for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
	return btoa(binary);
}
function base64ToBlob(base64, mime) {
	return new Blob([base64ToBytes(base64)], { type: mime });
}
async function blobToBytes(blob) {
	return new Uint8Array(await blob.arrayBuffer());
}
async function blobToBase64$1(blob) {
	return bytesToBase64(await blobToBytes(blob));
}
/** MIME type from the first bytes (PNG / WebP / JPEG), defaulting to PNG. */
function sniffMime(bytes) {
	if (bytes[0] === 137 && bytes[1] === 80) return "image/png";
	if (bytes[0] === 82 && bytes[1] === 73 && bytes[8] === 87) return "image/webp";
	if (bytes[0] === 255 && bytes[1] === 216) return "image/jpeg";
	return "image/png";
}
async function imageSize(blob) {
	const bitmap = await createImageBitmap(blob);
	const size = {
		width: bitmap.width,
		height: bitmap.height
	};
	bitmap.close();
	return size;
}
function canvas(width, height) {
	const el = document.createElement("canvas");
	el.width = width;
	el.height = height;
	return el;
}
async function canvasBlob(el, type, quality) {
	return await new Promise((resolve, reject) => {
		el.toBlob((blob) => blob ? resolve(blob) : reject(/* @__PURE__ */ new Error("canvas export failed")), type, quality);
	});
}
/** Re-encodes any image to PNG (drops all metadata, pixels unchanged). */
async function toPngBlob(blob, size) {
	const bitmap = await createImageBitmap(blob);
	const el = canvas(size?.width ?? bitmap.width, size?.height ?? bitmap.height);
	const context = el.getContext("2d");
	if (!context) throw new Error("canvas unavailable");
	context.drawImage(bitmap, 0, 0, el.width, el.height);
	bitmap.close();
	return await canvasBlob(el, "image/png");
}
/** Small WebP preview for the gallery. */
async function thumbnail(blob, maxSide) {
	const bitmap = await createImageBitmap(blob);
	const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
	const el = canvas(Math.max(1, Math.round(bitmap.width * ratio)), Math.max(1, Math.round(bitmap.height * ratio)));
	const context = el.getContext("2d");
	if (!context) throw new Error("canvas unavailable");
	context.drawImage(bitmap, 0, 0, el.width, el.height);
	bitmap.close();
	return await canvasBlob(el, "image/webp", .8);
}
/** Inflates a zlib stream (compressed PNG text chunks). */
async function inflate(data) {
	const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
}
/** Triggers a browser download of a blob. */
function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1e4);
}
//#endregion
//#region src/features/scene/scene-providers.ts
/** A provider that does not answer in time is skipped for this scene. */
var PROVIDER_TIMEOUT_MS = 3e3;
/** Answers are reused for the same message and text this long (one picture asks several times). */
var CACHE_MS$1 = 1500;
var providers$1 = [];
var cache$1 = null;
/** Registers a provider; one with the same id is replaced. Returns the unregistration. */
function registerSceneHintProvider(provider) {
	providers$1 = [...providers$1.filter((p) => p.id !== provider.id), provider];
	cache$1 = null;
	return () => {
		if (!providers$1.includes(provider)) return;
		providers$1 = providers$1.filter((p) => p !== provider);
		cache$1 = null;
	};
}
function sceneHintProviders() {
	return byPriority(providers$1);
}
/** The message a scene query is about: the given one, else the last message that is not a system one. */
function hintContext(query) {
	const chat = ctx().chat ?? [];
	let messageIndex = query.messageId ?? -1;
	if (messageIndex < 0) {
		messageIndex = chat.length - 1;
		while (messageIndex >= 0 && chat[messageIndex]?.is_system) messageIndex--;
	}
	return {
		messageIndex,
		text: query.text ?? chat[messageIndex]?.mes ?? ""
	};
}
/**
* The answer of another extension's provider, or `fallback` when it throws or does not answer within
* PROVIDER_TIMEOUT_MS (scene providers, passport providers of v0.12).
*/
async function askInTime(label, call, fallback) {
	let timer;
	try {
		const timeout = new Promise((resolve) => {
			timer = setTimeout(() => {
				log.warn(`${label}: no answer in ${PROVIDER_TIMEOUT_MS} ms`);
				resolve(fallback);
			}, PROVIDER_TIMEOUT_MS);
		});
		return await Promise.race([Promise.resolve(call()), timeout]);
	} catch (error) {
		log.warn(`${label} failed`, error);
		return fallback;
	} finally {
		if (timer !== void 0) clearTimeout(timer);
	}
}
async function ask$2(provider, context) {
	return normalizeSceneHint(await askInTime(`scene provider ${provider.id}`, () => provider.describe({ ...context }), null));
}
/** The merged hint of every provider for a scene; empty without providers. */
async function sceneHint(query = {}) {
	const ordered = sceneHintProviders();
	if (!ordered.length) return {};
	const context = hintContext(query);
	const key = `${context.messageIndex}\u0000${context.text}`;
	const now = Date.now();
	if (cache$1 && cache$1.key === key && now - cache$1.at < CACHE_MS$1) return structuredClone(await cache$1.hint);
	const hint = Promise.all(ordered.map((provider) => ask$2(provider, context))).then(mergeSceneHints);
	cache$1 = {
		key,
		at: now,
		hint
	};
	return structuredClone(await hint);
}
//#endregion
//#region src/features/scene/passport-providers.ts
/** Answers are reused for the same message and text this long (one picture asks several times). */
var CACHE_MS = 1500;
var providers = [];
var cache = null;
/** Registers a provider; one with the same id is replaced. Returns the unregistration. */
function registerScenePassportProvider(provider) {
	providers = [...providers.filter((p) => p.id !== provider.id), provider];
	cache = null;
	return () => {
		if (!providers.includes(provider)) return;
		providers = providers.filter((p) => p !== provider);
		cache = null;
	};
}
function scenePassportProviders() {
	return byPriority(providers);
}
async function ask$1(provider, context) {
	return normalizeProvidedPassports(await askInTime(`passport provider ${provider.id}`, () => provider.passports({ ...context }), null), provider.id);
}
/**
* Passports every provider gives for a scene (the message of a marker, else the last message), best
* provider first, as copies; empty without providers.
*/
async function providedPassports(query = {}) {
	const ordered = scenePassportProviders();
	if (!ordered.length) return [];
	const context = hintContext(query);
	const key = `${context.messageIndex}\u0000${context.text}`;
	const now = Date.now();
	if (cache && cache.key === key && now - cache.at < CACHE_MS) return structuredClone(await cache.list);
	const list = Promise.all(ordered.map((provider) => ask$1(provider, context))).then((lists) => lists.flat());
	cache = {
		key,
		at: now,
		list
	};
	return structuredClone(await list);
}
//#endregion
//#region src/features/backgrounds/background-service.ts
/** ST's endpoint for its backgrounds library (src/endpoints/backgrounds.js, 1.19). */
var BACKGROUND_UPLOAD_URL = "/api/backgrounds/upload";
/**
* Uploads a PNG into SillyTavern's backgrounds library like ST's own "add background" (multipart field
* "avatar", its file name kept); the file name the server stored.
*/
async function uploadBackground(png, fileName) {
	const form = new FormData();
	form.append("avatar", new File([png], fileName, { type: "image/png" }));
	const response = await fetch(BACKGROUND_UPLOAD_URL, {
		method: "POST",
		headers: requestHeaders(true),
		body: form,
		cache: "no-cache"
	});
	if (!response.ok) throw new NaiError("unknown", "none", { server: `background upload failed: HTTP ${response.status}` });
	return (await response.text()).trim() || fileName;
}
/** The place passport with that id (the chat's view, else a passport provider's); a person does not count. */
async function placePassport(id) {
	for (const index of chatCardIndexes()) await loadCharacter(index);
	const found = locatePassport(id)?.resolved ?? (await providedPassports()).find((p) => p.id === id) ?? null;
	if (!found || found.kind === "character") {
		log.warn(`background: no place passport "${id}"`);
		return null;
	}
	return found;
}
var join = (...parts) => parts.filter((part) => part.trim()).join(", ");
var BackgroundService = class {
	pipeline;
	now;
	constructor(pipeline, now = () => Date.now()) {
		this.pipeline = pipeline;
		this.now = now;
	}
	/** Draws and uploads one background; the file name in ST's library. Failures throw a NaiError. */
	async generate(request, signal) {
		const s = settings();
		const passport = request.passportId ? await placePassport(request.passportId) : null;
		let scene = backgroundPrompt({
			locationName: request.locationName,
			placeTags: passport?.tags ?? "",
			tags: request.tags ?? "",
			timeOfDay: request.timeOfDay ?? "",
			weather: request.weather ?? ""
		});
		const negative = joinTags(BACKGROUND_NEGATIVE, passport?.negative ?? "");
		const generation = {
			...markerDimensions(BACKGROUND_RATIO, void 0, true),
			samples: 1,
			characters: [],
			transparentBackground: false
		};
		const styleName = request.style?.trim();
		const style = styleName ? findStyle(s, styleName) : void 0;
		if (style) {
			const preset = styleUcPreset(style);
			if (preset) generation.ucPreset = preset;
		} else if (styleName) scene = join(styleName, scene);
		const produced = await this.pipeline.produce({
			initiator: "panel",
			trigger: scene,
			scene,
			mode: MODE.BACKGROUND,
			interpret: "cyrillic",
			noContinuity: true,
			overrides: {
				edit: false,
				negative,
				generation,
				...style ? { style } : {}
			},
			queue: {
				priority: "background",
				kind: "background"
			},
			...s.anlas.freeOnly ? { maxCost: 0 } : {},
			...signal ? { signal } : {}
		});
		const image = produced?.images[0];
		if (!produced || !image) throw new NaiError("aborted", "none");
		const blob = base64ToBlob(image.base64, image.mime);
		const file = await uploadBackground(s.png.stripMetadata || image.mime !== "image/png" ? await toPngBlob(blob) : blob, backgroundFileName(request.locationName, this.now()));
		log.info("background", file, `cost ${produced.prepared.cost.total}`);
		return { file };
	}
};
//#endregion
//#region src/features/gallery/gallery-store.ts
function characterName() {
	const c = ctx();
	if (c.groupId) return c.groups.find((g) => g.id === c.groupId)?.name ?? String(c.groupId);
	return c.name2 ?? "";
}
/** Pipeline observer: one record per generated image. Failures never break a generation. */
function recordGeneration(produced, outcome) {
	if (!settings().gallery.enabled) return;
	(async () => {
		for (const [i, image] of produced.images.entries()) {
			const id = ctx().uuidv4();
			const thumbKey = `thumb:${id}`;
			try {
				await imageStore().setItem(thumbKey, await thumbnail(base64ToBlob(image.base64, image.mime), settings().gallery.thumbSize));
			} catch (error) {
				log.warn("thumbnail failed", error);
			}
			const record = {
				id,
				createdAt: produced.meta.createdAt,
				chatId: produced.chatId ?? "",
				characterName: characterName(),
				target: outcome.target === "inline" ? "inline" : outcome.target,
				filePath: outcome.paths[i] ?? "",
				blobKey: outcome.blobKeys?.[i] ?? "",
				thumbKey,
				mime: image.mime,
				meta: {
					...produced.meta,
					seed: image.seed ?? produced.meta.seed + i
				},
				favorite: false,
				tags: []
			};
			if (outcome.inlineId) record.inlineId = outcome.inlineId;
			await galleryStore().setItem(id, record);
		}
	})().catch((error) => log.warn("gallery record failed", error));
}
async function listRecords() {
	const store = galleryStore();
	const keys = await store.keys();
	return (await Promise.all(keys.map((key) => store.getItem(key)))).filter((r) => r !== null && typeof r === "object");
}
async function saveRecord(record) {
	await galleryStore().setItem(record.id, record);
}
async function thumbBlob(record) {
	try {
		return await imageStore().getItem(record.thumbKey);
	} catch {
		return null;
	}
}
/** Full image: browser copy, then the server file, then the thumbnail as a last resort. */
async function fullBlob(record) {
	if (record.blobKey) {
		const blob = await imageStore().getItem(record.blobKey).catch(() => null);
		if (blob) return blob;
	}
	if (record.filePath) {
		const response = await fetch(record.filePath).catch(() => null);
		if (response?.ok) return await response.blob();
	}
	return await thumbBlob(record);
}
/**
* Deletes records and their thumbnails. With `deleteFiles`, server files are deleted too
* (POST /api/images/delete); inline images in chats then fall back to their browser copy.
*/
async function deleteRecords(records, deleteFiles) {
	let filesDeleted = 0;
	for (const record of records) {
		await galleryStore().removeItem(record.id);
		await imageStore().removeItem(record.thumbKey);
		if (deleteFiles && record.filePath) {
			if ((await fetch("/api/images/delete", {
				method: "POST",
				headers: requestHeaders(),
				body: JSON.stringify({ path: record.filePath })
			}).catch(() => null))?.ok) filesDeleted++;
		}
	}
	return filesDeleted;
}
async function storageUsage() {
	try {
		const estimate = await navigator.storage.estimate();
		return {
			usage: estimate.usage ?? 0,
			quota: estimate.quota ?? 0
		};
	} catch {
		return null;
	}
}
//#endregion
//#region src/transport/types.ts
/** Transport failure. `serverMessage` is NovelAI's own text; tokens never pass through the client. */
var TransportError = class extends Error {
	kind;
	status;
	serverMessage;
	bodyPreview;
	/** Seconds the server asked to wait before a retry (Retry-After), when it said so. */
	retryAfter;
	constructor(kind, options = {}) {
		super(options.message ?? `${kind}${options.status ? ` ${options.status}` : ""}`);
		this.name = "TransportError";
		this.kind = kind;
		this.status = options.status;
		this.serverMessage = options.serverMessage;
		this.bodyPreview = options.bodyPreview;
		this.retryAfter = options.retryAfter;
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
//#endregion
//#region src/transport/sse.ts
var SseParser = class {
	buffer = "";
	/** Adds a chunk and returns the events completed by it (blank line terminates an event). */
	feed(chunk) {
		this.buffer += chunk.replace(/\r\n?/g, "\n");
		const events = [];
		let boundary = this.buffer.indexOf("\n\n");
		while (boundary >= 0) {
			const block = this.buffer.slice(0, boundary);
			this.buffer = this.buffer.slice(boundary + 2);
			const event = parseBlock(block);
			if (event) events.push(event);
			boundary = this.buffer.indexOf("\n\n");
		}
		return events;
	}
	/** Remaining partial event at the end of the stream (servers may omit the last blank line). */
	flush() {
		const rest = this.buffer.trim();
		this.buffer = "";
		const event = rest ? parseBlock(rest) : null;
		return event ? [event] : [];
	}
};
function parseBlock(block) {
	let event = "message";
	const data = [];
	for (const line of block.split("\n")) {
		if (!line || line.startsWith(":")) continue;
		const colon = line.indexOf(":");
		const field = colon < 0 ? line : line.slice(0, colon);
		const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /, "");
		if (field === "event") event = value;
		else if (field === "data") data.push(value);
	}
	return data.length ? {
		event,
		data: data.join("\n")
	} : null;
}
/** NovelAI stream event -> frame. Unknown events are ignored (null). */
function toFrame(event) {
	let payload;
	try {
		payload = JSON.parse(event.data);
	} catch {
		return null;
	}
	const type = String(payload.event_type ?? event.event);
	const sampleIndex = typeof payload.samp_ix === "number" ? payload.samp_ix : 0;
	if (type === "intermediate") return {
		kind: "intermediate",
		sampleIndex,
		step: typeof payload.step_ix === "number" ? payload.step_ix : void 0,
		image: typeof payload.image === "string" ? payload.image : void 0
	};
	if (type === "final") return {
		kind: "final",
		sampleIndex,
		image: typeof payload.image === "string" ? payload.image : void 0
	};
	if (type === "error") return {
		kind: "error",
		sampleIndex,
		message: String(payload.message ?? payload.kind ?? "stream error")
	};
	return null;
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
	stream: true,
	upscale: true,
	director: true,
	diagnostics: true
};
function versionAtLeast(version, minimum) {
	const a = version.split(".").map((n) => Number.parseInt(n, 10) || 0);
	const b = minimum.split(".").map((n) => Number.parseInt(n, 10) || 0);
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		const x = a[i] ?? 0;
		const y = b[i] ?? 0;
		if (x !== y) return x > y;
	}
	return true;
}
/** Features of an installed plugin: an older plugin keeps generation but loses the new routes. */
function pluginFeatures(version) {
	if (version === null || versionAtLeast(version, "0.2.0")) return PLUGIN_FEATURES;
	return {
		...PLUGIN_FEATURES,
		stream: false,
		upscale: false,
		director: false,
		vibes: false
	};
}
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
		bodyPreview: body.error?.preview,
		...typeof body.error?.retryAfter === "number" ? { retryAfter: body.error.retryAfter } : {}
	});
}
function createPluginTransport(env, version = null) {
	const features = pluginFeatures(version);
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
	const mime = (base64) => base64.startsWith("UklGR") ? "image/webp" : "image/png";
	/** SSE from /generate-stream: previews go to onProgress, final images are the result. */
	async function generateStream(body, options) {
		const response = await post("/generate-stream", {
			request: body,
			retryable: options.retryable
		}, options.signal);
		if (!response.ok || !response.body) throw await toTransportError(response);
		const parser = new SseParser();
		const decoder = new TextDecoder();
		const finals = /* @__PURE__ */ new Map();
		const reader = response.body.getReader();
		const seed = Number(body.parameters.seed) || 0;
		const handle = (events) => {
			for (const event of events) {
				const frame = toFrame(event);
				if (!frame) continue;
				if (frame.kind === "error") throw new TransportError("http", { serverMessage: frame.message });
				if (frame.kind === "final" && frame.image) finals.set(frame.sampleIndex, frame.image);
				options.onProgress?.(frame);
			}
		};
		try {
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				handle(parser.feed(decoder.decode(value, { stream: true })));
			}
			handle(parser.flush());
		} catch (error) {
			if (isAbort(error)) throw new TransportError("aborted");
			throw error;
		}
		if (!finals.size) throw new TransportError("invalid-response", { bodyPreview: "stream ended without a final image" });
		return { images: [...finals.entries()].sort((a, b) => a[0] - b[0]).map(([index, image]) => ({
			base64: image,
			mime: mime(image),
			seed: seed + index,
			index
		})) };
	}
	return {
		id: "plugin",
		features,
		extras: {
			async encodeVibe(request, signal) {
				const response = await post("/encode-vibe", request, signal);
				if (!response.ok) throw await toTransportError(response);
				const data = await response.json();
				if (typeof data.encoding !== "string") throw new TransportError("invalid-response");
				return {
					encoding: data.encoding,
					cached: data.cached === true
				};
			},
			async lookupVibes(items, signal) {
				const response = await post("/encode-vibe/lookup", { items }, signal);
				if (!response.ok) throw await toTransportError(response);
				return ((await response.json()).results ?? []).map((r) => r.encoding ?? null);
			},
			async augment(body, options) {
				const response = await post("/augment", {
					body,
					retryable: options.retryable
				}, options.signal);
				if (!response.ok) throw await toTransportError(response);
				const data = await response.json();
				if (typeof data.zip !== "string") throw new TransportError("invalid-response");
				return data.zip;
			},
			async upscale(request, signal) {
				const response = await post("/upscale", request, signal);
				if (!response.ok) throw await toTransportError(response);
				return ((await response.json()).images ?? []).map((img, i) => ({
					base64: img.image,
					mime: mime(img.image),
					index: img.index ?? i
				}));
			}
		},
		async generate(body, options) {
			if (options.endpoint === "generate-stream") return await generateStream(body, options);
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
//#region src/transport/public-files.ts
var TOKENIZER_STATIC_URL = "https://novelai.net/tokenizer/compressed";
/** Raw-deflate tokenizer JSON as NovelAI serves it, or null when no route can deliver it. */
async function fetchTokenizerDefinition(env, file, signal) {
	const urls = [`${PLUGIN_BASE}/tokenizer/${encodeURIComponent(file)}`, `/proxy/${encodeURIComponent(`${TOKENIZER_STATIC_URL}/${file}?v=2&static=true`)}`];
	for (const url of urls) try {
		const response = await env.fetch(url, {
			method: "GET",
			headers: env.headers(),
			signal
		});
		const type = response.headers.get("Content-Type") ?? "";
		if (response.ok && !type.includes("text/html") && !type.includes("application/json")) return await response.arrayBuffer();
	} catch (error) {
		if (signal?.aborted) throw error;
	}
	return null;
}
/** NovelAI's own suggestions for the fragment being typed; empty when the plugin cannot ask. */
async function fetchTagSuggestions(env, model, prompt, signal) {
	try {
		const query = new URLSearchParams({
			model,
			prompt,
			lang: "en"
		});
		const response = await env.fetch(`${PLUGIN_BASE}/suggest-tags?${query}`, {
			method: "GET",
			headers: env.headers(),
			signal
		});
		if (!response.ok) return [];
		const body = await response.json();
		return Array.isArray(body.tags) ? body.tags : [];
	} catch {
		return [];
	}
}
//#endregion
//#region src/transport/text.ts
async function novelAiText(env, request, signal) {
	const response = await env.fetch(`${PLUGIN_BASE}/text`, {
		method: "POST",
		headers: env.headers(),
		body: JSON.stringify({
			model: request.model,
			messages: request.messages,
			max_tokens: request.maxTokens
		}),
		signal
	});
	if (response.status === 404) throw new TransportError("plugin-unavailable", { status: 404 });
	const body = await response.json().catch(() => ({}));
	if (!response.ok || typeof body.content !== "string") throw new TransportError("http", {
		status: body.error?.status ?? response.status,
		serverMessage: body.error?.message
	});
	return body.content;
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
		transport: createPluginTransport(env, health.version),
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
//#region src/features/generation/queue.ts
var RETRY_DELAYS_MS = [
	2e3,
	5e3,
	12e3
];
var MAX_WAIT_MS = 6e4;
var RANK = {
	user: 0,
	reply: 1,
	portrait: 2,
	background: 3
};
/** Answers that are about the account, not about another generation: never sent again. */
var FINAL_CODES = /* @__PURE__ */ new Set([
	"unauthorized",
	"token-missing",
	"insufficient-anlas",
	"forbidden",
	"aborted"
]);
var BUSY_TEXT = /concurrent generation|generation is locked|too many requests/i;
/** NovelAI turned the request away because another generation of the account is running (429). */
function isBusyAnswer(error) {
	if (typeof error !== "object" || error === null) return false;
	const e = error;
	if (e.code && FINAL_CODES.has(e.code)) return false;
	if (e.kind === "aborted" || e.name === "AbortError") return false;
	if (e.code === "rate-limited" || e.status === 429 || e.params?.status === 429) return true;
	const text = [
		e.serverMessage,
		e.bodyPreview,
		e.params?.server,
		e.params?.preview
	].filter(Boolean).join(" ");
	return BUSY_TEXT.test(text);
}
/** Seconds the server asked to wait (Retry-After), if it said so. */
function retryAfterSeconds(error) {
	const e = typeof error === "object" && error !== null ? error : {};
	const value = Number(e.retryAfter ?? e.params?.retryAfter);
	return Number.isFinite(value) && value > 0 ? value : void 0;
}
function abortableSleep(ms, signal) {
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new NaiError("aborted", "none"));
			return;
		}
		const timer = setTimeout(() => {
			signal.removeEventListener("abort", onAbort);
			resolve();
		}, ms);
		const onAbort = () => {
			clearTimeout(timer);
			reject(new NaiError("aborted", "none"));
		};
		signal.addEventListener("abort", onAbort, { once: true });
	});
}
var GenerationQueue = class {
	running = null;
	waiting = [];
	seq = 0;
	listeners = /* @__PURE__ */ new Set();
	delays;
	random;
	now;
	sleep;
	constructor(options = {}) {
		this.delays = options.delays ?? RETRY_DELAYS_MS;
		this.random = options.random ?? Math.random;
		this.now = options.now ?? Date.now;
		this.sleep = options.sleep ?? abortableSleep;
	}
	/** Runs `task` when it is its turn, alone; a busy answer is retried with the same turn. */
	run(job, task) {
		return new Promise((resolve, reject) => {
			if (job.signal?.aborted) {
				reject(new NaiError("aborted", "none"));
				return;
			}
			const entry = {
				id: ++this.seq,
				job,
				priority: job.priority ?? "user",
				kind: job.kind ?? "picture",
				task,
				resolve,
				reject,
				abort: new AbortController(),
				retryAt: null,
				detach: () => {}
			};
			const signal = job.signal;
			if (signal) {
				const onAbort = () => {
					if (this.waiting.includes(entry)) this.drop(entry, "aborted");
					else entry.abort.abort();
				};
				signal.addEventListener("abort", onAbort, { once: true });
				entry.detach = () => signal.removeEventListener("abort", onAbort);
			}
			const at = this.waiting.findIndex((other) => RANK[other.priority] > RANK[entry.priority]);
			if (at === -1) this.waiting.push(entry);
			else this.waiting.splice(at, 0, entry);
			log.info(`queue: ${entry.kind} (${entry.priority}) added, ${this.waiting.length + (this.running ? 1 : 0)} in the queue`);
			this.pump();
			this.changed();
		});
	}
	/** A request is in flight (or waits for its retry). */
	get busy() {
		return this.running !== null;
	}
	get size() {
		return this.waiting.length;
	}
	snapshot() {
		return {
			running: this.running ? this.view(this.running) : null,
			waiting: this.waiting.map((e) => this.view(e))
		};
	}
	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}
	/** Drops every waiting request ("Clear the queue"); the running one finishes. */
	clear() {
		return this.dropWhere(() => true, "cleared");
	}
	/** Another chat is open: waiting requests of other chats are dropped. */
	dropOtherChats(chatId) {
		return this.dropWhere((e) => e.job.chatId !== void 0 && e.job.chatId !== chatId, "chat changed");
	}
	/** Messages were deleted or swiped: waiting requests that lost their message are dropped. */
	revalidate() {
		return this.dropWhere((e) => this.isStale(e), "message gone");
	}
	/** Aborts the request in flight (the panel's Cancel). */
	cancelRunning() {
		this.running?.abort.abort();
	}
	view(entry) {
		return {
			id: entry.id,
			priority: entry.priority,
			kind: entry.kind,
			...entry.job.chatId !== void 0 ? { chatId: entry.job.chatId } : {},
			retryIn: entry.retryAt === null ? null : Math.max(0, Math.ceil((entry.retryAt - this.now()) / 1e3))
		};
	}
	isStale(entry) {
		try {
			return entry.job.stale?.() === true;
		} catch {
			return false;
		}
	}
	dropWhere(test, reason) {
		const dropped = this.waiting.filter(test);
		for (const entry of dropped) this.drop(entry, reason, false);
		if (dropped.length) this.changed();
		return dropped.length;
	}
	drop(entry, reason, notify = true) {
		const index = this.waiting.indexOf(entry);
		if (index === -1) return;
		this.waiting.splice(index, 1);
		entry.detach();
		log.info(`queue: ${entry.kind} (${entry.priority}) dropped: ${reason}`);
		entry.job.onStatus?.({ state: "done" });
		entry.reject(new NaiError("aborted", "none"));
		if (notify) this.changed();
	}
	changed() {
		const offset = this.running ? 1 : 0;
		this.waiting.forEach((entry, i) => entry.job.onStatus?.({
			state: "queued",
			ahead: i + offset
		}));
		for (const listener of this.listeners) try {
			listener();
		} catch (error) {
			log.warn("queue listener failed", error);
		}
	}
	pump() {
		if (this.running) return;
		let next = this.waiting.shift();
		while (next && this.isStale(next)) {
			next.detach();
			log.info(`queue: ${next.kind} (${next.priority}) dropped: message gone`);
			next.job.onStatus?.({ state: "done" });
			next.reject(new NaiError("aborted", "none"));
			next = this.waiting.shift();
		}
		if (!next) return;
		this.running = next;
		this.execute(next);
	}
	async execute(entry) {
		entry.job.onStatus?.({ state: "running" });
		try {
			entry.resolve(await this.attempt(entry));
		} catch (error) {
			entry.reject(error);
		} finally {
			entry.detach();
			entry.job.onStatus?.({ state: "done" });
			this.running = null;
			this.pump();
			this.changed();
		}
	}
	async attempt(entry) {
		for (let attempt = 0;; attempt++) try {
			return await entry.task(entry.abort.signal);
		} catch (error) {
			const delay = this.delays[attempt];
			if (entry.abort.signal.aborted || delay === void 0 || !isBusyAnswer(error)) throw error;
			const jitter = .8 + .4 * this.random();
			const asked = retryAfterSeconds(error);
			const ms = Math.min(MAX_WAIT_MS, Math.max(Math.round(delay * jitter), asked ? asked * 1e3 : 0));
			const seconds = Math.ceil(ms / 1e3);
			log.warn(`queue: NovelAI is busy with another generation, ${entry.kind} sent again in ${seconds} s (${attempt + 1}/${this.delays.length})`);
			entry.retryAt = this.now() + ms;
			entry.job.onStatus?.({
				state: "retry",
				seconds,
				attempt: attempt + 1
			});
			this.changed();
			try {
				await this.sleep(ms, entry.abort.signal);
			} finally {
				entry.retryAt = null;
			}
			entry.job.onStatus?.({ state: "running" });
			this.changed();
		}
	}
};
/** The queue of the extension: every NovelAI image request goes through it. */
var generationQueue = new GenerationQueue();
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
		autoText: g.autoText !== false,
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
function prepareGeneration({ settings, transport, account, overrides, requestPatch, random }) {
	const generation = {
		...settings.generation,
		...overrides
	};
	let request = {
		...requestFromSettings(generation, resolveSeed(generation.seed, random)),
		...requestPatch
	};
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
async function sendPrepared(prepared, transport, account, signal, onProgress) {
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
			retryable: prepared.cost.total === 0,
			onProgress
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
	queue;
	state = {
		selection: null,
		account: UNKNOWN_ACCOUNT,
		accountError: null,
		busy: false
	};
	listeners = /* @__PURE__ */ new Set();
	constructor(env, queue = generationQueue) {
		this.env = env;
		this.queue = queue;
		queue.subscribe(() => {
			if (this.state.busy === queue.busy) return;
			this.state.busy = queue.busy;
			this.emit();
		});
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
		const health = this.state.selection.health;
		log.info("transport:", this.state.selection.transport.id, health ? `plugin ${health.version}` : "no plugin");
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
	prepare(overrides, requestPatch) {
		const transport = this.state.selection?.transport;
		if (!transport) throw new NaiError("plugin-unavailable", "install-plugin");
		try {
			return prepareGeneration({
				settings: settings(),
				transport,
				account: this.state.account,
				overrides,
				requestPatch
			});
		} catch (error) {
			throw toNaiError(error);
		}
	}
	/**
	* Sends a prepared request through the one NovelAI queue (v0.13.1): it waits for its turn, goes
	* alone and is sent again when NovelAI answers that another generation is running. The cost was
	* confirmed before; a retry asks nothing. Blocked requests never leave.
	*/
	async send(prepared, signal, onProgress, job = {}) {
		if (!this.state.selection?.transport) throw new NaiError("plugin-unavailable", "install-plugin");
		let sent = false;
		try {
			return await this.queue.run({
				...job,
				...signal ? { signal } : {}
			}, async (jobSignal) => {
				const transport = this.state.selection?.transport;
				if (!transport) throw new NaiError("plugin-unavailable", "install-plugin");
				sent = true;
				return await sendPrepared(prepared, transport, this.state.account, jobSignal, onProgress);
			});
		} finally {
			if (sent) this.refreshAccount();
		}
	}
	/** Aborts the NovelAI request in flight. */
	cancel() {
		this.queue.cancelRunning();
	}
};
//#endregion
//#region src/features/generation/multimodal.ts
async function describeImage(base64, prompt) {
	const shared = await importHost("/scripts/extensions/shared.js");
	const { multimodalApi: api, multimodalModel: model } = settings().modes;
	if (!api) return await shared.getMultimodalCaption(base64, prompt);
	const caption = ctx().extensionSettings.caption ??= {};
	const saved = {
		api: caption.multimodal_api,
		model: caption.multimodal_model
	};
	caption.multimodal_api = api;
	caption.multimodal_model = visionModel(api, model);
	try {
		return await shared.getMultimodalCaption(base64, prompt);
	} finally {
		caption.multimodal_api = saved.api;
		caption.multimodal_model = saved.model;
	}
}
/** The APIs with whether their key is saved in SillyTavern (the values are never read). */
async function visionChoices() {
	let state = {};
	try {
		state = (await importHost("/scripts/secrets.js")).secret_state ?? {};
	} catch {
		state = {};
	}
	return {
		current: ctx().extensionSettings.caption?.multimodal_api || "openai",
		apis: VISION_APIS.map((api) => ({
			id: api.id,
			label: api.label,
			hasKey: hasSecret(state, api.secret)
		}))
	};
}
//#endregion
//#region src/features/images/png-io.ts
/** NovelAI text map of a PNG or WebP (compressed PNG chunks inflated). Empty for other files. */
async function readMetadataText(bytes) {
	if (isPng(bytes)) {
		const { text, compressed } = readPngText(bytes);
		for (const entry of compressed) try {
			text[entry.keyword] = new TextDecoder().decode(await inflate(entry.data));
		} catch {}
		return text;
	}
	if (isWebp(bytes)) return readWebpText(bytes);
	return {};
}
async function readImportedParams(file) {
	const bytes = await blobToBytes(file);
	const model = settings().generation.model;
	return parseNovelAIMetadata(await readMetadataText(bytes), isModelId(model) ? model : void 0);
}
/** Field names that were applied, for the toast. */
function applyImportedParams(params) {
	const g = settings().generation;
	const applied = [];
	const set = (key, value) => {
		if (value === void 0) return;
		g[key] = value;
		applied.push(String(key));
	};
	set("model", params.model);
	set("prompt", params.prompt);
	set("negativePrompt", params.negative);
	set("qualityPreset", params.qualityPreset);
	if (params.ucPreset && params.model && getCapabilities(params.model).ucPresets.includes(params.ucPreset)) set("ucPreset", params.ucPreset);
	set("seed", params.seed);
	set("steps", params.steps);
	set("scale", params.scale);
	set("cfgRescale", params.cfgRescale);
	set("width", params.width);
	set("height", params.height);
	set("sampler", params.sampler);
	set("noiseSchedule", params.noiseSchedule);
	set("smea", params.smea);
	set("smeaDyn", params.smeaDyn);
	if (params.smea !== void 0) g.autoSmea = false;
	set("varietyBoost", params.varietyBoost);
	set("useCoords", params.useCoords);
	g.characters = params.characters.map((c) => ({
		prompt: c.prompt,
		negative: c.negative,
		x: c.x,
		y: c.y,
		enabled: true
	}));
	applied.push("characters");
	saveSettings();
	notifyExternalChange();
	return applied;
}
/**
* Bytes to write to disk or to the server. PNG/WebP straight from NovelAI already carry their
* metadata; other cases get it written in the NovelAI layout. With `strip`, everything is removed.
*/
async function exportImage(blob, meta, options) {
	const bytes = await blobToBytes(blob);
	const mime = sniffMime(bytes);
	if (options.strip) {
		if (mime === "image/png") return new Blob([stripPngMetadata(bytes)], { type: "image/png" });
		return await toPngBlob(blob);
	}
	if (options.format === "original" && mime !== "image/png") return blob;
	const ownText = await readMetadataText(bytes);
	const text = ownText.Comment ? ownText : meta ? buildNovelAIText({
		...meta,
		requestType: requestTypeName(meta)
	}) : {};
	const png = mime === "image/png" ? bytes : await blobToBytes(await toPngBlob(blob));
	const written = Object.keys(text).length ? writePngText(png, text) : png;
	return new Blob([written], { type: "image/png" });
}
function requestTypeName(meta) {
	switch (meta.requestType) {
		case "img2img": return "Img2ImgRequest";
		case "inpaint": return "NativeInfillingRequest";
		default: return "PromptGenerateRequest";
	}
}
//#endregion
//#region src/features/generation/output.ts
function safeName(text) {
	return text.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "nai";
}
/** Uploads one image to /user/images; with "strip metadata" on it goes up as a clean PNG. */
async function uploadImage(base64, mime, folder, filename) {
	let data = base64;
	let format = mime === "image/webp" ? "webp" : mime === "image/jpeg" ? "jpg" : "png";
	if (settings().png.stripMetadata) {
		data = await blobToBase64$1(await exportImage(base64ToBlob(base64, mime), void 0, {
			strip: true,
			format: "png"
		}));
		format = "png";
	}
	const response = await fetch("/api/images/upload", {
		method: "POST",
		headers: requestHeaders(),
		body: JSON.stringify({
			image: data,
			format,
			ch_name: folder,
			filename
		})
	});
	if (!response.ok) throw new Error(`image upload failed: HTTP ${response.status}`);
	const { path } = await response.json();
	return path;
}
function imageFileName(folder, suffix) {
	return `${folder ? `${safeName(folder)}_` : ""}${ctx().humanizedDateTime()}_${suffix}`;
}
async function saveImages(images, folder) {
	const saved = [];
	for (const image of images) {
		const path = await uploadImage(image.base64, image.mime, folder, imageFileName(folder, image.seed ?? image.index));
		saved.push({
			path,
			seed: image.seed
		});
	}
	return saved;
}
/** systemUserName of script.js: the built-in posts images in group chats under this name. */
var SYSTEM_USER_NAME = "SillyTavern System";
/** Author of a result message and {{char}} of its text: the character, or the system user in groups. */
function resultAuthorName() {
	const c = ctx();
	return c.groupId ? SYSTEM_USER_NAME : c.name2;
}
/** Folder in /user/images: character name in 1:1 chats, group id in groups (as the built-in does). */
function imageFolder() {
	const c = ctx();
	return c.groupId ? String(c.groupId) : c.name2 || "";
}
function toAttachments(saved, meta) {
	return saved.map((s) => ({
		url: s.path,
		type: "image",
		title: meta.scenePrompt,
		source: "generated",
		generation_type: meta.mode,
		negative: meta.negative,
		...meta.width && meta.height ? {
			width: meta.width,
			height: meta.height
		} : {},
		nai_studio: {
			seed: s.seed ?? meta.seed,
			model: meta.model,
			prompt: meta.prompt,
			transport: meta.transport,
			cost: meta.cost,
			correlationId: meta.correlationId,
			...meta.tool ? { tool: meta.tool } : {},
			...meta.sourcePrompt ? { sourcePrompt: meta.sourcePrompt } : {}
		}
	}));
}
async function postToChat(saved, meta, options) {
	const c = ctx();
	const asUser = options.visible && options.author === "user";
	const message = {
		name: asUser ? c.name1 : resultAuthorName(),
		is_user: asUser,
		is_system: !options.visible,
		send_date: (/* @__PURE__ */ new Date()).toISOString(),
		mes: options.text,
		extra: {
			media: toAttachments(saved, meta),
			media_display: "gallery",
			media_index: 0,
			inline_image: !options.hidePrompt,
			nai_studio: {
				model: meta.model,
				seed: meta.seed,
				mode: meta.mode,
				transport: meta.transport,
				cost: meta.cost
			}
		}
	};
	c.chat.push(message);
	const id = c.chat.length - 1;
	const sentEvent = asUser ? c.eventTypes.MESSAGE_SENT : c.eventTypes.MESSAGE_RECEIVED;
	await c.eventSource.emit(sentEvent ?? "message_received", id, "extension");
	c.addOneMessage(message);
	const renderedEvent = asUser ? c.eventTypes.USER_MESSAGE_RENDERED : c.eventTypes.CHARACTER_MESSAGE_RENDERED;
	await c.eventSource.emit(renderedEvent ?? "character_message_rendered", id, "extension");
	await c.saveChat();
	return id;
}
/** Adds images as new swipes of a message's media gallery (paintbrush / image overswipe). */
async function appendToMessage(messageId, saved, meta) {
	const c = ctx();
	const message = c.chat[messageId];
	if (!message) return;
	message.extra ??= {};
	const extra = message.extra;
	const media = Array.isArray(extra.media) ? extra.media : [];
	const hadMedia = media.length > 0;
	if (!hadMedia && !extra.media_display) extra.media_display = "gallery";
	extra.inline_image = !(hadMedia && !extra.inline_image);
	media.push(...toAttachments(saved, meta));
	extra.media = media;
	extra.media_index = media.length - 1;
	const element = jQuery(`#chat .mes[mesid="${messageId}"]`);
	if (element.length) c.appendMediaToMessage(message, element, "keep");
	await c.saveChat();
}
/** Text of the result message from the MESSAGE template ({{prompt}} plus ST macros). */
function messageText(template, scenePrompt) {
	const token = "\0NAIST_PROMPT\0";
	const withToken = template.split("{{prompt}}").join(token);
	return ctx().substituteParamsExtended(withToken, { char: resultAuthorName() }).split(token).join(scenePrompt);
}
//#endregion
//#region src/features/generation/pipeline.ts
/** The undesired content of a request before its own additions: an explicit one, the style's or the current. */
function commonNegative(o) {
	const s = settings();
	return o.generation?.negativePrompt ?? (o.style ? styleNegative(s, o.style) : s.generation.negativePrompt);
}
function templates() {
	return {
		...DEFAULT_TEMPLATES,
		...settings().prompts.templates
	};
}
function lastUsableMessage() {
	const chat = ctx().chat;
	for (let i = chat.length - 1; i >= 0; i--) {
		const message = chat[i];
		if (message && !message.is_system) return message;
	}
	throw new NaiError("no-usable-message", "none");
}
async function blobToBase64(blob) {
	return await new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result));
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(blob);
	});
}
async function avatarUrl(mode) {
	const c = ctx();
	if (mode === MODE.USER_MULTIMODAL) {
		const personas = await importHost("/scripts/personas.js");
		return `/User Avatars/${encodeURIComponent(personas.user_avatar)}`;
	}
	if (c.groupId) {
		const members = c.groups.find((g) => g.id === c.groupId)?.members ?? [];
		const last = [...c.chat].reverse().find((m) => !m.is_system && !m.is_user)?.original_avatar;
		const avatar = typeof last === "string" ? last : members[Math.floor(Math.random() * members.length)];
		return `/characters/${encodeURIComponent(String(avatar ?? ""))}`;
	}
	const index = soloCharacterIndex();
	return `/characters/${encodeURIComponent(index === void 0 ? "" : c.characters[index]?.avatar ?? "")}`;
}
/** Full parameter record of a prepared request (lightbox, gallery, PNG metadata, "repeat"). */
function metaFromPrepared(prepared, extra) {
	const r = prepared.request;
	const meta = {
		scenePrompt: extra.scenePrompt,
		prompt: prepared.body.input,
		negativePrompt: String(prepared.body.parameters.negative_prompt ?? ""),
		negative: extra.negative,
		mode: extra.mode,
		model: prepared.body.model,
		seed: r.seed,
		width: r.width,
		height: r.height,
		steps: r.steps,
		scale: r.scale,
		cfgRescale: r.cfgRescale,
		sampler: r.sampler,
		noiseSchedule: r.noiseSchedule,
		ucPreset: r.ucPreset,
		qualityPreset: r.qualityPreset,
		requestType: r.mode,
		characters: r.characters.filter((c) => c.enabled && c.prompt.trim()).map((c) => ({
			prompt: c.prompt,
			negative: c.negative,
			x: c.center.x,
			y: c.center.y
		})),
		transport: prepared.transportId,
		cost: prepared.cost.total,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (extra.tool) meta.tool = extra.tool;
	if (extra.sourcePrompt) meta.sourcePrompt = extra.sourcePrompt;
	return meta;
}
var Pipeline = class {
	controller;
	ui;
	observers = /* @__PURE__ */ new Set();
	vibes = null;
	interpreter = null;
	multimodalWarned = false;
	continuity = null;
	constructor(controller, ui) {
		this.controller = controller;
		this.ui = ui;
	}
	onGenerated(observer) {
		this.observers.add(observer);
	}
	setVibeProvider(provider) {
		this.vibes = provider;
	}
	setInterpreter(interpreter) {
		this.interpreter = interpreter;
	}
	setContinuityProvider(provider) {
		this.continuity = provider;
	}
	notify(produced, outcome) {
		for (const observer of this.observers) try {
			observer(produced, outcome);
		} catch (error) {
			log.warn("generation observer failed", error);
		}
	}
	get studio() {
		return this.controller;
	}
	/** Scene prompt for a mode (before prefix/suffix and character prompt). */
	async scenePrompt(mode, trigger, message, minimal, addNegative) {
		const c = ctx();
		if (mode === MODE.RAW_LAST) {
			if (message) return message;
			const last = lastUsableMessage();
			const character = c.groupId ? c.characters.find((ch) => ch.avatar === last.original_avatar) : c.characters[soloCharacterIndex() ?? -1];
			return rawLastPrompt(last.mes, character ? {
				scenario: character.scenario,
				description: character.description
			} : void 0);
		}
		if (mode === MODE.FREE) {
			const free = applyFreeModeCharacter(trigger, lastSpeakerPrompt());
			if (free.negative) addNegative(free.negative);
			return free.prompt;
		}
		let quietPrompt = quietPromptFor(mode, trigger, templates());
		if (isMultimodal(mode)) try {
			const response = await fetch(await avatarUrl(mode));
			if (!response.ok) throw new NaiError("multimodal-failed", "none");
			const caption = await describeImage(await blobToBase64(await response.blob()), quietPrompt);
			if (!caption) throw new NaiError("multimodal-failed", "none");
			return caption;
		} catch (error) {
			const reason = error instanceof NaiError ? error.title : String(error?.message ?? error);
			log.warn("multimodal captioning failed, using the text mode:", reason);
			if (!this.multimodalWarned) {
				this.multimodalWarned = true;
				toastr.warning(t("naist.multimodal.fallback", { reason }), t("naist.multimodal.title"), { timeOut: 1e4 });
			}
			quietPrompt = quietPromptFor(textModeOf(mode), trigger, templates());
		}
		let prompt = processReply(await c.generateQuietPrompt({ quietPrompt }), minimal);
		if (!prompt) throw new NaiError("prompt-generation-failed", "none");
		if (mode === MODE.FREE_EXTENDED) {
			const free = applyFreeModeCharacter(prompt.trim(), lastSpeakerPrompt());
			if (free.negative) addNegative(free.negative);
			prompt = free.prompt;
		}
		return prompt;
	}
	/**
	* Synchronous FREE-mode preparation for the panel preview and inspector: the exact body the
	* panel's Generate button will send (minus the random seed).
	*/
	previewFree(trigger) {
		const assembled = this.assemble(MODE.FREE, trigger, "", {
			isSwipe: false,
			expanded: false
		});
		return this.controller.prepare(assembled.overrides);
	}
	/** Composed scene (TZ Phase 4) as the inspector will see it. */
	previewScene(scene, generation) {
		const assembled = this.assemble(MODE.FREE, scene, "", {
			isSwipe: false,
			expanded: true
		}, { generation });
		return this.controller.prepare(assembled.overrides);
	}
	assemble(mode, scene, additionalNegative, flags, overrides = {}, forcedSize) {
		const s = settings();
		const c = ctx();
		const g = {
			...s.generation,
			...overrides.generation
		};
		const style = overrides.style;
		const caps = getCapabilities(isModelId(g.model) ? g.model : DEFAULT_MODEL);
		const dims = forcedSize ?? modeDimensions(mode, g.width, g.height, overrides.snap ?? s.modes.snap, caps.sizePresets);
		let negativeExtra = additionalNegative;
		let sceneText = scene;
		if (mode === MODE.FREE && !flags.isSwipe && !flags.expanded) {
			const free = applyFreeModeCharacter(scene, lastSpeakerPrompt());
			sceneText = free.prompt;
			if (free.negative) negativeExtra = combinePrefixes(negativeExtra, free.negative);
		}
		const character = currentCharacterPrompt();
		const assembled = assemblePrompt({
			scene: sceneText,
			prefix: style ? style.prefix : s.prompts.prefix,
			suffix: style ? style.suffix : s.prompts.suffix,
			negative: commonNegative(overrides),
			characterPositive: character.positive,
			characterNegative: character.negative,
			additionalNegative: negativeExtra,
			useCharacterPrefix: usesCharacterPrefix(mode, flags.isSwipe, soloCharacterIndex() !== void 0)
		});
		return {
			overrides: {
				...overrides.generation,
				prompt: c.substituteParams(assembled.prompt),
				negativePrompt: c.substituteParams(assembled.negative),
				width: dims.width,
				height: dims.height
			},
			sceneText,
			negativeExtra,
			dims
		};
	}
	/**
	* Everything up to the images: mode, scene prompt (LLM / raw / free / multimodal), optional
	* edit, SD_PROMPT_PROCESSING, assembly, cost guard, transport. Returns null when cancelled.
	*/
	async produce(req) {
		const s = settings();
		const c = ctx();
		const o = req.overrides ?? {};
		const trigger = req.trigger.trim();
		if (!trigger && !req.swipe && req.scene === void 0) return null;
		const refine = o.edit ?? (o.quiet ? false : s.modes.refine);
		const minimal = o.minimalProcessing ?? s.modes.minimalProcessing;
		let mode;
		let scene;
		let additionalNegative = o.negative ?? "";
		let forcedSize;
		const isSwipe = Boolean(req.swipe);
		if (req.scene !== void 0) {
			mode = req.mode ?? MODE.FREE;
			scene = req.scene;
			if (refine) {
				const edited = await this.ui.refine(scene, { negative: additionalNegative });
				if (!edited) return null;
				scene = edited.prompt;
				additionalNegative = edited.negative ?? additionalNegative;
			}
			const hasCharacters = (o.generation?.characters ?? []).some((ch) => ch.enabled && ch.prompt.trim());
			if (!scene.trim() && !hasCharacters) return null;
		} else if (req.swipe) {
			const attachment = req.swipe.attachment;
			mode = attachment?.generation_type ?? MODE.FREE;
			scene = attachment?.title ?? req.swipe.text ?? "";
			additionalNegative = attachment?.negative ?? additionalNegative;
			const saved = attachment?.width && attachment?.height ? {
				width: attachment.width,
				height: attachment.height
			} : void 0;
			if (refine) {
				const edited = await this.ui.refine(scene, {
					negative: additionalNegative,
					resolution: saved ? `${saved.width}x${saved.height}` : void 0
				});
				if (!edited) return null;
				scene = edited.prompt;
				additionalNegative = edited.negative ?? additionalNegative;
				forcedSize = edited.useSavedResolution ? saved : void 0;
			} else forcedSize = saved;
			if (!scene.trim()) return null;
		} else {
			mode = req.mode ?? resolveMode(trigger, {
				multimodal: o.multimodal ?? s.modes.multimodal,
				freeExtend: o.extend ?? s.modes.freeExtend
			});
			scene = mode === MODE.FREE ? trigger : await this.scenePrompt(mode, trigger, req.message, minimal, (neg) => additionalNegative = combinePrefixes(additionalNegative, neg));
			if (mode !== MODE.FREE && refine) {
				const edited = await this.ui.refine(scene, {});
				if (!edited) return null;
				scene = edited.prompt;
			}
		}
		const eventData = {
			prompt: scene,
			generationType: mode,
			message: req.message,
			trigger
		};
		await c.eventSource.emit(c.eventTypes.SD_PROMPT_PROCESSING ?? "sd_prompt_processing", eventData);
		scene = eventData.prompt;
		const interpreter = this.interpreter;
		const targetModel = String(o.generation?.model ?? s.generation.model);
		const cyrillicOnly = (req.interpret ?? (req.scene === void 0 ? "auto" : "cyrillic")) === "cyrillic";
		const interpretContext = {
			model: targetModel,
			cyrillicOnly,
			signal: req.signal
		};
		const charactersCyrillicOnly = req.interpretCharacters ? req.interpretCharacters === "cyrillic" : cyrillicOnly;
		let sourcePrompt = interpreter?.original?.(scene);
		if (interpreter && scene.trim()) {
			const result = await interpreter.interpret(scene, interpretContext);
			if (result && result.prompt !== scene) {
				sourcePrompt = scene;
				scene = result.prompt;
				if (result.negative) additionalNegative = combinePrefixes(additionalNegative, result.negative);
			}
		}
		if (interpreter && hasCyrillic(additionalNegative)) {
			const result = await interpreter.interpret(additionalNegative, {
				...interpretContext,
				negative: true
			});
			if (result) additionalNegative = result.prompt;
		}
		if (s.scene.allowNsfw) {
			const characters = (o.generation?.characters ?? s.generation.characters).filter((ch) => ch.enabled);
			const explicit = explicitScene(scene, characters.map((ch) => ch.prompt), s.scene.explicitNegative, `${additionalNegative}, ${commonNegative(o)}`);
			if (explicit) {
				scene = explicit.scene;
				if (explicit.negative) additionalNegative = combinePrefixes(additionalNegative, explicit.negative);
			}
		}
		const assembled = this.assemble(mode, scene, additionalNegative, {
			isSwipe,
			expanded: req.scene !== void 0
		}, o, forcedSize);
		if (isSwipe && assembled.overrides.seed === void 0 && s.generation.seed >= 0) assembled.overrides.seed = -1;
		if (interpreter) {
			const characters = assembled.overrides.characters ?? s.generation.characters;
			let changed = false;
			const converted = await Promise.all(characters.map(async (ch) => {
				if (!ch.enabled) return ch;
				const prompt = ch.prompt.trim() ? await interpreter.interpret(ch.prompt, {
					...interpretContext,
					cyrillicOnly: charactersCyrillicOnly
				}) : null;
				const negative = hasCyrillic(ch.negative) ? await interpreter.interpret(ch.negative, {
					...interpretContext,
					negative: true
				}) : null;
				if (!prompt && !negative) return ch;
				changed = true;
				return {
					...ch,
					prompt: prompt?.prompt ?? ch.prompt,
					negative: [negative?.prompt ?? ch.negative, prompt?.negative ?? ""].filter((n) => n.trim()).join(", ")
				};
			}));
			if (changed) assembled.overrides.characters = converted;
		}
		const patch = { ...req.requestPatch };
		const transport = this.controller.state.selection?.transport;
		const model = String(assembled.overrides.model ?? s.generation.model);
		const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
		if (patch.vibes === void 0 && this.vibes && transport && patch.mode !== "inpaint") {
			const chatId = c.getCurrentChatId();
			const vibes = await this.vibes.prepare(caps, transport, req.signal, req.vibes, {
				priority: req.queue?.priority ?? "user",
				...chatId !== void 0 ? { chatId } : {}
			});
			if (vibes.length) patch.vibes = vibes;
		}
		if (this.continuity && !req.noContinuity && !isSwipe && patch.mode === void 0 && patch.image === void 0) {
			const wanted = {
				width: roundToStep(Number(assembled.overrides.width ?? s.generation.width)),
				height: roundToStep(Number(assembled.overrides.height ?? s.generation.height))
			};
			const size = s.anlas.freeOnly ? fitArea(wanted.width, wanted.height, FREE_MAX_PIXELS) : wanted;
			const base = await this.continuity.prepare({
				text: `${trigger}\n${scene}\n${req.message ?? ""}`,
				size,
				caps,
				signal: req.signal
			});
			if (base) {
				assembled.overrides.width = size.width;
				assembled.overrides.height = size.height;
				patch.mode = "img2img";
				patch.image = base.image;
				patch.strength = base.strength;
			}
		}
		if (s.stream.enabled && transport?.features.stream === true && caps.family !== "v3" && patch.stream === void 0) patch.stream = "sse";
		const prepared = this.controller.prepare(assembled.overrides, patch);
		if (req.maxCost !== void 0 && prepared.cost.total > req.maxCost) throw new NaiError("free-only-blocked", "none", { cost: prepared.cost.total });
		if (s.inspector.openBeforeSend && !o.quiet) {
			if (!await this.ui.inspect(prepared)) return null;
		} else if (!req.skipCostConfirm && prepared.blockers.length === 0 && prepared.cost.total > 0 && prepared.cost.total > s.anlas.confirmAbove) {
			if (!await this.ui.confirmCost(prepared)) return null;
		}
		const abort = new AbortController();
		req.signal?.addEventListener("abort", () => abort.abort(), { once: true });
		const loader = c.loader?.show({
			blocking: false,
			slug: "nai-studio-generation",
			title: t("naist.loader.title"),
			message: t("naist.loader.message"),
			onStop: () => abort.abort()
		});
		try {
			const chatId = c.getCurrentChatId();
			let started = false;
			const queue = req.queue ?? {};
			const job = {
				priority: queue.priority ?? "user",
				kind: queue.kind ?? "picture",
				...chatId !== void 0 ? { chatId } : {},
				...queue.stale ? { stale: queue.stale } : {},
				onStatus: (status) => {
					if (status.state === "running" && !started) {
						started = true;
						this.ui.progress?.start({
							steps: prepared.request.steps,
							streaming: prepared.build.endpoint === "generate-stream",
							transport: prepared.transportId
						});
					}
					queue.onStatus?.(status);
				}
			};
			const result = await this.controller.send(prepared, abort.signal, (frame) => this.ui.progress?.frame(frame), job).finally(() => {
				if (started) this.ui.progress?.end();
			});
			if (!result.images.length) throw new NaiError("invalid-response", "none", { preview: "" });
			const generation = o.generation ?? {};
			const legacy = {
				scenePrompt: assembled.sceneText,
				prompt: prepared.body.input,
				negative: assembled.negativeExtra,
				mode,
				model: prepared.body.model,
				seed: prepared.request.seed,
				transport: prepared.transportId,
				cost: prepared.cost.total,
				correlationId: result.correlationId,
				...forcedSize ?? (generation.width && generation.height ? assembled.dims : {})
			};
			const meta = metaFromPrepared(prepared, {
				scenePrompt: assembled.sceneText,
				negative: assembled.negativeExtra,
				mode,
				...sourcePrompt ? { sourcePrompt } : {}
			});
			if (sourcePrompt) legacy.sourcePrompt = sourcePrompt;
			log.info("picture", req.initiator, `mode ${mode}`, prepared.body.model, `cost ${prepared.cost.total}`);
			return {
				images: result.images,
				meta,
				legacy,
				prepared,
				mode,
				chatId,
				...req.passportIds?.length ? { passportIds: [...req.passportIds] } : {}
			};
		} catch (error) {
			throw toNaiError(error, {
				model: prepared.request.model,
				family: prepared.caps.family,
				transport: prepared.transportId
			});
		} finally {
			await loader?.hide();
		}
	}
	async generatePicture(req) {
		const s = settings();
		const c = ctx();
		const o = req.overrides ?? {};
		const produced = await this.produce(req);
		if (!produced) return null;
		const { legacy: meta, mode, chatId } = produced;
		const cost = produced.prepared.cost.total;
		try {
			const folder = o.gallery === false ? "" : imageFolder();
			const saved = await saveImages(produced.images, folder);
			const first = saved[0];
			if (!first) throw new NaiError("invalid-response", "none", { preview: "" });
			this.notify(produced, {
				target: o.quiet ? "other" : "message",
				paths: saved.map((x) => x.path)
			});
			if (ctx().getCurrentChatId() !== chatId) {
				toastr.warning(t("naist.result.chatChanged", { count: saved.length }));
				return {
					path: first.path,
					messageId: null,
					cost
				};
			}
			let messageId = null;
			if (!o.quiet) {
				if (req.swipe) {
					await appendToMessage(req.swipe.messageId, saved, meta);
					messageId = req.swipe.messageId;
				} else {
					if (mode === MODE.BACKGROUND) await c.eventSource.emit(c.eventTypes.FORCE_SET_BACKGROUND ?? "force_set_background", {
						url: `url("${encodeURI(first.path)}")`,
						path: first.path
					});
					messageId = await postToChat(saved, meta, {
						visible: s.chat.visibility[req.initiator] === true,
						author: s.chat.author,
						hidePrompt: s.chat.hidePrompt,
						text: messageText(templates()[String(MODE.MESSAGE)] ?? "{{prompt}}", meta.scenePrompt)
					});
				}
				if (messageId !== null) imageReady(messageId, req.swipe ? "swipe" : "message", produced.passportIds);
			}
			return {
				path: first.path,
				messageId,
				cost
			};
		} catch (error) {
			throw toNaiError(error, {
				model: produced.prepared.request.model,
				transport: produced.prepared.transportId
			});
		}
	}
};
//#endregion
//#region src/features/inline/inline-store.ts
var PREFIX = "img:";
/** Keys written but not yet referenced by a saved message (excluded from garbage collection). */
var pending = /* @__PURE__ */ new Set();
function chatKey() {
	return (ctx().getCurrentChatId() ?? "nochat").replace(/:/g, "_");
}
function newBlobKey(imageId) {
	return `${PREFIX}${chatKey()}:${imageId}:${ctx().uuidv4().slice(0, 8)}`;
}
async function putBlob(key, blob) {
	pending.add(key);
	await imageStore().setItem(key, blob);
}
/** Call once the entry that references the key is in the chat. */
function settle(keys) {
	for (const key of keys) pending.delete(key);
}
async function getBlob(key) {
	if (!key) return null;
	try {
		return await imageStore().getItem(key);
	} catch {
		return null;
	}
}
async function removeBlobs(keys) {
	await Promise.all(keys.filter(Boolean).map((key) => imageStore().removeItem(key)));
}
/** Every blob key referenced by any message or any message swipe of a chat. */
function referencedKeys(chat) {
	const keys = /* @__PURE__ */ new Set();
	const add = (extra) => {
		for (const entry of readEntries(extra)) for (const key of entryBlobKeys(entry)) keys.add(key);
	};
	for (const message of chat) {
		add(message.extra);
		const swipes = message.swipe_info;
		if (Array.isArray(swipes)) for (const info of swipes) add(info?.extra);
	}
	return keys;
}
/** Frees blobs of the current chat that nothing references any more. Returns how many. */
async function collectGarbage() {
	const prefix = `${PREFIX}${chatKey()}:`;
	let keys;
	try {
		keys = (await imageStore().keys()).filter((k) => k.startsWith(prefix));
	} catch (error) {
		log.warn("image store unavailable", error);
		return 0;
	}
	const used = referencedKeys(ctx().chat);
	const unused = keys.filter((k) => !used.has(k) && !pending.has(k));
	await removeBlobs(unused);
	if (unused.length) log.info(`freed ${unused.length} inline image blob(s)`);
	return unused.length;
}
//#endregion
//#region src/features/inline/inline-service.ts
function message(messageId) {
	const found = ctx().chat[messageId];
	if (!found) throw new NaiError("image-not-found", "none");
	return found;
}
function entriesOf(m) {
	m.extra ??= {};
	const entries = readEntries(m.extra);
	m.extra.nai_images = entries;
	return entries;
}
function findEntry(messageId, imageId) {
	const m = message(messageId);
	const entry = entriesOf(m).find((e) => e.id === imageId);
	if (!entry) throw new NaiError("image-not-found", "none");
	return {
		m,
		entry
	};
}
/** Keeps the active swipe copy of the message in sync, saves the chat and re-renders. */
async function commit(messageId, rerender = true) {
	const c = ctx();
	const m = c.chat[messageId];
	if (!m) return;
	const swipeId = m.swipe_id;
	if (Array.isArray(m.swipes) && typeof swipeId === "number" && swipeId < m.swipes.length) {
		m.swipes[swipeId] = m.mes;
		const info = Array.isArray(m.swipe_info) ? m.swipe_info[swipeId] : void 0;
		if (info && typeof info === "object") info.extra = structuredClone(m.extra);
	}
	await c.saveChat();
	if (rerender) c.updateMessageBlock(messageId, m);
}
var InlineImages = class {
	pipeline;
	listeners = /* @__PURE__ */ new Set();
	constructor(pipeline) {
		this.pipeline = pipeline;
	}
	/** The renderer subscribes to re-mount a message after a change it did not cause. */
	onChange(listener) {
		this.listeners.add(listener);
	}
	changed(messageId) {
		for (const listener of this.listeners) listener(messageId);
	}
	entries(messageId) {
		const m = ctx().chat[messageId];
		return m ? readEntries(m.extra) : [];
	}
	displayDefaults(partial = {}) {
		const s = settings().inline;
		return defaultDisplay({
			width: s.defaultWidth,
			widthUnit: s.defaultWidthUnit,
			align: s.defaultAlign,
			radius: s.defaultRadius,
			layout: s.defaultLayout,
			...partial
		});
	}
	/** Saves one generated image (browser copy and/or server file) as a swipe. */
	async storeImage(imageId, image, meta) {
		const s = settings().inline;
		const swipeMeta = {
			...meta,
			seed: image.seed ?? meta.seed
		};
		let blobKey = "";
		if (s.keepBrowserCopy) {
			blobKey = newBlobKey(imageId);
			await putBlob(blobKey, base64ToBlob(image.base64, image.mime));
		}
		let filePath = "";
		if (s.saveToServer || !blobKey) {
			const folder = imageFolder();
			filePath = await uploadImage(image.base64, image.mime, folder, imageFileName(folder, swipeMeta.seed));
		}
		return {
			blobKey,
			filePath,
			mime: image.mime,
			meta: swipeMeta
		};
	}
	record(produced, swipes, inlineId) {
		this.pipeline.notify(produced, {
			target: "inline",
			paths: swipes.map((s) => s.filePath),
			blobKeys: swipes.map((s) => s.blobKey),
			inlineId
		});
	}
	/** Generates a new image entry for a message (text untouched). Null when cancelled. */
	async create(messageId, req) {
		message(messageId);
		const produced = await this.pipeline.produce({
			initiator: "message",
			trigger: req.trigger,
			mode: req.mode,
			scene: req.scene,
			overrides: req.overrides,
			...req.passportIds?.length ? { passportIds: req.passportIds } : {}
		});
		if (!produced) return null;
		const m = message(messageId);
		const id = ctx().uuidv4();
		const swipes = [];
		for (const image of produced.images) swipes.push(await this.storeImage(id, image, produced.meta));
		const [first, ...rest] = swipes;
		if (!first) throw new NaiError("invalid-response", "none", { preview: "" });
		const entry = createInlineImage(id, first, this.displayDefaults(req.display));
		for (const swipe of rest) addSwipe(entry, swipe);
		if (rest.length) setActiveSwipe(entry, 0);
		entriesOf(m).push(entry);
		this.record(produced, swipes, id);
		return entry;
	}
	/** Generates and inserts at a character offset of the message text (end by default). */
	async insert(messageId, req, offset) {
		const entry = await this.create(messageId, req);
		if (!entry) return null;
		const m = message(messageId);
		m.mes = insertPlaceholder(m.mes, entry.id, offset ?? m.mes.length);
		await commit(messageId);
		settle(entryBlobKeys(entry));
		imageReady(messageId, "inline", req.passportIds);
		return entry;
	}
	/** A finished reply: raw markers replaced with placeholders, pending entries added. */
	async addPending(messageId, text, entries) {
		const m = message(messageId);
		m.mes = text;
		entriesOf(m).push(...entries);
		await commit(messageId);
	}
	/**
	* Where an image lives now: the active text of a message (the hint first, messages may shift)
	* or a swipe of it that is not shown. Null when it is gone (deleted, other chat).
	*/
	locate(imageId, hint) {
		const chat = ctx().chat;
		const order = [hint, ...chat.keys()].filter((i, n, all) => i >= 0 && i < chat.length && all.indexOf(i) === n);
		for (const i of order) {
			const m = chat[i];
			const entry = readEntries(m.extra).find((e) => e.id === imageId);
			if (entry) return {
				messageId: i,
				entry,
				active: true
			};
			const infos = Array.isArray(m.swipe_info) ? m.swipe_info : [];
			for (const info of infos) {
				const other = readEntries(info?.extra).find((e) => e.id === imageId);
				if (other) return {
					messageId: i,
					entry: other,
					active: false
				};
			}
		}
		return null;
	}
	async commitLocated(found) {
		if (found.active) await commit(found.messageId);
		else await ctx().saveChat();
	}
	/** The generation of a pending image finished: its images become the swipes. */
	async completePending(hint, imageId, produced) {
		const found = this.locate(imageId, hint);
		if (!found) return false;
		const { entry } = found;
		const swipes = [];
		for (const image of produced.images) swipes.push(await this.storeImage(imageId, image, produced.meta));
		if (!swipes.length) throw new NaiError("invalid-response", "none", { preview: "" });
		const first = entry.swipes.length;
		for (const swipe of swipes) addSwipe(entry, swipe);
		setActiveSwipe(entry, first);
		if (entry.marker) {
			entry.marker.status = "done";
			delete entry.marker.error;
		}
		await this.commitLocated(found);
		settle(swipes.map((sw) => sw.blobKey));
		this.record(produced, swipes, imageId);
		imageReady(found.messageId, entry.marker ? "marker" : "inline", produced.passportIds);
		return true;
	}
	/** Status of a marker image (pending again for a retry, error with the reason). */
	async setMarkerStatus(hint, imageId, status, error) {
		const found = this.locate(imageId, hint);
		if (!found?.entry.marker) return false;
		found.entry.marker.status = status;
		if (error) found.entry.marker.error = error;
		else delete found.entry.marker.error;
		await this.commitLocated(found);
		return true;
	}
	/** After an edit-mode insertion the placeholder lives in the textarea until ST saves it. */
	async saveCreated(messageId, entry) {
		await commit(messageId, false);
		settle(entryBlobKeys(entry));
		imageReady(messageId, "inline");
	}
	async addGeneratedSwipe(messageId, imageId, produced, kind = "swipe") {
		if (!produced) return false;
		const { entry } = findEntry(messageId, imageId);
		const swipes = [];
		for (const image of produced.images) swipes.push(await this.storeImage(imageId, image, produced.meta));
		for (const swipe of swipes) addSwipe(entry, swipe);
		await commit(messageId);
		settle(swipes.map((s) => s.blobKey));
		this.record(produced, swipes, imageId);
		imageReady(messageId, kind, produced.passportIds);
		return true;
	}
	overridesFrom(meta, seed) {
		return {
			negative: meta.negative,
			generation: {
				model: meta.model,
				width: meta.width,
				height: meta.height,
				steps: meta.steps,
				scale: meta.scale,
				cfgRescale: meta.cfgRescale,
				sampler: meta.sampler,
				noiseSchedule: meta.noiseSchedule,
				seed
			}
		};
	}
	/** Same parameters, new seed; kept at the same position as a new swipe. */
	async regenerate(messageId, imageId) {
		const { entry } = findEntry(messageId, imageId);
		const meta = activeSwipe(entry)?.meta ?? entry.meta;
		const produced = await this.pipeline.produce({
			initiator: "message",
			trigger: meta.scenePrompt,
			scene: meta.scenePrompt,
			mode: meta.mode,
			overrides: this.overridesFrom(meta, -1)
		});
		return await this.addGeneratedSwipe(messageId, imageId, produced);
	}
	/** Same seed plus noise: img2img from the current image (plugin transport only). */
	async variation(messageId, imageId) {
		if (!(this.pipeline.studio.state.selection?.transport)?.features.img2img) throw new NaiError("feature-unavailable", "install-plugin", { feature: "img2img" });
		const { entry } = findEntry(messageId, imageId);
		const swipe = activeSwipe(entry);
		if (!swipe) throw new NaiError("image-not-found", "none");
		const image = await blobToBase64$1(await toPngBlob(await this.sourceBlob(swipe), {
			width: swipe.meta.width,
			height: swipe.meta.height
		}));
		const s = settings().inline;
		const produced = await this.pipeline.produce({
			initiator: "message",
			trigger: swipe.meta.scenePrompt,
			scene: swipe.meta.scenePrompt,
			mode: swipe.meta.mode,
			overrides: this.overridesFrom(swipe.meta, swipe.meta.seed),
			requestPatch: {
				mode: "img2img",
				image,
				strength: s.variationStrength,
				noise: s.variationNoise
			}
		});
		return await this.addGeneratedSwipe(messageId, imageId, produced);
	}
	/** "Redo with an edited prompt": parameters from the popup, result as a new swipe. */
	async editAndRegenerate(messageId, imageId, params) {
		const { entry } = findEntry(messageId, imageId);
		const meta = activeSwipe(entry)?.meta ?? entry.meta;
		const overrides = this.overridesFrom({
			...meta,
			model: params.model,
			width: params.width,
			height: params.height,
			steps: params.steps,
			scale: params.scale
		}, params.seed);
		overrides.negative = params.negative;
		const produced = await this.pipeline.produce({
			initiator: "message",
			trigger: params.scene,
			scene: params.scene,
			mode: meta.mode === MODE.FREE ? MODE.FREE : meta.mode,
			overrides
		});
		return await this.addGeneratedSwipe(messageId, imageId, produced);
	}
	/** Adds an externally produced image (Director Tools, upscale, inpaint) as a new swipe. */
	async addProducedSwipe(messageId, imageId, produced) {
		return await this.addGeneratedSwipe(messageId, imageId, produced, "tool");
	}
	async setActive(messageId, imageId, index) {
		const { entry } = findEntry(messageId, imageId);
		setActiveSwipe(entry, index);
		await commit(messageId);
	}
	/** Removes the active swipe (the last remaining one deletes the whole image). */
	async deleteSwipe(messageId, imageId) {
		const { entry } = findEntry(messageId, imageId);
		if (entry.swipes.length <= 1) {
			await this.remove(messageId, imageId);
			return;
		}
		removeSwipe(entry, entry.activeSwipe);
		await commit(messageId);
		await collectGarbage();
	}
	async remove(messageId, imageId) {
		const m = message(messageId);
		m.mes = removePlaceholder(m.mes, imageId);
		m.extra ??= {};
		m.extra.nai_images = entriesOf(m).filter((e) => e.id !== imageId);
		await commit(messageId);
		await collectGarbage();
	}
	async updateDisplay(messageId, imageId, display) {
		const { entry } = findEntry(messageId, imageId);
		entry.display = {
			...entry.display,
			...display
		};
		await commit(messageId);
	}
	/** Moves an image inside a message or to another message (before `beforeId`, or to the end). */
	async move(fromId, imageId, toId, beforeId) {
		if (fromId === toId) {
			const m = message(fromId);
			m.mes = movePlaceholder(m.mes, imageId, beforeId);
			await commit(fromId);
			return;
		}
		const { m: from, entry } = findEntry(fromId, imageId);
		const to = message(toId);
		from.mes = removePlaceholder(from.mes, imageId);
		from.extra ??= {};
		from.extra.nai_images = entriesOf(from).filter((e) => e.id !== imageId);
		const offset = (beforeId ? readEntries(to.extra).some((e) => e.id === beforeId) : false) ? to.mes.indexOf(`[nai:img:${beforeId}]`) : to.mes.length;
		to.mes = insertPlaceholder(to.mes, imageId, offset);
		entriesOf(to).push(entry);
		await commit(fromId);
		await commit(toId);
	}
	/**
	* Text and entries of one message after an edit, swipe or regeneration. Returns true when
	* something was removed. Blobs of other swipes are untouched (they keep their own copies).
	*/
	async reconcileMessage(messageId, rerender = true) {
		const m = ctx().chat[messageId];
		if (!m) return false;
		const entries = readEntries(m.extra);
		if (!entries.length && !m.mes.includes("[nai:img:")) return false;
		const result = reconcile(m.mes, entries);
		if (!result.removedEntries.length && !result.removedPlaceholders.length) return false;
		m.mes = result.text;
		m.extra ??= {};
		m.extra.nai_images = result.entries;
		await commit(messageId, rerender);
		log.info(`inline images reconciled in message ${messageId}:`, `${result.removedEntries.length} entries, ${result.removedPlaceholders.length} placeholders removed`);
		return true;
	}
	async reconcileChat() {
		const chat = ctx().chat;
		let changed = false;
		for (let i = 0; i < chat.length; i++) changed = await this.reconcileMessage(i) || changed;
		await collectGarbage();
		if (changed) log.info("inline images reconciled");
	}
	/** Full image of a swipe: browser copy first, then the server file. */
	async sourceBlob(swipe) {
		const local = await getBlob(swipe.blobKey);
		if (local) return local;
		if (swipe.filePath) {
			const response = await fetch(swipe.filePath);
			if (response.ok) return await response.blob();
		}
		throw new NaiError("image-load-failed", "none");
	}
	/** Makes sure the active swipe has a file in /user/images (backgrounds, avatars need one). */
	async ensureFile(messageId, imageId) {
		const { entry } = findEntry(messageId, imageId);
		const swipe = activeSwipe(entry);
		if (!swipe) throw new NaiError("image-not-found", "none");
		if (swipe.filePath) return swipe.filePath;
		const blob = await this.sourceBlob(swipe);
		const folder = imageFolder();
		swipe.filePath = await uploadImage(await blobToBase64$1(blob), blob.type || swipe.mime, folder, imageFileName(folder, swipe.meta.seed));
		setActiveSwipe(entry, entry.activeSwipe);
		await commit(messageId, false);
		this.changed(messageId);
		return swipe.filePath;
	}
	/** Lifecycle "clean" and the gallery's mass delete free blobs through here. */
	async freeBlobs(keys) {
		await removeBlobs(keys);
	}
};
//#endregion
//#region src/features/continuity/places.ts
var PLACES_GLOBAL = "MAESTRO_PLACES";
/** Fired on window by Maestro when MAESTRO_PLACES appears. */
var PLACES_READY_EVENT = "maestro-places-ready";
var METHODS = [
	"current",
	"resolve",
	"list",
	"onEnter"
];
/** The published registry when it is version 1 with every method; null otherwise. */
function maestroPlaces() {
	const value = globalThis[PLACES_GLOBAL];
	if (typeof value !== "object" || value === null) return null;
	const api = value;
	if (api.version !== 1) return null;
	return METHODS.every((method) => typeof api[method] === "function") ? value : null;
}
function safe(run, fallback) {
	try {
		return run();
	} catch (error) {
		log.warn("MAESTRO_PLACES failed", error);
		return fallback;
	}
}
/** The place a label names (name, alias or case form); null without the registry or a match. */
function resolvePlace(label) {
	const api = maestroPlaces();
	if (!api || !label.trim()) return null;
	return safe(() => normalizePlace(api.resolve(label.trim())), null);
}
/** A place by id from the registry's list; null when absent. */
function placeById(id) {
	const api = maestroPlaces();
	if (!api) return null;
	const list = safe(() => api.list(), []);
	return (Array.isArray(list) ? list.map(normalizePlace) : []).find((place) => place?.id === id) ?? null;
}
var subscribed = null;
/**
* Follows the place the story enters (once per registry object; a new registry after a reload of
* Maestro is subscribed again). Called whenever continuity is used, so a late Maestro is picked up.
*/
function followPlaces(onEnter) {
	const api = maestroPlaces();
	if (!api || subscribed?.api === api) return;
	unfollowPlaces();
	const result = safe(() => api.onEnter((raw) => {
		const place = normalizePlace(raw);
		if (place) onEnter(place);
	}), void 0);
	subscribed = {
		api,
		unsubscribe: typeof result === "function" ? result : () => {}
	};
}
function unfollowPlaces() {
	if (!subscribed) return;
	const { unsubscribe } = subscribed;
	subscribed = null;
	safe(() => unsubscribe(), void 0);
}
//#endregion
//#region src/features/scene/scene-service.ts
var PERSONA_PREFIX = PERSONA_OWNER_PREFIX;
/** Key prefix of the candidates of passports that exist only in the chat ("chat#<passport id>"). */
var CHAT_PASSPORT_PREFIX = "chat#";
/** Key prefix of the candidates of passport providers ("provided#<passport id>", v0.12); stored nowhere. */
var PROVIDED_PASSPORT_PREFIX = "provided#";
function customPoses() {
	return settings().poses.custom.map((p) => ({
		id: p.id,
		category: p.category || "standing",
		tags: p.tags,
		keywords: p.keywords
	}));
}
function poseLibrary() {
	const custom = customPoses();
	return [...custom, ...POSES.filter((p) => !custom.some((c) => c.id === p.id))];
}
function currentCaps() {
	const model = settings().generation.model;
	return getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
}
function aliasesOf(name) {
	const first = name.trim().split(/\s+/)[0] ?? "";
	return first && first !== name.trim() ? [first] : [];
}
var provider = null;
function setSceneProvider(next) {
	provider = next;
}
var sameCandidate = (a, b) => mentionIndex(a.name, [b.name, ...b.aliases]) >= 0 || mentionIndex(b.name, [a.name, ...a.aliases]) >= 0;
/** Candidates of the cards and the persona, with the provider's people merged in. */
async function withProvided(base, query) {
	if (!provider) return base;
	let extra = [];
	try {
		extra = await provider.candidates(query);
	} catch (error) {
		log.warn("scene provider: people not available", error);
	}
	for (const person of extra) {
		const known = base.find((c) => !c.isUser && sameCandidate(c, person));
		if (known) {
			if (person.currentLook) {
				known.currentLook = person.currentLook;
				if (person.currentLookText) known.currentLookText = person.currentLookText;
				else delete known.currentLookText;
			}
			known.aliases = [.../* @__PURE__ */ new Set([...known.aliases, ...person.aliases])];
		} else base.push(person);
	}
	return base;
}
/**
* The people of a card: one candidate per character passport (the main one keeps the card key);
* a card without character passports is one candidate with its character prompt, unless it is a
* scenario (then nobody is drawn for the card itself).
*/
async function characterCandidates(index, chat) {
	const character = await loadCharacter(index);
	if (!character) return [];
	const prompt = readCharacterPrompt(character);
	const key = avatarKey(character.avatar);
	const list = resolvedCardPassports(character, chat);
	const people = list.filter((p) => p.kind === "character" && !isPassportEmpty(p));
	if (people.length) {
		const main = primaryPassport(people, character.name);
		return people.map((passport) => {
			const isMain = passport === main;
			const name = passport.name || character.name;
			return {
				key: isMain ? key : `${key}#${passport.id}`,
				name,
				aliases: [.../* @__PURE__ */ new Set([...passport.aliases, ...aliasesOf(name)])],
				passport,
				fallbackPrompt: isMain ? prompt.positive : "",
				fallbackNegative: isMain ? prompt.negative : "",
				isUser: false
			};
		});
	}
	if (list.some((p) => p.kind === "scenario")) return [];
	return [{
		key,
		name: character.name,
		aliases: aliasesOf(character.name),
		passport: null,
		fallbackPrompt: prompt.positive,
		fallbackNegative: prompt.negative,
		isUser: false
	}];
}
/** A named character passport that no card holds, as a candidate under the key prefix. */
function passportCandidate(passport, prefix) {
	return {
		key: `${prefix}${passport.id}`,
		name: passport.name,
		aliases: [.../* @__PURE__ */ new Set([...passport.aliases, ...aliasesOf(passport.name)])],
		passport,
		fallbackPrompt: "",
		fallbackNegative: "",
		isUser: false
	};
}
/** Named character passports that exist only in this chat (another extension wrote them). */
function chatOnlyCandidates(chat) {
	return chat.extra.filter((p) => p.kind === "character" && p.name.trim() && !isPassportEmpty(p)).map((passport) => passportCandidate(passport, CHAT_PASSPORT_PREFIX));
}
/**
* People of the passport providers (v0.12): after everyone the chat knows; one named like a card, the
* persona, a passport of the chat or an earlier provider passport is left out (the earlier one wins).
*/
async function providedCandidates(known, query) {
	const added = [];
	for (const passport of await providedPassports(query)) {
		if (passport.kind !== "character") continue;
		const candidate = passportCandidate(passport, PROVIDED_PASSPORT_PREFIX);
		if ([...known, ...added].some((c) => sameCandidate(c, candidate))) continue;
		added.push(candidate);
	}
	return added;
}
var namesOne = (name, candidate) => mentionIndex(name, [candidate.name, ...candidate.aliases]) >= 0 || mentionIndex(candidate.name, [name]) >= 0;
/** Candidates a scene provider says are present get `present` (the automatic scene falls back to them). */
function markPresent(list, names) {
	if (!names?.length) return list;
	for (const candidate of list) if (names.some((name) => namesOne(name, candidate))) candidate.present = true;
	return list;
}
/**
* Setting of the chat: world and scenario tags, named locations and objects of its cards and the chat,
* then the ones of the passport providers (a name the chat has wins), plus the setting tags and the
* current location of a provider (a scene tracker).
*/
async function sceneSetting(query = {}) {
	const world = [];
	const worlds = [];
	const locations = [];
	const objects = [];
	const chat = chatPassportData();
	const collect = (passport) => {
		const named = {
			name: passport.name,
			aliases: passport.aliases,
			tags: passport.tags
		};
		if (passport.kind === "world" || passport.kind === "scenario") {
			world.push(passport.tags);
			worlds.push(named);
		} else if (passport.kind === "location" && passport.name && passport.tags.trim()) locations.push(named);
		else if (passport.kind === "object" && passport.name && passport.tags.trim()) objects.push(named);
	};
	for (const index of chatCardIndexes()) for (const passport of resolvedCardPassports(await loadCharacter(index), chat)) collect(passport);
	for (const passport of chat.extra) collect(passport);
	const [provided, hint] = await Promise.all([providedPassports(query), sceneHint(query)]);
	const ofGroup = (group) => provided.filter((p) => passportGroup(p.kind) === group);
	for (const passport of [
		...unknownPassports(ofGroup("setting"), worlds),
		...unknownPassports(ofGroup("location"), locations),
		...unknownPassports(ofGroup("object"), objects)
	]) collect(passport);
	let tracked = {
		tags: [],
		location: ""
	};
	if (provider && (hint.tags === void 0 || hint.locationName === void 0)) try {
		tracked = await provider.setting(query);
	} catch (error) {
		log.warn("scene provider: setting not available", error);
	}
	const tags = hint.tags ?? tracked.tags.join(", ");
	const location = hint.locationName ?? (hint.locationId ? placeById(hint.locationId)?.name : void 0) ?? tracked.location;
	return {
		world: joinTags(...world, tags),
		locations,
		objects,
		location,
		...hint.locationId ? { locationId: hint.locationId } : {}
	};
}
/** Tags of the locations (or objects) a text names (whole-word name or alias). */
function mentionedLocationTags(text, locations) {
	return joinTags(...locations.filter((l) => mentionIndex(text, [l.name, ...l.aliases]) >= 0).map((l) => l.tags));
}
/**
* Characters of the current chat (the 1:1 character or every group member), the persona, then the
* people of the passport providers (v0.12) nobody of the chat is named like.
*/
async function sceneCandidates(query = {}) {
	const c = ctx();
	const chat = chatPassportData();
	const result = [];
	for (const index of chatCardIndexes()) result.push(...await characterCandidates(index, chat));
	result.push(...chatOnlyCandidates(chat));
	const personaKey = await currentPersonaKey();
	result.push({
		key: `${PERSONA_PREFIX}${personaKey}`,
		name: c.name1,
		aliases: aliasesOf(c.name1),
		passport: resolvedPersonaPassport(personaKey, chat),
		fallbackPrompt: "",
		fallbackNegative: "",
		isUser: true
	});
	const hint = sceneHint(query);
	result.push(...await providedCandidates(result, query));
	return markPresent(await withProvided(result, query), (await hint).characters);
}
function sentencesMentioning(text, candidate) {
	const names = [candidate.name, ...candidate.aliases].map((n) => n.toLowerCase()).filter((n) => n.length > 1);
	return text.split(/(?<=[.!?…])\s+|\n+/).filter((sentence) => names.some((n) => sentence.toLowerCase().includes(n))).join(" ");
}
function lastMessage() {
	const chat = ctx().chat;
	for (let i = chat.length - 1; i >= 0; i--) {
		const message = chat[i];
		if (!message || message.is_system) continue;
		const avatar = typeof message.original_avatar === "string" ? message.original_avatar : void 0;
		const c = ctx();
		const speakerKey = message.is_user ? void 0 : avatar ? avatarKey(avatar) : c.characterId !== void 0 ? avatarKey(c.characters[Number(c.characterId)]?.avatar) : void 0;
		return {
			text: message.mes.replace(/\[nai:img:[^\]]+\]/g, ""),
			speakerKey
		};
	}
	return {
		text: "",
		speakerKey: void 0
	};
}
var SceneService = class {
	pipeline;
	inline;
	constructor(pipeline, inline) {
		this.pipeline = pipeline;
		this.inline = inline;
	}
	/** An empty scene with every candidate available (the composer starts from this). */
	async emptySpec(query = {}) {
		const s = settings().scene;
		return {
			candidates: await sceneCandidates(query),
			spec: {
				base: "",
				framing: s.framing,
				camera: s.camera,
				distance: s.distance,
				pair: null,
				participants: [],
				useCoords: s.useCoords
			}
		};
	}
	/**
	* Automatic assembly from the last message (or a given text): who is in the frame, their
	* poses (from the sentences that mention them, else the passport default), a pair pose,
	* positions, and optionally an LLM-written location for the base prompt.
	*/
	async autoSpec(text) {
		const { spec, candidates } = await this.emptySpec();
		const source = text !== void 0 ? {
			text,
			speakerKey: void 0
		} : lastMessage();
		const caps = currentCaps();
		const max = caps.maxCharacters > 0 ? caps.maxCharacters : 3;
		let found = detectParticipants(source.text, candidates, {
			speakerKey: source.speakerKey,
			max
		});
		const present = candidates.filter((c) => c.present);
		if (present.length && !candidates.some((c) => mentionIndex(source.text, [c.name, ...c.aliases]) >= 0)) found = present.slice(0, max);
		const library = poseLibrary();
		const positions = autoLayout(found.length, caps, found.map((c) => c.passport?.position ?? null));
		spec.participants = found.map((candidate, i) => {
			const pose = detectPose(sentencesMentioning(source.text, candidate) || (found.length === 1 ? source.text : ""), library);
			return participantFrom(candidate, positions[i] ?? {
				x: .5,
				y: .5
			}, pose);
		});
		const pair = detectPairInText(source.text, found);
		if (pair) {
			spec.pair = pair;
			applyPairLayout(spec, caps);
		}
		if (settings().scene.llmBase && source.text.trim()) spec.base = await this.describeLocation();
		const setting = await sceneSetting();
		spec.base = joinTags(spec.base, mentionedLocationTags(`${setting.location} ${source.text}`, setting.locations), mentionedLocationTags(source.text, setting.objects), setting.world);
		return {
			spec,
			candidates
		};
	}
	/**
	* Characters named by an image marker (TZ Phase 7): passports by name or alias, positions and
	* poses from the marker, the marker prompt as the shared part. A name without a passport or a
	* character prompt adds nothing; null when no name is usable.
	*/
	/**
	* `counts`: false when the characters were found by name in the description rather than listed
	* by the LLM; someone without a passport may be in the picture too, so no "1girl, 1boy".
	*/
	async markerScene(prompt, chars, query = {}, options = {}) {
		const { spec, candidates } = await this.emptySpec(query);
		const caps = currentCaps();
		const max = caps.maxCharacters > 0 ? caps.maxCharacters : 3;
		const picked = [];
		for (const ch of chars) {
			if (picked.length >= max) break;
			const candidate = candidates.find((c) => (c.passport !== null || c.fallbackPrompt.trim() !== "" || Boolean(c.currentLook?.trim())) && !picked.some((p) => p.candidate.key === c.key) && mentionIndex(ch.name, [c.name, ...c.aliases]) >= 0);
			if (candidate) picked.push({
				candidate,
				ch
			});
			else if (ch.look?.trim()) picked.push({
				candidate: {
					key: `marker:${ch.name.toLowerCase()}`,
					name: ch.name,
					aliases: [],
					passport: null,
					fallbackPrompt: ch.look.trim(),
					fallbackNegative: "",
					isUser: false
				},
				ch: {
					...ch,
					look: void 0
				}
			});
		}
		if (!picked.length) return null;
		const wanted = picked.map(({ ch }) => markerPosition(ch.pos));
		const positions = autoLayout(picked.length, caps, picked.map(({ candidate }, i) => wanted[i] ?? candidate.passport?.position ?? null));
		const library = poseLibrary();
		spec.participants = picked.map(({ candidate, ch }, i) => {
			const pose = detectPose(`${ch.pose ?? ""} ${ch.action ?? ""}`, library);
			const participant = participantFrom(candidate, positions[i] ?? {
				x: .5,
				y: .5
			}, pose);
			if (ch.look?.trim()) {
				participant.currentLook = ch.look.trim();
				delete participant.currentLookText;
			}
			const extra = [pose ? "" : ch.pose ?? "", ch.action ?? ""].filter((x) => x.trim()).join(", ");
			if (extra) participant.poseTags = [participant.poseTags, extra].filter((x) => x.trim()).join(", ");
			return participant;
		});
		spec.base = prompt;
		if (wanted.some(Boolean)) spec.useCoords = true;
		return this.build(spec, {
			auto: true,
			counts: options.counts
		});
	}
	/** Location tags written by the LLM with the built-in "background" template. */
	async describeLocation() {
		const template = settings().prompts.templates[String(MODE.BACKGROUND)] ?? DEFAULT_TEMPLATES[String(MODE.BACKGROUND)] ?? "";
		try {
			return processReply(await ctx().generateQuietPrompt({ quietPrompt: template }), false).replace(/^background,\s*/i, "");
		} catch {
			return "";
		}
	}
	/**
	* `auto`: a scene nobody composed by hand (markers, the LLM tool) gets the NSFW layer of the
	* passports only when the scene itself is explicit.
	*/
	build(spec, options = {}) {
		const text = [spec.base, ...spec.participants.map((p) => p.poseTags)].join(", ");
		const allowNsfw = settings().scene.allowNsfw && (!options.auto || isExplicitScene(text));
		return buildScene(spec, currentCaps(), {
			allowNsfw,
			customPoses: customPoses(),
			counts: options.counts
		});
	}
	/** Overrides for the panel preview and the inspector. */
	overrides(built) {
		return {
			characters: built.characters,
			useCoords: built.useCoords
		};
	}
	/** Generates the composed scene into a new message or inline into the last message. */
	async generate(spec, target, options = {}) {
		const built = this.build(spec, options);
		if (!built.prompt.trim() && !built.characters.some((c) => c.prompt.trim())) throw new NaiError("no-usable-message", "none");
		const overrides = {
			edit: false,
			generation: this.overrides(built)
		};
		if (target === "inline") {
			const chat = ctx().chat;
			let messageId = chat.length - 1;
			while (messageId >= 0 && chat[messageId]?.is_system) messageId--;
			if (messageId < 0) throw new NaiError("no-usable-message", "none");
			return (await this.inline.insert(messageId, {
				trigger: built.prompt,
				scene: built.prompt,
				mode: MODE.FREE,
				overrides,
				passportIds: built.passportIds
			}))?.id ?? null;
		}
		return await this.pipeline.generatePicture({
			initiator: "panel",
			trigger: built.prompt || "scene",
			scene: built.prompt,
			mode: MODE.FREE,
			overrides,
			passportIds: built.passportIds
		});
	}
};
//#endregion
//#region src/features/takeover/migration.ts
/** Defaults of the built-in extension (public/scripts/extensions/stable-diffusion/index.js:220-221). */
var BUILTIN_DEFAULT_PREFIX = "best quality, absurdres, aesthetic,";
/**
* Stock values a new SillyTavern user gets from default/content/settings.json (extension_settings.sd).
* They predate the current defaults but are not user edits either, so they must not be migrated.
*/
var SETTINGS_JSON_DEFAULT_PREFIX = "best quality, absurdres, masterpiece,";
var SETTINGS_JSON_DEFAULT_TEMPLATES = {
	"2": "Ignore previous instructions and provide a detailed description for all of the following: a brief recap of recent events in the story, {{char}}'s appearance, and {{char}}'s surroundings. Do not reply as {{char}} when writing this description, and do not attempt to continue the story.",
	"7": "Ignore previous instructions and provide a detailed description of {{char}}'s surroundings in the form of a comma-delimited list of keywords and phrases. The list must include all of the following items in this order: location, time of day, weather, lighting, and any other relevant details. Do not include descriptions of characters and non-visual qualities such as names, personality, movements, scents, mental traits, or anything which could not be seen in a still photograph. Do not write in full sentences. Prefix your description with the phrase 'background,'. Ignore the rest of the story when crafting this description. Do not reply as {{user}} when writing this description, and do not attempt to continue the story."
};
var STOCK_PREFIXES = [BUILTIN_DEFAULT_PREFIX, SETTINGS_JSON_DEFAULT_PREFIX];
var str = (value) => typeof value === "string" ? value : "";
var num = (value) => typeof value === "number" && Number.isFinite(value) ? value : void 0;
var same = (a, b) => a.trim() === b.trim();
var isStockPrefix = (value) => STOCK_PREFIXES.some((stock) => same(value, stock));
var isStockTemplate = (key, value) => [DEFAULT_TEMPLATES[key], SETTINGS_JSON_DEFAULT_TEMPLATES[key]].some((stock) => stock !== void 0 && same(value, stock));
function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Prompt texts and character slots do not count: they are not generation parameters. */
var NON_PARAMETER_KEYS = /* @__PURE__ */ new Set([
	"prompt",
	"negativePrompt",
	"characters"
]);
function generationIsPristine(current) {
	const defaults = defaultSettings().generation;
	return Object.keys(defaults).every((key) => NON_PARAMETER_KEYS.has(key) || JSON.stringify(current.generation[key]) === JSON.stringify(defaults[key]));
}
var BEHAVIOUR = [
	["refine_mode", (s) => ({
		get: () => s.modes.refine,
		set: (v) => s.modes.refine = v
	})],
	["multimodal_captioning", (s) => ({
		get: () => s.modes.multimodal,
		set: (v) => s.modes.multimodal = v
	})],
	["free_extend", (s) => ({
		get: () => s.modes.freeExtend,
		set: (v) => s.modes.freeExtend = v
	})],
	["snap", (s) => ({
		get: () => s.modes.snap,
		set: (v) => s.modes.snap = v
	})],
	["minimal_prompt_processing", (s) => ({
		get: () => s.modes.minimalProcessing,
		set: (v) => s.modes.minimalProcessing = v
	})],
	["interactive_mode", (s) => ({
		get: () => s.chat.interactive,
		set: (v) => s.chat.interactive = v
	})],
	["function_tool", (s) => ({
		get: () => s.chat.functionTool,
		set: (v) => s.chat.functionTool = v
	})]
];
var VISIBILITY = [
	["wand_visible", "wand"],
	["command_visible", "command"],
	["interactive_visible", "interactive"],
	["tool_visible", "tool"]
];
function migrateFromBuiltIn(sd, cards, current) {
	const next = structuredClone(current);
	const lines = [];
	if (!isObject(sd)) {
		if (cards.length === 0) return {
			settings: next,
			lines: [{ key: "nothing" }]
		};
	}
	const s = isObject(sd) ? sd : {};
	const defaults = defaultSettings();
	const prefix = str(s.prompt_prefix);
	if (prefix && !isStockPrefix(prefix)) {
		if (!next.prompts.prefix) {
			next.prompts.prefix = prefix;
			lines.push({ key: "prefix-moved" });
		} else lines.push({ key: "prefix-kept" });
	} else if (prefix) lines.push({ key: "prefix-default-skipped" });
	const negative = str(s.negative_prompt);
	if (negative && !same(negative, "lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry")) {
		if (!next.generation.negativePrompt) {
			next.generation.negativePrompt = negative;
			lines.push({ key: "negative-moved" });
		} else lines.push({ key: "negative-kept" });
	} else if (negative) lines.push({ key: "negative-default-skipped" });
	const styles = Array.isArray(s.styles) ? s.styles.filter(isObject) : [];
	let movedStyles = 0;
	for (const style of styles) {
		const item = {
			name: str(style.name),
			prefix: str(style.prefix),
			suffix: "",
			negative: str(style.negative)
		};
		if (!item.name) continue;
		if (item.name === "Default" && isStockPrefix(item.prefix) && same(item.negative, "lowres, bad anatomy, bad hands, text, error, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry") || next.prompts.styles.some((x) => x.name === item.name)) continue;
		next.prompts.styles.push(item);
		movedStyles++;
	}
	if (movedStyles) lines.push({
		key: "styles-moved",
		params: { count: movedStyles }
	});
	const activeStyle = str(s.style);
	if (!next.prompts.activeStyle && next.prompts.styles.some((x) => x.name === activeStyle)) next.prompts.activeStyle = activeStyle;
	const local = /* @__PURE__ */ new Map();
	const positives = isObject(s.character_prompts) ? s.character_prompts : {};
	const negatives = isObject(s.character_negative_prompts) ? s.character_negative_prompts : {};
	for (const key of /* @__PURE__ */ new Set([...Object.keys(positives), ...Object.keys(negatives)])) {
		const value = {
			positive: str(positives[key]),
			negative: str(negatives[key])
		};
		if (value.positive || value.negative) local.set(key, value);
	}
	let movedLocal = 0;
	let keptLocal = 0;
	for (const [key, value] of local) {
		if (next.prompts.characterPrompts[key]) {
			keptLocal++;
			continue;
		}
		next.prompts.characterPrompts[key] = value;
		movedLocal++;
	}
	let movedCards = 0;
	for (const card of cards) {
		const existing = next.prompts.characterPrompts[card.key];
		if (!card.positive && !card.negative || existing) continue;
		next.prompts.characterPrompts[card.key] = {
			positive: card.positive,
			negative: card.negative
		};
		movedCards++;
	}
	if (movedLocal) lines.push({
		key: "character-prompts-moved",
		params: { count: movedLocal }
	});
	if (keptLocal) lines.push({
		key: "character-prompts-kept",
		params: { count: keptLocal }
	});
	if (movedCards) lines.push({
		key: "card-prompts-moved",
		params: { count: movedCards }
	});
	const templates = isObject(s.prompts) ? s.prompts : {};
	let movedTemplates = 0;
	for (const mode of TEMPLATE_MODES) {
		const key = String(mode);
		const value = str(templates[key]);
		if (!value || isStockTemplate(key, value) || next.prompts.templates[key] !== void 0) continue;
		next.prompts.templates[key] = value;
		movedTemplates++;
	}
	if (movedTemplates) lines.push({
		key: "templates-moved",
		params: { count: movedTemplates }
	});
	const moved = [];
	for (const [name, accessor] of BEHAVIOUR) {
		if (typeof s[name] !== "boolean") continue;
		const target = accessor(next);
		if (target.get() === accessor(defaults).get() && target.get() !== s[name]) {
			target.set(s[name]);
			moved.push(name);
		}
	}
	for (const [name, initiator] of VISIBILITY) {
		if (typeof s[name] !== "boolean") continue;
		if (next.chat.visibility[initiator] === defaults.chat.visibility[initiator] && next.chat.visibility[initiator] !== s[name]) {
			next.chat.visibility[initiator] = s[name];
			moved.push(name);
		}
	}
	if (moved.length) lines.push({
		key: "behaviour-moved",
		params: { names: moved.join(", ") }
	});
	if (s.source === "novel") {
		if (generationIsPristine(current)) {
			const g = next.generation;
			const model = str(s.model);
			if (isModelId(model)) g.model = model;
			const sampler = str(s.sampler);
			if (SAMPLERS.includes(sampler)) g.sampler = sampler;
			const schedule = str(s.scheduler);
			if (NOISE_SCHEDULES.includes(schedule)) g.noiseSchedule = schedule;
			const steps = num(s.steps);
			if (steps !== void 0) g.steps = Math.min(50, Math.max(1, Math.round(steps)));
			const scale = num(s.scale);
			if (scale !== void 0) g.scale = Math.min(10, Math.max(0, scale));
			const width = num(s.width);
			const height = num(s.height);
			if (width && height) {
				g.width = Math.max(64, Math.round(width / 64) * 64);
				g.height = Math.max(64, Math.round(height / 64) * 64);
			}
			const seed = num(s.seed);
			if (seed !== void 0) g.seed = seed;
			g.smea = s.novel_sm === true;
			g.smeaDyn = s.novel_sm_dyn === true;
			g.decrisper = s.novel_decrisper === true;
			g.varietyBoost = s.novel_variety_boost === true;
			lines.push({
				key: "generation-moved",
				params: { model: g.model }
			});
		} else lines.push({ key: "generation-kept" });
		if (s.novel_anlas_guard !== true && next.anlas.freeOnly) lines.push({ key: "free-only-kept" });
		const upscale = num(s.hr_scale);
		if (upscale !== void 0 && upscale > 1) lines.push({
			key: "upscale-not-moved",
			params: { ratio: upscale }
		});
	} else if (typeof s.source === "string") lines.push({
		key: "generation-other-source",
		params: { source: s.source }
	});
	if (lines.length === 0) lines.push({ key: "nothing" });
	return {
		settings: next,
		lines
	};
}
//#endregion
//#region src/features/takeover/takeover.ts
/** Internal name of the built-in extension in extension_settings.disabledExtensions. */
var BUILTIN_NAME = "stable-diffusion";
function isBuiltInActive() {
	const disabled = ctx().extensionSettings.disabledExtensions;
	return !(Array.isArray(disabled) && disabled.includes("stable-diffusion"));
}
function builtInSettings() {
	return ctx().extensionSettings.sd;
}
/** Built-in commands, macros, tool and interactive mode are owned by NAI Studio only after takeover. */
function ownsCompatSurface() {
	return !isBuiltInActive();
}
/** Shared per-character prompts of the built-in, read from every card (lazy cards are loaded). */
async function collectCardPrompts() {
	const c = ctx();
	const result = [];
	for (let i = 0; i < c.characters.length; i++) {
		let character = c.characters[i];
		if (!character) continue;
		if (character.shallow) try {
			await c.unshallowCharacter(i);
			character = ctx().characters[i] ?? character;
		} catch (error) {
			log.warn("could not load character card", character.avatar, error);
			continue;
		}
		const shared = character.data?.extensions?.sd_character_prompt;
		if (shared && typeof shared === "object") result.push({
			key: avatarKey(character.avatar),
			positive: typeof shared.positive === "string" ? shared.positive : "",
			negative: typeof shared.negative === "string" ? shared.negative : ""
		});
	}
	return result;
}
function needsMigration() {
	return !settings().takeover.migratedAt && builtInSettings() !== void 0;
}
function describe(lines) {
	return lines.map((line) => t(`naist.migration.${line.key}`, line.params));
}
/** Runs the migration once and stores the localized report. Returns the report lines. */
async function runMigration(now = /* @__PURE__ */ new Date()) {
	const cards = await collectCardPrompts();
	const result = migrateFromBuiltIn(builtInSettings(), cards, settings());
	const report = describe(result.lines);
	result.settings.takeover = {
		migratedAt: now.toISOString(),
		migrationReport: report
	};
	replaceSettings(result.settings);
	log.info("migration from the built-in Image Generation done", report);
	return report;
}
/** Disables the built-in extension; SillyTavern reloads the page. */
async function disableBuiltIn() {
	await ctx().executeSlashCommandsWithOptions(`/extension-disable ${BUILTIN_NAME}`);
}
async function enableBuiltIn() {
	await ctx().executeSlashCommandsWithOptions(`/extension-enable ${BUILTIN_NAME}`);
}
//#endregion
//#region src/ui/components/dom.ts
/** Handlebars template -> sanitized HTML (SillyTavern's own Handlebars and DOMPurify). */
function render$2(template, data = {}) {
	const html = libs().Handlebars.compile(template)(data);
	return libs().DOMPurify.sanitize(html);
}
function $id$1(root, id) {
	const el = root.querySelector(`#${id}`);
	if (!el) throw new Error(`NAI Studio UI: missing #${id}`);
	return el;
}
function fillSelect$1(select, options, current) {
	select.innerHTML = "";
	for (const option of options) {
		const el = document.createElement("option");
		el.value = option.value;
		el.textContent = option.label;
		select.append(el);
	}
	select.value = options.some((o) => o.value === current) ? current : options[0]?.value ?? "";
}
var HTML_ESCAPES = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	"\"": "&quot;",
	"'": "&#39;"
};
/** Safe for text content and attribute values. */
function escapeHtml$2(text) {
	return text.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}
//#endregion
//#region src/ui/gallery.ts
function bytes(n) {
	if (n > 1024 ** 3) return `${(n / 1024 ** 3).toFixed(1)} GB`;
	if (n > 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
	return `${Math.round(n / 1024)} KB`;
}
function options$1(values, current, emptyKey) {
	return [`<option value="">${escapeHtml$2(t(emptyKey))}</option>`, ...values.map((v) => `<option value="${escapeHtml$2(v)}"${v === current ? " selected" : ""}>${escapeHtml$2(v)}</option>`)].join("");
}
async function openGallery(actions) {
	const c = ctx();
	let records = await listRecords();
	const query = emptyQuery();
	const selected = /* @__PURE__ */ new Set();
	const urls = [];
	const root = document.createElement("div");
	root.className = "naist-gallery";
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			const img = entry.target;
			observer.unobserve(img);
			const record = records.find((r) => r.id === img.dataset.id);
			if (!record) continue;
			thumbBlob(record).then((blob) => {
				if (blob) {
					const url = URL.createObjectURL(blob);
					urls.push(url);
					img.src = url;
				} else if (record.filePath) img.src = encodeURI(record.filePath);
			});
		}
	}, { rootMargin: "300px" });
	const toolbar = () => {
		const f = facets(records);
		return `
        <div class="naist-gallery-toolbar">
            <input class="text_pole naist-g-text" type="search" placeholder="${escapeHtml$2(t("naist.gallery.search"))}" value="${escapeHtml$2(query.text)}">
            <select class="text_pole naist-g-model">${options$1(f.models, query.model, "naist.gallery.allModels")}</select>
            <select class="text_pole naist-g-character">${options$1(f.characters, query.character, "naist.gallery.allCharacters")}</select>
            <select class="text_pole naist-g-chat">${options$1(f.chats, query.chatId, "naist.gallery.allChats")}</select>
            <input class="text_pole naist-g-from" type="date" value="${escapeHtml$2(query.from)}" title="${escapeHtml$2(t("naist.gallery.from"))}">
            <input class="text_pole naist-g-to" type="date" value="${escapeHtml$2(query.to)}" title="${escapeHtml$2(t("naist.gallery.to"))}">
            <select class="text_pole naist-g-sort">
                <option value="newest"${query.sort === "newest" ? " selected" : ""}>${escapeHtml$2(t("naist.gallery.newest"))}</option>
                <option value="oldest"${query.sort === "oldest" ? " selected" : ""}>${escapeHtml$2(t("naist.gallery.oldest"))}</option>
            </select>
            <label class="checkbox_label"><input type="checkbox" class="naist-g-fav"${query.favoritesOnly ? " checked" : ""}><span>${escapeHtml$2(t("naist.gallery.favoritesOnly"))}</span></label>
        </div>
        <div class="naist-gallery-actions">
            <span class="naist-muted naist-g-count"></span>
            <div class="menu_button naist-g-all">${escapeHtml$2(t("naist.gallery.selectAll"))}</div>
            <div class="menu_button naist-g-compare">${escapeHtml$2(t("naist.gallery.compare"))}</div>
            <div class="menu_button naist-g-delete">${escapeHtml$2(t("naist.gallery.delete"))}</div>
            <span class="naist-muted naist-g-usage"></span>
        </div>
        <div class="naist-gallery-grid"></div>`;
	};
	const renderGrid = () => {
		const grid = root.querySelector(".naist-gallery-grid");
		if (!grid) return;
		observer.disconnect();
		const list = filterRecords(records, query);
		grid.innerHTML = list.map((r) => `
            <div class="naist-g-card${selected.has(r.id) ? " naist-g-selected" : ""}" data-id="${escapeHtml$2(r.id)}">
                <img data-id="${escapeHtml$2(r.id)}" alt="" loading="lazy">
                <div class="naist-g-card-bar">
                    <input type="checkbox" class="naist-g-check"${selected.has(r.id) ? " checked" : ""}>
                    <i class="fa-solid fa-star naist-g-star${r.favorite ? " naist-g-fav-on" : ""}" title="${escapeHtml$2(t("naist.gallery.favorite"))}"></i>
                    <i class="fa-solid fa-repeat naist-g-repeat" title="${escapeHtml$2(t("naist.gallery.repeat"))}"></i>
                    <span class="naist-muted" title="${escapeHtml$2(r.meta.scenePrompt)}">${escapeHtml$2(String(r.meta.seed))}</span>
                </div>
                <div class="naist-g-card-text" title="${escapeHtml$2(r.meta.scenePrompt)}">${escapeHtml$2(promptTags(r.meta.scenePrompt).slice(0, 6).join(", "))}</div>
            </div>`).join("");
		grid.querySelectorAll("img[data-id]").forEach((img) => observer.observe(img));
		const count = root.querySelector(".naist-g-count");
		if (count) count.textContent = t("naist.gallery.count", {
			shown: list.length,
			total: records.length,
			selected: selected.size
		});
	};
	const renderAll = () => {
		root.innerHTML = toolbar();
		renderGrid();
		storageUsage().then((u) => {
			const el = root.querySelector(".naist-g-usage");
			if (el && u) el.textContent = t("naist.gallery.usage", {
				used: bytes(u.usage),
				quota: bytes(u.quota)
			});
		});
	};
	root.addEventListener("input", (event) => {
		const target = event.target;
		if (target.classList.contains("naist-g-text")) query.text = target.value;
		else if (target.classList.contains("naist-g-from")) query.from = target.value;
		else if (target.classList.contains("naist-g-to")) query.to = target.value;
		else return;
		renderGrid();
	});
	root.addEventListener("change", (event) => {
		const target = event.target;
		if (target.classList.contains("naist-g-model")) query.model = target.value;
		else if (target.classList.contains("naist-g-character")) query.character = target.value;
		else if (target.classList.contains("naist-g-chat")) query.chatId = target.value;
		else if (target.classList.contains("naist-g-sort")) query.sort = target.value === "oldest" ? "oldest" : "newest";
		else if (target.classList.contains("naist-g-fav")) query.favoritesOnly = target.checked;
		else if (target.classList.contains("naist-g-check")) {
			const id = target.closest(".naist-g-card")?.dataset.id ?? "";
			if (target.checked) selected.add(id);
			else selected.delete(id);
			target.closest(".naist-g-card")?.classList.toggle("naist-g-selected", target.checked);
			const count = root.querySelector(".naist-g-count");
			if (count) count.textContent = t("naist.gallery.count", {
				shown: filterRecords(records, query).length,
				total: records.length,
				selected: selected.size
			});
			return;
		} else return;
		renderGrid();
	});
	root.addEventListener("click", (event) => {
		const target = event.target;
		const card = target.closest(".naist-g-card");
		const record = card ? records.find((r) => r.id === card.dataset.id) : void 0;
		if (target.classList.contains("naist-g-star") && record) {
			record.favorite = !record.favorite;
			target.classList.toggle("naist-g-fav-on", record.favorite);
			saveRecord(record);
		} else if (target.classList.contains("naist-g-repeat") && record) actions.repeat(record);
		else if (target.tagName === "IMG" && record) actions.open(record);
		else if (target.classList.contains("naist-g-all")) {
			const list = filterRecords(records, query);
			const all = list.every((r) => selected.has(r.id));
			for (const r of list) if (all) selected.delete(r.id);
			else selected.add(r.id);
			renderGrid();
		} else if (target.classList.contains("naist-g-compare")) {
			const pair = records.filter((r) => selected.has(r.id));
			if (pair.length !== 2) {
				toastr.info(t("naist.gallery.compareHint"));
				return;
			}
			compare(pair[0], pair[1]);
		} else if (target.classList.contains("naist-g-delete")) {
			const list = records.filter((r) => selected.has(r.id));
			if (!list.length) return;
			(async () => {
				const box = document.createElement("div");
				box.innerHTML = `<p>${escapeHtml$2(t("naist.gallery.deleteConfirm", { count: list.length }))}</p>
                    <label class="checkbox_label"><input type="checkbox" class="naist-g-del-files"><span>${escapeHtml$2(t("naist.gallery.deleteFiles"))}</span></label>`;
				if (await c.callGenericPopup(box, c.POPUP_TYPE.CONFIRM) !== c.POPUP_RESULT.AFFIRMATIVE) return;
				const files = box.querySelector(".naist-g-del-files")?.checked === true;
				const removed = await deleteRecords(list, files);
				toastr.success(t("naist.gallery.deleted", {
					count: list.length,
					files: removed
				}));
				for (const r of list) selected.delete(r.id);
				records = await listRecords();
				renderAll();
			})();
		}
	});
	renderAll();
	localize(root);
	await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		allowVerticalScrolling: true
	});
	observer.disconnect();
	for (const url of urls) URL.revokeObjectURL(url);
}
async function compare(a, b) {
	const c = ctx();
	const [blobA, blobB] = await Promise.all([fullBlob(a), fullBlob(b)]);
	const urlA = blobA ? URL.createObjectURL(blobA) : encodeURI(a.filePath);
	const urlB = blobB ? URL.createObjectURL(blobB) : encodeURI(b.filePath);
	const diff = new Set(compareMeta(a.meta, b.meta));
	const keys = [
		"model",
		"seed",
		"width",
		"height",
		"steps",
		"scale",
		"cfgRescale",
		"sampler",
		"noiseSchedule",
		"ucPreset",
		"qualityPreset",
		"prompt",
		"negativePrompt"
	];
	const root = document.createElement("div");
	root.className = "naist-compare";
	root.innerHTML = `
        <div class="naist-compare-images"><img alt="" src="${escapeHtml$2(urlA)}"><img alt="" src="${escapeHtml$2(urlB)}"></div>
        <table class="naist-meta-table">${keys.map((k) => `<tr class="${diff.has(k) ? "naist-compare-diff" : ""}"><th>${escapeHtml$2(String(k))}</th><td>${escapeHtml$2(String(a.meta[k]))}</td><td>${escapeHtml$2(String(b.meta[k]))}</td></tr>`).join("")}</table>`;
	await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		allowVerticalScrolling: true
	});
	if (blobA) URL.revokeObjectURL(urlA);
	if (blobB) URL.revokeObjectURL(urlB);
}
//#endregion
//#region src/ui/inline-dialogs.ts
async function confirmPopup(root, okKey, wide = false) {
	const c = ctx();
	localize(root);
	return await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t(okKey),
		cancelButton: t("naist.inspector.cancel"),
		wide
	}) === c.POPUP_RESULT.AFFIRMATIVE;
}
function value(root, selector) {
	return root.querySelector(selector)?.value ?? "";
}
function checked(root, selector) {
	return root.querySelector(selector)?.checked === true;
}
/** Insert dialog. `selection` pre-fills the prompt (selected text or text near the cursor). */
async function insertDialog(selection) {
	const s = settings().inline;
	const modes = [
		{
			value: "free",
			label: t("naist.inline.modeFree")
		},
		{
			value: "text",
			label: t("naist.inline.modeText")
		},
		...WAND_MODES.map((m) => ({
			value: String(m),
			label: t(`naist.mode.${m}`)
		}))
	];
	const root = document.createElement("div");
	root.className = "naist-dialog";
	root.innerHTML = `
        <h3 data-i18n="naist.inline.insertTitle"></h3>
        <label for="naist_ins_mode" data-i18n="naist.inline.mode"></label>
        <select id="naist_ins_mode" class="text_pole">${modes.map((m) => `<option value="${escapeHtml$2(m.value)}"${m.value === s.insertMode ? " selected" : ""}>${escapeHtml$2(m.label)}</option>`).join("")}</select>
        <label for="naist_ins_prompt" data-i18n="naist.inline.prompt"></label>
        <textarea id="naist_ins_prompt" class="text_pole" rows="4">${escapeHtml$2(selection)}</textarea>
        <div class="naist-hint" data-i18n="naist.inline.promptHint"></div>
        <div class="naist-grid3">
            <div><label data-i18n="naist.inline.width"></label><input id="naist_ins_width" type="number" min="5" class="text_pole" value="${s.defaultWidth}"></div>
            <div><label data-i18n="naist.inline.unit"></label><select id="naist_ins_unit" class="text_pole"><option value="%">%</option><option value="px">px</option></select></div>
            <div><label data-i18n="naist.inline.align"></label><select id="naist_ins_align" class="text_pole">
                <option value="center" data-i18n="naist.inline.alignCenter"></option>
                <option value="left" data-i18n="naist.inline.alignLeft"></option>
                <option value="right" data-i18n="naist.inline.alignRight"></option></select></div>
        </div>`;
	root.querySelector("#naist_ins_unit").value = s.defaultWidthUnit;
	root.querySelector("#naist_ins_align").value = s.defaultAlign;
	if (!await confirmPopup(root, "naist.inline.insertOk", true)) return null;
	const mode = value(root, "#naist_ins_mode");
	const prompt = value(root, "#naist_ins_prompt").trim();
	s.insertMode = mode;
	ctx().saveSettingsDebounced();
	const display = {
		width: Number(value(root, "#naist_ins_width")) || s.defaultWidth,
		widthUnit: value(root, "#naist_ins_unit") === "px" ? "px" : "%",
		align: value(root, "#naist_ins_align") || "center"
	};
	if (mode === "free") return prompt ? {
		trigger: prompt,
		mode: MODE.FREE,
		display
	} : null;
	if (mode === "text") return prompt ? {
		trigger: prompt,
		mode: MODE.FREE_EXTENDED,
		display
	} : null;
	const id = Number(mode);
	return {
		trigger: TRIGGER_WORDS[id] ?? prompt,
		mode: id,
		display
	};
}
/** "Redo with an edited prompt": every parameter pre-filled from the current image. */
async function editDialog(meta) {
	const root = document.createElement("div");
	root.className = "naist-dialog";
	root.innerHTML = `
        <h3 data-i18n="naist.inline.editTitle"></h3>
        <label data-i18n="naist.inline.prompt"></label>
        <textarea id="naist_ed_scene" class="text_pole" rows="5">${escapeHtml$2(meta.scenePrompt)}</textarea>
        <label data-i18n="naist.refine.negative"></label>
        <textarea id="naist_ed_negative" class="text_pole" rows="2">${escapeHtml$2(meta.negative)}</textarea>
        <label data-i18n="naist.panel.model"></label>
        <select id="naist_ed_model" class="text_pole">${MODELS.map((m) => `<option value="${escapeHtml$2(m.id)}"${m.id === meta.model ? " selected" : ""}>${escapeHtml$2(t(m.nameKey))}</option>`).join("")}</select>
        <div class="naist-grid3">
            <div><label data-i18n="naist.meta.seed"></label><input id="naist_ed_seed" type="number" class="text_pole" value="${meta.seed}"></div>
            <div><label data-i18n="naist.panel.width"></label><input id="naist_ed_width" type="number" step="64" min="64" class="text_pole" value="${meta.width}"></div>
            <div><label data-i18n="naist.panel.height"></label><input id="naist_ed_height" type="number" step="64" min="64" class="text_pole" value="${meta.height}"></div>
            <div><label data-i18n="naist.panel.steps"></label><input id="naist_ed_steps" type="number" min="1" max="50" class="text_pole" value="${meta.steps}"></div>
            <div><label data-i18n="naist.panel.scale"></label><input id="naist_ed_scale" type="number" step="0.1" min="0" max="10" class="text_pole" value="${meta.scale}"></div>
            <div><label class="checkbox_label"><input id="naist_ed_random" type="checkbox"><span data-i18n="naist.inline.randomSeed"></span></label></div>
        </div>`;
	if (!await confirmPopup(root, "naist.inline.editOk", true)) return null;
	const scene = value(root, "#naist_ed_scene").trim();
	if (!scene) return null;
	const num = (selector, fallback) => {
		const n = Number(value(root, selector));
		return Number.isFinite(n) ? n : fallback;
	};
	return {
		scene,
		negative: value(root, "#naist_ed_negative").trim(),
		model: value(root, "#naist_ed_model") || meta.model,
		seed: checked(root, "#naist_ed_random") ? -1 : num("#naist_ed_seed", meta.seed),
		width: num("#naist_ed_width", meta.width),
		height: num("#naist_ed_height", meta.height),
		steps: num("#naist_ed_steps", meta.steps),
		scale: num("#naist_ed_scale", meta.scale)
	};
}
async function displayDialog(display) {
	const root = document.createElement("div");
	root.className = "naist-dialog";
	root.innerHTML = `
        <h3 data-i18n="naist.inline.displayTitle"></h3>
        <div class="naist-grid3">
            <div><label data-i18n="naist.inline.width"></label><input id="naist_dp_width" type="number" min="5" class="text_pole" value="${display.width}"></div>
            <div><label data-i18n="naist.inline.unit"></label><select id="naist_dp_unit" class="text_pole"><option value="%">%</option><option value="px">px</option></select></div>
            <div><label data-i18n="naist.inline.align"></label><select id="naist_dp_align" class="text_pole">
                <option value="center" data-i18n="naist.inline.alignCenter"></option>
                <option value="left" data-i18n="naist.inline.alignLeft"></option>
                <option value="right" data-i18n="naist.inline.alignRight"></option></select></div>
            <div><label data-i18n="naist.inline.radius"></label><input id="naist_dp_radius" type="number" min="0" class="text_pole" value="${display.radius}"></div>
            <div><label data-i18n="naist.inline.layout"></label><select id="naist_dp_layout" class="text_pole">
                <option value="grid" data-i18n="naist.inline.layoutGrid"></option>
                <option value="carousel" data-i18n="naist.inline.layoutCarousel"></option>
                <option value="list" data-i18n="naist.inline.layoutList"></option></select></div>
        </div>
        <div class="naist-flags">
            <label class="checkbox_label"><input id="naist_dp_wrap" type="checkbox"${display.wrap ? " checked" : ""}><span data-i18n="naist.inline.wrap"></span></label>
            <label class="checkbox_label"><input id="naist_dp_border" type="checkbox"${display.border ? " checked" : ""}><span data-i18n="naist.inline.border"></span></label>
            <label class="checkbox_label"><input id="naist_dp_spoiler" type="checkbox"${display.spoiler ? " checked" : ""}><span data-i18n="naist.inline.spoilerOption"></span></label>
        </div>
        <label data-i18n="naist.inline.caption"></label>
        <input id="naist_dp_caption" class="text_pole" value="${escapeHtml$2(display.caption)}">
        <label data-i18n="naist.inline.altText"></label>
        <input id="naist_dp_alt" class="text_pole" value="${escapeHtml$2(display.alt)}">`;
	root.querySelector("#naist_dp_unit").value = display.widthUnit;
	root.querySelector("#naist_dp_align").value = display.align;
	root.querySelector("#naist_dp_layout").value = display.layout;
	if (!await confirmPopup(root, "naist.inline.displayOk")) return null;
	return {
		width: Number(value(root, "#naist_dp_width")) || display.width,
		widthUnit: value(root, "#naist_dp_unit") === "px" ? "px" : "%",
		align: value(root, "#naist_dp_align") || "center",
		radius: Math.max(0, Number(value(root, "#naist_dp_radius")) || 0),
		layout: value(root, "#naist_dp_layout") || "grid",
		wrap: checked(root, "#naist_dp_wrap"),
		border: checked(root, "#naist_dp_border"),
		spoiler: checked(root, "#naist_dp_spoiler"),
		caption: value(root, "#naist_dp_caption").trim(),
		alt: value(root, "#naist_dp_alt").trim()
	};
}
async function confirmDelete() {
	const c = ctx();
	return await c.callGenericPopup(t("naist.inline.deleteConfirm"), c.POPUP_TYPE.CONFIRM) === c.POPUP_RESULT.AFFIRMATIVE;
}
//#endregion
//#region src/ui/lightbox.ts
var actions = [];
function registerLightboxAction(action) {
	const index = actions.findIndex((a) => a.id === action.id);
	if (index >= 0) actions.splice(index, 1, action);
	else actions.push(action);
}
async function copy(text, doneKey) {
	try {
		await navigator.clipboard.writeText(text);
		toastr.success(t(doneKey));
	} catch {
		toastr.error(t("naist.lightbox.copyFailed"));
	}
}
async function setBackground(item) {
	const c = ctx();
	const path = await item.ensureFile();
	await c.eventSource.emit(c.eventTypes.FORCE_SET_BACKGROUND ?? "force_set_background", {
		url: `url("${encodeURI(path)}")`,
		path
	});
	toastr.success(t("naist.lightbox.backgroundDone"));
}
/** Same flow as SillyTavern's own avatar upload (multipart `avatar` + `avatar_url`, cache bust). */
async function setAvatar(item) {
	const c = ctx();
	if (c.groupId || c.characterId === void 0) {
		toastr.warning(t("naist.lightbox.avatarNoCharacter"));
		return;
	}
	const character = c.characters[Number(c.characterId)];
	if (!character) return;
	if (await c.callGenericPopup(t("naist.lightbox.avatarConfirm", { name: character.name }), c.POPUP_TYPE.CONFIRM) !== c.POPUP_RESULT.AFFIRMATIVE) return;
	const form = new FormData();
	form.append("avatar", await exportImage(await item.blob(), item.meta, {
		strip: true,
		format: "png"
	}), "avatar.png");
	form.append("avatar_url", character.avatar);
	const response = await fetch("/api/characters/edit-avatar", {
		method: "POST",
		headers: requestHeaders(true),
		body: form
	});
	if (!response.ok) throw new Error(`avatar upload failed: HTTP ${response.status}`);
	const thumbnailUrl = c.getThumbnailUrl("avatar", character.avatar);
	await fetch(thumbnailUrl, { cache: "reload" }).catch(() => null);
	await fetch(`/characters/${encodeURIComponent(character.avatar)}`, { cache: "reload" }).catch(() => null);
	document.querySelectorAll(`img[src^="${thumbnailUrl}"]`).forEach((img) => {
		const src = img.src;
		img.src = "";
		img.src = src;
	});
	toastr.success(t("naist.lightbox.avatarDone", { name: character.name }));
}
async function saveToDisk(item) {
	downloadBlob(await exportImage(await item.blob(), item.meta, {
		strip: settings().png.stripMetadata,
		format: "png"
	}), `nai-${item.meta.seed}.png`);
}
function metaRows(meta) {
	const rows = [
		["naist.meta.scenePrompt", meta.scenePrompt],
		["naist.meta.prompt", meta.prompt],
		["naist.meta.negative", meta.negativePrompt],
		["naist.meta.sourcePrompt", meta.sourcePrompt ?? ""],
		["naist.meta.model", meta.model],
		["naist.meta.seed", String(meta.seed)],
		["naist.meta.size", `${meta.width}×${meta.height}`],
		["naist.meta.steps", String(meta.steps)],
		["naist.meta.scale", String(meta.scale)],
		["naist.meta.cfgRescale", String(meta.cfgRescale)],
		["naist.meta.sampler", `${meta.sampler} / ${meta.noiseSchedule}`],
		["naist.meta.presets", `${meta.qualityPreset} / ${meta.ucPreset}`],
		["naist.meta.requestType", meta.tool ? `${meta.requestType} (${meta.tool})` : meta.requestType],
		["naist.meta.cost", String(meta.cost)],
		["naist.meta.created", meta.createdAt ? new Date(meta.createdAt).toLocaleString() : ""]
	];
	const characters = meta.characters.map((c, i) => `<div class="naist-meta-char"><b>${i + 1}.</b> ${escapeHtml$2(c.prompt)}${c.negative ? ` <i>(− ${escapeHtml$2(c.negative)})</i>` : ""} <span class="naist-muted">[${c.x}, ${c.y}]</span></div>`).join("");
	return rows.filter(([, v]) => v !== "").map(([k, v]) => `<tr><th>${escapeHtml$2(t(k))}</th><td>${escapeHtml$2(v)}</td></tr>`).join("") + (characters ? `<tr><th>${escapeHtml$2(t("naist.meta.characters"))}</th><td>${characters}</td></tr>` : "");
}
async function openLightbox(item) {
	const c = ctx();
	const root = document.createElement("div");
	root.className = "naist-lightbox";
	const list = [...[
		{
			id: "copy-prompt",
			icon: "fa-copy",
			labelKey: "naist.lightbox.copyPrompt",
			available: () => true,
			run: (i) => copy(i.meta.prompt, "naist.lightbox.copied")
		},
		{
			id: "copy-seed",
			icon: "fa-seedling",
			labelKey: "naist.lightbox.copySeed",
			available: () => true,
			run: (i) => copy(String(i.meta.seed), "naist.lightbox.copied")
		},
		{
			id: "background",
			icon: "fa-panorama",
			labelKey: "naist.lightbox.background",
			available: () => Boolean(ctx().getCurrentChatId()),
			run: (i) => setBackground(i)
		},
		{
			id: "avatar",
			icon: "fa-user-pen",
			labelKey: "naist.lightbox.avatar",
			available: () => !ctx().groupId && ctx().characterId !== void 0,
			run: (i) => setAvatar(i)
		},
		{
			id: "save",
			icon: "fa-download",
			labelKey: "naist.lightbox.save",
			available: () => true,
			run: (i) => saveToDisk(i)
		}
	], ...actions].filter((a) => {
		try {
			return a.available(item);
		} catch {
			return false;
		}
	});
	root.innerHTML = `
        <div class="naist-lightbox-image"><img alt="" src="${escapeHtml$2(item.url)}"></div>
        <div class="naist-lightbox-side">
            ${item.position ? `<div class="naist-muted">${escapeHtml$2(item.position)}</div>` : ""}
            <div class="naist-lightbox-actions">${list.map((a) => `<div class="menu_button" data-naist-lb="${escapeHtml$2(a.id)}" title="${escapeHtml$2(t(a.labelKey))}"><i class="fa-solid ${escapeHtml$2(a.icon)}"></i> ${escapeHtml$2(t(a.labelKey))}</div>`).join("")}</div>
            <table class="naist-meta-table">${metaRows(item.meta)}</table>
        </div>`;
	const popup = new c.Popup(root, c.POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		allowVerticalScrolling: true,
		okButton: t("naist.lightbox.close")
	});
	const close = () => {
		popup.completeCancelled();
	};
	root.addEventListener("click", (event) => {
		const button = event.target.closest("[data-naist-lb]");
		const action = list.find((a) => a.id === button?.dataset.naistLb);
		if (!action || !button) return;
		button.classList.add("disabled");
		Promise.resolve().then(() => action.run(item, close)).catch((error) => {
			log.warn("lightbox action failed", action.id, error);
			reportGenerationError(error);
		}).finally(() => button.classList.remove("disabled"));
	});
	await popup.show();
}
//#endregion
//#region src/integration/inline-render.ts
var IMG_ATTR = "data-naist-img";
/** Transparent pixel used by placeholder and streaming <img> tags; the fragment carries the id. */
var PIXEL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
var WIDGET_SRC_MARK = "#naist:";
var MOUNTED_ATTR = "data-naist-mounted";
var DRAG_TYPE = "application/x-naist-inline";
function messageIdOf$1(element) {
	const mes = element.closest(".mes");
	const id = Number(mes?.getAttribute("mesid"));
	return Number.isInteger(id) ? id : null;
}
function el(tag, className = "", attrs = {}) {
	const node = document.createElement(tag);
	if (className) node.className = className;
	for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
	return node;
}
function icon(action, classes, titleKey) {
	const node = el("i", `fa-solid ${classes} naist-inline-btn`, { "data-naist-action": action });
	node.title = t(titleKey);
	return node;
}
var InlineRenderer = class {
	service;
	ui;
	urls = /* @__PURE__ */ new Map();
	pending = /* @__PURE__ */ new Set();
	scheduled = false;
	intersection = null;
	busy = /* @__PURE__ */ new Set();
	/** Images waiting for their source; checked on scroll as well (IO needs a painting page). */
	waiting = /* @__PURE__ */ new Set();
	lazyTimer = null;
	markers = null;
	constructor(service, ui) {
		this.service = service;
		this.ui = ui;
	}
	install() {
		ctx().messageFormatter.addHook((mes) => mes.includes("[nai:img:") ? mes.replace(new RegExp(PLACEHOLDER_PATTERN.source, "g"), (_m, id) => `<span ${IMG_ATTR}="${id}"></span>`) : mes, { stage: "afterMarkdown" });
		const chat = document.getElementById("chat");
		if (!chat) {
			log.warn("chat element not found: inline images will not render");
			return;
		}
		this.intersection = new IntersectionObserver((entries) => this.onVisible(entries), {
			root: null,
			rootMargin: "800px 0px"
		});
		new MutationObserver((records) => {
			for (const record of records) {
				const target = record.target instanceof Element ? record.target : record.target.parentElement;
				if (!target || target.closest(`[${MOUNTED_ATTR}]`)) continue;
				const mes = target.closest(".mes");
				if (mes) this.pending.add(mes);
				for (const node of record.addedNodes) if (node instanceof Element && node.classList.contains("mes")) this.pending.add(node);
				else if (node instanceof Element) node.querySelectorAll(".mes").forEach((m) => this.pending.add(m));
			}
			if (this.pending.size) this.schedule();
		}).observe(chat, {
			childList: true,
			subtree: true,
			characterData: true
		});
		chat.addEventListener("scroll", () => this.scheduleLazyCheck(), { passive: true });
		window.addEventListener("resize", () => this.scheduleLazyCheck(), { passive: true });
		setInterval(() => this.scheduleLazyCheck(), 750);
		chat.addEventListener("click", (event) => void this.onClick(event));
		chat.addEventListener("dragstart", (event) => this.onDragStart(event));
		chat.addEventListener("dragover", (event) => this.onDragOver(event));
		chat.addEventListener("drop", (event) => void this.onDrop(event));
		chat.addEventListener("dragend", () => this.clearDropMarks());
		chat.addEventListener("error", (event) => {
			if (event.target instanceof HTMLImageElement) this.recover(event.target);
		}, true);
		this.service.onChange((messageId) => this.refreshMessage(messageId));
		this.applyVisibility();
		this.renderAll();
	}
	setMarkerHooks(hooks) {
		this.markers = hooks;
	}
	/** Re-renders the message that shows an image (its generation started or ended). */
	refreshImage(imageId) {
		const span = document.querySelector(`#chat [${IMG_ATTR}="${imageId}"], #chat img[src$="${WIDGET_SRC_MARK}${imageId}"]`);
		const id = span ? messageIdOf$1(span) : null;
		if (id !== null) this.refreshMessage(id);
	}
	/** Re-renders every message (chat change, settings change). */
	renderAll() {
		document.querySelectorAll("#chat .mes").forEach((m) => this.pending.add(m));
		this.schedule();
	}
	/**
	* Drops cached object URLs no picture on the page shows (new chat). SillyTavern renders the chat
	* before CHAT_CHANGED, so the pictures of the new chat may already use some of them.
	*/
	reset() {
		const used = new Set([...document.querySelectorAll("img[src^=\"blob:\"]")].map((img) => img.getAttribute("src")));
		for (const [key, url] of [...this.urls]) {
			if (used.has(url)) continue;
			URL.revokeObjectURL(url);
			this.urls.delete(key);
		}
	}
	/**
	* A picture whose source stopped working (a copy another extension made of a message after its
	* object URL was revoked) gets a fresh one, once; a second failure marks it missing.
	*/
	recover(img) {
		const key = img.dataset.naistKey ?? "";
		const path = img.dataset.naistPath ?? "";
		if (!key && !path) return;
		if (img.dataset.naistRecovered) {
			img.closest(".naist-inline")?.classList.add("naist-inline-missing");
			return;
		}
		img.dataset.naistRecovered = "1";
		img.addEventListener("load", () => delete img.dataset.naistRecovered, { once: true });
		const failed = img.getAttribute("src") ?? "";
		if (key && this.urls.get(key) === failed) this.urls.delete(key);
		this.resolveUrl(key, path).then((url) => {
			const next = url && url !== failed ? url : path ? encodeURI(path) : "";
			if (next && next !== failed) img.src = next;
			else img.closest(".naist-inline")?.classList.add("naist-inline-missing");
		});
	}
	refreshMessage(messageId) {
		const mes = document.querySelector(`#chat .mes[mesid="${messageId}"]`);
		if (!mes) return;
		mes.querySelectorAll(`[${IMG_ATTR}][${MOUNTED_ATTR}]`).forEach((span) => {
			span.removeAttribute(MOUNTED_ATTR);
			span.replaceChildren();
		});
		this.pending.add(mes);
		this.schedule();
	}
	/** Body classes for "hide all images in this chat" and the global reading mode. */
	applyVisibility() {
		const meta = ctx().chatMetadata?.nai_studio;
		document.body.classList.toggle("naist-inline-collapsed", meta?.inlineHidden === true);
		document.body.classList.toggle("naist-inline-reading", settings().inline.readingMode);
	}
	schedule() {
		if (this.scheduled) return;
		this.scheduled = true;
		setTimeout(() => {
			this.scheduled = false;
			const list = [...this.pending];
			this.pending.clear();
			for (const mes of list) try {
				this.processMessage(mes);
			} catch (error) {
				log.warn("inline render failed", error);
			}
			this.scheduleLazyCheck();
		}, 0);
	}
	scheduleLazyCheck() {
		if (this.lazyTimer || !this.waiting.size) return;
		this.lazyTimer = setTimeout(() => {
			this.lazyTimer = null;
			this.lazyCheck();
		}, 120);
	}
	/** Loads images within 800 px of the viewport; the rest stay without a source. */
	lazyCheck() {
		const margin = 800;
		const height = window.innerHeight;
		for (const img of [...this.waiting]) {
			if (!img.isConnected) {
				this.waiting.delete(img);
				continue;
			}
			const rect = img.getBoundingClientRect();
			if (rect.bottom >= -800 && rect.top <= height + margin && rect.width > 0) this.load(img);
		}
	}
	load(img) {
		if (!this.waiting.delete(img)) return;
		this.intersection?.unobserve(img);
		this.resolveUrl(img.dataset.naistKey ?? "", img.dataset.naistPath ?? "").then((url) => {
			if (url) img.src = url;
			else img.closest(".naist-inline")?.classList.add("naist-inline-missing");
		});
	}
	processMessage(mes) {
		const text = mes.querySelector(".mes_text");
		if (!text) return;
		const messageId = messageIdOf$1(mes);
		if (messageId === null) return;
		if (text.textContent?.includes("[nai:img:")) this.replaceTextPlaceholders(text);
		text.querySelectorAll(`img[${IMG_ATTR}]`).forEach((img) => {
			const container = img.parentElement?.closest("div, td, section, article, figure");
			if (container && container !== text && text.contains(container)) img.removeAttribute(IMG_ATTR);
			else img.replaceWith(el("span", "", { [IMG_ATTR]: img.getAttribute("data-naist-img") ?? "" }));
		});
		text.querySelectorAll("img.naist-inline-img:not([src])").forEach((img) => {
			if ((img.dataset.naistKey || img.dataset.naistPath) && !this.waiting.has(img)) {
				this.waiting.add(img);
				this.intersection?.observe(img);
			}
		});
		const widgetImages = [...text.querySelectorAll(`img[src*="${WIDGET_SRC_MARK}"]`)];
		const spans = [...text.querySelectorAll(`[${IMG_ATTR}]:not([${MOUNTED_ATTR}])`)];
		if (!spans.length && !widgetImages.length) return;
		const entries = this.service.entries(messageId);
		for (const img of widgetImages) this.fillWidgetImage(img, entries);
		for (const span of spans) this.mount(span, messageId, entries);
		this.groupRuns(text, entries);
	}
	/** System messages skip the formatter hook: replace placeholders in their text nodes. */
	replaceTextPlaceholders(root) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		const nodes = [];
		while (walker.nextNode()) {
			const node = walker.currentNode;
			if (node.data.includes("[nai:img:") && !node.parentElement?.closest(`[${MOUNTED_ATTR}]`)) nodes.push(node);
		}
		for (const node of nodes) {
			const parts = node.data.split(new RegExp(PLACEHOLDER_PATTERN.source, "g"));
			const fragment = document.createDocumentFragment();
			parts.forEach((part, i) => {
				if (i % 2 === 0) {
					if (part) fragment.append(part);
				} else fragment.append(el("span", "", { [IMG_ATTR]: part }));
			});
			node.replaceWith(fragment);
		}
	}
	/** An <img> a widget regex rebuilt around a placeholder: only its source is set. */
	fillWidgetImage(img, entries) {
		const src = img.getAttribute("src") ?? "";
		const id = src.slice(src.indexOf(WIDGET_SRC_MARK) + 7);
		const entry = entries.find((e) => e.id === id);
		const active = entry ? activeSwipe(entry) : void 0;
		img.classList.add("naist-widget-img");
		if (!active) {
			const failed = entry?.marker !== void 0 && !(this.markers?.isRunning(id) ?? false);
			img.classList.toggle("naist-marker-wait", !failed);
			img.classList.toggle("naist-marker-failed", failed);
			if (failed) {
				img.dataset.naistRetry = id;
				img.title = entry?.marker?.error || t("naist.markers.retryHint");
			} else delete img.dataset.naistRetry;
			return;
		}
		img.classList.remove("naist-marker-wait", "naist-marker-failed");
		delete img.dataset.naistRetry;
		img.dataset.naistKey = active.blobKey;
		img.dataset.naistPath = active.filePath;
		this.waiting.add(img);
		this.intersection?.observe(img);
	}
	/** A marker image that does not exist yet: generating, interrupted or failed. */
	mountMarker(span, entry) {
		const marker = entry.marker;
		const d = entry.display;
		const running = this.markers?.isRunning(entry.id) ?? false;
		const state = marker.status === "error" ? "error" : running ? "pending" : "interrupted";
		span.className = `naist-inline naist-inline-marker naist-inline-marker-${state}`;
		span.removeAttribute("style");
		for (const [key, value] of Object.entries(displayStyle(d))) span.style.setProperty(key, value);
		const box = el("span", "naist-marker-box");
		const size = markerDimensions(marker.params.ratio, marker.params.size, true);
		box.style.aspectRatio = `${size.width} / ${size.height}`;
		const status = el("span", "naist-marker-status");
		if (state === "pending") {
			const waiting = this.markers?.isWaiting?.(entry.id) ?? false;
			const queued = this.markers?.queueStatus?.(entry.id);
			const text = waiting ? t("naist.markers.qualityWaiting") : queued?.state === "queued" ? t("naist.queue.waiting", { count: queued.ahead }) : queued?.state === "retry" ? t("naist.queue.retryIn", { seconds: queued.seconds }) : t("naist.markers.generating");
			status.append(el("i", "fa-solid fa-spinner fa-spin"), document.createTextNode(` ${text}`));
		} else status.append(el("i", `fa-solid ${state === "error" ? "fa-triangle-exclamation" : "fa-circle-pause"}`), document.createTextNode(` ${state === "error" ? t("naist.markers.failed") : t("naist.markers.interrupted")}`));
		box.append(status);
		if (marker.error) {
			const reason = el("span", "naist-marker-reason");
			reason.textContent = marker.error;
			box.append(reason);
		}
		const prompt = el("span", "naist-marker-prompt");
		const text = marker.params.prompt;
		prompt.textContent = text.length > 160 ? `${text.slice(0, 160)}...` : text;
		box.append(prompt);
		if (state !== "pending") {
			const actions = el("span", "naist-marker-actions");
			const retry = el("span", "menu_button naist-marker-retry", { "data-naist-action": "marker-retry" });
			retry.append(el("i", "fa-solid fa-rotate"), document.createTextNode(` ${t("naist.markers.retry")}`));
			actions.append(retry, icon("delete", "fa-trash-can", "naist.inline.delete"));
			box.append(actions);
		}
		span.append(box);
		if (d.caption) {
			const caption = el("span", "naist-inline-caption");
			caption.textContent = d.caption;
			span.append(caption);
		}
	}
	mount(span, messageId, entries) {
		const id = span.getAttribute("data-naist-img") ?? "";
		span.setAttribute(MOUNTED_ATTR, "1");
		span.replaceChildren();
		const entry = entries.find((e) => e.id === id);
		if (!entry) {
			span.className = "naist-inline naist-inline-missing";
			span.textContent = t("naist.inline.missing");
			return;
		}
		const swipe = activeSwipe(entry);
		if (!swipe && entry.marker) {
			this.mountMarker(span, entry);
			return;
		}
		const d = entry.display;
		span.className = "naist-inline";
		span.removeAttribute("style");
		for (const [key, value] of Object.entries(displayStyle(d))) span.style.setProperty(key, value);
		span.classList.toggle("naist-inline-busy", this.busy.has(id));
		const frame = el("span", "naist-inline-frame", { draggable: "true" });
		frame.style.borderRadius = `${Math.max(0, d.radius)}px`;
		frame.classList.toggle("naist-inline-border", d.border);
		frame.classList.toggle("naist-inline-spoiler", d.spoiler);
		const img = el("img", "naist-inline-img", {
			alt: d.alt || d.caption || t("naist.inline.alt"),
			decoding: "async"
		});
		if (swipe) {
			img.dataset.naistKey = swipe.blobKey;
			img.dataset.naistPath = swipe.filePath;
			const ratio = swipe.meta.width && swipe.meta.height ? `${swipe.meta.width} / ${swipe.meta.height}` : "";
			if (ratio) img.style.aspectRatio = ratio;
		}
		frame.append(img);
		if (d.spoiler) {
			const cover = el("span", "naist-inline-cover", { "data-naist-action": "reveal" });
			cover.append(el("i", "fa-solid fa-eye-slash"), document.createTextNode(` ${t("naist.inline.spoiler")}`));
			frame.append(cover);
		}
		const toolbar = el("span", "naist-inline-toolbar");
		if (entry.swipes.length > 1) {
			toolbar.append(icon("prev", "fa-chevron-left", "naist.inline.prev"));
			const counter = el("span", "naist-inline-counter");
			counter.textContent = `${entry.activeSwipe + 1}/${entry.swipes.length}`;
			toolbar.append(counter, icon("next", "fa-chevron-right", "naist.inline.next"));
		}
		toolbar.append(icon("regenerate", "fa-rotate", "naist.inline.regenerate"), icon("variation", "fa-shuffle", "naist.inline.variation"), icon("edit", "fa-pen-to-square", "naist.inline.edit"), icon("display", "fa-sliders", "naist.inline.display"), icon("tools", "fa-wand-magic-sparkles", "naist.tools.title"), icon("lightbox", "fa-expand", "naist.inline.lightbox"), icon("delete", "fa-trash-can", "naist.inline.delete"));
		frame.append(toolbar);
		const spinner = el("span", "naist-inline-spinner");
		spinner.append(el("i", "fa-solid fa-spinner fa-spin"));
		frame.append(spinner);
		span.append(frame);
		if (d.caption) {
			const caption = el("span", "naist-inline-caption");
			caption.textContent = d.caption;
			span.append(caption);
		}
		const chip = el("span", "naist-inline-chip", { "data-naist-action": "show-chat" });
		chip.append(el("i", "fa-solid fa-image"), document.createTextNode(` ${t("naist.inline.hiddenChip")}`));
		span.append(chip);
		this.waiting.add(img);
		this.intersection?.observe(img);
	}
	/** Wraps consecutive images (only whitespace or <br> between) into one grid/carousel/list. */
	groupRuns(text, entries) {
		const spans = [...text.querySelectorAll(`[${IMG_ATTR}][${MOUNTED_ATTR}]`)].filter((s) => !s.parentElement?.classList.contains("naist-inline-group"));
		const isGap = (node) => node !== null && (node.nodeType === Node.TEXT_NODE && !(node.textContent ?? "").trim() || node instanceof HTMLElement && node.tagName === "BR");
		const runs = [];
		for (const span of spans) {
			let prev = span.previousSibling;
			while (isGap(prev)) prev = prev?.previousSibling ?? null;
			const last = runs.at(-1);
			if (last && prev === last.at(-1)) last.push(span);
			else runs.push([span]);
		}
		for (const run of runs) {
			if (run.length < 2) continue;
			const first = run[0];
			if (!first) continue;
			const group = el("span", "naist-inline-group", { "data-layout": entries.find((e) => e.id === first.getAttribute("data-naist-img"))?.display.layout ?? "grid" });
			first.before(group);
			let node = first;
			const end = run.at(-1);
			while (node) {
				const next = node === end ? null : node.nextSibling;
				if (node instanceof HTMLElement && node.hasAttribute("data-naist-img")) {
					node.style.removeProperty("width");
					node.style.removeProperty("float");
					group.append(node);
				} else node.remove();
				node = next;
			}
		}
	}
	async resolveUrl(key, path) {
		if (key) {
			const cached = this.urls.get(key);
			if (cached) return cached;
			const blob = await getBlob(key);
			if (blob) {
				const url = URL.createObjectURL(blob);
				this.urls.set(key, url);
				return url;
			}
		}
		return path ? encodeURI(path) : "";
	}
	onVisible(entries) {
		for (const entry of entries) if (entry.isIntersecting) this.load(entry.target);
	}
	async run(messageId, imageId, task) {
		if (this.busy.has(imageId)) return;
		this.busy.add(imageId);
		document.querySelectorAll(`[${IMG_ATTR}="${imageId}"]`).forEach((s) => s.classList.add("naist-inline-busy"));
		try {
			await task();
		} catch (error) {
			reportGenerationError(error);
		} finally {
			this.busy.delete(imageId);
			this.refreshMessage(messageId);
		}
	}
	async onClick(event) {
		const target = event.target;
		const retryImage = target.closest("img[data-naist-retry]");
		if (retryImage) {
			event.preventDefault();
			event.stopPropagation();
			const messageId = messageIdOf$1(retryImage);
			if (messageId !== null) await this.markers?.retry(messageId, retryImage.dataset.naistRetry ?? "");
			return;
		}
		const span = target.closest(`[${IMG_ATTR}][${MOUNTED_ATTR}]`);
		if (!span) return;
		const messageId = messageIdOf$1(span);
		const imageId = span.getAttribute("data-naist-img") ?? "";
		if (messageId === null || !imageId) return;
		const action = target.closest("[data-naist-action]")?.dataset.naistAction ?? (target.classList.contains("naist-inline-img") ? "lightbox" : "");
		if (!action) return;
		event.preventDefault();
		event.stopPropagation();
		const entry = this.service.entries(messageId).find((e) => e.id === imageId);
		switch (action) {
			case "reveal":
				span.querySelector(".naist-inline-frame")?.classList.remove("naist-inline-spoiler");
				target.closest(".naist-inline-cover")?.remove();
				return;
			case "show-chat":
				await this.setChatHidden(false);
				return;
			case "marker-retry":
				await this.markers?.retry(messageId, imageId);
				return;
			case "prev":
			case "next":
				if (entry) await this.service.setActive(messageId, imageId, entry.activeSwipe + (action === "next" ? 1 : -1));
				return;
			case "regenerate": return await this.run(messageId, imageId, () => this.service.regenerate(messageId, imageId));
			case "variation": return await this.run(messageId, imageId, () => this.service.variation(messageId, imageId));
			case "edit": return this.ui.edit(messageId, imageId);
			case "display": return this.ui.display(messageId, imageId);
			case "tools": return this.ui.tools(messageId, imageId);
			case "lightbox": return this.ui.lightbox(messageId, imageId);
			case "delete": {
				if (!await this.ui.confirmDelete()) return;
				const multi = (entry?.swipes.length ?? 0) > 1;
				return await this.run(messageId, imageId, () => multi ? this.service.deleteSwipe(messageId, imageId) : this.service.remove(messageId, imageId));
			}
		}
	}
	async setChatHidden(hidden) {
		const c = ctx();
		const meta = c.chatMetadata.nai_studio ??= {};
		meta.inlineHidden = hidden;
		await c.saveMetadata();
		this.applyVisibility();
	}
	isChatHidden() {
		return (ctx().chatMetadata?.nai_studio)?.inlineHidden === true;
	}
	onDragStart(event) {
		const span = (event.target.closest?.(".naist-inline-frame"))?.closest(`[${IMG_ATTR}]`);
		if (!span || !event.dataTransfer) return;
		const messageId = messageIdOf$1(span);
		if (messageId === null) return;
		event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({
			messageId,
			imageId: span.getAttribute(IMG_ATTR)
		}));
		event.dataTransfer.effectAllowed = "move";
		span.classList.add("naist-inline-dragging");
	}
	dropTarget(event) {
		const target = event.target;
		const span = target.closest?.(`[${IMG_ATTR}][${MOUNTED_ATTR}]`);
		const text = target.closest?.(".mes_text");
		const element = span ?? text;
		if (!element) return null;
		const messageId = messageIdOf$1(element);
		if (messageId === null) return null;
		return {
			messageId,
			beforeId: span?.getAttribute("data-naist-img") ?? null,
			element
		};
	}
	onDragOver(event) {
		if (!event.dataTransfer?.types.includes(DRAG_TYPE)) return;
		const drop = this.dropTarget(event);
		if (!drop) return;
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
		this.clearDropMarks();
		drop.element.classList.add("naist-inline-drop");
	}
	clearDropMarks() {
		document.querySelectorAll(".naist-inline-drop, .naist-inline-dragging").forEach((n) => {
			n.classList.remove("naist-inline-drop", "naist-inline-dragging");
		});
	}
	async onDrop(event) {
		const raw = event.dataTransfer?.getData(DRAG_TYPE);
		this.clearDropMarks();
		if (!raw) return;
		const drop = this.dropTarget(event);
		if (!drop) return;
		event.preventDefault();
		const source = JSON.parse(raw);
		if (source.imageId === drop.beforeId) return;
		try {
			await this.service.move(source.messageId, source.imageId, drop.messageId, drop.beforeId);
		} catch (error) {
			reportGenerationError(error);
		}
	}
	/** Diagnostics for the console: NAIST_inlineDebug(). */
	debugState() {
		return {
			waiting: this.waiting.size,
			cachedUrls: this.urls.size,
			pending: this.pending.size,
			busy: [...this.busy],
			lazyTimer: this.lazyTimer !== null
		};
	}
	/** Object URL or file path for a swipe (lightbox, gallery compare). */
	async urlFor(swipe) {
		return await this.resolveUrl(swipe.blobKey, swipe.filePath);
	}
};
//#endregion
//#region src/integration/inline-setup.ts
var INSERT_CLASS = "naist-inline-insert";
var EDIT_INSERT_CLASS = "naist-inline-insert-edit";
var renderer = null;
var toolsHandler = () => {};
/** Phase 5 tools register here (avoids an import cycle with tools-setup). */
function setInlineToolsHandler(handler) {
	toolsHandler = handler;
}
function inlineRenderer() {
	return renderer;
}
function button(className, iconClass, titleKey) {
	const node = document.createElement("div");
	node.className = `mes_button ${className} fa-solid ${iconClass}`;
	node.setAttribute("data-i18n", `[title]${titleKey}`);
	node.title = t(titleKey);
	return node;
}
function addButtons() {
	const add = (container, className, iconClass, titleKey) => {
		if (container && !container.querySelector(`.${className}`)) container.prepend(button(className, iconClass, titleKey));
	};
	add(document.querySelector("#message_template .extraMesButtons"), INSERT_CLASS, "fa-image", "naist.inline.insert");
	document.querySelectorAll("#chat .mes .extraMesButtons").forEach((c) => add(c, INSERT_CLASS, "fa-image", "naist.inline.insert"));
	add(document.querySelector("#message_template .mes_edit_buttons"), EDIT_INSERT_CLASS, "fa-image", "naist.inline.insertHere");
	document.querySelectorAll("#chat .mes .mes_edit_buttons").forEach((c) => add(c, EDIT_INSERT_CLASS, "fa-image", "naist.inline.insertHere"));
	const template = document.querySelector("#message_template");
	if (template) localize(template);
}
function messageIdOf(element) {
	const id = Number(element.closest(".mes")?.getAttribute("mesid"));
	return Number.isInteger(id) ? id : null;
}
/** Offset after the selected text when the selection lies inside this message, else the end. */
function selectionOffset(messageId) {
	const selection = window.getSelection();
	const text = selection?.toString().trim() ?? "";
	const anchor = selection?.anchorNode?.parentElement;
	if (!text || !anchor || messageIdOf(anchor) !== messageId) return {
		offset: void 0,
		text: ""
	};
	const index = (ctx().chat[messageId]?.mes ?? "").indexOf(text);
	return {
		offset: index >= 0 ? index + text.length : void 0,
		text
	};
}
function lightboxFor(service, messageId, entry, url) {
	const swipe = activeSwipe(entry);
	if (!swipe) return null;
	return {
		url,
		meta: swipe.meta,
		position: entry.swipes.length > 1 ? `${entry.activeSwipe + 1}/${entry.swipes.length}` : void 0,
		blob: () => service.sourceBlob(swipe),
		ensureFile: () => service.ensureFile(messageId, entry.id),
		chat: {
			messageId,
			imageId: entry.id
		}
	};
}
function setupInline(pipeline, service) {
	const c = ctx();
	renderer = new InlineRenderer(service, {
		lightbox: (messageId, imageId) => {
			const entry = service.entries(messageId).find((e) => e.id === imageId);
			const swipe = entry ? activeSwipe(entry) : void 0;
			if (!entry || !swipe || !renderer) return;
			renderer.urlFor(swipe).then((url) => {
				const item = lightboxFor(service, messageId, entry, url);
				if (item) openLightbox(item);
			});
		},
		edit: (messageId, imageId) => {
			const entry = service.entries(messageId).find((e) => e.id === imageId);
			const swipe = entry ? activeSwipe(entry) : void 0;
			if (!swipe) return;
			editDialog(swipe.meta).then((params) => {
				if (params) renderer?.run(messageId, imageId, () => service.editAndRegenerate(messageId, imageId, params));
			});
		},
		display: (messageId, imageId) => {
			const entry = service.entries(messageId).find((e) => e.id === imageId);
			if (!entry) return;
			displayDialog(entry.display).then((display) => {
				if (display) service.updateDisplay(messageId, imageId, display).catch(reportGenerationError);
			});
		},
		tools: (messageId, imageId) => toolsHandler(messageId, imageId),
		confirmDelete
	});
	renderer.install();
	globalThis.NAIST_inlineDebug = () => renderer?.debugState();
	addButtons();
	document.addEventListener("click", (event) => {
		const target = event.target;
		const insert = target.closest(`.${INSERT_CLASS}`);
		const editInsert = target.closest(`.${EDIT_INSERT_CLASS}`);
		if (insert) insertFromMenu(service, insert);
		else if (editInsert) insertInEditMode(service, editInsert);
		else if (target.closest(".mes_edit_cancel")) {
			const id = messageIdOf(target);
			if (id !== null) setTimeout(() => void service.reconcileMessage(id).then(() => collectGarbage()), 50);
		}
	});
	const on = (name, handler) => {
		const event = c.eventTypes[name];
		if (event) c.eventSource.on(event, handler);
	};
	on("MESSAGE_EDITED", (id) => void service.reconcileMessage(Number(id), false).then(() => collectGarbage()));
	for (const name of [
		"MESSAGE_UPDATED",
		"MESSAGE_SWIPED",
		"MESSAGE_RECEIVED"
	]) on(name, (id) => void service.reconcileMessage(Number(id)).then(() => collectGarbage()));
	for (const name of ["MESSAGE_DELETED", "MESSAGE_SWIPE_DELETED"]) on(name, () => void collectGarbage());
	on("CHAT_CHANGED", () => {
		renderer?.reset();
		renderer?.applyVisibility();
		renderer?.renderAll();
		service.reconcileChat();
	});
	on("MORE_MESSAGES_LOADED", () => renderer?.renderAll());
	on("APP_READY", () => registerInlineCommands(pipeline, service));
}
async function insertFromMenu(service, buttonEl) {
	const messageId = messageIdOf(buttonEl);
	if (messageId === null) return;
	const { offset, text } = selectionOffset(messageId);
	const request = await insertDialog(text);
	if (!request) return;
	try {
		await service.insert(messageId, request, offset);
	} catch (error) {
		reportGenerationError(error);
	}
}
/** Edit mode: the placeholder goes into the textarea at the cursor; ST saves it with the text. */
async function insertInEditMode(service, buttonEl) {
	const messageId = messageIdOf(buttonEl);
	const textarea = buttonEl.closest(".mes")?.querySelector(".edit_textarea");
	if (messageId === null || !textarea) return;
	const start = textarea.selectionStart ?? textarea.value.length;
	const end = textarea.selectionEnd ?? start;
	const request = await insertDialog(textarea.value.slice(start, end).trim());
	if (!request) return;
	try {
		const entry = await service.create(messageId, request);
		if (!entry) return;
		textarea.value = insertPlaceholder(textarea.value, entry.id, end);
		textarea.dispatchEvent(new Event("input", { bubbles: true }));
		await service.saveCreated(messageId, entry);
		toastr.info(t("naist.inline.insertedInEdit"));
	} catch (error) {
		reportGenerationError(error);
	}
}
async function openGalleryWindow(pipeline) {
	await openGallery({
		open: (record) => {
			(async () => {
				const blob = await fullBlob(record);
				const url = blob ? URL.createObjectURL(blob) : encodeURI(record.filePath);
				await openLightbox({
					url,
					meta: record.meta,
					blob: async () => {
						const full = blob ?? await fullBlob(record);
						if (!full) throw new Error("image unavailable");
						return full;
					},
					ensureFile: async () => record.filePath
				});
				if (blob) URL.revokeObjectURL(url);
			})();
		},
		repeat: async (record) => {
			const params = await editDialog(record.meta);
			if (!params) return;
			try {
				await pipeline.generatePicture({
					initiator: "panel",
					trigger: params.scene,
					scene: params.scene,
					mode: record.meta.mode ?? MODE.FREE,
					overrides: {
						negative: params.negative,
						generation: {
							model: params.model,
							seed: params.seed,
							width: params.width,
							height: params.height,
							steps: params.steps,
							scale: params.scale,
							sampler: record.meta.sampler,
							noiseSchedule: record.meta.noiseSchedule,
							cfgRescale: record.meta.cfgRescale
						}
					}
				});
			} catch (error) {
				reportGenerationError(error);
			}
		}
	});
}
/** Hide/show the images of this chat; reading mode hides them everywhere. */
async function setInlineVisibility(state) {
	if (!renderer) return;
	if (state === "show" || state === "hide") {
		await renderer.setChatHidden(state === "hide");
		return;
	}
	settings().inline.readingMode = state === "reading-on";
	saveSettings();
	renderer.applyVisibility();
}
function registerInlineCommands(pipeline, service) {
	const { SlashCommandParser: parser, SlashCommand: Command, SlashCommandArgument: Arg, SlashCommandNamedArgument: Named, ARGUMENT_TYPE: T } = ctx();
	parser.addCommandObject(Command.fromProps({
		name: "nai-insert",
		returns: t("naist.command.insertReturns"),
		helpString: t("naist.command.insertHelp"),
		namedArgumentList: [Named.fromProps({
			name: "message",
			description: t("naist.command.arg.message"),
			typeList: [T.NUMBER ?? "number"],
			isRequired: false
		}), Named.fromProps({
			name: "at",
			description: t("naist.command.arg.at"),
			typeList: [T.NUMBER ?? "number"],
			isRequired: false
		})],
		unnamedArgumentList: [Arg.fromProps({
			description: t("naist.command.trigger"),
			typeList: [T.STRING ?? "string"],
			isRequired: true
		})],
		callback: async (args, value) => {
			const chat = ctx().chat;
			const messageId = args.message !== void 0 && args.message !== "" ? Number(args.message) : chat.length - 1;
			const trigger = String(value ?? "").trim();
			if (!trigger || !chat[messageId]) return "";
			const at = args.at !== void 0 && args.at !== "" ? Number(args.at) : void 0;
			try {
				return (await service.insert(messageId, {
					trigger,
					mode: MODE.FREE
				}, at))?.id ?? "";
			} catch (error) {
				reportGenerationError(error);
				return "";
			}
		}
	}));
	parser.addCommandObject(Command.fromProps({
		name: "nai-images",
		returns: t("naist.command.imagesReturns"),
		helpString: t("naist.command.imagesHelp"),
		unnamedArgumentList: [Arg.fromProps({
			description: t("naist.command.imagesArg"),
			typeList: [T.STRING ?? "string"],
			isRequired: false,
			enumList: [
				"show",
				"hide",
				"toggle",
				"reading-on",
				"reading-off"
			]
		})],
		callback: async (_args, value) => {
			const action = String(value ?? "").trim();
			const hidden = renderer?.isChatHidden() ?? false;
			if (action === "toggle") await setInlineVisibility(hidden ? "show" : "hide");
			else if ([
				"show",
				"hide",
				"reading-on",
				"reading-off"
			].includes(action)) await setInlineVisibility(action);
			return settings().inline.readingMode ? "reading" : renderer?.isChatHidden() ? "hidden" : "shown";
		}
	}));
	parser.addCommandObject(Command.fromProps({
		name: "nai-gallery",
		returns: "",
		helpString: t("naist.command.galleryHelp"),
		callback: async () => {
			openGalleryWindow(pipeline);
			return "";
		}
	}));
	log.info("inline image commands registered");
}
//#endregion
//#region src/features/language/llm.ts
var asText = (value) => typeof value === "string" ? value : value && typeof value === "object" && "content" in value ? asText(value.content) : value === void 0 || value === null ? "" : JSON.stringify(value);
async function viaMain(req) {
	const c = ctx();
	if (c.mainApi === "openai") return asText(await c.generateRaw({
		prompt: req.user,
		systemPrompt: req.system,
		responseLength: req.maxTokens,
		...req.schema ? { jsonSchema: req.schema } : {}
	}));
	const answer = asText(await c.generateRaw({
		prompt: [{
			role: "system",
			content: `${req.system}\n\n${req.user}`
		}],
		prefill: "{",
		responseLength: req.maxTokens
	}));
	return answer.trimStart().startsWith("{") ? answer : `{${answer}`;
}
async function viaProfile(req) {
	const service = ctx().ConnectionManagerRequestService;
	const id = settings().language.profileId;
	if (!id) throw new NaiError("translation-failed", "none", { message: "no connection profile selected" });
	const chat = service.validateProfile(service.getProfile(id)).selected === "openai";
	const text = asText(chat ? await service.sendRequest(id, [{
		role: "system",
		content: req.system
	}, {
		role: "user",
		content: req.user
	}], req.maxTokens, {
		stream: false,
		extractData: true,
		includePreset: false
	}, req.schema ? { json_schema: req.schema } : {}) : await service.sendRequest(id, `${req.system}\n\n${req.user}\n{`, req.maxTokens, {
		stream: false,
		extractData: true,
		includePreset: true,
		includeInstruct: false
	}));
	return chat || text.trimStart().startsWith("{") ? text : `{${text}`;
}
async function viaNovelAi(req) {
	return await novelAiText({
		fetch: (input, init) => fetch(input, init),
		headers: () => requestHeaders()
	}, {
		model: settings().language.novelaiModel,
		messages: [{
			role: "system",
			content: req.system
		}, {
			role: "user",
			content: req.user
		}],
		maxTokens: req.maxTokens
	});
}
async function askLlm(req) {
	try {
		const backend = settings().language.backend;
		if (backend === "profile") return await viaProfile(req);
		if (backend === "novelai") return await viaNovelAi(req);
		return await viaMain(req);
	} catch (error) {
		if (error instanceof NaiError) throw error;
		throw new NaiError("translation-failed", "none", { message: String(error?.message ?? error) });
	}
}
//#endregion
//#region src/features/characters/passport-generator.ts
async function ask(source, target, options = {}) {
	if (!source.description.trim() && !source.firstMessage?.trim()) throw new NaiError("translation-failed", "none", { message: "the description is empty" });
	const { system, user } = passportGenMessages(source, target, options);
	const answer = await askLlm({
		system,
		user,
		schema: PASSPORT_GEN_SCHEMA,
		maxTokens: target === "card" ? 3500 : 1200
	});
	const passports = withoutUnstatedSpecies(parseGeneratedPassports(answer, source.name, options.kind), user);
	if (!passports.length) {
		log.warn("passport generation: no usable passports in", answer.slice(0, 300));
		throw new NaiError("translation-failed", "none", { message: "the answer had no usable passports" });
	}
	return passports;
}
/** Passports for every character, the world, places, the scenario and objects of a card. */
async function generateCardPassports(index) {
	const character = await loadCharacter(index);
	if (!character) throw new NaiError("no-usable-message", "none");
	const c = ctx();
	const sub = (text) => c.substituteParams(text ?? "");
	const passports = await ask({
		name: character.name,
		description: sub(character.description),
		personality: sub(character.personality),
		scenario: sub(character.scenario),
		firstMessage: sub(character.first_mes)
	}, "card");
	const own = passports.find((p) => p.kind === "character" && p.name.toLowerCase() === character.name.toLowerCase());
	if (own) own.name = "";
	return passports;
}
/**
* One character passport for a character of a scene tracker (Doom's Enhancement Suite, v0.9): their
* current look from the tracker, and the sentences of the card that name them.
*/
async function generateTrackerPassport(name, look, cardIndex) {
	const character = cardIndex === null ? void 0 : await loadCharacter(cardIndex);
	const c = ctx();
	const [first] = await ask({
		name,
		description: look,
		scenario: character ? sentencesNaming(c.substituteParams(character.description ?? ""), [name]) : ""
	}, "npc");
	const passport = first;
	passport.kind = "character";
	passport.name = name;
	return passport;
}
/**
* One passport of a lorebook entry (v0.12, NAI_STUDIO_API.generatePassport): the person, place, item or
* world of the entry from its text, through the language backend. It keeps the given name (the name
* the model wrote becomes an alias) and a new id; nothing is saved.
*/
async function generateEntryPassport(request) {
	const c = ctx();
	const passport = (await ask({
		name: request.name,
		description: c.substituteParams(request.description)
	}, "entry", {
		kind: request.kind,
		...request.language ? { language: request.language } : {}
	})).find((p) => p.kind === request.kind);
	if (!passport) throw new NaiError("translation-failed", "none", { message: `the answer had no ${request.kind} passport` });
	const wanted = request.name.trim();
	passport.aliases = [.../* @__PURE__ */ new Set([passport.name, ...passport.aliases])].filter((alias) => alias.trim() && alias.trim().toLowerCase() !== wanted.toLowerCase());
	passport.name = wanted;
	return passport;
}
/** One character passport from the current persona's description. */
async function generatePersonaPassport() {
	const c = ctx();
	const description = String(c.powerUserSettings.persona_description ?? "");
	const [first] = await ask({
		name: c.name1,
		description: c.substituteParams(description)
	}, "persona");
	const passport = first;
	passport.kind = "character";
	passport.name = "";
	return passport;
}
//#endregion
//#region src/features/prompt-tools/tag-db.ts
var index = null;
var loaded = null;
var remoteCache = /* @__PURE__ */ new Map();
async function fetchJson(path) {
	const response = await fetch(`${extensionBaseUrl()}/${path}`);
	if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
	return await response.json();
}
function tagIndex() {
	if (!index) index = Promise.all([fetchJson("src/data/tags.json"), fetchJson("src/data/tags-ru.json")]).then(([rows, ru]) => {
		loaded = buildTagIndex(rows, ru);
		log.info("tag list ready:", rows.length, "tags");
		return loaded;
	}).catch((error) => {
		log.warn("tag list unavailable:", error);
		index = null;
		return null;
	});
	return index;
}
function readyTagIndex() {
	return loaded;
}
/** NovelAI suggestions for a fragment (cached per model and fragment). */
async function remoteTagSuggestions(model, fragment, signal) {
	const key = `${model}\u0000${fragment.toLowerCase()}`;
	const cached = remoteCache.get(key);
	if (cached) return cached;
	const tags = await fetchTagSuggestions({
		fetch: (input, init) => fetch(input, init),
		headers: () => requestHeaders()
	}, model, fragment, signal);
	if (remoteCache.size > 500) remoteCache.clear();
	remoteCache.set(key, tags);
	return tags;
}
async function sha256Hex(text) {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function vibeItems() {
	return settings().vibes.items;
}
async function addVibe(file, name) {
	const png = await toPngBlob(file);
	const base64 = await blobToBase64$1(png);
	const id = ctx().uuidv4();
	const item = {
		id,
		name: name.trim() || `vibe-${id.slice(0, 4)}`,
		imageHash: await sha256Hex(base64),
		imageKey: `vibe:${id}`,
		thumbKey: `vibethumb:${id}`,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	await imageStore().setItem(item.imageKey, png);
	await imageStore().setItem(item.thumbKey, await thumbnail(png, 160));
	settings().vibes.items.push(item);
	saveSettings();
	return item;
}
async function removeVibe(id) {
	const s = settings().vibes;
	const item = s.items.find((i) => i.id === id);
	if (!item) return;
	s.items = s.items.filter((i) => i.id !== id);
	for (const set of s.sets) set.entries = set.entries.filter((e) => e.vibeId !== id);
	saveSettings();
	await imageStore().removeItem(item.imageKey);
	await imageStore().removeItem(item.thumbKey);
	const keys = (await store().keys()).filter((k) => k.startsWith(`vibeenc:${item.imageHash}:`));
	await Promise.all(keys.map((k) => store().removeItem(k)));
}
async function vibeImage(item) {
	return await imageStore().getItem(item.imageKey);
}
async function vibeThumb(item) {
	return await imageStore().getItem(item.thumbKey);
}
/** Characters, chat and style the vibe bindings are matched against. */
function vibeContext() {
	const c = ctx();
	const characters = [];
	if (c.groupId) for (const avatar of c.groups.find((g) => g.id === c.groupId)?.members ?? []) characters.push(avatarKey(avatar));
	else if (c.characterId !== void 0 && c.characterId !== null && c.characterId !== "") characters.push(avatarKey(c.characters[Number(c.characterId)]?.avatar));
	return {
		characters,
		chatId: c.getCurrentChatId() ?? "",
		style: settings().prompts.activeStyle
	};
}
var extraVibes = () => [];
/** Vibes added by other features (scene continuity in vibe mode). */
function setExtraVibes(source) {
	extraVibes = source;
}
function activeVibes() {
	const planned = planVibes(settings().vibes.sets, settings().vibes.items, vibeContext());
	const extra = extraVibes().filter((e) => !planned.some((p) => p.item.id === e.item.id));
	return [...planned, ...extra];
}
/** Pipeline vibe provider: plans the active vibes and makes sure each has an encoding. */
var VibeLibraryProvider = class {
	confirm;
	notify;
	noticed = /* @__PURE__ */ new Set();
	constructor(confirm, notify) {
		this.confirm = confirm;
		this.notify = notify;
	}
	notifyOnce(key, notice) {
		if (this.noticed.has(key)) return;
		this.noticed.add(key);
		this.notify(notice);
	}
	async prepare(caps, transport, signal, extra = [], queue = {}) {
		const active = activeVibes();
		const planned = [...active, ...extra.filter((e) => !active.some((a) => a.item.id === e.item.id))];
		if (!planned.length) return [];
		const availability = vibeAvailability(caps, transport.features.vibes);
		if (availability !== "ok") {
			this.notifyOnce(`${availability}:${caps.model}`, {
				kind: "unavailable",
				reason: availability,
				count: planned.length
			});
			return [];
		}
		if (caps.vibeKind === "raw") return await this.raw(planned);
		return await this.encoded(planned, caps.model, transport, signal, queue);
	}
	/** V3: the reference image itself, 448x448 PNG (RECON §3.4). */
	async raw(planned) {
		const refs = [];
		for (const p of planned) {
			const blob = await vibeImage(p.item);
			if (!blob) {
				this.notify({
					kind: "missing-image",
					name: p.item.name
				});
				continue;
			}
			refs.push({
				data: await blobToBase64$1(await toPngBlob(blob, {
					width: 448,
					height: 448
				})),
				strength: p.strength,
				informationExtracted: p.informationExtracted
			});
		}
		return refs;
	}
	async encoded(planned, model, transport, signal, queue = {}) {
		const extras = transport.extras;
		const encodings = /* @__PURE__ */ new Map();
		const keyOf = (p) => encodingCacheKey(p.item.imageHash, model, p.informationExtracted);
		for (const p of planned) {
			const local = await store().getItem(keyOf(p));
			if (local) encodings.set(keyOf(p), local);
		}
		let missing = planned.filter((p) => !encodings.has(keyOf(p)));
		if (missing.length && extras) {
			const found = await extras.lookupVibes(missing.map((p) => ({
				imageHash: p.item.imageHash,
				model,
				informationExtracted: p.informationExtracted
			})), signal);
			for (const [i, encoding] of found.entries()) {
				const p = missing[i];
				if (p && encoding) {
					encodings.set(keyOf(p), encoding);
					await store().setItem(keyOf(p), encoding);
				}
			}
			missing = missing.filter((p) => !encodings.has(keyOf(p)));
		}
		if (missing.length) {
			const cost = missing.length * 2;
			const reason = settings().anlas.freeOnly ? "free-only" : !extras ? "no-plugin" : settings().vibes.confirmEncoding && !await this.confirm(cost, "vibes") ? "declined" : null;
			if (reason) this.notify({
				kind: "skipped",
				count: missing.length,
				reason
			});
			else {
				let paid = 0;
				for (const p of missing) {
					const blob = await vibeImage(p.item);
					if (!blob) {
						this.notify({
							kind: "missing-image",
							name: p.item.name
						});
						continue;
					}
					const image = await blobToBase64$1(blob);
					const result = await generationQueue.run({
						...queue,
						kind: "vibe",
						...signal ? { signal } : {}
					}, (jobSignal) => extras.encodeVibe({
						image,
						model,
						informationExtracted: p.informationExtracted
					}, jobSignal));
					if (!result.cached) paid++;
					encodings.set(keyOf(p), result.encoding);
					await store().setItem(keyOf(p), result.encoding);
				}
				if (paid) this.notify({
					kind: "encoded",
					count: paid,
					cost: paid * 2
				});
				log.info(`encoded ${paid} vibe(s) for ${model}`);
			}
		}
		return planned.filter((p) => encodings.has(keyOf(p))).map((p) => ({
			data: encodings.get(keyOf(p)) ?? "",
			strength: p.strength,
			informationExtracted: p.informationExtracted
		}));
	}
};
//#endregion
//#region src/features/language/interpreter.ts
var memory$1 = /* @__PURE__ */ new Map();
var warnedFallback = false;
async function callMain(text) {
	const c = ctx();
	const glossary = settings().translate.glossary;
	if (c.mainApi === "openai") {
		const { system, prompt } = interpretMessages(text, glossary);
		return await c.generateRaw({
			prompt,
			systemPrompt: system,
			responseLength: 500,
			jsonSchema: INTERPRET_SCHEMA
		});
	}
	return await c.generateRaw({
		prompt: [{
			role: "system",
			content: interpretCompletion(text, glossary)
		}],
		prefill: COMPLETION_INTERPRET_PREFILL,
		responseLength: 250
	});
}
async function callProfile(text) {
	const service = ctx().ConnectionManagerRequestService;
	const id = settings().language.profileId;
	if (!id) throw new NaiError("translation-failed", "none", { message: "no connection profile selected" });
	const glossary = settings().translate.glossary;
	const profile = service.getProfile(id);
	const result = service.validateProfile(profile).selected === "openai" ? await service.sendRequest(id, [{
		role: "system",
		content: interpretMessages(text, glossary).system
	}, {
		role: "user",
		content: text
	}], 500, {
		stream: false,
		extractData: true,
		includePreset: false
	}, { json_schema: INTERPRET_SCHEMA }) : await service.sendRequest(id, `${interpretCompletion(text, glossary)}\n${COMPLETION_INTERPRET_PREFILL}`, 250, {
		stream: false,
		extractData: true,
		includePreset: true,
		includeInstruct: false
	});
	return result && typeof result === "object" && "content" in result ? result.content : result;
}
async function callNovelAi(text) {
	const { system } = interpretMessages(text, settings().translate.glossary);
	return await novelAiText({
		fetch: (input, init) => fetch(input, init),
		headers: () => requestHeaders()
	}, {
		model: settings().language.novelaiModel,
		messages: [{
			role: "system",
			content: system
		}, {
			role: "user",
			content: text
		}],
		maxTokens: 500
	});
}
var BACKENDS = {
	main: callMain,
	profile: callProfile,
	novelai: callNovelAi
};
function matchAll(index, tags) {
	return index ? matchTags(index, tags) : {
		tags: tags.map((t) => tagName(t)).filter(Boolean),
		unmatched: []
	};
}
/** Without an LLM: every comma-separated piece through the tag list and the Russian aliases. */
function dictionaryInterpretation(index, text) {
	const pieces = text.split(/[,.;\n]/).map((p) => p.trim()).filter(Boolean);
	const tags = [];
	const rest = [];
	for (const piece of pieces) {
		const hit = index ? matchTag(index, piece) : null;
		if (hit) tags.push(hit.tag);
		else if (!hasCyrillic(piece)) rest.push(piece);
	}
	return {
		tags: [...tags, ...rest],
		sentence: "",
		text: "",
		negative: []
	};
}
function finish(interp, index, family, block, asNegative = false) {
	const matched = matchAll(index, interp.tags);
	const negative = matchAll(index, interp.negative);
	const negativeTags = [...negative.tags, ...negative.unmatched.filter((n) => !hasCyrillic(n))];
	if (asNegative) {
		const all = [
			...matched.tags,
			...matched.unmatched.filter((n) => !hasCyrillic(n)),
			...negativeTags
		];
		return {
			prompt: [...new Set(all)].join(", "),
			negative: "",
			unmatched: matched.unmatched
		};
	}
	const withText = block && !interp.text ? {
		...interp,
		text: block
	} : interp;
	const kept = withoutNegated(matched, negativeTags);
	return {
		prompt: assembleInterpretation(withText, kept, family),
		negative: negativeTags.join(", "),
		unmatched: kept.unmatched
	};
}
/**
* The NovelAI prompt for a text and model, or null when the text needs no interpretation (already
* tags, or prose the model reads as is). `force` interprets anything that is not a tag list.
*/
async function interpretForModel(text, model, options = {}) {
	const s = settings().language;
	const id = isModelId(model) ? model : DEFAULT_MODEL;
	const asNegative = options.negative === true;
	const family = asNegative ? "v3" : getCapabilities(id).family;
	if (options.cyrillicOnly && !hasCyrillic(text)) return null;
	const index = await tagIndex();
	if (!needsInterpretation(text, family, options.force ? "always" : s.mode, index, s.russianOnV5)) return null;
	const glossary = settings().translate.glossary;
	const block = textBlockOf(text);
	const prepared = applyGlossary(block === null ? text : withoutTextBlocks(text), glossary).trim();
	if (!prepared) return null;
	if (!hasCyrillic(prepared) && looksLikeTags(index, prepared)) return {
		...finish(dictionaryInterpretation(index, prepared), index, family, block, asNegative),
		cached: false,
		via: "dictionary"
	};
	const key = `int:${await sha256Hex(interpretCacheSource(prepared, family, glossary))}`;
	const hit = memory$1.get(key) ?? await store().getItem(key);
	if (hit) {
		memory$1.set(key, hit);
		return {
			...finish(hit, index, family, block, asNegative),
			cached: true,
			via: s.backend
		};
	}
	let interp = null;
	try {
		const raw = await BACKENDS[s.backend](prepared);
		interp = parseInterpretation(raw);
		const flat = interp ? [...interp.tags, interp.sentence].join(" ") : "";
		if (!interp || looksLikeChatter(flat, prepared) || hasCyrillic(interp.tags.join(" "))) {
			log.warn("interpretation not usable:", String(typeof raw === "string" ? raw : JSON.stringify(raw)).slice(0, 200));
			interp = null;
		}
	} catch (error) {
		log.warn("interpretation failed:", error);
		if (options.strict) throw error instanceof NaiError ? error : new NaiError("translation-failed", "none", { message: String(error?.message ?? error) });
	}
	if (!interp) {
		if (options.strict) throw new NaiError("translation-failed", "none", { message: "the answer was not usable" });
		if (!warnedFallback) {
			warnedFallback = true;
			toastr.warning(t("naist.interpret.fallback"), t("naist.interpret.title"));
		}
		return {
			...finish(dictionaryInterpretation(index, prepared), index, family, block, asNegative),
			cached: false,
			via: "dictionary"
		};
	}
	memory$1.set(key, interp);
	await store().setItem(key, interp);
	log.info("prompt interpreted via", s.backend, "for", family);
	return {
		...finish(interp, index, family, block, asNegative),
		cached: false,
		via: s.backend
	};
}
/** English text → Russian original, for prompts converted by hand in a field (kept for the session). */
var originals = /* @__PURE__ */ new Map();
function rememberSource(prompt, original) {
	if (originals.size > 200) originals.clear();
	originals.set(prompt.trim(), original);
}
/** Pipeline hook: every generation's scene and character prompts. */
var languageInterpreter = {
	async interpret(text, context) {
		const result = await interpretForModel(text, context.model, {
			cyrillicOnly: context.cyrillicOnly,
			negative: context.negative
		});
		return result ? {
			prompt: result.prompt,
			negative: result.negative
		} : null;
	},
	original(text) {
		const trimmed = text.trim();
		for (const [prompt, original] of originals) if (prompt && trimmed.includes(prompt)) return original;
	}
};
//#endregion
//#region src/features/continuity/continuity-service.ts
var META_KEY = "nai_studio";
function data() {
	const meta = ctx().chatMetadata;
	const root = meta[META_KEY] ??= {};
	const value = root.continuity;
	if (!value || typeof value !== "object") root.continuity = {
		current: "",
		locations: {}
	};
	else {
		value.current ??= "";
		value.locations ??= {};
	}
	return root.continuity;
}
function continuityData() {
	return structuredClone(data());
}
/** The place of a location: the given id (with the registry's name and aliases), else the registry's match. */
function placeOf(label, placeId) {
	if (placeId?.trim()) {
		const id = placeId.trim();
		return placeById(id) ?? {
			id,
			name: label.trim(),
			aliases: [],
			parent: null
		};
	}
	return resolvePlace(label);
}
/** The place of the current location (its stored id first). */
function currentPlace(d) {
	return d.current ? placeOf(d.current, d.currentPlace) : null;
}
/** Reference of a location: under the place id, else under a name key of the label, the place or its aliases. */
function findReference(d, label, place) {
	for (const key of locationKeys(label, place)) {
		const found = d.locations[key];
		if (found) return [key, found];
	}
	return null;
}
/** A reference found under a name key moves to the place id key (no reference there yet). */
function migrate(d, label, place) {
	if (!place) return;
	const target = placeKey(place.id);
	if (d.locations[target]) return;
	const found = findReference(d, label, place);
	if (!found || found[0] === target) return;
	d.locations[target] = {
		...found[1],
		placeId: place.id
	};
	delete d.locations[found[0]];
	log.info(`continuity: reference of ${found[1].name} moved to ${target}`);
}
/** The reference of the current location, if any (the panel shows it). */
function currentReference(d = data()) {
	return d.current ? findReference(d, d.current, currentPlace(d))?.[1] ?? null : null;
}
function followMaestro() {
	followPlaces((place) => {
		if (!settings().continuity.enabled || !ctx().getCurrentChatId()) return;
		setCurrentLocation(place.name || place.id, place.id).catch((error) => log.warn("continuity: place not set", error));
	});
}
/** `placeId`: the stable id of the place, when the caller knows it (a scene provider). */
async function setCurrentLocation(name, placeId) {
	followMaestro();
	const d = data();
	d.current = name.trim();
	const place = d.current ? placeOf(d.current, placeId) : null;
	if (place) d.currentPlace = place.id;
	else delete d.currentPlace;
	migrate(d, d.current, place);
	await ctx().saveMetadata();
}
async function forgetLocation(name) {
	const d = data();
	const keys = locationKeys(name, locationKey(name) === locationKey(d.current) ? currentPlace(d) : placeOf(name));
	const removed = keys.map((key) => d.locations[key]).filter((l) => Boolean(l));
	for (const key of keys) delete d.locations[key];
	if (locationKey(d.current) === locationKey(name)) {
		d.current = "";
		delete d.currentPlace;
	}
	await ctx().saveMetadata();
	for (const old of removed) if (old.vibeId) await removeVibe(old.vibeId);
}
/** Makes the image the reference of the location; in vibe mode also a vibe library item. */
async function bindLocation(name, ref, placeId) {
	const d = data();
	const label = name.trim();
	if (!locationKey(label)) return;
	const place = placeOf(label, placeId ?? (locationKey(label) === locationKey(d.current) ? d.currentPlace : void 0));
	const keys = locationKeys(label, place);
	const key = keys[0];
	const previous = keys.map((k) => d.locations[k]).filter((l) => Boolean(l));
	const stored = {
		...ref,
		name: label,
		updatedAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	if (place) stored.placeId = place.id;
	if (settings().continuity.mode === "vibe") try {
		const response = await fetch(ref.filePath);
		if (response.ok) stored.vibeId = (await addVibe(await response.blob(), `@${label}`)).id;
	} catch (error) {
		log.warn("continuity vibe not created:", error);
	}
	for (const old of keys.slice(1)) delete d.locations[old];
	d.locations[key] = stored;
	if (!d.current) {
		d.current = label;
		if (place) d.currentPlace = place.id;
	}
	await ctx().saveMetadata();
	for (const old of previous) if (old.vibeId && old.vibeId !== stored.vibeId) await removeVibe(old.vibeId);
}
var ContinuityService = class {
	follow(text) {
		followMaestro();
		const d = data();
		const detected = detectLocation(text, Object.values(d.locations).map((l) => l.name));
		if (detected && locationKey(detected) !== locationKey(d.current)) {
			const stored = Object.values(d.locations).find((l) => locationKey(l.name) === locationKey(detected));
			d.current = detected;
			const place = placeOf(detected, stored?.placeId);
			if (place) d.currentPlace = place.id;
			else delete d.currentPlace;
			migrate(d, detected, place);
			ctx().saveMetadata();
			log.info("continuity: location", detected);
		}
		return d;
	}
	async prepare(input) {
		const s = settings().continuity;
		if (!s.enabled) return null;
		const d = this.follow(input.text);
		if (s.mode !== "img2img" || !d.current) return null;
		const ref = currentReference(d);
		if (!ref?.filePath) return null;
		const response = await fetch(ref.filePath, { signal: input.signal });
		if (!response.ok) return null;
		const png = await toPngBlob(await response.blob(), input.size);
		log.info("continuity: img2img from", ref.name);
		return {
			image: await blobToBase64$1(png),
			strength: clampContinuityStrength(s.strength)
		};
	}
	/** Vibe mode: the reference of the current location as an extra vibe. */
	vibes() {
		const s = settings().continuity;
		if (!s.enabled || s.mode !== "vibe" || !ctx().getCurrentChatId()) return [];
		const vibeId = currentReference(data())?.vibeId;
		const item = vibeId ? settings().vibes.items.find((i) => i.id === vibeId) : void 0;
		return item ? [{
			item,
			strength: .6,
			informationExtracted: 1
		}] : [];
	}
	/** Auto-bind: plain generations (not tool results) become the reference of the current location. */
	observe = (produced, outcome) => {
		const s = settings().continuity;
		if (!s.enabled || !s.autoBind || produced.meta.tool) return;
		if (produced.meta.requestType !== "txt2img" && produced.meta.requestType !== "img2img") return;
		if (produced.chatId !== ctx().getCurrentChatId()) return;
		const d = data();
		const path = outcome.paths[0];
		if (!d.current || !path) return;
		bindLocation(d.current, {
			filePath: path,
			width: produced.meta.width,
			height: produced.meta.height,
			model: produced.meta.model,
			seed: produced.meta.seed,
			prompt: produced.meta.scenePrompt
		}, d.currentPlace).catch((error) => log.warn("continuity bind failed:", error));
	};
};
/** Starts following Maestro's places (app ready; continuity calls it too, so a late Maestro is found). */
function startPlaceFollowing() {
	followMaestro();
}
function stopPlaceFollowing() {
	unfollowPlaces();
}
//#endregion
//#region src/features/tools/tool-common.ts
/** Free-only blocks every paid tool call; otherwise a paid call above the threshold is confirmed. */
async function guardCost(cost, what, confirm) {
	const s = settings().anlas;
	if (cost <= 0) return;
	if (s.freeOnly) throw new NaiError("free-only-blocked", "enable-free-only", { cost });
	if (cost > s.confirmAbove && !await confirm(cost, what)) throw new NaiError("aborted", "none");
}
/** The source as a base64 PNG of exactly width x height (NovelAI wants PNG of the request size). */
async function sourcePng(source, size) {
	return await blobToBase64$1(await toPngBlob(await source.blob(), size ?? {
		width: source.width,
		height: source.height
	}));
}
/** Image source for an inline image of a message. */
async function inlineSource(inline, messageId, imageId) {
	const entry = readEntries(ctx().chat[messageId]?.extra).find((e) => e.id === imageId);
	const swipe = entry ? activeSwipe(entry) : void 0;
	if (!entry || !swipe) throw new NaiError("image-not-found", "none");
	const blob = await inline.sourceBlob(swipe);
	const size = swipe.meta.width && swipe.meta.height ? {
		width: swipe.meta.width,
		height: swipe.meta.height
	} : await imageSize(blob);
	return {
		target: {
			kind: "inline",
			messageId,
			imageId
		},
		...size,
		meta: swipe.meta,
		blob: async () => blob
	};
}
/** Image source for a media attachment of a message (generated or uploaded by the user). */
async function mediaSource(messageId, mediaIndex) {
	const attachment = (ctx().chat[messageId]?.extra?.media ?? [])[mediaIndex];
	if (!attachment?.url) throw new NaiError("image-not-found", "none");
	const response = await fetch(attachment.url);
	if (!response.ok) throw new NaiError("image-load-failed", "none");
	const blob = await response.blob();
	const size = await imageSize(blob);
	return {
		target: {
			kind: "media",
			messageId,
			mediaIndex
		},
		...size,
		meta: attachment.title ? metaFromMedia(attachment, size) : void 0,
		blob: async () => blob
	};
}
function metaFromMedia(attachment, size) {
	return {
		scenePrompt: attachment.title ?? "",
		prompt: attachment.nai_studio?.prompt ?? attachment.title ?? "",
		negativePrompt: "",
		negative: "",
		mode: 6,
		model: attachment.nai_studio?.model ?? settings().generation.model,
		seed: attachment.nai_studio?.seed ?? 0,
		width: size.width,
		height: size.height,
		steps: settings().generation.steps,
		scale: settings().generation.scale,
		cfgRescale: 0,
		sampler: settings().generation.sampler,
		noiseSchedule: settings().generation.noiseSchedule,
		ucPreset: settings().generation.ucPreset,
		qualityPreset: settings().generation.qualityPreset,
		requestType: "txt2img",
		characters: [],
		transport: "",
		cost: 0,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
/** Images of a NovelAI ZIP answer, in file-name order (image_0, image_1, …). */
async function unzipImages(zipBase64) {
	await importHost("/lib/jszip.min.js");
	const JSZip = globalThis.JSZip;
	if (!JSZip) throw new NaiError("invalid-response", "none", { preview: "JSZip unavailable" });
	const zip = await JSZip.loadAsync(base64ToBytes(zipBase64));
	const files = Object.values(zip.files).filter((f) => !f.dir && /\.(png|webp|jpe?g)$/i.test(f.name)).sort((a, b) => a.name.localeCompare(b.name, void 0, { numeric: true }));
	const images = [];
	for (const [index, file] of files.entries()) {
		const base64 = await file.async("base64");
		const mime = sniffMime(base64ToBytes(base64.slice(0, 32)));
		images.push({
			base64,
			mime: mime === "image/webp" ? "image/webp" : "image/png",
			index
		});
	}
	if (!images.length) throw new NaiError("invalid-response", "none", { preview: "empty ZIP" });
	return images;
}
function legacyMeta(meta) {
	return {
		scenePrompt: meta.scenePrompt,
		prompt: meta.prompt,
		negative: meta.negative,
		mode: meta.mode,
		model: meta.model,
		seed: meta.seed,
		transport: meta.transport,
		cost: meta.cost,
		width: meta.width,
		height: meta.height,
		...meta.tool ? { tool: meta.tool } : {}
	};
}
/** Adds tool results as new swipes of the source image (the original is kept). */
async function deliver(source, produced, services) {
	if (source.target.kind === "inline") {
		await services.inline.addProducedSwipe(source.target.messageId, source.target.imageId, produced);
		return;
	}
	const folder = imageFolder();
	const saved = await saveImages(produced.images, folder);
	await appendToMessage(source.target.messageId, saved, legacyMeta(produced.meta));
	services.pipeline.notify(produced, {
		target: "message",
		paths: saved.map((s) => s.path)
	});
	imageReady(source.target.messageId, "tool", produced.passportIds);
}
/** Meta of a tool result derived from the source (Director Tools, upscale keep its prompt). */
function toolMeta(source, patch) {
	return {
		...source.meta ?? metaFromMedia({ url: "" }, {
			width: source.width,
			height: source.height
		}),
		createdAt: (/* @__PURE__ */ new Date()).toISOString(),
		...patch
	};
}
/** Dimensions of a generated image (results of tools may differ from the request size). */
async function generatedSize(image) {
	return await imageSize(new Blob([base64ToBytes(image.base64)], { type: image.mime }));
}
//#endregion
//#region src/features/sprites/sprite-service.ts
/** Character passports of a card that can get sprites (main character first). */
function spritePassports(characterIndex) {
	const character = ctx().characters[characterIndex];
	const list = cardPassports(character).filter((p) => p.kind === "character");
	const main = primaryPassport(list, character?.name ?? "");
	return main ? [main, ...list.filter((p) => p !== main)] : list;
}
function extraPassport(characterIndex, passportId) {
	if (!passportId) return null;
	const [main, ...rest] = spritePassports(characterIndex);
	return main?.id === passportId ? null : rest.find((p) => p.id === passportId) ?? null;
}
var extraFolder = null;
/**
* Where the sprites of another character of a card go instead of "<card>/<name>" (Doom's
* Enhancement Suite reads characters/<name>, v0.9); null keeps the default.
*/
function setExtraSpriteFolder(rule) {
	extraFolder = rule;
}
/**
* Folder Expressions reads for a character: its override, else the character name (RECON §2.12);
* another character of the card gets "<folder>/<name>" (or the integration's folder).
*/
function spriteFolder(characterIndex, passportId) {
	const base = cardSpriteFolder(characterIndex);
	const extra = extraPassport(characterIndex, passportId);
	const sub = extra?.name.replace(/[\\/:*?"<>|]+/g, " ").trim();
	if (!extra || !sub) return base;
	return extraFolder?.(sub) ?? (base ? `${base}/${sub}` : sub);
}
function cardSpriteFolder(characterIndex) {
	const c = ctx();
	const character = c.characters[characterIndex];
	const overrides = c.extensionSettings.expressionOverrides;
	const key = avatarKey(character?.avatar);
	if (Array.isArray(overrides)) {
		const found = overrides.find((o) => o?.name === key && o.path);
		if (found) return String(found.path);
	}
	return character?.name ?? "";
}
/** Appearance tags: the passport when the card has one, else the character prompt, else the name. */
function spriteAppearance(characterIndex, passportId) {
	const character = ctx().characters[characterIndex];
	const extra = extraPassport(characterIndex, passportId);
	if (extra) return passportTags(extra, { allowNsfw: false });
	const passport = cardPassport(character);
	if (passport) return passportTags(passport, { allowNsfw: false });
	return readCharacterPrompt(character).positive.trim() || character?.name || "";
}
function spriteLabels(selected) {
	return selected.length ? selected : [...EXPRESSION_LABELS];
}
async function uploadSprite(folder, label, image) {
	const png = await toPngBlob(base64ToBlob(image.base64, image.mime));
	const form = new FormData();
	const file = spriteFileName(label);
	form.append("name", folder);
	form.append("label", label);
	form.append("spriteName", file.replace(/\.png$/, ""));
	form.append("avatar", new File([png], file, { type: "image/png" }));
	const response = await fetch("/api/sprites/upload", {
		method: "POST",
		headers: requestHeaders(true),
		body: form
	});
	if (!response.ok) throw new NaiError("image-load-failed", "none", { status: response.status });
	return file;
}
var SpriteService = class {
	pipeline;
	constructor(pipeline) {
		this.pipeline = pipeline;
	}
	async draw(appearance, label, options, seed, base) {
		const caps = getCapabilities(isModelId(options.model) ? options.model : DEFAULT_MODEL);
		const image = (await this.pipeline.produce({
			initiator: "panel",
			trigger: label,
			scene: spritePrompt(appearance, label),
			mode: MODE.FREE,
			noContinuity: true,
			signal: options.signal,
			queue: {
				priority: "background",
				kind: "sprites"
			},
			overrides: {
				edit: false,
				generation: {
					model: options.model,
					seed,
					samples: 1,
					characters: [],
					...base ? {
						width: base.width,
						height: base.height
					} : {},
					transparentBackground: options.transparent && caps.transparency && !base
				}
			},
			...base ? { requestPatch: {
				mode: "img2img",
				image: base.image,
				strength: base.strength
			} } : {}
		}))?.images[0];
		if (!image) throw new NaiError("aborted", "none");
		return image;
	}
	async emotion(base, emotion, signal) {
		const transport = this.pipeline.studio.state.selection?.transport;
		if (!transport?.features.director || !transport.extras) throw new NaiError("feature-unavailable", "install-plugin", { feature: "Director Tools" });
		const blob = base64ToBlob(base.base64, base.mime);
		const bitmap = await createImageBitmap(blob);
		const size = directorSize(bitmap.width, bitmap.height);
		bitmap.close();
		const cost = directorToolCost("emotion", size.width, size.height, this.pipeline.studio.state.account);
		if (cost > 0) throw new NaiError("free-only-blocked", "enable-free-only", { cost });
		const body = directorBody("emotion", await blobToBase64$1(await toPngBlob(blob, size)), size, {
			emotion,
			defry: 0,
			prompt: ""
		});
		const extras = transport.extras;
		const [first] = await unzipImages(await generationQueue.run({
			priority: "background",
			kind: "sprites",
			...signal ? { signal } : {}
		}, (jobSignal) => extras.augment(body, {
			retryable: true,
			signal: jobSignal
		})));
		if (!first) throw new NaiError("invalid-response", "none", { preview: "empty ZIP" });
		return first;
	}
	async generate(options) {
		const folder = spriteFolder(options.characterIndex, options.passportId);
		if (!folder) throw new NaiError("image-not-found", "none");
		const appearance = spriteAppearance(options.characterIndex, options.passportId);
		const jobs = spriteLabels(options.labels).map((label) => ({
			label,
			status: "pending"
		}));
		const report = () => options.onProgress?.(jobs.map((j) => ({ ...j })));
		const seed = settings().generation.seed >= 0 ? settings().generation.seed : randomSeed();
		let base = null;
		const order = options.mode === "director" ? [...jobs].sort((a, b) => Number(b.label === "neutral") - Number(a.label === "neutral")) : jobs;
		report();
		for (const job of order) {
			if (options.signal?.aborted) break;
			job.status = "running";
			report();
			try {
				let image;
				if (options.mode === "seed") {
					image = await this.draw(appearance, job.label, options, seed);
					job.how = "seed";
				} else if (!base) {
					image = await this.draw(appearance, "neutral", options, seed);
					base = image;
					job.how = "base";
					if (job.label !== "neutral") image = await this.variant(base, appearance, job, options, seed);
				} else image = await this.variant(base, appearance, job, options, seed);
				job.file = await uploadSprite(folder, job.label, image);
				job.status = "done";
			} catch (error) {
				if (options.signal?.aborted) break;
				job.status = "failed";
				job.error = error?.message ?? String(error);
				log.warn("sprite failed", job.label, job.error);
			}
			report();
		}
		log.info("sprites", folder, jobs.filter((j) => j.status === "done").length, "of", jobs.length);
		return jobs;
	}
	async variant(base, appearance, job, options, seed) {
		const emotion = EXPRESSION_DIRECTOR[job.label];
		if (emotion) {
			job.how = "director";
			return await this.emotion(base, emotion, options.signal);
		}
		job.how = "img2img";
		const png = await toPngBlob(base64ToBlob(base.base64, base.mime));
		const bitmap = await createImageBitmap(png);
		const source = {
			image: await blobToBase64$1(png),
			width: bitmap.width,
			height: bitmap.height,
			strength: .6
		};
		bitmap.close();
		return await this.draw(appearance, job.label, options, seed, source);
	}
};
//#endregion
//#region src/ui/prompt-assist.ts
var dropdown = null;
var items = [];
var active = 0;
var target = null;
var remoteTimer = null;
var formatCount = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(n);
function list$1() {
	if (!dropdown) {
		dropdown = document.createElement("div");
		dropdown.className = "naist-ac naist-hidden";
		dropdown.setAttribute("role", "listbox");
		dropdown.addEventListener("mousedown", (event) => {
			const row = event.target.closest("[data-index]");
			if (!row) return;
			event.preventDefault();
			accept(Number(row.dataset.index));
		});
		document.body.append(dropdown);
	}
	return dropdown;
}
function hide() {
	dropdown?.classList.add("naist-hidden");
	items = [];
	target = null;
}
function render$1() {
	const el = list$1();
	if (!target || !items.length) {
		hide();
		return;
	}
	el.innerHTML = items.map((item, i) => `<div class="naist-ac-item${i === active ? " naist-ac-active" : ""} naist-ac-cat-${item.category}" data-index="${i}" role="option">
                <span>${escapeHtml$2(item.name)}</span><span class="naist-muted">${escapeHtml$2(item.hint)}</span></div>`).join("");
	const rect = target.field.getBoundingClientRect();
	el.style.left = `${Math.round(rect.left)}px`;
	el.style.top = `${Math.round(rect.bottom + 2)}px`;
	el.style.width = `${Math.round(Math.max(220, Math.min(rect.width, 420)))}px`;
	el.classList.remove("naist-hidden");
}
function fromLocal(suggestions) {
	return suggestions.map((s) => ({
		name: s.entry.name,
		hint: [
			s.via ? `← ${s.via}` : "",
			s.entry.count ? formatCount(s.entry.count) : "",
			TAG_CATEGORIES[s.entry.category] ?? ""
		].filter(Boolean).join(" · "),
		category: s.entry.category
	}));
}
function accept(index) {
	const item = items[index];
	if (!item || !target) return;
	const { field, start } = target;
	const cursor = field.selectionStart ?? field.value.length;
	const result = insertTag(field.value, start, cursor, item.name);
	field.value = result.text;
	field.setSelectionRange(result.cursor, result.cursor);
	field.dispatchEvent(new Event("input", { bubbles: true }));
	hide();
}
function modelOf(field, model) {
	return field.dataset.naistModel || model();
}
function suggest(field, model) {
	if (!settings().promptTools.autocomplete) return;
	const cursor = field.selectionStart ?? field.value.length;
	const { start, fragment } = currentFragment(field.value, cursor);
	if (fragment.length < 2 || /^\d*\.?\d*$/.test(fragment)) {
		hide();
		return;
	}
	const index = readyTagIndex();
	if (!index) {
		tagIndex().then((loaded) => loaded && suggest(field, model));
		return;
	}
	target = {
		field,
		start
	};
	items = fromLocal(suggestTags(index, fragment, 8));
	active = 0;
	render$1();
	if (remoteTimer) clearTimeout(remoteTimer);
	if (!settings().promptTools.remoteSuggest || items.length >= 8 || hasCyrillic(fragment)) return;
	remoteTimer = setTimeout(() => {
		remoteTagSuggestions(modelOf(field, model), fragment).then((remote) => {
			if (target?.field !== field) return;
			const known = new Set(items.map((i) => i.name));
			for (const r of remote) {
				if (items.length >= 10) break;
				if (known.has(r.tag)) continue;
				items.push({
					name: r.tag,
					hint: `NovelAI · ${formatCount(r.count)}`,
					category: 0
				});
			}
			render$1();
		});
	}, 300);
}
/** Line under the field: unknown tags and the translate button. */
function line(field) {
	const next = field.nextElementSibling;
	if (next instanceof HTMLElement && next.classList.contains("naist-assist")) return next;
	const el = document.createElement("div");
	el.className = "naist-assist";
	field.after(el);
	return el;
}
/** Negative prompt fields get tags only. */
function isNegativeField(field) {
	return /negative|(^|[-_\s])uc($|[-_\s])/i.test(`${field.className} ${field.id} ${field.dataset.naistRole ?? ""}`);
}
function refreshLine(field, model) {
	const el = line(field);
	const parts = [];
	const index = readyTagIndex();
	const id = modelOf(field, model);
	const family = getCapabilities(isModelId(id) ? id : DEFAULT_MODEL).family;
	if (field.value.trim() && needsInterpretation(field.value, family, "always", index)) parts.push(`<span class="menu_button naist-assist-translate" title="${escapeHtml$2(t("naist.interpret.buttonHint"))}">${escapeHtml$2(t("naist.interpret.button"))}</span>`);
	if (index && settings().promptTools.warnUnknown && !hasCyrillic(field.value)) {
		const unknown = unknownTags(index, field.value).slice(0, 8);
		if (unknown.length) parts.push(`<span class="naist-muted">${escapeHtml$2(t("naist.tags.unknown", { tags: unknown.join(", ") }))}</span>`);
	}
	el.innerHTML = parts.join(" ");
	el.classList.toggle("naist-hidden", parts.length === 0);
}
async function convertField(field, button, model) {
	button.classList.add("disabled");
	try {
		const original = field.value;
		const result = await interpretForModel(original, modelOf(field, model), {
			force: true,
			strict: true,
			negative: isNegativeField(field)
		});
		if (!result) {
			toastr.info(t("naist.interpret.already"), t("naist.interpret.title"));
			return;
		}
		rememberSource(result.prompt, original);
		field.value = result.prompt;
		field.dispatchEvent(new Event("input", { bubbles: true }));
		const done = t(result.cached ? "naist.interpret.cached" : "naist.interpret.done");
		const extra = result.unmatched.length ? ` ${t("naist.interpret.unmatched", { tags: result.unmatched.slice(0, 6).join(", ") })}` : "";
		toastr.info(done + extra, t("naist.interpret.title"));
	} catch (error) {
		reportGenerationError(error);
	} finally {
		button.classList.remove("disabled");
		refreshLine(field, model);
	}
}
/**
* Attaches the helpers to fields inside `root` that match `selector`. `model` gives the model the
* field is for (a field can override it with data-naist-model).
*/
function attachPromptAssist(root, selector, model) {
	const fieldOf = (el) => {
		const node = el;
		return node?.matches?.(selector) ? node : null;
	};
	let lineTimer = null;
	root.addEventListener("input", (event) => {
		const field = fieldOf(event.target);
		if (!field) return;
		suggest(field, model);
		if (lineTimer) clearTimeout(lineTimer);
		lineTimer = setTimeout(() => refreshLine(field, model), 400);
	});
	root.addEventListener("focusin", (event) => {
		const field = fieldOf(event.target);
		if (field) {
			tagIndex();
			refreshLine(field, model);
		}
	});
	root.addEventListener("focusout", (event) => {
		if (fieldOf(event.target)) setTimeout(hide, 150);
	});
	root.addEventListener("click", (event) => {
		const button = event.target.closest(".naist-assist-translate");
		const field = button?.parentElement?.previousElementSibling;
		if (button && field && fieldOf(field)) convertField(field, button, model);
	});
	root.addEventListener("keydown", (event) => {
		const field = fieldOf(event.target);
		if (!field) return;
		const e = event;
		if ((e.ctrlKey || e.metaKey) && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
			e.preventDefault();
			const id = modelOf(field, model);
			const numeric = getCapabilities(isModelId(id) ? id : DEFAULT_MODEL).v4Prompt;
			const edit = adjustWeight(field.value, field.selectionStart ?? 0, field.selectionEnd ?? 0, e.key === "ArrowUp" ? 1 : -1, numeric);
			field.value = edit.text;
			field.setSelectionRange(edit.start, edit.end);
			field.dispatchEvent(new Event("input", { bubbles: true }));
			hide();
			return;
		}
		if (!target || target.field !== field || !items.length) return;
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			active = (active + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length;
			render$1();
		} else if (e.key === "Enter" || e.key === "Tab") {
			e.preventDefault();
			accept(active);
		} else if (e.key === "Escape") {
			e.preventDefault();
			hide();
		}
	});
}
//#endregion
//#region src/ui/pose-helpers.ts
function poseLabel(id) {
	const custom = settings().poses.custom.find((p) => p.id === id);
	if (custom) return custom.name || custom.tags;
	return t(`naist.pose.${id}`);
}
/** Grouped options: favorites, then each category; custom poses keep their own names. */
function poseSelectOptions(current, emptyKey = "naist.passport.noPose") {
	const library = poseLibrary();
	const favorites = settings().poses.favorites;
	const option = (id) => `<option value="${escapeHtml$2(id)}"${id === current ? " selected" : ""}>${escapeHtml$2(poseLabel(id))}</option>`;
	const groups = [`<option value="">${escapeHtml$2(t(emptyKey))}</option>`];
	const favs = library.filter((p) => favorites.includes(p.id));
	if (favs.length) groups.push(`<optgroup label="★ ${escapeHtml$2(t("naist.pose.favorites"))}">${favs.map((p) => option(p.id)).join("")}</optgroup>`);
	for (const category of POSE_CATEGORIES) {
		const list = library.filter((p) => p.category === category);
		if (list.length) groups.push(`<optgroup label="${escapeHtml$2(t(`naist.poseCat.${category}`))}">${list.map((p) => option(p.id)).join("")}</optgroup>`);
	}
	return groups.join("");
}
//#endregion
//#region src/ui/passport-editor.ts
function stateLabel(state) {
	return state.id in STATE_PRESETS ? t(`naist.state.${state.id}`) : state.id;
}
/** Opens the editor; resolves with the edited passport or null when cancelled. */
async function editPassport(name, initial, options = {}) {
	return (await openEditor(name, {
		card: structuredClone(initial ?? defaultPassport()),
		chat: null
	}, "card", null, options))?.passport ?? null;
}
/** The editor with the scope switch; resolves with the edited passport and where to save it. */
async function editPassportIn(name, scopes, options = {}) {
	return await openEditor(name, {
		card: scopes.card ? structuredClone(scopes.card) : null,
		chat: structuredClone(scopes.chat)
	}, scopes.card ? scopes.initial : "chat", scopes, options);
}
var editorCount = 0;
async function openEditor(name, drafts, initialScope, scopes, options) {
	const c = ctx();
	let scope = initialScope;
	let passport = drafts[scope] ?? drafts.card ?? drafts.chat;
	const root = document.createElement("div");
	root.className = "naist-dialog naist-passport";
	const radioName = `naist-passport-scope-${++editorCount}`;
	const renderOutfits = () => `
        ${passport.outfits.map((o, i) => `<div class="naist-row naist-outfit" data-index="${i}">
                    <input class="text_pole naist-outfit-name" value="${escapeHtml$2(o.name)}" placeholder="${escapeHtml$2(t("naist.passport.outfitName"))}">
                    <input class="text_pole naist-grow naist-outfit-tags" value="${escapeHtml$2(o.tags)}" placeholder="${escapeHtml$2(t("naist.passport.outfitTags"))}">
                    <div class="menu_button fa-solid fa-trash-can naist-outfit-remove" title="${escapeHtml$2(t("naist.passport.remove"))}"></div>
                </div>`).join("")}
        <div class="menu_button naist-outfit-add">${escapeHtml$2(t("naist.passport.addOutfit"))}</div>`;
	const renderStates = () => passport.states.map((s, i) => `<div class="naist-row naist-state" data-index="${i}">
                    <label class="checkbox_label"><input type="checkbox" class="naist-state-on"${s.enabled ? " checked" : ""}><span>${escapeHtml$2(stateLabel(s))}</span></label>
                    <input class="text_pole naist-grow naist-state-tags" value="${escapeHtml$2(s.tags)}">
                </div>`).join("") + `<div class="naist-row"><input class="text_pole naist-grow naist-state-new" placeholder="${escapeHtml$2(t("naist.passport.newState"))}"><div class="menu_button naist-state-add">${escapeHtml$2(t("naist.passport.addState"))}</div></div>`;
	const scopeBar = scopes ? `<div class="naist-row naist-passport-scope">
            <span>${escapeHtml$2(t("naist.passport.scope"))}</span>
            <label class="checkbox_label"><input type="radio" name="${radioName}" value="card"${drafts.card ? "" : " disabled"}><span>${escapeHtml$2(t(scopes.persona ? "naist.passport.scopePersona" : "naist.passport.scopeCard"))}</span></label>
            <label class="checkbox_label"><input type="radio" name="${radioName}" value="chat"><span>${escapeHtml$2(t("naist.passport.scopeChat"))}</span></label>
            <div class="menu_button naist-passport-scope-reset"><i class="fa-solid fa-rotate-left"></i> ${escapeHtml$2(t("naist.passport.scopeReset"))}</div>
        </div>
        <div class="naist-hint naist-passport-scope-hint"></div>` : "";
	const formHtml = () => {
		const identity = options.identity ? `<div class="naist-grid2">
                <div><label>${escapeHtml$2(t("naist.passport.name"))}</label>
                    <input class="text_pole naist-passport-name" value="${escapeHtml$2(passport.name)}" placeholder="${escapeHtml$2(name)}"></div>
                <div><label>${escapeHtml$2(t("naist.passport.kind"))}</label>
                    <select class="text_pole naist-passport-kind">${PASSPORT_KINDS.map((k) => `<option value="${k}"${k === passport.kind ? " selected" : ""}>${escapeHtml$2(t(`naist.passport.kind.${k}`))}</option>`).join("")}</select></div>
            </div>
            <label>${escapeHtml$2(t("naist.passport.aliases"))}</label>
            <input class="text_pole naist-passport-aliases" value="${escapeHtml$2(passport.aliases.join(", "))}" placeholder="${escapeHtml$2(t("naist.passport.aliasesHint"))}">` : "";
		return `
            ${options.generate ? `<div class="naist-row"><div class="menu_button naist-passport-generate"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml$2(t("naist.passport.generateOne"))}</div><span class="naist-muted">${escapeHtml$2(t("naist.passport.generateHint"))}</span></div>` : ""}
            ${identity}
            <div class="naist-passport-tags-box">
                <label>${escapeHtml$2(t("naist.passport.tags"))}</label>
                <textarea class="text_pole textarea_compact naist-slot-input naist-passport-tags" rows="3">${escapeHtml$2(passport.tags)}</textarea>
                <div class="naist-hint">${escapeHtml$2(t("naist.passport.tagsHint"))}</div>
            </div>
            <div class="naist-passport-character">
            <div class="naist-grid2">${PASSPORT_SLOTS.map((slot) => `<div><label>${escapeHtml$2(t(`naist.slot.${slot}`))}</label>
                    <textarea class="text_pole textarea_compact naist-slot-input" data-slot="${slot}" rows="2">${escapeHtml$2(passport.slots[slot])}</textarea></div>`).join("")}</div>
            <div class="naist-section">
                <b>${escapeHtml$2(t("naist.passport.outfits"))}</b>
                <div class="naist-hint">${escapeHtml$2(t("naist.passport.outfitsHint"))}</div>
                <div class="naist-outfits">${renderOutfits()}</div>
                <label>${escapeHtml$2(t("naist.passport.activeOutfit"))}</label>
                <select class="text_pole naist-active-outfit"></select>
            </div>
            <div class="naist-section">
                <b>${escapeHtml$2(t("naist.passport.states"))}</b>
                <div class="naist-states">${renderStates()}</div>
            </div>
            <div class="naist-section">
                <label class="checkbox_label"><input type="checkbox" class="naist-nsfw-on"${passport.nsfw.enabled ? " checked" : ""}><span>${escapeHtml$2(t("naist.passport.nsfw"))}</span></label>
                <textarea class="text_pole textarea_compact naist-nsfw-tags" rows="2">${escapeHtml$2(passport.nsfw.tags)}</textarea>
                <div class="naist-hint">${escapeHtml$2(t("naist.passport.nsfwHint"))}</div>
            </div>
            <div class="naist-grid2">
                <div><label>${escapeHtml$2(t("naist.passport.pose"))}</label><select class="text_pole naist-pose">${poseSelectOptions(passport.pose.preset)}</select></div>
                <div><label>${escapeHtml$2(t("naist.passport.poseTags"))}</label><input class="text_pole naist-pose-tags" value="${escapeHtml$2(passport.pose.custom)}"></div>
            </div>
            <div class="naist-row">
                <label class="checkbox_label"><input type="checkbox" class="naist-pos-on"${passport.position ? " checked" : ""}><span>${escapeHtml$2(t("naist.passport.position"))}</span></label>
                <input type="number" min="0" max="1" step="0.1" class="text_pole naist-pos-x" value="${passport.position?.x ?? .5}" title="x">
                <input type="number" min="0" max="1" step="0.1" class="text_pole naist-pos-y" value="${passport.position?.y ?? .5}" title="y">
            </div>
            </div>
            <label>${escapeHtml$2(t("naist.passport.negative"))}</label>
            <textarea class="text_pole textarea_compact naist-negative" rows="2">${escapeHtml$2(passport.negative)}</textarea>`;
	};
	root.innerHTML = `
        <h3 class="naist-passport-title"></h3>
        <div class="naist-hint">${escapeHtml$2(t("naist.passport.hint"))}</div>
        ${scopeBar}
        <div class="naist-passport-form"></div>`;
	const form = root.querySelector(".naist-passport-form");
	const q = (selector) => form.querySelector(selector);
	const outfitsBox = () => q(".naist-outfits");
	const statesBox = () => q(".naist-states");
	const activeSelect = () => q(".naist-active-outfit");
	const applyKind = () => {
		const kind = q(".naist-passport-kind")?.value ?? passport.kind;
		q(".naist-passport-character")?.classList.toggle("naist-hidden", kind !== "character");
		q(".naist-passport-tags-box")?.classList.toggle("naist-hidden", kind === "character");
	};
	const readOutfits = () => {
		const box = outfitsBox();
		if (!box) return;
		passport.outfits = [...box.querySelectorAll(".naist-outfit")].map((row) => {
			const looks = passport.outfits[Number(row.dataset.index)]?.looks;
			return {
				name: row.querySelector(".naist-outfit-name")?.value.trim() ?? "",
				tags: row.querySelector(".naist-outfit-tags")?.value ?? "",
				...looks?.length ? { looks: [...looks] } : {}
			};
		});
	};
	const readStates = () => {
		statesBox()?.querySelectorAll(".naist-state").forEach((row) => {
			const state = passport.states[Number(row.dataset.index)];
			if (!state) return;
			state.enabled = row.querySelector(".naist-state-on")?.checked === true;
			state.tags = row.querySelector(".naist-state-tags")?.value ?? "";
		});
	};
	const fillActive = () => {
		const select = activeSelect();
		if (!select) return;
		const current = passport.activeOutfit;
		select.innerHTML = [`<option value="">${escapeHtml$2(t("naist.passport.clothingSlot"))}</option>`, ...passport.outfits.filter((o) => o.name).map((o) => `<option value="${escapeHtml$2(o.name)}">${escapeHtml$2(o.name)}</option>`)].join("");
		select.value = passport.outfits.some((o) => o.name === current) ? current : "";
	};
	/** The form's values into the passport shown (before saving or switching the scope). */
	const readForm = () => {
		form.querySelectorAll(".naist-slot-input[data-slot]").forEach((area) => {
			const slot = area.dataset.slot;
			if (slot) passport.slots[slot] = area.value.trim();
		});
		passport.tags = q(".naist-passport-tags")?.value.trim() ?? passport.tags;
		if (options.identity) {
			passport.name = q(".naist-passport-name")?.value.trim() ?? passport.name;
			passport.kind = q(".naist-passport-kind")?.value ?? passport.kind;
			passport.aliases = (q(".naist-passport-aliases")?.value ?? "").split(",").map((a) => a.trim()).filter(Boolean);
		}
		readOutfits();
		passport.outfits = passport.outfits.filter((o) => o.name);
		const active = activeSelect()?.value ?? "";
		passport.activeOutfit = passport.outfits.some((o) => o.name === active) ? active : "";
		readStates();
		passport.nsfw = {
			enabled: q(".naist-nsfw-on")?.checked === true,
			tags: q(".naist-nsfw-tags")?.value.trim() ?? ""
		};
		passport.negative = q(".naist-negative")?.value.trim() ?? "";
		passport.pose = {
			preset: q(".naist-pose")?.value ?? "",
			custom: q(".naist-pose-tags")?.value.trim() ?? ""
		};
		const usePosition = q(".naist-pos-on")?.checked === true;
		const clamp = (v) => Math.min(1, Math.max(0, Number(v) || .5));
		passport.position = usePosition ? {
			x: clamp(q(".naist-pos-x")?.value),
			y: clamp(q(".naist-pos-y")?.value)
		} : null;
	};
	const renderScope = () => {
		if (!scopes) return;
		root.querySelectorAll(`input[name="${radioName}"]`).forEach((radio) => {
			radio.checked = radio.value === scope;
		});
		const hint = root.querySelector(".naist-passport-scope-hint");
		if (hint) hint.textContent = t(!drafts.card ? "naist.passport.scopeChatOnly" : scope === "chat" ? "naist.passport.scopeChatHint" : "naist.passport.scopeCardHint");
		root.querySelector(".naist-passport-scope-reset")?.classList.toggle("naist-hidden", scope !== "chat" || !scopes.card);
	};
	const renderForm = () => {
		const title = root.querySelector(".naist-passport-title");
		if (title) title.textContent = t("naist.passport.title", { name: passport.name || name });
		form.innerHTML = formHtml();
		fillActive();
		applyKind();
		renderScope();
		localize(root);
	};
	const fill = (generated) => {
		form.querySelectorAll(".naist-slot-input[data-slot]").forEach((area) => {
			const slot = area.dataset.slot;
			if (slot && generated.slots[slot]) area.value = generated.slots[slot];
		});
		const tags = q(".naist-passport-tags");
		if (tags && generated.tags) tags.value = generated.tags;
		const nsfw = q(".naist-nsfw-tags");
		if (nsfw && generated.nsfw.tags) nsfw.value = generated.nsfw.tags;
		const negative = q(".naist-negative");
		if (negative && generated.negative) negative.value = generated.negative;
		const aliases = q(".naist-passport-aliases");
		if (aliases && generated.aliases.length) aliases.value = generated.aliases.join(", ");
		if (generated.outfits.length) {
			readOutfits();
			const names = new Set(passport.outfits.map((o) => o.name.toLowerCase()));
			passport.outfits.push(...generated.outfits.filter((o) => !names.has(o.name.toLowerCase())));
			const box = outfitsBox();
			if (box) box.innerHTML = renderOutfits();
			fillActive();
		}
	};
	const switchScope = (next) => {
		const target = drafts[next];
		if (next === scope || !target) {
			renderScope();
			return;
		}
		readForm();
		scope = next;
		passport = target;
		renderForm();
	};
	root.addEventListener("change", (event) => {
		const target = event.target;
		if (target instanceof HTMLInputElement && target.name === radioName) switchScope(target.value === "chat" ? "chat" : "card");
		else if (target.classList.contains("naist-passport-kind")) applyKind();
		else if (target.closest(".naist-outfits")) {
			readOutfits();
			fillActive();
		}
	});
	root.addEventListener("click", (event) => {
		const target = event.target;
		if (target.closest(".naist-passport-scope-reset") && scopes?.card) {
			drafts.chat = structuredClone(scopes.card);
			passport = drafts.chat;
			renderForm();
			return;
		}
		const generateButton = target.closest(".naist-passport-generate");
		if (generateButton && options.generate && !generateButton.classList.contains("disabled")) {
			generateButton.classList.add("disabled");
			options.generate().then((generated) => {
				fill(generated);
				toastr.success(t("naist.passport.generated"));
			}).catch(reportGenerationError).finally(() => generateButton.classList.remove("disabled"));
			return;
		}
		const box = outfitsBox();
		if (target.classList.contains("naist-outfit-add") && box) {
			readOutfits();
			passport.outfits.push({
				name: t("naist.passport.outfitDefault", { n: passport.outfits.length + 1 }),
				tags: ""
			});
			box.innerHTML = renderOutfits();
			fillActive();
		} else if (target.classList.contains("naist-outfit-remove") && box) {
			readOutfits();
			passport.outfits.splice(Number(target.closest(".naist-outfit")?.dataset.index), 1);
			box.innerHTML = renderOutfits();
			fillActive();
		} else if (target.classList.contains("naist-state-add")) {
			readStates();
			const id = q(".naist-state-new")?.value.trim() ?? "";
			if (id && !passport.states.some((s) => s.id === id)) passport.states.push({
				id,
				tags: id,
				enabled: true
			});
			const states = statesBox();
			if (states) states.innerHTML = renderStates();
		}
	});
	renderForm();
	attachPromptAssist(root, ".naist-slot-input, .naist-nsfw-tags, .naist-negative", () => settings().generation.model);
	if (await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.passport.save"),
		cancelButton: t("naist.inspector.cancel"),
		wide: true,
		large: true,
		allowVerticalScrolling: true
	}) !== c.POPUP_RESULT.AFFIRMATIVE) return null;
	readForm();
	return {
		passport,
		scope
	};
}
//#endregion
//#region src/ui/passport-scope.ts
/** Edits and saves; resolves with the passport as the chat now sees it, or null when cancelled. */
async function editLocatedPassport(name, located, options = {}) {
	if (!chatOpen()) {
		if (!located.base) return null;
		const edited = await editPassport(name, located.base, options);
		if (!edited) return null;
		await savePassportIn(located, edited, "card");
		toastr.success(t("naist.passport.saved", { name: edited.name || name }));
		return resolvedAfterSave(located, edited, "card");
	}
	const scoped = await editPassportIn(name, {
		card: located.base,
		chat: located.resolved,
		initial: located.overridden ? "chat" : "card",
		persona: located.owner.type === "persona"
	}, options);
	if (!scoped) return null;
	await savePassportIn(located, scoped.passport, scoped.scope);
	const label = scoped.passport.name || name;
	toastr.success(t(scoped.scope === "chat" ? "naist.passport.savedChat" : "naist.passport.saved", { name: label }));
	return resolvedAfterSave(located, scoped.passport, scoped.scope);
}
//#endregion
//#region src/integration/command-args.ts
/** Built-in arguments without a NovelAI meaning (SD-WebUI/ComfyUI specific). */
var IGNORED_ARGS = [
	"skip",
	"vae",
	"upscaler",
	"hires",
	"scale",
	"denoise",
	"2ndpass",
	"faces"
];
var MODEL_ALIASES = {
	v5: "nai-diffusion-5-full",
	"v5-full": "nai-diffusion-5-full",
	"v5-curated": "nai-diffusion-5-curated",
	"v4.5": "nai-diffusion-4-5-full",
	"v4.5-full": "nai-diffusion-4-5-full",
	"v4.5-curated": "nai-diffusion-4-5-curated",
	v4: "nai-diffusion-4-full",
	"v4-full": "nai-diffusion-4-full",
	"v4-curated": "nai-diffusion-4-curated-preview",
	v3: "nai-diffusion-3",
	"anime-v3": "nai-diffusion-3",
	furry: "nai-diffusion-furry-3",
	"furry-v3": "nai-diffusion-furry-3"
};
/** Same coercion as the built-in: anything that is not explicitly false counts as true. */
function boolArg(value) {
	const text = String(value).trim().toLowerCase();
	if (["on", "true"].includes(text)) return true;
	return !["off", "false"].includes(text);
}
function numberArg(value) {
	const n = Number(value);
	return value === void 0 || value === "" || !Number.isFinite(n) ? void 0 : n;
}
function resolveModel(value) {
	const key = value.trim().toLowerCase();
	const id = MODEL_ALIASES[key] ?? key;
	return isModelId(id) ? id : void 0;
}
function parseCommandArgs(args) {
	const has = (name) => args[name] !== void 0 && !name.startsWith("_");
	const overrides = {};
	const generation = {};
	const ignored = [];
	const invalid = [];
	if (has("quiet")) overrides.quiet = boolArg(args.quiet);
	if (has("gallery")) overrides.gallery = boolArg(args.gallery);
	if (has("negative")) overrides.negative = String(args.negative);
	if (has("extend")) overrides.extend = boolArg(args.extend);
	if (has("edit")) overrides.edit = boolArg(args.edit);
	if (has("multimodal")) overrides.multimodal = boolArg(args.multimodal);
	if (has("snap")) overrides.snap = boolArg(args.snap);
	if (has("processing")) {
		const value = String(args.processing).toLowerCase();
		if (value.includes("minimal")) overrides.minimalProcessing = true;
		else if (value.includes("standard")) overrides.minimalProcessing = false;
		else invalid.push("processing");
	}
	for (const [name, key] of [
		["seed", "seed"],
		["width", "width"],
		["height", "height"],
		["steps", "steps"],
		["cfg", "scale"],
		["cfgrescale", "cfgRescale"],
		["samples", "samples"]
	]) {
		if (!has(name)) continue;
		const value = numberArg(args[name]);
		if (value === void 0) invalid.push(name);
		else generation[key] = value;
	}
	if (has("model")) {
		const model = resolveModel(String(args.model));
		if (model) generation.model = model;
		else invalid.push("model");
	}
	const enums = [
		[
			"sampler",
			"sampler",
			SAMPLERS
		],
		[
			"scheduler",
			"noiseSchedule",
			NOISE_SCHEDULES
		],
		[
			"uc",
			"ucPreset",
			UC_PRESETS
		],
		[
			"quality",
			"qualityPreset",
			QUALITY_PRESETS
		]
	];
	for (const [name, key, allowed] of enums) {
		if (!has(name)) continue;
		const value = String(args[name]);
		if (allowed.includes(value)) generation[key] = value;
		else invalid.push(name);
	}
	for (const [name, key] of [
		["smea", "smea"],
		["dyn", "smeaDyn"],
		["variety", "varietyBoost"],
		["decrisper", "decrisper"],
		["transparent", "transparentBackground"]
	]) if (has(name)) generation[key] = boolArg(args[name]);
	if (has("smea")) generation.autoSmea = false;
	for (const name of IGNORED_ARGS) if (has(name)) ignored.push(name);
	if (Object.keys(generation).length > 0) overrides.generation = generation;
	return {
		overrides,
		ignored,
		invalid
	};
}
//#endregion
//#region src/integration/commands.ts
function namedArguments() {
	const { SlashCommandNamedArgument: Arg, ARGUMENT_TYPE: T } = ctx();
	const named = (name, type, enumList, defaultValue) => Arg.fromProps({
		name,
		description: t(`naist.command.arg.${name}`),
		typeList: [type],
		isRequired: false,
		...enumList ? { enumList: [...enumList] } : {},
		...defaultValue !== void 0 ? { defaultValue } : {}
	});
	return [
		named("quiet", T.BOOLEAN ?? "bool", void 0, "false"),
		named("gallery", T.BOOLEAN ?? "bool", void 0, "true"),
		named("negative", T.STRING ?? "string"),
		named("extend", T.BOOLEAN ?? "bool"),
		named("edit", T.BOOLEAN ?? "bool"),
		named("multimodal", T.BOOLEAN ?? "bool"),
		named("snap", T.BOOLEAN ?? "bool"),
		named("processing", T.STRING ?? "string", ["standard", "minimal"]),
		named("seed", T.NUMBER ?? "number"),
		named("width", T.NUMBER ?? "number"),
		named("height", T.NUMBER ?? "number"),
		named("steps", T.NUMBER ?? "number"),
		named("cfg", T.NUMBER ?? "number"),
		named("cfgrescale", T.NUMBER ?? "number"),
		named("samples", T.NUMBER ?? "number"),
		named("model", T.STRING ?? "string", [...MODEL_IDS, ...Object.keys(MODEL_ALIASES)]),
		named("sampler", T.STRING ?? "string", SAMPLERS),
		named("scheduler", T.STRING ?? "string", NOISE_SCHEDULES),
		named("uc", T.STRING ?? "string", UC_PRESETS),
		named("quality", T.STRING ?? "string", QUALITY_PRESETS),
		named("smea", T.BOOLEAN ?? "bool"),
		named("dyn", T.BOOLEAN ?? "bool"),
		named("variety", T.BOOLEAN ?? "bool"),
		named("decrisper", T.BOOLEAN ?? "bool"),
		named("transparent", T.BOOLEAN ?? "bool"),
		...IGNORED_ARGS.map((name) => named(name, T.STRING ?? "string"))
	];
}
var portraitHook = null;
/** The DES integration recognises its own portrait prompts here. */
function setPortraitHook(hook) {
	portraitHook = hook;
}
function imagineCallback(pipeline) {
	return async (args, value) => {
		const parsed = parseCommandArgs(args);
		if (parsed.ignored.length) log.info("ignored (not applicable to NovelAI):", parsed.ignored.join(", "));
		if (parsed.invalid.length) toastr.warning(t("naist.command.invalidArgs", { args: parsed.invalid.join(", ") }));
		const controller = new AbortController();
		args._abortController?.addEventListener?.("abort", () => controller.abort());
		try {
			const trigger = String(value ?? "");
			const plan = parsed.overrides.quiet && portraitHook ? await portraitHook(trigger) : null;
			return (plan ? await pipeline.generatePicture({
				initiator: "command",
				trigger: plan.scene,
				scene: plan.scene,
				mode: MODE.FREE,
				interpret: "auto",
				overrides: {
					...parsed.overrides,
					edit: false,
					negative: plan.negative ?? parsed.overrides.negative,
					generation: {
						...parsed.overrides.generation,
						...plan.generation
					}
				},
				signal: controller.signal,
				queue: {
					priority: plan.priority ?? "portrait",
					kind: "portrait"
				}
			}) : await pipeline.generatePicture({
				initiator: "command",
				trigger,
				overrides: parsed.overrides,
				signal: controller.signal,
				...parsed.overrides.quiet ? { queue: { priority: "portrait" } } : {}
			}))?.path ?? "";
		} catch (error) {
			reportGenerationError(error);
			return "";
		}
	};
}
function styleCallback() {
	return async (_args, value) => {
		const name = String(value ?? "").trim();
		const prompts = settings().prompts;
		if (!name) return prompts.activeStyle;
		const style = prompts.styles.find((s) => s.name.toLowerCase() === name.toLowerCase());
		if (!style) {
			toastr.warning(t("naist.command.styleMissing", { name }));
			return prompts.activeStyle;
		}
		applyStyle(settings(), style);
		saveSettings();
		notifyExternalChange();
		return style.name;
	};
}
function registerCommands$1(pipeline, compat) {
	const { SlashCommandParser: parser, SlashCommand: Command, SlashCommandArgument: Arg, ARGUMENT_TYPE: T } = ctx();
	const triggerArg = () => Arg.fromProps({
		description: t("naist.command.trigger"),
		typeList: [T.STRING ?? "string"],
		isRequired: false,
		enumList: Object.values(TRIGGER_WORDS)
	});
	const imagine = (name, aliases) => Command.fromProps({
		name,
		aliases,
		callback: imagineCallback(pipeline),
		returns: t("naist.command.returns"),
		namedArgumentList: namedArguments(),
		unnamedArgumentList: [triggerArg()],
		helpString: t("naist.command.help")
	});
	parser.addCommandObject(imagine("nai", ["nai-imagine"]));
	const styleAliases = compat ? [
		"sd-style",
		"img-style",
		"nai-style"
	] : [];
	parser.addCommandObject(Command.fromProps({
		name: compat ? "imagine-style" : "nai-style",
		aliases: styleAliases,
		callback: styleCallback(),
		returns: t("naist.command.styleReturns"),
		unnamedArgumentList: [Arg.fromProps({
			description: t("naist.command.styleName"),
			typeList: [T.STRING ?? "string"],
			isRequired: false
		})],
		helpString: t("naist.command.styleHelp")
	}));
	if (!compat) return;
	parser.addCommandObject(imagine("imagine", [
		"sd",
		"img",
		"image"
	]));
	parser.addCommandObject(Command.fromProps({
		name: "imagine-source",
		aliases: ["sd-source", "img-source"],
		callback: async (_args, value) => {
			if (String(value ?? "").trim() && String(value).trim() !== "novel") toastr.info(t("naist.command.sourceFixed"));
			return "novel";
		},
		returns: t("naist.command.sourceReturns"),
		unnamedArgumentList: [Arg.fromProps({
			description: t("naist.command.sourceName"),
			typeList: [T.STRING ?? "string"],
			isRequired: false
		})],
		helpString: t("naist.command.sourceHelp")
	}));
}
//#endregion
//#region src/features/characters/persona-avatar.ts
/** Framing of an avatar portrait. */
var AVATAR_FRAMING = "portrait, upper body, looking at viewer, simple background";
/** One portrait from the passport (free size on Opus); null when cancelled. */
async function drawPersonaAvatar(pipeline, passport) {
	const scene = joinTags(passportTags(passport, { allowNsfw: false }), AVATAR_FRAMING);
	const size = markerDimensions("portrait", void 0, true);
	return (await pipeline.produce({
		initiator: "panel",
		trigger: scene,
		scene,
		mode: MODE.FREE,
		interpret: "auto",
		noContinuity: true,
		overrides: {
			quiet: true,
			edit: false,
			negative: passport.negative,
			generation: {
				width: size.width,
				height: size.height,
				seed: -1,
				samples: 1,
				characters: []
			}
		}
	}))?.images[0] ?? null;
}
var imageDataUrl = (image) => `data:${image.mime};base64,${image.base64}`;
/**
* Replaces the avatar file of a persona. Returns false when the user closed the crop popup.
* `file` is the persona's avatar file name (personas.js user_avatar).
*/
async function uploadPersonaAvatar(file, image) {
	const c = ctx();
	let url = "/api/avatars/upload";
	if (c.powerUserSettings.never_resize_avatars !== true) {
		const popup = new c.Popup("", c.POPUP_TYPE.CROP ?? 5, "", { cropImage: imageDataUrl(image) });
		if (!await popup.show()) return false;
		const crop = popup.cropData;
		if (crop !== void 0) url += `?crop=${encodeURIComponent(JSON.stringify(crop))}`;
	}
	const form = new FormData();
	const extension = image.mime === "image/webp" ? "webp" : "png";
	form.append("avatar", new File([base64ToBlob(image.base64, image.mime)], `avatar.${extension}`, { type: image.mime }));
	form.append("overwrite_name", file);
	const response = await fetch(url, {
		method: "POST",
		headers: requestHeaders(true),
		cache: "no-cache",
		body: form
	});
	if (!response.ok) throw new Error(`persona avatar upload failed: HTTP ${response.status}`);
	const { path = file } = await response.json().catch(() => ({})) ?? {};
	const avatarUrl = `/User Avatars/${encodeURIComponent(path)}`;
	const thumbnailUrl = c.getThumbnailUrl("persona", path);
	await fetch(avatarUrl, { cache: "reload" }).catch(() => null);
	await fetch(thumbnailUrl, { cache: "reload" }).catch(() => null);
	try {
		await (await importHost("/scripts/personas.js")).getUserAvatars?.(true, path);
	} catch {}
	const encoded = encodeURIComponent(path);
	document.querySelectorAll("img").forEach((img) => {
		const src = img.getAttribute("src") ?? "";
		if (!src.includes(encoded) && !src.includes(path)) return;
		img.src = "";
		img.src = src;
	});
	return true;
}
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
//#region src/ui/composer.ts
/** Where the saved passport of a participant lives (card, persona or the chat); null without one. */
async function locateCandidatePassport(key, passportId) {
	if (!passportId || key.startsWith("provided#")) return null;
	if (key.startsWith(PERSONA_PREFIX)) return locatePassport(passportId, { persona: key.slice(PERSONA_PREFIX.length) });
	if (key.startsWith("chat#")) {
		const found = locatePassport(passportId);
		return found?.owner.type === "chat" ? found : null;
	}
	const index = cardIndexByAvatar(key.split("#")[0] ?? "");
	if (index < 0) return null;
	await loadCharacter(index);
	return locatePassport(passportId, { index });
}
var COLORS = [
	"#e57373",
	"#64b5f6",
	"#81c784",
	"#ffb74d",
	"#ba68c8",
	"#4dd0e1",
	"#f06292",
	"#aed581"
];
function options(list, prefix, current) {
	return list.map((o) => `<option value="${o.id}"${o.id === current ? " selected" : ""}>${escapeHtml$2(t(`${prefix}.${o.id}`))}</option>`).join("");
}
async function openComposer(service, pipeline, opts) {
	const c = ctx();
	const loaded = opts.auto ? await service.autoSpec() : await service.emptySpec();
	let candidates = loaded.candidates;
	const spec = loaded.spec;
	if (opts.focusKey && !spec.participants.some((p) => p.key === opts.focusKey)) {
		const candidate = candidates.find((x) => x.key === opts.focusKey);
		if (candidate) spec.participants.unshift(participantFrom(candidate, {
			x: .5,
			y: .5
		}));
		relayout();
	}
	let target = settings().scene.target;
	const root = document.createElement("div");
	root.className = "naist-dialog naist-composer";
	function relayout(keepPositions = false) {
		const caps = currentCaps();
		const locked = spec.participants.map((p) => keepPositions ? p.position : p.passport?.position ?? null);
		const positions = autoLayout(spec.participants.length, caps, locked);
		spec.participants.forEach((p, i) => p.position = positions[i] ?? p.position);
		applyPairLayout(spec, caps);
	}
	const caps = () => currentCaps();
	const over = (index) => caps().maxCharacters > 0 && spec.participants.filter((p, i) => p.enabled && i <= index).length > caps().maxCharacters;
	const renderSlots = () => spec.participants.map((p, i) => {
		const outfits = p.passport?.outfits ?? [];
		const states = p.passport?.states ?? Object.keys(STATE_PRESETS).map((id) => ({
			id,
			tags: "",
			enabled: false
		}));
		return `
            <div class="naist-slot${over(i) ? " naist-disabled" : ""}" data-index="${i}" style="border-left-color:${COLORS[i % COLORS.length]}">
                <div class="naist-row">
                    <b class="naist-grow">${i + 1}. ${escapeHtml$2(p.name)}</b>
                    ${p.passport ? "" : `<span class="naist-badge naist-badge-warn">${escapeHtml$2(t("naist.composer.noPassport"))}</span>`}
                    ${over(i) ? `<span class="naist-badge naist-badge-warn">${escapeHtml$2(t("naist.composer.overLimit"))}</span>` : ""}
                    <label class="checkbox_label"><input type="checkbox" class="naist-slot-on"${p.enabled ? " checked" : ""}><span>${escapeHtml$2(t("naist.composer.inFrame"))}</span></label>
                    <div class="menu_button fa-solid fa-arrow-up naist-slot-up" title="${escapeHtml$2(t("naist.composer.up"))}"></div>
                    <div class="menu_button fa-solid fa-arrow-down naist-slot-down" title="${escapeHtml$2(t("naist.composer.down"))}"></div>
                    <div class="menu_button fa-solid fa-id-card naist-slot-passport" title="${escapeHtml$2(t("naist.composer.editPassport"))}"></div>
                    <div class="menu_button fa-solid fa-xmark naist-slot-remove" title="${escapeHtml$2(t("naist.composer.remove"))}"></div>
                </div>
                <div class="naist-grid3">
                    <div><label>${escapeHtml$2(t("naist.composer.pose"))}</label><select class="text_pole naist-slot-pose">${poseSelectOptions(p.pose)}</select></div>
                    <div><label>${escapeHtml$2(t("naist.composer.poseTags"))}</label><input class="text_pole naist-slot-pose-tags" value="${escapeHtml$2(p.poseTags)}"></div>
                    <div><label>${escapeHtml$2(t("naist.composer.outfit"))}</label><select class="text_pole naist-slot-outfit"${outfits.length ? "" : " disabled"}>
                        <option value="">${escapeHtml$2(t("naist.composer.outfitDefault"))}</option>
                        ${outfits.map((o) => `<option value="${escapeHtml$2(o.name)}"${o.name === p.outfit ? " selected" : ""}>${escapeHtml$2(o.name)}</option>`).join("")}
                    </select></div>
                </div>
                <div class="naist-flags naist-slot-states">${states.map((s) => {
			const on = s.enabled || p.states.includes(s.id);
			const label = s.id in STATE_PRESETS ? t(`naist.state.${s.id}`) : s.id;
			return `<label class="checkbox_label"><input type="checkbox" data-state="${escapeHtml$2(s.id)}"${on ? " checked" : ""}${s.enabled ? " disabled" : ""}><span>${escapeHtml$2(label)}</span></label>`;
		}).join("")}</div>
                <input class="text_pole naist-slot-negative" placeholder="${escapeHtml$2(t("naist.composer.negative"))}" value="${escapeHtml$2(p.negative)}">
            </div>`;
	}).join("");
	const renderCanvas = () => {
		const grid = caps().positioning === "grid";
		const lines = grid ? GRID_STEPS.map((v) => `<span class="naist-canvas-cell" style="left:${(v - .1) * 100}%;top:0;width:20%;height:100%"></span>`).join("") + GRID_STEPS.map((v) => `<span class="naist-canvas-cell" style="top:${(v - .1) * 100}%;left:0;height:20%;width:100%"></span>`).join("") : "";
		const markers = spec.participants.map((p, i) => p.enabled ? `<span class="naist-marker" data-index="${i}" style="left:${p.position.x * 100}%;top:${p.position.y * 100}%;background:${COLORS[i % COLORS.length]}" title="${escapeHtml$2(p.name)}">${i + 1}</span>` : "").join("");
		return `<div class="naist-canvas${grid ? " naist-canvas-grid" : ""}">${lines}${markers}</div>`;
	};
	const renderPair = () => {
		const names = spec.participants.map((p, i) => `<option value="${i}">${i + 1}. ${escapeHtml$2(p.name)}</option>`).join("");
		return `
            <select class="text_pole naist-pair-pose">
                <option value="">${escapeHtml$2(t("naist.composer.noPair"))}</option>
                ${PAIR_POSES.map((p) => `<option value="${p.id}"${spec.pair?.pose === p.id ? " selected" : ""}>${escapeHtml$2(t(`naist.pair.${p.id}`))}</option>`).join("")}
            </select>
            <select class="text_pole naist-pair-a">${names}</select>
            <select class="text_pole naist-pair-b">${names}</select>`;
	};
	const renderPreview = () => {
		const built = service.build(spec);
		const lines = [`${t("naist.composer.basePrompt")}: ${built.prompt || "—"}`, ...built.characters.map((ch, i) => `${i + 1}. ${ch.prompt}${ch.negative ? `  [−] ${ch.negative}` : ""}${built.useCoords ? `  @ (${ch.x}, ${ch.y})` : ""}`)];
		const warnings = [built.withoutPassport.length ? t("naist.composer.warnNoPassport", { names: built.withoutPassport.join(", ") }) : "", built.dropped.length ? t("naist.composer.warnDropped", {
			names: built.dropped.join(", "),
			max: caps().maxCharacters
		}) : ""].filter(Boolean);
		return `<pre class="naist-composer-preview">${escapeHtml$2(lines.join("\n"))}</pre>${warnings.map((w) => `<div class="naist-warning">${escapeHtml$2(w)}</div>`).join("")}`;
	};
	const available = () => candidates.filter((x) => !spec.participants.some((p) => p.key === x.key));
	const render = () => {
		const max = caps().maxCharacters;
		const full = max > 0 && spec.participants.length >= max;
		root.innerHTML = `
            <h3>${escapeHtml$2(t("naist.composer.title"))}</h3>
            <div class="naist-row">
                <div class="menu_button naist-c-auto"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml$2(t("naist.composer.auto"))}</div>
                <select class="text_pole naist-c-add"${full || !available().length ? " disabled" : ""}>
                    <option value="">${escapeHtml$2(full ? t("naist.composer.full", { max }) : t("naist.composer.add"))}</option>
                    ${available().map((x) => `<option value="${escapeHtml$2(x.key)}">${escapeHtml$2(x.name)}${x.isUser ? ` (${escapeHtml$2(t("naist.composer.persona"))})` : ""}</option>`).join("")}
                </select>
                <div class="menu_button naist-c-layout" title="${escapeHtml$2(t("naist.composer.relayout"))}"><i class="fa-solid fa-table-cells"></i></div>
                <span class="naist-muted">${escapeHtml$2(t("naist.composer.limit", {
			count: spec.participants.length,
			max: max || 0
		}))}</span>
            </div>
            <label>${escapeHtml$2(t("naist.composer.base"))}</label>
            <div class="naist-row"><textarea class="text_pole naist-grow naist-c-base" rows="2" placeholder="${escapeHtml$2(t("naist.composer.basePlaceholder"))}">${escapeHtml$2(spec.base)}</textarea>
                <div class="menu_button fa-solid fa-mountain-sun naist-c-llm" title="${escapeHtml$2(t("naist.composer.llmBase"))}"></div></div>
            <div class="naist-grid3">
                <div><label>${escapeHtml$2(t("naist.composer.framing"))}</label><select class="text_pole naist-c-framing">${options(FRAMINGS, "naist.framing", spec.framing)}</select></div>
                <div><label>${escapeHtml$2(t("naist.composer.camera"))}</label><select class="text_pole naist-c-camera">${options(CAMERA_ANGLES, "naist.camera", spec.camera)}</select></div>
                <div><label>${escapeHtml$2(t("naist.composer.distance"))}</label><select class="text_pole naist-c-distance">${options(DISTANCES, "naist.distance", spec.distance)}</select></div>
            </div>
            <div class="naist-composer-body">
                <div class="naist-composer-left">
                    ${renderCanvas()}
                    <label class="checkbox_label"><input type="checkbox" class="naist-c-coords"${spec.useCoords ? " checked" : ""}><span>${escapeHtml$2(t("naist.composer.useCoords"))}</span></label>
                    <div class="naist-hint">${escapeHtml$2(t(caps().positioning === "grid" ? "naist.composer.gridHint" : caps().positioning === "none" ? "naist.composer.noPositions" : "naist.composer.freeHint"))}</div>
                </div>
                <div class="naist-composer-slots">${renderSlots() || `<div class="naist-hint">${escapeHtml$2(t("naist.composer.empty"))}</div>`}</div>
            </div>
            <div class="naist-section"><b>${escapeHtml$2(t("naist.composer.pair"))}</b><div class="naist-row naist-c-pair">${renderPair()}</div></div>
            <div class="naist-row">
                <label>${escapeHtml$2(t("naist.composer.target"))}</label>
                <select class="text_pole naist-c-target">
                    <option value="message"${target === "message" ? " selected" : ""}>${escapeHtml$2(t("naist.composer.targetMessage"))}</option>
                    <option value="inline"${target === "inline" ? " selected" : ""}>${escapeHtml$2(t("naist.composer.targetInline"))}</option>
                </select>
                <label class="checkbox_label"><input type="checkbox" class="naist-c-nsfw"${settings().scene.allowNsfw ? " checked" : ""}><span>${escapeHtml$2(t("naist.composer.allowNsfw"))}</span></label>
                <div class="menu_button naist-c-inspect"><i class="fa-solid fa-magnifying-glass"></i> ${escapeHtml$2(t("naist.panel.inspect"))}</div>
            </div>
            <div class="naist-c-preview">${renderPreview()}</div>`;
		const pairA = root.querySelector(".naist-pair-a");
		const pairB = root.querySelector(".naist-pair-b");
		if (pairA) pairA.value = String(spec.pair?.a ?? 0);
		if (pairB) pairB.value = String(spec.pair?.b ?? Math.min(1, Math.max(0, spec.participants.length - 1)));
		localize(root);
	};
	const refreshPreview = () => {
		const box = root.querySelector(".naist-c-preview");
		if (box) box.innerHTML = renderPreview();
	};
	const slotOf = (el) => spec.participants[Number(el.closest(".naist-slot")?.dataset.index)];
	root.addEventListener("input", (event) => {
		const target2 = event.target;
		if (target2.classList.contains("naist-c-base")) spec.base = target2.value;
		else if (target2.classList.contains("naist-slot-pose-tags")) {
			const p = slotOf(target2);
			if (p) p.poseTags = target2.value;
		} else if (target2.classList.contains("naist-slot-negative")) {
			const p = slotOf(target2);
			if (p) p.negative = target2.value;
		} else return;
		refreshPreview();
	});
	root.addEventListener("change", (event) => {
		const el = event.target;
		const p = slotOf(el);
		if (el.classList.contains("naist-c-framing")) spec.framing = el.value;
		else if (el.classList.contains("naist-c-camera")) spec.camera = el.value;
		else if (el.classList.contains("naist-c-distance")) spec.distance = el.value;
		else if (el.classList.contains("naist-c-coords")) spec.useCoords = el.checked;
		else if (el.classList.contains("naist-c-target")) target = el.value === "inline" ? "inline" : "message";
		else if (el.classList.contains("naist-c-nsfw")) {
			settings().scene.allowNsfw = el.checked;
			saveSettings();
		} else if (el.classList.contains("naist-slot-on") && p) {
			p.enabled = el.checked;
			render();
			return;
		} else if (el.classList.contains("naist-slot-pose") && p) p.pose = el.value;
		else if (el.classList.contains("naist-slot-outfit") && p) p.outfit = el.value;
		else if (el.dataset.state && p) {
			const id = el.dataset.state;
			p.states = el.checked ? [.../* @__PURE__ */ new Set([...p.states, id])] : p.states.filter((s) => s !== id);
		} else if (el.classList.contains("naist-c-add") && el.value) {
			const candidate = candidates.find((x) => x.key === el.value);
			if (candidate) {
				spec.participants.push(participantFrom(candidate, {
					x: .5,
					y: .5
				}));
				relayout(true);
				const last = spec.participants.at(-1);
				if (last) last.position = autoLayout(spec.participants.length, caps()).at(-1) ?? last.position;
			}
			render();
			return;
		} else if (el.classList.contains("naist-pair-pose") || el.classList.contains("naist-pair-a") || el.classList.contains("naist-pair-b")) {
			const pose = root.querySelector(".naist-pair-pose")?.value ?? "";
			const a = Number(root.querySelector(".naist-pair-a")?.value ?? 0);
			const b = Number(root.querySelector(".naist-pair-b")?.value ?? 1);
			spec.pair = pose && a !== b ? {
				pose,
				a,
				b
			} : null;
			applyPairLayout(spec, caps());
			render();
			return;
		} else return;
		refreshPreview();
	});
	root.addEventListener("click", (event) => {
		const el = event.target;
		const index = Number(el.closest(".naist-slot")?.dataset.index);
		if (el.closest(".naist-c-auto")) service.autoSpec().then((next) => {
			candidates = next.candidates;
			Object.assign(spec, next.spec);
			render();
		}).catch(reportGenerationError);
		else if (el.closest(".naist-c-layout")) {
			relayout();
			render();
		} else if (el.closest(".naist-c-llm")) service.describeLocation().then((text) => {
			if (text) spec.base = text;
			render();
		});
		else if (el.closest(".naist-c-inspect")) {
			const built = service.build(spec);
			try {
				openInspector(pipeline.previewScene(built.prompt, service.overrides(built)), { confirmSend: false });
			} catch (error) {
				reportGenerationError(error);
			}
		} else if (el.classList.contains("naist-slot-up") && index > 0) {
			const [moved] = spec.participants.splice(index, 1);
			if (moved) spec.participants.splice(index - 1, 0, moved);
			spec.pair = null;
			render();
		} else if (el.classList.contains("naist-slot-down") && index < spec.participants.length - 1) {
			const [moved] = spec.participants.splice(index, 1);
			if (moved) spec.participants.splice(index + 1, 0, moved);
			spec.pair = null;
			render();
		} else if (el.classList.contains("naist-slot-remove")) {
			spec.participants.splice(index, 1);
			spec.pair = null;
			render();
		} else if (el.classList.contains("naist-slot-passport")) {
			const p = spec.participants[index];
			if (!p) return;
			(async () => {
				const located = await locateCandidatePassport(p.key, p.passport?.id);
				const passport = located ? await editLocatedPassport(p.name, located) : await editPassport(p.name, p.passport);
				if (!passport) return;
				if (!located && !p.key.startsWith("provided#")) {
					if (p.key.startsWith(PERSONA_PREFIX)) savePersonaPassport(p.key.slice(PERSONA_PREFIX.length), passport);
					else {
						const cardKey = p.key.split("#")[0];
						const charIndex = c.characters.findIndex((ch) => ch.avatar.replace(/\.[^/.]+$/, "") === cardKey);
						if (charIndex >= 0) await saveCardPassport(charIndex, passport);
					}
				}
				p.passport = passport;
				const candidate = candidates.find((x) => x.key === p.key);
				if (candidate) candidate.passport = passport;
				render();
			})().catch(reportGenerationError);
		}
	});
	root.addEventListener("pointerdown", (event) => {
		const marker = event.target.closest(".naist-marker");
		const canvas = marker?.closest(".naist-canvas");
		if (!marker || !canvas) return;
		event.preventDefault();
		const p = spec.participants[Number(marker.dataset.index)];
		if (!p) return;
		const move = (e) => {
			const rect = canvas.getBoundingClientRect();
			const point = placeOnCanvas({
				x: (e.clientX - rect.left) / rect.width,
				y: (e.clientY - rect.top) / rect.height
			}, caps());
			p.position = point;
			marker.style.left = `${point.x * 100}%`;
			marker.style.top = `${point.y * 100}%`;
		};
		const up = () => {
			document.removeEventListener("pointermove", move);
			document.removeEventListener("pointerup", up);
			spec.useCoords = true;
			const coords = root.querySelector(".naist-c-coords");
			if (coords) coords.checked = true;
			refreshPreview();
		};
		document.addEventListener("pointermove", move);
		document.addEventListener("pointerup", up);
	});
	render();
	attachPromptAssist(root, ".naist-c-base, .naist-slot-pose-tags, .naist-slot-negative", () => settings().generation.model);
	const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.composer.generate"),
		cancelButton: t("naist.inspector.cancel"),
		wide: true,
		large: true,
		allowVerticalScrolling: true
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
		log.warn("scene generation failed", error);
		reportGenerationError(error);
	}
}
//#endregion
//#region src/ui/passport-manager.ts
var KIND_ICON = {
	character: "fa-user",
	world: "fa-earth-europe",
	location: "fa-map-location-dot",
	scenario: "fa-scroll",
	object: "fa-cube"
};
/** How generated passports join the list: replace everything, or add the ones not there yet. */
async function chooseMerge() {
	const c = ctx();
	const result = await c.callGenericPopup(t("naist.passports.mergeQuestion"), c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.passports.mergeAdd"),
		cancelButton: t("naist.inspector.cancel"),
		customButtons: [{
			text: t("naist.passports.mergeReplace"),
			result: 3,
			classes: []
		}]
	});
	if (result === c.POPUP_RESULT.AFFIRMATIVE) return "add";
	if (result === 3) return "replace";
	return null;
}
function sameName$1(a, b, cardName) {
	return a.kind === b.kind && (a.name || cardName).trim().toLowerCase() === (b.name || cardName).trim().toLowerCase();
}
async function openPassportManager(index, actions) {
	const c = ctx();
	const character = await loadCharacter(index);
	if (!character) return;
	let list = structuredClone(cardPassports(character));
	/** Ids saved in the card: only those can have a chat override. */
	const savedIds = new Set(list.map((p) => p.id));
	const inChat = () => chatOpen() && chatCardIndexes().includes(index);
	let dirty = false;
	const root = document.createElement("div");
	root.className = "naist-dialog naist-passports";
	const render = () => {
		const main = primaryPassport(list, character.name);
		const chat = inChat() ? chatPassportData() : null;
		const rows = list.map((p, i) => {
			const label = p.name || character.name;
			const changed = chat !== null && hasChatOverride(p.id, character.avatar, chat);
			const summary = passportTags(p, { allowNsfw: false });
			return `<div class="naist-passport-row" data-index="${i}">
                    <i class="fa-solid ${KIND_ICON[p.kind]} naist-passport-kind-icon" title="${escapeHtml$2(t(`naist.passport.kind.${p.kind}`))}"></i>
                    <div class="naist-grow">
                        <div><b>${escapeHtml$2(label)}</b> <span class="naist-muted">${escapeHtml$2(t(`naist.passport.kind.${p.kind}`))}${p === main ? ` · ${escapeHtml$2(t("naist.passports.main"))}` : ""}${p.aliases.length ? ` · ${escapeHtml$2(p.aliases.join(", "))}` : ""}${changed ? ` · <i class="fa-solid fa-comments"></i> ${escapeHtml$2(t("naist.passports.chatOverride"))}` : ""}</span></div>
                        <div class="naist-muted naist-passport-summary">${escapeHtml$2(summary || t("naist.passports.empty"))}</div>
                    </div>
                    ${p.kind === "character" ? `<div class="menu_button fa-solid fa-masks-theater naist-passport-emotions" title="${escapeHtml$2(t("naist.passports.emotions"))}"></div>` : ""}
                    <div class="menu_button fa-solid fa-pen-to-square naist-passport-edit" title="${escapeHtml$2(t("naist.passports.edit"))}"></div>
                    <div class="menu_button fa-solid fa-trash-can naist-passport-remove" title="${escapeHtml$2(t("naist.passport.remove"))}"></div>
                </div>`;
		}).join("");
		root.innerHTML = `
            <h3>${escapeHtml$2(t("naist.passports.title", { name: character.name }))}</h3>
            <div class="naist-hint">${escapeHtml$2(t("naist.passports.hint"))}</div>
            <div class="naist-row">
                <div class="menu_button naist-passports-generate"><i class="fa-solid fa-wand-magic-sparkles"></i> ${escapeHtml$2(t("naist.passports.generate"))}</div>
                <span class="naist-muted">${escapeHtml$2(t("naist.passports.generateHint"))}</span>
            </div>
            <div class="naist-passport-list">${rows || `<div class="naist-muted">${escapeHtml$2(t("naist.passports.none"))}</div>`}</div>
            <div class="naist-row">
                <select class="text_pole naist-passports-kind">${PASSPORT_KINDS.map((k) => `<option value="${k}">${escapeHtml$2(t(`naist.passport.kind.${k}`))}</option>`).join("")}</select>
                <div class="menu_button naist-passports-add"><i class="fa-solid fa-plus"></i> ${escapeHtml$2(t("naist.passports.add"))}</div>
            </div>`;
		localize(root);
	};
	const edit = async (i, fresh = false) => {
		const current = list[i];
		if (!current) return;
		if (!fresh && savedIds.has(current.id) && inChat()) {
			const chat = chatPassportData();
			const scoped = await editPassportIn(character.name, {
				card: current,
				chat: resolveChatPassport(current, character.avatar, chat),
				initial: hasChatOverride(current.id, character.avatar, chat) ? "chat" : "card"
			}, { identity: true });
			if (!scoped) return;
			if (scoped.scope === "chat") {
				await saveChatPassport(current, scoped.passport, character.avatar);
				toastr.success(t("naist.passport.savedChat", { name: scoped.passport.name || character.name }));
			} else {
				list[i] = scoped.passport;
				dirty = true;
			}
			render();
			return;
		}
		const edited = await editPassport(character.name, current, { identity: true });
		if (!edited) {
			if (fresh) {
				list.splice(i, 1);
				render();
			}
			return;
		}
		list[i] = edited;
		dirty = true;
		render();
	};
	root.addEventListener("click", (event) => {
		const target = event.target;
		const row = target.closest(".naist-passport-row");
		const i = Number(row?.dataset.index);
		if (target.closest(".naist-passport-edit")) edit(i);
		else if (target.closest(".naist-passport-remove")) {
			list.splice(i, 1);
			dirty = true;
			render();
		} else if (target.closest(".naist-passport-emotions")) {
			const passport = list[i];
			if (!passport) return;
			(dirty ? saveCardPassports(index, list) : Promise.resolve()).then(() => {
				dirty = false;
				actions.emotions(index, passport.id);
			}).catch(reportGenerationError);
		} else if (target.closest(".naist-passports-add")) {
			const kind = root.querySelector(".naist-passports-kind")?.value ?? "character";
			const fresh = defaultPassport(kind, kind === "character" && !list.some((p) => p.kind === "character") ? "" : t(`naist.passport.kind.${kind}`));
			list.push(fresh);
			dirty = true;
			edit(list.length - 1, true);
		} else if (target.closest(".naist-passports-generate")) {
			const button = target.closest(".naist-passports-generate");
			if (!button || button.classList.contains("disabled")) return;
			button.classList.add("disabled");
			button.querySelector("i")?.classList.add("fa-spin");
			generateCardPassports(index).then(async (generated) => {
				const mode = list.some((p) => !isPassportEmpty(p)) ? await chooseMerge() : "replace";
				if (!mode) return;
				if (mode === "replace") list = generated;
				else list.push(...generated.filter((g) => !list.some((p) => sameName$1(p, g, character.name))));
				dirty = true;
				render();
				toastr.success(t("naist.passports.generated", { count: generated.length }));
			}).catch(reportGenerationError).finally(() => {
				root.querySelector(".naist-passports-generate")?.classList.remove("disabled");
				root.querySelector(".naist-passports-generate i")?.classList.remove("fa-spin");
			});
		}
	});
	render();
	if (await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.passport.save"),
		cancelButton: t("naist.inspector.cancel"),
		wide: true,
		allowVerticalScrolling: true
	}) !== c.POPUP_RESULT.AFFIRMATIVE || !dirty) return;
	await saveCardPassports(index, list);
	toastr.success(t("naist.passport.saved", { name: character.name }));
}
//#endregion
//#region src/ui/pose-library.ts
async function openPoseLibrary() {
	const c = ctx();
	const root = document.createElement("div");
	root.className = "naist-dialog naist-pose-library";
	const poses = settings().poses;
	const render = () => {
		const custom = poses.custom.map((p, i) => `<div class="naist-row naist-custom-pose" data-index="${i}">
                <input class="text_pole naist-cp-name" value="${escapeHtml$2(p.name)}" placeholder="${escapeHtml$2(t("naist.poseLib.name"))}">
                <select class="text_pole naist-cp-category">${POSE_CATEGORIES.map((cat) => `<option value="${cat}"${cat === p.category ? " selected" : ""}>${escapeHtml$2(t(`naist.poseCat.${cat}`))}</option>`).join("")}</select>
                <input class="text_pole naist-grow naist-cp-tags" value="${escapeHtml$2(p.tags)}" placeholder="${escapeHtml$2(t("naist.poseLib.tags"))}">
                <input class="text_pole naist-cp-keywords" value="${escapeHtml$2(p.keywords.join(", "))}" placeholder="${escapeHtml$2(t("naist.poseLib.keywords"))}">
                <div class="menu_button fa-solid fa-trash-can naist-cp-remove"></div>
            </div>`).join("");
		const library = POSE_CATEGORIES.map((cat) => {
			const list = POSES.filter((p) => p.category === cat).map((p) => `<label class="checkbox_label naist-pose-fav" title="${escapeHtml$2(p.tags)}"><input type="checkbox" data-fav="${p.id}"${poses.favorites.includes(p.id) ? " checked" : ""}><span>${escapeHtml$2(t(`naist.pose.${p.id}`))}</span></label>`).join("");
			return `<div class="naist-section"><b>${escapeHtml$2(t(`naist.poseCat.${cat}`))}</b><div class="naist-flags">${list}</div></div>`;
		}).join("");
		root.innerHTML = `
            <h3>${escapeHtml$2(t("naist.poseLib.title"))}</h3>
            <div class="naist-hint">${escapeHtml$2(t("naist.poseLib.favoritesHint"))}</div>
            ${library}
            <div class="naist-section"><b>${escapeHtml$2(t("naist.poseLib.custom"))}</b>
                <div class="naist-hint">${escapeHtml$2(t("naist.poseLib.customHint"))}</div>
                ${custom}
                <div class="menu_button naist-cp-add">${escapeHtml$2(t("naist.poseLib.add"))}</div>
            </div>`;
		localize(root);
	};
	const read = () => {
		root.querySelectorAll(".naist-custom-pose").forEach((row) => {
			const pose = poses.custom[Number(row.dataset.index)];
			if (!pose) return;
			pose.name = row.querySelector(".naist-cp-name")?.value.trim() ?? "";
			pose.category = row.querySelector(".naist-cp-category")?.value ?? "standing";
			pose.tags = row.querySelector(".naist-cp-tags")?.value.trim() ?? "";
			pose.keywords = (row.querySelector(".naist-cp-keywords")?.value ?? "").split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
		});
	};
	root.addEventListener("click", (event) => {
		const el = event.target;
		if (el.classList.contains("naist-cp-add")) {
			read();
			poses.custom.push({
				id: `custom-${c.uuidv4().slice(0, 8)}`,
				category: "standing",
				tags: "",
				keywords: [],
				name: ""
			});
			render();
		} else if (el.classList.contains("naist-cp-remove")) {
			read();
			const index = Number(el.closest(".naist-custom-pose")?.dataset.index);
			const [removed] = poses.custom.splice(index, 1);
			if (removed) poses.favorites = poses.favorites.filter((f) => f !== removed.id);
			render();
		}
	});
	root.addEventListener("change", (event) => {
		const el = event.target;
		const id = el.dataset.fav;
		if (!id) return;
		poses.favorites = el.checked ? [.../* @__PURE__ */ new Set([...poses.favorites, id])] : poses.favorites.filter((f) => f !== id);
	});
	render();
	await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, "", {
		wide: true,
		allowVerticalScrolling: true,
		okButton: t("naist.poseLib.done")
	});
	read();
	poses.custom = poses.custom.filter((p) => p.tags.trim());
	saveSettings();
}
//#endregion
//#region src/integration/scene-setup.ts
var MENU_OPTIONS = [["naist_char_composer", "naist.card.composer"], ["naist_char_passport", "naist.card.passport"]];
var state$1 = null;
var emotionsHandler = () => {};
/** The sprite generator registers itself here (it lives with the Phase 6 tools). */
function setEmotionsHandler(handler) {
	emotionsHandler = handler;
}
/** Opens the sprite generator for a character passport of a card. */
function openEmotions(index, passportId) {
	emotionsHandler(index, passportId);
}
async function openSceneComposer(auto = true, focusKey) {
	if (!state$1) return;
	try {
		await openComposer(state$1.service, state$1.pipeline, {
			auto,
			focusKey
		});
	} catch (error) {
		reportGenerationError(error);
	}
}
function editedCharacterIndex() {
	const c = ctx();
	if (c.characterId === void 0 || c.characterId === null || c.characterId === "") return null;
	const index = Number(c.characterId);
	return Number.isInteger(index) && c.characters[index] ? index : null;
}
/** The passports of a card: characters, world, locations, scenario, objects. */
async function editCharacterPassport(index) {
	await openPassportManager(index, { emotions: (i, passportId) => emotionsHandler(i, passportId) });
}
async function editPersonaPassport() {
	const key = await currentPersonaKey();
	const stored = personaPassport(key);
	const located = stored ? locatePassport(stored.id, { persona: key }) : null;
	if (located) {
		await editLocatedPassport(ctx().name1, located, { generate: generatePersonaPassport });
		return;
	}
	const passport = await editPassport(ctx().name1, stored, { generate: generatePersonaPassport });
	if (!passport) return;
	savePersonaPassport(key, passport);
	toastr.success(t("naist.passport.saved", { name: ctx().name1 }));
}
function cardButton(id, icon, titleKey, onClick) {
	const button = document.createElement("div");
	button.id = id;
	button.className = `menu_button fa-solid ${icon}`;
	button.setAttribute("data-i18n", `[title]${titleKey}`);
	button.title = t(titleKey);
	button.addEventListener("click", onClick);
	return button;
}
function withEditedCharacter(run) {
	const index = editedCharacterIndex();
	if (index === null || ctx().groupId) toastr.info(t("naist.prompts.characterNone"));
	else run(index);
}
function installCardButton() {
	const block = document.querySelector("#avatar_controls .form_create_bottom_buttons_block");
	if (!block || block.querySelector("#naist_card_button")) return;
	const button = document.createElement("div");
	button.id = "naist_card_button";
	button.className = "menu_button fa-solid fa-palette";
	button.setAttribute("data-i18n", "[title]naist.card.button");
	button.title = t("naist.card.button");
	const exportButton = block.querySelector("#export_button");
	if (exportButton) exportButton.after(button);
	else block.append(button);
	button.addEventListener("click", () => {
		const index = editedCharacterIndex();
		openSceneComposer(false, index === null ? void 0 : avatarKey(ctx().characters[index]?.avatar));
	});
	const passports = cardButton("naist_passport_button", "fa-id-card", "naist.card.passports", () => withEditedCharacter((index) => void editCharacterPassport(index).catch(reportGenerationError)));
	const emotions = cardButton("naist_emotions_button", "fa-masks-theater", "naist.card.emotions", () => withEditedCharacter((index) => emotionsHandler(index)));
	button.after(passports, emotions);
}
/**
* A new avatar for the current persona drawn from its passport: preview with "set", "another one"
* and "cancel"; an empty passport opens the passport editor first.
*/
async function personaAvatarFromPassport() {
	if (!state$1) return;
	const c = ctx();
	const key = await currentPersonaKey();
	const passport = personaPassport(key);
	if (!passport || isPassportEmpty(passport)) {
		toastr.info(t("naist.personaAvatar.noPassport"), t("naist.personaAvatar.title"));
		await editPersonaPassport();
		return;
	}
	for (;;) {
		toastr.info(t("naist.personaAvatar.drawing"), t("naist.personaAvatar.title"));
		const image = await drawPersonaAvatar(state$1.pipeline, passport);
		if (!image) return;
		const root = document.createElement("div");
		root.className = "naist-dialog naist-persona-avatar";
		root.innerHTML = `<h3>${escapeHtml$2(t("naist.personaAvatar.heading", { name: c.name1 }))}</h3>
            <img class="naist-persona-avatar-preview" alt="" src="${imageDataUrl(image)}">`;
		const result = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
			okButton: t("naist.personaAvatar.set"),
			cancelButton: t("naist.inspector.cancel"),
			customButtons: [{
				text: t("naist.personaAvatar.again"),
				result: 3,
				classes: []
			}]
		});
		if (result === 3) continue;
		if (result !== c.POPUP_RESULT.AFFIRMATIVE) return;
		if (await uploadPersonaAvatar(key, image)) toastr.success(t("naist.personaAvatar.done", { name: c.name1 }));
		return;
	}
}
/** Passport and avatar buttons among the persona panel's buttons. */
function installPersonaButton() {
	const block = document.querySelector("#persona_controls .persona_controls_buttons_block");
	if (!block || block.querySelector("#naist_persona_passport")) return;
	const button = cardButton("naist_persona_passport", "fa-id-card", "naist.card.personaPassport", () => {
		editPersonaPassport().catch(reportGenerationError);
	});
	const avatar = cardButton("naist_persona_avatar", "fa-image-portrait", "naist.card.personaAvatar", () => {
		personaAvatarFromPassport().catch(reportGenerationError);
	});
	const anchor = block.querySelector("#persona_lore_button");
	if (anchor) anchor.after(button, avatar);
	else block.prepend(button, avatar);
}
function installMenuOptions() {
	const select = document.querySelector("#char-management-dropdown");
	if (select && !select.querySelector("#naist_char_composer")) for (const [id, key] of MENU_OPTIONS) {
		const option = document.createElement("option");
		option.id = id;
		option.setAttribute("data-i18n", key);
		option.textContent = t(key);
		select.append(option);
	}
	const c = ctx();
	c.eventSource.on(c.eventTypes.CHARACTER_MANAGEMENT_DROPDOWN ?? "charManagementDropdown", (target) => {
		const index = editedCharacterIndex();
		if (target === "naist_char_composer") openSceneComposer(false, index === null ? void 0 : avatarKey(ctx().characters[index]?.avatar));
		else if (target === "naist_char_passport" && index !== null) editCharacterPassport(index).catch(reportGenerationError);
	});
}
function registerSceneCommand() {
	const { SlashCommandParser: parser, SlashCommand: Command, SlashCommandArgument: Arg, SlashCommandNamedArgument: Named, ARGUMENT_TYPE: T } = ctx();
	parser.addCommandObject(Command.fromProps({
		name: "nai-scene",
		returns: t("naist.command.sceneReturns"),
		helpString: t("naist.command.sceneHelp"),
		namedArgumentList: [Named.fromProps({
			name: "edit",
			description: t("naist.command.arg.sceneEdit"),
			typeList: [T.BOOLEAN ?? "bool"],
			defaultValue: "true",
			isRequired: false
		}), Named.fromProps({
			name: "target",
			description: t("naist.command.arg.sceneTarget"),
			typeList: [T.STRING ?? "string"],
			enumList: ["message", "inline"],
			isRequired: false
		})],
		unnamedArgumentList: [Arg.fromProps({
			description: t("naist.command.arg.sceneText"),
			typeList: [T.STRING ?? "string"],
			isRequired: false
		})],
		callback: async (args, value) => {
			if (!state$1) return "";
			if (String(args.edit ?? "true").toLowerCase() !== "false") {
				openSceneComposer(true);
				return "";
			}
			try {
				const text = String(value ?? "").trim();
				const { spec } = await state$1.service.autoSpec(text || void 0);
				const target = String(args.target ?? "") === "inline" ? "inline" : "message";
				const result = await state$1.service.generate(spec, target);
				return typeof result === "string" ? result : result?.path ?? "";
			} catch (error) {
				reportGenerationError(error);
				return "";
			}
		}
	}));
}
function setupScenes(pipeline, service) {
	state$1 = {
		service,
		pipeline
	};
	installCardButton();
	installPersonaButton();
	installMenuOptions();
	document.addEventListener("click", (event) => {
		const target = event.target;
		if (target.closest("#naist_open_composer")) openSceneComposer(true);
		else if (target.closest("#naist_edit_char_passport")) withEditedCharacter((index) => void editCharacterPassport(index).catch(reportGenerationError));
		else if (target.closest("#naist_edit_persona_passport")) editPersonaPassport().catch(reportGenerationError);
		else if (target.closest("#naist_open_pose_library")) openPoseLibrary();
	});
	const c = ctx();
	c.eventSource.on(c.eventTypes.APP_READY ?? "app_ready", () => {
		installCardButton();
		installPersonaButton();
		registerSceneCommand();
		for (const selector of ["#avatar_controls", "#persona_controls"]) {
			const block = document.querySelector(selector);
			if (block) localize(block);
		}
		log.info("scene composer ready");
	});
}
var DES_VERIFIED = ["2.6.0"];
var MODULES = {
	state: {
		path: "src/core/state.js",
		exports: { extensionSettings: "object" }
	},
	persistence: {
		path: "src/core/persistence.js",
		exports: { saveSettings: "function" }
	},
	avatars: {
		path: "src/systems/features/avatarGenerator.js",
		exports: { regenerateAvatar: "function" }
	},
	portraitBar: {
		path: "src/systems/ui/portraitBar.js",
		exports: { updatePortraitBar: "function" }
	}
};
async function extensionNames() {
	try {
		const module = await importHost("/scripts/extensions.js");
		if (Array.isArray(module.extensionNames) && module.extensionNames.length) return module.extensionNames;
	} catch (error) {
		log.warn("DES: extension list not available", error);
	}
	return ["third-party/Dooms-Enhancement-Suite"];
}
async function manifestOf(name) {
	try {
		const response = await fetch(`/scripts/extensions/${name}/manifest.json`, { cache: "no-store" });
		return response.ok ? await response.json() : null;
	} catch {
		return null;
	}
}
var isDes = (manifest) => !!manifest && (String(manifest.homePage ?? "").toLowerCase().includes("dangerdaza/dooms-enhancement-suite") || manifest.display_name === "Doom's Enhancement Suite");
/** DES's own module script on the page: its address is the base for importing DES modules. */
function scriptOf(name, manifest) {
	const suffix = `/scripts/extensions/${name}/${manifest.js || "index.js"}`;
	for (const script of document.querySelectorAll("script[type=\"module\"][src]")) try {
		if (decodeURIComponent(new URL(script.src, location.href).pathname).endsWith(suffix)) return script.src;
	} catch {}
	return null;
}
/** The imported settings are DES's live object (or share its nested objects before its first save). */
function isLive(settings, saved) {
	if (!settings || typeof settings !== "object") return false;
	if (!saved || typeof saved !== "object") return true;
	if (settings === saved) return true;
	return Object.entries(saved).some(([key, value]) => value && typeof value === "object" && settings[key] === value);
}
var wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
* Finds DES and connects to it; null when DES is not installed, disabled in ST, or its modules
* do not have what NAI Studio uses. Waits for DES's asynchronous start (up to `timeoutMs`).
*/
async function connectDes(timeoutMs = 6e4) {
	let found = null;
	for (const name of await extensionNames()) {
		if (!name.startsWith("third-party/")) continue;
		const manifest = await manifestOf(name);
		if (isDes(manifest)) {
			found = {
				name,
				manifest
			};
			break;
		}
	}
	if (!found) return null;
	const c = ctx();
	const disabled = c.extensionSettings.disabledExtensions;
	if (Array.isArray(disabled) && disabled.includes(found.name)) return null;
	const started = Date.now();
	let script = null;
	while (Date.now() - started < timeoutMs) {
		script = scriptOf(found.name, found.manifest);
		if (script && document.querySelector("#rpg-extension-enabled")) break;
		await wait(500);
	}
	if (!script) return null;
	const namespaces = {};
	for (const [key, spec] of Object.entries(MODULES)) try {
		const namespace = await import(
			/* @vite-ignore */
			new URL(spec.path, script).href
);
		for (const [exportName, type] of Object.entries(spec.exports)) if (typeof namespace[exportName] !== type || namespace[exportName] === null) {
			log.warn(`DES: ${spec.path} has no ${exportName}`);
			return null;
		}
		namespaces[key] = namespace;
	} catch (error) {
		log.warn(`DES: ${spec.path} did not load`, error);
		return null;
	}
	const settings = namespaces.state.extensionSettings;
	if (!isLive(settings, c.extensionSettings[found.name])) {
		log.warn("DES: the settings object is not the live one");
		return null;
	}
	const version = found.manifest.version ?? null;
	return {
		name: found.name,
		version,
		verified: version !== null && DES_VERIFIED.includes(version),
		settings,
		enabled: () => settings.enabled !== false,
		mode: () => settings.generationMode === "separate" || settings.generationMode === "external" ? settings.generationMode : "together",
		save: () => namespaces.persistence.saveSettings(),
		regeneratePortrait: async (character) => await namespaces.avatars.regenerateAvatar(character) ?? null,
		refreshPortraits: () => {
			try {
				namespaces.portraitBar.updatePortraitBar();
			} catch (error) {
				log.warn("DES: portrait bar refresh failed", error);
			}
		}
	};
}
//#endregion
//#region src/integration/des/des-integration.ts
var TRACKER_EVENT = "dooms_tracker_update_complete";
var TRACKER_WAIT_MS = 12e4;
/** Letters and digits only: DES cleans /sd prompts (quotes, pipes, commas) before sending them. */
var normalizeLine = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
var sameName = (a, b) => mentionIndex(a, [b]) >= 0 || mentionIndex(b, [a]) >= 0;
/** One seed per character name: the same face across regenerated portraits. */
function stableSeed(name) {
	let hash = 5381;
	for (const ch of name.toLowerCase()) hash = (hash << 5) + hash + ch.codePointAt(0) >>> 0;
	return hash % 4294967295;
}
var DesIntegration = class {
	markers;
	api = null;
	state = "searching";
	/** Normalised appearance line written to DES → character name. */
	lines = /* @__PURE__ */ new Map();
	passportJobs = /* @__PURE__ */ new Map();
	failed = /* @__PURE__ */ new Set();
	/**
	* DES portraits are asked one by one and in order; each one's NovelAI request then waits in the
	* one queue of the extension behind the pictures of the reply (priority "portrait", v0.13.1).
	*/
	portraitQueue = Promise.resolve();
	/** Portraits asked for from the menu: the user's own requests in the NovelAI queue. */
	manualPortraits = /* @__PURE__ */ new Set();
	/**
	* Automatic portraits on their way, by character name, with the record they get once drawn. A later
	* tracker does not queue the same portrait again ("missing" draws once); it only updates the record,
	* since the portrait is drawn from the newest tracker.
	*/
	pendingPortraits = /* @__PURE__ */ new Map();
	lastLocation = "";
	timer = null;
	listeners = /* @__PURE__ */ new Set();
	/** Russian tracker looks converted to tags (kept apart from the passport tags they join). */
	looks = /* @__PURE__ */ new Map();
	constructor(markers) {
		this.markers = markers;
	}
	status() {
		return {
			state: this.state,
			version: this.api?.version ?? null,
			verified: this.api?.verified ?? false,
			mode: this.api?.mode() ?? "",
			enabled: this.api?.enabled() ?? false
		};
	}
	onStatus(listener) {
		this.listeners.add(listener);
	}
	changed() {
		for (const listener of this.listeners) listener();
		notifyExternalChange();
	}
	active() {
		return !!this.api && this.api.enabled() && settings().des.enabled;
	}
	async start() {
		this.api = await connectDes();
		this.state = this.api ? "connected" : "absent";
		if (this.api) {
			log.info(`Doom's Enhancement Suite ${this.api.version ?? "?"} connected (${this.api.mode()})`);
			if (!this.api.verified) log.warn(`DES ${this.api.version}: integration checked on 2.6.0 only`);
			this.install();
		}
		this.changed();
	}
	/** Settings of the integration changed in the panel. */
	settingsChanged() {
		if (!this.api) return;
		this.applyPortraitMode();
		if (this.active()) this.schedule(false);
		this.changed();
	}
	install() {
		const c = ctx();
		setSceneProvider({
			candidates: (query) => this.candidates(query),
			setting: (query) => this.setting(query)
		});
		this.markers.setGate({
			holdEarlyStart: () => this.active() && this.api.mode() !== "together",
			wait: (messageId, signal) => this.waitForTracker(messageId, signal)
		});
		setPortraitHook((prompt) => this.portraitPlan(prompt));
		setExtraSpriteFolder((name) => this.active() && settings().des.emotionsToDes ? name : null);
		onPassportsSaved((index, passports) => this.syncCard(index, passports));
		onStudioEvent("passportsSaved", (detail) => {
			if (detail.scope === "chat") this.schedule(false);
		});
		const received = c.eventTypes.MESSAGE_RECEIVED;
		const after = (_id, type) => {
			if (type !== "quiet" && type !== "impersonate") this.schedule(true);
		};
		const source = c.eventSource;
		if (received && source.makeLast) source.makeLast(received, after);
		else if (received) c.eventSource.on(received, after);
		c.eventSource.on(TRACKER_EVENT, () => this.schedule(true));
		if (c.eventTypes.MESSAGE_SWIPED) c.eventSource.on(c.eventTypes.MESSAGE_SWIPED, () => this.schedule(false));
		if (c.eventTypes.CHAT_CHANGED) c.eventSource.on(c.eventTypes.CHAT_CHANGED, () => {
			this.lastLocation = "";
			this.schedule(false);
		});
		this.applyPortraitMode();
		this.installMenu();
		this.installBanners();
		this.installWorkshop();
		this.schedule(false);
	}
	/** NAI Studio draws the portraits: DES's auto portraits are off meanwhile and come back after. */
	applyPortraitMode() {
		if (!this.api) return;
		const d = settings().des;
		const des = this.api.settings;
		const want = this.active() && d.portraits;
		if (want && !d.saved) {
			d.saved = {
				autoPortraitMode: String(des.autoPortraitMode ?? "only_missing"),
				autoGenerateAvatars: des.autoGenerateAvatars === true
			};
			des.autoPortraitMode = "off";
			des.autoGenerateAvatars = false;
		} else if (!want && d.saved) {
			des.autoPortraitMode = d.saved.autoPortraitMode;
			des.autoGenerateAvatars = d.saved.autoGenerateAvatars;
			d.saved = null;
		} else return;
		this.api.save();
		saveSettings();
	}
	trackerOf(messageId) {
		const m = ctx().chat[messageId];
		if (!m || m.is_user || m.is_system) return null;
		return trackerFromSwipe(m.extra, Number(m.swipe_id ?? 0)) ?? (this.api?.mode() === "together" ? trackerFromText(m.mes) : null);
	}
	latestTracker() {
		return this.latestTrackerAt()?.tracker ?? null;
	}
	/** The newest tracker and the reply it belongs to. */
	latestTrackerAt() {
		const chat = ctx().chat;
		for (let i = chat.length - 1; i >= 0; i--) {
			const tracker = this.trackerOf(i);
			if (tracker) return {
				tracker,
				messageId: i
			};
		}
		return null;
	}
	/** The tracker of a reply: in its text (together mode, before DES parses it), saved, or the latest. */
	trackerFor(query) {
		if (query.text && this.api?.mode() === "together") {
			const inText = trackerFromText(query.text);
			if (inText) return inText;
		}
		if (query.messageId !== void 0) {
			const saved = this.trackerOf(query.messageId);
			if (saved) return saved;
		}
		return this.latestTracker();
	}
	async waitForTracker(messageId, signal) {
		if (!this.active() || this.api.mode() === "together") return;
		const started = Date.now();
		while (Date.now() - started < TRACKER_WAIT_MS && !signal?.aborted) {
			const m = ctx().chat[messageId];
			if (!m || trackerFromSwipe(m.extra, Number(m.swipe_id ?? 0))) return;
			await new Promise((resolve) => setTimeout(resolve, 1e3));
		}
		log.warn("DES: no tracker for the reply, marker images use the latest one");
	}
	isUserName(name) {
		return sameName(name, ctx().name1);
	}
	aliasesOf(name) {
		const list = (this.api?.settings.characterAliases)?.[name];
		return Array.isArray(list) ? list.filter((a) => typeof a === "string") : [];
	}
	/**
	* A tracker look as tags: converted on its own, so the passport tags it joins are not sent
	* through the converter again. English is used as written.
	*/
	lookTags(look) {
		if (!look.trim() || !hasCyrillic(look)) return Promise.resolve(look);
		let converted = this.looks.get(look);
		if (!converted) {
			converted = interpretForModel(look, settings().generation.model, { force: true }).then((result) => withoutCountTags(result?.prompt ?? look)).catch(() => look);
			if (this.looks.size > 200) this.looks.clear();
			this.looks.set(look, converted);
		}
		return converted;
	}
	async candidates(query) {
		if (!this.active() || !settings().des.characters) return [];
		const tracker = this.trackerFor(query);
		if (!tracker) return [];
		const people = tracker.characters.filter((ch) => !this.isUserName(ch.name));
		return await Promise.all(people.map(async (ch) => {
			const look = await this.lookTags(ch.look);
			return {
				key: `des:${ch.name}`,
				name: ch.name,
				aliases: this.aliasesOf(ch.name),
				passport: null,
				fallbackPrompt: "",
				fallbackNegative: "",
				isUser: false,
				...look ? {
					currentLook: look,
					currentLookText: ch.look.trim()
				} : {}
			};
		}));
	}
	async setting(query) {
		if (!this.active() || !settings().des.sceneTags) return {
			tags: [],
			location: ""
		};
		const scene = this.trackerFor(query)?.scene;
		return {
			tags: scene?.tags ?? [],
			location: scene?.location ?? ""
		};
	}
	schedule(portraits) {
		if (this.timer) clearTimeout(this.timer);
		const withPortraits = portraits;
		this.timer = setTimeout(() => {
			this.timer = null;
			this.handleTracker(withPortraits).catch((error) => log.warn("DES tracker handling failed", error));
		}, 400);
	}
	/** After a tracker update: location, passports of new characters, appearance lines, portraits. */
	async handleTracker(portraits) {
		if (!this.active()) return;
		const latest = this.latestTrackerAt();
		if (!latest) return;
		const { tracker, messageId } = latest;
		const d = settings().des;
		let verdict;
		const approval = () => {
			if (!qualityGatesActive()) return void 0;
			const streaming = this.markers.generating === true && messageId === ctx().chat.length - 1;
			return verdict ??= replyVerdict(messageId, { streaming });
		};
		const location = tracker.scene?.location ?? "";
		if (d.sceneTags && location && location !== this.lastLocation) {
			this.lastLocation = location;
			if (settings().continuity.enabled) await setCurrentLocation(location).catch(() => void 0);
		}
		for (const character of tracker.characters) {
			if (this.isUserName(character.name)) continue;
			const found = await this.findPassport(character.name, { provided: { messageId } }) ?? (d.autoPassports ? await this.createPassport(character) : null);
			this.syncLine(character.name, found?.passport ?? null, character.look);
			if (portraits && d.portraits) this.maybePortrait(character, found, approval);
		}
	}
	chatCards() {
		return chatCardIndexes();
	}
	/** Card new passports go to: the 1:1 character, in a group the speaker of the last reply. */
	targetCard() {
		const c = ctx();
		const cards = this.chatCards();
		if (cards.length <= 1) return cards[0] ?? null;
		const last = [...c.chat].reverse().find((m) => !m.is_user && !m.is_system);
		const avatar = typeof last?.original_avatar === "string" ? last.original_avatar : "";
		const speaker = c.characters.findIndex((ch) => ch.avatar === avatar);
		return speaker >= 0 ? speaker : cards[0] ?? null;
	}
	isCardCharacter(name) {
		return this.chatCards().some((i) => sameName(ctx().characters[i]?.name ?? "", name));
	}
	/**
	* The character passport of a name in the cards of the chat (name, aliases, sound), then among the
	* passports of the chat itself; as the chat sees it. With `provided` (v0.12) then among the passports
	* of the passport providers for that scene (stored nowhere: `cardIndex` null).
	*/
	async findPassport(name, options = {}) {
		const chat = chatPassportData();
		const matches = (passport, own) => passport.kind === "character" && (mentionIndex(name, [own, ...passport.aliases]) >= 0 || mentionIndex(own, [name]) >= 0);
		for (const cardIndex of this.chatCards()) {
			const card = await loadCharacter(cardIndex);
			for (const passport of resolvedCardPassports(card, chat)) if (matches(passport, passport.name || card?.name || "")) return {
				cardIndex,
				passport
			};
		}
		const own = chat.extra.find((passport) => passport.name && matches(passport, passport.name));
		if (own) return {
			cardIndex: null,
			passport: own
		};
		if (!options.provided) return null;
		const provided = (await providedPassports(options.provided)).find((passport) => matches(passport, passport.name));
		return provided ? {
			cardIndex: null,
			passport: provided
		} : null;
	}
	/** A passport written from the tracker for a character the cards do not know yet. */
	createPassport(character) {
		const key = character.name.toLowerCase();
		if (this.failed.has(key)) return Promise.resolve(null);
		const running = this.passportJobs.get(key);
		if (running) return running;
		const job = (async () => {
			const cardIndex = this.targetCard();
			if (cardIndex === null) return null;
			try {
				const passport = await generateTrackerPassport(character.name, character.look, cardIndex);
				passport.aliases = [.../* @__PURE__ */ new Set([...passport.aliases, ...this.aliasesOf(character.name)])];
				await saveCardPassport(cardIndex, passport);
				toastr.info(t("naist.des.passportCreated", { name: character.name }), t("naist.des.title"));
				return {
					cardIndex,
					passport
				};
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
	syncLine(name, passport, look = "") {
		if (!this.api) return;
		const line = passport ? passportTags(passport, { allowNsfw: false }) : look.trim();
		if (!line) return;
		this.lines.set(normalizeLine(line), name);
		const store = this.api.settings.characterAppearance ??= {};
		if (store[name] === line) return;
		store[name] = line;
		this.api.save();
	}
	syncCard(index, passports) {
		if (!this.active()) return;
		const card = ctx().characters[index];
		const cardName = card?.name ?? "";
		const chat = this.chatCards().includes(index) ? chatPassportData() : null;
		for (const stored of passports) {
			const passport = chat ? resolveChatPassport(stored, card?.avatar, chat) : stored;
			if (passport.kind === "character") this.syncLine(passport.name || cardName, passport);
		}
	}
	/** Records of the drawn portraits by character name (DesPortraitRecord; a bare hash before v0.13.2). */
	portraitRecords() {
		const meta = ctx().chatMetadata.nai_studio ??= {};
		return meta.desPortraits ??= {};
	}
	saveRecords() {
		Promise.resolve(ctx().saveMetadata()).catch((error) => log.warn("DES: portrait record not saved", error));
	}
	maybePortrait(character, found, approval) {
		const api = this.api;
		if (!api || this.isCardCharacter(character.name)) return;
		const name = character.name;
		const existing = api.settings.npcAvatars?.[name];
		const records = this.portraitRecords();
		if (existing && !records[name] && !api.settings.generatedPortraits?.[name]) return;
		if (!(found ? passportTags(found.passport, { allowNsfw: false }) : character.look).trim()) return;
		const policy = settings().des.portraitPolicy;
		const current = portraitRecord(found?.passport, character.look);
		if (policy !== "every" && this.pendingPortraits.has(name)) {
			this.pendingPortraits.set(name, current);
			return;
		}
		const decision = portraitDecision({
			policy,
			exists: Boolean(existing),
			stored: records[name],
			current,
			passport: Boolean(found)
		});
		if (decision === "adopt") {
			records[name] = current;
			this.saveRecords();
			return;
		}
		if (decision !== "draw") return;
		this.pendingPortraits.set(name, current);
		const verdict = approval?.();
		this.portraitQueue = this.portraitQueue.then(async () => {
			try {
				if (verdict && await verdict !== "draw") {
					log.info(`DES: portrait of ${name} skipped by the quality gate`);
					return;
				}
				if (await api.regeneratePortrait(name)) {
					records[name] = this.pendingPortraits.get(name) ?? current;
					await ctx().saveMetadata();
					api.refreshPortraits();
				}
			} catch (error) {
				log.warn(`DES: portrait of ${name} failed`, error);
			} finally {
				this.pendingPortraits.delete(name);
			}
		});
	}
	/** DES's /sd call for an appearance line NAI Studio wrote: the full portrait request. */
	async portraitPlan(prompt) {
		if (!this.active()) return null;
		const name = this.lines.get(normalizeLine(prompt));
		if (!name) return null;
		const found = await this.findPassport(name, { provided: {} });
		const raw = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? "";
		let outfit = found ? outfitForLook(found.passport, raw) : "";
		let look = outfit ? "" : await this.lookTags(raw);
		if (found && !outfit && look !== raw) {
			outfit = outfitForLook(found.passport, look);
			if (outfit) look = "";
		}
		const s = settings();
		const identity = found ? passportTags(found.passport, outfit ? {
			allowNsfw: false,
			outfit
		} : {
			allowNsfw: false,
			withoutClothing: Boolean(look)
		}) : "";
		const size = markerDimensions("portrait", void 0, s.anlas.freeOnly);
		return {
			scene: joinTags(identity, look, s.des.portraitTags),
			...found?.passport.negative ? { negative: found.passport.negative } : {},
			generation: {
				width: size.width,
				height: size.height,
				seed: stableSeed(name),
				characters: []
			},
			priority: this.manualPortraits.has(normalizeLine(name)) ? "user" : "portrait"
		};
	}
	lastReplyId() {
		const chat = ctx().chat;
		for (let i = chat.length - 1; i >= 0; i--) if (!chat[i]?.is_user && !chat[i]?.is_system) return i;
		return chat.length - 1;
	}
	async openPassport(name) {
		let found = await this.findPassport(name);
		if (!found) {
			const look = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? "";
			found = look ? await this.createPassport({
				name,
				look
			}) : null;
		}
		if (!found) {
			const cardIndex = this.targetCard();
			if (cardIndex === null) return;
			found = {
				cardIndex,
				passport: defaultPassport("character", name)
			};
		}
		const cardIndex = found.cardIndex;
		const cardName = cardIndex === null ? name : ctx().characters[cardIndex]?.name ?? name;
		const located = locatePassport(found.passport.id, cardIndex === null ? {} : { index: cardIndex });
		if (located && (cardIndex !== null || located.owner.type === "chat")) {
			await editLocatedPassport(cardName, located, { identity: true });
			return;
		}
		if (cardIndex === null) return;
		const edited = await editPassport(cardName, found.passport, { identity: true });
		if (!edited) return;
		await saveCardPassport(cardIndex, edited);
		toastr.success(t("naist.passport.saved", { name: edited.name || cardName }));
	}
	async ensureFound(name) {
		const found = await this.findPassport(name);
		if (found) return found;
		const look = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? "";
		return await this.createPassport({
			name,
			look
		});
	}
	async menuAction(action, name, isUser) {
		if (!name) return;
		if (action === "passport") {
			if (isUser) await editPersonaPassport();
			else await this.openPassport(name);
		} else if (action === "emotions") {
			const found = await this.ensureFound(name);
			if (found && found.cardIndex !== null) openEmotions(found.cardIndex, found.passport.id);
			else toastr.warning(t("naist.des.noPassport", { name }));
		} else if (action === "portrait" && this.api) {
			const found = await this.findPassport(name, { provided: {} }) ?? await this.ensureFound(name);
			const look = this.latestTracker()?.characters.find((ch) => sameName(ch.name, name))?.look ?? "";
			this.syncLine(name, found?.passport ?? null, look);
			toastr.info(t("naist.des.portraitStarted", { name }), t("naist.des.title"));
			this.manualPortraits.add(normalizeLine(name));
			try {
				if (await this.api.regeneratePortrait(name)) {
					if (!this.isCardCharacter(name)) {
						this.portraitRecords()[name] = portraitRecord(found?.passport, look);
						this.saveRecords();
					}
					this.api.refreshPortraits();
				}
			} finally {
				this.manualPortraits.delete(normalizeLine(name));
			}
		} else if (action === "scene") {
			const params = {
				prompt: name,
				chars: [{ name }],
				ratio: "portrait"
			};
			await this.markers.illustrate(this.lastReplyId(), params);
		}
	}
	installMenu() {
		const items = [
			[
				"passport",
				"fa-id-card",
				"naist.des.menuPassport"
			],
			[
				"emotions",
				"fa-masks-theater",
				"naist.des.menuEmotions"
			],
			[
				"portrait",
				"fa-image-portrait",
				"naist.des.menuPortrait"
			],
			[
				"scene",
				"fa-image",
				"naist.des.menuScene"
			]
		];
		const add = () => {
			const menu = document.querySelector("#dooms-pb-context-menu");
			if (!menu || menu.querySelector(".naist-des-ctx")) return;
			const divider = document.createElement("div");
			divider.className = "dooms-pb-ctx-divider naist-des-ctx";
			menu.append(divider);
			for (const [action, icon, key] of items) {
				const item = document.createElement("div");
				item.className = "dooms-pb-ctx-item naist-des-ctx";
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
		document.addEventListener("click", (event) => {
			const item = event.target.closest(".naist-des-ctx[data-naist-des]");
			if (!item) return;
			event.preventDefault();
			event.stopPropagation();
			const $ = window.jQuery;
			const menu = $?.("#dooms-pb-context-menu");
			const name = String(menu?.data("character") ?? "");
			const isUser = menu?.data("isUser") === true;
			menu?.hide();
			this.menuAction(item.dataset.naistDes ?? "", name, isUser).catch(reportGenerationError);
		}, true);
		document.addEventListener("contextmenu", () => {
			const visible = settings().des.menu && this.active();
			document.querySelectorAll(".naist-des-ctx").forEach((el) => {
				el.style.display = visible ? "" : "none";
			});
		}, true);
	}
	installBanners() {
		const chat = document.getElementById("chat");
		if (!chat) return;
		let pending = false;
		const decorate = () => {
			pending = false;
			if (!settings().des.banners || !this.active()) return;
			chat.querySelectorAll(":scope > .dooms-info-banner, :scope > .dooms-scene-transition").forEach((el) => {
				if (el.querySelector(".naist-des-illustrate")) return;
				const button = document.createElement("div");
				button.className = "menu_button fa-solid fa-image naist-des-illustrate";
				button.title = t("naist.des.illustrate");
				el.append(button);
			});
		};
		new MutationObserver(() => {
			if (pending) return;
			pending = true;
			setTimeout(decorate, 300);
		}).observe(chat, { childList: true });
		chat.addEventListener("click", (event) => {
			const button = event.target.closest(".naist-des-illustrate");
			if (!button) return;
			event.preventDefault();
			event.stopPropagation();
			const host = button.parentElement;
			if (!host) return;
			let mes = host;
			const forward = host.classList.contains("dooms-scene-transition");
			do
				mes = forward ? mes.nextElementSibling : mes.previousElementSibling;
			while (mes && !mes.classList.contains("mes"));
			const messageId = Number(mes?.getAttribute("mesid"));
			if (!Number.isInteger(messageId)) return;
			const scene = this.trackerOf(messageId)?.scene ?? this.latestTracker()?.scene;
			const prompt = [
				scene?.location,
				scene?.time,
				scene?.weather
			].filter(Boolean).join(", ") || (host.textContent ?? "").replace(/\s+/g, " ").trim();
			if (!prompt) return;
			this.markers.illustrate(messageId, {
				prompt,
				ratio: "landscape"
			}).catch(reportGenerationError);
		});
		decorate();
	}
	installWorkshop() {
		const add = () => {
			const header = document.querySelector("#character-workshop-popup header h3");
			if (!header || header.querySelector("#naist-des-workshop")) return;
			const button = document.createElement("span");
			button.id = "naist-des-workshop";
			button.className = "menu_button fa-solid fa-id-card naist-des-workshop";
			button.title = t("naist.des.workshopPassport");
			header.append(button);
			button.addEventListener("click", () => {
				const name = document.querySelector("#cw-char-title")?.textContent?.trim() ?? "";
				const isUser = !document.querySelector("#cw-user-badge")?.hidden;
				this.menuAction("passport", name, isUser).catch(reportGenerationError);
			});
		};
		add();
		new MutationObserver(() => {
			if (settings().des.menu && this.active()) add();
		}).observe(document.body, { childList: true });
	}
	/** Passports for every character of the latest tracker that has none (the panel button). */
	async passportsForTracker() {
		const tracker = this.latestTracker();
		let created = 0;
		for (const character of tracker?.characters ?? []) {
			if (this.isUserName(character.name) || await this.findPassport(character.name)) continue;
			this.failed.delete(character.name.toLowerCase());
			const found = await this.createPassport(character);
			if (found) {
				created++;
				this.syncLine(character.name, found.passport);
			}
		}
		return created;
	}
};
var instance = null;
function desIntegration() {
	return instance;
}
/** Started after APP_READY: DES initialises asynchronously and late. */
function setupDes(markers) {
	instance = new DesIntegration(markers);
	const c = ctx();
	const begin = () => void instance.start().catch((error) => log.warn("DES integration failed to start", error));
	if (document.readyState === "complete" && document.querySelector("#rpg-extension-enabled")) begin();
	else c.eventSource.on(c.eventTypes.APP_READY ?? "app_ready", begin);
	return instance;
}
//#endregion
//#region src/features/markers/marker-service.ts
/** The message a drawing is for no longer shows it: another chat, the message deleted or swiped. */
function messageGone(messageId) {
	const c = ctx();
	const message = messageId === void 0 ? void 0 : c.chat[messageId];
	if (!message) return void 0;
	const chatId = c.getCurrentChatId();
	const swipe = message.swipe_id ?? 0;
	return () => {
		const now = ctx();
		return now.getCurrentChatId() !== chatId || !now.chat.includes(message) || (message.swipe_id ?? 0) !== swipe;
	};
}
/** The value of a promise, or undefined as soon as the signal aborts. */
function untilAborted(promise, signal) {
	if (signal.aborted) return Promise.resolve(void 0);
	return new Promise((resolve) => {
		const onAbort = () => resolve(void 0);
		signal.addEventListener("abort", onAbort, { once: true });
		promise.then((value) => {
			signal.removeEventListener("abort", onAbort);
			resolve(value);
		}, () => resolve(void 0));
	});
}
/** Generation types that never carry markers to illustrate. */
var SKIPPED_TYPES = /* @__PURE__ */ new Set(["impersonate", "quiet"]);
/** Replies that may be illustrated automatically (not image messages, greetings, commands). */
var AUTO_FILL_TYPES = /* @__PURE__ */ new Set([
	"normal",
	"swipe",
	"regenerate"
]);
var clamp = (n, min, max) => Math.min(max, Math.max(min, n));
var MarkerService = class {
	pipeline;
	inline;
	scenes;
	/** Jobs started while the current reply streams, by ordinal + generation key. */
	early = /* @__PURE__ */ new Map();
	generationType = "";
	/**
	* Marker jobs prepare one at a time and in order (scene, passports, the language model); their
	* NovelAI request then waits in the one queue of the extension with every other request (v0.13.1).
	*/
	queue = Promise.resolve();
	/** Marker jobs waiting behind the one that prepares, in order. */
	chain = [];
	/** The job drawing each placeholder, for its queue status. */
	imageJobs = /* @__PURE__ */ new Map();
	/** Images with a generation in flight (the renderer shows a spinner, not "interrupted"). */
	running = /* @__PURE__ */ new Set();
	/** Images whose drawing waits for the quality gates' verdict. */
	waiting = /* @__PURE__ */ new Set();
	listeners = /* @__PURE__ */ new Set();
	lastScan = 0;
	gate = null;
	/** Messages already illustrated automatically during this generation. */
	filled = /* @__PURE__ */ new Set();
	/** A reply is being generated (the formatter hides a marker that is still being written). */
	generating = false;
	constructor(pipeline, inline, scenes) {
		this.pipeline = pipeline;
		this.inline = inline;
		this.scenes = scenes;
	}
	setGate(gate) {
		this.gate = gate;
	}
	isRunning(imageId) {
		return this.running.has(imageId);
	}
	/** The drawing of this image waits for the quality gates (v0.11). */
	isWaiting(imageId) {
		return this.waiting.has(imageId);
	}
	/** Where the drawing of this image waits (v0.13.1): in the queue (N ahead) or for a retry; else undefined. */
	queueStatus(imageId) {
		const status = this.imageJobs.get(imageId)?.status;
		return status?.state === "queued" || status?.state === "retry" ? status : void 0;
	}
	setJobStatus(job, status) {
		job.status = status;
		for (const [imageId, owner] of this.imageJobs) {
			if (owner !== job) continue;
			for (const listener of this.listeners) listener(imageId);
		}
	}
	/** Jobs behind the preparing one: "in the queue: N". */
	chainChanged() {
		this.chain.forEach((job, i) => this.setJobStatus(job, {
			state: "queued",
			ahead: i + 1
		}));
	}
	onRunningChange(listener) {
		this.listeners.add(listener);
	}
	setRunning(imageId, on) {
		if (on) this.running.add(imageId);
		else this.running.delete(imageId);
		for (const listener of this.listeners) listener(imageId);
	}
	setWaiting(imageId, on) {
		if (on) this.waiting.add(imageId);
		else this.waiting.delete(imageId);
		for (const listener of this.listeners) listener(imageId);
	}
	/** Markers of a text that this configuration accepts. */
	markersIn(text) {
		const all = findMarkers(text);
		return settings().markers.legacy ? all : all.filter((m) => m.format === "nai");
	}
	generationStarted(type, dryRun) {
		if (dryRun || type === "quiet") return;
		this.generationType = type || "normal";
		this.generating = true;
		this.filled.clear();
		this.dropEarly();
	}
	get currentType() {
		return this.generationType;
	}
	/** Generation ended or stopped: a reply that never got MESSAGE_RECEIVED is finalized here. */
	async generationEnded() {
		if (!this.generating) return;
		this.generating = false;
		const chat = ctx().chat;
		const last = chat.length - 1;
		const m = chat[last];
		const reply = Boolean(m && !m.is_user && !m.is_system);
		if (reply && this.markersIn(m.mes).length) await this.finalize(last);
		else {
			this.dropEarly();
			if (reply) replyComplete(last);
			else replyAbandoned();
		}
	}
	chatChanged() {
		this.dropEarly();
	}
	dropEarly() {
		for (const job of this.early.values()) job.abort.abort();
		this.early.clear();
	}
	/** Streaming progress: start generating every complete marker of the reply so far. */
	streamProgress() {
		const s = settings().markers;
		if (!s.enabled || !s.earlyStart || SKIPPED_TYPES.has(this.generationType) || this.gate?.holdEarlyStart()) return;
		const now = Date.now();
		if (now - this.lastScan < 250) return;
		this.lastScan = now;
		const chat = ctx().chat;
		const m = chat[chat.length - 1];
		if (!m || m.is_user || m.is_system) return;
		const markers = this.markersIn(m.mes);
		const allowed = Math.max(0, s.max - this.existingMarkers(m));
		markers.slice(0, allowed).forEach((match, i) => {
			const key = `${i}:${markerGenerationKey(match.params)}`;
			if (!this.early.has(key)) {
				log.info("marker complete while streaming, generation queued");
				const query = {
					messageId: chat.length - 1,
					text: m.mes
				};
				this.early.set(key, this.start(match.params, query, {
					gated: true,
					streaming: true
				}));
			}
		});
	}
	/** Marker images already in a continued message count against the per-reply limit. */
	existingMarkers(m) {
		return this.generationType === "continue" ? readEntries(m.extra).filter((e) => e.marker).length : 0;
	}
	/** A finished reply: markers become pending inline images, generations are delivered. */
	async finalize(messageId, type) {
		const s = settings().markers;
		const kind = type || this.generationType || "normal";
		const early = this.early;
		this.early = /* @__PURE__ */ new Map();
		const c = ctx();
		const m = c.chat[messageId];
		if (!s.enabled || SKIPPED_TYPES.has(kind) || !m || m.is_user || m.is_system) {
			for (const job of early.values()) job.abort.abort();
			replyAbandoned(messageId);
			return;
		}
		replyComplete(messageId);
		const markers = this.markersIn(m.mes);
		const query = {
			messageId,
			text: m.mes
		};
		const existing = kind === "continue" ? readEntries(m.extra).filter((e) => e.marker).length : 0;
		const { keep, drop } = limitMarkers(markers, Math.max(0, s.max - existing));
		if (markers.length) {
			const ids = keep.map(() => c.uuidv4());
			const entries = keep.map((match, i) => createPendingImage(ids[i], match.params, this.inline.displayDefaults(markerDisplay(match.params))));
			const text = replaceMarkers(m.mes, markers, (_match, i) => i < keep.length ? `[nai:img:${ids[i]}]` : "");
			await this.inline.addPending(messageId, text, entries);
			keep.forEach((match, i) => {
				const key = `${i}:${markerGenerationKey(match.params)}`;
				const job = early.get(key) ?? this.start(match.params, query, { gated: true });
				early.delete(key);
				this.deliver(messageId, ids[i], job);
			});
			if (drop.length) log.info(`${drop.length} marker(s) over the limit of ${s.max} removed`);
		}
		for (const job of early.values()) job.abort.abort();
		const count = keep.length + existing;
		const filledKey = `${messageId}:${m.swipe_id ?? 0}`;
		if (s.autoFill && count < s.min && AUTO_FILL_TYPES.has(kind) && !this.filled.has(filledKey)) {
			this.filled.add(filledKey);
			await this.autoFill(messageId, s.min - count);
		}
	}
	/** Fewer markers than the minimum: illustrations of the reply itself, appended at its end. */
	async autoFill(messageId, missing) {
		if (qualityGatesActive()) {
			const verdict = await replyVerdict(messageId);
			if (verdict !== "draw") {
				log.info(`automatic illustration of reply ${messageId} skipped by the quality gate (${verdict})`);
				return;
			}
		}
		const m = ctx().chat[messageId];
		const excerpt = m ? replyExcerpt(m.mes) : "";
		if (!m || !excerpt) return;
		const query = {
			messageId,
			text: m.mes
		};
		const params = { prompt: excerpt };
		const c = ctx();
		const ids = Array.from({ length: Math.min(missing, 3) }, () => c.uuidv4());
		const entries = ids.map((id) => createPendingImage(id, params, this.inline.displayDefaults(markerDisplay(params))));
		await this.inline.addPending(messageId, `${m.mes}\n${ids.map((id) => `[nai:img:${id}]`).join("\n")}`, entries);
		for (const id of ids) this.deliver(messageId, id, this.start(params, query));
	}
	/** One picture asked for from outside the reply (a menu, a scene banner), appended to a message. */
	async illustrate(messageId, params) {
		const m = ctx().chat[messageId];
		if (!m) return;
		const id = ctx().uuidv4();
		const entry = createPendingImage(id, params, this.inline.displayDefaults(markerDisplay(params)));
		await this.inline.addPending(messageId, `${m.mes}\n[nai:img:${id}]`, [entry]);
		await this.deliver(messageId, id, this.start(params, {
			messageId,
			text: m.mes
		}, { priority: "user" }));
	}
	/** Generates a marker image again (after an error or an interrupted generation). */
	async retry(messageId, imageId) {
		const entry = this.inline.entries(messageId).find((e) => e.id === imageId);
		if (!entry?.marker || this.running.has(imageId)) return;
		await this.inline.setMarkerStatus(messageId, imageId, "pending");
		const text = ctx().chat[messageId]?.mes;
		await this.deliver(messageId, imageId, this.start(entry.marker.params, {
			messageId,
			text
		}, { priority: "user" }));
	}
	enqueue(job, task) {
		this.chain.push(job);
		this.chainChanged();
		const start = () => {
			const index = this.chain.indexOf(job);
			if (index !== -1) this.chain.splice(index, 1);
			this.setJobStatus(job, { state: "running" });
			this.chainChanged();
			return task();
		};
		const run = this.queue.then(start, start);
		this.queue = run.catch(() => void 0);
		return run;
	}
	start(params, query = {}, options = {}) {
		const abort = new AbortController();
		const gate = this.gate;
		const messageId = query.messageId;
		const verdict = options.gated && messageId !== void 0 && qualityGatesActive() ? replyVerdict(messageId, { streaming: options.streaming === true }) : void 0;
		const job = {
			promise: Promise.resolve(null),
			abort,
			...verdict ? { verdict } : {}
		};
		job.promise = (async () => {
			if (gate && messageId !== void 0) await gate.wait(messageId, abort.signal);
			if (verdict) {
				const answer = await untilAborted(verdict, abort.signal);
				if (answer === void 0) return null;
				if (answer !== "draw") {
					job.held = answer;
					return null;
				}
			}
			const stale = messageGone(messageId);
			return await this.enqueue(job, async () => abort.signal.aborted || stale?.() ? null : await this.produce(params, abort.signal, query, {
				priority: options.priority ?? "reply",
				kind: "marker",
				...stale ? { stale } : {},
				onStatus: (status) => this.setJobStatus(job, status)
			}));
		})();
		job.promise.catch(() => void 0);
		return job;
	}
	async deliver(hint, imageId, job) {
		const chatId = ctx().getCurrentChatId();
		this.imageJobs.set(imageId, job);
		this.setRunning(imageId, true);
		if (job.verdict) {
			this.setWaiting(imageId, true);
			job.verdict.then(() => this.setWaiting(imageId, false));
		}
		try {
			const produced = await job.promise;
			if (ctx().getCurrentChatId() !== chatId) return;
			if (produced) await this.inline.completePending(hint, imageId, produced);
			else if (job.held) {
				const reason = job.held === "skip" ? "naist.markers.qualitySkipped" : "naist.markers.qualityCancelled";
				await this.inline.setMarkerStatus(hint, imageId, "pending", t(reason));
			} else await this.inline.setMarkerStatus(hint, imageId, "error", t("naist.markers.cancelled"));
		} catch (error) {
			const naiError = toNaiError(error);
			log.warn("marker image failed:", naiError.code);
			if (ctx().getCurrentChatId() === chatId) await this.inline.setMarkerStatus(hint, imageId, "error", naiError.code === "aborted" ? t("naist.markers.cancelled") : naiError.text);
		} finally {
			this.imageJobs.delete(imageId);
			this.setRunning(imageId, false);
		}
	}
	/** One marker as a generation request: every parameter it may carry. */
	async produce(params, signal, query = {}, queue = {
		priority: "reply",
		kind: "marker"
	}) {
		const s = settings();
		const freeOnly = s.anlas.freeOnly || !s.markers.allowPaid;
		const model = markerModel(params.model) ?? s.generation.model;
		const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
		const dims = markerDimensions(params.ratio, params.size, freeOnly);
		const generation = {
			model,
			width: dims.width,
			height: dims.height,
			characters: []
		};
		if (params.seed !== void 0) generation.seed = params.seed;
		if (params.steps !== void 0) generation.steps = clamp(Math.round(params.steps), 1, freeOnly ? 28 : 50);
		if (params.scale !== void 0) generation.scale = clamp(params.scale, 0, 10);
		if (params.sampler) generation.sampler = params.sampler;
		if (params.rescale !== void 0) generation.cfgRescale = clamp(params.rescale, 0, 1);
		if (params.variety !== void 0) generation.varietyBoost = params.variety;
		if (params.quality !== void 0) {
			const current = s.generation.qualityPreset;
			generation.qualityPreset = params.quality ? current === "none" ? "standard" : current : "none";
		}
		if (params.uc && UC_PRESETS.includes(params.uc)) generation.ucPreset = params.uc;
		if (params.transparent !== void 0) generation.transparentBackground = params.transparent;
		generation.samples = freeOnly ? 1 : clamp(Math.round(params.count ?? 1), 1, 4);
		let scene = params.prompt;
		const negative = params.negative ?? "";
		const style = params.style?.trim();
		let savedStyle;
		if (style) {
			savedStyle = findStyle(s, style);
			if (savedStyle) {
				const preset = styleUcPreset(savedStyle);
				if (preset && !params.uc) generation.ucPreset = preset;
			} else scene = [style, scene].filter((p) => p.trim()).join(", ");
		}
		let chars = params.chars;
		let passportIds = [];
		const declared = Boolean(chars?.length);
		if (!declared) {
			const known = (await sceneCandidates(query)).filter((cand) => cand.passport !== null || cand.fallbackPrompt.trim() !== "" || Boolean(cand.currentLook?.trim()));
			const named = detectParticipants(params.prompt, known, { max: 4 });
			if (named.length) chars = named.map((cand) => ({ name: cand.name }));
		}
		if (chars?.length) {
			const built = await this.scenes.markerScene(scene, chars, query, { counts: declared });
			if (built) {
				scene = built.prompt;
				generation.characters = built.characters;
				generation.useCoords = built.useCoords;
				passportIds = built.passportIds ?? [];
			} else {
				const actions = chars.map((ch) => [ch.pose, ch.action].filter(Boolean).join(" ")).filter(Boolean);
				scene = [scene, ...actions].join(", ");
			}
		}
		const setting = await sceneSetting(query);
		const place = mentionedLocationTags(`${params.location ?? ""} ${setting.location} ${params.prompt}`, setting.locations);
		const things = mentionedLocationTags(params.prompt, setting.objects ?? []);
		if (place || things || setting.world) scene = joinTags(scene, place, things, setting.world);
		if (params.text && caps.family !== "v3") scene = `${scene}, text: ${params.text}`;
		const where = params.location || setting.location;
		const placeId = params.location ? void 0 : setting.locationId;
		if (where && s.continuity.enabled) await setCurrentLocation(where, placeId).catch(() => void 0);
		const requestPatch = params.ref ? await this.refPatch(params.ref, dims) : void 0;
		const vibes = params.vibe ? this.namedVibe(params.vibe) : void 0;
		const overrides = {
			edit: false,
			negative,
			generation,
			...savedStyle ? { style: savedStyle } : {}
		};
		return await this.pipeline.produce({
			initiator: "message",
			trigger: scene,
			scene,
			mode: MODE.FREE,
			interpret: "auto",
			interpretCharacters: "cyrillic",
			overrides,
			...requestPatch ? {
				requestPatch,
				noContinuity: true
			} : {},
			...vibes?.length ? { vibes } : {},
			signal,
			skipCostConfirm: true,
			maxCost: freeOnly ? 0 : s.markers.maxCost,
			...passportIds.length ? { passportIds } : {},
			queue
		});
	}
	/** "ref": an earlier image of the chat (marker id or image id) as the img2img base. */
	async refPatch(ref, size) {
		if (!this.pipeline.studio.state.selection?.transport?.features.img2img) return void 0;
		const chat = ctx().chat;
		for (let i = chat.length - 1; i >= 0; i--) {
			const entry = readEntries(chat[i]?.extra).find((e) => e.id === ref || e.marker?.params.id === ref);
			const swipe = entry ? activeSwipe(entry) : void 0;
			if (!swipe) continue;
			try {
				return {
					mode: "img2img",
					image: await blobToBase64$1(await toPngBlob(await this.inline.sourceBlob(swipe), size)),
					strength: settings().continuity.strength
				};
			} catch (error) {
				log.warn("marker ref image not available:", error);
				return;
			}
		}
	}
	namedVibe(name) {
		const wanted = name.trim().toLowerCase();
		const item = vibeItems().find((v) => v.name.trim().toLowerCase() === wanted);
		return item ? [{
			item,
			strength: .6,
			informationExtracted: 1
		}] : [];
	}
};
//#endregion
//#region src/integration/macros.ts
function registerMacros() {
	const c = ctx();
	const positive = () => currentCharacterPrompt().positive;
	const negative = () => currentCharacterPrompt().negative;
	if (c.powerUserSettings.experimental_macro_engine !== false && c.macros) {
		const category = c.macros.category?.PROMPTS;
		c.macros.register("charPrefix", {
			category,
			description: t("naist.macro.charPrefix"),
			handler: positive
		});
		c.macros.register("charNegativePrefix", {
			category,
			description: t("naist.macro.charNegativePrefix"),
			handler: negative
		});
	} else if (c.registerMacro) {
		c.registerMacro("charPrefix", positive, t("naist.macro.charPrefix"));
		c.registerMacro("charNegativePrefix", negative, t("naist.macro.charNegativePrefix"));
	}
}
/** {{nai_characters}}: characters of the chat with a passport (their looks are added by name). */
function registerCharactersMacro(names) {
	const c = ctx();
	if (c.powerUserSettings.experimental_macro_engine !== false && c.macros) c.macros.register("nai_characters", {
		category: c.macros.category?.PROMPTS,
		description: t("naist.macro.characters"),
		handler: names
	});
	else if (c.registerMacro) c.registerMacro("nai_characters", names, t("naist.macro.characters"));
}
//#endregion
//#region src/integration/markers-setup.ts
var PROMPT_KEY = "nai_studio_markers";
/** extension_prompt_types.IN_CHAT and extension_prompt_roles in public/script.js. */
var IN_CHAT = 1;
var ROLES = {
	system: 0,
	user: 1,
	assistant: 2
};
var NO_INSTRUCTION = /* @__PURE__ */ new Set(["impersonate", "quiet"]);
var service = null;
/** Names for {{nai_characters}}, refreshed with the instruction. */
var knownCharacters = "";
/** Placeholder as <img> for display regexes; the id is in the attribute and in the src fragment. */
function compatImage(id) {
	return `<img ${IMG_ATTR}="${id}" class="naist-compat" src="${PIXEL}${WIDGET_SRC_MARK}${id}" alt="">`;
}
/** A complete marker while the reply streams: an <img> box (widgets keep their layout). */
function streamingImage(params) {
	const size = markerDimensions(params.ratio, params.size, true);
	const label = escapeHtml$2((params.caption || params.prompt).slice(0, 200));
	return `<img class="naist-marker-stream" src="${PIXEL}#naist-stream" width="${size.width}" height="${size.height}" alt="${label}" title="${label}">`;
}
function formatHook(mes, info) {
	const s = settings();
	let out = mes;
	if (s.markers.enabled && service && !info.isUser) {
		if (service.generating && info.messageId === ctx().chat.length - 1) {
			const cut = partialMarkerStart(out);
			if (cut >= 0) out = out.slice(0, cut);
		}
		const markers = service.markersIn(out);
		if (markers.length) out = replaceMarkers(out, markers, (m) => streamingImage(m.params));
	}
	if (s.inline.regexCompat && out.includes("[nai:img:")) out = out.replace(new RegExp(PLACEHOLDER_PATTERN.source, "g"), (_m, id) => compatImage(id));
	return out;
}
/** Puts the current instruction in place (or clears it); called on settings and chat changes. */
async function refreshMarkerInstruction() {
	const c = ctx();
	const s = settings().markers;
	let value = "";
	let chars = [];
	if (s.enabled) try {
		chars = (await sceneCandidates()).filter((cand) => !cand.isUser && (cand.passport || cand.currentLook?.trim())).map((cand) => cand.name);
	} catch (error) {
		log.warn("marker instruction: characters not available", error);
	}
	knownCharacters = chars.join(", ");
	if (s.enabled && s.inject) value = markerInstruction(s.preset, s.template, {
		min: s.min,
		max: s.max,
		captionLanguage: s.captionLanguage,
		chars
	});
	c.setExtensionPrompt(PROMPT_KEY, value, IN_CHAT, Math.max(0, s.depth), false, ROLES[s.role] ?? 0, () => {
		const now = settings().markers;
		return now.enabled && now.inject && !NO_INSTRUCTION.has(service?.currentType ?? "");
	});
}
function setupMarkers(pipeline, inline, scenes) {
	const c = ctx();
	const markers = new MarkerService(pipeline, inline, scenes);
	service = markers;
	c.messageFormatter.addHook(formatHook, { stage: "beforeRegex" });
	try {
		registerCharactersMacro(() => knownCharacters);
	} catch (error) {
		log.warn("{{nai_characters}} macro not registered", error);
	}
	const renderer = inlineRenderer();
	renderer?.setMarkerHooks({
		isRunning: (id) => markers.isRunning(id),
		isWaiting: (id) => markers.isWaiting(id),
		queueStatus: (id) => markers.queueStatus(id),
		retry: (messageId, imageId) => markers.retry(messageId, imageId)
	});
	markers.onRunningChange((id) => renderer?.refreshImage(id));
	const on = (name, handler) => {
		const event = c.eventTypes[name];
		if (event) c.eventSource.on(event, handler);
	};
	on("GENERATION_STARTED", async (type, _options, dryRun) => {
		keepFirst();
		markers.generationStarted(String(type ?? ""), Boolean(dryRun));
		if (!dryRun) await refreshMarkerInstruction();
	});
	on("STREAM_TOKEN_RECEIVED", () => markers.streamProgress());
	const received = (id, type) => {
		markers.finalize(Number(id), typeof type === "string" ? type : void 0).catch((error) => log.warn("markers", error));
	};
	const receivedEvent = c.eventTypes.MESSAGE_RECEIVED;
	if (receivedEvent && c.eventSource.makeFirst) c.eventSource.makeFirst(receivedEvent, received);
	else on("MESSAGE_RECEIVED", received);
	const keepFirst = () => {
		const list = receivedEvent ? c.eventSource.events?.[receivedEvent] : void 0;
		const at = Array.isArray(list) ? list.indexOf(received) : -1;
		if (list && at > 0) list.unshift(...list.splice(at, 1));
	};
	for (const name of ["GENERATION_ENDED", "GENERATION_STOPPED"]) on(name, () => {
		setTimeout(() => void markers.generationEnded().catch((error) => log.warn("markers", error)), 150);
	});
	on("CHAT_CHANGED", () => {
		markers.chatChanged();
		refreshMarkerInstruction();
	});
	refreshMarkerInstruction();
	return markers;
}
/** Settings that change how messages are formatted: re-render the chat. */
function onMarkerSettingChange(path) {
	if (path.startsWith("markers.")) refreshMarkerInstruction();
	if (path === "markers.enabled" || path === "markers.legacy" || path === "inline.regexCompat") {
		const c = ctx();
		c.chat.forEach((m, id) => {
			if (document.querySelector(`#chat .mes[mesid="${id}"]`)) c.updateMessageBlock(id, m);
		});
	}
}
//#endregion
//#region src/features/comic/comic-service.ts
async function drawCover(context, base64, mime, rect) {
	const bitmap = await createImageBitmap(base64ToBlob(base64, mime));
	const scale = Math.max(rect.width / bitmap.width, rect.height / bitmap.height);
	const w = bitmap.width * scale;
	const h = bitmap.height * scale;
	context.save();
	context.beginPath();
	context.rect(rect.x, rect.y, rect.width, rect.height);
	context.clip();
	context.drawImage(bitmap, rect.x + (rect.width - w) / 2, rect.y + (rect.height - h) / 2, w, h);
	context.restore();
	context.lineWidth = 3;
	context.strokeStyle = "#111";
	context.strokeRect(rect.x, rect.y, rect.width, rect.height);
	bitmap.close();
}
var ComicService = class {
	pipeline;
	constructor(pipeline) {
		this.pipeline = pipeline;
	}
	async generate(req) {
		const layout = comicLayout(req.layout);
		const rects = panelPixels(layout, req.page, req.gutter);
		const panels = layout.panels.map((_, i) => req.panels[i] ?? {
			prompt: "",
			text: []
		});
		if (panels.every((p) => !p.prompt.trim())) throw new NaiError("no-usable-message", "none");
		const seed = settings().generation.seed >= 0 ? settings().generation.seed : randomSeed();
		const chatId = ctx().getCurrentChatId();
		const canvas = document.createElement("canvas");
		canvas.width = req.page.width;
		canvas.height = req.page.height;
		const context = canvas.getContext("2d");
		context.fillStyle = "#fff";
		context.fillRect(0, 0, canvas.width, canvas.height);
		let done = 0;
		let cost = 0;
		req.onProgress?.(0, panels.length);
		for (const [i, panel] of panels.entries()) {
			const rect = rects[i];
			if (!rect || !panel.prompt.trim()) continue;
			const size = panelRequestSize(rect);
			const produced = await this.pipeline.produce({
				initiator: "panel",
				trigger: panel.prompt,
				scene: panelPrompt(req.style, panel),
				mode: MODE.FREE,
				noContinuity: true,
				signal: req.signal,
				queue: {
					priority: "background",
					kind: "comic"
				},
				overrides: {
					edit: false,
					generation: {
						model: req.model,
						seed: seed + i,
						width: size.width,
						height: size.height,
						samples: 1,
						characters: []
					}
				}
			});
			const image = produced?.images[0];
			if (!image) return null;
			cost += produced.prepared.cost.total;
			await drawCover(context, image.base64, image.mime, rect);
			req.onProgress?.(++done, panels.length);
		}
		const saved = await saveImages([{
			base64: await blobToBase64$1(await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("canvas export failed")), "image/png"))),
			mime: "image/png",
			index: 0,
			seed
		}], imageFolder());
		const first = saved[0];
		if (!first) throw new NaiError("invalid-response", "none", { preview: "" });
		const summary = panels.map((p, i) => `${i + 1}. ${p.prompt.trim()}`).filter((line) => !/^\d+\. $/.test(line)).join("\n");
		const meta = {
			scenePrompt: summary,
			prompt: summary,
			negative: "",
			mode: MODE.FREE,
			model: req.model,
			seed,
			transport: this.pipeline.studio.state.selection?.transport.id ?? "",
			cost,
			width: req.page.width,
			height: req.page.height,
			tool: "comic"
		};
		if (ctx().getCurrentChatId() !== chatId) return {
			path: first.path,
			messageId: null,
			panels: done
		};
		const s = settings();
		const messageId = await postToChat(saved, meta, {
			visible: s.chat.visibility.panel === true,
			author: s.chat.author,
			hidePrompt: true,
			text: summary
		});
		log.info("comic", `${done} panel(s)`, `cost ${cost}`);
		return {
			path: first.path,
			messageId,
			panels: done
		};
	}
};
//#endregion
//#region package.json
var version = "0.13.2";
//#endregion
//#region src/features/settings-io/settings-io.ts
async function exportSettingsFile(includeImages) {
	const s = settings();
	const images = {};
	if (includeImages) for (const item of s.vibes.items) for (const key of [item.imageKey, item.thumbKey]) {
		const blob = await imageStore().getItem(key);
		if (blob) images[key] = await blobToBase64$1(blob);
	}
	const data = buildSettingsExport(s, 12, version, images);
	const name = `nai-studio-settings-${data.exportedAt.slice(0, 10)}.json`;
	downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), name);
	return name;
}
async function importSettingsText(text) {
	const check = checkSettingsImport(text, 12);
	if (!check.ok) throw new NaiError("import-failed", "none", { reason: t(`naist.io.reason.${check.reason}`, {
		version: check.schemaVersion ?? "",
		current: 12
	}) });
	try {
		const key = await backupSettings(settings(), settings().schemaVersion);
		log.info("settings backed up before import", key);
	} catch (error) {
		log.warn("settings backup before import failed", error);
	}
	const { settings: next } = migrateAndFill(check.settings, libs().lodash.merge);
	let images = 0;
	for (const [key, value] of Object.entries(check.images)) {
		await imageStore().setItem(key, base64ToBlob(value, "image/png"));
		images++;
	}
	replaceSettings(next);
	log.info("settings imported from schema", check.schemaVersion, `${images} image(s)`);
	return {
		fromVersion: check.schemaVersion,
		images
	};
}
//#endregion
//#region src/features/translate/translate-service.ts
var memory = /* @__PURE__ */ new Map();
async function translatePrompt(text) {
	if (!needsTranslation(text)) return {
		text,
		cached: false
	};
	const glossary = settings().translate.glossary;
	const prepared = applyGlossary(text, glossary);
	if (!needsTranslation(prepared)) return {
		text: prepared,
		cached: false
	};
	const key = `tr:${await sha256Hex(translationKeySource(prepared, glossary))}`;
	const hit = memory.get(key) ?? await store().getItem(key);
	if (hit && !needsTranslation(hit) && !looksLikeChatter(hit, prepared)) {
		memory.set(key, hit);
		return {
			text: hit,
			cached: true
		};
	}
	if (hit) {
		memory.delete(key);
		await store().removeItem(key);
	}
	const c = ctx();
	const structured = c.mainApi === "openai";
	let raw;
	try {
		if (structured) {
			const { system, prompt } = translationPrompt(prepared, glossary);
			raw = await c.generateRaw({
				prompt,
				systemPrompt: system,
				responseLength: 400,
				jsonSchema: TRANSLATION_SCHEMA
			});
		} else raw = await c.generateRaw({
			prompt: [{
				role: "system",
				content: completionPrompt(prepared, glossary)
			}],
			prefill: COMPLETION_PREFILL,
			responseLength: 150
		});
	} catch (error) {
		throw new NaiError("translation-failed", "none", { message: String(error?.message ?? error) });
	}
	const result = structured ? parseTranslation(raw) : parseCompletion(raw);
	if (!result || needsTranslation(result) || looksLikeChatter(result, prepared)) {
		log.warn("translation answer not usable:", String(raw).slice(0, 200));
		throw new NaiError("translation-failed", "none", { message: String(raw).slice(0, 120) });
	}
	memory.set(key, result);
	await store().setItem(key, result);
	log.info("prompt translated", structured ? "(structured output)" : "(few-shot)");
	return {
		text: result,
		cached: false
	};
}
//#endregion
//#region src/features/prompt-tools/tokenizers.ts
var env = {
	fetch: (input, init) => fetch(input, init),
	headers: () => requestHeaders()
};
var loading = /* @__PURE__ */ new Map();
var ready = /* @__PURE__ */ new Map();
var APPROXIMATE = { count: approximateTokens };
async function inflateRaw(data) {
	const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
	return await new Response(stream).text();
}
function build(kind, json) {
	if (kind === "clip") return new ClipTokenizer(json.text);
	if (kind === "t5") return new T5Tokenizer(json);
	return new ByteBpeTokenizer(json);
}
async function load(kind) {
	const file = TOKENIZER_FILES[kind];
	const key = `tokdef:${file}`;
	let data = await store().getItem(key);
	if (!data) {
		data = await fetchTokenizerDefinition(env, file);
		if (!data) {
			log.warn("tokenizer unavailable, counting approximately:", file);
			return null;
		}
		await store().setItem(key, data);
	}
	const counter = build(kind, JSON.parse(await inflateRaw(data)));
	ready.set(kind, counter);
	log.info("tokenizer ready:", file);
	return counter;
}
/** Starts loading (once) and resolves with the tokenizer, or null when it cannot be had. */
function loadTokenizer(kind) {
	let promise = loading.get(kind);
	if (!promise) {
		promise = load(kind).catch((error) => {
			log.warn("tokenizer failed to load:", error);
			loading.delete(kind);
			return null;
		});
		loading.set(kind, promise);
	}
	return promise;
}
/** The tokenizer if it is already built (synchronous, for typing). */
function readyTokenizer(kind) {
	return ready.get(kind) ?? null;
}
//#endregion
//#region src/ui/comic-dialog.ts
var V5_MODELS = MODELS.filter((m) => m.id.startsWith("nai-diffusion-5"));
function layoutPreview(id) {
	return `<svg viewBox="0 0 40 60" class="naist-comic-thumb">${comicLayout(id).panels.map((p) => `<rect x="${p.x * 40 + 1}" y="${p.y * 60 + 1}" width="${p.w * 40 - 2}" height="${p.h * 60 - 2}" rx="1"></rect>`).join("")}</svg>`;
}
async function openComicDialog(service) {
	const c = ctx();
	const s = settings().comic;
	const current = settings().generation.model;
	const model = V5_MODELS.some((m) => m.id === current) ? current : "nai-diffusion-5-full";
	let panels = [];
	const root = document.createElement("div");
	root.className = "naist-dialog naist-comic";
	root.innerHTML = `
        <h3>${escapeHtml$2(t("naist.comic.title"))}</h3>
        <div class="naist-hint">${escapeHtml$2(t("naist.comic.hint"))}</div>
        <div class="naist-comic-layouts">${COMIC_LAYOUTS.map((l) => `<label class="naist-comic-layout${l.id === s.layout ? " naist-tab-active" : ""}" title="${escapeHtml$2(t(`naist.comic.layout.${l.id}`))}">
                <input type="radio" name="naist_comic_layout" value="${l.id}"${l.id === s.layout ? " checked" : ""}>${layoutPreview(l.id)}</label>`).join("")}</div>
        <div class="naist-grid3">
            <div><label>${escapeHtml$2(t("naist.comic.pageWidth"))}</label><input type="number" min="256" max="4096" step="16" class="text_pole naist-comic-w" value="${s.pageWidth}"></div>
            <div><label>${escapeHtml$2(t("naist.comic.pageHeight"))}</label><input type="number" min="256" max="4096" step="16" class="text_pole naist-comic-h" value="${s.pageHeight}"></div>
            <div><label>${escapeHtml$2(t("naist.comic.gutter"))}</label><input type="number" min="0" max="128" class="text_pole naist-comic-gutter" value="${s.gutter}"></div>
        </div>
        <div class="naist-grid2">
            <div><label>${escapeHtml$2(t("naist.comic.style"))}</label><input class="text_pole naist-comic-style" value="${escapeHtml$2(s.style)}"></div>
            <div><label>${escapeHtml$2(t("naist.panel.model"))}</label><select class="text_pole naist-comic-model">${V5_MODELS.map((m) => `<option value="${m.id}"${m.id === model ? " selected" : ""}>${escapeHtml$2(t(m.nameKey))}</option>`).join("")}</select></div>
        </div>
        <div class="naist-comic-panels"></div>
        <div class="naist-row">
            <div class="menu_button naist-comic-run">${escapeHtml$2(t("naist.comic.run"))}</div>
            <span class="naist-muted naist-comic-status"></span>
        </div>`;
	const layoutId = () => root.querySelector("input[name=\"naist_comic_layout\"]:checked")?.value ?? s.layout;
	const modelId = () => root.querySelector(".naist-comic-model").value;
	const counter = () => readyTokenizer("qwen") ?? APPROXIMATE;
	const readPanels = () => {
		panels = [...root.querySelectorAll(".naist-comic-panel")].map((el) => ({
			prompt: el.querySelector(".naist-comic-prompt").value,
			text: el.querySelector(".naist-comic-text").value.split("\n")
		}));
	};
	const updateCounts = () => {
		readPanels();
		const limit = tokenLimit(modelId());
		const approx = !readyTokenizer("qwen");
		root.querySelectorAll(".naist-comic-panel").forEach((el, i) => {
			const panel = panels[i];
			const info = el.querySelector(".naist-comic-count");
			if (!panel || !info) return;
			const style = root.querySelector(".naist-comic-style").value;
			const total = counter().count(`${style}, ${panel.prompt}`) + counter().count(panelTextBlock(panel));
			info.textContent = t("naist.comic.tokens", {
				text: `${approx ? "≈" : ""}${counter().count(panelTextBlock(panel))}`,
				total: `${approx ? "≈" : ""}${total}`,
				limit
			});
			info.classList.toggle("naist-warning", total > limit);
		});
	};
	const renderPanels = () => {
		const count = comicLayout(layoutId()).panels.length;
		const box = root.querySelector(".naist-comic-panels");
		box.innerHTML = Array.from({ length: count }, (_, i) => {
			const p = panels[i] ?? {
				prompt: "",
				text: []
			};
			return `<div class="naist-section naist-comic-panel">
                <b>${escapeHtml$2(t("naist.comic.panel", { n: i + 1 }))}</b>
                <textarea class="text_pole textarea_compact naist-comic-prompt" rows="2" placeholder="${escapeHtml$2(t("naist.comic.promptPlaceholder"))}">${escapeHtml$2(p.prompt)}</textarea>
                <textarea class="text_pole textarea_compact naist-comic-text" rows="2" placeholder="${escapeHtml$2(t("naist.comic.textPlaceholder"))}">${escapeHtml$2(p.text.join("\n"))}</textarea>
                <div class="naist-muted naist-comic-count"></div>
            </div>`;
		}).join("");
		updateCounts();
	};
	const abort = new AbortController();
	let running = false;
	root.addEventListener("change", (event) => {
		const el = event.target;
		if (el.matches("input[name=\"naist_comic_layout\"]")) {
			readPanels();
			root.querySelectorAll(".naist-comic-layout").forEach((l) => l.classList.toggle("naist-tab-active", l.contains(el)));
			renderPanels();
		}
	});
	root.addEventListener("input", () => updateCounts());
	root.addEventListener("click", (event) => {
		const el = event.target;
		if (!el.classList.contains("naist-comic-run") || running) return;
		readPanels();
		const status = root.querySelector(".naist-comic-status");
		s.layout = layoutId();
		s.pageWidth = Number(root.querySelector(".naist-comic-w").value) || s.pageWidth;
		s.pageHeight = Number(root.querySelector(".naist-comic-h").value) || s.pageHeight;
		s.gutter = Math.max(0, Number(root.querySelector(".naist-comic-gutter").value) || 0);
		s.style = root.querySelector(".naist-comic-style").value;
		saveSettings();
		running = true;
		el.classList.add("disabled");
		service.generate({
			layout: s.layout,
			page: {
				width: s.pageWidth,
				height: s.pageHeight
			},
			gutter: s.gutter,
			style: s.style,
			model: modelId(),
			panels,
			signal: abort.signal,
			onProgress: (done, total) => status.textContent = t("naist.comic.progress", {
				done,
				total
			})
		}).then((result) => {
			if (result) toastr.success(t("naist.comic.done", { count: result.panels }), t("naist.comic.title"));
		}).catch(reportGenerationError).finally(() => {
			running = false;
			el.classList.remove("disabled");
		});
	});
	loadTokenizer("qwen").then(() => updateCounts());
	renderPanels();
	localize(root);
	await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		allowVerticalScrolling: true,
		okButton: t("naist.sprites.close")
	});
	abort.abort();
}
//#endregion
//#region src/ui/sprites-dialog.ts
var STATUS_ICON = {
	pending: "fa-regular fa-clock",
	running: "fa-solid fa-spinner fa-spin",
	done: "fa-solid fa-check",
	failed: "fa-solid fa-triangle-exclamation"
};
function customLabels() {
	const expressions = ctx().extensionSettings.expressions;
	return Array.isArray(expressions?.custom) ? expressions.custom.filter((l) => typeof l === "string") : [];
}
async function openSpritesDialog(service, characterIndex, passportId) {
	const c = ctx();
	const s = settings().sprites;
	const character = c.characters[characterIndex];
	if (!character) {
		toastr.warning(t("naist.sprites.noCharacter"));
		return;
	}
	const all = [...EXPRESSION_LABELS, ...customLabels().filter((l) => !EXPRESSION_LABELS.includes(l))];
	const selected = new Set(spriteLabels(s.labels));
	const people = spritePassports(characterIndex);
	let who = people.some((p) => p.id === passportId) ? passportId : people[0]?.id;
	const model = settings().generation.model;
	const root = document.createElement("div");
	root.className = "naist-dialog naist-sprites";
	root.innerHTML = `
        <h3>${escapeHtml$2(t("naist.sprites.title"))}</h3>
        <div class="naist-row naist-sprite-who-row${people.length > 1 ? "" : " naist-hidden"}">
            <label>${escapeHtml$2(t("naist.sprites.who"))}</label>
            <select class="text_pole naist-grow naist-sprite-who">${people.map((p, i) => `<option value="${escapeHtml$2(p.id)}"${p.id === who ? " selected" : ""}>${escapeHtml$2(p.name || character.name)}${i === 0 ? "" : ` (${escapeHtml$2(t("naist.sprites.costume"))})`}</option>`).join("")}</select>
        </div>
        <div class="naist-hint naist-sprites-target"></div>
        <div class="naist-muted naist-sprites-appearance"></div>
        <div class="naist-row">
            <label class="checkbox_label"><input type="radio" name="naist_sprite_mode" value="director"${s.mode === "director" ? " checked" : ""}><span>${escapeHtml$2(t("naist.sprites.modeDirector"))}</span></label>
            <label class="checkbox_label"><input type="radio" name="naist_sprite_mode" value="seed"${s.mode === "seed" ? " checked" : ""}><span>${escapeHtml$2(t("naist.sprites.modeSeed"))}</span></label>
        </div>
        <div class="naist-hint naist-sprites-mode-hint"></div>
        <div class="naist-grid2">
            <div><label>${escapeHtml$2(t("naist.panel.model"))}</label>
            <select class="text_pole naist-sprite-model">${MODELS.map((m) => `<option value="${m.id}"${m.id === model ? " selected" : ""}>${escapeHtml$2(t(m.nameKey))}</option>`).join("")}</select></div>
            <div><label class="checkbox_label"><input type="checkbox" class="naist-sprite-transparent"${s.transparent ? " checked" : ""}><span>${escapeHtml$2(t("naist.sprites.transparent"))}</span></label></div>
        </div>
        <div class="naist-row">
            <b class="naist-grow">${escapeHtml$2(t("naist.sprites.labels"))}</b>
            <div class="menu_button naist-sprite-all">${escapeHtml$2(t("naist.sprites.all"))}</div>
            <div class="menu_button naist-sprite-none">${escapeHtml$2(t("naist.sprites.none"))}</div>
        </div>
        <div class="naist-sprite-labels">${all.map((label) => `<label class="checkbox_label"><input type="checkbox" value="${escapeHtml$2(label)}"${selected.has(label) ? " checked" : ""}><span>${escapeHtml$2(label)}</span></label>`).join("")}</div>
        <div class="naist-row">
            <div class="menu_button naist-sprite-run">${escapeHtml$2(t("naist.sprites.run"))}</div>
            <span class="naist-muted naist-sprite-summary"></span>
        </div>
        <div class="naist-sprite-progress"></div>`;
	const modelSelect = root.querySelector(".naist-sprite-model");
	const transparent = root.querySelector(".naist-sprite-transparent");
	const mode = () => root.querySelector("input[name=\"naist_sprite_mode\"]:checked")?.value === "seed" ? "seed" : "director";
	const updateTarget = () => {
		const target = root.querySelector(".naist-sprites-target");
		const appearance = root.querySelector(".naist-sprites-appearance");
		if (target) target.textContent = t("naist.sprites.target", {
			name: character.name,
			folder: spriteFolder(characterIndex, who)
		});
		if (appearance) appearance.textContent = t("naist.sprites.appearance", { tags: spriteAppearance(characterIndex, who) || "—" });
	};
	root.querySelector(".naist-sprite-who")?.addEventListener("change", (event) => {
		who = event.target.value;
		updateTarget();
	});
	const updateMode = () => {
		const id = modelSelect.value;
		const caps = getCapabilities(isModelId(id) ? id : DEFAULT_MODEL);
		transparent.disabled = !caps.transparency || mode() !== "seed";
		const hint = root.querySelector(".naist-sprites-mode-hint");
		if (hint) hint.textContent = t(mode() === "seed" ? "naist.sprites.modeSeedHint" : "naist.sprites.modeDirectorHint");
	};
	const labels = () => [...root.querySelectorAll(".naist-sprite-labels input:checked")].map((i) => i.value);
	const summary = () => {
		const el = root.querySelector(".naist-sprite-summary");
		if (el) el.textContent = t("naist.sprites.count", { count: labels().length });
	};
	const renderJobs = (jobs) => {
		const el = root.querySelector(".naist-sprite-progress");
		if (!el) return;
		el.innerHTML = jobs.map((j) => `<div class="naist-sprite-job naist-sprite-${j.status}"><i class="${STATUS_ICON[j.status]}"></i> <b>${escapeHtml$2(j.label)}</b>
                <span class="naist-muted">${escapeHtml$2(j.how ? t(`naist.sprites.how.${j.how}`) : "")}${j.file ? ` → ${escapeHtml$2(j.file)}` : ""}${j.error ? ` — ${escapeHtml$2(j.error)}` : ""}</span></div>`).join("");
	};
	const abort = new AbortController();
	let running = false;
	root.addEventListener("change", () => {
		updateMode();
		summary();
	});
	root.addEventListener("click", (event) => {
		const el = event.target;
		if (el.classList.contains("naist-sprite-all") || el.classList.contains("naist-sprite-none")) {
			const on = el.classList.contains("naist-sprite-all");
			root.querySelectorAll(".naist-sprite-labels input").forEach((i) => i.checked = on);
			summary();
		} else if (el.classList.contains("naist-sprite-run") && !running) {
			const chosen = labels();
			if (!chosen.length) return;
			running = true;
			el.classList.add("disabled");
			s.mode = mode();
			s.transparent = transparent.checked;
			s.labels = chosen.length === EXPRESSION_LABELS.length && chosen.every((l, i) => l === EXPRESSION_LABELS[i]) ? [] : chosen;
			saveSettings();
			service.generate({
				characterIndex,
				passportId: who,
				labels: chosen,
				mode: s.mode,
				transparent: s.transparent,
				model: modelSelect.value,
				signal: abort.signal,
				onProgress: renderJobs
			}).then((jobs) => {
				const done = jobs.filter((j) => j.status === "done").length;
				toastr.success(t("naist.sprites.finished", {
					done,
					total: jobs.length,
					folder: spriteFolder(characterIndex, who)
				}), t("naist.sprites.title"));
			}).catch(reportGenerationError).finally(() => {
				running = false;
				el.classList.remove("disabled");
			});
		}
	});
	updateTarget();
	updateMode();
	summary();
	localize(root);
	await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		allowVerticalScrolling: true,
		okButton: t("naist.sprites.close")
	});
	abort.abort();
}
//#endregion
//#region src/integration/tools.ts
var TOOL_NAME = "GenerateImage";
var SHOTS = {
	portrait: { framing: "portrait" },
	"upper body": { framing: "upper_body" },
	"cowboy shot": { framing: "cowboy_shot" },
	"full body": { framing: "full_body" },
	"close-up": { distance: "close_up" },
	"wide shot": { distance: "wide_shot" }
};
var lastCall = 0;
var scenes = null;
/** Phase 4 scene assembly for calls that name characters (set once the scene feature is up). */
function setToolScenes(service) {
	scenes = service;
}
var text = (value) => typeof value === "string" ? value.trim() : "";
/** Flat prompt from the structured arguments (used when no character is named). */
function toolPrompt(args) {
	return [
		text(args.prompt),
		text(args.action),
		text(args.mood),
		text(args.location),
		text(args.shot)
	].filter(Boolean).join(", ");
}
async function generate(pipeline, args) {
	const names = Array.isArray(args.characters) ? args.characters.map(text).filter(Boolean) : [];
	if (names.length && scenes) {
		const action = text(args.action) || text(args.prompt);
		const { spec } = await scenes.autoSpec(`${names.join(", ")}. ${action}`);
		if (spec.participants.length) {
			spec.base = [
				text(args.location),
				action,
				text(args.mood)
			].filter(Boolean).join(", ");
			const shot = SHOTS[text(args.shot).toLowerCase()];
			if (shot?.framing) spec.framing = shot.framing;
			if (shot?.distance) spec.distance = shot.distance;
			const result = await scenes.generate(spec, "message", { auto: true });
			return result && typeof result === "object" ? encodeURI(result.path) : "";
		}
	}
	const prompt = toolPrompt(args);
	if (!prompt) throw new Error("Missing prompt");
	const result = await pipeline.generatePicture({
		initiator: "tool",
		trigger: prompt
	});
	return result ? encodeURI(result.path) : "";
}
function syncFunctionTool(pipeline, compat) {
	const c = ctx();
	const s = settings();
	if (!compat || !s.chat.functionTool) {
		c.unregisterFunctionTool(TOOL_NAME);
		return;
	}
	const description = s.prompts.templates[String(MODE.TOOL)] ?? DEFAULT_TEMPLATES[String(MODE.TOOL)] ?? "";
	c.registerFunctionTool({
		name: TOOL_NAME,
		displayName: t("naist.tool.displayName"),
		description: "Generate an image. Use when a user asks to generate an image, imagine a concept or an item, send a picture of a scene, a selfie, etc. Name the characters in the frame and describe what happens; or give a free prompt.",
		parameters: {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: {
				prompt: {
					type: "string",
					description
				},
				characters: {
					type: "array",
					items: { type: "string" },
					description: "Names of the characters in the frame"
				},
				action: {
					type: "string",
					description: "What is happening, as short English tags"
				},
				mood: {
					type: "string",
					description: "Mood and atmosphere, as short English tags"
				},
				shot: {
					type: "string",
					enum: Object.keys(SHOTS),
					description: "Framing of the picture"
				},
				location: {
					type: "string",
					description: "Where it takes place, as short English tags"
				}
			},
			required: []
		},
		formatMessage: () => t("naist.tool.running"),
		action: async (args) => {
			const cooldown = settings().chat.toolCooldownSeconds * 1e3;
			if (Date.now() - lastCall < cooldown) throw new Error(`Image generation is on cooldown, try again in ${Math.ceil((cooldown - (Date.now() - lastCall)) / 1e3)} s.`);
			lastCall = Date.now();
			return await generate(pipeline, args ?? {});
		}
	});
}
//#endregion
//#region src/integration/phase6-setup.ts
var SPRITES_OPTION = "naist_char_sprites";
var sprites = null;
var comic = null;
function glossaryText() {
	return settings().translate.glossary.map((g) => `${g.from} = ${g.to}`).join("\n");
}
function parseGlossary(text) {
	return text.split("\n").map((line) => line.split("=")).filter((parts) => parts.length >= 2).map(([from, ...rest]) => ({
		from: (from ?? "").trim(),
		to: rest.join("=").trim()
	})).filter((g) => g.from && g.to);
}
function fillGlossary() {
	const field = document.getElementById("naist_glossary");
	if (field && document.activeElement !== field) field.value = glossaryText();
}
/** The newest image of the chat: message media or the active variant of an inline image. */
function lastChatImage() {
	const chat = ctx().chat;
	for (let i = chat.length - 1; i >= 0; i--) {
		const extra = chat[i]?.extra;
		const swipe = readEntries(extra).map(activeSwipe).filter((s) => s?.filePath).at(-1);
		if (swipe) return {
			filePath: swipe.filePath,
			width: swipe.meta.width,
			height: swipe.meta.height,
			model: swipe.meta.model,
			seed: swipe.meta.seed,
			prompt: swipe.meta.scenePrompt
		};
		const media = Array.isArray(extra?.media) ? extra.media : [];
		const item = media[typeof extra?.media_index === "number" ? extra.media_index : media.length - 1] ?? media.at(-1);
		if (item && typeof item.url === "string") {
			const naist = item.nai_studio ?? {};
			return {
				filePath: item.url,
				width: Number(item.width) || 0,
				height: Number(item.height) || 0,
				model: naist.model ?? "",
				seed: naist.seed ?? 0,
				prompt: typeof item.title === "string" ? item.title : naist.prompt ?? ""
			};
		}
	}
	return null;
}
function refreshContinuity() {
	const input = document.getElementById("naist_cont_current");
	if (!input) return;
	const data = ctx().getCurrentChatId() ? continuityData() : {
		current: "",
		locations: {}
	};
	if (document.activeElement !== input) input.value = data.current;
	const list = document.getElementById("naist_cont_locations");
	if (list) {
		list.innerHTML = "";
		for (const location of Object.values(data.locations)) {
			const option = document.createElement("option");
			option.value = location.name;
			list.append(option);
		}
	}
	const info = document.getElementById("naist_cont_info");
	if (info) {
		const ref = ctx().getCurrentChatId() ? currentReference() : null;
		const names = Object.values(data.locations).map((l) => l.name);
		info.textContent = [ref ? t("naist.continuity.boundTo", { path: ref.filePath }) : data.current ? t("naist.continuity.unbound") : "", names.length ? t("naist.continuity.known", { names: names.join(", ") }) : ""].filter(Boolean).join(" · ");
	}
}
async function bindCurrent() {
	const name = document.getElementById("naist_cont_current")?.value.trim() || continuityData().current;
	if (!name) {
		toastr.info(t("naist.continuity.needName"));
		return;
	}
	const image = lastChatImage();
	if (!image) {
		toastr.info(t("naist.continuity.noImage"));
		return;
	}
	await bindLocation(name, image);
	await setCurrentLocation(name);
	toastr.success(t("naist.continuity.bound", { name }), t("naist.continuity.title"));
	refreshContinuity();
}
function openSprites(index = editedCharacterIndex(), passportId) {
	if (!sprites) return;
	if (index === null || ctx().groupId) {
		toastr.info(t("naist.sprites.noCharacter"));
		return;
	}
	openSpritesDialog(sprites, index, passportId).catch(reportGenerationError);
}
function openComic() {
	if (comic) openComicDialog(comic).catch(reportGenerationError);
}
function registerCommands() {
	const { SlashCommandParser: parser, SlashCommand: Command, SlashCommandArgument: Arg, ARGUMENT_TYPE: T } = ctx();
	const text = (description) => [Arg.fromProps({
		description,
		typeList: [T.STRING ?? "string"],
		isRequired: false
	})];
	parser.addCommandObject(Command.fromProps({
		name: "nai-translate",
		returns: t("naist.command.translateReturns"),
		helpString: t("naist.command.translateHelp"),
		unnamedArgumentList: text(t("naist.command.arg.translateText")),
		callback: async (_args, value) => {
			try {
				return (await translatePrompt(String(value ?? ""))).text;
			} catch (error) {
				reportGenerationError(error);
				return "";
			}
		}
	}));
	parser.addCommandObject(Command.fromProps({
		name: "nai-prompt",
		returns: t("naist.command.promptReturns"),
		helpString: t("naist.command.promptHelp"),
		unnamedArgumentList: text(t("naist.command.arg.promptText")),
		callback: async (_args, value) => {
			const input = String(value ?? "");
			try {
				return (await interpretForModel(input, settings().generation.model, {
					force: true,
					strict: true
				}))?.prompt ?? input;
			} catch (error) {
				reportGenerationError(error);
				return "";
			}
		}
	}));
	parser.addCommandObject(Command.fromProps({
		name: "nai-location",
		returns: t("naist.command.locationReturns"),
		helpString: t("naist.command.locationHelp"),
		unnamedArgumentList: text(t("naist.command.arg.locationName")),
		callback: async (_args, value) => {
			const name = String(value ?? "").trim();
			if (name) {
				await setCurrentLocation(name);
				refreshContinuity();
			}
			return continuityData().current;
		}
	}));
	for (const [name, help, open] of [[
		"nai-sprites",
		"naist.command.spritesHelp",
		() => openSprites()
	], [
		"nai-comic",
		"naist.command.comicHelp",
		() => openComic()
	]]) parser.addCommandObject(Command.fromProps({
		name,
		returns: "",
		helpString: t(help),
		callback: async () => {
			open();
			return "";
		}
	}));
}
function installMenuOption() {
	const select = document.querySelector("#char-management-dropdown");
	if (select && !select.querySelector(`#${SPRITES_OPTION}`)) {
		const option = document.createElement("option");
		option.id = SPRITES_OPTION;
		option.setAttribute("data-i18n", "naist.card.sprites");
		option.textContent = t("naist.card.sprites");
		select.append(option);
	}
}
function setupPhase6(pipeline, scenes) {
	pipeline.setInterpreter(languageInterpreter);
	setEmotionsHandler((index, passportId) => openSprites(index, passportId));
	const continuity = new ContinuityService();
	pipeline.setContinuityProvider(continuity);
	pipeline.onGenerated(continuity.observe);
	setExtraVibes(() => continuity.vibes());
	setToolScenes(scenes);
	sprites = new SpriteService(pipeline);
	comic = new ComicService(pipeline);
	document.addEventListener("click", (event) => {
		const target = event.target;
		if (target.closest("#naist_open_sprites")) openSprites();
		else if (target.closest("#naist_open_comic")) openComic();
		else if (target.closest("#naist_cont_bind")) bindCurrent().catch(reportGenerationError);
		else if (target.closest("#naist_cont_forget")) {
			const name = document.getElementById("naist_cont_current")?.value.trim();
			if (name) forgetLocation(name).then(refreshContinuity).catch(reportGenerationError);
		} else if (target.closest("#naist_settings_export")) exportSettingsFile(document.getElementById("naist_settings_images")?.checked !== false).then((file) => toastr.success(t("naist.io.exported", { file }), t("naist.io.title"))).catch(reportGenerationError);
		else if (target.closest("#naist_settings_import")) document.getElementById("naist_settings_file")?.click();
	});
	document.addEventListener("change", (event) => {
		const target = event.target;
		if (target.id === "naist_cont_current") setCurrentLocation(target.value).then(refreshContinuity);
		else if (target.id === "naist_settings_file") {
			const input = target;
			const file = input.files?.[0];
			input.value = "";
			if (!file) return;
			(async () => {
				const c = ctx();
				if (await c.callGenericPopup(t("naist.io.confirmImport", { file: file.name }), c.POPUP_TYPE.CONFIRM) !== c.POPUP_RESULT.AFFIRMATIVE) return;
				const result = await importSettingsText(await file.text());
				toastr.success(t("naist.io.imported", {
					version: result.fromVersion,
					images: result.images
				}), t("naist.io.title"));
			})().catch(reportGenerationError);
		}
	});
	document.addEventListener("input", (event) => {
		const target = event.target;
		if (target.id !== "naist_glossary") return;
		settings().translate.glossary = parseGlossary(target.value);
		saveSettings();
	});
	document.addEventListener("focusin", (event) => {
		if (event.target.id === "naist_cont_current") refreshContinuity();
	});
	onExternalChange(() => {
		fillGlossary();
		refreshContinuity();
	});
	const c = ctx();
	c.eventSource.on(c.eventTypes.CHAT_CHANGED ?? "chat_id_changed", () => {
		startPlaceFollowing();
		refreshContinuity();
	});
	window.addEventListener(PLACES_READY_EVENT, () => startPlaceFollowing());
	c.eventSource.on(c.eventTypes.CHARACTER_MANAGEMENT_DROPDOWN ?? "charManagementDropdown", (target) => {
		if (target === SPRITES_OPTION) openSprites();
	});
	c.eventSource.on(c.eventTypes.APP_READY ?? "app_ready", () => {
		installMenuOption();
		registerCommands();
		fillGlossary();
		startPlaceFollowing();
		refreshContinuity();
		log.info("phase 6 tools ready");
	});
}
//#endregion
//#region src/features/tools/tools-service.ts
function canvasOf(width, height) {
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("canvas unavailable");
	return [canvas, context];
}
async function canvasPng(canvas) {
	return await blobToBase64$1(await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("canvas export failed")), "image/png")));
}
/** Keeps the original outside the mask (the web client composites inpaint results itself). */
async function composite(original, result, mask, offset = {
	x: 0,
	y: 0
}) {
	const resultBitmap = await createImageBitmap(base64ToBlob(result, "image/png"));
	const [out, outContext] = canvasOf(resultBitmap.width, resultBitmap.height);
	outContext.drawImage(resultBitmap, 0, 0);
	const maskBitmap = await createImageBitmap(base64ToBlob(mask, "image/png"));
	const [alpha, alphaContext] = canvasOf(maskBitmap.width, maskBitmap.height);
	alphaContext.drawImage(maskBitmap, 0, 0);
	const pixels = alphaContext.getImageData(0, 0, alpha.width, alpha.height);
	for (let i = 0; i < pixels.data.length; i += 4) {
		pixels.data[i + 3] = pixels.data[i] ?? 0;
		pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = 0;
	}
	alphaContext.putImageData(pixels, 0, 0);
	const originalBitmap = await createImageBitmap(original);
	const [keep, keepContext] = canvasOf(resultBitmap.width, resultBitmap.height);
	keepContext.drawImage(originalBitmap, offset.x, offset.y);
	keepContext.globalCompositeOperation = "destination-out";
	keepContext.drawImage(alpha, 0, 0, keep.width, keep.height);
	outContext.drawImage(keep, 0, 0);
	[
		resultBitmap,
		maskBitmap,
		originalBitmap
	].forEach((b) => b.close());
	return await canvasPng(out);
}
var ToolsService = class {
	pipeline;
	inline;
	confirm;
	constructor(pipeline, inline, confirm) {
		this.pipeline = pipeline;
		this.inline = inline;
		this.confirm = confirm;
	}
	transport(feature, needsExtras) {
		const transport = this.pipeline.studio.state.selection?.transport;
		if (!transport) throw new NaiError("plugin-unavailable", "install-plugin");
		if (!transport.features[feature] || needsExtras && !transport.extras) throw new NaiError("feature-unavailable", "install-plugin", { feature: t(`naist.tool.${feature}`) });
		return transport;
	}
	async withLoader(message, task) {
		const abort = new AbortController();
		const loader = ctx().loader?.show({
			blocking: false,
			slug: "nai-studio-tool",
			title: t("naist.loader.title"),
			message,
			onStop: () => abort.abort()
		});
		try {
			return await task(abort.signal);
		} catch (error) {
			throw toNaiError(error);
		} finally {
			await loader?.hide();
			this.pipeline.studio.refreshAccount();
		}
	}
	chatId() {
		return ctx().getCurrentChatId();
	}
	/** Lineart, sketch, colorize, emotion, declutter, declutter-keep-bubbles, background removal. */
	async director(source, tool, options) {
		const transport = this.transport("director", true);
		const size = directorSize(source.width, source.height);
		const cost = directorToolCost(tool, size.width, size.height, this.pipeline.studio.state.account);
		await guardCost(cost, t(`naist.director.${tool}`), this.confirm);
		const body = directorBody(tool, await sourcePng(source, size), size, options);
		await this.withLoader(t("naist.director.running", { tool: t(`naist.director.${tool}`) }), async (signal) => {
			const images = await unzipImages(await generationQueue.run({
				kind: "tools",
				chatId: this.chatId(),
				signal
			}, (jobSignal) => transport.extras.augment(body, {
				retryable: cost === 0,
				signal: jobSignal
			})));
			const produced = {
				images: images.map((img) => ({
					...img,
					seed: source.meta?.seed
				})),
				meta: toolMeta(source, {
					requestType: "director",
					tool,
					cost,
					width: size.width,
					height: size.height,
					transport: transport.id
				}),
				mode: source.meta?.mode ?? MODE.FREE,
				chatId: this.chatId()
			};
			const names = DIRECTOR_OUTPUTS[tool];
			if (names && names.length === produced.images.length) for (const [i, img] of produced.images.entries()) await deliver(source, {
				...produced,
				images: [img],
				meta: {
					...produced.meta,
					tool: `${tool}:${names[i]}`
				}
			}, {
				inline: this.inline,
				pipeline: this.pipeline
			});
			else await deliver(source, produced, {
				inline: this.inline,
				pipeline: this.pipeline
			});
			log.info("director", tool, `${images.length} image(s)`, `cost ${cost}`);
		});
	}
	/** Size an image is sent at: multiples of 64, and within the free area in free-only mode. */
	requestSize(width, height) {
		const rounded = {
			width: roundToStep(width),
			height: roundToStep(height)
		};
		return settings().anlas.freeOnly ? fitArea(rounded.width, rounded.height, FREE_MAX_PIXELS) : rounded;
	}
	overrides(source, size, model, negative, seed = -1) {
		const m = source.meta;
		return {
			edit: false,
			negative,
			generation: {
				model,
				width: size.width,
				height: size.height,
				seed,
				...m ? {
					steps: m.steps,
					scale: m.scale,
					sampler: m.sampler,
					noiseSchedule: m.noiseSchedule
				} : {}
			}
		};
	}
	/** True when the model inpaints with another model (V5 Curated -> V4.5 Curated inpainting). */
	inpaintFallback(model) {
		const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
		return caps.inpaintBase !== caps.model ? caps.inpaintModel : null;
	}
	async inpaint(source, options, overrideImage) {
		this.transport("inpaint", false);
		const size = this.requestSize(source.width, source.height);
		const image = overrideImage ? await blobToBase64$1(await toPngBlob(overrideImage.image, size)) : await sourcePng(source, size);
		const mask = await blobToBase64$1(await toPngBlob(base64ToBlob(options.mask, "image/png"), size));
		const produced = await this.pipeline.produce({
			initiator: "message",
			trigger: options.prompt || "inpaint",
			scene: options.prompt,
			mode: source.meta?.mode ?? MODE.FREE,
			overrides: this.overrides(source, size, options.model, options.negative),
			requestPatch: {
				mode: "inpaint",
				image,
				mask,
				inpaintStrength: Math.min(1, Math.max(.01, options.strength))
			}
		});
		if (!produced) return;
		if (options.keepOriginal) {
			const scaledOriginal = await toPngBlob(overrideImage?.image ?? await source.blob(), size);
			for (const img of produced.images) {
				img.base64 = await composite(scaledOriginal, img.base64, mask);
				img.mime = "image/png";
			}
		}
		produced.meta = {
			...produced.meta,
			requestType: "inpaint",
			tool: options.tool ?? "inpaint"
		};
		await deliver(source, produced, {
			inline: this.inline,
			pipeline: this.pipeline
		});
	}
	/** Grows the canvas and inpaints the new areas (mask built from the margins). */
	async outpaint(source, grow, options) {
		const plan = planOutpaint(source.width, source.height, grow);
		if (plan.tooLarge) throw new NaiError("size-too-large", "none", {
			width: plan.width,
			height: plan.height,
			max: MAX_REQUEST_PIXELS
		});
		const original = await createImageBitmap(await source.blob(), {
			resizeWidth: source.width,
			resizeHeight: source.height
		});
		const [canvas, context] = canvasOf(plan.width, plan.height);
		context.fillStyle = "#808080";
		context.fillRect(0, 0, plan.width, plan.height);
		context.drawImage(original, plan.offsetX, plan.offsetY);
		original.close();
		const [maskCanvas, maskContext] = canvasOf(plan.width, plan.height);
		maskContext.fillStyle = "#000";
		maskContext.fillRect(0, 0, plan.width, plan.height);
		maskContext.fillStyle = "#fff";
		for (const r of plan.maskRects) maskContext.fillRect(r.x, r.y, r.w, r.h);
		const expanded = base64ToBlob(await canvasPng(canvas), "image/png");
		const grown = {
			...source,
			width: plan.width,
			height: plan.height,
			blob: async () => expanded
		};
		await this.inpaint(grown, {
			...options,
			mask: await canvasPng(maskCanvas),
			strength: 1,
			keepOriginal: true,
			tool: "outpaint"
		});
	}
	/** Upscale x2 through NovelAI (always paid, 1-4 Anlas). */
	async upscale(source) {
		const transport = this.transport("upscale", true);
		if (!canUpscale(source.width, source.height)) throw new NaiError("size-too-large", "none", {
			width: source.width,
			height: source.height,
			max: MAX_REQUEST_PIXELS
		});
		const cost = upscaleCost(source.width, source.height) ?? 0;
		await guardCost(cost, t("naist.tool.upscale"), this.confirm);
		const image = await sourcePng(source);
		await this.withLoader(t("naist.tool.upscaling"), async (signal) => {
			const images = await generationQueue.run({
				kind: "tools",
				chatId: this.chatId(),
				signal
			}, (jobSignal) => transport.extras.upscale({
				image,
				width: source.width,
				height: source.height
			}, jobSignal));
			const first = images[0];
			const size = first ? await generatedSize(first) : {
				width: source.width * 2,
				height: source.height * 2
			};
			await deliver(source, {
				images: images.map((img) => ({
					...img,
					seed: source.meta?.seed
				})),
				meta: toolMeta(source, {
					requestType: "upscale",
					tool: "upscale",
					cost,
					...size,
					transport: transport.id
				}),
				mode: source.meta?.mode ?? MODE.FREE,
				chatId: this.chatId()
			}, {
				inline: this.inline,
				pipeline: this.pipeline
			});
		});
	}
	/** Enhance: the image scaled up and redrawn with img2img (strength and noise adjustable). */
	async enhance(source, options) {
		this.transport("img2img", false);
		const target = enhanceSize(source.width, source.height, options.scale);
		const size = settings().anlas.freeOnly ? fitArea(target.width, target.height, FREE_MAX_PIXELS) : target;
		const image = await sourcePng(source, size);
		const produced = await this.pipeline.produce({
			initiator: "message",
			trigger: options.prompt || "enhance",
			scene: options.prompt,
			mode: source.meta?.mode ?? MODE.FREE,
			overrides: this.overrides(source, size, options.model, options.negative, source.meta?.seed ?? -1),
			requestPatch: {
				mode: "img2img",
				image,
				strength: options.strength,
				noise: options.noise
			}
		});
		if (produced) {
			produced.meta = {
				...produced.meta,
				requestType: "img2img",
				tool: "enhance"
			};
			await deliver(source, produced, {
				inline: this.inline,
				pipeline: this.pipeline
			});
		}
		return size;
	}
};
//#endregion
//#region src/ui/inpaint-editor.ts
async function canvasBase64(canvas) {
	const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("canvas export failed")), "image/png"));
	const buffer = new Uint8Array(await blob.arrayBuffer());
	let binary = "";
	for (let i = 0; i < buffer.length; i += 32768) binary += String.fromCharCode(...buffer.subarray(i, i + 32768));
	return btoa(binary);
}
async function openInpaintEditor(source, initial, fallbackModel) {
	const c = ctx();
	const tools = settings().tools;
	const meta = source.meta;
	const url = URL.createObjectURL(await source.blob());
	const root = document.createElement("div");
	root.className = "naist-dialog naist-inpaint";
	const defaultModel = meta?.model ?? settings().generation.model;
	root.innerHTML = `
        <h3>${escapeHtml$2(t("naist.inpaint.title"))}</h3>
        <div class="naist-tabs naist-inpaint-tabs">
            <div class="naist-tab menu_button" data-pane="inpaint">${escapeHtml$2(t("naist.tools.inpaint"))}</div>
            <div class="naist-tab menu_button" data-pane="outpaint">${escapeHtml$2(t("naist.tools.outpaint"))}</div>
        </div>
        <div class="naist-pane" data-pane="inpaint">
            <div class="naist-row">
                <label class="checkbox_label"><input type="radio" name="naist_ip_tool" value="brush" checked><span>${escapeHtml$2(t("naist.inpaint.brush"))}</span></label>
                <label class="checkbox_label"><input type="radio" name="naist_ip_tool" value="eraser"><span>${escapeHtml$2(t("naist.inpaint.eraser"))}</span></label>
                <label>${escapeHtml$2(t("naist.inpaint.size"))}</label>
                <input type="range" min="4" max="300" class="naist-ip-size" value="${tools.brushSize}">
                <div class="menu_button naist-ip-invert">${escapeHtml$2(t("naist.inpaint.invert"))}</div>
                <div class="menu_button naist-ip-clear">${escapeHtml$2(t("naist.inpaint.clear"))}</div>
            </div>
            <div class="naist-inpaint-stage"><img alt="" src="${escapeHtml$2(url)}"><canvas class="naist-ip-canvas"></canvas></div>
            <div class="naist-hint">${escapeHtml$2(t("naist.inpaint.hint"))}</div>
            <div class="naist-grid2">
                <div><label>${escapeHtml$2(t("naist.inpaint.strength"))}</label><input type="number" min="0.01" max="1" step="0.01" class="text_pole naist-ip-strength" value="${tools.inpaintStrength}"></div>
                <div><label class="checkbox_label"><input type="checkbox" class="naist-ip-keep"${tools.keepOriginal ? " checked" : ""}><span>${escapeHtml$2(t("naist.inpaint.keepOriginal"))}</span></label></div>
            </div>
        </div>
        <div class="naist-pane naist-hidden" data-pane="outpaint">
            <div class="naist-hint">${escapeHtml$2(t("naist.outpaint.hint"))}</div>
            <div class="naist-grid2">${[
		"left",
		"right",
		"top",
		"bottom"
	].map((side) => `<div><label>${escapeHtml$2(t(`naist.outpaint.${side}`))}</label><input type="number" min="0" step="64" value="${side === "left" || side === "right" ? 128 : 0}" class="text_pole naist-op-${side}"></div>`).join("")}</div>
            <div class="naist-muted naist-op-size"></div>
        </div>
        <label>${escapeHtml$2(t("naist.inline.prompt"))}</label>
        <textarea class="text_pole naist-ip-prompt" rows="3">${escapeHtml$2(meta?.scenePrompt ?? "")}</textarea>
        <label>${escapeHtml$2(t("naist.refine.negative"))}</label>
        <input class="text_pole naist-ip-negative" value="${escapeHtml$2(meta?.negative ?? "")}">
        <label>${escapeHtml$2(t("naist.panel.model"))}</label>
        <select class="text_pole naist-ip-model">${MODELS.map((m) => `<option value="${m.id}"${m.id === defaultModel ? " selected" : ""}>${escapeHtml$2(t(m.nameKey))}</option>`).join("")}</select>
        <div class="naist-warning naist-ip-fallback"></div>`;
	const canvas = root.querySelector(".naist-ip-canvas");
	canvas.width = source.width;
	canvas.height = source.height;
	const view = canvas.getContext("2d");
	const mask = document.createElement("canvas");
	mask.width = source.width;
	mask.height = source.height;
	const maskContext = mask.getContext("2d");
	maskContext.fillStyle = "#000";
	maskContext.fillRect(0, 0, mask.width, mask.height);
	let pane = initial;
	let painted = false;
	const redrawView = () => {
		const data = maskContext.getImageData(0, 0, mask.width, mask.height);
		const overlay = view.createImageData(mask.width, mask.height);
		for (let i = 0; i < data.data.length; i += 4) {
			const on = (data.data[i] ?? 0) > 127;
			overlay.data[i] = 255;
			overlay.data[i + 1] = 40;
			overlay.data[i + 2] = 40;
			overlay.data[i + 3] = on ? 130 : 0;
		}
		view.putImageData(overlay, 0, 0);
	};
	const showPane = (name) => {
		pane = name;
		root.querySelectorAll(".naist-pane").forEach((p) => p.classList.toggle("naist-hidden", p.dataset.pane !== name));
		root.querySelectorAll(".naist-inpaint-tabs .naist-tab").forEach((tab) => tab.classList.toggle("naist-tab-active", tab.dataset.pane === name));
	};
	const showFallback = () => {
		const fallback = fallbackModel(root.querySelector(".naist-ip-model")?.value ?? defaultModel);
		const el = root.querySelector(".naist-ip-fallback");
		if (el) el.textContent = fallback ? t("naist.inpaint.fallback", { model: fallback }) : "";
	};
	const growOf = () => {
		const read = (side) => Math.max(0, Number(root.querySelector(`.naist-op-${side}`)?.value) || 0);
		return {
			left: read("left"),
			right: read("right"),
			top: read("top"),
			bottom: read("bottom")
		};
	};
	const showOutpaintSize = () => {
		const plan = planOutpaint(source.width, source.height, growOf());
		const el = root.querySelector(".naist-op-size");
		if (!el) return;
		el.textContent = t(plan.tooLarge ? "naist.outpaint.tooLarge" : "naist.outpaint.size", {
			width: plan.width,
			height: plan.height
		});
		if (!plan.tooLarge && settings().anlas.freeOnly && plan.width * plan.height > 1048576) {
			const sent = fitArea(roundToStep(plan.width), roundToStep(plan.height), FREE_MAX_PIXELS);
			el.textContent += ` ${t("naist.outpaint.freeSize", sent)}`;
		}
	};
	const paint = (event) => {
		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) / rect.width * canvas.width;
		const y = (event.clientY - rect.top) / rect.height * canvas.height;
		const size = Number(root.querySelector(".naist-ip-size")?.value ?? 40);
		const erase = root.querySelector("input[name=\"naist_ip_tool\"]:checked")?.value === "eraser";
		maskContext.fillStyle = erase ? "#000" : "#fff";
		maskContext.beginPath();
		maskContext.arc(x, y, size / 2, 0, Math.PI * 2);
		maskContext.fill();
		painted = true;
	};
	let drawing = false;
	canvas.addEventListener("pointerdown", (event) => {
		drawing = true;
		canvas.setPointerCapture(event.pointerId);
		paint(event);
		redrawView();
	});
	canvas.addEventListener("pointermove", (event) => {
		if (!drawing) return;
		paint(event);
		redrawView();
	});
	canvas.addEventListener("pointerup", () => drawing = false);
	canvas.addEventListener("pointercancel", () => drawing = false);
	root.addEventListener("click", (event) => {
		const el = event.target;
		const tab = el.closest(".naist-inpaint-tabs .naist-tab");
		if (tab) showPane(tab.dataset.pane === "outpaint" ? "outpaint" : "inpaint");
		else if (el.classList.contains("naist-ip-clear")) {
			maskContext.fillStyle = "#000";
			maskContext.fillRect(0, 0, mask.width, mask.height);
			painted = false;
			redrawView();
		} else if (el.classList.contains("naist-ip-invert")) {
			const data = maskContext.getImageData(0, 0, mask.width, mask.height);
			for (let i = 0; i < data.data.length; i += 4) {
				const v = 255 - (data.data[i] ?? 0);
				data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
			}
			maskContext.putImageData(data, 0, 0);
			painted = true;
			redrawView();
		}
	});
	root.addEventListener("change", (event) => {
		const el = event.target;
		if (el.classList.contains("naist-ip-model")) showFallback();
		if (el.className.includes("naist-op-")) showOutpaintSize();
	});
	root.addEventListener("input", (event) => {
		if (event.target.className.includes("naist-op-")) showOutpaintSize();
	});
	showPane(initial);
	showFallback();
	showOutpaintSize();
	redrawView();
	localize(root);
	const ok = await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.inpaint.run"),
		cancelButton: t("naist.inspector.cancel"),
		wide: true,
		large: true,
		allowVerticalScrolling: true
	});
	URL.revokeObjectURL(url);
	if (ok !== c.POPUP_RESULT.AFFIRMATIVE) return null;
	const prompt = root.querySelector(".naist-ip-prompt")?.value.trim() ?? "";
	const negative = root.querySelector(".naist-ip-negative")?.value.trim() ?? "";
	const model = root.querySelector(".naist-ip-model")?.value ?? defaultModel;
	tools.brushSize = Number(root.querySelector(".naist-ip-size")?.value ?? tools.brushSize);
	if (pane === "outpaint") {
		saveSettings();
		return {
			kind: "outpaint",
			grow: growOf(),
			prompt,
			negative,
			model
		};
	}
	if (!painted) {
		toastr.warning(t("naist.inpaint.emptyMask"));
		return null;
	}
	tools.inpaintStrength = Math.min(1, Math.max(.01, Number(root.querySelector(".naist-ip-strength")?.value) || 1));
	tools.keepOriginal = root.querySelector(".naist-ip-keep")?.checked === true;
	saveSettings();
	return {
		kind: "inpaint",
		mask: await canvasBase64(mask),
		prompt,
		negative,
		strength: tools.inpaintStrength,
		keepOriginal: tools.keepOriginal,
		model
	};
}
//#endregion
//#region src/ui/tool-dialogs.ts
var ACTIONS = [
	{
		id: "director",
		icon: "fa-wand-magic-sparkles",
		feature: "director"
	},
	{
		id: "inpaint",
		icon: "fa-paintbrush",
		feature: "inpaint"
	},
	{
		id: "outpaint",
		icon: "fa-expand",
		feature: "inpaint"
	},
	{
		id: "upscale",
		icon: "fa-up-right-and-down-left-from-center",
		feature: "upscale"
	},
	{
		id: "enhance",
		icon: "fa-wand-sparkles",
		feature: "img2img"
	}
];
/** Tools available for an image; disabled ones stay visible with the reason (TZ degradation rule). */
async function toolsMenu(features) {
	const c = ctx();
	const root = document.createElement("div");
	root.className = "naist-dialog naist-tools-menu";
	root.innerHTML = `<h3>${escapeHtml$2(t("naist.tools.title"))}</h3>${ACTIONS.map((a) => {
		const on = features?.[a.feature] === true;
		return `<div class="menu_button naist-tools-item${on ? "" : " disabled"}" data-action="${a.id}" title="${escapeHtml$2(on ? t(`naist.tools.${a.id}Hint`) : t("naist.tools.needsPlugin"))}">
            <i class="fa-solid ${a.icon}"></i> ${escapeHtml$2(t(`naist.tools.${a.id}`))}${on ? "" : ` <span class="naist-muted">— ${escapeHtml$2(t("naist.tools.needsPlugin"))}</span>`}</div>`;
	}).join("")}`;
	let chosen = null;
	const popup = new c.Popup(root, c.POPUP_TYPE.TEXT, "", { okButton: t("naist.inspector.cancel") });
	root.addEventListener("click", (event) => {
		const item = event.target.closest(".naist-tools-item");
		if (!item || item.classList.contains("disabled")) return;
		chosen = item.dataset.action;
		popup.completeCancelled();
	});
	await popup.show();
	return chosen;
}
async function directorDialog(size, account) {
	const c = ctx();
	const s = settings().tools;
	const sent = directorSize(size.width, size.height);
	const root = document.createElement("div");
	root.className = "naist-dialog";
	const costOf = (tool) => directorToolCost(tool, sent.width, sent.height, account);
	root.innerHTML = `
        <h3>${escapeHtml$2(t("naist.director.title"))}</h3>
        <div class="naist-hint">${escapeHtml$2(t("naist.director.hint", {
		width: sent.width,
		height: sent.height
	}))}</div>
        <div class="naist-director-tools">${DIRECTOR_TOOLS.map((tool, i) => {
		const cost = costOf(tool);
		return `<label class="checkbox_label naist-director-tool"><input type="radio" name="naist_dir_tool" value="${tool}"${i === 0 ? " checked" : ""}>
                <span><b>${escapeHtml$2(t(`naist.director.${tool}`))}</b> — ${escapeHtml$2(cost ? t("naist.director.costPaid", { cost }) : t("naist.director.costFree"))}<br><span class="naist-muted">${escapeHtml$2(t(`naist.director.${tool}Hint`))}</span></span></label>`;
	}).join("")}</div>
        <div class="naist-director-extra naist-hidden">
            <div class="naist-director-emotion-row"><label>${escapeHtml$2(t("naist.director.emotion"))}</label>
            <select class="text_pole naist-dir-emotion">${DIRECTOR_EMOTIONS.map((e) => `<option value="${e}"${e === s.emotion ? " selected" : ""}>${escapeHtml$2(t(`naist.emotion.${e}`))}</option>`).join("")}</select></div>
            <label>${escapeHtml$2(t("naist.director.prompt"))}</label>
            <input class="text_pole naist-dir-prompt" placeholder="${escapeHtml$2(t("naist.director.promptPlaceholder"))}">
            <label>${escapeHtml$2(t("naist.director.defry"))}: <span class="naist-dir-defry-value">${s.defry}</span></label>
            <input type="range" min="0" max="5" step="1" class="naist-dir-defry" value="${s.defry}">
        </div>`;
	const update = () => {
		const tool = root.querySelector("input[name=\"naist_dir_tool\"]:checked")?.value ?? "lineart";
		root.querySelector(".naist-director-extra")?.classList.toggle("naist-hidden", !toolTakesPrompt(tool));
		root.querySelector(".naist-director-emotion-row")?.classList.toggle("naist-hidden", tool !== "emotion");
	};
	root.addEventListener("change", update);
	root.addEventListener("input", (event) => {
		const el = event.target;
		if (el.classList.contains("naist-dir-defry")) {
			const label = root.querySelector(".naist-dir-defry-value");
			if (label) label.textContent = el.value;
		}
	});
	update();
	localize(root);
	if (await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.director.run"),
		cancelButton: t("naist.inspector.cancel"),
		wide: true
	}) !== c.POPUP_RESULT.AFFIRMATIVE) return null;
	const tool = root.querySelector("input[name=\"naist_dir_tool\"]:checked")?.value ?? "lineart";
	const emotion = root.querySelector(".naist-dir-emotion")?.value ?? "happy";
	const defry = Number(root.querySelector(".naist-dir-defry")?.value ?? 0);
	s.emotion = emotion;
	s.defry = defry;
	saveSettings();
	return {
		tool,
		options: {
			emotion,
			defry,
			prompt: root.querySelector(".naist-dir-prompt")?.value ?? ""
		}
	};
}
async function enhanceDialog(size, defaults) {
	const c = ctx();
	const s = settings().tools;
	const root = document.createElement("div");
	root.className = "naist-dialog";
	const target = (scale) => enhanceSize(size.width, size.height, scale);
	root.innerHTML = `
        <h3>${escapeHtml$2(t("naist.enhance.title"))}</h3>
        <div class="naist-hint">${escapeHtml$2(t("naist.enhance.hint"))}</div>
        <div class="naist-grid3">
            <div><label>${escapeHtml$2(t("naist.enhance.scale"))}</label><select class="text_pole naist-en-scale">${[
		1,
		1.5,
		2
	].map((v) => `<option value="${v}"${v === s.enhanceScale ? " selected" : ""}>×${v}</option>`).join("")}</select></div>
            <div><label>${escapeHtml$2(t("naist.enhance.strength"))}</label><input type="number" min="0.01" max="0.99" step="0.01" class="text_pole naist-en-strength" value="${s.enhanceStrength}"></div>
            <div><label>${escapeHtml$2(t("naist.enhance.noise"))}</label><input type="number" min="0" max="0.99" step="0.01" class="text_pole naist-en-noise" value="${s.enhanceNoise}"></div>
        </div>
        <div class="naist-muted naist-en-size"></div>
        <label>${escapeHtml$2(t("naist.inline.prompt"))}</label>
        <textarea class="text_pole naist-en-prompt" rows="3">${escapeHtml$2(defaults.prompt)}</textarea>
        <label>${escapeHtml$2(t("naist.panel.model"))}</label>
        <select class="text_pole naist-en-model">${MODELS.map((m) => `<option value="${m.id}"${m.id === defaults.model ? " selected" : ""}>${escapeHtml$2(t(m.nameKey))}</option>`).join("")}</select>
        <div class="naist-hint">${escapeHtml$2(t("naist.enhance.freeNote"))}</div>`;
	const showSize = () => {
		const scale = Number(root.querySelector(".naist-en-scale")?.value ?? 1.5);
		const out = target(scale);
		const el = root.querySelector(".naist-en-size");
		if (!el) return;
		el.textContent = t("naist.enhance.size", {
			from: `${size.width}×${size.height}`,
			to: `${out.width}×${out.height}`
		});
		if (settings().anlas.freeOnly && out.width * out.height > 1048576) el.textContent += ` ${t("naist.outpaint.freeSize", fitArea(out.width, out.height, FREE_MAX_PIXELS))}`;
	};
	root.addEventListener("change", showSize);
	showSize();
	localize(root);
	if (await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.enhance.run"),
		cancelButton: t("naist.inspector.cancel"),
		wide: true
	}) !== c.POPUP_RESULT.AFFIRMATIVE) return null;
	const read = (sel, fallback) => {
		const n = Number(root.querySelector(sel)?.value);
		return Number.isFinite(n) ? n : fallback;
	};
	const choice = {
		scale: read(".naist-en-scale", 1.5),
		strength: Math.min(.99, Math.max(.01, read(".naist-en-strength", .45))),
		noise: Math.min(.99, Math.max(0, read(".naist-en-noise", 0))),
		prompt: root.querySelector(".naist-en-prompt")?.value.trim() ?? defaults.prompt,
		negative: defaults.negative,
		model: root.querySelector(".naist-en-model")?.value ?? defaults.model
	};
	s.enhanceScale = choice.scale;
	s.enhanceStrength = choice.strength;
	s.enhanceNoise = choice.noise;
	saveSettings();
	return choice;
}
/** Cost confirmation of a paid tool call. */
async function confirmToolCost(cost, what, balance) {
	const c = ctx();
	return await c.callGenericPopup(t("naist.tools.confirmCost", {
		cost,
		what,
		balance
	}), c.POPUP_TYPE.CONFIRM) === c.POPUP_RESULT.AFFIRMATIVE;
}
//#endregion
//#region src/ui/vibe-library.ts
async function openVibeLibrary(features) {
	const c = ctx();
	const vibes = settings().vibes;
	const urls = [];
	const root = document.createElement("div");
	root.className = "naist-dialog naist-vibes";
	const status = () => {
		const model = settings().generation.model;
		const caps = getCapabilities(isModelId(model) ? model : DEFAULT_MODEL);
		const availability = vibeAvailability(caps, features?.vibes === true);
		const info = MODELS.find((m) => m.id === caps.model);
		return t(`naist.vibes.status.${availability}`, { model: info ? t(info.nameKey) : caps.model });
	};
	const renderItems = () => vibeItems().map((item) => `<div class="naist-vibe-card" data-id="${escapeHtml$2(item.id)}">
                <img alt="" data-thumb="${escapeHtml$2(item.id)}">
                <input class="text_pole naist-vibe-name" value="${escapeHtml$2(item.name)}">
                <div class="menu_button fa-solid fa-trash-can naist-vibe-remove" title="${escapeHtml$2(t("naist.vibes.remove"))}"></div>
            </div>`).join("") || `<div class="naist-hint">${escapeHtml$2(t("naist.vibes.empty"))}</div>`;
	const renderSet = (set, index) => {
		const ctxNow = vibeContext();
		const bound = (kind, values) => values.length > 0 && values.every((v) => set.bindings[kind].includes(v));
		return `<div class="naist-section naist-vibe-set" data-index="${index}">
            <div class="naist-row">
                <input class="text_pole naist-grow naist-set-name" value="${escapeHtml$2(set.name)}">
                <label class="checkbox_label"><input type="checkbox" class="naist-set-enabled"${set.enabled ? " checked" : ""}><span>${escapeHtml$2(t("naist.vibes.enabled"))}</span></label>
                <div class="menu_button fa-solid fa-trash-can naist-set-remove" title="${escapeHtml$2(t("naist.vibes.removeSet"))}"></div>
            </div>
            <div class="naist-flags">
                <label class="checkbox_label"><input type="checkbox" class="naist-set-global"${set.global ? " checked" : ""}><span>${escapeHtml$2(t("naist.vibes.global"))}</span></label>
                <label class="checkbox_label"><input type="checkbox" class="naist-set-bind" data-kind="characters"${bound("characters", ctxNow.characters) ? " checked" : ""}${ctxNow.characters.length ? "" : " disabled"}><span>${escapeHtml$2(t("naist.vibes.bindCharacter"))}</span></label>
                <label class="checkbox_label"><input type="checkbox" class="naist-set-bind" data-kind="chats"${bound("chats", ctxNow.chatId ? [ctxNow.chatId] : []) ? " checked" : ""}${ctxNow.chatId ? "" : " disabled"}><span>${escapeHtml$2(t("naist.vibes.bindChat"))}</span></label>
                <label class="checkbox_label"><input type="checkbox" class="naist-set-bind" data-kind="styles"${bound("styles", ctxNow.style ? [ctxNow.style] : []) ? " checked" : ""}${ctxNow.style ? "" : " disabled"}><span>${escapeHtml$2(t("naist.vibes.bindStyle"))}</span></label>
            </div>
            ${vibeItems().map((item) => {
			const entry = set.entries.find((e) => e.vibeId === item.id);
			return `<div class="naist-row naist-set-entry" data-vibe="${escapeHtml$2(item.id)}">
                        <label class="checkbox_label naist-grow"><input type="checkbox" class="naist-entry-on"${entry?.enabled ? " checked" : ""}><span>${escapeHtml$2(item.name)}</span></label>
                        <label>${escapeHtml$2(t("naist.vibes.strength"))}</label>
                        <input type="number" min="-1" max="1" step="0.05" class="text_pole naist-entry-strength" value="${entry?.strength ?? .6}">
                        <label>${escapeHtml$2(t("naist.vibes.information"))}</label>
                        <input type="number" min="0.01" max="1" step="0.05" class="text_pole naist-entry-ie" value="${entry?.informationExtracted ?? 1}">
                    </div>`;
		}).join("")}
        </div>`;
	};
	const render = () => {
		const active = activeVibes();
		root.innerHTML = `
            <h3>${escapeHtml$2(t("naist.vibes.title"))}</h3>
            <div class="naist-hint">${escapeHtml$2(status())}</div>
            <div class="naist-hint">${escapeHtml$2(t("naist.vibes.cacheHint"))}</div>
            <div class="naist-muted">${escapeHtml$2(t("naist.vibes.active", {
			count: active.length,
			names: active.map((a) => a.item.name).join(", ") || "—"
		}))}</div>
            <div class="naist-section">
                <b>${escapeHtml$2(t("naist.vibes.images"))}</b>
                <div class="naist-vibe-grid">${renderItems()}</div>
                <div class="naist-row">
                    <div class="menu_button naist-vibe-add">${escapeHtml$2(t("naist.vibes.add"))}</div>
                    <input type="file" accept="image/*" multiple class="naist-hidden naist-vibe-file">
                    <label class="checkbox_label"><input type="checkbox" class="naist-vibe-confirm"${vibes.confirmEncoding ? " checked" : ""}><span>${escapeHtml$2(t("naist.vibes.confirmEncoding"))}</span></label>
                </div>
            </div>
            <b>${escapeHtml$2(t("naist.vibes.sets"))}</b>
            ${vibes.sets.map(renderSet).join("")}
            <div class="menu_button naist-set-add">${escapeHtml$2(t("naist.vibes.addSet"))}</div>`;
		root.querySelectorAll("img[data-thumb]").forEach((img) => {
			const item = vibeItems().find((i) => i.id === img.dataset.thumb);
			if (!item) return;
			vibeThumb(item).then((blob) => {
				if (!blob) return;
				const url = URL.createObjectURL(blob);
				urls.push(url);
				img.src = url;
			});
		});
		localize(root);
	};
	const setOf = (el) => vibes.sets[Number(el.closest(".naist-vibe-set")?.dataset.index)];
	const save = () => saveSettings();
	root.addEventListener("click", (event) => {
		const el = event.target;
		if (el.classList.contains("naist-vibe-add")) root.querySelector(".naist-vibe-file")?.click();
		else if (el.classList.contains("naist-vibe-remove")) removeVibe(el.closest(".naist-vibe-card")?.dataset.id ?? "").then(render);
		else if (el.classList.contains("naist-set-add")) {
			vibes.sets.push({
				id: c.uuidv4(),
				name: t("naist.vibes.setDefault", { n: vibes.sets.length + 1 }),
				enabled: true,
				global: false,
				entries: vibeItems().map((i) => ({
					...defaultVibeEntry(i.id),
					enabled: false
				})),
				bindings: {
					characters: [],
					chats: [],
					styles: []
				}
			});
			save();
			render();
		} else if (el.classList.contains("naist-set-remove")) {
			vibes.sets.splice(Number(el.closest(".naist-vibe-set")?.dataset.index), 1);
			save();
			render();
		}
	});
	root.addEventListener("change", (event) => {
		const el = event.target;
		if (el.classList.contains("naist-vibe-file")) {
			const files = [...el.files ?? []];
			el.value = "";
			(async () => {
				for (const file of files) await addVibe(file, file.name.replace(/\.[^.]+$/, ""));
				render();
			})().catch(reportGenerationError);
			return;
		}
		if (el.classList.contains("naist-vibe-confirm")) vibes.confirmEncoding = el.checked;
		else if (el.classList.contains("naist-vibe-name")) {
			const item = vibeItems().find((i) => i.id === el.closest(".naist-vibe-card")?.dataset.id);
			if (item) item.name = el.value.trim() || item.name;
		} else {
			const set = setOf(el);
			if (!set) return;
			if (el.classList.contains("naist-set-name")) set.name = el.value.trim() || set.name;
			else if (el.classList.contains("naist-set-enabled")) set.enabled = el.checked;
			else if (el.classList.contains("naist-set-global")) set.global = el.checked;
			else if (el.classList.contains("naist-set-bind")) {
				const kind = el.dataset.kind;
				const now = vibeContext();
				const values = kind === "characters" ? now.characters : kind === "chats" ? [now.chatId] : [now.style];
				set.bindings[kind] = el.checked ? [.../* @__PURE__ */ new Set([...set.bindings[kind], ...values.filter(Boolean)])] : set.bindings[kind].filter((v) => !values.includes(v));
			} else {
				const row = el.closest(".naist-set-entry");
				const vibeId = row?.dataset.vibe ?? "";
				if (!row || !vibeId) return;
				let entry = set.entries.find((e) => e.vibeId === vibeId);
				if (!entry) {
					entry = {
						...defaultVibeEntry(vibeId),
						enabled: false
					};
					set.entries.push(entry);
				}
				entry.enabled = row.querySelector(".naist-entry-on")?.checked === true;
				entry.strength = Number(row.querySelector(".naist-entry-strength")?.value) || 0;
				entry.informationExtracted = Number(row.querySelector(".naist-entry-ie")?.value) || 1;
			}
		}
		save();
		const active = root.querySelector(".naist-muted");
		const list = activeVibes();
		if (active) active.textContent = t("naist.vibes.active", {
			count: list.length,
			names: list.map((a) => a.item.name).join(", ") || "—"
		});
	});
	root.addEventListener("dragover", (event) => {
		if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
	});
	root.addEventListener("drop", (event) => {
		const files = [...event.dataTransfer?.files ?? []].filter((f) => f.type.startsWith("image/"));
		if (!files.length) return;
		event.preventDefault();
		event.stopPropagation();
		(async () => {
			for (const file of files) await addVibe(file, file.name.replace(/\.[^.]+$/, ""));
			render();
		})().catch(reportGenerationError);
	});
	render();
	await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, "", {
		wide: true,
		large: true,
		allowVerticalScrolling: true
	});
	for (const url of urls) URL.revokeObjectURL(url);
	saveSettings();
}
//#endregion
//#region src/integration/tools-setup.ts
var MEDIA_BUTTON = "naist-media-tools";
var state = null;
function features() {
	return state?.pipeline.studio.state.selection?.transport.features ?? null;
}
/** "NAI Diffusion V4.5 Curated (nai-diffusion-4-5-curated-inpainting)" when another model inpaints. */
function fallbackName(tools, model) {
	const id = tools.inpaintFallback(model);
	if (!id) return null;
	const base = MODELS.find((m) => m.id === getCapabilities(isModelId(model) ? model : DEFAULT_MODEL).inpaintBase);
	return base ? `${t(base.nameKey)} (${id})` : id;
}
async function runAction(action, source) {
	if (!state) return;
	const { tools, pipeline } = state;
	const meta = source.meta;
	const defaults = {
		prompt: meta?.scenePrompt ?? "",
		negative: meta?.negative ?? "",
		model: meta?.model ?? settings().generation.model
	};
	switch (action) {
		case "director": {
			const choice = await directorDialog(source, pipeline.studio.state.account);
			if (choice) await tools.director(source, choice.tool, choice.options);
			return;
		}
		case "inpaint":
		case "outpaint": {
			const result = await openInpaintEditor(source, action, (model) => fallbackName(tools, model));
			if (!result) return;
			if (result.kind === "inpaint") await tools.inpaint(source, result);
			else await tools.outpaint(source, result.grow, {
				prompt: result.prompt,
				negative: result.negative,
				model: result.model
			});
			return;
		}
		case "upscale":
			await tools.upscale(source);
			return;
		case "enhance": {
			const choice = await enhanceDialog(source, defaults);
			if (choice) await tools.enhance(source, choice);
			return;
		}
	}
}
async function openToolsFor(source, action) {
	try {
		const chosen = action ?? await toolsMenu(features());
		if (!chosen) return;
		await runAction(chosen, await source());
	} catch (error) {
		reportGenerationError(error);
	}
}
function mediaIndexOf(container) {
	const messageId = Number(container.closest(".mes")?.getAttribute("mesid"));
	const index = Number(container.getAttribute("data-index"));
	if (!Number.isInteger(messageId)) return null;
	return {
		messageId,
		mediaIndex: Number.isInteger(index) ? index : 0
	};
}
/** A small tools button on every media image of the chat ("any picture in the chat", TZ). */
function installMediaButtons() {
	const chat = document.getElementById("chat");
	if (!chat) return;
	const decorate = () => {
		chat.querySelectorAll(".mes_img_container").forEach((container) => {
			if (container.querySelector(`.${MEDIA_BUTTON}`)) return;
			const button = document.createElement("div");
			button.title = t("naist.tools.title");
			button.tabIndex = 0;
			button.setAttribute("role", "button");
			const controls = container.querySelector(".mes_img_controls");
			if (controls) {
				button.className = `${MEDIA_BUTTON} right_menu_button fa-lg fa-solid fa-wand-magic-sparkles interactable`;
				controls.append(button);
			} else {
				button.className = `${MEDIA_BUTTON} naist-media-tools-float fa-solid fa-wand-magic-sparkles`;
				container.append(button);
			}
		});
	};
	let pending = false;
	new MutationObserver(() => {
		if (pending) return;
		pending = true;
		setTimeout(() => {
			pending = false;
			decorate();
		}, 50);
	}).observe(chat, {
		childList: true,
		subtree: true
	});
	const activate = (event) => {
		const button = event.target.closest(`.${MEDIA_BUTTON}`);
		if (!button) return;
		event.preventDefault();
		event.stopPropagation();
		const where = mediaIndexOf(button.closest(".mes_img_container") ?? button);
		if (where) openToolsFor(() => mediaSource(where.messageId, where.mediaIndex));
	};
	chat.addEventListener("click", activate);
	chat.addEventListener("keydown", (event) => {
		if (event.key === "Enter" || event.key === " ") activate(event);
	});
	decorate();
}
function vibeNotice(notice) {
	switch (notice.kind) {
		case "unavailable":
			toastr.info(t(`naist.vibes.notice.${notice.reason}`, { count: notice.count }), t("naist.vibes.title"));
			return;
		case "skipped":
			toastr.warning(t(`naist.vibes.skipped.${notice.reason}`, { count: notice.count }), t("naist.vibes.title"));
			return;
		case "encoded":
			toastr.info(t("naist.vibes.encoded", {
				count: notice.count,
				cost: notice.cost
			}), t("naist.vibes.title"));
			return;
		case "missing-image": toastr.warning(t("naist.vibes.missing", { name: notice.name }), t("naist.vibes.title"));
	}
}
function setupTools(pipeline, inline) {
	const confirm = (cost, what) => confirmToolCost(cost, what === "vibes" ? t("naist.vibes.encoding") : what, pipeline.studio.state.account.anlas);
	state = {
		pipeline,
		inline,
		tools: new ToolsService(pipeline, inline, confirm)
	};
	pipeline.setVibeProvider(new VibeLibraryProvider(confirm, vibeNotice));
	setInlineToolsHandler((messageId, imageId) => void openToolsFor(() => inlineSource(inline, messageId, imageId)));
	installMediaButtons();
	registerLightboxAction({
		id: "tools",
		icon: "fa-wand-magic-sparkles",
		labelKey: "naist.tools.title",
		available: (item) => Boolean(item.chat),
		run: (item, close) => {
			const chat = item.chat;
			if (!chat) return;
			close();
			openToolsFor(chat.imageId ? () => inlineSource(inline, chat.messageId, chat.imageId) : () => mediaSource(chat.messageId, chat.mediaIndex ?? 0));
		}
	});
	document.addEventListener("click", (event) => {
		if (event.target.closest("#naist_open_vibes")) openVibeLibrary(features());
	});
	const c = ctx();
	c.eventSource.on(c.eventTypes.APP_READY ?? "app_ready", () => {
		const { SlashCommandParser: parser, SlashCommand: Command } = ctx();
		parser.addCommandObject(Command.fromProps({
			name: "nai-vibes",
			returns: "",
			helpString: t("naist.command.vibesHelp"),
			callback: async () => {
				openVibeLibrary(features());
				return "";
			}
		}));
		log.info("tools ready");
	});
}
//#endregion
//#region src/integration/character-card.ts
var OPTIONS = [[
	"naist_char_portrait",
	"you",
	"naist.card.portrait"
], [
	"naist_char_face",
	"face",
	"naist.card.face"
]];
function installCharacterCardMenu(pipeline) {
	const select = document.querySelector("#char-management-dropdown");
	if (select && !select.querySelector("#naist_char_portrait")) for (const [id, , key] of OPTIONS) {
		const option = document.createElement("option");
		option.id = id;
		option.setAttribute("data-i18n", key);
		option.textContent = t(key);
		select.append(option);
	}
	const c = ctx();
	c.eventSource.on(c.eventTypes.CHARACTER_MANAGEMENT_DROPDOWN ?? "charManagementDropdown", (target) => {
		const option = OPTIONS.find(([id]) => id === target);
		if (!option) return;
		pipeline.generatePicture({
			initiator: "wand",
			trigger: option[1]
		}).catch(reportGenerationError);
	});
}
//#endregion
//#region src/integration/interceptor.ts
var INTERCEPTOR_NAME = "NAIST_ProcessTriggers";
/**
* Inline image placeholders never reach the LLM as raw markers (RECON §2.3 item 8). The prompt array
* is ST's own copy, so replacing an element with a copy leaves the chat untouched. The copy is shallow on
* purpose: `structuredClone` drops symbol keys, and ST leaves a message out of the prompt by
* `extra[symbols.ignore]` — Qvink Memory removes summarized messages this way before our interceptor runs.
*/
function stripPlaceholders(chat, mode) {
	for (let i = 0; i < chat.length; i++) {
		const message = chat[i];
		if (!message?.mes?.includes("[nai:img:")) continue;
		chat[i] = {
			...message,
			mes: textForPrompt(message.mes, readEntries(message.extra), mode)
		};
	}
}
function installInterceptor(pipeline) {
	const interceptor = (chat, _contextSize, abort, type) => {
		const s = settings();
		stripPlaceholders(chat, s.inline.llmText);
		if (type === "quiet" || !s.chat.interactive || !ownsCompatSurface()) return;
		if (s.chat.functionTool && ctx().isToolCallingSupported()) return;
		const last = chat[chat.length - 1];
		if (!last?.mes || !last.is_user) return;
		const trigger = matchInteractiveTrigger(last.mes);
		if (!trigger) return;
		log.info("interactive trigger:", trigger);
		abort(true);
		setTimeout(() => {
			pipeline.generatePicture({
				initiator: "interactive",
				trigger,
				message: last.mes
			}).catch((error) => {
				log.warn("interactive generation failed", error);
				reportGenerationError(error);
			});
		}, 1);
	};
	globalThis[INTERCEPTOR_NAME] = interceptor;
}
//#endregion
//#region src/integration/message-buttons.ts
var BUTTON_CLASS = "naist-message-gen";
var IDLE = "fa-palette";
var BUSY = "fa-hourglass";
function buttonElement() {
	const button = document.createElement("div");
	button.className = `mes_button ${BUTTON_CLASS} fa-solid ${IDLE}`;
	button.setAttribute("data-i18n", "[title]naist.message.generate");
	button.title = t("naist.message.generate");
	return button;
}
function addToContainer(container) {
	if (container && !container.querySelector(`.${BUTTON_CLASS}`)) container.prepend(buttonElement());
}
var running = /* @__PURE__ */ new WeakMap();
async function regenerate(pipeline, button, animate) {
	const existing = running.get(button);
	if (existing) {
		existing.abort();
		return;
	}
	const messageElement = button.closest(".mes");
	const messageId = Number(messageElement?.getAttribute("mesid"));
	const message = ctx().chat[messageId];
	if (!message) return;
	const media = Array.isArray(message.extra?.media) ? message.extra?.media : [];
	const attachment = media.length ? media[message.extra?.media_index ?? media.length - 1] ?? media[media.length - 1] : void 0;
	const controller = new AbortController();
	running.set(button, controller);
	button.classList.replace(IDLE, BUSY);
	const image = animate ? messageElement?.querySelector(".mes_img") : null;
	image?.classList.add("fa-fade");
	try {
		await pipeline.generatePicture({
			initiator: "message",
			trigger: "",
			swipe: {
				messageId,
				attachment,
				text: attachment ? void 0 : message.mes
			},
			signal: controller.signal
		});
	} catch (error) {
		reportGenerationError(error);
	} finally {
		running.delete(button);
		button.classList.replace(BUSY, IDLE);
		image?.classList.remove("fa-fade");
	}
}
function installMessageButtons(pipeline) {
	addToContainer(document.querySelector("#message_template .extraMesButtons"));
	document.querySelectorAll("#chat .mes .extraMesButtons").forEach(addToContainer);
	const template = document.querySelector("#message_template");
	if (template) localize(template);
	document.addEventListener("click", (event) => {
		const button = event.target.closest(`.${BUTTON_CLASS}`);
		if (button) regenerate(pipeline, button, false);
	});
	const c = ctx();
	c.eventSource.on(c.eventTypes.IMAGE_SWIPED ?? "image_swiped", (payload) => {
		if (!ownsCompatSurface()) return;
		const { message, element, direction } = payload ?? {};
		if (!message || direction !== "right" || ctx().powerUserSettings.image_overswipe !== "generate") return;
		const media = message.extra?.media;
		if (!Array.isArray(media) || media.length === 0 || message.extra?.media_index !== media.length - 1) return;
		const button = element?.get(0)?.querySelector(`.${BUTTON_CLASS}`);
		if (button) regenerate(pipeline, button, true);
	});
}
//#endregion
//#region src/integration/wand.ts
function installWandMenu(pipeline) {
	const menu = document.querySelector("#extensionsMenu");
	if (!menu || document.querySelector("#naist_wand_container")) return;
	const container = document.createElement("div");
	container.id = "naist_wand_container";
	container.className = "extension_container";
	container.innerHTML = `
        <div id="naist_wand_button" class="list-group-item flex-container flexGap5 interactable" tabindex="0">
            <div class="fa-solid fa-palette extensionsMenuExtensionButton" data-i18n="[title]naist.wand.title"></div>
            <span data-i18n="naist.wand.title"></span>
        </div>`;
	menu.append(container);
	const dropdown = document.createElement("div");
	dropdown.id = "naist_wand_dropdown";
	dropdown.className = "naist-wand-dropdown";
	dropdown.style.display = "none";
	dropdown.innerHTML = `
        <ul class="list-group">
            <span data-i18n="naist.wand.heading"></span>
            ${WAND_MODES.map((mode) => `<li class="list-group-item interactable" data-trigger="${TRIGGER_WORDS[mode] ?? ""}" data-i18n="naist.mode.${mode}"></li>`).join("")}
            <li class="list-group-item interactable" data-trigger="__free" data-i18n="naist.wand.free"></li>
            <li class="list-group-item interactable naist-wand-sep" data-trigger="__scene" data-i18n="naist.wand.scene"></li>
            <li class="list-group-item interactable" data-trigger="__gallery" data-i18n="naist.wand.gallery"></li>
            <li class="list-group-item interactable" data-trigger="__toggle-images" data-i18n="naist.wand.toggleImages"></li>
            <li class="list-group-item interactable" data-trigger="__reading" data-i18n="naist.wand.readingMode"></li>
        </ul>`;
	document.body.append(dropdown);
	localize(container);
	localize(dropdown);
	const button = container.querySelector("#naist_wand_button");
	if (!button) return;
	const popper = libs().Popper.createPopper(button, dropdown, { placement: "top" });
	const hide = () => dropdown.style.display = "none";
	document.addEventListener("click", (event) => {
		const target = event.target;
		if (dropdown.contains(target)) return;
		if (button.contains(target) && dropdown.style.display === "none") {
			dropdown.style.display = "block";
			popper.update();
		} else hide();
	});
	dropdown.addEventListener("click", async (event) => {
		const item = event.target.closest("[data-trigger]");
		if (!item) return;
		hide();
		let trigger = item.dataset.trigger ?? "";
		if (trigger === "__scene") {
			openSceneComposer(true);
			return;
		}
		if (trigger === "__gallery") {
			openGalleryWindow(pipeline);
			return;
		}
		if (trigger === "__toggle-images") {
			await setInlineVisibility(inlineRenderer()?.isChatHidden() ? "show" : "hide");
			return;
		}
		if (trigger === "__reading") {
			await setInlineVisibility(settings().inline.readingMode ? "reading-off" : "reading-on");
			return;
		}
		if (trigger === "__free") {
			const c = ctx();
			const value = await c.callGenericPopup(t("naist.wand.freePrompt"), c.POPUP_TYPE.INPUT, "", { rows: 4 });
			if (typeof value !== "string" || !value.trim()) return;
			trigger = value;
		}
		try {
			await pipeline.generatePicture({
				initiator: "wand",
				trigger,
				mode: item.dataset.trigger === "__free" ? 6 : void 0
			});
		} catch (error) {
			reportGenerationError(error);
		}
	});
}
//#endregion
//#region src/integration/setup.ts
function setupIntegrations(pipeline) {
	const compat = ownsCompatSurface();
	installInterceptor(pipeline);
	installWandMenu(pipeline);
	installMessageButtons(pipeline);
	installCharacterCardMenu(pipeline);
	const c = ctx();
	c.eventSource.on(c.eventTypes.APP_READY ?? "app_ready", () => {
		registerCommands$1(pipeline, compat);
		if (compat) registerMacros();
		syncFunctionTool(pipeline, compat);
		log.info(compat ? "took over /sd, /imagine, macros and the GenerateImage tool" : "built-in Image Generation is active: only /nai is registered");
	});
}
//#endregion
//#region src/integration/public-api.ts
var API_GLOBAL = "NAI_STUDIO_API";
/** Unsubscriptions of everything registered through the API (dropped on disable). */
var registrations = /* @__PURE__ */ new Set();
/** Draws backgrounds (set on activation; null before). */
var backgrounds = null;
function fail(message) {
	throw new Error(`NAI Studio API: ${message}`);
}
function requireId(value, what = "passport id") {
	if (typeof value !== "string" || !value.trim()) fail(`${what} must be a non-empty string`);
	return value.trim();
}
function requireScope(value) {
	if (value !== "card" && value !== "chat") fail(`scope must be "card" or "chat"`);
	return value;
}
/** The persona and the cards of the chat are loaded before an async call looks for a passport. */
async function prepare() {
	await currentPersonaKey();
	for (const index of chatCardIndexes()) await loadCharacter(index);
}
function whereOf(target) {
	if (target?.persona) return { persona: knownPersonaKey() };
	if (target?.avatar !== void 0) {
		const index = cardIndexByAvatar(target.avatar);
		if (index < 0) fail(`no card "${target.avatar}"`);
		return { index };
	}
	return null;
}
function located(passportId) {
	return locatePassport(passportId) ?? fail(`no passport "${passportId}" in this chat`);
}
/** The view a change starts from: the chat's view for the chat scope, the stored passport for the card. */
function viewFor(found, scope) {
	if (scope === "chat") return structuredClone(found.resolved);
	return found.base ? structuredClone(found.base) : fail("a passport of the chat itself has no card");
}
function list(filter) {
	const data = chatPassportData();
	const all = !filter || filter.avatar === void 0 && !filter.persona && !filter.chat;
	const result = [];
	let cards = [];
	if (all) cards = chatCardIndexes();
	else if (filter.avatar !== void 0) cards = [cardIndexByAvatar(filter.avatar)].filter((i) => i >= 0);
	for (const index of cards) result.push(...resolvedCardPassports(ctx().characters[index], data));
	if (all || filter.persona) {
		const persona = resolvedPersonaPassport(knownPersonaKey(), data);
		if (persona) result.push(persona);
	}
	if (all || filter.chat) result.push(...data.extra);
	return structuredClone(result);
}
async function savePassport(raw, scopeValue, target) {
	const scope = requireScope(scopeValue);
	const passport = normalizePassport(raw) ?? fail("passport must be an object");
	const rawId = raw.id;
	passport.id = typeof rawId === "string" && rawId.trim() ? rawId.trim() : newPassportId();
	await prepare();
	const where = whereOf(target);
	const found = where ? locatePassport(passport.id, where) : locatePassport(passport.id);
	if (scope === "chat") {
		if (found?.base) await savePassportIn(found, passport, "chat");
		else await saveChatPassport(null, passport);
		return;
	}
	const owner = found?.owner;
	if (target?.persona) {
		savePersonaPassport(knownPersonaKey(), passport);
		return;
	}
	if (!where && owner?.type === "persona") {
		savePersonaPassport(owner.key, passport);
		return;
	}
	let index;
	if (where?.index !== void 0) index = where.index;
	else if (owner?.type === "card") index = owner.index;
	else {
		const cards = chatCardIndexes();
		if (cards.length !== 1) fail("name the card of a new passport (target.avatar)");
		index = cards[0];
	}
	await saveCardPassport(index, passport);
	if (owner?.type === "chat") await clearChatOverride(passport.id);
}
async function setOutfit(passportId, outfit, scopeValue = "chat") {
	const id = requireId(passportId);
	const scope = requireScope(scopeValue);
	if (typeof outfit !== "string") fail("outfit must be a string");
	await prepare();
	const found = located(id);
	const edited = viewFor(found, scope);
	const wanted = outfit.trim().toLowerCase();
	const match = wanted ? edited.outfits.find((o) => o.name.trim().toLowerCase() === wanted) : void 0;
	if (wanted && !match) fail(`passport "${id}" has no outfit "${outfit}"`);
	edited.activeOutfit = match?.name ?? "";
	await savePassportIn(found, edited, scope);
}
async function setState(passportId, stateId, enabled, scopeValue = "chat") {
	const id = requireId(passportId);
	const state = requireId(stateId, "state id");
	const scope = requireScope(scopeValue);
	await prepare();
	const found = located(id);
	const edited = viewFor(found, scope);
	const existing = edited.states.find((s) => s.id === state) ?? edited.states.find((s) => s.id.toLowerCase() === state.toLowerCase());
	if (existing) existing.enabled = enabled === true;
	else if (enabled === true) edited.states.push({
		id: state,
		tags: state,
		enabled: true
	});
	else return;
	await savePassportIn(found, edited, scope);
}
function on(event, listener) {
	if (!STUDIO_EVENTS.includes(event)) fail(`unknown event "${String(event)}"`);
	if (typeof listener !== "function") fail("listener must be a function");
	const off = onStudioEvent(event, listener);
	const unsubscribe = () => {
		off();
		registrations.delete(unsubscribe);
	};
	registrations.add(unsubscribe);
	return unsubscribe;
}
function registerSceneProvider(provider) {
	if (typeof provider !== "object" || provider === null) fail("provider must be an object");
	const id = requireId(provider.id, "provider id");
	if (typeof provider.describe !== "function") fail("provider.describe must be a function");
	const off = registerSceneHintProvider({
		id,
		priority: Number.isFinite(provider.priority) ? Number(provider.priority) : 0,
		describe: (context) => provider.describe(context)
	});
	const unregister = () => {
		off();
		registrations.delete(unregister);
	};
	registrations.add(unregister);
	return unregister;
}
function registerGate(gate) {
	if (typeof gate !== "function") fail("gate must be a function");
	const off = registerQualityGate((detail) => gate(detail));
	const unregister = () => {
		off();
		registrations.delete(unregister);
	};
	registrations.add(unregister);
	return unregister;
}
function registerPassportProvider(provider) {
	if (typeof provider !== "object" || provider === null) fail("provider must be an object");
	const id = requireId(provider.id, "provider id");
	if (typeof provider.passports !== "function") fail("provider.passports must be a function");
	const off = registerScenePassportProvider({
		id,
		priority: Number.isFinite(provider.priority) ? Number(provider.priority) : 0,
		passports: (context) => provider.passports(context)
	});
	const unregister = () => {
		off();
		registrations.delete(unregister);
	};
	registrations.add(unregister);
	return unregister;
}
/** An optional string field of an input object. */
function optionalText(input, field) {
	const value = input[field];
	if (value === void 0 || value === null) return void 0;
	if (typeof value !== "string") fail(`${field} must be a string`);
	return value.trim() || void 0;
}
/** A request of another extension failed: logged and reported with the "requestFailed" event. */
function requestFailed(request, name, error) {
	const naiError = toNaiError(error);
	log.warn(`${API_GLOBAL}: ${request} for "${name}" failed:`, naiError.code, naiError.text);
	emitStudioEvent("requestFailed", {
		request,
		name,
		code: naiError.code,
		message: naiError.text
	});
	return naiError;
}
async function generatePassport(input) {
	if (typeof input !== "object" || input === null) fail("input must be an object");
	const name = requireId(input.name, "name");
	const kind = input.kind;
	if (!ENTRY_PASSPORT_KINDS.includes(kind)) fail(`kind must be one of ${ENTRY_PASSPORT_KINDS.join(", ")}`);
	if (typeof input.description !== "string") fail("description must be a string");
	const language = optionalText(input, "language");
	try {
		return await generateEntryPassport({
			name,
			kind,
			description: input.description,
			...language ? { language } : {}
		});
	} catch (error) {
		requestFailed("passport", name, error);
		return null;
	}
}
async function generateBackground(input) {
	if (typeof input !== "object" || input === null) fail("input must be an object");
	const locationName = requireId(input.locationName, "locationName");
	const request = { locationName };
	for (const field of [
		"tags",
		"passportId",
		"timeOfDay",
		"weather",
		"style"
	]) {
		const value = optionalText(input, field);
		if (value) Object.assign(request, { [field]: value });
	}
	const service = backgrounds;
	if (!service) {
		requestFailed("background", locationName, /* @__PURE__ */ new Error("NAI Studio is not active"));
		return null;
	}
	try {
		return await service.generate(request);
	} catch (error) {
		const naiError = requestFailed("background", locationName, error);
		if (naiError.code !== "aborted") toastr.error(t("naist.background.failed", {
			name: locationName,
			reason: naiError.text
		}), naiError.title);
		return null;
	}
}
function createApi() {
	return Object.freeze({
		version: 1,
		passports: (scope) => list(scope),
		getPassport: (id) => {
			const found = typeof id === "string" && id.trim() ? locatePassport(id.trim()) : null;
			return found ? structuredClone(found.resolved) : null;
		},
		savePassport,
		setOutfit,
		setState,
		clearChatOverride: async (passportId) => {
			await clearChatOverride(requireId(passportId));
		},
		on,
		registerSceneProvider,
		registerQualityGate: registerGate,
		registerPassportProvider,
		generatePassport,
		generateBackground
	});
}
var installed = null;
/** Publishes globalThis.NAI_STUDIO_API (activation). */
function installPublicApi(services = {}) {
	if (services.backgrounds) backgrounds = services.backgrounds;
	installed ??= createApi();
	globalThis[API_GLOBAL] = installed;
	currentPersonaKey();
	log.info(`${API_GLOBAL} version 1 published`);
	return installed;
}
/** Removes the API and everything registered through it (lifecycle "disable" / "delete"). */
function uninstallPublicApi() {
	const root = globalThis;
	if (installed && root["NAI_STUDIO_API"] === installed) delete root[API_GLOBAL];
	installed = null;
	for (const unregister of [...registrations]) unregister();
}
//#endregion
//#region src/integration/quality-setup.ts
function setupQualityGates() {
	const c = ctx();
	const on = (name, handler) => {
		const event = c.eventTypes[name];
		if (event) c.eventSource.on(event, handler);
	};
	for (const name of [
		"MESSAGE_SWIPED",
		"MESSAGE_DELETED",
		"MESSAGE_SWIPE_DELETED",
		"CHAT_CHANGED"
	]) on(name, () => revalidateVerdicts());
	on("GENERATION_STARTED", (type, _options, dryRun) => {
		if (!dryRun && type !== "quiet") qualityGenerationStarted();
	});
}
//#endregion
//#region src/integration/queue-setup.ts
function setupGenerationQueue() {
	const c = ctx();
	const on = (name, handler) => {
		const event = c.eventTypes[name];
		if (event) c.eventSource.on(event, handler);
	};
	on("CHAT_CHANGED", () => void generationQueue.dropOtherChats(ctx().getCurrentChatId()));
	for (const name of [
		"MESSAGE_DELETED",
		"MESSAGE_SWIPED",
		"MESSAGE_SWIPE_DELETED"
	]) on(name, () => void generationQueue.revalidate());
}
//#endregion
//#region src/ui/templates/character-row.html?raw
var character_row_default = "<div class=\"naist-character\" data-index=\"{{index}}\">\n    <div class=\"naist-row\">\n        <label class=\"checkbox_label\"><input type=\"checkbox\" class=\"naist-char-enabled\" {{#if enabled}}checked{{/if}}><span data-i18n=\"naist.character.enabled\"></span></label>\n        <span class=\"naist-muted\">#{{number}}</span>\n        <div class=\"menu_button fa-solid fa-trash-can naist-char-remove\" data-i18n=\"[title]naist.character.remove\"></div>\n    </div>\n    <textarea class=\"text_pole textarea_compact naist-char-prompt\" rows=\"2\" data-i18n=\"[placeholder]naist.character.prompt\">{{prompt}}</textarea>\n    <input type=\"text\" class=\"text_pole naist-char-negative\" value=\"{{negative}}\" data-i18n=\"[placeholder]naist.character.negative\">\n    <div class=\"naist-grid2 naist-char-position\">\n        <label><span data-i18n=\"naist.character.x\"></span> <input type=\"number\" class=\"text_pole naist-char-x\" min=\"0\" max=\"1\" step=\"0.1\" value=\"{{x}}\"></label>\n        <label><span data-i18n=\"naist.character.y\"></span> <input type=\"number\" class=\"text_pole naist-char-y\" min=\"0\" max=\"1\" step=\"0.1\" value=\"{{y}}\"></label>\n    </div>\n</div>\n";
//#endregion
//#region src/ui/templates/panel.html?raw
var panel_default = "<div class=\"naist-panel\" id=\"naist_panel\">\n    <div class=\"inline-drawer\">\n        <div class=\"inline-drawer-toggle inline-drawer-header\">\n            <b data-i18n=\"naist.panel.title\"></b>\n            <div class=\"inline-drawer-icon fa-solid fa-circle-chevron-down down\"></div>\n        </div>\n        <div class=\"inline-drawer-content\">\n            <div class=\"naist-content\">\n                <div class=\"naist-row naist-status\">\n                    <label for=\"naist_transport_mode\" data-i18n=\"naist.panel.transport\"></label>\n                    <select id=\"naist_transport_mode\" class=\"text_pole naist-grow\">\n                        <option value=\"auto\" data-i18n=\"naist.transport.auto\"></option>\n                        <option value=\"plugin\" data-i18n=\"naist.transport.plugin\"></option>\n                        <option value=\"native\" data-i18n=\"naist.transport.native\"></option>\n                    </select>\n                    <div\n                        id=\"naist_refresh\"\n                        class=\"menu_button fa-solid fa-rotate\"\n                        data-i18n=\"[title]naist.panel.refresh\"\n                    ></div>\n                </div>\n                <div id=\"naist_transport_badge\" class=\"naist-badge\"></div>\n                <div id=\"naist_account\" class=\"naist-account\"></div>\n\n                <div id=\"naist_takeover_banner\" class=\"naist-banner naist-hidden\">\n                    <span data-i18n=\"naist.takeover.banner\"></span>\n                    <div id=\"naist_banner_open\" class=\"menu_button\" data-i18n=\"naist.takeover.bannerAction\"></div>\n                </div>\n\n                <div class=\"naist-tabs\" role=\"tablist\">\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"generate\"\n                        data-i18n=\"naist.tab.generate\"\n                    ></div>\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"prompts\"\n                        data-i18n=\"naist.tab.prompts\"\n                    ></div>\n                    <div class=\"naist-tab menu_button\" role=\"tab\" data-tab=\"chat\" data-i18n=\"naist.tab.chat\"></div>\n                    <div class=\"naist-tab menu_button\" role=\"tab\" data-tab=\"images\" data-i18n=\"naist.tab.images\"></div>\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"takeover\"\n                        data-i18n=\"naist.tab.takeover\"\n                    ></div>\n                </div>\n\n                <div class=\"naist-tabpanel\" data-tabpanel=\"generate\">\n                    <label for=\"naist_model\" data-i18n=\"naist.panel.model\"></label>\n                    <select id=\"naist_model\" class=\"text_pole\">\n                        {{#each models}}\n                        <option value=\"{{id}}\" data-i18n=\"{{nameKey}}\"></option>\n                        {{/each}}\n                    </select>\n\n                    <label for=\"naist_prompt\" data-i18n=\"naist.panel.prompt\"></label>\n                    <textarea\n                        id=\"naist_prompt\"\n                        class=\"text_pole textarea_compact\"\n                        rows=\"4\"\n                        data-i18n=\"[placeholder]naist.panel.promptPlaceholder\"\n                    ></textarea>\n\n                    <label for=\"naist_negative\" data-i18n=\"naist.panel.negative\"></label>\n                    <textarea id=\"naist_negative\" class=\"text_pole textarea_compact\" rows=\"2\"></textarea>\n                    <div id=\"naist_negative_style\" class=\"naist-hint\"></div>\n\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_uc_preset\" data-i18n=\"naist.panel.ucPreset\"></label>\n                            <select id=\"naist_uc_preset\" class=\"text_pole\"></select>\n                        </div>\n                        <div>\n                            <label for=\"naist_quality\" data-i18n=\"naist.panel.quality\"></label>\n                            <select id=\"naist_quality\" class=\"text_pole\"></select>\n                        </div>\n                    </div>\n\n                    <div\n                        id=\"naist_characters_block\"\n                        class=\"naist-block\"\n                        data-cap=\"characters\"\n                        data-feature=\"characters\"\n                    >\n                        <div class=\"naist-row\">\n                            <b data-i18n=\"naist.panel.characters\"></b>\n                            <span id=\"naist_characters_count\" class=\"naist-muted\"></span>\n                            <div\n                                id=\"naist_add_character\"\n                                class=\"menu_button fa-solid fa-user-plus\"\n                                data-i18n=\"[title]naist.panel.addCharacter\"\n                            ></div>\n                        </div>\n                        <label class=\"checkbox_label\"\n                            ><input type=\"checkbox\" id=\"naist_use_coords\" /><span\n                                data-i18n=\"naist.panel.useCoords\"\n                            ></span\n                        ></label>\n                        <div id=\"naist_characters\"></div>\n                        <div class=\"naist-feature-hint\" data-hint-for=\"characters\"></div>\n                    </div>\n\n                    <label for=\"naist_size_preset\" data-i18n=\"naist.panel.size\"></label>\n                    <div class=\"naist-grid3\">\n                        <select id=\"naist_size_preset\" class=\"text_pole\"></select>\n                        <input\n                            id=\"naist_width\"\n                            type=\"number\"\n                            class=\"text_pole\"\n                            step=\"64\"\n                            min=\"64\"\n                            data-i18n=\"[title]naist.panel.width\"\n                        />\n                        <input\n                            id=\"naist_height\"\n                            type=\"number\"\n                            class=\"text_pole\"\n                            step=\"64\"\n                            min=\"64\"\n                            data-i18n=\"[title]naist.panel.height\"\n                        />\n                    </div>\n\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_sampler\" data-i18n=\"naist.panel.sampler\"></label>\n                            <select id=\"naist_sampler\" class=\"text_pole\"></select>\n                        </div>\n                        <div data-cap=\"noiseSchedule\">\n                            <label for=\"naist_schedule\" data-i18n=\"naist.panel.schedule\"></label>\n                            <select id=\"naist_schedule\" class=\"text_pole\"></select>\n                        </div>\n                    </div>\n                    <div class=\"naist-grid3\">\n                        <div>\n                            <label for=\"naist_steps\" data-i18n=\"naist.panel.steps\"></label>\n                            <input id=\"naist_steps\" type=\"number\" min=\"1\" max=\"50\" class=\"text_pole\" />\n                        </div>\n                        <div>\n                            <label for=\"naist_scale\" data-i18n=\"naist.panel.scale\"></label>\n                            <input id=\"naist_scale\" type=\"number\" step=\"0.1\" min=\"0\" max=\"10\" class=\"text_pole\" />\n                        </div>\n                        <div data-feature=\"cfgRescale\">\n                            <label for=\"naist_cfg_rescale\" data-i18n=\"naist.panel.cfgRescale\"></label>\n                            <input id=\"naist_cfg_rescale\" type=\"number\" step=\"0.02\" min=\"0\" max=\"1\" class=\"text_pole\" />\n                        </div>\n                    </div>\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_seed\" data-i18n=\"naist.panel.seed\"></label>\n                            <input\n                                id=\"naist_seed\"\n                                type=\"number\"\n                                min=\"-1\"\n                                class=\"text_pole\"\n                                data-i18n=\"[title]naist.panel.seedHint\"\n                            />\n                        </div>\n                        <div data-feature=\"multipleSamples\">\n                            <label for=\"naist_samples\" data-i18n=\"naist.panel.samples\"></label>\n                            <input id=\"naist_samples\" type=\"number\" min=\"1\" max=\"8\" class=\"text_pole\" />\n                        </div>\n                    </div>\n                    <div class=\"naist-feature-hint\" data-hint-for=\"multipleSamples\"></div>\n\n                    <div class=\"naist-flags\">\n                        <label class=\"checkbox_label\" data-cap=\"smea\"\n                            ><input type=\"checkbox\" id=\"naist_smea\" /><span data-i18n=\"naist.panel.smea\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"smeaDyn\"\n                            ><input type=\"checkbox\" id=\"naist_smea_dyn\" /><span data-i18n=\"naist.panel.smeaDyn\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"autoSmea\"\n                            ><input type=\"checkbox\" id=\"naist_auto_smea\" /><span data-i18n=\"naist.panel.autoSmea\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"decrisper\"\n                            ><input type=\"checkbox\" id=\"naist_decrisper\" /><span\n                                data-i18n=\"naist.panel.decrisper\"\n                            ></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"varietyBoost\"\n                            ><input type=\"checkbox\" id=\"naist_variety\" /><span data-i18n=\"naist.panel.variety\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"transparency\" data-feature=\"transparency\"\n                            ><input type=\"checkbox\" id=\"naist_transparent\" /><span\n                                data-i18n=\"naist.panel.transparent\"\n                            ></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"legacyUc\"\n                            ><input type=\"checkbox\" id=\"naist_legacy_uc\" /><span data-i18n=\"naist.panel.legacyUc\"></span\n                        ></label>\n                    </div>\n                    <div class=\"naist-feature-hint\" data-hint-for=\"transparency\"></div>\n\n                    <hr />\n                    <label class=\"checkbox_label\"\n                        ><input type=\"checkbox\" id=\"naist_free_only\" /><span data-i18n=\"naist.panel.freeOnly\"></span\n                    ></label>\n                    <div id=\"naist_cost\" class=\"naist-cost\"></div>\n                    <div id=\"naist_lost\" class=\"naist-hint\"></div>\n                    <div id=\"naist_queue\" class=\"naist-row naist-queue naist-hidden\">\n                        <i class=\"fa-solid fa-list-ol\"></i>\n                        <span id=\"naist_queue_text\" class=\"naist-grow\"></span>\n                        <div id=\"naist_queue_clear\" class=\"menu_button\" data-i18n=\"naist.queue.clear\"></div>\n                    </div>\n\n                    <details class=\"naist-override\">\n                        <summary data-i18n=\"naist.panel.override\"></summary>\n                        <div class=\"naist-warning\" data-i18n=\"naist.panel.overrideWarning\"></div>\n                        <label class=\"checkbox_label\"\n                            ><input type=\"checkbox\" id=\"naist_override_enabled\" /><span\n                                data-i18n=\"naist.panel.overrideEnable\"\n                            ></span\n                        ></label>\n                        <textarea\n                            id=\"naist_override_json\"\n                            class=\"text_pole textarea_compact monospace\"\n                            rows=\"4\"\n                        ></textarea>\n                    </details>\n                </div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"prompts\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"chat\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"images\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"takeover\"></div>\n\n                <label class=\"checkbox_label\"\n                    ><input type=\"checkbox\" id=\"naist_inspect_before\" /><span\n                        data-i18n=\"naist.panel.inspectBeforeSend\"\n                    ></span\n                ></label>\n                <div class=\"naist-row naist-actions\">\n                    <div id=\"naist_inspect\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-magnifying-glass\"></i><span data-i18n=\"naist.panel.inspect\"></span>\n                    </div>\n                    <div id=\"naist_generate\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-paintbrush\"></i><span data-i18n=\"naist.panel.generate\"></span>\n                    </div>\n                    <div id=\"naist_cancel\" class=\"menu_button menu_button_icon naist-hidden\">\n                        <i class=\"fa-solid fa-stop\"></i><span data-i18n=\"naist.panel.cancel\"></span>\n                    </div>\n                </div>\n                <div id=\"naist_message\" class=\"naist-message\"></div>\n            </div>\n        </div>\n    </div>\n</div>\n";
//#endregion
//#region src/ui/token-meter.ts
function bar(label, used, limit, approx) {
	const ratio = Math.min(1, used / limit);
	return `<div class="naist-tokens-row${used > limit ? " naist-tokens-over" : ratio > .9 ? " naist-tokens-near" : ""}">
        <span class="naist-tokens-label">${escapeHtml$2(label)}</span>
        <span class="naist-tokens-bar"><span style="width:${Math.round(ratio * 100)}%"></span></span>
        <span class="naist-tokens-count">${approx ? "≈" : ""}${used} / ${limit}</span>
    </div>`;
}
function createTokenMeter() {
	const element = document.createElement("div");
	element.className = "naist-tokens";
	let last = null;
	const render = (input) => {
		const model = isModelId(input.model) ? input.model : DEFAULT_MODEL;
		const kind = tokenizerKind(model);
		let counter = readyTokenizer(kind);
		if (!counter) loadTokenizer(kind).then((loaded) => {
			if (loaded && last) render(last);
		});
		const approx = !counter;
		counter ??= APPROXIMATE;
		const prompt = countPromptTokens(counter, model, input.prompt, input.characters);
		const negative = countPromptTokens(counter, model, input.negative, []);
		const parts = [bar(t("naist.tokens.prompt"), prompt.total, prompt.limit, approx)];
		if (prompt.text !== null) parts.push(`<div class="naist-hint">${escapeHtml$2(t("naist.tokens.text", { count: prompt.text }))}</div>`);
		parts.push(bar(t("naist.tokens.negative"), negative.total, tokenLimit(model), approx));
		if (prompt.over) parts.push(`<div class="naist-warning">${escapeHtml$2(t("naist.tokens.over", { limit: prompt.limit }))}</div>`);
		if (kind === "t5") {
			const bad = t5UnsupportedChars(input.raw);
			if (bad.length) parts.push(`<div class="naist-warning">${escapeHtml$2(t("naist.tokens.t5Unicode", { chars: bad.slice(0, 12).join(" ") }))}</div>`);
		}
		if (approx) parts.push(`<div class="naist-hint">${escapeHtml$2(t("naist.tokens.approximate"))}</div>`);
		element.innerHTML = parts.join("");
	};
	return {
		element,
		update(input) {
			last = input;
			render(input);
		}
	};
}
//#endregion
//#region src/ui/components/bind.ts
function resolve(path) {
	const parts = path.split(".");
	const key = parts.pop();
	let node = settings();
	for (const part of parts) {
		if (!node || typeof node !== "object") return null;
		node = node[part];
	}
	return key && node && typeof node === "object" ? {
		parent: node,
		key
	} : null;
}
function isNumeric(el) {
	return el instanceof HTMLInputElement && el.type === "number" || el.dataset.type === "number";
}
function readFromSettings(root) {
	root.querySelectorAll("[data-setting]").forEach((el) => {
		const target = resolve(el.dataset.setting ?? "");
		if (!target) return;
		const value = target.parent[target.key];
		if (el instanceof HTMLInputElement && el.type === "checkbox") el.checked = value === true;
		else el.value = value === void 0 || value === null ? "" : String(value);
	});
}
/** Binds every [data-setting] control under `root`; `onChange` receives the changed path. */
function bindSettings(root, onChange = () => {}) {
	readFromSettings(root);
	root.querySelectorAll("[data-setting]").forEach((el) => {
		const isCheckbox = el instanceof HTMLInputElement && el.type === "checkbox";
		const isText = !isCheckbox && !(el instanceof HTMLSelectElement) && !isNumeric(el);
		el.addEventListener(isText ? "input" : "change", () => {
			const path = el.dataset.setting ?? "";
			const target = resolve(path);
			if (!target) return;
			if (isCheckbox) target.parent[target.key] = el.checked;
			else if (isNumeric(el)) {
				const value = Number(el.value);
				if (!Number.isFinite(value)) return;
				target.parent[target.key] = value;
			} else target.parent[target.key] = el.value;
			saveSettings();
			onChange(path);
		});
	});
}
//#endregion
//#region src/ui/templates/tab-chat.html?raw
var tab_chat_default = "<div class=\"naist-section\">\n    <b data-i18n=\"naist.chat.visibility\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.chat.visibilityHint\"></div>\n    <div class=\"naist-flags\">\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.panel\" /><span\n                data-i18n=\"naist.initiator.panel\"\n            ></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.command\" /><span\n                data-i18n=\"naist.initiator.command\"\n            ></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.wand\" /><span data-i18n=\"naist.initiator.wand\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.interactive\" /><span\n                data-i18n=\"naist.initiator.interactive\"\n            ></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.tool\" /><span data-i18n=\"naist.initiator.tool\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.auto\" /><span data-i18n=\"naist.initiator.auto\"></span\n        ></label>\n    </div>\n    <div class=\"naist-grid2\">\n        <div>\n            <label for=\"naist_author\" data-i18n=\"naist.chat.author\"></label>\n            <select id=\"naist_author\" class=\"text_pole\" data-setting=\"chat.author\">\n                <option value=\"character\" data-i18n=\"naist.chat.authorCharacter\"></option>\n                <option value=\"user\" data-i18n=\"naist.chat.authorUser\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_confirm_above\" data-i18n=\"naist.chat.confirmAbove\"></label>\n            <input id=\"naist_confirm_above\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"anlas.confirmAbove\" />\n        </div>\n    </div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"chat.hidePrompt\" /><span data-i18n=\"naist.chat.hidePrompt\"></span\n    ></label>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.chat.prompting\"></b>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.refine\" /><span data-i18n=\"naist.chat.refine\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.multimodal\" /><span data-i18n=\"naist.chat.multimodal\"></span\n    ></label>\n    <div class=\"naist-grid2 naist-mm-source\">\n        <div>\n            <label for=\"naist_mm_api\" data-i18n=\"naist.multimodal.api\"></label>\n            <select id=\"naist_mm_api\" class=\"text_pole\" data-setting=\"modes.multimodalApi\"></select>\n        </div>\n        <div>\n            <label for=\"naist_mm_model\" data-i18n=\"naist.multimodal.model\"></label>\n            <input id=\"naist_mm_model\" class=\"text_pole\" data-setting=\"modes.multimodalModel\" />\n        </div>\n    </div>\n    <div class=\"naist-hint\" id=\"naist_mm_hint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.freeExtend\" /><span data-i18n=\"naist.chat.freeExtend\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.snap\" /><span data-i18n=\"naist.chat.snap\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.minimalProcessing\" /><span\n            data-i18n=\"naist.chat.minimalProcessing\"\n        ></span\n    ></label>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.chat.llm\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.chat.llmHint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"chat.interactive\" /><span data-i18n=\"naist.chat.interactive\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"chat.functionTool\" /><span data-i18n=\"naist.chat.functionTool\"></span\n    ></label>\n    <label for=\"naist_tool_cooldown\" data-i18n=\"naist.chat.toolCooldown\"></label>\n    <input id=\"naist_tool_cooldown\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"chat.toolCooldownSeconds\" />\n</div>\n\n<div class=\"naist-section\">\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"auto.enabled\" /><b data-i18n=\"naist.auto.enabled\"></b\n    ></label>\n    <div class=\"naist-hint\" data-i18n=\"naist.auto.guardHint\"></div>\n    <label for=\"naist_auto_mode\" data-i18n=\"naist.auto.mode\"></label>\n    <select id=\"naist_auto_mode\" class=\"text_pole\" data-setting=\"auto.mode\" data-type=\"number\"></select>\n    <div class=\"naist-grid2\">\n        <div>\n            <label for=\"naist_auto_every\" data-i18n=\"naist.auto.everyMessages\"></label>\n            <input id=\"naist_auto_every\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"auto.everyMessages\" />\n        </div>\n        <div>\n            <label for=\"naist_auto_cooldown_messages\" data-i18n=\"naist.auto.cooldownMessages\"></label>\n            <input\n                id=\"naist_auto_cooldown_messages\"\n                type=\"number\"\n                min=\"1\"\n                class=\"text_pole\"\n                data-setting=\"auto.cooldownMessages\"\n            />\n        </div>\n    </div>\n    <label for=\"naist_auto_keywords\" data-i18n=\"naist.auto.keywords\"></label>\n    <input id=\"naist_auto_keywords\" type=\"text\" class=\"text_pole\" data-setting=\"auto.keywords\" />\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"auto.sceneChange\" /><span data-i18n=\"naist.auto.sceneChange\"></span\n    ></label>\n    <input\n        id=\"naist_auto_markers\"\n        type=\"text\"\n        class=\"text_pole\"\n        data-setting=\"auto.sceneMarkers\"\n        data-i18n=\"[title]naist.auto.sceneMarkers\"\n    />\n    <label for=\"naist_auto_cooldown_seconds\" data-i18n=\"naist.auto.cooldownSeconds\"></label>\n    <input\n        id=\"naist_auto_cooldown_seconds\"\n        type=\"number\"\n        min=\"0\"\n        class=\"text_pole\"\n        data-setting=\"auto.cooldownSeconds\"\n    />\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" id=\"naist_auto_allow_paid\" data-setting=\"auto.allowPaid\" /><span\n            data-i18n=\"naist.auto.allowPaid\"\n        ></span\n    ></label>\n</div>\n\n<div class=\"naist-section\" id=\"naist_markers_section\">\n    <b data-i18n=\"naist.markers.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.markers.hint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"markers.enabled\" /><span data-i18n=\"naist.markers.enabled\"></span\n    ></label>\n    <div class=\"naist-markers-options\">\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"markers.inject\" /><span data-i18n=\"naist.markers.inject\"></span\n        ></label>\n        <div class=\"naist-grid2\">\n            <div>\n                <label for=\"naist_markers_preset\" data-i18n=\"naist.markers.preset\"></label>\n                <select id=\"naist_markers_preset\" class=\"text_pole\" data-setting=\"markers.preset\">\n                    <option value=\"natural\" data-i18n=\"naist.markers.presetNatural\"></option>\n                    <option value=\"tags\" data-i18n=\"naist.markers.presetTags\"></option>\n                    <option value=\"custom\" data-i18n=\"naist.markers.presetCustom\"></option>\n                </select>\n            </div>\n            <div>\n                <label for=\"naist_markers_caption_lang\" data-i18n=\"naist.markers.captionLanguage\"></label>\n                <input id=\"naist_markers_caption_lang\" class=\"text_pole\" data-setting=\"markers.captionLanguage\" />\n            </div>\n        </div>\n        <div id=\"naist_markers_custom\" class=\"naist-hidden\">\n            <label for=\"naist_markers_template\" data-i18n=\"naist.markers.template\"></label>\n            <textarea\n                id=\"naist_markers_template\"\n                class=\"text_pole textarea_compact\"\n                rows=\"8\"\n                data-setting=\"markers.template\"\n            ></textarea>\n            <div class=\"naist-hint\" data-i18n=\"naist.markers.templateHint\"></div>\n            <div\n                id=\"naist_markers_template_default\"\n                class=\"menu_button\"\n                data-i18n=\"naist.markers.templateDefault\"\n            ></div>\n        </div>\n        <div class=\"naist-grid2\">\n            <div>\n                <label for=\"naist_markers_min\" data-i18n=\"naist.markers.min\"></label>\n                <input\n                    id=\"naist_markers_min\"\n                    type=\"number\"\n                    min=\"0\"\n                    max=\"10\"\n                    class=\"text_pole\"\n                    data-setting=\"markers.min\"\n                />\n            </div>\n            <div>\n                <label for=\"naist_markers_max\" data-i18n=\"naist.markers.max\"></label>\n                <input\n                    id=\"naist_markers_max\"\n                    type=\"number\"\n                    min=\"0\"\n                    max=\"10\"\n                    class=\"text_pole\"\n                    data-setting=\"markers.max\"\n                />\n            </div>\n            <div>\n                <label for=\"naist_markers_depth\" data-i18n=\"naist.markers.depth\"></label>\n                <input\n                    id=\"naist_markers_depth\"\n                    type=\"number\"\n                    min=\"0\"\n                    max=\"100\"\n                    class=\"text_pole\"\n                    data-setting=\"markers.depth\"\n                />\n            </div>\n            <div>\n                <label for=\"naist_markers_role\" data-i18n=\"naist.markers.role\"></label>\n                <select id=\"naist_markers_role\" class=\"text_pole\" data-setting=\"markers.role\">\n                    <option value=\"system\" data-i18n=\"naist.markers.roleSystem\"></option>\n                    <option value=\"user\" data-i18n=\"naist.markers.roleUser\"></option>\n                    <option value=\"assistant\" data-i18n=\"naist.markers.roleAssistant\"></option>\n                </select>\n            </div>\n        </div>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"markers.earlyStart\" /><span\n                data-i18n=\"naist.markers.earlyStart\"\n            ></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"markers.autoFill\" /><span data-i18n=\"naist.markers.autoFill\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"markers.legacy\" /><span data-i18n=\"naist.markers.legacy\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"inline.regexCompat\" /><span\n                data-i18n=\"naist.markers.regexCompat\"\n            ></span\n        ></label>\n        <div class=\"naist-row\">\n            <label class=\"checkbox_label\"\n                ><input id=\"naist_markers_allow_paid\" type=\"checkbox\" data-setting=\"markers.allowPaid\" /><span\n                    data-i18n=\"naist.markers.allowPaid\"\n                ></span\n            ></label>\n            <input\n                id=\"naist_markers_max_cost\"\n                type=\"number\"\n                min=\"0\"\n                class=\"text_pole naist-narrow\"\n                data-setting=\"markers.maxCost\"\n                data-i18n=\"[title]naist.markers.maxCost\"\n            />\n        </div>\n        <div id=\"naist_markers_preview\" class=\"menu_button\" data-i18n=\"naist.markers.preview\"></div>\n    </div>\n</div>\n\n<div class=\"naist-section\" id=\"naist_des_section\">\n    <b data-i18n=\"naist.des.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.des.hint\"></div>\n    <div class=\"naist-muted\" id=\"naist_des_status\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"des.enabled\" /><span data-i18n=\"naist.des.enabled\"></span\n    ></label>\n    <div class=\"naist-des-options\">\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"des.sceneTags\" /><span data-i18n=\"naist.des.sceneTags\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"des.characters\" /><span data-i18n=\"naist.des.characters\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"des.autoPassports\" /><span data-i18n=\"naist.des.autoPassports\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"des.portraits\" /><span data-i18n=\"naist.des.portraits\"></span\n        ></label>\n        <div class=\"naist-grid2\">\n            <div>\n                <label for=\"naist_des_policy\" data-i18n=\"naist.des.policy\"></label>\n                <select id=\"naist_des_policy\" class=\"text_pole\" data-setting=\"des.portraitPolicy\">\n                    <option value=\"missing\" data-i18n=\"naist.des.policyMissing\"></option>\n                    <option value=\"state\" data-i18n=\"naist.des.policyState\"></option>\n                    <option value=\"every\" data-i18n=\"naist.des.policyEvery\"></option>\n                </select>\n            </div>\n            <div>\n                <label for=\"naist_des_framing\" data-i18n=\"naist.des.framing\"></label>\n                <input id=\"naist_des_framing\" class=\"text_pole\" data-setting=\"des.portraitTags\" />\n            </div>\n        </div>\n        <div class=\"naist-hint\" data-i18n=\"naist.des.policyHint\"></div>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"des.emotionsToDes\" /><span data-i18n=\"naist.des.emotionsToDes\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"des.menu\" /><span data-i18n=\"naist.des.menu\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"des.banners\" /><span data-i18n=\"naist.des.banners\"></span\n        ></label>\n        <div id=\"naist_des_passports\" class=\"menu_button\">\n            <i class=\"fa-solid fa-wand-magic-sparkles\"></i> <span data-i18n=\"naist.des.passportsButton\"></span>\n        </div>\n    </div>\n</div>\n\n<div class=\"naist-section naist-hidden\" id=\"naist_quality_section\">\n    <b data-i18n=\"naist.quality.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.quality.hint\"></div>\n    <label for=\"naist_quality_timeout\" data-i18n=\"naist.quality.timeout\"></label>\n    <input id=\"naist_quality_timeout\" type=\"number\" min=\"1\" max=\"600\" step=\"1\" class=\"text_pole\" />\n</div>\n";
//#endregion
//#region src/ui/panel/tab-chat.ts
var ChatTab = class {
	onChange;
	root;
	constructor(onChange) {
		this.onChange = onChange;
	}
	mount(container) {
		container.innerHTML = render$2(tab_chat_default);
		this.root = container;
		fillSelect$1($id$1(container, "naist_auto_mode"), WAND_MODES.map((mode) => ({
			value: String(mode),
			label: t(`naist.mode.${mode}`)
		})), String(settings().auto.mode));
		localize(container);
		bindSettings(container, (path) => {
			this.applyGuards();
			this.onChange(path);
		});
		this.bindMarkers();
		this.bindDes();
		this.bindQuality();
		this.fillVision();
		this.applyGuards();
	}
	visionKeys = /* @__PURE__ */ new Map();
	visionCurrent = "";
	/** Vision APIs with their key state; the select is filled once, the hint follows the choice. */
	async fillVision() {
		const { current, apis } = await visionChoices();
		this.visionCurrent = current;
		this.visionKeys = new Map(apis.map((a) => [a.id, a.hasKey]));
		const select = $id$1(this.root, "naist_mm_api");
		const keyNote = (has) => has ? t("naist.multimodal.keySet") : t("naist.multimodal.keyMissing");
		fillSelect$1(select, [{
			value: "",
			label: t("naist.multimodal.apiCaptioning", { api: current })
		}, ...apis.map((a) => ({
			value: a.id,
			label: `${a.label} — ${keyNote(a.hasKey)}`
		}))], settings().modes.multimodalApi);
		this.applyGuards();
	}
	bindDes() {
		$id$1(this.root, "naist_des_policy").addEventListener("change", () => {
			if (settings().des.portraitPolicyChosen) return;
			settings().des.portraitPolicyChosen = true;
			saveSettings();
		});
		const button = $id$1(this.root, "naist_des_passports");
		button.addEventListener("click", () => {
			const des = desIntegration();
			if (!des?.active() || button.classList.contains("disabled")) return;
			button.classList.add("disabled");
			des.passportsForTracker().then((count) => toastr.info(t("naist.des.passportsDone", { count }), t("naist.des.title"))).catch(reportGenerationError).finally(() => button.classList.remove("disabled"));
		});
	}
	/** The time limit is kept in ms and edited in seconds. */
	bindQuality() {
		const input = $id$1(this.root, "naist_quality_timeout");
		input.addEventListener("change", () => {
			const seconds = Number(input.value);
			if (!Number.isFinite(seconds) || seconds <= 0) {
				this.fillQuality(true);
				return;
			}
			settings().quality.gateTimeoutMs = clampGateTimeout(seconds * 1e3);
			saveSettings();
			this.fillQuality(true);
			this.onChange("quality.gateTimeoutMs");
		});
		onQualityGatesChange(() => this.applyGuards());
		this.fillQuality();
	}
	fillQuality(force = false) {
		const input = $id$1(this.root, "naist_quality_timeout");
		if (!force && document.activeElement === input) return;
		input.value = String(Math.round(clampGateTimeout(settings().quality.gateTimeoutMs) / 1e3));
	}
	desStatusText() {
		const status = desIntegration()?.status();
		if (!status || status.state === "searching") return t("naist.des.statusSearching");
		if (status.state === "absent") return t("naist.des.statusAbsent");
		return [t("naist.des.statusConnected", {
			version: status.version ?? "?",
			mode: status.mode
		}), ...[status.enabled ? "" : t("naist.des.statusOff"), status.verified ? "" : t("naist.des.statusUnverified")].filter(Boolean)].join(" ");
	}
	bindMarkers() {
		$id$1(this.root, "naist_markers_template_default").addEventListener("click", () => {
			settings().markers.template = MARKER_TEMPLATES.natural;
			saveSettings();
			readFromSettings(this.root);
			this.onChange("markers.template");
		});
		$id$1(this.root, "naist_markers_preview").addEventListener("click", () => {
			const m = settings().markers;
			const text = markerInstruction(m.preset, m.template, {
				min: m.min,
				max: m.max,
				captionLanguage: m.captionLanguage,
				chars: [t("naist.markers.previewChars")]
			});
			ctx().callGenericPopup(`<div class="naist-hint">${escapeHtml$2(t("naist.markers.previewHint"))}</div><pre class="naist-pre">${escapeHtml$2(text)}</pre>`, ctx().POPUP_TYPE.TEXT, "", {
				wide: true,
				allowVerticalScrolling: true
			});
		});
	}
	/** Re-reads every control after settings changed outside of this tab. */
	refresh() {
		readFromSettings(this.root);
		this.fillQuality();
		this.applyGuards();
	}
	/** Paid auto generation is meaningless while free-only is on: show it disabled. */
	applyGuards() {
		const s = settings();
		for (const id of [
			"naist_auto_allow_paid",
			"naist_markers_allow_paid",
			"naist_markers_max_cost"
		]) {
			const control = $id$1(this.root, id);
			control.disabled = s.anlas.freeOnly;
			control.closest("label")?.classList.toggle("naist-disabled", control.disabled);
		}
		$id$1(this.root, "naist_markers_custom").classList.toggle("naist-hidden", s.markers.preset !== "custom");
		$id$1(this.root, "naist_des_status").textContent = this.desStatusText();
		const api = s.modes.multimodalApi;
		const model = $id$1(this.root, "naist_mm_model");
		model.disabled = !api;
		model.placeholder = api ? visionModel(api, "") : t("naist.multimodal.modelCaptioning");
		const chosen = api || this.visionCurrent;
		const missing = chosen && this.visionKeys.size > 0 && this.visionKeys.get(chosen) === false;
		$id$1(this.root, "naist_mm_hint").textContent = missing ? t("naist.multimodal.noKey", { api: visionApi(chosen)?.label ?? chosen }) : t("naist.multimodal.hint");
		this.root.querySelector(".naist-mm-source")?.classList.toggle("naist-disabled", !s.modes.multimodal);
		const connected = desIntegration()?.status().state === "connected";
		this.root.querySelector(".naist-des-options")?.classList.toggle("naist-disabled", !connected || !s.des.enabled);
		this.root.querySelector(".naist-markers-options")?.classList.toggle("naist-disabled", !s.markers.enabled);
		$id$1(this.root, "naist_quality_section").classList.toggle("naist-hidden", !qualityGatesActive());
	}
};
//#endregion
//#region src/ui/templates/tab-images.html?raw
var tab_images_default = "<div class=\"naist-section\">\n    <b data-i18n=\"naist.images.inline\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.images.inlineHint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"inline.saveToServer\" /><span data-i18n=\"naist.images.saveToServer\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"inline.keepBrowserCopy\" /><span\n            data-i18n=\"naist.images.keepBrowserCopy\"\n        ></span\n    ></label>\n    <div class=\"naist-grid3\">\n        <div>\n            <label for=\"naist_img_width\" data-i18n=\"naist.inline.width\"></label>\n            <input id=\"naist_img_width\" type=\"number\" min=\"5\" class=\"text_pole\" data-setting=\"inline.defaultWidth\" />\n        </div>\n        <div>\n            <label for=\"naist_img_unit\" data-i18n=\"naist.inline.unit\"></label>\n            <select id=\"naist_img_unit\" class=\"text_pole\" data-setting=\"inline.defaultWidthUnit\">\n                <option value=\"%\">%</option>\n                <option value=\"px\">px</option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_align\" data-i18n=\"naist.inline.align\"></label>\n            <select id=\"naist_img_align\" class=\"text_pole\" data-setting=\"inline.defaultAlign\">\n                <option value=\"center\" data-i18n=\"naist.inline.alignCenter\"></option>\n                <option value=\"left\" data-i18n=\"naist.inline.alignLeft\"></option>\n                <option value=\"right\" data-i18n=\"naist.inline.alignRight\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_radius\" data-i18n=\"naist.inline.radius\"></label>\n            <input id=\"naist_img_radius\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"inline.defaultRadius\" />\n        </div>\n        <div>\n            <label for=\"naist_img_layout\" data-i18n=\"naist.inline.layout\"></label>\n            <select id=\"naist_img_layout\" class=\"text_pole\" data-setting=\"inline.defaultLayout\">\n                <option value=\"grid\" data-i18n=\"naist.inline.layoutGrid\"></option>\n                <option value=\"carousel\" data-i18n=\"naist.inline.layoutCarousel\"></option>\n                <option value=\"list\" data-i18n=\"naist.inline.layoutList\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_llm\" data-i18n=\"naist.images.llmText\"></label>\n            <select id=\"naist_img_llm\" class=\"text_pole\" data-setting=\"inline.llmText\">\n                <option value=\"describe\" data-i18n=\"naist.images.llmDescribe\"></option>\n                <option value=\"remove\" data-i18n=\"naist.images.llmRemove\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_vstrength\" data-i18n=\"naist.images.variationStrength\"></label>\n            <input\n                id=\"naist_img_vstrength\"\n                type=\"number\"\n                min=\"0.01\"\n                max=\"0.99\"\n                step=\"0.01\"\n                class=\"text_pole\"\n                data-setting=\"inline.variationStrength\"\n            />\n        </div>\n        <div>\n            <label for=\"naist_img_vnoise\" data-i18n=\"naist.images.variationNoise\"></label>\n            <input\n                id=\"naist_img_vnoise\"\n                type=\"number\"\n                min=\"0\"\n                max=\"0.99\"\n                step=\"0.01\"\n                class=\"text_pole\"\n                data-setting=\"inline.variationNoise\"\n            />\n        </div>\n    </div>\n    <div class=\"naist-row\">\n        <div id=\"naist_img_toggle_chat\" class=\"menu_button\"></div>\n        <label class=\"checkbox_label\"\n            ><input id=\"naist_img_reading\" type=\"checkbox\" /><span data-i18n=\"naist.images.readingMode\"></span\n        ></label>\n    </div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.vibes.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.vibes.panelHint\"></div>\n    <div id=\"naist_open_vibes\" class=\"menu_button\" data-i18n=\"naist.vibes.open\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"stream.enabled\" /><span data-i18n=\"naist.progress.enable\"></span\n    ></label>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.images.gallery\"></b>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"gallery.enabled\" /><span data-i18n=\"naist.images.galleryEnabled\"></span\n    ></label>\n    <div id=\"naist_img_open_gallery\" class=\"menu_button\" data-i18n=\"naist.images.openGallery\"></div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.images.png\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.images.pngHint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"png.stripMetadata\" /><span data-i18n=\"naist.images.stripMetadata\"></span\n    ></label>\n    <div class=\"naist-row\">\n        <div id=\"naist_img_import\" class=\"menu_button\" data-i18n=\"naist.images.importPng\"></div>\n        <input id=\"naist_img_import_file\" type=\"file\" accept=\"image/png,image/webp\" class=\"naist-hidden\" />\n    </div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.continuity.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.continuity.hint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"continuity.enabled\" /><span data-i18n=\"naist.continuity.enabled\"></span\n    ></label>\n    <div class=\"naist-grid3\">\n        <div>\n            <label for=\"naist_cont_mode\" data-i18n=\"naist.continuity.mode\"></label>\n            <select id=\"naist_cont_mode\" class=\"text_pole\" data-setting=\"continuity.mode\">\n                <option value=\"img2img\" data-i18n=\"naist.continuity.modeImg2img\"></option>\n                <option value=\"vibe\" data-i18n=\"naist.continuity.modeVibe\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_cont_strength\" data-i18n=\"naist.continuity.strength\"></label>\n            <input\n                id=\"naist_cont_strength\"\n                type=\"number\"\n                min=\"0.1\"\n                max=\"0.95\"\n                step=\"0.05\"\n                class=\"text_pole\"\n                data-setting=\"continuity.strength\"\n            />\n        </div>\n        <div>\n            <label class=\"checkbox_label\"\n                ><input type=\"checkbox\" data-setting=\"continuity.autoBind\" /><span\n                    data-i18n=\"naist.continuity.autoBind\"\n                ></span\n            ></label>\n        </div>\n    </div>\n    <label for=\"naist_cont_current\" data-i18n=\"naist.continuity.current\"></label>\n    <div class=\"naist-row\">\n        <input\n            id=\"naist_cont_current\"\n            class=\"text_pole naist-grow\"\n            list=\"naist_cont_locations\"\n            data-i18n=\"[placeholder]naist.continuity.currentPlaceholder\"\n        />\n        <datalist id=\"naist_cont_locations\"></datalist>\n        <div id=\"naist_cont_bind\" class=\"menu_button\" data-i18n=\"naist.continuity.bind\"></div>\n        <div\n            id=\"naist_cont_forget\"\n            class=\"menu_button fa-solid fa-trash-can\"\n            data-i18n=\"[title]naist.continuity.forget\"\n        ></div>\n    </div>\n    <div id=\"naist_cont_info\" class=\"naist-muted\"></div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.sprites.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.sprites.panelHint\"></div>\n    <div id=\"naist_open_sprites\" class=\"menu_button\" data-i18n=\"naist.sprites.open\"></div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.comic.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.comic.panelHint\"></div>\n    <div id=\"naist_open_comic\" class=\"menu_button\" data-i18n=\"naist.comic.open\"></div>\n</div>\n";
//#endregion
//#region src/ui/panel/tab-images.ts
/** Reads NovelAI parameters from a dropped or chosen file and fills the panel. */
async function importPngFile(file) {
	try {
		const params = await readImportedParams(file);
		if (!params) {
			toastr.warning(t("naist.images.importNone"));
			return;
		}
		const applied = applyImportedParams(params);
		toastr.success(t("naist.images.importDone", {
			count: applied.length,
			model: params.model ?? "—"
		}));
	} catch (error) {
		reportGenerationError(error);
	}
}
var ImagesTab = class {
	actions;
	root;
	constructor(actions) {
		this.actions = actions;
	}
	mount(container) {
		container.innerHTML = render$2(tab_images_default);
		this.root = container;
		localize(container);
		bindSettings(container);
		const file = $id$1(container, "naist_img_import_file");
		$id$1(container, "naist_img_import").addEventListener("click", () => file.click());
		file.addEventListener("change", () => {
			const chosen = file.files?.[0];
			file.value = "";
			if (chosen) importPngFile(chosen);
		});
		$id$1(container, "naist_img_open_gallery").addEventListener("click", () => this.actions.openGallery());
		$id$1(container, "naist_img_toggle_chat").addEventListener("click", () => {
			Promise.resolve(this.actions.setVisibility(this.actions.chatHidden() ? "show" : "hide")).then(() => this.refresh());
		});
		$id$1(container, "naist_img_reading").addEventListener("change", (event) => {
			const on = event.target.checked;
			Promise.resolve(this.actions.setVisibility(on ? "reading-on" : "reading-off"));
		});
		this.refresh();
	}
	refresh() {
		if (!this.root) return;
		readFromSettings(this.root);
		$id$1(this.root, "naist_img_toggle_chat").textContent = t(this.actions.chatHidden() ? "naist.images.showChat" : "naist.images.hideChat");
		$id$1(this.root, "naist_img_reading").checked = settings().inline.readingMode;
	}
};
//#endregion
//#region src/ui/templates/tab-prompts.html?raw
var tab_prompts_default = "<div class=\"naist-section\">\n    <b data-i18n=\"naist.scene.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.scene.hint\"></div>\n    <div class=\"naist-row\">\n        <div id=\"naist_open_composer\" class=\"menu_button\" data-i18n=\"naist.scene.openComposer\"></div>\n        <div id=\"naist_edit_char_passport\" class=\"menu_button\" data-i18n=\"naist.scene.charPassport\"></div>\n        <div id=\"naist_edit_persona_passport\" class=\"menu_button\" data-i18n=\"naist.scene.personaPassport\"></div>\n        <div id=\"naist_open_pose_library\" class=\"menu_button\" data-i18n=\"naist.scene.poseLibrary\"></div>\n    </div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"scene.allowNsfw\" /><span data-i18n=\"naist.composer.allowNsfw\"></span\n    ></label>\n    <label for=\"naist_explicit_negative\" data-i18n=\"naist.scene.explicitNegative\"></label>\n    <textarea\n        id=\"naist_explicit_negative\"\n        class=\"text_pole textarea_compact\"\n        rows=\"2\"\n        data-setting=\"scene.explicitNegative\"\n    ></textarea>\n    <div class=\"naist-hint\" data-i18n=\"naist.scene.explicitNegativeHint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"scene.llmBase\" /><span data-i18n=\"naist.scene.llmBase\"></span\n    ></label>\n</div>\n\n<div id=\"naist_style_editor\" class=\"naist-section\">\n    <div class=\"naist-row\">\n        <b data-i18n=\"naist.prompts.styles\"></b>\n        <span\n            id=\"naist_style_dirty\"\n            class=\"naist-badge naist-badge-warn naist-hidden\"\n            data-i18n=\"naist.prompts.styleChanged\"\n        ></span>\n    </div>\n    <div class=\"naist-row\">\n        <select id=\"naist_style\" class=\"text_pole naist-grow\"></select>\n        <div id=\"naist_style_new\" class=\"menu_button fa-solid fa-plus\" data-i18n=\"[title]naist.prompts.styleNew\"></div>\n        <div\n            id=\"naist_style_rename\"\n            class=\"menu_button fa-solid fa-pencil\"\n            data-i18n=\"[title]naist.prompts.styleRename\"\n        ></div>\n        <div\n            id=\"naist_style_delete\"\n            class=\"menu_button fa-solid fa-trash-can\"\n            data-i18n=\"[title]naist.prompts.styleDelete\"\n        ></div>\n    </div>\n    <div id=\"naist_style_status\" class=\"naist-hint\"></div>\n    <label id=\"naist_prefix_label\" for=\"naist_prefix\" data-i18n=\"naist.prompts.prefix\"></label>\n    <textarea id=\"naist_prefix\" class=\"text_pole textarea_compact\" rows=\"2\" data-setting=\"prompts.prefix\"></textarea>\n    <label id=\"naist_suffix_label\" for=\"naist_suffix\" data-i18n=\"naist.prompts.suffix\"></label>\n    <textarea id=\"naist_suffix\" class=\"text_pole textarea_compact\" rows=\"2\" data-setting=\"prompts.suffix\"></textarea>\n    <div class=\"naist-hint\" data-i18n=\"naist.prompts.prefixHint\"></div>\n    <label id=\"naist_style_negative_label\" for=\"naist_style_negative\" data-i18n=\"naist.prompts.commonNegative\"></label>\n    <textarea id=\"naist_style_negative\" class=\"text_pole textarea_compact\" rows=\"2\"></textarea>\n    <div class=\"naist-grid2\">\n        <div id=\"naist_style_mode_box\">\n            <label for=\"naist_style_mode\" data-i18n=\"naist.prompts.negativeMode\"></label>\n            <select id=\"naist_style_mode\" class=\"text_pole\">\n                <option value=\"replace\" data-i18n=\"naist.prompts.negativeModeReplace\"></option>\n                <option value=\"append\" data-i18n=\"naist.prompts.negativeModeAppend\"></option>\n            </select>\n        </div>\n        <div>\n            <label id=\"naist_style_uc_label\" for=\"naist_style_uc\" data-i18n=\"naist.panel.ucPreset\"></label>\n            <select id=\"naist_style_uc\" class=\"text_pole\"></select>\n        </div>\n    </div>\n    <div id=\"naist_style_effective_box\" class=\"naist-hidden\">\n        <label for=\"naist_style_effective\" data-i18n=\"naist.prompts.effectiveNegative\"></label>\n        <div id=\"naist_style_effective\" class=\"naist-pre naist-style-effective\"></div>\n    </div>\n    <div id=\"naist_style_actions\" class=\"naist-row naist-hidden\">\n        <div id=\"naist_style_save\" class=\"menu_button\" data-i18n=\"naist.prompts.styleSave\"></div>\n        <div id=\"naist_style_revert\" class=\"menu_button\" data-i18n=\"naist.prompts.styleRevert\"></div>\n    </div>\n    <label for=\"naist_base_negative\" data-i18n=\"naist.prompts.baseNegative\"></label>\n    <textarea id=\"naist_base_negative\" class=\"text_pole textarea_compact\" rows=\"2\"></textarea>\n    <div class=\"naist-hint\" data-i18n=\"naist.prompts.baseNegativeHint\"></div>\n    <div class=\"naist-hint\" data-i18n=\"naist.prompts.stylesHint\"></div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.language.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.language.hint\"></div>\n    <div class=\"naist-grid2\">\n        <div>\n            <label for=\"naist_language_mode\" data-i18n=\"naist.language.mode\"></label>\n            <select id=\"naist_language_mode\" class=\"text_pole\" data-setting=\"language.mode\">\n                <option value=\"auto\" data-i18n=\"naist.language.modeAuto\"></option>\n                <option value=\"always\" data-i18n=\"naist.language.modeAlways\"></option>\n                <option value=\"off\" data-i18n=\"naist.language.modeOff\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_language_backend\" data-i18n=\"naist.language.backend\"></label>\n            <select id=\"naist_language_backend\" class=\"text_pole\" data-setting=\"language.backend\">\n                <option value=\"main\" data-i18n=\"naist.language.backendMain\"></option>\n                <option value=\"profile\" data-i18n=\"naist.language.backendProfile\"></option>\n                <option value=\"novelai\" data-i18n=\"naist.language.backendNovelai\"></option>\n            </select>\n        </div>\n    </div>\n    <div id=\"naist_language_profile_row\" class=\"naist-hidden\">\n        <label for=\"naist_language_profile\" data-i18n=\"naist.language.profile\"></label>\n        <select id=\"naist_language_profile\" class=\"text_pole\" data-setting=\"language.profileId\"></select>\n        <div class=\"naist-hint\" data-i18n=\"naist.language.profileHint\"></div>\n    </div>\n    <div id=\"naist_language_novelai_row\" class=\"naist-hidden\">\n        <label for=\"naist_language_novelai_model\" data-i18n=\"naist.language.novelaiModel\"></label>\n        <select id=\"naist_language_novelai_model\" class=\"text_pole\" data-setting=\"language.novelaiModel\">\n            <option value=\"glm-4-6\">GLM-4.6</option>\n            <option value=\"xialong-v1\">Xialong (Opus)</option>\n        </select>\n        <div class=\"naist-hint\" data-i18n=\"naist.language.novelaiHint\"></div>\n    </div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"language.russianOnV5\" /><span\n            data-i18n=\"naist.language.russianOnV5\"\n        ></span\n    ></label>\n    <label for=\"naist_language_test\" data-i18n=\"naist.language.test\"></label>\n    <textarea\n        id=\"naist_language_test\"\n        class=\"text_pole textarea_compact\"\n        rows=\"2\"\n        data-i18n=\"[placeholder]naist.language.testPlaceholder\"\n    ></textarea>\n    <div class=\"naist-row\">\n        <div id=\"naist_language_test_run\" class=\"menu_button\" data-i18n=\"naist.language.testRun\"></div>\n    </div>\n    <pre id=\"naist_language_test_result\" class=\"naist-pre naist-hidden\"></pre>\n    <label for=\"naist_glossary\" data-i18n=\"naist.translate.glossary\"></label>\n    <textarea\n        id=\"naist_glossary\"\n        class=\"text_pole textarea_compact\"\n        rows=\"4\"\n        data-i18n=\"[placeholder]naist.translate.glossaryPlaceholder\"\n    ></textarea>\n    <div class=\"naist-hint\" data-i18n=\"naist.translate.glossaryHint\"></div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.tags.title\"></b>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"promptTools.autocomplete\" /><span\n            data-i18n=\"naist.tags.autocomplete\"\n        ></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"promptTools.remoteSuggest\" /><span data-i18n=\"naist.tags.remote\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"promptTools.warnUnknown\" /><span data-i18n=\"naist.tags.warnUnknown\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"promptTools.counter\" /><span data-i18n=\"naist.tokens.enable\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"promptTools.convertWeights\" /><span data-i18n=\"naist.weights.auto\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"generation.autoText\" /><span data-i18n=\"naist.tokens.autoText\"></span\n    ></label>\n    <div class=\"naist-hint\" data-i18n=\"naist.weights.hint\"></div>\n</div>\n\n<div id=\"naist_char_prompt_block\" class=\"naist-section\">\n    <b data-i18n=\"naist.prompts.characterPrompt\"></b> <span id=\"naist_char_prompt_name\" class=\"naist-muted\"></span>\n    <textarea\n        id=\"naist_char_positive\"\n        class=\"text_pole textarea_compact\"\n        rows=\"2\"\n        data-i18n=\"[placeholder]naist.prompts.characterPositive\"\n    ></textarea>\n    <textarea\n        id=\"naist_char_negative\"\n        class=\"text_pole textarea_compact\"\n        rows=\"2\"\n        data-i18n=\"[placeholder]naist.prompts.characterNegative\"\n    ></textarea>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" id=\"naist_char_share\" /><span data-i18n=\"naist.prompts.characterShare\"></span\n    ></label>\n</div>\n<div id=\"naist_char_prompt_none\" class=\"naist-hint naist-hidden\" data-i18n=\"naist.prompts.characterNone\"></div>\n\n<details class=\"naist-section\">\n    <summary data-i18n=\"naist.prompts.templates\"></summary>\n    <div class=\"naist-hint\" data-i18n=\"naist.prompts.templatesHint\"></div>\n    <div id=\"naist_templates\"></div>\n</details>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.io.title\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.io.hint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" id=\"naist_settings_images\" checked /><span data-i18n=\"naist.io.includeImages\"></span\n    ></label>\n    <div class=\"naist-row\">\n        <div id=\"naist_settings_export\" class=\"menu_button\" data-i18n=\"naist.io.export\"></div>\n        <div id=\"naist_settings_import\" class=\"menu_button\" data-i18n=\"naist.io.import\"></div>\n        <input id=\"naist_settings_file\" type=\"file\" accept=\".json,application/json\" class=\"naist-hidden\" />\n    </div>\n</div>\n";
//#endregion
//#region src/ui/panel/tab-prompts.ts
var PromptsTab = class {
	onChange;
	onFields;
	root;
	styleTokens = null;
	/**
	* `onChange`: something that affects the preview changed. `onFields`: the style editor changed the
	* current undesired content or UC preset, which the Generate tab shows too.
	*/
	constructor(onChange, onFields = () => {}) {
		this.onChange = onChange;
		this.onFields = onFields;
	}
	mount(container) {
		container.innerHTML = render$2(tab_prompts_default);
		this.root = container;
		localize(container);
		this.fillProfiles();
		bindSettings(container, (path) => {
			this.applyLanguage();
			if (path === "prompts.prefix" || path === "prompts.suffix") {
				this.updateStyleStatus();
				this.onFields();
			}
			this.onChange();
		});
		this.bindLanguage();
		this.applyLanguage();
		this.bindStyles();
		this.renderStyles();
		this.renderTemplates();
		this.bindCharacter();
		this.refreshCharacter();
		const c = ctx();
		c.eventSource.on(c.eventTypes.CHAT_CHANGED ?? "chat_id_changed", () => this.refreshCharacter());
	}
	/** Re-reads every control after settings changed outside of this tab. */
	refresh() {
		this.fillProfiles();
		readFromSettings(this.root);
		this.applyLanguage();
		this.renderStyles();
		this.fillTemplates();
		this.refreshCharacter();
	}
	/** Connection profiles that can answer a request (Connection Manager, ST 1.19). */
	fillProfiles() {
		let profiles;
		try {
			profiles = ctx().ConnectionManagerRequestService.getSupportedProfiles();
		} catch {
			profiles = [];
		}
		const current = settings().language.profileId;
		const options = [{
			value: "",
			label: t("naist.language.profileNone")
		}, ...profiles.map((p) => ({
			value: p.id,
			label: p.name || p.id
		}))];
		if (current && !profiles.some((p) => p.id === current)) options.push({
			value: current,
			label: current
		});
		fillSelect$1($id$1(this.root, "naist_language_profile"), options, current);
	}
	applyLanguage() {
		const backend = settings().language.backend;
		$id$1(this.root, "naist_language_profile_row").classList.toggle("naist-hidden", backend !== "profile");
		$id$1(this.root, "naist_language_novelai_row").classList.toggle("naist-hidden", backend !== "novelai");
	}
	bindLanguage() {
		const button = $id$1(this.root, "naist_language_test_run");
		const output = $id$1(this.root, "naist_language_test_result");
		button.addEventListener("click", async () => {
			const text = $id$1(this.root, "naist_language_test").value;
			if (!text.trim() || button.classList.contains("disabled")) return;
			button.classList.add("disabled");
			try {
				const result = await interpretForModel(text, settings().generation.model, {
					force: true,
					strict: true
				});
				const lines = result ? [result.prompt, result.negative ? `${t("naist.language.testNegative")} ${result.negative}` : ""] : [t("naist.interpret.already")];
				if (result?.unmatched.length) lines.push(t("naist.interpret.unmatched", { tags: result.unmatched.join(", ") }));
				output.textContent = lines.filter(Boolean).join("\n");
				output.classList.remove("naist-hidden");
			} catch (error) {
				reportGenerationError(error);
			} finally {
				button.classList.remove("disabled");
			}
		});
	}
	renderStyles() {
		const prompts = settings().prompts;
		const options = [{
			value: "",
			label: t("naist.prompts.styleNone")
		}, ...prompts.styles.map((s) => ({
			value: s.name,
			label: s.name
		}))];
		fillSelect$1($id$1(this.root, "naist_style"), options, activeStyle(settings())?.name ?? "");
		this.renderStyleEditor();
	}
	/** Re-reads the editor after the current fields changed elsewhere (the Generate tab, a command). */
	syncStyleFields() {
		this.renderStyleEditor();
	}
	renderStyleEditor() {
		const s = settings();
		const r = this.root;
		const style = activeStyle(s);
		const own = $id$1(r, "naist_style_negative");
		own.value = currentOwnNegative(s, own.value);
		$id$1(r, "naist_style_mode").value = currentNegativeMode(s);
		const model = s.generation.model;
		fillSelect$1($id$1(r, "naist_style_uc"), getCapabilities(isModelId(model) ? model : DEFAULT_MODEL).ucPresets.map((id) => ({
			value: id,
			label: t(`naist.ucPreset.${id}`)
		})), s.generation.ucPreset);
		const base = $id$1(r, "naist_base_negative");
		if (base.value !== s.prompts.baseNegative) base.value = s.prompts.baseNegative;
		const label = (id, key) => {
			const el = $id$1(r, id);
			el.setAttribute("data-i18n", key);
			el.textContent = t(key);
		};
		label("naist_prefix_label", style ? "naist.prompts.stylePrefix" : "naist.prompts.prefix");
		label("naist_suffix_label", style ? "naist.prompts.styleSuffix" : "naist.prompts.suffix");
		label("naist_style_negative_label", style ? "naist.prompts.styleNegative" : "naist.prompts.commonNegative");
		label("naist_style_uc_label", style ? "naist.prompts.styleUc" : "naist.panel.ucPreset");
		$id$1(r, "naist_style_mode_box").classList.toggle("naist-hidden", !style);
		$id$1(r, "naist_style_actions").classList.toggle("naist-hidden", !style);
		$id$1(r, "naist_style_rename").classList.toggle("disabled", !style);
		$id$1(r, "naist_style_delete").classList.toggle("disabled", !style);
		$id$1(r, "naist_style_status").textContent = style ? t("naist.prompts.styleEditing", { name: style.name }) : t("naist.prompts.styleCommon");
		this.updateStyleStatus();
	}
	/** The "changed" badge, the buttons, the effective undesired content and the token counter. */
	updateStyleStatus() {
		const s = settings();
		const r = this.root;
		const style = activeStyle(s);
		const changed = styleChanged(s, style);
		$id$1(r, "naist_style_dirty").classList.toggle("naist-hidden", !changed);
		$id$1(r, "naist_style_save").classList.toggle("disabled", !changed);
		$id$1(r, "naist_style_revert").classList.toggle("disabled", !changed);
		const append = Boolean(style) && currentNegativeMode(s) === "append";
		$id$1(r, "naist_style_effective_box").classList.toggle("naist-hidden", !append);
		$id$1(r, "naist_style_effective").textContent = s.generation.negativePrompt.trim() ? s.generation.negativePrompt : t("naist.prompts.effectiveEmpty");
		const counter = s.promptTools.counter;
		this.styleTokens?.element.classList.toggle("naist-hidden", !counter);
		if (counter) this.styleTokens?.update({
			model: s.generation.model,
			prompt: combinePrefixes(s.prompts.prefix, s.prompts.suffix),
			characters: [],
			negative: s.generation.negativePrompt,
			raw: [
				s.prompts.prefix,
				s.prompts.suffix,
				s.generation.negativePrompt
			].join("\n")
		});
	}
	/** A field of the editor changed the current fields: save, show it here and on the Generate tab. */
	styleFieldsChanged() {
		saveSettings();
		this.updateStyleStatus();
		this.onFields();
		this.onChange();
	}
	/** A style replaced the current fields: every tab re-reads its controls. */
	styleApplied() {
		saveSettings();
		readFromSettings(this.root);
		this.renderStyles();
		this.onChange();
		notifyExternalChange();
	}
	async confirm(text) {
		const c = ctx();
		return await c.callGenericPopup(text, c.POPUP_TYPE.CONFIRM) === c.POPUP_RESULT.AFFIRMATIVE;
	}
	async selectStyle(name) {
		const s = settings();
		const current = activeStyle(s);
		if (name && current && current.name !== name && styleChanged(s, current) && !await this.confirm(t("naist.prompts.styleDiscardConfirm", { name: current.name }))) {
			$id$1(this.root, "naist_style").value = current.name;
			return;
		}
		const style = s.prompts.styles.find((x) => x.name === name);
		if (style) {
			$id$1(this.root, "naist_style_negative").value = style.negative;
			applyStyle(s, style);
		} else {
			s.prompts.activeStyle = "";
			s.prompts.negativeMode = "replace";
		}
		this.styleApplied();
	}
	bindStyles() {
		const c = ctx();
		const r = this.root;
		const select = $id$1(r, "naist_style");
		const own = $id$1(r, "naist_style_negative");
		const mode = $id$1(r, "naist_style_mode");
		this.styleTokens = createTokenMeter();
		$id$1(r, "naist_style_effective_box").after(this.styleTokens.element);
		select.addEventListener("change", () => void this.selectStyle(select.value));
		own.addEventListener("input", () => {
			setOwnNegative(settings(), own.value);
			this.styleFieldsChanged();
		});
		mode.addEventListener("change", () => {
			setNegativeMode(settings(), negativeMode(mode.value), own.value);
			this.styleFieldsChanged();
		});
		$id$1(r, "naist_style_uc").addEventListener("change", (event) => {
			settings().generation.ucPreset = event.target.value;
			this.styleFieldsChanged();
		});
		$id$1(r, "naist_base_negative").addEventListener("input", (event) => {
			setBaseNegative(settings(), event.target.value, own.value);
			this.styleFieldsChanged();
		});
		$id$1(r, "naist_style_save").addEventListener("click", () => {
			const s = settings();
			const style = activeStyle(s);
			if (!style || !styleChanged(s, style)) return;
			const saved = styleFromSettings(s, style.name, own.value);
			s.prompts.styles = s.prompts.styles.map((x) => x === style ? saved : x);
			own.value = saved.negative;
			applyStyle(s, saved);
			this.styleApplied();
		});
		$id$1(r, "naist_style_revert").addEventListener("click", () => {
			const s = settings();
			const style = activeStyle(s);
			if (!style) return;
			own.value = style.negative;
			applyStyle(s, style);
			this.styleApplied();
		});
		$id$1(r, "naist_style_new").addEventListener("click", async () => {
			const input = await c.callGenericPopup(t("naist.prompts.styleNamePrompt"), c.POPUP_TYPE.INPUT, "");
			const name = typeof input === "string" ? input.trim() : "";
			if (!name) return;
			const s = settings();
			const existing = findStyle(s, name);
			if (existing && !await this.confirm(t("naist.prompts.styleOverwriteConfirm", { name: existing.name }))) return;
			const style = styleFromSettings(s, name, own.value);
			if (existing) s.prompts.styles = s.prompts.styles.map((x) => x === existing ? style : x);
			else s.prompts.styles.push(style);
			own.value = style.negative;
			applyStyle(s, style);
			this.styleApplied();
		});
		$id$1(r, "naist_style_rename").addEventListener("click", async () => {
			const s = settings();
			const style = activeStyle(s);
			if (!style) return;
			const input = await c.callGenericPopup(t("naist.prompts.styleNamePrompt"), c.POPUP_TYPE.INPUT, style.name);
			const name = typeof input === "string" ? input.trim() : "";
			if (!name || name === style.name) return;
			const taken = findStyle(s, name);
			if (taken && taken !== style) {
				toastr.warning(t("naist.prompts.styleNameTaken", { name: taken.name }));
				return;
			}
			style.name = name;
			s.prompts.activeStyle = name;
			saveSettings();
			this.renderStyles();
		});
		$id$1(r, "naist_style_delete").addEventListener("click", async () => {
			const s = settings();
			const style = activeStyle(s);
			if (!style) return;
			if (!await this.confirm(t("naist.prompts.styleDeleteConfirm", { name: style.name }))) return;
			s.prompts.styles = s.prompts.styles.filter((x) => x !== style);
			s.prompts.activeStyle = "";
			s.prompts.negativeMode = "replace";
			this.styleApplied();
		});
	}
	refreshCharacter() {
		const index = soloCharacterIndex();
		const character = index === void 0 ? void 0 : ctx().characters[index];
		$id$1(this.root, "naist_char_prompt_block").classList.toggle("naist-hidden", !character);
		$id$1(this.root, "naist_char_prompt_none").classList.toggle("naist-hidden", Boolean(character));
		if (!character) return;
		const prompt = readCharacterPrompt(character);
		$id$1(this.root, "naist_char_prompt_name").textContent = character.name;
		$id$1(this.root, "naist_char_positive").value = prompt.positive;
		$id$1(this.root, "naist_char_negative").value = prompt.negative;
		$id$1(this.root, "naist_char_share").checked = prompt.shared;
	}
	bindCharacter() {
		let timer = null;
		const save = () => {
			const index = soloCharacterIndex();
			if (index === void 0) return;
			const value = {
				positive: $id$1(this.root, "naist_char_positive").value,
				negative: $id$1(this.root, "naist_char_negative").value
			};
			const share = $id$1(this.root, "naist_char_share").checked;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => void saveCharacterPrompt(index, value, share).then(() => this.onChange()), 500);
		};
		$id$1(this.root, "naist_char_positive").addEventListener("input", save);
		$id$1(this.root, "naist_char_negative").addEventListener("input", save);
		$id$1(this.root, "naist_char_share").addEventListener("change", save);
	}
	fillTemplates() {
		const overrides = settings().prompts.templates;
		this.root.querySelectorAll(".naist-template").forEach((block) => {
			const key = block.dataset.mode ?? "";
			const area = block.querySelector(".naist-template-text");
			if (area) area.value = overrides[key] ?? DEFAULT_TEMPLATES[key] ?? "";
		});
	}
	renderTemplates() {
		const container = $id$1(this.root, "naist_templates");
		const overrides = settings().prompts.templates;
		container.innerHTML = TEMPLATE_MODES.map((mode) => {
			const key = String(mode);
			return `<div class="naist-template" data-mode="${key}">
                <div class="naist-row"><b data-i18n="naist.mode.${key}"></b>
                <div class="menu_button fa-solid fa-rotate-left naist-template-reset" data-i18n="[title]naist.prompts.templateReset"></div></div>
                <textarea class="text_pole textarea_compact naist-template-text" rows="3">${escapeHtml$2(overrides[key] ?? DEFAULT_TEMPLATES[key] ?? "")}</textarea>
            </div>`;
		}).join("");
		localize(container);
		container.addEventListener("input", (event) => {
			const area = event.target;
			const key = area.closest(".naist-template")?.dataset.mode;
			if (!key || !area.classList.contains("naist-template-text")) return;
			const templates = settings().prompts.templates;
			if (area.value === DEFAULT_TEMPLATES[key]) delete templates[key];
			else templates[key] = area.value;
			saveSettings();
			this.onChange();
		});
		container.addEventListener("click", (event) => {
			const button = event.target;
			if (!button.classList.contains("naist-template-reset")) return;
			const block = button.closest(".naist-template");
			const key = block?.dataset.mode;
			if (!key || !block) return;
			delete settings().prompts.templates[key];
			saveSettings();
			const area = block.querySelector(".naist-template-text");
			if (area) area.value = DEFAULT_TEMPLATES[key] ?? "";
			this.onChange();
		});
	}
};
//#endregion
//#region src/ui/templates/tab-takeover.html?raw
var tab_takeover_default = "<div class=\"naist-section\">\n    <b data-i18n=\"naist.takeover.status\"></b>\n    <div id=\"naist_takeover_state\" class=\"naist-account\"></div>\n    <div id=\"naist_takeover_commands\" class=\"naist-hint\"></div>\n    <div class=\"naist-row\">\n        <div id=\"naist_takeover_disable\" class=\"menu_button menu_button_icon\">\n            <i class=\"fa-solid fa-right-left\"></i><span data-i18n=\"naist.takeover.disable\"></span>\n        </div>\n        <div id=\"naist_takeover_enable\" class=\"menu_button menu_button_icon naist-hidden\">\n            <i class=\"fa-solid fa-rotate-left\"></i><span data-i18n=\"naist.takeover.enable\"></span>\n        </div>\n    </div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.takeover.migration\"></b>\n    <div id=\"naist_migration_state\" class=\"naist-account\"></div>\n    <div class=\"naist-row\">\n        <div id=\"naist_migration_run\" class=\"menu_button menu_button_icon\">\n            <i class=\"fa-solid fa-file-import\"></i><span data-i18n=\"naist.takeover.migrate\"></span>\n        </div>\n    </div>\n    <ul id=\"naist_migration_report\" class=\"naist-list\"></ul>\n</div>\n";
//#endregion
//#region src/ui/panel/tab-takeover.ts
var TakeoverTab = class {
	onMigrated;
	root;
	constructor(onMigrated) {
		this.onMigrated = onMigrated;
	}
	mount(container) {
		container.innerHTML = render$2(tab_takeover_default);
		this.root = container;
		localize(container);
		$id$1(container, "naist_takeover_disable").addEventListener("click", () => void this.disable());
		$id$1(container, "naist_takeover_enable").addEventListener("click", () => void this.enable());
		$id$1(container, "naist_migration_run").addEventListener("click", () => void this.migrate());
		this.refresh();
	}
	refresh() {
		const active = isBuiltInActive();
		$id$1(this.root, "naist_takeover_state").textContent = t(active ? "naist.takeover.builtInActive" : "naist.takeover.builtInDisabled");
		$id$1(this.root, "naist_takeover_commands").textContent = t(active ? "naist.takeover.commandsBuiltIn" : "naist.takeover.commandsOurs");
		$id$1(this.root, "naist_takeover_disable").classList.toggle("naist-hidden", !active);
		$id$1(this.root, "naist_takeover_enable").classList.toggle("naist-hidden", active);
		const migratedAt = settings().takeover.migratedAt;
		$id$1(this.root, "naist_migration_state").textContent = migratedAt ? t("naist.takeover.migratedAt", { date: new Date(migratedAt).toLocaleString() }) : t("naist.takeover.notMigrated");
		$id$1(this.root, "naist_migration_run").classList.toggle("naist-hidden", Boolean(migratedAt));
		const report = $id$1(this.root, "naist_migration_report");
		report.innerHTML = "";
		for (const line of settings().takeover.migrationReport) {
			const li = document.createElement("li");
			li.textContent = line;
			report.append(li);
		}
	}
	async migrate() {
		const report = await runMigration();
		this.refresh();
		this.onMigrated();
		await showReport(report);
	}
	async disable() {
		const c = ctx();
		if (await c.callGenericPopup(t("naist.takeover.disableConfirm"), c.POPUP_TYPE.CONFIRM, "", {
			okButton: t("naist.takeover.disableOk"),
			cancelButton: t("naist.inspector.cancel")
		}) !== c.POPUP_RESULT.AFFIRMATIVE) return;
		if (needsMigration()) await runMigration();
		await disableBuiltIn();
	}
	async enable() {
		const c = ctx();
		if (await c.callGenericPopup(t("naist.takeover.enableConfirm"), c.POPUP_TYPE.CONFIRM) !== c.POPUP_RESULT.AFFIRMATIVE) return;
		await enableBuiltIn();
	}
};
async function showReport(lines) {
	const c = ctx();
	const root = document.createElement("div");
	root.innerHTML = `<h3 data-i18n="naist.takeover.reportTitle"></h3><ul class="naist-list naist-report"></ul>`;
	localize(root);
	const list = root.querySelector("ul");
	for (const line of lines) {
		const li = document.createElement("li");
		li.textContent = line;
		list?.append(li);
	}
	await c.callGenericPopup(root, c.POPUP_TYPE.TEXT, "", { wide: true });
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
	pipeline;
	onSettingChange;
	imageActions;
	root;
	refreshTimer = null;
	lastPrepared = null;
	promptsTab = null;
	chatTab = null;
	imagesTab = null;
	takeoverTab = null;
	tokens = null;
	/** The panel's own picture is being made (other requests only queue it). */
	generating = false;
	queueTimer = null;
	constructor(controller, pipeline, onSettingChange = () => {}, imageActions = {
		openGallery: () => {},
		setVisibility: () => {},
		chatHidden: () => false
	}) {
		this.controller = controller;
		this.pipeline = pipeline;
		this.onSettingChange = onSettingChange;
		this.imageActions = imageActions;
	}
	/** Dropping a NovelAI PNG/WebP anywhere on the panel fills the parameters (TZ Phase 3). */
	installPngDrop() {
		const root = this.root;
		root.addEventListener("dragover", (event) => {
			if (!event.dataTransfer?.types.includes("Files")) return;
			event.preventDefault();
			event.stopPropagation();
			root.classList.add("naist-drop-active");
		});
		root.addEventListener("dragleave", (event) => {
			if (event.target === root) root.classList.remove("naist-drop-active");
		});
		root.addEventListener("drop", (event) => {
			const file = event.dataTransfer?.files?.[0];
			root.classList.remove("naist-drop-active");
			if (!file) return;
			event.preventDefault();
			event.stopPropagation();
			importPngFile(file);
		});
	}
	mount(container) {
		const html = render(panel_default, { models: MODELS });
		const wrapper = document.createElement("div");
		wrapper.innerHTML = html;
		this.root = wrapper.firstElementChild;
		container.append(this.root);
		localize(this.root);
		this.bind();
		this.mountPromptTools();
		this.syncFromSettings();
		this.mountTabs();
		this.controller.subscribe((state) => this.onState(state));
		this.onState(this.controller.state);
		this.controller.queue.subscribe(() => this.renderQueue());
		this.renderQueue();
	}
	tabPanel(name) {
		const panel = this.root.querySelector(`[data-tabpanel="${name}"]`);
		if (!panel) throw new Error(`NAI Studio panel: missing tab ${name}`);
		return panel;
	}
	mountTabs() {
		this.promptsTab = new PromptsTab(() => this.scheduleRefresh(), () => this.syncStyleFields());
		this.promptsTab.mount(this.tabPanel("prompts"));
		this.chatTab = new ChatTab((path) => {
			this.onSettingChange(path);
			this.scheduleRefresh();
		});
		this.chatTab.mount(this.tabPanel("chat"));
		this.imagesTab = new ImagesTab(this.imageActions);
		this.imagesTab.mount(this.tabPanel("images"));
		this.installPngDrop();
		this.takeoverTab = new TakeoverTab(() => this.scheduleRefresh());
		this.takeoverTab.mount(this.tabPanel("takeover"));
		this.root.querySelectorAll("[data-tab]").forEach((tab) => {
			tab.addEventListener("click", () => this.showTab(tab.dataset.tab ?? "generate"));
		});
		$id(this.root, "naist_banner_open").addEventListener("click", () => this.showTab("takeover"));
		$id(this.root, "naist_takeover_banner").classList.toggle("naist-hidden", !isBuiltInActive());
		onExternalChange(() => this.refreshAll());
		this.showTab("generate");
	}
	refreshAll() {
		this.syncFromSettings();
		this.promptsTab?.refresh();
		this.chatTab?.refresh();
		this.imagesTab?.refresh();
		this.takeoverTab?.refresh();
		this.scheduleRefresh();
	}
	showTab(name) {
		this.root.querySelectorAll("[data-tabpanel]").forEach((panel) => {
			panel.classList.toggle("naist-hidden", panel.dataset.tabpanel !== name);
		});
		this.root.querySelectorAll("[data-tab]").forEach((tab) => {
			tab.classList.toggle("naist-tab-active", tab.dataset.tab === name);
		});
		if (name === "takeover") this.takeoverTab?.refresh();
		if (name === "images") this.imagesTab?.refresh();
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
		this.renderStyleHint();
	}
	/** The style editor changed the current undesired content or UC preset (v0.13). */
	syncStyleFields() {
		const g = settings().generation;
		const negative = $id(this.root, "naist_negative");
		if (negative.value !== g.negativePrompt) negative.value = g.negativePrompt;
		const uc = $id(this.root, "naist_uc_preset");
		if ([...uc.options].some((o) => o.value === g.ucPreset)) uc.value = g.ucPreset;
		this.renderStyleHint();
		this.scheduleRefresh();
	}
	/** Under the undesired content: which style it comes from and whether it was changed since. */
	renderStyleHint() {
		const s = settings();
		const style = activeStyle(s);
		const hint = $id(this.root, "naist_negative_style");
		const changed = styleChanged(s, style);
		hint.classList.toggle("naist-warning", changed);
		if (!style) {
			hint.textContent = "";
			return;
		}
		const from = t(currentNegativeMode(s) === "append" ? "naist.panel.negativeStyleAppend" : "naist.panel.negativeStyleReplace", { name: style.name });
		hint.textContent = changed ? `${from} ${t("naist.panel.negativeStyleChanged")}` : from;
	}
	/** The undesired content or the UC preset was edited here: the style editor shows it as a change. */
	styleFieldEdited() {
		this.promptsTab?.syncStyleFields();
		this.renderStyleHint();
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
		container.querySelectorAll(".naist-character").forEach((row) => {
			const over = Number(row.dataset.index) >= caps.maxCharacters;
			row.classList.toggle("naist-disabled", over);
			row.querySelectorAll("input, textarea").forEach((el) => {
				el.disabled = over;
			});
			row.title = over ? t("naist.panel.characterOverLimit", { max: caps.maxCharacters }) : "";
		});
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
		$id(r, "naist_negative").addEventListener("input", () => this.styleFieldEdited());
		$id(r, "naist_uc_preset").addEventListener("change", () => this.styleFieldEdited());
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
			this.convertWeightsFor(g().model);
			this.applyModel();
			this.renderCharacters();
			this.styleFieldEdited();
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
			this.chatTab?.applyGuards();
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
		$id(r, "naist_queue_clear").addEventListener("click", () => {
			const count = this.controller.queue.clear();
			if (count) toastr.info(t("naist.queue.cleared", { count }), t("naist.queue.title"));
		});
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
		$id(r, "naist_generate").classList.toggle("disabled", this.generating);
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
	/** Token counter under the prompt fields, tag helpers on every prompt field (TZ Phase 6). */
	mountPromptTools() {
		const negative = $id(this.root, "naist_negative");
		this.tokens = createTokenMeter();
		negative.after(this.tokens.element);
		attachPromptAssist(this.root, "#naist_prompt, #naist_negative, .naist-char-prompt, .naist-char-negative, #naist_prefix, #naist_suffix, #naist_style_negative, #naist_base_negative", () => settings().generation.model);
	}
	/** Numeric weights cannot go to V3: convert them to braces when the model changes. */
	convertWeightsFor(model) {
		if (!settings().promptTools.convertWeights) return;
		if (getCapabilities(isModelId(model) ? model : "nai-diffusion-4-5-full").v4Prompt) return;
		const g = settings().generation;
		const lossy = [];
		let changed = false;
		const convert = (text) => {
			const result = convertWeights(text, false);
			lossy.push(...result.lossy);
			changed ||= result.changed;
			return result.text;
		};
		g.prompt = convert(g.prompt);
		g.negativePrompt = convert(g.negativePrompt);
		for (const slot of g.characters) {
			slot.prompt = convert(slot.prompt);
			slot.negative = convert(slot.negative);
		}
		if (!changed) return;
		this.syncFromSettings();
		this.promptsTab?.syncStyleFields();
		toastr.info(lossy.length ? t("naist.weights.convertedLossy", { dropped: lossy.join(", ") }) : t("naist.weights.converted"), t("naist.weights.title"));
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
			const prepared = this.pipeline.previewFree(settings().generation.prompt);
			this.lastPrepared = prepared;
			if (settings().promptTools.counter) {
				const g = settings().generation;
				const v4 = prepared.body.parameters.v4_prompt;
				this.tokens?.update({
					model: prepared.request.model,
					prompt: prepared.body.input,
					characters: v4 ? v4.caption.char_captions.map((c) => c.char_caption) : [],
					negative: String(prepared.body.parameters.negative_prompt ?? ""),
					raw: [
						g.prompt,
						g.negativePrompt,
						...g.characters.map((c) => c.prompt)
					].join("\n")
				});
			}
			this.tokens?.element.classList.toggle("naist-hidden", !settings().promptTools.counter);
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
			await openInspector(this.pipeline.previewFree(settings().generation.prompt));
		} catch (error) {
			this.showError(error instanceof NaiError ? error : toNaiError(error));
		}
	}
	/** The one NovelAI queue (v0.13.1): what is drawn now, how many wait, "Clear the queue". */
	renderQueue() {
		const { running, waiting } = this.controller.queue.snapshot();
		const parts = [];
		if (running) {
			parts.push(t("naist.queue.running", { kind: t(`naist.queue.kind.${running.kind}`) }));
			if (running.retryIn !== null) parts.push(t("naist.queue.retryIn", { seconds: running.retryIn }));
		}
		if (waiting.length) parts.push(t("naist.queue.waitingCount", { count: waiting.length }));
		$id(this.root, "naist_queue").classList.toggle("naist-hidden", !parts.length);
		$id(this.root, "naist_queue_text").textContent = parts.join(" · ");
		$id(this.root, "naist_queue_clear").classList.toggle("naist-hidden", !waiting.length);
		if (this.queueTimer) clearTimeout(this.queueTimer);
		this.queueTimer = running?.retryIn ? setTimeout(() => this.renderQueue(), 1e3) : null;
	}
	async generate() {
		if (this.generating) return;
		const prompt = settings().generation.prompt;
		if (!prompt.trim()) {
			this.showInfo(t("naist.panel.emptyPrompt"));
			return;
		}
		this.showInfo(t(this.controller.queue.busy ? "naist.panel.queued" : "naist.panel.generating"));
		this.generating = true;
		$id(this.root, "naist_generate").classList.add("disabled");
		try {
			const result = await this.pipeline.generatePicture({
				initiator: "panel",
				trigger: prompt,
				mode: MODE.FREE
			});
			this.showInfo(result ? t("naist.result.posted", { count: 1 }) : t("naist.result.cancelled"));
		} catch (error) {
			const naiError = error instanceof NaiError ? error : toNaiError(error);
			if (naiError.code === "aborted") {
				this.showInfo(t("naist.result.cancelled"));
				return;
			}
			log.warn("generation failed", naiError.code, naiError.status ?? "");
			this.showError(naiError);
		} finally {
			this.generating = false;
			$id(this.root, "naist_generate").classList.remove("disabled");
		}
	}
};
//#endregion
//#region src/ui/progress.ts
function mimeOf(base64) {
	if (base64.startsWith("/9j/")) return "image/jpeg";
	if (base64.startsWith("UklGR")) return "image/webp";
	return "image/png";
}
function createProgressUi(queue = generationQueue) {
	let root = null;
	let timer = null;
	let queueTimer = null;
	let steps = 0;
	let started = 0;
	const elements = () => {
		if (!root) {
			root = document.createElement("div");
			root.id = "naist_progress";
			root.className = "naist-progress naist-hidden";
			root.innerHTML = `
                <div class="naist-progress-head"><b></b><span class="naist-progress-step"></span></div>
                <div class="naist-progress-bar"><span></span></div>
                <div class="naist-progress-queue naist-hint"></div>
                <img class="naist-progress-preview naist-hidden" alt="">`;
			document.body.append(root);
		}
		return {
			root,
			queue: root.querySelector(".naist-progress-queue"),
			title: root.querySelector("b"),
			step: root.querySelector(".naist-progress-step"),
			bar: root.querySelector(".naist-progress-bar span"),
			preview: root.querySelector(".naist-progress-preview")
		};
	};
	const setBar = (fraction) => {
		elements().bar.style.width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
	};
	/** Under the bar: a retry of a busy NovelAI, how many requests wait behind this one (v0.13.1). */
	const showQueue = () => {
		if (!root) return;
		const { running, waiting } = queue.snapshot();
		const parts = [];
		if (running?.retryIn !== null && running?.retryIn !== void 0) parts.push(t("naist.queue.retryIn", { seconds: running.retryIn }));
		if (waiting.length) parts.push(t("naist.queue.waitingCount", { count: waiting.length }));
		elements().queue.textContent = parts.join(" · ");
		if (queueTimer) clearTimeout(queueTimer);
		queueTimer = running?.retryIn ? setTimeout(showQueue, 1e3) : null;
	};
	queue.subscribe(showQueue);
	return {
		start({ steps: total, streaming, transport }) {
			const el = elements();
			steps = Math.max(1, total);
			started = Date.now();
			el.title.textContent = t(streaming ? "naist.progress.streaming" : "naist.progress.estimating");
			el.step.textContent = "";
			el.preview.classList.add("naist-hidden");
			el.preview.removeAttribute("src");
			el.root.classList.remove("naist-hidden");
			showQueue();
			setBar(0);
			if (timer) clearInterval(timer);
			timer = null;
			if (!streaming) {
				const expected = 1500 + steps * 120;
				timer = setInterval(() => setBar(Math.min(.95, (Date.now() - started) / expected)), 200);
				const s = settings().stream;
				if (transport !== "plugin" && !s.hintShown) {
					s.hintShown = true;
					saveSettings();
					toastr.info(t("naist.progress.pluginHint"), t("naist.panel.title"), { timeOut: 1e4 });
				}
			}
		},
		frame(frame) {
			const el = elements();
			if (frame.kind === "intermediate") {
				if (frame.step !== void 0) {
					el.step.textContent = t("naist.progress.step", {
						step: frame.step + 1,
						steps
					});
					setBar((frame.step + 1) / steps);
				}
				if (frame.image) {
					el.preview.src = `data:${mimeOf(frame.image)};base64,${frame.image}`;
					el.preview.classList.remove("naist-hidden");
				}
			} else if (frame.kind === "final") setBar(1);
		},
		end() {
			if (timer) clearInterval(timer);
			timer = null;
			setBar(1);
			const el = elements();
			setTimeout(() => el.root.classList.add("naist-hidden"), 400);
		}
	};
}
//#endregion
//#region src/ui/panel/pipeline-ui.ts
async function refine(prompt, options) {
	const c = ctx();
	const root = document.createElement("div");
	root.className = "naist-refine";
	root.innerHTML = `
        <h3 data-i18n="naist.refine.title"></h3>
        <div class="naist-hint" data-i18n="naist.refine.hint"></div>
        <textarea class="text_pole naist-refine-prompt" rows="8"></textarea>
        ${options.negative !== void 0 ? "<label data-i18n=\"naist.refine.negative\"></label><textarea class=\"text_pole naist-refine-negative\" rows=\"4\"></textarea>" : ""}
        ${options.resolution ? "<label class=\"checkbox_label\"><input type=\"checkbox\" class=\"naist-refine-resolution\" checked><span data-i18n=\"naist.refine.resolution\"></span></label>" : ""}`;
	localize(root);
	const promptArea = root.querySelector(".naist-refine-prompt");
	const negativeArea = root.querySelector(".naist-refine-negative");
	const resolution = root.querySelector(".naist-refine-resolution");
	if (promptArea) promptArea.value = prompt.trim();
	if (negativeArea) negativeArea.value = options.negative ?? "";
	const resolutionLabel = resolution?.nextElementSibling;
	if (resolutionLabel) resolutionLabel.textContent = t("naist.refine.resolution", { resolution: options.resolution ?? "" });
	if (await c.callGenericPopup(root, c.POPUP_TYPE.CONFIRM, "", {
		okButton: t("naist.refine.continue"),
		cancelButton: t("naist.inspector.cancel"),
		wide: true
	}) !== c.POPUP_RESULT.AFFIRMATIVE || !promptArea?.value.trim()) return null;
	return {
		prompt: promptArea.value,
		negative: negativeArea ? negativeArea.value.trim() : void 0,
		useSavedResolution: resolution ? resolution.checked : false
	};
}
function createPipelineUi(balance) {
	return {
		refine,
		confirmCost: async (prepared) => {
			const c = ctx();
			return await c.callGenericPopup(t("naist.cost.confirm", {
				total: prepared.cost.total,
				balance: balance()
			}), c.POPUP_TYPE.CONFIRM) === c.POPUP_RESULT.AFFIRMATIVE;
		},
		inspect: (prepared) => openInspector(prepared, { confirmSend: true }),
		progress: createProgressUi()
	};
}
//#endregion
//#region src/index.ts
/** SECRET_KEYS.NOVEL in public/scripts/secrets.js. */
var NOVEL_SECRET_KEY = "api_key_novel";
var controller = null;
function mountPanel(studio, pipeline) {
	const container = document.querySelector("#extensions_settings2") ?? document.querySelector("#extensions_settings");
	if (!container) {
		log.error("extensions settings container not found");
		return;
	}
	if (document.querySelector("#naist_panel")) return;
	const onSettingChange = (path) => {
		onMarkerSettingChange(path);
		if (path.startsWith("des.")) desIntegration()?.settingsChanged();
		if (path.startsWith("chat.functionTool") || path.startsWith("chat.toolCooldown") || path.startsWith("prompts.templates")) syncFunctionTool(pipeline, ownsCompatSurface());
	};
	new Panel(studio, pipeline, onSettingChange, {
		openGallery: () => void openGalleryWindow(pipeline),
		setVisibility: (state) => setInlineVisibility(state),
		chatHidden: () => inlineRenderer()?.isChatHidden() ?? false
	}).mount(container);
}
/** hooks.activate */
async function onActivate() {
	if (controller) return;
	const c = ctx();
	setTranslator((text, key) => c.translate(text, key));
	await loadSettings();
	const studio = new StudioController({
		fetch: (input, init) => fetch(input, init),
		headers: () => requestHeaders()
	});
	controller = studio;
	const pipeline = new Pipeline(studio, createPipelineUi(() => studio.state.account.anlas));
	pipeline.onGenerated(recordGeneration);
	mountPanel(studio, pipeline);
	setupIntegrations(pipeline);
	const inline = new InlineImages(pipeline);
	setupInline(pipeline, inline);
	const scenes = new SceneService(pipeline, inline);
	setupScenes(pipeline, scenes);
	setupTools(pipeline, inline);
	setupPhase6(pipeline, scenes);
	setupDes(setupMarkers(pipeline, inline, scenes));
	new AutoGenerator(studio, pipeline).attach();
	setupQualityGates();
	setupGenerationQueue();
	installPublicApi({ backgrounds: new BackgroundService(pipeline) });
	studio.refreshTransport();
	for (const name of [
		"SECRET_WRITTEN",
		"SECRET_DELETED",
		"SECRET_ROTATED"
	]) {
		const event = c.eventTypes[name];
		if (!event) continue;
		c.eventSource.on(event, (key) => {
			if (key === NOVEL_SECRET_KEY) studio.refreshTransport();
		});
	}
	if (needsMigration()) c.eventSource.on(c.eventTypes.APP_READY ?? "app_ready", () => {
		runMigration().then((report) => showReport(report)).catch((error) => log.warn("migration failed", error));
	});
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
	if (controller) installPublicApi();
	log.info("enabled");
}
/** hooks.disable */
async function onDisable() {
	uninstallPublicApi();
	stopPlaceFollowing();
	log.info("disabled");
}
/** hooks.delete */
async function onDelete() {
	uninstallPublicApi();
	stopPlaceFollowing();
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