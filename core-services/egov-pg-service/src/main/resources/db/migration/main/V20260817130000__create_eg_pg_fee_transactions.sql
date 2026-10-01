CREATE TABLE eg_pg_fee_transactions (
    uuid VARCHAR(64) NOT NULL,
    gateway_txn_id VARCHAR(128),
    module VARCHAR(128),
    tenant_id VARCHAR(128),
    consumer_code VARCHAR(128),
    order_id VARCHAR(128),
    merchant_id VARCHAR(64),
    product_id VARCHAR(128),
    txn_amount NUMERIC(15,2),
    txn_status VARCHAR(64),
    txn_mode VARCHAR(32),
    txn_type VARCHAR(32),
    gateway_status_msg VARCHAR(256),
    gateway_status_code VARCHAR(64),
    merchant_receipt_no VARCHAR(128),
    ccf_tds NUMERIC(15,2),
    service_uuid VARCHAR(128),
    gateway VARCHAR(128),
    receipt VARCHAR(128),
    additional_details JSONB,
    created_by VARCHAR(64),
    created_time BIGINT,
    last_modified_time BIGINT,
    last_modified_by VARCHAR(128)
);

CREATE UNIQUE INDEX idx_eg_pg_fee_transactions_uuid
    ON eg_pg_fee_transactions (uuid);

CREATE INDEX idx_eg_pg_fee_transactions_gateway_txn
    ON eg_pg_fee_transactions (gateway_txn_id);

CREATE INDEX idx_eg_pg_fee_transactions_order_id
    ON eg_pg_fee_transactions (order_id);
