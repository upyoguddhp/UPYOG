package org.egov.digitaldoorplate.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.GarbageCollector;
import org.egov.digitaldoorplate.model.GarbageCollectorMapping;
import org.egov.digitaldoorplate.model.GarbageCollectorRequest;
import org.egov.digitaldoorplate.model.GarbageCollectorResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollector;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorRequest;
import org.egov.digitaldoorplate.model.contract.User;
import org.egov.digitaldoorplate.repository.GarbageCollectorRepository;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GarbageCollectorService {

	@Autowired
	private GarbageCollectorRepository garbageCollectorRepository;

	@Autowired
	private GarbageCollectorMappingService garbageCollectorMappingService;

	@Autowired
	private UserService userService;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	/**
	 * Onboards a garbage collector: persists the collector master record,
	 * creates (or reuses) their egov-user login the same way every other
	 * service in this platform does, then persists the
	 * contractor/supervisor/ward mapping against the new user.
	 */
	@Transactional
	public GarbageCollectorResponse create(GarbageCollectorRequest request) {

		validateUserInfo(request.getRequestInfo());
		if (CollectionUtils.isEmpty(request.getCollectors())) {
			throw new CustomException("INVALID_REQUEST", "Provide garbage collector details to onboard.");
		}

		RequestInfo requestInfo = request.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();
		Long now = System.currentTimeMillis();

		List<GarbageCollector> result = request.getCollectors().stream().map(collector -> {

			validateCollector(collector);

			collector.setUuid(UUID.randomUUID().toString());
			if (null == collector.getIsActive()) {
				collector.setIsActive(Boolean.TRUE);
			}
			collector.setCreatedBy(userUuid);
			collector.setCreatedDate(now);
			collector.setLastModifiedBy(userUuid);
			collector.setLastModifiedDate(now);

			garbageCollectorRepository.create(collector);

			User collectorUser = userService.createOrGetCollectorUser(requestInfo, collector);
			collector.setCollectorUserUuid(collectorUser.getUuid());

			GarbageCollectorMapping mapping = garbageCollectorMappingService.create(GarbageCollectorMapping.builder()
					.tenantId(collector.getTenantId())
					.collectorUuid(collector.getUuid())
					.contractorUuid(collector.getContractorUuid())
					.supervisorId(collector.getSupervisorId())
					.collectorUserUuid(collectorUser.getUuid())
					.wardNumber(collector.getWardNumber())
					.noOfHouseAlloted(collector.getNoOfHouseAlloted())
					.build(), userUuid);

			collector.setMappingUuid(mapping.getUuid());

			return collector;
		}).collect(Collectors.toList());

		return GarbageCollectorResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
				.collectors(result).build();
	}

	public GarbageCollectorResponse search(SearchCriteriaGarbageCollectorRequest searchRequest) {

		SearchCriteriaGarbageCollector criteria = searchRequest.getSearchCriteriaGarbageCollector();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search garbage collectors.");
		}

		List<GarbageCollector> collectors = garbageCollectorRepository.search(criteria);

		return GarbageCollectorResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(), true))
				.collectors(collectors).build();
	}

	private void validateCollector(GarbageCollector collector) {
		if (StringUtils.isEmpty(collector.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in collector details.");
		}
		if (StringUtils.isEmpty(collector.getCollectorName())) {
			throw new CustomException("INVALID_REQUEST", "CollectorName is mandatory in collector details.");
		}
		if (StringUtils.isEmpty(collector.getMobileNumber()) || !collector.getMobileNumber().matches("^[6-9]\\d{9}$")) {
			throw new CustomException("INVALID_REQUEST", "Provide a valid 10 digit mobile number for the collector.");
		}
		if (StringUtils.isEmpty(collector.getUlb())) {
			throw new CustomException("INVALID_REQUEST", "Ulb is mandatory in collector details.");
		}
		if (StringUtils.isEmpty(collector.getContractorUuid())) {
			throw new CustomException("INVALID_REQUEST", "ContractorUuid is mandatory to map the collector.");
		}
		if (StringUtils.isEmpty(collector.getWardNumber())) {
			throw new CustomException("INVALID_REQUEST", "WardNumber is mandatory to map the collector.");
		}
	}

	private void validateUserInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
