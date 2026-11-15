CREATE TABLE IF NOT EXISTS public.eg_grbg_ddp_dispatch (
    uuid VARCHAR(64) NOT NULL,
    batch_no VARCHAR(64) NOT NULL,
    ulb VARCHAR(128) NOT NULL,
    ward VARCHAR(128),
    dispatch_date int8,
    received_by VARCHAR(128),
    ulb_receiving_date int8,
    status VARCHAR(32) NOT NULL DEFAULT 'INITIATED',
    createdby VARCHAR(64),
    modifiedby VARCHAR(64),
    createdtime int8,
    modifiedtime int8,
    CONSTRAINT pk_eg_grbg_ddp_dispatch PRIMARY KEY (uuid),
    CONSTRAINT uk_eg_grbg_ddp_dispatch_batch_no UNIQUE (batch_no)
);

CREATE INDEX IF NOT EXISTS idx_eg_grbg_ddp_dispatch_ulb_ward ON public.eg_grbg_ddp_dispatch (ulb, ward);
CREATE INDEX IF NOT EXISTS idx_eg_grbg_ddp_dispatch_status ON public.eg_grbg_ddp_dispatch (status);
CREATE INDEX IF NOT EXISTS idx_eg_grbg_ddp_dispatch_dispatch_date ON public.eg_grbg_ddp_dispatch (dispatch_date);

-- Backing counter for the DDP-<ULB>-<DDMMYY>-<seq> batch_no format: one row per
-- (ulb, batch_date), incremented atomically via INSERT ... ON CONFLICT DO UPDATE
-- ... RETURNING so concurrent "create dispatch" calls for the same ULB/day never
-- hand out the same sequence number.
CREATE TABLE IF NOT EXISTS public.eg_grbg_ddp_dispatch_batch_seq (
    ulb VARCHAR(128) NOT NULL,
    batch_date VARCHAR(6) NOT NULL,
    last_seq int4 NOT NULL DEFAULT 0,
    CONSTRAINT pk_eg_grbg_ddp_dispatch_batch_seq PRIMARY KEY (ulb, batch_date)
);
