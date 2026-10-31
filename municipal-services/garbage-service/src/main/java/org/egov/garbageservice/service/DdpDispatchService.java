package org.egov.garbageservice.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.RequestInfo;
import org.egov.garbageservice.model.AuditDetails;
import org.egov.garbageservice.model.DdpDispatch;
import org.egov.garbageservice.model.DdpDispatchDetail;
import org.egov.garbageservice.model.DdpDispatchGenerateQrRequest;
import org.egov.garbageservice.model.DdpDispatchGenerateQrResponse;
import org.egov.garbageservice.model.DdpDispatchQrPayload;
import org.egov.garbageservice.model.DdpDispatchReceiveRequest;
import org.egov.garbageservice.model.DdpDispatchReceiveResponse;
import org.egov.garbageservice.model.DdpDispatchScanRequest;
import org.egov.garbageservice.model.DdpDispatchScanResponse;
import org.egov.garbageservice.model.DdpDispatchSearchResponse;
import org.egov.garbageservice.model.DdpDispatchSubmitRequest;
import org.egov.garbageservice.model.DdpDispatchSubmitResponse;
import org.egov.garbageservice.model.DispatchPlateLookup;
import org.egov.garbageservice.model.PtOwnerInfo;
import org.egov.garbageservice.model.PtProperty;
import org.egov.garbageservice.model.PtPropertyResponse;
import org.egov.garbageservice.model.ScannedPlateInfo;
import org.egov.garbageservice.model.ScannedPlateRaw;
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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;

/**
 * Backs the "Create Dispatch" flow: scanning plates into a dispatch batch
 * (creating the batch on the first scan), submitting a fully-scanned batch,
 * and searching dispatch batches.
 */
@Service
public class DdpDispatchService {

	private static final String BATCH_NO_FORMAT = "DDP-%s-%s-%03d";
	private static final String BATCH_DATE_FORMAT = "ddMMyy";

	private static final int QR_IMAGE_SIZE = 350;

	@Autowired
	private DdpDispatchRepository ddpDispatchRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	@Autowired
	private ObjectMapper objectMapper;

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

		List<ScannedPlateInfo> scannedPlates = buildScannedPlateInfos(batch.getBatchNo(), request.getRequestInfo());

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

		List<ScannedPlateInfo> scannedPlates = buildScannedPlateInfos(batch.getBatchNo(), request.getRequestInfo());

		return DdpDispatchSubmitResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.batchNo(batch.getBatchNo()).status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).dispatchDate(now)
				.ulb(batch.getUlb()).totalScanCount(scannedPlates.size()).scannedPlates(scannedPlates).build();
	}

	/**
	 * Generates a plain (unencrypted) QR code for a dispatched batch,
	 * encoding a JSON object with batchNo/ulb/totalScannedPlates so any
	 * generic QR scanner app can read it directly - no decrypt step needed
	 * anywhere. For the ULB side to scan on receipt. Allowed once the batch
	 * has actually been dispatched (SUBMITTED or already RECEIVED, e.g. to
	 * reprint); not before.
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

		int totalScannedPlates = (int) ddpDispatchRepository.countPlatesByBatchNo(batch.getBatchNo());

		DdpDispatchQrPayload payload = DdpDispatchQrPayload.builder().batchNo(batch.getBatchNo()).ulb(batch.getUlb())
				.totalScannedPlates(totalScannedPlates).build();

		String qrData;
		try {
			qrData = objectMapper.writeValueAsString(payload);
		} catch (Exception e) {
			throw new CustomException("QR_GENERATION_FAILED",
					"Failed to build QR payload for batch " + batch.getBatchNo() + ": " + e.getMessage());
		}

		return DdpDispatchGenerateQrResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.batchNo(batch.getBatchNo()).ulb(batch.getUlb()).status(batch.getStatus())
				.totalScannedPlates(totalScannedPlates).qrCodeImage(renderQrCodeImage(qrData)).build();
	}

	/**
	 * Renders the given plain text/JSON as a QR code PNG, base64 data URI
	 * (ready for an &lt;img src="..."&gt;) - no encryption, readable by any
	 * generic QR scanner.
	 */
	private String renderQrCodeImage(String data) {
		try {
			Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
			hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
			hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
			hints.put(EncodeHintType.MARGIN, 1);

			QRCodeWriter qrCodeWriter = new QRCodeWriter();
			BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, QR_IMAGE_SIZE, QR_IMAGE_SIZE, hints);

			ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
			MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

			return "data:image/png;base64," + Base64.getEncoder().encodeToString(outputStream.toByteArray());
		} catch (WriterException | IOException e) {
			throw new CustomException("QR_IMAGE_GENERATION_ERROR",
					"Error occurred while rendering the dispatch QR code image. Message: " + e.getMessage());
		}
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

		DdpDispatch batch = ddpDispatchRepository.findBatchByBatchNo(request.getBatchNo());
		if (null == batch) {
			throw new CustomException("BATCH_NOT_FOUND", "No dispatch batch found for batch_no: " + request.getBatchNo());
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

		List<ScannedPlateInfo> scannedPlates = buildScannedPlateInfos(batch.getBatchNo(), request.getRequestInfo());

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

		List<DdpDispatch> batches = ddpDispatchRepository.searchBatches(criteria);
		long totalCount = ddpDispatchRepository.countBatches(criteria);

		List<DdpDispatchDetail> dispatchBatches = batches.stream()
				.map(batch -> toDispatchDetail(batch, request.getRequestInfo())).collect(Collectors.toList());

		return DdpDispatchSearchResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.totalCount(totalCount).dispatchBatches(dispatchBatches).build();
	}

	private DdpDispatchDetail toDispatchDetail(DdpDispatch batch, RequestInfo requestInfo) {
		List<ScannedPlateInfo> scannedPlates = buildScannedPlateInfos(batch.getBatchNo(), requestInfo);
		return DdpDispatchDetail.builder().batchNo(batch.getBatchNo()).ulb(batch.getUlb()).ward(batch.getWard())
				.dispatchDate(batch.getDispatchDate()).receivedBy(batch.getReceivedBy())
				.ulbReceivingDate(batch.getUlbReceivingDate()).status(batch.getStatus())
				.totalScanCount(scannedPlates.size()).scannedPlates(scannedPlates)
				.auditDetails(batch.getAuditDetails()).build();
	}

	/**
	 * Enriches the raw plates assigned to a batch with ownerName and ward
	 * from property-services (looked up by each plate's systemPropertyId) -
	 * the same mechanism GarbageAccountService's DDP printing search
	 * (/garbage-accounts/_searchDdpPrintingData) uses, kept separate here so
	 * the dispatch feature doesn't depend on that class. ownerName comes
	 * from the property's primary owner (no fallback to the garbage
	 * account's own name); ward comes from the property address's
	 * wardNo/wardNumber, since property-services has no ward-name string.
	 * A plate with no linked property (or no match found) comes back with
	 * null ownerName/ward.
	 */
	private List<ScannedPlateInfo> buildScannedPlateInfos(String batchNo, RequestInfo requestInfo) {
		List<ScannedPlateRaw> rawPlates = ddpDispatchRepository.findScannedPlateRawByBatchNo(batchNo);
		if (CollectionUtils.isEmpty(rawPlates)) {
			return Collections.emptyList();
		}

		String tenantId = rawPlates.stream().map(ScannedPlateRaw::getTenantId).filter(StringUtils::isNotEmpty)
				.findFirst().orElse(null);

		List<String> systemPropertyIds = rawPlates.stream().map(ScannedPlateRaw::getSystemPropertyId)
				.filter(StringUtils::isNotEmpty).distinct().collect(Collectors.toList());

		Map<String, PtProperty> propertyBySystemPropertyId = fetchPropertiesBySystemPropertyId(requestInfo, tenantId,
				systemPropertyIds);

		return rawPlates.stream().map(raw -> toScannedPlateInfo(raw, propertyBySystemPropertyId))
				.collect(Collectors.toList());
	}

	private ScannedPlateInfo toScannedPlateInfo(ScannedPlateRaw raw, Map<String, PtProperty> propertyBySystemPropertyId) {
		PtProperty property = StringUtils.isEmpty(raw.getSystemPropertyId()) ? null
				: propertyBySystemPropertyId.get(raw.getSystemPropertyId());

		String ownerName = null;
		String ward = null;

		if (null != property) {
			PtOwnerInfo owner = findPrimaryOwner(property.getOwners());
			if (null != owner) {
				ownerName = owner.getPropertyOwnerName();
			}
			ward = (property != null && property.getAddress() != null
					&& property.getAddress().getAdditionalDetails() != null)
							? property.getAddress().getAdditionalDetails().path("wardNumber").asText(null)
							: null;
		}

		return ScannedPlateInfo.builder().ownerName(ownerName).ward(ward).propertyId(raw.getPropertyId()).build();
	}

	private PtOwnerInfo findPrimaryOwner(List<PtOwnerInfo> owners) {
		if (CollectionUtils.isEmpty(owners)) {
			return null;
		}
		return owners.stream().filter(owner -> Boolean.TRUE.equals(owner.getIsPrimaryOwner())).findFirst()
				.orElse(owners.get(0));
	}

	/**
	 * Batch-fetches property-services Property records for the given
	 * systemPropertyIds (50 per call, matching property-services' own search
	 * convention), keyed by propertyId for lookup - same mechanism as
	 * {@code GarbageAccountService.fetchPropertiesBySystemPropertyId}, kept
	 * separate here so the dispatch feature doesn't depend on that class.
	 */
	private Map<String, PtProperty> fetchPropertiesBySystemPropertyId(RequestInfo requestInfo, String tenantId,
			List<String> systemPropertyIds) {

		if (CollectionUtils.isEmpty(systemPropertyIds) || StringUtils.isEmpty(tenantId)) {
			return Collections.emptyMap();
		}

		Map<String, PtProperty> propertyMap = new HashMap<>();
		int batchSize = 50;

		for (int i = 0; i < systemPropertyIds.size(); i += batchSize) {
			List<String> batch = systemPropertyIds.subList(i, Math.min(i + batchSize, systemPropertyIds.size()));

			StringBuilder uri = new StringBuilder(grbgConstants.getPropertyServiceHostUrl())
					.append(grbgConstants.getPropertySearchEndpoint()).append("?tenantId=").append(tenantId)
					.append("&propertyIds=").append(String.join(",", batch));

			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("RequestInfo", requestInfo);

			Object response = restCallRepository.fetchResult(uri, requestBody);
			if (null == response) {
				continue;
			}

			PtPropertyResponse propertyResponse = objectMapper.convertValue(response, PtPropertyResponse.class);
			if (null != propertyResponse && !CollectionUtils.isEmpty(propertyResponse.getProperties())) {
				propertyResponse.getProperties().forEach(property -> {
					if (StringUtils.isNotEmpty(property.getPropertyId())) {
						propertyMap.put(property.getPropertyId(), property);
					}
				});
			}
		}

		return propertyMap;
	}

	private void validateRequestInfo(RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo() || StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
