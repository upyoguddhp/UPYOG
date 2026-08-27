package org.egov.digitaldoorplate.model;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Shared request shape for the three role-specific DDP workflow endpoints on
 * {@code DoorPlateController} (vendor print verification, ULB verification,
 * installation); each endpoint only reads the field(s) relevant to its own
 * role and forwards them to garbage-service's eg_grbg_account record
 * identified by {@link #garbageAccountUuid} (the "id" scanned from the door
 * plate QR / returned by {@code /door-plate/_verifyQr}).
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DoorPlateDdpWorkflowRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private String tenantId;

	private String garbageAccountUuid;

	/**
	 * Used only by {@code /door-plate/_vendorPrintVerify}: "VERIFIED" or
	 * "REJECTED".
	 */
	private String vendorPrintVerified;

	/**
	 * Used only by {@code /door-plate/_ulbVerify}.
	 */
	private Boolean ulbVerified;

	/**
	 * Used only by {@code /door-plate/_installationDone}, along with
	 * {@link #ddpLatitude}/{@link #ddpLongitude}.
	 */
	private Boolean installationDone;

	private String ddpLatitude;

	private String ddpLongitude;
}
