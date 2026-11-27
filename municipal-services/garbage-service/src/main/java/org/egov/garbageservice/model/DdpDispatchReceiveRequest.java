package org.egov.garbageservice.model;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Submitted by the ULB side after scanning + decrypting the dispatch QR
 * code, to confirm the batch was received.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DdpDispatchReceiveRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private String tenantId;

	@JsonProperty("batch_no")
	private String batchNo;

	/**
	 * Name/identifier of the person at the ULB who received the batch.
	 */
	private String receivedBy;

	/**
	 * Number of plates actually counted by the ULB at receipt time.
	 */
	private Integer receivedCount;

	/**
	 * Any remarks from the ULB staff receiving the batch, e.g. noting a
	 * count mismatch or damaged plates.
	 */
	private String receivingRemarks;
}
