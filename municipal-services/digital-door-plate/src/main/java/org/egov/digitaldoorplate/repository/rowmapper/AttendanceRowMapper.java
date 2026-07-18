package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.Attendance;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class AttendanceRowMapper implements RowMapper<Attendance> {

	@Override
	public Attendance mapRow(ResultSet rs, int rowNum) throws SQLException {
		return Attendance.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.staffUuid(rs.getString("staff_uuid"))
				.staffName(rs.getString("staff_name"))
				.mobileNumber(rs.getString("mobile_number"))
				.dutyStatus(rs.getString("duty_status"))
				.startTime(getLong(rs, "start_time"))
				.endTime(getLong(rs, "end_time"))
				.latitude(rs.getBigDecimal("latitude"))
				.longitude(rs.getBigDecimal("longitude"))
				.remarks(rs.getString("remarks"))
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
