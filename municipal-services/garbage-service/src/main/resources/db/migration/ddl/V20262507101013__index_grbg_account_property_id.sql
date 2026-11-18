-- Search by property_id.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_account_property_id
    ON public.eg_grbg_account (property_id);
