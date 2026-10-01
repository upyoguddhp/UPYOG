package org.egov.digitaldoorplate.model;

import java.util.List;

import org.egov.common.contract.request.RequestInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
public class GarbageCollectionRequest {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;

	private List<GarbageCollection> garbageCollections;
}
