package org.egov.garbageservice.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Internal, uuid-keyed lookup of the garbage account behind a scanned plate:
 * joins eg_grbg_account + eg_grbg_address + eg_grbg_account_ddp to resolve
 * the ULB/ward, owner, property id and any dispatch batch the plate is
 * already attached to. Not exposed directly in any API response.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DispatchPlateLookup {

	private String garbageAccountUuid;

	private Long garbageId;

	private String tenantId;

	private String ownerName;

	private String propertyId;

	private String ulb;

	private String ward;

	/**
	 * batch_no already stamped on eg_grbg_account_ddp for this plate, if any
	 * (meaning it has already been scanned into a batch, open or submitted).
	 */
	private String existingBatchNo;

	private Boolean ddpDispatched;
}
