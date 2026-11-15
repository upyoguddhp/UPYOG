package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.CollectorWardAssignment;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class CollectorWardAssignmentRowMapper implements RowMapper<CollectorWardAssignment> {

	@Override
	public CollectorWardAssignment mapRow(ResultSet rs, int rowNum) throws SQLException {
		return CollectorWardAssignment.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.collectorUuid(rs.getString("collector_uuid"))
				.collectorName(rs.getString("collector_name"))
				.mobileNumber(rs.getString("mobile_number"))
				.contractorUuid(rs.getString("contractor_uuid"))
				.wardNumber(rs.getString("ward_number"))
				.assignmentStatus(rs.getString("assignment_status"))
				.assignedTime(getLong(rs, "assigned_time"))
				.assignedBy(rs.getString("assigned_by"))
				.unassignedTime(getLong(rs, "unassigned_time"))
				.unassignedBy(rs.getString("unassigned_by"))
				.isActive(rs.getBoolean("is_active"))
				.createdBy(rs.getString("createdby"))
				.createdDate(getLong(rs, "createddate"))
				.lastModifiedBy(rs.getString("lastmodifiedby"))
				.lastModifiedDate(getLong(rs, "lastmodifieddate"))
				.build();
	}

	private Long getLong(ResultSet rs, String columnName) throws SQLException {
		long value = rs.getLong(columnName);
		return rs.wasNull() ? null : value;
	}
}
