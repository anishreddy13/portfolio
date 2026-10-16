"""
strategy_validator.py — Trading Strategy Validation Engine

Performs comprehensive validation of parsed trading strategy objects against
rules defined in validation_rules.py. Returns a standardized ValidationResult.

Provides deterministic validation, normalization, and quality scoring without
external network or LLM dependencies.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Union

from validation_models import ValidationResult
from validation_rules import (
    calculate_validation_score,
    validate_asset,
    validate_indicators,
    validate_risk_rules,
    validate_rule_conflicts,
    validate_timeframe_and_schedule,
)

logger = logging.getLogger("strategy_validator")


class StrategyValidator:
    """Validator engine for trading strategy objects."""

    def __init__(self) -> None:
        logger.info("StrategyValidator initialized.")

    def validate(self, strategy_input: Union[Dict[str, Any], str, Any]) -> ValidationResult:
        """Validate a parsed strategy object or dict.

        Args:
            strategy_input: Strategy instance, dictionary, or JSON string.

        Returns:
            ValidationResult instance containing validation status, score, errors,
            warnings, suggestions, and normalized strategy dict.
        """
        # Parse JSON string if needed
        strategy_dict: Dict[str, Any] = {}
        if isinstance(strategy_input, str):
            try:
                strategy_dict = json.loads(strategy_input)
            except Exception as exc:
                logger.error("Failed to parse strategy JSON string: %s", exc)
                return ValidationResult(
                    valid=False,
                    score=0,
                    errors=[f"Malformed strategy input: Invalid JSON string ({exc})"],
                    warnings=[],
                    suggestions=["Ensure strategy input is a valid Strategy dict or JSON object."],
                    normalized_strategy={},
                )
        elif isinstance(strategy_input, dict):
            strategy_dict = strategy_input
        elif hasattr(strategy_input, "to_dict"):
            strategy_dict = strategy_input.to_dict()
        else:
            logger.error("Unsupported strategy input type: %s", type(strategy_input))
            return ValidationResult(
                valid=False,
                score=0,
                errors=["Unsupported strategy input format."],
                warnings=[],
                suggestions=[],
                normalized_strategy={},
            )

        logger.info("Validating strategy: %r", strategy_dict.get("strategy_name", "Unnamed Strategy"))

        # Step 1: Normalize Strategy Dictionary
        normalized = self.normalize_strategy(strategy_dict)

        # Step 2: Run Rules
        errors: list[str] = []
        warnings: list[str] = []
        suggestions: list[str] = []

        # Inherit any parsing errors/warnings stored in the strategy dictionary
        errors.extend(normalized.get("errors", []))
        warnings.extend(normalized.get("warnings", []))

        # Asset validation
        errs, warns, suggs = validate_asset(normalized)
        errors.extend(errs)
        warnings.extend(warns)
        suggestions.extend(suggs)

        # Indicator validation
        errs, warns, suggs = validate_indicators(normalized)
        errors.extend(errs)
        warnings.extend(warns)
        suggestions.extend(suggs)

        # Risk rules validation
        errs, warns, suggs = validate_risk_rules(normalized)
        errors.extend(errs)
        warnings.extend(warns)
        suggestions.extend(suggs)

        # Timeframe & Schedule validation
        errs, warns, suggs = validate_timeframe_and_schedule(normalized)
        errors.extend(errs)
        warnings.extend(warns)
        suggestions.extend(suggs)

        # Rule Conflicts & Duplicates
        errs, warns, suggs = validate_rule_conflicts(normalized)
        errors.extend(errs)
        warnings.extend(warns)
        suggestions.extend(suggs)

        # Deduplicate findings preserving order
        errors = list(dict.fromkeys(errors))
        warnings = list(dict.fromkeys(warnings))
        suggestions = list(dict.fromkeys(suggestions))

        # Calculate Score
        score = calculate_validation_score(errors, warnings, suggestions)
        is_valid = len(errors) == 0

        logger.info(
            "Validation finished. Valid: %s, Score: %d, Errors: %d, Warnings: %d, Suggestions: %d",
            is_valid, score, len(errors), len(warnings), len(suggestions)
        )

        return ValidationResult(
            valid=is_valid,
            score=score,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions,
            normalized_strategy=normalized,
        )

    def normalize_strategy(self, strategy: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize symbols, timeframes, indicator aliases, and rule duplicates."""
        normalized = dict(strategy)

        # Normalize symbol
        asset = normalized.get("asset")
        if asset and isinstance(asset, str):
            normalized["asset"] = asset.strip().upper()

        # Normalize timeframe
        tf = normalized.get("timeframe")
        if tf and isinstance(tf, str):
            normalized["timeframe"] = tf.strip().lower()

        return normalized
