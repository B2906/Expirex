"""Access to persisted Monte Carlo confidence results."""

from .data_loader import filter_by_id, load_dataframe, records


def all_confidence_results() -> list[dict]:
    return records(load_dataframe("monte_carlo"))


def confidence_for(shipment_id: str) -> list[dict]:
    return records(filter_by_id(load_dataframe("monte_carlo"), shipment_id))
