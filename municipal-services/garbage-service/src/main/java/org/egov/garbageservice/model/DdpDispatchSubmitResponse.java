package org.egov.garbageservice.model;

import java.util.List;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DdpDispatchSubmitResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	@JsonProperty("batch_no")
	private String batchNo;

	private String status;

	private Long dispatchDate;

	private String ulb;

	private Integer totalScanCount;

	private List<ScannedPlateInfo> scannedPlates;
}
