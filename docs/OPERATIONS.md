# Enterprise Platform Operations & Runbook

## Health Probes & Monitoring
- **Readiness Probe**: `GET /api/contact` (returns HTTP 200 OK when service is ready)
- **Liveness Probe**: `GET /api/contact` (returns HTTP 200 OK)
- **Metrics Telemetry**: Exposed via `ObservabilityEngine` and `BenchmarkEngine`

## Disaster Recovery & Failover
1. **Primary Node Outage**:
   - `HighAvailabilityEngine` detects lost node heartbeat (> 5s).
   - Raft consensus triggers automatic failover to Secondary Compute Node (`node-us-east-1b`).
2. **Key Rotation & Security Event**:
   - Trigger instant Vault key rotation:
     ```python
     from security_engine import global_security_engine
     global_security_engine.rotate_credentials("ALPACA_API_SECRET")
     ```
3. **Audit Log Verification**:
   - Verify immutable SHA-256 hash chain integrity:
     ```python
     from audit_engine import global_audit_engine
     assert global_audit_engine.verify() == True
     ```
