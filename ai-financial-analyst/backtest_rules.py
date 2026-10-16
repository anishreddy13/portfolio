"""
backtest_rules.py — Pure Backtest Mathematical Calculation Rules

Contains pure mathematical algorithms for CAGR, Sharpe Ratio, Sortino Ratio,
Max Drawdown, Win Rate, Profit Factor, Expectancy, and Equity Curve generation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import math
import statistics
from typing import Any, Dict, List, Tuple

from backtest_models import BacktestEquityPoint, BacktestMetrics, BacktestTrade


def calculate_cagr(start_equity: float, end_equity: float, duration_years: float) -> float:
    """Calculate Compound Annual Growth Rate (CAGR) percentage."""
    if start_equity <= 0 or duration_years <= 0 or end_equity <= 0:
        return 0.0
    cagr = ((end_equity / start_equity) ** (1.0 / duration_years) - 1.0) * 100.0
    return cagr


def calculate_drawdown(equity_series: List[float]) -> Tuple[List[float], float]:
    """Calculate drawdown percentage series and maximum drawdown percentage.

    Returns:
        (drawdown_percentages_list, max_drawdown_percentage)
    """
    if not equity_series:
        return ([], 0.0)

    drawdowns: List[float] = []
    peak = equity_series[0]
    max_dd = 0.0

    for eq in equity_series:
        if eq > peak:
            peak = eq
        dd = ((peak - eq) / peak * 100.0) if peak > 0 else 0.0
        drawdowns.append(dd)
        if dd > max_dd:
            max_dd = dd

    return (drawdowns, max_dd)


def calculate_max_drawdown(equity_series: List[float]) -> float:
    """Calculate maximum peak-to-trough drawdown percentage."""
    _, max_dd = calculate_drawdown(equity_series)
    return max_dd


def calculate_sharpe_ratio(returns_series: List[float], risk_free_rate: float = 0.02) -> float:
    """Calculate annualized Sharpe Ratio."""
    if len(returns_series) < 2:
        return 0.0

    mean_ret = statistics.mean(returns_series)
    stdev_ret = statistics.stdev(returns_series)

    if stdev_ret == 0:
        return 0.0

    # Annualize assuming daily returns
    sharpe = ((mean_ret - (risk_free_rate / 252.0)) / stdev_ret) * math.sqrt(252)
    return sharpe


def calculate_sortino_ratio(returns_series: List[float], risk_free_rate: float = 0.02) -> float:
    """Calculate annualized Sortino Ratio (downside deviation penalty only)."""
    if len(returns_series) < 2:
        return 0.0

    mean_ret = statistics.mean(returns_series)
    downside_returns = [r for r in returns_series if r < 0]

    if not downside_returns or len(downside_returns) < 2:
        return 2.5  # Default high score for zero downside

    downside_stdev = statistics.stdev(downside_returns)
    if downside_stdev == 0:
        return 0.0

    sortino = ((mean_ret - (risk_free_rate / 252.0)) / downside_stdev) * math.sqrt(252)
    return sortino


def calculate_win_rate(trades: List[BacktestTrade]) -> float:
    """Calculate percentage of winning trades."""
    if not trades:
        return 0.0
    wins = sum(1 for t in trades if t.pnl > 0)
    return (wins / len(trades)) * 100.0


def calculate_profit_factor(trades: List[BacktestTrade]) -> float:
    """Calculate Profit Factor (Gross Wins / Gross Losses)."""
    if not trades:
        return 0.0

    gross_wins = sum(t.pnl for t in trades if t.pnl > 0)
    gross_losses = abs(sum(t.pnl for t in trades if t.pnl < 0))

    if gross_losses == 0:
        return 3.0 if gross_wins > 0 else 0.0

    return gross_wins / gross_losses


def calculate_expectancy(trades: List[BacktestTrade]) -> float:
    """Calculate Expected Payoff per trade ($)."""
    if not trades:
        return 0.0
    total_pnl = sum(t.pnl for t in trades)
    return total_pnl / len(trades)


def calculate_trade_statistics(trades: List[BacktestTrade]) -> Dict[str, Any]:
    """Calculate aggregate trade statistics dictionary."""
    win_rate = calculate_win_rate(trades)
    pf = calculate_profit_factor(trades)
    expectancy = calculate_expectancy(trades)
    winning_trades = sum(1 for t in trades if t.pnl > 0)
    losing_trades = sum(1 for t in trades if t.pnl < 0)

    return {
        "win_rate_pct": win_rate,
        "profit_factor": pf,
        "expectancy": expectancy,
        "total_trades": len(trades),
        "winning_trades": winning_trades,
        "losing_trades": losing_trades,
    }


def calculate_equity_curve(
    initial_cash: float,
    trades: List[BacktestTrade],
    candles: List[Any],
) -> List[BacktestEquityPoint]:
    """Build time-series BacktestEquityPoint list across historical candles."""
    curve: List[BacktestEquityPoint] = []
    current_cash = initial_cash
    current_equity = initial_cash
    peak_equity = initial_cash

    trade_map: Dict[str, List[BacktestTrade]] = {}
    for t in trades:
        t_time = getattr(t, "exit_time", "")
        if t_time not in trade_map:
            trade_map[t_time] = []
        trade_map[t_time].append(t)

    for c in candles:
        ts = getattr(c, "timestamp", str(c))

        # Apply any closed trade PnL for this timestamp
        if ts in trade_map:
            for t in trade_map[ts]:
                current_cash += t.pnl

        current_equity = current_cash
        if current_equity > peak_equity:
            peak_equity = current_equity

        dd = ((peak_equity - current_equity) / peak_equity * 100.0) if peak_equity > 0 else 0.0

        curve.append(
            BacktestEquityPoint(
                timestamp=str(ts),
                equity=current_equity,
                cash=current_cash,
                drawdown_pct=dd,
            )
        )

    return curve
