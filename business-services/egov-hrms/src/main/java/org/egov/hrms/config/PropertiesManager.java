/*
 * eGov suite of products aim to improve the internal efficiency,transparency,
 * accountability and the service delivery of the government organizations.
 *
 * Copyright (C) 2016 eGovernments Foundation
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 */

package org.egov.hrms.config;

import lombok.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class PropertiesManager {

    // Hosts and Endpoints
    @Value("${egov.mdms.host}")
    public String mdmsHost;

    @Value("${egov.mdms.search.endpoint}")
    public String mdmsSearchEndpoint;

    @Value("${egov.user.host}")
    public String userHost;

    @Value("${egov.user.search.endpoint}")
    public String userSearchEndpoint;

    @Value("${egov.user.create.endpoint}")
    public String userCreateEndpoint;

    @Value("${egov.user.update.endpoint}")
    public String userUpdateEndpoint;

    @Value("${egov.localization.host}")
    public String localizationHost;

    @Value("${egov.localization.search.endpoint}")
    public String localizationSearchEndpoint;

    @Value("${egov.idgen.host}")
    public String idGenHost;

    @Value("${egov.idgen.path}")
    public String idGenEndpoint;

    // Kafka Topics
    @Value("${kafka.topics.save.service}")
    public String saveEmployeeTopic;

    @Value("${kafka.topics.update.service}")
    public String UpdateEmployeeTopic;

    @Value("${kafka.topics.notification.sms}")
    public String coreNotificationTopic;

    @Value("${kafka.topics.hrms.updateData}")
    public String updateTopic;

    // Variables
    @Value("${egov.idgen.ack.name}")
    public String hrmsIdGenKey;

    @Value("${egov.idgen.ack.format}")
    public String hrmsIdGenFormat;

    @Value("${open.search.enabled.roles}")
    public String openSearchEnabledRoles;

    @Value("${state.level.tenant.id}")
    public String stateLevelTenantId;

    @Value("${parent.level.tenant.id}")
    private String parentLevelTenantId;

    @Value("${decryption.abac.enable}")
    private Boolean isDecryptionEnable;

    // Workflow properties
    @Value("${egov.wf.host}")
    private String wfHost;

    @Value("${egov.wf.transition}")
    private String wfTransition;

    // Individual service properties
    @Value("${egov.individual.host}")
    private String individualHost;

    @Value("${egov.individual.create.endpoint}")
    private String individualCreateEndpoint;

    @Value("${egov.individual.update.endpoint}")
    private String individualUpdateEndpoint;

    @Value("${egov.individual.delete.endpoint}")
    private String individualDeleteEndpoint;

    @Value("${egov.individual.search.endpoint}")
    private String individualSearchEndpoint;

    @Value("${egov.hrms.auto.generate.password}")
    private boolean autoGeneratePassword;
}