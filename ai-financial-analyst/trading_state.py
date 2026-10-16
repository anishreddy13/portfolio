"""
trading_state.py — Trading Strategy Co-Pilot State Schema

Defines the shared TypedDict that flows through the trading
co-pilot multi-agent workflow. Each node reads the fields it
needs and writes its designated output field.
"""

from __future__ import annotations

from typing import TypedDict


class TradingCopilotState(TypedDict):
    """Shared state passed between all agent nodes in the Trading Co-Pilot workflow.

    Attributes:
        user_prompt: The natural-language strategy description from the user.
        parsed_strategy: Structured representation of the parsed strategy intent.
        validation_result: Detailed validation engine output dictionary (JSON).
        validation: Validation status summary string/JSON (backward-compatible).
        market_data: Historical series and quote data snapshot (JSON).
        indicator_results: Technical indicators calculated for market data (JSON).
        market_context: Current market conditions and regime snapshot (JSON).
        strategy_rules: Compiled, executable strategy rule set.
        backtest_result: Full backtest result dictionary (JSON).
        backtest_summary: Summary of backtest performance (backward-compatible).
        paper_result: Live paper trading portfolio & session summary (JSON).
        paper_trade: Paper trade summary string (backward-compatible).
        strategy_health: Comprehensive strategy health report (JSON).
        health_score: Overall strategy health score (backward-compatible).
        drift_result: Strategy drift detection analysis (JSON).
        live_monitor: Live monitoring & drift status (backward-compatible).
        alerts: Active health and drift alerts (JSON array).
        execution_trace: Step-by-step node execution timer and trace log (JSON array).
        execution_status: Current execution pipeline status ('COMPLETED', 'FAILED_VALIDATION', etc.).
        final_response: Unified TradingCopilotResponse object (JSON).
        error: Optional error message if any stage fails gracefully.
    """

    user_prompt: str
    parsed_strategy: str
    validation_result: str
    validation: str
    market_data: str
    indicator_results: str
    market_context: str
    strategy_rules: str
    backtest_result: str
    backtest_summary: str
    paper_result: str
    paper_trade: str
    strategy_health: str
    health_score: str
    drift_result: str
    live_monitor: str
    alerts: str
    execution_trace: str
    execution_status: str
    final_response: str
    error: str
