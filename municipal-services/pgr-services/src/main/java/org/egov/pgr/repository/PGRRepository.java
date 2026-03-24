package org.egov.pgr.repository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.validation.Valid;

import org.apache.commons.lang3.StringUtils;
import org.egov.pgr.repository.rowmapper.CountRowMapper;
import org.egov.pgr.repository.rowmapper.PGRNotificationRowMapper;
import org.egov.pgr.repository.rowmapper.PGRQueryBuilder;
import org.egov.pgr.repository.rowmapper.PGRRowMapper;
import org.egov.pgr.util.PGRConstants;
import org.egov.pgr.web.models.CountStatusRequest;
import org.egov.pgr.web.models.CountStatusUpdate;
import org.egov.pgr.web.models.PGRNotification;
import org.egov.pgr.web.models.PgrNotificationSearchCriteria;
import org.egov.pgr.web.models.RequestSearchCriteria;
import org.egov.pgr.web.models.Service;
import org.egov.pgr.web.models.ServiceWrapper;
import org.egov.pgr.web.models.Workflow;
import org.egov.pgr.web.models.data.Bucket;
import org.egov.pgr.web.models.data.DataItem;
import org.egov.pgr.web.models.data.GroupedData;
import org.egov.pgr.web.models.data.Metrics;
import org.egov.pgr.web.models.data.StatusCounts;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Repository
@Slf4j
public class PGRRepository {

	private PGRQueryBuilder queryBuilder;

	private PGRRowMapper rowMapper;

	private JdbcTemplate jdbcTemplate;

	@Autowired
	private CountRowMapper countRowMapper;

	@Autowired
	private PGRNotificationRowMapper pgrNotificationRowMapper;

	@Autowired
	private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

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

	public List<CountStatusUpdate> countSearch(@Valid CountStatusRequest request) throws JsonProcessingException {
		List<String> preparedStatementValues = new ArrayList<>();
		// StringBuilder searchQuery = new StringBuilder(queryBuilder.COUNT_QUERY);
		StringBuilder searchQuery = new StringBuilder(queryBuilder.COUNT_APPLCATIONSTATUS_SUMMARY);
		log.info(searchQuery.toString());
		searchQuery = addWhereClause(searchQuery, preparedStatementValues, request);
		return jdbcTemplate.query(searchQuery.toString(), preparedStatementValues.toArray(), countRowMapper);
	}

	private StringBuilder addWhereClause(StringBuilder searchQuery, List preparedStatementValues,
			@Valid CountStatusRequest request) throws JsonProcessingException {

		boolean isValid = request.getCountStatusUpdate().stream()
				.allMatch(i -> StringUtils.isEmpty(i.getTenantId()) && StringUtils.isEmpty(i.getServiceCode())
						&& (i.getAdditionalDetails() == null) && StringUtils.isEmpty(i.getDateRange())
						&& (i.getEndDate() == null && i.getEndDate() == null));

		if (isValid) {
			return searchQuery;
		}

		searchQuery.append(" WHERE");
		boolean isAppendAndClause = false;

		for (CountStatusUpdate i : request.getCountStatusUpdate()) {
			if (!StringUtils.isEmpty(i.getTenantId())) {
				isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, searchQuery);
				searchQuery.append(" pt.tenantid = ? ");
				preparedStatementValues.add(i.getTenantId());
			}
			if (!StringUtils.isEmpty(i.getServiceCode())) {
				isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, searchQuery);
				searchQuery.append(" pt.servicecode = ? ");
				preparedStatementValues.add(i.getServiceCode());
			}
			/*
			 * if(!StringUtils.isEmpty(request.getCountStatusUpdate().getDateRange())){
			 * isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, searchQuery);
			 * searchQuery.append(" pt.servicecode = ? "); }
			 */
			if (null != i.getEndDate() && null != i.getEndDate()) {
				isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, searchQuery);
				searchQuery.append(" pt.lastmodifiedtime between ? AND ? ");
				preparedStatementValues.add(i.getFromDate());
				preparedStatementValues.add(i.getEndDate());
			}
			if (null != (i.getAdditionalDetails())) {
				isAppendAndClause = addAndClauseIfRequired(isAppendAndClause, searchQuery);
				searchQuery.append(" pt.additionaldetails @> ?::jsonb ");
				preparedStatementValues.add(new ObjectMapper().writeValueAsString(i.getAdditionalDetails()));
			}

		}
		return searchQuery;
	}

	private boolean addAndClauseIfRequired(boolean b, StringBuilder searchQuery) {
		if (b)
			searchQuery.append(" AND");

		return true;
	}

	public List<PGRNotification> getPgrNotifications(PgrNotificationSearchCriteria pgrNotificationSearchCriteria) {
		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getPGRNotificationSearchQuery(pgrNotificationSearchCriteria, preparedStmtList);
		List<PGRNotification> pgrNotifications = jdbcTemplate.query(query, preparedStmtList.toArray(),
				pgrNotificationRowMapper);
		return pgrNotifications;
	}

	public void deletePgrNotifications(List<String> uuidList) {
		final Map<String, Object> uuidInputs = new HashMap<String, Object>();
		uuidInputs.put("uuid", uuidList);
		String query = queryBuilder.getPGRNotificationDeleteQuery();
		if (!CollectionUtils.isEmpty(uuidList)) {
			namedParameterJdbcTemplate.update(query, uuidInputs);
		}
	}

	// ------
	public Map<String, Long> getDepartmentWiseSlaAchievement(String stringDate, String wardName, Integer slaDays) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getDepartmentWiseSlaQuery(stringDate, wardName, slaDays, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("count"));
			}
			return result;
		});
	}

	public Metrics getDataMetrics(String date, String wardName, int slaDays) {
		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getDataMetricsSearchQuery(date, wardName, slaDays, preparedStmtList);

		return jdbcTemplate.queryForObject(query, preparedStmtList.toArray(), (rs, rowNum) -> {
			Metrics metrics = new Metrics();

			double value = rs.getDouble("avgDaysForApplicationApproval");
			BigDecimal rounded = BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);

			metrics.setAvgDaysForApplicationApproval(rounded.doubleValue());
			metrics.setStipulatedDays(rs.getInt("StipulatedDays"));

			metrics.setUniqueCitizen(rs.getInt("UniqueCitizen"));

			return metrics;
		});
	}

	public List<DataItem> getUniqueWards(String stringDate) {
		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getUniqueWardsSearchQuery(stringDate, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), (rs, rowNum) -> {
			DataItem dataItem = new DataItem();
			dataItem.setWard(rs.getString("ward"));
			dataItem.setUlb(rs.getString("ulb"));
			dataItem.setRegion(rs.getString("region"));
			return dataItem;
		});
	}

	// --------
	public GroupedData getTodaysCollectionTradeTypeGroup(String stringDate, String wardName) {
		List<Object> preparedStmtList = new ArrayList<>();
		String query = queryBuilder.getTodaysCollectionSearchQuery(stringDate, wardName, preparedStmtList);

		List<Bucket> buckets = jdbcTemplate.query(query, preparedStmtList.toArray(), (rs, rowNum) -> {
			Bucket bucket = new Bucket();
			bucket.setName(rs.getString("tradeType"));
			bucket.setValue(rs.getBigDecimal("totalTxnAmount"));
			return bucket;

		});

		GroupedData todaysCollectionTradeTypeGroup = new GroupedData();
		todaysCollectionTradeTypeGroup.setGroupBy("Departments");
		todaysCollectionTradeTypeGroup.setBuckets(buckets);

		return todaysCollectionTradeTypeGroup;
	}

	public Map<String, Long> getDepartmentWiseSlaAchivement(String stringDate, String wardName, Integer slaDays) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getDepartmentWiseSlaQuery(stringDate, wardName, slaDays, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("sla_percentage"));
			}
			return result;
		});
	}

	public List<String> getAllDepartments() {

		String query = "SELECT DISTINCT servicecode FROM eg_pgr_service_v2";

		return jdbcTemplate.query(query, (rs, rowNum) -> rs.getString("servicecode"));
	}

	public List<String> getAllStatuses() {

		String query = "SELECT DISTINCT applicationstatus FROM eg_pgr_service_v2";

		return jdbcTemplate.query(query, (rs, rowNum) -> rs.getString("applicationstatus"));
	}

	public List<String> getAllChannelsSource() {

		String query = "SELECT DISTINCT source FROM eg_pgr_service_v2";

		return jdbcTemplate.query(query, (rs, rowNum) -> rs.getString("source"));
	}

	public List<String> getAllCategories() {

		String query = "SELECT DISTINCT additionaldetails->>'grievanceType' AS category " + "FROM eg_pgr_service_v2 "
				+ "WHERE additionaldetails->>'grievanceType' IS NOT NULL";

		return jdbcTemplate.query(query, (rs, rowNum) -> rs.getString("category"));
	}

	public Map<String, BigDecimal> getDepartmentWiseCompletionRate(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getDepartmentWiseCompletionRateQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, BigDecimal> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getBigDecimal("completion_rate") == null ? BigDecimal.ZERO
						: rs.getBigDecimal("completion_rate"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodaysReopenedComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysReopenedComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("value"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodaysComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("todays_complaints"));
			}
			return result;
		});
	}

	// status
	public Map<String, Long> getStatus(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getStatusQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("status"), rs.getLong("value"));
			}
			return result;
		});
	}

	// need to change query
	// channel
	public Map<String, Long> getChannel(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getChannelQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("channel"), rs.getLong("value"));
			}
			return result;
		});
	}

	// need to change query
	// category
	public Map<String, Long> getCategory(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getCategoryQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("category"), rs.getLong("value"));
			}
			return result;
		});
	}

	// Today Open Complaints
	public Map<String, Long> getTodayOpenComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysOpenComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("todays_complaints"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodayAssisgnedComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysAssisgnedComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("todays_complaints"));
			}
			return result;
		});
	}

	public Map<String, BigDecimal> getAverageSolutionTime(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getAverageSolutionTimeQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, BigDecimal> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"),
						rs.getBigDecimal("value") == null ? BigDecimal.ZERO : rs.getBigDecimal("value"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodaysRejectedComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodayRejectedCompalaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("count"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodaysReassignComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysReassignComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("count"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodaysReassignrequestComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysReassignrequestComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("value"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodaysClosedComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysClosedComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("value"));
			}
			return result;
		});
	}

	public Map<String, Long> getTodaysResolvedComplaints(String date, String wardName) {

		List<Object> preparedStmtList = new ArrayList<>();

		String query = queryBuilder.getTodaysResolvedComplaintsQuery(date, wardName, preparedStmtList);

		return jdbcTemplate.query(query, preparedStmtList.toArray(), rs -> {
			Map<String, Long> result = new HashMap<>();
			while (rs.next()) {
				result.put(rs.getString("department"), rs.getLong("count"));
			}
			return result;
		});
	}
}
