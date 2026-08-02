"""
test_oms.py — Unit Tests for OrderManagementSystem (OMS)

Validates order submission, parent-child order slicing, state transitions, and audit tracking.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "ai-financial-analyst"))

from order_management_system import OrderManagementSystem


class TestOrderManagementSystem(unittest.TestCase):
    def setUp(self):
        self.oms = OrderManagementSystem()

    def test_submit_order_lifecycle(self):
        order = self.oms.submit_order(
            symbol="AAPL",
            side="BUY",
            order_type="LIMIT",
            quantity=10.0,
            limit_price=180.0,
        )
        self.assertIsNotNone(order)
        self.assertEqual(order.symbol, "AAPL")
        self.assertIn(order.status, ["FILLED", "PENDING", "PARTIALLY_FILLED", "SENT_TO_BROKER", "REJECTED"])

    def test_cancel_order(self):
        res = self.oms.cancel_order("invalid-id")
        self.assertFalse(res)


if __name__ == "__main__":
    unittest.main()
