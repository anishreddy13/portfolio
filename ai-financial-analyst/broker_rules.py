"""
broker_rules.py — Pure Broker Gateway Rules & Routing Algorithms

Contains pure mathematical algorithms for validating broker orders, capability checks,
best broker selection, report normalization, and health score calculations.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from broker_models import BrokerCapabilities, BrokerExecutionReport, BrokerFill, BrokerHealth, BrokerOrder

logger = logging.getLogger("broker_rules")


def validate_broker_order(order: BrokerOrder) -> Tuple[bool, str]:
    """Validate incoming BrokerOrder parameters."""
    if not order or not order.symbol or order.quantity <= 0:
        return (False, "Invalid symbol or quantity.")

    if order.side not in ("BUY", "SELL"):
        return (False, f"Unsupported side: {order.side}")

    return (True, "BrokerOrder valid.")


def supports_order_type(caps: BrokerCapabilities, order_type: str) -> bool:
    """Check if broker capabilities support order type."""
    if not caps:
        return True
    o_type = order_type.upper()
    if o_type == "MARKET":
        return caps.supports_market_orders
    elif o_type == "LIMIT":
        return caps.supports_limit_orders
    elif o_type == "STOP":
        return caps.supports_stop_orders
    return True


def supports_asset(caps: BrokerCapabilities, asset: str) -> bool:
    """Check if broker capabilities support asset class."""
    if not caps or not caps.supported_assets:
        return True
    return asset.upper() in caps.supported_assets


def select_best_broker(brokers: List[BrokerHealth]) -> str:
    """Select active broker adapter with highest health score and lowest latency."""
    active = [b for b in brokers if b.is_connected]
    if not active:
        return "PAPER_BROKER"

    sorted_b = sorted(active, key=lambda b: (-b.health_score, b.latency_ms))
    return sorted_b[0].broker_name


def normalize_execution_report(raw_report: Dict[str, Any]) -> BrokerExecutionReport:
    """Normalize raw broker report dictionary into standardized BrokerExecutionReport."""
    return BrokerExecutionReport(
        report_id=raw_report.get("report_id", "rpt-norm"),
        order_id=raw_report.get("order_id", "ord-norm"),
        broker_name=raw_report.get("broker_name", "PAPER_BROKER"),
        symbol=raw_report.get("symbol", "AAPL"),
        side=raw_report.get("side", "BUY"),
        quantity=float(raw_report.get("quantity", 0)),
        filled_quantity=float(raw_report.get("filled_quantity", 0)),
        avg_fill_price=float(raw_report.get("avg_fill_price", 0)),
        status=raw_report.get("status", "FILLED"),
        timestamp=raw_report.get("timestamp", ""),
    )


def merge_partial_fills(report: BrokerExecutionReport, fill: BrokerFill) -> BrokerExecutionReport:
    """Merge partial fill event into BrokerExecutionReport."""
    report.fills.append(fill)
    new_qty = report.filled_quantity + fill.quantity

    total_val = (report.filled_quantity * report.avg_fill_price) + (fill.quantity * fill.price)
    report.filled_quantity = new_qty
    report.avg_fill_price = total_val / new_qty if new_qty > 0 else fill.price

    if report.filled_quantity >= report.quantity:
        report.status = "FILLED"
    else:
        report.status = "PARTIALLY_FILLED"

    return report


def broker_available(health: BrokerHealth) -> bool:
    """Check if broker adapter is online and responsive."""
    return health is not None and health.is_connected and health.health_score > 20.0


def broker_health_score(latency_ms: float, success_rate: float) -> float:
    """Calculate composite broker health score (0.0 to 100.0)."""
    lat_score = max(0.0, 100.0 - (latency_ms * 2.0))
    succ_score = max(0.0, success_rate)
    return round((lat_score * 0.4) + (succ_score * 0.6), 1)
