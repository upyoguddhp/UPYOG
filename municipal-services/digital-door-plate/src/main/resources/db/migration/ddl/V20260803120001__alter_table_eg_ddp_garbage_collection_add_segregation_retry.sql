ALTER TABLE eg_ddp_garbage_collection
    ADD COLUMN IF NOT EXISTS dry_wet_segregated boolean,
    ADD COLUMN IF NOT EXISTS next_retry_time bigint;
