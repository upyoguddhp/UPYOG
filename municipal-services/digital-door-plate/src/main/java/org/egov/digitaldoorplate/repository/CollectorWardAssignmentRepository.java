package org.egov.digitaldoorplate.repository;

import java.util.ArrayList;
import java.util.List;

import org.egov.digitaldoorplate.model.CollectorWardAssignment;
import org.egov.digitaldoorplate.model.SearchCriteriaCollectorWardAssignment;
import org.egov.digitaldoorplate.repository.builder.CollectorWardAssignmentQueryBuilder;
import org.egov.digitaldoorplate.repository.rowmapper.CollectorWardAssignmentRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class CollectorWardAssignmentRepository {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Autowired
	private CollectorWardAssignmentQueryBuilder queryBuilder;

	@Autowired
	private CollectorWardAssignmentRowMapper rowMapper;

	public void create(CollectorWardAssignment assignment) {
		jdbcTemplate.update(CollectorWardAssignmentQueryBuilder.CREATE_QUERY,
				assignment.getUuid(),
				assignment.getTenantId(),
				assignment.getCollectorUuid(),
				assignment.getCollectorName(),
				assignment.getMobileNumber(),
				assignment.getContractorUuid(),
				assignment.getWardNumber(),
				assignment.getAssignmentStatus(),
				assignment.getAssignedTime(),
				assignment.getAssignedBy(),
				assignment.getUnassignedTime(),
				assignment.getUnassignedBy(),
				assignment.getIsActive(),
				assignment.getCreatedBy(),
				assignment.getCreatedDate(),
				assignment.getLastModifiedBy(),
				assignment.getLastModifiedDate());
	}

	public void unassign(CollectorWardAssignment assignment) {
		jdbcTemplate.update(CollectorWardAssignmentQueryBuilder.UNASSIGN_QUERY,
				assignment.getAssignmentStatus(),
				assignment.getUnassignedTime(),
				assignment.getUnassignedBy(),
				assignment.getLastModifiedBy(),
				assignment.getLastModifiedDate(),
				assignment.getUuid());
	}

	public List<CollectorWardAssignment> search(SearchCriteriaCollectorWardAssignment criteria) {
		List<Object> preparedStatementValues = new ArrayList<>();
		String query = queryBuilder.getSearchQuery(criteria, preparedStatementValues);
		return jdbcTemplate.query(query, preparedStatementValues.toArray(), rowMapper);
	}
}
