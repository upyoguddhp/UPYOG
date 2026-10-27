package org.egov.garbageservice.service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.garbageservice.model.AuditDetails;
import org.egov.garbageservice.model.DdpDispatch;
import org.egov.garbageservice.model.DdpDispatchDetail;
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
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Backs the "Create Dispatch" flow: scanning plates into a dispatch batch
 * (creating the batch on the first scan), submitting a fully-scanned batch,
 * and searching dispatch batches.
 */
@Service
public class DdpDispatchService {

	private static final String BATCH_NO_FORMAT = "DDP-%s-%s-%03d";
	private static final String BATCH_DATE_FORMAT = "ddMMyy";

	@Autowired
	private DdpDispatchRepository ddpDispatchRepository;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

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

	public DdpDispatchSearchResponse searchBatches(SearchCriteriaDdpDispatchRequest request) {

		validateRequestInfo(request.getRequestInfo());

		SearchCriteriaDdpDispatch criteria = null != request.getSearchCriteriaDdpDispatch()
				? request.getSearchCriteriaDdpDispatch()
				: SearchCriteriaDdpDispatch.builder().build();

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

	private void validateRequestInfo(org.egov.common.contract.request.RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo() || StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
