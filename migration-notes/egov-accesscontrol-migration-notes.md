# egov-accesscontrol migration notes

Much simpler than `egov-user`: 23 total commits, none of which turned out to be genuine HP-specific behavior after filtering out DIGIT-release/merge noise. Wholesale replace with `UPYOG-master-Latest`'s version (Spring Boot 2.2.13 → 3.2.2, Java 8 → 17). Port kept at HP's existing `8091` (already matched upstream's default). The only local diffs before replacing were DB connection strings (already overridden globally by `.upyog.env`) and a Lombok version pin — nothing to port forward.

## Real bug found (in the MDMS migration script, not this service)
Testing `/access/v1/actions/_authorize` against real data hit `DATA_NOT_AVAILABLE` — `accesscontrol` fetches its role-action mappings from `mdms-v2` (`ACCESSCONTROL-ROLEACTIONS.roleactions`), and all 5,023 records for that master had silently failed to migrate.

Root cause: `mdms/master-config.json` declares this master's `uniqueKeys` as `['rolecode', 'actionid', 'tenantid']` (lowercase, DB-column style), but the actual JSON records use camelCase `tenantId`. The migration script's exact-case field lookup treated every record as missing its tenant key and skipped all of them — a systematic bug that could affect any other master with the same casing mismatch, not something specific to this service.

Fixed the migration script to fall back to a case-insensitive field match when the exact-case key isn't present, then re-ran it across all tenants (safe and idempotent via `ON CONFLICT DO NOTHING` — only added the previously-missing rows, touched nothing else). 4,913 of 5,023 `roleactions` rows landed (remainder are duplicate composite keys, expected).

## Verified
- Clean startup on port 8091.
- `/access/v1/actions/_authorize`: before the data fix, an unhandled `NullPointerException`; after, a clean `401` (or `200` for a permitted role/action) — a real authorization decision from real data, not a crash.
