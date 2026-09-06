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

## MVP roadmap

- [x] Foundation schema + auth + sales vertical slice
- [x] Purchase voucher + input tax credit
- [x] Payment / receipt / journal basics
- [x] Inventory movements + godown balances
- [x] GSTR-1 / GSTR-3B stub exports
- [x] E-invoice / e-way UI + status store
- [x] CA invite + affiliate models + pricing config
- [ ] Live payment gateway - stubs only today
- [ ] Live GSTN adapters (feature-flagged)
- [ ] Postgres + multi-company switcher
- [ ] Contabo production deploy (POST live PG only)

## Contabo prep notes (POST live PG go-live only)
Do not provision Contabo/public production until a live PG is wired and verified.
Suggested: Ubuntu LTS VPS, Docker Compose for Postgres + app, Nginx/Caddy TLS.
Set DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL, and PG keys when ready.
Never ship demo password to prod. Daily Postgres backups; test restore once.
Non-goals until PG: Contabo billing, card capture, GSTN prod credentials.

See MARKET_READY_STATUS.md for market-ready progress (~85%).
