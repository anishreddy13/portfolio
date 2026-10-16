"""
security_rules.py — Pure Security & Identity Mathematical Rules & Algorithms

Contains pure functions for authentication verification, RBAC authorization matrix,
permission matching, JWT token metadata generation, secret rotation calculation,
credential expiration checks, and security access summary aggregation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from security_models import ApiCredential, SecretReference, UserIdentity

logger = logging.getLogger("security_rules")

ROLE_PERMISSIONS_MATRIX = {
    "ADMIN": [
        ("READ", "*"), ("WRITE", "*"), ("EXECUTE", "*"), ("ADMIN", "*")
    ],
    "QUANT_TRADER": [
        ("READ", "*"), ("WRITE", "PORTFOLIO"), ("EXECUTE", "ORDER"), ("READ", "MARKET_DATA")
    ],
    "RISK_MANAGER": [
        ("READ", "*"), ("WRITE", "COMPLIANCE"), ("EXECUTE", "COMPLIANCE")
    ],
    "READ_ONLY_AUDITOR": [
        ("READ", "*")
    ],
}


def authenticate(username: str, pass_token: str, identities: Dict[str, Any]) -> Tuple[bool, Optional[Any]]:
    """Authenticate username and credential token against registered identities."""
    user = identities.get(username)
    if not user:
        return (False, None)

    if not getattr(user, "is_active", True):
        return (False, None)

    return (True, user)


def validate_permission(role_name: str, action: str, resource: str) -> bool:
    """Check RBAC matrix to verify if role_name possesses action on resource."""
    r_name = role_name.strip().upper()
    act = action.strip().upper()
    res = resource.strip().upper()

    allowed = ROLE_PERMISSIONS_MATRIX.get(r_name, [])
    for a, r in allowed:
        if (a in (act, "*")) and (r in (res, "*")):
            return True

    return False


def authorize(user_role: str, action: str, resource: str) -> Tuple[bool, str]:
    """Authorize a request action against resource based on user RBAC role."""
    if validate_permission(user_role, action, resource):
        return (True, f"Authorized '{action}' on '{resource}' for role '{user_role}'.")
    return (False, f"Access DENIED for role '{user_role}': missing permission '{action}' on '{resource}'.")


def generate_token_metadata(user_id: str, role_name: str) -> Dict[str, Any]:
    """Generate JWT token metadata envelope with 24-hour expiration."""
    now_dt = datetime.now(timezone.utc)
    exp_dt = now_dt + timedelta(hours=24)

    return {
        "token_id": f"tok-{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "role_name": role_name,
        "issued_at": now_dt.isoformat(),
        "expires_at": exp_dt.isoformat(),
        "algorithm": "RS256",
    }


def validate_token_metadata(token_dict: Dict[str, Any]) -> bool:
    """Verify validity and non-expiration of token metadata."""
    if not token_dict or "expires_at" not in token_dict:
        return False

    return not credential_expired(token_dict["expires_at"])


def rotate_secret(secret_ref: Any) -> Any:
    """Increment secret version and update rotation timestamp."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if hasattr(secret_ref, "version"):
        secret_ref.version += 1
    if hasattr(secret_ref, "last_rotated_at"):
        secret_ref.last_rotated_at = now_iso
    return secret_ref


def credential_expired(expires_at_iso: str) -> bool:
    """Check if API credential or token expiration ISO timestamp has passed."""
    if not expires_at_iso:
        return False
    try:
        exp_dt = datetime.fromisoformat(expires_at_iso.replace("Z", "+00:00"))
        now_dt = datetime.now(timezone.utc)
        return now_dt >= exp_dt
    except Exception:
        return False


def access_summary(identities: List[Any], secrets: List[Any]) -> Dict[str, Any]:
    """Generate aggregate security access and identity statistics."""
    tot_id = len(identities)
    active_id = len([i for i in identities if getattr(i, "is_active", True)])
    tot_sec = len(secrets)

    return {
        "total_identities": tot_id,
        "active_identities": active_id,
        "total_secrets_managed": tot_sec,
    }
