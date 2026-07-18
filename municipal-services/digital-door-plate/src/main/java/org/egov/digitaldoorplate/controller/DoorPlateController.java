package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.DoorPlateActionRequest;
import org.egov.digitaldoorplate.model.DoorPlateRequest;
import org.egov.digitaldoorplate.model.DoorPlateResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaDoorPlateRequest;
import org.egov.digitaldoorplate.service.DoorPlateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/door-plate")
public class DoorPlateController {

	@Autowired
	private DoorPlateService doorPlateService;

	@PostMapping("/_generate")
	public ResponseEntity<DoorPlateResponse> generate(@RequestBody DoorPlateRequest doorPlateRequest) {
		return ResponseEntity.ok(doorPlateService.generate(doorPlateRequest));
	}

	@PostMapping("/_verifyPrint")
	public ResponseEntity<DoorPlateResponse> verifyPrint(@RequestBody DoorPlateActionRequest actionRequest) {
		return ResponseEntity.ok(doorPlateService.verifyPrint(actionRequest));
	}

	@PostMapping("/_install")
	public ResponseEntity<DoorPlateResponse> install(@RequestBody DoorPlateActionRequest actionRequest) {
		return ResponseEntity.ok(doorPlateService.install(actionRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<DoorPlateResponse> search(
			@RequestBody SearchCriteriaDoorPlateRequest searchCriteriaDoorPlateRequest) {
		return ResponseEntity.ok(doorPlateService.search(searchCriteriaDoorPlateRequest));
	}
}
