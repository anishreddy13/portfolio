"""
stress_testing_models.py — Data Models for Enterprise Scenario & Stress Testing Engine

Defines StressScenario, HistoricalScenario, ScenarioShock, ScenarioResult,
StressTestReport, and StressStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ScenarioShock:
    """Specific shock vector applied to a portfolio factor or asset."""
    shock_type: str  # PRICE, VOLATILITY, CORRELATION, INTEREST_RATE
    asset_or_factor: str
    magnitude: float  # e.g., -0.20 for -20% price, +0.50 for +50% vol boost

    def to_dict(self) -> Dict[str, Any]:
        return {
            "shock_type": self.shock_type,
            "asset_or_factor": self.asset_or_factor,
            "magnitude": round(self.magnitude, 4),
        }


@dataclass
class StressScenario:
    """Hypothetical stress scenario specification."""
    scenario_id: str
    name: str
    description: str
    price_shock_pct: float
    volatility_shock_pct: float
    correlation_shock_pct: float
    interest_rate_shock_bps: float
    duration_days: int = 1

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "name": self.name,
            "description": self.description,
            "price_shock_pct": round(self.price_shock_pct, 2),
            "volatility_shock_pct": round(self.volatility_shock_pct, 2),
            "correlation_shock_pct": round(self.correlation_shock_pct, 2),
            "interest_rate_shock_bps": round(self.interest_rate_shock_bps, 2),
            "duration_days": self.duration_days,
        }


@dataclass
class HistoricalScenario:
    """Historical crisis replay scenario specification."""
    scenario_id: str
    name: str
    event_period: str
    description: str
    market_drawdown_pct: float
    volatility_spike_pct: float
    recovery_days: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "name": self.name,
            "event_period": self.event_period,
            "description": self.description,
            "market_drawdown_pct": round(self.market_drawdown_pct, 2),
            "volatility_spike_pct": round(self.volatility_spike_pct, 2),
            "recovery_days": self.recovery_days,
        }


@dataclass
class ScenarioResult:
    """Stress test execution outcome for a single scenario."""
    scenario_id: str
    scenario_name: str
    is_historical: bool
    portfolio_loss_pct: float
    worst_case_pnl: float
    stressed_var_95: float
    stressed_expected_shortfall_95: float
    dominant_risk_factor: str
    recovery_estimate_days: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "scenario_name": self.scenario_name,
            "is_historical": self.is_historical,
            "portfolio_loss_pct": round(self.portfolio_loss_pct, 2),
            "worst_case_pnl": round(self.worst_case_pnl, 2),
            "stressed_var_95": round(self.stressed_var_95, 2),
            "stressed_expected_shortfall_95": round(self.stressed_expected_shortfall_95, 2),
            "dominant_risk_factor": self.dominant_risk_factor,
            "recovery_estimate_days": self.recovery_estimate_days,
        }


@dataclass
class StressTestReport:
    """Comprehensive stress testing report envelope."""
    report_id: str
    portfolio_id: str
    scenario_results: List[ScenarioResult] = field(default_factory=list)
    worst_scenario_name: str = ""
    worst_pnl: float = 0.0
    aggregate_stressed_var: float = 0.0
    aggregate_expected_shortfall: float = 0.0
    recommendations: List[str] = field(default_factory=list)
    timestamp: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "report_id": self.report_id,
            "portfolio_id": self.portfolio_id,
            "scenario_results": [r.to_dict() for r in self.scenario_results],
            "worst_scenario_name": self.worst_scenario_name,
            "worst_pnl": round(self.worst_pnl, 2),
            "aggregate_stressed_var": round(self.aggregate_stressed_var, 2),
            "aggregate_expected_shortfall": round(self.aggregate_expected_shortfall, 2),
            "recommendations": self.recommendations,
            "timestamp": self.timestamp,
        }


@dataclass
class StressStatistics:
    """Operational metrics for the StressTestingEngine."""
    total_stress_tests_run: int = 0
    historical_scenarios_evaluated: int = 0
    hypothetical_scenarios_evaluated: int = 0
    worst_historical_loss_pct: float = 0.0
    worst_hypothetical_loss_pct: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_stress_tests_run": self.total_stress_tests_run,
            "historical_scenarios_evaluated": self.historical_scenarios_evaluated,
            "hypothetical_scenarios_evaluated": self.hypothetical_scenarios_evaluated,
            "worst_historical_loss_pct": round(self.worst_historical_loss_pct, 2),
            "worst_hypothetical_loss_pct": round(self.worst_hypothetical_loss_pct, 2),
        }
