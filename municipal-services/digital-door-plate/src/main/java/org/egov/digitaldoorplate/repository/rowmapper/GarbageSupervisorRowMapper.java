package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.GarbageSupervisor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class GarbageSupervisorRowMapper implements RowMapper<GarbageSupervisor> {

	@Override
	public GarbageSupervisor mapRow(ResultSet rs, int rowNum) throws SQLException {
		return GarbageSupervisor.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.supervisorName(rs.getString("supervisor_name"))
				.supervisorCode(rs.getString("supervisor_code"))
				.mobileNumber(rs.getString("mobile_number"))
				.emailId(rs.getString("email_id"))
				.gender(rs.getString("gender"))
				.joiningDate(getLong(rs, "joining_date"))
				.address(rs.getString("address"))
				.ulb(rs.getString("ulb"))
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
