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
public class Contractor {

	private String uuid;

	private String tenantId;

	private String type;

	private String organisationName;

	private String organisationContact;

	private String ulb;

	private List<String> ward;

	private String organisationAddress;

	private String organisationPincode;

	private String gender;

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
