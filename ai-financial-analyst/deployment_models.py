from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class DeploymentEnvironment(str, Enum):
    DEVELOPMENT = "DEVELOPMENT"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"
    DISASTER_RECOVERY = "DISASTER_RECOVERY"

class DeploymentTarget(str, Enum):
    AWS_EKS = "AWS_EKS"
    GCP_GKE = "GCP_GKE"
    AZURE_AKS = "AZURE_AKS"
    ON_PREMISE = "ON_PREMISE"

class DeploymentConfiguration(BaseModel):
    config_id: str
    environment: DeploymentEnvironment
    target: DeploymentTarget
    version: str
    replicas: int = 3
    resources: Dict[str, Any] = Field(default_factory=dict)
    environment_variables: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class InfrastructureStatus(str, Enum):
    PROVISIONING = "PROVISIONING"
    HEALTHY = "HEALTHY"
    DEGRADED = "DEGRADED"
    UNHEALTHY = "UNHEALTHY"
    SCALING = "SCALING"

class DeploymentStatistics(BaseModel):
    active_deployments: int = 0
    successful_rollouts: int = 0
    failed_rollouts: int = 0
    rollbacks_triggered: int = 0
    average_deployment_time_sec: float = 0.0
    last_deployment: Optional[datetime] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
