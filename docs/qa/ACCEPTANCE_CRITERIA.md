# Tilla Pre-PG Quality Gate AC (PM)
Source: Product Manager. UX flow states = suite SoT when they land.
Gate: No PG handoff without archived green. Contabo = post-PG only.

## (1) Trader happy path
- E1 Org+CoA trading|services|retail; FY; roles; services hides empty godown
- E2 Party/item/godown/tax typeahead; stock qty on item pick
- E3 Keyboard: type→party→lines→tax→narration→save; Enter F2 Alt+I Ctrl+S Esc dirty-guard; no Stock Journal v1
- E4 Sales/purchase(/returns) move godown; default block oversell; audit
- E5 GST strip non-blocking post-save; GSTR-1/3B draft matches books
- E6 Tally import reconcile; first sales <30m post-import
- E9 Bank recon outstandings reports FY lock audit

## (2) CA + affiliate
- E7 CA view read-only; no voucher write; no referral UI on view seat
- E8 Partner portal referral→clients→earnings pending; no Paid/checkout CTAs
- Commission auditable; Starter 15% else 20%x12→10%; 30d clawback fields

## (3) Tenancy
- Org A cannot read/write org B; CA read-only; partner≠practice books

## (4) Checkout stub
- No live PG/charge capture asserts in suite

## Evidence exit
Declarative E2E + API contracts + DB/tenancy + authz smoke + archived green
