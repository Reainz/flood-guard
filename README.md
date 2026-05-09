# FloodGuard Vietnam

Local hackathon demo for Mekong Delta flood decision support.

## Run Backend

```bash
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

Useful endpoints:
- `GET http://localhost:8000/health`
- `GET http://localhost:8000/flood-status`
- `GET http://localhost:8000/alerts`
- `POST http://localhost:8000/harvest-decision`
- `POST http://localhost:8000/loss-report`

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Optional Environment Variables

```bash
OPENWEATHER_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```

If these are missing, FloodGuard uses local cache/fallback data and simulated
SMS dispatch.

## Data Prep

```bash
python scripts/cache_nasa_data.py --lat 10.52 --lon 105.12 --year 2024
python scripts/cache_mrc_data.py --station "Tan Chau" --days 30
python scripts/seed_fixtures.py
python scripts/cleanup_old_reports.py --dry-run
```

## Checks

```bash
python -m pytest tests/ -v
python scripts/check_layers.py
python scripts/check_pii_logs.py
cd frontend && npm run build
```

## Demo Flow

1. Open Dashboard and confirm flood status/source freshness.
2. Open Harvest and submit the default rice scenario.
3. Open Alerts and review the active tier.
4. Open Loss Proof, upload at least two JPEG/PNG files, and create the evidence package.
