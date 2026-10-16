"""
security_models.py — Data Models for Enterprise Security & Identity Engine

Defines UserIdentity, Role, Permission, ApiCredential, SecretReference,
AccessPolicy, SecurityAuditEvent, and SecurityStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class ActionType(str, Enum):
    READ = "READ"
    WRITE = "WRITE"
    EXECUTE = "EXECUTE"
    ADMIN = "ADMIN"


class ResourceType(str, Enum):
    MARKET_DATA = "MARKET_DATA"
    PORTFOLIO = "PORTFOLIO"
    ORDER = "ORDER"
    COMPLIANCE = "COMPLIANCE"
    AUDIT = "AUDIT"
    SECURITY = "SECURITY"


@dataclass
class Permission:
    """RBAC Permission granule envelope."""
    perm_id: str
    action: str = "READ"
    resource: str = "PORTFOLIO"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "perm_id": self.perm_id,
            "action": self.action,
            "resource": self.resource,
        }


@dataclass
class Role:
    """RBAC Role envelope containing assigned permissions."""
    role_id: str
    role_name: str
    permissions: List[Permission] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "role_id": self.role_id,
            "role_name": self.role_name,
            "permissions": [p.to_dict() for p in self.permissions],
        }


@dataclass
class UserIdentity:
    """Authenticated user or service principal identity."""
    user_id: str
    username: str
    email: str
    role_name: str = "QUANT_TRADER"
    is_active: bool = True
    created_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "username": self.username,
            "email": self.email,
            "role_name": self.role_name,
            "is_active": self.is_active,
            "created_at": self.created_at,
        }


@dataclass
class ApiCredential:
    """API Credential metadata envelope."""
    cred_id: str
    service_name: str
    key_id: str
    expires_at: str
    is_active: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cred_id": self.cred_id,
            "service_name": self.service_name,
            "key_id": self.key_id,
            "expires_at": self.expires_at,
            "is_active": self.is_active,
        }


@dataclass
class SecretReference:
    """Vault / KMS Secret reference envelope."""
    secret_id: str
    secret_name: str
    vault_path: str = "secret/data/trading/broker-keys"
    version: int = 1
    last_rotated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "secret_id": self.secret_id,
            "secret_name": self.secret_name,
            "vault_path": self.vault_path,
            "version": self.version,
            "last_rotated_at": self.last_rotated_at,
        }


@dataclass
class AccessPolicy:
    """Fine-grained access policy rule."""
    policy_id: str
    policy_name: str
    allowed_roles: List[str] = field(default_factory=lambda: ["ADMIN", "QUANT_TRADER"])
    denied_resources: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "policy_id": self.policy_id,
            "policy_name": self.policy_name,
            "allowed_roles": self.allowed_roles,
            "denied_resources": self.denied_resources,
        }


@dataclass
class SecurityAuditEvent:
    """Security audit event envelope for authentication & authorization logs."""
    event_id: str
    user_id: str
    action: str
    resource: str
    timestamp: str
    result: str = "GRANTED"  # GRANTED or DENIED

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "user_id": self.user_id,
            "action": self.action,
            "resource": self.resource,
            "timestamp": self.timestamp,
            "result": self.result,
        }


@dataclass
class SecurityStatistics:
    """Operational statistics for SecurityEngine."""
    total_identities: int = 0
    total_roles: int = 0
    total_secrets_managed: int = 0
    active_tokens_count: int = 0
    denied_access_count: int = 0
    last_rotation_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_identities": self.total_identities,
            "total_roles": self.total_roles,
            "total_secrets_managed": self.total_secrets_managed,
            "active_tokens_count": self.active_tokens_count,
            "denied_access_count": self.denied_access_count,
            "last_rotation_at": self.last_rotation_at,
        }
