"""
rebalancer.py â€” Multi-Agent Portfolio Rebalancer Pipeline

A standalone LangGraph pipeline that analyzes a user's entire portfolio
allocation. It evaluates sector concentration, correlation risks, and
aggregate beta, producing a strategic markdown reallocation summary.
"""

import json
from typing import TypedDict
import yfinance as yf

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, START, StateGraph


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 1. State Schema
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

class RebalancerState(TypedDict):
    """Shared state for the Portfolio Rebalancer pipeline."""
    payload: str            # Raw JSON string of ticker weights {"AAPL": 0.5, "MSFT": 0.5}
    allocation_data: str    # Analyzed sector/geographic exposure from yfinance
    optimization_plan: str  # Final markdown strategy from the LLM agent
    error: str


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 2. LLM Client
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _get_llm(model_name="openai/gpt-oss-120b"):
    return ChatGroq(
        temperature=0.2,
        model_name=model_name,
        max_tokens=2048,
    )


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 3. Nodes
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def analyzer_node(state: RebalancerState) -> RebalancerState:
    """Uses yfinance to determine sector exposure and aggregate metrics."""
    print("[REBALANCER] Starting allocation_analyzer")
    payload = state["payload"]

    try:
        data = json.loads(payload)
        if isinstance(data, dict):
            tickers = list(data.keys())
            weights = data
        else:
            return {**state, "error": "Invalid payload format. Expected dict."}

        sectors = {}
        total_beta = 0.0
        valid_beta_weight = 0.0

        for t in tickers:
            try:
                stock = yf.Ticker(t)
                info = stock.info
                
                sector = info.get("sector", "Unknown")
                w = weights.get(t, 0)
                sectors[sector] = sectors.get(sector, 0) + w

                beta = info.get("beta")
                if beta and isinstance(beta, (int, float)):
                    total_beta += beta * w
                    valid_beta_weight += w

            except Exception as e:
                print(f"[REBALANCER] Error fetching {t}: {e}")

        agg_beta = round(total_beta / valid_beta_weight, 2) if valid_beta_weight > 0 else "Unknown"

        analysis = {
            "tickers": tickers,
            "weights": weights,
            "sector_exposure": sectors,
            "portfolio_beta": agg_beta
        }

        return {
            **state,
            "allocation_data": json.dumps(analysis, indent=2)
        }

    except Exception as e:
        print(f"[REBALANCER] analyzer_node error: {e}")
        return {**state, "error": str(e)}


OPTIMIZER_SYSTEM_PROMPT = """You are a Senior Quantitative Portfolio Manager.
Your job is to evaluate a user's portfolio allocation, identify concentration risks, 
and provide a strategic reallocation plan.

You will receive JSON data containing:
1. The user's current tickers and weights.
2. The calculated sector exposure percentages.
3. The aggregate portfolio Beta (volatility relative to the market).

Write a concise Markdown report structured exactly as follows:

### Portfolio Risk Assessment
Evaluate the current sector concentration and beta. Is it too tech-heavy? Too volatile?

### Correlation Warnings
Identify any pairs of stocks that are highly correlated (e.g., AAPL and MSFT) and pose a systemic risk.

### Strategic Reallocation Plan
Provide actionable advice on which sectors or asset classes to reduce, and which to increase to achieve a balanced, all-weather portfolio. Use bullet points.

Rules:
- Be direct and data-driven.
- Do NOT hallucinate data. Only use the provided metrics.
- Keep the tone professional, like a BlackRock portfolio manager."""


def optimizer_node(state: RebalancerState) -> RebalancerState:
    """LLM Agent that evaluates the portfolio and writes the optimization plan."""
    print("[REBALANCER] Starting optimizer_node")

    if state.get("error"):
        return state

    allocation_data = state.get("allocation_data", "")

    try:
        llm = _get_llm("openai/gpt-oss-120b")
        response = llm.invoke([
            SystemMessage(content=OPTIMIZER_SYSTEM_PROMPT),
            HumanMessage(content=f"Analyze this portfolio allocation:\n\n{allocation_data}"),
        ])

        return {
            **state,
            "optimization_plan": response.content,
        }

    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "rate limit" in err_msg.lower():
            print("[REBALANCER] Rate limit hit. Falling back to openai/gpt-oss-20b")
            try:
                llm = _get_llm("openai/gpt-oss-20b")
                response = llm.invoke([
                    SystemMessage(content=OPTIMIZER_SYSTEM_PROMPT),
                    HumanMessage(content=f"Analyze this portfolio allocation:\n\n{allocation_data}"),
                ])
                return {
                    **state,
                    "optimization_plan": response.content,
                }
            except Exception as e2:
                print(f"[REBALANCER] Fallback optimizer_node error: {e2}")
                return {
                    **state,
                    "optimization_plan": f"Optimization failed (fallback): {e2}",
                    "error": str(e2)
                }

        print(f"[REBALANCER] optimizer_node error: {e}")
        return {
            **state,
            "optimization_plan": f"Optimization failed: {e}",
            "error": str(e)
        }


# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
# 4. Graph Compilation
# â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def build_rebalancer_graph() -> StateGraph:
    workflow = StateGraph(RebalancerState)

    workflow.add_node("analyzer", analyzer_node)
    workflow.add_node("optimizer", optimizer_node)

    workflow.add_edge(START, "analyzer")
    workflow.add_edge("analyzer", "optimizer")
    workflow.add_edge("optimizer", END)

    return workflow.compile()

rebalancer_graph = build_rebalancer_graph()
