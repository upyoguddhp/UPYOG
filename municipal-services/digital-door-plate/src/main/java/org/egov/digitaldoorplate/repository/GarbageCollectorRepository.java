package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.GarbageCollector;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollector;
import org.egov.digitaldoorplate.repository.builder.GarbageCollectorQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.GarbageCollectorRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GarbageCollectorRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private GarbageCollectorQueryBuilder queryBuilder;

	@Autowired
	private GarbageCollectorRowMapper rowMapper;

	public void create(GarbageCollector collector) {
		jdbcTemplate.update(GarbageCollectorQueryBuilder.CREATE_QUERY,
				collector.getUuid(),
				collector.getTenantId(),
				collector.getCollectorName(),
				collector.getCollectorCode(),
				collector.getMobileNumber(),
				collector.getEmailId(),
				collector.getGender(),
				collector.getJoiningDate(),
				collector.getAddress(),
				collector.getUlb(),
				collector.getIsActive(),
				collector.getCreatedBy(),
				collector.getCreatedDate(),
				collector.getLastModifiedBy(),
				collector.getLastModifiedDate());
	}

	public void update(GarbageCollector collector) {
		jdbcTemplate.update(GarbageCollectorQueryBuilder.UPDATE_QUERY,
				collector.getCollectorName(),
				collector.getCollectorCode(),
				collector.getMobileNumber(),
				collector.getEmailId(),
				collector.getGender(),
				collector.getJoiningDate(),
				collector.getAddress(),
				collector.getUlb(),
				collector.getIsActive(),
				collector.getLastModifiedBy(),
				collector.getLastModifiedDate(),
				collector.getUuid(),
				collector.getTenantId());
	}

	public List<GarbageCollector> search(SearchCriteriaGarbageCollector criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
