ALTER TABLE eg_grbg_account_ddp
    ADD COLUMN ddp_rejection_action VARCHAR(20),
    ADD COLUMN reprint_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN revalidate_count INTEGER NOT NULL DEFAULT 0;
