"""Dataset-backed recovery explanations; no recovery calculations are performed."""

from typing import Any

from .auction import assignments_for
from .data_loader import filter_by_id, first_record, load_dataframe
from .detection import anomalies_for
from .monte_carlo import confidence_for
from .routing import paths_for


def shipment_bundle(shipment_id: str) -> dict[str, Any] | None:
    shipment = first_record(filter_by_id(load_dataframe("shipments"), shipment_id))
    if shipment is None:
        return None
    return {
        "shipment": shipment,
        "anomalies": anomalies_for(shipment_id),
        "recovery_paths": paths_for(shipment_id),
        "assignments": assignments_for(shipment_id),
        "monte_carlo": confidence_for(shipment_id),
    }


def explanation_for(shipment_id: str) -> dict[str, Any] | None:
    bundle = shipment_bundle(shipment_id)
    if bundle is None:
        return None

    shipment = bundle["shipment"]
    anomaly = bundle["anomalies"][0] if bundle["anomalies"] else {}
    path = bundle["recovery_paths"][0] if bundle["recovery_paths"] else {}
    assignment = bundle["assignments"][0] if bundle["assignments"] else {}
    confidence = bundle["monte_carlo"][0] if bundle["monte_carlo"] else {}
    route = assignment.get("selected_path", path.get("path"))

    facts = []
    if anomaly.get("deviation_type") is not None:
        facts.append(f"anomaly type is {anomaly['deviation_type']}")
    if path.get("path_score") is not None:
        facts.append(f"the persisted path score is {path['path_score']}")
    if assignment.get("status") is not None:
        facts.append(f"allocation status is {assignment['status']}")
    if confidence.get("confidence_percent") is not None:
        facts.append(f"Monte Carlo confidence is {confidence['confidence_percent']}%")
    reason = "Persisted pipeline results are available: " + ", ".join(facts) + "." if facts else (
        "No persisted recovery analysis is available for this shipment."
    )

    return {
        "shipment_id": shipment_id,
        "original_hub": shipment.get("origin_hub"),
        "current_hub": anomaly.get("last_known_hub"),
        "destination": shipment.get("destination_hub"),
        "anomaly": anomaly.get("deviation_type"),
        "severity": anomaly.get("severity_score"),
        "time_lost": anomaly.get("time_lost_min"),
        "recovery_route": route,
        "path_score": assignment.get("path_score", path.get("path_score")),
        "cost": assignment.get("total_cost", path.get("total_cost")),
        "allocation_status": assignment.get("status"),
        "monte_carlo_confidence": confidence.get("confidence_percent"),
        "reason": reason,
    }
