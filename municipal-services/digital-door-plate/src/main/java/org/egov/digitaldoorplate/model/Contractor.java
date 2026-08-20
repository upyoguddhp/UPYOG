package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class Contractor {

	private String uuid;

	private String tenantId;

	private String type;

	private String organisationName;

	private String organisationContact;

	private String district;

	private String ulb;

	private String ward;

	private String organisationAddress;

	private String organisationPincode;

	private Integer manPower;

	private Long startDate;

	private Long endDate;

	private ContractorDetails contractorDetails;

	private Object additionalDetails;

	private String status;

	private Boolean isActive;

	private String createdBy;

	private Long createdDate;

	private String lastModifiedBy;

	private Long lastModifiedDate;
}
