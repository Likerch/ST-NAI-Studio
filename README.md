# NAI Studio

**English** · [Русский](README.ru.md)

A NovelAI image studio for [SillyTavern](https://github.com/SillyTavern/SillyTavern). It replaces the built-in Image Generation with a client built specifically for NovelAI: every model from V3 to V5, multi-character scenes with positions, Director Tools, inpainting, vibes, live previews, an Anlas guard, pictures the chat model asks for right inside its replies, prompts in plain Russian or English — and it keeps working with the commands, scripts and habits you already have.

|                      |                                            |
| -------------------- | ------------------------------------------ |
| SillyTavern          | 1.19.0 or newer                            |
| NovelAI subscription | any; free generations are tracked for Opus |
| Interface            | English, Russian                           |
| Server plugin        | optional, recommended (0.4.1)              |
| License              | AGPL-3.0                                   |

## Why

The built-in Image Generation treats NovelAI as one backend among many. NAI Studio is built around what NovelAI actually offers:

- **The real request.** Payloads are assembled exactly like the NovelAI website does it (quality tags, undesired-content presets, `v4_prompt`, character captions), and nothing the model does not support is ever sent. A payload inspector shows the final JSON before anything leaves.
- **Your Anlas stay yours.** The price is computed before every request, the "free generations only" mode is on by default and makes it impossible to spend Anlas by accident, paid tools always ask first.
- **Your token stays on the server.** The NovelAI key lives in SillyTavern's secrets (or the plugin config) and never reaches the browser.

## Features

### Generation

- Models: V5 Full / Curated, V4.5 Full / Curated, V4 Full / Curated, Anime V3, Furry V3 — each with its own capability matrix (sizes, samplers, schedules, SMEA, Variety+, transparency, character limits).
- Multi-character prompts: per-character prompt and undesired content, positions on a 5 × 5 grid (V4.x) or free coordinates (V5, up to 32 characters).
- Sampler, scheduler, guidance, rescale, seed, steps, size presets, quality and UC presets.
- **Live previews** of denoising steps while the image is being drawn (plugin); a progress estimate otherwise. Cancelling really aborts the request.
- Payload inspector and raw JSON override for experiments.

### In the chat

- Every mode of the built-in extension (character, face, user, scene, last message, background, free, multimodal), prompt templates, common prefix/suffix, styles, per-character prompts.
- `/nai`, and after the takeover also `/sd`, `/imagine`, `/img`, `/image` with all their arguments; wand menu item, message button, character menu items, interactive mode, `{{charPrefix}}` macros.
- **Images inside messages:** insert at the cursor, regenerate, variations, drag between messages, captions and spoilers, grid and carousel layouts, reading mode.
- Lightbox with all parameters; set as chat background or character avatar; save as PNG with NovelAI metadata.
- Gallery of everything generated, with search, filters, favourites and side-by-side comparison.
- Drop a NovelAI PNG/WebP on the panel to load its parameters.
- Auto-generation rules (every N messages, keywords, scene change) with a mandatory cooldown — never spends Anlas in free-only mode.
- `GenerateImage` tool for the LLM with structured arguments: who is in the frame, action, mood, framing, location.

### Pictures in the chat model's replies

- The chat model writes an image marker where a picture fits — `<img data-nai='{"prompt": "...", "caption": "..."}'>` — and the picture appears in its place. The instruction is added to the prompt for you (plain-language or tag descriptions, or your own text), with a configurable number of pictures per reply.
- **Generation starts while the reply is still streaming**, as soon as a marker is complete; one generation at a time.
- Every marker parameter: description, undesired content, characters by name (their appearance passports, position, pose, action), aspect ratio and size, model, style, in-image text, seed, steps, guidance, rescale, sampler, quality and UC presets, Variety+, transparency, location, an earlier picture as the base (`ref`), a vibe by name, number of variants, caption, spoiler, alignment, width.
- Older formats are understood too: image URLs of a self-hosted generation microservice, sillyimages and Auto Illustrator markers.
- HTML widgets made with regex scripts keep working: they receive every picture as an `<img>`.
- Free-only by default; paid marker pictures only with your permission and a price cap. Failed or interrupted pictures can be generated again with one click.
- With Maestro (or another extension with a quality gate), the pictures of a reply wait for its quality check: a reply that is being redone is not drawn, and with no answer in 20 s (configurable on the Chat tab) the pictures are drawn as usual.
- With Maestro, the passports of the lore entries of a scene (places, items, creatures, people without a card) take part in scene pictures and image markers after the passports of your cards, and Maestro can have NAI Studio write a passport from a lore entry or draw a background for a place into the backgrounds library.

### Characters and scenes

- **Passports** stored in the character card: base, hair, eyes, body, outfits, states, personal undesired content, default pose and position. A card can carry several: **every character it describes**, and the **world, locations, scenario or objects** (their visual tags) — because a card is not always one person.
- **"Passports" button** in the character card, **"Generate from the description"** — the language model reads the description, personality, scenario and first message and writes the passports for you to review. Personas have their own passport (button in the persona panel), filled from the persona description. **"Avatar from the passport"** in the persona panel draws a free portrait of the persona from its passport and, after a preview (set / another one / cancel) and the usual crop, replaces the persona avatar.
- **A passport for one chat:** the passport editor has a "Card / This chat" switch. In "This chat" the outfit, states or any field change for this chat only (only the difference from the card is kept, the card stays as it is); "Back to the card" drops the changes.
- Passports are used everywhere: in the composer, the automatic scene, the LLM tool and **image markers in replies** — a character named in a marker (even in Russian, declined) gets their looks automatically; world and scenario tags join every scene of the chat, a location joins when it is named. `{{nai_characters}}` lists the characters with a passport for your own prompts.
- Pose library (38 poses), pair poses (hug, holding hands, carry…) using NovelAI's `source#` / `target#` / `mutual#` interaction tags, framing, camera angle, distance.
- **Scene composer** with a position canvas; automatic scene from the last message: who is in the frame, their poses and interactions, character counts. Works in group chats.

### Doom's Enhancement Suite

When [Doom's Enhancement Suite](https://github.com/DangerDaza/Dooms-Enhancement-Suite) is installed, NAI Studio integrates with it (Chat tab → "Doom's Enhancement Suite"):

- **Scene from the tracker** in every picture: time of day, weather, indoors / outdoors and the location (with its location passport and scene continuity). DES writes its tracker at the start of a reply, so even pictures started while the reply streams know the scene; in separate / external mode pictures wait for the tracker.
- **Characters of the tracker** take part in pictures with their **current look** (clothes and state from the tracker over the identity of their passport) — also NPCs without a card.
- **Passports for new characters:** a character the cards of the chat do not know gets a passport written from the tracker and saved in the card; the passport becomes its DES Workshop "Portrait prompt".
- **Portraits by NAI Studio:** DES's own auto portraits are switched off while the integration draws them — when a portrait is missing, when the look changes, or every reply — with a stable seed per character for the same face; DES keeps them with its history ("Restore Previous Portrait" works).
- **Emotions** of other characters of a card go to `characters/<name>`, where DES's expressions mode looks for them.
- NAI Studio items in the DES portrait menu (passport, emotions, new portrait, picture with the character), "Illustrate" on scene banners, a passport button in the Workshop.

### Image tools (on any image in the chat)

- **Director Tools:** line art, sketch, colorize, emotion (24 emotions), declutter, declutter keeping bubbles, background removal. Results become new swipes; the original is never lost.
- **Inpaint / outpaint** editor: brush, eraser, invert, keep-original compositing; V5 Curated honestly falls back to the V4.5 Curated inpainting model.
- **Upscale ×2** and **Enhance** (upscale + img2img with strength and noise).
- **Vibe library:** reference images, named sets bound to a character, chat or style, per-vibe strength and information. Encodings are cached in the browser and on the plugin's disk — reusing a vibe never costs Anlas twice.

### Prompt helpers

- **Plain language everywhere:** describe a picture in Russian or English — in the panel, the composer, markers, anywhere — and it becomes tags (plus short sentences for V4.5 / V5) for the selected model before generation. Converted by your chat model, a separate connection profile or NovelAI's own text model (GLM-4.6, part of the subscription, no Anlas); tags are checked against the Danbooru list, a glossary keeps names consistent, results are cached, the original stays in the image metadata. A "→ Prompt" button converts a field by hand.
- **Tag suggestions** while typing: 20 000 most used Danbooru tags with counts and aliases, ~400 Russian aliases, NovelAI's own suggestions; a hint about unknown tags.
- **Weights** with Ctrl + ↑ / Ctrl + ↓ in the syntax of the model (`1.05::tag::` on V4+, `{tag}` / `[tag]` on V3); numeric weights are converted when you switch to V3.
- **Token counter** using NovelAI's own tokenizers (Qwen for V5, T5 for V4.x, CLIP for V3) with the website's limits; in-image text of V5 is shown separately; a warning about characters T5 cannot read.

### Extras

- **Expressions sprite generator** ("Emotions" button in the card): a full emotion set (28 labels) generated one by one for the built-in Expressions extension, consistent character, named and uploaded where Expressions looks for them; another character of the card gets its own folder (switch with `/costume`).
- **Comic pages** for V5: layouts, a prompt and speech lines per panel, the page is assembled automatically.
- **Scene continuity:** the last picture of a location becomes the base (img2img) or a vibe of the next one there.
- Export and import of all settings in one JSON file.

## Installation

1. **Extension:** SillyTavern → Extensions → Install extension → `https://github.com/Likerch/ST-NAI-Studio`.
2. **NovelAI token:** API Connections → NovelAI → paste your persistent API token (`pst-…`). The plugin reads it from SillyTavern's secrets.
3. **Server plugin (recommended):**
   - copy the plugin with `install-server.ps1 -SillyTavern "C:\path\to\SillyTavern"` (Windows) or `./install-server.sh /path/to/SillyTavern` (Linux, macOS, Docker host);
   - enable plugins: `enableServerPlugins: true` in `config.yaml` (or env `SILLYTAVERN_ENABLESERVERPLUGINS=true`);
   - restart SillyTavern. The panel shows "Server plugin 0.4.1".

Details, Docker notes and uninstalling — [docs/DEPLOY.md](docs/DEPLOY.md).

### With and without the plugin

| Feature                                                                       | Plugin | Without the plugin (SillyTavern's NovelAI endpoint) |
| ----------------------------------------------------------------------------- | ------ | --------------------------------------------------- |
| txt2img, all models                                                           | ✅     | ✅ one image per request                            |
| Several images, characters with positions                                     | ✅     | —                                                   |
| img2img, inpaint, outpaint, Enhance                                           | ✅     | —                                                   |
| Director Tools, upscale, vibes (V4/V4.5)                                      | ✅     | —                                                   |
| Live step previews                                                            | ✅     | progress estimate                                   |
| Exact token counter, NovelAI tag suggestions                                  | ✅     | estimate; local tags only                           |
| NovelAI text model for plain-language prompts                                 | ✅     | — (chat model or a connection profile instead)      |
| Inline images, gallery, passports, composer, translation, sprites (seed mode) | ✅     | ✅                                                  |

Features that need the plugin stay visible in the interface with the reason they are unavailable.

## Getting started

1. Open **Extensions → NAI Studio**. "Free generations only" is on: nothing will spend Anlas.
2. Pick a model, write a prompt (tags, or simply describe the picture in Russian or English), press **Generate** — the image is posted to the chat.
3. Try `/nai a cat on a windowsill, sunlight` in the chat, or the wand menu → NAI Studio.
4. On the **Images** tab you will find the vibe library, sprites, comics and scene continuity; on **Prompts** — styles, plain-language settings and the prompt helpers.
5. To let the chat model illustrate its replies: **Chat** tab → "Image markers in replies" → turn it on. The instruction is added to the prompt automatically.
6. When you are ready to drop the built-in extension: **Replace built-in** tab → migrate the settings (done automatically on first start) → "Disable built-in and reload". It can be turned back on at any time.

## Slash commands

| Command                                                   | What it does                                                                       |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `/nai [prompt]` (`/nai-imagine`)                          | Generate an image; accepts the built-in `/sd` arguments plus NovelAI-specific ones |
| `/imagine`, `/sd`, `/img`, `/image`                       | The same, after the takeover of the built-in extension                             |
| `/nai-style [name]` (`/imagine-style` after takeover)     | Select a style (with its UC preset) or return the active one                       |
| `/nai-insert message=<id> [at=<pos>] [prompt]`            | Generate and insert an image inside a message                                      |
| `/nai-images`                                             | Show or hide inline images of the chat; reading mode                               |
| `/nai-gallery`                                            | Open the gallery                                                                   |
| `/nai-scene [edit=false] [target=message\|inline] [text]` | Assemble a scene from the last message (or text)                                   |
| `/nai-vibes`                                              | Open the vibe library                                                              |
| `/nai-prompt [text]`                                      | Turn a description in Russian or English into a NovelAI prompt for the model       |
| `/nai-translate [text]`                                   | Translate a Russian prompt to English tags                                         |
| `/nai-sprites`                                            | Open the Expressions sprite generator                                              |
| `/nai-comic`                                              | Open the comic page builder (V5)                                                   |
| `/nai-location [name]`                                    | Set or return the current location for scene continuity                            |

## Privacy and safety

- The NovelAI token never reaches the browser and is never stored in the extension settings.
- Network traffic goes only to NovelAI (and to your SillyTavern server). The tag list ships with the extension; tokenizer files are fetched from novelai.net once and cached.
- Paid actions (vibe encoding, upscale, background removal, anything above the free limits) always show the price and ask for confirmation; free-only mode blocks them entirely.
- Plain-language conversion uses the LLM you choose (your chat model, a connection profile you configured in SillyTavern, or NovelAI through the plugin); nothing is sent anywhere else.

## API for Maestro

NAI Studio publishes `globalThis.NAI_STUDIO_API` for other extensions, Maestro first of all. It appears when the extension is enabled and goes away when it is disabled. Version 1: within a version members are only added. Typed and commented in [`src/integration/public-api.ts`](src/integration/public-api.ts); passport fields are in [`src/domain/passport.ts`](src/domain/passport.ts).

```ts
interface NaiStudioApi {
  version: 1;
  passports(scope?: { avatar?: string; persona?: boolean; chat?: boolean }): Passport[];
  getPassport(id: string): Passport | null;
  savePassport(
    passport: Passport,
    scope: 'card' | 'chat',
    target?: { avatar?: string; persona?: boolean },
  ): Promise<void>;
  setOutfit(passportId: string, outfit: string, scope?: 'card' | 'chat'): Promise<void>;
  setState(passportId: string, stateId: string, enabled: boolean, scope?: 'card' | 'chat'): Promise<void>;
  clearChatOverride(passportId: string): Promise<void>;
  on(event: 'passportsSaved' | 'imageReady' | 'requestFailed', listener: (detail: unknown) => void): () => void;
  registerSceneProvider(provider: {
    id: string;
    priority: number;
    describe(context: { messageIndex: number; text: string }): Promise<SceneHint | null> | SceneHint | null;
  }): () => void;
  // Since 0.11; absent in 0.10, check that it is a function.
  registerQualityGate(
    gate: (detail: { messageIndex: number; swipeId: number }) => Promise<boolean> | boolean,
  ): () => void;
  // Since 0.12; absent before, check that they are functions.
  registerPassportProvider(provider: {
    id: string;
    priority?: number;
    passports(context: { messageIndex: number; text: string }): Promise<Passport[]> | Passport[];
  }): () => void;
  generatePassport(input: {
    name: string;
    kind: 'character' | 'location' | 'object' | 'world';
    description: string;
    language?: string;
  }): Promise<Passport | null>;
  generateBackground(input: {
    locationName: string;
    tags?: string;
    passportId?: string;
    timeOfDay?: string;
    weather?: string;
    style?: string;
  }): Promise<{ file: string } | null>;
}

type SceneHint = { locationId?: string; locationName?: string; tags?: string; characters?: string[] };
// A passport outfit; `looks` since 0.12.1.
type Outfit = { name: string; tags: string; looks?: string[] };
```

- **Passports** are always returned as the current chat sees them (chat overrides applied), as copies.
  - `savePassport(p, 'card')` writes the card (or `target.persona`).
  - `savePassport(p, 'chat')` keeps only the fields that differ from the card in the chat metadata (`chat_metadata.nai_studio.passports`). A passport unknown to the cards becomes a passport of the chat itself.
  - `setOutfit` / `setState` default to `'chat'`.
  - `clearChatOverride` brings the card value back.
  - Outfits may carry `looks` (0.12.1): DES tracker wordings known to mean that outfit, any language (strings, up to 12, newest last, each up to 300 characters; Maestro's wardrobe writes them). When a character's current tracker look says one of them, NAI Studio draws that outfit's tags instead of the look: in scenes, image markers and DES portraits. A wording matches exactly after normalisation (case, punctuation, Russian quotes and dashes, ё as е) or by its words (Jaccard 0.75 or more, words of two letters or more); a look joined from several tracker fields is compared part by part. An outfit chosen in the composer still wins. NAI Studio's passport editor does not show `looks` but keeps them; chat overrides carry them.
- **Events.**
  - `passportsSaved` `{ ids, scope, avatar?, persona? }` follows every passport save, including the ones made in NAI Studio's own UI.
  - `imageReady` `{ messageIndex, kind, passportIds }` follows every image attached to a message once the chat is saved.
  - `requestFailed` `{ request: 'passport' | 'background', name, code, message }` (0.12) follows a `generatePassport` / `generateBackground` call that resolved `null`; `code` is NAI Studio's error code (`free-only-blocked`, `aborted` when the user declined the cost, …).
- **Scene providers.**
  - They are asked by descending priority; each field comes from the first provider that has it, the rest from the DES tracker and the text as before.
  - Providers have 3 s to answer.
  - Their `characters` are used by the automatic scene when the text names nobody.
- **Quality gates** (0.11, `version` stays 1: check that `registerQualityGate` is a function).
  - Before NAI Studio draws on its own for an assistant reply it awaits every registered gate in parallel, once per reply swipe: image markers of the reply (also the ones found while it streams), automatic illustrations of a reply without markers, automatic generation by rules, automatic DES portraits after the reply.
  - The gates are asked once the reply is complete. Markers found while it streams are still collected, but nothing is sent to NovelAI before the verdict.
  - Any `false`: nothing is drawn for that reply swipe; its marker placeholders stay, and "Try again" or a new swipe draws them. All `true`, or no answer within the time limit (`quality.gateTimeoutMs`, 20 s by default, counted from the end of the reply; the Chat tab shows the field while a gate is registered): drawn as before. A gate that throws counts as `true`.
  - A reply swiped away, deleted or left with its chat while waiting gets nothing.
  - Manual generation (buttons, menus, `/nai…` commands) never waits. Without gates nothing changes.
- **Passport providers** (0.12, check that `registerPassportProvider` is a function). Maestro gives the passports of the lore entries activated or mentioned in a scene (places, items, creatures, people without a card).
  - Wherever NAI Studio resolves passports for scene images and image markers it adds them after the passports of the cards, the persona and the chat: characters become scene participants (by name in a marker or the text, in the composer, in `{{nai_characters}}`), locations named places, worlds setting tags, objects named items whose tags join a picture that names them (card object passports now do that too).
  - One named like a passport of the cards, the persona or the chat (name or alias) is left out: the chat's wins; between providers the higher priority wins.
  - Providers have 3 s; one that throws or is silent is skipped. Answers are reused for one picture (1.5 s).
  - The DES integration uses a provider's character passport for a new tracker character instead of writing one into the card.
- **`generatePassport`** (0.12) runs NAI Studio's passport generator for one person, place, item or the world from a description (a lore entry) through the language backend chosen in NAI Studio. Nothing is saved: a full passport with a new id and the given name (the model's name becomes an alias), or `null` with a `requestFailed` event. `language` (`ru`) puts the name as that language spells it into the aliases. Invalid input rejects.
- **`generateBackground`** (0.12) draws one background for a place.
  - The prompt has nobody in it (`no humans, scenery`, people in the undesired content): the tags of `passportId` (a location or world passport of the chat or of a provider; else the place name), `tags`, and the time of day and weather as tags (tracker words are read like the DES scene: `evening`, `19:40`, `rain`, Russian too). `style` is a saved style by name, else style tags.
  - One 16:9 image within the free budget (1344×768) through the normal pipeline and its Anlas guards: in free-only mode a request that would cost Anlas is refused; otherwise the usual cost confirmation.
  - The image goes into SillyTavern's backgrounds library like ST's own upload (`POST /api/backgrounds/upload`, form field `avatar`) as `maestro-<slug>-<timestamp>.png`; resolves `{ file }` with the name the server stored. The background is not set: the caller does that.
  - On failure: `null`, a toast with the reason and a `requestFailed` event (a declined cost confirmation is `aborted`, without a toast).
- **Maestro places.** With `globalThis.MAESTRO_PLACES` (version 1) scene continuity keys references by place id (`place:<id>`).
  - References bound by name before are still found and move to the id on the next save.
  - The place the story enters becomes current.
  - Without it nothing changes.

## Development

```bash
npm ci
npm run build        # dist/index.js + dist/style.css (dist is committed)
npm test             # vitest
npm run coverage     # domain layer coverage, threshold 90%
npm run lint         # ESLint, including layer boundaries
npm run format:check # Prettier
npm run deploy:local # copy into a local SillyTavern
```

Layers: `ui` / `integration` → `features` → `domain` / `transport` / `core` → `shared`. The `domain` layer is pure and tested without DOM, network or SillyTavern. Everything known about the SillyTavern and NovelAI APIs, with sources, is in [docs/RECON.md](docs/RECON.md); parity with the built-in extension — [docs/PARITY.md](docs/PARITY.md); phase reports — [docs/reports/](docs/reports/); history — [CHANGELOG.md](CHANGELOG.md). Project documentation is in Russian.

## Credits

- Tag list: [a1111-sd-webui-tagcomplete](https://github.com/DominikDoom/a1111-sd-webui-tagcomplete) (MIT), data from Danbooru.
- NovelAI is a product of Anlatan. This project is not affiliated with Anlatan or the SillyTavern team.

## License

[AGPL-3.0](LICENSE)
