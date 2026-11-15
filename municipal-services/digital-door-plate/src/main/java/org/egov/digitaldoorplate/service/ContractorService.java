package org.egov.digitaldoorplate.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.Contractor;
import org.egov.digitaldoorplate.model.ContractorCounts;
import org.egov.digitaldoorplate.model.ContractorRequest;
import org.egov.digitaldoorplate.model.ContractorResponse;
import org.egov.digitaldoorplate.model.ContractorWardMapping;
import org.egov.digitaldoorplate.model.SearchCriteriaContractor;
import org.egov.digitaldoorplate.model.SearchCriteriaContractorRequest;
import org.egov.digitaldoorplate.model.contract.User;
import org.egov.digitaldoorplate.repository.ContractorRepository;
import org.egov.digitaldoorplate.util.DdpConstants;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ContractorService {

	@Autowired
	private ContractorRepository contractorRepository;

	@Autowired
	private ContractorWardMappingService contractorWardMappingService;

	@Autowired
	private UserService userService;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	/**
	 * Onboards a contractor/NGO. Each contractor is also auto-mapped to every
	 * ward listed on the payload (ulb/ward) so it is immediately assignable
	 * without a separate ward-mapping call; further wards can be added later
	 * via {@code ContractorWardMappingService}.
	 */
	@Transactional
	public ContractorResponse create(ContractorRequest contractorRequest) {

		validateUserInfo(contractorRequest.getRequestInfo());
		if (CollectionUtils.isEmpty(contractorRequest.getContractors())) {
			throw new CustomException("INVALID_REQUEST", "Provide contractor/NGO details to onboard.");
		}

		Long now = System.currentTimeMillis();
		RequestInfo requestInfo = contractorRequest.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();

		List<Contractor> result = contractorRequest.getContractors().stream().map(contractor -> {
			validateContractor(contractor);

			contractor.setUuid(UUID.randomUUID().toString());
			contractor.setStatus(DdpConstants.CONTRACTOR_STATUS_ONBOARDED);
			if (null == contractor.getIsActive()) {
				contractor.setIsActive(Boolean.TRUE);
			}
			contractor.setCreatedBy(userUuid);
			contractor.setCreatedDate(now);
			contractor.setLastModifiedBy(userUuid);
			contractor.setLastModifiedDate(now);

			contractorRepository.create(contractor);

			User contractorUser = userService.createOrGetContractorUser(requestInfo, contractor);
			contractor.setContractorUserUuid(contractorUser.getUuid());

			contractor.getWard().forEach(wardNumber -> contractorWardMappingService.createOrGetMapping(
					ContractorWardMapping.builder()
							.tenantId(contractor.getTenantId())
							.contractorUuid(contractor.getUuid())
							.contractorUserUuid(contractorUser.getUuid())
							.ulb(contractor.getUlb())
							.wardNumber(wardNumber)
							.build(), userUuid));

			return contractor;
		}).collect(Collectors.toList());

		return ContractorResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(contractorRequest.getRequestInfo(), true))
				.contractors(result).build();
	}

	/**
	 * Updates a contractor's master record and replaces their ward mapping
	 * wholesale: every existing active mapping is deactivated and a fresh
	 * mapping row is created per ward on the updated payload, mirroring how
	 * {@link #create} maps each ward individually.
	 */
	@Transactional
	public ContractorResponse update(ContractorRequest contractorRequest) {

		validateUserInfo(contractorRequest.getRequestInfo());
		if (CollectionUtils.isEmpty(contractorRequest.getContractors())) {
			throw new CustomException("INVALID_REQUEST", "Provide contractor/NGO details to update.");
		}

		Long now = System.currentTimeMillis();
		RequestInfo requestInfo = contractorRequest.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();

		List<Contractor> result = contractorRequest.getContractors().stream().map(contractor -> {

			if (StringUtils.isEmpty(contractor.getUuid())) {
				throw new CustomException("INVALID_REQUEST", "Uuid is mandatory to update contractor details.");
			}
			validateContractor(contractor);

			Contractor existing = getExistingContractor(contractor.getUuid(), contractor.getTenantId());
			contractor.setStatus(existing.getStatus());
			contractor.setCreatedBy(existing.getCreatedBy());
			contractor.setCreatedDate(existing.getCreatedDate());
			contractor.setLastModifiedBy(userUuid);
			contractor.setLastModifiedDate(now);
			if (null == contractor.getIsActive()) {
				contractor.setIsActive(existing.getIsActive());
			}

			contractorRepository.update(contractor);

			List<ContractorWardMapping> mappings = contractorWardMappingService.replaceMappings(contractor,
					userUuid);
			contractor.setContractorUserUuid(mappings.get(0).getContractorUserUuid());

			return contractor;
		}).collect(Collectors.toList());

		return ContractorResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(contractorRequest.getRequestInfo(), true))
				.contractors(result).build();
	}

	private Contractor getExistingContractor(String uuid, String tenantId) {
		List<Contractor> existing = contractorRepository
				.search(SearchCriteriaContractor.builder().uuid(Collections.singletonList(uuid)).tenantId(tenantId)
						.build());
		if (CollectionUtils.isEmpty(existing)) {
			throw new CustomException("CONTRACTOR_NOT_FOUND", "No contractor found for uuid: " + uuid);
		}
		return existing.get(0);
	}

	public ContractorResponse search(SearchCriteriaContractorRequest searchRequest) {

		SearchCriteriaContractor criteria = searchRequest.getSearchCriteriaContractor();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search contractors.");
		}

		List<Contractor> contractors = contractorRepository.search(criteria);
		ContractorCounts counts = contractorRepository.getCounts(criteria);

		return ContractorResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(),
						true))
				.contractors(contractors)
				.counts(counts).build();
	}

	private void validateContractor(Contractor contractor) {
		if (StringUtils.isEmpty(contractor.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in contractor details.");
		}
		if (StringUtils.isEmpty(contractor.getType())) {
			throw new CustomException("INVALID_REQUEST", "Type is mandatory in contractor details.");
		}
		if (StringUtils.isEmpty(contractor.getOrganisationName())) {
			throw new CustomException("INVALID_REQUEST", "OrganisationName is mandatory in contractor details.");
		}
		if (StringUtils.isEmpty(contractor.getOrganisationContact())) {
			throw new CustomException("INVALID_REQUEST", "OrganisationContact is mandatory in contractor details.");
		}
		if (StringUtils.isEmpty(contractor.getUlb())) {
			throw new CustomException("INVALID_REQUEST", "Ulb is mandatory in contractor details.");
		}
		if (CollectionUtils.isEmpty(contractor.getWard())) {
			throw new CustomException("INVALID_REQUEST", "At least one ward is mandatory in contractor details.");
		}
		if (null == contractor.getContractorDetails()
				|| StringUtils.isEmpty(contractor.getContractorDetails().getName())) {
			throw new CustomException("INVALID_REQUEST", "ContractorDetails.name is mandatory.");
		}
		if (StringUtils.isEmpty(contractor.getContractorDetails().getContactNumber())) {
			throw new CustomException("INVALID_REQUEST", "ContractorDetails.contactNumber is mandatory.");
		}
	}

	private void validateUserInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
