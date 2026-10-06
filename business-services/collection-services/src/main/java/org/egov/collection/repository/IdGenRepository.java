package org.egov.collection.repository;

import lombok.extern.slf4j.Slf4j;
import org.egov.collection.config.ApplicationProperties;
import org.egov.collection.model.IdGenerationRequest;
import org.egov.collection.model.IdGenerationResponse;
import org.egov.collection.model.IdRequest;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.ServiceCallException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

import static org.egov.collection.config.CollectionServiceConstants.*;

@Service
@Slf4j
public class IdGenRepository {
	
    @Autowired
    private RestTemplate restTemplate;
    
	@Autowired
	private ApplicationProperties applicationProperties;

    /**
     * Generates a receipt number
     *  - If isReceiptNumberByService flag is set to true,
     *      generates receipt number by business service and tenant id
     *  - Else generates by tenant id only
     *
     * @param requestInfo
     * @param businessService
     * @param tenantId
     * @return
     */
	public String generateReceiptNumber(RequestInfo requestInfo, String businessService ,String tenantId) {
        String idName = "";
        String format = null;
	    log.debug("Attempting to generate Receipt Number from ID Gen");

        if(applicationProperties.isReceiptNumberByService()){
            idName = idName + businessService.toLowerCase() + "." + applicationProperties.getReceiptNumberIdName();
        } else{
            idName = applicationProperties.getReceiptNumberIdName();
            format = applicationProperties.getReceiptNumberStateLevelFormat();
        }

        return getId(requestInfo, tenantId, idName, format, 1);
	}

    public String generateTransactionNumber(RequestInfo requestInfo, String tenantId) {
        log.debug("Attempting to generate Transaction Number from ID Gen");

        String splitTenant = tenantId.contains(".") ? tenantId.split("\\.")[1] : tenantId;
        String tenantFormat = COLL_TRANSACTION_FORMAT.replace("{tenant}", splitTenant);


        return getId(requestInfo, tenantId, COLL_TRANSACTION_ID_NAME, tenantFormat, 1);

    }

    private String getId(RequestInfo requestInfo, String tenantId, String name, String format, int count) {

        log.info("========== ID GENERATION START ==========");
        log.info("tenantId : {}", tenantId);
        log.info("name     : {}", name);
        log.info("format   : {}", format);
        log.info("count    : {}", count);

        List<IdRequest> reqList = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            IdRequest idRequest = new IdRequest(name, tenantId, format);
            reqList.add(idRequest);

            log.info("IdRequest [{}] : {}", i, idRequest);
        }

        IdGenerationRequest req = new IdGenerationRequest(requestInfo, reqList);

        log.info("IdGenerationRequest : {}", req);

        String uri = UriComponentsBuilder
                .fromHttpUrl(applicationProperties.getIdGenServiceHost())
                .path(applicationProperties.getIdGeneration())
                .build()
                .toUriString();

        log.info("IDGEN URI : {}", uri);

        try {
            log.info("Calling IDGEN service...");

            IdGenerationResponse idGenerationResponse = restTemplate.postForObject(
                    uri,
                    req,
                    IdGenerationResponse.class
            );

            log.info("IDGEN response : {}", idGenerationResponse);

            String generatedId = idGenerationResponse
                    .getIdResponses()
                    .get(0)
                    .getId();

            log.info("Generated ID : {}", generatedId);
            log.info("========== ID GENERATION SUCCESS ==========");

            return generatedId;

        } catch (HttpClientErrorException e) {
            log.error("========== IDGEN HTTP ERROR ==========");
            log.error("Status : {}", e.getStatusCode());
            log.error("Response body : {}", e.getResponseBodyAsString());
            log.error("Response headers : {}", e.getResponseHeaders(), e);

            throw new ServiceCallException(e.getResponseBodyAsString());

        } catch (Exception e) {
            log.error("========== IDGEN UNKNOWN ERROR ==========");
            log.error("Exception class : {}", e.getClass().getName());
            log.error("Exception message : {}", e.getMessage(), e);

            throw new org.egov.tracer.model.CustomException(
                    "IDGEN_SERVICE_ERROR",
                    "Failed to generate ID, unknown error occurred"
            );
        }
    }
}
