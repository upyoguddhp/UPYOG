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
public class DecryptQrRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private String tenantId;

	/**
	 * The encrypted payload produced by {@code /qr/_generate} (the value
	 * encoded in the QR code, e.g. as read back by a scanner).
	 */
	private String encryptedData;
}
