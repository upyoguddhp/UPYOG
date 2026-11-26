-- Append-only audit trail of every DDP workflow action taken by either DDP_VENDOR or
-- DDP_VERIFIER on eg_grbg_account_ddp, independent of the latest-state columns on that table.
CREATE TABLE IF NOT EXISTS public.eg_grbg_ddp_action_history (
    id VARCHAR(64) NOT NULL,
    garbage_account_uuid VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action_details JSONB NOT NULL,
    performed_by VARCHAR(64) NOT NULL,
    performed_time INT8 NOT NULL,
    CONSTRAINT pk_eg_grbg_ddp_action_history PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_eg_grbg_ddp_action_history_account
    ON public.eg_grbg_ddp_action_history (garbage_account_uuid);
