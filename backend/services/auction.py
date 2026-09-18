"""Access to persisted capacity-aware allocation results."""

from .data_loader import filter_by_id, load_dataframe, records


def all_assignments() -> list[dict]:
    return records(load_dataframe("assignments"))


def assignments_for(shipment_id: str) -> list[dict]:
    return records(filter_by_id(load_dataframe("assignments"), shipment_id))
