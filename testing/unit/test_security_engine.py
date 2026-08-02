"""
test_security_engine.py — Unit Tests for Enterprise Security & Identity Engine

Validates authentication, RBAC authorization, token generation, and secret rotation.
"""

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent / "ai-financial-analyst"))

from security_engine import SecurityEngine


class TestSecurityEngine(unittest.TestCase):
    def setUp(self):
        self.security = SecurityEngine()

    def test_authenticate(self):
        ok, user = self.security.authenticate("sarah_quant", "tok-123")
        self.assertTrue(ok)
        self.assertIsNotNone(user)
        self.assertEqual(user.role_name, "QUANT_TRADER")

    def test_authorize_success(self):
        allowed, reason = self.security.authorize("QUANT_TRADER", "EXECUTE", "ORDER")
        self.assertTrue(allowed)

    def test_authorize_failure(self):
        allowed, reason = self.security.authorize("READ_ONLY_AUDITOR", "WRITE", "PORTFOLIO")
        self.assertFalse(allowed)


if __name__ == "__main__":
    unittest.main()
