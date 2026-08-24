package org.egov.digitaldoorplate.repository.rowmapper;

import java.sql.ResultSet;
import java.sql.SQLException;

import org.egov.digitaldoorplate.model.Contractor;
import org.egov.digitaldoorplate.model.ContractorDetails;
import org.egov.digitaldoorplate.util.JsonbUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

@Component
public class ContractorRowMapper implements RowMapper<Contractor> {

	@Autowired
	private JsonbUtil jsonbUtil;

	@Override
	public Contractor mapRow(ResultSet rs, int rowNum) throws SQLException {
		return Contractor.builder()
				.uuid(rs.getString("uuid"))
				.tenantId(rs.getString("tenant_id"))
				.type(rs.getString("type"))
				.contractorCode(rs.getString("contractor_code"))
				.organisationName(rs.getString("organisation_name"))
				.organisationContact(rs.getString("organisation_contact"))
				.ulb(rs.getString("ulb"))
				.organisationAddress(rs.getString("organisation_address"))
				.organisationPincode(rs.getString("organisation_pincode"))
				.gender(rs.getString("gender"))
				.startDate(getLong(rs, "start_date"))
				.endDate(getLong(rs, "end_date"))
				.contractorDetails(ContractorDetails.builder()
						.name(rs.getString("contractor_name"))
						.fatherName(rs.getString("contractor_father_name"))
						.contactNumber(rs.getString("contractor_contact_number"))
						.email(rs.getString("contractor_email"))
						.address(rs.getString("contractor_address"))
						.pincode(rs.getString("contractor_pincode"))
						.dob(getLong(rs, "contractor_dob"))
						.build())
				.additionalDetails(jsonbUtil.parse(rs.getString("additional_details")))
				.status(rs.getString("status"))
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
