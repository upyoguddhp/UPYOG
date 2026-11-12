-- ddp_print_verified is declared immediately after vendor_print_verified here (Postgres has no
-- ADD COLUMN ... AFTER, so this only fixes the logical/definition order, not physical column order).
ALTER TABLE public.eg_grbg_account_ddp
ADD COLUMN IF NOT EXISTS ddp_print_verified boolean DEFAULT false;

-- dispatch batch number assigned to this plate once it is scanned into a dispatch batch
ALTER TABLE public.eg_grbg_account_ddp
ADD COLUMN IF NOT EXISTS batch_no VARCHAR(64);

CREATE INDEX IF NOT EXISTS idx_eg_grbg_account_ddp_batch_no ON public.eg_grbg_account_ddp (batch_no);
