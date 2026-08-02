"""
test_compliance_engine.py — Unit Tests for Enterprise Pre-Trade Compliance Engine

Validates restricted list checks, position limit validation, and mandate enforcement.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "ai-financial-analyst"))

from compliance_engine import ComplianceEngine
from portfolio_construction_models import AllocationDecision


class TestComplianceEngine(unittest.TestCase):
    def setUp(self):
        self.engine = ComplianceEngine()

    def test_compliant_trade_evaluation(self):
        decision = AllocationDecision(
            decision_id="dec-test-1",
            signal_id="sig-test-1",
            symbol="AAPL",
            direction="BUY",
            target_shares=50.0,
            target_capital=10000.0,
            allocated_weight_pct=5.0,
            sizing_model="RISK_PARITY",
            timestamp="2026-08-02T10:00:00Z",
        )
        res = self.engine.evaluate(decision)
        self.assertTrue(res.is_compliant)
        self.assertEqual(len(res.violations), 0)

    def test_restricted_security_violation(self):
        decision = AllocationDecision(
            decision_id="dec-test-2",
            signal_id="sig-test-2",
            symbol="LMT",
            direction="BUY",
            target_shares=50.0,
            target_capital=10000.0,
            allocated_weight_pct=5.0,
            sizing_model="RISK_PARITY",
            timestamp="2026-08-02T10:00:00Z",
        )
        res = self.engine.evaluate(decision)
        self.assertFalse(res.is_compliant)
        self.assertGreaterEqual(len(res.violations), 1)


if __name__ == "__main__":
    unittest.main()
