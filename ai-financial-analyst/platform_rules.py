"""
platform_rules.py — Pure Platform Deployment Mathematical Rules & Algorithms

Contains pure functions for environment validation, rolling update surge calculations,
blue/green and canary release readiness checks, resource estimation, autoscaling policy evaluation,
and deployment summary aggregation.

No network, provider, or websocket calls inside this module.
"""

from __future__ import annotations

import logging
import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from platform_models import EnvironmentType, ServiceDeployment

logger = logging.getLogger("platform_rules")


def validate_environment(env_name: str) -> Tuple[bool, str]:
    """Validate target deployment environment string."""
    env = env_name.strip().upper()
    if env in [e.value for e in EnvironmentType]:
        return (True, "")
    return (False, f"Invalid environment name '{env_name}'. Must be one of {[e.value for e in EnvironmentType]}")


def deployment_plan(service_name: str, target_tag: str) -> Dict[str, Any]:
    """Generate a deployment plan specification for rolling updates."""
    plan_id = f"dplan-{uuid.uuid4().hex[:6]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "plan_id": plan_id,
        "service_name": service_name,
        "target_tag": target_tag,
        "strategy": "ROLLING_UPDATE",
        "max_surge": 1,
        "max_unavailable": 0,
        "created_at": now_iso,
    }


def rolling_update(current_replicas: int, max_surge: int = 1) -> Tuple[int, int]:
    """Calculate (max_available, max_surge_pods) for zero-downtime rolling update."""
    available = current_replicas
    surge = current_replicas + max_surge
    return (available, surge)


def blue_green_ready(green_pods_healthy: int, total_required: int) -> bool:
    """Verify if Green deployment environment is 100% healthy before traffic cutover."""
    return green_pods_healthy >= total_required and total_required > 0


def canary_ready(canary_error_rate: float, threshold: float = 0.01) -> bool:
    """Verify if Canary release error rate is below strict safety threshold (1%)."""
    return canary_error_rate <= threshold


def resource_requirements(service_count: int) -> Dict[str, str]:
    """Estimate Kubernetes cluster vCPU and RAM requirements based on running microservices."""
    vcpu = max(2, service_count * 2)
    ram_gb = max(4, service_count * 4)
    return {
        "total_vcpu": f"{vcpu} Cores",
        "total_ram": f"{ram_gb} GB",
    }


def autoscaling_policy(current_cpu: float, target_cpu: float = 70.0) -> int:
    """Calculate recommended HorizontalPodAutoscaler replica count."""
    if current_cpu <= 0:
        return 3
    ratio = current_cpu / max(1.0, target_cpu)
    recommended = int(math.ceil(3 * ratio))
    return max(3, min(15, recommended))


def deployment_summary(services: List[Any]) -> Dict[str, Any]:
    """Generate aggregate deployment health summary."""
    tot = len(services)
    running = len([s for s in services if getattr(s, "status", "") == "RUNNING"])
    total_pods = sum(getattr(s, "replica_count", 1) for s in services)

    return {
        "total_services": tot,
        "running_services": running,
        "total_running_pods": total_pods,
    }
