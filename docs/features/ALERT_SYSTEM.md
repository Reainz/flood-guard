# Alert System

## Purpose

Detect flood risk threshold crossings and deliver tiered alerts to
registered farmers via push notification and SMS fallback.

## Alert tiers

| Tier | Trigger | Lead time | Action required |
|------|---------|-----------|----------------|
| WATCH | Rainfall forecast >50mm/72h | 72h+ | Monitor, prepare |
| WARNING | River at alert level OR hours_to_arrival < 72 | 48–72h | Review harvest decision |
| CRITICAL | River at danger level OR hours_to_arrival < 24 | <24h | Act immediately |

## Threshold values — Mekong Delta stations

| Station | Alert level (m) | Danger level (m) | Source |
|---------|----------------|-----------------|--------|
| Tân Châu | 3.5 | 4.5 | MRC bulletin 2023 |
| Châu Đốc | 3.0 | 4.0 | MRC bulletin 2023 |
| Long Xuyên | 2.0 | 3.0 | An Giang DARD 2024 |
| Cần Thơ | 1.8 | 2.5 | MRC bulletin 2023 |

## SMS message templates (Vietnamese, <160 chars each)

### WARNING tier:
```
[FLOODGUARD] CANH BAO LU 72 GIO
Song {station}: {level}m, dang tang
Du kien: {hours}h nua
Xem quyet dinh thu hoach: floodguard.vn
```

### CRITICAL tier:
```
[FLOODGUARD] KHAN CAP: Lu den trong {hours} gio!
Do sau uoc tinh: ~{depth}cm
Thu hoach NGAY hoac di tan.
Chi tiet: floodguard.vn/alert/{id}
```

## Delivery logic

```
threshold_crossed?
  → generate Alert object
  → push notification (always, if app installed)
  → SMS (if farmer has registered phone number)
  → log alert with timestamp
  → do NOT re-alert same tier for same event within 6 hours
```

## Deduplication

Alert deduplication key: `{station}_{tier}_{date}`.
Do not send the same tier alert for the same station more than once per day.
Escalation (WARNING → CRITICAL) always sends even within 6 hours.

## Data sources

- River levels: MRC cache (refreshed hourly) + NCHMF if available
- Rainfall forecast: OpenWeatherMap 72h forecast
- Both sources are required — alert fires only when BOTH indicate risk

## Offline behaviour

If both external sources are down, do NOT send alerts based on stale data
older than 2 hours. Log a warning and set the API response `cached: true`.
Surface a banner to the farmer: "Không thể cập nhật — kiểm tra kết nối."
