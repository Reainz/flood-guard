# Architecture Overview

## System summary

FloodGuard Vietnam is a three-tier web application:

```
[React Native / Mobile Web] → [FastAPI Backend] → [External APIs + Static Data]
```

The backend is the authoritative source of truth for all flood and crop logic.
The frontend is a thin display layer — it renders decisions, it does not make them.

## Data flow — end to end

```
Farmer opens app
  ↓
Frontend calls GET /flood-status?lat=&lon=
  ↓
Backend fetches OpenWeatherMap 72h rainfall forecast     (live API)
Backend fetches MRC river level cache                   (cached JSON, refreshed hourly)
Backend runs predict_flood() rule engine                (local, no API)
  ↓
Frontend displays flood risk + countdown
  ↓
Farmer enters crop type + planting date
Frontend calls POST /harvest-decision
  ↓
Backend calculates growth stage from MARD calendar      (local, no API)
Backend looks up IRRI flood damage table                (local hardcoded data)
Backend computes Now / Wait / After loss percentages    (local calculation)
  ↓
Frontend displays three-scenario comparison + recommendation
  ↓
Post-flood: Farmer takes photos
Frontend calls POST /loss-report with photos + form
  ↓
Backend calculates compensation under ND 02/2017        (local hardcoded rates)
Backend generates evidence package                      (PDF)
  ↓
Farmer downloads and submits to provincial DARD office
```

## External dependencies

| Dependency | Purpose | Fallback if down |
|-----------|---------|-----------------|
| OpenWeatherMap API | 72h rainfall forecast | Cached last-known forecast |
| MRC water level data | River level readings | Hardcoded cache snapshot |
| NASA POWER API | Historical rainfall context | Pre-downloaded JSON file |
| Twilio | SMS alert delivery | Push notification only |
| Leaflet + OSM tiles | Map rendering | Static image fallback |

**Key design principle:** The harvest decision engine and compensation calculator
have zero external dependencies. They work fully offline. This is intentional —
farmers in flood zones often lose mobile data at exactly the moment they need this most.

## Module responsibilities

### `backend/flood/`
- `predictor.py` — `predict_flood()`: river level + rainfall → FloodPrediction dataclass
- `sources.py` — OpenWeatherMap and MRC data fetching with caching
- `models.py` — Pydantic models: FloodPrediction, RiverStatus, RainfallForecast

### `backend/harvest/`
- `engine.py` — `make_harvest_decision()`: master decision function
- `irri_tables.py` — IRRI flood damage lookup tables (hardcoded, never auto-modified)
- `crop_calendar.py` — MARD Mekong Delta crop calendars, growth stage calculator
- `models.py` — Pydantic models: HarvestDecision, HarvestScenario, CropProfile

### `backend/alerts/`
- `dispatcher.py` — threshold evaluation → alert generation → SMS/push dispatch
- `sms.py` — Twilio wrapper with Vietnamese message templates
- `models.py` — Alert, AlertSeverity, FarmerContact

### `backend/proof/`
- `reporter.py` — photo validation, GPS tagging, evidence package assembly
- `compensation.py` — ND 02/2017 compensation rate calculator
- `pdf_generator.py` — generates official-format loss report PDF
- `models.py` — LossReport, EvidencePhoto, CompensationResult

### `frontend/src/`
- `screens/Dashboard.jsx` — flood status, countdown, river levels
- `screens/HarvestDecision.jsx` — crop inputs + three-scenario comparison
- `screens/Alerts.jsx` — active alerts + crop recommendations
- `screens/LossProof.jsx` — photo capture + damage form + compensation estimate
- `services/api.js` — all backend calls, with offline fallback logic
- `i18n/vi.json` — all Vietnamese strings

## Deployment topology (hackathon)

```
Laptop (uvicorn, port 8000)
  ↓ ngrok tunnel
Mobile browser / Expo app → public ngrok URL
```

Production path (post-hackathon):
- Backend: Railway or Render (Python, free tier)
- Frontend: Vercel (static, free tier)
- SMS: Twilio production account

## Performance constraints

- `/flood-status` must respond in < 2 seconds including API calls
- `/harvest-decision` must respond in < 200ms (no external calls)
- All frontend screens must be usable on 3G (< 500KB initial JS bundle)
- App must function with cached data when offline (ServiceWorker)
