package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.GarbageCollectorMapping;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorMapping;
import org.egov.digitaldoorplate.repository.builder.GarbageCollectorMappingQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.GarbageCollectorMappingRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GarbageCollectorMappingRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private GarbageCollectorMappingQueryBuilder queryBuilder;

	@Autowired
	private GarbageCollectorMappingRowMapper rowMapper;

	public void create(GarbageCollectorMapping mapping) {
		jdbcTemplate.update(GarbageCollectorMappingQueryBuilder.CREATE_QUERY,
				mapping.getUuid(),
				mapping.getTenantId(),
				mapping.getCollectorUuid(),
				mapping.getContractorUuid(),
				mapping.getSupervisorId(),
				mapping.getCollectorUserUuid(),
				mapping.getWardNumber(),
				mapping.getNoOfHouseAlloted(),
				mapping.getIsActive(),
				mapping.getCreatedBy(),
				mapping.getCreatedDate(),
				mapping.getLastModifiedBy(),
				mapping.getLastModifiedDate());
	}

	public List<GarbageCollectorMapping> search(SearchCriteriaGarbageCollectorMapping criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}

	public void deactivateAll(String collectorUuid, String userUuid, Long now) {
		jdbcTemplate.update(GarbageCollectorMappingQueryBuilder.DEACTIVATE_ALL_QUERY, userUuid, now, collectorUuid);
	}
}
