# egov-enc-service migration notes

Wholesale replace from `UPYOG-master-Latest/core-services/egov-enc-service` (Spring Boot 1.5.22 → 3.2.2, Java 8 → 17). No HP-specific customization found in this service beyond deployment config (DB name, tenant id, MDMS pointer) — the crypto/key-management logic itself is untouched upstream code, so a full replace was the right call (no audit-and-port needed).

## Config changes (`application.properties`)
- `spring.datasource.url` / `spring.flyway.url`: upstream default DB name `enc_service` kept as the file default — actual connection at runtime comes from `.upyog.env`'s `SPRING_DATASOURCE_URL` (points at `hpupyog_5`), same pattern as every other service in this workspace.
- `spring.flyway.table`: upstream default `flyway` kept (was `egov_enc_schema_version` in the old fork) — irrelevant either way since `.upyog.env` sets `SPRING_FLYWAY_ENABLED=false` (DB is pre-provisioned, no service runs its own migrations).
- `egov.mdms.host` / `egov.mdms.search.endpoint`: left at upstream's k8s-style defaults (`http://egov-mdms-service:8080/`, no leading slash on the endpoint) — actual value comes from `.upyog.env`'s `EGOV_MDMS_HOST=http://localhost:9080/` via relaxed binding. The trailing slash on `EGOV_MDMS_HOST` (a platform-wide fix made during the egov-user migration) is required here too: without it the concatenated URL becomes `http://localhost:9080egov-mdms-service/v1/_search`, a 404.
- `egov.state.level.tenant.id`: upstream default was `pg` (stale Punjab-demo placeholder, same class of bug found in gateway and egov-user). **Fixed to `hp` directly in the properties file**, not via env var — this property name has no `egov.` prefix stripped, so `.upyog.env`'s `STATE_LEVEL_TENANT_ID` (which binds to `state.level.tenant.id`, not `egov.state.level.tenant.id`) does not auto-override it like it does for most other services. Confirmed via direct curl to MDMS: `tenantId=pg` returns `{"MdmsRes":{}}` (empty — no such tenant), `tenantId=hp` returns the full 61-tenant list.
- `master.password.provider=software` unchanged — no AWS KMS involved in this environment.

## The "hang" that wasn't
Early in this migration the service appeared to hang indefinitely at startup, right after `HikariPool-1 - Start completed`, with the process sitting at 0% CPU. Two hypotheses were chased and ruled out:
- AWS KMS network calls — ruled out immediately (`master.password.provider=software`).
- JVM `SecureRandom` blocking on entropy during bulk RSA key generation for 61 tenants — a real, known class of issue, so `-Djava.security.egd=file:/dev/./urandom` was added to `.upyog.env`'s global `JAVA_TOOL_OPTIONS` as a preventive fix. It did not resolve the symptom, but is harmless and left in place since it's a correct hardening for any future service that generates keys in bulk.

The actual root cause: **there was no hang.** A `jstack` thread dump showed no `"main"` thread at all — because `KeyManagementService.run()` (an `ApplicationRunner`) had already completed successfully; Spring Boot logs "Started Main in X seconds" *before* `ApplicationRunner`s execute, not after, so the quiet log tail was expected. `generateKeyForNewTenants()` found all 61 `hp.*` tenants already had keys from a prior run and returned silently (that code path has no log statement on the "nothing to do" branch), so the process was sitting idle serving requests the whole time. The apparent "stuck at 0% CPU" was just an idle JVM. Confirmed via `curl http://localhost:1234/egov-enc-service/actuator/health` → `200 {"status":"UP"}`.

Lesson for future services with this same symptom (long silent gap after Hikari startup, no errors): check `actuator/health` / try an actual request before assuming a hang — Spring Boot's startup log line is not a reliable "everything after this point has finished" marker when `ApplicationRunner`/`CommandLineRunner` beans are present.

## Verification performed (this session)
Started via `upyogctl start egov-enc-service` against `hpupyog_5`:
- `GET /actuator/health` → `200 {"status":"UP"}`.
- `POST /crypto/v1/_encrypt` (tenantId `hp`, type `Normal`, value `hello-world`) → `200`, returned a `keyId|ciphertext` string.
- `POST /crypto/v1/_decrypt` (fed the ciphertext back, in the format the service actually expects — a plain JSON array of ciphertext strings, not the `encryptionRequests` wrapper used by encrypt) → `200 ["hello-world"]`. Round-trip confirmed correct.
- `POST /crypto/v1/_sign` (tenantId `hp`, value `hello-world`) → `200`, returned a `keyId|signature` string.
- `POST /crypto/v1/_verify` (same tenantId/value/signature) → `200 {"verified":true}`.

All four crypto operations work end-to-end against real per-tenant RSA/AES keys already present in `hpupyog_5` for the `hp` tenant.

**Not yet verified**: key generation for a *new* tenant not already in the keystore (would need a test tenant added to MDMS `tenant.tenants`), `/crypto/v1/_rotatekey` / `_rotateallkeys`, and behavior for tenants other than `hp` (61 tenant keys exist in the DB from a prior migration pass, but only `hp` itself was smoke-tested here).
