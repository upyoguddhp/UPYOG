package org.egov.pg.web.models;

import java.util.List;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

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
public class FeePaymentStatusUpdateRequest {


    @NotBlank
    @JsonProperty("status")
    @JsonAlias("txnStatus")
    private String txnStatus;

    @NotNull
    @JsonProperty("parameters")
    private List<String> parameters;
}
