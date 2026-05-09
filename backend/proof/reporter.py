from datetime import datetime, timezone
import re

from backend.proof.compensation import calculate_compensation
from backend.proof.models import LossReportResponse, PhotoMetadata

REQUIRED_DOCUMENTS = [
    "Don de nghi ho tro",
    "Bien ban thiet hai co xac nhan UBND xa",
    "Anh chup thiet hai co GPS va thoi gian",
    "Giay chung nhan quyen su dung dat",
]


def build_loss_report(
    farmer_name: str,
    field_id: str,
    crop_type: str,
    area_ha: float,
    loss_pct: int,
    flood_duration: str,
    lat: float,
    lon: float,
    photos_count: int,
    photo_metadata: list[PhotoMetadata] | None = None,
) -> LossReportResponse:
    del flood_duration, lat, lon
    if photos_count < 2:
        raise ValueError("MISSING_PHOTOS")
    if photos_count > 6:
        raise ValueError("TOO_MANY_PHOTOS")
    compensation = calculate_compensation(crop_type=crop_type, area_ha=area_ha, loss_pct=loss_pct)
    report_id = _report_id(field_id)
    return LossReportResponse(
        report_id=report_id,
        farmer_name=farmer_name,
        field_id=field_id,
        compensation=compensation,
        evidence_completeness_pct=_completeness(photos_count),
        photos_accepted=photos_count,
        photo_metadata=photo_metadata or [],
        required_documents=REQUIRED_DOCUMENTS,
        pdf_url=f"/reports/{report_id}.pdf",
        status="pending_submission",
    )


def _report_id(field_id: str) -> str:
    province_code = _province_code(field_id)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    safe_field_id = re.sub(r"[^A-Za-z0-9-]", "-", field_id).strip("-")
    return f"FG-{province_code}-{safe_field_id}-{timestamp}"


def _province_code(field_id: str) -> str:
    match = re.match(r"([A-Za-z]{2})", field_id)
    return match.group(1).upper() if match else "VN"


def _completeness(photos_count: int) -> int:
    photo_score = min(68, round((photos_count / 4) * 68))
    return min(100, photo_score + 32)
