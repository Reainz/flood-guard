from backend.proof.compensation import calculate_compensation
from backend.proof.reporter import build_loss_report


def test_compensation_zero_below_threshold():
    result = calculate_compensation(crop_type="rice", area_ha=2.0, loss_pct=29)

    assert result.eligible is False
    assert result.compensation_vnd == 0
    assert result.rate_vnd_per_ha == 0


def test_compensation_lower_and_higher_tiers():
    lower = calculate_compensation(crop_type="rice", area_ha=1.0, loss_pct=50)
    higher = calculate_compensation(crop_type="rice", area_ha=1.0, loss_pct=80)

    assert lower.eligible is True
    assert lower.rate_vnd_per_ha == 2000000
    assert higher.eligible is True
    assert higher.rate_vnd_per_ha == 4600000
    assert higher.compensation_vnd > lower.compensation_vnd


def test_loss_report_generates_report_id_and_completeness():
    report = build_loss_report(
        farmer_name="Nguyen Van A",
        field_id="AG-TCPU-2024-00847",
        crop_type="rice",
        area_ha=2.4,
        loss_pct=75,
        flood_duration="2-5days",
        lat=10.52,
        lon=105.12,
        photos_count=4,
    )

    assert report.report_id.startswith("FG-AG-AG-TCPU-2024-00847-")
    assert report.evidence_completeness_pct == 100
    assert report.photos_accepted == 4
    assert report.compensation.eligible is True
