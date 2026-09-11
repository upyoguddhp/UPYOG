# egov-otp migration notes

Audit-and-port: found a real feature and, separately, a hardcoded security bypass explicitly reviewed with the user before deciding.

## HP customizations found and ported
**User access-token issuance tied to OTP validation** (commits `ea53aec196`, `f6ca156168`): two related additions -
1. `POST /v1/_validate` accepts an optional `returnToken: true` flag; when set, after a successful OTP validation it also fetches a real user access token (via `TokenService.getUserAccesToken()`, which calls egov-user's own `/user/login/_uuid?uuid=...` endpoint) and returns it alongside the OTP result.
2. A new standalone `POST /v1/_getUserToken` endpoint does the same token lookup directly given just a `uuid`, without any OTP round-trip at all.

Both rely on egov-user's `/login/_uuid` endpoint, which was itself audited and intentionally ported as-is during the egov-user migration (confirmed with the user at the time: "port as-is", a deliberate no-credential-check design for this exact purpose - egov-otp's addition here is just a second caller of that same already-approved pattern, not a new trust boundary).

Ported: `Token.accessToken`, `TokenService.getUserAccesToken()` (new `RestTemplate` dependency - resolved automatically via `TracerConfiguration`, no new bean needed), `OtpResponse.accessToken`, `OtpValidateRequest.returnToken`, the two new `GetUserTokenRequest`/`GetUserTokenResponse` contract classes (no upstream equivalent), the `OtpController` wiring, and `egov.user.host` in `OtpConfiguration` + `application.properties` (upstream has no default for this property at all - a straight addition, not a fix).

Adding the `accessToken`/`returnToken` fields shifted two `@AllArgsConstructor` arities; fixed the three affected test call sites (`OtpConfiguration`, `OtpValidateRequest` positional constructors) using the exact values from HP's own corresponding test-fix commit.

## Security bypass found - explicitly reviewed with the user, kept
`TokenService.validate()` accepts the literal string `"02908"` as an always-valid OTP, regardless of what was actually generated and sent to the user (added in commit `dd2bc900bc`, no explanation given in the commit). This is a **hardcoded master-OTP bypass affecting every OTP-gated flow platform-wide** (citizen login, mobile verification, etc.) - anyone who knows this value can skip OTP verification for any identity/tenant. Flagged to the user before porting (same treatment as the `SsoService` bypass found during the egov-user migration); **the user explicitly chose to keep it**, so it was ported forward unchanged. Verified live: submitting `"02908"` as the OTP for a request that was never actually sent that code still returns `isValidationSuccessful: true`.

## Verification performed (this session)
Started via `upyogctl start egov-otp` against `hpupyog_5`:
- Compiled clean after fixing the constructor-arity breaks and adding the missing `egov.user.host` property (its absence caused an immediate `IllegalArgumentException: Could not resolve placeholder` at startup - a real gap, not present in upstream at all since the whole feature is HP-only).
- `POST /v1/_create` → `201`, returned a real generated OTP for a test identity.
- `POST /v1/_validate` with the real OTP → `200`, `isValidationSuccessful: true`.
- `POST /v1/_validate` with `"02908"` against a *different* identity/OTP pair (one that was never sent that code) → `200`, `isValidationSuccessful: true` - confirms the master-bypass behavior is live and working exactly as before.

**Not yet verified**: the `returnToken`/`_getUserToken` cross-service call into egov-user's `/login/_uuid`. Started egov-user + egov-enc-service to test this end-to-end, but hit `hpupyog_5`'s Postgres `max_connections` limit (a genuine, session-wide resource constraint from the cumulative number of services started across this long migration session, not a code defect - confirmed via `pg_stat_activity` showing the connection count pinned near the server's 100-connection ceiling). `/login/_uuid` itself was already independently verified working during the egov-user migration; `getUserAccesToken()` is a thin, direct proxy to that same call with no additional logic of its own, so risk here is low, but recommend a follow-up check once other services are quiesced.
