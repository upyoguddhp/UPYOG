package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.GarbageSupervisorRequest;
import org.egov.digitaldoorplate.model.GarbageSupervisorResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisorRequest;
import org.egov.digitaldoorplate.service.GarbageSupervisorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/garbage-supervisor")
public class GarbageSupervisorController {

	@Autowired
	private GarbageSupervisorService garbageSupervisorService;

	@PostMapping("/_create")
	public ResponseEntity<GarbageSupervisorResponse> create(
			@RequestBody GarbageSupervisorRequest garbageSupervisorRequest) {
		return ResponseEntity.ok(garbageSupervisorService.create(garbageSupervisorRequest));
	}

	@PostMapping("/_update")
	public ResponseEntity<GarbageSupervisorResponse> update(
			@RequestBody GarbageSupervisorRequest garbageSupervisorRequest) {
		return ResponseEntity.ok(garbageSupervisorService.update(garbageSupervisorRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<GarbageSupervisorResponse> search(
			@RequestBody SearchCriteriaGarbageSupervisorRequest searchCriteriaGarbageSupervisorRequest) {
		return ResponseEntity.ok(garbageSupervisorService.search(searchCriteriaGarbageSupervisorRequest));
	}
}
