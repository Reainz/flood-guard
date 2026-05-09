# Backend Agent Guide

Read `../AGENTS.md` first (root table of contents).
This file covers backend-specific rules only.

## Before touching any backend module

1. Read `../docs/architecture/LAYERS.md` — know which layer you're in
2. Read the feature doc for the module you're changing:
   - `harvest/` → `../docs/features/HARVEST_ENGINE.md`
   - `alerts/` → `../docs/features/ALERT_SYSTEM.md`
   - `proof/` → `../docs/features/LOSS_PROOF.md`
3. Check `../docs/api/ENDPOINTS.md` for the contract you must satisfy

## Module layout rules

Every backend module follows this structure:
```
module/
├── models.py      Types layer — Pydantic models only
├── <data>.py      Config layer — static tables, no I/O
├── engine.py      Repo layer — core algorithm
└── __init__.py    exports only, no logic
```

The route handler lives in `backend/main.py` (Service layer), not in modules.
Modules must never import FastAPI.

## Testing rules

- Every public function in `engine.py` must have a unit test
- Tests live in `tests/<module>/test_<module>.py`
- No network calls in tests — use fixtures from `tests/fixtures/`
- Fixture files: `tests/fixtures/openweather_response.json`, `tests/fixtures/mrc_cache.json`
- Run tests: `pytest tests/ -v --tb=short`

## Adding a new crop type

Use the `add-crop-profile` skill (`.agents/skills/add-crop-profile/`).
Do not manually edit `irri_tables.py` without reading the skill instructions.

## Caching rules

External API responses are cached in `backend/cache/`:
- `openweather_cache.json` — refreshed every 30 minutes
- `mrc_cache.json` — refreshed every 60 minutes

Cache files are git-ignored but pre-populated by `scripts/cache_nasa_data.py`.
Always check `cached: true` in responses and surface it to the frontend.

## Logging rules

- Use Python `logging` module, not `print()`
- Log level: DEBUG for algorithm steps, INFO for API calls, WARNING for cache hits
- NEVER log: lat/lon coordinates, farmer names, phone numbers, field IDs
- Log format: `%(asctime)s %(name)s %(levelname)s %(message)s`

## Environment variables

```bash
OPENWEATHER_API_KEY=        # required for live data
TWILIO_ACCOUNT_SID=         # required for SMS
TWILIO_AUTH_TOKEN=          # required for SMS
TWILIO_FROM_NUMBER=         # required for SMS
CACHE_REFRESH_MINUTES=30    # optional, default 30
```

Never hardcode API keys. Never commit `.env` to git.
