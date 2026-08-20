package org.egov.digitaldoorplate.controller;

import org.egov.digitaldoorplate.model.ContractorRequest;
import org.egov.digitaldoorplate.model.ContractorResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaContractorRequest;
import org.egov.digitaldoorplate.service.ContractorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/contractor")
public class ContractorController {

	@Autowired
	private ContractorService contractorService;

	@PostMapping("/_create")
	public ResponseEntity<ContractorResponse> create(@RequestBody ContractorRequest contractorRequest) {
		return ResponseEntity.ok(contractorService.create(contractorRequest));
	}

	@PostMapping("/_search")
	public ResponseEntity<ContractorResponse> search(
			@RequestBody SearchCriteriaContractorRequest searchCriteriaContractorRequest) {
		return ResponseEntity.ok(contractorService.search(searchCriteriaContractorRequest));
	}
}
