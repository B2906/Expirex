"""Shared CSV loading and JSON normalization helpers for ExpireX."""

from __future__ import annotations

import ast
import os
from datetime import date, datetime
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


DATASET_FILES = {
    "hubs": "hubs.csv",
    "routes": "vehicles_routes.csv",
    "shipments": "shipments.csv",
    "misplaced": "misplaced_events.csv",
    "detected_misplacements": "detected_misplacements.csv",
    "scored_recovery_paths": "scored_recovery_paths.csv",
    "assignments": "final_assignments.csv",
    "monte_carlo": "monte_carlo_confidence.csv",
    "recovery_results": "final_recovery_results.csv",
    "route_capacity": "final_route_capacity.csv",
}


def dataset_directory() -> Path:
    configured = os.getenv("EXPIREX_DATASETS_DIR")
    return Path(configured) if configured else Path(__file__).resolve().parents[2] / "datasets"


def load_dataframe(name: str) -> pd.DataFrame:
    """Load a named dataset, returning an empty frame when it is unavailable."""
    if name not in DATASET_FILES:
        raise ValueError(f"Unknown dataset: {name}")
    path = dataset_directory() / DATASET_FILES[name]
    if not path.exists():
        return pd.DataFrame()
    return pd.read_csv(path)


def parse_serialized_list(value: Any) -> Any:
    """Safely parse list-like CSV values without executing arbitrary code."""
    if not isinstance(value, str):
        return value
    stripped = value.strip()
    if not (stripped.startswith("[") and stripped.endswith("]")):
        return value
    try:
        parsed = ast.literal_eval(stripped)
    except (SyntaxError, ValueError):
        return value
    return parsed if isinstance(parsed, list) else value


def json_safe(value: Any) -> Any:
    """Recursively convert Pandas, NumPy, timestamp, and list values for JSON."""
    if value is None:
        return None
    if isinstance(value, (pd.Timestamp, datetime, date)):
        return value.isoformat()
    if isinstance(value, np.generic):
        return json_safe(value.item())
    if isinstance(value, float) and np.isnan(value):
        return None
    if isinstance(value, (list, tuple, set)):
        return [json_safe(item) for item in value]
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, str):
        parsed = parse_serialized_list(value)
        return json_safe(parsed) if parsed is not value else value
    return value


def records(frame: pd.DataFrame) -> list[dict[str, Any]]:
    if frame.empty:
        return []
    return [json_safe(record) for record in frame.to_dict(orient="records")]


def first_record(frame: pd.DataFrame) -> dict[str, Any] | None:
    values = records(frame.head(1))
    return values[0] if values else None


def filter_by_id(frame: pd.DataFrame, shipment_id: str) -> pd.DataFrame:
    if frame.empty or "shipment_id" not in frame.columns:
        return pd.DataFrame(columns=frame.columns)
    return frame[frame["shipment_id"].astype(str) == shipment_id]
