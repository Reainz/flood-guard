import json
from pathlib import Path
import shutil

import backend.flood.sources as sources
from backend.flood.sources import load_flood_inputs


def workspace_dir(name: str) -> Path:
    path = Path("test-artifacts") / name
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True)
    return path


def test_loads_fresh_cache_files():
    cache_dir = workspace_dir("fresh-cache")
    (cache_dir / "mrc_cache.json").write_text(
        json.dumps(
            {
                "fetched_at": "2026-05-02T06:00:00+00:00",
                "station": "Tan Chau",
                "current_level_m": 3.82,
                "trend": "rising",
                "rise_rate_cm_per_hr": 7.5,
                "alert_level_m": 3.5,
                "danger_level_m": 4.5,
                "updated": "2026-05-02T06:00:00",
            }
        ),
        encoding="utf-8",
    )
    (cache_dir / "openweather_cache.json").write_text(
        json.dumps(
            {
                "fetched_at": "2026-05-02T06:30:00+00:00",
                "forecast": [
                    {"time": "2026-05-02 09:00:00", "rain_mm": 4.2, "temp": 31.1, "humidity": 82}
                ],
            }
        ),
        encoding="utf-8",
    )
    (cache_dir / "nasa_rainfall_cache.json").write_text(
        json.dumps({"fetched_at": "2026-05-01T00:00:00+00:00", "annual_rainfall_mm": 1400}),
        encoding="utf-8",
    )

    inputs = load_flood_inputs(cache_dir=cache_dir, now_iso="2026-05-02T06:45:00+00:00")

    assert inputs.cached is True
    assert inputs.source_freshness["mrc"] == "fresh"
    assert inputs.source_freshness["openweather"] == "fresh"
    assert inputs.river["station"] == "Tan Chau"


def test_missing_cache_uses_deterministic_fallback():
    inputs = load_flood_inputs(cache_dir=workspace_dir("missing-cache"), now_iso="2026-05-02T06:45:00+00:00")

    assert inputs.cached is True
    assert inputs.stale_reason == "fallback_data_used"
    assert inputs.river["station"] == "Tan Chau"
    assert inputs.forecast


def test_no_external_weather_call_without_api_key(monkeypatch):
    monkeypatch.delenv("OPENWEATHER_API_KEY", raising=False)

    def fail_urlopen(*args, **kwargs):
        raise AssertionError("external API should not be called without key")

    monkeypatch.setattr(sources, "urlopen", fail_urlopen)
    inputs = load_flood_inputs(cache_dir=workspace_dir("no-network"), now_iso="2026-05-02T06:45:00+00:00")

    assert inputs.stale_reason == "fallback_data_used"
