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
public class SearchCriteriaDoorPlate {

	private List<String> uuid;

	private List<String> garbageAccountUuid;

	private List<String> applicationNo;

	private List<String> propertyId;

	private List<String> wardNumber;

	private List<String> plateStatus;

	private String tenantId;

	private Boolean isQrGenerated;

	private Boolean isPrintVerified;

	private Boolean isInstalled;

	private Boolean isActive;

	private Long offset;

	private Long limit;
}
