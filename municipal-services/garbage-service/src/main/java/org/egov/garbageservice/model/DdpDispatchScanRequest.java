package org.egov.garbageservice.model;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One plate scan during dispatch batch creation. batchNo is left empty for
 * the first scan of a new batch; every subsequent scan passes back the
 * batchNo returned by the previous scan so it's added to the same batch.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DdpDispatchScanRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private String tenantId;

	private String batchNo;

	/**
	 * The garbage account uuid resolved from the scanned plate's QR code
	 * (i.e. the "id" field of the decrypted QR payload, already resolved by
	 * the caller before reaching this API).
	 */
	private String scannedPlateUuid;
}
