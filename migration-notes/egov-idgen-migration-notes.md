# egov-idgen migration notes

Wholesale replace from `UPYOG-master-Latest/core-services/egov-idgen` (Spring Boot 2.2.13 → 3.2.2, Java 8 → 17, `javax.validation` → `jakarta.validation`), with one HP-specific customization audited from git history and ported forward.

## HP customization found and ported: state-level tenant override
Commit `2d9740561f` ("idgen tenant chnaged to state level") forces every `IdRequest`'s `tenantId` to `"hp"` inside `IdGenerationService.generateIdResponse()`, regardless of what tenant the caller actually passed. Confirmed upstream has no equivalent logic — it uses whatever `tenantId` the caller supplies as-is.

This matters because MDMS-based ID *formats* (`idformat.from.mdms=true`) are looked up by `(idName, tenantId)`, and HP's format masters are defined only under the state-level `hp` tenant, not per-ULB. Without the override, a request from e.g. `hp.shimla` would fail to find a format and error out.

Ported with one improvement: the original HP patch hardcoded `"hp"` as a `private static final String` in Java code. Re-implemented as an externalized `@Value("${state.level.tenant.id}")` field instead, matching the property name `egov-user` already uses successfully — this binds automatically to `.upyog.env`'s `STATE_LEVEL_TENANT_ID=hp` via Spring relaxed binding (no "egov." prefix mismatch, unlike the `egov.state.level.tenant.id` bug hit in `egov-enc-service`). Same behavior, but now configurable without a code change.

All other diffed files (`IdGenerationController.java`, the `model/*.java` DTOs) are pure `javax.validation` → `jakarta.validation` import renames from the Boot 3 upgrade, not customization — confirmed by reading every diff.

## Config changes (`application.properties`)
- `mdms.service.host`: upstream default `https://dev.digit.org/`. This property name (no `egov.` prefix) isn't auto-overridden by `.upyog.env`'s `EGOV_MDMS_HOST` — same class of bug as `egov-enc-service`'s `egov.state.level.tenant.id`. Fixed directly to `http://localhost:9080/`, the mdms-v2 cutover host.
- `state.level.tenant.id=hp` added (see above).
- `spring.datasource.*`: left at upstream defaults (`rainmaker_new`) — irrelevant, `.upyog.env`'s `SPRING_DATASOURCE_URL` overrides at runtime, same as every other service.
- No Flyway block in upstream's `application.properties` at all (the fork's committed version had one pointing at `hp_udd_dev`, added by an unrelated historical commit) — not reintroduced; irrelevant since `.upyog.env` sets `SPRING_FLYWAY_ENABLED=false` globally.
- `server.port=8088` / context path `/egov-idgen` unchanged, no `.upyog-env/egov-idgen.env` override exists or was needed.
- Health endpoint is exposed at `/egov-idgen/health`, not `/egov-idgen/actuator/health` — `management.endpoints.web.base-path=/` maps `health` to the servlet root rather than the default `/actuator` prefix.

## Verification performed (this session)
Started via `upyogctl start egov-idgen` against `hpupyog_5`:
- Started clean in <1s, no errors.
- `GET /egov-idgen/health` → `200 {"status":"UP"}`.
- `POST /id/_generate` for `idName=pgr.servicerequestid`, `tenantId=hp.shimla` → `200`, returned `HP-PGR-2026-09-09-007249` (MDMS-driven format resolved correctly under the forced `hp` tenant despite the caller passing a ULB tenant).
- Repeated with `tenantId=hp.kullu` → `200`, returned `...-007250` — confirms the underlying Postgres sequence (`seq_eg_pgr_id`, a real production sequence already at value 7248 from prior live usage) increments correctly and consistently regardless of which tenant makes the request, proving the state-level override is live and load-bearing (not a no-op).

**Not yet verified**: `autocreate.new.seq`/`autocreate.request.seq` paths (both `false` by default, not exercised), behavior when an idName has no existing sequence and auto-create is off (should throw `SEQ_DOES_NOT_EXIST`, not tested), and MDMS format lookup for id names other than `pgr.servicerequestid`.
