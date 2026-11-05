CREATE TABLE IF NOT EXISTS eg_ddp_garbage_supervisor (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    supervisor_name             character varying(256) NOT NULL,
    supervisor_code             character varying(64),
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
    CONSTRAINT pk_eg_ddp_garbage_supervisor PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_garbage_supervisor_ulb
    ON eg_ddp_garbage_supervisor (tenant_id, ulb);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_garbage_supervisor_mobile
    ON eg_ddp_garbage_supervisor (mobile_number);


-- Maps an onboarded garbage supervisor to their egov-user login, the
-- contractor they work under (optional) and their assigned ward
CREATE TABLE IF NOT EXISTS eg_ddp_garbage_supervisor_mapping (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    supervisor_uuid             character varying(64) NOT NULL,
    contractor_uuid             character varying(64),
    supervisor_user_uuid        character varying(64),
    ward_number                 character varying(64) NOT NULL,
    is_active                   boolean DEFAULT true,
    createdby                   character varying(64),
    createddate                 bigint,
    lastmodifiedby              character varying(64),
    lastmodifieddate            bigint,
    CONSTRAINT pk_eg_ddp_garbage_supervisor_mapping PRIMARY KEY (uuid),
    CONSTRAINT fk_eg_ddp_gsm_supervisor FOREIGN KEY (supervisor_uuid)
        REFERENCES eg_ddp_garbage_supervisor (uuid),
    CONSTRAINT fk_eg_ddp_gsm_contractor FOREIGN KEY (contractor_uuid)
        REFERENCES eg_ddp_contractor (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_gsm_supervisor
    ON eg_ddp_garbage_supervisor_mapping (supervisor_uuid);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_gsm_contractor_ward
    ON eg_ddp_garbage_supervisor_mapping (tenant_id, contractor_uuid, ward_number);
