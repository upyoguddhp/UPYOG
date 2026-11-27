-- eg_grbg_address.garbage_id is joined constantly (GarbageAccountRepository's
-- main account search, and now GarbageAccountRepository#searchRejectedPlates)
-- but had no index of its own, unlike eg_grbg_account.garbage_id
-- (idx_grbg_account_garbage_id). Without it, each such join is a sequential
-- scan of the whole address table.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_address_garbage_id
    ON public.eg_grbg_address (garbage_id);
