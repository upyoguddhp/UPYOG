CREATE TABLE IF NOT EXISTS eg_ddp_collector_ward_assignment (
    uuid                        character varying(64) NOT NULL,
    tenant_id                   character varying(64) NOT NULL,
    collector_uuid              character varying(64) NOT NULL,
    collector_name              character varying(256),
    mobile_number                character varying(64),
    contractor_uuid             character varying(64) NOT NULL,
    ward_number                 character varying(64) NOT NULL,
    assignment_status           character varying(32) NOT NULL,
    assigned_time               bigint,
    assigned_by                 character varying(64),
    unassigned_time             bigint,
    unassigned_by               character varying(64),
    is_active                   boolean DEFAULT true,
    createdby                   character varying(64),
    createddate                 bigint,
    lastmodifiedby              character varying(64),
    lastmodifieddate            bigint,
    CONSTRAINT pk_eg_ddp_collector_ward_assignment PRIMARY KEY (uuid),
    CONSTRAINT fk_eg_ddp_cwa_contractor FOREIGN KEY (contractor_uuid)
        REFERENCES eg_ddp_contractor (uuid)
);

-- only one active assignment per collector per ward
CREATE UNIQUE INDEX IF NOT EXISTS uq_eg_ddp_cwa_collector_ward
    ON eg_ddp_collector_ward_assignment (tenant_id, collector_uuid, ward_number)
    WHERE assignment_status = 'ASSIGNED' AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_eg_ddp_cwa_contractor_ward
    ON eg_ddp_collector_ward_assignment (tenant_id, contractor_uuid, ward_number);
