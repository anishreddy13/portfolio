# Deployment Runbook

## Continuous Deployment
Changes to `main` are automatically built into Docker images and rolled out to Kubernetes via GitHub Actions.

## Manual Rollback
If the DeploymentEngine detects failures, execute:
```bash
python manage.py rollback --config-id=<CONFIG_ID>
```
