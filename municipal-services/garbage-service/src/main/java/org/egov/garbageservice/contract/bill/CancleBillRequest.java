package org.egov.garbageservice.contract.bill;

import java.util.List;
import java.util.Set;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.egov.common.contract.request.RequestInfo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancleBillRequest {

	@NotNull
	private RequestInfo requestInfo;
	
	@NotNull
	@Valid
	private Set<String> consumerCode;
	
	@NotNull
	@Valid
	private Set<String> demandId;

	@NotNull
	@Valid
	private String tenantId;
	
	@NotNull
	@Valid
	private String reason;
}
