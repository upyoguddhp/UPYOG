# egov-location migration notes

Clean wholesale replace - no HP customization to port. History showed one real feature commit ("merge for Dec prod release", `2fa4dd1333`) adding pincode-based boundary search (`BoundarySearchRequest.pinCode`, `BoundaryRepository.filterBoundaryCodesForPincode`, a new `pinCode` query param on `LocationBoundaryController`) - checked, and **this is already present in current `UPYOG-master-Latest` verbatim**, byte-for-byte identical to the fork's version. Nothing else in this directory's 27-commit history was HP-authored beyond trivial config (DB name, a "test commit").

## Config fixes
- `server.port`: checked-in default is `8082`, which collides with the gateway - a pre-existing conflict inherited from the old zuul config (its own `routes.properties` also pointed `egov-location` at `8082`, identical to zuul's own port, predating this migration entirely - not something introduced here, and not confidently "fixable" without knowing which side was actually wrong in production). Left `application.properties` untouched and added a local-only override instead: `.upyog-env/egov-location.env` sets `SERVER_PORT=8095`.
- `egov.services.egov_mdms.hostname`: defaulted to `dev.digit.org` and doesn't match `EGOV_MDMS_HOST`'s relaxed-binding name (missing `egov.` prefix on `services`), so isn't auto-overridden like most services. Set directly to the mdms-v2 cutover host.

## Verification performed (this session)
Started via `upyogctl start egov-location` against `hpupyog_5`:
- Compiled and started clean.
- `GET /health` → `200 {"status":"UP"}`.
- `POST /location/v11/boundarys/_search?tenantId=hp.Amb&hierarchyTypeCode=REVENUE` → `200`, valid (empty) `TenantBoundary` response structure - confirms the endpoint and MDMS connectivity work; empty result is most likely just the wrong `hierarchyTypeCode` guess for this tenant's actual boundary data, not investigated further.

**Not yet verified**: the pincode search feature itself with real matching data (didn't have a known-good pincode/tenant/hierarchy combination on hand), boundary create/update endpoints.
