# NAI Studio

Расширение SillyTavern для генерации изображений в NovelAI: специализированный клиент NovelAI вместо встроенного Image Generation.

**Статус:** Фаза 1 (ядро) из 6. Сейчас работают:

- панель генерации;
- модели V5, V4.5, V4 и V3;
- мультиперсонажные промпты;
- калькулятор Anlas и режим «только бесплатные»;
- инспектор payload и raw-override;
- два транспорта: серверный плагин и встроенный эндпоинт ST.

|                  |                                                |
| ---------------- | ---------------------------------------------- |
| SillyTavern      | 1.19.0+                                        |
| Подписка NovelAI | любая; бесплатные генерации считаются для Opus |
| Языки UI         | русский, английский                            |
| Лицензия         | AGPL-3.0                                       |

## Установка

Подробно — [docs/DEPLOY.md](docs/DEPLOY.md). Коротко:

1. Extensions → Install extension → URL этого репозитория.
2. Токен NovelAI задаётся в SillyTavern: API Connections → NovelAI.
3. Для полного функционала — серверный плагин: `install-server.ps1` / `install-server.sh`, затем `enableServerPlugins: true` и перезапуск ST.

## Разработка

```bash
npm ci
npm run build        # dist/index.js + dist/style.css (dist коммитится)
npm test             # vitest
npm run coverage     # покрытие слоя domain, порог 90%
npm run lint         # ESLint, включая границы слоёв
npm run deploy:local # копия в локальный SillyTavern
```

Архитектура и все сведения об API — в [docs/RECON.md](docs/RECON.md). Слои: `ui → features → domain / transport → shared`. Слой `domain` чистый и тестируется без DOM, сети и SillyTavern.
