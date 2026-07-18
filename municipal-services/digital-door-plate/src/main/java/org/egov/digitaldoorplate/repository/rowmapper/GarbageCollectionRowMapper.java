package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.GarbageCollection;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class GarbageCollectionRowMapper implements RowMapper<GarbageCollection> {

	@Override
	public GarbageCollection mapRow(ResultSet rs, int rowNum) throws SQLException {
		return GarbageCollection.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.attendanceUuid(rs.getString("attendance_uuid"))
				.staffUuid(rs.getString("staff_uuid"))
				.garbageAccountUuid(rs.getString("garbage_account_uuid"))
				.subAccountUuid(rs.getString("sub_account_uuid"))
				.garbageId(rs.getString("garbage_id"))
				.applicationNo(rs.getString("application_no"))
				.propertyId(rs.getString("property_id"))
				.isResidentAvailable(getBoolean(rs, "is_resident_available"))
				.wasteType(rs.getString("waste_type"))
				.isWasteKeptOutside(getBoolean(rs, "is_waste_kept_outside"))
				.isCollected(getBoolean(rs, "is_collected"))
				.appliedToAllTenants(getBoolean(rs, "applied_to_all_tenants"))
				.collectionTime(getLong(rs, "collection_time"))
				.latitude(rs.getBigDecimal("latitude"))
				.longitude(rs.getBigDecimal("longitude"))
				.clientRefId(rs.getString("client_ref_id"))
				.syncBatchUuid(rs.getString("sync_batch_uuid"))
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

	private Boolean getBoolean(ResultSet rs, String columnName) throws SQLException {
		boolean value = rs.getBoolean(columnName);
		return rs.wasNull() ? null : value;
	}
}
