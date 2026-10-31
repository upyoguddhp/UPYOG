package org.egov.garbageservice.service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.garbageservice.model.AuditDetails;
import org.egov.garbageservice.model.DdpDispatch;
import org.egov.garbageservice.model.DdpDispatchDetail;
import org.egov.garbageservice.model.DdpDispatchGenerateQrRequest;
import org.egov.garbageservice.model.DdpDispatchGenerateQrResponse;
import org.egov.garbageservice.model.DdpDispatchReceiveRequest;
import org.egov.garbageservice.model.DdpDispatchReceiveResponse;
import org.egov.garbageservice.model.DdpDispatchScanRequest;
import org.egov.garbageservice.model.DdpDispatchScanResponse;
import org.egov.garbageservice.model.DdpDispatchSearchResponse;
import org.egov.garbageservice.model.DdpDispatchSubmitRequest;
import org.egov.garbageservice.model.DdpDispatchSubmitResponse;
import org.egov.garbageservice.model.DispatchPlateLookup;
import org.egov.garbageservice.model.ScannedPlateInfo;
import org.egov.garbageservice.model.SearchCriteriaDdpDispatch;
import org.egov.garbageservice.model.SearchCriteriaDdpDispatchRequest;
import org.egov.garbageservice.repository.DdpDispatchRepository;
import org.egov.garbageservice.util.GrbgConstants;
import org.egov.garbageservice.util.ResponseInfoFactory;
import org.egov.garbageservice.util.RestCallRepository;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

/**
 * Backs the "Create Dispatch" flow: scanning plates into a dispatch batch
 * (creating the batch on the first scan), submitting a fully-scanned batch,
 * and searching dispatch batches.
 */
@Service
public class DdpDispatchService {

	private static final String BATCH_NO_FORMAT = "DDP-%s-%s-%03d";
	private static final String BATCH_DATE_FORMAT = "ddMMyy";

	/**
	 * Matches a plain, already-decrypted batch_no (e.g.
	 * "DDP-SHIMLA-271026-001"). Anything else passed in as a "batchNo" is
	 * treated as the raw encrypted payload scanned straight off a dispatch
	 * QR code (see {@link #generateQrForBatch}) and decrypted first.
	 */
	private static final Pattern BATCH_NO_PATTERN = Pattern.compile("^DDP-[A-Za-z0-9]+-\\d{6}-\\d{3,}$");

	@Autowired
	private DdpDispatchRepository ddpDispatchRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	@Autowired
	private RestCallRepository restCallRepository;

	@Autowired
	private GrbgConstants grbgConstants;

	public DdpDispatchScanResponse scanPlate(DdpDispatchScanRequest request) {

		validateRequestInfo(request.getRequestInfo());
		if (StringUtils.isEmpty(request.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory to scan a plate for dispatch.");
		}
		if (StringUtils.isEmpty(request.getScannedPlateUuid())) {
			throw new CustomException("INVALID_REQUEST", "scannedPlateUuid is mandatory to scan a plate for dispatch.");
		}

		DispatchPlateLookup plate = ddpDispatchRepository.findPlateForDispatch(request.getScannedPlateUuid());
		if (null == plate) {
			throw new CustomException("PLATE_NOT_FOUND",
					"No garbage account found for the scanned plate: " + request.getScannedPlateUuid());
		}
		if (StringUtils.isEmpty(plate.getUlb())) {
			throw new CustomException("PLATE_ULB_NOT_FOUND",
					"Could not determine the ULB for the scanned plate: " + request.getScannedPlateUuid());
		}
		if (Boolean.TRUE.equals(plate.getDdpDispatched())) {
			throw new CustomException("PLATE_ALREADY_DISPATCHED",
					"This plate has already been dispatched in an earlier batch.");
		}
		if (StringUtils.isNotEmpty(plate.getExistingBatchNo())) {
			throw new CustomException("PLATE_ALREADY_SCANNED",
					"This plate has already been scanned into batch " + plate.getExistingBatchNo() + ".");
		}

		String userUuid = request.getRequestInfo().getUserInfo().getUuid();
		long now = System.currentTimeMillis();

		DdpDispatch batch;
		if (StringUtils.isEmpty(request.getBatchNo())) {
			batch = createBatch(plate.getUlb(), plate.getWard(), userUuid, now);
		} else {
			batch = ddpDispatchRepository.findBatchByBatchNo(request.getBatchNo());
			if (null == batch) {
				throw new CustomException("BATCH_NOT_FOUND", "No dispatch batch found for batch_no: " + request.getBatchNo());
			}
			if (!GrbgConstants.DDP_DISPATCH_STATUS_INITIATED.equals(batch.getStatus())) {
				throw new CustomException("BATCH_NOT_OPEN",
						"Batch " + batch.getBatchNo() + " is no longer open for scanning (status: " + batch.getStatus() + ").");
			}
			if (!batch.getUlb().equalsIgnoreCase(plate.getUlb())) {
				throw new CustomException("ULB_MISMATCH", "Scanned plate belongs to ULB " + plate.getUlb()
						+ ", but batch " + batch.getBatchNo() + " belongs to ULB " + batch.getUlb() + ".");
			}
		}

		ddpDispatchRepository.assignPlateToBatch(plate.getGarbageAccountUuid(), batch.getBatchNo());

		List<ScannedPlateInfo> scannedPlates = ddpDispatchRepository.findScannedPlatesByBatchNo(batch.getBatchNo());

		return DdpDispatchScanResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.batchNo(batch.getBatchNo()).ulb(batch.getUlb()).status(batch.getStatus())
				.totalScanCount(scannedPlates.size()).scannedPlates(scannedPlates).build();
	}

	private DdpDispatch createBatch(String ulb, String ward, String userUuid, long now) {
		String ulbForBatchNo = ulb.toUpperCase();
		String batchDate = new SimpleDateFormat(BATCH_DATE_FORMAT).format(new Date(now));

		int sequence = ddpDispatchRepository.nextBatchSequence(ulbForBatchNo, batchDate);
		String batchNo = String.format(BATCH_NO_FORMAT, ulbForBatchNo, batchDate, sequence);

		AuditDetails auditDetails = AuditDetails.builder().createdBy(userUuid).lastModifiedBy(userUuid)
				.createdTime(now).lastModifiedTime(now).build();

		DdpDispatch batch = DdpDispatch.builder().uuid(UUID.randomUUID().toString()).batchNo(batchNo)
				.ulb(ulbForBatchNo).ward(ward).status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED)
				.auditDetails(auditDetails).build();

		ddpDispatchRepository.insertBatch(batch);
		return batch;
	}

	public DdpDispatchSubmitResponse submitBatch(DdpDispatchSubmitRequest request) {

		validateRequestInfo(request.getRequestInfo());
		if (StringUtils.isEmpty(request.getBatchNo())) {
			throw new CustomException("INVALID_REQUEST", "batch_no is mandatory to submit a dispatch batch.");
		}

		DdpDispatch batch = ddpDispatchRepository.findBatchByBatchNo(request.getBatchNo());
		if (null == batch) {
			throw new CustomException("BATCH_NOT_FOUND", "No dispatch batch found for batch_no: " + request.getBatchNo());
		}
		if (!GrbgConstants.DDP_DISPATCH_STATUS_INITIATED.equals(batch.getStatus())) {
			throw new CustomException("BATCH_ALREADY_SUBMITTED",
					"Batch " + batch.getBatchNo() + " is already in status " + batch.getStatus() + " and cannot be submitted again.");
		}
		if (ddpDispatchRepository.countPlatesByBatchNo(batch.getBatchNo()) == 0) {
			throw new CustomException("BATCH_EMPTY", "Batch " + batch.getBatchNo() + " has no scanned plates to submit.");
		}

		String userUuid = request.getRequestInfo().getUserInfo().getUuid();
		long now = System.currentTimeMillis();

		int updated = ddpDispatchRepository.submitBatch(batch.getBatchNo(), GrbgConstants.DDP_DISPATCH_STATUS_INITIATED,
				GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED, now, userUuid, now);
		if (updated == 0) {
			throw new CustomException("BATCH_ALREADY_SUBMITTED",
					"Batch " + batch.getBatchNo() + " was already submitted by another request.");
		}

		List<ScannedPlateInfo> scannedPlates = ddpDispatchRepository.findScannedPlatesByBatchNo(batch.getBatchNo());

		return DdpDispatchSubmitResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.batchNo(batch.getBatchNo()).status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).dispatchDate(now)
				.ulb(batch.getUlb()).totalScanCount(scannedPlates.size()).scannedPlates(scannedPlates).build();
	}

	/**
	 * Generates a QR code for a dispatched batch (encoding just the batch_no,
	 * via digital-door-plate's generic /qr/_generate), for the ULB side to
	 * scan on receipt. Allowed once the batch has actually been dispatched
	 * (SUBMITTED or already RECEIVED, e.g. to reprint); not before.
	 */
	public DdpDispatchGenerateQrResponse generateQrForBatch(DdpDispatchGenerateQrRequest request) {

		validateRequestInfo(request.getRequestInfo());
		if (StringUtils.isEmpty(request.getBatchNo())) {
			throw new CustomException("INVALID_REQUEST", "batch_no is mandatory to generate a dispatch QR code.");
		}

		DdpDispatch batch = ddpDispatchRepository.findBatchByBatchNo(request.getBatchNo());
		if (null == batch) {
			throw new CustomException("BATCH_NOT_FOUND", "No dispatch batch found for batch_no: " + request.getBatchNo());
		}
		if (GrbgConstants.DDP_DISPATCH_STATUS_INITIATED.equals(batch.getStatus())) {
			throw new CustomException("BATCH_NOT_DISPATCHED",
					"Batch " + batch.getBatchNo() + " has not been submitted/dispatched yet.");
		}

		StringBuilder uri = new StringBuilder(grbgConstants.getDigitalDoorPlateHostUrl())
				.append(grbgConstants.getDigitalDoorPlateContextPath())
				.append(grbgConstants.getDigitalDoorPlateQrGenerateEndpoint());

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("RequestInfo", request.getRequestInfo());
		requestBody.put("tenantId", request.getTenantId());
		requestBody.put("data", batch.getBatchNo());

		Object response = restCallRepository.fetchResult(uri, requestBody);
		if (null == response || !(response instanceof Map)) {
			throw new CustomException("QR_GENERATION_FAILED", "Failed to generate QR code for batch " + batch.getBatchNo() + ".");
		}

		@SuppressWarnings("unchecked")
		Map<String, Object> qrResponse = (Map<String, Object>) response;

		return DdpDispatchGenerateQrResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.batchNo(batch.getBatchNo()).ulb(batch.getUlb()).status(batch.getStatus())
				.qrCodeImage((String) qrResponse.get("qrCodeImage")).encryptedData((String) qrResponse.get("encryptedData"))
				.build();
	}

	/**
	 * Confirms receipt of a dispatched batch at the ULB side (after scanning
	 * and decrypting its QR code to get the batch_no back): flips the batch
	 * from SUBMITTED to RECEIVED and records who received it and when.
	 */
	public DdpDispatchReceiveResponse receiveBatch(DdpDispatchReceiveRequest request) {

		validateRequestInfo(request.getRequestInfo());
		if (StringUtils.isEmpty(request.getBatchNo())) {
			throw new CustomException("INVALID_REQUEST", "batch_no is mandatory to receive a dispatch batch.");
		}
		if (StringUtils.isEmpty(request.getReceivedBy())) {
			throw new CustomException("INVALID_REQUEST", "receivedBy is mandatory to receive a dispatch batch.");
		}

		String batchNo = decryptBatchNoIfNeeded(request.getBatchNo(), request.getRequestInfo());

		DdpDispatch batch = ddpDispatchRepository.findBatchByBatchNo(batchNo);
		if (null == batch) {
			throw new CustomException("BATCH_NOT_FOUND", "No dispatch batch found for batch_no: " + batchNo);
		}
		if (GrbgConstants.DDP_DISPATCH_STATUS_INITIATED.equals(batch.getStatus())) {
			throw new CustomException("BATCH_NOT_DISPATCHED",
					"Batch " + batch.getBatchNo() + " has not been submitted/dispatched yet and cannot be received.");
		}
		if (GrbgConstants.DDP_DISPATCH_STATUS_RECEIVED.equals(batch.getStatus())) {
			throw new CustomException("BATCH_ALREADY_RECEIVED",
					"Batch " + batch.getBatchNo() + " has already been received.");
		}

		String userUuid = request.getRequestInfo().getUserInfo().getUuid();
		long now = System.currentTimeMillis();

		int updated = ddpDispatchRepository.receiveBatch(batch.getBatchNo(), GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED,
				GrbgConstants.DDP_DISPATCH_STATUS_RECEIVED, request.getReceivedBy(), now, userUuid, now);
		if (updated == 0) {
			throw new CustomException("BATCH_ALREADY_RECEIVED",
					"Batch " + batch.getBatchNo() + " was already received by another request.");
		}

		List<ScannedPlateInfo> scannedPlates = ddpDispatchRepository.findScannedPlatesByBatchNo(batch.getBatchNo());

		return DdpDispatchReceiveResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.batchNo(batch.getBatchNo()).status(GrbgConstants.DDP_DISPATCH_STATUS_RECEIVED).ulb(batch.getUlb())
				.dispatchDate(batch.getDispatchDate()).receivedBy(request.getReceivedBy()).ulbReceivingDate(now)
				.totalScanCount(scannedPlates.size()).scannedPlates(scannedPlates).build();
	}

	public DdpDispatchSearchResponse searchBatches(SearchCriteriaDdpDispatchRequest request) {

		validateRequestInfo(request.getRequestInfo());

		SearchCriteriaDdpDispatch criteria = null != request.getSearchCriteriaDdpDispatch()
				? request.getSearchCriteriaDdpDispatch()
				: SearchCriteriaDdpDispatch.builder().build();

		if (!CollectionUtils.isEmpty(criteria.getBatchNo())) {
			Set<String> decryptedBatchNos = criteria.getBatchNo().stream()
					.map(batchNo -> decryptBatchNoIfNeeded(batchNo, request.getRequestInfo()))
					.collect(Collectors.toSet());
			criteria = criteria.toBuilder().batchNo(decryptedBatchNos).build();
		}

		List<DdpDispatch> batches = ddpDispatchRepository.searchBatches(criteria);
		long totalCount = ddpDispatchRepository.countBatches(criteria);

		List<DdpDispatchDetail> dispatchBatches = batches.stream().map(this::toDispatchDetail)
				.collect(Collectors.toList());

		return DdpDispatchSearchResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.totalCount(totalCount).dispatchBatches(dispatchBatches).build();
	}

	private DdpDispatchDetail toDispatchDetail(DdpDispatch batch) {
		List<ScannedPlateInfo> scannedPlates = ddpDispatchRepository.findScannedPlatesByBatchNo(batch.getBatchNo());
		return DdpDispatchDetail.builder().batchNo(batch.getBatchNo()).ulb(batch.getUlb()).ward(batch.getWard())
				.dispatchDate(batch.getDispatchDate()).receivedBy(batch.getReceivedBy())
				.ulbReceivingDate(batch.getUlbReceivingDate()).status(batch.getStatus())
				.totalScanCount(scannedPlates.size()).scannedPlates(scannedPlates)
				.auditDetails(batch.getAuditDetails()).build();
	}

	/**
	 * Scanning a dispatch QR code (see {@link #generateQrForBatch}) yields
	 * the raw encrypted payload, not the plain batch_no - callers that take
	 * that raw scan straight off a scanner (receive, search) run it through
	 * this first. A value already shaped like a plain batch_no is returned
	 * unchanged (so typing/pasting a real batch_no still works); anything
	 * else is decrypted via digital-door-plate's generic /qr/_decrypt.
	 */
	private String decryptBatchNoIfNeeded(String rawValue, RequestInfo requestInfo) {
		if (StringUtils.isEmpty(rawValue) || BATCH_NO_PATTERN.matcher(rawValue).matches()) {
			return rawValue;
		}

		StringBuilder uri = new StringBuilder(grbgConstants.getDigitalDoorPlateHostUrl())
				.append(grbgConstants.getDigitalDoorPlateContextPath())
				.append(grbgConstants.getDigitalDoorPlateQrDecryptEndpoint());

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("RequestInfo", requestInfo);
		requestBody.put("encryptedData", rawValue);

		Object response = restCallRepository.fetchResult(uri, requestBody);
		if (null == response || !(response instanceof Map)) {
			throw new CustomException("QR_DECRYPT_FAILED", "Failed to decrypt the scanned dispatch QR code.");
		}

		@SuppressWarnings("unchecked")
		Map<String, Object> decryptResponse = (Map<String, Object>) response;
		Object data = decryptResponse.get("data");
		if (null == data || StringUtils.isEmpty(data.toString())) {
			throw new CustomException("QR_DECRYPT_FAILED", "Failed to decrypt the scanned dispatch QR code.");
		}

		return data.toString();
	}

	private void validateRequestInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo() || StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
