---
name: vazo-project-guardian
description: >
  Enforces the Vazo Website architecture, file-size rules, design-token
  contract, retail/wholesale boundaries, admin architecture, repository
  safety and pre-completion verification. Activate when implementing,
  refactoring, reviewing or debugging project code.
---

# Vazo Project Guardian

This skill provides mandatory architectural guardrails, pre-flight analysis, and post-flight verification for the **Vazo E-Commerce Platform**.

## 1. Pre-Flight Protocol (Before Code Changes)

Before writing or modifying any code in this repository:

1. **Read `GEMINI.md` and Relevant Documentation**:
   - Storefront tasks: Read `docs/FRONTEND.md` and `docs/ECOMMERCE.md`.
   - Admin tasks: Read `docs/ADMIN.md` and `docs/SECURITY.md`.
   - Architectural / structural tasks: Read `docs/ARCHITECTURE.md` and `docs/ADR.md`.
2. **Inspect Existing Implementations**:
   - Search the repository for existing components, hooks, and types before writing new ones.
   - Do not duplicate existing domain models or UI primitives.
3. **Verify Architectural Boundaries**:
   - `src/site/` and `src/admin/` must not import from each other.
   - Use `src/entities/` for domain types and `src/shared/` for reusable utilities and UI.
4. **Design Token Check**:
   - Ensure all visual styling uses Tailwind semantic classes or CSS variables referencing `design-tokens/tokens/`.
   - Reject arbitrary inlined hex color values in component JSX.
5. **Dependency Evaluation**:
   - Avoid installing new npm packages unless an ADR is established and no native/CSS solution exists.

---

## 2. Post-Flight Protocol (Before Declaring Completion)

After implementing changes, execute the verification suite:

```bash
npm run verify
```

Verify each checklist item:
- [ ] **Repository Safety**: `npm run check:repo` passes with zero secret or sensitive file detections.
- [ ] **File Size Audit**: `npm run check:lines` passes with all source files <= 600 lines (target <= 350 lines).
- [ ] **Linting**: `npm run lint` passes with 0 errors.
- [ ] **Type Checking**: `npm run typecheck` passes with 0 TypeScript compiler diagnostics.
- [ ] **Unit & Contract Tests**: `npm run test` executes and passes all test suites.
- [ ] **Production Build**: `npm run build` generates the production bundle without errors.
- [ ] **Git Cleanliness**: `git status --short` and `git diff` confirm no accidental files, `.env` leaks, or unrelated formatting regressions.
