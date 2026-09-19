"""FastAPI application for the ExpireX persisted pipeline outputs."""

from __future__ import annotations

from collections import Counter
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .services.auction import all_assignments, assignments_for
from .services.data_loader import load_dataframe, records
from .services.detection import all_anomalies
from .services.explainability import explanation_for, shipment_bundle
from .services.monte_carlo import all_confidence_results
from .services.routing import all_hubs, all_paths, all_routes, paths_for

app = FastAPI(title="ExpireX API", version="1.0.0")


def cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def shipment_or_404(shipment_id: str) -> dict[str, Any]:
    bundle = shipment_bundle(shipment_id)
    if bundle is None:
        raise HTTPException(status_code=404, detail=f"Shipment '{shipment_id}' was not found")
    return bundle


def combined_shipments() -> list[dict[str, Any]]:
    shipments = load_dataframe("shipments")
    if shipments.empty:
        return []
    anomalies = load_dataframe("detected_misplacements")
    if anomalies.empty:
        anomalies = load_dataframe("misplaced")
    recovery = load_dataframe("recovery_results")
    assignments = load_dataframe("assignments")
    confidence = load_dataframe("monte_carlo")

    result = shipments.copy()
    for frame, suffix in (
        (anomalies, "_anomaly"),
        (recovery, "_recovery"),
        (assignments, "_assignment"),
        (confidence, "_monte_carlo"),
    ):
        if not frame.empty and "shipment_id" in frame.columns:
            result = result.merge(frame, on="shipment_id", how="left", suffixes=("", suffix))
    return records(result)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/dashboard")
def dashboard() -> dict[str, Any]:
    shipments = load_dataframe("shipments")
    anomalies = load_dataframe("detected_misplacements")
    events = load_dataframe("misplaced")
    paths = load_dataframe("scored_recovery_paths")
    assignments = load_dataframe("assignments")
    confidence = load_dataframe("monte_carlo")
    anomaly_types = anomalies if not anomalies.empty else events
    confidence_values = confidence["confidence_percent"].dropna() if "confidence_percent" in confidence else []
    statuses = assignments["status"].dropna().astype(str) if "status" in assignments else []
    return {
        "total_shipments": int(len(shipments)),
        "shipments_with_anomalies": int(anomaly_types["shipment_id"].nunique()) if "shipment_id" in anomaly_types else 0,
        "total_recovery_paths": int(len(paths)),
        "allocated_shipments": int((statuses == "ALLOCATED").sum()),
        "rejected_shipments": int((statuses == "REJECTED").sum()),
        "anomaly_counts": Counter(anomaly_types["deviation_type"].dropna().astype(str)).copy() if "deviation_type" in anomaly_types else {},
        "recovery_confidence": {
            "count": int(len(confidence_values)),
            "average_percent": float(confidence_values.mean()) if len(confidence_values) else None,
            "minimum_percent": float(confidence_values.min()) if len(confidence_values) else None,
            "maximum_percent": float(confidence_values.max()) if len(confidence_values) else None,
        },
    }


@app.get("/shipments")
def shipments() -> list[dict[str, Any]]:
    return combined_shipments()


@app.get("/shipments/{shipment_id}")
def shipment_details(shipment_id: str) -> dict[str, Any]:
    return shipment_or_404(shipment_id)


@app.get("/misplaced")
def misplaced() -> list[dict[str, Any]]:
    return all_anomalies()


@app.get("/hubs")
def hubs() -> list[dict[str, Any]]:
    return all_hubs()


@app.get("/routes")
def routes() -> list[dict[str, Any]]:
    return all_routes()


@app.get("/recovery")
def recovery() -> list[dict[str, Any]]:
    return all_paths()


@app.get("/recovery/{shipment_id}")
def recovery_details(shipment_id: str) -> dict[str, Any]:
    shipment_or_404(shipment_id)
    paths = paths_for(shipment_id)
    assignments = assignments_for(shipment_id)
    if not paths and not assignments:
        return {"shipment_id": shipment_id, "paths": [], "assignments": []}
    return {"shipment_id": shipment_id, "paths": paths, "assignments": assignments}


@app.get("/monte-carlo")
def monte_carlo() -> list[dict[str, Any]]:
    return all_confidence_results()


@app.get("/explanation/{shipment_id}")
def explanation(shipment_id: str) -> dict[str, Any]:
    value = explanation_for(shipment_id)
    if value is None:
        raise HTTPException(status_code=404, detail=f"Shipment '{shipment_id}' was not found")
    return value
