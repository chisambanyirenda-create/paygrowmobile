# MobiTrack — Phone & Accessory Business Manager

A premium fintech-style business management app for a phone and accessory shop in Zambia. Tracks inventory, sales, customers, expenses, suppliers, and provides financial analytics (profit/loss, revenue by category, top products).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/mobile-biz run dev` — run the frontend (port 24144)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server)
- Frontend: React + Vite + Tailwind CSS v4 + Recharts (artifacts/mobile-biz)
- DB: PostgreSQL + Drizzle ORM (lib/db)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Auth hooks: @tanstack/react-query via @workspace/api-client-react

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/db/src/schema/` — Drizzle schema (products, customers, suppliers, sales, sale_items, expenses)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/mobile-biz/src/pages/` — Frontend pages (Dashboard, Inventory, Sales, Customers, Expenses, Suppliers, Reports)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not hand-edit)
- `lib/api-zod/src/generated/` — generated Zod schemas for server validation (do not hand-edit)

## Architecture decisions

- Contract-first: OpenAPI spec → codegen → typed hooks + Zod schemas. Always update the spec first, then run codegen.
- All monetary values stored as PostgreSQL `numeric(12,2)` and returned as JS `number`. Currency is ZMW (Zambian Kwacha).
- Sales creation is fully transactional: stock lock → availability check → insert sale + items → decrement stock, all in one DB transaction.
- Dashboard routes compute aggregates server-side (no client-side math). Profit = gross sale profit; Net Profit = gross profit minus expenses.
- Dark mode always on — applied via `class="dark"` on the root HTML element.

## Product

- **Dashboard**: Live KPIs (revenue, net profit, products sold, customers), profit/loss chart, category revenue donut, top products, low-stock alerts, recent activity feed.
- **Inventory**: Full product CRUD — phones, accessories, tablets. Cost/selling price, stock tracking, low-stock thresholds.
- **Sales (POS)**: Multi-item point-of-sale form. Select products, set quantities/prices, apply discount, choose payment method (cash/mobile money/bank transfer/card), optionally link to customer.
- **Customers**: Customer directory with lifetime value (total purchases + total spent).
- **Expenses**: Expense tracking by category (rent, utilities, transport, marketing, salaries, stock, other).
- **Suppliers**: Supplier directory for wholesale partners.
- **Reports**: Profit/loss trends, revenue by category, top profit-driving products.

## User preferences

- Dark blue primary colour with electric cyan accents and amber/gold for profits.
- Currency displayed as "K 1,234.50" (Zambian Kwacha / ZMW).
- No emojis anywhere in the UI.
- App belongs to the owner only — single-user, no auth layer.

## Gotchas

- `pnpm --filter @workspace/db run push` must be run after any schema change in `lib/db/src/schema/`.
- After any change to `lib/api-spec/openapi.yaml`, run codegen before touching frontend or backend code.
- Sales route uses `pool.connect()` directly for transactions — the `drizzle` wrapper is re-instantiated per transaction to bind to the acquired client.
- `TO_CHAR` format strings in dashboard SQL must use `sql.raw()` — passing them as parameters causes Drizzle to bind them as `$1` placeholders, which PostgreSQL rejects for format arguments.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
