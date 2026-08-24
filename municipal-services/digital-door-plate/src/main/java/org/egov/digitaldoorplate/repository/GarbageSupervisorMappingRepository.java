package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.GarbageSupervisorMapping;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisorMapping;
import org.egov.digitaldoorplate.repository.builder.GarbageSupervisorMappingQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.GarbageSupervisorMappingRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GarbageSupervisorMappingRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private GarbageSupervisorMappingQueryBuilder queryBuilder;

	@Autowired
	private GarbageSupervisorMappingRowMapper rowMapper;

	public void create(GarbageSupervisorMapping mapping) {
		jdbcTemplate.update(GarbageSupervisorMappingQueryBuilder.CREATE_QUERY,
				mapping.getUuid(),
				mapping.getTenantId(),
				mapping.getSupervisorUuid(),
				mapping.getContractorUuid(),
				mapping.getSupervisorUserUuid(),
				mapping.getWardNumber(),
				mapping.getIsActive(),
				mapping.getCreatedBy(),
				mapping.getCreatedDate(),
				mapping.getLastModifiedBy(),
				mapping.getLastModifiedDate());
	}

	public List<GarbageSupervisorMapping> search(SearchCriteriaGarbageSupervisorMapping criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
