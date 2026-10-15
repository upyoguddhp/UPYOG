package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class CollectorWardAssignment {

	private String uuid;

	private String tenantId;

	private String collectorUuid;

	private String collectorName;

	private String mobileNumber;

	private String contractorUuid;

	private String wardNumber;

	private String assignmentStatus;

	private Long assignedTime;

	private String assignedBy;

	private Long unassignedTime;

	private String unassignedBy;

	private Boolean isActive;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
