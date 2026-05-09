---
name: add-crop-profile
description: Add a new crop type to the FloodGuard harvest decision engine. Triggers when asked to support a new crop, add maize/sugarcane/cassava/fruit trees, or extend the IRRI damage table. Do NOT trigger for changes to existing crop profiles.
---

# Skill: Add Crop Profile

Follow these steps exactly. Do not skip steps.

## Step 1 — Research the crop's flood tolerance

Before writing any code, gather:
- Flood damage curve for this crop (% loss by depth × duration)
- Early harvest penalty by growth stage
- Post-flood quality loss estimate
- Source citation (IRRI, FAO, peer-reviewed paper, MARD bulletin)

If you cannot find a credible source, STOP and ask the user before proceeding.
Do not invent damage percentages.

## Step 2 — Add the crop profile to `backend/harvest/irri_tables.py`

Add three entries:

```python
# Source: <citation here>
IRRI_FLOOD_DAMAGE["<crop_name>"] = {
    "<stage>": {
        "shallow":  { 3: X, 5: X, 7: X, 10: X },
        "moderate": { 3: X, 5: X, 7: X, 10: X },
        "deep":     { 3: X, 5: X, 7: X, 10: X },
    },
    # ... all applicable stages
}

EARLY_HARVEST_PENALTY["<crop_name>_<stage>"] = X  # one per growth stage

POST_FLOOD_QUALITY_LOSS["<crop_name>_<stage>"] = X  # one per growth stage
```

## Step 3 — Add action steps to `backend/harvest/engine.py`

In `action_steps_map`, add the new crop's recommended steps for each scenario:

```python
action_steps_map["harvest_now"]["<crop_name>"] = [
    "Step 1 in Vietnamese...",
    "Step 2 in Vietnamese...",
]
action_steps_map["wait"]["<crop_name>"] = [...]
action_steps_map["harvest_after"]["<crop_name>"] = [...]
```

## Step 4 — Add compensation rate if different from rice

In `backend/proof/compensation.py`, add to `COMPENSATION_RATES_VND_PER_HA`
if the crop has a different rate under Nghị định 02/2017.

## Step 5 — Add to frontend crop selector

In `frontend/src/i18n/vi.json`, add the crop name:
```json
"crop.<crop_name>": "Vietnamese crop name"
```

In `frontend/src/screens/HarvestDecision.jsx`, add to the crop type dropdown.

## Step 6 — Write tests

In `tests/harvest/test_engine.py`, add:
```python
def test_<crop_name>_harvest_now_loss():
    result = make_harvest_decision(
        planting_date=..., crop_type="<crop_name>", ...
    )
    assert result.scenarios[0].loss_pct <= 95  # sanity bounds
    assert result.scenarios[0].loss_pct >= 0

def test_<crop_name>_recommendation_is_minimum_loss():
    result = make_harvest_decision(...)
    losses = [s.loss_pct for s in result.scenarios]
    rec = next(s for s in result.scenarios if s.is_recommended)
    assert rec.loss_pct == min(losses)
```

## Step 7 — Update docs

Add the new crop to the table in `docs/features/HARVEST_ENGINE.md`.
Add the source citation.

## Step 8 — Run checks

```bash
pytest tests/harvest/ -v
python scripts/check_layers.py
```

Both must pass before opening a PR.
