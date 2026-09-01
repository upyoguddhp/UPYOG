package org.egov.pt.web.controllers;

import org.egov.pt.service.UmeedDashboardService;

import org.egov.pt.models.RequestInfoWrapper;
import org.egov.pt.models.UmeedDashboardResponse;
import org.egov.pt.models.data.DataItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequestMapping("/data-dashboard")
public class UmeedDashboardController {

	@Autowired
	private UmeedDashboardService umeedDashboardService;

	@PostMapping("/data-metrics")
	public ResponseEntity<?> prepareDataMetrics(@RequestBody RequestInfoWrapper requestInfoWrapper) {

		UmeedDashboardResponse dataResponse = umeedDashboardService.prepareDataMetrics(requestInfoWrapper);
		return ResponseEntity.ok(dataResponse);

	}
}
