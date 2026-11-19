package org.egov.digitaldoorplate.model;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Counts of eg_grbg_account_ddp rows per DDP workflow status.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DdpStatusCountResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	/** is_ready_for_printing = true */
	private Long isReadyForPrinting;

	/** ddp_print_verified = true */
	private Long ddpPrintVerified;

	/** ddp_dispatched = true */
	private Long ddpDispatched;

	/** vendor_print_verified = 'REJECTED' */
	private Long vendorPrintVerifiedRejected;

	/** installation_done = true */
	private Long installationDone;
}
