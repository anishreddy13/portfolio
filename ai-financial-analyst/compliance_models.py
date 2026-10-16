"""
compliance_models.py — Data Models for Enterprise Compliance Engine

Defines ComplianceRule, ComplianceViolation, ComplianceDecision, ComplianceReport,
RestrictedSecurity, and ComplianceStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ComplianceRuleType(str, Enum):
    RESTRICTED_SECURITY = "RESTRICTED_SECURITY"
    MAX_POSITION_LIMIT = "MAX_POSITION_LIMIT"
    MAX_SECTOR_LIMIT = "MAX_SECTOR_LIMIT"
    MAX_COUNTRY_LIMIT = "MAX_COUNTRY_LIMIT"
    MAX_LEVERAGE = "MAX_LEVERAGE"
    PORTFOLIO_TURNOVER = "PORTFOLIO_TURNOVER"
    WASH_SALE = "WASH_SALE"
    CASH_REQUIREMENT = "CASH_REQUIREMENT"
    ESG_CONSTRAINT = "ESG_CONSTRAINT"
    CLIENT_CONSTRAINTS = "CLIENT_CONSTRAINTS"


@dataclass
class ComplianceRule:
    """Compliance rule definition envelope."""
    rule_id: str
    name: str
    rule_type: str
    description: str
    is_active: bool = True
    severity: str = "HIGH"  # CRITICAL, HIGH, MEDIUM, LOW

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "rule_type": self.rule_type,
            "description": self.description,
            "is_active": self.is_active,
            "severity": self.severity,
        }


@dataclass
class ComplianceViolation:
    """Violation envelope recorded when a rule fails."""
    violation_id: str
    rule_id: str
    rule_name: str
    severity: str
    description: str
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "violation_id": self.violation_id,
            "rule_id": self.rule_id,
            "rule_name": self.rule_name,
            "severity": self.severity,
            "description": self.description,
            "timestamp": self.timestamp,
        }


@dataclass
class ComplianceDecision:
    """Compliance decision envelope wrapping approved/rejected AllocationDecision."""
    decision_id: str
    allocation_id: str
    symbol: str
    direction: str
    is_compliant: bool
    violations: List[ComplianceViolation] = field(default_factory=list)
    approved_shares: float = 0.0
    approved_capital: float = 0.0
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision_id": self.decision_id,
            "allocation_id": self.allocation_id,
            "symbol": self.symbol,
            "direction": self.direction,
            "is_compliant": self.is_compliant,
            "violations": [v.to_dict() for v in self.violations],
            "approved_shares": round(self.approved_shares, 4),
            "approved_capital": round(self.approved_capital, 2),
            "timestamp": self.timestamp,
        }


@dataclass
class RestrictedSecurity:
    """Restricted security entry."""
    symbol: str
    reason: str
    restricted_since: str
    category: str = "RESTRICTED"  # RESTRICTED, WATCHLIST, SHORT_BAN

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "reason": self.reason,
            "restricted_since": self.restricted_since,
            "category": self.category,
        }


@dataclass
class ComplianceReport:
    """Comprehensive compliance audit report."""
    report_id: str
    total_evaluations: int
    approved_count: int
    rejected_count: int
    active_violations: List[ComplianceViolation] = field(default_factory=list)
    restricted_securities: List[RestrictedSecurity] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "total_evaluations": self.total_evaluations,
            "approved_count": self.approved_count,
            "rejected_count": self.rejected_count,
            "active_violations": [v.to_dict() for v in self.active_violations],
            "restricted_securities": [r.to_dict() for r in self.restricted_securities],
            "timestamp": self.timestamp,
        }


@dataclass
class ComplianceStatistics:
    """Operational metrics for ComplianceEngine."""
    total_evaluations: int = 0
    approved_allocations: int = 0
    rejected_allocations: int = 0
    violations_recorded: int = 0
    average_latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_evaluations": self.total_evaluations,
            "approved_allocations": self.approved_allocations,
            "rejected_allocations": self.rejected_allocations,
            "violations_recorded": self.violations_recorded,
            "average_latency_ms": round(self.average_latency_ms, 2),
        }
