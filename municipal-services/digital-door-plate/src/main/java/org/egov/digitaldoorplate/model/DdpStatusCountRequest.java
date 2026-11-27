package org.egov.digitaldoorplate.model;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DdpStatusCountRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	/**
	 * Optional: when set, the dispatch-batch counts are restricted to
	 * eg_grbg_ddp_dispatch rows for this ULB.
	 */
	private String ulb;
}
