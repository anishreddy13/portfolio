# Production Security & Access Control Manifests

This directory contains hardened production security manifests for the **Enterprise AI Financial Analyst Trading Platform**.

## Security Artifacts

- `rbac.yaml`: Granular Role-Based Access Control (ServiceAccount, Role, RoleBinding, ClusterRole, ClusterRoleBinding).
- `networkpolicy.yaml`: Zero-trust network segmentation blocking unapproved ingress/egress.
- `podsecurity.yaml`: Hardened PodSecurityContext enforcing non-root execution (`runAsNonRoot: true`) and read-only root filesystems.
- `serviceaccount.yaml`: ServiceAccount definition with Vault/AWS IAM role annotations (`IRSA`).
- `secretstore.yaml`: ExternalSecrets SecretStore integrating with HashiCorp Vault.

## Application Command
```bash
kubectl apply -f deployment/security/
```
