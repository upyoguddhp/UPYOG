package org.egov.digitaldoorplate.repository.builder;

import java.util.List;

import org.egov.digitaldoorplate.model.SearchCriteriaDoorPlate;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

@Component
public class DoorPlateQueryBuilder {

	public static final String CREATE_QUERY = "INSERT INTO eg_ddp_door_plate "
			+ "(uuid, tenant_id, garbage_account_uuid, garbage_id, application_no, property_id, ward_number, plate_status, "
			+ "is_qr_generated, qr_generated_time, qr_generated_by, "
			+ "is_print_verified, print_verified_time, print_verified_by, verification_latitude, verification_longitude, "
			+ "is_installed, installed_time, installed_by, installation_latitude, installation_longitude, "
			+ "remarks, additional_details, is_active, createdby, createddate, lastmodifiedby, lastmodifieddate) "
			+ "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

	public static final String VERIFY_PRINT_QUERY = "UPDATE eg_ddp_door_plate "
			+ "SET plate_status = ?, is_print_verified = ?, print_verified_time = ?, print_verified_by = ?, "
			+ "verification_latitude = ?, verification_longitude = ?, remarks = ?, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE uuid = ?";

	public static final String INSTALL_QUERY = "UPDATE eg_ddp_door_plate "
			+ "SET plate_status = ?, is_installed = ?, installed_time = ?, installed_by = ?, "
			+ "installation_latitude = ?, installation_longitude = ?, remarks = ?, lastmodifiedby = ?, lastmodifieddate = ? "
			+ "WHERE uuid = ?";

	private static final String SEARCH_QUERY = "SELECT * FROM eg_ddp_door_plate WHERE 1=1 ";

	public String getSearchQuery(SearchCriteriaDoorPlate criteria, List<Object> preparedStatementValues) {
		StringBuilder query = new StringBuilder(SEARCH_QUERY);

		if (!CollectionUtils.isEmpty(criteria.getUuid())) {
			query.append(" AND uuid IN (").append(getPlaceholders(criteria.getUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getUuid());
		}
		if (!CollectionUtils.isEmpty(criteria.getGarbageAccountUuid())) {
			query.append(" AND garbage_account_uuid IN (")
					.append(getPlaceholders(criteria.getGarbageAccountUuid().size())).append(")");
			preparedStatementValues.addAll(criteria.getGarbageAccountUuid());
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
		if (!CollectionUtils.isEmpty(criteria.getPlateStatus())) {
			query.append(" AND plate_status IN (").append(getPlaceholders(criteria.getPlateStatus().size()))
					.append(")");
			preparedStatementValues.addAll(criteria.getPlateStatus());
		}
		if (null != criteria.getTenantId()) {
			query.append(" AND tenant_id = ?");
			preparedStatementValues.add(criteria.getTenantId());
		}
		if (null != criteria.getIsQrGenerated()) {
			query.append(" AND is_qr_generated = ?");
			preparedStatementValues.add(criteria.getIsQrGenerated());
		}
		if (null != criteria.getIsPrintVerified()) {
			query.append(" AND is_print_verified = ?");
			preparedStatementValues.add(criteria.getIsPrintVerified());
		}
		if (null != criteria.getIsInstalled()) {
			query.append(" AND is_installed = ?");
			preparedStatementValues.add(criteria.getIsInstalled());
		}
		if (null != criteria.getIsActive()) {
			query.append(" AND is_active = ?");
			preparedStatementValues.add(criteria.getIsActive());
		}

		query.append(" ORDER BY createddate DESC");

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
