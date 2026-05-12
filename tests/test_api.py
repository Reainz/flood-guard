from datetime import date, timedelta

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "app": "FloodGuard Vietnam",
        "version": "0.1.0",
    }


def test_flood_status_endpoint():
    response = client.get("/flood-status", params={"lat": 10.52, "lon": 105.12})

    assert response.status_code == 200
    data = response.json()
    assert data["river"]["station"] == "Tan Chau"
    assert data["prediction"]["risk_level"] in {"LOW", "MODERATE", "HIGH", "CRITICAL"}
    assert isinstance(data["forecast"], list)
    assert "cached" in data
    assert data["data_sources"]
    assert data["source_freshness"]


def test_alerts_endpoint():
    response = client.get("/alerts", params={"lat": 10.52, "lon": 105.12, "station": "Tan Chau"})

    assert response.status_code == 200
    data = response.json()
    assert data["tier"] in {"WATCH", "WARNING", "CRITICAL"}
    assert data["trigger_reasons"]
    assert data["dedupe_key"]
    assert data["dispatch_status"] == "not_dispatched"
    assert len(data["rainfall_forecast"]) == 7
    assert data["rainfall_tier"] in {"WATCH", "WARNING"}


def test_alert_dispatch_endpoint_simulates_without_twilio():
    alert = client.get("/alerts").json()
    response = client.post(
        "/alerts/dispatch",
        json={
            "alert_id": alert["alert_id"],
            "tier": alert["tier"],
            "farmer_name": "Nguyen Van A",
            "phone": "+84901234567",
            "channel": "sms",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["dispatch_status"] == "simulated"
    assert data["push_sent"] is True


def test_harvest_decision_endpoint():
    response = client.post(
        "/harvest-decision",
        json={
            "planting_date": (date.today() - timedelta(days=88)).isoformat(),
            "crop_type": "rice",
            "field_area_ha": 2.4,
            "elevation": "medium",
            "days_to_flood": 3,
            "predicted_flood_depth_cm": 65.0,
            "predicted_flood_duration_days": 5,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) == 3
    assert sum(1 for scenario in data["scenarios"] if scenario["is_recommended"]) == 1
    assert all(isinstance(scenario["loss_pct"], int) for scenario in data["scenarios"])
    assert data["recommended"] in {"harvest_now", "wait", "harvest_after"}


def test_harvest_decision_rejects_invalid_crop():
    response = client.post(
        "/harvest-decision",
        json={
            "planting_date": (date.today() - timedelta(days=88)).isoformat(),
            "crop_type": "coffee",
            "field_area_ha": 2.4,
            "elevation": "medium",
            "days_to_flood": 3,
            "predicted_flood_depth_cm": 65.0,
            "predicted_flood_duration_days": 5,
        },
    )

    assert response.status_code == 422


def test_loss_report_rejects_missing_photos():
    response = client.post(
        "/loss-report",
        data={
            "farmer_name": "Nguyen Van A",
            "field_id": "AG-TCPU-2024-00847",
            "crop_type": "rice",
            "area_ha": "2.4",
            "loss_pct": "75",
            "flood_duration": "2-5days",
            "lat": "10.52",
            "lon": "105.12",
        },
    )

    assert response.status_code == 422


def test_loss_report_accepts_two_photos():
    files = [
        ("photos", ("before.jpg", b"before-image", "image/jpeg")),
        ("photos", ("after.jpg", b"after-image", "image/jpeg")),
    ]
    response = client.post(
        "/loss-report",
        data={
            "farmer_name": "Nguyen Van A",
            "field_id": "AG-TCPU-2024-00847",
            "crop_type": "rice",
            "area_ha": "2.4",
            "loss_pct": "75",
            "flood_duration": "2-5days",
            "lat": "10.52",
            "lon": "105.12",
        },
        files=files,
    )

    assert response.status_code == 200
    data = response.json()
    assert data["photos_accepted"] == 2
    assert len(data["photo_metadata"]) == 2
    assert data["pdf_url"].endswith(".pdf")
    assert data["status"] == "pending_submission"


def test_loss_report_rejects_non_image_file():
    files = [
        ("photos", ("before.txt", b"before-image", "text/plain")),
        ("photos", ("after.jpg", b"after-image", "image/jpeg")),
    ]
    response = client.post(
        "/loss-report",
        data={
            "farmer_name": "Nguyen Van A",
            "field_id": "AG-TCPU-2024-00847",
            "crop_type": "rice",
            "area_ha": "2.4",
            "loss_pct": "75",
            "flood_duration": "2-5days",
            "lat": "10.52",
            "lon": "105.12",
        },
        files=files,
    )

    assert response.status_code == 422
