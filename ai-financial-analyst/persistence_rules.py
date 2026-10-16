"""
persistence_rules.py — Pure Persistence & Serialization Rules

Contains pure logic for serializing/deserializing portfolio ledgers, order history,
building point-in-time state snapshots, and validating snapshot integrity.

No database, network, or websocket calls inside this module.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from persistence_models import PortfolioSnapshot

logger = logging.getLogger("persistence_rules")


def serialize_portfolio(portfolio_data: Dict[str, Any]) -> str:
    """Serialize portfolio summary dictionary into clean JSON string."""
    try:
        return json.dumps(portfolio_data, indent=2)
    except Exception as exc:
        logger.error("Error serializing portfolio data: %s", exc)
        return "{}"


def deserialize_portfolio(json_str: str) -> Dict[str, Any]:
    """Deserialize JSON string into portfolio dictionary."""
    try:
        return json.loads(json_str)
    except Exception as exc:
        logger.error("Error deserializing portfolio JSON: %s", exc)
        return {}


def serialize_orders(orders_list: List[Dict[str, Any]]) -> str:
    """Serialize orders list into clean JSON string."""
    try:
        return json.dumps(orders_list, indent=2)
    except Exception as exc:
        logger.error("Error serializing orders list: %s", exc)
        return "[]"


def deserialize_orders(json_str: str) -> List[Dict[str, Any]]:
    """Deserialize JSON string into orders list."""
    try:
        return json.loads(json_str)
    except Exception as exc:
        logger.error("Error deserializing orders JSON: %s", exc)
        return []


def snapshot_portfolio(
    portfolio_data: Dict[str, Any],
    orders_data: List[Dict[str, Any]],
    user_id: str = "default",
) -> PortfolioSnapshot:
    """Create a point-in-time PortfolioSnapshot combining portfolio and orders state."""
    snapshot_id = f"snap-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    combined_data = {
        "portfolio": portfolio_data,
        "orders": orders_data,
        "snapshot_at": now_iso,
    }

    return PortfolioSnapshot(
        snapshot_id=snapshot_id,
        user_id=user_id,
        portfolio_data=combined_data,
        created_at=now_iso,
    )


def restore_snapshot(snapshot: PortfolioSnapshot) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """Extract portfolio data and orders list from a PortfolioSnapshot envelope."""
    if not snapshot or not snapshot.portfolio_data:
        return ({}, [])

    data = snapshot.portfolio_data
    port_data = data.get("portfolio", {})
    orders_data = data.get("orders", [])

    return (port_data, orders_data)


def validate_snapshot(snapshot: PortfolioSnapshot) -> bool:
    """Validate PortfolioSnapshot structural integrity."""
    if not snapshot or not snapshot.snapshot_id or not snapshot.portfolio_data:
        return False
    if "portfolio" not in snapshot.portfolio_data:
        return False
    return True
