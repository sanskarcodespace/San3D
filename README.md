# San3D

Foundation for a premium 3D printing e-commerce application, built with Next.js App Router, React, TypeScript, Tailwind CSS, and ESLint.

## Project status

Initialized application with a minimal holding page, shared layout, site configuration, and preliminary product, cart, and order domain types. Supabase, Razorpay, and admin integration boundaries are documented but not implemented. There is no working catalog, checkout, database, or admin dashboard yet.

Repository: [sanskarcodespace/San3D](https://github.com/sanskarcodespace/San3D).

## Local development

Use Node.js 24 LTS (see `.nvmrc`) and npm. Next.js requires Node.js 20.9 or later.

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). Environment configuration is optional for this initial application; leave placeholders blank until integrations are implemented. Never commit real credentials.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint with zero warnings allowed |
| `npm run typecheck` | Check TypeScript without emitting JavaScript |
| `npm run build` | Create and type-check the production build |
| `npm start` | Serve an existing production build |
| `npm ci` | Install reproducibly from the committed lockfile |

## Structure

```text
src/
  app/
    (storefront)/page.tsx  # Public route composition; resolves to /
    globals.css           # Tailwind and global theme
    layout.tsx            # Root document and metadata
  components/
    layout/               # Shared layout primitives
  config/                 # Public site configuration
  features/
    admin/                # Future administration boundary
    cart/                 # Cart domain contracts
    orders/               # Order and payment domain contracts
    products/             # Catalog and variant domain contracts
  lib/
    razorpay/             # Future payment adapter boundary
    supabase/             # Future database/auth adapter boundary
public/                   # Static assets
.env.example              # Sanitized configuration template
```

## Architecture

Keep routes thin: use `app` for layouts and route composition, `features` for domain-specific types and business logic, `components` for reusable presentation, and `lib` for external service adapters. Prefer Server Components; introduce Client Components only where browser state or interaction is needed. The `@/*` alias resolves to `src/*`.

Product variants represent SKU, material, color, price, and inventory. Order items preserve a purchase snapshot. Money is represented in integer paise for INR. These are initial TypeScript contracts, not runtime validation or a finalized database schema.

Add storefront catalog and product routes inside `(storefront)` as features are developed. Introduce the dashboard under `(admin)/admin` with server-side authentication and authorization, and payment/webhook handlers under `app/api` when their implementation is ready. Route groups organize code without adding URL segments or providing access control.

## Integration plan

**Supabase:** Add browser and request-scoped server clients, database migrations, generated schema types, storage policies, and row-level security. See `src/lib/supabase/README.md`. Apply server-enforced roles before building administrative data access.

**Razorpay:** Add server-side order creation, signature verification, webhook handling, and idempotent payment reconciliation. See `src/lib/razorpay/README.md`. Recalculate checkout prices on the server and validate inventory before accepting an order.

**Product management and admin:** Build catalog CRUD, variant inventory, media management, and order fulfillment within the corresponding feature modules. See `src/features/admin/README.md`. Add behavioral tests alongside real business logic and integration tests as services are connected.

## Environment and secrets

`.env.example` lists future Supabase and Razorpay settings. Only `NEXT_PUBLIC_*` values may reach the browser; never prefix a secret with `NEXT_PUBLIC_`. Load server credentials only within server modules when the integrations are added, and validate required settings at their entry points.

Git ignores `.env.local`, other environment files, `node_modules`, build artifacts, common credential files, and local logs. The sanitized `.env.example` is explicitly tracked. Git cannot detect arbitrary secrets embedded in source files: keep credentials out of code and use environment settings in deployment.

## Verification and deployment

Before committing changes, run `npm run lint`, `npm run build`, and `npm run typecheck`. A build needs no service keys at this stage. The app can run on a Node.js host supporting Next.js with `npm run build` followed by `npm start`; configure service environments when those features are implemented.

No deployment or automatic push workflow is configured. The initial commit is local; pushing to GitHub is a separate approved step.

## Current tooling limitations

At initialization, `npm audit --omit=dev` reports no production vulnerabilities. The full audit reports five high-severity findings along the development-only lint dependency chain (`eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`). The available `braces` release is affected, and npm's proposed automatic fix downgrades the Next.js ESLint configuration to version 14; do not apply that incompatible downgrade blindly. Revisit this chain when an upstream fix is released.

ESLint 9 is retained for compatibility with the React, accessibility, and import lint plugins, although npm marks that ESLint release unsupported. TypeScript 5.9 is pinned within its minor line for tooling compatibility. Upgrade these together after verifying the plugins' supported versions.
