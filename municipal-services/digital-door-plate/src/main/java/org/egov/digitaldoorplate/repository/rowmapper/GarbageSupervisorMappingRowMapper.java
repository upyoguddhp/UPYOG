package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.GarbageSupervisorMapping;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class GarbageSupervisorMappingRowMapper implements RowMapper<GarbageSupervisorMapping> {

	@Override
	public GarbageSupervisorMapping mapRow(ResultSet rs, int rowNum) throws SQLException {
		return GarbageSupervisorMapping.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.supervisorUuid(rs.getString("supervisor_uuid"))
				.contractorUuid(rs.getString("contractor_uuid"))
				.supervisorUserUuid(rs.getString("supervisor_user_uuid"))
				.wardNumber(rs.getString("ward_number"))
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
