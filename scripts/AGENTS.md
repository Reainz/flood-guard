# Scripts Agent Guide

Scripts in this directory are data preparation and CI utilities.
They are NOT part of the application runtime.

## Safety rules

- Scripts must be idempotent — running twice must produce the same result
- Scripts that write files must use atomic writes (write to `.tmp`, then rename)
- Scripts must print what they are doing and where output goes
- Never delete files without a `--dry-run` flag that shows what would be deleted
- Never commit API keys — read from environment variables

## Script inventory

| Script | Purpose | When to run |
|--------|---------|-------------|
| `cache_nasa_data.py` | Download NASA POWER historical rainfall for An Giang | Once before hackathon |
| `cache_mrc_data.py` | Snapshot MRC river level data to JSON | Night before hackathon |
| `check_layers.py` | Verify no layer boundary violations | CI on every PR |
| `check_pii_logs.py` | Scan log output for PII patterns | CI on every PR |
| `seed_fixtures.py` | Generate test fixture JSON from cached data | After updating cache |

## Running the pre-hackathon data prep

```bash
# 1. Download NASA historical rainfall (no API key needed)
python scripts/cache_nasa_data.py --lat 10.52 --lon 105.12 --year 2024

# 2. Cache MRC river levels
python scripts/cache_mrc_data.py --station "Tan Chau" --days 30

# 3. Verify cache files exist
ls backend/cache/
# Should show: nasa_rainfall_cache.json, mrc_cache.json, openweather_cache.json

# 4. Regenerate test fixtures from cache
python scripts/seed_fixtures.py
```

Run these the night before the hackathon. Commit the cache files to git
(they are gitignored by default — add them explicitly for demo stability).

## CI scripts

`check_layers.py` scans all Python files for import statements that violate
the Types→Config→Repo→Service→Runtime→UI ordering.

```bash
python scripts/check_layers.py
# Exit 0 = clean
# Exit 1 = violations printed to stdout
```

`check_pii_logs.py` runs the backend with test inputs and scans log output
for patterns matching lat/lon coordinates, Vietnamese phone numbers,
and common PII patterns.
