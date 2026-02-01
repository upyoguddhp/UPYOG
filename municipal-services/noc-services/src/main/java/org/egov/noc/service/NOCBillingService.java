package org.egov.noc.service;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.egov.common.contract.request.RequestInfo;
import org.egov.noc.config.NOCConfiguration;
import org.egov.noc.repository.ServiceRequestRepository;
import org.egov.noc.web.model.Noc;
import org.egov.noc.web.model.NocRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class NOCBillingService {

    @Autowired
    private ServiceRequestRepository serviceRequestRepository;

    @Autowired
    private NOCConfiguration config;
    
    public void generateBill(NocRequest nocRequest) {

        Noc noc = nocRequest.getNoc();
        RequestInfo requestInfo = nocRequest.getRequestInfo();

        if (billExists(noc, requestInfo)) {
            log.info("Bill already exists for NOC {}", noc.getApplicationNo());
            return;
        }

        BigDecimal fee = fetchNocFeeFromMDMS(noc, requestInfo);
        createDemand(noc, requestInfo, fee);
        fetchBill(noc, requestInfo);
    }

    private void createDemand(Noc noc, RequestInfo requestInfo, BigDecimal fee) {

        Map<String, Object> demandDetail = new HashMap<>();
        demandDetail.put("taxHeadMasterCode", "NOC_FEE");
        demandDetail.put("taxAmount", fee);
        demandDetail.put("collectionAmount", BigDecimal.ZERO);

        Map<String, Object> demand = new HashMap<>();
        demand.put("tenantId", noc.getTenantId());
        demand.put("consumerCode", noc.getApplicationNo());
        demand.put("consumerType", "NOC");
        demand.put("businessService", "NOC");
        demand.put("taxPeriodFrom", System.currentTimeMillis());
        demand.put("taxPeriodTo", System.currentTimeMillis());
        demand.put("demandDetails", Collections.singletonList(demandDetail));

        Map<String, Object> demandRequest = new HashMap<>();
        demandRequest.put("RequestInfo", requestInfo);
        demandRequest.put("Demands", Collections.singletonList(demand));

        log.info("Creating demand for NOC {} with fee {}", noc.getApplicationNo(), fee);

        serviceRequestRepository.fetchResult(
        	    new StringBuilder(config.getBillingHost())
        	            .append(config.getDemandCreateEndpoint()),
        	    demandRequest
        	);
    }

    private void fetchBill(Noc noc, RequestInfo requestInfo) {

        StringBuilder uri = new StringBuilder(config.getBillingHost())
            .append(config.getBillFetchEndpoint())
            .append("?tenantId=").append(noc.getTenantId())
            .append("&businessService=NOC")
            .append("&consumerCode=").append(noc.getApplicationNo());

        Map<String, Object> request = new HashMap<>();
        request.put("RequestInfo", requestInfo);

        serviceRequestRepository.fetchResult(uri, request);
    }

    
 	private boolean billExists(Noc noc, RequestInfo requestInfo) {
	
	    StringBuilder uri = new StringBuilder(config.getBillingHost())
	        .append(config.getBillSearchEndpoint())
	        .append("?tenantId=").append(noc.getTenantId())
	        .append("&service=NOC")
	        .append("&consumerCode=").append(noc.getApplicationNo());
	
	    Map<String, Object> request = new HashMap<>();
	    request.put("RequestInfo", requestInfo);
	
	    Object response = serviceRequestRepository.fetchResult(uri, request);
	    
	    if (!(response instanceof Map)) return false;
	
	    Map<?, ?> responseMap = (Map<?, ?>) response;
	    Object bills = responseMap.get("bill");
	
	    return bills instanceof List && !CollectionUtils.isEmpty((List<?>) bills);
	}

	private BigDecimal fetchNocFeeFromMDMS(Noc noc, RequestInfo requestInfo) {
	
	    Map<String, Object> mdmsCriteria = new HashMap<>();
	    mdmsCriteria.put("tenantId", noc.getTenantId().split("\\.")[0]);
	    mdmsCriteria.put("schemaCode", "ULBS.NocFee");
	
	    Map<String, Object> mdmsRequest = new HashMap<>();
	    mdmsRequest.put("RequestInfo", requestInfo);
	    mdmsRequest.put("MdmsCriteria", mdmsCriteria);
	
	    log.info("Fetching NOC fee from MDMS for tenant {}", noc.getTenantId());
	
	    Object response = serviceRequestRepository.fetchResult(
	            new StringBuilder(config.getMdmsV2Host())
	                    .append(config.getMdmsV2SearchEndpoint()),
	            mdmsRequest
	    );
	
	    if (!(response instanceof Map)) {
	        throw new IllegalStateException("Invalid MDMS response");
	    }
	
	    Map<?, ?> responseMap = (Map<?, ?>) response;
	    List<?> mdmsList = (List<?>) responseMap.get("mdms");
	
	    if (CollectionUtils.isEmpty(mdmsList)) {
	        throw new IllegalStateException("NOC fee not configured in MDMS");
	    }
	
	    Map<?, ?> mdmsEntry = (Map<?, ?>) mdmsList.get(0);
	    Map<?, ?> data = (Map<?, ?>) mdmsEntry.get("data");
	
	    Object rate = data.get("rate");
	    if (rate == null) {
	        throw new IllegalStateException("Rate missing in MDMS NocFee");
	    }
	
	    log.info("NOC fee fetched from MDMS: {}", rate);
	    return new BigDecimal(rate.toString());
	}

}
