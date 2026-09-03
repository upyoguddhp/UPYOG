package org.egov.digitaldoorplate.model;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GarbageCollector {

	private String uuid;

	private String tenantId;

	private String collectorName;

	private String collectorCode;

	private String mobileNumber;

	private String emailId;

	private String gender;

	private Long joiningDate;

	private String address;

	private String ulb;

	private Boolean isActive;

	/**
	 * Mapping input, supplied only at onboarding to create the collector's
	 * contractor/supervisor/ward mapping. Not persisted on this entity.
	 */
	private String contractorUuid;

	private String supervisorId;

	private List<String> wardNumber;

	private Integer noOfHouseAlloted;

	/**
	 * Optional date of birth, used only to satisfy egov-hrms's mandatory
	 * user.dob when creating the collector's login. Not persisted on this
	 * entity; falls back to a placeholder if omitted.
	 */
	private Long dob;

	/**
	 * Populated by {@code GarbageCollectorService.create()} once the egov-user
	 * login and the mapping row(s) have been created.
	 */
	private String collectorUserUuid;

	private List<String> mappingUuids;

	/**
	 * Populated only on search (not persisted): count of active, completed
	 * garbage collections logged today under this collector's own egov-user
	 * login (collectorUserUuid).
	 */
	private Integer collectedToday;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
