"""
broker_gateway.py — Multi-Broker Gateway Subsystem

Serves as the exclusive broker routing abstraction. ExecutionManager submits requests ONLY to
BrokerGateway, which routes to registered BrokerAdapters (Paper, Alpaca, IBKR, Tradier, FIX, Binance).
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Dict, List, Optional

from broker_models import BrokerExecutionReport, BrokerHealth, BrokerOrder, BrokerStatistics
from broker_rules import broker_available, select_best_broker, validate_broker_order
from brokers.broker_adapter import BrokerAdapter
from brokers.paper_broker_adapter import PaperBrokerAdapter

# Late-bound imports to avoid circular dependency at module level
_connectivity_engine = None
_broker_adapter_engine = None


def _get_connectivity_engine():
    global _connectivity_engine
    if _connectivity_engine is None:
        try:
            from broker_connectivity_engine import global_broker_connectivity_engine
            _connectivity_engine = global_broker_connectivity_engine
        except ImportError:
            _connectivity_engine = None
    return _connectivity_engine


def _get_broker_adapter_engine():
    global _broker_adapter_engine
    if _broker_adapter_engine is None:
        try:
            from broker_adapter_engine import global_broker_adapter_engine
            _broker_adapter_engine = global_broker_adapter_engine
        except ImportError:
            _broker_adapter_engine = None
    return _broker_adapter_engine


logger = logging.getLogger("broker_gateway")


class BrokerGateway:
    """Multi-Broker Gateway Subsystem.

    Usage::

        gateway = BrokerGateway()
        gateway.register_broker(PaperBrokerAdapter())
        report = gateway.submit_order(order)
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._brokers: Dict[str, BrokerAdapter] = {}

        # Operational Statistics
        self._orders_routed = 0
        self._total_volume_processed = 0.0
        self._total_latency_ms = 0.0

        # Register default PaperBrokerAdapter
        paper_adapter = PaperBrokerAdapter()
        self.register_broker(paper_adapter)

        logger.info("BrokerGateway subsystem initialized.")

    # ─────────────────────────────────────────────
    # Broker Registry API
    # ─────────────────────────────────────────────

    def register_broker(self, adapter: BrokerAdapter) -> bool:
        """Register a new broker adapter instance."""
        if not adapter or not hasattr(adapter, "name"):
            return False

        name = adapter.name.strip().upper()
        with self._lock:
            self._brokers[name] = adapter
            adapter.connect()
            logger.info("Registered broker adapter '%s'.", name)
            return True

    def unregister_broker(self, name: str) -> bool:
        """Unregister a broker adapter."""
        name_clean = name.strip().upper()
        with self._lock:
            if name_clean in self._brokers:
                self._brokers[name_clean].disconnect()
                del self._brokers[name_clean]
                logger.info("Unregistered broker adapter '%s'.", name_clean)
                return True
            return False

    # ─────────────────────────────────────────────
    # Order Routing & Execution API
    # ─────────────────────────────────────────────

    def submit_order(self, order: BrokerOrder) -> BrokerExecutionReport:
        """Route order envelope to best active broker adapter."""
        start_t = time.monotonic()
        with self._lock:
            self._orders_routed += 1

            # Validate broker order
            valid, reason = validate_broker_order(order)
            if not valid:
                logger.warning("BrokerOrder '%s' invalid: %s", order.order_id, reason)
                return BrokerExecutionReport(
                    report_id="rpt-invalid",
                    order_id=order.order_id,
                    broker_name="NONE",
                    symbol=order.symbol,
                    side=order.side,
                    quantity=order.quantity,
                    status="REJECTED",
                )

            # Select broker adapter (requested or best health)
            target_name = order.broker_name.upper() if order.broker_name and order.broker_name.upper() in self._brokers else "PAPER_BROKER"

            # Verify connectivity via BrokerConnectivityEngine before routing
            conn_eng = _get_connectivity_engine()
            if conn_eng is not None:
                conn_status = conn_eng.status(target_name)
                if not conn_status or conn_status.status != "CONNECTED":
                    logger.warning("Broker adapter '%s' not connected. Attempting failover...", target_name)
                    failover_conn = conn_eng.failover()
                    if failover_conn:
                        target_name = failover_conn.broker_name

            adapter = self._brokers.get(target_name) or self._brokers.get("PAPER_BROKER")

            # Route through unified BrokerAdapterEngine if available
            adapter_eng = _get_broker_adapter_engine()
            if adapter_eng is not None:
                adapter_eng.submit_order({
                    "symbol": order.symbol,
                    "side": order.side,
                    "quantity": order.quantity,
                    "price": order.limit_price or 180.0,
                    "type": order.order_type,
                }, broker_name=target_name)

            if not adapter:
                logger.error("No available broker adapter found for order '%s'.", order.order_id)
                return BrokerExecutionReport(
                    report_id="rpt-nobroker",
                    order_id=order.order_id,
                    broker_name="NONE",
                    symbol=order.symbol,
                    side=order.side,
                    quantity=order.quantity,
                    status="REJECTED",
                )

        report = adapter.submit_order(order)

        lat_ms = (time.monotonic() - start_t) * 1000.0
        with self._lock:
            self._total_latency_ms += lat_ms
            self._total_volume_processed += report.filled_quantity * report.avg_fill_price

        logger.info("BrokerGateway routed order '%s' to '%s' (status=%s, latency=%.2fms)", order.order_id, adapter.name, report.status, lat_ms)
        return report

    def cancel_order(self, order_id: str, broker_name: str = "PAPER_BROKER") -> bool:
        """Cancel order at target broker."""
        b_name = broker_name.upper()
        with self._lock:
            adapter = self._brokers.get(b_name)
            if adapter:
                return adapter.cancel_order(order_id)
            return False

    def execution_status(self, order_id: str, broker_name: str = "PAPER_BROKER") -> Optional[BrokerExecutionReport]:
        """Fetch order execution status from target broker."""
        b_name = broker_name.upper()
        with self._lock:
            adapter = self._brokers.get(b_name)
            if adapter:
                return adapter.order_status(order_id)
            return None

    # ─────────────────────────────────────────────
    # Health & Statistics API
    # ─────────────────────────────────────────────

    def broker_health(self) -> Dict[str, BrokerHealth]:
        """Return real-time health metrics for all registered broker adapters."""
        with self._lock:
            return {name: b.health() for name, b in self._brokers.items()}

    def statistics(self) -> BrokerStatistics:
        """Return operational BrokerStatistics snapshot."""
        with self._lock:
            avg_lat = (self._total_latency_ms / self._orders_routed) if self._orders_routed > 0 else 0.0
            active_cnt = sum(1 for b in self._brokers.values() if b.health().is_connected)
            return BrokerStatistics(
                total_brokers_registered=len(self._brokers),
                active_brokers=active_cnt,
                orders_routed=self._orders_routed,
                total_volume_processed=self._total_volume_processed,
                average_latency_ms=avg_lat,
            )


# Shared global singleton instance
global_broker_gateway = BrokerGateway()
