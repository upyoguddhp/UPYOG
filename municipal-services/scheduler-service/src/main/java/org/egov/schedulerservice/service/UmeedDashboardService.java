package org.egov.schedulerservice.service;

import java.time.LocalDate;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.schedulerservice.request.UmeedDashboardRequest;
import org.egov.schedulerservice.request.UmeedLogRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UmeedDashboardService {

	@Autowired
	private NiuaOAuthTokenService niuaOAuthTokenService;

	@Autowired
	private ObjectMapper objectMapper;

	@Autowired
	private TLService tlService;
	
	@Autowired
	private PGRService pgrService;

	@Autowired
	private UmeedDashboardClientService umeedDashboardClientService;
	
	@Autowired
	private UmmedDashboardLoggerService ummedDashboardLoggerService;

	public Object pushUmeedDashboardMetricsForTL(RequestInfo requestInfo) {

		String ingestResponse = "";

		// Step 1: Build request info for Umeed Dashboard
		RequestInfo umeedDashboardRequestInfo = buildRequestInfo();

		// Step 2: Fetch Trade License dashboard metrics
		Object umeedDashboardDataMatrics = tlService.getUmeedDashbaordDataMatrics(requestInfo);

		if (null != umeedDashboardDataMatrics
				&& null != objectMapper.valueToTree(umeedDashboardDataMatrics).get("Data")) {
			UmeedDashboardRequest umeedDashboardRequest = UmeedDashboardRequest.builder()
					.requestInfo(umeedDashboardRequestInfo)
					.data(objectMapper.valueToTree(umeedDashboardDataMatrics).get("Data")).build();

			log.info("Request Payload {}", umeedDashboardRequest);
			// Step 3: call umeed dashboard api to push data
			ingestResponse = umeedDashboardClientService.sendMetrics(umeedDashboardRequest);
			log.info("Response Paylaod {}" ,ingestResponse);
			
			Object umeedDashboardLog = ummedDashboardLoggerService.saveUmeedDashbaordLog(requestInfo,ingestResponse , umeedDashboardRequest);

			 
		} else {
			ingestResponse = "No Data from TL Service";
		}

		
		return ingestResponse;
	}

	//------------------------PGR 
	public Object pushUmeedDashboardMetricsForPGR(RequestInfo requestInfo) {

		String ingestResponse = "";

		// Step 1: Build request info for Umeed Dashboard	
		RequestInfo umeedDashboardRequestInfo = buildRequestInfo();

		// Step 2: Fetch  dashboard metrics
		Object umeedDashboardDataMatrics = pgrService.getUmeedDashbaordDataMatrics(requestInfo);

		if (null != umeedDashboardDataMatrics
				&& null != objectMapper.valueToTree(umeedDashboardDataMatrics).get("Data")) {
			UmeedDashboardRequest umeedDashboardRequest = UmeedDashboardRequest.builder()
					.requestInfo(umeedDashboardRequestInfo)
					.data(objectMapper.valueToTree(umeedDashboardDataMatrics).get("Data")).build();

			log.info("Request Payload {}", umeedDashboardRequest);
			// Step 3: call umeed dashboard api to push data
			ingestResponse = umeedDashboardClientService.sendMetrics(umeedDashboardRequest);
			log.info("Response Paylaod {}" ,ingestResponse);
			
			Object umeedDashboardLog = ummedDashboardLoggerService;

			 
		} else {
			ingestResponse = "No Data from PGR Service";	
		}

		
		return ingestResponse;
	}
	private RequestInfo buildRequestInfo() {
		RequestInfo requestInfo = RequestInfo.builder().build();

		Object tokenResponse = niuaOAuthTokenService.requestNiuaOAuthToken();

		if (tokenResponse != null) {
			JsonNode jsonNode = objectMapper.valueToTree(tokenResponse);

			// Extract token safely
			if (jsonNode.has("access_token") && !jsonNode.get("access_token").isNull()) {

				String token = jsonNode.get("access_token").asText();

				requestInfo.setAuthToken(token);
			}

			// Extract user info
			if (jsonNode.has("UserRequest") && !jsonNode.get("UserRequest").isNull()) {
				try {

					User user = objectMapper.treeToValue(jsonNode.get("UserRequest"), User.class);

					user.setTenantId("pg");

					requestInfo.setUserInfo(user);

				} catch (JsonProcessingException e) {
					log.error("Error mapping UserRequest: {}", e.getMessage());
				}
			}
		}
		return requestInfo;	
	}

}
