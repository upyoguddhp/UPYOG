package org.egov.pt.models.data;

import java.math.BigDecimal;

public class TaxMetrics {

    private BigDecimal propertyTax;
    private BigDecimal cess;
    private BigDecimal penalty;
    private BigDecimal interest;
    private BigDecimal rebate;

    public BigDecimal getPropertyTax() { return propertyTax; }
    public void setPropertyTax(BigDecimal propertyTax) { this.propertyTax = propertyTax; }

    public BigDecimal getCess() { return cess; }
    public void setCess(BigDecimal cess) { this.cess = cess; }

    public BigDecimal getPenalty() { return penalty; }
    public void setPenalty(BigDecimal penalty) { this.penalty = penalty; }

    public BigDecimal getInterest() { return interest; }
    public void setInterest(BigDecimal interest) { this.interest = interest; }

    public BigDecimal getRebate() { return rebate; }
    public void setRebate(BigDecimal rebate) { this.rebate = rebate; }
}