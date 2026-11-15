package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.DoorPlate;
import org.egov.digitaldoorplate.util.JsonbUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class DoorPlateRowMapper implements RowMapper<DoorPlate> {

	@Autowired
	private JsonbUtil jsonbUtil;

	@Override
	public DoorPlate mapRow(ResultSet rs, int rowNum) throws SQLException {
		return DoorPlate.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.garbageAccountUuid(rs.getString("garbage_account_uuid"))
				.garbageId(rs.getString("garbage_id"))
				.applicationNo(rs.getString("application_no"))
				.propertyId(rs.getString("property_id"))
				.wardNumber(rs.getString("ward_number"))
				.plateStatus(rs.getString("plate_status"))
				.isQrGenerated(rs.getBoolean("is_qr_generated"))
				.qrGeneratedTime(getLong(rs, "qr_generated_time"))
				.qrGeneratedBy(rs.getString("qr_generated_by"))
				.isPrintVerified(rs.getBoolean("is_print_verified"))
				.printVerifiedTime(getLong(rs, "print_verified_time"))
				.printVerifiedBy(rs.getString("print_verified_by"))
				.verificationLatitude(rs.getBigDecimal("verification_latitude"))
				.verificationLongitude(rs.getBigDecimal("verification_longitude"))
				.isInstalled(rs.getBoolean("is_installed"))
				.installedTime(getLong(rs, "installed_time"))
				.installedBy(rs.getString("installed_by"))
				.installationLatitude(rs.getBigDecimal("installation_latitude"))
				.installationLongitude(rs.getBigDecimal("installation_longitude"))
				.remarks(rs.getString("remarks"))
				.additionalDetails(jsonbUtil.parse(rs.getString("additional_details")))
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
