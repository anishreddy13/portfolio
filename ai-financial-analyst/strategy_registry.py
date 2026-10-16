"""
strategy_registry.py — Strategy Registry Subsystem

Maintains global registry of plug-in Strategy implementations. Allows engines to look up
and execute strategy instances dynamically without hardcoding strategy logic.
"""

from __future__ import annotations

import logging
import threading
from typing import Dict, List, Optional, Type

from strategy_base import Strategy
from strategy_models import StrategyStatistics

logger = logging.getLogger("strategy_registry")


class StrategyRegistry:
    """Enterprise Strategy Plugin Registry.

    Usage::

        registry = StrategyRegistry()
        registry.register(EMA_CrossoverStrategy())
        strat = registry.get("EMA_Crossover")
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._strategies: Dict[str, Strategy] = {}
        logger.info("StrategyRegistry subsystem initialized.")

    def register(self, strategy: Strategy) -> bool:
        """Register a strategy plugin instance."""
        if not strategy or not hasattr(strategy, "name"):
            return False

        name = strategy.name.strip()
        with self._lock:
            if name in self._strategies:
                logger.warning("Strategy '%s' already registered, overwriting.", name)

            self._strategies[name] = strategy
            logger.info("Registered strategy plugin '%s'.", name)
            return True

    def unregister(self, name: str) -> bool:
        """Unregister a strategy plugin."""
        name_clean = name.strip()
        with self._lock:
            if name_clean in self._strategies:
                del self._strategies[name_clean]
                logger.info("Unregistered strategy plugin '%s'.", name_clean)
                return True
            return False

    def get(self, name: str) -> Optional[Strategy]:
        """Get strategy instance by name."""
        name_clean = name.strip()
        with self._lock:
            return self._strategies.get(name_clean)

    def list_registered(self) -> List[str]:
        """List registered strategy names."""
        with self._lock:
            return list(self._strategies.keys())

    def statistics(self) -> StrategyStatistics:
        """Return operational StrategyStatistics snapshot."""
        with self._lock:
            active_cnt = sum(1 for s in self._strategies.values() if getattr(s, "is_initialized", False))
            return StrategyStatistics(
                total_strategies_registered=len(self._strategies),
                active_strategies=active_cnt,
                signals_generated=0,
            )


# Shared global singleton instance
global_strategy_registry = StrategyRegistry()
