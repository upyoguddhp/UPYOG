package org.egov.digitaldoorplate.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.GarbageSupervisor;
import org.egov.digitaldoorplate.model.GarbageSupervisorMapping;
import org.egov.digitaldoorplate.model.GarbageSupervisorRequest;
import org.egov.digitaldoorplate.model.GarbageSupervisorResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisor;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisorRequest;
import org.egov.digitaldoorplate.model.contract.User;
import org.egov.digitaldoorplate.repository.GarbageSupervisorRepository;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GarbageSupervisorService {

	@Autowired
	private GarbageSupervisorRepository garbageSupervisorRepository;

	@Autowired
	private GarbageSupervisorMappingService garbageSupervisorMappingService;

	@Autowired
	private UserService userService;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	/**
	 * Onboards a garbage supervisor: persists the supervisor master record,
	 * creates (or reuses) their egov-user login the same way every other
	 * service in this platform does, then persists the
	 * contractor/ward mapping against the new user.
	 */
	@Transactional
	public GarbageSupervisorResponse create(GarbageSupervisorRequest request) {

		validateUserInfo(request.getRequestInfo());
		if (CollectionUtils.isEmpty(request.getSupervisors())) {
			throw new CustomException("INVALID_REQUEST", "Provide garbage supervisor details to onboard.");
		}

		RequestInfo requestInfo = request.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();
		Long now = System.currentTimeMillis();

		List<GarbageSupervisor> result = request.getSupervisors().stream().map(supervisor -> {

			validateSupervisor(supervisor);

			supervisor.setUuid(UUID.randomUUID().toString());
			if (null == supervisor.getIsActive()) {
				supervisor.setIsActive(Boolean.TRUE);
			}
			supervisor.setCreatedBy(userUuid);
			supervisor.setCreatedDate(now);
			supervisor.setLastModifiedBy(userUuid);
			supervisor.setLastModifiedDate(now);

			garbageSupervisorRepository.create(supervisor);

			User supervisorUser = userService.createOrGetSupervisorUser(requestInfo, supervisor);
			supervisor.setSupervisorUserUuid(supervisorUser.getUuid());

			GarbageSupervisorMapping mapping = garbageSupervisorMappingService.create(GarbageSupervisorMapping
					.builder()
					.tenantId(supervisor.getTenantId())
					.supervisorUuid(supervisor.getUuid())
					.contractorUuid(supervisor.getContractorUuid())
					.supervisorUserUuid(supervisorUser.getUuid())
					.wardNumber(supervisor.getWardNumber())
					.build(), userUuid);

			supervisor.setMappingUuid(mapping.getUuid());

			return supervisor;
		}).collect(Collectors.toList());

		return GarbageSupervisorResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
				.supervisors(result).build();
	}

	public GarbageSupervisorResponse search(SearchCriteriaGarbageSupervisorRequest searchRequest) {

		SearchCriteriaGarbageSupervisor criteria = searchRequest.getSearchCriteriaGarbageSupervisor();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search garbage supervisors.");
		}

		List<GarbageSupervisor> supervisors = garbageSupervisorRepository.search(criteria);

		return GarbageSupervisorResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(), true))
				.supervisors(supervisors).build();
	}

	private void validateSupervisor(GarbageSupervisor supervisor) {
		if (StringUtils.isEmpty(supervisor.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in supervisor details.");
		}
		if (StringUtils.isEmpty(supervisor.getSupervisorName())) {
			throw new CustomException("INVALID_REQUEST", "SupervisorName is mandatory in supervisor details.");
		}
		if (StringUtils.isEmpty(supervisor.getMobileNumber())
				|| !supervisor.getMobileNumber().matches("^[6-9]\\d{9}$")) {
			throw new CustomException("INVALID_REQUEST", "Provide a valid 10 digit mobile number for the supervisor.");
		}
		if (StringUtils.isEmpty(supervisor.getUlb())) {
			throw new CustomException("INVALID_REQUEST", "Ulb is mandatory in supervisor details.");
		}
		if (StringUtils.isEmpty(supervisor.getWardNumber())) {
			throw new CustomException("INVALID_REQUEST", "WardNumber is mandatory to map the supervisor.");
		}
	}

	private void validateUserInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
