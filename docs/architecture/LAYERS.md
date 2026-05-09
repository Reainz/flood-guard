# Dependency Layer Rules

Architectural boundaries are enforced mechanically by `scripts/check_layers.py`.
Violations fail CI. Do not work around the linter — fix the architecture.

## Layer order (left imports right is forbidden)

```
Types → Config → Repo → Service → Runtime → UI
```

Concretely:

```
backend/harvest/models.py      (Types)
    ↓ may be imported by
backend/harvest/irri_tables.py (Config — static data, no I/O)
    ↓ may be imported by
backend/harvest/engine.py      (Repo — reads data, no HTTP)
    ↓ may be imported by
backend/main.py                (Service — FastAPI routes)
    ↓ may be imported by
frontend/src/services/api.js   (Runtime — HTTP calls to service)
    ↓ may be imported by
frontend/src/screens/*.jsx     (UI — render only)
```

## What each layer may and may not do

### Types (`models.py` files)
- ✅ Define Pydantic models, dataclasses, enums, TypedDicts
- ✅ Import from Python stdlib and Pydantic only
- ❌ No I/O of any kind
- ❌ No imports from other layers

### Config (`irri_tables.py`, `crop_calendar.py`, `compensation.py`)
- ✅ Define static lookup tables, constants, hardcoded scientific data
- ✅ Import from Types only
- ❌ No network calls, no file I/O
- ❌ No business logic (that belongs in Repo/Service)

### Repo (`engine.py`, `predictor.py`, `reporter.py`)
- ✅ Implement core algorithms — flood prediction, harvest decision, loss calc
- ✅ Import from Config and Types
- ✅ Read from local cache files
- ❌ No HTTP calls (those live in sources.py at the Service boundary)
- ❌ No FastAPI dependencies

### Service (`main.py`, `sources.py`, `dispatcher.py`)
- ✅ FastAPI route handlers and middleware
- ✅ External HTTP calls (OpenWeatherMap, MRC, Twilio)
- ✅ Cache management
- ✅ Import from Repo, Config, Types
- ❌ No direct Pydantic model definitions (use Types layer)

### Runtime (`frontend/src/services/api.js`)
- ✅ All HTTP calls from frontend to backend
- ✅ Expo Location, Camera, ImagePicker APIs
- ✅ Offline cache logic (localStorage, AsyncStorage)
- ❌ No rendering logic

### UI (`frontend/src/screens/*.jsx`)
- ✅ React components — render only
- ✅ Import from Runtime (api.js) for data
- ❌ No direct fetch() calls
- ❌ No business logic or calculations

## Why these rules exist

When Codex runs multiple parallel tasks, two agents can independently modify
overlapping modules. Strict layer rules mean each agent has a clear, bounded
scope. A harvest engine agent never touches a route handler. A UI agent never
calls OpenWeatherMap. Violations are caught by CI before merge, not by humans
reviewing diffs at 2am before a hackathon demo.
