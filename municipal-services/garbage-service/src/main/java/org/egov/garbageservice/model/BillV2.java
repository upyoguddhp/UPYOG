package org.egov.garbageservice.model;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillV2 {

    private String id;               
    private String tenantId;
    private String consumerCode;
    private String payerName;
    private String payerAddress;
    private String payerEmail;
    private String mobileNumber;
    private String userId;
    private String fileStoreId;
    private String status;
    private AuditDetails auditDetails;
    private JsonNode additionalDetails;
}
