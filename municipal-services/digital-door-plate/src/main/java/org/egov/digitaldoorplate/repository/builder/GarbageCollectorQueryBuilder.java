package org.egov.digitaldoorplate.repository.builder;

import java.util.List;
import java.util.stream.Collectors;

import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollector;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class GarbageCollectorQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_garbage_collector "
			+ "(uuid, tenant_id, collector_name, collector_code, mobile_number, email_id, gender, "
			+ "joining_date, address, ulb, is_active, createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String UPDATE_QUERY = "UPDATE eg_ddp_garbage_collector SET "
			+ "collector_name = ?, collector_code = ?, mobile_number = ?, email_id = ?, gender = ?, "
			+ "joining_date = ?, address = ?, ulb = ?, is_active = ?, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE uuid = ? AND tenant_id = ?";

	private static final String SEARCH_QUERY = "SELECT c.*, " + "ARRAY(" + "    SELECT DISTINCT cm.ward_number "
			+ "    FROM eg_ddp_garbage_collector_mapping cm " + "    WHERE cm.collector_uuid = c.uuid "
			+ "    AND cm.is_active = true" + ") AS ward_number, " + "(SELECT cm.contractor_uuid "
			+ " FROM eg_ddp_garbage_collector_mapping cm " + " WHERE cm.collector_uuid = c.uuid "
			+ " AND cm.is_active = true " + " LIMIT 1) AS contractor_uuid, " + "(SELECT cm.supervisor_id "
			+ " FROM eg_ddp_garbage_collector_mapping cm " + " WHERE cm.collector_uuid = c.uuid "
			+ " AND cm.is_active = true " + " LIMIT 1) AS supervisor_id, " + "(SELECT cm.no_of_house_alloted "
			+ " FROM eg_ddp_garbage_collector_mapping cm " + " WHERE cm.collector_uuid = c.uuid "
			+ " AND cm.is_active = true " + " LIMIT 1) AS no_of_house_alloted " + "FROM eg_ddp_garbage_collector c "
			+ "WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaGarbageCollector criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getCollectorCode())) {
			query.append(" AND collector_code IN (")
					.append(getPlaceholders(criteria.getCollectorCode().size())).append(")");
			preparedStatementValues.addAll(criteria.getCollectorCode());
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
			if (null != criteria.getSupervisorId()) {
				query.append(" AND EXISTS (").append("SELECT 1 ").append("FROM eg_ddp_garbage_collector_mapping cm ")
						.append("WHERE cm.collector_uuid = c.uuid ").append("AND cm.is_active = true ")
						.append("AND cm.supervisor_id = ?)");
				preparedStatementValues.add(criteria.getSupervisorId());
			}
			if (null != criteria.getWardNumber() && !criteria.getWardNumber().isEmpty()) {
				query.append(" AND EXISTS (").append("SELECT 1 ").append("FROM eg_ddp_garbage_collector_mapping cm ")
						.append("WHERE cm.collector_uuid = c.uuid ").append("AND cm.is_active = true ")
						.append("AND cm.ward_number IN (");
				query.append(criteria.getWardNumber().stream().map(ward -> "?").collect(Collectors.joining(", ")));
				query.append("))");

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
