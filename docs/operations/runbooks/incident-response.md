# Incident Response Runbook

## Severity Levels
- **INFO**: Minor disruption, no impact on trading.
- **WARNING**: Elevated latency or minor error rates.
- **CRITICAL**: Significant disruption, partial trading halt.
- **FATAL**: Total system failure or data loss risk.

## Immediate Actions (CRITICAL/FATAL)
1. Engage HighAvailabilityEngine for failover.
2. Inform stakeholders via the AlertCenter.
3. Lock down trading operations if market data is corrupted.
