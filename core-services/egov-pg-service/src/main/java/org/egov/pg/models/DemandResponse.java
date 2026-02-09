package org.egov.pg.models;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.response.ResponseInfo;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandResponse {

	@JsonProperty("ResponseInfo")
	private ResponseInfo responseInfo;

	@JsonProperty("Demands")
	private List<Demand> demands = new ArrayList<>();

	@JsonProperty("CollectedReceipt")
	private List<CollectedReceipt> collectedReceipts;
	
	public DemandResponse(ResponseInfo responseInfo,List<Demand> demands){
		this.responseInfo=responseInfo;
		this.demands=demands;
	}
}
