# Changelog

Формат — [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/). Версии по фазам ТЗ (`phase-0` … `phase-6`).

## [Unreleased]

## [phase-0] — 2026-10-02

Разведка, кода расширения нет.

### Добавлено
- `.gitignore`: секреты (`Server.txt`, `.env`, `*.key`, `*.pem`), локальные конфиги, кэш вайбов, `node_modules`, сырые снимки `docs/captures/raw/`.
- `docs/RECON.md`: конфигурация локального ST и требования к рабочей установке, полный инвентарь встроенного Image Generation, платформа расширений ST 1.19.0, рендер и санитайз сообщений, API NovelAI (модели, матрица возможностей, сборка payload веб-клиента, UC-пресеты, формула Anlas, Director Tools, стрим, лимиты токенов), сравнение транспортов, 24 расхождения с ТЗ.
- `docs/captures/`: 22 записи живых запросов к NovelAI и `st-transports.json` — бесплатные запросы, 0 Anlas, без токена.
