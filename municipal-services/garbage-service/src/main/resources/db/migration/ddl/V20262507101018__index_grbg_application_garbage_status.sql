-- Join account -> application on garbage_id; status is filtered/returned with it.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_application_garbage_status
    ON public.eg_grbg_application (garbage_id, status);
