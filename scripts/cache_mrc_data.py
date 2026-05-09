from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

STATIONS = {
    "Tan Chau": {"alert_level_m": 3.5, "danger_level_m": 4.5},
    "Chau Doc": {"alert_level_m": 3.0, "danger_level_m": 4.0},
    "Long Xuyen": {"alert_level_m": 2.0, "danger_level_m": 3.0},
    "Can Tho": {"alert_level_m": 1.8, "danger_level_m": 2.5},
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--station", default="Tan Chau")
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--out", default="backend/cache/mrc_cache.json")
    args = parser.parse_args()

    thresholds = STATIONS.get(args.station, STATIONS["Tan Chau"])
    payload = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "station": args.station,
        "current_level_m": 3.82,
        "trend": "rising",
        "rise_rate_cm_per_hr": 7.5,
        "alert_level_m": thresholds["alert_level_m"],
        "danger_level_m": thresholds["danger_level_m"],
        "updated": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": f"Demo MRC snapshot, {args.days} day context",
    }
    write_atomic(Path(args.out), payload)
    print(f"Wrote {args.out}")
    return 0


def write_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp_path.replace(path)


if __name__ == "__main__":
    raise SystemExit(main())
