-- /ddp-dispatch/_receive now accepts and persists how many plates were
-- actually counted at receipt and any remarks from the receiving ULB staff,
-- alongside the existing received_by/ulb_receiving_date columns.
ALTER TABLE public.eg_grbg_ddp_dispatch
    ADD COLUMN IF NOT EXISTS received_count INTEGER,
    ADD COLUMN IF NOT EXISTS receiving_remarks VARCHAR(1000);
