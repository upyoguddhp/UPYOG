-- Tenant + status filters used by list, count and ddp-verification queries.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_account_tenant_status
    ON public.eg_grbg_account (tenant_id, status);
