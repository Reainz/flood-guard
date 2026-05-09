from pydantic import BaseModel, Field


class RiverStatus(BaseModel):
    station: str
    current_level_m: float
    trend: str
    rise_rate_cm_per_hr: float
    alert_level_m: float
    danger_level_m: float
    status: str
    updated: str


class FloodPrediction(BaseModel):
    risk_level: str
    hours_to_arrival: int
    predicted_depth_cm: float
    predicted_duration_days: int
    confidence: str
    explanation: str


class RainfallForecast(BaseModel):
    time: str
    rain_mm: float = Field(ge=0)
    temp: float
    humidity: int


class FloodStatusResponse(BaseModel):
    river: RiverStatus
    prediction: FloodPrediction
    forecast: list[RainfallForecast]
    cached: bool
    data_sources: list[str]
    source_freshness: dict[str, str]
    stale_reason: str | None = None


class FloodInputs(BaseModel):
    river: dict
    forecast: list[dict]
    nasa: dict
    cached: bool
    data_sources: list[str]
    source_freshness: dict[str, str]
    stale_reason: str | None = None
