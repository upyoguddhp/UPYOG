package org.egov.advertisementcanopy.model;

import java.util.List;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteSearchResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	@JsonProperty("siteSearchResponseData")
	private List<SiteCreationData> siteCreationData;
	
	@JsonProperty("initiate")
	private Integer initiate;
	
	
	@JsonProperty("pendingForModification")
	private Integer pendingForModification;
	
	@JsonProperty("approve")
	private Integer approve;
	
	@JsonProperty("reject")
	private Integer reject;
	
	@JsonProperty("returnToInitiator")
	private Integer returnToInitiator;
	
	@JsonProperty("Count")
    private int count;
    
}
