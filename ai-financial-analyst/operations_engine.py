from typing import Dict, List, Optional
from datetime import datetime
import logging
import secrets
from types import SimpleNamespace

from operations_models import (
    SystemHealth, ServiceHealth, Alert, Incident, BackupSnapshot,
    DisasterRecoveryPlan, Runbook, OperationsStatistics, HealthStatus,
    AlertSeverity, IncidentStatus
)
from operations_rules import (
    evaluate_health, calculate_service_status, generate_alert,
    classify_incident, backup_required, restore_required,
    disaster_recovery_plan, runbook_for_incident
)

from observability_engine import global_observability_engine
from incident_engine import global_incident_engine
from ha_engine import global_high_availability_engine as global_ha_engine
from audit_engine import global_audit_engine
from security_engine import global_security_engine

logger = logging.getLogger("operations_engine")

class OperationsEngine:
    """Enterprise Site Reliability Engineering (SRE) and Operations Layer"""
    
    def __init__(self):
        self._services: Dict[str, ServiceHealth] = {}
        self._alerts: Dict[str, Alert] = {}
        self._incidents: Dict[str, Incident] = {}
        self._backups: Dict[str, BackupSnapshot] = {}
        
        self.stats = OperationsStatistics()
        
        # Initialize default services
        self._init_services(["API_GATEWAY", "TRADING_ENGINE", "MARKET_DATA", "PORTFOLIO_MANAGER"])
        logger.info("OperationsEngine initialized.")
        
    def _init_services(self, service_names: List[str]):
        for name in service_names:
            self._services[name] = ServiceHealth(
                service_id=f"svc_{name.lower()}",
                name=name,
                status=HealthStatus.HEALTHY
            )

    def system_health(self) -> SystemHealth:
        services = list(self._services.values())
        overall_status = evaluate_health(services)
        
        active_alerts = [a for a in self._alerts.values() if a.is_active]
        open_incidents = [i for i in self._incidents.values() if i.status != IncidentStatus.RESOLVED]
        
        return SystemHealth(
            overall_status=overall_status,
            services=services,
            active_alerts_count=len(active_alerts),
            open_incidents_count=len(open_incidents)
        )

    def service_health(self, service_name: str) -> Optional[ServiceHealth]:
        return self._services.get(service_name)

    def generate_system_alert(self, source: str, severity: AlertSeverity, message: str) -> Alert:
        alert_id = f"alrt_{secrets.token_hex(4)}"
        alert_dict = generate_alert(source, message, severity)
        
        alert = Alert(
            alert_id=alert_id,
            source=alert_dict["source"],
            severity=alert_dict["severity"],
            message=alert_dict["message"]
        )
        self._alerts[alert_id] = alert
        self.stats.total_alerts_24h += 1
        
        global_observability_engine.record("OPERATIONS", "alert_generated", 1.0)
        
        # Promote critical alerts to incidents automatically
        if severity in [AlertSeverity.CRITICAL, AlertSeverity.FATAL]:
            self._create_incident(alert)
            
        return alert

    def _create_incident(self, alert: Alert) -> Incident:
        inc_id = f"inc_{secrets.token_hex(4)}"
        incident = Incident(
            incident_id=inc_id,
            title=f"Auto-Incident: {alert.message}",
            status=IncidentStatus.OPEN,
            severity=alert.severity,
            affected_services=[alert.source]
        )
        self._incidents[inc_id] = incident
        self.stats.total_incidents_24h += 1
        
        _alert_obj = SimpleNamespace(
            subsystem=alert.source,
            alert_id=inc_id,
            severity=alert.severity.value,
            title=f"Auto-Incident: {alert.message}",
            description=alert.message
        )
        global_incident_engine.ingest_alert(_alert_obj)
        
        return incident

    def alerts(self) -> List[Alert]:
        return list(self._alerts.values())

    def incidents(self) -> List[Incident]:
        return list(self._incidents.values())

    def create_backup(self) -> BackupSnapshot:
        bkp_id = f"bkp_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        snapshot = BackupSnapshot(
            backup_id=bkp_id,
            location=f"s3://enterprise-backups/{bkp_id}.tar.gz",
            size_bytes=1024 * 1024 * 500 # Simulated 500MB
        )
        self._backups[bkp_id] = snapshot
        self.stats.successful_backups += 1
        global_audit_engine.record("OPERATIONS", "BACKUP_CREATED", payload={"backup_id": bkp_id})
        return snapshot

    def list_backups(self) -> List[BackupSnapshot]:
        return list(self._backups.values())

    def restore(self, backup_id: str) -> bool:
        if backup_id not in self._backups:
            return False
        global_ha_engine.failover("restore_operation")
        global_audit_engine.record("OPERATIONS", "SYSTEM_RESTORED", payload={"backup_id": backup_id})
        return True

    def get_disaster_recovery_plan(self, target_env: str = "AWS_DR_REGION") -> DisasterRecoveryPlan:
        return disaster_recovery_plan(target_env)

    def runbooks(self) -> List[Runbook]:
        return [
            runbook_for_incident(AlertSeverity.WARNING, ["API_GATEWAY"]),
            runbook_for_incident(AlertSeverity.CRITICAL, ["DATABASE"]),
            runbook_for_incident(AlertSeverity.FATAL, ["CORE_NETWORK"])
        ]

    def statistics(self) -> OperationsStatistics:
        self.stats.timestamp = datetime.utcnow()
        return self.stats

global_operations_engine = OperationsEngine()
