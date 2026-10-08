CREATE TABLE IF NOT EXISTS eg_ddp_sync_batch (
    uuid                character varying(64) NOT NULL,
    tenant_id           character varying(64),
    staff_uuid          character varying(64),
    total_records       integer,
    created_records     integer,
    duplicate_records   integer,
    failed_records      integer,
    sync_time           bigint,
    createdby           character varying(64),
    createddate         bigint,
    CONSTRAINT pk_eg_ddp_sync_batch PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_sync_batch_staff
    ON eg_ddp_sync_batch (staff_uuid, sync_time);
