"""
paper_broker.py — Simulated Paper Trading Broker Adapter
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from base_broker import BaseBrokerAdapter
from broker_adapter_models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerSession
from broker_adapter_rules import normalize_order, normalize_position


class PaperBrokerAdapter(BaseBrokerAdapter):
    def __init__(self, initial_cash: float = 100000.0):
        self.broker_name = "PaperTrading"
        self._cash = initial_cash
        self._connected = True
        self._orders: List[BrokerOrder] = []

    def connect(self) -> BrokerSession:
        self._connected = True
        return BrokerSession(
            session_id=f"paper-{uuid.uuid4().hex[:6]}",
            broker_name=self.broker_name,
            status="CONNECTED",
            connected_at=datetime.now(timezone.utc).isoformat(),
            latency_ms=1.2,
        )

    def disconnect(self) -> bool:
        self._connected = False
        return True

    def get_account(self) -> BrokerAccount:
        return BrokerAccount(
            account_id="ACC-PAPER-9999",
            broker_name=self.broker_name,
            total_equity=100000.00,
            cash_balance=self._cash,
            buying_power=self._cash * 2,
            margin_used=0.0,
        )

    def get_positions(self) -> List[BrokerPosition]:
        raw = [
            {"symbol": "AAPL", "qty": 100, "avg_entry_price": 175.0, "current_price": 182.5},
            {"symbol": "NVDA", "qty": 50, "avg_entry_price": 115.0, "current_price": 124.0},
        ]
        return [normalize_position(p) for p in raw]

    def get_orders(self) -> List[BrokerOrder]:
        return self._orders

    def submit_order(self, order_dict: Dict[str, Any]) -> BrokerOrder:
        order_dict["id"] = f"pap-{uuid.uuid4().hex[:6]}"
        order_dict["status"] = "FILLED"
        order_dict["filled_qty"] = order_dict.get("qty", 10.0)
        ord_obj = normalize_order(order_dict)
        self._orders.append(ord_obj)
        return ord_obj

    def cancel_order(self, order_id: str) -> bool:
        self._orders = [o for o in self._orders if o.broker_order_id != order_id]
        return True

    def replace_order(self, order_id: str, new_params: Dict[str, Any]) -> BrokerOrder:
        new_params["id"] = order_id
        new_params["status"] = "REPLACED"
        return normalize_order(new_params)
