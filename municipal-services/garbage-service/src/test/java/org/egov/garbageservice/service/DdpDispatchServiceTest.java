package org.egov.garbageservice.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.response.ResponseInfo;
import java.util.HashMap;
import java.util.Map;

import org.egov.garbageservice.model.DdpDispatch;
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
import org.egov.garbageservice.model.SearchCriteriaDdpDispatchRequest;
import org.egov.garbageservice.repository.DdpDispatchRepository;
import org.egov.garbageservice.util.GrbgConstants;
import org.egov.garbageservice.util.ResponseInfoFactory;
import org.egov.garbageservice.util.RestCallRepository;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DdpDispatchServiceTest {

	@Mock
	private DdpDispatchRepository ddpDispatchRepository;

	@Mock
	private ResponseInfoFactory responseInfoFactory;

	@Mock
	private RestCallRepository restCallRepository;

	@Mock
	private GrbgConstants grbgConstants;

	@InjectMocks
	private DdpDispatchService service;

	private RequestInfo requestInfo;

	@BeforeEach
	void setUp() {
		User user = new User();
		user.setUuid("user-uuid-1");
		requestInfo = new RequestInfo();
		requestInfo.setUserInfo(user);

		when(responseInfoFactory.createResponseInfoFromRequestInfo(any(), eq(true)))
				.thenReturn(ResponseInfo.builder().status("successful").build());
	}

	private DispatchPlateLookup plate(String uuid, String ulb, String ward, String existingBatchNo,
			boolean dispatched) {
		return DispatchPlateLookup.builder().garbageAccountUuid(uuid).garbageId(1L).tenantId("hp.shimla")
				.ownerName("Ramesh Kumar").propertyId("DDP10001").ulb(ulb).ward(ward)
				.existingBatchNo(existingBatchNo).ddpDispatched(dispatched).build();
	}

	@Test
	void firstScanCreatesNewInitiatedBatch() {
		when(ddpDispatchRepository.findPlateForDispatch("plate-1"))
				.thenReturn(plate("plate-1", "SHIMLA", "Ward 1", null, false));
		when(ddpDispatchRepository.nextBatchSequence(eq("SHIMLA"), anyString())).thenReturn(1);
		when(ddpDispatchRepository.findScannedPlatesByBatchNo(anyString())).thenReturn(Collections
				.singletonList(ScannedPlateInfo.builder().ownerName("Ramesh Kumar").ward("Ward 1").propertyId("DDP10001").build()));

		DdpDispatchScanRequest request = DdpDispatchScanRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").scannedPlateUuid("plate-1").build();

		DdpDispatchScanResponse response = service.scanPlate(request);

		assertEquals("SHIMLA", response.getUlb());
		assertEquals(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED, response.getStatus());
		assertEquals(1, response.getTotalScanCount());
		assertTrue(response.getBatchNo().matches("DDP-SHIMLA-\\d{6}-\\d{3}"));
		verify(ddpDispatchRepository).insertBatch(any(DdpDispatch.class));
		verify(ddpDispatchRepository).assignPlateToBatch(eq("plate-1"), anyString());
	}

	@Test
	void subsequentScanJoinsExistingOpenBatch() {
		when(ddpDispatchRepository.findPlateForDispatch("plate-2"))
				.thenReturn(plate("plate-2", "SHIMLA", "Ward 1", null, false));
		DdpDispatch existingBatch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001")
				.ulb("SHIMLA").ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(existingBatch);
		when(ddpDispatchRepository.findScannedPlatesByBatchNo("DDP-SHIMLA-271026-001"))
				.thenReturn(Arrays.asList(ScannedPlateInfo.builder().build(), ScannedPlateInfo.builder().build()));

		DdpDispatchScanRequest request = DdpDispatchScanRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").scannedPlateUuid("plate-2").build();

		DdpDispatchScanResponse response = service.scanPlate(request);

		assertEquals("DDP-SHIMLA-271026-001", response.getBatchNo());
		assertEquals(2, response.getTotalScanCount());
		verify(ddpDispatchRepository, never()).insertBatch(any());
		verify(ddpDispatchRepository).assignPlateToBatch(eq("plate-2"), eq("DDP-SHIMLA-271026-001"));
	}

	@Test
	void scanRejectsPlateAlreadyDispatched() {
		when(ddpDispatchRepository.findPlateForDispatch("plate-3"))
				.thenReturn(plate("plate-3", "SHIMLA", "Ward 1", "DDP-SHIMLA-261026-001", true));

		DdpDispatchScanRequest request = DdpDispatchScanRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").scannedPlateUuid("plate-3").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.scanPlate(request));
		assertEquals("PLATE_ALREADY_DISPATCHED", ex.getCode());
	}

	@Test
	void scanRejectsPlateAlreadyScannedIntoABatch() {
		when(ddpDispatchRepository.findPlateForDispatch("plate-4"))
				.thenReturn(plate("plate-4", "SHIMLA", "Ward 1", "DDP-SHIMLA-271026-001", false));

		DdpDispatchScanRequest request = DdpDispatchScanRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").scannedPlateUuid("plate-4").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.scanPlate(request));
		assertEquals("PLATE_ALREADY_SCANNED", ex.getCode());
	}

	@Test
	void scanRejectsUlbMismatchAgainstOpenBatch() {
		when(ddpDispatchRepository.findPlateForDispatch("plate-5"))
				.thenReturn(plate("plate-5", "SOLAN", "Ward 2", null, false));
		DdpDispatch existingBatch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001")
				.ulb("SHIMLA").ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(existingBatch);

		DdpDispatchScanRequest request = DdpDispatchScanRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").scannedPlateUuid("plate-5").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.scanPlate(request));
		assertEquals("ULB_MISMATCH", ex.getCode());
		verify(ddpDispatchRepository, never()).assignPlateToBatch(any(), any());
	}

	@Test
	void scanRejectsWhenBatchAlreadySubmitted() {
		when(ddpDispatchRepository.findPlateForDispatch("plate-6"))
				.thenReturn(plate("plate-6", "SHIMLA", "Ward 1", null, false));
		DdpDispatch submittedBatch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001")
				.ulb("SHIMLA").ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(submittedBatch);

		DdpDispatchScanRequest request = DdpDispatchScanRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").scannedPlateUuid("plate-6").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.scanPlate(request));
		assertEquals("BATCH_NOT_OPEN", ex.getCode());
	}

	@Test
	void submitFlipsInitiatedBatchToSubmitted() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);
		when(ddpDispatchRepository.countPlatesByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(2L);
		when(ddpDispatchRepository.submitBatch(eq("DDP-SHIMLA-271026-001"), eq(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED),
				eq(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED), any(Long.class), eq("user-uuid-1"), any(Long.class)))
				.thenReturn(1);
		when(ddpDispatchRepository.findScannedPlatesByBatchNo("DDP-SHIMLA-271026-001"))
				.thenReturn(Arrays.asList(ScannedPlateInfo.builder().build(), ScannedPlateInfo.builder().build()));

		DdpDispatchSubmitRequest request = DdpDispatchSubmitRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").build();

		DdpDispatchSubmitResponse response = service.submitBatch(request);

		assertEquals(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED, response.getStatus());
		assertEquals(2, response.getTotalScanCount());
		assertEquals("SHIMLA", response.getUlb());
	}

	@Test
	void submitRejectsUnknownBatch() {
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-UNKNOWN-271026-001")).thenReturn(null);

		DdpDispatchSubmitRequest request = DdpDispatchSubmitRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-UNKNOWN-271026-001").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.submitBatch(request));
		assertEquals("BATCH_NOT_FOUND", ex.getCode());
	}

	@Test
	void submitRejectsAlreadySubmittedBatch() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);

		DdpDispatchSubmitRequest request = DdpDispatchSubmitRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.submitBatch(request));
		assertEquals("BATCH_ALREADY_SUBMITTED", ex.getCode());
		verify(ddpDispatchRepository, never()).submitBatch(any(), any(), any(), any(Long.class), any(), any(Long.class));
	}

	@Test
	void submitRejectsEmptyBatch() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);
		when(ddpDispatchRepository.countPlatesByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(0L);

		DdpDispatchSubmitRequest request = DdpDispatchSubmitRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.submitBatch(request));
		assertEquals("BATCH_EMPTY", ex.getCode());
	}

	@Test
	void submitRejectsRaceLostToAnotherSubmission() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);
		when(ddpDispatchRepository.countPlatesByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(1L);
		when(ddpDispatchRepository.submitBatch(anyString(), anyString(), anyString(), any(Long.class), anyString(),
				any(Long.class))).thenReturn(0);

		DdpDispatchSubmitRequest request = DdpDispatchSubmitRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.submitBatch(request));
		assertEquals("BATCH_ALREADY_SUBMITTED", ex.getCode());
	}

	@Test
	void searchReturnsBatchesWithScannedPlateDetails() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).build();
		when(ddpDispatchRepository.searchBatches(any())).thenReturn(Collections.singletonList(batch));
		when(ddpDispatchRepository.countBatches(any())).thenReturn(1L);
		when(ddpDispatchRepository.findScannedPlatesByBatchNo("DDP-SHIMLA-271026-001"))
				.thenReturn(Collections.singletonList(ScannedPlateInfo.builder().ownerName("Ramesh Kumar").build()));

		SearchCriteriaDdpDispatchRequest request = SearchCriteriaDdpDispatchRequest.builder().requestInfo(requestInfo)
				.build();

		DdpDispatchSearchResponse response = service.searchBatches(request);

		assertEquals(1L, response.getTotalCount());
		assertEquals(1, response.getDispatchBatches().size());
		assertEquals("DDP-SHIMLA-271026-001", response.getDispatchBatches().get(0).getBatchNo());
		assertEquals(1, response.getDispatchBatches().get(0).getTotalScanCount());
	}

	@Test
	void scanRequiresUserInfo() {
		DdpDispatchScanRequest request = DdpDispatchScanRequest.builder().requestInfo(new RequestInfo())
				.tenantId("hp.shimla").scannedPlateUuid("plate-1").build();

		assertThrows(CustomException.class, () -> service.scanPlate(request));
		verify(ddpDispatchRepository, times(0)).findPlateForDispatch(any());
	}

	@Test
	void generateQrReturnsImageForDispatchedBatch() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);
		when(grbgConstants.getDigitalDoorPlateHostUrl()).thenReturn("http://localhost:1239/digital-door-plate");
		when(grbgConstants.getDigitalDoorPlateQrGenerateEndpoint()).thenReturn("/qr/_generate");

		Map<String, Object> qrServiceResponse = new HashMap<>();
		qrServiceResponse.put("qrCodeImage", "data:image/png;base64,abc123");
		qrServiceResponse.put("encryptedData", "encrypted-payload");
		when(restCallRepository.fetchResult(any(), any())).thenReturn(qrServiceResponse);

		DdpDispatchGenerateQrRequest request = DdpDispatchGenerateQrRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").build();

		DdpDispatchGenerateQrResponse response = service.generateQrForBatch(request);

		assertEquals("DDP-SHIMLA-271026-001", response.getBatchNo());
		assertEquals("data:image/png;base64,abc123", response.getQrCodeImage());
		assertEquals("encrypted-payload", response.getEncryptedData());
	}

	@Test
	void generateQrRejectsBatchThatHasNotBeenDispatchedYet() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);

		DdpDispatchGenerateQrRequest request = DdpDispatchGenerateQrRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.generateQrForBatch(request));
		assertEquals("BATCH_NOT_DISPATCHED", ex.getCode());
		verify(restCallRepository, never()).fetchResult(any(), any());
	}

	@Test
	void generateQrRejectsUnknownBatch() {
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-UNKNOWN")).thenReturn(null);

		DdpDispatchGenerateQrRequest request = DdpDispatchGenerateQrRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-UNKNOWN").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.generateQrForBatch(request));
		assertEquals("BATCH_NOT_FOUND", ex.getCode());
	}

	@Test
	void receiveFlipsSubmittedBatchToReceived() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").dispatchDate(1793103225696L).status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);
		when(ddpDispatchRepository.receiveBatch(eq("DDP-SHIMLA-271026-001"), eq(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED),
				eq(GrbgConstants.DDP_DISPATCH_STATUS_RECEIVED), eq("Store Keeper"), any(Long.class), eq("user-uuid-1"),
				any(Long.class))).thenReturn(1);
		when(ddpDispatchRepository.findScannedPlatesByBatchNo("DDP-SHIMLA-271026-001"))
				.thenReturn(Arrays.asList(ScannedPlateInfo.builder().build(), ScannedPlateInfo.builder().build()));

		DdpDispatchReceiveRequest request = DdpDispatchReceiveRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").receivedBy("Store Keeper").build();

		DdpDispatchReceiveResponse response = service.receiveBatch(request);

		assertEquals(GrbgConstants.DDP_DISPATCH_STATUS_RECEIVED, response.getStatus());
		assertEquals("Store Keeper", response.getReceivedBy());
		assertEquals(2, response.getTotalScanCount());
		assertEquals("SHIMLA", response.getUlb());
	}

	@Test
	void receiveRejectsBatchThatHasNotBeenDispatchedYet() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_INITIATED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);

		DdpDispatchReceiveRequest request = DdpDispatchReceiveRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").receivedBy("Store Keeper").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.receiveBatch(request));
		assertEquals("BATCH_NOT_DISPATCHED", ex.getCode());
	}

	@Test
	void receiveRejectsAlreadyReceivedBatch() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_RECEIVED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);

		DdpDispatchReceiveRequest request = DdpDispatchReceiveRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").receivedBy("Store Keeper").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.receiveBatch(request));
		assertEquals("BATCH_ALREADY_RECEIVED", ex.getCode());
		verify(ddpDispatchRepository, never()).receiveBatch(any(), any(), any(), any(), any(Long.class), any(),
				any(Long.class));
	}

	@Test
	void receiveRejectsRaceLostToAnotherReceiptConfirmation() {
		DdpDispatch batch = DdpDispatch.builder().uuid("batch-uuid").batchNo("DDP-SHIMLA-271026-001").ulb("SHIMLA")
				.ward("Ward 1").status(GrbgConstants.DDP_DISPATCH_STATUS_SUBMITTED).build();
		when(ddpDispatchRepository.findBatchByBatchNo("DDP-SHIMLA-271026-001")).thenReturn(batch);
		when(ddpDispatchRepository.receiveBatch(anyString(), anyString(), anyString(), anyString(), any(Long.class),
				anyString(), any(Long.class))).thenReturn(0);

		DdpDispatchReceiveRequest request = DdpDispatchReceiveRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").receivedBy("Store Keeper").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.receiveBatch(request));
		assertEquals("BATCH_ALREADY_RECEIVED", ex.getCode());
	}

	@Test
	void receiveRequiresReceivedBy() {
		DdpDispatchReceiveRequest request = DdpDispatchReceiveRequest.builder().requestInfo(requestInfo)
				.tenantId("hp.shimla").batchNo("DDP-SHIMLA-271026-001").build();

		CustomException ex = assertThrows(CustomException.class, () -> service.receiveBatch(request));
		assertEquals("INVALID_REQUEST", ex.getCode());
		verify(ddpDispatchRepository, never()).findBatchByBatchNo(any());
	}
}
