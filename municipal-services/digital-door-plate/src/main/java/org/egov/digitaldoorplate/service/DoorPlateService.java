package org.egov.digitaldoorplate.service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.digitaldoorplate.model.DoorPlate;
import org.egov.digitaldoorplate.model.DoorPlateActionRequest;
import org.egov.digitaldoorplate.model.DoorPlateRequest;
import org.egov.digitaldoorplate.model.DoorPlateResponse;
import org.egov.digitaldoorplate.model.QrCodeData;
import org.egov.digitaldoorplate.model.SearchCriteriaDoorPlate;
import org.egov.digitaldoorplate.model.SearchCriteriaDoorPlateRequest;
import org.egov.digitaldoorplate.repository.DoorPlateRepository;
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
public class DoorPlateService {

	@Autowired
	private DoorPlateRepository doorPlateRepository;

	@Autowired
	private QrCodeService qrCodeService;

	@Autowired
	private ResponseInfoFactory responseInfoFactory;

	/**
	 * Stage 1 (ULB official): records that the QR code has been generated
	 * against the garbage id/account. Skips accounts which already have an
	 * active door plate and returns the existing record for them.
	 */
	@Transactional
	public DoorPlateResponse generate(DoorPlateRequest doorPlateRequest) {

		validateUserInfo(doorPlateRequest.getRequestInfo());
		if (CollectionUtils.isEmpty(doorPlateRequest.getDoorPlates())) {
			throw new CustomException("INVALID_REQUEST", "Provide door plate details to mark QR generation.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = doorPlateRequest.getRequestInfo().getUserInfo().getUuid();

		List<DoorPlate> result = doorPlateRequest.getDoorPlates().stream().map(doorPlate -> {
			if (StringUtils.isEmpty(doorPlate.getTenantId())) {
				throw new CustomException("INVALID_REQUEST", "TenantId is mandatory in door plate details.");
			}
			if (StringUtils.isEmpty(doorPlate.getGarbageAccountUuid())) {
				throw new CustomException("INVALID_REQUEST", "GarbageAccountUuid is mandatory in door plate details.");
			}

			List<DoorPlate> existingPlates = doorPlateRepository.search(SearchCriteriaDoorPlate.builder()
					.garbageAccountUuid(Collections.singletonList(doorPlate.getGarbageAccountUuid()))
					.tenantId(doorPlate.getTenantId()).isActive(Boolean.TRUE).build());
			if (!CollectionUtils.isEmpty(existingPlates)) {
				return existingPlates.get(0);
			}

			doorPlate.setUuid(UUID.randomUUID().toString());
			doorPlate.setPlateStatus(DdpConstants.PLATE_STATUS_QR_GENERATED);
			doorPlate.setIsQrGenerated(Boolean.TRUE);
			doorPlate.setQrGeneratedTime(now);
			doorPlate.setQrGeneratedBy(userUuid);
			doorPlate.setIsPrintVerified(Boolean.FALSE);
			doorPlate.setIsInstalled(Boolean.FALSE);
			doorPlate.setIsActive(Boolean.TRUE);
			doorPlate.setCreatedBy(userUuid);
			doorPlate.setCreatedDate(now);
			doorPlate.setLastModifiedBy(userUuid);
			doorPlate.setLastModifiedDate(now);

			doorPlateRepository.create(doorPlate);
			return doorPlate;
		}).collect(Collectors.toList());

		return DoorPlateResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(doorPlateRequest.getRequestInfo(), true))
				.doorPlates(result).build();
	}

	/**
	 * Stage 2 (ULB official): after printing, the official scans the QR code
	 * and confirms the printed data is correct. Longitude and latitude of the
	 * verification are captured.
	 */
	public DoorPlateResponse verifyPrint(DoorPlateActionRequest actionRequest) {

		DoorPlate doorPlate = resolveDoorPlate(actionRequest);

		if (!Boolean.TRUE.equals(doorPlate.getIsQrGenerated())) {
			throw new CustomException("INVALID_PLATE_STATUS",
					"QR code is not yet generated for this garbage account.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = actionRequest.getRequestInfo().getUserInfo().getUuid();

		doorPlate.setPlateStatus(DdpConstants.PLATE_STATUS_PRINT_VERIFIED);
		doorPlate.setIsPrintVerified(Boolean.TRUE);
		doorPlate.setPrintVerifiedTime(now);
		doorPlate.setPrintVerifiedBy(userUuid);
		doorPlate.setVerificationLatitude(actionRequest.getLatitude());
		doorPlate.setVerificationLongitude(actionRequest.getLongitude());
		if (StringUtils.isNotEmpty(actionRequest.getRemarks())) {
			doorPlate.setRemarks(actionRequest.getRemarks());
		}
		doorPlate.setLastModifiedBy(userUuid);
		doorPlate.setLastModifiedDate(now);

		doorPlateRepository.verifyPrint(doorPlate);

		return DoorPlateResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(actionRequest.getRequestInfo(), true))
				.doorPlates(Collections.singletonList(doorPlate)).build();
	}

	/**
	 * Stage 3 (ULB official): the QR plate is installed on the household.
	 * Longitude and latitude of the installed plate are captured.
	 */
	public DoorPlateResponse install(DoorPlateActionRequest actionRequest) {

		DoorPlate doorPlate = resolveDoorPlate(actionRequest);

		if (!Boolean.TRUE.equals(doorPlate.getIsPrintVerified())) {
			throw new CustomException("INVALID_PLATE_STATUS",
					"Printed QR code is not yet verified for this garbage account.");
		}

		Long now = System.currentTimeMillis();
		String userUuid = actionRequest.getRequestInfo().getUserInfo().getUuid();

		doorPlate.setPlateStatus(DdpConstants.PLATE_STATUS_INSTALLED);
		doorPlate.setIsInstalled(Boolean.TRUE);
		doorPlate.setInstalledTime(now);
		doorPlate.setInstalledBy(userUuid);
		doorPlate.setInstallationLatitude(actionRequest.getLatitude());
		doorPlate.setInstallationLongitude(actionRequest.getLongitude());
		if (StringUtils.isNotEmpty(actionRequest.getRemarks())) {
			doorPlate.setRemarks(actionRequest.getRemarks());
		}
		doorPlate.setLastModifiedBy(userUuid);
		doorPlate.setLastModifiedDate(now);

		doorPlateRepository.install(doorPlate);

		return DoorPlateResponse.builder()
				.responseInfo(
						responseInfoFactory.createResponseInfoFromRequestInfo(actionRequest.getRequestInfo(), true))
				.doorPlates(Collections.singletonList(doorPlate)).build();
	}

	public DoorPlateResponse search(SearchCriteriaDoorPlateRequest searchRequest) {

		SearchCriteriaDoorPlate criteria = searchRequest.getSearchCriteriaDoorPlate();
		if (null == criteria) {
			throw new CustomException("INVALID_SEARCH", "Provide search criteria to search door plates.");
		}

		List<DoorPlate> doorPlates = doorPlateRepository.search(criteria);

		return DoorPlateResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(searchRequest.getRequestInfo(),
						true))
				.doorPlates(doorPlates).build();
	}

	/**
	 * Resolves the door plate for the verify/install action from either the
	 * scanned QR payload or an explicit garbageAccountUuid. Latitude and
	 * longitude are mandatory for both actions.
	 */
	private DoorPlate resolveDoorPlate(DoorPlateActionRequest actionRequest) {

		validateUserInfo(actionRequest.getRequestInfo());

		if (StringUtils.isEmpty(actionRequest.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory.");
		}
		if (null == actionRequest.getLatitude() || null == actionRequest.getLongitude()) {
			throw new CustomException("INVALID_REQUEST",
					"Latitude and longitude are mandatory for door plate verification and installation.");
		}

		String garbageAccountUuid = actionRequest.getGarbageAccountUuid();
		if (StringUtils.isEmpty(garbageAccountUuid)) {
			if (StringUtils.isEmpty(actionRequest.getScannedData())) {
				throw new CustomException("INVALID_REQUEST",
						"Provide either scannedData or garbageAccountUuid to identify the door plate.");
			}
			QrCodeData qrCodeData = qrCodeService.parseQrCodeData(actionRequest.getScannedData());
			if (StringUtils.isEmpty(qrCodeData.getId())) {
				throw new CustomException("INVALID_QR", "Scanned QR data does not contain the garbage account id.");
			}
			garbageAccountUuid = qrCodeData.getId();
		}

		List<DoorPlate> doorPlates = doorPlateRepository.search(SearchCriteriaDoorPlate.builder()
				.garbageAccountUuid(Collections.singletonList(garbageAccountUuid))
				.tenantId(actionRequest.getTenantId()).isActive(Boolean.TRUE).build());

		if (CollectionUtils.isEmpty(doorPlates)) {
			throw new CustomException("DOOR_PLATE_NOT_FOUND",
					"No door plate found for the garbage account. Generate the QR code first.");
		}

		return doorPlates.get(0);
	}

	private void validateUserInfo(org.egov.common.contract.request.RequestInfo requestInfo) {
		if (null == requestInfo || null == requestInfo.getUserInfo()
				|| StringUtils.isEmpty(requestInfo.getUserInfo().getUuid())) {
			throw new CustomException("INVALID_REQUEST", "UserInfo is missing in the RequestInfo.");
		}
	}
}
