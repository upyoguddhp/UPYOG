-- Citizen searches filter by user_uuid.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_account_user_uuid
    ON public.eg_grbg_account (user_uuid);
