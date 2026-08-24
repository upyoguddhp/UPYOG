package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GarbageSupervisor {

	private String uuid;

	private String tenantId;

	private String supervisorName;

	private String supervisorCode;

	private String mobileNumber;

	private String emailId;

	private String gender;

	private Long joiningDate;

	private String address;

	private String ulb;

	private Boolean isActive;

	/**
	 * Mapping input, supplied only at onboarding to create the supervisor's
	 * contractor/ward mapping. Not persisted on this entity.
	 */
	private String contractorUuid;

	private String wardNumber;

	/**
	 * Optional date of birth, used only to satisfy egov-hrms's mandatory
	 * user.dob when creating the supervisor's login. Not persisted on this
	 * entity; falls back to a placeholder if omitted.
	 */
	private Long dob;

	/**
	 * Populated by {@code GarbageSupervisorService.create()} once the egov-user
	 * login and the mapping row have been created.
	 */
	private String supervisorUserUuid;

	private String mappingUuid;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
