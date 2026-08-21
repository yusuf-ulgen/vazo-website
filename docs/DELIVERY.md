# Delivery, Quality Assurance & Verification Contract

This document defines the delivery pipeline, automated checks, and pre-completion verification standards for the **Vazo E-Commerce Platform**.

---

## 1. Automated Verification Pipeline

Every feature, refactor, or architectural change must pass the full verification suite before completion:

```bash
npm run verify
```

### Verification Suite Breakdown

| Command | Check | Failure Condition |
| :--- | :--- | :--- |
| `npm run check:repo` | Repository safety & secret scanner | Uncommitted `.env` files, tracked secrets, or sensitive certificates |
| `npm run check:lines` | Source file line limit audit | Any manually maintained source file exceeding 600 lines |
| `npm run lint` | ESLint static code analysis | Any syntax error, broken hook rule, or unused variable |
| `npm run typecheck` | Strict TypeScript compiler | Any type mismatch, missing property, or unsafe type assertion |
| `npm run test` | Vitest test suite | Any failing unit, domain, or component contract test |
| `npm run build` | Vite production bundler | Any compilation error, circular dependency, or bundle failure |

---

## 2. Pre-Commit Quality Gates

Before committing code:
1. **Line Length Gate**: Verify that all modified files stay under 600 lines (target `<= 350 lines`).
2. **Secret Scan Gate**: Verify that no credentials, tokens, or `.env` files are staged.
3. **Clean Git Diff**: Run `git status --short` and `git diff` to ensure no stray files or unwanted formatting artifacts are staged.

---

## 3. Continuous Integration (CI) Workflow

The GitHub Actions CI pipeline (`.github/workflows/ci.yml`) runs automatically on all pull requests and pushes to `main`:

```yaml
name: CI Verification Pipeline
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run check:repo
      - run: npm run check:lines
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

---

## 4. AI Agent Verification Protocol

Before declaring any task complete, an AI coding agent must:
1. Run `npm run verify`.
2. Inspect the raw terminal output.
3. Fix all lint, type, line-length, and test errors.
4. Report the exact executed commands and outcomes to the user.
5. Never claim a test has passed without actual execution.
