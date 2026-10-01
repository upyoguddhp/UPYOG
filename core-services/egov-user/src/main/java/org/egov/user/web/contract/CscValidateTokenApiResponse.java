package org.egov.user.web.contract;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CscValidateTokenApiResponse {

    @JsonProperty("User")
    private CscValidateTokenResponse user;

    private String error;

    private Integer code;
}
