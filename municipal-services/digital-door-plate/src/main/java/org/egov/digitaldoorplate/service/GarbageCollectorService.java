package org.egov.digitaldoorplate.service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.GarbageCollection;
import org.egov.digitaldoorplate.model.GarbageCollector;
import org.egov.digitaldoorplate.model.GarbageCollectorMapping;
import org.egov.digitaldoorplate.model.GarbageCollectorRequest;
import org.egov.digitaldoorplate.model.GarbageCollectorResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollection;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollector;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorRequest;
import org.egov.digitaldoorplate.model.contract.User;
import org.egov.digitaldoorplate.repository.GarbageCollectionRepository;
import org.egov.digitaldoorplate.repository.GarbageCollectorRepository;
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
public class GarbageCollectorService {

	@Autowired
	private GarbageCollectorRepository garbageCollectorRepository;

	@Autowired
	private GarbageCollectorMappingService garbageCollectorMappingService;

	@Autowired
	private GarbageCollectionRepository garbageCollectionRepository;

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

			List<String> mappingUuids = collector.getWardNumber().stream()
					.map(wardNumber -> garbageCollectorMappingService.create(GarbageCollectorMapping.builder()
							.tenantId(collector.getTenantId())
							.collectorUuid(collector.getUuid())
							.contractorUuid(collector.getContractorUuid())
							.supervisorId(collector.getSupervisorId())
							.collectorUserUuid(collectorUser.getUuid())
							.wardNumber(wardNumber)
							.noOfHouseAlloted(collector.getNoOfHouseAlloted())
							.build(), userUuid).getUuid())
					.collect(Collectors.toList());

			collector.setMappingUuids(mappingUuids);

			return collector;
		}).collect(Collectors.toList());

		return GarbageCollectorResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
				.collectors(result).build();
	}

	/**
	 * Updates a garbage collector's master record and replaces their
	 * contractor/supervisor/ward mapping wholesale: every existing active
	 * mapping is deactivated and a fresh mapping row is created per ward on the
	 * updated payload, mirroring how {@link #create} maps each ward
	 * individually.
	 */
	@Transactional
	public GarbageCollectorResponse update(GarbageCollectorRequest request) {

		validateUserInfo(request.getRequestInfo());
		if (CollectionUtils.isEmpty(request.getCollectors())) {
			throw new CustomException("INVALID_REQUEST", "Provide garbage collector details to update.");
		}

		RequestInfo requestInfo = request.getRequestInfo();
		String userUuid = requestInfo.getUserInfo().getUuid();
		Long now = System.currentTimeMillis();

		List<GarbageCollector> result = request.getCollectors().stream().map(collector -> {

			if (StringUtils.isEmpty(collector.getUuid())) {
				throw new CustomException("INVALID_REQUEST", "Uuid is mandatory to update collector details.");
			}
			validateCollector(collector);

			GarbageCollector existing = getExistingCollector(collector.getUuid(), collector.getTenantId());
			collector.setCreatedBy(existing.getCreatedBy());
			collector.setCreatedDate(existing.getCreatedDate());
			collector.setLastModifiedBy(userUuid);
			collector.setLastModifiedDate(now);
			if (null == collector.getIsActive()) {
				collector.setIsActive(existing.getIsActive());
			}

			garbageCollectorRepository.update(collector);

			List<GarbageCollectorMapping> mappings = garbageCollectorMappingService.replaceMappings(collector,
					userUuid);
			collector.setCollectorUserUuid(mappings.get(0).getCollectorUserUuid());
			collector.setMappingUuids(
					mappings.stream().map(GarbageCollectorMapping::getUuid).collect(Collectors.toList()));

			return collector;
		}).collect(Collectors.toList());

		return GarbageCollectorResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(requestInfo, true))
				.collectors(result).build();
	}

	private GarbageCollector getExistingCollector(String uuid, String tenantId) {
		List<GarbageCollector> existing = garbageCollectorRepository.search(SearchCriteriaGarbageCollector.builder()
				.uuid(Collections.singletonList(uuid)).tenantId(tenantId).build());
		if (CollectionUtils.isEmpty(existing)) {
			throw new CustomException("COLLECTOR_NOT_FOUND", "No garbage collector found for uuid: " + uuid);
		}
		return existing.get(0);
	}

	public GarbageCollectorResponse search(SearchCriteriaGarbageCollectorRequest searchRequest) {

		SearchCriteriaGarbageCollector criteria = searchRequest.getSearchCriteriaGarbageCollector();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search garbage collectors.");
		}

		List<GarbageCollector> collectors = garbageCollectorRepository.search(criteria);
		enrichCollectedToday(collectors);

		return GarbageCollectorResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(), true))
				.collectors(collectors).build();
	}

	/**
	 * Populates collectedToday on each collector: the count of active,
	 * completed garbage collections logged today under that collector's own
	 * egov-user login (collectorUserUuid, i.e. GarbageCollection.staffUuid).
	 */
	private void enrichCollectedToday(List<GarbageCollector> collectors) {

		if (CollectionUtils.isEmpty(collectors)) {
			return;
		}

		List<String> staffUuids = collectors.stream().map(GarbageCollector::getCollectorUserUuid)
				.filter(StringUtils::isNotEmpty).distinct().collect(Collectors.toList());

		if (CollectionUtils.isEmpty(staffUuids)) {
			collectors.forEach(collector -> collector.setCollectedToday(0));
			return;
		}

		List<GarbageCollection> todaysCollections = garbageCollectionRepository
				.search(SearchCriteriaGarbageCollection.builder().staffUuid(staffUuids).fromDate(getStartOfDay())
						.isCollected(Boolean.TRUE).isActive(Boolean.TRUE).build());

		Map<String, Long> countByStaffUuid = todaysCollections.stream()
				.collect(Collectors.groupingBy(GarbageCollection::getStaffUuid, Collectors.counting()));

		collectors.forEach(collector -> collector.setCollectedToday(
				StringUtils.isEmpty(collector.getCollectorUserUuid()) ? 0
						: countByStaffUuid.getOrDefault(collector.getCollectorUserUuid(), 0L).intValue()));
	}

	private Long getStartOfDay() {
		ZoneId zone = ZoneId.of(DdpConstants.TIMEZONE);
		return ZonedDateTime.now(zone).toLocalDate().atStartOfDay(zone).toInstant().toEpochMilli();
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
		if (CollectionUtils.isEmpty(collector.getWardNumber())) {
			throw new CustomException("INVALID_REQUEST", "At least one ward is mandatory to map the collector.");
		}
	}

	private void validateUserInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
