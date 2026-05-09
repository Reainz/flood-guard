from datetime import date

from backend.alerts.models import Alert, AlertDispatchResponse, AlertResponse
from backend.flood.models import FloodStatusResponse


def alert_from_flood_status(status: FloodStatusResponse) -> Alert:
    risk = status.prediction.risk_level
    if risk == "CRITICAL":
        return Alert(
            tier="CRITICAL",
            title="Khan cap",
            message="Lu co the den trong vong 24 gio.",
            action_required="Thu hoach ngay hoac di tan theo huong dan dia phuong.",
        )
    if risk == "HIGH":
        return Alert(
            tier="WARNING",
            title="Canh bao lu",
            message="Song dang o muc bao dong va tiep tuc tang.",
            action_required="Kiem tra quyet dinh thu hoach.",
        )
    return Alert(
        tier="WATCH",
        title="Theo doi",
        message="Theo doi muc nuoc va mua trong 72 gio toi.",
        action_required="Chuan bi vat tu va cap nhat du lieu.",
    )


def build_alert(status: FloodStatusResponse, station: str | None = None) -> AlertResponse:
    station_name = station or status.river.station
    tier, reasons = _tier_and_reasons(status)
    alert = _alert_copy(tier=tier, status=status)
    today = date.today().isoformat()
    return AlertResponse(
        alert_id=f"{station_name}_{tier}_{today}",
        tier=tier,
        station=station_name,
        trigger_reasons=reasons,
        dedupe_key=f"{station_name}_{tier}_{today}",
        title=alert.title,
        message=alert.message,
        action_required=alert.action_required,
        source_freshness=status.source_freshness,
        cached=status.cached,
        stale_reason=status.stale_reason,
    )


def dispatch_alert(
    alert_id: str,
    tier: str,
    farmer_name: str,
    phone: str | None,
    channel: str,
    twilio_configured: bool,
) -> AlertDispatchResponse:
    del farmer_name, phone
    push_requested = channel in {"push", "both", "sms"}
    sms_requested = channel in {"sms", "both"}
    sms_sent = bool(sms_requested and twilio_configured)
    status = "sent" if sms_sent or push_requested else "simulated"
    if sms_requested and not twilio_configured:
        status = "simulated"
    return AlertDispatchResponse(
        alert_id=alert_id,
        tier=tier,
        dispatch_status=status,
        push_sent=push_requested,
        sms_sent=sms_sent,
        detail="Twilio not configured; SMS simulated." if sms_requested and not twilio_configured else "Dispatch recorded.",
    )


def _tier_and_reasons(status: FloodStatusResponse) -> tuple[str, list[str]]:
    rainfall_72h = sum(item.rain_mm for item in status.forecast)
    reasons = []
    if status.river.current_level_m >= status.river.danger_level_m:
        reasons.append("river at danger level")
    if status.prediction.hours_to_arrival < 24:
        reasons.append("hours_to_arrival < 24")
    if reasons:
        return "CRITICAL", reasons

    if status.river.current_level_m >= status.river.alert_level_m:
        reasons.append("river at alert level")
    if status.prediction.hours_to_arrival < 72:
        reasons.append("hours_to_arrival < 72")
    if rainfall_72h > 50:
        reasons.append("rainfall forecast >50mm/72h")
    if status.river.current_level_m >= status.river.alert_level_m or status.prediction.hours_to_arrival < 72:
        return "WARNING", reasons
    if rainfall_72h > 50:
        return "WATCH", reasons
    return "WATCH", ["monitoring active"]


def _alert_copy(tier: str, status: FloodStatusResponse) -> Alert:
    if tier == "CRITICAL":
        return Alert(
            tier=tier,
            title="Khan cap",
            message=f"Lu den trong {status.prediction.hours_to_arrival} gio. Do sau uoc tinh ~{round(status.prediction.predicted_depth_cm)}cm.",
            action_required="Thu hoach ngay hoac di tan theo huong dan dia phuong.",
        )
    if tier == "WARNING":
        return Alert(
            tier=tier,
            title="Canh bao lu",
            message=f"Song {status.river.station}: {status.river.current_level_m}m, dang tang. Du kien {status.prediction.hours_to_arrival}h nua.",
            action_required="Mo quyet dinh thu hoach va chon phuong an thiet hai thap nhat.",
        )
    return Alert(
        tier=tier,
        title="Theo doi",
        message="Mua lon hoac muc nuoc dang can theo doi trong 72 gio toi.",
        action_required="Chuan bi vat tu va cap nhat du lieu thuong xuyen.",
    )
