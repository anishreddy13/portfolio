"""
alpaca_broker.py — Alpaca Markets REST & WebSocket Broker Adapter
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List
from base_broker import BaseBrokerAdapter
from broker_adapter_models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerSession
from broker_adapter_rules import normalize_order, normalize_position


class AlpacaBrokerAdapter(BaseBrokerAdapter):
    def __init__(self, api_key: str = "ALPACA_KEY", api_secret: str = "ALPACA_SECRET"):
        self.api_key = api_key
        self.api_secret = api_secret
        self.broker_name = "Alpaca"
        self._connected = True

    def connect(self) -> BrokerSession:
        self._connected = True
        return BrokerSession(
            session_id=f"alpaca-{uuid.uuid4().hex[:6]}",
            broker_name=self.broker_name,
            status="CONNECTED",
            connected_at=datetime.now(timezone.utc).isoformat(),
            latency_ms=14.2,
        )

    def disconnect(self) -> bool:
        self._connected = False
        return True

    def get_account(self) -> BrokerAccount:
        return BrokerAccount(
            account_id="ACC-ALPACA-1001",
            broker_name=self.broker_name,
            total_equity=125000.00,
            cash_balance=35000.00,
            buying_power=140000.00,
            margin_used=0.0,
        )

    def get_positions(self) -> List[BrokerPosition]:
        raw = [
            {"symbol": "AAPL", "qty": 50, "avg_entry_price": 180.0, "current_price": 185.0},
            {"symbol": "MSFT", "qty": 30, "avg_entry_price": 410.0, "current_price": 418.0},
        ]
        return [normalize_position(p) for p in raw]

    def get_orders(self) -> List[BrokerOrder]:
        raw = [
            {"id": "alp-ord-1", "symbol": "AAPL", "side": "BUY", "qty": 10, "type": "LIMIT", "price": 182.50, "status": "OPEN"},
        ]
        return [normalize_order(o) for o in raw]

    def submit_order(self, order_dict: Dict[str, Any]) -> BrokerOrder:
        order_dict["id"] = f"alp-{uuid.uuid4().hex[:6]}"
        order_dict["status"] = "SUBMITTED"
        return normalize_order(order_dict)

    def cancel_order(self, order_id: str) -> bool:
        return True

    def replace_order(self, order_id: str, new_params: Dict[str, Any]) -> BrokerOrder:
        new_params["id"] = order_id
        new_params["status"] = "REPLACED"
        return normalize_order(new_params)
