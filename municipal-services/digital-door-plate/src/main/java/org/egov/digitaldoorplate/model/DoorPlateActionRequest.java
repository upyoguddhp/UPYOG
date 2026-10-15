package org.egov.digitaldoorplate.model;

import java.math.BigDecimal;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request for the print verification and installation actions performed by the
 * ULB official after scanning the printed QR code. Either scannedData
 * (encrypted QR payload) or garbageAccountUuid must be provided.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DoorPlateActionRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private String tenantId;

	private String scannedData;

	private String garbageAccountUuid;

	private BigDecimal latitude;

	private BigDecimal longitude;

	private String remarks;
}
