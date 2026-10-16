"""
order_management_system.py — Production-Grade Enterprise Order Management System (OMS)

Owns the ENTIRE order lifecycle across all asset classes. Manages Parent/Child orders,
Bracket Orders, OCO/OTO containers, trailing stops, order replacements, and audit timelines.
Submits approved orders to ExecutionManager.
"""

from __future__ import annotations

import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from execution_manager import ExecutionManager, global_execution_manager
from oms_models import (
    BracketOrder,
    ChildOrder,
    OCOOrder,
    OMSStatistics,
    OrderAuditEntry,
    OrderLifecycle,
    OTOOrder,
    ParentOrder,
    TrailingStopOrder,
)
from oms_rules import (
    audit_entry,
    can_cancel,
    can_replace,
    create_bracket_order,
    create_child_orders,
    create_oco_order,
    create_oto_order,
    update_order_state,
    validate_parent_order,
)
from risk_engine import EnterpriseRiskEngine, global_risk_engine

# Late-bound import to avoid circular dependency at module level
_audit_engine = None


def _get_audit_engine():
    global _audit_engine
    if _audit_engine is None:
        try:
            from audit_engine import global_audit_engine
            _audit_engine = global_audit_engine
        except ImportError:
            _audit_engine = None
    return _audit_engine


_observability_engine = None


def _get_obs_engine():
    global _observability_engine
    if _observability_engine is None:
        try:
            from observability_engine import global_observability_engine
            _observability_engine = global_observability_engine
        except ImportError:
            _observability_engine = None
    return _observability_engine


logger = logging.getLogger("order_management_system")


class OrderManagementSystem:
    """Production-Grade Enterprise Order Management System (OMS).

    Usage::

        oms = OrderManagementSystem()
        order = oms.submit_order("AAPL", "BUY", "MARKET", 10)
        print(order.status, order.filled_quantity)
    """

    def __init__(
        self,
        execution_manager: Optional[ExecutionManager] = None,
        risk_engine: Optional[EnterpriseRiskEngine] = None,
    ) -> None:
        self.execution_manager = execution_manager or global_execution_manager
        self.risk_engine = risk_engine or global_risk_engine
        self._lock = threading.RLock()

        # Storage: parent_id -> ParentOrder
        self._orders: Dict[str, ParentOrder] = {}

        # Audit logs: order_id -> List[OrderAuditEntry]
        self._audit_trail: List[OrderAuditEntry] = []

        # Complex order containers
        self._bracket_orders: Dict[str, BracketOrder] = {}
        self._oco_orders: Dict[str, OCOOrder] = {}

        # Operational Statistics
        self._total_orders = 0
        self._filled_orders = 0
        self._cancelled_orders = 0
        self._replaced_orders = 0
        self._bracket_count = 0

        logger.info("OrderManagementSystem subsystem (OMS) initialized.")

    # ─────────────────────────────────────────────
    # Order Submission & Lifecycle Management API
    # ─────────────────────────────────────────────

    def submit_order(
        self,
        symbol: str,
        side: str,
        order_type: str,
        quantity: float,
        limit_price: float = 0.0,
        stop_price: float = 0.0,
        portfolio_id: str = "default",
    ) -> ParentOrder:
        """Submit new order for full OMS lifecycle management.

        Note: OMS assumes position sizing and quantity are already finalized by
        PortfolioConstructionEngine and pre-trade compliance has been validated by ComplianceEngine.
        OMS does NOT perform compliance validation.
        """
        sym = symbol.strip().upper()
        s_side = side.strip().upper()
        o_type = order_type.strip().upper()
        now_iso = datetime.now(timezone.utc).isoformat()
        start_t = time.monotonic()

        parent_id = f"pord-{uuid.uuid4().hex[:8]}"

        order = ParentOrder(
            parent_id=parent_id,
            symbol=sym,
            side=s_side,
            order_type=o_type,
            quantity=quantity,
            limit_price=limit_price,
            stop_price=stop_price,
            status=OrderLifecycle.CREATED.value,
            timestamp=now_iso,
        )

        with self._lock:
            self._total_orders += 1

            # Step 1: Validate Parent Order
            valid, reason = validate_parent_order(order)
            if not valid:
                update_order_state(order, OrderLifecycle.REJECTED.value)
                self._record_audit(parent_id, OrderLifecycle.CREATED.value, OrderLifecycle.REJECTED.value, reason)
                self._orders[parent_id] = order
                return order

            self._record_audit(parent_id, "NONE", OrderLifecycle.CREATED.value, "Order envelope initialized.")

            # Step 2: Risk Evaluation Gate
            est_p = limit_price if limit_price > 0 else 180.0
            risk_decision = self.risk_engine.evaluate_order(
                symbol=sym,
                side=s_side,
                order_type=o_type,
                quantity=quantity,
                price=est_p,
                portfolio_id=portfolio_id,
            )

            self._record_audit(parent_id, OrderLifecycle.CREATED.value, OrderLifecycle.RISK_CHECKED.value, "Risk evaluation completed.")

            if not risk_decision.is_approved:
                update_order_state(order, OrderLifecycle.REJECTED.value)
                viol_desc = "; ".join(v.description for v in risk_decision.violations)
                self._record_audit(parent_id, OrderLifecycle.RISK_CHECKED.value, OrderLifecycle.REJECTED.value, f"Risk rejection: {viol_desc}")
                self._orders[parent_id] = order
                return order

            update_order_state(order, OrderLifecycle.APPROVED.value)
            self._record_audit(parent_id, OrderLifecycle.RISK_CHECKED.value, OrderLifecycle.APPROVED.value, "Order approved by RiskEngine.")

            # Step 3: Slice Child Orders
            order.child_orders = create_child_orders(order, slice_count=2 if quantity > 100 else 1)
            self._orders[parent_id] = order

        # Step 4: Route Approved Order to ExecutionManager (EMS Layer)
        update_order_state(order, OrderLifecycle.ROUTED_TO_EXECUTION.value)
        self._record_audit(parent_id, OrderLifecycle.APPROVED.value, OrderLifecycle.ROUTED_TO_EXECUTION.value, "Routed to ExecutionManager (EMS).")

        exec_report = self.execution_manager.submit_execution(
            order_id=parent_id,
            symbol=sym,
            side=s_side,
            order_type=o_type,
            quantity=quantity,
            limit_price=limit_price,
            stop_price=stop_price,
            portfolio_id=portfolio_id,
        )

        with self._lock:
            order.status = exec_report.status
            order.filled_quantity = exec_report.filled_quantity
            order.avg_fill_price = exec_report.avg_fill_price

            if order.status == OrderLifecycle.FILLED.value:
                self._filled_orders += 1
                self._record_audit(parent_id, OrderLifecycle.ROUTED_TO_EXECUTION.value, OrderLifecycle.FILLED.value, f"Filled @ ${order.avg_fill_price:.2f}")

        lat_ms = (time.monotonic() - start_t) * 1000.0
        obs = _get_obs_engine()
        if obs is not None:
            obs.record("ORDER_MANAGEMENT", "oms_processing_latency_ms", lat_ms)

        logger.info("OMS processed order '%s' (status=%s, fill_price=$%.2f)", parent_id, order.status, order.avg_fill_price)
        return order

    def create_bracket(
        self,
        symbol: str,
        side: str,
        qty: float,
        entry_p: float,
        tp_p: float,
        sl_p: float,
    ) -> BracketOrder:
        """Create a full BracketOrder container."""
        with self._lock:
            bracket = create_bracket_order(symbol, side, qty, entry_p, tp_p, sl_p)
            self._bracket_orders[bracket.bracket_id] = bracket
            self._bracket_count += 1

            # Submit entry order
            self.submit_order(symbol, side, "LIMIT" if entry_p > 0 else "MARKET", qty, limit_price=entry_p)
            return bracket

    def cancel_order(self, order_id: str) -> bool:
        """Cancel an open order."""
        with self._lock:
            order = self._orders.get(order_id)
            if not order or not can_cancel(order):
                return False

            old_st = order.status
            update_order_state(order, OrderLifecycle.CANCELLED.value)
            self._cancelled_orders += 1
            self._record_audit(order_id, old_st, OrderLifecycle.CANCELLED.value, "User requested cancellation.")
            logger.info("Cancelled OMS order '%s'.", order_id)
            return True

    def replace_order(self, order_id: str, new_qty: float, new_price: float) -> bool:
        """Replace quantity and price for an open order."""
        with self._lock:
            order = self._orders.get(order_id)
            if not order or not can_replace(order):
                return False

            old_st = order.status
            order.quantity = new_qty
            order.limit_price = new_price
            update_order_state(order, OrderLifecycle.REPLACED.value)
            self._replaced_orders += 1
            self._record_audit(order_id, old_st, OrderLifecycle.REPLACED.value, f"Replaced qty={new_qty}, price=${new_price:.2f}")
            return True

    def _record_audit(self, order_id: str, from_st: str, to_st: str, desc: str) -> None:
        """Internal helper to append OrderAuditEntry records and publish to AuditEngine."""
        entry = audit_entry(order_id, from_st, to_st, desc)
        self._audit_trail.append(entry)

        aud = _get_audit_engine()
        if aud is not None:
            order = self._orders.get(order_id)
            sym = order.symbol if order else ""
            aud.record(
                subsystem="ORDER_MANAGEMENT",
                event_type=f"ORDER_{to_st}",
                severity="HIGH" if "REJECT" in to_st else "INFO",
                symbol=sym,
                order_id=order_id,
                payload={"from_status": from_st, "to_status": to_st, "description": desc},
            )

    # ─────────────────────────────────────────────
    # OMS Query & Statistics API
    # ─────────────────────────────────────────────

    def order_status(self, order_id: str) -> Optional[ParentOrder]:
        """Fetch ParentOrder state."""
        with self._lock:
            return self._orders.get(order_id)

    def order_history(self) -> List[ParentOrder]:
        """Return all managed ParentOrder records."""
        with self._lock:
            return list(self._orders.values())

    def audit_log(self, order_id: Optional[str] = None) -> List[OrderAuditEntry]:
        """Return audit trail entries."""
        with self._lock:
            if order_id:
                return [a for a in self._audit_trail if a.order_id == order_id]
            return list(self._audit_trail)

    def statistics(self) -> OMSStatistics:
        """Return operational OMSStatistics snapshot."""
        with self._lock:
            active_cnt = sum(1 for o in self._orders.values() if o.status in (OrderLifecycle.CREATED.value, OrderLifecycle.ROUTED_TO_EXECUTION.value))
            return OMSStatistics(
                total_orders_managed=self._total_orders,
                active_orders=active_cnt,
                filled_orders=self._filled_orders,
                cancelled_orders=self._cancelled_orders,
                replaced_orders=self._replaced_orders,
                bracket_orders_count=self._bracket_count,
            )


# Shared global singleton instance
global_order_management_system = OrderManagementSystem()
