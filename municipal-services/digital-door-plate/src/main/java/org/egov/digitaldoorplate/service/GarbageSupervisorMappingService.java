package org.egov.digitaldoorplate.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.digitaldoorplate.model.GarbageSupervisor;
import org.egov.digitaldoorplate.model.GarbageSupervisorMapping;
import org.egov.digitaldoorplate.model.GarbageSupervisorMappingResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisorMapping;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisorMappingRequest;
import org.egov.digitaldoorplate.repository.GarbageSupervisorMappingRepository;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GarbageSupervisorMappingService {

	@Autowired
	private GarbageSupervisorMappingRepository garbageSupervisorMappingRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	/**
	 * Persists the supervisor-contractor-user mapping. Called by
	 * {@code GarbageSupervisorService} right after the supervisor's egov-user
	 * account has been created; there is no separate public create endpoint
	 * since a mapping only makes sense as part of onboarding a supervisor.
	 */
	public GarbageSupervisorMapping create(GarbageSupervisorMapping mapping, String userUuid) {

		if (StringUtils.isEmpty(mapping.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in mapping details.");
		}
		if (StringUtils.isEmpty(mapping.getSupervisorUuid())) {
			throw new CustomException("INVALID_REQUEST", "SupervisorUuid is mandatory in mapping details.");
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

		garbageSupervisorMappingRepository.create(mapping);
		return mapping;
	}

	/**
	 * Replaces a supervisor's ward mapping wholesale: deactivates every
	 * existing active mapping row, then creates a fresh one per ward on the
	 * updated payload. Used by {@code GarbageSupervisorService.update()} so
	 * changes to contractorUuid/ward on update are always reflected, rather
	 * than silently reusing a stale mapping row for an unchanged ward.
	 */
	@Transactional
	public List<GarbageSupervisorMapping> replaceMappings(GarbageSupervisor supervisor, String userUuid) {

		List<GarbageSupervisorMapping> existingMappings = garbageSupervisorMappingRepository
				.search(SearchCriteriaGarbageSupervisorMapping.builder()
						.supervisorUuid(Collections.singletonList(supervisor.getUuid()))
						.tenantId(supervisor.getTenantId()).isActive(Boolean.TRUE).build());
		if (CollectionUtils.isEmpty(existingMappings)) {
			throw new CustomException("MAPPING_NOT_FOUND",
					"No active ward mapping found for supervisorUuid: " + supervisor.getUuid());
		}
		String supervisorUserUuid = existingMappings.get(0).getSupervisorUserUuid();
		Long now = System.currentTimeMillis();

		garbageSupervisorMappingRepository.deactivateAll(supervisor.getUuid(), userUuid, now);

		return supervisor.getWardNumber().stream()
				.map(wardNumber -> create(GarbageSupervisorMapping.builder()
						.tenantId(supervisor.getTenantId())
						.supervisorUuid(supervisor.getUuid())
						.contractorUuid(supervisor.getContractorUuid())
						.supervisorUserUuid(supervisorUserUuid)
						.wardNumber(wardNumber)
						.build(), userUuid))
				.collect(Collectors.toList());
	}

	public GarbageSupervisorMappingResponse search(SearchCriteriaGarbageSupervisorMappingRequest searchRequest) {

		SearchCriteriaGarbageSupervisorMapping criteria = searchRequest.getSearchCriteriaGarbageSupervisorMapping();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search supervisor mappings.");
		}

		List<GarbageSupervisorMapping> mappings = garbageSupervisorMappingRepository.search(criteria);

		return GarbageSupervisorMappingResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(), true))
				.supervisorMappings(mappings).build();
	}
}
