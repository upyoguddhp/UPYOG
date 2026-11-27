-- DDP_VERIFIER's own mirror of the vendor's vendor_print_verified/ddp_rejection_reason/
-- ddp_rejection_action, kept as separate columns so one role's write never clobbers the other's.
ALTER TABLE public.eg_grbg_account_ddp
ADD COLUMN IF NOT EXISTS ulb_verification_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS ulb_rejection_reason VARCHAR(1000),
ADD COLUMN IF NOT EXISTS ulb_rejection_action VARCHAR(20);
