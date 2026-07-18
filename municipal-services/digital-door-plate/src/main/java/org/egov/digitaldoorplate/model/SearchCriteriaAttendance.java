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
public class SearchCriteriaAttendance {

	private List<String> uuid;

	private List<String> staffUuid;

	private String tenantId;

	private List<String> dutyStatus;

	private Long fromDate;

	private Long toDate;

	private Boolean isActive;

	private Long offset;

	private Long limit;
}
