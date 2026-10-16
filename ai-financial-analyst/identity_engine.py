from typing import Dict, List, Optional
from datetime import datetime
import logging
from identity_models import (
    User, Organization, Workspace, Role, Permission, Session, ApiKey, AuthenticationStatistics
)
from identity_rules import (
    hash_password, validate_credentials, create_session, validate_session,
    has_permission, authorize, generate_api_key, revoke_api_key
)
from persistence_manager import global_persistence_manager
from audit_engine import global_audit_engine
from security_engine import global_security_engine

logger = logging.getLogger("identity_engine")

class IdentityEngine:
    """Enterprise Identity & Access Management Layer"""
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.organizations: Dict[str, Organization] = {}
        self.workspaces: Dict[str, Workspace] = {}
        self.sessions: Dict[str, Session] = {}
        self.api_keys: Dict[str, ApiKey] = {}
        
        self.stats = AuthenticationStatistics()
        self._load_from_persistence()
        
    def _load_from_persistence(self):
        saved_users = global_persistence_manager.load_users()
        for u in saved_users:
            self.users[u.user_id] = u
            
        saved_orgs = global_persistence_manager.load_organizations()
        for o in saved_orgs:
            self.organizations[o.organization_id] = o
            
        saved_workspaces = global_persistence_manager.load_workspaces()
        for w in saved_workspaces:
            self.workspaces[w.workspace_id] = w
            
    def _save_to_persistence(self):
        global_persistence_manager.save_users(list(self.users.values()))
        global_persistence_manager.save_organizations(list(self.organizations.values()))
        global_persistence_manager.save_workspaces(list(self.workspaces.values()))

    def create_user(self, username: str, email: str, password: str, organization_id: str, roles: List[Role] = None) -> User:
        user_id = f"usr_{len(self.users)+1}"
        hashed = hash_password(password)
        user = User(
            user_id=user_id,
            username=username,
            email=email,
            password_hash=hashed,
            organization_id=organization_id,
            roles=roles or [Role.VIEWER],
            permissions=[Permission.VIEW_PORTFOLIO]
        )
        self.users[user_id] = user
        self.stats.total_users += 1
        
        global_audit_engine.log_event("IAM", "USER_CREATED", {"user_id": user_id, "username": username})
        self._save_to_persistence()
        return user

    def authenticate(self, username: str, password: str, ip_address: str = None) -> Optional[Session]:
        user = next((u for u in self.users.values() if u.username == username), None)
        if not user or not validate_credentials(user, password):
            self.stats.failed_logins += 1
            global_security_engine.log_security_event("LOGIN_FAILED", "HIGH", {"username": username, "ip": ip_address})
            return None
            
        session = create_session(user.user_id, ip_address)
        self.sessions[session.token] = session
        
        user.last_login = datetime.utcnow()
        self.stats.successful_logins += 1
        self.stats.active_sessions = len([s for s in self.sessions.values() if validate_session(s)])
        
        global_audit_engine.log_event("IAM", "USER_LOGIN", {"user_id": user.user_id, "session_id": session.session_id})
        self._save_to_persistence()
        return session

    def logout(self, token: str) -> bool:
        if token in self.sessions:
            session = self.sessions.pop(token)
            self.stats.active_sessions = len([s for s in self.sessions.values() if validate_session(s)])
            global_audit_engine.log_event("IAM", "USER_LOGOUT", {"user_id": session.user_id})
            return True
        return False

    def create_workspace(self, name: str, owner_id: str, organization_id: str) -> Workspace:
        workspace_id = f"ws_{len(self.workspaces)+1}"
        workspace = Workspace(
            workspace_id=workspace_id,
            name=name,
            owner_id=owner_id,
            organization_id=organization_id
        )
        self.workspaces[workspace_id] = workspace
        global_audit_engine.log_event("IAM", "WORKSPACE_CREATED", {"workspace_id": workspace_id, "owner_id": owner_id})
        self._save_to_persistence()
        return workspace

    def assign_role(self, admin_token: str, target_user_id: str, role: Role) -> bool:
        admin_session = self.sessions.get(admin_token)
        if not admin_session or not validate_session(admin_session):
            return False
            
        admin = self.users.get(admin_session.user_id)
        if not admin or not has_permission(admin, Permission.MANAGE_USERS):
            global_security_engine.log_security_event("UNAUTHORIZED_ROLE_ASSIGNMENT", "HIGH", {"admin_id": admin.user_id if admin else "unknown"})
            return False
            
        target_user = self.users.get(target_user_id)
        if target_user and role not in target_user.roles:
            target_user.roles.append(role)
            global_audit_engine.log_event("IAM", "ROLE_ASSIGNED", {"user_id": target_user_id, "role": role.value})
            self._save_to_persistence()
            return True
        return False

    def grant_permission(self, admin_token: str, target_user_id: str, permission: Permission) -> bool:
        admin_session = self.sessions.get(admin_token)
        if not admin_session or not validate_session(admin_session):
            return False
            
        admin = self.users.get(admin_session.user_id)
        if not admin or not has_permission(admin, Permission.MANAGE_USERS):
            return False
            
        target_user = self.users.get(target_user_id)
        if target_user and permission not in target_user.permissions:
            target_user.permissions.append(permission)
            global_audit_engine.log_event("IAM", "PERMISSION_GRANTED", {"user_id": target_user_id, "permission": permission.value})
            self._save_to_persistence()
            return True
        return False
        
    def revoke_permission(self, admin_token: str, target_user_id: str, permission: Permission) -> bool:
        admin_session = self.sessions.get(admin_token)
        if not admin_session or not validate_session(admin_session):
            return False
            
        admin = self.users.get(admin_session.user_id)
        if not admin or not has_permission(admin, Permission.MANAGE_USERS):
            return False
            
        target_user = self.users.get(target_user_id)
        if target_user and permission in target_user.permissions:
            target_user.permissions.remove(permission)
            global_audit_engine.log_event("IAM", "PERMISSION_REVOKED", {"user_id": target_user_id, "permission": permission.value})
            self._save_to_persistence()
            return True
        return False

    def generate_api_key(self, token: str, name: str, scopes: List[str] = None) -> Optional[str]:
        session = self.sessions.get(token)
        if not session or not validate_session(session):
            return None
            
        api_key, raw_key = generate_api_key(session.user_id, name, scopes)
        self.api_keys[api_key.key_id] = api_key
        self.stats.active_api_keys += 1
        global_audit_engine.log_event("IAM", "API_KEY_GENERATED", {"user_id": session.user_id, "key_id": api_key.key_id})
        self._save_to_persistence()
        return raw_key

    def validate_api_key(self, raw_key: str) -> Optional[User]:
        import hashlib
        hashed_key = hashlib.sha256(raw_key.encode()).hexdigest()
        
        api_key = next((k for k in self.api_keys.values() if k.api_key_hash == hashed_key and k.is_active), None)
        if not api_key:
            return None
            
        user = self.users.get(api_key.user_id)
        if not user or not user.is_active:
            return None
            
        api_key.last_used = datetime.utcnow()
        return user

    def statistics(self) -> AuthenticationStatistics:
        self.stats.timestamp = datetime.utcnow()
        return self.stats

global_identity_engine = IdentityEngine()
