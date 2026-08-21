# Developer Onboarding Guide

Welcome to the **Vazo E-Commerce Platform** codebase. This guide will walk you through setting up your local development environment and understanding the core architectural patterns.

---

## 1. Prerequisites

- **Node.js**: Version `20.x` or `22.x` (LTS recommended)
- **npm**: Version `10.x` or later
- **Git**: For version control

---

## 2. Quickstart Step-by-Step

### Step 1: Clone Repository
```bash
git clone https://github.com/yusuf-ulgen/vazo-website.git
cd vazo-website
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Copy the safe placeholder environment file:
```bash
cp .env.example .env.local
```
*(On Windows PowerShell: `Copy-Item .env.example .env.local`)*

By default, `VITE_ENABLE_MOCK_DATA="true"` allows complete local development without live backend dependencies. To connect to Supabase, set `VITE_ENABLE_MOCK_DATA="false"` and configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.


### Step 4: Launch Development Server
```bash
npm run dev
```
The application will start at `http://localhost:5173`.
- **Public Storefront**: `http://localhost:5173/`
- **Admin Panel**: `http://localhost:5173/admin`

### Step 5: Run Verification Suite
```bash
npm run verify
```

---

## 3. Project Mental Model

1. **Unified Application**: Both the public storefront (`/`) and the admin panel (`/admin`) run in the same React application.
2. **Retail + Wholesale Coexistence**: Products belong to a single catalog with shared media and specifications, but feature separate retail pricing and wholesale volume tiers.
3. **Design Tokens as Source of Truth**: Never hardcode colors or magic numbers. Use classes mapped to `design-tokens/tokens/`.
4. **Hard 600-Line Limit**: No source file may exceed 600 lines. Break components down by sub-features, custom hooks, or entity adapters.
5. **No Secrets in Frontend**: `VITE_*` variables are publicly visible in browser inspection. Never place server secrets here.
6. **Architecture Decisions**: Major technological shifts (such as selecting a real backend database or payment provider) require a documented Architecture Decision Record in `docs/ADR.md`.
