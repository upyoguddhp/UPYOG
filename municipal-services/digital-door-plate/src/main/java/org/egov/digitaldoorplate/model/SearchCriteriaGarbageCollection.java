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
public class SearchCriteriaGarbageCollection {

	private List<String> uuid;

	private List<String> attendanceUuid;

	private List<String> staffUuid;

	private List<String> garbageAccountUuid;

	private List<String> subAccountUuid;

	private List<String> applicationNo;

	private List<String> propertyId;

	private List<String> wasteType;

	private List<String> clientRefId;

	private String tenantId;

	private Boolean isCollected;

	private Long fromDate;

	private Long toDate;

	private Boolean isActive;

	private Long offset;

	private Long limit;
}
