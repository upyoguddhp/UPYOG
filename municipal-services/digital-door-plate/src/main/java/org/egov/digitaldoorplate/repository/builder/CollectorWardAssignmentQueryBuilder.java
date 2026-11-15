package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaCollectorWardAssignment;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class CollectorWardAssignmentQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_collector_ward_assignment "
			+ "(uuid, tenant_id, collector_uuid, collector_name, mobile_number, contractor_uuid, ward_number, "
			+ "assignment_status, assigned_time, assigned_by, unassigned_time, unassigned_by, is_active, "
			+ "createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String UNASSIGN_QUERY = "UPDATE eg_ddp_collector_ward_assignment "
			+ "SET assignment_status = ?, unassigned_time = ?, unassigned_by = ?, "
			+ "lastmodifiedby = ?, lastmodifieddate = ? WHERE uuid = ?";

	private static final String SEARCH_QUERY = "SELECT * FROM eg_ddp_collector_ward_assignment WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaCollectorWardAssignment criteria,
			List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getCollectorUuid())) {
			query.append(" AND collector_uuid IN (")
					.append(getPlaceholders(criteria.getCollectorUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getCollectorUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getContractorUuid())) {
			query.append(" AND contractor_uuid IN (")
					.append(getPlaceholders(criteria.getContractorUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getContractorUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getWardNumber())) {
			query.append(" AND ward_number IN (").append(getPlaceholders(criteria.getWardNumber().size()))
					.append(")");
			preparedStatementValues.addAll(criteria.getWardNumber());
		}
		if (!CollectionUtils.isEmpty(criteria.getAssignmentStatus())) {
			query.append(" AND assignment_status IN (")
					.append(getPlaceholders(criteria.getAssignmentStatus().size())).append(")");
			preparedStatementValues.addAll(criteria.getAssignmentStatus());
		}
		if (null != criteria.getTenantId()) {
			query.append(" AND tenant_id = ?");
			preparedStatementValues.add(criteria.getTenantId());
		}
		if (null != criteria.getIsActive()) {
			query.append(" AND is_active = ?");
			preparedStatementValues.add(criteria.getIsActive());
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
