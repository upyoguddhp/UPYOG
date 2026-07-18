# Digital Door Plate Service — API Document

Spring Boot service for **garbage collector attendance**, **door-to-door garbage collection tracking**
(online + offline sync) and the **ULB official door plate lifecycle** (QR generation → print
verification → installation).

| | |
| --- | --- |
| Service port | `1239` |
| Context path | `/digital-door-plate` |
| Via gateway (zuul) | `http://<gateway-host>:8080/digital-door-plate/...` |
| Direct (dev) | `http://localhost:1239/digital-door-plate/...` |
| Database | `hp_udd_dev` (tables `eg_ddp_attendance`, `eg_ddp_garbage_collection`, `eg_ddp_door_plate`, `eg_ddp_sync_batch`) |
| Dependencies | `egov-enc-service` (QR decrypt), `garbage-service` (account search), Kafka (async persistence of collection records) |

**Peak load design**: collection happens in a statewide morning window across all ULBs, so the
write path is asynchronous — `_create` and `_sync` validate/enrich and publish to the kafka
topic `save-ddp-garbage-collection`; `GarbageCollectionPersistConsumer` drains it into
`eg_ddp_garbage_collection` at the DB's pace. The DB unique index on `client_ref_id` is the
final duplicate guard, so kafka redeliveries and re-synced device queues are safe.

## Conventions

- **All endpoints are POST.** The body always carries `RequestInfo` with the `authToken`
  (UPYOG standard); zuul validates the token and RBAC before forwarding.
- Every response carries `ResponseInfo` with `status: "successful"`.
- Timestamps are **epoch milliseconds** (`Asia/Kolkata` for day boundaries).
- Latitude/longitude are decimals (`numeric(10,7)`).
- Every entity (`attendance`, `garbageCollections[]`, `doorPlates[]`) accepts an optional
  free-form **`additionalDetails`** json object, stored as `jsonb` and returned as-is on
  search — use it for future fields without schema changes.
- Errors are thrown as UPYOG `CustomException` and returned by the tracer error handler:

```json
{
  "ResponseInfo": null,
  "Errors": [ { "code": "INVALID_REQUEST", "message": "TenantId is mandatory..." } ]
}
```

### Error codes

| Code | Thrown when |
| --- | --- |
| `INVALID_REQUEST` | Missing mandatory input (tenantId, lat/long on start duty / verify / install, userInfo, uuid on update, clientRefId on sync ...) |
| `INVALID_QR` | Scanned data empty, undecryptable/unparseable, or missing the account id |
| `INVALID_SEARCH` | Search called without criteria |
| `ATTENDANCE_NOT_FOUND` | `_endDuty` without a running duty |
| `ATTENDANCE_ALREADY_MARKED` | `_startDuty` when attendance was already marked (and ended) today — one attendance per staff per day, enforced by a DB unique index on `(staff_uuid, tenant_id, duty_date)` |
| `GARBAGE_ACCOUNT_NOT_FOUND` | `_scan` found no active garbage account for the QR |
| `COLLECTION_NOT_FOUND` | `_update` for an unknown collection uuid |
| `DOOR_PLATE_NOT_FOUND` | `_verifyPrint`/`_install` before `_generate` |
| `INVALID_PLATE_STATUS` | `_verifyPrint` before QR generation, or `_install` before print verification |
| `DECRYPTION ERROR` | egov-enc-service call failed |
| `GARBAGE_SEARCH_FAILED` | garbage-service returned no response |

---

# 1. Attendance (garbage collector)

## 1.1 Start duty — `POST /digital-door-plate/attendance/_startDuty`

Marks attendance. `latitude`/`longitude` are **mandatory**. `staffUuid`, `staffName` and
`tenantId` default from `RequestInfo.userInfo`. **One attendance per staff per day**: if a
duty is already running today the existing record is returned (idempotent); if today's duty
was already ended, the call fails with `ATTENDANCE_ALREADY_MARKED`.

```json
{
  "RequestInfo": { "apiId": "Rainmaker", "authToken": "<token>" },
  "attendance": {
    "tenantId": "hp.GB",
    "latitude": 31.1048200,
    "longitude": 77.1734400,
    "remarks": "optional",
    "additionalDetails": { "deviceId": "optional-free-form-json" }
  }
}
```

Response:

```json
{
  "ResponseInfo": { "status": "successful" },
  "attendances": [ {
    "uuid": "e1c9...",
    "tenantId": "hp.GB",
    "staffUuid": "7fe1d1ba-...",
    "staffName": "GC-SHIMLA-01",
    "dutyStatus": "STARTED",
    "startTime": 1752817000000,
    "endTime": null,
    "latitude": 31.1048200,
    "longitude": 77.1734400,
    "isActive": true
  } ]
}
```

## 1.2 End duty — `POST /digital-door-plate/attendance/_endDuty`

Closes the running duty (today's open record of the staff, or by explicit `attendance.uuid`).
Sets `endTime` and `dutyStatus: "ENDED"`.

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "attendance": { "tenantId": "hp.GB", "remarks": "optional" }
}
```

Response: same shape as start duty, with `dutyStatus: "ENDED"` and `endTime` filled.

## 1.3 Search — `POST /digital-door-plate/attendance/_search`

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "searchCriteriaAttendance": {
    "staffUuid": ["7fe1d1ba-..."],
    "tenantId": "hp.GB",
    "dutyStatus": ["STARTED", "ENDED"],
    "fromDate": 1751328000000,
    "toDate": 1753919999999,
    "isActive": true,
    "offset": 0,
    "limit": 50
  }
}
```

All criteria fields are optional; list fields accept multiple values. Response:
`{ "ResponseInfo": ..., "attendances": [ ... ] }` ordered by `startTime` desc.

## 1.4 Monthly / weekly summary — `POST /digital-door-plate/attendance/_summary`

One call for the mobile attendance screen of an **individual** collector. Everything except
the token is optional — defaults: logged-in user, current month/year.

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "tenantId": "hp.GB",
  "staffUuid": "optional",
  "month": 7,
  "year": 2026
}
```

Response:

```json
{
  "ResponseInfo": { "status": "successful" },
  "staffUuid": "7fe1d1ba-...",
  "tenantId": "hp.GB",
  "month": 7,
  "year": 2026,
  "totalDaysInMonth": 31,
  "monthlyDaysPresent": 18,
  "weeklyDaysPresent": 4,
  "monthlyDutyDurationMillis": 460800000,
  "weeklyDutyDurationMillis": 115200000,
  "dailyAttendances": [
    { "date": "2026-07-01", "present": true, "startTime": 1751330400000,
      "endTime": 1751359200000, "durationMillis": 28800000, "dutyStatus": "ENDED" },
    { "date": "2026-07-02", "present": false }
  ]
}
```

Notes: every calendar day of the month is returned (absent days have `present: false`);
"weekly" is the current week Monday–Sunday (fetched separately, so it works across month
boundaries); multiple duties in a day are merged (earliest start, latest end, durations summed).

---

# 2. Garbage collection (garbage collector)

## 2.1 Scan QR — `POST /digital-door-plate/garbage-collection/_scan`

Called when the collector scans the QR on a property. `scannedData` is the encrypted QR
payload; the service decrypts it via egov-enc-service (falls back to plain JSON for testing),
parses `{"id": "<garbage account uuid>", "useruuid": "<user uuid>"}` and searches the active
garbage account (with active sub accounts) from garbage-service.

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "tenantId": "hp.GB",
  "scannedData": "<encrypted-qr-payload>"
}
```

Response:

```json
{
  "ResponseInfo": { "status": "successful" },
  "qrData": { "id": "7fe1d1ba-...", "useruuid": "a2b4c6d8-..." },
  "garbageAccounts": [ { "... full garbage-service account object ..." } ],
  "alreadyCollectedToday": false,
  "todaysCollections": []
}
```

The frontend renders the account/owner/sub-account (tenant) details from `garbageAccounts`
and can warn via `alreadyCollectedToday`.

## 2.2 Submit collection (online) — `POST /digital-door-plate/garbage-collection/_create`

One record per account/sub-account (tenant). `tenantId` and `garbageAccountUuid` are
mandatory per record; `staffUuid` defaults to the logged-in user, `collectionTime` to now,
`isCollected` to `true`.

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "garbageCollections": [ {
    "tenantId": "hp.GB",
    "attendanceUuid": "e1c9...",
    "garbageAccountUuid": "7fe1d1ba-...",
    "subAccountUuid": "optional-per-tenant",
    "garbageId": "GB/HP/SML/2026/50",
    "applicationNo": "GB/HP/Shimla/Shimla/052026/50",
    "propertyId": "optional",
    "wardNumber": "W-07",
    "isResidentAvailable": true,
    "wasteType": "WET",
    "isWasteKeptOutside": false,
    "appliedToAllTenants": true,
    "latitude": 31.1048200,
    "longitude": 77.1734400,
    "remarks": "optional"
  } ]
}
```

`wasteType`: `WET` | `DRY` | `MIXED`. Response:
`{ "ResponseInfo": ..., "garbageCollections": [ ...enriched with uuid, audit... ] }`

The response returns the enriched records immediately; the DB write itself happens
asynchronously via kafka (see peak load design above).

## 2.3 Offline sync — `POST /digital-door-plate/garbage-collection/_sync`

The mobile app stores scans locally and a scheduler posts the queued records every 5 minutes.
Same record shape as `_create` **plus a mandatory device-generated `clientRefId`** per record.

- **Idempotent**: `clientRefId` is unique in the DB — re-sent records return `DUPLICATE`,
  so the same file can be retried safely after a network failure.
- **Record-independent**: a bad record is `FAILED` with its error; the rest still insert.
- `collectionTime` must be the scan time recorded on the device (not the sync time).
- Every batch is audited in `eg_ddp_sync_batch`; rows carry `syncBatchUuid`.

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "garbageCollections": [ {
    "clientRefId": "dev-9f31-0001",
    "tenantId": "hp.GB",
    "garbageAccountUuid": "7fe1d1ba-...",
    "wardNumber": "W-07",
    "isResidentAvailable": true,
    "wasteType": "DRY",
    "isWasteKeptOutside": true,
    "collectionTime": 1752817000000,
    "latitude": 31.1048200,
    "longitude": 77.1734400
  } ]
}
```

Response — the app clears its local queue based on `recordResults`:

```json
{
  "ResponseInfo": { "status": "successful" },
  "syncBatchUuid": "0b7c...",
  "totalRecords": 3,
  "createdRecords": 2,
  "duplicateRecords": 1,
  "failedRecords": 0,
  "recordResults": [
    { "clientRefId": "dev-9f31-0001", "uuid": "31aa...", "status": "QUEUED" },
    { "clientRefId": "dev-9f31-0002", "status": "DUPLICATE" },
    { "clientRefId": "dev-9f31-0003", "uuid": "42bb...", "status": "QUEUED" }
  ]
}
```

Record statuses: `QUEUED` (accepted, persisted asynchronously via kafka) | `DUPLICATE` |
`FAILED` (validation error, with `errorMessage`). The app can clear `QUEUED` and `DUPLICATE`
records from its local queue; only `FAILED` ones need attention.

## 2.4 Update — `POST /digital-door-plate/garbage-collection/_update`

Corrects a submitted record. `uuid` mandatory per record; updatable fields:
`isResidentAvailable`, `wasteType`, `isWasteKeptOutside`, `isCollected`,
`appliedToAllTenants`, `collectionTime`, `latitude`, `longitude`, `remarks`, `isActive`
(soft delete = `isActive: false`). Omitted `collectionTime`/`latitude`/`longitude` are preserved.

## 2.5 Search — `POST /digital-door-plate/garbage-collection/_search`

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "searchCriteriaGarbageCollection": {
    "garbageAccountUuid": ["7fe1d1ba-..."],
    "staffUuid": ["..."],
    "attendanceUuid": ["..."],
    "applicationNo": ["..."],
    "propertyId": ["..."],
    "wardNumber": ["W-07"],
    "wasteType": ["WET"],
    "clientRefId": ["..."],
    "tenantId": "hp.GB",
    "isCollected": true,
    "fromDate": 1752777000000,
    "toDate": 1752863399999,
    "isActive": true,
    "offset": 0,
    "limit": 50
  }
}
```

Response: `{ "ResponseInfo": ..., "garbageCollections": [ ... ] }` ordered by
`collectionTime` desc.

---

# 3. Door plate lifecycle (ULB official)

One active door plate per garbage account. Status flow (order enforced):
`QR_GENERATED` → `PRINT_VERIFIED` → `INSTALLED`. Flags `isQrGenerated`,
`isPrintVerified`, `isInstalled` are kept individually, with who/when per stage.
**Latitude/longitude are mandatory and stored separately for verification and installation.**

## 3.1 Stage 1: QR generated — `POST /digital-door-plate/door-plate/_generate`

Records that the QR code has been generated against the garbage id/account. Accepts a list
(bulk). Accounts that already have an active plate are skipped and returned as-is.

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "doorPlates": [ {
    "tenantId": "hp.GB",
    "garbageAccountUuid": "7fe1d1ba-...",
    "garbageId": "GB/HP/SML/2026/50",
    "applicationNo": "GB/HP/Shimla/Shimla/052026/50",
    "propertyId": "optional",
    "wardNumber": "W-07"
  } ]
}
```

Response:

```json
{
  "ResponseInfo": { "status": "successful" },
  "doorPlates": [ {
    "uuid": "77ab...",
    "tenantId": "hp.GB",
    "garbageAccountUuid": "7fe1d1ba-...",
    "plateStatus": "QR_GENERATED",
    "isQrGenerated": true, "qrGeneratedTime": 1752900000000, "qrGeneratedBy": "<official uuid>",
    "isPrintVerified": false,
    "isInstalled": false,
    "isActive": true
  } ]
}
```

## 3.2 Stage 2: print verification — `POST /digital-door-plate/door-plate/_verifyPrint`

After printing, the official scans the printed QR and confirms the data is correct.
Provide **either** `scannedData` (encrypted QR payload — decrypted server side) **or**
`garbageAccountUuid`. `latitude`/`longitude` **mandatory**.
Fails with `INVALID_PLATE_STATUS` if the QR was never generated.

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "tenantId": "hp.GB",
  "scannedData": "<encrypted-qr-payload>",
  "latitude": 31.1048200,
  "longitude": 77.1734400,
  "remarks": "printed data matches"
}
```

Response: the plate with `plateStatus: "PRINT_VERIFIED"`, `isPrintVerified: true`,
`printVerifiedTime/By` and `verificationLatitude/Longitude` set.

## 3.3 Stage 3: installation — `POST /digital-door-plate/door-plate/_install`

The QR plate is installed on the household. Same request shape as `_verifyPrint`;
`latitude`/`longitude` **mandatory** (location of the installed plate).
Fails with `INVALID_PLATE_STATUS` if print verification hasn't happened.

Response: the plate with `plateStatus: "INSTALLED"`, `isInstalled: true`,
`installedTime/By` and `installationLatitude/Longitude` set.

## 3.4 Search — `POST /digital-door-plate/door-plate/_search`

```json
{
  "RequestInfo": { "authToken": "<token>" },
  "searchCriteriaDoorPlate": {
    "garbageAccountUuid": ["7fe1d1ba-..."],
    "applicationNo": ["..."],
    "propertyId": ["..."],
    "wardNumber": ["W-07"],
    "plateStatus": ["QR_GENERATED", "PRINT_VERIFIED", "INSTALLED"],
    "tenantId": "hp.GB",
    "isQrGenerated": true,
    "isPrintVerified": false,
    "isInstalled": false,
    "isActive": true,
    "offset": 0,
    "limit": 50
  }
}
```

Useful worklists: `isPrintVerified: false` → pending print verification;
`isPrintVerified: true, isInstalled: false` → pending installation.
Response: `{ "ResponseInfo": ..., "doorPlates": [ ... ] }` ordered by `createddate` desc.

---

# 4. Deployment / integration checklist

- **Zuul route** (already added): `zuul.routes.digital-door-plate.path=/digital-door-plate/**`
  → `http://localhost:1239` (`stripPrefix=false`). Rebuild + restart zuul after route changes.
- **RBAC**: create one access-control action per URL below and bind to the relevant roles
  (collector app role for attendance + garbage-collection; ULB official role for door-plate):

  ```
  /digital-door-plate/attendance/_startDuty
  /digital-door-plate/attendance/_endDuty
  /digital-door-plate/attendance/_search
  /digital-door-plate/attendance/_summary
  /digital-door-plate/garbage-collection/_scan
  /digital-door-plate/garbage-collection/_create
  /digital-door-plate/garbage-collection/_update
  /digital-door-plate/garbage-collection/_search
  /digital-door-plate/garbage-collection/_sync
  /digital-door-plate/door-plate/_generate
  /digital-door-plate/door-plate/_verifyPrint
  /digital-door-plate/door-plate/_install
  /digital-door-plate/door-plate/_search
  ```

- **Build & run** (needs JDK 8–17; system JDK 25 is too new for this Lombok):

  ```bash
  ./mvnw package -DskipTests
  java -jar target/digital-door-plate-0.0.1-SNAPSHOT.jar
  ```

  Flyway creates/updates the four `eg_ddp_*` tables on startup
  (history table `hp_ddp_schema_version`).
- **Config** (`application.properties`): `egov.enc.host` (dev `localhost:1234`),
  `egov.garbage.service.host` (dev `localhost:1235`), datasource for `hp_udd_dev`,
  `kafka.config.bootstrap_server_config` + `spring.kafka.*` (dev `localhost:9092`),
  topic `kafka.topics.save.garbage.collection=save-ddp-garbage-collection`.
- **Kafka**: the topic `save-ddp-garbage-collection` must exist (or auto-create enabled).
  For statewide scale, create it with multiple partitions and key messages per tenant if
  ordering per ULB is needed; consumer group `egov-ddp-services`.
