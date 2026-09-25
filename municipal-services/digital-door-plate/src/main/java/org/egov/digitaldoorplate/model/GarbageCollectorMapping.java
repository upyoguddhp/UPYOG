package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GarbageCollectorMapping {

	private String uuid;

	private String tenantId;

	private String collectorUuid;

	private String contractorUuid;

	private String supervisorId;

	private String collectorUserUuid;

	private String wardNumber;

	private Integer noOfHouseAlloted;

	private Boolean isActive;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
