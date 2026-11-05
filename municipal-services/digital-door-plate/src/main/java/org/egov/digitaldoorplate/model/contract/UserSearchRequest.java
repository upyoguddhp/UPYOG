package org.egov.digitaldoorplate.model.contract;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserSearchRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	@JsonProperty("mobileNumber")
	private String mobileNumber;

	@JsonProperty("userType")
	private String userType;

	@JsonProperty("tenantId")
	private String tenantId;

	@JsonProperty("active")
	private Boolean active;
}
