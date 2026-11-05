package org.egov.financedashboard.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.egov.financedashboard.service.FinanceSummaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/v1/state")
public class FinanceDashboardController {

	@Autowired
	private FinanceSummaryService service;

	/**
	 * Body: { "RequestInfo": {...}, "criteria": { "financialYear": "2026-27", "zone": "All" } }.
	 * Authentication is enforced by the gateway (zuul) in front of this service.
	 */
	@PostMapping("/_summary")
	public ResponseEntity<?> summary(@RequestBody(required = false) Map<String, Object> body) {
		String financialYear = null;
		if (body != null && body.get("criteria") instanceof Map) {
			Object fy = ((Map<?, ?>) body.get("criteria")).get("financialYear");
			financialYear = fy == null ? null : fy.toString();
		}
		try {
			return ResponseEntity.ok(service.getSummary(financialYear));
		} catch (IllegalArgumentException e) {
			Map<String, Object> error = new LinkedHashMap<>();
			error.put("code", "INVALID_FINANCIAL_YEAR");
			error.put("message", e.getMessage());
			Map<String, Object> wrapper = new LinkedHashMap<>();
			wrapper.put("Errors", java.util.Collections.singletonList(error));
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(wrapper);
		}
	}
}
