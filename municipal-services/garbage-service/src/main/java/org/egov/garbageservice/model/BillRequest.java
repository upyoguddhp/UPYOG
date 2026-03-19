package org.egov.garbageservice.model;

import java.util.ArrayList;
import java.util.List;

import org.egov.common.contract.request.RequestInfo;
import org.egov.garbageservice.contract.bill.Bill;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.Builder.Default;

	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	@Builder
	public class BillRequest {

		@JsonProperty("RequestInfo")
		private RequestInfo requestInfo;

		@JsonProperty("Bills")
		@Default
		private List<Bill> bills = new ArrayList<>();
	}
