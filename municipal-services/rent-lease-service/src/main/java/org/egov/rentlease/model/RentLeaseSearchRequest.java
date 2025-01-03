package org.egov.rentlease.model;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentLeaseSearchRequest {
	
	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
	
	@JsonProperty("searchRentLease")
	private SearchCriteria searchCriteria;
	

}
