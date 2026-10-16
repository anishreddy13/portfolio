"""
paper_trader.py — Production Paper Trading Engine

Simulates strategy execution against live market quotes/ticks.
Integrates IndicatorEngine, MarketContextEngine, and PaperSession.

REUSES ExecutionEngine via PaperSession to guarantee a shared execution architecture
with zero duplication of order matching or position tracking logic.

Public API:
  PaperTradingEngine.start()
  PaperTradingEngine.stop()
  PaperTradingEngine.on_market_update()
  PaperTradingEngine.current_portfolio()
  PaperTradingEngine.trade_history()
  PaperTradingEngine.session_summary()
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional, Union

from indicator_engine import IndicatorEngine
from market_context import MarketContextEngine
from market_models import HistoricalSeries, OHLCCandle, Quote
from paper_models import PaperPortfolio, PaperTrade, SessionSummary
from paper_session import PaperSession
from strategy_models import Strategy

logger = logging.getLogger("paper_trader")


class PaperTradingEngine:
    """Core engine for live paper trading simulation.

    Usage::

        engine = PaperTradingEngine()
        session = engine.start(strategy="Buy AAPL when RSI < 30", symbol="AAPL")
        portfolio = engine.on_market_update(quote, series)
        print(portfolio.equity, portfolio.open_positions)
        summary = engine.stop()
    """

    def __init__(
        self,
        indicator_engine: Optional[IndicatorEngine] = None,
        context_engine: Optional[MarketContextEngine] = None,
    ) -> None:
        self.indicator_engine = indicator_engine or IndicatorEngine()
        self.context_engine = context_engine or MarketContextEngine(indicator_engine=self.indicator_engine)
        self.active_session: Optional[PaperSession] = None
        self.current_strategy_dict: Dict[str, Any] = {}

        logger.info("PaperTradingEngine initialized.")

    # ── Session Lifecycle API ──────────────────────────────────

    def start(
        self,
        strategy: Union[Strategy, Dict[str, Any], str],
        symbol: str,
        initial_capital: float = 100000.0,
        commission: float = 0.001,
        slippage: float = 0.0005,
    ) -> PaperSession:
        """Start a new paper trading session.

        Args:
            strategy: Strategy dataclass, dict, or JSON string.
            symbol: Target symbol (e.g. 'AAPL').
            initial_capital: Starting session cash (default 100,000.0).
            commission: Simulated commission rate (default 0.1%).
            slippage: Simulated slippage rate (default 0.05%).

        Returns:
            Active PaperSession instance.
        """

        if self.active_session and self.active_session.status == "ACTIVE":
            logger.info("Stopping previous active paper session %s", self.active_session.session_id)
            self.active_session.stop()

        self.current_strategy_dict = self._normalize_strategy(strategy)
        session = PaperSession(
            symbol=symbol,
            initial_capital=initial_capital,
            commission=commission,
            slippage=slippage,
        )
        session.start()
        self.active_session = session

        logger.info(
            "PaperTradingEngine started session %s for symbol=%s",
            session.session_id, symbol
        )
        return session

    def stop(self, session_id: Optional[str] = None) -> SessionSummary:
        """Stop active paper trading session and return performance summary."""
        if not self.active_session:
            return SessionSummary(
                session_id=session_id or "NONE",
                symbol="UNKNOWN",
                status="STOPPED",
            )

        summary = self.active_session.stop()
        logger.info("PaperTradingEngine stopped session %s", self.active_session.session_id)
        return summary

    # ── Live Market Update Handler ─────────────────────────────

    def on_market_update(
        self,
        quote: Quote,
        series: HistoricalSeries,
    ) -> PaperPortfolio:
        """Receive live market update tick, evaluate strategy, and execute.

        Workflow:
          1. Receive live market update (Quote, HistoricalSeries).
          2. Update indicators using IndicatorEngine.
          3. Update market context using MarketContextEngine.
          4. Evaluate strategy signal against current indicators / price.
          5. Execute through ExecutionEngine (via PaperSession).
          6. Update portfolio & return current PaperPortfolio.

        Args:
            quote: Point-in-time Quote object.
            series: HistoricalSeries containing recent bars.

        Returns:
            Current PaperPortfolio state.
        """
        if not self.active_session or self.active_session.status != "ACTIVE":
            logger.warning("on_market_update called without active PaperSession.")
            return PaperPortfolio()

        # Unroll enterprise consensus wrappers if passed
        if hasattr(quote, "normalized_response"):
            quote = quote.normalized_response.value
        elif hasattr(quote, "value"):
            quote = quote.value

        if hasattr(series, "normalized_response"):
            series = series.normalized_response.value
        elif hasattr(series, "value"):
            series = series.value

        symbol = quote.symbol.upper() if quote else (series.symbol.upper() if series else "UNKNOWN")

        # Step 2: Compute Indicators via IndicatorEngine
        requests = [
            {"indicator": "RSI", "parameters": {"period": 14}, "key": "RSI14"},
            {"indicator": "EMA", "parameters": {"period": 20}, "key": "EMA20"},
            {"indicator": "EMA", "parameters": {"period": 50}, "key": "EMA50"},
            {"indicator": "ATR", "parameters": {"period": 14}, "key": "ATR14"},
        ]
        ind_results = self.indicator_engine.compute_many(series, requests)

        # Step 3: Analyze Market Context via MarketContextEngine
        market_context = self.context_engine.analyze(series, quote)

        # Step 4: Evaluate Strategy Signal
        latest_candle = series.candles[-1] if series and series.candles else OHLCCandle(
            date=quote.timestamp if quote else "",
            open=quote.open if quote else 0.0,
            high=quote.day_high if quote else 0.0,
            low=quote.day_low if quote else 0.0,
            close=quote.current_price if quote else 0.0,
            volume=quote.volume if quote else 0,
        )

        signal_action, sl_price, tp_price = self._evaluate_strategy(
            strategy_dict=self.current_strategy_dict,
            ind_results=ind_results,
            quote=quote,
            latest_candle=latest_candle,
        )

        # Step 5: Execute through ExecutionEngine via PaperSession
        self.active_session.update_tick(
            quote=quote,
            candle=latest_candle,
            signal_action=signal_action,
            stop_loss_price=sl_price,
            take_profit_price=tp_price,
        )

        # Step 6: Return Current PaperPortfolio
        return self.active_session.get_portfolio()

    # ── State Inspection API ───────────────────────────────────

    def current_portfolio(self) -> PaperPortfolio:
        """Return active paper session portfolio."""
        if not self.active_session:
            return PaperPortfolio()
        return self.active_session.get_portfolio()

    def trade_history(self) -> List[PaperTrade]:
        """Return history of closed paper trades."""
        if not self.active_session:
            return []
        return self.active_session._exec_engine.closed_trades

    def session_summary(self) -> SessionSummary:
        """Return performance summary of active/last paper session."""
        if not self.active_session:
            return SessionSummary(session_id="NONE", symbol="UNKNOWN", status="STOPPED")
        return self.active_session.get_summary()

    # ── Private Strategy Evaluator ─────────────────────────────

    def _evaluate_strategy(
        self,
        strategy_dict: Dict[str, Any],
        ind_results: Dict[str, Any],
        quote: Quote,
        latest_candle: OHLCCandle,
    ) -> tuple[Optional[str], Optional[float], Optional[float]]:
        """Evaluate strategy entry/exit conditions against current bar/quote."""
        current_price = quote.current_price if quote and quote.current_price > 0 else latest_candle.close
        rsi_res = ind_results.get("RSI14")
        rsi_val = rsi_res.latest if rsi_res else None

        sl_pct = self._parse_percent(strategy_dict.get("stop_loss"))
        tp_pct = self._parse_percent(strategy_dict.get("take_profit"))

        sl_price = round(current_price * (1.0 - sl_pct / 100.0), 4) if sl_pct else None
        tp_price = round(current_price * (1.0 + tp_pct / 100.0), 4) if tp_pct else None

        entry_rules = strategy_dict.get("entry_rules", [])
        if not entry_rules:
            # Fallback simple strategy rule
            if rsi_val is not None and isinstance(rsi_val, (int, float)):
                if rsi_val < 30:
                    return "BUY", sl_price, tp_price
                elif rsi_val > 70:
                    return "SELL", sl_price, tp_price
            return None, sl_price, tp_price

        all_met = True
        for rule in entry_rules:
            details = rule.get("details", {})
            if isinstance(details, dict):
                op = details.get("operator", "<")
                target = details.get("value")
                val = rsi_val if details.get("indicator") == "RSI" else current_price

                if val is not None and isinstance(val, (int, float)) and isinstance(target, (int, float)):
                    if op in ("<", "drops_below") and not (val < target):
                        all_met = False
                    elif op in (">", "rises_above") and not (val > target):
                        all_met = False

        if all_met:
            return "BUY", sl_price, tp_price

        return None, sl_price, tp_price

    @staticmethod
    def _normalize_strategy(strategy: Any) -> Dict[str, Any]:
        if isinstance(strategy, str):
            try:
                return json.loads(strategy)
            except Exception:
                return {}
        elif isinstance(strategy, dict):
            return strategy
        elif hasattr(strategy, "to_dict"):
            return strategy.to_dict()
        return {}

    @staticmethod
    def _parse_percent(val: Any) -> float | None:
        if val is None:
            return None
        try:
            return float(str(val).replace("%", "").strip())
        except Exception:
            return None
