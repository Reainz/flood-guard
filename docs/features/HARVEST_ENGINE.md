# Harvest Decision Engine

## Purpose

Given a farmer's crop type, planting date, and incoming flood parameters,
compute the expected yield loss under three scenarios and recommend the
lowest-loss action.

This is FloodGuard's primary technical differentiator. No equivalent tool
exists for Vietnamese Mekong Delta farmers.

## Scientific basis

All crop loss percentages derive from:

> IRRI Knowledge Bank — "Flooding Damage to Rice"
> URL: apps.irri.org/rkb/content/flooding-damage
> Variety context: Indica tropical rice (IR64, OM5451, Jasmine 85)
> Validated for: Mekong Delta flood conditions, depth 20–150cm

**Never modify `IRRI_FLOOD_DAMAGE` values without:**
1. Citing the updated IRRI or peer-reviewed source in this document
2. Getting the change reviewed by the team
3. Updating the version comment in `backend/harvest/irri_tables.py`

## Growth stage determination

Source: Vietnam Ministry of Agriculture and Rural Development (MARD)
Official crop calendars for Mekong Delta provinces.

Days after transplanting (DAT) → growth stage:

| Stage | DAT range | Vietnamese name | Flood sensitivity |
|-------|-----------|----------------|-----------------|
| seedling | 0–15 | Mạ non | High |
| tillering | 15–45 | Đẻ nhánh | High |
| panicle_initiation | 45–65 | Làm đòng | **Very high — most critical** |
| booting | 65–75 | Trỗ bông | High |
| heading | 75–85 | Trỗ | Medium-high |
| grain_filling | 85–100 | Vào chắc | Medium |
| maturity | 100–130 | Chín | Low |

Farmer inputs planting date → system calculates DAT → maps to stage.
No API call needed. Pure arithmetic.

## Mekong Delta crop seasons

| Season | Plant window | Harvest window | Duration |
|--------|-------------|----------------|---------|
| Đông Xuân (Winter-Spring) | Nov–Jan | Mar–Apr | ~105 days |
| Hè Thu (Summer-Autumn) | Apr–Jun | Jul–Sep | ~95 days |
| Thu Đông (Autumn-Winter) | Jul–Sep | Oct–Dec | ~90 days |

Flood season peaks Aug–Oct, overlapping with Hè Thu harvest and
Thu Đông mid-stages. This is the highest-risk window.

## Three-scenario loss model

### Scenario A: Harvest Now (before flood arrives)
```
loss_now = EARLY_HARVEST_PENALTY[stage] + urgency_bump
urgency_bump = max(0, (4 - days_to_flood) * 3)
loss_now = min(95, loss_now)
```
`EARLY_HARVEST_PENALTY` is the yield loss from harvesting before full maturity.
At maturity=5%, at panicle_initiation=60%, at seedling=95% (no viable grain).

### Scenario B: Wait — crop gets flooded
```
loss_wait = IRRI_FLOOD_DAMAGE[stage][depth_class][duration_days]
loss_wait = interpolate_loss(stage, depth_class, duration)
loss_wait = min(99, loss_wait * elevation_modifier)
```
Depth classes: shallow (<40cm), moderate (40–80cm), deep (>80cm).
Elevation modifier: low=1.25, medium=1.0, high=0.75.

### Scenario C: Harvest after flood recedes
```
loss_after = POST_FLOOD_QUALITY_LOSS[stage]
           + max(0, duration - 3) * 2.5      # each extra day costs 2.5%
           + max(0, depth_cm - 40) * 0.15    # deeper = more quality loss
loss_after = min(99, loss_after * elevation_modifier * 0.9)
```
`POST_FLOOD_QUALITY_LOSS` reflects: chalky grain, broken rice, sprouting,
discolouration from waterlogging — quality degradation even if plant survives.

## Recommendation logic

```python
best = min({"harvest_now": A, "wait": B, "harvest_after": C}, key=lambda x: x[1])
```

Ties broken by: harvest_now > harvest_after > wait
(action bias — recommend doing something over waiting when loss is equal).

## Elevation modifier rationale

Field elevation relative to flood extent meaningfully changes inundation depth.
Low-lying fields in the Delta flood earlier and deeper than fields on higher ground.
Farmers know their elevation class — it is a simple input (Low / Medium / High).
We do not attempt GPS-based DEM lookup in the hackathon MVP.

## Government compensation

Source: Nghị định 02/2017/NĐ-CP, Phụ lục I (Annex I)
URL: thuvienphapluat.vn/van-ban/Tai-chinh-nha-nuoc/Nghi-dinh-02-2017-ND-CP

| Crop | Loss 30–70% | Loss >70% |
|------|------------|----------|
| Rice | 2,000,000 VND/ha | 4,600,000 VND/ha |
| Maize | 2,000,000 VND/ha | 4,600,000 VND/ha |
| Vegetables | 3,000,000 VND/ha | 5,000,000 VND/ha |
| Fruit trees | 4,000,000 VND/ha | 6,000,000 VND/ha |

Minimum threshold: loss must be ≥ 30% to be eligible.
Submission deadline: 15 days after provincial disaster declaration.

## API contract

See `docs/api/HARVEST.md` for full request/response schemas.

## Test coverage requirements

Every new crop profile must have a corresponding test in
`tests/harvest/test_engine.py` covering:
1. Loss calculation matches expected range for each scenario
2. Recommendation is the minimum-loss scenario
3. Compensation eligibility is correct for loss_pct < 30, 30–70, > 70
