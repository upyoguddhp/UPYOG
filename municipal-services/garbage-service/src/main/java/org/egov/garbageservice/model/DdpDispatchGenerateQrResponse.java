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

	/**
	 * QR code image as a base64 PNG data URI (ready for an &lt;img src="..."&gt;),
	 * as returned by digital-door-plate's /qr/_generate. The QR encodes just
	 * the batch_no; scanning + decrypting it (also via digital-door-plate)
	 * gives back the batch_no, which the scanning app then looks up via
	 * /ddp-dispatch/_search for the ULB/dispatch date/etc. before confirming
	 * receipt via /ddp-dispatch/_receive.
	 */
	private String qrCodeImage;

	private String encryptedData;
}
