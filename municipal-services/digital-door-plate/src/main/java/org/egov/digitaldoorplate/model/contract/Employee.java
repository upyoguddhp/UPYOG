package org.egov.digitaldoorplate.model.contract;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal mirror of egov-hrms's Employee contract, carrying just the fields
 * this service needs to onboard a contractor/collector/supervisor login
 * through {@code /egov-hrms/employees/_create}.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
@AllArgsConstructor
@Data
@Builder
@NoArgsConstructor
public class Employee {

	private String uuid;

	private String employeeStatus;

	private String employeeType;

	private Long dateOfAppointment;

	private List<Assignment> assignments;

	@JsonProperty("IsActive")
	private Boolean isActive;

	private String tenantId;

	private User user;

	private Object additionalDetail;
}
