# finance-dashboard-service

Read-only State-level finance dashboards/reports. No existing service in this repo queries the per-ULB finance
schemas (`dashboard-analytics`/`dashboard-ingest` are Elasticsearch based, `report` is a generic report runner),
so this is a new one. It never writes.

## How it works
- Discovers ULB schemas: every schema in the DB holding both `bankaccount` and `egcl_collectionheader`, minus
  `finance.dashboard.excluded-schemas`.
- Queries each schema in parallel, rolls up in Java, caches per financial year (`cache-ttl-seconds`).
- A schema that errors is skipped and logged; it just does not count in `ulbsReporting`.

## API
`POST /finance-dashboard/v1/state/_summary`
```json
{ "RequestInfo": {}, "criteria": { "financialYear": "2026-27" } }
```
Returns `{asOf, overview, banks, schemes, services}`, amounts in ₹ crore (same shape as `OldTheme/.../finance/sampleData.js`).
Auth is expected from the gateway; add a route for `/finance-dashboard` in zuul.

## Definitions (verify with finance team)
- Bank balance: `bankaccount.currentbalance`, active accounts (`isactive = 1`). No history exists, so no balance delta.
- Collections: `egcl_collectionheader.totalamount`, status not `CANCELLED`. Online = `collectiontype = 'O'`.
- YoY: same window of the previous financial year, capped at today's date last year.
- Unreconciled: receipts with `isreconciled` not true. "Last receipt" = latest `receiptdate` (there is no sync log).
- Scheme received/utilised: debits/credits on bank GL codes of non-cancelled vouchers (`voucherheader.status <> 4`)
  linked via `vouchermis.schemeid`. `allocated` is null - finance holds no sanctioned amount per scheme.
- Account type buckets come from `bankaccount.type` text (savings/current/fixed → else Others).

## Run
`mvn spring-boot:run` (port 8095). Use a read-only DB user.
