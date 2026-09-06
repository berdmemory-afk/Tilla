# Tilla E2E Ship Gate (Maestro-inspired)
Owner: QA Lead. Hard gate before user PG. No Contabo until after user PG.
Web: Playwright Maestro-style + API + DB.
## Journeys J1-J12; loop until green; Contabo only after user PG

## UX SoT asserts (PM-stamped)
- Keyboard: Enter / F2 / Alt+I / Ctrl+S / Esc dirty-guard
- GST strip never blocks save (post-save e-invoice/e-way)
- Affiliate earnings pending; no Paid/checkout CTAs

## Source of truth
- Product AC: docs/qa/ACCEPTANCE_CRITERIA.md (E1-E9 + tenancy + checkout-stub-only)
- Severity: docs/qa/SEVERITY_RUBRIC.md
- Evidence: docs/qa/EVIDENCE_LOG.md; green artifacts in docs/qa/evidence/archive/

## Pack coverage (Playwright under e2e/)
| Pack | AC | Spec area |
|------|-----|-----------|
| Declarative Maestro-like flows | E1-E9 | e2e/flows + e2e/specs |
| Trader happy path | E1-E6 E9 | login sales purchase GST TB FY audit |
| Keyboard UX | E3 | Enter F2 Alt+I Ctrl+S Esc dirty-guard |
| GST strip non-blocking | E5 | post-save never blocks; GSTR vs books |
| CA + affiliate | E7-E8 | CA RO no referral UI; affiliate pending no Paid CTAs |
| API contracts | all | voucher auth reports checkout stub |
| DB assertions | tenancy + books | balanced Dr/Cr; org isolation |
| Security smoke | authz | 401 unauth; CA 403 write; no live PG |

## Journeys J1-J12 map to AC
| ID | Maps | Asserts |
|----|------|---------|
| J1 | E1 | demo login to dashboard |
| J2 | E4/E5 | intra sales CGST+SGST DB balance |
| J3 | E4/E5 | inter sales IGST only |
| J4 | E4 | purchase stock qtyIn |
| J5 | E9 | payment/receipt balance |
| J6 | E9 | journal/contra balance |
| J7 | E9 | trial balance |
| J8 | E9 | day book |
| J9 | E5 | GSTR stub |
| J10 | E7 | CA RO no referral UI |
| J11 | Tenancy | Secret Co hidden |
| J12 | E9 | FY lock |

## Out of scope
- Live payment gateway / card capture
- Contabo blocked until user confirms PG
