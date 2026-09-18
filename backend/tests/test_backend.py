from pathlib import Path

from fastapi.testclient import TestClient

from backend.main import app
from backend.services.data_loader import load_dataframe, parse_serialized_list


client = TestClient(app)


def test_csv_loading():
    frame = load_dataframe("shipments")
    assert not frame.empty
    assert "shipment_id" in frame.columns


def test_serialized_list_is_safe_and_parsed():
    assert parse_serialized_list("['R0174']") == ["R0174"]
    assert parse_serialized_list("not a list") == "not a list"


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_dashboard():
    response = client.get("/dashboard")
    assert response.status_code == 200
    body = response.json()
    assert body["total_shipments"] == 150
    assert "recovery_confidence" in body


def test_shipments():
    response = client.get("/shipments")
    assert response.status_code == 200
    assert len(response.json()) == 150


def test_shipment_details():
    response = client.get("/shipments/S0003")
    assert response.status_code == 200
    assert response.json()["shipment"]["shipment_id"] == "S0003"


def test_unknown_shipment_is_not_found():
    assert client.get("/shipments/UNKNOWN").status_code == 404


def test_recovery_details():
    response = client.get("/recovery/S0003")
    assert response.status_code == 200
    body = response.json()
    assert body["shipment_id"] == "S0003"
    assert body["paths"]
