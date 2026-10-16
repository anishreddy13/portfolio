"""
indicator_models.py — Data Models & Exceptions for Technical Indicator Engine

Defines standardized data models for indicator calculation requests, results,
and custom exceptions.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union


# ─────────────────────────────────────────────
# Custom Exceptions
# ─────────────────────────────────────────────

class IndicatorCalculationError(Exception):
    """Base exception for all technical indicator calculation errors."""
    def __init__(self, message: str, indicator: str = "", symbol: str = "") -> None:
        self.indicator = indicator
        self.symbol = symbol
        super().__init__(message)


class InvalidParameterError(IndicatorCalculationError):
    """Raised when indicator parameters are invalid (e.g., period <= 0)."""
    pass


class InsufficientDataError(IndicatorCalculationError):
    """Raised when not enough candles are available to calculate an indicator."""
    pass


# ─────────────────────────────────────────────
# Data Models
# ─────────────────────────────────────────────

@dataclass(frozen=True)
class IndicatorRequest:
    """Represents a request to compute a specific indicator with parameters.

    Attributes:
        indicator: Name of the indicator (e.g. 'RSI', 'EMA', 'MACD').
        parameters: Keyword parameters dictionary (e.g. {'period': 14}).
    """
    indicator: str
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass
class IndicatorResult:
    """Standardized output of a technical indicator calculation.

    Attributes:
        indicator: Name of the indicator (e.g. 'EMA', 'RSI', 'MACD').
        parameters: Parameters used for the calculation.
        values: Series of computed values (List of floats/None or Dict of Lists for multi-output indicators).
        latest: Latest computed scalar or dict value.
        timestamp: ISO timestamp of the latest calculated bar.
    """
    indicator: str
    parameters: Dict[str, Any]
    values: Union[List[Optional[float]], Dict[str, List[Optional[float]]]]
    latest: Any
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to clean dictionary."""
        return {
            "indicator": self.indicator,
            "parameters": self.parameters,
            "values": self.values,
            "latest": self.latest,
            "timestamp": self.timestamp,
        }
