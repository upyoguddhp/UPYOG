ALTER TABLE public.eg_grbg_account
ADD COLUMN ddp_printing_done boolean DEFAULT false;

ALTER TABLE public.eg_grbg_account
ADD COLUMN ddp_dispatched boolean DEFAULT false;
