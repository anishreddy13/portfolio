# Restore Runbook

## Prerequisites
- Target environment must be completely isolated.
- Ensure the backup ID is verified.

## Procedure
1. Halt all inbound traffic to the TradingEngine.
2. Trigger the restore command:
```bash
python manage.py trigger-restore --backup-id=<BKP_ID>
```
3. Wait for database rehydration.
4. Verify PortfolioManager balances against pre-incident states.
5. Restore traffic via Ingress router.
