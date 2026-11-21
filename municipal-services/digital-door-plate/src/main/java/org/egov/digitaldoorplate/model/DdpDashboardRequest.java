package org.egov.digitaldoorplate.model;

import java.util.List;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filters for {@code /door-plate/dashboard/_search}. All filters are optional;
 * ULB-level users are always pinned to their own tenant server-side.
 */
@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class DdpDashboardRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private String tenantId;

	private String ward;

	/** epoch millis, inclusive; used by trend/turnaround/vendor sections */
	private Long fromDate;

	private Long toDate;

	/** optional subset of sections; defaults to the role's standard set */
	private List<String> sections;

	/** row limit for list sections (ulbProgress, rejections, wards, batches) */
	private Integer limit;
}
