package org.egov.digitaldoorplate.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.digitaldoorplate.model.GarbageCollector;
import org.egov.digitaldoorplate.model.GarbageCollectorMapping;
import org.egov.digitaldoorplate.model.GarbageCollectorMappingResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorMapping;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorMappingRequest;
import org.egov.digitaldoorplate.repository.GarbageCollectorMappingRepository;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GarbageCollectorMappingService {

	@Autowired
	private GarbageCollectorMappingRepository garbageCollectorMappingRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	/**
	 * Persists the collector-contractor-supervisor-user mapping. Called by
	 * {@code GarbageCollectorService} right after the collector's egov-user
	 * account has been created; there is no separate public create endpoint
	 * since a mapping only makes sense as part of onboarding a collector.
	 */
	public GarbageCollectorMapping create(GarbageCollectorMapping mapping, String userUuid) {

		if (StringUtils.isEmpty(mapping.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in mapping details.");
		}
		if (StringUtils.isEmpty(mapping.getCollectorUuid())) {
			throw new CustomException("INVALID_REQUEST", "CollectorUuid is mandatory in mapping details.");
		}

		Long now = System.currentTimeMillis();
		mapping.setUuid(UUID.randomUUID().toString());
		if (null == mapping.getIsActive()) {
			mapping.setIsActive(Boolean.TRUE);
		}
		mapping.setCreatedBy(userUuid);
		mapping.setCreatedDate(now);
		mapping.setLastModifiedBy(userUuid);
		mapping.setLastModifiedDate(now);

		garbageCollectorMappingRepository.create(mapping);
		return mapping;
	}

	/**
	 * Replaces a collector's ward mapping wholesale: deactivates every
	 * existing active mapping row, then creates a fresh one per ward on the
	 * updated payload. Used by {@code GarbageCollectorService.update()} so
	 * changes to contractorUuid/supervisorId/ward/noOfHouseAlloted on update
	 * are always reflected, rather than silently reusing a stale mapping row
	 * for an unchanged ward.
	 */
	@Transactional
	public List<GarbageCollectorMapping> replaceMappings(GarbageCollector collector, String userUuid) {

		List<GarbageCollectorMapping> existingMappings = garbageCollectorMappingRepository
				.search(SearchCriteriaGarbageCollectorMapping.builder()
						.collectorUuid(Collections.singletonList(collector.getUuid()))
						.tenantId(collector.getTenantId()).isActive(Boolean.TRUE).build());
		if (CollectionUtils.isEmpty(existingMappings)) {
			throw new CustomException("MAPPING_NOT_FOUND",
					"No active ward mapping found for collectorUuid: " + collector.getUuid());
		}
		String collectorUserUuid = existingMappings.get(0).getCollectorUserUuid();
		Long now = System.currentTimeMillis();

		garbageCollectorMappingRepository.deactivateAll(collector.getUuid(), userUuid, now);

		return collector.getWardNumber().stream()
				.map(wardNumber -> create(GarbageCollectorMapping.builder()
						.tenantId(collector.getTenantId())
						.collectorUuid(collector.getUuid())
						.contractorUuid(collector.getContractorUuid())
						.supervisorId(collector.getSupervisorId())
						.collectorUserUuid(collectorUserUuid)
						.wardNumber(wardNumber)
						.noOfHouseAlloted(collector.getNoOfHouseAlloted())
						.build(), userUuid))
				.collect(Collectors.toList());
	}

	public GarbageCollectorMappingResponse search(SearchCriteriaGarbageCollectorMappingRequest searchRequest) {

		SearchCriteriaGarbageCollectorMapping criteria = searchRequest.getSearchCriteriaGarbageCollectorMapping();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search collector mappings.");
		}

		List<GarbageCollectorMapping> mappings = garbageCollectorMappingRepository.search(criteria);

		return GarbageCollectorMappingResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(), true))
				.collectorMappings(mappings).build();
	}
}
