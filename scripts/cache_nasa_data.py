from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lat", type=float, default=10.52)
    parser.add_argument("--lon", type=float, default=105.12)
    parser.add_argument("--year", type=int, default=2024)
    parser.add_argument("--out", default="backend/cache/nasa_rainfall_cache.json")
    args = parser.parse_args()

    params = urlencode(
        {
            "parameters": "PRECTOTCORR",
            "community": "AG",
            "longitude": args.lon,
            "latitude": args.lat,
            "start": f"{args.year}0101",
            "end": f"{args.year}1231",
            "format": "JSON",
        }
    )
    url = f"https://power.larc.nasa.gov/api/temporal/daily/point?{params}"
    print(f"Fetching NASA POWER rainfall for {args.lat},{args.lon} year {args.year}")
    with urlopen(url, timeout=20) as response:
        raw = json.loads(response.read().decode("utf-8"))
    values = raw["properties"]["parameter"]["PRECTOTCORR"].values()
    payload = {
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "annual_rainfall_mm": round(sum(float(value) for value in values), 1),
        "source": "NASA POWER",
        "year": args.year,
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
