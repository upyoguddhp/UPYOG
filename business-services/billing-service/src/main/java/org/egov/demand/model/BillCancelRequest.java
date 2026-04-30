package org.egov.demand.model;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BillCancelRequest {

	@JsonProperty("tenantId")
	private String tenantId;

	@JsonProperty("consumerCode")
	private String consumerCode;

	@JsonProperty("bookingId")
	private String bookingId;

	@JsonProperty("reason")
	private String reason;

	@JsonProperty("requestInfo")
	private RequestInfo requestInfo;
}