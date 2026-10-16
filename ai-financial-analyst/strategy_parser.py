"""
strategy_parser.py — Natural Language Strategy Parser Engine

Converts plain English trading strategies into structured strategy objects using:
  - Stage 1: Deterministic rule-based parsing engine (fast, zero dependencies)
  - Stage 2: LLM fallback interface stub (NotImplemented)

Provides unit-testable, deterministic parsing functions with structured logging.
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional, Tuple

from strategy_dictionary import (
    DAY_ALIASES,
    ENTRY_KEYWORDS,
    EXIT_KEYWORDS,
    INDICATOR_ALIASES,
    KNOWN_ASSETS,
    OPERATOR_ALIASES,
    SESSION_ALIASES,
    SUPPORTED_INDICATORS,
    SUPPORTED_OPERATORS,
    SUPPORTED_TIMEFRAMES,
    TIMEFRAME_ALIASES,
)
from strategy_models import (
    EntryRule,
    ExitRule,
    IndicatorRule,
    Strategy,
)

logger = logging.getLogger("strategy_parser")


# ═════════════════════════════════════════════
# 1. Stub LLM Fallback Interface
# ═════════════════════════════════════════════

def parse_with_llm(prompt: str) -> Strategy:
    """Stub interface for Stage 2 LLM strategy parsing fallback.

    Currently returns NotImplemented as Groq/LLM integration is scheduled
    for a future phase.

    Raises:
        NotImplementedError: Always raised when invoked in this phase.
    """
    logger.info("parse_with_llm stub called for prompt: %r", prompt)
    raise NotImplementedError("LLM fallback parsing stage is not implemented yet.")


# ═════════════════════════════════════════════
# 2. Main Public Entry Point
# ═════════════════════════════════════════════

def parse_strategy(prompt: str) -> Strategy:
    """Main strategy parsing entrypoint.

    Attempts Stage 1 rule-based parsing. If parsing fails critically, attempts
    Stage 2 LLM fallback.

    Args:
        prompt: Natural-language trading strategy string.

    Returns:
        Structured `Strategy` object.
    """
    if not prompt or not prompt.strip():
        logger.warning("Empty strategy prompt received.")
        return Strategy(
            strategy_name="Empty Strategy",
            confidence=0.0,
            warnings=["Prompt was empty."],
            errors=["Malformed strategy: Prompt cannot be empty."],
        )

    clean_prompt = prompt.strip()
    logger.info("Parsing strategy prompt: %r", clean_prompt)

    try:
        strategy = _rule_based_parse(clean_prompt)
        # Check if parsing was acceptable or needs fallback
        if strategy.confidence < 0.3 and not strategy.asset and not strategy.entry_rules:
            logger.info("Rule-based parsing confidence low (%.2f). Attempting LLM fallback.", strategy.confidence)
            try:
                return parse_with_llm(clean_prompt)
            except NotImplementedError:
                logger.info("LLM fallback unavailable. Returning rule-based parse result with warnings.")
                strategy.warnings.append("LLM fallback unavailable; using best-effort rule-based result.")
        return strategy

    except Exception as exc:
        logger.exception("Unexpected error in rule-based parser: %s", exc)
        return Strategy(
            strategy_name="Failed Parse Strategy",
            confidence=0.0,
            warnings=["Unexpected parsing error encountered."],
            errors=[f"Parse error: {str(exc)}"],
        )


# ═════════════════════════════════════════════
# 3. Stage 1: Rule-Based Parser Engine
# ═════════════════════════════════════════════

def _rule_based_parse(prompt: str) -> Strategy:
    warnings: List[str] = []
    errors: List[str] = []
    confidence = 1.0

    # ── Normalize text ──
    text = prompt
    lower_text = text.lower()

    # ── Extract Asset / Ticker ──
    asset, exchange = _extract_asset(text)
    if not asset:
        warnings.append("Missing asset: No specific ticker symbol detected in prompt.")
        confidence -= 0.2

    # ── Extract Timeframe ──
    timeframe = _extract_timeframe(lower_text)
    if not timeframe:
        timeframe = "1d"  # Default
    elif timeframe not in SUPPORTED_TIMEFRAMES:
        warnings.append(f"Invalid timeframe '{timeframe}'. Defaulting to 1d.")
        timeframe = "1d"
        confidence -= 0.1

    # ── Extract Trading Days & Session ──
    trading_days = _extract_trading_days(lower_text)
    session = _extract_session(lower_text)

    # ── Extract Risk Rules (Stop Loss, Take Profit, Position Size) ──
    stop_loss = _extract_risk_param(lower_text, ["stop loss", "sl"])
    take_profit = _extract_risk_param(lower_text, ["take profit", "tp", "exit after", "profit"])
    position_size = _extract_risk_param(lower_text, ["position size", "size", "risk"])

    # ── Extract Entry & Exit Rules ──
    entry_rules, exit_rules, indicators_used, rule_warnings, rule_errors = _extract_rules(text)

    warnings.extend(rule_warnings)
    errors.extend(rule_errors)

    if not entry_rules and not stop_loss and not take_profit:
        warnings.append("No clear entry or exit conditions recognized.")
        confidence -= 0.3

    # ── Derive Strategy Name ──
    strategy_name = f"{asset or 'Custom'} Strategy"
    if timeframe:
        strategy_name += f" ({timeframe})"

    # Final confidence clamp
    confidence = max(0.0, min(1.0, confidence))

    return Strategy(
        strategy_name=strategy_name,
        asset=asset,
        exchange=exchange,
        timeframe=timeframe,
        entry_rules=entry_rules,
        exit_rules=exit_rules,
        stop_loss=stop_loss,
        take_profit=take_profit,
        position_size=position_size,
        trading_days=trading_days,
        session=session,
        indicators_used=sorted(list(indicators_used)),
        confidence=confidence,
        parsing_method="rule_based",
        warnings=warnings,
        errors=errors,
    )


# ═════════════════════════════════════════════
# 4. Helper Extraction Functions
# ═════════════════════════════════════════════

def _extract_asset(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Extract symbol and exchange from text."""
    # Check known assets list
    words = re.findall(r'\b[A-Za-z0-9^=-]+\b', text)
    for word in words:
        upper = word.upper()
        if upper in KNOWN_ASSETS:
            return upper, None

    # Regex for standard 2-6 letter uppercase tickers (e.g. AAPL, Reliance, BTC)
    # Check words that look like tickers right after buy/long/trade
    match = re.search(r'\b(?:buy|sell|trade|for|on)\s+([A-Za-z0-9]{2,10})\b', text, re.IGNORECASE)
    if match:
        possible_asset = match.group(1).upper()
        # Avoid matching keywords like 'when', 'if', 'only'
        if possible_asset not in {"WHEN", "IF", "ONLY", "AFTER", "UNTIL", "ON", "IN"}:
            return possible_asset, None

    return None, None


def _extract_timeframe(lower_text: str) -> Optional[str]:
    """Extract and normalize timeframe from text."""
    for phrase, tf in TIMEFRAME_ALIASES.items():
        if re.search(r'\b' + re.escape(phrase) + r'\b', lower_text):
            return tf
    return None


def _extract_trading_days(lower_text: str) -> List[str]:
    """Extract allowed trading days."""
    days: List[str] = []
    for alias, day_name in DAY_ALIASES.items():
        if re.search(r'\b' + re.escape(alias) + r'\b', lower_text):
            if day_name not in days:
                days.append(day_name)
    return days


def _extract_session(lower_text: str) -> str:
    """Extract trading session restrictions."""
    for phrase, session_val in SESSION_ALIASES.items():
        if phrase in lower_text:
            return session_val
    return "all_day"


def _extract_risk_param(lower_text: str, keywords: List[str]) -> Optional[str]:
    """Extract percentage or numeric risk specifications (e.g. '5 percent', '2%')."""
    for kw in keywords:
        pattern = re.escape(kw) + r'\s*(?:of|is|at)?\s*([0-9]+(?:\.[0-9]+)?\s*%|[0-9]+(?:\.[0-9]+)?\s*percent|[0-9]+(?:\.[0-9]+)?)'
        match = re.search(pattern, lower_text)
        if match:
            val_str = match.group(1).strip()
            if "percent" in val_str:
                val_str = val_str.replace("percent", "").strip() + "%"
            elif not val_str.endswith("%"):
                val_str = val_str + "%"
            return val_str
    return None


def _extract_rules(text: str) -> Tuple[List[EntryRule], List[ExitRule], set[str], List[str], List[str]]:
    """Parse text into entry/exit rules and collected indicator names."""
    entry_rules: List[EntryRule] = []
    exit_rules: List[ExitRule] = []
    indicators_used: set[str] = set()
    warnings: List[str] = []
    errors: List[str] = []

    # Split prompt into clauses by 'and', 'when', 'if', comma, semicolon
    clauses = re.split(r'\b(?:and|when|if|where|then)\b|,|;', text, flags=re.IGNORECASE)

    for clause in clauses:
        clause_str = clause.strip()
        if not clause_str:
            continue

        lower_clause = clause_str.lower()

        # Determine if clause is Entry or Exit
        is_entry = any(kw in lower_clause for kw in ENTRY_KEYWORDS)
        is_exit = any(kw in lower_clause for kw in EXIT_KEYWORDS) or "stop loss" in lower_clause or "profit" in lower_clause

        # Normalize indicator expressions in clause
        parsed_cond = _parse_clause_condition(clause_str)

        if parsed_cond:
            ind_rule, ind_name = parsed_cond
            if ind_name:
                indicators_used.add(ind_name)

            if is_exit and not is_entry:
                exit_rules.append(ExitRule(
                    condition_type="indicator" if ind_name else "custom",
                    details=ind_rule.to_dict(),
                    raw_clause=clause_str,
                ))
            else:
                entry_rules.append(EntryRule(
                    condition_type="indicator" if ind_name else "custom",
                    details=ind_rule.to_dict(),
                    raw_clause=clause_str,
                ))

    return entry_rules, exit_rules, indicators_used, warnings, errors


def _parse_clause_condition(clause: str) -> Optional[Tuple[IndicatorRule, Optional[str]]]:
    """Parse a single clause into an IndicatorRule object."""
    lower = clause.lower()

    # 1. Check for indicator patterns (e.g. "RSI drops below 30", "EMA20 crosses EMA50", "20 EMA", "MACD crosses below signal")
    # Identify indicator & parameter
    indicator_name = None
    indicator_key = None
    params: Dict[str, Any] = {}

    # Pattern: EMA20, 20 EMA, RSI 14, RSI
    ind_match = re.search(
        r'\b(?:([0-9]+)\s*)?(rsi|ema|sma|vwap|macd|bollinger|bb|atr|volume|vol|price|close|high|low|open)\s*([0-9]+)?\b',
        lower
    )
    if ind_match:
        p1, raw_ind, p2 = ind_match.groups()
        period = int(p1) if p1 else (int(p2) if p2 else None)
        indicator_key = INDICATOR_ALIASES.get(raw_ind, raw_ind.upper())
        indicator_name = indicator_key
        if period:
            params["period"] = period
        elif indicator_key == "RSI":
            params["period"] = 14
        elif indicator_key == "EMA":
            params["period"] = 20

    # Identify operator
    op_found = None
    for op_phrase, op_val in OPERATOR_ALIASES.items():
        if op_phrase in lower:
            op_found = op_val
            break

    # Identify threshold value or target indicator
    target_val = None
    # Check numeric value (e.g., 30, 50, 100)
    val_match = re.search(r'\b([0-9]+(?:\.[0-9]+)?)\b', lower)
    if val_match:
        num = float(val_match.group(1))
        # Ignore if num was the period
        if not params or num != params.get("period"):
            target_val = num

    # Check target indicator (e.g., "crosses EMA50", "closes above previous high", "crosses below signal")
    if "ema" in lower and "crosses" in lower:
        second_ema = re.search(r'crosses\s+.*?(?:ema\s*([0-9]+)|([0-9]+)\s*ema)', lower)
        if second_ema:
            p = int(second_ema.group(1) or second_ema.group(2))
            target_val = {"indicator": "EMA", "params": {"period": p}}

    if "previous high" in lower:
        target_val = {"indicator": "PREVIOUS_HIGH"}

    if "signal" in lower:
        target_val = {"indicator": "MACD_SIGNAL"}

    if indicator_name or op_found:
        rule = IndicatorRule(
            indicator=indicator_name or "PRICE",
            params=params,
            operator=op_found or "equals",
            value=target_val,
            raw_expression=clause,
        )
        return rule, indicator_name

    return None
