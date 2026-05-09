from backend.flood.predictor import get_flood_status
from backend.flood.models import FloodStatusResponse


def test_flood_status_returns_contract_shape():
    status = get_flood_status(lat=10.52, lon=105.12)

    assert isinstance(status, FloodStatusResponse)
    assert status.prediction.risk_level in {"LOW", "MODERATE", "HIGH", "CRITICAL"}
    assert status.river.station == "Tan Chau"
    assert status.forecast
    assert isinstance(status.cached, bool)
    assert status.data_sources
    assert status.source_freshness


def test_high_river_level_produces_at_least_high_risk():
    status = get_flood_status(lat=10.52, lon=105.12)
    assert status.prediction.risk_level in {"HIGH", "CRITICAL"}
