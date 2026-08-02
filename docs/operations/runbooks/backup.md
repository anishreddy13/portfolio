# Backup Runbook

## Automated Backups
The system performs automated full snapshots every 24 hours via the OperationsEngine.

## Manual Trigger
```bash
python manage.py trigger-backup --type=FULL
```

## Verification
Ensure the backup file is present in the S3 bucket `s3://enterprise-backups/` and matches expected sizes.
