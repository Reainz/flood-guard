from datetime import date, timedelta

import pytest

from backend.harvest.engine import make_harvest_decision
from backend.harvest.models import HarvestDecision


@pytest.fixture
def grain_filling_params():
    return {
        "planting_date": date.today() - timedelta(days=88),
        "crop_type": "rice",
        "field_area_ha": 2.4,
        "elevation": "medium",
        "days_to_flood": 3,
        "predicted_flood_depth_cm": 65.0,
        "predicted_flood_duration_days": 5,
    }


def test_returns_three_scenarios_with_integer_losses(grain_filling_params):
    decision = make_harvest_decision(**grain_filling_params)

    assert isinstance(decision, HarvestDecision)
    assert {scenario.label for scenario in decision.scenarios} == {
        "harvest_now",
        "wait",
        "harvest_after",
    }
    assert all(isinstance(scenario.loss_pct, int) for scenario in decision.scenarios)


def test_recommended_scenario_has_minimum_loss(grain_filling_params):
    decision = make_harvest_decision(**grain_filling_params)
    recommended = [scenario for scenario in decision.scenarios if scenario.is_recommended]

    assert len(recommended) == 1
    assert recommended[0].label == decision.recommended
    assert recommended[0].loss_pct == min(scenario.loss_pct for scenario in decision.scenarios)


def test_deeper_flood_increases_wait_loss(grain_filling_params):
    shallow = make_harvest_decision(
        **{**grain_filling_params, "predicted_flood_depth_cm": 20.0}
    )
    deep = make_harvest_decision(
        **{**grain_filling_params, "predicted_flood_depth_cm": 150.0}
    )

    shallow_wait = next(s for s in shallow.scenarios if s.label == "wait")
    deep_wait = next(s for s in deep.scenarios if s.label == "wait")
    assert deep_wait.loss_pct > shallow_wait.loss_pct


def test_low_elevation_increases_wait_loss(grain_filling_params):
    medium = make_harvest_decision(**grain_filling_params)
    low = make_harvest_decision(**{**grain_filling_params, "elevation": "low"})

    medium_wait = next(s for s in medium.scenarios if s.label == "wait")
    low_wait = next(s for s in low.scenarios if s.label == "wait")
    assert low_wait.loss_pct >= medium_wait.loss_pct


def test_compensation_is_not_eligible_below_thirty_percent():
    decision = make_harvest_decision(
        planting_date=date.today() - timedelta(days=115),
        crop_type="rice",
        field_area_ha=1.0,
        elevation="high",
        days_to_flood=7,
        predicted_flood_depth_cm=15.0,
        predicted_flood_duration_days=1,
    )

    assert decision.compensation.eligible is False
    assert decision.compensation.compensation_vnd == 0


@pytest.mark.parametrize("crop_type", ["rice", "maize", "vegetables", "fruit_trees"])
def test_supported_crop_types_return_decision(crop_type, grain_filling_params):
    decision = make_harvest_decision(**{**grain_filling_params, "crop_type": crop_type})
    assert decision.crop_type == crop_type


def test_invalid_crop_type_raises_validation_error(grain_filling_params):
    with pytest.raises(ValueError, match="INVALID_CROP_TYPE"):
        make_harvest_decision(**{**grain_filling_params, "crop_type": "coffee"})
