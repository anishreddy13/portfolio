"""
signal_engine.py — Production-Grade Enterprise Signal Engine

Sits directly between the Strategy Framework and the Order Management System (OMS).
Receives raw quantitative signals, resolves BUY/SELL conflicts, scores, ranks, and publishes
approved signals to OMS.
"""

from __future__ import annotations

import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from order_management_system import OrderManagementSystem, global_order_management_system
from signal_models import (
    SignalDecision,
    SignalDirection,
    SignalStatistics,
    SignalStrength,
    TradingSignal,
)
from signal_rules import (
    best_signal,
    combine_signals,
    rank_signals,
    resolve_conflicts,
    score_signal,
    validate_signal,
)

from portfolio_construction_engine import global_portfolio_construction_engine

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


logger = logging.getLogger("signal_engine")


class SignalEngine:
    """Production-Grade Enterprise Signal Engine.

    Usage::

        engine = SignalEngine()
        decision = engine.submit_signal(signal)
        if decision.is_approved:
            # Signal routed to PortfolioConstructionEngine
    """

    def __init__(self, oms: Optional[OrderManagementSystem] = None) -> None:
        self.oms = oms or global_order_management_system
        self._lock = threading.RLock()

        # Storage: symbol -> List[TradingSignal]
        self._active_signals: Dict[str, List[TradingSignal]] = {}
        self._history: List[TradingSignal] = []

        # Operational Statistics
        self._total_signals_received = 0
        self._conflicts_resolved = 0
        self._expired_cleared = 0
        self._approved_signals = 0

        logger.info("SignalEngine subsystem initialized.")

    # ─────────────────────────────────────────────
    # Signal Submission & Processing API
    # ─────────────────────────────────────────────

    def submit_signal(self, signal: TradingSignal) -> SignalDecision:
        """Submit a raw strategy signal for validation, scoring, and conflict resolution."""
        if not signal:
            return SignalDecision(is_approved=False, rejection_reason="Null signal envelope.")

        sym = signal.symbol.strip().upper()

        with self._lock:
            self._total_signals_received += 1
            self._history.append(signal)

            # Step 1: Validate signal parameters
            valid, reason = validate_signal(signal)
            if not valid:
                logger.warning("Signal '%s' rejected by rules: %s", signal.signal_id, reason)
                return SignalDecision(is_approved=False, rejection_reason=reason)

            # Step 2: Store in active signal list for symbol
            if sym not in self._active_signals:
                self._active_signals[sym] = []
            self._active_signals[sym].append(signal)

            # Step 3: Evaluate conflict resolution across active signals for symbol
            sym_signals = self._active_signals[sym]
            decision = resolve_conflicts(sym_signals)

            if decision.conflict_resolved:
                self._conflicts_resolved += 1

            if decision.is_approved and decision.winning_signal:
                win_sig = decision.winning_signal
                self._approved_signals += 1

                # Step 4: Route approved signal to PortfolioConstructionEngine for position sizing
                global_portfolio_construction_engine.allocate_signal(win_sig)

                logger.info("SignalEngine approved signal '%s' (%s %s) and published to PortfolioConstructionEngine.", win_sig.signal_id, win_sig.direction, win_sig.symbol)

            # Record signal submission in AuditEngine
            aud = _get_audit_engine()
            if aud is not None:
                aud.record(
                    subsystem="SIGNAL_ENGINE",
                    event_type="SIGNAL_SUBMITTED",
                    severity="INFO" if decision.is_approved else "WARNING",
                    symbol=sym,
                    strategy_name=signal.source,
                    payload={
                        "signal_id": signal.signal_id,
                        "direction": signal.direction,
                        "suggested_price": signal.suggested_price,
                        "is_approved": decision.is_approved,
                    },
                )

            return decision

    def active_signals(self) -> List[TradingSignal]:
        """Return all current active TradingSignals."""
        with self._lock:
            res: List[TradingSignal] = []
            for sigs in self._active_signals.values():
                res.extend(sigs)
            return res

    def signal_history(self) -> List[TradingSignal]:
        """Return all historical TradingSignals."""
        with self._lock:
            return list(self._history)

    def best_signal(self, symbol: str) -> Optional[TradingSignal]:
        """Return highest scoring active TradingSignal for a symbol."""
        sym = symbol.strip().upper()
        with self._lock:
            sigs = self._active_signals.get(sym, [])
            return best_signal(sigs)

    def clear_expired(self) -> int:
        """Clear expired stale TradingSignals."""
        cleared_cnt = 0
        with self._lock:
            for sym, sigs in list(self._active_signals.items()):
                active = [s for s in sigs if not s.is_expired]
                cleared_cnt += len(sigs) - len(active)
                self._active_signals[sym] = active
            self._expired_cleared += cleared_cnt
        return cleared_cnt

    # ─────────────────────────────────────────────
    # Public Statistics API
    # ─────────────────────────────────────────────

    def statistics(self) -> SignalStatistics:
        """Return operational SignalStatistics snapshot."""
        with self._lock:
            active_cnt = sum(len(sigs) for sigs in self._active_signals.values())
            return SignalStatistics(
                total_signals_received=self._total_signals_received,
                active_signals_count=active_cnt,
                conflicts_resolved=self._conflicts_resolved,
                expired_signals_cleared=self._expired_cleared,
                approved_signals_count=self._approved_signals,
            )


# Shared global singleton instance
global_signal_engine = SignalEngine()
