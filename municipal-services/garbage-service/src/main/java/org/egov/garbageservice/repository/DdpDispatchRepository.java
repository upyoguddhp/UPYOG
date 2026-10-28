package org.egov.garbageservice.repository;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.egov.garbageservice.model.AuditDetails;
import org.egov.garbageservice.model.DdpDispatch;
import org.egov.garbageservice.model.DispatchPlateLookup;
import org.egov.garbageservice.model.ScannedPlateInfo;
import org.egov.garbageservice.model.SearchCriteriaDdpDispatch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

/**
 * All persistence for the DDP dispatch feature: the eg_grbg_ddp_dispatch
 * batches themselves, the per-ULB/day batch number counter, and the
 * scan-time lookup/assignment of plates (eg_grbg_account_ddp.batch_no).
 */
@Repository
public class DdpDispatchRepository {

	private static final String SELECT_PLATE_LOOKUP_BY_UUID = "SELECT acc.uuid as garbage_account_uuid, "
			+ "acc.garbage_id as garbage_id, acc.tenant_id as tenant_id, acc.name as owner_name, "
			+ "COALESCE(acc.property_id, acc.system_property_id) as property_id, addr.ulb_name as ulb, addr.ward_name as ward, "
			+ "ddp.batch_no as existing_batch_no, COALESCE(ddp.ddp_dispatched, false) as ddp_dispatched "
			+ "FROM eg_grbg_account acc "
			+ "LEFT JOIN eg_grbg_address addr ON addr.garbage_id = acc.garbage_id "
			+ "LEFT JOIN eg_grbg_account_ddp ddp ON ddp.garbage_account_uuid = acc.uuid "
			+ "WHERE acc.uuid = ? AND acc.is_active = true "
			+ "LIMIT 1";

	private static final String NEXT_BATCH_SEQUENCE = "INSERT INTO eg_grbg_ddp_dispatch_batch_seq "
			+ "(ulb, batch_date, last_seq) VALUES (?, ?, 1) "
			+ "ON CONFLICT (ulb, batch_date) DO UPDATE SET last_seq = eg_grbg_ddp_dispatch_batch_seq.last_seq + 1 "
			+ "RETURNING last_seq";

	private static final String INSERT_BATCH = "INSERT INTO eg_grbg_ddp_dispatch "
			+ "(uuid, batch_no, ulb, ward, status, createdby, modifiedby, createdtime, modifiedtime) "
			+ "VALUES (:uuid, :batchNo, :ulb, :ward, :status, :createdBy, :lastModifiedBy, :createdTime, :lastModifiedTime)";

	private static final String SELECT_BATCH_BY_BATCH_NO = "SELECT uuid, batch_no, ulb, ward, dispatch_date, "
			+ "received_by, ulb_receiving_date, status, createdby, modifiedby, createdtime, modifiedtime "
			+ "FROM eg_grbg_ddp_dispatch WHERE batch_no = ?";

	private static final String ASSIGN_PLATE_TO_BATCH = "UPDATE eg_grbg_account_ddp SET batch_no = ? "
			+ "WHERE garbage_account_uuid = ?";

	private static final String SELECT_SCANNED_PLATES_BY_BATCH_NO = "SELECT acc.name as owner_name, "
			+ "addr.ward_name as ward, acc.system_property_id as property_id "
			+ "FROM eg_grbg_account_ddp ddp "
			+ "JOIN eg_grbg_account acc ON acc.uuid = ddp.garbage_account_uuid "
			+ "LEFT JOIN eg_grbg_address addr ON addr.garbage_id = acc.garbage_id "
			+ "WHERE ddp.batch_no = ?";

	private static final String SUBMIT_BATCH = "UPDATE eg_grbg_ddp_dispatch SET status = :status, "
			+ "dispatch_date = :dispatchDate, modifiedby = :modifiedBy, modifiedtime = :modifiedTime "
			+ "WHERE batch_no = :batchNo AND status = :currentStatus";

	private static final String MARK_PLATES_DISPATCHED_BY_BATCH_NO = "UPDATE eg_grbg_account_ddp "
			+ "SET ddp_dispatched = true, ddp_dispatch_date = :dispatchDate WHERE batch_no = :batchNo";

	private static final String COUNT_PLATES_BY_BATCH_NO = "SELECT COUNT(*) FROM eg_grbg_account_ddp WHERE batch_no = ?";

	private static final String RECEIVE_BATCH = "UPDATE eg_grbg_ddp_dispatch SET status = :status, "
			+ "received_by = :receivedBy, ulb_receiving_date = :ulbReceivingDate, "
			+ "modifiedby = :modifiedBy, modifiedtime = :modifiedTime "
			+ "WHERE batch_no = :batchNo AND status = :currentStatus";

	@Autowired
	private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

	@Autowired
	private JdbcTemplate jdbcTemplate;

	public DispatchPlateLookup findPlateForDispatch(String garbageAccountUuid) {
		List<DispatchPlateLookup> results = jdbcTemplate.query(SELECT_PLATE_LOOKUP_BY_UUID,
				(rs, rowNum) -> DispatchPlateLookup.builder().garbageAccountUuid(rs.getString("garbage_account_uuid"))
						.garbageId(rs.getLong("garbage_id")).tenantId(rs.getString("tenant_id"))
						.ownerName(rs.getString("owner_name")).propertyId(rs.getString("property_id"))
						.ulb(rs.getString("ulb")).ward(rs.getString("ward"))
						.existingBatchNo(rs.getString("existing_batch_no"))
						.ddpDispatched(rs.getBoolean("ddp_dispatched")).build(),
				garbageAccountUuid);
		return results.isEmpty() ? null : results.get(0);
	}

	/**
	 * Atomically increments and returns the next sequence number for the
	 * given ULB/day (creating the counter row on first use), via a single
	 * INSERT ... ON CONFLICT DO UPDATE ... RETURNING so concurrent "create
	 * dispatch" calls for the same ULB/day never collide.
	 */
	public int nextBatchSequence(String ulb, String batchDate) {
		return jdbcTemplate.queryForObject(NEXT_BATCH_SEQUENCE, Integer.class, ulb, batchDate);
	}

	public void insertBatch(DdpDispatch batch) {
		Map<String, Object> params = new HashMap<>();
		params.put("uuid", batch.getUuid());
		params.put("batchNo", batch.getBatchNo());
		params.put("ulb", batch.getUlb());
		params.put("ward", batch.getWard());
		params.put("status", batch.getStatus());
		params.put("createdBy", batch.getAuditDetails().getCreatedBy());
		params.put("lastModifiedBy", batch.getAuditDetails().getLastModifiedBy());
		params.put("createdTime", batch.getAuditDetails().getCreatedTime());
		params.put("lastModifiedTime", batch.getAuditDetails().getLastModifiedTime());
		namedParameterJdbcTemplate.update(INSERT_BATCH, params);
	}

	public DdpDispatch findBatchByBatchNo(String batchNo) {
		try {
			return jdbcTemplate.queryForObject(SELECT_BATCH_BY_BATCH_NO, this::mapDispatch, batchNo);
		} catch (EmptyResultDataAccessException e) {
			return null;
		}
	}

	public void assignPlateToBatch(String garbageAccountUuid, String batchNo) {
		jdbcTemplate.update(ASSIGN_PLATE_TO_BATCH, batchNo, garbageAccountUuid);
	}

	public List<ScannedPlateInfo> findScannedPlatesByBatchNo(String batchNo) {
		return jdbcTemplate.query(SELECT_SCANNED_PLATES_BY_BATCH_NO,
				(rs, rowNum) -> ScannedPlateInfo.builder().ownerName(rs.getString("owner_name"))
						.ward(rs.getString("ward")).propertyId(rs.getString("property_id")).build(),
				batchNo);
	}

	public long countPlatesByBatchNo(String batchNo) {
		Long count = jdbcTemplate.queryForObject(COUNT_PLATES_BY_BATCH_NO, Long.class, batchNo);
		return null == count ? 0L : count;
	}

	/**
	 * Flips the batch from INITIATED to SUBMITTED and bulk-updates every
	 * plate assigned to it, in one transaction. Returns the number of batch
	 * rows updated (0 if the batch wasn't found or wasn't still INITIATED,
	 * i.e. a duplicate/racing submission).
	 */
	@Transactional
	public int submitBatch(String batchNo, String currentStatus, String newStatus, long dispatchDate,
			String modifiedBy, long modifiedTime) {
		Map<String, Object> params = new HashMap<>();
		params.put("batchNo", batchNo);
		params.put("currentStatus", currentStatus);
		params.put("status", newStatus);
		params.put("dispatchDate", dispatchDate);
		params.put("modifiedBy", modifiedBy);
		params.put("modifiedTime", modifiedTime);

		int updatedBatches = namedParameterJdbcTemplate.update(SUBMIT_BATCH, params);
		if (updatedBatches == 0) {
			return 0;
		}

		Map<String, Object> plateParams = new HashMap<>();
		plateParams.put("batchNo", batchNo);
		plateParams.put("dispatchDate", dispatchDate);
		namedParameterJdbcTemplate.update(MARK_PLATES_DISPATCHED_BY_BATCH_NO, plateParams);

		return updatedBatches;
	}

	/**
	 * Flips the batch from SUBMITTED to RECEIVED and records who received it
	 * and when. Returns the number of rows updated (0 if the batch wasn't
	 * found or wasn't still SUBMITTED, i.e. a duplicate/racing receipt
	 * confirmation).
	 */
	public int receiveBatch(String batchNo, String currentStatus, String newStatus, String receivedBy,
			long ulbReceivingDate, String modifiedBy, long modifiedTime) {
		Map<String, Object> params = new HashMap<>();
		params.put("batchNo", batchNo);
		params.put("currentStatus", currentStatus);
		params.put("status", newStatus);
		params.put("receivedBy", receivedBy);
		params.put("ulbReceivingDate", ulbReceivingDate);
		params.put("modifiedBy", modifiedBy);
		params.put("modifiedTime", modifiedTime);

		return namedParameterJdbcTemplate.update(RECEIVE_BATCH, params);
	}

	public List<DdpDispatch> searchBatches(SearchCriteriaDdpDispatch criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		StringBuilder query = new StringBuilder("SELECT uuid, batch_no, ulb, ward, dispatch_date, received_by, "
				+ "ulb_receiving_date, status, createdby, modifiedby, createdtime, modifiedtime "
				+ "FROM eg_grbg_ddp_dispatch WHERE 1=1 ");

		appendWhereClause(query, criteria, preparedStatementValues);

		query.append(" ORDER BY createdtime DESC LIMIT ? OFFSET ? ");
		preparedStatementValues.add(criteria.getLimit());
		preparedStatementValues.add(criteria.getOffset());

		return jdbcTemplate.query(query.toString(), preparedStatementValues.toArray(), this::mapDispatch);
	}

	public long countBatches(SearchCriteriaDdpDispatch criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		StringBuilder query = new StringBuilder("SELECT COUNT(*) FROM eg_grbg_ddp_dispatch WHERE 1=1 ");

		appendWhereClause(query, criteria, preparedStatementValues);

		Long count = jdbcTemplate.queryForObject(query.toString(), preparedStatementValues.toArray(), Long.class);
		return null == count ? 0L : count;
	}

	private void appendWhereClause(StringBuilder query, SearchCriteriaDdpDispatch criteria,
			List<Object> preparedStatementValues) {
		if (!CollectionUtils.isEmpty(criteria.getBatchNo())) {
			query.append(" AND batch_no IN ( ").append(getQueryForCollection(criteria.getBatchNo(), preparedStatementValues))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(criteria.getUlb())) {
			query.append(" AND ulb IN ( ").append(getQueryForCollection(criteria.getUlb(), preparedStatementValues))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(criteria.getWard())) {
			query.append(" AND ward IN ( ").append(getQueryForCollection(criteria.getWard(), preparedStatementValues))
					.append(" )");
		}
		if (!CollectionUtils.isEmpty(criteria.getStatus())) {
			query.append(" AND status IN ( ").append(getQueryForCollection(criteria.getStatus(), preparedStatementValues))
					.append(" )");
		}
		if (null != criteria.getDispatchDateFrom()) {
			query.append(" AND dispatch_date >= ? ");
			preparedStatementValues.add(criteria.getDispatchDateFrom());
		}
		if (null != criteria.getDispatchDateTo()) {
			query.append(" AND dispatch_date <= ? ");
			preparedStatementValues.add(criteria.getDispatchDateTo());
		}
	}

	private String getQueryForCollection(java.util.Collection<?> values, List<Object> preparedStatementValues) {
		StringBuilder builder = new StringBuilder();
		Iterator<?> iterator = values.iterator();
		while (iterator.hasNext()) {
			builder.append(" ?");
			preparedStatementValues.add(iterator.next());
			if (iterator.hasNext()) {
				builder.append(",");
			}
		}
		return builder.toString();
	}

	private DdpDispatch mapDispatch(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
		AuditDetails auditDetails = AuditDetails.builder().createdBy(rs.getString("createdby"))
				.lastModifiedBy(rs.getString("modifiedby")).createdTime((Long) rs.getObject("createdtime"))
				.lastModifiedTime((Long) rs.getObject("modifiedtime")).build();

		return DdpDispatch.builder().uuid(rs.getString("uuid")).batchNo(rs.getString("batch_no"))
				.ulb(rs.getString("ulb")).ward(rs.getString("ward"))
				.dispatchDate((Long) rs.getObject("dispatch_date")).receivedBy(rs.getString("received_by"))
				.ulbReceivingDate((Long) rs.getObject("ulb_receiving_date")).status(rs.getString("status"))
				.auditDetails(auditDetails).build();
	}
}
