package org.upyog.chb.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.constants.WorkflowStatus;
import org.upyog.chb.repository.ServiceRequestRepository;
import org.upyog.chb.web.models.CommunityHallBookingDetail;
import org.upyog.chb.web.models.CommunityHallBookingRequest;
=======
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.upyog.chb.config.CommunityHallBookingConfiguration;
import org.upyog.chb.repository.ServiceRequestRepository;
import org.upyog.chb.web.models.VenueBookingDetail;
import org.upyog.chb.web.models.VenueBookingRequest;
>>>>>>> niua-upstream/niua-dev-2.0
import org.upyog.chb.web.models.workflow.BusinessService;
import org.upyog.chb.web.models.workflow.BusinessServiceResponse;
import org.upyog.chb.web.models.workflow.ProcessInstance;
import org.upyog.chb.web.models.workflow.ProcessInstanceRequest;
import org.upyog.chb.web.models.workflow.ProcessInstanceResponse;
import org.upyog.chb.web.models.workflow.State;

import com.fasterxml.jackson.databind.ObjectMapper;

import digit.models.coremodels.RequestInfoWrapper;

@Service
public class WorkflowService {

<<<<<<< HEAD
	@Autowired
	private CommunityHallBookingConfiguration configs;

	@Autowired
	private ServiceRequestRepository restRepo;

	@Autowired
	private ObjectMapper mapper;


	/**
	 * Method to integrate with workflow
	 *
	 * takes the Pet request as parameter constructs the work-flow request
	 *
	 * and sets the resultant status from wf-response back to trade-license object
	 *
	 */
	public State callWorkFlow(ProcessInstanceRequest workflowReq) {

		ProcessInstanceResponse response = null;
=======
	private final CommunityHallBookingConfiguration configs;
	private final ServiceRequestRepository restRepo;
	private final ObjectMapper mapper;

	public WorkflowService(CommunityHallBookingConfiguration configs, ServiceRequestRepository restRepo,
			ObjectMapper mapper) {
		this.configs = configs;
		this.restRepo = restRepo;
		this.mapper = mapper;
	}

	public State callWorkFlow(ProcessInstanceRequest workflowReq) {

		ProcessInstanceResponse response;
>>>>>>> niua-upstream/niua-dev-2.0
		StringBuilder url = new StringBuilder(configs.getWfHost().concat(configs.getWfTransitionPath()));
		Object responseObject = restRepo.fetchResult(url, workflowReq);
		response = mapper.convertValue(responseObject, ProcessInstanceResponse.class);
		return response.getProcessInstances().get(0).getState();
	}
<<<<<<< HEAD
	
	/**
	 * method to prepare process instance request 
	 * and assign status back to property
	 * 
	 * @param request
	 */
	public State updateWorkflow(CommunityHallBookingRequest bookingRequest, WorkflowStatus workflowStatus) {

		CommunityHallBookingDetail bookingDetail = bookingRequest.getHallsBookingApplication();
		
		ProcessInstanceRequest workflowReq = getProcessInstanceForHallBooking(bookingDetail, bookingRequest.getRequestInfo());
		State state = callWorkFlow(workflowReq);
		
//		if (state.getApplicationStatus().equalsIgnoreCase(configs.getWfStatusActive()) && property.getPropertyId() == null) {
//			
//			String pId = utils.getIdList(request.getRequestInfo(), property.getTenantId(), configs.getPropertyIdGenName(), configs.getPropertyIdGenFormat(), 1).get(0);
//			request.getProperty().setPropertyId(pId);
//		}
//		
//		if(request.getProperty().getCreationReason().equals(CreationReason.STATUS) && request.getProperty().getWorkflow().getAction().equalsIgnoreCase("APPROVE"))
//		{	
//			request.getProperty().setStatus(Status.INACTIVE);
//		}
//		else
//		request.getProperty().setStatus(Status.fromValue(state.getApplicationStatus()));
//		request.getProperty().getWorkflow().setState(state);
		return state;
	}

	private ProcessInstanceRequest getProcessInstanceForHallBooking(CommunityHallBookingDetail bookingDetail, RequestInfo requestInfo) {
//		Workflow workflow = application.getWorkflow();	
//		Asset asset = request.getProperty();
		ProcessInstance workflow = null != bookingDetail.getWorkflow() ? bookingDetail.getWorkflow() : new ProcessInstance();
=======

	public State updateWorkflow(VenueBookingRequest bookingRequest) {

		VenueBookingDetail bookingDetail = bookingRequest.getVenueBookingApplication();

		ProcessInstanceRequest workflowReq = getProcessInstanceForHallBooking(bookingDetail,
				bookingRequest.getRequestInfo());

		return callWorkFlow(workflowReq);
	}

	private ProcessInstanceRequest getProcessInstanceForHallBooking(VenueBookingDetail bookingDetail,
			RequestInfo requestInfo) {

		ProcessInstance workflow = null != bookingDetail.getWorkflow() ? bookingDetail.getWorkflow()
				: new ProcessInstance();
>>>>>>> niua-upstream/niua-dev-2.0

		ProcessInstance processInstance = new ProcessInstance();
		processInstance.setBusinessId(bookingDetail.getBookingNo());
		processInstance.setAction(workflow.getAction());
		processInstance.setModuleName(workflow.getModuleName());
<<<<<<< HEAD
		processInstance.setTenantId("hp");//bookingDetail.getTenantId()
=======
		processInstance.setTenantId(bookingDetail.getTenantId());
>>>>>>> niua-upstream/niua-dev-2.0
		processInstance.setBusinessService(workflow.getBusinessService());
		processInstance.setDocuments(workflow.getDocuments());
		processInstance.setComment(workflow.getComment());

		if (!CollectionUtils.isEmpty(workflow.getAssignes())) {
			List<User> users = new ArrayList<>();

			workflow.getAssignes().forEach(uuid -> {
				User user = new User();
				user.setUuid(uuid.getUuid());
				users.add(user);
			});

			processInstance.setAssignes(users);
		}

<<<<<<< HEAD
		//return processInstance;
		return ProcessInstanceRequest.builder()
				.requestInfo(requestInfo)
				.processInstances(Arrays.asList(processInstance))
				.build();

	}
	/**
	 * Get the workflow config for the given tenant
	 * 
	 * @param tenantId    The tenantId for which businessService is requested
	 * @param requestInfo The RequestInfo object of the request
	 * @return BusinessService for the the given tenantId
	 */
=======
		return ProcessInstanceRequest.builder().requestInfo(requestInfo)
				.processInstances(Arrays.asList(processInstance)).build();

	}

>>>>>>> niua-upstream/niua-dev-2.0
	public BusinessService getBusinessService(String tenantId, String businessService, RequestInfo requestInfo) {

		StringBuilder url = getSearchURLWithParams(tenantId, businessService);
		RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
		Object responseObject = restRepo.fetchResult(url, requestInfoWrapper);
<<<<<<< HEAD
		BusinessServiceResponse response = null;
=======
		BusinessServiceResponse response;
>>>>>>> niua-upstream/niua-dev-2.0
		try {
			response = mapper.convertValue(responseObject, BusinessServiceResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response of workflow business service search");
		}

		if (CollectionUtils.isEmpty(response.getBusinessServices()))
			throw new CustomException("BUSINESSSERVICE_NOT_FOUND",
					"The businessService " + businessService + " is not found");

		return response.getBusinessServices().get(0);
	}

<<<<<<< HEAD
	/**
	 * Creates url for search based on given tenantId
	 *
	 * @param tenantId The tenantId for which url is generated
	 * @return The search url
	 */
=======
>>>>>>> niua-upstream/niua-dev-2.0
	private StringBuilder getSearchURLWithParams(String tenantId, String businessService) {

		StringBuilder url = new StringBuilder(configs.getWfHost());
		url.append(configs.getWfBusinessServiceSearchPath());
		url.append("?tenantId=");
		url.append(tenantId);
		url.append("&businessServices=");
		url.append(businessService);
		return url;
	}

<<<<<<< HEAD
	/**
	 * Returns boolean value to specifying if the state is updatable
	 * 
	 * @param stateCode       The stateCode of the license
	 * @param businessService The BusinessService of the application flow
	 * @return State object to be fetched
	 */
=======
>>>>>>> niua-upstream/niua-dev-2.0
	public Boolean isStateUpdatable(String stateCode, BusinessService businessService) {
		for (State state : businessService.getStates()) {
			if (state.getState() != null && state.getState().equalsIgnoreCase(stateCode))
				return state.getIsStateUpdatable();
		}
<<<<<<< HEAD
		return null;
	}

	/**
	 * Creates url for searching processInstance
	 *
	 * @return The search url
	 */
	private StringBuilder getWorkflowSearchURLWithParams(String tenantId, String businessId) {

		StringBuilder url = new StringBuilder(configs.getWfHost());
		//url.append(configs.getWfProcessInstanceSearchPath());
=======
		return Boolean.FALSE;
	}

	private StringBuilder getWorkflowSearchURLWithParams(String tenantId, String businessId) {

		StringBuilder url = new StringBuilder(configs.getWfHost());
>>>>>>> niua-upstream/niua-dev-2.0
		url.append("?tenantId=");
		url.append(tenantId);
		url.append("&businessIds=");
		url.append(businessId);
		return url;
	}

<<<<<<< HEAD
	/**
	 * Fetches the workflow object for the given assessment
	 * 
	 * @return
	 */
=======
>>>>>>> niua-upstream/niua-dev-2.0
	public State getCurrentState(RequestInfo requestInfo, String tenantId, String businessId) {

		RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();

		StringBuilder url = getWorkflowSearchURLWithParams(tenantId, businessId);

		Object responseObject = restRepo.fetchResult(url, requestInfoWrapper);
<<<<<<< HEAD
		ProcessInstanceResponse response = null;
=======
		ProcessInstanceResponse response;
>>>>>>> niua-upstream/niua-dev-2.0

		try {
			response = mapper.convertValue(responseObject, ProcessInstanceResponse.class);
		} catch (Exception e) {
			throw new CustomException("PARSING_ERROR", "Failed to parse workflow search response");
		}

		if (response != null && !CollectionUtils.isEmpty(response.getProcessInstances())
				&& response.getProcessInstances().get(0) != null)
			return response.getProcessInstances().get(0).getState();

		return null;
	}

<<<<<<< HEAD
}
=======
}
>>>>>>> niua-upstream/niua-dev-2.0
