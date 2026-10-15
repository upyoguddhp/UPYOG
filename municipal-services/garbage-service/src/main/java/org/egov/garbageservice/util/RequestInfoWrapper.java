package org.egov.garbageservice.util;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.egov.common.contract.request.RequestInfo;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
<<<<<<< HEAD
@Builder
public class RequestInfoWrapper {

	@JsonProperty("RequestInfo")
	private RequestInfo requestInfo;
=======
/**
 * Minimal JSON wrapper carrying RequestInfo for APIs that expect a single root property.
 * Used when calling billing, workflow, PDF, and scheduler endpoints from garbage-service.
 */
@Builder
public class RequestInfoWrapper {

    @JsonProperty("RequestInfo")
    private RequestInfo requestInfo;
>>>>>>> niua-upstream/niua-dev-2.0
}
