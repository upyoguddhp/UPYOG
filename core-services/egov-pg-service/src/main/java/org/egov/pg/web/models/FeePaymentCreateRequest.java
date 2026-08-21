package org.egov.pg.web.models;

import java.math.BigDecimal;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeePaymentCreateRequest {

    @NotBlank
    @JsonProperty("module")
    private String module;

    @NotBlank
    @JsonProperty("consumerCode")
    private String consumerCode;
    
    @NotBlank
    @JsonProperty("serviceUuid")
    private String serviceUuid;

    @NotNull
    @Positive
    @JsonProperty("amount")
    private BigDecimal amount;

    @NotBlank
    @JsonProperty("tenant_id")
    @JsonAlias("tenantId")
    private String tenantId;
}
