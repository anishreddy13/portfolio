"""
test_subsystem_performance.py — Performance & Latency Benchmark Tests

Measures latency distribution percentiles across RequestCoordinator, ComplianceEngine, OMS, and AuditEngine.
"""

import sys
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "ai-financial-analyst"))

from benchmark_engine import BenchmarkEngine


class TestSubsystemPerformance(unittest.TestCase):
    def setUp(self):
        self.benchmark = BenchmarkEngine()

    def test_benchmark_execution(self):
        report = self.benchmark.run("Performance Stress Run", "ALL", duration_sec=1)
        self.assertEqual(report.status, "PASSED")
        self.assertLess(report.latency.p95_ms, 100.0)
        self.assertGreater(report.throughput.requests_per_sec, 1000.0)


if __name__ == "__main__":
    unittest.main()
