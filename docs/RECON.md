# RECON — Фаза 0: разведка

Дата: 2026-10-02. Исполнитель: Claude Code по ТЗ «NAI Studio».
Источник истины по ST — исходники **SillyTavern 1.19.0**, извлечённые из официального образа `ghcr.io/sillytavern/sillytavern:1.19.0` (локальная копия вне репозитория: `st-local-docker/src-1.19.0/`). Ссылки вида `path:line` даны относительно корня ST.
Источник истины по NovelAI — (1) официальная Swagger-спецификация `https://image.novelai.net/docs/doc.json` (снята 2026-10-02), (2) минифицированный бандл веб-клиента `novelai.net/image` (build `7207c1c-production`, снят 2026-10-02), (3) живые HTTP-запросы с ключом пользователя — только бесплатные (см. §3.0 и `docs/captures/`).

Обозначения статуса: ✅ подтверждено, ⚠️ расходится с ТЗ, ❓ не удалось проверить (причина указана), 🔒 ждёт решения/разрешения пользователя.

## Сводка

**Окружение.**
- Локальный ST 1.19.0 поднят в Docker (`127.0.0.1:8010`), ключ NovelAI занесён в его секреты.
- Рабочая установка ST пользователя (отдельный сервер, тоже 1.19.0) учтена как целевая среда; её конфигурация в репозиторий не выносится.
- `minimum_client_version` = **1.19.0**.

**Главные выводы, меняющие архитектуру из ТЗ** (подробно — §5):

1. **CORS-прокси как транспорт не годится** (П-3):
   - токен должен быть в браузере;
   - при включённом basic auth прокси не работает вообще.

   Реально остаются два транспорта: **server plugin** (всё) и **штатный эндпоинт** (только txt2img одной картинкой, зато V5 работает).
2. **ZIP можно не распаковывать** (П-4): `generate-image` с `Accept: application/json` отдаёт base64-картинки JSON-ом. `fflate.unzip` в `SillyTavern.libs` нет; для ZIP Director Tools есть JSZip в ядре.
3. **`messageFormatter` в 1.19.0 есть** (П-5) — инлайн-рендер через официальный хук. Но `blob:`-URL вырезаются DOMPurify, а свои ключи `extra` переезжают в новые свайпы (П-6).
4. **Неизвестные поля NovelAI молча игнорирует** (П-8). `v4_prompt` для V4/V5 действительно обязателен (500 без него). Длинный промпт не отвергается (П-12).
5. **Веб-клиент NovelAI сам дописывает тексты UC-пресета и качества** и шлёт `tag_hint_*`; `ucPreset` и `qualityToggle` больше не используются (П-11). Тексты — §3.7.
6. **Матрица моделей исправлена** (§3.4, П-10):
   - V5 — до 32 персонажей по коду, без SMEA, Variety, вайбов и Precise Reference;
   - инпейнт V5 Curated работает только через V4.5 Curated (свой id отвергается);
   - Precise/Character Reference есть у V4.5 (платно).
7. **Anlas** (§3.10): формула цены извлечена из клиента. Бесплатно для Opus — 1 сэмпл, ≤ 1 МП, ≤ 28 шагов; на V5 ещё нужен `usage.isNegative = false`. **27 бесплатных живых запросов — 0 Anlas; 5 платных (с разрешения) — 73 Anlas.**
8. **Image API официально описан в Swagger** (П-1). CORS у NovelAI открыт всем (П-2).

**Решения пользователя от 2026-10-02** — §8: CORS-прокси и прямой транспорт убраны; ZIP — через JSON-ответы и JSZip; свой i18n-fallback на `en-us.json`; эталоны сравниваются структурно; счётчик токенов сверяется с лимитами веб-клиента; лимит персонажей V5 — 32; платные снимки разрешены (§3.0, §6).

---

## 1. Окружение

Рабочая установка ST пользователя учитывалась как целевая среда: она снята read-only 2026-10-02 с разрешения пользователя, её конфигурация (адреса, пути, настройки безопасности, установленные расширения) в репозиторий не выносится. В требования из неё перешло только общее: ST 1.19.0 в Docker с корнем контейнера только для чтения, возможный basic auth, выключенные серверные плагины и CORS-прокси.

| Параметр | Локальный ST (Docker, машина разработки) | Что важно для расширения | Где подтверждено |
| --- | --- | --- | --- |
| Версия ST | **1.19.0** (образ `ghcr.io/sillytavern/sillytavern:1.19.0`) | `minimum_client_version` = 1.19.0 | `package.json:118` |
| Последний релиз ST на GitHub | 1.19.0 от 2026-09-14 (1.18.0 — 2026-05-03) | — | GitHub API `releases` |
| `enableServerPlugins` | дефолт `false`; для разработки `true` | без него серверного плагина нет, остаётся штатный эндпоинт | `config/config.yaml` |
| `enableServerPluginsAutoUpdate` | для разработки `false` | при `true` ST делает `git pull` подпапок-репозиториев плагинов при старте | `config/config.yaml` |
| `enableCorsProxy` | дефолт `false`; для разработки `true` | транспорт через прокси не нужен (П-3) | `config/config.yaml` |
| `basicAuthMode` | `false` | при `true` CORS-прокси для NovelAI неработоспособен (§2.6); плагин не должен отвечать 401 | `src/util.js:38,88-98` |
| `enableUserAccounts` | `false` | расширение не должно зависеть от пути установки (глобальной или пользовательской) | `public/scripts/extensions.js` |
| `privateAddressWhitelist.enabled` | `false` | при `true` подменяет `http(s).globalAgent`; публичный `image.novelai.net` не блокирует | `src/private-request-filter.js:243-255` |
| `allowKeysExposure` | `false` | браузер не может прочитать ключ NovelAI из секретов — токен живёт только на сервере | `src/endpoints/secrets.js:540-586` |
| Каталог сторонних расширений | глобальный `public/scripts/extensions/third-party/` | — | `docker inspect` mounts |
| URL, по которому браузер грузит расширение | `/scripts/extensions/third-party/<folder>/<manifest.js>` | — | `public/scripts/extensions.js:543,819-826` |
| Доступ к `plugins/` | есть | в Docker с корнем только для чтения плагин кладётся в смонтированную папку | `docker inspect` |
| Сетевой доступ к `image.novelai.net` | есть | — | живые запросы |
| Встроенное Image Generation | включено, не настроено | миграция должна переносить его настройки, включая function tool и интерактивный режим | `data/default-user/settings.json` |
| Порт | `127.0.0.1:8010` | — | compose-файл |
| Ключ NovelAI в секретах ST | ✅ занесён скриптом (с разрешения пользователя), значение не выводилось; `/api/novelai/status` → tier 3 | — | живой запрос к локальному ST |

**Что это значит для транспортов** (подробно в §4):
- без включённых серверных плагинов доступен только штатный эндпоинт; для плагина нужно скопировать `server/` в `<ST>/plugins/nai-studio`, включить `enableServerPlugins` (в `config.yaml` или env `SILLYTAVERN_ENABLESERVERPLUGINS`) и перезапустить ST;
- CORS-прокси при включённом basic auth **неработоспособен в принципе** (§2.6, П-3).

**`minimum_client_version`**: целевая версия 1.19.0 → ставить **`1.19.0`**. Механика: при несовпадении расширение **не загружается**, в «Manage Extensions» показывается ошибка «Requires ST client version …» (`public/scripts/extensions.js:570,580,587-590,658-661`). Значение `null` ставить нельзя: проверяется только `!== undefined` (`:588`).

---

## 2. SillyTavern 1.19.0

### 2.1 Встроенное Image Generation (`public/scripts/extensions/stable-diffusion/`) — полный инвентарь

Файлы: `index.js` (5998 строк), `settings.html`, `manifest.json`, `button.html`, `dropdown.html`, `style.css`, `comfyWorkflowEditor.html`.
Манифест: `display_name` «Image Generation», `loading_order: 10`, `generate_interceptor: "SD_ProcessTriggers"`, `hooks.activate: "init"` (`SD/manifest.json:2-16`). Внутреннее имя расширения (для `disabledExtensions`) — **`stable-diffusion`**; `MODULE_NAME = 'sd'`; ключ настроек — `extension_settings.sd` (`SD/index.js:67-69`).
Далее `SD/` = `public/scripts/extensions/stable-diffusion/`.

#### 2.1.1 Режимы генерации

| Режим | Значение | Триггер в `/sd` | Ключ шаблона в `extension_settings.sd.prompts` | Поведение | Где |
| --- | --- | --- | --- | --- | --- |
| TOOL | -2 | — | `"-2"` | описание параметра function tool | `SD/index.js:113-128,177-180` |
| MESSAGE | -1 | — | `"-1"` | шаблон текста сообщения-результата: `[{{char}} sends a picture that contains: {{prompt}}].` | `:176` |
| CHARACTER | 0 | `you` | `"0"` | LLM пишет теги внешности {{char}}, префикс «full body portrait,» | `:152-160,181` |
| USER | 1 | `me` | `"1"` | внешность {{user}} | `:185` |
| SCENARIO | 2 | `scene` | `"2"` | пересказ сцены | `:186` |
| RAW_LAST | 3 | `raw_last` | `"3"` (не используется) | без LLM: `((last mes)), (scenario:0.7), (description:0.5)` | `:212,2930-2959,3169-3171` |
| NOW | 4 | `last` | `"4"` | теги по последнему сообщению | `:188-210` |
| FACE | 5 | `face` | `"5"` | крупный план лица; форсирует портретный кадр | `:183,3103-3145` |
| FREE | 6 | любой другой текст | — | промпт = текст аргумента | `:2860-2881` |
| BACKGROUND | 7 | `background` | `"7"` | фон; форсирует альбомный кадр, эмитит `FORCE_SET_BACKGROUND` **и** постит сообщение | `:213,3016-3028` |
| CHARACTER_MULTIMODAL | 8 | (0 при `multimodal_captioning`) | `"8"` | подпись аватара мультимодальной моделью | `:130-134,214-216,3232-3267` |
| USER_MULTIMODAL | 9 | (1 при `multimodal_captioning`) | `"9"` | то же для аватара пользователя | там же |
| FACE_MULTIMODAL | 10 | (5 при `multimodal_captioning`) | `"10"` | то же, крупный план | там же |
| FREE_EXTENDED | 11 | (FREE при `free_extend`) | `"11"` | LLM расширяет свободный промпт | `:217,2876-2878` |

- Определение режима: триггер сравнивается с триггер-словами точно, без учёта регистра; иначе FREE (`SD/index.js:2860-2881`).
- Интерактивный режим: regex по сообщению пользователя `/\b(send|mail|imagine|generate|make|create|draw|paint|render|show)\b.{0,10}\b(pic|picture|image|drawing|painting|photo|photograph)\b…(.+)/i` плюс маппинг «you/yourself → CHARACTER, me/myself → USER, face/portrait/selfie → FACE, background/scenery/… → BACKGROUND» (`:162-172,411-427`).
- Инициаторы (не режимы): `command, action, interactive, wand, swipe, tool` (`:104-111`).
- Пайплайн промпта: FREE → `generateFreeModePrompt`; мультимодальные → подпись аватара; остальные → `generateQuietPrompt` + `processReply` (чистка символов вне `[a-zA-Z0-9.,:_(){}<>[\]/\-'|#]`). Окно «отредактировать перед генерацией» показывается для всех режимов, кроме FREE (`:3165-3194,2896-2928`).
- Префикс персонажа не применяется для FREE, BACKGROUND, USER, USER_MULTIMODAL, FREE_EXTENDED (кроме свайпа в чате 1:1) (`:3318-3322`).

#### 2.1.2 Настройки (`extension_settings.sd`, дефолты `SD/index.js:233-363`)

Общие для всех бэкендов (то, что нужно для паритета):

| Ключ | Дефолт | Смысл |
| --- | --- | --- |
| `source` | `'extras'` | бэкенд (24 источника, среди них `novel`) |
| `scale` (min 1 / max 30 / step 0.1) | 7 | CFG |
| `steps` (1/150/1) | 20 | шаги |
| `width`, `height` (64/2048/64) | 512, 512 | размер |
| `sampler`, `scheduler`, `model`, `vae` | `'DDIM'`, `'normal'`, `''`, `''` | |
| `seed` | -1 | -1 = случайный |
| `prompt_prefix` | `'best quality, absurdres, aesthetic,'` | общий префикс; может содержать `{prompt}` (тогда промпт вставляется на его место — это и есть «суффикс»; отдельного поля suffix **нет**) |
| `negative_prompt` | `'lowres, bad anatomy, bad hands, text, error, cropped, worst quality, …'` | общий негатив |
| `style`, `styles` | `'Default'`, `[{name, prefix, negative}]` | стили — пресеты, копирующие prefix/negative в `prompt_prefix`/`negative_prompt` (`:675-804`) |
| `prompts` | `promptTemplates` | шаблоны по режимам |
| `refine_mode` | false | правка промпта перед генерацией |
| `interactive_mode` | false | regex-триггеры в сообщениях пользователя |
| `multimodal_captioning` | false | подпись аватаров |
| `snap` | false | подгонка авто-размеров к известным разрешениям |
| `free_extend` | false | FREE → FREE_EXTENDED |
| `function_tool` | false | регистрировать tool `GenerateImage` |
| `minimal_prompt_processing` | false | облегчённая чистка ответа LLM |
| `wand_visible`, `command_visible`, `interactive_visible`, `tool_visible` | false | видимость сообщения-результата в промпте по инициатору |
| `hr_scale` | 1.0 | для NovelAI — `upscale_ratio` |
| `novel_anlas_guard`, `novel_sm`, `novel_sm_dyn`, `novel_decrisper`, `novel_variety_boost` | false | NovelAI-специфика |
| `character_prompts`, `character_negative_prompts` | `{}` (создаются в рантайме) | персональные промпты по ключу аватара (`:486-492`) |

Остальные ключи — для чужих бэкендов (A1111/ComfyUI/Horde/OpenAI/…): `auto_url`, `comfy_*`, `horde_*`, `openai_*`, `google_*`, `bfl_upsampling`, `stability_style_preset`, `pollinations_enhance`, `clip_skip`, `enable_hr`, `denoising_strength`, `hr_upscaler`, `hr_second_pass_steps`, `restore_faces`, `adetailer_face` — для NovelAI не нужны, при миграции игнорируются.

#### 2.1.3 Слэш-команды (регистрация `SlashCommandParser.addCommandObject(SlashCommand.fromProps(...))`)

| Команда | Алиасы | Аргументы | Возврат | Где |
| --- | --- | --- | --- | --- |
| `/imagine` | `sd`, `img`, `image` | безымянный: `you\|me\|scene\|raw_last\|last\|face\|background` или свободный текст; именованные: `quiet` (bool, false), `gallery` (bool, true), `negative`, `extend`, `edit`, `multimodal`, `snap` (**без эффекта — баг ST**), `processing` (standard/minimal), `seed`, `width`, `height`, `steps`, `cfg`, `skip`, `model`, `sampler`, `scheduler`, `vae`, `upscaler`, `hires`, `scale`, `denoise`, `2ndpass`, `faces` | путь картинки на сервере (без URL-кодирования) или `''` при исключении | `SD/index.js:5492-5724,5384-5450` |
| `/imagine-source` | `sd-source`, `img-source` | имя источника | текущий источник | `:5727-5757` |
| `/imagine-style` | `sd-style`, `img-style` | имя стиля | стиль | `:5759-5785` |
| `/imagine-comfy-workflow` | `icw` | имя workflow | `''` | `:5787-5800` |

Именованные аргументы временно переопределяют настройки и восстанавливаются в `finally` (`:5384-5450,5519-5524`).

#### 2.1.4 Точки входа в UI

- **Wand-меню:** кнопка `#sd_gen` (иконка кисти) в `#sd_wand_container`, выпадашка `#sd_dropdown` с пунктами you/face/me/scene/last/raw_last/background (`SD/button.html`, `SD/dropdown.html`, `SD/index.js:5025-5073`).
- **Кнопка «brush» на сообщении:** разметка в **ядре** — `.mes_button.sd_message_gen.fa-paintbrush` в `.extraMesButtons` (`public/index.html:7416`), видна только при `body.sd` (`public/css/toggle-dependent.css:11-15`). Обработчик расширения: на сообщении с картинкой — новый свайп картинки, на текстовом — генерация по тексту сообщения как FREE; повторный клик отменяет (`SD/index.js:5039,5149-5234`).
- **Overswipe:** свайп вправо на последней картинке генерирует новую при `power_user.image_overswipe === 'generate'` (`:5343-5375`).
- **Настройки:** ящики «Image Generation» и «Image Prompt Templates» в `#sd_container` (`settings.html`).
- **Макросы:** `{{charPrefix}}`, `{{charNegativePrefix}}` (`:5955-5997`).
- **Нет:** кнопки в карточке персонажа (только чекбокс «Shareable»), quick-reply хуков, горячих клавиш.

#### 2.1.5 Куда кладётся результат и видимость ⚠️

- Сохранение: `POST /api/images/upload` с `{image, format, ch_name, filename}`; имя `${charName}_${YYYY-MM-DD@HHhMMmSSsMSms}`, в группе `ch_name` — id группы (`SD/index.js:3439-3446`; `public/scripts/utils.js:1651-1676`).
- **Новое сообщение** (`SD/index.js:4966-5002`): `name` = персонаж (в группе — системное имя), `is_user:false`, `is_system: !<*_visible>` (по умолчанию картинка — **системное** сообщение, в промпт не идёт), `mes` = шаблон MESSAGE, и
  ```js
  extra: { media: [{ url, type: 'image', title: prompt, generation_type, negative, source: 'generated' }],
           media_display: 'gallery', media_index: 0, inline_image: false }
  ```
  затем `MESSAGE_RECEIVED(id,'extension')` → `addOneMessage` → `CHARACTER_MESSAGE_RENDERED` → `saveChat`.
- **Расхождение с ТЗ:** поля `extra.image`, `extra.title`, `extra.image_swipes`, `extra.generationType`, `extra.negative` в 1.19 **устарели** (`public/global.d.ts:113-125`); ядро мигрирует `image`/`image_swipes` в `media[]` при загрузке (`public/script.js:2131-2159`). Актуальная модель — `extra.media[]` + `media_display` (`gallery`/`list`) + `media_index`. Детали рендера — §2.3.
- `inline_image:false` у ST означает «спрятать текст сообщения, показывать только картинку» (класс `.inline_media` → `display:none`) (`public/script.js:2225,2251`; `public/style.css:1538-1540`).
- **Свайпы картинки** (`generateMediaSwipe`, `SD/index.js:5271-5334`): новая генерация добавляется в тот же `extra.media[]`, `media_index` → последний; фиксированный сид на время свайпа заменяется случайным.

#### 2.1.6 NovelAI-путь встроенного расширения

- Клиент шлёт на `/api/novelai/generate-image` ровно: `prompt, model, sampler, scheduler, steps, scale, width, height, negative_prompt, upscale_ratio, decrisper, variety_boost, sm, sm_dyn, seed` (сид опускается при < 0) (`SD/index.js:3963-3987`). Ответ — base64 PNG текстом.
- Модели в списке (`:2457-2488`): `nai-diffusion-4-5-full`, `nai-diffusion-4-5-curated`, `nai-diffusion-4-full`, `nai-diffusion-4-curated-preview`, `nai-diffusion-3`, `nai-diffusion-2`, `nai-diffusion-furry-3`. **V5 во встроенном расширении нет.**
- Сэмплеры: `k_euler_ancestral, k_euler, k_dpmpp_2m, k_dpmpp_sde, k_dpmpp_2s_ancestral, k_dpm_fast, ddim`; расписания: `karras, native, exponential, polyexponential` (`:1888-1898,2537-2539`).
- Anlas-гард: шаги ≤ 28, площадь ≤ 1024×1024 с сохранением пропорций, кратность 64 (`:4021-4064`).
- Баланс: «Anlas» = только `trainingStepsLeft.fixedTrainingStepsLeft` (купленные `purchasedTrainingSteps` игнорируются), «бесплатно» = `perks.unlimitedImageGeneration` (`public/scripts/nai-settings.js:154-160`). ⚠️ **В живом ответе `/user/subscription` для Opus поля `perks.unlimitedImageGeneration` нет** (§3.11) — встроенное расширение всегда покажет «Free image generation: No».

#### 2.1.7 Персональные промпты персонажа (для миграции)

- Локально: `extension_settings.sd.character_prompts[<avatar без расширения>]` и `extension_settings.sd.character_negative_prompts[...]` (ключ — `getCharaFilename(chid)`) (`SD/index.js:882-884,916-932`; `public/scripts/utils.js:1342-1347`).
- В карточке (переезжает с карточкой): `character.data.extensions.sd_character_prompt = { positive, negative }` через `writeExtensionField`; при снятом «Shareable» пишется `null` (`SD/index.js:5236-5260`).
- Приоритет при чтении: локальное значение, иначе из карточки (с копированием в локальное) (`:874-903`).
- Порядок сборки позитива: `prompt_prefix, charPrefix` → вставка промпта на `{prompt}` или в конец → `substituteParams` (`:3324-3332,969-983`). Негатив: `[/sd negative=], [char-negative free-mode], negative_prompt, charNegative` (`:3040,3048,3328-3333`). В группах персональный префикс не используется (кроме FREE с `char`/`{{charPrefix}}`) (`:934-960,3202-3225`).

#### 2.1.8 События и интеграции

- Подписки: `CHAT_CHANGED`, `IMAGE_SWIPED`, `SECRET_WRITTEN/DELETED/ROTATED`, `EXTRAS_CONNECTED` (`SD/index.js:5924-5950`).
- Эмитит: `SD_PROMPT_PROCESSING {prompt, generationType, message, trigger}` (изменяемый объект), `FORCE_SET_BACKGROUND`, `MESSAGE_RECEIVED`, `CHARACTER_MESSAGE_RENDERED`.
- Перехватчик генерации `globalThis.SD_ProcessTriggers` (интерактивный режим) (`:375-436`).
- Function tool: `name:'GenerateImage'`, параметр `{prompt: string}` (описание — шаблон `-2`), `action` → `generatePicture('tool', …)` → `encodeURI(url)` (`:5452-5485`).

### 2.2 `/api/novelai/*` — штатный эндпоинт ST (`src/endpoints/novelai.js`) ⚠️

| Вопрос | Ответ | Где |
| --- | --- | --- |
| Хосты | генерация — `https://image.novelai.net/ai/generate-image`; статус — `https://image.novelai.net/user/subscription`; апскейл — **`https://api.novelai.net/ai/upscale`** (старый хост, легаси-тело) | `src/endpoints/novelai.js:10-12,143,314,402` |
| Токен | `readSecret(req.user.directories, SECRET_KEYS.NOVEL)` (`api_key_novel`), в браузер не отдаётся | `:305`; `src/endpoints/secrets.js:17` |
| Принимаемые поля (белый список) | `prompt, model, negative_prompt, width, height, scale, seed, sampler, scheduler, steps, decrisper, sm, sm_dyn, variety_boost, upscale_ratio` — **всё остальное игнорируется** | `:321-376,396` |
| Жёстко зашито | `action:'generate'`, `params_version:3`, `n_samples:1`, `ucPreset:0`, `qualityToggle:false`, `prefer_brownian:true`, `add_original_image:false`, `controlnet_strength:1`, `deliberate_euler_ancestral_bug:false`, `legacy:false`, `legacy_v3_extend:false`, `uncond_scale:1`, `use_coords:false`, `characterPrompts:[]`, пустые `reference_*_multiple` | `:321-376` |
| `v4_prompt` / `v4_negative_prompt` | **всегда** отправляются (даже для V3), только `base_caption`, `char_captions: []`, `use_coords:false`, `use_order:true` | `:361-374` |
| `characterPrompts` / мультиперсонажность | **нет** (пустой массив, координат нет) | `:357` |
| img2img / inpaint / вайбы / Director / encode-vibe | **нет** | — |
| Variety Boost | `skip_cfg_above_sigma = sqrt(w*h/1011712) * (58 для nai-diffusion-4-5*, иначе 19)` | `:14-17,120-129,349-355` |
| Ответ | извлекает первый `.png` из ZIP, отдаёт **base64-строку** (одну картинку) | `:385-398` |
| Ошибки | любой не-2xx от NovelAI → **500** без тела (статус и текст NovelAI теряются, пишутся только в консоль сервера) | `:379-383,436-438` |
| Логи | `console.debug('NAI Diffusion request:', request.body)` — тело запроса (без ключа) уходит в лог сервера | `:313` |
| Проверено вживую | без ключа: `/api/novelai/generate-image` → 400, `/api/novelai/status` → 400 «Bad Request» | живой запрос к локальному ST |

**Вывод для транспорта «штатный эндпоинт»:** доступны только txt2img одной картинкой на любой модели, включая V5 (имя модели пробрасывается как есть), без UC-пресета, качества, персонажей, img2img/inpaint/вайбов/Director/стрима; апскейл — через легаси-эндпоинт на старом хосте (работоспособность не проверялась ❓). Ошибки неинформативны (всегда 500).

### 2.3 Картинки в сообщениях: рендер и санитайз

**Модель данных медиа в 1.19** (`public/global.d.ts:107-151`):
`extra.media: MediaAttachment[]` (`{url, type: 'image'|'video'|'audio', title?, source?: 'api'|'upload'|'generated'|'captioned', generation_type?, negative?, width?, height?, append_title?, captioned?}`), `extra.media_display: 'list'|'gallery'`, `extra.media_index: number`, `extra.inline_image: boolean`, `extra.files[]`.

| Поле из ТЗ | Реальность 1.19.0 | Где |
| --- | --- | --- |
| `extra.image` | ⚠️ устарело. При загрузке чата и в каждом `appendMediaToMessage` переносится в `media[]`. Потом остаётся только геттер, **сеттер ничего не делает**: запись `extra.image = url` молча игнорируется | `public/script.js:2050-2182,2097-2112,7659` |
| `extra.image_swipes` | ⚠️ устарело → `media[]` + `media_display:'gallery'`, само поле удаляется | `public/script.js:2131-2142` |
| `extra.title` | устарело, читается как fallback подписи (`attachment.title \|\| extra.title`) | `public/script.js:2259-2287` |
| `extra.inline_image` | управляет **только отображением**: `false` при наличии медиа прячет текст сообщения. В LLM картинки уходят отдельно — через `oai_settings.media_inlining` (gallery → только `media[media_index]`, list → все) | `public/script.js:2225,2251`; `public/scripts/openai.js:617-644,966-994` |
| Кто рендерит | `appendMediaToMessage(mes, el, scroll)`: шаблон `#message_image_template` → `.mes_img_container` > `img.mes_img` в `.mes_media_wrapper`. В режиме gallery — одна картинка + `.mes_img_swipes` (← i/n →), в режиме list — все подряд. Обёртка **очищается и перезаполняется** при каждом вызове | `public/script.js:2216-2477`; `public/index.html:7683-7711` |

**Пайплайн форматирования текста** (`messageFormatting`, `public/script.js:1800-1968`): (только для не-системных) хук `beforeRegex` → regex-скрипты пользователя → хук `afterRegex` → `fixMarkdown` (если `auto_fix_generated_markdown`, дефолт true) → `encode_tags` (дефолт false) → обёртка кавычек в `<q>` → showdown → хук `afterMarkdown` → `encodeStyleTags` → **DOMPurify** → `decodeStyleTags`.

**DOMPurify 3.4.2**, конфиг для сообщений: `{MESSAGE_SANITIZE:true, ADD_TAGS:['custom-style']}` (`public/script.js:1958-1965`). Глобальные хуки (`public/scripts/chats.js:1903-2050`):
- у ссылок `target="_blank" rel="noopener"`;
- каждый токен `class` → `custom-<token>`, кроме `fa-*`, `note-*`, `monospace`;
- при `forbid_external_media` (дефолт **true**) удаляются `img/video/audio/source/...` с внешним `src` (содержит `://` и не начинается с `location.origin`).

| Что в тексте сообщения | Переживает? | Почему |
| --- | --- | --- |
| `<img src="/user/images/...">` | ✅ да | относительный путь того же origin |
| `<img src="data:image/png;base64,...">` | ✅ да | `data:` разрешён для `img` |
| `<img src="blob:...">` | ⚠️ **нет**: атрибут `src` вырезается | схема `blob:` не проходит `IS_ALLOWED_URI` (`node_modules/dompurify/dist/purify.es.mjs:280`) |
| `<img src="https://чужой.хост/...">` | ❌ удаляется при `forbid_external_media` | хук внешних медиа |
| `data-*` | ✅ без изменений | `ALLOW_DATA_ATTR` |
| `class` | ⚠️ превращается в `custom-…` | хук ST |
| `id` | ✅ без префикса, если не перекрывает свойство `document` | дефолт DOMPurify |
| `style="..."` | ✅ CSS не фильтруется | — |
| `<figure>`, `<details>`, `<summary>`, `<span>` | ✅ | в allowlist |
| свой тег (`<nai-img>`) | ❌ тег удаляется, текст остаётся | не в allowlist |

**Плейсхолдер `[nai:img:<uuid>]` проходит форматирование без изменений** — как текст внутри `<p>`. Showdown превращает `[text]` в ссылку, только если есть определение ссылки (`node_modules/showdown/dist/showdown.js:2813-2862`). Оговорки:
- emoji-парсер `:слово:` съест средний сегмент, если это emoji-ключ (`img` не ключ; `id`, `new`, `ok`, `art`, `abcd` — ключи);
- нельзя ставить `(` сразу после `]` — получится ссылка;
- плейсхолдер могут изменить regex-скрипты пользователя;
- расширение Translate рендерит `extra.display_text` вместо `mes`.

**Следствия для модели хранения ТЗ (Фаза 3):**
1. Рендер через `messageFormatter.addHook(..., {stage:'afterMarkdown'})` покрывает загрузку чата, «show more», правку, свайп, стриминг и `updateMessageBlock`, без подписки на события. Ограничения: хук синхронный и **не вызывается для системных сообщений**.
2. `blob:`-URL из localforage в разметку из хука вставить нельзя (вырежет DOMPurify). Варианты: `src="/user/images/..."` (картинка сохранена на сервере), `data:` URI (тяжело для DOM), либо `data-nai-id` в разметке + подстановка `src` в DOM после рендера. Последний вариант стирается при каждом `updateMessageBlock`, поэтому требует повторной подстановки.
3. `updateMessageBlock` заменяет `innerHTML` всего `.mes_text` (`public/script.js:2033-2044`). Узлы, вставленные в DOM руками, стираются; `.mes_media_wrapper` тоже перерисовывается. Помечать свои элементы `data-*`, а не `class`, и не использовать класс `mes_img`: на него повешен штатный попап ST.
4. **Правка сообщения** меняет только `mes`/`swipes`/`extra.bias`, остальной `extra` сохраняется (`public/script.js:8139-8193`).
5. **Удаление сообщения:** нет события «до удаления» и нет полезной нагрузки (`MESSAGE_DELETED` получает новую длину чата), файлы на сервере не удаляются (`public/script.js:1607-1699`). Подчистку блобов придётся делать сверкой «какие id ещё есть в чате».
6. **Свайпы сообщения:** у каждого свайпа свой `swipe_info[i].extra` (`public/script.js:6926-6939,7011-7015`). При новом свайпе-регенерации ST чистит только свои ключи (`media`, `inline_image`, `title`, …), а **чужие ключи `extra` переезжают в новый свайп** (`public/script.js:10119-10134,10410-10415`) — `extra.nai_images` придётся чистить самим.
7. **Экспорт:** `.jsonl` сохраняет `extra` и `swipe_info` целиком; `.txt` пишет `mes` (плейсхолдер виден текстом), медиа не включает (`src/endpoints/chats.js:679-749`). Картинки, сохранённые только в localforage, при экспорте чата **не переносятся**. Для критерия «Экспорт чата средствами ST сохраняет картинки» нужен `filePath` в `/user/images`.
8. **LLM видит `mes` как есть** (`public/script.js:4500-4506`) → плейсхолдер уйдёт в промпт, если его не вырезать (`symbols.ignore` действует на сообщение целиком, не на фрагмент).
9. **Data Maid** считает «бесхозными» файлы, на которые ссылаются только свои ключи `extra` или неактивные свайпы (`src/endpoints/data-maid.js:177-230,635-644`).

### 2.4 `getContext()` (`public/scripts/st-context.js:115-309`)

Объект собирается заново при каждом вызове; `chatMetadata` — ссылка на `chat_metadata`, который **переприсваивается** при загрузке чата (`public/script.js:7657,7663,8979`), поэтому не кэшировать.

Нужное нам — есть в контексте: `extensionSettings` (:201), `saveSettingsDebounced` (:132), `chatMetadata` (:135), `saveMetadata` (:158), `saveMetadataDebounced` (:136), `writeExtensionField` (:207), `writeExtensionFieldBulk` (:208), `registerFunctionTool`/`unregisterFunctionTool`/`isToolCallingSupported`/`ToolManager` (:183-187), `generateRaw` (:205), `generateQuietPrompt` (:204), `ConnectionManagerRequestService` (:294), `SlashCommandParser`/`SlashCommand`/`SlashCommandArgument`/`SlashCommandNamedArgument`/`SlashCommandEnumValue`/`ARGUMENT_TYPE` (:165-170), `renderExtensionTemplateAsync` (:191), `callGenericPopup`/`Popup`/`POPUP_TYPE`/`POPUP_RESULT` (:195,224-226), `t`/`translate`/`getCurrentLocale`/`addLocaleData` (:214-217), `eventSource`/`eventTypes` (:138-139), `substituteParams` (:163), `macros` (новый движок, :245), `getRequestHeaders` (:129), `uuidv4` (:236), `humanizedDateTime` (:237), `saveChat` (:155), `addOneMessage` (:140), `updateMessageBlock` (:238), `appendMediaToMessage` (:239), `ensureMessageMediaIsArray`/`getMediaDisplay`/`getMediaIndex` (:240-242), `getThumbnailUrl` (:209), `getCurrentChatId` (:128), `getTokenCountAsync` (:151), `isMobile()` — функция (:213), `variables` (:258-277), `symbols.ignore` (:302-304), `messageFormatter` (:246), `loader` (:247), `swipe` (:248-257), `chat`, `characters`, `groups`, `characterId`, `groupId`, `name1`, `name2`, `powerUserSettings`, `accountStorage`.

**Нет в контексте** (придётся импортировать модуль напрямую или обойтись): `enableExtension`/`disableExtension` (`public/scripts/extensions.js:473,490`), неотложенный `saveSettings`, функции секретов (`public/scripts/secrets.js`), `extension_prompt_types`/`roles`, `toastr`/jQuery (глобалы). `registerHelper` в контексте — заглушка («Handlebars for extensions are no longer supported», :178).

### 2.5 `event_types` (`public/scripts/events.js:3-111`)

Полный список — 107 ключей, см. файл. Нужные нам и их аргументы:

| Событие | Значение | Аргументы | Где эмитится |
| --- | --- | --- | --- |
| `APP_READY` | `app_ready` | — (догоняет поздних подписчиков) | `public/script.js:790`; `events.js:113` |
| `EXTENSION_SETTINGS_LOADED` | `extension_settings_loaded` | — | `public/script.js:8024-8025` |
| `CHAT_CHANGED` | `chat_id_changed` | chatId; после `printMessages` | `public/script.js:7698-7700` |
| `MESSAGE_RECEIVED` / `CHARACTER_MESSAGE_RENDERED` | `message_received` / `character_message_rendered` | (messageId, type) | `public/script.js:6691-6693` |
| `MESSAGE_SENT` / `USER_MESSAGE_RENDERED` | | (messageId) | `public/script.js:5910-5919` |
| `MESSAGE_EDITED` | `message_edited` | (id) — **до** перерисовки | `public/script.js:8405` |
| `MESSAGE_UPDATED` | `message_updated` | (id) — **после** перерисовки | `public/script.js:8431,8337` |
| `MESSAGE_DELETED` | `message_deleted` | **новая длина чата**, не id и не сообщение | `public/script.js:1611,1699` |
| `MESSAGE_SWIPED` | `message_swiped` | (mesId) | `public/script.js:10315` |
| `MESSAGE_SWIPE_DELETED` | | {messageId, swipeId, newSwipeId} | `public/script.js:9388` |
| `MORE_MESSAGES_LOADED` | | — | `public/script.js:1474` |
| `IMAGE_SWIPED` | `image_swiped` | {message, element, direction}; только в режиме gallery, до применения | `public/scripts/chats.js:2080-2086` |
| `MEDIA_ATTACHMENT_DELETED` | | (url) | `public/scripts/chats.js:1113` |
| `GENERATION_STARTED` / `STOPPED` / `ENDED` | | | `public/script.js:4299,5618,3532-3537` |
| `CHARACTER_EDITED` / `CHARACTER_DELETED` / `CHARACTER_RENAMED` | | | `public/script.js:9902,10888,7246` |
| `GROUP_UPDATED` | | — | `public/scripts/group-chats.js:1777,2003` |
| `SD_PROMPT_PROCESSING` | `sd_prompt_processing` | эмитит только встроенное SD | `SD/index.js:3055-3057` |
| `SECRET_WRITTEN` / `SECRET_DELETED` / `SECRET_ROTATED` / `SECRET_EDITED` | | | `events.js:88-91` |

`emit` ждёт каждого слушателя по очереди и глотает их ошибки (`public/lib/eventemitter.js:144-152`). При загрузке чата события рендера отдельных сообщений **не** эмитятся (кроме одиночного первого сообщения) (`public/script.js:7703-7706`) → инлайн-рендер нельзя строить только на `*_MESSAGE_RENDERED`.

### 2.6 CORS-прокси ST ⚠️

| Вопрос | Ответ | Где |
| --- | --- | --- |
| Путь | `/proxy/:url(*)`; целевой URL — часть пути. Query-строку браузерного URL Express отбрасывает → URL нужно передавать как `encodeURIComponent(fullUrl)` | `src/server-main.js:257-258`; проверено вживую (suggest-tags с query через прокси → 200) |
| Флаг | `enableCorsProxy` (или `--corsProxy`, или env `SILLYTAVERN_ENABLECORSPROXY`), читается при старте | `src/command-line.js:315` |
| Выключен | 404 с текстом «CORS proxy is disabled…» (POST без CSRF сначала получит 403) | `src/server-main.js:259-264` |
| CSRF | не нужен, **только пока прокси включён** | `src/server-main.js:186-188` |
| Заголовки запроса | пробрасываются все, кроме `x-csrf-token, host, referer, origin, cookie, x-forwarded-*, x-real-ip, sec-fetch-*`; **`Authorization` пробрасывается**; `accept-encoding` принудительно `gzip, deflate, br` | `src/middleware/corsProxy.js:19-33` |
| Тело запроса | только POST/PUT/PATCH, и только как `JSON.stringify(req.body)` → **multipart/бинарные тела не проходят** (уйдёт `{}`) | `corsProxy.js:35-41` |
| Заголовки ответа | **не пробрасываются вообще** (теряются `Content-Type`, `Content-Disposition`) — проверено вживую | `src/util.js:732-779` |
| Статус | копируется, но **401 переписывается в 400** («400 Unauthorized») — проверено вживую: тело `{"statusCode":401,"message":"Unauthorized"}` сохраняется | `src/util.js:741-743` |
| Тело ответа | 2xx — стримится `pipe()` без буферизации; не-2xx — буферизуется текстом | `src/util.js:748-775` |
| SSE | байты проходят насквозь, но `text/event-stream` теряется → `EventSource` не работает, только `fetch` + ручной разбор потока | там же |
| Ограничения URL | только запрет «кругового» запроса на сам ST; private-address фильтр — только при `privateAddressWhitelist.enabled` | `corsProxy.js:12-16`; `src/private-request-filter.js:243-255` |
| Лимит тела | 500 МБ (глобальный JSON-лимит) | `src/server-main.js:110-111` |
| Таймаут | нет | `corsProxy.js:37-41` |

**Ключевые следствия:**
1. Через CORS-прокси токен NovelAI должен прийти **из браузера** в заголовке `Authorization`. Прочитать ключ из секретов ST браузер не может: `/api/secrets/view` и `/find` закрыты при `allowKeysExposure:false` (дефолт) (`src/endpoints/secrets.js:540-586`).
2. ⚠️ **При `basicAuthMode` CORS-прокси для NovelAI неработоспособен.** `basicAuthMiddleware` стоит перед всеми маршрутами, включая `/proxy`, и требует `Authorization: Basic …`. Заголовок `Authorization: Bearer <токен NAI>`, выставленный из JS, заменяет автоматически подставляемые браузером Basic-учётки → ST отвечает `401` с `WWW-Authenticate` (браузер может показать окно логина) (`src/middleware/basicAuth.js:23-44`; `src/server-main.js:141-150`). Обходного пути нет: другой заголовок прокси не превратит в `Authorization`.
3. Обратное тоже плохо: если запрос идёт без своего `Authorization`, прокси **пересылает в NovelAI Basic-учётки ST** (`corsProxy.js:19-27` их не вычищает).

См. противоречие П-3 в §5.

### 2.7 Серверные плагины

| Вопрос | Ответ | Где |
| --- | --- | --- |
| Флаг | `enableServerPlugins` (дефолт false); `enableServerPluginsAutoUpdate` (дефолт true — делает `git pull` для подпапок-репозиториев при старте) | `src/plugin-loader.js:10-11,46-48,237-293` |
| Расположение | `<корень ST>/plugins/` (в Docker `/home/node/app/plugins`) | `src/server-main.js:312-313` |
| Форматы | файл `.js/.cjs/.mjs` или папка с `package.json` `main`, иначе `index.js/.cjs/.mjs`; грузится через `import()` (ESM, т.к. корень ST `"type":"module"`) | `src/plugin-loader.js:24-31,72-77,101-140,152-153` |
| Контракт | `export const info = {id, name, description}` (строки; `id` по `/^[a-z0-9_-]+$/`, уникальный); `export async function init(router)`; опционально `export async function exit()` | `src/plugin-loader.js:167-228` |
| Базовый путь | `/api/plugins/<id>`; монтируется, только если после `init` в роутере есть маршруты | `src/plugin-loader.js:214-223` |
| Middleware | все глобальные: helmet, compression, JSON 500 МБ, auth/whitelist, сессия → `request.user`, **CSRF для не-GET**, `requireLogin`, `multer(...).single('avatar')` | `src/server-main.js:104-269` |
| Пользователь и данные | `request.user = {profile, directories}` (`directories.root`, `userImages`, `characters`, …) | `src/users.js:957-963,1007-1011`; `src/constants.js:16-48` |
| Секреты | `readSecret(directories, key)` экспортирован; из `plugins/<name>/index.mjs` — `import { readSecret, SECRET_KEYS } from '../../src/endpoints/secrets.js'` | `src/endpoints/secrets.js:428-450` |
| Ошибка в `init` | логируется, плагин не монтируется, ST работает | `src/plugin-loader.js:156-159` |
| Опасность | отклонённый промис в async-обработчике Express 4 → `uncaughtException` → **ST завершается**; каждый обработчик обязан ловить ошибки | `src/server-main.js:332-335` |
| SSE из плагина | глобальный `compression()` будет gzip-ить `text/event-stream` → нужен `Cache-Control: no-transform` или `res.flush()` | `node_modules/compression/index.js:91,293-299` |
| Исходящие запросы | `node-fetch`/`http.globalAgent` идут через `requestProxy` и private-фильтр; встроенный `fetch` Node (undici) их обходит | `src/server-main.js:337-351` |
| Проверено вживую | `POST /api/plugins/nai-studio/health` без плагина → 404 (HTML) | живой запрос к локальному ST |

### 2.8 `messageFormatter` ⚠️ (в ТЗ: «только в staging»)

**Есть в 1.19.0**: `getContext().messageFormatter` (`public/scripts/st-context.js:246`; `public/scripts/message-formatter.js:107,259`).
- `addHook(fn, { stage = 'afterMarkdown', order = 50 })`; стадии `beforeRegex`, `afterRegex`, `afterMarkdown`; порядок 0…100 (`message-formatter.js:27-31,88-94,184-189`).
- `fn(mes, ctx)` **обязана быть синхронной** (async → TypeError при регистрации) и вернуть строку; ошибки ловятся (`:185-187,206-216`).
- Хуки выполняются **до DOMPurify** и **только для не-системных сообщений** (`public/script.js:1822-1832,1855,1866,1890,1948`).
- `removeHook` **нет**. В `ctx` поле называется `ch_name`, а не `characterName`, как в JSDoc (`public/script.js:1856` vs `message-formatter.js:42`).

### 2.9 Слэш-команды: перерегистрация `/sd`, `/imagine` ✅

- `addCommandObject` бросает исключение только для зарезервированных префиксов (`/`, `#`, `:`, `parser-flag`, `breakpoint`) (`public/scripts/slash-commands/SlashCommandParser.js:65-73`).
- При конфликте имени/алиаса — `console.trace('WARN: Duplicate slash command registered!')` и **перезапись** ключа (`:78-102`). Реестр — публичный статический объект `SlashCommandParser.commands` (`:44`).
- Перерегистрация `sd` заменяет только ключ `sd`; `imagine`, `img`, `image` останутся за встроенным → для полной замены нужно занять все четыре ключа (+ `sd-source`/`sd-style` при желании).
- API для удаления команды нет (только неофициальный `delete SlashCommandParser.commands[name]`).
- Если встроенное расширение **отключено**, его `init` не вызывается и команды не регистрируются → конфликта нет (`public/scripts/extensions.js:626-637`).
- Порядок загрузки: все манифесты (встроенные и сторонние) сортируются вместе по `loading_order`, затем по `display_name`; активация последовательная, хук `activate` ограничен 5 секундами (`public/scripts/extensions.js:49,571,631-637,447-456`). Регистрация в обработчике `APP_READY` гарантированно идёт после `init` встроенного (если тот уложился в 5 с).

### 2.10 Как программно отключить встроенное Image Generation

- Имя — `"stable-diffusion"` в массиве `extension_settings.disabledExtensions` (`public/scripts/extensions.js:146,626`; `src/endpoints/extensions.js:505-511`).
- `disableExtension(name, reload = true)` экспортирована из `/scripts/extensions.js`, **но не входит в `getContext()`**. Она вызывает хук `disable`, добавляет имя в список (без дедупликации), делает немедленный `saveSettings()` и `location.reload()` (`public/scripts/extensions.js:490-500`). Отключение во время работы невозможно, только через перезагрузку.
- Альтернатива без прямого импорта: слэш-команда `/extension-disable stable-diffusion` (принимает `reload=false`) через `executeSlashCommandsWithOptions` из контекста (`public/scripts/extensions-slashcommands.js:129-169`).
- `disabledExtensions` — ключ ядра, а не чужого расширения. Запись в него не нарушает «не писать в чужие ключи», но делать её только с подтверждением пользователя.

### 2.11 `/api/images/upload`

- Тело `{image: <base64 без data:>, format, filename?, ch_name?}`; `format` ∈ `MEDIA_EXTENSIONS` (png, jpg, jpeg, webp, gif, bmp, jfif + видео/аудио), регистр важен (`src/endpoints/images.js:39-73`; `src/constants.js:528-552`).
- Файл: `data/<user>/user/images/[sanitize(ch_name)/]sanitize(filename).format`; существующий файл **молча перезаписывается**.
- Ответ: `{path: "/user/images/<ch_name>/<file>"}` (с ведущим `/`, без URL-кодирования). Лимит — только 500 МБ JSON.
- Сопутствующие: `/api/images/list {folder,type,sortField,sortOrder}`, `/api/images/folders`, `/api/images/delete {path}` (`images.js:80-155`).

### 2.12 Expressions и другие эндпоинты для «сделать фоном / аватаром»

- **Список эмоций по умолчанию** (порядок важен): admiration, amusement, anger, annoyance, approval, caring, confusion, curiosity, desire, disappointment, disapproval, disgust, embarrassment, excitement, fear, gratitude, grief, joy, love, nervousness, optimism, pride, realization, relief, remorse, sadness, surprise, neutral — 28 штук (`public/scripts/extensions/expressions/index.js:46-75`). Fallback — `joy` (`:44`). Свои эмоции хранятся в `extension_settings.expressions.custom` (`^[a-z0-9-_]+$`) (`:1769-1786`).
- **Имена файлов:** метка = имя файла в нижнем регистре до первого `-` или `.` (`joy.png`, `joy-1.png`, `joy.expressive.png`), принимается любой `image/*` (`src/endpoints/sprites.js:126-138`). Несколько спрайтов на метку допускаются (`allowMultiple`, дефолт true).
- **Путь:** `data/<user>/characters/<папка>/`. Папка для показа — **имя** персонажа (`name2`), если нет переопределения `extension_settings.expressionOverrides[{name:<avatar без расширения>, path}]` (`public/scripts/extensions/expressions/index.js:519-520,625-637,2018-2058`). Один уровень подпапок (`Name/costume`).
- Массовая загрузка: `POST /api/sprites/upload-zip` (multipart `name` + `avatar`=zip) (`src/endpoints/sprites.js:186-237`).
- **Фон чата из картинки:** `eventSource.emit(eventTypes.FORCE_SET_BACKGROUND, {url: \`url("${encodeURI(path)}")\`, path})` — фиксирует фон для чата и пишет `chat_metadata.custom_background`/`chat_backgrounds` (`public/scripts/backgrounds.js:14-15,249-261,1695`). Так делает и встроенное SD.

- Спрайты: `POST /api/sprites/upload` (multipart, поле файла `avatar`, текстовые `name` = папка персонажа, `label`, `spriteName`); сохраняется в `data/<user>/characters/<name>/<spriteName><ext>`; одноимённые файлы удаляются (`src/endpoints/sprites.js:18-38,239-289`). Список: `GET /api/sprites/get?name=` (`:118-150`).
- Фон: `POST /api/backgrounds/upload` (multipart `avatar`) → `data/<user>/backgrounds/` (`src/endpoints/backgrounds.js:135-156`).
- Аватар персонажа: `POST /api/characters/edit-avatar` (multipart `avatar` + `avatar_url`, опц. `?crop=`) — данные карточки перезаписываются в новый PNG (`src/endpoints/characters.js:1142-1182`).
- Multipart на сервере ST разбирает глобальный `multer().single('avatar')` → **у любого multipart-запроса (и к плагину) поле файла должно называться `avatar`** (`src/server-main.js:269`).

### 2.13 Секреты ST

- Файл `data/<user>/secrets.json`; формат 1.19: `{ "<key>": [ {id, value, label, active} ] }`, ключ NovelAI — `api_key_novel` (`src/endpoints/secrets.js:8,17,75-98,113-223`).
- Файл читается при каждом обращении (перезапуск не нужен), если запись в формате массива.
- Плоский легаси-формат `{"api_key_novel":"pst-…"}` мигрируется только при старте (`secrets.js:381-418`).
- HTTP: `POST /api/secrets/write {key, value, label}` с CSRF; `read` отдаёт маскированное состояние; `view`/`find` — 403 без `allowKeysExposure` (`secrets.js:511-586`).

### 2.14 Манифест, хуки жизненного цикла, `SillyTavern.libs`, i18n

- Поля манифеста, которые читает загрузчик: `display_name`, `loading_order`, `requires`, `optional`, `dependencies`, `js`, `css`, `version`, `auto_update`, `minimum_client_version`, `i18n`, `hooks`, `generate_interceptor`; `author` берётся из git remote, **`homePage` не читается** (`public/scripts/extensions.js:49-50,580-624,781-877,388-466,1958-2008,2033-2041`).
- `hooks`: допустимы `install`, `update`, `delete`, `clean`, `enable`, `disable`, `activate`. Значение — имя экспортируемой функции JS-модуля; вызывается **без аргументов**, ожидание ограничено 5 с (только предупреждение). `clean` добавляет кнопку «Clean» и вызывается при удалении по чекбоксу (`:385-466,1039-1041,1413-1455,1564-1568`).
- JS грузится как `<script type="module">` с URL `/scripts/extensions/third-party/<folder>/<js>` → относительные импорты внутри бандла считаются от этого URL (для `dist/index.js` путь к `script.js` — `../../../../script.js`) (`:819-838`).
- `SillyTavern.libs` (`public/lib.js:84-138`): `lodash, Fuse, DOMPurify, hljs, localforage, Handlebars, css, Bowser, DiffMatchPatch, Readability, isProbablyReaderable, SVGInject, showdown, moment, seedrandom, Popper, droll, morphdom, slideToggle, chalk, yaml, chevrotain, gzipSync, gzip, sha256`.
  ⚠️ **Из fflate есть только `gzipSync`/`gzip` — `unzip` нет** (`public/lib.js:26`). Для ZIP есть JSZip 3.10.1 в `/lib/jszip.min.js` (ядро грузит его через `await import('../lib/jszip.min.js')`, `public/scripts/utils.js:2072`), либо ответ NovelAI в JSON (§3.2).
- i18n: манифест `i18n: {"ru-ru": "i18n/ru-ru.json", …}`; загружается **только файл текущей локали** и до загрузки скрипта (`public/scripts/extensions.js:848-877`). `addLocaleData` **не перезаписывает** существующие ключи (`public/scripts/i18n.js:22-39`). Английской локали в `public/locales/lang.json` нет: для `en` ядро показывает исходный текст. ⚠️ Схема ТЗ «ключи `naist.<модуль>.<ключ>` + `en-us.json`» через механизм ST для английского не сработает (покажутся сырые ключи) — нужен свой fallback на `en-us.json` (§5, П-7).
- `t`/`translate(text, key)` возвращают `text`, если ключа нет; предупреждения о ненайденных ключах выдаются только при `localStorage.trackDynamicTranslate === 'true'` (`i18n.js:81-111,305-307`). `data-i18n` (`key`, `[attr]key`, через `;`) переводится, в том числе для DOM, добавленного позже (MutationObserver) (`:45-61,153-169`).
- `renderExtensionTemplateAsync('third-party/<folder>', 'templates/x', data)` — Handlebars + DOMPurify + `applyLocale`; при ошибке возвращает `undefined` (`public/scripts/templates.js:60-88`).
- `generateRaw({prompt, systemPrompt, responseLength, prefill, jsonSchema, …})`: структурированный вывод (`jsonSchema`) работает **только для Chat Completion** (`public/script.js:4122-4148,6325-6365`). `generateQuietPrompt` и `generateRaw` никогда не отправляют tools.
- `registerFunctionTool({name, displayName, description, parameters, action, formatMessage, shouldRegister, stealth})`. Tools реально уходят в запрос только для Chat Completion с включённым function calling и при поддерживаемом источнике (`public/scripts/tool-calling.js:269-304,614-700`).
- `writeExtensionField(chid, key, value)`: `chid` — индекс в `characters`. Пишет `data.extensions[key]` в памяти и шлёт `/api/characters/merge-attributes`; сервер делает **deep-merge** (ключи, удалённые из объекта, на сервере останутся — сначала `UNSET_VALUE`) (`public/scripts/extensions.js:2070-2120`; `src/endpoints/characters.js:1288-1293`).
- `saveSettingsDebounced` (1000 мс) отправляет **все** настройки целиком на `/api/settings/save` (`public/script.js:466-470,8051-8103`) — подтверждает ограничение 4 ТЗ: блобы в настройки нельзя.

---

## 3. NovelAI

### 3.0 Методика и журнал живых запросов

- **Веб-клиент с DevTools не использовался**: вход в аккаунт по паролю агенту запрещён. Вместо этого:
  - (а) статический разбор бандла веб-клиента `novelai.net/image` (build `7207c1c-production`, 2026-10-02). Ссылки вида `bundle:<chunk>@<offset>`, где `_app` = `_app-47190d048e3a43ce.js`, `5285`, `2952`, `1601`, `266` — префиксы имён чанков;
  - (б) запросы, **собранные байт-в-байт по логике веб-клиента** в его штатном «legacy JSON» режиме (`debugLegacyImageGenRequest`, `bundle:_app@1549742`);
  - (в) официальная Swagger-спецификация `image.novelai.net/docs/doc.json`.
- **Гард:** перед и после каждого запроса снимался `/user/subscription`; при любом списании скрипт останавливался. Делались только запросы, бесплатные для Opus по формуле клиента (§3.10).
- **Итог бесплатной части: 27 запросов к эндпоинтам генерации (24 успешные генерации + 3 намеренные ошибки), списано 0 Anlas** (баланс до и после — 9646), `usage.percent` остался 100.
- **Платная часть** (разрешена пользователем 2026-10-02, помечена 💰): 5 запросов, **списано 73 Anlas** (9646 → 9573).
- Записи — `docs/captures/<case>.json`: тело запроса без заголовка авторизации, base64 заменён на `<base64 N chars sha256:…>`, статус, заголовки, листинг ZIP, метаданные PNG/WebP. Сами картинки — в `docs/captures/raw/` (в `.gitignore`).

| Кейс | Что проверяет | Результат |
| --- | --- | --- |
| `c02-v45full-txt2img-webclient` | V4.5 Full txt2img, тело веб-клиента | 200, ZIP `image_0.webp` |
| `c03-v5full-txt2img-webclient` | V5 Full txt2img | 200, ZIP `image_0.webp`, `Source: NovelAI Diffusion V5 0ADF9AB7` |
| `c04-v5full-multichar-coords` | V5 Full, 2 персонажа, `use_coords:true`, персональный UC | 200; сервер отразил `char_captions` с `centers` и персональный UC |
| `c05-v45full-multichar-grid` | V4.5 Full, 2 персонажа на сетке | 200 |
| `c06-v45full-img2img` | `action:"img2img"`, strength 0.7 | 200, `request_type: Img2ImgRequest` |
| `c07-v45full-inpaint` | `action:"infill"`, `nai-diffusion-4-5-full-inpainting` + маска | 200, `request_type: NativeInfillingRequest` |
| `c08-v45full-txt2img-st-shape` | **точное тело `/api/novelai/generate-image` ST** | 200, ZIP `image_0.png` |
| `c09-v45full-accept-json` | без `image_format` + `Accept: application/json` | 200, `application/json` `{images:[{image,index,seed}]}`, PNG |
| `c10-v45full-unknown-field` | неизвестное поле в `parameters` | ⚠️ **200**, поле молча проигнорировано (в метаданных его нет) |
| `c11-v45full-no-v4prompt` | V4.5 без `v4_prompt`/`v4_negative_prompt` | ✅ **500** `{"statusCode":500,"message":"Internal Server Error"}` |
| `c12-v3-txt2img-webclient` | Anime V3 txt2img | 200, `Source: Stable Diffusion XL 7BCCAA2C` |
| `c13-v45full-stream-msgpack` | `/ai/generate-image-stream`, `stream:"msgpack"` | 200 `application/msgpack`, 23 кадра (22 `intermediate` + `final`) |
| `c13-v45full-stream-sse` | то же, `stream:"sse"` | 200 `text/event-stream`, `event:`/`data:` с `event_type, samp_ix, step_ix, gen_id, sigma, image` |
| `c15-v45full-overlong-prompt` | промпт ~6400 символов (намного больше 512 T5-токенов) | ⚠️ **200**, без отказа; сервер вернул полный промпт в метаданных |
| `c16-v5curated-inpaint-own-id` | `nai-diffusion-5-curated-inpainting` | **400** `Validation error: model nai-diffusion-5-curated-inpainting doesn't exist` |
| `c17-v5full-inpaint` | `nai-diffusion-5-full-inpainting` | 200 |
| `d-lineart`, `d-sketch`, `d-colorize`, `d-emotion`, `d-declutter`, `d-declutter-keep-bubbles` | `/ai/augment-image`, 832×1216 | все 200, ZIP `image_0.png`, 0 Anlas |
| `st-transports.json` → `t1` | штатный `/api/novelai/generate-image` ST с моделью `nai-diffusion-5-full` | 200, base64 PNG текстом (`Content-Type: text/html`) |
| `t2` | штатный эндпоинт ST, неверная модель | **500 «Internal Server Error»**; настоящая причина (400 validation) — только в логе сервера ST |
| `t3` | CORS-прокси ST, JSON + `Accept: application/json` | 200, тело JSON дошло, **`Content-Type` потерян** |
| `t4` / `t5` | SSE через CORS-прокси / напрямую | через прокси 23 события, первое через 674 мс, разброс 2.8 с — **поток не буферизуется**; напрямую — первое через 557 мс |
| `/user/subscription` на `image.` и `api.` | баланс | `image.`: 200; `api.`: **400** «Please refresh NovelAI.net. If using a third-party tool, update to the image URL.» |

**💰 Платные запросы** (разрешение пользователя 2026-10-02, «всё, с пометкой в RECON»). Каждый запускался с лимитом списания, равным ожидаемой цене; при превышении следующие не запускались.

| Кейс | Что проверяет | Ожидалось по формуле клиента | Списано фактически | Результат |
| --- | --- | --- | --- | --- |
| 💰 `p1-upscale` | `/ai/upscale`, тело веб-клиента, источник 832×1216 | 1 | **1** | 200, ZIP `image_0.png` 1664×2432 (×2); метаданные исходника сохранены |
| 💰 `p2-encode-vibe-v45full` | `/ai/encode-vibe`, V4.5 Full, `information_extracted: 1` | 2 | **2** | 200 `application/binary`, кодировка 48916 байт |
| `p3-v45full-vibe-reuse` | генерация V4.5 Full с кодировкой из p2 в `reference_image_multiple` | 0 | **0** | 200 — ✅ **повторное использование закодированного вайба Anlas не стоит** (критерий Фазы 5) |
| 💰 `p4-v45full-charref` | Character Reference (`director_reference_*`), 512×768 | 12 (7 за генерацию без бесплатного сэмпла + 5) | ⚠️ **5** | 200; сервер списал только надбавку, базовая генерация осталась бесплатной (П-25) |
| 💰 `p5-bg-removal` | `augment-image` `bg-removal`, 832×1216 | 65 | **65** | 200, ZIP из **трёх** PNG (`image_0..2`: masked, generated, blend) |

Итого платная часть: **73 Anlas**.

### 3.1 Хосты и эндпоинты

| Назначение | Метод и URL | Подтверждено |
| --- | --- | --- |
| Генерация | `POST https://image.novelai.net/ai/generate-image` | живые запросы; Swagger; `bundle:_app@88330` |
| Генерация со стримом | `POST https://image.novelai.net/ai/generate-image-stream` | c13; `bundle:_app@91860` |
| Вайбы | `POST https://image.novelai.net/ai/encode-vibe` | Swagger; `bundle:_app@90812` (живьём не снят) |
| Director Tools | `POST https://image.novelai.net/ai/augment-image` | d-*; `bundle:_app@90045` |
| Апскейл | `POST https://image.novelai.net/ai/upscale` | Swagger; `bundle:_app@88484` (живьём не снят) |
| Подсказки тегов | `GET https://image.novelai.net/ai/generate-image/suggest-tags?model=&prompt=&lang=en\|jp` | живой запрос **без авторизации** → 200 `{tags:[{tag,count,confidence}]}` |
| Баланс и подписка | `GET https://image.novelai.net/user/subscription` | живой запрос |
| Приоритет | `GET https://image.novelai.net/user/priority` | Swagger |
| Цена запроса | `https://api.novelai.net/ai/generate-image/request-price` | объявлен в клиенте, но **нигде не вызывается** (`bundle:_app@88400`); цена считается на клиенте |
| `api.novelai.net` | — | ✅ подтверждает п. 8 ТЗ: `/user/subscription` → 400 с просьбой перейти на image URL |

- **Заголовки веб-клиента:** `Authorization: Bearer <token>`, `x-correlation-id` (6 символов из `A–Z a–k m–z 1–9`), `x-initiated-at` (ISO-время). `Accept` не шлётся (`bundle:_app@2640814`).
- ⚠️ **CORS:** `image.novelai.net` на preflight и на реальные ответы (включая 401) отдаёт `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers: Authorization, Content-Type`, `Access-Control-Allow-Methods: POST` (для GET — `GET`) — проверено с `Origin: http://127.0.0.1:8010`. Браузер технически **может** ходить в NovelAI напрямую. Запрет идёт только от правила ТЗ «токен не на клиенте» (П-2).
- **Формат ошибок:** `{"statusCode": <int>, "message": "<text>"}`; в Swagger также поле `details`, а у `INVALID_CACHE_KEYS` — `details.invalidKeys`.

### 3.2 Формат ответов

| Эндпоинт | Ответ | Где |
| --- | --- | --- |
| `generate-image` (по умолчанию) | **200** (в Swagger указан 201), `Content-Type: binary/octet-stream`, `Content-Disposition`, тело — **ZIP** с `image_0.png`, при `image_format:"webp"` — `image_0.webp` (deflate). При `n_samples>1` — `image_<i>.*`; сид сэмпла i = seed+i | c02, c08; `bundle:_app@1557499` |
| `generate-image` + `Accept: application/json` | 200 `application/json` `{"images":[{"image":"<base64>","index":0,"seed":N}]}` → **ZIP не нужен** | c09; Swagger |
| `generate-image-stream`, `stream:"msgpack"` | 200 `application/msgpack`: повторяющиеся `[uint32 BE длина][msgpack map]`; `event_type: "intermediate"` (`samp_ix, step_ix, gen_id, sigma, image`) и `"final"` (`samp_ix, image`); ошибка — `"error"` (`message`) | c13; `bundle:_app@1559468` |
| `generate-image-stream`, `stream:"sse"` | 200 `text/event-stream`: `event: intermediate\ndata: {json}\n\n` с теми же полями | c13-sse |
| `augment-image` | 200 ZIP `image_0.png` (stored); у `bg-removal` по бандлу три картинки (masked, generated, blend) | d-*; `bundle:266` |
| `encode-vibe` | бинарная кодировка (`application/binary`), клиент хранит её как base64 | Swagger; `bundle:2952@7551` |
| `upscale` | ZIP с `image*.png` или JSON при `Accept: application/json` | Swagger; `bundle:_app@1560984` |

- **Метаданные**:
  - PNG — tEXt `Title`, `Description`, `Software: NovelAI`, `Source: NovelAI Diffusion V4.5 4BDE2A90`, `Generation_time`, `Comment`. В `Comment` — JSON фактически применённых параметров: `request_type` (`PromptGenerateRequest`/`Img2ImgRequest`/`NativeInfillingRequest`), `v4_prompt`, `v4_negative_prompt`, `uncond_scale: 0`, `signed_hash` и т.д.
  - WebP — **lossless (VP8L)**, ~1.1 МБ. Метаданные в EXIF UserComment (ASCII) как JSON `{"Comment":"<json>", "Source", …}`. Веб-клиент перепаковывает WebP в PNG с tEXt при `preferredImageFormat: "png"` (дефолт) (`bundle:_app@3549257`).
- **Сервер отражает в метаданных только то, что понял**:
  - `ucPreset`, `qualityToggle`, `params_version`, `use_new_shared_trial`, неизвестные поля — **отсутствуют**;
  - `uncond_scale: 1`, присланный ST, отражается как `0`;
  - `tag_hint_*`, `straight_alpha`, `quality_boost`, `upscale` появляются **только у V5**.

### 3.3 Модели (строковые id)

| Модель | id | Inpaint-модель (как в веб-клиенте) | Подтверждено |
| --- | --- | --- | --- |
| V5 Full | `nai-diffusion-5-full` | `nai-diffusion-5-full-inpainting` | c03, c04, c17, t1; `bundle:_app@1652880` |
| V5 Curated | `nai-diffusion-5-curated` (дефолт веб-клиента) | ⚠️ `nai-diffusion-4-5-curated-inpainting`; собственный id `nai-diffusion-5-curated-inpainting` есть в enum клиента, но сервер отвечает **400 «doesn't exist»** | c16; `bundle:_app@1652880` |
| V4.5 Full | `nai-diffusion-4-5-full` | `nai-diffusion-4-5-full-inpainting` | c02, c05–c10, c15 |
| V4.5 Curated | `nai-diffusion-4-5-curated` | `nai-diffusion-4-5-curated-inpainting` | бандл |
| V4 Full | `nai-diffusion-4-full` | `nai-diffusion-4-full-inpainting` | бандл |
| V4 Curated | `nai-diffusion-4-curated-preview` | `nai-diffusion-4-curated-inpainting` | бандл |
| Anime V3 | `nai-diffusion-3` | `nai-diffusion-3-inpainting` | c12 |
| Furry V3 | `nai-diffusion-furry-3` | `nai-diffusion-furry-3-inpainting` | бандл |

- В веб-клиенте V5 Curated/Full — группа «New», остальные — «Legacy: No longer recommended for use» (`bundle:_app@1660639`).
- Хеши в `Source`: V5 Full `657484A5`/`0ADF9AB7`, другие V5 — Curated (`bundle:_app@1662029`).
- «Curated»-набор, которому **не** добавляется `nsfw, ` в UC: V4/V4.5/V5 Curated и их inpainting (`bundle:_app@1651942`).

### 3.4 Матрица возможностей (исправленная по факту)

Источник флагов — `PE(model)` в бандле (`bundle:_app@112507`; V5 `@116891`, V4.5 `@116137`, V4 `@114761`, V3 `@114008`). Флаги inpainting-моделей совпадают с базовой моделью.

| Модель | Персонажей | Координаты | Лимит промпта (токенайзер) | Инпейнт | Vibe Transfer | Char/Precise Reference | Прозрачность | SMEA / DYN | Variety Boost (`skip_cfg_above_sigma`) | `noise_schedule` | `cfg_rescale` | Особое |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V5 Full | ⚠️ **до 32** по коду (маркетинг — «22»); в UI — 32 (решение §8); можно позиционировать даже одного | свободные, x/y с точностью 0.001 | **1471** (Qwen `qwen35_tokenizer.def`); база + все персонажи вместе | ✅ своя модель | ❌ (флаг off) | ❌ (флаг off) | ✅ `straight_alpha`, `tag_hint_transparent_background` | ❌ | ❌ (поле удаляется) | принудительно `karras`, выбор скрыт | ✅ | цена ×1.5; лимит использования Opus (`usage`); autoText (`text:`); max-enhance (`upscaled_enhance`); `nsfw, ` в UC |
| V5 Curated | до 32 | свободные | **703** (Qwen) | ⚠️ через `nai-diffusion-4-5-curated-inpainting` | ❌ | ❌ | ✅ | ❌ | ❌ | `karras` | ✅ | как V5 Full, без `nsfw, ` |
| V4.5 Full | **6** | сетка 5×5 (0.1/0.3/0.5/0.7/0.9) | 512 (T5); база + персонажи | ✅ | ✅ (кодировки, 2 Anlas за кодирование) | ✅ `director_reference_*` (5 Anlas/реф/сэмпл, не бесплатно) | ❌ | ❌ | ✅ σ=58 | karras/exponential/polyexponential (без native) | ✅ | `fur dataset, ` (furry mode), enhance prompt add |
| V4.5 Curated | 6 | сетка 5×5 | 512 (T5) | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ σ=58 | как V4.5 Full | ✅ | без `nsfw, ` |
| V4 Full / Curated | 6 | сетка 5×5 | 512 (T5) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ σ=19 | как V4.5 | ✅ | `legacy_uc` (V4.0) |
| Anime V3 | ❌ (`characterPrompts: []` всё равно шлётся, `v4_*` не шлются) | — | 225 (CLIP) | ✅ | ✅ по изображению: PNG 448×448 + `reference_information_extracted_multiple` + `reference_strength_multiple` | ❌ | ❌ | ✅ / ✅, `autoSmea` при площади ≥ 2166785 | ✅ σ=19 | все 4, включая native | ✅ | `dynamic_thresholding` (Decrisper); сэмплер `ddim_v3` |
| Furry V3 | ❌ | — | 225 (CLIP) | ✅ | ✅ по изображению | ❌ | ❌ | ✅ / ✅ | ✅ σ=19 | все 4 | ✅ | свой словарь тегов, scale по умолчанию 6.2 |

Общее для всех моделей:
- **Сэмплеры** (V4/V4.5/V5): `k_euler_ancestral` (рекомендован), `k_euler`, `k_dpmpp_2s_ancestral`, `k_dpmpp_2m_sde`, `k_dpmpp_2m`, `k_dpmpp_sde`. Для V3 дополнительно `ddim_v3`. `ddim` на V4/V5 подменяется на `k_euler_ancestral` (`bundle:1601@47111`; `bundle:_app@118265-119684`).
- **Дефолты:** 832×1216, 23 шага, n_samples 1; scale — V5 7, V4.5 5, V4 5.5, V3 5, Furry V3 6.2 (`bundle:_app@1656281`).
- **Пресеты размеров** (V4/V4.5/V5, `bundle:1601@44303`):

  | Категория | Портрет | Ландшафт | Квадрат |
  | --- | --- | --- | --- |
  | Normal | 832×1216 | 1216×832 | 1024×1024 |
  | Large | 1024×1536 | 1536×1024 | 1472×1472 |
  | Wallpaper | 1088×1920 | 1920×1088 | — |
  | Small | 512×768 | 768×512 | 640×640 |

  Плюс Custom.
- **Ограничения размера:** кратность 64; площадь ≤ 3145728; бесплатно ≤ 1048576. `n_samples` ограничен площадью: ≤ 360448 px → 8, ≤ 409600 → 6, ≤ 3145728 → 4 (`bundle:1601@55499-57719`). Шаги ≤ 50.
- **`fur dataset` / `background dataset`:** префикс промпта для V4+ (`hasFurryMode`), не отдельный параметр (`bundle:2952@25023`).
- **Comic / многопанельность:** **параметров в API и клиенте нет** (П-20).
- **Фиче-флаги на будущее:** Vibe и Precise Reference для V5 выключены флагами (`vibetransfer:!1` и др.) — это совпадает с идеей ТЗ «включение — правка одной строки».

### 3.5 Тело `generate-image`: как его собирает веб-клиент

**Транспорт тела** ⚠️: по умолчанию веб-клиент шлёт **`multipart/form-data`**: часть `request` — JSON, картинки — отдельные части `image/png` (`image`, `mask`, `ref_multiple_<i>`, `director_ref_<i>`). Для повторно отправляемых картинок вместо данных идут `*_cache_secret_key` (HMAC-SHA256 со случайным ключом сессии); на `400 INVALID_CACHE_KEYS` клиент повторяет запрос с данными (`bundle:_app@1548819-1555898`). Сохранён и **«legacy JSON» режим** (`debugLegacyImageGenRequest`) — обычный JSON с base64. **Все наши живые запросы шли в JSON-режиме и прошли** — для расширения достаточно JSON (через CORS-прокси и штатный эндпоинт другого и не пройдёт).

**Верхний уровень:** `{ input, model, action: "generate"|"img2img"|"infill", parameters, use_new_shared_trial: true }`; `recaptcha_token` — только для триала; `url` — только для custom (`bundle:_app@1556415`).

**Сборка `parameters`** (`generateNormal` `bundle:2952@37012`; санитайзер конструктора запроса `bundle:_app@1549862-1552423`):
1. Дефолты модели: `params_version: 4`, размеры, `scale`, `sampler: "k_euler_ancestral"`, `steps: 23`, `n_samples: 1`, `ucPresetId`, `qualityPresetId`, `autoSmea`, `dynamic_thresholding: false`, `controlnet_strength: 1`, `legacy: false`, `add_original_image: true`, `cfg_rescale: 0`, `noise_schedule: "karras"`, `legacy_v3_extend: false`, `skip_cfg_above_sigma: null`. Для V4+ ещё `use_coords`, `legacy_uc: false`, `normalize_reference_strength_multiple: true`, `inpaintImg2ImgStrength: 1`.
2. Промпт: `input` = промпт + `, ` + quality-теги (только к первому сегменту до `|`). UC = `nsfw, ` (не для Curated и не если в промпте есть «nsfw») + текст пресета + `, ` + UC пользователя (`bundle:_app@816650-817270`, `@1655750`). В промптах персонажей первое `1girl`/`1boy` заменяется на `girl`/`boy`.
3. Сид `floor(2^32·rand − 1)`; при `image`: `sm/sm_dyn = false`, `extra_noise_seed = seed − 1`, для img2img `color_correct: false`.
4. `tag_hint_qt` / `tag_hint_uc_preset` — числовые id пресетов (0 none, 1 standard, 2 heavy, 3 light, 4 humanFocus, 5 furryFocus, 6 lowQualityPlusBadAnatomy, 7 lowQuality, 8 badAnatomy). **`ucPreset` и `qualityToggle` клиент больше не шлёт** — мигрирует их на загрузке.
5. V4+: `v4_prompt = {caption:{base_caption, char_captions:[{char_caption, centers:[{x,y}]}]}, use_coords, use_order:true}`; `v4_negative_prompt = {caption:{base_caption: uc, char_captions:[{char_caption: <персональный UC>, centers}]}, legacy_uc}` (без `use_coords`/`use_order` — сервер ставит false); плюс массив `characterPrompts: [{prompt, uc, center:{x,y}, enabled}]` (только включённые и непустые).
6. Санитайзер:
   - без `image` удаляются `strength`/`noise`; `mask` — только для `infill`;
   - удаляются поля, не разрешённые флагами модели: `noise_schedule`, `cfg_rescale`, `straight_alpha`, `tag_hint_transparent_background` (если не true), `sm`, `sm_dyn`, `skip_cfg_above_sigma` (если нет cfgDelay);
   - `k_euler_ancestral` с не-native расписанием → `deliberate_euler_ancestral_bug: false, prefer_brownian: true`;
   - V5 → `noise_schedule = "karras"`;
   - всегда `image_format = "webp"`; для стрима `stream = "msgpack"`.
7. Variety Boost: `skip_cfg_above_sigma = σ(модели) · sqrt(floor(w/8)·floor(h/8) / (104·152))`, σ = 19 (V3/V4), 58 (V4.5) (`bundle:_app@1551802`). Формула ST `sqrt(w·h/1011712)·σ` эквивалентна при сторонах, кратных 8 (`src/endpoints/novelai.js:120-129`).

**Эталоны для snapshot-тестов Фазы 1:** `docs/captures/c02` (V4.5 Full txt2img), `c03` (V5 Full), `c04` (V5 мультиперсонаж), `c05` (V4.5 мультиперсонаж), `c06` (img2img), `c07` (inpaint), `c12` (V3), `c13-*` (стрим), `d-*` (Director). Это тела, **собранные по коду веб-клиента и принятые сервером**, — не перехваченные из браузера (ограничение §3.0). Порядок ключей внутри `parameters` в веб-клиенте зависит от состояния UI (`[I]` в разборе), поэтому сравнивать надо JSON-структуру, а не байты (П-9).

**`v4_prompt` для V4/V5 обязателен** ✅ — без него 500 (c11). ST шлёт его даже для V3 — сервер принимает.

### 3.6 Персонажи и координаты

- Сетка V4/V4.5: `[0.1, 0.3, 0.5, 0.7, 0.9]`, привязка `u[min(4, max(0, floor(5·x)))]` (`bundle:_app@3545303`). V5 — свободные координаты, округление до 3 знаков (`bundle:5285@548337`).
- `use_coords: false` — «AI's Choice», `true` — «Custom»; позиционирование доступно от 2 персонажей, на V5 — от 1 (`bundle:5285@724989-725838`).
- Порядок слотов для новых персонажей: x = .5, .3, .7, .1, .9 при y = .5 (`bundle:5285@546734`). UC нового персонажа по умолчанию: V4 — `"lowres, aliasing, "`, остальные — `""`.
- Живьём (c04, c05) сервер отразил оба блока `char_captions` с координатами и персональный UC первого персонажа — ✅ критерии Фазы 4 «свои теги и UC у каждого» и «позиции на сетке = координаты в запросе» проверяемы по метаданным.

### 3.7 Пресеты UC и quality-теги (клиент добавляет их сам)

**Quality-суффикс** (`bundle:_app@1654149`):

| Модель | Суффикс |
| --- | --- |
| V5 | standard `very aesthetic, masterpiece, no text`; light `very aesthetic, amazing quality, no text` |
| V4.5 Full | `very aesthetic, masterpiece, no text` |
| V4.5 Curated | `very aesthetic, masterpiece, no text, -0.8::feet::, rating:general` |
| V4 Full | `no text, best quality, very aesthetic, absurdres` |
| V4 Curated | `rating:general, best quality, very aesthetic, absurdres` |
| Anime V3 | `best quality, amazing quality, very aesthetic, absurdres` |
| Furry V3 | `{best quality}, {amazing quality}` |

При прозрачном фоне (V5) к суффиксу добавляется `transparent background, `.

**Пресеты UC** (`bundle:_app@817262-824044`):
- **V5 heavy (= V4.5 Full heavy):** `lowres, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, dithering, halftone, screentone, multiple views, logo, too many watermarks, negative space, blank page`
- **V5 light:** `lowres, bad hands, bad anatomy, artistic error, sepia, white haze, worst quality, very displeasing, jpeg artifacts, 0::ai-generated::`
- **V4.5 Full light:** `lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page`
- **V5 / V4.5 Full humanFocus:** heavy + `, @_@, mismatched pupils, glowing eyes, bad anatomy`
- **V5 / V4.5 Full furryFocus:** `{worst quality}, distracting watermark, unfinished, bad quality, {widescreen}, upscale, {sequence}, {{grandfathered content}}, blurred foreground, chromatic aberration, sketch, everyone, [sketch background], simple, [flat colors], ych (character), outline, multiple scenes, [[horror (theme)]], comic`
- **V4.5 Curated heavy:** `blurry, lowres, upscaled, artistic error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, negative space, blank page`
- **V4.5 Curated light:** `blurry, lowres, upscaled, artistic error, scan artifacts, jpeg artifacts, logo, too many watermarks, negative space, blank page`
- **V4.5 Curated humanFocus:** `blurry, lowres, upscaled, artistic error, film grain, scan artifacts, bad anatomy, bad hands, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, halftone, multiple views, logo, too many watermarks, @_@, mismatched pupils, glowing eyes, negative space, blank page`
- **V4 Full heavy / light:** `blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, multiple views, logo, too many watermarks, white blank page, blank page` / `blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, white blank page, blank page`
- **V4 Curated heavy / light:** `blurry, lowres, error, film grain, scan artifacts, worst quality, bad quality, jpeg artifacts, very displeasing, chromatic aberration, logo, dated, signature, multiple views, gigantic breasts, white blank page, blank page` / `blurry, lowres, error, worst quality, bad quality, jpeg artifacts, very displeasing, logo, dated, signature, white blank page, blank page`
- **Anime V3 heavy / light / humanFocus / none:** `lowres, {bad}, error, fewer, extra, missing, worst quality, jpeg artifacts, bad quality, watermark, unfinished, displeasing, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]` / `lowres, jpeg artifacts, worst quality, watermark, blurry, very displeasing` / heavy + `, bad anatomy, bad hands, @_@, mismatched pupils, heart-shaped pupils, glowing eyes` / `lowres`
- **Furry V3 heavy / light / none:** `{{worst quality}}, [displeasing], {unusual pupils}, guide lines, {{unfinished}}, {bad}, url, artist name, {{tall image}}, mosaic, {sketch page}, comic panel, impact (font), [dated], {logo}, ych, {what}, {where is your god now}, {distorted text}, repeated text, {floating head}, {1994}, {widescreen}, absolutely everyone, sequence, {compression artifacts}, hard translated, {cropped}, {commissioner name}, unknown text, high contrast` / `{worst quality}, guide lines, unfinished, bad, url, tall image, widescreen, compression artifacts, unknown text` / `lowres`

Набор пресетов по моделям: V5 и V4.5 Full — heavy, light, furryFocus, humanFocus, none; V4.5 Curated и V3 — heavy, light, humanFocus, none; V4 и Furry V3 — heavy, light, none.

**autoText (V5):** если в промптах нет `text:`, клиент собирает фразы в кавычках (`"…"`, `“…”`, `「…」`, `'…'`, `‘…’`) из базы и персонажей и дописывает `, teXt: ` + фразы через `\n\n` (`bundle:_app@1056743`). Это механизм «текста в кадре» V5.

### 3.8 Сэмплеры и `noise_schedule`

См. §3.4. Допустимые расписания по сэмплеру: euler, euler_a, dpmpp_2s_a, dpmpp_2m, dpmpp_2m_sde, dpmpp_sde — все четыре (`native, karras, exponential, polyexponential`); для V4/V4.5 — все, кроме native; для V5 — список пуст, в запрос всегда уходит `karras`. Расписание по умолчанию — `karras` (`bundle:_app@118899-119684`).

### 3.9 Variety Boost

Поле — `skip_cfg_above_sigma` (Swagger: «triggers Variety Boost»). Формула — §3.5 п. 7. Для V5 поле **удаляется** (`cfgDelay: false`). Выключенное состояние — `null` для V3/V4/V4.5.

### 3.10 Стоимость в Anlas, бесплатные генерации, лимит V5

Цена считается **на клиенте**, функция `GI` (`bundle:1601@42569-44160`), проверено чтением кода:

```
per  = ceil(2.951823174884865e-6·px + 5.753298233447344e-7·px·steps) × (sm&&sm_dyn ? 1.4 : sm ? 1.2 : 1)   // V3/XL/V4/V4.5/V5
если V5: per ×= 1.5
k    = mask ? (inpaintImg2ImgStrength ?? 1) : image ? strength : 1
y    = max(ceil(per·k), 2);  y > 140 → запрос невалиден
итог = y × (n_samples − бесплатный)
```

- **Бесплатный сэмпл (один на запрос)** — при одновременном выполнении условий (`bundle:_app@1664661`; `bundle:1601@42854`):
  - `!characterRef`, `w·h ≤ 1048576`, `steps ≤ 28`;
  - tier ≥ 3 (Opus) и активная подписка;
  - для моделей с `opusUsageLimit` (V5) — ещё и `usage.isNegative == false`.
- Распространяется на img2img и inpaint (k ≤ 1) и на Director Tools, кроме `bg-removal`.
- **Подтверждено живьём:** 24 генерации (V3/V4.5/V5, txt2img/img2img/inpaint/multichar/stream/Director) — 0 Anlas; upscale — 1, encode-vibe — 2, bg-removal — 65 (ровно по формуле).
- **Надбавки:** +2 за каждый ещё не закодированный вайб; +2 за каждый вайб сверх 4; +5 за каждый Character Reference на каждый сэмпл (`bundle:5285@533575-534494`).
- ⚠️ **Character Reference на сервере дешевле, чем по формуле клиента:** клиент снимает бесплатный сэмпл (`!characterRef` в условии) и ждёт 7 + 5 = 12, а сервер списал 5 — базовая генерация осталась бесплатной (p4). Anlas-гард по формуле клиента будет **переоценивать** цену (безопасная сторона) (П-25).
- **Примеры:**

  | Конфигурация | Anlas за картинку |
  | --- | --- |
  | 832×1216, 23 шага, V4.x | 17 |
  | 832×1216, 23 шага, V5 | 26 |
  | 832×1216, 28 шагов, V4.x | 20 |
  | 832×1216, 28 шагов, V5 | 30 |
  | 1024×1536, 28 шагов, V4.x | 30 |
  | 1024×1536, 28 шагов, V5 | 45 |

- **Апскейл:** 1/2/3/4 Anlas для источника ≤1048576 / ≤1747627 / ≤2446678 / ≤3145728 px, без бесплатного режима (`bundle:1601@43991`).
- **Director Tools:** цена как у V3 при 28 шагах; `bg-removal` = 3×цена + 5, никогда не бесплатно (`bundle:266@103700-104423`).
- **Лимит V5 для Opus** — `subscription.usage = {percent, isNegative, timeUntilNextPercent}`, отдаётся только активным tier ≥ 3 (`bundle:1950@479234`):
  - клиент показывает `isNegative ? 0 : clamp(percent, 0, 100)` %;
  - баннер появляется при `isNegative` или < 5%;
  - скорость восстановления — `round(86400 / timeUntilNextPercent · 10) / 10` % в сутки;
  - оценка числа картинок ≈ `round(17.3 × %)`;
  - живое значение: `percent: 100, isNegative: false, timeUntilNextPercent: 7888` (≈ 11 %/сутки). После 4 генераций V5 процент не изменился (точность — целые проценты).
- **Ретраи веб-клиента:** до 5 раз на 5xx, только если запрос бесплатный (`bundle:2952@35989`).

### 3.11 `/user/subscription` (живой ответ, Opus)

```json
{ "tier": 3, "active": true, "paymentProcessor": "…", "expiresAt": <unix>,
  "perks": { "maxPriorityActions": 1000, "startPriority": 10, "contextTokens": 8192, "unlimitedMaxPriority": true, "moduleTrainingSteps": 10000 },
  "trainingStepsLeft": { "fixedTrainingStepsLeft": 9646, "purchasedTrainingSteps": 0 },
  "accountType": 0, "isGracePeriod": false, "isPaypal": false,
  "usage": { "percent": 100, "isNegative": false, "timeUntilNextPercent": 7888 } }
```

- Anlas = `fixedTrainingStepsLeft + purchasedTrainingSteps` (`bundle:_app@3028409`).
- Tier: 0 — нет/Paper, 1 Tablet, 2 Scroll, 3 Opus.
- Поля `perks.unlimitedImageGeneration` **нет** (ср. §2.1.6).

### 3.12 `encode-vibe` — снято (💰 2 Anlas)

- Тело: `{image: <base64>, model, information_extracted: 0..1, mask?}` (Swagger добавляет `crop_to_mask`, `focus_seed`, `info_extract_seed`). `model` — генерационная модель (custom → V4.5 Full) (`bundle:2952@7551`; Swagger `image.EncodeVibeRequest`).
- Кодируют только V4/V4.5. V3 шлёт сырые картинки. V5 вайбы не поддерживает: импорт вайба переключает модель на V4.5.
- **Использование в генерации (V4.x):** `reference_image_multiple: [<кодировка base64>]`, `reference_strength_multiple: [s]` (нормализация при `normalize_reference_strength_multiple` и Σ|s| > 1), без `reference_information_extracted_multiple`. Для inpaint и при Character Reference вайбы пропускаются (`bundle:2952@28851-30415`).
- **Кэш веб-клиента:** IndexedDB `vibetransfer/vibecache`, ключ — SHA-256 base64-картинки; внутри — по модели (`v4full`, `v4curated`, `v4-5full`, `v4-5curated`, `v5full`, `v5curated`) и по SHA-256 строки `information_extracted:<v>[,mask:…]`. Совпадает с ключом кэша из ТЗ (хеш + модель + IE).
- **Файл `.naiv4vibe`:** `{identifier:"novelai-vibe-transfer", version:1, type, image, id, encodings:{<modelKey>:{<hash>:{encoding, params}}}, name, thumbnail, createdAt, importInfo}` (`bundle:2952@3852`).
- Дефолты: strength 0.6, information_extracted 1 (V4.5 Full — 0.7); максимум 16 вайбов.
- **Живьём** (p2, p3):
  - ответ — `200 application/binary`, 48916 байт (первые байты `489bea09…`);
  - в генерацию кодировка уходит base64-строкой (65224 символа) в `reference_image_multiple`, рядом `reference_strength_multiple: [0.6]`;
  - сервер отразил `reference_information_extracted_multiple: []`, `uncond_per_vibe: true` и **вложил кодировку целиком в метаданные картинки** — PNG/WebP с вайбом заметно тяжелее;
  - повторная генерация с той же кодировкой — 0 Anlas.

### 3.13 `augment-image` (Director Tools) — сняты все 7

- Тело: `{req_type, use_new_shared_trial: true, prompt?, defry?, width, height, image}`. `image` — PNG base64: масштабируется до ≤ 3145728−2000 px; если меньше 1011712 px — увеличивается до ~1 МП (`bundle:_app@1563250`; `bundle:266@109900`).
- `req_type`: `lineart`, `sketch`, `colorize` (`prompt`, `defry` 0–5), `emotion` (`prompt: "<emotion>;;<доп. промпт>"`, `defry` 0–5), `declutter`, `declutter-keep-bubbles`, `bg-removal`. ⚠️ В ТЗ шесть инструментов; фактически их семь (есть `declutter-keep-bubbles`).
- Эмоции инструмента emotion (24): neutral, happy, sad, angry, scared, surprised, tired, excited, nervous, thinking, confused, shy, disgusted, smug, bored, laughing, irritated, aroused, embarrassed, worried, love, determined, hurt, playful (`bundle:266@100814`).
- Живьём:
  - 6 бесплатных инструментов → 200, ZIP с одним `image_0.png`, 832×1216, 0 Anlas, `Comment` = `{req_type}`;
  - 💰 `bg-removal` (p5) → 200, ZIP из трёх PNG (`image_0`–`image_2`), **65 Anlas** — ровно по формуле `3 × 20 + 5`.

### 3.14 `upscale` — снято (💰 1 Anlas)

- Веб-клиент: `POST image.novelai.net/ai/upscale` с телом `{image, model: "nai-diffusion-5-curated", declared_blur_sigma: 0}`, результат ×2, источник до 1536×2048 (`bundle:_app@1560984`; Swagger `image.UpscaleRequest`).
- **Живьём** (p1): 200, ZIP `image_0.png` 1664×2432 из 832×1216, 1 Anlas, PNG-метаданные исходной генерации сохранены.
- ⚠️ ST использует **легаси-вариант** `api.novelai.net/ai/upscale` с `{image, width, height, scale}` (`src/endpoints/novelai.js:402-415`). Работает ли он сегодня, не проверено. Учитывая, что `api.novelai.net` отвергает `/user/subscription`, вероятно, нет.

### 3.15 Стриминг

- Веб-клиент стримит для V4/V4.5/V5 (не для V3) через msgpack-кадры. Первые 5 шагов по умолчанию не показывает (`bundle:2952@33570`; `bundle:_app@1559468`).
- Сервер умеет и **SSE** (c13-sse).
- Через CORS-прокси ST поток приходит постепенно (t4), но без `Content-Type` — разбирать вручную через `fetch` + `getReader()`.
- В промежуточных кадрах `image` — base64 превью; в `final` — итоговая картинка; поле `gen_id` одно на запрос.

### 3.16 Лимиты токенов

V5 Full — 1471, V5 Curated — 703 (токенайзер Qwen, файл `https://novelai.net/tokenizer/compressed/qwen35_tokenizer.def?v=2&static=true`); V4/V4.5 — 512 (T5); остальные — 225 (CLIP) (`bundle:_app@1664999-1666041`, `@3603820`). Для V4+ считается сумма базы и всех персонажей; UC — отдельно. Превышение в веб-клиенте — только предупреждение. ⚠️ Сервер длинный промпт **не отвергает** (c15) — П-12.

---

## 4. Транспорты: что реально доступно

| Возможность | Server plugin (свой) | CORS-прокси ST | Штатный `/api/novelai/generate-image` |
| --- | --- | --- | --- |
| Где работает сегодня | локально (включено); на бою — после установки и `enableServerPlugins: true` | локально (включено); ⚠️ **на бою невозможен** из-за basic auth (§2.6) | везде, без настройки |
| Откуда берётся токен | `readSecret()` на сервере ✅ | ⚠️ **из браузера** (секреты ST браузеру недоступны) | секреты ST ✅ |
| txt2img, все модели (включая V5) | ✅ | ✅ | ✅ (t1: V5 Full) |
| UC-пресет / качество | ✅ (клиент добавляет текст сам) | ✅ | ✅ текстом в `prompt`/`negative_prompt` (`ucPreset` всё равно зашит 0 — на сервере он и так не используется) |
| `n_samples > 1` | ✅ | ✅ | ❌ (зашито 1) |
| Мультиперсонажность / координаты | ✅ | ✅ | ❌ (`characterPrompts: []`, `char_captions: []`) |
| img2img / inpaint | ✅ | ✅ (base64 в JSON) | ❌ |
| Вайбы / Character Reference | ✅ | ✅ | ❌ |
| Director Tools | ✅ | ✅ (ответ — ZIP без Content-Type) | ❌ |
| Апскейл | ✅ (новый эндпоинт) | ✅ | ⚠️ только легаси `upscale_ratio` через `api.novelai.net` (не проверено) |
| Стриминг шагов | ✅ (SSE от NovelAI или свой SSE; нужен `Cache-Control: no-transform`) | ✅ байтами (без Content-Type) | ❌ |
| Баланс / подписка | ✅ | ✅ | ✅ `/api/novelai/status` (полный JSON подписки) |
| Подсказки тегов | ✅ | ✅ (и без токена) | ❌ |
| Диагностика ошибок | ✅ (статус и тело NovelAI) | ⚠️ 401→400, тело сохраняется | ❌ всегда 500 без тела |
| Дисковый кэш вайбов | ✅ | ❌ | ❌ |

> **Решение пользователя (§8): CORS-прокси исключён из транспортов.** Колонка оставлена как зафиксированный факт разведки.

Вывод:
- **На установке без плагина и с basic auth доступен только штатный эндпоинт** (txt2img одной картинкой; UC и качество — текстом).
- Чтобы получить всё остальное, нужен server plugin. CORS-прокси при включённом basic auth не поможет ни при каких настройках.

---

## 5. Расхождения с ТЗ (решения — §8)

| № | ТЗ утверждает | Реальность | Предложение (🔒 = нужно решение) |
| --- | --- | --- | --- |
| П-1 | «Image API официально не документирован», encode-vibe/augment — реверс | Есть официальная Swagger-спецификация `image.novelai.net/docs` со всеми эндпоинтами, включая encode-vibe, augment-image, upscale, stream, suggest-tags (поля без описаний) | Изолированный payload-билдер оставить; Swagger использовать как второй эталон |
| П-2 | «Браузер не ходит в image.novelai.net напрямую — CORS» | CORS разрешён всем (`ACAO: *`) | 🔒 Прямой транспорт из браузера технически возможен, но требует токен на клиенте (запрещено п. 2). Предлагаю **не делать** |
| П-3 | CORS-прокси — второй транспорт, «токен уходит через клиент» | (а) Токен должен лежать в браузере — конфликт с «не хранить токен на клиенте». (б) При `basicAuthMode` прокси **не работает вообще**: Bearer заменяет Basic → 401 от ST. (в) Без своего `Authorization` прокси отправит в NovelAI Basic-учётки ST. (г) Теряются заголовки ответа, 401→400, только JSON-тела | 🔒 Варианты: **(1) убрать CORS-прокси из транспортов** (рекомендую); (2) оставить только как локальный dev-режим с токеном в памяти страницы на сессию и явным предупреждением |
| П-4 | «Распаковка ZIP через `fflate` из `SillyTavern.libs`» | В libs из fflate только `gzip`/`gzipSync`; unzip нет | Генерацию и апскейл запрашивать с `Accept: application/json` (c09: base64 без ZIP); ZIP от `augment-image` разбирать JSZip из `/lib/jszip.min.js` (ядро ST грузит его так же). 🔒 Подтвердить отказ от fflate |
| П-5 | `messageFormatter` «только в staging»; иначе DOM-хуки | Есть в 1.19.0 | Использовать `messageFormatter.addHook` (синхронный, не вызывается для системных сообщений, нет `removeHook`) |
| П-6 | `extra.image`, `extra.title`, `extra.inline_image`, `extra.image_swipes` — модель встроенного | Устарели; актуально `extra.media[]` + `media_display` + `media_index`; `inline_image` — только скрытие текста | Своя модель Фазы 3 (`extra.nai_images[]` + плейсхолдер) жизнеспособна, но: `blob:` в `src` вырезается DOMPurify; свои ключи `extra` переезжают в новый свайп; экспорт чата и Data Maid не знают о localforage (§2.3) → для «экспорт сохраняет картинки» нужен `filePath` в `/user/images` |
| П-7 | i18n: `ru-ru.json` и `en-us.json` через манифест, ключи `naist.*`, `t()` | ST грузит только файл текущей локали, английской локали у ядра нет; `addLocaleData` не перезаписывает ключи; предупреждений о ненайденных ключах по умолчанию нет | 🔒 Свой тонкий слой `t()`: `en-us.json` как fallback внутри бандла, `ru-ru.json` через манифест; проверку «нет ненайденных ключей» делать своим тестом |
| П-8 | «Лишнее поле — 400 или 500, а не “просто проигнорируется”» | Неизвестное поле в `parameters` **молча игнорируется** (c10: 200). Ошибки дают неверные значения (несуществующая модель → 400 validation) и отсутствие обязательного (`v4_prompt` → 500) | Санитайз оставить ради паритета с веб-клиентом и предсказуемости; обоснование в коде поменять |
| П-9 | «JSON в инспекторе побайтово совпадает с эталоном из веб-клиента» | Веб-клиент по умолчанию шлёт multipart, порядок ключей у него зависит от состояния UI, эталоны сняты не из браузера (§3.0) | 🔒 Критерий Фазы 1 сформулировать как «структурное совпадение JSON с эталоном (deep-equal после нормализации порядка ключей)» |
| П-10 | Матрица: V5 до 22 персонажей; V5 Curated — инпейнт через V4.5 Curated; V4.5 «персонажей проверить» | V5: в коде **32** (маркетинг 22); V5 Curated → `nai-diffusion-4-5-curated-inpainting` подтверждено (свой id — 400); V4/V4.5 — 6; V3 — 0; Precise Reference (Character Reference) **есть у V4.5** (платно), у V5 нет; прозрачность — только V5; V5 без SMEA, Variety и выбора расписания | Матрица §3.4 заменяет стартовую из ТЗ. Решено: лимит персонажей V5 в UI — **32** (§8) |
| П-11 | — (ТЗ подразумевает `ucPreset` / `qualityToggle`) | Веб-клиент их больше не шлёт: тексты пресетов и качества добавляет сам, на сервер уходят `tag_hint_qt` / `tag_hint_uc_preset`, которые сервер учитывает только у V5 | Билдер добавляет тексты сам (§3.7); `ucPreset`/`qualityToggle` не отправлять |
| П-12 | «Счётчик токенов не расходится с реальным отказом NovelAI по длине» | Отказа нет: сервер принимает промпт любой длины (c15), лимит молча применяется моделью | 🔒 Критерий переформулировать: «счётчик совпадает с лимитами и токенайзером веб-клиента» (V5 — Qwen, V4.x — T5, V3 — CLIP). Для V5 нужен файл токенайзера с `novelai.net` — сеть только к NovelAI, правило соблюдено |
| П-13 | Условия бесплатных генераций Opus и «новый лимит V5» | Подтверждены формулой и живыми запросами (§3.10): 1 бесплатный сэмпл, ≤ 1048576 px, ≤ 28 шагов, без Character Reference; V5 — ещё `usage.isNegative == false`; V5 дороже ×1.5 | Anlas-гард строится на этой формуле + `usage` |
| П-14 | Апскейл «через соответствующий эндпоинт» | Новый: `image.novelai.net/ai/upscale {image, model, declared_blur_sigma}`, ×2, 1–4 Anlas, без бесплатного режима; у ST — легаси на `api.novelai.net` | Использовать новый; режим «только бесплатные» апскейл блокирует всегда |
| П-15 | Стрим — SSE через плагин, «обратный прокси может резать SSE» | NovelAI умеет и msgpack, и SSE. Через CORS-прокси ST SSE проходит потоком. Обратный прокси с компрессией может буферизовать поток — ❓ проверить при деплое; глобальный `compression()` ST сжимает SSE плагина, если нет `Cache-Control: no-transform` | Плагин: проксировать `stream:"sse"` с `no-transform` и `flush` |
| П-16 | Штатный эндпоинт: «мультиперсонажность — по факту проверки» | Подтверждено: только txt2img, 1 картинка, без персонажей; V5 работает (имя модели пробрасывается); любые ошибки → 500 без тела | Деградация: на штатном транспорте мультиперсонажность, img2img, inpaint, вайбы, Director, стрим — выключенные контролы с подсказкой |
| П-17 | — | Рабочая установка может быть защищена basic auth, с выключенными серверными плагинами и CORS-прокси; встроенное Image Generation может быть включено вместе с function tool, интерактивным режимом и overswipe | Для полного функционала нужно включить серверные плагины (`config.yaml` или env + перезапуск) — описать в `docs/DEPLOY.md`. Takeover должен переносить `function_tool` / `interactive_mode` |
| П-18 | Director Tools — 6 инструментов | 7 (`declutter-keep-bubbles`); `bg-removal` всегда платный (~65 Anlas при 1 МП); эмоций у emotion — 24 | Учесть в UI и в Anlas-гарде |
| П-19 | Comic mode для V5 | Параметров многопанельности в API нет; текст в кадре — через `text:`-блок (autoText) | Comic mode — только на уровне сборки промпта |
| П-20 | Генератор спрайтов «полный набор эмоций Expressions» | У Expressions 28 меток, у Director-emotion 24, наборы пересекаются частично | В Фазе 6 нужна таблица соответствий; спрайты генерировать txt2img/img2img с промптом эмоции, а не только Director-emotion |
| П-21 | `getContext()` вместо прямых импортов | `disableExtension`, функций секретов нет в контексте | Для takeover — `/extension-disable stable-diffusion` через `executeSlashCommandsWithOptions` (без прямого импорта), либо прямой импорт `/scripts/extensions.js` (разрешено п. 3, раз функции нет в контексте) |
| П-22 | Server plugin — просто роуты | Отклонённый промис в async-обработчике **роняет весь ST**; CSRF обязателен для не-GET; multipart — только поле `avatar` | Обёртка `safeRoute` с try/catch вокруг каждого обработчика; клиент шлёт CSRF через `getRequestHeaders()` |
| П-23 | `minimum_client_version` по меньшей из двух версий | Обе — 1.19.0 | `1.19.0` |
| П-24 | — | Встроенное расширение ST показывает «Free image generation: No» для Opus (нет `perks.unlimitedImageGeneration`) и не учитывает купленные Anlas | Информационно; наш калькулятор считает по §3.10 |
| П-25 | — (цена Character Reference) | Клиент считает CR как «без бесплатного сэмпла + 5», сервер списал только 5 (p4) | Anlas-гард оставить по формуле клиента: она завышает цену, это безопасная сторона. В инспекторе показывать «оценка ≥ фактического» |
| П-26 (Ф2) | Миграция «не затирает» и переносит только настройки пользователя | Новый пользователь ST получает в `extension_settings.sd` значения из `default/content/settings.json`. Они расходятся с дефолтами `SD/index.js`: префикс `best quality, absurdres, masterpiece,` и шаблоны режимов 2 и 7. Без учёта этого миграция приняла бы их за правки пользователя (так и случилось на локальном ST) | Оба набора стоковых значений считаются дефолтами и не переносятся (`SETTINGS_JSON_DEFAULT_*` в `migration.ts`, тест) |
| П-27 (Ф2) | — | Позиционная форма `substituteParams(content, name1, name2)` при экспериментальном движке макросов (в 1.19 он включён по умолчанию) игнорирует переопределение имени. В группе `name2` пустой, поэтому `{{char}}` становится пустой строкой | Текст сообщения-результата собирается через `substituteParamsExtended(…, { char })`, как во встроенном |
| П-28 (Ф2) | — | Перехватчик генерации получает чат без системных сообщений. После интерактивной картинки Regenerate или `/trigger` снова видит последний запрос пользователя и снова рисует. Встроенное ведёт себя так же | Оставлено ради паритета; информационно |
| П-29 (Ф2) | — | NovelAI Erato иногда возвращает служебные токены вида `<\|response_…\|…>`. Встроенная чистка пропускает `\|`, а NovelAI делит промпт по `\|` на сегменты, и теги качества встают не туда | `processReply` удаляет `<\|…>` в обоих режимах (отличие от встроенного в лучшую сторону), тест |
| П-31 (Ф3) | `InlineImage.swipes: string[]` | У каждого альтернативного варианта свои сид, размер и параметры (для лайтбокса, «вариации», метаданных PNG) | `swipes: {blobKey, filePath, mime, meta}[]`; поля верхнего уровня `blobKey`/`filePath`/`meta` из ТЗ зеркалят активный вариант |
| П-32 (Ф3) | Блоб в localforage, `filePath` — «если сохранена» | Для критерия «экспорт чата сохраняет картинки» нужен файл в `/user/images` (§2.3 п. 7); Data Maid может счесть такой файл бесхозным (§2.3 п. 9) | По умолчанию пишутся **оба**: файл на сервер и копия в IndexedDB. Рендер берёт копию из браузера, иначе файл. Оба выключаются в настройках (без копии в браузере файл обязателен) |
| П-33 (Ф3) | Рендер через `messageFormatter` | Хук не вызывается для системных сообщений (§2.8), а результаты генерации по умолчанию системные | Хук + проход по текстовым узлам `.mes_text` для системных сообщений; монтирование компонента — через `MutationObserver` |
| П-34 (Ф3) | Ленивый рендер через `IntersectionObserver` | События пересечения и прокрутки браузер доставляет в цикле отрисовки; в скрытом/неотрисованном окне они не приходят | `IntersectionObserver` + проверка по прокрутке + опрос раз в 750 мс, пока есть незагруженные картинки. Грузятся только картинки в пределах 800 px от экрана |
| П-35 (Ф3) | — | В режиме правки ST плейсхолдер виден текстом `[nai:img:…]` | Так задумано: удаление метки при правке удаляет картинку после сохранения, остальной текст правится свободно |
| П-36 (Ф4) | Парные позы «раскладывают позиции участников» | Взаимодействие в персонажных промптах V4+ задаётся префиксами `source#` / `target#` / `mutual#` к тегу действия (синтаксис документации NovelAI V4; в Фазе 0 не снимался). Это текст промпта, а не поле API (правило 4 не затронуто) | Используется на V4+; на V3 — обычный тег. Вживую: сцена с `source#hug` / `target#hug` принята (200), NovelAI отразил оба блока |
| П-37 (Ф4) | Паспорт хранится в карточке | У персон пользователя карточки нет | Паспорта персон — в `extensionSettings.nai_studio.scene.personaPassports[<аватар персоны>]` |
| П-38 (Ф4) | «Порядок настраивается» в групповых чатах | — | Порядок участников — стрелками в композере (перетаскивание есть на холсте позиций, не в списке) |
| П-39 (Ф4) | — | Правило «никакой кириллицы в исходниках» запрещает русские ключевые слова поз в коде | Ключевые слова поз и парных поз на русском — в `src/data/pose-keywords.json`, подмешиваются при загрузке |
| П-40 (Ф4) | — | NovelAI V4+ ждёт в базовом промпте счётчики персонажей | Автосборка добавляет `2girls, 1boy` и т.п. по слоту «База» паспортов |
| П-30 (Ф2) | Апскейл — Фаза 5 | Встроенное для NovelAI поддерживает `hr_scale` → `upscale_ratio` (и аргумент `/sd scale=`), а критерий Фазы 2 — «в PARITY нет незакрытых строк» | 🔒 Принять перенос в Фазу 5 или сделать минимальный апскейл ×2 сейчас (проверка стоит 1–4 Anlas) |
| П-41 (Ф5) | Director Tools: lineart, sketch, colorize, эмоция, declutter, удаление фона | Веб-клиент NovelAI даёт ещё `declutter-keep-bubbles` (очистка без удаления пустых баблов); `augment-image` отвечает ZIP | 7 инструментов. ZIP разбирает JSZip ядра ST в браузере (П-4); плагин отдаёт ZIP как base64. Бесплатны на Opus все, кроме удаления фона (65 Anlas) |
| П-42 (Ф5) | Результат — «новым свайпом к той же картинке» | У медиа сообщения (`extra.media`) нет свайпов в смысле инлайн-картинок | Инлайн-картинка: новый вариант (`swipes`). Медиа сообщения: элемент добавляется в `extra.media` того же сообщения, `media_display: gallery`, `media_index` указывает на него — ST листает их как галерею. Оригинал не удаляется. В режиме галереи кнопка инструментов работает с показанной картинкой |
| П-43 (Ф5) | Переключатель «сохранить оригинал» | NovelAI перерисовывает всё изображение, и вне маски тоже меняются пиксели | При включённом переключателе результат накладывается на оригинал по маске в браузере (canvas, `destination-out`), как в веб-клиенте |
| П-44 (Ф5) | Аутпейнт — расширение холста с автомаской | Холст больше 1 Мп платный; ТЗ: режим «только бесплатные» зажимает размер | Новые области заливаются серым, маска — новые полосы плюс 16 px внахлёст, стороны кратны 64. В режиме «только бесплатные» холст уменьшается до 1 Мп (редактор показывает итоговый размер), а не блокируется |
| П-45 (Ф5) | Enhance — «связка увеличения и img2img» | Отдельного эндпоинта у NovelAI нет; в веб-клиенте это img2img увеличенной картинки | Картинка масштабируется в браузере (×1 / ×1,5 / ×2) и уходит в img2img с силой, шумом и тем же сидом. В режиме «только бесплатные» размер зажимается до 1 Мп, и диалог честно это пишет |
| П-46 (Ф5) | Кэш кодировок вайбов — на диске у плагина | Нужен ещё и без плагина-в-сети, и без повторной загрузки картинки | Два уровня: IndexedDB браузера (ключ `vibeenc:<хеш>:<модель>:<IE>`) и LRU-кэш плагина на диске (`cache/vibes/`, лимит `vibeCacheMb`, по умолчанию 200). Маршрут `/encode-vibe/lookup` ищет по хешам, не загружая картинок. Кодироваться уходит сохранённый PNG без перекодирования, чтобы хеш плагина совпал с хешем поиска |
| П-47 (Ф5) | Вайбы V5 закрыты фиче-флагом | — | В матрице V5 `vibeTransfer: false`. Библиотека пишет об этом явно; при генерации — один тост, вайбы не отправляются. V3 отправляет сами картинки 448×448, V4/V4.5 — кодировки |
| П-48 (Ф5) | Стриминг только на плагине | Маршруты Фазы 5 появились в плагине 0.2.0; на V3 веб-клиент не стримит | Плагин старее 0.2.0 считается без стрима, апскейла, Director Tools и вайбов (клиент проверяет версию из `/health`). Стрим включается для V4+ при `stream.enabled`. Без плагина — полоса с оценкой по шагам и одноразовая подсказка |
| П-49 (Ф5) | Критерии с платными действиями | Апскейл (1–4 Anlas), удаление фона (65), кодирование вайба (2) без разрешения пользователя не запускаются | Сначала проверены на моках и тестами плагина; после разрешения пользователя — вживую: вайб 2 + 0 при повторе, апскейл 1, удаление фона 65 — прогноз совпал. Удаление фона возвращает три варианта (`masked`, `generated`, `blend`, имена из веб-клиента) — они подписываются в метаданных свайпов |
| П-50 (Ф6) | — | autoText V5 (§3.5) в Фазе 1 не был реализован; место вызова в сохранённых чанках веб-клиента не найдено | Реализован по описанию и коду модуля 46278: фразы в кавычках из базы и персонажей (в порядке чтения при позициях) → `teXt:` в первый сегмент. Применяется **после** тегов качества, чтобы текстовый блок оставался последним. Только V5, переключатель `generation.autoText` (по умолчанию включён, как на сайте) |
| П-51 (Ф6) | Счётчик токенов (П-12: сверка с веб-клиентом) | Токенайзеры веб-клиента — свои реализации поверх файлов `novelai.net/tokenizer/compressed/*.def`; браузер не может взять их напрямую | Qwen (byte-level BPE), T5 (Unigram, нормализатор Precompiled — тождественный, как в клиенте, вычистка весов и `{}[]`, `</s>`), CLIP (BPE 48894 слияний) переписаны по коду клиента. Сверены с эталоном Hugging Face `tokenizers` на 12 промптах — 36 из 36 совпадений. Файлы — через плагин 0.3.0 (дисковый кэш) или CORS-прокси ST, затем IndexedDB; без них — оценка с пометкой «≈». Считается финальный payload (`input` + промпты персонажей; UC отдельно). Текст в кадре V5 показывается отдельно и входит в общий лимит: отдельного лимита в клиенте не найдено |
| П-52 (Ф6) | «Локальная база тегов Danbooru с частотностью и алиасами» | Своей базы у ST и NovelAI нет; NovelAI даёт только `suggest-tags` | 20 000 самых частых тегов из публичного списка Danbooru проекта a1111-sd-webui-tagcomplete (MIT) с алиасами — `src/data/tags.json` (655 КБ, грузится при первом вводе, не входит в бандл). Русские алиасы (~400) составлены вручную — `src/data/tags-ru.json`. Теги качества NovelAI считаются известными. Подсказки NovelAI — через плагин |
| П-53 (Ф6) | Перевод «`generateRaw` со структурированным выводом» | Структурированный вывод работает только на Chat Completion (§2.14). Текстовые модели (NovelAI Erato) JSON-инструкцию не выполняют: вживую ответ был рассуждением о задаче | Chat Completion — `jsonSchema`. Остальные API — few-shot-продолжение («Russian: … / English: …», примеры в `src/data/translate-examples.json`) системным сообщением с prefill «English:», берётся первая строка. Ответы-рассуждения отбраковываются, плохие записи кэша удаляются. Блоки `text:` не переводятся. Оригинал сохраняется в метаданных и при ручном переводе (память сессии) |
| П-54 (Ф6) | «Редактор весов с автоматической конвертацией» | Скобки `{}`/`[]` V3 работают и на V4+; числовые веса `w::…::` — только V4+ | Ctrl+↑/↓ в полях промпта: шаг 0,05 на V4+, уровень скобок на V3. Автоконвертация — только при переходе на V3; веса ≤ 0 там не выражаются и удаляются с сообщением |
| П-55 (Ф6) | Function tool со структурированными аргументами | Tools уходят к модели только на Chat Completion с function calling (§2.14); локально основной API — NovelAI (текст) | Аргументы `characters`, `action`, `mood`, `shot`, `location`, `prompt`. Названы персонажи — сцена собирается из их паспортов (логика композера Фазы 4), иначе — плоский промпт. Anlas-гард пайплайна и cooldown сохранены. Вживую не вызывался (нет Chat Completion), проверен тестами |
| П-56 (Ф6) | Спрайты эмоций: «консистентный персонаж через вайб или референс, альфа на V5» | Вайбы V4/V4.5 и Character Reference платные (2 и 5 Anlas) | Режим по умолчанию бесплатный: нейтральная основа, затем Director «эмоция» на ней (17 из 28 меток, таблица П-20) и img2img 0,6 от основы для остальных. Режим «один сид» — каждая эмоция по внешности с тем же сидом, на V5 с прозрачным фоном. Внешность — паспорт карточки, иначе промпт персонажа. Папка по правилам Expressions, файлы `<метка>.png`, `/api/sprites/upload` |
| П-57 (Ф6) | Comic mode для V5 | Многопанельности в API нет (П-19) | Каждая панель — отдельная генерация в форме панели (≈1 Мп, бесплатно), страница собирается на canvas и отправляется одной картинкой. Сид панели — общий сид + номер. Реплики — блок `text:` панели, считаются отдельно. В диалоге только модели V5 |
| П-58 (Ф6) | Непрерывность сцены | — | Привязка «локация → референс» в `chat_metadata.nai_studio.continuity`. Режим img2img (бесплатно) или вайб через библиотеку (кодирование V4/V4.5 по общим правилам Anlas; V3 — сама картинка; V5 — под флагом). Локация, названная в тексте, становится текущей. Автопривязка не берёт результаты инструментов, спрайты и панели комикса |
| П-59 (Ф6) | Экспорт «всех настроек, пресетов, стилей, поз и глоссария» | Паспорта хранятся в карточках, картинки вайбов — в IndexedDB | Один JSON с версией схемы; картинки вайбов — по желанию (иначе вайбы на чистой установке без картинок). Паспорта переносятся вместе с карточками. Перед импортом — резервная копия, старые схемы мигрируются, более новая отклоняется |
| П-60 (Ф6) | — | Новые маршруты плагина | Плагин 0.3.0: `/tokenizer/:name` (только три файла, дисковый кэш `cache/tokenizers/`) и `/suggest-tags`. Со старым плагином счётчик идёт через CORS-прокси или оценку, подсказки NovelAI отключаются |
| П-61 (Ф7) | Генерация по меткам в тексте ответа (задача пользователя после Фазы 6: заменить микросервис) | Форматов меток несколько, у каждого своё место параметров | Читаются: `<img data-nai='{JSON}'>` (основной; свободный JSON, сущности HTML, `<figure>` с `<figcaption>` → подпись), URL старого микросервиса `…/gen?prompt=…` (подчёркивания → пробелы, `token` отбрасывается, браузер его не запрашивает), `data-iig-instruction` (sillyimages), `[IMG:GEN:{…}]`, `<!--img-prompt="…"-->` (Auto Illustrator). Параметры: prompt, negative, chars (имя, pos, pose, action), ratio, size, model, style, text, caption, spoiler, align, width, seed, steps, scale, sampler, rescale, variety, quality, uc, transparent, location, ref, vibe, count, id; синонимы ключей. Старые форматы выключаются настройкой |
| П-62 (Ф7) | Генерация «во время стриминга» | `MESSAGE_RECEIVED` приходит один раз после стрима; во время стрима меняется только `chat[id].mes` | По `STREAM_TOKEN_RECEIVED` (не чаще 4 раз в секунду) дописанные метки сразу ставятся в очередь (одна генерация за раз). Ключ задания — порядковый номер + параметры генерации без параметров отображения, поэтому дошедший позже `<figcaption>` второй генерации не запускает. На `MESSAGE_RECEIVED` (запасной путь — `GENERATION_ENDED`/`STOPPED`) метки заменяются плейсхолдерами с ожидающими записями, готовые задания переиспользуются. Результат находит запись и в неактивном свайпе; при смене чата отбрасывается — запись остаётся «прерванной» с кнопкой «Повторить». Лимит меток на ответ (лишние удаляются), `continue` учитывает уже вставленные, impersonate и quiet пропускаются. «Меньше минимума» — по желанию иллюстрация самого ответа |
| П-63 (Ф7) | — | HTML-виджеты пользователя (regex-скрипты отображения) ждут `<img …>`; DOMPurify ST добавляет к классам в сообщениях префикс `custom-` | Хук форматтера до regex: плейсхолдер → `<img data-naist-img src="пиксель#naist:id">`. Нетронутый regex-ами — становится обычным компонентом; перестроенный виджетом — только получает `src` (лениво). Неудавшаяся картинка в виджете повторяется по клику. Во время стрима полная метка показывается как `<img>`-заглушка, недописанная скрывается. Стили — с учётом префикса `custom-`. Выключается настройкой |
| П-64 (Ф7) | Перевод RU → EN (Ф6) → «человеческий язык во всём расширении» | NovelAI V3 читает только теги, V4/V4.5 — теги и короткие английские фразы, V5 — прозу (официально EN и JP); кириллицу T5 не читает | Перед каждой генерацией (сцена, персонажи, негатив) описание превращается в промпт под семейство модели: V3 — теги; V4+/V5 — теги, фразы, 1–3 предложения, `Text:` последним. Режимы: авто (русский всегда, английская проза кроме V5), всегда, выключено; русский на V5 как есть — экспериментальный флаг. Бэкенды на выбор: модель чата (`generateRaw`: JSON-схема на Chat Completion, few-shot с prefill на текстовых), профиль Connection Manager (`sendRequest`, `json_schema` для Chat Completion), текстовая модель NovelAI через плагин. Теги сверяются со словарём (точное, алиас, словоформа, часть фразы, опечатка); алиас, который говорит больше тега (`red apple` → apple), остаётся и фразой; запрещённое в негативе убирается из тегов. Кэш в IndexedDB; ошибка LLM — словарный запасной путь с предупреждением. `/nai-translate` оставлен, добавлен `/nai-prompt`; кнопка у полей — «→ Промпт» |
| П-65 (Ф7) | — | Текстовые модели NovelAI доступны по OpenAI-совместимому API и всегда отвечают потоком | Плагин 0.4.0: `POST /text` → `text.novelai.net/oa/v1/chat/completions`, модели `glm-4-6` (все тарифы) и `xialong-v1` (Opus) из белого списка, токен из секретов ST, поток SSE собирается на сервере (рассуждения отбрасываются), 429 повторяется. Anlas не тратит — проверено балансом до и после. Со старым плагином маршрута нет: бэкенд NovelAI недоступен, работает словарный путь |
| П-66 (Ф7) | — | Старый микросервис превышал бесплатный 1 Мп (portrait 2K → 832×1280, платно) | Размер метки: пропорции в бюджете пикселей размера (1K / 2K / 3K, WxH или сторона), кратно 64, в бесплатном режиме — вниз до 1 Мп. В бесплатном режиме шаги ≤ 28 и один вариант; платные картинки по меткам — только при разрешении и с лимитом цены за штуку, без всплывающего подтверждения |
| П-67 (Ф7) | — | Инструкцию для модели чата нужно держать актуальной и не слать её в impersonate/quiet | `setExtensionPrompt` в чате на заданной глубине и роли, с фильтром. Пресеты «обычный язык», «теги», «свой текст» с переменными ({{count}}, {{min}}, {{max}}, {{captionLanguage}}, {{chars}}, {{charsHint}}); имена персонажей с паспортами подставляются. Обновляется на `GENERATION_STARTED` (ST ждёт обработчик до сборки промпта), смене чата и настроек |

---

## 6. Что не сделано в Фазе 0 и почему

1. ~~Платные живые запросы~~ — **выполнены** после разрешения пользователя (§3.0, 💰, 73 Anlas).
2. **Перехват запросов из браузера веб-клиента** не выполнялся: вход в аккаунт NovelAI агенту запрещён. Эталоны собраны по коду клиента (§3.0). Если нужен именно браузерный перехват — пользователь может залогиниться в браузере сам, тогда я сниму сетевые запросы. 🔒
3. **SSE через обратный прокси с компрессией** не проверялся: это задача деплоя.
4. **Легаси-апскейл ST** (`api.novelai.net/ai/upscale`) не проверялся: он платный, а в расширении использоваться не будет (решение П-14).
5. Тег `phase-0` ставится после внесения решений и платных снимков (§8).

---

## 7. Артефакты Фазы 0

- `docs/RECON.md` — этот файл.
- `docs/captures/*.json` — 27 записей живых запросов (из них 4 платных 💰 и p3) + `st-transports.json` (без токена; base64 заменён хешами).
- `docs/captures/raw/` — картинки и сырые ответы (в `.gitignore`, ~48 МБ).
- Вне репозитория:
  - `st-local-docker/` — локальный ST 1.19.0: `docker-compose.yml`, конфиг, данные, исходники `src-1.19.0/`;
  - скрипты разведки (`capture.mjs`, `build-cases.mjs`, `st-transport-tests.mjs`) — во временной папке сессии. Это одноразовые инструменты, не код расширения; при желании их можно перенести в `tools/recon/`.

---

## 8. Решения пользователя (2026-10-02)

| № | Вопрос | Решение | Что меняется относительно ТЗ |
| --- | --- | --- | --- |
| П-3 (и П-2) | CORS-прокси как транспорт; прямой транспорт из браузера | **Убрать** | Транспортов два: **server plugin** (предпочтительный) и **штатный `/api/novelai/generate-image`** (деградация). Файла `transport/cors-proxy.ts` нет. Прямых запросов из браузера в NovelAI нет; токен живёт только на сервере (секреты ST / конфиг плагина) |
| П-4 | Распаковка ZIP через `fflate` | **Отказаться от fflate** | Генерация и апскейл через плагин запрашиваются с `Accept: application/json` (base64 без ZIP). ZIP от `augment-image` разбирается JSZip из `/lib/jszip.min.js` ядра ST (свой парсер не пишем). Штатный эндпоинт и так отдаёт base64 |
| П-7 | i18n | **Свой fallback на `en-us.json`** | Тонкий слой `t()`: `en-us.json` вшит в бандл как fallback, `ru-ru.json` подключается через `i18n` манифеста (механизм ST). Отсутствующие ключи ловит собственный тест, а не консоль ST |
| П-9 | Критерий Фазы 1 «побайтово совпадает с эталоном» | **Структурное совпадение** | Snapshot-тесты сравнивают JSON с эталонами из `docs/captures/` через deep-equal после нормализации порядка ключей |
| П-12 | Критерий Фазы 6 «счётчик не расходится с отказом NovelAI» | **Сверка с лимитами веб-клиента** | Счётчик совпадает с токенайзерами и лимитами веб-клиента: V5 Full 1471 / V5 Curated 703 (Qwen), V4.x 512 (T5), V3 225 (CLIP) |
| П-10 | Лимит персонажей V5 в UI | **32** | Матрица §3.4: V5 Full/Curated — до 32 персонажей; V4/V4.5 — 6 |
| §6 п. 1 | Платные живые снимки | **Разрешены: «всё, с пометкой в RECON»** | Выполнены 5 запросов, списано 73 Anlas, каждый помечен 💰 в §3.0. Выявлено П-25 |
| П-30 (Ф2) | Апскейл встроенного (`hr_scale`) в Фазе 2 или в Фазе 5 | **Фаза 5** (вариант «а») | Строка в `PARITY.md` закрыта как «⏭ Фаза 5». Миграция по-прежнему сообщает, что апскейл не перенесён |
| Порядок фаз | «Не начинать фазу N+1 без подтверждения» | **Фазы 3–6 подряд, без остановок** (2026-10-02) | Отчёт, CHANGELOG и тег — по-прежнему на каждую фазу; итоговые вопросы и платные проверки собираются в конце |

Остальные пункты §5 приняты в предложенном виде.
