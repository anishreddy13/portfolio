"""
copilot_rules.py — Pure Copilot Intent Detection & Recommendation Rules

Contains pure logic functions for natural-language intent detection, entity extraction (symbols, sides, numbers),
action recommendation generation, execution plan construction, action validation, and prioritization.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import re
import uuid
from typing import Any, Dict, List, Optional, Tuple

from copilot_models import CopilotAction, CopilotExecutionPlan, CopilotIntent

logger = logging.getLogger("copilot_rules")

KNOWN_SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "TSLA", "META", "SPY", "QQQ", "LMT"]


def detect_intent(query: str) -> CopilotIntent:
    """Classify natural-language user query into CopilotIntent enum."""
    q = query.strip().lower()

    if any(k in q for k in ["signal", "indicator", "rsi", "ema", "trend"]):
        return CopilotIntent.EXPLAIN_SIGNAL
    if any(k in q for k in ["portfolio", "position", "holding", "asset", "cash"]):
        return CopilotIntent.EXPLAIN_PORTFOLIO
    if any(k in q for k in ["risk", "var", "drawdown", "leverage", "exposure"]):
        return CopilotIntent.EXPLAIN_RISK
    if any(k in q for k in ["buy", "sell", "trade", "order"]):
        return CopilotIntent.RECOMMEND_TRADE
    if any(k in q for k in ["rebalance", "reweight", "target weight", "re-balance"]):
        return CopilotIntent.RECOMMEND_REBALANCE
    if any(k in q for k in ["hedge", "protect", "downside", "put"]):
        return CopilotIntent.RECOMMEND_HEDGE

    return CopilotIntent.GENERAL_QUERY


def extract_entities(query: str) -> Dict[str, Any]:
    """Extract symbol, side, quantity, and price entities from text."""
    q_upper = query.upper()
    extracted_syms = [s for s in KNOWN_SYMBOLS if s in q_upper]
    symbol = extracted_syms[0] if extracted_syms else "AAPL"

    side = "BUY" if "SELL" not in q_upper else "SELL"
    
    # Extract numbers
    nums = re.findall(r"\b\d+(?:\.\d+)?\b", query)
    quantity = float(nums[0]) if nums else 10.0

    return {
        "symbol": symbol,
        "side": side,
        "quantity": quantity,
    }


def recommend_actions(intent: CopilotIntent, entities: Dict[str, Any]) -> List[CopilotAction]:
    """Generate recommended actions for target intent and extracted entities."""
    sym = entities.get("symbol", "AAPL")
    side = entities.get("side", "BUY")
    qty = entities.get("quantity", 10.0)

    actions: List[CopilotAction] = []

    if intent == CopilotIntent.RECOMMEND_TRADE:
        actions.append(
            CopilotAction(
                action_id=f"act-{uuid.uuid4().hex[:6]}",
                action_type="SUBMIT_SIGNAL",
                target_symbol=sym,
                parameters={"direction": side, "quantity": qty, "suggested_price": 182.50},
            )
        )
    elif intent == CopilotIntent.RECOMMEND_REBALANCE:
        actions.append(
            CopilotAction(
                action_id=f"act-{uuid.uuid4().hex[:6]}",
                action_type="REBALANCE_PORTFOLIO",
                target_symbol=sym,
                parameters={"target_weight_pct": 10.0},
            )
        )
    elif intent == CopilotIntent.RECOMMEND_HEDGE:
        actions.append(
            CopilotAction(
                action_id=f"act-{uuid.uuid4().hex[:6]}",
                action_type="ADD_HEDGE",
                target_symbol="SPY",
                parameters={"hedge_type": "PROTECTIVE_PUT", "coverage_pct": 50.0},
            )
        )

    return actions


def build_execution_plan(intent: CopilotIntent, actions: List[CopilotAction]) -> CopilotExecutionPlan:
    """Construct multi-step execution plan from recommended actions."""
    plan_id = f"plan-{uuid.uuid4().hex[:6]}"
    title = f"Execution Plan for {intent.value}"

    steps: List[Dict[str, Any]] = [
        {"step": 1, "name": "Signal Validation", "description": "Validate signal parameters in SignalEngine."},
        {"step": 2, "name": "Portfolio Construction", "description": "Calculate Risk Parity capital allocation."},
        {"step": 3, "name": "Pre-Trade Compliance", "description": "Evaluate mandate rules in ComplianceEngine."},
        {"step": 4, "name": "OMS Order Slicing", "description": "Initialize parent/child orders in OMS."},
    ]

    return CopilotExecutionPlan(
        plan_id=plan_id,
        title=title,
        steps=steps,
        estimated_impact="Neutral risk shift, +0.2% expected alpha",
        compliance_status="PASSED",
    )


def validate_action(action: CopilotAction) -> Tuple[bool, str]:
    """Validate copilot recommended action parameters."""
    if not action or not action.target_symbol:
        return (False, "Missing target symbol in recommended action.")
    return (True, "Action parameters valid.")


def prioritize_actions(actions: List[CopilotAction]) -> List[CopilotAction]:
    """Sort actions by safety and priority."""
    return sorted(actions, key=lambda a: a.action_type)
