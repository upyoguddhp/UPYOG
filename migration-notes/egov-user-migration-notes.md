# egov-user migration notes

Far bigger than the gateway or mdms-v2 migrations: this service jumped Spring Boot **1.5.22 → 3.2.2** (three major versions) and the entire OAuth2 stack was rearchitected (deprecated Spring Security OAuth → Spring Authorization Server). Unlike mdms-v2, egov-user carries ~70 genuinely HP-specific commits on top of the base DIGIT service, including a custom SSO integration with its own DB table and live data (5,572 rows) — a wholesale replace would have deleted that feature and reintroduced already-fixed login bugs. Full audit-and-port was done instead.

## What got ported
- **Custom SSO login** (`SsoService`, `LoginService`, `UserSso` model/repository/query-builder/row-mapper, `HpSsoValidateToken(Response)`, `LoginRequest`) — validates a token from HP's own SSO backend (`sso.hp.gov.in`), creates/updates the citizen record, logs them in. Table `ud_user_sso` already existed in `hpupyog_5` with real data untouched by this migration.
- **`skipTenantCheck`** — added to `UserSearchCriteria`, `LoginRequest`, and threaded through `UserService.getUniqueUser` (new overload, old signature untouched) and `CustomAuthenticationProvider`'s OAuth2 grant-parameter extraction, matching the old behavior exactly.
- **`isDataProtectionAccepted`** — added to the domain `User` model, both auth-provider classes' token-building code, the row mapper (read), `UserRepository`/`UserTypeQueryBuilder` (write, both update-query call sites), and the `UserRequest`/`UserSearchResponseContent` API contracts. Column already existed in the DB.
- **Phone number regex** — HP's landline-supporting pattern (`UserServiceConstants.PATTERN_MOBILE`) replaces upstream's plain 10-digit-only pattern.
- **`/_login`** (employee login by email/mobile/username) and **`/login/_uuid`** (post-OTP UUID→token handoff) — spliced into the new `UserController`, both added to `SecurityConfig`'s permit-all list (they weren't there initially, causing a 403 before my fix — see below).

## What did NOT get ported
- **A hardcoded authentication bypass** in `SsoService.customLogin()` — a fixed token string that logged a specific hardcoded user in with no password check at all. Confirmed with you and removed rather than carried forward. This was live in the current production code path; worth checking whether it needs addressing there too, independent of this migration.
- **`TLInterceptor`** — defined but never registered with any `WebMvcConfigurer` in the old codebase either; dead code, not ported.
- The "property count api" fix (a `getUlbName()`→`getTenantId()` correctness bug) — already fixed upstream independently, nothing to port.

## The real architecture gap: token issuance
The old `UserService.getLoginAccess(user, password)` — used by both the SSO flow and `/login/_uuid` to mint a token for an already-verified user without a fresh password check — doesn't exist in the new OAuth2 stack; there's no direct equivalent. Resolved with your go-ahead as follows:
- Extracted the token-minting logic already living (duplicated) in `CustomAuthenticationController` into a new shared `TokenIssuanceService`, and refactored the controller to use it instead (no behavior change there, just deduplication).
- **SSO flow**: authenticates for real through `AuthenticationManager` using the fixed `CITIZEN_PASSWORD` every SSO-created citizen has, then calls `TokenIssuanceService.issueTokensFor(...)` — goes through the same path a normal login does, no bypass.
- **`/login/_uuid`**: looks the user up by UUID (as before), wraps them in a `SecureUser` directly, and calls the same `TokenIssuanceService` — skips `AuthenticationManager` entirely since there's nothing to authenticate (identity was already verified by whatever called this endpoint), matching the endpoint's original no-credential-check design, which you confirmed should be preserved.

## Externalized a hardcoded secret
`Constants.SECRET_KEY` / `SERVICE_ID` (credentials for the outbound call to HP's SSO backend) were hardcoded string literals in source. Moved to `application.properties` (`egov.sso.hp.secret.key` / `egov.sso.hp.service.id`) — same values, just configurable now. Worth moving to `.upyog-env` rather than committed properties as a follow-up.

## Bugs found and fixed along the way (not part of the port, uncovered by actually starting the service)
1. **Malformed MDMS URL platform-wide**: `EGOV_MDMS_HOST` in `.upyog.env` had no trailing slash, and `egov.mdms.search.endpoint` (hardcoded per-service, e.g. `egov-mdms-service/v1/_search`) has no leading slash — concatenating them produced `http://localhost:9080egov-mdms-service/v1/_search`. This affects every service that builds its MDMS URL this way (dozens), not just egov-user; it just happened to be the first one that calls MDMS at startup (for its encryption policy) rather than lazily. Fixed by adding the trailing slash to `EGOV_MDMS_HOST`.
2. **`DataSecurity.*` master data was never migrated**: egov-user's encryption library fetches its policy config from MDMS at startup and has no null-check if that data is missing — a hard startup dependency. This master lives under the plain `hp` (state-level) tenant, which the mdms-v2 migration script deliberately excluded (assumed already covered by the original 47-schema/2,629-row set). It wasn't — along with several other `hp`-tenant masters (ACCESSCONTROL-ROLEACTIONS, ASSET.AssetCategory, TradeLicense.Categories, RAINMAKER-PGR.ServiceDefs, common-masters.Department, NOC.NOCBusinessServiceRoleMaping, PetService.Documents). Ran the same migration script scoped to plain `hp` — safe due to `ON CONFLICT DO NOTHING`, backfilled 96 schema rows and 4,404 data rows without touching the existing 2,629.
3. **`SecurityConfig`'s permit-all list didn't include the three custom endpoints** (`/_landingPage`, `/_login`, `/login/_uuid`) — they were getting a blanket 403 from Spring Security before ever reaching the controller. Added them, same pattern as the existing `/citizen/_create` etc. entries.

## Verified
- Clean startup (`Started EgovUserApplication`), encryption policy loads from mdms-v2 correctly.
- `/user/oauth/token` (standard password grant): bad credentials → clean `401 invalid_grant`, not a crash — core login path structurally intact.
- `/user/_landingPage` (SSO): bad token → clean `401 Login failed`, reaches business logic correctly.
- `/user/login/_uuid`: reaches business logic, hits `egov-enc-service` (not running in this session) for decryption — an environmental gap, not a code issue; would need that service up for a full end-to-end test.
- **Not verified**: a real end-to-end SSO login (needs a live token from HP's actual SSO backend) and a real password-grant login (needs a known plaintext password for an existing account) — both require external state I don't have access to here.
