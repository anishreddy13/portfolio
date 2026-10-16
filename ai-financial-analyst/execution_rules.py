"""
execution_rules.py — Pure Execution Framework Rules & Routing Algorithms

Contains pure mathematical algorithms for validating execution requests, routing selection,
execution priority calculation, fill price computation, partial fills, and report merging.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
from typing import List, Optional, Tuple

from execution_models import ExecutionFill, ExecutionReport, ExecutionRequest, ExecutionRoute, ExecutionStatus

logger = logging.getLogger("execution_rules")


def validate_execution_request(req: ExecutionRequest) -> Tuple[bool, str]:
    """Validate incoming ExecutionRequest envelope parameters."""
    if not req or not req.symbol or req.quantity <= 0:
        return (False, "Invalid symbol or quantity.")

    if req.side not in ("BUY", "SELL"):
        return (False, f"Unsupported side: {req.side}")

    if req.order_type not in ("MARKET", "LIMIT", "STOP"):
        return (False, f"Unsupported order type: {req.order_type}")

    return (True, "ExecutionRequest valid.")


def select_execution_route(routes: List[ExecutionRoute]) -> ExecutionRoute:
    """Select highest priority active execution route."""
    active_routes = [r for r in routes if r.is_active]
    if not active_routes:
        return ExecutionRoute(route_id="route-default", venue_name="INTERNAL_CROSSING_ENGINE", priority=1)

    return sorted(active_routes, key=lambda r: r.priority)[0]


def calculate_execution_priority(order_type: str, quantity: float) -> int:
    """Calculate EMS routing priority score (1 = Highest)."""
    if order_type == "MARKET":
        return 1
    elif quantity > 1000:
        return 2
    return 3


def calculate_fill_price(market_price: float, side: str, slippage: float = 0.01) -> float:
    """Calculate effective execution fill price incorporating venue slippage."""
    adj = slippage if side.upper() == "BUY" else -slippage
    return max(0.01, round(market_price + adj, 2))


def calculate_partial_fill(remaining_qty: float, available_liquidity: float) -> float:
    """Calculate partial fill share quantity based on available venue liquidity."""
    return min(remaining_qty, available_liquidity)


def calculate_remaining_quantity(total_qty: float, filled_qty: float) -> float:
    """Calculate remaining unfilled share quantity."""
    return max(0.0, total_qty - filled_qty)


def calculate_execution_latency(start_t: float, end_t: float) -> float:
    """Calculate execution roundtrip latency in milliseconds."""
    return round((end_t - start_t) * 1000.0, 2)


def execution_complete(report: ExecutionReport) -> bool:
    """Check if execution has reached fully filled or completed status."""
    return report.filled_quantity >= report.quantity or report.status in (ExecutionStatus.FILLED.value, ExecutionStatus.CANCELLED.value)


def merge_execution_reports(report: ExecutionReport, fill: ExecutionFill) -> ExecutionReport:
    """Merge new ExecutionFill into existing ExecutionReport."""
    report.fills.append(fill)
    new_filled_qty = report.filled_quantity + fill.quantity

    total_val = (report.filled_quantity * report.avg_fill_price) + (fill.quantity * fill.price)
    report.filled_quantity = new_filled_qty
    report.avg_fill_price = total_val / new_filled_qty if new_filled_qty > 0 else fill.price

    if report.filled_quantity >= report.quantity:
        report.status = ExecutionStatus.FILLED.value
    else:
        report.status = ExecutionStatus.PARTIALLY_FILLED.value

    return report
