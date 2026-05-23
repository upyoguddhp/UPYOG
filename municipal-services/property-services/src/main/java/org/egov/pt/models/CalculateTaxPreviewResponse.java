package org.egov.pt.models;
import java.math.BigDecimal;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateTaxPreviewResponse {

    private String propertyId;
    private String tenantId;
    private String oldPropertyId;
    private Object address;  
    private BigDecimal totalAnnualTax;
    private BigDecimal propertyTaxWithoutRebate;
    private BigDecimal rebateAmount;
    private BigDecimal days;

    private JsonNode calculationDetails;
}
