package org.upyog.chb.repository;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.upyog.chb.web.models.RequestInfoWrapper;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import org.springframework.util.CollectionUtils;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.web.models.billing.Demand;
import org.upyog.chb.web.models.billing.DemandRequest;
import org.upyog.chb.web.models.billing.DemandResponse;


import java.util.List;
import java.util.Set;

@Repository
public class DemandRepository {

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private CommunityHallBookingConfiguration config;

	@Autowired
	private ObjectMapper mapper;

	/**
	 * Creates demand
	 * 
	 * @param requestInfo The RequestInfo of the calculation Request
	 * @param demands     The demands to be created
	 * @return The list of demand created
	 */
	public List<Demand> saveDemand(RequestInfo requestInfo, List<Demand> demand) {
		StringBuilder url = new StringBuilder(config.getBillingHost());
		url.append(config.getDemandCreateEndpoint());
		DemandRequest request = new DemandRequest(requestInfo, demand);
		System.out.println("Request object for fetchResult: " + request);
		System.out.println("URL for fetchResult: " + url);
		Object result = serviceRequestRepository.fetchResult(url, request);
		System.out.println("Result from fetchResult method: " + result);
		DemandResponse response = null;
		try {
			response = mapper.convertValue(result, DemandResponse.class);
			System.out.println("Demand response mapper: " + response);
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
		StringBuilder url = new StringBuilder(config.getBillingHost());
		url.append(config.getDemandUpdateEndpoint());
		DemandRequest request = new DemandRequest(requestInfo, demands);
		Object result = serviceRequestRepository.fetchResult(url, request);
		DemandResponse response = null;
		try {
			response = mapper.convertValue(result, DemandResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response of update demand");
		}
		return response.getDemands();

	}
	
	public DemandResponse search(String tenantId, Set<String> demandIds, Set<String> consumerCodes,
			RequestInfoWrapper requestInfoWrapper, String businessService) {

		StringBuilder uriBuilder = new StringBuilder(config.getBillingHost()).append(config.getDemandSearchEndpoint());

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

		Object result = serviceRequestRepository.fetchResult(uriBuilder, requestInfoWrapper);
		DemandResponse response = null;

		try {
			response = mapper.convertValue(result, DemandResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response from Demand Search");
		}

		return response;
	}

}
