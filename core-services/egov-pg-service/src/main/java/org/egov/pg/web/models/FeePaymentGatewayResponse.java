package org.egov.pg.web.models;

import java.util.List;

import javax.validation.constraints.NotNull;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FeePaymentGatewayResponse {

    @JsonProperty("status")
    private String status;

    @NotNull
    @JsonProperty("parameters")
    private List<String> parameters;
}
