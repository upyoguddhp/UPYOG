-- Join key to application, address, collection unit and old details (garbage_id) and the garbage_id search filter.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_account_garbage_id
    ON public.eg_grbg_account (garbage_id);
