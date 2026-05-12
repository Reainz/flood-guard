from datetime import date

from backend.alerts.dispatcher import build_alert, build_rainfall_forecast, dispatch_alert
from backend.flood.models import FloodPrediction, FloodStatusResponse, RainfallForecast, RiverStatus


def flood_status(hours_to_arrival=9, level=3.82, rain_mm=60.0):
    return FloodStatusResponse(
        river=RiverStatus(
            station="Tan Chau",
            current_level_m=level,
            trend="rising",
            rise_rate_cm_per_hr=7.5,
            alert_level_m=3.5,
            danger_level_m=4.5,
            status="ALERT",
            updated="2026-05-02T06:00:00",
        ),
        prediction=FloodPrediction(
            risk_level="HIGH",
            hours_to_arrival=hours_to_arrival,
            predicted_depth_cm=65,
            predicted_duration_days=5,
            confidence="high",
            explanation="River at alert level.",
        ),
        forecast=[RainfallForecast(time="2026-05-02 09:00:00", rain_mm=rain_mm, temp=31, humidity=82)],
        cached=False,
        data_sources=["fixture"],
        source_freshness={"mrc": "fresh", "openweather": "fresh", "nasa": "fresh"},
        stale_reason=None,
    )


def test_alert_builds_critical_tier_for_short_arrival():
    alert = build_alert(flood_status(hours_to_arrival=12))

    assert alert.tier == "CRITICAL"
    assert "hours_to_arrival < 24" in alert.trigger_reasons
    assert alert.dedupe_key.startswith("Tan Chau_CRITICAL_")
    assert alert.cached is False


def test_alert_builds_warning_for_alert_level():
    alert = build_alert(flood_status(hours_to_arrival=48, level=3.6, rain_mm=55))

    assert alert.tier == "WARNING"
    assert "river at alert level" in alert.trigger_reasons
    assert "rainfall forecast >50mm/72h" in alert.trigger_reasons


def test_alert_builds_watch_for_rain_threshold_only():
    alert = build_alert(flood_status(hours_to_arrival=90, level=2.5, rain_mm=58))

    assert alert.tier == "WATCH"
    assert alert.action_required


def test_dispatch_without_twilio_is_simulated():
    alert = build_alert(flood_status())
    result = dispatch_alert(
        alert_id=alert.alert_id,
        tier=alert.tier,
        farmer_name="Nguyen Van A",
        phone="+84901234567",
        channel="sms",
        twilio_configured=False,
    )

    assert result.dispatch_status == "simulated"
    assert result.sms_sent is False
    assert result.push_sent is True


def test_build_alert_includes_rainfall_series():
    alert = build_alert(flood_status(hours_to_arrival=48, level=3.6, rain_mm=55))
    assert len(alert.rainfall_forecast) == 7
    assert alert.rainfall_tier in {"WATCH", "WARNING"}


def test_rainfall_forecast_buckets_use_anchor_date():
    status = flood_status(hours_to_arrival=90, level=2.5, rain_mm=58)
    points, tier = build_rainfall_forecast(status, anchor_date=date(2026, 5, 2))
    assert len(points) == 7
    assert sum(p.mm for p in points) == 58.0
    assert tier == "WARNING"


def test_rainfall_tier_watch_when_light_rain():
    status = flood_status(hours_to_arrival=90, level=2.5, rain_mm=12)
    _, tier = build_rainfall_forecast(status, anchor_date=date(2026, 5, 2))
    assert tier == "WATCH"


def test_rainfall_tier_warning_when_single_day_heavy():
    status = FloodStatusResponse(
        river=RiverStatus(
            station="Tan Chau",
            current_level_m=2.5,
            trend="steady",
            rise_rate_cm_per_hr=0.5,
            alert_level_m=3.5,
            danger_level_m=4.5,
            status="NORMAL",
            updated="2026-05-02T06:00:00",
        ),
        prediction=FloodPrediction(
            risk_level="LOW",
            hours_to_arrival=120,
            predicted_depth_cm=10,
            predicted_duration_days=1,
            confidence="high",
            explanation="",
        ),
        forecast=[
            RainfallForecast(time="2026-05-02 09:00:00", rain_mm=90.0, temp=30, humidity=80),
        ],
        cached=False,
        data_sources=["fixture"],
        source_freshness={"mrc": "fresh", "openweather": "fresh", "nasa": "fresh"},
        stale_reason=None,
    )
    _, tier = build_rainfall_forecast(status, anchor_date=date(2026, 5, 2))
    assert tier == "WARNING"
