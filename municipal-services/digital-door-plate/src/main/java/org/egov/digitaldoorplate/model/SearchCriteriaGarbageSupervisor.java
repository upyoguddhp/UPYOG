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
public class SearchCriteriaGarbageSupervisor {

	private List<String> uuid;

	private String tenantId;

	private List<String> supervisorCode;

	private List<String> mobileNumber;

	private String ulb;

	private Boolean isActive;

	private Integer limit;

	private Integer offset;
	
	private List<String> wardNumber;
}
