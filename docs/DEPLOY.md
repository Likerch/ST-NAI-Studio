# Установка и деплой NAI Studio

NAI Studio состоит из двух частей:

| Часть                                                  | Что это                                                    | Обязательна?                                       |
| ------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------- |
| **Расширение** (`manifest.json`, `dist/`, `src/i18n/`) | UI, сборка запросов, калькулятор Anlas                     | да                                                 |
| **Серверный плагин** (`server/`)                       | прокси к NovelAI, токен читается на сервере из секретов ST | нет, но без него доступна только базовая генерация |

Без плагина расширение работает через встроенный эндпоинт SillyTavern `/api/novelai/generate-image`. Через него проходит только txt2img одной картинкой: без персонажей, img2img, инпейнта, вайбов и стрима, а ошибки NovelAI приходят как голый 500. Подробности — `docs/RECON.md` §4.

Токен NovelAI в браузер не попадает ни в одном режиме.

---

## 1. Токен NovelAI

Достаточно одного из двух мест:

1. **Секреты SillyTavern (рекомендуется):** API Connections → NovelAI → вставить постоянный API-токен (`pst-…`). Его читают и встроенный эндпоинт, и плагин.
2. **Конфиг плагина:** файл `<SillyTavern>/plugins/nai-studio/config.json`:
   ```json
   { "token": "pst-…" }
   ```
   Используется, только если в секретах ST токена нет. Файл в git не попадает (`.gitignore`), установочные скрипты его не перезаписывают.

   Там же — лимит дискового кэша кодировок вайбов: `{ "vibeCacheMb": 200 }` (по умолчанию 200 МБ, папка `plugins/nai-studio/cache/vibes/`, очистка по LRU). Установочные скрипты кэш сохраняют. Файлы токенайзеров для счётчика токенов плагин скачивает с novelai.net один раз и хранит в `cache/tokenizers/`. С версии 0.4.0 плагин также обращается к `text.novelai.net` (маршрут `/text`), если в настройках «Человеческий язык» выбрана текстовая модель NovelAI; это входит в подписку и Anlas не тратит.

---

## 2. Установка расширения

### По URL репозитория (штатно)

SillyTavern → Extensions → Install extension → `https://github.com/Likerch/ST-NAI-Studio`. В репозитории лежат готовые `manifest.json` и собранный `dist/`, сборка на сервере не нужна.

Многопользовательский режим тоже поддерживается: расширение не зависит от пути установки (`public/scripts/extensions/third-party/…` или `data/<user>/extensions/…`).

### Из рабочей копии — `npm run deploy:local`

```bash
npm ci
npm run build
npm run deploy:local
```

Скрипт копирует `manifest.json`, `dist/` и `src/i18n/` в папку расширений, а `server/` — в `plugins/nai-studio`. Куда именно, определяется по первому найденному варианту:

1. `--st <папка SillyTavern>`;
2. переменная окружения `NAIST_ST_DIR`;
3. `.dev/deploy.json` вида `{ "stDir": "../st-local-docker" }` (файл локальный, в git не попадает);
4. по умолчанию — `../st-local-docker`.

Поддерживаются обе раскладки: обычная копия ST (`public/scripts/extensions/third-party`, `plugins/`) и Docker-раскладка с томами `./extensions` и `./plugins`.

Только расширение: `npm run deploy:local -- --extension-only`. Только плагин: `npm run install-server:local`.

После копирования расширения достаточно перезагрузить страницу ST; после копирования плагина нужно перезапустить ST.

---

## 3. Установка серверного плагина

### Windows

```powershell
.\install-server.ps1 -SillyTavern "C:\path\to\SillyTavern"
```

### Linux / macOS / Docker-хост

```bash
./install-server.sh /path/to/SillyTavern
```

Оба скрипта копируют `server/` в `<SillyTavern>/plugins/nai-studio` и сохраняют уже лежащий там `config.json`.

### Включить плагины в SillyTavern

В `config.yaml`:

```yaml
enableServerPlugins: true
```

или переменной окружения `SILLYTAVERN_ENABLESERVERPLUGINS=true` (переменная перекрывает файл). Затем перезапустить SillyTavern.

Признак успешной загрузки — строка в логе сервера:

```
[NAI Studio plugin] ready (secrets: ST, config token: not set)
```

В панели расширения транспорт покажет «Серверный плагин 0.4.1 · токен: из секретов SillyTavern».

### Проверка без UI

```bash
curl -s http://127.0.0.1:8000/api/plugins/nai-studio/health
```

Ожидается `{"ok":true,"version":"0.4.1","tokenSource":"st-secrets"}`.

---

## 4. Сервер в Docker

Если ST работает в Docker с корнем контейнера только для чтения:

- плагин кладётся в смонтированную на хосте папку `plugins/` (скопировать `server/` в `<plugins>/nai-studio`);
- `enableServerPlugins` включается в `config.yaml` или переменной окружения `SILLYTAVERN_ENABLESERVERPLUGINS: "true"` в compose-файле, затем контейнер перезапускается;
- при `enableServerPluginsAutoUpdate: true` ST делает `git pull` для подпапок-репозиториев; плагин, скопированный скриптом (не клоном), автообновление не трогает;
- basic auth совместим: плагин никогда не отвечает HTTP 401, чтобы браузер не сбросил Basic-учётки, ошибки NovelAI приходят как 502 с настоящим статусом внутри;
- обратный прокси с компрессией может буферизовать потоковые ответы — проверить при установке.

```bash
# на машине разработки
npm run build
scp -r server <user>@<host>:<ST>/plugins/nai-studio
# на сервере: включить плагины и перезапустить контейнер
docker compose up -d
```

Расширение ставится по URL репозитория (п. 2).

---

## 5. Замена встроенного Image Generation

Пока встроенное расширение включено, NAI Studio не трогает его команды. Работают только `/nai`, пункт «NAI Studio» в меню-палочке, кнопка у сообщения и пункты в меню карточки. Над вкладками панели висит баннер.

1. При первом запуске NAI Studio один раз переносит настройки встроенного и показывает отчёт. Переносятся префикс, негатив, стили, промпты персонажей (включая `sd_character_prompt` из карточек), изменённые шаблоны, переключатели и видимость. Параметры NovelAI переносятся, если свои ещё не меняли. Стоковые значения SillyTavern не переносятся. Свои уже заданные настройки NAI Studio не затираются. Отчёт потом виден на вкладке «Замена встроенного».
2. На вкладке «Замена встроенного» → «Отключить встроенное и перезагрузить». Встроенное отключается (`/extension-disable stable-diffusion`), страница перезагружается.
3. После перезагрузки `/sd`, `/imagine`, `/img`, `/image`, `/imagine-style`, `/imagine-source`, макросы `{{charPrefix}}` / `{{charNegativePrefix}}`, инструмент `GenerateImage`, интерактивный режим и overswipe обслуживает NAI Studio.
4. Вернуть встроенное — кнопкой «Вернуть встроенное» на той же вкладке или в Manage extensions.

Миграция переносит и переключатели function tool и интерактивного режима встроенного.

---

## 6. Удаление

- Extensions → Manage extensions → NAI Studio → Delete. Кнопка «Clean» удаляет настройки (`extensionSettings.nai_studio`) и данные в IndexedDB.
- Плагин: удалить `<SillyTavern>/plugins/nai-studio` и перезапустить ST.
