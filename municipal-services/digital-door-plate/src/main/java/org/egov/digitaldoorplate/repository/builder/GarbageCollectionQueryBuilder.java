package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollection;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class GarbageCollectionQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_garbage_collection "
			+ "(uuid, tenant_id, attendance_uuid, staff_uuid, garbage_account_uuid, sub_account_uuid, garbage_id, application_no, property_id, ward_number, "
			+ "is_resident_available, waste_type, is_waste_kept_outside, is_collected, applied_to_all_tenants, collection_time, latitude, longitude, client_ref_id, sync_batch_uuid, remarks, additional_details, is_active, "
			+ "createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String UPDATE_QUERY = "UPDATE eg_ddp_garbage_collection "
			+ "SET is_resident_available = ?, waste_type = ?, is_waste_kept_outside = ?, is_collected = ?, applied_to_all_tenants = ?, "
			+ "collection_time = ?, latitude = ?, longitude = ?, remarks = ?, additional_details = ?, is_active = ?, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE uuid = ?";

	private static final String SEARCH_QUERY = "SELECT * FROM eg_ddp_garbage_collection WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaGarbageCollection criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getAttendanceUuid())) {
			query.append(" AND attendance_uuid IN (").append(getPlaceholders(criteria.getAttendanceUuid().size()))
					.append(")");
			preparedStatementValues.addAll(criteria.getAttendanceUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getStaffUuid())) {
			query.append(" AND staff_uuid IN (").append(getPlaceholders(criteria.getStaffUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getStaffUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getGarbageAccountUuid())) {
			query.append(" AND garbage_account_uuid IN (")
					.append(getPlaceholders(criteria.getGarbageAccountUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getGarbageAccountUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getSubAccountUuid())) {
			query.append(" AND sub_account_uuid IN (").append(getPlaceholders(criteria.getSubAccountUuid().size()))
					.append(")");
			preparedStatementValues.addAll(criteria.getSubAccountUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getApplicationNo())) {
			query.append(" AND application_no IN (").append(getPlaceholders(criteria.getApplicationNo().size()))
					.append(")");
			preparedStatementValues.addAll(criteria.getApplicationNo());
		}
		if (!CollectionUtils.isEmpty(criteria.getPropertyId())) {
			query.append(" AND property_id IN (").append(getPlaceholders(criteria.getPropertyId().size())).append(")");
			preparedStatementValues.addAll(criteria.getPropertyId());
		}
		if (!CollectionUtils.isEmpty(criteria.getWardNumber())) {
			query.append(" AND ward_number IN (").append(getPlaceholders(criteria.getWardNumber().size()))
					.append(")");
			preparedStatementValues.addAll(criteria.getWardNumber());
		}
		if (!CollectionUtils.isEmpty(criteria.getClientRefId())) {
			query.append(" AND client_ref_id IN (").append(getPlaceholders(criteria.getClientRefId().size()))
					.append(")");
			preparedStatementValues.addAll(criteria.getClientRefId());
		}
		if (!CollectionUtils.isEmpty(criteria.getWasteType())) {
			query.append(" AND waste_type IN (").append(getPlaceholders(criteria.getWasteType().size())).append(")");
			preparedStatementValues.addAll(criteria.getWasteType());
		}
		if (null != criteria.getTenantId()) {
			query.append(" AND tenant_id = ?");
			preparedStatementValues.add(criteria.getTenantId());
		}
		if (null != criteria.getIsCollected()) {
			query.append(" AND is_collected = ?");
			preparedStatementValues.add(criteria.getIsCollected());
		}
		if (null != criteria.getFromDate()) {
			query.append(" AND collection_time >= ?");
			preparedStatementValues.add(criteria.getFromDate());
		}
		if (null != criteria.getToDate()) {
			query.append(" AND collection_time <= ?");
			preparedStatementValues.add(criteria.getToDate());
		}
		if (null != criteria.getIsActive()) {
			query.append(" AND is_active = ?");
			preparedStatementValues.add(criteria.getIsActive());
		}

		query.append(" ORDER BY collection_time DESC");

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
