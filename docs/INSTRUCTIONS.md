# Canonical AI & Developer Instructions

This document governs the engineering standards, operational procedures, and code quality contracts for the **Vazo E-Commerce Platform**.

---

## 1. Core Operating Principles

### 1.1 Understand Before Modifying
1. Always read the user request carefully and clarify ambiguities when necessary.
2. Search and inspect the existing codebase before modifying or adding files.
3. Understand existing patterns and preserve functioning behavior.
4. Implement the smallest coherent solution that completely satisfies the requirements.

### 1.2 No Unrelated Refactoring
- Never rewrite working code solely because another style seems more fashionable.
- Keep diffs focused, minimal, and directly related to the requested task.

---

## 2. Hard File Size Rule (600 Lines Maximum)

- **Hard Limit**: No manually maintained source-code file (`.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.mjs`) may exceed **600 lines**.
- **Preferred Target**: `<= 350 lines`.
- If a file approaches 450–500 lines, evaluate decomposition.
- If a file exceeds 600 lines:
  - **DO NOT** continue adding code to it.
  - Decompose it logically by concern: sub-components, custom hooks, helper utilities, entity models, or API adapters.
  - **NEVER** split files artificially into meaningless `part1.ts`, `part2.ts`, `part3.ts`.
- Enforce via:
  ```bash
  npm run check:lines
  ```

---

## 3. Environment & Secret Security

1. **No Secrets in Source Control**: Never commit `.env`, `.env.local`, API keys, private keys, database connection strings, or admin passwords.
2. **Vite Public Variable Warning**: Any variable starting with `VITE_*` is bundled into browser JavaScript and can be inspected by any visitor. **Never assign secrets to `VITE_*` variables.**
3. **Safe Defaults**: Maintain `.env.example` with only non-sensitive placeholder configurations.
4. Enforce via:
  ```bash
  npm run check:repo
  ```

---

## 4. Design Token Compliance

1. **Visual Source of Truth**: All colors, typography, spacing, radius, and shadows derive from `design-tokens/tokens/` and Tailwind semantic classes.
2. **No Arbitrary Inlined Hex Values**:
   - ❌ `className="bg-[#1a1a1a] text-[#ffffff] p-[18px]"`
   - ✅ `className="bg-surface text-primary p-4"` or `className="bg-action-primary text-action-primary-text"`
3. **Typography Tokens**: Use semantic families `font-display` (editorial/headings) and `font-sans` (interface/body).
4. **Motion**: Ensure all animations and transitions respect `prefers-reduced-motion: reduce`.

---

## 5. Dependency Management Policy

1. **Conservative Stack**: Do not install new dependencies without concrete architectural necessity.
2. **Prohibited Packages**: Do not add heavy component suites (Bootstrap, MUI, Ant Design), multiple icon libraries, random carousels, or unapproved global state libraries.
3. **Stable Releases**: Only install stable, mutually compatible versions. No alpha/beta/RC packages without an explicit ADR.
4. **Commit Lockfile**: Always commit `package-lock.json`.

---

## 6. Naming & Coding Conventions

- **Component Files**: PascalCase (e.g., `ProductCard.tsx`, `AdminSidebar.tsx`).
- **Hook Files**: camelCase with `use` prefix (e.g., `useProductQuery.ts`, `useDisclosure.ts`).
- **Utility / Config Files**: camelCase or kebab-case (e.g., `formatCurrency.ts`, `site-config.ts`).
- **Types / Interfaces**: PascalCase with descriptive names (e.g., `Product`, `WholesaleTier`).
- **Strict TypeScript**: Avoid `any`. Use discriminated unions, generics, and strict null checks.

---

## 7. Testing & Pre-Completion Verification

Before claiming completion on any task, run the full verification suite:

```bash
npm run verify
```

This command executes:
1. `npm run check:repo` (Repository safety and secret scanning)
2. `npm run check:lines` (600-line source file limit audit)
3. `npm run lint` (ESLint code quality)
4. `npm run typecheck` (Strict TypeScript compiler check)
5. `npm run test` (Vitest unit and contract tests)
6. `npm run build` (Production Vite bundle compilation)

**Never declare a test has passed without actually running it.**
