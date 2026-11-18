-- Append-only audit trail of every DDP lifecycle action on a plate.
CREATE TABLE IF NOT EXISTS public.eg_grbg_account_ddp_audit (
    id BIGSERIAL PRIMARY KEY,
    garbage_account_uuid VARCHAR(255) NOT NULL,
    garbage_id int8,
    tenant_id VARCHAR(64),
    batch_no VARCHAR(64),
    action VARCHAR(40) NOT NULL,
    from_stage VARCHAR(30),
    to_stage VARCHAR(30) NOT NULL,
    reason VARCHAR(1000),
    latitude VARCHAR(64),
    longitude VARCHAR(64),
    performed_by VARCHAR(64),
    performed_by_name VARCHAR(128),
    performed_by_role VARCHAR(64),
    performed_at int8 NOT NULL,
    source VARCHAR(16) NOT NULL DEFAULT 'LIVE'
);
CREATE INDEX IF NOT EXISTS idx_ddp_audit_uuid_at ON public.eg_grbg_account_ddp_audit (garbage_account_uuid, performed_at);
CREATE INDEX IF NOT EXISTS idx_ddp_audit_action_at ON public.eg_grbg_account_ddp_audit (action, performed_at);
CREATE INDEX IF NOT EXISTS idx_ddp_audit_tenant_at ON public.eg_grbg_account_ddp_audit (tenant_id, performed_at);
CREATE INDEX IF NOT EXISTS idx_ddp_audit_batch ON public.eg_grbg_account_ddp_audit (batch_no);

-- Max time a plate may stay in a stage before it is "overdue" (editable without a deploy).
CREATE TABLE IF NOT EXISTS public.eg_grbg_ddp_stage_sla (
    stage VARCHAR(30) PRIMARY KEY,
    label VARCHAR(64) NOT NULL,
    sla_hours int4 NOT NULL,
    sort_order int4 NOT NULL DEFAULT 0
);
-- NOTE: placeholder SLA values - replace with the department-approved numbers.
INSERT INTO public.eg_grbg_ddp_stage_sla (stage, label, sla_hours, sort_order) VALUES
 ('READY','Ready → Printed',48,1),
 ('PRINTED','Printed → Verified',24,2),
 ('PRINT_VERIFIED','Verified → Dispatched',48,3),
 ('REJECTED_REPRINT','Rejected (reprint) → Fixed',48,4),
 ('REJECTED_REVALIDATE','Rejected (revalidate) → Fixed',72,5),
 ('DISPATCHED','Dispatched → Received',72,6),
 ('RECEIVED','Received → Installed',168,7)
ON CONFLICT (stage) DO NOTHING;

-- Generic key/value dashboard settings (targets, thresholds, ageing buckets).
CREATE TABLE IF NOT EXISTS public.eg_grbg_ddp_dashboard_config (
    config_key VARCHAR(64) PRIMARY KEY,
    config_value VARCHAR(256) NOT NULL,
    description VARCHAR(256)
);
INSERT INTO public.eg_grbg_ddp_dashboard_config (config_key, config_value, description) VALUES
 ('ageing.bucket.days','2,7,14','Upper bounds (days) for the print-backlog ageing buckets'),
 ('progress.ontrack.min.percent','60','ULB installed % at/above which status is On track'),
 ('progress.atrisk.min.percent','40','ULB installed % at/above which status is At risk (below = Delayed)'),
 ('install.target.percent','80','Installation target (%) shown to ULB officials'),
 ('install.target.date','','Target date (yyyy-MM-dd) for the installation target'),
 ('attention.stuck.days','7','Days after dispatch after which a plate counts as stuck'),
 ('trend.default.days','30','Default window (days) for activity trends'),
 ('vendor.atrisk.factor','1.25','Vendor avg print time up to SLA x this factor is At risk, above is Breached')
ON CONFLICT (config_key) DO NOTHING;

-- One synthetic audit row per existing plate for its current stage so every plate has history.
INSERT INTO public.eg_grbg_account_ddp_audit
    (garbage_account_uuid, garbage_id, tenant_id, batch_no, action, from_stage, to_stage, reason, latitude, longitude, performed_at, source)
SELECT s.garbage_account_uuid, s.garbage_id, acc.tenant_id, s.batch_no,
       CASE s.stage WHEN 'INSTALLED' THEN 'INSTALLED' WHEN 'RECEIVED' THEN 'ULB_VERIFIED' WHEN 'DISPATCHED' THEN 'DISPATCHED'
            WHEN 'REJECTED_REVALIDATE' THEN 'REJECTED_REVALIDATE' WHEN 'REJECTED_REPRINT' THEN 'REJECTED_REPRINT'
            WHEN 'PRINT_VERIFIED' THEN 'PRINT_VERIFIED' WHEN 'PRINTED' THEN 'PRINTED' ELSE 'READY_FOR_PRINTING' END,
       NULL, s.stage, s.ddp_rejection_reason, s.ddp_latitude, s.ddp_longitude,
       COALESCE(s.ddp_dispatch_date, s.ready_for_printing_date, (EXTRACT(EPOCH FROM now()) * 1000)::int8), 'MIGRATED'
FROM (
  SELECT d.*, CASE
    WHEN COALESCE(d.installation_done,false) THEN 'INSTALLED'
    WHEN COALESCE(d.ulb_verified,false) THEN 'RECEIVED'
    WHEN COALESCE(d.ddp_dispatched,false) THEN 'DISPATCHED'
    WHEN UPPER(COALESCE(d.vendor_print_verified,'')) = 'REJECTED' THEN
         CASE WHEN d.ddp_rejection_action = 'REVALIDATE' THEN 'REJECTED_REVALIDATE' ELSE 'REJECTED_REPRINT' END
    WHEN COALESCE(d.ddp_print_verified,false) THEN 'PRINT_VERIFIED'
    WHEN COALESCE(d.ddp_printing_done,false) THEN 'PRINTED'
    WHEN COALESCE(d.is_ready_for_printing,false) THEN 'READY'
    ELSE 'NOT_READY' END AS stage
  FROM public.eg_grbg_account_ddp d
) s
JOIN public.eg_grbg_account acc ON acc.uuid = s.garbage_account_uuid
WHERE s.stage <> 'NOT_READY'
  AND NOT EXISTS (SELECT 1 FROM public.eg_grbg_account_ddp_audit a WHERE a.garbage_account_uuid = s.garbage_account_uuid);
