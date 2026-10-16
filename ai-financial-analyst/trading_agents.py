"""
trading_agents.py — Trading Co-Pilot LangGraph Agent Node Orchestration

Orchestrates all completed backend engines into the LangGraph pipeline:
  1. strategy_parser_node:  StrategyParser (parse_strategy)
  2. validation_node:       StrategyValidator
  3. market_context_node:   MarketDataService, IndicatorEngine, MarketContextEngine
  4. strategy_builder_node: Strategy rule compilation
  5. backtest_node:         BacktestEngine
  6. paper_trade_node:      PaperTradingEngine
  7. live_monitor_node:     DriftDetectionEngine
  8. health_node:           StrategyHealthEngine
  9. response_node:         Unified TradingCopilotResponse formatter

Records per-node execution time, trace logs, and handles failures gracefully without crashing.
"""

from __future__ import annotations

import json
import logging
import time
from typing import Any, Dict, List, Optional

from trading_state import TradingCopilotState

from strategy_parser import parse_strategy
from strategy_validator import StrategyValidator
from request_coordinator import global_request_coordinator
from indicator_engine import IndicatorEngine
from market_context import MarketContextEngine
from backtester import BacktestEngine
from paper_trader import PaperTradingEngine
from strategy_health import StrategyHealthEngine
from drift_detector import DriftDetectionEngine
from strategy_coach import StrategyCoach

logger = logging.getLogger("trading_agents")

# Global engine singletons for orchestration efficiency
validator = StrategyValidator()
market_data_service = global_request_coordinator
indicator_engine = IndicatorEngine()
context_engine = MarketContextEngine(indicator_engine=indicator_engine)
backtest_engine = BacktestEngine(indicator_engine=indicator_engine, context_engine=context_engine)
paper_engine = PaperTradingEngine(indicator_engine=indicator_engine, context_engine=context_engine)
health_engine = StrategyHealthEngine(strategy_id="COPILOT_STRATEGY")
drift_engine = DriftDetectionEngine(strategy_id="COPILOT_STRATEGY")
strategy_coach = StrategyCoach()


def _record_trace(state: TradingCopilotState, node_name: str, duration_ms: float, status: str = "SUCCESS") -> None:
    """Helper to append execution trace entry to state."""
    raw_trace = state.get("execution_trace", "[]")
    try:
        trace_list = json.loads(raw_trace) if raw_trace else []
    except Exception:
        trace_list = []
    
    trace_list.append({
        "node": node_name,
        "duration_ms": round(duration_ms, 2),
        "status": status,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    })
    state["execution_trace"] = json.dumps(trace_list)


# ─────────────────────────────────────────────
# Node 1: Strategy Parser
# ─────────────────────────────────────────────

def strategy_parser_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()
    user_prompt = state.get("user_prompt", "")

    try:
        if user_prompt:
            strategy_obj = parse_strategy(user_prompt)
            parsed_dict = strategy_obj.to_dict()
            state["parsed_strategy"] = json.dumps(parsed_dict)
        else:
            state["parsed_strategy"] = json.dumps({"error": "Empty prompt provided."})
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in strategy_parser_node: %s", exc)
        state["parsed_strategy"] = json.dumps({"error": str(exc)})
        status = "FAILED"

    _record_trace(state, "strategy_parser", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 2: Validation
# ─────────────────────────────────────────────

def validation_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()
    parsed_strategy = state.get("parsed_strategy", "")

    try:
        if parsed_strategy:
            res = validator.validate(parsed_strategy)
            res_dict = res.to_dict()
            state["validation_result"] = json.dumps(res_dict)
            state["validation"] = json.dumps({"valid": res.valid, "score": res.score})
        else:
            state["validation_result"] = json.dumps({"valid": False, "score": 0, "errors": ["No parsed strategy available."]})
            state["validation"] = json.dumps({"valid": False, "score": 0})
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in validation_node: %s", exc)
        state["validation_result"] = json.dumps({"valid": False, "score": 0, "errors": [str(exc)]})
        state["validation"] = json.dumps({"valid": False, "score": 0})
        status = "FAILED"

    _record_trace(state, "validation", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 3: Market Context
# ─────────────────────────────────────────────

def market_context_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()

    try:
        parsed_dict = json.loads(state.get("parsed_strategy", "{}"))
        asset = parsed_dict.get("asset") or "AAPL"

        # Fetch market data via Enterprise Market Data Service V2
        quote_consensus = market_data_service.get_quote(asset)
        hist_consensus = market_data_service.get_historical(asset)

        quote = quote_consensus.normalized_response.value
        series = hist_consensus.normalized_response.value

        # Compute market context
        context = context_engine.analyze(series, quote)

        price_val = getattr(quote, "price", 0.0) if quote else 0.0
        candle_cnt = len(series.candles) if (series and hasattr(series, "candles")) else 0
        state["market_data"] = json.dumps({"symbol": asset, "quote": price_val, "candle_count": candle_cnt, "confidence": quote_consensus.confidence})
        state["market_context"] = json.dumps(context.to_dict())
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in market_context_node: %s", exc)
        state["market_context"] = json.dumps({"symbol": "UNKNOWN", "trend": "Sideways", "error": str(exc)})
        status = "FAILED"

    _record_trace(state, "market_context", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 4: Strategy Builder
# ─────────────────────────────────────────────

def strategy_builder_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()
    try:
        parsed_dict = json.loads(state.get("parsed_strategy", "{}"))
        rules = parsed_dict.get("entry_rules", [])
        state["strategy_rules"] = json.dumps({"compiled_rules_count": len(rules), "status": "COMPILED"})
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in strategy_builder_node: %s", exc)
        state["strategy_rules"] = json.dumps({"status": "FAILED", "error": str(exc)})
        status = "FAILED"

    _record_trace(state, "strategy_builder", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 5: Backtest
# ─────────────────────────────────────────────

def backtest_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()

    try:
        parsed_dict = json.loads(state.get("parsed_strategy", "{}"))
        asset = parsed_dict.get("asset") or "AAPL"
        hist_consensus = market_data_service.get_historical(asset)
        series = hist_consensus.normalized_response.value

        res = backtest_engine.run(parsed_dict, series, initial_capital=100000.0)
        res_dict = res.to_dict()

        state["backtest_result"] = json.dumps(res_dict)
        state["backtest_summary"] = json.dumps(res.metrics.to_dict())
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in backtest_node: %s", exc)
        state["backtest_result"] = json.dumps({"error": str(exc)})
        state["backtest_summary"] = json.dumps({"total_return_percent": 0.0, "error": str(exc)})
        status = "FAILED"

    _record_trace(state, "backtest", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 6: Paper Trade
# ─────────────────────────────────────────────

def paper_trade_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()

    try:
        parsed_dict = json.loads(state.get("parsed_strategy", "{}"))
        asset = parsed_dict.get("asset") or "AAPL"
        quote_consensus = market_data_service.get_quote(asset)
        hist_consensus = market_data_service.get_historical(asset)

        quote = quote_consensus.normalized_response.value
        series = hist_consensus.normalized_response.value

        session = paper_engine.start(parsed_dict, asset, initial_capital=100000.0)
        portfolio = paper_engine.on_market_update(quote, series)
        summary = paper_engine.stop()

        state["paper_result"] = json.dumps({"portfolio": portfolio.to_dict(), "summary": summary.to_dict()})
        state["paper_trade"] = json.dumps(portfolio.to_dict())
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in paper_trade_node: %s", exc)
        state["paper_result"] = json.dumps({"error": str(exc)})
        state["paper_trade"] = json.dumps({"error": str(exc)})
        status = "FAILED"

    _record_trace(state, "paper_trade", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 7: Live Monitor (Drift Detection)
# ─────────────────────────────────────────────

def live_monitor_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()

    try:
        bt_res = json.loads(state.get("backtest_result", "{}"))
        paper_res = json.loads(state.get("paper_result", "{}"))

        drift_obj = drift_engine.evaluate(
            backtest_result=bt_res,
            live_stats=paper_res.get("portfolio"),
        )
        state["drift_result"] = json.dumps(drift_obj.to_dict())
        state["live_monitor"] = json.dumps({"drift_state": drift_obj.current_state, "confidence": drift_obj.overall_confidence})
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in live_monitor_node: %s", exc)
        state["drift_result"] = json.dumps({"drift_state": "Unknown", "error": str(exc)})
        state["live_monitor"] = json.dumps({"drift_state": "Unknown"})
        status = "FAILED"

    _record_trace(state, "live_monitor", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 8: Health
# ─────────────────────────────────────────────

def health_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()

    try:
        paper_res = json.loads(state.get("paper_result", "{}"))
        bt_summary = json.loads(state.get("backtest_summary", "{}"))
        context_res = json.loads(state.get("market_context", "{}"))

        health_obj = health_engine.evaluate(
            portfolio=paper_res.get("portfolio"),
            metrics=bt_summary,
            market_context=context_res,
        )
        state["strategy_health"] = json.dumps(health_obj.to_dict())
        state["health_score"] = str(health_obj.current_score)
        state["alerts"] = json.dumps([a.to_dict() for a in health_obj.alerts])
        status = "SUCCESS"
    except Exception as exc:
        logger.exception("Error in health_node: %s", exc)
        state["strategy_health"] = json.dumps({"current_score": 50, "current_state": "Warning", "error": str(exc)})
        state["health_score"] = "50"
        state["alerts"] = "[]"
        status = "FAILED"

    _record_trace(state, "health", (time.monotonic() - start_t) * 1000.0, status)
    return state


# ─────────────────────────────────────────────
# Node 9: Response Formatter (with AI Strategy Coach)
# ─────────────────────────────────────────────

def response_node(state: TradingCopilotState) -> TradingCopilotState:
    start_t = time.monotonic()

    try:
        val_res = json.loads(state.get("validation_result", "{}"))
        parsed_res = json.loads(state.get("parsed_strategy", "{}"))
        ctx_res = json.loads(state.get("market_context", "{}"))
        bt_sum = json.loads(state.get("backtest_summary", "{}"))
        paper_res = json.loads(state.get("paper_result", "{}"))
        health_res = json.loads(state.get("strategy_health", "{}"))
        drift_res = json.loads(state.get("drift_result", "{}"))
        trace = json.loads(state.get("execution_trace", "[]"))

        pipeline_data = {
            "parsed_strategy": parsed_res,
            "validation_result": val_res,
            "market_context": ctx_res,
            "backtest_summary": bt_sum,
            "paper_summary": paper_res,
            "strategy_health": health_res,
            "drift_result": drift_res,
        }

        # Generate AI Strategy Coach analysis (or deterministic fallback if LLM unavailable)
        coach_response = strategy_coach.generate(pipeline_data)

        warnings: List[str] = val_res.get("warnings", []) + parsed_res.get("warnings", [])
        errors: List[str] = val_res.get("errors", []) + parsed_res.get("errors", [])

        # Operational steps from AI Coach response
        next_actions = coach_response.next_operational_steps or [
            "Run paper trading for additional test sessions.",
            "Review backtest equity curve and drawdown metrics.",
            "Check market regime compatibility parameters."
        ]

        unified_response = {
            "status": "ready",
            "strategy_summary": {
                "name": parsed_res.get("strategy_name", "Custom Strategy"),
                "asset": parsed_res.get("asset", "AAPL"),
                "timeframe": parsed_res.get("timeframe", "1d"),
                "indicators": parsed_res.get("indicators_used", []),
            },
            "validation": {
                "valid": val_res.get("valid", False),
                "score": val_res.get("score", 0),
                "errors": val_res.get("errors", []),
                "warnings": val_res.get("warnings", []),
            },
            "market_context": {
                "trend": ctx_res.get("trend", "Sideways"),
                "volatility": ctx_res.get("volatility", "Medium"),
                "regime": ctx_res.get("regime", "Ranging"),
                "support": ctx_res.get("support_level"),
                "resistance": ctx_res.get("resistance_level"),
            },
            "backtest_summary": {
                "total_return_percent": bt_sum.get("total_return_percent", 0.0),
                "win_rate": bt_sum.get("win_rate", 0.0),
                "max_drawdown_percent": bt_sum.get("max_drawdown_percent", 0.0),
                "sharpe_ratio": bt_sum.get("sharpe_ratio", 0.0),
                "total_trades": bt_sum.get("total_trades", 0),
            },
            "paper_trading_summary": paper_res.get("summary", {}),
            "health_score": health_res.get("current_score", 100),
            "health_state": health_res.get("current_state", "Healthy"),
            "drift_status": drift_res.get("current_state", "No Drift"),
            "coach_analysis": coach_response.to_dict(),
            "warnings": list(dict.fromkeys(warnings)),
            "errors": list(dict.fromkeys(errors)),
            "suggested_next_actions": next_actions,
            "execution_trace": trace,
        }

        state["final_response"] = json.dumps(unified_response)
        state["execution_status"] = "COMPLETED" if val_res.get("valid", True) else "FAILED_VALIDATION"
        status = "SUCCESS"

    except Exception as exc:
        logger.exception("Error in response_node: %s", exc)
        state["final_response"] = json.dumps({"status": "error", "message": f"Response compilation failed: {exc}"})
        state["execution_status"] = "ERROR"
        status = "FAILED"

    _record_trace(state, "response", (time.monotonic() - start_t) * 1000.0, status)
    return state

