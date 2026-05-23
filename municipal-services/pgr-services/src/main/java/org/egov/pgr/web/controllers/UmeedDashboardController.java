package org.egov.pgr.web.controllers;

import org.egov.pgr.service.UmeedDashboardService;
import org.egov.pgr.web.models.RequestInfoWrapper;
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
    public ResponseEntity<?> prepareDataMetrics(
            @RequestBody RequestInfoWrapper requestInfoWrapper) {

        return ResponseEntity.ok(
                umeedDashboardService.prepareDataMetrics(null)
        );
    }
}
