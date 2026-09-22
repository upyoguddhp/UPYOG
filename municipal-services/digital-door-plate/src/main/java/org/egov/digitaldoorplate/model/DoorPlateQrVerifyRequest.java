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
public class DoorPlateQrVerifyRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private String tenantId;

	/**
	 * The JSON snapshot decoded from the scanned door plate QR code (see
	 * {@link DoorPlateQrSnapshot} for the expected fields), as a raw string.
	 */
	private String data;
}
