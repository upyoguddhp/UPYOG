package org.egov.garbageservice.model;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.List;
import lombok.Data;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class GarbageBillIdResponse {

	
	private List<String> billIds;
}
