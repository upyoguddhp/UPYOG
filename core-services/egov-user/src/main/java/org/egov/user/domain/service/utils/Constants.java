package org.egov.user.domain.service.utils;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.Data;

@Data
@Component
public class Constants {

    // Was hardcoded in source; externalized to config (see egov.sso.hp.secret.key /
    // egov.sso.hp.service.id in application.properties / .upyog-env).
    @Value("${egov.sso.hp.secret.key}")
    private String secretKey;

    @Value("${egov.sso.hp.service.id}")
    private String serviceId;

    public static final String CITIZEN_ROLE = "CITIZEN";

    public static final String CITIZEN_PASSWORD = "P@ssw0rd";

    @Value(("${state.level.tenant.id}"))
    private String stateLevelTenantId;

    @Value(("${egov.sso.hp.host}"))
    private String ssoHpHost;

    @Value(("${egov.sso.hp.validate.token.endpoint}"))
    private String ssoHpEndpoint;

}
