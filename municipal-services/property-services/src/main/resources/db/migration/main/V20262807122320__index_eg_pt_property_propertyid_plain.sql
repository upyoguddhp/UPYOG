-- Plain index on propertyid. The only existing propertyid index in production is the unique
-- partial one (propertyid, tenantid, status) WHERE status='ACTIVE', which cannot serve
-- lookups that do not also filter on ACTIVE status (e.g. history rows, propertyid-only searches).
-- Distinct name on purpose: the older migration used index_eg_pt_property_propertyid for two
-- different definitions, and IF NOT EXISTS silently skipped one of them.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_eg_pt_property_propertyid_all
    ON public.eg_pt_property (propertyid);
