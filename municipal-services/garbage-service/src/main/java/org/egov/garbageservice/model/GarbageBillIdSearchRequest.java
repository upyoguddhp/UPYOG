package org.egov.garbageservice.model;

import javax.validation.constraints.NotNull;
import java.util.List;
import lombok.Data;

@Data
public class GarbageBillIdSearchRequest {

	private String tenantId;
	private List<String> consumerCodes;
	private Boolean isActive;
	private Boolean isCancelled;
}
