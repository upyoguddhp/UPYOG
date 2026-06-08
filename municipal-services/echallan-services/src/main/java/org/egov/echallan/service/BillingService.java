package org.egov.echallan.service;

import java.util.Collections;

import org.egov.common.contract.request.RequestInfo;
import org.egov.echallan.model.BillResponse;
import org.egov.echallan.model.BillSearchCriteria;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.egov.echallan.repository.ServiceRequestRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.egov.echallan.model.RequestInfoWrapper;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class BillingService {

    @Value("${egov.billingservice.host}")
    private String billingHost;

    @Value("${egov.bill.search.endpoint}")
    private String searchBillEndpoint;

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private ObjectMapper mapper;

    @SuppressWarnings("unchecked")
    public Object searchBill(BillSearchCriteria criteria, RequestInfo requestInfo) {

        StringBuilder uri = new StringBuilder(billingHost)
                .append(searchBillEndpoint)
                .append("?tenantId=").append(criteria.getTenantId())
                .append("&consumerCode=").append(criteria.getConsumerCode().iterator().next())
                .append("&retrieveAll=true")
                .append("&skipValidation=true");

        RequestInfoWrapper requestInfoWrapper = RequestInfoWrapper.builder()
                .requestInfo(requestInfo)
                .build();

        return serviceRequestRepository.fetchResult(uri, requestInfoWrapper);
    }
}
