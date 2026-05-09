from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    mapping = {
        "backend/cache/openweather_cache.json": "tests/fixtures/openweather_response.json",
        "backend/cache/mrc_cache.json": "tests/fixtures/mrc_cache.json",
        "backend/cache/nasa_rainfall_cache.json": "tests/fixtures/nasa_rainfall.json",
    }
    for source, target in mapping.items():
        source_path = ROOT / source
        target_path = ROOT / target
        if not source_path.exists():
            print(f"Skipping missing {source}")
            continue
        payload = json.loads(source_path.read_text(encoding="utf-8"))
        write_atomic(target_path, payload)
        print(f"Wrote {target}")
    return 0


def write_atomic(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    tmp_path.replace(path)


if __name__ == "__main__":
    raise SystemExit(main())
