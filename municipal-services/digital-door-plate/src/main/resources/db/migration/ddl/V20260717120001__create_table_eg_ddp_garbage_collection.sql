CREATE TABLE IF NOT EXISTS eg_ddp_garbage_collection (
    uuid                    character varying(64) NOT NULL,
    tenant_id               character varying(64) NOT NULL,
    attendance_uuid         character varying(64),
    staff_uuid              character varying(64),
    garbage_account_uuid    character varying(64) NOT NULL,
    sub_account_uuid        character varying(64),
    garbage_id              character varying(128),
    application_no          character varying(128),
    property_id             character varying(128),
    ward_number             character varying(64),
    is_resident_available   boolean,
    waste_type              character varying(32),
    is_waste_kept_outside   boolean,
    is_collected            boolean DEFAULT true,
    applied_to_all_tenants  boolean DEFAULT false,
    collection_time         bigint,
    latitude                numeric(10,7),
    longitude               numeric(10,7),
    client_ref_id           character varying(128),
    sync_batch_uuid         character varying(64),
    remarks                 character varying(512),
    additional_details      jsonb,
    is_active               boolean DEFAULT true,
    createdby               character varying(64),
    createddate             bigint,
    lastmodifiedby          character varying(64),
    lastmodifieddate        bigint,
    CONSTRAINT pk_eg_ddp_garbage_collection PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_grbg_collection_account
    ON eg_ddp_garbage_collection (garbage_account_uuid, tenant_id);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_grbg_collection_staff
    ON eg_ddp_garbage_collection (staff_uuid);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_grbg_collection_ward
    ON eg_ddp_garbage_collection (tenant_id, ward_number);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_grbg_collection_time
    ON eg_ddp_garbage_collection (collection_time);

-- offline synced records from the mobile device are deduplicated on the
-- client generated reference id
CREATE UNIQUE INDEX IF NOT EXISTS uq_eg_ddp_grbg_collection_client_ref
    ON eg_ddp_garbage_collection (client_ref_id) WHERE client_ref_id IS NOT NULL;
