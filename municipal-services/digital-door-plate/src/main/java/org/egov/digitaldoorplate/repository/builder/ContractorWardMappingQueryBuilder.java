package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaContractorWardMapping;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class ContractorWardMappingQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_contractor_ward_mapping "
			+ "(uuid, tenant_id, contractor_uuid, contractor_user_uuid, ulb, ward_number, is_active, "
			+ "createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String DEACTIVATE_ALL_QUERY = "UPDATE eg_ddp_contractor_ward_mapping "
			+ "SET is_active = false, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE contractor_uuid = ? AND is_active = true";

	private static final String SEARCH_QUERY = "SELECT * FROM eg_ddp_contractor_ward_mapping WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaContractorWardMapping criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
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
