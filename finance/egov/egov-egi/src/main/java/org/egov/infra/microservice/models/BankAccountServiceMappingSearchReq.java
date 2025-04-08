package org.egov.infra.microservice.models;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BankAccountServiceMappingSearchReq {

    private List<String> businessDetails;

    private String bankAccount;

    private String tenantId;

}
