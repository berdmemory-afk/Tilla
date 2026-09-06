# Tilla Foundation Status

**Date:** 2026-09-06
**Path:** /workspace/Tilla
**DB:** SQLite via Prisma (Docker/Postgres not required for local demo)

## What works

- Next.js App Router TypeScript project with Tailwind UI shell (sidebar nav)
- Prisma schema: companies, memberships/roles, CoA ledgers, parties, items/godowns, vouchers + lines
- Auth.js Credentials demo user (demo@tilla.app / demo1234)
- GST sales voucher vertical slice (API + form): posts Dr party / Cr sales / Cr tax ledgers
- Intra-state CGST+SGST and inter-state IGST paths
- Day Book and Trial Balance report pages
- Vitest unit tests for tax helpers (CGST/SGST vs IGST)
- Stub e-invoice and e-way clients (no live GSTN)
- Seed: Acme Traders + demo owner + sample item/party/CoA
- Local git repo with initial commit (no remote / no push)

## How to run

```bash
cd /workspace/Tilla
npm install
npm run db:setup
npm run test
npm run dev
```

Then open http://localhost:3000 and sign in with demo@tilla.app / demo1234.

Bun works too: bun install && bun run db:setup && bun run dev

## Not in this foundation

- Live GSTN / NIC API calls
- Purchase vouchers, payments, receipts UI
- Full GSTR-1/3B generators (schema is report-ready; exports deferred)
- Multi-company switcher UI
- Postgres by default (compose file present for later)

## Blockers / notes

- Docker was unavailable on the scaffold host; SQLite chosen so install/dev works offline of Postgres.
- Auth protection is enforced in the (app) layout (JWT session), not Edge middleware (Prisma/bcrypt are Node-only).
