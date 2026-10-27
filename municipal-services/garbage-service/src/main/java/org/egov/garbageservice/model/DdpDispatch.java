package org.egov.garbageservice.model;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Maps to eg_grbg_ddp_dispatch: one row per dispatch batch created by the
 * "Create Dispatch" flow. Plates are linked to a batch via
 * eg_grbg_account_ddp.batch_no, not a foreign key column here.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DdpDispatch {

	private String uuid;

	private String batchNo;

	private String ulb;

	private String ward;

	private Long dispatchDate;

	private String receivedBy;

	private Long ulbReceivingDate;

	private String status;

	private AuditDetails auditDetails;
}
