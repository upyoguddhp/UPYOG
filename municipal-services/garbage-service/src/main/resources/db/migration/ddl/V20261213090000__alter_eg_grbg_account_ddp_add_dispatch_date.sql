-- ddp_dispatched already exists (added in V20260718100000); kept here with
-- IF NOT EXISTS so this migration is safe to apply regardless of history.
ALTER TABLE public.eg_grbg_account_ddp
ADD COLUMN IF NOT EXISTS ddp_dispatched boolean DEFAULT false;

ALTER TABLE public.eg_grbg_account_ddp
ADD COLUMN IF NOT EXISTS ddp_dispatch_date int8;
