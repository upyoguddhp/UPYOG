package org.egov.web.contract;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GetUserTokenRequest {

    @NotBlank
    private String uuid;
}
