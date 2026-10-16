"""
tradier_broker.py — Tradier REST & Streaming Broker Adapter
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from base_broker import BaseBrokerAdapter
from broker_adapter_models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerSession
from broker_adapter_rules import normalize_order, normalize_position


class TradierBrokerAdapter(BaseBrokerAdapter):
    def __init__(self, token: str = "TRADIER_TOKEN"):
        self.token = token
        self.broker_name = "Tradier"
        self._connected = True

    def connect(self) -> BrokerSession:
        self._connected = True
        return BrokerSession(
            session_id=f"tradier-{uuid.uuid4().hex[:6]}",
            broker_name=self.broker_name,
            status="CONNECTED",
            connected_at=datetime.now(timezone.utc).isoformat(),
            latency_ms=18.4,
        )

    def disconnect(self) -> bool:
        self._connected = False
        return True

    def get_account(self) -> BrokerAccount:
        return BrokerAccount(
            account_id="TR-6789012",
            broker_name=self.broker_name,
            total_equity=85000.00,
            cash_balance=20000.00,
            buying_power=110000.00,
            margin_used=0.0,
        )

    def get_positions(self) -> List[BrokerPosition]:
        raw = [
            {"symbol": "SPY", "qty": 50, "avg_entry_price": 530.0, "current_price": 542.0},
        ]
        return [normalize_position(p) for p in raw]

    def get_orders(self) -> List[BrokerOrder]:
        return []

    def submit_order(self, order_dict: Dict[str, Any]) -> BrokerOrder:
        order_dict["id"] = f"tr-{uuid.uuid4().hex[:6]}"
        order_dict["status"] = "SUBMITTED"
        return normalize_order(order_dict)

    def cancel_order(self, order_id: str) -> bool:
        return True

    def replace_order(self, order_id: str, new_params: Dict[str, Any]) -> BrokerOrder:
        new_params["id"] = order_id
        new_params["status"] = "REPLACED"
        return normalize_order(new_params)
