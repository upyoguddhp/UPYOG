package org.egov.garbageservice.model;

import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class SearchCriteriaDdpDispatch {

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
