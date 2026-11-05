package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.GarbageCollectionRequest;
import org.egov.digitaldoorplate.model.GarbageCollectionResponse;
import org.egov.digitaldoorplate.model.GarbageCollectionSyncResponse;
import org.egov.digitaldoorplate.model.QrScanRequest;
import org.egov.digitaldoorplate.model.QrScanResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectionRequest;
import org.egov.digitaldoorplate.service.GarbageCollectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/garbage-collection")
public class GarbageCollectionController {

	@Autowired
	private GarbageCollectionService garbageCollectionService;

	@PostMapping("/_scan")
	public ResponseEntity<QrScanResponse> scan(@RequestBody QrScanRequest qrScanRequest) {
		return ResponseEntity.ok(garbageCollectionService.scanQrCode(qrScanRequest));
	}

	@PostMapping("/_create")
	public ResponseEntity<GarbageCollectionResponse> create(
			@RequestBody GarbageCollectionRequest garbageCollectionRequest) {
		return ResponseEntity.ok(garbageCollectionService.create(garbageCollectionRequest));
	}

	@PostMapping("/_update")
	public ResponseEntity<GarbageCollectionResponse> update(
			@RequestBody GarbageCollectionRequest garbageCollectionRequest) {
		return ResponseEntity.ok(garbageCollectionService.update(garbageCollectionRequest));
	}

	@PostMapping("/_sync")
	public ResponseEntity<GarbageCollectionSyncResponse> sync(
			@RequestBody GarbageCollectionRequest garbageCollectionRequest) {
		return ResponseEntity.ok(garbageCollectionService.sync(garbageCollectionRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<GarbageCollectionResponse> search(
			@RequestBody SearchCriteriaGarbageCollectionRequest searchCriteriaGarbageCollectionRequest) {
		return ResponseEntity.ok(garbageCollectionService.search(searchCriteriaGarbageCollectionRequest));
	}
}
