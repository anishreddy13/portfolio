"""
validation_models.py — Data Models for Strategy Validation Engine

Defines data structures returned by the StrategyValidator.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class ValidationResult:
    """Standardized output returned by the StrategyValidator.

    Attributes:
        valid: True if the strategy has no critical validation errors.
        score: Quality & safety score from 0 (worst) to 100 (perfect).
        errors: Critical failure messages preventing execution.
        warnings: Non-fatal quality or market compatibility warnings.
        suggestions: Recommended improvements (e.g. risk/reward optimization).
        normalized_strategy: Normalized, cleaned strategy dictionary.
    """
    valid: bool = True
    score: int = 100
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    normalized_strategy: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert result into a clean dictionary."""
        return {
            "valid": self.valid,
            "score": self.score,
            "errors": self.errors,
            "warnings": self.warnings,
            "suggestions": self.suggestions,
            "normalized_strategy": self.normalized_strategy,
        }
