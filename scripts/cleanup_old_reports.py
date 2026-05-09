from __future__ import annotations

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from backend.proof.storage import cleanup_old_reports


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--uploads", default="uploads")
    parser.add_argument("--max-age-days", type=int, default=90)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.dry_run:
        raise SystemExit("Refusing to delete without --dry-run first. Re-run after reviewing candidates.")

    result = cleanup_old_reports(
        upload_root=Path(args.uploads),
        max_age_days=args.max_age_days,
        dry_run=True,
    )
    print(f"Dry run: {len(result['candidates'])} candidate report directories")
    for candidate in result["candidates"]:
        print(candidate)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
