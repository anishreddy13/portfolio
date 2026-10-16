"""
broker_adapter.py — Abstract Base Class for Broker Adapters

Defines the universal BrokerAdapter interface implemented by Paper, Alpaca, Interactive Brokers,
Tradier, FIX, and Binance broker plugins.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Optional

from broker_models import BrokerExecutionReport, BrokerHealth, BrokerOrder


class BrokerAdapter(ABC):
    """Abstract Base Class for Broker Adapters.

    Usage::

        class CustomBrokerAdapter(BrokerAdapter):
            def connect(self) -> bool: ...
            def submit_order(self, order: BrokerOrder) -> BrokerExecutionReport: ...
    """

    def __init__(self, name: str = "BaseBroker") -> None:
        self.name = name

    @abstractmethod
    def connect(self) -> bool:
        """Establish session connection to broker API / FIX endpoint."""
        pass

    @abstractmethod
    def disconnect(self) -> bool:
        """Disconnect session from broker API."""
        pass

    @abstractmethod
    def submit_order(self, order: BrokerOrder) -> BrokerExecutionReport:
        """Submit order envelope to broker for execution."""
        pass

    @abstractmethod
    def cancel_order(self, order_id: str) -> bool:
        """Cancel pending order at broker."""
        pass

    @abstractmethod
    def order_status(self, order_id: str) -> Optional[BrokerExecutionReport]:
        """Fetch current order execution status from broker."""
        pass

    @abstractmethod
    def health(self) -> BrokerHealth:
        """Return real-time BrokerHealth metric snapshot."""
        pass
