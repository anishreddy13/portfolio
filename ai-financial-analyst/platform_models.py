"""
platform_models.py — Data Models for Enterprise Platform Deployment Engine

Defines DeploymentEnvironment, DeploymentTarget, ServiceDeployment, PlatformConfiguration,
DeploymentStatus, and PlatformStatistics dataclasses with JSON serialization.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class EnvironmentType(str, Enum):
    PRODUCTION = "PRODUCTION"
    STAGING = "STAGING"
    CANARY = "CANARY"
    DEVELOPMENT = "DEVELOPMENT"


class PlatformType(str, Enum):
    KUBERNETES = "KUBERNETES"
    DOCKER_COMPOSE = "DOCKER_COMPOSE"
    HELM = "HELM"


@dataclass
class DeploymentEnvironment:
    """Target deployment environment specification."""
    env_name: str = "PRODUCTION"
    cluster_region: str = "us-east-1"
    k8s_namespace: str = "trading-platform"
    domain_url: str = "https://trading.enterprise.com"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "env_name": self.env_name,
            "cluster_region": self.cluster_region,
            "k8s_namespace": self.k8s_namespace,
            "domain_url": self.domain_url,
        }


@dataclass
class DeploymentTarget:
    """Target platform infrastructure specification."""
    target_id: str
    target_name: str
    platform_type: str = "KUBERNETES"
    region: str = "us-east-1"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_id": self.target_id,
            "target_name": self.target_name,
            "platform_type": self.platform_type,
            "region": self.region,
        }


@dataclass
class ServiceDeployment:
    """Microservice deployment state and pod replica envelope."""
    service_id: str
    service_name: str
    image_tag: str = "v1.28.0"
    replica_count: int = 3
    desired_replicas: int = 3
    cpu_limit: str = "500m"
    memory_limit: str = "1Gi"
    status: str = "RUNNING"
    updated_at: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "service_id": self.service_id,
            "service_name": self.service_name,
            "image_tag": self.image_tag,
            "replica_count": self.replica_count,
            "desired_replicas": self.desired_replicas,
            "cpu_limit": self.cpu_limit,
            "memory_limit": self.memory_limit,
            "status": self.status,
            "updated_at": self.updated_at,
        }


@dataclass
class PlatformConfiguration:
    """Platform deployment configuration parameters."""
    config_id: str
    env_name: str = "PRODUCTION"
    enable_hpa: bool = True
    min_replicas: int = 3
    max_replicas: int = 15
    target_cpu_utilization_pct: int = 70

    def to_dict(self) -> Dict[str, Any]:
        return {
            "config_id": self.config_id,
            "env_name": self.env_name,
            "enable_hpa": self.enable_hpa,
            "min_replicas": self.min_replicas,
            "max_replicas": self.max_replicas,
            "target_cpu_utilization_pct": self.target_cpu_utilization_pct,
        }


@dataclass
class DeploymentStatus:
    """Overall platform deployment health snapshot."""
    status_id: str
    active_environment: str
    total_services: int
    healthy_pods_count: int
    total_pods_count: int
    last_deployment_at: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status_id": self.status_id,
            "active_environment": self.active_environment,
            "total_services": self.total_services,
            "healthy_pods_count": self.healthy_pods_count,
            "total_pods_count": self.total_pods_count,
            "last_deployment_at": self.last_deployment_at,
        }


@dataclass
class PlatformStatistics:
    """Operational statistics for PlatformEngine."""
    total_deployments: int = 0
    active_services_count: int = 0
    total_running_pods: int = 0
    min_hpa_replicas: int = 3
    max_hpa_replicas: int = 15
    cluster_utilization_pct: float = 42.5

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_deployments": self.total_deployments,
            "active_services_count": self.active_services_count,
            "total_running_pods": self.total_running_pods,
            "min_hpa_replicas": self.min_hpa_replicas,
            "max_hpa_replicas": self.max_hpa_replicas,
            "cluster_utilization_pct": round(self.cluster_utilization_pct, 1),
        }
