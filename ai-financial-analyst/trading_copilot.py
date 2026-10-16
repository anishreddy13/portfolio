"""
trading_copilot.py — Trading Strategy Co-Pilot LangGraph Pipeline

A standalone LangGraph pipeline for the AI Trading Strategy Co-Pilot.
Completely separate from the Financial Analyst graph (graph.py) and
the Portfolio Rebalancer (rebalancer.py).

Pipeline:
  START → strategy_parser → validation ──(router)──> market_context →
  strategy_builder → backtest → paper_trade → live_monitor →
  health → response → END

  (If validation fails critically, router short-circuits directly to response).
"""

from __future__ import annotations

import json
import logging

from langgraph.graph import END, START, StateGraph

from trading_state import TradingCopilotState
from trading_agents import (
    strategy_parser_node,
    validation_node,
    market_context_node,
    strategy_builder_node,
    backtest_node,
    paper_trade_node,
    live_monitor_node,
    health_node,
    response_node,
)

logger = logging.getLogger("trading_copilot")


# ─────────────────────────────────────────────
# Conditional Router Function
# ─────────────────────────────────────────────

def route_after_validation(state: TradingCopilotState) -> str:
    """Conditional router function following strategy validation.

    If strategy validation fails with critical errors, short-circuit
    directly to the response node. Otherwise, proceed to market_context.
    """
    raw_val = state.get("validation_result", "{}")
    try:
        val_dict = json.loads(raw_val)
        if not val_dict.get("valid", True) and val_dict.get("errors"):
            logger.info("Validation failed with critical errors. Short-circuiting to response node.")
            return "response"
    except Exception:
        pass

    return "market_context"


# ─────────────────────────────────────────────
# Graph Compilation
# ─────────────────────────────────────────────

def build_trading_copilot_graph() -> StateGraph:
    """Build and compile the Trading Co-Pilot multi-agent workflow graph."""
    workflow = StateGraph(TradingCopilotState)

    # Add agent nodes
    workflow.add_node("strategy_parser", strategy_parser_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("market_context", market_context_node)
    workflow.add_node("strategy_builder", strategy_builder_node)
    workflow.add_node("backtest", backtest_node)
    workflow.add_node("paper_trade", paper_trade_node)
    workflow.add_node("live_monitor", live_monitor_node)
    workflow.add_node("health", health_node)
    workflow.add_node("response", response_node)

    # Define edges & conditional routing
    workflow.add_edge(START, "strategy_parser")
    workflow.add_edge("strategy_parser", "validation")

    # Conditional edge after validation
    workflow.add_conditional_edges(
        "validation",
        route_after_validation,
        {
            "market_context": "market_context",
            "response": "response",
        }
    )

    workflow.add_edge("market_context", "strategy_builder")
    workflow.add_edge("strategy_builder", "backtest")
    workflow.add_edge("backtest", "paper_trade")
    workflow.add_edge("paper_trade", "live_monitor")
    workflow.add_edge("live_monitor", "health")
    workflow.add_edge("health", "response")
    workflow.add_edge("response", END)

    return workflow.compile()


# Singleton instance for import by app.py
trading_copilot_graph = build_trading_copilot_graph()


# ─────────────────────────────────────────────
# Invoke Helper
# ─────────────────────────────────────────────

def invoke_trading_copilot(user_prompt: str) -> str:
    """Run the full Trading Co-Pilot pipeline end-to-end.

    Args:
        user_prompt: Natural-language trading strategy description.

    Returns:
        JSON string containing the final unified TradingCopilotResponse object.
    """
    initial_state: TradingCopilotState = {
        "user_prompt": user_prompt,
        "parsed_strategy": "",
        "validation_result": "",
        "validation": "",
        "market_data": "",
        "indicator_results": "",
        "market_context": "",
        "strategy_rules": "",
        "backtest_result": "",
        "backtest_summary": "",
        "paper_result": "",
        "paper_trade": "",
        "strategy_health": "",
        "health_score": "",
        "drift_result": "",
        "live_monitor": "",
        "alerts": "",
        "execution_trace": "[]",
        "execution_status": "PENDING",
        "final_response": "",
        "error": "",
    }

    try:
        final_state = trading_copilot_graph.invoke(initial_state)
        resp = final_state.get("final_response")
        if resp:
            return resp
        return json.dumps({
            "status": "ready",
            "message": "Trading CoPilot backend initialized.",
            "execution_status": final_state.get("execution_status", "UNKNOWN"),
        })
    except Exception as e:
        logger.exception("Trading CoPilot pipeline error: %s", e)
        return json.dumps({
            "status": "error",
            "message": f"Trading CoPilot pipeline failed: {e}",
        })
