ALTER TABLE public.eg_grbg_account
ADD COLUMN is_ready_for_printing boolean DEFAULT false;

ALTER TABLE public.eg_grbg_account
ADD COLUMN vendor_print_verified VARCHAR(20);

ALTER TABLE public.eg_grbg_account
ADD COLUMN ulb_verified boolean DEFAULT false;

ALTER TABLE public.eg_grbg_account
ADD COLUMN installation_done boolean DEFAULT false;

ALTER TABLE public.eg_grbg_account
ADD COLUMN ddp_latitude VARCHAR(64);

ALTER TABLE public.eg_grbg_account
ADD COLUMN ddp_longitude VARCHAR(64);
