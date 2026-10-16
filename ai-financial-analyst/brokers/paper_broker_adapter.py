"""
paper_broker_adapter.py — Production-Grade Paper Trading Broker Adapter

Default implementation of BrokerAdapter. Simulates venue execution reports and fills.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from broker_models import BrokerExecutionReport, BrokerFill, BrokerHealth, BrokerOrder
from brokers.broker_adapter import BrokerAdapter

logger = logging.getLogger("paper_broker_adapter")


class PaperBrokerAdapter(BrokerAdapter):
    """Default Paper Trading Broker Adapter."""

    def __init__(self) -> None:
        super().__init__(name="PAPER_BROKER")
        self._is_connected = True
        self._reports: Dict[str, BrokerExecutionReport] = {}
        logger.info("PaperBrokerAdapter initialized.")

    def connect(self) -> bool:
        self._is_connected = True
        return True

    def disconnect(self) -> bool:
        self._is_connected = False
        return True

    def submit_order(self, order: BrokerOrder) -> BrokerExecutionReport:
        now_iso = datetime.now(timezone.utc).isoformat()
        rpt_id = f"brpt-{uuid.uuid4().hex[:8]}"

        exec_price = order.limit_price if order.limit_price > 0 else 182.50
        fill = BrokerFill(
            fill_id=f"bfill-{uuid.uuid4().hex[:8]}",
            order_id=order.order_id,
            symbol=order.symbol,
            quantity=order.quantity,
            price=exec_price,
            broker_name=self.name,
            timestamp=now_iso,
        )

        report = BrokerExecutionReport(
            report_id=rpt_id,
            order_id=order.order_id,
            broker_name=self.name,
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            filled_quantity=order.quantity,
            avg_fill_price=exec_price,
            status="FILLED",
            fills=[fill],
            timestamp=now_iso,
        )

        self._reports[order.order_id] = report
        logger.info("PaperBrokerAdapter filled order '%s' (%.2f shares @ $%.2f)", order.order_id, order.quantity, exec_price)
        return report

    def cancel_order(self, order_id: str) -> bool:
        if order_id in self._reports:
            self._reports[order_id].status = "CANCELLED"
            return True
        return False

    def order_status(self, order_id: str) -> Optional[BrokerExecutionReport]:
        return self._reports.get(order_id)

    def health(self) -> BrokerHealth:
        now_iso = datetime.now(timezone.utc).isoformat()
        return BrokerHealth(
            broker_name=self.name,
            is_connected=self._is_connected,
            latency_ms=2.5,
            success_rate=100.0,
            health_score=98.5,
            last_ping=now_iso,
        )
