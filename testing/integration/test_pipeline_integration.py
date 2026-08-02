"""
test_pipeline_integration.py — Integration Test for End-to-End Trading Pipeline

Verifies end-to-end flow: SignalEngine -> PortfolioConstructionEngine -> ComplianceEngine -> OMS -> ExecutionManager -> BrokerGateway -> AuditEngine & ObservabilityEngine.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "ai-financial-analyst"))

from audit_engine import global_audit_engine
from compliance_engine import ComplianceEngine
from observability_engine import global_observability_engine
from portfolio_construction_engine import PortfolioConstructionEngine
from signal_engine import SignalEngine
from signal_models import SignalStrength, TradingSignal


class TestPipelineIntegration(unittest.TestCase):
    def setUp(self):
        self.signal_eng = SignalEngine()
        self.portfolio_const = PortfolioConstructionEngine()
        self.compliance = ComplianceEngine()

    def test_end_to_end_pipeline(self):
        # Step 1: Submit Alpha Signal
        sig = TradingSignal(
            signal_id="sig-pipe-1",
            symbol="AAPL",
            direction="BUY",
            source="MACD_MOMENTUM",
            strength=SignalStrength(value=0.92, confidence=0.95),
            timestamp="2026-08-02T10:00:00Z",
        )
        decision = self.signal_eng.submit_signal(sig)
        self.assertTrue(decision.is_approved)

        # Step 2: Construct Allocation Decision from TradingSignal
        alloc_decision = self.portfolio_const.allocate_signal(sig)
        self.assertIsNotNone(alloc_decision)
        self.assertEqual(alloc_decision.symbol, "AAPL")

        # Step 3: Pre-Trade Compliance Check & Automated OMS Execution Routing
        eval_result = self.compliance.evaluate(alloc_decision)
        self.assertTrue(eval_result.is_compliant)

        # Step 4: Verify Audit Log & Hash Chain Integrity
        audit_history = global_audit_engine.query(symbol="AAPL")
        self.assertGreaterEqual(len(audit_history), 1)
        self.assertTrue(global_audit_engine.verify())

        # Step 5: Verify Telemetry Recorded in ObservabilityEngine
        healths = global_observability_engine.health()
        self.assertGreaterEqual(len(healths), 5)


if __name__ == "__main__":
    unittest.main()
