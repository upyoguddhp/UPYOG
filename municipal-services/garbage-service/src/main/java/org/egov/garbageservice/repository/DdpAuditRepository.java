package org.egov.garbageservice.repository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.User;
import org.egov.garbageservice.model.DdpWorkflowUpdateRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

/**
 * Append-only audit trail (eg_grbg_account_ddp_audit) of every DDP lifecycle
 * action on a plate. Rows are written in the same transaction as the action
 * they describe.
 */
@Repository
public class DdpAuditRepository {

	/** Derives the single lifecycle stage of an eg_grbg_account_ddp row aliased {@code d}. */
	public static final String STAGE_SQL = "CASE "
			+ "WHEN COALESCE(d.installation_done,false) THEN 'INSTALLED' "
			+ "WHEN COALESCE(d.ulb_verified,false) THEN 'RECEIVED' "
			+ "WHEN COALESCE(d.ddp_dispatched,false) THEN 'DISPATCHED' "
			+ "WHEN UPPER(COALESCE(d.vendor_print_verified,'')) = 'REJECTED' THEN "
			+ "CASE WHEN d.ddp_rejection_action = 'REVALIDATE' THEN 'REJECTED_REVALIDATE' ELSE 'REJECTED_REPRINT' END "
			+ "WHEN COALESCE(d.ddp_print_verified,false) THEN 'PRINT_VERIFIED' "
			+ "WHEN COALESCE(d.ddp_printing_done,false) THEN 'PRINTED' "
			+ "WHEN COALESCE(d.is_ready_for_printing,false) THEN 'READY' "
			+ "ELSE 'NOT_READY' END";

	private static final String INSERT_FOR_ACCOUNT = "INSERT INTO eg_grbg_account_ddp_audit "
			+ "(garbage_account_uuid, garbage_id, tenant_id, batch_no, action, from_stage, to_stage, reason, "
			+ "latitude, longitude, performed_by, performed_by_name, performed_by_role, performed_at) "
			+ "SELECT acc.uuid, acc.garbage_id, acc.tenant_id, "
			+ "(SELECT d.batch_no FROM eg_grbg_account_ddp d WHERE d.garbage_account_uuid = acc.uuid), "
			+ ":action, :fromStage, :toStage, :reason, :latitude, :longitude, :performedBy, :performedByName, "
			+ ":performedByRole, :performedAt FROM eg_grbg_account acc WHERE acc.uuid = :uuid";

	private static final String INSERT_DISPATCHED_BY_BATCH = "INSERT INTO eg_grbg_account_ddp_audit "
			+ "(garbage_account_uuid, garbage_id, tenant_id, batch_no, action, from_stage, to_stage, performed_by, performed_at) "
			+ "SELECT d.garbage_account_uuid, d.garbage_id, acc.tenant_id, d.batch_no, 'DISPATCHED', 'PRINT_VERIFIED', "
			+ "'DISPATCHED', :performedBy, :performedAt FROM eg_grbg_account_ddp d "
			+ "JOIN eg_grbg_account acc ON acc.uuid = d.garbage_account_uuid WHERE d.batch_no = :batchNo";

	private static final String INSERT_READY_BY_IDS = "INSERT INTO eg_grbg_account_ddp_audit "
			+ "(garbage_account_uuid, garbage_id, tenant_id, action, from_stage, to_stage, performed_by, performed_at) "
			+ "SELECT acc.uuid, acc.garbage_id, acc.tenant_id, 'READY_FOR_PRINTING', NULL, 'READY', :performedBy, :performedAt "
			+ "FROM eg_grbg_account acc WHERE acc.id IN (:ids) AND acc.uuid IS NOT NULL "
			+ "AND NOT EXISTS (SELECT 1 FROM eg_grbg_account_ddp d WHERE d.garbage_account_uuid = acc.uuid "
			+ "AND COALESCE(d.is_ready_for_printing,false) = true)";

	@Autowired
	private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	/** Current derived stage of the plate, or null when the plate has no DDP row yet. */
	public String currentStage(String garbageAccountUuid) {
		try {
			return jdbcTemplate.queryForObject(
					"SELECT " + STAGE_SQL + " FROM eg_grbg_account_ddp d WHERE d.garbage_account_uuid = ?",
					String.class, garbageAccountUuid);
		} catch (EmptyResultDataAccessException e) {
			return null;
		}
	}

	/** Records one audit row per action carried by a workflow update request. */
	public void recordWorkflow(DdpWorkflowUpdateRequest request, String userUuid, long now, String previousStage) {
		String stage = previousStage;
		if ("REJECTED".equalsIgnoreCase(request.getVendorPrintVerified())) {
			String action = "REVALIDATE".equals(request.getDdpRejectionAction()) ? "REJECTED_REVALIDATE"
					: "REJECTED_REPRINT";
			stage = insert(request, userUuid, now, action, stage, action, request.getDdpRejectionReason());
		}
		if (Boolean.TRUE.equals(request.getDdpPrintingDone())) {
			stage = insert(request, userUuid, now, "PRINTED", stage, "PRINTED", null);
		}
		if (Boolean.TRUE.equals(request.getDdpPrintVerified())
				|| "VERIFIED".equalsIgnoreCase(request.getVendorPrintVerified())) {
			stage = insert(request, userUuid, now, "PRINT_VERIFIED", stage, "PRINT_VERIFIED", null);
		}
		if (Boolean.TRUE.equals(request.getDdpDispatched())) {
			stage = insert(request, userUuid, now, "DISPATCHED", stage, "DISPATCHED", null);
		}
		if (Boolean.TRUE.equals(request.getUlbVerified())) {
			stage = insert(request, userUuid, now, "ULB_VERIFIED", stage, "RECEIVED", null);
		}
		if (Boolean.TRUE.equals(request.getInstallationDone())) {
			insert(request, userUuid, now, "INSTALLED", stage, "INSTALLED", null);
		}
	}

	private String insert(DdpWorkflowUpdateRequest request, String userUuid, long now, String action,
			String fromStage, String toStage, String reason) {
		RequestInfo requestInfo = request.getRequestInfo();
		User user = requestInfo != null ? requestInfo.getUserInfo() : null;
		Map<String, Object> params = new HashMap<>();
		params.put("uuid", request.getUuid());
		params.put("action", action);
		params.put("fromStage", fromStage);
		params.put("toStage", toStage);
		params.put("reason", reason);
		boolean installed = "INSTALLED".equals(action);
		params.put("latitude", installed ? request.getDdpLatitude() : null);
		params.put("longitude", installed ? request.getDdpLongitude() : null);
		params.put("performedBy", userUuid);
		params.put("performedByName", user != null ? user.getName() : null);
		List<Role> roles = user != null ? user.getRoles() : null;
		params.put("performedByRole", CollectionUtils.isEmpty(roles) ? null
				: roles.stream().map(Role::getCode).filter(c -> c != null && c.startsWith("DDP")).collect(Collectors.joining(",")));
		params.put("performedAt", now);
		namedParameterJdbcTemplate.update(INSERT_FOR_ACCOUNT, params);
		return toStage;
	}

	public void recordDispatchedByBatch(String batchNo, String performedBy, long performedAt) {
		Map<String, Object> params = new HashMap<>();
		params.put("batchNo", batchNo);
		params.put("performedBy", performedBy);
		params.put("performedAt", performedAt);
		namedParameterJdbcTemplate.update(INSERT_DISPATCHED_BY_BATCH, params);
	}

	/** Must run before the plates are upserted to ready, so already-ready plates are skipped. */
	public void recordReadyForPrinting(List<Long> ids, String performedBy, long performedAt) {
		if (CollectionUtils.isEmpty(ids)) {
			return;
		}
		Map<String, Object> params = new HashMap<>();
		params.put("ids", ids);
		params.put("performedBy", performedBy);
		params.put("performedAt", performedAt);
		namedParameterJdbcTemplate.update(INSERT_READY_BY_IDS, params);
	}
}
