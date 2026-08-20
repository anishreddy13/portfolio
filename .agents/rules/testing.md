---
trigger: always
title: Verification Standards
---

# Verification Standards

- Run the relevant test, type-check, lint, build, and integration commands from the terminal before reporting work as verified. Start with the narrowest affected suite, then run the repository-required checks when practical.
- Maintain complete type safety. Do not introduce `any`, unsafe casts, or suppressed type errors. Model unknown data explicitly and validate it at system boundaries.
- Log failures with actionable context: operation, stable identifiers, error message, and stack or causal error where available. Never log secrets, credentials, tokens, or unnecessary personal data.
- Every new behavior requires automated coverage at the appropriate level: unit tests for business logic, integration tests for boundaries and I/O, and UI or end-to-end coverage for user-visible flows when applicable.
- Include normal, boundary, error, and regression cases in test coverage. Update existing tests when an intentional contract change affects them.
- Do not claim verification when required commands were not run or when failures remain unresolved; report the exact command and concise failure evidence instead.
