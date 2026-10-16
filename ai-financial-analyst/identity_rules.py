import hashlib
import secrets
from typing import List, Tuple
from datetime import datetime, timedelta
from identity_models import User, Session, Role, Permission, ApiKey

def hash_password(password: str) -> str:
    salt = "enterprise_salt_"
    return hashlib.sha256((password + salt).encode()).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    return hash_password(password) == hashed_password

def validate_credentials(user: User, password: str) -> bool:
    if not user.is_active:
        return False
    return verify_password(password, user.password_hash)

def create_session(user_id: str, ip_address: str = None, user_agent: str = None, duration_hours: int = 24) -> Session:
    token = secrets.token_urlsafe(32)
    return Session(
        session_id=f"sess_{secrets.token_hex(8)}",
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=duration_hours),
        ip_address=ip_address,
        user_agent=user_agent
    )

def validate_session(session: Session) -> bool:
    if not session:
        return False
    if session.expires_at < datetime.utcnow():
        return False
    return True

def has_permission(user: User, required_permission: Permission) -> bool:
    if Permission.SYSTEM_ADMIN in user.permissions:
        return True
    return required_permission in user.permissions

def authorize(user: User, required_permissions: List[Permission]) -> bool:
    if not user.is_active:
        return False
    if Permission.SYSTEM_ADMIN in user.permissions:
        return True
    return all(perm in user.permissions for perm in required_permissions)

def generate_api_key(user_id: str, name: str, scopes: List[str] = None) -> Tuple[ApiKey, str]:
    raw_key = secrets.token_urlsafe(32)
    hashed_key = hashlib.sha256(raw_key.encode()).hexdigest()
    api_key = ApiKey(
        key_id=f"key_{secrets.token_hex(8)}",
        user_id=user_id,
        api_key_hash=hashed_key,
        name=name,
        scopes=scopes or []
    )
    return api_key, raw_key

def revoke_api_key(api_key: ApiKey) -> ApiKey:
    api_key.is_active = False
    return api_key
