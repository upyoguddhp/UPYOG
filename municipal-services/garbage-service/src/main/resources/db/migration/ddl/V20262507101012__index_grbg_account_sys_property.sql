-- Duplicate-property checks: WHERE system_property_id = ? AND tenant_id = ?.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_account_system_property_tenant
    ON public.eg_grbg_account (system_property_id, tenant_id);
