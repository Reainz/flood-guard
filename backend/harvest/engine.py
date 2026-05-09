from datetime import date

from backend.harvest.crop_calendar import CROP_DURATION_DAYS, CROP_STAGE_OFFSET, GROWTH_STAGES
from backend.harvest.irri_tables import (
    EARLY_HARVEST_PENALTY,
    ELEVATION_MODIFIER,
    IRRI_FLOOD_DAMAGE,
    POST_FLOOD_QUALITY_LOSS,
)
from backend.harvest.models import (
    CompensationEstimate,
    HarvestDecision,
    HarvestScenario,
)
from backend.proof.compensation import calculate_compensation

SUPPORTED_CROPS = {"rice", "maize", "vegetables", "fruit_trees"}
SUPPORTED_ELEVATIONS = {"low", "medium", "high"}
TIE_BREAK_ORDER = {"harvest_now": 0, "harvest_after": 1, "wait": 2}


def make_harvest_decision(
    planting_date: date,
    crop_type: str,
    field_area_ha: float,
    elevation: str,
    days_to_flood: int,
    predicted_flood_depth_cm: float,
    predicted_flood_duration_days: int,
) -> HarvestDecision:
    if crop_type not in SUPPORTED_CROPS:
        raise ValueError("INVALID_CROP_TYPE")
    if elevation not in SUPPORTED_ELEVATIONS:
        raise ValueError("INVALID_ELEVATION")
    if planting_date > date.today():
        raise ValueError("INVALID_DATE")

    days_after_planting = max(0, (date.today() - planting_date).days)
    growth_stage, growth_stage_vi = _growth_stage(days_after_planting, crop_type)
    days_to_harvest = max(0, CROP_DURATION_DAYS[crop_type] - days_after_planting)
    losses = _scenario_losses(
        growth_stage=growth_stage,
        elevation=elevation,
        days_to_flood=days_to_flood,
        depth_cm=predicted_flood_depth_cm,
        duration_days=predicted_flood_duration_days,
    )
    recommended = min(losses.items(), key=lambda item: (item[1], TIE_BREAK_ORDER[item[0]]))[0]
    scenarios = [
        _scenario(
            label="harvest_now",
            label_vi="Thu hoach ngay",
            loss_pct=losses["harvest_now"],
            recommended=recommended,
            days_to_flood=days_to_flood,
        ),
        _scenario(
            label="wait",
            label_vi="Cho - lu tran vao",
            loss_pct=losses["wait"],
            recommended=recommended,
            days_to_flood=days_to_flood,
        ),
        _scenario(
            label="harvest_after",
            label_vi="Thu hoach sau lu",
            loss_pct=losses["harvest_after"],
            recommended=recommended,
            days_to_flood=days_to_flood,
        ),
    ]
    compensation = calculate_compensation(
        crop_type=crop_type,
        area_ha=field_area_ha,
        loss_pct=losses[recommended],
    )
    return HarvestDecision(
        crop_type=crop_type,
        growth_stage=growth_stage,
        growth_stage_vi=growth_stage_vi,
        days_to_harvest=days_to_harvest,
        scenarios=scenarios,
        recommended=recommended,
        compensation=CompensationEstimate(
            eligible=compensation.eligible,
            compensation_vnd=compensation.compensation_vnd,
            compensation_million_vnd=compensation.compensation_million_vnd,
            rate_vnd_per_ha=compensation.rate_vnd_per_ha,
            legal_basis=compensation.legal_basis,
            submit_deadline_note=compensation.submit_deadline_note,
        ),
        data_sources=[
            "IRRI Knowledge Bank",
            "Vietnam MARD crop calendar",
            "Nghi dinh 02/2017/ND-CP",
        ],
    )


def _growth_stage(days_after_planting: int, crop_type: str) -> tuple[str, str]:
    adjusted_days = round(days_after_planting * CROP_STAGE_OFFSET[crop_type])
    for stage, stage_vi, start, end in GROWTH_STAGES:
        if start <= adjusted_days < end:
            return stage, stage_vi
    return "maturity", "Chin"


def _scenario_losses(
    growth_stage: str,
    elevation: str,
    days_to_flood: int,
    depth_cm: float,
    duration_days: int,
) -> dict[str, int]:
    elevation_modifier = ELEVATION_MODIFIER[elevation]
    urgency_bump = max(0, (4 - days_to_flood) * 3)
    harvest_now = min(95, EARLY_HARVEST_PENALTY[growth_stage] + urgency_bump)

    depth_class = _depth_class(depth_cm)
    base_wait = IRRI_FLOOD_DAMAGE[growth_stage][depth_class] + max(0, duration_days - 3) * 4
    wait = min(99, round(base_wait * elevation_modifier))

    base_after = (
        POST_FLOOD_QUALITY_LOSS[growth_stage]
        + max(0, duration_days - 3) * 2.5
        + max(0.0, depth_cm - 40) * 0.15
    )
    harvest_after = min(99, round(base_after * elevation_modifier * 0.9))
    return {
        "harvest_now": int(round(harvest_now)),
        "wait": int(round(wait)),
        "harvest_after": int(round(harvest_after)),
    }


def _depth_class(depth_cm: float) -> str:
    if depth_cm < 40:
        return "shallow"
    if depth_cm <= 80:
        return "moderate"
    return "deep"


def _scenario(
    label: str,
    label_vi: str,
    loss_pct: int,
    recommended: str,
    days_to_flood: int,
) -> HarvestScenario:
    action_steps = []
    if label == "harvest_now":
        action_steps = [
            f"Lien he hop tac xa de thue may gat - con {days_to_flood} ngay",
            "Uu tien thu hoach cac thua ruong thap truoc",
        ]
    reasoning_by_label = {
        "harvest_now": f"Thu hoach truoc lu - thiet hai uoc tinh {loss_pct}%",
        "wait": f"De lu qua - thiet hai uoc tinh {loss_pct}%",
        "harvest_after": f"Thu hoach sau khi lu rut - thiet hai chat luong {loss_pct}%",
    }
    return HarvestScenario(
        label=label,
        label_vi=label_vi,
        loss_pct=loss_pct,
        is_recommended=label == recommended,
        reasoning=reasoning_by_label[label],
        action_steps=action_steps,
    )
