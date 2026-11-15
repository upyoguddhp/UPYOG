package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaAttendance;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class AttendanceQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_attendance "
			+ "(uuid, tenant_id, staff_uuid, staff_name, mobile_number, duty_status, duty_date, start_time, end_time, latitude, longitude, remarks, additional_details, is_active, createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String END_DUTY_QUERY = "UPDATE eg_ddp_attendance "
			+ "SET duty_status = ?, end_time = ?, remarks = ?, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE uuid = ?";

	private static final String SEARCH_QUERY = "SELECT * FROM eg_ddp_attendance WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaAttendance criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getStaffUuid())) {
			query.append(" AND staff_uuid IN (").append(getPlaceholders(criteria.getStaffUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getStaffUuid());
		}
		if (null != criteria.getTenantId()) {
			query.append(" AND tenant_id = ?");
			preparedStatementValues.add(criteria.getTenantId());
		}
		if (!CollectionUtils.isEmpty(criteria.getDutyStatus())) {
			query.append(" AND duty_status IN (").append(getPlaceholders(criteria.getDutyStatus().size())).append(")");
			preparedStatementValues.addAll(criteria.getDutyStatus());
		}
		if (null != criteria.getFromDate()) {
			query.append(" AND start_time >= ?");
			preparedStatementValues.add(criteria.getFromDate());
		}
		if (null != criteria.getToDate()) {
			query.append(" AND start_time <= ?");
			preparedStatementValues.add(criteria.getToDate());
		}
		if (null != criteria.getIsActive()) {
			query.append(" AND is_active = ?");
			preparedStatementValues.add(criteria.getIsActive());
		}

		query.append(" ORDER BY start_time DESC");

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
