# API Contracts — All Endpoints

Base URL (local): `http://localhost:8000`
Base URL (demo):  `https://<ngrok-id>.ngrok.io`

All responses are JSON. All errors follow:
```json
{ "error": "human-readable message", "code": "SNAKE_CASE_CODE" }
```

---

## GET /flood-status

Returns current flood risk for a location.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| lat | float | 10.52 | Latitude (WGS84) |
| lon | float | 105.12 | Longitude (WGS84) |

**Response 200:**
```json
{
  "river": {
    "station": "Tan Chau",
    "current_level_m": 3.82,
    "trend": "rising",
    "rise_rate_cm_per_hr": 7.5,
    "alert_level_m": 3.5,
    "danger_level_m": 4.5,
    "status": "ALERT",
    "updated": "2026-05-02T06:00:00"
  },
  "prediction": {
    "risk_level": "HIGH",
    "hours_to_arrival": 71,
    "predicted_depth_cm": 65.0,
    "predicted_duration_days": 5,
    "confidence": "high",
    "explanation": "River at alert level. Estimated arrival: 71h."
  },
  "forecast": [
    { "time": "2026-05-02 09:00:00", "rain_mm": 4.2, "temp": 31.1, "humidity": 82 }
  ],
  "cached": false,
  "source_freshness": { "openweather": "fresh", "mrc": "fresh", "nasa": "fresh" },
  "stale_reason": null,
  "data_sources": ["OpenWeatherMap", "MRC Tan Chau station"]
}
```

**Risk levels:** `LOW` | `MODERATE` | `HIGH` | `CRITICAL`

---

## GET /alerts

Returns the active alert tier for a location and station.

**Query params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| lat | float | 10.52 | Latitude (WGS84) |
| lon | float | 105.12 | Longitude (WGS84) |
| station | string | Tan Chau | River station name |

**Response 200:**
```json
{
  "alert_id": "Tan Chau_CRITICAL_2026-05-03",
  "tier": "CRITICAL",
  "station": "Tan Chau",
  "trigger_reasons": ["hours_to_arrival < 24"],
  "dedupe_key": "Tan Chau_CRITICAL_2026-05-03",
  "title": "Khan cap",
  "message": "Lu den trong 9 gio. Do sau uoc tinh ~65cm.",
  "action_required": "Thu hoach ngay hoac di tan theo huong dan dia phuong.",
  "rainfall_forecast": [
    { "label": "T2", "mm": 0 },
    { "label": "T3", "mm": 12.4 },
    { "label": "T4", "mm": 8.0 },
    { "label": "T5", "mm": 0 },
    { "label": "T6", "mm": 0 },
    { "label": "T7", "mm": 0 },
    { "label": "CN", "mm": 0 }
  ],
  "rainfall_tier": "WATCH",
  "source_freshness": { "openweather": "fresh", "mrc": "fresh", "nasa": "fresh" },
  "cached": true,
  "stale_reason": null,
  "dispatch_status": "not_dispatched"
}
```

---

## POST /alerts/dispatch

Records an alert dispatch. SMS is sent only when Twilio env vars are configured;
otherwise the response is simulated for local demo safety.

**Request body:**
```json
{
  "alert_id": "Tan Chau_CRITICAL_2026-05-03",
  "tier": "CRITICAL",
  "farmer_name": "Nguyen Van A",
  "phone": "+84901234567",
  "channel": "sms"
}
```

**Response 200:**
```json
{
  "alert_id": "Tan Chau_CRITICAL_2026-05-03",
  "tier": "CRITICAL",
  "dispatch_status": "simulated",
  "push_sent": true,
  "sms_sent": false,
  "detail": "Twilio not configured; SMS simulated."
}
```

---

## POST /harvest-decision

Returns three-scenario harvest loss comparison and recommendation.

**Request body:**
```json
{
  "planting_date": "2026-02-03",
  "crop_type": "rice",
  "field_area_ha": 2.4,
  "elevation": "medium",
  "days_to_flood": 3,
  "predicted_flood_depth_cm": 65.0,
  "predicted_flood_duration_days": 5
}
```

| Field | Type | Values | Required |
|-------|------|--------|----------|
| planting_date | date string YYYY-MM-DD | any past date | ✅ |
| crop_type | string | `rice` `maize` `vegetables` `fruit_trees` | ✅ |
| field_area_ha | float | 0.1–100 | ✅ |
| elevation | string | `low` `medium` `high` | ✅ |
| days_to_flood | int | 1–21 | ✅ |
| predicted_flood_depth_cm | float | 10–200 | ✅ |
| predicted_flood_duration_days | int | 1–30 | ✅ |

**Response 200:**
```json
{
  "crop_type": "rice",
  "growth_stage": "grain_filling",
  "growth_stage_vi": "Vào chắc — hạt đang chắc",
  "days_to_harvest": 12,
  "scenarios": [
    {
      "label": "harvest_now",
      "label_vi": "Thu hoạch ngay",
      "loss_pct": 14,
      "is_recommended": true,
      "reasoning": "Thu hoạch trước lũ — thiệt hại 14% do chưa chín hoàn toàn",
      "action_steps": [
        "Liên hệ ngay hợp tác xã để thuê máy gặt — còn 3 ngày",
        "Ưu tiên thu hoạch các thửa ruộng thấp nhất trước"
      ]
    },
    {
      "label": "wait",
      "label_vi": "Chờ — lũ tràn vào",
      "loss_pct": 52,
      "is_recommended": false,
      "reasoning": "Để lũ qua — thiệt hại ước tính 52%",
      "action_steps": []
    },
    {
      "label": "harvest_after",
      "label_vi": "Thu hoạch sau lũ",
      "loss_pct": 38,
      "is_recommended": false,
      "reasoning": "Thu hoạch sau khi lũ rút — thiệt hại chất lượng 38%",
      "action_steps": []
    }
  ],
  "recommended": "harvest_now",
  "compensation": {
    "eligible": true,
    "compensation_vnd": 1288000,
    "compensation_million_vnd": 1.3,
    "rate_vnd_per_ha": 2000000,
    "legal_basis": "Nghị định 02/2017/NĐ-CP, Phụ lục I",
    "submit_deadline_note": "Submit to provincial DARD within 15 days"
  },
  "data_sources": ["IRRI Knowledge Bank", "Vietnam MARD crop calendar", "Nghị định 02/2017/NĐ-CP"]
}
```

---

## POST /loss-report

Submits a post-flood damage report and returns compensation estimate + evidence package.

**Request body (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| farmer_name | string | ✅ | Full name |
| field_id | string | ✅ | Land registration number |
| crop_type | string | ✅ | rice / maize / vegetables |
| area_ha | float | ✅ | Affected area in hectares |
| loss_pct | int | ✅ | Estimated loss 0–100 |
| flood_duration | string | ✅ | `<1day` `2-5days` `6-10days` `>10days` |
| lat | float | ✅ | Field GPS latitude |
| lon | float | ✅ | Field GPS longitude |
| photos | file[] | ✅ | 2–6 JPEG/PNG images (max 5MB each) |

**Response 200:**
```json
{
  "report_id": "FG-AG-TCPU-2024-00847-20260502143022",
  "farmer_name": "Nguyen Van A",
  "field_id": "AG-TCPU-2024-00847",
  "compensation": {
    "eligible": true,
    "compensation_million_vnd": 6.3,
    "rate_vnd_per_ha": 4600000,
    "legal_basis": "Nghị định 02/2017/NĐ-CP, Phụ lục I"
  },
  "evidence_completeness_pct": 87,
  "photos_accepted": 4,
  "photo_metadata": [
    {
      "filename": "01-before.jpg",
      "photo_type": "before",
      "content_type": "image/jpeg",
      "size_bytes": 12345,
      "sha256": "hex digest",
      "timestamp": "2026-05-02T14:30:22+00:00",
      "gps_source": "browser",
      "path": "uploads/FG-AG-TCPU-2024-00847-20260502143022/01-before.jpg"
    }
  ],
  "required_documents": [
    "Đơn đề nghị hỗ trợ",
    "Biên bản thiệt hại có xác nhận UBND xã",
    "Ảnh chụp thiệt hại có GPS và thời gian",
    "Giấy chứng nhận quyền sử dụng đất"
  ],
  "pdf_url": "/reports/FG-AG-TCPU-2024-00847-20260502143022.pdf",
  "status": "pending_submission"
}
```

---

## GET /health

```json
{ "status": "ok", "app": "FloodGuard Vietnam", "version": "0.1.0" }
```

---

## Error codes

| Code | HTTP | Description |
|------|------|-------------|
| INVALID_CROP_TYPE | 422 | crop_type not in allowed list |
| INVALID_DATE | 422 | planting_date in the future |
| MISSING_PHOTOS | 422 | loss-report submitted with 0 photos |
| INVALID_PHOTO_TYPE | 422 | photo is not JPEG/PNG |
| PHOTO_TOO_LARGE | 422 | photo exceeds 5MB |
| EXTERNAL_API_DOWN | 503 | OpenWeatherMap unreachable, using cache |
| CACHE_STALE | 200 | Returned cached data, `cached: true` in response |
