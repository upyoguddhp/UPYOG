# egov-url-shortening migration notes

Audit-and-port: small, well-contained set of real customizations.

## HP customizations found and ported
**Query-param redirect variant** (commit `4d1139e725`, "using url shortner for grbg url"): `GET /egov-url-shortening/?id=<code>` alongside the existing `GET /egov-url-shortening/{id}` path-variable form - added because the garbage service's URL construction couldn't shape a path-variable-style link. Ported verbatim onto `ShortenController.java`.

**Global exception handling** (commit `8f0a77a380`): same `org.egov.*.exception` package pattern (`ErrorConstants`/`ErrorInfo`/`ServiceException`/`ServiceExceptionHandler`) already seen and ported during the egov-workflow-v2 migration, giving structured JSON error bodies. Ported with the same Boot 3 fix required there: `ResponseEntityExceptionHandler`'s overridden methods take `HttpStatusCode` in Spring 6, not the old `HttpStatus`.

## Config fixes
- `server.port`: upstream's default (`8091`) collides with egov-accesscontrol in this workspace; the fork's own previous default (`8093`) collides with two other not-yet-migrated services (`egov-searcher`, `ws-calculator`). Neither checked-in value is safe, so left `application.properties` at upstream's default and added a local-only `.upyog-env/egov-url-shortening.env` override (`8096`) instead of picking a new "correct" checked-in value.
- `host.name`: was `https://qa.digit.org/` (upstream's dev placeholder). Restored HP's real production citizen-facing domain (`https://citizenseva.hp.gov.in/`) from the fork's own committed config - this is the domain baked into every shortened URL handed back to citizens (e.g. SMS links), not a placeholder to leave at a dev default.
- `egov.user.host`: pointed at a k8s-DNS name (`egov-user.egov:8080`); set to the local port.
- `state.level.tenant.id`: stale `pb` default fixed to `hp`, same recurring pattern as most other services.

## Verification performed (this session)
Started via `upyogctl start egov-url-shortening` against `hpupyog_5` and local Redis:
- Compiled clean.
- `POST /shortener` with a real URL → `200`, returned `https://citizenseva.hp.gov.in/egov-url-shortening/<code>` - confirms the production domain config is live.
- `GET /egov-url-shortening/<code>` (path-variable form) → `302` redirect to the original URL.
- `GET /egov-url-shortening/?id=<code>` (HP's query-param variant) → `302` redirect to the same original URL - confirms the ported feature works identically to the path-variable form.
