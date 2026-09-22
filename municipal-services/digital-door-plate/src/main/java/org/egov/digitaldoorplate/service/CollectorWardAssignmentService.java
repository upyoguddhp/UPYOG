package org.egov.digitaldoorplate.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.CollectorWardAssignment;
import org.egov.digitaldoorplate.model.CollectorWardAssignmentRequest;
import org.egov.digitaldoorplate.model.CollectorWardAssignmentResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaCollectorWardAssignment;
import org.egov.digitaldoorplate.model.SearchCriteriaCollectorWardAssignmentRequest;
import org.egov.digitaldoorplate.model.SearchCriteriaContractor;
import org.egov.digitaldoorplate.model.SearchCriteriaContractorWardMapping;
import org.egov.digitaldoorplate.repository.CollectorWardAssignmentRepository;
import org.egov.digitaldoorplate.repository.ContractorRepository;
import org.egov.digitaldoorplate.repository.ContractorWardMappingRepository;
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
public class CollectorWardAssignmentService {

	@Autowired
	private CollectorWardAssignmentRepository collectorWardAssignmentRepository;

	@Autowired
	private ContractorRepository contractorRepository;

	@Autowired
	private ContractorWardMappingRepository contractorWardMappingRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	@Transactional
	public CollectorWardAssignmentResponse assign(CollectorWardAssignmentRequest assignmentRequest) {

		validateUserInfo(assignmentRequest.getRequestInfo());

		CollectorWardAssignment assignment = assignmentRequest.getCollectorWardAssignment();
		if (null == assignment) {
			throw new CustomException("INVALID_REQUEST", "Provide collector ward assignment details.");
		}
		if (StringUtils.isEmpty(assignment.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory to assign a collector.");
		}
		if (StringUtils.isEmpty(assignment.getCollectorUuid())) {
			throw new CustomException("INVALID_REQUEST", "CollectorUuid is mandatory to assign a collector.");
		}
		if (StringUtils.isEmpty(assignment.getContractorUuid())) {
			throw new CustomException("INVALID_REQUEST", "ContractorUuid is mandatory to assign a collector.");
		}
		if (StringUtils.isEmpty(assignment.getWardNumber())) {
			throw new CustomException("INVALID_REQUEST", "WardNumber is mandatory to assign a collector.");
		}

		if (CollectionUtils.isEmpty(contractorRepository.search(SearchCriteriaContractor.builder()
				.uuid(Collections.singletonList(assignment.getContractorUuid()))
				.tenantId(assignment.getTenantId()).isActive(Boolean.TRUE).build()))) {
			throw new CustomException("CONTRACTOR_NOT_FOUND",
					"No active contractor found for contractorUuid: " + assignment.getContractorUuid());
		}

		if (CollectionUtils.isEmpty(contractorWardMappingRepository.search(SearchCriteriaContractorWardMapping
				.builder().contractorUuid(Collections.singletonList(assignment.getContractorUuid()))
				.wardNumber(Collections.singletonList(assignment.getWardNumber()))
				.tenantId(assignment.getTenantId()).isActive(Boolean.TRUE).build()))) {
			throw new CustomException("WARD_NOT_MAPPED_TO_CONTRACTOR",
					"Ward " + assignment.getWardNumber() + " is not mapped to contractor "
							+ assignment.getContractorUuid() + ". Map the ward to the contractor first.");
		}

		List<CollectorWardAssignment> existingAssignments = collectorWardAssignmentRepository
				.search(SearchCriteriaCollectorWardAssignment.builder()
						.collectorUuid(Collections.singletonList(assignment.getCollectorUuid()))
						.wardNumber(Collections.singletonList(assignment.getWardNumber()))
						.tenantId(assignment.getTenantId())
						.assignmentStatus(Collections.singletonList(DdpConstants.COLLECTOR_ASSIGNMENT_STATUS_ASSIGNED))
						.isActive(Boolean.TRUE).build());
		if (!CollectionUtils.isEmpty(existingAssignments)) {
			CollectorWardAssignment existingAssignment = existingAssignments.get(0);
			if (existingAssignment.getContractorUuid().equals(assignment.getContractorUuid())) {
				return CollectorWardAssignmentResponse.builder()
						.responseInfo(responseInfoFactory
								.createResponseInfoFromRequestInfo(assignmentRequest.getRequestInfo(), true))
						.collectorWardAssignments(Collections.singletonList(existingAssignment)).build();
			}
			throw new CustomException("COLLECTOR_ALREADY_ASSIGNED", "Collector " + assignment.getCollectorUuid()
					+ " is already assigned to ward " + assignment.getWardNumber() + " under a different contractor.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = assignmentRequest.getRequestInfo().getUserInfo().getUuid();

		assignment.setUuid(UUID.randomUUID().toString());
		assignment.setAssignmentStatus(DdpConstants.COLLECTOR_ASSIGNMENT_STATUS_ASSIGNED);
		assignment.setAssignedTime(now);
		assignment.setAssignedBy(userUuid);
		assignment.setUnassignedTime(null);
		assignment.setUnassignedBy(null);
		assignment.setIsActive(Boolean.TRUE);
		assignment.setCreatedBy(userUuid);
		assignment.setCreatedDate(now);
		assignment.setLastModifiedBy(userUuid);
		assignment.setLastModifiedDate(now);

		collectorWardAssignmentRepository.create(assignment);

		return CollectorWardAssignmentResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(assignmentRequest.getRequestInfo(), true))
				.collectorWardAssignments(Collections.singletonList(assignment)).build();
	}

	public CollectorWardAssignmentResponse unassign(CollectorWardAssignmentRequest assignmentRequest) {

		validateUserInfo(assignmentRequest.getRequestInfo());

		CollectorWardAssignment assignment = assignmentRequest.getCollectorWardAssignment();
		if (null == assignment) {
			throw new CustomException("INVALID_REQUEST", "Provide collector ward assignment details.");
		}

		CollectorWardAssignment existingAssignment;
		if (StringUtils.isNotEmpty(assignment.getUuid())) {
			List<CollectorWardAssignment> assignments = collectorWardAssignmentRepository
					.search(SearchCriteriaCollectorWardAssignment.builder()
							.uuid(Collections.singletonList(assignment.getUuid())).isActive(Boolean.TRUE).build());
			existingAssignment = CollectionUtils.isEmpty(assignments) ? null : assignments.get(0);
		} else {
			if (StringUtils.isEmpty(assignment.getTenantId()) || StringUtils.isEmpty(assignment.getCollectorUuid())
					|| StringUtils.isEmpty(assignment.getWardNumber())) {
				throw new CustomException("INVALID_REQUEST",
						"Provide either uuid, or tenantId + collectorUuid + wardNumber to unassign a collector.");
			}
			List<CollectorWardAssignment> assignments = collectorWardAssignmentRepository
					.search(SearchCriteriaCollectorWardAssignment.builder()
							.collectorUuid(Collections.singletonList(assignment.getCollectorUuid()))
							.wardNumber(Collections.singletonList(assignment.getWardNumber()))
							.tenantId(assignment.getTenantId())
							.assignmentStatus(
									Collections.singletonList(DdpConstants.COLLECTOR_ASSIGNMENT_STATUS_ASSIGNED))
							.isActive(Boolean.TRUE).build());
			existingAssignment = CollectionUtils.isEmpty(assignments) ? null : assignments.get(0);
		}

		if (null == existingAssignment
				|| !DdpConstants.COLLECTOR_ASSIGNMENT_STATUS_ASSIGNED.equals(existingAssignment.getAssignmentStatus())) {
			throw new CustomException("ASSIGNMENT_NOT_FOUND", "No active collector ward assignment found.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = assignmentRequest.getRequestInfo().getUserInfo().getUuid();

		existingAssignment.setAssignmentStatus(DdpConstants.COLLECTOR_ASSIGNMENT_STATUS_UNASSIGNED);
		existingAssignment.setUnassignedTime(now);
		existingAssignment.setUnassignedBy(userUuid);
		existingAssignment.setLastModifiedBy(userUuid);
		existingAssignment.setLastModifiedDate(now);

		collectorWardAssignmentRepository.unassign(existingAssignment);

		return CollectorWardAssignmentResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(assignmentRequest.getRequestInfo(), true))
				.collectorWardAssignments(Collections.singletonList(existingAssignment)).build();
	}

	public CollectorWardAssignmentResponse search(SearchCriteriaCollectorWardAssignmentRequest searchRequest) {

		SearchCriteriaCollectorWardAssignment criteria = searchRequest.getSearchCriteriaCollectorWardAssignment();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search collector assignments.");
		}

		List<CollectorWardAssignment> assignments = collectorWardAssignmentRepository.search(criteria);

		return CollectorWardAssignmentResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(),
						true))
				.collectorWardAssignments(assignments).build();
	}

	private void validateUserInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
