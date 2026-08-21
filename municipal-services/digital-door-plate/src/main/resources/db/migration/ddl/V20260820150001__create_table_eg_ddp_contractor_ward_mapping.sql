CREATE TABLE IF NOT EXISTS eg_ddp_contractor_ward_mapping (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    contractor_uuid             character varying(64) NOT NULL,
    ulb                         character varying(128) NOT NULL,
    ward_number                 character varying(64) NOT NULL,
    is_active                   boolean DEFAULT true,
    createdby                   character varying(64),
    createddate                 bigint,
    lastmodifiedby              character varying(64),
    lastmodifieddate            bigint,
    CONSTRAINT pk_eg_ddp_contractor_ward_mapping PRIMARY KEY (uuid),
    CONSTRAINT fk_eg_ddp_cwm_contractor FOREIGN KEY (contractor_uuid)
        REFERENCES eg_ddp_contractor (uuid)
);

-- only one active mapping per contractor per ward
CREATE UNIQUE INDEX IF NOT EXISTS uq_eg_ddp_cwm_contractor_ward
    ON eg_ddp_contractor_ward_mapping (tenant_id, contractor_uuid, ward_number) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_eg_ddp_cwm_ward
    ON eg_ddp_contractor_ward_mapping (tenant_id, ward_number);
