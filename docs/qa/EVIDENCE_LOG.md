# Tilla QA Evidence Log

Append-only. Newest first.

## 2026-09-06 12:47 IST — Gap slice J4/E3/E5/E7/E8
- Owner: Grok Bot (gap closer on existing checkout)
- SHIP_GATE: FAIL (remaining J5–J9, J12, E6)
- Unit: 18/18 PASS (vitest)
- E2E: 14/14 PASS (prior 9 + j04 e3 e5 e7 e8)
- Archive: docs/qa/evidence/archive/run-20260906T071735Z.txt
- SHA: 82f9e6b
- Log: docs/qa/evidence/e2e-run-20260906T071735Z.log
- Specs added: e2e/specs/j04-purchase-stock.spec.ts, e3-keyboard.spec.ts, e5-gst-strip.spec.ts, e7-ca-view.spec.ts, e8-affiliate.spec.ts
- Flows: j4-purchase-stock.yaml (fleshed), e8-affiliate-pending.yaml (fleshed), e3-keyboard.yaml, e7-ca-view.yaml
- UI hooks: sales keyboard + non-blocking gst-strip; purchase testids; CA sidebar hides write/referral; inventory testids
- Contabo: blocked until user PG

## 2026-09-06 12:41 IST — QA Engineer independent E2E (commit 3253aaf)

- Owner: QA Engineer (executor)
- SHA: `3253aaf59b3160e596dbaec1ef00e476fc6926a8`
- Env: SQLite `prisma/dev.db`; demo seed (`demo@tilla.app` / `ca@tilla.app` / `other@tilla.app`); Chromium; `reuseExistingServer` on :3000 (`next dev`)
- Pack run: eng-authored only — `j01-login`, `j02-intra-sales`, `j03-inter-sales`, `j11-tenancy`, `j-security-smoke` (9 tests)
- Result: **9 passed / 0 failed / 0 skipped** (14.3s)
- Failures: none
- Match vs QA Lead partial green (`docs/qa/evidence/archive/run-2026-09-06.txt`): **YES** (same SHA/pack, 9/9)
- DB spot-check (this run): J2 intra `cgst=270 sgst=270 igst=0 total=3540`; J3 inter `igst=360 cgst=0 sgst=0 total=2360`
- Coverage gaps vs J1–J12 / E1–E9 (no new specs authored):
  - Missing journeys: **J4** purchase/stock, **J5–J6** payment/receipt/journal/contra, **J7–J8** TB/day book, **J9** GSTR, **J10** CA RO UI, **J12** FY lock
  - Missing UX SoT: **E3** keyboard Enter/F2/Alt+I/Ctrl+S/Esc dirty-guard; GST strip non-blocking assert not covered beyond J2/J3 tax amounts; **E7** CA no-referral UI; **E8** affiliate pending / no Paid/checkout CTAs (flows yaml `e8-affiliate-pending.yaml` / `j4-purchase-stock.yaml` exist without matching specs)
  - Flows present without specs: `j1-login.yaml`, `j2-sales-intra.yaml`, `j4-purchase-stock.yaml`, `e8-affiliate-pending.yaml`
- Artifacts: `docs/qa/evidence/e2e-qa-engineer-20260906T071052Z.log`; archive `docs/qa/evidence/archive/qa-engineer-2026-09-06T1241IST/`
- Contabo: not used
- **QA Engineer did NOT declare SHIP_GATE** (gaps remain; Lead owns gate)

## 2026-09-06 — Gate ownership + baseline

- Owner: QA Lead
- SHA: edf3f97 (+ uncommitted WIP)
- Remote: https://github.com/berdmemory-afk/Tilla
- Unit tests: Vitest; run from repo root for @/ alias
- E2E: scaffolding in progress. SHIP_GATE: FAIL
- No Contabo; PG stub only
- Next: Playwright J1-J12 with FE+API+DB evidence

## 2026-09-06 — Partial green slice (commit 3253aaf)
- SHIP_GATE: FAIL
- Unit: 18/18 PASS (vitest)
- E2E: 9/9 PASS (j01 j02 j03 j11 j-security-smoke)
- Archive: docs/qa/evidence/archive/run-2026-09-06.txt
- Gaps: J4 purchase/stock; E3 keyboard; E7 CA referral UI; E8 affiliate pending CTAs
- Contabo: blocked until user PG
