package org.egov.pt.web.controllers;

import org.egov.pt.models.CalculateTaxRequest;
import org.egov.pt.models.CalculateTaxPreviewResponse;
import org.egov.pt.service.PropertySchedulerService;
import org.egov.pt.web.contracts.RequestInfoWrapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import java.util.List;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;

//pdf
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.io.MemoryUsageSetting;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.io.*;
import java.util.*;
@RestController
@RequestMapping("/property-scheduler")
public class PropertySchedulerController {

	@Autowired
	private PropertySchedulerService service;

	@PostMapping("/tax-calculator")
	public ResponseEntity<?> taxCalculator(@RequestBody CalculateTaxRequest calculateTaxRequest) {

//		service.calculateTax(calculateTaxRequest);
//
//		return ResponseEntity.ok("Tax calculated successfully!!!");
		return ResponseEntity.ok(service.calculateTax(calculateTaxRequest));
	}
	
	@PostMapping("/tax-calculator/preview")
	public ResponseEntity<List<CalculateTaxPreviewResponse>> taxCalculatorPreview(
	        @RequestBody CalculateTaxRequest calculateTaxRequest) {

	    return ResponseEntity.ok(
	            service.taxCalculatorPreview(calculateTaxRequest)
	    );
	}



	@PostMapping("/update-tracker-bill-status")
	public ResponseEntity<?> updateTrackerBillStatus(@RequestBody RequestInfoWrapper requestInfoWrapper) {

		service.updateTrackerBillStatus(requestInfoWrapper);

		return ResponseEntity.ok("Tracker bill status updated successfully!!!");
//		return ResponseEntity.ok(service.updateTrackerBillStatus(requestInfoWrapper));
	}

	@PostMapping("/reverse-rebate-amount")
	public ResponseEntity<?> reverseRebateAmount(@RequestBody RequestInfoWrapper requestInfoWrapper) {

		service.reverseRebateAmount(requestInfoWrapper);

		return ResponseEntity.ok("Rebate amount reversed successfully!!!");
//		return ResponseEntity.ok(service.reverseRebateAmount(requestInfoWrapper));
	}

	@PostMapping("/update-penalty-amount")
	public ResponseEntity<?> updatePenaltyAmount(@RequestBody RequestInfoWrapper requestInfoWrapper) {

		service.updatePenaltyAmount(requestInfoWrapper);

		return ResponseEntity.ok("Penalty amount updated successfully!!!");
//		return ResponseEntity.ok(service.updatePenaltyAmount(requestInfoWrapper)); 
	}
	
	
//	@PostMapping("/bulk-uploads")
//	public ResponseEntity<?> bulkBillUploads(@RequestBody CalculateTaxRequest calculateTaxRequest) {
//	service.uploadBulkBills(calculateTaxRequest);
//	return ResponseEntity.ok("Penalty amount updated successfully!!!");
// 
//
//	}
	
	@PostMapping("/bulk-uploads")
	public ResponseEntity<Resource> bulkBillUploads(
	        @RequestBody RequestInfoWrapper requestInfoWrapper)
	        throws Exception {

	    byte[] finalPdf = service.uploadBulkBills(requestInfoWrapper);
	    ByteArrayResource resource = new ByteArrayResource(finalPdf);

	    return ResponseEntity.ok()
	            .header(HttpHeaders.CONTENT_DISPOSITION,
	                    "attachment; filename=Combined_Bills.pdf")
	            .contentType(MediaType.APPLICATION_PDF)
	            .contentLength(finalPdf.length)
	            .body(resource);
	}


}
