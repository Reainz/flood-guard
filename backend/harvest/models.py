from datetime import date
from typing import Literal

from pydantic import BaseModel, Field, field_validator


CropType = Literal["rice", "maize", "vegetables", "fruit_trees"]
Elevation = Literal["low", "medium", "high"]
ScenarioLabel = Literal["harvest_now", "wait", "harvest_after"]


class HarvestDecisionRequest(BaseModel):
    planting_date: date
    crop_type: CropType
    field_area_ha: float = Field(ge=0.1, le=100)
    elevation: Elevation
    days_to_flood: int = Field(ge=1, le=21)
    predicted_flood_depth_cm: float = Field(ge=10, le=200)
    predicted_flood_duration_days: int = Field(ge=1, le=30)

    @field_validator("planting_date")
    @classmethod
    def planting_date_must_not_be_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("INVALID_DATE")
        return value


class HarvestScenario(BaseModel):
    label: ScenarioLabel
    label_vi: str
    loss_pct: int
    is_recommended: bool
    reasoning: str
    action_steps: list[str]


class CompensationEstimate(BaseModel):
    eligible: bool
    compensation_vnd: int
    compensation_million_vnd: float
    rate_vnd_per_ha: int
    legal_basis: str
    submit_deadline_note: str


class HarvestDecision(BaseModel):
    crop_type: str
    growth_stage: str
    growth_stage_vi: str
    days_to_harvest: int
    scenarios: list[HarvestScenario]
    recommended: ScenarioLabel
    compensation: CompensationEstimate
    data_sources: list[str]
