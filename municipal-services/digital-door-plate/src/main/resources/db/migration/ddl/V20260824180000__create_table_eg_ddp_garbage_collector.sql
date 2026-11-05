CREATE TABLE IF NOT EXISTS eg_ddp_garbage_collector (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    collector_name              character varying(256) NOT NULL,
    collector_code              character varying(64),
    mobile_number               character varying(64) NOT NULL,
    email_id                    character varying(128),
    gender                      character varying(16),
    joining_date                bigint,
    address                     character varying(512),
    ulb                         character varying(128) NOT NULL,
    is_active                   boolean DEFAULT true,
    createdby                   character varying(64),
    createddate                 bigint,
    lastmodifiedby              character varying(64),
    lastmodifieddate            bigint,
    CONSTRAINT pk_eg_ddp_garbage_collector PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_garbage_collector_ulb
    ON eg_ddp_garbage_collector (tenant_id, ulb);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_garbage_collector_mobile
    ON eg_ddp_garbage_collector (mobile_number);




-- Maps an onboarded garbage collector to their egov-user login, the
-- contractor/supervisor hierarchy and their ward/house allotment
CREATE TABLE IF NOT EXISTS eg_ddp_garbage_collector_mapping (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    collector_uuid              character varying(64) NOT NULL,
    contractor_uuid             character varying(64),
    supervisor_id               character varying(64),
    collector_user_uuid         character varying(64),
    ward_number                 character varying(64),
    no_of_house_alloted         integer,
    is_active                   boolean DEFAULT true,
    createdby                   character varying(64),
    createddate                 bigint,
    lastmodifiedby              character varying(64),
    lastmodifieddate            bigint,
    CONSTRAINT pk_eg_ddp_garbage_collector_mapping PRIMARY KEY (uuid),
    CONSTRAINT fk_eg_ddp_gcm_collector FOREIGN KEY (collector_uuid)
        REFERENCES eg_ddp_garbage_collector (uuid),
    CONSTRAINT fk_eg_ddp_gcm_contractor FOREIGN KEY (contractor_uuid)
        REFERENCES eg_ddp_contractor (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_gcm_collector
    ON eg_ddp_garbage_collector_mapping (collector_uuid);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_gcm_contractor_ward
    ON eg_ddp_garbage_collector_mapping (tenant_id, contractor_uuid, ward_number);
