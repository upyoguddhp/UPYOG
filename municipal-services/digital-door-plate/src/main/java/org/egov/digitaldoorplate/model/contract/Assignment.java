package org.egov.digitaldoorplate.model.contract;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal mirror of egov-hrms's Assignment contract, carrying just the
 * fields required by its bean validation (designation, department, fromDate,
 * isCurrentAssignment are all {@code @NotNull} on the hrms side).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class Assignment {

	private String tenantid;

	private String department;

	private String designation;

	private Long fromDate;

	private Long toDate;

	@JsonProperty("isCurrentAssignment")
	private Boolean isCurrentAssignment;
}
