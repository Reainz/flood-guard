from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

try:
    import httpx
except ImportError:
    httpx = None

STATIONS = {
    "Tan Chau": {"alert_level_m": 3.5, "danger_level_m": 4.5, "code": "TCH"},
    "Chau Doc": {"alert_level_m": 3.0, "danger_level_m": 4.0, "code": "CDO"},
    "Long Xuyen": {"alert_level_m": 2.0, "danger_level_m": 3.0, "code": "LXY"},
    "Can Tho": {"alert_level_m": 1.8, "danger_level_m": 2.5, "code": "CTO"},
}

def fetch_live_level(station: str) -> float | None:
    if not httpx:
        return None
    try:
        # Strict 3-second timeout to prevent presentation hanging
        with httpx.Client(timeout=3.0, verify=False) as client:
            resp = client.get("https://ffw.mrcmekong.org/bulletin_wet.php")
            resp.raise_for_status()
            
            # If the fetch succeeds, parse the HTML table.
            import re
            code = STATIONS.get(station, {}).get("code", "")
            if code:
                # Basic regex to extract water level next to the station code
                # e.g., <td StCode="TCH">Tan Chau</td> <td>3.82</td>
                match = re.search(rf'StCode="{code}".*?<td[^>]*>([\d\.]+)</td>', resp.text, re.IGNORECASE | re.DOTALL)
                if match:
                    return float(match.group(1))
    except Exception as e:
        print(f"⚠️ Live MRC fetch failed or timed out: ({type(e).__name__}) {e}")
    return None

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--station", default="Tan Chau")
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--out", default="backend/cache/mrc_cache.json")
    args = parser.parse_args()

    thresholds = STATIONS.get(args.station, STATIONS["Tan Chau"])
    
    print(f"Attempting to fetch live MRC data for {args.station}...")
    live_level = fetch_live_level(args.station)

    if live_level is not None:
        print(f"✅ Success! Live data retrieved: {live_level}m")
        current_level = live_level
        source = "Live MRC Scraping"
    else:
        print("⚠️ Falling back to simulated safe data to preserve demo speed.")
        current_level = 3.82
        source = f"Demo MRC snapshot, {args.days} day context"

    payload = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "station": args.station,
        "current_level_m": current_level,
        "trend": "rising",
        "rise_rate_cm_per_hr": 7.5,
        "alert_level_m": thresholds["alert_level_m"],
        "danger_level_m": thresholds["danger_level_m"],
        "updated": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": source,
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
