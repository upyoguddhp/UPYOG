package org.egov.digitaldoorplate.service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.GarbageCollector;
import org.egov.digitaldoorplate.model.GarbageSupervisor;
import org.egov.digitaldoorplate.model.GarbageSupervisorMapping;
import org.egov.digitaldoorplate.model.GarbageSupervisorRequest;
import org.egov.digitaldoorplate.model.GarbageSupervisorResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollection;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollector;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisor;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisorRequest;
import org.egov.digitaldoorplate.model.contract.User;
import org.egov.digitaldoorplate.repository.GarbageCollectionRepository;
import org.egov.digitaldoorplate.repository.GarbageCollectorRepository;
import org.egov.digitaldoorplate.repository.GarbageSupervisorRepository;
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
public class GarbageSupervisorService {

	@Autowired
	private GarbageSupervisorRepository garbageSupervisorRepository;

	@Autowired
	private GarbageSupervisorMappingService garbageSupervisorMappingService;

	@Autowired
	private GarbageCollectorRepository garbageCollectorRepository;

	@Autowired
	private GarbageCollectionRepository garbageCollectionRepository;

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

			List<String> mappingUuids = supervisor.getWardNumber().stream()
					.map(wardNumber -> garbageSupervisorMappingService.create(GarbageSupervisorMapping.builder()
							.tenantId(supervisor.getTenantId())
							.supervisorUuid(supervisor.getUuid())
							.contractorUuid(supervisor.getContractorUuid())
							.supervisorUserUuid(supervisorUser.getUuid())
							.wardNumber(wardNumber)
							.build(), userUuid).getUuid())
					.collect(Collectors.toList());

			supervisor.setMappingUuids(mappingUuids);

			return supervisor;
		}).collect(Collectors.toList());

		return GarbageSupervisorResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
				.supervisors(result).build();
	}

	/**
	 * Updates a garbage supervisor's master record and replaces their
	 * contractor/ward mapping wholesale: every existing active mapping is
	 * deactivated and a fresh mapping row is created per ward on the updated
	 * payload, mirroring how {@link #create} maps each ward individually.
	 */
	@Transactional
	public GarbageSupervisorResponse update(GarbageSupervisorRequest request) {

		validateUserInfo(request.getRequestInfo());
		if (CollectionUtils.isEmpty(request.getSupervisors())) {
			throw new CustomException("INVALID_REQUEST", "Provide garbage supervisor details to update.");
		}

		RequestInfo requestInfo = request.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();
		Long now = System.currentTimeMillis();

		List<GarbageSupervisor> result = request.getSupervisors().stream().map(supervisor -> {

			if (StringUtils.isEmpty(supervisor.getUuid())) {
				throw new CustomException("INVALID_REQUEST", "Uuid is mandatory to update supervisor details.");
			}
			validateSupervisor(supervisor);

			GarbageSupervisor existing = getExistingSupervisor(supervisor.getUuid(), supervisor.getTenantId());
			supervisor.setCreatedBy(existing.getCreatedBy());
			supervisor.setCreatedDate(existing.getCreatedDate());
			supervisor.setLastModifiedBy(userUuid);
			supervisor.setLastModifiedDate(now);
			if (null == supervisor.getIsActive()) {
				supervisor.setIsActive(existing.getIsActive());
			}

			garbageSupervisorRepository.update(supervisor);

			List<GarbageSupervisorMapping> mappings = garbageSupervisorMappingService.replaceMappings(supervisor,
					userUuid);
			supervisor.setSupervisorUserUuid(mappings.get(0).getSupervisorUserUuid());
			supervisor.setMappingUuids(
					mappings.stream().map(GarbageSupervisorMapping::getUuid).collect(Collectors.toList()));

			return supervisor;
		}).collect(Collectors.toList());

		return GarbageSupervisorResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
				.supervisors(result).build();
	}

	private GarbageSupervisor getExistingSupervisor(String uuid, String tenantId) {
		List<GarbageSupervisor> existing = garbageSupervisorRepository.search(SearchCriteriaGarbageSupervisor
				.builder().uuid(Collections.singletonList(uuid)).tenantId(tenantId).build());
		if (CollectionUtils.isEmpty(existing)) {
			throw new CustomException("SUPERVISOR_NOT_FOUND", "No garbage supervisor found for uuid: " + uuid);
		}
		return existing.get(0);
	}

	public GarbageSupervisorResponse search(SearchCriteriaGarbageSupervisorRequest searchRequest) {

		SearchCriteriaGarbageSupervisor criteria = searchRequest.getSearchCriteriaGarbageSupervisor();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search garbage supervisors.");
		}

		List<GarbageSupervisor> supervisors = garbageSupervisorRepository.search(criteria);
		enrichCollectionStats(supervisors);

		return GarbageSupervisorResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(), true))
				.supervisors(supervisors).build();
	}

	/**
	 * For each supervisor, aggregates collectedToday (sum of today's
	 * collections logged by every collector mapped under that supervisor)
	 * and totalHouseAllocated (sum of noOfHouseAlloted across those same
	 * collectors).
	 */
	private void enrichCollectionStats(List<GarbageSupervisor> supervisors) {

		if (CollectionUtils.isEmpty(supervisors)) {
			return;
		}

		supervisors.forEach(supervisor -> {

			List<GarbageCollector> collectorsUnderSupervisor = garbageCollectorRepository
					.search(SearchCriteriaGarbageCollector.builder().tenantId(supervisor.getTenantId())
							.supervisorId(supervisor.getUuid()).isActive(Boolean.TRUE).build());

			int totalHouseAllocated = collectorsUnderSupervisor.stream()
					.mapToInt(collector -> null == collector.getNoOfHouseAlloted() ? 0
							: collector.getNoOfHouseAlloted())
					.sum();

			List<String> staffUuids = collectorsUnderSupervisor.stream().map(GarbageCollector::getCollectorUserUuid)
					.filter(StringUtils::isNotEmpty).distinct().collect(Collectors.toList());

			int collectedToday = CollectionUtils.isEmpty(staffUuids) ? 0
					: garbageCollectionRepository.search(SearchCriteriaGarbageCollection.builder()
							.staffUuid(staffUuids).fromDate(getStartOfDay()).isCollected(Boolean.TRUE)
							.isActive(Boolean.TRUE).build()).size();

			supervisor.setTotalHouseAllocated(totalHouseAllocated);
			supervisor.setCollectedToday(collectedToday);
		});
	}

	private Long getStartOfDay() {
		ZoneId zone = ZoneId.of(DdpConstants.TIMEZONE);
		return ZonedDateTime.now(zone).toLocalDate().atStartOfDay(zone).toInstant().toEpochMilli();
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
		if (CollectionUtils.isEmpty(supervisor.getWardNumber())) {
			throw new CustomException("INVALID_REQUEST", "At least one ward is mandatory to map the supervisor.");
		}
	}

	private void validateUserInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
