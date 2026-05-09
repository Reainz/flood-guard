# FloodGuard Vietnam — Agent Guide

This file is the **table of contents** for agents working in this repository.
Do not treat it as the complete instruction set. Read the domain doc for the
area you are working in before making any changes.

## What this project is

FloodGuard Vietnam is a mobile-first web application that helps Mekong Delta
farmers make data-driven decisions before, during, and after flood events.
Three core features: harvest scenario decision engine, tiered flood alerts,
and GPS-tagged loss documentation for government compensation claims.

Track 3 entry — Asian Hackathon for Green Future 2026.

## Repository map

```
floodguard/
├── AGENTS.md                  ← you are here (table of contents)
├── docs/
│   ├── architecture/
│   │   ├── OVERVIEW.md        ← system design, data flow, layer rules
│   │   ├── LAYERS.md          ← dependency rules (Types→Config→Repo→Service→UI)
│   │   └── DECISIONS.md       ← ADR log, why we made key choices
│   ├── api/
│   │   └── ENDPOINTS.md       ← all API endpoint contracts
│   └── features/
│       ├── HARVEST_ENGINE.md  ← IRRI model, crop profiles, loss algorithm
│       ├── ALERT_SYSTEM.md    ← threshold logic, SMS delivery, fallback
│       └── LOSS_PROOF.md      ← photo pipeline, compensation calculation
├── backend/
│   ├── AGENTS.md              ← backend-specific agent rules
│   ├── flood/                 ← flood prediction module
│   ├── harvest/               ← harvest decision engine
│   ├── alerts/                ← alert delivery system
│   └── proof/                 ← loss documentation module
├── frontend/
│   ├── AGENTS.md              ← frontend-specific agent rules
│   └── src/
├── scripts/
│   ├── AGENTS.md              ← script safety rules
│   └── cache_nasa_data.py     ← pre-download NASA POWER data
└── .agents/
    └── skills/                ← reusable Codex skills
        ├── add-endpoint/
        ├── add-crop-profile/
        └── write-test/
```

## Domain agent guides — read these before touching that domain

| Area | Read first |
|------|-----------|
| System architecture | `docs/architecture/OVERVIEW.md` |
| Backend modules | `backend/AGENTS.md` |
| Frontend screens | `frontend/AGENTS.md` |
| API contracts | `docs/api/ENDPOINTS.md` |
| Flood prediction | `docs/api/ENDPOINTS.md` |
| Harvest decisions | `docs/features/HARVEST_ENGINE.md` |
| Alert delivery | `docs/features/ALERT_SYSTEM.md` |
| Loss documentation | `docs/features/LOSS_PROOF.md` |
| Scripts / data prep | `scripts/AGENTS.md` |

## Non-negotiable rules (apply everywhere)

- **Never** mutate `IRRI_FLOOD_DAMAGE` or `COMPENSATION_RATES_VND_PER_HA` without
  a corresponding citation update in `docs/features/HARVEST_ENGINE.md`.
- **Never** call an external API in a test. Use fixtures in `tests/fixtures/`.
- **Never** store farmer PII (name, phone, GPS coordinates) in logs.
- **Never** use `git reset --hard` or `git checkout --` unless explicitly asked.
- All loss percentages shown to users must be `round()`ed integers — no decimals.
- Vietnamese strings live in `frontend/src/i18n/vi.json` — no hardcoded UI text.

## Architectural constraint (enforced by linter)

Dependency direction is strictly one-way:

```
Types → Config → Repo → Service → Runtime → UI
```

A module may only import from layers to its left. Violations fail CI.
See `docs/architecture/LAYERS.md` for the full rule set.

## How to run locally

```bash
# Backend
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev

# Tests
pytest tests/ -v

# Expose for demo
ngrok http 8000
```

## Definition of done for any PR

1. Tests pass (`pytest tests/ -v`)
2. No layer violations (`python scripts/check_layers.py`)
3. API contract matches doc in `docs/api/`
4. Vietnamese strings are in `vi.json`, not hardcoded
5. No PII in logs (checked by `scripts/check_pii_logs.py`)
