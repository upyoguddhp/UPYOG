package org.egov.digitaldoorplate.repository;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

/**
 * Read-only queries behind the DDP dashboards. Every query runs over a
 * {@code plates} CTE that carries one derived lifecycle stage per plate
 * (see {@link #STAGE_SQL}), so the funnel always adds up.
 */
@Repository
public class DdpDashboardRepository {

	/** Single lifecycle stage per eg_grbg_account_ddp row aliased {@code d}. */
	static final String STAGE_SQL = "CASE "
			+ "WHEN COALESCE(d.installation_done,false) THEN 'INSTALLED' "
			+ "WHEN COALESCE(d.ulb_verified,false) THEN 'RECEIVED' "
			+ "WHEN COALESCE(d.ddp_dispatched,false) THEN 'DISPATCHED' "
			+ "WHEN UPPER(COALESCE(d.vendor_print_verified,'')) = 'REJECTED' THEN "
			+ "CASE WHEN d.ddp_rejection_action = 'REVALIDATE' THEN 'REJECTED_REVALIDATE' ELSE 'REJECTED_REPRINT' END "
			+ "WHEN COALESCE(d.ddp_print_verified,false) THEN 'PRINT_VERIFIED' "
			+ "WHEN COALESCE(d.ddp_printing_done,false) THEN 'PRINTED' "
			+ "WHEN COALESCE(d.is_ready_for_printing,false) THEN 'READY' "
			+ "ELSE 'NOT_READY' END";

	private static final String PLATES_CTE = "WITH plates AS (SELECT d.garbage_account_uuid AS uuid, d.garbage_id, "
			+ "acc.tenant_id, ad.ward_name AS ward, d.batch_no, d.ddp_latitude AS lat, d.ddp_longitude AS lng, "
			+ "d.ddp_rejection_reason AS reason, "
			+ "(SELECT app.application_no FROM eg_grbg_application app WHERE app.garbage_id = acc.garbage_id LIMIT 1) AS app_no, "
			+ STAGE_SQL + " AS stage, "
			+ "COALESCE((SELECT MAX(a.performed_at) FROM eg_grbg_account_ddp_audit a "
			+ "WHERE a.garbage_account_uuid = d.garbage_account_uuid), d.ddp_dispatch_date, d.ready_for_printing_date) AS stage_at "
			+ "FROM eg_grbg_account_ddp d JOIN eg_grbg_account acc ON acc.uuid = d.garbage_account_uuid "
			+ "LEFT JOIN LATERAL (SELECT a.ward_name FROM eg_grbg_address a WHERE a.garbage_id = acc.garbage_id "
			+ "ORDER BY a.is_active DESC NULLS LAST LIMIT 1) ad ON true WHERE 1=1 %s) ";

	@Autowired
	private NamedParameterJdbcTemplate jdbc;

	private String plates(String tenantId, String ward, Map<String, Object> params) {
		StringBuilder filter = new StringBuilder();
		if (StringUtils.hasText(tenantId)) {
			filter.append(" AND acc.tenant_id = :tenantId");
			params.put("tenantId", tenantId);
		}
		if (StringUtils.hasText(ward)) {
			filter.append(" AND ad.ward_name = :ward");
			params.put("ward", ward);
		}
		return String.format(PLATES_CTE, filter);
	}

	private Map<String, Object> base(long now) {
		Map<String, Object> params = new HashMap<>();
		params.put("now", now);
		return params;
	}

	public Map<String, String> getConfig() {
		Map<String, String> out = new LinkedHashMap<>();
		for (Map<String, Object> row : jdbc.queryForList(
				"SELECT config_key, config_value FROM eg_grbg_ddp_dashboard_config", new HashMap<String, Object>())) {
			out.put(String.valueOf(row.get("config_key")), String.valueOf(row.get("config_value")));
		}
		return out;
	}

	public List<Map<String, Object>> getSla() {
		return jdbc.queryForList("SELECT stage, label, sla_hours AS \"slaHours\" FROM eg_grbg_ddp_stage_sla ORDER BY sort_order",
				new HashMap<>());
	}

	/** count + overdue per derived stage. */
	public List<Map<String, Object>> stageCounts(String tenantId, String ward, long now) {
		Map<String, Object> p = base(now);
		return jdbc.queryForList(plates(tenantId, ward, p)
				+ "SELECT pl.stage, COUNT(*) AS count, "
				+ "COUNT(*) FILTER (WHERE s.sla_hours IS NOT NULL AND pl.stage_at IS NOT NULL "
				+ "AND :now - pl.stage_at > s.sla_hours * 3600000::bigint) AS overdue "
				+ "FROM plates pl LEFT JOIN eg_grbg_ddp_stage_sla s ON s.stage = pl.stage "
				+ "WHERE pl.stage <> 'NOT_READY' GROUP BY pl.stage", p);
	}

	/** whole days spent in READY, with plate counts (bucketed by the service). */
	public List<Map<String, Object>> readyAgeDays(String tenantId, String ward, long now) {
		Map<String, Object> p = base(now);
		return jdbc.queryForList(plates(tenantId, ward, p)
				+ "SELECT FLOOR((:now - COALESCE(stage_at, :now)) / 86400000.0)::int AS days, COUNT(*) AS count "
				+ "FROM plates WHERE stage = 'READY' GROUP BY 1", p);
	}

	public List<Map<String, Object>> rejections(String tenantId, String ward, int limit, long now) {
		Map<String, Object> p = base(now);
		p.put("limit", limit);
		return jdbc.queryForList(plates(tenantId, ward, p)
				+ "SELECT app_no AS \"applicationNo\", ward, reason, stage, stage_at AS \"since\" FROM plates "
				+ "WHERE stage LIKE 'REJECTED%' ORDER BY stage_at ASC NULLS LAST LIMIT :limit", p);
	}

	public List<Map<String, Object>> wardProgress(String tenantId, int limit, long now) {
		Map<String, Object> p = base(now);
		p.put("limit", limit);
		return jdbc.queryForList(plates(tenantId, null, p)
				+ "SELECT COALESCE(ward,'Unassigned') AS ward, "
				+ "COUNT(*) FILTER (WHERE stage = 'INSTALLED') AS installed, "
				+ "COUNT(*) FILTER (WHERE stage IN ('RECEIVED','INSTALLED')) AS received "
				+ "FROM plates WHERE stage IN ('RECEIVED','INSTALLED') GROUP BY 1 ORDER BY received DESC LIMIT :limit", p);
	}

	public List<Map<String, Object>> ulbProgress(String tenantId, int limit, long now) {
		Map<String, Object> p = base(now);
		p.put("limit", limit);
		return jdbc.queryForList(plates(tenantId, null, p)
				+ "SELECT tenant_id AS \"tenantId\", COUNT(*) AS total, "
				+ "COUNT(*) FILTER (WHERE stage = 'INSTALLED') AS installed FROM plates "
				+ "WHERE stage <> 'NOT_READY' GROUP BY tenant_id ORDER BY total DESC LIMIT :limit", p);
	}

	public List<Map<String, Object>> installedGeo(String tenantId, String ward, int limit) {
		Map<String, Object> p = base(0);
		p.put("limit", limit);
		return jdbc.queryForList(plates(tenantId, ward, p)
				+ "SELECT lat, lng, ward FROM plates WHERE stage = 'INSTALLED' "
				+ "AND NULLIF(TRIM(lat),'') IS NOT NULL AND NULLIF(TRIM(lng),'') IS NOT NULL LIMIT :limit", p);
	}

	/** counts behind the ULB "needs attention" list. */
	public Map<String, Object> attention(String tenantId, String ward, long now, int stuckDays) {
		Map<String, Object> p = base(now);
		p.put("stuckMs", stuckDays * 86400000L);
		return jdbc.queryForMap(plates(tenantId, ward, p)
				+ "SELECT COUNT(*) FILTER (WHERE stage IN ('DISPATCHED','RECEIVED') AND stage_at IS NOT NULL "
				+ "AND :now - stage_at > :stuckMs) AS \"stuck\", "
				+ "COUNT(*) FILTER (WHERE stage = 'INSTALLED' AND (NULLIF(TRIM(lat),'') IS NULL "
				+ "OR NULLIF(TRIM(lng),'') IS NULL)) AS \"noGeo\", "
				+ "COUNT(*) FILTER (WHERE stage LIKE 'REJECTED%') AS \"rejected\" FROM plates", p);
	}

	/** dispatch batches with plate counts; tenantId (hp.<ulb>) restricts to one ULB. */
	public List<Map<String, Object>> batches(String tenantId, int limit) {
		Map<String, Object> p = new HashMap<>();
		p.put("limit", limit);
		String ulbFilter = "";
		if (StringUtils.hasText(tenantId)) {
			ulbFilter = " AND LOWER(b.ulb) = LOWER(SPLIT_PART(:tenantId, '.', 2))";
			p.put("tenantId", tenantId);
		}
		return jdbc.queryForList("SELECT b.batch_no AS \"batchNo\", b.ulb, b.ward, b.status, "
				+ "b.dispatch_date AS \"dispatchDate\", b.ulb_receiving_date AS \"receivedDate\", "
				+ "(SELECT COUNT(*) FROM eg_grbg_account_ddp d WHERE d.batch_no = b.batch_no) AS plates, "
				+ "(SELECT COUNT(*) FROM eg_grbg_account_ddp d WHERE d.batch_no = b.batch_no "
				+ "AND COALESCE(d.ulb_verified,false) = true) AS \"verifiedPlates\" "
				+ "FROM eg_grbg_ddp_dispatch b WHERE b.status <> 'INITIATED'" + ulbFilter
				+ " ORDER BY b.dispatch_date DESC NULLS LAST LIMIT :limit", p);
	}

	/** audit actions per day inside [from,to]; ward is not stored on audit rows. */
	public List<Map<String, Object>> trend(String tenantId, long from, long to) {
		Map<String, Object> p = new HashMap<>();
		p.put("from", from);
		p.put("to", to);
		String tf = "";
		if (StringUtils.hasText(tenantId)) {
			tf = " AND tenant_id = :tenantId";
			p.put("tenantId", tenantId);
		}
		return jdbc.queryForList("SELECT TO_CHAR(TO_TIMESTAMP(performed_at / 1000.0), 'YYYY-MM-DD') AS day, "
				+ "action, COUNT(*) AS count FROM eg_grbg_account_ddp_audit "
				+ "WHERE source = 'LIVE' AND performed_at BETWEEN :from AND :to" + tf + " GROUP BY 1, 2", p);
	}

	/** median hours spent in each stage (time between consecutive audit events). */
	public List<Map<String, Object>> turnaround(String tenantId, long from, long to) {
		Map<String, Object> p = new HashMap<>();
		p.put("from", from);
		p.put("to", to);
		String tf = "";
		if (StringUtils.hasText(tenantId)) {
			tf = " AND tenant_id = :tenantId";
			p.put("tenantId", tenantId);
		}
		return jdbc.queryForList("WITH ev AS (SELECT action, performed_at, "
				+ "LAG(performed_at) OVER (PARTITION BY garbage_account_uuid ORDER BY performed_at, id) AS prev_at, "
				+ "LAG(to_stage) OVER (PARTITION BY garbage_account_uuid ORDER BY performed_at, id) AS prev_stage "
				+ "FROM eg_grbg_account_ddp_audit WHERE source = 'LIVE'" + tf + ") "
				+ "SELECT prev_stage AS stage, COUNT(*) AS count, "
				+ "PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (performed_at - prev_at) / 3600000.0) AS \"medianHours\" "
				+ "FROM ev WHERE prev_at IS NOT NULL AND performed_at BETWEEN :from AND :to GROUP BY prev_stage", p);
	}

	/** per-performer print stats: avg ready→printed hours, verified/rejected counts. */
	public List<Map<String, Object>> vendorPerformance(String tenantId, long from, long to) {
		Map<String, Object> p = new HashMap<>();
		p.put("from", from);
		p.put("to", to);
		String tf = "";
		if (StringUtils.hasText(tenantId)) {
			tf = " AND tenant_id = :tenantId";
			p.put("tenantId", tenantId);
		}
		return jdbc.queryForList("WITH ev AS (SELECT action, performed_at, performed_by_name, performed_by, "
				+ "LAG(performed_at) OVER (PARTITION BY garbage_account_uuid ORDER BY performed_at, id) AS prev_at, "
				+ "LAG(to_stage) OVER (PARTITION BY garbage_account_uuid ORDER BY performed_at, id) AS prev_stage "
				+ "FROM eg_grbg_account_ddp_audit WHERE source = 'LIVE'" + tf + ") "
				+ "SELECT COALESCE(performed_by_name, performed_by) AS vendor, "
				+ "AVG((performed_at - prev_at) / 3600000.0) FILTER (WHERE action = 'PRINTED' AND prev_stage = 'READY') AS \"avgPrintHours\", "
				+ "COUNT(*) FILTER (WHERE action = 'PRINT_VERIFIED') AS verified, "
				+ "COUNT(*) FILTER (WHERE action LIKE 'REJECTED%') AS rejected "
				+ "FROM ev WHERE performed_at BETWEEN :from AND :to AND "
				+ "action IN ('PRINTED','PRINT_VERIFIED','REJECTED_REPRINT','REJECTED_REVALIDATE') "
				+ "GROUP BY 1 ORDER BY verified DESC", p);
	}
}
