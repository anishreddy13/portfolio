---
trigger: always
title: Architectural Guidelines
---

# Architectural Guidelines

- Keep modules cohesive and define clear ownership boundaries. A module may expose a small public interface, but consumers must not reach into its internal implementation details.
- Separate presentation, business logic, and data access. UI components handle rendering and interaction; services and domain modules own business rules; repositories, clients, and adapters own persistence and external I/O.
- Direct dependencies must flow in one direction. Do not introduce circular imports, including indirect cycles through barrel files or shared utilities.
- Prefer extending existing abstractions over creating parallel implementations. When a boundary must change, update its public contract and all direct callers deliberately.
- Do not add external packages, SDKs, hosted services, or runtime integrations unless the user explicitly requests and approves them. Use existing workspace dependencies and platform capabilities first.
- Keep configuration, environment access, and side effects at application boundaries. Core business logic should remain deterministic and independently testable.
