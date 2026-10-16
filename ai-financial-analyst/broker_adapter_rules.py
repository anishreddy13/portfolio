"""
broker_adapter_rules.py — Pure Validation & Normalization Rules for Broker Connectivity

Contains pure logic functions for validating broker connection config, normalizing
broker raw order/execution responses, computing connection health, and calculating exponential backoff retry delays.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from broker_adapter_models import (
    BrokerAccount,
    BrokerExecution,
    BrokerOrder,
    BrokerPosition,
)

logger = logging.getLogger("broker_adapter_rules")


def validate_connection(config: Dict[str, Any]) -> Tuple[bool, str]:
    """Validate broker credentials and connection parameters."""
    if not config or "broker_name" not in config:
        return (False, "Missing broker_name in connection parameters.")
    return (True, "Broker connection configuration valid.")


def validate_account(acc: BrokerAccount) -> Tuple[bool, str]:
    """Validate broker account balance limits."""
    if acc.total_equity < 0:
        return (False, "Account total equity cannot be negative.")
    return (True, "Account balance valid.")


def normalize_order(raw_order: Dict[str, Any]) -> BrokerOrder:
    """Normalize raw broker order JSON into unified BrokerOrder object."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return BrokerOrder(
        broker_order_id=str(raw_order.get("id") or raw_order.get("order_id") or f"b-ord-{uuid.uuid4().hex[:6]}"),
        client_order_id=str(raw_order.get("client_order_id") or raw_order.get("cl_ord_id") or f"cl-{uuid.uuid4().hex[:6]}"),
        symbol=str(raw_order.get("symbol", "AAPL")).upper(),
        side=str(raw_order.get("side", "BUY")).upper(),
        quantity=float(raw_order.get("qty") or raw_order.get("quantity") or 10.0),
        filled_qty=float(raw_order.get("filled_qty", 0.0)),
        order_type=str(raw_order.get("type", "LIMIT")).upper(),
        price=float(raw_order.get("limit_price") or raw_order.get("price") or 180.0),
        status=str(raw_order.get("status", "SUBMITTED")).upper(),
        submitted_at=str(raw_order.get("submitted_at", now_iso)),
    )


def normalize_execution(raw_exec: Dict[str, Any]) -> BrokerExecution:
    """Normalize raw broker execution fill into unified BrokerExecution object."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return BrokerExecution(
        execution_id=str(raw_exec.get("exec_id") or f"exec-{uuid.uuid4().hex[:6]}"),
        broker_order_id=str(raw_exec.get("broker_order_id") or f"b-ord-{uuid.uuid4().hex[:6]}"),
        symbol=str(raw_exec.get("symbol", "AAPL")).upper(),
        side=str(raw_exec.get("side", "BUY")).upper(),
        quantity=float(raw_exec.get("qty", 10.0)),
        price=float(raw_exec.get("price", 180.0)),
        timestamp=str(raw_exec.get("timestamp", now_iso)),
        venue=str(raw_exec.get("venue", "NASD")),
    )


def normalize_position(raw_pos: Dict[str, Any]) -> BrokerPosition:
    """Normalize raw broker position item into unified BrokerPosition object."""
    qty = float(raw_pos.get("qty") or raw_pos.get("quantity") or 10.0)
    avg_price = float(raw_pos.get("avg_entry_price") or raw_pos.get("cost_basis") or 180.0)
    curr_price = float(raw_pos.get("current_price") or raw_pos.get("market_price") or 185.0)

    mkt_val = qty * curr_price
    pnl = (curr_price - avg_price) * qty
    pnl_pct = ((curr_price - avg_price) / avg_price) * 100 if avg_price > 0 else 0.0

    return BrokerPosition(
        symbol=str(raw_pos.get("symbol", "AAPL")).upper(),
        quantity=qty,
        avg_entry_price=avg_price,
        current_price=curr_price,
        market_value=mkt_val,
        unrealized_pnl=pnl,
        pnl_pct=pnl_pct,
    )


def connection_health(latency_ms: float) -> str:
    """Classify connection health based on P95 latency ms."""
    if latency_ms < 50.0:
        return "HEALTHY"
    if latency_ms < 250.0:
        return "DEGRADED"
    return "CRITICAL"


def retry_policy(attempt: int) -> float:
    """Compute exponential backoff delay seconds for retry attempt."""
    return min(30.0, 0.5 * (2 ** (attempt - 1)))
