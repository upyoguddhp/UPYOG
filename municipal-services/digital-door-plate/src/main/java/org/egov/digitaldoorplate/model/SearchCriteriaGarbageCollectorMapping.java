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
public class SearchCriteriaGarbageCollectorMapping {

	private List<String> uuid;

	private String tenantId;

	private List<String> collectorUuid;

	private List<String> contractorUuid;

	private String supervisorId;

	private List<String> wardNumber;

	private Boolean isActive;

	private Integer limit;

	private Integer offset;
}
