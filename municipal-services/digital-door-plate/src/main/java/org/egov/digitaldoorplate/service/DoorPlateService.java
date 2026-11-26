package org.egov.digitaldoorplate.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.request.Role;
import org.egov.common.contract.request.RequestInfo;
import org.egov.digitaldoorplate.model.DoorPlate;
import org.egov.digitaldoorplate.model.DoorPlateActionRequest;
import org.egov.digitaldoorplate.model.DoorPlateDdpWorkflowRequest;
import org.egov.digitaldoorplate.model.DoorPlateDdpWorkflowResponse;
import org.egov.digitaldoorplate.model.DoorPlateQrSnapshot;
import org.egov.digitaldoorplate.model.DoorPlateQrVerifyRequest;
import org.egov.digitaldoorplate.model.DoorPlateQrVerifyResponse;
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

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class DoorPlateService {

	@Autowired
	private DoorPlateRepository doorPlateRepository;

	@Autowired
	private QrCodeService qrCodeService;

	@Autowired
	private GarbageAccountService garbageAccountService;

	@Autowired
	private PropertyService propertyService;

	@Autowired
	private ObjectMapper objectMapper;

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

	/**
	 * Compares the owner/property snapshot embedded in a scanned door plate QR
	 * code (captured at print time) against the current live record in
	 * property-services (looked up by the QR's PropertyID), to detect whether
	 * the record has since been updated in the system.
	 */
	public DoorPlateQrVerifyResponse verifyQrData(DoorPlateQrVerifyRequest request) {

		validateUserInfo(request.getRequestInfo());
		if (StringUtils.isEmpty(request.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory to verify the QR data.");
		}
		if (StringUtils.isEmpty(request.getData())) {
			throw new CustomException("INVALID_REQUEST", "Provide the scanned QR data to verify.");
		}

		DoorPlateQrSnapshot qrSnapshot;
		try {
			qrSnapshot = objectMapper.readValue(request.getData(), DoorPlateQrSnapshot.class);
		} catch (Exception e) {
			throw new CustomException("INVALID_QR", "Scanned QR data is not in the expected format.");
		}
		if (StringUtils.isEmpty(qrSnapshot.getPropertyId())) {
			throw new CustomException("INVALID_QR", "Scanned QR data does not contain the PropertyID.");
		}
		if (StringUtils.isEmpty(qrSnapshot.getId())) {
			throw new CustomException("INVALID_QR", "Scanned QR data does not contain the garbage account id.");
		}

		// Vendors compare the printed QR before dispatch. The receiving workflow
		// requires the batch to have been received before comparing the QR.
		if (!isVendorForTenant(request.getRequestInfo(), request.getTenantId())) {
			String batchStatus = doorPlateRepository.findDispatchBatchStatusForPlate(qrSnapshot.getId());
			if (null == batchStatus) {
				throw new CustomException("PLATE_NOT_DISPATCHED", "This plate has not been dispatched yet.");
			}
			if (!DdpConstants.DDP_DISPATCH_STATUS_RECEIVED.equals(batchStatus)) {
				throw new CustomException("BATCH_NOT_RECEIVED", "Please receive the batch first before verifying this plate.");
			}
		}

		DoorPlateQrSnapshot dbSnapshot = propertyService.buildQrSnapshot(request.getRequestInfo(),
				request.getTenantId(), qrSnapshot.getPropertyId(), qrSnapshot.getId());

		List<String> mismatchedFields = findMismatchedFields(qrSnapshot, dbSnapshot);

		return DoorPlateQrVerifyResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.dataInQr(qrSnapshot)
				.dataInDatabase(dbSnapshot)
				.isMatching(mismatchedFields.isEmpty())
				.mismatchedFields(mismatchedFields)
				.build();
	}

	private boolean isVendorForTenant(RequestInfo requestInfo, String tenantId) {
		return hasRoleForTenant(requestInfo, tenantId, DdpConstants.ROLE_DDP_PRINT_VENDOR);
	}

	private boolean isVerifierForTenant(RequestInfo requestInfo, String tenantId) {
		return hasRoleForTenant(requestInfo, tenantId, DdpConstants.ROLE_DDP_VERIFIER);
	}

	private boolean hasRoleForTenant(RequestInfo requestInfo, String tenantId, String roleCode) {
		List<Role> roles = requestInfo.getUserInfo().getRoles();
		String stateTenantId = StringUtils.substringBefore(tenantId, ".");
		return !CollectionUtils.isEmpty(roles) && roles.stream()
				.anyMatch(role -> role != null && roleCode.equals(role.getCode())
						&& (tenantId.equals(role.getTenantId()) || stateTenantId.equals(role.getTenantId())));
	}

	/**
	 * 
	 * 
	 * Single entry point for every DDP workflow role update on the garbage
	 * account identified by {@code garbageAccountUuid} (the "id" resolved
	 * from {@code /_verifyQr}): vendor print verification, vendor
	 * printing-done, vendor dispatched, ULB verification, or installation +
	 * lat/long. Each caller only sets the field(s) relevant to its own role;
	 * the rest are left null and left untouched by garbage-service's
	 * COALESCE-based partial update.
	 */
	public DoorPlateDdpWorkflowResponse updateDdpWorkflow(DoorPlateDdpWorkflowRequest request) {

		validateUserInfo(request.getRequestInfo());
		if (StringUtils.isEmpty(request.getTenantId())) {
			throw new CustomException("INVALID_REQUEST", "TenantId is mandatory.");
		}
		if (StringUtils.isEmpty(request.getGarbageAccountUuid())) {
			throw new CustomException("INVALID_REQUEST", "GarbageAccountUuid is mandatory.");
		}
		boolean isVendor = isVendorForTenant(request.getRequestInfo(), request.getTenantId());
		boolean isVerifier = isVerifierForTenant(request.getRequestInfo(), request.getTenantId());
		if (isVendor == isVerifier) {
			throw new CustomException("FORBIDDEN",
					"Logged-in user must have exactly one of the DDP_PRINT_VENDOR or DDP_VERIFIER roles for this tenant.");
		}
		String actorRole = isVendor ? DdpConstants.ACTOR_ROLE_DDP_VENDOR : DdpConstants.ACTOR_ROLE_DDP_VERIFIER;
		if (isVendor) {
			if (null != request.getInstallationDone() || StringUtils.isNotEmpty(request.getDdpLatitude())
					|| StringUtils.isNotEmpty(request.getDdpLongitude())
					|| StringUtils.isNotEmpty(request.getUlbVerificationStatus())
					|| StringUtils.isNotEmpty(request.getUlbRejectionReason())
					|| StringUtils.isNotEmpty(request.getUlbRejectionAction())) {
				throw new CustomException("INVALID_FIELD_FOR_ROLE",
						"DDP_PRINT_VENDOR may not set installationDone, ddpLatitude, ddpLongitude, "
								+ "ulbVerificationStatus, ulbRejectionReason or ulbRejectionAction.");
			}
		} else {
			if (StringUtils.isNotEmpty(request.getVendorPrintVerified())
					|| StringUtils.isNotEmpty(request.getDdpRejectionReason())
					|| StringUtils.isNotEmpty(request.getDdpRejectionAction()) || null != request.getDdpPrintingDone()
					|| null != request.getDdpDispatched() || null != request.getDdpPrintVerified()) {
				throw new CustomException("INVALID_FIELD_FOR_ROLE",
						"DDP_VERIFIER may not set vendorPrintVerified, ddpRejectionReason, ddpRejectionAction, "
								+ "ddpPrintingDone, ddpDispatched or ddpPrintVerified.");
			}
		}
		if (StringUtils.isEmpty(request.getVendorPrintVerified()) && null == request.getInstallationDone()
				&& null == request.getDdpPrintingDone() && null == request.getDdpDispatched()
				&& null == request.getDdpPrintVerified() && StringUtils.isEmpty(request.getUlbVerificationStatus())) {
			throw new CustomException("INVALID_REQUEST",
					"Provide at least one of vendorPrintVerified, installationDone, ddpPrintingDone, "
							+ "ddpPrintVerified, ddpDispatched or ulbVerificationStatus to update.");
		}
		if (StringUtils.isNotEmpty(request.getVendorPrintVerified())
				&& !(DdpConstants.VENDOR_PRINT_VERIFIED_STATUS_VERIFIED
						.equalsIgnoreCase(request.getVendorPrintVerified())
						|| DdpConstants.VENDOR_PRINT_VERIFIED_STATUS_REJECTED
								.equalsIgnoreCase(request.getVendorPrintVerified()))) {
			throw new CustomException("INVALID_REQUEST", "vendorPrintVerified must be VERIFIED or REJECTED.");
		}
		if (StringUtils.isNotEmpty(request.getUlbVerificationStatus())
				&& !(DdpConstants.VENDOR_PRINT_VERIFIED_STATUS_VERIFIED
						.equalsIgnoreCase(request.getUlbVerificationStatus())
						|| DdpConstants.VENDOR_PRINT_VERIFIED_STATUS_REJECTED
								.equalsIgnoreCase(request.getUlbVerificationStatus()))) {
			throw new CustomException("INVALID_REQUEST", "ulbVerificationStatus must be VERIFIED or REJECTED.");
		}

		if ("REJECTED".equalsIgnoreCase(request.getVendorPrintVerified())) {
			if (!("REPRINT".equals(request.getDdpRejectionAction()) || "REVALIDATE".equals(request.getDdpRejectionAction()))) {
				throw new CustomException("INVALID_REQUEST", "REJECTED requires ddpRejectionAction REPRINT or REVALIDATE.");
			}
		} else if (request.getDdpRejectionAction() != null) {
			throw new CustomException("INVALID_REQUEST", "ddpRejectionAction requires vendorPrintVerified REJECTED.");
		}
		if ("REJECTED".equalsIgnoreCase(request.getUlbVerificationStatus())) {
			if (!("REPRINT".equals(request.getUlbRejectionAction()) || "REVALIDATE".equals(request.getUlbRejectionAction()))) {
				throw new CustomException("INVALID_REQUEST", "REJECTED requires ulbRejectionAction REPRINT or REVALIDATE.");
			}
		} else if (request.getUlbRejectionAction() != null) {
			throw new CustomException("INVALID_REQUEST", "ulbRejectionAction requires ulbVerificationStatus REJECTED.");
		}
		if (null != request.getInstallationDone()
				&& (StringUtils.isEmpty(request.getDdpLatitude()) || StringUtils.isEmpty(request.getDdpLongitude()))) {
			throw new CustomException("INVALID_REQUEST",
					"ddpLatitude and ddpLongitude are mandatory to record installation.");
		}

		java.util.Map<String, Object> saved = garbageAccountService.updateDdpWorkflowFields(request.getRequestInfo(), request.getTenantId(),
				request.getGarbageAccountUuid(), actorRole, request.getVendorPrintVerified(),
				request.getInstallationDone(), request.getDdpLatitude(), request.getDdpLongitude(),
				request.getDdpPrintingDone(), request.getDdpDispatched(), request.getDdpPrintVerified(),
				request.getDdpRejectionReason(), request.getDdpRejectionAction(), request.getUlbVerificationStatus(),
				request.getUlbRejectionReason(), request.getUlbRejectionAction());

		return DoorPlateDdpWorkflowResponse.builder()
				.responseInfo(responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true))
				.garbageAccountUuid(request.getGarbageAccountUuid())
				.vendorPrintVerified((String) saved.get("vendorPrintVerified"))
				.ulbVerified((Boolean) saved.get("ulbVerified"))
				.installationDone((Boolean) saved.get("installationDone"))
				.ddpLatitude((String) saved.get("ddpLatitude"))
				.ddpLongitude((String) saved.get("ddpLongitude"))
				.ddpPrintingDone((Boolean) saved.get("ddpPrintingDone"))
				.ddpDispatched((Boolean) saved.get("ddpDispatched"))
				.ddpRejectionAction((String) saved.get("ddpRejectionAction"))
				.ddpPrintVerified((Boolean) saved.get("ddpPrintVerified"))
				.isDdpVerified((Boolean) saved.get("isDdpVerified"))
				.isReadyForPrinting((Boolean) saved.get("isReadyForPrinting"))
				.reprintCount((Integer) saved.get("reprintCount"))
				.revalidateCount((Integer) saved.get("revalidateCount"))
				.ddpRejectionReason((String) saved.get("ddpRejectionReason"))
				.ulbVerificationStatus((String) saved.get("ulbVerificationStatus"))
				.ulbRejectionReason((String) saved.get("ulbRejectionReason"))
				.ulbRejectionAction((String) saved.get("ulbRejectionAction"))
				.build();
	}

	private List<String> findMismatchedFields(DoorPlateQrSnapshot qrSnapshot, DoorPlateQrSnapshot dbSnapshot) {
		List<String> mismatched = new ArrayList<>();
		if (!fieldsEqual(qrSnapshot.getOwnerName(), dbSnapshot.getOwnerName())) {
			mismatched.add("OwnerName");
		}
		if (!fieldsEqual(qrSnapshot.getMobileNo(), dbSnapshot.getMobileNo())) {
			mismatched.add("MobileNo");
		}
		if (!fieldsEqual(qrSnapshot.getPropertyId(), dbSnapshot.getPropertyId())) {
			mismatched.add("PropertyID");
		}
		if (!fieldsEqual(qrSnapshot.getUlbName(), dbSnapshot.getUlbName())) {
			mismatched.add("ulbName");
		}
		if (!fieldsEqual(qrSnapshot.getWard(), dbSnapshot.getWard())) {
			mismatched.add("Ward");
		}
		if (!fieldsEqual(qrSnapshot.getAddress(), dbSnapshot.getAddress())) {
			mismatched.add("Address");
		}
		return mismatched;
	}

	private boolean fieldsEqual(String a, String b) {
		return StringUtils.isEmpty(a) ? StringUtils.isEmpty(b) : a.trim().equalsIgnoreCase(null == b ? "" : b.trim());
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

	public org.egov.digitaldoorplate.model.DdpStatusCountResponse getDdpStatusCounts(
			org.egov.digitaldoorplate.model.DdpStatusCountRequest request) {
		validateUserInfo(request.getRequestInfo());
		org.egov.digitaldoorplate.model.DdpStatusCountResponse response = doorPlateRepository
				.getDdpStatusCounts(request.getUlb());
		response.setResponseInfo(
				responseInfoFactory.createResponseInfoFromRequestInfo(request.getRequestInfo(), true));
		return response;
	}
}
