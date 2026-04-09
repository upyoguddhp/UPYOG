package org.egov.pt.web.controllers;
import java.util.UUID;

import org.egov.pt.models.CalculateTaxRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.pt.models.CalculateTaxPreviewResponse;
import org.egov.pt.service.PropertySchedulerService;
import org.egov.pt.web.contracts.RequestInfoWrapper;
import org.egov.pt.web.contracts.alfresco.DmsResponse;
import org.egov.pt.web.contracts.alfresco.DmsRequest;
import org.egov.tracer.model.CustomException;
import org.egov.pt.util.PTConstants;
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
import org.egov.pt.service.AlfrescoService;
import org.egov.pt.models.BillIdRequest;
import org.springframework.web.bind.annotation.RequestParam;
//import org.egov.ptr.web.contracts.alfresco.DMSResponse;
//import org.egov.ptr.web.contracts.alfresco.DmsRequest;



import java.io.*;
import java.util.*;
@RestController
@RequestMapping("/property-scheduler")
public class PropertySchedulerController {

	@Autowired
	private PropertySchedulerService service;
	
	@Autowired
	private AlfrescoService alfrescoService;


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
	
//	public ResponseEntity<Resource> bulkBillUploads(
//	        @RequestBody RequestInfoWrapper requestInfoWrapper)
//	        throws Exception {
//
//	    byte[] finalPdf = service.uploadBulkBills(requestInfoWrapper);
//	    
////	    ByteArrayResource resource = new ByteArrayResource(finalPdf) {
////            @Override
////            public String getFilename() {
////                return "petdogsop.pdf";
////            }
////        };
////
////        // 3️⃣ External API URL
////        String url = "https://smlegf.hpupyog.hp.gov.in/hpud-dms-service/dms/uploadAttachments";
////
////        // 4️⃣ Headers
////        HttpHeaders headers = new HttpHeaders();
////        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
////        headers.add("Origin", "https://smlegf.hpupyog.hp.gov.in");
////        headers.add("Referer",
////                "https://smlegf.hpupyog.hp.gov.in/hp-udd/backend/new-garbage-registration");
////
////        // 5️⃣ Multipart Body
////        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
////        body.add("file", resource);
////        body.add("userId", "286370");
////        body.add("objectId", "f6d09062-06a1-4c9e-8ce6-caa4175eef1e89");
////        body.add("description", "trd-registeration");
////        body.add("id", "");
////        body.add("type", "application/pdf");
////        body.add("objectName", "GB");
////        body.add("comments", "comments text here...");
////        body.add("status", "PENDING");
////        body.add("uploadType", "6");
////        body.add("documentId", "6");
////        body.add("serviceType", "GB");
////        body.add("documentType", "CITIZ");
////
////        // 6️⃣ Request Entity
////        HttpEntity<MultiValueMap<String, Object>> requestEntity =
////                new HttpEntity<>(body, headers);
////
////        // 7️⃣ Call External API
////        RestTemplate restTemplate = new RestTemplate();
////
////        try {
////            ResponseEntity<String> response = restTemplate.exchange(
////                    url,
////                    HttpMethod.POST,
////                    requestEntity,
////                    String.class
////            );
////
////            System.out.println("Upload Response: " + response.getBody());
////
////        } catch (Exception e) {
////            System.out.println("Upload Failed: " + e.getMessage());
////        }
//
//        // 8️⃣ Return PDF to User
////        return ResponseEntity.ok()
////                .header(HttpHeaders.CONTENT_DISPOSITION,
////                        "attachment; filename=Combined_Bills.pdf")
////                .contentType(MediaType.APPLICATION_PDF)
////                .contentLength(finalPdf.length)
////                .body(resource);
//
//	    
//	    
//	    ByteArrayResource resource = new ByteArrayResource(finalPdf);
//
//	    return ResponseEntity.ok()
//	            .header(HttpHeaders.CONTENT_DISPOSITION,
//	                    "attachment; filename=Combined_Bills.pdf")
//	            .contentType(MediaType.APPLICATION_PDF)
//	            .contentLength(finalPdf.length)
//	            .body(resource);
//	}

//		public ResponseEntity<Resource> bulkBillUploads(
//		        @RequestBody RequestInfoWrapper requestInfoWrapper) throws Exception {
//		    byte[] finalPdf = service.uploadBulkBills(requestInfoWrapper);
//	
//		    ByteArrayResource resource = new ByteArrayResource(finalPdf) {
//		        @Override
//		        public String getFilename() {
//		            return "Combined_Bills.pdf";
//		        }
//		    };
//		    DmsRequest dmsRequest  = generateDmsRequestFromBulkBillUpload(resource, requestInfoWrapper.getRequestInfo());
//			try {
//				DmsResponse dmsResponse = alfrescoService.uploadAttachment(dmsRequest,
//						requestInfoWrapper.getRequestInfo());
//			} catch (IOException e) {
//				throw new CustomException("UPLOAD_ATTACHMENT_FAILED",
//						"Upload Attachment failed." + e.getMessage());
//			}
//		    // 7️⃣ Return PDF to User
//		    return ResponseEntity.ok()
//		            .header(HttpHeaders.CONTENT_DISPOSITION,
//		                    "attachment; filename=Combined_Bills.pdf")
//		            .contentType(MediaType.APPLICATION_PDF)
//		            .contentLength(finalPdf.length)
//		            .body(resource);
//		}
//		
//		
//		
//		
//		private DmsRequest generateDmsRequestFromBulkBillUpload(Resource resource, RequestInfo requestInfo) {
//			
//			DmsRequest dmsRequest = DmsRequest.builder().userId(requestInfo.getUserInfo().getId().toString())
//					.objectId(UUID.randomUUID().toString()).description(PTConstants.ALFRESCO_COMMON_CERTIFICATE_DESCRIPTION).id(PTConstants.ALFRESCO_COMMON_CERTIFICATE_ID).type(PTConstants.ALFRESCO_COMMON_CERTIFICATE_TYPE).objectName(PTConstants.BUSINESS_SERVICE)
//					.comments(PTConstants.ALFRESCO_TL_CERTIFICATE_COMMENT).status(PTConstants.APPLICATION_STATUS_APPROVED).file(resource).servicetype(PTConstants.BUSINESS_SERVICE)
//					.documentType(PTConstants.ALFRESCO_DOCUMENT_TYPE).documentId(PTConstants.ALFRESCO_COMMON_DOCUMENT_ID).build();
//	
//			return dmsRequest;
	
	
//		}
	

	@PostMapping("/bulk-uploads")
	public ResponseEntity<Map<String, Object>> bulkBillUploads(
	        @RequestBody RequestInfoWrapper requestInfoWrapper,@RequestParam(value = "isforce", required = false) String isforce,@RequestParam(value = "ulbName", required = false) String ulbName,@RequestParam(value = "wardName", required = false) String wardName) throws Exception {

	    boolean status = service.uploadBulkBills(requestInfoWrapper, isforce, ulbName, wardName);

	    Map<String, Object> response = new HashMap<>();
	    response.put("status", status);

	    return ResponseEntity.ok(response);
	}	
	
	@PostMapping("/extract-tracker")
	public ResponseEntity<?> getTrackerByBillId(@RequestBody BillIdRequest request) {
	    return ResponseEntity.ok(service.getTrackerByBillId(request));
	}
}
