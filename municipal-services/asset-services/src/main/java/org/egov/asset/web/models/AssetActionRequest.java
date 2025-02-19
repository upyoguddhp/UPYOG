package org.egov.asset.web.models;

import java.util.List;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AssetActionRequest {
	
	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
	
	private List<String> applicationNumbers;
	
	private String businessService;
	
	private String tenantId;
	private Boolean isHistoryCall = false;

}
