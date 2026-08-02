# Enterprise Platform Deployment Artifacts

This directory contains production-ready containerization and cluster orchestration artifacts for the **Enterprise AI Financial Analyst Trading Platform**.

## Contents

- `docker/`: Dockerfile and docker-compose.yml for local or containerized execution.
- `kubernetes/`: Kubernetes production manifests:
  - `deployment.yaml` — Pod replica management
  - `service.yaml` — ClusterIP service definition
  - `hpa.yaml` — HorizontalPodAutoscaler (3 -> 15 replicas @ 70% CPU)
  - `configmap.yaml` & `secret.yaml` — Environment configuration and secrets
  - `ingress.yaml` — NGINX TLS Ingress controller
- `helm/`: Helm chart package skeleton (`Chart.yaml` and `values.yaml`).

## Deployment Commands

### Docker Compose
```bash
docker-compose -f deployment/docker/docker-compose.yml up -d
```

### Kubernetes
```bash
kubectl apply -f deployment/kubernetes/
```

### Helm
```bash
helm install trading-platform deployment/helm/
```
