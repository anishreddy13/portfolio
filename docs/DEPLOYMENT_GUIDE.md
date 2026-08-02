# Enterprise Platform Deployment Guide

## Deployment Options

### 1. Docker Compose (Local & Staging Containers)
```bash
docker-compose -f deployment/docker/docker-compose.yml up -d --build
```
This starts:
- Next.js Web Dashboard on `http://localhost:3000`
- Redis L2 MarketCache on `localhost:6379`

### 2. Kubernetes Cluster Deployment
Deploy production manifests to `trading-platform` namespace:
```bash
kubectl apply -f deployment/kubernetes/configmap.yaml
kubectl apply -f deployment/kubernetes/secret.yaml
kubectl apply -f deployment/kubernetes/deployment.yaml
kubectl apply -f deployment/kubernetes/service.yaml
kubectl apply -f deployment/kubernetes/hpa.yaml
kubectl apply -f deployment/kubernetes/ingress.yaml
```

### 3. Kubernetes Security Hardening
Apply RBAC, NetworkPolicy, PodSecurityContext, and HashiCorp Vault SecretStore:
```bash
kubectl apply -f deployment/security/
```

### 4. Helm Package Deployment
```bash
helm install trading-platform deployment/helm/
```
