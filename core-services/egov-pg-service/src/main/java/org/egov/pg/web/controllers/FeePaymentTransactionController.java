package org.egov.pg.web.controllers;

import java.util.List;

import javax.validation.Valid;

import org.egov.pg.service.FeePaymentTransactionService;
import org.egov.pg.web.models.FeePaymentCreateRequest;
import org.egov.pg.web.models.FeePaymentStatusUpdateRequest;
import org.egov.pg.web.models.FeePaymentTransaction;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FeePaymentTransactionController {

    private final FeePaymentTransactionService service;

    public FeePaymentTransactionController(FeePaymentTransactionService service) {
        this.service = service;
    }

    @PostMapping("/fee-payment/v1/_create")
    public ResponseEntity<FeePaymentTransaction> create(
            @Valid @RequestBody FeePaymentCreateRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    @PostMapping("/fee-payment/v1/_search")
    public ResponseEntity<List<FeePaymentTransaction>> search(
            @RequestParam(value = "uuid", required = false) String uuid,
            @RequestParam(value = "consumerCode", required = false) String consumerCode,
            @RequestParam(value = "serviceUuid", required = false) String serviceUuid,
            @RequestParam(value = "module", required = false) String module) {
        return ResponseEntity.ok(service.search(uuid, consumerCode, serviceUuid, module));
    }

    @PostMapping("/fee-payment/v1/_update")
    public ResponseEntity<FeePaymentTransaction> update(
            @Valid @RequestBody FeePaymentStatusUpdateRequest request) {
        return ResponseEntity.ok(service.updateStatus(request));
    }
}
