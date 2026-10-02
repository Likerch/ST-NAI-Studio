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
	"naist.wand.readingMode": "Reading mode (no images)"
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
		imageFormat: "webp",
		useCoords: false,
		characters: []
	};
}
function defaultSettings() {
	return {
		schemaVersion: 3,
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
			insertMode: "free"
		},
		gallery: {
			enabled: true,
			thumbSize: 256
		},
		png: { stripMetadata: false },
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
	},
	{
		to: 3,
		migrate(settings) {
			return {
				...settings,
				schemaVersion: 3
			};
		}
	}
];
/** Applies pending migrations, then fills missing keys from defaults (lodash.merge in the host). */
function migrateAndFill(stored, merge) {
	let raw = isObject$1(stored) ? structuredClone(stored) : {};
	const fromVersion = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
	if (fromVersion > 3) return {
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
	settings.schemaVersion = 3;
	return {
		settings,
		fromVersion,
		migrated: fromVersion !== 3
	};
}
//#endregion
//#region src/core/storage.ts
var instances = /* @__PURE__ */ new Map();
function instance(storeName) {
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
	return instance("data");
}
/** Full images and thumbnails (Blob values). */
function imageStore() {
	return instance("images");
}
/** Gallery records (one per generated image). */
function galleryStore() {
	return instance("gallery");
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
		const caption = entry?.display.caption.trim() || entry?.meta.scenePrompt.trim() || "";
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
	return list.filter((e) => typeof e === "object" && e !== null && typeof e.id === "string" && Array.isArray(e.swipes) && e.swipes.length > 0);
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
function num$1(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function str$1(value) {
	return typeof value === "string" ? value : "";
}
function obj(value) {
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
		comment = obj(JSON.parse(raw));
	} catch {
		return null;
	}
	if (!("prompt" in comment) && !("v4_prompt" in comment) && !("steps" in comment)) return null;
	const model = modelFromSource(text.Source) ?? (isModelId(fallbackModel) ? fallbackModel : void 0);
	const v4 = obj(comment.v4_prompt);
	const v4Caption = obj(v4.caption);
	const v4Negative = obj(obj(comment.v4_negative_prompt).caption);
	const basePrompt = str$1(v4Caption.base_caption) || str$1(comment.prompt) || str$1(text.Description);
	const baseNegative = str$1(v4Negative.base_caption) || str$1(comment.uc);
	const quality = model ? splitQualityTags(basePrompt, model) : {
		prompt: basePrompt,
		preset: void 0
	};
	const uc = model ? splitUcPreset(baseNegative, model) : {
		negative: baseNegative,
		preset: void 0
	};
	const charCaptions = Array.isArray(v4Caption.char_captions) ? v4Caption.char_captions.map(obj) : [];
	const charNegatives = Array.isArray(v4Negative.char_captions) ? v4Negative.char_captions.map(obj) : [];
	const characters = charCaptions.map((caption, i) => {
		const center = obj(Array.isArray(caption.centers) ? caption.centers[0] : void 0);
		return {
			prompt: str$1(caption.char_caption),
			negative: str$1(charNegatives[i]?.char_caption),
			x: num$1(center.x) ?? .5,
			y: num$1(center.y) ?? .5
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
	assign("seed", num$1(comment.seed));
	assign("steps", num$1(comment.steps));
	assign("scale", num$1(comment.scale));
	assign("cfgRescale", num$1(comment.cfg_rescale));
	assign("width", num$1(comment.width));
	assign("height", num$1(comment.height));
	assign("sampler", str$1(comment.sampler) || void 0);
	assign("noiseSchedule", str$1(comment.noise_schedule) || void 0);
	if (typeof comment.sm === "boolean") result.smea = comment.sm;
	if (typeof comment.sm_dyn === "boolean") result.smeaDyn = comment.sm_dyn;
	if ("skip_cfg_above_sigma" in comment) result.varietyBoost = comment.skip_cfg_above_sigma !== null;
	if (typeof v4.use_coords === "boolean") result.useCoords = v4.use_coords;
	assign("requestType", str$1(comment.request_type) || void 0);
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
	return meta;
}
var Pipeline = class {
	controller;
	ui;
	observers = /* @__PURE__ */ new Set();
	constructor(controller, ui) {
		this.controller = controller;
		this.ui = ui;
	}
	onGenerated(observer) {
		this.observers.add(observer);
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
		const assembled = this.assemble(MODE.FREE, trigger, "", {
			isSwipe: false,
			expanded: false
		});
		return this.controller.prepare(assembled.overrides);
	}
	assemble(mode, scene, additionalNegative, flags, overrides = {}, forcedSize) {
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
		if (mode === MODE.FREE && !flags.isSwipe && !flags.expanded) {
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
		const refine = o.edit ?? s.modes.refine;
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
			if (!scene.trim()) return null;
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
		const assembled = this.assemble(mode, scene, additionalNegative, {
			isSwipe,
			expanded: req.scene !== void 0
		}, o, forcedSize);
		if (isSwipe && assembled.overrides.seed === void 0 && s.generation.seed >= 0) assembled.overrides.seed = -1;
		const prepared = this.controller.prepare(assembled.overrides, req.requestPatch);
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
				mode
			});
			log.info("picture", req.initiator, `mode ${mode}`, prepared.body.model, `cost ${prepared.cost.total}`);
			return {
				images: result.images,
				meta,
				legacy,
				prepared,
				mode,
				chatId
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
			overrides: req.overrides
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
		return entry;
	}
	/** After an edit-mode insertion the placeholder lives in the textarea until ST saves it. */
	async saveCreated(messageId, entry) {
		await commit(messageId, false);
		settle(entryBlobKeys(entry));
	}
	async addGeneratedSwipe(messageId, imageId, produced) {
		if (!produced) return false;
		const { entry } = findEntry(messageId, imageId);
		const swipes = [];
		for (const image of produced.images) swipes.push(await this.storeImage(imageId, image, produced.meta));
		for (const swipe of swipes) addSwipe(entry, swipe);
		await commit(messageId);
		settle(swipes.map((s) => s.blobKey));
		this.record(produced, swipes, imageId);
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
		return await this.addGeneratedSwipe(messageId, imageId, produced);
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
function options(values, current, emptyKey) {
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
            <select class="text_pole naist-g-model">${options(f.models, query.model, "naist.gallery.allModels")}</select>
            <select class="text_pole naist-g-character">${options(f.characters, query.character, "naist.gallery.allCharacters")}</select>
            <select class="text_pole naist-g-chat">${options(f.chats, query.chatId, "naist.gallery.allChats")}</select>
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
		popup.dlg.close();
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
		this.service.onChange((messageId) => this.refreshMessage(messageId));
		this.applyVisibility();
		this.renderAll();
	}
	/** Re-renders every message (chat change, settings change). */
	renderAll() {
		document.querySelectorAll("#chat .mes").forEach((m) => this.pending.add(m));
		this.schedule();
	}
	/** Drops cached object URLs (new chat). */
	reset() {
		for (const url of this.urls.values()) URL.revokeObjectURL(url);
		this.urls.clear();
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
		const spans = [...text.querySelectorAll(`[${IMG_ATTR}]:not([${MOUNTED_ATTR}])`)];
		if (!spans.length) return;
		const entries = this.service.entries(messageId);
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
		toolbar.append(icon("regenerate", "fa-rotate", "naist.inline.regenerate"), icon("variation", "fa-shuffle", "naist.inline.variation"), icon("edit", "fa-pen-to-square", "naist.inline.edit"), icon("display", "fa-sliders", "naist.inline.display"), icon("lightbox", "fa-expand", "naist.inline.lightbox"), icon("delete", "fa-trash-can", "naist.inline.delete"));
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
			case "prev":
			case "next":
				if (entry) await this.service.setActive(messageId, imageId, entry.activeSwipe + (action === "next" ? 1 : -1));
				return;
			case "regenerate": return await this.run(messageId, imageId, () => this.service.regenerate(messageId, imageId));
			case "variation": return await this.run(messageId, imageId, () => this.service.variation(messageId, imageId));
			case "edit": return this.ui.edit(messageId, imageId);
			case "display": return this.ui.display(messageId, imageId);
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
/**
* Inline image placeholders never reach the LLM as raw markers (RECON §2.3 item 8). The prompt array
* is ST's own copy, so replacing an element with a clone leaves the chat untouched.
*/
function stripPlaceholders(chat, mode) {
	for (let i = 0; i < chat.length; i++) {
		const message = chat[i];
		if (!message?.mes?.includes("[nai:img:")) continue;
		const copy = structuredClone(message);
		copy.mes = textForPrompt(message.mes, readEntries(message.extra), mode);
		chat[i] = copy;
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
            <li class="list-group-item interactable naist-wand-sep" data-trigger="__gallery" data-i18n="naist.wand.gallery"></li>
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
var panel_default = "<div class=\"naist-panel\" id=\"naist_panel\">\n    <div class=\"inline-drawer\">\n        <div class=\"inline-drawer-toggle inline-drawer-header\">\n            <b data-i18n=\"naist.panel.title\"></b>\n            <div class=\"inline-drawer-icon fa-solid fa-circle-chevron-down down\"></div>\n        </div>\n        <div class=\"inline-drawer-content\">\n            <div class=\"naist-content\">\n                <div class=\"naist-row naist-status\">\n                    <label for=\"naist_transport_mode\" data-i18n=\"naist.panel.transport\"></label>\n                    <select id=\"naist_transport_mode\" class=\"text_pole naist-grow\">\n                        <option value=\"auto\" data-i18n=\"naist.transport.auto\"></option>\n                        <option value=\"plugin\" data-i18n=\"naist.transport.plugin\"></option>\n                        <option value=\"native\" data-i18n=\"naist.transport.native\"></option>\n                    </select>\n                    <div\n                        id=\"naist_refresh\"\n                        class=\"menu_button fa-solid fa-rotate\"\n                        data-i18n=\"[title]naist.panel.refresh\"\n                    ></div>\n                </div>\n                <div id=\"naist_transport_badge\" class=\"naist-badge\"></div>\n                <div id=\"naist_account\" class=\"naist-account\"></div>\n\n                <div id=\"naist_takeover_banner\" class=\"naist-banner naist-hidden\">\n                    <span data-i18n=\"naist.takeover.banner\"></span>\n                    <div id=\"naist_banner_open\" class=\"menu_button\" data-i18n=\"naist.takeover.bannerAction\"></div>\n                </div>\n\n                <div class=\"naist-tabs\" role=\"tablist\">\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"generate\"\n                        data-i18n=\"naist.tab.generate\"\n                    ></div>\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"prompts\"\n                        data-i18n=\"naist.tab.prompts\"\n                    ></div>\n                    <div class=\"naist-tab menu_button\" role=\"tab\" data-tab=\"chat\" data-i18n=\"naist.tab.chat\"></div>\n                    <div class=\"naist-tab menu_button\" role=\"tab\" data-tab=\"images\" data-i18n=\"naist.tab.images\"></div>\n                    <div\n                        class=\"naist-tab menu_button\"\n                        role=\"tab\"\n                        data-tab=\"takeover\"\n                        data-i18n=\"naist.tab.takeover\"\n                    ></div>\n                </div>\n\n                <div class=\"naist-tabpanel\" data-tabpanel=\"generate\">\n                    <label for=\"naist_model\" data-i18n=\"naist.panel.model\"></label>\n                    <select id=\"naist_model\" class=\"text_pole\">\n                        {{#each models}}\n                        <option value=\"{{id}}\" data-i18n=\"{{nameKey}}\"></option>\n                        {{/each}}\n                    </select>\n\n                    <label for=\"naist_prompt\" data-i18n=\"naist.panel.prompt\"></label>\n                    <textarea\n                        id=\"naist_prompt\"\n                        class=\"text_pole textarea_compact\"\n                        rows=\"4\"\n                        data-i18n=\"[placeholder]naist.panel.promptPlaceholder\"\n                    ></textarea>\n\n                    <label for=\"naist_negative\" data-i18n=\"naist.panel.negative\"></label>\n                    <textarea id=\"naist_negative\" class=\"text_pole textarea_compact\" rows=\"2\"></textarea>\n\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_uc_preset\" data-i18n=\"naist.panel.ucPreset\"></label>\n                            <select id=\"naist_uc_preset\" class=\"text_pole\"></select>\n                        </div>\n                        <div>\n                            <label for=\"naist_quality\" data-i18n=\"naist.panel.quality\"></label>\n                            <select id=\"naist_quality\" class=\"text_pole\"></select>\n                        </div>\n                    </div>\n\n                    <div\n                        id=\"naist_characters_block\"\n                        class=\"naist-block\"\n                        data-cap=\"characters\"\n                        data-feature=\"characters\"\n                    >\n                        <div class=\"naist-row\">\n                            <b data-i18n=\"naist.panel.characters\"></b>\n                            <span id=\"naist_characters_count\" class=\"naist-muted\"></span>\n                            <div\n                                id=\"naist_add_character\"\n                                class=\"menu_button fa-solid fa-user-plus\"\n                                data-i18n=\"[title]naist.panel.addCharacter\"\n                            ></div>\n                        </div>\n                        <label class=\"checkbox_label\"\n                            ><input type=\"checkbox\" id=\"naist_use_coords\" /><span\n                                data-i18n=\"naist.panel.useCoords\"\n                            ></span\n                        ></label>\n                        <div id=\"naist_characters\"></div>\n                        <div class=\"naist-feature-hint\" data-hint-for=\"characters\"></div>\n                    </div>\n\n                    <label for=\"naist_size_preset\" data-i18n=\"naist.panel.size\"></label>\n                    <div class=\"naist-grid3\">\n                        <select id=\"naist_size_preset\" class=\"text_pole\"></select>\n                        <input\n                            id=\"naist_width\"\n                            type=\"number\"\n                            class=\"text_pole\"\n                            step=\"64\"\n                            min=\"64\"\n                            data-i18n=\"[title]naist.panel.width\"\n                        />\n                        <input\n                            id=\"naist_height\"\n                            type=\"number\"\n                            class=\"text_pole\"\n                            step=\"64\"\n                            min=\"64\"\n                            data-i18n=\"[title]naist.panel.height\"\n                        />\n                    </div>\n\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_sampler\" data-i18n=\"naist.panel.sampler\"></label>\n                            <select id=\"naist_sampler\" class=\"text_pole\"></select>\n                        </div>\n                        <div data-cap=\"noiseSchedule\">\n                            <label for=\"naist_schedule\" data-i18n=\"naist.panel.schedule\"></label>\n                            <select id=\"naist_schedule\" class=\"text_pole\"></select>\n                        </div>\n                    </div>\n                    <div class=\"naist-grid3\">\n                        <div>\n                            <label for=\"naist_steps\" data-i18n=\"naist.panel.steps\"></label>\n                            <input id=\"naist_steps\" type=\"number\" min=\"1\" max=\"50\" class=\"text_pole\" />\n                        </div>\n                        <div>\n                            <label for=\"naist_scale\" data-i18n=\"naist.panel.scale\"></label>\n                            <input id=\"naist_scale\" type=\"number\" step=\"0.1\" min=\"0\" max=\"10\" class=\"text_pole\" />\n                        </div>\n                        <div data-feature=\"cfgRescale\">\n                            <label for=\"naist_cfg_rescale\" data-i18n=\"naist.panel.cfgRescale\"></label>\n                            <input id=\"naist_cfg_rescale\" type=\"number\" step=\"0.02\" min=\"0\" max=\"1\" class=\"text_pole\" />\n                        </div>\n                    </div>\n                    <div class=\"naist-grid2\">\n                        <div>\n                            <label for=\"naist_seed\" data-i18n=\"naist.panel.seed\"></label>\n                            <input\n                                id=\"naist_seed\"\n                                type=\"number\"\n                                min=\"-1\"\n                                class=\"text_pole\"\n                                data-i18n=\"[title]naist.panel.seedHint\"\n                            />\n                        </div>\n                        <div data-feature=\"multipleSamples\">\n                            <label for=\"naist_samples\" data-i18n=\"naist.panel.samples\"></label>\n                            <input id=\"naist_samples\" type=\"number\" min=\"1\" max=\"8\" class=\"text_pole\" />\n                        </div>\n                    </div>\n                    <div class=\"naist-feature-hint\" data-hint-for=\"multipleSamples\"></div>\n\n                    <div class=\"naist-flags\">\n                        <label class=\"checkbox_label\" data-cap=\"smea\"\n                            ><input type=\"checkbox\" id=\"naist_smea\" /><span data-i18n=\"naist.panel.smea\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"smeaDyn\"\n                            ><input type=\"checkbox\" id=\"naist_smea_dyn\" /><span data-i18n=\"naist.panel.smeaDyn\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"autoSmea\"\n                            ><input type=\"checkbox\" id=\"naist_auto_smea\" /><span data-i18n=\"naist.panel.autoSmea\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"decrisper\"\n                            ><input type=\"checkbox\" id=\"naist_decrisper\" /><span\n                                data-i18n=\"naist.panel.decrisper\"\n                            ></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"varietyBoost\"\n                            ><input type=\"checkbox\" id=\"naist_variety\" /><span data-i18n=\"naist.panel.variety\"></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"transparency\" data-feature=\"transparency\"\n                            ><input type=\"checkbox\" id=\"naist_transparent\" /><span\n                                data-i18n=\"naist.panel.transparent\"\n                            ></span\n                        ></label>\n                        <label class=\"checkbox_label\" data-cap=\"legacyUc\"\n                            ><input type=\"checkbox\" id=\"naist_legacy_uc\" /><span data-i18n=\"naist.panel.legacyUc\"></span\n                        ></label>\n                    </div>\n                    <div class=\"naist-feature-hint\" data-hint-for=\"transparency\"></div>\n\n                    <hr />\n                    <label class=\"checkbox_label\"\n                        ><input type=\"checkbox\" id=\"naist_free_only\" /><span data-i18n=\"naist.panel.freeOnly\"></span\n                    ></label>\n                    <div id=\"naist_cost\" class=\"naist-cost\"></div>\n                    <div id=\"naist_lost\" class=\"naist-hint\"></div>\n\n                    <details class=\"naist-override\">\n                        <summary data-i18n=\"naist.panel.override\"></summary>\n                        <div class=\"naist-warning\" data-i18n=\"naist.panel.overrideWarning\"></div>\n                        <label class=\"checkbox_label\"\n                            ><input type=\"checkbox\" id=\"naist_override_enabled\" /><span\n                                data-i18n=\"naist.panel.overrideEnable\"\n                            ></span\n                        ></label>\n                        <textarea\n                            id=\"naist_override_json\"\n                            class=\"text_pole textarea_compact monospace\"\n                            rows=\"4\"\n                        ></textarea>\n                    </details>\n                </div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"prompts\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"chat\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"images\"></div>\n                <div class=\"naist-tabpanel naist-hidden\" data-tabpanel=\"takeover\"></div>\n\n                <label class=\"checkbox_label\"\n                    ><input type=\"checkbox\" id=\"naist_inspect_before\" /><span\n                        data-i18n=\"naist.panel.inspectBeforeSend\"\n                    ></span\n                ></label>\n                <div class=\"naist-row naist-actions\">\n                    <div id=\"naist_inspect\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-magnifying-glass\"></i><span data-i18n=\"naist.panel.inspect\"></span>\n                    </div>\n                    <div id=\"naist_generate\" class=\"menu_button menu_button_icon\">\n                        <i class=\"fa-solid fa-paintbrush\"></i><span data-i18n=\"naist.panel.generate\"></span>\n                    </div>\n                    <div id=\"naist_cancel\" class=\"menu_button menu_button_icon naist-hidden\">\n                        <i class=\"fa-solid fa-stop\"></i><span data-i18n=\"naist.panel.cancel\"></span>\n                    </div>\n                </div>\n                <div id=\"naist_message\" class=\"naist-message\"></div>\n            </div>\n        </div>\n    </div>\n</div>\n";
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
//#region src/ui/templates/tab-images.html?raw
var tab_images_default = "<div class=\"naist-section\">\n    <b data-i18n=\"naist.images.inline\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.images.inlineHint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"inline.saveToServer\" /><span data-i18n=\"naist.images.saveToServer\"></span\n    ></label>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"inline.keepBrowserCopy\" /><span\n            data-i18n=\"naist.images.keepBrowserCopy\"\n        ></span\n    ></label>\n    <div class=\"naist-grid3\">\n        <div>\n            <label for=\"naist_img_width\" data-i18n=\"naist.inline.width\"></label>\n            <input id=\"naist_img_width\" type=\"number\" min=\"5\" class=\"text_pole\" data-setting=\"inline.defaultWidth\" />\n        </div>\n        <div>\n            <label for=\"naist_img_unit\" data-i18n=\"naist.inline.unit\"></label>\n            <select id=\"naist_img_unit\" class=\"text_pole\" data-setting=\"inline.defaultWidthUnit\">\n                <option value=\"%\">%</option>\n                <option value=\"px\">px</option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_align\" data-i18n=\"naist.inline.align\"></label>\n            <select id=\"naist_img_align\" class=\"text_pole\" data-setting=\"inline.defaultAlign\">\n                <option value=\"center\" data-i18n=\"naist.inline.alignCenter\"></option>\n                <option value=\"left\" data-i18n=\"naist.inline.alignLeft\"></option>\n                <option value=\"right\" data-i18n=\"naist.inline.alignRight\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_radius\" data-i18n=\"naist.inline.radius\"></label>\n            <input id=\"naist_img_radius\" type=\"number\" min=\"0\" class=\"text_pole\" data-setting=\"inline.defaultRadius\" />\n        </div>\n        <div>\n            <label for=\"naist_img_layout\" data-i18n=\"naist.inline.layout\"></label>\n            <select id=\"naist_img_layout\" class=\"text_pole\" data-setting=\"inline.defaultLayout\">\n                <option value=\"grid\" data-i18n=\"naist.inline.layoutGrid\"></option>\n                <option value=\"carousel\" data-i18n=\"naist.inline.layoutCarousel\"></option>\n                <option value=\"list\" data-i18n=\"naist.inline.layoutList\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_llm\" data-i18n=\"naist.images.llmText\"></label>\n            <select id=\"naist_img_llm\" class=\"text_pole\" data-setting=\"inline.llmText\">\n                <option value=\"describe\" data-i18n=\"naist.images.llmDescribe\"></option>\n                <option value=\"remove\" data-i18n=\"naist.images.llmRemove\"></option>\n            </select>\n        </div>\n        <div>\n            <label for=\"naist_img_vstrength\" data-i18n=\"naist.images.variationStrength\"></label>\n            <input\n                id=\"naist_img_vstrength\"\n                type=\"number\"\n                min=\"0.01\"\n                max=\"0.99\"\n                step=\"0.01\"\n                class=\"text_pole\"\n                data-setting=\"inline.variationStrength\"\n            />\n        </div>\n        <div>\n            <label for=\"naist_img_vnoise\" data-i18n=\"naist.images.variationNoise\"></label>\n            <input\n                id=\"naist_img_vnoise\"\n                type=\"number\"\n                min=\"0\"\n                max=\"0.99\"\n                step=\"0.01\"\n                class=\"text_pole\"\n                data-setting=\"inline.variationNoise\"\n            />\n        </div>\n    </div>\n    <div class=\"naist-row\">\n        <div id=\"naist_img_toggle_chat\" class=\"menu_button\"></div>\n        <label class=\"checkbox_label\"\n            ><input id=\"naist_img_reading\" type=\"checkbox\" /><span data-i18n=\"naist.images.readingMode\"></span\n        ></label>\n    </div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.images.gallery\"></b>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"gallery.enabled\" /><span data-i18n=\"naist.images.galleryEnabled\"></span\n    ></label>\n    <div id=\"naist_img_open_gallery\" class=\"menu_button\" data-i18n=\"naist.images.openGallery\"></div>\n</div>\n\n<div class=\"naist-section\">\n    <b data-i18n=\"naist.images.png\"></b>\n    <div class=\"naist-hint\" data-i18n=\"naist.images.pngHint\"></div>\n    <label class=\"checkbox_label\"\n        ><input type=\"checkbox\" data-setting=\"png.stripMetadata\" /><span data-i18n=\"naist.images.stripMetadata\"></span\n    ></label>\n    <div class=\"naist-row\">\n        <div id=\"naist_img_import\" class=\"menu_button\" data-i18n=\"naist.images.importPng\"></div>\n        <input id=\"naist_img_import_file\" type=\"file\" accept=\"image/png,image/webp\" class=\"naist-hidden\" />\n    </div>\n</div>\n";
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
		container.innerHTML = render$1(tab_images_default);
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
	imageActions;
	root;
	refreshTimer = null;
	lastPrepared = null;
	promptsTab = null;
	chatTab = null;
	imagesTab = null;
	takeoverTab = null;
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
	setupInline(pipeline, new InlineImages(pipeline));
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