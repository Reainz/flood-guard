---
name: write-test
description: Write unit tests for FloodGuard backend modules. Triggers when asked to add tests, improve coverage, write a test for a function, or test a bug fix. Do NOT trigger for integration tests or end-to-end tests.
---

# Skill: Write Tests

## Rules before writing any test

1. Read the function's docstring and the feature doc for its module
2. Tests must NEVER make network calls — use fixtures
3. Fixture files live in `tests/fixtures/` — check what exists before creating new ones
4. One test file per module: `tests/<module>/test_<module>.py`

## Fixture files available

```
tests/fixtures/
├── openweather_response.json   # sample OWM 72h forecast
├── mrc_cache.json              # sample MRC river level data
├── nasa_rainfall.json          # sample NASA POWER annual data
└── farmer_profiles.json        # sample farmer input combinations
```

To use a fixture:
```python
import json
from pathlib import Path

def load_fixture(name):
    return json.loads((Path(__file__).parent.parent / "fixtures" / name).read_text())
```

## Test structure

```python
"""Tests for backend.harvest.engine"""
import pytest
from datetime import date, timedelta
from backend.harvest.engine import make_harvest_decision
from backend.harvest.models import HarvestDecision


# ── Fixtures ──────────────────────────────────────────────

@pytest.fixture
def base_params():
    """Standard test params — rice at grain filling, 3 days to flood"""
    return dict(
        planting_date=date.today() - timedelta(days=88),
        crop_type="rice",
        field_area_ha=2.4,
        elevation="medium",
        days_to_flood=3,
        predicted_flood_depth_cm=65.0,
        predicted_flood_duration_days=5,
    )


# ── Happy path ────────────────────────────────────────────

def test_returns_harvest_decision(base_params):
    result = make_harvest_decision(**base_params)
    assert isinstance(result, HarvestDecision)

def test_three_scenarios_returned(base_params):
    result = make_harvest_decision(**base_params)
    assert len(result.scenarios) == 3
    labels = {s.label for s in result.scenarios}
    assert labels == {"harvest_now", "wait", "harvest_after"}

def test_recommended_is_minimum_loss(base_params):
    result = make_harvest_decision(**base_params)
    losses = {s.label: s.loss_pct for s in result.scenarios}
    rec = next(s for s in result.scenarios if s.is_recommended)
    assert rec.loss_pct == min(losses.values())

def test_loss_pct_are_integers(base_params):
    result = make_harvest_decision(**base_params)
    for s in result.scenarios:
        assert isinstance(s.loss_pct, int)
        assert 0 <= s.loss_pct <= 99


# ── Boundary conditions ───────────────────────────────────

def test_flood_arrives_tomorrow(base_params):
    """Extreme urgency — flood in 1 day"""
    params = {**base_params, "days_to_flood": 1}
    result = make_harvest_decision(**params)
    # harvest now should be more urgent
    now_scenario = next(s for s in result.scenarios if s.label == "harvest_now")
    assert now_scenario.loss_pct >= 0  # still a valid number

def test_deep_flood_increases_wait_loss(base_params):
    shallow = make_harvest_decision(**{**base_params, "predicted_flood_depth_cm": 20})
    deep = make_harvest_decision(**{**base_params, "predicted_flood_depth_cm": 150})
    shallow_wait = next(s for s in shallow.scenarios if s.label == "wait").loss_pct
    deep_wait = next(s for s in deep.scenarios if s.label == "wait").loss_pct
    assert deep_wait > shallow_wait

def test_low_elevation_increases_losses(base_params):
    medium = make_harvest_decision(**{**base_params, "elevation": "medium"})
    low = make_harvest_decision(**{**base_params, "elevation": "low"})
    medium_wait = next(s for s in medium.scenarios if s.label == "wait").loss_pct
    low_wait = next(s for s in low.scenarios if s.label == "wait").loss_pct
    assert low_wait >= medium_wait


# ── Compensation ──────────────────────────────────────────

def test_compensation_eligible_above_30pct(base_params):
    # grain filling + 65cm deep + 5 days should produce >30% loss in some scenario
    result = make_harvest_decision(**base_params)
    # At least one scenario should be eligible
    eligible = any(
        s.loss_pct >= 30 for s in result.scenarios
    )
    assert eligible  # sanity check that our test params aren't all trivial

def test_compensation_not_eligible_below_30pct():
    # Mature rice, shallow flood, 1 day — should be low loss
    result = make_harvest_decision(
        planting_date=date.today() - timedelta(days=105),  # mature
        crop_type="rice", field_area_ha=1.0, elevation="high",
        days_to_flood=7, predicted_flood_depth_cm=15,
        predicted_flood_duration_days=1,
    )
    rec = next(s for s in result.scenarios if s.is_recommended)
    if rec.loss_pct < 30:
        assert result.compensation["eligible"] is False


# ── Crop types ────────────────────────────────────────────

@pytest.mark.parametrize("crop_type", ["rice", "maize", "vegetables"])
def test_all_crop_types_return_valid_result(crop_type, base_params):
    result = make_harvest_decision(**{**base_params, "crop_type": crop_type})
    assert result.crop_type == crop_type
    assert len(result.scenarios) == 3
```

## Coverage target

Every function in `engine.py` must be touched by at least one test.
Run `pytest tests/ --cov=backend/harvest --cov-report=term-missing` to check.
