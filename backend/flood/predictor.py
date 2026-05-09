from backend.flood.models import (
    FloodInputs,
    FloodPrediction,
    FloodStatusResponse,
    RainfallForecast,
    RiverStatus,
)


def get_flood_status(
    lat: float = 10.52,
    lon: float = 105.12,
    inputs: FloodInputs | None = None,
) -> FloodStatusResponse:
    """Return deterministic fallback flood status for the hackathon demo."""
    del lat, lon
    if inputs is None:
        inputs = FloodInputs(
            river={
                "station": "Tan Chau",
                "current_level_m": 3.82,
                "trend": "rising",
                "rise_rate_cm_per_hr": 7.5,
                "alert_level_m": 3.5,
                "danger_level_m": 4.5,
                "updated": "2026-05-02T06:00:00",
            },
            forecast=[
                {"time": "2026-05-02 09:00:00", "rain_mm": 4.2, "temp": 31.1, "humidity": 82},
                {"time": "2026-05-02 12:00:00", "rain_mm": 8.6, "temp": 32.4, "humidity": 79},
                {"time": "2026-05-02 15:00:00", "rain_mm": 13.4, "temp": 30.7, "humidity": 88},
            ],
            nasa={},
            cached=False,
            data_sources=["OpenWeatherMap fallback", "MRC Tan Chau station fallback"],
            source_freshness={"mrc": "fallback", "openweather": "fallback", "nasa": "fallback"},
        )
    river_data = inputs.river
    status = _river_status(
        level=river_data["current_level_m"],
        alert_level=river_data["alert_level_m"],
        danger_level=river_data["danger_level_m"],
    )
    river = RiverStatus(
        station=river_data["station"],
        current_level_m=river_data["current_level_m"],
        trend=river_data["trend"],
        rise_rate_cm_per_hr=river_data["rise_rate_cm_per_hr"],
        alert_level_m=river_data["alert_level_m"],
        danger_level_m=river_data["danger_level_m"],
        status=status,
        updated=river_data["updated"],
    )
    depth_cm = 65.0
    hours_to_arrival = _estimate_hours_to_arrival(river)
    risk_level = _risk_level(river=river, hours_to_arrival=hours_to_arrival, depth_cm=depth_cm)
    prediction = FloodPrediction(
        risk_level=risk_level,
        hours_to_arrival=hours_to_arrival,
        predicted_depth_cm=depth_cm,
        predicted_duration_days=5,
        confidence="high",
        explanation=f"River at alert level. Estimated arrival: {hours_to_arrival}h.",
    )
    forecast = [RainfallForecast(**item) for item in inputs.forecast]
    return FloodStatusResponse(
        river=river,
        prediction=prediction,
        forecast=forecast,
        cached=inputs.cached,
        data_sources=inputs.data_sources,
        source_freshness=inputs.source_freshness,
        stale_reason=inputs.stale_reason,
    )


def _estimate_hours_to_arrival(river: RiverStatus) -> int:
    remaining_cm = max(0.0, (river.danger_level_m - river.current_level_m) * 100)
    if river.rise_rate_cm_per_hr <= 0:
        return 72
    return max(1, round(remaining_cm / river.rise_rate_cm_per_hr))


def _risk_level(river: RiverStatus, hours_to_arrival: int, depth_cm: float) -> str:
    if river.current_level_m >= river.danger_level_m or hours_to_arrival < 24:
        return "CRITICAL"
    if river.current_level_m >= river.alert_level_m or hours_to_arrival < 72 or depth_cm >= 60:
        return "HIGH"
    if depth_cm >= 30:
        return "MODERATE"
    return "LOW"


def _river_status(level: float, alert_level: float, danger_level: float) -> str:
    if level >= danger_level:
        return "DANGER"
    if level >= alert_level:
        return "ALERT"
    return "NORMAL"
