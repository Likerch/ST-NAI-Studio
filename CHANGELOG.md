# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/). Версии по фазам ТЗ (`phase-0` … `phase-6`).

## [Unreleased]

## [phase-0] — 2026-10-02

Разведка, кода расширения нет.

### Добавлено
- `.gitignore`: секреты (`Server.txt`, `.env`, `*.key`, `*.pem`), локальные конфиги, кэш вайбов, `node_modules`, сырые снимки `docs/captures/raw/`.
- `docs/RECON.md`: конфигурация локального ST и требования к рабочей установке, полный инвентарь встроенного Image Generation, платформа расширений ST 1.19.0, рендер и санитайз сообщений, API NovelAI (модели, матрица возможностей, сборка payload веб-клиента, UC-пресеты, формула Anlas, Director Tools, стрим, лимиты токенов), сравнение транспортов, 25 расхождений с ТЗ и решения пользователя по ним (§8): транспорты — server plugin и штатный эндпоинт, CORS-прокси исключён.
- `docs/captures/`: 27 записей живых запросов к NovelAI и `st-transports.json`, без токена. Бесплатные запросы — 0 Anlas; платные (upscale, encode-vibe, Character Reference, bg-removal) — 73 Anlas с разрешения пользователя.
