package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.GarbageSupervisor;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisor;
import org.egov.digitaldoorplate.repository.builder.GarbageSupervisorQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.GarbageSupervisorRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GarbageSupervisorRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private GarbageSupervisorQueryBuilder queryBuilder;

	@Autowired
	private GarbageSupervisorRowMapper rowMapper;

	public void create(GarbageSupervisor supervisor) {
		jdbcTemplate.update(GarbageSupervisorQueryBuilder.CREATE_QUERY,
				supervisor.getUuid(),
				supervisor.getTenantId(),
				supervisor.getSupervisorName(),
				supervisor.getSupervisorCode(),
				supervisor.getMobileNumber(),
				supervisor.getEmailId(),
				supervisor.getGender(),
				supervisor.getJoiningDate(),
				supervisor.getAddress(),
				supervisor.getUlb(),
				supervisor.getIsActive(),
				supervisor.getCreatedBy(),
				supervisor.getCreatedDate(),
				supervisor.getLastModifiedBy(),
				supervisor.getLastModifiedDate());
	}

	public void update(GarbageSupervisor supervisor) {
		jdbcTemplate.update(GarbageSupervisorQueryBuilder.UPDATE_QUERY,
				supervisor.getSupervisorName(),
				supervisor.getSupervisorCode(),
				supervisor.getMobileNumber(),
				supervisor.getEmailId(),
				supervisor.getGender(),
				supervisor.getJoiningDate(),
				supervisor.getAddress(),
				supervisor.getUlb(),
				supervisor.getIsActive(),
				supervisor.getLastModifiedBy(),
				supervisor.getLastModifiedDate(),
				supervisor.getUuid(),
				supervisor.getTenantId());
	}

	public List<GarbageSupervisor> search(SearchCriteriaGarbageSupervisor criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
