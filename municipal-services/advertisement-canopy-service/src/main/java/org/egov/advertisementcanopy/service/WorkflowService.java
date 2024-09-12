package org.egov.advertisementcanopy.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.egov.advertisementcanopy.contract.workflow.BusinessService;
import org.egov.advertisementcanopy.contract.workflow.BusinessServiceResponse;
import org.egov.advertisementcanopy.contract.workflow.ProcessInstance;
import org.egov.advertisementcanopy.contract.workflow.ProcessInstanceRequest;
import org.egov.advertisementcanopy.contract.workflow.ProcessInstanceResponse;
import org.egov.advertisementcanopy.contract.workflow.State;
import org.egov.advertisementcanopy.model.SiteBooking;
import org.egov.advertisementcanopy.model.SiteBookingRequest;
import org.egov.advertisementcanopy.util.AdvtConstants;
import org.egov.advertisementcanopy.util.RequestInfoWrapper;
import org.egov.advertisementcanopy.util.RestCallRepository;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class WorkflowService {

	@Autowired
	private AdvtConstants configs;

	@Autowired
	private RestCallRepository restRepo;

	@Autowired
	private ObjectMapper mapper;

	public void updateWorkflowStatus(SiteBookingRequest siteBookingRequest) {
		
		List<ProcessInstance> processInstances = new ArrayList<>();
		siteBookingRequest.getSiteBookings().forEach(booking -> {
			ProcessInstance processInstance = getProcessInstanceForPTR(booking,
					siteBookingRequest.getRequestInfo());
			processInstances.add(processInstance);
		});
		
		ProcessInstanceRequest workflowRequest = new ProcessInstanceRequest(siteBookingRequest.getRequestInfo(),
				processInstances);
		callWorkFlow(workflowRequest);
		
	}

	private ProcessInstance getProcessInstanceForPTR(SiteBooking siteBooking, RequestInfo requestInfo) {

//		if(null != siteBooking) {
			ProcessInstance processInstance = new ProcessInstance();
			processInstance.setBusinessId(siteBooking.getApplicationNo());
			processInstance.setAction(siteBooking.getWorkflowAction());
			processInstance.setModuleName("ADVT");
			processInstance.setTenantId(siteBooking.getTenantId());
			processInstance.setBusinessService("ADVT");
			processInstance.setComment(siteBooking.getComments());
//			processInstance.setAssignes(Collections.singletonList(User.builder().uuid(requestInfo.getUserInfo().getUuid()).build()));

			return processInstance;
//		}
//		
//		return null;

	}

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
		StringBuilder url = new StringBuilder(configs.getWorkflowHost().concat(configs.getWorkflowEndpointTransition()));
		Object optional = restRepo.fetchResult(url, workflowReq);
		response = mapper.convertValue(optional, ProcessInstanceResponse.class);
		if(null == response) {
			throw new CustomException("WORKFLOW_SERVICE_CALL_FAILED","Failed to run Workflow Service.");
		}
		return response.getProcessInstances().get(0).getState();
	}

	/**
	 * Get the workflow config for the given tenant
	 * 
	 * @param tenantId    The tenantId for which businessService is requested
	 * @param requestInfo The RequestInfo object of the request
	 * @return BusinessService for the the given tenantId
	 */
	public BusinessService getBusinessService(String tenantId, String businessService, RequestInfo requestInfo) {

		StringBuilder url = getSearchURLWithParams(tenantId, businessService);
		RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();
		Object result = restRepo.fetchResult(url, requestInfoWrapper);
		BusinessServiceResponse response = null;
		try {
			response = mapper.convertValue(result, BusinessServiceResponse.class);
		} catch (IllegalArgumentException e) {
			throw new CustomException("PARSING ERROR", "Failed to parse response of workflow business service search");
		}

		if (CollectionUtils.isEmpty(response.getBusinessServices()))
			throw new CustomException("BUSINESSSERVICE_NOT_FOUND",
					"The businessService " + businessService + " is not found");

		return response.getBusinessServices().get(0);
	}

	/**
	 * Creates url for search based on given tenantId
	 *
	 * @param tenantId The tenantId for which url is generated
	 * @return The search url
	 */
	private StringBuilder getSearchURLWithParams(String tenantId, String businessService) {

		StringBuilder url = new StringBuilder(configs.getWorkflowHost());
		url.append(configs.getWorkflowBusinessServiceSearchPath());
		url.append("?tenantId=");
		url.append(tenantId);
		url.append("&businessServices=");
		url.append(businessService);
		return url;
	}

	/**
	 * Returns boolean value to specifying if the state is updatable
	 * 
	 * @param stateCode       The stateCode of the license
	 * @param businessService The BusinessService of the application flow
	 * @return State object to be fetched
	 */
	public Boolean isStateUpdatable(String stateCode, BusinessService businessService) {
		for (State state : businessService.getStates()) {
			if (state.getState() != null && state.getState().equalsIgnoreCase(stateCode))
				return state.getIsStateUpdatable();
		}
		return null;
	}

	/**
	 * Creates url for searching processInstance
	 *
	 * @return The search url
	 */
	private StringBuilder getWorkflowSearchURLWithParams(String tenantId, String businessId) {

		StringBuilder url = new StringBuilder(configs.getWorkflowHost());
		url.append(configs.getWorkflowBusinessServiceSearchPath());
		url.append("?tenantId=");
		url.append(tenantId);
		url.append("&businessIds=");
		url.append(businessId);
		return url;
	}

	/**
	 * Fetches the workflow object for the given assessment
	 * 
	 * @return
	 */
	public State getCurrentState(RequestInfo requestInfo, String tenantId, String businessId) {

		RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder().requestInfo(requestInfo).build();

		StringBuilder url = getWorkflowSearchURLWithParams(tenantId, businessId);

		Object res = restRepo.fetchResult(url, requestInfoWrapper);
		ProcessInstanceResponse response = null;

		try {
			response = mapper.convertValue(res, ProcessInstanceResponse.class);
		} catch (Exception e) {
			throw new CustomException("PARSING_ERROR", "Failed to parse workflow search response");
		}

		if (response != null && !CollectionUtils.isEmpty(response.getProcessInstances())
				&& response.getProcessInstances().get(0) != null)
			return response.getProcessInstances().get(0).getState();

		return null;
	}

}