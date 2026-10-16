"""
interactive_brokers.py — Interactive Brokers TWS/IB Gateway Adapter
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from base_broker import BaseBrokerAdapter
from broker_adapter_models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerSession
from broker_adapter_rules import normalize_order, normalize_position


class InteractiveBrokersAdapter(BaseBrokerAdapter):
    def __init__(self, host: str = "127.0.0.1", port: int = 7497, client_id: int = 1):
        self.host = host
        self.port = port
        self.client_id = client_id
        self.broker_name = "InteractiveBrokers"
        self._connected = True

    def connect(self) -> BrokerSession:
        self._connected = True
        return BrokerSession(
            session_id=f"ib-{uuid.uuid4().hex[:6]}",
            broker_name=self.broker_name,
            status="CONNECTED",
            connected_at=datetime.now(timezone.utc).isoformat(),
            latency_ms=8.5,
        )

    def disconnect(self) -> bool:
        self._connected = False
        return True

    def get_account(self) -> BrokerAccount:
        return BrokerAccount(
            account_id="U1029384",
            broker_name=self.broker_name,
            total_equity=250000.00,
            cash_balance=75000.00,
            buying_power=500000.00,
            margin_used=12500.0,
        )

    def get_positions(self) -> List[BrokerPosition]:
        raw = [
            {"symbol": "NVDA", "qty": 100, "avg_entry_price": 120.0, "current_price": 126.0},
            {"symbol": "AMZN", "qty": 40, "avg_entry_price": 180.0, "current_price": 185.0},
        ]
        return [normalize_position(p) for p in raw]

    def get_orders(self) -> List[BrokerOrder]:
        raw = [
            {"id": "ib-ord-101", "symbol": "NVDA", "side": "BUY", "qty": 20, "type": "LIMIT", "price": 124.00, "status": "SUBMITTED"},
        ]
        return [normalize_order(o) for o in raw]

    def submit_order(self, order_dict: Dict[str, Any]) -> BrokerOrder:
        order_dict["id"] = f"ib-{uuid.uuid4().hex[:6]}"
        order_dict["status"] = "SUBMITTED"
        return normalize_order(order_dict)

    def cancel_order(self, order_id: str) -> bool:
        return True

    def replace_order(self, order_id: str, new_params: Dict[str, Any]) -> BrokerOrder:
        new_params["id"] = order_id
        new_params["status"] = "REPLACED"
        return normalize_order(new_params)
