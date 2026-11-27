package org.egov.garbageservice.model;

import java.util.Set;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class SearchCriteriaDdpDispatch {

	/**
	 * "batch_no" to match the batch_no key used everywhere else in this
	 * feature (DdpDispatchSubmitRequest, DdpDispatchDetail's own response
	 * field, etc); "batchNo" kept as an alias so any existing caller using
	 * the old camelCase key still works.
	 */
	@JsonProperty("batch_no")
	@JsonAlias("batchNo")
	private Set<String> batchNo;

	private Set<String> ulb;

	private Set<String> ward;

	private Set<String> status;

	private Long dispatchDateFrom;

	private Long dispatchDateTo;

	@Builder.Default
	private Long offset = 0L;

	@Builder.Default
	private Long limit = 25L;
}
