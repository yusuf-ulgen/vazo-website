# Vazo E-Commerce — AI Development Contract

This file defines the mandatory operational constraints and engineering standards for all AI coding agents working in this repository.

## Permanent Operating Rules

1. **Understand Before Modifying**: Restate and scope tasks carefully. Never broaden scope without explicit instruction.
2. **Inspect Existing Code**: Search and examine current implementations before editing or adding files.
3. **Preserve Working Functionality**: Avoid opportunistic or stylistic refactors of functioning code.
4. **No Silent Architectural Shifts**: Do not introduce backends, state libraries, or UI frameworks without an approved ADR.
5. **Hard File Size Limit (600 Lines)**: No manually maintained source file may exceed 600 lines (target <= 350 lines). Decompose logically by concern.
6. **Zero Secrets in Git**: Never commit `.env` files or API secrets. Never store server credentials in `VITE_*` variables.
7. **Design Token Compliance**: Use semantic tokens from `design-tokens/` and Tailwind classes. Never hardcode arbitrary hex colors in components.
8. **Shared Catalog Architecture**: Maintain unified product entities with dual retail (B2C) and wholesale (B2B) purchasing contexts.
9. **Admin Panel Action Contract**: All admin controls must be either functional or explicitly marked disabled pending backend integration.
10. **Verify Before Completion**: Run `npm run verify` and inspect results before declaring a task complete.

## Canonical Documentation References

@./docs/INSTRUCTIONS.md
@./docs/ARCHITECTURE.md
@./docs/DELIVERY.md
