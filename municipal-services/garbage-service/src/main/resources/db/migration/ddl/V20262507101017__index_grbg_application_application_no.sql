-- Search by application_no (app.application_no IN (...)).
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_application_application_no
    ON public.eg_grbg_application (application_no);
