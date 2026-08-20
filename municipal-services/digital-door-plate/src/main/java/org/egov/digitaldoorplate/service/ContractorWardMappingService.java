package org.egov.digitaldoorplate.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.ContractorWardMapping;
import org.egov.digitaldoorplate.model.ContractorWardMappingRequest;
import org.egov.digitaldoorplate.model.ContractorWardMappingResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaContractor;
import org.egov.digitaldoorplate.model.SearchCriteriaContractorWardMapping;
import org.egov.digitaldoorplate.model.SearchCriteriaContractorWardMappingRequest;
import org.egov.digitaldoorplate.repository.ContractorRepository;
import org.egov.digitaldoorplate.repository.ContractorWardMappingRepository;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ContractorWardMappingService {

	@Autowired
	private ContractorWardMappingRepository contractorWardMappingRepository;

	@Autowired
	private ContractorRepository contractorRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	@Transactional
	public ContractorWardMappingResponse create(ContractorWardMappingRequest request) {

		validateUserInfo(request.getRequestInfo());
		if (CollectionUtils.isEmpty(request.getContractorWardMappings())) {
			throw new CustomException("INVALID_REQUEST", "Provide at least one ward mapping to create.");
		}

		String userUuid = request.getRequestInfo().getUserInfo().getUuid();

		List<ContractorWardMapping> result = request.getContractorWardMappings().stream()
				.map(mapping -> createOrGetMapping(mapping, userUuid)).collect(Collectors.toList());

		return ContractorWardMappingResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.contractorWardMappings(result).build();
	}

	/**
	 * Creates a ward mapping for a contractor, or returns the existing active
	 * mapping as-is if the contractor is already mapped to that ward
	 * (idempotent). Also used by {@code ContractorService} to auto-map a
	 * contractor to its registration ward on onboarding.
	 */
	public ContractorWardMapping createOrGetMapping(ContractorWardMapping mapping, String userUuid) {

		if (StringUtils.isEmpty(mapping.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in ward mapping details.");
		}
		if (StringUtils.isEmpty(mapping.getContractorUuid())) {
			throw new CustomException("INVALID_REQUEST", "ContractorUuid is mandatory in ward mapping details.");
		}
		if (StringUtils.isEmpty(mapping.getWardNumber())) {
			throw new CustomException("INVALID_REQUEST", "WardNumber is mandatory in ward mapping details.");
		}

		if (CollectionUtils.isEmpty(contractorRepository.search(SearchCriteriaContractor.builder()
				.uuid(Collections.singletonList(mapping.getContractorUuid()))
				.tenantId(mapping.getTenantId()).isActive(Boolean.TRUE).build()))) {
			throw new CustomException("CONTRACTOR_NOT_FOUND",
					"No active contractor found for contractorUuid: " + mapping.getContractorUuid());
		}

		List<ContractorWardMapping> existingMappings = contractorWardMappingRepository
				.search(SearchCriteriaContractorWardMapping.builder()
						.contractorUuid(Collections.singletonList(mapping.getContractorUuid()))
						.wardNumber(Collections.singletonList(mapping.getWardNumber()))
						.tenantId(mapping.getTenantId()).isActive(Boolean.TRUE).build());
		if (!CollectionUtils.isEmpty(existingMappings)) {
			return existingMappings.get(0);
		}

		Long now = System.currentTimeMillis();
		mapping.setUuid(UUID.randomUUID().toString());
		mapping.setIsActive(Boolean.TRUE);
		mapping.setCreatedBy(userUuid);
		mapping.setCreatedDate(now);
		mapping.setLastModifiedBy(userUuid);
		mapping.setLastModifiedDate(now);

		contractorWardMappingRepository.create(mapping);
		return mapping;
	}

	public ContractorWardMappingResponse search(SearchCriteriaContractorWardMappingRequest searchRequest) {

		SearchCriteriaContractorWardMapping criteria = searchRequest.getSearchCriteriaContractorWardMapping();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search ward mappings.");
		}

		List<ContractorWardMapping> mappings = contractorWardMappingRepository.search(criteria);

		return ContractorWardMappingResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(), true))
				.contractorWardMappings(mappings).build();
	}

	private void validateUserInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
