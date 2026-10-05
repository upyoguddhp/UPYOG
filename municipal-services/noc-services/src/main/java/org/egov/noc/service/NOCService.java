package org.egov.noc.service;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.HashSet;


import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.common.contract.request.Role;
import org.egov.noc.config.NOCConfiguration;
import org.egov.noc.repository.NOCRepository;
import org.egov.noc.repository.ServiceRequestRepository;
import org.egov.noc.util.NOCConstants;
import org.egov.noc.util.NOCUtil;
import org.egov.noc.validator.NOCValidator;
import org.egov.noc.web.model.Noc;
import org.egov.noc.web.model.NocRequest;
import org.egov.noc.web.model.NocSearchCriteria;
import org.egov.noc.web.model.RequestInfoWrapper;
import org.egov.noc.web.model.bpa.BPA;
import org.egov.noc.web.model.bpa.BPAResponse;
import org.egov.noc.web.model.bpa.BPASearchCriteria;
import org.egov.noc.web.model.workflow.BusinessService;
import org.egov.noc.web.model.workflow.ProcessInstance;
import org.egov.noc.web.model.workflow.ProcessInstanceResponse;
import org.egov.noc.web.model.DmsRequest;
import org.egov.noc.workflow.WorkflowIntegrator;
import org.egov.noc.workflow.WorkflowService;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.util.ObjectUtils;
import org.springframework.util.StringUtils;
import org.egov.noc.web.model.PDFRequest;
import org.egov.noc.service.ReportService;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class NOCService {
	
	@Autowired
	private NOCValidator nocValidator;
	
	@Autowired
	private WorkflowIntegrator wfIntegrator;
	
	@Autowired
	private NOCUtil nocUtil;
	
	@Autowired
	private NOCRepository nocRepository;
	
	@Autowired
	private EnrichmentService enrichmentService;
	
	@Autowired
	private WorkflowService workflowService;
	
	@Autowired
	private NOCConfiguration config;

	@Autowired
	private ServiceRequestRepository serviceRequestRepository;

	@Autowired
	private ObjectMapper mapper;
	
	@Autowired
	private NOCBillingService nocBillingService;
	
	@Autowired
	private ReportService reportService;
	
	@Autowired
	private AlfrescoService alfrescoService;

	/**
	 * entry point from controller, takes care of next level logic from controller to create NOC application
	 * @param nocRequest
	 * @return
	 */
	public List<Noc> create(NocRequest nocRequest) {
		String tenantId = nocRequest.getNoc().getTenantId().split("\\.")[0];
		Object mdmsData = nocUtil.mDMSCall(nocRequest.getRequestInfo(), tenantId);
		Map<String, String> additionalDetails = nocValidator.getOrValidateBussinessService(nocRequest.getNoc(), mdmsData);
		nocValidator.validateCreate(nocRequest,  mdmsData);
		enrichmentService.enrichCreateRequest(nocRequest, mdmsData);
		if(!ObjectUtils.isEmpty(nocRequest.getNoc().getWorkflow()) && !StringUtils.isEmpty(nocRequest.getNoc().getWorkflow().getAction())) {
		  wfIntegrator.callWorkFlow(nocRequest, additionalDetails.get(NOCConstants.WORKFLOWCODE));
		}else{
		  nocRequest.getNoc().setApplicationStatus(NOCConstants.CREATED_STATUS);
		}
		nocRepository.save(nocRequest);
		return Arrays.asList(nocRequest.getNoc());
	}
	/**
	 * entry point from controller, takes care of next level logic from controller to update NOC application
	 * @param nocRequest
	 * @return
	 */
	@SuppressWarnings({ "rawtypes", "unchecked" })
	public List<Noc> update(NocRequest nocRequest) {
		String tenantId = nocRequest.getNoc().getTenantId().split("\\.")[0];
		Object mdmsData = nocUtil.mDMSCall(nocRequest.getRequestInfo(), tenantId);
		Map<String, String> additionalDetails  ;
		if(!ObjectUtils.isEmpty(nocRequest.getNoc().getAdditionalDetails()))  {
			additionalDetails = (Map) nocRequest.getNoc().getAdditionalDetails();
		} else {
			additionalDetails = nocValidator.getOrValidateBussinessService(nocRequest.getNoc(), mdmsData);
		}
		Noc searchResult = getNocForUpdate(nocRequest);
	    log.info("Application status in DB: {}", searchResult.getApplicationStatus());
		if(searchResult.getApplicationStatus().equalsIgnoreCase("AUTO_APPROVED")
				&& nocRequest.getNoc().getApplicationStatus().equalsIgnoreCase("INPROGRESS"))
		{
			log.info("NOC_UPDATE_ERROR_AUTO_APPROVED_TO_INPROGRESS_NOTALLOWED");
			throw new CustomException("AutoApproveException","NOC_UPDATE_ERROR_AUTO_APPROVED_TO_INPROGRESS_NOTALLOWED");
		}
		nocValidator.validateUpdate(nocRequest, searchResult, additionalDetails.get(NOCConstants.MODE), mdmsData);
		enrichmentService.enrichNocUpdateRequest(nocRequest, searchResult);
		
		if(!ObjectUtils.isEmpty(nocRequest.getNoc().getWorkflow())
				&& !StringUtils.isEmpty(nocRequest.getNoc().getWorkflow().getAction())) {
		   wfIntegrator.callWorkFlow(nocRequest, additionalDetails.get(NOCConstants.WORKFLOWCODE));
		   enrichmentService.postStatusEnrichment(nocRequest, additionalDetails.get(NOCConstants.WORKFLOWCODE));
		   
		   String action = nocRequest.getNoc().getWorkflow().getAction();
		    if ("RETURN_TO_INITIATOR_FOR_PAYMENT".equalsIgnoreCase(action)) {
		    	 nocBillingService.generateBill(nocRequest);
		    }
		    
		    if (NOCConstants.ACTION_APPROVE.equalsIgnoreCase(action)) {
		        createCertificate(nocRequest);
		    }
		    
		   BusinessService businessService = workflowService.getBusinessService(nocRequest.getNoc(),
				   nocRequest.getRequestInfo(), additionalDetails.get(NOCConstants.WORKFLOWCODE));
		   if(businessService == null)
			   nocRepository.update(nocRequest, true);
		   else
			   nocRepository.update(nocRequest, workflowService.isStateUpdatable(nocRequest.getNoc().getApplicationStatus(), businessService));
		}else {
           nocRepository.update(nocRequest, Boolean.FALSE);
		}
		
		return Arrays.asList(nocRequest.getNoc());
	}

	
	public List<Noc> search(NocSearchCriteria criteria, RequestInfo requestInfo) {
		
		boolean isTenantScoped = criteria.getTenantId() != null;

		User user = requestInfo.getUserInfo();
		String userType = user.getType();
		List<String> roleCodes = user.getRoles().stream().map(Role::getCode).collect(Collectors.toList());

		if ("CITIZEN".equalsIgnoreCase(userType)) {
			criteria.setAccountId(Collections.singletonList(user.getUuid()));
			if (isTenantScoped) {
				criteria.setStatus(null);
			}
		} else if ("EMPLOYEE".equalsIgnoreCase(userType)) {
			if (isTenantScoped) {
				boolean hasTenantAccess = user.getRoles().stream()
						.anyMatch(role -> criteria.getTenantId().equals(role.getTenantId()));

				if (!hasTenantAccess) {
					throw new CustomException("UNAUTHORIZED", "Employee not authorized for this tenant");
				}
			}
		} else {
			throw new CustomException("UNAUTHORIZED", "User not authorized to search NOCs");
		}
		List<Noc> nocs = nocRepository.getNocData(criteria);
		if (CollectionUtils.isEmpty(nocs)) {
			return Collections.emptyList();
		}
		RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
		for (Noc noc : nocs) {
			Map<String, Object> additionalDetails = new HashMap<>();
			if (noc.getAdditionalDetails() instanceof Map) {
				additionalDetails = (Map<String, Object>) noc.getAdditionalDetails();
			}
			StringBuilder url = new StringBuilder(config.getWfHost()).append(config.getWfProcessPath())
					.append("?businessIds=").append(noc.getApplicationNo()).append("&tenantId=")
					.append(noc.getTenantId());
			Object result = serviceRequestRepository.fetchResult(url, requestInfoWrapper);
			ProcessInstanceResponse response;
			try {
				response = mapper.convertValue(result, ProcessInstanceResponse.class);
			} catch (IllegalArgumentException e) {
				throw new CustomException(NOCConstants.PARSING_ERROR, "Failed to parse workflow response");
			}
			if (response.getProcessInstances() != null && !response.getProcessInstances().isEmpty()
					&& response.getProcessInstances().get(0).getAssignee() != null) {
				additionalDetails.put("currentOwner", response.getProcessInstances().get(0).getAssignee().getName());
			} else {
				additionalDetails.put("currentOwner", null);
			}
			noc.setAdditionalDetails(additionalDetails);
		}
		return nocs;
	}

	/**
	 * Fetch the noc based on the id to update the NOC record
	 * @param nocRequest
	 * @return
	 */
	public Noc getNocForUpdate(NocRequest nocRequest) {		
		List<String> ids = Arrays.asList(nocRequest.getNoc().getId());
		NocSearchCriteria criteria = new NocSearchCriteria();
		criteria.setIds(ids);
		criteria.setTenantId(nocRequest.getNoc().getTenantId());
		List<Noc> nocList = search(criteria, nocRequest.getRequestInfo());
		if (CollectionUtils.isEmpty(nocList) ) {
			StringBuilder builder = new StringBuilder();
			builder.append("Noc Application not found for: ").append(nocRequest.getNoc().getId()).append(" :ID");
			throw new CustomException("INVALID_NOC_SEARCH", builder.toString());
		}else if( nocList.size() > 1) {
			StringBuilder builder = new StringBuilder();
			builder.append("Multiple Noc Application(s) not found for: ").append(nocRequest.getNoc().getId()).append(" :ID");
			throw new CustomException("INVALID_NOC_SEARCH", builder.toString());
		}
		return nocList.get(0);
	}
	
	/**
         * entry point from controller,applies the quired fileters and encrich search criteria and
         * return the noc application count the search criteria
         * @param nocRequest
         * @return
         */
        public Integer getNocCount(NocSearchCriteria criteria, RequestInfo requestInfo) {
                /*List<String> uuids = new ArrayList<String>();
                uuids.add(requestInfo.getUserInfo().getUuid());
                criteria.setAccountId(uuids);*/
                return nocRepository.getNocCount(criteria);
        }
        
		private void createCertificate(NocRequest nocRequest) {
			Resource resource = createResource(nocRequest);
			DmsRequest dmsRequest = generateDmsRequest(resource, nocRequest);
			try {
				String documentReferenceId = alfrescoService.uploadAttachment(dmsRequest, nocRequest.getRequestInfo());
			} catch (IOException e) {
				throw new CustomException("UPLOAD_ATTACHMENT_FAILED", "Upload Attachment failed." + e.getMessage());
			}
		}
        
		private Resource createResource(NocRequest nocRequest) {

			Map<String, Object> map = new HashMap<>();
			Map<String, Object> nocObject = new HashMap<>();

			Noc noc = nocRequest.getNoc();
			
			nocObject.put("applicationNo", noc.getApplicationNo());
			nocObject.put("nocNo", noc.getNocNo());
			nocObject.put("nocType", noc.getNocType());
			nocObject.put("applicationType", noc.getApplicationType());
			nocObject.put("applicationStatus", noc.getApplicationStatus());
			nocObject.put("nocReason", noc.getNocReason());
			nocObject.put("connectionType", noc.getConnectionType());
			nocObject.put("tenantId", noc.getTenantId());

			if (noc.getCitizenDetail() != null) {
				nocObject.put("citizenDetail", noc.getCitizenDetail());
			}

			if (noc.getPropertyDetail() != null) {
				nocObject.put("propertyDetail", noc.getPropertyDetail());
			}

			if (noc.getAdditionalDetails() != null) {
				nocObject.put("additionalDetails", noc.getAdditionalDetails());
			}
			
			nocObject.put("certificateStatus", "APPROVED");
			map.put("noc", nocObject);

			PDFRequest pdfRequest = PDFRequest.builder().RequestInfo(nocRequest.getRequestInfo()).key("nocCertificate")
					.tenantId(noc.getTenantId()).data(map).build();

			return reportService.createNoSavePDF(pdfRequest);
		}
		
		private DmsRequest generateDmsRequest(Resource resource, NocRequest nocRequest) {
			Noc noc = nocRequest.getNoc();
			RequestInfo requestInfo = nocRequest.getRequestInfo();
			DmsRequest dmsRequest = DmsRequest.builder().userId(requestInfo.getUserInfo().getId().toString())
					.objectId(noc.getId()).description(config.ALFRESCO_COMMON_CERTIFICATE_DESCRIPTION)
					.id(config.ALFRESCO_COMMON_CERTIFICATE_ID)
					.type(config.ALFRESCO_COMMON_CERTIFICATE_TYPE)
					.objectName(config.ALFRESCO_BUSINESS_SERVICE)
					.comments(config.ALFRESCO_NOC_CERTIFICATE_COMMENT)
					.status(config.STATUS_APPROVED)
					.file(resource)
					.servicetype(config.ALFRESCO_BUSINESS_SERVICE)
					.documentType(config.ALFRESCO_DOCUMENT_TYPE)
					.documentId(config.ALFRESCO_COMMON_DOCUMENT_ID)
					.build();
			return dmsRequest;
		}
}
