package org.egov.garbageservice.model;

import com.fasterxml.jackson.databind.JsonNode;
import org.egov.garbageservice.contract.bill.BillDetail;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import java.util.List;

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
    private List<BillDetail> billDetails;
    private Long expiryDate;
}
