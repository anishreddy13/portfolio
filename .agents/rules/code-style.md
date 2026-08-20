---
trigger: always
title: Code Quality & Style
---

# Code Quality & Style

- Follow the repository's existing naming and layout conventions. Use lowercase kebab-case for files unless the surrounding framework convention requires a different form; keep component and type names descriptive and PascalCase.
- Use strict, explicit types at public boundaries. Prefer precise domain types, discriminated unions, and narrow interfaces over broad object shapes or implicit behavior.
- Document public interfaces, exported functions, configuration contracts, and non-obvious decisions with concise comments that explain intent, constraints, or usage. Do not duplicate self-evident code in comments.
- Keep edits focused on the stated task. Avoid unrelated formatting, opportunistic refactors, generated-file edits, and broad renames.
- Preserve a minimal diff footprint: reuse local utilities and patterns, remove dead code introduced by the change, and keep imports ordered according to repository tooling.
- Write readable control flow with clear error handling. Use constants for meaningful repeated values and avoid hidden side effects.
