package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.ContractorWardMapping;
import org.egov.digitaldoorplate.model.SearchCriteriaContractorWardMapping;
import org.egov.digitaldoorplate.repository.builder.ContractorWardMappingQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.ContractorWardMappingRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ContractorWardMappingRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private ContractorWardMappingQueryBuilder queryBuilder;

	@Autowired
	private ContractorWardMappingRowMapper rowMapper;

	public void create(ContractorWardMapping mapping) {
		jdbcTemplate.update(ContractorWardMappingQueryBuilder.CREATE_QUERY,
				mapping.getUuid(),
				mapping.getTenantId(),
				mapping.getContractorUuid(),
				mapping.getUlb(),
				mapping.getWardNumber(),
				mapping.getIsActive(),
				mapping.getCreatedBy(),
				mapping.getCreatedDate(),
				mapping.getLastModifiedBy(),
				mapping.getLastModifiedDate());
	}

	public List<ContractorWardMapping> search(SearchCriteriaContractorWardMapping criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
