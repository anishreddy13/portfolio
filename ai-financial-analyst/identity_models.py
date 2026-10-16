from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class Role(str, Enum):
    ADMIN = "ADMIN"
    TRADER = "TRADER"
    RISK_MANAGER = "RISK_MANAGER"
    COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER"
    VIEWER = "VIEWER"
    SYSTEM = "SYSTEM"

class Permission(str, Enum):
    EXECUTE_TRADES = "EXECUTE_TRADES"
    VIEW_PORTFOLIO = "VIEW_PORTFOLIO"
    MANAGE_RISK = "MANAGE_RISK"
    MANAGE_COMPLIANCE = "MANAGE_COMPLIANCE"
    MANAGE_USERS = "MANAGE_USERS"
    MANAGE_ORGANIZATION = "MANAGE_ORGANIZATION"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"

class User(BaseModel):
    user_id: str
    username: str
    email: str
    password_hash: str
    organization_id: str
    roles: List[Role] = Field(default_factory=list)
    permissions: List[Permission] = Field(default_factory=list)
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class Organization(BaseModel):
    organization_id: str
    name: str
    tier: str = "ENTERPRISE"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    settings: Dict[str, Any] = Field(default_factory=dict)

class Workspace(BaseModel):
    workspace_id: str
    name: str
    owner_id: str
    organization_id: str
    is_public: bool = False
    configuration: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Session(BaseModel):
    session_id: str
    user_id: str
    token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class ApiKey(BaseModel):
    key_id: str
    user_id: str
    api_key_hash: str
    name: str
    scopes: List[str] = Field(default_factory=list)
    expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_used: Optional[datetime] = None
    is_active: bool = True

class AuthenticationStatistics(BaseModel):
    total_users: int = 0
    active_sessions: int = 0
    failed_logins: int = 0
    successful_logins: int = 0
    active_api_keys: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
