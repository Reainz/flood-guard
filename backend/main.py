from typing import Annotated
import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.alerts.dispatcher import build_alert, dispatch_alert
from backend.alerts.models import AlertDispatchRequest, AlertDispatchResponse, AlertResponse
from backend.flood.models import FloodStatusResponse
from backend.flood.predictor import get_flood_status
from backend.flood.sources import load_flood_inputs
from backend.harvest.engine import make_harvest_decision
from backend.harvest.models import HarvestDecision, HarvestDecisionRequest
from backend.proof.models import LossReportResponse
from backend.proof.pdf_generator import generate_loss_report_pdf
from backend.proof.reporter import build_loss_report
from backend.proof.storage import PhotoUpload, persist_photos

app = FastAPI(title="FloodGuard Vietnam", version="0.1.0")
app.mount("/reports", StaticFiles(directory="reports", check_dir=False), name="reports")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException):
    del request
    detail = str(exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": detail, "code": _error_code(detail)})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    del request
    message = "Invalid request"
    for error in exc.errors():
        if error.get("msg"):
            message = error["msg"]
            break
    return JSONResponse(status_code=422, content={"error": message, "code": _error_code(message)})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "app": "FloodGuard Vietnam", "version": "0.1.0"}


@app.get("/flood-status", response_model=FloodStatusResponse)
async def flood_status(lat: float = 10.52, lon: float = 105.12) -> FloodStatusResponse:
    inputs = load_flood_inputs(lat=lat, lon=lon)
    return get_flood_status(lat=lat, lon=lon, inputs=inputs)


@app.get("/alerts", response_model=AlertResponse)
async def alerts(lat: float = 10.52, lon: float = 105.12, station: str = "Tan Chau") -> AlertResponse:
    inputs = load_flood_inputs(lat=lat, lon=lon)
    status = get_flood_status(lat=lat, lon=lon, inputs=inputs)
    return build_alert(status=status, station=station)


@app.post("/alerts/dispatch", response_model=AlertDispatchResponse)
async def alerts_dispatch(request: AlertDispatchRequest) -> AlertDispatchResponse:
    twilio_configured = all(
        os.getenv(name)
        for name in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER")
    )
    return dispatch_alert(
        alert_id=request.alert_id,
        tier=request.tier,
        farmer_name=request.farmer_name,
        phone=request.phone,
        channel=request.channel,
        twilio_configured=twilio_configured,
    )


@app.post("/harvest-decision", response_model=HarvestDecision)
async def harvest_decision(request: HarvestDecisionRequest) -> HarvestDecision:
    try:
        return make_harvest_decision(**request.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/loss-report", response_model=LossReportResponse)
async def loss_report(
    farmer_name: Annotated[str, Form(min_length=1)],
    field_id: Annotated[str, Form(min_length=1)],
    crop_type: Annotated[str, Form(min_length=1)],
    area_ha: Annotated[float, Form(gt=0, le=100)],
    loss_pct: Annotated[int, Form(ge=0, le=100)],
    flood_duration: Annotated[str, Form(min_length=1)],
    lat: Annotated[float, Form()],
    lon: Annotated[float, Form()],
    photos: Annotated[list[UploadFile], File(min_length=2, max_length=6)],
) -> LossReportResponse:
    photo_count = len(photos)
    if photo_count < 2:
        raise HTTPException(status_code=422, detail="MISSING_PHOTOS")
    if photo_count > 6:
        raise HTTPException(status_code=422, detail="TOO_MANY_PHOTOS")

    photo_uploads = []
    photo_type_values = ["before", "after", "detail", "water_depth", "extra", "extra"]
    for index, photo in enumerate(photos):
        content = await photo.read()
        photo_uploads.append(
            PhotoUpload(
                filename=photo.filename or f"photo-{index + 1}.jpg",
                content=content,
                content_type=photo.content_type or "",
                photo_type=photo_type_values[index],
            )
        )

    report = build_loss_report(
        farmer_name=farmer_name,
        field_id=field_id,
        crop_type=crop_type,
        area_ha=area_ha,
        loss_pct=loss_pct,
        flood_duration=flood_duration,
        lat=lat,
        lon=lon,
        photos_count=photo_count,
    )
    try:
        metadata = persist_photos(report_id=report.report_id, photos=photo_uploads)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    report = build_loss_report(
        farmer_name=farmer_name,
        field_id=field_id,
        crop_type=crop_type,
        area_ha=area_ha,
        loss_pct=loss_pct,
        flood_duration=flood_duration,
        lat=lat,
        lon=lon,
        photos_count=photo_count,
        photo_metadata=metadata,
    )
    generate_loss_report_pdf(report=report, lat=lat, lon=lon)
    return report


def _error_code(message: str) -> str:
    normalized = message.upper().replace(" ", "_").replace("VALUE_ERROR,", "").strip("_")
    if "INVALID_CROP_TYPE" in normalized:
        return "INVALID_CROP_TYPE"
    if "INVALID_DATE" in normalized:
        return "INVALID_DATE"
    if "MISSING_PHOTOS" in normalized:
        return "MISSING_PHOTOS"
    if "INVALID_PHOTO_TYPE" in normalized:
        return "INVALID_PHOTO_TYPE"
    if "PHOTO_TOO_LARGE" in normalized:
        return "PHOTO_TOO_LARGE"
    return normalized[:64] or "INVALID_REQUEST"
