-- Support transaction lookups by bill id (billId=<id> searches from the counter-billing UI
-- and bill-to-transaction joins). txn_id is already indexed.
-- Keep this as a single statement so Flyway detects a nontransactional migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pg_txn_details_bill_id
    ON public.eg_pg_transactions_details (bill_id);
