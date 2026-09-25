ALTER TABLE eg_ddp_contractor
    ADD COLUMN IF NOT EXISTS contractor_code character varying(64);

ALTER TABLE eg_ddp_contractor_ward_mapping
    ADD COLUMN IF NOT EXISTS contractor_user_uuid character varying(64);
