from pydantic import BaseModel


class CompensationResult(BaseModel):
    eligible: bool
    compensation_vnd: int
    compensation_million_vnd: float
    rate_vnd_per_ha: int
    legal_basis: str
    submit_deadline_note: str = "Submit to provincial DARD within 15 days"


class PhotoMetadata(BaseModel):
    filename: str
    photo_type: str
    content_type: str
    size_bytes: int
    sha256: str
    timestamp: str
    gps_source: str
    path: str


class LossReportResponse(BaseModel):
    report_id: str
    farmer_name: str
    field_id: str
    compensation: CompensationResult
    evidence_completeness_pct: int
    photos_accepted: int
    photo_metadata: list[PhotoMetadata] = []
    required_documents: list[str]
    pdf_url: str
    status: str
