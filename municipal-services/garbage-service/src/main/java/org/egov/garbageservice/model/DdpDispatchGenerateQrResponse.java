package org.egov.garbageservice.model;

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
public class DdpDispatchGenerateQrResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	@JsonProperty("batch_no")
	private String batchNo;

	private String ulb;

	private String status;

	private Integer totalScannedPlates;

	/**
	 * QR code image as a base64 PNG data URI (ready for an &lt;img src="..."&gt;).
	 * Plain/unencrypted - the QR itself encodes a JSON object with batchNo,
	 * ulb and totalScannedPlates, so any generic QR scanner app can read it
	 * directly; the scanning app pulls batchNo out of that JSON and passes
	 * it to /ddp-dispatch/_receive to confirm receipt.
	 */
	private String qrCodeImage;
}
