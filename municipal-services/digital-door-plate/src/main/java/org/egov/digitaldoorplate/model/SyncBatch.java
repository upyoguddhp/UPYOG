package org.egov.digitaldoorplate.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class SyncBatch {

	private String uuid;

	private String tenantId;

	private String staffUuid;

	private Integer totalRecords;

	private Integer createdRecords;

	private Integer duplicateRecords;

	private Integer failedRecords;

	private Long syncTime;

	private String createdBy;

	private Long createdDate;
}
