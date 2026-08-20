---
title: Fix and Verify
description: Diagnose, remediate, and validate an existing defect
---

# Fix and Verify

Use this workflow for a bug, failing check, or regression.

1. `/planner` inspects the reported behavior, relevant code paths, dependencies, and existing tests; it records the suspected cause, affected files, edge cases, remediation steps, and verification criteria in `PLAN.md`.
2. The manager reviews the plan and gives `/implementer` the approved fix scope.
3. `/implementer` makes the smallest safe correction, adds a regression test, and runs focused local checks.
4. `/verifier` reproduces the original failure where possible and runs the specified test, type, lint, integration, and browser checks as applicable. It records results in `VERIFICATION.md`.
5. On failure, the manager returns the verifier's evidence to `/implementer` for another focused iteration. Do not close the workflow until the regression is covered and required checks pass.
