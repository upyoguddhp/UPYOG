package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.ContractorWardMapping;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class ContractorWardMappingRowMapper implements RowMapper<ContractorWardMapping> {

	@Override
	public ContractorWardMapping mapRow(ResultSet rs, int rowNum) throws SQLException {
		return ContractorWardMapping.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.contractorUuid(rs.getString("contractor_uuid"))
				.contractorUserUuid(rs.getString("contractor_user_uuid"))
				.ulb(rs.getString("ulb"))
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
