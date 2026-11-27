package org.egov.garbageservice.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One door plate rejected at the vendor print-verification stage, the
 * ULB verification stage, or both; see {@link #rejectedBy}.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RejectedPlateRecord {

	private String id;

	private String garbageId;

	private String ownerName;

	private String mobileNo;

	private String propertyId;

	private String ulb;

	private String ward;

	/**
	 * "VENDOR", "ULB", or "BOTH" - which stage(s) rejected this plate, so
	 * callers can segregate/filter without inspecting the individual
	 * verification statuses below.
	 */
	private String rejectedBy;

	private String vendorPrintVerified;

	private String vendorRejectionReason;

	private String vendorRejectionAction;

	private String ulbVerificationStatus;

	private String ulbRejectionReason;

	private String ulbRejectionAction;
}
