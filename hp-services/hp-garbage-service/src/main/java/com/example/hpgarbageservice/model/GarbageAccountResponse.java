package com.example.hpgarbageservice.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GarbageAccountResponse {

	private List<GarbageAccount> garbageAccounts;
	
    @JsonProperty("applicationInitiated")
    private Integer applicationInitiated;
    
    @JsonProperty("applicationApplied")
    private Integer applicationApplied;
    
    @JsonProperty("applicationPendingForPayment")
    private Integer applicationPendingForPayment;
    
    @JsonProperty("applicationRejected")
    private Integer applicationRejected;
    
    @JsonProperty("applicationApproved")
    private Integer applicationApproved;
}
