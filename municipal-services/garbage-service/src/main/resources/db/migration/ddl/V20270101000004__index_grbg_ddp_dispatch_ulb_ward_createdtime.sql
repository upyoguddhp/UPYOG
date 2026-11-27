-- Dispatch search is also commonly filtered by ulb AND ward together (see
-- DdpDispatchRepository#appendWhereClause), still ordered by createdtime DESC.
-- The previous idx_grbg_ddp_dispatch_ulb_createdtime index only covers
-- ulb-only searches: for a fixed ulb, rows for different wards are not
-- globally ordered by createdtime in that index, so a ulb+ward filtered
-- search would still need a separate sort step. This index covers that case
-- directly. idx_eg_grbg_ddp_dispatch_ulb_ward (ulb, ward) is now redundant
-- for filtering purposes (this index's leading columns are a superset) but
-- is left in place/not dropped here.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_ddp_dispatch_ulb_ward_createdtime
    ON public.eg_grbg_ddp_dispatch (ulb, ward, createdtime DESC);
