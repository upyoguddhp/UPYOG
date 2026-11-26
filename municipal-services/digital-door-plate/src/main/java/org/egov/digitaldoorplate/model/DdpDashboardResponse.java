package org.egov.digitaldoorplate.model;

import java.util.List;
import java.util.Map;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DdpDashboardResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	/** VENDOR, ULB or STATE */
	private String role;

	/** effective tenant scope (null = all tenants) */
	private String tenantId;

	private Long generatedAt;

	private Long total;

	/** one entry per lifecycle stage card: stage, count, percent, overdue, slaHours, breakdown */
	private List<Map<String, Object>> stages;

	/** stage SLA configuration (from eg_grbg_ddp_stage_sla) */
	private List<Map<String, Object>> sla;

	/** dashboard settings (targets, thresholds) from eg_grbg_ddp_dashboard_config */
	private Map<String, String> config;

	/** role specific panels keyed by section name */
	private Map<String, Object> sections;
}
