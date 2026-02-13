package org.upyog.chb.web.models.billing;


import java.util.Set;

import javax.validation.constraints.NotNull;

import org.upyog.chb.web.models.collection.Bill.StatusEnum;

import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBillCriteria {

    @NotNull
    private String tenantId;

    @NotNull
    private Set<String> consumerCodes;

    @NotNull
    private String businessService;

    @NotNull
    private JsonNode additionalDetails;

    private Set<String> billIds;

    @NotNull
    private StatusEnum statusToBeUpdated;
}

