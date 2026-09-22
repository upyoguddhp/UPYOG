package org.egov.garbageservice.model;

import java.math.BigDecimal;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GenerateBillPreviewResponse {

    private String applicationNo;

    private String tenantId;

    private String ownerName;

    private String mobileNumber;

    private BigDecimal monthlyAmount;

    private Integer monthCount;

    private BigDecimal garbageBillWithoutRebate;

    private BigDecimal rebatePercentage;

    private BigDecimal rebateAmount;

    private BigDecimal finalBillAmount;

    private Object calculationDetails;

    private Object address;
}
