ALTER TABLE public.eg_grbg_account
ADD COLUMN ddp_modified_date int8;

ALTER TABLE public.eg_grbg_account
ADD COLUMN ddp_print_verified boolean DEFAULT false;