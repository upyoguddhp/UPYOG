package org.egov.ptr.service;

<<<<<<< HEAD
import java.util.Collections;
import java.util.HashMap;
=======
import static org.egov.ptr.util.PTRConstants.ACTION_APPROVE;
import static org.egov.ptr.util.PTRConstants.ACTION_REJECT;
import static org.egov.ptr.util.PTRConstants.ACTION_VERIFY;
import static org.egov.ptr.util.PTRConstants.NEW_PET_APPLICATION;
import static org.egov.ptr.util.PTRConstants.RENEW_PET_APPLICATION;
import static org.egov.ptr.util.PTRConstants.STATUS_APPLIED;
import static org.egov.ptr.util.PTRConstants.STATUS_APPROVED;
import static org.egov.ptr.util.PTRConstants.STATUS_DOCVERIFIED;
import static org.egov.ptr.util.PTRConstants.STATUS_REJECTED;

>>>>>>> niua-upstream/niua-dev-2.0
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

<<<<<<< HEAD
import org.apache.commons.lang3.BooleanUtils;
=======
import org.egov.common.contract.request.RequestInfo;
>>>>>>> niua-upstream/niua-dev-2.0
import org.egov.ptr.config.PetConfiguration;
import org.egov.ptr.models.Address;
import org.egov.ptr.models.AuditDetails;
import org.egov.ptr.models.PetDetails;
import org.egov.ptr.models.PetRegistrationApplication;
import org.egov.ptr.models.PetRegistrationRequest;
<<<<<<< HEAD
import org.egov.ptr.util.PTRConstants;
import org.egov.ptr.util.PetUtil;
import org.egov.tracer.model.CustomException;
=======
import org.egov.ptr.models.PetRenewalAuditDetails;
import org.egov.ptr.util.CommonUtils;
>>>>>>> niua-upstream/niua-dev-2.0
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import lombok.extern.slf4j.Slf4j;



/**
 * Service class responsible for enriching pet registration applications with necessary data
 * such as application number, audit details, address, and pet details before processing.
 */
@Slf4j
@Service
public class EnrichmentService {

	@Autowired
	private PetConfiguration config;

	@Autowired
	private CommonUtils commonUtils;

	/**
	 * Enriches the pet registration application by assigning unique IDs, application numbers,
	 * and setting audit details.
	 *
	 * @param petRegistrationRequest The request containing pet registration applications.
	 */
	public void enrichPetApplication(PetRegistrationRequest petRegistrationRequest) {
		RequestInfo requestInfo = petRegistrationRequest.getRequestInfo();
		List<PetRegistrationApplication> applications = petRegistrationRequest.getPetRegistrationApplications();
		String tenantId = applications.get(0).getTenantId();

<<<<<<< HEAD
			AuditDetails auditDetails = AuditDetails.builder()
					.createdBy(petRegistrationRequest.getRequestInfo().getUserInfo().getUuid())
					.createdTime(System.currentTimeMillis())
					.lastModifiedBy(petRegistrationRequest.getRequestInfo().getUserInfo().getUuid())
					.lastModifiedTime(System.currentTimeMillis()).build();
			application.setAuditDetails(auditDetails); // Enrich audit details
			application.setId(UUID.randomUUID().toString()); // Enrich UUID
			application.setStatus(PTRConstants.APPLICATION_STATUS_INITIATED);
			application.getAddress().setRegistrationId(application.getId()); // Enrich registration Id
			application.getAddress().setId(UUID.randomUUID().toString()); // Enrich address UUID
			application.getPetDetails().setPetDetailsId(application.getId());
			application.getPetDetails().setId(UUID.randomUUID().toString()); // Enrich petDetails UUID
			application.setApplicationNumber(makeDesiredNumber(application,petRegistrationIdList.get(index++))); // Enrich application number from															// IDgen
			if (!CollectionUtils.isEmpty(application.getDocuments()))
				application.getDocuments().forEach(doc -> {
					if (doc.getId() == null) {
						doc.setId(UUID.randomUUID().toString());
						doc.setActive(true);
						doc.setTenantId(application.getTenantId());
						doc.setAuditDetails(application.getAuditDetails());
=======
		// Generate a list of application numbers using ID generator
		List<String> petRegistrationIdList = commonUtils.getIdList(requestInfo, tenantId, config.getPetIdGenName(),
				config.getPetIdGenFormat(), applications.size());
>>>>>>> niua-upstream/niua-dev-2.0

		// Prepare audit details once (can be reused across applications)
		AuditDetails commonAuditDetails = AuditDetails.builder().createdBy(requestInfo.getUserInfo().getUuid())
				.createdTime(System.currentTimeMillis()).lastModifiedBy(requestInfo.getUserInfo().getUuid())
				.lastModifiedTime(System.currentTimeMillis()).build();

		long validityDateUnix = commonUtils.calculateNextMarch31InEpoch();

		int index = 0;
		for (PetRegistrationApplication application : applications) {

			// Set common audit details, ID, and application number
			application.setAuditDetails(commonAuditDetails);
			application.setId(UUID.randomUUID().toString());
			application.setApplicationNumber(petRegistrationIdList.get(index++));
			application.setValidityDate(validityDateUnix);
			application.setExpireFlag(false);

			// Enrich address and pet details
			enrichAddress(application);
			enrichPetDetails(application);

			if (isRenewPetApplication(application)) {
				enrichRenewalDetails(application, validityDateUnix);
			}

			// Enrich documents if any
			if (!CollectionUtils.isEmpty(application.getDocuments())) {
				enrichDocuments(application);
			}
		}
	}
	
	private String makeDesiredNumber(PetRegistrationApplication petregistrationApplication,String ApplicationNumber) {
		
		String ulbName = null;
		if(null == petregistrationApplication.getAdditionalDetail().get("ulbName")) {
			throw new CustomException("ULB_NAME_EMPTY","Provide the ULB name.");
		}
		else {
			ulbName = petregistrationApplication.getAdditionalDetail().get("ulbName").toString();
			ulbName = ulbName.replaceAll("^\"|\"$", "").toUpperCase();
		}
		
		ApplicationNumber = ApplicationNumber.replace("ULBNAME", ulbName);
		ApplicationNumber = ApplicationNumber.replace("VALIDITYPERIOD", getFormatOfPeriodOfPT());
        
		return ApplicationNumber;
	}
	
	private String getFormatOfPeriodOfPT() {
		  	LocalDate currentDate = LocalDate.now();

<<<<<<< HEAD
	        // Define a formatter for "MMyyyy"
	        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMyyyy");

	        // Format the current date
	        return currentDate.format(formatter);
	}


	public void enrichPetApplicationUponUpdate(PetRegistrationRequest petRegistrationRequest, PetRegistrationApplication existingApplication) {
		
		existingApplication.setWorkflow(petRegistrationRequest.getPetRegistrationApplications().get(0).getWorkflow());
		existingApplication.setIsOnlyWorkflowCall(petRegistrationRequest.getPetRegistrationApplications().get(0).getIsOnlyWorkflowCall());
		
		if(BooleanUtils.isTrue(petRegistrationRequest.getPetRegistrationApplications().get(0).getIsOnlyWorkflowCall())
				&& null != petRegistrationRequest.getPetRegistrationApplications().get(0).getWorkflow()) {
			String status = getStatusOrAction(petRegistrationRequest.getPetRegistrationApplications().get(0).getWorkflow().getAction(), false);
			petRegistrationRequest.setPetRegistrationApplications(Collections.singletonList(existingApplication));
			petRegistrationRequest.getPetRegistrationApplications().get(0).setStatus(status);
		}
		
		// Enrich in case of update
		petRegistrationRequest.getPetRegistrationApplications().get(0).setStatus(getStatusOrAction(petRegistrationRequest.getPetRegistrationApplications().get(0).getWorkflow().getAction(),true));
		petRegistrationRequest.getPetRegistrationApplications().get(0).setAuditDetails(existingApplication.getAuditDetails());
		petRegistrationRequest.getPetRegistrationApplications().get(0).getAuditDetails()
				.setLastModifiedTime(System.currentTimeMillis());
		petRegistrationRequest.getPetRegistrationApplications().get(0).getAuditDetails()
				.setLastModifiedBy(petRegistrationRequest.getRequestInfo().getUserInfo().getUuid());
		
		// enrich documents
		if(null != petRegistrationRequest.getPetRegistrationApplications()
				&& !CollectionUtils.isEmpty(petRegistrationRequest.getPetRegistrationApplications().get(0).getDocuments())) {
			petRegistrationRequest.getPetRegistrationApplications().get(0).getDocuments().stream().forEach(document -> {
				Optional.ofNullable(document.getAuditDetails()).ifPresent(auditDetails -> {
				    Optional.ofNullable(petRegistrationRequest.getRequestInfo())
				            .map(requestInfo -> requestInfo.getUserInfo())
				            .map(userInfo -> userInfo.getUuid())
				            .ifPresent(auditDetails::setLastModifiedBy);
				    
				    auditDetails.setLastModifiedTime(System.currentTimeMillis());
				});
			});
		}
	}


	public String getStatusOrAction(String action, Boolean fetchValue) {
		
		Map<String, String> map = new HashMap<>();
		
		map.put(PTRConstants.WORKFLOW_ACTION_INITIATE, PTRConstants.APPLICATION_STATUS_INITIATED);
        map.put(PTRConstants.WORKFLOW_ACTION_FORWARD_TO_VERIFIER, PTRConstants.APPLICATION_STATUS_PENDINGFORVERIFICATION);
        map.put(PTRConstants.WORKFLOW_ACTION_VERIFY, PTRConstants.APPLICATION_STATUS_PENDINGFORAPPROVAL);
        map.put(PTRConstants.WORKFLOW_ACTION_RETURN_TO_INITIATOR_FOR_PAYMENT, PTRConstants.APPLICATION_STATUS_PENDINGFORPAYMENT);
        map.put(PTRConstants.WORKFLOW_ACTION_RETURN_TO_INITIATOR, PTRConstants.APPLICATION_STATUS_PENDINGFORMODIFICATION);
        map.put(PTRConstants.WORKFLOW_ACTION_FORWARD_TO_APPROVER, PTRConstants.APPLICATION_STATUS_PENDINGFORAPPROVAL);
        map.put(PTRConstants.WORKFLOW_ACTION_APPROVE, PTRConstants.APPLICATION_STATUS_APPROVED);
		
		if(!fetchValue){
			// return key
			for (Map.Entry<String, String> entry : map.entrySet()) {
		        if (entry.getValue().equals(action)) {
		            return entry.getKey();
		        }
		    }
		}
		// return value
		return map.get(action);
=======
	/**
	 * Checks if the application is a new pet registration.
	 */
	private boolean isNewPetApplication(PetRegistrationApplication application) {
		return NEW_PET_APPLICATION.equals(application.getApplicationType())
				&& (application.getPetToken().isEmpty() || application.getPetToken() == null);
>>>>>>> niua-upstream/niua-dev-2.0
	}

	/**
	 * Checks if the application is a renewal request.
	 */
	private boolean isRenewPetApplication(PetRegistrationApplication application) {
		return RENEW_PET_APPLICATION.equals(application.getApplicationType());
	}

	/**
	 * Generates a new pet token for a new pet registration application.
	 */
	private void enrichNewPetToken(PetRegistrationApplication application, RequestInfo requestInfo, String tenantId) {
		String petTokenId = commonUtils
				.getIdList(requestInfo, tenantId, config.getPetTokenName(), config.getPetTokenFormat(), 1).get(0);
		application.setPetToken(petTokenId);
	}

	/**
	 * Enriches the address details in the application.
	 */
	private void enrichAddress(PetRegistrationApplication application) {
		Address address = application.getAddress();
		address.setRegistrationId(application.getId());
		address.setId(UUID.randomUUID().toString());
	}
	/**
	 * Enriches pet details within the application.
	 */
	private void enrichPetDetails(PetRegistrationApplication application) {
		PetDetails petDetails = application.getPetDetails();
		petDetails.setPetDetailsId(application.getId());
		petDetails.setId(UUID.randomUUID().toString());
	}

	/**
	 * Enriches document details if documents are attached to the application.
	 */
	private void enrichRenewalDetails(PetRegistrationApplication application, long validityDateUnix) {
		PetRenewalAuditDetails petRenewalAuditDetails = new PetRenewalAuditDetails();
		petRenewalAuditDetails.setId(application.getPetToken());
		petRenewalAuditDetails.setApplicationNumber(application.getApplicationNumber());
		petRenewalAuditDetails.setPreviousapplicationnumber(application.getPreviousApplicationNumber());
		petRenewalAuditDetails.setExpiryDate(validityDateUnix);
		petRenewalAuditDetails.setRenewalDate(System.currentTimeMillis());
		petRenewalAuditDetails.setTokenNumber(application.getPetToken());
		petRenewalAuditDetails.setPetRegistrationId(application.getId());

	}

	/**
	 * Updates application status and enriches last modified details upon update.
	 */
	private void enrichDocuments(PetRegistrationApplication application) {
		application.getDocuments().forEach(doc -> {
			if (doc.getId() == null) {
				doc.setId(UUID.randomUUID().toString());
				doc.setActive(true);
				doc.setTenantId(application.getTenantId());
				doc.setAuditDetails(application.getAuditDetails());
			}
		});
	}

	public void enrichPetApplicationUponUpdate(String status, PetRegistrationRequest petRegistrationRequest) {
		// Enrich lastModifiedTime and lastModifiedBy in case of update
		PetRegistrationApplication application = petRegistrationRequest.getPetRegistrationApplications().get(0);
		application.getAuditDetails().setLastModifiedTime(System.currentTimeMillis());
		application.getAuditDetails()
				.setLastModifiedBy(petRegistrationRequest.getRequestInfo().getUserInfo().getUuid());
		application.setStatus(status);
		if (application.getWorkflow().getAction().equals(ACTION_APPROVE)) {

			if (isNewPetApplication(application)) {
				enrichNewPetToken(application, petRegistrationRequest.getRequestInfo(), application.getTenantId());
				log.info("Pet Token Generated : " + application.getPetToken());
			}
		}
	}
}
