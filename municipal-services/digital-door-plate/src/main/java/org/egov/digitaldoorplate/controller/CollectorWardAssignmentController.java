package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.CollectorWardAssignmentRequest;
import org.egov.digitaldoorplate.model.CollectorWardAssignmentResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaCollectorWardAssignmentRequest;
import org.egov.digitaldoorplate.service.CollectorWardAssignmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/collector-ward-assignment")
public class CollectorWardAssignmentController {

	@Autowired
	private CollectorWardAssignmentService collectorWardAssignmentService;

	@PostMapping("/_assign")
	public ResponseEntity<CollectorWardAssignmentResponse> assign(
			@RequestBody CollectorWardAssignmentRequest collectorWardAssignmentRequest) {
		return ResponseEntity.ok(collectorWardAssignmentService.assign(collectorWardAssignmentRequest));
	}

	@PostMapping("/_unassign")
	public ResponseEntity<CollectorWardAssignmentResponse> unassign(
			@RequestBody CollectorWardAssignmentRequest collectorWardAssignmentRequest) {
		return ResponseEntity.ok(collectorWardAssignmentService.unassign(collectorWardAssignmentRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<CollectorWardAssignmentResponse> search(
			@RequestBody SearchCriteriaCollectorWardAssignmentRequest searchCriteriaCollectorWardAssignmentRequest) {
		return ResponseEntity.ok(collectorWardAssignmentService.search(searchCriteriaCollectorWardAssignmentRequest));
	}
}
