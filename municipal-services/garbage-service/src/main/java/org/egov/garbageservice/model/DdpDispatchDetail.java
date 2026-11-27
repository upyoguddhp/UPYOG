package org.egov.garbageservice.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One dispatch batch's full detail, as returned by the dispatch search API.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DdpDispatchDetail {

	@JsonProperty("batch_no")
	private String batchNo;

	private String ulb;

	private String ward;

	private Long dispatchDate;

	private String receivedBy;

	private Long ulbReceivingDate;

	private String status;

	private Integer totalScanCount;

	private List<ScannedPlateInfo> scannedPlates;

	private AuditDetails auditDetails;
}
