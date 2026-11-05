package org.egov.digitaldoorplate.repository;

import org.egov.digitaldoorplate.model.SyncBatch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class SyncBatchRepository {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_sync_batch "
			+ "(uuid, tenant_id, staff_uuid, total_records, created_records, duplicate_records, failed_records, sync_time, createdby, createddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	@Autowired
	private JdbcTemplate jdbcTemplate;

	public void create(SyncBatch syncBatch) {
		jdbcTemplate.update(CREATE_QUERY,
				syncBatch.getUuid(),
				syncBatch.getTenantId(),
				syncBatch.getStaffUuid(),
				syncBatch.getTotalRecords(),
				syncBatch.getCreatedRecords(),
				syncBatch.getDuplicateRecords(),
				syncBatch.getFailedRecords(),
				syncBatch.getSyncTime(),
				syncBatch.getCreatedBy(),
				syncBatch.getCreatedDate());
	}
}
