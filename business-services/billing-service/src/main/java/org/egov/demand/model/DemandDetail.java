package org.egov.demand.model;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Builder.Default;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.validator.constraints.CustomSafeHtml;

/**
 * A object holds a demand and collection values for a tax head and period.
 */

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DemandDetail   {

        @CustomSafeHtml
        @JsonProperty("id")
        private String id;

        @CustomSafeHtml
        @JsonProperty("demandId")
        private String demandId;

        @CustomSafeHtml
        @NotNull @JsonProperty("taxHeadMasterCode")
        private String taxHeadMasterCode;

        @NotNull @JsonProperty("taxAmount")
        private BigDecimal taxAmount;

        @NotNull @JsonProperty("collectionAmount") @Default 
        private BigDecimal collectionAmount = BigDecimal.ZERO;

        @JsonProperty("additionalDetails")
        private Object additionalDetails;

        @JsonProperty("auditDetails")
        private AuditDetails auditDetails;

        @CustomSafeHtml
        @JsonProperty("tenantId")
        private String tenantId;
}
