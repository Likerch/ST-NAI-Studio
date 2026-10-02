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
* Imports a SillyTavern module by URL for the few APIs missing from getContext() (TZ rule 3 allows
* direct imports only then). The URL is kept opaque to the bundler.
*/
async function importHost(path) {
	return await import(
		/* @vite-ignore */
		new URL(path, window.location.origin).href
);
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
	"naist.prompts.prefixHint": "Put {prompt} into the prefix to place the scene prompt inside it. SillyTavern macros work. Undesired content is on the Generate tab.",
	"naist.prompts.styles": "Styles",
	"naist.prompts.styleNone": "— no style —",
	"naist.prompts.styleSave": "Save prefix, suffix and undesired content as a style",
	"naist.prompts.styleRename": "Rename style",
	"naist.prompts.styleDelete": "Delete style",
	"naist.prompts.stylesHint": "Choosing a style copies its prefix, suffix and undesired content into the fields.",
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
	"naist.refine.continue": "Continue"
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
		imageFormat: "webp",
		useCoords: false,
		characters: []
	};
}
function defaultSettings() {
	return {
		schemaVersion: 2,
		transport: { mode: "auto" },
		generation: defaultGeneration(),
		prompts: {
			prefix: "",
			suffix: "",
			templates: {},
			styles: [],
			activeStyle: "",
			characterPrompts: {}
		},
		modes: {
			refine: false,
			multimodal: false,
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
		inspector: { openBeforeSend: false },
		rawOverride: {
			enabled: false,
			json: ""
		},
		log: { level: "info" }
	};
}
function isObject$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Ordered migrations. Each one is a separate function with its own test (TZ "Versioning").
* v1: first schema. Settings saved before versioning (no schemaVersion) start from here.
* v2: `output.hiddenFromPrompt` became the per-initiator visibility map `chat.visibility`.
*/
var MIGRATIONS = [{
	to: 1,
	migrate(settings) {
		return {
			...settings,
			schemaVersion: 1
		};
	}
}, {
	to: 2,
	migrate(settings) {
		const { output, ...rest } = settings;
		const next = {
			...rest,
			schemaVersion: 2
		};
		if (isObject$1(output) && output.hiddenFromPrompt === false) {
			const chat = isObject$1(rest.chat) ? rest.chat : {};
			next.chat = {
				...chat,
				visibility: {
					...isObject$1(chat.visibility) ? chat.visibility : {},
					panel: true
				}
			};
		}
		return next;
	}
}];
/** Applies pending migrations, then fills missing keys from defaults (lodash.merge in the host). */
function migrateAndFill(stored, merge) {
	let raw = isObject$1(stored) ? structuredClone(stored) : {};
	const fromVersion = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
	if (fromVersion > 2) return {
		settings: merge(defaultSettings(), raw),
		fromVersion,
		migrated: false
	};
	for (const migration of MIGRATIONS) if (migration.to > fromVersion) raw = migration.migrate(raw);
	const settings = merge(defaultSettings(), raw);
	const generation = isObject$1(raw.generation) ? raw.generation : {};
	settings.generation.characters = Array.isArray(generation.characters) ? generation.characters : [];
	const prompts = isObject$1(raw.prompts) ? raw.prompts : {};
	settings.prompts.styles = Array.isArray(prompts.styles) ? prompts.styles : [];
	const takeover = isObject$1(raw.takeover) ? raw.takeover : {};
	settings.takeover.migrationReport = Array.isArray(takeover.migrationReport) ? takeover.migrationReport : [];
	settings.schemaVersion = 2;
	return {
		settings,
		fromVersion,
		migrated: fromVersion !== 2
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
* builder: prefix (+ character prefix) with `{prompt}` support, then suffix; negatives combined.
*/
function assemblePrompt(input) {
	const prompt = combinePrefixes(combinePrefixes(input.useCharacterPrefix ? combinePrefixes(input.prefix, input.characterPositive) : input.prefix, input.scene, "{prompt}"), input.suffix);
	const commonNegative = input.useCharacterPrefix ? combinePrefixes(input.negative, input.characterNegative) : input.negative;
	return {
		prompt,
		negative: combinePrefixes(input.additionalNegative, commonNegative)
	};
}
//#endregion
//#region src/domain/autogen.ts
function list(text) {
	return text.split(",").map((s) => s.trim()).filter(Boolean);
}
function escapeRegExp(text) {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function matchesKeyword(message, keywords) {
	return list(keywords).some((word) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(word)}($|[^\\p{L}\\p{N}])`, "iu").test(message));
}
function isSceneChange(message, markers) {
	return list(markers).some((marker) => {
		return (/^[\p{L}\p{N}]/u.test(marker) ? new RegExp(`(^|\\n)\\s*${escapeRegExp(marker)}\\b`, "iu") : new RegExp(escapeRegExp(marker))).test(message);
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
//#region src/features/auto/auto-generation.ts
var SKIPPED_TYPES = /* @__PURE__ */ new Set([
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
		if (!rules.enabled || SKIPPED_TYPES.has(type)) return;
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
		if (this.controller.state.busy) {
			log.info("auto generation skipped: another generation is running");
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
				skipCostConfirm: true
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
function prepareGeneration({ settings, transport, account, overrides, random }) {
	const generation = {
		...settings.generation,
		...overrides
	};
	let request = requestFromSettings(generation, resolveSeed(generation.seed, random));
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
	prepare(overrides) {
		const transport = this.state.selection?.transport;
		if (!transport) throw new NaiError("plugin-unavailable", "install-plugin");
		try {
			return prepareGeneration({
				settings: settings(),
				transport,
				account: this.state.account,
				overrides
			});
		} catch (error) {
			throw toNaiError(error);
		}
	}
	/** Sends a prepared request. One generation at a time; blocked requests never leave. */
	async send(prepared, signal) {
		const transport = this.state.selection?.transport;
		if (!transport) throw new NaiError("plugin-unavailable", "install-plugin");
		if (this.state.busy) throw new NaiError("busy", "none");
		this.abort = new AbortController();
		const onAbort = () => this.abort?.abort();
		signal?.addEventListener("abort", onAbort, { once: true });
		this.state.busy = true;
		this.emit();
		try {
			return await sendPrepared(prepared, transport, this.state.account, this.abort.signal);
		} finally {
			signal?.removeEventListener("abort", onAbort);
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
//#region src/features/generation/output.ts
function safeName(text) {
	return text.replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "nai";
}
async function saveImages(images, folder) {
	const c = ctx();
	const saved = [];
	for (const image of images) {
		const format = image.mime === "image/webp" ? "webp" : "png";
		const filename = `${folder ? `${safeName(folder)}_` : ""}${c.humanizedDateTime()}_${image.seed ?? image.index}`;
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
			correlationId: meta.correlationId
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
var Pipeline = class {
	controller;
	ui;
	constructor(controller, ui) {
		this.controller = controller;
		this.ui = ui;
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
		const quietPrompt = quietPromptFor(mode, trigger, templates());
		if (isMultimodal(mode)) {
			const response = await fetch(await avatarUrl(mode));
			if (!response.ok) throw new NaiError("multimodal-failed", "none");
			const base64 = await blobToBase64(await response.blob());
			const caption = await (await importHost("/scripts/extensions/shared.js")).getMultimodalCaption(base64, quietPrompt);
			if (!caption) throw new NaiError("multimodal-failed", "none");
			return caption;
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
		const assembled = this.assemble(MODE.FREE, trigger, "", false);
		return this.controller.prepare(assembled.overrides);
	}
	assemble(mode, scene, additionalNegative, isSwipe, overrides = {}, forcedSize) {
		const s = settings();
		const c = ctx();
		const g = {
			...s.generation,
			...overrides.generation
		};
		const caps = getCapabilities(isModelId(g.model) ? g.model : DEFAULT_MODEL);
		const dims = forcedSize ?? modeDimensions(mode, g.width, g.height, overrides.snap ?? s.modes.snap, caps.sizePresets);
		let negativeExtra = additionalNegative;
		let sceneText = scene;
		if (mode === MODE.FREE && !isSwipe) {
			const free = applyFreeModeCharacter(scene, lastSpeakerPrompt());
			sceneText = free.prompt;
			if (free.negative) negativeExtra = combinePrefixes(negativeExtra, free.negative);
		}
		const character = currentCharacterPrompt();
		const assembled = assemblePrompt({
			scene: sceneText,
			prefix: s.prompts.prefix,
			suffix: s.prompts.suffix,
			negative: g.negativePrompt,
			characterPositive: character.positive,
			characterNegative: character.negative,
			additionalNegative: negativeExtra,
			useCharacterPrefix: usesCharacterPrefix(mode, isSwipe, soloCharacterIndex() !== void 0)
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
	async generatePicture(req) {
		const s = settings();
		const c = ctx();
		const o = req.overrides ?? {};
		const trigger = req.trigger.trim();
		if (!trigger && !req.swipe) return null;
		const refine = o.edit ?? s.modes.refine;
		const minimal = o.minimalProcessing ?? s.modes.minimalProcessing;
		let mode;
		let scene;
		let additionalNegative = o.negative ?? "";
		let forcedSize;
		const isSwipe = Boolean(req.swipe);
		if (req.swipe) {
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
		const assembled = this.assemble(mode, scene, additionalNegative, isSwipe, o, forcedSize);
		if (isSwipe && assembled.overrides.seed === void 0 && s.generation.seed >= 0) assembled.overrides.seed = -1;
		const prepared = this.controller.prepare(assembled.overrides);
		if (req.maxCost !== void 0 && prepared.cost.total > req.maxCost) throw new NaiError("free-only-blocked", "none", { cost: prepared.cost.total });
		if (s.inspector.openBeforeSend) {
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
			const result = await this.controller.send(prepared, abort.signal);
			const folder = o.gallery === false ? "" : imageFolder();
			const saved = await saveImages(result.images, folder);
			const first = saved[0];
			if (!first) throw new NaiError("invalid-response", "none", { preview: "" });
			const generation = o.generation ?? {};
			const meta = {
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
			if (ctx().getCurrentChatId() !== chatId) {
				toastr.warning(t("naist.result.chatChanged", { count: saved.length }));
				return {
					path: first.path,
					messageId: null,
					cost: prepared.cost.total
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
						text: messageText(templates()[String(MODE.MESSAGE)] ?? "{{prompt}}", assembled.sceneText)
					});
				}
			}
			log.info("picture", req.initiator, `mode ${mode}`, prepared.body.model, `cost ${prepared.cost.total}`);
			return {
				path: first.path,
				messageId,
				cost: prepared.cost.total
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
function imagineCallback(pipeline) {
	return async (args, value) => {
		const parsed = parseCommandArgs(args);
		if (parsed.ignored.length) log.info("ignored (not applicable to NovelAI):", parsed.ignored.join(", "));
		if (parsed.invalid.length) toastr.warning(t("naist.command.invalidArgs", { args: parsed.invalid.join(", ") }));
		const controller = new AbortController();
		args._abortController?.addEventListener?.("abort", () => controller.abort());
		try {
			return (await pipeline.generatePicture({
				initiator: "command",
				trigger: String(value ?? ""),
				overrides: parsed.overrides,
				signal: controller.signal
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
		prompts.activeStyle = style.name;
		prompts.prefix = style.prefix;
		prompts.suffix = style.suffix;
		settings().generation.negativePrompt = style.negative;
		saveSettings();
		notifyExternalChange();
		return style.name;
	};
}
function registerCommands(pipeline, compat) {
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
//#region src/integration/interceptor.ts
var INTERCEPTOR_NAME = "NAIST_ProcessTriggers";
function installInterceptor(pipeline) {
	const interceptor = (chat, _contextSize, abort, type) => {
		const s = settings();
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
//#region src/integration/tools.ts
var TOOL_NAME = "GenerateImage";
var lastCall = 0;
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
		description: "Generate an image from a given text prompt. Use when a user asks to generate an image, imagine a concept or an item, send a picture of a scene, a selfie, etc.",
		parameters: {
			$schema: "http://json-schema.org/draft-04/schema#",
			type: "object",
			properties: { prompt: {
				type: "string",
				description
			} },
			required: ["prompt"]
		},
		formatMessage: () => t("naist.tool.running"),
		action: async (args) => {
			const prompt = typeof args?.prompt === "string" ? args.prompt : "";
			if (!prompt) throw new Error("Missing prompt");
			const cooldown = settings().chat.toolCooldownSeconds * 1e3;
			if (Date.now() - lastCall < cooldown) throw new Error(`Image generation is on cooldown, try again in ${Math.ceil((cooldown - (Date.now() - lastCall)) / 1e3)} s.`);
			lastCall = Date.now();
			const result = await pipeline.generatePicture({
				initiator: "tool",
				trigger: prompt
			});
			return result ? encodeURI(result.path) : "";
		}
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
		registerCommands(pipeline, compat);
		if (compat) registerMacros();
		syncFunctionTool(pipeline, compat);
		log.info(compat ? "took over /sd, /imagine, macros and the GenerateImage tool" : "built-in Image Generation is active: only /nai is registered");
	});
}
//#endregion
//#region src/ui/templates/character-row.html?raw
var character_row_default = "<div class=\"naist-character\" data-index=\"{{index}}\">\n    <div class=\"naist-row\">\n        <label class=\"checkbox_label\"><input type=\"checkbox\" class=\"naist-char-enabled\" {{#if enabled}}checked{{/if}}><span data-i18n=\"naist.character.enabled\"></span></label>\n        <span class=\"naist-muted\">#{{number}}</span>\n        <div class=\"menu_button fa-solid fa-trash-can naist-char-remove\" data-i18n=\"[title]naist.character.remove\"></div>\n    </div>\n    <textarea class=\"text_pole textarea_compact naist-char-prompt\" rows=\"2\" data-i18n=\"[placeholder]naist.character.prompt\">{{prompt}}</textarea>\n    <input type=\"text\" class=\"text_pole naist-char-negative\" value=\"{{negative}}\" data-i18n=\"[placeholder]naist.character.negative\">\n    <div class=\"naist-grid2 naist-char-position\">\n        <label><span data-i18n=\"naist.character.x\"></span> <input type=\"number\" class=\"text_pole naist-char-x\" min=\"0\" max=\"1\" step=\"0.1\" value=\"{{x}}\"></label>\n        <label><span data-i18n=\"naist.character.y\"></span> <input type=\"number\" class=\"text_pole naist-char-y\" min=\"0\" max=\"1\" step=\"0.1\" value=\"{{y}}\"></label>\n    </div>\n</div>\n";
//#endregion
//#region src/ui/templates/panel.html?raw
var panel_default = "<div class=\"naist-panel\" id=\"naist_panel\">\n    <div class=\"inline-drawer\">\n        <div class=\"inline-drawer-toggle inline-drawer-header\">\n            <b data-i18n=\"naist.panel.title\"></b>\n            <div class=\"inline-drawer-icon fa-solid fa-circle-chevron-down down\"></div>\n        </div>\n        <div class=\"inline-drawer-content\">\n            <div class=\"naist-content\">\n                <div class=\"naist-row naist-status\">\n                    <label for=\"naist_transport_mode\" data-i18n=\"naist.panel.transport\"></label>\n                    <select id=\"naist_transport_mode\" class=\"text_pole naist-grow\">\n                        <option value=\"auto\" data-i18n=\"naist.transport.auto\"></option>\n                        <option value=\"plugin\" data-i18n=\"naist.transport.plugin\"></option>\n                        <option value=\"native\" data-i18n=\"naist.transport.native\"></option>\n                    </select>\n                    <div\n                        id=\"naist_refresh\"\n                        class=\"menu_button fa-solid fa-rotate\"\n                        data-i18n=\"[title]naist.panel.refresh\"\n                    ></div>\n                </div>\n                <div id=\"naist_transport_badge\" class=\"naist-badge\"></div>\n                <div id=\"naist_account\" class=\"naist-account\"></div>\n\n                <div id=\"naist_takeover_banner\" class=\"naist-banner naist-hidden\">\n                    <span data-i18n=\"naist.takeover.banner\"></span>\n                    <div id=\"naist_banner_open\" class=\"menu_button\" data-i18n=\"naist.takeover.bannerAction\"></div>\n                </div>\n\n                <div class=\"naist-tabs\" role=\"tablist\">\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"generate\"\n                        data-i18n=\"naist.tab.generate\"\n                    ></div>\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"prompts\"\n                        data-i18n=\"naist.tab.prompts\"\n                    ></div>\n                    <div class=\"naist-tab menu_button\" role=\"tab\" data-tab=\"chat\" data-i18n=\"naist.tab.chat\"></div>\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"takeover\"\n                        data-i18n=\"naist.tab.takeover\"\n                    ></div>\n                </div>\n\n                <div class=\"naist-tabpanel\" data-tabpanel=\"generate\">\n                    <label for=\"naist_model\" data-i18n=\"naist.panel.model\"></label>\n                    <select id=\"naist_model\" class=\"text_pole\">\n                        {{#each models}}\n                        <option value=\"{{id}}\" data-i18n=\"{{nameKey}}\"></option>\n                        {{/each}}\n                    </select>\n\n                    <label for=\"naist_prompt\" data-i18n=\"naist.panel.prompt\"></label>\n                    <textarea\n                        id=\"naist_prompt\"\n                        class=\"text_pole textarea_compact\"\n                        rows=\"4\"\n                        data-i18n=\"[placeholder]naist.panel.promptPlaceholder\"\n                    ></textarea>\n\n                    <label for=\"naist_negative\" data-i18n=\"naist.panel.negative\"></label>\n                    <textarea id=\"naist_negative\" class=\"text_pole textarea_compact\" rows=\"2\"></textarea>\n\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_uc_preset\" data-i18n=\"naist.panel.ucPreset\"></label>\n                            <select id=\"naist_uc_preset\" class=\"text_pole\"></select>\n                        </div>\n                        <div>\n                            <label for=\"naist_quality\" data-i18n=\"naist.panel.quality\"></label>\n                            <select id=\"naist_quality\" class=\"text_pole\"></select>\n                        </div>\n                    </div>\n\n                    <div\n                        id=\"naist_characters_block\"\n                        class=\"naist-block\"\n                        data-cap=\"characters\"\n                        data-feature=\"characters\"\n                    >\n                        <div class=\"naist-row\">\n                            <b data-i18n=\"naist.panel.characters\"></b>\n                            <span id=\"naist_characters_count\" class=\"naist-muted\"></span>\n                            <div\n                                id=\"naist_add_character\"\n                                class=\"menu_button fa-solid fa-user-plus\"\n                                data-i18n=\"[title]naist.panel.addCharacter\"\n                            ></div>\n                        </div>\n                        <label class=\"checkbox_label\"\n                            ><input type=\"checkbox\" id=\"naist_use_coords\" /><span\n                                data-i18n=\"naist.panel.useCoords\"\n                            ></span\n                        ></label>\n                        <div id=\"naist_characters\"></div>\n                        <div class=\"naist-feature-hint\" data-hint-for=\"characters\"></div>\n                    </div>\n\n                    <label for=\"naist_size_preset\" data-i18n=\"naist.panel.size\"></label>\n                    <div class=\"naist-grid3\">\n                        <select id=\"naist_size_preset\" class=\"text_pole\"></select>\n                        <input\n                            id=\"naist_width\"\n                            type=\"number\"\n                            class=\"text_pole\"\n                            step=\"64\"\n                            min=\"64\"\n                            data-i18n=\"[title]naist.panel.width\"\n                        />\n                        <input\n                            id=\"naist_height\"\n                            type=\"number\"\n                            class=\"text_pole\"\n                            step=\"64\"\n                            min=\"64\"\n                            data-i18n=\"[title]naist.panel.height\"\n                        />\n                    </div>\n\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_sampler\" data-i18n=\"naist.panel.sampler\"></label>\n                            <select id=\"naist_sampler\" class=\"text_pole\"></select>\n                        </div>\n                        <div data-cap=\"noiseSchedule\">\n                            <label for=\"naist_schedule\" data-i18n=\"naist.panel.schedule\"></label>\n                            <select id=\"naist_schedule\" class=\"text_pole\"></select>\n                        </div>\n                    </div>\n                    <div class=\"naist-grid3\">\n                        <div>\n                            <label for=\"naist_steps\" data-i18n=\"naist.panel.steps\"></label>\n                            <input id=\"naist_steps\" type=\"number\" min=\"1\" max=\"50\" class=\"text_pole\" />\n                        </div>\n                        <div>\n                            <label for=\"naist_scale\" data-i18n=\"naist.panel.scale\"></label>\n                            <input id=\"naist_scale\" type=\"number\" step=\"0.1\" min=\"0\" max=\"10\" class=\"text_pole\" />\n                        </div>\n                        <div data-feature=\"cfgRescale\">\n                            <label for=\"naist_cfg_rescale\" data-i18n=\"naist.panel.cfgRescale\"></label>\n                            <input id=\"naist_cfg_rescale\" type=\"number\" step=\"0.02\" min=\"0\" max=\"1\" class=\"text_pole\" />\n                        </div>\n                    </div>\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_seed\" data-i18n=\"naist.panel.seed\"></label>\n                            <input\n                                id=\"naist_seed\"\n                                type=\"number\"\n                                min=\"-1\"\n                                class=\"text_pole\"\n                                data-i18n=\"[title]naist.panel.seedHint\"\n                            />\n                        </div>\n                        <div data-feature=\"multipleSamples\">\n                            <label for=\"naist_samples\" data-i18n=\"naist.panel.samples\"></label>\n                            <input id=\"naist_samples\" type=\"number\" min=\"1\" max=\"8\" class=\"text_pole\" />\n                        </div>\n                    </div>\n                    <div class=\"naist-feature-hint\" data-hint-for=\"multipleSamples\"></div>\n\n                    <div class=\"naist-flags\">\n                        <label class=\"checkbox_label\" data-cap=\"smea\"\n                            ><input type=\"checkbox\" id=\"naist_smea\" /><span data-i18n=\"naist.panel.smea\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"smeaDyn\"\n                            ><input type=\"checkbox\" id=\"naist_smea_dyn\" /><span data-i18n=\"naist.panel.smeaDyn\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"autoSmea\"\n                            ><input type=\"checkbox\" id=\"naist_auto_smea\" /><span data-i18n=\"naist.panel.autoSmea\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"decrisper\"\n                            ><input type=\"checkbox\" id=\"naist_decrisper\" /><span\n                                data-i18n=\"naist.panel.decrisper\"\n                            ></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"varietyBoost\"\n                            ><input type=\"checkbox\" id=\"naist_variety\" /><span data-i18n=\"naist.panel.variety\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"transparency\" data-feature=\"transparency\"\n                            ><input type=\"checkbox\" id=\"naist_transparent\" /><span\n                                data-i18n=\"naist.panel.transparent\"\n                            ></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"legacyUc\"\n                            ><input type=\"checkbox\" id=\"naist_legacy_uc\" /><span data-i18n=\"naist.panel.legacyUc\"></span\n                        ></label>\n                    </div>\n                    <div class=\"naist-feature-hint\" data-hint-for=\"transparency\"></div>\n\n                    <hr />\n                    <label class=\"checkbox_label\"\n                        ><input type=\"checkbox\" id=\"naist_free_only\" /><span data-i18n=\"naist.panel.freeOnly\"></span\n                    ></label>\n                    <div id=\"naist_cost\" class=\"naist-cost\"></div>\n                    <div id=\"naist_lost\" class=\"naist-hint\"></div>\n\n                    <details class=\"naist-override\">\n                        <summary data-i18n=\"naist.panel.override\"></summary>\n                        <div class=\"naist-warning\" data-i18n=\"naist.panel.overrideWarning\"></div>\n                        <label class=\"checkbox_label\"\n                            ><input type=\"checkbox\" id=\"naist_override_enabled\" /><span\n                                data-i18n=\"naist.panel.overrideEnable\"\n                            ></span\n                        ></label>\n                        <textarea\n                            id=\"naist_override_json\"\n                            class=\"text_pole textarea_compact monospace\"\n                            rows=\"4\"\n                        ></textarea>\n                    </details>\n                </div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"prompts\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"chat\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"takeover\"></div>\n\n                <label class=\"checkbox_label\"\n                    ><input type=\"checkbox\" id=\"naist_inspect_before\" /><span\n                        data-i18n=\"naist.panel.inspectBeforeSend\"\n                    ></span\n                ></label>\n                <div class=\"naist-row naist-actions\">\n                    <div id=\"naist_inspect\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-magnifying-glass\"></i><span data-i18n=\"naist.panel.inspect\"></span>\n                    </div>\n                    <div id=\"naist_generate\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-paintbrush\"></i><span data-i18n=\"naist.panel.generate\"></span>\n                    </div>\n                    <div id=\"naist_cancel\" class=\"menu_button menu_button_icon naist-hidden\">\n                        <i class=\"fa-solid fa-stop\"></i><span data-i18n=\"naist.panel.cancel\"></span>\n                    </div>\n                </div>\n                <div id=\"naist_message\" class=\"naist-message\"></div>\n            </div>\n        </div>\n    </div>\n</div>\n";
//#endregion
//#region src/ui/components/json-view.ts
var BASE64_MIN = 256;
function escapeHtml$2(text) {
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
		else html = `<span class="naist-json-${value === null ? "null" : typeof value}">${escapeHtml$2(JSON.stringify(value))}</span>`;
	} else if (Array.isArray(value)) {
		if (value.length === 0) html = "[]";
		else html = `[\n${value.map((item, i) => `${pad}  ${renderValue(item, `${path}[${i}]`, highlight, indent + 1)}`).join(",\n")}\n${pad}]`;
	} else {
		const entries = Object.entries(value);
		if (entries.length === 0) html = "{}";
		else html = `{\n${entries.map(([key, item]) => {
			const childPath = path ? `${path}.${key}` : key;
			return `${pad}  <span class="naist-json-key">${escapeHtml$2(JSON.stringify(key))}</span>: ${renderValue(item, childPath, highlight, indent + 1)}`;
		}).join(",\n")}\n${pad}}`;
	}
	return highlight.has(path) ? `<span class="naist-json-override">${html}</span>` : html;
}
function renderJson(value, highlightPaths = []) {
	return `<pre class="naist-json">${renderValue(value, "", new Set(highlightPaths), 0)}</pre>`;
}
//#endregion
//#region src/ui/panel/inspector.ts
function escapeHtml$1(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}
function droppedList(prepared) {
	if (prepared.build.dropped.length === 0) return `<p class="naist-muted" data-i18n="naist.inspector.nothingDropped"></p>`;
	return `<ul class="naist-list">${[...prepared.build.dropped].sort((a, b) => Number(b.userSet) - Number(a.userSet)).map((d) => `<li class="${d.userSet ? "naist-dropped-user" : "naist-muted"}"><code>${escapeHtml$1(d.path)}</code> — ${escapeHtml$1(t(`naist.drop.${d.reason}`))}</li>`).join("")}</ul>`;
}
function warningsList(prepared) {
	const warnings = prepared.build.warnings.map((w) => `<li>${escapeHtml$1(t(`naist.warning.${w.code}`, w.params))}</li>`);
	const clamps = prepared.clampChanges.map((c) => `<li>${escapeHtml$1(t(`naist.clamp.${c.kind}`, c))}</li>`);
	const all = [...warnings, ...clamps];
	return all.length ? `<ul class="naist-list">${all.join("")}</ul>` : `<p class="naist-muted" data-i18n="naist.inspector.noWarnings"></p>`;
}
function lostList(prepared) {
	if (prepared.effective.lost.length === 0) return "";
	return `<h4 data-i18n="naist.inspector.lost"></h4><ul class="naist-list naist-dropped-user">${prepared.effective.lost.map((l) => `<li>${escapeHtml$1(t(`naist.lost.${l}`))}</li>`).join("")}</ul>`;
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
            <span>${escapeHtml$1(t(`naist.transport.${prepared.transportId}`))}</span>
            <span class="naist-muted">${escapeHtml$1(prepared.body.model)} · ${escapeHtml$1(prepared.body.action)}</span>
            <span class="naist-cost-inline">${escapeHtml$1(costText)}</span>
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
//#region src/ui/components/dom.ts
/** Handlebars template -> sanitized HTML (SillyTavern's own Handlebars and DOMPurify). */
function render$1(template, data = {}) {
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
function escapeHtml(text) {
	const div = document.createElement("div");
	div.textContent = text;
	return div.innerHTML;
}
//#endregion
//#region src/ui/templates/tab-chat.html?raw
var tab_chat_default = "<div class=\"naist-section\">\n    <b data-i18n=\"naist.chat.visibility\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.chat.visibilityHint\"></div>\n    <div class=\"naist-flags\">\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.panel\" /><span\n                data-i18n=\"naist.initiator.panel\"\n            ></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.command\" /><span\n                data-i18n=\"naist.initiator.command\"\n            ></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.wand\" /><span data-i18n=\"naist.initiator.wand\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.interactive\" /><span\n                data-i18n=\"naist.initiator.interactive\"\n            ></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.tool\" /><span data-i18n=\"naist.initiator.tool\"></span\n        ></label>\n        <label class=\"checkbox_label\"\n            ><input type=\"checkbox\" data-setting=\"chat.visibility.auto\" /><span data-i18n=\"naist.initiator.auto\"></span\n        ></label>\n    </div>\n    <div class=\"naist-grid2\">\n        <div>\n            <label for=\"naist_author\" data-i18n=\"naist.chat.author\"></label>\n            <select id=\"naist_author\" class=\"text_pole\" data-setting=\"chat.author\">\n                <option value=\"character\" data-i18n=\"naist.chat.authorCharacter\"></option>\n                <option value=\"user\" data-i18n=\"naist.chat.authorUser\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_confirm_above\" data-i18n=\"naist.chat.confirmAbove\"></label>\n            <input id=\"naist_confirm_above\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"anlas.confirmAbove\" />\n        </div>\n    </div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"chat.hidePrompt\" /><span data-i18n=\"naist.chat.hidePrompt\"></span\n    ></label>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.chat.prompting\"></b>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.refine\" /><span data-i18n=\"naist.chat.refine\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.multimodal\" /><span data-i18n=\"naist.chat.multimodal\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.freeExtend\" /><span data-i18n=\"naist.chat.freeExtend\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.snap\" /><span data-i18n=\"naist.chat.snap\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"modes.minimalProcessing\" /><span\n            data-i18n=\"naist.chat.minimalProcessing\"\n        ></span\n    ></label>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.chat.llm\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.chat.llmHint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"chat.interactive\" /><span data-i18n=\"naist.chat.interactive\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"chat.functionTool\" /><span data-i18n=\"naist.chat.functionTool\"></span\n    ></label>\n    <label for=\"naist_tool_cooldown\" data-i18n=\"naist.chat.toolCooldown\"></label>\n    <input id=\"naist_tool_cooldown\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"chat.toolCooldownSeconds\" />\n</div>\n\n<div class=\"naist-section\">\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"auto.enabled\" /><b data-i18n=\"naist.auto.enabled\"></b\n    ></label>\n    <div class=\"naist-hint\" data-i18n=\"naist.auto.guardHint\"></div>\n    <label for=\"naist_auto_mode\" data-i18n=\"naist.auto.mode\"></label>\n    <select id=\"naist_auto_mode\" class=\"text_pole\" data-setting=\"auto.mode\" data-type=\"number\"></select>\n    <div class=\"naist-grid2\">\n        <div>\n            <label for=\"naist_auto_every\" data-i18n=\"naist.auto.everyMessages\"></label>\n            <input id=\"naist_auto_every\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"auto.everyMessages\" />\n        </div>\n        <div>\n            <label for=\"naist_auto_cooldown_messages\" data-i18n=\"naist.auto.cooldownMessages\"></label>\n            <input\n                id=\"naist_auto_cooldown_messages\"\n                type=\"number\"\n                min=\"1\"\n                class=\"text_pole\"\n                data-setting=\"auto.cooldownMessages\"\n            />\n        </div>\n    </div>\n    <label for=\"naist_auto_keywords\" data-i18n=\"naist.auto.keywords\"></label>\n    <input id=\"naist_auto_keywords\" type=\"text\" class=\"text_pole\" data-setting=\"auto.keywords\" />\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"auto.sceneChange\" /><span data-i18n=\"naist.auto.sceneChange\"></span\n    ></label>\n    <input\n        id=\"naist_auto_markers\"\n        type=\"text\"\n        class=\"text_pole\"\n        data-setting=\"auto.sceneMarkers\"\n        data-i18n=\"[title]naist.auto.sceneMarkers\"\n    />\n    <label for=\"naist_auto_cooldown_seconds\" data-i18n=\"naist.auto.cooldownSeconds\"></label>\n    <input\n        id=\"naist_auto_cooldown_seconds\"\n        type=\"number\"\n        min=\"0\"\n        class=\"text_pole\"\n        data-setting=\"auto.cooldownSeconds\"\n    />\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" id=\"naist_auto_allow_paid\" data-setting=\"auto.allowPaid\" /><span\n            data-i18n=\"naist.auto.allowPaid\"\n        ></span\n    ></label>\n</div>\n";
//#endregion
//#region src/ui/panel/tab-chat.ts
var ChatTab = class {
	onChange;
	root;
	constructor(onChange) {
		this.onChange = onChange;
	}
	mount(container) {
		container.innerHTML = render$1(tab_chat_default);
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
		this.applyGuards();
	}
	/** Re-reads every control after settings changed outside of this tab. */
	refresh() {
		readFromSettings(this.root);
		this.applyGuards();
	}
	/** Paid auto generation is meaningless while free-only is on: show it disabled. */
	applyGuards() {
		const allowPaid = $id$1(this.root, "naist_auto_allow_paid");
		allowPaid.disabled = settings().anlas.freeOnly;
		allowPaid.closest("label")?.classList.toggle("naist-disabled", allowPaid.disabled);
	}
};
//#endregion
//#region src/ui/templates/tab-prompts.html?raw
var tab_prompts_default = "<div class=\"naist-section\">\n    <label for=\"naist_prefix\" data-i18n=\"naist.prompts.prefix\"></label>\n    <textarea id=\"naist_prefix\" class=\"text_pole textarea_compact\" rows=\"2\" data-setting=\"prompts.prefix\"></textarea>\n    <label for=\"naist_suffix\" data-i18n=\"naist.prompts.suffix\"></label>\n    <textarea id=\"naist_suffix\" class=\"text_pole textarea_compact\" rows=\"2\" data-setting=\"prompts.suffix\"></textarea>\n    <div class=\"naist-hint\" data-i18n=\"naist.prompts.prefixHint\"></div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.prompts.styles\"></b>\n    <div class=\"naist-row\">\n        <select id=\"naist_style\" class=\"text_pole naist-grow\"></select>\n        <div\n            id=\"naist_style_save\"\n            class=\"menu_button fa-solid fa-floppy-disk\"\n            data-i18n=\"[title]naist.prompts.styleSave\"\n        ></div>\n        <div\n            id=\"naist_style_rename\"\n            class=\"menu_button fa-solid fa-pencil\"\n            data-i18n=\"[title]naist.prompts.styleRename\"\n        ></div>\n        <div\n            id=\"naist_style_delete\"\n            class=\"menu_button fa-solid fa-trash-can\"\n            data-i18n=\"[title]naist.prompts.styleDelete\"\n        ></div>\n    </div>\n    <div class=\"naist-hint\" data-i18n=\"naist.prompts.stylesHint\"></div>\n</div>\n\n<div id=\"naist_char_prompt_block\" class=\"naist-section\">\n    <b data-i18n=\"naist.prompts.characterPrompt\"></b> <span id=\"naist_char_prompt_name\" class=\"naist-muted\"></span>\n    <textarea\n        id=\"naist_char_positive\"\n        class=\"text_pole textarea_compact\"\n        rows=\"2\"\n        data-i18n=\"[placeholder]naist.prompts.characterPositive\"\n    ></textarea>\n    <textarea\n        id=\"naist_char_negative\"\n        class=\"text_pole textarea_compact\"\n        rows=\"2\"\n        data-i18n=\"[placeholder]naist.prompts.characterNegative\"\n    ></textarea>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" id=\"naist_char_share\" /><span data-i18n=\"naist.prompts.characterShare\"></span\n    ></label>\n</div>\n<div id=\"naist_char_prompt_none\" class=\"naist-hint naist-hidden\" data-i18n=\"naist.prompts.characterNone\"></div>\n\n<details class=\"naist-section\">\n    <summary data-i18n=\"naist.prompts.templates\"></summary>\n    <div class=\"naist-hint\" data-i18n=\"naist.prompts.templatesHint\"></div>\n    <div id=\"naist_templates\"></div>\n</details>\n";
//#endregion
//#region src/ui/panel/tab-prompts.ts
var PromptsTab = class {
	onChange;
	root;
	constructor(onChange) {
		this.onChange = onChange;
	}
	mount(container) {
		container.innerHTML = render$1(tab_prompts_default);
		this.root = container;
		localize(container);
		bindSettings(container, () => this.onChange());
		this.renderStyles();
		this.renderTemplates();
		this.bindStyles();
		this.bindCharacter();
		this.refreshCharacter();
		const c = ctx();
		c.eventSource.on(c.eventTypes.CHAT_CHANGED ?? "chat_id_changed", () => this.refreshCharacter());
	}
	/** Re-reads every control after settings changed outside of this tab. */
	refresh() {
		readFromSettings(this.root);
		this.renderStyles();
		this.fillTemplates();
		this.refreshCharacter();
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
		fillSelect$1($id$1(this.root, "naist_style"), options, prompts.activeStyle);
	}
	applyStyle(style) {
		const s = settings();
		s.prompts.activeStyle = style?.name ?? "";
		if (style) {
			s.prompts.prefix = style.prefix;
			s.prompts.suffix = style.suffix;
			s.generation.negativePrompt = style.negative;
		}
		saveSettings();
		readFromSettings(this.root);
		this.onChange();
	}
	bindStyles() {
		const c = ctx();
		const select = $id$1(this.root, "naist_style");
		select.addEventListener("change", () => this.applyStyle(settings().prompts.styles.find((s) => s.name === select.value)));
		$id$1(this.root, "naist_style_save").addEventListener("click", async () => {
			const name = await c.callGenericPopup(t("naist.prompts.styleNamePrompt"), c.POPUP_TYPE.INPUT, settings().prompts.activeStyle);
			if (typeof name !== "string" || !name.trim()) return;
			const s = settings();
			const style = {
				name: name.trim(),
				prefix: s.prompts.prefix,
				suffix: s.prompts.suffix,
				negative: s.generation.negativePrompt
			};
			const index = s.prompts.styles.findIndex((x) => x.name === style.name);
			if (index >= 0) s.prompts.styles[index] = style;
			else s.prompts.styles.push(style);
			s.prompts.activeStyle = style.name;
			saveSettings();
			this.renderStyles();
		});
		$id$1(this.root, "naist_style_rename").addEventListener("click", async () => {
			const s = settings();
			const style = s.prompts.styles.find((x) => x.name === s.prompts.activeStyle);
			if (!style) return;
			const name = await c.callGenericPopup(t("naist.prompts.styleNamePrompt"), c.POPUP_TYPE.INPUT, style.name);
			if (typeof name !== "string" || !name.trim() || s.prompts.styles.some((x) => x.name === name.trim())) return;
			style.name = name.trim();
			s.prompts.activeStyle = style.name;
			saveSettings();
			this.renderStyles();
		});
		$id$1(this.root, "naist_style_delete").addEventListener("click", async () => {
			const s = settings();
			const name = s.prompts.activeStyle;
			if (!name) return;
			if (await c.callGenericPopup(t("naist.prompts.styleDeleteConfirm", { name }), c.POPUP_TYPE.CONFIRM) !== c.POPUP_RESULT.AFFIRMATIVE) return;
			s.prompts.styles = s.prompts.styles.filter((x) => x.name !== name);
			s.prompts.activeStyle = "";
			saveSettings();
			this.renderStyles();
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
                <textarea class="text_pole textarea_compact naist-template-text" rows="3">${escapeHtml(overrides[key] ?? DEFAULT_TEMPLATES[key] ?? "")}</textarea>
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
		container.innerHTML = render$1(tab_takeover_default);
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
	root;
	refreshTimer = null;
	lastPrepared = null;
	promptsTab = null;
	chatTab = null;
	takeoverTab = null;
	constructor(controller, pipeline, onSettingChange = () => {}) {
		this.controller = controller;
		this.pipeline = pipeline;
		this.onSettingChange = onSettingChange;
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
		this.mountTabs();
		this.controller.subscribe((state) => this.onState(state));
		this.onState(this.controller.state);
	}
	tabPanel(name) {
		const panel = this.root.querySelector(`[data-tabpanel="${name}"]`);
		if (!panel) throw new Error(`NAI Studio panel: missing tab ${name}`);
		return panel;
	}
	mountTabs() {
		this.promptsTab = new PromptsTab(() => this.scheduleRefresh());
		this.promptsTab.mount(this.tabPanel("prompts"));
		this.chatTab = new ChatTab((path) => {
			this.onSettingChange(path);
			this.scheduleRefresh();
		});
		this.chatTab.mount(this.tabPanel("chat"));
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
			const prepared = this.pipeline.previewFree(settings().generation.prompt);
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
			await openInspector(this.pipeline.previewFree(settings().generation.prompt));
		} catch (error) {
			this.showError(error instanceof NaiError ? error : toNaiError(error));
		}
	}
	async generate() {
		if (this.controller.state.busy) return;
		const prompt = settings().generation.prompt;
		if (!prompt.trim()) {
			this.showInfo(t("naist.panel.emptyPrompt"));
			return;
		}
		this.showInfo(t("naist.panel.generating"));
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
		}
	}
};
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
		inspect: (prepared) => openInspector(prepared, { confirmSend: true })
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
		if (path.startsWith("chat.functionTool") || path.startsWith("chat.toolCooldown") || path.startsWith("prompts.templates")) syncFunctionTool(pipeline, ownsCompatSurface());
	};
	new Panel(studio, pipeline, onSettingChange).mount(container);
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
	mountPanel(studio, pipeline);
	setupIntegrations(pipeline);
	new AutoGenerator(studio, pipeline).attach();
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