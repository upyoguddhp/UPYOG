package org.egov.digitaldoorplate.model;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request shape for {@code DoorPlateController._updateDdpWorkflow}, the
 * single endpoint covering every DDP workflow role update (vendor print
 * verification, vendor printing-done, vendor dispatched, ULB verification,
 * installation). {@link #actorRole} (DDP_VENDOR or DDP_VERIFIER) determines
 * which of the fields below the caller may set; the server rejects a
 * request that sets a field outside its role. They're forwarded to
 * garbage-service's eg_grbg_account record identified by
 * {@link #garbageAccountUuid} (the "id" scanned from the door plate QR /
 * returned by {@code /door-plate/_verifyQr}).
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

	/** Mandatory: "DDP_VENDOR" or "DDP_VERIFIER". */
	private String actorRole;

	/**
	 * DDP_VENDOR only: "VERIFIED" or "REJECTED".
	 */
	private String vendorPrintVerified;

	/** DDP_VENDOR only. */
	private String ddpRejectionReason;

	/**
	 * Ignored as input - always derived server-side as true for any
	 * DDP_VERIFIER action, regardless of whether it approves or rejects.
	 */
	private Boolean ulbVerified;

	/**
	 * DDP_VERIFIER only, along with {@link #ddpLatitude}/{@link #ddpLongitude}.
	 */
	private Boolean installationDone;

	/** DDP_VERIFIER only. */
	private String ddpLatitude;

	/** DDP_VERIFIER only. */
	private String ddpLongitude;

	/**
	 * DDP_VENDOR only: physical plate has been printed.
	 */
	private Boolean ddpPrintingDone;

	/**
	 * DDP_VENDOR only: printed plate has been dispatched to the ULB/installer.
	 */
	private Boolean ddpDispatched;

	/** DDP_VERIFIER only. */
	private Boolean ddpPrintVerified;

	/** DDP_VENDOR only. Required for REJECTED: REPRINT or REVALIDATE. */
	private String ddpRejectionAction;

	/**
	 * DDP_VERIFIER's own verification outcome: "VERIFIED" or "REJECTED".
	 * Separate from {@link #vendorPrintVerified} so neither role's action
	 * clobbers the other's.
	 */
	private String ulbVerificationStatus;

	/** DDP_VERIFIER only. */
	private String ulbRejectionReason;

	/** DDP_VERIFIER only. Required for REJECTED: REPRINT or REVALIDATE. */
	private String ulbRejectionAction;
}
