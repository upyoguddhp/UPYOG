package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.GarbageSupervisorMappingResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageSupervisorMappingRequest;
import org.egov.digitaldoorplate.service.GarbageSupervisorMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/garbage-supervisor-mapping")
public class GarbageSupervisorMappingController {

	@Autowired
	private GarbageSupervisorMappingService garbageSupervisorMappingService;

	@PostMapping("/_search")
	public ResponseEntity<GarbageSupervisorMappingResponse> search(
			@RequestBody SearchCriteriaGarbageSupervisorMappingRequest searchCriteriaGarbageSupervisorMappingRequest) {
		return ResponseEntity
				.ok(garbageSupervisorMappingService.search(searchCriteriaGarbageSupervisorMappingRequest));
	}
}
