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
public class SearchCriteriaContractor {

	private List<String> uuid;

	private String tenantId;

	private List<String> type;

	private String organisationName;

	private String mobileNumber;

	private String ulb;

	private String organisationContact;

	private List<String> status;

	private Boolean isActive;

	private Integer limit;

	private Integer offset;
	
	private List<String> ward;
}
