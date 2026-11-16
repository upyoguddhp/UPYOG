package org.egov.pt.models;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDetailUpdateRequest {

	@JsonProperty("PaymentMode")
	private String paymentMode;

	 private List<String> billIds;
}
