package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaContractor;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class ContractorQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_contractor "
			+ "(uuid, tenant_id, type, contractor_code, organisation_name, organisation_contact, ulb, "
			+ "organisation_address, organisation_pincode, gender, start_date, end_date, "
			+ "contractor_name, contractor_father_name, contractor_contact_number, contractor_email, "
			+ "contractor_address, contractor_pincode, contractor_dob, additional_details, status, is_active, "
			+ "createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String UPDATE_QUERY = "UPDATE eg_ddp_contractor SET "
			+ "type = ?, contractor_code = ?, organisation_name = ?, organisation_contact = ?, ulb = ?, "
			+ "organisation_address = ?, organisation_pincode = ?, gender = ?, start_date = ?, end_date = ?, "
			+ "contractor_name = ?, contractor_father_name = ?, contractor_contact_number = ?, contractor_email = ?, "
			+ "contractor_address = ?, contractor_pincode = ?, contractor_dob = ?, additional_details = ?, "
			+ "status = ?, is_active = ?, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE uuid = ? AND tenant_id = ?";

	private static final String SEARCH_QUERY = "SELECT c.*, " + "ARRAY(" + "    SELECT DISTINCT wm.ward_number "
			+ "    FROM eg_ddp_contractor_ward_mapping wm " + "    WHERE wm.contractor_uuid = c.uuid "
			+ "    AND wm.is_active = true" + ") AS ward " + "FROM eg_ddp_contractor c " + "WHERE 1=1 ";

	private static final String COUNT_QUERY = "SELECT "
			+ "COUNT(*) AS total_vendors, "
			+ "COUNT(*) FILTER (WHERE is_active = true) AS active_vendors, "
			+ "COUNT(*) FILTER (WHERE is_active = false OR is_active IS NULL) AS inactive_vendors, "
			+ "COUNT(*) FILTER (WHERE UPPER(type) = 'CONTRACTOR') AS contractors, "
			+ "COUNT(*) FILTER (WHERE UPPER(type) IN ('NGO', 'AGENCY')) AS agencies, "
			+ "COUNT(*) FILTER (WHERE type IS NULL OR UPPER(type) NOT IN ('CONTRACTOR', 'NGO', 'AGENCY')) AS other_vendors "
			+ "FROM eg_ddp_contractor c WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaContractor criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);
		appendFilters(query, criteria, preparedStatementValues);

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

	public String getCountQuery(SearchCriteriaContractor criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(COUNT_QUERY);
		appendFilters(query, criteria, preparedStatementValues);
		return query.toString();
	}

	private void appendFilters(StringBuilder query, SearchCriteriaContractor criteria,
			List<Object> preparedStatementValues) {

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getType())) {
			query.append(" AND type IN (").append(getPlaceholders(criteria.getType().size())).append(")");
			preparedStatementValues.addAll(criteria.getType());
		}
		if (!CollectionUtils.isEmpty(criteria.getStatus())) {
			query.append(" AND status IN (").append(getPlaceholders(criteria.getStatus().size())).append(")");
			preparedStatementValues.addAll(criteria.getStatus());
		}
		if (null != criteria.getTenantId()) {
			query.append(" AND tenant_id = ?");
			preparedStatementValues.add(criteria.getTenantId());
		}
		if (null != criteria.getUlb()) {
			query.append(" AND ulb = ?");
			preparedStatementValues.add(criteria.getUlb());
		}
		if (null != criteria.getOrganisationName()) {
			query.append(" AND organisation_name ILIKE ?");
			preparedStatementValues.add("%" + criteria.getOrganisationName() + "%");
		}
		if (null != criteria.getOrganisationContact()) {
			query.append(" AND organisation_contact = ?");
			preparedStatementValues.add(criteria.getOrganisationContact());
		}
		if (null != criteria.getMobileNumber()) {
			query.append(" AND (organisation_contact = ? OR contractor_contact_number = ?)");
			preparedStatementValues.add(criteria.getMobileNumber());
			preparedStatementValues.add(criteria.getMobileNumber());
		}
		if (null != criteria.getIsActive()) {
			query.append(" AND is_active = ?");
			preparedStatementValues.add(criteria.getIsActive());
		}
		if (!CollectionUtils.isEmpty(criteria.getWard())) {
			query.append(" AND EXISTS (").append("SELECT 1 ").append("FROM eg_ddp_contractor_ward_mapping wm ")
					.append("WHERE wm.contractor_uuid = c.uuid ").append("AND wm.is_active = true ")
					.append("AND wm.ward_number IN (").append(getPlaceholders(criteria.getWard().size())).append("))");
			preparedStatementValues.addAll(criteria.getWard());
		}
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
