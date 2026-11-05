package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.GarbageCollectorRequest;
import org.egov.digitaldoorplate.model.GarbageCollectorResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectorRequest;
import org.egov.digitaldoorplate.service.GarbageCollectorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/garbage-collector")
public class GarbageCollectorController {

	@Autowired
	private GarbageCollectorService garbageCollectorService;

	@PostMapping("/_create")
	public ResponseEntity<GarbageCollectorResponse> create(
			@RequestBody GarbageCollectorRequest garbageCollectorRequest) {
		return ResponseEntity.ok(garbageCollectorService.create(garbageCollectorRequest));
	}

	@PostMapping("/_update")
	public ResponseEntity<GarbageCollectorResponse> update(
			@RequestBody GarbageCollectorRequest garbageCollectorRequest) {
		return ResponseEntity.ok(garbageCollectorService.update(garbageCollectorRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<GarbageCollectorResponse> search(
			@RequestBody SearchCriteriaGarbageCollectorRequest searchCriteriaGarbageCollectorRequest) {
		return ResponseEntity.ok(garbageCollectorService.search(searchCriteriaGarbageCollectorRequest));
	}
}
