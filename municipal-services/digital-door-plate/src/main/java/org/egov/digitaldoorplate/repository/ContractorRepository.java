package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.Contractor;
import org.egov.digitaldoorplate.model.ContractorCounts;
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
				contractor.getContractorCode(),
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

	public void update(Contractor contractor) {
		jdbcTemplate.update(ContractorQueryBuilder.UPDATE_QUERY,
				contractor.getType(),
				contractor.getContractorCode(),
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
				contractor.getLastModifiedBy(),
				contractor.getLastModifiedDate(),
				contractor.getUuid(),
				contractor.getTenantId());
	}

	public List<Contractor> search(SearchCriteriaContractor criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}

	public ContractorCounts getCounts(SearchCriteriaContractor criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getCountQuery(criteria, preparedStatementValues);
		return jdbcTemplate.queryForObject(query, preparedStatementValues.toArray(),
				(rs, rowNum) -> ContractorCounts.builder()
						.totalVendors(rs.getLong("total_vendors"))
						.activeVendors(rs.getLong("active_vendors"))
						.inactiveVendors(rs.getLong("inactive_vendors"))
						.contractors(rs.getLong("contractors"))
						.agencies(rs.getLong("agencies"))
						.otherVendors(rs.getLong("other_vendors"))
						.build());
	}
}
