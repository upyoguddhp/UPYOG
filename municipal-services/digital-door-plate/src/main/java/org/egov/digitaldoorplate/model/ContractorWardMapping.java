package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class ContractorWardMapping {

	private String uuid;

	private String tenantId;

	private String contractorUuid;

	private String contractorUserUuid;

	private String ulb;

	private String wardNumber;

	private Boolean isActive;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
