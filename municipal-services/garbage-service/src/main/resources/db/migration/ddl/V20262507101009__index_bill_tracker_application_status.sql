-- Support tracker lookups/updates by application id and status
-- (e.g. expiring ACTIVE / ADVANCE_ADJUSTED trackers when a new bill is generated or paid).
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_bill_tracker_app_status
    ON public.eg_grbg_bill_tracker (grbg_application_id, status);
