package org.egov.digitaldoorplate.service;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.digitaldoorplate.model.GarbageCollection;
import org.egov.digitaldoorplate.model.GarbageCollectionRequest;
import org.egov.digitaldoorplate.model.GarbageCollectionResponse;
import org.egov.digitaldoorplate.model.GarbageCollectionSyncResponse;
import org.egov.digitaldoorplate.model.QrCodeData;
import org.egov.digitaldoorplate.model.QrScanRequest;
import org.egov.digitaldoorplate.model.QrScanResponse;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollection;
import org.egov.digitaldoorplate.model.SearchCriteriaGarbageCollectionRequest;
import org.egov.digitaldoorplate.model.SyncBatch;
import org.egov.digitaldoorplate.model.SyncRecordResult;
import org.egov.digitaldoorplate.producer.DdpProducer;
import org.egov.digitaldoorplate.repository.GarbageCollectionRepository;
import org.egov.digitaldoorplate.repository.SyncBatchRepository;
import org.egov.digitaldoorplate.util.DdpConstants;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GarbageCollectionService {

	@Autowired
	private GarbageCollectionRepository garbageCollectionRepository;

	@Autowired
	private GarbageAccountService garbageAccountService;

	@Autowired
	private QrCodeService qrCodeService;

	@Autowired
	private SyncBatchRepository syncBatchRepository;

	@Autowired
	private DdpProducer ddpProducer;

	@Autowired
	private DdpConstants ddpConfig;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	/**
	 * Decrypts the QR code scanned on the door plate, resolves the garbage
	 * account from garbage-service and returns the account details along with
	 * today's collection status for that account.
	 */
	public QrScanResponse scanQrCode(QrScanRequest qrScanRequest) {

		if (StringUtils.isEmpty(qrScanRequest.getScannedData())) {
			throw new CustomException("INVALID_QR", "Scanned QR data is empty.");
		}
		if (StringUtils.isEmpty(qrScanRequest.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory to scan the QR code.");
		}

		QrCodeData qrCodeData = qrCodeService.parseQrCodeData(qrScanRequest.getScannedData());

		if (StringUtils.isEmpty(qrCodeData.getId())) {
			throw new CustomException("INVALID_QR", "Scanned QR data does not contain the garbage account id.");
		}

		Map<String, Object> garbageSearchResponse = garbageAccountService.searchGarbageAccountByUuid(
				qrScanRequest.getRequestInfo(), qrScanRequest.getTenantId(), qrCodeData.getId());

		Object garbageAccounts = garbageSearchResponse.get("garbageAccounts");
		if (null == garbageAccounts || (garbageAccounts instanceof List && ((List<?>) garbageAccounts).isEmpty())) {
			throw new CustomException("GARBAGE_ACCOUNT_NOT_FOUND",
					"No active garbage account found for the scanned QR code.");
		}

		List<GarbageCollection> todaysCollections = garbageCollectionRepository
				.search(SearchCriteriaGarbageCollection.builder()
						.garbageAccountUuid(Collections.singletonList(qrCodeData.getId()))
						.tenantId(qrScanRequest.getTenantId())
						.fromDate(getStartOfDay())
						.isActive(Boolean.TRUE)
						.build());

		return QrScanResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(qrScanRequest.getRequestInfo(), true))
				.qrData(qrCodeData)
				.garbageAccounts(garbageAccounts)
				.alreadyCollectedToday(!CollectionUtils.isEmpty(todaysCollections))
				.todaysCollections(todaysCollections)
				.build();
	}

	/**
	 * Validates and enriches the collection records and publishes them to
	 * kafka; the actual DB write happens asynchronously in
	 * GarbageCollectionPersistConsumer so the API stays fast during the
	 * morning collection peak across all ULBs.
	 */
	public GarbageCollectionResponse create(GarbageCollectionRequest garbageCollectionRequest) {

		validateCreateRequest(garbageCollectionRequest);

		Long now = System.currentTimeMillis();
		String userUuid = garbageCollectionRequest.getRequestInfo().getUserInfo().getUuid();

		garbageCollectionRequest.getGarbageCollections().forEach(garbageCollection -> {
			garbageCollection.setUuid(UUID.randomUUID().toString());
			if (StringUtils.isEmpty(garbageCollection.getStaffUuid())) {
				garbageCollection.setStaffUuid(userUuid);
			}
			if (null == garbageCollection.getIsCollected()) {
				garbageCollection.setIsCollected(Boolean.TRUE);
			}
			if (null == garbageCollection.getAppliedToAllTenants()) {
				garbageCollection.setAppliedToAllTenants(Boolean.FALSE);
			}
			if (null == garbageCollection.getCollectionTime()) {
				garbageCollection.setCollectionTime(now);
			}
			garbageCollection.setIsActive(Boolean.TRUE);
			garbageCollection.setCreatedBy(userUuid);
			garbageCollection.setCreatedDate(now);
			garbageCollection.setLastModifiedBy(userUuid);
			garbageCollection.setLastModifiedDate(now);
		});

		ddpProducer.push(ddpConfig.getSaveGarbageCollectionTopic(), garbageCollectionRequest);

		return GarbageCollectionResponse.builder()
				.responseInfo(responseInfoFactory
						.createResponseInfoFromRequestInfo(garbageCollectionRequest.getRequestInfo(), true))
				.garbageCollections(garbageCollectionRequest.getGarbageCollections()).build();
	}

	@Transactional
	public GarbageCollectionResponse update(GarbageCollectionRequest garbageCollectionRequest) {

		if (CollectionUtils.isEmpty(garbageCollectionRequest.getGarbageCollections())) {
			throw new CustomException("INVALID_REQUEST", "Provide garbage collection details to update.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = garbageCollectionRequest.getRequestInfo().getUserInfo().getUuid();

		garbageCollectionRequest.getGarbageCollections().forEach(garbageCollection -> {
			if (StringUtils.isEmpty(garbageCollection.getUuid())) {
				throw new CustomException("INVALID_REQUEST", "Uuid is mandatory to update garbage collection details.");
			}

			List<GarbageCollection> existingCollections = garbageCollectionRepository
					.search(SearchCriteriaGarbageCollection.builder()
							.uuid(Collections.singletonList(garbageCollection.getUuid())).build());
			if (CollectionUtils.isEmpty(existingCollections)) {
				throw new CustomException("COLLECTION_NOT_FOUND",
						"No garbage collection record found for uuid: " + garbageCollection.getUuid());
			}

			if (null == garbageCollection.getIsActive()) {
				garbageCollection.setIsActive(existingCollections.get(0).getIsActive());
			}
			if (null == garbageCollection.getCollectionTime()) {
				garbageCollection.setCollectionTime(existingCollections.get(0).getCollectionTime());
			}
			if (null == garbageCollection.getLatitude()) {
				garbageCollection.setLatitude(existingCollections.get(0).getLatitude());
			}
			if (null == garbageCollection.getLongitude()) {
				garbageCollection.setLongitude(existingCollections.get(0).getLongitude());
			}
			if (null == garbageCollection.getAdditionalDetails()) {
				garbageCollection.setAdditionalDetails(existingCollections.get(0).getAdditionalDetails());
			}
			garbageCollection.setLastModifiedBy(userUuid);
			garbageCollection.setLastModifiedDate(now);

			garbageCollectionRepository.update(garbageCollection);
		});

		return GarbageCollectionResponse.builder()
				.responseInfo(responseInfoFactory
						.createResponseInfoFromRequestInfo(garbageCollectionRequest.getRequestInfo(), true))
				.garbageCollections(garbageCollectionRequest.getGarbageCollections()).build();
	}

	public GarbageCollectionResponse search(SearchCriteriaGarbageCollectionRequest searchRequest) {

		SearchCriteriaGarbageCollection criteria = searchRequest.getSearchCriteriaGarbageCollection();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search garbage collections.");
		}

		List<GarbageCollection> garbageCollections = garbageCollectionRepository.search(criteria);

		return GarbageCollectionResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(),
						true))
				.garbageCollections(garbageCollections).build();
	}

	/**
	 * Processes the offline collection file synced from the garbage collector's
	 * mobile device (scheduled every 5 minutes on the app). Each record carries
	 * a device generated clientRefId which is used to deduplicate re-sent
	 * records, so the same file can be synced safely more than once. Records
	 * are processed independently — one bad record does not fail the batch —
	 * and a per record result is returned so the app can clear its local queue.
	 */
	public GarbageCollectionSyncResponse sync(GarbageCollectionRequest syncRequest) {

		if (null == syncRequest.getRequestInfo() || null == syncRequest.getRequestInfo().getUserInfo()
				|| StringUtils.isEmpty(syncRequest.getRequestInfo().getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
		if (CollectionUtils.isEmpty(syncRequest.getGarbageCollections())) {
			throw new CustomException("INVALID_REQUEST", "Provide garbage collection records to sync.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = syncRequest.getRequestInfo().getUserInfo().getUuid();
		String syncBatchUuid = UUID.randomUUID().toString();

		// one query to find the already synced clientRefIds of this batch
		List<String> clientRefIds = syncRequest.getGarbageCollections().stream()
				.map(GarbageCollection::getClientRefId).filter(StringUtils::isNotEmpty).collect(Collectors.toList());
		Set<String> existingClientRefIds = new HashSet<>();
		if (!clientRefIds.isEmpty()) {
			existingClientRefIds = garbageCollectionRepository
					.search(SearchCriteriaGarbageCollection.builder().clientRefId(clientRefIds).build()).stream()
					.map(GarbageCollection::getClientRefId).collect(Collectors.toSet());
		}

		List<SyncRecordResult> recordResults = new ArrayList<>();
		List<GarbageCollection> queuedRecords = new ArrayList<>();
		int created = 0, duplicate = 0, failed = 0;

		for (GarbageCollection garbageCollection : syncRequest.getGarbageCollections()) {
			try {
				if (StringUtils.isEmpty(garbageCollection.getClientRefId())) {
					throw new CustomException("INVALID_REQUEST",
							"ClientRefId is mandatory in every offline synced record.");
				}
				if (existingClientRefIds.contains(garbageCollection.getClientRefId())) {
					duplicate++;
					recordResults.add(SyncRecordResult.builder().clientRefId(garbageCollection.getClientRefId())
							.status(DdpConstants.SYNC_STATUS_DUPLICATE).build());
					continue;
				}
				if (StringUtils.isEmpty(garbageCollection.getTenantId())) {
					throw new CustomException("INVALID_REQUEST",
							"TenantId is mandatory in garbage collection details.");
				}
				if (StringUtils.isEmpty(garbageCollection.getGarbageAccountUuid())) {
					throw new CustomException("INVALID_REQUEST",
							"GarbageAccountUuid is mandatory in garbage collection details.");
				}

				garbageCollection.setUuid(UUID.randomUUID().toString());
				garbageCollection.setSyncBatchUuid(syncBatchUuid);
				if (StringUtils.isEmpty(garbageCollection.getStaffUuid())) {
					garbageCollection.setStaffUuid(userUuid);
				}
				if (null == garbageCollection.getIsCollected()) {
					garbageCollection.setIsCollected(Boolean.TRUE);
				}
				if (null == garbageCollection.getAppliedToAllTenants()) {
					garbageCollection.setAppliedToAllTenants(Boolean.FALSE);
				}
				// collectionTime is the scan time recorded on the device, not
				// the sync time
				if (null == garbageCollection.getCollectionTime()) {
					garbageCollection.setCollectionTime(now);
				}
				garbageCollection.setIsActive(Boolean.TRUE);
				garbageCollection.setCreatedBy(userUuid);
				garbageCollection.setCreatedDate(now);
				garbageCollection.setLastModifiedBy(userUuid);
				garbageCollection.setLastModifiedDate(now);

				queuedRecords.add(garbageCollection);
				existingClientRefIds.add(garbageCollection.getClientRefId());

				created++;
				recordResults.add(SyncRecordResult.builder().clientRefId(garbageCollection.getClientRefId())
						.uuid(garbageCollection.getUuid()).status(DdpConstants.SYNC_STATUS_QUEUED).build());
			} catch (Exception e) {
				log.error("Failed to sync garbage collection record with clientRefId {}.",
						garbageCollection.getClientRefId(), e);
				failed++;
				recordResults.add(SyncRecordResult.builder().clientRefId(garbageCollection.getClientRefId())
						.status(DdpConstants.SYNC_STATUS_FAILED).errorMessage(e.getMessage()).build());
			}
		}

		// accepted records go to kafka in one message; the consumer persists
		// them with the DB unique index on client_ref_id as the final
		// duplicate guard
		if (!queuedRecords.isEmpty()) {
			ddpProducer.push(ddpConfig.getSaveGarbageCollectionTopic(), GarbageCollectionRequest.builder()
					.requestInfo(syncRequest.getRequestInfo()).garbageCollections(queuedRecords).build());
		}

		syncBatchRepository.create(SyncBatch.builder()
				.uuid(syncBatchUuid)
				.tenantId(syncRequest.getGarbageCollections().get(0).getTenantId())
				.staffUuid(userUuid)
				.totalRecords(syncRequest.getGarbageCollections().size())
				.createdRecords(created)
				.duplicateRecords(duplicate)
				.failedRecords(failed)
				.syncTime(now)
				.createdBy(userUuid)
				.createdDate(now)
				.build());

		return GarbageCollectionSyncResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(syncRequest.getRequestInfo(), true))
				.syncBatchUuid(syncBatchUuid)
				.totalRecords(syncRequest.getGarbageCollections().size())
				.createdRecords(created)
				.duplicateRecords(duplicate)
				.failedRecords(failed)
				.recordResults(recordResults)
				.build();
	}

	private void validateCreateRequest(GarbageCollectionRequest garbageCollectionRequest) {

		if (null == garbageCollectionRequest.getRequestInfo()
				|| null == garbageCollectionRequest.getRequestInfo().getUserInfo()
				|| StringUtils.isEmpty(garbageCollectionRequest.getRequestInfo().getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
		if (CollectionUtils.isEmpty(garbageCollectionRequest.getGarbageCollections())) {
			throw new CustomException("INVALID_REQUEST", "Provide garbage collection details to submit.");
		}

		garbageCollectionRequest.getGarbageCollections().forEach(garbageCollection -> {
			if (StringUtils.isEmpty(garbageCollection.getTenantId())) {
				throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in garbage collection details.");
			}
			if (StringUtils.isEmpty(garbageCollection.getGarbageAccountUuid())) {
				throw new CustomException("INVALID_REQUEST",
						"GarbageAccountUuid is mandatory in garbage collection details.");
			}
		});
	}

	private Long getStartOfDay() {
		ZoneId zone = ZoneId.of(DdpConstants.TIMEZONE);
		return ZonedDateTime.now(zone).toLocalDate().atStartOfDay(zone).toInstant().toEpochMilli();
	}
}
