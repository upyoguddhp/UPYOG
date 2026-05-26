package org.egov.pt.models.data;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class TaxMetricsDTO {

    private String usageCategory;

    private BigDecimal propertyTax = BigDecimal.ZERO;

    private BigDecimal cess = BigDecimal.ZERO;

    private BigDecimal penalty = BigDecimal.ZERO;

    private BigDecimal interest = BigDecimal.ZERO;

    private BigDecimal rebate = BigDecimal.ZERO;
}