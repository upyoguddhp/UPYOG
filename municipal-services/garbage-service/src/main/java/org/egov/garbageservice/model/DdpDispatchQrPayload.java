package org.egov.garbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Plain (unencrypted) JSON content embedded in a dispatch batch's QR code -
 * readable by any generic QR scanner, not just this service's own APIs.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DdpDispatchQrPayload {

	private String batchNo;

	private String ulb;

	private Integer totalScannedPlates;
}
