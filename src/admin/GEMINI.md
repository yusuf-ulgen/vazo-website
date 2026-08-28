# Admin Panel Context & Rules

When modifying or adding admin code (`src/admin/`):

1. Consult [`docs/ADMIN.md`](../../docs/ADMIN.md) for full module blueprints and CRUD contracts.
2. Enforce the **Functional or Explicitly Disabled** rule: never create fake interactive buttons that silently do nothing.
3. Consult [`docs/SECURITY.md`](../../docs/SECURITY.md): never expose server secrets or store sensitive credentials in browser client state.
4. Do not import storefront-specific components into admin modules. Use `src/shared/ui/` primitives.
