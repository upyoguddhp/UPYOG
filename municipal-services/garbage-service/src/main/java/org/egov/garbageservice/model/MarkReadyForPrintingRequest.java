package org.egov.garbageservice.model;

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
public class MarkReadyForPrintingRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	/**
	 * State-level tenantId (e.g. "hp"), used both to fetch the ULB/ward list
	 * from the ULBS.DdpPrinting MDMS master and to scope the eg_grbg_account
	 * search per ULB (as "{tenantId}.{ulbName}").
	 */
	private String tenantId;

	@Builder.Default
	private Integer batchSize = 500;
}
