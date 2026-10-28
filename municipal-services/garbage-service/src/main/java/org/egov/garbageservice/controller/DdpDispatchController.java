package org.egov.garbageservice.controller;

import org.egov.garbageservice.model.DdpDispatchGenerateQrRequest;
import org.egov.garbageservice.model.DdpDispatchGenerateQrResponse;
import org.egov.garbageservice.model.DdpDispatchReceiveRequest;
import org.egov.garbageservice.model.DdpDispatchReceiveResponse;
import org.egov.garbageservice.model.DdpDispatchScanRequest;
import org.egov.garbageservice.model.DdpDispatchScanResponse;
import org.egov.garbageservice.model.DdpDispatchSearchResponse;
import org.egov.garbageservice.model.DdpDispatchSubmitRequest;
import org.egov.garbageservice.model.DdpDispatchSubmitResponse;
import org.egov.garbageservice.model.SearchCriteriaDdpDispatchRequest;
import org.egov.garbageservice.service.DdpDispatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * DDP dispatch batch creation (plate scanning), submission and search. See
 * {@link DdpDispatchService} for the workflow details.
 */
@RestController
@RequestMapping("/ddp-dispatch")
public class DdpDispatchController {

	@Autowired
	private DdpDispatchService service;

	/**
	 * Scans one plate into a dispatch batch: creates a new batch (and
	 * generates its batch_no) when batchNo is empty on the request, or adds
	 * the plate to the given open batch otherwise.
	 */
	@PostMapping("/_scan")
	public ResponseEntity<DdpDispatchScanResponse> scan(@RequestBody DdpDispatchScanRequest request) {
		return ResponseEntity.ok(service.scanPlate(request));
	}

	/**
	 * Submits a fully-scanned batch: flips it from INITIATED to SUBMITTED
	 * and marks every plate assigned to it as dispatched, in one
	 * transaction.
	 */
	@PostMapping("/_submit")
	public ResponseEntity<DdpDispatchSubmitResponse> submit(@RequestBody DdpDispatchSubmitRequest request) {
		return ResponseEntity.ok(service.submitBatch(request));
	}

	@PostMapping("/_search")
	public ResponseEntity<DdpDispatchSearchResponse> search(@RequestBody SearchCriteriaDdpDispatchRequest request) {
		return ResponseEntity.ok(service.searchBatches(request));
	}

	/**
	 * Generates a QR code (encoding the batch_no) for a dispatched batch, for
	 * the ULB side to print/scan on receipt.
	 */
	@PostMapping("/_generateQr")
	public ResponseEntity<DdpDispatchGenerateQrResponse> generateQr(@RequestBody DdpDispatchGenerateQrRequest request) {
		return ResponseEntity.ok(service.generateQrForBatch(request));
	}

	/**
	 * Confirms receipt of a dispatched batch at the ULB side, after scanning
	 * and decrypting its QR code (via digital-door-plate's /qr/_decrypt) to
	 * recover the batch_no.
	 */
	@PostMapping("/_receive")
	public ResponseEntity<DdpDispatchReceiveResponse> receive(@RequestBody DdpDispatchReceiveRequest request) {
		return ResponseEntity.ok(service.receiveBatch(request));
	}
}
