# Zuul → Spring Cloud Gateway migration notes

Source of truth used: `core-services/zuul/src/main/resources/{routes.properties,limiter.properties,application.properties}` as they stood on branch `replace/zuul-to-spring-cloud-gateway` before removal. New module copied from `UPYOG-master-Latest/core-services/gateway`.

## Routing (114 routes in the new `routes.properties`)
- All 108 unique route ids from the old config carried over 1:1 (`stripPrefix` was `false` everywhere, so no `StripPrefix` filters were needed).
- Two ids were declared twice in the old file with different targets; Spring property binding takes the **last** occurrence, same as it did in Zuul, so:
  - `asset-services` → `http://localhost:9081/` (not the earlier `8082` value, which was dead).
  - `egov-mdms-service-test` → both declarations were identical (`localhost:8084`), no change in behavior.
- `hpud-dms-service` (the standalone Alfresco DMS service, `/hpud-dms-service/** → localhost:8095`) is preserved — it's not part of `UPYOG-master-Latest` but was routed through the old gateway and still needs to be.

## Rate limiting
Spring Cloud Gateway's `RequestRateLimiter` is per-route, unlike Zuul's compound `{url, origin|user}` policy types. Translated as:
- **6 policies scoped to a sub-path of a broader route** → added as narrower routes placed *before* their broader counterpart (first-match-wins), each carrying the `RequestRateLimiter` filter: `user-citizen-create-ratelimit`, `user-oauth-token-ratelimit`, `filestore-url-ratelimit`, `tl-services-create-ratelimit`, `property-services-create-ratelimit`, `pgr-services-create-ratelimit`.
- **1 policy scoped to a whole route** (`user-otp`, `type=url=/user-otp,origin`) → filter added directly on the existing `user-otp` route.
- **`origin`** → `key-resolver: #{@ipKeyResolver}` (by client IP); **`user`** → `key-resolver: #{@userKeyResolver}` (extracts `RequestInfo.userInfo.uuid`) — both beans already existed in the copied module's `RateLimiterConfiguration`.
- Zuul's `{limit, quota, refresh-interval}` was approximated as Redis token-bucket `replenishRate=1, burstCapacity=<limit>` for every policy — allows an initial burst equal to the old limit, then refills slowly (1/sec). Not an exact algorithm match, but **verified working end-to-end**: hammering `/user/citizen/_create` (burst=5) let exactly 5 requests through before returning `429` on the 6th+.
- **`policy-list.user[1]` was declared twice** in the old `limiter.properties` (password-nologin-update, limit 4; then oauth-token, limit 6) — the second declaration silently overwrote the first under the same array index, so **the nologin-update rate limit was already dead in production**. Only the oauth-token limit was ported; the dead policy is not resurrected.
- **`default-policy-list[0]`** (`/edcr/rest/dcr/scrutinize`, limit 5) has no matching route anywhere in `routes.properties` — it was already unreachable/dead. Not ported as an active rule (nothing to attach it to); the same path is still listed in `egov.mixed-mode-endpoints-whitelist` for fidelity in case another entry point reaches it.

## Security / whitelist config (`application.properties`)
- `egov.open-endpoints-whitelist`: the old value had a corrupted prefix (`egov-open-endpoints-whitelist: "` pasted directly into the property value). Left as-is, this would have broken matching on the very first entry, `/user/oauth/token` (the login/token endpoint), since the list is comma-split. **Cleaned** before porting. Verified: hitting a whitelisted path (`/user/citizen/_create`) with no auth token skipped the auth gate (got a `500` from the missing backend, not a `401`); hitting a non-whitelisted path (`/property-services/property/_search`) with no token correctly got `401` from `AuthPreCheckFilter`.
- `egov.mixed-mode-endpoints-whitelist`: HP's list ported in full (superset of the module's upstream default — adds `/pgr-services/v2/request/_searchwithoutauth` and `/rdf-monitoring/sevabandhu/_getreviewrattingsummery`).
- `egov.encrypted-endpoints-list`: old zuul had no equivalent concept; kept the new module's own default (`/user/oauth/token,/filestore/v1/files`).
- `egov.statelevel.tenant`: old zuul hardcoded `pb` (stale Punjab-demo leftover, inconsistent with everything else in this workspace). **Corrected to `hp`**, matching `STATE_LEVEL_TENANT_ID=hp` in `.upyog.env` and `mdms/data/hp/`.
- `egov.authorize.access.control.host`: carried over verbatim as `http://localhost:8091/` from old zuul — note this doesn't match the `/access/**` route's own backend port (`8082`) in `routes.properties`. **Not changed** since it's unclear which is actually correct; flag for verification once `egov-accesscontrol` is migrated/running.
- Sensitive header stripping (`zuul.sensitiveHeaders=Cookie,Set-Cookie,auth-token`) had no equivalent in the copied module — added as three `RemoveRequestHeader` global `default-filters`. Not independently load-tested here (needs a live backend that sets these headers) but the config is syntactically valid — the app started clean with it in place.

## Health / observability
- The module has **no explicit actuator dependency in its `pom.xml`**, but `spring-cloud-starter-gateway` transitively pulls one in — `GET /actuator/health` works out of the box and returned `{"status":"UP"}` in testing. (Earlier note in this migration incorrectly said there was no health endpoint at all — corrected here.) Only `health` is exposed (Spring Boot's default); nothing else under `/actuator` is turned on.

## Infra glue
- Spring Boot 3.x renamed `spring.redis.*` → `spring.data.redis.*`; added `SPRING_DATA_REDIS_HOST`/`SPRING_DATA_REDIS_PORT` to `.upyog.env` alongside the existing `SPRING_REDIS_*` pair (same dual-naming pattern already used there for Flyway).
- No local Jaeger/OTLP collector exists in this workspace; `otel.traces.exporter` set to `none` instead of pointing at the unreachable `jaeger-collector.tracing` k8s host.
- Multipart upload cap bumped from the module's default 100MB to 500MB (`spring.codec.max-in-memory-size` + the hardcoded constant in `MultipartGatewayConfig.java`), matching old zuul's `spring.servlet.multipart.max-file-size=500MB` — relevant to `hpud-dms-service` uploads routed through this gateway.
- `.upyog-env/gateway.env` created with `SERVER_PORT=8082`, same port `zuul.env` used, so nothing downstream needs to change.
- **Build note**: this module requires JDK 17 (Lombok 1.18.22 doesn't support newer javac internals). `mvn` must run with `JAVA_HOME` pointed at the JDK 17 install `.upyog.env` already specifies — running with a newer system-default JDK on `PATH` produces a wall of misleading "cannot find symbol" errors for every Lombok-generated method (`log`, `builder()`, getters). `upyogctl` sources `.upyog.env` before building/starting, so this is already handled for anyone using it; only matters if invoking `mvn` directly outside `upyogctl`.

## Verification performed (this session)
Ran `upyogctl start gateway` alone (Zuul was not running, so no side-by-side port juggling was needed) against `hpupyog_5`, local Redis, and local Kafka:
- Started clean in ~11s, no errors.
- `GET /actuator/health` → `200 {"status":"UP"}`.
- `POST /user/citizen/_create` (open-whitelisted, no token) → `500` (backend not running, but passed the auth gate — proves whitelist matched).
- `GET /property-services/property/_search` (not whitelisted, no token) → `401` (proves auth gate correctly blocks unlisted paths).
- `POST /hpud-dms-service/dms/uploadAttachments` (whitelisted DMS route) → `500` (backend not running, but route matched — proves the DMS route survived the port).
- 8 rapid `POST /user/citizen/_create` → first 5 succeeded (reached the missing backend, `500`), requests 6-8 got `429` — confirms the ported rate limiter is live and correctly scoped to the narrower route.

**Not yet verified** (needs the actual backend services running, out of scope for this pass): real 2xx responses end-to-end, RBAC filter behavior with a real token, correlation-id propagation, and the `egov.authorize.access.control.host` port discrepancy noted above. Recommend re-checking these as each backend service gets migrated/started.
