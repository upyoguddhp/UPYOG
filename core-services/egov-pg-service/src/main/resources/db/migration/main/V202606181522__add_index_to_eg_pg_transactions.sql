CREATE INDEX IF NOT EXISTS idx_txn_created_time
ON eg_pg_transactions (created_time);

CREATE INDEX IF NOT EXISTS idx_txn_consumer_code
ON eg_pg_transactions (consumer_code);

CREATE INDEX IF NOT EXISTS idx_pg_transactions_bill_status
ON eg_pg_transactions(bill_id, txn_status);

CREATE INDEX IF NOT EXISTS idx_pg_details_taxid
ON eg_pg_transactions_details(txn_id);