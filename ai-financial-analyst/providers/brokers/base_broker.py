"""
base_broker.py — Abstract Base Broker Adapter Interface
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from broker_adapter_models import BrokerAccount, BrokerOrder, BrokerPosition, BrokerSession


class BaseBrokerAdapter(ABC):
    """Unified Base Broker Adapter interface for all broker connectivity providers."""

    @abstractmethod
    def connect(self) -> BrokerSession:
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        pass

    @abstractmethod
    def get_account(self) -> BrokerAccount:
        pass

    @abstractmethod
    def get_positions(self) -> List[BrokerPosition]:
        pass

    @abstractmethod
    def get_orders(self) -> List[BrokerOrder]:
        pass

    @abstractmethod
    def submit_order(self, order_dict: Dict[str, Any]) -> BrokerOrder:
        pass

    @abstractmethod
    def cancel_order(self, order_id: str) -> bool:
        pass

    @abstractmethod
    def replace_order(self, order_id: str, new_params: Dict[str, Any]) -> BrokerOrder:
        pass
