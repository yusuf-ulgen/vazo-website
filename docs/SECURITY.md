# Security Baseline & Data Protection Policies

This document establishes the security standards and operational policies for the **Vazo E-Commerce Platform**.

---

## 1. Secrets Management & Environment Policy

### 1.1 Never Commit Secrets to Git
- Under no circumstances may private API keys, database credentials, payment secret keys, SMTP passwords, or SSH certificates be committed to source control.
- `.gitignore` strictly excludes `.env`, `.env.local`, `.env.*.local`, and certificate extensions (`.pem`, `.key`).
- Automated repository safety checks (`npm run check:repo`) scan for accidental credential leaks before commits.

### 1.2 The `VITE_*` Browser Exposure Warning
- In Vite applications, any environment variable prefixed with `VITE_` is statically replaced into client-side JavaScript bundles during compilation.
- **Rule**: Never store private keys, webhook signing secrets, or database passwords in `VITE_*` variables.
- `VITE_*` variables are strictly limited to public endpoints, public feature flags, and non-sensitive application titles.

---

## 2. Authentication & Admin Panel Security

### 2.1 Client-Side Route Guards Are NOT Security Boundaries
- React Router guards (`/admin/*`) provide user experience navigation flow only.
- In single-page applications, client-side code can be inspected or bypassed in browser dev tools.
- **Mandatory Backend Enforcement**: All admin API endpoints and mutations must be independently authenticated and authorized via server-side session cookies or JWT tokens with strict RBAC (Role-Based Access Control).

### 2.2 Credential Protection
- Admin login passwords and tokens must never be logged to browser console or persisted in unencrypted `localStorage` without explicit token expiration and refresh handling.

---

## 3. Data Validation & Injection Prevention

### 3.1 XSS (Cross-Site Scripting) Prevention
- Always rely on React's automatic string escaping.
- Avoid `dangerouslySetInnerHTML` unless rendering sanitized rich-text product descriptions parsed through a strict DOMPurify pipeline.
- All user inputs in contact forms and trade applications must be sanitized and validated using structured schema validation (e.g., Zod) on both client and server.

### 3.2 File Upload Safety (Future Media Module)
- When implementing the Media Library in future phases:
  - File types must be validated by MIME-type and magic bytes (strictly allowing `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg`).
  - Prohibit direct execution of uploaded media on the host server.
  - Image files must be served from an isolated CDN/bucket with appropriate Content-Disposition headers.

---

## 4. Logging & Audit Trails

- Application logs must never print sensitive customer payment details (credit card numbers, CVVs) or authentication credentials.
- All administrative data mutations (product creation, wholesale price changes, trade customer approval) must generate immutable audit records in the backend audit trail.
