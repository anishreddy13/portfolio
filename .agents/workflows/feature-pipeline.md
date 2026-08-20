---
title: End-to-End Feature Pipeline
description: Automated Plan -> Implement -> Verify workflow
---

# End-to-End Feature Pipeline

Use this workflow for a feature request, enhancement, or scoped implementation.

1. **Plan — `/planner`**
   - Analyze the relevant repository areas without changing application code.
   - Create `PLAN.md` with affected files, interface updates, edge cases, implementation tasks, and test verification criteria.

2. **Review — Manager**
   - Confirm that the plan satisfies the request, follows `.agents/rules/`, and does not introduce unapproved dependencies or scope.

3. **Implement — `/implementer`**
   - Execute only the approved tasks in `PLAN.md`.
   - Make minimal changes and add or update coverage required by the plan.

4. **Verify — `/verifier`**
   - Run all relevant automated checks and browser validation for UI changes.
   - Write the results to `VERIFICATION.md`.

5. **Feedback loop**
   - If verification fails, return the exact findings to `/implementer`.
   - The implementer applies a focused fix; `/verifier` reruns the failing checks and all relevant regression checks.
   - Repeat until the verification decision is pass or the manager reports a concrete external blocker.

6. **Complete — Manager**
   - Review `VERIFICATION.md` and provide the user a concise summary of the change and validated checks.
