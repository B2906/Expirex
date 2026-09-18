"""Access to persisted recovery path results."""

from .data_loader import filter_by_id, load_dataframe, records


def all_paths() -> list[dict]:
    return records(load_dataframe("scored_recovery_paths"))


def paths_for(shipment_id: str) -> list[dict]:
    return records(filter_by_id(load_dataframe("scored_recovery_paths"), shipment_id))


def all_routes() -> list[dict]:
    return records(load_dataframe("routes"))


def all_hubs() -> list[dict]:
    return records(load_dataframe("hubs"))
