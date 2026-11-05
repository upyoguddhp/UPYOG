CREATE TABLE IF NOT EXISTS eg_ddp_contractor (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    type                        character varying(32) NOT NULL,
    organisation_name           character varying(256) NOT NULL,
    organisation_contact        character varying(64) NOT NULL,
    ulb                         character varying(128) NOT NULL,
    organisation_address        character varying(512),
    organisation_pincode        character varying(16),
    gender                      character varying(16),
    start_date                  bigint,
    end_date                    bigint,
    contractor_name             character varying(256),
    contractor_father_name      character varying(256),
    contractor_contact_number   character varying(64),
    contractor_email            character varying(128),
    contractor_address          character varying(512),
    contractor_pincode          character varying(16),
    contractor_dob              bigint,
    additional_details          jsonb,
    status                      character varying(32) NOT NULL,
    is_active                   boolean DEFAULT true,
    createdby                   character varying(64),
    createddate                 bigint,
    lastmodifiedby              character varying(64),
    lastmodifieddate            bigint,
    CONSTRAINT pk_eg_ddp_contractor PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_contractor_ulb
    ON eg_ddp_contractor (tenant_id, ulb);
