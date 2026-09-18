"""Access to persisted recovery path scores."""

from .data_loader import filter_by_id, load_dataframe, records


def scores_for(shipment_id: str | None = None) -> list[dict]:
    frame = load_dataframe("scored_recovery_paths")
    if shipment_id is not None:
        frame = filter_by_id(frame, shipment_id)
    return records(frame)
