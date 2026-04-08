package org.egov.ptr.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.mdms.model.*;
import org.egov.ptr.config.PetConfiguration;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class MdmsService {

	@Autowired
	private RestTemplate restTemplate;

	@Autowired
	private PetConfiguration config;

	@Autowired
	private ObjectMapper objectMapper;

	public MdmsResponse fetchPetRenewalData(RequestInfo requestInfo, String tenantId) {

		String moduleName = "ULBS";
		String masterName = "PetRenewal";

		String filter = "$.[?(@.active==true)]";

		MasterDetail masterDetail = MasterDetail.builder().name(masterName).filter(filter).build();

		ModuleDetail moduleDetail = ModuleDetail.builder().moduleName(moduleName)
				.masterDetails(Collections.singletonList(masterDetail)).build();

		MdmsCriteria mdmsCriteria = MdmsCriteria.builder().tenantId(tenantId)
				.moduleDetails(Collections.singletonList(moduleDetail)).build();

		MdmsCriteriaReq request = MdmsCriteriaReq.builder().requestInfo(requestInfo).mdmsCriteria(mdmsCriteria).build();

		String url = config.getMdmsHostv2() + config.getMdmsEndpointv2();

		MdmsResponse mdmsResponse = restTemplate.postForObject(url, request, MdmsResponse.class);

		return mdmsResponse;
	}

}