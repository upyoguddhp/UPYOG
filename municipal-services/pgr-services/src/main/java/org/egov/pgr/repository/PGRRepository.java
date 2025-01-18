package org.egov.pgr.repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.validation.Valid;

import org.apache.commons.lang3.StringUtils;
import org.egov.pgr.repository.rowmapper.CountRowMapper;
import org.egov.pgr.repository.rowmapper.PGRQueryBuilder;
import org.egov.pgr.repository.rowmapper.PGRRowMapper;
import org.egov.pgr.util.PGRConstants;
import org.egov.pgr.web.models.CountStatusUpdate;
import org.egov.pgr.web.models.RequestSearchCriteria;
import org.egov.pgr.web.models.Service;
import org.egov.pgr.web.models.ServiceWrapper;
import org.egov.pgr.web.models.Workflow;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
public class PGRRepository {

	private PGRQueryBuilder queryBuilder;

	private PGRRowMapper rowMapper;

	private JdbcTemplate jdbcTemplate;

	private ObjectMapper mapper;

	@Autowired
	private CountRowMapper countRowMapper;

	@Autowired
	public PGRRepository(PGRQueryBuilder queryBuilder, PGRRowMapper rowMapper, JdbcTemplate jdbcTemplate) {
		this.queryBuilder = queryBuilder;
		this.rowMapper = rowMapper;
		this.jdbcTemplate = jdbcTemplate;
	}

	/**
	 * searches services based on search criteria and then wraps it into
	 * serviceWrappers
	 * 
	 * @param criteria
	 * @return
	 */
	public List<ServiceWrapper> getServiceWrappers(RequestSearchCriteria criteria) {
		List<Service> services = getServices(criteria);
		List<String> serviceRequestids = services.stream().map(Service::getServiceRequestId)
				.collect(Collectors.toList());
		Map<String, Workflow> idToWorkflowMap = new HashMap<>();
		List<ServiceWrapper> serviceWrappers = new ArrayList<>();

		for (Service service : services) {
			ServiceWrapper serviceWrapper = ServiceWrapper.builder().service(service)
					.workflow(idToWorkflowMap.get(service.getServiceRequestId())).build();
			serviceWrappers.add(serviceWrapper);
		}
		return serviceWrappers;
	}

	/**
	 * searches services based on search criteria
	 * 
	 * @param criteria
	 * @return
	 */
	public List<Service> getServices(RequestSearchCriteria criteria) {
		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getPGRSearchQuery(criteria, preparedStmtList);
		List<Service> services = jdbcTemplate.query(query, preparedStmtList.toArray(), rowMapper);
		return services;
	}

	/**
	 * Returns the count based on the search criteria
	 * 
	 * @param criteria
	 * @return
	 */
	public Integer getCount(RequestSearchCriteria criteria) {
		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getCountQuery(criteria, preparedStmtList);
		Integer count = jdbcTemplate.queryForObject(query, preparedStmtList.toArray(), Integer.class);
		return count;
	}

	public Map<String, Integer> fetchDynamicData(String tenantId) {
		List<Object> preparedStmtListCompalintsResolved = new ArrayList<>();
		String query = queryBuilder.getResolvedComplaints(tenantId, preparedStmtListCompalintsResolved);

		int complaintsResolved = jdbcTemplate.queryForObject(query, preparedStmtListCompalintsResolved.toArray(),
				Integer.class);

		List<Object> preparedStmtListAverageResolutionTime = new ArrayList<>();
		query = queryBuilder.getAverageResolutionTime(tenantId, preparedStmtListAverageResolutionTime);

		int averageResolutionTime = jdbcTemplate.queryForObject(query, preparedStmtListAverageResolutionTime.toArray(),
				Integer.class);

		Map<String, Integer> dynamicData = new HashMap<String, Integer>();
		dynamicData.put(PGRConstants.COMPLAINTS_RESOLVED, complaintsResolved);
		dynamicData.put(PGRConstants.AVERAGE_RESOLUTION_TIME, averageResolutionTime);

		return dynamicData;
	}

	public CountStatusUpdate countSearch(@Valid RequestSearchCriteria criteria) throws JsonProcessingException {
		List<Object> preparedStatementValues = new ArrayList<>(); // Change List<String> to List<Object>

		StringBuilder searchQuery = new StringBuilder(queryBuilder.COUNT_STATUS_FOR_PGR);

		searchQuery = addWhereClause(searchQuery, preparedStatementValues, criteria);

		log.info("Final Query: " + searchQuery.toString()); // Log the actual query
		
		List<CountStatusUpdate> results = jdbcTemplate.query(
		        searchQuery.toString(), 
		        preparedStatementValues.toArray(), 
		        countRowMapper
		    );

		 return results.isEmpty() ? null : results.get(0);
	}

	private StringBuilder addWhereClause(StringBuilder searchQuery, List preparedStatementValues,
			@Valid RequestSearchCriteria criteria) throws JsonProcessingException {
		try {
			searchQuery.append(" WHERE");
			boolean isAppendAndClause = false;
			if (StringUtils.isNotEmpty(criteria.getTenantId())) {
				isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, searchQuery);
				searchQuery.append(" pt.tenantid = ? ");
				preparedStatementValues.add(criteria.getTenantId());
			}
			
			if(StringUtils.isNotEmpty(criteria.getAccountId())) {
				isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, searchQuery);
				searchQuery.append(" pt.accountid = ? ");
				preparedStatementValues.add(criteria.getAccountId());
				
			}

		} catch (Exception e) {
			throw new RuntimeException(e.getMessage());
		}
		return searchQuery;
	}

	private boolean addAndClauseIfRequired(boolean b, StringBuilder searchQuery) {
		if (b)
			searchQuery.append(" AND");

		return true;
	}

}
