package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.DoorPlate;
import org.egov.digitaldoorplate.model.SearchCriteriaDoorPlate;
import org.egov.digitaldoorplate.repository.builder.DoorPlateQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.DoorPlateRowMapper;
import org.egov.digitaldoorplate.util.JsonbUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class DoorPlateRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private DoorPlateQueryBuilder queryBuilder;

	@Autowired
	private DoorPlateRowMapper rowMapper;

	@Autowired
	private JsonbUtil jsonbUtil;

	public void create(DoorPlate doorPlate) {
		jdbcTemplate.update(DoorPlateQueryBuilder.CREATE_QUERY,
				doorPlate.getUuid(),
				doorPlate.getTenantId(),
				doorPlate.getGarbageAccountUuid(),
				doorPlate.getGarbageId(),
				doorPlate.getApplicationNo(),
				doorPlate.getPropertyId(),
				doorPlate.getWardNumber(),
				doorPlate.getPlateStatus(),
				doorPlate.getIsQrGenerated(),
				doorPlate.getQrGeneratedTime(),
				doorPlate.getQrGeneratedBy(),
				doorPlate.getIsPrintVerified(),
				doorPlate.getPrintVerifiedTime(),
				doorPlate.getPrintVerifiedBy(),
				doorPlate.getVerificationLatitude(),
				doorPlate.getVerificationLongitude(),
				doorPlate.getIsInstalled(),
				doorPlate.getInstalledTime(),
				doorPlate.getInstalledBy(),
				doorPlate.getInstallationLatitude(),
				doorPlate.getInstallationLongitude(),
				doorPlate.getRemarks(),
				jsonbUtil.toPGobject(doorPlate.getAdditionalDetails()),
				doorPlate.getIsActive(),
				doorPlate.getCreatedBy(),
				doorPlate.getCreatedDate(),
				doorPlate.getLastModifiedBy(),
				doorPlate.getLastModifiedDate());
	}

	public void verifyPrint(DoorPlate doorPlate) {
		jdbcTemplate.update(DoorPlateQueryBuilder.VERIFY_PRINT_QUERY,
				doorPlate.getPlateStatus(),
				doorPlate.getIsPrintVerified(),
				doorPlate.getPrintVerifiedTime(),
				doorPlate.getPrintVerifiedBy(),
				doorPlate.getVerificationLatitude(),
				doorPlate.getVerificationLongitude(),
				doorPlate.getRemarks(),
				doorPlate.getLastModifiedBy(),
				doorPlate.getLastModifiedDate(),
				doorPlate.getUuid());
	}

	public void install(DoorPlate doorPlate) {
		jdbcTemplate.update(DoorPlateQueryBuilder.INSTALL_QUERY,
				doorPlate.getPlateStatus(),
				doorPlate.getIsInstalled(),
				doorPlate.getInstalledTime(),
				doorPlate.getInstalledBy(),
				doorPlate.getInstallationLatitude(),
				doorPlate.getInstallationLongitude(),
				doorPlate.getRemarks(),
				doorPlate.getLastModifiedBy(),
				doorPlate.getLastModifiedDate(),
				doorPlate.getUuid());
	}

	public List<DoorPlate> search(SearchCriteriaDoorPlate criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
