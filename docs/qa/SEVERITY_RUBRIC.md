# Tilla Severity Rubric

Owner: QA Lead. Used for bug triage and the ship gate.
Updated: 2026-09-06 (Asia/Kolkata)

## Levels

| Sev | Name | Definition | Ship gate |
|-----|------|------------|-----------|
| S0 | Blocker | Data loss, books out of balance, wrong GST (CGST/SGST vs IGST), auth bypass / tenant leak, crash on critical path, cannot login or post core vouchers | **Must be zero** to pass gate |
| S1 | Critical | Major feature broken with no workaround (purchase/sales/inventory/GSTR/CA invite), incorrect Trial Balance / Day Book that misleads books, security misconfig leaking demo secrets to prod path | **Must be zero** |
| S2 | Major | Feature impaired with workaround; export format wrong but numbers OK; stub checkout UX broken but clearly stubbed; flaky E2E without product defect | Prefer zero; max 2 with owner + ETA |
| S3 | Minor | UI polish, copy, non-critical nav, a11y nits that do not block books | Allowed; track |
| S4 | Trivial | Cosmetic only | Allowed |

## Accounting / GST special rules (always S0/S1)

- Unbalanced voucher (Dr != Cr) after post -> **S0**
- Intra-state booked as IGST or inter-state as CGST/SGST -> **S0**
- Stock qty drift vs voucher lines -> **S0**
- Cross-company data visible to another tenant -> **S0**
- ca_viewer can mutate books -> **S0**
- FY-locked company still accepts posts -> **S1** (S0 if silent corruption)

## Evidence required on every bug

1. Steps (Maestro-style: tap/assert sequence)
2. Expected vs actual (UI + API status/body + DB row snapshot)
3. Environment (commit SHA, SQLite vs Postgres, seed state)
4. Severity proposal with rubric cite

## Flakes

Infra/test flakes escalate to Platform / QA Lead; do not close product bugs as flake without three green reruns + root cause note.
