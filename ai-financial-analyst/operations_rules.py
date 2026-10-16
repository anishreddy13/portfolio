from typing import Dict, List, Any
from datetime import datetime, timedelta
from operations_models import (
    HealthStatus, ServiceHealth, AlertSeverity, IncidentStatus, 
    DisasterRecoveryPlan, Runbook
)

def calculate_service_status(latency_ms: float, error_rate: float) -> HealthStatus:
    if error_rate > 0.05 or latency_ms > 1000:
        return HealthStatus.UNHEALTHY
    if error_rate > 0.01 or latency_ms > 500:
        return HealthStatus.DEGRADED
    return HealthStatus.HEALTHY

def evaluate_health(services: List[ServiceHealth]) -> HealthStatus:
    if not services:
        return HealthStatus.HEALTHY
        
    statuses = [s.status for s in services]
    if HealthStatus.UNHEALTHY in statuses:
        return HealthStatus.UNHEALTHY
    if HealthStatus.DEGRADED in statuses:
        return HealthStatus.DEGRADED
    return HealthStatus.HEALTHY

def generate_alert(service: str, message: str, severity: AlertSeverity) -> Dict[str, Any]:
    return {
        "source": service,
        "severity": severity,
        "message": message
    }

def classify_incident(alerts: List[Dict[str, Any]]) -> AlertSeverity:
    if any(a["severity"] == AlertSeverity.FATAL for a in alerts):
        return AlertSeverity.FATAL
    if any(a["severity"] == AlertSeverity.CRITICAL for a in alerts):
        return AlertSeverity.CRITICAL
    if any(a["severity"] == AlertSeverity.WARNING for a in alerts):
        return AlertSeverity.WARNING
    return AlertSeverity.INFO

def backup_required(last_backup: datetime, frequency_hours: int = 24) -> bool:
    if not last_backup:
        return True
    return datetime.utcnow() - last_backup > timedelta(hours=frequency_hours)

def restore_required(health: HealthStatus, duration_minutes: int) -> bool:
    if health == HealthStatus.UNHEALTHY and duration_minutes > 15:
        return True
    return False

def disaster_recovery_plan(target_env: str) -> DisasterRecoveryPlan:
    return DisasterRecoveryPlan(
        plan_id=f"dr_{target_env}",
        target_environment=target_env,
        steps=[
            "1. Isolate primary network traffic.",
            "2. Spin up standby environment.",
            "3. Restore database from latest snapshot.",
            "4. Verify application health.",
            "5. Update DNS / Ingress to route to standby."
        ]
    )

def runbook_for_incident(severity: AlertSeverity, affected_services: List[str]) -> Runbook:
    return Runbook(
        runbook_id=f"rb_{severity.value}",
        title=f"Runbook for {severity.value} Incident in {', '.join(affected_services)}",
        description="Standard operating procedure for resolving system degradation.",
        steps=[
            "1. Acknowledge incident in Ops portal.",
            "2. Review recent logs and telemetry metrics.",
            "3. Check for recent deployments or config changes.",
            "4. Determine if rollback or failover is required.",
            "5. Implement fix and monitor recovery."
        ]
    )
