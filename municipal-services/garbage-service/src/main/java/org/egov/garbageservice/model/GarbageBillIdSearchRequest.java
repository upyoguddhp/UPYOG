package org.egov.garbageservice.model;

import javax.validation.constraints.NotNull;
import org.egov.common.contract.request.RequestInfo;
import java.util.List;
import lombok.Data;

@Data
public class GarbageBillIdSearchRequest {

	private String tenantId;
	private List<String> consumerCodes;
	private Boolean isActive;
	private Boolean isCancelled;
	private List<String> propertyIds;
	private RequestInfo RequestInfo;
}
