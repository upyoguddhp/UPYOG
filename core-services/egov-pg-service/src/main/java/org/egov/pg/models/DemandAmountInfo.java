package org.egov.pg.models;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class DemandAmountInfo {
    private BigDecimal taxAmount;
    private BigDecimal collectionAmount;
}
