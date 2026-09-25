package org.egov.digitaldoorplate.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.RemoteProperty;
import org.egov.digitaldoorplate.repository.ServiceRequestRepository;
import org.egov.digitaldoorplate.util.DdpConstants;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PropertyService {

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private DdpConstants ddpConfig;

	@Autowired
	private ObjectMapper objectMapper;

	/**
	 * Searches property-services by the property id printed on the door plate
	 * QR code (the "PropertyID" field). Returns the matching property, or
	 * throws if property-services has no record for it.
	 */
	@SuppressWarnings("unchecked")
	public RemoteProperty searchPropertyByPropertyId(RequestInfo requestInfo, String tenantId, String propertyId) {

		StringBuilder uri = new StringBuilder(ddpConfig.getPropertyServiceHostUrl())
				.append(ddpConfig.getPropertySearchEndpoint())
				.append("?tenantId=").append(tenantId)
				.append("&propertyIds=").append(propertyId);

		Map<String, Object> request = new HashMap<>();
		request.put("RequestInfo", requestInfo);

		Optional<Object> response = serviceRequestRepository.fetchResult(uri, request);

		if (!response.isPresent()) {
			throw new CustomException("PROPERTY_SEARCH_FAILED",
					"No response received from property-service while searching the property.");
		}

		Object rawProperties = ((Map<String, Object>) response.get()).get("Properties");
		List<RemoteProperty> properties = null == rawProperties ? null
				: objectMapper.convertValue(rawProperties, new TypeReference<List<RemoteProperty>>() {
				});

		if (CollectionUtils.isEmpty(properties)) {
			throw new CustomException("PROPERTY_NOT_FOUND", "No property found for PropertyID: " + propertyId);
		}

		return properties.stream().filter(property -> StringUtils.equalsIgnoreCase(propertyId, property.getPropertyId()))
				.findFirst().orElse(properties.get(0));
	}
}
