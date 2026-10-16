from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class HealthStatus(str, Enum):
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"
    MAINTENANCE = "MAINTENANCE"

class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    FATAL = "FATAL"

class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    IDENTIFIED = "IDENTIFIED"
    MONITORING = "MONITORING"
    RESOLVED = "RESOLVED"

class ServiceHealth(BaseModel):
    service_id: str
    name: str
    status: HealthStatus
    uptime_percentage: float = 100.0
    latency_ms: float = 0.0
    error_rate: float = 0.0
    last_check: datetime = Field(default_factory=datetime.utcnow)

class SystemHealth(BaseModel):
    overall_status: HealthStatus
    services: List[ServiceHealth] = Field(default_factory=list)
    active_alerts_count: int = 0
    open_incidents_count: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Alert(BaseModel):
    alert_id: str
    source: str
    severity: AlertSeverity
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class Incident(BaseModel):
    incident_id: str
    title: str
    status: IncidentStatus
    severity: AlertSeverity
    affected_services: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None

class BackupSnapshot(BaseModel):
    backup_id: str
    type: str = "FULL"
    status: str = "COMPLETED"
    size_bytes: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    location: str

class DisasterRecoveryPlan(BaseModel):
    plan_id: str
    target_environment: str
    steps: List[str] = Field(default_factory=list)
    estimated_rto_minutes: int = 60
    estimated_rpo_minutes: int = 15

class Runbook(BaseModel):
    runbook_id: str
    title: str
    description: str
    steps: List[str] = Field(default_factory=list)

class OperationsStatistics(BaseModel):
    total_alerts_24h: int = 0
    total_incidents_24h: int = 0
    mttr_minutes: float = 0.0
    successful_backups: int = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)
