-- The dispatch search query filters by ulb and orders by createdtime DESC
-- (see DdpDispatchRepository#searchBatches). The existing idx_eg_grbg_ddp_dispatch_ulb_ward
-- index covers the filter but not the sort, forcing a separate sort over all
-- matching rows on every paginated search call. This composite index lets a
-- single index scan satisfy both the filter and the ORDER BY.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_ddp_dispatch_ulb_createdtime
    ON public.eg_grbg_ddp_dispatch (ulb, createdtime DESC);
