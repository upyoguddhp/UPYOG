-- Child/sub-account lookups (acc.uuid = sub_acc.parent_account, parent_account IS NULL filters).
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_grbg_account_parent_account
    ON public.eg_grbg_account (parent_account);
