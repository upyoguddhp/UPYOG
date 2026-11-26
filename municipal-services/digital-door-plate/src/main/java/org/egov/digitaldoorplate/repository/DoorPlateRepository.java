package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.DoorPlate;
import org.egov.digitaldoorplate.model.SearchCriteriaDoorPlate;
import org.egov.digitaldoorplate.repository.builder.DoorPlateQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.DoorPlateRowMapper;
import org.egov.digitaldoorplate.util.JsonbUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DoorPlateRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private DoorPlateQueryBuilder queryBuilder;

	@Autowired
	private DoorPlateRowMapper rowMapper;

	@Autowired
	private JsonbUtil jsonbUtil;

	public void create(DoorPlate doorPlate) {
		jdbcTemplate.update(DoorPlateQueryBuilder.CREATE_QUERY,
				doorPlate.getUuid(),
				doorPlate.getTenantId(),
				doorPlate.getGarbageAccountUuid(),
				doorPlate.getGarbageId(),
				doorPlate.getApplicationNo(),
				doorPlate.getPropertyId(),
				doorPlate.getWardNumber(),
				doorPlate.getPlateStatus(),
				doorPlate.getIsQrGenerated(),
				doorPlate.getQrGeneratedTime(),
				doorPlate.getQrGeneratedBy(),
				doorPlate.getIsPrintVerified(),
				doorPlate.getPrintVerifiedTime(),
				doorPlate.getPrintVerifiedBy(),
				doorPlate.getVerificationLatitude(),
				doorPlate.getVerificationLongitude(),
				doorPlate.getIsInstalled(),
				doorPlate.getInstalledTime(),
				doorPlate.getInstalledBy(),
				doorPlate.getInstallationLatitude(),
				doorPlate.getInstallationLongitude(),
				doorPlate.getRemarks(),
				jsonbUtil.toPGobject(doorPlate.getAdditionalDetails()),
				doorPlate.getIsActive(),
				doorPlate.getCreatedBy(),
				doorPlate.getCreatedDate(),
				doorPlate.getLastModifiedBy(),
				doorPlate.getLastModifiedDate());
	}

	public void verifyPrint(DoorPlate doorPlate) {
		jdbcTemplate.update(DoorPlateQueryBuilder.VERIFY_PRINT_QUERY,
				doorPlate.getPlateStatus(),
				doorPlate.getIsPrintVerified(),
				doorPlate.getPrintVerifiedTime(),
				doorPlate.getPrintVerifiedBy(),
				doorPlate.getVerificationLatitude(),
				doorPlate.getVerificationLongitude(),
				doorPlate.getRemarks(),
				doorPlate.getLastModifiedBy(),
				doorPlate.getLastModifiedDate(),
				doorPlate.getUuid());
	}

	public void install(DoorPlate doorPlate) {
		jdbcTemplate.update(DoorPlateQueryBuilder.INSTALL_QUERY,
				doorPlate.getPlateStatus(),
				doorPlate.getIsInstalled(),
				doorPlate.getInstalledTime(),
				doorPlate.getInstalledBy(),
				doorPlate.getInstallationLatitude(),
				doorPlate.getInstallationLongitude(),
				doorPlate.getRemarks(),
				doorPlate.getLastModifiedBy(),
				doorPlate.getLastModifiedDate(),
				doorPlate.getUuid());
	}

	public List<DoorPlate> search(SearchCriteriaDoorPlate criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}

	private static final String DDP_STATUS_COUNT_QUERY = "SELECT "
			+ "COUNT(*) FILTER (WHERE is_ready_for_printing = true) AS is_ready_for_printing, "
			+ "COUNT(*) FILTER (WHERE ddp_print_verified = true) AS ddp_print_verified, "
			+ "COUNT(*) FILTER (WHERE ddp_dispatched = true) AS ddp_dispatched, "
			+ "COUNT(*) FILTER (WHERE UPPER(vendor_print_verified) = 'REJECTED') AS vendor_print_verified_rejected, "
			+ "COUNT(*) FILTER (WHERE installation_done = true) AS installation_done "
			+ "FROM public.eg_grbg_account_ddp";

	private static final String DISPATCH_BATCH_STATUS_COUNT_QUERY = "SELECT "
			+ "COUNT(*) FILTER (WHERE status = 'INITIATED') AS dispatch_initiated, "
			+ "COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS dispatch_submitted, "
			+ "COUNT(*) FILTER (WHERE status = 'RECEIVED') AS dispatch_received "
			+ "FROM public.eg_grbg_ddp_dispatch WHERE 1=1 ";

	/**
	 * Returns the eg_grbg_ddp_dispatch.status of the batch the given plate's
	 * eg_grbg_account_ddp.batch_no points to, or null if the plate has no
	 * eg_grbg_account_ddp row at all, or has one but was never scanned into a
	 * batch (batch_no is null).
	 */
	public String findDispatchBatchStatusForPlate(String garbageAccountUuid) {
		List<String> statuses = jdbcTemplate.queryForList(
				"SELECT d.status FROM public.eg_grbg_account_ddp p "
						+ "LEFT JOIN public.eg_grbg_ddp_dispatch d ON p.batch_no = d.batch_no "
						+ "WHERE p.garbage_account_uuid = ?",
				String.class, garbageAccountUuid);
		return statuses.isEmpty() ? null : statuses.get(0);
	}

	/**
	 * Counts eg_grbg_account_ddp rows for each DDP workflow status, plus
	 * eg_grbg_ddp_dispatch batch counts per status (INITIATED/SUBMITTED/
	 * RECEIVED), optionally restricted to one ULB.
	 */
	public org.egov.digitaldoorplate.model.DdpStatusCountResponse getDdpStatusCounts(String ulb) {
		org.egov.digitaldoorplate.model.DdpStatusCountResponse.DdpStatusCountResponseBuilder builder = jdbcTemplate
				.queryForObject(DDP_STATUS_COUNT_QUERY,
						(rs, rowNum) -> org.egov.digitaldoorplate.model.DdpStatusCountResponse.builder()
								.isReadyForPrinting(rs.getLong("is_ready_for_printing"))
								.ddpPrintVerified(rs.getLong("ddp_print_verified"))
								.ddpDispatched(rs.getLong("ddp_dispatched"))
								.vendorPrintVerifiedRejected(rs.getLong("vendor_print_verified_rejected"))
								.installationDone(rs.getLong("installation_done")));

		StringBuilder query = new StringBuilder(DISPATCH_BATCH_STATUS_COUNT_QUERY);
		List<Object> params = new ArrayList<>();
		if (org.apache.commons.lang3.StringUtils.isNotEmpty(ulb)) {
			query.append(" AND ulb = ?");
			params.add(ulb);
		}

		return jdbcTemplate.queryForObject(query.toString(), params.toArray(),
				(rs, rowNum) -> builder.dispatchBatchesInitiated(rs.getLong("dispatch_initiated"))
						.dispatchBatchesSubmitted(rs.getLong("dispatch_submitted"))
						.dispatchBatchesReceived(rs.getLong("dispatch_received")).build());
	}
}
