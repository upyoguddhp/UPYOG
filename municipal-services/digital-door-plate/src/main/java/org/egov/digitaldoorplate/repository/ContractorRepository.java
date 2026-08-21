package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.Contractor;
import org.egov.digitaldoorplate.model.SearchCriteriaContractor;
import org.egov.digitaldoorplate.repository.builder.ContractorQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.ContractorRowMapper;
import org.egov.digitaldoorplate.util.JsonbUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ContractorRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private ContractorQueryBuilder queryBuilder;

	@Autowired
	private ContractorRowMapper rowMapper;

	@Autowired
	private JsonbUtil jsonbUtil;

	public void create(Contractor contractor) {
		jdbcTemplate.update(ContractorQueryBuilder.CREATE_QUERY,
				contractor.getUuid(),
				contractor.getTenantId(),
				contractor.getType(),
				contractor.getOrganisationName(),
				contractor.getOrganisationContact(),
				contractor.getUlb(),
				contractor.getOrganisationAddress(),
				contractor.getOrganisationPincode(),
				contractor.getGender(),
				contractor.getStartDate(),
				contractor.getEndDate(),
				contractor.getContractorDetails().getName(),
				contractor.getContractorDetails().getFatherName(),
				contractor.getContractorDetails().getContactNumber(),
				contractor.getContractorDetails().getEmail(),
				contractor.getContractorDetails().getAddress(),
				contractor.getContractorDetails().getPincode(),
				contractor.getContractorDetails().getDob(),
				jsonbUtil.toPGobject(contractor.getAdditionalDetails()),
				contractor.getStatus(),
				contractor.getIsActive(),
				contractor.getCreatedBy(),
				contractor.getCreatedDate(),
				contractor.getLastModifiedBy(),
				contractor.getLastModifiedDate());
	}

	public List<Contractor> search(SearchCriteriaContractor criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
