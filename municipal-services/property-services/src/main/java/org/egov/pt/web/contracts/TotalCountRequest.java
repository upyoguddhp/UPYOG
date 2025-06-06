package org.egov.pt.web.contracts;

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
public class TotalCountRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
	
	private String tenantId;

}
