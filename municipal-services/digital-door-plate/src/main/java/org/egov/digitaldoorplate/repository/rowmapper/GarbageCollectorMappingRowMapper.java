package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.GarbageCollectorMapping;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class GarbageCollectorMappingRowMapper implements RowMapper<GarbageCollectorMapping> {

	@Override
	public GarbageCollectorMapping mapRow(ResultSet rs, int rowNum) throws SQLException {
		return GarbageCollectorMapping.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.collectorUuid(rs.getString("collector_uuid"))
				.contractorUuid(rs.getString("contractor_uuid"))
				.supervisorId(rs.getString("supervisor_id"))
				.collectorUserUuid(rs.getString("collector_user_uuid"))
				.wardNumber(rs.getString("ward_number"))
				.noOfHouseAlloted(getInteger(rs, "no_of_house_alloted"))
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

	private Integer getInteger(ResultSet rs, String columnName) throws SQLException {
		int value = rs.getInt(columnName);
		return rs.wasNull() ? null : value;
	}
}
