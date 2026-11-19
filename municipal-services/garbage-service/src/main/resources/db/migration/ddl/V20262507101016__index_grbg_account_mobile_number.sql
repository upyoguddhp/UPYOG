-- Search by mobile_number.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_account_mobile_number
    ON public.eg_grbg_account (mobile_number);
