from typing import Literal

from pydantic import BaseModel, Field


class Alert(BaseModel):
    tier: str
    title: str
    message: str
    action_required: str


class AlertResponse(BaseModel):
    alert_id: str
    tier: Literal["WATCH", "WARNING", "CRITICAL"]
    station: str
    trigger_reasons: list[str]
    dedupe_key: str
    title: str
    message: str
    action_required: str
    source_freshness: dict[str, str]
    cached: bool
    stale_reason: str | None = None
    dispatch_status: str = "not_dispatched"


class AlertDispatchRequest(BaseModel):
    alert_id: str
    tier: Literal["WATCH", "WARNING", "CRITICAL"]
    farmer_name: str = Field(min_length=1)
    phone: str | None = None
    channel: Literal["sms", "push", "both"] = "both"


class AlertDispatchResponse(BaseModel):
    alert_id: str
    tier: str
    dispatch_status: Literal["sent", "simulated"]
    push_sent: bool
    sms_sent: bool
    detail: str
