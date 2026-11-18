-- Support the adjustedamount sync run after payment (DemandRepository.syncBillAdjustedAmounts),
-- which filters egbs_billaccountdetail_v1 by demanddetailid for every demand detail.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_egbs_billaccountdetail_v1_demanddetailid
    ON public.egbs_billaccountdetail_v1 (demanddetailid);
