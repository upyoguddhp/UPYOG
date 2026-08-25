package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorMapping;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class GarbageCollectorMappingQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_garbage_collector_mapping "
			+ "(uuid, tenant_id, collector_uuid, contractor_uuid, supervisor_id, collector_user_uuid, "
			+ "ward_number, no_of_house_alloted, is_active, createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String DEACTIVATE_ALL_QUERY = "UPDATE eg_ddp_garbage_collector_mapping "
			+ "SET is_active = false, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE collector_uuid = ? AND is_active = true";

	private static final String SEARCH_QUERY = "SELECT * FROM eg_ddp_garbage_collector_mapping WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaGarbageCollectorMapping criteria,
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
		if (null != criteria.getSupervisorId()) {
			query.append(" AND supervisor_id = ?");
			preparedStatementValues.add(criteria.getSupervisorId());
		}
		if (!CollectionUtils.isEmpty(criteria.getWardNumber())) {
			query.append(" AND ward_number IN (")
					.append(getPlaceholders(criteria.getWardNumber().size())).append(")");
			preparedStatementValues.addAll(criteria.getWardNumber());
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
