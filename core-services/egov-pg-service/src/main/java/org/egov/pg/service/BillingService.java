package org.egov.pg.service;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.request.RequestInfo;
import org.egov.pg.config.AppProperties;
import org.egov.pg.models.DemandResponse;
import org.egov.pg.web.models.RequestInfoWrapper;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.egov.pg.models.BillResponse;

@Service
@Slf4j
public class BillingService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private AppProperties appProperties;

    public DemandResponse searchDemand(RequestInfo requestInfo,
                                       String tenantId,
                                       String consumerCode) {
    	RequestInfoWrapper body = new RequestInfoWrapper(requestInfo);

        String url = UriComponentsBuilder
                .fromHttpUrl(appProperties.getBillingServiceHost()
                        + appProperties.getBillservicedemandsearchendpoint())
                .queryParam("tenantId", tenantId)
                .queryParam("consumerCode", consumerCode)
                .toUriString();

        try {
            return restTemplate.postForObject(url, body, DemandResponse.class);
        } catch (Exception e) {
            log.error("Error while searching demand from billing-service", e);
            throw new CustomException(
                    "BILLING_SERVICE_ERROR",
                    "Error while fetching demand from billing service: " + e.getMessage()
            );
        }
    }
    
    public BillResponse searchBillById(RequestInfo requestInfo, String tenantId, String billId) {

        StringBuilder url = new StringBuilder();
        url.append(appProperties.getBillingServiceHost())
           .append(appProperties.getBillingServiceSearchEndpoint())
           .append("?tenantId=").append(tenantId)
           .append("&billId=").append(billId);

        try {
            return restTemplate.postForObject(
                    url.toString(),
                    new RequestInfoWrapper(requestInfo),
                    BillResponse.class
            );
        } catch (Exception e) {
            log.error("Error while searching bill", e);
            throw new CustomException("BILL_SEARCH_FAILED",
                    "Unable to fetch bill for billId: " + billId);
        }
    }

}
