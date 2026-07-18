package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.GarbageCollection;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollection;
import org.egov.digitaldoorplate.repository.builder.GarbageCollectionQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.GarbageCollectionRowMapper;
import org.egov.digitaldoorplate.util.JsonbUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GarbageCollectionRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private GarbageCollectionQueryBuilder queryBuilder;

	@Autowired
	private GarbageCollectionRowMapper rowMapper;

	@Autowired
	private JsonbUtil jsonbUtil;

	public void create(GarbageCollection garbageCollection) {
		jdbcTemplate.update(GarbageCollectionQueryBuilder.CREATE_QUERY,
				garbageCollection.getUuid(),
				garbageCollection.getTenantId(),
				garbageCollection.getAttendanceUuid(),
				garbageCollection.getStaffUuid(),
				garbageCollection.getGarbageAccountUuid(),
				garbageCollection.getSubAccountUuid(),
				garbageCollection.getGarbageId(),
				garbageCollection.getApplicationNo(),
				garbageCollection.getPropertyId(),
				garbageCollection.getWardNumber(),
				garbageCollection.getIsResidentAvailable(),
				garbageCollection.getWasteType(),
				garbageCollection.getIsWasteKeptOutside(),
				garbageCollection.getIsCollected(),
				garbageCollection.getAppliedToAllTenants(),
				garbageCollection.getCollectionTime(),
				garbageCollection.getLatitude(),
				garbageCollection.getLongitude(),
				garbageCollection.getClientRefId(),
				garbageCollection.getSyncBatchUuid(),
				garbageCollection.getRemarks(),
				jsonbUtil.toPGobject(garbageCollection.getAdditionalDetails()),
				garbageCollection.getIsActive(),
				garbageCollection.getCreatedBy(),
				garbageCollection.getCreatedDate(),
				garbageCollection.getLastModifiedBy(),
				garbageCollection.getLastModifiedDate());
	}

	public void update(GarbageCollection garbageCollection) {
		jdbcTemplate.update(GarbageCollectionQueryBuilder.UPDATE_QUERY,
				garbageCollection.getIsResidentAvailable(),
				garbageCollection.getWasteType(),
				garbageCollection.getIsWasteKeptOutside(),
				garbageCollection.getIsCollected(),
				garbageCollection.getAppliedToAllTenants(),
				garbageCollection.getCollectionTime(),
				garbageCollection.getLatitude(),
				garbageCollection.getLongitude(),
				garbageCollection.getRemarks(),
				jsonbUtil.toPGobject(garbageCollection.getAdditionalDetails()),
				garbageCollection.getIsActive(),
				garbageCollection.getLastModifiedBy(),
				garbageCollection.getLastModifiedDate(),
				garbageCollection.getUuid());
	}

	public List<GarbageCollection> search(SearchCriteriaGarbageCollection criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
