package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.ContractorWardMappingRequest;
import org.egov.digitaldoorplate.model.ContractorWardMappingResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaContractorWardMappingRequest;
import org.egov.digitaldoorplate.service.ContractorWardMappingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/contractor-ward-mapping")
public class ContractorWardMappingController {

	@Autowired
	private ContractorWardMappingService contractorWardMappingService;

	@PostMapping("/_create")
	public ResponseEntity<ContractorWardMappingResponse> create(
			@RequestBody ContractorWardMappingRequest contractorWardMappingRequest) {
		return ResponseEntity.ok(contractorWardMappingService.create(contractorWardMappingRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<ContractorWardMappingResponse> search(
			@RequestBody SearchCriteriaContractorWardMappingRequest searchCriteriaContractorWardMappingRequest) {
		return ResponseEntity.ok(contractorWardMappingService.search(searchCriteriaContractorWardMappingRequest));
	}
}
