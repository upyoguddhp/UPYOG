package org.egov.web.contract;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GetUserTokenResponse {
    private String accessToken;
}
