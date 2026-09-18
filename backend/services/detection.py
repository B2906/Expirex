"""Access to persisted anomaly detection results."""

from .data_loader import filter_by_id, load_dataframe, records


def all_anomalies() -> list[dict]:
    return records(load_dataframe("detected_misplacements"))


def all_misplaced_events() -> list[dict]:
    return records(load_dataframe("misplaced"))


def anomalies_for(shipment_id: str) -> list[dict]:
    detected = filter_by_id(load_dataframe("detected_misplacements"), shipment_id)
    events = filter_by_id(load_dataframe("misplaced"), shipment_id)
    return records(detected if not detected.empty else events)
