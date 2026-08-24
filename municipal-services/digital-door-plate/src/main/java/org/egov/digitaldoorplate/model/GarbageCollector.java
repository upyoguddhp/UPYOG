package org.egov.digitaldoorplate.model;

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

	private String wardNumber;

	private Integer noOfHouseAlloted;

	/**
	 * Populated by {@code GarbageCollectorService.create()} once the egov-user
	 * login and the mapping row have been created.
	 */
	private String collectorUserUuid;

	private String mappingUuid;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
