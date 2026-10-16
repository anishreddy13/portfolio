"""
provider_test_models.py — Data Models for Provider Integration Test Framework

Defines SchemaValidationResult, ProviderComparison, and ProviderTestResult dataclasses
representing schema compliance, cross-provider discrepancies, and compatibility scores.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from market_types import ProviderType


@dataclass
class SchemaValidationResult:
    """Result of a single schema or entity validation check.

    Attributes:
        target_name: Name of target entity or payload validated (e.g. 'Quote', 'OHLCBar').
        is_valid: True if all schema checks passed without critical errors.
        errors: List of critical schema validation error strings.
        warnings: List of non-critical warning strings.
        passed_checks: Number of successful validation rules evaluated.
        failed_checks: Number of failed validation rules evaluated.
    """
    target_name: str
    is_valid: bool = True
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    passed_checks: int = 0
    failed_checks: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert SchemaValidationResult to clean dictionary."""
        return {
            "target_name": self.target_name,
            "is_valid": self.is_valid,
            "errors": self.errors,
            "warnings": self.warnings,
            "passed_checks": self.passed_checks,
            "failed_checks": self.failed_checks,
        }


@dataclass
class ProviderComparison:
    """Discrepancy measurement comparing payload outputs between two providers.

    Attributes:
        symbol: Target ticker symbol.
        data_type: DataType evaluated.
        provider_a: First ProviderType tag.
        provider_b: Second ProviderType tag.
        value_a: Numerical value from Provider A (e.g. price).
        value_b: Numerical value from Provider B (e.g. price).
        discrepancy_percent: Percentage discrepancy between Provider A and B.
        agreed: True if discrepancy is within acceptable threshold (<= 1.0%).
        notes: Human-readable comparison notes.
    """
    symbol: str
    data_type: str
    provider_a: ProviderType
    provider_b: ProviderType
    value_a: float = 0.0
    value_b: float = 0.0
    discrepancy_percent: float = 0.0
    agreed: bool = True
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert ProviderComparison to clean dictionary."""
        return {
            "symbol": self.symbol,
            "data_type": self.data_type,
            "provider_a": self.provider_a.value if hasattr(self.provider_a, "value") else str(self.provider_a),
            "provider_b": self.provider_b.value if hasattr(self.provider_b, "value") else str(self.provider_b),
            "value_a": round(self.value_a, 4),
            "value_b": round(self.value_b, 4),
            "discrepancy_percent": round(self.discrepancy_percent, 2),
            "agreed": self.agreed,
            "notes": self.notes,
        }


@dataclass
class ProviderTestResult:
    """Overall integration test validation result and compatibility score for a provider.

    Attributes:
        provider: ProviderType tag evaluated.
        compatibility_score: Overall compatibility score percentage (0.0 to 100.0%).
        overall_status: Summary status ('PASSED', 'WARNING', 'FAILED').
        schema_validations: List of individual SchemaValidationResult objects.
        comparisons: List of ProviderComparison objects against reference providers.
        timestamp: ISO timestamp of test execution.
    """
    provider: ProviderType
    compatibility_score: float = 100.0
    overall_status: str = "PASSED"
    schema_validations: List[SchemaValidationResult] = field(default_factory=list)
    comparisons: List[ProviderComparison] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        """Convert ProviderTestResult to clean dictionary."""
        return {
            "provider": self.provider.value if hasattr(self.provider, "value") else str(self.provider),
            "compatibility_score": round(self.compatibility_score, 1),
            "overall_status": self.overall_status,
            "schema_validations": [s.to_dict() for s in self.schema_validations],
            "comparisons": [c.to_dict() for c in self.comparisons],
            "timestamp": self.timestamp,
        }
