"""
backtester.py — Production-Style Event-Driven Backtesting Engine

Executes parsed trading strategies over historical market candles without lookahead
bias or repainting. Uses IndicatorEngine, MarketContextEngine, and ExecutionEngine.

Exposes public API:
  BacktestEngine.run(strategy, historical_series, initial_capital=100000.0)
"""

from __future__ import annotations

import json
import logging
import math
from typing import Any, Dict, List, Optional, Union

from backtest_models import (
    BacktestResult,
    EquityCurvePoint,
    PerformanceMetrics,
    Trade,
)
from execution_engine import ExecutionEngine
from indicator_engine import IndicatorEngine
from market_context import MarketContextEngine
from market_models import HistoricalSeries, OHLCCandle
from strategy_models import Strategy

logger = logging.getLogger("backtester")


class BacktestEngine:
    """Event-driven backtesting engine for historical strategy execution.

    Usage::

        engine = BacktestEngine()
        result = engine.run(strategy, series, initial_capital=100000.0)
        print(result.metrics.total_return_percent, result.metrics.sharpe_ratio)
    """

    def __init__(
        self,
        indicator_engine: Optional[IndicatorEngine] = None,
        context_engine: Optional[MarketContextEngine] = None,
    ) -> None:
        self.indicator_engine = indicator_engine or IndicatorEngine()
        self.context_engine = context_engine or MarketContextEngine(indicator_engine=self.indicator_engine)
        logger.info("BacktestEngine initialized.")

    def run(
        self,
        strategy: Union[Strategy, Dict[str, Any], str],
        historical_series: HistoricalSeries,
        initial_capital: float = 100000.0,
        commission: float = 0.001,
        slippage: float = 0.0005,
    ) -> BacktestResult:
        """Run event-driven backtest over historical series.

        Args:
            strategy: Parsed Strategy dataclass instance, dict, or JSON string.
            historical_series: HistoricalSeries containing OHLCV candles.
            initial_capital: Starting account cash balance (default 100,000.0).
            commission: Commission rate per transaction (default 0.1%).
            slippage: Estimated price slippage rate (default 0.05%).

        Returns:
            BacktestResult object containing equity curve, trade history, and metrics.
        """
        # Step 1: Normalize Strategy
        strat_dict = self._normalize_strategy_input(strategy)
        strategy_name = strat_dict.get("strategy_name", "Backtested Strategy")
        symbol = historical_series.symbol.upper() if historical_series else "UNKNOWN"

        # Unroll enterprise consensus wrappers if passed
        if hasattr(historical_series, "normalized_response"):
            historical_series = historical_series.normalized_response.value
        elif hasattr(historical_series, "value"):
            historical_series = historical_series.value

        if not historical_series or not hasattr(historical_series, "candles") or not historical_series.candles:
            logger.error("BacktestEngine run failed: Series is empty.")
            return self._empty_result(symbol, strategy_name, initial_capital)

        candles = historical_series.candles
        min_required_candles = 20  # Warmup buffer for indicators

        if len(candles) < min_required_candles:
            logger.warning("HistoricalSeries has too few candles (%d) for backtesting.", len(candles))
            return self._empty_result(symbol, strategy_name, initial_capital)

        logger.info(
            "Starting event-driven backtest for symbol=%s, strategy='%s' (%d candles)",
            symbol, strategy_name, len(candles)
        )

        # Step 2: Initialize Execution Engine
        exec_engine = ExecutionEngine(
            initial_capital=initial_capital,
            commission=commission,
            slippage=slippage,
        )

        # Pre-compute indicator series over full data (no lookahead — sliced at runtime i)
        indicator_requests = self._extract_indicator_requests(strat_dict)
        full_indicators = self.indicator_engine.compute_many(historical_series, indicator_requests)

        # Parse risk rules
        stop_loss_pct = self._parse_percent(strat_dict.get("stop_loss"))
        take_profit_pct = self._parse_percent(strat_dict.get("take_profit"))

        # Step 3: Bar-by-bar Event Loop (No Lookahead Bias)
        for i in range(min_required_candles, len(candles)):
            current_candle = candles[i]
            close_price = current_candle.close

            # Calculate SL/TP target prices if position is to be opened
            sl_price = round(close_price * (1.0 - stop_loss_pct / 100.0), 4) if stop_loss_pct else None
            tp_price = round(close_price * (1.0 + take_profit_pct / 100.0), 4) if take_profit_pct else None

            # Get current bar indicator values
            current_ind_values = self._get_bar_indicators(full_indicators, i)

            # Evaluate strategy rules on current bar values
            signal = self._evaluate_strategy_signal(strat_dict, current_ind_values, close_price)

            # Execute event step in ExecutionEngine
            exec_engine.on_candle(
                candle=current_candle,
                signal_action=signal,
                stop_loss_price=sl_price,
                take_profit_price=tp_price,
            )

        # Close any open position at end of data
        if exec_engine.position is not None:
            last_candle = candles[-1]
            exec_engine._close_position(last_candle.close, last_candle.date, exit_reason="END_OF_DATA")

        # Step 4: Calculate Performance Metrics
        metrics = self._calculate_performance_metrics(
            initial_capital=initial_capital,
            ending_capital=exec_engine.current_equity,
            trades=exec_engine.closed_trades,
            equity_curve=exec_engine.equity_curve,
        )

        logger.info(
            "Backtest complete for %s. Total Return: %.2f%%, Trades: %d, Win Rate: %.2f%%, Max DD: %.2f%%",
            symbol, metrics.total_return_percent, metrics.total_trades, metrics.win_rate, metrics.max_drawdown_percent
        )

        return BacktestResult(
            symbol=symbol,
            strategy_name=strategy_name,
            initial_capital=initial_capital,
            ending_capital=exec_engine.current_equity,
            equity_curve=exec_engine.equity_curve,
            trades=exec_engine.closed_trades,
            metrics=metrics,
        )

    # ── Strategy Evaluation Logic ──────────────────────────────

    def _evaluate_strategy_signal(
        self,
        strategy_dict: Dict[str, Any],
        bar_indicators: Dict[str, Any],
        close_price: float,
    ) -> Optional[str]:
        """Evaluate entry and exit rules for current bar indicators without lookahead."""
        entry_rules = strategy_dict.get("entry_rules", [])

        if not entry_rules:
            # Fallback simple strategy if no specific entry rules parsed: EMA crossover or RSI < 30
            rsi = bar_indicators.get("RSI14")
            if rsi is not None and isinstance(rsi, (int, float)):
                if rsi < 30:
                    return "BUY"
                elif rsi > 70:
                    return "SELL"
            return None

        # Check entry rules
        all_entry_met = True
        for rule in entry_rules:
            details = rule.get("details", {})
            if isinstance(details, dict):
                ind = str(details.get("indicator", "")).upper()
                op = details.get("operator", "<")
                target = details.get("value")

                val = bar_indicators.get(ind) or bar_indicators.get(f"{ind}14") or close_price
                if val is not None and isinstance(val, (int, float)) and isinstance(target, (int, float)):
                    if op in ("<", "drops_below") and not (val < target):
                        all_entry_met = False
                    elif op in (">", "rises_above") and not (val > target):
                        all_entry_met = False

        if all_entry_met:
            return "BUY"

        return None

    # ── Indicator & Request Helpers ────────────────────────────

    def _extract_indicator_requests(self, strategy_dict: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Collect list of indicator calculation requests required by strategy."""
        requests = [
            {"indicator": "RSI", "parameters": {"period": 14}, "key": "RSI14"},
            {"indicator": "EMA", "parameters": {"period": 20}, "key": "EMA20"},
            {"indicator": "EMA", "parameters": {"period": 50}, "key": "EMA50"},
            {"indicator": "ATR", "parameters": {"period": 14}, "key": "ATR14"},
        ]
        return requests

    def _get_bar_indicators(self, full_indicators: Dict[str, Any], bar_idx: int) -> Dict[str, Any]:
        """Extract slice of computed indicator values at bar_idx."""
        bar_vals: Dict[str, Any] = {}
        for key, res in full_indicators.items():
            if res and hasattr(res, "values") and isinstance(res.values, list):
                if bar_idx < len(res.values):
                    bar_vals[key] = res.values[bar_idx]
        return bar_vals

    # ── Performance Metrics Calculation ────────────────────────

    def _calculate_performance_metrics(
        self,
        initial_capital: float,
        ending_capital: float,
        trades: List[Trade],
        equity_curve: List[EquityCurvePoint],
    ) -> PerformanceMetrics:
        total_return_pct = ((ending_capital - initial_capital) / initial_capital) * 100.0
        total_trades = len(trades)

        if total_trades == 0:
            return PerformanceMetrics(
                initial_capital=initial_capital,
                ending_capital=ending_capital,
                total_return_percent=total_return_pct,
            )

        winning_trades = [t for t in trades if t.pnl > 0]
        losing_trades = [t for t in trades if t.pnl <= 0]

        win_count = len(winning_trades)
        loss_count = len(losing_trades)
        win_rate = (win_count / total_trades) * 100.0
        loss_rate = (loss_count / total_trades) * 100.0

        avg_win = (sum(t.pnl for t in winning_trades) / win_count) if win_count > 0 else 0.0
        avg_loss = (abs(sum(t.pnl for t in losing_trades)) / loss_count) if loss_count > 0 else 0.0

        gross_profit = sum(t.pnl for t in winning_trades)
        gross_loss = abs(sum(t.pnl for t in losing_trades))
        profit_factor = (gross_profit / gross_loss) if gross_loss > 0 else (gross_profit if gross_profit > 0 else 0.0)

        max_dd = max((p.drawdown_percent for p in equity_curve), default=0.0)

        # Sharpe & Sortino Calculations from daily returns
        daily_returns: List[float] = []
        for j in range(1, len(equity_curve)):
            prev_e = equity_curve[j - 1].equity
            curr_e = equity_curve[j].equity
            if prev_e > 0:
                daily_returns.append((curr_e - prev_e) / prev_e)

        sharpe_ratio = self._calculate_sharpe(daily_returns)
        sortino_ratio = self._calculate_sortino(daily_returns)
        calmar_ratio = (total_return_pct / max_dd) if max_dd > 0 else 0.0

        # Expectancy = (Win Rate * Avg Win) - (Loss Rate * Avg Loss)
        expectancy = ((win_rate / 100.0) * avg_win) - ((loss_rate / 100.0) * avg_loss)

        return PerformanceMetrics(
            initial_capital=initial_capital,
            ending_capital=ending_capital,
            total_return_percent=total_return_pct,
            win_rate=win_rate,
            loss_rate=loss_rate,
            total_trades=total_trades,
            winning_trades=win_count,
            losing_trades=loss_count,
            average_win=avg_win,
            average_loss=avg_loss,
            profit_factor=profit_factor,
            max_drawdown_percent=max_dd,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            expectancy=expectancy,
        )

    @staticmethod
    def _calculate_sharpe(returns: List[float], annualization_factor: float = 252.0) -> float:
        if not returns or len(returns) < 2:
            return 0.0
        mean = sum(returns) / len(returns)
        variance = sum((r - mean) ** 2 for r in returns) / (len(returns) - 1)
        std_dev = math.sqrt(variance)
        if std_dev == 0:
            return 0.0
        return (mean / std_dev) * math.sqrt(annualization_factor)

    @staticmethod
    def _calculate_sortino(returns: List[float], annualization_factor: float = 252.0) -> float:
        if not returns or len(returns) < 2:
            return 0.0
        mean = sum(returns) / len(returns)
        downside = [r for r in returns if r < 0]
        if not downside:
            return 0.0
        downside_variance = sum(r ** 2 for r in downside) / len(downside)
        downside_std = math.sqrt(downside_variance)
        if downside_std == 0:
            return 0.0
        return (mean / downside_std) * math.sqrt(annualization_factor)

    @staticmethod
    def _normalize_strategy_input(strategy_input: Any) -> Dict[str, Any]:
        if isinstance(strategy_input, str):
            try:
                return json.loads(strategy_input)
            except Exception:
                return {}
        elif isinstance(strategy_input, dict):
            return strategy_input
        elif hasattr(strategy_input, "to_dict"):
            return strategy_input.to_dict()
        return {}

    @staticmethod
    def _parse_percent(val: Any) -> float | None:
        if val is None:
            return None
        try:
            return float(str(val).replace("%", "").strip())
        except Exception:
            return None

    @staticmethod
    def _empty_result(symbol: str, strategy_name: str, initial_capital: float) -> BacktestResult:
        return BacktestResult(
            symbol=symbol,
            strategy_name=strategy_name,
            initial_capital=initial_capital,
            ending_capital=initial_capital,
            equity_curve=[EquityCurvePoint(timestamp="", equity=initial_capital, cash=initial_capital, drawdown_percent=0.0)],
            trades=[],
            metrics=PerformanceMetrics(initial_capital=initial_capital, ending_capital=initial_capital),
        )
