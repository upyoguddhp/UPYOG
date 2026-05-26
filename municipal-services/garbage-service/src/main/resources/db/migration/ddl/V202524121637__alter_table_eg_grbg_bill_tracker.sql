ALTER TABLE public.eg_grbg_bill_tracker
ADD COLUMN penalty_amount numeric(12,2),
ADD COLUMN grbg_bill_without_penalty numeric(12,2);
