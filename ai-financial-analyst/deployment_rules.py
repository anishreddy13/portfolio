from typing import Dict, List, Any
from deployment_models import DeploymentEnvironment, DeploymentConfiguration, InfrastructureStatus

def validate_environment(env: str) -> bool:
    try:
        DeploymentEnvironment(env)
        return True
    except ValueError:
        return False

def validate_configuration(config: DeploymentConfiguration) -> bool:
    if config.replicas < 1:
        return False
    if config.environment == DeploymentEnvironment.PRODUCTION and config.replicas < 3:
        return False
    if not config.version:
        return False
    return True

def deployment_health(metrics: Dict[str, Any]) -> InfrastructureStatus:
    error_rate = metrics.get("error_rate", 0.0)
    cpu_usage = metrics.get("cpu_usage", 0.0)
    memory_usage = metrics.get("memory_usage", 0.0)
    
    if error_rate > 0.05 or cpu_usage > 0.9 or memory_usage > 0.9:
        return InfrastructureStatus.UNHEALTHY
    if error_rate > 0.01 or cpu_usage > 0.7 or memory_usage > 0.8:
        return InfrastructureStatus.DEGRADED
    return InfrastructureStatus.HEALTHY

def rollback_required(status: InfrastructureStatus, duration_minutes: int) -> bool:
    if status == InfrastructureStatus.UNHEALTHY and duration_minutes > 5:
        return True
    return False

def generate_deployment_manifest(config: DeploymentConfiguration) -> str:
    return f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: enterprise-platform
  labels:
    env: {config.environment.value}
spec:
  replicas: {config.replicas}
  selector:
    matchLabels:
      app: enterprise-platform
  template:
    metadata:
      labels:
        app: enterprise-platform
    spec:
      containers:
      - name: backend
        image: enterprise/backend:{config.version}
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
"""

def verify_dependencies(deps: List[str]) -> bool:
    return len(deps) > 0 and all(dep.strip() != "" for dep in deps)
