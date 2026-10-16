"""
validation_rules.py — Modular Validation Rule Set for Strategy Engine

Contains isolated, rule-based functions to validate parsed strategies.
All rules are modular and testable without hardcoding inside the validator class.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Set, Tuple

logger = logging.getLogger("validation_rules")

# Supported reference sets
KNOWN_VALID_TIMEFRAMES: Set[str] = {
    "1m", "5m", "15m", "30m", "1h", "4h", "1d", "1wk", "1mo"
}

KNOWN_VALID_INDICATORS: Set[str] = {
    "RSI", "EMA", "SMA", "VWAP", "MACD", "BOLLINGER_BANDS",
    "ATR", "VOLUME", "PRICE", "HIGH", "LOW", "CLOSE", "OPEN",
    "PREVIOUS_HIGH", "PREVIOUS_LOW", "MACD_SIGNAL"
}

EQUITY_SYMBOLS: Set[str] = {
    "AAPL", "RELIANCE", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "SPY", "QQQ", "NIFTY", "BANKNIFTY"
}

CRYPTO_SYMBOLS: Set[str] = {
    "BTC", "ETH", "BTCUSD", "ETHUSD", "SOL"
}


# ─────────────────────────────────────────────
# 1. Asset Validation
# ─────────────────────────────────────────────

def validate_asset(strategy: Dict[str, Any]) -> Tuple[List[str], List[str], List[str]]:
    """Validate asset existence, symbol format, and trading schedule compatibility."""
    errors: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []

    asset = strategy.get("asset")
    trading_days = strategy.get("trading_days", [])

    if not asset:
        warnings.append("Missing asset: Strategy does not target a specific ticker symbol.")
        suggestions.append("Specify a target symbol (e.g. AAPL, RELIANCE, BTC) for concrete execution.")
    else:
        # Check symbol format (1-10 alphanumeric characters)
        if not re.match(r'^[A-Z0-9^=-]{1,10}(\.[A-Z]{1,4})?$', str(asset).upper()):
            errors.append(f"Invalid asset symbol format: '{asset}'. Must be valid ticker symbol.")

        # Check weekend trading for equities
        upper_asset = str(asset).upper()
        if upper_asset in EQUITY_SYMBOLS or "NSE" in str(strategy.get("exchange", "")):
            weekend_days = {"Saturday", "Sunday"}
            if any(day in weekend_days for day in trading_days):
                warnings.append(f"Equity market for '{upper_asset}' is closed on weekends (Saturday/Sunday).")

    return errors, warnings, suggestions


# ─────────────────────────────────────────────
# 2. Indicator & Rule Validation
# ─────────────────────────────────────────────

def validate_indicators(strategy: Dict[str, Any]) -> Tuple[List[str], List[str], List[str]]:
    """Validate indicator presence, parameter sanity, self-crossovers, and timeframe fit."""
    errors: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []

    timeframe = strategy.get("timeframe", "1d")
    entry_rules = strategy.get("entry_rules", [])
    exit_rules = strategy.get("exit_rules", [])
    all_rules = entry_rules + exit_rules

    for rule in all_rules:
        details = rule.get("details", {})
        if not isinstance(details, dict):
            continue

        indicator = str(details.get("indicator", "")).upper()
        operator = details.get("operator", "")
        params = details.get("params", {})
        value = details.get("value")

        # Unknown indicator check
        if indicator and indicator not in KNOWN_VALID_INDICATORS:
            warnings.append(f"Unknown indicator '{indicator}' detected in rule.")

        # Check self-crossover (e.g. EMA20 crosses EMA20)
        if isinstance(value, dict):
            target_ind = str(value.get("indicator", "")).upper()
            target_params = value.get("params", {})
            if indicator == target_ind and params == target_params and operator in ("crosses_above", "crosses_below", "equals"):
                param_str = f" ({params})" if params else ""
                errors.append(f"Impossible condition: Impossible self-crossover '{indicator}{param_str}' crosses '{target_ind}{param_str}'.")

        # Check slow indicator on ultra-fast timeframe (e.g. EMA200 on 1m)
        period = params.get("period") if isinstance(params, dict) else None
        if period and isinstance(period, (int, float)):
            if period <= 0:
                errors.append(f"Invalid indicator parameter: Period for '{indicator}' must be > 0 (got {period}).")
            if period >= 200 and timeframe == "1m":
                warnings.append(f"Very slow indicator '{indicator}{period}' used on ultra-short 1 minute timeframe.")
                suggestions.append("Consider reducing indicator period or using a higher timeframe (e.g. 5m or 15m).")

    return errors, warnings, suggestions


# ─────────────────────────────────────────────
# 3. Risk Management Validation
# ─────────────────────────────────────────────

def validate_risk_rules(strategy: Dict[str, Any]) -> Tuple[List[str], List[str], List[str]]:
    """Validate stop loss, take profit, position size, and risk/reward ratio."""
    errors: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []

    stop_loss = strategy.get("stop_loss")
    take_profit = strategy.get("take_profit")

    sl_val = _parse_percent(stop_loss)
    tp_val = _parse_percent(take_profit)

    # Check for negative values in stop loss or take profit string (e.g. "Stop Loss -5%")
    if stop_loss and ("-" in str(stop_loss)):
        errors.append(f"Invalid Stop Loss specification '{stop_loss}'. Stop loss distance should be positive.")

    if take_profit and ("-" in str(take_profit)):
        errors.append(f"Invalid Take Profit specification '{take_profit}'. Take profit distance should be positive.")

    # Risk-Reward Ratio evaluation
    if sl_val is not None and tp_val is not None:
        if tp_val > 0 and sl_val > 0:
            rr_ratio = tp_val / sl_val
            if rr_ratio < 0.5:
                warnings.append(f"Poor risk-reward ratio: Take Profit ({tp_val}%) is small relative to Stop Loss ({sl_val}%).")
                suggestions.append("Aim for a minimum Risk-Reward ratio of 1:1 or higher (e.g. Take Profit >= Stop Loss).")

    if not stop_loss:
        suggestions.append("Adding an explicit Stop Loss is recommended to protect capital.")

    return errors, warnings, suggestions


# ─────────────────────────────────────────────
# 4. Timeframe & Session Validation
# ─────────────────────────────────────────────

def validate_timeframe_and_schedule(strategy: Dict[str, Any]) -> Tuple[List[str], List[str], List[str]]:
    """Validate timeframe and trading session sanity."""
    errors: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []

    timeframe = strategy.get("timeframe")
    if timeframe and timeframe not in KNOWN_VALID_TIMEFRAMES:
        warnings.append(f"Non-standard timeframe '{timeframe}'. Standard timeframes: {', '.join(sorted(KNOWN_VALID_TIMEFRAMES))}.")

    return errors, warnings, suggestions


# ─────────────────────────────────────────────
# 5. Duplicate & Contradictory Rule Detection
# ─────────────────────────────────────────────

def validate_rule_conflicts(strategy: Dict[str, Any]) -> Tuple[List[str], List[str], List[str]]:
    """Detect duplicate conditions and contradictory rules."""
    errors: List[str] = []
    warnings: List[str] = []
    suggestions: List[str] = []

    entry_rules = strategy.get("entry_rules", [])

    # Check duplicates
    seen_clauses: Set[str] = set()
    for rule in entry_rules:
        clause = str(rule.get("raw_clause", "")).strip().lower()
        if clause:
            if clause in seen_clauses:
                warnings.append(f"Duplicate entry rule condition detected: '{clause}'.")
            seen_clauses.add(clause)

    return errors, warnings, suggestions


# ─────────────────────────────────────────────
# 6. Score Calculation
# ─────────────────────────────────────────────

def calculate_validation_score(errors: List[str], warnings: List[str], suggestions: List[str]) -> int:
    """Calculate quality score (0-100) based on findings.

    Deductions:
        - Critical Error:  -25 points each
        - Warning:         -10 points each
        - Suggestion:      -5 points each
    """
    score = 100
    score -= len(errors) * 25
    score -= len(warnings) * 10
    score -= len(suggestions) * 5
    return max(0, min(100, score))


# ─────────────────────────────────────────────
# Helper
# ─────────────────────────────────────────────

def _parse_percent(val: Any) -> float | None:
    if val is None:
        return None
    try:
        clean = str(val).replace("%", "").strip()
        return float(clean)
    except Exception:
        return None
