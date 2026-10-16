"""
stress_testing_engine.py — Production-Grade Enterprise Scenario & Stress Testing Engine

Analytics-only engine. Reads PortfolioManager, FactorModelEngine, EnterpriseRiskEngine, and
PerformanceAttributionEngine to evaluate portfolio behavior under historical crisis scenarios
and hypothetical factor shocks. Never executes trades or modifies allocations.
"""

from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from factor_model_engine import FactorModelEngine, global_factor_model_engine
from performance_attribution_engine import (
    PerformanceAttributionEngine,
    global_performance_attribution_engine,
)
from portfolio_manager import PortfolioManager, global_portfolio_manager
from risk_engine import EnterpriseRiskEngine, global_risk_engine
from stress_testing_models import (
    HistoricalScenario,
    ScenarioResult,
    StressScenario,
    StressStatistics,
    StressTestReport,
)
from stress_testing_rules import (
    apply_volatility_shock,
    calculate_expected_shortfall,
    calculate_stressed_pnl,
    calculate_stressed_var,
    generate_stress_report,
    historical_replay,
    rank_scenarios,
)

logger = logging.getLogger("stress_testing_engine")

# ─────────────────────────────────────────────
# Default Standard Scenarios
# ─────────────────────────────────────────────
HISTORICAL_CRISES = [
    HistoricalScenario(
        scenario_id="hist-2008",
        name="2008 Global Financial Crisis",
        event_period="Sep 2008 - Mar 2009",
        description="Lehman collapse, global credit freeze, systemic banking crisis",
        market_drawdown_pct=-55.5,
        volatility_spike_pct=180.0,
        recovery_days=1250,
    ),
    HistoricalScenario(
        scenario_id="hist-2020",
        name="2020 COVID Flash Crash",
        event_period="Feb 2020 - Mar 2020",
        description="Pandemic outbreak, global lockdowns, rapid liquidity crunch",
        market_drawdown_pct=-33.9,
        volatility_spike_pct=210.0,
        recovery_days=148,
    ),
    HistoricalScenario(
        scenario_id="hist-2000",
        name="2000 Dot-Com Bubble Collapse",
        event_period="Mar 2000 - Oct 2002",
        description="Tech valuation unwinding, NASDAQ 78% crash",
        market_drawdown_pct=-49.1,
        volatility_spike_pct=95.0,
        recovery_days=1810,
    ),
    HistoricalScenario(
        scenario_id="hist-1987",
        name="1987 Black Monday",
        event_period="Oct 19, 1987",
        description="Programmed trading feedback loop, single-day 22.6% crash",
        market_drawdown_pct=-22.6,
        volatility_spike_pct=310.0,
        recovery_days=500,
    ),
    HistoricalScenario(
        scenario_id="hist-2022",
        name="2022 Fed Inflation Rate Shock",
        event_period="Jan 2022 - Dec 2022",
        description="Aggressive Fed rate hiking cycle, equity & bond dual sell-off",
        market_drawdown_pct=-25.4,
        volatility_spike_pct=75.0,
        recovery_days=620,
    ),
]

HYPOTHETICAL_SHOCKS = [
    StressScenario(
        scenario_id="hypo-geo",
        name="Geopolitical Escalation Flash Crash",
        description="-20% equity drawdown, +100% vol spike, crude oil +40%",
        price_shock_pct=-20.0,
        volatility_shock_pct=100.0,
        correlation_shock_pct=40.0,
        interest_rate_shock_bps=50.0,
        duration_days=5,
    ),
    StressScenario(
        scenario_id="hypo-rate",
        name="Emergency +150bps Rate Hike",
        description="Central bank rate shock to curb persistent inflation",
        price_shock_pct=-14.5,
        volatility_shock_pct=60.0,
        correlation_shock_pct=25.0,
        interest_rate_shock_bps=150.0,
        duration_days=10,
    ),
    StressScenario(
        scenario_id="hypo-tech",
        name="Mega-Cap Tech Valuation Unwind",
        description="-25% sector crash in High-Beta & Growth factors",
        price_shock_pct=-25.0,
        volatility_shock_pct=85.0,
        correlation_shock_pct=50.0,
        interest_rate_shock_bps=-25.0,
        duration_days=15,
    ),
    StressScenario(
        scenario_id="hypo-liq",
        name="Interbank Liquidity Squeeze",
        description="Widening credit spreads, dollar short squeeze",
        price_shock_pct=-18.0,
        volatility_shock_pct=120.0,
        correlation_shock_pct=65.0,
        interest_rate_shock_bps=75.0,
        duration_days=3,
    ),
]


class StressTestingEngine:
    """Production-Grade Enterprise Scenario & Stress Testing Engine.

    Usage::

        engine = StressTestingEngine()
        report = engine.run_stress_test("default")
        print(report.worst_scenario_name, report.worst_pnl)
    """

    def __init__(
        self,
        portfolio_manager: Optional[PortfolioManager] = None,
        factor_engine: Optional[FactorModelEngine] = None,
        risk_engine: Optional[EnterpriseRiskEngine] = None,
        attribution_engine: Optional[PerformanceAttributionEngine] = None,
    ) -> None:
        self.portfolio_manager = portfolio_manager or global_portfolio_manager
        self.factor_engine = factor_engine or global_factor_model_engine
        self.risk_engine = risk_engine or global_risk_engine
        self.attribution_engine = attribution_engine or global_performance_attribution_engine
        self._lock = threading.RLock()

        # Storage: report_id -> StressTestReport
        self._history: Dict[str, StressTestReport] = {}

        # Operational Statistics
        self._total_tests_run = 0
        self._hist_evaluated = 0
        self._hypo_evaluated = 0
        self._worst_hist_loss = 0.0
        self._worst_hypo_loss = 0.0

        logger.info("StressTestingEngine subsystem initialized.")

    # ─────────────────────────────────────────────
    # Stress Testing API
    # ─────────────────────────────────────────────

    def run_stress_test(self, portfolio_id: str = "default") -> StressTestReport:
        """Run full battery of historical replay and hypothetical stress tests."""
        report_id = f"stress-{uuid.uuid4().hex[:8]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._lock:
            self._total_tests_run += 1

            summary = self.portfolio_manager.portfolio_summary(portfolio_id)
            total_eq = summary.total_equity if summary.total_equity > 0 else 100000.0

            # Read Market Beta from Factor Model Engine
            beta = 1.05
            try:
                exposures = self.factor_engine.factor_exposures(portfolio_id)
                beta_exp = next((e for e in exposures if e.factor_name == "MARKET_BETA"), None)
                if beta_exp:
                    beta = beta_exp.exposure_value
            except Exception:
                pass

            results: List[ScenarioResult] = []

            # 1. Historical Crisis Replay Scenarios
            for h in HISTORICAL_CRISES:
                self._hist_evaluated += 1
                loss_pnl = historical_replay(total_eq, h.market_drawdown_pct, beta)
                loss_pct = (loss_pnl / total_eq) * 100.0

                s_var = calculate_stressed_var(total_eq, base_vol_pct=15.0, vol_boost_pct=h.volatility_spike_pct)
                s_es = calculate_expected_shortfall(s_var)

                if loss_pct < self._worst_hist_loss:
                    self._worst_hist_loss = loss_pct

                results.append(
                    ScenarioResult(
                        scenario_id=h.scenario_id,
                        scenario_name=h.name,
                        is_historical=True,
                        portfolio_loss_pct=loss_pct,
                        worst_case_pnl=loss_pnl,
                        stressed_var_95=s_var,
                        stressed_expected_shortfall_95=s_es,
                        dominant_risk_factor="MARKET_BETA",
                        recovery_estimate_days=h.recovery_days,
                    )
                )

            # 2. Hypothetical Shock Scenarios
            for hypo in HYPOTHETICAL_SHOCKS:
                self._hypo_evaluated += 1
                pnl = calculate_stressed_pnl(
                    total_eq,
                    hypo.price_shock_pct,
                    hypo.volatility_shock_pct,
                    hypo.interest_rate_shock_bps,
                )
                loss_pct = (pnl / total_eq) * 100.0

                s_var = calculate_stressed_var(total_eq, base_vol_pct=15.0, vol_boost_pct=hypo.volatility_shock_pct)
                s_es = calculate_expected_shortfall(s_var)

                if loss_pct < self._worst_hypo_loss:
                    self._worst_hypo_loss = loss_pct

                results.append(
                    ScenarioResult(
                        scenario_id=hypo.scenario_id,
                        scenario_name=hypo.name,
                        is_historical=False,
                        portfolio_loss_pct=loss_pct,
                        worst_case_pnl=pnl,
                        stressed_var_95=s_var,
                        stressed_expected_shortfall_95=s_es,
                        dominant_risk_factor="MOMENTUM" if "Tech" in hypo.name else "VOLATILITY",
                        recovery_estimate_days=hypo.duration_days * 5,
                    )
                )

            # Rank and compile summary
            summary_dict = generate_stress_report(portfolio_id, results, total_eq)

            report = StressTestReport(
                report_id=report_id,
                portfolio_id=portfolio_id,
                scenario_results=results,
                worst_scenario_name=summary_dict["worst_scenario_name"],
                worst_pnl=summary_dict["worst_pnl"],
                aggregate_stressed_var=summary_dict["aggregate_stressed_var"],
                aggregate_expected_shortfall=summary_dict["aggregate_expected_shortfall"],
                recommendations=summary_dict["recommendations"],
                timestamp=now_iso,
            )

            self._history[report_id] = report

        logger.info(
            "Executed stress test report '%s' across %d scenarios. Worst: %s (PnL=$%.2f)",
            report_id, len(results), report.worst_scenario_name, report.worst_pnl
        )
        return report

    def historical_replay(
        self,
        portfolio_id: str = "default",
        scenario_id: str = "hist-2008",
    ) -> ScenarioResult:
        """Run standalone replay for a single historical scenario."""
        rep = self.run_stress_test(portfolio_id)
        match = next((r for r in rep.scenario_results if r.scenario_id == scenario_id), None)
        if match:
            return match
        return rep.scenario_results[0] if rep.scenario_results else ScenarioResult(
            scenario_id=scenario_id,
            scenario_name="Historical Crisis",
            is_historical=True,
            portfolio_loss_pct=-45.0,
            worst_case_pnl=-45000.0,
            stressed_var_95=4.8,
            stressed_expected_shortfall_95=6.5,
            dominant_risk_factor="MARKET_BETA",
            recovery_estimate_days=500,
        )

    # ─────────────────────────────────────────────
    # Query API
    # ─────────────────────────────────────────────

    def scenario_report(self, report_id: str) -> Optional[StressTestReport]:
        """Fetch StressTestReport by ID."""
        with self._lock:
            return self._history.get(report_id)

    def scenario_history(self) -> List[StressTestReport]:
        """Return all historical StressTestReport snapshots."""
        with self._lock:
            return list(self._history.values())

    def statistics(self) -> StressStatistics:
        """Return operational StressStatistics snapshot."""
        with self._lock:
            return StressStatistics(
                total_stress_tests_run=self._total_tests_run,
                historical_scenarios_evaluated=self._hist_evaluated,
                hypothetical_scenarios_evaluated=self._hypo_evaluated,
                worst_historical_loss_pct=round(self._worst_hist_loss, 2),
                worst_hypothetical_loss_pct=round(self._worst_hypo_loss, 2),
            )


# Shared global singleton instance
global_stress_testing_engine = StressTestingEngine()
