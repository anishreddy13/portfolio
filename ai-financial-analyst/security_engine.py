"""
security_engine.py — Production-Grade Enterprise Security & Identity Engine

Owns authentication, RBAC authorization, service principal identities, Vault/KMS secret references,
API credential rotation, and security audit logging across all 35 completed subsystems.
Never performs order execution, trading signals, or market data routing directly.
"""

from __future__ import annotations

import logging
import threading
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from security_models import (
    AccessPolicy,
    ApiCredential,
    Permission,
    Role,
    SecretReference,
    SecurityAuditEvent,
    SecurityStatistics,
    UserIdentity,
)
from security_rules import (
    authenticate as rule_authenticate,
    authorize as rule_authorize,
    generate_token_metadata,
    rotate_secret,
)

# Late-bound import for AuditEngine
_audit_engine = None


def _get_audit_engine():
    global _audit_engine
    if _audit_engine is None:
        try:
            from audit_engine import global_audit_engine
            _audit_engine = global_audit_engine
        except ImportError:
            _audit_engine = None
    return _audit_engine


logger = logging.getLogger("security_engine")

DEFAULT_ROLES = [
    Role("role-admin", "ADMIN", [Permission("p1", "ADMIN", "*")]),
    Role("role-trader", "QUANT_TRADER", [Permission("p2", "EXECUTE", "ORDER"), Permission("p3", "READ", "PORTFOLIO")]),
    Role("role-risk", "RISK_MANAGER", [Permission("p4", "WRITE", "COMPLIANCE"), Permission("p5", "READ", "PORTFOLIO")]),
]

DEFAULT_USERS = [
    UserIdentity("user-01", "alex_sre", "alex.sre@enterprise.com", "ADMIN", True, "2026-08-02T10:00:00Z"),
    UserIdentity("user-02", "sarah_quant", "sarah.quant@enterprise.com", "QUANT_TRADER", True, "2026-08-02T10:00:00Z"),
    UserIdentity("user-03", "cro_officer", "cro@enterprise.com", "RISK_MANAGER", True, "2026-08-02T10:00:00Z"),
]

DEFAULT_SECRETS = [
    SecretReference("sec-alpaca", "ALPACA_API_SECRET", "secret/data/trading/alpaca-primary", 2, "2026-08-02T08:00:00Z"),
    SecretReference("sec-ibkr", "IBKR_CERT_KEY", "secret/data/trading/ibkr-gateway", 1, "2026-08-02T08:00:00Z"),
    SecretReference("sec-polygon", "POLYGON_API_KEY", "secret/data/marketdata/polygon", 3, "2026-08-02T08:00:00Z"),
]


class SecurityEngine:
    """Production-Grade Enterprise Security & Identity Engine.

    Usage::

        engine = SecurityEngine()
        ok, user = engine.authenticate("sarah_quant", "tok-123")
        authz, reason = engine.authorize("QUANT_TRADER", "EXECUTE", "ORDER")
    """

    def __init__(self) -> None:
        self._lock = threading.RLock()

        # Storage
        self._identities: Dict[str, UserIdentity] = {}
        self._roles: Dict[str, Role] = {}
        self._secrets: Dict[str, SecretReference] = {}
        self._credentials: Dict[str, ApiCredential] = {}
        self._audit_events: List[SecurityAuditEvent] = []

        # Operational Statistics
        self._denied_count = 0
        self._last_rotation_at = "2026-08-02T08:00:00Z"

        # Seed initial identities & roles
        self._seed_default_security()

        logger.info("SecurityEngine initialized managing %d identities and %d secrets.", len(self._identities), len(self._secrets))

    # ─────────────────────────────────────────────
    # Authentication & Authorization API
    # ─────────────────────────────────────────────

    def authenticate(self, username: str, token: str = "valid") -> Tuple[bool, Optional[UserIdentity]]:
        """Authenticate user or service principal identity."""
        with self._lock:
            ok, user = rule_authenticate(username, token, self._identities)
            now_iso = datetime.now(timezone.utc).isoformat()

            audit_res = "GRANTED" if ok else "DENIED"
            if not ok:
                self._denied_count += 1

            self._record_security_audit(
                user_id=username,
                action="AUTHENTICATE",
                resource="SYSTEM",
                result=audit_res,
            )

        return (ok, user)

    def authorize(self, role_name: str, action: str, resource: str, user_id: str = "SYSTEM") -> Tuple[bool, str]:
        """Authorize action on resource based on user RBAC role."""
        with self._lock:
            allowed, reason = rule_authorize(role_name, action, resource)
            now_iso = datetime.now(timezone.utc).isoformat()

            if not allowed:
                self._denied_count += 1

            self._record_security_audit(
                user_id=user_id,
                action=f"{action}:{resource}",
                resource=resource,
                result="GRANTED" if allowed else "DENIED",
            )

        return (allowed, reason)

    # ─────────────────────────────────────────────
    # Secret & Credential Management API
    # ─────────────────────────────────────────────

    def register_identity(self, username: str, email: str, role_name: str = "QUANT_TRADER") -> UserIdentity:
        """Register a new user or service identity."""
        u_id = f"user-{uuid.uuid4().hex[:6]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._lock:
            identity = UserIdentity(
                user_id=u_id,
                username=username,
                email=email,
                role_name=role_name,
                is_active=True,
                created_at=now_iso,
            )
            self._identities[username] = identity

        logger.info("Registered UserIdentity '%s' with role '%s'.", username, role_name)
        return identity

    def register_secret(self, secret_name: str, vault_path: str) -> SecretReference:
        """Register a Vault / KMS secret reference envelope."""
        s_id = f"sec-{uuid.uuid4().hex[:6]}"
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._lock:
            ref = SecretReference(
                secret_id=s_id,
                secret_name=secret_name,
                vault_path=vault_path,
                version=1,
                last_rotated_at=now_iso,
            )
            self._secrets[secret_name] = ref

        logger.info("Registered SecretReference '%s' at vault path '%s'.", secret_name, vault_path)
        return ref

    def rotate_credentials(self, secret_name: str) -> Optional[SecretReference]:
        """Rotate Vault / KMS API credentials for target secret reference."""
        now_iso = datetime.now(timezone.utc).isoformat()

        with self._lock:
            ref = self._secrets.get(secret_name)
            if not ref:
                return None

            rotate_secret(ref)
            self._last_rotation_at = now_iso

        logger.info("Rotated credentials for secret '%s' to version %d.", secret_name, ref.version)
        return ref

    # ─────────────────────────────────────────────
    # Query API
    # ─────────────────────────────────────────────

    def permissions(self, role_name: str = "QUANT_TRADER") -> List[Permission]:
        """Return list of permissions assigned to role."""
        with self._lock:
            role = self._roles.get(role_name.upper())
            return role.permissions if role else []

    def statistics(self) -> SecurityStatistics:
        """Return operational SecurityStatistics snapshot."""
        with self._lock:
            return SecurityStatistics(
                total_identities=len(self._identities),
                total_roles=len(self._roles),
                total_secrets_managed=len(self._secrets),
                active_tokens_count=len(self._identities),
                denied_access_count=self._denied_count,
                last_rotation_at=self._last_rotation_at,
            )

    # ─────────────────────────────────────────────
    # Internal Audit Helper
    # ─────────────────────────────────────────────

    def _record_security_audit(self, user_id: str, action: str, resource: str, result: str) -> None:
        """Publish security audit log to local log and global AuditEngine."""
        now_iso = datetime.now(timezone.utc).isoformat()
        evt = SecurityAuditEvent(
            event_id=f"secaudit-{uuid.uuid4().hex[:6]}",
            user_id=user_id,
            action=action,
            resource=resource,
            timestamp=now_iso,
            result=result,
        )
        self._audit_events.append(evt)

        audit_eng = _get_audit_engine()
        if audit_eng is not None:
            audit_eng.record(
                subsystem="SECURITY_ENGINE",
                event_type=f"SECURITY_ACCESS_{result}",
                severity="INFO" if result == "GRANTED" else "WARNING",
                payload=evt.to_dict(),
            )

    def _seed_default_security(self) -> None:
        """Seed default identities, roles, and secret references."""
        for r in DEFAULT_ROLES:
            self._roles[r.role_name] = r
        for u in DEFAULT_USERS:
            self._identities[u.username] = u
        for s in DEFAULT_SECRETS:
            self._secrets[s.secret_name] = s


# Shared global singleton instance
global_security_engine = SecurityEngine()
