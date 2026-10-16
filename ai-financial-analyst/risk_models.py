"""
risk_models.py — Data Models for Enterprise Risk Management Engine

Defines RiskConfiguration, PositionRisk, PortfolioRisk, RiskViolation,
RiskDecision, and RiskStatistics dataclasses with JSON serialization support.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


@dataclass
class RiskConfiguration:
    """Enterprise risk threshold parameters."""
    max_position_size_pct: float = 10.0
    max_portfolio_exposure_pct: float = 80.0
    max_symbol_exposure_pct: float = 15.0
    max_sector_exposure_pct: float = 30.0
    daily_loss_limit_pct: float = 3.0
    max_drawdown_limit_pct: float = 10.0
    max_leverage: float = 2.0
    max_var_pct: float = 2.5

    def to_dict(self) -> Dict[str, Any]:
        """Convert RiskConfiguration to clean dictionary."""
        return {
            "max_position_size_pct": round(self.max_position_size_pct, 2),
            "max_portfolio_exposure_pct": round(self.max_portfolio_exposure_pct, 2),
            "max_symbol_exposure_pct": round(self.max_symbol_exposure_pct, 2),
            "max_sector_exposure_pct": round(self.max_sector_exposure_pct, 2),
            "daily_loss_limit_pct": round(self.daily_loss_limit_pct, 2),
            "max_drawdown_limit_pct": round(self.max_drawdown_limit_pct, 2),
            "max_leverage": round(self.max_leverage, 2),
            "max_var_pct": round(self.max_var_pct, 2),
        }


@dataclass
class PositionRisk:
    """Individual position risk exposure metrics."""
    symbol: str
    market_value: float
    exposure_pct: float
    unrealized_loss_pct: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "symbol": self.symbol,
            "market_value": round(self.market_value, 2),
            "exposure_pct": round(self.exposure_pct, 2),
            "unrealized_loss_pct": round(self.unrealized_loss_pct, 2),
        }


@dataclass
class PortfolioRisk:
    """Macro portfolio-level risk evaluation metrics."""
    total_exposure_pct: float = 0.0
    daily_loss_pct: float = 0.0
    current_drawdown_pct: float = 0.0
    leverage: float = 1.0
    margin_usage_pct: float = 0.0
    var_95_pct: float = 1.8
    expected_shortfall_95_pct: float = 2.4

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_exposure_pct": round(self.total_exposure_pct, 2),
            "daily_loss_pct": round(self.daily_loss_pct, 2),
            "current_drawdown_pct": round(self.current_drawdown_pct, 2),
            "leverage": round(self.leverage, 2),
            "margin_usage_pct": round(self.margin_usage_pct, 2),
            "var_95_pct": round(self.var_95_pct, 2),
            "expected_shortfall_95_pct": round(self.expected_shortfall_95_pct, 2),
        }


@dataclass
class RiskViolation:
    """Recorded risk boundary violation record."""
    rule_name: str
    severity: str  # 'HIGH', 'MEDIUM', 'LOW'
    description: str
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_name": self.rule_name,
            "severity": self.severity,
            "description": self.description,
            "timestamp": self.timestamp,
        }


@dataclass
class RiskDecision:
    """Order evaluation decision produced by EnterpriseRiskEngine."""
    is_approved: bool
    decision_code: str  # 'APPROVED', 'REJECTED'
    violations: List[RiskViolation] = field(default_factory=list)
    risk_score: float = 15.0
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "is_approved": self.is_approved,
            "decision_code": self.decision_code,
            "violations": [v.to_dict() for v in self.violations],
            "risk_score": round(self.risk_score, 1),
            "timestamp": self.timestamp,
        }


@dataclass
class RiskStatistics:
    """Operational metrics tracking EnterpriseRiskEngine evaluations."""
    orders_evaluated: int = 0
    orders_approved: int = 0
    orders_rejected: int = 0
    violations_count: int = 0
    average_evaluation_latency_ms: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "orders_evaluated": self.orders_evaluated,
            "orders_approved": self.orders_approved,
            "orders_rejected": self.orders_rejected,
            "violations_count": self.violations_count,
            "average_evaluation_latency_ms": round(self.average_evaluation_latency_ms, 2),
        }
