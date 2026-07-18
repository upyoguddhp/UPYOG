package org.egov.digitaldoorplate.model;

import java.util.List;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GarbageCollectionSyncResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	private String syncBatchUuid;

	private Integer totalRecords;

	private Integer createdRecords;

	private Integer duplicateRecords;

	private Integer failedRecords;

	private List<SyncRecordResult> recordResults;
}
