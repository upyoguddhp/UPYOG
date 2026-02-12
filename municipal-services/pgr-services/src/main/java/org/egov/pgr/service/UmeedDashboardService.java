package org.egov.pgr.service;

import org.egov.pgr.service.UmeedDashboardService;
import org.egov.pgr.web.models.RequestInfoWrapper;
import org.egov.pgr.web.models.UmeedDashboardResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

public class UmeedDashboardService {
	
	
	@Autowired
	private UmeedDashboardService umeedDashboardService;
	
	
	@PostMapping("/data-metrics")
	public ResponseEntity<?> prepareDataMetrics(@RequestBody RequestInfoWrapper requestInfoWrapper) {

		String dataResponse = "";
		
		//UmeedDashboardResponse dataResponse = umeedDashboardService.prepareDataMetrics(requestInfoWrapper);

		return ResponseEntity.ok(dataResponse);
	}

}
