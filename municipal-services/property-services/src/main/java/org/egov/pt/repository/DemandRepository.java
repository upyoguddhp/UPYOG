package org.egov.pt.repository;

import java.util.List;
import java.util.Set;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.pt.config.PropertyConfiguration;
import org.egov.pt.models.bill.Demand;
import org.egov.pt.models.bill.DemandRequest;
import org.egov.pt.models.bill.DemandResponse;
import org.egov.pt.web.contracts.RequestInfoWrapper;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

@Repository
public class DemandRepository {

	@Autowired
	private RestCallRepository restCallRepository;

	@Autowired
	private PropertyConfiguration config;

	@Autowired
	private ObjectMapper objectMapper;

	/**
	 * Creates demand
	 * 
	 * @param requestInfo The RequestInfo of the calculation Request
	 * @param demands     The demands to be created
	 * @return The list of demand created
	 */
	public List<Demand> saveDemand(RequestInfo requestInfo, List<Demand> demands) {
		StringBuilder url = new StringBuilder(config.getBillHost());
		url.append(config.getDemandCreateEndpoint());
		DemandRequest request = new DemandRequest(requestInfo, demands);
		Object result = restCallRepository.fetchResult(url, request);
		DemandResponse response = null;
		try {
			response = objectMapper.convertValue(result, DemandResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response of create demand");
		}
		return response.getDemands();
	}

	/**
	 * Updates the demand
	 * 
	 * @param requestInfo The RequestInfo of the calculation Request
	 * @param demands     The demands to be updated
	 * @return The list of demand updated
	 */
	public List<Demand> updateDemand(RequestInfo requestInfo, List<Demand> demands) {
		StringBuilder url = new StringBuilder(config.getBillHost());
		url.append(config.getDemandUpdateEndpoint());
		DemandRequest request = new DemandRequest(requestInfo, demands);
		Object result = restCallRepository.fetchResult(url, request);
		DemandResponse response = null;
		try {
			response = objectMapper.convertValue(result, DemandResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response of update demand");
		}
		return response.getDemands();

	}

	public DemandResponse search(String tenantId, Set<String> demandIds, Set<String> consumerCodes,
			RequestInfoWrapper requestInfoWrapper, String businessService) {

		StringBuilder uriBuilder = new StringBuilder(config.getBillHost()).append(config.getDemandSearchEndpoint());

		if (!StringUtils.isEmpty(tenantId)) {
			uriBuilder.append("?tenantId=").append(tenantId);
		}

		boolean hasQueryParam = uriBuilder.toString().contains("?");

		if (!StringUtils.isEmpty(businessService)) {
			uriBuilder.append(hasQueryParam ? "&" : "?").append("businessService=").append(businessService);
			hasQueryParam = true;
		}

		if (!CollectionUtils.isEmpty(consumerCodes)) {
			uriBuilder.append(hasQueryParam ? "&" : "?").append("consumerCode=")
					.append(String.join(",", consumerCodes));
			hasQueryParam = true;
		}
		if (!CollectionUtils.isEmpty(demandIds)) {
			uriBuilder.append(hasQueryParam ? "&" : "?").append("demandId=").append(String.join(",", demandIds));
		}

		Object result = restCallRepository.fetchResult(uriBuilder, requestInfoWrapper);
		DemandResponse response = null;

		try {
			response = objectMapper.convertValue(result, DemandResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response from Demand Search");
		}

		return response;
	}

}
