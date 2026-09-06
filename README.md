# Tilla

Indian GST accounting SaaS foundation (Tally-class).

Stack: Next.js App Router, TypeScript, Prisma, SQLite local / Postgres optional, Auth.js, Tailwind, Zod, Vitest

## What this foundation includes

- Multi-tenant company_id with roles: owner | accountant | ca_viewer
- Indian-style Chart of Accounts seed + GST ledgers
- Vertical slice: GST sales voucher posts balanced double-entry
- Day Book and basic Trial Balance
- Stub e-invoice / e-way clients (no live GSTN calls)
- Unit tests for CGST/SGST vs IGST tax math

## Prerequisites

- Node.js 20+ and package manager
- Docker optional; SQLite used so app runs without external services
- docker-compose.yml included for Postgres later

## Setup

```bash
cd /workspace/Tilla
cp .env.example .env
npm install
npm run db:setup
npm run dev
```

Open http://localhost:3000

### Demo login

- Email: demo@tilla.app
- Password: demo1234
- Company: Acme Traders (Maharashtra)

## Exact run commands

```bash
npm install
npm run db:setup
npm run dev
npm run test
npm run lint
npm run build
npm run start
```

### Bun alternative

```bash
bun install
bun run db:setup
bun run dev
bun run test
```

## Environment

See .env.example.

- DATABASE_URL — default file:./dev.db (SQLite)
- AUTH_SECRET — Auth.js secret
- NEXTAUTH_URL — http://localhost:3000

### Switching to Postgres

1. docker compose up -d
2. Set DATABASE_URL for Postgres
3. Change provider to postgresql in prisma/schema.prisma
4. Run prisma db push and seed

## Architecture

- src/app — App Router UI + API routes
- src/lib/tax/gst.ts — CGST/SGST vs IGST helpers (+ vitest)
- src/lib/accounting — post-sales-voucher, reports
- src/lib/gstn — e-invoice and e-way STUBS
- prisma/schema.prisma — multi-tenant CoA, vouchers, inventory

Sales voucher (intra-state): Dr Party, Cr Sales, Cr Output CGST/SGST.
Inter-state: Cr Output IGST instead.

## MVP roadmap (stub)

- [x] Foundation schema + auth + sales vertical slice
- [ ] Purchase voucher + input tax credit
- [ ] GSTR-1 / GSTR-3B export
- [ ] Inventory movements + godown transfers
- [ ] CA viewer read-only reports
- [ ] Live GSTN adapters (feature-flagged)
- [ ] Postgres + multi-company switcher
