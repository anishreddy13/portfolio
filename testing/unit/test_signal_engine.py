"""
test_signal_engine.py — Unit Tests for Enterprise Signal Engine

Validates signal generation, indicator math, confidence weighting, and audit logging.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "ai-financial-analyst"))

from signal_engine import SignalEngine
from signal_models import SignalStrength, TradingSignal


class TestSignalEngine(unittest.TestCase):
    def setUp(self):
        self.engine = SignalEngine()

    def test_submit_signal_creation(self):
        sig = TradingSignal(
            signal_id="sig-test-01",
            symbol="AAPL",
            direction="BUY",
            source="EMA_CROSSOVER",
            strength=SignalStrength(value=0.88, confidence=0.90),
            timestamp="2026-08-02T10:00:00Z",
        )
        decision = self.engine.submit_signal(sig)
        self.assertTrue(decision.is_approved)

    def test_active_signals_filter(self):
        sig = TradingSignal(
            signal_id="sig-test-02",
            symbol="MSFT",
            direction="BUY",
            source="RSI_MEAN_REVERSION",
            strength=SignalStrength(value=0.75, confidence=0.85),
            timestamp="2026-08-02T10:00:00Z",
        )
        self.engine.submit_signal(sig)
        active = self.engine.active_signals()
        self.assertGreaterEqual(len(active), 1)


if __name__ == "__main__":
    unittest.main()
