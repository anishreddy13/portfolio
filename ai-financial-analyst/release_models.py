from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class ReleaseStatus(str, Enum):
    DRAFT = "DRAFT"
    VALIDATING = "VALIDATING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RELEASED = "RELEASED"

class ReleaseChecklist(BaseModel):
    unit_tests_pass: bool = False
    integration_tests_pass: bool = False
    build_successful: bool = False
    documentation_updated: bool = False
    security_audit_passed: bool = False
    demo_data_verified: bool = False

class VersionManifest(BaseModel):
    version: str = "1.0.0"
    codename: str = "Genesis"
    release_date: Optional[datetime] = None
    components: Dict[str, str] = Field(default_factory=dict)
    commit_hash: str = "HEAD"

class DemoWorkspace(BaseModel):
    workspace_name: str = "Demo Workspace"
    panels: List[str] = Field(default_factory=list)

class SamplePortfolio(BaseModel):
    portfolio_name: str = "Demo Portfolio"
    positions: List[Dict[str, Any]] = Field(default_factory=list)
    cash_balance: float = 1000000.0

class ReleaseInformation(BaseModel):
    release_id: str
    manifest: VersionManifest
    checklist: ReleaseChecklist
    status: ReleaseStatus = ReleaseStatus.DRAFT
    release_notes: str = ""

class ReleaseStatistics(BaseModel):
    total_subsystems: int = 40
    total_backend_modules: int = 150
    total_frontend_panels: int = 80
    total_react_hooks: int = 40
    total_deployment_artifacts: int = 25
    timestamp: datetime = Field(default_factory=datetime.utcnow)
