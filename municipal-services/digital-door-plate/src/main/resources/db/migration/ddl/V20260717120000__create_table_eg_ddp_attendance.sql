CREATE TABLE IF NOT EXISTS eg_ddp_attendance (
    uuid                character varying(64) NOT NULL,
    tenant_id           character varying(64) NOT NULL,
    staff_uuid          character varying(64) NOT NULL,
    staff_name          character varying(256),
    mobile_number       character varying(16),
    duty_status         character varying(32) NOT NULL,
    duty_date           date,
    start_time          bigint,
    end_time            bigint,
    latitude            numeric(10,7),
    longitude           numeric(10,7),
    remarks             character varying(512),
    additional_details  jsonb,
    is_active           boolean DEFAULT true,
    createdby           character varying(64),
    createddate         bigint,
    lastmodifiedby      character varying(64),
    lastmodifieddate    bigint,
    CONSTRAINT pk_eg_ddp_attendance PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_attendance_staff
    ON eg_ddp_attendance (staff_uuid, tenant_id, duty_status);

CREATE INDEX IF NOT EXISTS idx_eg_ddp_attendance_start_time
    ON eg_ddp_attendance (start_time);

-- attendance can be marked only once per staff per day
CREATE UNIQUE INDEX IF NOT EXISTS uq_eg_ddp_attendance_day
    ON eg_ddp_attendance (staff_uuid, tenant_id, duty_date) WHERE is_active = true;
