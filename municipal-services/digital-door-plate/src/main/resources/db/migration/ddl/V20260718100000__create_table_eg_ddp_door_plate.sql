CREATE TABLE IF NOT EXISTS eg_ddp_door_plate (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    garbage_account_uuid        character varying(64) NOT NULL,
    garbage_id                  character varying(128),
    application_no              character varying(128),
    property_id                 character varying(128),
    ward_number                 character varying(64),
    plate_status                character varying(32) NOT NULL,
    is_qr_generated             boolean DEFAULT false,
    qr_generated_time           bigint,
    qr_generated_by             character varying(64),
    is_print_verified           boolean DEFAULT false,
    print_verified_time         bigint,
    print_verified_by           character varying(64),
    verification_latitude       numeric(10,7),
    verification_longitude      numeric(10,7),
    is_installed                boolean DEFAULT false,
    installed_time              bigint,
    installed_by                character varying(64),
    installation_latitude       numeric(10,7),
    installation_longitude      numeric(10,7),
    remarks                     character varying(512),
    additional_details          jsonb,
    is_active                   boolean DEFAULT true,
    createdby                   character varying(64),
    createddate                 bigint,
    lastmodifiedby              character varying(64),
    lastmodifieddate            bigint,
    CONSTRAINT pk_eg_ddp_door_plate PRIMARY KEY (uuid)
);

-- only one active door plate per garbage account
CREATE UNIQUE INDEX IF NOT EXISTS uq_eg_ddp_door_plate_account
    ON eg_ddp_door_plate (tenant_id, garbage_account_uuid) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_eg_ddp_door_plate_status
    ON eg_ddp_door_plate (plate_status, tenant_id);
