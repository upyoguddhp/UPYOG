package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisor;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class GarbageSupervisorQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_garbage_supervisor "
			+ "(uuid, tenant_id, supervisor_name, supervisor_code, mobile_number, email_id, gender, "
			+ "joining_date, address, ulb, is_active, createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String UPDATE_QUERY = "UPDATE eg_ddp_garbage_supervisor SET "
			+ "supervisor_name = ?, supervisor_code = ?, mobile_number = ?, email_id = ?, gender = ?, "
			+ "joining_date = ?, address = ?, ulb = ?, is_active = ?, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE uuid = ? AND tenant_id = ?";

	private static final String SEARCH_QUERY = "SELECT s.*, " + "ARRAY(" + "    SELECT DISTINCT sm.ward_number "
			+ "    FROM eg_ddp_garbage_supervisor_mapping sm " + "    WHERE sm.supervisor_uuid = s.uuid "
			+ "    AND sm.is_active = true" + ") AS ward_number, " + "(SELECT sm.contractor_uuid "
			+ " FROM eg_ddp_garbage_supervisor_mapping sm " + " WHERE sm.supervisor_uuid = s.uuid "
			+ " AND sm.is_active = true " + " LIMIT 1) AS contractor_uuid " + "FROM eg_ddp_garbage_supervisor s "
			+ "WHERE 1=1 ";
	
	public String getSearchQuery(SearchCriteriaGarbageSupervisor criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getSupervisorCode())) {
			query.append(" AND supervisor_code IN (")
					.append(getPlaceholders(criteria.getSupervisorCode().size())).append(")");
			preparedStatementValues.addAll(criteria.getSupervisorCode());
		}
		if (!CollectionUtils.isEmpty(criteria.getMobileNumber())) {
			query.append(" AND mobile_number IN (")
					.append(getPlaceholders(criteria.getMobileNumber().size())).append(")");
			preparedStatementValues.addAll(criteria.getMobileNumber());
		}
		if (null != criteria.getTenantId()) {
			query.append(" AND tenant_id = ?");
			preparedStatementValues.add(criteria.getTenantId());
		}
		if (null != criteria.getUlb()) {
			query.append(" AND ulb = ?");
			preparedStatementValues.add(criteria.getUlb());
		}
		if (null != criteria.getIsActive()) {
			query.append(" AND is_active = ?");
			preparedStatementValues.add(criteria.getIsActive());
		}
		
		if (!CollectionUtils.isEmpty(criteria.getWardNumber())) {
			query.append(" AND EXISTS (").append("SELECT 1 ").append("FROM eg_ddp_garbage_supervisor_mapping sm ")
					.append("WHERE sm.supervisor_uuid = s.uuid ").append("AND sm.is_active = true ")
					.append("AND sm.ward_number IN (").append(getPlaceholders(criteria.getWardNumber().size()))
					.append("))");

			preparedStatementValues.addAll(criteria.getWardNumber());
		}

		query.append(" ORDER BY createddate DESC");

		if (null != criteria.getLimit()) {
			query.append(" LIMIT ?");
			preparedStatementValues.add(criteria.getLimit());
		}
		if (null != criteria.getOffset()) {
			query.append(" OFFSET ?");
			preparedStatementValues.add(criteria.getOffset());
		}

		return query.toString();
	}

	private String getPlaceholders(int count) {
		StringBuilder placeholders = new StringBuilder();
		for (int i = 0; i < count; i++) {
			if (i > 0) {
				placeholders.append(", ");
			}
			placeholders.append("?");
		}
		return placeholders.toString();
	}
}
