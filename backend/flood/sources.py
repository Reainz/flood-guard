from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from backend.flood.models import FloodInputs

CACHE_DIR = Path("backend/cache")
OPENWEATHER_MAX_AGE_MINUTES = 30
MRC_MAX_AGE_MINUTES = 60
NASA_MAX_AGE_MINUTES = 60 * 24 * 365

FALLBACK_RIVER = {
    "station": "Tan Chau",
    "current_level_m": 3.82,
    "trend": "rising",
    "rise_rate_cm_per_hr": 7.5,
    "alert_level_m": 3.5,
    "danger_level_m": 4.5,
    "updated": "2026-05-02T06:00:00",
}

FALLBACK_FORECAST = [
    {"time": "2026-05-02 09:00:00", "rain_mm": 4.2, "temp": 31.1, "humidity": 82},
    {"time": "2026-05-02 12:00:00", "rain_mm": 8.6, "temp": 32.4, "humidity": 79},
    {"time": "2026-05-02 15:00:00", "rain_mm": 13.4, "temp": 30.7, "humidity": 88},
]

FALLBACK_NASA = {"annual_rainfall_mm": 1400, "source": "deterministic fallback"}


def load_flood_inputs(
    lat: float = 10.52,
    lon: float = 105.12,
    cache_dir: Path = CACHE_DIR,
    now_iso: str | None = None,
) -> FloodInputs:
    now = _parse_now(now_iso)
    openweather = _fetch_openweather(lat=lat, lon=lon, cache_dir=cache_dir)
    mrc = _read_json(cache_dir / "mrc_cache.json")
    nasa = _read_json(cache_dir / "nasa_rainfall_cache.json")

    forecast = _fresh_payload(
        payload=openweather,
        key="forecast",
        max_age_minutes=OPENWEATHER_MAX_AGE_MINUTES,
        now=now,
    )
    river = _fresh_payload(
        payload=mrc,
        key=None,
        max_age_minutes=MRC_MAX_AGE_MINUTES,
        now=now,
    )
    nasa_payload = _fresh_payload(
        payload=nasa,
        key=None,
        max_age_minutes=NASA_MAX_AGE_MINUTES,
        now=now,
    )

    freshness = {
        "openweather": _freshness(openweather, OPENWEATHER_MAX_AGE_MINUTES, now),
        "mrc": _freshness(mrc, MRC_MAX_AGE_MINUTES, now),
        "nasa": _freshness(nasa, NASA_MAX_AGE_MINUTES, now),
    }
    missing_or_stale = [name for name, value in freshness.items() if value != "fresh"]
    stale_reason = None
    if missing_or_stale:
        stale_reason = "fallback_data_used" if any(value == "missing" for value in freshness.values()) else "cache_stale"

    return FloodInputs(
        river=river or FALLBACK_RIVER,
        forecast=forecast or FALLBACK_FORECAST,
        nasa=nasa_payload or FALLBACK_NASA,
        cached=not bool(missing_or_stale),
        data_sources=["OpenWeatherMap", "MRC Tan Chau station", "NASA POWER"],
        source_freshness=freshness,
        stale_reason=stale_reason,
    )


def _fetch_openweather(lat: float, lon: float, cache_dir: Path) -> dict | None:
    api_key = os.getenv("OPENWEATHER_API_KEY")
    if not api_key:
        return _read_json(cache_dir / "openweather_cache.json")

    query = urlencode({"lat": lat, "lon": lon, "appid": api_key, "units": "metric"})
    url = f"https://api.openweathermap.org/data/2.5/forecast?{query}"
    try:
        with urlopen(url, timeout=4) as response:
            raw = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, TimeoutError, json.JSONDecodeError):
        return _read_json(cache_dir / "openweather_cache.json")

    forecast = []
    for item in raw.get("list", [])[:24]:
        forecast.append(
            {
                "time": item.get("dt_txt", ""),
                "rain_mm": float(item.get("rain", {}).get("3h", 0)),
                "temp": float(item.get("main", {}).get("temp", 0)),
                "humidity": int(item.get("main", {}).get("humidity", 0)),
            }
        )
    payload = {"fetched_at": datetime.now(timezone.utc).isoformat(), "forecast": forecast}
    _write_json(cache_dir / "openweather_cache.json", payload)
    return payload


def _fresh_payload(payload: dict | None, key: str | None, max_age_minutes: int, now: datetime):
    if _freshness(payload, max_age_minutes, now) != "fresh":
        return None
    if key:
        return payload.get(key)
    return {name: value for name, value in payload.items() if name != "fetched_at"}


def _freshness(payload: dict | None, max_age_minutes: int, now: datetime) -> str:
    if not payload or "fetched_at" not in payload:
        return "missing"
    fetched_at = _parse_datetime(payload["fetched_at"])
    if fetched_at is None:
        return "stale"
    age_minutes = (now - fetched_at).total_seconds() / 60
    return "fresh" if age_minutes <= max_age_minutes else "stale"


def _parse_now(value: str | None) -> datetime:
    return _parse_datetime(value) if value else datetime.now(timezone.utc)


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _read_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp_path.replace(path)
