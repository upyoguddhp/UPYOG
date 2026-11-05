package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.GarbageCollectorMappingResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorMappingRequest;
import org.egov.digitaldoorplate.service.GarbageCollectorMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/garbage-collector-mapping")
public class GarbageCollectorMappingController {

	@Autowired
	private GarbageCollectorMappingService garbageCollectorMappingService;

	@PostMapping("/_search")
	public ResponseEntity<GarbageCollectorMappingResponse> search(
			@RequestBody SearchCriteriaGarbageCollectorMappingRequest searchCriteriaGarbageCollectorMappingRequest) {
		return ResponseEntity.ok(garbageCollectorMappingService.search(searchCriteriaGarbageCollectorMappingRequest));
	}
}
